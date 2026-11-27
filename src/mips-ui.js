'use strict';

function wireMachineTool(tool) {
  const field = name => tool.querySelector('[data-machine="' + name + '"]');
  const examples = [
    ['add $t0, $t1, $t2', 1000], ['sll $t0, $t1, 2', 1000], ['jr $ra', 1000],
    ['addi $t0, $t1, 5', 1000], ['lw $s1, 200($s2)', 1000],
    ['bne $s1, $s2, 1104', 1000], ['j 2000', 1000], ['jal 10000', 1000],
  ];
  function update() {
    const mode = field('mode').value;
    for (const row of tool.querySelectorAll('[data-machine-row]')) row.hidden = row.dataset.machineRow !== mode;
    try {
      const result = mode === 'encode'
        ? encodeMips(field('asm').value, field('pc').value)
        : decodeMips(field('word').value, field('pc').value);
      for (const key of ['type', 'assembly', 'hex', 'binary', 'explanation']) field(key).textContent = result[key];
      field('fields').replaceChildren(...result.fields.map(({ name, bits, value, binary }) => {
        const card = document.createElement('div');
        card.className = 'reg';
        const label = document.createElement('span');
        label.textContent = name + ' · ' + bits + ' bits · ' + value;
        const body = document.createElement('b');
        body.textContent = binary;
        card.append(label, body);
        return card;
      }));
      field('error').hidden = true;
      field('result').hidden = false;
    } catch (error) {
      field('error').textContent = error.message;
      field('error').hidden = false;
      field('result').hidden = true;
    }
  }

  for (const name of ['asm', 'word', 'pc']) field(name).addEventListener('input', update);
  field('mode').addEventListener('change', update);
  field('example').addEventListener('change', () => {
    const [asm, pc] = examples[Number(field('example').value)];
    field('asm').value = asm;
    field('pc').value = pc;
    field('word').value = encodeMips(asm, pc).hex;
    update();
  });
  tool.querySelector('form').addEventListener('submit', event => event.preventDefault());
  update();
}

wireMachineTool(document.querySelector('#machine-tool'));

function wireMemoryTool(tool) {
  const field = name => tool.querySelector('[data-memory="' + name + '"]');
  const order = () => field('endian').value;
  let memory = memoryExample(order());

  function draw(address) {
    const start = Math.min(0xfffffff0, Math.max(0, (address ?? 0) - 4));
    const rows = [];
    for (let i = 0; i < 4; i++) {
      const wordAddress = start + 4 * i;
      const row = document.createElement('tr');
      if (wordAddress === address) row.className = 'memory-active';
      const values = [String(wordAddress)];
      for (let byte = 0; byte < 4; byte++) values.push((memory.get(wordAddress + byte) ?? 0).toString(16).toUpperCase().padStart(2, '0'));
      values.push(String(loadWord(memory, wordAddress, order())));
      for (const value of values) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      }
      rows.push(row);
    }
    field('bytes').replaceChildren(...rows);
  }

  function preview(run = false) {
    try {
      const address = memoryAddress(field('base').value, field('offset').value);
      const op = field('op').value;
      field('address').textContent = address + ' (' + hex32(address) + ')';
      let message = 'Selected bytes ' + address + '–' + (address + 3) + '.';
      if (run && op === 'lw') {
        field('word').value = loadWord(memory, address, order());
        message = 'Loaded ' + field('word').value + ' into $t0 from bytes ' + address + '–' + (address + 3) + '.';
      } else if (run) {
        storeWord(memory, address, field('word').value, order());
        message = 'Stored ' + field('word').value + ' from $t0 in bytes ' + address + '–' + (address + 3) + '.';
      }
      field('status').textContent = message;
      field('status').classList.remove('no');
      field('register').textContent = field('word').value || 'n/a';
      draw(address);
    } catch (error) {
      field('address').textContent = 'n/a';
      field('status').textContent = error.message;
      field('status').classList.add('no');
      draw();
    }
  }

  const form = tool.querySelector('form');
  form.addEventListener('input', () => preview());
  form.addEventListener('change', () => preview());
  form.addEventListener('submit', event => { event.preventDefault(); preview(true); });
  field('reset').addEventListener('click', () => {
    const endian = order();
    form.reset();
    field('endian').value = endian;
    field('endian').dispatchEvent(new Event('sync'));
    field('op').dispatchEvent(new Event('sync'));
    memory = memoryExample(endian);
    preview();
  });
  preview();
}

wireMemoryTool(document.querySelector('#memory-tool'));

function wireStackTool(tool) {
  const field = name => tool.querySelector('[data-stack="' + name + '"]');
  const keys = ['$pc', '$sp', '$ra', '$a0', '$v0', '$s0', '$t0'];
  let steps, index;

  function render() {
    const step = steps[index];
    const values = { ...step.registers, $pc: step.pc };
    const prior = index ? { ...steps[index - 1].registers, $pc: steps[index - 1].pc } : values;
    field('registers').replaceChildren(...keys.map(key => {
      const card = document.createElement('div');
      card.className = 'reg' + (prior[key] !== values[key] ? ' changed-register' : '');
      const label = document.createElement('span');
      label.textContent = key;
      const value = document.createElement('b');
      value.textContent = values[key];
      card.append(label, value);
      return card;
    }));
    field('step').textContent = 'Step ' + index + ' of ' + (steps.length - 1);
    field('instruction').textContent = (step.line === null ? '' : step.line + '  ') + step.instruction;
    field('explanation').textContent = step.explanation;
    field('prev').disabled = index === 0;
    field('start').disabled = index === 0;
    field('next').disabled = index === steps.length - 1;
    field('empty').hidden = step.stack.length > 0;
    field('words').hidden = step.stack.length === 0;
    field('bytes').replaceChildren(...step.stack.map(({ address, value }) => {
      const row = document.createElement('tr');
      if (address === step.registers.$sp) row.className = 'memory-active';
      for (const text of [address, value ?? 'Reserved', address === step.registers.$sp ? '← $sp' : '']) {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.appendChild(cell);
      }
      return row;
    }));
  }

  function pick() {
    const key = field('example').value;
    steps = traceProcedure(key);
    field('description').textContent = mipsProcedures[key].description;
    field('program').textContent = mipsProcedures[key].source.join('\n');
    index = 0;
    render();
  }
  field('example').addEventListener('change', pick);
  field('start').addEventListener('click', () => { index = 0; render(); });
  field('prev').addEventListener('click', () => { index--; render(); });
  field('next').addEventListener('click', () => { index++; render(); });
  pick();
}

wireStackTool(document.querySelector('#stack-tool'));
