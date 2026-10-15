import {mountControls} from './controls.js';
import {createMaterial} from './material.js';
import {icon,iconURL,iconNames,registerIcons} from './icons.js';
import {normalizeTheme} from './theme.mjs';
import {destroyOverlays} from './overlays.js';
import {destroyFeedback,attachTooltip} from './feedback.js';
export {mountControls,createMaterial,icon,iconURL,iconNames};
export {openMenu,createPopover,destroyOverlays} from './overlays.js';
export {mountSidebarResize} from './sidebar.js';
export {mountFloatingTableHeader} from './floating-table.js';
export {openDialog,createDialog,showToast,attachTooltip,destroyFeedback} from './feedback.js';
export {loadPrimitives,primitiveNames} from './primitives.js';
export * as motion from './motion.js';
const instances = new WeakMap();
export function mountUI(root = document, options = {}) {
  if (instances.has(root)) return instances.get(root);
  // Cache before initialization starts: registration and custom-element upgrades
  // may yield, so concurrent callers must share the same mount and baseline.
  let pending;
  pending = Promise.resolve().then(() => initialize(root, options)).catch(error => {
    if (instances.get(root) === pending) instances.delete(root);
    throw error;
  });
  instances.set(root, pending);
  return pending;
}

async function initialize(root, options) {
  const themeRoot = options.themeRoot || (root.nodeType === 9 ? root.documentElement : root);
  const doc = root.ownerDocument || root;
  let config = normalizeTheme(options), destroyed = false;
  const attributes = ['data-tblu-theme','data-tblu-material','data-tblu-motion','data-tblu-input'];
  const properties = ['--tblu-color-accent','--tblu-lens-blur','--tblu-lens-brightness','--tblu-check-icon','--tblu-minus-icon'];
  const baselineAttributes = new Map(attributes.map(name=>[name,themeRoot.getAttribute(name)]));
  const baselineProperties = new Map(properties.map(name=>[name,[themeRoot.style.getPropertyValue(name),themeRoot.style.getPropertyPriority(name)]]));
  const hadRootClass = themeRoot.classList.contains('tblu-root'); themeRoot.classList.add('tblu-root');
  const system = doc.defaultView.matchMedia('(prefers-color-scheme: dark)');
  const automaticSurfaces = new Map();
  let observer, controls, material, frame, overlayCleanup;
  const pointerOptions = { capture:true, passive:true };
  const setInput = value => { if (!destroyed && themeRoot.dataset.tbluInput !== value) themeRoot.dataset.tbluInput = value; };
  const pointerInput = () => setInput('pointer');
  const keyboardInput = event => {
    if (event.ctrlKey || event.metaKey || event.altKey || ['Shift','Control','Alt','Meta','AltGraph'].includes(event.key)) return;
    setInput('keyboard');
  };
  const apply = () => {
    themeRoot.dataset.tbluTheme = config.theme === 'system' ? (system.matches ? 'dark' : 'light') : config.theme;
    themeRoot.dataset.tbluMaterial = config.material; themeRoot.dataset.tbluMotion = config.motion;
    themeRoot.style.setProperty('--tblu-color-accent',config.accent);
    themeRoot.style.setProperty('--tblu-lens-blur',`${config.blur}px`);
    themeRoot.style.setProperty('--tblu-lens-brightness',String(themeRoot.dataset.tbluTheme === 'dark' ? 1-config.contrast : 1+config.contrast));
    themeRoot.style.setProperty('--tblu-check-icon',`url("${iconURL('Check')}")`);
    themeRoot.style.setProperty('--tblu-minus-icon',`url("${iconURL('Minus')}")`);
  };
  const prepare = () => {
    if(options.tooltips!==false){
      for(const element of root.querySelectorAll('button[title],a[title],td[title],[data-tblu-tooltip][title]')){
        if(element.title?.trim() && (element.getAttribute('aria-label') || element.textContent?.trim()))attachTooltip(element,{text:element.title});
      }
    }
    const selector = '.tblu-button,.tblu-icon-button,.tblu-chip,.tblu-card,.tblu-panel,.tblu-menu-item';
    for (const [element, surface] of automaticSurfaces) {
      if (!element.isConnected || !element.matches(selector)) {
        if (element.getAttribute('data-tblu-surface') === surface) element.removeAttribute('data-tblu-surface');
        automaticSurfaces.delete(element);
      }
    }
    const elements = [...root.querySelectorAll(selector)];
    if (root.nodeType === 1 && root.matches(selector)) elements.unshift(root);
    for (const element of elements) {
      const previous = automaticSurfaces.get(element);
      if (element.dataset.tbluVariant === 'quiet') {
        if (previous && element.getAttribute('data-tblu-surface') === previous) element.removeAttribute('data-tblu-surface');
        automaticSurfaces.delete(element);
        continue;
      }
      if (element.hasAttribute('data-tblu-surface') && (!previous || element.getAttribute('data-tblu-surface') !== previous)) continue;
      const surface = element.classList.contains('tblu-card') ? 'card' : element.classList.contains('tblu-panel') ? 'panel' : 'control';
      element.dataset.tbluSurface = surface; automaticSurfaces.set(element, surface);
    }
  };
  const meaningful = value => String(value || '').split(/\s+/).filter(value=>!['tblu-surface','tblu-pointer-lit','tblu-active'].includes(value)).sort().join(' ');
  const cleanup = () => {
    if (destroyed) return overlayCleanup;
    destroyed = true;
    observer?.disconnect();
    if (frame !== undefined) doc.defaultView.cancelAnimationFrame(frame);
    // Portals live outside an Element root, but their anchors still belong to it.
    overlayCleanup = Promise.all([destroyOverlays(root),destroyFeedback(root)]);
    controls?.destroy(); material?.destroy(); system.removeEventListener('change',apply);
    doc.removeEventListener('pointerdown',pointerInput,pointerOptions);
    doc.removeEventListener('keydown',keyboardInput,true);
    for (const [element, surface] of automaticSurfaces) if (element.getAttribute('data-tblu-surface') === surface) element.removeAttribute('data-tblu-surface');
    automaticSurfaces.clear();
    if (!hadRootClass) themeRoot.classList.remove('tblu-root');
    for (const [name,value] of baselineAttributes) value === null ? themeRoot.removeAttribute(name) : themeRoot.setAttribute(name,value);
    for (const [name,[value,priority]] of baselineProperties) value ? themeRoot.style.setProperty(name,value,priority) : themeRoot.style.removeProperty(name);
    instances.delete(root);
    return overlayCleanup;
  };
  try {
    await registerIcons(); apply(); system.addEventListener('change',apply);
    setInput('keyboard');
    // Input modality belongs to the document, including portals outside a scoped root.
    doc.addEventListener('pointerdown',pointerInput,pointerOptions);
    doc.addEventListener('keydown',keyboardInput,true);
    observer = new doc.defaultView.MutationObserver(records=>{
      if (!records.some(record=>!record.target.closest?.('.tblu-material-filters') && (record.type !== 'attributes' || record.attributeName !== 'class' || meaningful(record.oldValue) !== meaningful(record.target.getAttribute('class'))))) return;
      if (frame === undefined) frame = doc.defaultView.requestAnimationFrame(()=>{ frame=undefined; if (!destroyed) prepare(); });
    });
    observer.observe(root.nodeType === 9 ? root.documentElement : root,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','data-tblu-variant']});
    prepare();
    controls = options.enhanceNative === false ? null : mountControls(root,{icon,labels:options.labels,locale:options.locale || doc.documentElement.lang || 'en'});
    material = createMaterial({root,themeRoot});
    return {
      setTheme(patch) { if (destroyed) throw new Error('UI instance was destroyed'); config=normalizeTheme({...config,...patch}); apply(); material.refresh(); },
      refresh() { if (!destroyed) { prepare(); controls?.refresh(); material.refresh(); } },
      destroy:cleanup,
      get theme() { return {...config}; },
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
