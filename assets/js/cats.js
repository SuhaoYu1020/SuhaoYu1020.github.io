// Two cats live on a strip of floor under the intro. They run after the patch of sunlight that follows
// the visitor's mouse (light.js), squabble in a dust cloud when they reach it together, and play tag on
// their own when the light keeps still. A click or tap on the floor moves the light there; a click on a
// cat makes it hop. With reduced motion they simply sit.
(function () {
  var stage = document.querySelector("[data-playground]");
  if (!stage) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var spot = stage.querySelector(".floor-light");
  var cloud = stage.querySelector(".scuffle");
  var HALF = 40;          // half a cat, so none walks off the floor
  var GRAVITY = 1500;     // px/s², for hops
  var LIGHT_FRESH = 3200; // ms the cats keep after a light that has stopped moving
  var FIGHT = 1700;       // ms in the dust cloud
  var CALM = 4500;        // ms before the next squabble

  function makeCat(name, at, speed) {
    return { el: stage.querySelector('[data-cat="' + name + '"]'), at: at, x: 0, y: 0, vy: 0, v: 0, face: 1,
             speed: speed, boost: 1, target: null, sitting: true, sulkUntil: 0, placed: false };
  }
  var A = makeCat("ginger", 0.36, 330);
  var B = makeCat("ink", 0.6, 300);
  var cats = [A, B];
  if (!A.el || !B.el) return;

  var W = 0;
  var light = { x: 0, seen: false, moved: -1e9 };
  var mode = "rest", plan = null, planUntil = 0, fight = null, calmUntil = 0;
  var visible = true, raf = 0, last = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function near(c, x, d) { return Math.abs(c.x - x) < d; }

  function measure() {
    W = stage.clientWidth;
    cats.forEach(function (c) {
      if (!c.placed) { c.x = c.at * W; c.placed = true; }
      c.x = clamp(c.x, HALF, W - HALF);
      if (c.target != null) c.target = clamp(c.target, HALF, W - HALF);
    });
  }

  // ---- The light on the floor follows the sun's x ----
  function seeLight(vx) {
    var x = clamp(vx - stage.getBoundingClientRect().left, HALF, W - HALF);
    if (light.seen && Math.abs(x - light.x) > 1.5) light.moved = performance.now();
    light.x = x;
    light.seen = true;
    spot.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
    wake();
  }
  window.addEventListener("sunmove", function (e) { seeLight(e.detail.x); });

  // ---- What the cats want ----
  function think(t) {
    if (fight) { if (t >= fight.until) endFight(t); return; }

    if (light.seen && t - light.moved < LIGHT_FRESH) {
      mode = "light"; plan = null;
      cats.forEach(function (c) {
        if (t < c.sulkUntil) return; // still stomping off after losing
        c.target = clamp(light.x + (c.x <= light.x ? -14 : 14), HALF, W - HALF);
        c.boost = 1;
      });
      if (t > calmUntil && near(A, light.x, 60) && near(B, light.x, 60) && Math.abs(A.x - B.x) < 48 && !A.y && !B.y) {
        startFight(t, (A.x + B.x) / 2);
      }
      return;
    }

    if (mode !== "play") { mode = "play"; plan = { kind: "rest" }; planUntil = t + 1200; }
    if (plan && plan.kind === "chase") {
      var r = plan.runner, c = plan.chaser;
      c.target = r.x;
      if (r.sitting) r.target = awayFrom(c.x); // reached the end of the floor: double back past the chaser
      if (Math.abs(c.x - r.x) < 26 && !r.y && t > calmUntil) { startFight(t, (c.x + r.x) / 2); return; }
      if (t > planUntil) { plan = { kind: "rest" }; planUntil = t + 2000; r.target = r.x; c.target = c.x; }
    } else if (t > planUntil) {
      newPlan(t);
    }
  }

  function awayFrom(x) { return x < W / 2 ? rand(W * 0.62, W - HALF) : rand(HALF, W * 0.38); }

  function newPlan(t) {
    var roll = Math.random();
    if (roll < 0.5) {
      var runner = Math.random() < 0.5 ? A : B, chaser = runner === A ? B : A;
      runner.boost = 1;
      chaser.boost = runner.speed / chaser.speed * 1.12; // the chaser is always a little faster
      runner.target = awayFrom(chaser.x);
      plan = { kind: "chase", runner: runner, chaser: chaser }; planUntil = t + 7000;
    } else if (roll < 0.75) {
      cats.forEach(function (c) { c.boost = 0.55; c.target = rand(HALF, W - HALF); });
      plan = { kind: "wander" }; planUntil = t + 4000;
    } else {
      A.target = A.x; B.target = B.x;
      A.face = A.x < B.x ? 1 : -1; B.face = -A.face; // sit and look at each other
      plan = { kind: "rest" }; planUntil = t + rand(2500, 4500);
    }
  }

  // ---- The squabble ----
  function startFight(t, x) {
    fight = { x: clamp(x, 72, W - 72), until: t + FIGHT };
    cats.forEach(function (c) { c.el.classList.add("is-hidden"); c.target = null; c.v = 0; });
    cloud.style.transform = "translate3d(" + fight.x.toFixed(1) + "px,0,0)";
    cloud.classList.add("is-on");
  }

  function endFight(t) {
    cloud.classList.remove("is-on");
    var win = Math.random() < 0.5 ? A : B, lose = win === A ? B : A;
    var dir = fight.x > W / 2 ? -1 : 1; // the loser leaves toward the roomier side
    win.x = fight.x; win.target = win.x; win.face = dir;
    lose.x = fight.x; lose.target = clamp(fight.x + dir * rand(120, 180), HALF, W - HALF);
    lose.boost = 1.15; lose.vy = -420; lose.sulkUntil = t + 2400;
    cats.forEach(function (c) { c.el.classList.remove("is-hidden"); });
    fight = null; calmUntil = t + CALM;
    if (mode === "play") { plan = { kind: "rest" }; planUntil = t + 3000; }
  }

  // ---- Bodies ----
  function move(c, dt) {
    if (c.y < 0 || c.vy) {
      c.vy += GRAVITY * dt; c.y += c.vy * dt;
      if (c.y >= 0) { c.y = 0; c.vy = 0; }
    }
    if (c.target == null) { c.v = 0; c.sitting = true; return; }
    var dx = c.target - c.x;
    if (Math.abs(dx) < 3) { c.x = c.target; c.v = 0; c.sitting = true; return; }
    var dir = dx > 0 ? 1 : -1;
    if (c.v * dir < 0) c.v = 0; // turn on the spot
    var top = Math.min(c.speed * c.boost, Math.abs(dx) * 5 + 60); // slow down to arrive
    c.v += (dir * top - c.v) * Math.min(1, dt * 7);
    c.face = dir; c.sitting = false;
    var step = c.v * dt;
    if (Math.abs(step) > Math.abs(dx)) step = dx;
    c.x = clamp(c.x + step, HALF, W - HALF);
  }

  function render() {
    cats.forEach(function (c) {
      var air = c.y < 0;
      c.el.style.transform = "translate3d(" + c.x.toFixed(1) + "px," + c.y.toFixed(1) + "px,0)";
      c.el.classList.toggle("is-left", c.face < 0);
      c.el.classList.toggle("is-sitting", c.sitting && !air);
      c.el.classList.toggle("is-running", !c.sitting && !air);
      c.el.classList.toggle("is-air", air);
    });
  }

  function tick(t) {
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    think(t);
    move(A, dt); move(B, dt);
    render();
    raf = visible && !reduce.matches ? window.requestAnimationFrame(tick) : 0;
  }

  function wake() {
    if (raf || !visible || reduce.matches) return;
    last = performance.now();
    raf = window.requestAnimationFrame(tick);
  }

  // ---- Play with them ----
  cats.forEach(function (c) {
    c.el.addEventListener("click", function (e) {
      e.stopPropagation();
      if (reduce.matches || fight || c.y) return;
      c.vy = -460;
      wake();
    });
  });
  stage.addEventListener("click", function (e) {
    window.dispatchEvent(new CustomEvent("sunto", { detail: { x: e.clientX, y: e.clientY } }));
  });

  // ---- Start ----
  stage.classList.add("is-live");
  measure();
  B.face = -1;
  if (window.sunlight) seeLight(window.sunlight.x);
  render();
  window.addEventListener("resize", function () { measure(); render(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      wake();
    }).observe(stage);
  }
  if (reduce.addEventListener) reduce.addEventListener("change", function () { render(); wake(); });
  wake();
})();
