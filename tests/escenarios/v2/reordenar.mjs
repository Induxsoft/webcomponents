// v2 §8: reordenar columnas con column-reorder (F3).
import { html, arrastrarTh } from './_f3comun.mjs';
const E = ['v2', 'f3', 'reorder'];
export default [
  {
    id: 'reordenar', titulo: 'MoveColumn, BeforeColumnMove cancelado, reorder="false", arrastre del th con et-drop-indicator, Ctrl+Mayús+flecha, y edición en la columna movida',
    etiquetas: E, origen: 'spec §8', registro: 'consumer',
    html: html({ attrs: { 'column-reorder': 'true' }, x: { codigo: { reorder: 'false' } },
      script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); const prev = t.Events.beforecolumnmove; t.Events.beforecolumnmove = (e) => { prev(e); if (e.field === 'linea' && window.__bloquear) e.cancel = true; }; });` }),
    pasos: [
      ['MoveColumn(precio,1)', h => h.js(() => ET('t1').MoveColumn('precio', 1))],
      ['MoveColumn(codigo,3) (bloqueada)', h => h.js(() => ET('t1').MoveColumn('codigo', 3))],
      ['MoveColumn(linea,1) cancelado', h => h.js(() => { window.__bloquear = true; ET('t1').MoveColumn('linea', 1); window.__bloquear = false; })],
      ['arrastrar Cantidad antes de Nombre', h => arrastrarTh(h, 4, 2, true)],
      ['Ctrl+Mayús+flecha derecha sobre Nombre', async h => { await h.js(() => ETs('t1').querySelector('thead th[field="nombre"]').focus()); await h.tecla('Control+Shift+ArrowRight'); }],
      ['hideColumn(linea) y MoveColumn(linea,1)', h => h.js(() => { ET('t1').hideColumn('linea', true); ET('t1').MoveColumn('linea', 1); })],
      ['editar Nombre (movida)', async h => { const i = await h.leer(() => ET('t1').Columns.findIndex(c => c.field === 'nombre')); await h.clicCelda('t1', 2, i); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = 'Movido'; }); await h.tecla('Enter'); }],
    ],
  },
];
