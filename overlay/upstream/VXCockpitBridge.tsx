import React, { useEffect, useRef, useState } from 'react';
import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  VX13_LIBRECHAT_INTEGRATION,
  TentaculoHud,
  TentaculoHub,
  projectTentaculoHud,
  nostromoHubSourceSnapshot,
} from '@librechat/vx';
import type { HudSystem } from '@librechat/vx';
import './VXCockpit.css';

export interface VXCockpitBridgeProps {
  onClose?: () => void;
}

/** One requested contextual view inside LibreChat's own panel. No target authority. */
export default function VXCockpitBridge({ onClose }: VXCockpitBridgeProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [showAutonomous, setShowAutonomous] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [activeMode, setActiveMode] = useState<'AUTONOMO'|HudSystem>('AUTONOMO');
  const activeSystem:HudSystem|null = activeMode==='AUTONOMO'?null:activeMode;
  const returnButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { returnButtonRef.current?.focus(); }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <section id="vx-context-panel" className="vx-context-root" data-testid="vx-context-surface" aria-labelledby="vx-context-title">
      <header className="vx-context-header">
        <div className="vx-context-heading">
          <span className="vx-context-kicker">NOSTROMO / CONTEXTO</span>
          <h2 id="vx-context-title">Tu cabina</h2>
        </div>
        <button ref={returnButtonRef} type="button" className="vx-context-close" aria-label="Cerrar contexto NOSTROMO" onClick={onClose}>
          <span className="vx-context-back" aria-hidden="true">←</span>
          <span>Volver</span>
        </button>
      </header>

      <div className="vx-context-body">
        <div className="vx-context-intro-block">
          <span className="vx-context-mark" aria-hidden="true">◇</span>
          <p className="vx-context-overline">CONEXIONES BAJO CONTROL</p>
          <h3>Todo conectado, cuando esté listo.</h3>
          <p className="vx-context-intro">
            Consulta tus sistemas desde la conversación. Aquí sólo aparecen datos confirmados.
          </p>
        </div>

        <nav aria-label="Modos de NOSTROMO" className="vx-mode-switcher" data-testid="nostromo-mode-switcher">
          {([
            ['AUTONOMO','NOSTROMO Autónomo'],
            ['MANOJOS','MANOJOS'],
            ['VX13','VX13'],
            ['ORACULO','ORÁCULO'],
          ] as const).map(([id,name])=><button key={id} type="button" className="vx-mode-option"
            aria-pressed={activeMode===id}
            onClick={()=>{setActiveMode(id);setShowAutonomous(false);setShowHub(false);}}>{name}</button>)}
        </nav>
        <p className="vx-mode-boundary" role="note">
          {activeMode==='AUTONOMO'
            ? 'Modo local independiente: agente y MCP propio de terminal.'
            : 'Sistema externo: conserva su propio MCP y permisos. No recibe la terminal local automáticamente.'}
        </p>
        {activeMode==='AUTONOMO' ? (
        <section className="vx-autonomy-card" aria-labelledby="vx-autonomy-heading">
          <div className="vx-autonomy-topline">
            <span className="vx-autonomy-label"><span className="vx-autonomy-beacon" aria-hidden="true"/> NOSTROMO · AUTÓNOMO</span>
            <span className="vx-autonomy-stage">SOURCE · SIN ACTIVAR</span>
          </div>
          <div className="vx-autonomy-main">
            <div>
              <h3 id="vx-autonomy-heading">Habla. Encarga. Comprueba.</h3>
              <p>Tu agente de terminal en el Lenovo: una conversación, un MCP local, resultados verificables.</p>
            </div>
            <div className="vx-autonomy-terminal-glyph" aria-hidden="true">&gt;_</div>
          </div>
          <div className="vx-autonomy-metrics" aria-label="Configuración del modo autónomo">
            <span><b>01</b> MCP local</span>
            <span><b>R0</b> lectura</span>
            <span><b>R2</b> permiso puntual</span>
          </div>
          <button type="button" className="vx-autonomy-disclosure" aria-expanded={showAutonomous}
            aria-controls="vx-autonomy-details"
            onClick={() => setShowAutonomous(value => !value)}>
            {showAutonomous ? 'Ocultar modo autónomo' : 'Ver modo autónomo NOSTROMO'}
            <span aria-hidden="true">{showAutonomous ? '−' : '↗'}</span>
          </button>
          {showAutonomous ? (
            <div id="vx-autonomy-details" className="vx-autonomy-details" data-testid="nostromo-autonomo-details">
              <div className="vx-autonomy-flow" aria-label="Flujo del agente">
                <span>Conversación</span><span aria-hidden="true">→</span>
                <span>Agente</span><span aria-hidden="true">→</span>
                <span>Terminal</span><span aria-hidden="true">→</span>
                <span>Evidencia</span>
              </div>
              <p><strong>ChatGPT:</strong> pendiente de autorización OAuth; puede sustituirse por LLM gratuito o local verificado.</p>
              <p><strong>Terminal:</strong> SOURCE preparado, sin instalación LIVE acreditada. Comandos R0 limitados, R2 sólo con permiso local de un uso.</p>
              <div className="vx-mode-tools" data-testid="nostromo-tools-source">
                <strong>Único MCP · catálogo SOURCE</strong>
                <ul>
                  <li>Estado y lista de herramientas instalables</li>
                  <li>Preparar comando y comprobar sus límites</li>
                  <li>Ejecutar terminal con stdout, stderr y código de salida</li>
                </ul>
                <p>El administrador elige las herramientas del MCP. El chat no se concede privilegios.</p>
              </div>
              <p className="vx-autonomy-warning">Esta cabina no inicia procesos ni concede permisos. La ejecución pertenece al agente y su MCP local autenticado.</p>
              <button type="button" className="vx-autonomy-hub-toggle" aria-expanded={showHub}
                aria-controls="vx-nostromo-hub"
                onClick={() => setShowHub(value => !value)}>
                {showHub ? 'Ocultar Tentáculo Hub' : 'Explorar Tentáculo Hub'}
                <span aria-hidden="true">{showHub ? '−' : '↗'}</span>
              </button>
              {showHub ? (
                <div id="vx-nostromo-hub">
                  <TentaculoHub snapshot={nostromoHubSourceSnapshot()} />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
        ) : null}

        {activeMode!=='AUTONOMO' ? (
        <section className="vx-context-systems" aria-labelledby="vx-systems-heading">
          <div className="vx-context-section-heading">
            <h3 id="vx-systems-heading">Sistemas</h3>
            <span>Destino externo</span>
          </div>
          <p className="vx-mode-subtitle">Vista contextual del destino elegido. Tentáculo Hub conserva el inventario SOURCE, sin dar permisos de ejecución.</p>
        </section>
        ) : null}
        <TentaculoHud cards={projectTentaculoHud([])} activeSystem={activeSystem}
          onClose={() => setActiveMode('AUTONOMO')} />

        {activeMode!=='AUTONOMO' ? <p className="vx-context-note" role="note">
          Este es el estado del enlace con NOSTROMO, no la salud de cada sistema. Se actualizará tras una lectura autenticada.
        </p> : null}

        <div className="vx-context-disclosure">
          <button type="button" className="vx-context-detail-toggle"
            onClick={() => setShowTechnical((value) => !value)}
            aria-expanded={showTechnical} aria-controls="vx-technical-details">
            {showTechnical ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
            <span className="vx-context-detail-symbol" aria-hidden="true">{showTechnical ? '−' : '+'}</span>
          </button>
          {showTechnical ? (
            <div id="vx-technical-details" className="vx-context-technical">
              <p>MANOJOS3 · {MANOJOS3_LIBRECHAT_INTEGRATION.bindingState}</p>
              <p>VX13 · {VX13_LIBRECHAT_INTEGRATION.bindingState}</p>
              <p>ORÁCULO · Consulta advisory no enlazada desde LibreChat.</p>
              <p>Observaciones LIVE: no verificadas.</p>
              <p>El panel no autoriza acciones materiales.</p>
            </div>
          ) : null}
        </div>
      </div>
      <footer className="vx-context-footer">NOSTROMO <span aria-hidden="true">·</span> Información con origen verificable</footer>
    </section>
  );
}
