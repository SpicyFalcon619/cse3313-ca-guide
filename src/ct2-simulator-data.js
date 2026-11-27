'use strict';

const ct2SimulatorTopics = (() => {
  const core = typeof module === 'undefined' ? {
    beginnerLab, encodeMips, decodeMips, memoryAddress, storeWord, loadWord, modifiedImmediateBits, traceProcedure,
  } : { ...require('./mips.js'), ...require('./ct2-labs.js') };
  const num = (label, value, min, max) => ({ label, value, min, max });
  const text = (label, value) => ({ label, value });
  const choice = (label, value, options) => ({ label, value, options });
  const example = (title, lesson, fields, run) => ({ title, lesson, fields, run });
  const step = (title, explanation, cells = [], answer, question) => ({ title, explanation, cells, answer, question });
  const bits = (value, count) => (value >>> 0).toString(2).slice(-count).padStart(count, '0');

  function computer(a, b) {
    const expression = 'total = ' + a + ' + ' + b;
    const line = 'add $t0, $t1, $t2';
    const code = core.encodeMips(line);
    return [
      step('Open the program', 'Storage keeps the program while it is closed. The operating system loads the needed code and data into main memory.', [['Storage', expression], ['Main memory', 'Program ready']]),
      step('Fetch the instruction', 'The CPU fetches the instruction bits from memory. The program counter holds the instruction’s address.', [['PC', 1000], ['Instruction bits', code.binary]]),
      step('Decode the instruction', 'Control reads the bits to find the operation, the two source registers and the destination.', [['Operation', 'Add'], ['Reads', '$t1 and $t2'], ['Destination', '$t0']]),
      step('Execute the instruction', 'The datapath takes the two inputs, adds them and saves the result in $t0. A later instruction could send that result to the display.', [['$t1', a], ['$t2', b], ['$t0', a + b]], a + b, 'What value will the CPU write?'),
    ];
  }

  function lab(title, kind, lesson, fields) {
    return example(title, lesson, fields, (...values) => {
      const trace = core.beginnerLab(kind, values);
      return [
        step('Ready', 'These are the starting values. Use Next to run the first instruction.', trace.initial),
        ...trace.steps.map(s => step(s.instruction, s.explanation, s.cells, s.value, 'What number will go in ' + s.writes + '?')),
      ];
    });
  }

  function numbers(value, width) {
    const pattern = bits(value, width);
    const unsigned = parseInt(pattern, 2);
    const signed = pattern.startsWith('1') ? unsigned - 2 ** width : unsigned;
    const hex = '0x' + unsigned.toString(16).toUpperCase();
    return [
      step('Choose a width', 'Every extra bit doubles how many patterns fit. With ' + width + ' bits there are ' + 2 ** width + ' patterns.', [['Bits', width], ['Input', value]]),
      step('Write the bit pattern', 'Keep the low ' + width + ' bits. A negative value wraps into this width as two’s complement.', [['Bits', pattern], ['Input fits signed', value >= -(2 ** (width - 1)) && value < 2 ** (width - 1) ? 'Yes' : 'No'], ['Input fits unsigned', value >= 0 && value < 2 ** width ? 'Yes' : 'No']]),
      step('Read the same bits two ways', 'Unsigned counts every place positively. Signed gives the leftmost place a value of −' + 2 ** (width - 1) + '.', [['Bits', pattern], ['Unsigned', unsigned], ['Signed', signed]], signed, 'What is the signed value of these bits?'),
      step('Convert to hex', 'Group bits in fours from the right. Every group becomes one hex digit.', [['Binary', pattern], ['Hex', hex]]),
    ];
  }

  function bitwise(a, b, op) {
    const result = { and: a & b, or: a | b, nor: ~(a | b) }[op];
    const rows = [['First input', bits(a, 8)], ['Second input', bits(b, 8)]];
    const rules = { and: 'Only a column with two ones gives 1.', or: 'Any column with a one gives 1.', nor: 'A column gives 1 only when both inputs are zero.' };
    return [
      step('Line up the inputs', 'Read the two bit patterns one column at a time.', rows),
      step(op + ' $t0, $t1, $t2', rules[op] + ' The display shows the low eight bits. The signed result uses the full 32-bit word.', [...rows, ['Result bits', bits(result, 8)], ['$t0', result]], result, 'What signed number does ' + op + ' write?'),
    ];
  }

  function array(base, index, word, order) {
    const offset = index * 4;
    const address = core.memoryAddress(base, offset);
    const memory = new Map();
    core.storeWord(memory, address, word, order);
    const addresses = Array.from({ length: 4 }, (_, i) => [String(address + i), memory.get(address + i).toString(16).toUpperCase().padStart(2, '0')]);
    return [
      step('Identify A[i]', 'The index says how many words to skip. The base is where A[0] begins.', [['Base address', base], ['Index', index]]),
      step('sll $t0, $t1, 2', 'Multiply i by four to convert the index to a byte offset.', [['Byte offset', offset]], offset, 'How many bytes do you move from the base?'),
      step('add $t0, $s0, $t0', 'Add the base and the offset to obtain the address of A[i].', [['Base address', base], ['Byte offset', offset], ['Effective address', address]], address, 'What byte address begins A[i]?'),
      step('lw $t2, 0($t0)', 'Read these four bytes in ' + order + '-endian order. The byte cells show hex.', [...addresses, ['$t2', core.loadWord(memory, address, order) | 0]]),
    ];
  }

  function branch(a, b, op) {
    const compared = op === 'slt';
    const taken = op === 'beq' ? a === b : op === 'bne' ? a !== b : a < b;
    const next = taken ? 1020 : 1004;
    const values = [['$s0', a], ['$s1', b], ['PC', 1000]];
    if (compared) return [
      step('Read the two values', 'slt asks if the first source is smaller than the second.', values),
      step('slt $t0, $s0, $s1', 'Write 1 if the comparison is true, otherwise 0. The next line is still at 1004.', [['$t0', Number(taken)], ['PC', 1004]], Number(taken), 'Which number does slt write?'),
      step('bne $t0, $zero, Less', 'Use the comparison result in a separate branch. If it is 1, go to the label at 1020.', [['PC', taken ? 1020 : 1008]], taken ? 1020 : 1008, 'What address runs next?'),
    ];
    return [
      step('Read the branch at 1000', 'The label Target is at 1020. The following line is at 1004.', values),
      step(op + ' $s0, $s1, Target', (op === 'beq' ? 'Branch when the values are equal. ' : 'Branch when the values are different. ') + (taken ? 'Take the branch to 1020.' : 'Continue at 1004.'), [['PC', next], ['Branch', taken ? 'Taken' : 'Fall through']], next, 'What address runs next?'),
    ];
  }

  function loop(start, limit, type) {
    let i = start;
    let total = 0;
    const state = () => [['i', i], ['Total', total], ['Limit', limit]];
    const starts = {
      while: 'while (i < limit)',
      for: 'for (i = start; i < limit; i++)',
      'do-while': 'do { work } while (i < limit)',
    };
    const steps = [step(starts[type], (type === 'do-while' ? 'Run the body before checking i. ' : 'Check i before running the body. ') + 'The body adds i to the total. Each pass increases i by one.', state())];
    const body = () => {
      total += i;
      steps.push(step('add $t2, $t2, $t0', 'Add ' + i + ' to the running total.', state(), total, 'What is the new total?'));
      i++;
      steps.push(step('addi $t0, $t0, 1', 'Add one to i before repeating.', state(), i, 'What is the new value of i?'));
    };
    if (type === 'do-while') body();
    for (;;) {
      const keepGoing = i < limit;
      steps.push(step('slt $t1, $t0, $s0', i + (keepGoing ? ' is below ' : ' has reached or passed ') + limit + (keepGoing ? '. Run the body.' : '. The loop is finished.'), [...state(), ['$t1', Number(keepGoing)]], Number(keepGoing), 'Does the comparison give 1 or 0?'));
      if (!keepGoing) break;
      body();
    }
    return steps;
  }

  function procedure(key) {
    return argument => {
      return core.traceProcedure(key, { argument }).map(s => {
        const regs = [['PC', s.pc], ['$sp', s.registers.$sp], ['$ra', s.registers.$ra], ['$a0', s.registers.$a0], ['$v0', s.registers.$v0], ['$s0', s.registers.$s0], ['$t0', s.registers.$t0]];
        const stack = s.stack.map(w => ['Stack · ' + w.address, w.value ?? 'Reserved']);
        return step(s.line === null ? 'Ready' : s.line + '  ' + s.instruction, s.explanation, [...regs, ...stack], s.line === null ? undefined : s.pc, 'What address will the CPU run next?');
      });
    };
  }

  function divide(a, b) {
    if (b === 0) throw new Error('Choose a divisor other than zero.');
    const q = Math.trunc(a / b);
    const r = a % b;
    const cells = [['LO', q], ['HI', r]];
    return [
      step('Load the two inputs', 'Integer division gives a quotient and a remainder.', [['$t0', a], ['$t1', b]]),
      step('div $t0, $t1', 'Divide toward zero. The remainder is what is left after subtracting ' + q + ' × ' + b + ' from ' + a + '.', cells, q, 'What quotient goes in LO?'),
      step('mflo $t2', 'Copy the quotient from LO into a regular register.', [...cells, ['$t2', q]], q, 'What number goes in $t2?'),
      step('mfhi $t3', 'Copy the remainder from HI into a regular register.', [...cells, ['$t2', q], ['$t3', r]], r, 'What number goes in $t3?'),
    ];
  }

  function encoding(source, pc, decode = false) {
    const word = decode ? core.decodeMips(source, pc) : core.encodeMips(source, pc);
    const items = [['PC', pc], ['Format', word.type]];
    const steps = [step(decode ? word.hex : word.assembly, decode ? 'Expand each hex digit to four bits, then identify the format from the opcode.' : 'First identify the format and put each operand in its field.', items)];
    word.fields.forEach(field => {
      items.push([field.name + ' · ' + field.bits + ' bits', field.binary]);
      steps.push(step(field.name, 'Write decimal ' + field.value + ' in exactly ' + field.bits + ' bits.', [...items], field.value, 'What decimal value goes in ' + field.name + '?'));
    });
    steps.push(step(word.assembly, word.explanation, [...items, ['Complete binary', word.binary], ['Hex', word.hex]]));
    return steps;
  }

  function widths(regs, size, op, bytes, interpretation) {
    const registerBits = Math.ceil(Math.log2(regs));
    const remain = core.modifiedImmediateBits(regs, size, op);
    if (remain < 1) throw new Error('These fields use all the instruction bits. Increase the instruction size or use fewer registers.');
    const max = 2 ** (remain - (interpretation === 'signed' ? 1 : 0)) - 1;
    const count = Math.floor(max / bytes) + 1;
    return [
      step('Count names', 'Use the smallest bit count that can name all ' + regs + ' registers.', [['Registers', regs], ['Bits per register', registerBits]], registerBits, 'How many bits name one register?'),
      step('Subtract the fields already used', size + ' − ' + op + ' − ' + registerBits + ' − ' + registerBits + ' leaves the immediate field.', [['Immediate bits', remain]], remain, 'How many bits remain?'),
      step('Find the largest forward offset', 'Read the field as ' + interpretation + '. Count from zero when listing array element starts.', [['Maximum offset', max], ['Last aligned start', (count - 1) * bytes], ['Elements reached', count]], count, 'How many aligned element starts can you reach?'),
    ];
  }

  function fill(n, a) {
    const array = [];
    const value = ~(a & n);
    const state = () => [['i', array.length], ['n', n], ['a', a], ['Written indices', array.join(', ') || 'None']];
    const steps = [step('Set up the function', 'Start i at 0. The loop writes ~(a & n) into arr[i*2] while i ≤ n.', state())];
    for (let i = 0; i <= n; i++) {
      const offset = i * 8;
      steps.push(step('sll $t1, $a0, 3', 'Index ' + 2 * i + ' times four bytes gives byte offset ' + offset + '.', [...state(), ['Offset', offset]], offset, 'What is the byte offset from the array base?'));
      array.push(2 * i);
      steps.push(step('sw $t2, 0($t1)', 'After adding the base, store ' + value + ' in arr[' + 2 * i + ']. Then increase i by one.', [...state(), ['Stored value', value]], value, 'What value will be stored?'));
    }
    steps.push(step('jr $ra', 'Copy a to $v0 and restore the caller’s saved register before returning.', [...state(), ['$v0', a]], a, 'What value is returned?'));
    return steps;
  }

  function multiply(left, right) {
    let packed = right;
    const halves = () => [['High four bits', bits(packed >>> 4, 4)], ['Low four bits', bits(packed, 4)]];
    const steps = [step('Start with the multiplier', 'Put ' + right + ' in the low half and zero in the high half.', halves())];
    for (let i = 0; i < 4; i++) {
      const lastBit = packed & 1;
      if (lastBit) packed += left << 4;
      packed >>>= 1;
      steps.push(step('Test bit, then shift right', (lastBit ? 'Add ' + left + ' to the high half. ' : 'Skip the addition. ') + 'Shift both halves together and carry any overflow into the shift.', halves()));
    }
    steps.push(step('Read the product', 'Read the high and low halves together as one unsigned number.', [...halves(), ['Product', packed]], packed, 'What product did the four steps produce?'));
    return steps;
  }

  const small = (label, value) => num(label, value, -99, 99);
  const shiftDir = choice('Direction', 'left', [['left', 'Left (sll)'], ['right', 'Right (srl)']]);
  const pc = num('Instruction address (PC)', 1000, 0, 0xfffffffc);
  return [
    { name: 'Registers and bits', examples: [
      lab('Add two values with addi and add', 'registers', 'ct2-registers', [small('First number', 5), small('Second number', 3)]),
      example('Follow an instruction through the CPU', 'ct2-computer', [small('First number', 5), small('Second number', 3)], computer),
      example('Binary, signed numbers and hex', 'ct2-signed', [num('Number', -5, -32768, 65535), num('Bit width', 8, 2, 16)], numbers),
      lab('Logical left and right shifts', 'shifts', 'ct2-shifts', [num('Starting number', 5, 0, 63), shiftDir]),
      example('AND, OR and NOR', 'ct2-shifts', [num('First number', 5, 0, 255), num('Second number', 3, 0, 255), choice('Operation', 'and', [['and', 'AND'], ['or', 'OR'], ['nor', 'NOR']])], bitwise),
    ] },
    { name: 'Memory and arrays', examples: [
      lab('Load two words, add and store', 'memory', 'ct2-memory', [small('Value at A[0]', 5), small('Value at A[1]', 3)]),
      example('Find an array address and read its bytes', 'ct2-arrays', [num('Base address', 100, 0, 65532), num('Index', 1, 0, 32), num('Value stored at A[i]', 258, -2147483648, 2147483647), choice('Byte order', 'big', [['big', 'Big-endian'], ['little', 'Little-endian']])], array),
    ] },
    { name: 'Branches and loops', examples: [
      example('Compare registers and choose the next PC', 'ct2-logic', [small('First value', 5), small('Second value', 5), choice('Operation', 'beq', [['beq', 'Branch if equal (beq)'], ['bne', 'Branch if different (bne)'], ['slt', 'Set if less than (slt)']])], branch),
      example('Trace a while, for, or do-while loop', 'ct2-loops', [num('Starting i', 0, 0, 8), num('Stop at', 3, 0, 8), choice('Loop type', 'while', [['while', 'while'], ['for', 'for'], ['do-while', 'do-while']])], loop),
    ] },
    { name: 'Functions and the stack', examples: [
      example('Call a function and return', 'ct2-call', [small('Argument', 10)], procedure('call')),
      lab('Save and restore a register', 'stack', 'ct2-stack', [small('Original $s0', 50), small('Working value', 8)]),
      example('Save a return address across a nested call', 'ct2-nested', [small('Argument', 10)], procedure('nested')),
      example('Trace recursive factorial', 'ct2-recursion', [num('Factorial input', 3, 0, 7)], procedure('factorial')),
    ] },
    { name: 'Machine code', examples: [
      example('Encode R, I or J instructions', 'ct2-encode', [text('Assembly instruction', 'add $t0, $t1, $t2'), pc], encoding),
      example('Decode a hexadecimal word', 'ct2-encode', [text('Hexadecimal word', '0x012A4020'), pc], (source, address) => encoding(source, address, true)),
      example('Encode a branch or jump target', 'ct2-targets', [text('Instruction with a numeric target', 'bne $s1, $s2, 1104'), pc], encoding),
      example('Change the instruction format', 'ct2-widths', [num('Registers', 16, 1, 65536), num('Instruction bits', 16, 4, 32), num('Opcode bits', 3, 1, 16), num('Bytes per array element', 2, 1, 8), choice('Offset interpretation', 'unsigned', [['unsigned', 'Unsigned'], ['signed', 'Signed']])], widths),
    ] },
    { name: 'Exam practice', examples: [
      example('Divide and read HI and LO', 'ct2-division', [small('Dividend', 45), small('Divisor', 32)], divide),
      example('Translate an array-writing function', 'ct2-translation', [num('Loop limit n', 2, 0, 8), small('Value of a', 10)], fill),
      example('Unsigned shift-and-add multiplication', 'midterm-multiply', [num('Multiplicand', 6, 0, 15), num('Multiplier', 7, 0, 15)], multiply),
    ] },
  ];
})();

if (typeof module !== 'undefined') module.exports = { ct2SimulatorTopics };
