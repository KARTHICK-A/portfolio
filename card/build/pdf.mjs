// Renders card/details.html -> card/Karthick-A-details.pdf with headless Chromium.
// Run after: node card/build/details.mjs
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const exe = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.goto(pathToFileURL(join(ROOT, 'details.html')).href, { waitUntil: 'networkidle' });
await p.pdf({ path: join(ROOT, 'Karthick-A-details.pdf'), format: 'A4', printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' } });
await b.close();
console.log('wrote card/Karthick-A-details.pdf');
