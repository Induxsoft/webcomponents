#!/usr/bin/env bash
# Empaqueta el sitio de demostración de EdiTable 2 como sitio estático autocontenido.
#
#   examples/demo/empaquetar.sh [destino]
#
# 1. Copia los JS del componente (src/js) a examples/demo/js/.
# 2. Arma <destino> (por omisión examples/demo/_publicar/) con las páginas, assets/ y js/,
#    cambiando las rutas ../../src/js/ por js/. Esa carpeta se sube tal cual a cualquier hosting estático.
# Ni js/ ni _publicar/ se versionan (.gitignore): se regeneran con este script.
set -euo pipefail
DEMO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$DEMO/../../src/js"
DEST="${1:-$DEMO/_publicar}"
JS=(induxsoft.controls.editable.js induxsoft.controls.excel.js)

for f in "${JS[@]}"; do [ -f "$SRC/$f" ] || { echo "Falta $SRC/$f" >&2; exit 1; }; done

mkdir -p "$DEMO/js"
for f in "${JS[@]}"; do cp "$SRC/$f" "$DEMO/js/$f"; done

case "$DEST" in ""|"/"|"$DEMO") echo "Destino inválido: $DEST" >&2; exit 1;; esac
rm -rf "$DEST"
mkdir -p "$DEST/js" "$DEST/assets"
cp "$DEMO"/*.html "$DEST/"
cp "$DEMO"/assets/* "$DEST/assets/"
cp "$DEMO"/js/*.js "$DEST/js/"
sed -i 's#\.\./\.\./src/js/#js/#g' "$DEST"/*.html

# Comprobación: ninguna página debe apuntar fuera de la carpeta ni a un CDN
if grep -nE '(\.\./|https?://)[^"'"'"' ]*\.(js|css)' "$DEST"/*.html; then
  echo "Hay rutas que salen de la carpeta publicada (arriba)." >&2; exit 1
fi

VER=$(grep -oE 'static version = "[^"]+"' "$DEMO/js/induxsoft.controls.editable.js" | head -1 | cut -d'"' -f2)
COMMIT=$(git -C "$DEMO" rev-parse --short HEAD 2>/dev/null || echo "sin-git")
printf 'EdiTable %s · commit %s · %s\n' "$VER" "$COMMIT" "$(date -u +%Y-%m-%dT%H:%MZ)" > "$DEST/VERSION.txt"

echo "Listo: $DEST ($(ls "$DEST"/*.html | wc -l) páginas, EdiTable $VER)"
