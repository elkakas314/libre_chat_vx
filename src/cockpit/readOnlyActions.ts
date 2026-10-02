export type ReadOnlyAction =
  | 'EXPLAIN'
  | 'OPEN_EVIDENCE'
  | 'READ_LAST_GAP'
  | 'COPY_CONTEXT'
  | 'PREPARE_AUDIT'
  | 'DISMISS_LOCAL';

export function hasMaterialEffect(_action: ReadOnlyAction): false {
  return false;
}
