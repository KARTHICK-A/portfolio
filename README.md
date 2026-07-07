# Karthick A — Portfolio

Personal portfolio of **Karthick A** — Founder & Embedded Systems Engineer, Spark Invotech Pvt Ltd, Chennai.

> I build industrial embedded systems end-to-end — from datasheet to deployed product.

**Live site:** https://karthick-a.github.io/portfolio/

## Structure

```
├── index.html              ← markup (all copy lives here)
├── styles.css              ← all styling (black theme, signal-green accent)
├── main.js                 ← GSAP + Lenis animations (site works without it too)
├── articles/               ← engineering-note drafts (not linked yet)
└── assets/
    ├── images/products/    ← project photos (ecu.jpg, ocu.jpg, cold-chamber.jpg, ...)
    ├── images/profile/     ← profile photo (karthick.jpg)
    └── docs/               ← resume (Karthick_A_Resume.pdf)
```

Static site, no build step. GSAP/ScrollTrigger/Lenis load from CDN; if they fail (or `prefers-reduced-motion` is set) the site renders fully without animation. Missing images fall back to styled placeholders automatically.

## Updating

- **New project:** copy a `<article class="card">` block in `index.html`, edit the text and tags, and drop a photo into `assets/images/products/`.
- **New photo/resume:** just replace the file — filenames are wired in already.

## Contact

karthick24092003@gmail.com · [LinkedIn](https://linkedin.com/in/karthick-a-83a352211)
