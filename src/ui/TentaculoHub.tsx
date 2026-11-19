import * as React from 'react';
import {
  createTentaculoHubTree,
  type HubItem,
} from '../hud/tentaculoHud';
import type {NostromoHubSnapshot} from '../hud/nostromoHub';
import type {McpConnectionReadback} from '../cockpit/mcpConnectionReadback';
import {SiwcConnectionControl} from './SiwcConnectionControl';

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
export function TentaculoHub({snapshot,mcpConnections}:{
  snapshot:NostromoHubSnapshot;
  mcpConnections?:McpConnectionReadback|null;
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
        <section aria-label="Destinos externos sin lectura autenticada">
          <h5>Destinos externos · estado no verificado</h5>
          <ul className="vx-hub-roots">
            {future.map(item=><HubNode key={item.id} item={item} children={children}/>)}
          </ul>
        </section>
      </div>
      <section aria-label="Conexiones MCP de LibreChat" data-testid="nostromo-mcp-connections">
        <h5>Conexiones MCP de LibreChat</h5>
        {mcpConnections ? <>
          <p>Lectura recibida: <time dateTime={new Date(mcpConnections.receivedAtMs).toISOString()}>{new Date(mcpConnections.receivedAtMs).toLocaleString()}</time>. No prueba llamadas ni permisos del agente.</p>
          {mcpConnections.servers.length ? <ul>{mcpConnections.servers.map(server=>
            <li key={server.name}>{server.name}: {server.state}</li>)}</ul> : <p>No hay servidores en esta lectura.</p>}
        </> : <p>NO VERIFICADO</p>}
      </section>
      <SiwcConnectionControl />
      <footer className="vx-hub-footer" role="note">
        <span className="vx-hub-state-dot" aria-hidden="true" />
        MCP sin vínculo LIVE verificado · ChatGPT: consulta el estado anterior · sin permisos desde este panel
      </footer>
    </section>
  );
}
