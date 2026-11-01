# Pruebas de InduxsoftExcel

```sh
node tests/excel/run.mjs
```

Sale con código 0 si todo pasa e imprime `TODO BIEN`.

## Qué hace

1. Abre Chromium headless con Playwright (`require('playwright')`; no ejecuta `playwright install`).
2. Genera los XLSX en el navegador con `src/js/induxsoft.controls.excel.js` y los guarda en `tests/excel/out/` (ignorada por git).
3. Los valida con Python y `openpyxl` (`validate.py`): integridad del ZIP y CRC32 (`zipfile.testzip`), partes de SpreadsheetML, método ZIP (STORE o DEFLATE), valores, tipos, formatos numéricos y de fecha, negritas, panel fijado, autofiltro, anchos, celdas combinadas, totales, escapes y nombres de hoja.
4. Si existe `soffice`/`libreoffice`, convierte varios archivos a CSV con `--headless --convert-to csv` como prueba de que abren (si no está, lo dice y lo omite).
5. Carga la biblioteca en Node con `require` (sin DOM) y genera un XLSX y un CSV.
6. Mide 20,000 filas × 10 columnas (falla si tarda 2 s o más) y reporta el tamaño del archivo `.js`.

## Páginas

| Archivo | Qué prueba |
|---|---|
| `out/blank.html` (se genera) | `fromData`/`fromDataAsync`: tipos, formatos, escapes, 0, 1 y 20,000 filas, nombre de hoja inválido, `raw`, `includeHidden`. También la matriz de locales (tablas creadas en la página, con el locale del navegador puesto por el contexto de Playwright: `en-US` y `de-DE`). |
| `edittable.html` | El componente real `edit-table` (versión 1) con columnas de todos los tipos, una `no-print` y una oculta con `hideColumn`; Select con y sin `keyfield`; `fromTable` delegando en `fromEditTable`; libro con `edit-table`, arreglo, tabla y `{columns, rows}`; `toCSV`. |
| `tabla.html` | **No carga EdiTable** (la prueba lo comprueba): tabla con `colspan`/`rowspan`, `tfoot`, fila oculta por estilo y por atributo, columna `no-print`, `data-type`/`data-value`, números con formato mexicano; tabla sin `thead`; `fromArray` con columnas inferidas y explícitas, rutas con punto y `value`; libro de varias hojas; `toCSV` con BOM y delimitador forzado; `download(fuente, nombre)` capturado como descarga real. |
| `../../examples/excel-demo.html` | Prueba de humo del ejemplo: pulsa cada botón y valida los archivos descargados. |

## Locales (R7)

`es-MX`, `en-US`, `es-ES`, `es-CO` y `de-DE` (`1.234,56 €`, `25.12.2026`); `lang` de la tabla contra el del documento, contra el del navegador y contra las opciones `locale` y `decimal`/`thousands`/`dateOrder`; fechas ambiguas resueltas por la columna (en ambos sentidos) y sin resolver (decide el locale); delimitador de CSV según el locale, forzado con `delimiter`, y `raw`.

## Requisitos

- Node 18+ y Playwright con Chromium ya instalados.
- Python 3 con `openpyxl` (`pip install --break-system-packages openpyxl`).
- Opcional: LibreOffice.

Los datos de prueba son ficticios.
