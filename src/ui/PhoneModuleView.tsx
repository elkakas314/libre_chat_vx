import * as React from 'react';
import {planPhoneAction,type PhoneModuleSnapshot} from '../mobile/phoneModule';

const labels:Record<PhoneModuleSnapshot['state'],string>={
  INTERACTIVE:'Sesión autenticada, estado fresco',
  STALE_READONLY:'Sesión sin datos frescos',
  OFFLINE_READONLY:'Solo caché sin conexión',
  UNAVAILABLE:'No conectado o no verificado',
};
/** Native NOSTROMO panel, no iframe, no Apple device control, no tool execution. */
export function PhoneModuleView({snapshot}:{snapshot:PhoneModuleSnapshot}){
  const handoff=planPhoneAction(snapshot,'HANDOFF_CONVERSATION');
  const shortcut=planPhoneAction(snapshot,'IOS_SHORTCUT');
  return (
    <section aria-label="Módulo de teléfono NOSTROMO"
      data-testid="vx-phone-module" className="vx-phone-module">
      <header><h3>Teléfono · NOSTROMO</h3>
        <small>{snapshot.sourceOnly?'SOURCE · pendiente de conexión':'Lectura autenticada'}</small>
      </header>
      <p role="status">{labels[snapshot.state]}</p>
      <dl>
        <dt>Dispositivo</dt><dd>{snapshot.deviceLabel??snapshot.platform}</dd>
        <dt>Acceso</dt><dd>{snapshot.access} · {snapshot.accessReason}</dd>
        <dt>Historial</dt><dd>{snapshot.currentConversationId?'Conversación identificada':'Sin sesión de conversación identificada'}</dd>
        <dt>Cliente nativo</dt><dd>{snapshot.nativeClientVerified?'Verificado':'No verificado'}</dd>
        <dt>Atajos de iPhone</dt><dd>{snapshot.shortcutBridgeVerified?'Puente verificado':'No conectado'}</dd>
        <dt>Control integral de iOS</dt><dd>No disponible; el teléfono conserva sus permisos</dd>
      </dl>
      <h4>Continuidad y tareas</h4>
      <p>Retomar conversación: {handoff.disposition}. Atajos: {shortcut.disposition}.
        No se ejecutan acciones ni se reenvían mutaciones al reconectar.</p>
      {snapshot.tasks.length>0?
        <ul aria-label="Tareas móviles" data-testid="vx-phone-tasks">
          {snapshot.tasks.map(task=><li key={task.taskRef}>
            {task.title} · {task.state} · {task.owner}
            {task.receiptRef?' · recibo: '+task.receiptRef:''}
          </li>)}
        </ul>
        :<p>No hay tareas del teléfono con readback autorizado.</p>}
      <p>El acceso privado Tailscale, el estado del agente y las autorizaciones
        materiales se verifican en sus planos de origen. Este visor no concede permisos.</p>
    </section>
  );
}
