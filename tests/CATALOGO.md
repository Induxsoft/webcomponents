# Catálogo de escenarios del banco de EdiTable

*Generado por `node tests/tools/catalogo.mjs`; no editar a mano.*

| Carpeta | Escenarios | Contenido |
|---|---|---|
| `basicos/` | 20 | Inicialización (formas de declarar la tabla y de darle datos) y las demos de examples/. |
| `tipos/` | 25 | Cada tipo de columna, InputKey y columna con botón. |
| `edicion/` | 22 | Iniciar, confirmar y cancelar la edición; eventos que la controlan; auto-confirm; html-encode; readonly. |
| `teclado/` | 19 | Teclas del selector y propiedades AutoAddRow, AutoDelRow, EverMove y PagOffSet. |
| `eventos/` | 13 | Los 21 eventos, sus dos formas de registro y el addEventListener sobrescrito. |
| `datos/` | 24 | API pública de datos, filas, índices, respaldo, orden, columnas y plantillas. |
| `arbol/` | 16 | Vista en árbol, expandir/colapsar, ordenar en árbol, mover filas y RowIndent. |
| `tarjetas/` | 21 | Vista de tarjetas (original y configurable), badges, decoración de filas y fechas relativas. |
| `presentacion/` | 15 | Encabezado fijo, ancho de columnas, orden por encabezado, control-styles y atributos visuales. |
| `impresion/` | 4 | beforeprint/afterprint, @media print y PDF. |
| `v12/` | 17 | Lo que genera uie.dbeditable y lo que hacen list.dk, la impresión y la exportación CSV de V12. |
| `defectos/` | 20 | Defectos conocidos congelados como comportamiento actual (etiqueta defecto-conocido). |
| `rendimiento/` | 6 | Mediciones (no se comparan byte a byte; solo con --rendimiento). |
| **total** | **222** | |

«Pasos» cuenta las fotos: la inicial más una por paso.

## basicos/ (20)

Inicialización (formas de declarar la tabla y de darle datos) y las demos de examples/.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `basicos/demo-edittable` | examples/EditTable-demo.html: los 9 tipos, data, formato, botón y todos los eventos<br><sub>1300×700</sub> | /repo/examples/EditTable-demo.html | 5 |
| `basicos/demo-treetest` | examples/_treeTest.html: árbol, RowIndent, ShowAsTree en caliente, control-styles<br><sub>1100×900</sub> | /repo/examples/_treeTest.html | 5 |
| `basicos/demo-index` | examples/index.html: tabla vacía y AddRow (con los demás componentes)<br><sub>1100×900</sub> | /repo/examples/index.html | 1 |
| `basicos/demo-edittable-old` | examples/_EdiTable-demo.html (ruta del componente corregida en pruebas): edit-tbody, keyfield, Custom<br><sub>1100×700</sub> | /repo/examples/_EdiTable-demo.html | 2 |
| `basicos/demo-index2` | examples/index2.html (rutas corregidas en pruebas)<br><sub>1100×900</sub> | /repo/examples/index2.html | 1 |
| `basicos/thead-y-data` | edit-thead/edit-tr/edit-th con atributo data<br>Camino de dibujo _getFullTable (líneas 301-331): filas sin id/parent/indent. | editable.js:263-334; editable.md «Inicialización» | 1 |
| `basicos/edit-tbody` | Filas declaradas con edit-tbody/edit-tr/edit-td (UpdateData arma DataArray)<br>Sin data: UpdateData() lee el DOM (línea 240) y dispara FieldUpdated por celda. | editable.js:286-297, 240; examples/_EdiTable-demo.html | 1 |
| `basicos/data-y-edit-tbody` | Atributo data y además edit-tbody (gana edit-tbody en el DOM, data en DataArray) | editable.js:301 (solo dibuja data si no hay edit-tbody) | 1 |
| `basicos/propiedad-dataarray` | DataArray asignado por JS después de cargar y _printRows() | editable.md (ejemplo con _printRows); V12 paginación | 2 |
| `basicos/sin-datos` | Tabla sin atributo data ni filas |  | 1 |
| `basicos/data-vacio` | data="[]" (patrón de consumidores que llenan la tabla por JS) | editable.js:213-217, 240 | 1 |
| `basicos/data-espacios` | data con solo espacios (se ignora) | editable.js:213 | 1 |
| `basicos/data-json-invalido` | data con JSON inválido: alert y DataArray vacío | editable.js:216 | 1 |
| `basicos/sin-thead` | Sin edit-thead (data sin columnas) |  | 2 |
| `basicos/sin-id` | Tabla sin id (la tabla interna recibe f077fb41716141eeb7ecb1ed0a1ce292) | editable.js:265 | 2 |
| `basicos/thead-row-index` | Encabezado de dos filas y TheadRowIndex=1<br>Columns toma todos los th de todas las filas (desalineado) y THCount usa TheadRowIndex. | editable.js:381-398, 1588 | 3 |
| `basicos/columns-default-type` | ColumnsDefaultType=Number y columnas sin type | editable.js:1191, 1757 | 3 |
| `basicos/type-minusculas` | type="text" en minúsculas (eval da undefined) y type inexistente | editable.js:405 (eval distingue mayúsculas) | 2 |
| `basicos/options-invalido` | options con JSON inválido aborta la inicialización | editable.js:410 | 1 |
| `basicos/varias-tablas` | Tres tablas en la misma página; foco y focusedTable por instancia | editable.js:880, 1621 | 5 |

## tipos/ (25)

Cada tipo de columna, InputKey y columna con botón.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `tipos/text` | Text: entrada de texto | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/text-maxlength` | Text con maxlength=5 | editable.js:1879-1882 | 9 |
| `tipos/number` | Number sin formato | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/number-formato` | Number con format, decs=2, prefix, sufix y thousandssep | editable.js:2287-2305; examples/EditTable-demo.html | 9 |
| `tipos/number-formato-decs0` | Number con format y decs=0 (modifica NumFormat.decimals) | editable.js:742-764 (_format cambia NumFormat.decimals) | 9 |
| `tipos/number-formato-sin-miles` | Number con format sin thousandssep y valor no numérico | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/number-numformat` | Number con NumFormat cambiado (miles con punto, decimales con coma) | editable.js:1202-1206 | 9 |
| `tipos/noeditable` | NoEditable: Enter no abre editor | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 8 |
| `tipos/noeditable-formato` | NoEditable con format | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 8 |
| `tipos/date` | Date: input type=date | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/datetime` | DateTime: input datetime-local | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/memo` | Memo: textarea (Enter es salto de línea, Ctrl+Enter confirma) | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/memo-maxlength` | Memo con maxlength=8 | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/check` | Check: checkbox con Converts.Boolean (Sí/No) | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/check-valores` | Check con valores true/1/yes/cierto | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/select` | Select con options (el valor es la clave) | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/select-keyfield` | Select con keyfield (texto visible y clave en otro campo) | editable.js:1871-1876, 1934-1943; examples/_EdiTable-demo.html | 9 |
| `tipos/select-sin-options` | Select sin options | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 8 |
| `tipos/custom` | Custom: StartEdition es el único punto de edición | editable.js:1796-1812 | 8 |
| `tipos/badges-col` | Badges: columna no editable con badges<br><sub>registro: consumer</sub> | editable.js:2995, 3657-3672 | 8 |
| `tipos/sin-type` | Sin type: ColumnsDefaultType (Text) | editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato) | 9 |
| `tipos/inputkey` | Columna Text con InputKey (setInputKey/showInputKey): F4, botón y confirmar | editable.js:2711-2720, 1035-1037, 1964-1968, 2069-2072 | 6 |
| `tipos/boton-buttononclick` | Columna con button="true", buttondata propio y ButtonOnClick | editable.js:2058-2086; examples/EditTable-demo.html (cellsButtonClickHandler) | 4 |
| `tipos/boton-sin-buttononclick` | button="true" sin ButtonOnClick (llama a showInputKey sin inputkey: no hace nada) |  | 2 |
| `tipos/todos-los-tipos` | Los nueve tipos en una fila (como EditTable-demo) y navegación por todos<br><sub>1300×600</sub> | examples/EditTable-demo.html | 11 |

## edicion/ (22)

Iniciar, confirmar y cancelar la edición; eventos que la controlan; auto-confirm; html-encode; readonly.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `edicion/iniciar-con-tecla` | Iniciar la edición tecleando un carácter (StartEdit con ese carácter) | editable.js:1038-1044 | 5 |
| `edicion/iniciar-doble-clic` | Iniciar con doble clic (el segundo clic cae en el selector) | editable.js:2096-2101 | 3 |
| `edicion/iniciar-f2-enter` | Iniciar con F2 y con Enter (texto = contenido de la celda) | editable.js:1007-1012 | 5 |
| `edicion/suprimir-edita-vacio` | Supr sin Ctrl: edita con la celda vacía | editable.js:1013-1021 | 3 |
| `edicion/confirmar-enter-tab` | Confirmar con Enter y con Tab (ambos van a la derecha) | editable.js:1066-1071 | 4 |
| `edicion/confirmar-flechas` | Desde el editor: flechas arriba/abajo navegan (confirman); izquierda/derecha solo en el borde | editable.js:1053-1093 | 7 |
| `edicion/cancelar-escape` | Cancelar con Escape restaura temp_html y dispara CancelEdition | editable.js:1980-2011 | 4 |
| `edicion/cancelar-memo-select` | Escape en Memo y en Select |  | 4 |
| `edicion/auto-confirm` | auto-confirm="true": al salir de la tabla, el setInterval de 1 s confirma y dispara LostFocus | editable.js:777-798 | 5 |
| `edicion/sin-auto-confirm` | Sin auto-confirm: al salir la edición sigue abierta; LostFocus igual se dispara |  | 5 |
| `edicion/beforeupdatecell-cancel` | BeforeUpdateCell con cancel: la edición sigue abierta | editable.js:1945-1952 | 3 |
| `edicion/beforeupdatecell-cambia-texto` | BeforeUpdateCell cambia e.text (se escribe el texto cambiado) |  | 2 |
| `edicion/confirmedition-cancel` | ConfirmEdition con cancel: input ya quitado y Editing=false (defecto 22) **[defecto-conocido]** | editable.js:1954-1962 | 3 |
| `edicion/beforesetinput-inputcreated` | InputCreated y BeforeSetInput reciben el mismo objeto; BeforeSetInput cambia el texto inicial | editable.js:1884-1899 | 3 |
| `edicion/stopfire-defaults` | Valores default de InsertRow con stopfire (sin FieldUpdated) | editable.js:1535-1541, 1473-1496 | 3 |
| `edicion/html-encode` | html-encode="true": lo capturado se muestra escapado y se guarda sin escapar | editable.js:218, 2228, 2246, 2721-2740 | 4 |
| `edicion/sin-html-encode` | Sin html-encode: el HTML capturado se interpreta |  | 3 |
| `edicion/readonly-tabla` | Atributo readonly en la tabla: no edita | editable.js:212, 1787 | 2 |
| `edicion/readonly-columna` | readonly en una columna | editable.js:1791 | 3 |
| `edicion/api-startedit-confirm-cancel` | StartEdit/ConfirmEdit/CancelEdit llamados por API (CellFocus + StartEdit + select()) | editable.js:1785, 1911, 1980 | 5 |
| `edicion/clic-otra-celda-confirma` | Clic en otra celda durante la edición confirma (CellFocus -> ConfirmEdit) | editable.js:2034-2042 | 3 |
| `edicion/clic-otra-tabla-confirma` | Editando en una tabla y clic en otra |  | 4 |

## teclado/ (19)

Teclas del selector y propiedades AutoAddRow, AutoDelRow, EverMove y PagOffSet.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `teclado/flechas` | Flechas en las cuatro direcciones |  | 6 |
| `teclado/tab-shift-tab` | Tab = flecha derecha; Mayús+Tab hace lo mismo (no hay Shift+Tab); el foco no sale de la tabla | editable.js:1028-1031 | 5 |
| `teclado/inicio-fin` | Inicio/Fin de la fila y Ctrl+Inicio | editable.js:980-991, 1273-1299 | 5 |
| `teclado/pagina-arriba-abajo` | AvPág/RePág con PagOffSet=10 (por omisión) y con PagOffSet=3 | editable.js:992-1003 | 7 |
| `teclado/enter-f2-edita` | Enter y F2 inician la edición en un setTimeout de 1 ms |  | 3 |
| `teclado/insertar` | Insertar (sin Ctrl no hace nada) y Ctrl+Insertar (InsertRow en la fila actual) | editable.js:1004-1006, 1509-1568 | 4 |
| `teclado/ctrl-insertar-sin-autodelrow` | Ctrl+Insertar depende de AutoDelRow (con AutoDelRow=false no inserta) **[defecto-conocido]** | editable.js:1005 | 2 |
| `teclado/ctrl-suprimir` | Ctrl+Supr borra la fila (BeforeRowDelete aceptado) y el selector queda en la misma posición | editable.js:1013-1014, 1334-1373 | 3 |
| `teclado/ctrl-suprimir-cancelado` | Ctrl+Supr con BeforeRowDelete cancelado |  | 3 |
| `teclado/ctrl-suprimir-sin-autodelrow` | AutoDelRow=false: Ctrl+Supr no borra |  | 2 |
| `teclado/autoaddrow-true` | AutoAddRow=true: flecha abajo en la última fila agrega una fila | editable.js:2196-2202 | 4 |
| `teclado/autoaddrow-false` | AutoAddRow=false: flecha abajo en la última fila no hace nada |  | 2 |
| `teclado/evermove-true` | EverMove=true: derecha en la última celda baja de fila; izquierda en la primera sube | editable.js:2141-2183 | 5 |
| `teclado/evermove-false` | EverMove=false (como V12): no cambia de fila |  | 4 |
| `teclado/v12-sin-atajos` | AutoAddRow, AutoDelRow y EverMove en false (como uie.dbeditable) | uielements.v12.dkl:162-164 | 2 |
| `teclado/tecla-con-modificadores` | Teclas de un carácter con Alt/Meta también inician edición | editable.js:1038-1044 | 4 |
| `teclado/teclas-ignoradas` | Teclas sin acción (Escape, F1, F5, Backspace) sobre el selector: preventDefault y nada más | editable.js:977 | 2 |
| `teclado/navegacion-columna-oculta` | Flechas con una columna oculta (hideColumn) | editable.js:2141-2203, 3885 | 5 |
| `teclado/propagacion-host` | El selector detiene la propagación: un keydown nativo en captura sobre el host sí lo ve | editable.js:1047 (HTMLElement.prototype.addEventListener.call en captura) | 2 |

## eventos/ (13)

Los 21 eventos, sus dos formas de registro y el addEventListener sobrescrito.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `eventos/secuencia-completa` | Secuencia de todos los eventos (registrador en los 21 eventos) en un flujo de captura |  | 10 |
| `eventos/por-events` | Manejadores del consumidor por Events[Const.Events.X]<br><sub>registro: consumer</sub> |  | 10 |
| `eventos/por-addeventlistener` | Los mismos manejadores por addEventListener (mismo resultado que por Events)<br><sub>registro: consumer</sub> |  | 10 |
| `eventos/addeventlistener-mayusculas` | addEventListener con el nombre en mayúsculas (se compara en minúsculas)<br><sub>registro: consumer</sub> |  | 3 |
| `eventos/sin-manejadores` | Sin manejadores (modo consumer: no se agrega ningún registrador)<br>Congela los caminos sin manejador: OnSort no toca Columns[].sort, los badges no son clicables, StartEdition no arma args.<br><sub>registro: consumer</sub> |  | 10 |
| `eventos/un-manejador-por-evento` | addEventListener reemplaza el manejador anterior (uno por evento); removeEventListener no lo quita<br><sub>registro: consumer</sub> | editable.js:3913-3977 | 2 |
| `eventos/nativos-ignorados` | Eventos nativos (click, keydown) con addEventListener: se ignoran sin native-events | editable.js:3904-3910 | 2 |
| `eventos/nativos-con-native-events` | native-events="true": los nativos pasan si se registran después de inicializar; antes, se pierden | editable.js:2895, 3908 | 2 |
| `eventos/listener-antes-de-cargar` | addEventListener de un evento de EdiTable antes de DOMContentLoaded (sí funciona)<br><sub>registro: consumer</sub> |  | 2 |
| `eventos/reemplazar-events` | Reemplazar t.Events = {…}: unos eventos leen this.Events y otros la copia (_getCurren)<br><sub>registro: consumer</sub> | contrato §1.16; editable.js:1796, 1945, 2002 vs el resto | 2 |
| `eventos/rowchanged-indices` | RowChanged: previous_index -1 la primera vez; no se dispara en la misma fila |  | 4 |
| `eventos/beforecellfocus-cancel` | BeforeCellFocus con cancel: el foco no se mueve<br><sub>registro: consumer</sub> |  | 4 |
| `eventos/isdirtychanged` | IsDirtyChanged solo cuando el conteo cruza 0 | editable.js:2769-2798 | 6 |

## datos/ (24)

API pública de datos, filas, índices, respaldo, orden, columnas y plantillas.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `datos/addrow-insertrow` | AddRow, InsertRow(rw) e InsertRow(rw, nofocus) | editable.js:1500-1568 | 6 |
| `datos/deleterow` | DeleteRow, DeleteCurrentRow y fuera de rango | editable.js:1334-1373 | 6 |
| `datos/updaterow` | UpdateRow: DataArray -> DOM (con plantilla y decoración, sin onTdPaint) | editable.js:1379-1411 | 5 |
| `datos/updatedata` | UpdateData / UpdateDataRow: DOM -> DataArray (texto, formato quitado, celda seleccionada) | editable.js:1415-1457, 2214-2231 | 5 |
| `datos/updatedatamember` | UpdateDataMember: crea la fila si no existe; devuelve la fila; field/value undefined | editable.js:1473-1496 | 4 |
| `datos/indices` | RowIndexOfTd, TrOfTd, ColIndexOfTd, CurrentRowIndex, CurrentColIndex, CurrentTd, GetTrByIndex | editable.js:1320-1330, 1621-1713 | 5 |
| `datos/conteos` | TRCount, THCount, TDCount, ColumnsCount, GetTHead, GetTBody |  | 2 |
| `datos/navto` | NavTo, NavToHome, NavToFirstCell, NavToLastCell y fuera de rango | editable.js:1273-1315 | 6 |
| `datos/cellfocus` | CellFocus por API (td, div interno, undefined) | editable.js:2016-2121 | 4 |
| `datos/getcolumndef` | GetColumnDef muta Columns[i] (type por omisión y Converts en Check); GetColumnDefOfTd | editable.js:1751-1778 | 4 |
| `datos/gettdvalue-settdvalue` | GetTdValue / SetTdValue (formato, html-encode, crea .cell-content) | editable.js:2214-2265 | 4 |
| `datos/plantillas` | template con DataRow y this; template-encode; error en plantilla | editable.js:2232-2237, 1395-1401 | 4 |
| `datos/backup-restore` | backup, restore, restoreRow, IsDirty, getIsDirty, setIsDirty | editable.js:2741-2803 | 9 |
| `datos/sort-api` | Sort(DataArray, campo, desc) por API: ordena en su lugar; OnSort antes de ordenar | editable.js:2655-2678, 2804-2822 | 5 |
| `datos/hidecolumn` | hideColumn / hideColumns: se vuelve a aplicar en _printRows e InsertRow (por cellIndex) | editable.js:3885-3901, 2411, 1550 | 7 |
| `datos/changecolumntitle` | changeColumnTitle no actualiza Columns[i].title **[defecto-conocido]** | editable.js:2823-2830 | 2 |
| `datos/htmlencode-api` | setHtmlEncode / getHtmlDecode / replaceSymbols |  | 2 |
| `datos/css-personalizado` | CSS.Cell y CSS.RowSelected cambiados por el consumidor | editable.js:1215-1218, 1532, 2104-2109 | 4 |
| `datos/const-html-personalizado` | Const.HTML.Selector e Inputs.Text reemplazados (conservan los ids __table_*) | editable.js:820-831 (contrato §2.9) | 2 |
| `datos/converts-personalizado` | EdiTable.Converts.Boolean reemplazado (Check con Verdadero/Falso) |  | 2 |
| `datos/leave-enter-initialize` | LeaveCell/EnterCell llamados directo e Initialize(tableId) |  | 3 |
| `datos/ensure-selection-visible` | EnsureSelectionVisible y keep-selection-visible al cambiar el ancho<br><sub>900×500</sub> | editable.js:3199-3347 | 5 |
| `datos/refresh` | RefreshView, RefreshDecorations y RefreshBadges después de cambiar propiedades<br><sub>registro: consumer</sub> | editable.js:3191-3197, 3359-3362, 3618-3621 | 4 |
| `datos/tree-array-api` | TreeArray/TableArray/GetTree/SetTree por API (TreeArray muta el arreglo) | editable.js:2471-2549 | 4 |

## arbol/ (16)

Vista en árbol, expandir/colapsar, ordenar en árbol, mover filas y RowIndent.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `arbol/basico-colapsado` | show-tree="true" con id/idp por omisión: hijos ocultos al iniciar | editable.js:2318-2334, 2347-2453 | 5 |
| `arbol/expandir-al-iniciar` | _expandOnStart=true antes de _printTreeData (como V12) | uielements.v12.dkl:168-176 | 3 |
| `arbol/claves-propias` | key, parentkey y childs-field propios (sys_pk / parent / hijos) |  | 3 |
| `arbol/datos-anidados` | data ya anidado (con __items): SetTree lo aplana |  | 2 |
| `arbol/navegacion` | Navegación con flechas salta filas ocultas; CurrentRowIndex cuenta las ocultas | editable.js:2126-2203 (tr:not(.hidde-row)) | 7 |
| `arbol/editar-en-arbol` | Editar en árbol: UpdateDataMember con el índice del tr (DataArray en orden de árbol) |  | 3 |
| `arbol/ordenar-en-arbol` | Clic en encabezado en árbol: SortTree por nivel y _printRows (conserva expandidas) | editable.js:507-513, 2679-2709, 2358-2364 | 5 |
| `arbol/mover-fila` | CanMoveRow (por omisión con show-tree): arrastrar como hermano y como hijo | editable.js:523-728 | 5 |
| `arbol/mover-cancelado` | BeforeMoveRow con cancel<br><sub>registro: consumer</sub> |  | 2 |
| `arbol/mover-con-backup` | Mover con backup: _moveData reconstruye el respaldo conservando isDirty por clave | editable.js:610-618 | 2 |
| `arbol/rowindent` | RowIndent (sangrar/quitar sangría, como _treeTest) y RowIndentation | editable.js:2550-2600; examples/_treeTest.html (addIdent) | 4 |
| `arbol/expand-collapse-api` | ExpandRow/CollapseRow por API y sin argumento |  | 4 |
| `arbol/cambiar-vista` | ShowAsTree en caliente + _printTreeData (botones «Vista normal/árbol» de _treeTest) | examples/_treeTest.html (viewTree) | 3 |
| `arbol/ontdpaint-en-arbol` | onTdPaint/onRowPaint en árbol: idx del arreglo dibujado, row es una copia | contrato §2.7, §1.11 | 2 |
| `arbol/sin-arbol-show-tree-false` | show-tree="false" con key/parentkey (como _treeTest): no hay árbol ni movimiento |  | 2 |
| `arbol/agregar-fila-en-arbol` | AddRow en árbol (fila sin id/parent) |  | 3 |

## tarjetas/ (21)

Vista de tarjetas (original y configurable), badges, decoración de filas y fechas relativas.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `tarjetas/responsive-ancho` | cards-responsive="true", todas NoEditable, a 1000 px (tabla)<br><sub>1000×700</sub> | editable.js:800-813, 195-208 | 2 |
| `tarjetas/responsive-angosto` | cards-responsive="true" a 600 px: table-cards y td::before con data-cell<br><sub>600×900</sub> |  | 4 |
| `tarjetas/responsive-con-editable` | cards-responsive con una columna editable: no se vuelve tarjeta<br><sub>600×900</sub> |  | 1 |
| `tarjetas/editable-responsive` | editable-responsive="true": tarjetas aunque haya columnas editables<br><sub>600×900</sub> |  | 2 |
| `tarjetas/modo-always` | cards-mode="always" (configurable) a 1000 px<br><sub>1000×700</sub> |  | 2 |
| `tarjetas/modo-never` | cards-mode="never" con cards-responsive a 600 px<br><sub>600×900</sub> |  | 1 |
| `tarjetas/modo-auto-breakpoint` | cards-mode="auto" con cards-breakpoint="900px": ViewModeChanged al cruzar el ancho<br><sub>1000×700</sub> | editable.js:3112-3185 | 3 |
| `tarjetas/breakpoint-contenedor` | cards-breakpoint-target="container" (ResizeObserver del contenedor)<br><sub>1000×700</sub> |  | 3 |
| `tarjetas/layouts` | cards-layout stacked y slots, cards-gap, cards-padding, cards-field-gap, cards-label-width<br><sub>600×900</sub> |  | 1 |
| `tarjetas/atributos-de-columna` | card, table, cardorder, cardlabel, cardslot, cardhideempty por columna; cards-hide-empty<br><sub>600×900</sub> | editable.js:3030-3059, 3416-3434 | 2 |
| `tarjetas/cardcolumns` | CardColumns por propiedad + RefreshView<br><sub>600×900</sub> |  | 2 |
| `tarjetas/badges-campo` | Badges desde el campo __badges y desde badges-field<br><sub>registro: consumer</sub> | editable.js:3549-3555, 3644-3697 | 2 |
| `tarjetas/badges-funcion-y-api` | RowBadges, SetRowBadges, AddRowBadge, RemoveRowBadge, ResetRowBadges, GetRowBadges<br><sub>registro: consumer</sub> | editable.js:3557-3621 | 8 |
| `tarjetas/badges-columna-grupos` | Columnas Badges con badgegroup<br><sub>registro: consumer</sub> |  | 2 |
| `tarjetas/badges-clic` | BadgeOnClick, onClick del badge, evento BadgeClick con cancel, badge-selects-row y teclado<br><sub>registro: consumer</sub> | editable.js:3706-3833 | 5 |
| `tarjetas/badges-tooltip-custom` | badge-tooltip="custom": tooltip propio (div.et-tooltip en el shadow)<br><sub>registro: consumer</sub> | editable.js:3835-3863 | 3 |
| `tarjetas/badges-iconos` | Iconos de badge: SVG saneado (sin script/on*/href externos), img: con origen seguro e inseguro, texto<br><sub>registro: consumer</sub> | editable.js:3771-3812 | 1 |
| `tarjetas/decoracion-filas` | RowAccent, RowClass, RowClassField (row-class-field), CellClass y onRowPaint<br><sub>registro: consumer</sub> | editable.js:3371-3440 | 4 |
| `tarjetas/fechas-relativas` | format="relative" con la fecha fija del banco (2026-06-15), Locale y RelativeDateFormatter | editable.js:3453-3505 | 3 |
| `tarjetas/oncardpaint` | onCardPaint solo en vista de tarjetas<br><sub>600×900</sub> |  | 3 |
| `tarjetas/doc-ejemplo-agentes` | Ejemplo de editable.md («agentes»): slots, badges con grupos, relativo, plantilla (uso tipo agent.induxsoft.net)<br><sub>registro: consumer · 560×800</sub> | docs.induxsoft.net es/api/web-components/editable.md:157-200 | 2 |

## presentacion/ (15)

Encabezado fijo, ancho de columnas, orden por encabezado, control-styles y atributos visuales.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `presentacion/encabezado-sticky` | thead sticky (top:0, z-index:100) dentro de un contenedor con scroll<br><sub>900×500</sub> | editable.js:74-79, 219 | 3 |
| `presentacion/scroll-interno` | Contenedor interno con max-height:100% y overflow:auto cuando el host tiene alto |  | 2 |
| `presentacion/redimensionar-columna` | Cambiar el ancho de una columna arrastrando el borde (sizable-border) | editable.js:416-464 | 5 |
| `presentacion/ordenar-por-encabezado` | Clic en el encabezado: ordena DataArray; clases ascendent/descendent; contador por th | editable.js:492-522 | 7 |
| `presentacion/sortable-false-atributo` | sorTable="false" (atributo): el clic no ordena | editable.js:231-233 | 2 |
| `presentacion/control-styles-v12` | control-styles con los selectores literales de V12 (div:has(table#id), #id tr th, @media print)<br><sub>900×450</sub> | uielements.v12.dkl:85-92 | 2 |
| `presentacion/control-styles-treetest` | control-styles de _treeTest.html (tr td, th, thead, .EdiTable-Cell, tbody, #__table_input) | examples/_treeTest.html | 2 |
| `presentacion/anchos-y-alineacion` | width, minwidth, maxwidth y textalign (en th y en .cell-content) | editable.js:335-352, 2266-2286 | 2 |
| `presentacion/alturas-de-fila` | min-row-height, max-row-height y row-height (display:block en .cell-content) | editable.js:770-772, 2271-2284 | 2 |
| `presentacion/selectores-ocultos` | hidde-selector="true" (selector transparente) y hide-row-selector="true" (sin fila resaltada) | editable.js:767-768, 2089, 2108 | 3 |
| `presentacion/clase-de-columna` | class en edit-th (se copia al th, no a los td) |  | 1 |
| `presentacion/plantilla-html` | Columna con template HTML (enlace y botón) y html-encode en las demás |  | 2 |
| `presentacion/columna-oculta-visual` | hideColumn: celdas y th con hidde-col; badges se mueven a la siguiente visible<br><sub>registro: consumer</sub> |  | 3 |
| `presentacion/keep-selection-visible` | keep-selection-visible="false" e "if-visible"<br><sub>900×500</sub> | editable.js:2897, 3204-3275 | 3 |
| `presentacion/hover` | tbody tr:hover (fondo #F5F5F5) |  | 2 |

## impresion/ (4)

beforeprint/afterprint, @media print y PDF.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `impresion/before-after-print` | beforeprint oculta las columnas no-print/hide-on-print; afterprint las muestra |  | 3 |
| `impresion/media-print-sin-eventos` | @media print sin beforeprint: .no-print solo oculta el th (los td no tienen la clase) |  | 2 |
| `impresion/pdf` | page.pdf() no produce errores (el PDF no se compara) |  | 2 |
| `impresion/varias-tablas` | Cada tabla registra sus propios beforeprint/afterprint |  | 3 |

## v12/ (17)

Lo que genera uie.dbeditable y lo que hacen list.dk, la impresión y la exportación CSV de V12.

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `v12/lista-simple` | uie.dbeditable: lista simple con data, control-styles de V12, leyenda y acciones | Induxsoft/v12 src/uielements.v12.dkl:41-323; list.dk:12-30 | 8 |
| `v12/sin-resultados` | uie.dbeditable sin registros: «Sin resultados» | Induxsoft/v12 src/uielements.v12.dkl:41-323 (líneas 141-143) | 2 |
| `v12/leyenda-propia` | table_footer propio y control_styles libre de la definición | Induxsoft/v12 src/uielements.v12.dkl:41-323 (líneas 66-72, 92) | 1 |
| `v12/id-aleatorio` | uie.dbeditable sin table_id: table_<uuid> recortado a 12 caracteres | Induxsoft/v12 src/uielements.v12.dkl:41-323 (línea 43: cut("table_"+uuid(),12)) | 2 |
| `v12/arbol-expandido` | uie.dbeditable en árbol con expanded=true (_expandOnStart + _printTreeData) | Induxsoft/v12 src/uielements.v12.dkl:41-323 (líneas 56-63, 168-176) | 7 |
| `v12/arbol-colapsado` | uie.dbeditable en árbol con expanded=false (hijos ocultos) | Induxsoft/v12 src/uielements.v12.dkl:41-323 | 6 |
| `v12/arbol-booleanos-1-0` | Árbol con #<expanded> impreso como 1/0 (supuesto S3, variante) | Induxsoft/v12 src/uielements.v12.dkl:41-323 (línea 174) | 2 |
| `v12/arbol-atributo-literal` | Árbol con el ="" sobrante de "#<tree_opt>"="" (supuesto S2, variante literal) | Induxsoft/v12 src/uielements.v12.dkl:41-323 (línea 79) | 1 |
| `v12/paginacion-3` | Paginación de V12: 130 registros, 50 por página (rows_per_page), botonera y _printRows() | Induxsoft/v12 src/uielements.v12.dkl:41-323 (líneas 178-307) | 9 |
| `v12/paginacion-muchas` | Paginación con más de 5 páginas (puntos suspensivos y «Último») | Induxsoft/v12 src/uielements.v12.dkl:41-323 (líneas 222-272) | 5 |
| `v12/paginacion-una` | Paginación con una sola página (sin botonera) | Induxsoft/v12 src/uielements.v12.dkl:41-323 (línea 197) | 1 |
| `v12/accion-por-registro` | getCurrentContext() (list.dk:84-89): el sys_pk es el de la fila elegida<br>Riesgo más grave del plan (I1): DataArray[CurrentRowIndex()] debe ser la fila marcada. | Induxsoft/v12 src/_templates/v12/app_crudl/list.dk:84-89 | 8 |
| `v12/accion-paginacion-arbol` | getCurrentContext() con paginación y con árbol colapsado | list.dk:84-89 + uielements.v12.dkl:168-307 | 4 |
| `v12/impresion-v12` | Impresión de V12: getPrintableHTML() clona la tabla interna (el._shadow.getElementById(el.id)) | Induxsoft/v12 src/_templates/sites/v12/js/induxsoft.v12.ui.js:26-69 | 2 |
| `v12/exportar-csv` | ExportarCSV de V12: lee table tr del documento, Columns (title/field/class) y DataArray | Induxsoft/v12 src/uielements.v12.dkl:655-714 | 3 |
| `v12/tarjetas-angosta` | Lista de V12 en pantalla angosta (cards-responsive con todas NoEditable: table-cards)<br><sub>600×800</sub> | Induxsoft/v12 src/uielements.v12.dkl:41-323 (línea 82) | 4 |
| `v12/impresion-media-print` | Lista de V12 con @media print del control-styles y beforeprint (no-print, hide-on-print) | Induxsoft/v12 src/uielements.v12.dkl:41-323 (líneas 85-90) | 3 |

## defectos/ (20)

Defectos conocidos congelados como comportamiento actual (etiqueta defecto-conocido).

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `defectos/listener-clic-duplicado` | Cada InsertRow agrega otro listener de clic a todas las celdas (3 inserciones: BeforeCellFocus x4) **[defecto-conocido]**<br><sub>registro: consumer</sub> | editable.js:1543-1551; contrato §4 #5 (verificado) | 4 |
| `defectos/ctrl-c-edita` | Ctrl+C sobre el selector empieza a editar con la letra «c» **[defecto-conocido]** | editable.js:1038-1044; plan D1 | 4 |
| `defectos/navtoend` | NavToEnd (y Ctrl+Fin) no hace nada: busca thead tr td **[defecto-conocido]** | editable.js:1280-1283 | 3 |
| `defectos/sortable-propiedad` | La propiedad sorTable=false no tiene efecto (solo se lee _sorTable) **[defecto-conocido]** | editable.js:231-233, 499 | 3 |
| `defectos/clases-orden-invertidas` | Primer clic ordena ascendente pero marca «descendent» **[defecto-conocido]** | editable.js:503-506 | 2 |
| `defectos/isdirty-tras-restore` | IsDirty sigue en true después de restore() y de restoreRow() **[defecto-conocido]** | editable.js:2745-2761 (verificado) | 4 |
| `defectos/isdirty-tras-ordenar` | Sort reordena DataArray pero no el respaldo: getIsDirty apunta a otra fila **[defecto-conocido]** | editable.js:2662, 2769-2803; contrato §4 #14 | 4 |
| `defectos/insertrow-no-respaldo` | InsertRow(rw) no inserta en el respaldo: los isDirty se corren **[defecto-conocido]** | editable.js:1514-1517 | 2 |
| `defectos/readonly-false` | readonly="false" en la columna la deja de solo lectura **[defecto-conocido]** | editable.js:1791 | 2 |
| `defectos/afterprint-muestra-ocultas` | afterprint vuelve a mostrar una columna no-print que el usuario había ocultado **[defecto-conocido]** | editable.js:251-256 | 4 |
| `defectos/attributechangecallback` | attributeChangeCallback mal escrito: cambiar atributos después de cargar no tiene efecto **[defecto-conocido]** | editable.js:17-26 | 4 |
| `defectos/creada-despues` | edit-table creada después de DOMContentLoaded: no se inicializa **[defecto-conocido]** | editable.js:28-32 (verificado); plan D4 | 4 |
| `defectos/attributes-tapado` | El campo attributes tapa Element.attributes (null antes, arreglo de nombres después) **[defecto-conocido]** | editable.js:3, 14 (verificado) | 1 |
| `defectos/sender-copia-superficial` | sender es una copia superficial: sin métodos del prototipo, no es elemento, se desactualiza **[defecto-conocido]**<br><sub>registro: consumer</sub> | editable.js:486-491; contrato §1.16 (verificado) | 3 |
| `defectos/paginas-columna-oculta` | AvPág/RePág con una columna oculta: NavTo usa el índice visible y CurrentColIndex el absoluto **[defecto-conocido]** | editable.js:993-1002, 1313; contrato §4 #11 | 4 |
| `defectos/onsort-campo-especial` | OnSort con un campo con caracteres especiales: excepción en querySelector sin comillas **[defecto-conocido]** | editable.js:2811 | 3 |
| `defectos/onsort-sin-sender` | OnSort trae {th, coldef, caption} sin sender y se dispara antes de ordenar **[defecto-conocido]**<br><sub>registro: consumer</sub> | editable.js:2804-2822 | 3 |
| `defectos/getisdirty-sin-respaldo` | getIsDirty sin backup lanza una excepción; setIsDirtyByValue llama dos veces a setIsDirty **[defecto-conocido]** | editable.js:2799-2803, 1459-1464 | 3 |
| `defectos/insertrow-sin-plantilla` | InsertRow no aplica plantilla, data-cell ni onTdPaint (tres caminos de dibujo distintos) **[defecto-conocido]** | editable.js:1509-1568; contrato §1.5 y §4 #20 | 3 |
| `defectos/initial-sin-id-tr` | _getFullTable no pone id/parent/indent en los tr; _printRows sí **[defecto-conocido]** | editable.js:301-331 vs 2381 | 2 |

## rendimiento/ (6)

Mediciones (no se comparan byte a byte; solo con --rendimiento).

| Escenario | Qué congela | Origen | Pasos |
|---|---|---|---|
| `rendimiento/lista-1000` | Lista de 1,000 filas × 4 columnas |  | mide |
| `rendimiento/arbol-1000` | Árbol de 1,000 filas × 4 columnas |  | mide |
| `rendimiento/lista-5000` | Lista de 5,000 filas × 4 columnas |  | mide |
| `rendimiento/arbol-5000` | Árbol de 5,000 filas × 4 columnas |  | mide |
| `rendimiento/lista-20000` | Lista de 20,000 filas × 4 columnas |  | mide |
| `rendimiento/arbol-20000` | Árbol de 20,000 filas × 4 columnas |  | mide |

