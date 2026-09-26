"""Extract Tables 1–2 from the supplied paper snapshot.

Usage: python scripts/extract_results.py /path/to/RoboValue.pdf
Requires PyMuPDF. This extractor deliberately fails if the table layout changes.
The website itself only needs Node.js; this script is optional for maintainers.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
METRICS = ['sa', 'tga_ct', 'tga_cf', 'voc', 'cycle_voc', 'memory_voc', 'fpl', 'trr', 'vs', 'csvc']
OOD_METRICS = [m for m in METRICS if m not in ('trr', 'csvc')]
MODEL = re.compile(r'^(LIV|ProcVLM-2B|RoboFAC-7B|RoboMeter-4B|RoboReward-[48]B|RynnValue-[48]B|TOPReward|VLAC-[28]B|Robo-Dopamine-[348]B)([†‡]?)\s*(.*)$')


def read_rows(text):
    text = text.split('Zero-Shot Evaluation', 1)[1].split('† 2.0 Preview', 1)[0]
    rows, current, setting = [], None, 'zero'
    for line in text.splitlines():
        line = line.strip()
        if line == 'One-Shot Evaluation':
            setting = 'one'
            continue
        match = MODEL.match(line)
        if match:
            current = {'name': match[1], 'preview': match[2] == '†', 'setting': setting, 'cells': []}
            rows.append(current)
            line = match[3]
        if line and current:
            current['cells'].append(line)
    assert len(rows) == 18, f'Expected 18 configurations, found {len(rows)}'
    return rows


def extract(pdf):
    doc = pymupdf.open(pdf)
    assert len(doc) >= 8, 'Expected Tables 1 and 2 on pages 7 and 8.'
    assert 'Table 1: Main Results.' in doc[6].get_text(), 'Table 1 moved; inspect the new layout.'
    assert 'Table 2: Generalization Results.' in doc[7].get_text(), 'Table 2 moved; inspect the new layout.'
    main, ood = read_rows(doc[6].get_text()), read_rows(doc[7].get_text())
    result = []
    for index, (a, b) in enumerate(zip(main, ood)):
        assert (a['name'], a['preview'], a['setting']) == (b['name'], b['preview'], b['setting'])
        values = re.findall(r'-?\d+\.\d+|(?<!\S)-(?!\S)', ' '.join(a.pop('cells')))
        assert len(values) == 10, (a, values)
        conditions = {'id': dict(zip(METRICS, [None if x == '-' else float(x) for x in values]))}
        pairs = re.findall(r'(-?\d+\.\d+)§?\s*/\s*(-?\d+\.\d+)§?|(?<!\S)(-)(?!\S)', ' '.join(b['cells']))
        assert len(pairs) == 8, (b, pairs)
        for side, condition in enumerate(['emb', 'env']):
            conditions[condition] = {m: None if pair[2] else float(pair[side]) for m, pair in zip(OOD_METRICS, pairs)}
        result.append({**a, 'id': f"{a['name'].lower()}{'-preview' if a['preview'] else ''}-{a['setting']}", 'order': index, 'conditions': conditions})
    return {
        'source': 'RoboValue manuscript, Tables 1 and 2',
        'sourceFile': 'RoboValue.pdf',
        'sourcePageCount': len(doc),
        'sourceSha256': hashlib.sha256(Path(pdf).read_bytes()).hexdigest(),
        'scale': 100,
        'modelFamilies': 9,
        'modelVariants': 15,
        'rows': result,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('paper', type=Path)
    parser.add_argument('--check', action='store_true', help='Verify the stored JSON without changing it.')
    args = parser.parse_args()
    data = extract(args.paper)
    target = ROOT / 'public/data/results.json'
    if args.check:
        assert json.loads(target.read_text()) == data, 'Published data differ from the source tables.'
        print('Verified: all 18 configurations and 3 conditions match the paper tables.')
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(data, indent=2) + '\n')
        print(f'Wrote {len(data["rows"])} configurations to {target.name}.')
