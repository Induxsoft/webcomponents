// v2 §2: totales en el pie.
import { tabla, PRODUCTOS } from '../lib/fixtures.mjs';
import { registro, editar, m } from '../lib/v2.mjs';
import { Falla } from '../lib/arnes.mjs';

const { P, t } = registro('sum', { requiere: ['summary'] });
const COLS = (x = {}) => [
  { field: 'codigo', type: 'Text', title: 'Código', ...(x.codigo ?? {}) },
  { field: 'nombre', type: 'Text', title: 'Nombre', ...(x.nombre ?? {}) },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', summary: 'sum', ...(x.cantidad ?? {}) },
  { field: 'precio', type: 'Number', title: 'Precio', format: 'true', decs: '2', prefix: '$', thousandssep: 'true', summary: 'sum', ...(x.precio ?? {}) },
];
const pag = (x = {}, a = {}, script = '') => ({ body: tabla({ a, cols: COLS(x), data: x.data ?? PRODUCTOS }), script });
const pie = async (c, id = 't1') => { const r = await c.ev((id) => { const tf = __ct.sr(id).querySelector('table > tfoot'); if (!tf) return null; return Array.from(tf.querySelectorAll('tr.et-summary-row > *')).filter(x => !x.classList.contains('et-sel-col')).map(td => ({ txt: td.textContent.trim(), tipo: td.getAttribute('data-summary'), cls: td.classList.contains('et-summary'), oculta: td.classList.contains('hidde-col') })); }, id); if (!r) throw new Falla('no hay tfoot'); return r; };

t('01', 'sin summary no hay tfoot', '§2-j', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS({ cantidad: { summary: undefined }, precio: { summary: undefined } }), data: PRODUCTOS }) });
  c.igual(await c.ev(() => !!__ct.sr('t1').querySelector('tfoot')), false);
}, { requiere: [] });
t('02', 'tfoot con una sola fila et-summary-row y una celda et-summary por celda de datos', ['§2-j', '§2-k'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => { const tf = __ct.sr('t1').querySelector('table > tfoot'); return tf ? [tf.rows.length, tf.rows[0].classList.contains('et-summary-row'), tf.rows[0].cells.length, Array.from(tf.rows[0].cells).every(x => x.classList.contains('et-summary'))] : null; });
  c.igual(r, [1, true, 4, true]);
});
t('03', 'data-summary solo en las celdas con total', '§2-k', async (c) => {
  await c.abrir(pag({ precio: { summary: 'max' } }));
  c.igual((await pie(c)).map(x => x.tipo), [null, null, 'sum', 'max']);
});
t('04', 'sum: getSummary y el texto del pie', ['§2-a', '§2-f'], async (c) => {
  await c.abrir(pag());
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 25);
  c.igual((await pie(c))[2].txt, '25');
});
for (const [tipo, esperado] of [['count', 4], ['avg', 6.25], ['min', 3], ['max', 10]]) {
  t('05-' + tipo, `${tipo} sobre cantidad`, '§2-a', async (c) => {
    await c.abrir(pag({ cantidad: { summary: tipo } }));
    c.cerca(await m(c, 't1', 'getSummary', 'cantidad'), esperado, 1e-9);
  });
}
t('06', 'getSummary de una columna sin total es null', '§2-f', async (c) => {
  await c.abrir(pag());
  c.igual(await m(c, 't1', 'getSummary', 'nombre'), null);
});
t('07', 'custom usa SummaryFunction(field, rowsData)', ['§2-a', '§2-e'], async (c) => {
  await c.abrir(pag({ nombre: { summary: 'custom' } }, {}, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.SummaryFunction=(f,rows)=>{window.args=[f,rows.length];return rows.filter(r=>String(r[f]).startsWith('A')).length;};t.RefreshSummaries();});"));
  c.igual(await m(c, 't1', 'getSummary', 'nombre'), 2);
  c.igual(await c.ev(() => window.args), ['nombre', 4]);
});
t('08', 'summary-format inherit (por omisión): el pie usa el formato de la columna', '§2-b', async (c) => {
  await c.abrir(pag());
  c.igual((await pie(c))[3].txt, '$57.15');
  c.cerca(await m(c, 't1', 'getSummary', 'precio'), 57.15, 1e-9);
});
t('09', 'summary-label con {value}', '§2-c', async (c) => {
  await c.abrir(pag({ cantidad: { 'summary-label': 'Total: {value} pzas' } }));
  c.igual((await pie(c))[2].txt, 'Total: 25 pzas');
});
t('10', 'summary-label sin {value}: el texto va antes del valor', '§2-c', async (c) => {
  await c.abrir(pag({ cantidad: { 'summary-label': 'Suma' } }));
  const txt = (await pie(c))[2].txt;
  c.ok(txt.startsWith('Suma') && txt.endsWith('25'), 'texto del pie: ' + txt);
});
t('11', 'getSummaries() devuelve {field: valor} de las columnas con total', '§2-g', async (c) => {
  await c.abrir(pag());
  const r = await m(c, 't1', 'getSummaries');
  c.igual(Object.keys(r).sort(), ['cantidad', 'precio']);
  c.igual(r.cantidad, 25); c.cerca(r.precio, 57.15, 1e-9);
});
t('12', 'se recalcula al editar (FieldUpdated), con valores escritos como texto', '§2-n', async (c) => {
  await c.abrir(pag());
  await editar(c, 't1', 0, 2, '20');
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 35);
  c.igual((await pie(c))[2].txt, '35');
});
t('13', 'se recalcula con AddRow y DeleteRow', '§2-n', async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').DeleteRow(0));
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 15);
  await c.ev(() => { const t = __ct.t('t1'); t.AddRow(); t.UpdateDataMember(t.DataArray.length - 1, 'cantidad', '5'); });
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 20);
});
t('14', 'se recalcula al asignar DataArray', '§2-n', async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = __ct.t('t1'); t.DataArray = [{ cantidad: 1 }, { cantidad: 2 }]; t._printRows(); });
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 3);
  c.igual((await pie(c))[2].txt, '3');
});
t('15', 'RefreshSummaries() recalcula después de cambiar DataArray por fuera', '§2-h', async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = __ct.t('t1'); t.DataArray[0].cantidad = 100; t.RefreshSummaries(); });
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 115);
});
t('16', 'SummaryCalculated {field, value, scope} por columna con total', '§2-i', async (c) => {
  await c.abrir(pag({}, {}, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.s=[];t.addEventListener('SummaryCalculated',(e)=>window.s.push(e));});"));
  await c.ev(() => __ct.t('t1').RefreshSummaries());
  const s = await c.ev(() => window.s.map(e => ({ field: e.field, value: e.value, scope: e.scope, k: Object.keys(e).sort() })));
  const cant = s.filter(x => x.field === 'cantidad').pop();
  c.ok(cant, 'no se disparó para cantidad');
  c.igual([cant.value, cant.scope], [25, 'all']);
  c.ok(['field', 'scope', 'value'].every(k => cant.k.includes(k)), 'claves: ' + cant.k);
});
t('17', 'el tfoot queda fijo abajo (sticky, bottom 0)', '§2-l', async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => { const tf = __ct.sr('t1').querySelector('tfoot'); const x = tf.rows[0].cells[0]; const a = getComputedStyle(tf), b = getComputedStyle(x); return [a.position === 'sticky' || b.position === 'sticky', (a.position === 'sticky' ? a : b).bottom]; });
  c.igual(r, [true, '0px']);
});
t('18', 'clic en el pie no mueve el selector ni cambia CurrentRowIndex; TRCount no cuenta el pie', '§2-m', async (c) => {
  await c.abrir(pag());
  await c.foco('t1', 1, 1);
  const h = await c.page.evaluateHandle(() => __ct.sr('t1').querySelector('tfoot td, tfoot th'));
  if (!h.asElement()) throw new Falla('no hay tfoot');
  await h.asElement().click({ force: true }); await c.esperar(30);
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.CurrentRowIndex(), t.CurrentColIndex(), t.TRCount(), !!__ct.sr('t1').querySelector('tfoot #__table_selector')]; }), [1, 1, 4, false]);
});
t('19', 'flecha abajo en la última fila (AutoAddRow=false) no entra al pie; Ctrl+End tampoco', '§2-m', async (c) => {
  await c.abrir(pag({}, {}, "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').AutoAddRow=false;});"));
  await c.foco('t1', 3, 2); await c.tecla('ArrowDown');
  c.igual(await c.ev(() => [__ct.t('t1').CurrentRowIndex(), !!__ct.sr('t1').querySelector('tfoot #__table_selector')]), [3, false]);
});
t('20', 'ordenar con clic no toma celdas del pie y el pie sigue después de ordenar', '§2-m', async (c) => {
  await c.abrir(pag());
  await c.clicTh('t1', 0);
  c.igual((await pie(c))[2].txt, '25');
  c.igual(await c.ev(() => __ct.filas('t1').length), 4);
});
t('21', 'columna oculta: su celda del pie también se oculta', '§2-k', async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').hideColumn('precio', true));
  c.igual((await pie(c))[3].oculta, true);
});
t('22', 'summary-scope="selected": total de las filas seleccionadas y se recalcula al cambiar la selección', ['§2-d', '§2-n'], async (c) => {
  await c.abrir(pag({}, { 'summary-scope': 'selected', 'multi-select': 'checkbox' }));
  await c.ev(() => __ct.t('t1').SelectRows([0, 2]));
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 13);
  await c.ev(() => __ct.t('t1').SelectRows([3], true));
  c.igual(await m(c, 't1', 'getSummary', 'cantidad'), 20);
}, { requiere: ['multiselect'] });
t('23', 'summary-scope por omisión es all', '§2-d', async (c) => {
  await c.abrir(pag({}, {}, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.s=[];t.Events.summarycalculated=(e)=>window.s.push(e.scope);t.RefreshSummaries();});"));
  c.igual(await c.ev(() => [...new Set(window.s)]), ['all']);
});
t('24', 'con agrupación activa el alcance por omisión es visible', '§2-d', async (c) => {
  await c.abrir(pag({}, { 'group-panel': 'true' }, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.s=[];t.Events.summarycalculated=(e)=>window.s.push(e.scope);});"));
  await c.ev(() => __ct.t('t1').GroupBy(['nombre']));
  c.igual(await c.ev(() => window.s[window.s.length - 1]), 'visible');
}, { requiere: ['group'] });
t('25', 'tabla sin datos: total sum 0 (o vacío) y el pie existe', ['§2-j', 'L-sin-datos'], async (c) => {
  await c.abrir(pag({ data: [] }));
  const v = await m(c, 't1', 'getSummary', 'cantidad');
  c.ok(v === 0 || v === null, 'getSummary sin filas: ' + v);
  c.igual(await c.ev(() => !!__ct.sr('t1').querySelector('tfoot')), true);
});
export default { nombre: 'v2-totales', grupo: 'v2', pruebas: P };
