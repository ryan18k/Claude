"""Assemble l'application publiable dans app/dist/.

Usage : python3 scripts/build_app.py

- app/src/index.html, app/src/py/worker.js                → la page et le worker SymPy
- corpus/analyse/…                                        → app/dist/corpus/AN1/… + corpus/index.json
- Pyodide, SymPy, mpmath (téléchargés dans data/vendor)   → app/dist/py/ (archives en base64 : les .zip
  ne sont pas servis par les artefacts)
- KaTeX : la feuille de style avec ses polices woff2 en data: URI (le script vient de cdn.jsdelivr.net)
"""
import base64
import json
import re
import shutil
import subprocess
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "app/dist"
VENDOR = ROOT / "data/vendor"
PYODIDE = "0.27.7"
SYMPY, MPMATH = "1.13.3", "1.3.0"
KATEX = "0.16.11"


def npm(pkg, ver):
    dest = VENDOR / f"{pkg}-{ver}"
    if not dest.exists():
        VENDOR.mkdir(parents=True, exist_ok=True)
        subprocess.run(["npm", "pack", f"{pkg}@{ver}", "-q"], cwd=VENDOR, check=True, capture_output=True)
        with tarfile.open(VENDOR / f"{pkg}-{ver}.tgz") as t:
            t.extractall(VENDOR / "tmp")
        (VENDOR / "tmp/package").rename(dest)
    return dest


def wheels():
    w = VENDOR / "wheels"
    if not list(w.glob("sympy-*.whl")):
        subprocess.run(["pip", "download", "-q", "--no-deps", "-d", str(w), f"sympy=={SYMPY}", f"mpmath=={MPMATH}"], check=True)
    return {"sympy": next(w.glob("sympy-*.whl")), "mpmath": next(w.glob("mpmath-*.whl"))}


def b64(src, dest):
    dest.write_text(base64.b64encode(src.read_bytes()).decode())


def katex_css(pkg):
    css = (pkg / "dist/katex.min.css").read_text()

    def repl(m):
        font = m.group(1)
        data = base64.b64encode((pkg / "dist/fonts" / f"{font}.woff2").read_bytes()).decode()
        return f'src:url(data:font/woff2;base64,{data}) format("woff2")'
    return re.sub(r'src:url\(fonts/([\w-]+)\.woff2\) format\("woff2"\)(?:,url\([^)]+\) format\("[^"]+"\))*', repl, css)


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "py").mkdir(parents=True)
    shutil.copy(ROOT / "app/src/index.html", DIST / "index.html")

    # SymPy dans le navigateur
    py = npm("pyodide", PYODIDE)
    for f in ("pyodide.mjs", "pyodide.asm.js", "pyodide.asm.wasm", "pyodide-lock.json"):
        shutil.copy(py / f, DIST / "py" / f)
    b64(py / "python_stdlib.zip", DIST / "py/python_stdlib.b64.txt")
    for name, whl in wheels().items():
        b64(whl, DIST / f"py/{name}.b64.txt")
    shutil.copy(ROOT / "app/src/py/worker.js", DIST / "py/worker.js")
    shutil.copy(ROOT / "tuteur/sympy_checks.py", DIST / "py/sympy_checks.py.txt")

    # KaTeX : styles et polices embarqués
    (DIST / "katex").mkdir()
    (DIST / "katex/katex.css").write_text(katex_css(npm("katex", KATEX)))

    # Corpus
    src = ROOT / "corpus/analyse"
    dst = DIST / "corpus/AN1"
    for sub in ("chapitres", "notions", "series", "variantes", "fig", "orig"):
        if (src / sub).exists():
            shutil.copytree(src / sub, dst / sub)
    chapitres = []
    for ch in sorted((src / "chapitres").glob("*.json")):
        c = json.load(open(ch))
        chapitres.append({"id": c["id"], "titre": c["titre"], "chapitre": f"corpus/AN1/chapitres/{ch.name}",
                          "notions": f"corpus/AN1/notions/{ch.name}", "serie": f"corpus/AN1/series/{c['serie']}.json",
                          "variantes": f"corpus/AN1/variantes/{c['serie']}.json" if (src / "variantes" / f"{c['serie']}.json").exists() else None})
    json.dump({"matieres": [{"id": "AN1", "titre": "Analyse I", "chapitres": chapitres}]},
              open(DIST / "corpus/index.json", "w"), ensure_ascii=False)

    files = sorted(p.relative_to(DIST).as_posix() for p in DIST.rglob("*") if p.is_file() and p.name != "index.html")
    json.dump(files, open(ROOT / "app/files.json", "w"), indent=0)
    size = sum(p.stat().st_size for p in DIST.rglob("*") if p.is_file())
    big = max((p for p in DIST.rglob("*") if p.is_file()), key=lambda p: p.stat().st_size)
    print(f"{len(files) + 1} fichiers, {size / 1e6:.1f} Mo au total ; le plus gros : {big.name} {big.stat().st_size / 1e6:.1f} Mo")


if __name__ == "__main__":
    main()
