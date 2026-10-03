# Karthick A — Portfolio

Personal site of **Karthick A**, Embedded Product Engineer in Chennai — automotive ECU
electronics, custom PCB design, embedded C/C++ and industrial IoT.

**Live:** https://karthick-a.github.io/portfolio/

## The idea

The page is built like a board, not like a résumé. The hero renders a real 3D circuit
board (three.js/WebGL) where **every IC is one project** — hover a chip to see what it is,
click it to open that project's card below. Projects are cards with reference designators
(U1–U7), skills a layer stack-up, contact links test points. No dates, no timeline.

The board is never the only way in: a row of U1–U7 links under it does the same thing for
keyboard, screen-reader and touch users, and a **Pause motion** switch (plus the OS
reduced-motion setting) stops all self-running animation.

## Structure

```
index.html            markup and all copy
styles.css            styling — dark substrate, copper accents, silkscreen type
script.js             3D board, chip→project navigation, scroll reveal + progress
assets/
  vendor/three.min.js three.js r160 (deprecated UMD build), vendored
  images/og.png       1200×630 link-preview image
  images/profile/     profile photo
```

Static, no build step. If JavaScript or WebGL is unavailable the board panel is removed
and the page still reads completely. When the visitor prefers reduced motion the board is
still drawn and stays clickable, but nothing animates on its own — no auto-rotation,
float, LED blink or ticker.
