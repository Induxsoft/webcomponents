// Armado de páginas de prueba (fixtures) en memoria.
// Todas cargan el componente bajo prueba desde /__et/editable.js, que run.mjs sirve con el archivo elegido por --src.
// Fuente fija (DejaVu Sans, instalada en el laboratorio), márgenes fijos y sin animaciones, para que el
// dibujo sea estable entre corridas.

export const BASE_CSS = `html,body{margin:0;padding:8px;font-family:"DejaVu Sans",sans-serif;font-size:16px;line-height:1.2;background:#fff;color:#000;}
*{animation:none!important;transition:none!important;caret-color:transparent;}`;

/**
 * @param {object} o
 * @param {string} [o.titulo]
 * @param {string} [o.head]    HTML extra en <head> (después del componente, como en V12)
 * @param {string} [o.antes]   HTML extra en <head> ANTES del componente
 * @param {string} o.body      HTML del <body>
 * @param {string} [o.script]  JS al final del <body>
 * @param {boolean} [o.componente=true]
 * @param {string} [o.lang='es-MX']
 * @param {boolean} [o.cssBase=true]
 */
export function pagina(o) {
  const comp = (o.componente === false) ? '' : '<script src="/__et/editable.js"></script>';
  return `<!DOCTYPE html>
<html lang="${o.lang ?? 'es-MX'}">
<head>
<meta charset="utf-8">
<title>${o.titulo ?? 'EdiTable'}</title>
${o.cssBase === false ? '' : `<style>${BASE_CSS}</style>`}
${o.antes ?? ''}
${comp}
${o.head ?? ''}
</head>
<body>
${o.body}
${o.script ? `<script>\n${o.script}\n</script>` : ''}
</body>
</html>`;
}

/** Escapa un valor para ponerlo dentro de un atributo entre comillas simples o dobles. */
export function attr(v) {
  return String(v).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;');
}

/**
 * <edit-table> con columnas declaradas.
 * cols: [{ field, title, type, ...otros atributos de edit-th }]
 */
export function tabla({ id = 't1', attrs = {}, data, cols = [], tbody = null, thead = null, style = 'width:100%' } = {}) {
  const a = Object.entries(attrs).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${attr(v)}"`)).join('');
  const d = (data === undefined) ? '' : ` data="${attr(typeof data === 'string' ? data : JSON.stringify(data))}"`;
  const head = thead ?? `<edit-thead><edit-tr>${cols.map(c => {
    const { title, ...rest } = c;
    const ca = Object.entries(rest).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${attr(v)}"`)).join('');
    return `<edit-th${ca}>${title ?? c.field ?? ''}</edit-th>`;
  }).join('')}</edit-tr></edit-thead>`;
  return `<edit-table id="${id}"${style ? ` style="${style}"` : ''}${a}${d}>${head}${tbody ?? ''}</edit-table>`;
}

// Datos de prueba inventados y obviamente falsos.
export function filas(n, f = (i) => ({ id: i + 1, nombre: 'Producto de prueba ' + (i + 1), cantidad: (i * 7) % 13 + 1, precio: Math.round(((i * 37) % 1000) * 1.5 + 10) / 10 })) {
  return Array.from({ length: n }, (_, i) => f(i));
}

export const COLS_BASE = [
  { field: 'id', title: 'Id', type: 'NoEditable' },
  { field: 'nombre', title: 'Nombre', type: 'Text' },
  { field: 'cantidad', title: 'Cantidad', type: 'Number' },
  { field: 'precio', title: 'Precio', type: 'Number', format: 'true', decs: '2', thousandssep: 'true', prefix: '$' },
];

/** Datos en árbol: lista plana con id/idp. */
export const ARBOL = [
  { id: 1, idp: null, nombre: 'Raíz A', valor: 10 },
  { id: 2, idp: 1, nombre: 'Hijo A1', valor: 5 },
  { id: 3, idp: 1, nombre: 'Hijo A2', valor: 7 },
  { id: 4, idp: 2, nombre: 'Nieto A1a', valor: 1 },
  { id: 5, idp: null, nombre: 'Raíz B', valor: 3 },
  { id: 6, idp: 5, nombre: 'Hijo B1', valor: 9 },
  { id: 7, idp: null, nombre: 'Raíz C', valor: 4 },
];
