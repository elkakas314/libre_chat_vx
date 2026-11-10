/** Owner-configured catalogue for ONE MCP server; never executes module text from chat. */
export const catalog=Object.freeze([
 {name:'nostromo_estado',group:'ESTADO',description:'Estado del servidor local'},
 {name:'nostromo_herramientas',group:'CATALOGO',description:'Lista las herramientas registradas'},
 {name:'nostromo_terminal_preparar',group:'TERMINAL',description:'Prepara comando y riesgo sin ejecutarlo'},
 {name:'nostromo_terminal_ejecutar',group:'TERMINAL',description:'Ejecuta y devuelve stdout, stderr y código de salida'},
]);
const known=new Set(catalog.map(x=>x.name));
export function selectedTools(raw) {
  const mandatory=['nostromo_estado','nostromo_herramientas'];
  const names=raw===undefined?catalog.map(x=>x.name):
    String(raw).split(',').map(x=>x.trim()).filter(Boolean);
  if(new Set(names).size!==names.length||names.some(x=>!known.has(x)))
    throw Error('NOSTROMO_TOOL_CATALOG_INVALID');
  return new Set([...mandatory,...names]);
}
export function describeTools(enabled){
  return catalog.map(x=>({...x,enabled:enabled.has(x.name)}));
}
