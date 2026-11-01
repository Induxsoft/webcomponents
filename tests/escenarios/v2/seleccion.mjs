// F4 (spec §4.1): selección de varias filas con multi-select="checkbox" y "row".
// Congela el comportamiento v2 activado para las fases siguientes (F2 pie, F3 columnas fijas/reordenar, F5, F6).
import { pagina, tabla, COLS_BASE, filas } from '../../lib/pagina.mjs';

const E = ['v2', 'f4', 'seleccion'];
const SCRIPT = `window.__sc = [];
document.addEventListener('DOMContentLoaded', () => {
  const t = ET('t1');
  t.addEventListener('SelectionChanged', (e) => window.__sc.push(JSON.parse(JSON.stringify(e))));
});
window.__etExtra = () => { const t = ET('t1'); return { sel: t.getSelectedRows(), sc: window.__sc.splice(0), sys: t._etSysCols(), cur: [t.CurrentRowIndex(), t.CurrentColIndex()], hide: t.hideColumns.slice(), cols: t.Columns.map(c => c.field) }; };`;
const html = (modo, extra = {}) => pagina({ body: tabla({ data: filas(5), cols: COLS_BASE, attrs: { 'multi-select': modo, ...extra } }), script: SCRIPT });

export default [
  {
    id: 'f4-checkbox', titulo: 'multi-select="checkbox": columna del sistema, casillas, "todas" con estado intermedio, navegación sin la columna del sistema',
    etiquetas: E, origen: 'spec §4.1, §0-R3', registro: 'consumer',
    html: html('checkbox'),
    pasos: [
      ['clic en la celda (1, nombre)', h => h.clicCelda('t1', 1, 2)],
      ['clic en la casilla de la fila 3 (no cambia la celda actual)', h => h.clicShadow('t1', 'tbody tr:nth-child(4) td.et-sel-col input')],
      ['flecha izquierda dos veces (no entra a la columna del sistema)', async h => { await h.tecla('ArrowLeft'); await h.tecla('ArrowLeft'); }],
      ['clic en "todas" (estado intermedio → todas)', h => h.clicShadow('t1', 'thead th.et-sel-col input')],
      ['UnselectRows([0, 4]) y ocultar nombre', h => h.js(() => { const t = ET('t1'); t.UnselectRows([0, 4]); t.hideColumn('nombre', true); })],
      ['ordenar por id (clic en el encabezado de datos 0): la selección sigue a los objetos', h => h.clicEncabezado('t1', 1)],
      ['UpdateRow(1), InsertRow(0) y DeleteRow(2)', h => h.js(() => { const t = ET('t1'); t.UpdateRow(1); t.InsertRow(0, true); t.DeleteRow(2); })],
      ['DataArray nuevo y _printRows: se limpia', h => h.js(() => { const t = ET('t1'); t.DataArray = JSON.parse(JSON.stringify(t.DataArray)); t._printRows(); })],
      ['quitar el atributo: desaparece la columna del sistema', h => h.js(() => ET('t1').removeAttribute('multi-select'))],
    ],
  },
  {
    id: 'f4-row', titulo: 'multi-select="row": Ctrl+clic, Mayús+clic y Espacio; Ctrl+clic en la celda actual no edita',
    etiquetas: E, origen: 'spec §4.1', registro: 'consumer',
    html: html('row'),
    pasos: [
      ['clic en (0, nombre)', h => h.clicCelda('t1', 0, 1)],
      ['Mayús+clic simulado en (2, nombre)', h => h.js(() => { const td = ETs('t1').querySelector('tbody').rows[2].cells[1]; td.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, shiftKey: true })); })],
      ['SelectRows([1, 3]) y Ctrl+clic simulado en la fila 3 (quita)', h => h.js(() => { const t = ET('t1'); t.SelectRows([1, 3]); const td = ETs('t1').querySelector('tbody').rows[3].cells[1]; td.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, ctrlKey: true })); })],
      ['Mayús+clic simulado en la fila 4 (rango desde la ancla)', h => h.js(() => { const td = ETs('t1').querySelector('tbody').rows[4].cells[1]; td.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, shiftKey: true })); })],
      ['Espacio sobre la fila actual', h => h.tecla(' ')],
      ['Ctrl+clic simulado sobre el selector de la celda actual (no edita)', h => h.js(() => { const s = ETs('t1').querySelector('#__table_selector'); s.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, ctrlKey: true })); return ET('t1').Editing; })],
      ['ClearSelection dos veces (el segundo no avisa)', h => h.js(() => { const t = ET('t1'); t.ClearSelection(); t.ClearSelection(); })],
    ],
  },
];
