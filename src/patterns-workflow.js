import {icon} from './icons.js';
import {openDialog,showToast} from './feedback.js';
import {parseISODate,parseTime} from './temporal-math.mjs';

let nextWorkflow = 0;
const columns = ['Backlog','In progress','Done'];

/** Immutable reorder used by pointer, keyboard and button interactions alike. */
export function moveKanbanTask(tasks,id,column,index = Infinity,allowedColumns = columns) {
  if (!allowedColumns.includes(column)) throw new RangeError('Unknown task column');
  const moving=tasks.find(task=>task.id===id);if(!moving)return tasks.map(task=>({...task}));
  const rest=tasks.filter(task=>task.id!==id).map(task=>({...task}));
  const peers=rest.filter(task=>task.column===column),position=Math.max(0,Math.min(peers.length,Number.isFinite(index)?Math.trunc(index):peers.length));
  const insertion=position<peers.length?rest.findIndex(task=>task.id===peers[position].id):peers.length?rest.findIndex(task=>task.id===peers.at(-1).id)+1:rest.length;
  rest.splice(insertion,0,{...moving,column});return rest;
}

export function validateWizard(values) {
  if(typeof values.name!=='string'||!values.name.trim()||values.name.trim().length>80)return {field:'name',message:'Enter a workspace name of 1–80 characters.'};
  if(typeof values.email!=='string'||!/^\S+@\S+\.\S+$/.test(values.email)||values.email.length>254)return {field:'email',message:'Enter an email address such as name@example.com.'};
  if(values.accept!==true)return {field:'accept',message:'Confirm that this is a local demonstration.'};
  return null;
}

/** Floating local dates/times, without implying timezone or recurrence support. */
export function normalizeAgendaEvent(value) {
  if(typeof value?.title!=='string'||!value.title.trim()||value.title.trim().length>120)throw new Error('Enter an event title of 1–120 characters.');
  if(!parseISODate(value.date)||parseTime(value.time)===null)throw new Error('Enter a valid date and time.');
  const duration=Number(value.duration);
  if(!Number.isInteger(duration)||duration<5||duration>480)throw new Error('Duration must be 5–480 minutes.');
  return {title:value.title.trim(),date:value.date,time:value.time,duration};
}

export const workflowCoverage=Object.freeze([
  {ids:[100,101,102,103,104],level:'local-pattern',limits:'No network delivery, presence service or persistence.'},
  {ids:[95,96,97,98,99],level:'pattern',limits:'Host owns durable workflow state and permissions.'},
  {ids:[58],level:'limited-pattern',limits:'Local agenda only; recurrence, resources and timezone conversion require a scheduler engine.'},
  {ids:[57],level:'primitive',limits:'Local duration/countdown; no wall-clock scheduling.'},
]);

function workflowDOM(doc) {
  const el=(tag,className,text)=>{const node=doc.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;};
  const glyph=name=>{const parsed=new doc.defaultView.DOMParser().parseFromString(icon(name),'image/svg+xml');return doc.importNode(parsed.documentElement,true);};
  const button=(text,name,variant)=>{const node=el('button','tblu-button');node.type='button';if(name)node.append(glyph(name));node.append(doc.createTextNode(text));if(variant)node.dataset.tbluVariant=variant;return node;};
  return {el,glyph,button};
}

/** Form controller with IME-safe shortcut, async busy/error and non-destructive drafts. */
export function mountMessageComposer(form,{textarea=form.querySelector('textarea'),sendButton=form.querySelector('[type=submit]'),getAttachments=()=>[],onSend,onReset,onDraftChange,onError}={}) {
  if(!textarea||!sendButton||typeof onSend!=='function')throw new TypeError('Composer requires a textarea, submit button and onSend callback');
  let busy=false,destroyed=false;const listeners=[];
  const listen=(node,type,handler)=>{node.addEventListener(type,handler);listeners.push(()=>node.removeEventListener(type,handler));};
  const snapshot=()=>({text:textarea.value,attachments:[...getAttachments()]});
  const refresh=()=>{if(destroyed)return;sendButton.disabled=busy||(!textarea.value.trim()&&!getAttachments().length);form.setAttribute('aria-busy',String(busy));onDraftChange?.(snapshot());};
  const report=error=>{if(onError)onError(error);else form.dispatchEvent(new form.ownerDocument.defaultView.CustomEvent('tblu-error',{bubbles:true,composed:true,detail:{error,source:'message-composer'}}));};
  const submit=async()=>{
    if(destroyed||busy)return false;const draft=snapshot();if(!draft.text.trim()&&!draft.attachments.length)return false;
    busy=true;refresh();
    try{await onSend({...draft,text:draft.text.trim()});if(destroyed)return true;
      const current=snapshot(),sameAttachments=current.attachments.length===draft.attachments.length&&current.attachments.every((item,index)=>item===draft.attachments[index]);
      if(current.text===draft.text)textarea.value='';if(sameAttachments)onReset?.({sent:true});refresh();return true;
    }catch(error){if(!destroyed)report(error);return false;}
    finally{busy=false;refresh();}
  };
  listen(form,'submit',event=>{event.preventDefault();void submit();});listen(form,'change',refresh);listen(textarea,'input',refresh);
  listen(textarea,'keydown',event=>{if(!event.isComposing&&(event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();form.requestSubmit();}});
  refresh();return {refresh,submit,get draft(){return snapshot();},clear(){if(destroyed)return;textarea.value='';onReset?.({sent:false});refresh();},destroy(){if(destroyed)return;destroyed=true;listeners.forEach(remove=>remove());form.removeAttribute('aria-busy');}};
}

/** A local countdown controller with monotonic time and released intervals. */
export function mountCountdown(host,{seconds=10,notify=()=>{}}={}) {
  if(!Number.isInteger(seconds)||seconds<1||seconds>300)throw new RangeError('Countdown duration must be 1–300 seconds');
  const doc=host.ownerDocument,view=doc.defaultView,{el,glyph,button}=workflowDOM(doc),id=`tblu-countdown-${++nextWorkflow}`;
  const root=el('div','tblu-stack'),label=el('label','tblu-field'),input=el('input');input.type='number';input.min='1';input.max='300';input.step='1';input.value=String(seconds);input.id=id;label.append(el('span','','Duration in seconds'),input);
  const output=el('output','tblu-countdown'),status=el('p','tblu-muted','Ready'),toggle=button('Start','Play','primary'),reset=button('Reset','RefreshCw','quiet'),actions=el('div','tblu-cluster');output.setAttribute('aria-label','Remaining duration');status.setAttribute('role','status');actions.append(toggle,reset);root.append(label,output,actions,status);host.append(root);
  let left=seconds*1000,started=0,running=false,timer,destroyed=false;const now=()=>view.performance?.now()??Date.now();
  const display=amount=>{const count=Math.ceil(Math.max(0,amount)/1000);output.value=output.textContent=`${String(Math.floor(count/60)).padStart(2,'0')}:${String(count%60).padStart(2,'0')}`;};
  const pause=()=>{if(running)left=Math.max(0,left-(now()-started));running=false;if(timer!==undefined)view.clearInterval(timer);timer=undefined;input.disabled=false;toggle.replaceChildren(glyph('Play'),doc.createTextNode(left>0?'Resume':'Start again'));display(left);};
  const start=()=>{
    if(destroyed||running)return;const value=Number(input.value);if(!Number.isInteger(value)||value<1||value>300){notify('Choose a duration of 1–300 seconds.');return;}
    if(left<=0||status.textContent==='Ready')left=value*1000;started=now();running=true;input.disabled=true;toggle.replaceChildren(glyph('Pause'),doc.createTextNode('Pause'));status.textContent='Running';
    timer=view.setInterval(()=>{const remaining=Math.max(0,left-(now()-started));display(remaining);if(remaining===0){pause();left=0;status.textContent='Countdown complete';notify('Local countdown completed.');}},200);
  };
  const onToggle=()=>{if(running){pause();status.textContent='Paused';}else start();};
  const onReset=()=>{pause();left=Math.max(1,Math.min(300,Number(input.value)||seconds))*1000;display(left);status.textContent='Ready';toggle.replaceChildren(glyph('Play'),doc.createTextNode('Start'));};
  toggle.addEventListener('click',onToggle);reset.addEventListener('click',onReset);display(left);
  return {element:root,start,pause,reset:onReset,get remaining(){return Math.max(0,running?left-(now()-started):left);},destroy(){if(destroyed)return;destroyed=true;pause();toggle.removeEventListener('click',onToggle);reset.removeEventListener('click',onReset);root.remove();}};
}

/** Direct-drag, keyboard and button controls share one immutable reorder operation. */
export function mountKanban(host,{columns:laneNames=columns,items=[],onChange,notify=()=>{}}={}) {
  if(!Array.isArray(laneNames)||!laneNames.length||laneNames.some(name=>typeof name!=='string'||!name)||new Set(laneNames).size!==laneNames.length)throw new TypeError('Kanban columns must have unique names');
  const doc=host.ownerDocument,{el,button}=workflowDOM(doc),root=el('div','tblu-stack'),area=el('div','tblu-kanban'),status=el('p','tblu-muted');status.setAttribute('role','status');root.append(area,status);host.append(root);let state=[],dragging='',destroyed=false;
  const validate=value=>{if(!Array.isArray(value)||value.some(item=>typeof item.id!=='string'||!item.id||typeof item.title!=='string'||!laneNames.includes(item.column))||new Set(value.map(item=>item.id)).size!==value.length)throw new TypeError('Invalid Kanban items');return value.map(item=>({...item}));};
  const render=()=>{if(destroyed)return;area.replaceChildren();for(const column of laneNames){const lane=el('section','tblu-kanban-column');lane.dataset.kanbanColumn=column;lane.setAttribute('aria-label',column);lane.append(el('h4','tblu-heading',column));const peers=state.filter(item=>item.column===column);peers.forEach((task,position)=>{const card=el('article','tblu-card tblu-kanban-task tblu-stack');card.dataset.taskId=task.id;card.draggable=true;card.tabIndex=0;card.setAttribute('aria-label',`${task.title}. ${column}. Alt with arrow keys moves this card.`);card.append(el('strong','',task.title));const controls=el('div','tblu-cluster');for(const [direction,label,glyph] of [['left','Move left','ChevronLeft'],['up','Move up','ArrowUp'],['down','Move down','ChevronDown'],['right','Move right','ChevronRight']]){const action=button(label,glyph,'quiet');action.dataset.taskMove=direction;action.dataset.tbluSize='sm';action.setAttribute('aria-label',`${label}: ${task.title}`);action.disabled=direction==='left'&&column===laneNames[0]||direction==='right'&&column===laneNames.at(-1)||direction==='up'&&position===0||direction==='down'&&position===peers.length-1;controls.append(action);}card.append(controls);lane.append(card);});area.append(lane);}};
  const move=(id,column,index)=>{if(destroyed||!state.some(item=>item.id===id))return;state=moveKanbanTask(state,id,column,index,laneNames);render();const item=state.find(item=>item.id===id);status.textContent=`Moved ${item.title} to ${column}, position ${state.filter(item=>item.column===column).findIndex(item=>item.id===id)+1}.`;[...area.querySelectorAll('[data-task-id]')].find(node=>node.dataset.taskId===id)?.focus();try{Promise.resolve(onChange?.(state.map(item=>({...item})))).catch(error=>notify(error.message));}catch(error){notify(error.message);}};
  const direction=(id,action)=>{const item=state.find(item=>item.id===id);if(!item)return;const column=laneNames.indexOf(item.column),peers=state.filter(peer=>peer.column===item.column),index=peers.findIndex(peer=>peer.id===id);if(action==='left'&&column>0)move(id,laneNames[column-1]);else if(action==='right'&&column<laneNames.length-1)move(id,laneNames[column+1]);else if(action==='up'&&index>0)move(id,item.column,index-1);else if(action==='down'&&index<peers.length-1)move(id,item.column,index+1);};
  const listeners=[],listen=(type,handler)=>{area.addEventListener(type,handler);listeners.push(()=>area.removeEventListener(type,handler));};
  listen('click',event=>{const action=event.target.closest('[data-task-move]');if(action)direction(action.closest('[data-task-id]').dataset.taskId,action.dataset.taskMove);});
  listen('keydown',event=>{const item=event.target.closest('[data-task-id]');if(item&&event.altKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();direction(item.dataset.taskId,event.key.slice(5).toLowerCase());}});
  listen('dragstart',event=>{const item=event.target.closest('[data-task-id]');if(!item||event.target.closest('button,input,textarea,select')){event.preventDefault();return;}dragging=item.dataset.taskId;event.dataTransfer?.setData('text/plain',dragging);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';item.dataset.dragging='true';});
  listen('dragover',event=>{if(dragging&&event.target.closest('[data-kanban-column]'))event.preventDefault();});
  listen('drop',event=>{const lane=event.target.closest('[data-kanban-column]');if(!dragging||!lane)return;event.preventDefault();const target=event.target.closest('[data-task-id]'),peers=state.filter(item=>item.column===lane.dataset.kanbanColumn&&item.id!==dragging),index=target?peers.findIndex(item=>item.id===target.dataset.taskId):peers.length;move(dragging,lane.dataset.kanbanColumn,index<0?peers.length:index);dragging='';});
  listen('dragend',()=>{dragging='';area.querySelectorAll('[data-dragging]').forEach(node=>delete node.dataset.dragging);});
  state=validate(items);render();return {element:root,setItems(value){if(destroyed)throw new Error('Kanban was destroyed');state=validate(value);render();},get items(){return state.map(item=>({...item}));},move,destroy(){if(destroyed)return;destroyed=true;listeners.forEach(remove=>remove());root.remove();}};
}

/** Local examples: host applications still own persistence, delivery and permissions. */
export function renderWorkflowExamples(host,{notify} = {}) {
  if(!host?.ownerDocument)throw new TypeError('Workflow examples require an Element');
  const doc=host.ownerDocument,view=doc.defaultView,prefix=`tblu-workflow-${++nextWorkflow}`;
  const root=doc.createElement('div');root.className='tblu-grid tblu-workflow-examples';host.append(root);
  const removers=[],timeouts=new Set(),dialogs=new Set(),urls=new Set(),controllers=[];let destroyed=false;
  const {el,glyph,button}=workflowDOM(doc);
  const listen=(node,type,handler)=>{node.addEventListener(type,handler);removers.push(()=>node.removeEventListener(type,handler));};
  const card=(title,description,ids)=>{const node=el('article','tblu-card tblu-pattern-card tblu-stack');node.dataset.componentIds=ids;node.append(el('h3','tblu-heading',title),el('p','tblu-muted',description));root.append(node);return node;};
  const field=(label,type,name,value='')=>{const wrap=el('label','tblu-field'),input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.id=`${prefix}-${name}`;input.name=name;input.value=value;wrap.append(el('span','',label),input);return {wrap,input};};
  const notice=message=>{if(destroyed)return;if(notify)notify(message);else{const toast=showToast({message,root:host.closest('.tblu-root')||doc});dialogs.add(toast);}};
  const defer=(fn,delay)=>{const timer=view.setTimeout(()=>{timeouts.delete(timer);if(!destroyed)fn();},delay);timeouts.add(timer);};
  const modal=options=>{const api=openDialog({root:host.closest('.tblu-root')||doc,...options});dialogs.add(api);return api;};

  // Messaging: a real local composer, not an implied delivery backend.
  const chat=card('Conversation and composer','Local demo only. Replies are simulated in this component; no messages or files are uploaded.','100,101,102,104');
  const people=el('div','tblu-cluster tblu-presence-group');people.setAttribute('aria-label','Example collaborators');
  const availability=field('Show me as available','checkbox','available');availability.input.checked=true;
  const me=el('span','tblu-avatar','Y');me.setAttribute('role','img');
  const setPresence=()=>{me.dataset.status=availability.input.checked?'success':'info';me.setAttribute('aria-label',`You: ${availability.input.checked?'available':'away'} (local status)`);};setPresence();
  people.append(me);for(const [name,initial,status] of [['Ari','A','success'],['Ben','B','info']]){const avatar=el('span','tblu-avatar',initial);avatar.dataset.status=status;avatar.setAttribute('role','img');avatar.setAttribute('aria-label',`${name}: ${status==='success'?'available':'away'}`);people.append(avatar);}
  listen(availability.input,'change',setPresence);chat.append(people,availability.wrap);
  const feed=el('div','tblu-chat-feed tblu-scroll');feed.setAttribute('role','log');feed.setAttribute('aria-label','Local conversation');feed.setAttribute('aria-live','polite');feed.setAttribute('aria-relevant','additions text');
  const empty=el('p','tblu-empty','No messages yet. Write a message or attach a file below.');feed.append(empty);
  const follow=field('Follow new messages','checkbox','follow');follow.input.checked=true;
  const composer=el('form','tblu-stack tblu-composer'),draft=field('Message','textarea','message');draft.input.rows=3;draft.input.maxLength=2000;draft.input.placeholder='Write a message. Ctrl/⌘ + Enter sends; Enter starts a new line.';
  const attachment=field('Attachments (up to four, 5 MB each)','file','attachments');attachment.input.multiple=true;
  const previews=el('ul','tblu-list tblu-attachment-list'),draftState=el('p','tblu-muted','Draft stays in this example until you send or clear it.');
  const send=button('Send','Send','primary'),clearChat=button('Clear conversation','Trash2','quiet'),clearDraft=button('Clear draft','X','quiet');send.type='submit';send.disabled=true;
  const composerActions=el('div','tblu-cluster');composerActions.append(send,clearDraft,clearChat);composer.append(draft.wrap,attachment.wrap,previews,draftState,composerActions);chat.append(feed,follow.wrap,composer);
  let pendingFiles=[],messageCount=0,composerAPI;
  const canSend=()=>composerAPI?.refresh();
  const filePreview=(item,container)=>{const name=el('span','',`${item.file.name} (${Math.ceil(item.file.size/1024)} KB)`);container.append(name);if(item.url){const image=el('img','tblu-attachment-preview');image.src=item.url;image.alt=`Preview of ${item.file.name}`;container.append(image);}};
  const renderFiles=()=>{previews.replaceChildren();pendingFiles.forEach((item,index)=>{const li=el('li','tblu-cluster');filePreview(item,li);const remove=button('Remove',null,'quiet');remove.dataset.removeAttachment=String(index);remove.setAttribute('aria-label',`Remove ${item.file.name}`);li.append(remove);previews.append(li);});canSend();};
  const appendMessage=(author,text,files=[],outgoing=false)=>{
    empty.remove();const bubble=el('article','tblu-message');bubble.dataset.direction=outgoing?'outgoing':'incoming';
    const header=el('header','tblu-cluster'),time=el('time','tblu-muted',new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));time.dateTime=new Date().toISOString();header.append(el('strong','',author),time);
    const body=el('p','tblu-message-text',text);bubble.append(header,body);if(files.length){const list=el('ul','tblu-list');for(const item of files){const li=el('li');filePreview(item,li);list.append(li);}bubble.append(list);}feed.append(bubble);messageCount++;
    if(messageCount>50){feed.firstElementChild?.remove();messageCount--;}
    if(follow.input.checked)feed.scrollTop=feed.scrollHeight;
  };
  listen(attachment.input,'change',()=>{
    const files=[...attachment.input.files||[]];attachment.input.value='';
    if(files.some(file=>file.size>5*1024*1024)||pendingFiles.length+files.length>4){notice('Choose up to four files, each no larger than 5 MB.');return;}
    for(const file of files){let url='';if(['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)&&view.URL?.createObjectURL){url=view.URL.createObjectURL(file);urls.add(url);}pendingFiles.push({file,url});}renderFiles();
  });
  listen(previews,'click',event=>{const target=event.target.closest('[data-remove-attachment]');if(!target)return;const [removed]=pendingFiles.splice(Number(target.dataset.removeAttachment),1);if(removed?.url){view.URL.revokeObjectURL(removed.url);urls.delete(removed.url);}renderFiles();});
  listen(clearDraft,'click',()=>{composerAPI.clear();draft.input.focus();});
  listen(clearChat,'click',()=>{for(const timer of timeouts)view.clearTimeout(timer);timeouts.clear();feed.replaceChildren(empty);messageCount=0;notice('Local conversation cleared.');});
  composerAPI=mountMessageComposer(composer,{textarea:draft.input,sendButton:send,getAttachments:()=>pendingFiles,
    onDraftChange:({text,attachments})=>{draftState.textContent=text||attachments.length?'Draft kept locally in this component.':'Draft is empty.';},
    onReset:({sent})=>{if(!sent)for(const item of pendingFiles)if(item.url){view.URL.revokeObjectURL(item.url);urls.delete(item.url);}pendingFiles=[];renderFiles();},
    onError:error=>notice(error.message),onSend:({text,attachments})=>{appendMessage('You',text||'Attachment',attachments,true);draft.input.focus();defer(()=>appendMessage('Demo assistant · simulated','Local simulated reply: your message was added to this example. No server was contacted.'),650);},
  });controllers.push(composerAPI);

  const thread=card('Comment thread and reactions','An editable local discussion with replies, a persistent reaction, and resolution state.','103');
  const threadStatus=el('span','tblu-status','Open');threadStatus.dataset.status='info';const threadBody=el('div','tblu-stack');threadBody.append(el('p','','Ari: The selection toolbar now follows the shared size and focus rules.'));
  const reaction=button('Helpful · 2','Heart','quiet');reaction.setAttribute('aria-pressed','false');const resolve=button('Resolve thread','Check','quiet');
  const replyForm=el('form','tblu-stack'),reply=field('Reply','textarea','reply');reply.input.rows=2;reply.input.maxLength=600;reply.input.required=true;const postReply=button('Add reply','Send');postReply.type='submit';replyForm.append(reply.wrap,postReply);
  const threadActions=el('div','tblu-cluster');threadActions.append(reaction,resolve);thread.append(threadStatus,threadBody,threadActions,replyForm);
  listen(reaction,'click',()=>{const pressed=reaction.getAttribute('aria-pressed')!=='true';reaction.setAttribute('aria-pressed',String(pressed));reaction.replaceChildren(glyph('Heart'),doc.createTextNode(`Helpful · ${pressed?3:2}`));});
  listen(resolve,'click',()=>{const resolved=replyForm.hidden=!replyForm.hidden;threadStatus.textContent=resolved?'Resolved':'Open';threadStatus.dataset.status=resolved?'success':'info';resolve.replaceChildren(glyph('Check'),doc.createTextNode(resolved?'Reopen thread':'Resolve thread'));});
  listen(replyForm,'submit',event=>{event.preventDefault();const text=reply.input.value.trim();if(!text)return;threadBody.append(el('p','',`You: ${text}`));reply.input.value='';notice('Reply added locally.');});

  const history=card('Timeline and activity','Chronological local events can be filtered and extended without changing their original order.','97,98,56');
  const activityFilter=field('Activity type','select','activity-filter');const select=doc.createElement('select');select.id=activityFilter.input.id;for(const [value,label] of [['all','All activity'],['update','Updates'],['review','Reviews']]){const option=el('option','',label);option.value=value;select.append(option);}activityFilter.input.replaceWith(select);
  const activityList=el('ol','tblu-list tblu-timeline');let activity=[{kind:'update',text:'Workspace created',at:new Date(Date.now()-7200000)},{kind:'review',text:'Design review completed',at:new Date(Date.now()-1800000)}];
  const renderActivity=()=>{activityList.replaceChildren();for(const item of activity.filter(item=>select.value==='all'||item.kind===select.value)){const li=el('li','tblu-timeline-item');const time=el('time','tblu-muted',item.at.toLocaleString());time.dateTime=item.at.toISOString();li.append(el('strong','',item.text),time);activityList.append(li);}if(!activityList.children.length)activityList.append(el('li','tblu-empty','No matching activity.'));};select.value='all';renderActivity();
  const addActivity=button('Add local activity','Plus');listen(addActivity,'click',()=>{activity.push({kind:'update',text:'Local note added',at:new Date()});renderActivity();});listen(select,'change',renderActivity);history.append(activityFilter.wrap,addActivity,activityList);

  const wizard=card('Stepper and setup wizard','Three validated steps. This creates a local example only, with no account or workspace API.','95,96');
  const steps=el('ol','tblu-stepper'),wizardForm=el('form','tblu-stack'),name=field('Workspace name','text','workspace'),email=field('Contact email','email','email'),accept=field('I understand this is a local demo','checkbox','accept');
  name.input.maxLength=80;email.input.maxLength=254;const panels=[el('div','tblu-stack'),el('div','tblu-stack'),el('div','tblu-stack')],review=el('dl','tblu-description');panels[0].append(name.wrap);panels[1].append(email.wrap,accept.wrap);panels[2].append(review);
  const wizardError=el('p','tblu-alert');wizardError.dataset.status='danger';wizardError.setAttribute('role','alert');wizardError.hidden=true;wizardError.id=`${prefix}-wizard-error`;
  for(const input of [name.input,email.input,accept.input])input.setAttribute('aria-describedby',wizardError.id);
  const back=button('Back','ChevronLeft','quiet'),next=button('Next','ChevronRight','primary'),resetWizard=button('Start again','RefreshCw','quiet');next.type='submit';const wizardActions=el('div','tblu-cluster');wizardActions.append(back,next,resetWizard);wizardForm.append(...panels,wizardError,wizardActions);wizard.append(steps,wizardForm);
  let step=0,finished=false;const values=()=>({name:name.input.value,email:email.input.value,accept:accept.input.checked});
  const renderWizard=()=>{
    steps.replaceChildren();['Name','Contact','Review'].forEach((label,index)=>{const li=el('li','tblu-step',`${index+1}. ${label}`);li.dataset.state=finished||index<step?'complete':index===step?'current':'pending';if(index===step&&!finished)li.setAttribute('aria-current','step');steps.append(li);});
    panels.forEach((panel,index)=>{panel.hidden=index!==step||finished;for(const input of panel.querySelectorAll('input'))input.disabled=index!==step||finished;});
    review.replaceChildren();for(const [term,value] of [['Workspace',name.input.value],['Contact',email.input.value]])review.append(el('dt','',term),el('dd','',value));
    back.disabled=step===0||finished;next.hidden=finished;resetWizard.hidden=!finished;next.replaceChildren(glyph(step===2?'Check':'ChevronRight'),doc.createTextNode(step===2?'Finish local setup':'Next'));
  };renderWizard();
  listen(back,'click',()=>{if(step>0){step--;wizardError.hidden=true;renderWizard();(step===0?name.input:email.input).focus();}});
  listen(resetWizard,'click',()=>{wizardForm.reset();finished=false;step=0;wizardError.hidden=true;renderWizard();name.input.focus();});
  listen(wizardForm,'submit',event=>{
    event.preventDefault();const error=validateWizard({...values(),...(step===0?{email:'demo@example.com',accept:true}:{})});
    if(error){wizardError.textContent=error.message;wizardError.hidden=false;const input={name:name.input,email:email.input,accept:accept.input}[error.field];input.setAttribute('aria-invalid','true');input.focus();return;}
    wizardError.hidden=true;for(const input of [name.input,email.input,accept.input])input.removeAttribute('aria-invalid');
    if(step<2){step++;renderWizard();(step===1?email.input:next).focus();}else{finished=true;renderWizard();notice('Local setup completed. No account was created.');resetWizard.focus();}
  });

  const board=card('Kanban board','Drag a card directly. Alt + arrows or its move buttons provide the same reorder operation.','99,59');
  const boardAPI=mountKanban(board,{items:[{id:prefix+'-task-1',title:'Write component contract',column:'Backlog'},{id:prefix+'-task-2',title:'Verify keyboard navigation',column:'Backlog'},{id:prefix+'-task-3',title:'Review focus states',column:'In progress'},{id:prefix+'-task-4',title:'Publish local example',column:'Done'}],notify:notice});controllers.push(boardAPI);
  const addTask=button('Add task','Plus');listen(addTask,'click',()=>{const title=field('Task title','text','new-task-'+boardAPI.items.length);title.input.maxLength=120;modal({title:'Add local task',content:title.wrap,initialFocus:title.input,actions:[{label:'Cancel'},{label:'Add',variant:'primary',onSelect:()=>{const value=title.input.value.trim();if(!value)throw new Error('Enter a task title.');const items=boardAPI.items;boardAPI.setItems([...items,{id:prefix+'-task-'+Date.now()+'-'+items.length,title:value,column:'Backlog'}]);notice('Task added locally.');}}]});});board.append(addTask);

  const agenda=card('Local agenda and event entry','Date and time controls use native form sources. This local agenda has no recurrence, resources, timezone conversion or remote calendar.','49,52,58');
  const current=new Date(),today=`${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
  const agendaDay=field('Agenda day','date','agenda-day',today),agendaList=el('ul','tblu-list tblu-agenda');let events=[{id:1,title:'Design review',date:today,time:'09:00',duration:45},{id:2,title:'Team check-in',date:today,time:'14:30',duration:30}],nextEvent=3;
  const renderAgenda=()=>{agendaList.replaceChildren();for(const event of events.filter(event=>event.date===agendaDay.input.value).sort((a,b)=>a.time.localeCompare(b.time))){const li=el('li','tblu-cluster'),body=el('div','tblu-stack');body.append(el('strong','',event.title),el('span','tblu-muted',`${event.time} · ${event.duration} minutes · local time`));const remove=button('Delete',null,'quiet');remove.dataset.deleteEvent=String(event.id);remove.setAttribute('aria-label',`Delete event: ${event.title}`);li.append(body,remove);agendaList.append(li);}if(!agendaList.children.length)agendaList.append(el('li','tblu-empty','No events on this date.'));};
  const eventForm=el('form','tblu-stack'),eventTitle=field('Event title','text','event-title'),eventDate=field('Date','date','event-date',today),eventTime=field('Start time','time','event-time','10:00'),eventDuration=field('Duration in minutes','number','event-duration','30');eventTitle.input.required=true;eventTitle.input.maxLength=120;eventDate.input.required=true;eventTime.input.required=true;eventDuration.input.min='5';eventDuration.input.max='480';eventDuration.input.step='5';eventDuration.input.required=true;
  const addEvent=button('Add local event','Calendar','primary');addEvent.type='submit';const eventError=el('p','tblu-alert');eventError.dataset.status='danger';eventError.setAttribute('role','alert');eventError.hidden=true;eventForm.append(eventTitle.wrap,eventDate.wrap,eventTime.wrap,eventDuration.wrap,eventError,addEvent);agenda.append(agendaDay.wrap,agendaList,eventForm);
  listen(agendaDay.input,'change',renderAgenda);listen(eventForm,'submit',event=>{event.preventDefault();try{const value=normalizeAgendaEvent({title:eventTitle.input.value,date:eventDate.input.value,time:eventTime.input.value,duration:eventDuration.input.value});events.push({...value,id:nextEvent++});agendaDay.input.value=value.date;eventTitle.input.value='';eventError.hidden=true;renderAgenda();notice('Event added to the local agenda.');}catch(error){eventError.textContent=error.message;eventError.hidden=false;}});
  listen(agendaList,'click',event=>{const target=event.target.closest('[data-delete-event]');if(!target)return;const id=Number(target.dataset.deleteEvent),entry=events.find(item=>item.id===id);modal({title:'Delete local event?',content:el('p','',entry.title),actions:[{label:'Cancel'},{label:'Delete',variant:'danger',onSelect:()=>{events=events.filter(item=>item.id!==id);renderAgenda();notice('Local event deleted.');}}]});});renderAgenda();

  const timerCard=card('Duration and countdown','A monotonic local countdown with pause and reset. Remaining time is not a date or wall-clock value.','57');
  controllers.push(mountCountdown(timerCard,{notify:notice}));

  return {element:root,destroy(){if(destroyed)return;destroyed=true;removers.forEach(remove=>remove());for(const timer of timeouts)view.clearTimeout(timer);timeouts.clear();for(const controller of controllers)controller.destroy();for(const api of dialogs)api.destroy();dialogs.clear();for(const url of urls)view.URL.revokeObjectURL(url);urls.clear();root.remove();}};
}
