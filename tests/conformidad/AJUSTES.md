# Ajustes a la batería de conformidad (integración F2–F4)

*Integración de F2, F3 y F4 sobre F1 (rama `integracion-f2-f4`, 2026-11-01).* Son pruebas cuyos supuestos contradecían
la spec o el comportamiento actual, no defectos del componente. Cada renglón: prueba → motivo → cambio.

| Prueba | Motivo | Cambio |
|---|---|---|
| `fij-02` (`v06-columnas.mjs`) | Esperaba `position: static` en un `th` no fijo, pero el CSS base del componente ya pone `position: relative` en los `th` (desde `0ed1824`). | El `td` fijo debe ser `sticky`; el `th` no fijo puede ser `relative` o `static` (cualquiera que no sea `sticky`). |
| `fij-06` (`v06-columnas.mjs`) | Igual que `fij-02`: al soltar una columna esperaba `static`. | Basta con que deje de ser `sticky` (`relative` o `static`). |
| `dis-03` (`v09-diseno.mjs`) | Suponía que el ancho declarado en `setLayout` (150) es el que se ve, pero la tabla mide 700 px y reparte el sobrante. | Se compara contra una carga limpia de la misma página (otro contexto) que declara `precio` con `width="150px"` y aplica el mismo orden y visibilidad. Además, `getLayout()` debe devolver `width` 150. |
| `dis-31` (`v09-diseno.mjs`) | Suponía que el ancho declarado (200 px) es el que se ve en la página nueva de 800 px. | Se compara contra una carga limpia (otro contexto, sin IndexedDB) de la misma página nueva. |
| `dis-40` y `dis-43` (`v09-diseno.mjs`) | Comparaban el ancho de `codigo` entre la página A y la B, que tienen distinta visibilidad y orden (cambia el reparto del ancho). | Cada una se compara contra sí misma en la misma página B: `getLayout()` debe traer el ancho guardado en A, y el ancho que se ve debe ser igual al de una carga limpia de B a la que se le aplica por código (`setLayout`, `silent`) el diseño que quedó restaurado. |
| `dis-24`, `dis-30` y `dis-31` (`v09-diseno.mjs`) | Compartían la ruta `/pantallas/productos.html` en paralelo; `dis-31` la reemplaza con `srv.registrar` y las otras recargan, así que una podía cargar la página de otra. | Rutas únicas: `/pantallas/productos-24.html`, `-30.html` y `-31.html`. Las pruebas de la llave siguen en la ruta original. |
| `r1-01` a `r1-10` (`v12-limites-y-r1.mjs`) | La sonda registraba todos los `Const.Events` del componente bajo prueba. Registrar un evento nuevo ya es usar algo nuevo: por ejemplo, con un manejador de `LayoutChanged` (F3) aparecía `layoutchanged` al ordenar (`r1-01`, `r1-05`). | La lista de eventos se toma de `Const.Events` de la referencia (`0ed1824`), que se abre primero, y se usa la misma en las dos páginas. |
| `clp-*` (`run.mjs`) | El portapapeles de Chromium headless se comparte entre contextos: en paralelo, una prueba leía lo que copió otra (por ejemplo, `clp-09` leyó `"Tor"`). | El runner corre las `clp-*` como seriales (al final, solas), igual que las de rendimiento. |
| `num-C16c` (`c02-correcciones-number.mjs`) | Esperaba que un `lang="es-CO"` heredado cambiara la presentación. P29 (spec §13) lo descarta: C16 solo aplica con `locale` explícito. | La tabla declara `locale="es-CO"` dentro del ancestro `lang="es-CO"` y muestra `$1.234,50`; una segunda tabla en el mismo ancestro sin `locale` sigue en `$1,234.50`. El ejemplo `examples/v2/b06c-locale-dos-tablas.html` (y su descripción en `ejemplos.js`) usa `locale="es-MX"` y `locale="es-CO"` explícitos. |
| `sum-13` (`v02-totales.mjs`) | Suponía que `AddRow()` agrega una entrada a `DataArray`; hoy `AddRow` (`InsertRow` sin índice) solo agrega la fila al DOM y la entrada se crea al editar. | Se comprueba que `AddRow()` sin datos no cambia el total y la fila de datos nueva se crea con `InsertRow(DataArray.length)`. |
| `r9-loc-*`, `r9-loc-nonum`, `r9-date-loc` (`c03-correcciones-c17-c18-r9.mjs`) y `msk-r7-01b` (`v03-mascaras-dom.mjs`) | **Decisión del coordinador (2026-11-01) durante la integración.** El atributo `locale` de la tabla ya existía para `format="relative"`; con F2 cambiaba a `type="text"` los editores de todas las Number y Date de esas tablas. Ahora el `locale` de la columna activa siempre el editor propio, y el de la tabla solo en las Number con `format` numérico y en las Date con `date-display="locale"`. Hay que actualizar el texto de R7 en la spec. | `r9-*` declaran el `locale` en la columna. `msk-r7-01b` usa una Number con `format` (editor propio, acepta `1234,5`) y comprueba que la Number sin `format` de la misma tabla sigue con el control nativo. Prueba nueva `cmb-loc-relativo` (suite `v2-combinados`). |
| `gen-02` (`v00-general.mjs`) | Exige las 12 banderas de R6; `virtual` y `group` llegan con F5 y F6. | Sigue exigiendo las 12, con `requiere: ['virtual', 'group']`: mientras falten queda **pendiente de F5/F6**; con F2–F4 integradas solo faltan esas dos. |

## Fuera de la batería

- `tests/excel/validate.py`: `edittable: versión del componente detectada` esperaba `1`. Con F4 el componente tiene
  `getExportData` y `fromEditTable` toma el camino v2 (las demás comprobaciones de ese bloque pasan igual). Ahora espera `2`.

## Rutas únicas en toda la suite de diseño (coordinador, 2026-11-01)

| Prueba | Motivo | Cambio |
|---|---|---|
| `dis-*` que todavía usaban `RUTA` (entre ellas `dis-23` y `dis-26`) | Con `--paralelo` > 1, dos pruebas registraban páginas distintas en la misma ruta. `dis-26` reemplazaba la página de `dis-23` (una tabla sin `id`) justo cuando `dis-23` recargaba, así que el ancho no se restauraba (verificado: pasa 3 de 3 sola y falla en paralelo) | Cada prueba usa su propia ruta: `R('<id>')` |
| `grp-17` (`v11-agrupacion.mjs`) | Suponía que `AddRow()` agrega una entrada a `DataArray` (mismo caso que `sum-13`). | El índice de la fila nueva se toma como `DataArray.length` antes de `AddRow()`. |

## Integración F5+F6 (rama `integracion-f5-f6`, decisiones del coordinador, 2026-11-01)

| Prueba | Motivo | Cambio |
|---|---|---|
| `vir-02`, `vir-04`, `vir-11` (`v10-rendimiento.mjs`) y `lim-06` (`v12-limites-y-r1.mjs`) | Desplazaban `#sc`, pero sin `control-styles` el que desplaza es el div interno del componente (`overflow:auto`); `#sc` no se mueve y no se dibujaba la zona pedida. | Las páginas declaran el `control-styles` real de V12, `div:has(table#t1){overflow:revert !important}`, así que el scroll vive en `#sc`, como en V12. |
| `ren-06` (`v10-rendimiento.mjs`) | Exigía `tr._etData === DataArray[i]` en árbol, pero el banco (R1) congela que `onRowPaint` reciba una copia en el modo árbol. Manda el banco. | Acepta el mismo objeto o una copia equivalente en contenido (cada campo de `DataArray[i]` con el mismo valor). |
| `ren-03` (`v10-rendimiento.mjs`) | `NavTo` < 16 ms con 5,000 filas sin virtualizar depende del recálculo de estilos de Chrome con todo el DOM dibujado (se midió 272 ms en el laboratorio). | La meta de 16 ms se exige solo con `virtual-rows`. Sin él, el tiempo queda como nota informativa en el informe. |
| `vir-19` (nueva, `v10-rendimiento.mjs`) | Árbol + `virtual-rows`: se decidió mantener el árbol sin virtualizar. | Comprueba que con `show-tree` y `virtual-rows` se dibujan todas las filas, sin `tr.et-spacer`, y que hay un solo `console.warn` que menciona `virtual-rows`. |
| `ren-03` (`v10-rendimiento.mjs`), segunda vez | Con `virtual-rows`, una sola medición de `NavTo(4000)` variaba entre 13 y 25 ms en headless con 2 CPU y fallaba de forma intermitente. | Se toma la mediana de 5 saltos (4000 y regreso a 0); el límite sigue en 16 ms. |

## F8a: búsqueda, validación de fila, getChanges, captura y reglas (rama `f8-funcional`, 2026-11-01)

| Prueba o arnés | Motivo | Cambio |
|---|---|---|
| Banco, `tests/lib/navegador.js` (registrador del modo `all`) | El modo `all` pone un registrador en **todos** los eventos de `Const.Events`. Con `BeforeRowLeave`, tener un manejador ya es activar la función: la edición se confirma antes de cambiar de fila y se dispara el evento. Daba 65 escenarios `DIFERENTE` que solo agregaban `beforerowleave` (mismo caso que `r1-*` arriba). | El registrador automático no atiende `beforerowleave` (`SOLO_CONSUMIDOR`). Si el escenario pone su propio manejador, se registra igual que los demás. Con eso el banco completo sale 267 iguales y 6 informativos de 273. |
| `examples/v2/_comun/demo.js` (`Demo.observar`) | Mismo motivo: envolvía todos los eventos, incluido `beforerowleave`, así que activaba la validación en todos los ejemplos. | Igual que con `badgeclick`: solo lo envuelve si la página pone su propio manejador. Se agregan `searchchanged`, `filterchanged` y `beforerowleave` a la lista de eventos que se muestran. |
| `edicion/api-startedit-confirm-cancel` (banco) | El banco congela que `StartEdit` sin selector lance `TypeError` y deje `Editing=true`. Una guarda en `StartEdit` lo cambiaba. | Se quitó la guarda. El defecto del tecleo rápido (encargo 1) se resuelve sin tocar `StartEdit`: las teclas que llegan antes de que exista el editor se acumulan (`_f8Tecleo`). |
| `dis-24` (`v09-diseno.mjs`) | Encargo 5: la restauración del diseño guardado ahora dispara `LayoutChanged` con `reason:'restore'`. | Sin cambio: `dis-24` ya filtra solo las razones de usuario (`resize`, `move`…), así que sigue pasando. |
| Suite nueva `v15-f8a-funcional.mjs` | 91 pruebas: `bus-` (27), `val-` (13), `chg-` (12), `cap-` (15), `reg-` (15), `enc-` (8, encargos de la integración) y `f8a-features`. | Los renglones `§F8a-*` están en `spec-renglones.mjs`. |
| Banco: `impresion/*`, `v12/impresion-media-print`, `defectos/afterprint-muestra-ocultas` (2026-11-02) | Al imprimir, el contenedor interno conservaba `overflow:auto` y los anchos fijos; la tabla salía con barra de scroll y recortada a la derecha. | Regla `@media print` insertada en el CSSOM (sin cambiar el texto de los `<style>`): contenedor `overflow:visible`, tabla al 100 % y anchos automáticos con ajuste de línea. Cambian solo los estilos calculados en modo impresión de esos 5 escenarios; referencias regeneradas. |
