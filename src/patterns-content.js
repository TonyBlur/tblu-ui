import {icon} from './icons.js';
import {openDialog,showToast} from './feedback.js';
import '@awesome.me/webawesome/dist/components/details/details.js';

let nextContent=0;
const svgNS='http://www.w3.org/2000/svg';
const textNode=(doc,value)=>doc.createTextNode(String(value));
export const contentCoverage=Object.freeze([
  {ids:[105,107,108,109],level:'primitive-or-pattern',limits:'Local metrics and small accessible SVG sparkline only.'},
  {ids:[106],level:'limited-component',limits:'Line/bar only; large-scale, brushing and professional plotting need an engine adapter.'},
  {ids:[110],level:'limited-component',limits:'Safe Markdown subset; no raw HTML or embedded media.'},
  {ids:[111,112],level:'primitive',limits:'Minimal formatting and JSON textarea only; professional editing requires an engine.'},
  {ids:[62],level:'integration-needed',limits:'Integration lifecycle provided; no professional data-grid engine bundled.'},
]);

export function normalizeChartData(value) {
  if(!Array.isArray(value?.labels)||!value.labels.length||value.labels.length>1000||value.labels.some(label=>typeof label!=='string'||label.length>100))throw new TypeError('Chart labels must contain 1–1000 short strings.');
  if(!Array.isArray(value.series)||!value.series.length||value.series.length>10)throw new TypeError('Charts require 1–10 series.');
  const ids=new Set();
  const series=value.series.map((item,index)=>{
    const id=String(item.id??index),name=String(item.name??id);if(!id||ids.has(id))throw new TypeError('Chart series IDs must be unique.');ids.add(id);
    if(!Array.isArray(item.values)||item.values.length!==value.labels.length||item.values.some(number=>number!==null&&!Number.isFinite(number)))throw new TypeError('Chart values must be finite numbers or null, matching the labels.');
    return {id,name,values:[...item.values]};
  });
  return {labels:[...value.labels],series};
}

/** Small SVG line/bar geometry. Missing values create gaps, never invented zeroes. */
export function chartGeometry(value,{width=600,height=220,visible}={}) {
  const data=normalizeChartData(value),shown=data.series.filter(series=>!visible||visible.includes(series.id));
  if(!Number.isFinite(width)||width<100||!Number.isFinite(height)||height<80)throw new RangeError('Chart dimensions are too small.');
  const values=shown.flatMap(series=>series.values.filter(Number.isFinite));
  const min=Math.min(0,...values),rawMax=Math.max(0,...values),max=rawMax===min?min+1:rawMax;
  const left=46,right=16,top=16,bottom=38,plotWidth=width-left-right,plotHeight=height-top-bottom;
  const y=value=>top+(max-value)/(max-min)*plotHeight,x=index=>data.labels.length===1?left+plotWidth/2:left+index/(data.labels.length-1)*plotWidth;
  const series=shown.map((item,seriesIndex)=>{
    let connected=false,path='';const points=[];
    item.values.forEach((value,index)=>{if(value===null){connected=false;return;}const point={index,value,x:x(index),y:y(value)};points.push(point);path+=`${connected?'L':'M'}${point.x.toFixed(2)},${point.y.toFixed(2)} `;connected=true;});
    const slot=plotWidth/data.labels.length,barWidth=Math.min(36,slot*.72/Math.max(1,shown.length));
    const bars=points.map(point=>({index:point.index,value:point.value,x:left+slot*(point.index+.5)+(seriesIndex-(shown.length-1)/2)*barWidth-barWidth/2,y:Math.min(y(0),point.y),width:barWidth*.88,height:Math.abs(point.y-y(0))}));
    return {...item,points,path:path.trim(),bars};
  });
  return {width,height,min,max,left,top,plotWidth,plotHeight,baseline:y(0),series};
}

function dom(doc) {
  const el=(tag,className,text)=>{const node=doc.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;};
  const svg=(tag,attributes={},text)=>{const node=doc.createElementNS(svgNS,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));if(text!==undefined)node.textContent=String(text);return node;};
  const glyph=name=>{const parsed=new doc.defaultView.DOMParser().parseFromString(icon(name),'image/svg+xml');return doc.importNode(parsed.documentElement,true);};
  const button=(label,name,variant)=>{const node=el('button','tblu-button');node.type='button';if(name)node.append(glyph(name));node.append(textNode(doc,label));if(variant)node.dataset.tbluVariant=variant;return node;};
  return {el,svg,glyph,button};
}

/** A real, deliberately bounded line/bar chart API with legend and data-table fallback. */
export function createMetricChart(host,{data,type='line',label='Metric chart'}={}) {
  if(!host?.ownerDocument)throw new TypeError('Chart requires an Element');
  if(!['line','bar'].includes(type))throw new TypeError('This SVG chart supports line and bar only.');
  const doc=host.ownerDocument,{el,svg}=dom(doc),id=`tblu-chart-${++nextContent}`;
  const root=el('div','tblu-stack tblu-metric-chart'),legend=el('div','tblu-cluster tblu-chart-legend'),plot=svg('svg',{viewBox:'0 0 600 220',role:'img','aria-labelledby':`${id}-title ${id}-description`});
  legend.setAttribute('aria-label','Toggle chart series');const status=el('p','tblu-muted');status.setAttribute('role','status');
  const disclosure=el('wa-details','tblu-chart-data tblu-details'),table=el('table','tblu-table');disclosure.summary='View chart data';disclosure.append(table);root.append(legend,plot,status,disclosure);host.append(root);
  let state=normalizeChartData(data),shown=new Set(state.series.map(series=>series.id)),destroyed=false;
  const render=()=>{
    if(destroyed)return;legend.replaceChildren();for(const series of state.series){const button=el('button','tblu-chip',series.name);button.type='button';button.dataset.chartSeries=series.id;button.setAttribute('aria-pressed',String(shown.has(series.id)));legend.append(button);}
    const geometry=chartGeometry(state,{visible:[...shown]});plot.replaceChildren(svg('title',{id:`${id}-title`},label),svg('desc',{id:`${id}-description`},`${type==='line'?'Line':'Bar'} chart. Visible series: ${state.series.filter(series=>shown.has(series.id)).map(series=>series.name).join(', ')||'none'}. Exact values are in the data table below.`));
    for(let row=0;row<5;row++){const value=geometry.min+(geometry.max-geometry.min)*row/4,y=geometry.top+geometry.plotHeight*(1-row/4);plot.append(svg('line',{x1:geometry.left,y1:y,x2:geometry.left+geometry.plotWidth,y2:y,class:'tblu-chart-gridline'}),svg('text',{x:geometry.left-7,y:y+4,'text-anchor':'end',class:'tblu-chart-axis'},Number(value.toFixed(2)).toLocaleString()));}
    const spacing=Math.max(1,Math.ceil(state.labels.length/6));state.labels.forEach((label,index)=>{if(index%spacing!==0&&index!==state.labels.length-1)return;const x=type==='bar'?geometry.left+geometry.plotWidth/state.labels.length*(index+.5):state.labels.length===1?geometry.left+geometry.plotWidth/2:geometry.left+index/(state.labels.length-1)*geometry.plotWidth;plot.append(svg('text',{x,y:geometry.top+geometry.plotHeight+23,'text-anchor':'middle',class:'tblu-chart-axis'},label));});
    for(const series of geometry.series){const seriesIndex=state.series.findIndex(item=>item.id===series.id),color=`var(--tblu-chart-series-${seriesIndex+1}, var(--tblu-color-accent))`;
      if(type==='line'){plot.append(svg('path',{d:series.path,fill:'none',stroke:color,'stroke-width':3,'stroke-dasharray':seriesIndex%2?'6 4':'none'}));for(const point of series.points){const mark=svg('circle',{cx:point.x,cy:point.y,r:4,fill:color});mark.append(svg('title',{},`${series.name}, ${state.labels[point.index]}: ${point.value}`));plot.append(mark);}}
      else for(const bar of series.bars){const rect=svg('rect',{x:bar.x,y:bar.y,width:bar.width,height:Math.max(0,bar.height),fill:color,rx:2});rect.append(svg('title',{},`${series.name}, ${state.labels[bar.index]}: ${bar.value}`));plot.append(rect);}
    }
    status.textContent=shown.size?'Legend buttons control visible series. The table retains all values.':'All series are hidden. Select a legend button to show data.';
    const caption=el('caption','',`${label}: exact values`),head=el('thead'),headRow=el('tr');headRow.append(el('th','','Period'));for(const series of state.series){const th=el('th','',series.name);th.scope='col';headRow.append(th);}headRow.firstElementChild.scope='col';head.append(headRow);const body=el('tbody');state.labels.forEach((label,index)=>{const row=el('tr'),name=el('th','',label);name.scope='row';row.append(name);for(const series of state.series)row.append(el('td','',series.values[index]===null?'Not available':series.values[index].toLocaleString()));body.append(row);});table.replaceChildren(caption,head,body);
  };
  const toggle=event=>{const button=event.target.closest('[data-chart-series]');if(!button||!legend.contains(button))return;const id=button.dataset.chartSeries;shown.has(id)?shown.delete(id):shown.add(id);render();[...legend.querySelectorAll('[data-chart-series]')].find(node=>node.dataset.chartSeries===id)?.focus();};legend.addEventListener('click',toggle);render();
  return {element:root,setData(value){if(destroyed)throw new Error('Chart was destroyed');const next=normalizeChartData(value),oldIds=new Set(state.series.map(series=>series.id));shown=new Set(next.series.filter(series=>!oldIds.has(series.id)||shown.has(series.id)).map(series=>series.id));state=next;render();},setType(value){if(!['line','bar'].includes(value))throw new TypeError('This SVG chart supports line and bar only.');type=value;render();},toggleSeries(id){if(!state.series.some(series=>series.id===id))throw new RangeError('Unknown chart series');shown.has(id)?shown.delete(id):shown.add(id);render();},destroy(){if(destroyed)return;destroyed=true;legend.removeEventListener('click',toggle);root.remove();}};
}

function inlineMarkdown(doc,text) {
  const fragment=doc.createDocumentFragment(),pattern=/(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;let cursor=0;
  for(const match of text.matchAll(pattern)){
    fragment.append(textNode(doc,text.slice(cursor,match.index)));let node;
    if(match[2]!==undefined){node=doc.createElement('strong');node.textContent=match[2];}
    else if(match[3]!==undefined){node=doc.createElement('code');node.textContent=match[3];}
    else{let url;try{url=new URL(match[5]);}catch{}if(url&&['https:','http:','mailto:'].includes(url.protocol)){node=doc.createElement('a');node.textContent=match[4];node.href=url.href;node.rel='noopener noreferrer';}else node=textNode(doc,match[0]);}
    fragment.append(node);cursor=match.index+match[0].length;
  }
  fragment.append(textNode(doc,text.slice(cursor)));return fragment;
}

/** Safe, limited Markdown renderer: no raw HTML, embedded media or HTML insertion. */
export function renderMarkdown(document,value) {
  const text=String(value??'');if(text.length>100000)throw new RangeError('Markdown preview is limited to 100,000 characters.');
  const root=document.createElement('div');root.className='tblu-prose';let paragraph=[],list=null,code=null;
  const flush=()=>{if(paragraph.length){const node=document.createElement('p');node.append(inlineMarkdown(document,paragraph.join(' ')));root.append(node);paragraph=[];}list=null;};
  for(const line of text.replace(/\r\n/g,'\n').split('\n')){
    if(/^```/.test(line)){flush();if(code)code=null;else{const pre=document.createElement('pre');pre.className='tblu-code';code=document.createElement('code');pre.append(code);root.append(pre);}continue;}
    if(code){code.append(textNode(document,`${line}\n`));continue;}
    if(!line.trim()){flush();continue;}
    const heading=/^(#{1,3})\s+(.+)$/.exec(line),bullet=/^[-*]\s+(.+)$/.exec(line);
    if(heading){flush();const node=document.createElement(`h${heading[1].length}`);node.append(inlineMarkdown(document,heading[2]));root.append(node);}
    else if(bullet){if(paragraph.length)flush();if(!list){list=document.createElement('ul');root.append(list);}const li=document.createElement('li');li.append(inlineMarkdown(document,bullet[1]));list.append(li);}
    else if(line.startsWith('> ')){flush();const quote=document.createElement('blockquote');quote.append(inlineMarkdown(document,line.slice(2)));root.append(quote);}
    else{list=null;paragraph.push(line);}
  }
  flush();return root;
}

/** Lazy engine boundary. The factory must return a destroyable engine, not markup only. */
export function createIntegrationSlot(host,{label='Professional engine'}={}) {
  if(!host?.ownerDocument)throw new TypeError('Integration slot requires an Element');
  const {el}=dom(host.ownerDocument),root=el('div','tblu-stack tblu-integration-slot'),status=el('p','tblu-muted',`${label}: not connected`),target=el('div','tblu-integration-target');status.setAttribute('role','status');root.append(status,target);host.append(root);
  let current,abort,generation=0,destroyed=false;
  const detach=async()=>{generation++;abort?.abort();abort=null;const previous=current;current=null;try{await previous?.destroy();}finally{target.replaceChildren();if(!destroyed)status.textContent=`${label}: not connected`;}};
  return {element:root,target,async attach(factory,options={}){
    if(destroyed)throw new Error('Integration slot was destroyed');if(typeof factory!=='function')throw new TypeError('Engine adapter must be a function');
    const token=++generation;abort?.abort();const previous=current;current=null;abort=new AbortController();const signal=abort.signal;
    await previous?.destroy();if(destroyed||token!==generation)return false;target.replaceChildren();status.textContent=`${label}: connecting`;
    let instance;
    try{instance=await factory(target,{...options,signal});if(!instance||typeof instance.destroy!=='function')throw new TypeError('Engine adapter must return { destroy() }');if(destroyed||token!==generation){await instance.destroy();return false;}current=instance;status.textContent=`${label}: connected`;return true;}
    catch(error){if(instance?.destroy&&instance!==current)await instance.destroy();if(!destroyed&&token===generation){target.replaceChildren();status.textContent=`${label}: ${error.message}`;}throw error;}
  },detach,async destroy(){if(destroyed)return;destroyed=true;await detach();root.remove();}};
}

export function renderContentExamples(host,{notify}={}) {
  if(!host?.ownerDocument)throw new TypeError('Content examples require an Element');
  const doc=host.ownerDocument,view=doc.defaultView,{el,svg,glyph,button}=dom(doc),prefix=`tblu-content-${++nextContent}`;
  const root=el('div','tblu-grid tblu-content-examples');host.append(root);const removers=[],apis=[],urls=new Set(),timers=new Set();let destroyed=false;
  const listen=(node,type,handler)=>{node.addEventListener(type,handler);removers.push(()=>node.removeEventListener(type,handler));};
  const notice=message=>{if(destroyed)return;if(notify)notify(message);else apis.push(showToast({message,root:host.closest('.tblu-root')||doc}));};
  const card=(title,description,ids)=>{const node=el('article','tblu-card tblu-pattern-card tblu-stack');node.dataset.componentIds=ids;node.append(el('h3','tblu-heading',title),el('p','tblu-muted',description));root.append(node);return node;};
  const field=(label,tag='textarea',name='input')=>{const wrap=el('label','tblu-field'),input=el(tag);input.id=`${prefix}-${name}`;wrap.append(el('span','',label),input);return {wrap,input};};
  const copy=async text=>{try{if(!view.navigator.clipboard?.writeText)throw new Error('Clipboard is unavailable. Select and copy the visible text.');await view.navigator.clipboard.writeText(text);notice('Copied to clipboard.');}catch(error){notice(error.message);}};

  const chartCard=card('Metric chart with legend and data table','Real local line/bar rendering with exact values and missing-data gaps. This bounded SVG API is not a full analytics engine.','106');
  let chartData={labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],series:[{id:'complete',name:'Completed',values:[12,19,16,23,28,17,21]},{id:'planned',name:'Planned',values:[16,20,20,26,30,20,24]}]},revision=0;
  const chart=createMetricChart(chartCard,{data:chartData,label:'Synthetic weekly tasks'});apis.push(chart);
  const chartActions=el('div','tblu-cluster'),lineButton=button('Line',null,'quiet'),barButton=button('Bar',null,'quiet'),refresh=button('Refresh sample data','RefreshCw');lineButton.setAttribute('aria-pressed','true');barButton.setAttribute('aria-pressed','false');chartActions.append(lineButton,barButton,refresh);chartCard.append(chartActions);
  listen(lineButton,'click',()=>{chart.setType('line');lineButton.setAttribute('aria-pressed','true');barButton.setAttribute('aria-pressed','false');});listen(barButton,'click',()=>{chart.setType('bar');lineButton.setAttribute('aria-pressed','false');barButton.setAttribute('aria-pressed','true');});
  listen(refresh,'click',()=>{revision++;chartData={...chartData,series:chartData.series.map((series,index)=>({...series,values:series.values.map((value,day)=>Math.max(0,value+((revision+day+index)%5)-2))}))};chart.setData(chartData);notice('Synthetic local data refreshed.');});

  const metrics=card('Statistics, sparkline and capacity','Sample metrics use actual numerical values; trends and capacity always expose their numbers.','105,107,108');
  const stats=el('dl','tblu-description tblu-statistics');for(const [term,value] of [['Completed this week','136 tasks'],['Compared with last week','+12.4%'],['Unavailable metric','Not available']])stats.append(el('dt','',term),el('dd','',value));metrics.append(stats);
  const trendValues=[6,9,8,14,12,17,15,21],trend=chartGeometry({labels:trendValues.map((_,index)=>String(index+1)),series:[{id:'trend',name:'Daily completed',values:trendValues}]},{width:320,height:110});const sparkline=svg('svg',{viewBox:'0 0 320 110',role:'img','aria-label':`Daily completed trend: ${trendValues.join(', ')}.`});sparkline.append(svg('path',{d:trend.series[0].path,fill:'none',stroke:'var(--tblu-color-accent)','stroke-width':3}));sparkline.classList.add('tblu-sparkline');metrics.append(sparkline,el('p','tblu-muted',`Trend values: ${trendValues.join(' · ')}`));
  const capacity=field('Capacity percentage','input','capacity');capacity.input.type='range';capacity.input.className='tblu-range';capacity.input.min='0';capacity.input.max='100';capacity.input.value='72';const meter=el('meter','tblu-meter');meter.min=0;meter.max=100;meter.value=72;meter.setAttribute('aria-label','Capacity used');const capacityValue=el('output','','72% used');capacityValue.setAttribute('for',capacity.input.id);metrics.append(capacity.wrap,meter,capacityValue);listen(capacity.input,'input',()=>{meter.value=Number(capacity.input.value);capacityValue.value=capacityValue.textContent=`${capacity.input.value}% used`;});

  const codeCard=card('Code block and copy','Read-only code keeps its original text and copy feedback. No code is executed.','109');
  const snippet="const ui = await mountUI(document, {\n  theme: 'system',\n  material: 'liquid',\n  motion: 'full'\n});\n\nui.setTheme({ material: 'solid' });";const pre=el('pre','tblu-code'),code=el('code','',snippet);pre.append(code);const copyCode=button('Copy code','Copy');listen(copyCode,'click',()=>copy(snippet));codeCard.append(el('span','tblu-chip','JavaScript'),pre,copyCode);

  const markdown=card('Safe Markdown preview','Supports headings, paragraphs, lists, quotes, code, bold and safe links. Raw HTML and embedded media stay literal; this is a bounded renderer.','110');
  const markdownInput=field('Markdown source','textarea','markdown');markdownInput.input.rows=7;markdownInput.input.maxLength=20000;markdownInput.input.value='# Component notes\n\n**Shared tokens** keep interfaces consistent.\n\n- Keyboard support\n- Reduced motion\n\n[Read the contract](https://github.com/TonyBlur/tblu-ui)\n\n```js\nui.refresh();\n```';
  const markdownPreview=el('div','tblu-markdown-preview');markdownPreview.setAttribute('aria-label','Rendered Markdown preview');const updateMarkdown=()=>markdownPreview.replaceChildren(renderMarkdown(doc,markdownInput.input.value));listen(markdownInput.input,'input',updateMarkdown);updateMarkdown();markdown.append(markdownInput.wrap,markdownPreview);

  const rich=card('Formatting editor primitive','Editable text with selection-based bold/italic and plain-text paste. No schema, collaborative engine, robust history or rich-text import/export is implied.','111');
  const richLabel=el('label','', 'Editable notes');richLabel.htmlFor=`${prefix}-rich-editor`;const editor=el('div','tblu-editor','Select a few words, then choose Bold or Italic. Paste inserts plain text.');editor.id=richLabel.htmlFor;editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-multiline','true');editor.setAttribute('aria-label','Editable notes');editor.tabIndex=0;
  const formatting=el('div','tblu-cluster');formatting.setAttribute('role','toolbar');formatting.setAttribute('aria-label','Selection formatting');const bold=button('Bold'),italic=button('Italic'),clear=button('Clear',null,'quiet'),copyNotes=button('Copy plain text','Copy','quiet');formatting.append(bold,italic,clear,copyNotes);
  const format=tag=>{const selection=view.getSelection();if(!selection?.rangeCount){notice('Select text in the notes first.');return;}const range=selection.getRangeAt(0);if(range.collapsed||!editor.contains(range.startContainer)||!editor.contains(range.endContainer)){notice('Select text in the notes first.');return;}const mark=el(tag);mark.append(range.extractContents());range.insertNode(mark);range.selectNodeContents(mark);selection.removeAllRanges();selection.addRange(range);editor.focus();};
  listen(bold,'pointerdown',event=>event.preventDefault());listen(italic,'pointerdown',event=>event.preventDefault());listen(bold,'click',()=>format('strong'));listen(italic,'click',()=>format('em'));listen(clear,'click',()=>{editor.replaceChildren();editor.focus();});listen(copyNotes,'click',()=>copy(editor.textContent));
  const insertPlain=text=>{const selection=view.getSelection();if(selection?.rangeCount){const range=selection.getRangeAt(0);if(editor.contains(range.startContainer)&&editor.contains(range.endContainer)){range.deleteContents();const node=textNode(doc,text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);return;}}editor.append(textNode(doc,text));};
  listen(editor,'paste',event=>{event.preventDefault();insertPlain(event.clipboardData?.getData('text/plain')||'');});listen(editor,'drop',event=>{event.preventDefault();insertPlain(event.dataTransfer?.getData('text/plain')||'');});rich.append(richLabel,formatting,editor);

  const jsonCard=card('Code/JSON editor primitive','A textarea with line numbers, JSON validation and formatting. Syntax highlighting, completion, diffing and language workers require an editor adapter.','112');
  const json=field('JSON source','textarea','json');json.input.className='tblu-code-input';json.input.rows=8;json.input.maxLength=30000;json.input.spellcheck=false;json.input.value='{"theme":"system","material":"liquid","features":["keyboard","motion"]}';const lines=el('pre','tblu-code-lines');lines.setAttribute('aria-hidden','true');const editorRow=el('div','tblu-code-editor');editorRow.append(lines,json.wrap);const jsonStatus=el('p','tblu-status');jsonStatus.setAttribute('role','status');const formatJSON=button('Format JSON','Check'),copyJSON=button('Copy JSON','Copy','quiet'),jsonActions=el('div','tblu-cluster');jsonActions.append(formatJSON,copyJSON);
  const updateJSON=()=>{lines.textContent=Array.from({length:json.input.value.split('\n').length},(_,index)=>index+1).join('\n');try{JSON.parse(json.input.value);jsonStatus.textContent='JSON is valid';jsonStatus.dataset.status='success';json.input.removeAttribute('aria-invalid');}catch(error){jsonStatus.textContent=`Invalid JSON: ${error.message}`;jsonStatus.dataset.status='danger';json.input.setAttribute('aria-invalid','true');}};jsonStatus.id=`${prefix}-json-status`;json.input.setAttribute('aria-describedby',jsonStatus.id);listen(json.input,'input',updateJSON);listen(formatJSON,'click',()=>{try{json.input.value=JSON.stringify(JSON.parse(json.input.value),null,2);updateJSON();notice('JSON formatted.');}catch{updateJSON();json.input.focus();}});listen(copyJSON,'click',()=>copy(json.input.value));updateJSON();jsonCard.append(editorRow,jsonStatus,jsonActions);

  const integration=card('Professional engine adapter boundary','Attach a real chart, rich-text, code editor or map engine through a destroyable adapter. No professional engine is bundled or represented by a mock.','');integration.dataset.integrationIds='62,58,106,111,112';
  const slot=createIntegrationSlot(integration,{label:'Specialist engine'});apis.push(slot);const inspect=button('Inspect adapter contract','Info'),diagnostic=button('Run lifecycle diagnostic','Play'),detach=button('Detach','X','quiet'),integrationActions=el('div','tblu-cluster');integrationActions.append(inspect,diagnostic,detach);integration.append(integrationActions);
  listen(inspect,'click',()=>{const contract=el('pre','tblu-code','const slot = createIntegrationSlot(host);\nawait slot.attach(async (target, { signal }) => {\n  const engine = await createActualEngine(target, { signal });\n  return { destroy: () => engine.destroy() };\n});\nawait slot.detach();\nawait slot.destroy();');apis.push(openDialog({title:'Specialist adapter lifecycle',content:contract,root:host.closest('.tblu-root')||doc,actions:[{label:'Close'}]}));});
  listen(diagnostic,'click',async()=>{try{await slot.attach((target,{signal})=>{const status=el('p','tblu-alert','Diagnostic adapter mounted. This tests cleanup only; no chart, editor or map engine is loaded.');status.dataset.status='info';target.append(status);const onAbort=()=>status.remove();signal.addEventListener('abort',onAbort,{once:true});return {destroy(){signal.removeEventListener('abort',onAbort);status.remove();}};});notice('Lifecycle diagnostic connected. Detach to release it.');}catch(error){notice(error.message);}});listen(detach,'click',()=>slot.detach().catch(error=>notice(error.message)));

  return {element:root,destroy(){if(destroyed)return;destroyed=true;removers.forEach(remove=>remove());for(const timer of timers)view.clearTimeout(timer);for(const url of urls)view.URL.revokeObjectURL(url);for(const api of apis)Promise.resolve(api.destroy()).catch(()=>{});root.remove();}};
}
