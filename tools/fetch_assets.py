#!/usr/bin/env python3
"""Pobiera assety Poly Haven (CC0) lokalnie do public/.

Uruchomienie z katalogu repo:
    python3 tools/fetch_assets.py

Weryfikuje md5 z API Poly Haven. Idempotentne (pomija poprawne pliki).
"""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
API = "https://api.polyhaven.com/files/"

# Tekstury PBR: (asset_id, rozdzielczosc, [mapy])
TEXTURES = [
    ("medieval_wall_02", "2k", ["Diffuse", "nor_gl", "Rough"]),
    ("medieval_wall_01", "2k", ["Diffuse", "nor_gl", "Rough"]),
    ("monastery_stone_floor", "2k", ["Diffuse", "nor_gl", "Rough"]),
    ("medieval_wood", "2k", ["Diffuse", "nor_gl", "Rough"]),
]

# Modele glTF: (asset_id, wariant) — .gltf + wszystkie include (bin + tekstury),
# zachowując względne ścieżki, żeby GLTFLoader rozwiązał referencje.
MODELS = [
    ("wooden_crate_01", "1k"),
    ("book_encyclopedia_set_01", "1k"),
    ("brass_candleholders", "1k"),
]


UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}


def urlopen(url: str, timeout: int):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout)


def fetch_json(url: str) -> dict:
    with urlopen(url, timeout=60) as r:
        return json.loads(r.read().decode())


def download(url: str, dest: Path, md5: str = "") -> None:
    if dest.exists() and md5:
        h = hashlib.md5(dest.read_bytes()).hexdigest()
        if h == md5:
            print(f"  OK (cache) {dest.relative_to(ROOT)}")
            return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  GET {url.split('/')[-1]} -> {dest.relative_to(ROOT)} ...", flush=True)
    with urlopen(url, timeout=120) as r, open(dest, "wb") as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    if md5:
        h = hashlib.md5(dest.read_bytes()).hexdigest()
        if h != md5:
            print(f"  !! MD5 MISMATCH {dest} (chce {md5}, jest {h})")
            sys.exit(1)
    print(f"  zapisano {dest.stat().st_size // 1024} KB")


def main() -> None:
    for asset_id, res, maps in TEXTURES:
        print(f"[tex] {asset_id} {res}")
        meta = fetch_json(API + asset_id)
        outdir = PUBLIC / "textures" / "pbr" / asset_id
        for m in maps:
            entry = meta[m][res]["jpg"]
            fname = entry["url"].split("/")[-1]
            download(entry["url"], outdir / fname, entry.get("md5", ""))

    for asset_id, variant in MODELS:
        print(f"[model] {asset_id} {variant}")
        meta = fetch_json(API + asset_id)
        g = meta["gltf"][variant]["gltf"]
        outdir = PUBLIC / "models" / asset_id
        fname = g["url"].split("/")[-1]
        download(g["url"], outdir / fname, g.get("md5", ""))
        for rel, info in g["include"].items():
            download(info["url"], outdir / rel, info.get("md5", ""))

    print("GOTOWE")


if __name__ == "__main__":
    main()
