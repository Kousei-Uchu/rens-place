/* Plays a design made with header-studio.html (pixel layers, code layers, masks, rigs).
   Does nothing unless js/header-art.js contains a design, so the built-in procedural header stays the default.
   Code layers get the real window width, so they stay responsive. Pixel layers are anchored left:
   a wider window repeats their last column, a narrower one crops the right edge. */
(function (root) {
  'use strict';
  var art = root.AspenHeaderArt, d = art && art.design, base = root.AspenScene, HR = root.HeaderRender;
  if (!d || !HR || !base) return;
  var model;
  try { model = HR.decode(d); } catch (e) { if (root.console) console.warn('header-art.js design could not be read, using the built-in header:', e.message); return; }

  function Scene(W, mk, Sprite) {
    var env = { mk: mk, Sprite: Sprite, wagUntil: 0 }, k = Sprite.SCALE, deckEnd = Math.round(W * 0.43);
    this.W = W; this.H = model.h;
    var al = model.layers.filter(function (l) { return l.el && l.el.t === 'aspen'; })[0], ap = al && al.el.p || {}, sc = model.scene || {};
    // an Aspen element made in the studio can be moved, so the click area follows it
    this.shark = model.hit || (al
      ? { x: Math.round(W * (sc.deckEnd != null ? sc.deckEnd : 43) / 100) - Math.round((ap.from != null ? ap.from : 41) * k) + (+ap.dx || 0), y: (sc.deckTop != null ? sc.deckTop : base.DECK_TOP) - Sprite.outSeat + (+ap.dy || 0), w: Sprite.outW, h: Sprite.outH }
      : { x: deckEnd - Math.round(41 * k), y: base.DECK_TOP - Sprite.outSeat, w: Sprite.outW, h: Sprite.outH });
    this.wag = function (t) { env.wagUntil = t + 1.6; };
    this.draw = function (ctx, t) { HR.draw(model, ctx, Math.floor(t * model.fps) % model.nf, t, W, env); };
  }
  root.AspenScene = { H: model.h, HORIZON: base.HORIZON, DECK_TOP: base.DECK_TOP, Scene: Scene };
})(window);
