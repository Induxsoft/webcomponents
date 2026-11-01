// Actual: tarjetas y badges (contrato §1.10-1.11), presentación (§1.5, §2.7) e impresión (§1.14).
import { tabla, paginaProductos, CLIENTES } from '../lib/fixtures.mjs';

const P = [];
const t = (id, titulo, fn, x = {}) => P.push({ id: 'tar-' + id, titulo, spec: ['A.tarjetas'], fn, ...x });
const p = (id, titulo, fn, x = {}) => P.push({ id: 'pre-' + id, titulo, spec: ['A.presentacion'], fn, ...x });
const i = (id, titulo, fn, x = {}) => P.push({ id: 'imp-' + id, titulo, spec: ['A.impresion'], fn, ...x });

const COLS_NE = [{ field: 'codigo', type: 'NoEditable', title: 'Código' }, { field: 'nombre', type: 'NoEditable', title: 'Nombre' }, { field: 'saldo', type: 'NoEditable', title: 'Saldo', format: 'true', decs: '2', prefix: '$' }];
const pagNE = (a = {}, script = '', cols = COLS_NE) => ({ body: tabla({ a, cols, data: CLIENTES }), script });

t('01', 'cards-responsive="true" con todas NoEditable: table-cards; en pantalla angosta el td muestra data-cell', async (c) => {
  await c.abrir({ ...pagNE({ 'cards-responsive': 'true' }), viewport: { width: 500, height: 700 } });
  const r = await c.ev(() => { const tb = __ct.sr('t1').querySelector('table'); const td = __ct.td('t1', 0, 1); return [tb.classList.contains('table-cards'), td.getAttribute('data-cell'), getComputedStyle(td, '::before').content, __ct.t('t1').IsCardView]; });
  c.igual(r, [true, 'Nombre', '"Nombre: "', true]);
});
t('02', 'cards-responsive con una columna editable: no hay tarjetas', async (c) => {
  await c.abrir({ ...pagNE({ 'cards-responsive': 'true' }, '', [...COLS_NE.slice(0, 2), { field: 'saldo', type: 'Number', title: 'Saldo' }]), viewport: { width: 500, height: 700 } });
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('table').classList.contains('table-cards')), false);
});
t('03', 'editable-responsive="true" permite tarjetas con columnas editables', async (c) => {
  await c.abrir({ ...pagNE({ 'cards-responsive': 'true', 'editable-responsive': 'true' }, '', [...COLS_NE.slice(0, 2), { field: 'saldo', type: 'Number', title: 'Saldo' }]), viewport: { width: 500, height: 700 } });
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('table').classList.contains('table-cards')), true);
});
t('04', 'cards-mode="always": et-cards-custom, et-layout-grid y et-cards', async (c) => {
  await c.abrir(pagNE({ 'cards-mode': 'always' }));
  c.igual(await c.ev(() => { const cl = __ct.sr('t1').querySelector('table').classList; return ['et-cards-custom', 'et-layout-grid', 'et-cards'].map(x => cl.contains(x)); }), [true, true, true]);
});
t('05', 'ViewModeChanged {sender, mode} al cruzar el punto de corte', async (c) => {
  await c.abrir({ ...pagNE({ 'cards-mode': 'auto', 'cards-breakpoint': '600px' }), viewport: { width: 900, height: 600 } });
  await c.ev(() => __ct.grabar('t1', ['viewmodechanged']));
  await c.page.setViewportSize({ width: 500, height: 600 }); await c.esperar(150);
  await c.page.setViewportSize({ width: 900, height: 600 }); await c.esperar(150);
  c.igual((await c.log()).map(x => x.a.mode), ['cards', 'table']);
});
t('06', 'cards-layout="slots" y cardslot/cardlabel en las columnas', async (c) => {
  const cols = [{ field: 'nombre', type: 'NoEditable', title: 'Nombre', card: 'true', cardslot: 'title' }, { field: 'ciudad', type: 'NoEditable', title: 'Ciudad', card: 'true', cardslot: 'subtitle', cardlabel: 'Plaza' }, { field: 'rfc', type: 'NoEditable', title: 'RFC' }];
  await c.abrir(pagNE({ 'cards-mode': 'always', 'cards-layout': 'slots' }, '', cols));
  const r = await c.ev(() => { const tr = __ct.filas('t1')[0]; return Array.from(tr.cells).map(td => [td.getAttribute('data-card-slot'), td.getAttribute('data-card-label'), td.classList.contains('et-card-hidden')]); });
  c.igual(r, [['title', 'Nombre', false], ['subtitle', 'Plaza', false], ['body', 'RFC', true]]);
});
t('07', 'RowBadges dibuja badges con texto, color y tooltip', async (c) => {
  await c.abrir(pagNE({}, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.RowBadges=(r)=>r.saldo<0?[{id:'neg',text:'!',bg:'#c00',tooltip:'Saldo negativo'}]:[];t.RefreshView();});"));
  const r = await c.ev(() => __ct.filas('t1').map(tr => { const b = tr.querySelector('.et-badge'); return b ? [b.textContent, b.getAttribute('data-badge-id'), b.getAttribute('title')] : null; }));
  c.igual(r, [null, null, ['!', 'neg', 'Saldo negativo'], null, null]);
});
t('08', 'campo __badges y badges-field', async (c) => {
  const data = CLIENTES.map((x, k) => ({ ...x, marcas: k === 0 ? [{ text: 'VIP' }] : [] }));
  await c.abrir({ body: tabla({ a: { 'badges-field': 'marcas' }, cols: COLS_NE, data }) });
  c.igual(await c.ev(() => __ct.filas('t1').map(tr => tr.querySelectorAll('.et-badge').length)), [1, 0, 0, 0, 0]);
});
t('09', 'SetRowBadges / AddRowBadge / RemoveRowBadge / GetRowBadges / ResetRowBadges', async (c) => {
  await c.abrir(pagNE());
  const r = await c.ev(() => {
    const t = __ct.t('t1'); const n = () => __ct.filas('t1')[1].querySelectorAll('.et-badge').length;
    const out = [];
    t.SetRowBadges(1, [{ id: 'a', text: '1' }]); out.push(n());
    t.AddRowBadge(1, { id: 'b', text: '2' }); out.push(n());
    t.AddRowBadge(1, { id: 'b', text: '3' }); out.push(n(), t.GetRowBadges(1).map(b => b.text).join(','));
    t.RemoveRowBadge(1, 'a'); out.push(n());
    t.ResetRowBadges(1); out.push(n());
    return out;
  });
  c.igual(r, [1, 2, 2, '1,3', 1, 0]);
});
t('10', 'BadgeClick {sender, irow, badge, row, td, event, cancel}; cancel evita BadgeOnClick', async (c) => {
  await c.abrir(pagNE({}, `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.r=[];
    t.RowBadges=()=>[{id:'x',text:'x'}]; t.BadgeOnClick=(irow)=>window.r.push('on'+irow);
    t.Events.badgeclick=(e)=>{window.r.push(Object.keys(e).sort().join(','),e.irow); if(window.cancelar)e.cancel=true;}; t.RefreshView();});`));
  await c.ev(() => __ct.filas('t1')[2].querySelector('.et-badge').click());
  await c.ev(() => { window.cancelar = true; __ct.filas('t1')[3].querySelector('.et-badge').click(); });
  c.igual(await c.ev(() => window.r), ['badge,cancel,event,irow,row,sender,td', 2, 'on2', 'badge,cancel,event,irow,row,sender,td', 3]);
  c.igual(await c.ev(() => __ct.filas('t1')[2].querySelector('.et-badge').getAttribute('role')), 'button');
});
t('11', 'RowAccent: clase et-accent y variable --et-row-accent', async (c) => {
  await c.abrir(pagNE({}, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.RowAccent=(r)=>r.saldo<0?'#c00':null;t.RefreshView();});"));
  c.igual(await c.ev(() => __ct.filas('t1').map(tr => tr.classList.contains('et-accent') ? tr.style.getPropertyValue('--et-row-accent') : '')), ['', '', '#c00', '', '']);
});
t('12', 'RowClass, row-class-field y CellClass aplican clases (sin quitar las propias)', async (c) => {
  const data = CLIENTES.map((x, k) => ({ ...x, cls: k === 1 ? 'resaltada' : '' }));
  await c.abrir({ body: tabla({ a: { 'row-class-field': 'cls' }, cols: COLS_NE, data }),
    script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.RowClass=(r)=>r.ciudad==='Oaxaca'?'oax':'';t.CellClass=(r,f)=>f==='saldo'&&r.saldo<0?'neg':'';t.RefreshView();});" });
  const r = await c.ev(() => __ct.filas('t1').map(tr => [tr.className.split(' ').filter(Boolean).sort().join(' '), tr.cells[2].classList.contains('neg')]));
  c.igual(r, [['', false], ['oax resaltada', false], ['', true], ['', false], ['', false]]);
});
t('13', 'format="relative" muestra una fecha relativa en et-rel/data-rel', async (c) => {
  const hace = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  await c.abrir({ body: tabla({ cols: [{ field: 'f', type: 'NoEditable', format: 'relative', title: 'F' }], data: [{ f: hace }] }) });
  const r = await c.ev(() => { const td = __ct.td('t1', 0, 0); return [td.classList.contains('et-rel'), td.getAttribute('data-rel')]; });
  c.igual(r[0], true); c.ok((r[1] ?? '').trim() !== '' && r[1] !== hace, 'data-rel con texto relativo: ' + r[1]);
});
t('14', 'onRowPaint se llama en el dibujo, en UpdateRow y en RefreshDecorations', async (c) => {
  await c.abrir(pagNE({}, "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.n=[];t.onRowPaint=(tr,i,r)=>window.n.push(i);});"));
  await c.ev(() => { const t = __ct.t('t1'); t.UpdateRow(3); t.RefreshDecorations(); });
  c.igual(await c.ev(() => window.n), [3, 0, 1, 2, 3, 4]);
});

// ---------- presentación ----------
p('01', 'onTdPaint(td, idx, icol, field) en cada celda del dibujo inicial (asignado antes del DOMContentLoaded)', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_NE, data: CLIENTES.slice(0, 2) }) + "<script>window.n=[];document.getElementById('t1').onTdPaint=(td,i,c,f)=>window.n.push([i,c,f]);</script>" });
  c.igual(await c.ev(() => window.n), [[0, 0, 'codigo'], [0, 1, 'nombre'], [0, 2, 'saldo'], [1, 0, 'codigo'], [1, 1, 'nombre'], [1, 2, 'saldo']]);
});
p('02', 'onTdPaint se llama en _printRows (con idx, icol, field) y no en UpdateRow ni en AddRow', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_NE, data: CLIENTES.slice(0, 2) }),
    script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.n=[];t.onTdPaint=(td,i,c,f)=>window.n.push([i,c,f,td.tagName,td.isConnected]);});" });
  await c.ev(() => { const t = __ct.t('t1'); t._printRows(); window.k = window.n.length; t.UpdateRow(0); t.AddRow(); });
  const r = await c.ev(() => [window.n, window.k]);
  c.igual(r[1], 6); c.igual(r[0].length, 6);
  c.igual(r[0].slice(0, 3), [[0, 0, 'codigo', 'TD', false], [0, 1, 'nombre', 'TD', false], [0, 2, 'saldo', 'TD', false]]);
});
p('03', 'onTdPaint para color condicional: negativos en rojo', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_NE, data: CLIENTES }),
    antes: "<script>document.addEventListener('DOMContentLoaded',()=>{},true);</script>",
    script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.onTdPaint=(td,i,c,f)=>{if(f==='saldo'&&t.DataArray[i].saldo<0)td.style.color='red';};t._printRows();});" });
  c.igual(await c.ev(() => __ct.filas('t1').map(tr => tr.cells[2].style.color)), ['', '', 'red', '', '']);
});
p('04', 'template evalúa ${DataRow.x} y puede usar this (la instancia)', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'n', title: 'N' }, { field: '_', type: 'NoEditable', template: '<b>${DataRow.n}</b>-${this.id}', title: 'T' }], data: [{ n: 'uno' }] }) });
  c.igual(await c.ev(() => __ct.td('t1', 0, 1).querySelector('.cell-content').innerHTML), '<b>uno</b>-t1');
});
p('05', 'template-encode="true" escapa los valores de DataRow dentro de la plantilla', async (c) => {
  await c.abrir({ body: tabla({ a: { 'template-encode': 'true' }, cols: [{ field: '_', type: 'NoEditable', template: '<i>${DataRow.n}</i>', title: 'T' }], data: [{ n: '<b>x</b>' }] }) });
  c.igual(await c.ev(() => __ct.td('t1', 0, 0).querySelector('.cell-content').innerHTML), '<i>&lt;b&gt;x&lt;/b&gt;</i>');
});
p('06', 'sin html-encode el HTML del dato se interpreta (comportamiento documentado)', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'n', title: 'N' }], data: [{ n: '<b>x</b>' }] }) });
  c.igual(await c.ev(() => !!__ct.td('t1', 0, 0).querySelector('b')), true);
});
p('07', 'hideColumn(field, true|false) oculta y muestra th y celdas; hideColumns guarda cellIndex', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); const a = t.hideColumn('nombre', true); const s1 = [__ct.th('t1', 1).classList.contains('hidde-col'), __ct.filas('t1').every(tr => tr.cells[1].classList.contains('hidde-col')), t.hideColumns.slice()]; t.hideColumn('nombre', false); return [a, s1, __ct.th('t1', 1).classList.contains('hidde-col'), t.hideColumns.slice(), t.hideColumn('noexiste')]; });
  c.igual(r, [true, [true, true, [1]], false, [], false]);
});
p('08', 'las columnas ocultas se conservan al redibujar (_printRows) y al agregar filas', async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.hideColumn('nombre'); t._printRows(); t.AddRow(); return __ct.filas('t1').map(tr => tr.cells[1].classList.contains('hidde-col')); });
  c.igual(r, [true, true, true, true, true]);
});
p('09', 'navegación con flechas salta las columnas ocultas', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.t('t1').hideColumn('nombre'));
  await c.foco('t1', 0, 0); await c.tecla('ArrowRight');
  c.igual(await c.ev(() => __ct.t('t1').CurrentColIndex()), 2);
});
p('10', 'changeColumnTitle(field, título) cambia el texto del encabezado', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => [__ct.t('t1').changeColumnTitle('precio', 'P. unitario'), __ct.th('t1', 3).querySelector('span').textContent, __ct.t('t1').changeColumnTitle('nada', 'x')]), [true, 'P. unitario', false]);
});
p('11', 'changeColumnTitle actualiza Columns[i].title', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const t = __ct.t('t1'); t.changeColumnTitle('precio', 'P. unitario'); return t.Columns[3].title; }), 'P. unitario');
}, { defecto: 'contrato #18 (la exportación CSV de V12 sale con el título viejo)' });
p('12', 'control-styles con selectores de consumidores (tr td, th, thead, .EdiTable-Cell, tbody) se aplica', async (c) => {
  await c.abrir(paginaProductos({ a: { 'control-styles': 'tr td{font-style:italic} th{color:rgb(9, 9, 9)} thead{background:rgb(200, 0, 0)} .EdiTable-Cell{border-bottom:2px solid rgb(0, 0, 255)}' } }));
  const r = await c.ev(() => { const td = __ct.td('t1', 0, 0); const cs = getComputedStyle(td); return [cs.fontStyle, getComputedStyle(__ct.th('t1', 0)).color, getComputedStyle(__ct.sr('t1').querySelector('thead')).backgroundColor, cs.borderBottomColor]; });
  c.igual(r, ['italic', 'rgb(9, 9, 9)', 'rgb(200, 0, 0)', 'rgb(0, 0, 255)']);
});
p('13', 'thead sticky (top 0, z-index 100)', async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => { const cs = getComputedStyle(__ct.sr('t1').querySelector('thead')); return [cs.position, cs.top, cs.zIndex]; }), ['sticky', '0px', '100']);
});

// ---------- impresión ----------
const COLS_IMP = [{ field: 'codigo', title: 'Código' }, { field: 'nombre', title: 'Nombre', class: 'no-print' }, { field: 'saldo', title: 'Saldo', class: 'algo hide-on-print' }, { field: 'rfc', title: 'RFC' }];
i('01', 'beforeprint oculta las columnas no-print/hide-on-print; afterprint las vuelve a mostrar', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_IMP, data: CLIENTES }) });
  const r = await c.ev(() => { const cls = () => [0, 1, 2, 3].map(k => __ct.th('t1', k).classList.contains('hidde-col')); window.dispatchEvent(new Event('beforeprint')); const a = cls(); const b = __ct.filas('t1').every(tr => tr.cells[1].classList.contains('hidde-col')); window.dispatchEvent(new Event('afterprint')); return [a, b, cls()]; });
  c.igual(r, [[false, true, true, false], true, [false, false, false, false]]);
});
i('02', 'CSS @media print{.no-print{display:none}} en el shadow', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_IMP, data: CLIENTES }) });
  await c.page.emulateMedia({ media: 'print' });
  c.igual(await c.ev(() => getComputedStyle(__ct.th('t1', 1)).display), 'none');
});
i('03', 'la impresión de la página (emulada) no lanza errores y la tabla tiene todas las filas', async (c) => {
  await c.abrir({ body: tabla({ cols: COLS_IMP, data: CLIENTES }) });
  await c.page.emulateMedia({ media: 'print' });
  await c.page.pdf({ format: 'Letter' }).catch(() => null);
  c.sinErrores();
  c.igual(await c.ev(() => __ct.filas('t1').length), 5);
});

export default { nombre: 'actual-tarjetas-presentacion-impresion', grupo: 'actual', pruebas: P };
