export type DomainView =
  | 'MODULE_INDEX' | 'PLAN_GRAPH' | 'MANOJOS3_RUN' | 'VX13_DOMAIN_LENSES'
  | 'SHUB_AUDIO' | 'BROWSER' | 'BUILD' | 'FILES_CLOUD'
  | 'MADRE' | 'SWITCH' | 'HERMES' | 'MANIFESTATOR' | 'SPAWNER' | 'HORMIGUERO';

export interface DomainViewDescriptor {
  id: DomainView;
  lazy: true;
  allowlisted: true;
  writer: false;
  fallback: 'GENERIC_READONLY';
}

export function descriptor(id: DomainView): DomainViewDescriptor {
  return { id, lazy:true, allowlisted:true, writer:false, fallback:'GENERIC_READONLY' };
}
