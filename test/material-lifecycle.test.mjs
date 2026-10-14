import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMaterial } from '../src/material.js';

// A small deterministic browser boundary exercises lifecycle contracts without a GPU/DOM dependency.
class EventTargetFake {
  listeners = new Map();
  addEventListener(type, listener) { this.listeners.set(type, new Set([...(this.listeners.get(type) || []), listener])); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  get listenerCount() { return [...this.listeners.values()].reduce((count, list) => count + list.size, 0); }
}
class ElementFake extends EventTargetFake {
  nodeType = 1; children = []; attributes = new Map(); dataset = {}; isConnected = true; tagName = 'DIV';
  constructor(doc) {
    super(); this.ownerDocument = doc;
    const names = new Set();
    this.classList = { contains:name=>names.has(name), add:(...values)=>values.forEach(name=>names.add(name)), remove:(...values)=>values.forEach(name=>names.delete(name)), toggle:(name, force)=>force === true ? names.add(name) : force === false ? names.delete(name) : names.has(name) ? names.delete(name) : names.add(name) };
    const styles = new Map();
    this.style = { getPropertyValue:name=>styles.get(name)?.[0] || '', getPropertyPriority:name=>styles.get(name)?.[1] || '', setProperty:(name,value,priority='')=>styles.set(name,[value,priority]), removeProperty:name=>styles.delete(name) };
  }
  set className(value) { this.classList.add(...value.split(/\s+/)); }
  setAttribute(name,value) { this.attributes.set(name,value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  append(...elements) { elements.forEach(element=>{ element.parentElement?.children.splice(element.parentElement.children.indexOf(element),1); element.parentElement=this; this.children.push(element); }); }
  remove() { if(this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this),1); this.parentElement=null; this.isConnected=false; }
  querySelectorAll() { return this.children.filter(child=>child.attributes.has('data-tblu-surface')); }
  matches(selector) { return selector === '[data-tblu-surface]' && this.attributes.has('data-tblu-surface'); }
  contains(element) { return element === this || this.children.some(child=>child.contains(element)); }
  closest() { return null; }
}
function browserBoundary() {
  const doc = new EventTargetFake(); doc.nodeType=9; doc.children=[];
  const view = new EventTargetFake(), media=[], observers=[], frames=new Map(); let frameId=0;
  view.navigator={userAgent:'Boundary test'}; view.CSS={supports:()=>false};
  view.requestAnimationFrame=callback=>{ frames.set(++frameId,callback); return frameId; };
  view.cancelAnimationFrame=id=>frames.delete(id);
  view.matchMedia=()=>{ const preference=new EventTargetFake(); preference.matches=false; media.push(preference); return preference; };
  view.getComputedStyle=()=>({getPropertyValue:()=>''});
  view.MutationObserver=class { constructor(callback) { this.callback=callback; this.disconnected=false; observers.push(this); } observe() {} disconnect() { this.disconnected=true; } };
  view.ResizeObserver=class { constructor() { this.disconnected=false; observers.push(this); } observe() {} unobserve() {} disconnect() { this.disconnected=true; } };
  doc.defaultView=view; doc.createElementNS=()=>new ElementFake(doc); doc.createElement=()=>new ElementFake(doc);
  doc.documentElement=new ElementFake(doc); doc.documentElement.dataset.tbluMaterial='solid'; doc.body=new ElementFake(doc);
  doc.querySelectorAll=()=>doc.body.querySelectorAll();
  const root=new ElementFake(doc), surface=new ElementFake(doc);
  surface.tagName='BUTTON'; surface.setAttribute('data-tblu-surface','control'); root.append(surface); doc.body.append(root);
  return {doc,root,surface,view,media,observers,frames};
}
test('mount is idempotent; destroy restores author styles and removes all owned effects', () => {
  const boundary=browserBoundary(), {doc,root,surface,view,media,observers,frames}=boundary;
  surface.style.setProperty('--tblu-lens','author-lens','important');
  surface.classList.add('author-class');
  const controller=createMaterial({root});
  assert.equal(createMaterial({root}),controller);
  assert.equal(surface.children.filter(child=>child.classList.contains('tblu-rim-light')).length,1);
  assert.equal(doc.body.children.length,2,'one SVG filter holder per controller');
  assert.ok(root.listenerCount>0 && view.listenerCount>0 && frames.size>0);
  controller.destroy(); controller.destroy();
  assert.equal(root.listenerCount,0); assert.equal(view.listenerCount,0);
  assert.equal(media.reduce((count,item)=>count+item.listenerCount,0),0);
  assert.equal(frames.size,0); assert.ok(observers.every(observer=>observer.disconnected));
  assert.equal(doc.body.children.length,1); assert.equal(surface.children.length,0);
  assert.equal(surface.style.getPropertyValue('--tblu-lens'),'author-lens');
  assert.equal(surface.style.getPropertyPriority('--tblu-lens'),'important');
  assert.equal(surface.classList.contains('author-class'),true); assert.equal(surface.classList.contains('tblu-surface'),false);
  const remounted=createMaterial({root}); assert.notEqual(remounted,controller); remounted.destroy();
});
test('independent roots receive distinct filter IDs and unregister preserves authored rim markup', () => {
  const {doc,root,surface}=browserBoundary();
  const authored=new ElementFake(doc); authored.className='tblu-rim-light'; surface.append(authored);
  const secondRoot=new ElementFake(doc), secondSurface=new ElementFake(doc);
  secondSurface.setAttribute('data-tblu-surface','card'); secondRoot.append(secondSurface); doc.body.append(secondRoot);
  const first=createMaterial({root}), second=createMaterial({root:secondRoot});
  const ids=doc.body.children.filter(child=>child.classList.contains('tblu-material-filters')).flatMap(svg=>svg.children.flatMap(defs=>defs.children.map(filter=>filter.id)));
  assert.equal(ids.length,2); assert.equal(new Set(ids).size,2);
  first.unregister(surface); assert.equal(surface.children[0],authored); assert.equal(surface.classList.contains('tblu-surface'),false);
  first.destroy(); second.destroy();
  assert.equal(doc.body.children.length,2,'only caller-owned roots remain');
});
