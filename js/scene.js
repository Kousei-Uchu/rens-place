/* Animated pixel-art header: sunset over a beach, seen from a walnut viewing deck.
   Everything is drawn at a tiny logical resolution (H rows tall) and scaled up with CSS (image-rendering: pixelated).
   Layout is proportional to the width, so it works from phones to wide monitors. */
(function (root) {
  'use strict';

  var H = 150;                       // logical height in pixels
  var HORIZON = 70;                  // y of the sea horizon
  var DECK_TOP = 118;                // y of the deck surface

  // palette (walnut + forest from the site, plus sunset colours)
  var SKY = ['#251f4d', '#30275a', '#3f2f68', '#573a76', '#734480', '#914d86', '#b15888', '#cd6588', '#e27a86', '#ee9380', '#f7ae7c', '#fcc884', '#ffe0a0'];
  var SEA = ['#f7b57c', '#e58f83', '#c06f87', '#8f5a88', '#615185', '#44497f', '#35447a', '#2c3b70'];
  var WALNUT = '#5a3a29', WALNUT_D = '#3d2619', WALNUT_DD = '#26160d', COPPER = '#985b3a', AMBER = '#c58a4a', GOLD = '#e8c98a';
  var FOREST = '#29402e', MOSS = '#3f5743', FOREST_D = '#1c2e22';

  function hash(a, b, c) {
    var h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (((h ^ (h >>> 16)) >>> 0) / 4294967295);
  }

  function Scene(W, mk, Sprite) {
    var self = this;
    self.W = W; self.H = H;
    var deckEnd = Math.round(W * 0.43);                 // x where the deck stops (shark sits here)
    var sunX = Math.round(W * 0.70), sunY = HORIZON + 2, sunR = 13;
    var shoreStart = Math.round(W * 0.30);
    var shoreY = function (x) {
      if (x <= shoreStart) return 130;
      var k = (x - shoreStart) / (W - shoreStart);
      return Math.round(130 - 30 * Math.pow(k, 1.25));
    };
    var sharkX = deckEnd - Math.round(41 * Sprite.SCALE), sharkY = DECK_TOP - Sprite.outSeat;   // scaled so he still sits at the deck end
    self.shark = { x: sharkX, y: sharkY, w: Sprite.outW, h: Sprite.outH };

    /* ---------- static background (built once) ---------- */
    var bg = mk(W, H), b = bg.getContext('2d');
    var px = function (c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
    var rect = function (c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); };

    // sky: banded gradient with checker dithering at the seams
    for (var y = 0; y < HORIZON; y++) {
      for (var x = 0; x < W; x++) {
        var t = y / HORIZON * SKY.length, bi = Math.min(SKY.length - 1, Math.floor(t)), fr = t - bi, c = SKY[bi];
        if (bi < SKY.length - 1 && ((fr > 0.7 && (x + y) % 2 === 0) || (fr > 0.88 && (x + y) % 2 === 1))) c = SKY[bi + 1];
        px(b, x, y, c);
      }
    }
    // sea: bands darker with depth, with the same dithering
    var seaBottom = 134;
    for (y = HORIZON; y < seaBottom; y++) {
      for (x = 0; x < W; x++) {
        var u = (y - HORIZON) / (seaBottom - HORIZON) * SEA.length, si = Math.min(SEA.length - 1, Math.floor(u)), f2 = u - si, sc = SEA[si];
        if (si < SEA.length - 1 && ((f2 > 0.7 && (x + y) % 2 === 0) || (f2 > 0.88 && (x + y) % 2 === 1))) sc = SEA[si + 1];
        px(b, x, y, sc);
      }
    }
    rect(b, 0, HORIZON, W, 1, '#ffe7ae');                 // bright horizon line

    // beach: sand wedge on the right, wet sand along the water
    for (x = 0; x < W; x++) {
      var sy = shoreY(x);
      for (y = sy; y < H; y++) {
        var d = y - sy, col;
        if (d < 2) col = '#7d5a45';
        else if (d < 5) col = '#a8744f';
        else { var m = Math.min(1, (d - 5) / 28); col = m < 0.34 ? '#d49a63' : m < 0.7 ? '#e2b27a' : GOLD; if (((x * 7 + y * 13) % 29) === 0) col = '#f3d9a3'; }
        px(b, x, y, col);
      }
    }
    // little driftwood + shells for charm
    rect(b, Math.round(W * 0.80), 126, 7, 2, '#7d5a45'); rect(b, Math.round(W * 0.80) + 1, 125, 3, 1, '#a8744f');
    px(b, Math.round(W * 0.62), 131, '#fff1d0'); px(b, Math.round(W * 0.62) + 1, 131, '#f0c8b0');

    // deck: posts, front face, planks on top, railing
    var postXs = [10, Math.round(deckEnd * 0.45), deckEnd - 9];
    postXs.forEach(function (pxX) { rect(b, pxX, DECK_TOP + 14, 5, 22, WALNUT_D); rect(b, pxX, DECK_TOP + 14, 1, 22, WALNUT); rect(b, pxX + 4, DECK_TOP + 14, 1, 22, WALNUT_DD); });
    rect(b, 0, DECK_TOP + 4, deckEnd, 10, WALNUT);                                                      // front face
    rect(b, 0, DECK_TOP + 4, deckEnd, 1, COPPER);
    rect(b, 0, DECK_TOP + 13, deckEnd, 1, WALNUT_DD);
    for (x = 14; x < deckEnd; x += 22) rect(b, x, DECK_TOP + 5, 1, 8, WALNUT_D);                         // plank ends
    for (x = 0; x < deckEnd; x++) if (hash(x, 3, 9) > 0.86) px(b, x, DECK_TOP + 5 + Math.floor(hash(x, 5, 2) * 7), WALNUT_D);   // wood grain flecks
    rect(b, 0, DECK_TOP, deckEnd, 4, COPPER);                                                           // top surface
    rect(b, 0, DECK_TOP, deckEnd, 1, AMBER);
    rect(b, 0, DECK_TOP + 2, deckEnd, 1, '#7a4a32');
    for (x = 9; x < deckEnd; x += 26) rect(b, x, DECK_TOP + 1, 1, 3, WALNUT_D);                         // plank seams
    rect(b, deckEnd - 1, DECK_TOP, 1, 14, AMBER);                                                       // lit edge facing the sun
    // railing along the back-left part of the deck
    var railEnd = Math.max(24, deckEnd - 40);
    for (x = 4; x < railEnd; x += 20) { rect(b, x, DECK_TOP - 17, 3, 17, WALNUT); rect(b, x, DECK_TOP - 17, 1, 17, COPPER); }
    rect(b, 0, DECK_TOP - 18, railEnd + 2, 3, COPPER); rect(b, 0, DECK_TOP - 18, railEnd + 2, 1, AMBER); rect(b, 0, DECK_TOP - 16, railEnd + 2, 1, WALNUT_D);
    rect(b, 0, DECK_TOP - 9, railEnd + 2, 2, WALNUT); rect(b, 0, DECK_TOP - 9, railEnd + 2, 1, COPPER);
    // lantern hanging on the second railing post
    var lx = 25;
    rect(b, lx, DECK_TOP - 27, 1, 9, WALNUT_D);
    rect(b, lx - 3, DECK_TOP - 32, 7, 1, WALNUT_D); rect(b, lx - 3, DECK_TOP - 26, 7, 1, WALNUT_D);
    rect(b, lx - 2, DECK_TOP - 31, 5, 5, '#f4c768'); rect(b, lx, DECK_TOP - 30, 1, 3, '#fff2c0');
    rect(b, lx - 3, DECK_TOP - 31, 1, 5, WALNUT_D); rect(b, lx + 3, DECK_TOP - 31, 1, 5, WALNUT_D);

    /* ---------- clouds: small prebuilt sprites that drift ---------- */
    var cloudSprites = [0, 1, 2].map(function (n) {
      var w = 46 + n * 14, h = 16 + n * 3, cv = mk(w, h), c = cv.getContext('2d');
      var lumps = [[0.22, 0.62, 0.2, 0.28], [0.42, 0.45, 0.26, 0.38], [0.64, 0.55, 0.22, 0.32], [0.82, 0.68, 0.16, 0.22]];
      for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
        var inside = lumps.some(function (l) { var dx = (xx / w - l[0]) / l[2], dy = (yy / h - l[1]) / l[3]; return dx * dx + dy * dy <= 1; }) && yy > h * 0.2;
        if (!inside) continue;
        var rel = yy / h, col = rel < 0.42 ? '#ffd7a0' : rel < 0.68 ? '#f4a086' : '#b8648a';
        if (rel >= 0.68 && (xx + yy) % 2 === 0) col = '#d9788a';
        c.fillStyle = col; c.fillRect(xx, yy, 1, 1);
      }
      return cv;
    });
    var clouds = [
      { s: 0, x: W * 0.15, y: 16, v: 1.1 }, { s: 1, x: W * 0.55, y: 30, v: 0.7 }, { s: 2, x: W * 0.88, y: 11, v: 0.9 }, { s: 0, x: W * 0.38, y: 46, v: 1.6 }
    ];
    var stars = [];
    for (var i = 0; i < Math.round(W / 14); i++) stars.push({ x: Math.floor(hash(i, 1, 7) * W), y: Math.floor(hash(i, 2, 7) * 22), p: hash(i, 3, 7) * 6.28 });

    /* ---------- shark frames (built lazily) ---------- */
    var frameCache = {};
    var sharkFrame = function (tail, blink, swing) {
      var key = tail + '' + (blink ? 1 : 0) + swing;
      if (!frameCache[key]) frameCache[key] = Sprite.toCanvas(Sprite.build({ tail: tail, blink: blink, swing: swing }), mk);
      return frameCache[key];
    };
    var wagUntil = 0;
    self.wag = function (t) { wagUntil = t + 1.6; };

    /* ---------- helper drawing used every frame ---------- */
    function disc(c, cx, cy, r, col, clipY) {
      c.fillStyle = col;
      for (var yy = -r; yy <= r; yy++) {
        var y2 = cy + yy; if (y2 >= clipY) break;
        var half = Math.floor(Math.sqrt(r * r - yy * yy) + 0.5);
        c.fillRect(cx - half, y2, half * 2 + 1, 1);
      }
    }
    function halo(c, cx, cy, r, col, parity, clipY) {
      c.fillStyle = col;
      for (var yy = -r; yy <= r; yy++) {
        var y2 = cy + yy; if (y2 >= clipY || y2 < 0) continue;
        var half = Math.floor(Math.sqrt(r * r - yy * yy));
        for (var xx = -half; xx <= half; xx++) { if ((((cx + xx) + y2) & 1) === parity) c.fillRect(cx + xx, y2, 1, 1); }
      }
    }
    function frond(c, x0, y0, ang, len, droop, sway, col, hi) {
      var prev = null;
      for (var s = 0; s <= len; s++) {
        var fx = x0 + Math.cos(ang) * s + sway * (s / len), fy = y0 + Math.sin(ang) * s + droop * s * s / len;
        c.fillStyle = col; c.fillRect(Math.round(fx), Math.round(fy), 1, 2);
        if (s > 2) {                                      // leaflets hang down on both sides
          var side = (s % 2 === 0) ? 1 : -1, ll = 2 + (s > len * 0.45 ? 1 : 0) + (s % 3 === 0 ? 1 : 0);
          c.fillRect(Math.round(fx), Math.round(fy) + 2, 1, ll);
          c.fillRect(Math.round(fx) + side, Math.round(fy) + 1, 1, ll);
        }
        if (hi && s % 3 === 0) { c.fillStyle = hi; c.fillRect(Math.round(fx), Math.round(fy) - 1, 1, 1); }
        prev = fx;
      }
      return prev;
    }

    /* ---------- one frame ---------- */
    self.draw = function (ctx, t) {
      ctx.drawImage(bg, 0, 0);

      // twinkling stars in the deep-indigo top of the sky
      stars.forEach(function (s) { if (Math.sin(t * 1.3 + s.p) > -0.2) px(ctx, s.x, s.y, Math.sin(t * 1.3 + s.p) > 0.7 ? '#fff6d6' : '#cdb9e8'); });

      // sun glow (pulses by one pixel), sun disc, sun just touching the sea
      var pulse = Math.floor(t * 1.2) % 2;
      halo(ctx, sunX, sunY, 40 + pulse, '#f9b88a', 0, HORIZON);
      halo(ctx, sunX, sunY, 28 + pulse, '#fde0a4', 1, HORIZON);
      halo(ctx, sunX, sunY, 19, '#fff0c0', 0, HORIZON);
      disc(ctx, sunX, sunY, sunR, '#ffd36e', HORIZON + 1);
      disc(ctx, sunX, sunY, sunR - 2, '#ffe596', HORIZON + 1);
      disc(ctx, sunX, sunY, sunR - 5, '#fff6cc', HORIZON + 1);

      // clouds
      clouds.forEach(function (cl) {
        var cs = cloudSprites[cl.s], span = W + cs.width + 20;
        var cx = ((cl.x - t * cl.v) % span + span) % span - cs.width;
        ctx.drawImage(cs, Math.round(cx), cl.y);
      });

      // sunset glitter on the water: short horizontal dashes in a widening column under the sun
      var tick = Math.floor(t * 5);
      for (var y = HORIZON + 1; y < 124; y += 2) {
        var dist = y - HORIZON, half = 4 + dist * 0.55;
        for (var x = Math.floor(sunX - half); x <= sunX + half; x++) {
          var r = hash(x, y, tick + Math.floor(y / 2) * 3);
          if (r > 0.80 - Math.max(0, 0.18 - dist * 0.002)) {
            var len = 1 + Math.floor(hash(x, y, 77) * 3);
            ctx.fillStyle = dist < 12 ? '#fff0b8' : dist < 28 ? '#ffd88c' : '#f2a888';
            ctx.fillRect(x, y, len, 1);
          }
        }
      }
      // gentle swell lines across the sea
      for (y = HORIZON + 6; y < 120; y += 7) {
        for (x = 0; x < W; x++) {
          var wv = Math.sin(x * 0.18 + t * 0.9 + y) + Math.sin(x * 0.07 - t * 0.5);
          if (wv > 1.55 && ((x + y) & 1) === 0 && (y > 100 || x % 3 === 0)) px(ctx, x, y, y < 100 ? '#c98898' : '#5a5f94');
        }
      }
      // foam lapping at the shore
      for (x = deckEnd + 1; x < W; x++) {
        var sy = shoreY(x), off = Math.round(Math.sin(t * 0.9 + x * 0.07) * 1.6 + Math.sin(t * 0.5 + x * 0.2) * 0.8);
        if (hash(x, 4, 5) > 0.22) px(ctx, x, sy - 1 + off, '#fff3dd');
        if (hash(x, tick, 11) > 0.7) px(ctx, x, sy - 2 + off, '#ffe9c4');
        px(ctx, x, sy + 1, '#7d5a45');
      }

      // gulls
      for (i = 0; i < 3; i++) {
        var gx = ((t * (3 + i) * 2.2 + i * W * 0.37) % (W + 30)) - 15, gy = 22 + i * 9 + Math.sin(t * 0.9 + i * 2) * 3, up = Math.floor(t * 2.5 + i) % 2 === 0;
        ctx.fillStyle = '#2a1f45';
        if (up) { ctx.fillRect(gx, gy, 3, 1); ctx.fillRect(gx + 3, gy + 1, 1, 1); ctx.fillRect(gx + 4, gy, 3, 1); ctx.fillRect(gx - 1, gy - 1, 1, 1); ctx.fillRect(gx + 7, gy - 1, 1, 1); }
        else { ctx.fillRect(gx, gy + 1, 3, 1); ctx.fillRect(gx + 3, gy, 1, 1); ctx.fillRect(gx + 4, gy + 1, 3, 1); ctx.fillRect(gx - 1, gy + 2, 1, 1); ctx.fillRect(gx + 7, gy + 2, 1, 1); }
      }

      // palm tree on the beach, leaning toward the sea, fronds sway a little
      var palmX = Math.round(W * 0.90), palmBase = shoreY(palmX) + 14, topY = 74, topX = palmX - 8;
      for (y = palmBase; y > topY; y--) {
        var k = (palmBase - y) / (palmBase - topY), tx = Math.round(palmX - 8 * k * k - 1 * k);
        ctx.fillStyle = '#26362a'; ctx.fillRect(tx, y, k < 0.5 ? 4 : 3, 1);
        if (y % 5 === 0) { ctx.fillStyle = '#3a4a3a'; ctx.fillRect(tx, y, 2, 1); }
        ctx.fillStyle = AMBER; ctx.fillRect(tx - 1, y, 1, 1);
      }
      var sw = Math.sin(t * 1.1) * 1.2;
      [[-3.0, 8, 0.11], [-2.5, 17, 0.07], [-1.95, 20, 0.05], [-1.35, 19, 0.06], [-0.8, 17, 0.1], [-0.35, 12, 0.14], [-3.4, 12, 0.14]].forEach(function (f, n) {
        frond(ctx, topX, topY, f[0], f[1], f[2] * 6, sw * (n % 2 ? 1 : -1), FOREST, MOSS);
      });
      ctx.fillStyle = AMBER; ctx.fillRect(topX - 12, topY + 2, 1, 1); ctx.fillRect(topX - 14, topY + 5, 1, 1);

      // Aspen: tail wags, blinks now and then, feet swing
      var wagging = t < wagUntil;
      var tail = wagging ? [0, 2, 1, 2][Math.floor(t * 8) % 4] : [0, 1, 2, 1][Math.floor(t * 1.2) % 4];
      var blink = (t % 4.6) > 4.42 || (wagging && (t % 0.6) > 0.5);
      var swing = Math.floor(t * 0.9) % 2;
      ctx.drawImage(sharkFrame(tail, blink, swing), sharkX, sharkY);

      // mug of something warm on the deck, with steam
      var mx = sharkX - 3;                                                          // just left of Aspen, whatever his size
      rect(ctx, mx, DECK_TOP - 5, 5, 5, AMBER); rect(ctx, mx, DECK_TOP - 5, 5, 1, GOLD); rect(ctx, mx + 5, DECK_TOP - 4, 1, 3, AMBER); rect(ctx, mx, DECK_TOP - 1, 5, 1, COPPER);
      for (i = 0; i < 3; i++) {
        var ph = ((t * 0.8 + i * 0.33) % 1), sx = mx + 2 + Math.round(Math.sin(t * 2 + i * 2) * 1.2);
        ctx.fillStyle = 'rgba(255,240,208,' + (0.8 - ph * 0.8).toFixed(2) + ')'; ctx.fillRect(sx, DECK_TOP - 7 - Math.round(ph * 9), 1, 2);
      }

      // lantern glow (flickers)
      var fl = Math.floor(t * 6) % 3;
      halo(ctx, 25, DECK_TOP - 29, 9 + (fl === 0 ? 1 : 0), '#f4c768', 0, DECK_TOP - 8);

      // foreground dune grass sways in the breeze
      for (x = 0; x < W; x++) {
        var hgt = 3 + Math.floor(hash(x, 8, 3) * 9) + (hash(x, 9, 3) > 0.93 ? 4 : 0);
        if (hash(x, 1, 1) > 0.58) continue;
        var lean = Math.round(Math.sin(t * 1.4 + x * 0.35) * (hgt > 8 ? 1.6 : 0.9));
        ctx.fillStyle = hgt > 9 ? MOSS : FOREST;
        for (var g = 0; g < hgt; g++) ctx.fillRect(x + Math.round(lean * g / hgt), 146 - g, 1, 1);
        if (hash(x, 12, 4) > 0.97) px(ctx, x + lean, 146 - hgt - 1, GOLD);          // tiny sunlit flowers
      }
      rect(ctx, 0, 146, W, 4, FOREST);                                               // solid band that melts into the page
    };
  }

  var exp = { H: H, HORIZON: HORIZON, DECK_TOP: DECK_TOP, Scene: Scene };
  if (typeof module !== 'undefined' && module.exports) module.exports = exp; else root.AspenScene = exp;
})(typeof window !== 'undefined' ? window : globalThis);