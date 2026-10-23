/* Responsive pixel scene and accessible click interaction. */
(function () {
  'use strict';
  var canvas = document.getElementById('scene');
  var hero = document.getElementById('hero');
  var hit = document.getElementById('sharkHit');
  var bubble = document.getElementById('bubble');
  if (!canvas || !window.AspenScene) return;
  var ctx = canvas.getContext('2d');
  var scene = new window.AspenScene.Scene(function (w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  });
  canvas.width = window.AspenScene.W;
  canvas.height = window.AspenScene.H;
  ctx.imageSmoothingEnabled = false;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = performance.now(), last = 0, visible = true;
  var now = function () { return (performance.now() - start) / 1000; };
  function positionHit() {
    // Percentage placement tracks the character as the canvas scales to any viewport.
    hit.style.left = (176 / 560 * 100) + '%';
    hit.style.top = (48 / 192 * 100) + '%';
    hit.style.width = (80 / 560 * 100) + '%';
    hit.style.height = (120 / 192 * 100) + '%';
  }
  function draw(t) { scene.draw(ctx, t); }
  function loop(ts) {
    if (!visible || reduced) return;
    requestAnimationFrame(loop);
    if (ts - last < 90) return;
    last = ts; draw(now());
  }
  positionHit(); draw(0);
  if (!reduced) requestAnimationFrame(loop);
  addEventListener('resize', positionHit);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible && !reduced) requestAnimationFrame(loop);
  }).observe(hero);
  var messages = [
    'hi!! welcome to my corner of the internet.',
    'sunsets are free. enjoy this one.',
    'the mug is mine. the view is yours.',
    'shoes off, stay a while.'
  ];
  var n = -1, timer;
  hit.addEventListener('click', function () {
    n = (n + 1) % messages.length;
    bubble.textContent = messages[n]; bubble.hidden = false;
    bubble.style.left = Math.min(canvas.clientWidth * .47, Math.max(8, canvas.clientWidth * .38)) + 'px';
    bubble.style.top = Math.max(8, canvas.clientHeight * .28) + 'px';
    scene.wag(now()); draw(now());
    clearTimeout(timer); timer = setTimeout(function () { bubble.hidden = true; }, 3800);
  });
})();
