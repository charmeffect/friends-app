#!/usr/bin/env python3
"""Rename/merge or drop expressions across episode files.
  python3 tools/merge-expression.py merge "old name" "existing name"   # copy type/level/pos/meaning from the existing item
  python3 tools/merge-expression.py drop "name" [sXXeYY]               # remove the item (optionally only in one file)
"""
import json, glob, sys, os
root = os.path.join(os.path.dirname(__file__), '..', 'episodes')
files = sorted(glob.glob(os.path.join(root, '*.json')))
def load(f): return json.load(open(f))
def save(f, items): open(f, 'w').write('[\n' + ',\n\n'.join(json.dumps(it, ensure_ascii=False, indent=2) for it in items) + '\n]\n')
def find_ref(expr):
    for f in files:
        for it in load(f):
            if it['expression'] == expr: return it
    sys.exit('no existing item named ' + expr)
cmd = sys.argv[1]
if cmd == 'merge':
    old, new = sys.argv[2], sys.argv[3]; ref = find_ref(new)
    for f in files:
        items = load(f); hit = False
        for it in items:
            if it['expression'] == old:
                it.update(expression=ref['expression'], type=ref['type'], level=ref['level'], pos=ref['pos'], meaning=ref['meaning']); hit = True
        if hit: save(f, items); print('merged in', os.path.basename(f))
elif cmd == 'drop':
    name = sys.argv[2]; only = sys.argv[3] if len(sys.argv) > 3 else None
    for f in files:
        if only and not f.endswith(only + '.json'): continue
        items = load(f); out = [it for it in items if it['expression'] != name]
        if len(out) != len(items): save(f, out); print('dropped from', os.path.basename(f))
