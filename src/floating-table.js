const mounted = new WeakMap();
let nextHeader = 0;
const classNames = value => String(value || '').trim().split(/\s+/).filter(Boolean);
const pixelValue = value => /^\d*\.?\d+px$/.test(String(value).trim()) ? Number.parseFloat(value) : 0;
const cssPixels = value => `${Math.round(value * 1000) / 1000}px`;

function find(root, value) {
  if (value?.nodeType === 1) return value;
  return root.matches?.(value) ? root : root.querySelector(value);
}
function columnWidths(row) {
  if (!row) return [];
  return [...row.cells].flatMap(cell => {
    const count = Math.max(1, Number(cell.colSpan) || 1);
    const width = cell.getBoundingClientRect().width / count;
    return Array.from({ length:count }, () => width);
  });
}
function headingText(cell) {
  const button = cell.querySelector('button');
  if (button?.textContent?.trim()) return button.textContent.trim();
  const named = cell.querySelector('input[aria-label],button[aria-label]');
  return cell.getAttribute('aria-label') || named?.getAttribute('aria-label') || cell.textContent.trim();
}

/**
 * Move the actual interactive thead into an independent sticky surface.
 * The body keeps textual headings for assistive technology, never cloned controls.
 */
export function mountFloatingTableHeader(root = document, {
  table:tableSelector = '.tblu-table',
  scroller:scrollerSelector = '.tblu-table-scroll',
  topOffset = () => 0,
  resizeEvent = 'columns-resized',
  resizeTargets = [],
  label = 'Column headings and controls',
  classes = {},
} = {}) {
  const table = find(root, tableSelector);
  if (!table) return null;
  if (mounted.has(table)) return mounted.get(table);
  const head = table.tHead;
  const body = scrollerSelector?.nodeType === 1 ? scrollerSelector : table.closest(scrollerSelector) || find(root, scrollerSelector);
  if (!head || !body || !body.contains(table) || !body.parentNode) return null;
  const doc = table.ownerDocument, view = doc.defaultView;
  const names = {
    wrapper:'tblu-floating-table',
    header:'tblu-table-scroll tblu-floating-header',
    body:'tblu-floating-body',
    accessibleHead:'tblu-table-sr-head',
    ...classes,
  };
  const wrapper = doc.createElement('div'); wrapper.className = names.wrapper;
  const header = doc.createElement('div'); header.className = names.header;
  header.dataset.tbluSurface = 'panel'; header.dataset.tbluElevation = '1';
  header.setAttribute('role','group'); header.setAttribute('aria-label',label);
  const headerTable = doc.createElement('table'); headerTable.className = names.table ?? table.getAttribute('class') ?? '';
  // This visual layout table does not duplicate the accessible data table's semantics.
  headerTable.setAttribute('role','presentation');
  headerTable.style.tableLayout = 'fixed';
  for (const name of ['dir','lang']) if (table.hasAttribute(name)) headerTable.setAttribute(name,table.getAttribute(name));
  const baselineMinimum = [table.style.getPropertyValue('min-width'),table.style.getPropertyPriority('min-width')];
  const authoredMinimum = pixelValue(baselineMinimum[0]) || pixelValue(view.getComputedStyle(table).minWidth);
  const baselineClasses = new Set(classNames(names.body).filter(name => body.classList.contains(name)));
  const initialWidths = columnWidths(table.tBodies[0]?.rows[0] || head.rows[0]);
  const originalNext = head.nextSibling;
  const accessibleHead = doc.createElement('thead'); accessibleHead.className = names.accessibleHead;
  const headingIds = new Map(), cellHeaderBaselines = new Map();
  const prefix = `tblu-table-heading-${++nextHeader}-`;
  let headingSignature = '', frame, stopped = false, headerGroup;

  function synchronizeAccessibleHead() {
    const values = [...head.rows].map(row => [...row.cells].map(cell => ({
      text:headingText(cell), id:cell.id || '', scope:cell.getAttribute('scope') || 'col',
      colSpan:cell.colSpan || 1,rowSpan:cell.rowSpan || 1,sort:cell.getAttribute('aria-sort'),
    })));
    const signature = JSON.stringify(values);
    if (signature === headingSignature) return;
    headingSignature = signature; headingIds.clear();
    const rows = values.map((cells,rowIndex) => {
      const row = doc.createElement('tr');
      cells.forEach((value,index) => {
        const cell = doc.createElement('th'); cell.textContent = value.text;
        cell.setAttribute('scope',value.scope);
        if (value.colSpan > 1) cell.colSpan = value.colSpan;
        if (value.rowSpan > 1) cell.rowSpan = value.rowSpan;
        if (value.sort) cell.setAttribute('aria-sort',value.sort);
        if (value.id) { cell.id = `${prefix}${rowIndex}-${index}`; headingIds.set(value.id,cell.id); }
        row.append(cell);
      });
      return row;
    });
    accessibleHead.replaceChildren(...rows);
    synchronizeCellHeaders();
  }
  function synchronizeCellHeaders() {
    for (const cell of table.querySelectorAll('tbody [headers],tfoot [headers]')) {
      if (!cellHeaderBaselines.has(cell)) cellHeaderBaselines.set(cell,cell.getAttribute('headers'));
      const baseline = cellHeaderBaselines.get(cell);
      const value = baseline.split(/\s+/).map(id => headingIds.get(id) || id).join(' ');
      if (cell.getAttribute('headers') !== value) cell.setAttribute('headers',value);
    }
    for (const cell of cellHeaderBaselines.keys()) if (!table.contains(cell)) cellHeaderBaselines.delete(cell);
  }
  function synchronizeColumns() {
    const source = [...table.children].find(element => element.localName === 'colgroup');
    const widths = columnWidths(table.tBodies[0]?.rows[0]);
    const resolved = widths.some(width => width > 0) ? widths : initialWidths;
    const sourceColumns = source ? [...source.querySelectorAll('col')] : [];
    const group = source ? source.cloneNode(true) : doc.createElement('colgroup');
    group.removeAttribute('id'); group.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    if (!source) resolved.forEach(width => { const col = doc.createElement('col'); if (width > 0) col.style.width = cssPixels(width); group.append(col); });
    else {
      let index = 0;
      [...group.querySelectorAll('col')].forEach((col,position) => {
        const span = Math.max(1, Number(col.span) || 1), measured = sourceColumns[position].getBoundingClientRect().width;
        const segment = resolved.slice(index,index + span), average = segment.length ? segment.reduce((sum,width) => sum + width,0) / segment.length : 0;
        const width = measured / span || average;
        if (width > 0) col.style.width = cssPixels(width);
        index += span;
      });
    }
    const explicitMinimum = sourceColumns.reduce((sum,col) => sum + pixelValue(col.style.getPropertyValue('width')) * Math.max(1, Number(col.span) || 1),0);
    if (explicitMinimum > authoredMinimum) {
      const minimum = cssPixels(explicitMinimum);
      if (table.style.getPropertyValue('min-width') !== minimum) table.style.setProperty('min-width',minimum);
    } else if (table.style.getPropertyValue('min-width') !== baselineMinimum[0]) {
      baselineMinimum[0] ? table.style.setProperty('min-width',...baselineMinimum) : table.style.removeProperty('min-width');
    }
    if (headerGroup) headerGroup.replaceWith(group); else headerTable.insertBefore(group,head);
    headerGroup = group;
    const width = table.getBoundingClientRect().width;
    headerTable.style.width = width > 0 ? cssPixels(width) : table.style.getPropertyValue('width') || '100%';
    headerTable.style.minWidth = cssPixels(Math.max(authoredMinimum,explicitMinimum));
  }
  const fromBody = () => { if (header.scrollLeft !== body.scrollLeft) header.scrollLeft = body.scrollLeft; };
  const fromHeader = () => { if (body.scrollLeft !== header.scrollLeft) body.scrollLeft = header.scrollLeft; };
  function refresh() {
    if (stopped) return;
    if (frame !== undefined) view.cancelAnimationFrame(frame); frame = undefined;
    const top = Number(typeof topOffset === 'function' ? topOffset() : topOffset);
    header.style.top = cssPixels(Number.isFinite(top) ? Math.max(0,top) : 0);
    synchronizeAccessibleHead(); synchronizeCellHeaders(); synchronizeColumns(); fromBody();
  }
  const schedule = () => { if (!stopped && frame === undefined) frame = view.requestAnimationFrame(refresh); };
  const resizeObserver = view.ResizeObserver ? new view.ResizeObserver(schedule) : null;
  const mutationObserver = new view.MutationObserver(records => {
    if (records.some(record => !accessibleHead.contains(record.target))) schedule();
  });
  const focus = doc.activeElement;
  body.before(wrapper); head.before(accessibleHead); headerTable.append(head); header.append(headerTable);
  classNames(names.body).forEach(name => body.classList.add(name)); wrapper.append(header,body);
  if (focus && head.contains(focus)) focus.focus({preventScroll:true});
  body.addEventListener('scroll',fromBody,{passive:true}); header.addEventListener('scroll',fromHeader,{passive:true});
  if (resizeEvent) root.addEventListener(resizeEvent,refresh);
  view.addEventListener('resize',schedule,{passive:true});
  resizeObserver?.observe(wrapper); resizeObserver?.observe(table);
  resizeTargets.filter(Boolean).forEach(element => resizeObserver?.observe(element));
  mutationObserver.observe(table,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','width','span','headers']});
  mutationObserver.observe(head,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','aria-sort','colspan','rowspan','scope']});
  const api = {
    wrapper,header,body,table,headerTable,refresh,
    destroy() {
      if (stopped) return; stopped = true;
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      resizeObserver?.disconnect(); mutationObserver.disconnect();
      body.removeEventListener('scroll',fromBody); header.removeEventListener('scroll',fromHeader);
      if (resizeEvent) root.removeEventListener(resizeEvent,refresh); view.removeEventListener('resize',schedule);
      for (const [cell,baseline] of cellHeaderBaselines) if (table.contains(cell)) cell.setAttribute('headers',baseline);
      cellHeaderBaselines.clear();
      if (accessibleHead.parentNode === table) accessibleHead.before(head);
      else table.insertBefore(head,originalNext?.parentNode === table ? originalNext : table.tBodies[0] || null);
      accessibleHead.remove();
      baselineMinimum[0] ? table.style.setProperty('min-width',...baselineMinimum) : table.style.removeProperty('min-width');
      classNames(names.body).forEach(name => { if (!baselineClasses.has(name)) body.classList.remove(name); });
      if (wrapper.parentNode) wrapper.before(body); else body.remove();
      wrapper.remove(); mounted.delete(table); mounted.delete(headerTable);
    },
  };
  mounted.set(table,api); mounted.set(headerTable,api);
  try { refresh(); } catch (error) { api.destroy(); throw error; }
  return api;
}
