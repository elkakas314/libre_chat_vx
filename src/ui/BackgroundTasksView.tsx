import React from 'react';

export interface BackgroundTaskProjection {
  taskRef: string;
  owner: 'LIBRECHAT' | 'MANOJOS3' | 'VX13';
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
            {task.owner}:{task.taskRef} · {task.state}
            {' '}controls:{task.controls.join(',')}
            {' '}result:{task.resultRef ?? '—'}
          </li>
        ))}
      </ul>
    </section>
  );
}
