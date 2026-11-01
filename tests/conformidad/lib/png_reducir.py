#!/usr/bin/env python3
"""Reduce las capturas de los ejemplos: 960 px de ancho y paleta de 128 colores. Uso: png_reducir.py archivo.png ..."""
import sys
from PIL import Image

for ruta in sys.argv[1:]:
    im = Image.open(ruta).convert("RGB")
    if im.width > 960:
        im = im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS)
    im.quantize(colors=128, method=Image.Quantize.MEDIANCUT).save(ruta, optimize=True)
