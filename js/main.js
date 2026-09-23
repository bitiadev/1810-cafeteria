/* ============================================================
   1810 — scroll-scrubbed cinematic engine (image-based, no video)
   Vanilla JS, framework-agnostic. Ken Burns + crossfade per scene,
   driven purely by scroll position — no timers, no video decode cost.
   ============================================================ */
(function () {
  "use strict";

  var scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));
  var N = scenes.length;
  var spacer = document.getElementById("spacer");
  var progressFill = document.querySelector(".progress__fill");
  var dots = Array.prototype.slice.call(document.querySelectorAll(".rail__dot"));

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FADE = 0.15;      // crossfade half-width, in "scene units", straddling each boundary
  var ZOOM_MAX = 0.085; // Ken Burns: how much the image scales up across a scene's span
  var DRIFT_MAX = 1.6;  // Ken Burns: vertical drift in % across a scene's span
  var BLUR_MAX = 3.5;    // px, motion-blur feel at the mid-point of a crossfade

  var lastWidth = window.innerWidth;
  var ticking = false;
  var currentTextIndex = -1;
  var primed = false;

  // Video scenes are scroll-scrubbed (currentTime <-> scroll position) instead
  // of the Ken Burns fake-zoom used for static photos — the camera move is
  // already baked into the footage.
  var videos = Array.prototype.slice.call(document.querySelectorAll(".scene__video"));
  videos.forEach(function (v) {
    v.pause();
    v.defaultMuted = true;
    v.muted = true;
  });

  function primeVideos() {
    if (primed) return;
    primed = true;
    videos.forEach(function (v) {
      var p = v.play();
      if (p && p.then) p.then(function () { v.pause(); }).catch(function () {});
    });
  }
  window.addEventListener("scroll", primeVideos, { passive: true, once: true });
  window.addEventListener("touchstart", primeVideos, { passive: true, once: true });

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function docScrollableRange() {
    return Math.max(1, spacer.offsetHeight - window.innerHeight);
  }

  function render() {
    ticking = false;

    var range = docScrollableRange();
    var scrollY = window.scrollY || window.pageYOffset;
    var globalProgress = clamp(scrollY / range, 0, 1);
    var sceneFloat = globalProgress * N;

    progressFill.style.width = (globalProgress * 100).toFixed(2) + "%";

    var textIndex = clamp(Math.floor(sceneFloat), 0, N - 1);

    for (var i = 0; i < N; i++) {
      var scene = scenes[i];
      var media = scene.querySelector(".scene__img, .scene__video");
      var isVideo = media && media.tagName === "VIDEO";

      var d1 = sceneFloat - i;           // distance from this scene's start boundary
      var d2 = (i + 1) - sceneFloat;     // distance from this scene's end boundary

      var fadeIn = i === 0 ? 1 : smoothstep((d1 + FADE) / (2 * FADE));
      var fadeOut = i === N - 1 ? 1 : smoothstep((d2 + FADE) / (2 * FADE));
      var opacity = clamp(Math.min(fadeIn, fadeOut), 0, 1);

      if (opacity <= 0.002) {
        if (scene.style.visibility !== "hidden") scene.style.visibility = "hidden";
        if (scene.style.opacity !== "0") scene.style.opacity = "0";
        continue;
      }

      scene.style.visibility = "visible";
      scene.style.opacity = opacity.toFixed(3);

      var localT = clamp(d1, 0, 1);
      var blur = (1 - Math.abs(2 * opacity - 1)) * BLUR_MAX;

      if (isVideo) {
        media.style.setProperty("--kb-blur", reduceMotion ? "0px" : blur.toFixed(2) + "px");
        var dur = media.duration;
        if (dur && isFinite(dur) && !reduceMotion) {
          var target = localT * dur;
          if (Math.abs(media.currentTime - target) > 0.03) {
            try { media.currentTime = target; } catch (e) {}
          }
        }
      } else if (!reduceMotion) {
        var scale = 1 + localT * ZOOM_MAX;
        var driftY = -(localT * DRIFT_MAX);

        media.style.setProperty("--kb-scale", scale.toFixed(4));
        media.style.setProperty("--kb-y", driftY.toFixed(3) + "%");
        media.style.setProperty("--kb-blur", blur.toFixed(2) + "px");
      }
    }

    if (textIndex !== currentTextIndex) {
      currentTextIndex = textIndex;
      scenes.forEach(function (s, i) {
        s.classList.toggle("is-active", i === textIndex);
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === textIndex);
      });
    }
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(render);
      ticking = true;
    }
  }

  function onResize() {
    // Ignore height-only changes (mobile URL bar show/hide) to avoid scroll jumps.
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    render();
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      var range = docScrollableRange();
      var y = (i / N) * range + 4;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", function () {
    lastWidth = 0; // force recalculation on rotate
    setTimeout(onResize, 120);
  });

  render();
})();
