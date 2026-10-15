import test from 'node:test';
import assert from 'node:assert/strict';
import {releasePolicy} from '../scripts/release-policy.mjs';
test('every version before 1.0 and every suffixed version is a prerelease',()=>{
  for(const version of ['v0.1.0','0.99.9','v0.2.0-beta.1','v1.0.0-rc.2'])assert.equal(releasePolicy(version).prerelease,true);
  assert.equal(releasePolicy('v1.0.0').prerelease,false);
  assert.equal(releasePolicy('2.4.1').prerelease,false);
  assert.throws(()=>releasePolicy('latest'),TypeError);
});
