/** Delegate agent choice to LibreChat's native selector without selecting for the user. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const BEFORE='e5698b1e6b3690d30ee6c719be04216bbf405f7a6a444fdc6c872aea9bfe4713';
const sha=(x)=>createHash('sha256').update(x).digest('hex');
export function renderSelector(original){
 if(sha(original)!==BEFORE)throw Error('COCKPIT_PREIMAGE_HASH_MISMATCH');
 const state='  const [showHub, setShowHub] = useState(false);';
 const section="        {activeMode==='AUTONOMO' ? (\n        <section className=\"vx-autonomy-card\"";
 if(original.split(state).length!==2||original.split(section).length!==2)throw Error('COCKPIT_ANCHOR_MISMATCH');
 return original.replace(state,state+'\n  const [selectorUnavailable, setSelectorUnavailable] = useState(false);')
  .replace(section,`        {activeMode==='AUTONOMO' ? <div>
          <button type="button" onClick={() => {
            const buttons=document.querySelectorAll<HTMLButtonElement>('[data-testid="model-selector-button"]');
            const button=buttons.length===1 && buttons[0] instanceof HTMLButtonElement ? buttons[0] : null;
            if(!button || button.disabled || button.getClientRects().length===0){setSelectorUnavailable(true);return;}
            setSelectorUnavailable(false);onClose?.();
            window.requestAnimationFrame(()=>{button.focus();if(button.getAttribute('aria-expanded')!=='true')button.click();});
          }}>Elegir agente en LibreChat</button>
          {selectorUnavailable ? <p role="status">Selector nativo no disponible en esta vista.</p> : null}
        </div> : null}\n`+section);
}
export function stageSelector({upstream,stage}){
 if(existsSync(stage))throw Error('STAGE_ALREADY_EXISTS');
 const before=readFileSync(join(upstream,'client/src/components/VX/VXCockpitBridge.tsx'),'utf8'),after=renderSelector(before);
 mkdirSync(stage,{recursive:true});writeFileSync(join(stage,'VXCockpitBridge.tsx'),after);
 const m={schema:'nostromo.e5.cockpit-selector.v1',before:sha(before),after:sha(after)};
 writeFileSync(join(stage,'manifest.json'),JSON.stringify(m,null,2)+'\n');return m;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=',2)));
 if(!args.upstream||!args.stage)throw Error('NEED_EXPLICIT_UPSTREAM_STAGE');
 console.log(JSON.stringify(stageSelector(args),null,2));
}
