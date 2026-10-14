import fs from 'node:fs';
import path from 'node:path';
const source = path.resolve('src');
const forbidden = /\.bookmark-card|#sidebar\b|#app\b|\[data-action|from ['"]\.\/i18n/;
for(const file of fs.readdirSync(source)) {
  if(!/\.(css|m?js)$/.test(file))continue;
  if(forbidden.test(fs.readFileSync(path.join(source,file),'utf8')))throw new Error(`Application-specific selector or dependency in ${file}`);
}
for(const required of ['LICENSE','licenses/MingCute-LICENSE','THIRD_PARTY_NOTICES.md','DESIGN_SYSTEM.md'])if(!fs.existsSync(required))throw new Error(`Missing ${required}`);
console.log('UI contract: generic components, licensed assets and documented design rules');
