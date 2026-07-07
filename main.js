/* ============ Karthick A — portfolio v4 ============ */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const preloader = document.getElementById('preloader');
  const wipe = document.querySelector('.wipe');
  const root = document.documentElement;

  /* ---------- Mobile nav (independent of GSAP) ---------- */
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

  const clearWipeState = () => {
    root.classList.remove('wiping');
    sessionStorage.removeItem('wipe');
  };

  /* ---------- Motion off: everything visible, quit ---------- */
  if (!hasGsap || reduced) {
    if (preloader) preloader.remove();
    clearWipeState();
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

  /* ---------- Same-page anchors (with stall watchdog) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      const desired = () => window.scrollY + target.getBoundingClientRect().top - 70;
      if (lenis) {
        lenis.scrollTo(target, { offset: -70, duration: 1.1, force: true });
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

  /* ---------- Page transitions (internal .html links) ---------- */
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || !/\.html(#.*)?$/.test(href) || a.target === '_blank') return;
    a.addEventListener('click', e => {
      e.preventDefault();
      closeMenu();
      sessionStorage.setItem('wipe', '1');
      gsap.set(wipe, { transformOrigin: 'bottom', scaleY: 0 });
      gsap.to(wipe, {
        scaleY: 1, duration: 0.38, ease: 'power4.inOut',
        onComplete: () => { window.location.href = href; }
      });
    });
  });
  const arrivedByWipe = root.classList.contains('wiping');
  if (arrivedByWipe) {
    sessionStorage.removeItem('wipe');
    gsap.set(wipe, { transformOrigin: 'top', scaleY: 1 });
    gsap.to(wipe, {
      scaleY: 0, duration: 0.42, ease: 'power4.inOut', delay: 0.08,
      onComplete: () => root.classList.remove('wiping')
    });
  }

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
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(ring, { scale: 1.9, duration: 0.3 }));
      el.addEventListener('mouseleave', () => gsap.to(ring, { scale: 1, duration: 0.3 }));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: gsap.utils.clamp(-20, 20, (e.clientX - r.left - r.width / 2) * 0.3),
        y: gsap.utils.clamp(-20, 20, (e.clientY - r.top - r.height / 2) * 0.3),
        duration: 0.4, ease: 'power2.out'
      });
    });
    btn.addEventListener('mouseleave', () =>
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' }));
  });

  /* ---------- Home hero intro ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    const scopePath = document.querySelector('.scope-path');
    const scopeLen = scopePath.getTotalLength();
    gsap.set(scopePath, { strokeDasharray: scopeLen, strokeDashoffset: scopeLen });
    gsap.set('.scope-label', { opacity: 0 });
    gsap.set('.hero .mask-inner', { yPercent: 115 });
    gsap.set('.hero-ctas', { opacity: 0, y: 20 });
    gsap.set('.nav', { autoAlpha: 0 });

    const heroTl = gsap.timeline({ paused: true })
      .to('.hero .mask-inner', { yPercent: 0, duration: 0.8, stagger: 0.09, ease: 'power4.out' })
      .to(scopePath, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, '-=0.45')
      .to('.scope-label', { opacity: 1, duration: 0.4 }, '-=0.3')
      .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' }, '-=0.7')
      .to('.nav', { autoAlpha: 1, duration: 0.5 }, '-=0.4');

    /* Preloader: homepage only, once per session, skipped when arriving via wipe */
    if (preloader && !sessionStorage.getItem('preloaded') && !arrivedByWipe) {
      sessionStorage.setItem('preloaded', '1');
      const pct = { v: 0 };
      const pctEl = document.querySelector('.pre-pct');
      gsap.timeline()
        .to(pct, {
          v: 100, duration: 0.8, ease: 'power2.inOut',
          onUpdate: () => { pctEl.textContent = Math.round(pct.v) + '%'; }
        })
        .to(preloader, { clipPath: 'inset(0 0 100% 0)', duration: 0.55, ease: 'power4.inOut' }, '+=0.05')
        .add(() => { preloader.remove(); heroTl.play(); });
    } else {
      if (preloader) preloader.remove();
      heroTl.play();
    }
  } else if (preloader) {
    preloader.remove();
  }

  /* ---------- Case/About hero intro ---------- */
  const pageHero = document.querySelector('.case-hero');
  if (pageHero) {
    gsap.set('.nav', { autoAlpha: 0 });
    const tl = gsap.timeline({ delay: arrivedByWipe ? 0.3 : 0.1 });
    tl.from(pageHero.querySelectorAll('.eyebrow, h1, .case-tags, .bio'), {
      y: 40, opacity: 0, duration: 0.7, stagger: 0.09, ease: 'power4.out'
    });
    const media = pageHero.querySelector('.case-media, .about-photo');
    if (media) {
      gsap.set(media, { clipPath: 'inset(0 0 100% 0)' });
      tl.to(media, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power4.inOut' }, '-=0.4');
    }
    tl.to('.nav', { autoAlpha: 1, duration: 0.5 }, '-=0.3');
  }

  /* ---------- Marquee ---------- */
  const track = document.querySelector('.marquee-track');
  if (track) {
    const marqueeTween = gsap.to(track, { xPercent: -50, repeat: -1, ease: 'none', duration: 24 });
    let speed = 1, targetSpeed = 1;
    if (lenis) lenis.on('scroll', e => {
      targetSpeed = 1 + Math.min(Math.abs(e.velocity) / 40, 3);
    });
    gsap.ticker.add(() => {
      targetSpeed += (1 - targetSpeed) * 0.04;
      speed += (targetSpeed - speed) * 0.1;
      marqueeTween.timeScale(speed);
    });
  }

  /* ---------- Scroll reveals ---------- */
  gsap.set('[data-reveal]', { y: 40, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: batch => gsap.to(batch, {
      y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power4.out', overwrite: true
    })
  });

  /* ---------- Image de-zoom in masks ---------- */
  document.querySelectorAll('.media img, .case-media img').forEach(img => {
    gsap.fromTo(img, { scale: 1.15 }, {
      scale: 1, duration: 1.1, ease: 'power2.out', clearProps: 'scale',
      scrollTrigger: { trigger: img.parentElement, start: 'top 90%', once: true }
    });
  });

  /* ---------- Trace dividers draw in ---------- */
  document.querySelectorAll('.div-path').forEach(path => {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut',
      scrollTrigger: { trigger: path.closest('.divider'), start: 'top 92%', once: true }
    });
  });

  /* ---------- Journey timeline ---------- */
  const tlWrap = document.querySelector('.tl');
  if (tlWrap) {
    gsap.fromTo('.tl-progress', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: tlWrap, start: 'top 72%', end: 'bottom 62%', scrub: 0.4 }
    });
    const desktop = window.innerWidth > 820;
    tlWrap.querySelectorAll('.tl-item').forEach(item => {
      const node = item.querySelector('.tl-node');
      const card = item.querySelector('.tl-card');
      node.classList.remove('lit');
      gsap.set(card, {
        opacity: 0, y: 24,
        x: desktop ? (item.classList.contains('side-l') ? -36 : 36) : 0
      });
      ScrollTrigger.create({
        trigger: item, start: 'top 72%', once: true,
        onEnter: () => {
          node.classList.add('lit');
          gsap.to(card, { opacity: 1, x: 0, y: 0, duration: 0.7, ease: 'power4.out' });
        }
      });
    });
  }

  /* ---------- Giant footer name ---------- */
  gsap.fromTo('.giant-name', { yPercent: 45 }, {
    yPercent: 0, duration: 0.9, ease: 'power4.out',
    scrollTrigger: { trigger: '.giant', start: 'top 92%', once: true }
  });
})();
