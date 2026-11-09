#!/usr/bin/env bash
# REPORT only: no automatic PASS/FAIL threshold or gate closure.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
umask 077
[[ ! -L "$LP_DIR" ]] || { echo 'REPORT unavailable: output directory symlink refused' >&2; exit 1; }
mkdir -p -- "$LP_DIR"; chmod 700 -- "$LP_DIR"
python3 - "$LP_DIR" "$LP_ROOT/SPEC.json" <<'PY'
import json
import os
import sys
from datetime import datetime,timezone
out, specpath=sys.argv[1:]
with open(specpath,encoding='utf8') as f: spec=json.load(f)
reference={m.get('nombre'):m.get('valor') for m in spec.get('rendimiento',{}).get('metricas',[])}
names=[('IDLE','01-idle.json'),('STARTUP','02-startup.json'),
       ('SINGLE_CHAT','03-chat.json'),('STREAMING','04-streaming.json')]
results=[]
for name,filename in names:
    path=os.path.join(out,filename)
    try:
        with open(path,encoding='utf8') as f:d=json.load(f)
        if d.get('schema')!='libre-chat-vx.low-power-sample.v1':raise ValueError('not a measurement')
        results.append((name,d))
    except FileNotFoundError:
        results.append((name,None))
    except (ValueError,json.JSONDecodeError) as e:
        raise SystemExit('Invalid measurement data for '+name+': '+str(e))
rows=['# LibreChat VX — low-power host benchmark (GATE_HUMAN)','',
'Generated (UTC): '+datetime.now(timezone.utc).isoformat(),
'State: MEASUREMENTS ONLY; human decision required; NO LIVE gate closed.',
'',
'| Scenario | CPU peak (%) | RAM peak (MiB) | Disk used peak (%) | RX bytes | TX bytes | Latency (ms) |',
'|---|---:|---:|---:|---:|---:|---:|']
def fmt(v): return 'N/A' if v is None else str(v)
for name,d in results:
    if d is None: rows.append('| '+name+' | NO_DATA | NO_DATA | NO_DATA | NO_DATA | NO_DATA | NO_DATA |');continue
    rows.append('| '+name+' | '+' | '.join([
       fmt(d.get('cpu_host_pct',{}).get('max')),
       fmt(d.get('ram_used_mib',{}).get('max')),
       fmt(d.get('disk_used_pct',{}).get('max')),
       fmt(d.get('network_rx_bytes_delta')),fmt(d.get('network_tx_bytes_delta')),
       fmt(d.get('latency_ms'))])+' |')
rows+=['','## SPEC.json#/rendimiento — expected metrics','',
'| Name | Expected value |','|---|---|']
for key,val in reference.items():rows.append('| '+str(key)+' | '+fmt(val)+' |')
rows+=['','Missing reference values remain null/N/A, not inferred.','',
'## Coverage and interpretation','',
'- Each metrics JSON includes average/minimum/maximum for CPU, RAM and disk occupancy.',
'- Streaming first-byte latency is not token TTFT; ttft_ms remains null.',
'- Only an isolated test endpoint may receive synthetic prompts in scenarios 03 and 04.',
'- Human operator must review thermal limits, service stability, power use and tolerable latency.',
'- No automatic performance verdict. No gate status update.','']
md=os.path.join(out,'report.md')
tmp=md+'.tmp'
with open(tmp,'w',encoding='utf8') as f:f.write('\n'.join(rows))
os.chmod(tmp,0o600);os.replace(tmp,md)
combined={'schema':'libre-chat-vx.low-power-proof.v1','observed_at_utc':datetime.now(timezone.utc).isoformat(),
'gate_id':'LC-LOW-POWER-MEASURE','gate_type':'GATE_HUMAN',
'measurement_files':{name:d for name,d in results},'spec_expected_values':reference,
'human_decision':None,'gate_closed':False,'report':'report.md'}
tmp=os.path.join(out,'low-power-proof.json.tmp')
with open(tmp,'w',encoding='utf8') as f:json.dump(combined,f,indent=2);f.write('\n')
os.chmod(tmp,0o600);os.replace(tmp,os.path.join(out,'low-power-proof.json'))
PY
echo 'REPORT generated: report.md + low-power-proof.json; no PASS/FAIL or human decision inferred'
