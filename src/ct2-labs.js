'use strict';

const beginnerLabInputs = {
  registers: [
    ['First number', 5, -99, 99],
    ['Second number', 3, -99, 99],
  ],
  shifts: [
    ['Starting number', 5, 0, 63],
    ['Direction', 'left', ['left', 'right']],
  ],
  memory: [
    ['Value at A[0]', 5, -99, 99],
    ['Value at A[1]', 3, -99, 99],
  ],
  stack: [
    ['Original value in $s0', 50, -99, 99],
    ['Value used by the function', 8, -99, 99],
  ],
};

function beginnerLab(kind, [first, second]) {
  const step = (instruction, reads, writes, value, explanation, cells) =>
    ({ instruction, reads, writes, value, explanation, cells });

  const registers = (t1, t2, t0) => [['$zero', 0], ['$t1', t1], ['$t2', t2], ['$t0', t0]];
  if (kind === 'registers') {
    const sum = first + second;
    return {
      initial: registers(0, 0, 0),
      steps: [
        step('addi $t1, $zero, ' + first, '$zero and ' + first, '$t1', first,
          'The CPU reads 0 from $zero and adds ' + first + ' from the instruction. It writes ' + first + ' to $t1.', registers(first, 0, 0)),
        step('addi $t2, $zero, ' + second, '$zero and ' + second, '$t2', second,
          'The CPU reads 0 from $zero and adds ' + second + ' from the instruction. It writes ' + second + ' to $t2.', registers(first, second, 0)),
        step('add $t0, $t1, $t2', '$t1 and $t2', '$t0', sum,
          '$t1 supplies ' + first + ' and $t2 supplies ' + second + '. The CPU writes their sum, ' + sum + ', to $t0. The two inputs keep their values.', registers(first, second, sum)),
      ],
    };
  }

  if (kind === 'shifts') {
    const left = second === 'left';
    const opcode = left ? 'sll' : 'srl';
    const shift = value => left ? value << 1 : value >>> 1;
    const once = shift(first);
    const twice = shift(once);
    const bits = value => value.toString(2).padStart(8, '0');
    const cells = value => [['$t1', value], ['Low 8 bits', bits(value)]];
    const explain = (old, value) => bits(old) + ' becomes ' + bits(value) + '. A zero enters on the ' +
      (left ? 'right' : 'left') + '. The value becomes ' + value + '.';
    return {
      initial: cells(first),
      steps: [
        step(opcode + ' $t1, $t1, 1', '$t1 and a shift of 1', '$t1', once, explain(first, once), cells(once)),
        step(opcode + ' $t1, $t1, 1', '$t1 and a shift of 1', '$t1', twice, explain(once, twice), cells(twice)),
      ],
    };
  }

  if (kind === 'memory') {
    const sum = first + second;
    const cells = (t1, t2, t0, result) => [
      ['A[0] · 100–103', first], ['A[1] · 104–107', second], ['A[2] · 108–111', result],
      ['$t1', t1], ['$t2', t2], ['$t0', t0],
    ];
    return {
      initial: cells(0, 0, 0, 0),
      steps: [
        step('lw $t1, 0($s0)', 'Memory at 100 + 0', '$t1', first,
          'Read A[0] at bytes 100–103 and copy ' + first + ' into $t1.', cells(first, 0, 0, 0)),
        step('lw $t2, 4($s0)', 'Memory at 100 + 4', '$t2', second,
          'Read A[1] at bytes 104–107 and copy ' + second + ' into $t2.', cells(first, second, 0, 0)),
        step('add $t0, $t1, $t2', '$t1 and $t2', '$t0', sum,
          'Add ' + first + ' and ' + second + ' in the CPU. The sum goes to $t0. A[2] still holds 0.', cells(first, second, sum, 0)),
        step('sw $t0, 8($s0)', '$t0', 'A[2] · 108–111', sum,
          'Copy ' + sum + ' from $t0 into A[2] at bytes 108–111. $t0 keeps the same value.', cells(first, second, sum, sum)),
      ],
    };
  }

  const cells = (pointer, value, slot) => [['$sp', pointer], ['$s0', value], ['Word at 996', slot]];
  return {
    initial: cells(1000, first, 'Free'),
    steps: [
      step('addi $sp, $sp, -4', '$sp and −4', '$sp', 996,
        '1000 − 4 = 996. The function now has room for one word at bytes 996–999.', cells(996, first, 'Reserved')),
      step('sw $s0, 0($sp)', '$s0', 'Word at 996', first,
        'Copy the original value, ' + first + ', into the reserved word.', cells(996, first, first)),
      step('addi $s0, $zero, ' + second, '$zero and ' + second, '$s0', second,
        'The function writes ' + second + ' to $s0. The saved word still holds ' + first + '.', cells(996, second, first)),
      step('lw $s0, 0($sp)', 'Word at 996', '$s0', first,
        'Read the saved ' + first + ' from the slot. The caller’s original value is back in $s0.', cells(996, first, first)),
      step('addi $sp, $sp, 4', '$sp and 4', '$sp', 1000,
        '996 + 4 = 1000. The function releases the slot. Its old contents may still be in memory.', cells(1000, first, 'Released')),
    ],
  };
}

if (typeof module !== 'undefined') module.exports = { beginnerLab };

if (typeof document !== 'undefined') document.querySelectorAll('[data-beginner-lab]').forEach(lab => {
  const kind = lab.dataset.beginnerLab;
  const get = name => lab.querySelector('[data-lab-' + name + ']');
  const controls = get('inputs');
  const setup = beginnerLabInputs[kind].map(([text, value, limits, max], index) => {
    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.id = 'ct2-lab-' + kind + '-input-' + index;
    caption.textContent = text;
    const input = document.createElement(Array.isArray(limits) ? 'select' : 'input');
    input.setAttribute('aria-labelledby', caption.id);
    if (Array.isArray(limits)) {
      limits.forEach(choice => input.add(new Option(choice === 'left' ? 'Left (sll)' : 'Right (srl)', choice)));
    } else {
      input.type = 'number';
      input.min = limits;
      input.max = max;
      input.required = true;
    }
    input.value = value;
    label.append(caption, input);
    controls.append(label);
    return input;
  });
  const prediction = get('prediction');
  const feedback = get('feedback');
  const run = get('run');
  let trace;
  let position;

  function render() {
    const next = trace.steps[position];
    const last = trace.steps[position - 1];
    const cells = last ? last.cells : trace.initial;
    get('program').hidden = false;
    get('cells').hidden = false;
    get('count').textContent = position + ' of ' + trace.steps.length + ' instructions run';
    get('next').hidden = !next;
    get('ask').hidden = !next;
    get('back').disabled = position === 0;
    run.hidden = !next;
    get('program').replaceChildren(...trace.steps.map((item, index) => {
      const li = document.createElement('li');
      if (index === position) li.setAttribute('aria-current', 'step');
      const code = document.createElement('code');
      code.textContent = item.instruction;
      li.append(code);
      return li;
    }));
    if (next) {
      get('reads').textContent = next.reads;
      get('writes').textContent = next.writes;
      get('question').textContent = 'What number will go in ' + next.writes + '? (optional)';
    }
    get('cells').replaceChildren(...cells.map(([label, value]) => {
      const panel = document.createElement('span');
      if (last && last.writes === label) panel.className = 'foundation-active';
      const name = document.createElement('small');
      name.textContent = label;
      const amount = document.createElement('strong');
      if (label === 'Low 8 bits') {
        amount.className = 'beginner-bit-row';
        amount.setAttribute('aria-label', String(value));
        [...value].forEach((bit, index) => {
          const cell = document.createElement('span');
          cell.textContent = bit;
          if (last && index === (last.instruction.startsWith('sll') ? 7 : 0)) cell.className = 'beginner-incoming-bit';
          amount.append(cell);
        });
      } else {
        amount.textContent = value;
      }
      panel.append(name, amount);
      return panel;
    }));
  }

  function restart() {
    position = 0;
    prediction.value = '';
    feedback.textContent = '';
    const invalid = setup.find(input => !input.validity.valid);
    run.disabled = !!invalid;
    if (invalid) {
      get('back').disabled = true;
      run.hidden = false;
      ['next', 'ask', 'program', 'cells'].forEach(name => { get(name).hidden = true; });
      get('count').textContent = '';
      feedback.textContent = 'Enter a whole number from ' + invalid.min + ' to ' + invalid.max + '.';
      return;
    }
    trace = beginnerLab(kind, setup.map(input => input.type === 'number' ? input.valueAsNumber : input.value));
    render();
  }

  controls.addEventListener('input', restart);
  get('reset').addEventListener('click', () => {
    restart();
    if (!run.disabled) run.focus();
  });
  get('back').addEventListener('click', () => {
    position--;
    prediction.value = '';
    feedback.textContent = position === 0 ? 'Back at the starting values.' : trace.steps[position - 1].explanation;
    render();
    if (position === 0) run.focus({preventScroll: true});
  });
  lab.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const current = trace.steps[position];
    if (!current) return;
    const guess = prediction.valueAsNumber;
    const verdict = Number.isNaN(guess) ? '' : guess === current.value ? 'Correct. ' : 'You predicted ' + guess + '. The result is ' + current.value + '. ';
    feedback.textContent = verdict + current.explanation;
    prediction.value = '';
    position++;
    render();
    if (position === trace.steps.length) get('reset').focus({preventScroll: true});
  });
  restart();
  lab.hidden = false;
});
