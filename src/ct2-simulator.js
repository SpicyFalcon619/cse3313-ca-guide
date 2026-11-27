'use strict';

document.querySelectorAll('[data-ct2-simulator]').forEach(sim => {
  const get = name => sim.querySelector('[data-sim-' + name + ']');
  const topic = get('topic');
  const example = get('example');
  const tray = get('fields');
  const timeline = get('trace');
  const slider = get('range');
  const predict = get('predict');
  const quiz = get('guess-panel');
  const guess = get('guess');
  const answer = get('answer');
  const error = get('error');
  const play = get('play');
  const next = get('next');
  let selected;
  let trace = [];
  let rows = [];
  let inputs = [];
  let index = 0;
  let pending = false;
  let dirty = false;
  let timer = null;

  function options(select, labels) {
    select.replaceChildren(...labels.map((label, i) => new Option(label, i)));
  }

  function controls() {
    const hasNext = index + 1 < trace.length;
    next.disabled = dirty || !hasNext || pending;
    get('back').disabled = dirty || index === 0;
    get('reset').disabled = dirty || index === 0;
    slider.disabled = dirty || trace.length < 2;
    play.disabled = dirty || predict.checked || trace.length < 2;
    quiz.hidden = !pending;
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    play.textContent = 'Play';
  }

  function clearPrediction(showAnswer = false) {
    pending = false;
    guess.value = '';
    if (!showAnswer) answer.hidden = true;
  }

  function stateCell([name, value], changed) {
    const cell = document.createElement('div');
    if (changed) cell.className = 'ct2-sim-changed';
    const label = document.createElement('dt');
    label.textContent = name;
    const amount = document.createElement('dd');
    if (typeof value === 'string' && /^[01]{4,32}$/.test(value)) {
      amount.className = 'ct2-sim-bits';
      amount.setAttribute('aria-label', value);
      for (let i = 0; i < value.length; i += 4) {
        const chunk = document.createElement('span');
        chunk.textContent = value.slice(i, i + 4);
        chunk.setAttribute('aria-hidden', 'true');
        amount.append(chunk);
      }
    } else {
      amount.textContent = value;
    }
    cell.append(label, amount);
    return cell;
  }

  function render() {
    const current = trace[index];
    get('count').textContent = current ? 'Step ' + index + ' of ' + (trace.length - 1) : 'No trace';
    slider.max = Math.max(0, trace.length - 1);
    slider.value = index;
    controls();
    get('instruction').textContent = current?.title ?? '';
    get('explanation').textContent = current?.explanation ?? '';
    get('state-title').hidden = !current;
    rows.forEach((row, n) => {
      if (n === index) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
      row.disabled = dirty;
    });
    const active = rows[index];
    if (active && timeline.scrollHeight > timeline.clientHeight) {
      const item = active.getBoundingClientRect();
      const viewport = timeline.getBoundingClientRect();
      if (item.top < viewport.top) timeline.scrollTop += item.top - viewport.top;
      if (item.bottom > viewport.bottom) timeline.scrollTop += item.bottom - viewport.bottom;
    }
    const before = new Map(trace[index - 1]?.cells ?? []);
    const cells = current?.cells ?? [];
    const normal = cells.filter(([name]) => !name.startsWith('Stack · '));
    const stack = cells.filter(([name]) => name.startsWith('Stack · '));
    const make = ([name, value]) => stateCell([name, value], index > 0 && before.get(name) !== value);
    get('state').replaceChildren(...normal.map(make));
    get('stack-panel').hidden = stack.length === 0;
    const pointer = new Map(normal).get('$sp');
    get('stack').replaceChildren(...stack.map(([name, value]) => {
      const address = name.slice('Stack · '.length);
      return stateCell(['Address ' + address + (Number(address) === pointer ? ' · $sp' : ''), value], before.get(name) !== value);
    }));
  }

  function seek(position, showAnswer = false) {
    clearPrediction(showAnswer);
    index = position;
    render();
  }

  function rebuild() {
    stop();
    clearPrediction();
    dirty = false;
    index = 0;
    error.hidden = true;
    try {
      trace = selected.run(...inputs.map(input => input.type === 'number' ? input.valueAsNumber : input.value.trim()));
    } catch (failure) {
      trace = [];
      error.textContent = failure.message;
      error.hidden = false;
    }
    rows = trace.map((s, n) => {
      const button = document.createElement('button');
      button.type = 'button';
      const line = document.createElement('code');
      line.textContent = s.title;
      button.append(line);
      button.addEventListener('click', () => { stop(); seek(n); });
      return button;
    });
    timeline.replaceChildren(...rows.map(row => {
      const li = document.createElement('li');
      li.append(row);
      return li;
    }));
    timeline.scrollTop = 0;
    render();
  }

  function pick() {
    selected = ct2SimulatorTopics[Number(topic.value)].examples[Number(example.value)];
    tray.replaceChildren();
    inputs = selected.fields.map(field => {
      const label = document.createElement('label');
      const caption = document.createElement('span');
      caption.textContent = field.label;
      const input = document.createElement(field.options ? 'select' : 'input');
      input.id = 'ct2-sim-parameter-' + tray.childElementCount;
      caption.id = input.id + '-label';
      label.htmlFor = input.id;
      input.setAttribute('aria-labelledby', caption.id);
      input.required = true;
      if (field.options) {
        input.setAttribute('aria-label', field.label);
        input.replaceChildren(...field.options.map(([value, name]) => new Option(name, value)));
        input.addEventListener('change', markEdited);
      }
      else if (field.min !== undefined) {
        input.type = 'number';
        input.min = field.min;
        input.max = field.max;
      } else {
        input.type = 'text';
        input.spellcheck = false;
      }
      input.value = field.value;
      label.append(caption, input);
      tray.append(label);
      return input;
    });
    get('lesson').href = '#' + selected.lesson;
    rebuild();
  }

  function pickTopic() {
    options(example, ct2SimulatorTopics[Number(topic.value)].examples.map(item => item.title));
    pick();
  }

  function advance() {
    const upcoming = trace[index + 1];
    if (dirty || pending || !upcoming) return;
    if (predict.checked && upcoming.answer !== undefined) {
      stop();
      answer.hidden = true;
      pending = true;
      get('question').textContent = upcoming.question;
      controls();
      guess.focus({ preventScroll: true });
      return;
    }
    seek(index + 1);
  }

  function markEdited() {
    stop();
    clearPrediction();
    dirty = true;
    error.textContent = 'Apply your inputs to start a new trace.';
    error.hidden = false;
    render();
  }
  get('config').addEventListener('input', markEdited);
  get('config').addEventListener('submit', event => {
    event.preventDefault();
    rebuild();
  });
  get('reset').addEventListener('click', () => { stop(); seek(0); });
  get('back').addEventListener('click', () => { stop(); seek(index - 1); });
  next.addEventListener('click', advance);
  slider.addEventListener('input', () => { stop(); seek(Number(slider.value)); });
  predict.addEventListener('change', () => { stop(); clearPrediction(); controls(); });
  play.addEventListener('click', () => {
    if (timer !== null) { stop(); return; }
    if (index === trace.length - 1) seek(0);
    play.textContent = 'Pause';
    timer = setInterval(() => {
      advance();
      if (index === trace.length - 1) stop();
    }, 850);
  });
  window.addEventListener('hashchange', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  sim.addEventListener('keydown', event => {
    if (event.target.closest('input, select, textarea, .dd-btn, [data-sim-guess-panel]') || event.altKey || event.ctrlKey || event.metaKey) return;
    const button = event.key === 'ArrowRight' ? next : event.key === 'ArrowLeft' ? get('back') : null;
    if (button && !button.disabled) {
      event.preventDefault();
      button.click();
    }
  });
  quiz.addEventListener('submit', event => {
    event.preventDefault();
    const expected = trace[index + 1].answer;
    const raw = guess.value.trim();
    const correct = raw !== '' && Number(raw) === expected;
    answer.textContent = correct ? 'Correct. Your prediction matches the next step.' : 'The answer is ' + expected + '. Read the explanation for this step to see why.';
    answer.dataset.correct = String(correct);
    answer.hidden = false;
    seek(index + 1, true);
    (next.disabled ? get('reset') : next).focus({ preventScroll: true });
  });
  get('reveal').addEventListener('click', () => {
    seek(index + 1);
    (next.disabled ? get('reset') : next).focus({ preventScroll: true });
  });

  topic.addEventListener('change', pickTopic);
  example.addEventListener('change', pick);
  options(topic, ct2SimulatorTopics.map(group => group.name));
  pickTopic();
});
