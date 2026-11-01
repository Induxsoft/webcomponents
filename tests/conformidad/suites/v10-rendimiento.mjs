// v2 §10: rendimiento (siempre activo) y virtualización opcional.
import { tabla, muchas } from '../lib/fixtures.mjs';
import { registro, filasDatos } from '../lib/v2.mjs';

const COLS = [
  { field: 'codigo', type: 'Text', title: 'Código' }, { field: 'nombre', type: 'Text', title: 'Nombre' },
  { field: 'linea', type: 'Text', title: 'Línea' }, { field: 'cantidad', type: 'Number', title: 'Cantidad' },
  { field: 'precio', type: 'Number', title: 'Precio', format: 'true', decs: '2' },
];
const montar = (n, a = {}, contenedor = true, extra = '') => ({
  body: (contenedor ? `<div id="sc" style="height:400px;overflow-y:auto">` : '') + tabla({ a, cols: COLS }) + (contenedor ? '</div>' : '') + extra,
  script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.datos=${JSON.stringify(muchas(n))};window.t0=performance.now();t.DataArray=window.datos;t._printRows();window.tDibujo=performance.now()-window.t0;});`,
});

// ---------- siempre activo ----------
const { P: PA, t: a } = registro('ren', { requiere: ['virtual'], serial: true });
a('01', '5,000 filas: UpdateData() en menos de 100 ms', ['§10-b', '§10-l'], async (c) => {
  await c.abrir(montar(5000, {}, false));
  const ms = await c.ev(() => { const t = __ct.t('t1'); const s = performance.now(); t.UpdateData(); return performance.now() - s; });
  c.ok(ms < 100, `UpdateData tardó ${ms.toFixed(0)} ms`);
}, { limite: 60000 });
a('02', '5,000 filas: editar una celda (FieldUpdated → UpdateRow) en menos de 16 ms', ['§10-a', '§10-l'], async (c) => {
  await c.abrir(montar(5000, {}, false));
  const ms = await c.ev(() => { const t = __ct.t('t1'); const m = []; for (let k = 0; k < 7; k++) { const s = performance.now(); t.UpdateDataMember(4000 + k, 'nombre', 'x' + k); t.UpdateRow(4000 + k); m.push(performance.now() - s); } m.sort((a, b) => a - b); return m[3]; });
  c.ok(ms < 16, `editar tardó ${ms.toFixed(1)} ms (mediana de 7)`);
}, { limite: 60000 });
a('03', '5,000 filas: NavTo(4000, 0) en menos de 16 ms', ['§10-a'], async (c) => {
  await c.abrir(montar(5000, {}, false));
  const ms = await c.ev(() => { const t = __ct.t('t1'); const s = performance.now(); t.NavTo(4000, 0); return performance.now() - s; });
  c.ok(ms < 16, `NavTo tardó ${ms.toFixed(1)} ms`);
}, { limite: 60000 });
a('04', 'actualizar una fila no vuelve a dibujar la tabla (los demás tr se conservan)', ['§10-a'], async (c) => {
  await c.abrir(montar(50, {}, false));
  c.igual(await c.ev(() => { const t = __ct.t('t1'); const tr0 = __ct.filas('t1')[0]; t.UpdateDataMember(5, 'nombre', 'x'); t.UpdateRow(5); t.AddRow(); return __ct.filas('t1')[0] === tr0; }), true);
}, { requiere: [] });
a('05', '_printRows() y _printTreeData() dibujan todas las filas de inmediato (síncrono)', ['§10-d', 'A.v12'], async (c) => {
  await c.abrir(montar(300, {}, false));
  c.igual(await c.ev(() => __ct.filas('t1').length), 300);
}, { requiere: [] });
a('06', 'árbol: no se hacen copias JSON profundas (tr._etData es el objeto de DataArray)', ['§10-c'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'id', parentkey: 'p' }, cols: COLS }), script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=[{id:1,nombre:'a'},{id:2,p:1,nombre:'b'}];t._printTreeData();});" });
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return __ct.filas('t1').map((tr, i) => tr._etData === t.DataArray[i]); }), [true, true]);
});

// ---------- virtualización ----------
const { P: PV, t: v } = registro('vir', { requiere: ['virtual'] });
const VA = { 'virtual-rows': 'true', 'row-height': '28px' };
v('01', '20,000 filas con virtual-rows: primer dibujo en menos de 150 ms y solo se dibujan las visibles + 10', ['§10-e', '§10-g', '§10-m'], async (c) => {
  await c.abrir(montar(20000, VA));
  const r = await c.ev(() => ({ ms: window.tDibujo, n: __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length }));
  c.ok(r.ms < 150, `primer dibujo ${r.ms.toFixed(0)} ms`);
  c.ok(r.n > 0 && r.n <= Math.ceil(400 / 28) + 2 * 10 + 2, `filas dibujadas: ${r.n}`);
}, { limite: 60000, serial: true });
v('02', 'filas de relleno tr.et-spacer arriba y abajo, sin celdas de datos, en el mismo tbody', ['§10-g', '§0-R1'], async (c) => {
  await c.abrir(montar(2000, VA));
  await c.ev(async () => { document.getElementById('sc').scrollTop = 20000; await __ct.cuadro(); });
  const r = await c.ev(() => { const tb = __ct.sr('t1').querySelectorAll('tbody'); const sp = Array.from(tb[0].querySelectorAll(':scope > tr.et-spacer')); return { tbodies: tb.length, spacers: sp.length, primero: tb[0].rows[0].classList.contains('et-spacer'), ultimo: tb[0].rows[tb[0].rows.length - 1].classList.contains('et-spacer'), sinDatos: sp.every(s => !s.querySelector('.EdiTable-Cell')) }; });
  c.igual(r, { tbodies: 1, spacers: 2, primero: true, ultimo: true, sinDatos: true });
}, { limite: 30000 });
v('03', 'la altura total corresponde a todas las filas (scrollHeight ≈ n × alto)', ['§10-g'], async (c) => {
  await c.abrir(montar(2000, VA));
  const h = await c.ev(() => __ct.sr('t1').querySelector('tbody').getBoundingClientRect().height);
  c.cerca(h, 2000 * 28, 2000 * 28 * 0.03, 'alto del tbody');
}, { limite: 30000 });
v('04', 'al desplazar se dibujan las filas de esa zona', ['§10-g'], async (c) => {
  await c.abrir(montar(2000, VA));
  await c.ev(async () => { document.getElementById('sc').scrollTop = 1000 * 28; await __ct.cuadro(); await __ct.espera(50); });
  const txt = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)')).map(tr => tr.cells[0].textContent));
  c.contiene(txt, 'P-01001');
  c.ok(txt.length < 2000, `se dibujan solo las de la zona (${txt.length} de 2000)`);
}, { limite: 30000 });
v('05', 'VirtualOverscan cambia el margen', ['§10-g'], async (c) => {
  await c.abrir({ ...montar(2000, VA), script: montar(2000, VA).script.replace("t.DataArray=", "t.VirtualOverscan=2;t.DataArray=") });
  const n = await c.ev(() => __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length);
  c.ok(n <= Math.ceil(400 / 28) + 2 * 2 + 2, `filas con overscan 2: ${n}`);
}, { limite: 30000 });
v('06', 'scroll-container="<selector>" usa ese contenedor', ['§10-f'], async (c) => {
  await c.abrir({ body: `<div id="externo" style="height:300px;overflow:auto"><div>${tabla({ a: { ...VA, 'scroll-container': '#externo' }, cols: COLS })}</div></div>`, script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(muchas(1000))};t._printRows();});` });
  await c.ev(async () => { document.getElementById('externo').scrollTop = 500 * 28; await __ct.cuadro(); await __ct.espera(50); });
  { const txt = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)')).map(tr => tr.cells[0].textContent)); c.contiene(txt, 'P-00501'); c.ok(txt.length < 1000, `se dibujan solo las de la zona (${txt.length} de 1000)`); }
}, { limite: 30000 });
v('07', 'sin scroll-container: el ancestro más cercano con overflow-y auto (fuera del shadow, como V12)', ['§10-f', 'A.v12'], async (c) => {
  await c.abrir(montar(1000, { ...VA, 'control-styles': 'div:has(table#t1){overflow:revert !important}' }));
  await c.ev(async () => { document.getElementById('sc').scrollTop = 600 * 28; await __ct.cuadro(); await __ct.espera(50); });
  { const txt = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)')).map(tr => tr.cells[0].textContent)); c.contiene(txt, 'P-00601'); c.ok(txt.length < 1000, `se dibujan solo las de la zona (${txt.length} de 1000)`); }
}, { limite: 30000 });
v('08', 'sin contenedor con scroll: la ventana', ['§10-f'], async (c) => {
  await c.abrir(montar(1000, VA, false));
  await c.ev(async () => { window.scrollTo(0, 500 * 28); await __ct.cuadro(); await __ct.espera(50); });
  { const txt = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)')).map(tr => tr.cells[0].textContent)); c.contiene(txt, 'P-00500'); c.ok(txt.length < 1000, `se dibujan solo las de la zona (${txt.length} de 1000)`); }
}, { limite: 30000 });
v('09', 'al imprimir se dibujan todas (beforeprint) y se regresa al modo virtual (afterprint)', ['§10-h'], async (c) => {
  await c.abrir(montar(500, VA));
  const r = await c.ev(() => { window.dispatchEvent(new Event('beforeprint')); const a = __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length; window.dispatchEvent(new Event('afterprint')); return [a, __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length]; });
  c.igual(r[0], 500); c.ok(r[1] < 500, 'vuelve a virtual: ' + r[1]);
}, { limite: 30000 });
v('10', 'RenderAll() y RenderVisible() son públicos (para el clon de impresión de V12)', ['§10-i', 'A.v12'], async (c) => {
  await c.abrir(montar(500, VA));
  const r = await c.ev(() => { const t = __ct.t('t1'); t.RenderAll(); const a = t._shadow.getElementById(t.id).cloneNode(true).tBodies[0].querySelectorAll('tr:not(.et-spacer)').length; t.RenderVisible(); return [a, __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length]; });
  c.igual(r[0], 500); c.ok(r[1] < 500);
}, { limite: 30000 });
v('11', 'R2: CurrentRowIndex y eventos hablan de DataArray aunque el tr sea el k-ésimo dibujado', ['§0-R2', '§10-g'], async (c) => {
  await c.abrir(montar(2000, VA));
  await c.ev(async () => { document.getElementById('sc').scrollTop = 1500 * 28; await __ct.cuadro(); await __ct.espera(50); });
  const r = await c.ev(() => { const t = __ct.t('t1'); const tr = Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)')).find(x => x.cells[0].textContent === 'P-01505'); t.CellFocus(tr.cells[1]); return [t.CurrentRowIndex(), t.DataArray[t.CurrentRowIndex()].codigo]; });
  c.igual(r, [1504, 'P-01505']);
}, { limite: 30000 });
v('12', 'navegar con teclado a una fila no dibujada primero desplaza a ella', ['§10-j'], async (c) => {
  await c.abrir(montar(2000, VA));
  await c.foco('t1', 0, 1);
  await c.tecla('PageDown', 5);
  const r = await c.ev(() => { const t = __ct.t('t1'); const td = t.CurrentTd(); return [t.CurrentRowIndex(), !!td, td && td.getBoundingClientRect().top >= 0]; });
  c.igual(r, [50, true, true]);
}, { limite: 30000 });
v('13', 'NavTo/CellFocus hacia una fila no dibujada la dibuja y la selecciona', ['§10-j'], async (c) => {
  await c.abrir(montar(2000, VA));
  await c.ev(() => __ct.t('t1').NavTo(1800, 0)); await c.cuadro();
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.CurrentRowIndex(), t.CurrentTd() && t.CurrentTd().textContent]; }), [1800, 'P-01801']);
}, { limite: 30000 });
v('14', 'onTdPaint y onRowPaint solo se llaman para las filas dibujadas', ['§10-k'], async (c) => {
  await c.abrir({ ...montar(2000, VA), script: montar(2000, VA).script.replace("t.DataArray=", "window.np=0;window.nr=0;t.onTdPaint=()=>window.np++;t.onRowPaint=()=>window.nr++;t.DataArray=") });
  const r = await c.ev(() => [window.np, window.nr]);
  c.ok(r[1] < 100 && r[0] < 100 * COLS.length, `llamadas onRowPaint=${r[1]}, onTdPaint=${r[0]}`);
}, { limite: 30000 });
v('15', 'en vista de tarjetas no se virtualiza', ['§10-e'], async (c) => {
  await c.abrir(montar(300, { ...VA, 'cards-mode': 'always' }));
  c.igual(await filasDatos(c), 300);
}, { limite: 30000 });
v('16', 'editar en modo virtual escribe en el índice de DataArray correcto', ['§0-R2', '§10-g'], async (c) => {
  await c.abrir(montar(2000, VA));
  await c.ev(() => __ct.t('t1').NavTo(1200, 1)); await c.cuadro();
  await c.tecla('F2'); await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = 'Editado'; }); await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.t('t1').DataArray[1200].nombre), 'Editado');
}, { limite: 30000 });
v('17', 'desplazamiento fluido: 30 cuadros de scroll con media < 16.7 ms por cuadro (60 fps)', ['§10-m'], async (c) => {
  await c.abrir(montar(20000, VA));
  c.ok(await c.ev(() => __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length) < 20000, 'precondición: la tabla está virtualizada');
  const ms = await c.ev(async () => { const sc = document.getElementById('sc'); const tiempos = []; let prev = performance.now(); for (let i = 0; i < 30; i++) { sc.scrollTop += 600; await new Promise(r => requestAnimationFrame(r)); const now = performance.now(); tiempos.push(now - prev); prev = now; } return tiempos.reduce((a, b) => a + b, 0) / tiempos.length; });
  c.ok(ms < 16.7 * 1.5, `media por cuadro ${ms.toFixed(1)} ms (headless: tolerancia 1.5×)`);
}, { limite: 60000, serial: true });
v('18', 'sin virtual-rows todas las filas se dibujan (R1)', ['§10-e', '§0-R1'], async (c) => {
  await c.abrir(montar(500, {}));
  c.igual(await c.ev(() => __ct.filas('t1').length), 500);
}, { requiere: [], limite: 30000 });

export default [{ nombre: 'v2-rendimiento', grupo: 'v2', pruebas: PA }, { nombre: 'v2-virtualizacion', grupo: 'v2', pruebas: PV }];
