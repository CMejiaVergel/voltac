"""Markdown -> HTML -> PDF con Chrome headless.

    python scripts/md-a-pdf.py Guides/Backlog_Systems.md Guides/Backlog_Energy.md

Deja el PDF junto al MD, con el mismo nombre. Existe para que los PDF no se
queden desfasados: en cuanto se toca un backlog, se vuelve a correr esto y
listo. Un PDF viejo al lado de un MD nuevo es la misma clase de problema que
un componente duplicado entre las dos suites.

Requiere `pip install markdown` y Chrome instalado.

Se hace en dos pasos y no con una libreria de PDF a proposito: los backlogs
llevan tablas anchas y emojis en las etiquetas de importancia, y las fuentes
integradas de reportlab no tienen esos glifos --saldrian como cuadros negros--.
Chrome usa las fuentes del sistema y resuelve las dos cosas sin trabajo extra.
"""
import re
import subprocess
import sys
from pathlib import Path

import markdown

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

CSS = """
@page { size: A4; margin: 16mm 14mm 16mm 14mm; }

:root {
  --tinta: #12211a;
  --suave: #5d6b64;
  --verde: #1f7a4d;
  --linea: #dfe5e1;
  --fondo-suave: #f4f7f5;
}

* { box-sizing: border-box; }

body {
  font-family: "Segoe UI", "Inter", system-ui, sans-serif;
  font-size: 10pt;
  line-height: 1.55;
  color: var(--tinta);
  margin: 0;
}

/* Cada seccion mayor en pagina nueva. La primera no, o saldria una en blanco. */
h1 {
  font-size: 19pt;
  color: var(--verde);
  border-bottom: 2.5px solid var(--verde);
  padding-bottom: 5px;
  margin: 0 0 16px;
  page-break-before: always;
  page-break-after: avoid;
}
h1:first-of-type { page-break-before: avoid; }

h2 {
  font-size: 12.5pt;
  color: var(--tinta);
  margin: 20px 0 6px;
  padding-top: 8px;
  border-top: 1px solid var(--linea);
  page-break-after: avoid;
}

h3 { font-size: 10.5pt; margin: 14px 0 4px; page-break-after: avoid; }

p { margin: 6px 0; orphans: 3; widows: 3; }

strong { color: var(--tinta); }

/* La linea de metadatos que va justo debajo de cada titulo de item. */
h2 + p > strong:first-child {
  display: inline-block;
  background: var(--fondo-suave);
  border: 1px solid var(--linea);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 9pt;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 14px;
  font-size: 8.6pt;
  page-break-inside: auto;
}
thead { display: table-header-group; }   /* repite cabecera al partir pagina */
tr { page-break-inside: avoid; }
th {
  background: var(--verde);
  color: #fff;
  text-align: left;
  padding: 5px 7px;
  font-weight: 600;
}
td { padding: 4px 7px; border-bottom: 1px solid var(--linea); vertical-align: top; }
tbody tr:nth-child(even) td { background: #fafbfa; }
/* Las filas de seccion del indice, que solo llevan el titulo en negrita. */
td strong { color: var(--verde); }

code {
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 8.8pt;
  background: var(--fondo-suave);
  padding: 1px 4px;
  border-radius: 3px;
}
pre {
  background: var(--fondo-suave);
  border-left: 3px solid var(--verde);
  padding: 8px 11px;
  border-radius: 0 4px 4px 0;
  overflow-x: auto;
  page-break-inside: avoid;
  margin: 8px 0;
}
pre code { background: none; padding: 0; font-size: 8.4pt; }

blockquote {
  border-left: 3px solid var(--verde);
  background: var(--fondo-suave);
  margin: 10px 0;
  padding: 7px 12px;
  color: var(--suave);
  page-break-inside: avoid;
}
blockquote p { margin: 3px 0; }

hr { border: none; border-top: 1px solid var(--linea); margin: 16px 0; }

ol, ul { margin: 6px 0; padding-left: 20px; }
li { margin: 3px 0; }

em { color: var(--suave); }
"""


def convertir(md_path: Path) -> Path:
    # Chrome necesita una URI absoluta, y `as_uri()` se niega con rutas
    # relativas. Se resuelve aqui una vez y no en cada uso.
    md_path = md_path.resolve()
    texto = md_path.read_text(encoding="utf-8")

    # El titulo del documento sale del primer H1.
    m = re.search(r"^#\s+(.+)$", texto, re.M)
    titulo = m.group(1).strip() if m else md_path.stem

    cuerpo = markdown.markdown(
        texto,
        extensions=["tables", "fenced_code", "sane_lists", "attr_list"],
    )

    html = (
        "<!doctype html><html lang='es'><head><meta charset='utf-8'>"
        f"<title>{titulo}</title><style>{CSS}</style></head>"
        f"<body>{cuerpo}</body></html>"
    )

    html_path = md_path.with_suffix(".tmp.html")
    html_path.write_text(html, encoding="utf-8")

    pdf_path = md_path.with_suffix(".pdf")
    if pdf_path.exists():
        pdf_path.unlink()

    subprocess.run(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            html_path.as_uri(),
        ],
        check=True,
        capture_output=True,
        timeout=120,
    )

    html_path.unlink()
    return pdf_path


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        p = Path(arg)
        salida = convertir(p)
        kb = salida.stat().st_size / 1024
        print(f"  {salida.name}  ({kb:.0f} KB)")
