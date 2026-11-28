'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const perf = require('../src/engine.js');
const { encodeMips } = require('../src/mips.js');

test('Tasmin Sanjida Content 03: clock rate and weighted CPI examples', () => {
  const cycles = 10 * 2e9 * 1.2;
  assert.equal(cycles / 6, 4e9);
  assert.deepEqual(perf.instructionMix([[2, 1], [1, 2], [2, 3]]), { count: 5, cycles: 10, cpi: 2 });
  assert.deepEqual(perf.instructionMix([[4, 1], [1, 2], [1, 3]]), { count: 6, cycles: 9, cpi: 1.5 });
});

test('Tasmin Sanjida Content 04: dynamic power and Amdahl examples', () => {
  assert.ok(Math.abs(perf.dynamicPowerRatio(0.85, 0.85, 0.85) - 0.52200625) < 1e-10);
  assert.equal(perf.improvedTime(80, 200, 20), 204);
  assert.equal(perf.requiredSpeedup(180, 100, 140), 4.5);
});

test('Tasmin Sanjida Content 08: worked R-format and stack store encodings', () => {
  const fields = assembly => encodeMips(assembly).fields.map(field => field.value);
  assert.deepEqual(fields('add $s1, $s2, $t1'), [0, 18, 9, 17, 0, 32]);
  assert.deepEqual(fields('srl $s1, $s2, 20'), [0, 0, 18, 17, 20, 2]);
  assert.deepEqual(fields('sw $ra, 0($sp)'), [43, 29, 31, 0]);
});
