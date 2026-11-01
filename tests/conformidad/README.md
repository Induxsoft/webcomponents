# Batería de conformidad de EdiTable

Pruebas con aserciones explícitas de lo que **especifica** la versión 2 de `edit-table` (`/home/claude/mapa/edittable-spec-v2.md`) y de lo que el componente **hace hoy** (`0ed1824`, según `edittable-contrato.md` y el censo de consumidores). Es distinta del banco de regresión de `tests/` (fotos doradas): aquí cada prueba dice qué espera.

La v2 se desarrolla guiada por estas pruebas: las de funciones nuevas ya existen y se ejecutan; mientras la función no esté en `EditTable.features`, salen **pendientes**, y pasan en cuanto se implementa.

## Cómo correr

```
node tests/conformidad/run.mjs [--src ruta.js] [--ref ruta.js] [--excel ruta.js]
                               [--filtro texto] [--solo actual|correcciones|v2]
                               [--paralelo N] [--matriz] [--capturas] [--verbose]
```

- Requisitos: Node 18+ y Playwright ya instalado (`require('playwright')`); Python 3 con `openpyxl` para validar los XLSX (`pip install --break-system-packages openpyxl`) y `Pillow` para reducir las capturas (opcional). Sin dependencias npm.
- `--src`: componente bajo prueba (por omisión `src/js/induxsoft.controls.editable.js`).
- `--ref`: referencia para R1. Por omisión se extrae `0ed1824:src/js/induxsoft.controls.editable.js` con `git show` a `$TMPDIR/et-conformidad-ref/` (fuera del repo).
- `--excel`: biblioteca `InduxsoftExcel` (por omisión `src/js/induxsoft.controls.excel.js`; si no existe, sus pruebas quedan pendientes).
- `--mask`: solo para validar el motor de máscaras suelto (`src/js/_partes/editable.mask.js`): lo concatena y lo expone como `EditTable.Mask`.
- `--matriz`: regenera `MATRIZ.md` con el estado de la corrida. `--capturas`: toma las capturas de `examples/v2/capturas/`.
- Otros: `node tests/conformidad/matriz.mjs` (solo la matriz) y `node tests/conformidad/capturas.mjs [--solo actual|v2] [--excel ruta]` (abre cada ejemplo, revisa la consola y captura).

Salida en `tests/conformidad/out/`: `report.md` (por suite: pasadas, fallidas, defectos conocidos, pendientes y errores del arnés, con el detalle de lo que no pasó), `junit.xml` y `resultados.json`. Código de salida: 0 si el grupo "actual" pasa, 1 si alguna prueba "actual" falla, 2 si hubo errores del arnés.

## Grupos y estados

| Grupo | Qué prueba | Contra `0ed1824` |
|---|---|---|
| `actual` | El contrato de hoy: inicialización, tipos, edición, teclado, eventos (orden y forma de `eventArgs`), API de datos, orden, árbol, tarjetas y badges, presentación, impresión, consumidores V12 y FactuDesk, los ejemplos y **el censo** (cada selector de `control-styles` y cada miembro con uso real). | Pasan al 100 %, salvo los **defectos conocidos** marcados. |
| `correcciones` | C1–C13 y C15–C18 de la spec §1: afirman el comportamiento **correcto**. C12 y C16 por omisión conservan lo de hoy (R8), así que esas pruebas pasan ya. | Fallan (pasarán con F1). |
| `v2` | §0 (R3–R9), §2–§11, casos límite, R1 contra la referencia, pruebas unitarias sin DOM de `EditTable.Mask` y de `InduxsoftExcel` (XLSX validado con openpyxl), y los ejemplos v2. | Pendientes por función no disponible (o fallidas si no hay bandera en `features`, ver PREGUNTAS P11); las de R1 pasan. |

Estados: **pasada**; **fallida**; **defecto conocido** (la prueba afirma lo correcto y falla por un defecto ya documentado; no cuenta como falla); **pendiente** (falló y la prueba `requiere` una función que `EditTable.features` no declara, o el archivo de Excel no existe); **error del arnés** (excepción en el código de la prueba, fuera de la página: debe ser 0).

## Cómo funciona

- `lib/arnes.mjs`: servidor HTTP local (sirve el repo, `/__et/editable.js` = `--src`, `/__ref/editable.js` = `--ref`, `/__et/excel.js` y páginas en memoria), un `BrowserContext` nuevo por prueba (IndexedDB y portapapeles aislados), aserciones y clasificación de errores.
- `lib/sonda.js` corre en cada página antes que cualquier script: **fuerza `attachShadow({mode:'open'})`** sin cambiar nada más, siembra `Math.random`, cuenta intervalos y listeners de `window`/`document` (para C11) y expone `window.__ct` (registro de eventos, acceso a celdas, serialización del shadow DOM, lectura de IndexedDB, sha256).
- `lib/fixtures.mjs`, `lib/consumidores.mjs` (réplicas de `uie.dbeditable` y de los conceptos de FactuDesk), `lib/v2.mjs` (editar, arrastrar, llamar métodos), `lib/xlsx_validar.py` (describe un XLSX: tipos, formatos, negritas, `freeze_panes`, autofiltro, celdas combinadas, CRC del ZIP).
- `suites/*.mjs`: cada archivo exporta `{nombre, grupo, pruebas}` (o un arreglo). Cada prueba: `{id, titulo, spec: [renglones], requiere: [features], defecto?, censo?: [dependencias], limite?, fn(ctx, env)}`.
- R1: las pruebas `r1-*` cargan el mismo escenario con `--src` y con `--ref`, hacen las mismas acciones y comparan el shadow DOM serializado, `DataArray`, `Columns`, los eventos con sus argumentos y el light DOM.
- `spec-renglones.mjs`: los renglones de la spec y las áreas del contrato; `matriz.mjs` los cruza con el campo `spec` de las pruebas y de los ejemplos (`examples/v2/ejemplos.js`) y con el censo (`ET_CENSO_DIR`, por omisión `/home/claude/v12_qa/docs/edittable`) para escribir `MATRIZ.md`.

## Agregar una prueba

1. Elegir la suite (o crear `suites/vNN-algo.mjs`) y el renglón de la spec en `spec-renglones.mjs`.
2. `t('id', 'qué afirma', ['§N-x'], async (c) => { await c.abrir({ body: tabla({...}) }); ... c.igual(real, esperado); }, { requiere: ['feature'] })`.
3. Toda falla debe ser una aserción (`c.igual`, `c.ok`…) o una excepción dentro de la página; si una ayuda puede devolver `null`, lanzar `Falla` en lugar de dejar un `TypeError` en Node (se contaría como error del arnés).
4. `node tests/conformidad/run.mjs --filtro id --verbose` y luego `--matriz`.

## Ejemplos

`examples/v2/index.html` lista los ejemplos (actual y versión 2) con su descripción, los renglones de la spec que muestran y su captura. Cada página muestra en vivo los eventos y el `DataArray`; las de la versión 2 leen `EditTable.features` y, si falta la función, muestran "Función no disponible en esta versión". Las páginas se generan a mano (HTML autocontenido); `ejemplos.js` es el índice.
