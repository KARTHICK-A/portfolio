import copy, sys, uuid, json
from sexp import parse, dump, val, find, symbol, props
from design import PARTS, NOTES

PROJECT = sys.argv[1] if len(sys.argv) > 1 else "pushbutton_latch"
NS = uuid.UUID("6f1b3c1e-8a44-4f5e-9d0b-6a1c2f9e7b10")  # deterministic UUIDs -> stable diffs
def U(*k): return str(uuid.uuid5(NS, "/".join(map(str, k))))
S = lambda s: ('S', s)
ROOT = U("root")


def flat_symbol(lib, name):
    """Return a lib_symbols entry with 'extends' resolved, named lib:name."""
    s = copy.deepcopy(symbol(lib, name))
    ext = find(s, 'extends')
    if ext:
        base = copy.deepcopy(symbol(lib, val(ext[0][1])))
        bname = val(base[1])
        dprops = {val(p[1]): p for p in find(s, 'property')}
        out = [base[0], S(f"{lib}:{name}")]
        for item in base[2:]:
            if isinstance(item, list) and item and item[0] == 'property' and val(item[1]) in dprops:
                out.append(dprops.pop(val(item[1])))
            elif isinstance(item, list) and item and item[0] == 'symbol':
                item[1] = S(val(item[1]).replace(bname, name, 1)); out.append(item)
            else:
                out.append(item)
        # derived-only props go before sub-symbols
        idx = next(i for i, x in enumerate(out) if isinstance(x, list) and x and x[0] == 'symbol')
        for p in dprops.values(): out.insert(idx, p); idx += 1
        return out
    s[1] = S(f"{lib}:{name}")
    return s


def lib_pins(flat):
    res = []
    for sub in find(flat, 'symbol'):
        for p in find(sub, 'pin'):
            at = find(p, 'at')[0]
            res.append((val(find(p, 'number')[0][1]), float(at[1]), float(at[2]), int(float(at[3]))))
    return res


def eff(size=1.27, justify=None, hide=False):
    e = ['effects', ['font', ['size', size, size]]]
    if justify: e.append(['justify'] + justify.split())
    if hide: e.append('hide')
    return e


def r(v): return round(v, 4)


items, libsyms, done, netpins = [], [], set(), {}
LABEL_ANGLE = {0: 180, 180: 0, 90: 270, 270: 90}
JUST = {0: "left bottom", 180: "right bottom", 90: "left bottom", 270: "right bottom"}

for n, p in enumerate(PARTS):
    lib, name = p["lib"]; lid = f"{lib}:{name}"
    flat = flat_symbol(lib, name)
    if lid not in done: libsyms.append(flat); done.add(lid)
    X, Y = p["at"]; uid = U("sym", p["ref"])
    inst = ['symbol', ['lib_id', S(lid)], ['at', X, Y, 0], ['unit', 1],
            ['in_bom', 'no' if p["ref"].startswith('#') else 'yes'],
            ['on_board', 'no' if p["ref"].startswith('#') else 'yes'], ['dnp', 'no'], ['uuid', uid]]
    lp = {val(q[1]): q for q in find(flat, 'property')}
    values = {"Reference": p["ref"], "Value": p["value"], "Footprint": p["fp"]}
    for key, q in lp.items():
        if key.startswith("ki_"): continue
        at = find(q, 'at')[0]
        hidden = any(isinstance(e, list) and 'hide' in e for e in find(q, 'effects')) or key not in ("Reference", "Value")
        if key == "Value" and not p["ref"].startswith('#'): hidden = False
        inst.append(['property', S(key), S(values.get(key, val(q[2]))),
                     ['at', r(X + float(at[1])), r(Y - float(at[2])), int(float(at[3])) if len(at) > 3 else 0], eff(hide=hidden)])
    for k in ("Note",):
        if k in p:
            inst.append(['property', S(k), S(p[k]), ['at', X, Y, 0], eff(hide=True)])
    pins = lib_pins(flat)
    for num, px, py, ang in pins:
        inst.append(['pin', S(num), ['uuid', U("pin", p["ref"], num)]])
        ax, ay = r(X + px), r(Y - py)
        net = p["pins"].get(num)
        if net is None:
            items.append(['no_connect', ['at', ax, ay], ['uuid', U("nc", p["ref"], num)]])
            continue
        netpins.setdefault(net, []).append(f'{p["ref"]}.{num}')
        la = LABEL_ANGLE[ang]
        items.append(['label', S(net), ['at', ax, ay, la], ['fields_autoplaced'],
                      eff(justify="right bottom" if la in (180, 270) else "left bottom"),
                      ['uuid', U("lbl", p["ref"], num)]])
    inst.append(['instances', ['project', S(PROJECT), ['path', S("/" + ROOT), ['reference', S(p["ref"])], ['unit', 1]]]])
    items.insert(0, inst)
    unknown = set(p["pins"]) - {q[0] for q in pins}
    assert not unknown, (p["ref"], unknown)

for i, ((x, y), txt) in enumerate(NOTES):
    size = 2.54 if len(txt) < 120 else 1.5
    items.append(['text', S(txt), ['at', x, y, 0], eff(size=size, justify="left bottom"), ['uuid', U("txt", i)]])

sch = ['kicad_sch', ['version', 20230121], ['generator', 'eeschema'], ['uuid', ROOT], ['paper', S("A3")],
       ['title_block', ['title', S("Push-button latch + STM32L0 gesture power controller")],
        ['date', S("2026-09-25")], ['rev', S("A (draft - verify notes)")],
        ['comment', 1, S("STM6601 latch, TPS7A05 LDO, MCP73831 charger, STM32L031K6")]],
       ['lib_symbols'] + libsyms] + items + [['sheet_instances', ['path', S("/"), ['page', S("1")]]]]
open(f"{PROJECT}.kicad_sch", "w").write(dump(sch) + "\n")
json.dump({k: sorted(v) for k, v in sorted(netpins.items())}, open("expected_nets.json", "w"), indent=1)
single = [k for k, v in netpins.items() if len(v) < 2]
print("parts", len(PARTS), "nets", len(netpins), "single-pin nets:", single)
