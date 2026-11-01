// Vista en árbol (show-tree, editable.js:2308-2709) y movimiento de filas (CanMoveRow, 523-728).
import { pagina, tabla, ARBOL } from '../../lib/pagina.mjs';

const COLS = [{ field: 'nombre', title: 'Nombre', type: 'Text' }, { field: 'valor', title: 'Valor', type: 'Number' }, { field: 'id', title: 'Id', type: 'NoEditable' }];
const arbol = ({ attrs = {}, data = ARBOL, script = '', cols = COLS } = {}) => pagina({ body: tabla({ data, cols, attrs: { 'show-tree': 'true', ...attrs } }), script: script + '\nwindow.__r = {}; window.__etExtra = () => window.__r;' });
const r = (clave, fn) => (h) => h.js(([k, src]) => { let v; try { v = (new Function('t', 'return (' + src + ')(t)'))(ET('t1')); } catch (e) { v = '!excepción: ' + e.message; } window.__r[k] = window.__etSer(v); }, [clave, fn.toString()]);
const boton = (fila) => (h) => h.clicShadow('t1', `tbody tr:nth-child(${fila + 1}) .collapse-btn`);

export default [
  {
    id: 'basico-colapsado',
    titulo: 'show-tree="true" con id/idp por omisión: hijos ocultos al iniciar',
    origen: 'editable.js:2318-2334, 2347-2453',
    html: arbol(),
    pasos: [
      ['expandir Raíz A', boton(0)],
      ['expandir Hijo A1', boton(1)],
      ['colapsar Raíz A (colapsa también los nietos)', boton(0)],
      ['expandir Raíz A otra vez (los nietos quedan colapsados)', boton(0)],
    ],
  },
  {
    id: 'expandir-al-iniciar',
    titulo: '_expandOnStart=true antes de _printTreeData (como V12)',
    origen: 'uielements.v12.dkl:168-176',
    html: arbol({ script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t._expandOnStart = true; t._printTreeData(); });` }),
    pasos: [['colapsar Raíz A', boton(0)], ['expandir', boton(0)]],
  },
  {
    id: 'claves-propias',
    titulo: 'key, parentkey y childs-field propios (sys_pk / parent / hijos)',
    html: arbol({ attrs: { key: 'sys_pk', parentkey: 'parent', 'childs-field': 'hijos' }, data: ARBOL.map(x => ({ sys_pk: x.id, parent: x.idp, nombre: x.nombre, valor: x.valor })) }),
    pasos: [['expandir Raíz A', boton(0)], ['GetTree', r('tree', t => t.GetTree())]],
  },
  {
    id: 'datos-anidados',
    titulo: 'data ya anidado (con __items): SetTree lo aplana',
    html: arbol({ data: [{ id: 1, nombre: 'P', valor: 1, __items: [{ id: 2, idp: 1, nombre: 'H', valor: 2, __items: [{ id: 3, idp: 2, nombre: 'N', valor: 3 }] }] }, { id: 4, nombre: 'Q', valor: 4 }] }),
    pasos: [['expandir P y H', async h => { await boton(0)(h); await boton(1)(h); }]],
  },
  {
    id: 'navegacion',
    titulo: 'Navegación con flechas salta filas ocultas; CurrentRowIndex cuenta las ocultas',
    origen: 'editable.js:2126-2203 (tr:not(.hidde-row))',
    html: arbol(),
    pasos: [
      ['clic en Raíz A', h => h.clicCelda('t1', 0, 0)],
      ['flecha abajo (va a Raíz B, fila 4)', h => h.tecla('ArrowDown')],
      ['flecha abajo', h => h.tecla('ArrowDown')],
      ['flecha arriba x2', h => h.tecla('ArrowUp', 2)],
      ['expandir y bajar', async h => { await boton(0)(h); await h.clicCelda('t1', 0, 0); await h.tecla('ArrowDown'); }],
      ['PageDown (cuenta todas las filas)', h => h.tecla('PageDown')],
    ],
  },
  {
    id: 'editar-en-arbol',
    titulo: 'Editar en árbol: UpdateDataMember con el índice del tr (DataArray en orden de árbol)',
    html: arbol({ attrs: { 'can-move-row': 'false' } }),
    pasos: [
      ['expandir Raíz A y editar Hijo A2', async h => { await boton(0)(h); await h.clicCelda('t1', 3, 0); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('A2 editado'); await h.tecla('Enter'); }],
      ['editar valor de Raíz B', async h => { await h.clicCelda('t1', 4, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('33'); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'ordenar-en-arbol',
    titulo: 'Clic en encabezado en árbol: SortTree por nivel y _printRows (conserva expandidas)',
    origen: 'editable.js:507-513, 2679-2709, 2358-2364',
    html: arbol(),
    pasos: [
      ['expandir Raíz A', boton(0)],
      ['ordenar por Valor', h => h.clicEncabezado('t1', 1)],
      ['ordenar por Valor (otra vez)', h => h.clicEncabezado('t1', 1)],
      ['ordenar por Nombre', h => h.clicEncabezado('t1', 0)],
    ],
  },
  {
    id: 'mover-fila',
    titulo: 'CanMoveRow (por omisión con show-tree): arrastrar como hermano y como hijo',
    origen: 'editable.js:523-728',
    html: arbol({ script: `document.addEventListener('DOMContentLoaded', () => { ET('t1')._expandOnStart = true; ET('t1')._printTreeData(); });` }),
    pasos: [
      ['Raíz C sobre Raíz A (hermano)', h => h.arrastrarFila('t1', 6, 0, false)],
      ['Raíz B como hijo de Hijo A1', async h => { const i = await h.leer(() => ET('t1').DataArray.findIndex(d => d.id === 5)); const j = await h.leer(() => ET('t1').DataArray.findIndex(d => d.id === 2)); await h.arrastrarFila('t1', i, j, true); }],
      ['un padre sobre su propio hijo (no se permite)', async h => { await h.arrastrarFila('t1', 0, 1, true); }],
      ['GetTree', r('tree', t => t.GetTree())],
    ],
  },
  {
    id: 'mover-cancelado',
    titulo: 'BeforeMoveRow con cancel',
    registro: 'consumer',
    html: arbol({ script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t._expandOnStart = true; t._printTreeData(); t.Events[t.EdiTable.Const.Events.BeforeMoveRow] = (e) => { e.cancel = true; }; t.Events[t.EdiTable.Const.Events.RowMoved] = () => {}; });` }),
    pasos: [['arrastrar Raíz C sobre Raíz A', h => h.arrastrarFila('t1', 6, 0, false)]],
  },
  {
    id: 'mover-con-backup',
    titulo: 'Mover con backup: _moveData reconstruye el respaldo conservando isDirty por clave',
    origen: 'editable.js:610-618',
    html: arbol({ script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t._expandOnStart = true; t._printTreeData(); t.backup(); t.UpdateDataMember(1, 'nombre', 'sucio'); });` }),
    pasos: [['mover Raíz C sobre Raíz A', h => h.arrastrarFila('t1', 6, 0, false)]],
  },
  {
    id: 'rowindent',
    titulo: 'RowIndent (sangrar/quitar sangría, como _treeTest) y RowIndentation',
    origen: 'editable.js:2550-2600; examples/_treeTest.html (addIdent)',
    html: arbol({ script: `document.addEventListener('DOMContentLoaded', () => { ET('t1')._expandOnStart = true; ET('t1')._printTreeData(); });` }),
    pasos: [
      ['sangrar Raíz B (bajo Raíz A)', r('a', t => { t.RowIndent(t.GetTrByIndex(4), true); return t.DataArray.map(d => d.id + ':' + (d.idp ?? '')); })],
      ['quitar sangría a Nieto A1a', r('b', t => { const i = t.DataArray.findIndex(d => d.id === 4); t.RowIndent(t.GetTrByIndex(i), false); return t.DataArray.map(d => d.id + ':' + (d.idp ?? '')); })],
      ['sangrar la primera (sin hermano superior)', r('c', t => { t.RowIndent(t.GetTrByIndex(0), true); return t.RowIndentation(t.GetTrByIndex(0)); })],
    ],
  },
  {
    id: 'expand-collapse-api',
    titulo: 'ExpandRow/CollapseRow por API y sin argumento',
    html: arbol(),
    pasos: [
      ['ExpandRow(tr0)', r('a', t => t.ExpandRow(t.GetTrByIndex(0)))],
      ['CollapseRow(tr0)', r('b', t => t.CollapseRow(t.GetTrByIndex(0)))],
      ['sin argumento', r('c', t => [t.ExpandRow(), t.CollapseRow()])],
    ],
  },
  {
    id: 'cambiar-vista',
    titulo: 'ShowAsTree en caliente + _printTreeData (botones «Vista normal/árbol» de _treeTest)',
    origen: 'examples/_treeTest.html (viewTree)',
    html: arbol(),
    pasos: [
      ['vista normal', h => h.js(() => { const t = ET('t1'); t.ShowAsTree = false; t._printTreeData(); })],
      ['vista árbol', h => h.js(() => { const t = ET('t1'); t.ShowAsTree = true; t._printTreeData(); })],
    ],
  },
  {
    id: 'ontdpaint-en-arbol',
    titulo: 'onTdPaint/onRowPaint en árbol: idx del arreglo dibujado, row es una copia',
    origen: 'contrato §2.7, §1.11',
    html: arbol({ script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.onTdPaint = (td, i, c, f) => {}; t.onRowPaint = (tr, i, row) => { tr.setAttribute('data-copia', String(row !== t.DataArray[i])); }; t._printTreeData(); });` }),
    pasos: [['expandir', boton(0)]],
  },
  {
    id: 'sin-arbol-show-tree-false',
    titulo: 'show-tree="false" con key/parentkey (como _treeTest): no hay árbol ni movimiento',
    html: arbol({ attrs: { 'show-tree': 'false', key: 'id', parentkey: 'idp' } }),
    pasos: [['clic y arrastre (sin efecto)', async h => { await h.clicCelda('t1', 1, 0); await h.arrastrarFila('t1', 1, 0); }]],
  },
  {
    id: 'agregar-fila-en-arbol',
    titulo: 'AddRow en árbol (fila sin id/parent)',
    html: arbol(),
    pasos: [['AddRow', h => h.js(() => ET('t1').AddRow())], ['_printRows', h => h.js(() => ET('t1')._printRows())]],
  },
];
