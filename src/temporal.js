import { createPopover } from './overlays.js';
import { bridgeProperty } from './control-helpers.mjs';
import { parseISODate,addDateDays,addDateMonths,calendarDates,localeWeekStart,dateAllowed,nearestDate,parseTime,formatTime,timeConstraints,timeAllowed,timeCandidates,nearestTime } from './temporal-math.mjs';

const selector = '.tblu-field input[type=date],.tblu-field input[type=time]';
const sourceStyles = {position:'absolute',width:'1px',height:'1px',padding:'0',margin:'-1px',overflow:'hidden',clipPath:'inset(50%)',whiteSpace:'nowrap',border:'0',opacity:'0',pointerEvents:'none'};
let nextPicker = 0;
const setAttribute = (element,name,value) => {
  if (value === null || value === undefined) { if (element.hasAttribute(name)) element.removeAttribute(name); }
  else if (element.getAttribute(name) !== String(value)) element.setAttribute(name,String(value));
};
const labelText = element => {
  const copy = element.cloneNode(true);
  copy.querySelectorAll('.tblu-control,.tblu-native-source,.tblu-temporal-error,[aria-hidden=true],input,button,svg,script,style').forEach(node=>node.remove());
  return copy.textContent.replace(/\s+/g,' ').trim();
};
function sourceLabel(source,fallback) {
  const doc = source.ownerDocument;
  const referenced = (source.getAttribute('aria-labelledby') || '').split(/\s+/).map(id=>doc.getElementById(id)).filter(Boolean).map(labelText).join(' ').trim();
  return referenced || source.getAttribute('aria-label') || [...source.labels || []].map(labelText).filter(Boolean).join(' ') || source.title || fallback;
}
function formatter(locale,options) { try { return new Intl.DateTimeFormat(locale,options); } catch { return new Intl.DateTimeFormat('en',options); } }
function iconElement(doc,render,name) {
  if (!render) return null;
  let value; try { value = render(name); } catch { try { value = render('Clock'); } catch { return null; } }
  if (value?.nodeType === 1) { const clone = value.cloneNode(true); clone.setAttribute('aria-hidden','true'); return clone; }
  if (typeof value !== 'string') return null;
  const parsed = new doc.defaultView.DOMParser().parseFromString(value,'image/svg+xml');
  if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') return null;
  const allowedTags = new Set(['svg','g','path','circle','ellipse','rect','line','polyline','polygon']);
  const allowedAttributes = new Set(['viewBox','d','cx','cy','r','rx','ry','x','y','x1','x2','y1','y2','width','height','points','fill','fill-rule','clip-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','transform','opacity']);
  const safeClone = element => {
    if (!allowedTags.has(element.localName)) return null;
    const node = doc.createElementNS('http://www.w3.org/2000/svg',element.localName);
    for (const attribute of element.attributes) if (allowedAttributes.has(attribute.name) && !/url\(/i.test(attribute.value)) node.setAttribute(attribute.name,attribute.value);
    for (const child of element.children) { const safe = safeClone(child); if (safe) node.append(safe); }
    return node;
  };
  const safe = safeClone(parsed.documentElement); safe.classList.add('tblu-icon'); safe.setAttribute('aria-hidden','true'); return safe;
}

/** Gregorian date and 24-hour time pickers backed by the original native form fields. */
export function mountTemporalPickers(root = document,{icon,locale = (root.ownerDocument || root).documentElement?.lang || 'en',labels = {}} = {}) {
  const doc = root.ownerDocument || root, view = doc.defaultView;
  const entries = new Map();
  let stopped = false, queued = false;
  const inside = source => source.isConnected && (root === doc || root.contains(source));
  const defer = callback => (view.queueMicrotask || queueMicrotask)(callback);
  const word = (key,fallback) => labels[key] || fallback;
  const element = (tag,className,text) => { const node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const button = (label,iconName,className = 'tblu-button') => {
    const node = element('button',className); node.type = 'button';
    if (iconName) { const glyph = iconElement(doc,icon,iconName); if (glyph) node.append(glyph); }
    if (className.includes('tblu-icon-button')) node.setAttribute('aria-label',label); else node.append(element('span','',label));
    return node;
  };
  const dateRules = source => ({min:source.min,max:source.max,step:source.step || 1,base:source.getAttribute('value')});
  const timeRules = source => timeConstraints({min:source.min,max:source.max,step:source.step || 60,base:source.getAttribute('value')});
  const today = () => { const date = new Date(); return `${String(date.getFullYear()).padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
  const showSeconds = source => source.step === 'any' || Number(source.step) > 0 && Number(source.step) < 60 || [source.value,source.min,source.max].some(value=>value?.length > 5);

  function setError(entry,message) {
    // A temporary typing error must not overwrite a validation message authored
    // by the application after mounting this control.
    if (entry.source.validity.customError && entry.source.validationMessage !== entry.errorMessage) entry.authorValidity = entry.source.validationMessage;
    if (!entry.errorMessage || entry.source.validationMessage === entry.errorMessage) entry.source.setCustomValidity(message || entry.authorValidity);
    entry.errorMessage = message;
    entry.error.textContent = message; entry.error.hidden = !message;
    entry.text.setCustomValidity(message);
    setAttribute(entry.text,'aria-invalid',message ? 'true' : entry.source.getAttribute('aria-invalid'));
    entry.wrapper.toggleAttribute('data-invalid',Boolean(message));
  }

  function sync(entry) {
    if (!inside(entry.source)) return;
    const {source,text,trigger} = entry;
    const disabled = source.disabled || source.matches(':disabled');
    const name = sourceLabel(source,word(entry.kind,entry.kind === 'date' ? 'Date' : 'Time'));
    setAttribute(text,'aria-label',name); setAttribute(text,'aria-required',String(source.required));
    setAttribute(trigger,'aria-label',`${word(entry.kind === 'date' ? 'chooseDate' : 'chooseTime',entry.kind === 'date' ? 'Choose date' : 'Choose time')}: ${name}`);
    text.disabled = disabled; text.readOnly = source.readOnly; trigger.disabled = disabled || source.readOnly;
    entry.wrapper.toggleAttribute('data-disabled',disabled);
    const signature = JSON.stringify([source.value,source.min,source.max,source.step,source.required,disabled,source.readOnly]);
    if (signature !== entry.signature) {
      const changedValue = source.value !== entry.lastValue;
      if (!entry.editing || changedValue) text.value = source.value;
      text.placeholder = source.getAttribute('placeholder') || (entry.kind === 'date' ? 'YYYY-MM-DD' : showSeconds(source) ? 'HH:MM:SS' : 'HH:MM');
      entry.signature = signature; entry.lastValue = source.value;
      if (changedValue) setError(entry,'');
      if (entry.popup && !entry.popup.panel.inert) {
        if (changedValue && entry.kind === 'date' && parseISODate(source.value)) entry.focusDate = entry.month = source.value;
        if (changedValue && entry.kind === 'time') entry.draft = parseTime(source.value);
        entry.render?.(false);
      }
    }
    const described = [entry.attributes.get('aria-describedby'),entry.error.id].filter(Boolean).join(' ');
    setAttribute(text,'aria-describedby',described); setAttribute(source,'aria-describedby',described);
    if (disabled || source.readOnly) close(entry,{immediate:true});
  }

  function close(entry,options) { const popup = entry.popup; entry.popup = undefined; entry.render = undefined; popup?.hidePopover(options); }

  function choose(entry,value) {
    if (!inside(entry.source) || entry.source.disabled || entry.source.matches(':disabled') || entry.source.readOnly) return;
    setError(entry,''); entry.editing = false; entry.source.value = value; sync(entry);
    entry.source.dispatchEvent(new view.Event('input',{bubbles:true,composed:true}));
    entry.source.dispatchEvent(new view.Event('change',{bubbles:true,composed:true}));
    close(entry,{returnFocus:true});
  }

  function openDate(entry) {
    const firstDay = localeWeekStart(locale), currentDay = today();
    const monthFormat = formatter(locale,{month:'long',year:'numeric',timeZone:'UTC'});
    const fullFormat = formatter(locale,{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
    const weekdayFormat = formatter(locale,{weekday:'short',timeZone:'UTC'});
    let rtl = false; try { rtl = new Intl.Locale(locale).textInfo?.direction === 'rtl'; } catch {}
    entry.focusDate = nearestDate(entry.source.value || currentDay,dateRules(entry.source)) || currentDay;
    entry.month = entry.focusDate;
    const content = element('div','tblu-calendar'); content.dir = rtl ? 'rtl' : 'ltr';
    function monthCanMove(delta) {
      const next = addDateMonths(entry.month,delta); if (!next) return false;
      const dates = calendarDates(next,firstDay).filter(date=>date?.slice(0,7) === next.slice(0,7));
      const lower = parseISODate(entry.source.min),upper = parseISODate(entry.source.max);
      if (lower && upper && lower.epoch > upper.epoch) return false;
      return (!lower || parseISODate(dates.at(-1)).epoch >= lower.epoch) && (!upper || parseISODate(dates[0]).epoch <= upper.epoch);
    }
    const render = (focus = false) => {
      const priorFocused = doc.activeElement?.dataset?.calendarDate;
      content.replaceChildren();
      const heading = element('div','tblu-calendar-heading');
      const previous = button(word('previousMonth','Previous month'),rtl ? 'ChevronRight' : 'ChevronLeft','tblu-icon-button'); previous.dataset.calendarMonth = '-1'; previous.disabled = !monthCanMove(-1);
      const caption = element('h3','tblu-calendar-month',monthFormat.format(new Date(parseISODate(entry.month).epoch))); caption.id = `${entry.id}-month`; caption.tabIndex = -1; caption.setAttribute('aria-live','polite');
      const next = button(word('nextMonth','Next month'),rtl ? 'ChevronLeft' : 'ChevronRight','tblu-icon-button'); next.dataset.calendarMonth = '1'; next.disabled = !monthCanMove(1);
      heading.append(previous,caption,next); content.append(heading);
      const grid = element('div','tblu-calendar-grid'); grid.setAttribute('role','grid'); grid.setAttribute('aria-labelledby',caption.id);
      const weekdays = element('div','tblu-calendar-weekdays'); weekdays.setAttribute('role','row');
      for (let index=0;index<7;index++) {
        const value = addDateDays('2024-01-07',(firstDay+index)%7), cell = element('span','tblu-calendar-weekday',weekdayFormat.format(new Date(parseISODate(value).epoch)));
        cell.setAttribute('role','columnheader'); weekdays.append(cell);
      }
      grid.append(weekdays);
      const dates = calendarDates(entry.month,firstDay), rules = dateRules(entry.source);
      let focusDate = dateAllowed(entry.focusDate,rules) && dates.includes(entry.focusDate) ? entry.focusDate : dates.find(date=>date?.slice(0,7) === entry.month.slice(0,7) && dateAllowed(date,rules));
      for (let row=0;row<6;row++) {
        const line = element('div','tblu-calendar-week'); line.setAttribute('role','row');
        for (const value of dates.slice(row*7,row*7+7)) {
          const cell = element('span','tblu-calendar-cell'); cell.setAttribute('role','gridcell');
          if (value) {
            const parsed = parseISODate(value), day = button(String(parsed.day),null,'tblu-button tblu-calendar-day');
            day.dataset.tbluVariant='quiet'; day.dataset.calendarDate = value; day.setAttribute('aria-label',fullFormat.format(new Date(parsed.epoch)));
            day.disabled = !dateAllowed(value,rules); day.tabIndex = value === focusDate ? 0 : -1;
            cell.setAttribute('aria-selected',String(value === entry.source.value));
            day.dataset.tbluSelected = String(value === entry.source.value);
            if (value === currentDay) day.setAttribute('aria-current','date');
            if (value.slice(0,7) !== entry.month.slice(0,7)) day.dataset.outsideMonth = 'true';
            cell.append(day);
          }
          line.append(cell);
        }
        grid.append(line);
      }
      content.append(grid);
      const footer = element('div','tblu-temporal-actions'), now = button(word('today','Today')); now.dataset.calendarToday = ''; now.disabled = !dateAllowed(currentDay,rules); footer.append(now);
      if (!entry.source.required) { const clear = button(word('clear','Clear')); clear.dataset.temporalClear = ''; footer.append(clear); }
      content.append(footer);
      if (focus || priorFocused) (content.querySelector(`[data-calendar-date="${focusDate}"]`) || content.querySelector('button:not(:disabled)') || caption).focus({preventScroll:true});
    };
    content.addEventListener('click',event=>{
      const action = event.target.closest('button'); if (!action || action.disabled) return;
      if (action.dataset.calendarDate) choose(entry,action.dataset.calendarDate);
      else if (action.hasAttribute('data-calendar-today')) choose(entry,currentDay);
      else if (action.hasAttribute('data-temporal-clear')) choose(entry,'');
      else if (action.dataset.calendarMonth) {
        const next = addDateMonths(entry.month,Number(action.dataset.calendarMonth)); if (!next) return;
        entry.month = next; entry.focusDate = nearestDate(next,dateRules(entry.source),Number(action.dataset.calendarMonth)) || next; render(true);
      }
    });
    content.addEventListener('keydown',event=>{
      const day = event.target.closest('[data-calendar-date]'); if (!day || event.altKey || event.ctrlKey || event.metaKey) return;
      const value = day.dataset.calendarDate, weekday = new Date(parseISODate(value).epoch).getUTCDay();
      let candidate, direction = 1;
      if (event.key === 'ArrowLeft') { direction = rtl ? 1 : -1; candidate = addDateDays(value,direction); }
      else if (event.key === 'ArrowRight') { direction = rtl ? -1 : 1; candidate = addDateDays(value,direction); }
      else if (event.key === 'ArrowUp') { direction = -1; candidate = addDateDays(value,-7); }
      else if (event.key === 'ArrowDown') candidate = addDateDays(value,7);
      else if (event.key === 'Home') { direction = -1; candidate = addDateDays(value,-((weekday-firstDay+7)%7)); }
      else if (event.key === 'End') candidate = addDateDays(value,6-((weekday-firstDay+7)%7));
      else if (event.key === 'PageUp') { direction = -1; candidate = addDateMonths(value,event.shiftKey ? -12 : -1); }
      else if (event.key === 'PageDown') candidate = addDateMonths(value,event.shiftKey ? 12 : 1);
      else return;
      event.preventDefault(); if (!candidate) return;
      const next = nearestDate(candidate,dateRules(entry.source),direction); if (!next) return;
      entry.focusDate = entry.month = next; render(true);
    });
    entry.render = render; render();
    const popup = createPopover(entry.trigger,{content,title:word('chooseDate','Choose date'),placement:'bottom-end',onClose:()=>{if (entry.popup === popup) {entry.popup = undefined;entry.render = undefined;}}}); entry.popup = popup;
    Promise.resolve(popup.updateComplete).then(()=>{ if (entry.popup === popup && !popup.panel.inert) render(true); }).catch(()=>{});
  }

  function openTime(entry) {
    let rules, candidates, withSeconds;
    const content = element('div','tblu-time-picker');
    const parts = ['hour','minute','second'];
    const partNames = [word('hours','Hours'),word('minutes','Minutes'),word('seconds','Seconds')];
    const components = value => ({hour:Math.floor(value/3600),minute:Math.floor(value/60)%60,second:Math.round((value%60)*1000)/1000});
    const valuesFor = (part,draft) => {
      const current = components(draft ?? 0);
      return candidates.filter(value=>part === 'hour' || components(value).hour === current.hour && (part === 'minute' || components(value).minute === current.minute));
    };
    const choosePart = (part,value) => {
      const current = components(entry.draft ?? 0), pool = valuesFor(part,entry.draft).filter(candidate=>components(candidate)[part] === value);
      entry.draft = nearestTime(part === 'hour' ? value*3600+current.minute*60+current.second : part === 'minute' ? current.hour*3600+value*60+current.second : current.hour*3600+current.minute*60+value,pool);
      render(part);
    };
    const render = (focusPart = '') => {
      rules = timeRules(entry.source); candidates = timeCandidates(rules); withSeconds = showSeconds(entry.source);
      entry.draft = timeAllowed(entry.draft,rules) ? entry.draft : nearestTime(parseTime(entry.source.value),candidates);
      content.replaceChildren();
      const title = element('h3','tblu-time-heading',word('chooseTime','Choose time')); content.append(title);
      const columns = element('div','tblu-time-grid'); columns.dataset.seconds = String(withSeconds);
      const current = components(entry.draft ?? 0);
      for (const [index,part] of parts.slice(0,withSeconds ? 3 : 2).entries()) {
        const column = element('div','tblu-time-column'), label = element('span','tblu-time-column-label',partNames[index]); label.id = `${entry.id}-${part}`;
        const list = element('div','tblu-time-options tblu-scroll'); list.setAttribute('role','listbox'); list.setAttribute('aria-labelledby',label.id);
        const available = new Set(valuesFor(part,entry.draft).map(value=>components(value)[part]));
        const choices = part === 'second' ? [...new Set([...Array.from({length:60},(_,value)=>value),...available])].sort((left,right)=>left-right) : Array.from({length:part === 'hour' ? 24 : 60},(_,value)=>value);
        const selected = choices.includes(current[part]) ? current[part] : [...available][0];
        for (const value of choices) {
          const label = value < 10 ? `0${value}` : String(value), option = button(label,null,'tblu-button tblu-time-option');
          option.setAttribute('role','option'); option.dataset.timePart = part; option.dataset.timeValue = String(value);
          option.disabled = !available.has(value); option.tabIndex = value === selected && !option.disabled ? 0 : -1;
          option.setAttribute('aria-selected',String(value === current[part])); option.dataset.tbluSelected = String(value === current[part]); list.append(option);
        }
        column.append(label,list); columns.append(column);
      }
      content.append(columns);
      const field = element('label','tblu-field tblu-time-typed'), label = element('span','',word('typeTime','Type a time (24-hour format)'));
      const typed = element('input','tblu-input'); typed.type = 'text'; typed.name = ''; typed.autocomplete = 'off'; typed.dataset.timeTyped = ''; typed.placeholder = withSeconds ? 'HH:MM:SS' : 'HH:MM'; typed.value = formatTime(entry.draft,{seconds:withSeconds});
      const error = element('small','tblu-temporal-error'); error.id = `${entry.id}-time-error`; error.setAttribute('role','status'); typed.setAttribute('aria-describedby',error.id); field.append(label,typed,error); content.append(field);
      const footer = element('div','tblu-temporal-actions'), apply = button(word('applyTime','Apply time')); apply.dataset.timeApply = ''; apply.dataset.tbluVariant = 'primary'; apply.disabled = entry.draft === null;
      footer.append(apply); if (!entry.source.required) { const clear = button(word('clear','Clear')); clear.dataset.temporalClear = ''; footer.append(clear); } content.append(footer);
      typed.addEventListener('input',()=>{
        const value = parseTime(typed.value), valid = timeAllowed(value,rules); entry.draft = valid ? value : null;
        apply.disabled = !valid; error.textContent = valid ? '' : word('invalidTime','Enter an available time in HH:MM or HH:MM:SS format.'); setAttribute(typed,'aria-invalid',valid ? null : 'true');
      });
      for (const option of content.querySelectorAll('[aria-selected=true]')) option.scrollIntoView?.({block:'nearest'});
      if (focusPart) (content.querySelector(`[data-time-part="${focusPart}"][tabindex="0"]`) || typed).focus({preventScroll:true});
    };
    content.addEventListener('click',event=>{
      const action = event.target.closest('button'); if (!action || action.disabled) return;
      if (action.dataset.timePart) choosePart(action.dataset.timePart,Number(action.dataset.timeValue));
      else if (action.hasAttribute('data-time-apply') && timeAllowed(entry.draft,rules)) choose(entry,formatTime(entry.draft,{seconds:withSeconds}));
      else if (action.hasAttribute('data-temporal-clear')) choose(entry,'');
    });
    content.addEventListener('keydown',event=>{
      const option = event.target.closest('[data-time-part]');
      if (!option) { if (event.key === 'Enter' && event.target.hasAttribute('data-time-typed') && timeAllowed(entry.draft,rules)) { event.preventDefault(); choose(entry,formatTime(entry.draft,{seconds:withSeconds})); } return; }
      const part = option.dataset.timePart, options = [...option.closest('[role=listbox]').querySelectorAll('button:not(:disabled)')], index = options.indexOf(option);
      let next;
      if (event.key === 'ArrowDown') next = options[(index+1)%options.length];
      else if (event.key === 'ArrowUp') next = options[(index-1+options.length)%options.length];
      else if (event.key === 'Home') next = options[0];
      else if (event.key === 'End') next = options.at(-1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const position = parts.indexOf(part)+(event.key === 'ArrowRight' ? 1 : -1);
        next = content.querySelector(`[data-time-part="${parts[position]}"][tabindex="0"]`); if (next) { event.preventDefault(); next.focus(); } return;
      } else if (event.key === 'Enter') { event.preventDefault(); if (timeAllowed(entry.draft,rules)) choose(entry,formatTime(entry.draft,{seconds:withSeconds})); return; }
      else return;
      if (next) { event.preventDefault(); choosePart(part,Number(next.dataset.timeValue)); }
    });
    entry.draft = parseTime(entry.source.value); entry.render = render; render();
    const popup = createPopover(entry.trigger,{content,title:word('chooseTime','Choose time'),placement:'bottom-end',onClose:()=>{if (entry.popup === popup) {entry.popup = undefined;entry.render = undefined;}}}); entry.popup = popup;
    Promise.resolve(popup.updateComplete).then(()=>{ if (entry.popup === popup && !popup.panel.inert) render('hour'); }).catch(()=>{});
  }

  function open(entry) {
    if (!inside(entry.source) || entry.trigger.disabled) return;
    if (entry.popup) { close(entry,{returnFocus:true}); return; }
    entry.kind === 'date' ? openDate(entry) : openTime(entry);
  }

  function enhance(source) {
    if (!inside(source) || source.dataset.tbluNativeSource || source.closest('.tblu-control')) return;
    const kind = source.type, shell = element('span','tblu-temporal'), wrapper = element('span',`tblu-control tblu-temporal-control tblu-${kind}-control`);
    wrapper.dataset.tbluSurface = 'control';
    const text = element('input','tblu-input tblu-temporal-input'); text.type = 'text'; text.name = ''; text.dataset.tbluAdapter=kind; text.autocomplete = 'off';
    const trigger = button(kind === 'date' ? word('chooseDate','Choose date') : word('chooseTime','Choose time'),kind === 'date' ? 'Calendar' : 'Clock','tblu-icon-button'); trigger.dataset.tbluVariant = 'quiet'; trigger.setAttribute('aria-haspopup','dialog');
    const error = element('small','tblu-temporal-error'); error.hidden = true; error.setAttribute('role','status');
    const id = `tblu-temporal-${++nextPicker}`; error.id = `${id}-error`;
    const attributes = new Map(['style','tabindex','aria-hidden','aria-describedby','data-tblu-native-source'].map(name=>[name,source.getAttribute(name)]));
    const entry = {source,kind,shell,wrapper,text,trigger,error,id,attributes,restores:[],disposers:[],hadClass:source.classList.contains('tblu-native-source'),authorValidity:source.validity.customError ? source.validationMessage : '',editing:false};
    entries.set(source,entry); source.before(shell); shell.append(wrapper,error); wrapper.append(source,text,trigger);
    source.dataset.tbluNativeSource = kind; source.classList.add('tblu-native-source'); source.tabIndex = -1; source.setAttribute('aria-hidden','true'); Object.assign(source.style,sourceStyles);
    const listen = (target,type,listener) => { target.addEventListener(type,listener); entry.disposers.push(()=>target.removeEventListener(type,listener)); };
    for (const key of ['value','defaultValue','valueAsDate','valueAsNumber','disabled','required','readOnly','min','max','step']) entry.restores.push(bridgeProperty(source,key,()=>sync(entry)));
    for (const [key,method] of [['focus',options=>text.focus(options)],['showPicker',()=>open(entry)]]) {
      const own = Object.getOwnPropertyDescriptor(source,key); if (own && !own.configurable) continue;
      Object.defineProperty(source,key,{configurable:true,value:method}); entry.restores.push(()=>{if (own) Object.defineProperty(source,key,own); else delete source[key];});
    }
    listen(trigger,'click',()=>open(entry));
    listen(source,'click',event=>{event.preventDefault();event.stopPropagation();text.focus();});
    listen(source,'input',()=>sync(entry)); listen(source,'change',()=>sync(entry));
    listen(source,'invalid',event=>{ event.preventDefault(); setError(entry,source.validationMessage); text.focus(); text.reportValidity(); });
    const typed = type => {
      if (source.disabled || source.matches(':disabled') || source.readOnly) return;
      entry.editing = true;
      const value = text.value.trim(), rules = kind === 'date' ? dateRules(source) : timeRules(source);
      const valid = !value || (kind === 'date' ? dateAllowed(value,rules) : timeAllowed(parseTime(value),rules));
      if (!valid) { setError(entry,word(kind === 'date' ? 'invalidDate' : 'invalidTime',kind === 'date' ? 'Enter an available date in YYYY-MM-DD format.' : 'Enter an available time in HH:MM or HH:MM:SS format.')); return; }
      setError(entry,''); source.value = value; source.dispatchEvent(new view.Event(type,{bubbles:true,composed:true}));
    };
    listen(text,'input',event=>{event.stopPropagation();typed('input');}); listen(text,'change',event=>{event.stopPropagation();typed('change');entry.editing=false;});
    listen(text,'keydown',event=>{ if (event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {event.preventDefault();open(entry);} });
    sync(entry);
  }

  function release(entry) {
    entries.delete(entry.source); close(entry,{immediate:true}); entry.disposers.forEach(remove=>remove()); entry.restores.forEach(restore=>restore());
    if (entry.errorMessage && entry.source.validationMessage === entry.errorMessage) entry.source.setCustomValidity(entry.authorValidity);
    for (const [name,value] of entry.attributes) setAttribute(entry.source,name,value);
    if (!entry.hadClass) entry.source.classList.remove('tblu-native-source');
    if (entry.shell.contains(entry.source)) entry.shell.replaceWith(entry.source); else entry.shell.remove();
  }
  function refresh() {
    if (stopped) return;
    for (const entry of [...entries.values()]) { if (!inside(entry.source) || entry.source.type !== entry.kind) release(entry); else sync(entry); }
    const sources = [...root.querySelectorAll(selector)]; if (root.matches?.(selector)) sources.unshift(root); sources.forEach(enhance);
  }
  const observer = new view.MutationObserver(()=>{if (!queued && !stopped) {queued=true;defer(()=>{queued=false;refresh();});}});
  observer.observe(root === doc ? doc.documentElement : root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['type','value','min','max','step','disabled','required','readonly','aria-label','aria-labelledby','aria-describedby','aria-invalid','title']});
  const reset = () => defer(()=>{for (const entry of entries.values()) {entry.editing=false;setError(entry,'');entry.signature=undefined;sync(entry);close(entry,{immediate:true});}});
  root.addEventListener('reset',reset,true); refresh();
  return {refresh,destroy() {if (stopped) return;stopped=true;observer.disconnect();root.removeEventListener('reset',reset,true);for (const entry of [...entries.values()]) release(entry);}};
}
