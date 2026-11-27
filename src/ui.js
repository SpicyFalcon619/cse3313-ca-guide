(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- pages ---------------- */
  var pages = $$('article.page'), current = null;
  var groups = [], groupTags = { Performance: 'CT1', MIPS: 'CT2' };
  function buildNav() {
    var n = 0;
    pages.forEach(function (p) {
      n++; p.dataset.num = n;
      var g = groups.filter(function (x) { return x.name === p.dataset.group; })[0];
      if (!g) { g = { name: p.dataset.group, tag: groupTags[p.dataset.group], pages: [] }; groups.push(g); }
      g.pages.push(p);
    });
    $('#groups').innerHTML = groups.map(function (g, i) { return '<a href="#' + g.pages[0].id + '" data-g="' + i + '">' + g.name + (g.tag ? '<span class="ct' + (g.tag === 'CT1' ? ' t1' : '') + '">' + g.tag + '</span>' : '') + '</a>'; }).join('');
    pages.forEach(function (p, i) {
      var prev = pages[i - 1], next = pages[i + 1], pg = document.createElement('nav'); pg.className = 'pager'; pg.setAttribute('aria-label', 'Page');
      pg.innerHTML = (prev ? '<a href="#' + prev.id + '"><span>&#8592; PREVIOUS</span><b>' + prev.dataset.title + '</b></a>' : '') + (next ? '<a class="nx" href="#' + next.id + '"><span>NEXT &#8594;</span><b>' + next.dataset.title + '</b></a>' : '');
      if (p.dataset.skip !== '1') {
        var db = document.createElement('button'); db.type = 'button'; db.className = 'btn donebtn'; db.dataset.done = p.id; p.appendChild(db);
      }
      p.appendChild(pg);
    });
  }
  function buildSub(p) {
    var g = groups.filter(function (x) { return x.name === p.dataset.group; })[0];
    $$('#groups a').forEach(function (a) {
      var on = groups[+a.dataset.g] === g; a.setAttribute('aria-current', String(on));
      if (on) { var t = $('#groups'); t.scrollTo({ left: a.offsetLeft - t.clientWidth / 2 + a.clientWidth / 2 }); }
    });
    var hero = $('header.hero', p);
    if (hero && !p.classList.contains('foundation') && !$('.chips', hero) && g.pages.length > 1) {
      var ch = document.createElement('nav'); ch.className = 'chips'; ch.setAttribute('aria-label', 'Pages in ' + g.name);
      ch.innerHTML = g.pages.map(function (q) { return '<a href="#' + q.id + '" data-p="' + q.id + '"' + (q === p ? ' aria-current="page"' : '') + '><span class="n">' + String(q.dataset.num).padStart(2, '0') + '</span>' + q.dataset.title + (q.dataset.skip === '1' ? '' : '<span class="ok" aria-hidden="true"></span>') + '</a>'; }).join('');
      ch.id = 'pages-in-' + p.id;
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'chip-toggle';
      toggle.textContent = g.name === 'Start here' ? 'Start here pages' : g.name + ' pages';
      toggle.setAttribute('aria-controls', ch.id);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') === 'false'));
      });
      hero.append(toggle, ch);
    }
  }
  function doneSet() { try { return JSON.parse(store('cse3313-done') || '{}'); } catch (e) { return {}; } }
  function refreshDone() {
    var d = doneSet(), cnt = 0, tot = 0;
    $$('.chips a[data-p]').forEach(function (a) { var on = !!d[a.dataset.p]; a.classList.toggle('done', on); });
    pages.forEach(function (p) { if (p.dataset.skip !== '1') { tot++; if (d[p.id]) cnt++; } });
    $$('button[data-done]').forEach(function (b) { var on = !!d[b.dataset.done]; b.classList.toggle('on', on); b.innerHTML = on ? '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>Understood' : 'Mark this page as understood'; });
    $('.prog').hidden = tot === 0;
    $('#progT').textContent = cnt + '/' + tot; refreshRoute(d); $('#progB').style.width = (tot ? cnt / tot * 100 : 0) + '%';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-done]'); if (b) { var d = doneSet(); d[b.dataset.done] = !d[b.dataset.done]; store('cse3313-done', JSON.stringify(d)); refreshDone(); }
  });
  /* ---------- course route and page heroes ---------- */
  function routeSVG() {
    var labels = { Performance: 'CPU', MIPS: 'ISA', Exam: 'Q' };
    var stops = groups.filter(function (g) { return g.name in labels; });
    var svg = '<svg class="ill route" viewBox="0 0 420 162" role="group" aria-label="Course map"><g class="d">';
    svg += '<path d="M70 57 H128 V86 H210 H292 V57 H350" style="--i:0"/>';
    svg += '<path class="t" d="M70 39 H147 V65 H182 M238 65 H273 V39 H350 M210 61 V27 H233" style="--i:1"/>';
    svg += '<circle cx="233" cy="27" r="3"/></g>';
    stops.forEach(function (g, i) {
      var x = 70 + i * 140, y = i === 1 ? 86 : 57;
      var lessons = g.pages.filter(function (p) { return p.dataset.skip !== '1'; });
      svg += '<a href="#' + g.pages[0].id + '" aria-label="' + g.name + '" class="rnode">';
      svg += '<circle cx="' + x + '" cy="' + y + '" r="25"/>';
      svg += '<text class="k" x="' + x + '" y="' + (y + 1) + '">' + labels[g.name] + '</text>';
      svg += '<text class="s" x="' + x + '" y="' + (y + 46) + '">' + g.name + '</text>';
      if (lessons.length) svg += '<text class="c" x="' + x + '" y="' + (y + 62) + '">' + '0/' + lessons.length + '</text>';
      svg += '</a>';
    });
    return svg + '</svg>';
  }
  function buildHero(p) {
    var h = $('header.hero', p); if (!h || h.__done) return; h.__done = 1;
    var left = document.createElement('div'); left.className = 'hl';
    while (h.firstChild) left.appendChild(h.firstChild);
    h.appendChild(left);
    var eb = $('.eyebrow', left);
    if (eb) eb.outerHTML = '<p class="kick"><span class="num">' + String(p.dataset.num).padStart(2, '0') + '</span><span>' + eb.innerHTML + '</span></p>';
    var acts = document.createElement('div'); acts.className = 'acts';
    if ($('.sim', p)) acts.innerHTML += '<button type="button" class="hbtn cream" data-jump="sim">Try it</button>';
    if (p.dataset.skip !== '1') acts.innerHTML += '<button type="button" class="hbtn line" data-done="' + p.id + '"></button>';
    if (acts.innerHTML) ($('.lede', left) || left.lastChild).insertAdjacentElement('afterend', acts);
    addField(h);
    var pl = p.id === 'start' ? [routeSVG(), 'Choose a section to open it.'] : null;
    if (pl) {
      h.classList.add('has-plate');
      var f = document.createElement('figure'); f.className = 'plate';
      f.innerHTML = '<div class="pin">' + pl[0] + '</div><figcaption>' + pl[1] + '</figcaption>';
      h.appendChild(f);
      var ill = $('.ill', f); if (ill) { $$('.d *', ill).forEach(function (e) { e.setAttribute('pathLength', '1'); }); ill.classList.remove('inking'); void ill.getBoundingClientRect(); ill.classList.add('inking'); }
    }
  }
  function refreshRoute(done) {
    var s = $('#start .plate .pin');
    if (!s) return;
    groups.forEach(function (g) {
      var link = $('a[href="#' + g.pages[0].id + '"]', s);
      if (!link) return;
      var lessons = g.pages.filter(function (p) { return p.dataset.skip !== '1'; });
      var count = lessons.filter(function (p) { return done[p.id]; }).length;
      link.classList.toggle('done', lessons.length > 0 && count === lessons.length);
      link.classList.toggle('open', count > 0 && count < lessons.length);
      var label = $('.c', link);
      if (label) label.textContent = count + '/' + lessons.length;
    });
  }
  document.addEventListener('click', function (e) {
    var j = e.target.closest('[data-jump]'); if (!j) return;
    var pg = j.closest('.page'), t = $('.sim', pg); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- motion: animated background behind each title band ---------- */
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function HeroField(hero) {
    var cv = document.createElement('canvas'); cv.className = 'field'; cv.setAttribute('aria-hidden', 'true');
    hero.insertBefore(cv, hero.firstChild);
    this.cv = cv; this.hero = hero; this.ctx = cv.getContext('2d'); this.t0 = 0; this.reset();
  }
  HeroField.prototype.reset = function () {
    var r = this.hero.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(320, r.width); this.h = Math.max(200, r.height);
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = Math.ceil(this.w / 120), rows = Math.ceil(this.h / 110), N = [], E = [];
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) N.push({ x: (i + .5) * this.w / cols + (Math.random() - .5) * 60, y: (j + .5) * this.h / rows + (Math.random() - .5) * 50, d: Infinity });
    N.forEach(function (a, ia) {
      var near = N.map(function (b, ib) { return [ib, Math.hypot(a.x - b.x, a.y - b.y)]; }).filter(function (x) { return x[0] !== ia; }).sort(function (x, y) { return x[1] - y[1]; }).slice(0, 3);
      near.forEach(function (n) { if (n[1] < 190 && !E.some(function (e) { return (e[0] === ia && e[1] === n[0]) || (e[1] === ia && e[0] === n[0]); })) E.push([ia, n[0]]); });
    });
    var adj = N.map(function () { return []; }); E.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
    var s = Math.floor(Math.random() * N.length); N[s].d = 0; var q = [s];
    while (q.length) { var u = q.shift(); adj[u].forEach(function (v) { if (N[v].d === Infinity) { N[v].d = N[u].d + 1; q.push(v); } }); }
    this.N = N; this.E = E; this.max = Math.max.apply(null, N.map(function (n) { return n.d === Infinity ? 0 : n.d; })); this.t0 = performance.now();
  };
  HeroField.prototype.draw = function (now) {
    var c = this.ctx, N = this.N, step = 520, t = RM ? this.max + .9 : (now - this.t0) / step, wave = t, fade = this.max + 4;
    if (!RM && t > fade + 3) { this.reset(); return; }
    c.clearRect(0, 0, this.w, this.h);
    this.E.forEach(function (e) {
      var a = N[e[0]], b = N[e[1]], lit = Math.min(a.d, b.d) < wave - .4 && Math.max(a.d, b.d) <= wave;
      c.strokeStyle = lit ? 'rgba(142,173,255,' + (t > fade ? .28 * Math.max(0, 1 - (t - fade) / 3) : .28) + ')' : 'rgba(238,242,243,.07)';
      c.lineWidth = lit ? 1.4 : 1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    });
    N.forEach(function (n) {
      var k = wave - n.d, r = 3.2, col = 'rgba(238,242,243,.14)';
      if (n.d === 0) r = 5;
      if (k >= 0 && k < 1) { col = 'rgba(142,173,255,' + (.85 - k * .4) + ')'; r = 4 + (1 - k) * 4; c.beginPath(); c.arc(n.x, n.y, 10 + k * 18, 0, 7); c.strokeStyle = 'rgba(142,173,255,' + (.35 * (1 - k)) + ')'; c.lineWidth = 1.2; c.stroke(); }
      else if (k >= 1) col = 'rgba(102,189,177,' + (t > fade ? .45 * Math.max(0, 1 - (t - fade) / 3) : .45) + ')';
      c.fillStyle = col; c.beginPath(); c.arc(n.x, n.y, r, 0, 7); c.fill();
    });
  };
  var fields = [], rafOn = false;
  function tick(now) {
    var any = false;
    fields.forEach(function (f) { if (!f.hero.closest('.page').hidden && f.hero.getBoundingClientRect().bottom > 0) { f.draw(now); any = true; } });
    if (any && !RM && !document.hidden && !CALM()) requestAnimationFrame(tick); else rafOn = false;
  }
  function CALM() { return document.documentElement.classList.contains('calm'); }
  function wakeFields() { if (!rafOn) { rafOn = true; requestAnimationFrame(tick); } }
  function addField(hero) { var f = new HeroField(hero); fields.push(f); wakeFields(); }
  window.addEventListener('scroll', wakeFields, { passive: true });
  document.addEventListener('visibilitychange', wakeFields);
  window.addEventListener('resize', function () { fields.forEach(function (f) { if (!f.hero.closest('.page').hidden) f.reset(); }); });
  function enterPage(p) {
    p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
    var f = fields.filter(function (x) { return x.hero.closest('.page') === p; })[0];
    if (f) { f.reset(); } wakeFields();
  }

  document.addEventListener('pointermove', function (e) {
    if (RM || e.pointerType !== 'mouse') return;
    var pl = e.target.closest && e.target.closest('header.hero'); var f = pl && $('.plate', pl); if (!f) return;
    var r = pl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    f.style.transform = 'perspective(900px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg) translateY(-4px)';
  });
  document.addEventListener('pointerout', function (e) { if (e.target.closest && e.target.matches('header.hero') && !e.relatedTarget?.closest?.('header.hero')) { var f = $('.plate', e.target); if (f) f.style.transform = ''; } });
  function show() {
    var id = location.hash.replace('#', '') || 'start', p = document.getElementById(id);
    if (!p || !p.classList.contains('page')) { id = 'start'; p = document.getElementById(id); }
    pages.forEach(function (x) { x.hidden = x !== p; });
    buildSub(p); buildHero(p); refreshDone(); enterPage(p);
    lastY = 0; setHidden(false); setTimeout(adaptNav, 80);
    if (current !== id) { current = id; window.scrollTo(0, 0); }
  }

  /* ---------------- theme ---------------- */
  function calmInit() {
    var btn = $('#calmBtn'); if (!btn) return;
    var ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="9" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="17" cy="18" r="1.6"/><path d="M6.4 6.6l4.2-1.2M13.5 5.6l4.1 2.6M5.8 8.4l1.6 7.1M9.6 17.2l5.8.7M18.6 10.5l-1.2 6"/></svg>';
    var OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="9" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="17" cy="18" r="1.6"/><path d="M3.5 3.5l17 17"/></svg>';
    function paint() {
      var c = CALM(); btn.innerHTML = c ? OFF : ON; btn.setAttribute('aria-pressed', c ? 'true' : 'false');
      btn.setAttribute('aria-label', c ? 'Turn background animation on' : 'Turn background animation off');
      btn.title = c ? 'Background: off' : 'Background: on';
    }
    if (store('cse3313-calm') === '1') document.documentElement.classList.add('calm');
    btn.addEventListener('click', function () {
      var c = !CALM(); document.documentElement.classList.toggle('calm', c); store('cse3313-calm', c ? '1' : '0'); paint();
      if (!c) wakeFields();
    });
    paint();
  }
  function themeInit() {
    var t = store('cse3313-theme'); if (t === 'light' || t === 'dark' || t === 'black') document.documentElement.setAttribute('data-theme', t);
    var btn = $('#themeBtn'), mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
    var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
    function cur() { return document.documentElement.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light'); }
    var BLACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>';
    var NEXT = { light: 'dark', dark: 'black', black: 'light' }, NAME = { light: 'paper', dark: 'dark', black: 'charcoal' };
    function paint() {
      var nx = NEXT[cur()] || 'dark';
      btn.innerHTML = nx === 'light' ? SUN : nx === 'black' ? BLACK : MOON;
      btn.setAttribute('aria-label', 'Switch to ' + NAME[nx] + ' theme');
      btn.title = 'Theme: ' + NAME[cur()] + ' (next: ' + NAME[nx] + ')';
    }
    btn.addEventListener('click', function () {
      var nx = NEXT[cur()] || 'dark'; document.documentElement.setAttribute('data-theme', nx); store('cse3313-theme', nx); paint();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', paint);
    paint();
  }
  /* ---------- floating nav: adapts to what is behind it, hides on scroll down ---------- */
  var topBar = $('.top'), handle = $('.nav-handle'), lastY = 0, ticking = false;
  function setHidden(h) { topBar.classList.toggle('hide', h); document.body.classList.toggle('nav-off', h); }
  function adaptNav() {
    var r = topBar.getBoundingClientRect(); if (r.bottom < 0) return;
    var y = r.top + r.height / 2, d = 0, l = 0;
    for (var i = 0; i < 7; i++) {
      var x = r.left + r.width * (i + .5) / 7;
      var el = (document.elementsFromPoint ? document.elementsFromPoint(x, y) : []).filter(function (e) { return !topBar.contains(e) && e !== handle && e !== document.documentElement && e !== document.body; })[0];
      if (!el) continue;
      if (el.closest('header.hero, .code')) d++; else l++;
    }
    topBar.classList.toggle('light', d === 0 && l > 0);
    topBar.classList.toggle('scrolled', window.scrollY > 10);
  }
  function onScroll() {
    var y = window.scrollY;
    if (y < 90) setHidden(false);
    else if (Math.abs(y - lastY) > 6) { if (y > lastY) { if (!topBar.matches(':hover') && !topBar.querySelector(':focus-visible')) setHidden(true); } else setHidden(false); }
    if (Math.abs(y - lastY) > 6 || y < 90) lastY = y;
    adaptNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', adaptNav);
  handle.addEventListener('click', function () { setHidden(false); lastY = window.scrollY; });
  topBar.addEventListener('focusin', function () { setHidden(false); });
  $$('[data-foundation-trace]').forEach(function (trace) {
    var steps = $$('[data-trace-step]', trace);
    var back = $('[data-trace-back]', trace), next = $('[data-trace-next]', trace);
    var count = $('[data-trace-count]', trace), step = 0;
    function render() {
      steps.forEach(function (panel, i) { panel.hidden = i !== step; });
      back.disabled = step === 0;
      next.textContent = step === steps.length - 1 ? 'Restart' : 'Next instruction';
      count.textContent = 'Step ' + step + ' of ' + (steps.length - 1);
    }
    back.addEventListener('click', function () { step--; render(); });
    next.addEventListener('click', function () { step = (step + 1) % steps.length; render(); });
    render();
    $('.foundation-trace-controls', trace).hidden = false;
  });
  buildNav(); themeInit(); calmInit();
  window.addEventListener('hashchange', show);
  show();
})();
