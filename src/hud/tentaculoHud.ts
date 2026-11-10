/** NOSTROMO/Tentaculo HUD tri-system projection.
 * No owner action, service discovery, network request or execution is performed here.
 */
export type HudSystem='MANOJOS'|'VX13'|'ORACULO';
export type HudState='VERIFIED_READ'|'DESIGN_ONLY'|'UNCONFIGURED'|'DEGRADED'|'STALE'|'NO_VERIFICADO';
export interface HudObservation {
  system:HudSystem;
  /** MANOJOS3 is accepted solely as a *runtime identity* in the MANOJOS transition. */
  reportedProject:string;
  status:'READY'|'DEGRADED'|'DOWN'|'UNKNOWN'|'DESIGN';
  observedAt?:string;
  peerVerified:boolean;
  receiptRef?:string;
  evidenceRefs:readonly string[];
  description?:string;
}
export interface HudProjection {
  system:HudSystem;
  label:string;
  subtitle:string;
  state:HudState;
  observedAt?:string;
  evidenceRefs:readonly string[];
  receiptRef?:string;
  authority:false;
  readOnly:true;
  canCreateAgentCandidate:boolean;
}
const systems:readonly HudSystem[]=['MANOJOS','VX13','ORACULO'];
const ids:Record<HudSystem,readonly string[]>={
  MANOJOS:['MANOJOS','MANOJOS3'],
  VX13:['VX13'],ORACULO:['ORACULO','ORÁCULO'],
};
const label:Record<HudSystem,string>={
  MANOJOS:'MANOJOS',VX13:'VX13',ORACULO:'ORÁCULO',
};
const subtitle:Record<HudSystem,string>={
  MANOJOS:'Constructor y operación gobernada',
  VX13:'Tentáculo Link · Madre · módulos',
  ORACULO:'Investigación y verificación consultiva',
};
const fresh=(date:string|undefined,now:number)=> {
  if(!date)return false;
  const observed=Date.parse(date);
  return Number.isFinite(observed)&&observed<=now&&now-observed<=300_000;
};
const proof=(refs:readonly string[]|undefined)=>Array.isArray(refs)&&
  refs.length>0&&refs.length<=16&&refs.every(x=>typeof x==='string'&&
    x.length>=8&&x.length<=300&&/^[A-Za-z0-9][A-Za-z0-9_.:/-]+$/.test(x));
export function projectTentaculoHud(observations:readonly HudObservation[],
  nowMs:number=Date.now()):readonly HudProjection[] {
  return systems.map(system=>{
    const rows=observations.filter(x=>x.system===system);
    const trusted=rows.filter(x=>ids[system].includes(x.reportedProject)&&
      x.peerVerified===true&&proof(x.evidenceRefs)&&fresh(x.observedAt,nowMs));
    const row=trusted.sort((a,b)=>Date.parse(b.observedAt!)-Date.parse(a.observedAt!))[0];
    const state:HudState= !rows.length?'UNCONFIGURED':
      !row?(rows.some(x=>x.status==='DESIGN')?'DESIGN_ONLY':'NO_VERIFICADO'):
      row.status==='READY'?'VERIFIED_READ':
      row.status==='DEGRADED'?'DEGRADED':
      row.status==='DESIGN'?'DESIGN_ONLY':'STALE';
    return {system,label:label[system],subtitle:subtitle[system],state,
      ...(row?.observedAt&&{observedAt:row.observedAt}),
      evidenceRefs:row?.evidenceRefs??[],...(row?.receiptRef&&{receiptRef:row.receiptRef}),
      authority:false,readOnly:true,
      canCreateAgentCandidate:true};
  });
}
export type HubSystem=HudSystem|'NOSTROMO';
export type HubItemKind='SYSTEM'|'MODULE'|'CAPABILITY'|'AGENT';
export interface HubItem {id:string;system:HubSystem;kind:HubItemKind;
  label:string;parentId?:string; sourceRef:string; status:'SOURCE'|'LIVE';}
export function createTentaculoHubTree(items:readonly HubItem[]):{
  roots:readonly HubItem[];children:Record<string,readonly HubItem[]>;
} {
  const hubSystems:readonly HubSystem[]=['NOSTROMO',...systems];
  const seen=new Set<string>();
  for(const item of items){
    if(!item.id||seen.has(item.id)||!hubSystems.includes(item.system)||!item.sourceRef)
      throw Error('HUB_ITEM_ID_OR_SOURCE_INVALID');
    seen.add(item.id);
  }
  const byId=new Map(items.map(x=>[x.id,x]));
  const children:Record<string,HubItem[]>={},roots:HubItem[]=[];
  for(const item of items){
    if(item.parentId){
      const parent=byId.get(item.parentId);
      if(!parent||parent.system!==item.system||parent.id===item.id)
        throw Error('HUB_PARENT_INVALID');
      (children[parent.id]??=[]).push(item);
    }else roots.push(item);
  }
  for(const item of items){
    let walk:HubItem|undefined=item;
    const chain=new Set<string>();
    while(walk?.parentId){
      if(chain.has(walk.id))throw Error('HUB_CYCLE_REJECTED');
      chain.add(walk.id);walk=byId.get(walk.parentId);
    }
  }
  return {roots,children};
}
/** NOSTROMO agent is a view onto Hub; may suggest a candidate but never deploy it. */
export function hubAgentCandidate(item:HubItem) {
  return {schema:'libre-chat-vx.hub-agent-candidate.v1' as const,
    itemId:item.id,target:item.system,name:item.label,authority:false as const,
    state:'PROPOSED_NOT_INSTALLED' as const,
    route:item.system==='NOSTROMO'?'NOSTROMO_LOCAL_MCP_PROPOSAL_ONLY':
      item.system==='VX13'?'TENTACULO_LINK_ONLY':
      item.system==='ORACULO'?'ADVISORY_READ_ONLY':'MANOJOS_GOVERNED',
    sourceRef:item.sourceRef};
}
