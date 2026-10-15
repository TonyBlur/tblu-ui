import '@awesome.me/webawesome/dist/components/rating/rating.js';
import '@awesome.me/webawesome/dist/components/otp-input/otp-input.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/tree/tree.js';
import '@awesome.me/webawesome/dist/components/tree-item/tree-item.js';
import '@awesome.me/webawesome/dist/components/relative-time/relative-time.js';
import {createPopover} from './overlays.js';
import {icon} from './icons.js';
import {bridgeProperty} from './control-helpers.mjs';
import {parseISODate,addDateDays,parseTime} from './temporal-math.mjs';

export const formCoverage = Object.freeze(Array.from({length:31},(_,index)=>String(index+26)));
const esc = value => String(value ?? '').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const node = (doc,tag,className,text) => {const result=doc.createElement(tag);if(className)result.className=className;if(text!==undefined)result.textContent=text;return result;};
const change = input => {const Event=input.ownerDocument.defaultView.Event;input.dispatchEvent(new Event('input',{bubbles:true,composed:true}));input.dispatchEvent(new Event('change',{bubbles:true,composed:true}));};
const restoreAttr = (element,name,value) => value===null ? element.removeAttribute(name) : element.setAttribute(name,value);
let nextCombo=0;

export function normalizeTokens(values) {
  const unique=new Set();return values.map(value=>String(value).trim()).filter(value=>{const key=value.toLocaleLowerCase();if(!value||unique.has(key))return false;unique.add(key);return true;});
}
export function stepQuantity(value,direction,{min=0,max=Infinity,step=1}={}) {
  step=Number(step)>0?Number(step):1;const start=Number.isFinite(Number(value))?Number(value):min;
  const next=min+Math.round((start-min)/step+direction)*step;
  return Math.round(Math.min(max,Math.max(min,next))*1e9)/1e9;
}
export function passwordIndicators(value,minLength=12) {
  return {longEnough:value.length>=minLength,mixedCase:/[a-z]/.test(value)&&/[A-Z]/.test(value),number:/\d/.test(value),symbol:/[^\p{L}\p{N}\s]/u.test(value)};
}
export function formatPhoneDigits(value) {
  const digits=String(value).replace(/\D/g,'').slice(0,10);
  return {raw:digits,formatted:digits.length<=3?digits:digits.length<=6?`(${digits.slice(0,3)}) ${digits.slice(3)}`:`(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`};
}
export function isoWeekPeriod(year,week) {
  if(!Number.isInteger(year)||year<1||year>9999||!Number.isInteger(week)||week<1||week>53)return null;
  const january=`${String(year).padStart(4,'0')}-01-04`,weekday=new Date(parseISODate(january).epoch).getUTCDay()||7;
  const start=addDateDays(january,1-weekday+(week-1)*7),thursday=addDateDays(start,3);
  if(!thursday||parseISODate(thursday).year!==year)return null;
  return {value:`${String(year).padStart(4,'0')}-W${String(week).padStart(2,'0')}`,start,end:addDateDays(start,6)};
}
/** Return every matching instant, so callers can explicitly resolve common DST overlaps. */
export function zonedDateTimeCandidates(date,time,timeZone='UTC') {
  const day=parseISODate(date),seconds=parseTime(time);if(!day||seconds===null)throw new TypeError('A valid ISO date and 24-hour time are required.');
  const format=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const wall=day.epoch+seconds*1000,offsets=new Set();
  const partsAt=value=>Object.fromEntries(format.formatToParts(new Date(value)).filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]));
  for(let delta=-36;delta<=36;delta+=6){const instant=wall+delta*3600000,parts=partsAt(instant),parsed=parseISODate(`${String(parts.year).padStart(4,'0')}-${String(parts.month).padStart(2,'0')}-${String(parts.day).padStart(2,'0')}`);offsets.add(parsed.epoch+parts.hour*3600000+parts.minute*60000+parts.second*1000-Math.floor(instant/1000)*1000);}
  return [...offsets].map(offset=>wall-offset).filter(instant=>{const parts=partsAt(instant);return parts.year===day.year&&parts.month===day.month&&parts.day===day.day&&parts.hour===Math.floor(seconds/3600)&&parts.minute===Math.floor(seconds/60)%60&&parts.second===Math.floor(seconds)%60;}).sort((left,right)=>left-right).map(value=>new Date(value).toISOString());
}

/** Editable single/multiple selection. The original input submits IDs (JSON array for multiple). */
export function mountCombobox(input,{options=[],getLabel=option=>option.label??String(option),getValue=option=>option.value??String(option),multiple=false,allowCreate=false,onChange,onError}={}) {
  const doc=input.ownerDocument,view=doc.defaultView,id=`tblu-combo-${++nextCombo}`;
  const attributes=new Map(['style','tabindex','aria-hidden','data-tblu-native-source'].map(name=>[name,input.getAttribute(name)]));
  const originalClass=input.classList.contains('tblu-native-source'),existing=input.closest('.tblu-control');
  const wrapper=existing||node(doc,'span','tblu-control tblu-combobox');
  const hadCombo=wrapper.classList.contains('tblu-combobox');wrapper.classList.add('tblu-combobox');if(!existing){input.before(wrapper);wrapper.dataset.tbluSurface='control';wrapper.append(input);}
  const query=node(doc,'input','tblu-input tblu-combobox-query');query.type='text';query.name='';query.dataset.tbluAdapter='combobox';query.autocomplete='off';query.setAttribute('role','combobox');query.setAttribute('aria-autocomplete','list');query.setAttribute('aria-expanded','false');query.setAttribute('aria-haspopup','listbox');
  query.setAttribute('aria-label',input.getAttribute('aria-label')||input.labels?.[0]?.querySelector('span')?.textContent||input.name||'Choose options');
  const clear=node(doc,'button','tblu-icon-button');clear.type='button';clear.dataset.tbluVariant='quiet';clear.setAttribute('aria-label','Clear selection');clear.textContent='×';
  const tokens=node(doc,'span','tblu-combobox-tokens tblu-cluster'),status=node(doc,'small','tblu-muted');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  wrapper.append(query,clear);wrapper.before(tokens);wrapper.after(status);
  input.classList.add('tblu-native-source');input.dataset.tbluNativeSource='combobox';input.tabIndex=-1;input.setAttribute('aria-hidden','true');
  Object.assign(input.style,{position:'absolute',width:'1px',height:'1px',opacity:'0',clipPath:'inset(50%)',pointerEvents:'none'});
  let stopped=false,popup,list,current=-1,pool=Array.isArray(options)?[...options]:[],selected=[],generation=0,updating=false;
  const listeners=[],restores=[];
  const listen=(target,type,handler)=>{target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));};
  const labelOf=value=>String(getLabel(pool.find(option=>String(getValue(option))===String(value))??{label:value,value}));
  const parseSource=()=>{if(!multiple)return input.value?[input.value]:[];try{const values=JSON.parse(input.value||'[]');return Array.isArray(values)?normalizeTokens(values):[];}catch{return [];}};
  function close(){const old=popup;popup=undefined;list=undefined;current=-1;query.removeAttribute('aria-activedescendant');old?.hidePopover();query.setAttribute('aria-expanded','false');}
  function sync(){if(stopped||updating)return;selected=parseSource();query.disabled=input.disabled||input.matches(':disabled');query.readOnly=input.readOnly;clear.disabled=query.disabled||query.readOnly;query.value=multiple?'':selected.length?labelOf(selected[0]):'';tokens.replaceChildren();tokens.hidden=!multiple;clear.hidden=!selected.length;
    selected.forEach(value=>{const remove=node(doc,'button','tblu-chip',`${labelOf(value)} ×`);remove.type='button';remove.setAttribute('aria-label',`Remove ${labelOf(value)}`);remove.disabled=query.disabled||query.readOnly;remove.onclick=()=>commit(selected.filter(item=>item!==value));tokens.append(remove);});
  }
  function report(error){if(onError){onError(error);return;}query.dispatchEvent(new view.CustomEvent('tblu-error',{bubbles:true,detail:{error,source:'combobox'}}));}
  function commit(values){selected=multiple?normalizeTokens(values):values.slice(0,1);updating=true;input.value=multiple?JSON.stringify(selected):selected[0]||'';input.setCustomValidity('');updating=false;sync();change(input);try{Promise.resolve(onChange?.(multiple?[...selected]:selected[0]??null)).catch(report);}catch(error){report(error);}if(!multiple)close();else renderOptions();query.focus();}
  function select(option){if(option.disabled)return;const value=String(getValue(option));commit(multiple?selected.includes(value)?selected.filter(item=>item!==value):[...selected,value]:[value]);}
  function renderOptions(){if(!list)return;list.replaceChildren();const term=query.value.trim().toLocaleLowerCase();let matches=pool.filter(option=>String(getLabel(option)).toLocaleLowerCase().includes(term));
    if(allowCreate&&term&&!pool.some(option=>String(getLabel(option)).toLocaleLowerCase()===term)){const label=query.value.trim();matches=[...matches,{label,value:label,created:true}];}
    matches.forEach((option,index)=>{const value=String(getValue(option)),row=node(doc,'button','tblu-menu-item',`${option.created?'Add “':''}${String(getLabel(option))}${option.created?'”':''}`);row.type='button';row.setAttribute('role','option');row.id=`${id}-${index}`;row.disabled=Boolean(option.disabled);row.tabIndex=-1;row.setAttribute('aria-selected',String(selected.includes(value)));row.dataset.tbluSelected=String(selected.includes(value));row.onpointerdown=event=>event.preventDefault();row.onclick=()=>{if(option.created)pool.push(option);select(option);};list.append(row);});
    if(!matches.length)list.append(node(doc,'p','tblu-muted','No matching options.'));current=-1;query.removeAttribute('aria-activedescendant');
  }
  async function show(){if(stopped||query.disabled||query.readOnly)return;
    if(!popup){list=node(doc,'div','tblu-menu tblu-combobox-options');list.id=id;list.setAttribute('role','listbox');list.setAttribute('aria-label',query.getAttribute('aria-label'));if(multiple)list.setAttribute('aria-multiselectable','true');
      const opened=createPopover(query,{content:list,placement:'bottom-start',onClose:()=>{if(popup===opened){popup=undefined;list=undefined;query.setAttribute('aria-expanded','false');query.removeAttribute('aria-activedescendant');}}});popup=opened;popup.panel.removeAttribute('role');popup.panel.removeAttribute('aria-label');query.setAttribute('aria-haspopup','listbox');query.setAttribute('aria-controls',id);
    }
    if(typeof options==='function'){const version=++generation;query.setAttribute('aria-busy','true');status.textContent='Loading options…';try{const found=await options(query.value);if(stopped||version!==generation)return;pool=Array.isArray(found)?found:[];status.textContent=`${pool.length} options available.`;}catch(error){if(version===generation){status.textContent='Options could not be loaded.';report(error);}}finally{if(version===generation)query.removeAttribute('aria-busy');}}
    renderOptions();
  }
  listen(query,'input',event=>{event.stopPropagation();input.setCustomValidity(query.value.trim()?'Choose an option or press Enter to add the typed value.':'');show();});
  listen(query,'focus',()=>{if(!query.readOnly)show();});
  listen(query,'keydown',event=>{if(event.isComposing)return;const rows=list?[...list.querySelectorAll('button:not(:disabled)')]:[];
    if(event.key==='Escape'){event.preventDefault();close();sync();return;}
    if(event.key==='Backspace'&&multiple&&!query.value&&selected.length){commit(selected.slice(0,-1));return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!popup){show();return;}if(rows.length){current=(current+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length;rows.forEach((row,index)=>row.toggleAttribute('aria-current',index===current));query.setAttribute('aria-activedescendant',rows[current].id);rows[current].scrollIntoView({block:'nearest'});}return;}
    if(event.key==='Enter'&&popup){event.preventDefault();(rows[current]||rows[0])?.click();}
    if(event.key==='Tab'){close();if(multiple)query.value='';}
  });
  listen(query,'paste',event=>{if(!multiple)return;const text=event.clipboardData?.getData('text')||'';if(!/[,;\n]/.test(text))return;event.preventDefault();const values=normalizeTokens(text.split(/[,;\n]/)).map(label=>{const known=pool.find(option=>String(getLabel(option)).toLocaleLowerCase()===label.toLocaleLowerCase());if(known&&!known.disabled)return String(getValue(known));if(allowCreate&&!known){const option={label,value:label};pool.push(option);return label;}return null;}).filter(Boolean);commit([...selected,...values]);status.textContent=`${values.length} pasted values processed; duplicates are removed.`;});
  listen(clear,'click',()=>{commit([]);close();});listen(input,'input',sync);listen(input,'change',sync);listen(input,'invalid',event=>{event.preventDefault();query.setCustomValidity(input.validationMessage);query.reportValidity();query.focus();});
  restores.push(bridgeProperty(input,'value',sync),bridgeProperty(input,'disabled',sync),bridgeProperty(input,'readOnly',sync));const focus=Object.getOwnPropertyDescriptor(input,'focus');Object.defineProperty(input,'focus',{configurable:true,value:options=>query.focus(options)});restores.push(()=>focus?Object.defineProperty(input,'focus',focus):delete input.focus);
  const reset=()=>view.queueMicrotask(()=>{input.setCustomValidity('');close();sync();});input.form?.addEventListener('reset',reset);sync();
  return {get value(){return multiple?[...selected]:selected[0]??null;},setValue(value,{emit=false}={}){if(emit)commit(multiple?value:[value]);else{input.value=multiple?JSON.stringify(value):value??'';sync();}},setOptions(value){pool=[...value];options=pool;sync();renderOptions();},clear(){commit([]);},destroy(){if(stopped)return;stopped=true;generation++;close();listeners.forEach(remove=>remove());input.form?.removeEventListener('reset',reset);restores.forEach(restore=>restore());query.remove();clear.remove();tokens.remove();status.remove();if(!hadCombo)wrapper.classList.remove('tblu-combobox');if(!existing)wrapper.replaceWith(input);for(const[name,value]of attributes)restoreAttr(input,name,value);if(!originalClass)input.classList.remove('tblu-native-source');input.setCustomValidity('');}};
}

export function mountQuantity(input,{decrement,increment,onChange}={}) {
  const rules=()=>({min:Number(input.min||0),max:input.max?Number(input.max):Infinity,step:Number(input.step)||1});
  const refresh=()=>{if(decrement)decrement.disabled=input.disabled||Number(input.value)<=rules().min;if(increment)increment.disabled=input.disabled||Number(input.value)>=rules().max;};
  const move=direction=>{input.value=String(stepQuantity(input.value,direction,rules()));change(input);onChange?.(Number(input.value));refresh();};
  const down=()=>move(-1),up=()=>move(1);decrement?.addEventListener('click',down);increment?.addEventListener('click',up);input.addEventListener('input',refresh);refresh();
  return {refresh,destroy(){decrement?.removeEventListener('click',down);increment?.removeEventListener('click',up);input.removeEventListener('input',refresh);}};
}
export function mountPassword(input,{reveal,confirm,status,minLength=12}={}) {
  const originalType=input.type;
  const update=()=>{const indicators=passwordIndicators(input.value,minLength),count=Object.values(indicators).filter(Boolean).length;if(status)status.textContent=`${count}/4 policy indicators met. Use at least ${minLength} characters and a unique password.`;if(confirm)confirm.setCustomValidity(confirm.value&&confirm.value!==input.value?'The passwords do not match.':'');};
  const toggle=()=>{const shown=input.type==='password';input.type=shown?'text':'password';reveal.setAttribute('aria-pressed',String(shown));reveal.textContent=shown?'Hide password':'Show password';};
  reveal?.addEventListener('click',toggle);input.addEventListener('input',update);confirm?.addEventListener('input',update);update();
  return {refresh:update,destroy(){reveal?.removeEventListener('click',toggle);input.removeEventListener('input',update);confirm?.removeEventListener('input',update);input.type=originalType;confirm?.setCustomValidity('');}};
}
export function mountFormValidation(form,{summary,dirty,validate=()=>({}),onSubmit,onDirtyChange}={}) {
  const original=form.noValidate;form.noValidate=true;const managed=new Map(),invalidAttrs=new Map();let stopped=false,baseline,busy=false;
  const snapshot=()=>JSON.stringify([...new form.ownerDocument.defaultView.FormData(form)].map(([key,value])=>[key,typeof value==='string'?value:{name:value.name,size:value.size,lastModified:value.lastModified}]));
  const updateDirty=()=>{const changed=snapshot()!==baseline;if(dirty)dirty.textContent=changed?'Unsaved changes':'No unsaved changes';onDirtyChange?.(changed);};
  const errors=()=>{for(const[field,message]of managed)if(field.validationMessage===message)field.setCustomValidity('');managed.clear();const custom=validate(form)||{};for(const[name,message]of Object.entries(custom)){const field=form.elements.namedItem(name);if(field&&message){field.setCustomValidity(String(message));managed.set(field,String(message));}}
    return [...form.elements].filter(field=>!field.hasAttribute('data-tblu-adapter')&&!field.disabled&&field.willValidate!==false&&field.validity&&!field.validity.valid).map(field=>({field,message:field.validationMessage,label:field.getAttribute('aria-label')||field.labels?.[0]?.querySelector('span')?.textContent||field.name||'Field'}));};
  function display(items){if(!summary)return;summary.replaceChildren();summary.hidden=!items.length;if(!items.length)return;summary.setAttribute('role','alert');summary.tabIndex=-1;summary.append(node(form.ownerDocument,'strong','',`${items.length} ${items.length===1?'field needs':'fields need'} attention`));const list=node(form.ownerDocument,'ul','tblu-list');items.forEach(({field,message,label})=>{if(!invalidAttrs.has(field))invalidAttrs.set(field,field.getAttribute('aria-invalid'));field.setAttribute('aria-invalid','true');const item=node(form.ownerDocument,'li',''),link=node(form.ownerDocument,'button','tblu-link',`${label}: ${message}`);link.type='button';link.onclick=()=>field.focus();item.append(link);list.append(item);});summary.append(list);}
  const submit=async event=>{event.preventDefault();if(busy||stopped)return;const items=errors();display(items);if(items.length){summary?.focus();return;}busy=true;const buttons=[...form.querySelectorAll('[type=submit]')],disabled=buttons.map(button=>button.disabled);buttons.forEach(button=>{button.disabled=true;button.setAttribute('aria-busy','true');});try{await onSubmit?.(new form.ownerDocument.defaultView.FormData(form),form);if(!stopped){baseline=snapshot();updateDirty();}}catch(error){if(!stopped&&summary){summary.hidden=false;summary.setAttribute('role','alert');summary.textContent=`Could not save: ${error.message}`;}}finally{busy=false;if(!stopped)buttons.forEach((button,index)=>{button.disabled=disabled[index];button.removeAttribute('aria-busy');});}};
  const input=event=>{const field=event.target;if(field.validity?.valid&&invalidAttrs.has(field)){restoreAttr(field,'aria-invalid',invalidAttrs.get(field));invalidAttrs.delete(field);}updateDirty();};
  const reset=()=>form.ownerDocument.defaultView.queueMicrotask(()=>{if(stopped)return;managed.forEach((message,field)=>{if(field.validationMessage===message)field.setCustomValidity('');});managed.clear();invalidAttrs.forEach((value,field)=>restoreAttr(field,'aria-invalid',value));invalidAttrs.clear();display([]);baseline=snapshot();updateDirty();});
  baseline=snapshot();form.addEventListener('submit',submit);form.addEventListener('input',input);form.addEventListener('change',input);form.addEventListener('reset',reset);updateDirty();
  return {validate(){const items=errors();display(items);return !items.length;},markSaved(){baseline=snapshot();updateDirty();},destroy(){stopped=true;form.noValidate=original;form.removeEventListener('submit',submit);form.removeEventListener('input',input);form.removeEventListener('change',input);form.removeEventListener('reset',reset);managed.forEach((message,field)=>{if(field.validationMessage===message)field.setCustomValidity('');});invalidAttrs.forEach((value,field)=>restoreAttr(field,'aria-invalid',value));}};
}
export function mountDateRange(start,end,{onChange}={}) {
  const min=end.getAttribute('min');const update=()=>{end.min=start.value;if(start.value&&end.value&&end.value<start.value)end.value=start.value;onChange?.({start:start.value,end:end.value});};
  start.addEventListener('input',update);start.addEventListener('change',update);end.addEventListener('change',update);update();
  return {setValue(value){start.value=value.start;end.value=value.end;update();change(start);change(end);},destroy(){start.removeEventListener('input',update);start.removeEventListener('change',update);end.removeEventListener('change',update);restoreAttr(end,'min',min);}};
}

export function mountCascader(host,{nodes,path=[],field,onChange}={}) {
  const doc=host.ownerDocument,prior=[...host.childNodes];let selected=[...path],stopped=false;
  function render(){host.replaceChildren();let choices=nodes;const next=[];for(let depth=0;choices?.length;depth++){const selectedNode=choices.find(item=>item.value===selected[depth]&&!item.disabled)||choices.find(item=>!item.disabled);if(!selectedNode)break;next.push(selectedNode.value);const label=node(doc,'label','tblu-field'),caption=node(doc,'span','',`Level ${depth+1}`),select=node(doc,'select','');select.name='';choices.forEach(item=>{const option=node(doc,'option','',item.label);option.value=item.value;option.disabled=Boolean(item.disabled);option.selected=item===selectedNode;select.append(option);});select.onchange=()=>{selected=[...next.slice(0,depth),select.value];render();onChange?.([...selected]);};label.append(caption,select);host.append(label);choices=selectedNode.children;}selected=next;if(field)field.value=selected.join('/');}
  render();return {get value(){return [...selected];},setValue(value){if(!stopped){selected=[...value];render();onChange?.([...selected]);}},destroy(){stopped=true;host.replaceChildren(...prior);}};
}
export function mountTreeSelect(tree,{field,getValue=item=>item.dataset.value,onChange}={}) {
  const update=event=>{const items=event?.detail?.selection||[...tree.querySelectorAll('wa-tree-item')].filter(item=>item.selected),values=items.filter(item=>!item.querySelector('wa-tree-item')).map(getValue).filter(Boolean);field.value=JSON.stringify(values);change(field);onChange?.(values);};tree.addEventListener('wa-selection-change',update);
  return {refresh:()=>update(),destroy(){tree.removeEventListener('wa-selection-change',update);}};
}

export function mountTransfer(host,{options,value=[],field,onChange}={}) {
  const doc=host.ownerDocument,prior=[...host.childNodes];let selected=normalizeTokens(value),leftSelection=new Set(),rightSelection=new Set(),filter='',stopped=false;
  const emit=()=>{if(field){field.value=JSON.stringify(selected);change(field);}onChange?.([...selected]);};
  function render(focusValue){host.replaceChildren();const layout=node(doc,'div','tblu-transfer tblu-grid');for(const side of ['available','selected']){const column=node(doc,'div','tblu-stack'),heading=node(doc,'h4','tblu-heading',side==='available'?'Available':'Selected'),search=node(doc,'input','tblu-input');search.type='search';search.name='';search.setAttribute('aria-label',`Search ${side} choices`);search.placeholder='Filter choices';search.value=filter;search.oninput=()=>{filter=search.value;render();host.querySelector(`[data-transfer-search="${side}"]`)?.focus();};search.dataset.transferSearch=side;
      const list=node(doc,'div','tblu-transfer-list tblu-scroll tblu-stack');list.setAttribute('role','listbox');list.setAttribute('aria-label',side==='available'?'Available choices':'Selected choices');list.setAttribute('aria-multiselectable','true');const items=side==='selected'?selected.map(id=>options.find(option=>option.value===id)).filter(Boolean):options.filter(option=>!selected.includes(option.value));
      items.filter(option=>option.label.toLocaleLowerCase().includes(filter.toLocaleLowerCase())).forEach(option=>{const choice=node(doc,'button','tblu-menu-item',option.label);choice.type='button';choice.setAttribute('role','option');choice.disabled=Boolean(option.disabled);choice.dataset.transferValue=option.value;choice.dataset.transferSide=side;const set=side==='selected'?rightSelection:leftSelection;choice.setAttribute('aria-selected',String(set.has(option.value)));choice.dataset.tbluSelected=String(set.has(option.value));choice.onclick=()=>{set.has(option.value)?set.delete(option.value):set.add(option.value);render(option.value);};choice.onkeydown=event=>{const rows=[...list.querySelectorAll('button:not(:disabled)')],index=rows.indexOf(choice);if(event.altKey&&side==='selected'&&['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const old=selected.indexOf(option.value),next=Math.min(selected.length-1,Math.max(0,old+(event.key==='ArrowUp'?-1:1)));[selected[old],selected[next]]=[selected[next],selected[old]];emit();render(option.value);}else if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?rows.length-1:(index+(event.key==='ArrowUp'?-1:1)+rows.length)%rows.length;rows[next]?.focus();}};list.append(choice);});column.append(heading,search,list);layout.append(column);}
    const controls=node(doc,'div','tblu-cluster');for(const[label,action]of [['Add selected',()=>{selected=normalizeTokens([...selected,...leftSelection]);leftSelection.clear();}],['Remove selected',()=>{selected=selected.filter(id=>!rightSelection.has(id));rightSelection.clear();}],['Add all',()=>{selected=normalizeTokens([...selected,...options.filter(option=>!option.disabled).map(option=>option.value)]);}],['Clear all',()=>{selected=[];rightSelection.clear();}]]){const button=node(doc,'button','tblu-button',label);button.type='button';button.onclick=()=>{action();emit();render();};controls.append(button);}host.append(layout,controls);if(focusValue)host.querySelector(`[data-transfer-value="${focusValue}"]`)?.focus();}
  render();if(field)field.value=JSON.stringify(selected);return {get value(){return [...selected];},setValue(value){if(!stopped){selected=normalizeTokens(value).filter(id=>options.some(option=>option.value===id&&!option.disabled));emit();render();}},destroy(){stopped=true;host.replaceChildren(...prior);}};
}

/** Coarse periods are explicitly modeled; these menus never open an OS month/week picker. */
export function mountPeriodPicker(field,{trigger,kind='month',year=new Date().getFullYear(),onChange}={}) {
  const doc=field.ownerDocument;let popup,stopped=false;
  const label=()=>{trigger.textContent=field.value||`Choose ${kind}`;};
  function open(){if(stopped||trigger.disabled)return;if(popup){popup.hidePopover();popup=undefined;return;}const content=node(doc,'div','tblu-period-picker tblu-stack');
    const render=()=>{content.replaceChildren();const heading=node(doc,'div','tblu-cluster'),previous=node(doc,'button','tblu-icon-button','−'),caption=node(doc,'strong','',String(year)),next=node(doc,'button','tblu-icon-button','+');previous.type=next.type='button';previous.setAttribute('aria-label','Previous year');next.setAttribute('aria-label','Next year');previous.onclick=()=>{year=Math.max(1,year-1);render();};next.onclick=()=>{year=Math.min(9999,year+1);render();};heading.append(previous,caption,next);content.append(heading);
      const grid=node(doc,'div','tblu-period-grid tblu-grid');for(let index=1;index<=(kind==='month'?12:53);index++){const period=kind==='month'?{value:`${year}-${String(index).padStart(2,'0')}`,label:new Intl.DateTimeFormat(doc.documentElement?.lang||'en',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2000,index-1,1)))}:isoWeekPeriod(year,index);if(!period)continue;const choice=node(doc,'button','tblu-button',kind==='month'?period.label:`W${index} · ${period.start}`);choice.type='button';choice.dataset.tbluSelected=String(field.value===period.value);choice.onclick=()=>{field.value=period.value;change(field);label();onChange?.(period.value);popup?.hidePopover({returnFocus:true});popup=undefined;};grid.append(choice);}content.append(grid);};render();const opened=createPopover(trigger,{content,title:`Choose ${kind}`,placement:'bottom-start',onClose:()=>{if(popup===opened)popup=undefined;}});popup=opened;}
  trigger.addEventListener('click',open);label();return {refresh:label,destroy(){stopped=true;trigger.removeEventListener('click',open);popup?.hidePopover({immediate:true});}};
}
