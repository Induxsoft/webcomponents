// Réplicas de lo que generan los consumidores reales de EdiTable (V12 y FactuDesk v12), con datos ficticios.
import { attr } from './html.mjs';

/** Salida de uie.dbeditable (uielements.v12.dkl:41-323) para una lista, un árbol o una lista paginada. */
export function paginaV12({ id = 'tbl_clientes', modo = 'lista', data, cols, porPagina = 2, expanded = false, treeKey = 'sys_pk', treeParent = 'parent', alto = '300px', controlStyles = '' }) {
  const tree = modo === 'arbol';
  const pag = modo === 'paginada';
  const dataAttr = (tree || pag) ? '' : ` data="${attr(JSON.stringify(data))}"`;
  const treeAttrs = tree ? ` show-tree="true" key="${treeKey}" parentkey="${treeParent}" childs-field="__items" can-move-row="false"` : '';
  const cs = `div:has(table#${id}) { overflow:revert !important; } #${id} tr th { font-weight:500; } @media print { #${id} { overflow:hidden; } } ${controlStyles}`;
  const ths = cols.map(c => `<edit-th type="NoEditable" field="${c.field}" textalign="${c.align ?? ''}" format="${c.format ? 'true' : 'false'}" thousandssep="${c.thousandssep ? 'true' : 'false'}" decs="${c.decs ?? 1}" prefix="${c.prefix ?? ''}" sufix="${c.sufix ?? ''}" class="${c.class ?? ''}"${c.width ? ` width="${c.width}"` : ''}${c.template ? ` template="${attr(c.template)}"` : ''}>${c.caption}</edit-th>`).join('');
  const body = `<div style="height:100%;"><div style="overflow-y:auto; max-height:${alto};" id="list_table_container">
<edit-table id="${id}"${dataAttr}${treeAttrs} hidde-selector="true" cards-responsive="true" style="width:100%;" control-styles="${attr(cs)}">
<edit-thead><edit-tr>${ths}</edit-tr></edit-thead></edit-table></div>
<small class="text-secondary hide-on-print" id="${id}_leyend">Mostrando los primeros ${data.length} registros ordenados por código</small>
${pag ? `<div id="${id}_pagination"></div>` : ''}</div>`;
  const script = `
document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("${id}");
  const data = ${JSON.stringify(data)};
  const pages = {};
  if (table) {
    table.AutoAddRow = false; table.AutoDelRow = false; table.EverMove = false;
    if (${tree}) { table.removeAttribute("data"); table.DataArray = data; table._expandOnStart = ${expanded}; table._printTreeData(); }
    if (${pag}) {
      let perPage = ${porPagina}; let numItems = data.length; let numPages = Math.ceil(numItems / perPage); let currentPage = 1;
      for (let i = 0; i < numItems; i += perPage) pages[Object.keys(pages).length + 1] = data.slice(i, i + perPage);
      const renderPagination = () => {
        const container = document.getElementById("${id}_pagination");
        if (!container || numPages <= 1) return;
        let html = '';
        for (let page = 1; page <= numPages; page++) html += '<button type="button" data-p="' + page + '" onclick="pagination.goto(' + page + ')">' + page + '</button>';
        container.innerHTML = html;
      };
      window.pagination = { goto: (numPage) => {
        if (numPage < 1 || numPage > numPages) return;
        const leyend = document.getElementById("${id}_leyend");
        currentPage = numPage;
        table.DataArray = pages[numPage] ?? [];
        if (leyend) { let start = (numPage - 1) * perPage; let end = start + table.DataArray.length; leyend.textContent = "Mostrando registros: " + start + " a " + end + " de " + numItems; }
        table._printRows();
        renderPagination();
      } };
      table.removeAttribute("data");
      pagination.goto(1);
    }
    table.Events[table.EdiTable.Const.Events.OnSort] = (e) => {
      const table_leyend = document.getElementById("${id}_leyend");
      let length = (table?.DataArray ?? []).length;
      let leyend = "No se encontraron resultados.";
      if (length > 0) leyend = "Mostrando los primeros " + length + " registros";
      if (e && length > 0) leyend += " ordenados por " + e.caption + " " + e.coldef.sort;
      table_leyend.textContent = leyend;
    };
  }
});
function getCurrentContext() {
  const table = document.getElementById("${id}");
  const id = (table?.DataArray[table.CurrentRowIndex()]?.sys_pk ?? "");
  return { item_id: id, context: {} };
}
// v12navbar.ExportarCSV (uielements.v12.dkl:655-701), parte de edit-table
function exportarCSVV12() {
  let csv = [];
  const editables = document.querySelectorAll("edit-table");
  for (let i = 0; i < editables.length; i++) {
    const table = editables[i]; let titles = []; let fields = [];
    table.Columns.forEach(c => { if (!["hide-on-print", "no-print"].includes(c.class)) { titles.push(c.title); fields.push(c.field); } });
    csv.push(titles.join(","));
    for (let j = 0; j < table.DataArray.length; j++) {
      let item = table.DataArray[j]; let row = [];
      fields.forEach(f => { let v = item[f]?.toString() ?? ""; if (v.includes('"')) v = v.replaceAll('"', "&quot;"); if (v.includes("'")) v = v.replaceAll("'", "&apos;"); if (v.includes(",")) v = '"' + v + '"'; row.push(v); });
      csv.push(row.join(","));
    }
  }
  return csv.join("\\n");
}
// induxsoft.v12.ui.js:47-56 (getPrintableHTML): clona la tabla interna
function clonV12(id) { const el = document.getElementById(id); return el._shadow.getElementById(el.id).cloneNode(true); }
`;
  return { body, script };
}

export const COLS_V12 = [
  { field: 'codigo', caption: 'Código' },
  { field: 'nombre', caption: 'Nombre' },
  { field: 'rfc', caption: 'RFC', class: 'no-print' },
  { field: 'saldo', caption: 'Saldo', align: 'end', format: true, thousandssep: true, decs: 2, prefix: '$' },
];

// ---------- FactuDesk v12 (emitir/pagina.dk:441 y assets/vendor/edittable/edittable-tema.js) ----------
export const TEMA_FD = [
  'table{font-family:var(--fd-font);font-size:var(--fd-fs-sm);color:var(--fd-text);border-spacing:0;}',
  'thead{background-color:var(--fd-surface-alt);}',
  'thead tr th{outline:none;border-bottom:1px solid var(--fd-border);padding:10px;color:var(--fd-text-muted);font-size:var(--fd-fs-xs);font-weight:800;text-align:left;white-space:nowrap;}',
  '.EdiTable-Cell{outline:none;border-bottom:1px solid var(--fd-border);padding:4px 6px;height:2.25rem;}',
  'tbody tr:hover{background-color:var(--fd-surface-alt);}',
  '.EdiTable-Selector{box-sizing:border-box;background-color:transparent;color:var(--fd-text);border:1px solid transparent;border-radius:var(--fd-radius-xs);padding:0 4px;}',
  '.EdiTable-Selector:focus{border-color:var(--fd-brand);}',
  '.EdiTable-Row-Selected{background-color:var(--fd-brand-soft) !important;color:var(--fd-text) !important;}',
  '.Editable-Input-Number,.Editable-Input-Text,.Editable-Input-Memo,.Editable-Input-Date,.Editable-Input-DateTime,.Editable-Input-Select{font-family:var(--fd-font);font-size:var(--fd-fs-sm);color:var(--fd-text);background-color:var(--fd-surface);outline:2px solid var(--fd-brand);outline-offset:-2px;border-radius:var(--fd-radius-xs);}',
  '.EdiTable-Button{color:var(--fd-brand-strong);}',
  'th.ascendent::after,th.descendent::after{opacity:.6;}',
].join('');

export const COLS_FD = `
<edit-th type="NoEditable" field="codigo" width="110px">Código</edit-th>
<edit-th type="Memo" field="descripcion" minwidth="220px">Descripción</edit-th>
<edit-th type="NoEditable" field="unidad" width="90px">Unidad</edit-th>
<edit-th type="Number" field="cantidad" textalign="end" width="90px" default="1">Cantidad</edit-th>
<edit-th type="Number" field="precio" textalign="end" format="true" thousandssep="true" decs="2" prefix="$" width="120px">Precio</edit-th>
<edit-th type="Number" field="descuentos" textalign="end" format="true" thousandssep="true" decs="2" prefix="$" width="110px" default="0">Descuento</edit-th>
<edit-th type="Text" field="predial" width="150px">Cuenta predial</edit-th>
<edit-th type="NoEditable" field="ObjetoImp" width="70px">Obj. imp.</edit-th>
<edit-th type="NoEditable" field="iva" textalign="end" format="true" thousandssep="true" decs="2" prefix="$" width="100px">IVA</edit-th>
<edit-th type="NoEditable" field="importe" textalign="end" format="true" thousandssep="true" decs="2" prefix="$" width="120px">Importe</edit-th>`;

export function paginaFD() {
  const body = `<style>:root{--fd-font:Arial,sans-serif;--fd-fs-sm:14px;--fd-fs-xs:12px;--fd-text:rgb(20, 20, 20);--fd-text-muted:#666;--fd-border:rgb(221, 221, 221);--fd-surface:#fff;--fd-surface-alt:rgb(245, 245, 245);--fd-brand:rgb(11, 110, 99);--fd-brand-soft:rgb(220, 240, 238);--fd-brand-strong:#064;--fd-radius-xs:3px;}</style>
<edit-table id="em-conceptos" hide-row-selector="true" data="[]"><edit-thead><edit-tr>${COLS_FD}</edit-tr></edit-thead></edit-table>
<input id="em-concepto-buscar">
<script>(function(){var S=${JSON.stringify(TEMA_FD)};document.querySelectorAll("edit-table").forEach(function(el){if(!el.hasAttribute("control-styles"))el.setAttribute("control-styles",S);});})();</script>`;
  const script = `
var tabla = document.getElementById("em-conceptos");
window.quitadas = [];
function calcRenglon(r){ var imp = Number(r.cantidad) * Number(r.precio) - Number(r.descuentos || 0); r.iva = +(imp * 0.16).toFixed(2); r.importe = +imp.toFixed(2); return r; }
function agregarConcepto(c){ var r = calcRenglon({codigo:c.codigo, descripcion:c.descripcion, unidad:'H87', cantidad:'1', precio:String(c.precio), descuentos:'0', predial:'', ObjetoImp:'02'}); var i = tabla.DataArray.push(r) - 1; tabla._printRows(); return i; }
function celdaCantidad(i){ var tr = tabla.GetTrByIndex(i); return (tr && Array.prototype.find.call(tr.querySelectorAll("td"), function(x){ var c = tabla.GetColumnDefOfTd(x); return c && c.field === "cantidad"; })) || null; }
function enfocarCantidad(i){ var td = celdaCantidad(i); tabla.CellFocus(td); tabla.StartEdit(td, ""); var input = tabla.EdiTable.GetInput(); if (input) input.select(); }
document.addEventListener("DOMContentLoaded", function () {
  tabla.AutoAddRow = false;
  tabla.hideColumn("predial", true);
  tabla.addEventListener("fieldupdated", function (e) { var r = tabla.DataArray[e.row]; if (!r) return; calcRenglon(r); tabla.UpdateRow(e.row); });
  HTMLElement.prototype.addEventListener.call(tabla, "keydown", function (ev) {
    if (tabla.Editing || ev.ctrlKey || ev.altKey || ev.shiftKey || ev.metaKey) return;
    var i = tabla.CurrentRowIndex(); if (i < 0 || !tabla.DataArray[i]) return;
    if (ev.key === "ArrowDown" && i === tabla.DataArray.length - 1) { ev.preventDefault(); ev.stopPropagation(); document.getElementById("em-concepto-buscar").focus(); }
    else if (ev.key === "Delete") { ev.preventDefault(); ev.stopPropagation(); window.quitadas.push(tabla.DataArray[i].codigo); tabla.DataArray.splice(i, 1); tabla._printRows(); }
  }, true);
  var sel = []; tabla.Columns.forEach(function (c, i) { if (["NoEditable","Badges","Custom"].indexOf(String(c.type||"")) >= 0) sel.push("tbody td:nth-child(" + (i + 1) + ")", "thead th:nth-child(" + (i + 1) + ")"); });
  var st = document.createElement("style"); st.id = "fd-sombreado"; st.textContent = sel.join(",") + "{background-color:rgb(237, 237, 237);}"; tabla._shadow.appendChild(st);
});`;
  return { body, script };
}
