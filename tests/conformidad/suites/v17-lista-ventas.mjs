// Defectos de la lista de ventas de V12 (ventas 1.1.5, 2026-11-05): ancho de columnas con group-panel y
// column-chooser, agrupar oculta la columna (group-hide-columns), menú de columnas con shadow DOM cerrado y
// totales del pie con grupos colapsados.
import { tabla } from '../lib/fixtures.mjs';
import { registro } from '../lib/v2.mjs';
import { Falla } from '../lib/arnes.mjs';

const { P, t } = registro('lv', { requiere: ['group', 'chooser', 'summary'] });
const DATOS = [
  { referencia: 'V-01', cliente: 'Cliente A de prueba', vendedor: 'Uno', divisa: 'MXN', total: 1160 },
  { referencia: 'V-02', cliente: 'Cliente A de prueba', vendedor: 'Dos', divisa: 'MXN', total: 522 },
  { referencia: 'V-03', cliente: 'Cliente B de prueba', vendedor: 'Uno', divisa: 'USD', total: 2088 },
  { referencia: 'V-04', cliente: 'Cliente B de prueba', vendedor: 'Dos', divisa: 'USD', total: 4176 },
  { referencia: 'V-05', cliente: 'Cliente B de prueba', vendedor: 'Dos', divisa: 'MXN', total: 348 },
  { referencia: 'V-06', cliente: 'Cliente A de prueba', vendedor: '', divisa: 'MXN', total: 116 },
];
// Columnas de relleno para que la tabla sea más ancha que su contenedor (como las 21 de la lista de ventas).
const EXTRA = Array.from({ length: 10 }, (_, k) => ({ field: 'x' + k, title: 'Columna adicional ' + k }));
const COLS = [
  { field: 'referencia', title: 'Referencia', summary: 'count', groupable: 'false' },
  { field: 'cliente', title: 'Cliente' },
  { field: 'vendedor', title: 'Vendedor' },
  { field: 'divisa', title: 'Divisa' },
  { field: 'total', type: 'Number', title: 'Total moneda base', summary: 'sum', groupable: 'false' },
];
const ATR = { 'group-panel': 'true', 'column-chooser': 'true', 'hidde-selector': 'true' };
const pag = (o = {}) => ({
  body: `<div style="width:${o.ancho ?? 900}px">` + tabla({ a: { ...ATR, ...(o.a ?? {}) }, cols: [...COLS, ...(o.extra ?? [])], data: DATOS }) + '</div>' + (o.body ?? ''),
  script: o.script ?? '', ruta: o.ruta,
  antes: (o.cerrado ? '<script>window.__ctShadowCerrado = true;</script>' : '') + (o.antes ?? ''),
});
const SR = (id = 't1') => document.getElementById(id)._shadow;
const visible = (c, f) => c.ev((f) => document.getElementById('t1').IsColumnVisible(f), f);
const ancho = (c, f) => c.ev((f) => document.getElementById('t1')._shadow.querySelector(`thead th[field="${f}"]`).getBoundingClientRect().width, f);
const caja = async (c, js, arg) => { const r = await c.ev(js, arg); if (!r) throw new Falla('no se encontró el elemento'); return r; };
async function arrastrarBorde(c, f, dx) {
  const b = await caja(c, (f) => { const e = document.getElementById('t1')._shadow.querySelector(`thead th[field="${f}"] .sizable-border`); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 6 }; }, f);
  await c.page.mouse.move(b.x, b.y); await c.page.mouse.down();
  for (let k = 1; k <= 8; k++) await c.page.mouse.move(b.x + dx * k / 8, b.y);
  await c.page.mouse.up(); await c.esperar(30);
}
async function clicMenu(c, titulo) {
  const r = await caja(c, (titulo) => { const l = [...document.getElementById('t1')._shadow.querySelectorAll('.et-chooser.et-open label')].find(l => l.textContent.trim() === titulo); if (!l) return null; const b = l.getBoundingClientRect(); return { x: b.x + 10, y: b.y + b.height / 2 }; }, titulo);
  await c.page.mouse.click(r.x, r.y); await c.esperar(30);
}
async function abrirMenuBoton(c) {
  const r = await caja(c, () => { const b = document.getElementById('t1')._shadow.querySelector('.et-chooser-btn'); if (!b) return null; const x = b.getBoundingClientRect(); return { x: x.x + x.width / 2, y: x.y + x.height / 2 }; });
  await c.page.mouse.click(r.x, r.y); await c.esperar(30);
}
const menuAbierto = (c) => c.ev(() => !!document.getElementById('t1')._shadow.querySelector('.et-chooser.et-open'));
const sumas = (c) => c.ev(() => document.getElementById('t1').getSummaries());

// ---------- 1) ancho de columnas
t('01', 'tabla más ancha que su contenedor (auto layout): arrastrar el borde cambia el ancho de la columna', ['§8-a'], async (c) => {
  await c.abrir(pag({ extra: EXTRA }));
  c.ok(await c.ev(() => { const t = document.getElementById('t1')._shadow.querySelector('table'); return t.getBoundingClientRect().width > t.parentElement.getBoundingClientRect().width; }), 'la tabla debe ser más ancha que el contenedor');
  const w0 = await ancho(c, 'cliente');
  await arrastrarBorde(c, 'cliente', 100);
  const w1 = await ancho(c, 'cliente');
  c.ok(w1 - w0 > 60, `ancho ${w0} → ${w1}`);
  c.igual(await c.ev(() => document.getElementById('t1').getGroups()), [], 'arrastrar el borde no agrupa');
});
t('02', 'con shadow DOM cerrado, group-panel y column-chooser, el borde también cambia el ancho (y lo guarda en getLayout)', ['§8-a', '§9-a'], async (c) => {
  await c.abrir(pag({ extra: EXTRA, cerrado: true }));
  c.igual(await c.ev(() => document.getElementById('t1').shadowRoot), null, 'shadow cerrado');
  const w0 = await ancho(c, 'vendedor');
  await arrastrarBorde(c, 'vendedor', 90);
  const w1 = await ancho(c, 'vendedor');
  c.ok(w1 - w0 > 50, `ancho ${w0} → ${w1}`);
  const l = await c.ev(() => document.getElementById('t1').getLayout());
  c.ok(Number(l.columns.find(x => x.field === 'vendedor').width) > w0 + 40, 'width en el diseño: ' + JSON.stringify(l.columns.find(x => x.field === 'vendedor')));
}, { requiere: ['layout'] });
t('03', 'un dragstart que empieza en el borde de ancho se cancela (no llega al arrastre del th)', ['§8-a', '§11-c'], async (c) => {
  await c.abrir(pag({ a: { 'column-reorder': 'true' } }));
  const r = await c.ev(() => {
    const s = document.getElementById('t1')._shadow, th = s.querySelector('thead th[field="cliente"]'), b = th.querySelector('.sizable-border');
    let llego = 0; s.querySelector('thead').addEventListener('dragstart', () => llego++);
    b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, clientX: 1, clientY: 1 }));
    const ev = new DragEvent('dragstart', { bubbles: true, cancelable: true, composed: true });
    th.dispatchEvent(ev);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    const ev2 = new DragEvent('dragstart', { bubbles: true, cancelable: true, composed: true });
    th.dispatchEvent(ev2);
    return [ev.defaultPrevented, ev2.defaultPrevented, llego];
  });
  c.igual(r, [true, false, 1], 'desde el borde se cancela; fuera del borde sigue el arrastre del th');
}, { requiere: ['reorder'] });
t('04', 'los th conservan su borde de ancho después de mover columnas y de agrupar', ['§8-a'], async (c) => {
  await c.abrir(pag({ a: { 'column-reorder': 'true' } }));
  const n = () => c.ev(() => [...document.getElementById('t1')._shadow.querySelectorAll('thead > tr > th[field]')].map(th => th.querySelectorAll(':scope > .sizable-border').length));
  await c.ev(() => { const t = document.getElementById('t1'); t.MoveColumn('divisa', 0); t.GroupBy(['vendedor']); t.Ungroup(); });
  const r = await n();
  c.ok(r.length === 5 && r.every(x => x === 1), 'un borde por th: ' + r.join(','));
}, { requiere: ['reorder'] });

// ---------- 2) agrupar oculta la columna
t('05', 'agrupar por una columna la oculta; desagrupar la vuelve a mostrar', ['§11-d'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => document.getElementById('t1').GroupBy(['vendedor']));
  c.igual(await visible(c, 'vendedor'), false, 'agrupada: oculta');
  c.ok(await c.ev(() => !!document.getElementById('t1')._shadow.querySelector('tr.et-group-row')), 'hay filas de grupo');
  await c.ev(() => document.getElementById('t1').GroupBy(['vendedor', 'divisa']));
  c.igual([await visible(c, 'vendedor'), await visible(c, 'divisa')], [false, false], 'dos niveles: las dos ocultas');
  await c.ev(() => document.getElementById('t1').GroupBy(['divisa']));
  c.igual([await visible(c, 'vendedor'), await visible(c, 'divisa')], [true, false], 'quitar un nivel devuelve esa columna');
  await c.ev(() => document.getElementById('t1').Ungroup());
  c.igual([await visible(c, 'vendedor'), await visible(c, 'divisa')], [true, true]);
});
t('06', 'si la columna ya estaba oculta antes de agrupar, al desagrupar se queda oculta', ['§11-d'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = document.getElementById('t1'); t.HideColumn('vendedor'); t.GroupBy(['vendedor']); t.Ungroup(); });
  c.igual(await visible(c, 'vendedor'), false);
});
t('07', 'group-hide-columns="false": agrupar no oculta la columna', ['§11-d'], async (c) => {
  await c.abrir(pag({ a: { 'group-hide-columns': 'false' } }));
  await c.ev(() => document.getElementById('t1').GroupBy(['vendedor']));
  c.igual(await visible(c, 'vendedor'), true);
  c.igual(await c.ev(() => document.getElementById('t1').GroupHideColumns), false);
});
t('08', 'si el usuario vuelve a mostrar una columna agrupada, otro nivel no la oculta otra vez; el menú refleja la visibilidad', ['§11-d', '§7-b'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = document.getElementById('t1'); t.GroupBy(['vendedor']); t.ShowColumn('vendedor'); t.GroupBy(['vendedor', 'divisa']); });
  c.igual([await visible(c, 'vendedor'), await visible(c, 'divisa')], [true, false]);
  await abrirMenuBoton(c);
  c.igual(await c.ev(() => Object.fromEntries([...document.getElementById('t1')._shadow.querySelectorAll('.et-chooser.et-open label')].map(l => [l.textContent.trim(), l.querySelector('input').checked]))),
    { 'Referencia': true, 'Cliente': true, 'Vendedor': true, 'Divisa': false, 'Total moneda base': true });
});
async function agruparArrastrando(c, f) {
  const th = await caja(c, (f) => { const r = document.getElementById('t1')._shadow.querySelector(`thead th[field="${f}"]`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, f);
  const p = await caja(c, () => { const r = document.getElementById('t1')._shadow.querySelector('.et-group-panel').getBoundingClientRect(); return { x: r.x + 40, y: r.y + r.height / 2 }; });
  await c.page.mouse.move(th.x, th.y); await c.page.mouse.down();
  await c.page.mouse.move(th.x + 5, th.y - 3); await c.page.mouse.move(p.x, p.y, { steps: 8 }); await c.page.mouse.up(); await c.esperar(50);
}
t('09', 'arrastrar el encabezado al panel agrupa y oculta la columna (ratón real)', ['§11-c', '§11-d'], async (c) => {
  await c.abrir(pag());
  await agruparArrastrando(c, 'vendedor');
  c.igual(await c.ev(() => document.getElementById('t1').getGroups()), ['vendedor']);
  c.igual(await visible(c, 'vendedor'), false);
});
const RUTA_10 = '/pantallas/lista-ventas-10.html';
t('10', 'design-auto-save con design-auto-save-sort: al restaurar los grupos se ocultan sus columnas; el diseño guarda la visibilidad de antes de agrupar', ['§9-n', '§11-k'], async (c) => {
  await c.abrir(pag({ ruta: RUTA_10, a: { 'design-auto-save': 'true', 'design-auto-save-sort': 'true', 'column-reorder': 'true' } }));
  await agruparArrastrando(c, 'vendedor');   // como usuario: el diseño solo se guarda por acciones del usuario
  c.igual(await visible(c, 'vendedor'), false, 'oculta al agrupar');
  c.igual((await c.ev(() => document.getElementById('t1').getLayout())).columns.find(x => x.field === 'vendedor').hidden, false, 'hidden en getLayout');
  await c.esperar(900);
  await c.page.reload({ waitUntil: 'load' }); await c.esperar(300);
  c.igual(await c.ev(() => document.getElementById('t1').getGroups()), ['vendedor'], 'grupos restaurados');
  c.igual(await visible(c, 'vendedor'), false, 'oculta al restaurar');
  await c.ev(() => document.getElementById('t1').Ungroup());
  c.igual(await visible(c, 'vendedor'), true, 'visible al desagrupar');
}, { requiere: ['layout'] });
t('11', 'ResetLayout con grupos: vuelve a lo declarado y la columna agrupada queda visible', ['§9-c'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = document.getElementById('t1'); t.GroupBy(['vendedor']); t.ResetLayout(); });
  c.igual([await c.ev(() => document.getElementById('t1').getGroups()), await visible(c, 'vendedor')], [[], true]);
}, { requiere: ['layout'] });

// ---------- 3) menú de columnas con shadow DOM cerrado
t('12', 'shadow cerrado: el botón de columnas abre el menú y un clic en la casilla oculta la columna; el menú sigue abierto', ['§7-b'], async (c) => {
  await c.abrir(pag({ cerrado: true }));
  await abrirMenuBoton(c);
  c.ok(await menuAbierto(c), 'menú abierto');
  await clicMenu(c, 'Vendedor');
  c.igual(await visible(c, 'vendedor'), false, 'columna oculta');
  c.ok(await menuAbierto(c), 'el menú sigue abierto');
  await clicMenu(c, 'Vendedor');
  c.igual(await visible(c, 'vendedor'), true, 'columna visible otra vez');
});
t('13', 'shadow cerrado: clic derecho en el encabezado abre el menú y la casilla funciona; un clic fuera lo cierra', ['§7-b'], async (c) => {
  await c.abrir(pag({ cerrado: true }));
  const th = await caja(c, () => { const r = document.getElementById('t1')._shadow.querySelector('thead th[field="cliente"]').getBoundingClientRect(); return { x: r.x + 10, y: r.y + r.height / 2 }; });
  await c.page.mouse.click(th.x, th.y, { button: 'right' }); await c.esperar(30);
  c.ok(await menuAbierto(c), 'menú abierto');
  await clicMenu(c, 'Divisa');
  c.igual(await visible(c, 'divisa'), false);
  await c.page.mouse.click(5, 690); await c.esperar(30);
  c.igual(await menuAbierto(c), false, 'clic fuera lo cierra');
});
t('14', 'el menú no depende de la página: un manejador de document que cancela los clics no revierte la casilla', ['§7-b'], async (c) => {
  await c.abrir(pag({ cerrado: true, script: "document.addEventListener('click', (e) => e.preventDefault());" }));
  await abrirMenuBoton(c);
  await clicMenu(c, 'Cliente');
  c.igual(await visible(c, 'cliente'), false);
});

// ---------- 4) totales con grupos colapsados
t('15', 'colapsar grupos no cambia el total ni el conteo del pie', ['§2-d', '§11-d'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => document.getElementById('t1').GroupBy(['vendedor']));
  const s0 = await sumas(c);
  c.igual(s0, { referencia: 6, total: 8410 });
  await c.ev(() => document.getElementById('t1').CollapseAllGroups()); await c.cuadro();
  c.igual(await sumas(c), s0, 'todo colapsado');
  await c.ev(() => { const t = document.getElementById('t1'); t.ExpandAllGroups(); t.CollapseGroup(['Dos']); }); await c.cuadro();
  c.igual(await sumas(c), s0, 'un grupo colapsado');
});
t('16', 'con grupos, un filtro sí quita filas del total (alcance visible), también con grupos colapsados', ['§2-d', '§F8a-bus-j'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { const t = document.getElementById('t1'); t.GroupBy(['vendedor']); t.Filter({ divisa: 'USD' }); t.CollapseAllGroups(); }); await c.cuadro();
  c.igual(await sumas(c), { referencia: 2, total: 6264 });
}, { requiere: ['search'] });
t('17', 'virtual-rows: colapsar grupos no cambia el total; el filtro sí', ['§2-d', '§10-e'], async (c) => {
  await c.abrir(pag({ a: { 'virtual-rows': 'true' } }));
  await c.ev(() => { const t = document.getElementById('t1'); t.GroupBy(['vendedor']); t.CollapseAllGroups(); }); await c.cuadro();
  c.igual(await sumas(c), { referencia: 6, total: 8410 });
  await c.ev(() => document.getElementById('t1').Filter({ divisa: 'MXN' })); await c.cuadro();
  c.igual(await sumas(c), { referencia: 4, total: 2146 });
}, { requiere: ['virtual', 'search'] });

export default { nombre: 'v2-lista-ventas', grupo: 'v2', pruebas: P };
