# Versiones de EdiTable en producción frente a `0ed1824`

*2026-11-01. El banco público (216 escenarios) se corrió **sin actualizar la referencia** con `--src` apuntando a cada
versión que sigue en producción. Las copias salen del censo de consumidores (`v12_qa/docs/edittable/copias.csv`).*

Cómo repetirlo:

```sh
node tests/run.mjs --src <copia.js> --salida /tmp/ver-<v> --sin-png
node tests/tools/versiones.mjs --actual /tmp/ver-<v>/actual --json /tmp/ana-<v>.json
```

`tools/versiones.mjs` separa lo que cambia **solo porque la versión vieja no tiene las funciones nuevas** de lo que
cambia de **comportamiento**:

- iguala la línea `@@ESTILO sha256:…`, porque el CSS agregado cambia el hash en todas las tablas;
- quita las propiedades que no existen en una de las dos versiones (`"[undefined]"`, por ejemplo `CardsMode`) y la lista de claves de `Events`;
- no cuenta la categoría informativa `internos`.

## Resumen por versión

| Versión | Fecha | Copias en producción (censo) | Escenarios iguales | Distintos | Solo por agregados | Comportamiento distinto | No corren (sin foto) |
|---|---|---|---:|---:|---:|---:|---:|
| `0ed1824` (referencia) | 2026-10-17 | 8 en fenix3 y 7 en GitHub | 216 | 0 | – | – | – |
| `16ad624…` (intermedia) | — | 1: `agent.induxsoft.net/_static/js/` (la usa `tables/`) | 214 | 2 | 0 | 2 | 0 |
| `754425b` | 2026-02-06 | 1: `agent…/induxsoft.controls.editable.backup.js` (`417fc38a…`, la misma con CRLF; no la carga nadie) | 0 | 216 | 174 | 30 | 12 |
| `3b3db79` | 2025-01-04 | **180 de 193 en fenix3**, entre ellos 171 sitios V12 de `/usr/dkl_mxcvxii/web`, las plantillas de `dkl_test` y `dkl_v12_induxsoft`, y 1 en GitHub | 0 | 216 | 173 | 31 | 12 |
| `4f287c8` | 2024-09-13 | 2 sitios de clientes (detalle en `v12_qa/docs/edittable/copias.csv`, privado) | 0 | 216 | 166 | 38 | 12 |

Notas:
- **«Distintos» al 100 % es esperable en las versiones viejas.** Todas las tablas tienen otra hoja de estilos (`_getExtraCss`, agregada en `0ed1824`) y les faltan propiedades nuevas. La columna que importa es **«Comportamiento distinto»**.
- `417fc38a…` dio exactamente lo mismo que `754425b` (es `754425b` con fin de línea CRLF). `INVENTARIO.md` de agent dice que esa copia «no coincide con ningún commit»; eso es incorrecto (el censo ya lo había identificado).
- La otra intermedia del censo (`61e1844d…`: `0ed1824` sin `KeepSelectionVisible`) no está en esta máquina y **no se corrió**.
- **`16ad624…` frente a `0ed1824`:** solo cambia cuando el consumidor tiene un error.
  - `datos/plantillas`: una plantilla que lanza una excepción en `UpdateRow` corta el ciclo, y las columnas siguientes quedan sin actualizar (`"undefined-2"`).
  - `tarjetas/decoracion-filas`: un `RowClass` que lanza una excepción deja la fila a medio decorar, y el error sube al llamador en lugar de ir a `console.error`.
  - Con código que no falla son iguales.

## `3b3db79` frente a `0ed1824`: las 31 diferencias de comportamiento y los 12 escenarios que no corren

Agrupadas por causa. «¿Alguien depende?» cruza la causa con `uso-api.csv` y `control-styles.md` del censo; se refiere a
los consumidores que hoy corren con `3b3db79` (los paquetes V12 instalados en los sitios de fenix3).

### Cambios de comportamiento (pueden notarse al pasar a v2)

| # | Causa (código de `3b3db79`) | Escenarios | Qué pasa en `3b3db79` | Qué pasa en `0ed1824` | ¿Alguien depende? |
|---|---|---|---|---|---|
| B1 | `col.type.toLowerCase()` sin `??` en `_withFormat` y en `checkAndSetRowCards` | No corren: `basicos/columns-default-type`, `basicos/type-minusculas`, `datos/getcolumndef`, `defectos/onsort-campo-especial`, `defectos/readonly-false`, `edicion/readonly-columna`, `presentacion/anchos-y-alineacion`, `tipos/sin-type`. Distintos: `basicos/sin-id`, `basicos/thead-row-index`, `datos/sort-api`, `defectos/afterprint-muestra-ocultas` | Si un `edit-th` no tiene `type`, o tiene uno que no existe (`type="text"` en minúsculas), salta un `TypeError` en `DOMContentLoaded`. Si el `edit-th` es de datos, **la tabla no se dibuja**: el shadow queda solo con el `<style>`, el `edit-thead` se queda en el light DOM y `ShowAsTree` sigue en `true`. Si es de otra fila del encabezado, la tabla se dibuja pero no se aplican las tarjetas (`table-cards`). | Usa `ColumnsDefaultType` y la tabla se dibuja | **Nadie puede depender de que funcione**: hoy esas tablas no salen. El censo cuenta `type` 1036 veces y `field` 1035, así que casi todos los `edit-th` lo traen. Al pasar a v2, **una tabla que hoy está en blanco empezaría a verse**. Conviene buscar `edit-th` sin `type` antes de desplegar. |
| B2 | `UpdateRow` no evalúa plantillas | `datos/updaterow` | `UpdateRow(i)` escribe `DataArray[i][field] ?? ''` también en las columnas con `template`, así que **la celda de plantilla queda vacía**. Con una fila sin datos, `UpdateRow` lanza `TypeError`. | Evalúa la plantilla (con `try/catch`) y la fila sin datos se trata como `{}` | **Posible.** `template` aparece en 12 consumidores (17 veces) y `UpdateRow` en 23 (93 veces). La intersección hay que revisarla a mano (candidatos según el censo: `mxcfdi`, `ventas`, `epifania`, `portal`). Un paquete que hoy llama `UpdateRow` en una tabla con plantilla ve la celda vaciarse (por ejemplo, la columna `_actions` de `list.dk`); con v2 la verá con su contenido. Es una corrección, pero es visible. **[I]** No se revisó el código de esos paquetes: en esta máquina solo están `v12` y `webcomponents`. |
| B3 | `html-encode` también escapaba el HTML de las plantillas | `presentacion/plantilla-html` | Al salir de una celda con plantilla, el HTML queda como texto (los enlaces y botones se ven como código) | No escapa las plantillas | Nadie con `3b3db79`: `html-encode` solo lo usa agent (`manager/list.dk`), que corre con `0ed1824`. |
| B4 | No existe el atributo `sorTable` (llegó en `754425b`) | `presentacion/sortable-false-atributo` | Con `sorTable="false"`, el clic en el encabezado **ordena** igual | No ordena | Nadie con `3b3db79`: `sorTable` solo lo usa agent `tables/index.dkl`, que carga `16ad624`. |

### Agregados nuevos (no afectan a quien no los usa)

| # | Agregado en `0ed1824` | Escenarios donde aparece | Efecto en `3b3db79` | ¿Algún consumidor de `3b3db79` lo usa? |
|---|---|---|---|---|
| N1 | Vista de tarjetas configurable (`cards-*`, `CardColumns`, `RefreshView`) | `tarjetas/{atributos-de-columna, breakpoint-contenedor, cardcolumns, layouts, modo-always, modo-auto-breakpoint, modo-never, oncardpaint}`, `tarjetas/doc-ejemplo-agentes` | Los atributos se ignoran; la tabla sigue siendo tabla | No: `cards-*` solo lo usa agent |
| N2 | Evento `ViewModeChanged` con `cards-responsive` | `tarjetas/responsive-angosto`, `v12/tarjetas-angosta` | No se dispara (el `@media` CSS de `table-cards` sí funciona igual) | No hay manejadores |
| N3 | Badges (`type="Badges"`, `RowBadges`, `BadgesField`, `SetRowBadges`…, `RefreshBadges`, `BadgeClick`, `badge-tooltip`) | No corren: `tarjetas/badges-campo`, `tarjetas/badges-clic`, `tarjetas/badges-tooltip-custom`, `tipos/badges-col`. Distintos: `tarjetas/badges-columna-grupos`, `tarjetas/badges-funcion-y-api`, `tarjetas/badges-iconos`, `presentacion/columna-oculta-visual`, `eventos/sin-manejadores`, `datos/refresh` | No hay badges; `RefreshBadges()` lanza «no es una función»; `type="Badges"` se trata como una columna `Text` editable | No: solo agent |
| N4 | Decoración de filas (`RowClass`, `RowClassField`, `RowAccent`, `CellClass`, `onRowPaint`) | `tarjetas/decoracion-filas`, `arbol/ontdpaint-en-arbol`, `datos/updaterow` | Sin clases ni acentos; `onRowPaint` no se llama | No (el censo no encontró ningún uso de `onRowPaint`) |
| N5 | Fechas relativas (`format="relative"`, `Locale`, `RelativeDateFormatter`) | `tarjetas/fechas-relativas` | Se ve la fecha tal cual | No: solo agent |
| N6 | `template-encode` | `datos/plantillas` | Las plantillas reciben los valores sin escapar | No: solo agent |
| N7 | `native-events` | `eventos/nativos-con-native-events` | Los eventos nativos se ignoran siempre | No |
| N8 | `EnsureSelectionVisible()` y `keep-selection-visible` | `datos/ensure-selection-visible` | El método no existe | No |
| N9 | Eventos nuevos (`BadgeClick`, `ViewModeChanged`) en `Const.Events` | `eventos/addeventlistener-mayusculas` (el escenario lee los 21 nombres; en la versión vieja 2 son `undefined`) | — | No |

### Lo que es igual en `3b3db79` y `0ed1824`

173 escenarios dan el mismo DOM, los mismos datos, los mismos eventos y los mismos estilos calculados, una vez
igualados el hash del CSS y las propiedades nuevas.

**Entre ellos, todos los de `v12/` menos `v12/tarjetas-angosta` (solo N2):**
- lista, árbol expandido y colapsado, paginación, leyenda y «Sin resultados»;
- la acción por registro (`getCurrentContext`) después de ordenar, de paginar y en árbol;
- la impresión de V12 (clon de la tabla interna), la exportación CSV y `@media print`.

**También son iguales:**
- teclado, edición y cancelación;
- `backup`/`restore`/`IsDirty`;
- árbol y movimiento de filas;
- impresión con `beforeprint`/`afterprint`;
- los selectores de `control-styles` que usa V12 (`div:has(table#id)`, `#id tr th`) y los de `control-styles.md` que reproduce el banco (`tr td`, `th`, `thead`, `tbody`, `.EdiTable-Cell`, `#__table_input`, `.EdiTable-Row-Selected`);
- los miembros internos que usan los paquetes (`_printRows`, `_printTreeData`, `_expandOnStart`, `_shadow`, `_table`).

La única diferencia de CSS que afecta a los paquetes es de **orden**: en `0ed1824`, `control-styles` va después de `_getExtraCss()`. Las reglas nuevas solo tocan clases nuevas (`et-*`, `td.et-rel`, `table.et-cards`), así que no compiten con los selectores de los paquetes.

## Qué cuidar cuando los sitios con `3b3db79` pasen a v2

1. **B1.** Buscar en los paquetes y sitios `edit-th` sin `type`, o con un `type` mal escrito. Hoy esas tablas no se dibujan en los sitios con `3b3db79`; con v2 aparecerán. Puede ser una mejora o una sorpresa, según la pantalla.
2. **B2.** Revisar los consumidores que llaman `UpdateRow` en tablas con columnas `template` (intersección de los 23 consumidores de `UpdateRow` con los 12 de `template`): con v2, la plantilla se vuelve a dibujar en lugar de quedar vacía. Si algún código compensa hoy esa celda vacía (por ejemplo, repintando con `_printRows()` después de `UpdateRow`), seguirá funcionando, pero sobra.
3. **Copias de `4f287c8`** (2 sitios de clientes). Además de lo anterior:
   - no tienen el `addEventListener` sobrescrito, así que `tabla.addEventListener('rowchanged', …)` **no funciona** (`eventos/por-addeventlistener`, `listener-antes-de-cargar`, `un-manejador-por-evento`);
   - no ocultan columnas al imprimir (`impresion/before-after-print`, `impresion/varias-tablas`, `v12/impresion-media-print`);
   - al editar un número con formato se pierde el signo menos (`tipos/number-formato`).

   Con v2 empiezan a funcionar. Si algún sitio compensó esas faltas con código propio (ocultar columnas al imprimir, registrar eventos por `Events[…]`), ese código queda duplicado y hay que revisarlo. **[I]**
4. **Sitios a medio actualizar.** Un paquete que empiece a usar algo de N1-N9 fallará en los sitios que sigan con `3b3db79` (`RefreshBadges` no existe, `type="Badges"` se vuelve editable, los atributos se ignoran). Ese riesgo ya está en el censo (riesgo 4): el componente tiene que llegar a todos los sitios antes que el paquete, o el paquete tiene que preguntar por la función (`EditTable.features`, plan §3.9).
