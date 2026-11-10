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
  return (
    <li className={'vx-hub-item vx-hub-kind-'+item.kind.toLowerCase()}
      data-hub-item={item.id}>
      <div className="vx-hub-item-main" style={{paddingInlineStart:depth*15}}>
        <span className="vx-hub-item-mark" aria-hidden="true">
          {item.kind==='SYSTEM'?'◆':item.kind==='AGENT'?'◇':item.kind==='MODULE'?'▣':'·'}
        </span>
        <span>{item.label}</span>
        <small>En código</small>
      </div>
      {(children[item.id]?.length??0)>0&&
        <ul className="vx-hub-children">
          {children[item.id].map(child=>(
            <HubNode key={child.id} item={child}
              children={children} depth={depth+1}/>
          ))}
        </ul>}
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
          <p>Inventario de código. Los servicios y permisos reales se verifican por separado.</p>
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
        MCP sin vínculo LIVE verificado · ChatGPT sin sesión OAuth verificada · sin permisos desde este panel
      </footer>
    </section>
  );
}
