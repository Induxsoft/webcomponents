// Presentación: encabezado fijo, ancho de columnas, orden por encabezado, control-styles y atributos visuales.
import { pagina, tabla, filas, COLS_BASE } from '../../lib/pagina.mjs';
import { controlStylesDe } from '../../fixtures/v12/dbeditable.mjs';

const DATOS = filas(30);
const html = (o = {}) => pagina({ body: (o.antes ?? '') + tabla({ data: o.data ?? DATOS.slice(0, o.n ?? 6), cols: o.cols ?? COLS_BASE, attrs: o.attrs ?? {} }) + (o.despues ?? ''), script: o.script });

export default [
  {
    id: 'encabezado-sticky',
    titulo: 'thead sticky (top:0, z-index:100) dentro de un contenedor con scroll',
    origen: 'editable.js:74-79, 219',
    viewport: { width: 900, height: 500 },
    html: pagina({ body: `<div id="caja" style="height:220px;overflow:auto">${tabla({ data: DATOS, cols: COLS_BASE })}</div>`, script: `window.__etExtra = () => { const s = ETs('t1'); const th = s.querySelector('thead').getBoundingClientRect(); const caja = document.getElementById('caja').getBoundingClientRect(); return { theadTopRelativo: Math.round(th.top - caja.top), scroll: document.getElementById('caja').scrollTop }; };` }),
    pasos: [
      ['desplazar la caja 300 px', h => h.js(() => { document.getElementById('caja').scrollTop = 300; })],
      ['clic en una fila visible y flechas abajo x8 (mantener visible)', async h => { await h.clicCelda('t1', 12, 1); await h.tecla('ArrowDown', 8); }],
    ],
  },
  {
    id: 'scroll-interno',
    titulo: 'Contenedor interno con max-height:100% y overflow:auto cuando el host tiene alto',
    html: pagina({ body: `<div style="height:200px;display:flex">${tabla({ data: DATOS, cols: COLS_BASE, style: 'width:100%;height:200px;display:block' })}</div>` }),
    pasos: [['clic y PageDown', async h => { await h.clicCelda('t1', 2, 1); await h.tecla('PageDown'); }]],
  },
  {
    id: 'redimensionar-columna',
    titulo: 'Cambiar el ancho de una columna arrastrando el borde (sizable-border)',
    origen: 'editable.js:416-464',
    html: html({ cols: COLS_BASE.map(c => ({ ...c, width: '150px' })) }),
    pasos: [
      ['arrastrar el borde de Nombre +80 px', h => h.redimensionar('t1', 1, 80)],
      ['arrastrar el borde de Id -30 px', h => h.redimensionar('t1', 0, -30)],
      ['arrastrar el borde de la última columna', h => h.redimensionar('t1', 3, 40)],
      ['clic en el borde no ordena', h => h.clicShadow('t1', 'thead th:nth-child(2) .sizable-border')],
    ],
  },
  {
    id: 'ordenar-por-encabezado',
    titulo: 'Clic en el encabezado: ordena DataArray; clases ascendent/descendent; contador por th',
    origen: 'editable.js:492-522',
    html: html({ data: [{ id: 3, nombre: 'carlos', cantidad: 10, precio: 5 }, { id: 1, nombre: 'Ana', cantidad: 2, precio: 50 }, { id: 2, nombre: 'beto', cantidad: '9', precio: 7.5 }, { id: 4, nombre: '', cantidad: 1, precio: null }] }),
    pasos: [
      ['clic en Nombre', h => h.clicEncabezado('t1', 1)],
      ['clic en Nombre otra vez', h => h.clicEncabezado('t1', 1)],
      ['clic en Cantidad (mezcla número y texto)', h => h.clicEncabezado('t1', 2)],
      ['clic en Nombre (su contador sigue)', h => h.clicEncabezado('t1', 1)],
      ['clic en Precio (null)', h => h.clicEncabezado('t1', 3)],
      ['seleccionar, ordenar: se pierde la selección', async h => { await h.clicCelda('t1', 1, 1); await h.clicEncabezado('t1', 0); }],
    ],
  },
  {
    id: 'sortable-false-atributo',
    titulo: 'sorTable="false" (atributo): el clic no ordena',
    origen: 'editable.js:231-233',
    html: html({ attrs: { sorTable: 'false' } }),
    pasos: [['clic en Nombre', h => h.clicEncabezado('t1', 1)]],
  },
  {
    id: 'control-styles-v12',
    titulo: 'control-styles con los selectores literales de V12 (div:has(table#id), #id tr th, @media print)',
    origen: 'uielements.v12.dkl:85-92',
    viewport: { width: 900, height: 450 },
    html: pagina({ body: `<div id="list_table_container" style="overflow-y:auto; max-height:300px;">${tabla({ id: 'tbl_x', data: DATOS, cols: COLS_BASE, attrs: { 'hidde-selector': 'true', 'cards-responsive': 'true', 'control-styles': controlStylesDe('tbl_x', '') } })}</div>`, script: `window.__etExtra = () => ({ overflowDivInterno: getComputedStyle(ETs('tbl_x').querySelector('div')).overflowY, pesoTh: getComputedStyle(ETs('tbl_x').querySelector('th')).fontWeight, scrollExterno: document.getElementById('list_table_container').scrollTop });` }),
    pasos: [
      ['clic y flechas abajo x15 (el scroll es el del div externo)', async h => { await h.clicCelda('tbl_x', 2, 1); await h.tecla('ArrowDown', 15); }],
    ],
  },
  {
    id: 'control-styles-treetest',
    titulo: 'control-styles de _treeTest.html (tr td, th, thead, .EdiTable-Cell, tbody, #__table_input)',
    origen: 'examples/_treeTest.html',
    html: html({ attrs: { 'control-styles': 'tr td{font-size:.8rem;} th{font-size:.8rem;} thead{ background-color: #ededed; } .EdiTable-Cell{ outline: 1px solid #EDEDED !important; } tbody{ background-color: #FFF !important; } #__table_input{ font-size: unset !important; }' } }),
    pasos: [['clic y Enter', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('Enter'); }]],
  },
  {
    id: 'anchos-y-alineacion',
    titulo: 'width, minwidth, maxwidth y textalign (en th y en .cell-content)',
    origen: 'editable.js:335-352, 2266-2286',
    html: html({ cols: [{ field: 'id', title: 'Id', width: '60px', textalign: 'center' }, { field: 'nombre', title: 'Nombre', minwidth: '250px', maxwidth: '300px' }, { field: 'cantidad', title: 'Cantidad', textalign: 'end', width: '90px' }, { field: 'precio', title: 'Precio', maxwidth: '80px', textalign: 'right' }] }),
    pasos: [['clic en Nombre', h => h.clicCelda('t1', 0, 1)]],
  },
  {
    id: 'alturas-de-fila',
    titulo: 'min-row-height, max-row-height y row-height (display:block en .cell-content)',
    origen: 'editable.js:770-772, 2271-2284',
    html: pagina({
      body: tabla({ id: 'a', data: DATOS.slice(0, 2), cols: COLS_BASE, attrs: { 'min-row-height': '2.5rem' } })
        + tabla({ id: 'b', data: [{ id: 1, nombre: 'Texto muy largo '.repeat(12), cantidad: 1, precio: 2 }], cols: COLS_BASE, attrs: { 'max-row-height': '2rem' } })
        + tabla({ id: 'c', data: DATOS.slice(0, 2), cols: COLS_BASE, attrs: { 'row-height': '30px' } }),
    }),
    captura: 'body',
    pasos: [['clic en b', h => h.clicCelda('b', 0, 1)]],
  },
  {
    id: 'selectores-ocultos',
    titulo: 'hidde-selector="true" (selector transparente) y hide-row-selector="true" (sin fila resaltada)',
    origen: 'editable.js:767-768, 2089, 2108',
    html: pagina({ body: tabla({ id: 'a', data: DATOS.slice(0, 3), cols: COLS_BASE, attrs: { 'hidde-selector': 'true' } }) + tabla({ id: 'b', data: DATOS.slice(0, 3), cols: COLS_BASE, attrs: { 'hide-row-selector': 'true' } }) }),
    captura: 'body',
    pasos: [['clic en a', h => h.clicCelda('a', 1, 1)], ['clic en b', h => h.clicCelda('b', 1, 1)]],
  },
  {
    id: 'clase-de-columna',
    titulo: 'class en edit-th (se copia al th, no a los td)',
    html: html({ cols: COLS_BASE.map((c, i) => ({ ...c, class: ['no-print', 'hide-on-print', 'mi-col', ''][i] })) }),
    pasos: [],
  },
  {
    id: 'plantilla-html',
    titulo: 'Columna con template HTML (enlace y botón) y html-encode en las demás',
    html: html({ attrs: { 'html-encode': 'true' }, data: [{ id: 1, nombre: '<b>no html</b>', cantidad: 1, precio: 1 }], cols: [...COLS_BASE, { field: 'acc', title: 'Acciones', type: 'NoEditable', template: '<a href="#${DataRow.id}">Ver</a> <button>Borrar</button>' }] }),
    pasos: [['clic en la plantilla y fuera', async h => { await h.clicCelda('t1', 0, 4); await h.clicCelda('t1', 0, 0); }]],
  },
  {
    id: 'columna-oculta-visual',
    registro: 'consumer',
    titulo: 'hideColumn: celdas y th con hidde-col; badges se mueven a la siguiente visible',
    html: html({ script: `ET('t1').RowBadges = (r, i) => ({ text: 'b' + i });`, n: 3 }),
    pasos: [['ocultar Id', h => h.js(() => ET('t1').hideColumn('id', true))], ['mostrar Id', h => h.js(() => ET('t1').hideColumn('id', false))]],
  },
  {
    id: 'keep-selection-visible',
    titulo: 'keep-selection-visible="false" e "if-visible"',
    origen: 'editable.js:2897, 3204-3275',
    viewport: { width: 900, height: 500 },
    html: pagina({
      body: `<div id="c1" style="height:150px;overflow:auto;width:440px;display:inline-block">${tabla({ id: 'a', data: DATOS, cols: COLS_BASE, attrs: { 'keep-selection-visible': 'false' } })}</div><div id="c2" style="height:150px;overflow:auto;width:440px;display:inline-block">${tabla({ id: 'b', data: DATOS, cols: COLS_BASE, attrs: { 'keep-selection-visible': 'if-visible' } })}</div>`,
      script: `window.__etExtra = () => [document.getElementById('c1').scrollTop, document.getElementById('c2').scrollTop];`,
    }),
    captura: 'body',
    pasos: [
      ['clic en fila 2 de cada una y desplazar', async h => { await h.clicCelda('a', 2, 1); await h.clicCelda('b', 2, 1); await h.js(() => { document.getElementById('c1').scrollTop = 600; document.getElementById('c2').scrollTop = 600; }); }],
      ['cambiar el ancho de las cajas', h => h.js(() => { document.getElementById('c1').style.width = '400px'; document.getElementById('c2').style.width = '400px'; })],
    ],
  },
  {
    id: 'hover',
    titulo: 'tbody tr:hover (fondo #F5F5F5)',
    html: html({ n: 3 }),
    pasos: [['pasar el ratón por la fila 1', async h => { const p = await h.page.evaluate(() => { const b = ETs('t1').querySelector('tbody').rows[1].getBoundingClientRect(); return [b.x + 30, b.y + b.height / 2]; }); await h.page.mouse.move(p[0], p[1]); await h.asentar(); }]],
  },
];
