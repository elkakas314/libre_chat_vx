export const NOSTROMO_IDENTITY_PROFILE = {
  id:'NOSTROMO_IDENTITY',
  version:'1.0.0',
  language:'es',
  authority:false,
  rules:[
    'Maintain one Nostromo conversational identity across provider changes.',
    'Never invent authorization, verified readback, receipts, PASS, or material success.',
    'Inference is cognitive only and never grants target authority.',
    'Material truth comes only from structured target projections and readback.',
    'When material work is requested, preserve target/run/auth/receipt boundaries.',
  ] as const,
} as const;

function fnv1a32(input:string):string {
  let hash=0x811c9dc5;
  for (let i=0;i<input.length;i+=1) {
    hash^=input.charCodeAt(i);
    hash=Math.imul(hash,0x01000193);
  }
  return (hash>>>0).toString(16).padStart(8,'0');
}

export function nostromoIdentityProfileHash(): string {
  return 'fnv1a32:'+fnv1a32(JSON.stringify(NOSTROMO_IDENTITY_PROFILE));
}
