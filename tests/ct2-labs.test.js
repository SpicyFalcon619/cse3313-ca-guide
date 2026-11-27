'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { beginnerLab } = require('../src/ct2-labs.js');

test('register lab follows the lecture example and recomputes with edited inputs', () => {
  const original = beginnerLab('registers', [5, 3]);
  assert.deepEqual(original.steps.map(step => step.value), [5, 3, 8]);
  const changed = beginnerLab('registers', [-9, 4]);
  assert.equal(changed.steps[0].instruction, 'addi $t1, $zero, -9');
  assert.deepEqual(changed.steps[2].cells, [['$zero', 0], ['$t1', -9], ['$t2', 4], ['$t0', -5]]);
});

test('each shift recomputes the output bits and the next step reads the new value', () => {
  assert.deepEqual(beginnerLab('shifts', [5, 'left']).steps.map(step => step.cells[1][1]), ['00001010', '00010100']);
  assert.deepEqual(beginnerLab('shifts', [5, 'right']).steps.map(step => step.value), [2, 1]);
  assert.deepEqual(beginnerLab('shifts', [63, 'left']).steps.map(step => step.value), [126, 252]);
});

test('a load changes a register and only a store changes the output word', () => {
  const { steps } = beginnerLab('memory', [12, -5]);
  assert.deepEqual(steps.map(step => step.value), [12, -5, 7, 7]);
  assert.deepEqual(steps.map(step => step.cells[2][1]), [0, 0, 0, 7]);
  assert.equal(steps[2].writes, '$t0');
  assert.equal(steps[3].writes, 'A[2] · 108–111');
});

test('stack lab keeps the original value while the function uses the register', () => {
  const { steps } = beginnerLab('stack', [41, -6]);
  assert.deepEqual(steps.map(step => step.value), [996, 41, -6, 41, 1000]);
  assert.deepEqual(steps.map(step => step.cells[2][1]), ['Reserved', 41, 41, 41, 'Released']);
  assert.deepEqual(steps[4].cells, [['$sp', 1000], ['$s0', 41], ['Word at 996', 'Released']]);
});
