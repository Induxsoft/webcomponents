// v2 §11: agrupación.
import { tabla, PRODUCTOS, CUENTAS } from '../lib/fixtures.mjs';
import { registro, m, arrastrar } from '../lib/v2.mjs';

const { P, t } = registro('grp', { requiere: ['group'] });
const DATOS = [
  { codigo: 'A1', nombre: 'Uno', linea: 'Eléctrico', marca: 'X', cantidad: 2 },
  { codigo: 'A2', nombre: 'Dos', linea: 'Ferretería', marca: 'Y', cantidad: 3 },
  { codigo: 'A3', nombre: 'Tres', linea: 'Eléctrico', marca: 'Y', cantidad: 5 },
  { codigo: 'A4', nombre: 'Cuatro', linea: 'Ferretería', marca: 'Y', cantidad: 7 },
  { codigo: 'A5', nombre: 'Cinco', linea: 'Eléctrico', marca: 'X', cantidad: 11 },
];
const COLS = (x = {}) => [
  { field: 'codigo', title: 'Código', ...(x.codigo ?? {}) }, { field: 'nombre', title: 'Nombre', ...(x.nombre ?? {}) },
  { field: 'linea', title: 'Línea', ...(x.linea ?? {}) }, { field: 'marca', title: 'Marca', ...(x.marca ?? {}) },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', summary: 'sum', ...(x.cantidad ?? {}) },
];
const pag = (x = {}, a = {}, script = '') => ({ body: tabla({ a: { 'group-panel': 'true', ...a }, cols: COLS(x), data: x.data ?? DATOS }), script });
const grupos = (c) => c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr.et-group-row')).map(tr => ({ nivel: tr.getAttribute('data-level'), llave: tr.getAttribute('data-key'), txt: tr.textContent.replace(/\s+/g, ' ').trim() })));
const orden = (c) => c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr')).filter(tr => !tr.classList.contains('et-spacer')).map(tr => tr.classList.contains('et-group-row') ? 'G:' + tr.getAttribute('data-key') : (tr.cells[0].querySelector('[iscellcontent]') || tr.cells[0]).textContent));
const grabar = "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.ev=[];['BeforeGroup','GroupChanged','GroupToggled'].forEach(n=>t.addEventListener(n,(e)=>{window.ev.push([n,JSON.parse(JSON.stringify({...e,sender:undefined}))]);if(window.cancelar&&n==='BeforeGroup')e.cancel=true;}));});";

t('01', 'group-panel="true": div.et-group-panel hermano de la tabla, que no la envuelve', ['§11-a', '§0-R1'], async (c) => {
  await c.abrir(pag());
  c.igual(await c.ev(() => { const s = __ct.sr('t1'); const gp = s.querySelector('div.et-group-panel'); const tb = s.querySelector('table'); return gp ? [gp.contains(tb), tb.parentElement.contains(gp) && tb.parentElement !== gp.parentElement, !!(gp.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING)] : null; }), [false, false, true]);
});
t('02', 'GroupBy([field]): filas de grupo tr.et-group-row con data-level y data-key; ordena por el campo y conserva el orden previo', ['§11-d', '§11-e', '§11-g'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  c.igual(await orden(c), ['G:Eléctrico', 'A1', 'A3', 'A5', 'G:Ferretería', 'A2', 'A4']);
  c.igual((await grupos(c)).map(g => g.nivel), ['0', '0']);
});
t('03', 'DataArray no se reordena por agrupar (I3)', ['§11-g', '§0-R2'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  c.igual((await c.datos()).map(x => x.codigo), ['A1', 'A2', 'A3', 'A4', 'A5']);
});
t('04', 'la fila de grupo muestra la llave, el número de filas y los subtotales de las columnas con summary', ['§11-e'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  const g = await grupos(c);
  c.ok(g[0].txt.includes('Eléctrico') && /\b3\b/.test(g[0].txt) && /\b18\b/.test(g[0].txt), 'grupo Eléctrico: ' + g[0].txt);
  c.ok(g[1].txt.includes('Ferretería') && /\b2\b/.test(g[1].txt) && /\b10\b/.test(g[1].txt), 'grupo Ferretería: ' + g[1].txt);
});
t('05', 'group-summary="inline": una celda por columna en la fila de grupo', ['§11-e'], async (c) => {
  await c.abrir(pag({}, { 'group-summary': 'inline' }));
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  c.igual(await c.ev(() => { const tr = __ct.sr('t1').querySelector('tbody > tr.et-group-row'); return [tr.cells.length, tr.cells[4].textContent.trim()]; }), [5, '18']);
});
t('06', 'varios niveles', ['§11-b', '§11-d'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea', 'marca']));
  c.igual(await orden(c), ['G:Eléctrico', 'G:X', 'A1', 'A5', 'G:Y', 'A3', 'G:Ferretería', 'G:Y', 'A2', 'A4']);
  c.igual((await grupos(c)).map(g => g.nivel), ['0', '1', '1', '0', '1']);
  c.igual(await m(c, 't1', 'getGroups'), ['linea', 'marca']);
});
t('07', 'Ungroup() vuelve a la lista normal', ['§11-d'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = __ct.t('t1'); t.GroupBy(['linea']); t.Ungroup(); });
  c.igual(await orden(c), ['A1', 'A2', 'A3', 'A4', 'A5']);
});
t('08', 'CollapseGroup(path)/ExpandGroup(path) y GroupToggled {path, expanded}', ['§11-d', '§11-j'], async (c) => {
  await c.abrir(pag({}, {}, grabar));
  await c.ev(() => { const t = __ct.t('t1'); t.GroupBy(['linea', 'marca']); t.CollapseGroup(['Eléctrico', 'X']); });
  const vis = () => c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr')).filter(tr => !tr.classList.contains('et-spacer') && !tr.classList.contains('et-group-row') && getComputedStyle(tr).display !== 'none').map(tr => tr.cells[0].textContent.trim()));
  c.igual(await vis(), ['A3', 'A2', 'A4']);
  await c.ev(() => __ct.t('t1').ExpandGroup(['Eléctrico', 'X']));
  c.igual(await vis(), ['A1', 'A5', 'A3', 'A2', 'A4']);
  c.igual((await c.ev(() => window.ev)).filter(e => e[0] === 'GroupToggled').map(e => [e[1].path, e[1].expanded]), [[['Eléctrico', 'X'], false], [['Eléctrico', 'X'], true]]);
});
t('09', 'CollapseAllGroups / ExpandAllGroups', ['§11-d'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.GroupBy(['linea']); t.CollapseAllGroups(); const v = () => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-group-row):not(.et-spacer)')).filter(tr => getComputedStyle(tr).display !== 'none').length; const a = v(); t.ExpandAllGroups(); return [a, v()]; });
  c.igual(r, [0, 5]);
});
t('10', 'las filas de grupo no tienen índice de datos: CurrentRowIndex y DataArray siguen alineados (R2)', ['§11-e', '§0-R2'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  const r = await c.ev(() => { const t = __ct.t('t1'); const tr = Array.from(__ct.sr('t1').querySelectorAll('tbody > tr')).find(x => !x.classList.contains('et-group-row') && x.cells[0].textContent.trim() === 'A4'); t.CellFocus(tr.cells[1]); return [t.CurrentRowIndex(), t.DataArray[t.CurrentRowIndex()].codigo, t.TRCount()]; });
  c.igual(r.slice(0, 2), [3, 'A4']);
});
t('11', 'flechas recorren las filas de grupo; Enter o Espacio la colapsan/expanden; no se editan', ['§11-f'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  const h = await c.page.evaluateHandle(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr')).find(x => !x.classList.contains('et-group-row')).cells[0]);
  await h.asElement().click(); await c.esperar(30);
  await c.tecla('ArrowUp');
  c.igual(await c.ev(() => { const a = __ct.sr('t1').activeElement; return !!(a && a.closest && a.closest('tr.et-group-row')); }), true, 'el foco queda en la fila de grupo');
  await c.tecla('Enter');
  c.igual(await c.ev(() => [__ct.t('t1').Editing, Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-group-row)')).filter(tr => getComputedStyle(tr).display !== 'none').length]), [false, 2]);
  await c.tecla('Space');
  c.igual(await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr:not(.et-group-row)')).filter(tr => getComputedStyle(tr).display !== 'none').length), 5);
});
t('12', 'arrastrar un th al panel agrupa; la chip se quita con ×', ['§11-b'], async (c) => {
  await c.abrir(pag());
  await arrastrar(c, 't1', 'thead th[field="linea"]', 'div.et-group-panel');
  c.igual(await m(c, 't1', 'getGroups'), ['linea']);
  await c.ev(() => { const chip = __ct.sr('t1').querySelector('div.et-group-panel [data-field="linea"], div.et-group-panel .et-group-chip'); const x = chip && (chip.querySelector('[data-remove], .et-chip-remove, button') || chip); x.click(); });
  c.igual(await m(c, 't1', 'getGroups'), []);
});
t('13', 'las chips se reordenan arrastrándolas', ['§11-b'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea', 'marca']));
  await arrastrar(c, 't1', 'div.et-group-panel > :nth-last-child(1)', 'div.et-group-panel > :nth-child(1)', { dx: 0.1 });
  c.igual(await m(c, 't1', 'getGroups'), ['marca', 'linea']);
});
t('14', 'groupable="false": no se puede agrupar por esa columna', ['§11-c'], async (c) => {
  await c.abrir(pag({ nombre: { groupable: 'false' } }));
  await arrastrar(c, 't1', 'thead th[field="nombre"]', 'div.et-group-panel');
  c.igual(await m(c, 't1', 'getGroups'), []);
});
t('15', 'BeforeGroup {groups, cancel} cancelable y GroupChanged {groups}', ['§11-j'], async (c) => {
  await c.abrir(pag({}, {}, grabar));
  await c.ev(() => { window.cancelar = true; __ct.t('t1').GroupBy(['linea']); });
  c.igual(await m(c, 't1', 'getGroups'), []);
  await c.ev(() => { window.cancelar = false; __ct.t('t1').GroupBy(['linea']); });
  const e = await c.ev(() => window.ev);
  c.igual(e.map(x => [x[0], x[1].groups]), [['BeforeGroup', ['linea']], ['BeforeGroup', ['linea']], ['GroupChanged', ['linea']]]);
  c.ok('cancel' in e[0][1], 'BeforeGroup trae cancel');
});
t('16', 'con show-tree gana el árbol y hay un aviso en consola', ['§11-h'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'group-panel': 'true', 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols: [{ field: 'cuenta', title: 'Cuenta' }, { field: 'nombre', title: 'Nombre' }], data: CUENTAS }) });
  await c.ev(() => { try { __ct.t('t1').GroupBy(['nombre']); } catch (e) { } });
  c.igual(await c.ev(() => [!!__ct.sr('t1').querySelector('tr.et-group-row'), !!__ct.sr('t1').querySelector('span.collapse-btn')]), [false, true]);
  c.ok(c.consola.some(x => x.tipo === 'warning' || x.tipo === 'error'), 'aviso por consola');
});
t('17', 'AutoAddRow con agrupación: la fila nueva va al final de DataArray y aparece en su grupo al confirmarse', ['§11-i'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = __ct.t('t1'); t.GroupBy(['linea']); const i = t.DataArray.length; t.AddRow(); /* AddRow solo crea la fila en el DOM; la entrada nace al editar (ver AJUSTES.md, sum-13) */ t.UpdateDataMember(i, 'codigo', 'A6'); t.UpdateDataMember(i, 'linea', 'Eléctrico'); });
  await c.cuadro();
  c.igual((await c.datos()).map(x => x.codigo).pop(), 'A6');
  const o = await orden(c);
  c.ok(o.indexOf('A6') > o.indexOf('G:Eléctrico') && o.indexOf('A6') < o.indexOf('G:Ferretería'), 'orden: ' + o.join(','));
});
t('18', 'la agrupación queda en layout.groups', ['§11-k', '§9-a'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  c.igual((await c.ev(() => __ct.t('t1').getLayout())).groups, ['linea']);
}, { requiere: ['layout'] });
t('19', 'ordenar con clic dentro de la agrupación ordena dentro de cada grupo', ['§11-g'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  await c.clicTh('t1', 'cantidad'); await c.clicTh('t1', 'cantidad');
  c.igual(await orden(c), ['G:Eléctrico', 'A5', 'A3', 'A1', 'G:Ferretería', 'A4', 'A2']);
});
t('20', 'sin group-panel no hay panel (R1)', ['§11-a', '§0-R1'], async (c) => {
  await c.abrir({ body: tabla({ cols: COLS({ cantidad: { summary: undefined } }), data: DATOS }) });
  c.igual(await c.ev(() => !!__ct.sr('t1').querySelector('.et-group-panel')), false);
}, { requiere: [] });

export default { nombre: 'v2-agrupacion', grupo: 'v2', pruebas: P };
