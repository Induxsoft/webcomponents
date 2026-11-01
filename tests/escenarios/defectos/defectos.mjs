// Defectos conocidos, congelados como comportamiento actual (etiqueta «defecto-conocido»).
// Cuando una fase los corrija, aparecerán como diferencia en estos escenarios: es la diferencia intencional
// que se revisa y, si se aprueba, se acepta con --update (ver README, «Cuándo se permite actualizar»).
import { pagina, tabla, filas, COLS_BASE } from '../../lib/pagina.mjs';

const DATOS = filas(4);
const D = ['defecto-conocido'];
const html = (o = {}) => pagina({ body: tabla({ data: o.data ?? DATOS, cols: o.cols ?? COLS_BASE, attrs: o.attrs ?? {} }) + (o.despues ?? ''), script: (o.script ?? '') + '\nwindow.__r = window.__r || {}; window.__etExtra = window.__etExtra || (() => window.__r);' });
const r = (clave, fn) => (h) => h.js(([k, src]) => { let v; try { v = (new Function('t', 'return (' + src + ')(t)'))(ET('t1')); } catch (e) { v = '!excepción: ' + e.message; } window.__r[k] = window.__etSer(v); }, [clave, fn.toString()]);

export default [
  {
    id: 'listener-clic-duplicado',
    titulo: 'Cada InsertRow agrega otro listener de clic a todas las celdas (3 inserciones: BeforeCellFocus x4)',
    etiquetas: D, origen: 'editable.js:1543-1551; contrato §4 #5 (verificado)',
    html: html({ script: `window.__bcf = 0; document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.AutoAddRow = false; t.Events[t.EdiTable.Const.Events.BeforeCellFocus] = () => { window.__bcf++; }; });
window.__etExtra = () => ({ beforeCellFocus: window.__bcf });` }),
    registro: 'consumer',
    pasos: [
      ['3 InsertRow sin foco', h => h.js(() => { const t = ET('t1'); for (let i = 0; i < 3; i++) t.InsertRow(undefined, true); window.__bcf = 0; })],
      ['un clic en la fila 1', h => h.clicCelda('t1', 1, 0)],
      ['un clic en la fila 0, columna 1 (sobre el div interno)', async h => { await h.js(() => { window.__bcf = 0; }); await h.clicCelda('t1', 0, 1); }],
    ],
  },
  {
    id: 'ctrl-c-edita',
    titulo: 'Ctrl+C sobre el selector empieza a editar con la letra «c»',
    etiquetas: D, origen: 'editable.js:1038-1044; plan D1',
    html: html(),
    pasos: [
      ['clic y Ctrl+C', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Control+c'); }],
      ['Escape y Ctrl+V', async h => { await h.tecla('Escape'); await h.tecla('Control+v'); }],
      ['Escape y Ctrl+A', async h => { await h.tecla('Escape'); await h.tecla('Control+a'); }],
    ],
  },
  {
    id: 'navtoend',
    titulo: 'NavToEnd (y Ctrl+Fin) no hace nada: busca thead tr td',
    etiquetas: D, origen: 'editable.js:1280-1283',
    html: html(),
    pasos: [
      ['NavTo(0,0) y NavToEnd()', r('a', t => { t.NavTo(0, 0); t.NavToEnd(); return [t.CurrentRowIndex(), t.CurrentColIndex()]; })],
      ['Ctrl+End', h => h.tecla('Control+End')],
    ],
  },
  {
    id: 'sortable-propiedad',
    titulo: 'La propiedad sorTable=false no tiene efecto (solo se lee _sorTable)',
    etiquetas: D, origen: 'editable.js:231-233, 499',
    html: html({ script: `document.addEventListener('DOMContentLoaded', () => { ET('t1').sorTable = false; });` }),
    pasos: [['clic en Nombre (ordena igual)', h => h.clicEncabezado('t1', 1)], ['clic otra vez', h => h.clicEncabezado('t1', 1)]],
  },
  {
    id: 'clases-orden-invertidas',
    titulo: 'Primer clic ordena ascendente pero marca «descendent»',
    etiquetas: D, origen: 'editable.js:503-506',
    html: html({ data: [{ id: 2, nombre: 'b' }, { id: 1, nombre: 'a' }, { id: 3, nombre: 'c' }] }),
    pasos: [['clic en Nombre', h => h.clicEncabezado('t1', 1)]],
  },
  {
    id: 'isdirty-tras-restore',
    titulo: 'IsDirty sigue en true después de restore() y de restoreRow()',
    etiquetas: D, origen: 'editable.js:2745-2761 (verificado)',
    html: html(),
    pasos: [
      ['backup y cambio', r('a', t => { t.backup(); t.UpdateDataMember(0, 'nombre', 'CAMBIO'); return t.IsDirty; })],
      ['restore', r('b', t => { t.restore(); return [t.IsDirty, t._count_isdirty]; })],
      ['cambio y restoreRow', r('c', t => { t.UpdateDataMember(1, 'nombre', 'OTRO'); t.restoreRow(1); return [t.IsDirty, t._count_isdirty]; })],
    ],
  },
  {
    id: 'isdirty-tras-ordenar',
    titulo: 'Sort reordena DataArray pero no el respaldo: getIsDirty apunta a otra fila',
    etiquetas: D, origen: 'editable.js:2662, 2769-2803; contrato §4 #14',
    html: html({ data: [{ id: 3, nombre: 'c' }, { id: 1, nombre: 'a' }, { id: 2, nombre: 'b' }] }),
    pasos: [
      ['backup y editar la fila de id 3', r('a', t => { t.backup(); t.UpdateDataMember(0, 'nombre', 'c-editado'); return [t.getIsDirty(0), t.getIsDirty(2)]; })],
      ['ordenar por id', h => h.clicEncabezado('t1', 0)],
      ['getIsDirty por fila', r('b', t => t.DataArray.map((d, i) => [d.id, t.getIsDirty(i)]))],
    ],
  },
  {
    id: 'insertrow-no-respaldo',
    titulo: 'InsertRow(rw) no inserta en el respaldo: los isDirty se corren',
    etiquetas: D, origen: 'editable.js:1514-1517',
    html: html(),
    pasos: [
      ['backup, editar fila 2, InsertRow(0)', r('a', t => { t.backup(); t.UpdateDataMember(2, 'nombre', 'sucia'); t.InsertRow(0, true); return t.DataArray.map((d, i) => [d.id ?? null, t.getIsDirty(i)]); })],
    ],
  },
  {
    id: 'readonly-false',
    titulo: 'readonly="false" en la columna la deja de solo lectura',
    etiquetas: D, origen: 'editable.js:1791',
    html: html({ cols: [{ field: 'id', title: 'Id' }, { field: 'nombre', title: 'Nombre', type: 'Text', readonly: 'false' }] }),
    pasos: [['clic, Enter y tecla', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('a'); }]],
  },
  {
    id: 'afterprint-muestra-ocultas',
    titulo: 'afterprint vuelve a mostrar una columna no-print que el usuario había ocultado',
    etiquetas: D, origen: 'editable.js:251-256',
    html: html({ cols: [{ field: 'id', title: 'Id', class: 'no-print' }, { field: 'nombre', title: 'Nombre' }] }),
    pasos: [
      ['el usuario oculta Id', h => h.js(() => ET('t1').hideColumn('id', true))],
      ['beforeprint', h => h.imprimir(true)],
      ['afterprint (Id reaparece)', h => h.imprimir(false)],
    ],
  },
  {
    id: 'attributechangecallback',
    titulo: 'attributeChangeCallback mal escrito: cambiar atributos después de cargar no tiene efecto',
    etiquetas: D, origen: 'editable.js:17-26',
    html: html({ attrs: { 'hidde-selector': 'false' } }),
    pasos: [
      ['setAttribute readonly, hidde-selector, control-styles, data', h => h.js(() => { const t = ET('t1'); t.setAttribute('readonly', ''); t.setAttribute('hidde-selector', 'true'); t.setAttribute('control-styles', 'td{color:red}'); t.setAttribute('data', '[]'); t.setAttribute('show-tree', 'true'); })],
      ['clic y Enter: sigue editable', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); }],
      ['observedAttributes', r('a', t => ({ observed: customElements.get('edit-table').observedAttributes, tieneChanged: typeof t.attributeChangedCallback, tieneChange: typeof t.attributeChangeCallback }))],
    ],
  },
  {
    id: 'creada-despues',
    titulo: 'edit-table creada después de DOMContentLoaded: no se inicializa',
    etiquetas: D, origen: 'editable.js:28-32 (verificado); plan D4',
    html: pagina({
      body: '<div id="zona"></div>',
      script: `window.addEventListener('load', () => { document.getElementById('zona').innerHTML = ${JSON.stringify(tabla({ id: 'tarde', data: DATOS.slice(0, 2), cols: COLS_BASE }))}; });`,
    }),
    pasos: [
      ['createElement + appendChild', h => h.js(() => { const e = document.createElement('edit-table'); e.id = 'tarde2'; e.setAttribute('data', '[{"id":1}]'); e.innerHTML = '<edit-thead><edit-tr><edit-th field="id">Id</edit-th></edit-tr></edit-thead>'; document.body.appendChild(e); })],
      ['esperar 2 s', h => h.esperar(2000)],
      ['quitar y volver a insertar una inicializada', h => h.js(() => { const z = document.getElementById('zona'); const t = document.getElementById('tarde'); t.remove(); z.appendChild(t); })],
    ],
  },
  {
    id: 'attributes-tapado',
    titulo: 'El campo attributes tapa Element.attributes (null antes, arreglo de nombres después)',
    etiquetas: D, origen: 'editable.js:3, 14 (verificado)',
    html: pagina({
      body: tabla({ data: DATOS.slice(0, 1), cols: COLS_BASE.slice(0, 2), attrs: { 'data-x': 'uno', 'hidde-selector': 'false' } }),
      script: `window.__antes = (() => { const t = document.getElementById('t1'); return { esArreglo: Array.isArray(t.attributes), valor: t.attributes }; })();
window.__etExtra = () => ({ antes: window.__antes, despues: { esArreglo: Array.isArray(ET('t1').attributes), valor: ET('t1').attributes, tieneNamedItem: typeof (ET('t1').attributes || {}).getNamedItem } });`,
    }),
    pasos: [],
  },
  {
    id: 'sender-copia-superficial',
    titulo: 'sender es una copia superficial: sin métodos del prototipo, no es elemento, se desactualiza',
    etiquetas: D, origen: 'editable.js:486-491; contrato §1.16 (verificado)',
    registro: 'consumer',
    html: html({ script: `window.__s = []; document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.Events[t.EdiTable.Const.Events.EnterCell] = (e) => { const s = e.sender; window.__s.push({ backup: typeof s.backup, restore: typeof s.restore, ExpandRow: typeof s.ExpandRow, hideColumn: typeof s.hideColumn, IsDirty: typeof s.IsDirty, UpdateRow: typeof s.UpdateRow, CellFocus: typeof s.CellFocus, esElemento: s instanceof HTMLElement, esTabla: s === t, mismoDataArray: s.DataArray === t.DataArray, mismosEvents: s.Events === t.Events }); }; });
window.__etExtra = () => window.__s.splice(0);` }),
    pasos: [
      ['clic', h => h.clicCelda('t1', 0, 1)],
      ['reasignar DataArray y clic en la misma celda (la copia anterior queda vieja)', async h => { await h.js(() => { const t = ET('t1'); t.DataArray = t.DataArray.slice(); }); await h.clicCelda('t1', 1, 1); }],
    ],
  },
  {
    id: 'paginas-columna-oculta',
    titulo: 'AvPág/RePág con una columna oculta: NavTo usa el índice visible y CurrentColIndex el absoluto',
    etiquetas: D, origen: 'editable.js:993-1002, 1313; contrato §4 #11',
    html: pagina({ body: tabla({ data: filas(25), cols: COLS_BASE }), script: `document.addEventListener('DOMContentLoaded', () => { ET('t1').hideColumn('nombre', true); ET('t1').PagOffSet = 5; });` }),
    pasos: [
      ['clic en Cantidad (col 2) y PageDown', async h => { await h.clicCelda('t1', 0, 2); await h.tecla('PageDown'); }],
      ['PageDown otra vez', h => h.tecla('PageDown')],
      ['clic en Precio (col 3) y PageUp', async h => { await h.clicCelda('t1', 12, 3); await h.tecla('PageUp'); }],
    ],
  },
  {
    id: 'onsort-campo-especial',
    titulo: 'OnSort con un campo con caracteres especiales: excepción en querySelector sin comillas',
    etiquetas: D, origen: 'editable.js:2811',
    html: html({ data: [{ 'No.Identificacion': 'b', x: 1 }, { 'No.Identificacion': 'a', x: 2 }], cols: [{ field: 'No.Identificacion', title: 'No. identificación' }, { field: 'x', title: 'X' }] }),
    pasos: [['clic en el encabezado con punto', h => h.clicEncabezado('t1', 0)], ['clic en encabezado normal', h => h.clicEncabezado('t1', 1)]],
  },
  {
    id: 'onsort-sin-sender',
    titulo: 'OnSort trae {th, coldef, caption} sin sender y se dispara antes de ordenar',
    etiquetas: D, origen: 'editable.js:2804-2822',
    registro: 'consumer',
    html: html({ script: `window.__o = []; document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.Events[t.EdiTable.Const.Events.OnSort] = (e) => { window.__o.push({ claves: Object.keys(e), primero: t.DataArray[0].id, sort: e.coldef.sort }); }; });
window.__etExtra = () => window.__o.splice(0);`, data: [{ id: 3, nombre: 'c' }, { id: 1, nombre: 'a' }, { id: 2, nombre: 'b' }] }),
    pasos: [['clic en Id', h => h.clicEncabezado('t1', 0)], ['clic en Id otra vez', h => h.clicEncabezado('t1', 0)]],
  },
  {
    id: 'getisdirty-sin-respaldo',
    titulo: 'getIsDirty sin backup lanza una excepción; setIsDirtyByValue llama dos veces a setIsDirty',
    etiquetas: D, origen: 'editable.js:2799-2803, 1459-1464',
    html: html(),
    pasos: [['getIsDirty(0)', r('a', t => t.getIsDirty(0))], ['backup y UpdateDataMember con el mismo valor', r('b', t => { t.backup(); t.UpdateDataMember(0, 'nombre', 'Producto de prueba 1'); return [t.IsDirty, t._count_isdirty]; })]],
  },
  {
    id: 'insertrow-sin-plantilla',
    titulo: 'InsertRow no aplica plantilla, data-cell ni onTdPaint (tres caminos de dibujo distintos)',
    etiquetas: D, origen: 'editable.js:1509-1568; contrato §1.5 y §4 #20',
    html: html({ cols: [...COLS_BASE, { field: 'tpl', title: 'T', type: 'NoEditable', template: '<i>${DataRow.nombre}</i>' }], script: `ET('t1').onTdPaint = (td, i, c, f) => td.setAttribute('data-p', 'si');` }),
    pasos: [['AddRow', h => h.js(() => ET('t1').AddRow())], ['_printRows (ahora sí)', h => h.js(() => ET('t1')._printRows())]],
  },
  {
    id: 'initial-sin-id-tr',
    titulo: '_getFullTable no pone id/parent/indent en los tr; _printRows sí',
    etiquetas: D, origen: 'editable.js:301-331 vs 2381',
    html: html(),
    pasos: [['_printRows', h => h.js(() => ET('t1')._printRows())]],
  },
];
