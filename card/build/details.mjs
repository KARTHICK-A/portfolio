// Builds card/details.html — the source for the one-page details PDF.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { make } from './build.mjs';
import { CARD_URL, person, vcardQR } from './data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const b64 = (f) => readFileSync(join(ROOT, f)).toString('base64');

function svg(code, mm) {
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
  return `<svg width="${mm}mm" height="${mm}mm" viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges" `
    + `xmlns="http://www.w3.org/2000/svg"><rect width="${side}" height="${side}" fill="#fff"/>`
    + `<path fill="#000" d="${d}"/></svg>`;
}

const stack = [
  ['ECU & engine electronics', 'dual-fuel control · injector drivers · MAP/EGT/RPM sensing · CAN'],
  ['Hardware & PCB', 'MOSFET stages · buck/linear supplies · flyback protection · Altium · KiCad'],
  ['Firmware', 'embedded C/C++ · interrupt-driven · state machines · STM32 / ESP32 / ATtiny'],
  ['Protocols & IoT', 'CAN · RS485 · LoRa · SPI/I2C/UART · HTTP/JSON · SD & SPIFFS logging'],
  ['Test & debug', 'oscilloscope · ST-Link SWD · UPDI · custom UART capture tooling'],
];
const projects = [
  'Dual-Fuel Engine Control Unit (LPG/CNG)',
  'Injector Multiplier',
  'Acoustic Vehicle Alerting System',
  'Oil Control Unit',
  'Compressor Health & Power Monitoring',
  'Cold Chamber Data Logging System',
  'Production Quantity Monitoring System',
];

const rows = [
  ['Phone', person.phone], ['WhatsApp', person.phone], ['Email · technical', person.email],
  ['Email · business', person.emailBiz],
  ['Portfolio', 'karthick-a.github.io/portfolio'],
  ['LinkedIn', 'linkedin.com/in/karthick-a-83a352211'],
  ['GitHub', 'github.com/KARTHICK-A'],
  ['Contact card', CARD_URL.replace(/^https?:\/\//, '')],
];

writeFileSync(join(ROOT, 'details.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>Karthick A — details</title>
<style>
@font-face{font-family:'Unbounded';src:url(data:font/woff2;base64,${b64('fonts/unbounded-latin-var.woff2')}) format('woff2');font-weight:200 900}
@font-face{font-family:'Plex Mono';src:url(data:font/woff2;base64,${b64('fonts/plexmono-400-latin.woff2')}) format('woff2');font-weight:400}
@font-face{font-family:'Plex Mono';src:url(data:font/woff2;base64,${b64('fonts/plexmono-500-latin.woff2')}) format('woff2');font-weight:500}
@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:'Plex Mono',monospace;color:#12161f;font-size:8.6pt;line-height:1.55}
.page{width:210mm;height:297mm;padding:16mm 16mm 12mm;display:flex;flex-direction:column;gap:7mm}
.top{display:flex;gap:7mm;align-items:flex-start}
.portrait{width:26mm;height:26mm;border-radius:50%;object-fit:cover;filter:grayscale(1)}
h1{font-family:'Unbounded',sans-serif;font-weight:700;font-size:22pt;margin:0 0 1.5mm;letter-spacing:-.01em}
.role{font-size:10pt;font-weight:500;margin:0}
.org{color:#5b667d;margin:.6mm 0 0}
.blurb{margin:2.5mm 0 0;max-width:95mm}
.qrbox{margin-left:auto;text-align:center}
.qrbox small{display:block;margin-top:1.5mm;font-size:6.4pt;letter-spacing:.09em;color:#5b667d}
h2{font-family:'Unbounded',sans-serif;font-weight:500;font-size:8.4pt;letter-spacing:.02em;
   margin:0 0 2mm;padding-bottom:1.4mm;border-bottom:.35mm solid #12161f}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:7mm}
table{width:100%;border-collapse:collapse}
td{padding:1.3mm 0;vertical-align:top;border-bottom:.15mm solid #d5dbe6}
td.k{width:26mm;color:#5b667d;font-size:7pt;letter-spacing:.07em;text-transform:uppercase}
ul{margin:0;padding-left:4mm}
li{margin:0 0 1.2mm}
.stack b{display:block;font-weight:500}
.stack p{margin:0 0 2.6mm;color:#40495c}
footer{margin-top:auto;padding-top:3mm;border-top:.15mm solid #d5dbe6;
  color:#5b667d;font-size:6.8pt;display:flex;justify-content:space-between}
</style></head><body><div class="page">

  <div class="top">
    <img class="portrait" src="data:image/webp;base64,${b64('portrait.webp')}" alt="">
    <div>
      <h1>Karthick A</h1>
      <p class="role">${person.title}</p>
      <p class="org">${person.company} · ${person.city}</p>
      <p class="blurb">${person.blurb} Schematic through PCB, firmware and field
      commissioning on running engines and factory floors.</p>
    </div>
    <div class="qrbox">${svg(make(vcardQR), 26)}<small>SCAN TO SAVE CONTACT</small></div>
  </div>

  <section>
    <h2>Contact</h2>
    <table>${rows.map(([k, v]) => `<tr><td class="k">${k}</td><td>${v}</td></tr>`).join('')}</table>
  </section>

  <div class="cols">
    <section class="stack">
      <h2>Capabilities</h2>
      ${stack.map(([k, v]) => `<b>${k}</b><p>${v}</p>`).join('')}
    </section>
    <section>
      <h2>Selected work</h2>
      <ul>${projects.map((p) => `<li>${p}</li>`).join('')}</ul>
    </section>
  </div>

  <footer><span>Karthick A · ${person.title}</span><span>${CARD_URL.replace(/^https?:\/\//, '')}</span></footer>
</div></body></html>
`, 'utf8');
console.log('wrote card/details.html');
