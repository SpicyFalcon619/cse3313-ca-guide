'use strict';

const mipsRegisters = '$zero $at $v0 $v1 $a0 $a1 $a2 $a3 $t0 $t1 $t2 $t3 $t4 $t5 $t6 $t7 $s0 $s1 $s2 $s3 $s4 $s5 $s6 $s7 $t8 $t9 $k0 $k1 $gp $sp $fp $ra'.split(' ');
const mipsFormats = {
  R: [['op', 6], ['rs', 5], ['rt', 5], ['rd', 5], ['shamt', 5], ['funct', 6]],
  I: [['op', 6], ['rs', 5], ['rt', 5], ['immediate', 16]],
  J: [['op', 6], ['address', 26]],
};
const mipsR = { sll: 0, srl: 2, jr: 8, mfhi: 16, mflo: 18, div: 26, add: 32, sub: 34, and: 36, or: 37, nor: 39, slt: 42 };
const mipsI = { beq: 4, bne: 5, addi: 8, slti: 10, andi: 12, ori: 13, lw: 35, sw: 43 };
const mipsJ = { j: 2, jal: 3 };
const lookupInstruction = (map, value) => Object.keys(map).find(key => map[key] === value);
const mipsBetween = (n, lo, hi) => Number.isSafeInteger(n) && n >= lo && n <= hi;
const isMemoryOp = op => op === 'lw' || op === 'sw';
const isBranchOp = op => op === 'beq' || op === 'bne';
const isShiftOp = op => op === 'sll' || op === 'srl';
const isMoveOp = op => op === 'mfhi' || op === 'mflo';
const isLogicalImmediate = op => op === 'andi' || op === 'ori';
const hex32 = value => '0x' + (value >>> 0).toString(16).toUpperCase().padStart(8, '0');

function integer(text, label, lo, hi) {
  const token = String(text).trim().toLowerCase();
  const sign = token.startsWith('-') ? -1 : 1;
  const magnitude = token.replace(/^[+-]/, '');
  const value = /^(?:\d+|0x[0-9a-f]+)$/.test(magnitude) ? sign * Number(magnitude) : NaN;
  if (!mipsBetween(value, lo, hi)) throw new Error(label + ' must be an integer from ' + lo + ' to ' + hi + '.');
  return value;
}

function byteAddress(text, label) {
  const value = integer(text, label, 0, 0xffffffff);
  if (value % 4) throw new Error(label + ' must be a multiple of 4.');
  return value;
}

function register(text) {
  const token = text.toLowerCase();
  const i = mipsRegisters.indexOf(token === '$s8' ? '$fp' : token);
  if (i !== -1) return i;
  if (/^\$\d+$/.test(token)) return integer(token.slice(1), 'Register number', 0, 31);
  throw new Error('Unknown register ' + text + '. Use a name like $t0 or a number like $8.');
}

function machineWord(type, values, assembly, explanation) {
  const fields = mipsFormats[type].map(([name, bits], index) => {
    const value = values[index];
    const raw = value < 0 ? value + 2 ** bits : value;
    return { name, bits, value, binary: raw.toString(2).padStart(bits, '0') };
  });
  const binary = fields.map(field => field.binary).join('');
  return { type, fields, binary, hex: hex32(parseInt(binary, 2)), assembly, explanation };
}

function encodeMips(text, pcText = 1000) {
  const pc = byteAddress(pcText, 'Instruction address');
  const match = /^([a-z]+)(?:\s+(.+))?$/i.exec(text.split('#')[0].trim());
  if (!match) throw new Error('Enter one assembly instruction, for example add $t0, $t1, $t2.');
  const op = match[1].toLowerCase();
  const args = (match[2] || '').split(',').map(arg => arg.trim());
  const need = n => {
    if (args.length !== n || args.some(arg => !arg)) throw new Error(op + ' expects ' + n + ' operand(s), separated by commas.');
  };
  if (Object.hasOwn(mipsR, op)) {
    let rs = 0, rt = 0, rd = 0, shamt = 0;
    if (op === 'jr') {
      need(1); rs = register(args[0]);
    } else if (isMoveOp(op)) {
      need(1); rd = register(args[0]);
    } else if (op === 'div') {
      need(2); [rs, rt] = args.map(register);
    } else if (isShiftOp(op)) {
      need(3); rd = register(args[0]); rt = register(args[1]); shamt = integer(args[2], 'Shift amount', 0, 31);
    } else {
      need(3); [rd, rs, rt] = args.map(register);
    }
    return machineWord('R', [0, rs, rt, rd, shamt, mipsR[op]], text.trim(), 'Opcode 0 selects the R format. The function code identifies ' + op + '. Unused fields are zero.');
  }
  if (Object.hasOwn(mipsI, op)) {
    let rs, rt, imm, note;
    if (isMemoryOp(op)) {
      need(2);
      const memory = /^([^()]*)\(\s*([^\s()]+)\s*\)$/.exec(args[1]);
      if (!memory) throw new Error('Use a byte offset and base register, for example 32($s0).');
      rt = register(args[0]); rs = register(memory[2]);
      imm = integer(memory[1] || '0', 'Byte offset', -32768, 32767);
      note = 'The memory offset is already in bytes, so the field stores ' + imm + ' directly.';
    } else if (isBranchOp(op)) {
      need(3); rs = register(args[0]); rt = register(args[1]);
      const target = byteAddress(args[2], 'Branch target');
      const next = (pc + 4) >>> 0;
      imm = ((target - next) | 0) / 4;
      if (!mipsBetween(imm, -32768, 32767)) throw new Error('Target is outside the signed 16-bit branch range from PC + 4.');
      note = '(' + target + ' − ' + next + ') / 4 = ' + imm + ' instruction words, using PC + 4 as the origin.';
      if (target - next !== imm * 4) note = 'Across the 32-bit address wrap, the signed displacement is ' + (imm * 4) + ' bytes, or ' + imm + ' instruction words.';
    } else {
      need(3); rt = register(args[0]); rs = register(args[1]);
      const unsigned = isLogicalImmediate(op);
      imm = integer(args[2], 'Immediate', unsigned ? 0 : -32768, unsigned ? 65535 : 32767);
      note = unsigned ? 'The logical instruction uses a zero-extended 16-bit immediate.' : 'The arithmetic instruction reads the immediate as a signed 16-bit value.';
    }
    return machineWord('I', [mipsI[op], rs, rt, imm], text.trim(), note);
  }
  if (Object.hasOwn(mipsJ, op)) {
    need(1);
    const target = byteAddress(args[0], 'Jump target');
    if ((target >>> 28) !== (((pc + 4) >>> 0) >>> 28)) throw new Error('The target must share the high 4 bits of PC + 4.');
    const field = (target & 0x0fffffff) >>> 2;
    return machineWord('J', [mipsJ[op], field], text.trim(), 'Discard the upper 4 bits and the final two zero bits of the aligned target. The 26-bit field is ' + field + '.');
  }
  throw new Error('This instruction is outside the supported set. See the instruction reference below the tool.');
}

function decodeMips(input, pcText = 1000) {
  const pc = byteAddress(pcText, 'Instruction address');
  const token = input.trim().replace(/^0x/i, '');
  if (!/^[\da-f]{8}$/i.test(token)) throw new Error('Enter eight hexadecimal digits, for example 012A4020.');
  const word = parseInt(token, 16);
  const opcode = word >>> 26;
  const rs = (word >>> 21) & 31, rt = (word >>> 16) & 31, rd = (word >>> 11) & 31;
  const shift = (word >>> 6) & 31, funct = word & 63;
  const raw = word & 65535;
  const reg = n => mipsRegisters[n];
  let op, asm;
  if (opcode === 0) {
    op = lookupInstruction(mipsR, funct);
    if (op === 'jr') asm = op + ' ' + reg(rs);
    else if (isMoveOp(op)) asm = op + ' ' + reg(rd);
    else if (op === 'div') asm = op + ' ' + [reg(rs), reg(rt)].join(', ');
    else if (isShiftOp(op)) asm = op + ' ' + [reg(rd), reg(rt), shift].join(', ');
    else if (op) asm = op + ' ' + [reg(rd), reg(rs), reg(rt)].join(', ');
  } else {
    op = lookupInstruction(mipsI, opcode);
    const imm = isLogicalImmediate(op) || raw < 32768 ? raw : raw - 65536;
    if (isMemoryOp(op)) asm = op + ' ' + reg(rt) + ', ' + imm + '(' + reg(rs) + ')';
    else if (isBranchOp(op)) asm = op + ' ' + [reg(rs), reg(rt), hex32(pc + 4 + imm * 4)].join(', ');
    else if (op) asm = op + ' ' + [reg(rt), reg(rs), imm].join(', ');
    else {
      op = lookupInstruction(mipsJ, opcode);
      if (op) asm = op + ' ' + hex32(((pc + 4) & 0xf0000000) | ((word & 0x03ffffff) << 2));
    }
  }
  if (!asm) throw new Error('No supported instruction uses this opcode and function code.');
  const decoded = encodeMips(asm, pc);
  if (decoded.hex !== hex32(word)) throw new Error('This word sets reserved bits for the supported instruction.');
  return decoded;
}

function modifiedImmediateBits(registers, words, opcode) {
  return words - opcode - 2 * Math.ceil(Math.log2(registers));
}


function memoryAddress(base, offset) {
  const start = integer(base, 'Base', 0, 0xffffffff);
  const displacement = integer(offset, 'Offset', -32768, 32767);
  const address = (start + displacement) >>> 0;
  if (address % 4) throw new Error('Address ' + address + ' is misaligned. lw and sw need a multiple of 4.');
  return address;
}

function storeWord(memory, address, value, order) {
  const word = integer(value, 'Word', -0x80000000, 0xffffffff) >>> 0;
  for (let byte = 0; byte < 4; byte++) {
    const shift = (order === 'big' ? 3 - byte : byte) * 8;
    memory.set(address + byte, (word >>> shift) & 255);
  }
}

function loadWord(memory, address, order) {
  let word = 0;
  for (let byte = 0; byte < 4; byte++) {
    const shift = (order === 'big' ? 3 - byte : byte) * 8;
    word |= (memory.get(address + byte) ?? 0) << shift;
  }
  return word >>> 0;
}

function memoryExample(order) {
  const memory = new Map();
  [1, 101, 10, 100].forEach((word, i) => storeWord(memory, i * 4, word, order));
  return memory;
}


const mipsProcedures = {
  call: {
    title: 'Call calculate(10)',
    description: 'Lecture 6 slide 8. The helper adds 5 to its argument.',
    source: [
      'addi $a0, $zero, 10', 'jal calculate', 'add $s0, $v0, $zero', 'j End',
      'calculate: addi $v0, $a0, 5', 'jr $ra', 'End:',
    ],
    initial: {},
  },
  save: {
    title: 'Save and restore $s0',
    description: 'Lecture 6 slides 9–14. The function changes $s0 while it works, then gives the caller its original value back.',
    source: [
      'jal calculate', 'j End', 'calculate: addi $sp, $sp, -4', 'sw $s0, 0($sp)',
      'addi $s0, $zero, 20', 'add $v0, $s0, $zero', 'lw $s0, 0($sp)', 'addi $sp, $sp, 4', 'jr $ra', 'End:',
    ],
    initial: { '$s0': 50 },
  },
  nested: {
    title: 'Call a helper from a function',
    description: 'The outer function saves its incoming return address before calling a helper. The helper adds 5.',
    source: [
      'addi $a0, $zero, 10', 'jal outer', 'add $s0, $v0, $zero', 'j End',
      'outer: addi $sp, $sp, -4', 'sw $ra, 0($sp)', 'jal helper', 'lw $ra, 0($sp)', 'addi $sp, $sp, 4', 'jr $ra',
      'helper: addi $v0, $a0, 5', 'jr $ra', 'End:',
    ],
    initial: {},
  },
  factorial: {
    title: 'Recursive fact(3)',
    description: 'Lecture 7 slides 54–63. Each call keeps its original n and return address in two stack words.',
    source: [
      'addi $a0, $zero, 3', 'jal fact', 'j End',
      'fact: addi $sp, $sp, -8', 'sw $ra, 4($sp)', 'sw $a0, 0($sp)', 'slti $t0, $a0, 1',
      'beq $t0, $zero, Recurse', 'addi $v0, $zero, 1', 'addi $sp, $sp, 8', 'jr $ra',
      'Recurse: addi $a0, $a0, -1', 'jal fact', 'lw $a0, 0($sp)', 'lw $ra, 4($sp)',
      'addi $sp, $sp, 8', 'mul $v0, $a0, $v0', 'jr $ra', 'End:',
    ],
    initial: {},
  },
};

function traceProcedure(key) {
  const demo = mipsProcedures[key];
  const registers = new Int32Array(32);
  const read = name => registers[register(name)];
  const write = (name, value) => { const index = register(name); if (index) registers[index] = value; };
  const start = 1000;
  write('$sp', start);
  for (const [name, value] of Object.entries(demo.initial)) write(name, value);
  const labels = new Map();
  const code = [];
  for (const line of demo.source) {
    const parts = line.split(':');
    if (parts.length > 1) labels.set(parts[0], start + 4 * code.length);
    const instruction = parts.at(-1).trim();
    if (instruction) code.push(instruction);
  }

  const memory = new Map();
  let pc = start;
  function snapshot(line, instruction, explanation) {
    const sp = read('$sp');
    const stack = [];
    for (let address = start - 4; address >= sp; address -= 4) stack.push({ address, value: memory.get(address) ?? null });
    return { pc, line, instruction, explanation, stack, registers: Object.fromEntries(mipsRegisters.map((name, index) => [name, registers[index]])) };
  }
  const steps = [snapshot(null, 'Ready', 'The program starts at address ' + pc + '. The stack has no active frame.')];

  while (pc !== labels.get('End') && steps.length < 200) {
    const line = pc;
    const instruction = code[(line - start) / 4];
    if (!instruction) throw new Error('The trace reached an address outside its example.');
    const [op, a, b, c] = instruction.split(/[,\s]+/);
    pc += 4;
    let note;
    switch (op) {
      case 'add':
      case 'addi':
      case 'slti':
      case 'mul': {
        const left = read(b);
        const right = c.startsWith('$') ? read(c) : Number(c);
        const result = op === 'slti' ? Number(left < right) : op === 'mul' ? left * right : left + right;
        write(a, result);
        if (a === '$sp') {
          if (result < left) {
            for (let address = result; address < left; address += 4) memory.delete(address);
          }
          note = 'Move $sp from ' + left + ' to ' + result + (result < left ? ' and reserve stack space.' : ' and release stack space.');
        } else {
          note = 'Set ' + a + ' to ' + result + '.';
        }
        break;
      }
      case 'sw':
      case 'lw': {
        const [, offset, base] = /^(-?\d+)\((\$\w+)\)$/.exec(b);
        const address = memoryAddress(read(base), offset);
        if (op === 'sw') {
          memory.set(address, read(a));
          note = 'Save ' + read(a) + ' from ' + a + ' in stack word ' + address + '.';
        } else {
          write(a, memory.get(address) ?? 0);
          note = 'Restore ' + a + ' to ' + read(a) + ' from stack word ' + address + '.';
        }
        break;
      }
      case 'beq': {
        const taken = read(a) === read(b);
        if (taken) pc = labels.get(c);
        note = taken ? 'The registers are equal. Branch to ' + pc + '.' : 'The registers differ. Continue at ' + pc + '.';
        break;
      }
      case 'j':
        pc = labels.get(a);
        note = 'Jump to ' + pc + '.';
        break;
      case 'jal': {
        const returnAddress = pc;
        write('$ra', returnAddress);
        pc = labels.get(a);
        note = 'Save return address ' + returnAddress + ' in $ra. Jump to ' + pc + '.';
        break;
      }
      case 'jr':
        pc = read(a);
        note = 'Jump back to the address in ' + a + ', ' + pc + '.';
        break;
      default:
        throw new Error('Unsupported instruction in trace: ' + op);
    }
    steps.push(snapshot(line, instruction, note));
  }
  if (pc !== labels.get('End')) throw new Error('The trace did not terminate.');
  return steps;
}

if (typeof module !== 'undefined') module.exports = { encodeMips, decodeMips, modifiedImmediateBits, hex32, memoryAddress, storeWord, loadWord, memoryExample, traceProcedure };
