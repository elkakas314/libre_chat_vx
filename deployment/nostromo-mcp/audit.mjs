/** nostromo_auditoria_r0 — determinista, read-only, un solo JSON. */
import net from 'node:net';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readHostMetrics} from './inspect.mjs';

const exec = promisify(execFile);

export function userSystemdEnv(uid = typeof process.getuid === 'function' ? process.getuid() : null){
  if(!Number.isSafeInteger(uid)||uid<0)return null;
  const runtimeDir=`/run/user/${uid}`;
  return {XDG_RUNTIME_DIR:runtimeDir,DBUS_SESSION_BUS_ADDRESS:`unix:path=${runtimeDir}/bus`};
}

function tcpProbe(port, host='127.0.0.1', timeoutMs=800){
  return new Promise(resolve => {
    const s = new net.Socket();
    let done = false;
    const finish = ok => { if(!done){ done=true; s.destroy(); resolve(ok); } };
    s.setTimeout(timeoutMs);
    s.once('connect', () => finish(true));
    s.once('timeout', () => finish(false));
    s.once('error',   () => finish(false));
    s.connect(port, host);
  });
}

async function safe(fn){
  try { return await fn(); }
  catch (e) { return {status:'ERROR', error:String(e?.message||e)}; }
}

export async function auditoriaR0(settings){
  const now = new Date().toISOString();
  const out = {kind:'nostromo.auditoria.r0.v1', generatedAt:now, source:'LIVE_READBACK', sections:{}};

  // Backend LibreChat
  out.sections.backend = await safe(async () => {
    let r = null, usedEp = null;
    for (const ep of ["/health","/api/health"]) {
      try { const t = await fetch("http://127.0.0.1:3080" + ep, {signal: AbortSignal.timeout(2000)}); if (t.ok) { r = t; usedEp = ep; break; } } catch {}
    }
    if (!r) return {status:"HTTP_ERROR", tried:["/health","/api/health"]};
    return {status: r.ok ? 'HTTP_OK' : 'HTTP_ERROR', endpoint: usedEp, httpCode: r.status};
  });

  // Puertos clave
  const ports = [3080,27017,7700,8000,11434,8790,9222];
  out.sections.ports = {};
  for (const p of ports) {
    out.sections.ports[p] = (await tcpProbe(p)) ? 'OPEN' : 'CLOSED';
  }

  // Ollama
  out.sections.ollama = await safe(async () => {
    const r = await fetch('http://127.0.0.1:11434/api/tags', {signal: AbortSignal.timeout(2000)});
    const j = await r.json();
    return {status:'OK', models:(j.models||[]).map(m => ({name:m.name, sizeMiB: Math.round((m.size||0)/1048576)}))};
  });

  // Git de raíces permitidas
  out.sections.git = {};
  for (const root of (settings.roots||[])) {
    out.sections.git[root] = await safe(async () => {
      const {stdout: head}    = await exec('git',['-C',root,'log','-1','--oneline'],{timeout:3000});
      const {stdout: branch}  = await exec('git',['-C',root,'rev-parse','--abbrev-ref','HEAD'],{timeout:3000});
      const {stdout: dirty}   = await exec('git',['-C',root,'status','--porcelain'],{timeout:3000});
      return {head:head.trim(), branch:branch.trim(), dirtyLines:dirty.trim()?dirty.trim().split('\n').length:0};
    });
  }

  // Host metrics (reutiliza inspect.mjs)
  out.sections.host = await safe(async () => {
    const root = (settings.roots||[])[0];
    if (!root) return {status:'NO_ROOT'};
    return await readHostMetrics({cwd:root}, settings);
  });

  // systemd --user
  out.sections.systemdUser = await safe(async () => {
    const sessionEnv=userSystemdEnv();
    if(!sessionEnv)return {status:'UNAVAILABLE',reason:'USER_RUNTIME_ID_UNAVAILABLE'};
    const {stdout} = await exec('systemctl',['--user','is-active','vx-backend','ollama','manojos3'],{
      timeout:3000,env:{...process.env,...sessionEnv}
    });
    return {services: stdout.trim().split('\n')};
  });

  // MCP self
  out.sections.mcpSelf = {
    server:'nostromo-autonomo', version:'0.3.0',
    enabled: !!settings.enabled,
    roots: (settings.roots||[]).length,
    approvalConfigured: !!settings.approvalDir
  };

  out.summary = {
    sections: Object.keys(out.sections),
    source:'LIVE_READBACK',
    materialVerified:false,
    note:'Auditoría read-only. No modifica estado. materialVerified=false por diseño.'
  };

  return out;
}
