import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function releasePolicy(tag) {
  const match=String(tag).match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if (!match) throw new TypeError('Release tags must be semantic versions');
  return {version:String(tag).replace(/^v/,''),prerelease:Number(match[1])<1 || Boolean(match[4])};
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  const tag=process.argv[2] || pkg.version;
  const policy=releasePolicy(tag);
  if (process.argv[3]!==undefined && policy.prerelease && process.argv[3]!=='true') throw new Error(`${tag} must be marked as a GitHub prerelease`);
  console.log(JSON.stringify(policy));
}
