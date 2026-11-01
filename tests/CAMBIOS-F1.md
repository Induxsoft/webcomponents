# Cambios de F1 en el banco de regresión

*F1 de EdiTable 2 (rama `f1-reestructura`, base `882c9c8`). Componente: `src/js/induxsoft.controls.editable.js`, `EditTable.version = "2.0.0-f1"`.*

F1 tiene dos partes:

- **A. Reestructura interna sin cambios visibles:** mapa `tr → índice` con `WeakMap`, consultas acotadas a `thead`/`tbody`, estado de columnas por `field` y celda de dibujo encapsulada.
- **B. Correcciones que se activan siempre:** C1–C11, C13, C15, C17 y C18 (D1 y §1.1 de la spec), y C19–C21 (decisión de Emmanuel del 2026-11-01, §13). Además, la opción `click-propagation` (P37), apagada por omisión.

C12 y C16 no van en F1. C14 está descartada.

## Cómo se comprobó que cada diferencia es la corrección y nada más

1. **Solo la parte A** (todas las correcciones revertidas en una copia en `/tmp`): 229 de 229 escenarios iguales a la referencia de `0ed1824`. La única diferencia es `defectos/attributechangecallback`, paso 3, que lee `observedAttributes` y la existencia de `attributeChangedCallback` (C8).
2. **A más una sola corrección** (18 copias, una por corrección): cada una cambia solo los escenarios de la tabla de abajo.
3. **Comprobaciones automáticas:**
   - C19: en los 71 escenarios que cambian solo por C19, igualar `LeaveCell.args.td` a `null` deja la foto idéntica a la referencia.
   - C13: en los 13 escenarios que cambian solo por C13, quitar `step="any"` deja la foto idéntica a la referencia.
4. **Versión completa:** las 89 diferencias tienen causa asignada. Cada escenario coincide con la copia de su corrección, igualando el `td` de `LeaveCell` cuando además interviene C19. La excepción es `defectos/navtoend`: con C6 la tabla ahora sí se mueve, y por eso aparece también el `LeaveCell` con `td` (C19).
5. **Actualización de la referencia:** escenario por escenario, con `node tests/run.mjs --update --filtro <id>`. Después se restauró `golden/meta.json`, que sigue describiendo la referencia de `0ed1824`. Los escenarios ambiguos por el filtro (`basicos/demo-edittable-old`, `datos/updatedatamember` y `teclado/ctrl-suprimir-sin-autodelrow`) no cambiaron.
6. **Dos corridas seguidas** con los escenarios de FactuDesk y de agent: 240 iguales (6 con diferencias solo informativas), sin diferencias estrictas (después de las correcciones de la revisión, ver al final).

**Escenarios externos (FactuDesk y agent).** Su referencia vive en los repos privados `factudesk.v12.induxsoft.net_qa` y `agent.induxsoft.net_qa`, y **no se modificó**. Las referencias nuevas de esos 8 escenarios se generaron en copias de `/tmp/f1-extra/`. Al integrar F1, hay que actualizarlos en sus repos, uno por uno, con el mismo comando y `--escenarios-extra`.

## Antes y después por corrección

| Corrección | Antes (`0ed1824`) | Después (F1) | Escenarios |
|---|---|---|---|
| C1 | Cada `InsertRow` agregaba otro listener de clic a todas las celdas, con `e.target`, que podía ser el `div` interno. Después de 3 inserciones, un clic disparaba `BeforeCellFocus` 4 veces. | Las celdas nuevas reciben el mismo `td.onclick` de `Initialize`: un clic dispara un solo `BeforeCellFocus`, `LeaveCell` y `EnterCell`, siempre con el `td`. | `defectos/listener-clic-duplicado`, `datos/updaterow`, `eventos/por-addeventlistener`, `eventos/por-events`, `eventos/secuencia-completa`, `factudesk/retenciones` |
| C2 | Ctrl+C, Ctrl+V y Ctrl+A (y cualquier Ctrl o Meta con una letra) empezaban a editar con esa letra. | No abren el editor. Ctrl/Meta + C, V, X y A no se cancelan: conservan su comportamiento nativo. En agent `tables/`, Ctrl+V dispara el `paste` del documento, que su página atiende con `table.pegar()`, y pega la cuadrícula. Las demás combinaciones siguen canceladas, como hoy. AltGr (Ctrl+Alt) sigue escribiendo. | `defectos/ctrl-c-edita`, `agent/tablas` |
| C3 | `afterprint` volvía a mostrar una columna `no-print` que el usuario había ocultado. | Cada columna vuelve al estado que tenía antes de `beforeprint`. | `defectos/afterprint-muestra-ocultas` |
| C4 | Después de `restore()` o `restoreRow()`, `IsDirty` seguía en `true`. | `IsDirty=false` e `IsDirtyChanged` una vez, solo si el valor cambió. | `defectos/isdirty-tras-restore`, `datos/backup-restore` |
| C5 | `readonly="false"` dejaba la columna de solo lectura. | `"false"`, `"0"` y `"no"` significan editable, en la columna y en el host. | `defectos/readonly-false` |
| C6 | `NavToEnd()` y Ctrl+Fin no hacían nada. | Van a la última fila, en la columna actual. | `defectos/navtoend` |
| C7 | La propiedad `sorTable=false` no tenía efecto. | Lee y escribe `_sorTable`: `false` desactiva ordenar con clic. | `defectos/sortable-propiedad` |
| C8 | `observedAttributes` daba `undefined` y el callback tenía mal el nombre. | Se observan `show-tree`, `hidde-selector`, `hide-row-selector` y, sin efecto todavía, los de §2–§9 más `virtual-rows` y `group-panel` (P28). | `defectos/attributechangecallback` |
| C9 | Un `edit-table` creado después de `DOMContentLoaded` no se inicializaba. | Se inicializa al conectarse. Mientras la página carga, el orden de hoy se conserva. | `defectos/creada-despues` |
| C10 | `Sort` reordenaba `DataArray` pero no el respaldo de `IsDirty`. | El respaldo se reordena con la misma permutación. | `defectos/isdirty-tras-ordenar` |
| C11 | Al sacar la tabla quedaban activos los listeners de `window` y `document`, el `setInterval` y los observadores. | Se liberan al desconectar y se vuelven a crear al reconectar. | Ninguno estricto (solo `internos`, informativa). Se cubre en la conformidad, C11a–d. |
| C13 | El `<input type="number">` no tenía `step`, así que un decimal lo dejaba `:invalid`. | Lleva `step="any"`. Es el único cambio en el DOM. | 13 escenarios (tabla de abajo) y `defectos/c13-number-step-any` (nuevo) |
| C15 | Con `badInput` (por ejemplo `1-2`) en Number se guardaba `""`. | Solo en `input[type="number"]`: no confirma. Si el confirmar lo inició el usuario (Enter, Tab, clic en otra celda), la celda sigue en edición con el foco y se dispara `MaskInvalid` `{row, field, value, reason:'badInput', cancel:true}` una vez por valor; con `cancel=false` se guarda como hoy. Desde el intervalo de `auto-confirm`, o con el foco fuera de la tabla, no se confirma, no se avisa y no se toma el foco. Date y DateTime quedan como hoy. | `defectos/c15-number-badinput`, `defectos/c15-autoconfirm-no-roba-foco`, `defectos/c15-date-badinput-como-hoy` (nuevos) |
| C17 | Confirmar sin cambiar reescribía el valor con lo que tuviera el editor. Por ejemplo: Date `2026-02-01 10:30:00`, `01/02/2026` y `…T00:00:00.000Z` se volvían `""`; DateTime perdía los segundos; un `12.5` pasaba a `"12.5"`; con formato, `1234.5678` pasaba a `"1234.57"`; y en Select sin opción se borraba el valor. | Si el editor se abrió con el valor de la celda (Enter, F2 o clic), ni el usuario ni el consumidor lo cambiaron, y el texto sigue igual después de `BeforeUpdateCell` y `ConfirmEdition`, entonces `DataArray` no se toca, no hay `FieldUpdated` ni `IsDirtyChanged`, y la celda vuelve a mostrar lo de antes, como al cancelar. `BeforeUpdateCell` y `ConfirmEdition` se siguen disparando. | `tipos/select-sin-options`, `arbol/navegacion`, `edicion/cancelar-memo-select`, `edicion/confirmar-flechas` y los nuevos `defectos/c17-*` |
| C18 | Date y DateTime abrían vacíos si el valor no estaba en ISO estricto. | Se normaliza al abrir: espacio en lugar de `T`, sin milisegundos; en Date, la fecha tal cual (sin convertir zona); en DateTime, `Z` u offset a hora local. `01/02/2026` abre vacío y C17 lo protege. | `defectos/c18-editor-fecha` (nuevo) |
| C19 | `LeaveCell` recibía `td: null`, porque el selector ya se había quitado. | Recibe el `td` que se deja. | 71 escenarios solo por esto (con el registro `all`, cada cambio de celda dispara `LeaveCell`), más los que combinan con C1, C2, C13 y C17 |
| C20 | `changeColumnTitle` no actualizaba `Columns[i].title`, y la exportación CSV de V12 salía con el título viejo. | Lo actualiza. `data-cell` conserva el título declarado: `control-styles` de los paquetes usa `td[data-cell='<título>']`. | `datos/changecolumntitle`, `v12/exportar-csv` |
| C21 | `SortTree` no ordenaba a los descendientes de una lista de un solo elemento. | Los ordena. | `defectos/c21-sorttree-nietos` (nuevo; ningún escenario anterior lo cubría) |
| P37 (opción) | `td.onclick` detenía la propagación. | Igual por omisión. Con `click-propagation="true"` (`ClickPropagation`), el clic llega a la fila y a los ancestros después de que el componente lo procesa. El clic sobre el selector que abre el editor no vuelve a enfocar la celda. | `defectos/click-propagation-sin-atributo` (igual que `0ed1824`) y `defectos/click-propagation-true` (nuevos) |

## Escenarios cuya referencia cambió (89)

Columnas: escenario, correcciones que lo explican, pasos con diferencia, categorías estrictas que cambian y resumen.

| Escenario | Corrección | Pasos | Categorías | Diferencia |
|---|---|---|---|---|
| `agent/creditos` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `agent/tablas` | C2, C19 | 5 | eventos, dom, datos, props, estilos, luz, foco, extra | Ctrl/Meta+letra no abre el editor; Ctrl+V conserva el paste nativo; LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `arbol/editar-en-arbol` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `arbol/navegacion` | C17, C19 | 5 | eventos | confirmar sin cambiar no reescribe DataArray ni dispara FieldUpdated/IsDirtyChanged; LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `basicos/columns-default-type` | C13 | 1 | dom | el input Number lleva step="any" (único cambio en el DOM) |
| `basicos/demo-edittable` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `basicos/thead-row-index` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `basicos/varias-tablas` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `datos/addrow-insertrow` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `datos/backup-restore` | C4 | 4 | props, eventos, extra | restore()/restoreRow() dejan IsDirty=false y disparan IsDirtyChanged |
| `datos/cellfocus` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `datos/changecolumntitle` | C20 | 1 | columnas, extra | changeColumnTitle actualiza Columns[i].title (la exportación CSV sale con el título nuevo) |
| `datos/converts-personalizado` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `datos/css-personalizado` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `datos/getcolumndef` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `datos/navto` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `datos/updatedata` | C13 | 2 | dom | el input Number lleva step="any" (único cambio en el DOM) |
| `datos/updaterow` | C1, C19 | 1 | eventos | sin el listener duplicado: un clic dispara BeforeCellFocus/LeaveCell/EnterCell una vez (antes una vez más por cada InsertRow previo); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `defectos/afterprint-muestra-ocultas` | C3 | 1 | dom, props, estilos | afterprint deja oculta la columna que el usuario había ocultado |
| `defectos/attributechangecallback` | C8 | 3 | dom, props, estilos, foco, eventos, extra | observedAttributes y attributeChangedCallback existen; cambiar atributos después de cargar se aplica |
| `defectos/creada-despues` | C9 | 4 | dom, datos, columnas, props, estilos, estado, luz | edit-table creado después de DOMContentLoaded se inicializa |
| `defectos/ctrl-c-edita` | C2 | 3 | dom, props, estilos, foco, eventos | Ctrl/Meta+letra no abre el editor; Ctrl+V conserva el paste nativo |
| `defectos/isdirty-tras-ordenar` | C10 | 2 | respaldo, extra | Sort reordena también el respaldo de IsDirty |
| `defectos/isdirty-tras-restore` | C4 | 2 | props, eventos, extra | restore()/restoreRow() dejan IsDirty=false y disparan IsDirtyChanged |
| `defectos/listener-clic-duplicado` | C1 | 2 | eventos, extra | sin el listener duplicado: un clic dispara BeforeCellFocus/LeaveCell/EnterCell una vez (antes una vez más por cada InsertRow previo) |
| `defectos/navtoend` | C6 | 2 | dom, props, estilos, foco, eventos, extra | NavToEnd/Ctrl+Fin van a la última fila en la columna actual |
| `defectos/paginas-columna-oculta` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `defectos/readonly-false` | C5 | 1 | dom, props, estilos, foco, eventos | readonly="false" en la columna: editable |
| `defectos/sortable-propiedad` | C7 | 3 | props, dom, columnas, eventos, datos | sorTable=false (propiedad) desactiva ordenar con clic |
| `edicion/api-startedit-confirm-cancel` | C13 | 1 | dom | el input Number lleva step="any" (único cambio en el DOM) |
| `edicion/cancelar-memo-select` | C17, C19 | 2 | eventos | confirmar sin cambiar no reescribe DataArray ni dispara FieldUpdated/IsDirtyChanged; LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `edicion/confirmar-enter-tab` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `edicion/confirmar-flechas` | C17, C19 | 1 | eventos | confirmar sin cambiar no reescribe DataArray ni dispara FieldUpdated/IsDirtyChanged; LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `edicion/iniciar-doble-clic` | C13 | 1 | dom | el input Number lleva step="any" (único cambio en el DOM) |
| `edicion/readonly-columna` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `eventos/nativos-ignorados` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `eventos/por-addeventlistener` | C1, C19 | 3 | eventos, extra | sin el listener duplicado: un clic dispara BeforeCellFocus/LeaveCell/EnterCell una vez (antes una vez más por cada InsertRow previo); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `eventos/por-events` | C1, C19 | 3 | eventos, extra | sin el listener duplicado: un clic dispara BeforeCellFocus/LeaveCell/EnterCell una vez (antes una vez más por cada InsertRow previo); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `eventos/rowchanged-indices` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `eventos/secuencia-completa` | C1, C19 | 3 | eventos | sin el listener duplicado: un clic dispara BeforeCellFocus/LeaveCell/EnterCell una vez (antes una vez más por cada InsertRow previo); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `factudesk/emitir-conceptos` | C13, C19 | 2 | dom, eventos | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `factudesk/emitir-global` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `factudesk/emitir-teclado-memo` | C13, C19 | 2 | eventos, dom | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `factudesk/emitir-tema-oscuro` | C13 | 1 | dom | el input Number lleva step="any" (único cambio en el DOM) |
| `factudesk/pagos` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `factudesk/retenciones` | C1, C19 | 3 | eventos | sin el listener duplicado: un clic dispara BeforeCellFocus/LeaveCell/EnterCell una vez (antes una vez más por cada InsertRow previo); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `presentacion/control-styles-v12` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `presentacion/encabezado-sticky` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `presentacion/plantilla-html` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `presentacion/scroll-interno` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/autoaddrow-true` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/ctrl-suprimir-cancelado` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/ctrl-suprimir` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/evermove-false` | C13, C19 | 2 | eventos, dom | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/evermove-true` | C19 | 4 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/flechas` | C19 | 4 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/inicio-fin` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/insertar` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/navegacion-columna-oculta` | C19 | 4 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/pagina-arriba-abajo` | C19 | 5 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/propagacion-host` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/tab-shift-tab` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `teclado/v12-sin-atajos` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/check-valores` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/check` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/date` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/datetime` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/inputkey` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/memo-maxlength` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/memo` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/noeditable-formato` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/noeditable` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/number-formato-decs0` | C13, C19 | 4 | dom, eventos | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/number-formato-sin-miles` | C13, C19 | 4 | dom, eventos | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/number-formato` | C13, C19 | 4 | dom, eventos | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/number-numformat` | C13, C19 | 4 | dom, eventos | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/number` | C13, C19 | 4 | dom, eventos | el input Number lleva step="any" (único cambio en el DOM); LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/select-keyfield` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/select-sin-options` | C17, C19 | 5 | dom, datos, eventos, props | confirmar sin cambiar no reescribe DataArray ni dispara FieldUpdated/IsDirtyChanged; LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/select` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/sin-type` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/text-maxlength` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/text` | C19 | 2 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `tipos/todos-los-tipos` | C19 | 9 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `v12/accion-paginacion-arbol` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `v12/accion-por-registro` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `v12/arbol-colapsado` | C19 | 3 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `v12/arbol-expandido` | C19 | 1 | eventos | LeaveCell recibe el td que se deja en lugar de null (único cambio en eventos) |
| `v12/exportar-csv` | C20 | 1 | columnas, eventos, extra | changeColumnTitle actualiza Columns[i].title (la exportación CSV sale con el título nuevo) |

## Escenarios nuevos (11, en `escenarios/defectos/correcciones-f1.mjs`, etiqueta `correccion-f1`)

Su referencia se generó con F1. Con `0ed1824` (el antes), estos escenarios muestran:

| Escenario | Con `0ed1824` | Con F1 |
|---|---|---|
| `defectos/c13-number-step-any` | sin `step`; con `12.5` el control queda `valid=false`, `:invalid` | `step="any"`; `valid=true` |
| `defectos/c15-number-badinput` | Enter guarda `n: ""` (y dispara `FieldUpdated` e `IsDirtyChanged`) | sigue editando; `MaskInvalid` `badInput` una vez; `n: 1` intacto |
| `defectos/c15-autoconfirm-no-roba-foco` | con `auto-confirm`, el intervalo guarda `n: ""`; el input externo queda `abcdefghi` | el editor queda abierto, sin evento; el input externo queda `abcdefghi` (la versión de F1 anterior a la revisión dejaba `abc`) |
| `defectos/c15-date-badinput-como-hoy` | Date a medio borrar: Enter guarda `f: ""` | igual que `0ed1824` (la versión de F1 anterior a la revisión no confirmaba) |
| `defectos/c17-date-sin-cambio` | las tres fechas quedan en `""` | sin cambios y sin eventos |
| `defectos/c17-datetime-sin-cambio` | `2026-02-01 10:30:00` pasa a `2026-02-01T10:30` y el valor con `Z` pasa a `""` | sin cambios y sin eventos |
| `defectos/c17-number-text-sin-cambio` | `12.5` pasa a `"12.5"`, `1234.5678` pasa a `"1234.57"`, y Text dispara `FieldUpdated` | valor y tipo intactos, sin eventos; un cambio real sí se guarda |
| `defectos/c18-editor-fecha` | el editor abre vacío salvo con `2026-02-01 10:30:00` en DateTime | `2026-02-01` y `2026-02-01T10:30` (Z y -05:00 a la hora de México); `01/02/2026` vacío |
| `defectos/c21-sorttree-nietos` | los nietos nunca se ordenan | ascendente (A, Z) y descendente (Z, A) |
| `defectos/click-propagation-sin-atributo` | el clic no llega ni a `tr.onclick` ni al documento | igual |
| `defectos/click-propagation-true` | (el atributo no existe: igual que sin él) | el clic llega a la fila y al documento, con `CurrentRowIndex()` ya actualizado |

## Correcciones de la revisión independiente (2026-11-01)

| # | Problema | Corrección |
|---|---|---|
| A1 | Con `auto-confirm` y un `badInput` pendiente, el intervalo llamaba a `ConfirmEdit` cada segundo y su `focus()` devolvía el foco a la tabla: no se podía escribir en otro campo. | El intervalo marca su confirmar (`_f1AutoConfirmando`). Solo un confirmar del usuario (foco dentro del shadow, o el clic en otra celda que llega por `CellFocus`) avisa y toma el foco; los demás dejan el editor como está. Escenario `defectos/c15-autoconfirm-no-roba-foco`. |
| A2 | C15 también se aplicaba a Date y DateTime. | Solo `input[type="number"]`. Escenario `defectos/c15-date-badinput-como-hoy`. |
| B1 | El listener `input` se registraba en cada aviso. | Uno solo por editor (`WeakSet`). |
| M1 | El mapa `tr → índice` se reconstruía completo en cada consulta después de una mutación. | Reconstrucción perezosa: un `MutationObserver` (hijos del tbody) lo marca como sucio en su callback y con `takeRecords()` en cada consulta. Con el mapa sucio, las consultas usan el DOM, como `0ed1824`, y el mapa se reconstruye solo si se vuelve a consultar sin cambios de por medio. `_printRows` desconecta el observador mientras redibuja. `data-cell` solo consulta los títulos guardados si `changeColumnTitle` cambió alguno. Mutación nueva `mapa-sin-invalidar`. |
| M2 | Conformidad: `evt-05` contradecía C17 y las pruebas R1 no admitían las diferencias autorizadas. | `evt-05` sin cambios (sin `FieldUpdated`) y `evt-05b` con cambio (con `FieldUpdated`). En R1 se normalizan exactamente esos campos en las dos fotos: el `td` de `LeaveCell` (C19), `Columns[].title` tomado de la referencia (C20) y, solo en `r1-10`, que lo declara con `autorizadas: ['C4']`, el `IsDirtyChanged` final de `restoreRow`. La referencia sigue siendo `0ed1824` sin tocar. |
