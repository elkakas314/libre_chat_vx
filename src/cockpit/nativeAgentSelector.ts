/** Open LibreChat's existing selector; the user chooses an authorized agent there. */
export function openNativeAgentSelector(button: {
  disabled:boolean;
  getClientRects():{length:number};
  getAttribute(name:string):string|null;
  focus():void;
  click():void;
}|null):boolean {
  if(!button||button.disabled||button.getClientRects().length===0)return false;
  button.focus();
  if(button.getAttribute('aria-expanded')!=='true')button.click();
  return true;
}
