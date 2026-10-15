import fs from 'node:fs';
const source = fs.readFileSync(new URL('../docs/component-coverage-research.md',import.meta.url),'utf8');
const categories = [
  ['foundations','Foundations & layout','All'],['navigation','Actions & navigation','Public,Admin,Dev'],
  ['forms','Forms & validation','Account,Commerce,Admin'],['temporal','Dates & scheduling','Schedule,Dashboard'],
  ['collections','Data & collections','Admin,Commerce,Files'],['feedback','Overlays & feedback','All'],
  ['media','Files & media','Files,Public,Commerce'],['workflow','Workflow & collaboration','Collab,Account,Admin'],
  ['content','Metrics & editors','Dashboard,Dev,Public'],
];
let categoryIndex=-1;
const components=[];
for (const line of source.split(/\r?\n/)) {
  if (/^## [A-I]\. /.test(line)) categoryIndex++;
  const match=line.match(/^\| (\d{2,3}) \| ([^|]+) \| ([^|]+) \| [^|]+ \| ([^|]+) \|$/);
  if (!match) continue;
  const [,rawId,type,layer,requirements]=match;
  const [category,,scenarios]=categories[categoryIndex];
  const specific=requirements.trim().match(/ ([A-Za-z/]+)\.$/)?.[1].split('/');
  const known=new Set(['All','Public','Account','Admin','Commerce','Schedule','Collab','Files','Dashboard','Dev']);
  components.push({id:String(Number(rawId)),type:type.trim(),category,layer:layer.trim(),scenarios:specific?.every(value=>known.has(value))?specific:scenarios.split(','),requirements:requirements.trim()});
}
if (components.length!==112 || new Set(components.map(item=>item.id)).size!==112) throw new Error('The research inventory must contain 112 unique component types');
const output=`// Generated from the official-source coverage research. Types are not completion claims.\nexport const categories = Object.freeze(${JSON.stringify(categories.map(([id,title])=>({id,title})),null,2)});\nexport const componentCatalog = Object.freeze(${JSON.stringify(components,null,2)}.map(item=>Object.freeze(item)));\nexport const websiteScenarios = Object.freeze(['All','Public','Account','Admin','Commerce','Schedule','Collab','Files','Dashboard','Dev']);\nexport function filterCatalog({query='',category='',scenario=''}={}) {\n  const words=String(query).toLocaleLowerCase().trim().split(/\\s+/).filter(Boolean);\n  return componentCatalog.filter(item=>(!category||item.category===category)&&(!scenario||item.scenarios.includes('All')||item.scenarios.includes(scenario))&&words.every(word=>[item.type,item.category,item.requirements,...item.scenarios].join(' ').toLocaleLowerCase().includes(word)));\n}\n`;
fs.writeFileSync(new URL('../src/catalog.mjs',import.meta.url),output);
console.log(`Generated ${components.length} types across ${categories.length} families`);
