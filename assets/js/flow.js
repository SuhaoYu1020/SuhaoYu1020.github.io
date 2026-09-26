// Reveal content as it scrolls into view, and fill the flow line up to the reading position.
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealables = document.querySelectorAll(".section, .pub");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    revealables.forEach(function (el) { observer.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  var line = document.querySelector(".flow-line");
  if (!line) return;
  var nodes = document.querySelectorAll(".flow .section-title, .flow .news-item");
  var pending = false;

  function update() {
    pending = false;
    var rect = line.getBoundingClientRect();
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    var reach = atBottom ? rect.bottom : Math.min(Math.max(window.innerHeight * 0.45, rect.top), rect.bottom);
    line.style.setProperty("--flow", rect.height ? ((reach - rect.top) / rect.height).toFixed(4) : 1);
    nodes.forEach(function (node) {
      node.classList.toggle("is-ahead", node.getBoundingClientRect().top + 14 > reach + 1);
    });
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.querySelectorAll("details").forEach(function (d) { d.addEventListener("toggle", schedule); });
  update();
})();
