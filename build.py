"""Build the site into dist/index.html.

The page is one self-contained HTML file: the styles, the pages and the scripts
from src/ are inlined, so it can be opened straight from disk or served by any
static host. Run:  python build.py
"""
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


FAVICON = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
    "%3Ccircle cx='16' cy='16' r='15' fill='%238EADFF'/%3E"
    "%3Crect x='10' y='10' width='12' height='12' rx='2' fill='none' stroke='%2316223A' stroke-width='2'/%3E"
    "%3Cpath d='M13 7v3m6-3v3M13 22v3m6-3v3M7 13h3m-3 6h3m12-6h3m-3 6h3' stroke='%2316223A' stroke-width='1.6' stroke-linecap='round'/%3E"
    "%3C/svg%3E"
)

HEAD = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>CSE 3313 Computer Architecture Guide</title>
<meta name="description" content="A study guide for CSE 3313 Computer Architecture, covering performance, MIPS and exam practice.">
<meta name="theme-color" content="#16223A">
<meta property="og:title" content="CSE 3313 Computer Architecture Guide">
<meta property="og:description" content="A study guide for CSE 3313 Computer Architecture, covering performance, MIPS and exam practice.">
<meta property="og:type" content="website">
<link rel="icon" href="{FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
  [hidden] {{ display: none !important; }}
  img {{ max-width: 100%; }}
"""


def build():
    ct2_course = "\n".join(read(name) for name in (
        "ct2-foundations.html", "ct2-basics.html", "ct2-bits.html",
        "ct2-memory.html", "ct2-control.html", "ct2-functions.html",
        "ct2-encoding.html", "ct2-exercises.html", "ct2-index.html", "ct2-simulator.html",
    ))
    html = (
        HEAD
        + read("style.css")
        + "</style>\n</head>\n<body>\n"
        + read("pages.html")
        .replace("<!-- Binary division -->", read("arithmetic.html"))
        .replace("<!-- CT-2 foundations -->", ct2_course)
        .replace("<!-- Midterm review -->", read("midterm-review.html"))
        .replace("<!-- CT-2 papers -->", read("ct2-papers.html"))
        + "\n<script>\n"
        + "\n".join(read(name) for name in ("dropdown.js", "ui.js", "engine.js", "practice.js", "mips.js", "mips-ui.js", "ct2-labs.js", "ct2-simulator-data.js", "ct2-simulator.js"))
        + "</script>\n</body>\n</html>\n"
    )
    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, "index.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    ids = re.findall(r'\sid="([^"]+)"', html)
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit(f"duplicate element ids: {dupes}")
    print(f"built {out} ({len(html):,} bytes)")


if __name__ == "__main__":
    build()
