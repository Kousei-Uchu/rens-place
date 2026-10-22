/* Page script: runs the pixel header, lets you poke the shark, sprinkles fireflies. */
(function () {
  'use strict';
  var Sprite = window.AspenSprite, Scn = window.AspenScene;
  var canvas = document.getElementById('scene'), hero = document.getElementById('hero');
  var hit = document.getElementById('sharkHit'), bubble = document.getElementById('bubble');
  if (!canvas || !Sprite || !Scn) return;

  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mk = function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  var scene = null, S = 4, W = 320, lastVw = 0, visible = true, running = false, lastDraw = 0;
  var t0 = performance.now(), STATIC_T = 2.0;
  var now = function () { return (performance.now() - t0) / 1000; };

  function layout() {
    var vw = document.documentElement.clientWidth;
    // whole-number zoom keeps the pixels crisp; cap it so the header never swallows a short window
    S = Math.max(2, Math.min(Math.round(vw / 320), Math.floor(innerHeight * 0.72 / Scn.H)));
    W = Math.ceil(vw / S);
    canvas.width = W; canvas.height = Scn.H;
    canvas.style.width = (W * S) + 'px'; canvas.style.height = (Scn.H * S) + 'px';
    document.documentElement.style.setProperty('--px', S + 'px');
    scene = new Scn.Scene(W, mk, Sprite);
    var sh = scene.shark;                                  // clickable box around the shark
    hit.style.left = ((sh.x + 6) * S) + 'px'; hit.style.top = ((sh.y + 6) * S) + 'px';
    hit.style.width = (44 * S) + 'px'; hit.style.height = ((sh.h - 14) * S) + 'px';
    lastVw = vw;
    ctx.imageSmoothingEnabled = false;
    scene.draw(ctx, reduce ? STATIC_T : now());
  }

  function loop(ts) {
    if (!visible || reduce) { running = false; return; }
    requestAnimationFrame(loop);
    if (ts - lastDraw < 80) return;                        // ~12 fps, chunky like the art
    lastDraw = ts; scene.draw(ctx, now());
  }
  function kick() { if (!running && visible && !reduce) { running = true; requestAnimationFrame(loop); } }

  layout(); kick();
  var rt;
  addEventListener('resize', function () {
    if (document.documentElement.clientWidth === lastVw) return;   // ignore mobile address-bar height jumps
    clearTimeout(rt); rt = setTimeout(function () { layout(); kick(); }, 120);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }).observe(hero);
  }

  /* ---- poke the shark ---- */
  var lines = [
    'hi!! welcome to my corner of the internet.',
    'sunsets are free. enjoy this one.',
    'have you had some water today? go grab some.',
    'if a moth wanders past, that is allowed.',
    'everything here is a work in progress. like me.',
    'the mug is mine. the view is yours.',
    'shoes off, stay a while.',
    'okay, one pat. that is the limit.'
  ];
  var li = Math.floor(Math.random() * lines.length), bt;
  hit.addEventListener('click', function () {
    li = (li + 1) % lines.length;
    bubble.textContent = lines[li]; bubble.hidden = false;
    var sh = scene.shark, left = (sh.x + 40) * S, max = canvas.clientWidth - bubble.offsetWidth - 8;
    bubble.style.left = Math.max(8, Math.min(left, max)) + 'px';
    bubble.style.top = Math.max(8, (sh.y + 8) * S - bubble.offsetHeight - 6) + 'px';
    scene.wag(now());
    if (reduce) scene.draw(ctx, STATIC_T);
    clearTimeout(bt); bt = setTimeout(function () { bubble.hidden = true; }, 4200);
  });

  /* ---- fireflies drifting over the deck boards (placed by percentage of the page height) ---- */
  if (!reduce) {
    var box = document.createElement('div'); box.className = 'fireflies'; box.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 18; i++) {
      var f = document.createElement('span');
      f.style.left = (Math.random() * 100).toFixed(1) + '%';
      f.style.top = (14 + Math.random() * 84).toFixed(1) + '%';
      f.style.animationDuration = (3 + Math.random() * 4).toFixed(1) + 's, ' + (9 + Math.random() * 8).toFixed(1) + 's';
      f.style.animationDelay = (-Math.random() * 8).toFixed(1) + 's, ' + (-Math.random() * 10).toFixed(1) + 's';
      box.appendChild(f);
    }
    document.body.appendChild(box);
  }
})();
