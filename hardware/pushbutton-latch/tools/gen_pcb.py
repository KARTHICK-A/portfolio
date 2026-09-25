"""Place all footprints (unrouted) on a 2-layer board, nets assigned, linked to the schematic."""
import sys, uuid
import pcbnew
from design import PARTS

PROJECT = sys.argv[1] if len(sys.argv) > 1 else "pushbutton_latch"
NS = uuid.UUID("6f1b3c1e-8a44-4f5e-9d0b-6a1c2f9e7b10")
def U(*k): return str(uuid.uuid5(NS, "/".join(map(str, k))))

OX, OY, W, H = 100.0, 100.0, 60.0, 45.0
# (x, y, rotation) relative to board top-left, mm
PLACE = {
    # left: USB-C + charger
    "J1": (4.5, 11, 270), "R1": (12, 5, 90), "R2": (12, 17, 90), "C1": (13.5, 11, 90),
    "U1": (18, 11, 0), "R3": (18, 17, 0), "C2": (23, 15, 90), "R4": (18, 4, 0), "D1": (23, 4, 0),
    # bottom-left: battery connector + LDO
    "J2": (8, 38, 0), "U3": (18, 33, 0), "C5": (13, 33, 90), "C6": (23, 33, 90),
    "R15": (14, 40, 0), "R16": (19, 40, 0), "C12": (24, 40, 0),
    # middle: latch + button
    "U2": (31, 11, 0), "C3": (31, 5, 0), "R5": (36, 5, 0), "R6": (36, 17, 0), "C4": (31, 17, 0),
    "R8": (36, 11, 90), "R10": (40, 5, 90), "R11": (43, 5, 90), "R12": (46, 5, 90),
    "SW1": (31, 38, 0),
    # right: MCU + connectors
    "U4": (44, 25, 0), "C7": (38, 20, 90), "C8": (50, 20, 90), "C9": (38, 30, 90), "C10": (50, 30, 90),
    "C11": (38, 25, 90), "R13": (44, 33, 0), "R14": (50, 38, 0), "D2": (54, 38, 0),
    "J3": (57, 10, 0), "J4": (57, 25, 0),
}

board = pcbnew.NewBoard(f"{PROJECT}.kicad_pcb")
nets = {}
def net(name):
    if name not in nets:
        n = pcbnew.NETINFO_ITEM(board, name)
        board.Add(n)
        nets[name] = n
    return nets[name]

mm = pcbnew.FromMM
for p in PARTS:
    if p["ref"].startswith("#"):
        continue
    lib, name = p["fp"].split(":")
    fp = pcbnew.FootprintLoad(f"/usr/share/kicad/footprints/{lib}.pretty", name)
    assert fp, p["fp"]
    fp.SetReference(p["ref"])
    fp.SetValue(p["value"])
    fp.SetPath(pcbnew.KIID_PATH(f"/{U('sym', p['ref'])}"))
    fp.SetSheetname("/")
    fp.SetSheetfile(f"{PROJECT}.kicad_sch")
    x, y, rot = PLACE[p["ref"]]
    board.Add(fp)
    fp.SetPosition(pcbnew.VECTOR2I(mm(OX + x), mm(OY + y)))
    fp.SetOrientationDegrees(rot)
    padnums = set()
    for pad in fp.Pads():
        num = pad.GetNumber()
        padnums.add(num)
        if num in p["pins"]:
            pad.SetNet(net(p["pins"][num]))
    missing = set(p["pins"]) - padnums
    assert not missing, (p["ref"], missing)

# board outline with 1 mm corner radius omitted for simplicity
pts = [(0, 0), (W, 0), (W, H), (0, H)]
for i in range(4):
    a, b = pts[i], pts[(i + 1) % 4]
    seg = pcbnew.PCB_SHAPE(board)
    seg.SetShape(pcbnew.SHAPE_T_SEGMENT)
    seg.SetStart(pcbnew.VECTOR2I(mm(OX + a[0]), mm(OY + a[1])))
    seg.SetEnd(pcbnew.VECTOR2I(mm(OX + b[0]), mm(OY + b[1])))
    seg.SetLayer(pcbnew.Edge_Cuts)
    seg.SetWidth(mm(0.1))
    board.Add(seg)

txt = pcbnew.PCB_TEXT(board)
txt.SetText("PB-LATCH rev A - UNROUTED: route in KiCad (see README)")
txt.SetPosition(pcbnew.VECTOR2I(mm(OX + W / 2), mm(OY + H + 3)))
txt.SetLayer(pcbnew.Cmts_User)
board.Add(txt)

board.Save(f"{PROJECT}.kicad_pcb")
print("footprints:", len(board.GetFootprints()), "nets:", len(nets))
