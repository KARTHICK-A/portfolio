#!/usr/bin/env python3
"""Renders card/og.png (1200x630) for link previews.
Needs: Pillow, fonttools+brotli, and the woff2 faces in card/fonts/.
Run after: node card/build/og.mjs"""
import json, os, io
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def face(woff2, weight=None):
    f = TTFont(os.path.join(ROOT, 'fonts', woff2)); f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    return buf

def load(woff2, size, weight=None):
    fnt = ImageFont.truetype(face(woff2), size)
    if weight is not None:
        try: fnt.set_variation_by_axes([weight])
        except Exception: pass
    return fnt

BG, INK, BODY, MUTED, ACCENT = '#04060c', '#edf1fa', '#c2cbde', '#8b96af', '#22e0e6'
W, H = 1200, 630
img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

# board grid, same motif as the page
for x in range(0, W, 44): d.line([(x, 0), (x, H)], fill='#111a2b')
for y in range(0, H, 44): d.line([(0, y), (W, y)], fill='#111a2b')

# QR plate on the right
m = json.load(open(os.path.join(HERE, 'qr-matrix.json')))
n, rows = m['n'], m['rows']
px, quiet = 6, 4
plate = (n + quiet * 2) * px
px0, py0 = W - plate - 70, (H - plate) // 2
d.rectangle([px0 - 14, py0 - 14, px0 + plate + 14, py0 + plate + 14], fill='#ffffff')
for r in range(n):
    for c in range(n):
        if rows[r][c] == '1':
            x, y = px0 + (c + quiet) * px, py0 + (r + quiet) * px
            d.rectangle([x, y, x + px - 1, y + px - 1], fill='#000000')

disp = load('unbounded-latin-var.woff2', 62, 700)
mono = load('plexmono-500-latin.woff2', 25)
small = load('plexmono-500-latin.woff2', 19)

x = 70
d.text((x, 150), 'TP1 · CONTACT', font=small, fill=ACCENT)
d.text((x, 190), 'Karthick A', font=disp, fill=INK)
d.text((x, 285), 'Embedded Systems Engineer', font=mono, fill=INK)
d.text((x, 322), 'Spark Invotech Pvt Ltd · Chennai', font=mono, fill=MUTED)
d.text((x, 385), 'Automotive ECU electronics,', font=mono, fill=BODY)
d.text((x, 418), 'PCB design and industrial IoT.', font=mono, fill=BODY)
d.line([(x, 470), (x + 120, 470)], fill=ACCENT, width=3)
d.text((x, 492), 'SCAN TO SAVE MY CONTACT', font=small, fill=MUTED)

out = os.path.join(ROOT, 'og.png')
img.save(out, optimize=True)
print('wrote', out, img.size)
