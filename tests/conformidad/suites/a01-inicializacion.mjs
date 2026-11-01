// Actual (0ed1824): inicialización y atributos del host. Contrato §1.1-1.4, §2.1.
import { tabla, PRODUCTOS, COLS_PRODUCTOS, paginaProductos } from '../lib/fixtures.mjs';

const P = [];
const t = (id, titulo, fn, x = {}) => P.push({ id: 'ini-' + id, titulo, spec: ['A.init', ...(x.spec ?? [])], fn, ...x });

t('01', 'la table interna recibe el id del host y tableId', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const el = __ct.t('t1'); const tb = el.shadowRoot.querySelector('table'); return { id: tb.id, tid: el.tableId, mismo: el._shadow === el.shadowRoot }; });
  c.igual(r, { id: 't1', tid: 't1', mismo: true });
});
t('02', 'sin id, la table interna usa el id de reserva', async (c) => {
  await c.abrir({ body: tabla({ id: '', cols: COLS_PRODUCTOS, data: PRODUCTOS }) });
  const id = await c.ev(() => document.querySelector('edit-table').shadowRoot.querySelector('table').id);
  c.igual(id, 'f077fb41716141eeb7ecb1ed0a1ce292');
});
t('03', 'data JSON llena DataArray conservando los tipos', async (c) => {
  await c.abrir(paginaProductos());
  const d = await c.datos();
  c.igual(d, PRODUCTOS);
  c.igual(await c.ev(() => __ct.filas('t1').length), 4);
});
t('04', 'data inválido muestra alert y deja DataArray vacío', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_PRODUCTOS, data: '{malo' }) });
  c.igual(c.dialogos.length, 1, 'alert');
  c.igual(await c.datos(), []);
});
t('05', 'edit-tbody: DataArray se arma con el texto de las celdas', async (c) => {
  const tb = '<edit-tbody><edit-tr><edit-td>A1</edit-td><edit-td>Uno</edit-td></edit-tr><edit-tr><edit-td>B2</edit-td><edit-td>Dos</edit-td></edit-tr></edit-tbody>';
  await c.abrir({ body: tabla({ cols: [{ field: 'k', title: 'K' }, { field: 'n', title: 'N' }], tbody: tb }) });
  c.igual(await c.datos(), [{ k: 'A1', n: 'Uno' }, { k: 'B2', n: 'Dos' }]);
  c.igual(await c.ev(() => __ct.td('t1', 0, 0).classList.contains('EdiTable-Cell')), true);
});
t('06', 'el light DOM queda vacío después de inicializar', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => __ct.t('t1').innerHTML), '');
});
t('07', 'Columns: un objeto por th con sus atributos como texto, title y type resuelto', async (c) => {
  await c.abrir(paginaProductos());
  const cols = await c.ev(() => __ct.t('t1').Columns.map(x => ({ ...x })));
  c.igual(cols.length, 4);
  c.igual(cols[0], { field: 'codigo', type: 'Text', title: 'Código' });
  c.igual(cols[3].decs, '2'); c.igual(cols[3].format, 'true'); c.igual(cols[3].prefix, '$'); c.igual(cols[3].title, 'Precio');
});
t('08', 'options se interpreta como JSON', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'u', type: 'Select', options: '{"PZA":"PIEZA","CAJA":"CAJA"}', title: 'U' }], data: [{ u: 'PZA' }] }) });
  c.igual(await c.ev(() => __ct.t('t1').Columns[0].options), { PZA: 'PIEZA', CAJA: 'CAJA' });
});
t('09', 'th: <span>título</span> y div.sizable-border', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const th = __ct.th('t1', 1); return { span: th.querySelector('span').textContent, borde: !!th.querySelector('div.sizable-border'), field: th.getAttribute('field') }; });
  c.igual(r, { span: 'Nombre', borde: true, field: 'nombre' });
});
t('10', 'width, minwidth y maxwidth pasan al style del th y del div de la celda', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'a', width: '120px', minwidth: '80px', maxwidth: '200px', title: 'A' }], data: [{ a: 'x' }] }) });
  const r = await c.ev(() => { const th = __ct.th('t1', 0); const cc = __ct.td('t1', 0, 0).querySelector('.cell-content'); return [th.style.width, th.style.minWidth, th.style.maxWidth, cc.style.width, cc.style.minWidth]; });
  c.igual(r, ['120px', '80px', '200px', '120px', '80px']);
});
t('11', 'readonly en el host deja ReadOnly=true', async (c) => {
  await c.abrir(paginaProductos({ a: { readonly: true } }));
  c.igual(await c.ev(() => __ct.t('t1').ReadOnly), true);
});
t('12', 'html-encode="true" activa htmlEncode y escapa el texto', async (c) => {
  await c.abrir({ body: tabla({ a: { 'html-encode': 'true' }, cols: [{ field: 'a', title: 'A' }], data: [{ a: '<b>x</b>' }] }) });
  const r = await c.ev(() => ({ he: __ct.t('t1').htmlEncode, html: __ct.td('t1', 0, 0).querySelector('.cell-content').innerHTML }));
  c.igual(r.he, true); c.igual(r.html, '&lt;b&gt;x&lt;/b&gt;');
});
t('13', 'control-styles se concatena en el <style> del shadow', async (c) => {
  await c.abrir(paginaProductos({ a: { 'control-styles': '.EdiTable-Cell{color:rgb(1, 2, 3)}' } }));
  const r = await c.ev(() => ({ css: __ct.sr('t1').querySelector('style').textContent.includes('.EdiTable-Cell{color:rgb(1, 2, 3)}'), color: getComputedStyle(__ct.td('t1', 0, 0)).color }));
  c.igual(r, { css: true, color: 'rgb(1, 2, 3)' });
});
t('14', 'hidde-selector="true": el selector lleva la clase transparent', async (c) => {
  await c.abrir(paginaProductos({ a: { 'hidde-selector': 'true' } }));
  await c.foco('t1', 0, 0);
  c.igual(await c.ev(() => __ct.td('t1', 0, 0).querySelector('.EdiTable-Selector').classList.contains('transparent')), true);
});
t('15', 'hide-row-selector="true": la fila actual no recibe EdiTable-Row-Selected', async (c) => {
  await c.abrir(paginaProductos({ a: { 'hide-row-selector': 'true' } }));
  await c.foco('t1', 1, 0);
  c.igual(await c.ev(() => __ct.filas('t1').some(tr => tr.classList.contains('EdiTable-Row-Selected'))), false);
});
t('16', 'min-row-height, max-row-height y row-height pasan al div de la celda (display:block)', async (c) => {
  await c.abrir(paginaProductos({ a: { 'min-row-height': '1rem', 'max-row-height': '5rem', 'row-height': '30px' } }));
  const s = await c.ev(() => { const cc = __ct.td('t1', 0, 0).querySelector('.cell-content'); return [cc.style.minHeight, cc.style.maxHeight, cc.style.height, cc.style.display]; });
  c.igual(s, ['1rem', '5rem', '30px', 'block']);
});
t('17', 'sin show-tree, ShowAsTree=false después de inicializar', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => __ct.t('t1').ShowAsTree), false);
});
t('18', 'shadow: <style> y un solo div que contiene solo la table', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const s = __ct.sr('t1'); return { hijos: Array.from(s.children).map(x => x.tagName), dentro: Array.from(s.querySelector('div').children).map(x => x.tagName), tablas: s.querySelectorAll('table').length }; });
  c.igual(r, { hijos: ['STYLE', 'DIV'], dentro: ['TABLE'], tablas: 1 });
});
t('19', 'la tabla interna tiene thead y tbody, una fila por elemento de DataArray', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const tb = __ct.sr('t1').querySelector('table'); return [tb.tHead.rows.length, tb.tBodies.length, tb.tBodies[0].rows.length, !!tb.tFoot]; });
  c.igual(r, [1, 1, 4, false]);
});
t('20', 'valores por omisión de las propiedades', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const e = __ct.t('t1'); return [e.AutoAddRow, e.AutoDelRow, e.EverMove, e.PagOffSet, e.ColumnsDefaultType, e.CanMoveRow, e.Key, e.ParentKey, e.Childs, e.TheadRowIndex, e.CSS.Cell, e.CSS.RowSelected, e.Editing, e.IsDirty]; });
  c.igual(r, [true, true, true, 10, 'Text', false, 'id', 'idp', '__items', 0, 'EdiTable-Cell', 'EdiTable-Row-Selected', false, false]);
});
t('21', 'Const.Columns.Types tiene los 10 tipos y Const.Events los 21 eventos', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const e = __ct.t('t1').EdiTable.Const; return { tipos: Object.keys(e.Columns.Types), ev: Object.keys(e.Events).slice(0, 21) }; });
  c.igual(r.tipos, ['Text', 'Number', 'Date', 'DateTime', 'Memo', 'Check', 'Select', 'Custom', 'NoEditable', 'Badges']);
  c.igual(r.ev, ['BeforeCellFocus', 'EnterCell', 'LeaveCell', 'StartEdition', 'ConfirmEdition', 'CancelEdition', 'InputCreated', 'BeforeUpdateCell', 'BeforeSetInput', 'FieldUpdated', 'RowAdded', 'RowDeleted', 'BeforeRowDelete', 'BeforeMoveRow', 'RowMoved', 'RowChanged', 'LostFocus', 'IsDirtyChanged', 'OnSort', 'BadgeClick', 'ViewModeChanged']);
});
t('22', 'sin errores de consola al cargar una tabla normal', async (c) => {
  await c.abrir(paginaProductos());
  c.sinErrores();
  c.igual(c.consola.filter(x => x.tipo === 'error'), []);
});

export default { nombre: 'actual-inicializacion', grupo: 'actual', pruebas: P };
