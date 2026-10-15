# API guide

Import `@tblu/ui/styles.css` once. Initialize `await mountUI(root, options)` after the DOM is available; call `destroy()` when unmounting. Controls added later are observed and enhanced. A source input/select keeps its name and native form value; the visible adapter never submits a duplicate value.

## Core

```js
import {mountUI,openDialog,showToast,attachTooltip,
  mountSidebarResize,mountFloatingTableHeader,loadPrimitives} from '@tblu/ui';
const ui = await mountUI(document, {theme:'system',material:'liquid',locale:'en'});
const resizing = mountSidebarResize({handle, min:220, max:560, width:268,
  onChange:width => renderLayout(width), onCommit:width => saveWidth(width)});
const table = mountFloatingTableHeader(container, {topOffset:()=>64});
const tip = attachTooltip(button, {text:'Save changes'});
showToast({message:'Saved',action:{label:'Undo',onClick:undo},duration:6000});
openDialog({title:'Confirm',content:contentNode,actions:[
  {label:'Cancel'},{label:'Continue',variant:'primary',onSelect:save}
]});
// table.destroy(); resizing.destroy(); tip.destroy(); await ui.destroy();
```

Modal actions retain browser activation, may return promises and keep the dialog open on failure. `ownHeader:false` accepts an existing complete form. Escape and focus restoration belong to the shared controller. Toast timers pause for hover, focus and async actions. Tooltip teardown restores the original title and generated anchor ID.

`loadPrimitives(['tree','tree-item','rating'])` loads only the requested free Web Components. Render `wa-*` elements beneath the mounted root; canonical parts and tokens skin them. `primitiveNames` lists supported free names. Icons use the package's MingCute registry, including internal system glyphs.

## Form controllers

```js
import {mountCombobox,mountFormValidation,mountQuantity,mountPassword,
  mountDateRange,mountCascader,mountTreeSelect,mountTransfer,mountPeriodPicker,
  zonedDateTimeCandidates} from '@tblu/ui/patterns/forms';
const combo = mountCombobox(sourceInput, {
  options:[{value:'design',label:'Design'},{value:'research',label:'Research'}],
  multiple:true,allowCreate:true,onChange:ids=>updateDraft(ids)
});
const formUI = mountFormValidation(form, {summary:errorSummary,
  validate:values=>({}), onSubmit:formData=>save(formData)});
```

Combobox sources contain an ID or a JSON array of IDs. Options may be an async function of the query; stale results do not replace a newer request. Paste accepts comma/semicolon/newline tokens in multiple mode. The host owns translated option labels and persistence. Calls return controllers with `destroy()` and documented value/update methods in source.

Date/time controls inside `.tblu-field` are mounted automatically. Dates use ISO Gregorian values; typed time is 24-hour. Calendar captions/weekdays are localized through `locale`, and action/error labels can be supplied through `labels`. Min/max/required/step and reset remain native. The range recipe couples two date sources and clamps a reversed end date. Month and ISO week have separate value models. `zonedDateTimeCandidates()` returns zero, one or multiple ISO instants; a host must explicitly resolve DST gaps/overlaps rather than silently choosing an instant.

## Navigation and collections

```js
import {mountTabs,mountPagination,mountCommandPalette} from '@tblu/ui/patterns/navigation';
import {mountCollection,mountQueryBuilder,mountUploadQueue} from '@tblu/ui/patterns/collections';
const collection = mountCollection(host, {items, getId:item=>item.id,onChange:render});
collection.select('stable-id');
collection.setQuery({operator:'and',rules:[{field:'name',operator:'contains',value:'design'}]});
collection.setSort('name','ascending');
collection.setSort(null); // restores the underlying original order
const queue = mountUploadQueue(host, {accept:'image/*',maxBytes:10*1024*1024,
  upload:(file,{signal,onProgress})=>yourTransport(file,{signal,onProgress})});
```

Collection updates retain identity and underlying order; explicit move operations edit that order. The host renders the supplied state and owns persistence, routing and remote pagination. Query rules are typed data; they are not SQL or JavaScript. Upload transport is required, and cancellation uses `AbortSignal`. The demo supplies local `FileReader` processing, not a pretend server upload.

## Collaboration and content

```js
import {mountMessageComposer,mountKanban,mountCountdown} from '@tblu/ui/patterns/workflow';
import {createMetricChart,renderMarkdown,createIntegrationSlot} from '@tblu/ui/patterns/content';
const composer = mountMessageComposer(form,{textarea,sendButton,
  getAttachments:()=>files,onSend:draft=>sendThroughYourService(draft)});
const chart = createMetricChart(host,{label:'Tasks',type:'line',data:{
  labels:['Mon','Tue'],series:[{id:'complete',name:'Completed',values:[12,19]}]
}});
chart.setType('bar');
```

Composer shortcuts are IME-safe (`Ctrl/⌘ + Enter`); async errors retain the draft, and sending an earlier draft never erases newer text. Kanban pointer, keyboard and buttons share the same immutable move operation. The host owns authentication, permissions, delivery and durable state.

The SVG chart supports bounded line/bar data, series toggles and an exact-value table, with gaps for missing values. Markdown is an explicitly limited safe subset, never raw HTML. Formatting/JSON editor examples are primitives; professional schema/history/completion/diff features require a real engine.

`createIntegrationSlot(host)` provides `attach(async (target,{signal})=>({destroy()}))`, `detach()` and `destroy()`. It cancels stale mounts and releases engines. The lifecycle diagnostic is labelled as a diagnostic and does not claim that an engine is bundled.

## Catalog and recipes

`@tblu/ui/catalog` exports `componentCatalog`, `categories`, `websiteScenarios` and `filterCatalog()`. The catalog is an inventory, not a completion guarantee. `renderNavigationExamples`, `renderCollectionExamples`, `renderWorkflowExamples`, `renderContentExamples`, and `@tblu/ui/patterns/form-examples` compose the interactive recipes used by the studio; each returns a destroyable controller. Host applications normally consume their underlying controllers and supply their own data and translated content.
