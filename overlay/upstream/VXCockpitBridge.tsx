import React, { useEffect, useRef, useState } from 'react';
import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  VX13_LIBRECHAT_INTEGRATION,
  TentaculoHud,
  TentaculoHub,
  projectTentaculoHud,
  nostromoHubSourceSnapshot,
  PhoneModuleView,
  createPhoneModuleSnapshot,
  summarizeVxConversation,
  selectedAgentReadback,
  projectMcpConnectionReadback,
} from '@librechat/vx';
import type { HudSystem, PhoneModuleSnapshot, VxConversationActivityInput } from '@librechat/vx';
import { useGetAgentByIdQuery, useMCPConnectionStatusQuery } from '~/data-provider';
import './VXCockpit.css';

export interface VXCockpitBridgeProps {
  onClose?: () => void;
  activity: VxConversationActivityInput;
  /** Authenticated device readback from the native host; never inferred in the browser. */
  phone?: PhoneModuleSnapshot;
}

/** One requested contextual view inside LibreChat's own panel. No target authority. */
export default function VXCockpitBridge({ onClose, activity: activityInput, phone }: VXCockpitBridgeProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [showAutonomous, setShowAutonomous] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [activeMode, setActiveMode] = useState<'AUTONOMO'|HudSystem>('AUTONOMO');
  const activeSystem:HudSystem|null = activeMode==='AUTONOMO'?null:activeMode;
  const returnButtonRef = useRef<HTMLButtonElement>(null);
  const activity = summarizeVxConversation(activityInput);
  // LibreChat's VIEW-scoped query returns safe agent metadata for the
  // authenticated user. A configured model is not proof of an inference run.
  const agentQuery = useGetAgentByIdQuery(
    activity.endpoint === 'agents' ? activity.agentId : null,
  );
  const selectedAgent = selectedAgentReadback({endpoint:activity.endpoint,agentId:activity.agentId,
    fetching:agentQuery.isFetching,error:agentQuery.isError,data:agentQuery.data});
  const mcpQuery = useMCPConnectionStatusQuery({enabled:showHub});
  const mcpConnections = projectMcpConnectionReadback({data:mcpQuery.data,
    fetching:mcpQuery.isFetching,error:mcpQuery.isError,receivedAtMs:mcpQuery.dataUpdatedAt,nowMs:Date.now()});
  const storedToolOutputs = activity.storedOutputCount;

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
          <p className="vx-context-overline">ACTIVIDAD LEÍDA DESDE LIBRECHAT</p>
          <h3>Estado de la conversación</h3>
          <p className="vx-context-intro">
            La cabina muestra el contexto de chat cargado y separa las llamadas registradas de sus resultados guardados.
          </p>
        </div>

        <section className="vx-live-activity" aria-label="Actividad de LibreChat" data-testid="vx-live-activity">
          <div className="vx-live-activity-grid">
            <div><span>Conversación</span><strong>{activity.conversationId ? 'Cargada' : 'Chat nuevo'}</strong></div>
            <div><span>Agente</span><strong>{activity.endpoint === 'agents' && activity.agentId ? activity.agentId : 'No seleccionado'}</strong></div>
            <div><span>Nombre del agente</span><strong>{selectedAgent?.name ?? 'NO VERIFICADO'}</strong></div>
            <div><span>Generación</span><strong>{activity.isSubmitting ? 'En ejecución' : 'En espera'}</strong></div>
            <div><span>Mensajes cargados</span><strong>{activity.messageCount}</strong></div>
            <div><span>Llamadas de herramienta</span><strong>{activity.toolCallCount}</strong></div>
            <div><span>Modelo de conversación</span><strong>{activity.model ?? 'No disponible en esta vista'}</strong></div>
            <div><span>Modelo configurado del agente</span><strong>{selectedAgent?.model ?? 'NO VERIFICADO'}</strong></div>
          </div>
          {activity.toolCalls.length > 0 ? (
            <ul className="vx-live-tool-list" aria-label="Últimas llamadas registradas">
              {activity.toolCalls.map((call, index) => (
                <li key={`${call.name}-${index}`}>
                  <code>{call.name}</code>
                  <span>{call.hasStoredOutput ? 'Salida guardada' : 'Sin salida guardada en el mensaje'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vx-live-activity-empty">No hay llamadas de herramienta en los mensajes cargados de esta conversación.</p>
          )}
        </section>

        <nav aria-label="Vistas de NOSTROMO" className="vx-mode-switcher" data-testid="nostromo-mode-switcher">
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
            ? 'Esta es una vista; no cambia el agente. Usa el selector nativo de LibreChat para elegirlo. El MCP y sus efectos se verifican en sus recibos de origen.'
            : 'Esta es una vista; no cambia el agente. El sistema externo conserva su propio MCP y permisos.'}
        </p>
        {activeMode==='AUTONOMO' ? (
        <section className="vx-autonomy-card" aria-labelledby="vx-autonomy-heading">
          <div className="vx-autonomy-topline">
            <span className="vx-autonomy-label"><span className="vx-autonomy-beacon" aria-hidden="true"/> NOSTROMO · AUTÓNOMO</span>
            <span className="vx-autonomy-stage">
              {storedToolOutputs > 0
                ? `${activity.toolCallCount} LLAMADAS · ${storedToolOutputs} SALIDAS GUARDADAS`
                : activity.toolCallCount > 0
                  ? `${activity.toolCallCount} LLAMADAS · SALIDAS NO CONFIRMADAS`
                  : 'SIN LLAMADAS EN MENSAJES CARGADOS'}
            </span>
          </div>
          <div className="vx-autonomy-main">
            <div>
              <h3 id="vx-autonomy-heading">Conversación y ejecución con evidencia de origen.</h3>
              <p>Este panel resume el chat cargado. Las llamadas registradas y sus salidas no prueban por sí solas que el efecto material se haya verificado.</p>
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
              <p><strong>ChatGPT:</strong> estado de conexión NO VERIFICADO; requiere lectura autenticada.</p>
              <p><strong>Terminal:</strong> la vista no consulta el servicio MCP. Una llamada y su salida se verifican en la conversación y en el receipt del MCP. Las decisiones R2 requieren autorización local exacta.</p>
              <div className="vx-mode-tools" data-testid="nostromo-tools-source">
                <strong>Único MCP · catálogo SOURCE</strong>
                <ul>
                  <li>Leer estado, herramientas, métricas y repositorios</li>
                  <li>Preparar comandos y revisar su riesgo antes de ejecutarlos</li>
                  <li>Iniciar, consultar y cancelar tareas locales persistentes</li>
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
              <button type="button" className="vx-autonomy-hub-toggle"
                aria-expanded={showPhone} aria-controls="vx-nostromo-phone"
                onClick={() => setShowPhone((value) => !value)}>
                {showPhone ? 'Ocultar módulo de teléfono' : 'Abrir módulo de teléfono'}
                <span aria-hidden="true">{showPhone ? '−' : '↗'}</span>
              </button>
              {showPhone ? (
                <div id="vx-nostromo-phone">
                  <PhoneModuleView snapshot={phone ?? createPhoneModuleSnapshot(undefined, [], activity.conversationId)} />
                </div>
              ) : null}
              {showHub ? (
                <div id="vx-nostromo-hub">
                  <TentaculoHub snapshot={nostromoHubSourceSnapshot()} mcpConnections={mcpConnections} />
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
