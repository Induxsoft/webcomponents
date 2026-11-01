// v2 §9: diseño (getLayout/setLayout/ResetLayout/LayoutChanged) y guardado automático en IndexedDB.
import { tabla, PRODUCTOS } from '../lib/fixtures.mjs';
import { registro, campos } from '../lib/v2.mjs';
import { Falla } from '../lib/arnes.mjs';

const { P, t } = registro('dis', { requiere: ['layout'] });
const COLS = (x = {}) => [
  { field: 'codigo', type: 'Text', title: 'Código', width: '90px' },
  { field: 'nombre', type: 'Text', title: 'Nombre', width: '200px' },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', width: '90px' },
  { field: 'precio', type: 'Number', title: 'Precio', width: '100px' },
  ...(x.extra ?? []),
];
const pag = (o = {}) => ({ body: tabla({ id: o.id ?? 't1', a: o.a ?? {}, cols: o.cols ?? COLS(o), data: PRODUCTOS, style: 'width:700px' }) + (o.body ?? ''), script: o.script ?? '', ruta: o.ruta, antes: o.antes });
const grabarLC = "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.lc=[];t.addEventListener('LayoutChanged',(e)=>window.lc.push(e.reason));t.addEventListener('LayoutRejected',(e)=>window.lc.push('rechazado'));});";
const lay = (c, id = 't1') => c.ev((id) => { const t = document.getElementById(id); if (typeof t.getLayout !== 'function') throw new Error('getLayout no existe'); return t.getLayout(); }, id);

async function ensanchar(c, col = 0, dx = 60, id = 't1') {
  const h = await c.page.evaluateHandle(({ id, col }) => { const th = window.__ct.th(id, col); return th && th.querySelector('.sizable-border'); }, { id, col });
  const el = h.asElement();
  if (!el) throw new Falla('no hay borde de cambio de ancho');
  const b = await el.boundingBox();
  await c.page.mouse.move(b.x + b.width / 2, b.y + 4); await c.page.mouse.down();
  await c.page.mouse.move(b.x + b.width / 2 + dx, b.y + 4, { steps: 5 }); await c.page.mouse.up();
  await c.esperar(20);
}
const guardados = async (c, exigir = false) => { const g = await c.ev(() => window.__ct.leerLayouts()); if (exigir && !Array.isArray(g)) throw new Falla('no existe la base induxsoft-edittable'); return g; };
const llave = (c, txt) => c.ev((txt) => window.__ct.sha256(txt), txt);

// ---------- §9.1 ----------
t('01', 'getLayout() devuelve {v:1, columns:[{field, order, width, hidden, fixed}], sort:null, groups:[], density}', ['§9-a', '§9-b'], async (c) => {
  await c.abrir(pag());
  const l = await lay(c);
  c.igual(l.v, 1);
  c.igual(l.columns.map(x => x.field), ['codigo', 'nombre', 'cantidad', 'precio']);
  c.ok(l.columns.every(x => ['field', 'order', 'width', 'hidden', 'fixed'].every(k => k in x)), 'claves: ' + JSON.stringify(l.columns[0]));
  c.igual([l.columns[1].hidden, l.columns[1].fixed, l.sort, l.groups], [false, false, null, []]);
  c.ok('density' in l, 'density');
});
t('02', 'getLayout() es una copia', ['§9-b'], async (c) => {
  await c.abrir(pag());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); const l = t.getLayout(); l.columns[0].hidden = true; l.columns.reverse(); return [t.getLayout().columns[0].field, t.IsColumnVisible('codigo')]; }), ['codigo', true]);
});
t('03', 'setLayout aplica orden, visibilidad, fijación y ancho, emparejando por field', ['§9-c'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').setLayout({ v: 1, columns: [{ field: 'precio', order: 0, width: 150, hidden: false, fixed: true }, { field: 'codigo', order: 1, hidden: false }, { field: 'nombre', order: 2, hidden: true }, { field: 'cantidad', order: 3 }] }));
  c.igual(await campos(c), ['precio', 'codigo', 'nombre', 'cantidad']);
  const r = await c.ev(() => { const t = __ct.t('t1'); return [t.IsColumnFixed('precio'), t.IsColumnVisible('nombre'), Math.round(__ct.th('t1', 0).getBoundingClientRect().width)]; });
  c.igual([r[0], r[1]], [true, false]);
  // Ajuste (AJUSTES.md): con width:700px la tabla reparte el sobrante, así que 150 no es lo que se ve. Se compara
  // contra una carga limpia de la misma página que declara precio con width 150px y aplica el mismo orden y visibilidad.
  const o = await c.otra(pag({ cols: COLS().map(x => x.field === 'precio' ? { ...x, width: '150px' } : x) }));
  const ref = await o.ev(() => { __ct.t('t1').setLayout({ v: 1, columns: [{ field: 'precio', order: 0, hidden: false, fixed: true }, { field: 'codigo', order: 1, hidden: false }, { field: 'nombre', order: 2, hidden: true }, { field: 'cantidad', order: 3 }] }); return Math.round(__ct.th('t1', 0).getBoundingClientRect().width); });
  c.cerca(r[2], ref, 3, 'ancho (carga limpia con width 150px declarado: ' + ref + ')');
  c.cerca((await lay(c)).columns.find(x => x.field === 'precio').width, 150, 1, 'getLayout().width');
}, { requiere: ['fixed', 'chooser', 'reorder'] });
t('04', 'setLayout: columnas que no existen y campos desconocidos se ignoran; las nuevas van al final con sus valores declarados', ['§9-c'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').setLayout({ v: 1, foo: 1, columns: [{ field: 'noexiste', order: 0 }, { field: 'cantidad', order: 1, raro: 'x' }, { field: 'codigo', order: 2 }] }));
  c.igual(await campos(c), ['cantidad', 'codigo', 'nombre', 'precio']);
  c.igual(await c.ev(() => __ct.t('t1').IsColumnVisible('nombre')), true);
}, { requiere: ['reorder'] });
t('05', 'setLayout con v mayor que la conocida no aplica nada y dispara LayoutRejected', ['§9-d'], async (c) => {
  await c.abrir(pag({ script: grabarLC }));
  await c.ev(() => __ct.t('t1').setLayout({ v: 99, columns: [{ field: 'precio', order: 0, hidden: true }] }));
  c.igual(await campos(c), ['codigo', 'nombre', 'cantidad', 'precio']);
  c.igual(await c.ev(() => window.lc), ['rechazado']);
});
t('06', 'LayoutChanged {layout, reason:"set"} con setLayout; nada con {silent:true}', ['§9-f', '§9-c'], async (c) => {
  await c.abrir(pag({ script: grabarLC }));
  await c.ev(() => { const t = __ct.t('t1'); t.setLayout({ v: 1, columns: [{ field: 'codigo', hidden: true }] }, { silent: true }); t.setLayout({ v: 1, columns: [{ field: 'codigo', hidden: false }] }); });
  c.igual(await c.ev(() => window.lc), ['set']);
});
for (const [razon, accion, req] of [
  ['move', "t.MoveColumn('precio',0)", ['reorder']], ['visibility', "t.HideColumn('nombre')", ['chooser']], ['fixed', "t.FixColumn('nombre',true)", ['fixed']],
  ['group', "t.GroupBy(['nombre'])", ['group']], ['reset', 't.ResetLayout()', []]]) {
  t('07-' + razon, `LayoutChanged con reason "${razon}"`, ['§9-f'], async (c) => {
    await c.abrir(pag({ script: grabarLC }));
    await c.ev((a) => { const t = __ct.t('t1'); new Function('t', a)(t); }, accion);
    c.contiene(await c.ev(() => window.lc), razon);
  }, { requiere: req });
}
t('07-sort', 'LayoutChanged con reason "sort" al ordenar con clic; layout.sort = {field, dir}', ['§9-f', '§9-a'], async (c) => {
  await c.abrir(pag({ script: grabarLC }));
  await c.clicTh('t1', 'nombre');
  c.contiene(await c.ev(() => window.lc), 'sort');
  c.igual((await lay(c)).sort, { field: 'nombre', dir: 'ASC' });
});
t('07-resize', 'LayoutChanged con reason "resize" al arrastrar el borde; layout.columns[i].width cambia', ['§9-f', '§9-a'], async (c) => {
  await c.abrir(pag({ script: grabarLC }));
  const w0 = (await lay(c)).columns[0].width;
  await ensanchar(c, 0, 60);
  c.contiene(await c.ev(() => window.lc), 'resize');
  c.distinto((await lay(c)).columns[0].width, w0);
});
t('08', 'ResetLayout vuelve a lo declarado en edit-thead', ['§9-e'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = __ct.t('t1'); t.MoveColumn('precio', 0); t.HideColumn('nombre'); t.ResetLayout(); });
  c.igual(await campos(c), ['codigo', 'nombre', 'cantidad', 'precio']);
  c.igual(await c.ev(() => __ct.t('t1').IsColumnVisible('nombre')), true);
}, { requiere: ['reorder', 'chooser'] });

// ---------- §9.2 guardado automático ----------
const RUTA = '/pantallas/productos.html';
// Ajuste (AJUSTES.md): las que recargan o reemplazan la página usan su propia ruta (el servidor es compartido en paralelo).
const RUTA_24 = '/pantallas/productos-24.html', RUTA_30 = '/pantallas/productos-30.html', RUTA_31 = '/pantallas/productos-31.html';
t('20', 'cambio del usuario (ancho): se guarda en IndexedDB induxsoft-edittable/layouts con llave sha256(origin+pathname+"#"+id)', ['§9-g', '§9-h', '§9-i', '§9-j'], async (c) => {
  await c.abrir(pag({ ruta: RUTA }));
  await ensanchar(c, 0, 60);
  await c.esperar(900);
  const g = await guardados(c);
  const k = await llave(c, c.srv.base + RUTA + '#t1');
  c.ok(Array.isArray(g), 'no existe la base induxsoft-edittable');
  c.contiene(g.map(x => x.key), k, 'llave');
});
t('21', 'se guarda con retraso de 500 ms (nada a los 200 ms)', ['§9-j'], async (c) => {
  await c.abrir(pag({ ruta: RUTA }));
  await ensanchar(c, 0, 60);
  await c.esperar(200);
  const antes = (await guardados(c)) ?? [];
  await c.esperar(700);
  const despues = (await guardados(c)) ?? [];
  c.igual([antes.length, despues.length], [0, 1]);
});
t('22', 'lo que cambia el programador por código o con setLayout no se guarda', ['§9-j'], async (c) => {
  await c.abrir(pag({ ruta: RUTA }));
  await c.ev(() => { const t = __ct.t('t1'); t.HideColumn && t.HideColumn('nombre'); t.setLayout({ v: 1, columns: [{ field: 'precio', order: 0 }] }); });
  await c.esperar(900);
  c.igual(((await guardados(c)) ?? []).length, 0);
});
t('23', 'al recargar se restaura (ancho), y la query string no cambia la llave', ['§9-k', '§9-i', '§9-n'], async (c) => {
  await c.abrir(pag({ ruta: RUTA }));
  await ensanchar(c, 1, 80);
  const w = await c.ev(() => __ct.th('t1', 1).getBoundingClientRect().width);
  await c.esperar(900);
  await c.page.goto(c.srv.base + RUTA + '?filtro=otro', { waitUntil: 'load' }); await c.esperar(150);
  c.cerca(await c.ev(() => __ct.th('t1', 1).getBoundingClientRect().width), w, 3, 'ancho restaurado');
});
t('24', 'la restauración no dispara eventos de usuario', ['§9-k'], async (c) => {
  await c.abrir(pag({ ruta: RUTA_24, body: "<script>window.lc=[];document.getElementById('t1').Events.layoutchanged=(e)=>window.lc.push(e.reason);</script>" }));
  await ensanchar(c, 1, 80); const w = await c.ev(() => __ct.th('t1', 1).getBoundingClientRect().width); await c.esperar(900);
  await c.page.reload({ waitUntil: 'load' }); await c.esperar(150);
  c.cerca(await c.ev(() => __ct.th('t1', 1).getBoundingClientRect().width), w, 3, 'se restauró el ancho');
  c.igual(((await c.ev(() => window.lc)) ?? []).filter(r => ['resize', 'move', 'visibility', 'fixed', 'sort', 'group'].includes(r)), []);
});
t('25', 'design-key reemplaza pathname+"#"+id en la llave', ['§9-i'], async (c) => {
  await c.abrir(pag({ ruta: RUTA, a: { 'design-key': 'usuario-7/productos' } }));
  await ensanchar(c, 0, 50); await c.esperar(900);
  c.contiene((await guardados(c, true)).map(x => x.key), await llave(c, c.srv.base + 'usuario-7/productos'));
});
t('26', 'sin id no se guarda nada', ['§9-m'], async (c) => {
  await c.abrir({ body: tabla({ id: '', cols: COLS(), data: PRODUCTOS }), ruta: RUTA });
  const h = await c.page.evaluateHandle(() => document.querySelector('edit-table').shadowRoot.querySelector('th .sizable-border'));
  const b = await h.asElement().boundingBox();
  await c.page.mouse.move(b.x + 2, b.y + 4); await c.page.mouse.down(); await c.page.mouse.move(b.x + 60, b.y + 4, { steps: 4 }); await c.page.mouse.up();
  await c.esperar(900);
  c.igual(((await guardados(c)) ?? []).length, 0);
});
t('27', 'con el id de reserva interno tampoco se guarda', ['§9-m'], async (c) => {
  await c.abrir(pag({ id: 'f077fb41716141eeb7ecb1ed0a1ce292', ruta: RUTA }));
  await ensanchar(c, 0, 50, 'f077fb41716141eeb7ecb1ed0a1ce292'); await c.esperar(900);
  c.igual(((await guardados(c)) ?? []).length, 0);
});
t('28', 'design-auto-save="false" no guarda', ['§9-g'], async (c) => {
  await c.abrir(pag({ ruta: RUTA, a: { 'design-auto-save': 'false' } }));
  await ensanchar(c, 0, 50); await c.esperar(900);
  c.igual(((await guardados(c)) ?? []).length, 0);
});
t('29', 'DesignAutoSaveSort=false (omisión): el orden de las filas no se recuerda; DataArray[0] al recargar es el original', ['§9-n'], async (c) => {
  await c.abrir(pag({ ruta: RUTA }));
  await c.clicTh('t1', 'codigo'); await c.clicTh('t1', 'codigo');
  await ensanchar(c, 1, 40); await c.esperar(900);
  await c.page.reload({ waitUntil: 'load' }); await c.esperar(150);
  c.igual(await c.ev(() => __ct.t('t1').DataArray[0].codigo), 'P-003');
  c.igual((await lay(c)).sort, null);
});
t('30', 'design-auto-save-sort="true": el orden se recuerda', ['§9-n'], async (c) => {
  await c.abrir(pag({ ruta: RUTA_30, a: { 'design-auto-save-sort': 'true' } }));
  await c.clicTh('t1', 'codigo'); await c.clicTh('t1', 'codigo'); await c.esperar(900);
  await c.page.reload({ waitUntil: 'load' }); await c.esperar(200);
  c.igual(await c.ev(() => __ct.t('t1').DataArray[0].codigo), 'P-004');
});
t('31', 'huella de columnas: si cambian los field declarados, el diseño guardado se descarta', ['§9-o'], async (c) => {
  await c.abrir(pag({ ruta: RUTA_31 }));
  await ensanchar(c, 1, 120); await c.esperar(900);
  const nueva = `<!DOCTYPE html><html lang="es-MX"><head><meta charset="utf-8"><script src="/__et/editable.js"></script></head><body>${tabla({ cols: COLS({ extra: [{ field: 'linea', title: 'Línea', width: '100px' }] }), data: PRODUCTOS, style: 'width:800px' })}</body></html>`;
  c.srv.registrar(nueva, RUTA_31);
  await c.page.reload({ waitUntil: 'load' }); await c.esperar(150);
  // Ajuste (AJUSTES.md): el ancho declarado (200px) no es el que se ve (la tabla mide 800px). Se compara contra
  // una carga limpia (otro contexto, sin IndexedDB) de la misma página nueva.
  const o = await c.otra({ html: nueva }); await o.esperar(150);
  const w0 = await o.ev(() => __ct.th('t1', 1).getBoundingClientRect().width);
  c.cerca(await c.ev(() => __ct.th('t1', 1).getBoundingClientRect().width), w0, 3, 'ancho declarado (carga limpia: ' + w0 + '), no el guardado');
});
t('32', 'IndexedDB no disponible: se desactiva sin errores y la tabla funciona', ['§9-l'], async (c) => {
  await c.abrir(pag({ ruta: RUTA, antes: "<script>Object.defineProperty(window,'indexedDB',{get(){throw new Error('bloqueado');}});</script>" }));
  await ensanchar(c, 0, 50); await c.esperar(900);
  c.sinErrores();
  await c.clic('t1', 1, 1); await c.tecla('F2');
  c.igual(await c.ev(() => __ct.t('t1').Editing), true);
});
t('33', 'IndexedDB.open que falla (onerror): sin errores', ['§9-l'], async (c) => {
  await c.abrir(pag({ ruta: RUTA, antes: "<script>IDBFactory.prototype.open=function(){const r={};setTimeout(()=>{r.error=new Error('x');r.onerror&&r.onerror({target:r});},0);return r;};</script>" }));
  await ensanchar(c, 0, 50); await c.esperar(900);
  c.sinErrores();
});
t('34', 'ForgetLayout() borra lo guardado de esta tabla; EditTable.ForgetAllLayouts() borra todo', ['§9-p'], async (c) => {
  await c.abrir(pag({ ruta: RUTA, body: tabla({ id: 't2', cols: COLS(), data: PRODUCTOS }) }));
  await ensanchar(c, 0, 50); await ensanchar(c, 0, 50, 't2'); await c.esperar(900);
  c.igual((await guardados(c, true)).length, 2);
  await c.ev(async () => { await __ct.t('t1').ForgetLayout(); });
  await c.esperar(100);
  c.igual((await guardados(c)).length, 1);
  await c.ev(async () => { await EditTable.ForgetAllLayouts(); });
  await c.esperar(100);
  c.igual(((await guardados(c)) ?? []).length, 0);
});
t('35', 'ResetLayout borra lo guardado', ['§9-e', '§9-p'], async (c) => {
  await c.abrir(pag({ ruta: RUTA }));
  await ensanchar(c, 0, 50); await c.esperar(900);
  await c.ev(() => __ct.t('t1').ResetLayout()); await c.esperar(200);
  c.igual(((await guardados(c)) ?? []).length, 0);
});
t('36', 'el registro guardado no incluye el orden de filas ni la agrupación por omisión', ['§9-n', '§11-k'], async (c) => {
  await c.abrir(pag({ ruta: RUTA }));
  await c.clicTh('t1', 'codigo'); await ensanchar(c, 0, 50); await c.esperar(900);
  const lista = await guardados(c, true); c.ok(lista.length > 0, 'no se guardó nada'); const g = lista[0].value;
  const l = g.layout ?? g;
  c.ok(!l.sort, 'sort guardado: ' + JSON.stringify(l.sort));
  c.ok(!l.groups || l.groups.length === 0, 'groups guardados');
});

// ---------- §9.2 salvaguarda 3: solo se restaura lo que el usuario puede cambiar en esa tabla ----------
const KEY = 'pruebas/salvaguarda-3';
const htmlB = (a) => `<!DOCTYPE html><html lang="es-MX"><head><meta charset="utf-8"><script src="/__et/editable.js"></script></head><body>${tabla({ a: { 'design-key': KEY, ...a }, cols: COLS(), data: PRODUCTOS, style: 'width:700px' })}</body></html>`;
async function guardarCompleto(c) {
  // página A con todo encendido: el usuario mueve (teclado), oculta (menú) y cambia un ancho (ratón)
  await c.abrir(pag({ ruta: '/a.html', a: { 'design-key': KEY, 'column-reorder': 'true', 'column-chooser': 'true' } }));
  await c.ev(() => { const th = __ct.th('t1', 3); th.tabIndex = 0; th.focus(); });
  await c.tecla('Control+Shift+ArrowLeft'); // precio pasa antes de cantidad
  const b = await c.page.evaluateHandle(() => __ct.sr('t1').querySelector('.et-chooser-btn'));
  if (!b.asElement()) throw new Falla('no hay botón del selector de columnas');
  await b.asElement().click();
  const cb = await c.page.evaluateHandle(() => { const m = __ct.sr('t1').querySelector('.et-chooser'); return m && Array.from(m.querySelectorAll('label, li, div')).find(x => /Nombre/.test(x.textContent) && x.querySelector('input[type=checkbox]'))?.querySelector('input[type=checkbox]'); });
  if (!cb.asElement()) throw new Falla('no hay casilla de "Nombre" en el menú');
  await cb.asElement().click();
  await c.page.keyboard.press('Escape');
  await ensanchar(c, 0, 70);
  const w = await c.ev(() => __ct.thPorCampo('t1', 'codigo').getBoundingClientRect().width);
  await c.esperar(900);
  c.igual(await campos(c), ['codigo', 'nombre', 'precio', 'cantidad'], 'precondición: orden cambiado en A');
  return w;
}
async function abrirB(c, a) {
  const url = c.srv.registrar(htmlB(a), '/b-' + Object.keys(a).join('-') + '.html');
  await c.page.goto(url, { waitUntil: 'load' }); await c.esperar(150);
}
// Ajuste (AJUSTES.md): el ancho que se ve depende del orden y la visibilidad de la página, así que no se compara
// con el de A. Referencia en la misma página B: una carga limpia (otro contexto, sin IndexedDB) a la que se le
// aplica por código el diseño que quedó en la página restaurada (getLayout).
async function anchoEnB(c, a) {
  const l = await c.ev(() => __ct.t('t1').getLayout());
  const o = await c.otra({ html: htmlB(a) }); await o.esperar(150);
  return o.ev((l) => { __ct.t('t1').setLayout(l, { silent: true }); return __ct.thPorCampo('t1', 'codigo').getBoundingClientRect().width; }, l);
}
const anchoGuardado = (c) => c.ev(() => __ct.t('t1').getLayout().columns.find(x => x.field === 'codigo').width);
t('40', 'salvaguarda 3: en una tabla sin atributos nuevos solo se restaura el ancho', ['§9-q', '§9-k'], async (c) => {
  await guardarCompleto(c);
  const g = await anchoGuardado(c);
  await abrirB(c, {});
  c.igual(await campos(c), ['codigo', 'nombre', 'cantidad', 'precio'], 'orden declarado');
  c.igual(await c.ev(() => __ct.thPorCampo('t1', 'nombre').classList.contains('hidde-col')), false, 'visibilidad declarada');
  c.cerca(await anchoGuardado(c), g, 1, 'getLayout: ancho restaurado');
  c.cerca(await c.ev(() => __ct.thPorCampo('t1', 'codigo').getBoundingClientRect().width), await anchoEnB(c, {}), 3, 'ancho restaurado (misma página)');
}, { requiere: ['reorder', 'chooser'] });
t('41', 'salvaguarda 3: con column-reorder (sin column-chooser) se restaura el orden pero no la visibilidad', ['§9-q'], async (c) => {
  await guardarCompleto(c);
  await abrirB(c, { 'column-reorder': 'true' });
  c.igual(await campos(c), ['codigo', 'nombre', 'precio', 'cantidad']);
  c.igual(await c.ev(() => __ct.thPorCampo('t1', 'nombre').classList.contains('hidde-col')), false);
}, { requiere: ['reorder', 'chooser'] });
t('42', 'salvaguarda 3: con column-chooser (sin column-reorder) se restaura la visibilidad pero no el orden', ['§9-q'], async (c) => {
  await guardarCompleto(c);
  await abrirB(c, { 'column-chooser': 'true' });
  c.igual(await campos(c), ['codigo', 'nombre', 'cantidad', 'precio']);
  c.igual(await c.ev(() => __ct.thPorCampo('t1', 'nombre').classList.contains('hidde-col')), true);
}, { requiere: ['reorder', 'chooser'] });
t('43', 'salvaguarda 3: con los dos atributos se restaura todo', ['§9-q', '§9-n'], async (c) => {
  await guardarCompleto(c);
  const g = await anchoGuardado(c);
  const a = { 'column-reorder': 'true', 'column-chooser': 'true' };
  await abrirB(c, a);
  c.igual(await campos(c), ['codigo', 'nombre', 'precio', 'cantidad']);
  c.igual(await c.ev(() => __ct.thPorCampo('t1', 'nombre').classList.contains('hidde-col')), true);
  c.cerca(await anchoGuardado(c), g, 1, 'getLayout: ancho restaurado');
  c.cerca(await c.ev(() => __ct.thPorCampo('t1', 'codigo').getBoundingClientRect().width), await anchoEnB(c, a), 3, 'ancho restaurado (misma página)');
}, { requiere: ['reorder', 'chooser'] });

export default { nombre: 'v2-diseno', grupo: 'v2', pruebas: P };
