(function () {
  function $(id) { return document.getElementById(id); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
  function fmt(x, d) {
    if (!isFinite(x)) return 'n/a';
    d = d == null ? 4 : d;
    var s = Number(x.toPrecision(d)).toString();
    if (/e/.test(s)) s = Number(x.toPrecision(d)).toExponential();
    return s;
  }
  function fmtTime(s) {
    if (s === 0) return '0 s';
    var a = Math.abs(s);
    if (a >= 1) return fmt(s) + ' s';
    if (a >= 1e-3) return fmt(s * 1e3) + ' ms';
    if (a >= 1e-6) return fmt(s * 1e6) + ' µs';
    return fmt(s * 1e9) + ' ns';
  }

  /* ---------- study plan ---------- */
  var KEY = 'cse3313-ct-plan-v1';
  var boxes = [].slice.call(document.querySelectorAll('input[data-ck]'));
  var ticked = {};
  try { ticked = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { ticked = {}; }
  function planCount() { $('planprog').textContent = 'Ticked ' + boxes.filter(function (b) { return b.checked; }).length + ' of ' + boxes.length + '.'; }
  boxes.forEach(function (b) {
    b.checked = !!ticked[b.getAttribute('data-ck')];
    b.addEventListener('change', function () {
      ticked[b.getAttribute('data-ck')] = b.checked;
      try { localStorage.setItem(KEY, JSON.stringify(ticked)); } catch (e) {}
      planCount();
    });
  });
  planCount();

  /* ---------- clock explorer ---------- */
  function drawClock() {
    var f = parseFloat($('clk').value), T = performanceMath.clockPeriod(f); /* ns */
    $('clk-v').textContent = f.toFixed(2).replace(/0$/, '').replace(/\.$/, '.0');
    $('clk-p').textContent = fmt(T) + ' ns';
    $('clk-ps').textContent = fmt(T * 1000) + ' ps';
    $('clk-n').textContent = fmt(4 * f);
    var X0 = 20, W = 560, pxn = W / 4, hi = 30, lo = 78, x = X0, t = 0, half = T / 2;
    /* start low, rise at time 0, high for half a period, then alternate */
    var level = hi, d = 'M' + X0 + ' ' + lo + ' V' + hi;
    while (t < 4 - 1e-9) {
      var s2 = Math.min(half, 4 - t); x = X0 + (t + s2) * pxn; d += ' H' + x.toFixed(2);
      t += s2; if (t < 4 - 1e-9) { level = level === hi ? lo : hi; d += ' V' + level; }
    }
    var bx = X0 + T * pxn;
    var svg = '<path d="' + d + '" fill="none" stroke="var(--A)" stroke-width="2"/>' +
      '<path d="M' + X0 + ' 98 H' + Math.min(bx, 580).toFixed(2) + ' M' + X0 + ' 92 V104 M' + Math.min(bx, 580).toFixed(2) + ' 92 V104" stroke="var(--W)" stroke-width="1.6" fill="none"/>' +
      '<text x="' + (X0 + Math.min(T * pxn, 560) / 2).toFixed(2) + '" y="88" font-size="10" text-anchor="middle" style="fill:var(--W)">T</text>' +
      '<text x="20" y="14" font-size="10" style="fill:var(--muted)">0 ns</text><text x="580" y="14" font-size="10" text-anchor="end" style="fill:var(--muted)">4 ns</text>';
    $('clk-svg').innerHTML = svg;
  }
  $('clk').addEventListener('input', drawClock); drawClock();

  /* ---------- cpu time calculator ---------- */
  function calcCpu() {
    var ic = num('c-ic') * 1e6, cpi = num('c-cpi'), f = num('c-f') * 1e9;
    var cyc = performanceMath.clockCycles(ic, cpi);
    $('c-cyc').textContent = fmt(cyc / 1e6) + ' million';
    $('c-per').textContent = f > 0 ? fmt(performanceMath.clockPeriod(f) * 1e9) + ' ns' : 'n/a';
    $('c-t').textContent = f > 0 ? fmtTime(performanceMath.cpuTime(cyc, f)) : 'n/a';
  }
  ['c-ic', 'c-cpi', 'c-f'].forEach(function (id) { $(id).addEventListener('input', calcCpu); }); calcCpu();

  /* ---------- power ratio ---------- */
  function calcPower() {
    var r = performanceMath.dynamicPowerRatio(1 + num('p-c') / 100, 1 + num('p-v') / 100, 1 + num('p-f') / 100);
    $('p-r').textContent = fmt(r);
    $('p-pct').textContent = fmt(r * 100, 3) + '% of old';
  }
  ['p-v', 'p-f', 'p-c'].forEach(function (id) { $(id).addEventListener('input', calcPower); }); calcPower();

  /* ---------- response time solver (class notes) ---------- */
  function calcResp() {
    var c = num('r-c'), s = num('r-s'), n = num('r-n'), k = num('r-k'), old = c + s;
    $('r-old').textContent = fmt(old) + ' s';
    if (n > 0) { var tn = performanceMath.improvedTime(c, s, n); $('r-new').textContent = fmt(tn) + ' s'; $('r-ov').textContent = fmt(performanceMath.speedup(old, tn), 3) + '×'; }
    else { $('r-new').textContent = 'n/a'; $('r-ov').textContent = 'n/a'; }
    $('r-max').textContent = s > 0 ? fmt(old / s, 3) + '×' : 'no limit';
    if (k > 0) {
      var tgt = old / k, needed = performanceMath.requiredSpeedup(c, s, tgt);
      $('r-need').textContent = isFinite(needed) ? fmt(needed, 3) + '×' : 'impossible: system time ' + fmt(s) + ' s is not below target ' + fmt(tgt) + ' s';
    } else { $('r-need').textContent = 'n/a'; }
  }
  ['r-c', 'r-s', 'r-n', 'r-k'].forEach(function (id) { $(id).addEventListener('input', calcResp); }); calcResp();

  /* ---------- amdahl explorer ---------- */
  function calcAmdahl() {
    var a = +$('a-a').value, n = +$('a-n').value, u = 100 - a, tn = performanceMath.improvedTime(a, u, n);
    $('a-av').textContent = a; $('a-nv').textContent = n;
    $('a-t').textContent = fmt(tn, 4) + ' s'; $('a-s').textContent = fmt(performanceMath.speedup(100, tn), 3) + '×';
    $('a-m').textContent = fmt(100 / u, 3) + '×';
    $('a-b1l').textContent = 'Before (100 s) · ' + a + ' s affected · ' + u + ' s unchanged';
    $('a-b1').innerHTML = '<i class="aff" style="width:' + a + '%"></i><i class="una" style="width:' + u + '%"></i>';
    $('a-b2l').textContent = 'After (' + fmt(tn, 4) + ' s) · ' + fmt(a / n, 3) + ' s affected · ' + u + ' s unchanged';
    $('a-b2').innerHTML = '<i class="aff" style="width:' + (a / n) + '%"></i><i class="una" style="width:' + u + '%"></i>';
  }
  ['a-a', 'a-n'].forEach(function (id) { $(id).addEventListener('input', calcAmdahl); }); calcAmdahl();

  /* ---------- lesson tools ---------- */
  var lessonTools = {
    's-define': function (v) {
      if (!v.a || !v.b) return {};
      return { ratio: fmt(performanceMath.speedup(v.b, v.a)) + '×', winner: first(v.a, v.b) };
    },
    's-time': function (v) {
      var timing = performanceMath.elapsed(v.user, v.system, v.wait);
      return { cpu: fmt(timing.cpu) + ' s', elapsed: fmt(timing.elapsed) + ' s' };
    },
    's-cpi': function (v) {
      var mix = performanceMath.instructionMix([[v.add, 1], [v.sub, 2], [v.load, 3]]);
      return { count: fmt(mix.count), cycles: fmt(mix.cycles), cpi: fmt(mix.cpi) };
    },
    's-eq': function (v) {
      var cycles = performanceMath.clockCycles(v.count, v.cpi);
      return { cycles: fmt(cycles), time: v.rate > 0 ? fmtTime(performanceMath.cpuTime(cycles, v.rate * 1e9)) : 'n/a' };
    },
    's-affects': function (v) {
      var time = performanceMath.scaledCpuTime(v.time, v.count / 100, v.cpi / 100);
      return { time: fmt(time) + ' s', ratio: time > 0 ? fmt(performanceMath.speedup(v.time, time)) + '×' : 'n/a' };
    },
    's-multi': function (v) {
      return v.dependency === 0
        ? { can: 'Yes, on suitable hardware', why: 'The second line reads y and z. Both are ready.' }
        : { can: 'The second line waits', why: 'It needs the new value of a from the first line.' };
    },
    's-pitfalls': function (v) {
      var rate = 4e9, cpiA = 1, cpiB = 1.1;
      var a = performanceMath.cpuTime(performanceMath.clockCycles(v.a * 1e9, cpiA), rate);
      var b = performanceMath.cpuTime(performanceMath.clockCycles(v.b * 1e9, cpiB), rate);
      return {
        mips: fmt(performanceMath.mips(rate, cpiA)) + ' / ' + fmt(performanceMath.mips(rate, cpiB)),
        time: fmtTime(a) + ' / ' + fmtTime(b),
        winner: first(a, b),
      };
    },
  };

  function first(a, b) {
    if (a === b) return 'Both finish together';
    return a < b ? 'Computer A' : 'Computer B';
  }

  document.querySelectorAll('[data-performance]').forEach(function (tool) {
    var inputs = Array.from(tool.querySelectorAll('[data-input]'));
    var outputs = tool.querySelectorAll('[data-out]');
    var calculate = lessonTools[tool.dataset.performance];
    function update() {
      var valid = inputs.every(function (input) { return input.value !== '' && input.validity.valid; });
      var values = Object.fromEntries(inputs.map(function (input) { return [input.dataset.input, Number(input.value)]; }));
      var result = valid ? calculate(values) : {};
      outputs.forEach(function (output) { output.textContent = result[output.dataset.out] ?? 'n/a'; });
    }
    tool.addEventListener('input', update);
    tool.addEventListener('change', update);
    update();
  });

  /* ---------- random drill ---------- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  var GEN = {
    time: function () {
      var ic = pick([200, 400, 500, 800]), cpi = pick([1.2, 1.5, 2, 2.5, 3]), f = pick([2, 2.5, 4]);
      var cyc = performanceMath.clockCycles(ic * 1e6, cpi), t = performanceMath.cpuTime(cyc, f * 1e9) * 1e3;
      return { q: 'A program executes ' + ic + ' million instructions with an average CPI of ' + cpi + ' on a ' + f + ' GHz processor. What is the CPU time in milliseconds?', ans: t, unit: 'ms',
        sol: 'Clock cycles = IC × CPI = ' + ic + ' × 10⁶ × ' + cpi + ' = ' + fmt(cyc / 1e6) + ' million. CPU time = cycles / clock rate = ' + fmt(cyc / 1e6) + ' × 10⁶ / ' + f + ' × 10⁹ = ' + fmt(t) + ' ms.' };
    },
    cpi: function () {
      var c = [pick([2, 3, 4, 5]), pick([1, 2, 3, 4]), pick([1, 2, 3, 4, 6])];
      var mix = performanceMath.instructionMix([[c[0], 1], [c[1], 2], [c[2], 3]]);
      var tot = mix.count, cyc = mix.cycles, a = mix.cpi;
      return { q: 'A program runs ' + c[0] + ' instructions of class A (CPI 1), ' + c[1] + ' of class B (CPI 2) and ' + c[2] + ' of class C (CPI 3). What is the average CPI?', ans: a, unit: 'CPI',
        sol: 'Total cycles = ' + c[0] + '×1 + ' + c[1] + '×2 + ' + c[2] + '×3 = ' + cyc + '. Total instructions = ' + tot + '. Average CPI = ' + cyc + ' / ' + tot + ' = ' + fmt(a, 4) + '.' };
    },
    clock: function () {
      var fa = pick([2, 2.5, 3]), ta = pick([8, 10, 12]), k = pick([1.1, 1.2, 1.25, 1.5]), tb = pick([5, 6, 6.4, 7.5]);
      if (tb >= ta) tb = ta * 0.6;
      var cycA = ta * fa, cycB = k * cycA, fb = cycB / tb;
      return { q: 'Computer A runs a program in ' + ta + ' s at ' + fa + ' GHz. Computer B must run it in ' + fmt(tb) + ' s, but needs ' + k + ' times as many clock cycles as A. What clock rate must B have, in GHz?', ans: fb, unit: 'GHz',
        sol: 'Cycles<sub>A</sub> = ' + ta + ' × ' + fa + ' = ' + fmt(cycA) + ' billion. Cycles<sub>B</sub> = ' + k + ' × ' + fmt(cycA) + ' = ' + fmt(cycB) + ' billion. Clock rate<sub>B</sub> = cycles / time = ' + fmt(cycB) + ' / ' + fmt(tb) + ' = ' + fmt(fb) + ' GHz.' };
    },
    amdahl: function () {
      var T = pick([100, 100, 200]), a = pick([0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) * T, n = pick([2, 3, 4, 5, 10]);
      var tn = performanceMath.improvedTime(a, T - a, n), s = performanceMath.speedup(T, tn);
      return { q: 'A program takes ' + T + ' s. ' + fmt(a) + ' s of it is improved to run ' + n + ' times faster, and the other ' + fmt(T - a) + ' s is unchanged. What is the overall speedup?', ans: s, unit: '×',
        sol: 'T<sub>improved</sub> = ' + fmt(a) + '/' + n + ' + ' + fmt(T - a) + ' = ' + fmt(tn) + ' s. Speedup = ' + T + ' / ' + fmt(tn) + ' = ' + fmt(s, 3) + '. The maximum possible is ' + T + ' / ' + fmt(T - a) + ' = ' + fmt(T / (T - a), 3) + '.' };
    },
    power: function () {
      var dv = pick([10, 15, 20, 25, 30]), ff = pick([1, 1, 1.2, 1.5]);
      var r = performanceMath.dynamicPowerRatio(1, 1 - dv / 100, ff) * 100;
      return { q: 'A new CPU has the same capacitive load, its voltage is reduced by ' + dv + '%, and its frequency is ' + (ff === 1 ? 'unchanged' : 'increased to ' + ff + ' times the old frequency') + '. The new dynamic power is what percentage of the old?', ans: r, unit: '%',
        sol: 'P<sub>new</sub>/P<sub>old</sub> = (' + (1 - dv / 100) + ')² × ' + ff + ' = ' + fmt(r / 100, 4) + ', which is ' + fmt(r, 4) + '% of the old power.' };
    },
    mips: function () {
      var f = pick([2, 3, 4]), cpi = pick([1, 1.5, 2, 2.5, 4]), m = performanceMath.mips(f * 1e9, cpi);
      return { q: 'A processor runs at ' + f + ' GHz with an average CPI of ' + cpi + '. What is its MIPS rating (millions of instructions per second)?', ans: m, unit: 'MIPS',
        sol: 'MIPS = clock rate / (CPI × 10⁶) = ' + f + ' × 10⁹ / (' + cpi + ' × 10⁶) = ' + fmt(m, 5) + '.' };
    },
    scale: function () {
      var T = pick([10, 12, 15, 20]), a = pick([0.5, 0.6, 0.75, 0.8]), b = pick([1.1, 1.2, 1.25, 1.5]);
      var tn = performanceMath.scaledCpuTime(T, a, b);
      return { q: 'A program takes ' + T + ' s. A new compiler cuts the instruction count to ' + Math.round(a * 100) + '% of the original and raises CPI to ' + b + ' times the original. The clock rate is unchanged. What is the new CPU time in seconds?', ans: tn, unit: 's',
        sol: 'CPU time = IC × CPI / clock rate, so with the clock unchanged T<sub>new</sub> = ' + T + ' × ' + a + ' × ' + b + ' = ' + fmt(tn, 4) + ' s.' };
    },
    resp: function () {
      var c = pick([30, 40, 50, 60, 80]), s = pick([10, 20, 30]), n = pick([2, 3, 4, 5]);
      var old = c + s, tn = performanceMath.improvedTime(c, s, n), r = performanceMath.speedup(old, tn);
      return { q: 'A program has a CPU (execution) time of ' + c + ' s and a system time of ' + s + ' s, so the response time is CPU time plus system time. A better CPU makes the CPU part ' + n + ' times faster. What is the overall improvement of the response time?', ans: r, unit: '×',
        sol: 'Old response = ' + c + ' + ' + s + ' = ' + old + ' s. T<sub>improved</sub> = ' + c + '/' + n + ' + ' + s + ' = ' + fmt(tn) + ' s. Improvement = ' + old + ' / ' + fmt(tn) + ' = ' + fmt(r, 3) + '.' };
    },
    needn: function () {
      var c, s, k, tgt, old, tries = 0;
      do { c = pick([40, 50, 60, 80]); s = pick([10, 20]); k = pick([1.5, 2]); old = c + s; tgt = old / k; tries++; } while (tgt - s <= 0 && tries < 50);
      var n = performanceMath.requiredSpeedup(c, s, tgt);
      return { q: 'A program has a CPU time of ' + c + ' s and a system time of ' + s + ' s. Only the CPU can be improved. What improvement factor n makes the response time ' + k + ' times better?', ans: n, unit: '×',
        sol: 'Old response = ' + old + ' s. New response = ' + old + ' / ' + k + ' = ' + fmt(tgt) + ' s. Solve ' + fmt(tgt) + ' = ' + c + '/n + ' + s + ', so ' + c + '/n = ' + fmt(tgt - s) + ' and n = ' + fmt(n, 3) + '.' };
    }
  };
  var TYPES = Object.keys(GEN), cur = null, tried = 0, right = 0, streak = 0, solved = false;
  function newQ(foc) {
    var t = $('d-type').value; if (t === 'any') t = pick(TYPES);
    cur = GEN[t](); solved = false;
    $('d-q').textContent = cur.q; $('d-unit').textContent = 'Your answer (' + cur.unit + ')';
    $('d-ans').value = ''; $('d-fb').textContent = ''; $('d-fb').className = 'fbk'; $('d-sol').hidden = true; if (foc) $('d-ans').focus();
  }
  function upScore() { $('d-score').textContent = 'Correct ' + right + ' of ' + tried + '. Streak ' + streak + '.'; }
  function checkQ() {
    if (!cur || solved) return;
    var raw = $('d-ans').value.replace(/,/g, '').trim(), v = raw === '' ? NaN : Number(raw), fb = $('d-fb');
    if (!isFinite(v)) { fb.className = 'fbk no'; fb.textContent = 'Type a number first.'; return; }
    tried++; var ok = Math.abs(v - cur.ans) <= Math.abs(cur.ans) * 0.01 + 1e-9;
    if (ok) { right++; streak++; fb.className = 'fbk ok'; fb.textContent = 'Correct. The answer is ' + fmt(cur.ans, 4) + ' ' + cur.unit + '.'; solved = true; }
    else { streak = 0; fb.className = 'fbk no'; fb.textContent = 'Not quite. Check your units and try again, or show the solution.'; }
    upScore();
  }
  $('d-new').addEventListener('click', function () { newQ(true); });
  $('d-check').addEventListener('click', checkQ);
  $('d-ans').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkQ(); });
  $('d-type').addEventListener('change', newQ);
  $('d-show').addEventListener('click', function () {
    if (!cur) return; var s = $('d-sol'); s.hidden = false;
    s.innerHTML = '<p><strong>Solution.</strong> ' + cur.sol + '</p>';
  });
  newQ();

  /* ---------- practice questions ---------- */
  var QS = [
    { q: 'Which statement is correct?', o: ['Higher response time means better performance', 'Lower response time means better performance', 'Lower throughput means better performance', 'Response time and throughput always change together'], a: 1, e: 'Response time is how long one task takes, so lower is better. Higher throughput is better (L4 slide 4).' },
    { q: 'Adding more cores to a computer most directly improves:', o: ['The response time of any single task', 'Throughput, because several tasks run at the same time', 'The clock period', 'The instruction count'], a: 1, e: 'A single task may stay the same unless it can be split across cores (L4 slide 4).' },
    { q: 'Computer A runs a program in 10 s and B in 15 s. A is how many times as fast as B?', o: ['0.67', '1.5', '5', '2.5'], a: 1, e: 'Performance A / Performance B = Time B / Time A = 15/10 = 1.5 (L4 slide 6).' },
    { q: 'Which is included in elapsed time but not in CPU time?', o: ['Time executing the program&rsquo;s own instructions', 'Time the CPU runs OS instructions for the program', 'Time waiting for I/O to finish', 'Time spent on user CPU work'], a: 2, e: 'Waiting for I/O is non-CPU time. It counts in elapsed time only (L4 slides 8 to 10).' },
    { q: 'A program takes 10 s elapsed. 5 s is user CPU time and 1 s is system CPU time. What is the non-CPU time?', o: ['4 s', '5 s', '6 s', '1 s'], a: 0, e: 'CPU time = 5 + 1 = 6 s. Non-CPU time = 10 &minus; 6 = 4 s (L4 slide 10).' },
    { q: 'System CPU time is:', o: ['Time the CPU spends running OS instructions on behalf of the program', 'Time the SSD takes to return data', 'The time spent waiting for another program', 'Time for the clock to complete one cycle'], a: 0, e: 'Time waiting for the SSD is not CPU time at all (L4 slide 10).' },
    { q: 'A 4 GHz processor has a clock period of:', o: ['4 ns', '0.4 ns', '0.25 ns', '2.5 ns'], a: 2, e: 'Period = 1 / (4 &times; 10<sup>9</sup>) = 0.25 ns = 250 ps (L4 slides 13 and 14).' },
    { q: 'A program needs 100 clock cycles and each cycle takes 2 ns. The CPU time is:', o: ['50 ns', '102 ns', '200 ns', '0.02 ns'], a: 2, e: 'CPU time = clock cycles &times; clock period = 100 &times; 2 ns = 200 ns (L4 slide 15).' },
    { q: 'A needs 100 cycles at 1 GHz. B needs 150 cycles at 2 GHz. Which is faster?', o: ['A, 100 ns against 150 ns', 'B, 75 ns against 100 ns', 'They are equal', 'A, because it needs fewer cycles'], a: 1, e: 'CPU time = cycles / clock rate: A = 100 ns, B = 75 ns. Fewer cycles does not guarantee speed (L4 slide 17).' },
    { q: 'Which expression gives CPU time?', o: ['IC &times; CPI &times; Clock rate', 'IC &times; CPI / Clock rate', 'IC / (CPI &times; Clock rate)', 'CPI / (IC &times; Clock rate)'], a: 1, e: 'CPU time = IC &times; CPI / clock rate, or IC &times; CPI &times; clock cycle time (L4 slides 24 and 26).' },
    { q: 'Computer A runs a program in 10 s at 2 GHz. B needs 1.2 times as many cycles and must take 6 s. B&rsquo;s clock rate must be:', o: ['2.4 GHz', '3 GHz', '4 GHz', '6 GHz'], a: 2, e: 'Cycles A = 20 billion. Cycles B = 24 billion. 24 billion / 6 s = 4 GHz (L4 slides 19 to 21).' },
    { q: 'The instruction count of a program depends on:', o: ['Only the clock rate', 'The program, the ISA and the compiler', 'Only the CPI', 'The size of the SSD'], a: 1, e: 'L4 slide 22.' },
    { q: 'A program runs add 4 (CPI 1), sub 2 (CPI 2), lw 4 (CPI 3). The average CPI is:', o: ['1.5', '2', '2.5', '6'], a: 1, e: 'Total cycles = 4 + 4 + 12 = 20 over 10 instructions = 2 (L4 slide 25). The plain average of 1, 2, 3 happens to give 2 here as well. The weighted calculation is the method that works for every mix.' },
    { q: 'Same program and ISA. A: 250 ps cycle, CPI 2.0. B: 500 ps cycle, CPI 1.2. How do they compare?', o: ['B is 1.2 times as fast as A', 'A is 1.2 times as fast as B', 'A is 2 times as fast as B', 'They are equal'], a: 1, e: 'A = I &times; 500 ps, B = I &times; 600 ps. 600/500 = 1.2 in A&rsquo;s favour (L4 slides 27 to 29).' },
    { q: 'Which factor affects IC, CPI and clock cycle time?', o: ['Algorithm', 'Programming language', 'Compiler', 'Instruction set architecture'], a: 3, e: 'Lecture 4 slide 37 says only the ISA reaches all three. Your deck (p.16) lists IC and CPI for the ISA, so the ISA is still the only one that can also change the clock.' },
    { q: 'Dynamic power in CMOS is approximately:', o: ['Capacitive load &times; Voltage &times; Frequency', 'Capacitive load &times; Voltage<sup>2</sup> &times; Frequency', 'Voltage<sup>2</sup> / Frequency', 'Capacitive load / (Voltage &times; Frequency)'], a: 1, e: 'L4 slide 39. Voltage is squared.' },
    { q: 'A new CPU keeps the same capacitive load and frequency, with voltage cut by 15%. Its dynamic power is about:', o: ['85% of the old', '72% of the old', '15% of the old', '92% of the old'], a: 1, e: '(0.85)<sup>2</sup> = 0.7225, so about 72% (L4 slide 42).' },
    { q: 'What is the power wall?', o: ['We cannot keep raising clock frequency, as we cannot keep cutting voltage or removing unlimited heat', 'A limit on how much memory a CPU can address', 'A limit on the number of cores on a chip', 'A rule that power must double every year'], a: 0, e: 'L4 slide 41.' },
    { q: 'In the history on L4 slide 40, voltage went from 5 V to 1 V while frequency rose by about:', o: ['10 times', '100 times', '1,000 times', '30 times'], a: 2, e: 'Frequency rose about 1,000 times and power about 30 times (L4 slide 40).' },
    { q: 'Annual uniprocessor performance growth around 2003 fell from about:', o: ['20% to 52%', '52% to 20%', '100% to 50%', '30% to 3%'], a: 1, e: 'L4 slide 43.' },
    { q: 'Which is NOT one of the three limits that slowed single-processor growth on L4 slide 44?', o: ['Power consumption', 'Memory latency', 'Instruction-level parallelism', 'The size of the operating system'], a: 3, e: 'The three limits are power, memory latency and ILP (L4 slide 44).' },
    { q: 'Which pair of statements can be executed at the same time by a suitable core?', o: ['a = b + c; x = a + z;', 'a = b + c; x = y + z;', 'a = b + c; b = a + z;', 'x = a + z; a = x + y;'], a: 1, e: 'The second does not use the first&rsquo;s result, so they are independent (L4 slide 44).' },
    { q: 'Which is a challenge of parallel programming from L4 slide 46?', o: ['Load balancing', 'Raising the clock frequency', 'Reducing voltage', 'Increasing the instruction count'], a: 0, e: 'The three are programming for performance, load balancing, and communication and synchronisation.' },
    { q: 'A program takes 100 s: 80 s multiplication and 20 s other. Multiplication becomes 2 times faster. The new time is:', o: ['50 s', '60 s', '90 s', '40 s'], a: 1, e: '80/2 + 20 = 60 s (L4 slide 49).' },
    { q: 'For that same 100 s program, what is the overall speedup?', o: ['2', '1.5', '1.67', '1.25'], a: 2, e: '100/60 &asymp; 1.67, not 2 (L4 slide 49).' },
    { q: 'What is the maximum overall speedup if the 80 s part could be made infinitely fast?', o: ['Infinite', '5', '4', '100'], a: 1, e: 'The 20 s remains, so 100/20 = 5 (L4 slide 51).' },
    { q: 'A 100 s program has an operation taking only 2 s. Making it 2 times faster gives an overall speedup of about:', o: ['1.01', '1.5', '2', '1.25'], a: 0, e: 'New time = 1 + 98 = 99 s. Speedup = 100/99 &asymp; 1.01 (L4 slide 53). Make the common case fast.' },
    { q: 'Which is the MIPS (metric) formula?', o: ['Clock rate / (CPI &times; 10<sup>6</sup>)', 'CPI / (Clock rate &times; 10<sup>6</sup>)', 'IC &times; CPI / 10<sup>6</sup>', 'Clock rate &times; CPI &times; 10<sup>6</sup>'], a: 0, e: 'L4 slide 69.' },
    { q: 'A: IC 10 billion, 4 GHz, CPI 1.0. B: IC 8 billion, 4 GHz, CPI 1.1. Which is true?', o: ['A has higher MIPS and is faster', 'B has higher MIPS and is faster', 'A has higher MIPS but B is faster', 'They have the same MIPS'], a: 2, e: 'MIPS A = 4000, B = 3636. Time A = 2.5 s, B = 2.2 s (L4 slides 70 and 71).' },
    { q: 'A 15 s program: a new compiler cuts IC to 60% and raises CPI by 10%, clock unchanged. New CPU time:', o: ['9.9 s', '10.5 s', '9 s', '16.5 s'], a: 0, e: '15 &times; 0.6 &times; 1.1 = 9.9 s (L4 slide 74).' },
    { q: 'Deck Problem 01: sub, add, addi, lw take 2, 2, 3, 4 cycles. Program A runs 3, 3, 2, 2 of them. Its CPI is:', o: ['2.5', '2.6', '2.75', '3.0'], a: 1, e: 'Cycles = 3&times;2 + 3&times;2 + 2&times;3 + 2&times;4 = 26 over 10 instructions = 2.6. See section Q.' },
    { q: 'Deck Problem 02: the 13-instruction MIPS listing takes 48 cycles. On a 4 GHz CPU the CPU time is:', o: ['192 ns', '12 ns', '3.25 ns', '1.2 ns'], a: 1, e: '48 / (4 &times; 10<sup>9</sup>) = 12 &times; 10<sup>&minus;9</sup> s = 12 ns. See section Q.' },
    { q: 'Deck Problem 03: 280 ns total (FP 80, L/S 180, branch 20). Only L/S improves. For a 2&times; faster program, L/S must get faster by:', o: ['2', '3', '4.5', 'it is impossible'], a: 2, e: '140 = 180/n + 100, so 180/n = 40 and n = 4.5. See section Q.' },
    { q: 'Why did designers hit the power wall, according to the deck?', o: ['Clock rates could not be measured', 'Voltage could not be lowered further without the transistors becoming too leaky', 'Instruction counts grew too large', 'Memory became too slow'], a: 1, e: 'Voltage fell about 15% per generation, 5 V to 1 V in 20 years. Lower than that makes transistors too leaky (deck p.17).' },
    { q: 'Extra processors are added for separate tasks, and tasks used to wait in a queue. What happens to response time?', o: ['It always stays the same', 'It increases', 'It decreases, because tasks no longer wait', 'It becomes zero'], a: 2, e: 'Throughput rises, and since the tasks no longer queue, their response time drops (deck p.4).' },
    { q: 'In your class notes, the response time of a program equals:', o: ['CPU time only', 'CPU time plus system time (all the non-CPU time)', 'CPU time divided by system time', 'System time minus CPU time'], a: 1, e: 'Response time = elapsed time = CPU (execution) time + system time. It is greater than CPU time when there is extra time (CA Note).' },
    { q: 'A program has CPU time 40 s and system time 10 s. Only the CPU can be improved. What improvement factor makes the response time 2 times better?', o: ['2', '2.67', '4', '8'], a: 1, e: 'New response = 50/2 = 25 s. 25 = 40/n + 10, so n = 40/15 = 2.67. Halving the CPU time instead (giving n = 4) is the trap (CA Note, Type 3).' },
    { q: 'CPU time 20 s, system time 30 s. Can a better CPU make the response time 2 times better?', o: ['Yes, with n = 2', 'Yes, with n = 10', 'No, the 30 s system time already exceeds the 25 s target', 'Yes, but only with infinite n'], a: 2, e: 'New response must be 50/2 = 25 s, but system time alone is 30 s and is not improved. 25 = 20/n + 30 gives a negative n (CA Note).' },
    { q: 'Computer A has CPU time 50 s. For B to be 2 times better than A, B&rsquo;s CPU time must be:', o: ['100 s', '25 s', '52 s', '48 s'], a: 1, e: '&ldquo;n times better&rdquo; means divide the time by n: 50/2 = 25 s. Multiplying gives 100 s, which is worse (CA Note).' }
  ];
  var N = QS.length, answered = new Array(N), qz = $('quiz'), strip = $('strip'), LTR = 'ABCD';
  $('score').textContent = 'Answered 0 of ' + N + '. Correct 0.';
  QS.forEach(function (q, i) {
    var fs = document.createElement('fieldset'); fs.className = 'q'; fs.id = 'q' + i;
    var o = '<legend><span class="qn">Q' + (i + 1) + '</span><span>' + q.q + '</span></legend><div class="opts">';
    q.o.forEach(function (t, j) { o += '<button type="button" class="opt" data-q="' + i + '" data-o="' + j + '"><span class="ltr">' + LTR[j] + '</span><span>' + t + '</span></button>'; });
    fs.innerHTML = o + '</div><p class="fb" hidden></p>';
    qz.appendChild(fs);
    var sq = document.createElement('button'); sq.type = 'button'; sq.className = 'sq'; sq.id = 'sq' + i; sq.textContent = i + 1;
    sq.addEventListener('click', function () { $('q' + i).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    strip.appendChild(sq);
  });
  qz.addEventListener('click', function (e) {
    var b = e.target.closest('.opt'); if (!b || b.disabled) return;
    var i = +b.getAttribute('data-q'), j = +b.getAttribute('data-o'), q = QS[i], fs = $('q' + i), btns = fs.querySelectorAll('.opt');
    [].forEach.call(btns, function (x) { x.disabled = true; });
    btns[q.a].classList.add('good'); btns[q.a].querySelector('span:last-child').insertAdjacentHTML('beforeend', '<span class="tg">CORRECT</span>');
    var ok = j === q.a;
    if (!ok) { b.classList.add('bad'); b.querySelector('span:last-child').insertAdjacentHTML('beforeend', '<span class="tg">YOUR ANSWER</span>'); }
    var fb = fs.querySelector('.fb'); fb.hidden = false;
    fb.innerHTML = (ok ? '<span class="rg">Correct.</span> ' : '<span class="rb">Not quite.</span> ') + q.e;
    answered[i] = ok ? 1 : 0;
    $('sq' + i).className = 'sq ' + (ok ? 'good' : 'bad');
    var done = answered.filter(function (x) { return x !== undefined; }).length, right2 = answered.filter(function (x) { return x === 1; }).length;
    $('score').textContent = 'Answered ' + done + ' of ' + N + '. Correct ' + right2 + '.';
  });
  $('reset').addEventListener('click', function () {
    answered = new Array(N);
    [].forEach.call(qz.querySelectorAll('.opt'), function (x) { x.disabled = false; x.classList.remove('good', 'bad'); var t = x.querySelector('.tg'); if (t) t.remove(); });
    [].forEach.call(qz.querySelectorAll('.fb'), function (x) { x.hidden = true; });
    [].forEach.call(strip.children, function (x) { x.className = 'sq'; });
    $('score').textContent = 'Answered 0 of ' + N + '. Correct 0.';
  });

  /* ---------- deck rebuild: skills, map, glossary ---------- */
  var SKEY2 = 'cse3313-skills-v1', skills2 = [].slice.call(document.querySelectorAll('input[data-sk]')), sd2 = {};
  try { sd2 = JSON.parse(localStorage.getItem(SKEY2) || '{}') || {}; } catch (e) { sd2 = {}; }
  function paintSk2() {
    var n = skills2.filter(function (b) { return b.checked; }).length, sp = document.getElementById('skillprog');
    if (sp) sp.textContent = 'Skills ticked ' + n + ' of ' + skills2.length;
    [].forEach.call(document.querySelectorAll('.mapcard[data-sec]'), function (c) {
      var sec = document.getElementById(c.getAttribute('data-sec')), all = sec ? [].slice.call(sec.querySelectorAll('input[data-sk]')) : [];
      var d = all.filter(function (b) { return b.checked; }).length;
      c.querySelector('.pb i').style.width = all.length ? (100 * d / all.length) + '%' : '0%';
      c.querySelector('.pt').textContent = all.length ? d + ' of ' + all.length + ' skills' : '';
    });
  }
  skills2.forEach(function (b) {
    b.checked = !!sd2[b.getAttribute('data-sk')];
    b.addEventListener('change', function () { sd2[b.getAttribute('data-sk')] = b.checked; try { localStorage.setItem(SKEY2, JSON.stringify(sd2)); } catch (e) {} paintSk2(); });
  });
  paintSk2();
  var glI = [].slice.call(document.querySelectorAll('#gloss .gt'));
  function glF() {
    var q = (document.getElementById('gl-q').value || '').toLowerCase().trim(), n = 0;
    glI.forEach(function (g) { var ok = !q || g.textContent.toLowerCase().indexOf(q) >= 0; g.hidden = !ok; if (ok) n++; });
    document.getElementById('gl-n').textContent = n + ' of ' + glI.length + ' words';
  }
  document.getElementById('gl-q').addEventListener('input', glF); glF();
  var exO = document.getElementById('qa-open');
  if (exO) exO.addEventListener('click', function () {
    var ds = [].slice.call(document.querySelectorAll('#qtypes details')), anyC = ds.some(function (d) { return !d.open; });
    ds.forEach(function (d) { d.open = anyC; }); exO.textContent = anyC ? 'CLOSE ALL' : 'OPEN ALL';
  });

  var pmO = document.getElementById('pm-open');
  if (pmO) pmO.addEventListener('click', function () {
    var ds = [].slice.call(document.querySelectorAll('#s-past details')), anyC = ds.some(function (d) { return !d.open; });
    ds.forEach(function (d) { d.open = anyC; }); pmO.textContent = anyC ? 'CLOSE ALL' : 'OPEN ALL';
  });

  var evO = document.getElementById('ev-open');
  if (evO) evO.addEventListener('click', function () {
    var ds = [].slice.call(document.querySelectorAll('#s-every details')), anyC = ds.some(function (d) { return !d.open; });
    ds.forEach(function (d) { d.open = anyC; }); evO.textContent = anyC ? 'CLOSE ALL' : 'OPEN ALL';
  });
})();
