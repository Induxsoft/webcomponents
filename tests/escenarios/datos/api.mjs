// API pública de datos y filas (contrato §2.5). Cada paso llama métodos y guarda lo que devuelven en «extra».
import { pagina, tabla, filas, COLS_BASE } from '../../lib/pagina.mjs';

const DATOS = filas(5);
const html = (script, extra = {}) => pagina({ body: tabla({ data: DATOS, cols: COLS_BASE, ...extra }), script: (script ?? '') + '\nwindow.__r = {}; window.__etExtra = () => window.__r;' });
// Ejecuta y guarda el resultado en window.__r[clave]
const r = (clave, fn) => (h) => h.js(([k, src]) => { let v; try { v = (new Function('t', 'return (' + src + ')(t)'))(ET('t1')); } catch (e) { v = '!excepción: ' + e.message; } window.__r[k] = window.__etSer(v); }, [clave, fn.toString()]);

export default [
  {
    id: 'addrow-insertrow',
    titulo: 'AddRow, InsertRow(rw) e InsertRow(rw, nofocus)',
    origen: 'editable.js:1500-1568',
    html: html(),
    pasos: [
      ['AddRow', r('AddRow', t => t.AddRow())],
      ['InsertRow(1)', r('InsertRow1', t => t.InsertRow(1))],
      ['InsertRow(0, true)', r('InsertRow0nofocus', t => t.InsertRow(0, true))],
      ['InsertRow(99) fuera de rango', r('InsertRow99', t => t.InsertRow(99))],
      ['clic en una fila insertada', h => h.clicCelda('t1', 0, 1)],
    ],
  },
  {
    id: 'deleterow',
    titulo: 'DeleteRow, DeleteCurrentRow y fuera de rango',
    origen: 'editable.js:1334-1373',
    html: html(),
    pasos: [
      ['DeleteRow(1)', r('DeleteRow1', t => t.DeleteRow(1))],
      ['DeleteRow(-1) y (99)', r('fuera', t => [t.DeleteRow(-1), t.DeleteRow(99)])],
      ['DeleteCurrentRow sin selección', r('sinSel', t => t.DeleteCurrentRow())],
      ['clic y DeleteCurrentRow', async h => { await h.clicCelda('t1', 2, 2); await r('conSel', t => t.DeleteCurrentRow())(h); }],
      ['borrar con backup', async h => { await r('b', t => { t.backup(); t.DeleteRow(0); return t._dataArrayBackup.length; })(h); }],
    ],
  },
  {
    id: 'updaterow',
    titulo: 'UpdateRow: DataArray -> DOM (con plantilla y decoración, sin onTdPaint)',
    origen: 'editable.js:1379-1411',
    html: pagina({
      body: tabla({ data: DATOS, cols: [...COLS_BASE, { field: 'tpl', title: 'Plantilla', type: 'NoEditable', template: '<b>${DataRow.nombre}</b> ${DataRow.cantidad * 2}' }] }),
      script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.onTdPaint = (td, i, c, f) => { td.setAttribute('data-pintado', i + ':' + c); }; t.onRowPaint = (tr, i) => tr.setAttribute('data-fila', i); });
window.__r = {}; window.__etExtra = () => window.__r;`,
    }),
    pasos: [
      ['cambiar DataArray[2] y UpdateRow(2)', r('UpdateRow', t => { t.DataArray[2].nombre = 'Actualizado'; t.DataArray[2].cantidad = 50; return t.UpdateRow(2); })],
      ['UpdateRow fuera de rango', r('fuera', t => [t.UpdateRow(-1), t.UpdateRow(77)])],
      ['UpdateRow con fila sin datos', r('vacia', t => { t.AddRow(); return t.UpdateRow(t.TRCount() - 1); })],
      ['UpdateRow con la celda seleccionada', async h => { await h.clicCelda('t1', 0, 1); await r('sel', t => { t.DataArray[0].nombre = 'Con selector'; return t.UpdateRow(0); })(h); }],
    ],
  },
  {
    id: 'updatedata',
    titulo: 'UpdateData / UpdateDataRow: DOM -> DataArray (texto, formato quitado, celda seleccionada)',
    origen: 'editable.js:1415-1457, 2214-2231',
    html: html(),
    pasos: [
      ['UpdateData sin selección', r('UpdateData', t => t.UpdateData())],
      ['clic y UpdateDataRow(1)', async h => { await h.clicCelda('t1', 1, 3); await r('UpdateDataRow', t => t.UpdateDataRow(1))(h); }],
      ['editar (abierto) y UpdateData', async h => { await h.tecla('Enter'); await h.escribir('5'); await r('editando', t => t.UpdateData())(h); }],
      ['UpdateDataRow fuera de rango', r('fuera', t => t.UpdateDataRow(50))],
    ],
  },
  {
    id: 'updatedatamember',
    titulo: 'UpdateDataMember: crea la fila si no existe; devuelve la fila; field/value undefined',
    origen: 'editable.js:1473-1496',
    html: html(),
    pasos: [
      ['UpdateDataMember(0, nombre)', r('a', t => t.UpdateDataMember(0, 'nombre', 'Nuevo'))],
      ['UpdateDataMember(8, …) crea DataArray[8]', r('b', t => { const x = t.UpdateDataMember(8, 'nombre', 'Lejos'); return { x, len: t.DataArray.length, hueco: (6 in t.DataArray) }; })],
      ['sin value', r('c', t => t.UpdateDataMember(0, 'nombre'))],
    ],
  },
  {
    id: 'indices',
    titulo: 'RowIndexOfTd, TrOfTd, ColIndexOfTd, CurrentRowIndex, CurrentColIndex, CurrentTd, GetTrByIndex',
    origen: 'editable.js:1320-1330, 1621-1713',
    html: html(),
    pasos: [
      ['sin selección', r('sinSel', t => ({ fila: t.CurrentRowIndex(), col: t.CurrentColIndex(), td: t.CurrentTd(), nulos: [t.RowIndexOfTd(null), t.RowIndexOfTd(undefined), t.ColIndexOfTd(null), t.TrOfTd(null)] }))],
      ['clic (3,2)', h => h.clicCelda('t1', 3, 2)],
      ['con selección', r('conSel', t => { const td = t.CurrentTd(); return { fila: t.CurrentRowIndex(), col: t.CurrentColIndex(), filaTd: t.RowIndexOfTd(td), colTd: t.ColIndexOfTd(td), tr: t.TrOfTd(td), tr2: t.GetTrByIndex(2), fuera: [t.GetTrByIndex(-1), t.GetTrByIndex(5)] }; })],
      ['RowIndexOfTd con el div interno', r('div', t => t.RowIndexOfTd(t.GetTrByIndex(1).cells[1].querySelector('div')))],
    ],
  },
  {
    id: 'conteos',
    titulo: 'TRCount, THCount, TDCount, ColumnsCount, GetTHead, GetTBody',
    html: html(),
    pasos: [['conteos', r('conteos', t => ({ tr: t.TRCount(), th: t.THCount(), td: t.TDCount(t.GetTrByIndex(0)), tdNull: t.TDCount(null), cols: t.ColumnsCount(), thead: t.GetTHead(), tbody: t.GetTBody() }))]],
  },
  {
    id: 'navto',
    titulo: 'NavTo, NavToHome, NavToFirstCell, NavToLastCell y fuera de rango',
    origen: 'editable.js:1273-1315',
    html: html(),
    pasos: [
      ['NavTo(2,3)', r('a', t => t.NavTo(2, 3))],
      ['NavTo fuera de rango', r('b', t => [t.NavTo(9, 0), t.NavTo(0, 9), t.NavTo(-1, 0)])],
      ['NavToLastCell(4)', r('c', t => t.NavToLastCell(4))],
      ['NavToFirstCell(1)', r('d', t => t.NavToFirstCell(1))],
      ['NavToHome', r('e', t => t.NavToHome())],
    ],
  },
  {
    id: 'cellfocus',
    titulo: 'CellFocus por API (td, div interno, undefined)',
    origen: 'editable.js:2016-2121',
    html: html(),
    pasos: [
      ['CellFocus(td)', r('a', t => t.CellFocus(t.GetTrByIndex(1).cells[2]))],
      ['CellFocus(div.cell-content)', r('b', t => t.CellFocus(t.GetTrByIndex(3).cells[1].querySelector('.cell-content')))],
      ['CellFocus(undefined)', r('c', t => t.CellFocus(undefined))],
    ],
  },
  {
    id: 'getcolumndef',
    titulo: 'GetColumnDef muta Columns[i] (type por omisión y Converts en Check); GetColumnDefOfTd',
    origen: 'editable.js:1751-1778',
    html: pagina({ body: tabla({ data: [{ a: 1, b: 'Sí' }], cols: [{ field: 'a', title: 'A' }, { field: 'b', title: 'B', type: 'Check' }] }), script: 'window.__r = {}; window.__etExtra = () => window.__r;' }),
    pasos: [
      ['sin selección', r('sinSel', t => t.GetColumnDef())],
      ['clic en A y GetColumnDef', async h => { await h.clicCelda('t1', 0, 0); await r('a', t => t.GetColumnDef())(h); }],
      ['clic en B (Check) y GetColumnDef', async h => { await h.clicCelda('t1', 0, 1); await r('b', t => ({ def: t.GetColumnDef(), ofTd: t.GetColumnDefOfTd(t.CurrentTd()), nulo: t.GetColumnDefOfTd(null) }))(h); }],
    ],
  },
  {
    id: 'gettdvalue-settdvalue',
    titulo: 'GetTdValue / SetTdValue (formato, html-encode, crea .cell-content)',
    origen: 'editable.js:2214-2265',
    html: html(null, { attrs: { 'html-encode': 'true' } }),
    pasos: [
      ['GetTdValue de cada celda', r('get', t => Array.from(t.GetTrByIndex(0).cells).map(td => [t.GetTdValue(td), t.GetTdValue(td, true)]))],
      ['SetTdValue con formato y con encode', r('set', t => { const c = t.GetTrByIndex(0).cells; t.SetTdValue(c[3], '4321.987'); t.SetTdValue(c[1], '<b>x</b>', true); t.SetTdValue(c[2], '<b>y</b>'); return [c[1].innerHTML, c[2].innerHTML, c[3].innerHTML]; })],
      ['SetTdValue en td sin .cell-content', r('crea', t => { const c = t.GetTrByIndex(1).cells[1]; c.innerHTML = ''; t.SetTdValue(c, 'nuevo'); return c.innerHTML; })],
    ],
  },
  {
    id: 'plantillas',
    titulo: 'template con DataRow y this; template-encode; error en plantilla',
    origen: 'editable.js:2232-2237, 1395-1401',
    html: pagina({
      body: tabla({
        attrs: { 'template-encode': 'true' },
        data: [{ id: 1, n: '<i>x</i>' }, { id: 2, n: 'b' }],
        cols: [{ field: 'id', title: 'Id', type: 'NoEditable' }, { field: 'n', title: 'N', type: 'NoEditable' },
          { field: 't1', title: 'T1', type: 'NoEditable', template: '<span class="t">${DataRow.n}</span>' },
          { field: 't2', title: 'T2', type: 'NoEditable', template: '${this.tableId}-${DataRow.id}' }],
      }),
      script: 'window.__r = {}; window.__etExtra = () => window.__r;',
    }),
    pasos: [
      ['UpdateRow', r('a', t => t.UpdateRow(0))],
      ['plantilla con error en UpdateRow', r('b', t => { t.Columns[2].template = '${DataRow.noexiste.x}'; return t.UpdateRow(1); })],
      ['applyTemplate directo', r('c', t => t.applyTemplate('${DataRow.a}+${DataRow.b}', { a: 1, b: '<b>' }))],
    ],
  },
  {
    id: 'backup-restore',
    titulo: 'backup, restore, restoreRow, IsDirty, getIsDirty, setIsDirty',
    origen: 'editable.js:2741-2803',
    html: html(),
    pasos: [
      ['getIsDirty sin respaldo (excepción)', r('sinRespaldo', t => t.getIsDirty(0))],
      ['backup', r('backup', t => { t.backup(); return t.IsDirty; })],
      ['editar fila 1 por teclado', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('Sucio'); await h.tecla('Enter'); }],
      ['estado', r('estado', t => ({ dirty: t.IsDirty, f0: t.getIsDirty(0), f1: t.getIsDirty(1), cuenta: t._count_isdirty }))],
      ['restoreRow(1)', r('restoreRow', t => { t.restoreRow(1); return { dirty: t.IsDirty, f1: t.getIsDirty(1) }; })],
      ['editar fila 2 y restore()', async h => { await h.js(() => ET('t1').UpdateDataMember(2, 'cantidad', '999')); await r('restore', t => { t.restore(); return { dirty: t.IsDirty, cuenta: t._count_isdirty, datos: t.DataArray[2] }; })(h); }],
      ['setIsDirty manual', r('set', t => { t.setIsDirty(3, true); t.setIsDirty(3, true); return { dirty: t.IsDirty, cuenta: t._count_isdirty }; })],
      ['agregar fila después del backup', r('add', t => { t.AddRow(); t.UpdateDataMember(5, 'nombre', 'nueva'); return { len: t._dataArrayBackup.length, f5: t.getIsDirty(5), cuenta: t._count_isdirty }; })],
    ],
  },
  {
    id: 'sort-api',
    titulo: 'Sort(DataArray, campo, desc) por API: ordena en su lugar; OnSort antes de ordenar',
    origen: 'editable.js:2655-2678, 2804-2822',
    html: pagina({ body: tabla({ data: [{ id: 3, n: 'b', v: 10 }, { id: 1, n: 'A', v: 9 }, { id: 2, n: 'c', v: '10' }, { id: 4, n: null, v: 2 }], cols: [{ field: 'id', title: 'Id' }, { field: 'n', title: 'N' }, { field: 'v', title: 'V' }] }), script: 'window.__r = {}; window.__etExtra = () => window.__r;' }),
    pasos: [
      ['Sort por n asc', r('a', t => { t.Sort(t.DataArray, 'n'); t._printRows(); return t.DataArray.map(d => d.id); })],
      ['Sort por v desc (mezcla número y texto)', r('b', t => { t.Sort(t.DataArray, 'v', true); t._printRows(); return t.DataArray.map(d => d.id); })],
      ['Sort por id asc (números)', r('c', t => { t.Sort(t.DataArray, 'id'); t._printRows(); return t.DataArray.map(d => d.id); })],
      ['Sort de arreglo vacío', r('d', t => t.Sort([], 'id'))],
    ],
  },
  {
    id: 'hidecolumn',
    titulo: 'hideColumn / hideColumns: se vuelve a aplicar en _printRows e InsertRow (por cellIndex)',
    origen: 'editable.js:3885-3901, 2411, 1550',
    html: html(),
    pasos: [
      ['hideColumn(cantidad)', r('a', t => ({ r: t.hideColumn('cantidad'), hc: t.hideColumns }))],
      ['hideColumn inexistente', r('b', t => t.hideColumn('noexiste'))],
      ['_printRows', r('c', t => t._printRows())],
      ['AddRow', r('d', t => t.AddRow())],
      ['mostrar otra vez', r('e', t => ({ r: t.hideColumn('cantidad', false), hc: t.hideColumns }))],
      ['ocultar dos', r('f', t => { t.hideColumn('id'); t.hideColumn('precio'); return t.hideColumns; })],
    ],
  },
  {
    id: 'changecolumntitle',
    titulo: 'changeColumnTitle no actualiza Columns[i].title',
    etiquetas: ['defecto-conocido'],
    origen: 'editable.js:2823-2830',
    html: html(),
    pasos: [['changeColumnTitle', r('a', t => [t.changeColumnTitle('nombre', 'Descripción'), t.changeColumnTitle('noexiste', 'x'), t.Columns[1].title])]],
  },
  {
    id: 'htmlencode-api',
    titulo: 'setHtmlEncode / getHtmlDecode / replaceSymbols',
    html: html(),
    pasos: [['codificar y decodificar', r('a', t => ({ enc: t.setHtmlEncode(`<a href="x">'y'</a> & z`), dec: t.getHtmlDecode('&lt;b&gt;&quot;&apos;&amp;'), num: t.setHtmlEncode(5) }))]],
  },
  {
    id: 'css-personalizado',
    titulo: 'CSS.Cell y CSS.RowSelected cambiados por el consumidor',
    origen: 'editable.js:1215-1218, 1532, 2104-2109',
    html: html(`document.addEventListener('DOMContentLoaded', () => { ET('t1').CSS = { Cell: 'MiCelda', RowSelected: 'MiFila' }; });`),
    pasos: [['clic', h => h.clicCelda('t1', 1, 1)], ['AddRow', h => h.js(() => ET('t1').AddRow())], ['_printRows', h => h.js(() => ET('t1')._printRows())]],
  },
  {
    id: 'const-html-personalizado',
    titulo: 'Const.HTML.Selector e Inputs.Text reemplazados (conservan los ids __table_*)',
    origen: 'editable.js:820-831 (contrato §2.9)',
    html: html(`document.addEventListener('DOMContentLoaded', () => { const H = ET('t1').EdiTable.Const.HTML; H.Selector = '<div id="__table_selector" class="EdiTable-Selector mi-selector" tabindex="0"></div>'; H.Inputs.Text = '<input type="text" id="__table_input" class="Editable-Input-Text mi-input" autocomplete="off"/>'; });`),
    pasos: [['clic, Enter y confirmar', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.escribir('z'); await h.tecla('Enter'); }]],
  },
  {
    id: 'converts-personalizado',
    titulo: 'EdiTable.Converts.Boolean reemplazado (Check con Verdadero/Falso)',
    html: pagina({ body: tabla({ data: [{ c: 'Verdadero' }, { c: 'Falso' }], cols: [{ field: 'c', title: 'C', type: 'Check' }] }), script: `document.addEventListener('DOMContentLoaded', () => { ET('t1').EdiTable.Converts.Boolean = { ToString: v => (v ? 'Verdadero' : 'Falso'), FromString: s => s === 'Verdadero' }; });` }),
    pasos: [['editar, espacio y Enter', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('Enter'); await h.tecla('Space'); await h.tecla('Enter'); }]],
  },
  {
    id: 'leave-enter-initialize',
    titulo: 'LeaveCell/EnterCell llamados directo e Initialize(tableId)',
    html: html(),
    pasos: [['llamadas', r('a', t => { t.LeaveCell(t.GetTrByIndex(0).cells[0]); t.EnterCell(t.GetTrByIndex(1).cells[1]); t.Initialize(t.tableId); return t.tableId; })], ['clic tras Initialize', h => h.clicCelda('t1', 2, 1)]],
  },
  {
    id: 'ensure-selection-visible',
    titulo: 'EnsureSelectionVisible y keep-selection-visible al cambiar el ancho',
    origen: 'editable.js:3199-3347',
    viewport: { width: 900, height: 500 },
    html: pagina({ body: `<div id="caja" style="height:200px;overflow:auto;border:1px solid #ccc">${tabla({ data: filas(40), cols: COLS_BASE })}</div>`, script: `window.__r = {}; window.__etExtra = () => ({ r: window.__r, scroll: document.getElementById('caja').scrollTop });` }),
    pasos: [
      ['clic en fila 3', h => h.clicCelda('t1', 3, 1)],
      ['desplazar la caja hasta abajo', h => h.js(() => { document.getElementById('caja').scrollTop = 10000; })],
      ['EnsureSelectionVisible()', r('a', t => t.EnsureSelectionVisible())],
      ['desplazar y cambiar el ancho del viewport', async h => { await h.js(() => { document.getElementById('caja').scrollTop = 10000; }); await h.viewport(700, 500); }],
    ],
  },
  {
    id: 'refresh',
    registro: 'consumer',
    titulo: 'RefreshView, RefreshDecorations y RefreshBadges después de cambiar propiedades',
    origen: 'editable.js:3191-3197, 3359-3362, 3618-3621',
    html: html(),
    pasos: [
      ['RowClass y RefreshDecorations', r('a', t => { t.RowClass = (row, i) => (i % 2 ? 'impar' : ''); t.RefreshDecorations(); })],
      ['RowBadges y RefreshBadges', r('b', t => { t.RowBadges = (row) => ({ text: String(row.cantidad) }); t.RefreshBadges(); })],
      ['CardsMode always y RefreshView', r('c', t => { t.CardsMode = 'always'; t.RefreshView(); return t.IsCardView; })],
    ],
  },
  {
    id: 'tree-array-api',
    titulo: 'TreeArray/TableArray/GetTree/SetTree por API (TreeArray muta el arreglo)',
    origen: 'editable.js:2471-2549',
    html: html(),
    pasos: [
      ['TreeArray de una lista', r('a', t => { const l = [{ id: 1 }, { id: 2, idp: 1 }, { id: 3, idp: 2 }, { id: 4 }]; const tr = t.TreeArray(l); return { tr, mismo: tr === l }; })],
      ['TableArray con y sin treeInfo', r('b', t => { const tr = [{ id: 1, __items: [{ id: 2, __items: [{ id: 3 }] }] }, { id: 4 }]; const a = t.TableArray(JSON.parse(JSON.stringify(tr))); const b = t.TableArray(JSON.parse(JSON.stringify(tr)), null, false); return { a, b }; })],
      ['RowIndentation', r('c', t => t.RowIndentation(t.GetTrByIndex(0)))],
    ],
  },
];
