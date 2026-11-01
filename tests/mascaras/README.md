# EditTable.Mask: pruebas y decisiones

Motor puro (sin DOM) de máscaras de captura y expresiones numéricas para `edit-table` (spec EdiTable 2, §3).
Código: `src/js/_partes/editable.mask.js`. Define `const EditTableMask`; solo crea `window.EditTableMask`
cuando el archivo se carga suelto (su `<script src>` termina en `editable.mask.js`). En F2 se pega dentro de
`induxsoft.controls.editable.js` y se expone como `EditTable.Mask = EditTableMask` (o `static Mask`).

## Cómo correr

```
node --test tests/mascaras/        # unitarias (node:test, sin dependencias)
node tests/mascaras/navegador.mjs  # <input> real en Chromium con Playwright (teclado y Ctrl+V)
```

`node --test tests/mascaras/` resuelve la carpeta a `index.js`, que carga los `*.test.cjs`.
`cargar.cjs` evalúa el archivo con `vm` (no exporta nada).

## API

| Función | Devuelve |
|---|---|
| `apply(pattern, text, {caret, placeholder, ...loc})` | `{display, raw, canonical, complete, caret, rejected}` |
| `edit(pattern, {display, caret, end}, action, {placeholder, ...loc})` | `{display, raw, canonical, complete, caret, accepted}` |
| `validate(pattern, value, loc)` | `{ok, reason}` |
| `format(pattern, raw, loc)` | `display` (sin placeholder) |
| `unformat(pattern, display, {placeholder='_', ...loc})` | `{raw, canonical}` (el tercer argumento acepta también el placeholder como cadena) |
| `calc(expr, loc)` | `{ok, value, canonical, error}` |
| `toCanonical(n, maxDecs=10)` | cadena canónica de un `Number` (R9) |
| `canonicalFromText(text, {...loc, native})` | cadena canónica de un texto, sin pasar por `Number`; `''` si está vacío, `null` si no es número (R9) |

`loc` son las opciones de locale (R7 de la spec): `{locale}` (BCP 47) o `{decimal, thousands}`. Ver "Locales".
| `presets` | objeto con los presets |

- `pattern` es un nombre de preset o un patrón. Si el nombre existe en `presets`, gana el preset; para usar
  esas letras como literales se escapan (`\c\p`). También acepta un objeto preset propio (ver abajo).
- `action`: `{type:'insert', text}`, `{type:'paste', text}`, `{type:'backspace'}`, `{type:'delete'}`.
  `caret`/`end` son la selección del input (`selectionStart`/`selectionEnd`, en unidades UTF-16; si `end`
  falta, no hay selección). El componente solo traduce `beforeinput` (`insertText`, `insertFromPaste`,
  `deleteContentBackward`, `deleteContentForward`) a una acción, hace `preventDefault`, asigna `display` y
  coloca el cursor en `caret`. Ejemplo en `navegador.html`.
- `accepted:false` significa que la acción se rechazó y el estado devuelto es el mismo de entrada.
- `rejected` (en `apply`) cuenta los caracteres descartados.

## Patrón

| Símbolo | Acepta |
|---|---|
| `9` | dígito ASCII `0-9` |
| `A` | cualquier letra Unicode (`\p{L}`): incluye Ñ, acentos y diéresis; no cambia mayúsculas/minúsculas |
| `X` | letra Unicode o dígito ASCII |
| `*` | cualquier carácter |
| `\` | escapa el siguiente (`\9` es el literal 9; una `\` al final es literal) |
| otro | literal |

Reglas:
- Los datos se compactan: no hay huecos. Borrar en medio recorre a la izquierda; insertar recorre a la derecha.
- Los literales no se teclean: se insertan solos. Con el texto vacío el display es `''` (no se muestra la
  plantilla); con el primer carácter aparecen los literales iniciales.
- Con placeholder (por omisión `_`) el display lleva todas las ranuras vacías: `(5__) ___-____`. Con
  `placeholder: ''` el display llega hasta la siguiente ranura: `(555) `.
- El placeholder nunca es dato (si una ranura `*` debe aceptar `_`, use otro placeholder).
- Al leer texto (teclear, pegar, `apply`, `validate`, `unformat`) un carácter igual al literal en turno se
  consume como literal; cualquier otro literal del patrón fuera de lugar se ignora sin contar como rechazo
  (`555-123-4567` vale para `tel`). `format` es posicional: el raw se coloca tal cual en las ranuras.
- Backspace/Suprimir sobre un literal borran el dato anterior/siguiente.
- Teclear con el patrón lleno se rechaza; pegar algo más largo se corta.
- Al recorrer, un dato que ya no cabe en su nueva ranura se descarta (p. ej. letras en una ranura `9`).

## Presets

| Preset | Captura (`apply`/`edit`) | `validate` (razones) | `format` |
|---|---|---|---|
| `cp` | patrón `99999` | `incomplete`, `invalid` | igual |
| `tel` | patrón `(999) 999-9999`; raw de 10 dígitos | `incomplete`, `invalid` | `(999) 999-9999` |
| `rfc` | mayúsculas; `A-Z 0-9 Ñ &`; máximo 13 | `incomplete` (<12), `invalid` (estructura), `fecha`, `checksum` | mayúsculas, filtrado |
| `curp` | mayúsculas; `A-Z 0-9`; máximo 18 | `incomplete` (<18), `invalid`, `entidad`, `fecha`, `checksum` | mayúsculas, filtrado |
| `email` | sin espacios; máximo 254 | `invalid` | igual |
| `percent` | `0-9` y el decimal del locale; nunca más de 100 ni más de 2 decimales mientras se teclea; raw con punto | `invalid`, `rango` | 2 decimales en el locale (`7` → `7.00`; `7,00` en `es-CO`) |
| `upper` | pasa a mayúsculas lo que entra | siempre válido | mayúsculas |
| `lower` | pasa a minúsculas lo que entra | siempre válido | minúsculas |

Detalle de lo que valida cada uno:

- **Vacío** es válido en todos (`{ok:true, reason:''}`): la obligatoriedad no es de la máscara. `complete` es `false`.
- **rfc** (en mayúsculas, aunque se escriba en minúsculas):
  - Estructura `^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$`: 3 letras + 12 caracteres para persona moral, 4 letras + 13 para física.
  - Fecha `AAMMDD` real (31 de febrero, mes 13 o día 00 dan `fecha`). Bisiesto con el año 20AA (`000229` vale).
  - Homoclave: dos alfanuméricos y el dígito verificador del SAT (módulo 11, `0-9` o `A`), que se comprueba
    (`checksum`). Pasan, por ejemplo, los RFC de prueba del SAT `EKU9003173C9` y `GODE561231GR8`.
  - Genéricos `XAXX010101000` y `XEXX010101000`: válidos sin más comprobación.
  - No revisa palabras inconvenientes ni que la clave exista en el SAT.
- **curp**:
  - Estructura: letra, vocal o `X`, 2 letras, fecha `AAMMDD`, sexo `H`, `M` o `X` (la `X` no binaria de
    RENAPO), entidad, 3 consonantes internas, homoclave alfanumérica y dígito.
  - Entidad: las 32 claves (`AS BC BS CC CL CM CS CH DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC
    TS TL VZ YN ZS`) más `NE` (nacido en el extranjero); otra da `entidad`.
  - Fecha real; el siglo sale de la posición 17: dígito → 1900, letra → 2000 (`000229` vale con letra y no con dígito).
  - Dígito verificador de RENAPO (`checksum`), el mismo algoritmo que usa `satcfdi`.
  - La Ñ no se acepta (RENAPO la cambia por X).
- **percent**: número `0`–`100` con el decimal del locale (punto en `es-MX`) y a lo más 2 decimales; en `es-MX`
  `-1`, `.`, `1,5`, `1.2.3` dan `invalid`; `101` o `12.345` dan `rango`. Mientras se teclea se rechaza la
  tecla que lo sacaría de rango, también borrar el decimal si deja más de 100 (`10.5` → `105`). Pegar con un
  carácter que no es del locale se rechaza completo (en `es-MX` no convierte `1,5` en `15`). `format` lo deja
  con 2 decimales en el locale (`10,50` en `es-CO`); el `%` visible es cosa de `sufix`.
- **email**: `algo@dominio.tld`, sin espacios, un solo `@`, TLD de 2 o más caracteres, sin punto final.
- **upper/lower**: `edit` transforma solo lo que entra; `apply` y `format` normalizan todo el texto.

Preset propio (objeto): `{m: 'patrón'}` o `{c: carácter → carácter|null, max, ok: candidato → bool, v: valor → razón|'', f: raw → display, strict}`.

## Locales (R7)

Los separadores salen de `opts.decimal`/`opts.thousands` si vienen; si no, de
`Intl.NumberFormat(opts.locale).formatToParts(1234567.5)` (con 1234567.5 porque `es-ES` no agrupa números de
4 cifras y no devolvería el separador de miles). Sin opciones, el locale es `es-MX`; un locale inválido
también cae en `es-MX`. Si solo se da `decimal`, los miles son el otro de `.`/`,`. El componente resuelve el
locale (`lang` del elemento o ancestro, `document.documentElement.lang`, `navigator.language`, `es-MX`) y se
lo pasa al motor.

| Locale | Decimal | Miles | `calc` | `percent` (display / raw) |
|---|---|---|---|---|
| `es-MX` (omisión) | `.` | `,` | `1,234.5` = 1234.5; `1,5` → `syntax` | `10.50` / `10.5`; pegar `1,5` se rechaza |
| `en-US` | `.` | `,` | igual que `es-MX` | igual que `es-MX` |
| `es-CO` | `,` | `.` | `1,5` = 1.5; `1.234,5` = 1234.5; `100+10,5%` = 110.5; `1.5` → `syntax` | `10,50` / `10.5`; pegar `1,5` vale |
| `de-DE` | `,` | `.` | igual que `es-CO` | igual que `es-CO` |
| `es-ES` | `,` | `.` | igual que `es-CO` | igual que `es-CO` |
| `fr-FR` | `,` | espacio fino (`U+202F`) | `1 234,5`: como grupo se acepta espacio, `U+00A0` o `U+202F` | `10,50` / `10.5` |

Reglas:
- El decimal es estricto por locale: en uno de coma, `1.5` es `syntax` en `calc` (el punto solo agrupa miles
  bien formados: `1.500` = 1500), y en `percent` no se puede teclear `.`.
- Los miles solo se aceptan bien agrupados (de 3 en 3, con el primer grupo de 1 a 3 cifras).
- `percent`: el display usa el decimal del locale; `raw` (en `apply`/`edit` y `unformat`) va siempre con
  punto, para guardarlo en `DataArray` igual en cualquier locale. `format` y `validate` aceptan el raw con
  punto o el texto con el decimal del locale.
- Las máscaras de patrón y los presets `rfc`, `curp`, `cp`, `tel`, `email`, `upper` y `lower` no dependen del locale.

## Cadena canónica (R9)

`DataArray` recibe los números como el `<input type="number">`: cadena con punto decimal, sin miles y con `-`
como signo. El motor la entrega en el campo `canonical`:

| Origen | `canonical` |
|---|---|
| Máscaras de patrón y presets de texto (`tel`, `cp`, `rfc`, `curp`, `email`, `upper`, `lower`) | igual a `raw` |
| `percent` (`apply`, `edit`, `unformat`) | `canonicalFromText(display, locale)`; `''` si vacío o a medio teclear (`.`) |
| `calc` | `toCanonical(value)`; `''` si hay error |

Cadena canónica estricta: sin exponente, con `0` antes del punto (`0.5`), sin ceros de más a la izquierda
(`007` → `7`), `-` pegado (`- 5` → `-5`), sin `+`, sin `-0` (`-0.00` → `0.00`), vacío `''`.

- **`canonicalFromText(text, opts)`** trabaja sobre la cadena, nunca con `Number`: conserva los decimales
  tecleados, incluidos los ceros finales (`1.10` → `1.10`), y cualquier número de cifras
  (`123456789012.123456`, `999999999999999999.99`). Lee primero con los separadores del locale (miles bien
  agrupados o sin agrupar) y, si no encaja, con la sintaxis del control nativo: punto decimal y exponente
  (`1e3` → `1000`, `1.5e-3` → `0.0015`, `.5` → `0.5`; el exponente se aplica moviendo el punto en la
  cadena). Con `native: true` solo usa la sintaxis nativa.
  - Ambigüedad: en un locale de coma, `1.234` es 1234 (miles); para leer el valor del control nativo se pasa
    `native: true` (`1.234` → `1.234`). `1.5` no es agrupación válida y se lee como nativo (`1.5`).
- **`toCanonical(n, maxDecs=10)`**: redondea a `maxDecs`, toma la representación más corta de JS y expande
  el exponente (`1e-7` → `0.0000001`, `1e21` → `1000000000000000000000`); no deja ceros finales
  (`0.1+0.2` → `0.3`). `NaN`/`Infinity` → `''`. `calc` la usa, por eso `=1,10*1` da `1.1`.

| Texto | `es-MX` / `en-US` | `es-CO` / `de-DE` |
|---|---|---|
| `1,234.50` | `1234.50` | `null` |
| `1.234,50` | `null` | `1234.50` |
| `-0,5` | `null` | `-0.5` |
| `1e3` | `1000` | `1000` |
| `.5` | `0.5` | `0.5` (como nativo) |
| `123,456,789,012,345,678` | `123456789012345678` | `null` |
| `123.456.789.012.345.678` | `null` | `123456789012345678` |
| `''` | `''` | `''` |

## `calc`

- Acepta `=expr` o `expr`, con espacios. Operadores `+ - * / ( )`, unario `-` y `+` (`--5` = 5), `%` posfijo.
- Decimal y miles según el locale (ver "Locales"). En `es-MX` (omisión) el decimal es el punto (`.5`, `1.`) y
  la coma solo agrupa miles bien formados (`1,500`, `1,234,567.89`), igual que `NumFormat.thousands` del
  componente: `1,5`, `1,5000` y `1234,567` son `syntax`. En locales de coma decimal es al revés. No hay
  notación científica (`1e5` es error).
- **Porcentaje:** `a%` es `a/100` (`50%` = 0.5, `200*10%` = 20). Cuando el operando derecho de `+` o `-` es
  directamente un porcentaje, se calcula como calculadora: `a+b%` = `a + a·b/100` y `a-b%` = `a - a·b/100`
  (`100+10%` = 110, `1500+16%` = 1740, `100+10%+10%` = 121, `100-10%` = 90). Si el porcentaje se multiplica o
  va entre paréntesis ya no es "por ciento de a": `100+10%*2` = 100.2, `100+(10%)` = 100.1.
- Precedencia usual; parser recursivo descendente, sin `eval` ni `Function`.
- Resultado redondeado a 10 decimales (`0.1+0.2` = 0.3, `1/3` = 0.3333333333); `-0` se devuelve como 0.
- Errores (`error`): `empty`, `length` (más de 200 caracteres), `syntax`, `div0` (división entre cero,
  también `0/0`), `overflow` (resultado no finito; con 200 caracteres en la práctica no se alcanza).
- El componente decide cuándo llamar: con `calc="true"` solo si el texto empieza con `=`; el error se
  reporta como `MaskInvalid` con `reason: 'calc'`.

## Archivos

| Archivo | Qué prueba |
|---|---|
| `patron.test.cjs` | símbolos, escapes, literales, placeholder, caret, `validate`/`format`/`unformat` de patrones, carga suelta |
| `edit.test.cjs` | teclear, borrar, suprimir, selección, pegar con y sin literales, presets en `edit` |
| `presets.test.cjs` | cada preset con casos válidos e inválidos |
| `calc.test.cjs` | precedencia, paréntesis, unario, `%`, coma, errores, división entre cero, números grandes, longitud |
| `canonico.test.cjs` | R9: `toCanonical`, `canonicalFromText` y el campo `canonical` en `es-MX`, `en-US`, `es-CO`, `de-DE` (18 cifras, negativos, ceros finales, vacío, exponentes) |
| `locale.test.cjs` | R7: `calc`, `percent` y `edit` en `es-MX`, `en-US`, `es-CO`, `de-DE`; `decimal`/`thousands` explícitos; `fr-FR`, `es-ES`, locale inválido |
| `navegador.html` + `navegador.mjs` | `edit()` en `<input>` reales: cursor, flechas, selección, Backspace, Suprimir, Ctrl+V; `percent` en `es-CO` (locale tomado de `lang`) con `canonical` |

Todos los RFC y CURP de las pruebas son ficticios (salvo los de prueba publicados por el SAT y los genéricos).
