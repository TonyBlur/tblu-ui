/** Accessible pointer and keyboard resizing for a sidebar using shared width tokens. */
export function mountSidebarResize({
  handle, root = document.documentElement, min = 220, max = 560, width = 248,
  onChange, onCommit, enabled = () => true,
} = {}) {
  if (!handle || !root?.style) throw new TypeError('A sidebar resize handle and styled root are required.');
  min = Number(min); max = Number(max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) throw new RangeError('Sidebar width bounds must be finite, non-negative and ordered.');
  const variable = '--tblu-sidebar-width';
  const view = root.ownerDocument?.defaultView || handle.ownerDocument?.defaultView;
  const attributeNames = ['role','tabindex','aria-orientation','aria-valuemin','aria-valuemax','aria-valuenow','aria-valuetext','aria-label','aria-disabled','data-resizing'];
  const originalAttributes = new Map(attributeNames.map(name => [name,handle.getAttribute(name)]));
  const originalStyles = new Map(['touch-action','cursor','user-select'].map(name => [name,{value:handle.style.getPropertyValue(name),priority:handle.style.getPropertyPriority(name)}]));
  const originalWidth = {value:root.style.getPropertyValue(variable),priority:root.style.getPropertyPriority(variable)};
  const originalResizing = root.getAttribute('data-tblu-resizing-sidebar');
  const listeners = [];
  let stopped = false, drag;
  const clamp = value => Math.min(max,Math.max(min,Math.round(value)));
  let current = clamp(Number.isFinite(Number(width)) ? Number(width) : 248);
  const available = () => !stopped && handle.isConnected !== false && (typeof enabled === 'function' ? enabled() : enabled) !== false;
  const restoreAttribute = (target,name,value) => { if (value === null) target.removeAttribute(name); else target.setAttribute(name,value); };
  const listen = (target,type,listener) => {
    target.addEventListener(type,listener); listeners.push(()=>target.removeEventListener(type,listener));
  };

  function render() {
    const active = available();
    handle.setAttribute('aria-valuenow',String(current)); handle.setAttribute('aria-valuetext',`${current}px`);
    handle.setAttribute('aria-disabled',String(!active)); handle.setAttribute('tabindex',active ? '0' : '-1');
  }

  function apply(value,source,notify = true) {
    const next = clamp(value), previous = current; current = next;
    const cssValue = `${next}px`;
    if (root.style.getPropertyValue(variable) !== cssValue) root.style.setProperty(variable,cssValue);
    render();
    if (notify && previous !== next) onChange?.(next,{source,previousWidth:previous});
    return next;
  }

  function finishDrag({commit = false,restore = false} = {}) {
    if (!drag) return;
    const previous = drag; drag = undefined;
    restoreAttribute(handle,'data-resizing',originalAttributes.get('data-resizing'));
    restoreAttribute(root,'data-tblu-resizing-sidebar',originalResizing);
    try { if (handle.hasPointerCapture?.(previous.pointerId)) handle.releasePointerCapture(previous.pointerId); } catch {}
    if (restore) apply(previous.width,'cancel');
    else if (commit && current !== previous.width) onCommit?.(current,{source:'pointer'});
  }

  function pointerDown(event) {
    if (!available() || drag || event.button !== 0 || event.isPrimary === false || !Number.isFinite(event.clientX)) return;
    event.preventDefault(); handle.focus?.({preventScroll:true});
    drag = {pointerId:event.pointerId,clientX:event.clientX,width:current};
    handle.setAttribute('data-resizing','true'); root.setAttribute('data-tblu-resizing-sidebar','true');
    try { handle.setPointerCapture?.(event.pointerId); } catch {}
  }

  function pointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!available()) { finishDrag({restore:true}); render(); return; }
    if (!Number.isFinite(event.clientX)) return;
    event.preventDefault(); apply(drag.width + event.clientX - drag.clientX,'pointer');
  }

  function pointerUp(event) {
    if (drag && event.pointerId === drag.pointerId) {
      if (available() && Number.isFinite(event.clientX)) apply(drag.width + event.clientX - drag.clientX,'pointer');
      finishDrag({commit:available(),restore:!available()});
    }
  }

  function pointerCancel(event) { if (drag && event.pointerId === drag.pointerId) finishDrag({restore:true}); }

  function keyDown(event) {
    if (!available() || event.altKey || event.ctrlKey || event.metaKey) return;
    const changes = {ArrowLeft:-16,ArrowRight:16,'+':16,'-':-16,Add:16,Subtract:-16};
    let next;
    if (event.key === 'Home') next = min;
    else if (event.key === 'End') next = max;
    else if (Object.hasOwn(changes,event.key)) next = current + changes[event.key];
    else return;
    event.preventDefault(); const previous = current; apply(next,'keyboard');
    if (previous !== current) onCommit?.(current,{source:'keyboard'});
  }

  function availabilityChanged() { if (!available()) finishDrag({restore:true}); render(); }

  handle.setAttribute('role','separator'); handle.setAttribute('aria-orientation','vertical');
  handle.setAttribute('aria-valuemin',String(min)); handle.setAttribute('aria-valuemax',String(max));
  if (!handle.hasAttribute('aria-label') && !handle.hasAttribute('aria-labelledby')) handle.setAttribute('aria-label','Resize sidebar');
  handle.style.setProperty('touch-action','none'); handle.style.setProperty('cursor','col-resize'); handle.style.setProperty('user-select','none');
  apply(current,'initial',false);
  listen(handle,'pointerdown',pointerDown); listen(handle,'pointermove',pointerMove); listen(handle,'pointerup',pointerUp);
  listen(handle,'pointercancel',pointerCancel); listen(handle,'lostpointercapture',pointerCancel); listen(handle,'keydown',keyDown);
  if (view) listen(view,'resize',availabilityChanged);

  return {
    setWidth(value,{commit = false} = {}) {
      if (stopped) return current;
      render(); if (!available() || !Number.isFinite(Number(value))) return current;
      const previous = current; apply(Number(value),'programmatic');
      if (commit && previous !== current) onCommit?.(current,{source:'programmatic'});
      return current;
    },
    destroy() {
      if (stopped) return; finishDrag(); stopped = true; listeners.forEach(remove=>remove());
      for (const [name,value] of originalAttributes) restoreAttribute(handle,name,value);
      for (const [name,snapshot] of originalStyles) { if (snapshot.value) handle.style.setProperty(name,snapshot.value,snapshot.priority); else handle.style.removeProperty(name); }
      if (originalWidth.value) root.style.setProperty(variable,originalWidth.value,originalWidth.priority); else root.style.removeProperty(variable);
      restoreAttribute(root,'data-tblu-resizing-sidebar',originalResizing);
    },
  };
}
