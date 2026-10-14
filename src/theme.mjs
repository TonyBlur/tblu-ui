export function normalizeTheme(value = {}) {
  const result = {theme:'system',material:'liquid',motion:'full',accent:'#0284c7',blur:3,contrast:.18,...value};
  if (!['system','light','dark'].includes(result.theme) || !['liquid','solid'].includes(result.material) || !['full','reduced'].includes(result.motion) || !/^#[0-9a-f]{6}$/i.test(result.accent)) throw new TypeError('Invalid UI theme');
  for (const [key,min,max] of [['blur',1,16],['contrast',0,.4]]) if (!Number.isFinite(result[key]) || result[key] < min || result[key] > max) throw new TypeError(`Invalid ${key}`);
  return Object.fromEntries(['theme','material','motion','accent','blur','contrast'].map(key=>[key,result[key]]));
}
