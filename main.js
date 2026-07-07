/* ============ Karthick A — portfolio v3 ============ */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const preloader = document.getElementById('preloader');

  /* ---------- Mobile nav (works with or without GSAP) ---------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const closeMenu = () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });

  /* ---------- Motion off: show everything, quit ---------- */
  if (!hasGsap || reduced) {
    if (preloader) preloader.remove();
    document.querySelectorAll('a[href^="#"]').forEach(a =>
      a.addEventListener('click', closeMenu));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Anchor scrolling ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      const desired = () => window.scrollY + target.getBoundingClientRect().top - 70;
      if (lenis) {
        lenis.scrollTo(target, { offset: -70, duration: 1.1, force: true });
        // Watchdog: if Lenis stalls for any reason, land on the target natively
        setTimeout(() => {
          if (Math.abs(window.scrollY - desired()) > 60) {
            if (lenis) lenis.scrollTo(desired(), { immediate: true, force: true });
            window.scrollTo(0, desired());
          }
        }, 1400);
      } else {
        window.scrollTo({ top: desired(), behavior: 'smooth' });
      }
    });
  });

  /* ---------- Custom cursor ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power2.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power2.out' });
    window.addEventListener('mousemove', e => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll('a, button, .card').forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(ring, { scale: 1.9, duration: 0.3 }));
      el.addEventListener('mouseleave', () => gsap.to(ring, { scale: 1, duration: 0.3 }));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(btn, {
        x: gsap.utils.clamp(-20, 20, x * 0.3),
        y: gsap.utils.clamp(-20, 20, y * 0.3),
        duration: 0.4, ease: 'power2.out'
      });
    });
    btn.addEventListener('mouseleave', () =>
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' }));
  });

  /* ---------- Hero intro (waits for preloader) ---------- */
  const scopePath = document.querySelector('.scope-path');
  const scopeLen = scopePath.getTotalLength();
  gsap.set(scopePath, { strokeDasharray: scopeLen, strokeDashoffset: scopeLen });
  gsap.set('.scope-label', { opacity: 0 });
  gsap.set('.hero .mask-inner', { yPercent: 115 });
  gsap.set('.hero-ctas', { opacity: 0, y: 20 });
  gsap.set('.nav', { autoAlpha: 0 });

  const heroTl = gsap.timeline({ paused: true })
    .to('.hero .mask-inner', {
      yPercent: 0, duration: 0.8, stagger: 0.09, ease: 'power4.out'
    })
    .to(scopePath, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, '-=0.45')
    .to('.scope-label', { opacity: 1, duration: 0.4 }, '-=0.3')
    .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' }, '-=0.7')
    .to('.nav', { autoAlpha: 1, duration: 0.5 }, '-=0.4');

  /* ---------- Preloader ---------- */
  const pct = { v: 0 };
  const pctEl = document.querySelector('.pre-pct');
  gsap.timeline()
    .to(pct, {
      v: 100, duration: 0.8, ease: 'power2.inOut',
      onUpdate: () => { pctEl.textContent = Math.round(pct.v) + '%'; }
    })
    .to(preloader, {
      clipPath: 'inset(0 0 100% 0)', duration: 0.55, ease: 'power4.inOut'
    }, '+=0.05')
    .add(() => { preloader.remove(); heroTl.play(); });

  /* ---------- Marquee (speeds up with scroll velocity) ---------- */
  const marqueeTween = gsap.to('.marquee-track', {
    xPercent: -50, repeat: -1, ease: 'none', duration: 24
  });
  let speed = 1, targetSpeed = 1;
  if (lenis) lenis.on('scroll', e => {
    targetSpeed = 1 + Math.min(Math.abs(e.velocity) / 40, 3);
  });
  gsap.ticker.add(() => {
    targetSpeed += (1 - targetSpeed) * 0.04;           // decay back to 1
    speed += (targetSpeed - speed) * 0.1;              // smooth follow
    marqueeTween.timeScale(speed);
  });

  /* ---------- Scroll reveals ---------- */
  gsap.set('[data-reveal]', { y: 40, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: batch => gsap.to(batch, {
      y: 0, opacity: 1, duration: 0.7, stagger: 0.08,
      ease: 'power4.out', overwrite: true
    })
  });

  /* ---------- Project image de-zoom ---------- */
  document.querySelectorAll('.media img').forEach(img => {
    gsap.fromTo(img, { scale: 1.15 }, {
      scale: 1, duration: 1.1, ease: 'power2.out',
      clearProps: 'scale',                              // hand transform back to CSS hover
      scrollTrigger: { trigger: img.closest('.media'), start: 'top 90%', once: true }
    });
  });

  /* ---------- Section dividers draw in ---------- */
  document.querySelectorAll('.div-path').forEach(path => {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut',
      scrollTrigger: { trigger: path.closest('.divider'), start: 'top 92%', once: true }
    });
  });

  /* ---------- Giant footer name slides up ---------- */
  gsap.fromTo('.giant-name', { yPercent: 45 }, {
    yPercent: 0, duration: 0.9, ease: 'power4.out',
    scrollTrigger: { trigger: '.giant', start: 'top 92%', once: true }
  });
})();
