import {categories,componentCatalog,filterCatalog,websiteScenarios} from '../src/catalog.mjs';
import {loadPrimitives,icon} from '../src/index.js';
import {renderFormExamples} from '../src/patterns-form-examples.js';
import {renderNavigationExamples} from '../src/patterns-navigation.js';
import {renderCollectionExamples} from '../src/patterns-collections.js';
import {renderWorkflowExamples} from '../src/patterns-workflow.js';
import {renderContentExamples} from '../src/patterns-content.js';

const foundationalIds=new Set(['1','2','3','4','5','6','7','8','9','10','11','12','13','26','29','30','34','38','39','40','42','49','50','52','61','71','73','74','75','79']);
const specialistIds=new Set(['58','62','64','93','106','111','112']);
export async function renderCatalog(host,{ui,notify}) {
  const doc=host.ownerDocument,controllers=[];
  const create=(tag,className,text)=>{const element=doc.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;};
  const head=create('div','demo-section-heading');
  const title=create('div');title.append(create('span','demo-section-number','Component directory'),create('h2',null,'Find a component for your scenario'),create('p',null,'112 researched types. Inspect working recipes and the explicit specialist integration boundaries.'));head.append(title);host.append(head);
  const toolbar=create('div','tblu-grid demo-catalog-filters');
  const search=create('label','tblu-field');search.append(create('span',null,'Component or interaction'));const query=create('input');query.type='search';query.placeholder='Search calendar, chat, upload, validation…';search.append(query);
  const family=create('label','tblu-field');family.append(create('span',null,'Component family'));const category=create('select');category.append(new Option('All component families',''));categories.forEach(item=>category.append(new Option(item.title,item.id)));family.append(category);
  const scenario=create('label','tblu-field');scenario.append(create('span',null,'Website scenario'));const site=create('select');site.append(new Option('All website scenarios',''));websiteScenarios.filter(value=>value!=='All').forEach(value=>site.append(new Option(value,value)));scenario.append(site);
  toolbar.append(search,family,scenario);host.append(toolbar);
  const result=create('p','tblu-muted');result.setAttribute('role','status');result.setAttribute('aria-live','polite');host.append(result);
  const directory=create('div','demo-catalog-directory tblu-scroll');directory.setAttribute('aria-label','Component coverage directory');directory.tabIndex=0;host.append(directory);
  const groups=create('div','demo-catalog-groups');host.append(groups);
  const containers=new Map();
  categories.forEach(item=>{
    const section=create('section','demo-section');section.id=`catalog-${item.id}`;
    const heading=create('div','demo-section-heading'),text=create('div');text.append(create('span','demo-section-number',item.id),create('h2',null,item.title));heading.append(text);section.append(heading);
    const content=create('div','tblu-pattern-grid');section.append(content);groups.append(section);containers.set(item.id,content);
  });
  const foundation=create('article','tblu-card tblu-pattern-card tblu-stack');foundation.dataset.componentIds='1,2,3,4,5,6,7,8,9';
  foundation.append(create('h3',null,'The layout language'),create('p','tblu-muted','Container, stack, cluster and responsive grid arrange content. Cards, prose, separators and scroll areas use the same tokens.'));
  const row=create('div','tblu-cluster');row.append(create('span','tblu-chip','Responsive'),create('span','tblu-chip','Theme aware'),create('span','tblu-chip','Reduced motion'));foundation.append(row);
  const prose=create('div','tblu-prose');prose.append(create('h4','tblu-heading','Readable hierarchy'),create('p',null,'Use headings for structure, labels for controls and helpful context beside the value. Shared typography adapts to the material studio above.'));foundation.append(prose,create('hr','tblu-divider'));
  const scroll=create('div','tblu-scroll demo-foundation-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label','Scrollable layout example');for(let n=1;n<=8;n++)scroll.append(create('p','tblu-muted',`Layout example ${n} · keyboard accessible scroll region`));foundation.append(scroll);containers.get('foundations').append(foundation);
  await loadPrimitives(['split-panel']);
  const splitCard=create('article','tblu-card tblu-pattern-card tblu-stack');splitCard.dataset.componentIds='10';splitCard.append(create('h3',null,'Resizable workbench'),create('p','tblu-muted','Drag the divider or focus it and use arrow keys. The same resizing contract applies to the studio sidebar.'));
  const split=create('wa-split-panel');split.position=40;split.setAttribute('aria-label','Resizable workbench');
  const start=create('div','tblu-stack demo-split-pane');start.slot='start';start.append(create('strong',null,'Explorer'),create('p','tblu-muted','Files and navigation'));
  const end=create('div','tblu-stack demo-split-pane');end.slot='end';end.append(create('strong',null,'Workspace'),create('p','tblu-muted','Content adapts to the available width.'));split.append(start,end);splitCard.append(split);containers.get('foundations').append(splitCard);
  controllers.push(renderNavigationExamples(containers.get('navigation'),{notify}),renderFormExamples(containers.get('forms'),{notify}),renderCollectionExamples(containers.get('collections'),{notify}),renderWorkflowExamples(containers.get('workflow'),{notify}),renderContentExamples(containers.get('content'),{notify}));
  // A recipe may span several families. Move it to its primary catalog family;
  // its IDs remain discoverable in every matching search and scenario.
  const articles=[...groups.querySelectorAll('[data-component-ids]')];
  const evidence=new Map();
  articles.forEach(article=>{
    const ids=[article.dataset.componentIds,article.dataset.integrationIds].filter(Boolean).join(',').split(',').filter(value=>value.trim()).map(value=>String(Number(value.trim())));
    ids.forEach(id=>{if(!evidence.has(id))evidence.set(id,article);});
    const first=componentCatalog.find(item=>item.id===ids[0]);if(first)containers.get(first.category).append(article);
  });
  for(const [id,selector] of [['11','#buttons'],['12','#sizeExamples'],['13','.demo-hero-actions'],['17','.demo-topbar'],['18','#demoSidebar'],['71','#informationPopover'],['73','#informationPopover'],['74','#catalog-feedback']]){
    const element=doc.querySelector(selector);if(element)evidence.set(id,element);
  }
  const directoryItems=new Map();
  componentCatalog.forEach(item=>{
    const button=create('button','tblu-menu-item demo-catalog-item');button.type='button';
    const title=create('span');title.append(create('strong',null,item.type),create('small','tblu-muted',categories.find(group=>group.id===item.category).title));
    const status=create('span','tblu-status');
    status.textContent=specialistIds.has(item.id)?'Integration boundary':foundationalIds.has(item.id)?'Shared primitive':evidence.has(item.id)?'Interactive recipe':'Planned';
    status.dataset.status=specialistIds.has(item.id)?'warning':evidence.has(item.id)||foundationalIds.has(item.id)?'success':'info';
    button.append(title,status);directory.append(button);directoryItems.set(item.id,button);
    button.addEventListener('click',()=>{
      const example=evidence.get(item.id);if(example){example.scrollIntoView({behavior:'smooth',block:'center'});example.tabIndex=-1;example.focus({preventScroll:true});}
      else notify(`${item.type}: ${specialistIds.has(item.id)?'advanced engine integration is required':'this interaction is on the coverage plan'}.`);
    });
  });
  function filter(){
    const matches=filterCatalog({query:query.value,category:category.value,scenario:site.value}),ids=new Set(matches.map(item=>item.id));
    directoryItems.forEach((element,id)=>{element.hidden=!ids.has(id);});
    articles.forEach(article=>{article.hidden=![article.dataset.componentIds,article.dataset.integrationIds].filter(Boolean).join(',').split(',').filter(value=>value.trim()).some(id=>ids.has(String(Number(id.trim()))));});
    for(const container of containers.values())container.parentElement.hidden=![...container.children].some(element=>!element.hidden);
    const working=matches.filter(item=>evidence.has(item.id)&&!specialistIds.has(item.id)).length;
    result.textContent=`${matches.length} types match · ${working} have interactive evidence here · specialist boundaries are labelled separately.`;
  }
  query.addEventListener('input',filter);category.addEventListener('change',filter);site.addEventListener('change',filter);filter();ui.refresh();
  return {evidence,refresh:filter,destroy(){controllers.forEach(controller=>controller?.destroy?.());host.replaceChildren();}};
}
