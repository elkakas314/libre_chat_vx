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
  const [activeSystem, setActiveSystem] = useState<HudSystem|null>(null);
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

        <section className="vx-context-systems" aria-labelledby="vx-systems-heading">
          <div className="vx-context-section-heading">
            <h3 id="vx-systems-heading">Sistemas</h3>
            <span>3 destinos</span>
          </div>
          <ul className="vx-target-list" aria-label="Destinos de NOSTROMO">
            <li className="vx-target-item">
              <div className="vx-target-identity">
                <span className="vx-target-icon" aria-hidden="true">M</span>
                <div>
                  <strong>MANOJOS</strong>
                  <small>Control actual: MANOJOS3; nuevo runtime no acreditado</small>
                </div>
              </div>
              <span className="vx-target-state"><span aria-hidden="true" className="vx-target-dot"/>No enlazado</span>
              <button type="button" className="vx-target-focus-button" aria-label="Ver contexto MANOJOS" onClick={() => setActiveSystem('MANOJOS')}>Ver contexto</button>
            </li>
            <li className="vx-target-item">
              <div className="vx-target-identity">
                <span className="vx-target-icon" aria-hidden="true">V</span>
                <div>
                  <strong>VX13</strong>
                  <small>Plataforma de agentes</small>
                </div>
              </div>
              <span className="vx-target-state"><span aria-hidden="true" className="vx-target-dot"/>En diseño</span>
              <button type="button" className="vx-target-focus-button" aria-label="Ver contexto VX13" onClick={() => setActiveSystem('VX13')}>Ver contexto</button>
            </li>
            <li className="vx-target-item">
              <div className="vx-target-identity">
                <span className="vx-target-icon" aria-hidden="true">O</span>
                <div>
                  <strong>ORÁCULO</strong>
                  <small>Investigación y verificación consultiva; sin autoridad VX13</small>
                </div>
              </div>
              <span className="vx-target-state"><span aria-hidden="true" className="vx-target-dot"/>No enlazado</span>
              <button type="button" className="vx-target-focus-button" aria-label="Ver contexto ORÁCULO" onClick={() => setActiveSystem('ORACULO')}>Ver contexto</button>
            </li>
          </ul>
        </section>
        <TentaculoHud cards={projectTentaculoHud([])} activeSystem={activeSystem}
          onClose={() => setActiveSystem(null)} />

        <p className="vx-context-note" role="note">
          Este es el estado del enlace con NOSTROMO, no la salud de cada sistema. Se actualizará tras una lectura autenticada.
        </p>

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
