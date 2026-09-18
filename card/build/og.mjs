// Dumps the contact QR module matrix so build/og.py can draw the OG image.
import { writeFileSync } from 'node:fs';
import { make } from './build.mjs';
import { vcardQR } from './data.mjs';
const c = make(vcardQR), n = c.getModuleCount();
const rows = [];
for (let r = 0; r < n; r++) {
  let s = '';
  for (let col = 0; col < n; col++) s += c.isDark(r, col) ? '1' : '0';
  rows.push(s);
}
writeFileSync(new URL('./qr-matrix.json', import.meta.url), JSON.stringify({ n, rows }));
console.log('matrix', n, 'x', n);
