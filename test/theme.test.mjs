import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTheme} from '../src/theme.mjs';
test('theme contract validates controls and keeps unknown application settings out of the UI layer',()=>{
  assert.equal(normalizeTheme({theme:'dark',blur:16,contrast:0,applicationSecret:'not portable'}).theme,'dark');
  assert.equal('applicationSecret' in normalizeTheme({applicationSecret:'not portable'}),false);
  for(const value of [{theme:'blue'},{material:'metal'},{motion:false},{accent:'red'},{blur:0},{contrast:.5},{contrast:'0.2'}]) assert.throws(()=>normalizeTheme(value));
});
