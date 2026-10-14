/* Derived from tblu-bookmark / Pintree. MIT, Copyright (c) 2024 Pintree.io. */
import { animate, stagger } from 'motion';

const curve = [.22, 1, .36, 1];
const themeFor = element => element?.closest?.('[data-tblu-motion]') || element?.ownerDocument?.documentElement || document.documentElement;
const seconds = (element, name, fallback) => {
  const value = getComputedStyle(themeFor(element)).getPropertyValue(name).trim();
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount / (value.endsWith('ms') ? 1000 : 1) : fallback;
};
const running = new WeakMap();
function animateOverlay(element, frames, duration) {
  running.get(element)?.stop();
  const animation = animate(element, frames, { duration, ease:curve });
  running.set(element, animation); return animation;
}
export const reducedMotion = element => matchMedia('(prefers-reduced-motion: reduce)').matches || themeFor(element).dataset.tbluMotion === 'reduced';

export function enter(target, distance = 14) {
  const elements = typeof target === 'string' ? [...document.querySelectorAll(target)].slice(0, 36) : target?.nodeType ? [target] : Array.from(target || []).slice(0, 36);
  if (!elements.length || reducedMotion(elements[0])) return;
  const animation = animate(elements, { opacity:[0,1], y:[distance,0], filter:['blur(3px)','blur(0px)'] }, {
    duration:seconds(elements[0], '--tblu-motion-enter', .44), ease:curve, delay:stagger(.022, { ease:'easeOut' }),
  });
  // Even blur(0px) creates a backdrop root. Clear it once motion settles.
  animation.then(() => elements.forEach(element => { if (element.style.filter === 'blur(0px)') element.style.removeProperty('filter'); }));
  return animation;
}
export function reveal(element) { if (!reducedMotion(element)) return animateOverlay(element, { opacity:[0,1], scale:[.97,1], y:[10,0] }, seconds(element, '--tblu-motion-enter', .44)); }
export async function leave(element) { if (!reducedMotion(element)) await animateOverlay(element, { opacity:0, y:8, scale:.97 }, seconds(element, '--tblu-motion-exit', .32)); }
function menuVector(element, anchor, placement = 'bottom') {
  const side = placement.split('-')[0], panel = element.getBoundingClientRect(), source = anchor.getBoundingClientRect();
  const percent = (value, size) => `${Math.max(0, Math.min(100, value / Math.max(1, size) * 100))}%`;
  const x = percent(source.left + source.width / 2 - panel.left, panel.width), y = percent(source.top + source.height / 2 - panel.top, panel.height);
  element.style.transformOrigin = side === 'top' ? `${x} 100%` : side === 'bottom' ? `${x} 0%` : side === 'left' ? `100% ${y}` : `0% ${y}`;
  return { x:side === 'left' ? 10 : side === 'right' ? -10 : 0, y:side === 'top' ? 10 : side === 'bottom' ? -10 : 0 };
}
export function menuEnter(element, anchor, placement) {
  if (reducedMotion(element)) { element.style.opacity = '1'; element.style.transform = 'none'; return; }
  const offset = menuVector(element, anchor, placement);
  return animateOverlay(element, { opacity:[0,1], scale:[.97,1], x:[offset.x,0], y:[offset.y,0] }, seconds(element, '--tblu-motion-enter', .44));
}
export async function menuLeave(element, anchor, placement) {
  if (reducedMotion(element)) return;
  const offset = menuVector(element, anchor, placement);
  await animateOverlay(element, { opacity:0, scale:.97, x:offset.x, y:offset.y }, seconds(element, '--tblu-motion-exit', .32));
}
const selections = new WeakMap();
export function slideSelection(element, from, x) {
  selections.get(element)?.cancel();
  if (reducedMotion(element) || Math.abs(new DOMMatrixReadOnly(from).m41 - x) < .1) return;
  const animation = element.animate([{ transform:from }, { transform:`translateX(${x}px)` }], {
    duration:seconds(element, '--tblu-motion-enter', .44) * 1000, easing:'cubic-bezier(.22,1,.36,1)',
  });
  selections.set(element, animation); return animation;
}
export function tooltipEnter(element) { return reveal(element); }
export function tooltipLeave(element) { return leave(element).then(() => element.remove()); }
const folds = new WeakMap();
export function fold(element, expanded) {
  folds.get(element)?.animation?.stop();
  const token = {}; folds.set(element, token);
  const start = element.hidden ? 0 : element.getBoundingClientRect().height;
  element.hidden = false;
  const finish = () => {
    if (folds.get(element) !== token) return;
    element.hidden = !expanded;
    element.style.removeProperty('height'); element.style.removeProperty('opacity');
    element.classList.remove('tblu-expanding'); folds.delete(element);
  };
  if (reducedMotion(element)) { finish(); return; }
  element.classList.add('tblu-expanding');
  const opacity = start ? Number(getComputedStyle(element).opacity) : 0;
  element.style.height = 'auto';
  const end = expanded ? element.getBoundingClientRect().height : 0;
  element.style.height = `${start}px`; element.style.opacity = String(opacity);
  token.animation = animate(element, { height:[start,end], opacity:[opacity,expanded ? 1 : 0] }, {
    duration:seconds(element, expanded ? '--tblu-motion-enter' : '--tblu-motion-exit', expanded ? .44 : .32), ease:curve,
  });
  token.animation.then(finish); return token.animation;
}
