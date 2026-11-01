// v2: interacción entre fases (F2 totales, F3 columnas, F4 selección/portapapeles/exportar). Integración 2026-11-01.
import { tabla, PRODUCTOS } from '../lib/fixtures.mjs';
import { registro, m, campos, camposDom, filaTxt, arrastrar } from '../lib/v2.mjs';

const { P, t } = registro('cmb');
const COLS = (x = {}) => [
  { field: 'codigo', type: 'Text', title: 'Código', width: '90px', ...(x.codigo ?? {}) },
  { field: 'nombre', type: 'Text', title: 'Nombre', width: '200px', ...(x.nombre ?? {}) },
  { field: 'linea', type: 'Text', title: 'Línea', width: '120px', ...(x.linea ?? {}) },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', width: '90px', ...(x.cantidad ?? {}) },
  { field: 'precio', type: 'Number', title: 'Precio', width: '100px', ...(x.precio ?? {}) },
];
const pag = (x = {}, a = {}, script = '') => ({ body: `<div style="width:420px;overflow:auto">${tabla({ a: { 'design-auto-save': 'false', ...a }, cols: COLS(x), data: PRODUCTOS, style: 'display:block;width:900px' })}</div>`, script });
const CB = { 'multi-select': 'checkbox' };
// Encabezado, primera fila y pie: 'SYS' para la celda del sistema, el field (o el texto) para las demás; @left si es fija.
const filas = (c) => c.ev(() => {
  const t = __ct.t('t1'), s = __ct.sr('t1');
  const una = (tr) => tr ? Array.from(tr.cells).map(x => (x.classList.contains('et-sel-col') ? 'SYS' : (x.getAttribute('field') ?? x.textContent.trim())) + (getComputedStyle(x).position === 'sticky' && x.classList.contains('et-fixed') ? '@' + Math.round(parseFloat(x.style.left)) : '')) : null;
  return { h: una(s.querySelector('thead').rows[0]), b: una(s.querySelector('tbody').rows[0]), f: una(t._table.tFoot?.rows[0]) };
});
const anchoSys = (c) => c.ev(() => Math.round(__ct.sr('t1').querySelector('thead th.et-sel-col').getBoundingClientRect().width));

// ---------- columna del sistema (F4) + columnas fijas (F3) ----------
t('01', 'checkbox + fijas: la celda del sistema queda fija en left 0 y el left de las fijas empieza después de ella', ['§4-a', '§6-c'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' }, nombre: { fixed: 'left' } }, CB));
  const w = await anchoSys(c), f = await filas(c);
  const wCod = await c.ev(() => Math.round(__ct.thPorCampo('t1', 'codigo').getBoundingClientRect().width));
  c.igual(f.h.map(x => x.replace(/@\d+$/, '@')), ['SYS@', 'codigo@', 'nombre@', 'linea', 'cantidad', 'precio']);
  c.igual(f.h[0], 'SYS@0'); c.igual(f.b[0], 'SYS@0');
  c.cerca(Number(f.h[1].split('@')[1]), w, 1.5, 'left de la primera fija = ancho de la celda del sistema');
  c.cerca(Number(f.b[1].split('@')[1]), w, 1.5, 'también en el cuerpo');
  c.cerca(Number(f.h[2].split('@')[1]), w + wCod, 2, 'left de la segunda fija');
  c.igual(await c.ev(() => __ct.thPorCampo('t1', 'nombre').classList.contains('et-fixed-last')), true);
}, { requiere: ['fixed', 'multiselect'] });
t('02', 'checkbox sin fijas: la celda del sistema no es sticky', ['§4-a', '§6-c', '§0-R1'], async (c) => {
  await c.abrir(pag({}, CB));
  c.igual(await c.ev(() => getComputedStyle(__ct.sr('t1').querySelector('thead th.et-sel-col')).position !== 'sticky'), true);
}, { requiere: ['fixed', 'multiselect'] });
t('03', 'checkbox + fijas: ColIndexOfTd y CurrentColIndex siguen siendo índices de datos', ['§0-R3', '§6-c'], async (c) => {
  await c.abrir(pag({ precio: { fixed: 'left' } }, CB));
  const r = await c.ev(() => { const t = __ct.t('t1'), tr = __ct.filas('t1')[1]; t.CellFocus(tr.cells[3]); return [t.ColIndexOfTd(tr.cells[0]), t.ColIndexOfTd(tr.cells[1]), t.CurrentColIndex(), t.Columns[t.CurrentColIndex()].field, t.Columns.map(x => x.field)]; });
  c.igual(r, [-1, 0, 2, 'nombre', ['precio', 'codigo', 'nombre', 'linea', 'cantidad']]);
}, { requiere: ['fixed', 'multiselect'] });
t('04', 'multi-select="checkbox" puesto después de cargar recalcula el left de las fijas (y el pie)', ['§4-a', '§6-c', '§2-c'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' }, cantidad: { summary: 'sum' } }));
  await c.ev(() => __ct.t('t1').setAttribute('multi-select', 'checkbox')); await c.esperar(30);
  const w = await anchoSys(c), f = await filas(c);
  c.igual([f.h[0], f.b[0], f.f[0]], ['SYS@0', 'SYS@0', 'SYS@0']);
  c.cerca(Number(f.h[1].split('@')[1]), w, 1.5); c.cerca(Number(f.f[1].split('@')[1]), w, 1.5, 'left en el pie');
  c.igual(f.f.length, f.h.length, 'el pie tiene la celda del sistema');
  c.igual(f.f[4], '25', 'el total sigue bajo cantidad');
  await c.ev(() => __ct.t('t1').removeAttribute('multi-select')); await c.esperar(30);
  const g = await filas(c);
  c.igual([g.h[0], g.f[0], g.f.length], ['codigo@0', '@0', 5]);
}, { requiere: ['fixed', 'multiselect', 'summary'] });

// ---------- reordenar u ocultar con la columna del sistema ----------
t('10', 'checkbox + MoveColumn/HideColumn: la celda del sistema nunca se mueve ni se oculta', ['§4-a', '§7-b', '§8-c'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-reorder': 'true', 'column-chooser': 'true' }));
  await c.ev(() => { const t = __ct.t('t1'); t.MoveColumn('precio', 0); t.HideColumn('codigo'); });
  const f = await filas(c);
  c.igual(f.h, ['SYS', 'precio', 'codigo', 'nombre', 'linea', 'cantidad']);
  c.igual(f.b[0], 'SYS');
  c.igual(await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('.et-sel-col')).some(x => x.classList.contains('hidde-col'))), false);
  c.igual(await camposDom(c), ['precio', 'codigo', 'nombre', 'linea', 'cantidad']);
  c.igual((await filaTxt(c, 't1', 0))[0], '2.5');
}, { requiere: ['reorder', 'chooser', 'multiselect'] });
t('11', 'el arrastre ignora th.et-sel-col (como origen y como destino), sin indicador', ['§8-b', '§4-a'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-reorder': 'true' }));
  const a = await arrastrar(c, 't1', 'thead th.et-sel-col', 'thead th[field="linea"]');
  const b = await arrastrar(c, 't1', 'thead th[field="linea"]', 'thead th.et-sel-col');
  c.igual([a.indicador, b.indicador], [false, false]);
  c.igual(await campos(c), ['codigo', 'nombre', 'linea', 'cantidad', 'precio']);
  c.igual((await filas(c)).h[0], 'SYS');
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('thead th.et-sel-col').getAttribute('draggable')), null);
}, { requiere: ['reorder', 'multiselect'] });
t('12', 'Ctrl+Mayús+flecha izquierda en la primera columna de datos no la cambia por la del sistema', ['§8-f', '§4-a'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-reorder': 'true' }));
  await c.ev(() => { const th = __ct.thPorCampo('t1', 'codigo'); th.tabIndex = 0; th.focus(); });
  await c.tecla('Control+Shift+ArrowLeft');
  c.igual((await filas(c)).h, ['SYS', 'codigo', 'nombre', 'linea', 'cantidad', 'precio']);
}, { requiere: ['reorder', 'multiselect'] });
t('13', 'el menú del selector de columnas no lista la columna del sistema', ['§7-c', '§4-a'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-chooser': 'true' }));
  await c.ev(() => __ct.sr('t1').querySelector('.et-chooser-btn').click()); await c.esperar(30);
  const n = await c.ev(() => __ct.sr('t1').querySelectorAll('.et-chooser input[type=checkbox]').length);
  c.igual(n, 5);
}, { requiere: ['chooser', 'multiselect'] });
t('14', 'checkbox + MoveColumn + changeColumnTitle: data-cell conserva el título declarado de su columna', ['§0-R3', '§8-c', '§1-C20'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-reorder': 'true' }));
  await c.ev(() => { const t = __ct.t('t1'); t.changeColumnTitle('nombre', 'Descripción'); t.MoveColumn('nombre', 0); t._printRows(); });
  const r = await c.ev(() => Array.from(__ct.filas('t1')[0].cells).filter(x => !x.classList.contains('et-sel-col')).map(x => x.getAttribute('data-cell')));
  c.igual(r, ['Nombre', 'Código', 'Línea', 'Cantidad', 'Precio']);
}, { requiere: ['reorder', 'multiselect'] });

// ---------- F4 copia y exporta con el orden y la visibilidad de F3 ----------
t('20', 'después de MoveColumn y HideColumn, getClipboardText y getExportData respetan el orden y la visibilidad', ['§4-k', '§5-h', '§7-b', '§8-c'], async (c) => {
  await c.abrir(pag({ precio: { format: 'true', decs: '2' } }, { ...CB, 'column-reorder': 'true', 'column-chooser': 'true' }));
  await c.ev(() => { const t = __ct.t('t1'); t.MoveColumn('precio', 1); t.HideColumn('nombre'); t.SelectRows([0]); });
  const txt = await m(c, 't1', 'getClipboardText');
  c.igual(txt.split('\r\n')[0], 'Código\tPrecio\tLínea\tCantidad');
  c.igual(txt.split('\r\n')[1].split('\t')[1], '2.50');
  const d = await m(c, 't1', 'getExportData');
  c.igual(d.columns.map(x => x.field), ['codigo', 'precio', 'linea', 'cantidad']);
  c.igual(Object.keys(d.rows[0]), ['codigo', 'precio', 'linea', 'cantidad']);
  const h = await m(c, 't1', 'getExportData', { includeHidden: true });
  c.igual(h.columns.map(x => [x.field, !!x.hidden]), [['codigo', false], ['precio', false], ['nombre', true], ['linea', false], ['cantidad', false]]);
  c.igual((await m(c, 't1', 'exportCSV')).split('\r\n')[0], 'Código,Precio,Línea,Cantidad');
}, { requiere: ['reorder', 'chooser', 'multiselect', 'clipboard', 'export'] });
t('21', 'después de ResetLayout, copiar vuelve al orden y la visibilidad declarados', ['§4-k', '§9-e'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-reorder': 'true', 'column-chooser': 'true' }));
  await c.ev(() => { const t = __ct.t('t1'); t.MoveColumn('precio', 0); t.HideColumn('linea'); t.ResetLayout(); t.SelectRows([0]); });
  c.igual((await m(c, 't1', 'getClipboardText')).split('\r\n')[0], 'Código\tNombre\tLínea\tCantidad\tPrecio');
}, { requiere: ['reorder', 'chooser', 'layout', 'clipboard'] });

// ---------- diseño (F3) con multi-select ----------
t('30', 'getLayout no incluye la columna del sistema; setLayout la deja al principio', ['§9-b', '§4-a'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-reorder': 'true' }));
  const l = await m(c, 't1', 'getLayout');
  c.igual(l.columns.map(x => x.field), ['codigo', 'nombre', 'linea', 'cantidad', 'precio']);
  c.igual(l.columns.map(x => x.order), [0, 1, 2, 3, 4]);
  await c.ev(() => __ct.t('t1').setLayout({ v: 1, columns: [{ field: 'precio', order: 0 }, { field: 'codigo', order: 1 }, { field: 'nombre', order: 2 }, { field: 'linea', order: 3 }, { field: 'cantidad', order: 4 }] }));
  c.igual((await filas(c)).h, ['SYS', 'precio', 'codigo', 'nombre', 'linea', 'cantidad']);
}, { requiere: ['layout', 'multiselect'] });

// ---------- la selección sobrevive a los cambios de columnas ----------
t('40', 'la selección sobrevive a MoveColumn, ResetLayout y setLayout (filas, casillas y et-row-checked)', ['§4-e', '§8-c', '§9-c', '§9-e'], async (c) => {
  await c.abrir(pag({}, { ...CB, 'column-reorder': 'true', 'column-chooser': 'true' }));
  await c.ev(() => __ct.t('t1').SelectRows([1, 3]));
  const estado = () => c.ev(() => { const t = __ct.t('t1'); return [t.getSelectedRows(), __ct.filas('t1').map(tr => tr.classList.contains('et-row-checked')), __ct.filas('t1').map(tr => tr.cells[0].querySelector('input')?.checked ?? null)]; });
  const ok = [[1, 3], [false, true, false, true], [false, true, false, true]];
  await c.ev(() => __ct.t('t1').MoveColumn('precio', 0)); c.igual(await estado(), ok, 'MoveColumn');
  await c.ev(() => __ct.t('t1').ResetLayout()); c.igual(await estado(), ok, 'ResetLayout');
  await c.ev(() => __ct.t('t1').setLayout({ v: 1, columns: [{ field: 'cantidad', order: 0, hidden: true }] })); c.igual(await estado(), ok, 'setLayout');
}, { requiere: ['reorder', 'layout', 'multiselect'] });

// ---------- pie de F2 con F3 y F4 ----------
const SUM = { cantidad: { summary: 'sum' }, precio: { summary: 'max' } };
t('50', 'el pie lleva la celda del sistema al principio y se mueve con MoveColumn (totales con su columna)', ['§2-c', '§8-c', '§4-a'], async (c) => {
  await c.abrir(pag(SUM, { ...CB, 'column-reorder': 'true' }));
  let f = await filas(c);
  c.igual(f.f, ['SYS', '', '', '', '25', '35.9']);
  await c.ev(() => __ct.t('t1').MoveColumn('cantidad', 0));
  f = await filas(c);
  c.igual(f.h, ['SYS', 'cantidad', 'codigo', 'nombre', 'linea', 'precio']);
  c.igual(f.f, ['SYS', '25', '', '', '', '35.9']);
  c.igual(await m(c, 't1', 'getSummaries'), { cantidad: 25, precio: 35.9 });
  await c.ev(() => __ct.t('t1').UpdateDataMember(0, 'cantidad', '20')); await c.esperar(20);
  c.igual((await filas(c)).f[1], '35', 'recalcula en la columna movida');
}, { requiere: ['summary', 'reorder', 'multiselect'] });
t('51', 'el pie respeta las columnas fijas: sticky con el mismo left que el encabezado', ['§2-c', '§6-c'], async (c) => {
  await c.abrir(pag({ ...SUM, codigo: { fixed: 'left' }, nombre: { fixed: 'left' } }, CB));
  const f = await filas(c);
  c.igual(f.f.map(x => x.includes('@') ? x.split('@')[1] : null), f.h.map(x => x.includes('@') ? x.split('@')[1] : null));
  c.igual(await c.ev(() => getComputedStyle(__ct.t('t1')._table.tFoot.rows[0].cells[2]).position), 'sticky');
  c.igual(await c.ev(() => __ct.t('t1')._table.tFoot.rows[0].cells[2].classList.contains('et-fixed-last')), true);
}, { requiere: ['summary', 'fixed', 'multiselect'] });
t('52', 'HideColumn/ShowColumn ocultan también la celda del pie; FixColumn la mueve con su columna', ['§2-c', '§7-b', '§6-a'], async (c) => {
  await c.abrir(pag(SUM, { ...CB, 'column-chooser': 'true' }));
  await c.ev(() => __ct.t('t1').HideColumn('cantidad'));
  c.igual(await c.ev(() => __ct.t('t1')._table.tFoot.rows[0].cells[4].classList.contains('hidde-col')), true);
  await c.ev(() => { const t = __ct.t('t1'); t.ShowColumn('cantidad'); t.FixColumn('precio', true); });
  const f = await filas(c);
  c.igual(f.h.map(x => x.replace(/@\d+$/, '@')), ['SYS@', 'precio@', 'codigo', 'nombre', 'linea', 'cantidad']);
  c.igual(f.f.map(x => x.replace(/@\d+$/, '@')), ['SYS@', '35.9@', '', '', '', '25']);
  c.igual(await c.ev(() => __ct.t('t1')._table.tFoot.rows[0].cells[5].classList.contains('hidde-col')), false);
}, { requiere: ['summary', 'chooser', 'fixed', 'multiselect'] });
t('53', 'summary-scope="selected" se recalcula al cambiar la selección (API, casilla de fila y casilla "todas")', ['§2-a', '§2-n', '§4-a'], async (c) => {
  await c.abrir(pag(SUM, { ...CB, 'summary-scope': 'selected' }, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.sc=[];t.addEventListener('SummaryCalculated',(e)=>window.sc.push(e.field+':'+e.value+':'+e.scope));});"));
  const tot = () => c.ev(() => [__ct.t('t1').getSummary('cantidad'), __ct.t('t1')._table.tFoot.rows[0].cells[4].textContent.trim()]);
  c.igual(await tot(), [0, '0']);
  await c.ev(() => __ct.t('t1').SelectRows([0, 2])); await c.esperar(20);
  c.igual(await tot(), [13, '13']);
  await c.clic('t1', 1, 0, { en: 'checkbox' }); await c.esperar(20);
  c.igual(await tot(), [18, '18']);
  await c.ev(() => __ct.sr('t1').querySelector('thead th.et-sel-col input').click()); await c.esperar(20);   // intermedio → todas
  c.igual(await c.ev(() => __ct.t('t1').getSelectedRows()), [0, 1, 2, 3]);
  c.igual(await tot(), [25, '25'], 'casilla "todas"');
  c.igual((await c.ev(() => window.sc)).every(x => x.endsWith(':selected')), true);
}, { requiere: ['summary', 'multiselect'] });
t('54', 'getExportData con totales: summary sale de getSummaries; sin columnas con total es null', ['§5-h', '§2-b'], async (c) => {
  await c.abrir(pag(SUM, CB));
  c.igual((await m(c, 't1', 'getExportData')).summary, { cantidad: 25, precio: 35.9 });
  await c.abrir(pag({}, CB));
  c.igual((await m(c, 't1', 'getExportData')).summary, null);
}, { requiere: ['summary', 'export'] });

// ---------- locale de la tabla que ya existía para format="relative" ----------
t('loc-relativo', 'una tabla con locale (usado para format="relative") no cambia los editores de las Number y Date sin format', ['§0-R7', '§0-R8'], async (c) => {
  await c.abrir({ body: tabla({ a: { locale: 'es-MX' }, cols: [{ field: 'f', type: 'Date', title: 'Cuándo', format: 'relative' }, { field: 'n', type: 'Number', title: 'N' }, { field: 'd', type: 'Date', title: 'D' }, { field: 'm', type: 'Number', title: 'M', format: 'true', decs: '2' }], data: [{ f: '2026-06-01', n: '12.5', d: '2026-02-01', m: 3 }] }) });
  const tipos = [];
  for (let k = 0; k < 4; k++) { await c.foco('t1', 0, k); await c.tecla('F2'); tipos.push(await c.ev(() => __ct.sr('t1').querySelector('#__table_input')?.getAttribute('type'))); await c.tecla('Escape'); }
  c.igual(tipos, ['date', 'number', 'date', 'text']);
}, { requiere: ['locale'] });

export default { nombre: 'v2-combinados', grupo: 'v2', pruebas: P };
