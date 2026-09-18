# Trade-fair contact card

Static page at `/card/`. Hero is a vCard QR — a plain phone camera opens the
native add-contact sheet from it. A second code encodes this page's URL.

## Files

| Path | What it is |
|---|---|
| `index.html` | the page: CSS and JS inline, no build step at runtime |
| `contact.vcf` | generated — full vCard, the desktop fallback |
| `print.html` | generated — business card (28 mm code) + two A5 table tents (60 mm) |
| `sw.js` | generated — offline cache, version derived from asset hashes |
| `og.png` | generated — 1200×630 link preview |
| `vendor/qrcode.js` | qrcode-generator 2.0.4, MIT, vendored (conference wifi blocks CDNs) |
| `fonts/` | Unbounded + IBM Plex Mono, latin subsets, self-hosted |
| `build/data.mjs` | **the only place contact details are edited** |

## Rebuilding

```sh
node card/build/build.mjs          # contact.vcf, print.html, sw.js
node card/build/og.mjs             # QR matrix for the OG image
python3 card/build/og.py           # og.png  (needs Pillow, fonttools, brotli)
node card/build/build.mjs          # re-run so sw.js hashes the new og.png
```

Change the deployed address with `CARD_URL=https://example.com/ node card/build/build.mjs`.
The **page** QR shown in the browser is built from `location` at runtime, so it is
always correct wherever the page is served; `CARD_URL` only affects the print sheet.

## Known limits

- The contact QR is **version 11** (61 modules), not version 10. The record is
  228 bytes; version 10 at ECC M holds 213. Getting under it would mean dropping
  real data (the "Pvt Ltd" suffix, or the `N:` line), so it was left at 11.
- `og.png` is committed because the build needs Pillow and fonttools, which are
  not part of the site's runtime.
