# Push-button latch + STM32L0 gesture power controller (rev A, draft)

One button switches a Li-ion powered board **on**, lets the MCU decode
**tap / double tap / triple tap / 1 s / 3 s / 5 s** gestures, and puts the board
into **Sleep**, **Deep sleep** or **fully OFF**. A ~10 s hold is a hardware
override that works even if the firmware has crashed.

> **Status: draft, not built, not tested on hardware.** The datasheets could
> not be downloaded in the environment this was designed in (see
> `datasheets/README.md`). Pinouts come from KiCad's official libraries; key
> electrical figures come from web-search summaries of the datasheets. Work
> through the **Verify before ordering** list first.

## Folder

| Path | What |
|---|---|
| `kicad/` | KiCad 10 project: schematic + PCB (footprints placed, **not routed**) |
| `exports/` | `schematic.pdf`, `pcb_placement.pdf`, `bom.csv`, `netlist.net`, ERC/DRC reports |
| `firmware/` | STM32L0 C code: gesture decoder (host-tested), power modes, example `main` |
| `datasheets/` | datasheet links, figures used, `download.sh` |
| `tools/` | Python scripts that generate the schematic/PCB from `design.py` and check the netlist |

Open `kicad/pushbutton_latch.kicad_pro` in KiCad 10. It uses only KiCad's
standard libraries.

## How it works

```
USB-C 5V ──► MCP73831 charger ──► VBAT (1S Li-ion, protected cell)
                                    │
                    ┌───────────────┼──────────────────────────┐
                    ▼               ▼                          │
   button ──► STM6601 latch    TPS7A05 3.3 V LDO ──► +3V3 ──► STM32L031K6
   (SW1)      (always on,        IN = VBAT                     │
               0.6 µA standby)   EN = latch EN ◄───────────────┘
                 │  EN ──────────────┘         PS_HOLD (PA1): MCU pulls low = OFF
                 │  ~PB_OUT ─────────────────► PA0 (EXTI0 + WKUP1): gesture timing
                 │  ~INT ────────────────────► PA2
                 │  ~VCC_LO ─────────────────► PA3 (battery low)
                 └  ~RST ────────────────────► NRST
```

* **On:** pressing SW1 makes the STM6601 raise EN, which enables the LDO, which
  powers the MCU. R8 pulls PS_HOLD high as soon as 3.3 V is up, confirming
  power-on.
* **Gestures:** the STM6601's open-drain `~PB_OUT` copies the button state to
  PA0, so the MCU can time presses without battery voltage reaching its pins.
* **Off:** the MCU drives PS_HOLD low. The latch drops EN, the LDO shuts down
  and the MCU loses power. The battery then only supplies the STM6601 standby
  current. Charging via USB still works while the board is off.
* **Hardware override:** R6 ties `~SR` to `~PB`. Holding the button for about
  10 s (C4 = 1 µF at ~10 s/µF) triggers the STM6601 Smart Reset.
* **Battery voltage:** R15/R16 divide the latch EN output, which sits at VBAT
  while on and 0 V while off, so the divider draws nothing when the board is off.

## Gestures and power modes (firmware defaults, editable)

| Gesture | Action |
|---|---|
| press (while off) | power on |
| 1 tap | action A (example: toggle LED) |
| 2 taps | action B |
| 3 taps | **Deep sleep**: STM32 Standby, RAM lost, button wakes it and it restarts |
| hold 1 s | **Sleep**: STM32 Stop, RAM kept, any press resumes |
| hold 3 s | action C |
| hold 5 s | **OFF**: PS_HOLD low |
| hold ~10 s | STM6601 Smart Reset, hardware override |
| 30 s idle | automatic Sleep |
| battery low (`~VCC_LO`) | blink, then OFF |

Estimated battery current. These are typical values added up, not measurements:

| Mode | Adds up to | Main contributor |
|---|---|---|
| OFF | ≈ 0.6 µA + LDO shutdown current + charger reverse leakage (both still to be checked) | STM6601 standby |
| Deep sleep (Standby) | ≈ 6 + 1 + 0.23 + 0.45 ≈ **7.7 µA** | STM6601 operating current (6 µA) |
| Sleep (Stop + RTC) | ≈ 6 + 1 + 0.6 + 0.45 ≈ **8 µA** | STM6601 operating current |

Honest note: Sleep and Deep sleep are within ~0.4 µA of each other because
the latch's own 6 µA operating current dominates both. Real savings come from
OFF. Replacing the STM6601 with a **MAX16150** (< 20 nA, see
`datasheets/README.md`) is the main rev B improvement, once its pinout is
confirmed.

## Verification done

* KiCad 10.0.6 **ERC: 0 errors, 0 warnings** (`exports/erc_report.txt`).
* Netlist exported by KiCad compared automatically against the connection
  table in `tools/design.py`: all 26 nets match (`tools/verify_net.py`).
* PCB **DRC: 0 violations** (no courtyard overlaps or clearance problems). The
  91 "unconnected items" are expected because the board isn't routed yet.
* Gesture decoder: 13 host unit tests pass
  (`cd firmware/test && gcc -I.. ../button_gesture.c test_gesture.c -o t && ./t`).
* **Not done:** `board_power.c` has not been compiled against STM32CubeL0,
  nothing has been run on hardware, and the PCB has not been routed.

## Verify before ordering

1. **STM6601 ordering code:** EN must be **active-high push-pull**. Choose the
   VCC_LO threshold and tON_BLANK for a 1S Li-ion cell (the ordering-option
   table is in the datasheet).
2. **STM6601 `~SR` tied to `~PB` (R6):** confirm this gives single-button
   Smart Reset, and whether it asserts RST or drops EN on this variant. If
   unwanted, remove R6 and pull `~SR` up to VBAT.
3. **STM6601 Vref (pin 3):** left unconnected; confirm no capacitor is needed.
   Also confirm whether `~PB` has an internal pull-up (R5 = 1 MΩ is fitted
   either way; it only draws current while pressed).
4. **STM32L0 WKUP1:** check the edge polarity and what happens if PA0 is
   already high on Standby entry (RM0377). The firmware waits for the button
   to be released first. If Standby wake is unreliable, use Stop for both
   sleep modes (≈0.1 µA difference).
5. **TPS7A05:** input/output capacitor values and shutdown current.
6. **MCP73831:** R3 = 4.7 kΩ gives ≈213 mA. Keep it at or below 1C of your
   cell. Check reverse leakage from VBAT when USB is unplugged.
7. **Battery:** use a cell with its own protection PCB. This board has no
   over-discharge or short-circuit protection of its own.
8. **USB-C J1:** check which side the plug opens to before finishing placement.

## Next steps

1. Download the datasheets (`datasheets/download.sh`) and go through the list above.
2. Route the PCB in KiCad 10 (2 layers; pour GND on the bottom layer). Current
   placement is a starting point.
3. Generate the STM32CubeMX project for STM32L031K6 and add `firmware/*.c`.

## Regenerating from the scripts

The schematic and PCB are generated from `tools/design.py`. This is only
needed if you want to change the design through the scripts rather than in
KiCad. Requires KiCad 10 on Linux (uses `kicad-cli`, the `pcbnew` Python
module, and libraries under `/usr/share/kicad`). The scripts write to the
current folder:

```sh
cd hardware/pushbutton-latch/tools
python3 gen_sch.py && kicad-cli sch upgrade pushbutton_latch.kicad_sch
kicad-cli sch export netlist --format kicadsexpr -o net.net pushbutton_latch.kicad_sch && python3 verify_net.py
python3 gen_pcb.py
mv pushbutton_latch.kicad_sch pushbutton_latch.kicad_pcb ../kicad/
```

After you edit the design in KiCad itself, treat the KiCad files as the
source of truth and stop using the scripts.
