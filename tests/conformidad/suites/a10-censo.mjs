// Censo de consumidores (v12_qa/docs/edittable: censo.md, uso-api.csv, control-styles.md, 2026-11-01).
// Cada selector de control-styles y cada miembro o API con uso real tiene aquí al menos una prueba que confirma
// que sigue funcionando. Grupo "actual": pasan contra 0ed1824 y deben seguir pasando en la versión 2 (R1).
// El campo `censo` de cada prueba relaciona la dependencia con la prueba (MATRIZ.md, sección "Censo").
import { tabla, PRODUCTOS, CUENTAS } from '../lib/fixtures.mjs';

const P = [];
const t = (id, titulo, censo, fn, x = {}) => P.push({ id: 'cen-' + id, titulo, spec: ['A.censo'], censo: [].concat(censo), fn, ...x });

// ---------- control-styles: una página con columnas que cubren los selectores del censo ----------
const COLS10 = [
  { field: 'codigo', title: 'Código' }, { field: 'descripcion', title: 'Descripción' }, { field: 'unidad', type: 'Select', options: '{"PZA":"PIEZA","CJ":"CAJA"}', title: 'Unidad' },
  { field: 'cantidad', type: 'Number', title: 'Requerido' }, { field: 'importe', type: 'Number', title: 'Importe', format: 'true', decs: '2', prefix: '$' },
  { field: 'fecha', type: 'Date', title: 'Caducidad' }, { field: 'momento', type: 'DateTime', title: 'Registro' }, { field: 'nota', type: 'Memo', title: 'Notas' },
  { field: 'ok', type: 'Check', title: 'Surtido' }, { field: 'origen', type: 'Text', button: 'true', title: 'Origen' },
];
const FILAS = [
  { codigo: 'P-1', descripcion: 'Uno', unidad: 'PZA', cantidad: 1, importe: 10, fecha: '2026-01-01', momento: '2026-01-01T10:00', nota: 'a', ok: 'Sí', origen: 'x' },
  { codigo: 'P-2', descripcion: 'Dos', unidad: 'CJ', cantidad: 2, importe: 20, fecha: '2026-01-02', momento: '2026-01-02T10:00', nota: 'b', ok: 'No', origen: 'y' },
];
/** Abre la página con `control-styles` = "<selector>{--censo:si}" (más extra) y devuelve cuántos elementos marca. */
async function conSelector(c, sel, { accion, a = {}, objetivo, pseudo = null, light = '' } = {}) {
  const css = `${sel}{--censo:si}`;
  await c.abrir({ body: light + tabla({ a: { 'control-styles': css, ...a }, cols: COLS10, data: FILAS }) });
  if (accion) await accion(c);
  return c.ev(({ objetivo, pseudo }) => {
    const s = __ct.sr('t1');
    const todos = objetivo ? Array.from(s.querySelectorAll(objetivo)) : Array.from(s.querySelectorAll('*'));
    return todos.filter(el => getComputedStyle(el, pseudo).getPropertyValue('--censo').trim() === 'si').map(el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''));
  }, { objetivo, pseudo });
}
const editarCol = (col) => async (c) => { await c.foco('t1', 0, col); await c.tecla('F2'); await c.page.waitForFunction(() => !!__ct.sr('t1').querySelector('#__table_input'), null, { timeout: 3000 }).catch(() => {}); };
const SEL = [
  ['tr td', { objetivo: 'td', min: 20 }],
  ['tr th', { objetivo: 'th', min: 10 }],
  ['th', { objetivo: 'th', min: 10 }],
  ['td', { objetivo: 'td', min: 20 }],
  ['table', { objetivo: 'table', min: 1 }],
  ['thead', { objetivo: 'thead', min: 1 }],
  ['thead tr th', { objetivo: 'th', min: 10 }],
  ['tbody tr', { objetivo: 'tbody tr', min: 2, alias: 'tbody tr:hover' }],
  ["input[type='checkbox']", { objetivo: 'input', min: 1, accion: editarCol(8) }],
  ['#__table_input', { objetivo: '#__table_input', min: 1, accion: editarCol(1) }],
  ['.EdiTable-Row-Selected', { objetivo: 'tr', min: 1, accion: (c) => c.foco('t1', 1, 0) }],
  ['.EdiTable-Button', { objetivo: 'button', min: 1, accion: (c) => c.foco('t1', 0, 9) }],
  ['.EdiTable-Cell', { objetivo: 'td', min: 20 }],
  ['.EdiTable-Selector', { objetivo: 'div', min: 1, accion: (c) => c.foco('t1', 0, 0) }],
  ['.EdiTable-Selector:focus', { objetivo: 'div', min: 1, accion: (c) => c.foco('t1', 0, 0) }],
  ['.Editable-Input-Date', { objetivo: 'input', min: 1, accion: editarCol(5) }],
  ['.Editable-Input-DateTime', { objetivo: 'input', min: 1, accion: editarCol(6) }],
  ['.Editable-Input-Memo', { objetivo: 'textarea', min: 1, accion: editarCol(7) }],
  ['.Editable-Input-Number', { objetivo: 'input', min: 1, accion: editarCol(3) }],
  ['.Editable-Input-Select', { objetivo: 'select', min: 1, accion: editarCol(2) }],
  ['.Editable-Input-Text', { objetivo: 'input', min: 1, accion: editarCol(1) }],
  ['th.ascendent', { objetivo: 'th', min: 1, alias: 'th.ascendent::after', accion: async (c) => { await c.clicTh('t1', 0); await c.clicTh('t1', 0); } }],
  ['th.descendent', { objetivo: 'th', min: 1, alias: 'th.descendent::after', accion: (c) => c.clicTh('t1', 0) }],
  ['div:first-of-type', { objetivo: 'div', min: 1 }],
  ['tr th:nth-child(9)', { objetivo: 'th', igual: ['th'], campo: 'ok' }],
  ['tr th:nth-child(10)', { objetivo: 'th', igual: ['th'], campo: 'origen' }],
  ["tr td[data-cell='Importe']", { objetivo: 'td', min: 2, alias: "tr td[data-cell='…'] (Importe, Impuestos, Subtotal, Precio, Costo…)" }],
  ['tr td[data-cell="Caducidad"]', { objetivo: 'td', min: 2 }],
  ["tr:not(.EdiTable-Row-Selected) td[data-cell='Código']", { objetivo: 'td', igual: ['td.EdiTable-Cell'], accion: (c) => c.foco('t1', 0, 1) }],
  ['#t1', { objetivo: 'table', min: 1, alias: '##<table_id>' }],
  ['#t1 tr th', { objetivo: 'th', min: 10, alias: '##<table_id> tr th' }],
  ['div:has(table#t1)', { objetivo: 'div', min: 1, alias: 'div:has(table##<table_id>)' }],
  ['div:has(table)', { objetivo: 'div', min: 1 }],
  ['div:has(> #t1)', { objetivo: 'div', min: 1, alias: 'div:has(> ##<table_id>)' }],
];
for (const [sel, o] of SEL) {
  t('css-' + sel.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, ''), `control-styles con «${o.alias ?? sel}» sigue alcanzando lo mismo`, ['cs:' + (o.alias ?? sel)], async (c) => {
    const r = await conSelector(c, sel, o);
    if (o.igual) c.igual(r.map(x => x.split('.')[0].split('#')[0]), o.igual.map(x => x.split('.')[0]));
    else c.ok(r.length >= o.min, `${sel}: ${r.length} elementos (se esperaban ≥ ${o.min}): ${r.slice(0, 4).join(', ')}`);
    if (o.campo) c.igual(await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('thead th')).filter(th => getComputedStyle(th).getPropertyValue('--censo').trim() === 'si').map(th => th.getAttribute('field'))), [o.campo]);
  });
}
t('css-div-has-overflow', 'div:has(table#id){overflow:revert} pasa el scroll al contenedor de la página (V12)', ['cs:div:has(table##<table_id>)', '_shadow'], async (c) => {
  await c.abrir({ body: '<div id="cont" style="max-height:120px;overflow-y:auto">' + tabla({ a: { 'control-styles': 'div:has(table#t1){overflow:revert !important}' }, cols: COLS10, data: [...FILAS, ...FILAS, ...FILAS, ...FILAS] }) + '</div>' });
  c.igual(await c.ev(() => [getComputedStyle(__ct.sr('t1').querySelector('table').parentElement).overflowY, document.getElementById('cont').scrollHeight > 120]), ['visible', true]);
});
t('css-host-readonly', 'CSS de la página sobre el anfitrión: .disabled-all * edit-table:not([readonly])', ['cs:.disabled-all * edit-table:not([readonly])'], async (c) => {
  await c.abrir({ head: '<style>.disabled-all * edit-table:not([readonly]){outline:3px solid rgb(1, 2, 3)}</style>', body: '<div class="disabled-all"><div>' + tabla({ cols: COLS10, data: FILAS }) + tabla({ id: 't2', a: { readonly: true }, cols: COLS10, data: FILAS }) + '</div></div>' });
  c.igual(await c.ev(() => [getComputedStyle(__ct.t('t1')).outlineColor, getComputedStyle(__ct.t('t2')).outlineColor === 'rgb(1, 2, 3)']), ['rgb(1, 2, 3)', false]);
});
t('data-cell-titulo', 'data-cell = título de la columna en cada td (también tras _printRows)', ["cs:tr td[data-cell='…'] (Importe, Impuestos, Subtotal, Precio, Costo…)"], async (c) => {
  await c.abrir({ body: tabla({ cols: COLS10, data: FILAS }) });
  await c.ev(() => __ct.t('t1')._printRows());
  c.igual(await c.ev(() => Array.from(__ct.filas('t1')[0].cells).map(td => td.getAttribute('data-cell'))), COLS10.map(x => x.title));
});

t('attr-formato', 'atributos de formato de edit-th: format, decs, thousandssep, prefix, sufix', ['decs', 'thousandssep', 'prefix', 'sufix', 'format'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'n', type: 'NoEditable', format: 'true', decs: '3', thousandssep: 'true', prefix: 'MXN ', sufix: ' c/u', title: 'N' }], data: [{ n: 1234.5 }] }) });
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), 'MXN 1,234.500 c/u');
});
t('attr-keyfield', 'keyfield de edit-th: Select guarda la clave en otro campo', ['keyfield'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'u', type: 'Select', keyfield: 'uid', options: '{"H87":"PIEZA","XBX":"CAJA"}', title: 'U' }], data: [{ u: 'PIEZA', uid: 'H87' }] }) });
  await c.foco('t1', 0, 0); await c.tecla('F2');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = 'XBX'; const t = __ct.t('t1'); t.ConfirmEdit(t.CurrentTd()); });
  c.igual(await c.ev(() => [__ct.t('t1').DataArray[0].u, __ct.t('t1').DataArray[0].uid]), ['CAJA', 'XBX']);
});
t('attr-arbol', 'atributos de árbol: show-tree, key, parentkey, can-move-row', ['show-tree', 'key', 'parentkey', 'can-move-row'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent', 'can-move-row': 'false' }, cols: [{ field: 'cuenta', title: 'C' }], data: CUENTAS }) });
  c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.ShowAsTree, t.Key, t.ParentKey, t.CanMoveRow, __ct.filas('t1')[1].getAttribute('parent')]; }), [true, 'sys_pk', 'parent', false, '1']);
});
t('attr-tarjetas-agent', 'atributos de tarjetas que usa agent.induxsoft.net: cards-mode, cards-breakpoint, cards-breakpoint-target, cards-layout, cards-field-gap, cards-gap, cards-hide-empty, badge-tooltip, card, cardslot, cardlabel, badgegroup, html-encode, template-encode',
  ['cards-mode', 'cards-breakpoint', 'cards-breakpoint-target', 'cards-layout', 'cards-field-gap', 'cards-gap', 'cards-hide-empty', 'badge-tooltip', 'card', 'cardslot', 'cardlabel', 'badgegroup', 'html-encode', 'template-encode'], async (c) => {
  await c.abrir({ body: '<div style="width:500px">' + tabla({ a: { 'cards-mode': 'auto', 'cards-breakpoint': '600px', 'cards-breakpoint-target': 'container', 'cards-layout': 'slots', 'cards-field-gap': '6px', 'cards-gap': '4px', 'cards-hide-empty': 'true', 'badge-tooltip': 'custom', 'html-encode': 'true', 'template-encode': 'true' }, cols: [{ field: '_a', type: 'Badges', badgegroup: 'avatar', card: 'true', cardslot: 'avatar', title: '' }, { field: 'n', type: 'NoEditable', card: 'true', cardslot: 'title', title: 'Nombre' }, { field: 'h', type: 'NoEditable', card: 'true', cardslot: 'subtitle', cardlabel: 'Atiende', title: 'Humano' }], data: [{ n: '<b>x</b>', h: 'Ana' }], style: 'width:100%' }) + '</div>' });
  await c.ev(() => { const t = __ct.t('t1'); t.RowBadges = () => [{ group: 'avatar', text: 'AF', tooltip: 'hola' }]; t.RefreshView(); });
  await c.esperar(100);
  const r = await c.ev(() => { const t = __ct.t('t1'); const tb = __ct.sr('t1').querySelector('table'); const tr = __ct.filas('t1')[0]; return [t.IsCardView, tb.classList.contains('et-layout-slots'), tb.style.getPropertyValue('--et-card-field-gap'), tr.cells[2].getAttribute('data-card-label'), !!tr.cells[0].querySelector('.et-badge'), t.BadgeTooltip, __ct.td('t1', 0, 1).querySelector('.cell-content').innerHTML]; });
  c.igual(r, [true, true, '6px', 'Atiende', true, 'custom', '&lt;b&gt;x&lt;/b&gt;']);
});
t('css-host-otros', 'CSS de la página sobre el anfitrión: .disabled-all * edit-table y .fd-edittable edit-table', ['cs:.disabled-all * edit-table', 'cs:.fd-edittable edit-table'], async (c) => {
  await c.abrir({ head: '<style>.disabled-all * edit-table{pointer-events:none} .fd-edittable edit-table{display:block;margin-top:7px}</style>', body: '<div class="disabled-all"><div>' + tabla({ cols: COLS10, data: FILAS }) + '</div></div><div class="fd-edittable">' + tabla({ id: 't2', cols: COLS10, data: FILAS }) + '</div>' });
  c.igual(await c.ev(() => [getComputedStyle(__ct.t('t1')).pointerEvents, getComputedStyle(__ct.t('t2')).marginTop, __ct.t('t1').tagName]), ['none', '7px', 'EDIT-TABLE']);
});

// ---------- miembros y API con uso real ----------
const pag = (a = {}) => ({ body: tabla({ a, cols: COLS10, data: FILAS }) });
const API = [
  ['DataArray', async (c) => { await c.abrir(pag()); c.igual((await c.datos()).length, 2); }],
  ['CurrentRowIndex', async (c) => { await c.abrir(pag()); await c.clic('t1', 1, 0); c.igual(await c.ev(() => __ct.t('t1').CurrentRowIndex()), 1); }],
  ['Events', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); window.n = 0; t.Events[t.EdiTable.Const.Events.EnterCell] = () => window.n++; t.NavTo(0, 0); return window.n; }), 1); }],
  ['EdiTable', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const E = __ct.t('t1').EdiTable; return [typeof E.GetInput, typeof E.GetSelector, E.Const.SelectorId, E.Const.InputId]; }), ['function', 'function', '__table_selector', '__table_input']); }],
  ['Columns', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').Columns.map(x => x.title)), COLS10.map(x => x.title)); }],
  ['_printRows', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.DataArray.push({ codigo: 'P-3' }); t._printRows(); return __ct.filas('t1').length; }), 3); }],
  ['UpdateRow', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.DataArray[0].descripcion = 'Nuevo'; t.UpdateRow(0); return __ct.texto('t1', 0, 1); }), 'Nuevo'); }],
  ['AddRow', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { __ct.t('t1').AddRow(); return __ct.filas('t1').length; }), 3); }],
  ['RowIndexOfTd', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').RowIndexOfTd(__ct.td('t1', 1, 3))), 1); }],
  ['DeleteCurrentRow', async (c) => { await c.abrir(pag()); await c.foco('t1', 0, 0); c.igual(await c.ev(() => { __ct.t('t1').DeleteCurrentRow(); return __ct.t('t1').DataArray.map(x => x.codigo); }), ['P-2']); }],
  ['AutoAddRow', async (c) => { await c.abrir(pag()); await c.ev(() => { __ct.t('t1').AutoAddRow = false; }); await c.foco('t1', 1, 0); await c.tecla('ArrowDown'); c.igual((await c.datos()).length, 2); }],
  ['setInputKey', async (c) => { await c.abrir(pag()); await c.ev(() => { window.q = []; __ct.t('t1').setInputKey('origen', { searchText: (x, a) => window.q.push([x, a]) }); }); await c.foco('t1', 0, 9); await c.tecla('F4'); c.igual(await c.ev(() => window.q), [['', false]]); }],
  ['DeleteRow', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => [__ct.t('t1').DeleteRow(1), __ct.t('t1').DataArray.length]), [true, 1]); }],
  ['AutoDelRow', async (c) => { await c.abrir(pag()); await c.ev(() => { __ct.t('t1').AutoDelRow = false; }); await c.foco('t1', 0, 0); await c.tecla('Control+Delete'); c.igual((await c.datos()).length, 2); }],
  ['NavTo', async (c) => { await c.abrir(pag()); await c.ev(() => __ct.t('t1').NavTo(1, 4)); c.igual(await c.ev(() => [__ct.t('t1').CurrentRowIndex(), __ct.t('t1').CurrentColIndex()]), [1, 4]); }],
  ['GetTrByIndex', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').GetTrByIndex(1) === __ct.filas('t1')[1]), true); }],
  ['EverMove', async (c) => { await c.abrir(pag()); await c.ev(() => { __ct.t('t1').EverMove = false; }); await c.foco('t1', 0, 9); await c.tecla('ArrowRight'); c.igual(await c.ev(() => __ct.t('t1').CurrentRowIndex()), 0); }],
  ['CellFocus', async (c) => { await c.abrir(pag()); await c.ev(() => __ct.t('t1').CellFocus(__ct.td('t1', 1, 2))); c.igual(await c.ev(() => __ct.t('t1').CurrentColIndex()), 2); }],
  ['EnterCell', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); window.n = 0; t.Events.entercell = () => window.n++; t.EnterCell(__ct.td('t1', 0, 0)); return [typeof t.EnterCell, window.n]; }), ['function', 1]); }],
  ['changeColumnTitle', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => [__ct.t('t1').changeColumnTitle('importe', 'Total'), __ct.th('t1', 4).querySelector('span').textContent]), [true, 'Total']); }],
  ['GetColumnDefOfTd', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').GetColumnDefOfTd(__ct.td('t1', 0, 4)).field), 'importe'); }],
  ['hideColumn', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { __ct.t('t1').hideColumn('nota', true); return [__ct.th('t1', 7).classList.contains('hidde-col'), __ct.t('t1').hideColumns]; }), [true, [7]]); }],
  ['onTdPaint', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); window.n = 0; t.onTdPaint = () => window.n++; t._printRows(); return window.n; }), 20); }],
  ['_getTreeOptions', async (c) => { await c.abrir(pag({ 'show-tree': 'true', key: 'k', parentkey: 'p' })); c.igual(await c.ev(() => __ct.t('t1')._getTreeOptions()), { key: 'k', parentkey: 'p', childs: '__items' }); }],
  ['_printTreeData', async (c) => { await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'C' }] }) }); c.igual(await c.ev((d) => { const t = __ct.t('t1'); t.DataArray = d; t._printTreeData(); return __ct.filas('t1').length; }, CUENTAS), 6); }],
  ['CurrentColIndex', async (c) => { await c.abrir(pag()); await c.foco('t1', 0, 6); c.igual(await c.ev(() => __ct.t('t1').CurrentColIndex()), 6); }],
  ['hiddeSelector', async (c) => { await c.abrir(pag()); await c.ev(() => { __ct.t('t1').hiddeSelector = true; }); await c.foco('t1', 0, 0); c.igual(await c.ev(() => __ct.td('t1', 0, 0).querySelector('.EdiTable-Selector').classList.contains('transparent')), true); }],
  ['_format', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1')._format(1234.567, 2, true)), '1,234.57'); }],
  ['UpdateData', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); __ct.td('t1', 0, 1).querySelector('.cell-content').textContent = 'DOM'; t.UpdateData(); return t.DataArray[0].descripcion; }), 'DOM'); }],
  ['ButtonOnClick', async (c) => { await c.abrir(pag()); await c.ev(() => { window.b = null; __ct.t('t1').ButtonOnClick = (r, col, def) => { window.b = [r, col, def.field]; }; }); await c.foco('t1', 1, 9); await c.ev(() => __ct.td('t1', 1, 9).querySelector('.EdiTable-Button').click()); c.igual(await c.ev(() => window.b), [1, 9, 'origen']); }],
  ['ColIndexOfTd', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').ColIndexOfTd(__ct.td('t1', 0, 5))), 5); }],
  ['OnSort', async (c) => { await c.abrir(pag()); await c.ev(() => { window.s = null; __ct.t('t1').Events.onsort = (e) => { window.s = [e.caption, e.coldef.sort]; }; }); await c.clicTh('t1', 1); c.igual(await c.ev(() => window.s), ['Descripción', 'ASC']); }],
  ['IsDirty', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'codigo', 'X'); return t.IsDirty; }), true); }],
  ['_expandOnStart', async (c) => { await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'C' }] }) }); c.igual(await c.ev((d) => { const t = __ct.t('t1'); t.DataArray = d; t._expandOnStart = true; t._printTreeData(); return __ct.filas('t1').filter(tr => tr.classList.contains('hidde-row')).length; }, CUENTAS), 0); }],
  ['getIsDirty', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(1, 'codigo', 'X'); return [t.getIsDirty(0), t.getIsDirty(1)]; }), [false, true]); }],
  ['InsertRow', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { __ct.t('t1').InsertRow(0, true); return __ct.t('t1').DataArray[1].codigo; }), 'P-1'); }],
  ['ReadOnly', async (c) => { await c.abrir(pag()); await c.ev(() => { __ct.t('t1').ReadOnly = true; }); await c.foco('t1', 0, 1); await c.tecla('F2'); c.igual(await c.ev(() => __ct.t('t1').Editing), false); }],
  ['_table', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t._table === __ct.sr('t1').querySelector('table'), t._table.id]; }), [true, 't1']); }],
  ['_shadow', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); return [!!t._shadow, t._shadow.getElementById(t.id).tagName]; }), [true, 'TABLE']); }],
  ['TRCount', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').TRCount()), 2); }],
  ['setIsDirty', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.setIsDirty(0, true); const a = t.IsDirty; t.setIsDirty(0, false); return [a, t.IsDirty]; }), [true, false]); }],
  ['Editing', async (c) => { await c.abrir(pag()); await c.foco('t1', 0, 1); await c.tecla('F2'); c.igual(await c.ev(() => __ct.t('t1').Editing), true); }],
  ['_resolveKey', async (c) => { await c.abrir(pag({ 'show-tree': 'true', key: 'k', parentkey: 'p' })); c.igual(await c.ev(() => { const o = {}; __ct.t('t1')._resolveKey(o); return typeof o.k === 'string' && o.k.length > 10; }), true); }],
  ['_moveData', async (c) => { await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'C' }], data: CUENTAS }) }); c.igual(await c.ev(() => { const t = __ct.t('t1'); const s = t.DataArray.find(x => x.sys_pk === 5), d = t.DataArray.find(x => x.sys_pk === 1); return [t._moveData(s, d, true), t.DataArray.find(x => x.sys_pk === 5).parent]; }), [true, 1]); }],
  ['GetTree', async (c) => { await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'C' }], data: CUENTAS }) }); c.igual(await c.ev(() => { const t = __ct.t('t1'); const a = t.GetTree(); const r = a.length; t.SetTree(a); return [r, t.DataArray.length]; }), [2, 6]); }],
  ['SetTree', async (c) => { await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'C' }], data: CUENTAS }) }); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.SetTree(t.GetTree()); return t.DataArray.map(x => x.cuenta); }), ['100', '110', '111', '112', '200', '210']); }],
  ['CurrentTd', async (c) => { await c.abrir(pag()); await c.foco('t1', 1, 1); c.igual(await c.ev(() => __ct.t('t1').CurrentTd() === __ct.td('t1', 1, 1)), true); }],
  ['GetTBody', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').GetTBody().rows.length), 2); }],
  ['ExpandRow', async (c) => { await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'C' }], data: CUENTAS }) }); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.ExpandRow(__ct.filas('t1')[0]); return !__ct.filas('t1')[1].classList.contains('hidde-row'); }), true); }],
  ['ShowAsTree', async (c) => { await c.abrir(pag({ 'show-tree': 'true', key: 'k', parentkey: 'p' })); c.igual(await c.ev(() => __ct.t('t1').ShowAsTree), true); }],
  ['LeaveCell', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); window.n = 0; t.Events.leavecell = () => window.n++; t.LeaveCell(__ct.td('t1', 0, 0)); return window.n; }), 1); }],
  ['_getRowIndex', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1')._getRowIndex(__ct.filas('t1')[1])), 1); }],
  ['restoreRow', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'codigo', 'X'); t.restoreRow(0); return t.DataArray[0].codigo; }), 'P-1'); }],
  ['StartEdit', async (c) => { await c.abrir(pag()); await c.foco('t1', 0, 1); await c.ev(() => { const t = __ct.t('t1'); t.StartEdit(t.CurrentTd(), ''); }); c.igual(await c.ev(() => !!__ct.sr('t1').querySelector('#__table_input')), true); }],
  ['GetColumnDef', async (c) => { await c.abrir(pag()); await c.foco('t1', 0, 8); c.igual(await c.ev(() => { const d = __ct.t('t1').GetColumnDef(); return [d.field, typeof d.Converts]; }), ['ok', 'object']); }],
  ['_getCurrentRow', async (c) => { await c.abrir(pag()); await c.foco('t1', 1, 0); c.igual(await c.ev(() => __ct.t('t1')._getCurrentRow() === __ct.filas('t1')[1]), true); }],
  ['_count_isdirty', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); t.UpdateDataMember(0, 'codigo', 'X'); return t._count_isdirty; }), 1); }],
  ['RowIndent', async (c) => { await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'C' }], data: CUENTAS }) }); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.RowIndent(__ct.filas('t1')[4]); return t.DataArray.find(x => x.sys_pk === 5).parent; }), 1); }],
  ['TreeArray', async (c) => { await c.abrir(pag()); c.igual(await c.ev((d) => __ct.t('t1').TreeArray(d, { key: 'sys_pk', parentkey: 'parent', childs: '__items' }).length, CUENTAS), 2); }],
  ['_refreshTable', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.DataArray[1].descripcion = 'R'; t._refreshTable(); return __ct.texto('t1', 1, 1); }), 'R'); }],
  ['applyTemplate', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').applyTemplate('<b>${DataRow.a}</b>', { a: 1 })), '<b>1</b>'); }],
  ['TrOfTd', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').TrOfTd(__ct.td('t1', 1, 1)) === __ct.filas('t1')[1]), true); }],
  ['_fireBlur', async (c) => { await c.abrir(pag()); await c.foco('t1', 0, 0); c.igual(await c.ev(() => __ct.t('t1')._fireBlur), false); }],
  ['UpdateDataMember', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').UpdateDataMember(0, 'codigo', 'Z').codigo), 'Z'); }],
  ['_dataArrayBackup', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.backup(); return t._dataArrayBackup.length; }), 2); }],
  ['RowBadges', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.RowBadges = () => [{ text: '!' }]; t.RefreshView(); return __ct.sr('t1').querySelectorAll('.et-badge').length; }), 2); }],
  ['RefreshBadges', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const t = __ct.t('t1'); t.RowBadges = () => [{ text: '!' }]; t.RefreshBadges(); return __ct.sr('t1').querySelectorAll('.et-badge').length; }), 2); }],
  ['Const.Columns.Types', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => __ct.t('t1').EdiTable.Const.Columns.Types.NoEditable), 'NoEditable'); }],
  ['addEventListener(fieldupdated, rowchanged)', async (c) => { await c.abrir(pag()); await c.ev(() => { const t = __ct.t('t1'); window.e = []; t.addEventListener('fieldupdated', () => window.e.push('f')); t.addEventListener('rowchanged', () => window.e.push('r')); t.UpdateDataMember(0, 'codigo', 'Q'); }); await c.foco('t1', 1, 0); c.igual(await c.ev(() => window.e), ['f', 'r']); }],
  ['readonly (atributo)', async (c) => { await c.abrir(pag({ readonly: true })); c.igual(await c.ev(() => __ct.t('t1').ReadOnly), true); }],
  ['atributos HTML del host (id, style, class)', async (c) => { await c.abrir({ body: tabla({ a: { class: 'mi-tabla' }, cols: COLS10, data: FILAS, style: 'width:600px' }) }); c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.id, t.style.width, t.classList.contains('mi-tabla'), t.getAttribute('class')]; }), ['t1', '600px', true, 'mi-tabla']); }],
  ['atributos libres de edit-th (title, align, href, min-width, allow, style)', async (c) => { await c.abrir({ body: tabla({ cols: [{ field: 'a', title: 'A', align: 'end', href: '#x', 'min-width': '90px', allow: 'x', style: 'color:red' }], data: [{ a: 1 }] }) }); c.igual(await c.ev(() => { const d = __ct.t('t1').Columns[0]; return [d.align, d.href, d['min-width'], d.allow, d.style]; }), ['end', '#x', '90px', 'x', 'color:red']); }],
  ['sortable (atributo que no existe: se ignora)', async (c) => { await c.abrir(pag({ sortable: 'false' })); await c.clicTh('t1', 0); c.igual(await c.ev(() => __ct.t('t1').DataArray[0].codigo), 'P-1'); }],
  ['auto-confirm / row-height / cards-responsive / editable-responsive', async (c) => { await c.abrir(pag({ 'auto-confirm': 'true', 'row-height': '2rem', 'cards-responsive': 'true', 'editable-responsive': 'true' })); c.igual(await c.ev(() => { const t = __ct.t('t1'); return [t.autoConfirm, t.rowHeight, t.cardsResponsive, t.editableResponsive]; }), [true, '2rem', true, true]); }],
  ['tr.cells / td.style / tr.onclick (acceso DOM en el consumidor)', async (c) => { await c.abrir(pag()); c.igual(await c.ev(() => { const tr = __ct.t('t1').GetTrByIndex(0); tr.cells[1].style.color = 'red'; window.k = 0; tr.onclick = () => window.k++; tr.cells[1].click(); return [tr.cells.length, tr.cells[1].style.color, window.k]; }), [10, 'red', 0], 'hoy el clic en la celda no llega a tr.onclick: td.onclick hace stopPropagation'); }],
];
for (const [miembro, fn] of API) t('api-' + miembro.replace(/[^a-zA-Z0-9_]+/g, '-').replace(/^-|-$/g, ''), `${miembro} sigue funcionando`, [miembro.split(' ')[0]], fn);

export default { nombre: 'actual-censo-consumidores', grupo: 'actual', pruebas: P };
