import { renderMaterialStudio } from './material-studio.js';
import {renderCatalog} from './catalog.js';
import { mountUI, icon, openMenu, createPopover, mountSidebarResize, mountFloatingTableHeader,showToast as notify,attachTooltip } from '../src/index.js';
import '../src/styles.css';
import './demo.css';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const defaults = { theme: 'dark', material: 'liquid', motion: 'full', accent: '#0284c7', blur:3, contrast:.18, textSize:13, density:'comfortable' };
let theme = { ...defaults };
const collections = [
  { icon: 'Folder', title: 'Design references', description: 'Foundations, systems, and thoughtful details.', chip: '12 items', elevation: '1' },
  { icon: 'Bookmark', title: 'Reading list', description: 'Ideas worth returning to.', chip: '8 items', elevation: '1' },
  { icon: 'Sparkles', title: 'Selected inspiration', description: 'A raised surface for a focused object.', chip: 'Elevation 2', elevation: '2' },
];
const tabContent = { library: { title: 'Your collection', items: collections }, favorites: { title: 'Saved for later', items: [collections[0], collections[2]] }, recent: { title: 'Recently opened', items: [collections[1]] } };
const collectionMarkup = (item) => `<article class="tblu-card demo-mini-card" data-tblu-surface="card" data-tblu-elevation="${item.elevation}"><span class="demo-mini-icon">${icon(item.icon)}</span><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.description)}</p><span class="tblu-chip" ${item.elevation === '2' ? 'data-tblu-selected="true"' : ''}>${escapeHTML(item.chip)}</span></article>`;
$('#surfaceCards').innerHTML = collections.map(collectionMarkup).join('');
$('#sizeExamples').innerHTML = [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']].map(([size, label]) => `<div class="demo-inline"><span class="demo-size-label">${label}</span><button class="tblu-icon-button" data-tblu-size="${size}" aria-label="Add ${label.toLowerCase()} item" data-demo-toast="Icon and text controls share the same height.">${icon('Plus')}</button><button class="tblu-button" data-tblu-size="${size}" data-demo-toast="Icon and text controls share the same height.">Add item</button></div>`).join('');
const rows = [
  { icon: 'Folder', name: 'Interface foundations', category: 'Design', date: 'Today', status: 'Available' },
  { icon: 'Bookmark', name: 'Accessibility checklist', category: 'Guidelines', date: 'Yesterday', status: 'Available' },
  { icon: 'Image', name: 'Material experiments', category: 'Exploration', date: 'Oct 12', status: 'Draft' },
];
$('#tableRows').innerHTML = rows.map((row) => `<tr><td><input class="tblu-checkbox" type="checkbox" data-row-selection aria-label="Select ${escapeHTML(row.name)}"/></td><td><span class="demo-table-name"><span>${icon(row.icon)}</span><strong>${escapeHTML(row.name)}</strong></span></td><td><span class="tblu-chip">${escapeHTML(row.category)}</span></td><td>${escapeHTML(row.date)}</td><td><span class="demo-table-status">${row.status === 'Available' ? '<span class="demo-status-dot" aria-hidden="true"></span>' : ''}${escapeHTML(row.status)}</span></td><td><button class="tblu-icon-button" data-tblu-size="sm" aria-label="Edit ${escapeHTML(row.name)}" data-demo-toast="The edit action uses the shared icon button.">${icon('Pencil')}</button></td></tr>`).join('');
$$('[data-demo-icon]').forEach((element) => { element.innerHTML = icon(element.dataset.demoIcon); });
const ui = await mountUI(document, { ...theme, enhanceNative: true });
const sidebarUI = mountSidebarResize({handle:$('#demoSidebarResize'),width:Number(localStorage.getItem('tblu-studio-sidebar')) || 248,enabled:()=>innerWidth>850,onCommit:width=>localStorage.setItem('tblu-studio-sidebar',String(width))});
const tableUI = mountFloatingTableHeader($('.demo-table-panel'));
const materialStudio = renderMaterialStudio($('#materials'),{updateTheme,getTheme:()=>theme,icon});
$('#materials').insertAdjacentHTML('afterbegin','<div class="demo-section-heading"><div><span class="demo-section-number">Materials</span><h2>Materials & optics</h2><p>Inspect the surface, then tune readability and density with shared controls.</p></div></div>');
const sidebarToggle = $('#demoSidebarToggle'), sidebar = $('#demoSidebar'), backdrop = $('#demoSidebarBackdrop');
let sidebarOpen = false;
function showSidebar(open) {
  sidebarOpen = open; document.body.dataset.sidebarOpen = String(open);
  sidebarToggle.setAttribute('aria-expanded',String(open));
  sidebarToggle.setAttribute('aria-label',open ? 'Close navigation' : 'Open navigation');
  const narrow = innerWidth <= 850; sidebar.inert = narrow && !open; backdrop.hidden = !narrow || !open; sidebarToggle.hidden = !narrow;
}
sidebarToggle.onclick = () => showSidebar(!sidebarOpen);
backdrop.onclick = () => showSidebar(false);
$('.demo-navigation').addEventListener('click',()=>{if(innerWidth<=850)showSidebar(false);});
window.addEventListener('resize',()=>showSidebar(false));
showSidebar(false); ui.refresh();

function updateTheme(patch) {
  theme = { ...theme, ...patch };
  ui.setTheme(theme);
  document.documentElement.style.setProperty('--tblu-content-font-size',`${theme.textSize}px`);
  document.documentElement.style.setProperty('--tblu-table-padding-block',theme.density === 'compact' ? '8px' : '16px');
  document.documentElement.style.setProperty('--tblu-card-padding',theme.density === 'compact' ? '16px' : '24px');
  materialStudio?.sync(theme);
  $('#materialMode').value = theme.material;
  const labels = { dark: 'Dark theme', light: 'Light theme', system: 'System theme' };
  $('#themeSummary').textContent = `${labels[theme.theme]} · ${theme.material === 'liquid' ? 'Liquid glass' : 'Solid'} · ${theme.motion === 'full' ? 'Full motion' : 'Reduced motion'}`;
  $('#themeCode').textContent = `ui.setTheme({ theme: '${theme.theme}', material: '${theme.material}', motion: '${theme.motion}', accent: '${theme.accent}' });`;
  document.documentElement.dataset.demoMotion = theme.motion;
}
$('#themeMode').addEventListener('change', (event) => updateTheme({ theme: event.target.value }));
$('#materialMode').addEventListener('change', (event) => updateTheme({ material: event.target.value }));
$('#motionMode').addEventListener('change', (event) => updateTheme({ motion: event.target.value }));
$('#accentColor').addEventListener('input', (event) => updateTheme({ accent: event.target.value }));
$('#accentColor').addEventListener('change', (event) => updateTheme({ accent: event.target.value }));
$('#resetTheme').addEventListener('click', () => {
  const fields = { theme: '#themeMode', material: '#materialMode', motion: '#motionMode', accent: '#accentColor' };
  Object.entries(fields).forEach(([key, selector]) => { $(selector).value = defaults[key]; $(selector).dispatchEvent(new Event('change', { bubbles: true })); });
  updateTheme(defaults);
});
function showToast(message) {
  return notify({message,root:document});
}
$('#demoToast')?.remove();
const catalogHost=document.createElement('section');catalogHost.id='catalog';catalogHost.className='demo-section';$('.demo-footer').before(catalogHost);
const catalog=await renderCatalog(catalogHost,{ui,notify:showToast});
for(const [hash,label,glyph] of [['catalog','Component directory','Grid2X2'],['catalog-forms','Forms & validation','Settings'],['catalog-temporal','Dates & scheduling','Calendar'],['catalog-media','Files & media','Image'],['catalog-workflow','Workflow & chat','Send'],['catalog-content','Metrics & editors','FileJson']]) {
  const link=document.createElement('a');link.className='tblu-menu-item';link.href='#'+hash;link.innerHTML=icon(glyph);link.append(document.createTextNode(label));$('.demo-navigation').append(link);
}
for(const button of $$('button[aria-label]:not([aria-haspopup]):not([hidden])'))attachTooltip(button,{text:button.getAttribute('aria-label')});
ui.refresh();
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-demo-toast]');
  if (action && !action.disabled) showToast(action.dataset.demoToast);
});
$('#actionMenu').addEventListener('click', (event) => openMenu(event.currentTarget, {
  label: 'Collection actions',
  items: [
    { label: 'Edit collection', icon: 'Pencil', onSelect: () => showToast('Edit action selected.') },
    { label: 'Open collection', icon: 'ExternalLink', onSelect: () => showToast('Open action selected.') },
    { label: 'Transfer ownership', icon: 'ShieldCheck', disabled: true },
    { label: 'Delete collection', icon: 'Trash2', variant: 'danger', onSelect: () => showToast('Delete action selected in the demonstration.') },
  ],
}));
$('#informationPopover').addEventListener('click', (event) => {
  const content = document.createElement('p');
  content.textContent = 'Menus and popovers share one surface, positioning, keyboard, and dismissal lifecycle. Press Escape or click outside to close.';
  createPopover(event.currentTarget, { content, title: 'Context, consistently.', placement: 'bottom-end' });
});
$('#sampleForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#collectionName').value.trim();
  if (!name) { $('#collectionName').focus(); return; }
  $('#sampleFormResult').textContent = `“${name}” is ready. This demonstration keeps your input in this page only.`;
  showToast('Collection created in the demo.');
});
$('#sampleForm').addEventListener('reset', () => { $('#sampleFormResult').textContent = ''; });
$('#intensity').addEventListener('input', (event) => { $('#intensityValue').value = `${event.target.value}%`; });
$$('.tblu-switch input:not([disabled])').forEach((input) => input.addEventListener('change', () => {
  const text = input.parentElement.querySelector('span');
  if (text) text.textContent = input.checked ? 'Enabled' : 'Disabled';
}));
$('#mixedCheckbox').indeterminate = true;
function updateTableSelection() {
  const boxes = $$('[data-row-selection]');
  const selected = boxes.filter((input) => input.checked).length;
  $('#selectAllRows').checked = selected === boxes.length;
  $('#selectAllRows').indeterminate = selected > 0 && selected < boxes.length;
  $('#tableSelection').textContent = `${selected} selected`;
  boxes.forEach((input) => { input.closest('tr').dataset.tbluSelected = String(input.checked); input.closest('tr').setAttribute('aria-selected', String(input.checked)); });
}
$('#selectAllRows').addEventListener('change', (event) => { $$('[data-row-selection]').forEach((input) => { input.checked = event.target.checked; }); updateTableSelection(); });
$$('[data-row-selection]').forEach((input) => input.addEventListener('change', updateTableSelection));
function selectSurfaceTab(tab, focus = false) {
  $$('[data-surface-tab]').forEach((button) => {
    const selected = button === tab;
    button.setAttribute('aria-selected', String(selected));
    button.dataset.tbluSelected = String(selected);
    button.tabIndex = selected ? 0 : -1;
  });
  $('#surfacePanel').setAttribute('aria-labelledby', tab.id);
  const content = tabContent[tab.dataset.surfaceTab];
  $('#surfaceHeading').textContent = content.title;
  $('#surfaceCount').textContent = `${content.items.length} ${content.items.length === 1 ? 'collection' : 'collections'}`;
  $('#surfaceCards').innerHTML = content.items.map(collectionMarkup).join('');
  ui.refresh();
  if (focus) tab.focus();
}
$$('[data-surface-tab]').forEach((tab) => {
  tab.addEventListener('click', () => selectSurfaceTab(tab));
  tab.addEventListener('keydown', (event) => {
    const tabs = $$('[data-surface-tab]');
    const position = tabs.indexOf(tab);
    let next;
    if (event.key === 'ArrowRight') next = (position + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (position + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectSurfaceTab(tabs[next], true); }
  });
});
$('#toggleSelected').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const selected = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(selected));
  button.dataset.tbluSelected = String(selected);
});
$('#loadingExample').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.dataset.tbluLoading = 'true';
  button.innerHTML = `${icon('RefreshCw')}<span>Saving…</span>`;
  await new Promise((resolve) => setTimeout(resolve, 1400));
  button.disabled = false;
  button.removeAttribute('aria-busy');
  delete button.dataset.tbluLoading;
  button.innerHTML = `${icon('Check')}<span>Saved · Try again</span>`;
  showToast('Loading completed.');
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    $$('.demo-navigation a').forEach((link) => { if (link.hash === `#${visible.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '-8% 0px -55% 0px', threshold: [0, 0.1, 0.3] });
  $$('main > section[id]').forEach((section) => observer.observe(section));
}
updateTheme({});
window.addEventListener('pagehide', () => { catalog.destroy(); materialStudio.destroy(); sidebarUI.destroy(); tableUI.destroy(); ui.destroy(); }, { once: true });
