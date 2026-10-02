import React from 'react';
import type { SystemTarget } from '../cockpit/systemTarget';
import type { CurrentFocus } from '../cockpit/currentFocus';
import type { TentacleHudModel } from '../cockpit/tentacleHud';
import type { TargetParityTruth } from '../adapters/targetParity';
import type { CapabilityCatalogItem } from '../cockpit/capabilityLens';
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
import { TargetNavigator } from './TargetNavigator';
import { TentacleHud } from './TentacleHud';
import { MinimalTruthView } from './MinimalTruthView';
import { ContextInspectorView } from './ContextInspectorView';
import { DecisionInboxView } from './DecisionInboxView';
import { ArtifactDockView } from './ArtifactDockView';
import { ModuleIndexView } from './ModuleIndexView';
import { CapabilityLensView } from './CapabilityLensView';
import { TargetRunView } from './TargetRunView';
import { FilesPanelView } from './FilesPanelView';
import { AudioPanelView } from './AudioPanelView';
import { BrowserPanelView } from './BrowserPanelView';
import { BuildPanelView } from './BuildPanelView';
import { BackgroundTasksView } from './BackgroundTasksView';
import { ControlDeckView } from './ControlDeckView';

export interface NostromoCockpitProps {
  target: SystemTarget;
  hud: TentacleHudModel;
  focus?: CurrentFocus;
  targetTruth: TargetParityTruth[];
  activeTruth: TargetParityTruth;
  windows: CockpitWindow[];
  decisions?: DecisionCard[];
  artifacts?: DockItem[];
  modules?: ModuleVisualCard[];
  capabilities?: CapabilityCatalogItem[];
  run?: TargetRunProjection;
  files?: ExternalResourceRef[];
  audio?: AudioPanelProjection;
  browser?: BrowserView;
  builds?: BuildPanelItem[];
  backgroundTasks?: BackgroundTaskProjection[];
  authorityRef?: string;
  onTargetChange?: (target: SystemTarget) => void;
}

export function NostromoCockpit(props: NostromoCockpitProps) {
  const has = (window: CockpitWindow) => props.windows.includes(window);
  return (
    <div aria-label="Nostromo cockpit" data-testid="vx-nostromo-cockpit">
      <TargetNavigator target={props.target} onChange={props.onTargetChange} />
      <TentacleHud model={props.hud} />
      {has('MINIMAL_TRUTH') ? <MinimalTruthView targets={props.targetTruth} /> : null}
      {has('CONTEXT_INSPECTOR') ? <ContextInspectorView focus={props.focus} /> : null}
      {has('DECISION_INBOX') ? <DecisionInboxView decisions={props.decisions ?? []} /> : null}
      {has('ARTIFACT_DOCK') ? <ArtifactDockView items={props.artifacts ?? []} /> : null}
      {has('MODULE_INDEX') ? <ModuleIndexView modules={props.modules ?? []} /> : null}
      {has('CAPABILITY_LENSES') ? <CapabilityLensView capabilities={props.capabilities ?? []} /> : null}
      {has('TARGET_RUN') && props.run ? <TargetRunView run={props.run} /> : null}
      {has('FILES') ? <FilesPanelView resources={props.files ?? []} /> : null}
      {has('AUDIO') ? <AudioPanelView projection={props.audio} /> : null}
      {has('BROWSER') ? <BrowserPanelView view={props.browser} /> : null}
      {has('BUILD') ? <BuildPanelView items={props.builds ?? []} /> : null}
      {has('BACKGROUND_TASKS') ? <BackgroundTasksView tasks={props.backgroundTasks ?? []} /> : null}
      <ControlDeckView target={props.activeTruth} authorityRef={props.authorityRef} />
    </div>
  );
}
