/* Derived from tblu-bookmark / Pintree. MIT, Copyright (c) 2024 Pintree.io. */
import { bevelProfile, fillSurfacePixels, geometryKey, isSelectedSurface, normalizeRadii } from './material-math.mjs';

const instances = new WeakMap();
let nextInstance = 0;
const svgNS = 'http://www.w3.org/2000/svg';
const managedProperties = ['--tblu-lens', '--tblu-light-x', '--tblu-light-y', '--tblu-light-radius-x', '--tblu-light-radius-y', '--tblu-ambient-x', '--tblu-ambient-y', '--tblu-ambient-intensity'];
const runtimeClasses = ['tblu-surface', 'tblu-pointer-lit', 'tblu-active'];

/** Mount one scoped material controller. Calling again with the same root reuses it. */
export function createMaterial({ root = document, themeRoot = root.nodeType === 9 ? root.documentElement : root.ownerDocument.documentElement, selector = '[data-tblu-surface]' } = {}) {
  if (instances.has(root)) { const existing = instances.get(root); existing.refresh(); return existing; }
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const view = doc?.defaultView;
  if (!view || !root.querySelectorAll) throw new TypeError('createMaterial requires a mounted DOM root');
  const frame = callback => view.requestAnimationFrame(callback);
  const cancelFrame = id => { if (id !== undefined) view.cancelAnimationFrame(id); };
  const computed = (element, pseudo) => view.getComputedStyle(element, pseudo);
  const media = query => view.matchMedia(query);
  const reducedTransparency = media('(prefers-reduced-transparency: reduce)');
  const forcedColors = media('(forced-colors: active)');
  const reducedMotion = media('(prefers-reduced-motion: reduce)');
  const lensSupported = /Chrome|Chromium|Edg\//.test(view.navigator.userAgent) && view.CSS?.supports('backdrop-filter', 'url(#tblu-lens)');
  const materialEnabled = () => themeRoot.dataset.tbluMaterial === 'liquid' && !reducedTransparency.matches && !forcedColors.matches;
  const motionEnabled = () => themeRoot.dataset.tbluMotion !== 'reduced' && !reducedMotion.matches;
  const tracked = new Map(), maps = new Map(), animations = new Map(), listeners = [];
  const prefix = `tblu-lens-${++nextInstance}-`;
  let nextLens = 0, scanFrame, ambientFrame, pointerFrame, activeSurface, pending, destroyed = false;
  const svg = doc.createElementNS(svgNS, 'svg');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.classList.add('tblu-material-filters');
  const defs = doc.createElementNS(svgNS, 'defs'); svg.append(defs); (doc.body || doc.documentElement).append(svg);

  const listen = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
    listeners.push(() => target.removeEventListener(type, callback, options));
  };
  const setProperty = (element, name, value) => {
    if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
  };
  function clearAnimations(element) {
    animations.get(element)?.forEach(animation => animation.cancel()); animations.delete(element);
  }
  function pointerLight(element, lit) {
    if (!element || element.classList.contains('tblu-pointer-lit') === lit) return;
    const rim = tracked.get(element)?.rim;
    const layers = [{ element, pseudo: '::before', target: lit ? .85 : 0 }];
    if (rim) layers.push({ element: rim, pseudo: '::after', target: lit ? 1 : 0 });
    const starts = layers.map(layer => Number(computed(layer.element, layer.pseudo).opacity));
    clearAnimations(element);
    element.classList.toggle('tblu-pointer-lit', lit);
    if (!motionEnabled()) return;
    const token = computed(themeRoot).getPropertyValue(lit ? '--tblu-motion-enter' : '--tblu-motion-exit').trim();
    const parsed = Number.parseFloat(token);
    const duration = Number.isFinite(parsed) ? parsed * (token.endsWith('ms') ? 1 : 1000) : lit ? 440 : 320;
    const running = [];
    layers.forEach((layer, index) => {
      try {
        const animation = layer.element.animate([{ opacity: Number.isFinite(starts[index]) ? starts[index] : 0 }, { opacity: layer.target }], {
          pseudoElement: layer.pseudo, duration, easing: 'cubic-bezier(.22,1,.36,1)',
        });
        running.push(animation);
        animation.onfinish = () => {
          if (animations.get(element) === running && running.every(item => item.playState === 'finished')) animations.delete(element);
        };
      } catch { /* CSS transitions preserve the same states without pseudo animation support. */ }
    });
    if (running.length) animations.set(element, running);
  }
  function clearPointer() { pointerLight(activeSurface, false); activeSurface = pending = undefined; }
  function resetAnimations() { clearPointer(); for (const element of animations.keys()) clearAnimations(element); }

  function updateLens(element) {
    const entry = tracked.get(element);
    if (!entry || !element.isConnected) return;
    if (!materialEnabled() || !lensSupported || !entry.visible) { element.style.removeProperty('--tblu-lens'); return; }
    const skin = computed(element), width = Math.round(element.offsetWidth), height = Math.round(element.offsetHeight);
    if (!width || !height) { element.style.removeProperty('--tblu-lens'); return; }
    const corners = normalizeRadii([skin.borderTopLeftRadius, skin.borderTopRightRadius, skin.borderBottomRightRadius, skin.borderBottomLeftRadius], width, height);
    const key = geometryKey(width, height, corners);
    if (key !== entry.key) {
      const profile = bevelProfile(width, height, Math.max(...corners.flat()));
      for (const node of [entry.filter, entry.image]) { node.setAttribute('width', String(width)); node.setAttribute('height', String(height)); }
      entry.displacement.setAttribute('scale', String(profile.scale));
      let map = maps.get(key);
      if (!map) {
        const canvas = doc.createElement('canvas'), ratio = Math.min(1, 512 / Math.max(width, height));
        canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
        const context = canvas.getContext('2d'); if (!context) return;
        const pixels = context.createImageData(canvas.width, canvas.height);
        fillSurfacePixels(pixels.data, canvas.width, canvas.height, width, height, corners, ratio, profile);
        context.putImageData(pixels, 0, 0); map = canvas.toDataURL();
        if (maps.size >= 128) maps.delete(maps.keys().next().value);
        maps.set(key, map);
      }
      entry.image.setAttribute('href', map);
      entry.key = key;
    }
    setProperty(element, '--tblu-lens', `url(#${entry.id})`);
  }
  const resizeObserver = view.ResizeObserver ? new view.ResizeObserver(entries => {
    entries.forEach(({ target }) => updateLens(target)); scheduleAmbient();
  }) : null;
  const visibilityObserver = view.IntersectionObserver ? new view.IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      const entry = tracked.get(target); if (!entry) return;
      entry.visible = isIntersecting; updateLens(target);
      if (!isIntersecting) { target.classList.remove('tblu-active'); setProperty(target, '--tblu-ambient-intensity', '0'); }
    });
    scheduleAmbient();
  }, { rootMargin: '100px' }) : null;

  function register(element, manual = true) {
    if (destroyed || !element?.style || element.ownerDocument !== doc) return;
    if (tracked.has(element)) { if (manual) tracked.get(element).manual = true; return; }
    const initialStyles = new Map(managedProperties.map(name => [name, [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]]));
    const initialClasses = new Set(runtimeClasses.filter(name => element.classList.contains(name)));
    element.classList.add('tblu-surface');
    // Reuse author-provided decoration; never duplicate a rim during content rerenders.
    let rim = [...element.children].find(child => child.classList.contains('tblu-rim-light'));
    const ownedRim = !rim;
    if (!rim && !/^(INPUT|SELECT|TEXTAREA|IMG|BR|HR|AREA|BASE|EMBED|LINK|META|PARAM|SOURCE|TRACK|WBR)$/.test(element.tagName)) {
      rim = doc.createElement('span'); rim.className = 'tblu-rim-light'; rim.setAttribute('aria-hidden', 'true'); element.append(rim);
    }
    const id = `${prefix}${++nextLens}`, filter = doc.createElementNS(svgNS, 'filter');
    filter.id = id;
    for (const name of ['x', 'y']) filter.setAttribute(name, '0');
    filter.setAttribute('filterUnits', 'userSpaceOnUse'); filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const image = doc.createElementNS(svgNS, 'feImage');
    image.setAttribute('x', '0'); image.setAttribute('y', '0'); image.setAttribute('preserveAspectRatio', 'none'); image.setAttribute('result', 'lens');
    const displacement = doc.createElementNS(svgNS, 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic'); displacement.setAttribute('in2', 'lens'); displacement.setAttribute('scale', '0');
    displacement.setAttribute('xChannelSelector', 'R'); displacement.setAttribute('yChannelSelector', 'G');
    filter.append(image, displacement); defs.append(filter);
    tracked.set(element, { id, filter, image, displacement, rim, ownedRim, manual, initialStyles, initialClasses, visible: !visibilityObserver });
    resizeObserver?.observe(element); visibilityObserver?.observe(element); updateLens(element);
  }
  function unregister(element) {
    const entry = tracked.get(element); if (!entry) return;
    if (activeSurface === element) clearPointer();
    clearAnimations(element); resizeObserver?.unobserve(element); visibilityObserver?.unobserve(element); entry.filter.remove();
    if (entry.ownedRim) entry.rim?.remove();
    runtimeClasses.forEach(name => element.classList.toggle(name, entry.initialClasses.has(name)));
    for (const [name, [value, priority]] of entry.initialStyles) value ? element.style.setProperty(name, value, priority) : element.style.removeProperty(name);
    tracked.delete(element);
  }
  function refresh() {
    if (destroyed) return;
    cancelFrame(scanFrame); scanFrame = undefined;
    for (const [element, entry] of tracked) {
      if (!element.isConnected || (!entry.manual && !element.matches(selector))) { unregister(element); continue; }
      if (entry.rim && entry.rim.parentElement !== element) element.append(entry.rim);
      updateLens(element);
    }
    if (root.nodeType === 1 && root.matches(selector)) register(root, false);
    root.querySelectorAll(selector).forEach(element => register(element, false));
    scheduleAmbient();
  }
  function scheduleScan() { if (!destroyed && scanFrame === undefined) scanFrame = frame(refresh); }
  function scheduleAmbient() { if (!destroyed && ambientFrame === undefined) ambientFrame = frame(() => { ambientFrame = undefined; updateAmbient(); }); }
  function closestSurface(element) {
    while (element) { if (tracked.has(element)) return element; element = element.parentElement || element.getRootNode?.().host; }
    return null;
  }
  function updateAmbient() {
    if (!materialEnabled()) {
      for (const element of tracked.keys()) { element.classList.remove('tblu-active'); setProperty(element, '--tblu-ambient-intensity', '0'); }
      return;
    }
    let focused = doc.activeElement;
    while (focused?.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement;
    const editing = focused?.matches('input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable]:not([contenteditable=false])');
    const focusedSurface = focused && (editing || focused.matches(':focus-visible')) ? closestSurface(focused) : null;
    const modal = [...doc.querySelectorAll('dialog[open]')].at(-1);
    if (modal && activeSurface && !modal.contains(activeSurface)) clearPointer();
    // Only visible receivers need geometry. Reads are batched before any writes.
    const surfaces = [...tracked].filter(([element, entry]) => element.isConnected && entry.visible).map(([element]) => {
      const rect = element.getBoundingClientRect(), inScope = !modal || modal.contains(element);
      const active = inScope && !element.closest('[inert],[hidden]') && !element.matches(':disabled,[aria-disabled=true]') && (element === focusedSurface || isSelectedSurface(element));
      const lit = active && !!element.getClientRects().length && computed(element).visibility !== 'hidden';
      return { element, rect, inScope, lit, power: element === focusedSurface ? .8 : .4 };
    });
    const lights = surfaces.filter(item => item.lit);
    for (const { element, rect, inScope, lit } of surfaces) {
      element.classList.toggle('tblu-active', Boolean(lit));
      let strength = 0, light;
      if (inScope && rect.width && rect.height) for (const source of lights) {
        if (source.element === element || source.element.contains(element) || element.contains(source.element)) continue;
        const dx = Math.max(source.rect.left - rect.right, rect.left - source.rect.right, 0);
        const dy = Math.max(source.rect.top - rect.bottom, rect.top - source.rect.bottom, 0);
        if (dx >= 280 || dy >= 280) continue;
        const intensity = Math.pow(Math.max(0, 1 - Math.hypot(dx, dy) / 280), 2) * source.power;
        if (intensity > strength) { strength = intensity; light = source; }
      }
      setProperty(element, '--tblu-ambient-intensity', strength.toFixed(3));
      if (light) {
        const x = Math.max(light.rect.left, Math.min(light.rect.right, rect.left + rect.width / 2));
        const y = Math.max(light.rect.top, Math.min(light.rect.bottom, rect.top + rect.height / 2));
        setProperty(element, '--tblu-ambient-x', `${(x - rect.left) / rect.width * 100}%`);
        setProperty(element, '--tblu-ambient-y', `${(y - rect.top) / rect.height * 100}%`);
      }
    }
  }
  const childObserver = new view.MutationObserver(records => { if (records.some(record => !svg.contains(record.target))) scheduleScan(); });
  childObserver.observe(root, { childList: true, subtree: true });
  const stateObserver = new view.MutationObserver(records => {
    const classes = value => (value || '').split(/\s+/).filter(name => name && !runtimeClasses.includes(name)).join(' ');
    const meaningful = records.filter(record => record.attributeName !== 'class' || classes(record.oldValue) !== classes(record.target.getAttribute('class')));
    if (meaningful.length) scheduleAmbient();
    if (meaningful.some(record => record.attributeName === 'data-tblu-surface' || record.attributeName === 'class')) scheduleScan();
  });
  stateObserver.observe(root, { attributes: true, attributeOldValue: true, subtree: true, attributeFilter: ['aria-selected', 'aria-checked', 'aria-pressed', 'aria-expanded', 'aria-disabled', 'data-tblu-selected', 'data-tblu-surface', 'open', 'checked', 'class', 'hidden', 'inert', 'disabled'] });
  const themeObserver = new view.MutationObserver(() => { resetAnimations(); refresh(); });
  themeObserver.observe(themeRoot, { attributes: true, attributeFilter: ['data-tblu-material', 'data-tblu-motion', 'data-tblu-theme'] });
  listen(root, 'pointermove', event => {
    if (event.pointerType !== 'mouse' || !materialEnabled() || !motionEnabled()) return;
    const element = event.composedPath().find(item => tracked.has(item) && !item.matches(':disabled,[aria-disabled=true]'));
    if (element !== activeSurface) { pointerLight(activeSurface, false); activeSurface = element; }
    if (!element) { pending = undefined; return; }
    pointerLight(element, true); pending = { element, x: event.clientX, y: event.clientY };
    if (pointerFrame === undefined) pointerFrame = frame(() => {
      pointerFrame = undefined; if (!pending || !tracked.has(pending.element)) return;
      const { element, x, y } = pending, rect = element.getBoundingClientRect();
      setProperty(element, '--tblu-light-x', `${x - rect.left}px`); setProperty(element, '--tblu-light-y', `${y - rect.top}px`);
      setProperty(element, '--tblu-light-radius-x', `${Math.max(45, Math.min(180, rect.width * .65))}px`);
      setProperty(element, '--tblu-light-radius-y', `${Math.max(38, Math.min(130, rect.height * .75))}px`);
    });
  }, { passive: true });
  listen(root, 'pointerout', event => { if (event.pointerType === 'mouse' && activeSurface && !activeSurface.contains(event.relatedTarget)) clearPointer(); }, { passive: true });
  listen(view, 'blur', clearPointer);
  for (const type of ['focusin', 'focusout', 'keydown', 'change']) listen(root, type, scheduleAmbient);
  listen(root, 'pointerdown', scheduleAmbient, { passive: true });
  listen(root, 'scroll', scheduleAmbient, { passive: true, capture: true });
  listen(view, 'resize', () => { refresh(); scheduleAmbient(); }, { passive: true });
  for (const preference of [reducedTransparency, forcedColors, reducedMotion]) listen(preference, 'change', () => { resetAnimations(); refresh(); });
  const api = {
    refresh, register, unregister,
    destroy() {
      if (destroyed) return; destroyed = true;
      cancelFrame(scanFrame); cancelFrame(ambientFrame); cancelFrame(pointerFrame); resetAnimations();
      childObserver.disconnect(); stateObserver.disconnect(); themeObserver.disconnect(); resizeObserver?.disconnect(); visibilityObserver?.disconnect();
      listeners.forEach(remove => remove()); for (const element of [...tracked.keys()]) unregister(element);
      maps.clear(); svg.remove(); instances.delete(root);
    },
  };
  instances.set(root, api); refresh(); return api;
}
