/** Owner-configured catalogue for ONE MCP server; never executes module text from chat. */
export const catalog=Object.freeze([
 {name:'nostromo_estado',group:'ESTADO',description:'Estado del servidor local'},
 {name:'nostromo_herramientas',group:'CATALOGO',description:'Lista las herramientas registradas'},
 {name:'nostromo_terminal_preparar',group:'TERMINAL',description:'Prepara comando y riesgo sin ejecutarlo'},
 {name:'nostromo_terminal_ejecutar',group:'TERMINAL',description:'Ejecuta y devuelve stdout, stderr y código de salida'},
 {name:'nostromo_archivo_leer',group:'ARCHIVOS_R0',description:'Lee texto limitado dentro de raíces permitidas, sin secretos'},
 {name:'nostromo_git_inspeccionar',group:'GIT_R0',description:'Consulta HEAD, rama, cambios y resumen diff sin modificar Git'},
 {name:'nostromo_metricas',group:'METRICAS_R0',description:'Carga, memoria y disco reales, sin fingir VRAM'},
 {name:'nostromo_tarea_iniciar',group:'CLI_ASYNC',description:'Inicia un único proceso CLI gobernado sin bloquear la respuesta MCP'},
 {name:'nostromo_tarea_estado',group:'CLI_ASYNC',description:'Consulta estado y resultado de tarea por ID opaco'},
 {name:'nostromo_tarea_cancelar',group:'CLI_ASYNC',description:'Solicita cancelación del proceso; readback posterior obligatorio'},
]);
const known=new Set(catalog.map(x=>x.name));
export function selectedTools(raw) {
  const mandatory=['nostromo_estado','nostromo_herramientas'];
  const names=raw===undefined?catalog.slice(0,4).map(x=>x.name):
    String(raw).split(',').map(x=>x.trim()).filter(Boolean);
  if(new Set(names).size!==names.length||names.some(x=>!known.has(x)))
    throw Error('NOSTROMO_TOOL_CATALOG_INVALID');
  const asynchronous=['nostromo_tarea_iniciar','nostromo_tarea_estado','nostromo_tarea_cancelar'];
  const selected=asynchronous.filter(x=>names.includes(x));
  if(selected.length!==0&&selected.length!==asynchronous.length)
    throw Error('NOSTROMO_TOOL_CATALOG_INVALID_ASYNC_TRIO_REQUIRED');
  if(selected.length===3&&names.includes('nostromo_terminal_ejecutar'))
    throw Error('NOSTROMO_TOOL_CATALOG_INVALID_ONE_CLI_EXECUTION_MODE');
  return new Set([...mandatory,...names]);
}
export function describeTools(enabled){
  return catalog.map(x=>({...x,enabled:enabled.has(x.name)}));
}
