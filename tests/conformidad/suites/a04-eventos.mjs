// Actual: eventos (orden y forma de eventArgs), registro y cancelación. Contrato §2.6-2.8.
import { tabla, paginaProductos } from '../lib/fixtures.mjs';

const P = [];
const t = (id, titulo, fn, x = {}) => P.push({ id: 'evt-' + id, titulo, spec: ['A.eventos'], fn, ...x });
const grabar = (c, n) => c.ev((n) => __ct.grabar('t1', n), n);
const nombres = async (c) => (await c.log()).map(x => x.ev);
const claves = (o) => Object.keys(o).sort();

t('01', 'primer foco: beforecellfocus → entercell → rowchanged (previous_index -1)', async (c) => {
  await c.abrir(paginaProductos());
  await grabar(c);
  await c.clic('t1', 1, 1);
  const l = await c.log();
  c.igual(l.map(x => x.ev), ['beforecellfocus', 'entercell', 'rowchanged']);
  c.igual(claves(l[0].a), ['cancel', 'index', 'previous_index', 'sender', 'td'].filter(k => k in l[0].a).sort());
  c.igual(l[1].a.td.r, 1); c.igual(l[1].a.td.c, 1);
  c.igual([l[2].a.index, l[2].a.previous_index, l[2].a.cancel], [1, -1, false]);
});
t('02', 'cambiar de celda en la misma fila: beforecellfocus → leavecell → entercell (sin rowchanged)', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 1);
  await grabar(c);
  await c.clic('t1', 1, 2);
  const l = await c.log();
  c.igual(l.map(x => x.ev), ['beforecellfocus', 'leavecell', 'entercell']);
  c.igual(l[2].a.td.c, 2);
  c.igual(claves(l[1].a), ['sender', 'td']);
});
t('02b', 'LeaveCell recibe la celda que se deja', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 1);
  await grabar(c, ['leavecell']);
  await c.clic('t1', 1, 2);
  const l = await c.log();
  c.ok(l[0].a.td && l[0].a.td.c === 1, 'td de LeaveCell: ' + JSON.stringify(l[0].a.td));
}, { defecto: 'D-LEAVE (td llega como null: el selector ya se quitó del DOM cuando se dispara, línea 2045-2049)' });
t('03', 'cambiar de fila: rowchanged con index y previous_index', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 1);
  await grabar(c, ['rowchanged']);
  await c.clic('t1', 3, 0);
  const l = await c.log();
  c.igual(l.map(x => [x.ev, x.a.index, x.a.previous_index]), [['rowchanged', 3, 1]]);
  c.igual(claves(l[0].a), ['cancel', 'index', 'previous_index', 'sender', 'td']);
});
t('04', 'editar y confirmar con Enter: startedition, inputcreated, beforesetinput, beforeupdatecell, confirmedition, fieldupdated', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1);
  await grabar(c);
  await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'Nuevo'; });
  await c.tecla('Enter');
  const l = await c.log();
  const ed = l.map(x => x.ev).filter(n => !['beforecellfocus', 'leavecell', 'entercell'].includes(n));
  c.igual(ed, ['startedition', 'inputcreated', 'beforesetinput', 'beforeupdatecell', 'confirmedition', 'fieldupdated']);
  const by = Object.fromEntries(l.map(x => [x.ev, x.a]));
  c.igual(claves(by.startedition), ['coldef', 'sender', 'td', 'text']);
  c.igual(by.startedition.coldef.field, 'nombre');
  c.igual(claves(by.inputcreated), ['coldef', 'input', 'sender', 'td', 'text']);
  c.igual(by.inputcreated.text, 'Tornillo hexagonal');
  c.igual(claves(by.beforeupdatecell), ['cancel', 'coldef', 'input', 'sender', 'td', 'text']);
  c.igual(by.beforeupdatecell.text, 'Nuevo');
  c.igual(by.confirmedition.input, '$undefined', 'ConfirmEdition recibe input=undefined');
  c.igual(by.fieldupdated, { sender: '$sender', row: 0, field: 'nombre', value: 'Nuevo' });
});
// F1 (C17): confirmar sin cambiar no dispara FieldUpdated; con un cambio real, sí.
t('05', 'el orden completo al confirmar con Enter sin cambiar (navega a la derecha): sin FieldUpdated (C17)', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1);
  await c.tecla('Enter');
  await grabar(c);
  await c.tecla('Enter');
  c.igual(await nombres(c), ['beforecellfocus', 'beforeupdatecell', 'confirmedition', 'entercell']);
});
t('05b', 'el orden completo al confirmar con Enter después de cambiar el valor: con FieldUpdated', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1);
  await c.tecla('Enter');
  await c.escribir('x');
  await grabar(c);
  await c.tecla('Enter');
  c.igual(await nombres(c), ['beforecellfocus', 'beforeupdatecell', 'confirmedition', 'fieldupdated', 'entercell']);
});
t('06', 'InputCreated y BeforeSetInput reciben el mismo objeto; BeforeSetInput puede cambiar text', async (c) => {
  await c.abrir(paginaProductos({ script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');
    t.Events.inputcreated=(e)=>{window.objA=e;}; t.Events.beforesetinput=(e)=>{window.mismo=(e===window.objA); e.text='cambiado';};});` }));
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  c.igual(await c.ev(() => [window.mismo, __ct.t('t1').shadowRoot.querySelector('#__table_input').value]), [true, 'cambiado']);
});
t('07', 'BeforeUpdateCell con cancel: sigue editando y DataArray no cambia', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').Events.beforeupdatecell=(e)=>{e.cancel=true;};});" }));
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'X'; });
  await c.tecla('Enter');
  c.igual(await c.ev(() => [__ct.t('t1').Editing, !!__ct.t('t1').shadowRoot.querySelector('#__table_input')]), [true, true]);
  c.igual((await c.datos())[0].nombre, 'Tornillo hexagonal');
});
t('08', 'ConfirmEdition con cancel: no se escribe en DataArray', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').Events.confirmedition=(e)=>{e.cancel=true;};});" }));
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'X'; });
  const r = await c.ev(() => { const e = __ct.t('t1'); return e.ConfirmEdit(e.CurrentTd()); });
  c.igual(r, false);
  c.igual((await c.datos())[0].nombre, 'Tornillo hexagonal');
});
t('09', 'BeforeCellFocus con cancel: el selector no se mueve', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 0);
  await c.ev(() => { __ct.t('t1').Events.beforecellfocus = (e) => { e.cancel = true; }; });
  await c.clic('t1', 2, 2);
  c.igual(await c.ev(() => { const e = __ct.t('t1'); return [e.CurrentRowIndex(), e.CurrentColIndex()]; }), [0, 0]);
});
t('10', 'CancelEdition con {td, sender} al presionar Esc', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await grabar(c, ['canceledition']);
  await c.tecla('Escape');
  const l = await c.log();
  c.igual(l.map(x => x.ev), ['canceledition']);
  c.igual(claves(l[0].a), ['sender', 'td']);
});
t('11', 'BeforeRowDelete y RowDeleted reciben el mismo objeto {sender,rowIndex,cancel}; cancel evita borrar', async (c) => {
  await c.abrir(paginaProductos({ script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');
    t.Events.beforerowdelete=(e)=>{window.a=e; if(window.cancelar) e.cancel=true;}; t.Events.rowdeleted=(e)=>{window.mismo=(e===window.a); window.args=Object.keys(e).sort();};});` }));
  await c.ev(() => { window.cancelar = true; __ct.t('t1').DeleteRow(1); });
  c.igual((await c.datos()).length, 4);
  const r = await c.ev(() => { window.cancelar = false; const ok = __ct.t('t1').DeleteRow(1); return [ok, window.mismo, window.args, window.a.rowIndex]; });
  c.igual(r, [true, true, ['cancel', 'rowIndex', 'sender'], 1]);
});
t('12', 'RowAdded {sender, tr, rowIndex}', async (c) => {
  await c.abrir(paginaProductos());
  await grabar(c, ['rowadded']);
  await c.ev(() => __ct.t('t1').AddRow());
  const l = await c.log();
  c.igual(claves(l[0].a), ['rowIndex', 'sender', 'tr']);
  c.igual([l[0].a.rowIndex, l[0].a.tr.$el], [4, 'tr']);
});
t('13', 'IsDirtyChanged (sin argumentos) al cruzar de limpio a sucio y de vuelta', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => { const e = __ct.t('t1'); e.backup(); window.n = 0; e.Events.isdirtychanged = function () { window.n++; window.nargs = arguments.length; }; });
  await c.ev(() => __ct.t('t1').UpdateDataMember(0, 'nombre', 'otro'));
  c.igual(await c.ev(() => [__ct.t('t1').IsDirty, window.n, window.nargs]), [true, 1, 0]);
  await c.ev(() => __ct.t('t1').UpdateDataMember(1, 'nombre', 'otro2'));
  c.igual(await c.ev(() => window.n), 1, 'segunda fila sucia no vuelve a disparar');
  await c.ev(() => { __ct.t('t1').UpdateDataMember(0, 'nombre', 'Tornillo hexagonal'); __ct.t('t1').UpdateDataMember(1, 'nombre', 'Arandela plana'); });
  c.igual(await c.ev(() => [__ct.t('t1').IsDirty, window.n]), [false, 2]);
});
t('14', 'OnSort {th, coldef, caption} se dispara antes de ordenar y coldef.sort trae ASC/DESC', async (c) => {
  await c.abrir(paginaProductos({ script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');
    window.s=[]; t.Events.onsort=(e)=>{window.s.push({k:Object.keys(e).sort(), caption:e.caption, sort:e.coldef.sort, th:e.th.getAttribute('field'), primero:t.DataArray[0].codigo});};});` }));
  await c.clicTh('t1', 0);
  await c.clicTh('t1', 0);
  const s = await c.ev(() => window.s);
  c.igual(s[0], { k: ['caption', 'coldef', 'th'], caption: 'Código', sort: 'ASC', th: 'codigo', primero: 'P-003' });
  c.igual([s[1].sort, s[1].primero], ['DESC', 'P-001']);
});
t('15', 'addEventListener: nombre sin distinguir mayúsculas, reemplaza al anterior, mismo objeto que Events', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => {
    const t = __ct.t('t1'); const a = () => 'a'; const b = () => 'b';
    t.addEventListener('FieldUpdated', a); const r1 = t.Events.fieldupdated === a;
    t.addEventListener('fieldupdated', b); const r2 = t.Events.fieldupdated === b;
    return [r1, r2];
  });
  c.igual(r, [true, true]);
});
t('16', 'addEventListener con un evento que no es de EdiTable se ignora (sin native-events)', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); window.n = 0; t.addEventListener('click', () => window.n++); t.click(); return window.n; });
  c.igual(r, 0);
});
t('17', 'native-events="true": los eventos nativos pasan a HTMLElement.addEventListener', async (c) => {
  await c.abrir(paginaProductos({ a: { 'native-events': 'true' } }));
  const r = await c.ev(() => { const t = __ct.t('t1'); window.n = 0; t.addEventListener('click', () => window.n++); t.click(); return window.n; });
  c.igual(r, 1);
});
t('18', 'LostFocus se dispara (sin argumentos) cuando el foco sale del componente', async (c) => {
  await c.abrir(paginaProductos({ body: '<input id="fuera">' }));
  await c.ev(() => { window.n = 0; __ct.t('t1').Events.lostfocus = () => window.n++; });
  await c.foco('t1', 0, 0);
  await c.ev(() => document.getElementById('fuera').focus());
  await c.esperar(1300);
  c.igual(await c.ev(() => window.n), 1);
}, { limite: 8000 });
t('19', 'FieldUpdated no se dispara con stopfire', async (c) => {
  await c.abrir(paginaProductos());
  await grabar(c, ['fieldupdated']);
  await c.ev(() => { __ct.t('t1').UpdateDataMember(0, 'nombre', 'x', true); __ct.t('t1').UpdateDataMember(0, 'nombre', 'y'); });
  c.igual((await c.log()).map(x => x.a.value), ['y']);
});
t('20', 'sender: copia con los métodos flecha atados a la instancia real', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => { __ct.t('t1').Events.entercell = (e) => { window.snd = e.sender; }; });
  await c.foco('t1', 2, 1);
  const r = await c.ev(() => { const s = window.snd; const t = __ct.t('t1'); return [s === t, typeof s.UpdateRow, s.CurrentRowIndex(), s.DataArray === t.DataArray, s.Events === t.Events, s.tableId]; });
  c.igual(r, [false, 'function', 2, true, true, 't1']);
});

export default { nombre: 'actual-eventos', grupo: 'actual', pruebas: P };
