import * as React from 'react';
import {
  createTentaculoHubTree,
  type HubItem,
} from '../hud/tentaculoHud';
import type {NostromoHubSnapshot} from '../hud/nostromoHub';

function HubNode({item,children,depth=0}:{
  item:HubItem;
  children:Readonly<Record<string,readonly HubItem[]>>;
  depth?:number;
}){
  const descendants=children[item.id]??[];
  const content=(
    <>
      <span className="vx-hub-item-mark" aria-hidden="true">
        {item.kind==='SYSTEM'?'◆':item.kind==='AGENT'?'◇':item.kind==='MODULE'?'▣':'·'}
      </span>
      <span>{item.label}</span>
      <small>En código</small>
    </>
  );
  return (
    <li className={'vx-hub-item vx-hub-kind-'+item.kind.toLowerCase()}
      data-hub-item={item.id}>
      {descendants.length>0 ? (
        <details className="vx-hub-branch" open={depth===0}>
          <summary className="vx-hub-item-main" style={{paddingInlineStart:depth*15}}>
            {content}
          </summary>
          <ul className="vx-hub-children">
            {descendants.map(child=>(
              <HubNode key={child.id} item={child}
                children={children} depth={depth+1}/>
            ))}
          </ul>
        </details>
      ):(
        <div className="vx-hub-item-main" style={{paddingInlineStart:depth*15}}>
          {content}
        </div>
      )}
    </li>
  );
}

/** Focusable, read-only Hub. Does not call MCP, install agents or infer LIVE. */
export function TentaculoHub({snapshot}:{
  snapshot:NostromoHubSnapshot;
}) {
  const {roots,children}=createTentaculoHubTree(snapshot.items);
  const local=roots.filter(x=>x.system==='NOSTROMO');
  const future=roots.filter(x=>x.system!=='NOSTROMO');
  return (
    <section className="vx-hub-surface" data-testid="nostromo-tentaculo-hub"
      aria-label="Tentáculo Hub · inventario NOSTROMO">
      <header className="vx-hub-header">
        <div>
          <span className="vx-hub-eyebrow">TENTÁCULO HUB</span>
          <h4>Centro de capacidades</h4>
          <p>Una vista de lo disponible en código. La instalación se verifica por separado.</p>
        </div>
        <span className="vx-hub-source-badge">SOURCE</span>
      </header>
      <div className="vx-hub-columns">
        <section aria-label="Agente autónomo y herramientas locales">
          <h5>Primera fase · local</h5>
          <ul className="vx-hub-roots">
            {local.map(item=><HubNode key={item.id} item={item} children={children}/>)}
          </ul>
        </section>
        <section aria-label="Conexiones futuras no activadas">
          <h5>Conexiones futuras</h5>
          <ul className="vx-hub-roots">
            {future.map(item=><HubNode key={item.id} item={item} children={children}/>)}
          </ul>
        </section>
      </div>
      <footer className="vx-hub-footer" role="note">
        <span className="vx-hub-state-dot" aria-hidden="true" />
        MCP: sin lectura LIVE desde LibreChat · ChatGPT: sesión OAuth no verificada · esta vista no concede permisos
      </footer>
    </section>
  );
}
