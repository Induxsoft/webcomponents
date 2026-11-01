// Actual: API de datos e índices. Contrato §1.5, §1.15, §2.3, §2.5.
import { tabla, paginaProductos, PRODUCTOS } from '../lib/fixtures.mjs';

const P = [];
const t = (id, titulo, fn, x = {}) => P.push({ id: 'dat-' + id, titulo, spec: ['A.datos'], fn, ...x });

t('01', 'asignar DataArray y _printRows() dibuja de inmediato (síncrono)', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.DataArray = [{ codigo: 'Z', nombre: 'zeta', cantidad: 1, precio: 1 }]; t._printRows(); return [__ct.filas('t1').length, __ct.texto('t1', 0, 1)]; });
  c.igual(r, [1, 'zeta']);
});
t('02', 'UpdateRow(i) vuelve a escribir la fila desde DataArray', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.DataArray[2].nombre = 'cambio'; t.DataArray[2].precio = 1000; const ok = t.UpdateRow(2); return [ok, __ct.texto('t1', 2, 1), __ct.texto('t1', 2, 3), t.UpdateRow(99)]; });
  c.igual(r, [true, 'cambio', '$1,000.00', false]);
});
t('03', 'UpdateData() copia el texto de las celdas a DataArray', async (c) => {
  await c.abrir(paginaProductos());
  const d = await c.ev(() => { const t = __ct.t('t1'); __ct.td('t1', 0, 1).querySelector('.cell-content').textContent = 'editado en DOM'; t.UpdateData(); return t.DataArray[0]; });
  c.igual(d.nombre, 'editado en DOM');
  c.igual(d.cantidad, '10', 'los valores leídos del DOM quedan como texto');
});
t('04', 'UpdateDataMember crea la fila si no existe y regresa el objeto', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); return t.UpdateDataMember(7, 'codigo', 'N'); });
  c.igual(r, { codigo: 'N' });
});
t('05', 'AddRow agrega al final con los default de las columnas (sin FieldUpdated)', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'cant', type: 'Number', default: '1', title: 'Cant' }, { field: 'd', title: 'D' }], data: [{ cant: 3, d: 'x' }] }) });
  await c.ev(() => __ct.grabar('t1', ['fieldupdated', 'rowadded']));
  await c.ev(() => __ct.t('t1').AddRow());
  c.igual(await c.datos(), [{ cant: 3, d: 'x' }, { cant: '1' }]);
  c.igual(await c.ev(() => __ct.texto('t1', 1, 0)), '1');
  c.igual(await c.ev(() => __ct.nombresLog()), ['rowadded']);
});
t('06', 'InsertRow(i) inserta en DataArray y en el DOM en la posición i', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.t('t1').InsertRow(1, true));
  const d = await c.datos();
  c.igual(d.map(x => x.codigo ?? null), ['P-003', null, 'P-001', 'P-002', 'P-004']);
  c.igual(await c.ev(() => __ct.filas('t1').length), 5);
});
t('07', 'DeleteRow(i) quita la fila del DOM y de DataArray; fuera de rango devuelve false', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); return [t.DeleteRow(0), t.DeleteRow(10), t.DataArray.map(x => x.codigo), __ct.filas('t1').length]; });
  c.igual(r, [true, false, ['P-001', 'P-002', 'P-004'], 3]);
});
t('08', 'conteos: TRCount, THCount, ColumnsCount, TDCount', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.TRCount(), t.THCount(), t.ColumnsCount(), t.TDCount(__ct.filas('t1')[0])]; }), [4, 4, 4, 4]);
});
t('09', 'índices: GetTrByIndex, RowIndexOfTd, ColIndexOfTd, TrOfTd, CurrentTd', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => {
    const t = __ct.t('t1'); const td = __ct.td('t1', 2, 3);
    const antes = t.CurrentTd();
    t.CellFocus(td);
    return [antes, t.GetTrByIndex(2) === __ct.filas('t1')[2], t.RowIndexOfTd(td), t.ColIndexOfTd(td), t.TrOfTd(td) === __ct.filas('t1')[2], t.CurrentTd() === td, t.RowIndexOfTd(null), t.GetTrByIndex(9)];
  });
  c.igual(r, [null, true, 2, 3, true, true, -1, undefined]);
});
t('10', 'DataArray[CurrentRowIndex()] es la fila seleccionada (invariante I1)', async (c) => {
  await c.abrir(paginaProductos());
  await c.clic('t1', 2, 0);
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return t.DataArray[t.CurrentRowIndex()].codigo; }), 'P-002');
});
t('11', 'GetColumnDef y GetColumnDefOfTd', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 3);
  const r = await c.ev(() => { const t = __ct.t('t1'); return [t.GetColumnDef().field, t.GetColumnDefOfTd(__ct.td('t1', 1, 1)).field, t.GetColumnDefOfTd(__ct.td('t1', 1, 1)) === t.Columns[1]]; });
  c.igual(r, ['precio', 'nombre', true]);
});
t('12', 'backup + edición: IsDirty y getIsDirty(i); al regresar el valor original queda limpio', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.t('t1').backup());
  await c.foco('t1', 1, 1); await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'otro'; }); await c.tecla('Enter');
  c.igual(await c.ev(() => [__ct.t('t1').IsDirty, __ct.t('t1').getIsDirty(1), __ct.t('t1').getIsDirty(0)]), [true, true, false]);
  await c.ev(() => __ct.t('t1').UpdateDataMember(1, 'nombre', 'Arandela plana'));
  c.igual(await c.ev(() => [__ct.t('t1').IsDirty, __ct.t('t1').getIsDirty(1)]), [false, false]);
});
t('13', 'restore() devuelve DataArray al respaldo y redibuja', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'nombre', 'cambio'); t.UpdateRow(0); t.restore(); return [t.DataArray[0].nombre, __ct.texto('t1', 0, 1), 'isDirty' in t.DataArray[0]]; });
  c.igual(r, ['Tornillo hexagonal', 'Tornillo hexagonal', false]);
});
t('14', 'restoreRow(i) restaura solo esa fila', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'nombre', 'a'); t.UpdateDataMember(1, 'nombre', 'b'); t.restoreRow(1); return [t.DataArray[0].nombre, t.DataArray[1].nombre, __ct.texto('t1', 1, 1)]; });
  c.igual(r, ['a', 'Arandela plana', 'Arandela plana']);
});
t('15', 'sin backup no hay IsDirty', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.UpdateDataMember(0, 'nombre', 'x'); return t.IsDirty; }), false);
});
t('16', 'DeleteRow quita la fila del respaldo', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.DeleteRow(0); return t._dataArrayBackup.map(x => x.codigo); }), ['P-001', 'P-002', 'P-004']);
});
t('17', 'SetTdValue aplica el formato de la columna; GetTdValue lo quita', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); const td = __ct.td('t1', 0, 3); t.SetTdValue(td, 1234.5, true); return [__ct.texto('t1', 0, 3), t.GetTdValue(td)]; });
  c.igual(r, ['$1,234.50', '1234.50']);
});
t('18', 'DataArray: los valores de data conservan su tipo JSON; los editados quedan como texto', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 2); await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = '11'; }); await c.tecla('Enter');
  const d = await c.datos();
  c.igual([typeof d[0].cantidad, typeof d[1].cantidad], ['string', 'number']);
});
t('19', 'DeleteCurrentRow borra la fila actual', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 3, 0);
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.DeleteCurrentRow(); return t.DataArray.length; }), 3);
});
t('20', 'GetTBody y GetTHead devuelven las secciones de la tabla interna', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); const tb = __ct.sr('t1').querySelector('table'); return [t.GetTBody() === tb.tBodies[0], t.GetTHead() === tb.tHead]; }), [true, true]);
});

export default { nombre: 'actual-api-de-datos', grupo: 'actual', pruebas: P };
