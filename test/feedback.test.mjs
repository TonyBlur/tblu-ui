import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDialog,showToast,attachTooltip,destroyFeedback} from '../src/feedback.js';

class Target {
  listeners=new Map();
  addEventListener(type,handler){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(handler);}
  removeEventListener(type,handler){this.listeners.get(type)?.delete(handler);}
  dispatchEvent(event){for(const handler of this.listeners.get(event.type)||[])handler(event);return true;}
  get listenerCount(){return [...this.listeners.values()].reduce((sum,list)=>sum+list.size,0);}
}
class Element extends Target {
  nodeType=1;children=[];attributes=new Map();isConnected=false;text='';disabled=false;open=false;
  constructor(doc,name){
    super();this.ownerDocument=doc;this.localName=name;
    this.dataset=new Proxy({},{get:(_,key)=>this.getAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase())),set:(_,key,value)=>{this.setAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value);return true;}});
    this.className='';
    if(name==='template')this.content=new Element(doc,'fragment');
    if(name==='wa-tooltip')this.hide=()=>{this.open=false;return Promise.resolve();};
  }
  get id(){return this.getAttribute('id')||'';}set id(value){this.setAttribute('id',value);}
  set innerHTML(value){this.html=String(value);if(this.content){const svg=new Element(this.ownerDocument,'svg');this.content.append(svg);}}
  get textContent(){return this.text+this.children.map(child=>child.textContent).join('');}set textContent(value){this.text=String(value);this.children.forEach(child=>child.parentElement=null);this.children=[];}
  setAttribute(name,value){this.attributes.set(name,String(value));}getAttribute(name){return this.attributes.get(name)??null;}removeAttribute(name){this.attributes.delete(name);}hasAttribute(name){return this.attributes.has(name);}
  connect(value){this.isConnected=value;this.children.forEach(child=>child.connect(value));}
  append(...elements){for(const element of elements)this.insertBefore(element,null);}
  insertBefore(element,reference){element.remove();const index=reference?this.children.indexOf(reference):this.children.length;if(index<0)throw new Error('Unknown child');this.children.splice(index,0,element);element.parentElement=this;element.connect(this.isConnected);}
  remove(){if(this.parentElement)this.parentElement.children.splice(this.parentElement.children.indexOf(this),1);this.parentElement=null;this.connect(false);}
  contains(element){return element===this||this.children.some(child=>child.contains(element));}
  matches(selector){return selector.split(',').some(part=>{part=part.trim();if(part.startsWith('.'))return this.className.split(/\s+/).includes(part.slice(1));if(part.startsWith('#'))return this.id===part.slice(1);const attr=part.match(/^([^[]*)\[([^\]]+)\]$/);if(attr)return(!attr[1]||this.localName===attr[1])&&this.hasAttribute(attr[2]);return this.localName===part;});}
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  getRootNode(){return this.ownerDocument;}
  focus(){this.ownerDocument.activeElement=this;}
  showModal(){this.open=true;this.setAttribute('open','');this.focus();}
  close(){this.open=false;this.removeAttribute('open');this.dispatchEvent({type:'close'});}
}
function boundary(){
  const doc=new Target();doc.nodeType=9;
  const observers=[],timers=new Map();let now=0,next=0;
  const view={
    CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
    MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}},
    getComputedStyle:()=>({opacity:'1',getPropertyValue:()=>''}),matchMedia:()=>({matches:false}),performance:{now:()=>now},
    setTimeout:(callback,delay)=>{timers.set(++next,{callback,at:now+delay});return next;},clearTimeout:id=>timers.delete(id),
  };
  doc.defaultView=view;doc.createElement=name=>new Element(doc,name);
  doc.documentElement=new Element(doc,'html');doc.documentElement.dataset.tbluMotion='reduced';doc.documentElement.connect(true);
  doc.body=new Element(doc,'body');doc.documentElement.append(doc.body);doc.querySelector=selector=>doc.documentElement.querySelector(selector);
  const anchor=doc.createElement('button');anchor.textContent='Trigger';doc.body.append(anchor);anchor.focus();
  const errors=[];doc.addEventListener('tblu-error',event=>errors.push(event.detail));
  const advance=amount=>{const end=now+amount;while(true){const due=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].callback();}now=end;};
  return{doc,view,anchor,errors,observers,timers,advance};
}
const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const click=element=>[...element.listeners.get('click')][0]({type:'click'});

test('native modal preserves content/focus, animates Escape close once, and supports owned form composition',async()=>{
  const {doc,anchor}=boundary(),content=doc.createElement('div'),input=doc.createElement('input');input.id='initialField';content.append(input);let closed=0;
  const ui=openDialog({document:doc,title:'<unsafe title>',content,initialFocus:'#initialField',onClose:()=>closed++});
  assert.equal(ui.element.localName,'dialog');assert.equal(ui.element.open,true);assert.equal(doc.activeElement,input);assert.equal(ui.element.querySelector('h2').textContent,'<unsafe title>');
  assert.equal(ui.element.querySelector('.tblu-dialog-body').children[0],content);
  let prevented=false;ui.element.dispatchEvent({type:'cancel',preventDefault(){prevented=true;}});await settle();
  assert.equal(prevented,true);assert.equal(ui.element.isConnected,false);assert.equal(doc.activeElement,anchor);assert.equal(closed,1);await ui.destroy();assert.equal(closed,1);assert.equal(ui.element.listenerCount,0);
  const form=doc.createElement('form'),customHeader=doc.createElement('header');form.append(customHeader);
  const own=openDialog({document:doc,title:'Application form',content:form,ownHeader:false});assert.equal(own.element.children[0],form);assert.equal(own.element.querySelectorAll('header').length,1);await own.destroy();
});
test('dialog action callbacks retain activation; rejected actions stay open and report errors',async()=>{
  const {doc,errors}=boundary();let activated=false;
  const ui=openDialog({document:doc,title:'Save',content:doc.createElement('p'),actions:[{label:'Save changes',variant:'primary',onSelect:()=>{activated=true;return Promise.reject(new Error('Rejected save'));}}]});
  const button=ui.element.querySelector('.tblu-dialog-footer').querySelector('button');
  const work=click(button);assert.equal(activated,true,'handler is invoked before yielding');assert.equal(button.disabled,true);await work;
  assert.equal(ui.element.open,true);assert.equal(button.disabled,false);assert.equal(ui.element.querySelector('.tblu-dialog-error').textContent,'Rejected save');assert.equal(errors[0].error.message,'Rejected save');assert.equal(errors[0].source,'dialog');
  await ui.destroy();
  const failingClose=openDialog({document:doc,title:'Close',content:doc.createElement('p'),onClose:()=>{throw new Error('Close callback');}});await failingClose.destroy();assert.equal(errors.at(-1).error.message,'Close callback');
});
test('toast expiry pauses on hover/focus, safely announces text, and one root keeps one notification',async()=>{
  const {doc,advance,timers}=boundary();let closed=0;
  const ui=showToast({document:doc,message:'<b>Saved</b>',duration:100,onClose:()=>closed++});assert.equal(ui.element.getAttribute('role'),'status');assert.equal(ui.element.querySelector('.tblu-toast-message').textContent,'<b>Saved</b>');
  advance(40);ui.element.dispatchEvent({type:'pointerenter'});assert.equal(timers.size,0);advance(300);assert.equal(ui.element.isConnected,true);
  ui.element.dispatchEvent({type:'focusin'});ui.element.dispatchEvent({type:'pointerleave'});assert.equal(timers.size,0);
  ui.element.dispatchEvent({type:'focusout',relatedTarget:null});advance(59);await settle();assert.equal(ui.element.isConnected,true);advance(1);await settle();assert.equal(ui.element.isConnected,false);assert.equal(closed,1);assert.equal(ui.element.listenerCount,0);
  const previous=showToast({document:doc,message:'First',duration:0}),next=showToast({document:doc,message:'Failed',variant:'danger',duration:0});assert.equal(previous.element.isConnected,false);assert.equal(next.element.getAttribute('role'),'alert');assert.equal(timers.size,0);await next.destroy();
});
test('toast actions pause expiry during async work, report rejection, and restore focus when dismissed',async()=>{
  const {doc,anchor,advance,errors,timers}=boundary();let reject;
  const ui=showToast({document:doc,message:'Saved',duration:100,action:{label:'Undo',onClick:()=>new Promise((_,fail)=>{reject=fail;})}});
  const button=ui.element.querySelector('.tblu-toast-actions').querySelector('button');button.focus();ui.element.dispatchEvent({type:'focusin'});
  const work=click(button);ui.element.dispatchEvent({type:'focusout',relatedTarget:null});ui.element.dispatchEvent({type:'pointerleave'});advance(500);assert.equal(ui.element.isConnected,true);assert.equal(timers.size,0);
  reject(new Error('Undo failed'));await work;assert.equal(errors[0].source,'toast');assert.equal(ui.element.isConnected,true);assert.equal(button.disabled,false);
  await ui.destroy();assert.equal(doc.activeElement,anchor);assert.equal(timers.size,0);
});
test('tooltips remove OS titles, preserve author IDs, and clean up automatically after anchor removal',async()=>{
  const {doc,anchor,observers}=boundary();anchor.setAttribute('title','Original title');
  const ui=attachTooltip(anchor,{text:'Tooltip text',placement:'bottom',delay:550});assert.equal(ui.element.localName,'wa-tooltip');assert.equal(anchor.hasAttribute('title'),false);assert.equal(ui.element.for,anchor.id);assert.equal(ui.element.showDelay,550);assert.equal(ui.element.withoutArrow,true);
  assert.equal(attachTooltip(anchor,{text:'Updated'}),ui);assert.equal(ui.element.textContent,'Updated');await ui.close();ui.destroy();assert.equal(anchor.getAttribute('title'),'Original title');assert.equal(anchor.hasAttribute('id'),false);assert.equal(ui.element.isConnected,false);assert.ok(observers.every(observer=>observer.disconnected));
  anchor.id='author-target';const second=attachTooltip(anchor,{text:'Details'});anchor.remove();observers.filter(observer=>!observer.disconnected).forEach(observer=>observer.callback([]));assert.equal(second.element.isConnected,false);assert.equal(anchor.id,'author-target');assert.equal(anchor.getAttribute('title'),'Original title');
  await destroyFeedback(doc);
});
test('destroyFeedback disposes timers/modals/tooltips for one scope without touching another',async()=>{
  const {doc,timers}=boundary(),scope=doc.createElement('section'),other=doc.createElement('section');scope.className=other.className='tblu-root';doc.body.append(scope,other);
  const anchor=doc.createElement('button');scope.append(anchor);anchor.setAttribute('title','Scoped help');
  const dialog=openDialog({root:scope,title:'Scoped modal',content:doc.createElement('p')}),toast=showToast({root:scope,message:'Scoped message',duration:1000}),tooltip=attachTooltip(anchor,{text:'Scoped tooltip'});
  const retained=showToast({root:other,message:'Other scope',duration:0});await destroyFeedback(scope);
  assert.equal(dialog.element.isConnected,false);assert.equal(toast.element.isConnected,false);assert.equal(tooltip.element.isConnected,false);assert.equal(anchor.getAttribute('title'),'Scoped help');assert.equal(timers.size,0);assert.equal(retained.element.isConnected,true);await retained.destroy();
});

test('one connection observer disposes externally removed feedback and clears pending expiry',async()=>{
  const {doc,anchor,observers,timers}=boundary();
  const dialog=openDialog({document:doc,title:'Dialog',content:doc.createElement('p')}),toast=showToast({document:doc,message:'Toast',duration:1000}),tooltip=attachTooltip(anchor,{text:'Help'});
  assert.equal(observers.filter(observer=>!observer.disconnected).length,1,'a document shares one connection observer');
  dialog.element.remove();toast.element.remove();tooltip.element.remove();observers.filter(observer=>!observer.disconnected).forEach(observer=>observer.callback([]));await settle();
  assert.equal(timers.size,0);assert.equal(dialog.element.open,false);assert.ok(observers.every(observer=>observer.disconnected));
  await destroyFeedback(doc);
});
