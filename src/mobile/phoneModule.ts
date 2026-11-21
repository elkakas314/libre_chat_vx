/** NOSTROMO phone surface — source-only orchestration and truth gates.
 * One LibreChat backend; no iOS daemon, admin controller, token relay or
 * duplicate task executor. Real observations must come from the owner.
 */
import {chooseRemoteAccess,type RemoteAccessMode,type RemoteAccessSignals} from './remoteAccess';
import {mobileLibreChatState,type MobileLibreChatState} from './mobileContinuity';

export type PhonePlatform='IOS'|'ANDROID'|'UNKNOWN';
export type PhoneTaskState='QUEUED'|'RUNNING'|'WAITING'|'SUCCEEDED'|'FAILED'|'CANCELLED'|'UNKNOWN_OUTCOME';
export interface PhoneTaskEvidence {
  taskRef:string;
  title:string;
  state:PhoneTaskState;
  owner:'LIBRECHAT'|'NOSTROMO_MCP'|'EXTERNAL_TARGET';
  receiptRef?:string;
  observedAt?:string;
}
export interface PhoneDeviceObservation {
  platform:PhonePlatform;
  deviceLabel?:string;
  iosVersion?:string;
  networkReachable:boolean;
  backendReachable:boolean;
  authenticated:boolean;
  snapshotFresh:boolean;
  tailnetAuthorized:boolean;
  tailscaleServeReachable:boolean;
  publicEdgeEnabled:boolean;
  cloudflareAccessAuthenticated:boolean;
  publicEdgeReachable:boolean;
  nativeClientVerified:boolean;
  shortcutBridgeVerified:boolean;
  evidenceRef?:string;
  observedAt?:string;
}
export interface PhoneModuleSnapshot {
  sourceOnly:boolean;
  platform:PhonePlatform;
  deviceLabel?:string;
  state:MobileLibreChatState;
  access:RemoteAccessMode;
  accessReason:string;
  currentConversationId?:string;
  connectionVerified:boolean;
  nativeClientVerified:boolean;
  shortcutBridgeVerified:boolean;
  iosRemoteControlAvailable:false;
  tasks:readonly PhoneTaskEvidence[];
  observedAt?:string;
  evidenceRef?:string;
  noAutomaticReplay:true;
  authority:false;
}
export interface PhoneActionPlan {
  action:'VIEW_CONVERSATION'|'HANDOFF_CONVERSATION'|'IOS_SHORTCUT'|'REMOTE_IOS_CONTROL';
  disposition:'READ_ONLY'|'PREPARE_CONSENT'|'DENIED';
  reason:string;
  requiresFreshSession:boolean;
  requiresDeviceConsent:boolean;
  materialExecuted:false;
  authority:false;
}

/** Without an authenticated device readback: remain SOURCE_ONLY.
 * No simulated status should be passed off as a real mobile connection.
 */
export function createPhoneModuleSnapshot(
  observation?:PhoneDeviceObservation,
  tasks:readonly PhoneTaskEvidence[]=[],
  conversationId?:string,
):PhoneModuleSnapshot {
  if(!observation)return {
    sourceOnly:true,platform:'UNKNOWN',state:'UNAVAILABLE',
    access:'UNAVAILABLE',accessReason:'DEVICE_READBACK_MISSING',
    ...(conversationId?{currentConversationId:conversationId}:{}),
    connectionVerified:false,nativeClientVerified:false,
    shortcutBridgeVerified:false,iosRemoteControlAvailable:false,
    tasks:[],noAutomaticReplay:true,authority:false,
  };
  const routes:RemoteAccessSignals={
    localBackendReachable:observation.backendReachable && observation.networkReachable &&
      !observation.tailnetAuthorized && !observation.publicEdgeEnabled,
    tailnetAuthorized:observation.tailnetAuthorized,
    tailscaleServeReachable:observation.tailscaleServeReachable,
    publicEdgeEnabled:observation.publicEdgeEnabled,
    cloudflareAccessAuthenticated:observation.cloudflareAccessAuthenticated,
    publicEdgeReachable:observation.publicEdgeReachable,
  };
  const access=chooseRemoteAccess(routes);
  const connected=observation.backendReachable && observation.authenticated &&
    observation.networkReachable && access.mode!=='UNAVAILABLE' &&
    Boolean(observation.evidenceRef && observation.observedAt);
  const state=mobileLibreChatState({
    networkReachable:observation.networkReachable,
    backendReachable:observation.backendReachable && access.mode!=='UNAVAILABLE',
    authenticated:connected,
    snapshotFresh:observation.snapshotFresh,
    snapshotAvailable:observation.snapshotFresh,
  });
  return {
    sourceOnly:!connected,platform:observation.platform,
    ...(observation.deviceLabel?{deviceLabel:observation.deviceLabel}:{}),
    state,access:access.mode,accessReason:access.reason,
    ...(conversationId?{currentConversationId:conversationId}:{}),
    connectionVerified:connected,nativeClientVerified:connected&&observation.nativeClientVerified,
    shortcutBridgeVerified:connected&&observation.shortcutBridgeVerified,
    iosRemoteControlAvailable:false,
    tasks:connected?tasks.filter(x=>Boolean(x.taskRef&&x.title)):[],
    ...(observation.observedAt?{observedAt:observation.observedAt}:{}),
    ...(observation.evidenceRef?{evidenceRef:observation.evidenceRef}:{}),
    noAutomaticReplay:true,authority:false,
  };
}
/** UI prepares only; the owning phone and target must validate consent,
 * authentication, exact action and fresh evidence. Nothing executes here.
 */
export function planPhoneAction(
  snapshot:PhoneModuleSnapshot,
  action:PhoneActionPlan['action'],
):PhoneActionPlan {
  if(action==='REMOTE_IOS_CONTROL')return {
    action,disposition:'DENIED',reason:'IOS_GENERAL_REMOTE_CONTROL_UNSUPPORTED',
    requiresFreshSession:true,requiresDeviceConsent:true,
    materialExecuted:false,authority:false,
  };
  if(!snapshot.connectionVerified||snapshot.state!=='INTERACTIVE')return {
    action,disposition:'DENIED',reason:'AUTHENTICATED_FRESH_PHONE_SESSION_REQUIRED',
    requiresFreshSession:true,requiresDeviceConsent:action==='IOS_SHORTCUT',
    materialExecuted:false,authority:false,
  };
  if(action==='IOS_SHORTCUT')return {
    action,disposition:snapshot.platform==='IOS'&&snapshot.shortcutBridgeVerified
      ?'PREPARE_CONSENT':'DENIED',
    reason:snapshot.platform==='IOS'&&snapshot.shortcutBridgeVerified
      ?'DEVICE_CONSENT_AND_EXACT_SHORTCUT_BINDING_REQUIRED':'IOS_SHORTCUT_NOT_VERIFIED',
    requiresFreshSession:true,requiresDeviceConsent:true,materialExecuted:false,authority:false,
  };
  if(action==='HANDOFF_CONVERSATION'&&!snapshot.currentConversationId)return {
    action,disposition:'DENIED',reason:'CONVERSATION_ID_REQUIRED',
    requiresFreshSession:true,requiresDeviceConsent:false,materialExecuted:false,authority:false,
  };
  return {action,disposition:'READ_ONLY',reason:'NATIVE_LIBRECHAT_SESSION_ONLY',
    requiresFreshSession:true,requiresDeviceConsent:false,materialExecuted:false,authority:false};
}
