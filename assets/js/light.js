// Sunlight that follows the visitor. A soft warm glow eases toward the mouse (or travels with the scroll
// on touch screens), a highlight slides across the avatar and its ring lights up on the near side, and its shadow falls
// away from it. With reduced motion the light stays still in the upper right.
// Each paint announces where the light is (a "sunmove" event, also kept on window.sunlight) for the cats
// in cats.js, and a "sunto" event moves the light to a point (a tap on the cats' floor).
(function () {
  var root = document.documentElement;
  var sun = document.querySelector(".sun");
  var flare = document.querySelector(".flare");
  var ring = document.querySelector(".avatar");
  if (!sun) return;

  var REST = { x: 0.8, y: 0.16 }; // upper right, warming the open side of the intro
  var EASE = 0.06;                // how far the light closes on its target each frame: a gentle chase
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  var pos = { x: REST.x, y: REST.y };
  var target = { x: REST.x, y: REST.y };
  var raf = 0;

  function paint() {
    var w = window.innerWidth, h = window.innerHeight;
    var x = pos.x * w, y = pos.y * h;
    sun.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
    if (flare) {
      var r = flare.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < h) {
        flare.style.transform = "translate3d(" + (x - r.left).toFixed(1) + "px," + (y - r.top).toFixed(1) + "px,0)";
        // turn the bright side of the avatar's ring toward the light (0deg is straight up, clockwise)
        if (ring) ring.style.setProperty("--la", (Math.atan2(x - r.left - r.width / 2, r.top + r.height / 2 - y) * 180 / Math.PI).toFixed(1) + "deg");
      }
    }
    // The shadow falls away from the light: light from the upper left casts it down and to the right.
    root.style.setProperty("--sx", ((0.5 - pos.x) * 28).toFixed(2));
    root.style.setProperty("--sy", (14 + (0.5 - pos.y) * 16).toFixed(2));
    window.sunlight = { x: x, y: y };
    window.dispatchEvent(new CustomEvent("sunmove", { detail: window.sunlight }));
  }

  function frame() {
    pos.x += (target.x - pos.x) * EASE;
    pos.y += (target.y - pos.y) * EASE;
    paint();
    var moving = Math.abs(target.x - pos.x) > 0.0004 || Math.abs(target.y - pos.y) > 0.0004;
    raf = moving ? window.requestAnimationFrame(frame) : 0;
  }

  function chase() {
    if (reduce.matches) { pos.x = target.x = REST.x; pos.y = target.y = REST.y; paint(); return; }
    if (!raf) raf = window.requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || reduce.matches) return;
    target.x = e.clientX / window.innerWidth;
    target.y = e.clientY / window.innerHeight;
    chase();
  }, { passive: true });

  // Without a mouse the light travels with the reading, from the upper right down to the lower left.
  window.addEventListener("scroll", function () {
    if (mouse.matches) { chase(); return; } // keep the photo highlight true while the page moves under a still mouse
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var t = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    target.x = REST.x - t * 0.6;
    target.y = REST.y + t * 0.6;
    chase();
  }, { passive: true });

  window.addEventListener("sunto", function (e) {
    if (reduce.matches) return;
    target.x = e.detail.x / window.innerWidth;
    target.y = e.detail.y / window.innerHeight;
    chase();
  });

  window.addEventListener("resize", paint);
  if (reduce.addEventListener) reduce.addEventListener("change", chase);
  paint();
})();
