import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseISODate,isoFromEpoch,addDateDays,addDateMonths,calendarDates,dateAllowed,nearestDate,parseTime,formatTime,timeConstraints,timeAllowed,timeCandidates,nearestTime } from '../src/temporal-math.mjs';

test('Gregorian dates validate leap years, early years and DST-safe day arithmetic',()=>{
  assert.equal(parseISODate('2023-02-29'),null); assert.ok(parseISODate('2024-02-29')); assert.equal(parseISODate('0000-01-01'),null);
  assert.equal(isoFromEpoch(parseISODate('0020-03-04').epoch),'0020-03-04');
  assert.equal(addDateDays('2024-03-10',1),'2024-03-11'); assert.equal(addDateDays('2024-11-03',-1),'2024-11-02');
  assert.equal(addDateDays('2024-12-31',1),'2025-01-01'); assert.equal(addDateMonths('2024-01-31',1),'2024-02-29'); assert.equal(addDateMonths('2023-03-31',-1),'2023-02-28');
  assert.equal(addDateMonths('0001-01-01',-1),null); assert.equal(addDateDays('9999-12-31',1),null);
});

test('calendar grids and date constraints respect week start, bounds and step base',()=>{
  const grid = calendarDates('2024-09-15',1); assert.equal(grid.length,42); assert.equal(grid[0],'2024-08-26'); assert.equal(grid.at(-1),'2024-10-06');
  const constraints = {min:'2024-09-03',max:'2024-09-12',step:3};
  assert.equal(dateAllowed('2024-09-03',constraints),true); assert.equal(dateAllowed('2024-09-04',constraints),false); assert.equal(dateAllowed('2024-09-15',constraints),false);
  assert.equal(nearestDate('2024-08-15',constraints),'2024-09-03'); assert.equal(nearestDate('2024-09-07',constraints,-1),'2024-09-06');
  assert.equal(nearestDate('2024-09-02',{base:'2024-09-03',step:3},-1),'2024-08-31');
  assert.equal(nearestDate('2024-09-08',{min:'2024-09-10',max:'2024-09-01'}),null);
});

test('time parsing supports seconds and fractions without accepting impossible values',()=>{
  assert.equal(parseTime('09:35'),34500); assert.equal(parseTime('09:35:12.5'),34512.5);
  assert.equal(parseTime('24:00'),null); assert.equal(parseTime('9:30'),null); assert.equal(parseTime('23:60'),null);
  assert.equal(formatTime(34500),'09:35'); assert.equal(formatTime(34512.5),'09:35:12.5'); assert.equal(formatTime(34500,{seconds:true}),'09:35:00');
});

test('time options honor min-based steps, overnight ranges and nearest selection',()=>{
  const constraints = timeConstraints({min:'09:05',max:'10:10',step:900});
  const values = timeCandidates(constraints); assert.deepEqual(values.map(value=>formatTime(value)),['09:05','09:20','09:35','09:50','10:05']);
  assert.equal(timeAllowed(parseTime('09:15'),constraints),false); assert.equal(nearestTime(parseTime('09:16'),values),parseTime('09:20'));
  const overnight = timeConstraints({min:'22:00',max:'02:00',step:3600});
  assert.deepEqual(timeCandidates(overnight).map(value=>formatTime(value)),['00:00','01:00','02:00','22:00','23:00']);
  assert.equal(timeAllowed(parseTime('12:00'),overnight),false); assert.equal(timeAllowed(parseTime('23:30'),timeConstraints({step:'any'})),true);
});

test('seconds options and fractional typed values remain constrained and bounded',()=>{
  const seconds = timeConstraints({min:'09:00:05',max:'09:00:25',step:5});
  assert.deepEqual(timeCandidates(seconds).map(value=>formatTime(value,{seconds:true})),['09:00:05','09:00:10','09:00:15','09:00:20','09:00:25']);
  const fractional = timeConstraints({step:.5}); assert.equal(timeAllowed(parseTime('00:00:01.5'),fractional),true); assert.ok(timeCandidates(fractional).length <= 86400);
  assert.equal(timeAllowed(parseTime('00:00:01.25'),fractional),false);
});
