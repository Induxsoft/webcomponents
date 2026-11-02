# Matriz de cobertura: especificación de EdiTable 2 ↔ pruebas ↔ ejemplos

*Generada por `tests/conformidad/matriz.mjs` a partir del campo `spec` de cada prueba (`tests/conformidad/suites/*.mjs`) y de cada ejemplo (`examples/v2/ejemplos.js`). No editar a mano.*

Ids de renglón: `§N-x` según la sección de `edittable-spec-v2.md`; `A.*` son áreas del contrato actual (`edittable-contrato.md`); `L-*` son casos límite pedidos.

Estado de la última corrida: ✓ pasada · ✗ fallida · x defecto conocido · p pendiente (función no disponible) · E error del arnés.

## Resumen

- Renglones de la spec y del contrato (sin §12): **221**; con al menos una prueba: **221** (**100.0 %**).
- Solo renglones de la spec v2 (§0-§11): **201**; con prueba: **201** (**100.0 %**).
- Pilotos de §12 cubiertos con ejemplo: **6 de 6**.
- Renglones con al menos un ejemplo: **155** de 227.
- Pruebas: **944** (actual: 329, correcciones: 69, v2: 546). Ejemplos: **45**.
- Renglones sin prueba: ninguno.
- Descartados: `§1-C14` C14 (bloquear la tecla del separador de miles): descartada el 2026-11-01, comportamiento del navegador.
- Ids citados que no están en la lista de renglones: `§1-C20`, `§5-b`.

## Spec §0

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§0-R1` | R1 Compatibilidad: sin atributos nuevos, DOM, CSS, eventos y DataArray idénticos a 0ed1824 | 25: `msk-r7-01d`✓ `fij-09`✓ `vis-12`✓ `reo-10`✓ `vir-02`✓ `vir-18`✓ `grp-01`✓ `grp-20`✓ `r1-01`✓ `r1-02`✓ `r1-03`✓ `r1-04`✓ `r1-05`✓ `r1-06`✓ … (+11) | — |
| `§0-R2` | R2 Índices: todo índice de fila expuesto es de DataArray; filas de grupo y relleno sin índice | 9: `sel-11`✓ `sel-13`✓ `vir-11`✓ `vir-16`✓ `grp-03`✓ `grp-10`✓ `lim-09`✓ `bus-03`✓ `bus-14`✓ | — |
| `§0-R3` | R3 Columns[i] ↔ celda de datos i; columnas del sistema fuera de Columns y de onTdPaint; estado por field | 8: `gen-r3-01`✓ `gen-r3-02`✓ `sel-15`✓ `reo-01`✓ `reo-06`✓ `lim-03`✓ `cmb-03`✓ `cmb-14`✓ | — |
| `§0-R4` | R4 Eventos nuevos en Const.Events y en el switch de addEventListener; Before* cancelables | 16: `gen-ev-SummaryCalculated`✓ `gen-ev-MaskInvalid`✓ `gen-ev-SelectionChanged`✓ `gen-ev-BeforeCopy`✓ `gen-ev-ColumnFixedChanged`✓ `gen-ev-ColumnVisibilityChanged`✓ `gen-ev-BeforeColumnMove`✓ `gen-ev-ColumnMoved`✓ `gen-ev-LayoutChanged`✓ `gen-ev-LayoutRejected`✓ `gen-ev-BeforeGroup`✓ `gen-ev-GroupChanged`✓ `gen-ev-GroupToggled`✓ `gen-r4-cancel`✓ … (+2) | — |
| `§0-R5` | R5 Atributo kebab-case ↔ propiedad PascalCase | 14: `gen-r5-summary-scope`✓ `gen-r5-multi-select`✓ `gen-r5-column-chooser`✓ `gen-r5-column-reorder`✓ `gen-r5-design-auto-save`✓ `gen-r5-design-key`✓ `gen-r5-design-auto-save-sort`✓ `gen-r5-virtual-rows`✓ `gen-r5-group-panel`✓ `gen-r5-omision`✓ `tem-14`✓ `bus-01`✓ `bus-11`✓ `reg-07`✓ | — |
| `§0-R6` | R6 EditTable.version (semver 2.x) y EditTable.features | 4: `gen-01`✓ `gen-02`✓ `tem-01`✓ `f8a-features`✓ | — |
| `§0-R7` | R7 Locale: prioridad (explícito, lang con región, documento, inferencia, es-MX), "auto", dónde se aplica | 51: `r9-loc-1.234,50`✓ `r9-loc-,5`✓ `r9-loc-007`✓ `r9-loc--5`✓ `r9-loc-1,10`✓ `r9-date-loc`✓ `msk-r7-01`✓ `msk-r7-01b`✓ `msk-r7-01c`✓ `msk-r7-02`✓ `msk-r7-03`✓ `msk-r7-04`✓ `msk-r7-05`✓ `msk-r7-06`✓ … (+37) | [b06c-locale-dos-tablas.html](../../examples/v2/b06c-locale-dos-tablas.html) |
| `§0-R8` | R8 Por omisión, el comportamiento actual | 6: `r9-nativo`✓ `r9-date-crudo`✓ `msk-r7-01d`✓ `cmb-loc-relativo`✓ `val-10`✓ `cap-10`✓ | — |
| `§0-R9` | R9 Números como cadena canónica y fechas ISO en los editores; datetime-seconds; date-display | 27: `r9-calc-05`✓ `r9-calc-exp`✓ `r9-calc-ceros`✓ `r9-loc-1.234,50`✓ `r9-loc-,5`✓ `r9-loc-007`✓ `r9-loc--5`✓ `r9-loc-1,10`✓ `r9-loc-nonum`✓ `r9-nativo`✓ `r9-formato-no-llega`✓ `r9-dt-seg`✓ `r9-date-loc`✓ `r9-date-display`✓ … (+13) | [b03-calc.html](../../examples/v2/b03-calc.html) [b06d-fechas-servidor.html](../../examples/v2/b06d-fechas-servidor.html) |

## Spec §1

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§1-C1` | Corrección C1 | 2: `cor-C1a`✓ `cor-C1b`✓ | — |
| `§1-C2` | Corrección C2 | 6: `cor-C2a`✓ `cor-C2b`✓ `cor-C2c`✓ `cor-C2d`✓ `cor-C2e`✓ `cor-C2f`✓ | [b05-portapapeles.html](../../examples/v2/b05-portapapeles.html) |
| `§1-C3` | Corrección C3 | 2: `cor-C3a`✓ `cor-C3b`✓ | — |
| `§1-C4` | Corrección C4 | 3: `cor-C4a`✓ `cor-C4b`✓ `cor-C4c`✓ | — |
| `§1-C5` | Corrección C5 | 5: `cor-C5a`✓ `cor-C5b`✓ `cor-C5c`✓ `cor-C5d`✓ `cor-C5e`✓ | — |
| `§1-C6` | Corrección C6 | 2: `cor-C6a`✓ `cor-C6b`✓ | — |
| `§1-C7` | Corrección C7 | 2: `cor-C7`✓ `cor-C7b`✓ | — |
| `§1-C8` | Corrección C8 | 5: `cor-C8a`✓ `cor-C8b`✓ `cor-C8c`✓ `cor-C8d`✓ `cor-C8e`✓ | — |
| `§1-C9` | Corrección C9 | 4: `cor-C9a`✓ `cor-C9b`✓ `cor-C9c`✓ `lim-10`✓ | — |
| `§1-C10` | Corrección C10 | 2: `cor-C10a`✓ `cor-C10b`✓ | — |
| `§1-C11` | Corrección C11 | 4: `cor-C11a`✓ `cor-C11b`✓ `cor-C11c`✓ `cor-C11d`✓ | — |
| `§1-C12` | Corrección C12 | 7: `num-C12a`✓ `num-C12b`✓ `num-C12c`✓ `num-C12d`✓ `num-C12e`✓ `num-C12f`✓ `num-C12g`✓ | — |
| `§1-C13` | Corrección C13 | 2: `num-C13a`✓ `num-C13b`✓ | — |
| `§1-C15` | Corrección C15 | 4: `num-C15a`✓ `num-C15b`✓ `cmb-a1-mascara`✓ `cmb-a1-calc`✓ | — |
| `§1-C16` | Corrección C16 | 9: `num-C16a`✓ `num-C16b`✓ `num-C16c`✓ `num-C16d`✓ `num-C16e`✓ `num-C16f`✓ `num-C16g`✓ `r9-formato-no-llega`✓ `msk-r7-01b`✓ | [b06c-locale-dos-tablas.html](../../examples/v2/b06c-locale-dos-tablas.html) |
| `§1-C17` | Corrección C17 | 9: `c17-Date-2026-02-01 10:30:00`✓ `c17-Date-01/02/2026`✓ `c17-Date-2026-02-01T00:00:00.000Z`✓ `c17-DateTime-2026-02-01 10:30:00`✓ `c17-DateTime-2026-02-01T10:30:15`✓ `c17-num`✓ `c17-num-fmt`✓ `c17-txt`✓ `c17-txt-cambio`✓ | [b06d-fechas-servidor.html](../../examples/v2/b06d-fechas-servidor.html) |
| `§1-C18` | Corrección C18 | 6: `c17-C18-date-espacio`✓ `c17-C18-date-Z`✓ `c17-C18-dt-espacio`✓ `c17-C18-dt-Z`✓ `c17-C18-dt-offset`✓ `c17-C18-ambigua`✓ | [b06d-fechas-servidor.html](../../examples/v2/b06d-fechas-servidor.html) |

## Spec §2

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§2-a` | edit-th summary=sum\|count\|avg\|min\|max\|custom | 8: `sum-04`✓ `sum-05-count`✓ `sum-05-avg`✓ `sum-05-min`✓ `sum-05-max`✓ `sum-07`✓ `msk-r7-08`✓ `cmb-53`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) [p1-captura-venta.html](../../examples/v2/p1-captura-venta.html) [p2-movimiento-inventario.html](../../examples/v2/p2-movimiento-inventario.html) [p6-comprobantes-cfdi.html](../../examples/v2/p6-comprobantes-cfdi.html) |
| `§2-b` | summary-format (inherit por omisión) | 2: `sum-08`✓ `cmb-54`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-c` | summary-label con {value} | 6: `sum-09`✓ `sum-10`✓ `cmb-04`✓ `cmb-50`✓ `cmb-51`✓ `cmb-52`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-d` | summary-scope=all\|visible\|selected y su valor por omisión | 5: `sum-22`✓ `sum-23`✓ `sum-24`✓ `lim-04`✓ `bus-16`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) [b04-seleccion.html](../../examples/v2/b04-seleccion.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) |
| `§2-e` | SummaryFunction(field, rowsData) para custom | 1: `sum-07`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-f` | getSummary(field) → número o null | 2: `sum-04`✓ `sum-06`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-g` | getSummaries() → {field: valor} | 2: `sum-11`✓ `exp-04`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-h` | RefreshSummaries() | 1: `sum-15`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-i` | Evento SummaryCalculated {field, value, scope} | 1: `sum-16`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-j` | tfoot solo si alguna columna declara summary | 5: `sum-01`✓ `sum-02`✓ `sum-25`✓ `lim-01`✓ `lim-10`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-k` | tr.et-summary-row; una td.et-summary por celda de datos; data-summary | 4: `sum-02`✓ `sum-03`✓ `sum-21`✓ `reo-09`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-l` | tfoot sticky bottom 0 | 1: `sum-17`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |
| `§2-m` | Ninguna consulta interna toma el tfoot | 3: `sum-18`✓ `sum-19`✓ `sum-20`✓ | — |
| `§2-n` | Recalcula en FieldUpdated, RowAdded, RowDeleted, asignar DataArray, selección, filtrar/agrupar | 5: `sum-12`✓ `sum-13`✓ `sum-14`✓ `sum-22`✓ `cmb-53`✓ | [b01-totales.html](../../examples/v2/b01-totales.html) |

## Spec §3

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§3-a` | Atributos mask, mask-placeholder, mask-keep, calc | 6: `msk-02`✓ `msk-03`✓ `msk-11`✓ `msk-12`✓ `mku-07`✓ `mku-08`✓ | [b02-mascaras.html](../../examples/v2/b02-mascaras.html) |
| `§3-b` | Patrón 9 A X *, sin huecos, placeholder no es dato, preset por nombre | 9: `msk-01`✓ `mku-02`✓ `mku-03`✓ `mku-04`✓ `mku-05`✓ `mku-07`✓ `mku-09`✓ `mku-10`✓ `mku-12`✓ | [b02-mascaras.html](../../examples/v2/b02-mascaras.html) [p2-movimiento-inventario.html](../../examples/v2/p2-movimiento-inventario.html) |
| `§3-c` | Escape \ y literales | 4: `mku-02`✓ `mku-06`✓ `cmb-a1-mascara`✓ `cmb-a1-calc`✓ | [b02-mascaras.html](../../examples/v2/b02-mascaras.html) |
| `§3-d` | Presets rfc, curp, cp, tel, email, percent, upper, lower; vacío siempre pasa | 20: `msk-07`✓ `msk-08`✓ `msk-09`✓ `msk-10`✓ `msk-r7-03`✓ `msk-r7-04`✓ `mku-20`✓ `mku-21`✓ `mku-22`✓ `mku-23`✓ `mku-24`✓ `mku-25`✓ `mku-26`✓ `mku-27`✓ … (+6) | [b02-mascaras.html](../../examples/v2/b02-mascaras.html) |
| `§3-e` | Mientras se teclea: inserta literales y rechaza lo que no corresponde | 2: `msk-01`✓ `mku-11`✓ | [b02-mascaras.html](../../examples/v2/b02-mascaras.html) |
| `§3-f` | MaskInvalid {row, field, value, reason, cancel} y motivos | 6: `msk-05`✓ `msk-06`✓ `msk-07`✓ `msk-08`✓ `mku-22`✓ `mku-25`✓ | [b02-mascaras.html](../../examples/v2/b02-mascaras.html) |
| `§3-g` | La celda muestra literales; DataArray raw o formatted | 4: `msk-02`✓ `msk-03`✓ `msk-04`✓ `cap-15`✓ | [b02-mascaras.html](../../examples/v2/b02-mascaras.html) |
| `§3-h` | calc="true" en Number: =expr con + - * / ( ) % y redondeo | 25: `r9-calc-05`✓ `msk-13`✓ `msk-15`✓ `msk-16`✓ `msk-r7-02`✓ `mku-c-=120*1.16`✓ `mku-c-50%`✓ `mku-c-200*10%`✓ `mku-c-100+10%`✓ `mku-c-1500+16%`✓ `mku-c-100-10%`✓ `mku-c-100+10%+10%`✓ `mku-c-100+10%*2`✓ `mku-c-(2+3)*4`✓ … (+11) | [b03-calc.html](../../examples/v2/b03-calc.html) [p1-captura-venta.html](../../examples/v2/p1-captura-venta.html) |
| `§3-i` | calc con error → MaskInvalid reason calc; div0 | 9: `msk-14`✓ `msk-17`✓ `mku-ce-div0:1/0`✓ `mku-ce-syntax:2*(3`✓ `mku-ce-syntax:alert(1)`✓ `mku-ce-syntax:1e5`✓ `mku-ce-empty:`✓ `mku-ce-length:1+1+1+1+1+1`✓ `mku-ce-syntax:1,5`✓ | [b03-calc.html](../../examples/v2/b03-calc.html) |
| `§3-j` | EditTable.Mask puro: apply, edit, validate, format, unformat, calc, presets | 23: `mku-01`✓ `mku-c-=120*1.16`✓ `mku-c-50%`✓ `mku-c-200*10%`✓ `mku-c-100+10%`✓ `mku-c-1500+16%`✓ `mku-c-100-10%`✓ `mku-c-100+10%+10%`✓ `mku-c-100+10%*2`✓ `mku-c-(2+3)*4`✓ `mku-c-10/4`✓ `mku-c--5+2`✓ `mku-c---5`✓ `mku-c-0.1+0.2`✓ … (+9) | — |

## Spec §4

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§4-a` | Sin multi-select todo igual que hoy | 12: `sel-01`✓ `cmb-01`✓ `cmb-02`✓ `cmb-04`✓ `cmb-10`✓ `cmb-11`✓ `cmb-12`✓ `cmb-13`✓ `cmb-30`✓ `cmb-50`✓ `cmb-53`✓ `bus-17`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) |
| `§4-b` | checkbox: th/td.et-sel-col al principio, casilla de todas con estado intermedio | 4: `sel-02`✓ `sel-03`✓ `sel-04`✓ `lim-10`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) [p5-bandeja-agentes.html](../../examples/v2/p5-bandeja-agentes.html) [p6-comprobantes-cfdi.html](../../examples/v2/p6-comprobantes-cfdi.html) |
| `§4-c` | Clic en la casilla no cambia la celda actual | 1: `sel-03`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) |
| `§4-d` | row: Ctrl+clic, Mayús+clic, Espacio | 4: `sel-05`✓ `sel-06`✓ `sel-07`✓ `sel-08`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) |
| `§4-e` | et-row-checked distinta de RowSelected | 3: `sel-03`✓ `sel-14`✓ `cmb-40`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) |
| `§4-f` | getSelectedRows, getSelectedData, SelectRows(add), UnselectRows, SelectAll, ClearSelection, IsRowSelected | 4: `sel-09`✓ `sel-13`✓ `lim-01`✓ `lim-09`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) |
| `§4-g` | SelectionChanged {selected, added, removed} | 1: `sel-10`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) |
| `§4-h` | Selección por fila de datos: sobrevive a ordenar/virtual/agrupar; se limpia con DataArray nuevo | 4: `sel-11`✓ `sel-12`✓ `lim-04`✓ `lim-06`✓ | [b04-seleccion.html](../../examples/v2/b04-seleccion.html) |
| `§4-i` | La columna del sistema no está en Columns ni en onTdPaint (R3) | 4: `gen-r3-01`✓ `gen-r3-02`✓ `sel-15`✓ `cap-14`✓ | — |
| `§4-j` | Ctrl+C copia selección o celda actual (sin editar) | 4: `clp-01`✓ `clp-02`✓ `clp-08`✓ `clp-09`✓ | [b05-portapapeles.html](../../examples/v2/b05-portapapeles.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) |
| `§4-k` | TSV con \r\n, formateado, columnas visibles en orden, títulos solo con filas completas | 6: `clp-01`✓ `clp-02`✓ `clp-03`✓ `lim-07`✓ `cmb-20`✓ `cmb-21`✓ | [b05-portapapeles.html](../../examples/v2/b05-portapapeles.html) |
| `§4-l` | copySelection(opts) y getClipboardText(opts) con {headers, raw} | 2: `clp-04`✓ `clp-05`✓ | [b05-portapapeles.html](../../examples/v2/b05-portapapeles.html) |
| `§4-m` | BeforeCopy {text, cancel} | 2: `clp-06`✓ `clp-07`✓ | [b05-portapapeles.html](../../examples/v2/b05-portapapeles.html) |

## Spec §5

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§5-a` | induxsoft.controls.excel.js aparte, independiente, el componente no lo carga | 2: `exp-08`✓ `xls-01`✓ | [b06-exportar.html](../../examples/v2/b06-exportar.html) [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) |
| `§5-src-array` | InduxsoftExcel.fromArray: infiere columnas/tipos, columns objetos o nombres, rutas con punto, value() | 7: `xls-01`✓ `xls-02`✓ `xls-03`✓ `xls-r7-arr-es-MX`✓ `xls-r7-arr-en-US`✓ `xls-r7-arr-es-CO`✓ `xls-r7-arr-de-DE`✓ | [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) |
| `§5-src-table` | InduxsoftExcel.fromTable: thead/tbody/tfoot, oculto/no-print, data-value/data-type, formato mexicano, edit-table | 8: `xls-06`✓ `xls-07`✓ `xls-08`✓ `xls-10`✓ `xls-r7-tab-es-MX`✓ `xls-r7-tab-en-US`✓ `xls-r7-tab-es-CO`✓ `xls-r7-tab-de-DE`✓ | [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) |
| `§5-merge` | fromTable conserva colspan/rowspan (celdas combinadas) | 1: `xls-07`✓ | [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) |
| `§5-src-et` | InduxsoftExcel.fromEditTable: duck typing, getExportData si existe, texto de Select/Check, números | 6: `xls-09`✓ `xls-10`✓ `xls-11`✓ `xls-r7-et`✓ `xls-17`✓ `xls-18`✓ | [b06-exportar.html](../../examples/v2/b06-exportar.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) [p6-comprobantes-cfdi.html](../../examples/v2/p6-comprobantes-cfdi.html) |
| `§5-src-data` | InduxsoftExcel.fromData({columns, rows, summary}) | 1: `xls-05`✓ | — |
| `§5-workbook` | InduxsoftExcel.workbook([{name, source, opts}]) con toBlob() y download() | 3: `xls-12`✓ `xls-13`✓ `xls-14`✓ | [b06-exportar.html](../../examples/v2/b06-exportar.html) [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) [b06c-locale-dos-tablas.html](../../examples/v2/b06c-locale-dos-tablas.html) |
| `§5-d` | InduxsoftExcel.download(fuente o Blob, nombre) | 2: `xls-14`✓ `xls-15`✓ | [b06-exportar.html](../../examples/v2/b06-exportar.html) [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) |
| `§5-csv` | InduxsoftExcel.toCSV: RFC 4180, BOM opcional, delimitador por locale | 3: `xls-16`✓ `xls-r7-csv-1`✓ `xls-r7-csv-2`✓ | [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) [b06c-locale-dos-tablas.html](../../examples/v2/b06c-locale-dos-tablas.html) |
| `§5-e` | XLSX válido: ZIP con CRC32 y SpreadsheetML mínimo | 2: `xls-13`✓ `xls-16b`✓ | — |
| `§5-f` | Números como números; fechas como fechas de Excel con formato | 2: `xls-02`✓ `xls-05`✓ | [b06b-excel-sin-edittable.html](../../examples/v2/b06b-excel-sin-edittable.html) |
| `§5-g` | Encabezado en negritas y fijado, autofiltro, anchos, totales en negritas | 5: `xls-02`✓ `xls-04`✓ `xls-05`✓ `xls-06`✓ `xls-17`✓ | [b06-exportar.html](../../examples/v2/b06-exportar.html) |
| `§5-h` | Respeta orden y visibilidad; excluye no-print/hide-on-print | 5: `exp-02`✓ `xls-08`✓ `lim-07`✓ `cmb-20`✓ `cmb-54`✓ | — |
| `§5-i` | getExportData(opts) en el componente: {selectedOnly, raw, includeHidden} | 4: `exp-01`✓ `exp-02`✓ `exp-03`✓ `exp-04`✓ | [b06-exportar.html](../../examples/v2/b06-exportar.html) |
| `§5-j` | exportCSV(opts) RFC 4180 y downloadCSV(fileName, opts) | 3: `exp-05`✓ `exp-06`✓ `exp-07`✓ | [b06-exportar.html](../../examples/v2/b06-exportar.html) |

## Spec §6

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§6-a` | fixed="left", FixColumn(field, bool), IsColumnFixed | 4: `fij-01`✓ `fij-05`✓ `fij-06`✓ `cmb-52`✓ | [b07-fijas.html](../../examples/v2/b07-fijas.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) [p1-captura-venta.html](../../examples/v2/p1-captura-venta.html) [p2-movimiento-inventario.html](../../examples/v2/p2-movimiento-inventario.html) [p6-comprobantes-cfdi.html](../../examples/v2/p6-comprobantes-cfdi.html) |
| `§6-b` | Fijas agrupadas a la izquierda; al fijar, al final del grupo | 2: `fij-01`✓ `fij-05`✓ | [b07-fijas.html](../../examples/v2/b07-fijas.html) |
| `§6-c` | sticky left = suma de anchos, fondo sólido, z-index entre cuerpo y encabezado | 10: `fij-02`✓ `fij-03`✓ `fij-04`✓ `fij-10`✓ `cmb-01`✓ `cmb-02`✓ `cmb-03`✓ `cmb-04`✓ `cmb-51`✓ `enc-05`✓ | [b07-fijas.html](../../examples/v2/b07-fijas.html) |
| `§6-d` | et-fixed-last con sombra | 1: `fij-02`✓ | [b07-fijas.html](../../examples/v2/b07-fijas.html) |
| `§6-e` | Se recalcula al cambiar ancho, ocultar o reordenar | 2: `fij-07`✓ `fij-08`✓ | [b07-fijas.html](../../examples/v2/b07-fijas.html) |
| `§6-f` | Sin tablas ni contenedores nuevos | 1: `fij-09`✓ | [b07-fijas.html](../../examples/v2/b07-fijas.html) |
| `§6-g` | ColumnFixedChanged {field, fixed} | 2: `fij-05`✓ `fij-06`✓ | [b07-fijas.html](../../examples/v2/b07-fijas.html) |

## Spec §7

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§7-a` | hideColumn se conserva; hideColumns derivado (índices de celda) | 3: `vis-01`✓ `reo-07`✓ `lim-03`✓ | [b08-selector-columnas.html](../../examples/v2/b08-selector-columnas.html) |
| `§7-b` | HideColumn, ShowColumn, IsColumnVisible, getVisibleColumns | 6: `vis-02`✓ `vis-11`✓ `cmb-10`✓ `cmb-20`✓ `cmb-52`✓ `cap-11`✓ | [b08-selector-columnas.html](../../examples/v2/b08-selector-columnas.html) |
| `§7-c` | column-chooser="true": botón et-chooser-btn y clic derecho en el th | 4: `vis-04`✓ `vis-06`✓ `vis-12`✓ `cmb-13`✓ | [b08-selector-columnas.html](../../examples/v2/b08-selector-columnas.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) [p5-bandeja-agentes.html](../../examples/v2/p5-bandeja-agentes.html) |
| `§7-d` | Menú et-chooser hermano de la tabla, posicionado | 1: `vis-05`✓ | [b08-selector-columnas.html](../../examples/v2/b08-selector-columnas.html) |
| `§7-e` | Casilla por columna; Fijar o soltar, Ajustar ancho, Restablecer diseño | 3: `vis-05`✓ `vis-07`✓ `vis-08`✓ | [b08-selector-columnas.html](../../examples/v2/b08-selector-columnas.html) |
| `§7-f` | chooser="false"; al menos una columna visible | 2: `vis-09`✓ `vis-10`✓ | [b08-selector-columnas.html](../../examples/v2/b08-selector-columnas.html) |
| `§7-g` | ColumnVisibilityChanged {field, visible} | 2: `vis-03`✓ `vis-07`✓ | [b08-selector-columnas.html](../../examples/v2/b08-selector-columnas.html) |

## Spec §8

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§8-a` | column-reorder="true"; reorder="false" bloquea | 2: `reo-04`✓ `reo-10`✓ | [b09-reordenar.html](../../examples/v2/b09-reordenar.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) |
| `§8-b` | Arrastre del th con et-drop-indicator; no se mezclan fijas y no fijas | 3: `reo-03`✓ `reo-05`✓ `cmb-11`✓ | [b09-reordenar.html](../../examples/v2/b09-reordenar.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) |
| `§8-c` | Al soltar se reordenan Columns y celdas de filas, encabezado y pie | 10: `reo-01`✓ `reo-03`✓ `reo-06`✓ `reo-07`✓ `reo-09`✓ `cmb-10`✓ `cmb-14`✓ `cmb-20`✓ `cmb-40`✓ `cmb-50`✓ | [b09-reordenar.html](../../examples/v2/b09-reordenar.html) |
| `§8-d` | BeforeColumnMove {field, from, to, cancel} y ColumnMoved | 2: `gen-r4-cancel`✓ `reo-02`✓ | [b09-reordenar.html](../../examples/v2/b09-reordenar.html) |
| `§8-e` | MoveColumn(field, toIndex) | 2: `reo-01`✓ `cap-11`✓ | [b09-reordenar.html](../../examples/v2/b09-reordenar.html) |
| `§8-f` | Teclado: Ctrl+Mayús+flechas en el encabezado | 2: `reo-08`✓ `cmb-12`✓ | [b09-reordenar.html](../../examples/v2/b09-reordenar.html) |

## Spec §9

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§9-a` | Objeto de diseño {v, columns:[{field, order, width, hidden, fixed}], sort, groups, density} | 5: `dis-01`✓ `dis-07-sort`✓ `dis-07-resize`✓ `grp-18`✓ `lim-08`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-b` | getLayout() devuelve copia | 3: `dis-01`✓ `dis-02`✓ `cmb-30`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-c` | setLayout(obj, {silent}): emparejar por field, ignorar desconocidas, nuevas al final | 4: `dis-03`✓ `dis-04`✓ `dis-06`✓ `cmb-40`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-d` | v mayor: no aplica y dispara LayoutRejected | 1: `dis-05`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-e` | ResetLayout(): vuelve a lo declarado y borra lo guardado | 4: `dis-08`✓ `dis-35`✓ `cmb-21`✓ `cmb-40`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-f` | LayoutChanged {layout, reason} con sus reasons | 8: `dis-06`✓ `dis-07-move`✓ `dis-07-visibility`✓ `dis-07-fixed`✓ `dis-07-group`✓ `dis-07-reset`✓ `dis-07-sort`✓ `dis-07-resize`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-g` | DesignAutoSave / design-auto-save (true por omisión) | 3: `gen-r5-omision`✓ `dis-20`✓ `dis-28`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) [p1-captura-venta.html](../../examples/v2/p1-captura-venta.html) [p2-movimiento-inventario.html](../../examples/v2/p2-movimiento-inventario.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) [p5-bandeja-agentes.html](../../examples/v2/p5-bandeja-agentes.html) |
| `§9-h` | IndexedDB induxsoft-edittable / layouts | 1: `dis-20`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-i` | Llave sha256(origin + pathname + "#" + id), sin query; DesignKey | 3: `dis-20`✓ `dis-23`✓ `dis-25`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-j` | Guardar 500 ms después de cambios del usuario; no los del programador | 3: `dis-20`✓ `dis-21`✓ `dis-22`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-k` | Restaurar al inicializar sin eventos de usuario | 5: `dis-23`✓ `dis-24`✓ `dis-40`✓ `enc-06`✓ `enc-07`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-l` | Errores de IndexedDB: se desactiva sin errores | 2: `dis-32`✓ `dis-33`✓ | — |
| `§9-m` | Sin id estable (o el de reserva) no hay guardado | 2: `dis-26`✓ `dis-27`✓ | — |
| `§9-n` | Se recuerda ancho/orden/visibilidad/fijación; orden de filas y grupos solo con DesignAutoSaveSort | 6: `gen-r5-omision`✓ `dis-23`✓ `dis-29`✓ `dis-30`✓ `dis-36`✓ `dis-43`✓ | — |
| `§9-o` | Huella de columnas descarta el diseño si cambian los field | 1: `dis-31`✓ | — |
| `§9-p` | ForgetLayout() y EditTable.ForgetAllLayouts() | 2: `dis-34`✓ `dis-35`✓ | [b11-diseno.html](../../examples/v2/b11-diseno.html) |
| `§9-q` | Salvaguarda 3: solo se restaura lo que el usuario puede cambiar (orden con column-reorder, visibilidad con column-chooser, si no solo anchos) | 4: `dis-40`✓ `dis-41`✓ `dis-42`✓ `dis-43`✓ | — |

## Spec §10

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§10-a` | Actualizar una fila no redibuja la tabla | 3: `ren-02`✓ `ren-03`✓ `ren-04`✓ | — |
| `§10-b` | UpdateData() no recorre todo el DOM | 1: `ren-01`✓ | — |
| `§10-c` | Sin copias JSON profundas en árbol | 1: `ren-06`✓ | — |
| `§10-d` | _printRows() y _printTreeData() dibujan todo de inmediato | 7: `ren-05`✓ `bus-23`✓ `bus-24`✓ `val-08`✓ `chg-11`✓ `cap-13`✓ `reg-10`✓ | — |
| `§10-e` | virtual-rows / VirtualRows; requiere alto uniforme; no en tarjetas | 4: `vir-01`✓ `vir-15`✓ `vir-19`✓ `vir-18`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) |
| `§10-f` | scroll-container, ancestro con overflow (cruzando el shadow) o la ventana | 3: `vir-06`✓ `vir-07`✓ `vir-08`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) |
| `§10-g` | Visibles + VirtualOverscan (10); tr.et-spacer en el mismo tbody | 9: `gen-r5-omision`✓ `vir-01`✓ `vir-02`✓ `vir-03`✓ `vir-04`✓ `vir-05`✓ `vir-11`✓ `vir-16`✓ `lim-06`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) |
| `§10-h` | Al imprimir se dibujan todas y se regresa a virtual | 2: `vir-09`✓ `lim-05`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) |
| `§10-i` | RenderAll() y RenderVisible() públicos | 1: `vir-10`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) |
| `§10-j` | Teclado/CellFocus hacia una fila no dibujada desplaza primero | 3: `vir-12`✓ `vir-13`✓ `lim-05`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) |
| `§10-k` | onTdPaint/onRowPaint solo para filas dibujadas | 1: `vir-14`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) |
| `§10-l` | Meta 5,000 filas: UpdateData < 100 ms, editar < 16 ms | 2: `ren-01`✓ `ren-02`✓ | — |
| `§10-m` | Meta 20,000 filas virtuales: primer dibujo < 150 ms, 60 fps | 2: `vir-01`✓ `vir-17`✓ | [b12-virtual-20000.html](../../examples/v2/b12-virtual-20000.html) |

## Spec §11

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§11-a` | group-panel="true": div.et-group-panel hermano de la tabla | 2: `grp-01`✓ `grp-20`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) [p4-clientes.html](../../examples/v2/p4-clientes.html) |
| `§11-b` | Arrastrar th al panel; varios niveles; chips reordenables con × | 3: `grp-06`✓ `grp-12`✓ `grp-13`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) [b13-devexpress.html](../../examples/v2/b13-devexpress.html) |
| `§11-c` | groupable="false" | 1: `grp-14`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) |
| `§11-d` | GroupBy, Ungroup, getGroups, Expand/CollapseAllGroups, Expand/CollapseGroup(path) | 5: `grp-02`✓ `grp-06`✓ `grp-07`✓ `grp-08`✓ `grp-09`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) |
| `§11-e` | tr.et-group-row con data-level/data-key, llave, conteo, subtotales, group-summary=inline, sin índice | 5: `grp-02`✓ `grp-04`✓ `grp-05`✓ `grp-10`✓ `enc-08`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) |
| `§11-f` | Flechas recorren grupos; Enter/Espacio expanden; no editables | 3: `grp-11`✓ `val-11`✓ `cap-12`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) |
| `§11-g` | Orden: campos de grupo y después el orden previo | 3: `grp-02`✓ `grp-03`✓ `grp-19`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) |
| `§11-h` | Con show-tree gana el árbol y aviso en consola | 1: `grp-16`✓ | — |
| `§11-i` | AutoAddRow: fila nueva al final, aparece en su grupo al confirmar | 1: `grp-17`✓ | — |
| `§11-j` | BeforeGroup, GroupChanged, GroupToggled | 2: `grp-08`✓ `grp-15`✓ | [b10-agrupar.html](../../examples/v2/b10-agrupar.html) |
| `§11-k` | layout.groups; autoguardado solo con DesignAutoSaveSort | 2: `dis-36`✓ `grp-18`✓ | — |

## Spec §F8a

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§F8a-bus-a` | search-bar="true": div.et-search-bar hermano (no envuelve la tabla); Ctrl+F, Enter/F3/Escape en la barra | 4: `bus-01`✓ `bus-02`✓ `bus-10`✓ `bus-26`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-b` | Search(texto, {columns, filter, highlight, accentInsensitive}); ClearSearch; varias palabras; sin acentos ni mayúsculas | 4: `bus-03`✓ `bus-04`✓ `bus-05`✓ `bus-06`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-c` | filter:false salta a la coincidencia; F3/Mayús+F3, SearchNext/SearchPrev; search-filter de la barra | 4: `bus-08`✓ `bus-09`✓ `bus-10`✓ `bus-11`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-d` | Filter(predicado \| {campo: valor \| {op, value}} \| [condiciones]); ClearFilter; se combina con Search | 2: `bus-12`✓ `bus-13`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-e` | Cuándo se evalúa: Search/Filter/RefreshFilter y DataArray nuevo; editadas y nuevas no desaparecen; árbol con ancestros | 3: `bus-19`✓ `bus-21`✓ `bus-22`✓ | — |
| `§F8a-bus-f` | El filtro nunca toca DataArray ni los índices (R2); oculta en el DOM o en la lista virtual; teclado salta ocultas | 4: `bus-03`✓ `bus-14`✓ `bus-20`✓ `bus-24`✓ | — |
| `§F8a-bus-g` | Eventos SearchChanged {text, options, rows} y FilterChanged {filter, rows} (R4) | 3: `bus-06`✓ `bus-12`✓ `bus-25`✓ | — |
| `§F8a-bus-h` | El resaltado no altera GetTdValue, UpdateData ni el editor (CSS Custom Highlight o clase) | 1: `bus-07`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-i` | Con grupos: conteos y subtotales siguen al filtro; grupos vacíos desaparecen | 1: `bus-15`✓ | — |
| `§F8a-bus-j` | summary-scope="visible" respeta el filtro; por omisión es visible si hay filtro | 1: `bus-16`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-k` | Selección: SelectAll con filtro = solo las visibles; casilla de todas sobre las visibles | 1: `bus-17`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-l` | Exportar y copiar con visibleOnly | 1: `bus-18`✓ | [b14-busqueda.html](../../examples/v2/b14-busqueda.html) |
| `§F8a-bus-m` | virtual-rows con 20,000 filas: fluida (debounce en la barra, caché de textos) | 1: `bus-23`✓ | — |
| `§F8a-bus-n` | La barra y el resaltado usan solo variables del contrato --et-* | 1: `bus-27`✓ | — |
| `§F8a-val-a` | BeforeRowLeave {index, data, toIndex, cancel, errors} al cambiar de fila (teclado, clic, NavTo, AddRow, fila de grupo) | 6: `val-01`✓ `val-02`✓ `val-03`✓ `val-04`✓ `val-11`✓ `val-12`✓ | [b15-validar-fila.html](../../examples/v2/b15-validar-fila.html) |
| `§F8a-val-b` | La edición abierta se confirma antes de BeforeRowLeave; al cancelar el foco queda en la fila | 1: `val-02`✓ | [b15-validar-fila.html](../../examples/v2/b15-validar-fila.html) |
| `§F8a-val-c` | SetCellError/ClearCellError/getErrors; et-cell-error, aria-invalid y title; sigue a la fila (orden, virtual) | 5: `val-04`✓ `val-05`✓ `val-06`✓ `val-07`✓ `val-08`✓ | [b15-validar-fila.html](../../examples/v2/b15-validar-fila.html) |
| `§F8a-val-d` | BeforeUpdateCell con e.error: sigue editando y marca; se limpia al confirmar; sin error, como hoy | 2: `val-09`✓ `val-10`✓ | [b15-validar-fila.html](../../examples/v2/b15-validar-fila.html) |
| `§F8a-val-e` | Colores del error con --et-error y --et-error-bg | 1: `val-13`✓ | [b15-validar-fila.html](../../examples/v2/b15-validar-fila.html) |
| `§F8a-chg-a` | getChanges() → {added:[{index,data}], modified:[{index,data,original}], deleted:[{data}]} | 5: `chg-01`✓ `chg-02`✓ `chg-03`✓ `chg-04`✓ `chg-11`✓ | [b16-cambios.html](../../examples/v2/b16-cambios.html) |
| `§F8a-chg-b` | modified compara contra el original (volver al valor lo quita); sigue al objeto al ordenar; UpdateData sin cambios | 3: `chg-02`✓ `chg-07`✓ `chg-09`✓ | [b16-cambios.html](../../examples/v2/b16-cambios.html) |
| `§F8a-chg-c` | deleted: DeleteRow y Ctrl+Supr; alta borrada no aparece; modificada borrada va a deleted | 2: `chg-03`✓ `chg-10`✓ | [b16-cambios.html](../../examples/v2/b16-cambios.html) |
| `§F8a-chg-d` | added: la entrada nace al editar (AddRow); InsertRow sin datos no es alta; isNew(i) | 2: `chg-04`✓ `chg-05`✓ | [b16-cambios.html](../../examples/v2/b16-cambios.html) |
| `§F8a-chg-e` | AcceptChanges(); no cambia IsDirty | 1: `chg-06`✓ | [b16-cambios.html](../../examples/v2/b16-cambios.html) |
| `§F8a-chg-f` | DataArray reasignado: objetos nuevos reinician la base; restoreRow no es alta ni baja | 2: `chg-08`✓ `chg-12`✓ | — |
| `§F8a-cap-a` | tab-order y tab-skip por columna; Tab/Mayús+Tab siguen la secuencia; getCaptureOrder() | 4: `cap-01`✓ `cap-02`✓ `cap-05`✓ `cap-06`✓ | [b17-captura.html](../../examples/v2/b17-captura.html) |
| `§F8a-cap-b` | skip-readonly="true" salta readonly, NoEditable y Badges | 1: `cap-02`✓ | [b17-captura.html](../../examples/v2/b17-captura.html) |
| `§F8a-cap-c` | Al terminar la última capturable: siguiente fila; en la última, AutoAddRow | 2: `cap-03`✓ `cap-04`✓ | [b17-captura.html](../../examples/v2/b17-captura.html) |
| `§F8a-cap-d` | enter-mode="current\|next-cell\|next-row\|down" (current = hoy) | 4: `cap-07`✓ `cap-08`✓ `cap-09`✓ `cap-10`✓ | [b17-captura.html](../../examples/v2/b17-captura.html) |
| `§F8a-cap-e` | Convive con ocultas, reordenadas, grupos, virtual, columna del sistema y máscaras | 5: `cap-11`✓ `cap-12`✓ `cap-13`✓ `cap-14`✓ `cap-15`✓ | — |
| `§F8a-reg-a` | rules (JSON) por columna o Columns[i].rules; field para comparar otro campo; RefreshRules() | 5: `reg-01`✓ `reg-05`✓ `reg-06`✓ `reg-14`✓ `reg-15`✓ | [b18-reglas.html](../../examples/v2/b18-reglas.html) |
| `§F8a-reg-b` | Operadores lt le gt ge eq ne between in contains empty notempty | 1: `reg-02`✓ | [b18-reglas.html](../../examples/v2/b18-reglas.html) |
| `§F8a-reg-c` | Números con la aritmética canónica (R9) y fechas ISO | 2: `reg-03`✓ `reg-04`✓ | — |
| `§F8a-reg-d` | style e icon sin cambiar el contenido de la celda | 1: `reg-05`✓ | [b18-reglas.html](../../examples/v2/b18-reglas.html) |
| `§F8a-reg-e` | row-rules / RowRules por fila | 1: `reg-07`✓ | [b18-reglas.html](../../examples/v2/b18-reglas.html) |
| `§F8a-reg-f` | Clases et-neg, et-strike, et-muted, et-bold, et-ok, et-warn, et-err con variables del contrato | 2: `reg-01`✓ `reg-13`✓ | [b18-reglas.html](../../examples/v2/b18-reglas.html) |
| `§F8a-reg-g` | Se reaplican al editar (solo la fila), en UpdateRow y al dibujar en virtual | 3: `reg-08`✓ `reg-09`✓ `reg-10`✓ | [b18-reglas.html](../../examples/v2/b18-reglas.html) |
| `§F8a-reg-h` | onTdPaint corre después de las reglas | 1: `reg-11`✓ | — |
| `§F8a-reg-i` | Sin eval ni Function: funciona con CSP estricta | 1: `reg-12`✓ | — |
| `§F8a-reg-j` | JSON inválido: aviso en consola, sin romper la tabla | 1: `reg-14`✓ | — |
| `§F8a-enc-a` | Tecleo rápido en el selector (lector de códigos): se acumula y se repite en el editor, sin perder caracteres | 3: `enc-01`✓ `enc-02`✓ `enc-03`✓ | [b17-captura.html](../../examples/v2/b17-captura.html) |
| `§F8a-enc-b` | CellFocus tras redibujar al confirmar (_printRows en FieldUpdated): celda equivalente, sin errores | 1: `enc-04`✓ | — |
| `§F8a-enc-c` | Columnas fijas: la celda enfocada queda a la vista y no debajo de la banda fija | 1: `enc-05`✓ | — |
| `§F8a-enc-d` | Restauración del diseño: LayoutChanged reason restore y LayoutReady / whenLayoutReady() | 2: `enc-06`✓ `enc-07`✓ | — |
| `§F8a-enc-e` | Agrupar en varios niveles y quitarlos: el ancho vuelve | 1: `enc-08`✓ | — |

## Spec §12

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§12-1` | Piloto: captura de documento de venta | **sin prueba** | [p1-captura-venta.html](../../examples/v2/p1-captura-venta.html) |
| `§12-2` | Piloto: movimiento de inventario | **sin prueba** | [p2-movimiento-inventario.html](../../examples/v2/p2-movimiento-inventario.html) |
| `§12-3` | Piloto: lista de productos de inventario | **sin prueba** | [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) |
| `§12-4` | Piloto: clientes | **sin prueba** | [p4-clientes.html](../../examples/v2/p4-clientes.html) |
| `§12-5` | Piloto: bandeja de los agentes | **sin prueba** | [p5-bandeja-agentes.html](../../examples/v2/p5-bandeja-agentes.html) |
| `§12-6` | Propuestos: comprobantes de FactuDesk, CFDI, cxc | **sin prueba** | [p6-comprobantes-cfdi.html](../../examples/v2/p6-comprobantes-cfdi.html) |

## Casos límite

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `L-sin-datos` | Sin datos | 2: `sum-25`✓ `lim-01`✓ | — |
| `L-una-fila` | Una fila | 1: `lim-02`✓ | — |
| `L-ocultas-fijas-reorden` | Columnas ocultas + fijas + reordenadas a la vez | 1: `lim-03`✓ | — |
| `L-grupo-seleccion-totales` | Agrupación + selección + totales | 1: `lim-04`✓ | — |
| `L-virtual-teclado-impresion` | Virtualización + teclado + impresión | 1: `lim-05`✓ | — |

## Spec F8b temas

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `§T-r1` | Sin theme/palette/striped/density: DOM, texto de los <style> y CSS calculado iguales a hoy | 4: `tem-02`✓ `tem-03`✓ `tem-04`✓ `tem-05`✓ | — |
| `§T-cssom` | Variables enganchadas en el CSSOM (no en el texto) con el valor actual como respaldo; también en las hojas de F2-F6 | 1: `tem-04`✓ | — |
| `§T-vars` | Contrato de variables --et-* y derivadas (fijas, grupos, pie, menú, badges, tarjetas) | 5: `tem-06-claro`✓ `tem-06-oscuro`✓ `tem-06-jade`✓ `tem-06-libro-mayor`✓ `tem-10`✓ | — |
| `§T-theme` | theme/Theme: claro, oscuro, jade, libro-mayor, auto; alias; desconocido = sin tema con aviso | 8: `tem-06-claro`✓ `tem-06-oscuro`✓ `tem-06-jade`✓ `tem-06-libro-mayor`✓ `tem-07`✓ `tem-08`✓ `tem-15`✓ `tem-22`✓ | [temas.html](../../examples/v2/temas.html) |
| `§T-precedencia` | Respaldo < tema < variables externas (:root, contenedor, host) < palette | 2: `tem-09`✓ `tem-10`✓ | [temas.html](../../examples/v2/temas.html) |
| `§T-palette` | palette (JSON) / Palette / SetPalette(obj, {merge}); valores inválidos se ignoran con aviso | 2: `tem-11`✓ `tem-12`✓ | [temas.html](../../examples/v2/temas.html) |
| `§T-caliente` | Cambio en caliente sin redibujar ni disparar eventos; quitarlo regresa el DOM | 2: `tem-13`✓ `tem-14`✓ | [temas.html](../../examples/v2/temas.html) |
| `§T-control-styles` | control-styles sigue ganando donde ganaba | 1: `tem-17`✓ | — |
| `§T-contraste` | Contraste AA de texto (4.5) y no textual (3) en los cuatro temas | 2: `tem-18`✓ `tem-19`✓ | — |
| `§T-striped` | striped: por omisión con tema; true/false lo fuerza | 1: `tem-20`✓ | [temas.html](../../examples/v2/temas.html) |
| `§T-density` | density compacta\|normal\|comoda, también sin tema | 1: `tem-21`✓ | [temas.html](../../examples/v2/temas.html) |
| `§T-numeros` | Con tema: et-num (derecha, tabular-nums, num-font) y et-neg (neg-fg) | 1: `tem-23`✓ | — |
| `§T-activa` | Con tema: contorno de la celda activa distinto del relleno de la fila | 1: `tem-24`✓ | — |
| `§T-foco` | Con tema: :focus-visible con focus-ring | 1: `tem-25`✓ | — |
| `§T-impresion` | Impresión: los temas oscuros se imprimen con la paleta clara | 1: `tem-26`✓ | — |
| `§T-partes` | Cubre fijas, pie, grupos, panel, menú, casillas, tarjetas, badges y rellenos virtuales | 2: `tem-08`✓ `tem-27`✓ | [temas.html](../../examples/v2/temas.html) |
| `§T-api` | EditTable.themes, EditTable.defineTheme(nombre, paleta, {base}), bandera 'theme' | 2: `tem-01`✓ `tem-16`✓ | — |

## Contrato actual (0ed1824)

| Renglón | Qué dice | Pruebas | Ejemplos |
|---|---|---|---|
| `A.init` | Inicialización y atributos del host | 23: `ini-01`✓ `ini-02`✓ `ini-03`✓ `ini-04`✓ `ini-05`✓ `ini-06`✓ `ini-07`✓ `ini-08`✓ `ini-09`✓ `ini-10`✓ `ini-11`✓ `ini-12`✓ `ini-13`✓ `ini-14`✓ … (+9) | [a01-basica.html](../../examples/v2/a01-basica.html) |
| `A.tipos` | Tipos de columna y formato | 22: `tip-01`✓ `tip-02`✓ `tip-03`✓ `tip-04`✓ `tip-05`✓ `tip-06`✓ `tip-07`✓ `tip-08`✓ `tip-09`✓ `tip-10`✓ `tip-11`✓ `tip-12`✓ `tip-13`✓ `tip-20`✓ … (+8) | [a02-tipos.html](../../examples/v2/a02-tipos.html) [a03-formato.html](../../examples/v2/a03-formato.html) [a04-boton-inputkey.html](../../examples/v2/a04-boton-inputkey.html) [a05-select-llave.html](../../examples/v2/a05-select-llave.html) |
| `A.edicion` | Edición de celdas | 14: `edi-01`✓ `edi-02`✓ `edi-03`✓ `edi-04`✓ `edi-05`✓ `edi-06`✓ `edi-07`✓ `edi-08`✓ `edi-09`✓ `edi-10`✓ `edi-11`✓ `edi-12`✓ `edi-13`✓ `ejm-a01-basica`✓ | [a01-basica.html](../../examples/v2/a01-basica.html) |
| `A.teclado` | Teclado y navegación | 19: `edi-20`✓ `edi-21`✓ `edi-22`✓ `edi-23`✓ `edi-24`✓ `edi-25`✓ `edi-26`✓ `edi-27`✓ `edi-28`✓ `edi-29`✓ `edi-30`✓ `edi-31`✓ `edi-32`✓ `edi-33`✓ … (+5) | [a04-boton-inputkey.html](../../examples/v2/a04-boton-inputkey.html) [a06-captura-partidas.html](../../examples/v2/a06-captura-partidas.html) |
| `A.eventos` | Eventos: orden, eventArgs, registro y cancelación | 25: `evt-01`✓ `evt-02`✓ `evt-02b`✓ `evt-03`✓ `evt-04`✓ `evt-05`✓ `evt-05b`✓ `evt-06`✓ `evt-07`✓ `evt-08`✓ `evt-09`✓ `evt-10`✓ `evt-11`✓ `evt-12`✓ … (+11) | [a06-captura-partidas.html](../../examples/v2/a06-captura-partidas.html) [a07-cancelacion.html](../../examples/v2/a07-cancelacion.html) [a08-isdirty.html](../../examples/v2/a08-isdirty.html) |
| `A.datos` | API de datos, índices, IsDirty/backup/restore | 22: `dat-01`✓ `dat-02`✓ `dat-03`✓ `dat-04`✓ `dat-05`✓ `dat-06`✓ `dat-07`✓ `dat-08`✓ `dat-09`✓ `dat-10`✓ `dat-11`✓ `dat-12`✓ `dat-13`✓ `dat-14`✓ … (+8) | [a01-basica.html](../../examples/v2/a01-basica.html) [a08-isdirty.html](../../examples/v2/a08-isdirty.html) |
| `A.orden` | Ordenación | 11: `ord-01`✓ `ord-02`✓ `ord-03`✓ `ord-04`✓ `ord-05`✓ `ord-06`✓ `ord-07`✓ `ord-08`✓ `ord-09`✓ `ord-10`✓ `ejm-a09-ordenar`✓ | [a09-ordenar.html](../../examples/v2/a09-ordenar.html) |
| `A.arbol` | Árbol | 20: `arb-01`✓ `arb-02`✓ `arb-03`✓ `arb-04`✓ `arb-05`✓ `arb-06`✓ `arb-07`✓ `arb-08`✓ `arb-09`✓ `arb-10`✓ `arb-11`✓ `arb-12`✓ `arb-13`✓ `arb-13b`✓ … (+6) | [a11-arbol-cuentas.html](../../examples/v2/a11-arbol-cuentas.html) |
| `A.tarjetas` | Tarjetas, badges y decoración | 15: `tar-01`✓ `tar-02`✓ `tar-03`✓ `tar-04`✓ `tar-05`✓ `tar-06`✓ `tar-07`✓ `tar-08`✓ `tar-09`✓ `tar-10`✓ `tar-11`✓ `tar-12`✓ `tar-13`✓ `tar-14`✓ … (+1) | [a12-tarjetas.html](../../examples/v2/a12-tarjetas.html) [p5-bandeja-agentes.html](../../examples/v2/p5-bandeja-agentes.html) |
| `A.presentacion` | Presentación: onTdPaint, plantillas, hideColumn, control-styles | 17: `pre-01`✓ `pre-02`✓ `pre-03`✓ `pre-04`✓ `pre-05`✓ `pre-06`✓ `pre-07`✓ `pre-08`✓ `pre-09`✓ `pre-10`✓ `pre-11`✓ `pre-12`✓ `pre-13`✓ `ejm-a03-formato`✓ … (+3) | [a03-formato.html](../../examples/v2/a03-formato.html) [a10-columnas.html](../../examples/v2/a10-columnas.html) [a13-ontdpaint.html](../../examples/v2/a13-ontdpaint.html) [a14-control-styles.html](../../examples/v2/a14-control-styles.html) |
| `A.impresion` | Impresión | 4: `imp-01`✓ `imp-02`✓ `imp-03`✓ `ejm-a15-impresion`✓ | [a15-impresion.html](../../examples/v2/a15-impresion.html) |
| `A.v12` | Consumidor V12 (índices tras ordenar/paginar/árbol, impresión, CSV, miembros internos) | 20: `v12-01`✓ `v12-02`✓ `v12-03`✓ `v12-04`✓ `v12-05`✓ `v12-06`✓ `v12-07`✓ `v12-08`✓ `v12-09`✓ `v12-10`✓ `v12-11`✓ `v12-12`✓ `v12-13`✓ `v12-14`✓ … (+6) | [a15-impresion.html](../../examples/v2/a15-impresion.html) [a16-v12-lista.html](../../examples/v2/a16-v12-lista.html) [p3-lista-productos.html](../../examples/v2/p3-lista-productos.html) |
| `A.factudesk` | Consumidor FactuDesk v12 | 11: `fd-01`✓ `fd-02`✓ `fd-03`✓ `fd-04`✓ `fd-05`✓ `fd-06`✓ `fd-07`✓ `fd-08`✓ `fd-09`✓ `ejm-a14-control-styles`✓ `ejm-a17-factudesk-conceptos`✓ | [a14-control-styles.html](../../examples/v2/a14-control-styles.html) [a17-factudesk-conceptos.html](../../examples/v2/a17-factudesk-conceptos.html) |
| `A.ejemplos` | Los ejemplos abren sin errores | 45: `ejm-a01-basica`✓ `ejm-a02-tipos`✓ `ejm-a03-formato`✓ `ejm-a04-boton-inputkey`✓ `ejm-a05-select-llave`✓ `ejm-a06-captura-partidas`✓ `ejm-a07-cancelacion`✓ `ejm-a08-isdirty`✓ `ejm-a09-ordenar`✓ `ejm-a10-columnas`✓ `ejm-a11-arbol-cuentas`✓ `ejm-a12-tarjetas`✓ `ejm-a13-ontdpaint`✓ `ejm-a14-control-styles`✓ … (+31) | — |
| `A.censo` | Censo de consumidores: selectores de control-styles y miembros con uso real | 117: `cen-css-tr-td`✓ `cen-css-tr-th`✓ `cen-css-th`✓ `cen-css-td`✓ `cen-css-table`✓ `cen-css-thead`✓ `cen-css-thead-tr-th`✓ `cen-css-tbody-tr`✓ `cen-css-input-type-checkbox`✓ `cen-css-table-input`✓ `cen-css-EdiTable-Row-Selected`✓ `cen-css-EdiTable-Button`✓ `cen-css-EdiTable-Cell`✓ `cen-css-EdiTable-Selector`✓ … (+103) | — |

## Censo de consumidores

*Fuente: `v12_qa/docs/edittable/uso-api.csv` y `control-styles.md` (censo del 2026-11-01). Se listan el miembro, su tipo y cuántas veces aparece; los consumidores están en el censo. Una prueba cubre la dependencia si la declara en su campo `censo` (suite `actual-censo-consumidores`) o si la nombra en su título.*

### Miembros, atributos, eventos y tipos con uso real

| Dependencia | Tipo | Usos | Pruebas |
|---|---|---|---|
| `id` | atributo edit-table (HTML) | 164 | `ini-01`✓ `ini-02`✓ `arb-02`✓ `v12-07`✓ `v12-11`✓ `cen-css-div-has-overflow`✓ … (+17) |
| `data` | atributo edit-table | 145 | `ini-03`✓ `ini-04`✓ `dat-18`✓ `tar-01`✓ `tar-13`✓ `cen-css-tr-td-data-cell-Importe`✓ … (+10) |
| `style` | atributo edit-table (HTML) | 94 | `ini-10`✓ `ini-13`✓ `ini-18`✓ `cen-api-atributos-HTML-del-host-id-style-class`✓ `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ `cen-api-tr-cells-td-style-tr-onclick-acceso-DOM-en-el-consumidor`✓ … (+4) |
| `control-styles` | atributo edit-table | 91 | `ini-13`✓ `pre-12`✓ `v12-11`✓ `fd-01`✓ `ejm-a14-control-styles`✓ `cen-css-tr-td`✓ … (+34) |
| `auto-confirm` | atributo edit-table | 82 | `cen-api-auto-confirm-row-height-cards-responsive-editable-responsive`✓ |
| `row-height` | atributo edit-table | 49 | `ini-16`✓ `cen-api-auto-confirm-row-height-cards-responsive-editable-responsive`✓ |
| `hidde-selector` | atributo edit-table | 44 | `ini-14`✓ `v12-13`✓ `cor-C8a`✓ `cor-C8d`✓ |
| `class` | atributo edit-table (HTML) | 39 | `tar-12`✓ `v12-09`✓ `cen-api-atributos-HTML-del-host-id-style-class`✓ |
| `cards-responsive` | atributo edit-table | 25 | `tar-01`✓ `tar-02`✓ `v12-13`✓ `cen-api-auto-confirm-row-height-cards-responsive-editable-responsive`✓ |
| `show-tree` | atributo edit-table | 11 | `cen-attr-arbol`✓ |
| `parentkey` | atributo edit-table | 11 | `cen-attr-arbol`✓ |
| `key` | atributo edit-table | 11 | `cen-attr-arbol`✓ |
| `can-move-row` | atributo edit-table | 5 | `cen-attr-arbol`✓ |
| `hide-row-selector` | atributo edit-table | 4 | `ini-15`✓ `fd-09`✓ `cor-C8a`✓ `cor-C8c`✓ |
| `field` | atributo edit-table | 4 | `ord-07`✓ `arb-18`✓ `tar-08`✓ `tar-12`✓ `pre-01`✓ `pre-02`✓ … (+24) |
| `readonly` | atributo edit-table | 3 | `cen-api-readonly-atributo`✓ |
| `editable-responsive` | atributo edit-table | 2 | `tar-03`✓ `cen-api-auto-confirm-row-height-cards-responsive-editable-responsive`✓ |
| `html-encode` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `template-encode` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `cards-mode` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `cards-breakpoint` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `cards-breakpoint-target` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `cards-layout` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `cards-field-gap` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `cards-gap` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `cards-hide-empty` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `badge-tooltip` | atributo edit-table | 2 | `cen-attr-tarjetas-agent`✓ |
| `sortable` | atributo edit-table | 1 | `cen-api-sortable-atributo-que-no-existe-se-ignora`✓ |
| `type` | atributo edit-th | 1036 | `ini-07`✓ `tip-01`✓ `tip-02`✓ `tip-04`✓ `tip-05`✓ `tip-12`✓ … (+10) |
| `field` | atributo edit-th | 1035 | `ord-07`✓ `arb-18`✓ `tar-08`✓ `tar-12`✓ `pre-01`✓ `pre-02`✓ … (+24) |
| `textalign` | atributo edit-th | 390 | `tip-23`✓ `tem-23`✓ |
| `format` | atributo edit-th | 271 | `cen-attr-formato`✓ |
| `decs` | atributo edit-th | 267 | `cen-attr-formato`✓ |
| `thousandssep` | atributo edit-th | 231 | `cen-attr-formato`✓ |
| `prefix` | atributo edit-th | 119 | `cen-attr-formato`✓ |
| `default` | atributo edit-th | 99 | `dat-05`✓ |
| `width` | atributo edit-th | 83 | `ini-10`✓ `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ `exp-01`✓ `dis-01`✓ `dis-07-resize`✓ |
| `button` | atributo edit-th | 67 | `cen-css-EdiTable-Button`✓ |
| `options` | atributo edit-th | 61 | `ini-08`✓ `tip-03`✓ |
| `minwidth` | atributo edit-th | 46 | `ini-10`✓ |
| `keyfield` | atributo edit-th | 28 | `cen-attr-keyfield`✓ |
| `style` | atributo edit-th | 27 | `ini-10`✓ `ini-13`✓ `ini-18`✓ `cen-api-atributos-HTML-del-host-id-style-class`✓ `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ `cen-api-tr-cells-td-style-tr-onclick-acceso-DOM-en-el-consumidor`✓ … (+4) |
| `maxlength` | atributo edit-th | 25 | `tip-01`✓ `edi-13`✓ |
| `template` | atributo edit-th | 17 | `pre-04`✓ `pre-05`✓ `cen-attr-tarjetas-agent`✓ |
| `sufix` | atributo edit-th | 14 | `cen-attr-formato`✓ |
| `readonly` | atributo edit-th | 14 | `cen-api-readonly-atributo`✓ |
| `card` | atributo edit-th | 14 | `cen-attr-tarjetas-agent`✓ |
| `cardslot` | atributo edit-th | 14 | `cen-attr-tarjetas-agent`✓ |
| `maxwidth` | atributo edit-th | 10 | `ini-10`✓ |
| `class` | atributo edit-th | 10 | `tar-12`✓ `v12-09`✓ `cen-api-atributos-HTML-del-host-id-style-class`✓ |
| `title` | atributo edit-th | 8 | `ini-07`✓ `pre-11`✓ `v12-09`✓ `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ `exp-01`✓ `xls-03`✓ … (+1) |
| `align` | atributo edit-th | 5 | `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ |
| `href` | atributo edit-th | 5 | `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ |
| `cardlabel` | atributo edit-th | 4 | `cen-attr-tarjetas-agent`✓ |
| `min-width` | atributo edit-th | 2 | `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ |
| `badgegroup` | atributo edit-th | 2 | `cen-attr-tarjetas-agent`✓ |
| `allow` | atributo edit-th | 1 | `cen-api-atributos-libres-de-edit-th-title-align-href-min-width-allow-style`✓ |
| `DataArray` | propiedad | 808 | `cen-api-DataArray`✓ |
| `CurrentRowIndex` | método | 329 | `cen-api-CurrentRowIndex`✓ |
| `Events` | propiedad | 272 | `cen-api-Events`✓ |
| `EdiTable` | propiedad | 146 | `cen-api-EdiTable`✓ |
| `Columns` | propiedad | 110 | `cen-api-Columns`✓ |
| `_printRows` | interno método | 101 | `cen-api-_printRows`✓ |
| `UpdateRow` | método | 93 | `cen-api-UpdateRow`✓ |
| `AddRow` | método | 76 | `cen-api-AddRow`✓ |
| `RowIndexOfTd` | método | 59 | `cen-api-RowIndexOfTd`✓ |
| `DeleteCurrentRow` | método | 52 | `cen-api-DeleteCurrentRow`✓ |
| `AutoAddRow` | propiedad | 48 | `cen-api-AutoAddRow`✓ |
| `setInputKey` | método | 45 | `cen-api-setInputKey`✓ |
| `DeleteRow` | método | 44 | `cen-api-DeleteRow`✓ |
| `AutoDelRow` | propiedad | 43 | `cen-api-AutoDelRow`✓ |
| `NavTo` | método | 35 | `cen-api-NavTo`✓ |
| `GetTrByIndex` | método | 19 | `cen-api-GetTrByIndex`✓ |
| `EverMove` | propiedad | 19 | `cen-api-EverMove`✓ |
| `CellFocus` | método | 18 | `cen-api-CellFocus`✓ |
| `EnterCell` | método | 18 | `cen-api-EnterCell`✓ |
| `changeColumnTitle` | método | 16 | `cen-api-changeColumnTitle`✓ |
| `GetColumnDefOfTd` | método | 14 | `cen-api-GetColumnDefOfTd`✓ |
| `hideColumn` | método | 13 | `cen-api-hideColumn`✓ |
| `onTdPaint` | callback | 12 | `cen-api-onTdPaint`✓ |
| `_getTreeOptions` | interno método | 12 | `cen-api-_getTreeOptions`✓ |
| `_printTreeData` | interno método | 11 | `cen-api-_printTreeData`✓ |
| `CurrentColIndex` | método | 10 | `cen-api-CurrentColIndex`✓ |
| `hiddeSelector` | propiedad | 10 | `cen-api-hiddeSelector`✓ |
| `_format` | interno método | 9 | `cen-api-_format`✓ |
| `UpdateData` | método | 8 | `cen-api-UpdateData`✓ |
| `ButtonOnClick` | callback | 8 | `cen-api-ButtonOnClick`✓ |
| `ColIndexOfTd` | método | 8 | `cen-api-ColIndexOfTd`✓ |
| `OnSort` | callback | 8 | `cen-api-OnSort`✓ |
| `IsDirty` | método | 7 | `cen-api-IsDirty`✓ |
| `_expandOnStart` | interno propiedad | 7 | `cen-api-_expandOnStart`✓ |
| `getIsDirty` | método | 6 | `cen-api-getIsDirty`✓ |
| `InsertRow` | método | 5 | `cen-api-InsertRow`✓ |
| `ReadOnly` | propiedad | 5 | `cen-api-ReadOnly`✓ |
| `_table` | interno propiedad | 5 | `cen-api-_table`✓ |
| `_shadow` | interno propiedad | 4 | `cen-css-div-has-overflow`✓ `cen-api-_shadow`✓ |
| `TRCount` | método | 4 | `cen-api-TRCount`✓ |
| `setIsDirty` | método | 4 | `cen-api-setIsDirty`✓ |
| `Editing` | propiedad | 3 | `cen-api-Editing`✓ |
| `_resolveKey` | interno método | 3 | `cen-api-_resolveKey`✓ |
| `_moveData` | interno método | 3 | `cen-api-_moveData`✓ |
| `GetTree` | método | 3 | `cen-api-GetTree`✓ |
| `SetTree` | método | 3 | `cen-api-SetTree`✓ |
| `CurrentTd` | método | 3 | `cen-api-CurrentTd`✓ |
| `GetTBody` | método | 3 | `cen-api-GetTBody`✓ |
| `ExpandRow` | método | 3 | `cen-api-ExpandRow`✓ |
| `ShowAsTree` | propiedad | 3 | `cen-api-ShowAsTree`✓ |
| `LeaveCell` | método | 2 | `cen-api-LeaveCell`✓ |
| `_getRowIndex` | interno método | 2 | `cen-api-_getRowIndex`✓ |
| `restoreRow` | método | 2 | `cen-api-restoreRow`✓ |
| `StartEdit` | método | 1 | `cen-api-StartEdit`✓ |
| `GetColumnDef` | método | 1 | `cen-api-GetColumnDef`✓ |
| `_getCurrentRow` | interno método | 1 | `cen-api-_getCurrentRow`✓ |
| `_count_isdirty` | interno propiedad | 1 | `cen-api-_count_isdirty`✓ |
| `RowIndent` | callback | 1 | `cen-api-RowIndent`✓ |
| `TreeArray` | método | 1 | `cen-api-TreeArray`✓ |
| `_refreshTable` | interno método | 1 | `cen-api-_refreshTable`✓ |
| `applyTemplate` | método | 1 | `cen-api-applyTemplate`✓ |
| `TrOfTd` | método | 1 | `cen-api-TrOfTd`✓ |
| `_fireBlur` | interno propiedad | 1 | `cen-api-_fireBlur`✓ |
| `UpdateDataMember` | método | 1 | `cen-api-UpdateDataMember`✓ |
| `_dataArrayBackup` | interno propiedad | 1 | `cen-api-_dataArrayBackup`✓ |
| `RowBadges` | callback | 1 | `cen-api-RowBadges`✓ |
| `RefreshBadges` | método | 1 | `cen-api-RefreshBadges`✓ |
| `ConfirmEdition` | evento (Events[Const.Events.X]) | 24 | `evt-04`✓ `evt-08`✓ |
| `BeforeUpdateCell` | evento (Events[Const.Events.X]) | 20 | `evt-04`✓ `evt-07`✓ `val-09`✓ `val-10`✓ |
| `FieldUpdated` | evento (Events[Const.Events.X]) | 18 | `evt-04`✓ `evt-05`✓ `evt-05b`✓ `evt-19`✓ `dat-05`✓ `fd-03`✓ … (+6) |
| `EnterCell` | evento (Events[Const.Events.X]) | 18 | `cen-api-EnterCell`✓ |
| `RowChanged` | evento (Events[Const.Events.X]) | 17 | `evt-01`✓ `evt-02`✓ `evt-03`✓ `cen-api-addEventListener-fieldupdated-rowchanged`✓ |
| `StartEdition` | evento (Events[Const.Events.X]) | 9 | `tip-09`✓ `evt-04`✓ |
| `RowAdded` | evento (Events[Const.Events.X]) | 8 | `edi-26`✓ `evt-12`✓ |
| `OnSort` | evento (Events[Const.Events.X]) | 8 | `cen-api-OnSort`✓ |
| `RowDeleted` | evento (Events[Const.Events.X]) | 7 | `evt-11`✓ |
| `IsDirtyChanged` | evento (Events[Const.Events.X]) | 5 | `evt-13`✓ `cor-C4b`✓ `c17-txt`✓ |
| `LostFocus` | evento (Events[Const.Events.X]) | 5 | `evt-18`✓ |
| `BeforeCellFocus` | evento (Events[Const.Events.X]) | 5 | `evt-01`✓ `evt-02`✓ `evt-09`✓ `cor-C1a`✓ `cor-C1b`✓ |
| `RowMoved` | evento (Events[Const.Events.X]) | 3 | `arb-10`✓ |
| `LeaveCell` | evento (Events[Const.Events.X]) | 2 | `cen-api-LeaveCell`✓ |
| `BeforeMoveRow` | evento (Events[Const.Events.X]) | 2 | `arb-10`✓ `arb-11`✓ |
| `fieldupdated` | evento DOM (addEventListener) | 1 | `evt-04`✓ `evt-05`✓ `evt-05b`✓ `evt-19`✓ `dat-05`✓ `fd-03`✓ … (+6) |
| `rowchanged` | evento DOM (addEventListener) | 1 | `evt-01`✓ `evt-02`✓ `evt-03`✓ `cen-api-addEventListener-fieldupdated-rowchanged`✓ |
| `Events` | constante EdiTable.Const | 57 | `cen-api-Events`✓ |
| `Events.FieldUpdated` | constante EdiTable.Const | 7 | `evt-04`✓ `evt-05`✓ `evt-05b`✓ `evt-19`✓ `dat-05`✓ `fd-03`✓ … (+6) |
| `Events.OnSort` | constante EdiTable.Const | 7 | `evt-14`✓ `ord-08`✓ `ord-09`✓ `v12-10`✓ `cen-api-OnSort`✓ |
| `Columns.Types` | constante EdiTable.Const | 5 | `ini-21`✓ `cen-api-Const-Columns-Types`✓ |
| `Events.IsDirtyChanged` | constante EdiTable.Const | 3 | `evt-13`✓ `cor-C4b`✓ `c17-txt`✓ |
| `Events.BeforeCellFocus` | constante EdiTable.Const | 3 | `evt-01`✓ `evt-02`✓ `evt-09`✓ `cor-C1a`✓ `cor-C1b`✓ |
| `Events.EnterCell` | constante EdiTable.Const | 3 | `evt-01`✓ `evt-02`✓ `cen-api-EnterCell`✓ |
| `Events.ConfirmEdition` | constante EdiTable.Const | 3 | `evt-04`✓ `evt-08`✓ |
| `Events.LeaveCell` | constante EdiTable.Const | 1 | `evt-02`✓ `evt-02b`✓ `cen-api-LeaveCell`✓ |
| `Events.BeforeMoveRow` | constante EdiTable.Const | 1 | `arb-10`✓ `arb-11`✓ |
| `NoEditable` | tipo de columna (edit-th type) | 618 | `tip-10`✓ `tar-01`✓ `v12-13`✓ `fd-07`✓ `cap-02`✓ |
| `Number` | tipo de columna (edit-th type) | 152 | `tip-02`✓ `ord-04`✓ `cen-css-Editable-Input-Number`✓ `num-C12a`✓ `num-C12b`✓ `num-C12c`✓ … (+13) |
| `Text` | tipo de columna (edit-th type) | 134 | `tip-01`✓ `tip-12`✓ `evt-06`✓ `cen-css-Editable-Input-Text`✓ `num-C12c`✓ `c17-txt`✓ … (+3) |
| `Select` | tipo de columna (edit-th type) | 63 | `tip-03`✓ `tip-13`✓ `ejm-a05-select-llave`✓ `cen-css-Editable-Input-Select`✓ `cen-attr-keyfield`✓ `gen-r5-multi-select`✓ … (+8) |
| `Check` | tipo de columna (edit-th type) | 25 | `tip-06`✓ `xls-09`✓ |
| `Memo` | tipo de columna (edit-th type) | 20 | `tip-08`✓ `edi-33`✓ `fd-08`✓ `cen-css-Editable-Input-Memo`✓ |
| `Date` | tipo de columna (edit-th type) | 8 | `tip-04`✓ `cen-css-Editable-Input-Date`✓ `c17-Date-2026-02-01 10:30:00`✓ `c17-Date-01/02/2026`✓ `c17-Date-2026-02-01T00:00:00.000Z`✓ `c17-C18-date-espacio`✓ … (+5) |
| `Badges` | tipo de columna (edit-th type) | 4 | `tip-11`✓ `tar-07`✓ `tar-08`✓ `r1-04`✓ `tem-07`✓ `tem-18`✓ |
| `DateTime` | tipo de columna (edit-th type) | 2 | `tip-05`✓ `cen-css-Editable-Input-DateTime`✓ `c17-DateTime-2026-02-01 10:30:00`✓ `c17-DateTime-2026-02-01T10:30:15`✓ `c17-C18-dt-espacio`✓ `c17-C18-dt-Z`✓ … (+2) |
| `Custom` | tipo de columna (edit-th type) | 1 | `tip-09`✓ `tar-04`✓ `sum-07`✓ |

Cubiertas: **161 de 161**. Los accesos DOM del consumidor (`td.style`, `tr.cells`…) se cubren con `cen-api-tr-cells-td-style-tr-onclick-acceso-DOM-en-el-consumidor` y con las pruebas de V12 y FactuDesk.

### Selectores de control-styles

| Selector | Pruebas |
|---|---|
| `tr td` | `cen-css-tr-td`✓ |
| `tr th` | `cen-css-tr-th`✓ |
| `th` | `cen-css-th`✓ |
| `tbody tr:hover` | `cen-css-tbody-tr`✓ |
| `table` | `cen-css-table`✓ |
| `td` | `cen-css-td`✓ |
| `input[type='checkbox']` | `cen-css-input-type-checkbox`✓ |
| `thead` | `cen-css-thead`✓ |
| `thead tr th` | `cen-css-thead-tr-th`✓ |
| `#__table_input` | `cen-css-table-input`✓ |
| `.EdiTable-Row-Selected` | `cen-css-EdiTable-Row-Selected`✓ |
| `.EdiTable-Button` | `cen-css-EdiTable-Button`✓ |
| `.EdiTable-Cell` | `cen-css-EdiTable-Cell`✓ |
| `.EdiTable-Selector` | `cen-css-EdiTable-Selector`✓ |
| `.EdiTable-Selector:focus` | `cen-css-EdiTable-Selector-focus`✓ |
| `.Editable-Input-Date` | `cen-css-Editable-Input-Date`✓ |
| `.Editable-Input-DateTime` | `cen-css-Editable-Input-DateTime`✓ |
| `.Editable-Input-Memo` | `cen-css-Editable-Input-Memo`✓ |
| `.Editable-Input-Number` | `cen-css-Editable-Input-Number`✓ |
| `.Editable-Input-Select` | `cen-css-Editable-Input-Select`✓ |
| `.Editable-Input-Text` | `cen-css-Editable-Input-Text`✓ |
| `th.ascendent::after` | `cen-css-th-ascendent`✓ |
| `th.descendent::after` | `cen-css-th-descendent`✓ |
| `div:first-of-type` | `cen-css-div-first-of-type`✓ |
| `tr th:nth-child(10)` | `cen-css-tr-th-nth-child-10`✓ |
| `tr th:nth-child(9)` | `cen-css-tr-th-nth-child-9`✓ |
| `tr td[data-cell='Importe']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Impuestos']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Origen']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Subtotal']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Importe"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `\"tr td[data-cell='Precio']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="% Representación"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Costo"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Cotizado']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Código']` | `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Descripción']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Faltante']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Requerido']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Unidad']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Caducidad"]` | `cen-css-tr-td-data-cell-Caducidad`✓ |
| `tr td[data-cell="Código"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Descripción"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Divisa"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Enviado"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Faltante/Sobrante"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="No. Lote"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="No. Serie"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell="Unidad"]` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='C. Directo']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Cant. prod. destino']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Cant. prod. origen']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Costo adicional por unidad']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Costo total']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Costo']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Entregar']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr td[data-cell='Notas']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Disponible']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Ex. Destino']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Ex. Origen']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Mínimo']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Producción']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `tr:not(.EdiTable-Row-Selected) td[data-cell='Surtido']` | `cen-css-tr-td-data-cell-Importe`✓ `cen-css-tr-td-data-cell-Caducidad`✓ `cen-css-tr-not-EdiTable-Row-Selected-td-data-cell-C-digo`✓ `cen-data-cell-titulo`✓ |
| `##<table_id>` | `cen-css-t1`✓ |
| `##<table_id> tr th` | `cen-css-t1-tr-th`✓ |
| `div:has(table##<table_id>)` | `cen-css-div-has-table-t1`✓ `cen-css-div-has-overflow`✓ |
| `div:has(table)` | `cen-css-div-has-table`✓ |
| `div:has(> ##<table_id>)` | `cen-css-div-has-t1`✓ |
| `.disabled-all * edit-table:not([readonly])` | `cen-css-host-readonly`✓ |
| `.disabled-all * edit-table` | `cen-css-host-otros`✓ |
| `.fd-edittable edit-table` | `cen-css-host-otros`✓ |

Cubiertos: **71 de 71**.
