// Teclado sobre el selector (SetSelectorKeyEventHandler, editable.js:974-1052) y propiedades que lo controlan.
import { pagina, tabla, filas, COLS_BASE } from '../../lib/pagina.mjs';

const DATOS = filas(25);
const html = (script, n = 25, attrs = {}) => pagina({ body: tabla({ data: DATOS.slice(0, n), cols: COLS_BASE, attrs }) + '<button id="fuera">fuera</button>', script });
const props = (o) => `document.addEventListener('DOMContentLoaded', () => { Object.assign(ET('t1'), ${JSON.stringify(o)}); });`;

export default [
  {
    id: 'flechas',
    titulo: 'Flechas en las cuatro direcciones',
    html: html(null, 5),
    pasos: [
      ['clic en (1,1)', h => h.clicCelda('t1', 1, 1)],
      ['derecha', h => h.tecla('ArrowRight')],
      ['abajo', h => h.tecla('ArrowDown')],
      ['izquierda x2', h => h.tecla('ArrowLeft', 2)],
      ['arriba x3 (la primera fila no sube)', h => h.tecla('ArrowUp', 3)],
    ],
  },
  {
    id: 'tab-shift-tab',
    titulo: 'Tab = flecha derecha; Mayús+Tab hace lo mismo (no hay Shift+Tab); el foco no sale de la tabla',
    origen: 'editable.js:1028-1031',
    html: html(null, 3),
    pasos: [
      ['clic en (0,2)', h => h.clicCelda('t1', 0, 2)],
      ['Tab', h => h.tecla('Tab')],
      ['Tab en la última columna (EverMove)', h => h.tecla('Tab')],
      ['Shift+Tab', h => h.tecla('Shift+Tab')],
    ],
  },
  {
    id: 'inicio-fin',
    titulo: 'Inicio/Fin de la fila y Ctrl+Inicio',
    origen: 'editable.js:980-991, 1273-1299',
    html: html(null, 6),
    pasos: [
      ['clic en (3,1)', h => h.clicCelda('t1', 3, 1)],
      ['End', h => h.tecla('End')],
      ['Home', h => h.tecla('Home')],
      ['Ctrl+Home', h => h.tecla('Control+Home')],
    ],
  },
  {
    id: 'pagina-arriba-abajo',
    titulo: 'AvPág/RePág con PagOffSet=10 (por omisión) y con PagOffSet=3',
    origen: 'editable.js:992-1003',
    html: html(),
    pasos: [
      ['clic en (2,2)', h => h.clicCelda('t1', 2, 2)],
      ['PageDown', h => h.tecla('PageDown')],
      ['PageDown x2 (tope en la última)', h => h.tecla('PageDown', 2)],
      ['PageUp', h => h.tecla('PageUp')],
      ['PagOffSet=3 y PageUp x2', async h => { await h.js(() => { ET('t1').PagOffSet = 3; }); await h.tecla('PageUp', 2); }],
      ['PageUp x10 (tope en 0)', h => h.tecla('PageUp', 10)],
    ],
  },
  {
    id: 'enter-f2-edita',
    titulo: 'Enter y F2 inician la edición en un setTimeout de 1 ms',
    html: html(null, 3),
    pasos: [
      ['clic y Enter (antes de avanzar el reloj no edita)', async h => { await h.clicCelda('t1', 0, 1); await h.page.keyboard.press('Enter'); await h.page.evaluate(() => { window.__antes = ET('t1').Editing; window.__etExtra = () => ({ antesDelTimeout: window.__antes }); }); }],
      ['Escape y F2', async h => { await h.tecla('Escape'); await h.tecla('F2'); }],
    ],
  },
  {
    id: 'insertar',
    titulo: 'Insertar (sin Ctrl no hace nada) y Ctrl+Insertar (InsertRow en la fila actual)',
    origen: 'editable.js:1004-1006, 1509-1568',
    html: html(null, 4),
    pasos: [
      ['clic en (1,1) e Insert', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Insert'); }],
      ['Ctrl+Insert', h => h.tecla('Control+Insert')],
      ['Ctrl+Insert otra vez', h => h.tecla('Control+Insert')],
    ],
  },
  {
    id: 'ctrl-insertar-sin-autodelrow',
    titulo: 'Ctrl+Insertar depende de AutoDelRow (con AutoDelRow=false no inserta)',
    etiquetas: ['defecto-conocido'],
    origen: 'editable.js:1005',
    html: html(props({ AutoDelRow: false }), 3),
    pasos: [['clic y Ctrl+Insert', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Control+Insert'); }]],
  },
  {
    id: 'ctrl-suprimir',
    titulo: 'Ctrl+Supr borra la fila (BeforeRowDelete aceptado) y el selector queda en la misma posición',
    origen: 'editable.js:1013-1014, 1334-1373',
    html: html(null, 4),
    pasos: [
      ['clic en (1,2) y Ctrl+Delete', async h => { await h.clicCelda('t1', 1, 2); await h.tecla('Control+Delete'); }],
      ['Ctrl+Delete en la última', async h => { await h.clicCelda('t1', 2, 1); await h.tecla('Control+Delete'); }],
    ],
  },
  {
    id: 'ctrl-suprimir-cancelado',
    titulo: 'Ctrl+Supr con BeforeRowDelete cancelado',
    html: html(`document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.Events[t.EdiTable.Const.Events.BeforeRowDelete] = (e) => { e.cancel = (e.rowIndex === 1); }; });`, 4),
    pasos: [
      ['fila 1: cancelado', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Control+Delete'); }],
      ['fila 2: aceptado', async h => { await h.clicCelda('t1', 2, 1); await h.tecla('Control+Delete'); }],
    ],
  },
  {
    id: 'ctrl-suprimir-sin-autodelrow',
    titulo: 'AutoDelRow=false: Ctrl+Supr no borra',
    html: html(props({ AutoDelRow: false }), 3),
    pasos: [['clic y Ctrl+Delete', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Control+Delete'); }]],
  },
  {
    id: 'autoaddrow-true',
    titulo: 'AutoAddRow=true: flecha abajo en la última fila agrega una fila',
    origen: 'editable.js:2196-2202',
    html: html(null, 2),
    pasos: [
      ['clic en la última fila y abajo', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('ArrowDown'); }],
      ['abajo otra vez', h => h.tecla('ArrowDown')],
      ['editar la fila nueva', async h => { await h.tecla('Enter'); await h.escribir('fila nueva'); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'autoaddrow-false',
    titulo: 'AutoAddRow=false: flecha abajo en la última fila no hace nada',
    html: html(props({ AutoAddRow: false }), 2),
    pasos: [['clic en la última y abajo', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('ArrowDown'); }]],
  },
  {
    id: 'evermove-true',
    titulo: 'EverMove=true: derecha en la última celda baja de fila; izquierda en la primera sube',
    origen: 'editable.js:2141-2183',
    html: html(null, 3),
    pasos: [
      ['clic en (1,3) y derecha', async h => { await h.clicCelda('t1', 1, 3); await h.tecla('ArrowRight'); }],
      ['izquierda (primera celda): sube a la última celda', h => h.tecla('ArrowLeft')],
      ['clic en (0,0) e izquierda (primera fila)', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('ArrowLeft'); }],
      ['clic en la última celda de la última fila y derecha (AutoAddRow)', async h => { await h.clicCelda('t1', 2, 3); await h.tecla('ArrowRight'); }],
    ],
  },
  {
    id: 'evermove-false',
    titulo: 'EverMove=false (como V12): no cambia de fila',
    html: html(props({ EverMove: false }), 3),
    pasos: [
      ['clic en (1,3) y derecha', async h => { await h.clicCelda('t1', 1, 3); await h.tecla('ArrowRight'); }],
      ['clic en (1,0) e izquierda', async h => { await h.clicCelda('t1', 1, 0); await h.tecla('ArrowLeft'); }],
      ['Enter, editar y Tab en la última (no baja)', async h => { await h.clicCelda('t1', 1, 3); await h.tecla('Enter'); await h.tecla('Tab'); }],
    ],
  },
  {
    id: 'v12-sin-atajos',
    titulo: 'AutoAddRow, AutoDelRow y EverMove en false (como uie.dbeditable)',
    origen: 'uielements.v12.dkl:162-164',
    html: html(props({ AutoAddRow: false, AutoDelRow: false, EverMove: false }), 3, { 'hidde-selector': 'true', 'cards-responsive': 'true' }),
    pasos: [['recorrido completo', async h => { await h.clicCelda('t1', 2, 3); await h.teclas(['ArrowDown', 'ArrowRight', 'Control+Delete', 'Control+Insert', 'ArrowLeft', 'Home', 'End']); }]],
  },
  {
    id: 'tecla-con-modificadores',
    titulo: 'Teclas de un carácter con Alt/Meta también inician edición',
    origen: 'editable.js:1038-1044',
    html: html(null, 2),
    pasos: [
      ['Alt+x', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Alt+x'); }],
      ['Escape y espacio', async h => { await h.tecla('Escape'); await h.tecla('Space'); }],
      ['Escape y Shift+A', async h => { await h.tecla('Escape'); await h.tecla('Shift+A'); }],
    ],
  },
  {
    id: 'teclas-ignoradas',
    titulo: 'Teclas sin acción (Escape, F1, F5, Backspace) sobre el selector: preventDefault y nada más',
    origen: 'editable.js:977',
    html: html(null, 2),
    pasos: [['clic y teclas', async h => { await h.clicCelda('t1', 0, 1); await h.teclas(['Escape', 'F1', 'Backspace', 'ContextMenu']); }]],
  },
  {
    id: 'navegacion-columna-oculta',
    titulo: 'Flechas con una columna oculta (hideColumn)',
    origen: 'editable.js:2141-2203, 3885',
    html: html(`document.addEventListener('DOMContentLoaded', () => { ET('t1').hideColumn('cantidad', true); });`, 4),
    pasos: [
      ['clic en (0,1) y derecha', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('ArrowRight'); }],
      ['abajo', h => h.tecla('ArrowDown')],
      ['izquierda', h => h.tecla('ArrowLeft')],
      ['End y Home', h => h.teclas(['End', 'Home'])],
    ],
  },
  {
    id: 'propagacion-host',
    titulo: 'El selector detiene la propagación: un keydown nativo en captura sobre el host sí lo ve',
    origen: 'editable.js:1047 (HTMLElement.prototype.addEventListener.call en captura)',
    html: html(`window.__teclas = []; HTMLElement.prototype.addEventListener.call(document.getElementById('t1'), 'keydown', (e) => window.__teclas.push('captura:' + e.key), true);
HTMLElement.prototype.addEventListener.call(document.getElementById('t1'), 'keydown', (e) => window.__teclas.push('burbuja:' + e.key));
document.addEventListener('keydown', (e) => window.__teclas.push('document:' + e.key));
window.__etExtra = () => window.__teclas;`, 3),
    pasos: [['clic y teclas', async h => { await h.clicCelda('t1', 0, 1); await h.teclas(['ArrowDown', 'a', 'Escape']); }]],
  },
];
