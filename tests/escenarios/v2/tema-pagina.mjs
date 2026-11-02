// v2: tema de la página (InduxsoftTheme). Las tablas sin theme propio toman data-et-theme / data-et-palette /
// data-et-density del ancestro más cercano. Referencia generada con el módulo común: congela el comportamiento activado.
import { pagina, tabla } from '../../lib/pagina.mjs';

const E = ['v2', 'page-theme', 'theme'];
const DATOS = [
  { codigo: 'C-001', nombre: 'Comercial Ficticia', cantidad: 12, saldo: 1520.5 },
  { codigo: 'C-002', nombre: 'Abarrotes de Prueba', cantidad: -3, saldo: -240.75 },
  { codigo: 'C-003', nombre: 'Papelería Inventada', cantidad: 7, saldo: 98.1 },
];
const COLS = [
  { field: 'codigo', title: 'Código', type: 'Text', width: '80px' },
  { field: 'nombre', title: 'Cliente', type: 'Text', width: '180px' },
  { field: 'cantidad', title: 'Cant.', type: 'Number', width: '70px' },
  { field: 'saldo', title: 'Saldo', type: 'Number', width: '100px', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' },
];
const T = (id, attrs = {}) => tabla({ id, attrs: { 'design-auto-save': 'false', ...attrs }, data: DATOS, cols: COLS, style: 'width:460px' });
const SCRIPT = `window.__etExtra = () => Object.fromEntries(Array.from(document.querySelectorAll('edit-table')).map(t => {
  const s = t._shadow, th = s && s.querySelector('thead');
  return [t.id, { theme: t.Theme, density: t.Density, f8b: s && s.querySelector('style[data-et="f8b"]') ? 'sí' : 'no',
    thead: th ? getComputedStyle(th).backgroundColor + ' / ' + getComputedStyle(th).color : '—',
    resuelto: JSON.stringify(InduxsoftTheme.resolve(t)) }];
}));`;
const conAtributos = (html, { htmlAttrs = '', bodyAttrs = '' }) => html.replace('<html lang="es-MX">', `<html lang="es-MX"${htmlAttrs}>`).replace('<body>', `<body${bodyAttrs}>`);

export default [
  {
    id: 'tema-pagina-zonas', titulo: '<body data-et-theme="claro"> con un panel oscuro, una zona libro-mayor compacta con palette, un corte data-et-theme="" y una tabla con theme propio',
    etiquetas: E, origen: 'spec tema de la página', registro: 'consumer', viewport: { width: 1000, height: 900 }, captura: '#caja',
    html: conAtributos(pagina({
      body: `<div id="caja" style="width:960px;display:grid;grid-template-columns:480px 480px;gap:8px">
<section>${T('t1')}</section>
<aside data-et-theme="oscuro" style="background:#15181C;padding:4px">${T('t2')}</aside>
<section data-et-theme="libro-mayor" data-et-density="compacta" data-et-palette='{"header-bg":"#0F3D6E","header-fg":"#FFFFFF"}'>${T('t3')}</section>
<section data-et-theme="">${T('t4')}</section>
<section>${T('t5', { theme: 'jade' })}</section></div>`,
      script: SCRIPT,
    }), { bodyAttrs: ' data-et-theme="claro"' }),
    pasos: [
      ['seleccionar una celda en el panel oscuro', h => h.clicCelda('t2', 1, 1)],
    ],
  },
  {
    id: 'tema-pagina-caliente', titulo: 'Sin nada declarado; InduxsoftTheme.set/setDensity/setPalette en <html> y en una zona, en caliente; al quitarlos el DOM es el de antes',
    etiquetas: E, origen: 'spec tema de la página', registro: 'all', viewport: { width: 1000, height: 700 }, captura: '#caja',
    html: pagina({ body: `<div id="caja" style="width:960px;display:grid;grid-template-columns:480px 480px;gap:8px"><div>${T('t1')}</div><div id="zona">${T('t2')}</div></div>`, script: SCRIPT }),
    pasos: [
      ['seleccionar una celda', h => h.clicCelda('t1', 1, 1)],
      ['set("oscuro") en <html>', h => h.js(() => InduxsoftTheme.set('oscuro'))],
      ['setDensity("comoda") y setPalette({accent, header-bg})', h => h.js(() => { InduxsoftTheme.setDensity('comoda'); InduxsoftTheme.setPalette({ accent: '#B45309', 'header-bg': '#3A2A10' }); })],
      ['set("jade", {on: zona})', h => h.js(() => InduxsoftTheme.set('jade', { on: document.getElementById('zona') }))],
      ['quitar todo', h => h.js(() => { InduxsoftTheme.set(null); InduxsoftTheme.setDensity(null); InduxsoftTheme.setPalette(null); InduxsoftTheme.set(null, { on: document.getElementById('zona') }); })],
    ],
  },
];
