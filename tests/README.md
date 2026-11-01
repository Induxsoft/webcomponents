# Banco de pruebas de regresión de EdiTable (F0)

Congela el comportamiento de `src/js/induxsoft.controls.editable.js` tal como está en `0ed1824`, para que cualquier
cambio futuro se compare contra él. **Regla de oro del plan: lo que ya usa EdiTable no puede notar el cambio.** Sin
atributos ni propiedades nuevas, una versión nueva debe reproducir las fotos de referencia **byte por byte**.

El banco no modifica el componente ni las demos de `examples/`.

## Requisitos

- Node 22 y Playwright 1.63 instalados globalmente (`require('playwright')` funciona desde cualquier carpeta), con su
  Chromium. **No hace falta `npm install`**: el banco no tiene dependencias npm propias (usa `node:` y Playwright).
- Las fuentes del laboratorio (DejaVu Sans). Las fotos guardan anchos calculados y capturas: genera y compara la
  referencia en la misma máquina o en una equivalente (el informe avisa si la versión de Chrome es distinta).

## Cómo se corre

```sh
node tests/run.mjs                         # compara contra tests/golden/ (el componente de src/)
node tests/run.mjs --src /ruta/otro.js     # la misma batería contra otra copia del componente
node tests/run.mjs --filtro v12/           # solo los escenarios cuyo id contiene el texto
node tests/run.mjs --update                # REGENERA la referencia (ver «Cuándo se permite actualizar»)
node tests/run.mjs --rendimiento           # además mide rendimiento (tests/out/rendimiento.json)
node tests/run.mjs --solo-rendimiento      # solo rendimiento
node tests/run.mjs --lista                 # lista los escenarios
```

Otras opciones: `--jobs N` (escenarios en paralelo, 2 por omisión), `--sin-png`, `--escenarios-extra <dir>` (se puede
repetir; ver «Escenarios externos»), `--ext nombre=<dir>` (raíz servida en `/ext/<nombre>/`; también por la variable
`ET_EXT_<NOMBRE>`), `--salida <dir>` (por omisión `tests/out/`), `--golden <dir>` (por omisión `tests/golden/`).

**Salida:** `tests/out/report.md` (resumen legible), `tests/out/diff/<carpeta>/<id>.diff` (diferencias por paso y por
categoría), `tests/out/actual/` (las fotos de esta corrida), `tests/out/png/` y `tests/out/resultados.json`.
**Código de salida:** 0 sin diferencias estrictas; 1 si algún escenario es `DIFERENTE`, da `error`, no tiene
referencia o hay referencias sin escenario; 2 si el banco mismo falla. `tests/out/` no se versiona.

Herramientas (y `tests/VERSIONES.md`, el resultado de correr el banco con las versiones de producción):
- `node tests/tools/extraer-v12.mjs [--v12 <clon>]`: vuelve a extraer de Induxsoft/v12 los bloques literales que usan
  los escenarios de V12 (`tests/fixtures/v12/extraido.mjs`).
- `node tests/tools/mutaciones.mjs`: pruebas de mutación del propio banco (ver abajo).
- `node tests/tools/catalogo.mjs`: regenera `tests/CATALOGO.md`.
- `node tests/tools/versiones.mjs --actual <salida>/actual`: separa, en una corrida con otra versión del componente,
  las diferencias que solo se deben a agregados (CSS nuevo, propiedades que no existen) de las de comportamiento.

## Cómo funciona

Cada escenario es una página (HTML generado en memoria, o una demo de `examples/`) y una lista de pasos. Se toma una
**foto** al cargar (`inicio`) y otra después de cada paso. La referencia es el JSON de esas fotos.

- **Servidor:** no hay puerto; `page.route` sirve un origen ficticio `http://et.test`. `/__et/editable.js` y **cualquier
  ruta que termine en `/induxsoft.controls.editable.js`** (demos, copias de los consumidores) responden con el archivo
  de `--src`. `/repo/…` es este repo y `/ext/<nombre>/…` una raíz externa (`--ext`). Todo lo demás se bloquea (no sale
  nada a la red).
- **Shadow DOM abierto (solo pruebas):** `tests/lib/navegador.js` intercepta `Element.prototype.attachShadow` para forzar
  `mode:'open'`. No cambia nada más: el componente recibe el mismo `ShadowRoot` y lo guarda en `this._shadow`, como hoy
  (V12 y otros consumidores usan `_shadow`). La foto registra el modo pedido (`modoShadowPedido: "closed"`) y que
  `_shadow === shadowRoot`.
- **Observación de eventos:** cuando el componente abre su shadow (lo primero de su `DOMContentLoaded`), el banco pone
  un `Proxy` sobre `Events` (también sobre el que se asigne después) que registra cada evento disparado con sus
  `eventArgs` serializados, y si el consumidor cambió `cancel` o `text`. Como `addEventListener` escribe en el mismo
  objeto, se registran las dos formas de suscripción. Dos modos, por escenario (`registro`):
  - `all` (por omisión): además responde con un registrador en los 21 eventos aunque el consumidor no los atienda, para
    ver la secuencia completa. **Esto cambia algunos caminos internos** igual que lo haría un consumidor con
    manejadores: `OnSort` escribe `Columns[i].sort`, y con `BadgeClick` atendido los badges son clicables
    (`et-clickable`, `role`, `tabindex`).
  - `consumer`: solo registra los eventos que el consumidor atiende; el componente sigue los caminos «sin manejador».
- **Callbacks:** `onTdPaint`, `onRowPaint`, `onCardPaint`, `ButtonOnClick` y `BadgeOnClick` se registran aparte, solo si
  el consumidor puso una función (si no, siguen en `null`).
- **Determinismo:**
  - reloj de Playwright instalado y **en pausa** en 2026-06-15 10:00 (UTC-6) con `TZ=America/Mexico_City` y `es-MX`;
    el banco lo avanza en cada acción (`asentar()`: 50 ms + 20 ms), así que los `setTimeout` de 1 ms del teclado, el
    `setInterval` de 1 s de auto-confirm/LostFocus y los `requestAnimationFrame` corren en momentos fijos; `esperar(ms)`
    lo avanza a propósito;
  - después de avanzar el reloj se esperan dos cuadros **reales** (ResizeObserver, matchMedia, IntersectionObserver);
  - `Math.random` sembrado (mulberry32), viewport fijo por escenario, `deviceScaleFactor` 1, `prefers-reduced-motion`,
    esquema claro, fuente DejaVu Sans, sin animaciones ni cursor de texto;
  - clics reales con el ratón en el centro de la celda (antes se centra en pantalla con `scrollIntoView`).

## Qué se compara

Por paso, cada categoría se compara como JSON:

| Categoría | Contenido | Tipo |
|---|---|---|
| `tabla.dom` | Shadow DOM serializado (una línea por nodo, atributos en su orden, `value`/`checked`/`selectedIndex` de los editores y el foco) | estricta |
| `tabla.datos`, `tabla.respaldo` | `DataArray` y `_dataArrayBackup` | estricta |
| `tabla.columnas` | `Columns` (funciones como `[fn]`, elementos como su ruta) | estricta |
| `tabla.props` | ~50 propiedades públicas e internas usadas desde fuera (`IsDirty`, `Editing`, `hideColumns`, `ShowAsTree`, `IsCardView`, `_expandOnStart`, `attributes`…), `CurrentRowIndex()`, `CurrentColIndex()`, `TRCount()`, `THCount()`, `CurrentTd()`, scroll del contenedor | estricta |
| `tabla.estilos` | Estilos calculados (display, position, width, height, colores, font-weight, text-align, visibility, overflow) del host, el contenedor, la tabla, cada `th`, las filas 0-2, la última y la seleccionada (tr y cada td), el selector y el editor | estricta |
| `tabla.estado` | inicializada, modo de shadow pedido, `_shadow === shadowRoot` | estricta |
| `luz` | Light DOM de la página (o de `raiz`), con el host y sus atributos | estricta |
| `foco`, `eventos`, `callbacks`, `errores`, `consola`, `extra` | foco del documento y del shadow; eventos y callbacks desde la foto anterior; `pageerror`, diálogos (`alert`) y excepciones de los pasos; consola; lo que el escenario expone en `window.__etExtra()` | estricta |
| `internos` | Conteo de `addEventListener` por tipo (window, document, nodos) y de `setInterval` | **informativa** |
| PNG | Captura final (tabla o selector `captura`); diferencia > 0.1 % de píxeles con tolerancia 24 por canal | **informativa** |

Las categorías informativas aparecen en el informe pero no hacen fallar: una reestructura interna (F1) puede cambiar el
número de listeners sin que nadie lo note.

**Capturas:** `--update` deja las PNG de referencia en `tests/golden/**/*.png`, pero **no se versionan**
(`tests/.gitignore`): pesan unos 5 MB, cambian con la máquina y la comparación estricta es la del DOM, los datos y
los eventos. En una máquina donde existan se comparan con tolerancia; en otra se omiten. Para versionarlas, quita la
línea del `.gitignore`. Las de cada corrida quedan en `tests/out/png/` como evidencia.

**Formato guardado:** en `golden/<carpeta>/<id>.json`, una categoría igual a la del paso anterior se escribe
`"@=paso-anterior"`, y las que son listas de líneas (DOM, light DOM, `props`, `estilos`) se guardan como parche contra
el paso anterior (`{"$parche": [[posición, borradas, [líneas nuevas]], …]}`). Al comparar se expanden; los `.diff`
del informe muestran siempre las fotos completas. `tests/out/actual/` usa el mismo formato; para leer una foto
entera, expándela con `expandirPasos` de `lib/foto.mjs`.

### Reglas de normalización

- **N1.** Los uuid de `_generateUUID` (32 hexadecimales con `4` en la posición 13) se escriben `<uuid>`. Con
  `Math.random` sembrado ya son estables; la regla evita diferencias si cambia el número de llamadas.
- **N2.** En errores y consola se quitan las pilas (`at …`) y las posiciones `archivo:línea:columna` (cambiarían con
  cualquier edición del archivo).
- **N3.** El texto de cada `<style>` se guarda una vez en `tests/golden/_estilos/<sha256>.css` y en el DOM queda
  `@@ESTILO sha256:…`. Un cambio de CSS aparece como un hash distinto; el texto se compara con `diff` entre los dos archivos.
- **N4.** Escenarios `privado` (consumidores de repos privados): el contenido de `control-styles` (su tema) no se guarda; queda
  `[control-styles privado sha256:…]` en el CSS y en el atributo.
- **N5.** Anchos y altos calculados se redondean al píxel.
- Los `eventArgs` se serializan con nodos como ruta (`shadow(t1)>div>table#t1>tbody>tr[2]>td[1]`, más el texto de la
  celda), `sender` como `{$sender: tableId, esElemento}`, funciones como `[fn]`, `undefined` como `"[undefined]"`.

## Referencia dorada: cuándo se permite actualizar

La referencia (`tests/golden/`) se generó con `0ed1824` (`golden/meta.json` guarda el sha256 del archivo, la versión
de Chrome y la fecha). `--update` la reescribe **completa**. Solo se permite:

1. **Al cambiar el banco** (escenarios nuevos o corregidos), generándola otra vez con `0ed1824`
   (`git show 0ed1824:src/js/induxsoft.controls.editable.js > /tmp/ref.js && node tests/run.mjs --update --src /tmp/ref.js`).
2. **Al aprobar una diferencia intencional** de una fase (por ejemplo, la corrección de un `defecto-conocido` decidida en
   D1), después de revisar el `diff` de cada escenario afectado y anotarlo en el registro de la fase
   (`v12_qa/docs/edittable/fase-N.md`). Se actualiza solo con la versión aprobada y se dice en el commit qué
   escenarios cambiaron y por qué.
3. Al cambiar de máquina o de Chrome, si solo cambian anchos calculados o PNG (se revisa antes).

Nunca para «hacer pasar» una fase. En F1 las únicas diferencias permitidas son las de las correcciones decididas (C1–C11, C13, C15, C17–C21), actualizadas escenario por escenario con `--update --filtro <id>` y documentadas en `CAMBIOS-F1.md`.

Validación del banco: dos corridas seguidas contra `0ed1824` deben dar 0 diferencias, y cada mutación de
`tools/mutaciones.mjs` debe hacer fallar al menos un escenario.

## Agregar escenarios

Un archivo `tests/escenarios/<carpeta>/<tema>.mjs` exporta un arreglo:

```js
import { pagina, tabla } from '../../lib/pagina.mjs';
export default [{
  id: 'mi-caso',                        // único en la carpeta; el id completo es <carpeta>/<id>
  titulo: 'Qué congela', proposito: '…', origen: 'archivo:líneas de donde sale',
  etiquetas: ['defecto-conocido'],      // opcional
  viewport: { width: 1000, height: 700 }, registro: 'all' | 'consumer', raiz: 'body', captura: '#selector',
  html: pagina({ body: tabla({ data: [...], cols: [{ field: 'a', title: 'A', type: 'Text' }] }), script: '…' }),
  // o url: '/repo/examples/mi-demo.html'
  pasos: [
    ['clic en (0,1)', h => h.clicCelda('t1', 0, 1)],
    ['editar', async h => { await h.tecla('Enter'); await h.escribir('x'); await h.tecla('Enter'); }],
  ],
}];
```

Acciones (`tests/lib/acciones.mjs`): `clicCelda`, `dobleClicCelda`, `clicShadow(id, css)`, `clic(css)`,
`clicEncabezado`, `tecla(k, n)`, `teclas([...])`, `escribir(txt)`, `redimensionar(id, col, dx)`,
`arrastrarFila(id, desde, hasta, comoHijo)`, `viewport(w, h)`, `imprimir(true|false)`, `foco(css)`, `esperar(ms)`,
`js(fn, arg)` (una excepción del componente se registra en `errores`, no rompe el escenario), `leer(fn, arg)`.
En la página: `ET(id)` es el host y `ETs(id)` su shadow; `window.__etExtra = () => …` agrega datos a la foto.
Usa siempre datos inventados y obviamente falsos: el repo es público.

### Agregar escenarios de un consumidor

- **Consumidor de repo público** (como V12): una carpeta en `tests/escenarios/` y su nombre en `CARPETAS` de `run.mjs`
  y de `tools/catalogo.mjs`. Reproduce su HTML **literal** cuando sea posible: extrae los bloques con un script (como
  `tools/extraer-v12.mjs`) y anota archivo y líneas; si es a mano, cita las líneas en `origen`.
- **Consumidor de repo privado:** sus escenarios **no van en este repo** (es público). Van en su `_qa` privado como
  escenarios externos (ver abajo).

### Escenarios externos (repos privados)

`--escenarios-extra <dir>` (se puede repetir) agrega los escenarios de otra carpeta con la misma estructura:

```
<dir>/
  escenarios/<carpeta>/*.mjs   todas sus carpetas; los ids no deben repetir los del banco público
  golden/                      su referencia (y su _estilos/ y meta.json); --update la escribe ahí
  banco.json                   opcional: { "ext": { "<nombre>": "<ruta relativa a banco.json>" } }
```

- Un escenario externo importa el arnés con la ruta que `run.mjs` pone en `process.env.ET_BANCO_URL` (URL `file:` de
  esta carpeta `tests/`, con `/` al final; `ET_BANCO` es la ruta):
  `const { pagina, tabla } = await import(process.env.ET_BANCO_URL + 'lib/pagina.mjs');`
- Los archivos del sitio (su tema, su CSS) no se copian: `banco.json` o `--ext <nombre>=<dir>` los sirven en
  `/ext/<nombre>/`. El escenario declara `requiere: ['<nombre>']` (si la raíz no existe, se omite) y `privado: true`
  (su `control-styles` se guarda solo como sha256).
- `html` puede ser una función: recibe `{ ext: (nombre) => '/ext/<nombre>' }`.
- `srcFijo: { ext: '<nombre>', ruta: '<ruta>' }` (o una ruta absoluta): el escenario usa siempre esa copia del
  componente, sin importar `--src`. Sirve para fotografiar una pantalla con la copia que carga en producción; se
  acompaña de una variante sin `srcFijo` (que corre con `--src`) para documentar la diferencia.
- Genera su referencia con `0ed1824`:
  `node tests/run.mjs --escenarios-extra <dir> --filtro <carpeta>/ --update --src /tmp/ref.js`.

**Banco completo con los repos privados:**

```sh
node tests/run.mjs \
  --escenarios-extra /home/claude/factudesk.v12.induxsoft.net_qa/pruebas-edittable \
  --escenarios-extra /home/claude/agent.induxsoft.net_qa/pruebas-edittable
```

Sin esas carpetas corre solo el banco público. Los escenarios de **FactuDesk v12** están en
`Induxsoft-AI-Code/factudesk.v12.induxsoft.net_qa` (`pruebas-edittable/`) y los de **agent.induxsoft.net** en su
`_qa` (`pruebas-edittable/`). El ejemplo «agentes» de `editable.md` (forma de la consola de Ely) queda aquí, en
`tarjetas/doc-ejemplo-agentes`, porque sale de la documentación pública.

## V12

`escenarios/v12/` reproduce `uie.dbeditable` (`uielements.v12.dkl:41-323`), `getCurrentContext()` de `list.dk:84-89`,
`getPrintableHTML()` de `induxsoft.v12.ui.js:26-69` y `v12navbar.ExportarCSV` (`uielements.v12.dkl:655-714`). El
control-styles, los scripts, la leyenda, la plantilla de acciones y esas funciones son **literales**
(`fixtures/v12/extraido.mjs`, con archivo, líneas y sha256 de origen). El marcado está traducido a mano en
`fixtures/v12/dbeditable.mjs`. **Supuestos de V12** (no hay un Devkron en el laboratorio del banco para comprobar la
salida real):

- **S1.** Un atributo DKL de nombre vacío (`"#<ifstr(…,'','data')>"`) no se escribe.
- **S2.** `"#<tree_opt>"=""` escribe el texto de `tree_opt`; la variante `v12/arbol-atributo-literal` agrega el `=""` sobrante.
- **S3.** Un booleano se imprime `true`/`false`; la variante `v12/arbol-booleanos-1-0` usa `1`/`0`.
- **S4.** DKL escapa los valores de atributo como HTML.
- Para la impresión se agrega la clase `printable-element` al host (V12 la pone en otra parte).
- No se cargan Bootstrap ni los demás scripts de V12 (solo cambia el aspecto de la botonera).

Conviene confirmar S1-S3 renderizando una lista, un árbol y una lista paginada en un V12 de laboratorio.

## Pruebas de mutación

`tools/mutaciones.mjs` crea en `/tmp/et-mutaciones/` copias con un cambio pequeño cada una (quitar la clase
`EdiTable-Cell` de los td que dibuja `_f1PintarCelda`, quitar la regla `.hidde-row`, invertir el orden de `InputCreated` y
`BeforeSetInput`, desalinear `CurrentRowIndex()`, truncar en vez de redondear en `_format`, envolver la tabla en un
`div`, agregar un `tfoot` vacío) y, desde F1, tres que deshacen lo nuevo: desalinear el mapa interno tr → índice, volver
a acumular listeners de clic en `InsertRow` (deshace C1) y reescribir `DataArray` al confirmar sin cambios (deshace
C17). Corre la batería con cada una y escribe `resumen.md`. Cada mutación debe hacer fallar al menos un escenario.

Las correcciones de F1 y los escenarios cuya referencia cambió por ellas están en `CAMBIOS-F1.md`.

## Rendimiento

`escenarios/rendimiento/` mide 1,000 / 5,000 / 20,000 filas en lista y en árbol (`_printRows`/`_printTreeData`,
`NavTo`, flecha abajo, AvPág, ordenar, editar una celda, `UpdateRow`, `AddRow`, `UpdateData`), sin reloj simulado.
Cada operación tiene un límite (`ET_LIMITE_MS`, 60 s): si se pasa, se anota `> límite (cortado)` y se dejan las demás
de esa tabla. La referencia está en `golden/rendimiento.json` con el equipo y la fecha; se compara a ojo o con un
script, nunca byte a byte.

## Demos

Las demos se usan sin modificarlas. `_EdiTable-demo.html` e `index2.html` están **rotas** (cargan
`induxsoft.controls.editable.js`, `induxsoft.controls.js` e `induxsoft.controls.opcanva.js` relativos a `examples/`,
donde no existen): el banco corrige esas rutas **solo al servirlas**. `index.html` intenta cargar recursos externos que
el banco bloquea (aparecen como `Failed to load resource` en la consola de su foto).
