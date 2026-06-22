#!/usr/bin/env python3
"""Bundle individual char stroke JSONs into a single JS file.

Usage: python3 scripts/build-chars-data.py
Re-run this whenever data/chars/*.json changes or new chars are added.
"""
import json, os, glob, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE, 'shizi', 'data', 'chars')
OUT_FILE = os.path.join(BASE, 'shizi', 'data', 'chars-data.js')

entries = {}
for path in sorted(glob.glob(os.path.join(SRC_DIR, '*.json'))):
    char = os.path.splitext(os.path.basename(path))[0]
    with open(path, 'r', encoding='utf-8') as f:
        entries[char] = json.load(f)

json_str = json.dumps(entries, ensure_ascii=False, separators=(',', ':'))

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    f.write("'use strict';\n\n")
    f.write("/* Auto-generated bundle of character stroke data.\n")
    f.write(" * DO NOT EDIT manually. Regenerate with:\n")
    f.write(" *   python3 scripts/build-chars-data.py\n")
    f.write(" * Source: shizi/data/chars/*.json\n")
    f.write(" * Bundled so the game works via file:// protocol (no fetch).\n")
    f.write(" */\n")
    f.write("window.HANZI_CHAR_DATA = ")
    f.write(json_str)
    f.write(";\n")

size_kb = os.path.getsize(OUT_FILE) / 1024
print(f"Wrote {OUT_FILE}: {len(entries)} chars, {size_kb:.0f} KB")
