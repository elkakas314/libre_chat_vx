import React from 'react';
import type { TargetScope } from '../cockpit/systemTarget';
import type { CurrentFocus } from '../cockpit/currentFocus';
import type { TentacleHudModel } from '../cockpit/tentacleHud';
import type { TargetParityTruth } from '../adapters/targetParity';
import type { CapabilityCatalogItem } from '../cockpit/capabilityLens';
import type { Manojos3InterflowDomain } from '../manojos3/interflowProjection';
import type { NativeSurfaceBindingDescriptor } from '../librechat/nativeSurfaceBinding';
import type { HybridRuntimeMode, NostromoHybridArchitecture } from '../llm/nostromoHybrid';
import type { TargetRunProjection } from '../cockpit/targetRun';
import type { DockItem } from '../cockpit/artifactDock';
import type { DecisionCard } from '../cockpit/decisionInbox';
import type { ModuleVisualCard } from '../cockpit/moduleVisualCard';
import type { ExternalResourceRef } from '../files/externalResourceRef';
import type { ResourceNode } from '../resources/resourceTree';
import type { AudioPanelProjection } from '../audio/audioPanel';
import type { BrowserView } from '../browser/browserView';
import type { BuildPanelItem } from '../build/buildPanel';
import type { CockpitWindow } from '../cockpit/windowRouter';
import type { BackgroundTaskProjection } from './BackgroundTasksView';
import type { PlanNode } from './PlanGraphView';
import type { FlowEdge } from '../cockpit/activeFlow';
import type { StatusRailState } from '../cockpit/statusRail';
import { TargetScopeNavigator } from './TargetNavigator';
import { TentacleHud } from './TentacleHud';
import { MinimalTruthView } from './MinimalTruthView';
import { ContextInspectorView } from './ContextInspectorView';
import { DecisionInboxView } from './DecisionInboxView';
import { ArtifactDockView } from './ArtifactDockView';
import { ModuleIndexView } from './ModuleIndexView';
import { InterflowLensView } from './InterflowLensView';
import { CapabilityLensView } from './CapabilityLensView';
import { NativeSurfaceStatusView } from './NativeSurfaceStatusView';
import { NostromoHybridView } from './NostromoHybridView';
import { TargetRunView } from './TargetRunView';
import { FilesPanelView } from './FilesPanelView';
import { ResourceTreeView } from './ResourceTreeView';
import { AudioPanelView } from './AudioPanelView';
import { BrowserPanelView } from './BrowserPanelView';
import { BuildPanelView } from './BuildPanelView';
import { BackgroundTasksView } from './BackgroundTasksView';
import { ControlDeckView } from './ControlDeckView';
import { PlanGraphView } from './PlanGraphView';
import { ActiveFlowView } from './ActiveFlowView';
import { StatusRailView } from './StatusRailView';

export interface NostromoCockpitProps {
  scope: TargetScope;
  hud: TentacleHudModel;
  focus?: CurrentFocus;
  targetTruth: TargetParityTruth[];
  activeTruth?: TargetParityTruth;
  windows: CockpitWindow[];
  decisions?: DecisionCard[];
  artifacts?: DockItem[];
  modules?: ModuleVisualCard[];
  resources?: readonly ResourceNode[];
  expandedResourceIds?: ReadonlySet<string>;
  onResourceToggle?: (node: ResourceNode) => void;
  interflowDomains?: readonly Manojos3InterflowDomain[];
  nativeSurfaceBindings?: readonly NativeSurfaceBindingDescriptor[];
  hybridArchitecture?: NostromoHybridArchitecture;
  hybridMode?: HybridRuntimeMode;
  capabilities?: CapabilityCatalogItem[];
  run?: TargetRunProjection;
  files?: ExternalResourceRef[];
  audio?: AudioPanelProjection;
  browser?: BrowserView;
  builds?: BuildPanelItem[];
  backgroundTasks?: BackgroundTaskProjection[];
  status?: StatusRailState;
  planNodes?: PlanNode[];
  flowEdges?: FlowEdge[];
  authorizationRef?: string;
  capabilityRef?: string;
  onScopeChange?: (scope: TargetScope) => void;
}

export function NostromoCockpit(props: NostromoCockpitProps) {
  const has = (window: CockpitWindow) => props.windows.includes(window);
  return (
    <div aria-label="Nostromo cockpit" data-testid="vx-nostromo-cockpit">
      {has('STATUS_RAIL') && props.status ? <StatusRailView state={props.status} /> : null}
      <TargetScopeNavigator scope={props.scope} onChange={props.onScopeChange} />
      <TentacleHud model={props.hud} />
      {has('MINIMAL_TRUTH') ? <MinimalTruthView targets={props.targetTruth} /> : null}
      {has('CONTEXT_INSPECTOR') ? <ContextInspectorView focus={props.focus} /> : null}
      {has('DECISION_INBOX') ? <DecisionInboxView decisions={props.decisions ?? []} /> : null}
      {has('ARTIFACT_DOCK') ? <ArtifactDockView items={props.artifacts ?? []} /> : null}
      {has('MODULE_INDEX') ? <ModuleIndexView modules={props.modules ?? []} /> : null}
      {has('RESOURCE_TREE') ? (
        <ResourceTreeView
          nodes={props.resources ?? []}
          expandedIds={props.expandedResourceIds}
          onToggle={props.onResourceToggle}
        />
      ) : null}
      {has('INTERFLOW_MAP') ? <InterflowLensView domains={props.interflowDomains ?? []} /> : null}
      {has('PLAN_GRAPH') && props.planNodes ? <PlanGraphView nodes={props.planNodes} /> : null}
      {has('ACTIVE_FLOW') && props.flowEdges ? <ActiveFlowView edges={props.flowEdges} /> : null}
      {has('CONVERSATION_CORE') && props.hybridArchitecture && props.hybridMode
        ? <NostromoHybridView architecture={props.hybridArchitecture} mode={props.hybridMode} />
        : null}
      {has('CAPABILITY_LENSES') ? <CapabilityLensView capabilities={props.capabilities ?? []} /> : null}
      {has('NATIVE_SURFACES') ? <NativeSurfaceStatusView bindings={props.nativeSurfaceBindings ?? []} /> : null}
      {has('TARGET_RUN') && props.run ? <TargetRunView run={props.run} /> : null}
      {has('FILES') ? <FilesPanelView resources={props.files ?? []} /> : null}
      {has('AUDIO') ? <AudioPanelView projection={props.audio} /> : null}
      {has('BROWSER') ? <BrowserPanelView view={props.browser} /> : null}
      {has('BUILD') ? <BuildPanelView items={props.builds ?? []} /> : null}
      {has('BACKGROUND_TASKS') ? <BackgroundTasksView tasks={props.backgroundTasks ?? []} /> : null}
      <ControlDeckView
        scope={props.scope}
        target={props.activeTruth}
        authorizationRef={props.authorizationRef}
        capabilityRef={props.capabilityRef}
      />
    </div>
  );
}
