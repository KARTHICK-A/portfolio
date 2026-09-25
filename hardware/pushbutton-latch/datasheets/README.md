# Datasheets

The PDFs are **not in this folder yet**. The cloud environment the design was
made in blocks every manufacturer and distributor site (analog.com, st.com,
ti.com, microchip.com, mouser, digikey, lcsc…), so nothing could be downloaded.

To fill the folder, run on your own computer (Git Bash / WSL / Linux / macOS):

```sh
cd hardware/pushbutton-latch/datasheets
sh download.sh
```

Then commit the PDFs. Some sites refuse scripted downloads; if a file comes out
tiny or isn't a PDF, open the link in a browser and save it by hand.

## Parts, links and the figures the design relies on

"Source" says where each number came from. None of these were read from the
PDF itself. Confirm them in the datasheet before ordering.

| Ref | Part | Official datasheet | Figures used in the design | Source |
|---|---|---|---|---|
| U2 | **STM6601** smart push-button on/off controller | https://www.st.com/resource/en/datasheet/stm6601.pdf · app note AN3271: https://www.st.com/resource/en/application_note/an3271-using-the-stm6600-stm6601-smart-pushbutton-onoff-controller-stmicroelectronics.pdf | 1.6–5.5 V; 0.6 µA standby, 6 µA operating; EN push-pull, RST/INT/PB_OUT/VCC_LO open drain; Smart Reset delay ≈ 10 s/µF on C_SRD; PS_HOLD must go high within tON_BLANK; TDFN-12 2×3 mm | web search summaries of ST's datasheet; pin numbers from KiCad 10 official symbol library |
| U4 | **STM32L031K6T6** MCU | https://www.st.com/resource/en/datasheet/stm32l031k6.pdf · reference manual RM0377 (search "RM0377" on st.com) | Standby 0.23 µA, Stop 0.35 µA, Stop + RTC + 8 KB RAM 0.6 µA; 1.65–3.6 V; PA0 = WKUP1 | currents: web search summary of DS10668; pin functions: KiCad 10 symbol |
| U3 | **TPS7A0533PDBV** 3.3 V LDO | https://www.ti.com/lit/ds/symlink/tps7a05.pdf | 1 µA Iq, 200 mA, VIN 1.4–5.5 V, active-high EN | web search summary; pinout from KiCad 10 symbol |
| U1 | **MCP73831-2-OT** Li-ion charger | https://ww1.microchip.com/downloads/en/DeviceDoc/MCP73831-Family-Data-Sheet-DS20001984H.pdf | I_REG (mA) = 1000 V / R_PROG (kΩ); 4.20 V; STAT output | web search summary; pinout from KiCad 10 symbol |
| J1 | GCT USB4125 USB-C 6-pin power-only receptacle | GCT product page for USB4125 (gct.co) | footprint from KiCad library | KiCad library |
| SW1 | E-Switch TL3342 tactile switch | E-Switch TL3342 product page | footprint from KiCad library | KiCad library |
| J2 | JST PH 2-pin S2B-PH-K | JST PH series catalogue (jst-mfg.com) | 2.00 mm pitch | KiCad library |

### Alternatives that were evaluated (not used)

| Part | Why not used (yet) | Datasheet |
|---|---|---|
| **MAX16150** (Analog Devices) | Lowest off current found: **< 20 nA** (OUT off, PB_IN open), 1.3–5.5 V, TSOT23-6. Not in the KiCad library and its pin numbers could not be read, so it was not placed. Best candidate for a rev B once the datasheet is available. Note: the **A** version switches OFF when the button is held longer than t_SO; the **B** version only sends a long interrupt. | https://www.analog.com/media/en/technical-documentation/data-sheets/MAX16150.pdf |
| LTC2955 | 1.2 µA, 1.5–36 V: more current than needed and likely more expensive | https://www.analog.com/media/en/technical-documentation/data-sheets/2955fa.pdf |
| TPS3422 | Push-button **reset timer**, not an on/off latch | https://www.ti.com/lit/ds/symlink/tps3422.pdf |
