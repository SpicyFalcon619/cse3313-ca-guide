'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { traceProcedure } = require('../src/mips.js');

test('Lecture 6 slide 8: jal at 1004 saves 1008, then jr returns from 1020', () => {
  const trace = traceProcedure('call');
  const call = trace.find(step => step.line === 1004);
  assert.equal(call.registers.$a0, 10);
  assert.equal(call.registers.$ra, 1008);
  assert.equal(call.pc, 1016);
  const back = trace.find(step => step.line === 1020);
  assert.equal(back.pc, 1008);
  assert.equal(back.registers.$v0, 15);
  assert.equal(trace.at(-1).registers.$s0, 15);
});

test('Lecture 6 slides 9–14: save 50 at address 996, then restore sp and s0', () => {
  const trace = traceProcedure('save');
  const save = trace.find(step => step.instruction === 'sw $s0, 0($sp)');
  assert.equal(save.registers.$sp, 996);
  assert.deepEqual(save.stack, [{ address: 996, value: 50 }]);
  assert.equal(trace.at(-1).registers.$s0, 50);
  assert.equal(trace.at(-1).registers.$sp, 1000);
  assert.equal(trace.at(-1).stack.length, 0);
});

test('Nested call restores the original return address after jal changes it', () => {
  const trace = traceProcedure('nested');
  const call = trace.find(step => step.instruction === 'jal helper');
  const restore = trace.find(step => step.instruction === 'lw $ra, 0($sp)');
  assert.equal(call.registers.$ra, 1028);
  assert.equal(restore.registers.$ra, 1008);
  assert.equal(trace.at(-1).registers.$s0, 15);
  assert.equal(trace.at(-1).registers.$sp, 1000);
});

test('Lecture 7 slides 55–63: fact(3) peaks at 32 bytes and unwinds to 6', () => {
  const trace = traceProcedure('factorial');
  assert.equal(Math.max(...trace.map(step => step.stack.length)) * 4, 32);
  assert.deepEqual(trace.filter(step => step.instruction.startsWith('mul')).map(step => step.registers.$v0), [1,2,6]);
  assert.equal(trace.at(-1).registers.$v0, 6);
  assert.equal(trace.at(-1).stack.length, 0);
  assert.equal(trace.at(-1).registers.$sp, 1000);
});
