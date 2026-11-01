// Eventos de EdiTable.Const.Events (21) y el addEventListener sobrescrito (editable.js:3903-3978).
import { pagina, tabla, filas, COLS_BASE } from '../../lib/pagina.mjs';

const DATOS = filas(4);
const NOMBRES = ['BeforeCellFocus', 'EnterCell', 'LeaveCell', 'StartEdition', 'ConfirmEdition', 'CancelEdition', 'InputCreated', 'BeforeUpdateCell', 'BeforeSetInput', 'FieldUpdated', 'RowAdded', 'RowDeleted', 'BeforeRowDelete', 'BeforeMoveRow', 'RowMoved', 'RowChanged', 'LostFocus', 'IsDirtyChanged', 'OnSort', 'BadgeClick', 'ViewModeChanged'];

// Flujo común: foco, edición confirmada, cancelada, alta, baja, orden, salida de la tabla
const FLUJO = [
  ['clic (0,1)', h => h.clicCelda('t1', 0, 1)],
  ['editar y confirmar', async h => { await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('Cambio'); await h.tecla('Enter'); }],
  ['editar y cancelar', async h => { await h.tecla('Enter'); await h.escribir('x'); await h.tecla('Escape'); }],
  ['flecha abajo (RowChanged)', h => h.tecla('ArrowDown')],
  ['AddRow', h => h.js(() => ET('t1').AddRow())],
  ['Ctrl+Supr', h => h.tecla('Control+Delete')],
  ['backup, editar (IsDirtyChanged)', async h => { await h.js(() => ET('t1').backup()); await h.clicCelda('t1', 1, 2); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('99'); await h.tecla('Enter'); }],
  ['ordenar (OnSort)', h => h.clicEncabezado('t1', 1)],
  ['foco fuera y esperar (LostFocus)', async h => { await h.foco('#fuera'); await h.esperar(1100); }],
];

const registrar = (modo) => `window.__ev = [];
document.addEventListener('DOMContentLoaded', () => {
  const t = ET('t1'); const E = t.EdiTable.Const.Events;
  ${JSON.stringify(NOMBRES)}.forEach(n => {
    const f = (e) => { window.__ev.push(n + (e && e.rowIndex !== undefined ? ':' + e.rowIndex : '') + (e && e.index !== undefined ? ':' + e.previous_index + '->' + e.index : '') + (e && e.field ? ':' + e.field + '=' + e.value : '')); };
    ${modo === 'prop' ? 't.Events[E[n]] = f;' : 't.addEventListener(' + (modo === 'mayusculas' ? 'E[n].toUpperCase()' : 'E[n]') + ', f);'}
  });
});
window.__etExtra = () => window.__ev.splice(0);`;

const html = (script, attrs = {}) => pagina({ body: tabla({ data: DATOS, cols: COLS_BASE, attrs }) + '<button id="fuera">fuera</button>', script });

export default [
  {
    id: 'secuencia-completa',
    titulo: 'Secuencia de todos los eventos (registrador en los 21 eventos) en un flujo de captura',
    html: html(null),
    pasos: FLUJO,
  },
  {
    id: 'por-events',
    titulo: 'Manejadores del consumidor por Events[Const.Events.X]',
    registro: 'consumer',
    html: html(registrar('prop')),
    pasos: FLUJO,
  },
  {
    id: 'por-addeventlistener',
    titulo: 'Los mismos manejadores por addEventListener (mismo resultado que por Events)',
    registro: 'consumer',
    html: html(registrar('listener')),
    pasos: FLUJO,
  },
  {
    id: 'addeventlistener-mayusculas',
    titulo: 'addEventListener con el nombre en mayúsculas (se compara en minúsculas)',
    registro: 'consumer',
    html: html(registrar('mayusculas')),
    pasos: FLUJO.slice(0, 2),
  },
  {
    id: 'sin-manejadores',
    titulo: 'Sin manejadores (modo consumer: no se agrega ningún registrador)',
    proposito: 'Congela los caminos sin manejador: OnSort no toca Columns[].sort, los badges no son clicables, StartEdition no arma args.',
    registro: 'consumer',
    html: html(`document.addEventListener('DOMContentLoaded', () => { ET('t1').RowBadges = (r, i) => (i === 0 ? [{ text: 'b' }] : null); ET('t1').RefreshBadges(); });`),
    pasos: FLUJO,
  },
  {
    id: 'un-manejador-por-evento',
    titulo: 'addEventListener reemplaza el manejador anterior (uno por evento); removeEventListener no lo quita',
    origen: 'editable.js:3913-3977',
    registro: 'consumer',
    html: html(`window.__ev = [];
document.addEventListener('DOMContentLoaded', () => { const t = ET('t1');
  t.addEventListener('entercell', () => window.__ev.push('primero'));
  const seg = () => window.__ev.push('segundo');
  t.addEventListener('entercell', seg);
  t.removeEventListener('entercell', seg);
});
window.__etExtra = () => window.__ev.splice(0);`),
    pasos: [['clic', h => h.clicCelda('t1', 0, 1)]],
  },
  {
    id: 'nativos-ignorados',
    titulo: 'Eventos nativos (click, keydown) con addEventListener: se ignoran sin native-events',
    origen: 'editable.js:3904-3910',
    html: html(`window.__ev = [];
document.addEventListener('DOMContentLoaded', () => { const t = ET('t1');
  t.addEventListener('click', () => window.__ev.push('click'));
  t.addEventListener('keydown', () => window.__ev.push('keydown'));
  t.addEventListener('desconocido', () => window.__ev.push('desconocido'));
  t.addEventListener(42, () => window.__ev.push('numero'));
});
window.__etExtra = () => window.__ev.splice(0);`),
    pasos: [['clic y tecla', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('ArrowDown'); }]],
  },
  {
    id: 'nativos-con-native-events',
    titulo: 'native-events="true": los nativos pasan si se registran después de inicializar; antes, se pierden',
    origen: 'editable.js:2895, 3908',
    html: html(`window.__ev = [];
const t0 = document.getElementById('t1');
t0.addEventListener('click', () => window.__ev.push('click antes de DOMContentLoaded'));
document.addEventListener('DOMContentLoaded', () => { const t = ET('t1');
  t.addEventListener('click', () => window.__ev.push('click'));
  t.addEventListener('focusin', () => window.__ev.push('focusin'));
  t.addEventListener('fieldupdated', () => window.__ev.push('fieldupdated (de EdiTable)'));
});
window.__etExtra = () => window.__ev.splice(0);`, { 'native-events': 'true' }),
    pasos: [['clic, editar y confirmar', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); await h.escribir('n'); await h.tecla('Enter'); }]],
  },
  {
    id: 'listener-antes-de-cargar',
    titulo: 'addEventListener de un evento de EdiTable antes de DOMContentLoaded (sí funciona)',
    registro: 'consumer',
    html: html(`window.__ev = []; document.getElementById('t1').addEventListener('rowchanged', (e) => window.__ev.push('rowchanged ' + e.previous_index + '->' + e.index));
window.__etExtra = () => window.__ev.splice(0);`),
    pasos: [['clic en dos filas', async h => { await h.clicCelda('t1', 0, 1); await h.clicCelda('t1', 2, 1); }]],
  },
  {
    id: 'reemplazar-events',
    titulo: 'Reemplazar t.Events = {…}: unos eventos leen this.Events y otros la copia (_getCurren)',
    origen: 'contrato §1.16; editable.js:1796, 1945, 2002 vs el resto',
    registro: 'consumer',
    html: html(`window.__ev = [];
document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.Events.entercell = () => window.__ev.push('entercell viejo');
  t.CellFocus(t.GetTrByIndex(0).cells[0]);
  t.Events = { entercell: () => window.__ev.push('entercell nuevo'), startedition: () => window.__ev.push('startedition nuevo'), beforeupdatecell: () => window.__ev.push('beforeupdatecell nuevo'), fieldupdated: () => window.__ev.push('fieldupdated nuevo') };
});
window.__etExtra = () => window.__ev.splice(0);`),
    pasos: [['clic, editar y confirmar', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Enter'); await h.escribir('r'); await h.tecla('Enter'); }]],
  },
  {
    id: 'rowchanged-indices',
    titulo: 'RowChanged: previous_index -1 la primera vez; no se dispara en la misma fila',
    html: html(null),
    pasos: [
      ['clic (2,1)', h => h.clicCelda('t1', 2, 1)],
      ['clic (2,2)', h => h.clicCelda('t1', 2, 2)],
      ['clic (0,0)', h => h.clicCelda('t1', 0, 0)],
    ],
  },
  {
    id: 'beforecellfocus-cancel',
    titulo: 'BeforeCellFocus con cancel: el foco no se mueve',
    registro: 'consumer',
    html: html(`document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.Events[t.EdiTable.Const.Events.BeforeCellFocus] = (e) => { if (t.RowIndexOfTd(e.td) === 2) e.cancel = true; }; });`),
    pasos: [
      ['clic (1,1)', h => h.clicCelda('t1', 1, 1)],
      ['clic (2,1): cancelado', h => h.clicCelda('t1', 2, 1)],
      ['flecha abajo: cancelado', h => h.tecla('ArrowDown')],
    ],
  },
  {
    id: 'isdirtychanged',
    titulo: 'IsDirtyChanged solo cuando el conteo cruza 0',
    origen: 'editable.js:2769-2798',
    html: html(null),
    pasos: [
      ['backup', h => h.js(() => ET('t1').backup())],
      ['cambiar fila 0', h => h.js(() => ET('t1').UpdateDataMember(0, 'nombre', 'A'))],
      ['cambiar fila 1', h => h.js(() => ET('t1').UpdateDataMember(1, 'nombre', 'B'))],
      ['regresar fila 0 a su valor', h => h.js(() => ET('t1').UpdateDataMember(0, 'nombre', 'Producto de prueba 1'))],
      ['regresar fila 1', h => h.js(() => ET('t1').UpdateDataMember(1, 'nombre', 'Producto de prueba 2'))],
    ],
  },
];
