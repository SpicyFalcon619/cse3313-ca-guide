'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const {decodeMips, encodeMips, loadWord, memoryAddress, modifiedImmediateBits, storeWord, traceProcedure} = require('../src/mips.js');

test('CT-2 course uses the Lectures 2–3 addition for computing and encoding', () => {
  const first = encodeMips('addi $t1, $zero, 5');
  const second = encodeMips('addi $t2, $zero, 3');
  assert.deepEqual(first.fields.map(field => field.value), [8, 0, 9, 5]);
  assert.deepEqual(second.fields.map(field => field.value), [8, 0, 10, 3]);
  const sum = first.fields[3].value + second.fields[3].value;
  assert.equal(sum, 8);
  assert.equal(sum - 5, 3);
  assert.equal(encodeMips('addi $t0, $t1, -5').fields[3].binary, '1111111111111011');
  assert.equal(decodeMips('0x012A4020').assembly, 'add $t0, $t1, $t2');
});

test('CT-2 course follows the same addition through four byte addresses and a store', () => {
  for (const order of ['big', 'little']) {
    const memory = new Map();
    const base = 100;
    storeWord(memory, base, 5, order);
    const secondAddress = memoryAddress(base, 4);
    const resultAddress = memoryAddress(base, 8);
    assert.equal(secondAddress, 104);
    assert.equal(resultAddress, 108);
    storeWord(memory, secondAddress, 3, order);
    assert.deepEqual([104, 105, 106, 107].map(address => memory.get(address)),
      order === 'big' ? [0, 0, 0, 3] : [3, 0, 0, 0]);
    storeWord(memory, resultAddress, loadWord(memory, base, order) + loadWord(memory, secondAddress, order), order);
    assert.equal(loadWord(memory, resultAddress, order), 8);
  }
  assert.deepEqual(encodeMips('sw $v0, 8($s0)').fields.map(field => field.value), [43, 16, 2, 8]);
});

test('CT-2 course covers negative branch displacement and the modified processors in Lecture 7', () => {
  assert.equal(encodeMips('bne $s1, $s2, 100', 108).fields[3].value, -3);
  assert.equal(encodeMips('j 100', 108).fields[1].value, 25);
  assert.equal(2 ** modifiedImmediateBits(16, 16, 3) / 2, 16);
  assert.equal(2 ** modifiedImmediateBits(256, 32, 6) - 1, 1023);
  assert.equal(2 ** modifiedImmediateBits(1000, 32, 6) - 2, 62);
  const trace = traceProcedure('factorial');
  assert.deepEqual([992, 984, 976, 968].map(address => trace.some(step => step.registers.$sp === address)), [true, true, true, true]);
});
