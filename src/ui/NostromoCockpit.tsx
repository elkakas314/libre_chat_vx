import React from 'react';
import type { TargetScope } from '../cockpit/systemTarget';
import type { CurrentFocus } from '../cockpit/currentFocus';
import type { TentacleHudModel } from '../cockpit/tentacleHud';
import type { TargetParityTruth } from '../adapters/targetParity';
import type { CapabilityCatalogItem } from '../cockpit/capabilityLens';
import type { Manojos3InterflowDomain } from '../manojos3/interflowProjection';
import type { TargetRunProjection } from '../cockpit/targetRun';
import type { DockItem } from '../cockpit/artifactDock';
import type { DecisionCard } from '../cockpit/decisionInbox';
import type { ModuleVisualCard } from '../cockpit/moduleVisualCard';
import type { ExternalResourceRef } from '../files/externalResourceRef';
import type { AudioPanelProjection } from '../audio/audioPanel';
import type { BrowserView } from '../browser/browserView';
import type { BuildPanelItem } from '../build/buildPanel';
import type { CockpitWindow } from '../cockpit/windowRouter';
import type { BackgroundTaskProjection } from './BackgroundTasksView';
import { TargetScopeNavigator } from './TargetNavigator';
import { TentacleHud } from './TentacleHud';
import { MinimalTruthView } from './MinimalTruthView';
import { ContextInspectorView } from './ContextInspectorView';
import { DecisionInboxView } from './DecisionInboxView';
import { ArtifactDockView } from './ArtifactDockView';
import { ModuleIndexView } from './ModuleIndexView';
import { InterflowLensView } from './InterflowLensView';
import { CapabilityLensView } from './CapabilityLensView';
import { TargetRunView } from './TargetRunView';
import { FilesPanelView } from './FilesPanelView';
import { AudioPanelView } from './AudioPanelView';
import { BrowserPanelView } from './BrowserPanelView';
import { BuildPanelView } from './BuildPanelView';
import { BackgroundTasksView } from './BackgroundTasksView';
import { ControlDeckView } from './ControlDeckView';

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
  interflowDomains?: readonly Manojos3InterflowDomain[];
  capabilities?: CapabilityCatalogItem[];
  run?: TargetRunProjection;
  files?: ExternalResourceRef[];
  audio?: AudioPanelProjection;
  browser?: BrowserView;
  builds?: BuildPanelItem[];
  backgroundTasks?: BackgroundTaskProjection[];
  authorizationRef?: string;
  capabilityRef?: string;
  onScopeChange?: (scope: TargetScope) => void;
}

export function NostromoCockpit(props: NostromoCockpitProps) {
  const has = (window: CockpitWindow) => props.windows.includes(window);
  return (
    <div aria-label="Nostromo cockpit" data-testid="vx-nostromo-cockpit">
      <TargetScopeNavigator scope={props.scope} onChange={props.onScopeChange} />
      <TentacleHud model={props.hud} />
      {has('MINIMAL_TRUTH') ? <MinimalTruthView targets={props.targetTruth} /> : null}
      {has('CONTEXT_INSPECTOR') ? <ContextInspectorView focus={props.focus} /> : null}
      {has('DECISION_INBOX') ? <DecisionInboxView decisions={props.decisions ?? []} /> : null}
      {has('ARTIFACT_DOCK') ? <ArtifactDockView items={props.artifacts ?? []} /> : null}
      {has('MODULE_INDEX') ? <ModuleIndexView modules={props.modules ?? []} /> : null}
      {has('INTERFLOW_MAP') ? <InterflowLensView domains={props.interflowDomains ?? []} /> : null}
      {has('CAPABILITY_LENSES') ? <CapabilityLensView capabilities={props.capabilities ?? []} /> : null}
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
