import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/color-picker/color-picker.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import { bridgeProperty, selectOptions, selectedValue, equivalentValue, normalColor } from './control-helpers.mjs';
import { mountTemporalPickers } from './temporal.js';

const sourceSelector = 'select,input[type=color],.tblu-switch input[type=checkbox]';
const fieldSelector = '.tblu-field textarea,.tblu-field input:not([type]),.tblu-field input:is([type=text],[type=password],[type=email],[type=url],[type=number],[type=tel],[type=search])';
const hiddenStyles = { position:'absolute', width:'1px', height:'1px', padding:'0', margin:'-1px', overflow:'hidden', clipPath:'inset(50%)', whiteSpace:'nowrap', border:'0', opacity:'0', pointerEvents:'none' };
const excludedLabelContent = '.tblu-control,.tblu-native-source,[aria-hidden=true],script,style,svg,input,select,textarea,button,wa-select,wa-switch,wa-color-picker';
const setAttribute = (element,name,value) => {
  if (value === null || value === undefined) { if (element.hasAttribute(name)) element.removeAttribute(name); }
  else if (element.getAttribute(name) !== String(value)) element.setAttribute(name,String(value));
};

function textWithoutControls(element) {
  const copy = element.cloneNode(true);
  copy.querySelectorAll(excludedLabelContent).forEach(node => node.remove());
  return copy.textContent.replace(/\s+/g,' ').trim();
}

function accessibleName(source,document,fallback) {
  const references = source.getAttribute('aria-labelledby')?.trim().split(/\s+/) || [];
  const fromReferences = references.map(id => document.getElementById(id)).filter(Boolean).map(textWithoutControls).join(' ').trim();
  if (fromReferences) return fromReferences;
  const explicit = source.getAttribute('aria-label');
  if (explicit?.trim()) return explicit.trim();
  const labels = [...source.labels || []];
  if (!labels.length && source.closest('label')) labels.push(source.closest('label'));
  const fromLabels = labels.map(textWithoutControls).filter(Boolean).join(' ');
  return fromLabels || source.title || fallback || source.name || '';
}

// Icon callbacks may return an SVG node or trusted SVG text. Rebuild allowed
// geometry rather than inserting HTML; scripts, event handlers and URLs cannot enter.
function iconNode(document,render,name) {
  if (!render) return null;
  const value = render(name), view = document.defaultView;
  let original = value?.nodeType === 1 ? value : null;
  if (!original && typeof value === 'string' && view?.DOMParser) {
    const parsed = new view.DOMParser().parseFromString(value,'image/svg+xml');
    if (!parsed.querySelector('parsererror')) original = parsed.documentElement;
  }
  if (original?.localName !== 'svg') return null;
  const allowedTags = new Set(['svg','g','path','circle','ellipse','rect','line','polyline','polygon']);
  const allowedAttributes = new Set(['viewBox','d','cx','cy','r','rx','ry','x','y','x1','x2','y1','y2','width','height','points','fill','fill-rule','clip-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','transform','opacity']);
  const clone = node => {
    if (!allowedTags.has(node.localName)) return null;
    const result = document.createElementNS('http://www.w3.org/2000/svg',node.localName);
    for (const attribute of node.attributes) if (allowedAttributes.has(attribute.name) && !/url\(/i.test(attribute.value)) result.setAttribute(attribute.name,attribute.value);
    for (const child of node.children) { const safe = clone(child); if (safe) result.append(safe); }
    return result;
  };
  const result = clone(original); result.classList.add('tblu-icon'); result.setAttribute('aria-hidden','true');
  return result;
}

/** Enhance native form controls while leaving their data and application handlers intact. */
export function mountControls(root = document,{icon,labels = {},locale = (root.ownerDocument || root).documentElement?.lang || 'en'} = {}) {
  const document = root.ownerDocument || root, view = document.defaultView;
  const entries = new Map(), fields = new Map(), standardized = new Map();
  let stopped = false, pending = false, syncing = false;
  const listeners = [];
  const listen = (target,type,handler,options) => { target.addEventListener(type,handler,options); const dispose = () => target.removeEventListener(type,handler,options); listeners.push(dispose); return dispose; };
  const withinRoot = node => node.isConnected && (root === document || root.contains(node));
  const defer = callback => (view?.queueMicrotask || queueMicrotask)(callback);
  const temporal = mountTemporalPickers(root,{icon,labels,locale});

  function sync(entry) {
    if (syncing || !withinRoot(entry.source)) return;
    syncing = true;
    try {
      const {source,control,kind} = entry;
      control.disabled = source.disabled || source.matches(':disabled');
      control.required = source.required;
      control.name = '';
      const name = accessibleName(source,document,labels[kind]);
      setAttribute(control,'aria-label',name);
      if (kind === 'switch') { if (entry.label.textContent !== name) entry.label.textContent = name; }
      else control.label = name;
      const description = source.getAttribute('aria-describedby');
      setAttribute(control,'aria-describedby',description);
      setAttribute(control,'aria-invalid',source.getAttribute('aria-invalid'));
      if (kind === 'select') {
        control.multiple = source.multiple;
        const options = selectOptions(source), signature = JSON.stringify(options.map(({selected,...option})=>option));
        if (signature !== entry.optionSignature) {
          entry.optionSignature = signature;
          control.querySelectorAll('wa-option').forEach(option=>option.remove());
          for (const option of options) {
            const node = document.createElement('wa-option'); node.className = 'tblu-option';
            node.value = option.value; node.disabled = option.disabled; node.textContent = option.label;
            if (option.group) node.setAttribute('data-group',option.group);
            control.append(node);
          }
          bridgeOptions(entry);
        }
        const value = selectedValue(source);
        if (!equivalentValue(control.value,value)) control.value = value;
        const defaultValue = source.multiple ? options.filter((option,index)=>source.options[index]?.defaultSelected).map(option=>option.value) : source.querySelector('option[selected]')?.value ?? source.options[0]?.value ?? '';
        if (!equivalentValue(control.defaultValue,defaultValue)) control.defaultValue = defaultValue;
      } else if (kind === 'switch') {
        control.checked = source.checked; control.defaultChecked = source.defaultChecked;
      } else {
        if (!equivalentValue(control.value,source.value)) control.value = source.value;
        control.defaultValue = source.defaultValue;
      }
      control.setCustomValidity?.(source.validity?.customError ? source.validationMessage : '');
      entry.wrapper.toggleAttribute('data-disabled',control.disabled);
    } finally { syncing = false; }
  }

  function bridgeOptions(entry) {
    entry.optionRestores.forEach(restore=>restore()); entry.optionRestores = [];
    for (const option of entry.source.options) for (const property of ['selected','defaultSelected','disabled','value','label','text']) {
      entry.optionRestores.push(bridgeProperty(option,property,()=>sync(entry)));
    }
  }

  function applyVisual(entry,type,emit = true) {
    const {source,control,kind} = entry;
    if (!withinRoot(source)) return;
    syncing = true;
    try {
      if (kind === 'switch') source.checked = control.checked;
      else if (kind === 'select' && source.multiple) {
        const selected = new Set(Array.isArray(control.value) ? control.value : [control.value]);
        for (const option of source.options) option.selected = selected.has(option.value);
      } else if (kind === 'color') {
        const value = normalColor(control.getFormattedValue?.('hex') || control.value);
        if (value) source.value = value;
      } else source.value = control.value ?? '';
    } finally { syncing = false; }
    sync(entry);
    if (emit) source.dispatchEvent(new view.Event(type,{bubbles:true,composed:true}));
  }

  function enhance(source) {
    if (!withinRoot(source) || source.dataset.tbluNativeSource || source.closest('wa-select,wa-color-picker,wa-switch')) return;
    const kind = source.localName === 'select' ? 'select' : source.type === 'color' ? 'color' : 'switch';
    const control = document.createElement(kind === 'select' ? 'wa-select' : kind === 'color' ? 'wa-color-picker' : 'wa-switch');
    control.className = `tblu-${kind === 'color' ? 'color-picker' : kind === 'switch' ? 'switch-control' : 'select'}`;
    control.dataset.tbluAdapter=kind;
    control.name = ''; control.size = 's';
    if (kind === 'select') control.pill = true;
    if (kind === 'color') { control.format = 'hex'; control.withoutFormatToggle = true; control.placement = 'bottom-start'; }
    const wrapper = document.createElement('span'); wrapper.className = `tblu-control tblu-control-${kind}`;
    if (kind !== 'switch') wrapper.dataset.tbluSurface = 'control';
    const attributes = new Map(['style','tabindex','aria-hidden','data-tblu-native-source'].map(name=>[name,source.getAttribute(name)]));
    const entry = {source,control,wrapper,kind,attributes,restores:[],optionRestores:[],disposers:[],visualClick:false,hadClass:source.classList.contains('tblu-native-source')};
    const on = (target,type,handler,options) => { target.addEventListener(type,handler,options); entry.disposers.push(()=>target.removeEventListener(type,handler,options)); };
    entries.set(source,entry);
    source.before(wrapper); wrapper.append(source,control);
    source.dataset.tbluNativeSource = kind; source.classList.add('tblu-native-source'); source.setAttribute('aria-hidden','true'); source.tabIndex = -1;
    Object.assign(source.style,hiddenStyles);
    if (kind === 'select') {
      const caret = iconNode(document,icon,'ChevronDown'); if (caret) { caret.setAttribute('slot','expand-icon'); control.append(caret); }
    } else if (kind === 'switch') {
      entry.label = document.createElement('span'); entry.label.className = 'tblu-control-label';
      Object.assign(entry.label.style,hiddenStyles); control.append(entry.label);
    }
    for (const property of ['value','checked','defaultChecked','defaultValue','selectedIndex','disabled','required','multiple']) entry.restores.push(bridgeProperty(source,property,()=>sync(entry)));
    const originalFocus = Object.getOwnPropertyDescriptor(source,'focus');
    Object.defineProperty(source,'focus',{configurable:true,value:options=>control.focus(options)});
    entry.restores.push(()=>{ if (originalFocus) Object.defineProperty(source,'focus',originalFocus); else delete source.focus; });
    on(source,'input',()=>sync(entry)); on(source,'change',()=>sync(entry));
    on(source,'invalid',event=>{ event.preventDefault(); sync(entry); control.setCustomValidity?.(source.validationMessage); control.focus(); control.reportValidity?.(); });
    // Web Awesome's switch click() delegates to its internal checkbox, whose
    // click handler toggles checked and emits change after updateComplete.
    // Waiting for its first render avoids calling click() before that input exists.
    const activate = () => {
      if (control.disabled) return;
      const action = () => { if (!withinRoot(source) || control.disabled) return; if (kind === 'switch') control.click(); else control.show?.(); };
      if (control.hasUpdated) action(); else control.updateComplete.then(action);
    };
    on(control,'click',()=>{ entry.visualClick = true; defer(()=>{ entry.visualClick = false; }); },true);
    on(source,'click',event=>{ event.preventDefault(); event.stopPropagation(); if (!entry.visualClick) activate(); defer(()=>applyVisual(entry,'change',false)); });
    for (const label of [...source.labels || []]) on(label,'click',event=>{
      if (event.composedPath().includes(control) || event.target === source) return;
      if (event.target.closest?.('button,a,input,select,textarea,wa-select,wa-color-picker,wa-switch')) return;
      event.preventDefault(); activate();
    });
    for (const type of ['input','change']) on(control,type,event=>{ event.stopPropagation(); applyVisual(entry,type); });
    on(control,'wa-invalid',event=>event.stopPropagation());
    sync(entry);
  }

  function release(entry) {
    entries.delete(entry.source); entry.disposers.forEach(dispose=>dispose()); entry.optionRestores.forEach(restore=>restore()); entry.restores.forEach(restore=>restore());
    for (const [name,value] of entry.attributes) { if (value === null) entry.source.removeAttribute(name); else entry.source.setAttribute(name,value); }
    if (!entry.hadClass) entry.source.classList.remove('tblu-native-source');
    if (entry.wrapper.contains(entry.source)) entry.wrapper.replaceWith(entry.source);
    else entry.wrapper.remove();
    entry.control.remove();
  }

  function syncField(entry) {
    entry.wrapper.toggleAttribute('data-disabled',entry.source.disabled || entry.source.matches(':disabled'));
    entry.wrapper.toggleAttribute('data-readonly',entry.source.readOnly);
    entry.wrapper.toggleAttribute('data-invalid',entry.source.getAttribute('aria-invalid') === 'true' || Boolean(entry.reportedInvalid && !entry.source.validity.valid));
  }

  function enhanceField(source) {
    const tree = source.getRootNode();
    if (!withinRoot(source) || fields.has(source) || source.dataset.tbluNativeSource || source.closest('.tblu-control,.tblu-search,wa-select,wa-switch,wa-color-picker') || tree.host?.localName.startsWith('wa-')) return;
    const wrapper = document.createElement('span');
    wrapper.className = `tblu-control tblu-control-${source.localName === 'textarea' ? 'textarea' : 'input'}`;
    wrapper.dataset.tbluSurface = 'control';
    const entry = {source,wrapper,hadClass:source.classList.contains('tblu-input'),restores:[],disposers:[]};
    fields.set(source,entry); source.before(wrapper); wrapper.append(source); source.classList.add('tblu-input');
    for (const property of ['disabled','readOnly']) entry.restores.push(bridgeProperty(source,property,()=>syncField(entry)));
    const invalid = () => { entry.reportedInvalid=true; syncField(entry); };
    const input = () => { if (source.validity.valid) entry.reportedInvalid=false; syncField(entry); };
    source.addEventListener('invalid',invalid); source.addEventListener('input',input);
    entry.disposers.push(()=>source.removeEventListener('invalid',invalid),()=>source.removeEventListener('input',input));
    syncField(entry);
  }

  function releaseField(entry) {
    fields.delete(entry.source); entry.restores.forEach(restore=>restore()); entry.disposers.forEach(dispose=>dispose());
    if (!entry.hadClass) entry.source.classList.remove('tblu-input');
    if (entry.wrapper.contains(entry.source)) entry.wrapper.replaceWith(entry.source); else entry.wrapper.remove();
  }

  function refresh() {
    if (stopped) return;
    temporal.refresh();
    for (const entry of [...entries.values()]) { if (!withinRoot(entry.source)) release(entry); else sync(entry); }
    for (const entry of [...fields.values()]) { if (!withinRoot(entry.source)) releaseField(entry); else syncField(entry); }
    for (const [element,className] of standardized) if (!withinRoot(element)) { element.classList.remove(className); standardized.delete(element); }
    const sources = [...root.querySelectorAll(sourceSelector)]; if (root.matches?.(sourceSelector)) sources.unshift(root);
    sources.forEach(enhance);
    const nativeFields = [...root.querySelectorAll(fieldSelector)]; if (root.matches?.(fieldSelector)) nativeFields.unshift(root);
    nativeFields.forEach(enhanceField);
    for (const [selector,className] of [['wa-switch','tblu-switch-control'],['wa-radio','tblu-radio'],['wa-radio-group','tblu-radio-group'],['input[type=checkbox]:not(.tblu-native-source):not(.tblu-switch input)','tblu-checkbox'],['input[type=range]','tblu-range'],['input[type=file]','tblu-file']]) {
      root.querySelectorAll(selector).forEach(element=>{
        if (!element.classList.contains(className)) { element.classList.add(className); standardized.set(element,className); }
      });
    }
  }
  const schedule = () => { if (pending || stopped) return; pending = true; defer(()=>{ pending = false; refresh(); }); };
  const observer = new view.MutationObserver(schedule);
  observer.observe(root === document ? document.documentElement : root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value','checked','disabled','readonly','required','multiple','selected','label','aria-label','aria-labelledby','aria-describedby','aria-invalid','title']});
  listen(root,'reset',()=>defer(()=>{
    for (const entry of entries.values()) sync(entry);
    for (const entry of fields.values()) { entry.reportedInvalid=false; entry.wrapper.removeAttribute('data-invalid'); syncField(entry); }
  }),true);
  refresh();
  return {
    refresh,
    destroy() { if (stopped) return; stopped = true; observer.disconnect(); temporal.destroy(); listeners.forEach(dispose=>dispose()); for (const entry of [...entries.values()]) release(entry); for (const entry of [...fields.values()]) releaseField(entry); for (const [element,className] of standardized) element.classList.remove(className); standardized.clear(); },
  };
}
