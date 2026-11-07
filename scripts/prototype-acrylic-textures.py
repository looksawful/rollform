"""Download selected CC0 ambientCG PBR maps, downsize for ROLLFORM browser prototype."""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "material-lab-textures"
OUT.mkdir(exist_ok=True)
IDS = ("Plastic006", "Plastic007", "Plastic008", "Plastic009", "Scratches005")
session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0 ROLLFORM-Prototype"})
for asset in IDS:
    endpoint = f"https://ambientcg.com/get?file={asset}_1K-JPG.zip"
    response = session.get(endpoint, allow_redirects=False, timeout=25)
    response.raise_for_status() if response.status_code != 302 else None
    if response.status_code != 302: raise RuntimeError(f"No redirect: {asset} {response.status_code}")
    url = response.headers["Location"]
    response = session.get(url, timeout=40)
    response.raise_for_status()
    archive = ZipFile(BytesIO(response.content))
    saved = []
    for kind in ("Roughness", "NormalGL"):
        matches = [n for n in archive.namelist() if n.lower().endswith((f"_{kind.lower()}.jpg", f"_{kind.lower()}.png"))]
        if not matches: continue
        with archive.open(matches[0]) as stream:
            im = Image.open(stream).convert("L" if kind == "Roughness" else "RGB")
            im.thumbnail((512, 512), Image.Resampling.LANCZOS)
            dst = OUT / f"{asset}_{kind}.webp"
            im.save(dst, "WEBP", quality=83, method=6)
            saved.append(f"{dst.name} {dst.stat().st_size}B")
    if not saved: raise RuntimeError(f"No maps: {asset} {archive.namelist()}")
    print("ROLLFORM_CC0", asset, ", ".join(saved))
print("Source: ambientcg.com; License: https://docs.ambientcg.com/license/")
