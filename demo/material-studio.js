const instances = new WeakMap();
let nextInstance = 0;
const defaults = {material:'liquid',blur:3,contrast:.18,textSize:13,density:'comfortable'};
const bounded = (value,min,max,fallback) => Number.isFinite(value) ? Math.min(max,Math.max(min,value)) : fallback;

export function materialStudioValues(theme = {}) {
  return {
    material:theme.material === 'solid' ? 'solid' : 'liquid',
    blur:Math.round(bounded(theme.blur,1,16,defaults.blur)),
    contrast:bounded(theme.contrast,0,.4,defaults.contrast),
    textSize:Math.round(bounded(theme.textSize,11,16,defaults.textSize)),
    density:theme.density === 'compact' ? 'compact' : 'comfortable',
  };
}

function appendIcon(target,render,name) {
  if (!render) return;
  const document = target.ownerDocument, value = render(name);
  let source = value?.nodeType === 1 ? value : null;
  if (!source && typeof value === 'string') {
    const parsed = new document.defaultView.DOMParser().parseFromString(value,'image/svg+xml');
    if (!parsed.querySelector('parsererror')) source = parsed.documentElement;
  }
  if (source?.localName !== 'svg') return;
  const tags = new Set(['svg','g','path','circle','ellipse','rect','line','polyline','polygon']);
  const attributes = new Set(['viewBox','d','cx','cy','r','rx','ry','x','y','x1','x2','y1','y2','width','height','points','fill','fill-rule','clip-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','transform','opacity']);
  const clone = element => {
    if (!tags.has(element.localName)) return null;
    const safe = document.createElementNS('http://www.w3.org/2000/svg',element.localName);
    for (const attribute of element.attributes) if (attributes.has(attribute.name) && !/url\(/i.test(attribute.value)) safe.setAttribute(attribute.name,attribute.value);
    for (const child of element.children) { const safeChild = clone(child); if (safeChild) safe.append(safeChild); }
    return safe;
  };
  const safe = clone(source); safe.classList.add('tblu-icon'); safe.setAttribute('aria-hidden','true'); target.append(safe);
}

/** A demo composition of shared primitives; the page's single mountUI owns them. */
export function renderMaterialStudio(target,{updateTheme,getTheme = () => ({}),icon} = {}) {
  if (!target?.ownerDocument || typeof updateTheme !== 'function') throw new TypeError('Material studio requires a target and updateTheme callback.');
  instances.get(target)?.destroy();
  const previous = [...target.childNodes], prefix = `material-studio-${++nextInstance}`;
  const listeners = [];
  let stopped = false, values;
  target.innerHTML = `
    <div class="demo-material-layout">
      <article class="tblu-card demo-material-controls" data-tblu-surface="card">
        <h3>Material controls</h3>
        <p class="demo-material-caption">Choose a surface, then tune the shared components across this page.</p>
        <wa-radio-group class="tblu-radio-group demo-material-mode" label="Surface material" orientation="horizontal" size="s" data-material-mode>
          <wa-radio class="tblu-radio" value="liquid" appearance="button"><span class="tblu-preview demo-material-swatch" data-tblu-preview="liquid" data-tblu-surface="control" aria-hidden="true"></span><span>Liquid glass</span></wa-radio>
          <wa-radio class="tblu-radio" value="solid" appearance="button"><span class="tblu-preview demo-material-swatch" data-tblu-preview="solid" aria-hidden="true"></span><span>Solid</span></wa-radio>
        </wa-radio-group>
        <p class="demo-material-caption" id="${prefix}-optics-hint" data-material-hint>Blur softens the background. Contrast darkens the background in dark mode and brightens it in light mode.</p>
        <div class="demo-material-ranges">
          <label class="tblu-field demo-material-range"><span>Backdrop blur <output for="${prefix}-blur" data-material-output="blur">3px</output></span><input class="tblu-range" id="${prefix}-blur" type="range" min="1" max="16" step="1" value="3" data-material-setting="blur" aria-describedby="${prefix}-optics-hint"></label>
          <label class="tblu-field demo-material-range"><span>Backdrop contrast <output for="${prefix}-contrast" data-material-output="contrast">18%</output></span><input class="tblu-range" id="${prefix}-contrast" type="range" min="0" max="40" step="1" value="18" data-material-setting="contrast" aria-describedby="${prefix}-optics-hint"></label>
          <label class="tblu-field demo-material-range"><span>Content text size <output for="${prefix}-text-size" data-material-output="textSize">13px</output></span><input class="tblu-range" id="${prefix}-text-size" type="range" min="11" max="16" step="1" value="13" data-material-setting="textSize"></label>
        </div>
        <wa-radio-group class="tblu-radio-group demo-material-density" label="Content density" orientation="horizontal" size="s" data-material-density>
          <wa-radio class="tblu-radio" value="comfortable" appearance="button">Comfortable</wa-radio><wa-radio class="tblu-radio" value="compact" appearance="button">Compact</wa-radio>
        </wa-radio-group>
        <button class="tblu-button demo-material-reset" type="button" data-material-reset><span data-material-icon="RefreshCw"></span><span>Reset optics</span></button>
        <p class="demo-material-caption" role="status" aria-live="polite" data-material-reset-status></p>
      </article>
      <article class="tblu-card demo-material-live" data-tblu-surface="card">
        <div class="demo-material-preview-heading"><h3>Live material preview</h3><span class="tblu-chip" data-material-name>Liquid glass</span></div>
        <p class="demo-material-caption">Move your pointer across the surface, focus a control, or press the save button to compare feedback.</p>
        <div class="tblu-search demo-material-search" role="search" data-tblu-surface="control"><span data-material-icon="Search"></span><input class="tblu-input" type="search" aria-label="Search preview items" placeholder="Search preview items" data-material-search><button class="tblu-icon-button" type="button" data-tblu-variant="quiet" data-tblu-size="sm" aria-label="Clear preview search" data-material-clear hidden><span data-material-icon="X"></span></button></div>
        <div class="demo-material-items" data-material-items><span class="tblu-chip" data-material-item>Design notes</span><span class="tblu-chip" data-material-item>Bookmarks</span><span class="tblu-chip" data-material-item>Reading list</span></div>
        <p class="demo-material-caption" role="status" aria-live="polite" data-material-results>3 preview items</p>
        <button class="tblu-button" type="button" data-tblu-variant="primary" aria-pressed="false" data-material-save><span data-material-icon="Bookmark"></span><span data-material-save-label>Save preview</span></button>
        <p class="demo-material-caption" role="status" aria-live="polite" data-material-save-status>This preview stays in this page only.</p>
      </article>
    </div>`;
  const query = selector => target.querySelector(selector);
  target.querySelectorAll('[data-material-icon]').forEach(element=>appendIcon(element,icon,element.dataset.materialIcon));
  const mode = query('[data-material-mode]'), density = query('[data-material-density]');
  const inputs = [...target.querySelectorAll('[data-material-setting]')];
  const listen = (element,type,callback) => { element.addEventListener(type,callback); listeners.push(()=>element.removeEventListener(type,callback)); };

  function sync(theme = getTheme()) {
    if (stopped) return;
    values = materialStudioValues(theme);
    mode.value = values.material; density.value = values.density;
    for (const input of inputs) {
      const key = input.dataset.materialSetting, numeric = key === 'contrast' ? Math.round(values[key] * 100) : values[key];
      input.value = String(numeric); input.disabled = values.material === 'solid' && key !== 'textSize';
      query(`[data-material-output="${key}"]`).textContent = `${numeric}${key === 'contrast' ? '%' : 'px'}`;
    }
    query('[data-material-name]').textContent = values.material === 'solid' ? 'Solid' : 'Liquid glass';
    query('[data-material-hint]').textContent = values.material === 'solid'
      ? 'Solid panels use an opaque surface. Backdrop blur and contrast become available when you choose Liquid glass.'
      : 'Blur softens the background. Contrast darkens the background in dark mode and brightens it in light mode.';
  }

  function apply(patch) {
    if (stopped) return;
    if (Object.entries(patch).some(([key,value])=>values[key] !== value)) updateTheme(patch);
    sync({...values,...getTheme(),...patch});
  }

  listen(mode,'change',()=>apply({material:mode.value === 'solid' ? 'solid' : 'liquid'}));
  listen(density,'change',()=>apply({density:density.value === 'compact' ? 'compact' : 'comfortable'}));
  for (const input of inputs) {
    const update = () => {
      if (input.disabled) return;
      const key = input.dataset.materialSetting;
      apply({[key]:key === 'contrast' ? Number(input.value) / 100 : Number(input.value)});
      query('[data-material-reset-status]').textContent = '';
    };
    listen(input,'input',update); listen(input,'change',update);
  }
  listen(query('[data-material-reset]'),'click',()=>{
    apply({blur:defaults.blur,contrast:defaults.contrast});
    query('[data-material-reset-status]').textContent = 'Backdrop blur and contrast returned to 3px and 18%. Text size and density keep their current values.';
  });
  const search = query('[data-material-search]'), clear = query('[data-material-clear]');
  function filter() {
    const term = search.value.trim().toLocaleLowerCase(); let count = 0;
    target.querySelectorAll('[data-material-item]').forEach(item=>{ item.hidden = !item.textContent.toLocaleLowerCase().includes(term); if (!item.hidden) count++; });
    clear.hidden = !search.value;
    query('[data-material-results]').textContent = count ? `${count} preview ${count === 1 ? 'item' : 'items'}` : 'No preview items match your search.';
  }
  listen(search,'input',filter);
  listen(clear,'click',()=>{ search.value = ''; filter(); search.focus(); });
  const save = query('[data-material-save]');
  listen(save,'click',()=>{
    const selected = save.getAttribute('aria-pressed') !== 'true';
    save.setAttribute('aria-pressed',String(selected)); save.dataset.tbluSelected = String(selected);
    query('[data-material-save-label]').textContent = selected ? 'Saved preview' : 'Save preview';
    query('[data-material-save-status]').textContent = selected ? 'Preview saved for this page session.' : 'The preview is ready to save again.';
  });
  const controller = {
    sync,
    destroy() {
      if (stopped) return; stopped = true; listeners.forEach(remove=>remove()); target.replaceChildren(...previous); instances.delete(target);
    },
  };
  instances.set(target,controller); sync(getTheme());
  return controller;
}
