import type { HudProjection, HudSystem } from '../hud/tentaculoHud';
import * as React from 'react';

const states:Record<HudProjection['state'],string>={
  VERIFIED_READ:'Lectura verificada',DESIGN_ONLY:'En diseño',
  UNCONFIGURED:'Sin conectar',DEGRADED:'Servicio degradado',
  STALE:'Lectura caducada',NO_VERIFICADO:'No verificado',
};

/**
 * A single, requested conversation focus within LibreChat's native context slot.
 * There is no permanent dashboard, automatic 3-card grid or target action here.
 * The host must set activeSystem from its admitted conversational focus event.
 */
export function TentaculoHud(props:{
  cards:readonly HudProjection[];
  activeSystem?:HudSystem|null;
  onClose?:()=>void;
  onSelectSystem?:(system:HudSystem)=>void;
}) {
  const active=props.activeSystem
    ?props.cards.find(x=>x.system===props.activeSystem):undefined;
  if(!active)return null;
  return (
    <section aria-label={'Contexto NOSTROMO · '+active.label}
      data-testid="tentaculo-focus"
      style={{
        maxWidth:720,margin:'0 auto',padding:'16px 18px',
        borderInlineStart:'2px solid var(--border-medium, #7777)',
        color:'inherit',fontFamily:'inherit',
      }}>
      <header style={{
        display:'flex',alignItems:'flex-start',justifyContent:'space-between',
        gap:12,flexWrap:'wrap',
      }}>
        <div>
          <span style={{fontSize:11,opacity:0.66}}>NOSTROMO / FOCO ACTUAL</span>
          <h2 style={{fontSize:'1.1rem',margin:'4px 0'}}>{active.label}</h2>
          <p style={{margin:0,fontSize:13,opacity:0.85}}>{active.subtitle}</p>
        </div>
        {props.onClose&&<button type="button" onClick={props.onClose}
          aria-label="Volver al chat"
          style={{font:'inherit',cursor:'pointer',background:'transparent',
            color:'inherit',border:'1px solid var(--border-medium, #7777)',
            borderRadius:9,padding:'7px 10px'}}>Volver al chat</button>}
      </header>
      <div role="status" aria-live="polite"
        style={{marginTop:16,fontSize:13}}>
        <strong>{states[active.state]}</strong>
        {active.state==='VERIFIED_READ'&&active.observedAt&&
          <time dateTime={active.observedAt} style={{marginInlineStart:10,opacity:0.75}}>
            {active.observedAt}
          </time>}
      </div>
      {active.evidenceRefs.length>0&&
        <p style={{fontSize:12,opacity:0.75,margin:'9px 0'}}>
          {active.evidenceRefs.length} referencias de evidencia; consulta su origen para verificar.
        </p>}
      <p style={{fontSize:12,opacity:0.72,margin:'15px 0 0'}}>
        Vista de lectura. Las autorizaciones y operaciones pertenecen al sistema de origen.
      </p>
      {props.onSelectSystem&&
        <button type="button" onClick={()=>props.onSelectSystem?.(active.system)}
          style={{font:'inherit',fontSize:12,cursor:'pointer',background:'transparent',
            color:'inherit',border:0,textDecoration:'underline',padding:'10px 0'}}>
          Abrir recursos de {active.label}
        </button>}
    </section>
  );
}
