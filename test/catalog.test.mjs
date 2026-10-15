import test from 'node:test';
import assert from 'node:assert/strict';
import {componentCatalog,categories,filterCatalog} from '../src/catalog.mjs';
test('coverage inventory consolidates types and supports scenario and text discovery',()=>{
  assert.equal(componentCatalog.length,112);
  assert.equal(new Set(componentCatalog.map(item=>item.id)).size,112);
  assert.equal(categories.length,9);
  assert.ok(filterCatalog({query:'time'}).some(item=>item.id==='52'));
  assert.ok(filterCatalog({category:'forms',scenario:'Account'}).length>10);
  assert.equal(filterCatalog({query:'a-component-that-does-not-exist'}).length,0);
});
