#!/usr/bin/env python3
"""Apply typo/suitability review results:  python3 tools/apply-text-audit.py result1.json [...]
- textFixes     -> merged into fixes/text-fixes.json (display corrections by uid; the build checks each one)
- exchangeFixes -> answer / options replaced on that exchange in that episode file
- changes       -> run tools/apply-audit.py on the same files for meaning/type/level changes
- drops, flags  -> printed only (the owner decides)"""
import json, glob, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(here, '..')
fx_path = os.path.join(root, 'fixes', 'text-fixes.json')
fixes = json.load(open(fx_path)) if os.path.exists(fx_path) else {}
def save_ep(f, items): open(f, 'w').write('[\n' + ',\n\n'.join(json.dumps(it, ensure_ascii=False, indent=2) for it in items) + '\n]\n')
norm = lambda s: ' '.join(s.lower().split())
eps = {}; nt = ne = 0; miss = []
for rf in sys.argv[1:]:
    r = json.load(open(rf))
    for t in r.get('textFixes', []):
        pair = [t['from'], t['to']]
        if t['from'] == t['to']: continue
        lst = fixes.setdefault(t['uid'], [])
        if pair not in lst: lst.append(pair); nt += 1
    for x in r.get('exchangeFixes', []):
        f = os.path.join(root, 'episodes', x['file'])
        if not os.path.exists(f): miss.append(('no file', x)); continue
        items = eps.setdefault(f, json.load(open(f))); hit = False
        for it in items:
            if norm(it['expression']) != norm(x['expression']): continue
            for ex in it['exchanges']:
                if ex['uid'] != x['uid']: continue
                if 'answer' in x: ex['answer'] = x['answer']
                if 'options' in x:
                    o = x['options']
                    if len(o) != 4 or len({s.lower() for s in o}) != 4 or o[0].lower() != ex['answer'].lower(): miss.append(('bad options', x)); continue
                    ex['options'] = o
                hit = True
        if hit: ne += 1
        else: miss.append(('not found', x))
    for d in r.get('drops', []): print('DROP?', d.get('expression'), d.get('file', ''), d.get('uid', ''), '-', d.get('reason'))
    for fl in r.get('flags', []): print('FLAG', fl.get('expression'), fl.get('uid', ''), '-', fl.get('problem'))
for f, items in eps.items(): save_ep(f, items)
json.dump(dict(sorted(fixes.items())), open(fx_path, 'w'), ensure_ascii=False, indent=1)
print(f'text fixes added {nt} (total uids {len(fixes)}); exchange fixes {ne}; problems {len(miss)}')
for why, x in miss: print('  ', why, x.get('file'), x.get('uid'), x.get('expression'))
