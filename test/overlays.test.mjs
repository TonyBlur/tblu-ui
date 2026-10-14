import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Import the actual overlay implementation with its browser-only imports replaced
// by boundary stubs. No overlay logic is duplicated in this harness.
const source = (await fs.readFile(new URL('../src/overlays.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '');
const moduleSource = `const icon = () => '<svg></svg>'; const createMaterial = () => ({refresh(){},destroy(){}}); const menuEnter = () => {}; const menuLeave = () => Promise.resolve();\n${source}`;
const { createPopover, openMenu, destroyOverlays } = await import(`data:text/javascript,${encodeURIComponent(moduleSource)}`);

class Target {
  listeners = new Map();
  addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback); }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  dispatchEvent(event) { for (const callback of this.listeners.get(event.type) || []) callback(event); return true; }
  get listenerCount() { return [...this.listeners.values()].reduce((sum, callbacks) => sum + callbacks.size, 0); }
}
class Element extends Target {
  nodeType = 1; attributes = new Map(); dataset = {}; children = []; isConnected = false; disabled = false; inert = false; tabIndex = 0;
  constructor(doc, name = 'div') {
    super(); this.ownerDocument = doc; this.localName = name;
    const classes = new Set(); this.classList = { add: (...names) => names.forEach(name => classes.add(name)), contains: name => classes.has(name) };
    Object.defineProperty(this, 'className', { get: () => [...classes].join(' '), set: value => { classes.clear(); String(value).split(/\s+/).forEach(name => classes.add(name)); } });
    const properties = new Map(); this.style = { setProperty: (name, value) => properties.set(name, value), removeProperty: name => properties.delete(name), getPropertyValue: name => properties.get(name) || '' };
    this.properties = properties;
    if (name === 'wa-popup') this.updateComplete = Promise.resolve(true);
  }
  append(...nodes) { for (const child of nodes) { child.parentElement = this; this.children.push(child); child.connect(this.isConnected); } }
  connect(value) { this.isConnected = value; this.children.forEach(child => child.connect(value)); }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; this.connect(false); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  matches(selector) {
    if (selector === 'button:not(:disabled)') return this.localName === 'button' && !this.disabled;
    if (selector === '.tblu-root') return this.classList.contains('tblu-root');
    return selector.split(',').some(part => part === this.localName || part === '[inert]' && this.inert || part === '[hidden]' && this.hasAttribute('hidden') || part === '[aria-hidden=true]' && this.getAttribute('aria-hidden') === 'true' || part === '[tabindex]' && this.hasAttribute('tabindex'));
  }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  getClientRects() { return this.isConnected ? [{}] : []; }
  focus() { this.ownerDocument.activeElement = this; }
}
function browserBoundary() {
  const doc = new Target(); doc.nodeType = 9;
  const observers = [];
  doc.defaultView = {
    setTimeout,
    CustomEvent: class { constructor(type, options) { this.type = type; Object.assign(this, options); } },
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    getComputedStyle: element => {
      const names = [...element.properties.keys()];
      return { length: names.length, item: index => names[index], getPropertyValue: name => element.style.getPropertyValue(name), display: 'block', visibility: 'visible' };
    },
  };
  doc.documentElement = new Element(doc, 'html'); doc.documentElement.connect(true);
  doc.body = new Element(doc, 'body'); doc.documentElement.append(doc.body); doc.activeElement = doc.body;
  doc.createElement = name => new Element(doc, name);
  doc.querySelectorAll = selector => doc.documentElement.querySelectorAll(selector);
  const anchor = doc.createElement('button'), next = doc.createElement('button'); doc.body.append(anchor, next);
  const content = () => doc.createElement('p');
  const flush = () => observers.filter(observer => !observer.disconnected).forEach(observer => observer.callback([]));
  return { doc, anchor, next, content, observers, flush };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('same-anchor toggle and destroy release overlays, listeners, and authored ARIA', async () => {
  const { doc, anchor, content, observers } = browserBoundary();
  anchor.setAttribute('aria-expanded', 'false'); anchor.setAttribute('aria-controls', 'author-panel'); anchor.setAttribute('aria-haspopup', 'menu');
  const popup = createPopover(anchor, { content: content(), title: 'Information' });
  assert.equal(anchor.getAttribute('aria-expanded'), 'true'); assert.equal(doc.listenerCount, 2);
  const toggled = createPopover(anchor, { content: content() });
  assert.equal(toggled, popup); await popup.hidePopover();
  assert.equal(popup.isConnected, false); assert.equal(doc.listenerCount, 0);
  assert.equal(anchor.getAttribute('aria-expanded'), 'false'); assert.equal(anchor.getAttribute('aria-controls'), 'author-panel'); assert.equal(anchor.getAttribute('aria-haspopup'), 'menu');
  const next = createPopover(anchor, { content: content() });
  await destroyOverlays(doc);
  assert.equal(next.isConnected, false); assert.equal(doc.listenerCount, 0); assert.ok(observers.every(observer => observer.disconnected));
});

test('removing an anchor closes its portal instead of leaving orphaned listeners', async () => {
  const { doc, anchor, content, flush } = browserBoundary();
  const popup = createPopover(anchor, { content: content() }); await settle(); anchor.remove(); flush();
  assert.equal(popup.isConnected, false); assert.equal(doc.listenerCount, 0); assert.equal(anchor.getAttribute('aria-expanded'), null);
});

test('menu callbacks retain user activation, handle rejected work, and restore focus', async () => {
  const { doc, anchor } = browserBoundary(); let invoked = false; const errors = [];
  const popup = openMenu(anchor, { items: [{ label: '<unsafe>', onSelect: () => { invoked = true; return Promise.reject(new Error('Action failed')); } }], onError: error => errors.push(error) });
  await settle(); const menu = popup.panel.children[0], action = menu.children[0];
  assert.equal(action.children[0].textContent, '<unsafe>'); assert.equal(action.children[0].localName, 'span');
  assert.equal(anchor.getAttribute('aria-haspopup'), 'menu'); assert.equal(action.tabIndex, -1); assert.equal(doc.activeElement, action);
  const work = action.onclick(); assert.equal(invoked, true, 'callback runs synchronously before animation is awaited'); await work;
  assert.equal(errors.length, 1); assert.equal(doc.activeElement, anchor); assert.equal(popup.isConnected, false);
});

test('keyboard navigation skips disabled items and Tab continues after the trigger', async () => {
  const { doc, anchor, next } = browserBoundary();
  const popup = openMenu(anchor, { items: [{ label: 'First' }, { label: 'Unavailable', disabled: true }, { label: 'Last' }] }); await settle();
  const menu = popup.panel.children[0];
  menu.onkeydown({ key: 'ArrowDown', preventDefault() {} }); assert.equal(doc.activeElement, menu.children[2]);
  let prevented = false; menu.onkeydown({ key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(doc.activeElement, next); await popup.hidePopover();
  assert.equal(doc.activeElement, next, 'closing does not steal focus back to the anchor');
});

test('a scoped theme is copied to its portal and refreshed without a stylesheet clone', async () => {
  const { doc, anchor, content, flush } = browserBoundary();
  const scope = doc.createElement('section'); scope.classList.add('tblu-root'); scope.dataset.tbluTheme = 'dark'; scope.dataset.tbluMaterial = 'liquid'; scope.dataset.tbluMotion = 'reduced'; scope.style.setProperty('--tblu-color-accent', '#123456');
  anchor.remove(); doc.body.append(scope); scope.append(anchor);
  const popup = createPopover(anchor, { content: content() }); await settle();
  assert.equal(popup.dataset.tbluTheme, 'dark'); assert.equal(popup.style.getPropertyValue('--tblu-color-accent'), '#123456'); assert.equal(popup.classList.contains('tblu-root'), true);
  scope.dataset.tbluTheme = 'light'; scope.style.setProperty('--tblu-color-accent', '#654321'); flush();
  assert.equal(popup.dataset.tbluTheme, 'light'); assert.equal(popup.style.getPropertyValue('--tblu-color-accent'), '#654321');
  await destroyOverlays(scope); assert.equal(popup.isConnected, false);
});
