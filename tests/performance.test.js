'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const math = require('../src/engine.js');

function approximately(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * 1e-10, actual + ' differs from ' + expected);
}

test('Lecture 4 slides 6 and 9–10: speed and elapsed time measure different things', () => {
  assert.equal(math.speedup(15, 10), 1.5);
  assert.deepEqual(math.elapsed(5, 1, 4), { cpu: 6, elapsed: 10 });
});

test('Lecture 4 slides 13–21: period, execution time and required rate', () => {
  assert.equal(math.clockPeriod(4e9), 0.25e-9);
  approximately(100 * math.clockPeriod(0.5e9), 200e-9);
  assert.equal(math.cpuTime(100, 1e9), 100e-9);
  assert.equal(math.cpuTime(150, 2e9), 75e-9);
  assert.equal(10 * 2e9 * 1.2 / 6, 4e9);
});

test('Lecture 4 slides 24–33: cycles, weighted CPI and time', () => {
  const cycles = math.clockCycles(1000, 2);
  assert.equal(cycles, 2000);
  assert.equal(math.cpuTime(cycles, 1e9), 2e-6);
  assert.deepEqual(math.instructionMix([[4, 1], [2, 2], [4, 3]]), { count: 10, cycles: 20, cpi: 2 });
  assert.deepEqual(math.instructionMix([[4, 1], [1, 2], [1, 3]]), { count: 6, cycles: 9, cpi: 1.5 });
  assert.equal(math.speedup(500 * 1.2, 250 * 2), 1.2);
});

test('Lecture 4 slides 42 and 74: voltage and compiler changes', () => {
  approximately(math.dynamicPowerRatio(1, 0.85, 1), 0.7225);
  approximately(math.scaledCpuTime(15, 0.6, 1.1), 9.9);
});

test('Lecture 4 slides 49–53 and Midterm 212 Q1: Amdahl limits', () => {
  assert.equal(math.improvedTime(80, 20, 2), 60);
  assert.equal(math.speedup(100, 60), 5 / 3);
  assert.equal(math.speedup(100, 20), 5);
  assert.equal(math.requiredSpeedup(80, 20, 20), Infinity);
  assert.equal(math.improvedTime(2, 98, 2), 99);
  assert.equal(math.requiredSpeedup(110, 240, 175), Infinity);
});

test('Lecture 4 slides 68–71: instruction rate can disagree with time', () => {
  const rate = 4e9;
  assert.equal(math.mips(rate, 1), 4000);
  assert.equal(Math.round(math.mips(rate, 1.1)), 3636);
  assert.equal(math.cpuTime(math.clockCycles(10e9, 1), rate), 2.5);
  assert.equal(math.cpuTime(math.clockCycles(8e9, 1.1), rate), 2.2);
  assert.equal(Math.round(math.speedup(180, 295) * 100), 61);
});

test('Instructor CT-1 key: 22 cycles, 11 ns, CPI 5.5 and 1.375× overall', () => {
  const mix = math.instructionMix([[4, 1], [2, 3], [2, 4], [2, 2]]);
  assert.equal(mix.count, 10);
  assert.equal(mix.cycles, 22);
  const timeA = math.cpuTime(mix.cycles, 2e9);
  assert.equal(timeA, 11e-9);
  approximately(timeA / 2 * 10e9 / mix.count, 5.5);
  assert.equal(math.improvedTime(6, 5, 2), 8);
  assert.equal(math.speedup(11, 8), 1.375);
});
