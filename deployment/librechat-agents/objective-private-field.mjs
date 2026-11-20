import { createHash } from 'node:crypto';

// Pinned existing upstream artifacts. No file is written by this module.
export const EXPECTED={
  schema:'1ef315f8504e3e658d60f07f9525b0f288f149979c249273fa47272d8b66a011',
  methods:'c829e1033b5de2259d519f39e7dd35173ba616dddbd7d98b76ac50f950225c7c',
  compiled:'7255af98e3058105f8387d054efef34843f6b26f212d40324cd109d496428196',
  esm:'b40c3e3724bd895be7c155d5c51e2423d4535780580d71b39093c3f62127e933',
};
const schemaIndex='convoSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });';
const sourceField="  'agentEventActorSuspension',\n] as const;";
const compiledField='\t"agentEventActorSuspension"\n];';
const privateSchema="convoSchema.add({ nostromoObjectiveAgreement: { type: Schema.Types.Mixed, select: false, default: undefined } } as never);\n";
const privateCompiled='convoSchema.add({ nostromoObjectiveAgreement: { type: mongoose.Schema.Types.Mixed, select: false, default: void 0 } });\n';

function replaceOnce(source,anchor,replacement){
 if(source.split(anchor).length!==2)throw Error('OBJECTIVE_PRIVATE_FIELD_CONTEXT_MISMATCH');
 return source.replace(anchor,replacement);
}
export function patchObjectivePrivateField(input){
 for(const key of Object.keys(EXPECTED)){
  if(typeof input[key]!=='string'||createHash('sha256').update(input[key]).digest('hex')!==EXPECTED[key])
    throw Error('OBJECTIVE_PRIVATE_FIELD_PREIMAGE_MISMATCH:'+key);
 }
 return {
  schema:replaceOnce(input.schema,schemaIndex,privateSchema+schemaIndex),
  methods:replaceOnce(input.methods,sourceField,"  'agentEventActorSuspension',\n  'nostromoObjectiveAgreement',\n] as const;"),
  compiled:replaceOnce(replaceOnce(input.compiled,schemaIndex,privateCompiled+schemaIndex),compiledField,'\t"agentEventActorSuspension",\n\t"nostromoObjectiveAgreement"\n];'),
  esm:replaceOnce(replaceOnce(input.esm,schemaIndex,privateCompiled+schemaIndex),compiledField,'\t"agentEventActorSuspension",\n\t"nostromoObjectiveAgreement"\n];'),
 };
}
