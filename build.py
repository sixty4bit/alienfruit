#!/usr/bin/env python3
"""Assemble the self-contained index.html from src/ + vendor/ + assets/tex/.

Everything the game needs (Three.js, textures as data URIs, CSS, JS) is
inlined so index.html works as a single static file on GitHub Pages.
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).parent
MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def data_uri(path: pathlib.Path) -> str:
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{MIME[path.suffix]};base64,{b64}"


def textures_js() -> str:
    tex_dir = ROOT / "assets" / "tex"
    entries = []
    if tex_dir.is_dir():
        for p in sorted(tex_dir.iterdir()):
            if p.suffix in MIME:
                entries.append(f'  {p.stem}: "{data_uri(p)}"')
    return "const TEXTURES = {\n" + ",\n".join(entries) + "\n};"


def main() -> None:
    html = (ROOT / "src" / "template.html").read_text()
    html = html.replace("/*__THREE__*/", (ROOT / "vendor" / "three.min.js").read_text())
    html = html.replace("/*__TEXTURES__*/", textures_js())
    html = html.replace("/*__CSS__*/", (ROOT / "src" / "style.css").read_text())
    html = html.replace("/*__GAME__*/", (ROOT / "src" / "game.js").read_text())
    out = ROOT / "index.html"
    out.write_text(html)
    print(f"index.html: {out.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
