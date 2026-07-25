// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

// Floating dots (hero) — skipped when reduced motion is preferred
const canvas = document.getElementById('dots');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas && !reduce) {
  const ctx = canvas.getContext('2d');
  let w, h, dots;
  const N = 22;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  function init() {
    dots = Array.from({ length: N }, () => ({
      x: (0.45 + Math.random() * 0.55) * w,   // keep dots on the right side
      y: Math.random() * h,
      r: (1 + Math.random() * 5) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.15 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.15 * devicePixelRatio,
    }));
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1c1b1a';
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < w * 0.4 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  resize(); init(); tick();
  addEventListener('resize', () => { resize(); init(); });
}
