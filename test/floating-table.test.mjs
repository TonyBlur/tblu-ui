import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mountFloatingTableHeader} from '../src/floating-table.js';

class Target {
  listeners=new Map();
  addEventListener(type,callback){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(callback);}
  removeEventListener(type,callback){this.listeners.get(type)?.delete(callback);}
  dispatchEvent(event){for(const callback of this.listeners.get(event.type)||[])callback(event);}
  get listenerCount(){return [...this.listeners.values()].reduce((sum,items)=>sum+items.size,0);}
}
class Element extends Target {
  nodeType=1;children=[];attributes=new Map();dataset={};scrollLeft=0;colSpan=1;rowSpan=1;span=1;text='';width=0;
  constructor(doc,name){
    super();this.ownerDocument=doc;this.localName=name;
    const classes=new Set();this.classList={contains:name=>classes.has(name),add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name))};
    Object.defineProperty(this,'className',{get:()=>[...classes].join(' '),set:value=>{classes.clear();String(value).split(/\s+/).filter(Boolean).forEach(name=>classes.add(name));}});
    const properties=new Map(),methods={getPropertyValue:name=>properties.get(name)?.[0]||'',getPropertyPriority:name=>properties.get(name)?.[1]||'',setProperty:(name,value,priority='')=>properties.set(name,[value,priority]),removeProperty:name=>properties.delete(name)};
    this.style=new Proxy(methods,{get:(object,name)=>name in object?object[name]:methods.getPropertyValue(String(name).replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())),set:(_,name,value)=>{methods.setProperty(String(name).replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),value);return true;}});
  }
  get parentNode(){return this.parentElement||null;}
  get nextSibling(){if(!this.parentElement)return null;return this.parentElement.children[this.parentElement.children.indexOf(this)+1]||null;}
  get rows(){return this.localName==='table'?this.children.flatMap(child=>['thead','tbody','tfoot'].includes(child.localName)?child.rows:[]):this.children.filter(child=>child.localName==='tr');}
  get cells(){return this.children.filter(child=>['td','th'].includes(child.localName));}
  get tHead(){return this.children.find(child=>child.localName==='thead')||null;}
  get tBodies(){return this.children.filter(child=>child.localName==='tbody');}
  get textContent(){return this.text+this.children.map(child=>child.textContent).join('');}
  set textContent(value){this.text=String(value);this.replaceChildren();}
  get id(){return this.getAttribute('id')||'';}
  set id(value){this.setAttribute('id',value);}
  getAttribute(name){return name==='class'?this.className||null:this.attributes.get(name)??null;}
  setAttribute(name,value){if(name==='class')this.className=value;else this.attributes.set(name,String(value));}
  removeAttribute(name){this.attributes.delete(name);}
  hasAttribute(name){return this.getAttribute(name)!==null;}
  append(...elements){elements.forEach(element=>this.insertBefore(element,null));}
  insertBefore(element,reference){element.remove();const index=reference?this.children.indexOf(reference):this.children.length;if(index<0)throw new Error('Unknown reference');element.parentElement=this;this.children.splice(index,0,element);return element;}
  before(element){this.parentElement.insertBefore(element,this);}
  remove(){if(this.parentElement)this.parentElement.children.splice(this.parentElement.children.indexOf(this),1);this.parentElement=null;}
  replaceWith(element){this.before(element);this.remove();}
  replaceChildren(...elements){this.children.forEach(element=>element.parentElement=null);this.children=[];this.append(...elements);}
  contains(element){return element===this||this.children.some(child=>child.contains(element));}
  matches(selector){return selector.split(',').some(part=>{part=part.trim();if(part.includes(' ')){const [ancestor,last]=part.split(/\s+/);return this.matches(last)&&this.parentElement?.closest(ancestor);}if(part.startsWith('.'))return this.classList.contains(part.slice(1));const attr=part.match(/^([^[]*)\[([^\]]+)\]$/);if(attr)return(!attr[1]||this.localName===attr[1])&&this.hasAttribute(attr[2]);return this.localName===part;});}
  closest(selector){for(let element=this;element;element=element.parentElement)if(element.matches(selector))return element;return null;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  getBoundingClientRect(){return{width:this.width,height:40,left:0,top:0,right:this.width,bottom:40};}
  cloneNode(deep){const copy=new Element(this.ownerDocument,this.localName);copy.className=this.className;for(const[name,value]of this.attributes)copy.setAttribute(name,value);for(const name of ['width','min-width']){const value=this.style.getPropertyValue(name);if(value)copy.style.setProperty(name,value,this.style.getPropertyPriority(name));}copy.width=this.width;copy.span=this.span;copy.colSpan=this.colSpan;copy.rowSpan=this.rowSpan;copy.text=this.text;if(deep)copy.append(...this.children.map(child=>child.cloneNode(true)));return copy;}
}
function fixture({columns=true}={}) {
  const doc={createElement:name=>new Element(doc,name)},view=new Target(),frames=new Map(),observers=[];let next=0;
  view.getComputedStyle=element=>({minWidth:element.style.minWidth||'0px'});
  view.requestAnimationFrame=callback=>{frames.set(++next,callback);return next;};view.cancelAnimationFrame=id=>frames.delete(id);
  view.ResizeObserver=class{constructor(callback){this.callback=callback;this.observed=[];observers.push(this);}observe(element){this.observed.push(element);}disconnect(){this.disconnected=true;}};
  view.MutationObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
  doc.defaultView=view;
  const root=doc.createElement('main'),before=doc.createElement('p'),after=doc.createElement('p'),body=doc.createElement('div');body.className='tblu-table-scroll authored';root.append(before,body,after);
  const table=doc.createElement('table');table.className='tblu-table';table.style.setProperty('min-width','500px','important');table.width=500;body.append(table);
  const group=doc.createElement('colgroup'),col1=doc.createElement('col'),col2=doc.createElement('col');col1.id='author-col';col1.style.width='100px';col2.style.width='240px';col1.width=120;col2.width=380;group.append(col1,col2);if(columns)table.append(group);
  const head=doc.createElement('thead'),row=doc.createElement('tr'),name=doc.createElement('th'),choice=doc.createElement('th');name.id='name-heading';name.width=120;choice.width=380;
  const sort=doc.createElement('button');sort.textContent='Name';sort.onclick=()=>true;name.append(sort);
  const checkbox=doc.createElement('input');checkbox.setAttribute('aria-label','Select all rows');choice.append(checkbox);row.append(name,choice);head.append(row);
  const tbody=doc.createElement('tbody'),data=doc.createElement('tr'),first=doc.createElement('td'),second=doc.createElement('td');first.textContent='One';first.width=120;first.setAttribute('headers','name-heading');second.textContent='Details';second.width=380;data.append(first,second);tbody.append(data);table.append(head,tbody);
  return {doc,view,root,before,after,body,table,group,col1,col2,head,sort,checkbox,first,second,observers,frames};
}
test('real header controls move intact; geometry and accessible textual headings stay aligned',()=>{
  const f=fixture(),ui=mountFloatingTableHeader(f.root,{topOffset:()=>86});
  assert.equal(ui.headerTable.tHead,f.head);assert.equal(ui.headerTable.querySelector('input'),f.checkbox);assert.equal(ui.headerTable.querySelector('button'),f.sort);assert.equal(f.sort.onclick(),true);
  assert.equal(ui.header.style.top,'86px');assert.equal(ui.headerTable.style.width,'500px');assert.equal(ui.headerTable.style.minWidth,'500px');
  assert.deepEqual([...ui.headerTable.querySelectorAll('col')].map(col=>col.style.width),['120px','380px']);
  assert.equal(ui.headerTable.querySelectorAll('[id]').filter(node=>node.id==='author-col').length,0,'column clone does not duplicate author IDs');
  assert.notEqual(f.table.tHead,f.head);assert.equal(f.table.tHead.querySelector('input'),null);assert.equal(f.table.tHead.querySelector('button'),null);
  assert.deepEqual(f.table.tHead.rows[0].cells.map(cell=>cell.textContent),['Name','Select all rows']);
  assert.notEqual(f.first.getAttribute('headers'),'name-heading');assert.equal(f.table.tHead.rows[0].cells[0].id,f.first.getAttribute('headers'));
  assert.equal(mountFloatingTableHeader(f.root),ui,'repeat mount finds the existing visible header controller');
  ui.destroy();
  assert.equal(f.table.tHead,f.head);assert.equal(f.first.getAttribute('headers'),'name-heading');assert.deepEqual(f.root.children,[f.before,f.body,f.after]);
  assert.equal(f.table.style.minWidth,'500px');assert.equal(f.table.style.getPropertyPriority('min-width'),'important');assert.equal(f.body.className,'tblu-table-scroll authored');
});
test('scroll synchronization and column resize remain live; destroy releases listeners and pending work',()=>{
  const f=fixture(),ui=mountFloatingTableHeader(f.root,{classes:{body:'authored extra'}});
  f.body.scrollLeft=110;f.body.dispatchEvent({type:'scroll'});assert.equal(ui.header.scrollLeft,110);
  ui.header.scrollLeft=220;ui.header.dispatchEvent({type:'scroll'});assert.equal(f.body.scrollLeft,220);
  f.col1.style.width='400px';f.col1.width=400;f.col2.width=240;f.table.width=640;f.root.dispatchEvent({type:'columns-resized'});
  assert.equal(f.table.style.minWidth,'640px');assert.equal(ui.headerTable.style.minWidth,'640px');assert.deepEqual([...ui.headerTable.querySelectorAll('col')].map(col=>col.style.width),['400px','240px']);
  f.view.dispatchEvent({type:'resize'});assert.equal(f.frames.size,1);
  ui.destroy();ui.destroy();assert.equal(f.frames.size,0);assert.ok(f.observers.every(observer=>observer.disconnected));
  assert.equal(f.root.listenerCount,0);assert.equal(f.body.listenerCount,0);assert.equal(ui.header.listenerCount,0);assert.equal(f.view.listenerCount,0);
  f.body.scrollLeft=330;f.body.dispatchEvent({type:'scroll'});assert.equal(ui.header.scrollLeft,220);
  assert.equal(f.body.classList.contains('authored'),true);assert.equal(f.body.classList.contains('extra'),false);assert.equal(f.table.style.minWidth,'500px');
});
test('automatic-layout tables get measured header columns without altering the body colgroup',()=>{
  const f=fixture({columns:false}),ui=mountFloatingTableHeader(f.root);
  assert.equal(f.table.querySelector('colgroup'),null);assert.deepEqual(ui.headerTable.querySelectorAll('col').map(col=>col.style.width),['120px','380px']);
  f.checkbox.setAttribute('aria-label','Choose every row');ui.refresh();assert.equal(f.table.tHead.rows[0].cells[1].textContent,'Choose every row');
  ui.destroy();assert.equal(f.table.querySelector('colgroup'),null);
});
test('offset errors roll back mounting instead of leaving a partially moved header',()=>{
  const f=fixture();assert.throws(()=>mountFloatingTableHeader(f.root,{topOffset:()=>{throw new Error('Offset failure');}}),/Offset failure/);
  assert.equal(f.table.tHead,f.head);assert.deepEqual(f.root.children,[f.before,f.body,f.after]);assert.equal(f.root.listenerCount,0);assert.equal(f.body.listenerCount,0);assert.ok(f.observers.every(observer=>observer.disconnected));
  const recovered=mountFloatingTableHeader(f.root);recovered.destroy();
});
