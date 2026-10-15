import '@awesome.me/webawesome/dist/components/popup/popup.js';
import { icon } from './icons.js';
import { createMaterial } from './material.js';
import { menuEnter, menuLeave } from './motion.js';

const byAnchor = new WeakMap();
const overlays = new Set();
let nextOverlay = 0;
const ownedAttributes = ['aria-expanded', 'aria-controls', 'aria-haspopup'];

function reportError(anchor, error, onError) {
  const emit = failure => {
    const Event = anchor.ownerDocument.defaultView.CustomEvent;
    anchor.dispatchEvent(new Event('tblu-error', { bubbles: true, composed: true, detail: { error: failure, source: 'overlay' } }));
  };
  if (onError) {
    try { Promise.resolve(onError(error)).catch(emit); return; } catch (handlerError) { error = handlerError; }
  }
  emit(error);
}

function nextTabTarget(anchor, popup, backwards) {
  const doc = anchor.ownerDocument;
  const candidates = [...doc.querySelectorAll('a[href],button,input,select,textarea,wa-select,wa-color-picker,wa-switch,[tabindex]')].filter(element => {
    if (popup.contains(element) || element.disabled || element.closest('[inert],[hidden],[aria-hidden=true]')) return false;
    if (element.tabIndex < 0 && !element.matches('wa-select,wa-color-picker,wa-switch')) return false;
    const style = doc.defaultView.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length;
  });
  const index = candidates.indexOf(anchor);
  if (index < 0) return null;
  return candidates[index + (backwards ? -1 : 1)] || null;
}

/** Create a nonmodal anchored surface. Repeating the same anchor toggles it closed. */
export function createPopover(anchor, { content, title = '', placement = 'bottom-end', onClose, onError } = {}) {
  if (!anchor?.ownerDocument || !content?.nodeType) throw new TypeError('An anchor and content Node are required');
  const existing = byAnchor.get(anchor);
  if (existing && existing.popup.isConnected) { existing.close(); return existing.popup; }
  const doc = anchor.ownerDocument, view = doc.defaultView;
  if (!anchor.isConnected) throw new TypeError('The overlay anchor must be connected');
  const popup = doc.createElement('wa-popup');
  popup.anchor = anchor; popup.placement = placement; popup.distance = 12;
  popup.flip = popup.shift = true; popup.flipPadding = popup.shiftPadding = 16;
  const panel = doc.createElement('div');
  panel.className = 'tblu-panel'; panel.id = `tblu-overlay-${++nextOverlay}`;
  panel.dataset.tbluSurface = 'panel'; panel.dataset.tbluElevation = '2';
  panel.style.maxInlineSize = 'min(420px, calc(100vw - 32px))';
  panel.style.overflowWrap = 'anywhere';
  panel.setAttribute('role', 'dialog'); if (title) panel.setAttribute('aria-label', title);
  panel.append(content); popup.append(panel);
  const baseline = new Map(ownedAttributes.map(name => [name, anchor.getAttribute(name)]));
  anchor.setAttribute('aria-expanded', 'true'); anchor.setAttribute('aria-controls', panel.id);
  anchor.setAttribute('aria-haspopup', 'dialog');
  let closing, finalized = false, placementObserver, portalMaterial, themeObserver;
  const tokenNames = new Set();
  const themeRoot = anchor.closest('.tblu-root');
  function syncPortalTheme() {
    if (!themeRoot || themeRoot === doc.documentElement) return;
    popup.classList.add('tblu-root', 'tblu-ui');
    for (const name of ['theme', 'material', 'motion', 'input']) {
      if (themeRoot.dataset[`tblu${name[0].toUpperCase()}${name.slice(1)}`]) popup.dataset[`tblu${name[0].toUpperCase()}${name.slice(1)}`] = themeRoot.dataset[`tblu${name[0].toUpperCase()}${name.slice(1)}`];
    }
    const computed = view.getComputedStyle(themeRoot), active = new Set();
    for (let i = 0; i < computed.length; i++) {
      const name = computed.item(i);
      if (name.startsWith('--tblu-') || name.startsWith('--wa-')) { active.add(name); popup.style.setProperty(name, computed.getPropertyValue(name)); }
    }
    for (const name of tokenNames) if (!active.has(name)) popup.style.removeProperty(name);
    tokenNames.clear(); active.forEach(name => tokenNames.add(name));
    portalMaterial?.refresh();
  }
  syncPortalTheme();
  const entry = { anchor, popup, close: options => close(options) };
  function finalize() {
    if (finalized) return;
    finalized = true; portalMaterial?.destroy(); popup.active = false; popup.remove(); overlays.delete(entry);
    try { Promise.resolve(onClose?.()).catch(error => reportError(anchor, error, onError)); } catch (error) { reportError(anchor, error, onError); }
  }
  function close({ immediate = false, returnFocus = false } = {}) {
    if (returnFocus && anchor.isConnected) anchor.focus({ preventScroll: true });
    if (closing) { if (immediate) finalize(); return closing; }
    placementObserver?.disconnect(); themeObserver?.disconnect(); connectionObserver.disconnect();
    panel.inert = true; doc.removeEventListener('pointerdown', dismiss, true); doc.removeEventListener('keydown', escape, true);
    if (byAnchor.get(anchor) === entry) {
      byAnchor.delete(anchor);
      for (const [name, value] of baseline) value === null ? anchor.removeAttribute(name) : anchor.setAttribute(name, value);
    }
    if (immediate || !anchor.isConnected || !popup.isConnected) { finalize(); closing = Promise.resolve(); }
    else {
      closing = Promise.resolve().then(() => menuLeave(panel, anchor, popup.dataset.currentPlacement)).catch(error => reportError(anchor, error, onError)).then(finalize);
    }
    return closing;
  }
  const dismiss = event => { if (!event.composedPath().includes(popup) && !event.composedPath().includes(anchor)) close(); };
  const escape = event => { if (event.key === 'Escape') { event.preventDefault(); close({ returnFocus: true }); } };
  const connectionObserver = new view.MutationObserver(() => { if (!anchor.isConnected || !popup.isConnected) close({ immediate: true }); });
  connectionObserver.observe(doc.documentElement, { subtree: true, childList: true });
  popup.hidePopover = close; popup._anchor = anchor; popup.panel = panel;
  byAnchor.set(anchor, entry); overlays.add(entry);
  doc.body.append(popup); popup.active = true;
  if (themeRoot && themeRoot !== doc.documentElement) {
    portalMaterial = createMaterial({ root: popup, themeRoot: popup });
    themeObserver = new view.MutationObserver(syncPortalTheme);
    themeObserver.observe(themeRoot, { attributes: true, attributeFilter: ['data-tblu-theme', 'data-tblu-material', 'data-tblu-motion', 'data-tblu-input', 'style', 'class'] });
  }
  Promise.resolve(popup.updateComplete).then(() => {
    const enter = () => {
      placementObserver?.disconnect();
      if (popup.isConnected && !closing) {
        try { Promise.resolve(menuEnter(panel, anchor, popup.dataset.currentPlacement)).catch(error => reportError(anchor, error, onError)); }
        catch (error) { reportError(anchor, error, onError); }
      }
    };
    if (closing || !popup.isConnected) return;
    if (popup.hasAttribute('data-current-placement')) enter();
    else { placementObserver = new view.MutationObserver(enter); placementObserver.observe(popup, { attributes: true, attributeFilter: ['data-current-placement'] }); }
  }).catch(error => { reportError(anchor, error, onError); close({ immediate: true }); });
  doc.addEventListener('pointerdown', dismiss, true); doc.addEventListener('keydown', escape, true);
  return popup;
}

/** Remove every overlay anchored inside a root, including surfaces still exiting. */
export function destroyOverlays(root = document) {
  const pending = [];
  for (const entry of [...overlays]) {
    const contained = root.nodeType === 9 ? entry.anchor.ownerDocument === root : entry.anchor === root || root.contains(entry.anchor);
    if (contained) pending.push(entry.close({ immediate: true }));
  }
  return Promise.all(pending);
}

export function openMenu(anchor, { items = [], label = 'Actions', placement = 'bottom-end', onError } = {}) {
  const doc = anchor.ownerDocument;
  const menu = doc.createElement('div'); menu.className = 'tblu-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', label);
  let popup;
  items.forEach(item => {
    const button = doc.createElement('button'); button.type = 'button'; button.className = 'tblu-menu-item';
    button.setAttribute('role', 'menuitem'); button.tabIndex = -1; button.disabled = Boolean(item.disabled);
    if (item.variant) button.dataset.tbluVariant = item.variant;
    if (item.icon) { const template = doc.createElement('template'); template.innerHTML = icon(item.icon); button.append(template.content); }
    const text = doc.createElement('span'); text.textContent = item.label; button.append(text); menu.append(button);
    button.onclick = async () => {
      if (button.disabled) return;
      const hadFocus = menu.contains(doc.activeElement);
      let result;
      // Preserve the click's user activation for actions such as window.open().
      try { result = item.onSelect?.(); } catch (error) { reportError(anchor, error, onError); }
      const action = Promise.resolve(result).catch(error => reportError(anchor, error, onError));
      await Promise.all([popup.hidePopover(), action]);
      if (hadFocus && anchor.isConnected && (doc.activeElement === doc.body || menu.contains(doc.activeElement))) anchor.focus({ preventScroll: true });
    };
  });
  popup = createPopover(anchor, { content: menu, title: label, placement, onError });
  // A repeated same-anchor call toggles the previous surface and does not attach a new menu.
  if (!popup.panel.contains(menu)) return popup;
  popup.panel.removeAttribute('role'); popup.panel.removeAttribute('aria-label');
  menu.id = `${popup.panel.id}-menu`; anchor.setAttribute('aria-haspopup', 'menu'); anchor.setAttribute('aria-controls', menu.id);
  const buttons = [...menu.querySelectorAll('button:not(:disabled)')];
  menu.onkeydown = event => {
    if (event.key === 'Tab') {
      const target = nextTabTarget(anchor, popup, event.shiftKey);
      if (target) { event.preventDefault(); popup.hidePopover(); target.focus({ preventScroll: true }); }
      else doc.defaultView.setTimeout(() => popup.hidePopover(), 0);
      return;
    }
    if (!buttons.length) return;
    let index = buttons.indexOf(doc.activeElement);
    if (event.key === 'ArrowDown') index = (index + 1) % buttons.length;
    else if (event.key === 'ArrowUp') index = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = buttons.length - 1;
    else return;
    event.preventDefault(); buttons[index]?.focus();
  };
  Promise.resolve(popup.updateComplete).then(() => {
    if (popup.isConnected && !popup.panel.inert && anchor.getAttribute('aria-expanded') === 'true') buttons[0]?.focus({ preventScroll: true });
  }).catch(error => reportError(anchor, error, onError));
  return popup;
}
