import React from 'react';
import type { ConcreteTargetId } from '../cockpit/systemTarget';

export type BackgroundTaskClass =
  | 'LIBRECHAT_TOOL_CALL'
  | 'COGNITIVE_SUBAGENT'
  | 'TARGET_RUN';

export interface BackgroundTaskProjection {
  taskRef: string;
  taskClass: BackgroundTaskClass;
  systemScope: 'LIBRECHAT' | ConcreteTargetId;
  authorityOwnerRef?: string;
  state: 'QUEUED' | 'RUNNING' | 'WAITING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  resultRef?: string;
  controls: Array<'STEER' | 'QUEUE' | 'INTERRUPT' | 'CANCEL' | 'COLLECT'>;
}

export function BackgroundTasksView({ tasks }: { tasks: BackgroundTaskProjection[] }) {
  return (
    <section aria-label="Background tasks" data-testid="vx-background-tasks">
      <h2>Background Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.taskRef}>
            {task.taskClass}:{task.systemScope}:{task.taskRef} · {task.state}
            {' '}authority:{task.authorityOwnerRef ?? 'NONE_IN_UI'}
            {' '}controls:{task.controls.join(',')}
            {' '}result:{task.resultRef ?? '—'}
          </li>
        ))}
      </ul>
    </section>
  );
}
