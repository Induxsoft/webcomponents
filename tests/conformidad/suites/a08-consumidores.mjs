// Actual: consumidores V12 (uie.dbeditable, list.dk, v12PrintHTML, ExportarCSV) y FactuDesk v12 (emitir).
import { CLIENTES, CUENTAS } from '../lib/fixtures.mjs';
import { paginaV12, COLS_V12, paginaFD } from '../lib/consumidores.mjs';

const P = [];
const v = (id, titulo, fn, x = {}) => P.push({ id: 'v12-' + id, titulo, spec: ['A.v12'], fn, ...x });
const f = (id, titulo, fn, x = {}) => P.push({ id: 'fd-' + id, titulo, spec: ['A.factudesk'], fn, ...x });
const T = 'tbl_clientes';
const ctxId = (c) => c.ev(() => getCurrentContext().item_id);
const COLS_ARB = [{ field: 'cuenta', caption: 'Cuenta' }, { field: 'nombre', caption: 'Nombre' }, { field: 'saldo', caption: 'Saldo', format: true, decs: 2 }];

v('01', 'lista: AutoAddRow, AutoDelRow y EverMove en false; la acción toma el sys_pk de la fila elegida', async (c) => {
  await c.abrir(paginaV12({ data: CLIENTES, cols: COLS_V12 }));
  c.igual(await c.ev((T) => { const t = __ct.t(T); return [t.AutoAddRow, t.AutoDelRow, t.EverMove]; }, T), [false, false, false]);
  await c.clic(T, 3, 1);
  c.igual(await ctxId(c), 104);
});
v('02', 'después de ordenar, la acción cae sobre el registro que se ve en la fila (I1)', async (c) => {
  await c.abrir(paginaV12({ data: CLIENTES, cols: COLS_V12 }));
  await c.clicTh(T, 1); // nombre ASC
  await c.clic(T, 0, 1);
  const visto = await c.ev((T) => __ct.texto(T, 0, 1), T);
  const id = await ctxId(c);
  c.igual(CLIENTES.find(x => x.sys_pk === id).nombre, visto);
  c.igual(visto, 'Abarrotes La Ficticia');
  await c.clicTh(T, 1); await c.clic(T, 0, 1);
  c.igual(await ctxId(c), 103, 'descendente: primero Papelería Prueba');
}, { });
v('03', 'paginación: pagination.goto(n) asigna la página a DataArray, _printRows() y la acción usa la página', async (c) => {
  await c.abrir(paginaV12({ modo: 'paginada', data: CLIENTES, cols: COLS_V12, porPagina: 2 }));
  c.igual(await c.ev((T) => __ct.filas(T).length, T), 2);
  await c.ev(() => pagination.goto(2));
  c.igual(await c.textos(T, 0), ['C-0103', 'C-0104']);
  await c.clic(T, 1, 0);
  c.igual(await ctxId(c), 104);
  c.igual(await c.ev(() => document.getElementById('tbl_clientes_leyend').textContent), 'Mostrando registros: 2 a 4 de 5');
});
v('04', 'paginación + ordenar: solo ordena la página y la acción sigue alineada', async (c) => {
  await c.abrir(paginaV12({ modo: 'paginada', data: CLIENTES, cols: COLS_V12, porPagina: 2 }));
  await c.ev(() => pagination.goto(2));
  await c.clicTh(T, 0); await c.clicTh(T, 0); // DESC
  c.igual(await c.textos(T, 0), ['C-0104', 'C-0103']);
  await c.clic(T, 0, 0);
  c.igual(await ctxId(c), 104);
});
v('05', 'árbol con _expandOnStart=true y _printTreeData(): la acción toma el registro de la fila (I1)', async (c) => {
  const data = [CUENTAS[3], CUENTAS[0], CUENTAS[1], CUENTAS[2], CUENTAS[5], CUENTAS[4]];
  await c.abrir(paginaV12({ id: 'tbl_cuentas', modo: 'arbol', data, cols: COLS_ARB, expanded: true }));
  c.igual(await c.ev(() => __ct.filas('tbl_cuentas').filter(tr => !tr.classList.contains('hidde-row')).length), 6);
  await c.ev(() => window.T = 'tbl_cuentas');
  for (const fila of [0, 2, 3, 5]) {
    await c.clic('tbl_cuentas', fila, 1);
    const r = await c.ev((fila) => { const t = __ct.t('tbl_cuentas'); return [t.DataArray[t.CurrentRowIndex()].sys_pk, __ct.filas('tbl_cuentas')[fila].getAttribute('id')]; }, fila);
    c.igual(String(r[0]), r[1], 'fila ' + fila);
  }
});
v('06', 'árbol colapsado (expanded=false): solo raíces visibles', async (c) => {
  await c.abrir(paginaV12({ id: 'tbl_cuentas', modo: 'arbol', data: CUENTAS, cols: COLS_ARB }));
  c.igual(await c.ev(() => __ct.filas('tbl_cuentas').filter(tr => !tr.classList.contains('hidde-row')).map(tr => tr.id)), ['1', '5']);
});
v('07', 'impresión V12: _shadow.getElementById(id).cloneNode(true) trae la tabla con todas las filas', async (c) => {
  await c.abrir(paginaV12({ data: CLIENTES, cols: COLS_V12 }));
  const r = await c.ev(() => { const k = clonV12('tbl_clientes'); return [k.tagName, k.id, k.tBodies[0].rows.length, k.tHead.rows[0].cells.length]; });
  c.igual(r, ['TABLE', T, 5, 4]);
});
v('08', 'impresión V12 en árbol colapsado: el clon trae también las filas ocultas', async (c) => {
  await c.abrir(paginaV12({ id: 'tbl_cuentas', modo: 'arbol', data: CUENTAS, cols: COLS_ARB }));
  c.igual(await c.ev(() => clonV12('tbl_cuentas').tBodies[0].rows.length), 6);
});
v('09', 'ExportarCSV de V12: lee Columns[].title/.field/.class y DataArray', async (c) => {
  await c.abrir(paginaV12({ data: CLIENTES.slice(0, 2), cols: COLS_V12 }));
  c.igual(await c.ev(() => exportarCSVV12()), 'Código,Nombre,Saldo\nC-0101,Abarrotes La Ficticia,1520.5\nC-0102,Ferretería El Ejemplo,0');
});
v('10', 'OnSort: la leyenda usa e.caption y e.coldef.sort', async (c) => {
  await c.abrir(paginaV12({ data: CLIENTES, cols: COLS_V12 }));
  await c.clicTh(T, 1);
  c.igual(await c.ev(() => document.getElementById('tbl_clientes_leyend').textContent), 'Mostrando los primeros 5 registros ordenados por Nombre ASC');
});
v('11', 'control-styles de V12: div:has(table#id) anula el overflow interno y #id tr th aplica', async (c) => {
  await c.abrir(paginaV12({ data: CLIENTES, cols: COLS_V12 }));
  c.igual(await c.ev(() => { const s = __ct.sr('tbl_clientes'); return [getComputedStyle(s.querySelector('div')).overflowY, getComputedStyle(__ct.th('tbl_clientes', 0)).fontWeight]; }), ['visible', '500']);
});
v('12', 'miembros internos que usa V12: _printRows, _printTreeData, _expandOnStart, _shadow', async (c) => {
  await c.abrir(paginaV12({ data: CLIENTES, cols: COLS_V12 }));
  c.igual(await c.ev(() => { const t = __ct.t('tbl_clientes'); return [typeof t._printRows, typeof t._printTreeData, t._expandOnStart, t._shadow === t.shadowRoot]; }), ['function', 'function', false, true]);
});
v('13', 'hidde-selector y cards-responsive: tarjetas en pantalla angosta con todas NoEditable', async (c) => {
  await c.abrir({ ...paginaV12({ data: CLIENTES, cols: COLS_V12 }), viewport: { width: 480, height: 700 } });
  c.igual(await c.ev(() => [__ct.sr('tbl_clientes').querySelector('table').classList.contains('table-cards'), __ct.t('tbl_clientes').IsCardView]), [true, true]);
});
v('14', 'el scroll y el thead sticky pasan al div#list_table_container del light DOM', async (c) => {
  const muchos = Array.from({ length: 40 }, (_, k) => ({ ...CLIENTES[k % 5], sys_pk: 200 + k, codigo: 'C-' + (200 + k) }));
  await c.abrir(paginaV12({ data: muchos, cols: COLS_V12, alto: '200px' }));
  const r = await c.ev(async () => { const cont = document.getElementById('list_table_container'); cont.scrollTop = 300; await __ct.cuadro(); const th = __ct.th('tbl_clientes', 0).getBoundingClientRect(); return [cont.scrollHeight > cont.clientHeight, Math.round(th.top - cont.getBoundingClientRect().top)]; });
  c.igual(r, [true, 0]);
});
v('15', 'la acción por registro tras ordenar dos veces y paginar sigue alineada (DataArray[CurrentRowIndex()])', async (c) => {
  await c.abrir(paginaV12({ modo: 'paginada', data: CLIENTES, cols: COLS_V12, porPagina: 3 }));
  await c.clicTh(T, 3); await c.ev(() => pagination.goto(2)); await c.clicTh(T, 1);
  for (let k = 0; k < 2; k++) {
    await c.clic(T, k, 1);
    const r = await c.ev((k) => [getCurrentContext().item_id, __ct.texto('tbl_clientes', k, 1)], k);
    c.igual(CLIENTES.find(x => x.sys_pk === r[0]).nombre, r[1]);
  }
});

// ---------- FactuDesk v12 ----------
f('01', 'tema por control-styles puesto al final del body (antes del DOMContentLoaded)', async (c) => {
  await c.abrir(paginaFD());
  const r = await c.ev(() => { const s = __ct.sr('em-conceptos'); return [s.querySelector('style').textContent.includes('var(--fd-brand-soft)'), getComputedStyle(s.querySelector('thead')).backgroundColor]; });
  c.igual(r, [true, 'rgb(245, 245, 245)']);
});
f('02', 'agregar concepto: push + _printRows + CellFocus + StartEdit en Cantidad, con el texto seleccionado', async (c) => {
  await c.abrir(paginaFD());
  const r = await c.ev(async () => { const i = agregarConcepto({ codigo: 'SERV-01', descripcion: 'Servicio ficticio', precio: 100 }); enfocarCantidad(i); await __ct.espera(20); const inp = tabla.EdiTable.GetInput(); return [tabla.Editing, inp && inp.value, inp && inp.selectionStart, inp && inp.selectionEnd, tabla.CurrentRowIndex()]; });
  c.igual(r[0], true); c.igual(r[1], '1'); c.igual(r[4], 0);
});
f('03', 'fieldupdated recalcula el renglón y UpdateRow lo redibuja con formato', async (c) => {
  await c.abrir(paginaFD());
  await c.ev(() => { const i = agregarConcepto({ codigo: 'SERV-01', descripcion: 'Servicio ficticio', precio: 1000 }); enfocarCantidad(i); });
  await c.esperar(30);
  await c.ev(() => { tabla.EdiTable.GetInput().value = '3'; });
  await c.tecla('Enter');
  const r = await c.ev(() => { const k = tabla.Columns.findIndex(x => x.field === 'importe'); return [tabla.DataArray[0].importe, __ct.texto('em-conceptos', 0, k)]; });
  c.igual(r, [3000, '$3,000.00']);
});
f('04', 'keydown nativo en captura sobre el host (HTMLElement.prototype.addEventListener.call): Supr quita la fila', async (c) => {
  await c.abrir(paginaFD());
  await c.ev(() => { agregarConcepto({ codigo: 'A', descripcion: 'a', precio: 1 }); agregarConcepto({ codigo: 'B', descripcion: 'b', precio: 2 }); });
  await c.foco('em-conceptos', 1, 0);
  await c.tecla('Delete');
  c.igual(await c.ev(() => [window.quitadas, tabla.DataArray.map(x => x.codigo), tabla.Editing]), [['B'], ['A'], false]);
});
f('05', 'flecha abajo en la última fila (con AutoAddRow=false) pasa el foco al buscador', async (c) => {
  await c.abrir(paginaFD());
  await c.ev(() => agregarConcepto({ codigo: 'A', descripcion: 'a', precio: 1 }));
  await c.foco('em-conceptos', 0, 0); await c.tecla('ArrowDown');
  c.igual(await c.ev(() => [document.activeElement.id, tabla.DataArray.length]), ['em-concepto-buscar', 1]);
});
f('06', 'hideColumn("predial") en el DOMContentLoaded de la página', async (c) => {
  await c.abrir(paginaFD());
  await c.ev(() => agregarConcepto({ codigo: 'A', descripcion: 'a', precio: 1 }));
  c.igual(await c.ev(() => { const k = tabla.Columns.findIndex(x => x.field === 'predial'); return [__ct.th('em-conceptos', k).classList.contains('hidde-col'), __ct.td('em-conceptos', 0, k).classList.contains('hidde-col')]; }), [true, true]);
});
f('07', 'sombreado por nth-child inyectado en _shadow alcanza las columnas NoEditable', async (c) => {
  await c.abrir(paginaFD());
  await c.ev(() => agregarConcepto({ codigo: 'A', descripcion: 'a', precio: 1 }));
  c.igual(await c.ev(() => [getComputedStyle(__ct.td('em-conceptos', 0, 0)).backgroundColor, getComputedStyle(__ct.td('em-conceptos', 0, 1)).backgroundColor]), ['rgb(237, 237, 237)', 'rgba(0, 0, 0, 0)']);
});
f('08', 'Descripción (Memo): Enter agrega salto de línea y Ctrl+Enter confirma', async (c) => {
  await c.abrir(paginaFD());
  await c.ev(() => agregarConcepto({ codigo: 'A', descripcion: 'uno', precio: 1 }));
  await c.foco('em-conceptos', 0, 1); await c.tecla('Enter'); await c.tecla('End'); await c.tecla('Enter'); await c.escribir('dos'); await c.tecla('Control+Enter');
  c.igual(await c.ev(() => tabla.DataArray[0].descripcion), 'uno\ndos');
});
f('09', 'la fila elegida se marca sin EdiTable-Row-Selected (hide-row-selector)', async (c) => {
  await c.abrir(paginaFD());
  await c.ev(() => agregarConcepto({ codigo: 'A', descripcion: 'a', precio: 1 }));
  await c.clic('em-conceptos', 0, 3);
  c.igual(await c.ev(() => __ct.filas('em-conceptos')[0].classList.contains('EdiTable-Row-Selected')), false);
});

export default { nombre: 'actual-consumidores-v12-factudesk', grupo: 'actual', pruebas: P };
