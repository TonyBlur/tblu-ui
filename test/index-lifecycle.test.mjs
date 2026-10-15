import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mountUI, createPopover } from '../src/index.js';

// Browser-boundary fake; the actual package mount and overlay implementations are imported.
class Target {
  listeners=new Map();
  addEventListener(type,callback){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(callback);}
  removeEventListener(type,callback){this.listeners.get(type)?.delete(callback);}
  dispatchEvent(event){for(const callback of this.listeners.get(event.type)||[])callback(event);return true;}
  get listenerCount(){return [...this.listeners.values()].reduce((sum,callbacks)=>sum+callbacks.size,0);}
}
class Element extends Target {
  nodeType=1; attributes=new Map(); children=[]; isConnected=true; tagName='DIV';
  constructor(doc,name='div') {
    super();this.ownerDocument=doc;this.localName=name;this.tagName=name.toUpperCase();
    this.dataset=new Proxy({}, {get:(_,name)=>this.getAttribute('data-'+String(name).replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())),set:(_,name,value)=>{this.setAttribute('data-'+String(name).replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),value);return true;}});
    const classes=new Set();
    const sync=()=>this.attributes.set('class',[...classes].join(' '));
    this.classList={contains:name=>classes.has(name),add:(...names)=>{names.forEach(name=>classes.add(name));sync();},remove:(...names)=>{names.forEach(name=>classes.delete(name));sync();},toggle:(name,force)=>{const next=force??!classes.has(name);next?classes.add(name):classes.delete(name);sync();return next;}};
    Object.defineProperty(this,'className',{configurable:true,get:()=>[...classes].join(' '),set:value=>{classes.clear();String(value).split(/\s+/).filter(Boolean).forEach(name=>classes.add(name));sync();}});
    const properties=new Map();
    this.style={setProperty:(name,value,priority='')=>properties.set(name,[value,priority]),removeProperty:name=>properties.delete(name),getPropertyValue:name=>properties.get(name)?.[0]||'',getPropertyPriority:name=>properties.get(name)?.[1]||''};
    if(name==='wa-popup')this.updateComplete=Promise.resolve(true);
  }
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name)??null;}
  hasAttribute(name){return this.attributes.has(name);}
  removeAttribute(name){this.attributes.delete(name);}
  append(...nodes){for(const child of nodes){child.parentElement?.children.splice(child.parentElement.children.indexOf(child),1);child.parentElement=this;this.children.push(child);child.isConnected=this.isConnected;}}
  remove(){if(this.parentElement)this.parentElement.children.splice(this.parentElement.children.indexOf(this),1);this.parentElement=null;this.isConnected=false;}
  contains(node){return node===this||this.children.some(child=>child.contains(node));}
  matches(selector){return selector.split(',').some(part=>part.startsWith('.')?this.classList.contains(part.slice(1)):part==='[data-tblu-surface]'?this.hasAttribute('data-tblu-surface'):false);}
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  getBoundingClientRect(){return {left:0,top:0,right:100,bottom:40,width:100,height:40};}
  getClientRects(){return this.isConnected?[{}]:[];}
}
function boundary() {
  const doc=new Target();doc.nodeType=9;
  const observers=[],preferences=[],frames=new Map();let nextFrame=0;
  const view=new Target();view.navigator={userAgent:'Boundary test'};view.CSS={supports:()=>false};
  view.requestAnimationFrame=callback=>{frames.set(++nextFrame,callback);return nextFrame;};view.cancelAnimationFrame=id=>frames.delete(id);
  view.matchMedia=()=>{const result=new Target();result.matches=false;preferences.push(result);return result;};
  view.getComputedStyle=()=>({getPropertyValue:()=>''});
  view.MutationObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
  view.ResizeObserver=class{constructor(){observers.push(this);}observe(){}unobserve(){}disconnect(){this.disconnected=true;}};
  view.CustomEvent=class{constructor(type,options){this.type=type;Object.assign(this,options);}};
  doc.defaultView=view;doc.createElement=name=>new Element(doc,name);doc.createElementNS=(_,name)=>new Element(doc,name);
  doc.documentElement=new Element(doc,'html');doc.body=new Element(doc,'body');doc.documentElement.append(doc.body);
  doc.querySelectorAll=selector=>doc.documentElement.querySelectorAll(selector);
  const root=new Element(doc,'section'),button=new Element(doc,'button');button.classList.add('tblu-button');root.append(button);doc.body.append(root);
  const flushFrames=()=>{const queued=[...frames];frames.clear();queued.forEach(([,callback])=>callback());};
  return {doc,root,button,view,observers,preferences,frames,flushFrames};
}
test('concurrent calls share one promise/controller; destroy closes scoped portals and restores the baseline',async()=>{
  const {doc,root,button,observers,preferences,frames}=boundary();
  root.setAttribute('data-tblu-theme','authored');root.style.setProperty('--tblu-color-accent','#112233','important');
  const pending=mountUI(root,{enhanceNative:false,material:'solid'}),second=mountUI(root,{enhanceNative:false,theme:'dark'});
  assert.equal(pending,second,'cache exists before async registration starts');
  const [first,other]=await Promise.all([pending,second]);assert.equal(first,other);
  assert.equal(first.theme.material,'solid');assert.equal(button.getAttribute('data-tblu-surface'),'control');
  const popup=createPopover(button,{content:doc.createElement('p'),title:'Information'});
  assert.equal(doc.listenerCount,4,'document modality plus overlay dismissal listeners');
  await first.destroy();await other.destroy();
  assert.equal(popup.isConnected,false,'a body portal is removed through its scoped anchor');
  assert.equal(doc.listenerCount,0);assert.equal(root.listenerCount,0);assert.equal(frames.size,0);
  assert.ok(observers.every(observer=>observer.disconnected));assert.ok(preferences.every(preference=>preference.listenerCount===0));
  assert.equal(root.getAttribute('data-tblu-theme'),'authored');assert.equal(root.style.getPropertyValue('--tblu-color-accent'),'#112233');assert.equal(root.style.getPropertyPriority('--tblu-color-accent'),'important');
  assert.equal(root.classList.contains('tblu-root'),false);assert.equal(button.hasAttribute('data-tblu-surface'),false);
  const remounted=await mountUI(root,{enhanceNative:false,material:'solid'});assert.notEqual(remounted,first);await remounted.destroy();
});
test('failed async initialization rolls back state and permits a subsequent successful mount',async()=>{
  const {doc,root,observers,preferences}=boundary();
  root.style.setProperty('--tblu-lens-blur','7px','important');
  const create=doc.createElementNS;doc.createElementNS=()=>{throw new Error('Synthetic DOM allocation failure');};
  const failed=mountUI(root,{enhanceNative:false,material:'solid'});
  assert.equal(mountUI(root,{enhanceNative:false}),failed);
  await assert.rejects(failed,/allocation failure/);
  assert.equal(root.classList.contains('tblu-root'),false);assert.equal(root.hasAttribute('data-tblu-theme'),false);
  assert.equal(root.style.getPropertyValue('--tblu-lens-blur'),'7px');assert.equal(root.style.getPropertyPriority('--tblu-lens-blur'),'important');
  assert.ok(observers.every(observer=>observer.disconnected));assert.ok(preferences.every(preference=>preference.listenerCount===0));
  doc.createElementNS=create;
  const recovered=await mountUI(root,{enhanceNative:false,material:'solid'});await recovered.destroy();
});
test('SVG class mutations use the class attribute and ignore runtime-only class changes',async()=>{
  const {root,doc,observers,frames,flushFrames}=boundary();
  const ui=await mountUI(root,{enhanceNative:false,material:'solid'});flushFrames();
  const mountObserver=observers[0],svg=doc.createElement('svg');root.append(svg);
  Object.defineProperty(svg,'className',{value:{baseVal:'tblu-card'},configurable:true});svg.setAttribute('class','tblu-card');
  assert.doesNotThrow(()=>mountObserver.callback([{type:'attributes',attributeName:'class',target:svg,oldValue:''}]));
  assert.equal(frames.size,1);frames.clear();
  svg.setAttribute('class','tblu-card tblu-surface tblu-pointer-lit');
  mountObserver.callback([{type:'attributes',attributeName:'class',target:svg,oldValue:'tblu-card tblu-surface'}]);
  assert.equal(frames.size,0,'pure lighting classes do not trigger a preparation frame');
  await ui.destroy();
});

test('document modality tracks pointer/keyboard input for scoped roots and restores authored attributes',async()=>{
  const {root,doc}=boundary();
  root.setAttribute('data-tblu-input','authored');
  const secondRoot=doc.createElement('section');doc.body.append(secondRoot);
  const first=await mountUI(root,{enhanceNative:false,material:'solid'});
  const second=await mountUI(secondRoot,{enhanceNative:false,material:'solid'});
  assert.equal(root.getAttribute('data-tblu-input'),'keyboard');assert.equal(secondRoot.getAttribute('data-tblu-input'),'keyboard');
  doc.dispatchEvent({type:'pointerdown',pointerType:'touch'});
  assert.equal(root.getAttribute('data-tblu-input'),'pointer');assert.equal(secondRoot.getAttribute('data-tblu-input'),'pointer','input outside either root applies document-wide');
  for(const event of [{key:'Shift'},{key:'Control'},{key:'Alt'},{key:'Meta'},{key:'AltGraph'},{key:'k',ctrlKey:true},{key:'k',metaKey:true},{key:'k',altKey:true}]) {
    doc.dispatchEvent({type:'keydown',...event});assert.equal(root.getAttribute('data-tblu-input'),'pointer','modifiers and shortcuts do not switch feedback');
  }
  doc.dispatchEvent({type:'keydown',key:'Tab',shiftKey:true});
  assert.equal(root.getAttribute('data-tblu-input'),'keyboard');assert.equal(secondRoot.getAttribute('data-tblu-input'),'keyboard');
  first.setTheme({theme:'dark'});assert.equal(root.getAttribute('data-tblu-input'),'keyboard');
  await first.destroy();assert.equal(root.getAttribute('data-tblu-input'),'authored');
  doc.dispatchEvent({type:'pointerdown'});assert.equal(root.getAttribute('data-tblu-input'),'authored','destroy removes the document listeners');assert.equal(secondRoot.getAttribute('data-tblu-input'),'pointer');
  await second.destroy();assert.equal(secondRoot.hasAttribute('data-tblu-input'),false);
  assert.equal(doc.listenerCount,0);
});
