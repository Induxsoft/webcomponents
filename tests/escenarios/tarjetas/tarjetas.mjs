// Vista de tarjetas (original y configurable), badges y decoración de filas (editable.js:800-813, 2831-3870).
import { pagina, tabla } from '../../lib/pagina.mjs';

const DATOS = [
  { id: 1, nombre: 'Cliente de prueba Uno', tel: '55 0000 0001', estado: 'activo', fecha: '2026-06-15 08:30:00', vacio: '' },
  { id: 2, nombre: 'Cliente de prueba Dos', tel: '', estado: 'baja', fecha: '2026-06-14 18:00:00', vacio: '' },
  { id: 3, nombre: 'Cliente de prueba Tres', tel: '55 0000 0003', estado: 'activo', fecha: '2026-06-10 09:00:00', vacio: 'x' },
  { id: 4, nombre: 'Cliente de prueba Cuatro', tel: '55 0000 0004', estado: 'pendiente', fecha: '2025-12-24', vacio: '' },
];
const NOED = [
  { field: 'id', title: 'Id', type: 'NoEditable' },
  { field: 'nombre', title: 'Nombre', type: 'NoEditable' },
  { field: 'tel', title: 'Teléfono', type: 'NoEditable' },
  { field: 'estado', title: 'Estado', type: 'NoEditable' },
];
const r = (clave, fn) => (h) => h.js(([k, src]) => { let v; try { v = (new Function('t', 'return (' + src + ')(t)'))(ET('t1')); } catch (e) { v = '!excepción: ' + e.message; } window.__r[k] = window.__etSer(v); }, [clave, fn.toString()]);
const html = ({ attrs = {}, cols = NOED, script = '', data = DATOS, antes = '' } = {}) => pagina({ body: antes + tabla({ data, cols, attrs }), script: script + '\nwindow.__r = window.__r || {}; window.__etExtra = () => window.__r;' });
const ANGOSTO = { width: 600, height: 900 };
const ANCHO = { width: 1000, height: 700 };

export default [
  {
    id: 'responsive-ancho',
    titulo: 'cards-responsive="true", todas NoEditable, a 1000 px (tabla)',
    origen: 'editable.js:800-813, 195-208',
    viewport: ANCHO,
    html: html({ attrs: { 'cards-responsive': 'true' } }),
    pasos: [['clic', h => h.clicCelda('t1', 1, 1)]],
  },
  {
    id: 'responsive-angosto',
    titulo: 'cards-responsive="true" a 600 px: table-cards y td::before con data-cell',
    viewport: ANGOSTO,
    html: html({ attrs: { 'cards-responsive': 'true' } }),
    pasos: [
      ['clic en la segunda tarjeta', h => h.clicCelda('t1', 1, 1)],
      ['ensanchar (cambia a tabla)', h => h.viewport(1000, 900)],
      ['angostar otra vez', h => h.viewport(600, 900)],
    ],
  },
  {
    id: 'responsive-con-editable',
    titulo: 'cards-responsive con una columna editable: no se vuelve tarjeta',
    viewport: ANGOSTO,
    html: html({ attrs: { 'cards-responsive': 'true' }, cols: [...NOED, { field: 'vacio', title: 'Editable', type: 'Text' }] }),
    pasos: [],
  },
  {
    id: 'editable-responsive',
    titulo: 'editable-responsive="true": tarjetas aunque haya columnas editables',
    viewport: ANGOSTO,
    html: html({ attrs: { 'cards-responsive': 'true', 'editable-responsive': 'true' }, cols: [...NOED, { field: 'vacio', title: 'Editable', type: 'Text' }] }),
    pasos: [['clic y Enter en la columna editable', async h => { await h.clicCelda('t1', 0, 4); await h.tecla('Enter'); }]],
  },
  {
    id: 'modo-always',
    titulo: 'cards-mode="always" (configurable) a 1000 px',
    viewport: ANCHO,
    html: html({ attrs: { 'cards-mode': 'always' } }),
    pasos: [['clic', h => h.clicCelda('t1', 2, 1)]],
  },
  {
    id: 'modo-never',
    titulo: 'cards-mode="never" con cards-responsive a 600 px',
    viewport: ANGOSTO,
    html: html({ attrs: { 'cards-mode': 'never', 'cards-responsive': 'true' } }),
    pasos: [],
  },
  {
    id: 'modo-auto-breakpoint',
    titulo: 'cards-mode="auto" con cards-breakpoint="900px": ViewModeChanged al cruzar el ancho',
    origen: 'editable.js:3112-3185',
    viewport: ANCHO,
    html: html({ attrs: { 'cards-mode': 'auto', 'cards-breakpoint': '900px' } }),
    pasos: [
      ['a 850 px (tarjetas)', h => h.viewport(850, 700)],
      ['a 950 px (tabla)', h => h.viewport(950, 700)],
    ],
  },
  {
    id: 'breakpoint-contenedor',
    titulo: 'cards-breakpoint-target="container" (ResizeObserver del contenedor)',
    viewport: ANCHO,
    html: html({ attrs: { 'cards-mode': 'auto', 'cards-breakpoint': '500px', 'cards-breakpoint-target': 'container' }, antes: '', script: '' }).replace('<edit-table', '<div id="caja" style="width:800px"><edit-table').replace('</edit-table>', '</edit-table></div>'),
    pasos: [
      ['caja a 400 px', h => h.js(() => { document.getElementById('caja').style.width = '400px'; })],
      ['caja a 700 px', h => h.js(() => { document.getElementById('caja').style.width = '700px'; })],
    ],
  },
  {
    id: 'layouts',
    titulo: 'cards-layout stacked y slots, cards-gap, cards-padding, cards-field-gap, cards-label-width',
    viewport: ANGOSTO,
    html: pagina({
      body: tabla({ id: 'a', data: DATOS, cols: NOED, attrs: { 'cards-mode': 'always', 'cards-layout': 'stacked', 'cards-gap': '6px', 'cards-padding': '1rem 0', 'cards-field-gap': '2px' } })
        + tabla({ id: 'b', data: DATOS, cols: NOED.map((c, i) => ({ ...c, cardslot: ['avatar', 'title', 'subtitle', 'meta'][i] })), attrs: { 'cards-mode': 'always', 'cards-layout': 'slots' } })
        + tabla({ id: 'c', data: DATOS.slice(0, 2), cols: NOED, attrs: { 'cards-mode': 'always', 'cards-label-width': '0' } }),
    }),
    captura: 'body',
    pasos: [],
  },
  {
    id: 'atributos-de-columna',
    titulo: 'card, table, cardorder, cardlabel, cardslot, cardhideempty por columna; cards-hide-empty',
    origen: 'editable.js:3030-3059, 3416-3434',
    viewport: ANGOSTO,
    html: html({
      attrs: { 'cards-mode': 'auto', 'cards-hide-empty': 'true' },
      cols: [
        { field: 'id', title: 'Id', type: 'NoEditable', card: 'false' },
        { field: 'nombre', title: 'Nombre', type: 'NoEditable', card: 'true', cardorder: '2', cardlabel: 'Cliente' },
        { field: 'tel', title: 'Teléfono', type: 'NoEditable', card: 'true', cardorder: '1', cardhideempty: 'true' },
        { field: 'estado', title: 'Estado', type: 'NoEditable', card: 'true', table: 'false', cardlabel: '' },
        { field: 'vacio', title: 'Vacío', type: 'NoEditable', card: 'true' },
      ],
    }),
    pasos: [['a 1000 px (tabla: la columna table=false se oculta)', h => h.viewport(1000, 900)]],
  },
  {
    id: 'cardcolumns',
    titulo: 'CardColumns por propiedad + RefreshView',
    viewport: ANGOSTO,
    html: html({ attrs: { 'cards-responsive': 'true' }, script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.CardColumns = ['estado', { field: 'nombre', label: 'Quién', slot: 'title' }]; t.RefreshView(); });` }),
    pasos: [['cambiar CardColumns', r('a', t => { t.CardColumns = [{ field: 'tel', hideEmpty: true }]; t.RefreshView(); return t.IsCardView; })]],
  },
  {
    id: 'badges-campo',
    registro: 'consumer',
    titulo: 'Badges desde el campo __badges y desde badges-field',
    origen: 'editable.js:3549-3555, 3644-3697',
    html: pagina({
      body: tabla({ id: 'a', data: DATOS.map((d, i) => ({ ...d, __badges: i % 2 ? [{ text: 'Nuevo', bg: '#0A7' }, { icon: '★', position: 'end' }] : 'Uno' })), cols: NOED })
        + tabla({ id: 'b', data: DATOS.map((d, i) => ({ ...d, marcas: [{ text: String(i), position: 'overlay-end' }, { text: 'S', position: 'overlay-start', tooltip: 'inicio' }] })), cols: NOED, attrs: { 'badges-field': 'marcas' } }),
    }),
    captura: 'body',
    pasos: [['clic en un badge sin manejador (sigue a la celda)', h => h.clicShadow('a', 'tbody tr:nth-child(2) .et-badge')]],
  },
  {
    id: 'badges-funcion-y-api',
    registro: 'consumer',
    titulo: 'RowBadges, SetRowBadges, AddRowBadge, RemoveRowBadge, ResetRowBadges, GetRowBadges',
    origen: 'editable.js:3557-3621',
    html: html({ script: `ET('t1').RowBadges = (row, i) => (row.estado === 'activo' ? [{ id: 'act', text: 'A', bg: '#0A7', tooltip: 'Activo' }] : null);` }),
    pasos: [
      ['SetRowBadges(1)', r('a', t => t.SetRowBadges(1, [{ id: 'x', text: 'X' }]))],
      ['AddRowBadge(1) nuevo y con id repetido', r('b', t => { t.AddRowBadge(1, { id: 'y', text: 'Y' }); t.AddRowBadge(1, { id: 'x', text: 'X2' }); return t.GetRowBadges(1); })],
      ['RemoveRowBadge(1, x)', r('c', t => { t.RemoveRowBadge(1, 'x'); return t.GetRowBadges(1); })],
      ['RemoveRowBadge(0) (todos)', r('d', t => { t.RemoveRowBadge(0); return t.GetRowBadges(0); })],
      ['ResetRowBadges(0)', r('e', t => { t.ResetRowBadges(0); return t.GetRowBadges(0); })],
      ['fuera de rango', r('f', t => [t.SetRowBadges(50, []), t.GetRowBadges(50)])],
      ['_printRows conserva los overrides por clave', r('g', t => { t._printRows(); return t.GetRowBadges(1); })],
    ],
  },
  {
    id: 'badges-columna-grupos',
    registro: 'consumer',
    titulo: 'Columnas Badges con badgegroup',
    html: html({
      cols: [{ field: '_av', title: '', type: 'Badges', badgegroup: 'avatar' }, ...NOED.slice(1), { field: '_est', title: 'Marcas', type: 'Badges' }],
      script: `ET('t1').RowBadges = (row, i) => [{ group: 'avatar', text: row.nombre.split(' ').pop()[0] }, { text: row.estado }, { group: 'otro', text: 'sin grupo reclamado' }];`,
    }),
    pasos: [['clic en columna Badges y Enter (no edita)', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('Enter'); }]],
  },
  {
    id: 'badges-clic',
    titulo: 'BadgeOnClick, onClick del badge, evento BadgeClick con cancel, badge-selects-row y teclado',
    origen: 'editable.js:3706-3833',
    registro: 'consumer',
    html: html({
      attrs: { 'badge-selects-row': 'true' },
      script: `window.__clics = [];
document.addEventListener('DOMContentLoaded', () => { const t = ET('t1');
  t.RowBadges = (row, i) => [{ id: 'a', text: 'a' + i }, { id: 'b', text: 'b' + i, onClick: (e) => window.__clics.push('onClick ' + e.irow) }];
  t.BadgeOnClick = (irow, b, row, ev) => window.__clics.push('BadgeOnClick ' + irow + ' ' + b.id);
  t.Events[t.EdiTable.Const.Events.BadgeClick] = (e) => { window.__clics.push('evento ' + e.irow + ' ' + e.badge.id); if (e.irow === 2) e.cancel = true; };
  t.RefreshBadges();
});
window.__etExtra = () => window.__clics;`,
    }),
    pasos: [
      ['clic badge a fila 0', h => h.clicShadow('t1', 'tbody tr:nth-child(1) .et-badge[data-badge-id=a]')],
      ['clic badge b fila 1', h => h.clicShadow('t1', 'tbody tr:nth-child(2) .et-badge[data-badge-id=b]')],
      ['clic badge a fila 2 (cancelado)', h => h.clicShadow('t1', 'tbody tr:nth-child(3) .et-badge[data-badge-id=a]')],
      ['Enter sobre un badge enfocado', async h => { await h.js(() => ETs('t1').querySelector('tbody tr:nth-child(4) .et-badge').focus()); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'badges-tooltip-custom',
    registro: 'consumer',
    titulo: 'badge-tooltip="custom": tooltip propio (div.et-tooltip en el shadow)',
    origen: 'editable.js:3835-3863',
    html: html({ attrs: { 'badge-tooltip': 'custom' }, script: `ET('t1').RowBadges = (row, i) => ({ text: 'i' + i, tooltip: 'Ayuda ' + row.nombre });` }),
    pasos: [
      ['pasar el ratón sobre un badge', async h => { const p = await h.page.evaluate(() => { const b = ETs('t1').querySelector('tbody tr:nth-child(2) .et-badge').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }); await h.page.mouse.move(p[0], p[1]); await h.asentar(); }],
      ['salir', async h => { await h.page.mouse.move(5, 5); await h.asentar(); }],
    ],
  },
  {
    id: 'badges-iconos',
    registro: 'consumer',
    titulo: 'Iconos de badge: SVG saneado (sin script/on*/href externos), img: con origen seguro e inseguro, texto',
    origen: 'editable.js:3771-3812',
    html: html({ script: `ET('t1').RowBadges = (row, i) => [
  { icon: '<svg viewBox="0 0 16 16" onload="alert(1)"><script>alert(2)<\\/script><a href="https://x.invalid"><circle cx="8" cy="8" r="6" onclick="x()"/></a><use href="#loc"/></svg>', text: 's' },
  { icon: 'img:data:image/png;base64,iVBORw0KGgo=' }, { icon: 'img:javascript:alert(1)' }, { icon: 'img:/relativo.png' }, { icon: '<svg><bad' }, { icon: '✓', size: '2rem', color: '#f00', className: 'mi-clase' }];` }),
    pasos: [],
  },
  {
    id: 'decoracion-filas',
    registro: 'consumer',
    titulo: 'RowAccent, RowClass, RowClassField (row-class-field), CellClass y onRowPaint',
    origen: 'editable.js:3371-3440',
    html: html({
      attrs: { 'row-class-field': 'clases' },
      data: DATOS.map((d, i) => ({ ...d, clases: i === 1 ? 'resaltada EdiTable-Row-Selected otra' : (i === 2 ? ['lista', ''] : '') })),
      script: `const t = ET('t1');
t.RowAccent = (row) => (row.estado === 'baja' ? '#c00' : (row.estado === 'pendiente' ? 'orange' : null));
t.RowClass = (row, i) => (i % 2 ? ['par-' + i] : 'non-' + i);
t.CellClass = (row, field, i, def) => (field === 'estado' ? 'estado-' + row.estado : null);
t.onRowPaint = (tr, i, row) => tr.setAttribute('data-pintada', i);`,
    }),
    pasos: [
      ['clic (la fila seleccionada conserva sus clases)', h => h.clicCelda('t1', 1, 1)],
      ['cambiar datos y RefreshDecorations', r('a', t => { t.DataArray[0].estado = 'baja'; t.RefreshDecorations(); })],
      ['RowClass que lanza error (no interrumpe)', r('b', t => { t.RowClass = () => { throw new Error('falla a propósito'); }; t.RefreshDecorations(); })],
    ],
  },
  {
    id: 'fechas-relativas',
    titulo: 'format="relative" con la fecha fija del banco (2026-06-15), Locale y RelativeDateFormatter',
    origen: 'editable.js:3453-3505',
    html: pagina({
      body: tabla({ id: 'a', data: DATOS, cols: [...NOED.slice(0, 2), { field: 'fecha', title: 'Fecha', type: 'NoEditable', format: 'relative', textalign: 'end' }] })
        + tabla({ id: 'b', data: DATOS, cols: [...NOED.slice(0, 2), { field: 'fecha', title: 'Fecha', type: 'NoEditable', format: 'relative' }], attrs: { locale: 'en-US' } })
        + tabla({ id: 'c', data: [...DATOS, { id: 5, nombre: 'x', fecha: 'no es fecha' }, { id: 6, nombre: 'y', fecha: '' }], cols: [...NOED.slice(0, 2), { field: 'fecha', title: 'Fecha', type: 'Text', format: 'relative' }] }),
      script: `ET('c').RelativeDateFormatter = (raw, d) => 'hace ' + Math.round((Date.now() - d.getTime()) / 3600000) + ' h';`,
    }),
    captura: 'body',
    pasos: [['clic en una fecha relativa (se ve el valor real con el selector)', h => h.clicCelda('a', 0, 2)], ['Enter (edición en tabla c)', async h => { await h.clicCelda('c', 0, 2); await h.tecla('Enter'); }]],
  },
  {
    id: 'oncardpaint',
    titulo: 'onCardPaint solo en vista de tarjetas',
    viewport: ANGOSTO,
    html: html({ attrs: { 'cards-mode': 'auto' }, script: `ET('t1').onCardPaint = (tr, i, row) => tr.setAttribute('data-tarjeta', i);` }),
    pasos: [['ensanchar', h => h.viewport(1000, 900)], ['angostar', h => h.viewport(600, 900)]],
  },
  {
    id: 'doc-ejemplo-agentes',
    registro: 'consumer',
    titulo: 'Ejemplo de editable.md («agentes»): slots, badges con grupos, relativo, plantilla (uso tipo agent.induxsoft.net)',
    origen: 'docs.induxsoft.net es/api/web-components/editable.md:157-200',
    viewport: { width: 560, height: 800 },
    html: pagina({
      body: `<div style="width:520px"><edit-table id="agentes" hidde-selector="true" html-encode="true" template-encode="true" cards-mode="auto" cards-breakpoint="600px" cards-breakpoint-target="container" cards-layout="slots" cards-hide-empty="true" badge-tooltip="custom">
<edit-thead><edit-tr>
<edit-th type="Badges" field="_avatar" badgegroup="avatar" card="true" cardslot="avatar"></edit-th>
<edit-th type="NoEditable" field="username" card="true" cardslot="title">Usuario</edit-th>
<edit-th type="NoEditable" field="userphone" card="true" cardslot="subtitle">Teléfono</edit-th>
<edit-th type="NoEditable" field="usermail">Correo</edit-th>
<edit-th type="NoEditable" field="lastchat" format="relative" card="true" cardslot="meta">Últ. mensaje</edit-th>
<edit-th type="NoEditable" field="human_nm" card="true" cardslot="subtitle" cardlabel="Atiende">Humano</edit-th>
<edit-th type="Badges" field="_estado" card="true" cardslot="badge">Estado</edit-th>
<edit-th type="NoEditable" field="_" card="true" cardslot="footer" cardlabel="" template='<a href="#chat-\${DataRow.chat_id}">Ver mensajes</a>'>Chat</edit-th>
</edit-tr></edit-thead></edit-table></div>`,
      script: `document.addEventListener('DOMContentLoaded', () => { const t = document.getElementById('agentes');
  t.RowBadges = (r) => [{ id: 'avatar', group: 'avatar', text: r.username.split(' ').map(x => x[0]).join('').slice(0, 2), bg: '#0B6E63', tooltip: r.userphone }, { id: 'count', text: r.messages, bg: '#1FAF5A', tooltip: r.messages + ' mensajes' }];
  t.DataArray = [
    { chat_id: 1, username: 'Usuario Ficticio', userphone: '55 0000 0000', usermail: 'ficticio@example.invalid', lastchat: '2026-06-15 09:12:00', human_nm: '', messages: 3 },
    { chat_id: 2, username: 'Otra Persona <b>', userphone: '', usermail: '', lastchat: '2026-06-13 20:00:00', human_nm: 'Agente de prueba', messages: 12 }];
  t._printRows(); t.RefreshView(); });`,
    }),
    captura: 'body',
    pasos: [['clic en la primera tarjeta', h => h.clicCelda('agentes', 0, 1)]],
  },
];
