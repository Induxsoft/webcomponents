# InputKey 2: propuesta de mejoras

Revisión del componente `<input-key>` (`src/js/induxsoft.controls.js`, `main` `4030a4f`, ya con las correcciones IK-1 a IK-5). La maqueta `maqueta.html` (en esta carpeta) ilustra la apariencia propuesta.

## Punto de partida (verificado en el código)

- **Dos piezas.** Un campo visible (`#container`: buscador + descripción de solo lectura + botones «…», agregar, editar y limpiar) y una ventana modal (`#container2`). La modal mide 40rem × 30rem fijos y siempre aparece centrada, sin anclarse al campo ni a la celda.
- **Uso oculto, el caso más delicado.** En venta, compras y movimientos de inventario, el control se declara con `control-styles="#container{display:none !important;}"` y `hidden-input="false"` (por ejemplo `ventas/src/ventas/venta/form.dk:722-728`). Solo se usa su ventana, abierta por EdiTable con `searchText()` o `_search(false)`.
  - **Regla de compatibilidad:** los ids `#container` y `#container2` y ese `control-styles` deben seguir funcionando igual.
- **Estilo propio, aislado.** Usa clases tipo Bootstrap copiadas dentro del shadow DOM, con colores fijos: azul `#3D75DD` en la selección, gris `#F5F5F5`, `outline` de 1px. No tiene variables CSS, temas ni modo oscuro, así que no puede verse igual que EdiTable 2.
- **Defectos visuales:**
  - Las ventanas de agregar y editar dibujan su X en blanco (`fill="#FFF"`) sobre un fondo blanco, así que no se ve (líneas 367 y 386).
  - Si no hay resultados, la lista inserta un `<p>` dentro del `<tbody>`, que es HTML inválido.
  - Los avisos usan `alert()` («Debe seleccionar un registro…»).
- **Teclado parcial.** Las flechas mueven el foco fila por fila con `keyup` y Enter acepta. No hay RePág/AvPág ni Inicio/Fin, no se puede refinar la búsqueda tecleando sobre la lista y nada se anuncia a lectores de pantalla.
- **Búsqueda.** Solo con Enter, al salir del campo o con el botón. Trae todo lo que devuelve el servidor, sin límite ni paginación. Los textos de la interfaz están fijos en español.

## Principio de compatibilidad (igual que EdiTable 2, R1/R8)

- Sin atributos nuevos, el control se ve y se comporta como hoy.
- La apariencia nueva se activa con `theme` (los mismos valores de EdiTable: `claro`, `oscuro`, `jade`, `libro-mayor`, `auto`) o con `appearance="2"`.
- Las funciones nuevas se activan cada una con su atributo.
- Se conservan:
  - los ids internos de los que dependen los `control-styles` de los sitios (`#container`, `#container2`, `#search_container`, `#input_search_container`, `#description_container`);
  - `searchText`, `_search`, `setValue`, `getValue`, `clear`, `change_event` y `onBeforeSearch`.

## A. Apariencia

| # | Mejora | Detalle |
|---|---|---|
| A1 | **Temas compartidos con EdiTable** | `theme`, `palette` y `SetPalette` con la **misma lista de variables `--et-*`** (`--et-bg`, `--et-fg`, `--et-header-bg`, `--et-sel-bg`, `--et-accent`, `--et-border`, `--et-radius`, `--et-focus-ring`, `--et-mark-bg`…). Precedencia: respaldo interno < tema < variables externas < `palette`. Un tema de V12 definido con `EditTable.defineTheme` o con CSS en `:root` pinta a la vez las tablas y los buscadores. |
| A2 | **Herencia del tema de la tabla** | Si EdiTable abre el InputKey desde una celda y el InputKey no declara `theme`, toma el de la tabla que lo abrió. Así la ventana combina con la tabla. |
| A3 | **Campo unificado** | Código y descripción en una sola caja con borde y radio del tema, separados por una línea fina. Los botones son iconos dentro de la caja: buscar, limpiar (solo con valor), agregar y editar (solo si hay URL). Se quitan los botones sueltos con `outline`. |
| A4 | **Estados visibles** | Vacío (con placeholder), con valor, buscando (spinner en el botón de búsqueda), no encontrado o inválido (borde `--et-error` y mensaje debajo, en vez de `alert()`), deshabilitado, requerido sin valor y foco visible (`:focus-visible` con `--et-focus-ring`). |
| A5 | **Resultados en panel anclado** | En modo campo, los resultados se abren en un panel pegado debajo del campo, o arriba si no cabe, con el ancho del campo o el que pidan las columnas. En una celda de EdiTable, el panel se ancla a la celda. La modal centrada queda para `mode="dialog"` y para pantallas angostas, donde se muestra como hoja inferior. |
| A6 | **Lista de resultados con el estilo de EdiTable** | Encabezado fijo, filas alternadas, fila activa con `--et-sel-bg`, coincidencias resaltadas en amarillo (`--et-mark-bg`), números a la derecha con dígitos tabulares, código en monoespaciada, contador («12 de 340»), estado vacío con texto e ícono y, si hay `add-url`, la acción «Crear "texto"». |
| A7 | **Pie con ayuda de teclado** | `↑↓ moverse · Enter elegir · Esc cerrar · F3 más resultados`. Los botones Aceptar y Cancelar se mantienen en el modo diálogo. |
| A8 | **Agregar y editar con el mismo marco** | El mismo encabezado del tema en las ventanas de agregar y editar, con la X visible (corrige el `fill="#FFF"`), el título del registro y un estado de carga mientras abre el iframe. |
| A9 | **Densidad** | `density="compacta\|normal\|comoda"`, igual que EdiTable: el modo compacto para captura rápida y el cómodo para pantallas táctiles. |
| A10 | **Accesibilidad** | `role="combobox"` en el campo, `aria-expanded`, `aria-controls`, `role="grid"` en la lista, `aria-activedescendant` en la fila activa, `aria-live` con el número de resultados, y etiquetas de los botones (`aria-label`), no solo `title`. |
| A11 | **Textos configurables** | Además de `box-title-text`, `box-placeholder-text` y `box-nodata-text`, también Aceptar, Cancelar, «Debe seleccionar…» y los títulos de las ventanas de agregar y editar. Un objeto `InputKey.textos` global sirve para traducir. |

## B. Funcionales

| # | Mejora | Detalle |
|---|---|---|
| B1 | **API para el modo oculto** | `mode="field\|dialog\|headless"`, donde `headless` equivale al `#container{display:none}` de hoy pero declarado y documentado. Métodos: `open(texto, {anchor})`, `close()` y **`pick(texto, opciones) → Promise<registro\|null>`**, que resuelve al elegir y da `null` al cancelar. Así EdiTable y las pantallas escriben `const r = await ik.pick(texto)` en vez de encadenar `change_event`. |
| B2 | **Eventos estándar** | `CustomEvent` `ik-select`, `ik-cancel`, `ik-search` e `ik-error` (con `bubbles` y `composed`), además de `change_event` y `onBeforeSearch`, que se conservan. |
| B3 | **Búsqueda mientras se teclea (opcional)** | `live-search="true"` con `min-chars` (2 por omisión) y `debounce` (250 ms). Ya existe la cancelación de búsquedas viejas (IK-5); esto la aprovecha. |
| B4 | **Límite y «ver más»** | `page-size="50"`: la URL recibe `@limit` y `@offset` (además de `@search`), y la lista ofrece «Ver más» o F3. Sin `page-size`, todo queda como hoy. Corrige el patrón de traer el catálogo completo, que ya vimos en la búsqueda de productos de la venta. |
| B5 | **Caché por texto** | `cache-ttl="60"` (segundos): repetir una búsqueda no vuelve al servidor. Útil cuando se capturan partidas que repiten productos. |
| B6 | **Recientes** | `recent="5"`: al abrir sin texto se muestran los últimos registros elegidos, guardados por `data-source` en `localStorage`. Si ya hay texto, desaparecen. |
| B7 | **Teclado completo** | En el campo: F4 o Alt+↓ abre, Enter busca o acepta y Tab acepta la fila activa (opcional, `tab-accepts`). En la lista: ↑↓, RePág/AvPág, Inicio/Fin, Enter acepta, Esc cierra, y teclear un carácter vuelve al cuadro de búsqueda conservando lo escrito. Hoy se navega con `keyup`; se pasa a `keydown` para que la tecla sostenida repita. |
| B8 | **Columnas declarativas** | `columns` acepta, además de la lista de campos, un JSON: `[{"field":"precio","title":"Precio","type":"money","align":"end","width":"90px"}]`. Así las columnas tienen formato de moneda, número o fecha, alineación y ancho, y se pueden ocultar las técnicas, como los códigos de barras que hoy se ven en la venta. |
| B9 | **Origen como función** | `ik.dataSource = async (texto, {limit, offset, signal}) => filas`. Sirve para buscar en memoria, en IndexedDB o en otro API sin URL. `data-source-array` filtra en las columnas indicadas por `search-fields`, no solo en `data-search`. |
| B10 | **Modo estricto y validación** | `strict="true"`: si lo escrito no corresponde a un registro, el campo queda inválido y se notifica, en vez de quedar con un texto suelto. `required` deja de ser solo un `input` oculto, y `checkValidity()` y `reportValidity()` funcionan como en un control nativo (`ElementInternals`, con `formAssociated`). |
| B11 | **Cargar un registro por llave** | `load(llave)` busca el registro por `data-key` y lo muestra. Sirve para abrir documentos existentes sin pasar todo el objeto con `data-value`. |
| B12 | **Alta y edición que devuelven el registro** | La ventana de agregar o editar (iframe) avisa con `postMessage({ik:'saved', record})`, e InputKey selecciona el registro creado sin que el usuario lo busque otra vez. |
| B13 | **Varios resultados con uno exacto** | `autoselect-exact="true"`: con `100` y `1000`, si `100` es exacto, se toma solo. Queda a decisión de Emmanuel (la pregunta del informe de IK-3). |
| B14 | **Selección múltiple en el diálogo** | `multiple="true"`: casillas por fila y `pick()` devuelve un arreglo. Sirve para agregar varias partidas de una vez (pedido rápido, conteo físico). |
| B15 | **Errores de red visibles** | Hoy, si la búsqueda falla, se muestra un `alert`. Con la apariencia nueva, el mensaje va dentro del panel con un botón «Reintentar», y se usa un tiempo máximo configurable (`timeout`). |
| B16 | **Mayúsculas y minúsculas** | `search-case="lower\|keep"` (por omisión `lower`, como hoy) para orígenes que distinguen mayúsculas y minúsculas. |
| B17 | **Integración con EdiTable 2** | Anclar el panel a la celda (incluso con columnas fijas o filas virtuales), heredar el tema (A2), devolver el foco a la celda y avanzar según la secuencia de captura (`enter-mode`) al aceptar. Se puede exponer una columna `type="lookup"` de EdiTable que use InputKey por dentro. |

## C. Orden sugerido

1. **Primero lo que más se nota y menos riesgo tiene:** A1–A4, A6, A8 (la X invisible), A10, B2, B7 y B15. Es la apariencia nueva con temas, el teclado completo y quitar los `alert()`. Todo se activa con `theme` y no cambia el modo oculto de hoy.
2. **Después:** A5 (panel anclado), B1 (`pick()` y `mode`), B8 y B17. Aquí es donde se integra con EdiTable.
3. **Al final:** B3–B6 y B9–B14, según lo pida cada pantalla.

Cada paso con las pruebas del banco privado de la venta (`v12_qa/pruebas-edittable/`, 18 escenarios con InputKey) y pruebas unitarias en `tests/inputkey/`. Sin atributos nuevos, todo debe salir igual a hoy.

## Decisiones para Emmanuel

1. Activar la apariencia nueva con `theme` (igual que EdiTable) o además con `appearance="2"`, para tener la apariencia nueva sin elegir tema.
2. En modo campo, ¿panel anclado por omisión cuando hay `theme`, o mantener la modal centrada y que el panel sea opcional (`mode="popover"`)?
3. Nombres de los atributos nuevos: `mode`, `live-search`, `page-size`, `recent`, `strict`, `multiple` y `autoselect-exact`, además de `autoselect` y `autoselect-fields`, que ya existen desde IK-3 como propuesta.

## Decisiones de Emmanuel (2026-11-02)

1. La apariencia nueva se activa **solo con `theme`**. No habrá `appearance="2"`.
2. El panel anclado es **opcional**. Aunque haya tema, la ventana de resultados sigue siendo la modal centrada de hoy, salvo que se pida el panel con `popup="anchored"`. El control se usa en muchos lugares y no se sabe dónde podría afectar un cambio de comportamiento.
3. Nombres: propuestos abajo, en espera de aprobación.

## Nombres propuestos

Convenciones de EdiTable 2: atributos en kebab-case y propiedades en Pascal (R5). Los eventos se registran en el `addEventListener` sobrescrito (R4), con nombres en Pascal como los de EdiTable.

**Aviso, verificado:** hoy el `addEventListener` de InputKey solo atiende `'change'` y descarta **sin error** cualquier otro nombre. No llama a `super`, así que un `click` registrado así nunca se ejecuta. Para no cambiar eso, los eventos nuevos entran como casos explícitos del `switch` y todo lo demás sigue descartándose.

### Atributos

| Atributo | Propiedad | Valores (omisión) | Qué hace | Punto |
|---|---|---|---|---|
| `theme` | `Theme` | `claro`, `oscuro`, `jade`, `libro-mayor`, `auto` (ninguno) | Activa la apariencia nueva con ese tema. Sin `theme`, todo como hoy. | A1 |
| `palette` | `Palette` / `SetPalette()` | JSON de variables `--et-*` | Fija la paleta, igual que en EdiTable. | A1 |
| `density` | `Density` | `compacta`, `normal`, `comoda` (`normal`) | Densidad, igual que en EdiTable. | A9 |
| `popup` | `Popup` | `modal`, `anchored`, `auto` (`modal`) | Dónde salen los resultados: modal centrada (hoy), panel anclado al campo o a la celda, o `auto` (anclado en pantalla ancha y hoja inferior en móvil). | A5 |
| `headless` | `Headless` | `true`, `false` (`false`) | No dibuja el campo, solo la ventana o el panel. Es la forma declarada del `control-styles="#container{display:none}"` de hoy, que sigue funcionando. | B1 |
| `live-search` | `LiveSearch` | `true`, `false` (`false`) | Busca mientras se teclea. | B3 |
| `min-chars` | `MinChars` | número (`2`) | Mínimo de caracteres para `live-search`. | B3 |
| `search-delay` | `SearchDelay` | ms (`250`) | Espera entre teclas antes de buscar. | B3 |
| `page-size` | `PageSize` | número (ninguno: trae todo, como hoy) | Límite por página. La URL recibe `@limit` y `@offset`. | B4 |
| `cache-seconds` | `CacheSeconds` | segundos (`0`, sin caché) | Caché de resultados por texto. | B5 |
| `recent-items` | `RecentItems` | número (`0`) | Cuántos registros recientes mostrar al abrir sin texto. | B6 |
| `tab-accepts` | `TabAccepts` | `true`, `false` (`false`) | Tab acepta la fila activa de la lista. | B7 |
| `columns` | — | lista (hoy) **o** JSON | Además de `codigo,descripcion`, acepta `[{"field","title","type","align","width","hidden"}]`. | B8 |
| `search-fields` | `SearchFields` | lista de campos (`data-search`) | En qué campos filtra `data-source-array`. | B9 |
| `strict` | `Strict` | `true`, `false` (`false`) | Lo escrito debe corresponder a un registro; si no, el campo queda inválido. | B10 |
| `autoselect` | `Autoselect` | `true`, `false`, `exact` (`true`) | **Se amplía el atributo existente** (IK-3) en lugar de crear `autoselect-exact`. `true`: un solo resultado y exacto, como hoy. `exact`: también entre varios resultados, si uno es exacto (`100` frente a `1000`). `false`: nunca. | B13 |
| `autoselect-fields` | `AutoselectFields` | lista de campos | Ya existe (IK-3). | — |
| `multi-select` | `MultiSelect` | `true`, `false` (`false`) | Casillas en la lista; `pick()` devuelve un arreglo. Es el mismo nombre que en EdiTable. | B14 |
| `request-timeout` | `RequestTimeout` | ms (`30000`) | Tiempo máximo de la búsqueda; si se pasa, muestra un error con «Reintentar». | B15 |
| `search-case` | `SearchCase` | `lower`, `keep` (`lower`) | Mandar el texto en minúsculas (hoy) o tal cual. | B16 |
| `texts` | `Texts` | JSON | Textos de la interfaz (Aceptar, Cancelar, avisos, títulos). También `InputKey.texts`, global. | A11 |

### Métodos y propiedades

| Nombre | Qué hace | Punto |
|---|---|---|
| `open(texto?, {anchor?})` | Abre la ventana o el panel con ese texto. Con `anchor` (por ejemplo, el `td`) y `popup="anchored"`, se ancla ahí. | B1 |
| `close()` | Cierra sin seleccionar. | B1 |
| `pick(texto?, {anchor?, multiple?})` → `Promise` | Abre, espera y resuelve con el registro (o un arreglo con `multi-select`). Al cancelar resuelve `null`. | B1 |
| `load(llave)` → `Promise` | Busca por `data-key` y muestra el registro. | B11 |
| `DataSource` (propiedad) | Función `async (texto, {limit, offset, signal}) => filas` en lugar de `data-source`. | B9 |
| `checkValidity()` / `reportValidity()` | Validación nativa de formulario (`required`, `strict`). | B10 |
| `searchText`, `setValue`, `getValue`, `clear`, `onBeforeSearch`, `change_event` | **Se conservan** sin cambios. | — |

### Eventos (con `addEventListener`)

| Evento | Cuándo | Detalle |
|---|---|---|
| `change` | Como hoy | Sin cambios. |
| `Selected` | Al aceptar uno o más registros | `{record}` o `{records}` |
| `Canceled` | Al cerrar sin elegir (Esc, Cancelar, X o clic fuera) | `{text}` |
| `BeforeSearch` | Antes de buscar; se puede cancelar o cambiar el texto | `{text, cancel}` |
| `SearchCompleted` | Al llegar los resultados | `{text, count}` |
| `SearchError` | Si falla la red o se pasa el tiempo | `{text, error}` |
| `Opened` / `Closed` | Al abrir o cerrar la ventana o el panel | `{popup}` |

`BeforeSearch` convive con `onBeforeSearch`, la propiedad de hoy, que se conserva.

`Selected` y `Canceled` sustituyen a los `ik-select` e `ik-cancel` que proponía B2, para seguir la convención de EdiTable.
