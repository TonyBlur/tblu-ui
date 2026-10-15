import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/drawer/drawer.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import '@awesome.me/webawesome/dist/components/progress-ring/progress-ring.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
import '@awesome.me/webawesome/dist/components/avatar/avatar.js';
import {icon} from './icons.js';
import {openMenu,createPopover} from './overlays.js';
import {openDialog,showToast,attachTooltip} from './feedback.js';

let nextScope=0;
export const navigationCoverage=Object.freeze(['14','15','16','19','20','21','22','23','24','25','68','72','75','76','77','78','79','80','81','82','83','84','85']);
const paletteOwners=new WeakMap();
const node=(doc,tag,cls,text)=>{const element=doc.createElement(tag);if(cls)element.className=cls;if(text!==undefined)element.textContent=String(text);return element;};
const glyph=(doc,name)=>{const template=doc.createElement('template');template.innerHTML=icon(name);return template.content;};
const action=(doc,label,handler,{symbol,variant}={})=>{const button=node(doc,'button','tblu-button');button.type='button';if(symbol)button.append(glyph(doc,symbol));button.append(node(doc,'span','',label));if(variant)button.dataset.tbluVariant=variant;button.onclick=handler;return button;};
const fail=(host,error)=>host.dispatchEvent(new host.ownerDocument.defaultView.CustomEvent('tblu-error',{bubbles:true,composed:true,detail:{error,source:'pattern'}}));
const invoke=(host,callback,value)=>{try{Promise.resolve(callback?.(value)).catch(error=>fail(host,error));}catch(error){fail(host,error);}};
const foldText=value=>String(value??'').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase();

export function paginationState({total=0,page=1,pageSize=5,hasNext=false}={}){
  if(total!==null&&(!Number.isFinite(total)||total<0))throw new TypeError('Total must be a nonnegative number or null');
  if(!Number.isInteger(pageSize)||pageSize<1)throw new TypeError('Page size must be a positive integer');
  const pages=total===null?null:Math.max(1,Math.ceil(total/pageSize)),current=Math.max(1,Math.min(pages??Infinity,Number.isFinite(page)?Math.floor(page):1));
  return{total,page:current,pageSize,pages,start:(current-1)*pageSize,end:total===null?current*pageSize:Math.min(total,current*pageSize),hasPrevious:current>1,hasNext:pages===null?Boolean(hasNext):current<pages};
}
export function searchCommands(commands,query){
  const terms=foldText(query).trim().split(/\s+/).filter(Boolean);
  return commands.filter(command=>terms.every(term=>foldText(`${command.label} ${command.group||''} ${(command.keywords||[]).join(' ')}`).includes(term)));
}

/** Accessible native pagination. Hosts own fetching; unknown totals use total:null + hasNext. */
export function mountPagination(host,options={}){
  const doc=host.ownerDocument,element=node(doc,'nav','tblu-pagination tblu-cluster');element.setAttribute('aria-label',options.label||'Pagination');host.append(element);
  let state=paginationState(options),stopped=false;
  function render(){
    const previous=action(doc,'Previous',()=>setState({page:state.page-1}),{symbol:'ChevronLeft'});previous.disabled=!state.hasPrevious;
    const next=action(doc,'Next',()=>setState({page:state.page+1}),{symbol:'ChevronRight'});next.disabled=!state.hasNext;
    const controls=[previous];
    if(state.pages!==null){const start=Math.max(1,Math.min(state.page-2,state.pages-4));for(let page=start;page<=Math.min(state.pages,start+4);page++){const button=action(doc,String(page),()=>setState({page}));if(page===state.page){button.setAttribute('aria-current','page');button.dataset.tbluSelected='true';}controls.push(button);}}
    controls.push(next);
    const label=node(doc,'label','tblu-pagination-size tblu-cluster'),select=node(doc,'select');select.setAttribute('aria-label','Items per page');
    [...new Set([state.pageSize,...(options.pageSizes||[5,10,20])])].filter(size=>Number.isInteger(size)&&size>0).sort((a,b)=>a-b).forEach(size=>{const option=node(doc,'option','',String(size));option.value=String(size);option.selected=size===state.pageSize;select.append(option);});
    select.onchange=()=>setState({pageSize:Number(select.value),page:1});label.append(node(doc,'span','tblu-muted','Per page'),select);controls.push(label);
    element.replaceChildren(...controls);
  }
  function setState(patch,{emit=true}={}){if(stopped)return;state=paginationState({...state,...patch});render();if(emit)invoke(host,options.onChange,{...state});}
  render();return{element,getState:()=>({...state}),setState,destroy(){if(!stopped){stopped=true;element.remove();}}};
}

/** Web Awesome owns roving focus and automatic/manual activation; panel contents stay real Nodes. */
export function mountTabs(host,{items=[],active=items[0]?.id,orientation='horizontal',activation='auto',onChange}={}){
  const ids=new Set();items.forEach(item=>{if(!item.id||ids.has(String(item.id))||!item.content?.nodeType)throw new TypeError('Tabs require unique IDs and content Nodes');ids.add(String(item.id));});
  const doc=host.ownerDocument,prefix=`tblu-tabs-${++nextScope}-`,element=node(doc,'wa-tab-group','tblu-tabs-control');
  element.activation=activation;element.placement=orientation==='vertical'?'start':'top';
  items.forEach(item=>{const tab=node(doc,'wa-tab','',item.label);tab.slot='nav';tab.panel=prefix+item.id;tab.id=prefix+'tab-'+item.id;if(item.disabled)tab.disabled=true;const panel=node(doc,'wa-tab-panel','tblu-stack');panel.name=prefix+item.id;panel.append(item.content);element.append(tab,panel);});
  const choose=id=>{const item=items.find(item=>String(item.id)===String(id)&&!item.disabled);if(!item)throw new RangeError('Unknown or disabled tab');element.active=prefix+item.id;};
  if(items.length)choose(active===undefined?items.find(item=>!item.disabled)?.id:active);host.append(element);
  const changed=event=>{const id=String(event.detail?.name||element.active).slice(prefix.length);invoke(host,onChange,id);};element.addEventListener('wa-tab-show',changed);
  let stopped=false;return{element,setActive:choose,getActive:()=>String(element.active||'').slice(prefix.length),destroy(){if(!stopped){stopped=true;element.removeEventListener('wa-tab-show',changed);element.remove();}}};
}

/** Searchable action palette. Hosts supply commands and own their effects/network work. */
export function mountCommandPalette(anchor,{commands=[],shortcut='k',onSelect,onError}={}){
  const doc=anchor.ownerDocument,prefix=`tblu-command-${++nextScope}-`;let source=[...commands],dialog,search,results,visible=[],current=0,stopped=false;
  if(!paletteOwners.has(doc))paletteOwners.set(doc,new Set());const owners=paletteOwners.get(doc);owners.add(anchor);
  function report(error){if(onError)invoke(anchor,onError,error);else fail(anchor,error);}
  function run(command){invoke(anchor,onSelect,command);let result;try{result=command.run?.();}catch(error){report(error);}Promise.resolve(result).catch(report);dialog?.close();}
  function highlight(){const options=[...results.querySelectorAll('[role="option"]')];options.forEach((button,index)=>{button.setAttribute('aria-selected',String(index===current));button.dataset.tbluSelected=String(index===current);});const active=options[current];if(active)search.setAttribute('aria-activedescendant',active.id);else search.removeAttribute('aria-activedescendant');}
  function render(){visible=searchCommands(source,search.value).filter(command=>!command.disabled);current=Math.min(current,Math.max(0,visible.length-1));results.replaceChildren(...visible.map((command,index)=>{const button=action(doc,command.label,()=>run(command),{symbol:command.icon});button.className='tblu-menu-item';button.id=prefix+'option-'+index;button.setAttribute('role','option');button.tabIndex=-1;return button;}));if(!visible.length){const empty=node(doc,'p','tblu-empty','No commands match. Try another word.');empty.setAttribute('role','status');results.append(empty);}highlight();}
  function open(){
    if(stopped)return;if(dialog?.element.isConnected){dialog.close();return;}
    const content=node(doc,'div','tblu-stack'),label=node(doc,'label','tblu-field');label.append(node(doc,'span','','Search actions'));
    search=node(doc,'input','tblu-input');search.type='search';search.setAttribute('role','combobox');search.setAttribute('aria-autocomplete','list');search.setAttribute('aria-expanded','true');search.setAttribute('aria-controls',prefix+'results');label.append(search);
    results=node(doc,'div','tblu-command-results tblu-stack');results.id=prefix+'results';results.setAttribute('role','listbox');results.setAttribute('aria-label','Available commands');
    content.append(label,results);search.oninput=()=>{current=0;render();};search.onkeydown=event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(visible.length)current=(current+(event.key==='ArrowDown'?1:-1)+visible.length)%visible.length;highlight();}else if(event.key==='Enter'&&visible[current]){event.preventDefault();run(visible[current]);}};
    render();dialog=openDialog({document:doc,root:anchor.closest('.tblu-root')||doc,title:'Command palette',content,initialFocus:search,onError});
  }
  const click=()=>open(),keydown=event=>{const scope=anchor.closest('.tblu-root');const owner=[...owners].find(item=>item.isConnected&&item.closest('.tblu-root')?.contains(doc.activeElement))||[...owners].find(item=>item.isConnected);if(owner!==anchor||scope&&doc.activeElement?.closest('.tblu-root')&&doc.activeElement.closest('.tblu-root')!==scope)return;if(!stopped&&!event.defaultPrevented&&(event.ctrlKey||event.metaKey)&&event.key.toLocaleLowerCase()===shortcut.toLocaleLowerCase()&&!event.altKey){event.preventDefault();open();}};
  anchor.addEventListener('click',click);doc.addEventListener('keydown',keydown);
  return{open,close:()=>dialog?.close(),setCommands(next){source=[...next];if(dialog?.element.isConnected)render();},destroy(){if(!stopped){stopped=true;owners.delete(anchor);if(!owners.size)paletteOwners.delete(doc);anchor.removeEventListener('click',click);doc.removeEventListener('keydown',keydown);dialog?.destroy();}}};
}

/** Functional, categorized compositions; routing, notification persistence and request execution stay with the host. */
export function renderNavigationExamples(host,{notify}={}){
  const doc=host.ownerDocument,view=doc.defaultView,prefix=`tblu-nav-examples-${++nextScope}-`,element=node(doc,'div','tblu-patterns tblu-grid'),owned=[],timers=new Set();let stopped=false;
  host.append(element);
  const toast=message=>notify?invoke(host,notify,message):showToast({message,root:host.closest('.tblu-root')||doc});
  const track=controller=>{if(controller)owned.push(()=>controller.destroy?controller.destroy():controller.hidePopover?.({immediate:true}));return controller;};
  const later=(callback,delay)=>{const timer=view.setTimeout(()=>{timers.delete(timer);if(!stopped)callback();},delay);timers.add(timer);return timer;};
  const cancelLater=timer=>{view.clearTimeout(timer);timers.delete(timer);};
  const card=(title,ids,description)=>{const article=node(doc,'article','tblu-card tblu-stack');article.dataset.componentIds=ids;article.id=prefix+ids.replaceAll(',','-');article.append(node(doc,'h3','tblu-heading',title),node(doc,'p','tblu-muted',description));element.append(article);return article;};

  const actions=card('Split actions & toolbar','14,15,16','Default actions and their alternatives share one meaningful group.');
  const split=node(doc,'div','tblu-split-button tblu-cluster');split.append(action(doc,'Save draft',()=>toast('Draft saved locally.'),{symbol:'Check',variant:'primary'}));
  const alternative=action(doc,'More save actions',()=>track(openMenu(alternative,{items:[{label:'Save as a copy',icon:'Copy',onSelect:()=>toast('A draft copy was created.')},{label:'Discard draft',icon:'Trash2',variant:'danger',onSelect:()=>track(openDialog({title:'Discard draft?',content:node(doc,'p','','This example discards only its local draft.'),actions:[{label:'Keep editing',variant:'quiet'},{label:'Discard',variant:'danger',onSelect:()=>toast('Local draft discarded.')}]}))}]})),{symbol:'ChevronDown'});split.append(alternative);actions.append(split);
  const toolbar=node(doc,'div','tblu-toolbar tblu-cluster');toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Text formatting');
  const toggles=['Bold','Italic','Underline'].map((label,index)=>{const button=action(doc,label,()=>{const checked=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(checked));});button.setAttribute('aria-pressed','false');button.tabIndex=index? -1:0;button.onkeydown=event=>{const direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(direction){event.preventDefault();const next=(index+direction+3)%3;toggles.forEach((item,position)=>item.tabIndex=position===next?0:-1);toggles[next].focus();}};return button;});toolbar.append(...toggles);actions.append(toolbar);

  const menus=card('Context, menubar & navigation menus','19,20,21','Open with a pointer or keyboard. Link-rich navigation keeps real anchors.');
  const contextTarget=action(doc,'Right-click or Shift+F10 here',()=>openContext(),{symbol:'MoreHorizontal'});const openContext=()=>track(openMenu(contextTarget,{items:[{label:'Open detail',icon:'Info',onSelect:()=>toast('Context detail opened.')},{label:'Duplicate item',icon:'Copy',onSelect:()=>toast('Item duplicated.')},{label:'Unavailable action',disabled:true}]}));contextTarget.oncontextmenu=event=>{event.preventDefault();openContext();};contextTarget.onkeydown=event=>{if(event.key==='ContextMenu'||event.key==='F10'&&event.shiftKey){event.preventDefault();openContext();}};menus.append(contextTarget);
  const menubar=node(doc,'div','tblu-menubar tblu-cluster');menubar.setAttribute('role','menubar');menubar.setAttribute('aria-label','Document menu');
  const menuButtons=['File','Edit','View'].map((title,index)=>{const button=action(doc,title,()=>open());button.setAttribute('role','menuitem');button.setAttribute('aria-haspopup','menu');button.tabIndex=index?-1:0;const open=()=>track(openMenu(button,{items:[{label:title==='File'?'New document':title==='Edit'?'Undo change':'Toggle preview',icon:title==='File'?'Plus':title==='Edit'?'RefreshCw':'Grid2X2',onSelect:()=>toast(title+' action applied.')},{label:'Menu help',icon:'Info',onSelect:()=>toast('Use arrows, Enter and Escape to navigate menus.')}]}));button.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();open();}else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const next=(index+(event.key==='ArrowRight'?1:-1)+3)%3;menuButtons.forEach((item,position)=>item.tabIndex=position===next?0:-1);menuButtons[next].focus();}};return button;});menubar.append(...menuButtons);menus.append(menubar);
  const mega=action(doc,'Explore sections',()=>{const content=node(doc,'nav','tblu-mega-menu tblu-grid');content.setAttribute('aria-label','Example sections');[['Actions',actions],['Navigation',menus]].forEach(([name,target])=>{const section=node(doc,'div','tblu-stack');section.append(node(doc,'h4','tblu-heading',name));const link=node(doc,'a','tblu-button','Go to '+name.toLowerCase());link.href='#'+target.id;section.append(link);content.append(section);});track(createPopover(mega,{title:'Explore components',content}));},{symbol:'Menu'});menus.append(mega);

  const navigation=card('Breadcrumb, tabs & pagination','22,23,24','Overflow ancestors, persistent tab contents and page-size changes.');
  const breadcrumb=node(doc,'wa-breadcrumb','tblu-breadcrumb');breadcrumb.label='Example location';const path=['Workspace','Projects','Archive','Design'];
  path.forEach((name,index)=>{const item=node(doc,'wa-breadcrumb-item','',name);if(index<path.length-1)item.href='#'+navigation.id;else item.setAttribute('aria-current','page');breadcrumb.append(item);});navigation.append(breadcrumb);
  const ancestors=action(doc,'Hidden ancestors',()=>track(openMenu(ancestors,{placement:'bottom',items:path.slice(0,-1).map(label=>({label,onSelect:()=>toast('Navigated to '+label+'.')}))})),{symbol:'MoreHorizontal'});navigation.append(ancestors);
  track(mountTabs(navigation,{items:[{id:'overview',label:'Overview',content:node(doc,'p','','Tab contents remain mounted when switching.')},{id:'settings',label:'Preferences',content:(()=>{const label=node(doc,'label','tblu-switch');const input=node(doc,'input');input.type='checkbox';input.checked=true;label.append(input,node(doc,'span','','Receive updates'));return label;})()},{id:'activity',label:'Activity',content:node(doc,'p','','A draft was saved just now.')}]}));
  const pageList=node(doc,'ol','tblu-list'),pageHost=node(doc,'div');navigation.append(pageList,pageHost);const pageItems=Array.from({length:23},(_,index)=>'Record '+(index+1));
  const renderPage=state=>pageList.replaceChildren(...pageItems.slice(state.start,state.end).map(label=>node(doc,'li','',label)));const pagination=track(mountPagination(pageHost,{total:pageItems.length,pageSize:5,onChange:renderPage}));renderPage(pagination.getState());

  const commands=card('Command palette & shortcut','25','Search grouped actions, move with arrows and activate with Enter.');
  const commandButton=action(doc,'Open command palette',null,{symbol:'Search'});commands.append(commandButton,node(doc,'kbd','','Ctrl / ⌘ K'));
  track(mountCommandPalette(commandButton,{commands:[{label:'Create document',group:'Content',icon:'Plus',keywords:['new','add'],run:()=>toast('A local document was created.')},{label:'Open preferences',group:'Account',icon:'Settings',run:()=>toast('Preferences command selected.')},{label:'Export collection',group:'Files',icon:'Download',run:()=>toast('Export command selected.')},{label:'Show notifications',group:'Account',icon:'Info',run:()=>toast('Notifications command selected.')}]}));track(attachTooltip(commandButton,{text:'Search available actions · Ctrl or Command K'}));

  const disclosure=card('Disclosure, drawer & rich preview','68,72,76,77','Free Web Awesome primitives supply expansion and modal drawer behavior.');
  ['What owns network work?','Can the material change?'].forEach((summary,index)=>{const details=node(doc,'wa-details','tblu-details');details.summary=summary;details.name=prefix+'faq';details.append(node(doc,'p','',index?'Yes. The same controls support liquid and solid themes.':'The application owns requests, persistence and permissions.'));disclosure.append(details);});
  const drawer=node(doc,'wa-drawer','tblu-drawer');drawer.label='Saved filters';drawer.lightDismiss=true;drawer.placement='end';const drawerClose=action(doc,'Done',()=>{drawer.open=false;},{variant:'primary'});drawerClose.slot='footer';drawer.append(node(doc,'p','','Change a local preference without leaving the page.'),drawerClose);const filterLabel=node(doc,'label','tblu-switch'),filterInput=node(doc,'input');filterInput.type='checkbox';filterInput.checked=true;filterLabel.append(filterInput,node(doc,'span','','Include shared items'));drawer.append(filterLabel);disclosure.append(drawer,action(doc,'Open side drawer',()=>{drawer.open=true;},{symbol:'PanelLeft'}));owned.push(()=>{drawer.open=false;drawer.remove();});
  const preview=action(doc,'Preview collaborator',()=>showPreview(),{symbol:'Info'});let previewPopup,previewTimer;
  function showPreview(){if(previewPopup?.isConnected)return;const content=node(doc,'div','tblu-stack'),avatar=node(doc,'wa-avatar','tblu-avatar');avatar.initials='AL';avatar.label='Alex Lee';content.append(avatar,node(doc,'strong','','Alex Lee'),node(doc,'p','tblu-muted','Product designer · Available for review'),action(doc,'Open profile',()=>toast('Alex’s local profile opened.')));previewPopup=track(createPopover(preview,{title:'Collaborator preview',content,onClose:()=>{previewPopup=null;}}));previewPopup.addEventListener('pointerenter',()=>{if(previewTimer)view.clearTimeout(previewTimer);});previewPopup.addEventListener('pointerleave',()=>{previewTimer=later(()=>previewPopup?.hidePopover(),220);});}
  preview.onpointerenter=()=>{previewTimer=later(showPreview,450);};preview.onpointerleave=()=>{if(previewTimer)view.clearTimeout(previewTimer);previewTimer=later(()=>previewPopup?.hidePopover(),240);};preview.onfocus=()=>showPreview();disclosure.append(preview);

  const notifications=card('Notification center & actionable feedback','75,78,79,80','Read/unread filtering is local; delivery and durable read state belong to the host.');
  let notes=[{id:1,text:'Design review is ready',read:false},{id:2,text:'Export completed',read:false},{id:3,text:'Preferences updated',read:true}];
  const noticeButton=action(doc,'Open notifications',()=>{const content=node(doc,'div','tblu-stack'),filter=node(doc,'select'),list=node(doc,'ul','tblu-list');filter.setAttribute('aria-label','Notification filter');['All','Unread'].forEach(value=>{const option=node(doc,'option','',value);option.value=value;filter.append(option);});const render=()=>{const shown=notes.filter(item=>filter.value!=='Unread'||!item.read);list.replaceChildren(...shown.map(item=>{const row=node(doc,'li','tblu-cluster');row.append(node(doc,'span','',item.text),action(doc,item.read?'Mark unread':'Mark read',()=>{item.read=!item.read;render();},{variant:'quiet'}));return row;}));if(!shown.length)list.append(node(doc,'li','tblu-empty','You are caught up.'));};filter.onchange=render;content.append(filter,action(doc,'Mark all read',()=>{notes.forEach(item=>item.read=true);render();}),list);render();track(createPopover(noticeButton,{title:'Notifications',content}));},{symbol:'Info'});notifications.append(noticeButton);
  const banner=node(doc,'div','tblu-alert tblu-cluster');banner.dataset.status='info';banner.setAttribute('role','status');banner.append(node(doc,'span','','Your changes remain local in this example.'),action(doc,'Dismiss',()=>banner.remove(),{variant:'quiet'}));notifications.append(banner);

  const loading=card('Progress, skeleton & recovery','81,82,83,84','These are real local transitions, not an implied network service.');
  const bar=node(doc,'wa-progress-bar','tblu-progress'),ring=node(doc,'wa-progress-ring','tblu-progress-ring');bar.setAttribute('aria-label','Local processing progress');ring.setAttribute('aria-label','Local processing progress');bar.value=ring.value=0;
  const status=node(doc,'p','tblu-status','Ready to process'),skeleton=node(doc,'wa-skeleton','tblu-skeleton');skeleton.hidden=true;skeleton.effect='pulse';let value=0,job;
  const start=action(doc,'Start processing',()=>{start.disabled=true;cancel.disabled=false;skeleton.hidden=false;status.textContent='Processing local records…';value=0;step();},{symbol:'RefreshCw'}),cancel=action(doc,'Cancel',()=>{if(job)view.clearTimeout(job);start.disabled=false;cancel.disabled=true;skeleton.hidden=true;status.textContent='Processing canceled.';});cancel.disabled=true;
  function step(){value=Math.min(100,value+20);bar.value=ring.value=value;if(value===100){start.disabled=false;cancel.disabled=true;skeleton.hidden=true;status.textContent='All local records processed.';status.dataset.status='success';}else job=later(step,350);}
  loading.append(node(doc,'div','tblu-cluster'),bar,ring,skeleton,status,node(doc,'div','tblu-cluster'));loading.firstElementChild?.classList?.contains('tblu-cluster');const controls=node(doc,'div','tblu-cluster');controls.append(start,cancel);loading.append(controls);
  let attempts=0;const recovery=node(doc,'div','tblu-stack'),retry=action(doc,'Load preview',()=>{retry.disabled=true;recovery.replaceChildren(node(doc,'wa-spinner','tblu-spinner'));later(()=>{attempts++;retry.disabled=false;if(attempts===1){const alert=node(doc,'p','tblu-alert','Local rehearsal: the first attempt failed. Retry to recover.');alert.dataset.status='danger';alert.setAttribute('role','alert');recovery.replaceChildren(alert);retry.textContent='Retry preview';}else{recovery.replaceChildren(node(doc,'p','tblu-status','Preview recovered successfully.'));retry.textContent='Load again';}},550);});loading.append(retry,recovery);

  const tour=card('Guided onboarding','85','Steps point to live controls. The host owns persisted dismissal preferences.');let tourStep=0,tourPopup;
  const startTour=action(doc,'Start three-step tour',()=>{tourStep=0;showStep();},{symbol:'Info'}),targets=[alternative,commandButton,noticeButton];tour.append(startTour);
  function showStep(){tourPopup?.hidePopover({immediate:true});if(tourStep>=targets.length){toast('Tour finished.');startTour.focus();return;}const target=targets[tourStep];target.scrollIntoView?.({block:'center',behavior:'smooth'});const content=node(doc,'div','tblu-stack');content.append(node(doc,'p','',`Step ${tourStep+1} of ${targets.length}: ${['Explore alternative actions.','Search commands from anywhere.','Review and clear notifications.' ][tourStep]}`));const controls=node(doc,'div','tblu-cluster');controls.append(action(doc,'Skip',()=>{tourPopup?.hidePopover();startTour.focus();},{variant:'quiet'}),action(doc,tourStep===targets.length-1?'Finish':'Next',()=>{tourStep++;showStep();},{variant:'primary'}));content.append(controls);tourPopup=track(createPopover(target,{title:'Getting started',content}));tourPopup.querySelector('button')?.focus();}

  return{element,coverage:['14','15','16','19','20','21','22','23','24','25','68','72','75','76','77','78','79','80','81','82','83','84','85'],destroy(){if(stopped)return;stopped=true;timers.forEach(timer=>view.clearTimeout(timer));owned.reverse().forEach(destroy=>destroy());element.remove();}};
}
