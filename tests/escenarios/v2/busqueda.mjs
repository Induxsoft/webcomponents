// F8a (edittable-spec-f8-funcional.md §1): búsqueda y filtro. Congela el comportamiento activado.
import { html, COLS } from './_f8comun.mjs';

const E = ['v2', 'f8a', 'busqueda'];
const V12 = 'div:has(table#t1){overflow:revert !important}';
const GEN = (n) => `window.__gen = () => Array.from({ length: ${n} }, (_, i) => ({ codigo: 'P-' + String(i + 1).padStart(5, '0'), nombre: 'Producto ficticio ' + (i + 1), linea: ['Ferretería', 'Eléctrico', 'Plomería', 'Pintura'][i % 4], cantidad: (i * 7) % 50, precio: ((i * 37) % 1000) / 10 }));`;

export default [
  {
    id: 'f8a-busqueda-barra', titulo: 'search-bar: teclear filtra (debounce), Enter recorre y deja el foco en la barra, Escape limpia; Search/ClearSearch, filter:false con F3',
    etiquetas: E, origen: 'spec F8a §1', registro: 'consumer',
    html: html({ attrs: { 'search-bar': 'true' }, eventos: ['SearchChanged', 'FilterChanged'] }),
    pasos: [
      ['foco en la barra y teclear "elec"', async h => { await h.js(() => ETs('t1').querySelector('.et-search-input').focus()); await h.escribir('elec'); await h.esperar(300); }],
      ['Enter dos veces en la barra', h => h.tecla('Enter', 2)],
      ['Escape: limpia', async h => { await h.tecla('Escape'); await h.esperar(50); }],
      ['Search("cobre ") con filter:false: salta sin filtrar', h => h.js(() => ET('t1').Search('cobre ', { filter: false }))],
      ['F3 y Mayús+F3 en la tabla', async h => { await h.js(() => ET('t1').Search('a', { filter: false, columns: ['codigo'] })); await h.tecla('F3'); await h.tecla('Shift+F3'); }],
      ['Filter({cantidad: {op:"ge", value: 5}}) + Search("o")', h => h.js(() => { const t = ET('t1'); t.ClearSearch(); t.Filter({ cantidad: { op: 'ge', value: 5 } }); t.Search('o'); })],
      ['flecha abajo desde la primera visible (salta filtradas)', async h => { await h.js(() => ET('t1').NavTo(0, 1)); await h.tecla('ArrowDown'); }],
      ['ClearFilter y ClearSearch', h => h.js(() => { const t = ET('t1'); t.ClearFilter(); t.ClearSearch(); })],
    ],
  },
  {
    id: 'f8a-busqueda-arbol-edicion', titulo: 'filtro con edición y filas nuevas (no desaparecen hasta RefreshFilter), DataArray nuevo con filtro activo',
    etiquetas: E, origen: 'spec F8a §1', registro: 'consumer',
    html: html({ eventos: ['FilterChanged'] }),
    pasos: [
      ['Search("cable")', h => h.js(() => ET('t1').Search('cable'))],
      ['editar el nombre de A2 a "Alambre"', async h => { await h.js(() => ET('t1').NavTo(1, 1)); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('Alambre'); await h.tecla('Enter'); }],
      ['RefreshFilter()', h => h.js(() => ET('t1').RefreshFilter())],
      ['AddRow(): la fila nueva se ve', h => h.js(() => ET('t1').AddRow())],
      ['DataArray nuevo y _printRows con la búsqueda activa', h => h.js(() => { const t = ET('t1'); t.Search('z'); t.DataArray = [{ codigo: 'Z1', nombre: 'Zinc' }, { codigo: 'Z2', nombre: 'Otro' }, { codigo: 'Z3', nombre: 'Zapata' }]; t._printRows(); })],
    ],
  },
  {
    id: 'f8a-combinado-virtual-grupos', titulo: 'combinado: virtual-rows (2,000 filas) + grupos + selección + totales con summary-scope="visible" y filtro; SelectAll y exportar visibleOnly',
    etiquetas: E, origen: 'spec F8a §1, §10, §11, §4.1, §2', registro: 'consumer', estilos: false,
    html: html({
      attrs: { 'virtual-rows': 'true', 'row-height': '28px', 'control-styles': V12, 'group-panel': 'true', 'multi-select': 'checkbox', 'summary-scope': 'visible' },
      cols: COLS({ cantidad: { summary: 'sum' } }), data: [],
      envolver: (t) => `<div id="sc" style="height:360px;overflow-y:auto">${t}</div>`,
      script: GEN(2000) + "\ndocument.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.AutoAddRow = false; t.DataArray = window.__gen(); t._printRows(); });",
    }),
    pasos: [
      ['GroupBy(linea)', h => h.js(() => ET('t1').GroupBy(['linea']))],
      ['Search("ficticio 19")', h => h.js(() => ET('t1').Search('ficticio 19'))],
      ['SelectAll() con filtro y exportar visibleOnly', h => h.js(() => { const t = ET('t1'); t.SelectAll(); window.__x = [t.getExportData({ visibleOnly: true }).rows.length, t.getExportData().rows.length]; })],
      ['Filter({linea: "Pintura"}) (con la búsqueda)', h => h.js(() => ET('t1').Filter({ linea: 'Pintura' }))],
      ['Ungroup y ClearFilter', h => h.js(() => { const t = ET('t1'); t.Ungroup(); t.ClearFilter(); })],
      ['ClearSearch', h => h.js(() => ET('t1').ClearSearch())],
    ],
  },
];
