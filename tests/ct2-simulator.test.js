'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { ct2SimulatorTopics } = require('../src/ct2-simulator-data.js');

function run(topic, example, ...values) {
  return ct2SimulatorTopics[topic].examples[example].run(...values);
}

const value = (step, label) => Object.fromEntries(step.cells)[label];

test('every simulator example has a complete trace with the default inputs', () => {
  for (const { examples } of ct2SimulatorTopics) {
    for (const example of examples) {
      const trace = example.run(...example.fields.map(field => field.value));
      assert.ok(trace.length >= 2, example.title);
      for (const step of trace) {
        assert.ok(step.title && step.explanation && step.cells.length, example.title);
        assert.equal(new Set(step.cells.map(([name]) => name)).size, step.cells.length);
        if (step.answer !== undefined) assert.ok(Number.isFinite(step.answer) && step.question, example.title);
      }
    }
  }
});

test('signed bits and bitwise examples distinguish a bit pattern from its value', () => {
  const signed = run(0, 2, -5, 8);
  assert.equal(value(signed[2], 'Bits'), '11111011');
  assert.equal(value(signed[2], 'Unsigned'), 251);
  assert.equal(value(signed[2], 'Signed'), -5);
  for (const [operation, expected] of [['and', 1], ['or', 7], ['nor', -8]]) {
    assert.equal(value(run(0, 4, 5, 3, operation).at(-1), '$t0'), expected);
  }
});

test('bitwise lesson examples show the immediate and the two writes in OR then NOT', () => {
  const and = run(0, 4, 5, 3, 'andi').at(-1);
  assert.equal(and.title, 'andi $t0, $t1, 3');
  assert.equal(value(and, '$t0'), 1);
  assert.equal(value(run(0, 4, 5, 3, 'ori').at(-1), '$t0'), 7);
  const [, or, invert] = run(0, 4, 3, 5, 'ori-not');
  assert.equal(or.title, 'ori $t1, $t0, 5');
  assert.equal(value(or, '$t1'), 7);
  assert.equal(invert.title, 'nor $t1, $t1, $zero');
  assert.equal(value(invert, '$t0'), 3);
  assert.equal(value(invert, '$t1'), -8);
  assert.equal(value(invert, 'Full 32-bit word'), '0xFFFFFFF8');
});

test('array addressing uses aligned bytes and changes byte order while preserving the value', () => {
  assert.deepEqual(run(1, 1, 100, 2, 258, 'big').at(-1).cells, [['108','00'], ['109','00'], ['110','01'], ['111','02'], ['$t2',258]]);
  assert.deepEqual(run(1, 1, 100, 2, 258, 'little').at(-1).cells, [['108','02'], ['109','01'], ['110','00'], ['111','00'], ['$t2',258]]);
  assert.throws(() => run(1, 1, 101, 0, 258, 'big'), /misaligned/);
});

test('branch selection and the first do-while pass change the trace', () => {
  assert.equal(value(run(2, 0, 5, 5, 'beq').at(-1), 'PC'), 1020);
  assert.equal(value(run(2, 0, 5, 6, 'beq').at(-1), 'PC'), 1004);
  assert.equal(value(run(2, 0, 5, 6, 'slt').at(-1), 'PC'), 1020);
  assert.equal(value(run(2, 1, 3, 3, 'while').at(-1), 'Total'), 0);
  assert.equal(value(run(2, 1, 3, 3, 'do-while').at(-1), 'Total'), 3);
});

test('function arguments flow through calls and size the recursive stack', () => {
  assert.equal(value(run(3, 0, 12).at(-1), '$s0'), 17);
  assert.equal(value(run(3, 2, -4).at(-1), '$s0'), 1);
  const recursion = run(3, 3, 7);
  assert.equal(value(recursion.at(-1), '$v0'), 5040);
  assert.equal(Math.min(...recursion.map(s => value(s, '$sp'))), 936);
});

test('encoding and modified instruction examples use the lecture field sizes', () => {
  assert.equal(value(run(4, 0, 'add $t0, $t1, $t2', 1000).at(-1), 'Hex'), '0x012A4020');
  assert.equal(run(4, 1, '0x012A4020', 1000).at(-1).title, 'add $t0, $t1, $t2');
  assert.equal(value(run(4, 2, 'bne $s1, $s2, 1104', 1000).at(-1), 'immediate · 16 bits'), '0000000000011001');
  assert.equal(value(run(4, 3, 16, 16, 3, 2, 'unsigned').at(-1), 'Elements reached'), 16);
  assert.equal(value(run(4, 3, 16, 16, 3, 2, 'signed').at(-1), 'Elements reached'), 8);
  assert.throws(() => run(4, 3, 32, 16, 6, 4, 'signed'), /all the instruction bits/);
});

test('practice traces show signed remainder and every written array index', () => {
  assert.equal(value(run(5, 0, -17, 32).at(-1), '$t3'), -17);
  assert.throws(() => run(5, 0, 5, 0), /other than zero/);
  assert.equal(value(run(5, 1, 2, 10).at(-1), 'Written indices'), '0, 2, 4');
  assert.equal(value(run(5, 2, 6, 7).at(-1), 'Product'), 42);
  assert.equal(value(run(5, 2, 15, 15).at(-1), 'Product'), 225);
});
