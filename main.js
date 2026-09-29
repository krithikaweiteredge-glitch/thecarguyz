/* ============================================================
   THE CAR GUYZ — interactions + WebGL hero
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. LOADER
     --------------------------------------------------------- */
  var loader = document.getElementById('loader');
  var loadBar = document.getElementById('loadBar');
  var pct = 0;
  if (!loader || !loadBar) { document.body.classList.add('is-ready'); }
  var tick = !loader ? null : setInterval(function () {
    pct = Math.min(100, pct + Math.random() * 18);
    loadBar.style.width = pct + '%';
    if (pct >= 100) {
      clearInterval(tick);
      setTimeout(function () {
        loader.classList.add('is-done');
        document.body.classList.add('is-ready');
        kickHero();
      }, 260);
    }
  }, 130);

  function kickHero() {
    var lines = document.querySelectorAll('.hero .reveal');
    lines.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('in'); }, i * 110);
    });
  }

  /* ---------------------------------------------------------
     2. NAV
     --------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobilemenu');

  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 40);
  }, { passive: true });

  if (burger && menu) {
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    burger.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    menu.hidden = open;
    document.body.style.overflow = open ? '' : 'hidden';
  });

  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      burger.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) burger.click();
  });
  }

  /* ---------------------------------------------------------
     3. SCROLL REVEAL + COUNTERS + STAT BARS
     --------------------------------------------------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');

      var counter = entry.target.querySelector('[data-count]');
      if (counter && !counter.dataset.done) { counter.dataset.done = '1'; countUp(counter); }

      entry.target.querySelectorAll('[data-bar]').forEach(function (bar) {
        bar.style.width = bar.dataset.bar + '%';
      });

      io.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px 240px' });

  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  reveals.forEach(function (el) { io.observe(el); });

  // Scrolling fast can outrun the observer's callback, which leaves a band of
  // blank page where a section should be. This sweeps anything already inside
  // the viewport and reveals it on the spot, no fade, so there is nothing to
  // outrun; it stops costing anything once everything has been revealed.
  var sweeping = false;
  function sweepReveals() {
    sweeping = false;
    var vh = window.innerHeight || 0;
    for (var i = reveals.length - 1; i >= 0; i--) {
      var el = reveals[i];
      if (el.classList.contains('in')) { reveals.splice(i, 1); continue; }
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) { el.classList.add('in', 'is-instant'); io.unobserve(el); }
    }
    if (!reveals.length) window.removeEventListener('scroll', onScrollSweep);
  }
  function onScrollSweep() {
    if (!sweeping) { sweeping = true; requestAnimationFrame(sweepReveals); }
  }
  window.addEventListener('scroll', onScrollSweep, { passive: true });
  sweepReveals();

  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
    var start = performance.now();
    var dur = 1600;
    (function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------------------------------------------------------
     4. CARD TILT (pointer only — never the sole affordance)
     --------------------------------------------------------- */
  if (!reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(900px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' +
          (-py * 7).toFixed(2) + 'deg) translateZ(6px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     5. BEFORE / AFTER SLIDER (range input = keyboard accessible)
     --------------------------------------------------------- */
  var range = document.getElementById('baRange');
  var after = document.getElementById('baAfter');
  var handle = document.getElementById('baHandle');
  if (range) {
    var paintBA = function () {
      var v = range.value;
      after.style.clipPath = 'inset(0 0 0 ' + v + '%)';
      handle.style.left = v + '%';
    };
    range.addEventListener('input', paintBA);
    paintBA();

    // grab anywhere on the panel and drag, not just the thumb
    var ba = document.getElementById('ba');
    var dragBA = false;

    function setFromX(clientX) {
      var r = ba.getBoundingClientRect();
      var v = ((clientX - r.left) / r.width) * 100;
      range.value = v < 0 ? 0 : v > 100 ? 100 : v;
      paintBA();
    }

    ba.addEventListener('pointerdown', function (e) {
      dragBA = true;
      ba.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    });
    ba.addEventListener('pointermove', function (e) {
      if (dragBA) setFromX(e.clientX);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      ba.addEventListener(ev, function () { dragBA = false; });
    });
  }

  /* ---------------------------------------------------------
     6. CREW AURA CANVASES (cursed-energy particles)
     --------------------------------------------------------- */
  document.querySelectorAll('[data-aura]').forEach(function (cv) {
    var host = cv.closest('.fighter');
    var colour = getComputedStyle(host).getPropertyValue('--aura').trim() || '#ff2233';
    var ctx = cv.getContext('2d');
    var parts = [];
    var w = 0, h = 0, raf = null, visible = false;

    function size() {
      var r = cv.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      parts = [];
      for (var i = 0; i < 34; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2.1 + 0.5,
          v: Math.random() * 0.5 + 0.18,
          a: Math.random() * 0.55 + 0.15
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.v;
        p.x += Math.sin((p.y + i * 40) / 48) * 0.35;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    size(); seed();
    if (reduced) { draw(); cancelAnimationFrame(raf); return; }

    // only animate while on screen
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
      if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0.05 }).observe(cv);

    window.addEventListener('resize', function () { size(); seed(); }, { passive: true });
  });

  /* ---------------------------------------------------------
     7. FORM — inline validation, errors beside the field
     --------------------------------------------------------- */
  var form = document.getElementById('bookForm');
  var status = document.getElementById('bookStatus');

  function showError(input, msg) {
    clearError(input);
    input.setAttribute('aria-invalid', 'true');
    var e = document.createElement('span');
    e.className = 'err';
    e.id = input.id + '-err';
    e.textContent = msg;
    input.setAttribute('aria-describedby', e.id);
    input.parentNode.appendChild(e);
  }
  function clearError(input) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    var old = document.getElementById(input.id + '-err');
    if (old) old.remove();
  }

  if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    var required = form.querySelectorAll('[required]');
    var firstBad = null;

    required.forEach(function (input) {
      var v = input.value.trim();
      if (!v) {
        showError(input, 'This one is required.');
        if (!firstBad) firstBad = input;
      } else if (input.type === 'tel' && v.replace(/\D/g, '').length < 8) {
        showError(input, 'That phone number looks too short.');
        if (!firstBad) firstBad = input;
      } else {
        clearError(input);
      }
    });

    if (firstBad) { firstBad.focus(); return; }

    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    setTimeout(function () {
      form.reset();
      btn.disabled = false;
      btn.innerHTML = 'Send Request <span aria-hidden="true">→</span>';
      status.textContent = 'Request received. We\'ll call you back within one working day.';
    }, 700);
  });

  form.querySelectorAll('[required]').forEach(function (input) {
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true' && input.value.trim()) clearError(input);
    });
  });
  }


  /* ---------------------------------------------------------
     7b. MEDIA BAND — swap the poster photograph for the shop's own
     footage, but only once we know the file is actually there, so a
     site without a video never fires a 404.
     --------------------------------------------------------- */
  document.querySelectorAll('.media__frame[data-video]').forEach(function (frame) {
    var src = frame.dataset.video;
    var poster = frame.querySelector('img');
    if (!poster || reduced || !window.fetch) return;

    fetch(src, { method: 'HEAD' }).then(function (res) {
      if (!res.ok) return;
      var v = document.createElement('video');
      v.src = src;
      v.poster = poster.currentSrc || poster.src;
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('aria-hidden', 'true');

      // only start it once the band scrolls into view, and stop when it leaves
      v.addEventListener('loadeddata', function () { poster.replaceWith(v); });
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      }, { threshold: 0.2 }).observe(frame);
    }).catch(function () { /* no footage yet -- the poster stays */ });
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();



  /* ---------------------------------------------------------
     9. THE STANDARD — the process artwork, region by region

     The artwork is one flat image, so a region is just a rectangle
     on it. Lighting one means moving the stage's --ax/--ay/--aw/--ah
     onto that rectangle; the lifted copy and the frame follow in CSS.
     Scrolling the section walks through the nine regions, hovering
     takes it over, and a click zooms the artwork into that panel.
     --------------------------------------------------------- */
  var chStage = document.getElementById('chStage');
  if (chStage) (function () {
    var hots  = [].slice.call(chStage.querySelectorAll('.chapters__hot'));
    var dots  = [].slice.call(document.querySelectorAll('.chapters__dot'));
    var cards = [].slice.call(document.querySelectorAll('.chapters__card'));
    var bar   = document.querySelector('.chapters__bar i');
    var closer = chStage.querySelector('.chapters__close');
    var figure = chStage.closest('.chapters');
    var n = hots.length;
    var current = -1, zoomed = -1, held = false, ticking = false;

    function rect(i) {
      var st = hots[i].style;
      return {
        x: parseFloat(st.getPropertyValue('--x')),
        y: parseFloat(st.getPropertyValue('--y')),
        w: parseFloat(st.getPropertyValue('--w')),
        h: parseFloat(st.getPropertyValue('--h'))
      };
    }

    function show(i) {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === current) return;
      current = i;
      var r = rect(i);
      chStage.style.setProperty('--ax', r.x + '%');
      chStage.style.setProperty('--ay', r.y + '%');
      chStage.style.setProperty('--aw', r.w + '%');
      chStage.style.setProperty('--ah', r.h + '%');
      chStage.classList.add('is-live');
      cards.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', String(k === i)); });
      if (bar) bar.style.width = ((i + 1) / n * 100) + '%';
    }

    /* --- zoom: scale the artwork so one region fills the frame --- */
    function zoom(i) {
      var r = rect(i);
      // fit the whole region, then centre it: translate is applied before the
      // scale, so shifting the region's centre onto 50/50 is what lands it
      var s = Math.min(100 / r.w, 100 / r.h) * 0.92;
      chStage.style.setProperty('--s', s.toFixed(3));
      chStage.style.setProperty('--tx', (50 - (r.x + r.w / 2)).toFixed(2) + '%');
      chStage.style.setProperty('--ty', (50 - (r.y + r.h / 2)).toFixed(2) + '%');
      chStage.classList.add('is-zoom');
      zoomed = i;
      closer.hidden = false;
      show(i);
    }
    function unzoom() {
      chStage.classList.remove('is-zoom');
      chStage.style.setProperty('--s', '1');
      chStage.style.setProperty('--tx', '0%');
      chStage.style.setProperty('--ty', '0%');
      zoomed = -1;
      closer.hidden = true;
    }

    hots.concat(dots).forEach(function (el) {
      var i = parseInt(el.dataset.ch, 10);
      el.addEventListener('click', function () {
        held = true;
        if (zoomed === i) unzoom(); else zoom(i);
      });
      el.addEventListener('mouseenter', function () { held = true; if (zoomed < 0) show(i); });
      el.addEventListener('focus',      function () { held = true; if (zoomed < 0) show(i); });
    });

    closer.addEventListener('click', function () { unzoom(); });
    figure.addEventListener('mouseleave', function () { held = false; });

    figure.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) {
        e.preventDefault(); held = true;
        var next = Math.max(0, Math.min(n - 1, current + d));
        if (zoomed > -1) zoom(next); else show(next);
        hots[next].focus();
      } else if (e.key === 'Escape' && zoomed > -1) {
        unzoom(); hots[current].focus();
      } else if (e.key === 'Home') { e.preventDefault(); held = true; show(0); }
      else if (e.key === 'End')   { e.preventDefault(); held = true; show(n - 1); }
    });

    /* --- scrolling the section walks through the regions --- */
    function fromScroll() {
      ticking = false;
      if (held || zoomed > -1) return;
      var r = chStage.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      // 0 as the artwork arrives, 1 as it leaves
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.45);
      p = Math.max(0, Math.min(0.999, p));
      show(Math.floor(p * n));
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(fromScroll); }
    }, { passive: true });
    window.addEventListener('resize', fromScroll, { passive: true });

    show(0);
    fromScroll();
  })();

  /* ---------------------------------------------------------
     8. WEBGL HERO — stylised car, ceramic clearcoat, aura ring
     --------------------------------------------------------- */
  var canvas = document.getElementById('scene');
  if (!window.THREE || !canvas) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (err) {
    canvas.style.display = 'none';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08090c, 0.035);

  var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 2.4, 12.5);
  camera.lookAt(0, 0.9, 0);

  var world = new THREE.Group();
  scene.add(world);

  /* --- studio environment map: what the clearcoat actually reflects --- */
  function studioEnv() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var g = c.getContext('2d');

    var sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#1a1d26');
    sky.addColorStop(0.5, '#0a0b10');
    sky.addColorStop(1, '#05060a');
    g.fillStyle = sky;
    g.fillRect(0, 0, 256, 256);

    // overhead softbox — gives the long white highlight down the bonnet
    g.fillStyle = '#ffffff';
    g.fillRect(0, 18, 256, 26);
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.fillRect(0, 52, 256, 10);

    // red strip lights either side
    g.fillStyle = '#ff2233';
    g.fillRect(0, 108, 256, 14);
    g.fillStyle = 'rgba(255,34,51,.45)';
    g.fillRect(0, 128, 256, 7);

    var tex = new THREE.CubeTexture([c, c, c, c, c, c]);
    tex.needsUpdate = true;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  scene.environment = studioEnv();

  /* --- car body: extruded side profile --- */
  var profile = new THREE.Shape();
  profile.moveTo(-3.25, 0.62);
  profile.lineTo(-3.30, 1.05);
  profile.lineTo(-3.05, 1.42);
  profile.lineTo(-2.05, 1.58);
  profile.quadraticCurveTo(-1.35, 2.30, -0.55, 2.34);
  profile.lineTo(0.85, 2.26);
  profile.quadraticCurveTo(1.65, 2.18, 2.05, 1.46);
  profile.lineTo(3.05, 1.28);
  profile.quadraticCurveTo(3.42, 1.18, 3.44, 0.86);
  profile.lineTo(3.40, 0.62);
  profile.lineTo(2.30, 0.46);
  profile.lineTo(-2.30, 0.46);
  profile.closePath();

  var WIDTH = 2.45;                     // extrusion depth = car width, along Z

  var bodyGeo = new THREE.ExtrudeGeometry(profile, {
    depth: WIDTH, bevelEnabled: true, bevelThickness: 0.16,
    bevelSize: 0.16, bevelSegments: 5, curveSegments: 24
  });
  bodyGeo.translate(0, 0, -WIDTH / 2);   // centre on Z, keep the profile on X/Y

  var paint = new THREE.MeshPhysicalMaterial({
    color: 0x14161d, metalness: 0.95, roughness: 0.14,
    clearcoat: 1.0, clearcoatRoughness: 0.03, envMapIntensity: 1.5
  });

  var car = new THREE.Group();
  car.add(new THREE.Mesh(bodyGeo, paint));

  /* --- glass canopy (sits in the cabin, length along X) --- */
  var glass = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.66, WIDTH + 0.06),
    new THREE.MeshPhysicalMaterial({
      color: 0x0c0f16, metalness: 0.3, roughness: 0.03,
      transparent: true, opacity: 0.72, clearcoat: 1, envMapIntensity: 2.4
    })
  );
  glass.position.set(-0.25, 1.86, 0);
  car.add(glass);

  /* --- wheels: axle along Z, so rotation.x = 90° --- */
  var tyre = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.88, metalness: 0.05 });
  var rim = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: 0.2, metalness: 1, envMapIntensity: 1.6 });
  var wheelGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.4, 30);
  var rimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.42, 16);
  var wheels = [];

  [[2.05, 1], [2.05, -1], [-2.05, 1], [-2.05, -1]].forEach(function (p) {
    var w = new THREE.Group();
    var t = new THREE.Mesh(wheelGeo, tyre);
    var r = new THREE.Mesh(rimGeo, rim);
    t.rotation.x = Math.PI / 2;
    r.rotation.x = Math.PI / 2;
    w.add(t, r);
    w.position.set(p[0], 0.5, p[1] * (WIDTH / 2 - 0.02));
    car.add(w);
    wheels.push(w);
  });

  /* --- tail lights: the logo's signature --- */
  var lampMat = new THREE.MeshStandardMaterial({
    color: 0xff2233, emissive: 0xff2233, emissiveIntensity: 3, roughness: 0.35
  });
  [0.72, -0.72].forEach(function (z) {
    var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.78), lampMat);
    lamp.position.set(-3.3, 1.2, z);
    car.add(lamp);
  });

  // the light the lamps actually throw onto the floor behind the car
  var tailGlow = new THREE.PointLight(0xff2233, 0, 7, 2);
  tailGlow.position.set(-3.9, 1.1, 0);
  car.add(tailGlow);

  // sit the wheels on the floor and push the car clear of the headline
  car.position.set(2.4, -0.6, 0);
  car.rotation.y = -0.55;
  world.add(car);

  /* --- cursed-energy ring behind the car --- */
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(5.1, 0.035, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0xff2233, transparent: true, opacity: 0.55 })
  );
  ring.position.set(2.4, 1.4, -3.2);
  world.add(ring);

  var ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(6.4, 0.02, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0xff2233, transparent: true, opacity: 0.25 })
  );
  ring2.position.copy(ring.position);
  world.add(ring2);

  /* --- reflective floor grid --- */
  var grid = new THREE.GridHelper(80, 60, 0xff2233, 0x1b1e25);
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  grid.position.y = -0.73;   // exactly under the tyres
  scene.add(grid);

  /* --- water-bead particles --- */
  var count = 420;
  var pos = new Float32Array(count * 3);
  var speeds = new Float32Array(count);
  for (var i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 34;
    pos[i * 3 + 1] = Math.random() * 16 - 2;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    speeds[i] = Math.random() * 0.018 + 0.004;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xff4455, size: 0.062, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(dust);

  /* --- lighting: studio rig with red rim --- */
  scene.add(new THREE.AmbientLight(0x404654, 0.7));

  var key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(6, 9, 7);
  scene.add(key);

  var rimL = new THREE.PointLight(0xff2233, 22, 22, 2);
  rimL.position.set(-7, 2.6, -4);
  scene.add(rimL);

  var rimR = new THREE.PointLight(0xff2233, 18, 22, 2);
  rimR.position.set(7, 2.2, -3);
  scene.add(rimR);

  var under = new THREE.PointLight(0xff2233, 10, 12, 2);
  under.position.set(0, -1.1, 0);
  scene.add(under);

  var fill = new THREE.PointLight(0x88aaff, 8, 26, 2);
  fill.position.set(2, 6, 9);
  scene.add(fill);

  /* --- interaction + loop --- */
  var mx = 0, my = 0, tx = 0, ty = 0, scrollY = 0;

  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth - 0.5);
    ty = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });

  // on narrow screens the car sits centred and lower so it never fights the headline
  var carX = 2.4;
  function layout() {
    var w = window.innerWidth;
    camera.aspect = w / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(w, window.innerHeight);

    var narrow = w < 900;
    carX = narrow ? 0 : 2.4;
    car.position.x = carX;
    ring.position.x = carX;
    ring2.position.x = carX;
    camera.position.z = narrow ? 15.5 : 12.5;
    camera.fov = narrow ? 48 : 42;
    camera.updateProjectionMatrix();
  }
  layout();
  window.addEventListener('resize', layout, { passive: true });

  var heroEl = document.querySelector('.hero');
  var heroVisible = true;
  new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }, { threshold: 0 })
    .observe(heroEl);

  var clock = new THREE.Clock();

  function render() {
    requestAnimationFrame(render);
    if (!heroVisible) return;

    var t = clock.getElapsedTime();

    if (!reduced) {
      mx += (tx - mx) * 0.045;
      my += (ty - my) * 0.045;

      car.rotation.y = -0.55 + Math.sin(t * 0.22) * 0.18 + mx * 0.45;
      car.rotation.z = Math.sin(t * 0.4) * 0.012;
      car.position.y = -0.6 + Math.sin(t * 0.85) * 0.05;
      for (var wi = 0; wi < wheels.length; wi++) wheels[wi].rotation.z = -t * 1.1;

      // hazards ticking over -- ~1.5s cycle, with a fast warm-up and a slower
      // decay so it reads as a filament cooling rather than a hard on/off
      var phase = (t % 1.5) / 1.5;
      var lamp;
      if (phase < 0.06) lamp = phase / 0.06;              // strike
      else if (phase < 0.40) lamp = 1;                    // held
      else if (phase < 0.56) lamp = 1 - (phase - 0.40) / 0.16;  // cool down
      else lamp = 0;
      lampMat.emissiveIntensity = 0.3 + lamp * 3.4;
      tailGlow.intensity = lamp * 6;

      ring.rotation.z = t * 0.28;
      ring.rotation.x = 0.42 + Math.sin(t * 0.3) * 0.08;
      ring2.rotation.z = -t * 0.18;
      ring2.rotation.x = 0.35;

      var pArr = pGeo.attributes.position.array;
      for (var i = 0; i < count; i++) {
        pArr[i * 3 + 1] += speeds[i];
        if (pArr[i * 3 + 1] > 14) pArr[i * 3 + 1] = -2;
      }
      pGeo.attributes.position.needsUpdate = true;

      camera.position.x += (carX * 0.45 + mx * 2.2 - camera.position.x) * 0.045;
      camera.position.y += ((2.4 - my * 1.2) - camera.position.y) * 0.045;
      world.position.y = -Math.min(scrollY, 900) * 0.0016;
      camera.lookAt(carX * 0.6, 0.7, 0);
    } else {
      lampMat.emissiveIntensity = 3;
      tailGlow.intensity = 5;
      camera.lookAt(carX * 0.6, 0.7, 0);
    }

    renderer.render(scene, camera);
  }
  render();
})();
