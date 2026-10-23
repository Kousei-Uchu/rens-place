/* Pixel-art sunset header. The scene is rendered from a deliberately low-resolution,
   nearest-neighbour pixel plate; animated highlights are drawn on the same pixel grid. */
(function (root) {
  'use strict';
  var W = 560, H = 192;
  var WATER = { left: 330, right: 430, top: 83, bottom: 150 };
  function Scene(mk) {
    var self = this;
    var plate = mk(W, H), ctx = plate.getContext('2d');
    var ready = false;
    var img = new Image();
    img.onload = function () { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, W, H); ready = true; };
    img.src = 'assets/sunset-scene-pixel.png';
    self.shark = { x: 176, y: 48, w: 76, h: 124 };
    self.wag = function (t) { self.wagUntil = t + 1.2; };
    self.draw = function (target, t) {
      target.imageSmoothingEnabled = false;
      if (ready) target.drawImage(plate, 0, 0);
      else { target.fillStyle = '#30275a'; target.fillRect(0, 0, W, H); }
      // Animated, one-logical-pixel glints on the sun path. No subpixel drawing.
      var phase = Math.floor(t * 8);
      for (var i = 0; i < 46; i++) {
        var seed = (i * 73 + phase * 29) % 997;
        var x = WATER.left + (seed % (WATER.right - WATER.left));
        var y = WATER.top + ((seed * 7 + i * 11) % (WATER.bottom - WATER.top));
        // The reflection widens toward the viewer and stays near the sun's path.
        var centre = 382 + (y - 95) * 0.12;
        if (Math.abs(x - centre) > 5 + (y - WATER.top) * 0.34) continue;
        if ((i + phase) % 3 === 0) {
          target.fillStyle = (i % 4 === 0) ? '#fff4c5' : '#ffd98e';
          target.fillRect(x, y, 1 + (i % 5 === 0 ? 1 : 0), 1);
        }
      }
      // Tiny stars twinkle without changing the uniform pixel grid.
      for (var s = 0; s < 14; s++) {
        var sx = (17 + s * 41) % W, sy = (5 + s * 13) % 43;
        if (Math.sin(t * 2.1 + s * 1.7) > 0.72) {
          target.fillStyle = '#fff3d4'; target.fillRect(sx, sy, 1, 1);
        }
      }
      // A brief golden tail-tip sparkle when Aspen is clicked, as a playful response.
      if (self.wagUntil && t < self.wagUntil) {
        var f = Math.floor(t * 12) % 3;
        target.fillStyle = '#ffe5a0';
        target.fillRect(160 + f, 112 - (f % 2), 1, 1);
      }
    };
  }
  root.AspenScene = { W: W, H: H, Scene: Scene };
})(window);
