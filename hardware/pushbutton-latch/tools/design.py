"""Single source of truth for the push-button latch board.

Each part: ref, (lib, symbol), value, footprint, (x, y) on sheet [mm], {pin_number: net},
optional extra fields. Pins not listed get a no-connect flag.
"""

R0603 = "Resistor_SMD:R_0603_1608Metric"
C0603 = "Capacitor_SMD:C_0603_1608Metric"
C0805 = "Capacitor_SMD:C_0805_2012Metric"
LED0603 = "LED_SMD:LED_0603_1608Metric"


def R(ref, val, xy, a, b, **kw):
    return dict(ref=ref, lib=("Device", "R"), value=val, fp=R0603, at=xy, pins={"1": a, "2": b}, **kw)


def C(ref, val, xy, a, b, fp=C0603, **kw):
    return dict(ref=ref, lib=("Device", "C"), value=val, fp=fp, at=xy, pins={"1": a, "2": b}, **kw)


PARTS = [
    # ---------------- USB-C input + Li-ion charger (block A) ----------------
    dict(ref="J1", lib=("Connector", "USB_C_Receptacle_PowerOnly_6P"), value="USB-C (power only)",
         fp="Connector_USB:USB_C_Receptacle_GCT_USB4125-xx-x_6P_TopMnt_Horizontal", at=(40.64, 68.58),
         pins={"A9": "VBUS", "B9": "VBUS", "A12": "GND", "B12": "GND", "SH": "GND", "A5": "CC1", "B5": "CC2"}),
    R("R1", "5.1k", (73.66, 88.9), "CC1", "GND", Note="USB-C sink Rd on CC1"),
    R("R2", "5.1k", (81.28, 88.9), "CC2", "GND", Note="USB-C sink Rd on CC2"),
    C("C1", "4.7uF", (91.44, 88.9), "VBUS", "GND", fp=C0805),
    dict(ref="U1", lib=("Battery_Management", "MCP73831-2-OT"), value="MCP73831-2-OT",
         fp="Package_TO_SOT_SMD:SOT-23-5", at=(121.92, 60.96),
         pins={"4": "VBUS", "2": "GND", "3": "VBAT", "5": "PROG", "1": "CHG_STAT"}),
    R("R3", "4.7k", (104.14, 81.28), "PROG", "GND", Note="Charge current = 1000V/R_PROG(kOhm) ~ 213 mA"),
    R("R4", "1k", (147.32, 45.72), "VBUS", "LED_CHG_A"),
    dict(ref="D1", lib=("Device", "LED"), value="RED (charging)", fp=LED0603, at=(154.94, 58.42),
         pins={"2": "LED_CHG_A", "1": "CHG_STAT"}),
    C("C2", "4.7uF", (144.78, 76.2), "VBAT", "GND", fp=C0805),
    dict(ref="J2", lib=("Connector_Generic", "Conn_01x02"), value="Li-ion 1S (protected cell)",
         fp="Connector_JST:JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal", at=(175.26, 71.12),
         pins={"1": "VBAT", "2": "GND"}),

    # ---------------- Push-button latch STM6601 (block B) ----------------
    dict(ref="U2", lib=("Power_Management", "STM6601"), value="STM6601 (active-high push-pull EN option)",
         fp="Package_DFN_QFN:TDFN-12_2x3mm_P0.5mm", at=(271.78, 71.12),
         pins={"1": "VBAT", "12": "GND", "6": "PB_N", "2": "SR_N", "5": "CSRD", "4": "PS_HOLD",
               "9": "LATCH_EN", "11": "INT_N", "8": "BTN_N", "10": "NRST", "7": "VBAT_LOW_N"},
         Note="Order code must give active-high push-pull EN; pick VCC_LO threshold for 1S Li-ion"),
    C("C3", "100nF", (287.02, 43.18), "VBAT", "GND"),
    dict(ref="SW1", lib=("Switch", "SW_Push"), value="Power / gesture button",
         fp="Button_Switch_SMD:SW_SPST_TL3342", at=(213.36, 91.44),
         pins={"1": "PB_N", "2": "GND"}),
    R("R5", "1M", (223.52, 58.42), "VBAT", "PB_N", Note="PB pull-up; harmless if STM6601 has internal pull-up"),
    R("R6", "0R", (236.22, 104.14), "PB_N", "SR_N", Note="Single-button Smart Reset (hold ~10 s). Remove to disable"),
    C("C4", "1uF", (246.38, 104.14), "CSRD", "GND", Note="tSRD ~ 10 s/uF typ -> ~10 s hardware override"),
    R("R8", "100k", (325.12, 91.44), "+3V3", "PS_HOLD", Note="Holds PS_HOLD high in MCU Standby; MCU drives low = OFF"),
    R("R10", "100k", (335.28, 50.8), "+3V3", "INT_N"),
    R("R11", "100k", (345.44, 50.8), "+3V3", "BTN_N"),
    R("R12", "100k", (355.6, 50.8), "+3V3", "VBAT_LOW_N"),

    # ---------------- 3.3 V LDO + battery sense (block C) ----------------
    dict(ref="U3", lib=("Regulator_Linear", "TPS7A0533PDBV"), value="TPS7A0533PDBV",
         fp="Package_TO_SOT_SMD:SOT-23-5", at=(71.12, 182.88),
         pins={"1": "VBAT", "3": "LATCH_EN", "2": "GND", "5": "+3V3"}),
    C("C5", "1uF", (45.72, 203.2), "VBAT", "GND"),
    C("C6", "1uF", (99.06, 203.2), "+3V3", "GND"),
    R("R15", "4.7M", (132.08, 177.8), "LATCH_EN", "VBAT_SENSE", Note="Divider fed from EN (=VBAT when ON, 0 V when OFF)"),
    R("R16", "4.7M", (132.08, 200.66), "VBAT_SENSE", "GND"),
    C("C12", "100nF", (142.24, 200.66), "VBAT_SENSE", "GND"),

    # ---------------- MCU STM32L031K6 (block D) ----------------
    dict(ref="U4", lib=("MCU_ST_STM32L0", "STM32L031K6Tx"), value="STM32L031K6T6",
         fp="Package_QFP:LQFP-32_7x7mm_P0.8mm", at=(264.16, 203.2),
         pins={"1": "+3V3", "17": "+3V3", "5": "+3V3", "16": "GND", "32": "GND",
               "31": "BOOT0", "4": "NRST",
               "6": "BTN_N", "7": "PS_HOLD", "8": "INT_N", "9": "VBAT_LOW_N",
               "10": "LED_STAT", "11": "VBAT_SENSE",
               "23": "SWDIO", "24": "SWCLK", "19": "UART_TX", "20": "UART_RX"}),
    C("C7", "100nF", (190.5, 162.56), "+3V3", "GND"),
    C("C8", "100nF", (200.66, 162.56), "+3V3", "GND"),
    C("C9", "4.7uF", (210.82, 162.56), "+3V3", "GND", fp=C0805),
    C("C10", "100nF", (220.98, 162.56), "+3V3", "GND", Note="VDDA decoupling"),
    C("C11", "100nF", (200.66, 243.84), "NRST", "GND"),
    R("R13", "10k", (218.44, 243.84), "BOOT0", "GND"),
    R("R14", "1k", (345.44, 228.6), "LED_STAT", "LED_STAT_A"),
    dict(ref="D2", lib=("Device", "LED"), value="GREEN (status)", fp=LED0603, at=(365.76, 241.3),
         pins={"2": "LED_STAT_A", "1": "GND"}),
    dict(ref="J3", lib=("Connector_Generic", "Conn_01x05"), value="SWD",
         fp="Connector_PinHeader_2.54mm:PinHeader_1x05_P2.54mm_Vertical", at=(375.92, 177.8),
         pins={"1": "+3V3", "2": "SWDIO", "3": "SWCLK", "4": "NRST", "5": "GND"}),
    dict(ref="J4", lib=("Connector_Generic", "Conn_01x03"), value="UART debug",
         fp="Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical", at=(375.92, 213.36),
         pins={"1": "UART_TX", "2": "UART_RX", "3": "GND"}),

    # ---------------- ERC power flags ----------------
    dict(ref="#FLG01", lib=("power", "PWR_FLAG"), value="PWR_FLAG", fp="", at=(30.48, 116.84), pins={"1": "GND"}),
    dict(ref="#FLG02", lib=("power", "PWR_FLAG"), value="PWR_FLAG", fp="", at=(45.72, 116.84), pins={"1": "VBUS"}),
]

NOTES = [
    ((20.32, 25.4), "A. USB-C 5 V input + single-cell Li-ion charger (MCP73831, ~213 mA with R3 = 4.7k)"),
    ((200.66, 25.4), "B. Push-button power latch STM6601 - latch is always powered from VBAT (0.6 uA standby, typ.)"),
    ((20.32, 149.86), "C. 3.3 V LDO (TPS7A05, 1 uA Iq) - ON only while latch EN is high"),
    ((185.42, 149.86), "D. STM32L031K6 - gesture decoding, Sleep (Stop), Deep sleep (Standby), full OFF via PS_HOLD"),
    ((20.32, 262.89),
     "VERIFY BEFORE ORDERING (datasheets could not be downloaded in the design environment):\n"
     "1) STM6601 ordering code: EN must be ACTIVE-HIGH PUSH-PULL; choose VCC_LO threshold suited to 1S Li-ion.\n"
     "2) STM6601 ~SR tied to ~PB via R6 (single-button Smart Reset ~10 s with C4 = 1uF). Confirm SR semantics; remove R6 + pull SR up if not wanted.\n"
     "3) STM6601 Vref pin left unconnected - confirm no capacitor is required.  4) STM32L0 WKUP1 edge polarity for Standby wake.\n"
     "5) Battery must include its own protection PCB (over-discharge / short). 6) Charge current R3 must be <= 1C of the chosen cell."),
]
