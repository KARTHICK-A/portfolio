# Karthick A — Portfolio

Personal site of **Karthick A**, Embedded Product Engineer in Chennai — automotive ECU
electronics, custom PCB design, embedded C/C++ and industrial IoT.

**Live:** https://karthick-a.github.io/portfolio/

## The idea

The page is built like a board, not like a résumé. The hero renders a real 3D circuit
board (three.js/WebGL) where **every IC is one project** — hover a chip to see what it is,
click it to open that project's entry in the bill of projects below. Projects are listed as
a BOM with reference designators (U1–U6), skills as a layer stack-up, contact links as
test points. No dates, no timeline.

## Structure

```
index.html            markup and all copy
styles.css            styling — dark substrate, copper accents, silkscreen type
script.js             3D board, chip→project navigation, scroll reveal + progress
assets/
  vendor/three.min.js three.js r160, vendored so the site has no CDN dependency
  images/profile/     profile photo
```

Static, no build step. If JavaScript or WebGL is unavailable the board panel is removed
and the page still reads completely. When the visitor prefers reduced motion the board is
still drawn and stays clickable, but nothing animates on its own — no auto-rotation,
float, LED blink or ticker.
