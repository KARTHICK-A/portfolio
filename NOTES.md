# Project Notes — karthick-a.github.io/portfolio

Working log of how this site got its current shape, and the review that drives it.
Static HTML/CSS/JS on GitHub Pages, no build step. three.js is vendored
(`assets/vendor/`) so there is no CDN dependency for the library. Google Fonts CSS is still a third-party request.

## Design history

| Rev | Direction | Verdict |
|-----|-----------|---------|
| v3 | All-black, GSAP + Lenis, oscilloscope motif | superseded |
| v4 | Dual-tone multi-page, case-study pages, timeline | owner liked it, but felt like a generic template |
| v5 | Warm-cream minimal single page (video reference) | **rejected by owner** — too common |
| v6 | **PCB edition (current)** — dark FR-4, copper, interactive 3D board | approved, merged in PR #2 |

## Decisions on record

- **No dates anywhere.** Projects and experience are presented by outcome, not chronology (owner request).
- **The board is the navigation — and never the only one.** Each IC on the 3D hero board (U1–U7) opens its project card. A real link row (`#chipIndex`) under the board does the same for keyboard, screen-reader and touch users, and the cards themselves are plain DOM.
- **Reduced motion ≠ less content.** `prefers-reduced-motion` keeps the board visible and clickable but stops all self-running animation (rotation, LED, ticker, typing, count-up). No three.js / no WebGL removes the board panel entirely.
- **Single page, single CSS file.** GitHub Pages with no build step; the CSS is organized tokens → base → components → motion → responsive instead of split files.
- **Copilot suggestions adopted on merit, not blindly:** IntersectionObserver guards and empty-panel fallback were real bugs (fixed); "remove board for reduced motion" was declined for the reason above.

## 16-lens review (what each reviewer would say, and what changed)

| # | Lens | Finding | Action taken |
|---|------|---------|--------------|
| 1 | Corporate hiring manager (OEM/Tier-1) | Wants proof of delivery, not aesthetics | Client names + "delivered/POC/verified" status on every project; spec strip with hard numbers |
| 2 | Startup founder/CTO | Wants end-to-end ownership signal | "schematic → PCB → firmware → running engine" line; co-founder framing in Engineer section |
| 3 | Recruiter (6-second scan) | Must get role + location + contact instantly | Role in `<h1>`, location in eyebrow, contact & résumé one click from hero |
| 4 | Fellow embedded engineer | Sniffs out fake depth immediately | Real part numbers (ADS1115, ZMPT101B, TIP122, E32), real constraints (flyback, DE/RE, 3-retry ACK) |
| 5 | Performance engineer | three.js is the heavy item | Vendored + deferred; render loop pauses off-screen & when tab hidden; DPR capped at 2; WebP portrait |
| 6 | Accessibility auditor | Canvas-only nav would fail | BOM rows are native `<details>` (keyboard OK); AA contrast documented in CSS header; focus-visible; skip link; ≥44px touch targets |
| 7 | UX researcher | Scannability of long prose | Projects restructured to PROBLEM / CONSTRAINTS / OUTCOME rows |
| 8 | Visual/brand designer | One accent, consistently | Single copper #E8A33D on near-black; Unbounded/Plex pairing; no second accent color |
| 9 | Copywriter | Voice should match the metaphor | BOM, REFDES, layer stack-up, test points, "solder a connection" — one metaphor carried through |
| 10 | SEO specialist | Missing structured data breadth | Person + ItemList(CreativeWork×6) JSON-LD, twitter cards, og:image:alt, sitemap.xml, robots.txt, canonical |
| 11 | Mobile-first reviewer | 3D + type scale on 375px | Board drops above copy at 980px, no horizontal overflow verified at 375/576/768/992/1200 |
| 12 | Psychology (credibility) | Specific numbers beat adjectives | Count-up spec strip: 6 products, 2 deployments, 16 channels, 70 °C span, 1 marine engine |
| 13 | International client | Local references need anchoring | Clients glossed ("diesel fuel-injection systems manufacturer"), languages listed, tel/mail links intl-format |
| 14 | Security/privacy reviewer | No trackers, no third-party JS | Zero analytics, zero CDN, only Google Fonts CSS (swap) — noted as accepted trade-off |
| 15 | Maintainer/code reviewer | Guarded APIs, commented intent | IO feature-detected twice, WebGL try/catch + context check, comments explain *why* |
| 16 | Conversion (CRO) | One primary action per screen | Hero: PROBE MY WORK (primary) + RÉSUMÉ (secondary); contact pads repeat at the end |

## Before / after checklist (v6 → v6.1)

- [x] Twitter cards, og:image:alt, theme-color
- [x] Person **+ ItemList** JSON-LD (was Person only)
- [x] robots.txt + sitemap.xml (were missing)
- [x] Projects restructured PROBLEM/CONSTRAINTS/OUTCOME (was single paragraph)
- [x] 3 featured projects starred (U1, U2, U6)
- [x] Hero CTAs: View work + Résumé download (was work + contact)
- [x] Résumé also at contact TP5 (unchanged)
- [x] Skip link targets `#main` (was `#work`)
- [x] Topbar links padded to ≥44px touch targets
- [x] WebP portrait with JPEG fallback, correct intrinsic size, `decoding="async"`
- [x] New motion: boot-sequence typing, spec count-up, trace-draw section rules, breathing hero glow — all disabled under reduced motion
- [x] CSS architecture + contrast ratios documented in file header

## Lighthouse expectations (NOT measured — targets only; no Lighthouse run has been recorded)

- Performance ~85–92 (three.js ~160 KB gzip is the floor; everything else is < 40 KB total)
- Accessibility 95+ · Best Practices 95+ · SEO 100

## Repository

```
index.html      all markup + copy + JSON-LD
styles.css      single organized stylesheet (see header comment)
script.js       reveal, progress, typing, count-up, 3D board
assets/vendor/three.min.js   r160, vendored
assets/docs/Karthick_A_Resume.pdf
assets/images/profile/karthick.{jpg,webp}
robots.txt · sitemap.xml · NOTES.md (this file)
```

## Standards pass (v6.2) — what changed

Driven by a review against WCAG 2.2 AA, Core Web Vitals and OWASP basics.

- [x] Status tags on U3/U6/U7 no longer `aria-hidden` (client + maturity text was invisible to screen readers)
- [x] Canvas label now says what it is (decorative); `#chipIndex` U1–U7 links give keyboard/AT/touch access
- [x] **Pause motion** switch (WCAG 2.2.2), persisted in `localStorage` (try/catch), hidden when the OS already asks for reduced motion; board spin is accumulated so pausing never snaps it
- [x] U7 added to the 3D board (was 6 chips for 7 projects)
- [x] Spec strip no longer says "3 commercial deployments": it is 3 client engagements, 1 delivered, 2 POC, matching the card tags
- [x] Smallest text raised to 12px (was ~8–11px in places)
- [x] Wide 1200×630 `og.png` for link previews (was a 288×512 portrait)
- [x] Removed dead `openFirstRow()`; docs corrected

## Known gaps / next (not done)

1. Replace the deprecated UMD `three.min.js` (r160) with ES modules + a bundler (tree-shaken, current release)
2. Render on demand (the loop still renders every frame while visible), instance repeated meshes, adaptive pixel ratio
3. `webglcontextlost` / `pointercancel` handling; start the board on DOMContentLoaded rather than `load`
4. Self-host fonts (already done in `card/fonts`), add a meta CSP
5. Tests/CI: Playwright smoke, axe-core, Lighthouse CI
6. Confirm the three client names may be shown publicly
