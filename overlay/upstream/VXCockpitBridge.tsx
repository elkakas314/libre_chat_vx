import React, { useEffect, useState } from 'react';
import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  VX13_LIBRECHAT_INTEGRATION,
} from '@librechat/vx';
import './VXCockpit.css';

export interface VXCockpitBridgeProps {
  onClose?: () => void;
}

/**
 * A requested contextual view in LibreChat's existing shared panel.
 * Does not own target state, generate permissions, execute mutations, or claim LIVE.
 */
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
    <section id="vx-context-panel" className="vx-context-root" data-testid="vx-context-surface" aria-label="Contexto NOSTROMO">
      <header className="vx-context-header">
        <div className="vx-context-heading">
          <span className="vx-context-kicker">NOSTROMO</span>
          <h2>Contexto</h2>
        </div>
        <button type="button" className="vx-context-close" aria-label="Cerrar contexto NOSTROMO" onClick={onClose}>
          <span aria-hidden="true">←</span>
          <span>Volver al chat</span>
        </button>
      </header>
      <div className="vx-context-body">
        <p className="vx-context-overline">Tus sistemas</p>
        <h3>Todo en su lugar</h3>
        <p className="vx-context-intro">
          Esta cabina podrá reunir el estado de tus proyectos, sin convertir el chat en un panel técnico.
        </p>
        <ul className="vx-target-list" aria-label="Destinos de NOSTROMO">
          <li className="vx-target-item">
            <div className="vx-target-name">
              <span className="vx-target-indicator" aria-hidden="true" />
              <strong>MANOJOS3</strong>
            </div>
            <span className="vx-target-state">Pendiente de conexión</span>
          </li>
          <li className="vx-target-item">
            <div className="vx-target-name">
              <span className="vx-target-indicator" aria-hidden="true" />
              <strong>VX13</strong>
            </div>
            <span className="vx-target-state">En diseño</span>
          </li>
        </ul>
        <p className="vx-context-note">
          La disponibilidad se confirmará mediante una lectura real. Ningún destino se declara listo por su documentación.
        </p>
        <div className="vx-context-disclosure">
          <button type="button" className="vx-context-detail-toggle"
            onClick={() => setShowTechnical((value) => !value)}
            aria-expanded={showTechnical} aria-controls="vx-technical-details">
            {showTechnical ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
            <span aria-hidden="true">{showTechnical ? '−' : '+'}</span>
          </button>
          {showTechnical ? (
            <div id="vx-technical-details" className="vx-context-technical">
              <p>MANOJOS3 · {MANOJOS3_LIBRECHAT_INTEGRATION.bindingState}</p>
              <p>VX13 · {VX13_LIBRECHAT_INTEGRATION.bindingState}</p>
              <p>Observaciones LIVE: no verificadas.</p>
              <p>Esta superficie no autoriza acciones materiales.</p>
            </div>
          ) : null}
        </div>
      </div>
      <footer className="vx-context-footer">NOSTROMO · Superficie informativa</footer>
    </section>
  );
}
