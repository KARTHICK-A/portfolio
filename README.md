# Karthick A — Portfolio

Personal portfolio of **Karthick A** — Founder & Embedded Systems Engineer, Spark Invotech Pvt Ltd, Chennai.

> I build industrial embedded systems end-to-end — from datasheet to deployed product.

**Live site:** https://karthick-a.github.io/portfolio/

## Structure

```
├── index.html              ← the whole site (single file, no build step)
└── assets/
    ├── images/products/    ← project photos (ecu.jpg, ocu.jpg, cold-chamber.jpg, ...)
    ├── images/profile/     ← profile photo (karthick.jpg)
    ├── models/             ← optional 3D model for the hero (hero.glb)
    └── docs/               ← resume (Karthick_A_Resume.pdf)
```

Opens directly in a browser by double-clicking `index.html` — no server needed. Missing images fall back to clean placeholders automatically.

## Updating

- **New project:** copy an existing `tl-item` block in `index.html`, edit the text and tags, and drop a photo into `assets/images/products/`.
- **New photo/resume:** just replace the file — filenames are wired in already.
- **Hero 3D model:** export a `.glb` as `assets/models/hero.glb`; it loads automatically on the hosted site, otherwise a procedural PCB renders.

## Contact

karthick24092003@gmail.com · [LinkedIn](https://linkedin.com/in/karthick-a-83a352211)
