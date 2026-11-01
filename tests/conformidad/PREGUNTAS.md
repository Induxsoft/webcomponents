# Preguntas sobre la especificación de EdiTable 2

*Huecos, ambigüedades y contradicciones que encontré al escribir la batería de conformidad (2026-11-01, spec con R7–R9, C12–C18 y la salvaguarda 3 de §9.2). No los resolví por mi cuenta: cada uno trae una propuesta y dice qué supone hoy la prueba.*

## Contradicciones

| # | Dónde | Qué pasa | Propuesta | Qué suponen las pruebas |
|---|---|---|---|---|
| P1 | §7 | La spec dice `hideColumn(idx)` "con la misma firma"; la firma real es `hideColumn(field, hide = true)` (línea 3885) y así la usan FactuDesk, compras, ventas y movinv (censo). | Corregir la spec: `hideColumn(field, hide)`. | `hideColumn(field, bool)`. |
| P2 | §3 `percent` vs R9 | §3: "en DataArray el valor sin formato siempre va con punto (`10.5`)". R9: "se conservan los decimales tecleados, incluidos los ceros finales". Si el usuario teclea `10,50`, ¿`"10.5"` o `"10.50"`? El motor de máscaras (`wc-mascaras`) devuelve `"10.50"` en `unformat`. | Seguir R9 (`"10.50"`) y corregir el ejemplo de §3. | Aceptan las dos (`/^10\.50?$/`). |
| P3 | R7 y `fromEditTable` | R7 dice que en `InduxsoftExcel` el locale se aplica a `fromTable` y `fromArray`, no a `fromEditTable`. Un `edit-table` en `lang="es-CO"` con `"1.234,5"` en una columna Number se exporta hoy como texto (la biblioteca de `wc-excel` lo deja así). | Aplicar R7 también en `fromEditTable` para columnas Number/Date con valores de texto. | `xls-r7-et` espera número (falla contra la biblioteca actual). |

## Huecos

| # | Dónde | Hueco | Propuesta |
|---|---|---|---|
| P4 | §2 `summary-scope`, §4.1 `SelectAll` | Hablan de "si hay un filtro", pero la spec no define ningún filtro. | Quitar la mención o definir la API de filtro (por ejemplo `SetFilter(fn)` y `et-filtered`). Las pruebas solo cubren el caso de agrupación. |
| P5 | §2 `summary-format` | "`inherit` o un formato": no dice la sintaxis del formato. | Un formato de número de Excel (`#,##0.00`) o los mismos atributos en JSON (`{"decs":0,"prefix":"$"}`). Sin prueba del caso explícito. |
| P6 | §2 `summary-label` | Sin `{value}`, ¿con qué separador va el valor? | `etiqueta + " " + valor`. La prueba solo exige que empiece con la etiqueta y termine con el valor. |
| P7 | §2 sin datos | `getSummary` de `sum` o `count` sin filas: ¿`0` o `null`? | `sum`/`count` → `0`; `avg`/`min`/`max` → `null`. La prueba acepta los dos. |
| P8 | §2 árbol, tarjetas y columna del sistema | ¿El total en árbol suma todo o solo hojas? ¿El pie se oculta en tarjetas? ¿La fila del pie lleva una `td.et-sel-col` vacía cuando hay `multi-select="checkbox"`? | Todo (o `summary-tree="leaves"`); ocultar el pie en tarjetas; sí, una celda vacía del sistema. |
| P9 | §3 máscara en columna Number | ¿Qué editor usa una columna `Number` con `mask` (el nativo no admite máscara)? | Editor propio de texto con `inputmode="decimal"`, como `calc` y `locale`. |
| P10 | §3 `UpdateData()` | Lee el DOM: con una máscara con literales, ¿`GetTdValue` quita los literales? | Sí, para que `DataArray` siga en `raw`. Sin prueba. |
| P11 | R6, R7, R9, C16 | `EditTable.features` no tiene una función para locale/R9 (`'locale'`). Las pruebas `r9-*`, `r7-01b/01c` y C16 no se pueden marcar "pendientes por función no disponible": salen como fallidas. | Agregar `'locale'` (y quizá `'valuetype'`) a `features`. |
| P12 | R9 `canonicalFromText` | La spec nombra `canonicalFromText` pero no dice dónde vive. El motor de `wc-mascaras` ya la expone como `EditTable.Mask.canonicalFromText(text, {locale, native})` y `unformat` ahora devuelve `{raw, canonical}` (antes una cadena). | Escribirlo en §3 y R9. Las pruebas `mku-r9-*` usan esa firma y aceptan las dos formas de `unformat`. |
| P13 | §4.2 | Valores por omisión de `headers` en `copySelection()` y `getClipboardText()`: ¿siguen la regla "títulos solo con filas completas"? | Sí: `true` con filas seleccionadas, `false` con la celda actual, salvo que se indique. Así lo suponen `clp-02` y `clp-01`. |
| P14 | §4.1 | ¿`SelectionChanged` se dispara si la selección no cambió (por ejemplo `ClearSelection()` sin nada seleccionado)? | No. |
| P15 | §6 y §8 | `MoveColumn(field, toIndex)` y `BeforeColumnMove {from, to}`: ¿índices de `Columns` contando las fijas? | Sí, índices de `Columns` (R3). Así lo suponen `reo-02` y `reo-01`. |
| P16 | §9.1 | `width` del diseño: ¿número en px o texto CSS? `order`: ¿desde 0? | `width` en px (número) o `null`; `order` desde 0. |
| P17 | §9.2 llave | ¿La llave es el sha256 en hexadecimal en minúsculas? ¿Con `DesignKey` es `sha256(origin + DesignKey)`, sin `#`? ¿Qué forma tiene el registro guardado (`{layout, huella}`)? | Hex en minúsculas; `origin + DesignKey`; `{key, layout, fingerprint, savedAt}`. Las pruebas buscan la llave en `getAllKeys` y aceptan `value.layout ?? value`. |
| P18 | §9.2 restauración | "Sin disparar eventos de usuario": ¿la restauración dispara `LayoutChanged` con otro `reason` (`'restore'`) o ninguno? | Ninguno. La prueba solo rechaza los `reason` de usuario. |
| P19 | §9.2 salvaguarda 3 | "La fijación, solo si las columnas fijas se cambian desde el menú": ¿equivale a "solo con `column-chooser`"? | Sí. Sin prueba de fijación restaurada. |
| P20 | §9.2 salvaguarda 1 | V12 genera `table_<uuid>` aleatorio cuando no recibe id: ese id no es "el de reserva", así que se guardaría basura en cada carga hasta F7. | Ignorar también los ids que empiezan con `table_` seguidos de 6 o más caracteres hexadecimales hasta que F7 dé ids estables. |
| P21 | §10 `row-height` | Hoy `row-height` es el alto CSS del contenido de la celda (por omisión `100%`). En modo virtual, ¿solo vale en px? ¿Se mide si es `100%`? | Px o medido. Las pruebas usan `row-height="28px"`. |
| P22 | §10 virtual | ¿Qué devuelven `TRCount()` y `GetTrByIndex(i)` para filas no dibujadas? | `TRCount()` = `DataArray.length`; `GetTrByIndex(i)` desplaza y dibuja la fila antes de devolverla. Sin prueba. |
| P23 | §10 metas | Las metas de tiempo dependen del equipo. | Las pruebas de rendimiento usan las metas literales (y 1.5× en fps por headless); si fallan solo por el equipo, se marcan como pendientes en el laboratorio. |
| P24 | §11 | ¿Cómo se representa el foco en una fila de grupo (¿selector dentro de la celda del grupo?) y qué devuelve `CurrentRowIndex()` ahí? | Selector en la celda del grupo con `tabindex`; `CurrentRowIndex()` = `-1`. La prueba solo exige que el elemento activo esté dentro de `tr.et-group-row`. |
| P25 | §11 | `group-summary="inline"` ¿es atributo de `edit-table`? ¿Cómo se ve `data-key` de un valor vacío o numérico? | Sí, de la tabla; `data-key` = `String(valor)`, vacío = `""` con texto "(vacío)". |
| P26 | §11 | Ordenar con clic estando agrupado: ¿ordena dentro de cada grupo? | Sí (lo supone `grp-19`). |
| P27 | C5 | Solo habla de `readonly` en la columna. ¿También `readonly="false"` en el host? | Sí, la misma lectura booleana (lo supone `cor-C5e`). |
| P28 | C8 | "Atributos de §2 a §9" deja fuera `virtual-rows` (§10) y `group-panel` (§11). | Incluirlos. La prueba solo exige los de §2-§9 y los tres nombrados. |
| P29 | C16 y R8 | Una página con `<html lang="es-CO">` o `es-ES` que hoy muestra `1,234.50` pasaría a mostrar `1.234,50` sin que el programador lo pida, porque el `lang` del documento con región cuenta. Con `es-MX` no cambia nada. | Confirmar que es lo deseado; si no, que C16 solo cuente el `lang` de la tabla o de un ancestro dentro del `body`. |
| P30 | C17 | ¿Cómo se decide "no modificó el editor" en Check y Select (marcar y desmarcar)? | Comparar el valor del editor al confirmar con el que tenía al abrirse. |
| P31 | Excel `fromEditTable` | Columna Check: ¿se exporta el texto visible (`Sí`) o un booleano? | Texto visible (dice la spec); la prueba acepta los dos. |
| P32 | Excel `toCSV` | ¿Lleva salto de línea al final? (RFC 4180 lo permite). | Sin salto final, para que `split('\r\n')` no deje una fila vacía. La prueba acepta los dos. |

## Comportamientos actuales que la spec no menciona

Están como **defecto conocido** en las suites "actual" (no cuentan como falla) o como caracterización. Hay que decidir si se corrigen (con R8 en mente):

| # | Comportamiento (0ed1824) | Prueba |
|---|---|---|
| P33 | `LeaveCell` recibe `td = null`: el selector ya se quitó del DOM cuando se dispara (líneas 2045-2049). | `evt-02b` (defecto conocido) |
| P34 | `changeColumnTitle` no actualiza `Columns[i].title` (la exportación CSV de V12 sale con el título viejo). | `pre-11` (defecto conocido) |
| P35 | `SortTree` no ordena a los nietos cuando un nivel tiene un solo hijo (ordena dentro del comparador). | `arb-13b` (defecto conocido) |
| P36 | Las clases `ascendent`/`descendent` están invertidas (el primer clic ordena ascendente y pone `descendent`). R1 obliga a conservarlas; FactuDesk tiene `th.ascendent::after`. | `ord-03` (se conserva) |
| P37 | El clic en una celda nunca llega a `tr.onclick` del consumidor (`td.onclick` hace `stopPropagation`). El censo encontró `tr.onclick` en consumidores: conviene revisar si es sobre filas de `edit-table`. | `cen-api-tr-cells-…` (se conserva) |
| P38 | El atributo `sortable` que usa agent.induxsoft.net (`tables/index.dkl`) no existe: se ignora y la tabla sí ordena. | `cen-api-sortable-…` |
| P39 | C14 quedó descartada (comportamiento del navegador): no hay pruebas. | — |
