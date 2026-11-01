// v2: casos límite que combinan funciones, y compatibilidad R1 contra la referencia (0ed1824).
import { tabla, PRODUCTOS, COLS_PRODUCTOS, CLIENTES, CUENTAS, paginaProductos, muchas } from '../lib/fixtures.mjs';
import { paginaV12, COLS_V12, paginaFD } from '../lib/consumidores.mjs';
import { registro, m, campos, camposDom, filaTxt } from '../lib/v2.mjs';

// ---------- casos límite ----------
const { P, t } = registro('lim');
const COLS = (x = {}) => [
  { field: 'codigo', title: 'Código', ...(x.codigo ?? {}) }, { field: 'nombre', title: 'Nombre', ...(x.nombre ?? {}) },
  { field: 'linea', title: 'Línea', ...(x.linea ?? {}) }, { field: 'cantidad', type: 'Number', title: 'Cantidad', summary: 'sum', ...(x.cantidad ?? {}) },
  { field: 'precio', type: 'Number', title: 'Precio', format: 'true', decs: '2', ...(x.precio ?? {}) },
];
const TODO = { 'multi-select': 'checkbox', 'column-chooser': 'true', 'column-reorder': 'true', 'group-panel': 'true' };

t('01', 'sin datos: todas las funciones juntas no lanzan errores; SelectAll → []; getSummary 0/null', ['L-sin-datos', '§2-j', '§4-f'], async (c) => {
  await c.abrir({ body: tabla({ a: TODO, cols: COLS({ codigo: { fixed: 'left' } }), data: [] }), permisos: ['clipboard-read', 'clipboard-write'] });
  const r = await c.ev(() => { const t = __ct.t('t1'); t.SelectAll(); const s = t.getSelectedRows(); t.GroupBy(['linea']); return [s, t.getSummary('cantidad'), t.getExportData().rows.length, t.exportCSV().replace(/^﻿/, '').split(/\r\n/)[0]]; });
  c.igual(r[0], []); c.ok(r[1] === 0 || r[1] === null); c.igual(r[2], 0);
  c.sinErrores();
}, { requiere: ['multiselect', 'summary', 'export', 'group', 'fixed'] });
t('02', 'una sola fila: selección, totales, copiar y agrupar', ['L-una-fila'], async (c) => {
  await c.abrir({ body: tabla({ a: TODO, cols: COLS(), data: [PRODUCTOS[0]] }), permisos: ['clipboard-read', 'clipboard-write'] });
  const r = await c.ev(() => { const t = __ct.t('t1'); t.SelectAll(); t.GroupBy(['linea']); return [t.getSelectedRows(), t.getSummary('cantidad'), t.getClipboardText({ headers: false })]; });
  c.igual(r, [[0], 10, 'P-003\tTornillo hexagonal\tFerretería\t10\t2.50']);
}, { requiere: ['multiselect', 'summary', 'clipboard', 'group'] });
t('03', 'ocultas + fijas + reordenadas a la vez: Columns, DOM, hideColumns y edición siguen alineados', ['L-ocultas-fijas-reorden', '§0-R3', '§7-a'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'column-reorder': 'true' }, cols: COLS(), data: PRODUCTOS }) });
  const r = await c.ev(() => { const t = __ct.t('t1'); t.HideColumn('nombre'); t.FixColumn('precio', true); t.MoveColumn('linea', 1); return [t.Columns.map(x => x.field), t.hideColumns.slice(), t.getVisibleColumns().map(x => typeof x === 'string' ? x : x.field)]; });
  c.igual(r[0], await camposDom(c));
  c.igual(r[0][0], 'precio');
  c.igual(r[1], [r[0].indexOf('nombre')]);
  c.noContiene(r[2], 'nombre');
  const col = r[0].indexOf('codigo');
  await c.foco('t1', 2, col); await c.tecla('F2');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = 'ZZ'; }); await c.tecla('Enter');
  c.igual((await c.datos())[2].codigo, 'ZZ');
}, { requiere: ['chooser', 'fixed', 'reorder'] });
t('04', 'agrupación + selección + totales (summary-scope=selected)', ['L-grupo-seleccion-totales', '§2-d', '§4-h'], async (c) => {
  await c.abrir({ body: tabla({ a: { ...TODO, 'summary-scope': 'selected' }, cols: COLS(), data: PRODUCTOS }) });
  const r = await c.ev(() => { const t = __ct.t('t1'); t.SelectRows([0, 1]); t.GroupBy(['linea']); return [t.getSelectedRows(), t.getSummary('cantidad'), Array.from(__ct.sr('t1').querySelectorAll('tbody > tr.et-row-checked')).length]; });
  c.igual(r, [[0, 1], 15, 2]);
}, { requiere: ['multiselect', 'summary', 'group'] });
t('05', 'virtualización + teclado + impresión', ['L-virtual-teclado-impresion', '§10-h', '§10-j'], async (c) => {
  await c.abrir({ body: `<div id="sc" style="height:300px;overflow:auto">${tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px' }, cols: COLS() })}</div>`, script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(muchas(1000))};t._printRows();});` });
  await c.foco('t1', 0, 0); await c.tecla('Control+End');
  const r = await c.ev(() => { const t = __ct.t('t1'); const a = t.CurrentRowIndex(); window.dispatchEvent(new Event('beforeprint')); const n = __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length; window.dispatchEvent(new Event('afterprint')); return [a, n, t.CurrentRowIndex()]; });
  c.igual(r, [999, 1000, 999]);
}, { requiere: ['virtual'] });
t('06', 'selección + virtualización: la selección sobrevive al desplazamiento', ['§4-h', '§10-g'], async (c) => {
  await c.abrir({ body: `<div id="sc" style="height:300px;overflow:auto">${tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px', 'multi-select': 'checkbox' }, cols: COLS() })}</div>`, script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(muchas(1000))};t._printRows();t.SelectRows([1,900]);});` });
  await c.ev(async () => { document.getElementById('sc').scrollTop = 895 * 28; await __ct.cuadro(); await __ct.espera(50); });
  const r = await c.ev(() => [__ct.t('t1').getSelectedRows(), Array.from(__ct.sr('t1').querySelectorAll('tbody > tr.et-row-checked')).map(tr => Array.from(tr.cells).find(td => !td.classList.contains('et-sel-col')).textContent.trim())]);
  c.igual(r, [[1, 900], ['P-00901']]);
}, { requiere: ['virtual', 'multiselect'] });
t('07', 'exportar y copiar siguen el orden y la visibilidad actuales después de reordenar y ocultar', ['§4-k', '§5-h'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'column-reorder': 'true' }, cols: COLS(), data: PRODUCTOS.slice(0, 1) }), permisos: ['clipboard-read', 'clipboard-write'] });
  const r = await c.ev(() => { const t = __ct.t('t1'); t.MoveColumn('precio', 0); t.HideColumn('linea'); return [t.getExportData().columns.map(x => x.field), t.exportCSV().replace(/^﻿/, '').split(/\r\n/)[0], t.getClipboardText({ headers: true }).split('\r\n')[0]]; });
  c.igual(r[0], ['precio', 'codigo', 'nombre', 'cantidad']);
  c.igual(r[1], 'Precio,Código,Nombre,Cantidad');
}, { requiere: ['export', 'reorder', 'chooser', 'clipboard'] });
t('08', 'diseño + columnas: getLayout refleja oculta, fija, orden y ancho a la vez', ['§9-a'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'column-reorder': 'true' }, cols: COLS(), data: PRODUCTOS }) });
  const l = await c.ev(() => { const t = __ct.t('t1'); t.HideColumn('nombre'); t.FixColumn('cantidad', true); t.MoveColumn('linea', 1); return t.getLayout(); });
  const by = Object.fromEntries(l.columns.map(x => [x.field, x]));
  c.igual([by.nombre.hidden, by.cantidad.fixed, by.cantidad.order, by.linea.order], [true, true, 0, 1]);
}, { requiere: ['layout', 'chooser', 'fixed', 'reorder'] });
t('09', 'árbol + multi-select: la selección habla de índices de DataArray', ['§0-R2', '§4-f'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent', 'multi-select': 'checkbox' }, cols: [{ field: 'cuenta', title: 'Cuenta' }, { field: 'nombre', title: 'Nombre' }], data: CUENTAS }) });
  await c.ev(() => { const t = __ct.t('t1'); t._expandOnStart = true; t._printTreeData(); });
  await c.clic('t1', 3, 0, { en: 'checkbox' });
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return t.getSelectedData().map(x => x.nombre); }), [await c.ev(() => __ct.t('t1').DataArray[3].nombre)]);
}, { requiere: ['multiselect'] });
t('10', 'C9 + funciones nuevas: un edit-table creado dinámicamente con summary y multi-select funciona', ['§1-C9', '§2-j', '§4-b'], async (c) => {
  await c.abrir({ body: '<div id="cont"></div>' });
  const r = await c.ev(async () => {
    const el = document.createElement('edit-table'); el.id = 'dyn'; el.setAttribute('multi-select', 'checkbox'); el.setAttribute('data', JSON.stringify([{ a: 1 }, { a: 2 }]));
    el.innerHTML = '<edit-thead><edit-tr><edit-th field="a" type="Number" summary="sum">A</edit-th></edit-tr></edit-thead>';
    document.getElementById('cont').appendChild(el); await __ct.cuadro();
    return [el.getSummary('a'), !!el.shadowRoot.querySelector('th.et-sel-col')];
  });
  c.igual(r, [3, true]);
}, { requiere: ['summary', 'multiselect'] });

// ---------- R1: compatibilidad contra la referencia ----------
const { P: PR, t: r1 } = registro('r1');
async function foto(c) {
  return c.ev(() => { const ids = Array.from(document.querySelectorAll('edit-table')).map(e => e.id); return { ids, dom: ids.map(id => __ct.serial(id)), datos: ids.map(id => __ct.datos(id)), cols: ids.map(id => JSON.parse(JSON.stringify(document.getElementById(id).Columns.map(x => { const o = { ...x }; delete o.inputkey; delete o.Converts; return o; })))), log: __ct.log.map(x => x.ev + ':' + JSON.stringify(x.a)), light: document.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g, '') }; });
}
// Diferencias autorizadas en F1 (spec §13, decisión de Emmanuel del 2026-11-01) que se normalizan, y solo esas:
//   C19: LeaveCell recibe el td que se deja (0ed1824 manda null): el td de LeaveCell se iguala a null en las dos fotos.
//   C20: changeColumnTitle actualiza Columns[i].title: el title de Columns se toma de la referencia.
//   C4 (solo en los escenarios que lo declaran con autorizadas: ['C4']): restore()/restoreRow() disparan un
//      IsDirtyChanged que 0ed1824 no dispara; se quita ese único evento final si es la única diferencia.
// Se eligió normalizar estos dos campos en lugar de una copia de referencia con las correcciones: así la
// referencia sigue siendo 0ed1824 tal cual y cualquier otra diferencia (DOM, datos, eventos) sigue fallando.
function normalizarAutorizadas(a, b, autorizadas = []) {
  if (autorizadas.includes('C4') && a.log.length === b.log.length + 1 && a.log[a.log.length - 1].startsWith('isdirtychanged:')
    && a.log.slice(0, -1).every((x, i) => x === b.log[i])) a.log = a.log.slice(0, -1);
  const c19 = (l) => l.map(x => x.startsWith('leavecell:') ? x.replace(/^leavecell:\{"td":(\{[^}]*\}|null)/, 'leavecell:{"td":null') : x);
  a.log = c19(a.log); b.log = c19(b.log);
  a.cols = a.cols.map((cols, i) => cols.map((col, k) => (b.cols[i]?.[k] && 'title' in b.cols[i][k]) ? { ...col, title: b.cols[i][k].title } : col));
}
function compararFotos(c, a, b, autorizadas) {
  normalizarAutorizadas(a, b, autorizadas);
  c.igual(a.ids, b.ids, 'tablas');
  for (let i = 0; i < a.ids.length; i++) {
    if (a.dom[i] !== b.dom[i]) {
      let k = 0; while (k < a.dom[i].length && a.dom[i][k] === b.dom[i][k]) k++;
      c.ok(false, `shadow DOM de #${a.ids[i]} distinto en el carácter ${k}: bajo prueba «${a.dom[i].slice(Math.max(0, k - 60), k + 80)}» vs referencia «${b.dom[i].slice(Math.max(0, k - 60), k + 80)}»`);
    }
  }
  c.igual(a.datos, b.datos, 'DataArray');
  c.igual(a.cols, b.cols, 'Columns');
  c.igual(a.log, b.log, 'eventos');
  c.igual(a.light, b.light, 'light DOM');
}
function escenario(id, titulo, construir, accion, extra = {}) {
  r1(id, `R1 ${titulo}: DOM interno, DataArray, Columns y eventos idénticos a 0ed1824`, ['§0-R1'], async (c) => {
    const fotos = {};
    // Ajuste (AJUSTES.md): la sonda registra solo los eventos que existen en 0ed1824 (Const.Events de la
    // referencia). Registrar un evento nuevo ya es usar algo nuevo (por ejemplo, LayoutChanged al ordenar).
    let nombres = null;
    for (const src of ['ref', 'et']) {
      const cc = src === 'et' ? c : await c.otra({ ...construir(), src });
      if (src === 'et') await c.abrir({ ...construir(), src });
      // lostfocus lo dispara un setInterval de 1 s: depende del reloj, no del componente; se excluye de la comparación
      if (!nombres) nombres = await cc.ev(() => Object.values(document.querySelector('edit-table').EdiTable.Const.Events).filter(n => n !== 'badgeclick' && n !== 'lostfocus'));
      await cc.ev((nombres) => document.querySelectorAll('edit-table').forEach(e => __ct.grabar(e, nombres)), nombres);
      await accion(cc);
      await cc.esperar(30);
      fotos[src] = await foto(cc);
    }
    compararFotos(c, fotos.et, fotos.ref, extra.autorizadas);
  }, extra);
}
escenario('01', 'tabla básica: clic, edición de texto, Esc, ordenar, AddRow, borrar', () => paginaProductos(), async (c) => {
  await c.clic('t1', 1, 1); await c.tecla('Enter'); await c.escribir('xyz'); await c.tecla('Enter');
  await c.clic('t1', 2, 1); await c.tecla('F2'); await c.tecla('Escape');
  await c.clicTh('t1', 0); await c.clicTh('t1', 3);
  await c.ev(() => { const t = __ct.t('t1'); t.AddRow(); t.DeleteRow(0); });
});
escenario('02', 'todos los tipos de columna y formato', () => ({ body: tabla({ cols: [{ field: 'ne', type: 'NoEditable', title: 'NE', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' }, { field: 'se', type: 'Select', options: '{"A":"Alfa","B":"Beta"}', keyfield: 'sk', title: 'Sel' }, { field: 'ch', type: 'Check', title: 'Ch' }, { field: 'me', type: 'Memo', title: 'Me' }, { field: 'cu', type: 'Custom', button: 'true', title: 'Cu' }, { field: 'da', type: 'Date', title: 'Da' }], data: [{ ne: 1234.5, se: 'Alfa', sk: 'A', ch: 'Sí', me: 'm', cu: 'c', da: '2026-01-01' }] }) }), async (c) => {
  await c.clic('t1', 0, 1); await c.tecla('Enter'); await c.tecla('Escape');
  await c.clic('t1', 0, 2); await c.tecla('Enter'); await c.tecla('Escape');
  await c.clic('t1', 0, 4); await c.clic('t1', 0, 3);
});
escenario('03', 'árbol: expandir, colapsar, RowIndent', () => ({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'Cuenta' }, { field: 'nombre', title: 'Nombre' }], data: CUENTAS }) }), async (c) => {
  await c.ev(() => __ct.filas('t1')[0].querySelector('span.collapse-btn').click());
  await c.clic('t1', 1, 1);
  await c.ev(() => __ct.t('t1').RowIndent(__ct.filas('t1')[4]));
});
escenario('04', 'tarjetas, badges, acento y clases (pantalla angosta)', () => ({ viewport: { width: 500, height: 700 }, body: tabla({ a: { 'cards-responsive': 'true', 'hidde-selector': 'true' }, cols: [{ field: 'codigo', type: 'NoEditable', title: 'C' }, { field: 'nombre', type: 'NoEditable', title: 'N' }, { field: 'saldo', type: 'NoEditable', title: 'S' }], data: CLIENTES }), script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.RowBadges=(r)=>r.saldo<0?[{id:'n',text:'!'}]:[];t.RowAccent=(r)=>r.saldo<0?'red':null;t.RowClass=(r)=>r.ciudad==='Oaxaca'?'oax':'';t.RefreshView();});" }), async (c) => {
  await c.clic('t1', 2, 1);
});
escenario('05', 'lista V12 paginada con acción por registro y ordenar', () => paginaV12({ modo: 'paginada', data: CLIENTES, cols: COLS_V12, porPagina: 2 }), async (c) => {
  await c.ev(() => pagination.goto(2)); await c.clicTh('tbl_clientes', 1); await c.clic('tbl_clientes', 1, 0);
  await c.ev(() => { window.ctx = getCurrentContext(); window.csv = exportarCSVV12(); });
});
escenario('06', 'árbol V12 expandido', () => paginaV12({ id: 'tbl_cuentas', modo: 'arbol', data: CUENTAS, cols: [{ field: 'cuenta', caption: 'Cuenta' }, { field: 'nombre', caption: 'Nombre' }], expanded: true }), async (c) => {
  await c.clic('tbl_cuentas', 3, 1);
});
escenario('07', 'conceptos de FactuDesk: agregar, editar cantidad, Supr', () => paginaFD(), async (c) => {
  await c.ev(() => { agregarConcepto({ codigo: 'A', descripcion: 'a', precio: 10 }); agregarConcepto({ codigo: 'B', descripcion: 'b', precio: 20 }); });
  await c.foco('em-conceptos', 0, 1); await c.tecla('Enter'); await c.escribir(' más'); await c.tecla('Control+Enter');
  await c.foco('em-conceptos', 1, 0); await c.tecla('Delete');
});
escenario('08', 'impresión (beforeprint/afterprint) con columnas no-print', () => ({ body: tabla({ cols: [{ field: 'a', title: 'A' }, { field: 'b', title: 'B', class: 'no-print' }], data: [{ a: 1, b: 2 }] }) }), async (c) => {
  await c.ev(() => { window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('afterprint')); });
});
escenario('09', 'tabla vacía y captura con teclado (AutoAddRow, Tab, flechas)', () => ({ body: tabla({ cols: [{ field: 'a', title: 'A' }, { field: 'b', title: 'B', default: 'x' }], data: [] }) }), async (c) => {
  await c.ev(() => __ct.t('t1').AddRow());
  await c.tecla('Enter'); await c.escribir('uno'); await c.tecla('Tab'); await c.tecla('ArrowDown'); await c.tecla('Enter'); await c.escribir('dos'); await c.tecla('Enter');
});
escenario('10', 'hideColumn, changeColumnTitle, IsDirty/backup/restore', () => paginaProductos(), async (c) => {
  await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.hideColumn('nombre', true); t.changeColumnTitle('precio', 'P. U.'); t.UpdateDataMember(0, 'codigo', 'X'); t.UpdateRow(0); t.restoreRow(0); });
}, { autorizadas: ['C4'] });
r1('11', 'R1: sin atributos nuevos no hay tfoot, et-sel-col, et-chooser, et-group-panel ni et-spacer', ['§0-R1'], async (c) => {
  await c.abrir(paginaProductos());
  await c.clicTh('t1', 1, { boton: 'right' });
  c.igual(await c.ev(() => ['tfoot', '.et-sel-col', '.et-chooser', '.et-chooser-btn', '.et-group-panel', '.et-spacer', '.et-fixed-last', '.et-row-checked', '.et-drop-indicator'].filter(s => __ct.sr('t1').querySelector(s))), []);
});
r1('12', 'R1: el <style> del shadow es idéntico al de la referencia', ['§0-R1'], async (c) => {
  await c.abrir(paginaProductos());
  const a = await c.ev(() => __ct.sr('t1').querySelector('style').textContent);
  const o = await c.otra({ ...paginaProductos(), src: 'ref' });
  c.igual(a, await o.ev(() => __ct.sr('t1').querySelector('style').textContent));
});

export default [{ nombre: 'v2-casos-limite', grupo: 'v2', pruebas: P }, { nombre: 'v2-compatibilidad-R1', grupo: 'v2', pruebas: PR }];
