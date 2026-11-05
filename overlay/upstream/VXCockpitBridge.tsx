import React, { useEffect, useState } from 'react';
import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  VX13_LIBRECHAT_INTEGRATION,
} from '@librechat/vx';
import './VXCockpit.css';

export interface VXCockpitBridgeProps {
  onClose?: () => void;
}

/** One requested contextual view inside LibreChat's own panel. No target authority. */
export default function VXCockpitBridge({ onClose }: VXCockpitBridgeProps) {
  const [showTechnical, setShowTechnical] = useState(false);

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
        <button type="button" className="vx-context-close" aria-label="Cerrar contexto NOSTROMO" onClick={onClose}>
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

        <section className="vx-context-systems" aria-labelledby="vx-systems-heading">
          <div className="vx-context-section-heading">
            <h3 id="vx-systems-heading">Sistemas</h3>
            <span>2 destinos</span>
          </div>
          <ul className="vx-target-list" aria-label="Destinos de NOSTROMO">
            <li className="vx-target-item">
              <div className="vx-target-identity">
                <span className="vx-target-icon" aria-hidden="true">M</span>
                <div>
                  <strong>MANOJOS3</strong>
                  <small>Automatización y ejecución gobernada</small>
                </div>
              </div>
              <span className="vx-target-state"><span aria-hidden="true" className="vx-target-dot"/>Sin conexión</span>
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
            </li>
          </ul>
        </section>

        <p className="vx-context-note" role="note">
          El estado se actualizará cuando exista una conexión autenticada y comprobada.
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
