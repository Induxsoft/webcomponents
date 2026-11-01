// Inicialización: formas de declarar la tabla y de darle datos.
import { pagina, tabla, filas, COLS_BASE } from '../../lib/pagina.mjs';

const DATOS = filas(4);

export default [
  {
    id: 'thead-y-data',
    titulo: 'edit-thead/edit-tr/edit-th con atributo data',
    proposito: 'Camino de dibujo _getFullTable (líneas 301-331): filas sin id/parent/indent.',
    origen: 'editable.js:263-334; editable.md «Inicialización»',
    html: pagina({ body: tabla({ data: DATOS, cols: COLS_BASE }) }),
    pasos: [],
  },
  {
    id: 'edit-tbody',
    titulo: 'Filas declaradas con edit-tbody/edit-tr/edit-td (UpdateData arma DataArray)',
    proposito: 'Sin data: UpdateData() lee el DOM (línea 240) y dispara FieldUpdated por celda.',
    origen: 'editable.js:286-297, 240; examples/_EdiTable-demo.html',
    html: pagina({
      body: tabla({
        cols: COLS_BASE,
        tbody: `<edit-tbody>${DATOS.map(d => `<edit-tr><edit-td>${d.id}</edit-td><edit-td>${d.nombre}</edit-td><edit-td>${d.cantidad}</edit-td><edit-td>${d.precio}</edit-td></edit-tr>`).join('')}</edit-tbody>`,
      }),
    }),
    pasos: [],
  },
  {
    id: 'data-y-edit-tbody',
    titulo: 'Atributo data y además edit-tbody (gana edit-tbody en el DOM, data en DataArray)',
    origen: 'editable.js:301 (solo dibuja data si no hay edit-tbody)',
    html: pagina({
      body: tabla({ data: DATOS.slice(0, 2), cols: COLS_BASE, tbody: `<edit-tbody><edit-tr><edit-td>9</edit-td><edit-td>Del tbody</edit-td><edit-td>1</edit-td><edit-td>2</edit-td></edit-tr></edit-tbody>` }),
    }),
    pasos: [],
  },
  {
    id: 'propiedad-dataarray',
    titulo: 'DataArray asignado por JS después de cargar y _printRows()',
    origen: 'editable.md (ejemplo con _printRows); V12 paginación',
    html: pagina({
      body: tabla({ cols: COLS_BASE }),
      script: `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.DataArray = ${JSON.stringify(DATOS)}; t._printRows(); });`,
    }),
    pasos: [
      ['reasignar y volver a pintar', h => h.js(() => { const t = ET('t1'); t.DataArray = t.DataArray.slice(0, 2).concat([{ id: 99, nombre: 'Agregado por JS', cantidad: 1, precio: 0.5 }]); t._printRows(); })],
    ],
  },
  {
    id: 'sin-datos',
    titulo: 'Tabla sin atributo data ni filas',
    html: pagina({ body: tabla({ cols: COLS_BASE }) }),
    pasos: [],
  },
  {
    id: 'data-vacio',
    titulo: 'data="[]" (patrón de consumidores que llenan la tabla por JS)',
    origen: 'editable.js:213-217, 240',
    html: pagina({ body: tabla({ data: '[]', cols: COLS_BASE }) }),
    pasos: [],
  },
  {
    id: 'data-espacios',
    titulo: 'data con solo espacios (se ignora)',
    origen: 'editable.js:213',
    html: pagina({ body: tabla({ data: '   ', cols: COLS_BASE }) }),
    pasos: [],
  },
  {
    id: 'data-json-invalido',
    titulo: 'data con JSON inválido: alert y DataArray vacío',
    origen: 'editable.js:216',
    html: pagina({ body: tabla({ data: '[{"id":1,', cols: COLS_BASE }) }),
    pasos: [],
  },
  {
    id: 'sin-thead',
    titulo: 'Sin edit-thead (data sin columnas)',
    html: pagina({ body: `<edit-table id="t1" data='${JSON.stringify(DATOS.slice(0, 2))}'></edit-table>` }),
    pasos: [['AddRow sin columnas', h => h.js(() => ET('t1').AddRow())]],
  },
  {
    id: 'sin-id',
    titulo: 'Tabla sin id (la tabla interna recibe f077fb41716141eeb7ecb1ed0a1ce292)',
    origen: 'editable.js:265',
    html: pagina({ body: `<edit-table data='${JSON.stringify(DATOS.slice(0, 2))}'><edit-thead><edit-tr><edit-th field="id">Id</edit-th><edit-th field="nombre">Nombre</edit-th></edit-tr></edit-thead></edit-table>` }),
    pasos: [['clic en una celda', async h => { await h.js(() => { const s = document.querySelector('edit-table').shadowRoot; const b = s.querySelector('tbody').rows[1].cells[1]; b.click(); }); }]],
  },
  {
    id: 'thead-row-index',
    titulo: 'Encabezado de dos filas y TheadRowIndex=1',
    proposito: 'Columns toma todos los th de todas las filas (desalineado) y THCount usa TheadRowIndex.',
    origen: 'editable.js:381-398, 1588',
    html: pagina({
      body: `<edit-table id="t1" data='${JSON.stringify(DATOS.slice(0, 2))}'><edit-thead><edit-tr><edit-th field="grupo">Grupo</edit-th><edit-th field="grupo2">Grupo 2</edit-th></edit-tr><edit-tr><edit-th field="id" type="NoEditable">Id</edit-th><edit-th field="nombre" type="Text">Nombre</edit-th></edit-tr></edit-thead></edit-table>`,
      script: `document.addEventListener('DOMContentLoaded', () => { ET('t1').TheadRowIndex = 1; });`,
    }),
    pasos: [
      ['THCount y navegación', h => h.js(() => { const t = ET('t1'); t.NavTo(0, 1); })],
      ['AddRow', h => h.js(() => ET('t1').AddRow())],
    ],
  },
  {
    id: 'columns-default-type',
    titulo: 'ColumnsDefaultType=Number y columnas sin type',
    origen: 'editable.js:1191, 1757',
    html: pagina({
      body: tabla({ data: DATOS.slice(0, 2), cols: [{ field: 'id', title: 'Id' }, { field: 'cantidad', title: 'Cantidad' }] }),
      script: `document.addEventListener('DOMContentLoaded', () => { ET('t1').ColumnsDefaultType = 'Number'; });`,
    }),
    pasos: [
      ['clic y Enter: editor Number', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); }],
      ['Escape', h => h.tecla('Escape')],
    ],
  },
  {
    id: 'type-minusculas',
    titulo: 'type="text" en minúsculas (eval da undefined) y type inexistente',
    origen: 'editable.js:405 (eval distingue mayúsculas)',
    html: pagina({ body: tabla({ data: DATOS.slice(0, 2), cols: [{ field: 'id', title: 'Id', type: 'text' }, { field: 'nombre', title: 'Nombre', type: 'Textoo' }] }) }),
    pasos: [['editar celda con type desconocido', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('Enter'); }]],
  },
  {
    id: 'options-invalido',
    titulo: 'options con JSON inválido aborta la inicialización',
    origen: 'editable.js:410',
    html: pagina({ body: tabla({ data: DATOS.slice(0, 2), cols: [{ field: 'id', title: 'Id' }, { field: 'nombre', title: 'Nombre', type: 'Select', options: '{"a":' }] }) }),
    pasos: [],
  },
  {
    id: 'varias-tablas',
    titulo: 'Tres tablas en la misma página; foco y focusedTable por instancia',
    origen: 'editable.js:880, 1621',
    html: pagina({
      body: tabla({ id: 'a', data: DATOS.slice(0, 2), cols: COLS_BASE }) + '<hr>' + tabla({ id: 'b', data: DATOS.slice(2), cols: COLS_BASE }) + '<hr>' + tabla({ id: 'c', cols: COLS_BASE.slice(0, 2) }),
    }),
    pasos: [
      ['clic en a', h => h.clicCelda('a', 1, 1)],
      ['clic en b', h => h.clicCelda('b', 0, 2)],
      ['teclado en b', h => h.tecla('ArrowDown')],
      ['AddRow en c', h => h.js(() => ET('c').AddRow())],
    ],
  },
];
