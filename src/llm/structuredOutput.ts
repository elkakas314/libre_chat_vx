import { SEMANTIC_PROFILES, type SemanticProfileId } from './inferenceGateway';

export interface StructuredCognitiveEnvelope {
  answer: string;
  profile: SemanticProfileId;
  confidence?: number;
  requestedCapabilities?: readonly string[];
}

export interface StructuredValidationResult {
  valid: boolean;
  value?: StructuredCognitiveEnvelope;
  errors: readonly string[];
}

const FORBIDDEN_MATERIAL_KEYS=new Set([
  'authorized',
  'authorization',
  'verified',
  'receipt',
  'receiptref',
  'evidenceref',
  'pass',
]);

function findForbiddenKeys(value:unknown, path='$', found:string[]=[]):string[] {
  if (Array.isArray(value)) {
    value.forEach((item,index)=>findForbiddenKeys(item,path+'['+index+']',found));
    return found;
  }
  if (!value || typeof value!=='object') return found;
  for (const [key,child] of Object.entries(value as Record<string,unknown>)) {
    const normalized=key.replace(/[_-]/g,'').toLowerCase();
    if (FORBIDDEN_MATERIAL_KEYS.has(normalized)) found.push(path+'.'+key);
    findForbiddenKeys(child,path+'.'+key,found);
  }
  return found;
}

export function validateStructuredCognitiveEnvelope(value:unknown):StructuredValidationResult {
  const errors:string[]=[];
  const forbidden=findForbiddenKeys(value);
  if (forbidden.length>0) errors.push('MATERIAL_AUTHORITY_FIELDS_FORBIDDEN:'+forbidden.join(','));

  if (!value || typeof value!=='object' || Array.isArray(value)) {
    return {valid:false,errors:[...errors,'OBJECT_REQUIRED']};
  }
  const obj=value as Record<string,unknown>;
  if (typeof obj.answer!=='string' || obj.answer.trim()==='') errors.push('ANSWER_REQUIRED');
  if (typeof obj.profile!=='string' || !(obj.profile in SEMANTIC_PROFILES)) errors.push('PROFILE_INVALID');
  if (obj.confidence!==undefined && (typeof obj.confidence!=='number' || obj.confidence<0 || obj.confidence>1)) {
    errors.push('CONFIDENCE_INVALID');
  }
  if (obj.requestedCapabilities!==undefined && (!Array.isArray(obj.requestedCapabilities) || !obj.requestedCapabilities.every((v)=>typeof v==='string'))) {
    errors.push('REQUESTED_CAPABILITIES_INVALID');
  }
  if (errors.length>0) return {valid:false,errors};

  return {
    valid:true,
    value:{
      answer:(obj.answer as string).trim(),
      profile:obj.profile as SemanticProfileId,
      confidence:obj.confidence as number|undefined,
      requestedCapabilities:obj.requestedCapabilities as readonly string[]|undefined,
    },
    errors:[],
  };
}

export function parseStructuredCognitiveEnvelope(json:string):StructuredValidationResult {
  try {
    return validateStructuredCognitiveEnvelope(JSON.parse(json));
  } catch {
    return {valid:false,errors:['JSON_PARSE_FAILED']};
  }
}
