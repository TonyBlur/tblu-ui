import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTokens,stepQuantity,passwordIndicators,formatPhoneDigits,isoWeekPeriod,zonedDateTimeCandidates,mountFormValidation} from '../src/patterns-forms.js';
import {paginationState,searchCommands} from '../src/patterns-navigation.js';
import {evaluateQuery,fileAcceptance,mountCollection,validateFileTree} from '../src/patterns-collections.js';
import {moveKanbanTask,validateWizard,normalizeAgendaEvent,mountMessageComposer} from '../src/patterns-workflow.js';
import {normalizeChartData,chartGeometry,createIntegrationSlot} from '../src/patterns-content.js';

test('selection and structured entry preserve values and honor quantity bounds',()=>{
  assert.deepEqual(normalizeTokens([' Design ','design','Research','','Research']),['Design','Research']);
  assert.equal(stepQuantity('0.2',1,{min:0,max:1,step:.1}),.3);
  assert.equal(stepQuantity(1,1,{min:0,max:1,step:.1}),1);
  assert.equal(stepQuantity(0,-1,{min:0,max:1,step:.1}),0);
  assert.equal(passwordIndicators('aA1!').longEnough,false);
  assert.deepEqual(formatPhoneDigits('(415) 555-0123'),{raw:'4155550123',formatted:'(415) 555-0123'});
});
test('ISO week boundaries and explicit timezone conversion handle DST gaps and overlap',()=>{
  assert.deepEqual(isoWeekPeriod(2020,53),{value:'2020-W53',start:'2020-12-28',end:'2021-01-03'});
  assert.equal(isoWeekPeriod(2021,53),null);
  assert.deepEqual(zonedDateTimeCandidates('2026-03-08','02:30','America/New_York'),[]);
  assert.deepEqual(zonedDateTimeCandidates('2026-11-01','01:30','America/New_York'),['2026-11-01T05:30:00.000Z','2026-11-01T06:30:00.000Z']);
  assert.deepEqual(zonedDateTimeCandidates('2026-10-15','09:30','Asia/Shanghai'),['2026-10-15T01:30:00.000Z']);
});
test('pagination clamps pages and supports explicitly unknown totals; command search folds accents',()=>{
  assert.equal(paginationState({total:11,page:9,pageSize:5}).page,3);
  assert.equal(paginationState({total:0}).end,0);
  assert.equal(paginationState({total:null,page:3,hasNext:true}).hasNext,true);
  assert.throws(()=>paginationState({pageSize:0}),TypeError);
  assert.equal(searchCommands([{label:'Réviser le résumé',group:'Review'}],'resume review').length,1);
});
test('typed filters and file acceptance never evaluate code or silently accept unknown operators',()=>{
  assert.equal(evaluateQuery({name:'Design',count:12},{operator:'and',rules:[{field:'name',operator:'contains',value:'sign'},{field:'count',operator:'greater',value:10}]}),true);
  assert.throws(()=>evaluateQuery({}, {operator:'run',rules:[]}),RangeError);
  assert.throws(()=>evaluateQuery({}, {field:'name',operator:'eval',value:'alert(1)'}),RangeError);
  assert.equal(fileAcceptance({name:'PHOTO.PNG',size:50,type:'image/png'},{accept:'.png'}),null);
  assert.equal(fileAcceptance({name:'photo',size:50,type:'image/png'},{accept:'image/*'}),null);
  assert.ok(fileAcceptance({name:'script.exe',size:50,type:''},{accept:'image/*'}));
  assert.ok(fileAcceptance({name:'image.png',size:200,type:'image/png'},{maxBytes:100}));
});
test('collection updates retain original order, stable selection and explicit sort reset',()=>{
  const host=new EventTarget();host.ownerDocument={defaultView:{CustomEvent}};
  const items=[{id:'b',name:'Beta'},{id:'a',name:'Alpha'},{id:'c',name:'Gamma'}];
  const api=mountCollection(host,{items});api.select('a');api.setItems(items.map(item=>({...item,tags:['new']})));
  assert.deepEqual(api.getState().items.map(item=>item.id),['b','a','c']);
  assert.ok(api.getState().selected.has('a'));api.setSort('name');assert.deepEqual(api.getState().items.map(item=>item.id),['a','b','c']);
  api.setSort(null);assert.deepEqual(api.getState().items.map(item=>item.id),['b','a','c']);
  api.move('c',0);assert.deepEqual(api.getState().items.map(item=>item.id),['c','b','a']);
  assert.deepEqual(items.map(item=>item.id),['b','a','c']);api.destroy();
});
test('file explorer rejects cycles, duplicate identities and files used as parents',()=>{
  assert.throws(()=>validateFileTree([{id:'a',name:'A',type:'folder',parent:'b'},{id:'b',name:'B',type:'folder',parent:'a'}]),TypeError);
  assert.throws(()=>validateFileTree([{id:'a',name:'A',type:'file'},{id:'b',name:'B',type:'file',parent:'a'}]),TypeError);
  assert.throws(()=>validateFileTree([{id:'a',name:'A',type:'file'},{id:'a',name:'B',type:'file'}]),TypeError);
  assert.equal(validateFileTree([{id:'a',name:'A',type:'folder'},{id:'b',name:'B',type:'file',parent:'a'}]).length,2);
});
test('kanban movements preserve unrelated items and wizard/agenda validate their distinct contracts',()=>{
  const tasks=[{id:'a',column:'Backlog'},{id:'b',column:'Backlog'},{id:'c',column:'Done'}];
  const moved=moveKanbanTask(tasks,'a','Done',0);assert.deepEqual(moved.map(item=>item.id),['b','a','c']);assert.equal(tasks[0].column,'Backlog');
  assert.throws(()=>moveKanbanTask(tasks,'a','Missing'),RangeError);
  assert.equal(validateWizard({name:'Workspace',email:'a@example.com',accept:true}),null);
  assert.equal(validateWizard({name:'',email:'bad',accept:false}).field,'name');
  assert.throws(()=>normalizeAgendaEvent({title:'Review',date:'2026-02-30',time:'09:00',duration:30}));
  assert.equal(normalizeAgendaEvent({title:' Review ',date:'2026-10-15',time:'09:00',duration:'30'}).title,'Review');
});
class FakeNode extends EventTarget {
  attributes=new Map();children=[];value='';disabled=false;isConnected=true;
  constructor(doc){super();this.ownerDocument=doc;}
  setAttribute(key,value){this.attributes.set(key,String(value));}removeAttribute(key){this.attributes.delete(key);}getAttribute(key){return this.attributes.get(key)??null;}
  append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);this.isConnected=false;}
}
const fakeDocument=()=>{const doc={defaultView:{CustomEvent},createElement:()=>new FakeNode(doc)};return doc;};
test('form validation includes unnamed native fields while excluding duplicate visual adapters',()=>{
  const doc=fakeDocument();doc.defaultView.FormData=class{*[Symbol.iterator](){}};
  const form=new FakeNode(doc),field=new FakeNode(doc),adapter=new FakeNode(doc);field.name='';field.willValidate=true;field.validity={valid:false};field.validationMessage='This field is required';field.hasAttribute=key=>field.attributes.has(key);adapter.hasAttribute=key=>key==='data-tblu-adapter';adapter.validity={valid:false};form.elements=[field,adapter];
  const api=mountFormValidation(form);assert.equal(api.validate(),false);field.validity.valid=true;assert.equal(api.validate(),true);api.destroy();
});
test('composer preserves a newer draft during async send and keeps failed drafts available',async()=>{
  const doc=fakeDocument(),form=new FakeNode(doc),textarea=new FakeNode(doc),sendButton=new FakeNode(doc);let resolve,error;
  textarea.value='First draft';
  const api=mountMessageComposer(form,{textarea,sendButton,onSend:()=>new Promise(done=>resolve=done),onError:value=>error=value});
  const sending=api.submit();assert.equal(sendButton.disabled,true);textarea.value='New draft while sending';resolve();await sending;
  assert.equal(textarea.value,'New draft while sending');assert.equal(sendButton.disabled,false);api.destroy();
  const failed=mountMessageComposer(form,{textarea,sendButton,onSend:()=>Promise.reject(new Error('Offline')),onError:value=>error=value});
  assert.equal(await failed.submit(),false);assert.equal(error.message,'Offline');assert.equal(textarea.value,'New draft while sending');failed.destroy();
});
test('chart geometry represents missing values as gaps and rejects inconsistent series',()=>{
  const data={labels:['A','B','C'],series:[{id:'a',values:[2,null,-1]}]},geometry=chartGeometry(data);
  assert.equal(geometry.series[0].points.length,2);assert.equal((geometry.series[0].path.match(/M/g)||[]).length,2);
  assert.ok(geometry.series[0].bars.every(bar=>bar.height>=0));assert.equal(data.series[0].values[1],null);
  assert.throws(()=>normalizeChartData({labels:['A'],series:[{values:[Infinity]}]}),TypeError);
  assert.throws(()=>normalizeChartData({labels:['A'],series:[{id:'a',values:[1]},{id:'a',values:[2]}]}),TypeError);
});
test('specialist adapter releases stale async engines and destroys the current one once',async()=>{
  const doc=fakeDocument(),host=new FakeNode(doc),slot=createIntegrationSlot(host);let resolveOld,oldDestroyed=0,currentDestroyed=0;
  const older=slot.attach(()=>new Promise(resolve=>resolveOld=resolve));await Promise.resolve();
  const newer=slot.attach(()=>({destroy(){currentDestroyed++;}}));await newer;
  resolveOld({destroy(){oldDestroyed++;}});assert.equal(await older,false);assert.equal(oldDestroyed,1);
  await slot.destroy();assert.equal(currentDestroyed,1);assert.equal(host.children.length,0);
});
