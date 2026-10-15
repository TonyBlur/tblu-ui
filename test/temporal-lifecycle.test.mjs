import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Only the browser portal boundary is stubbed. The actual picker implementation,
// property bridge and date/time constraint logic are exercised below.
const source = (await fs.readFile(new URL('../src/temporal.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
const prefix = `import {bridgeProperty} from ${JSON.stringify(new URL('../src/control-helpers.mjs',import.meta.url).href)};
import {parseISODate,addDateDays,addDateMonths,calendarDates,localeWeekStart,dateAllowed,nearestDate,parseTime,formatTime,timeConstraints,timeAllowed,timeCandidates,nearestTime} from ${JSON.stringify(new URL('../src/temporal-math.mjs',import.meta.url).href)};
const portals = [];
function createPopover(anchor,{content,onClose}) {
  const doc=anchor.ownerDocument,popup=doc.createElement('div'),panel=doc.createElement('div'); panel.append(content);popup.append(panel);doc.body.append(popup);popup.panel=panel;popup.updateComplete=Promise.resolve();
  popup.hidePopover=options=>{panel.inert=true;popup.remove();if(options?.returnFocus)anchor.focus();onClose?.();return Promise.resolve();};portals.push(popup);return popup;
}
export {portals};
`;
const {mountTemporalPickers,portals} = await import(`data:text/javascript,${encodeURIComponent(prefix+source)}`);

class Element {
  nodeType=1; children=[]; attributes=new Map(); listeners=new Map(); disabled=false; readOnly=false; isConnected=false; inert=false;
  constructor(doc,name='div') {
    this.ownerDocument=doc;this.localName=name;this.tagName=name.toUpperCase();
    const classes=new Set();this.classList={add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name)};
    Object.defineProperty(this,'className',{get:()=>[...classes].join(' '),set:value=>{classes.clear();String(value).split(/\s+/).forEach(name=>classes.add(name));}});
    this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute('data-'+String(key).replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())),set:(_,key,value)=>{this.setAttribute('data-'+String(key).replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),value);return true;}});
    this.style={};
  }
  get id(){return this.getAttribute('id')||'';}set id(value){this.setAttribute('id',value);}
  get textContent(){return (this.text||'')+this.children.map(child=>child.textContent).join('');}set textContent(value){this.text=String(value);this.replaceChildren();}
  get tabIndex(){return Number(this.getAttribute('tabindex')||0);}set tabIndex(value){this.setAttribute('tabindex',value);}
  get type(){return this.getAttribute('type')||'text';}set type(value){this.setAttribute('type',value);}
  get value(){return this.currentValue??this.getAttribute('value')??'';}set value(value){this.currentValue=String(value);}
  get defaultValue(){return this.getAttribute('value')||'';}set defaultValue(value){this.setAttribute('value',value);}
  get min(){return this.getAttribute('min')||'';}set min(value){this.setAttribute('min',value);}
  get max(){return this.getAttribute('max')||'';}set max(value){this.setAttribute('max',value);}
  get step(){return this.getAttribute('step')||'';}set step(value){this.setAttribute('step',value);}
  get required(){return this.hasAttribute('required');}set required(value){this.toggleAttribute('required',value);}
  get name(){return this.getAttribute('name')||'';}set name(value){this.setAttribute('name',value);}
  get labels(){const label=this.closest('label');return label?[label]:[];}
  get validity(){return {customError:Boolean(this.customError),valid:!this.customError&&(!this.required||Boolean(this.value))};}
  get validationMessage(){return this.customError||(this.required&&!this.value?'Fill this field.':'');}
  setCustomValidity(value){this.customError=String(value);}
  reportValidity(){return this.validity.valid;}
  setAttribute(name,value){this.attributes.set(name,String(value));}getAttribute(name){return this.attributes.get(name)??null;}hasAttribute(name){return this.attributes.has(name);}removeAttribute(name){this.attributes.delete(name);}
  toggleAttribute(name,force){const next=force??!this.hasAttribute(name);next?this.setAttribute(name,''):this.removeAttribute(name);return next;}
  connect(value){this.isConnected=value;this.children.forEach(child=>child.connect(value));}
  append(...nodes){for(const node of nodes){node.remove();node.parentElement=this;this.children.push(node);node.connect(this.isConnected);}}
  before(node){const parent=this.parentElement,index=parent.children.indexOf(this);node.remove();parent.children.splice(index,0,node);node.parentElement=parent;node.connect(parent.isConnected);}
  replaceWith(node){const parent=this.parentElement,index=parent?.children.indexOf(this);if(!parent)return;node.remove();parent.children.splice(index,1,node);node.parentElement=parent;node.connect(parent.isConnected);this.parentElement=null;this.connect(false);}
  replaceChildren(...nodes){for(const child of [...this.children])child.remove();this.append(...nodes);}
  remove(){if(this.parentElement)this.parentElement.children.splice(this.parentElement.children.indexOf(this),1);this.parentElement=null;this.connect(false);}
  contains(node){return node===this||this.children.some(child=>child.contains(node));}
  matches(selector){
    return selector.split(',').some(raw=>{
      const part=raw.trim();if(part===':disabled')return this.disabled;
      if(part.startsWith('.tblu-field input['))return this.localName==='input'&&this.closest('.tblu-field')&&this.type===(part.includes('type=date')?'date':'time');
      if(part==='button:not(:disabled)')return this.localName==='button'&&!this.disabled;
      if(part.startsWith('.'))return this.classList.contains(part.slice(1));
      if(part.startsWith('[')){const tests=[...part.matchAll(/\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]/g)];return tests.every(([,name,value])=>value===undefined?this.hasAttribute(name):this.getAttribute(name)===value);}
      return part===this.localName;
    });
  }
  closest(selector){for(let current=this;current;current=current.parentElement)if(current.matches(selector))return current;return null;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  cloneNode(deep){const clone=new Element(this.ownerDocument,this.localName);clone.className=this.className;for(const [name,value]of this.attributes)clone.setAttribute(name,value);clone.text=this.text;if(deep)clone.append(...this.children.map(child=>child.cloneNode(true)));return clone;}
  addEventListener(type,listener){const values=this.listeners.get(type)||new Set();values.add(listener);this.listeners.set(type,values);}
  removeEventListener(type,listener){this.listeners.get(type)?.delete(listener);}
  dispatchEvent(event){event.target??=this;for(const listener of this.listeners.get(event.type)||[])listener(event);if(event.bubbles&&!event.stopped)this.parentElement?.dispatchEvent(event);return true;}
  emit(type,options={}){const event={type,bubbles:true,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...options};this.dispatchEvent(event);return event;}
  focus(){this.ownerDocument.activeElement=this;}scrollIntoView(){}
  get listenerCount(){return [...this.listeners.values()].reduce((count,set)=>count+set.size,0);}
}
function boundary(kind,value) {
  const doc=new Element(null,'document');doc.nodeType=9;doc.ownerDocument=null;
  doc.createElement=name=>new Element(doc,name);doc.getElementById=id=>doc.querySelectorAll('[id]').find(node=>node.id===id)||null;
  const observers=[];
  doc.defaultView={queueMicrotask,Event:class{constructor(type,options){this.type=type;Object.assign(this,options);}},MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}};
  doc.documentElement=doc.createElement('html');doc.documentElement.lang='en-GB';doc.body=doc.createElement('body');doc.append(doc.documentElement);doc.documentElement.append(doc.body);doc.connect(true);
  const label=doc.createElement('label');label.className='tblu-field';const caption=doc.createElement('span');caption.textContent=kind==='date'?'Appointment date':'Appointment time';
  const source=doc.createElement('input');source.type=kind;source.name='appointment';source.defaultValue=value;source.setAttribute('aria-label',caption.textContent);source.setAttribute('tabindex','2');label.append(caption,source);doc.body.append(label);
  const controller=mountTemporalPickers(doc);const wrapper=source.parentElement,text=wrapper.querySelector('.tblu-temporal-input'),trigger=wrapper.querySelector('button');
  return {doc,label,source,text,trigger,controller,observers};
}
const settle=async()=>{await Promise.resolve();await Promise.resolve();};

test('typed values dispatch original-source events once and programmatic updates mirror',()=>{
  const {doc,label,source,text,controller,observers}=boundary('date','2024-09-15');const events=[];
  doc.addEventListener('input',event=>events.push(['input',event.target]));doc.addEventListener('change',event=>events.push(['change',event.target]));
  assert.equal(source.name,'appointment');assert.equal(text.name,'');assert.equal(source.dataset.tbluNativeSource,'date');
  text.value='2024-09-20';text.emit('input');text.emit('change');assert.deepEqual(events.map(([type])=>type),['input','change']);assert.ok(events.every(([,target])=>target===source));assert.equal(source.value,'2024-09-20');
  source.value='2024-10-03';assert.equal(text.value,'2024-10-03');source.focus();assert.equal(doc.activeElement,text);
  text.value='impossible';text.emit('input');assert.equal(source.value,'2024-10-03');assert.equal(source.validity.customError,true);
  controller.destroy();assert.equal(source.parentElement,label);assert.equal(source.getAttribute('aria-hidden'),null);assert.equal(source.getAttribute('tabindex'),'2');assert.equal(Object.hasOwn(source,'value'),false);assert.equal(Object.hasOwn(source,'focus'),false);assert.equal(source.listenerCount,0);assert.ok(observers.every(observer=>observer.disconnected));
});

test('calendar uses roving grid focus, keyboard navigation, selected dates and constraint updates',async()=>{
  const {doc,source,trigger,controller}=boundary('date','2024-09-15');source.min='2024-09-10';source.max='2024-09-20';
  trigger.emit('click');await settle();const popup=portals.at(-1);assert.equal(popup.querySelectorAll('[data-calendar-date]').length,42);assert.equal(doc.activeElement.dataset.calendarDate,'2024-09-15');
  doc.activeElement.emit('keydown',{key:'ArrowRight'});assert.equal(doc.activeElement.dataset.calendarDate,'2024-09-16');
  popup.querySelector('[data-calendar-date="2024-09-09"]').emit('click');assert.equal(source.value,'2024-09-15','disabled dates cannot be selected');
  popup.querySelector('[data-calendar-date="2024-09-16"]').emit('click');assert.equal(source.value,'2024-09-16');assert.equal(doc.activeElement,trigger);assert.equal(popup.isConnected,false);
  trigger.emit('click');await settle();source.disabled=true;controller.refresh();assert.equal(portals.at(-1).isConnected,false);assert.equal(trigger.disabled,true);controller.destroy();
});

test('time columns apply constrained seconds and reset closes the portal',async()=>{
  const {doc,source,text,trigger,controller}=boundary('time','09:00:10');source.min='09:00:05';source.max='09:00:25';source.step='5';
  trigger.emit('click');await settle();const popup=portals.at(-1);assert.equal(popup.querySelector('.tblu-time-grid').dataset.seconds,'true');
  popup.querySelector('[data-time-part="second"][data-time-value="20"]').emit('click');popup.querySelector('[data-time-apply]').emit('click');assert.equal(source.value,'09:00:20');assert.equal(text.value,'09:00:20');
  trigger.emit('click');await settle();source.value=source.defaultValue;doc.emit('reset');await settle();assert.equal(text.value,'09:00:10');assert.equal(portals.at(-1).isConnected,false);
  controller.destroy();
});
