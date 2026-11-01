// Correcciones C1-C11 (spec §1, decisión D1). Cada prueba afirma el comportamiento CORRECTO:
// fallan contra 0ed1824 y deben pasar con F1.
import { tabla, paginaProductos, PRODUCTOS, COLS_PRODUCTOS } from '../lib/fixtures.mjs';

const P = [];
const t = (id, titulo, spec, fn, x = {}) => P.push({ id: 'cor-' + id, titulo, spec: [spec], fn, ...x });

t('C1a', 'después de 3 InsertRow, un clic dispara BeforeCellFocus una sola vez', '§1-C1', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => { const t = __ct.t('t1'); t.InsertRow(undefined, true); t.InsertRow(undefined, true); t.InsertRow(undefined, true); window.n = 0; t.Events.beforecellfocus = () => window.n++; });
  await c.clic('t1', 1, 1);
  c.igual(await c.ev(() => window.n), 1);
});
t('C1b', 'después de AddRow, el clic en una celda pasa el td (no el div interno) a BeforeCellFocus', '§1-C1', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => { const t = __ct.t('t1'); t.AddRow(); window.tds = []; t.Events.beforecellfocus = (e) => window.tds.push(e.td && e.td.tagName); });
  await c.clic('t1', 0, 1);
  c.igual(await c.ev(() => window.tds), ['TD']);
});
for (const [k, combo] of [['C2a', 'Control+c'], ['C2b', 'Control+v'], ['C2c', 'Control+x'], ['C2d', 'Control+a'], ['C2e', 'Meta+c']]) {
  t(k, `${combo} sobre el selector no empieza la edición`, '§1-C2', async (c) => {
    await c.abrir({ ...paginaProductos(), permisos: ['clipboard-read', 'clipboard-write'] });
    await c.foco('t1', 0, 1);
    await c.tecla(combo);
    c.igual(await c.ev(() => __ct.t('t1').Editing), false);
  });
}
t('C2f', 'una letra sin modificadores sigue empezando la edición (no regresión)', '§1-C2', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1); await c.tecla('c');
  c.igual(await c.ev(() => __ct.t('t1').Editing), true);
});
const COLS_IMP = [{ field: 'a', title: 'A' }, { field: 'b', title: 'B', class: 'no-print' }, { field: 'c', title: 'C' }];
t('C3a', 'afterprint deja ocultas las columnas no-print que el usuario ya había ocultado', '§1-C3', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_IMP, data: [{ a: 1, b: 2, c: 3 }] }) });
  const r = await c.ev(() => { const t = __ct.t('t1'); t.hideColumn('b', true); window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('afterprint')); return __ct.th('t1', 1).classList.contains('hidde-col'); });
  c.igual(r, true);
});
t('C3b', 'afterprint restaura exactamente el estado previo de todas las columnas', '§1-C3', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_IMP, data: [{ a: 1, b: 2, c: 3 }] }) });
  const r = await c.ev(() => { const t = __ct.t('t1'); t.hideColumn('c', true); const antes = [0, 1, 2].map(k => __ct.th('t1', k).classList.contains('hidde-col')); window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('afterprint')); return [antes, [0, 1, 2].map(k => __ct.th('t1', k).classList.contains('hidde-col')), t.hideColumns.slice().sort()]; });
  c.igual(r[1], r[0]); c.igual(r[2], [2]);
});
t('C4a', 'restore() deja IsDirty=false', '§1-C4', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'nombre', 'x'); t.restore(); return t.IsDirty; }), false);
});
t('C4b', 'restore() dispara IsDirtyChanged si el valor cambió (y no si no cambió)', '§1-C4', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'nombre', 'x'); window.n = 0; t.Events.isdirtychanged = () => window.n++; t.restore(); const a = window.n; t.restore(); return [a, window.n]; });
  c.igual(r, [1, 1]);
});
t('C4c', 'después de restore(), editar y volver al valor original deja IsDirty=false', '§1-C4', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'nombre', 'x'); t.restore(); t.UpdateDataMember(1, 'nombre', 'y'); t.UpdateDataMember(1, 'nombre', 'Arandela plana'); return t.IsDirty; }), false);
});
for (const [k, val, editable] of [['C5a', 'false', true], ['C5b', '0', true], ['C5c', 'no', true], ['C5d', 'true', false]]) {
  t(k, `readonly="${val}" en la columna: ${editable ? 'editable' : 'de solo lectura'}`, '§1-C5', async (c) => {
    await c.abrir({ body: tabla({ cols: [{ field: 'a', readonly: val, title: 'A' }], data: [{ a: 'x' }] }) });
    await c.foco('t1', 0, 0); await c.tecla('Enter');
    c.igual(await c.ev(() => __ct.t('t1').Editing), editable);
  });
}
t('C5e', 'readonly="false" en el host: la tabla es editable', '§1-C5', async (c) => {
  await c.abrir(paginaProductos({ a: { readonly: 'false' } }));
  c.igual(await c.ev(() => __ct.t('t1').ReadOnly), false);
}, { nota: 'La spec C5 habla de la columna; se extiende al host por la regla general de booleanos (ver PREGUNTAS P-C5).' });
t('C6a', 'NavToEnd() va a la última fila en la columna actual', '§1-C6', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 2);
  await c.ev(() => __ct.t('t1').NavToEnd());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.CurrentRowIndex(), t.CurrentColIndex()]; }), [3, 2]);
});
t('C6b', 'Ctrl+End (NavToEnd) desde el teclado', '§1-C6', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1); await c.tecla('Control+End');
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.CurrentRowIndex(), t.CurrentColIndex()]; }), [3, 1]);
});
t('C7', 'la propiedad sorTable=false desactiva ordenar con clic', '§1-C7', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').sorTable=false;});" }));
  await c.clicTh('t1', 0);
  c.igual(await c.ev(() => __ct.t('t1').DataArray.map(x => x.codigo)), PRODUCTOS.map(x => x.codigo));
});
t('C7b', 'sorTable=true vuelve a activar el orden', '§1-C7', async (c) => {
  await c.abrir(paginaProductos({ a: { sorTable: 'false' }, script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').sorTable=true;});" }));
  await c.clicTh('t1', 0);
  c.igual(await c.ev(() => __ct.t('t1').DataArray[0].codigo), 'P-001');
});
const NUEVOS = ['summary-scope', 'multi-select', 'column-chooser', 'column-reorder', 'design-auto-save', 'design-key', 'design-auto-save-sort', 'show-tree', 'hidde-selector', 'hide-row-selector'];
t('C8a', 'observedAttributes incluye los atributos de §2-§9 y show-tree, hidde-selector, hide-row-selector', '§1-C8', async (c) => {
  await c.abrir(paginaProductos());
  const obs = await c.ev(() => (customElements.get('edit-table').observedAttributes ?? []).map(x => String(x).toLowerCase()));
  const falt = NUEVOS.filter(n => !obs.includes(n));
  c.igual(falt, [], 'faltan en observedAttributes');
});
t('C8b', 'attributeChangedCallback existe (nombre estándar)', '§1-C8', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => typeof customElements.get('edit-table').prototype.attributeChangedCallback), 'function');
});
t('C8c', 'cambiar hide-row-selector después de la carga se aplica', '§1-C8', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.t('t1').setAttribute('hide-row-selector', 'true'));
  await c.foco('t1', 1, 0);
  c.igual(await c.ev(() => __ct.filas('t1')[1].classList.contains('EdiTable-Row-Selected')), false);
});
t('C8d', 'cambiar hidde-selector después de la carga se aplica', '§1-C8', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.t('t1').setAttribute('hidde-selector', 'true'));
  await c.foco('t1', 1, 0);
  c.igual(await c.ev(() => __ct.td('t1', 1, 0).querySelector('.EdiTable-Selector').classList.contains('transparent')), true);
});
t('C8e', 'cambiar show-tree después de la carga dibuja el árbol', '§1-C8', async (c) => {
  await c.abrir({ body: tabla({ a: { key: 'id', parentkey: 'p' }, cols: [{ field: 'n', title: 'N' }], data: [{ id: 1, n: 'a' }, { id: 2, p: 1, n: 'b' }] }) });
  await c.ev(() => __ct.t('t1').setAttribute('show-tree', 'true'));
  await c.cuadro();
  c.igual(await c.ev(() => [__ct.t('t1').ShowAsTree, !!__ct.sr('t1').querySelector('span.collapse-btn')]), [true, true]);
});
t('C9a', 'edit-table creado después de DOMContentLoaded se inicializa al conectarse', '§1-C9', async (c) => {
  await c.abrir({ body: '<div id="cont"></div>' });
  const r = await c.ev(async () => {
    const el = document.createElement('edit-table'); el.id = 'dyn';
    el.setAttribute('data', JSON.stringify([{ a: 'x' }, { a: 'y' }]));
    el.innerHTML = '<edit-thead><edit-tr><edit-th field="a">A</edit-th></edit-tr></edit-thead>';
    document.getElementById('cont').appendChild(el);
    await __ct.cuadro();
    const s = el.shadowRoot;
    return [!!s, s ? s.querySelectorAll('tbody tr').length : -1, el.DataArray.length];
  });
  c.igual(r, [true, 2, 2]);
});
t('C9b', 'el creado dinámicamente responde al clic y a la edición', '§1-C9', async (c) => {
  await c.abrir({ body: '<div id="cont"></div>' });
  await c.ev(async () => {
    const el = document.createElement('edit-table'); el.id = 'dyn';
    el.setAttribute('data', JSON.stringify([{ a: 'x' }]));
    el.innerHTML = '<edit-thead><edit-tr><edit-th field="a">A</edit-th></edit-tr></edit-thead>';
    document.getElementById('cont').appendChild(el); await __ct.cuadro();
  });
  await c.clic('dyn', 0, 0); await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.t('dyn').Editing), true);
});
t('C9c', 'mientras la página carga, se conserva el orden: el componente se inicializa antes que los DOMContentLoaded de los scripts posteriores', '§1-C9', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.listo=[!!t.shadowRoot, t.DataArray.length, !!(t.shadowRoot&&t.shadowRoot.querySelector('tbody tr'))];});" }));
  c.igual(await c.ev(() => window.listo), [true, 4, true]);
});
t('C10a', 'Sort reordena el respaldo junto con los datos: tras ordenar, sin cambios IsDirty sigue false al reescribir el mismo valor', '§1-C10', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.t('t1').backup());
  await c.clicTh('t1', 0); // ordena por código
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.UpdateDataMember(0, 'nombre', t.DataArray[0].nombre); return [t.IsDirty, t.getIsDirty(0)]; }), [false, false]);
});
t('C10b', 'Sort reordena el respaldo: restore() después de ordenar conserva la correspondencia fila ↔ respaldo', '§1-C10', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.Sort(t.DataArray, 'codigo', false); return t._dataArrayBackup.map(x => x.codigo); });
  c.igual(r, ['P-001', 'P-002', 'P-003', 'P-004']);
});
t('C11a', 'al sacar el elemento del documento se libera el setInterval', '§1-C11', async (c) => {
  await c.abrir({ body: '<div id="cont"></div>' + tabla({ id: 'x1', cols: COLS_PRODUCTOS, data: PRODUCTOS }) });
  const r = await c.ev(async () => { const antes = __ct.intervalosActivos(); __ct.t('x1').remove(); await __ct.espera(20); return [antes, __ct.intervalosActivos()]; });
  c.ok(r[0] >= 1, 'el componente crea su intervalo'); c.igual(r[1], r[0] - 1, 'intervalos activos después de quitarlo');
});
t('C11b', 'al sacarlo se quitan sus listeners de window (beforeprint/afterprint) y de document (mousemove/mouseup)', '§1-C11', async (c) => {
  await c.abrir({ body: '<div id="cont"></div>' });
  const r = await c.ev(async () => {
    const A = __ct.activos; const foto = () => ['window:beforeprint', 'window:afterprint', 'document:mousemove', 'document:mouseup'].map(k => A[k] || 0);
    const base = foto();
    const el = document.createElement('edit-table'); el.id = 'dyn'; el.setAttribute('data', '[{"a":1,"b":2}]');
    el.innerHTML = '<edit-thead><edit-tr><edit-th field="a">A</edit-th><edit-th field="b">B</edit-th></edit-tr></edit-thead>';
    document.getElementById('cont').appendChild(el); await __ct.cuadro();
    const con = foto(); el.remove(); await __ct.espera(20);
    return [base, con, foto()];
  });
  c.ok(r[1].some((v, k) => v > r[0][k]), 'conectado debe registrar listeners (requiere C9)');
  c.igual(r[2], r[0]);
});
t('C11c', 'al reconectarlo vuelve a funcionar (intervalo, clic y edición)', '§1-C11', async (c) => {
  await c.abrir({ body: '<div id="a"></div><div id="b"></div>' + tabla({ id: 'x1', cols: COLS_PRODUCTOS, data: PRODUCTOS }) });
  const r = await c.ev(async () => { const el = __ct.t('x1'); const n0 = __ct.intervalosActivos(); el.remove(); await __ct.espera(10); const n1 = __ct.intervalosActivos(); document.getElementById('b').appendChild(el); await __ct.cuadro(); return [n0, n1, __ct.intervalosActivos(), el.shadowRoot.querySelectorAll('tbody tr').length]; });
  c.igual([r[1], r[2], r[3]], [r[0] - 1, r[0], 4]);
  await c.clic('x1', 1, 1); await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.t('x1').Editing), true);
});
t('C11d', 'reconectar no duplica el shadow ni las filas', '§1-C11', async (c) => {
  await c.abrir({ body: '<div id="b"></div>' + tabla({ id: 'x1', cols: COLS_PRODUCTOS, data: PRODUCTOS }) });
  const r = await c.ev(async () => { const el = __ct.t('x1'); el.remove(); document.getElementById('b').appendChild(el); await __ct.cuadro(); const s = el.shadowRoot; return [s.querySelectorAll('table').length, s.querySelectorAll('tbody tr').length, s.querySelectorAll('style').length]; });
  c.igual(r, [1, 4, 1]);
  c.sinErrores();
});

export default { nombre: 'correcciones-C1-C11', grupo: 'correcciones', pruebas: P };
