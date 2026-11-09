#!/usr/bin/env bash
# Read-only host metrics; only the explicitly authorized startup script changes service state.
set -euo pipefail
LP_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LP_ROOT="$(cd -- "$LP_HOME/../.." && pwd)"
LP_DIR="${LOWPOWER_OUTPUT_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-low-power-$(id -u)}"
LP_STATUS="PASS"
LP_REASON=""
lp_finish() {
  local rc="$1"
  if ((rc!=0)); then printf 'FAIL %s (exit=%s)%s\n' "$LP_STEP" "$rc" "${LP_REASON:+: $LP_REASON}" >&2
  elif [[ "$LP_STATUS" == "SKIP" ]]; then printf 'SKIP %s: %s\n' "$LP_STEP" "$LP_REASON"
  else printf 'PASS %s (measurement recorded; human gate NOT evaluated)\n' "$LP_STEP"; fi
}
lp_fail() { LP_REASON="$*"; printf 'DETAIL: %s\n' "$LP_REASON" >&2; exit 1; }
lp_skip() { LP_STATUS=SKIP; LP_REASON="$*"; exit 0; }
lp_start() {
  LP_STEP="$1"; trap 'lp_finish "$?"' EXIT; umask 077
  local binary
  for binary in python3 date; do command -v "$binary" >/dev/null || lp_fail "Required command missing: $binary"; done
  [[ ! -L "$LP_DIR" ]] || lp_fail "Output directory symlink refused"
  mkdir -p -- "$LP_DIR"; chmod 700 -- "$LP_DIR"
  [[ -d "$LP_DIR" && -w "$LP_DIR" ]] || lp_fail "Private output directory unavailable"
}
lp_seconds() {
  local n="${LOWPOWER_SAMPLE_SECONDS:-60}"
  [[ "$n" =~ ^[1-9][0-9]*$ ]] && ((n>=5 && n<=600)) || lp_fail "LOWPOWER_SAMPLE_SECONDS must be 5..600"
  printf '%s' "$n"
}
lp_require() { command -v "$1" >/dev/null || lp_skip "Command $1 unavailable"; }
lp_loopback() {
  # HTTP is deliberately loopback-only; credentials cannot reach external domains.
  [[ "$1" =~ ^http://127\.0\.0\.1:[0-9]{2,5}/[a-zA-Z0-9/_-]*$ ]] ||
    lp_fail "Endpoint must be an explicit local 127.0.0.1 URL without query, fragment or userinfo"
}
lp_snapshot() {
  local name="$1"
  (command -v top >/dev/null && top -b -n 1 > "$LP_DIR/$name-top.PRIVATE.txt") || true
  (command -v free >/dev/null && free -b > "$LP_DIR/$name-free.PRIVATE.txt") || true
  (command -v df >/dev/null && df -P -B1 / > "$LP_DIR/$name-df.PRIVATE.txt") || true
  (command -v iostat >/dev/null && iostat -dx 1 1 > "$LP_DIR/$name-iostat.PRIVATE.txt") || true
  chmod 600 "$LP_DIR"/"$name"-*.PRIVATE.txt 2>/dev/null || true
}
lp_sample() {
  local seconds="$1" path="$2" scenario="$3" stopflag="$4"
  python3 - "$seconds" "$path" "$scenario" "$stopflag" <<'PY'
import datetime as dt
import json
import os
import statistics as stats
import sys
import time
seconds, path, scenario, stopflag = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
def cpu():
    with open('/proc/stat', encoding='utf8') as f:
        vals=[int(x) for x in f.readline().split()[1:]]
    return (sum(vals), vals[3] + (vals[4] if len(vals)>4 else 0))
def mem():
    with open('/proc/meminfo',encoding='utf8') as f:
        d={z.split(':')[0]:int(z.split(':')[1].split()[0])*1024 for z in f}
    total=d['MemTotal']; used=total-d['MemAvailable']
    return used/1048576, 100*used/total
def net():
    with open('/proc/net/dev',encoding='utf8') as f:
        lines=f.readlines()[2:]
    rx=tx=0
    for line in lines:
        name,rest=line.split(':',1)
        if name.strip()=='lo': continue
        fields=rest.split()
        rx+=int(fields[0]); tx+=int(fields[8])
    return rx,tx
def disk():
    st=os.statvfs('/')
    used=(st.f_blocks-st.f_bavail)*st.f_frsize
    total=st.f_blocks*st.f_frsize
    return used/1073741824, (100*used/total if total else None)
def summary(seq,unit):
    if not seq:return {'avg':None,'min':None,'max':None,'unit':unit}
    return {'avg':round(stats.mean(seq),3),'min':round(min(seq),3),
            'max':round(max(seq),3),'unit':unit}
stamp=dt.datetime.now(dt.timezone.utc).isoformat()
start=time.monotonic()
cp0=cpu(); net0=net(); cpup=[]; ramb=[]; ramp=[]; diskgb=[]; diskpct=[]
for _ in range(seconds):
    time.sleep(1)
    cp1=cpu()
    diff=cp1[0]-cp0[0]
    if diff>0: cpup.append(max(0,min(100,100*(diff-(cp1[1]-cp0[1]))/diff)))
    cp0=cp1
    x,y=mem(); ramb.append(x);ramp.append(y)
    g,p=disk(); diskgb.append(g)
    if p is not None: diskpct.append(p)
    if os.path.exists(stopflag): break
end=time.monotonic(); net1=net()
result={'schema':'libre-chat-vx.low-power-sample.v1','scenario':scenario,
'observed_at_utc':stamp,'finished_at_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
'duration_seconds':round(end-start,3),'samples':len(cpup),
'cpu_host_pct':summary(cpup,'percent'),'ram_used_mib':summary(ramb,'MiB'),
'ram_used_pct':summary(ramp,'percent'),'disk_used_gib':summary(diskgb,'GiB'),
'disk_used_pct':summary(diskpct,'percent'),
'network_rx_bytes_delta':max(0,net1[0]-net0[0]),
'network_tx_bytes_delta':max(0,net1[1]-net0[1]),
'latency_ms':None,'first_byte_ms':None,'ttft_ms':None,
'metric_source':'/proc/stat,/proc/meminfo,/proc/net/dev,statvfs(/)',
'measurement_only':True,'human_gate_decision':None,'gate_closed':False}
tmp=path+'.tmp'
with open(tmp,'w',encoding='utf8') as f:json.dump(result,f,indent=2);f.write('\n')
os.chmod(tmp,0o600)
os.replace(tmp,path)
PY
}
lp_add_latency() {
  local jsonfile="$1" elapsed="$2" firstbyte="$3" label="$4"
  python3 - "$jsonfile" "$elapsed" "$firstbyte" "$label" <<'PY'
import json,os,sys
path,elapsed,firstbyte,label=sys.argv[1:]
with open(path,encoding='utf8') as f: data=json.load(f)
data['latency_ms']=round(float(elapsed)*1000,2)
data['first_byte_ms']=round(float(firstbyte)*1000,2) if firstbyte else None
data['latency_kind']=label
# Network first byte is not verified model first token.
data['ttft_ms']=None
tmp=path+'.tmp'
with open(tmp,'w',encoding='utf8') as f:json.dump(data,f,indent=2);f.write('\n')
os.chmod(tmp,0o600);os.replace(tmp,path)
PY
}
