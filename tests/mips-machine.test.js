'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeMips, decodeMips, modifiedImmediateBits } = require('../src/mips.js');

const fields = (asm, pc) => encodeMips(asm, pc).fields.map(field => field.value);

test('Lecture 7 slides 7–11: R fields, padded binary and hex', () => {
  const add = encodeMips('add $t0, $t1, $t2');
  assert.equal(add.binary, '00000001001010100100000000100000');
  assert.equal(add.hex, '0x012A4020');
  assert.equal(decodeMips(add.hex).assembly, 'add $t0, $t1, $t2');
  assert.equal(encodeMips('sll $t0, $t1, 2').binary, '00000000000010010100000010000000');
  assert.equal(encodeMips('jr $ra').binary, '00000011111000000000000000001000');
  for (const [mnemonic, funct] of Object.entries({ sub: 34, and: 36, or: 37, nor: 39, slt: 42 })) {
    assert.deepEqual(fields(mnemonic + ' $t0, $t1, $t2'), [0, 9, 10, 8, 0, funct]);
  }
});

test('Lecture 7 slides 14–16: source order and 16-bit values', () => {
  assert.equal(encodeMips('addi $t0, $t1, 5').binary, '00100001001010000000000000000101');
  assert.deepEqual(fields('andi $s1, $s2, 223'), [12, 18, 17, 223]);
  assert.deepEqual(fields('ori $s1, $s2, 223'), [13, 18, 17, 223]);
  assert.equal(encodeMips('lw $s1, 200($s2)').binary, '10001110010100010000000011001000');
  assert.deepEqual(fields('sw $s1, 200($s2)'), [43, 18, 17, 200]);
});

test('Lecture 7 slides 17–19: branch reconstruction and jumps', () => {
  assert.deepEqual(fields('bne $s1, $s2, 1104', 1000), [5, 17, 18, 25]);
  assert.deepEqual(fields('beq $s1, $s2, 1104', 1000), [4, 17, 18, 25]);
  assert.equal(decodeMips('0x16320019', 1000).assembly, 'bne $s1, $s2, 0x00000450');
  assert.deepEqual(fields('j 2000'), [2, 500]);
  assert.deepEqual(fields('jal 10000'), [3, 2500]);
  assert.equal(decodeMips('080001f4').assembly, 'j 0x000007D0');
});

test('Lecture 7 slides 24, 26 and 28: compare each instruction in the three decimal tables', () => {
  const examples = [
    [104, 'slt $t0, $s1, $s2', [0,17,18,8,0,42]], [108, 'beq $t0, $zero, 124', [4,8,0,3]],
    [112, 'lw $t1, 32($s0)', [35,16,9,32]], [116, 'sll $t2, $t1, 10', [0,0,9,10,10,0]],
    [120, 'j 100', [2,25]], [128, 'add $v0, $a0, $ra', [0,4,31,2,0,32]],
    [104, 'bne $s0, $t8, 120', [5,16,24,3]], [108, 'sub $t3, $s1, $s5', [0,17,21,11,0,34]],
    [112, 'ori $t2, $t7, 42', [13,15,10,42]], [116, 'lw $t1, 20($t2)', [35,10,9,20]],
    [124, 'slt $t1, $s2, $s5', [0,18,21,9,0,42]], [128, 'j 100', [2,25]],
    [104, 'slt $t3, $t5, $s1', [0,13,17,11,0,42]], [108, 'bne $t3, $zero, 124', [5,11,0,3]],
    [112, 'sw $t5, 20($s4)', [43,20,13,20]], [116, 'j 100', [2,25]],
    [120, 'andi $t2, $s3, 30', [12,19,10,30]], [128, 'sub $t2, $a0, $s3', [0,4,19,10,0,34]],
  ];
  for (const [pc, asm, expected] of examples) {
    const encoded = encodeMips(asm, pc);
    assert.equal(encoded.binary.length, 32);
    assert.deepEqual(fields(asm, pc), expected);
    assert.deepEqual(decodeMips(encoded.hex, pc).fields.map(field => field.value), expected);
  }
});

test('Lecture 7 slides 29–36: field widths on hypothetical processors', () => {
  assert.equal(modifiedImmediateBits(16, 16, 3), 5);
  assert.equal(2 ** 5 / 2, 16);
  assert.equal(modifiedImmediateBits(256, 32, 6), 10);
  assert.equal(300 * 4, 1200);
  assert.equal(modifiedImmediateBits(1000, 32, 6), 6);
  assert.equal(2 ** 6 - 2, 62);
});

test('Reject invalid operands and decode signed values and jump regions', () => {
  assert.equal(decodeMips(encodeMips('lw $8, -4($29)').hex).assembly, 'lw $t0, -4($sp)');
  assert.deepEqual(fields('bne $s1, $s2, 1000', 1008), [5,17,18,-3]);
  assert.equal(decodeMips(encodeMips('j 0x1000000c', 0x10000000).hex, 0x10000000).assembly, 'j 0x1000000C');
  assert.throws(() => encodeMips('j 0x10000000', 1000), /high 4 bits/);
  assert.throws(() => encodeMips('beq $t0, $t1, 200000', 0), /branch range/);
  assert.throws(() => encodeMips('j 1001'), /multiple of 4/);
  assert.throws(() => encodeMips('sll $t0, $t1, 32'), /Shift amount/);
  assert.throws(() => encodeMips('ori $t0, $t1, -1'), /Immediate/);
  assert.throws(() => decodeMips('ffffffff'), /supported instruction/);
});
