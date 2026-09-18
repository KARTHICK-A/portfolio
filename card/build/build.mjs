// Generates contact.vcf, print.html, sw.js from card/build/data.mjs.
// Run:  node card/build/build.mjs        (optionally CARD_URL=... to re-point the page QR)
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARD_URL, person, vcardQR, vcardFile } from './data.mjs';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const qrcode = require(join(ROOT, 'vendor/qrcode.js'));

export function make(text) {
  const c = qrcode(0, 'M');
  c.addData(text, 'Byte');
  c.make();
  return c;
}
export const version = (c) => (c.getModuleCount() - 17) / 4;

// Inline SVG, one <rect> per run of dark modules — small file, exact edges,
// resolution-independent so it prints as crisply as the printer allows.
function svg(code, mm, id, label) {
  const n = code.getModuleCount(), q = 4, side = n + q * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    let run = 0;
    for (let c = 0; c <= n; c++) {
      const dark = c < n && code.isDark(r, c);
      if (dark) { run++; continue; }
      if (run) { d += `M${c - run + q} ${r + q}h${run}v1h-${run}z`; run = 0; }
    }
  }
  return `<svg class="qr" role="img" aria-label="${label}" width="${mm}mm" height="${mm}mm" `
    + `viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">`
    + `<rect width="${side}" height="${side}" fill="#fff"/><path fill="#000" d="${d}"/></svg>`;
}

const qrCard = make(vcardQR);
const qrPage = make(CARD_URL);

writeFileSync(join(ROOT, 'contact.vcf'), vcardFile, 'utf8');

const print = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Print sheet — Karthick A</title>
<style>
  @page{size:A4;margin:12mm}
  html{background:#f2f4f8}
  body{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#000;font-size:10pt}
  .sheet{background:#fff;max-width:186mm;margin:0 auto;padding:10mm}
  h1{font-size:12pt;margin:0 0 2mm}
  p.note{font-size:8.5pt;color:#444;margin:0 0 8mm;max-width:120mm}
  .piece{border:0.2mm dashed #9aa;padding:4mm;margin:0 0 10mm;display:inline-block;vertical-align:top}
  .piece figcaption{font-size:7.5pt;color:#555;margin:3mm 0 0;letter-spacing:.06em}
  .card{width:85mm;height:55mm;padding:5mm;display:flex;gap:5mm;align-items:center}
  .card .who{font-size:8.5pt;line-height:1.45}
  .card .who b{font-size:11pt;display:block;margin:0 0 1mm}
  .tent{width:148mm;padding:8mm;text-align:center}
  .tent .who{font-size:13pt;line-height:1.5;margin:0 0 5mm}
  .tent .who b{font-size:20pt;display:block}
  .qr{display:block}
  .tent .qr{margin:0 auto}
  @media print{html,body{background:#fff}.sheet{padding:0;max-width:none}.piece{border-color:#ccc}}
</style>
</head>
<body>
<div class="sheet">
  <h1>Karthick A — print sheet</h1>
  <p class="note">Print at 100% scale (no "fit to page"), on A4. Dashed rules are cut guides, not crop
  marks — trim just inside them so no line remains. Codes are vector, so they print at the full
  resolution of the printer. The table-tent code is 60&nbsp;mm and scans from about 2&nbsp;m;
  the business-card code is 28&nbsp;mm and scans at arm's length.</p>

  <figure class="piece">
    <div class="card">
      ${svg(qrCard, 28, 'card', 'Contact QR code for Karthick A')}
      <div class="who"><b>Karthick A</b>Embedded Systems Engineer<br>Spark Invotech Pvt Ltd<br>
      ${person.phone}<br>${person.email}</div>
    </div>
    <figcaption>BUSINESS CARD 85 × 55 MM — CONTACT CODE</figcaption>
  </figure>

  <figure class="piece">
    <div class="tent">
      <p class="who"><b>Karthick A</b>Embedded Systems Engineer · Spark Invotech Pvt Ltd</p>
      ${svg(qrCard, 60, 'tent', 'Contact QR code for Karthick A')}
      <p class="who" style="font-size:9pt;margin:4mm 0 0">SCAN TO SAVE MY CONTACT</p>
    </div>
    <figcaption>A5 TABLE TENT — CONTACT CODE</figcaption>
  </figure>

  <figure class="piece">
    <div class="tent">
      ${svg(qrPage, 60, 'page', 'QR code linking to the contact page of Karthick A')}
      <p class="who" style="font-size:9pt;margin:4mm 0 0">ALL MY LINKS<br>${CARD_URL.replace(/^https?:\/\//, '')}</p>
    </div>
    <figcaption>A5 TABLE TENT — PAGE LINK CODE</figcaption>
  </figure>
</div>
</body>
</html>
`;
writeFileSync(join(ROOT, 'print.html'), print, 'utf8');

// Cache version is derived from the files themselves, so shipping a change
// always invalidates the old cache and never needs a manual bump.
const assets = ['index.html', 'print.html', 'contact.vcf', 'og.png', 'portrait.webp', 'details.html', 'Karthick-A-details.pdf',
  'Karthick-A-resume.pdf',
  'vendor/qrcode.js', ...readdirSync(join(ROOT, 'fonts')).map((f) => 'fonts/' + f)];
const h = createHash('sha256');
for (const a of assets) { try { h.update(readFileSync(join(ROOT, a))); } catch { h.update(a); } }
const CACHE = 'karthick-card-' + h.digest('hex').slice(0, 10);

writeFileSync(join(ROOT, 'sw.js'), `// generated by card/build/build.mjs — do not edit
const CACHE='${CACHE}';
const ASSETS=${JSON.stringify(['./', ...assets], null, 0)};
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
    const copy=res.clone();
    if(res.ok&&new URL(e.request.url).origin===location.origin)
      caches.open(CACHE).then(c=>c.put(e.request,copy));
    return res;
  }).catch(()=>caches.match('./'))));
});
`, 'utf8');

console.log('contact QR : version %d, %d modules, %d bytes',
  version(qrCard), qrCard.getModuleCount(), Buffer.byteLength(vcardQR));
console.log('page QR    : version %d, %d modules — %s',
  version(qrPage), qrPage.getModuleCount(), CARD_URL);
console.log('cache      :', CACHE);
