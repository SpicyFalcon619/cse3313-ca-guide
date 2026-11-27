'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeMips, memoryExample, storeWord, loadWord, traceProcedure } = require('../src/mips.js');

test('Summer 2017 Q2(b) and Q3(b): correct reference fields and byte order', () => {
  assert.equal(encodeMips('srl $8, $9, 15').hex, '0x000943C2');
  assert.equal(encodeMips('lw $16, 400($12)').hex, '0x8D900190');
  const bytes = memoryExample('big');
  storeWord(bytes, 0, '0x04F3BA71', 'big');
  assert.deepEqual([0, 1, 2, 3].map(i => bytes.get(i)), [4, 0xf3, 0xba, 0x71]);
  assert.equal(loadWord(bytes, 0, 'little'), 0x71baf304);
});

test('Summer 2021 Q2: branch from 1024 to 1056, then maximum J field', () => {
  assert.deepEqual(encodeMips('beq $s1, $t1, 1056', 1024).fields.map(f => f.value), [4, 17, 9, 7]);
  assert.equal(encodeMips('j 0x0ffffffc', 0).hex, '0x0BFFFFFF');
});

test('Spring 2025 Q2: signed branch field and div/mfhi', () => {
  assert.equal(encodeMips('div $t0, $t1').hex, '0x0109001A');
  assert.equal(encodeMips('mfhi $t2').hex, '0x00005010');
  assert.equal((2 ** 9 - 1) * 4, 2044);
});

test('Lecture 7 negative immediate and Lecture 6 recursive frame return', () => {
  const word = encodeMips('addi $sp, $sp, -4');
  assert.equal(word.fields.at(-1).binary, '1111111111111100');
  assert.equal(word.hex, '0x23BDFFFC');
  const trace = traceProcedure('factorial');
  const base = trace.find(step => step.stack.length === 8);
  assert.equal(base.registers.$sp, 968);
  assert.equal(trace.at(-1).pc, 1072);
});
