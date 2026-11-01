// Edición de una celda: cómo se inicia, se confirma y se cancela, y los eventos que la controlan.
import { pagina, tabla, filas, COLS_BASE } from '../../lib/pagina.mjs';

const DATOS = filas(4);
const base = (extra = {}) => pagina({ body: tabla({ data: DATOS, cols: COLS_BASE, ...extra }), script: extra.script });

const ev = (nombre, cuerpo) => `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); const E = t.EdiTable.Const.Events; t.Events[E.${nombre}] = (e) => { ${cuerpo} }; });`;

export default [
  {
    id: 'iniciar-con-tecla',
    titulo: 'Iniciar la edición tecleando un carácter (StartEdit con ese carácter)',
    origen: 'editable.js:1038-1044',
    html: base(),
    pasos: [
      ['clic en Nombre', h => h.clicCelda('t1', 0, 1)],
      ['teclear "Z"', h => h.tecla('Z')],
      ['teclear "ap"', h => h.escribir('ap')],
      ['Enter confirma', h => h.tecla('Enter')],
    ],
  },
  {
    id: 'iniciar-doble-clic',
    titulo: 'Iniciar con doble clic (el segundo clic cae en el selector)',
    origen: 'editable.js:2096-2101',
    html: base(),
    pasos: [
      ['doble clic en Cantidad', h => h.dobleClicCelda('t1', 1, 2)],
      ['reemplazar y Tab', async h => { await h.tecla('Control+a'); await h.escribir('77'); await h.tecla('Tab'); }],
    ],
  },
  {
    id: 'iniciar-f2-enter',
    titulo: 'Iniciar con F2 y con Enter (texto = contenido de la celda)',
    origen: 'editable.js:1007-1012',
    html: base(),
    pasos: [
      ['clic y F2', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('F2'); }],
      ['Escape', h => h.tecla('Escape')],
      ['Enter', h => h.tecla('Enter')],
      ['escribir al final y Enter', async h => { await h.tecla('End'); await h.escribir(' (editado)'); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'suprimir-edita-vacio',
    titulo: 'Supr sin Ctrl: edita con la celda vacía',
    origen: 'editable.js:1013-1021',
    html: base(),
    pasos: [
      ['clic y Supr', async h => { await h.clicCelda('t1', 2, 1); await h.tecla('Delete'); }],
      ['confirmar vacío', h => h.tecla('Enter')],
    ],
  },
  {
    id: 'confirmar-enter-tab',
    titulo: 'Confirmar con Enter y con Tab (ambos van a la derecha)',
    origen: 'editable.js:1066-1071',
    html: base(),
    pasos: [
      ['editar Nombre y Enter', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('Uno'); await h.tecla('Enter'); }],
      ['editar Cantidad y Tab', async h => { await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('5'); await h.tecla('Tab'); }],
      ['editar Precio y Enter en la última columna (EverMove: baja de fila)', async h => { await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('1234.5'); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'confirmar-flechas',
    titulo: 'Desde el editor: flechas arriba/abajo navegan (confirman); izquierda/derecha solo en el borde',
    origen: 'editable.js:1053-1093',
    html: base(),
    pasos: [
      ['editar Nombre fila 1', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Enter'); await h.escribir('X'); }],
      ['flecha izquierda (no en el borde)', h => h.tecla('ArrowLeft')],
      ['Home y flecha izquierda (en el borde: navega)', async h => { await h.tecla('Home'); await h.tecla('ArrowLeft'); }],
      ['Enter, End y flecha derecha', async h => { await h.tecla('ArrowRight'); await h.tecla('Enter'); await h.tecla('End'); await h.tecla('ArrowRight'); }],
      ['Enter y flecha abajo', async h => { await h.tecla('Enter'); await h.escribir('9'); await h.tecla('ArrowDown'); }],
      ['Enter y flecha arriba', async h => { await h.tecla('Enter'); await h.escribir('1'); await h.tecla('ArrowUp'); }],
    ],
  },
  {
    id: 'cancelar-escape',
    titulo: 'Cancelar con Escape restaura temp_html y dispara CancelEdition',
    origen: 'editable.js:1980-2011',
    html: base(),
    pasos: [
      ['editar y teclear', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('no se guarda'); }],
      ['Escape', h => h.tecla('Escape')],
      ['Escape otra vez (sin edición)', h => h.tecla('Escape')],
    ],
  },
  {
    id: 'cancelar-memo-select',
    titulo: 'Escape en Memo y en Select',
    html: pagina({ body: tabla({ data: [{ m: 'memo', s: 'B' }], cols: [{ field: 'm', title: 'Memo', type: 'Memo' }, { field: 's', title: 'Sel', type: 'Select', options: '{"A":"a","B":"b"}' }] }) }),
    pasos: [
      ['Memo: editar y Escape', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('Enter'); await h.escribir('xx'); await h.tecla('Escape'); }],
      ['Select: editar y Escape', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Escape'); }],
      ['Select: flecha derecha confirma', async h => { await h.tecla('Enter'); await h.tecla('ArrowRight'); }],
    ],
  },
  {
    id: 'auto-confirm',
    titulo: 'auto-confirm="true": al salir de la tabla, el setInterval de 1 s confirma y dispara LostFocus',
    origen: 'editable.js:777-798',
    html: pagina({ body: tabla({ data: DATOS, cols: COLS_BASE, attrs: { 'auto-confirm': 'true' } }) + '<button id="fuera">Fuera</button>' }),
    pasos: [
      ['editar Nombre', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('Por auto-confirm'); }],
      ['foco fuera (antes del intervalo)', h => h.foco('#fuera')],
      ['esperar 1.1 s', h => h.esperar(1100)],
      ['esperar otros 2 s (LostFocus una sola vez)', h => h.esperar(2000)],
    ],
  },
  {
    id: 'sin-auto-confirm',
    titulo: 'Sin auto-confirm: al salir la edición sigue abierta; LostFocus igual se dispara',
    html: pagina({ body: tabla({ data: DATOS, cols: COLS_BASE }) + '<button id="fuera">Fuera</button>' }),
    pasos: [
      ['editar Nombre', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.escribir('abierta'); }],
      ['foco fuera y esperar 1.1 s', async h => { await h.foco('#fuera'); await h.esperar(1100); }],
      ['setAutoConfirm por propiedad y esperar', async h => { await h.js(() => { ET('t1').autoConfirm = true; }); await h.esperar(1100); }],
      ['editar otra vez, llamar setAutoConfirm() (segundo setInterval) y esperar', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Enter'); await h.escribir('dos'); await h.js(() => { ET('t1').setAutoConfirm(); }); await h.foco('#fuera'); await h.esperar(1100); }],
    ],
  },
  {
    id: 'beforeupdatecell-cancel',
    titulo: 'BeforeUpdateCell con cancel: la edición sigue abierta',
    origen: 'editable.js:1945-1952',
    html: base({ script: ev('BeforeUpdateCell', `if (String(e.text).includes('mal')) e.cancel = true;`) }),
    pasos: [
      ['editar con "mal" y Enter', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('mal'); await h.tecla('Enter'); }],
      ['corregir y Enter', async h => { await h.tecla('Control+a'); await h.escribir('bien'); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'beforeupdatecell-cambia-texto',
    titulo: 'BeforeUpdateCell cambia e.text (se escribe el texto cambiado)',
    html: base({ script: ev('BeforeUpdateCell', `e.text = String(e.text).toUpperCase();`) }),
    pasos: [['editar y Enter', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('minusculas'); await h.tecla('Enter'); }]],
  },
  {
    id: 'confirmedition-cancel',
    titulo: 'ConfirmEdition con cancel: input ya quitado y Editing=false (defecto 22)',
    etiquetas: ['defecto-conocido'],
    origen: 'editable.js:1954-1962',
    html: base({ script: ev('ConfirmEdition', `e.cancel = true;`) }),
    pasos: [
      ['editar y Enter', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.escribir('x'); await h.tecla('Enter'); }],
      ['clic en otra celda', h => h.clicCelda('t1', 1, 1)],
    ],
  },
  {
    id: 'beforesetinput-inputcreated',
    titulo: 'InputCreated y BeforeSetInput reciben el mismo objeto; BeforeSetInput cambia el texto inicial',
    origen: 'editable.js:1884-1899',
    html: base({ script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); const E = t.EdiTable.Const.Events; let prev = null;
t.Events[E.InputCreated] = (e) => { prev = e; e.input.setAttribute('data-creado', 'si'); };
t.Events[E.BeforeSetInput] = (e) => { e.mismo = (e === prev); e.text = '[' + e.text + ']'; }; });` }),
    pasos: [['editar', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); }], ['Enter', h => h.tecla('Enter')]],
  },
  {
    id: 'stopfire-defaults',
    titulo: 'Valores default de InsertRow con stopfire (sin FieldUpdated)',
    origen: 'editable.js:1535-1541, 1473-1496',
    html: pagina({ body: tabla({ data: DATOS.slice(0, 1), cols: [{ field: 'id', title: 'Id', type: 'NoEditable', default: '0' }, { field: 'nombre', title: 'Nombre', type: 'Text', default: 'Nuevo' }, { field: 'cantidad', title: 'Cantidad', type: 'Number', default: '1' }, { field: 'nota', title: 'Nota', type: 'Text' }] }) }),
    pasos: [
      ['AddRow', h => h.js(() => ET('t1').AddRow())],
      ['UpdateDataMember con y sin stopfire', h => h.js(() => { const t = ET('t1'); t.UpdateDataMember(0, 'nota', 'con evento'); t.UpdateDataMember(0, 'nota', 'sin evento', true); })],
    ],
  },
  {
    id: 'html-encode',
    titulo: 'html-encode="true": lo capturado se muestra escapado y se guarda sin escapar',
    origen: 'editable.js:218, 2228, 2246, 2721-2740',
    html: pagina({ body: tabla({ data: [{ id: 1, nombre: '<b>negrita</b>', cantidad: 1, precio: 1 }], cols: COLS_BASE, attrs: { 'html-encode': 'true' } }) }),
    pasos: [
      ['clic en la celda', h => h.clicCelda('t1', 0, 1)],
      ['editar con <i>…</i> y comillas', async h => { await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir(`<i>it</i> "q" 'a'`); await h.tecla('Enter'); }],
      ['UpdateData (DOM -> DataArray)', h => h.js(() => ET('t1').UpdateData())],
    ],
  },
  {
    id: 'sin-html-encode',
    titulo: 'Sin html-encode: el HTML capturado se interpreta',
    html: pagina({ body: tabla({ data: [{ id: 1, nombre: '<b>negrita</b>', cantidad: 1, precio: 1 }], cols: COLS_BASE }) }),
    pasos: [
      ['editar con <i>…</i>', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('<i>it</i>'); await h.tecla('Enter'); }],
      ['UpdateData', h => h.js(() => ET('t1').UpdateData())],
    ],
  },
  {
    id: 'readonly-tabla',
    titulo: 'Atributo readonly en la tabla: no edita',
    origen: 'editable.js:212, 1787',
    html: base({ attrs: { readonly: true } }),
    pasos: [['clic, Enter, tecla y Supr', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('a'); await h.tecla('Delete'); }]],
  },
  {
    id: 'readonly-columna',
    titulo: 'readonly en una columna',
    origen: 'editable.js:1791',
    html: pagina({ body: tabla({ data: DATOS, cols: [{ field: 'id', title: 'Id' }, { field: 'nombre', title: 'Nombre', type: 'Text', readonly: 'true' }] }) }),
    pasos: [['clic, Enter, tecla', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('a'); }], ['columna sin readonly', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('Enter'); }]],
  },
  {
    id: 'api-startedit-confirm-cancel',
    titulo: 'StartEdit/ConfirmEdit/CancelEdit llamados por API (CellFocus + StartEdit + select())',
    origen: 'editable.js:1785, 1911, 1980',
    html: base(),
    pasos: [
      ['CellFocus + StartEdit + select()', h => h.js(() => { const t = ET('t1'); const td = t.GetTrByIndex(1).cells[2]; t.CellFocus(td); t.StartEdit(td, ''); const i = t.EdiTable.GetInput(); if (i) i.select(); })],
      ['teclear 33 y ConfirmEdit por API', async h => { await h.escribir('33'); await h.js(() => { const t = ET('t1'); t.ConfirmEdit(t.CurrentTd()); }); }],
      ['StartEdit con texto y CancelEdit', h => h.js(() => { const t = ET('t1'); const td = t.CurrentTd(); t.StartEdit(td, 'texto inicial'); t.CancelEdit(td); })],
      ['ConfirmEdit sin edición', h => h.js(() => { const t = ET('t1'); window.__r = t.ConfirmEdit(t.CurrentTd()); window.__etExtra = () => window.__r; })],
    ],
  },
  {
    id: 'clic-otra-celda-confirma',
    titulo: 'Clic en otra celda durante la edición confirma (CellFocus -> ConfirmEdit)',
    origen: 'editable.js:2034-2042',
    html: base(),
    pasos: [
      ['editar', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('por clic'); }],
      ['clic en otra fila', h => h.clicCelda('t1', 3, 2)],
    ],
  },
  {
    id: 'clic-otra-tabla-confirma',
    titulo: 'Editando en una tabla y clic en otra',
    html: pagina({ body: tabla({ id: 'a', data: DATOS.slice(0, 2), cols: COLS_BASE }) + tabla({ id: 'b', data: DATOS.slice(2), cols: COLS_BASE }) }),
    pasos: [
      ['editar en a', async h => { await h.clicCelda('a', 0, 1); await h.tecla('Enter'); await h.escribir('-a'); }],
      ['clic en b', h => h.clicCelda('b', 1, 1)],
      ['volver a a', h => h.clicCelda('a', 1, 1)],
    ],
  },
];
