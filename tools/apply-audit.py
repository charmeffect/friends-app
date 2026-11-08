#!/usr/bin/env python3
"""Apply review results: python3 tools/apply-audit.py result1.json [result2.json ...]
Each result file: {"changes":[{"expression":..., "level"?:..., "type"?:..., "pos"?:..., "meaning"?:..., "reason":...}],
                   "flags":[{"expression":..., "uid"?:..., "problem":...}]}
Changes are applied to every episode file containing the expression (all copies stay identical). Flags are only printed."""
import json, glob, os, sys
root = os.path.join(os.path.dirname(__file__), '..', 'episodes')
files = sorted(glob.glob(os.path.join(root, '*.json')))
eps = {f: json.load(open(f)) for f in files}
LEVELS = {'elementary','middle','high','college','expert'}; TYPES = {'word','phrase','colloquial'}
POS = {'noun','verb','adjective','adverb','expression'}
norm = lambda s: ' '.join(s.lower().split())
applied = 0; skipped = []
for rf in sys.argv[1:]:
    r = json.load(open(rf))
    for c in r.get('changes', []):
        key = norm(c['expression']); upd = {k: c[k] for k in ('level','type','pos','meaning') if k in c}
        if 'level' in upd and upd['level'] not in LEVELS: skipped.append((c, 'bad level')); continue
        if 'type' in upd and upd['type'] not in TYPES: skipped.append((c, 'bad type')); continue
        if 'pos' in upd and upd['pos'] not in POS: upd['pos'] = 'expression'
        hit = 0
        for f, items in eps.items():
            for it in items:
                if norm(it['expression']) == key:
                    t = upd.get('type', it['type']); l = upd.get('level', it['level'])
                    if t == 'word' and l == 'elementary': l = 'middle'; upd['level'] = 'middle'
                    it.update(upd); hit += 1
        if hit: applied += 1
        else: skipped.append((c, 'not found'))
    for fl in r.get('flags', []): print('FLAG', fl.get('expression'), fl.get('uid', ''), '-', fl.get('problem'))
for f, items in eps.items():
    open(f, 'w').write('[\n' + ',\n\n'.join(json.dumps(it, ensure_ascii=False, indent=2) for it in items) + '\n]\n')
print(f'applied {applied} expression changes; skipped {len(skipped)}')
for c, why in skipped: print('  skipped', why, c.get('expression'))
