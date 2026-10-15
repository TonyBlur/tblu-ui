import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import {icon} from './icons.js';

const active = new Set(), toasts = new WeakMap(), tooltips = new WeakMap();
const connectionTrees = new WeakMap(), connections = new WeakMap();
let nextId = 0;

function watchConnection(api, tree = api.element.getRootNode()) {
  let manager = connectionTrees.get(tree);
  if (!manager) {
    const doc=api.element.ownerDocument;
    manager={items:new Set()};
    manager.observer=new doc.defaultView.MutationObserver(()=>{
      for(const item of [...manager.items])if(!item.element.isConnected||(item.owner&&!item.owner.isConnected))item.destroy();
    });
    manager.observer.observe(tree.nodeType===9?doc.documentElement:tree,{childList:true,subtree:true});
    connectionTrees.set(tree,manager);
  }
  manager.items.add(api);connections.set(api,{tree,manager});
}
function stopConnection(api) {
  const entry=connections.get(api);if(!entry)return;
  entry.manager.items.delete(api);connections.delete(api);
  if(!entry.manager.items.size){entry.manager.observer.disconnect();connectionTrees.delete(entry.tree);}
}

function context(options = {}) {
  const doc = options.document || (options.root?.nodeType === 9 ? options.root : options.root?.ownerDocument) || globalThis.document;
  if (!doc?.createElement || !doc.defaultView) throw new TypeError('Feedback requires a browser document');
  const root = options.root || doc.activeElement?.closest?.('.tblu-root') || doc;
  const container = root.nodeType === 9 || root === doc.documentElement ? doc.body : root;
  if (!container?.append) throw new TypeError('Feedback requires an Element or Document root');
  return {doc,view:doc.defaultView,root,container};
}
function report(target, error, source, onError) {
  const emit = failure => {
    const doc = target.nodeType === 9 ? target : target.ownerDocument;
    target.dispatchEvent(new doc.defaultView.CustomEvent('tblu-error',{bubbles:true,composed:true,detail:{error:failure,source}}));
  };
  if (onError) {
    try { Promise.resolve(onError(error)).catch(emit); return; } catch (handlerError) { error = handlerError; }
  }
  emit(error);
}
function callback(target, onClose, source, onError) {
  try { Promise.resolve(onClose?.()).catch(error=>report(target,error,source,onError)); }
  catch (error) { report(target,error,source,onError); }
}
function decoratedButton(doc, label, glyph, className = 'tblu-icon-button') {
  const button = doc.createElement('button');button.type='button';button.className=className;
  button.setAttribute('aria-label',label);
  if (glyph) { const template=doc.createElement('template');template.innerHTML=icon(glyph);button.append(template.content); }
  else button.textContent=label;
  return button;
}
function transition(element, opening, previous) {
  previous?.cancel();
  const view=element.ownerDocument.defaultView,theme=element.closest('[data-tblu-motion]')||element.ownerDocument.documentElement;
  if (theme.dataset.tbluMotion==='reduced'||view.matchMedia?.('(prefers-reduced-motion: reduce)').matches||!element.animate) return null;
  const style=view.getComputedStyle(theme),token=style.getPropertyValue(opening?'--tblu-motion-enter':'--tblu-motion-exit').trim(),amount=Number.parseFloat(token);
  const duration=Number.isFinite(amount)?amount*(token.endsWith('ms')?1:1000):opening?320:220;
  const opacity=Number.parseFloat(view.getComputedStyle(element).opacity);
  return element.animate(opening?[{opacity:0,scale:.98},{opacity:1,scale:1}]:[{opacity:Number.isFinite(opacity)?opacity:1,scale:1},{opacity:0,scale:.98}],{
    duration,easing:style.getPropertyValue('--tblu-ease').trim()||'cubic-bezier(.22,1,.36,1)',
  });
}
function finishAnimation(animation, target, source, onError) {
  return Promise.resolve(animation?.finished).catch(error=>{if(error?.name!=='AbortError')report(target,error,source,onError);});
}

/**
 * Open a native modal. Content must be a Node; ownHeader:false inserts it directly
 * for applications that already own a complete form/header/footer composition.
 * Action callbacks run synchronously on activation, may return a promise, and
 * close after success unless action.close is false. Failures keep the modal open.
 */
export function openDialog(options = {}) {
  const {title='',content,actions=[],ownHeader=true,initialFocus,closeLabel='Close',onClose,onError}=options;
  if (!content?.nodeType) throw new TypeError('Dialog content must be a Node');
  const {doc,root,container}=context(options),previousFocus=doc.activeElement;
  const element=doc.createElement('dialog');element.className='tblu-dialog';
  element.dataset.tbluSurface='panel';element.dataset.tbluElevation='2';element.setAttribute('aria-label',String(title));
  const removers=[],buttons=[];
  let finished=false,closing,animation,busy=false,api;
  const listen=(target,type,handler)=>{target.addEventListener(type,handler);removers.push(()=>target.removeEventListener(type,handler));};
  const error=doc.createElement('p');error.className='tblu-dialog-error';error.setAttribute('role','alert');error.hidden=true;
  if(ownHeader){
    const header=doc.createElement('header');header.className='tblu-dialog-header';
    const heading=doc.createElement('h2');heading.id=`tblu-dialog-title-${++nextId}`;heading.textContent=String(title);
    element.setAttribute('aria-labelledby',heading.id);element.removeAttribute('aria-label');
    const dismiss=decoratedButton(doc,closeLabel,'X');dismiss.dataset.tbluSize='sm';
    listen(dismiss,'click',()=>close());header.append(heading,dismiss);
    const body=doc.createElement('div');body.className='tblu-dialog-body';body.append(content);element.append(header,body);
  }else element.append(content);
  if(actions.length){
    const footer=doc.createElement('footer');footer.className='tblu-dialog-footer';
    actions.forEach(action=>{
      const button=decoratedButton(doc,String(action.label??''),null,'tblu-button');
      if(action.variant)button.dataset.tbluVariant=action.variant;
      button.disabled=Boolean(action.disabled);buttons.push([button,button.disabled]);footer.append(button);
      listen(button,'click',async()=>{
        if(busy||finished||button.disabled)return;
        busy=true;error.hidden=true;buttons.forEach(([item])=>{item.disabled=true;});
        try{
          // Invoking before the first await preserves browser user activation.
          const result=action.onSelect?.({element,content,close,button});
          await result;if(!finished&&action.close!==false)await close();
        }catch(failure){
          if(!finished){error.textContent=failure?.message||String(failure);error.hidden=false;}
          report(root,failure,'dialog',onError);
        }finally{busy=false;buttons.forEach(([item,disabled])=>{item.disabled=disabled;});}
      });
    });
    element.append(error,footer);
  }
  function finalize({returnFocus=true,returnValue=''}={}){
    if(finished)return;finished=true;animation?.cancel();removers.forEach(remove=>remove());
    if(element.open)element.close(returnValue);element.remove();active.delete(api);stopConnection(api);
    const otherModal=doc.querySelector('dialog[open]');
    if(returnFocus&&!otherModal&&previousFocus?.isConnected)previousFocus.focus?.({preventScroll:true});
    callback(root,onClose,'dialog',onError);
  }
  function close({immediate=false,returnFocus=true,returnValue=''}={}){
    if(finished)return closing||Promise.resolve();
    if(closing){if(immediate)finalize({returnFocus,returnValue});return closing;}
    element.inert=true;
    if(immediate){finalize({returnFocus,returnValue});closing=Promise.resolve();return closing;}
    try{animation=transition(element,false,animation);}catch(failure){report(root,failure,'dialog',onError);}
    closing=finishAnimation(animation,root,'dialog',onError).then(()=>finalize({returnFocus,returnValue}));
    return closing;
  }
  listen(element,'cancel',event=>{event.preventDefault();close();});
  listen(element,'close',()=>finalize());
  api={element,root,close,destroy:()=>close({immediate:true})};element.hideDialog=close;
  active.add(api);container.append(element);
  try{
    element.showModal();
    const focus=typeof initialFocus==='function'?initialFocus(element):typeof initialFocus==='string'?element.querySelector(initialFocus):initialFocus;
    if(focus&&element.contains(focus))focus.focus?.({preventScroll:true});
    animation=transition(element,true);finishAnimation(animation,root,'dialog',onError);
  }catch(failure){finalize();report(root,failure,'dialog',onError);throw failure;}
  watchConnection(api);
  return api;
}
export const createDialog=openDialog;

/** One toast per root; duration:0 keeps it visible until closed. Hover/focus pause expiry. */
export function showToast(options = {}) {
  const {message='',variant='success',action,onClose,onError,closeLabel='Close'}=options;
  if(!['success','info','warning','danger','error'].includes(variant))throw new TypeError('Unknown toast variant');
  const {doc,view,root,container}=context(options);toasts.get(root)?.destroy();
  const previousFocus=doc.activeElement,element=doc.createElement('div');
  element.className='tblu-panel tblu-toast';element.dataset.tbluSurface='panel';element.dataset.tbluElevation='2';element.dataset.tbluVariant=variant==='error'?'danger':variant;
  element.setAttribute('role',['danger','error'].includes(variant)?'alert':'status');element.setAttribute('aria-live',['danger','error'].includes(variant)?'assertive':'polite');element.setAttribute('aria-atomic','true');
  const mark=doc.createElement('span');mark.className='tblu-toast-icon';mark.setAttribute('aria-hidden','true');
  const iconTemplate=doc.createElement('template');iconTemplate.innerHTML=icon(variant==='success'?'Check':'Info');mark.append(iconTemplate.content);
  const text=doc.createElement('span');text.className='tblu-toast-message';text.textContent=String(message);
  const actions=doc.createElement('div');actions.className='tblu-toast-actions';
  const dismiss=decoratedButton(doc,closeLabel,'X');dismiss.dataset.tbluSize='sm';actions.append(dismiss);element.append(mark,text,actions);
  const removers=[];let api,finished=false,closing,animation,timer,hovered=false,focused=false,started,busyAction=false;
  const requested=options.duration??(action?12000:4500),duration=Number.isFinite(requested)&&requested>=0?requested:4500;
  let remaining=duration;
  const now=()=>view.performance?.now()??Date.now();
  const listen=(target,type,handler)=>{target.addEventListener(type,handler);removers.push(()=>target.removeEventListener(type,handler));};
  function stopTimer(){if(timer!==undefined){view.clearTimeout(timer);timer=undefined;remaining=Math.max(0,remaining-(now()-started));}}
  function resume(){if(finished||closing||hovered||focused||busyAction||duration===0||timer!==undefined)return;started=now();timer=view.setTimeout(()=>{timer=undefined;close();},remaining);}
  function finalize(){
    if(finished)return;finished=true;stopTimer();animation?.cancel();removers.forEach(remove=>remove());
    const restoreFocus=element.contains(doc.activeElement);element.remove();active.delete(api);stopConnection(api);
    if(toasts.get(root)===api)toasts.delete(root);
    if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus?.({preventScroll:true});
    callback(root,onClose,'toast',onError);
  }
  function close({immediate=false}={}){
    if(finished)return closing||Promise.resolve();stopTimer();
    if(closing){if(immediate)finalize();return closing;}
    if(immediate){finalize();closing=Promise.resolve();return closing;}
    element.inert=true;try{animation=transition(element,false,animation);}catch(failure){report(root,failure,'toast',onError);}
    closing=finishAnimation(animation,root,'toast',onError).then(finalize);return closing;
  }
  if(action){
    const button=decoratedButton(doc,String(action.label??''),null,'tblu-button');button.dataset.tbluVariant='quiet';actions.insertBefore(button,dismiss);
    listen(button,'click',async()=>{
      if(button.disabled||finished)return;button.disabled=true;busyAction=true;stopTimer();
      try{const result=action.onClick?.({element,close,button});await result;if(!finished&&action.close!==false)await close();}
      catch(failure){report(root,failure,'toast',onError);}
      finally{button.disabled=false;busyAction=false;resume();}
    });
  }
  listen(dismiss,'click',()=>close());
  listen(element,'pointerenter',()=>{hovered=true;stopTimer();});listen(element,'pointerleave',()=>{hovered=false;resume();});
  listen(element,'focusin',()=>{focused=true;stopTimer();});listen(element,'focusout',event=>{if(!element.contains(event.relatedTarget)){focused=false;resume();}});
  api={element,root,close,destroy:()=>close({immediate:true})};element.hideToast=close;active.add(api);toasts.set(root,api);container.append(element);
  try{animation=transition(element,true);finishAnimation(animation,root,'toast',onError);}catch(failure){report(root,failure,'toast',onError);}
  watchConnection(api);resume();return api;
}

/** Enhance one target with the Web Awesome tooltip primitive, removing its OS title tooltip. */
export function attachTooltip(anchor,{text,placement='top',delay=400,hideDelay=0,onError}={}) {
  if(!anchor?.ownerDocument||!anchor.isConnected)throw new TypeError('Tooltip requires a connected anchor');
  const existing=tooltips.get(anchor);
  if(existing){if(text!==undefined)existing.setText(text);existing.element.placement=placement;existing.element.showDelay=Number.isFinite(delay)&&delay>=0?delay:400;existing.element.hideDelay=Number.isFinite(hideDelay)&&hideDelay>=0?hideDelay:0;return existing;}
  const doc=anchor.ownerDocument,view=doc.defaultView,tree=anchor.getRootNode(),root=anchor.closest('.tblu-root')||tree;
  const container=root.nodeType===9||root===doc.documentElement?doc.body:root;
  const title=anchor.getAttribute('title'),initialID=anchor.getAttribute('id');
  if(!anchor.id)anchor.id=`tblu-tooltip-anchor-${++nextId}`;
  const assignedID=anchor.id,element=doc.createElement('wa-tooltip');element.id=`tblu-tooltip-${++nextId}`;element.className='tblu-tooltip';
  element.for=assignedID;element.placement=placement;element.showDelay=Number.isFinite(delay)&&delay>=0?delay:400;element.hideDelay=Number.isFinite(hideDelay)&&hideDelay>=0?hideDelay:0;element.trigger='hover focus';element.withoutArrow=true;
  element.textContent=String(text??title??'');element.disabled=!element.textContent.trim();anchor.removeAttribute('title');
  let stopped=false,api;
  function destroy(){
    if(stopped)return;stopped=true;stopConnection(api);element.disabled=true;element.open=false;element.remove();
    if(title===null)anchor.removeAttribute('title');else anchor.setAttribute('title',title);
    if(anchor.id===assignedID&&initialID!==assignedID)initialID===null?anchor.removeAttribute('id'):anchor.setAttribute('id',initialID);
    if(tooltips.get(anchor)===api)tooltips.delete(anchor);active.delete(api);
  }
  api={element,root,owner:anchor,
    setText(value){if(!stopped){element.textContent=String(value??'');element.disabled=!element.textContent.trim();}},
    close(){if(stopped)return Promise.resolve();try{return Promise.resolve(element.hide()).catch(error=>report(anchor,error,'tooltip',onError));}catch(error){report(anchor,error,'tooltip',onError);return Promise.resolve();}},
    destroy,
  };
  container.append(element);watchConnection(api,tree);active.add(api);tooltips.set(anchor,api);return api;
}

/** Teardown dialogs, toasts and tooltips owned by a mounted root. */
export function destroyFeedback(root = document) {
  const pending=[];
  for(const item of [...active]){
    const owner=item.owner||item.element;
    const contained=root.nodeType===9?owner.ownerDocument===root:item.root===root||root.contains(owner);
    if(contained)pending.push(item.destroy());
  }
  return Promise.all(pending);
}
