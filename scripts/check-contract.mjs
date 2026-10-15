import fs from 'node:fs';
import path from 'node:path';
const source = path.resolve('src');
const forbidden = /\.bookmark-card|#sidebar\b|#app\b|\[data-action|from ['"]\.\/i18n/;
for(const file of fs.readdirSync(source)) {
  if(!/\.(css|m?js)$/.test(file))continue;
  if(forbidden.test(fs.readFileSync(path.join(source,file),'utf8')))throw new Error(`Application-specific selector or dependency in ${file}`);
}
for(const required of ['LICENSE','licenses/MingCute-LICENSE','THIRD_PARTY_NOTICES.md','DESIGN_SYSTEM.md','docs/COVERAGE.md','docs/API.md','docs/RELEASES.md'])if(!fs.existsSync(required))throw new Error(`Missing ${required}`);
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
if(version.startsWith('0.')&&!version.includes('-'))throw new Error('New pre-1.0 package versions must use an alpha/beta/rc suffix');
console.log('UI contract: generic components, licensed assets and documented design rules');
