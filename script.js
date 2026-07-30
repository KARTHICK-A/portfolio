/* Karthick A — PCB edition
   The hero board is real 3D and it is also the navigation: every IC on it
   is one project. Hover a chip to name it, click it to open that project.
   No JS / no WebGL / reduced motion -> the page still reads perfectly. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- scroll reveal ---------- */
document.querySelectorAll('.section, .eng-grid, .stack, .bom').forEach(el => el.classList.add('reveal'));
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.06 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
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

/* ---------- open a project row from anywhere ---------- */
function openProject(ref) {
  const row = document.querySelector(`.row [data-ref="${ref}"]`)?.closest('.row')
    || [...document.querySelectorAll('.row')].find(r => r.querySelector('.ref')?.textContent.trim() === ref);
  if (!row) return;
  document.querySelectorAll('.row[open]').forEach(r => { if (r !== row) r.open = false; });
  row.open = true;
  row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  row.classList.add('flash');
  setTimeout(() => row.classList.remove('flash'), 1200);
}

/* ---------- 3D board ---------- */
function initBoard() {
  const canvas = document.getElementById('pcb3d');
  const tip = document.getElementById('tip');
  const panel = document.querySelector('.hero-board');
  // without three.js or WebGL there is nothing to show: drop the panel entirely
  // rather than leave a hole in the hero
  const giveUp = () => { if (panel) panel.hidden = true; };
  if (!canvas) return;
  if (!window.THREE) return giveUp();

  // board palette matches the page: cyan plasma traces, gold pads (PCB
  // heritage), deep navy substrate
  const TRACE = 0x22e0e6, PAD = 0xf2a93b, SUB = 0x0a1524, DARK = 0x070b14;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return giveUp(); }
  if (!renderer.getContext()) return giveUp();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 7.4, 8.2);
  camera.lookAt(0, 0, 0);

  const board = new THREE.Group();
  scene.add(board);
  const W = 9, H = 6.6;

  // gold for physical metal (pins, header posts) — copper heritage kept
  const padMat = new THREE.MeshStandardMaterial({
    color: PAD, roughness: 0.3, metalness: 0.95, emissive: PAD, emissiveIntensity: 0.08
  });
  const traceMat = new THREE.MeshStandardMaterial({
    color: TRACE, roughness: 0.24, metalness: 0.9,
    emissive: TRACE, emissiveIntensity: 0.35
  });

  // substrate + soldermask edge
  board.add(new THREE.Mesh(
    new THREE.BoxGeometry(W, 0.18, H),
    new THREE.MeshStandardMaterial({ color: SUB, roughness: 0.62, metalness: 0.2 })
  ));
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.06, 0.02, H + 0.06),
    new THREE.MeshStandardMaterial({ color: 0x5b7cff, roughness: .35, metalness: .9, emissive: 0x5b7cff, emissiveIntensity: .5, transparent: true, opacity: .45 })
  );
  edge.position.y = 0.09;
  board.add(edge);

  // routed copper traces
  function trace(x, z, len, horizontal) {
    const g = horizontal ? new THREE.BoxGeometry(len, 0.03, 0.06) : new THREE.BoxGeometry(0.06, 0.03, len);
    const m = new THREE.Mesh(g, traceMat);
    m.position.set(x, 0.1, z);
    board.add(m);
  }
  for (let i = 0; i < 30; i++) {
    let x = (Math.random() - 0.5) * (W - 1.4);
    let z = (Math.random() - 0.5) * (H - 1.4);
    let horiz = Math.random() > 0.5;
    for (let s = 0, segs = 2 + Math.floor(Math.random() * 3); s < segs; s++) {
      const len = 0.6 + Math.random() * 2;
      if (horiz) { trace(x + len / 2, z, len, true); x += len; }
      else { trace(x, z + len / 2, len, false); z += len; }
      horiz = !horiz;
      if (Math.abs(x) > W / 2 || Math.abs(z) > H / 2) break;
    }
  }

  // vias
  const viaGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8);
  for (let i = 0; i < 44; i++) {
    const v = new THREE.Mesh(viaGeo, traceMat);
    v.position.set((Math.random() - 0.5) * (W - 0.7), 0.08, (Math.random() - 0.5) * (H - 0.7));
    board.add(v);
  }

  // ---- interactive ICs = projects ----
  const PROJECTS = [
    { ref: 'U1', label: 'U1 · DUAL-FUEL ECU', x: -2.5, z: -1.0, w: 1.7, d: 1.7 },
    { ref: 'U2', label: 'U2 · INJECTOR MULTIPLIER', x: 0.6, z: -1.9, w: 1.3, d: 0.95 },
    { ref: 'U3', label: 'U3 · AVAS (EV SAFETY)', x: 3.0, z: -1.4, w: 0.95, d: 0.8 },
    { ref: 'U4', label: 'U4 · OIL CONTROL UNIT', x: -1.1, z: 1.5, w: 1.0, d: 0.85 },
    { ref: 'U5', label: 'U5 · TRANSFORMER MONITOR', x: 1.7, z: 1.1, w: 1.2, d: 1.0 },
    { ref: 'U6', label: 'U6 · COLD CHAMBER LOGGER', x: 3.3, z: 1.9, w: 1.0, d: 0.9 },
  ];
  // silkscreen designator printed on the top of each IC
  function silkscreen(text) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#070b14'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#edf1fa';
    x.font = '600 84px "IBM Plex Mono", monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 128, 132);
    x.strokeStyle = 'rgba(34,224,230,.55)'; x.lineWidth = 5;
    x.beginPath(); x.arc(40, 40, 14, 0, 6.3); x.stroke();
    return new THREE.CanvasTexture(c);
  }

  const hotspots = [];
  PROJECTS.forEach(p => {
    const g = new THREE.Group();
    const side = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.4, metalness: 0.45, emissive: TRACE, emissiveIntensity: 0 });
    const top = new THREE.MeshStandardMaterial({ map: silkscreen(p.ref), roughness: 0.5, metalness: 0.25, emissive: TRACE, emissiveIntensity: 0 });
    const mats = [side, side, top, side, side, side];
    const body = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.32, p.d), mats);
    body.position.y = 0.25;
    g.add(body);
    // pin rows
    const pins = Math.max(3, Math.round(p.w / 0.24));
    const pinGeo = new THREE.BoxGeometry(0.08, 0.05, 0.2);
    for (let i = 0; i < pins; i++) {
      const px = -p.w / 2 + (i + 0.5) * (p.w / pins);
      [-1, 1].forEach(side => {
        const pin = new THREE.Mesh(pinGeo, padMat);
        pin.position.set(px, 0.12, side * (p.d / 2 + 0.08));
        g.add(pin);
      });
    }
    // pin-1 dot
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10),
      new THREE.MeshStandardMaterial({ color: 0x22e0e6, emissive: 0x22e0e6, emissiveIntensity: .6 }));
    dot.position.set(-p.w / 2 + 0.16, 0.42, -p.d / 2 + 0.16);
    g.add(dot);

    g.position.set(p.x, 0.09, p.z);
    board.add(g);
    body.userData = { ref: p.ref, label: p.label, group: g, mats: [side, top], baseY: 0.09 };
    hotspots.push(body);
  });

  // passives
  const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.4, metalness: 0.65 });
  [[-3.7, 1.9, 0.32], [-0.4, -0.2, 0.24], [3.9, 0.2, 0.28]].forEach(([x, z, r]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 2.4, 20), capMat);
    c.position.set(x, 0.09 + r * 1.2, z);
    board.add(c);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.022, 8, 22),
      new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: .5, metalness: .85 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.09 + r * 2.1, z);
    board.add(ring);
  });
  const smdMat = new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.6 });
  for (let i = 0; i < 26; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.13), smdMat);
    r.position.set((Math.random() - 0.5) * (W - 1), 0.13, (Math.random() - 0.5) * (H - 1));
    r.rotation.y = Math.random() > 0.5 ? Math.PI / 2 : 0;
    board.add(r);
  }

  // pin header
  const headerBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.16, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x0e1013, roughness: .65 }));
  headerBase.position.set(-2.7, 0.17, 2.6);
  board.add(headerBase);
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.44, 0.07), padMat);
    p.position.set(-3.6 + i * 0.26, 0.37, 2.6);
    board.add(p);
  }

  // status LEDs
  const leds = [];
  [[-4.0, -2.4, 0x00e7a0], [4.0, 2.6, 0xa96bff]].forEach(([x, z, col]) => {
    const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.4 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.15), m);
    l.position.set(x, 0.15, z);
    board.add(l);
    const light = new THREE.PointLight(col, 0.6, 2.6);
    light.position.set(x, 0.5, z);
    board.add(light);
    leds.push({ m, light, phase: Math.random() * 6.28, speed: 1.5 + Math.random() * 2 });
  });

  // lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.38));
  const key = new THREE.DirectionalLight(0xdfe8ff, 1.5); key.position.set(4, 9, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa96bff, 1.1); rim.position.set(-6, 3, -5); scene.add(rim);

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
    // hover test
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

  // frame the whole board whatever the panel shape is
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

  let t = 0, visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  }

  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    t += 0.016;
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    board.rotation.y = cx + (reduce ? 0 : t * 0.05);
    board.rotation.x = -0.42 + cy;
    if (!reduce) board.position.y = Math.sin(t * 0.7) * 0.1;

    hotspots.forEach(h => {
      const on = h === hover;
      const g = h.userData.group;
      g.position.y += ((on ? h.userData.baseY + 0.42 : h.userData.baseY) - g.position.y) * 0.18;
      h.userData.mats.forEach(m => { m.emissiveIntensity += ((on ? 0.5 : 0) - m.emissiveIntensity) * 0.18; });
    });
    if (!reduce) leds.forEach(l => {
      const v = 0.35 + Math.abs(Math.sin(t * l.speed + l.phase)) * 1.5;
      l.m.emissiveIntensity = v;
      l.light.intensity = v * 0.5;
    });
    renderer.render(scene, camera);
  })();
}

if (document.readyState === 'complete') initBoard();
else addEventListener('load', initBoard);
