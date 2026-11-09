import type { HudProjection, HudSystem } from '../hud/tentaculoHud';
import * as React from 'react';

/** Deliberately a slot component, not a second sidebar/dashboard. */
export function TentaculoHud(props:{
  cards:readonly HudProjection[];
  onSelectSystem?:(system:HudSystem)=>void;
}) {
  return (
    <section aria-label="Tentáculo HUD · sistemas" style={{
      border:'1px solid var(--border-medium, #7774)',
      borderRadius:16,padding:'14px 16px',
      background:'var(--surface-secondary, transparent)',
      maxWidth:760,fontFamily:'inherit',
    }}>
      <h2 style={{fontSize:'1rem',margin:'0 0 12px',fontWeight:650}}>Tentáculo HUD</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 205px), 1fr))',gap:10}}>
        {props.cards.map(card=>{
          const body=(
            <div style={{display:'flex',flexDirection:'column',gap:6,textAlign:'left',
              padding:12,borderRadius:12,border:'1px solid var(--border-medium, #7774)',
              background:'var(--surface-primary, transparent)',height:'100%',boxSizing:'border-box'}}>
              <strong style={{fontSize:14}}>{card.label}</strong>
              <span style={{fontSize:12,opacity:0.8}}>{card.subtitle}</span>
              <span style={{fontSize:12,opacity:0.9}}>{({
                VERIFIED_READ:'Lectura verificada',DESIGN_ONLY:'En diseño',
                UNCONFIGURED:'Sin conectar',DEGRADED:'Degradado',
                STALE:'Estado desactualizado',NO_VERIFICADO:'No verificado',
              } as const)[card.state]}</span>
              {card.observedAt&&
                <time dateTime={card.observedAt} style={{fontSize:11,opacity:0.65}}>
                  {card.observedAt}
                </time>}
              {!!card.evidenceRefs.length&&
                <span style={{fontSize:11,opacity:0.7}}>
                  {card.evidenceRefs.length} {card.evidenceRefs.length===1?'evidencia':'evidencias'}
                </span>}
            </div>
          );
          return props.onSelectSystem?
            <button key={card.system} type="button"
              aria-label={'Ver recursos de '+card.label}
              onClick={()=>props.onSelectSystem?.(card.system)}
              style={{padding:0,background:'transparent',border:0,color:'inherit',
                cursor:'pointer',fontFamily:'inherit'}}>{body}</button>:
            <div key={card.system}>{body}</div>;
        })}
      </div>
      <p style={{fontSize:11,opacity:0.65,margin:'12px 0 0'}}>
        Vista de lectura. Las autorizaciones y operaciones pertenecen a cada sistema.
      </p>
    </section>
  );
}
