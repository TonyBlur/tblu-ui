import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mountSidebarResize } from '../src/sidebar.js';

class Style {
  values = new Map();
  getPropertyValue(name) { return this.values.get(name)?.value || ''; }
  getPropertyPriority(name) { return this.values.get(name)?.priority || ''; }
  setProperty(name,value,priority = '') { this.values.set(name,{value:String(value),priority}); }
  removeProperty(name) { this.values.delete(name); }
}
class Target {
  attributes = new Map(); style = new Style(); listeners = new Map(); isConnected = true; captures = new Set();
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name,value) { this.attributes.set(name,String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type,listener) { const entries = this.listeners.get(type) || new Set(); entries.add(listener); this.listeners.set(type,entries); }
  removeEventListener(type,listener) { this.listeners.get(type)?.delete(listener); }
  emit(type,data = {}) { const event = {prevented:false,preventDefault() { this.prevented = true; },...data}; for (const listener of this.listeners.get(type) || []) listener(event); return event; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
  focus() { this.focused = true; }
}
function fixture(options = {}) {
  const handle = new Target(), root = new Target(), view = new Target(); root.ownerDocument = {defaultView:view}; handle.ownerDocument = root.ownerDocument;
  const changes = [], commits = [];
  const mounted = mountSidebarResize({handle,root,onChange:(width,detail)=>changes.push([width,detail.source]),onCommit:(width,detail)=>commits.push([width,detail.source]),...options});
  return {handle,root,view,changes,commits,mounted};
}

test('pointer drag captures the active pointer, clamps width and commits once',()=>{
  const {handle,root,changes,commits,mounted} = fixture({width:260});
  handle.emit('pointerdown',{button:0,pointerId:4,clientX:260}); assert.equal(handle.hasPointerCapture(4),true); assert.equal(handle.focused,true);
  handle.emit('pointermove',{pointerId:9,clientX:500}); assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'260px');
  handle.emit('pointermove',{pointerId:4,clientX:310}); assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'310px');
  handle.emit('pointermove',{pointerId:4,clientX:1000}); assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'560px');
  handle.emit('pointerup',{pointerId:4,clientX:1000}); assert.equal(handle.hasPointerCapture(4),false); assert.deepEqual(commits,[[560,'pointer']]);
  assert.deepEqual(changes,[[310,'pointer'],[560,'pointer']]); assert.equal(root.hasAttribute('data-tblu-resizing-sidebar'),false);
  mounted.destroy();
});

test('keyboard resize exposes separator values and respects bounds',()=>{
  const {handle,root,commits,mounted} = fixture();
  assert.equal(handle.getAttribute('role'),'separator'); assert.equal(handle.getAttribute('aria-orientation'),'vertical'); assert.equal(handle.getAttribute('aria-label'),'Resize sidebar');
  handle.emit('keydown',{key:'ArrowRight'}); assert.equal(handle.getAttribute('aria-valuenow'),'264');
  handle.emit('keydown',{key:'-'}); assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'248px');
  handle.emit('keydown',{key:'Home'}); assert.equal(handle.getAttribute('aria-valuenow'),'220');
  handle.emit('keydown',{key:'ArrowLeft'}); assert.equal(commits.length,3);
  handle.emit('keydown',{key:'End'}); assert.equal(handle.getAttribute('aria-valuetext'),'560px');
  handle.emit('keydown',{key:'ArrowLeft',altKey:true}); assert.equal(handle.getAttribute('aria-valuenow'),'560');
  assert.equal(mounted.setWidth(Infinity),560); assert.equal(mounted.setWidth(100),220); mounted.destroy();
});

test('cancel and viewport guards preserve the committed width',()=>{
  let enabled = true;
  const {handle,root,view,commits,mounted} = fixture({width:280,enabled:()=>enabled});
  handle.emit('pointerdown',{button:0,pointerId:1,clientX:280}); handle.emit('pointermove',{pointerId:1,clientX:340});
  handle.emit('pointercancel',{pointerId:1}); assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'280px'); assert.deepEqual(commits,[]);
  handle.emit('pointerdown',{button:0,pointerId:2,clientX:280}); handle.emit('pointermove',{pointerId:2,clientX:320});
  enabled = false; view.emit('resize'); assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'280px'); assert.equal(handle.getAttribute('aria-disabled'),'true'); assert.equal(handle.getAttribute('tabindex'),'-1');
  assert.equal(mounted.setWidth(500),280); assert.equal(handle.emit('keydown',{key:'ArrowRight'}).prevented,false); assert.equal(handle.hasPointerCapture(2),false);
  enabled = true; view.emit('resize'); assert.equal(handle.getAttribute('tabindex'),'0'); mounted.destroy();
});

test('destroy restores author styles, names and attributes without leaking listeners',()=>{
  const handle = new Target(), root = new Target(), view = new Target(); root.ownerDocument = {defaultView:view};
  handle.setAttribute('aria-label','Widen navigation'); handle.setAttribute('tabindex','5'); handle.setAttribute('data-resizing','author'); root.setAttribute('data-tblu-resizing-sidebar','author-root');
  handle.style.setProperty('touch-action','pan-y'); handle.style.setProperty('cursor','ew-resize','important'); root.style.setProperty('--tblu-sidebar-width','272px','important');
  const mounted = mountSidebarResize({handle,root}); assert.equal(handle.getAttribute('aria-label'),'Widen navigation'); mounted.setWidth(400); mounted.destroy(); mounted.destroy();
  assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'272px'); assert.equal(root.style.getPropertyPriority('--tblu-sidebar-width'),'important');
  assert.equal(handle.style.getPropertyValue('cursor'),'ew-resize'); assert.equal(handle.style.getPropertyPriority('cursor'),'important'); assert.equal(handle.style.getPropertyValue('touch-action'),'pan-y');
  assert.equal(handle.getAttribute('tabindex'),'5'); assert.equal(handle.getAttribute('role'),null); assert.equal(handle.getAttribute('data-resizing'),'author'); assert.equal(root.getAttribute('data-tblu-resizing-sidebar'),'author-root');
  assert.equal([...handle.listeners.values()].reduce((sum,set)=>sum+set.size,0),0); assert.equal([...view.listeners.values()].reduce((sum,set)=>sum+set.size,0),0);
  mounted.setWidth(500); assert.equal(handle.getAttribute('role'),null); assert.equal(handle.getAttribute('tabindex'),'5');
  handle.emit('keydown',{key:'ArrowRight'}); assert.equal(root.style.getPropertyValue('--tblu-sidebar-width'),'272px');
});
