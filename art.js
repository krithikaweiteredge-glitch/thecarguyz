/* ============================================================
   THE CAR GUYZ — feature artwork panel + hero photograph + cursor glow

   Artwork: drop a file at assets/art/figure.png (or .jpg) and it is used
   for the "The Standard" section. assets/characters/renge.png is also
   accepted so existing files keep working.
   Hero photo: assets/hero/car.jpg (or .png) replaces the WebGL car.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var slot = document.querySelector('.cine__slot');
  if (!slot) return;

  var SOURCES = [
    'assets/art/figure-cut.png',
    'assets/art/figure.png', 'assets/art/figure.jpg',
    'assets/characters/renge.png', 'assets/characters/renge.jpg'
  ];

  (function tryArt(n) {
    if (n >= SOURCES.length) return;
    var probe = new Image();
    probe.onload = function () {
      slot.innerHTML = '<img src="' + SOURCES[n] + '" alt="" />';
      slot.classList.add('has-img');
      if (SOURCES[n].indexOf('-cut') > -1) slot.classList.add('is-cut');
      if (SOURCES[n].indexOf('standard') > -1) {
        slot.classList.add('is-scene');
        slot.closest('.cine__art').classList.add('is-scene');
      }

      // hold the wipe until the artwork is actually on screen. The clip-path
      // that arms it hides the figure, so anything that stops the observer
      // firing has to fall through to showing it anyway.
      var lit = function () { slot.classList.add('is-lit'); };
      var obs = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        lit();
        obs.disconnect();
      }, { threshold: 0.25 });
      obs.observe(slot);
      setTimeout(function () {
        if (!slot.classList.contains('is-lit')) { lit(); obs.disconnect(); }
      }, 1500);
    };
    probe.onerror = function () { tryArt(n + 1); };
    probe.src = SOURCES[n];
  })(0);

  /* ---- drifting embers behind the artwork ---- */
  var cv = document.getElementById('cineAura');
  if (cv) {
    var ctx = cv.getContext('2d');
    var bits = [], cw = 0, ch = 0, running = false;

    function size() {
      var r = cv.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = r.width; ch = r.height;
      cv.width = cw * dpr; cv.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bits = [];
      for (var i = 0; i < 54; i++) {
        bits.push({
          x: Math.random() * cw, y: Math.random() * ch,
          r: Math.random() * 2.2 + 0.5,
          v: Math.random() * 0.7 + 0.2,
          a: Math.random() * 0.55 + 0.12
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, cw, ch);
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        b.y -= b.v;
        b.x += Math.sin((b.y + i * 30) / 40) * 0.4;
        if (b.y < -8) { b.y = ch + 8; b.x = Math.random() * cw; }
        ctx.globalAlpha = b.a;
        ctx.fillStyle = '#ff2d3f';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(draw);
    }

    size();
    window.addEventListener('resize', size, { passive: true });

    new IntersectionObserver(function (e) {
      running = e[0].isIntersecting && !reduced;
      if (running) requestAnimationFrame(draw);
      else if (reduced) draw();
    }, { threshold: 0.02 }).observe(cv);
  }

  /* ---- artwork drifts slightly against the scroll ---- */
  if (!reduced) {
    var art = document.getElementById('cineArt');
    var section = document.getElementById('standard');
    var ticking = false;

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var r = section.getBoundingClientRect();
        var vh = window.innerHeight;
        if (r.top < vh && r.bottom > 0) {
          var p = (vh * 0.5 - (r.top + r.height * 0.5)) / vh;
          art.style.transform = 'translate3d(0,' + (p * 34).toFixed(1) + 'px,0) scale(' + (1 + Math.abs(p) * 0.02).toFixed(3) + ')';
        }
        ticking = false;
      });
    }, { passive: true });
  }
})();

/* ============================================================
   HERO STAGE — headlight layer + layered parallax

   The car, the character and the slash artwork are three stacked images.
   Moving them by different amounts against the pointer is what gives the
   hero its depth; each layer's strength comes from its data-depth.
   ============================================================ */
(function () {
  var lit = new Image();
  lit.onload = function () {
    document.documentElement.style.setProperty('--hero-lights', 'url("assets/hero/car-lights.png")');
  };
  lit.src = 'assets/hero/car-lights.png';

  var stage = document.getElementById('heroStage');
  if (!stage) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover:none)').matches) return;

  var layers = [].slice.call(stage.querySelectorAll('[data-depth]')).map(function (el) {
    return { el: el, d: parseFloat(el.getAttribute('data-depth')) || 0 };
  });

  var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });

  function loop() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;

    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      // the keyframe animation owns transform, so parallax rides on top of it
      L.el.style.setProperty('--px', (-cx * L.d).toFixed(2) + 'px');
      L.el.style.setProperty('--py', (-cy * L.d * 0.6).toFixed(2) + 'px');
      L.el.style.setProperty('--rot', (cx * L.d * 0.12).toFixed(2) + 'deg');
    }

    if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) requestAnimationFrame(loop);
    else running = false;
  }
})();

/* ============================================================
   FEATURE CHARACTER — pointer tilt

   Rides on top of the artFloat3d keyframes via custom properties, so the
   character leans toward the cursor while it keeps floating.
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover:none)').matches) return;

  var art = document.getElementById('cineArt');
  var img = art && art.querySelector('.cine__slot img');
  if (!art) return;

  var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

  art.addEventListener('pointermove', function (e) {
    var r = art.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });

  art.addEventListener('pointerleave', function () {
    tx = 0; ty = 0;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });

  function loop() {
    img = img || art.querySelector('.cine__slot img');   // art.js injects it async
    cx += (tx - cx) * 0.07;
    cy += (ty - cy) * 0.07;
    if (img) {
      img.style.setProperty('--cx', (cx * 26).toFixed(2) + 'px');
      img.style.setProperty('--cy', (cy * 14).toFixed(2) + 'px');
      img.style.setProperty('--cr', (cx * 10).toFixed(2) + 'deg');
    }
    if (Math.abs(tx - cx) > 0.0004 || Math.abs(ty - cy) > 0.0004) requestAnimationFrame(loop);
    else running = false;
  }
})();

/* ============================================================
   CURSOR GLOW
   ============================================================ */
(function () {
  if (window.matchMedia('(hover:none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var g = document.createElement('div');
  g.className = 'cursorglow';
  document.body.appendChild(g);

  var x = 0, y = 0, cx = 0, cy = 0;
  window.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY;
    g.classList.add('is-on');
  }, { passive: true });

  (function loop() {
    cx += (x - cx) * 0.12;
    cy += (y - cy) * 0.12;
    g.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    requestAnimationFrame(loop);
  })();
})();
