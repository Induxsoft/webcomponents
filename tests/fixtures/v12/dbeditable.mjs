// Reproduce en HTML lo que genera uie.dbeditable (Induxsoft/v12 src/uielements.v12.dkl, líneas 41-323).
//
// - El control-styles, el script del navegador, la leyenda, ExportarCSV, getPrintableHTML, getCurrentContext y la
//   plantilla de acciones son LITERALES: salen de extraido.mjs (generado por tests/tools/extraer-v12.mjs).
// - El marcado (div, edit-table, edit-th, leyenda, «Sin resultados», paginación) está traducido a mano de las
//   líneas 74-150 y 125-152 de uielements.v12.dkl, en el mismo orden de atributos.
// Supuestos (no hay un Devkron en esta máquina para comprobar la salida real; ver README, «Supuestos de V12»):
//   S1. Un atributo DKL con nombre vacío ("#<ifstr(…,'','data')>"='…' en árbol o paginación) no se escribe.
//   S2. "#<tree_opt>"="" escribe el texto de tree_opt tal cual; `literal:true` agrega además el ="" que sobra.
//   S3. #<booleano> se imprime "true"/"false" (booleanos:'10' lo imprime "1"/"0").
//   S4. Los valores de atributo se escapan como HTML (&quot; …); si no, la plantilla de acciones rompería el th.
import * as X from './extraido.mjs';

const esc = (v) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function controlStylesDe(table_id, control_styles = '') {
  return X.controlStyles.replaceAll('##<table_id>', '#' + table_id).replaceAll('#<table_id>', table_id).replaceAll('#<control_styles>', control_styles);
}

export function scriptDe({ table_id, datatable, show_tree, expanded, pagination, rows_per_page, booleanos }) {
  const b = (v) => (booleanos === '10' ? (v ? '1' : '0') : (v ? 'true' : 'false'));
  return X.scriptDbeditable
    .replaceAll('#<table_id>', table_id)
    .replaceAll('#<to.json(datatable)>', JSON.stringify(datatable))
    .replaceAll('#<show_tree>', b(show_tree))
    .replaceAll('#<expanded>', b(expanded))
    .replaceAll('#<pagination>', b(pagination))
    .replaceAll('#<rows_per_page>', String(rows_per_page));
}

/**
 * columns: objeto { campo: { caption, align|textalign, format, thousandssep, decs, prefix, sufix, class, 'no-print',
 *          minwidth|min-width, width, maxwidth|max-width, maxlength|max-length, template } } (orden de inserción)
 */
export function dbeditable(def) {
  const {
    table_id, datatable = [], columns = {}, show_tree = false, treeopt = {}, pagination: pag = false,
    rows_per_page = 250, tableheight = '75vh', control_styles = '', table_footer, leyend, booleanos = 'truefalse', literal = false,
  } = def;
  const pagination = !show_tree && !!pag;
  let tree_opt = '';
  if (show_tree) {
    const keyfield = treeopt.key ?? 'sys_pk', parentkey = treeopt.parentkey ?? 'parent', childsfield = treeopt['childs-field'] ?? '__items';
    tree_opt = `show-tree="true" key="${keyfield}" parentkey="${parentkey}" childs-field="${childsfield}" can-move-row="false"`;
  }
  const expanded = !!(show_tree && treeopt.expanded);
  const footer = table_footer ?? (leyend ?? X.leyendaPorOmision);
  const dataAttr = (show_tree || pagination) ? '' : ` data='${esc(JSON.stringify(datatable))}'`;
  const treeAttr = tree_opt ? ' ' + tree_opt + (literal ? '=""' : '') : '';
  const ths = Object.entries(columns).map(([key, opt]) => {
    const has = (k) => Object.prototype.hasOwnProperty.call(opt, k);
    const bool = (v) => (v === true || v === 'true' || v === 1 || v === '1');
    const align = has('align') ? opt.align : (opt.textalign ?? '');
    const format = bool(opt.format) ? 'true' : 'false';
    const thousandssep = bool(opt.thousandssep) ? 'true' : 'false';
    const decs = (Number(opt.decs ?? 0) <= 0) ? 1 : Number(opt.decs);
    const klass = ((opt.class ?? '') + ' ' + (bool(opt['no-print']) ? 'no-print' : '')).trim();
    const minwidth = has('min-width') ? opt['min-width'] : (opt.minwidth ?? '');
    const width = opt.width ?? '';
    const maxwidth = has('max-width') ? opt['max-width'] : (opt.maxwidth ?? '');
    const maxlength = has('max-length') ? opt['max-length'] : (opt.maxlength ?? '');
    const template = opt.template ?? '';
    let a = ` type="NoEditable" field="${esc(key)}" textalign="${esc(align)}" format="${format}" thousandssep="${thousandssep}" decs="${decs}" prefix="${esc(opt.prefix ?? '')}" sufix="${esc(opt.sufix ?? '')}" class="${esc(klass)}"`;
    if (minwidth !== '') a += ` minwidth="${esc(minwidth)}"`;
    if (width !== '') a += ` width="${esc(width)}"`;
    if (maxwidth !== '') a += ` maxwidth="${esc(maxwidth)}"`;
    if (maxlength !== '') a += ` maxlength="${esc(maxlength)}"`;
    if (template !== '') a += ` template="${esc(template)}"`;
    return `<edit-th${a}>${opt.caption ?? ''}</edit-th>`;
  }).join('\n');
  const n = datatable.length;
  const pie = n <= 0
    ? `<div class="text-center" id="msg_${table_id}"><h6 style="background-color:#F5F5F5; padding: 10rem 0;">Sin resultados</h6></div>`
    : `<small class="text-secondary hide-on-print" id="${table_id}_leyend">${String(footer).replaceAll('#', String(n))}</small>`;
  const paginacion = pagination ? `<div id="${table_id}_pagination" class="d-flex justify-content-center align-items-center gap-1 py-2"></div>` : '';
  return `<div style="height:100%;"><div style="overflow-y:auto; max-height:${tableheight};" id="list_table_container"><edit-table id="${table_id}"${dataAttr}${treeAttr} hidde-selector="true" cards-responsive="true" style="width:100%;" control-styles="${esc(controlStylesDe(table_id, control_styles))}"><edit-thead><edit-tr>
${ths}
</edit-tr></edit-thead></edit-table></div>${pie}${paginacion}<script type="text/javascript" id="uie.dbeditable-script">${scriptDe({ table_id, datatable, show_tree, expanded, pagination, rows_per_page, booleanos })}</script></div>`;
}

/** getCurrentContext() de list.dk:84-89 */
export function getCurrentContextDe(table_id) {
  return X.getCurrentContext.replaceAll('#<table_id>', table_id);
}

export const plantillaAcciones = X.plantillaAcciones;

/** v12navbar mínimo con el ExportarCSV literal; SaveBlob guarda el blob en window.__csvBlob. */
export const v12navbarJS = `window.v12navbar = {
  titleView: 'lista-prueba',
  SaveBlob(blob, filename) { window.__csvBlob = blob; window.__csvNombre = filename; },
  ${X.exportarCSV}
};`;

export const getPrintableHTMLJS = X.getPrintableHTML;
