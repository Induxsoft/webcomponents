// v2: interacción entre fases (F2 pie, F3 columnas, F4 selección). Integración 2026-11-01.
// Referencia generada con F1+F2+F3+F4 integradas: congela el comportamiento combinado para F5 y F6.
import { pagina, tabla } from '../../lib/pagina.mjs';
import { PRODUCTOS, COLS } from './_f3comun.mjs';

const E = ['v2', 'combinados'];
const SCRIPT = `window.__ev = [];
document.addEventListener('DOMContentLoaded', () => {
  const t = ET('t1');
  ['SelectionChanged','ColumnMoved','ColumnVisibilityChanged','ColumnFixedChanged','SummaryCalculated'].forEach(n =>
    t.addEventListener(n, (e) => window.__ev.push([n, e.field ?? null, e.value ?? null, e.scope ?? null, e.selected ?? null])));
});
window.__etExtra = () => { const t = ET('t1'); const s = ETs('t1');
  const una = (tr) => tr ? Array.from(tr.cells).map(x => (x.classList.contains('et-sel-col') ? 'SYS' : (x.getAttribute('field') ?? x.textContent.trim())) + (x.classList.contains('et-fixed') ? '@' + Math.round(parseFloat(x.style.left)) : '')) : null;
  return {
    eventos: window.__ev.splice(0),
    sys: t._etSysCols(),
    campos: t.Columns.map(c => c.field),
    encabezado: una(s.querySelector('thead').rows[0]),
    fila0: una(s.querySelector('tbody').rows[0]),
    pie: una(t._table.tFoot?.rows[0]),
    sel: t.getSelectedRows(),
    totales: t.getSummaries(),
    layout: t.getLayout().columns.map(c => [c.field, c.order, c.hidden, c.fixed]),
    copia: t.getClipboardText(),
    exportar: t.getExportData(),
  }; };`;
const X = { cantidad: { summary: 'sum' }, precio: { summary: 'max', format: 'true', decs: '2' } };
const html = (attrs, x = {}) => pagina({
  body: `<div id="caja" style="width:520px;overflow:auto">${tabla({ attrs: { 'design-auto-save': 'false', ...attrs }, data: PRODUCTOS, cols: COLS({ ...X, ...x }), style: 'display:block;width:900px' })}</div>`,
  script: SCRIPT,
});

export default [
  {
    id: 'combinados-sistema-fijas-pie', titulo: 'checkbox + fijas + pie: celda del sistema fija en 0, fijas después de ella, pie alineado; MoveColumn, HideColumn y FixColumn mueven el pie',
    etiquetas: E, origen: 'spec §2, §4.1, §6, §8', registro: 'consumer',
    html: html({ 'multi-select': 'checkbox', 'column-reorder': 'true', 'column-chooser': 'true' }, { codigo: { fixed: 'left' } }),
    pasos: [
      ['SelectRows([0, 2])', h => h.js(() => ET('t1').SelectRows([0, 2]))],
      ['MoveColumn(cantidad, 1)', h => h.js(() => ET('t1').MoveColumn('cantidad', 1))],
      ['HideColumn(nombre)', h => h.js(() => ET('t1').HideColumn('nombre'))],
      ['FixColumn(precio)', h => h.js(() => ET('t1').FixColumn('precio', true))],
      ['clic en una celda de datos y flecha izquierda hasta el borde', async h => { await h.clicCelda('t1', 1, 3); await h.tecla('ArrowLeft', 3); }],
      ['ResetLayout', h => h.js(() => ET('t1').ResetLayout())],
    ],
  },
  {
    id: 'combinados-alcance-seleccion', titulo: 'summary-scope="selected" con la casilla de fila y la de "todas"; multi-select puesto y quitado después de cargar con pie y fijas',
    etiquetas: E, origen: 'spec §2, §4.1, §6', registro: 'consumer',
    html: html({ 'summary-scope': 'selected' }, { codigo: { fixed: 'left' } }),
    pasos: [
      ['poner multi-select="checkbox"', h => h.js(() => ET('t1').setAttribute('multi-select', 'checkbox'))],
      ['clic en la casilla de la fila 1', h => h.clicShadow('t1', 'tbody tr:nth-child(2) td.et-sel-col input')],
      ['clic en "todas"', h => h.clicShadow('t1', 'thead th.et-sel-col input')],
      ['setLayout con precio primero', h => h.js(() => ET('t1').setLayout({ v: 1, columns: [{ field: 'precio', order: 0 }, { field: 'codigo', order: 1 }, { field: 'nombre', order: 2 }, { field: 'linea', order: 3 }, { field: 'cantidad', order: 4 }] }))],
      ['quitar multi-select', h => h.js(() => ET('t1').removeAttribute('multi-select'))],
    ],
  },
];
