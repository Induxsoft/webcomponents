// Actual: ordenación (contrato §1.9) y árbol (contrato §1.6).
import { tabla, paginaProductos, CUENTAS } from '../lib/fixtures.mjs';

const P = [];
const o = (id, titulo, fn, x = {}) => P.push({ id: 'ord-' + id, titulo, spec: ['A.orden'], fn, ...x });
const a = (id, titulo, fn, x = {}) => P.push({ id: 'arb-' + id, titulo, spec: ['A.arbol'], fn, ...x });
const cods = (c) => c.ev(() => __ct.t('t1').DataArray.map(x => x.codigo));

o('01', 'clic en el encabezado ordena DataArray ascendente y redibuja', async (c) => {
  await c.abrir(paginaProductos());
  await c.clicTh('t1', 0);
  c.igual(await cods(c), ['P-001', 'P-002', 'P-003', 'P-004']);
  c.igual(await c.textos('t1', 0), ['P-001', 'P-002', 'P-003', 'P-004']);
});
o('02', 'segundo clic ordena descendente', async (c) => {
  await c.abrir(paginaProductos());
  await c.clicTh('t1', 0); await c.clicTh('t1', 0);
  c.igual(await cods(c), ['P-004', 'P-003', 'P-002', 'P-001']);
});
o('03', 'clases del th (comportamiento de 0ed1824 que R1 conserva): 1er clic "descendent", 2º "ascendent"; los demás th sin clase', async (c) => {
  await c.abrir(paginaProductos());
  await c.clicTh('t1', 1);
  const r1 = await c.ev(() => [__ct.th('t1', 1).className, __ct.th('t1', 0).className]);
  await c.clicTh('t1', 1);
  const r2 = await c.ev(() => __ct.th('t1', 1).className);
  c.igual([r1, r2], [['descendent', ''], 'ascendent']);
});
o('04', 'compara como número si los dos valores son number', async (c) => {
  await c.abrir(paginaProductos());
  await c.clicTh('t1', 3);
  c.igual(await c.ev(() => __ct.t('t1').DataArray.map(x => x.precio)), [0.75, 2.5, 18, 35.9]);
});
o('05', 'texto sin distinguir mayúsculas; números escritos como texto se comparan como texto', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'v', title: 'V' }], data: [{ v: 'b' }, { v: 'A' }, { v: '10' }, { v: '9' }] }) });
  await c.clicTh('t1', 0);
  c.igual(await c.ev(() => __ct.t('t1').DataArray.map(x => x.v)), ['10', '9', 'A', 'b']);
});
o('06', 'sorTable="false" (atributo) desactiva ordenar con clic', async (c) => {
  await c.abrir(paginaProductos({ a: { sorTable: 'false' } }));
  await c.clicTh('t1', 0);
  c.igual(await cods(c), ['P-003', 'P-001', 'P-002', 'P-004']);
});
o('07', 'Sort(DataArray, field, desc) ordena en su lugar', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); const ref = t.DataArray; t.Sort(t.DataArray, 'nombre', true); return [ref === t.DataArray, t.DataArray.map(x => x.nombre)]; }),
    [true, ['Tornillo hexagonal', 'Cable calibre 12', 'Arandela plana', 'Apagador sencillo']]);
});
o('08', 'sin manejador de OnSort, Columns no recibe sort', async (c) => {
  await c.abrir(paginaProductos());
  await c.clicTh('t1', 0);
  c.igual(await c.ev(() => __ct.t('t1').Columns.map(x => x.sort ?? null)), [null, null, null, null]);
});
o('09', 'con manejador de OnSort, solo la columna ordenada lleva coldef.sort', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').Events.onsort=()=>{};});" }));
  await c.clicTh('t1', 0); await c.clicTh('t1', 1);
  c.igual(await c.ev(() => __ct.t('t1').Columns.map(x => x.sort ?? null)), [null, 'ASC', null, null]);
});
o('10', 'clic en el borde de cambio de ancho no ordena', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.th('t1', 0).querySelector('.sizable-border').click());
  c.igual(await cods(c), ['P-003', 'P-001', 'P-002', 'P-004']);
});

// ---------- árbol ----------
const desordenadas = [CUENTAS[3], CUENTAS[5], CUENTAS[0], CUENTAS[2], CUENTAS[4], CUENTAS[1]];
const COLS_C = [{ field: 'cuenta', type: 'NoEditable', title: 'Cuenta' }, { field: 'nombre', title: 'Nombre' }, { field: 'saldo', type: 'Number', title: 'Saldo' }];
const ARB = { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' };
const pagArbol = (extra = {}) => ({ body: tabla({ a: { ...ARB, ...(extra.a ?? {}) }, cols: COLS_C, data: extra.data ?? desordenadas }), script: extra.script ?? '' });
const vis = (c) => c.ev(() => __ct.filas('t1').filter(tr => !tr.classList.contains('hidde-row')).map(tr => tr.getAttribute('id')));

a('01', 'DataArray queda aplanado en orden de árbol y sin el campo de hijos', async (c) => {
  await c.abrir(pagArbol());
  const d = await c.datos();
  c.igual(d.map(x => x.cuenta), ['100', '110', '112', '111', '200', '210'], 'los hermanos conservan el orden de entrada');
  c.ok(d.every(x => !('__items' in x) && !('__level__' in x)), 'sin __items ni __level__');
});
a('02', 'tr con id, parent e indent; ShowAsTree=true', async (c) => {
  await c.abrir(pagArbol());
  const r = await c.ev(() => __ct.filas('t1').map(tr => [tr.getAttribute('id'), tr.getAttribute('parent'), tr.getAttribute('indent')]));
  c.igual(r, [['1', '', '0'], ['2', '1', '1'], ['4', '2', '2'], ['3', '2', '2'], ['5', '', '0'], ['6', '5', '1']]);
  c.igual(await c.ev(() => __ct.t('t1').ShowAsTree), true);
});
a('03', 'colapsado al iniciar: solo se ven las raíces; botón solo en filas con hijos', async (c) => {
  await c.abrir(pagArbol());
  c.igual(await vis(c), ['1', '5']);
  c.igual(await c.ev(() => __ct.filas('t1').map(tr => { const b = tr.querySelector('span.collapse-btn'); return b ? b.getAttribute('expanded') : null; })), ['false', 'false', null, null, 'false', null]);
  c.igual(await c.ev(() => __ct.td('t1', 0, 0).classList.contains('cell-collapsable')), true);
});
a('04', 'clic en el botón expande solo los hijos directos; otro clic colapsa en cascada', async (c) => {
  await c.abrir(pagArbol());
  await c.ev(() => __ct.filas('t1')[0].querySelector('span.collapse-btn').click());
  c.igual(await vis(c), ['1', '2', '5']);
  await c.ev(() => __ct.filas('t1')[1].querySelector('span.collapse-btn').click());
  c.igual(await vis(c), ['1', '2', '4', '3', '5']);
  await c.ev(() => __ct.filas('t1')[0].querySelector('span.collapse-btn').click());
  c.igual(await vis(c), ['1', '5']);
  c.igual(await c.ev(() => __ct.filas('t1')[1].querySelector('span.collapse-btn').getAttribute('expanded')), 'false');
});
a('05', 'ExpandRow(tr) y CollapseRow(tr)', async (c) => {
  await c.abrir(pagArbol());
  await c.ev(() => { const t = __ct.t('t1'); t.ExpandRow(__ct.filas('t1')[4]); });
  c.igual(await vis(c), ['1', '5', '6']);
  await c.ev(() => { const t = __ct.t('t1'); t.CollapseRow(__ct.filas('t1')[4]); });
  c.igual(await vis(c), ['1', '5']);
});
a('06', '_expandOnStart=true + _printTreeData(): todo expandido (como V12 con expanded)', async (c) => {
  await c.abrir({ body: tabla({ a: ARB, cols: COLS_C }), script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(desordenadas)};t._expandOnStart=true;t._printTreeData();});` });
  c.igual(await vis(c), ['1', '2', '4', '3', '5', '6']);
  c.igual(await c.ev(() => __ct.filas('t1')[0].querySelector('span.collapse-btn').getAttribute('expanded')), 'true');
});
a('07', 'sangría: padding-left = nivel rem (+0.7 en hojas)', async (c) => {
  await c.abrir(pagArbol());
  c.igual(await c.ev(() => __ct.filas('t1').map(tr => tr.cells[0].style.paddingLeft)), ['0rem', '1rem', '2.7rem', '2.7rem', '0rem', '1.7rem']);
});
a('08', 'can-move-row por omisión igual a show-tree: filas draggable', async (c) => {
  await c.abrir(pagArbol());
  c.igual(await c.ev(() => [__ct.t('t1').CanMoveRow, __ct.filas('t1').every(tr => tr.getAttribute('draggable') === 'true')]), [true, true]);
});
a('09', 'can-move-row="false": sin draggable', async (c) => {
  await c.abrir(pagArbol({ a: { 'can-move-row': 'false' } }));
  c.igual(await c.ev(() => [__ct.t('t1').CanMoveRow, __ct.filas('t1').some(tr => tr.hasAttribute('draggable'))]), [false, false]);
});
a('10', 'RowIndent(tr) hace a la fila hija de su hermano anterior; BeforeMoveRow y RowMoved', async (c) => {
  await c.abrir(pagArbol());
  await c.ev(() => __ct.grabar('t1', ['beforemoverow', 'rowmoved']));
  await c.ev(() => { const t = __ct.t('t1'); t._expandOnStart = true; t.RowIndent(__ct.filas('t1')[4]); });
  const d = await c.datos();
  c.igual(d.find(x => x.cuenta === '200').parent, 1, 'Pasivo pasa a ser hijo de Activo (su hermano anterior)');
  const l = await c.log();
  c.igual(l.map(x => x.ev), ['beforemoverow', 'rowmoved']);
  c.igual(Object.keys(l[0].a).sort(), ['cancel', 'child', 'sender', 'source', 'target']);
  c.igual(l[0].a.child, true);
});
a('11', 'BeforeMoveRow con cancel: no se mueve', async (c) => {
  await c.abrir(pagArbol({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').Events.beforemoverow=(e)=>{e.cancel=true;};});" }));
  const antes = await c.datos();
  await c.ev(() => __ct.t('t1').RowIndent(__ct.filas('t1')[4]));
  c.igual(await c.datos(), antes);
});
a('12', 'RowIndent(tr, false) sube un nivel (hermano del padre)', async (c) => {
  await c.abrir(pagArbol());
  await c.ev(() => __ct.t('t1').RowIndent(__ct.filas('t1')[2], false));
  c.igual((await c.datos()).find(x => x.cuenta === '112').parent, 1, 'Bancos (fila 2) pasa a hermano de Activo circulante');
});
a('13', 'ordenar en árbol ordena entre hermanos y conserva la jerarquía', async (c) => {
  await c.abrir(pagArbol());
  await c.clicTh('t1', 0); // cuenta ASC
  await c.clicTh('t1', 0); // DESC
  const d = (await c.datos()).map(x => x.cuenta);
  c.igual(d.slice(0, 4), ['200', '210', '100', '110'], 'las raíces se ordenan y cada hijo sigue a su padre');
});
a('13b', 'ordenar en árbol ordena también los nietos', async (c) => {
  await c.abrir(pagArbol());
  await c.clicTh('t1', 0); // cuenta ASC
  c.igual((await c.datos()).map(x => x.cuenta), ['100', '110', '111', '112', '200', '210']);
}, { defecto: 'D-SORTTREE (SortTree solo baja a los hijos dentro del comparador: una lista de un solo elemento no ordena a sus descendientes)' });
a('14', 'NavDown salta las filas ocultas', async (c) => {
  await c.abrir(pagArbol());
  await c.foco('t1', 0, 1); await c.tecla('ArrowDown');
  c.igual(await c.ev(() => __ct.t('t1').CurrentRowIndex()), 4);
});
a('15', 'en árbol, DataArray[CurrentRowIndex()] es la fila seleccionada (expandida)', async (c) => {
  await c.abrir(pagArbol());
  await c.ev(() => { __ct.filas('t1')[0].querySelector('span.collapse-btn').click(); __ct.filas('t1')[1].querySelector('span.collapse-btn').click(); });
  await c.clic('t1', 3, 1);
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return t.DataArray[t.CurrentRowIndex()].nombre; }), 'Caja');
});
a('16', 'expansión conservada al redibujar con _printRows()', async (c) => {
  await c.abrir(pagArbol());
  await c.ev(() => __ct.filas('t1')[0].querySelector('span.collapse-btn').click());
  await c.ev(() => __ct.t('t1')._printRows());
  c.igual(await vis(c), ['1', '2', '5']);
});
a('17', 'RowIndentation(tr) devuelve el nivel', async (c) => {
  await c.abrir(pagArbol());
  c.igual(await c.ev(() => __ct.filas('t1').map(tr => __ct.t('t1').RowIndentation(tr))), [0, 1, 2, 2, 0, 1]);
});
a('18', 'childs-field configura el campo de hijos en TreeOptions', async (c) => {
  await c.abrir(pagArbol({ a: { 'childs-field': 'hijos' } }));
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.Childs, t._getTreeOptions()]; }), ['hijos', { key: 'sys_pk', parentkey: 'parent', childs: 'hijos' }]);
});

export default { nombre: 'actual-orden-y-arbol', grupo: 'actual', pruebas: P };
