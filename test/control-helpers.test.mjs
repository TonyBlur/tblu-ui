import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bridgeProperty, selectOptions, selectedValue, normalColor, equivalentValue } from '../src/control-helpers.mjs';

test('native property bridges preserve coercion and restore the original descriptor',()=>{
  class Source { get value() { return this.current ?? ''; } set value(value) { this.current = String(value); } }
  const source = new Source(); let calls = 0;
  const restore = bridgeProperty(source,'value',()=>calls++);
  source.value = 27; assert.equal(source.value,'27'); assert.equal(calls,1);
  restore(); assert.equal(Object.hasOwn(source,'value'),false);
  source.value = 'after'; assert.equal(calls,1); assert.equal(source.value,'after');
  Object.defineProperty(source,'checked',{configurable:false,get:()=>true,set:()=>{}});
  const noRestore = bridgeProperty(source,'checked',()=>calls++); noRestore(); assert.equal(source.checked,true);
});

test('select values retain multiple selection and optgroup disabled state',()=>{
  const options = [
    {value:'a',label:'Alpha',selected:true,disabled:false,parentElement:{tagName:'SELECT'}},
    {value:'b',textContent:'Beta',selected:false,disabled:false,parentElement:{tagName:'OPTGROUP',disabled:true,label:'Group'}},
  ];
  const source = {options,selectedOptions:[options[0]],multiple:true,value:'a'};
  assert.deepEqual(selectedValue(source),['a']);
  assert.equal(selectOptions(source)[1].disabled,true); assert.equal(selectOptions(source)[1].group,'Group');
  source.multiple = false; assert.equal(selectedValue(source),'a');
  assert.equal(equivalentValue(['a'],['a']),true); assert.equal(equivalentValue(['a'],['b']),false);
});

test('color values cannot replace a native color source with unsupported formats',()=>{
  assert.equal(normalColor('#AbC'),'#aabbcc'); assert.equal(normalColor('#123456'),'#123456');
  assert.equal(normalColor('rgba(1,2,3,0.5)'),null); assert.equal(normalColor('javascript:alert(1)'),null);
});
