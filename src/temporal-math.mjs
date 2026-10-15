const DAY = 86400000;
const pad = (value,length = 2) => String(value).padStart(length,'0');

export function parseISODate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const [year,month,day] = match.slice(1).map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(0); date.setUTCHours(0,0,0,0); date.setUTCFullYear(year,month - 1,day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return {year,month,day,epoch:date.getTime()};
}

export function isoFromEpoch(epoch) {
  const date = new Date(epoch), year = date.getUTCFullYear();
  return Number.isFinite(epoch) && year >= 1 && year <= 9999 ? `${pad(year,4)}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())}` : null;
}

export function addDateDays(value,amount) {
  const parsed = parseISODate(value); return parsed && Number.isFinite(amount) ? isoFromEpoch(parsed.epoch + Math.trunc(amount) * DAY) : null;
}

export function addDateMonths(value,amount) {
  const parsed = parseISODate(value); if (!parsed || !Number.isFinite(amount)) return null;
  const index = parsed.year * 12 + parsed.month - 1 + Math.trunc(amount), year = Math.floor(index / 12), month = ((index % 12) + 12) % 12 + 1;
  if (year < 1 || year > 9999) return null;
  let day = parsed.day;
  while (day > 0) { const candidate = `${pad(year,4)}-${pad(month)}-${pad(day)}`; if (parseISODate(candidate)) return candidate; day--; }
  return null;
}

export function localeWeekStart(locale = 'en') {
  try { const value = new Intl.Locale(locale); const info = value.getWeekInfo?.() || value.weekInfo; return (info?.firstDay || 7) % 7; }
  catch { return 0; }
}

export function calendarDates(value,firstDay = 0) {
  const parsed = parseISODate(value); if (!parsed) return [];
  const first = `${pad(parsed.year,4)}-${pad(parsed.month)}-01`, weekday = new Date(parseISODate(first).epoch).getUTCDay();
  const offset = (weekday - firstDay + 7) % 7;
  return Array.from({length:42},(_,index)=>addDateDays(first,index-offset));
}

export function dateAllowed(value,{min,max,step = 1,base} = {}) {
  const parsed = parseISODate(value); if (!parsed) return false;
  const lower = parseISODate(min), upper = parseISODate(max);
  if (lower && parsed.epoch < lower.epoch || upper && parsed.epoch > upper.epoch) return false;
  if (step === 'any') return true;
  const increment = Number(step) > 0 ? Number(step) : 1, start = lower || parseISODate(base);
  const quotient = (parsed.epoch - (start?.epoch || 0)) / DAY / increment;
  return Math.abs(quotient - Math.round(quotient)) < 1e-7;
}

export function nearestDate(value,constraints = {},direction = 1) {
  let date = parseISODate(value) ? value : '1970-01-01';
  const lower = parseISODate(constraints.min), upper = parseISODate(constraints.max);
  if (lower && upper && lower.epoch > upper.epoch) return null;
  if (lower && parseISODate(date).epoch < lower.epoch) date = constraints.min;
  if (upper && parseISODate(date).epoch > upper.epoch) date = constraints.max;
  if (dateAllowed(date,constraints)) return date;
  // Date inputs count steps in whole calendar days. Search both directions so
  // a boundary or large step never leaves the picker focused on a disabled day.
  for (const sign of [direction,-direction]) {
    const limit = sign > 0 && upper ? Math.min(36600,(upper.epoch-parseISODate(date).epoch)/DAY) : sign < 0 && lower ? Math.min(36600,(parseISODate(date).epoch-lower.epoch)/DAY) : 36600;
    for (let offset=1;offset<=limit;offset++) {
      const delta = offset * sign;
      const candidate = addDateDays(date,delta);
      if (candidate && dateAllowed(candidate,constraints)) return candidate;
    }
  }
  return null;
}

export function parseTime(value) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(String(value || ''));
  if (!match) return null;
  const hour = Number(match[1]),minute = Number(match[2]),second = Number(match[3] || 0),fraction = Number(`0.${match[4] || 0}`);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return hour * 3600 + minute * 60 + second + fraction;
}

export function formatTime(value,{seconds = false} = {}) {
  if (!Number.isFinite(value) || value < 0 || value >= 86400) return '';
  const ticks = Math.round(value * 1000),hour = Math.floor(ticks / 3600000),minute = Math.floor(ticks / 60000) % 60,second = Math.floor(ticks / 1000) % 60,fraction = ticks % 1000;
  const prefix = `${pad(hour)}:${pad(minute)}`;
  if (!seconds && !second && !fraction) return prefix;
  return `${prefix}:${pad(second)}${fraction ? `.${pad(fraction,3).replace(/0+$/,'')}` : ''}`;
}

export function timeConstraints({min,max,step = 60,base} = {}) {
  const lower = parseTime(min),upper = parseTime(max);
  return {min:lower,max:upper,step:step === 'any' ? null : Number(step) > 0 ? Number(step) : 60,base:lower ?? parseTime(base) ?? 0};
}

export function timeAllowed(value,constraints = {}) {
  const {min = null,max = null,step = 60,base = 0} = constraints;
  if (!Number.isFinite(value) || value < 0 || value >= 86400) return false;
  if (min !== null && max !== null && min > max) { if (value < min && value > max) return false; }
  else if (min !== null && value < min || max !== null && value > max) return false;
  if (step === null) return true;
  const quotient = (value - base) / step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-7;
}

/** Popup options are bounded to at most one sample per second; typed fractions remain valid. */
export function timeCandidates(constraints) {
  const step = constraints.step ?? 60;
  const stride = step < 1 ? step * Math.ceil(1 / step) : step;
  const phase = ((constraints.base % step) + step) % step;
  const values = [];
  for (let value=phase;value<86400;value+=stride) {
    const rounded = Math.round(value * 1000) / 1000;
    if (timeAllowed(rounded,constraints)) values.push(rounded);
  }
  return values;
}

export function nearestTime(value,candidates) {
  if (!candidates.length) return null;
  const target = Number.isFinite(value) ? value : candidates[0];
  return candidates.reduce((best,next)=>Math.abs(next-target) < Math.abs(best-target) ? next : best,candidates[0]);
}
