/* Karthick A — PCB edition
   The hero board is real 3D and it is also the navigation: every IC on it
   is one project. Hover a chip to name it, click it to open that project.
   No JS / no WebGL / reduced motion -> the page still reads perfectly. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* worldY positions where a section just "powered on" — drained by the flow
   rail below to spark a pulse there, so the current visibly arrives at a
   section the moment it reveals */
window.__flowPulses = [];

/* ---------- scroll reveal ----------
   Every section starts at opacity 0 and is revealed from here, so this code
   failing means a blank page below the hero. IntersectionObserver alone is
   not a safe enough guarantee: browsers suspend observer delivery in
   background and heavily throttled tabs, which includes the in-app browsers
   people arrive from (LinkedIn, WhatsApp). So the observer handles the nice
   staggered entrance, and three independent backstops guarantee the content
   is never left hidden. */
document.querySelectorAll('.section, .eng-grid, .stack').forEach(el => el.classList.add('reveal'));
const revealEls = [...document.querySelectorAll('.reveal')];

function revealNow(el) {
  if (el.classList.contains('in')) return;
  el.classList.add('in');
  window.__flowPulses.push(el.getBoundingClientRect().top + scrollY);
}
const revealAll = () => revealEls.forEach(revealNow);

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      revealNow(e.target);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.02, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach(el => io.observe(el));

  // 1. anything already on screen once the page has loaded
  addEventListener('load', () => setTimeout(() => {
    revealEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) revealNow(el);
    });
  }, 100));
  // 2. a tab that was hidden while loading gets a second chance
  document.addEventListener('visibilitychange', () => { if (!document.hidden) io.takeRecords(); });
  // 3. absolute backstop — content wins over choreography
  setTimeout(revealAll, 4000);
} else {
  revealAll();
}

/* ---------- boot-sequence typing in the hero ---------- */
/* the full text is in the markup for no-JS/reduced-motion/crawlers; with JS we
   clear it and retype it like a UART console printing its POST lines */
const boot = document.getElementById('boot');
if (boot && !reduce) {
  const lines = (boot.dataset.lines || '').split('\n');
  const caret = boot.querySelector('.caret');
  boot.textContent = '';
  if (caret) boot.appendChild(caret);
  let li = 0, ci = 0;
  (function type() {
    if (li >= lines.length) return;
    const line = lines[li];
    if (ci === 0 && li > 0) boot.insertBefore(document.createElement('br'), caret);
    if (ci < line.length) {
      boot.insertBefore(document.createTextNode(line[ci++]), caret);
      setTimeout(type, 14 + Math.random() * 26);
    } else { li++; ci = 0; setTimeout(type, 260); }
  })();
}

/* ---------- spec strip count-up ---------- */
const specs = document.querySelectorAll('.spec strong');
if (specs.length && !reduce && 'IntersectionObserver' in window) {
  const so = new IntersectionObserver((es, obs) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const final = e.target.textContent;           // e.g. "16" or "70 °C"
      const num = parseInt(final, 10);
      if (isNaN(num)) return;
      const suffix = final.replace(/^[0-9]+/, '');
      const t0 = performance.now(), dur = 900;
      (function step(t) {
        const k = Math.min((t - t0) / dur, 1);
        e.target.textContent = Math.round(num * (1 - Math.pow(1 - k, 3))) + suffix;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  specs.forEach(el => so.observe(el));
}

/* ---------- scroll progress trace ---------- */
const bar = document.getElementById('progress');
if (bar) {
  const drawProgress = () => {
    const max = document.body.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', drawProgress, { passive: true });
  addEventListener('resize', drawProgress);
  drawProgress(); // reloading mid-page must not start the trace at 0%
}

/* ---------- project cards ----------
   Cards arrive one at a time as each scrolls into view, so the section
   plays as a sequence instead of landing all at once. The .in class only
   ever *adds* the entrance; the content is in the DOM and readable
   regardless, and the reveal backstops above cover a throttled tab. */
const cards = [...document.querySelectorAll('.pcard')];
if (cards.length && 'IntersectionObserver' in window) {
  const cardIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      obs.unobserve(en.target);
      en.target.classList.add('in');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
  cards.forEach(c => cardIO.observe(c));

  // same three guarantees the section reveal uses
  addEventListener('load', () => setTimeout(() => {
    cards.forEach(c => {
      const r = c.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) c.classList.add('in');
    });
  }, 100));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cardIO.takeRecords(); });
  setTimeout(() => cards.forEach(c => c.classList.add('in')), 4000);
} else {
  cards.forEach(c => c.classList.add('in'));
}

/* ---------- jump to a project from the 3D board ---------- */
function openProject(ref) {
  const card = document.querySelector(`.pcard[data-ref="${ref}"]`);
  if (!card) return;
  document.querySelectorAll('.pcard.is-active').forEach(c => c.classList.remove('is-active'));
  card.classList.add('in', 'is-active');
  card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  card.classList.add('flash');
  setTimeout(() => card.classList.remove('flash'), 1200);
}

/* ---------- project rows open on click only ----------
   An earlier build advanced these automatically as you scrolled: whichever
   row sat nearest the viewport centre opened itself and the previous one
   closed. Each of those transitions changes page height by several hundred
   pixels, so the content under the reader's finger jumped and photos
   appeared unbidden — the page felt like it was scrolling itself. Reading
   is now entirely reader-driven; the first row starts open so the section
   still reads at a glance. */
(function openFirstRow() {
  const rows = [...document.querySelectorAll('#work .row')];
  if (!rows.length || rows.some(r => r.open)) return;
  rows[0].open = true;
  rows[0].classList.add('is-active');
})();

/* ---------- 3D board ---------- */
function initBoard() {
  const canvas = document.getElementById('pcb3d');
  const tip = document.getElementById('tip');
  const panel = document.querySelector('.hero-board');
  const giveUp = () => { if (panel) panel.hidden = true; };
  if (!canvas) return;
  if (!window.THREE) return giveUp();

  /* Physically-plausible palette. Real boards are not neon: the substrate is a
     dark soldermask, copper is warm brown-gold, pads are plated gold. Only the
     signal pulses emit — everything else is lit, not glowing. That, plus tone
     mapping and an environment to reflect, is what stops it reading cartoon. */
  const SUB = 0x0d2029, COPPER = 0x9a6b3f, PAD = 0xd8a34a, SIGNAL = 0x22e0e6, DARK = 0x0a0e15;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return giveUp(); }
  if (!renderer.getContext()) return giveUp();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  /* Studio environment, generated in a canvas so nothing extra downloads.
     Metals with no environment have nothing to mirror and go flat plastic —
     this one addition does most of the "looks real" work. */
  (function buildEnv() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0.00, '#cdd8e6');
    grad.addColorStop(0.34, '#5d6b7d');
    grad.addColorStop(0.52, '#1b222c');
    grad.addColorStop(1.00, '#070a0e');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 128);
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.beginPath(); g.ellipse(74, 20, 40, 15, 0, 0, 6.29); g.fill();
    g.fillStyle = 'rgba(150,200,225,.5)';
    g.beginPath(); g.ellipse(196, 34, 30, 12, 0, 0, 6.29); g.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(tex).texture;
    tex.dispose(); pmrem.dispose();
  })();

  const board = new THREE.Group();
  scene.add(board);
  const W = 9, H = 6.6;

  const padMat = new THREE.MeshStandardMaterial({ color: PAD, roughness: 0.26, metalness: 1.0 });
  const copperMat = new THREE.MeshStandardMaterial({ color: COPPER, roughness: 0.32, metalness: 1.0 });
  const subMat = new THREE.MeshStandardMaterial({ color: SUB, roughness: 0.68, metalness: 0.05 });

  /* Bevelled substrate — a chamfered edge catches the key light and reads as a
     manufactured part; a plain box does not. */
  (function substrate() {
    const r = 0.34, hw = W / 2, hh = H / 2, s = new THREE.Shape();
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r); s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.2, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035,
      bevelSegments: 2, curveSegments: 14
    });
    const m = new THREE.Mesh(geo, subMat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.1;
    board.add(m);
  })();

  /* Soft contact shadow so the board sits in space instead of floating. */
  (function contactShadow() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    rg.addColorStop(0, 'rgba(0,0,0,.55)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 1.5, H * 1.7),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })
    );
    p.rotation.x = -Math.PI / 2;
    p.position.y = -0.32;
    board.add(p);
  })();

  // ---- interactive ICs = projects ----
  const PROJECTS = [
    { ref: 'U1', label: 'U1 · DUAL-FUEL ECU', x: -2.5, z: -1.0, w: 1.7, d: 1.7 },
    { ref: 'U2', label: 'U2 · INJECTOR MULTIPLIER', x: 0.6, z: -1.9, w: 1.3, d: 0.95 },
    { ref: 'U3', label: 'U3 · AVAS (EV SAFETY)', x: 3.0, z: -1.4, w: 0.95, d: 0.8 },
    { ref: 'U4', label: 'U4 · OIL CONTROL UNIT', x: -1.1, z: 1.5, w: 1.0, d: 0.85 },
    { ref: 'U5', label: 'U5 · TRANSFORMER MONITOR', x: 1.7, z: 1.1, w: 1.2, d: 1.0 },
    { ref: 'U6', label: 'U6 · COLD CHAMBER LOGGER', x: 3.3, z: 1.9, w: 1.0, d: 0.9 }
  ];

  /* Deterministic orthogonal routing between the ICs and the header — real
     layout, not scattered random sticks. Each route also carries a pulse. */
  const ROUTES = [
    [[-3.0, 2.6], [-2.5, 2.6], [-2.5, 0.1]],
    [[-2.5, -1.9], [-2.5, -2.6], [0.6, -2.6], [0.6, -2.5]],
    [[1.3, -1.9], [2.2, -1.9], [2.2, -1.4], [2.5, -1.4]],
    [[-1.1, 0.95], [-1.1, 0.2], [0.9, 0.2], [0.9, 1.1], [1.1, 1.1]],
    [[2.3, 1.1], [3.3, 1.1], [3.3, 1.45]],
    [[-1.6, 1.5], [-3.4, 1.5], [-3.4, -1.4], [-2.9, -1.4]],
    [[3.0, -1.0], [3.0, 0.3], [4.0, 0.3]],
    [[0.6, -1.4], [0.6, -0.4], [-0.2, -0.4], [-0.2, 1.5], [-1.6, 1.5]]
  ];
  const pulses = [];
  const pulseGeo = new THREE.BoxGeometry(0.16, 0.05, 0.09);
  const pulseMat = new THREE.MeshBasicMaterial({ color: SIGNAL });

  ROUTES.forEach((pts, ri) => {
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(pts[i][0], 0.215, pts[i][1]);
      const b = new THREE.Vector3(pts[i + 1][0], 0.215, pts[i + 1][1]);
      const len = a.distanceTo(b);
      if (len < 0.001) continue;
      segs.push({ a, b, len, start: total });
      total += len;
      const horiz = Math.abs(b.x - a.x) > Math.abs(b.z - a.z);
      const t = new THREE.Mesh(
        new THREE.BoxGeometry(horiz ? len : 0.075, 0.022, horiz ? 0.075 : len), copperMat
      );
      t.position.set((a.x + b.x) / 2, 0.205, (a.z + b.z) / 2);
      board.add(t);
      const via = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 12), padMat);
      via.position.set(b.x, 0.215, b.z);
      board.add(via);
    }
    if (!segs.length) return;
    const mesh = new THREE.Mesh(pulseGeo, pulseMat);
    board.add(mesh);
    pulses.push({ mesh, segs, total, t: (ri / ROUTES.length) * total, speed: 1.8 + (ri % 3) * 0.5 });
  });

  function silkscreen(text) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#0a0e15'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#c9d2e0';
    x.font = '600 84px monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 128, 132);
    x.strokeStyle = 'rgba(200,210,225,.5)'; x.lineWidth = 5;
    x.beginPath(); x.arc(40, 40, 14, 0, 6.3); x.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const hotspots = [];
  PROJECTS.forEach(p => {
    const g = new THREE.Group();
    const side = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.44, metalness: 0.25, emissive: SIGNAL, emissiveIntensity: 0 });
    const top = new THREE.MeshStandardMaterial({ map: silkscreen(p.ref), roughness: 0.52, metalness: 0.2, emissive: SIGNAL, emissiveIntensity: 0 });
    const mats = [side, side, top, side, side, side];
    const body = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.32, p.d), mats);
    body.position.y = 0.25;
    g.add(body);
    const pins = Math.max(3, Math.round(p.w / 0.24));
    const pinGeo = new THREE.BoxGeometry(0.08, 0.05, 0.2);
    for (let i = 0; i < pins; i++) {
      const px = -p.w / 2 + (i + 0.5) * (p.w / pins);
      [-1, 1].forEach(s => {
        const pin = new THREE.Mesh(pinGeo, padMat);
        pin.position.set(px, 0.12, s * (p.d / 2 + 0.08));
        g.add(pin);
      });
    }
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a3340, roughness: 0.5, metalness: 0.3 }));
    dot.position.set(-p.w / 2 + 0.16, 0.42, -p.d / 2 + 0.16);
    g.add(dot);

    g.position.set(p.x, 0.2, p.z);
    board.add(g);
    body.userData = { ref: p.ref, label: p.label, group: g, mats: [side, top], baseY: 0.2 };
    hotspots.push(body);
  });

  // passives — deterministic placement, muted ceramic and metal
  const capMat = new THREE.MeshStandardMaterial({ color: 0x1c222b, roughness: 0.42, metalness: 0.55 });
  [[-3.7, 1.9, 0.32], [-0.4, -0.2, 0.24], [3.9, 0.2, 0.28]].forEach(([x, z, r]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 2.4, 24), capMat);
    c.position.set(x, 0.2 + r * 1.2, z);
    board.add(c);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.022, 10, 26),
      new THREE.MeshStandardMaterial({ color: 0xb9c0c8, roughness: 0.34, metalness: 1.0 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.2 + r * 2.1, z);
    board.add(ring);
  });
  const smdMat = new THREE.MeshStandardMaterial({ color: 0x252b34, roughness: 0.55, metalness: 0.2 });
  const SMD = [[-4.0, 0.9], [-3.2, -0.3], [-1.9, 2.3], [-0.9, -2.4], [0.2, 2.5], [1.4, -0.9],
    [2.1, 2.4], [2.8, -2.5], [3.6, -0.6], [4.1, 1.7], [-4.1, -1.9], [1.0, 0.8]];
  SMD.forEach(([x, z], i) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.13), smdMat);
    r.position.set(x, 0.235, z);
    r.rotation.y = i % 2 ? Math.PI / 2 : 0;
    board.add(r);
    [-1, 1].forEach(s => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.13), padMat);
      cap.position.set(x + (i % 2 ? 0 : s * 0.13), 0.235, z + (i % 2 ? s * 0.13 : 0));
      cap.rotation.y = i % 2 ? Math.PI / 2 : 0;
      board.add(cap);
    });
  });

  // pin header
  const headerBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.16, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.6, metalness: 0.1 }));
  headerBase.position.set(-3.0, 0.28, 2.6);
  board.add(headerBase);
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.44, 0.07), padMat);
    p.position.set(-3.9 + i * 0.26, 0.48, 2.6);
    board.add(p);
  }

  // status LEDs — restrained, two only
  const leds = [];
  [[-4.0, -2.4, 0x33d17a], [4.0, 2.6, 0xe8b13c]].forEach(([x, z, col]) => {
    const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, roughness: 0.3 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.14), m);
    l.position.set(x, 0.25, z);
    board.add(l);
    const light = new THREE.PointLight(col, 0.35, 2.4);
    light.position.set(x, 0.55, z);
    board.add(light);
    leds.push({ m, light, phase: x, speed: 1.4 });
  });

  // lighting — the environment carries most of it; these shape it
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  const key = new THREE.DirectionalLight(0xf4f8ff, 1.6); key.position.set(4, 9, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0x7f9ec4, 0.45); fill.position.set(-6, 3, -5); scene.add(fill);

  // ---- interaction ----
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let tx = 0.35, ty = 0, cx = 0.35, cy = 0, dragging = false, moved = false, px = 0, py = 0, hover = null;

  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    return r;
  }
  canvas.addEventListener('pointermove', e => {
    const r = setPointer(e);
    if (dragging) {
      moved = true;
      tx += (e.clientX - px) * 0.006;
      ty = Math.max(-0.35, Math.min(0.5, ty + (e.clientY - py) * 0.004));
      px = e.clientX; py = e.clientY;
    }
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(hotspots, false)[0];
    const obj = hit ? hit.object : null;
    if (obj !== hover) {
      hover = obj;
      canvas.style.cursor = obj ? 'pointer' : 'grab';
    }
    if (obj && tip) {
      tip.hidden = false;
      tip.textContent = obj.userData.label;
      tip.style.left = (e.clientX - r.left) + 'px';
      tip.style.top = (e.clientY - r.top) + 'px';
    } else if (tip) tip.hidden = true;
  });
  canvas.addEventListener('pointerdown', e => { dragging = true; moved = false; px = e.clientX; py = e.clientY; });
  addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointerleave', () => { if (tip) tip.hidden = true; hover = null; });
  canvas.addEventListener('click', e => {
    if (moved) return;
    setPointer(e);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(hotspots, false)[0];
    if (hit) openProject(hit.object.userData.ref);
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fov = camera.fov * Math.PI / 180;
    const halfW = W / 2 + 0.9, halfH = H / 2 + 0.6;
    const d = Math.max(halfW / (Math.tan(fov / 2) * camera.aspect), halfH / Math.tan(fov / 2)) * 1.1;
    camera.position.set(0, d * 0.66, d * 0.75);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  let visible = true, last = performance.now(), raf = null;

  function frame() {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    board.rotation.y = cx + (reduce ? 0 : (now / 1000) * 0.035);
    board.rotation.x = -0.42 + cy;

    hotspots.forEach(h => {
      const on = h === hover;
      const g = h.userData.group;
      g.position.y += ((on ? h.userData.baseY + 0.38 : h.userData.baseY) - g.position.y) * 0.18;
      h.userData.mats.forEach(m => { m.emissiveIntensity += ((on ? 0.42 : 0) - m.emissiveIntensity) * 0.18; });
    });

    if (!reduce) {
      pulses.forEach(p => {
        p.t = (p.t + dt * p.speed) % p.total;
        const seg = p.segs.find(s => p.t >= s.start && p.t <= s.start + s.len) || p.segs[0];
        p.mesh.position.lerpVectors(seg.a, seg.b, (p.t - seg.start) / seg.len);
      });
      leds.forEach(l => {
        const v = 0.5 + Math.abs(Math.sin(now / 1000 * l.speed + l.phase)) * 0.8;
        l.m.emissiveIntensity = v;
        l.light.intensity = v * 0.3;
      });
    }
    renderer.render(scene, camera);
  }
  function sync() {
    const run = visible && !document.hidden;
    if (run && raf === null) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!run && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; sync(); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', sync);
  sync();
}

if (document.readyState === 'complete') initBoard();
else addEventListener('load', initBoard);

/* ---------- current-flow rail ----------
   A live copper bus that runs the height of the page. The trace shape is
   generated from world-Y with a seeded hash, so it looks identical on every
   load and never "jumps" as you scroll — same trick real layout tools use
   for infinite procedural routing. Electrons drift on their own (idle
   current) and surge with scroll velocity (you moving = current moving).
   Reveal.js pushes a worldY into window.__flowPulses whenever a section
   powers on; this loop turns each into a brief bright ring right on the
   trace, so current visibly arrives exactly when a section does. */
(function initFlow() {
  const canvas = document.getElementById('flow');
  if (!canvas || reduce) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const mq = matchMedia('(min-width: 1180px)');
  let active = mq.matches;
  const onMq = e => { active = e.matches; };
  mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq);

  const CYAN = '34,224,230', BLUE = '91,124,255', VIOLET = '169,107,255', GOLD = '242,169,59';
  const COLORS = [CYAN, BLUE, VIOLET];
  const W = 64, SEG = 220, AMP = 20, CENTER = 30;

  function hashX(i) {
    const s = Math.sin(i * 12.9898) * 43758.5453;
    return CENTER + ((s - Math.floor(s)) * 2 - 1) * AMP;
  }
  function traceX(worldY) {
    const i = Math.floor(worldY / SEG);
    const t = (worldY % SEG) / SEG;
    const xA = hashX(i), xB = hashX(i + 1);
    const chamfer = Math.min(Math.max((t - 0.7) / 0.3, 0), 1); // last 30% of each run doglegs to the next x
    return xA + (xB - xA) * chamfer;
  }

  let dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio, 2);
    canvas.width = W * dpr;
    canvas.height = innerHeight * dpr;
  }
  addEventListener('resize', resize);
  resize();

  const docH = () => Math.max(document.body.scrollHeight, innerHeight * 2);
  const N = 6;
  const electrons = Array.from({ length: N }, (_, i) => ({ y: (docH() / N) * i, c: COLORS[i % COLORS.length] }));
  const sparks = [];

  let lastY = scrollY, boost = 0, lastT = performance.now();
  // the hero uses its own wider grid, so the rail's fixed offset isn't
  // guaranteed clear of the headline there; simplest correct fix is to have
  // the current switch on as you leave the hero, like power reaching the
  // rest of the circuit — also reads as an intentional reveal, not a dodge
  const heroEndY = () => { const el = document.getElementById('work'); return el ? el.getBoundingClientRect().top + scrollY : 0; };
  // Cache both: reading them per frame forced a layout on every frame.
  let cachedH = docH(), heroY = heroEndY();
  const recache = () => { cachedH = docH(); heroY = heroEndY(); };
  addEventListener('resize', recache);
  if ('ResizeObserver' in window) new ResizeObserver(recache).observe(document.body);

  (function loop() {
    requestAnimationFrame(loop);
    if (!active || document.hidden) return;
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    const sy = scrollY;
    canvas.style.opacity = Math.min(Math.max((sy - (heroY - 320)) / 320, 0), 1);
    boost = boost * 0.9 + Math.abs(sy - lastY) * 1.4; // scroll velocity feeds the surge, then decays
    lastY = sy;
    const speed = 26 + Math.min(boost, 1400); // px/sec: idle drift + surge

    const H = cachedH;
    const wrap = y => ((y % H) + H) % H;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, innerHeight);

    // dormant trace + vias for the visible slice
    ctx.beginPath();
    for (let y = sy - 40; y <= sy + innerHeight + 40; y += 8) {
      const x = traceX(wrap(y));
      if (y === sy - 40) ctx.moveTo(x, y - sy); else ctx.lineTo(x, y - sy);
    }
    ctx.strokeStyle = 'rgba(120,150,200,.16)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (let y = Math.ceil((sy - 40) / SEG) * SEG; y < sy + innerHeight + 40; y += SEG) {
      const x = traceX(wrap(y));
      ctx.beginPath();
      ctx.arc(x, y - sy, 2.6, 0, 6.29);
      ctx.fillStyle = 'rgba(' + GOLD + ',.35)';
      ctx.fill();
    }

    if (window.__flowPulses.length) {
      window.__flowPulses.forEach(y => sparks.push({ y, age: 0 }));
      window.__flowPulses.length = 0;
    }

    electrons.forEach(e => {
      e.y = wrap(e.y + speed * dt);
      const localY = e.y - sy;
      if (localY < -60 || localY > innerHeight + 60) return;
      for (let k = 5; k >= 0; k--) {
        const ty = e.y - k * 10, tLocal = ty - sy;
        if (tLocal < -60 || tLocal > innerHeight + 60) continue;
        const x = traceX(wrap(ty));
        const a = k === 0 ? 1 : (1 - k / 6) * 0.5;
        if (k === 0) {                    // cheap glow first: soft wide circle behind the bright core
          ctx.beginPath();
          ctx.arc(x, tLocal, 8, 0, 6.29);
          ctx.fillStyle = 'rgba(' + e.c + ',.22)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, tLocal, k === 0 ? 3.4 : 2, 0, 6.29);
        ctx.fillStyle = 'rgba(' + e.c + ',' + a.toFixed(2) + ')';
        ctx.fill();
      }
    });

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt;
      if (s.age > 1.1) { sparks.splice(i, 1); continue; }
      const localY = s.y - sy;
      if (localY < -80 || localY > innerHeight + 80) continue;
      const k = s.age / 1.1;
      ctx.beginPath();
      ctx.arc(traceX(wrap(s.y)), localY, 3 + k * 16, 0, 6.29);
      ctx.strokeStyle = 'rgba(' + GOLD + ',' + (1 - k).toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  })();
})();

/* ---------- project galleries: inspection-light hover + lightbox ---------- */
document.querySelectorAll('.gshot').forEach(shot => {
  if (!reduce) {
    shot.addEventListener('pointermove', e => {
      const r = shot.getBoundingClientRect();
      shot.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      shot.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }
  shot.addEventListener('click', () => openLightbox(shot.dataset.full, shot.dataset.alt));
});

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCap = document.getElementById('lbCap');
let lbReturnFocus = null;

function openLightbox(src, alt) {
  if (!lightbox) return;
  lbReturnFocus = document.activeElement;
  lbImg.src = src;
  lbImg.alt = alt || '';
  lbCap.textContent = alt || '';
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add('in'));
  lightbox.querySelector('.lb-close').focus();
}
function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.classList.remove('in');
  setTimeout(() => { lightbox.hidden = true; lbImg.src = ''; }, reduce ? 0 : 250);
  if (lbReturnFocus) lbReturnFocus.focus();
}
if (lightbox) {
  lightbox.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}
