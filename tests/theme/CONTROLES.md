# Tema en todos los controles: especificación común (2026-11-03)

Objetivo: que **todos** los web components de este repo tomen el tema de la página (`data-et-theme` heredado, o sus
atributos propios `theme`, `palette`, `density`) y que se vean **uniformes** entre sí y con `induxsoft.base.css`,
EdiTable e InputKey 2. Sin tema, cada control queda **byte por byte** como antes (regla de oro del repo).

## Mecanismo (obligatorio)

`InduxsoftTheme.bind(host, { root, name, css, onChange })` (`src/js/induxsoft.theme.js` 1.3.0; pruebas `th-30` a
`th-32`). No reimplementar la resolución del tema en cada control.

- Controles con shadow DOM: `root` = su shadow. El `<style data-ix-theme>` queda al principio del shadow, antes de su
  hoja de hoy, así que las reglas del tema necesitan **igual o mayor especificidad** que las de hoy. Usar una clase que
  el control solo pone con tema (`onChange(e)` → `classList.toggle('ixt', !!e.theme)`) o el selector `:host` en
  cadena, y `!important` solo cuando la hoja de hoy lo usa.
- Controles de DOM claro: sin `root`; el estilo va a `document.head` con el selector `e.sel` (el host marcado
  `data-ix-themed`). Todas las reglas empiezan con `e.sel`.
- `bind` se llama cuando el control ya construyó su DOM (en su `connectedCallback` o al final de su render) y se libera
  con `dispose()` en `disconnectedCallback`. Si el control vuelve a pintar su shadow con `innerHTML`, llamar
  `h.update()` después (el `<style>` se vuelve a insertar si se perdió).
- `window.InduxsoftTheme` puede no existir (archivos sueltos: schedule, opcanva, availability-scheduler): entonces el
  control queda como hoy, sin error.

## Variables

En `css(V, e)`: `V(nombre, respaldo)` da `var(--et-nombre, [var(--et-padre,)] var(--et-t-nombre, respaldo))`.
Claves de paleta (las de `EXPLICITOS` en `induxsoft.theme.js`): `bg fg muted-fg header-bg header-fg header-border
border row-alt-bg hover-bg sel-bg sel-fg sel-bg-soft accent focus-ring input-bg input-fg input-border
input-disabled-bg mark-bg mark-fg error error-bg warn ok info neg-fg tooltip-bg tooltip-fg badge-bg badge-color
radius chip-radius badge-radius font font-size num-font` y derivadas (`menu-*`, `panel-*`, `chip-*`, `card-border`,
`group-*`, `checked-bg`…). Densidad: `var(--ix-h, var(--ix-t-h))`, `--ix-pad`, `--ix-row`, `--ix-fs` (con las
`--ix-t-*` que pone `bind`). Esquema: `color-scheme: var(--ix-t-cs, normal)`.

## Apariencia uniforme (lo mismo en todos los controles con tema)

| Elemento | Regla |
|---|---|
| Letra | `font-family: V('font')`; tamaño `var(--ix-fs, var(--ix-t-fs))` en campos, listas y botones; títulos con `font-weight: V('header-weight', '600')` |
| Campo (input, select, área del control) | alto mínimo `var(--ix-h, var(--ix-t-h))`, `box-sizing: border-box`, padding `var(--ix-pad, var(--ix-t-pad))`, fondo `V('input-bg')`, texto `V('input-fg')`, borde `1px solid V('input-border')`, radio `V('radius')`, placeholder `V('muted-fg')` |
| Foco | `border-color: V('accent')` y `box-shadow: 0 0 0 3px color-mix(in srgb, V('focus-ring') 30%, transparent)`, sin `outline` extra |
| Deshabilitado / solo lectura | fondo `V('input-disabled-bg')`, texto `V('muted-fg')` |
| Botón principal | fondo `V('sel-bg')`, texto `V('sel-fg')`, radio `V('radius')`, mismo alto que el campo |
| Botón secundario / de icono | fondo transparente o `V('bg')`, texto `V('fg')`, borde `1px solid V('input-border')`; hover `V('hover-bg')` |
| Panel, menú, lista desplegable | fondo `V('menu-bg')`, texto `V('menu-fg')`, borde `1px solid V('menu-border')`, radio `V('radius')`, sombra `0 6px 18px rgba(0,0,0,.18)` |
| Encabezado de panel o tabla | fondo `V('header-bg')`, texto `V('header-fg')`, borde inferior `V('header-border')` |
| Fila / opción | alto `var(--ix-row, var(--ix-t-row))`; hover `V('hover-bg')`; seleccionada `V('sel-bg-soft')` con texto `V('fg')`; marcada (check) `V('checked-bg')`; alternas `V('row-alt-bg')` si el control ya las tenía |
| Chips / etiquetas | fondo `V('chip-bg')`, borde `V('chip-border')`, radio `V('chip-radius')`; insignias `V('badge-bg')`/`V('badge-color')` |
| Estados | error `V('error')` sobre `V('error-bg')`; aviso `V('warn')`; correcto `V('ok')`; informativo `V('info')`; resaltado `V('mark-bg')`/`V('mark-fg')` |
| Iconos | `currentColor`; los SVG con color fijo se cambian a `currentColor` **solo con tema** |
| Tamaño chico | atributo `size="sm"`: alto `28px`, padding `3px 8px`, letra `13px` (los de la densidad `compacta`) |

Sin colores fijos (`#…`, `rgb(…)`, nombres) en el CSS de tema, salvo como **respaldo** de `V`. Contraste AA en
claro, oscuro, jade y libro-mayor (las pruebas lo miden).

## Pruebas que debe dejar cada control

1. **Sin tema, sin cambio:** el control con la versión de `main` anterior (`git show 05704bb:<archivo>`) y con la
   nueva, en la misma página sin `data-et-theme` y con `data-et-theme="ninguno"`: mismo HTML del shadow (o del DOM
   claro), mismas hojas y mismo `getComputedStyle` de sus elementos visibles.
2. **Con tema:** en `claro`, `oscuro`, `jade` y `libro-mayor` (y `auto` una vez): que existe el `<style data-ix-theme>`,
   que los colores computados salen de la paleta (fondo de campo = `input-bg`, borde = `input-border`, etc.), que el
   alto del campo es el de la densidad, y contraste AA entre texto y fondo de campo, opción, encabezado y botón.
3. **En caliente:** cambiar `data-et-theme` del `<html>` y el atributo `theme` propio cambia el control sin recargar;
   `ninguno` lo regresa a como estaba.
4. **Capturas** de cada control en los cuatro temas a `tests/out/controles/<control>-<tema>.png` (no se versionan),
   con el control abierto si tiene panel o lista.
