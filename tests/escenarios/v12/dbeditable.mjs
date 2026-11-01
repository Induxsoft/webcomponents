// V12: lo que genera uie.dbeditable (uielements.v12.dkl:41-323) y lo que hacen list.dk:84-89 (acción por registro),
// induxsoft.v12.ui.js:26-69 (impresión) y v12navbar.ExportarCSV (uielements.v12.dkl:655-714).
// El HTML/JS literal sale de tests/fixtures/v12/extraido.mjs (ver tests/tools/extraer-v12.mjs).
import { pagina } from '../../lib/pagina.mjs';
import { dbeditable, getCurrentContextDe, plantillaAcciones, v12navbarJS, getPrintableHTMLJS } from '../../fixtures/v12/dbeditable.mjs';

const ORIGEN = 'Induxsoft/v12 src/uielements.v12.dkl:41-323';

// Registros falsos de una entidad de catálogo
const registros = (n, off = 0) => Array.from({ length: n }, (_, i) => {
  const k = i + off;
  return { sys_pk: 1000 + k, sys_dtcreated: `2026-0${1 + (k % 9)}-${String(1 + (k % 27)).padStart(2, '0')} 10:00:00`, sys_info: '', codigo: 'PRB-' + String((k * 37) % 997).padStart(3, '0'), nombre: 'Registro de prueba ' + k, importe: Math.round(((k * 131) % 5000) * 10.37) / 10 };
});

const COLUMNAS = {
  sys_pk: { caption: 'Llave Primaria' },
  codigo: { caption: 'Código' },
  nombre: { caption: 'Nombre', 'min-width': '180px' },
  importe: { caption: 'Importe', align: 'end', format: true, thousandssep: true, decs: 2, prefix: '$' },
  sys_dtcreated: { caption: 'Fecha de creación', 'no-print': true },
  sys_info: { caption: 'Sys Info' },
  _actions: { caption: 'Acciones', template: plantillaAcciones },
};

// Página como la de list.dk: work_area + uie.dbeditable + getCurrentContext
function paginaLista(def, extra = '') {
  const id = def.table_id;
  return pagina({
    titulo: 'V12 lista',
    antes: '<style>body{padding:0}#work_area{padding:.5rem}</style>',
    body: `<div id="work_area" class="mt-1 p-2 pt-0">${dbeditable(def)}<script type="text/javascript">${getCurrentContextDe(id)}</script><div id="_custom_area"></div></div>${extra}`,
    script: `window.__etExtra = () => { try { return { contexto: getCurrentContext() }; } catch (e) { return { contexto: '!error ' + e.message }; } };`,
  });
}

const ctxDe = (h) => h.leer(() => getCurrentContext());

const ARBOL = [
  { sys_pk: 1, parent: null, codigo: 'A', nombre: 'Grupo A', importe: 100 },
  { sys_pk: 2, parent: 1, codigo: 'A1', nombre: 'Subgrupo A1', importe: 40 },
  { sys_pk: 3, parent: 2, codigo: 'A1a', nombre: 'Elemento A1a', importe: 15 },
  { sys_pk: 4, parent: 1, codigo: 'A2', nombre: 'Subgrupo A2', importe: 60 },
  { sys_pk: 5, parent: null, codigo: 'B', nombre: 'Grupo B', importe: 7 },
  { sys_pk: 6, parent: 5, codigo: 'B1', nombre: 'Subgrupo B1', importe: 7 },
  { sys_pk: 7, parent: null, codigo: 'C', nombre: 'Grupo C', importe: 0 },
];
const COLS_ARBOL = { codigo: { caption: 'Código' }, nombre: { caption: 'Nombre' }, importe: { caption: 'Importe', align: 'end', format: true, decs: 2 } };

export default [
  {
    id: 'lista-simple',
    titulo: 'uie.dbeditable: lista simple con data, control-styles de V12, leyenda y acciones',
    origen: ORIGEN + '; list.dk:12-30',
    html: paginaLista({ table_id: 'tbl_prueba', datatable: registros(12), columns: COLUMNAS }),
    raiz: 'body',
    pasos: [
      ['clic en la fila 3 (acción por registro)', async h => { await h.clicCelda('tbl_prueba', 3, 1); }],
      ['ordenar por Nombre (OnSort de V12 cambia la leyenda)', h => h.clicEncabezado('tbl_prueba', 2)],
      ['clic en la fila 0 tras ordenar', h => h.clicCelda('tbl_prueba', 0, 1)],
      ['ordenar otra vez (descendente)', h => h.clicEncabezado('tbl_prueba', 2)],
      ['flechas abajo x2 (sys_pk de la fila elegida)', h => h.teclas(['ArrowDown', 'ArrowDown'])],
      ['ordenar por Importe (número)', h => h.clicEncabezado('tbl_prueba', 3)],
      ['clic en la fila 5', h => h.clicCelda('tbl_prueba', 5, 0)],
    ],
  },
  {
    id: 'sin-resultados',
    titulo: 'uie.dbeditable sin registros: «Sin resultados»',
    origen: ORIGEN + ' (líneas 141-143)',
    html: paginaLista({ table_id: 'tbl_vacia', datatable: [], columns: COLUMNAS }),
    raiz: 'body',
    pasos: [['clic en encabezado (sin datos)', h => h.clicEncabezado('tbl_vacia', 1)]],
  },
  {
    id: 'leyenda-propia',
    titulo: 'table_footer propio y control_styles libre de la definición',
    origen: ORIGEN + ' (líneas 66-72, 92)',
    html: paginaLista({ table_id: 'tbl_ley', datatable: registros(3), columns: COLUMNAS, table_footer: 'Hay # elementos', control_styles: 'tbody tr td{font-size:.8rem} th{color:#335}' }),
    raiz: 'body',
    pasos: [],
  },
  {
    id: 'id-aleatorio',
    titulo: 'uie.dbeditable sin table_id: table_<uuid> recortado a 12 caracteres',
    origen: ORIGEN + ' (línea 43: cut("table_"+uuid(),12))',
    html: paginaLista({ table_id: 'table_3f9c2a1', datatable: registros(3), columns: COLUMNAS }),
    raiz: 'body',
    pasos: [['clic', h => h.clicCelda('table_3f9c2a1', 1, 1)]],
  },
  {
    id: 'arbol-expandido',
    titulo: 'uie.dbeditable en árbol con expanded=true (_expandOnStart + _printTreeData)',
    origen: ORIGEN + ' (líneas 56-63, 168-176)',
    html: paginaLista({ table_id: 'tbl_arbol', datatable: ARBOL, columns: COLS_ARBOL, show_tree: true, treeopt: { key: 'sys_pk', parentkey: 'parent', expanded: true } }),
    raiz: 'body',
    pasos: [
      ['clic en Elemento A1a (fila 2)', h => h.clicCelda('tbl_arbol', 2, 1)],
      ['colapsar Grupo A', h => h.clicShadow('tbl_arbol', 'tbody tr:nth-child(1) .collapse-btn')],
      ['clic en Grupo B (fila 4)', h => h.clicCelda('tbl_arbol', 4, 1)],
      ['expandir Grupo A', h => h.clicShadow('tbl_arbol', 'tbody tr:nth-child(1) .collapse-btn')],
      ['ordenar por Nombre en árbol', h => h.clicEncabezado('tbl_arbol', 1)],
      ['clic en fila 1 tras ordenar', h => h.clicCelda('tbl_arbol', 1, 0)],
    ],
  },
  {
    id: 'arbol-colapsado',
    titulo: 'uie.dbeditable en árbol con expanded=false (hijos ocultos)',
    origen: ORIGEN,
    html: paginaLista({ table_id: 'tbl_arbol', datatable: ARBOL, columns: COLS_ARBOL, show_tree: true, treeopt: { key: 'sys_pk', parentkey: 'parent' } }),
    raiz: 'body',
    pasos: [
      ['clic en Grupo B (fila 4, con filas ocultas antes)', h => h.clicCelda('tbl_arbol', 4, 1)],
      ['flecha abajo (salta ocultas)', h => h.tecla('ArrowDown')],
      ['expandir Grupo A', h => h.clicShadow('tbl_arbol', 'tbody tr:nth-child(1) .collapse-btn')],
      ['clic en Subgrupo A2 (fila 3)', h => h.clicCelda('tbl_arbol', 3, 1)],
      ['flecha arriba x2', h => h.teclas(['ArrowUp', 'ArrowUp'])],
    ],
  },
  {
    id: 'arbol-booleanos-1-0',
    titulo: 'Árbol con #<expanded> impreso como 1/0 (supuesto S3, variante)',
    origen: ORIGEN + ' (línea 174)',
    html: paginaLista({ table_id: 'tbl_arbol', datatable: ARBOL, columns: COLS_ARBOL, show_tree: true, treeopt: { key: 'sys_pk', parentkey: 'parent', expanded: true }, booleanos: '10' }),
    raiz: 'body',
    pasos: [['clic en el botón de Grupo A', h => h.clicShadow('tbl_arbol', 'tbody tr:nth-child(1) .collapse-btn')]],
  },
  {
    id: 'arbol-atributo-literal',
    titulo: 'Árbol con el ="" sobrante de "#<tree_opt>"="" (supuesto S2, variante literal)',
    origen: ORIGEN + ' (línea 79)',
    html: paginaLista({ table_id: 'tbl_arbol', datatable: ARBOL, columns: COLS_ARBOL, show_tree: true, treeopt: { key: 'sys_pk', parentkey: 'parent', expanded: true }, literal: true }),
    raiz: 'body',
    pasos: [],
  },
  {
    id: 'paginacion-3',
    titulo: 'Paginación de V12: 130 registros, 50 por página (rows_per_page), botonera y _printRows()',
    origen: ORIGEN + ' (líneas 178-307)',
    html: paginaLista({ table_id: 'tbl_pag', datatable: registros(130), columns: COLUMNAS, pagination: true, rows_per_page: 50 }),
    raiz: 'body',
    estilos: true,
    pasos: [
      ['clic en fila 10 de la página 1', h => h.clicCelda('tbl_pag', 10, 1)],
      ['ir a la página 2 (botón)', h => h.clic('#tbl_pag_pagination button:nth-child(3)')],
      ['clic en fila 10 de la página 2', h => h.clicCelda('tbl_pag', 10, 1)],
      ['ordenar la página (solo la página)', h => h.clicEncabezado('tbl_pag', 2)],
      ['clic en fila 0 tras ordenar', h => h.clicCelda('tbl_pag', 0, 1)],
      ['página 3 (última, 30 filas)', h => h.js(() => pagination.goto(3))],
      ['clic en la última fila', h => h.clicCelda('tbl_pag', 29, 1)],
      ['siguiente (deshabilitado) y anterior', h => h.js(() => { pagination.goto(4); pagination.goto(2); })],
    ],
  },
  {
    id: 'paginacion-muchas',
    titulo: 'Paginación con más de 5 páginas (puntos suspensivos y «Último»)',
    origen: ORIGEN + ' (líneas 222-272)',
    html: paginaLista({ table_id: 'tbl_pag', datatable: registros(80), columns: { sys_pk: { caption: 'Llave' }, nombre: { caption: 'Nombre' } }, pagination: true, rows_per_page: 10 }),
    raiz: 'body',
    pasos: [
      ['página 4', h => h.js(() => pagination.goto(4))],
      ['página 7', h => h.js(() => pagination.goto(7))],
      ['«Último»', h => h.clic('#tbl_pag_pagination button:nth-last-child(2)')],
      ['clic en fila 3', h => h.clicCelda('tbl_pag', 3, 1)],
    ],
  },
  {
    id: 'paginacion-una',
    titulo: 'Paginación con una sola página (sin botonera)',
    origen: ORIGEN + ' (línea 197)',
    html: paginaLista({ table_id: 'tbl_pag', datatable: registros(5), columns: { sys_pk: { caption: 'Llave' }, nombre: { caption: 'Nombre' } }, pagination: true }),
    raiz: 'body',
    pasos: [],
  },
  {
    id: 'accion-por-registro',
    titulo: 'getCurrentContext() (list.dk:84-89): el sys_pk es el de la fila elegida',
    proposito: 'Riesgo más grave del plan (I1): DataArray[CurrentRowIndex()] debe ser la fila marcada.',
    origen: 'Induxsoft/v12 src/_templates/v12/app_crudl/list.dk:84-89',
    html: paginaLista({ table_id: 'tbl_acc', datatable: registros(30), columns: COLUMNAS }),
    raiz: '#work_area',
    estilos: false,
    pasos: [
      ['sin selección', async h => { await h.asentar(); }],
      ['fila 7', h => h.clicCelda('tbl_acc', 7, 2)],
      ['ordenar por Código', h => h.clicEncabezado('tbl_acc', 1)],
      ['fila 7 tras ordenar', h => h.clicCelda('tbl_acc', 7, 2)],
      ['AvPág (PagOffSet=10)', h => h.tecla('PageDown')],
      ['ocultar columna nombre y fila 2', async h => { await h.js(() => ET('tbl_acc').hideColumn('nombre', true)); await h.clicCelda('tbl_acc', 2, 1); }],
      ['clic en el botón Eliminar de la plantilla (fila 4)', async h => {
        await h.js(() => { window.InduxsoftCrudlModel = { Delete: (pk) => { window.__borrado = pk; } }; });
        await h.clicShadow('tbl_acc', 'tbody tr:nth-child(5) button');
        await h.js(() => { window.__etExtraOrig = window.__etExtra; window.__etExtra = () => ({ contexto: getCurrentContext(), borrado: window.__borrado }); });
      }],
    ],
  },
  {
    id: 'accion-paginacion-arbol',
    titulo: 'getCurrentContext() con paginación y con árbol colapsado',
    origen: 'list.dk:84-89 + uielements.v12.dkl:168-307',
    html: pagina({
      body: `<div id="work_area">${dbeditable({ table_id: 'tbl_p', datatable: registros(30), columns: { sys_pk: { caption: 'Llave' }, nombre: { caption: 'Nombre' } }, pagination: true, rows_per_page: 10 })}
<script>${getCurrentContextDe('tbl_p').replace('function getCurrentContext', 'function ctxP')}</script></div>
<div id="work_area2">${dbeditable({ table_id: 'tbl_a', datatable: ARBOL, columns: COLS_ARBOL, show_tree: true, treeopt: { key: 'sys_pk', parentkey: 'parent' } }).replace('id="list_table_container"', 'id="list_table_container2"')}
<script>${getCurrentContextDe('tbl_a').replace('function getCurrentContext', 'function ctxA')}</script></div>`,
      script: `window.__etExtra = () => ({ paginada: ctxP(), arbol: ctxA() });`,
    }),
    raiz: 'body',
    estilos: false,
    pasos: [
      ['página 2, fila 4', async h => { await h.js(() => pagination.goto(2)); await h.clicCelda('tbl_p', 4, 1); }],
      ['árbol: clic en Grupo C (fila 6, tras filas ocultas)', h => h.clicCelda('tbl_a', 6, 1)],
      ['árbol: expandir Grupo B y clic en Subgrupo B1', async h => { await h.clicShadow('tbl_a', 'tbody tr:nth-child(5) .collapse-btn'); await h.clicCelda('tbl_a', 5, 1); }],
    ],
  },
  {
    id: 'impresion-v12',
    titulo: 'Impresión de V12: getPrintableHTML() clona la tabla interna (el._shadow.getElementById(el.id))',
    origen: 'Induxsoft/v12 src/_templates/sites/v12/js/induxsoft.v12.ui.js:26-69',
    html: pagina({
      body: `<div id="work_area">${dbeditable({ table_id: 'tbl_imp', datatable: ARBOL, columns: { ...COLS_ARBOL, sys_pk: { caption: 'Llave', 'no-print': true } }, show_tree: true, treeopt: { key: 'sys_pk', parentkey: 'parent' } })}</div><div id="impreso"></div>`,
      script: `${getPrintableHTMLJS}
window.__etExtra = () => window.__impreso;`,
    }),
    raiz: '#impreso',
    pasos: [
      ['ocultar columna y clonar (sin beforeprint)', h => h.js(() => {
        const t = ET('tbl_imp'); t.classList.add('printable-element'); t.hideColumn('importe', true);
        const c = getPrintableHTML(); document.getElementById('impreso').appendChild(c);
        window.__impreso = { filas: c.querySelectorAll('tbody tr').length, ocultas: c.querySelectorAll('tr.hidde-row').length, columnasOcultas: c.querySelectorAll('th.hidde-col').length, idTabla: c.querySelector('table')?.id };
      })],
    ],
  },
  {
    id: 'exportar-csv',
    titulo: 'ExportarCSV de V12: lee table tr del documento, Columns (title/field/class) y DataArray',
    origen: 'Induxsoft/v12 src/uielements.v12.dkl:655-714',
    html: pagina({
      body: `<div id="work_area">${dbeditable({ table_id: 'tbl_csv', datatable: registros(4).map((r, i) => ({ ...r, nombre: i === 1 ? 'Con, coma y "comillas"' : r.nombre })), columns: { ...COLUMNAS, codigo: { caption: 'Código', class: 'hide-on-print' } } })}</div>`,
      script: `${v12navbarJS}`,
    }),
    raiz: '#work_area',
    estilos: false,
    pasos: [
      ['ExportarCSV()', async h => {
        await h.js(() => { v12navbar.ExportarCSV(); });
        await h.page.evaluate(async () => { window.__csvTexto = await window.__csvBlob.text(); });
        await h.js(() => { window.__etExtra = () => ({ nombre: window.__csvNombre, csv: window.__csvTexto }); });
      }],
      ['cambiar título y ordenar, exportar otra vez', async h => {
        await h.js(() => { ET('tbl_csv').changeColumnTitle('nombre', 'Nombre nuevo'); });
        await h.clicEncabezado('tbl_csv', 2);
        await h.js(() => { v12navbar.ExportarCSV(); });
        await h.page.evaluate(async () => { window.__csvTexto = await window.__csvBlob.text(); });
      }],
    ],
  },
  {
    id: 'tarjetas-angosta',
    titulo: 'Lista de V12 en pantalla angosta (cards-responsive con todas NoEditable: table-cards)',
    origen: ORIGEN + ' (línea 82)',
    viewport: { width: 600, height: 800 },
    html: paginaLista({ table_id: 'tbl_cel', datatable: registros(4), columns: COLUMNAS }),
    raiz: 'body',
    pasos: [
      ['clic en la segunda tarjeta', h => h.clicCelda('tbl_cel', 1, 1)],
      ['ensanchar a 1000 px', h => h.viewport(1000, 800)],
      ['angostar a 500 px', h => h.viewport(500, 800)],
    ],
  },
  {
    id: 'impresion-media-print',
    titulo: 'Lista de V12 con @media print del control-styles y beforeprint (no-print, hide-on-print)',
    origen: ORIGEN + ' (líneas 85-90)',
    html: paginaLista({ table_id: 'tbl_print', datatable: registros(5), columns: COLUMNAS }),
    raiz: 'body',
    pasos: [
      ['beforeprint + media print', h => h.imprimir(true)],
      ['afterprint + media screen', h => h.imprimir(false)],
    ],
  },
];
