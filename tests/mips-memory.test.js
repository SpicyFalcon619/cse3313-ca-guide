'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { memoryAddress, memoryExample, loadWord, storeWord } = require('../src/mips.js');

test('Lecture 5 slides 1–2: four byte addresses per word, load 101, then replace 10', () => {
  const memory = memoryExample('big');
  assert.deepEqual([0,4,8,12].map(address => loadWord(memory, address, 'big')), [1,101,10,100]);
  const value = loadWord(memory, memoryAddress(0, 4), 'big');
  assert.equal(value, 101);
  assert.deepEqual([4,5,6,7].map(address => memory.get(address)), [0,0,0,101]);
  storeWord(memory, memoryAddress(0, 8), value, 'big');
  assert.equal(loadWord(memory, 8, 'big'), 101);
});

test('Lecture 5 slides 3, 5–10 and 22: address space and fixed/variable array offsets', () => {
  assert.equal(memoryAddress(0xffffffff - 3, 0), 0xfffffffc);
  for (const [index, offset] of [[8,32], [12,48], [10,40], [5,20]]) {
    assert.equal(index << 2, offset);
    assert.equal(memoryAddress(1000, offset) - 1000, offset);
  }
  assert.throws(() => memoryAddress(0, 6), /misaligned/);
  assert.throws(() => memoryAddress(0, 32768), /Offset/);
});

test('Patterson and Hennessy Exercise 2.7: byte order leaves the stored word width fixed', () => {
  const memory = new Map();
  storeWord(memory, 0, '0xABCDEF12', 'big');
  assert.deepEqual([...memory.values()], [0xab, 0xcd, 0xef, 0x12]);
  assert.equal(loadWord(memory, 0, 'little'), 0x12efcdab);
  storeWord(memory, 0, '0xABCDEF12', 'little');
  assert.deepEqual([...memory.values()], [0x12, 0xef, 0xcd, 0xab]);
  assert.equal(loadWord(memory, 0, 'little'), 0xabcdef12);
});
