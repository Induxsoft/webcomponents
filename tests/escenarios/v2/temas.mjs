// v2 F8b: temas (theme), paleta (palette), filas alternadas (striped) y densidad (density).
// Referencia generada con F8b: congela el comportamiento activado. Cada tema con una tabla rica (fijas, totales,
// casillas, agrupación, máscara, badges, negativos, selección) y una segunda tabla en tarjetas; captura PNG de #caja.
import { pagina, tabla } from '../../lib/pagina.mjs';

const E = ['v2', 'f8b', 'theme'];
const DATOS = [
  { codigo: 'C-001', nombre: 'Comercial Ficticia', linea: 'Norte', rfc: 'XAXX010101000', cantidad: 12, saldo: 1520.5 },
  { codigo: 'C-002', nombre: 'Abarrotes de Prueba', linea: 'Sur', rfc: 'XEXX010101000', cantidad: -3, saldo: -240.75 },
  { codigo: 'C-003', nombre: 'Papelería Inventada', linea: 'Norte', rfc: 'XAXX010101000', cantidad: 7, saldo: 98.1 },
  { codigo: 'C-004', nombre: 'Distribuidora Demo', linea: 'Sur', rfc: 'XAXX010101000', cantidad: 0, saldo: 15000 },
  { codigo: 'C-005', nombre: 'Servicios Ejemplo', linea: 'Centro', rfc: 'XEXX010101000', cantidad: 25, saldo: -12.4 },
];
const COLS = [
  { field: 'codigo', title: 'Código', type: 'Text', width: '80px', fixed: 'left' },
  { field: 'nombre', title: 'Cliente', type: 'Text', width: '190px' },
  { field: 'linea', title: 'Zona', type: 'Text', width: '80px' },
  { field: '_estado', title: 'Estado', type: 'Badges', width: '80px' },
  { field: 'rfc', title: 'RFC', type: 'Text', width: '140px', mask: 'rfc' },
  { field: 'cantidad', title: 'Cant.', type: 'Number', width: '70px', summary: 'sum' },
  { field: 'saldo', title: 'Saldo', type: 'Number', width: '110px', format: 'true', decs: '2', prefix: '$', thousandssep: 'true', summary: 'sum' },
];
const COLS_TARJ = [
  { field: '_avatar', title: '', type: 'Badges', badgegroup: 'avatar', card: 'true', cardslot: 'avatar' },
  { field: 'nombre', title: 'Cliente', type: 'Text', card: 'true', cardslot: 'title' },
  { field: 'rfc', title: 'RFC', type: 'Text', card: 'true', cardslot: 'subtitle' },
  { field: '_estado', title: 'Estado', type: 'Badges', card: 'true', cardslot: 'badge' },
];
const SCRIPT = `document.addEventListener('DOMContentLoaded', () => {
  const insignias = (r) => [r.saldo < 0 ? { id: 'mora', text: 'Mora', bg: '#A13A14', color: '#fff' } : { id: 'ok', text: 'Al día', bg: '#1E6B3A', color: '#fff' }];
  const t = ET('t1'); t.RowBadges = insignias; t.RowAccent = (r) => r.saldo < 0 ? '#A13A14' : null; t._printRows();
  const t2 = ET('t2'); if (t2) { t2.RowBadges = (r) => [{ id: 'av', group: 'avatar', text: r.nombre.slice(0, 2), bg: '#0b6e63', color: '#fff' }, ...insignias(r)]; t2._printRows(); t2.RefreshView(); }
});
window.__etExtra = () => { const t = ET('t1'); const s = ETs('t1'); return {
  theme: t.Theme, palette: t.Palette, striped: t.Striped, density: t.Density,
  f8b: s.querySelector('style[data-et="f8b"]') ? 'sí' : 'no',
  marcas: Array.from(s.querySelectorAll('tbody > tr')).slice(0, 7).map(tr => Array.from(tr.cells).map(td => (td.classList.contains('et-num') ? 'n' : '') + (td.classList.contains('et-neg') ? '-' : '')).join('|')),
  colores: ['thead', 'table', 'tbody > tr.EdiTable-Row-Selected', 'tfoot', 'tr.et-group-row > td', 'td.et-fixed'].map(q => { const el = s.querySelector(q); return el ? q + ': ' + getComputedStyle(el).backgroundColor + ' / ' + getComputedStyle(el).color : q + ': —'; }),
}; };`;
const ATTRS = { 'multi-select': 'checkbox', 'group-panel': 'true', 'design-auto-save': 'false' };
const html = ({ theme, attrs = {}, antes = '', estilo = '', tarjetas = true } = {}) => pagina({
  head: estilo ? `<style>${estilo}</style>` : '',
  body: `<div id="caja" style="width:760px;padding:8px${theme === 'oscuro' ? ';background:#15181C' : ''}">${antes}
<div style="width:740px;overflow:auto">${tabla({ attrs: { ...ATTRS, ...(theme ? { theme } : {}), ...attrs }, data: DATOS, cols: COLS, style: 'display:block;width:820px' })}</div>
${tarjetas ? `<div style="width:340px;margin-top:10px">${tabla({ id: 't2', attrs: { ...(theme ? { theme } : {}), 'cards-mode': 'always', 'cards-layout': 'slots', 'hidde-selector': 'true' }, data: DATOS.slice(0, 2), cols: COLS_TARJ })}</div>` : ''}</div>`,
  script: SCRIPT,
});
const PASOS = [
  ['marcar dos filas y seleccionar una celda', async h => { await h.js(() => ET('t1').SelectRows([0, 3])); await h.clicCelda('t1', 1, 2); }],
  ['agrupar por zona', h => h.js(() => ET('t1').GroupBy(['linea']))],
];
const porTema = (theme) => ({
  id: 'temas-' + theme, titulo: `theme="${theme}" en una tabla rica (fijas, totales, casillas, grupos, máscara, badges, negativos) y en tarjetas`,
  etiquetas: E, origen: 'spec F8b', registro: 'consumer', viewport: { width: 900, height: 700 }, captura: '#caja',
  html: html({ theme }), pasos: PASOS,
});

export default [
  ...['claro', 'oscuro', 'jade', 'libro-mayor'].map(porTema),
  {
    id: 'temas-caliente', titulo: 'Theme en caliente: claro → oscuro → jade → libro-mayor → sin tema (no redibuja ni dispara eventos; al final el DOM es el de antes)',
    etiquetas: E, origen: 'spec F8b', registro: 'all', viewport: { width: 900, height: 700 }, captura: '#caja', html: html({ tarjetas: false }),
    pasos: [
      ['seleccionar una celda', h => h.clicCelda('t1', 1, 1)],
      ...['claro', 'oscuro', 'jade', 'libro-mayor', ''].map(n => [`Theme = "${n}"`, h => h.js((n) => { ET('t1').Theme = n; }, n)]),
    ],
  },
  {
    id: 'temas-paleta', titulo: 'palette por atributo sobre jade, SetPalette con merge, variables de un contenedor (V12) y palette inválida',
    etiquetas: E, origen: 'spec F8b', registro: 'consumer', viewport: { width: 900, height: 700 }, captura: '#caja',
    html: html({ theme: 'jade', tarjetas: false, attrs: { palette: '{"header-bg":"#0F3D6E","header-fg":"#FFFFFF"}' }, estilo: '#caja{--et-sel-bg:#5B2A86;--et-sel-fg:#FFFFFF;--et-header-bg:#000000}' }),
    pasos: [
      ['seleccionar una celda', h => h.clicCelda('t1', 1, 1)],
      ['SetPalette({accent, row-alt-bg}, {merge:true})', h => h.js(() => ET('t1').SetPalette({ accent: '#B45309', 'row-alt-bg': '#FFF7ED' }, { merge: true }))],
      ['palette inválida por atributo', h => h.js(() => ET('t1').setAttribute('palette', '{malo'))],
    ],
  },
  {
    id: 'temas-sin-tema-variables', titulo: 'Sin theme: variables --et-* de un contenedor pintan la tabla (tema de V12 solo con CSS), con striped="true" y density="compacta"',
    etiquetas: E, origen: 'spec F8b', registro: 'consumer', viewport: { width: 900, height: 700 }, captura: '#caja',
    html: html({ tarjetas: false, attrs: { striped: 'true', density: 'compacta' }, estilo: '#caja{--et-header-bg:#0F3D6E;--et-header-fg:#FFFFFF;--et-border:#C9D3DF;--et-row-alt-bg:#F2F6FB}' }),
    pasos: [
      ['seleccionar una celda', h => h.clicCelda('t1', 1, 1)],
      ['density = comoda; striped = false', h => h.js(() => { const t = ET('t1'); t.Density = 'comoda'; t.Striped = false; })],
    ],
  },
];
