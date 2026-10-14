/** Install a reversible instance bridge without altering native prototypes. */
export function bridgeProperty(target, key, changed) {
  const own = Object.getOwnPropertyDescriptor(target, key);
  if (own && !own.configurable) return () => {};
  let owner = target, descriptor;
  while (owner && !(descriptor = Object.getOwnPropertyDescriptor(owner, key))) owner = Object.getPrototypeOf(owner);
  if (!descriptor?.get || !descriptor?.set) return () => {};
  Object.defineProperty(target, key, {
    configurable:true, enumerable:descriptor.enumerable,
    get() { return descriptor.get.call(this); },
    set(value) { descriptor.set.call(this,value); changed(); },
  });
  return () => { if (own) Object.defineProperty(target,key,own); else delete target[key]; };
}

export function selectOptions(source) {
  return [...source.options].map(option => ({
    value:option.value, label:option.label || option.textContent || '',
    disabled:option.disabled || (option.parentElement?.tagName === 'OPTGROUP' && option.parentElement.disabled),
    group:option.parentElement?.tagName === 'OPTGROUP' ? option.parentElement.label : '',
    selected:option.selected,
  }));
}

export function selectedValue(source) {
  return source.multiple ? [...source.selectedOptions].map(option => option.value) : source.value;
}

export function equivalentValue(left,right) {
  return Array.isArray(left) || Array.isArray(right)
    ? JSON.stringify(left ?? []) === JSON.stringify(right ?? []) : String(left ?? '') === String(right ?? '');
}

export function normalColor(value) {
  const hex = String(value ?? '').trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) return `#${[...hex.slice(1)].map(character=>character+character).join('')}`;
  return null;
}
