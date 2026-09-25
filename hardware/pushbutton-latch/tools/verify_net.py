import json, sys
from sexp import parse, val, find

n = parse(open(sys.argv[1] if len(sys.argv) > 1 else 'net.net').read())
got = {}
for ne in find(find(n, 'nets')[0], 'net'):
    name = val(find(ne, 'name')[0][1]).lstrip('/')
    if name.startswith('unconnected'):
        continue
    got[name] = sorted(f"{val(find(x, 'ref')[0][1])}.{val(find(x, 'pin')[0][1])}" for x in find(ne, 'node'))
exp = {k: [p for p in v if not p.startswith('#')] for k, v in json.load(open('expected_nets.json')).items()}
ok = True
for k in sorted(set(exp) | set(got)):
    if exp.get(k) != got.get(k):
        ok = False
        print('MISMATCH', k, exp.get(k), got.get(k))
print('netlist matches design table:', ok, len(got), 'nets')
sys.exit(0 if ok else 1)
