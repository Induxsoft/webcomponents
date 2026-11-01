// Correcciones de F1 que no tenían escenario en F0 (spec §1 y §1.1: C13, C15, C17, C18; §13: P37).
// La referencia de estos escenarios se generó con la versión F1: congela el comportamiento corregido.
// La foto de 0ed1824 (el «antes») está resumida en tests/CAMBIOS-F1.md.
import { pagina, tabla } from '../../lib/pagina.mjs';

const C = ['correccion-f1'];

// Registra FieldUpdated, IsDirtyChanged y MaskInvalid sin cambiar el camino del componente (registro: consumer).
const SCRIPT = `window.__ev = [];
document.addEventListener('DOMContentLoaded', () => {
  const t = ET('t1');
  t.backup();
  t.Events.fieldupdated = (e) => window.__ev.push(['fieldupdated', e.row, e.field, e.value]);
  t.Events.isdirtychanged = () => window.__ev.push(['isdirtychanged', t.IsDirty]);
  t.addEventListener('MaskInvalid', (e) => window.__ev.push(['maskinvalid', e.row, e.field, e.reason, e.cancel]));
});
window.__etExtra = () => ({ eventos: window.__ev.splice(0), datos: ET('t1').DataArray.map(r => Object.assign({}, r, { __tipos: Object.keys(r).map(k => k + ':' + typeof r[k]).join(',') })) });`;

const html = (cols, data) => pagina({ body: tabla({ data, cols }), script: SCRIPT });
// Entra a la celda, abre el editor con F2 y confirma con Enter sin cambiar nada.
const sinCambio = (fila, col) => async h => { await h.clicCelda('t1', fila, col); await h.tecla('F2'); await h.tecla('Enter'); };

export default [
  {
    id: 'c13-number-step-any',
    titulo: 'C13: el editor nativo de Number lleva step="any" y un decimal no lo deja :invalid',
    etiquetas: C, origen: 'spec §1.1 C13; editable.js StartEdit', registro: 'consumer',
    html: pagina({ body: tabla({ data: [{ n: 1, b: 'x' }], cols: [{ field: 'n', title: 'N', type: 'Number' }, { field: 'b', title: 'B', type: 'Text' }] }),
      script: `window.__etExtra = () => { const i = ETs('t1').querySelector('#__table_input'); return i ? { step: i.getAttribute('step'), valido: i.validity.valid, invalid: i.matches(':invalid') } : null; };` }),
    pasos: [
      ['clic y F2', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('F2'); }],
      ['borrar y teclear 12.5', async h => { await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('12.5'); }],
      ['Enter', h => h.tecla('Enter')],
    ],
  },
  {
    id: 'c15-number-badinput',
    titulo: 'C15: con badInput (1-2) no se confirma, sigue en edición y se dispara MaskInvalid reason:badInput',
    etiquetas: C, origen: 'spec §1.1 C15; editable.js ConfirmEdit', registro: 'consumer',
    html: html([{ field: 'n', title: 'N', type: 'Number' }, { field: 'b', title: 'B', type: 'Text' }], [{ n: 1, b: 'x' }]),
    pasos: [
      ['clic, F2, borrar y teclear 1-2', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('1-2'); }],
      ['Enter (no confirma)', h => h.tecla('Enter')],
      ['clic en otra celda (tampoco confirma ni vuelve a avisar)', h => h.clicCelda('t1', 0, 1)],
      ['Escape (cancela; DataArray sigue igual)', h => h.tecla('Escape')],
    ],
  },
  {
    id: 'c17-date-sin-cambio',
    titulo: 'C17: Date con 2026-02-01 10:30:00, 01/02/2026 y …T00:00:00.000Z: confirmar sin cambiar no toca DataArray ni dispara eventos',
    etiquetas: C, origen: 'spec §1.1 C17 (casos verificados)', registro: 'consumer',
    html: html([{ field: 'f', title: 'Fecha', type: 'Date' }, { field: 'b', title: 'B', type: 'Text' }],
      [{ f: '2026-02-01 10:30:00', b: 'a' }, { f: '01/02/2026', b: 'b' }, { f: '2026-02-01T00:00:00.000Z', b: 'c' }]),
    pasos: [
      ['fila 0: F2 y Enter', sinCambio(0, 0)],
      ['fila 1: F2 y Enter', sinCambio(1, 0)],
      ['fila 2: F2 y Enter', sinCambio(2, 0)],
    ],
  },
  {
    id: 'c17-datetime-sin-cambio',
    titulo: 'C17: DateTime con segundos y con Z: confirmar sin cambiar no reescribe el formato ni pierde los segundos',
    etiquetas: C, origen: 'spec §1.1 C17 (casos verificados)', registro: 'consumer',
    html: html([{ field: 'f', title: 'Fecha y hora', type: 'DateTime' }, { field: 'b', title: 'B', type: 'Text' }],
      [{ f: '2026-02-01T10:30:15', b: 'a' }, { f: '2026-02-01 10:30:00', b: 'b' }, { f: '2026-02-01T16:30:00Z', b: 'c' }]),
    pasos: [
      ['fila 0: F2 y Enter', sinCambio(0, 0)],
      ['fila 1: F2 y Enter', sinCambio(1, 0)],
      ['fila 2: F2 y Enter', sinCambio(2, 0)],
    ],
  },
  {
    id: 'c17-number-text-sin-cambio',
    titulo: 'C17: Number (número 12.5 y con formato) y Text: confirmar sin cambiar conserva valor y tipo, sin FieldUpdated ni IsDirtyChanged; un cambio real sí se guarda',
    etiquetas: C, origen: 'spec §1.1 C17', registro: 'consumer',
    html: html([{ field: 'n', title: 'N', type: 'Number' }, { field: 'm', title: 'M', type: 'Number', format: 'true', decs: '2' }, { field: 't', title: 'T', type: 'Text' }],
      [{ n: 12.5, m: 1234.5678, t: 'abc' }]),
    pasos: [
      ['Number: F2 y Enter', sinCambio(0, 0)],
      ['Number con formato: F2 y Enter', sinCambio(0, 1)],
      ['Text: F2 y Enter', sinCambio(0, 2)],
      ['Text: cambio real (abd)', async h => { await h.clicCelda('t1', 0, 2); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('abd'); await h.tecla('Enter'); }],
      ['Text: teclear una letra y volver al valor: sí se guarda (se abrió con una tecla)', async h => { await h.clicCelda('t1', 0, 2); await h.tecla('x'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = 'abd'; }); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'c18-editor-fecha',
    titulo: 'C18: el editor nativo de Date y DateTime recibe el valor normalizado (espacio, segundos, Z u offset); 01/02/2026 abre vacío',
    etiquetas: C, origen: 'spec §1.1 C18', registro: 'consumer',
    html: html([{ field: 'd', title: 'Date', type: 'Date' }, { field: 't', title: 'DateTime', type: 'DateTime' }],
      [{ d: '2026-02-01 10:30:00', t: '2026-02-01 10:30:00' }, { d: '2026-02-01T00:00:00.000Z', t: '2026-02-01T16:30:00Z' }, { d: '01/02/2026', t: '2026-02-01T11:30:00-05:00' }]),
    pasos: [
      ['Date fila 0: F2', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('F2'); }],
      ['Escape; Date fila 1: F2', async h => { await h.tecla('Escape'); await h.clicCelda('t1', 1, 0); await h.tecla('F2'); }],
      ['Escape; Date fila 2: F2 (vacío)', async h => { await h.tecla('Escape'); await h.clicCelda('t1', 2, 0); await h.tecla('F2'); }],
      ['Escape; DateTime fila 0: F2', async h => { await h.tecla('Escape'); await h.clicCelda('t1', 0, 1); await h.tecla('F2'); }],
      ['Escape; DateTime fila 1 (Z → hora local): F2', async h => { await h.tecla('Escape'); await h.clicCelda('t1', 1, 1); await h.tecla('F2'); }],
      ['Escape; DateTime fila 2 (-05:00 → hora local): F2', async h => { await h.tecla('Escape'); await h.clicCelda('t1', 2, 1); await h.tecla('F2'); }],
      ['Escape', h => h.tecla('Escape')],
    ],
  },
  {
    id: 'c21-sorttree-nietos',
    titulo: 'C21: ordenar en árbol ordena también a los nietos (una raíz con un solo hijo y dos nietos desordenados)',
    etiquetas: C, origen: 'spec §13 C21; editable.js SortTree',
    html: pagina({ body: tabla({ attrs: { 'show-tree': 'true' }, data: [{ id: 1, idp: null, n: 'Raíz' }, { id: 2, idp: 1, n: 'Hijo' }, { id: 3, idp: 2, n: 'Nieto Z' }, { id: 4, idp: 2, n: 'Nieto A' }], cols: [{ field: 'n', title: 'Nombre', type: 'Text' }] }),
      script: `document.addEventListener('DOMContentLoaded', () => { ET('t1')._expandOnStart = true; ET('t1')._printTreeData(); });` }),
    pasos: [
      ['clic en el encabezado (ordena)', h => h.clicEncabezado('t1', 0)],
      ['clic otra vez (orden inverso)', h => h.clicEncabezado('t1', 0)],
    ],
  },
  {
    id: 'click-propagation-sin-atributo',
    titulo: 'P37: sin click-propagation el clic de la celda no llega a la fila ni al documento (igual que 0ed1824)',
    etiquetas: C, origen: 'spec §13 P37; editable.js Initialize/InsertRow', registro: 'consumer',
    html: pagina({ body: tabla({ data: [{ a: 'x', b: 1 }, { a: 'y', b: 2 }], cols: [{ field: 'a', title: 'A', type: 'Text' }, { field: 'b', title: 'B', type: 'Number' }] }),
      script: `window.__c = { tr: 0, doc: 0 }; document.addEventListener('click', () => window.__c.doc++);
document.addEventListener('DOMContentLoaded', () => { ETs('t1') && ETs('t1').querySelectorAll('tbody tr').forEach(tr => tr.onclick = () => window.__c.tr++); });
window.__etExtra = () => Object.assign({}, window.__c);` }),
    pasos: [
      ['clic en (0,0)', h => h.clicCelda('t1', 0, 0)],
      ['clic en el selector (empieza a editar)', h => h.clicCelda('t1', 0, 0)],
      ['Escape y clic en (1,1)', async h => { await h.tecla('Escape'); await h.clicCelda('t1', 1, 1); }],
    ],
  },
  {
    id: 'click-propagation-true',
    titulo: 'P37: con click-propagation="true" el clic llega a la fila y al documento después de procesarlo el componente',
    etiquetas: C, origen: 'spec §13 P37', registro: 'consumer',
    html: pagina({ body: tabla({ attrs: { 'click-propagation': 'true' }, data: [{ a: 'x', b: 1 }, { a: 'y', b: 2 }], cols: [{ field: 'a', title: 'A', type: 'Text' }, { field: 'b', title: 'B', type: 'Number' }] }),
      script: `window.__c = { tr: 0, doc: 0, filaAlLlegar: [] }; document.addEventListener('click', () => { window.__c.doc++; window.__c.filaAlLlegar.push(ET('t1').CurrentRowIndex()); });
document.addEventListener('DOMContentLoaded', () => { ETs('t1').querySelectorAll('tbody tr').forEach(tr => tr.onclick = () => window.__c.tr++); });
window.__etExtra = () => ({ tr: window.__c.tr, doc: window.__c.doc, filaAlLlegar: window.__c.filaAlLlegar.splice(0), ClickPropagation: ET('t1').ClickPropagation });` }),
    pasos: [
      ['clic en (0,0)', h => h.clicCelda('t1', 0, 0)],
      ['clic en el selector (empieza a editar)', h => h.clicCelda('t1', 0, 0)],
      ['Escape y clic en (1,1)', async h => { await h.tecla('Escape'); await h.clicCelda('t1', 1, 1); }],
    ],
  },
];
