/* Índice de ejemplos (lo usan index.html, tests/conformidad/matriz.mjs y capturas.mjs). Es JSON válido entre los corchetes. */
window.EJEMPLOS = [
 {
  "archivo": "a01-basica.html",
  "titulo": "Tabla básica",
  "tipo": "actual",
  "descripcion": "Lista editable con datos en DataArray: clic o flechas para moverse, Enter o F2 para editar, Esc para cancelar. Agregar y quitar filas con AddRow y DeleteCurrentRow.",
  "spec": [
   "A.init",
   "A.datos",
   "A.edicion"
  ],
  "requiere": []
 },
 {
  "archivo": "a02-tipos.html",
  "titulo": "Todos los tipos de columna",
  "tipo": "actual",
  "descripcion": "Los 10 tipos de columna: NoEditable, Text, Number, Select, Date, DateTime, Check, Custom, Memo y Badges. Custom solo dispara StartEdition: aquí el ejemplo hace su propia edición con prompt.",
  "spec": [
   "A.tipos"
  ],
  "requiere": []
 },
 {
  "archivo": "a03-formato.html",
  "titulo": "Formato numérico y moneda",
  "tipo": "actual",
  "descripcion": "format=\"true\" con decs, prefix, sufix y thousandssep. La celda muestra el valor con formato; DataArray conserva el número (o el texto que se tecleó).",
  "spec": [
   "A.tipos",
   "A.presentacion"
  ],
  "requiere": []
 },
 {
  "archivo": "a04-boton-inputkey.html",
  "titulo": "Columnas con botón e InputKey",
  "tipo": "actual",
  "descripcion": "button=\"true\" agrega un botón a la celda actual. Con ButtonOnClick se atiende el clic; con setInputKey(field, buscador) el botón, F4 o la confirmación de la celda llaman a buscador.searchText(texto, autoselect), el mismo contrato que el componente input-key.",
  "spec": [
   "A.tipos",
   "A.teclado"
  ],
  "requiere": []
 },
 {
  "archivo": "a05-select-llave.html",
  "titulo": "Select con llave y texto",
  "tipo": "actual",
  "descripcion": "Una columna Select con keyfield muestra el texto de la opción y guarda la clave en otro campo de DataArray (aquí: unidad muestra «PIEZA» y unidad_id guarda «H87»).",
  "spec": [
   "A.tipos"
  ],
  "requiere": []
 },
 {
  "archivo": "a06-captura-partidas.html",
  "titulo": "Captura de partidas con teclado",
  "tipo": "actual",
  "descripcion": "Como en la captura de una venta de R5: Tab y Enter avanzan a la derecha, flecha abajo en la última fila agrega otra (AutoAddRow), Ctrl+Insert inserta y Ctrl+Supr borra. El importe y los totales se recalculan en FieldUpdated.",
  "spec": [
   "A.teclado",
   "A.eventos"
  ],
  "requiere": []
 },
 {
  "archivo": "a07-cancelacion.html",
  "titulo": "Edición con cancelación por eventos Before*",
  "tipo": "actual",
  "descripcion": "BeforeCellFocus, BeforeUpdateCell, ConfirmEdition y BeforeRowDelete se cancelan con e.cancel = true. Aquí: no se puede entrar a la columna bloqueada, la cantidad debe ser mayor que cero y para borrar se pide confirmación.",
  "spec": [
   "A.eventos"
  ],
  "requiere": []
 },
 {
  "archivo": "a08-isdirty.html",
  "titulo": "IsDirty, backup y restore",
  "tipo": "actual",
  "descripcion": "backup() toma una copia de DataArray; cada edición compara con ella y IsDirtyChanged avisa cuando la tabla pasa de limpia a modificada y de regreso. restore() y restoreRow(i) devuelven los valores.",
  "spec": [
   "A.datos",
   "A.eventos"
  ],
  "requiere": []
 },
 {
  "archivo": "a09-ordenar.html",
  "titulo": "Ordenar con clic en el encabezado",
  "tipo": "actual",
  "descripcion": "Un clic ordena ascendente y otro descendente. OnSort se dispara antes de ordenar con {th, coldef, caption}, como lo usa V12 para su leyenda. sorTable=\"false\" lo desactiva.",
  "spec": [
   "A.orden"
  ],
  "requiere": []
 },
 {
  "archivo": "a10-columnas.html",
  "titulo": "Ocultar columnas y cambiar títulos",
  "tipo": "actual",
  "descripcion": "hideColumn(field, true|false) oculta y muestra una columna (hideColumns guarda los índices de celda); changeColumnTitle(field, título) cambia el encabezado.",
  "spec": [
   "A.presentacion"
  ],
  "requiere": []
 },
 {
  "archivo": "a11-arbol-cuentas.html",
  "titulo": "Árbol: catálogo de cuentas contables",
  "tipo": "actual",
  "descripcion": "show-tree con key y parentkey: catálogo de cuentas como en la contabilidad de V10. Expandir y colapsar, sangrar o subir de nivel (RowIndent) y arrastrar filas para moverlas (can-move-row).",
  "spec": [
   "A.arbol"
  ],
  "requiere": []
 },
 {
  "archivo": "a12-tarjetas.html",
  "titulo": "Vista de tarjetas responsiva con badges",
  "tipo": "actual",
  "descripcion": "cards-mode=\"auto\" con punto de corte del contenedor: la tabla se convierte en tarjetas tipo lista (cards-layout=\"slots\"). Badges calculados con RowBadges, acento de color con RowAccent y clases por fila con RowClass.",
  "spec": [
   "A.tarjetas"
  ],
  "requiere": []
 },
 {
  "archivo": "a13-ontdpaint.html",
  "titulo": "Color condicional con onTdPaint",
  "tipo": "actual",
  "descripcion": "onTdPaint(td, idx, icol, field) se llama por celda al dibujar la tabla completa (_printRows); aquí pinta en rojo los saldos negativos. CellClass hace lo mismo con clases y también se aplica en UpdateRow.",
  "spec": [
   "A.presentacion"
  ],
  "requiere": []
 },
 {
  "archivo": "a14-control-styles.html",
  "titulo": "Estilos con control-styles",
  "tipo": "actual",
  "descripcion": "control-styles inyecta CSS dentro del shadow DOM. Las variables CSS cruzan el shadow, así que un tema claro u oscuro se arma con variables, como hace FactuDesk con edittable-tema.js.",
  "spec": [
   "A.presentacion",
   "A.factudesk"
  ],
  "requiere": []
 },
 {
  "archivo": "a15-impresion.html",
  "titulo": "Impresión",
  "tipo": "actual",
  "descripcion": "Las columnas con class=\"no-print\" o \"hide-on-print\" se ocultan en beforeprint y vuelven en afterprint. V12 imprime de otra forma: clona la tabla interna con _shadow.getElementById(id).cloneNode(true); aquí se muestra ese clon.",
  "spec": [
   "A.impresion",
   "A.v12"
  ],
  "requiere": []
 },
 {
  "archivo": "a16-v12-lista.html",
  "titulo": "Réplica de una lista de V12",
  "tipo": "actual",
  "descripcion": "Lo que genera uie.dbeditable: hidde-selector, cards-responsive, el control-styles de V12, paginación propia que asigna DataArray y llama _printRows(), la leyenda con OnSort, la acción por registro con DataArray[CurrentRowIndex()].sys_pk, la exportación CSV de V12 y el clon para imprimir.",
  "spec": [
   "A.v12"
  ],
  "requiere": []
 },
 {
  "archivo": "a17-factudesk-conceptos.html",
  "titulo": "Réplica de conceptos de FactuDesk",
  "tipo": "actual",
  "descripcion": "La tabla de conceptos de FactuDesk v12 al emitir: tema por control-styles, DataArray.push + _printRows, CellFocus y StartEdit en Cantidad, recálculo en FieldUpdated con UpdateRow, Supr y ↓ atendidos con un keydown nativo en captura sobre el host, y hideColumn(\"predial\").",
  "spec": [
   "A.factudesk"
  ],
  "requiere": []
 },
 {
  "archivo": "b01-totales.html",
  "titulo": "Totales en el pie",
  "tipo": "v2",
  "descripcion": "summary=\"sum|count|avg|min|max|custom\" por columna, summary-format y summary-label; summary-scope en la tabla; getSummary, getSummaries, RefreshSummaries y el evento SummaryCalculated. El pie es un tfoot fijo abajo.",
  "spec": [
   "§2-a",
   "§2-b",
   "§2-c",
   "§2-d",
   "§2-e",
   "§2-f",
   "§2-g",
   "§2-h",
   "§2-i",
   "§2-j",
   "§2-k",
   "§2-l",
   "§2-n"
  ],
  "requiere": [
   "summary"
  ]
 },
 {
  "archivo": "b02-mascaras.html",
  "titulo": "Máscaras de captura",
  "tipo": "v2",
  "descripcion": "mask con patrones (9 dígito, A letra, X letra o dígito, * cualquiera, \\\\ escape) y presets rfc, curp, cp, tel, email, percent, upper y lower. mask-keep decide si DataArray guarda con o sin literales; MaskInvalid avisa y se puede cancelar.",
  "spec": [
   "§3-a",
   "§3-b",
   "§3-c",
   "§3-d",
   "§3-e",
   "§3-f",
   "§3-g"
  ],
  "requiere": [
   "mask"
  ]
 },
 {
  "archivo": "b03-calc.html",
  "titulo": "Expresiones numéricas (calc)",
  "tipo": "v2",
  "descripcion": "calc=\"true\" en columnas Number: si el texto empieza con \"=\", se evalúa sin eval: =120*1.16, =1500+16% (como calculadora), =(3+2)*4. El resultado llega a DataArray como cadena canónica (R9). Con error se dispara MaskInvalid con reason \"calc\".",
  "spec": [
   "§3-h",
   "§3-i",
   "§0-R9"
  ],
  "requiere": [
   "calc"
  ]
 },
 {
  "archivo": "b04-seleccion.html",
  "titulo": "Selección de varias filas",
  "tipo": "v2",
  "descripcion": "multi-select=\"checkbox\" agrega una columna del sistema con casillas (y \"todas\" en el encabezado, con estado intermedio); multi-select=\"row\" usa Ctrl+clic, Mayús+clic y Espacio. Las filas marcadas llevan et-row-checked; la fila actual sigue siendo EdiTable-Row-Selected. Abajo, el total de lo seleccionado.",
  "spec": [
   "§4-a",
   "§4-b",
   "§4-c",
   "§4-d",
   "§4-e",
   "§4-f",
   "§4-g",
   "§4-h",
   "§2-d"
  ],
  "requiere": [
   "multiselect"
  ]
 },
 {
  "archivo": "b05-portapapeles.html",
  "titulo": "Copiar al portapapeles",
  "tipo": "v2",
  "descripcion": "Ctrl+C sin editar copia las filas seleccionadas (con títulos) o la celda actual, separadas por tabulaciones y \\\\r\\\\n, con los valores formateados y solo las columnas visibles: se pega directo en Excel. BeforeCopy permite cambiar o cancelar el texto.",
  "spec": [
   "§4-j",
   "§4-k",
   "§4-l",
   "§4-m",
   "§1-C2"
  ],
  "requiere": [
   "clipboard",
   "multiselect"
  ]
 },
 {
  "archivo": "b06-exportar.html",
  "titulo": "Exportar a CSV y XLSX",
  "tipo": "v2",
  "descripcion": "El componente da getExportData, exportCSV y downloadCSV; el XLSX lo arma InduxsoftExcel (archivo aparte: induxsoft.controls.excel.js) con fromEditTable, sin dependencias. Respeta el orden y la visibilidad de las columnas, excluye no-print y puede incluir totales y solo la selección.",
  "spec": [
   "§5-a",
   "§5-i",
   "§5-j",
   "§5-src-et",
   "§5-workbook",
   "§5-d",
   "§5-g"
  ],
  "requiere": [
   "export"
  ]
 },
 {
  "archivo": "b06b-excel-sin-edittable.html",
  "titulo": "InduxsoftExcel sin EdiTable",
  "tipo": "v2",
  "descripcion": "La biblioteca InduxsoftExcel no depende de EdiTable: esta página no lo carga. Exporta un arreglo de objetos (fromArray, con columnas inferidas, rutas con punto y valores calculados) y una tabla HTML normal (fromTable: thead, tbody, tfoot como totales, colspan/rowspan, no-print, data-value, números con formato mexicano), en archivos sueltos, en un libro de varias hojas o como CSV.",
  "spec": [
   "§5-a",
   "§5-src-array",
   "§5-src-table",
   "§5-merge",
   "§5-workbook",
   "§5-csv",
   "§5-d",
   "§5-f"
  ],
  "requiere": []
 },
 {
  "archivo": "b06c-locale-dos-tablas.html",
  "titulo": "Locale: dos tablas, es-MX y es-CO",
  "tipo": "v2",
  "descripcion": "R7 y C16: cada tabla declara su locale (locale=\"es-MX\" y locale=\"es-CO\"; un lang heredado no cambia la presentación, P29). La de México muestra $1,234.50; la de Colombia, $1.234,50, acepta 1234,5 en su editor y ambas se exportan con valores numéricos correctos en un mismo libro; toCSV usa coma o punto y coma según el locale.",
  "spec": [
   "§0-R7",
   "§1-C16",
   "§5-workbook",
   "§5-csv"
  ],
  "requiere": []
 },
 {
  "archivo": "b06d-fechas-servidor.html",
  "titulo": "Fechas del servidor (C17 y C18)",
  "tipo": "v2",
  "descripcion": "Valores como los entrega MySQL (2026-02-01 10:30:00) y JavaScript (2026-02-01T00:00:00.000Z) en columnas Date y DateTime. El botón entra a cada celda, abre el editor y confirma sin cambiar nada: en la versión actual se borran o se reescriben valores (C17); en la versión 2 el editor recibe el valor en ISO (C18) y DataArray no cambia.",
  "spec": [
   "§1-C17",
   "§1-C18",
   "§0-R9"
  ],
  "requiere": []
 },
 {
  "archivo": "b07-fijas.html",
  "titulo": "Columnas fijas",
  "tipo": "v2",
  "descripcion": "fixed=\"left\" deja Código y Descripción fijas al desplazar horizontalmente (position: sticky, sin una segunda tabla). FixColumn(field, true|false) fija o suelta; la última fija lleva sombra (et-fixed-last).",
  "spec": [
   "§6-a",
   "§6-b",
   "§6-c",
   "§6-d",
   "§6-e",
   "§6-f",
   "§6-g"
  ],
  "requiere": [
   "fixed"
  ]
 },
 {
  "archivo": "b08-selector-columnas.html",
  "titulo": "Mostrar y ocultar columnas",
  "tipo": "v2",
  "descripcion": "column-chooser=\"true\" agrega un botón en la esquina del encabezado y un menú con clic derecho sobre el th: casillas por columna, Fijar o soltar, Ajustar ancho y Restablecer diseño. chooser=\"false\" deja una columna fuera del menú. También HideColumn, ShowColumn, IsColumnVisible y getVisibleColumns.",
  "spec": [
   "§7-a",
   "§7-b",
   "§7-c",
   "§7-d",
   "§7-e",
   "§7-f",
   "§7-g"
  ],
  "requiere": [
   "chooser"
  ]
 },
 {
  "archivo": "b09-reordenar.html",
  "titulo": "Reordenar columnas",
  "tipo": "v2",
  "descripcion": "column-reorder=\"true\": se arrastra el encabezado a otra posición (indicador et-drop-indicator) o con Ctrl+Mayús+flechas sobre el encabezado enfocado. Columns, encabezado, celdas y pie se mueven juntos. reorder=\"false\" bloquea una columna; BeforeColumnMove se puede cancelar.",
  "spec": [
   "§8-a",
   "§8-b",
   "§8-c",
   "§8-d",
   "§8-e",
   "§8-f"
  ],
  "requiere": [
   "reorder"
  ]
 },
 {
  "archivo": "b10-agrupar.html",
  "titulo": "Agrupar arrastrando, con subtotales",
  "tipo": "v2",
  "descripcion": "group-panel=\"true\" muestra un panel arriba de la tabla: se arrastra un encabezado para agrupar, con varios niveles; cada grupo muestra la llave, el número de filas y los subtotales de las columnas con summary. Enter o Espacio expanden y colapsan. DataArray no se reordena.",
  "spec": [
   "§11-a",
   "§11-b",
   "§11-c",
   "§11-d",
   "§11-e",
   "§11-f",
   "§11-g",
   "§11-j"
  ],
  "requiere": [
   "group"
  ]
 },
 {
  "archivo": "b11-diseno.html",
  "titulo": "Diseño: guardar y restaurar",
  "tipo": "v2",
  "descripcion": "getLayout/setLayout con el objeto {v, columns:[{field, order, width, hidden, fixed}], sort, groups}; LayoutChanged con reason; guardado automático en IndexedDB (DesignAutoSave, por omisión activo, con id estable) y DesignKey para una llave propia; ResetLayout y ForgetLayout. Cambie anchos, orden o columnas y recargue la página.",
  "spec": [
   "§9-a",
   "§9-b",
   "§9-c",
   "§9-d",
   "§9-e",
   "§9-f",
   "§9-g",
   "§9-h",
   "§9-i",
   "§9-j",
   "§9-k",
   "§9-p"
  ],
  "requiere": [
   "layout"
  ]
 },
 {
  "archivo": "b12-virtual-20000.html",
  "titulo": "Virtualización con 20,000 filas",
  "tipo": "v2",
  "descripcion": "virtual-rows=\"true\" con row-height: solo se dibujan las filas visibles más 10 de margen, con filas de relleno tr.et-spacer en el mismo tbody. El teclado y CellFocus desplazan a la fila; al imprimir se dibujan todas (RenderAll).",
  "spec": [
   "§10-e",
   "§10-f",
   "§10-g",
   "§10-h",
   "§10-i",
   "§10-j",
   "§10-k",
   "§10-m"
  ],
  "requiere": [
   "virtual"
  ]
 },
 {
  "archivo": "b13-devexpress.html",
  "titulo": "Todo junto, \"como DevExpress\"",
  "tipo": "v2",
  "descripcion": "Una lista con todas las funciones de la versión 2 encendidas: totales, columnas fijas, selector de columnas, reordenar, agrupar, selección con casillas, copiar, exportar, diseño guardado y virtualización.",
  "spec": [
   "§2-a",
   "§4-b",
   "§4-j",
   "§5-src-et",
   "§6-a",
   "§7-c",
   "§8-b",
   "§9-g",
   "§10-e",
   "§11-b"
  ],
  "requiere": [
   "summary",
   "multiselect",
   "clipboard",
   "export",
   "fixed",
   "chooser",
   "reorder",
   "layout",
   "virtual",
   "group"
  ]
 },
 {
  "archivo": "p1-captura-venta.html",
  "titulo": "Piloto: captura de documento de venta",
  "tipo": "v2",
  "descripcion": "Paquete V12 \"ventas\": partidas con totales en el pie, calc en cantidad y precio, columnas fijas (código y descripción) y diseño recordado. Datos ficticios.",
  "spec": [
   "§12-1",
   "§2-a",
   "§3-h",
   "§6-a",
   "§9-g"
  ],
  "requiere": [
   "summary",
   "mask",
   "calc",
   "fixed",
   "layout"
  ]
 },
 {
  "archivo": "p2-movimiento-inventario.html",
  "titulo": "Piloto: movimiento de inventario",
  "tipo": "v2",
  "descripcion": "Paquete V12 \"movinv\": entrada o salida de almacén con máscara en el lote, totales de cantidad y costo, columnas fijas y diseño. Datos ficticios.",
  "spec": [
   "§12-2",
   "§2-a",
   "§3-b",
   "§6-a",
   "§9-g"
  ],
  "requiere": [
   "summary",
   "mask",
   "calc",
   "fixed",
   "layout"
  ]
 },
 {
  "archivo": "p3-lista-productos.html",
  "titulo": "Piloto: lista de productos de inventario",
  "tipo": "v2",
  "descripcion": "Lista de V12 (catprod) con 8,000 productos: virtualización, mostrar y ocultar, reordenar, agrupar, selección, exportar y diseño. La acción por registro sigue usando DataArray[CurrentRowIndex()].sys_pk.",
  "spec": [
   "§12-3",
   "§10-e",
   "§7-c",
   "§8-a",
   "§11-a",
   "§4-b",
   "§5-src-et",
   "§9-g",
   "A.v12"
  ],
  "requiere": [
   "virtual",
   "chooser",
   "reorder",
   "group",
   "multiselect",
   "export",
   "layout"
  ]
 },
 {
  "archivo": "p4-clientes.html",
  "titulo": "Piloto: catálogo de clientes",
  "tipo": "v2",
  "descripcion": "Catálogo de clientes de V12 con virtualización, mostrar y ocultar, reordenar, agrupar por ciudad o vendedor, selección con totales de saldo y exportar. RFC genéricos del SAT.",
  "spec": [
   "§12-4",
   "§10-e",
   "§7-c",
   "§8-a",
   "§11-a",
   "§4-b",
   "§2-d",
   "§5-src-et",
   "§9-g"
  ],
  "requiere": [
   "virtual",
   "chooser",
   "reorder",
   "group",
   "multiselect",
   "summary",
   "export",
   "layout"
  ]
 },
 {
  "archivo": "p5-bandeja-agentes.html",
  "titulo": "Piloto: bandeja de los agentes",
  "tipo": "v2",
  "descripcion": "agent.induxsoft.net: conversaciones de los agentes con selección para reasignar o cerrar varias a la vez, mostrar y ocultar columnas y diseño recordado; tarjetas en pantallas angostas (sin virtualización en tarjetas).",
  "spec": [
   "§12-5",
   "§4-b",
   "§7-c",
   "§9-g",
   "A.tarjetas"
  ],
  "requiere": [
   "multiselect",
   "chooser",
   "layout"
  ]
 },
 {
  "archivo": "p6-comprobantes-cfdi.html",
  "titulo": "Piloto propuesto: comprobantes de FactuDesk",
  "tipo": "v2",
  "descripcion": "Lista de comprobantes (CFDI) de FactuDesk v12: totales del periodo, selección para descargar o reenviar varios, exportar a Excel y columnas fijas. UUID y RFC ficticios.",
  "spec": [
   "§12-6",
   "§2-a",
   "§4-b",
   "§5-src-et",
   "§6-a"
  ],
  "requiere": [
   "summary",
   "multiselect",
   "export",
   "fixed"
  ]
 }
];
