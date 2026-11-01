// Armado de páginas de prueba en memoria. Todas cargan el componente bajo prueba desde /__et/editable.js
// (o la referencia desde /__ref/editable.js), que sirve run.mjs con el archivo elegido.

export const CSS_BASE = `html,body{margin:0;padding:8px;font-family:"DejaVu Sans",Arial,sans-serif;font-size:14px;background:#fff;color:#000}
*{animation:none!important;transition:none!important}`;

/** Escapa un valor para un atributo HTML entre comillas dobles. */
export function attr(v) {
  return String(v).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function attrs(obj = {}) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${attr(v)}"`)).join('');
}

/**
 * <edit-table> con columnas declaradas.
 * cols: [{ field, title, type, ...otros atributos de edit-th }]
 * data: arreglo (va en el atributo data) | undefined
 * tbody: HTML de <edit-tbody> (opcional)
 */
export function tabla({ id = 't1', a = {}, data, cols = [], tbody = '', style = 'width:100%' } = {}) {
  const d = data === undefined ? '' : ` data="${attr(typeof data === 'string' ? data : JSON.stringify(data))}"`;
  const head = `<edit-thead><edit-tr>${cols.map((c) => {
    const { title, ...rest } = c;
    return `<edit-th${attrs(rest)}>${title ?? c.field ?? ''}</edit-th>`;
  }).join('')}</edit-tr></edit-thead>`;
  return `<edit-table${id ? ` id="${id}"` : ''}${style ? ` style="${style}"` : ''}${attrs(a)}${d}>${head}${tbody}</edit-table>`;
}

/**
 * Página completa.
 * o.body, o.script (al final del body), o.head (después del componente), o.antes (antes del componente),
 * o.src: 'et' (bajo prueba, por omisión) | 'ref' (referencia 0ed1824) | 'ninguno'
 * o.excel: true para cargar /__et/excel.js
 */
export function pagina(o) {
  const ruta = o.src === 'ref' ? '/__ref/editable.js' : '/__et/editable.js';
  const comp = o.src === 'ninguno' ? '' : `<script src="${ruta}"></script>`;
  const excel = o.excel ? '<script src="/__et/excel.js"></script>' : '';
  return `<!DOCTYPE html>
<html lang="${o.lang ?? 'es-MX'}">
<head>
<meta charset="utf-8">
<title>${o.titulo ?? 'conformidad'}</title>
<style>${CSS_BASE}</style>
${o.antes ?? ''}
${comp}
${excel}
${o.head ?? ''}
</head>
<body>
${o.body ?? ''}
${o.script ? `<script>\n${o.script}\n</script>` : ''}
</body>
</html>`;
}
