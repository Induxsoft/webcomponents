// Cada tipo de columna (Const.Columns.Types, editable.js:840-851): dibujo, editor, confirmación y DataArray.
import { pagina, tabla } from '../../lib/pagina.mjs';

const fila = (v, extra = {}) => ({ id: 1, campo: v, otro: 'texto', ...extra });

function escenarioTipo({ id, titulo, col, valor, valor2, editar, origen, script, extraCols = [], etiquetas, registro }) {
  return {
    id, titulo, etiquetas, registro,
    origen: origen ?? 'editable.js:1785-1975 (StartEdit/ConfirmEdit), 2238-2305 (SetTdValue/formato)',
    html: pagina({
      body: tabla({ data: [fila(valor), fila(valor2 ?? valor, { id: 2, otro: 'otra' })], cols: [{ field: 'id', title: 'Id', type: 'NoEditable' }, { field: 'campo', title: titulo.split(':')[0], ...col }, { field: 'otro', title: 'Otro', type: 'Text' }, ...extraCols] }),
      script,
    }),
    pasos: [
      ['clic en la celda', h => h.clicCelda('t1', 0, 1)],
      ['Enter (StartEdit)', h => h.tecla('Enter')],
      ...(editar ? [['capturar', editar]] : []),
      ['confirmar (Enter, o Ctrl+Enter en Memo/Select)', h => h.tecla(col.type === 'Memo' || col.type === 'Select' ? 'Control+Enter' : 'Enter')],
      ['volver a la celda y Enter', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); }],
      ['Escape', h => h.tecla('Escape')],
      ['segunda fila: clic y F2', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('F2'); }],
      ['Escape', h => h.tecla('Escape')],
    ],
  };
}

const ponerValor = (v) => (h) => h.js((x) => { const i = ETs('t1').querySelector('#__table_input'); if (i) i.value = x; }, v);
const reemplazar = (txt) => async (h) => { await h.tecla('Control+a'); await h.escribir(txt); };

export default [
  escenarioTipo({ id: 'text', titulo: 'Text: entrada de texto', col: { type: 'Text' }, valor: 'Hola', editar: reemplazar('Nuevo texto') }),
  escenarioTipo({ id: 'text-maxlength', titulo: 'Text con maxlength=5', col: { type: 'Text', maxlength: '5' }, valor: 'abc', editar: reemplazar('1234567890'), origen: 'editable.js:1879-1882' }),
  escenarioTipo({ id: 'number', titulo: 'Number sin formato', col: { type: 'Number' }, valor: 12.5, valor2: '7', editar: reemplazar('42.75') }),
  escenarioTipo({ id: 'number-formato', titulo: 'Number con format, decs=2, prefix, sufix y thousandssep', col: { type: 'Number', format: 'true', decs: '2', prefix: '$ ', sufix: ' MXN', thousandssep: 'true', textalign: 'end' }, valor: 1234567.891, valor2: -0.5, editar: reemplazar('9876.5'), origen: 'editable.js:2287-2305; examples/EditTable-demo.html' }),
  escenarioTipo({ id: 'number-formato-decs0', titulo: 'Number con format y decs=0 (modifica NumFormat.decimals)', col: { type: 'Number', format: 'true', decs: '0', thousandssep: 'true' }, valor: 1234.56, editar: reemplazar('99.4'), origen: 'editable.js:742-764 (_format cambia NumFormat.decimals)' }),
  escenarioTipo({ id: 'number-formato-sin-miles', titulo: 'Number con format sin thousandssep y valor no numérico', col: { type: 'Number', format: 'true', decs: '3' }, valor: 'abc', valor2: '', editar: reemplazar('1e3') }),
  escenarioTipo({ id: 'number-numformat', titulo: 'Number con NumFormat cambiado (miles con punto, decimales con coma)', col: { type: 'Number', format: 'true', decs: '2', thousandssep: 'true' }, valor: 1234567.5, editar: reemplazar('5000'), script: `ET('t1').NumFormat = { default_decimals: ',', thousands: '.', decimals: ',' };`, origen: 'editable.js:1202-1206' }),
  escenarioTipo({ id: 'noeditable', titulo: 'NoEditable: Enter no abre editor', col: { type: 'NoEditable' }, valor: 'Fijo' }),
  escenarioTipo({ id: 'noeditable-formato', titulo: 'NoEditable con format', col: { type: 'NoEditable', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' }, valor: 98765.4321 }),
  escenarioTipo({ id: 'date', titulo: 'Date: input type=date', col: { type: 'Date', textalign: 'center' }, valor: '2025-01-01', valor2: '', editar: ponerValor('2026-02-03') }),
  escenarioTipo({ id: 'datetime', titulo: 'DateTime: input datetime-local', col: { type: 'DateTime' }, valor: '2025-01-03 12:00', editar: ponerValor('2026-02-03T08:30') }),
  escenarioTipo({ id: 'memo', titulo: 'Memo: textarea (Enter es salto de línea, Ctrl+Enter confirma)', col: { type: 'Memo', minwidth: '100px', maxwidth: '300px' }, valor: 'Línea uno', editar: async h => { await h.tecla('End'); await h.tecla('Enter'); await h.escribir('línea dos'); } }),
  escenarioTipo({ id: 'memo-maxlength', titulo: 'Memo con maxlength=8', col: { type: 'Memo', maxlength: '8' }, valor: 'abc', editar: reemplazar('0123456789') }),
  escenarioTipo({ id: 'check', titulo: 'Check: checkbox con Converts.Boolean (Sí/No)', col: { type: 'Check', textalign: 'center', default: 'No' }, valor: 'Sí', valor2: 'No', editar: h => h.tecla('Space') }),
  escenarioTipo({ id: 'check-valores', titulo: 'Check con valores true/1/yes/cierto', col: { type: 'Check' }, valor: 'true', valor2: 'cierto', editar: h => h.tecla('Space') }),
  escenarioTipo({ id: 'select', titulo: 'Select con options (el valor es la clave)', col: { type: 'Select', options: '{"PZA":"PIEZA","PAQ":"PAQUETE","CAJA":"CAJA"}' }, valor: 'PAQ', valor2: 'XYZ', editar: ponerValor('CAJA') }),
  escenarioTipo({ id: 'select-keyfield', titulo: 'Select con keyfield (texto visible y clave en otro campo)', col: { type: 'Select', options: '{"1":"Uno","2":"Dos","3":"Tres"}', keyfield: 'clave' }, valor: 'Dos', editar: ponerValor('3'), origen: 'editable.js:1871-1876, 1934-1943; examples/_EdiTable-demo.html' }),
  escenarioTipo({ id: 'select-sin-options', titulo: 'Select sin options', col: { type: 'Select' }, valor: 'x' }),
  escenarioTipo({
    id: 'custom', titulo: 'Custom: StartEdition es el único punto de edición', col: { type: 'Custom' }, valor: 'c',
    script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.Events[t.EdiTable.Const.Events.StartEdition] = (e) => { const r = t.RowIndexOfTd(e.td); t.DataArray[r].campo = 'editado ' + r; t.UpdateRow(r); }; });`,
    origen: 'editable.js:1796-1812',
  }),
  escenarioTipo({ registro: 'consumer', id: 'badges-col', titulo: 'Badges: columna no editable con badges', col: { type: 'Badges' }, valor: 'no se ve', script: `ET('t1').RowBadges = (r, i) => [{ text: 'B' + i, bg: '#335' }];`, origen: 'editable.js:2995, 3657-3672' }),
  escenarioTipo({ id: 'sin-type', titulo: 'Sin type: ColumnsDefaultType (Text)', col: {}, valor: 'por omisión', editar: reemplazar('cambio') }),
  {
    id: 'inputkey',
    titulo: 'Columna Text con InputKey (setInputKey/showInputKey): F4, botón y confirmar',
    origen: 'editable.js:2711-2720, 1035-1037, 1964-1968, 2069-2072',
    html: pagina({
      body: tabla({ data: [{ id: 1, cliente: 'Cliente falso' }, { id: 2, cliente: '' }], cols: [{ field: 'id', title: 'Id', type: 'NoEditable' }, { field: 'cliente', title: 'Cliente', type: 'Text', button: 'true' }] }),
      script: `window.__ik = [];
document.addEventListener('DOMContentLoaded', () => {
  const ik = document.createElement('div'); ik.id = 'ik-falso';
  ik.searchText = (texto, auto) => window.__ik.push({ texto, auto });
  ET('t1').setInputKey('cliente', ik);
});
window.__etExtra = () => ({ llamadas: window.__ik });`,
    }),
    pasos: [
      ['clic en Cliente', h => h.clicCelda('t1', 0, 1)],
      ['F4', h => h.tecla('F4')],
      ['clic en el botón de la celda', h => h.clicShadow('t1', '#__table_button')],
      ['escribir y confirmar (no escribe en la celda)', async h => { await h.escribir('xyz'); await h.tecla('Enter'); }],
      ['segunda fila: Enter y confirmar vacío', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Enter'); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'boton-buttononclick',
    titulo: 'Columna con button="true", buttondata propio y ButtonOnClick',
    origen: 'editable.js:2058-2086; examples/EditTable-demo.html (cellsButtonClickHandler)',
    html: pagina({
      body: tabla({ data: [{ id: 1, a: 'uno', b: 'dos' }, { id: 2, a: 'tres', b: '' }], cols: [{ field: 'id', title: 'Id', type: 'NoEditable' }, { field: 'a', title: 'A', type: 'Custom', button: 'true' }, { field: 'b', title: 'B', type: 'Text', button: 'true', buttondata: '<b>…</b>' }] }),
      script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.ButtonOnClick = (r, c, def) => { t.DataArray[r][def.field] = 'botón ' + r + ',' + c; t.UpdateRow(r); }; });`,
    }),
    pasos: [
      ['clic en A', h => h.clicCelda('t1', 0, 1)],
      ['clic en el botón', h => h.clicShadow('t1', '#__table_button')],
      ['clic en B fila 2 y su botón', async h => { await h.clicCelda('t1', 1, 2); await h.clicShadow('t1', '#__table_button'); }],
    ],
  },
  {
    id: 'boton-sin-buttononclick',
    titulo: 'button="true" sin ButtonOnClick (llama a showInputKey sin inputkey: no hace nada)',
    html: pagina({ body: tabla({ data: [{ id: 1, a: 'uno' }], cols: [{ field: 'id', title: 'Id', type: 'NoEditable' }, { field: 'a', title: 'A', type: 'Text', button: 'true' }] }) }),
    pasos: [['clic en la celda y en el botón', async h => { await h.clicCelda('t1', 0, 1); await h.clicShadow('t1', '#__table_button'); }]],
  },
  {
    id: 'todos-los-tipos',
    titulo: 'Los nueve tipos en una fila (como EditTable-demo) y navegación por todos',
    origen: 'examples/EditTable-demo.html',
    viewport: { width: 1300, height: 600 },
    html: pagina({
      body: tabla({
        attrs: { 'min-row-height': '1rem', 'max-row-height': '5rem' },
        data: [{ uno: '', dos: 'Texto falso', tres: 123456.789, cuatro: 'PAQ', cinco: '2025-01-01', seis: '2025-01-03 12:00', siete: 'Sí', ocho: '', nueve: 'Memo de prueba' }],
        cols: [
          { type: 'NoEditable', field: 'uno', title: 'NoEditable' }, { type: 'Text', field: 'dos', maxlength: '25', title: 'Text' },
          { type: 'Number', field: 'tres', textalign: 'end', format: 'true', thousandssep: 'true', decs: '2', prefix: '$ ', sufix: ' MXN', default: '0.00', title: 'Number' },
          { type: 'Select', field: 'cuatro', options: '{"PZA":"PIEZA","PAQ":"PAQUETE","CAJA":"CAJA"}', title: 'Select' },
          { type: 'Date', field: 'cinco', textalign: 'center', title: 'Date' }, { type: 'DateTime', field: 'seis', textalign: 'center', title: 'DateTime' },
          { type: 'Check', field: 'siete', textalign: 'center', default: 'No', title: 'Check' }, { type: 'Custom', field: 'ocho', button: 'true', title: 'Custom' },
          { type: 'Memo', field: 'nueve', minwidth: '100px', maxwidth: '300px', title: 'Memo' },
        ],
      }),
    }),
    pasos: [
      ['clic en NoEditable', h => h.clicCelda('t1', 0, 0)],
      ...Array.from({ length: 8 }, (_, i) => [`Tab ${i + 1} y Enter/Escape`, async h => { await h.tecla('Tab'); await h.tecla('Enter'); await h.tecla('Escape'); }]),
      ['Tab al final: EverMove + AutoAddRow agrega fila', h => h.tecla('Tab')],
    ],
  },
];
