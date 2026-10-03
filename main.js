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
  // Revealing an element is more than adding a class: a stat has to start
  // counting and a bar has to fill. Both the observer and the sweep below
  // hand off to this, because whichever of them gets there first also
  // unobserves the element -- so if only one did the work, the other would
  // never get its turn and the number would sit on zero for good.
  function activate(el, instant) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    if (instant) el.classList.add('is-instant');

    var counter = el.querySelector('[data-count]');
    if (counter && !counter.dataset.done) { counter.dataset.done = '1'; countUp(counter); }

    el.querySelectorAll('[data-bar]').forEach(function (bar) {
      bar.style.width = bar.dataset.bar + '%';
    });

    io.unobserve(el);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) activate(entry.target, false);
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
      if (r.top < vh && r.bottom > 0) activate(el, true);
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
  var ba    = document.getElementById('ba');
  if (range && ba) {
    var handle = document.getElementById('baHandle');

    // One custom property feeds the clip, the handle and both tags, so a
    // drag is a single style write and the opening wipe is just CSS
    // interpolating the same number.
    var paintBA = function () {
      ba.style.setProperty('--split', range.value);
    };

    // Hand control over on first contact: kill the intro transition mid
    // flight and retire the nudge ring.
    var takeOver = function () {
      armed = true;                 // the drag counts as the intro having run
      ba.classList.add('is-shown', 'is-touched');
    };

    range.addEventListener('input', function () { takeOver(); paintBA(); });

    // grab anywhere on the panel and drag, not just the thumb
    var dragBA = false;

    function setFromX(clientX) {
      var r = ba.getBoundingClientRect();
      var v = ((clientX - r.left) / r.width) * 100;
      range.value = v < 0 ? 0 : v > 100 ? 100 : v;
      paintBA();
    }

    ba.addEventListener('pointerdown', function (e) {
      dragBA = true;
      takeOver();
      ba.classList.add('is-dragging');
      ba.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    });
    ba.addEventListener('pointermove', function (e) {
      if (dragBA) setFromX(e.clientX);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      ba.addEventListener(ev, function () {
        dragBA = false;
        ba.classList.remove('is-dragging');
      });
    });

    // The wipe is the point of the panel, so it should not have already
    // happened by the time you scroll down to it: hold the line hard right
    // (all "before") until the panel is properly on screen, then let it run.
    var armed = false;
    var arm = function () {
      if (armed) return;
      armed = true;
      range.value = 50;
      ba.classList.add('is-shown');   // CSS transitions --split 100 -> 50
    };

    if (!window.IntersectionObserver || matchMedia('(prefers-reduced-motion:reduce)').matches) {
      arm();
    } else {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { arm(); obs.disconnect(); }
      }, { threshold: 0.45 }).observe(ba);
    }
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
     7c. SERVICE VIDEO MODAL CONTROLLER
     --------------------------------------------------------- */
  var svcModal = document.getElementById('svcModal');
  if (svcModal) {
    var modalVideo = document.getElementById('modalVideo');
    var modalImage = document.getElementById('modalImage');
    var modalTitle = document.getElementById('modalTitle');
    var modalKicker = document.getElementById('modalKicker');
    var modalDesc = document.getElementById('modalDesc');
    var modalSpecs = document.getElementById('modalSpecs');
    var modalSteps = document.getElementById('modalSteps');
    var modalClose = document.getElementById('modalClose');
    var modalDismiss = document.getElementById('modalDismiss');

    function openSvcModal(row) {
      if (!row) return;
      var title = row.dataset.svcTitle || row.querySelector('h3')?.textContent || 'Service Details';
      var kicker = row.dataset.svcKicker || row.querySelector('.kicker')?.textContent || 'TECHNIQUE';
      var desc = row.dataset.svcDesc || row.querySelector('p:not(.kicker):not(.svcrow__sub)')?.textContent || '';
      var facts = (row.dataset.svcFacts || '').split('|').filter(Boolean);
      var videoSrc = row.dataset.svcVideo || '';
      var imageSrc = row.dataset.svcImage || '';
      var steps = (row.dataset.svcProcess || '').split('||').filter(Boolean);

      if (modalTitle) modalTitle.textContent = title;
      if (modalKicker) modalKicker.textContent = kicker;
      if (modalDesc) modalDesc.textContent = desc;

      if (modalSpecs) {
        modalSpecs.innerHTML = '';
        facts.forEach(function (f) {
          var li = document.createElement('li');
          li.textContent = f;
          modalSpecs.appendChild(li);
        });
      }

      if (modalSteps) {
        modalSteps.innerHTML = '';
        steps.forEach(function (step) {
          var parts = step.split('::');
          var li = document.createElement('li');
          var h = document.createElement('b');
          h.textContent = parts[0] || '';
          var p = document.createElement('span');
          p.textContent = parts[1] || '';
          li.appendChild(h);
          li.appendChild(p);
          modalSteps.appendChild(li);
        });
      }

      // Only the wash service has an actual matching clip; every other
      // service falls back to its reference photo so we never show footage
      // of the wrong technique.
      if (videoSrc && modalVideo) {
        if (modalVideo.src !== videoSrc && !modalVideo.src.endsWith(videoSrc)) {
          modalVideo.src = videoSrc;
        }
        modalVideo.currentTime = 0;
        modalVideo.hidden = false;
        modalVideo.play().catch(function () {});
        if (modalImage) modalImage.hidden = true;
      } else {
        if (modalVideo) { modalVideo.pause(); modalVideo.hidden = true; }
        if (modalImage && imageSrc) {
          modalImage.src = imageSrc;
          modalImage.alt = title;
          modalImage.hidden = false;
        }
      }

      svcModal.classList.add('is-open');
      svcModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeSvcModal() {
      svcModal.classList.remove('is-open');
      svcModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (modalVideo) modalVideo.pause();
    }

    document.querySelectorAll('.svc-modal-trigger, .svcrow__shot').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var row = btn.closest('.svcrow') || (btn.dataset.svc ? document.getElementById(btn.dataset.svc) : null);
        if (row) openSvcModal(row);
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var row = btn.closest('.svcrow') || (btn.dataset.svc ? document.getElementById(btn.dataset.svc) : null);
          if (row) openSvcModal(row);
        }
      });
    });

    if (modalClose) modalClose.addEventListener('click', closeSvcModal);
    if (modalDismiss) modalDismiss.addEventListener('click', closeSvcModal);

    svcModal.addEventListener('click', function (e) {
      if (e.target === svcModal) closeSvcModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && svcModal.classList.contains('is-open')) closeSvcModal();
    });
  }









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
