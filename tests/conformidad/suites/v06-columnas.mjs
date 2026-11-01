// v2 §6 (columnas fijas), §7 (mostrar y ocultar, selector de columnas) y §8 (reordenar).
import { tabla, PRODUCTOS } from '../lib/fixtures.mjs';
import { registro, m, campos, camposDom, filaTxt, arrastrar } from '../lib/v2.mjs';

const COLS = (x = {}) => [
  { field: 'codigo', type: 'Text', title: 'Código', width: '90px', ...(x.codigo ?? {}) },
  { field: 'nombre', type: 'Text', title: 'Nombre', width: '200px', ...(x.nombre ?? {}) },
  { field: 'linea', type: 'Text', title: 'Línea', width: '120px', ...(x.linea ?? {}) },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', width: '90px', ...(x.cantidad ?? {}) },
  { field: 'precio', type: 'Number', title: 'Precio', width: '100px', ...(x.precio ?? {}) },
];
const pag = (x = {}, a = {}, script = '') => ({ body: `<div style="width:420px;overflow:auto">${tabla({ a, cols: COLS(x), data: PRODUCTOS, style: 'display:block;width:900px' })}</div>`, script });
const grabar = (ev) => `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.ev=[];${ev.map(e => `t.addEventListener('${e}',(a)=>window.ev.push(['${e}',JSON.parse(JSON.stringify({...a,sender:undefined,layout:undefined}))]));`).join('')}});`;
const evs = (c) => c.ev(() => window.ev);

// ---------- §6 columnas fijas ----------
const { P: P6, t: f } = registro('fij', { requiere: ['fixed'] });
const sticky = (c) => c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('thead > tr > th')).map(th => { const cs = getComputedStyle(th); return { field: th.getAttribute('field'), pos: cs.position, left: cs.left, last: th.classList.contains('et-fixed-last') }; }));

f('01', 'fixed="left": las fijas se agrupan a la izquierda conservando su orden entre sí', ['§6-a', '§6-b'], async (c) => {
  await c.abrir(pag({ linea: { fixed: 'left' }, codigo: { fixed: 'left' } }));
  c.igual(await campos(c), ['codigo', 'linea', 'nombre', 'cantidad', 'precio']);
  c.igual(await camposDom(c), ['codigo', 'linea', 'nombre', 'cantidad', 'precio']);
  c.igual((await filaTxt(c, 't1', 0)).slice(0, 2), ['P-003', 'Ferretería']);
});
f('02', 'position sticky en th y td de las fijas, con left = suma de anchos anteriores; et-fixed-last en la última', ['§6-c', '§6-d'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' }, nombre: { fixed: 'left' } }));
  const r = await c.ev(() => {
    const ths = Array.from(__ct.sr('t1').querySelectorAll('thead > tr > th'));
    const td = __ct.td('t1', 0, 1); const cs = getComputedStyle(td);
    return { w0: ths[0].getBoundingClientRect().width, l1: parseFloat(getComputedStyle(ths[1]).left), tdPos: cs.position, tdLeft: parseFloat(cs.left), bg: cs.backgroundColor, last: ths.map(th => th.classList.contains('et-fixed-last')), tdLast: td.classList.contains('et-fixed-last'), pos2: getComputedStyle(ths[2]).position };
  });
  // Ajuste (AJUSTES.md): el CSS base ya pone position: relative en los th; un th no fijo puede ser relative o static.
  c.igual(r.tdPos, 'sticky');
  c.ok(['relative', 'static'].includes(r.pos2), 'th no fijo sin sticky: ' + r.pos2);
  c.cerca(r.l1, r.w0, 1.5, 'left de la segunda fija');
  c.cerca(r.tdLeft, r.w0, 1.5, 'left del td');
  c.ok(r.bg !== 'rgba(0, 0, 0, 0)' && r.bg !== 'transparent', 'fondo sólido: ' + r.bg);
  c.igual(r.last, [false, true, false, false, false]);
  c.igual(r.tdLast, true);
});
f('03', 'z-index de las fijas: mayor que el del cuerpo y menor que el del encabezado', ['§6-c'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' } }));
  const r = await c.ev(() => { const z = (el) => parseInt(getComputedStyle(el).zIndex) || 0; return { td: z(__ct.td('t1', 0, 0)), tdNormal: z(__ct.td('t1', 0, 2)), thead: z(__ct.sr('t1').querySelector('thead')), th: z(__ct.th('t1', 0)) }; });
  c.ok(r.td > r.tdNormal, `td fijo ${r.td} > td normal ${r.tdNormal}`);
  c.ok(r.td < Math.max(r.thead, r.th), `td fijo ${r.td} < encabezado ${Math.max(r.thead, r.th)}`);
});
f('04', 'al desplazar horizontalmente la columna fija no se mueve', ['§6-c'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' } }));
  const r = await c.ev(async () => { const cont = __ct.t('t1').parentElement; const td = __ct.td('t1', 0, 0); const x0 = td.getBoundingClientRect().left; const x2 = __ct.td('t1', 0, 2).getBoundingClientRect().left; cont.scrollLeft = 250; await __ct.cuadro(); return [x0, td.getBoundingClientRect().left, __ct.td('t1', 0, 2).getBoundingClientRect().left - x2 + x0]; });
  c.ok(r[2] < r[0] - 200, 'precondición: el contenedor sí se desplazó (la columna 2 se movió)');
  c.cerca(r[1], r[0], 1, 'la fija queda en su lugar');
});
f('05', 'FixColumn(field,true) mueve la columna al final del grupo de fijas; IsColumnFixed; ColumnFixedChanged', ['§6-a', '§6-b', '§6-g'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' } }, {}, grabar(['ColumnFixedChanged'])));
  await c.ev(() => __ct.t('t1').FixColumn('precio', true));
  c.igual(await campos(c), ['codigo', 'precio', 'nombre', 'linea', 'cantidad']);
  c.igual(await c.ev(() => [__ct.t('t1').IsColumnFixed('precio'), __ct.t('t1').IsColumnFixed('nombre')]), [true, false]);
  c.igual((await evs(c)).map(x => [x[1].field, x[1].fixed]), [['precio', true]]);
  c.igual((await filaTxt(c, 't1', 0))[1], '2.5');
});
f('06', 'FixColumn(field,false) suelta la columna (deja de ser sticky)', ['§6-a', '§6-g'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' }, nombre: { fixed: 'left' } }));
  await c.ev(() => __ct.t('t1').FixColumn('codigo', false));
  const s = await sticky(c);
  // Ajuste (AJUSTES.md): basta con que deje de ser sticky (el CSS base de los th es relative).
  const pos = s.find(x => x.field === 'codigo').pos;
  c.ok(pos !== 'sticky' && ['relative', 'static'].includes(pos), 'codigo ya no es sticky: ' + pos);
  c.igual(s.find(x => x.field === 'nombre').last, true);
});
f('07', 'las posiciones se recalculan al ocultar una columna fija anterior', ['§6-e'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' }, nombre: { fixed: 'left' } }));
  await c.ev(() => __ct.t('t1').hideColumn('codigo', true));
  await c.cuadro();
  const n = (await sticky(c)).find(x => x.field === 'nombre');
  c.igual(n.pos, 'sticky');
  c.cerca(parseFloat(n.left), 0, 1);
});
f('08', 'las posiciones se recalculan al cambiar el ancho de una fija (arrastrando el borde)', ['§6-e'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' }, nombre: { fixed: 'left' } }));
  const h = await c.page.evaluateHandle(() => __ct.th('t1', 0).querySelector('.sizable-border'));
  const b = await h.asElement().boundingBox();
  await c.page.mouse.move(b.x + b.width / 2, b.y + 5); await c.page.mouse.down(); await c.page.mouse.move(b.x + 80, b.y + 5, { steps: 4 }); await c.page.mouse.up();
  await c.cuadro();
  const r = await c.ev(() => [__ct.th('t1', 0).getBoundingClientRect().width, parseFloat(getComputedStyle(__ct.th('t1', 1)).left)]);
  c.cerca(r[1], r[0], 1.5, 'left = nuevo ancho');
});
f('09', 'no se crean tablas ni contenedores nuevos alrededor de la tabla', ['§6-f', '§0-R1'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' } }));
  c.igual(await c.ev(() => { const s = __ct.sr('t1'); const tb = s.querySelector('table'); return [s.querySelectorAll('table').length, tb.parentElement.parentNode === s, tb.parentElement.children.length]; }), [1, true, 1]);
});
f('10', 'fija + RowSelected: la celda fija de la fila actual conserva el color de selección', ['§6-c'], async (c) => {
  await c.abrir(pag({ codigo: { fixed: 'left' } }));
  await c.foco('t1', 1, 2);
  c.igual(await c.ev(() => getComputedStyle(__ct.td('t1', 1, 0)).backgroundColor === getComputedStyle(__ct.td('t1', 1, 3)).backgroundColor), true);
});

// ---------- §7 mostrar y ocultar ----------
const { P: P7, t: v } = registro('vis', { requiere: ['chooser'] });
v('01', 'hideColumn(field) conserva su efecto; hideColumns sigue siendo índices de celda', ['§7-a'], async (c) => {
  await c.abrir(pag());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.hideColumn('linea', true); return t.hideColumns; }), [2]);
}, { requiere: [] });
v('02', 'HideColumn/ShowColumn/IsColumnVisible/getVisibleColumns', ['§7-b'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.HideColumn('nombre'); const a = [t.IsColumnVisible('nombre'), t.getVisibleColumns().map(x => typeof x === 'string' ? x : x.field), t.hideColumns.slice(), __ct.th('t1', 1).classList.contains('hidde-col')]; t.ShowColumn('nombre'); return [a, t.IsColumnVisible('nombre'), t.hideColumns.slice()]; });
  c.igual(r, [[false, ['codigo', 'linea', 'cantidad', 'precio'], [1], true], true, []]);
});
v('03', 'ColumnVisibilityChanged {field, visible}', ['§7-g'], async (c) => {
  await c.abrir(pag({}, {}, grabar(['ColumnVisibilityChanged'])));
  await c.ev(() => { const t = __ct.t('t1'); t.HideColumn('linea'); t.ShowColumn('linea'); });
  c.igual((await evs(c)).map(x => [x[1].field, x[1].visible]), [['linea', false], ['linea', true]]);
});
v('04', 'column-chooser="true": botón et-chooser-btn en la esquina del encabezado', ['§7-c'], async (c) => {
  await c.abrir(pag({}, { 'column-chooser': 'true' }));
  c.igual(await c.ev(() => !!__ct.sr('t1').querySelector('.et-chooser-btn')), true);
});
v('05', 'el menú et-chooser es hermano de la tabla dentro del shadow (no la envuelve) y tiene una casilla por columna', ['§7-d', '§7-e'], async (c) => {
  await c.abrir(pag({}, { 'column-chooser': 'true' }));
  await c.ev(() => __ct.sr('t1').querySelector('.et-chooser-btn').click()); await c.cuadro();
  const r = await c.ev(() => { const s = __ct.sr('t1'); const mn = s.querySelector('.et-chooser'); const tb = s.querySelector('table'); return mn ? [mn.contains(tb), getComputedStyle(mn).display !== 'none', mn.querySelectorAll('input[type=checkbox]').length, ['absolute', 'fixed'].includes(getComputedStyle(mn).position)] : null; });
  c.igual(r, [false, true, 5, true]);
});
v('06', 'clic derecho en un th abre el menú', ['§7-c'], async (c) => {
  await c.abrir(pag({}, { 'column-chooser': 'true' }));
  await c.clicTh('t1', 1, { boton: 'right' });
  c.igual(await c.ev(() => { const mn = __ct.sr('t1').querySelector('.et-chooser'); return !!mn && getComputedStyle(mn).display !== 'none'; }), true);
});
v('07', 'desmarcar una casilla oculta la columna y dispara ColumnVisibilityChanged', ['§7-e', '§7-g'], async (c) => {
  await c.abrir(pag({}, { 'column-chooser': 'true' }, grabar(['ColumnVisibilityChanged'])));
  await c.ev(() => __ct.sr('t1').querySelector('.et-chooser-btn').click()); await c.cuadro();
  await c.ev(() => { const cb = Array.from(__ct.sr('t1').querySelectorAll('.et-chooser input[type=checkbox]'))[2]; cb.click(); });
  c.igual(await c.ev(() => __ct.t('t1').IsColumnVisible('linea')), false);
  c.igual((await evs(c)).map(x => x[1].field), ['linea']);
});
v('08', 'el menú ofrece "Fijar o soltar", "Ajustar ancho" y "Restablecer diseño"', ['§7-e'], async (c) => {
  await c.abrir(pag({}, { 'column-chooser': 'true' }));
  await c.clicTh('t1', 1, { boton: 'right' });
  const txt = await c.ev(() => (__ct.sr('t1').querySelector('.et-chooser') || {}).textContent || '');
  c.ok(/fijar/i.test(txt) && /ancho/i.test(txt) && /restablecer/i.test(txt), 'texto del menú: ' + txt.slice(0, 200));
});
v('09', 'chooser="false": la columna no aparece en el menú', ['§7-f'], async (c) => {
  await c.abrir(pag({ codigo: { chooser: 'false' } }, { 'column-chooser': 'true' }));
  await c.ev(() => __ct.sr('t1').querySelector('.et-chooser-btn').click()); await c.cuadro();
  c.igual(await c.ev(() => __ct.sr('t1').querySelectorAll('.et-chooser input[type=checkbox]').length), 4);
});
v('10', 'siempre queda al menos una columna visible', ['§7-f'], async (c) => {
  await c.abrir(pag());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); ['codigo', 'nombre', 'linea', 'cantidad', 'precio'].forEach(f => t.HideColumn(f)); return t.getVisibleColumns().length; }), 1);
});
v('11', 'ocultar la columna de la celda actual mueve el foco a una visible', ['§7-b'], async (c) => {
  await c.abrir(pag());
  await c.foco('t1', 1, 1);
  await c.ev(() => __ct.t('t1').HideColumn('nombre'));
  c.igual(await c.ev(() => { const td = __ct.t('t1').CurrentTd(); return td ? td.classList.contains('hidde-col') : 'sin foco'; }), false);
});
v('12', 'sin column-chooser no hay botón ni menú (R1)', ['§7-c', '§0-R1'], async (c) => {
  await c.abrir(pag());
  await c.clicTh('t1', 1, { boton: 'right' });
  c.igual(await c.ev(() => [!!__ct.sr('t1').querySelector('.et-chooser-btn'), !!__ct.sr('t1').querySelector('.et-chooser')]), [false, false]);
}, { requiere: [] });

// ---------- §8 reordenar ----------
const { P: P8, t: r } = registro('reo', { requiere: ['reorder'] });
const A8 = { 'column-reorder': 'true' };
r('01', 'MoveColumn(field, toIndex) reordena Columns, encabezado y celdas de todas las filas', ['§8-e', '§8-c', '§0-R3'], async (c) => {
  await c.abrir(pag({}, A8));
  await c.ev(() => __ct.t('t1').MoveColumn('precio', 1));
  c.igual(await campos(c), ['codigo', 'precio', 'nombre', 'linea', 'cantidad']);
  c.igual(await camposDom(c), ['codigo', 'precio', 'nombre', 'linea', 'cantidad']);
  for (let k = 0; k < 4; k++) c.igual((await filaTxt(c, 't1', k))[1], String(PRODUCTOS[k].precio));
});
r('02', 'BeforeColumnMove {field, from, to, cancel} y ColumnMoved {field, from, to}', ['§8-d'], async (c) => {
  await c.abrir(pag({}, A8, grabar(['BeforeColumnMove', 'ColumnMoved'])));
  await c.ev(() => __ct.t('t1').MoveColumn('linea', 0));
  const e = await evs(c);
  c.igual(e.map(x => x[0]), ['BeforeColumnMove', 'ColumnMoved']);
  c.igual([e[0][1].field, e[0][1].from, e[0][1].to, e[0][1].cancel], ['linea', 2, 0, false]);
  c.igual([e[1][1].field, e[1][1].from, e[1][1].to], ['linea', 2, 0]);
});
r('03', 'arrastrar un th a otra posición la mueve; hay indicador et-drop-indicator durante el arrastre', ['§8-b', '§8-c'], async (c) => {
  await c.abrir(pag({}, A8));
  const x = await arrastrar(c, 't1', 'thead th[field="cantidad"]', 'thead th[field="nombre"]', { dx: 0.2 });
  c.igual(await campos(c), ['codigo', 'cantidad', 'nombre', 'linea', 'precio']);
  c.ok(x.indicador, 'et-drop-indicator visible al pasar sobre el destino');
});
r('04', 'reorder="false" bloquea la columna', ['§8-a'], async (c) => {
  await c.abrir(pag({ precio: { reorder: 'false' } }, A8));
  await c.ev(() => __ct.t('t1').MoveColumn('precio', 0));
  c.igual((await campos(c))[4], 'precio');
});
r('05', 'no se puede soltar una fija entre las no fijas ni al revés', ['§8-b'], async (c) => {
  await c.abrir({ ...pag({ codigo: { fixed: 'left' } }, A8) });
  await c.ev(() => { const t = __ct.t('t1'); t.MoveColumn('codigo', 3); t.MoveColumn('precio', 0); });
  c.igual((await campos(c))[0], 'codigo');
}, { requiere: ['fixed'] });
r('06', 'después de mover, editar la celda escribe en el campo correcto (I2)', ['§8-c', '§0-R3'], async (c) => {
  await c.abrir(pag({}, A8));
  await c.ev(() => __ct.t('t1').MoveColumn('nombre', 4));
  await c.foco('t1', 0, 4); await c.tecla('F2');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = 'Movido'; }); await c.tecla('Enter');
  c.igual((await c.datos())[0].nombre, 'Movido');
});
r('07', 'con columnas ocultas, mover conserva qué columna está oculta (por field)', ['§8-c', '§7-a'], async (c) => {
  await c.abrir(pag({}, A8));
  const x = await c.ev(() => { const t = __ct.t('t1'); t.hideColumn('linea', true); t.MoveColumn('linea', 0); return [t.Columns[0].field, __ct.th('t1', 0).classList.contains('hidde-col'), __ct.filas('t1')[0].cells[0].classList.contains('hidde-col'), t.hideColumns]; });
  c.igual(x, ['linea', true, true, [0]]);
});
r('08', 'Ctrl+Mayús+flecha sobre el encabezado enfocado mueve la columna', ['§8-f'], async (c) => {
  await c.abrir(pag({}, A8));
  await c.ev(() => { const th = __ct.th('t1', 1); if (!th.hasAttribute('tabindex')) th.tabIndex = 0; th.focus(); });
  await c.tecla('Control+Shift+ArrowRight');
  c.igual(await campos(c), ['codigo', 'linea', 'nombre', 'cantidad', 'precio']);
});
r('09', 'el pie de totales se reordena junto con las columnas', ['§8-c', '§2-k'], async (c) => {
  await c.abrir(pag({ cantidad: { summary: 'sum' } }, A8));
  await c.ev(() => __ct.t('t1').MoveColumn('cantidad', 0));
  c.igual(await c.ev(() => { const tf = __ct.sr('t1').querySelector('tfoot'); return tf ? tf.rows[0].cells[0].getAttribute('data-summary') : null; }), 'sum');
}, { requiere: ['summary'] });
r('10', 'sin column-reorder arrastrar el th no mueve nada (R1)', ['§8-a', '§0-R1'], async (c) => {
  await c.abrir(pag());
  await arrastrar(c, 't1', 'thead th[field="cantidad"]', 'thead th[field="nombre"]');
  c.igual(await campos(c), ['codigo', 'nombre', 'linea', 'cantidad', 'precio']);
}, { requiere: [] });

export default [
  { nombre: 'v2-columnas-fijas', grupo: 'v2', pruebas: P6 },
  { nombre: 'v2-mostrar-ocultar', grupo: 'v2', pruebas: P7 },
  { nombre: 'v2-reordenar', grupo: 'v2', pruebas: P8 },
];
