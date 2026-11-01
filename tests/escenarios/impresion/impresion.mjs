// Impresión: beforeprint/afterprint en window (editable.js:243-256) y @media print (191-194).
import { pagina, tabla, filas } from '../../lib/pagina.mjs';

const COLS = [
  { field: 'id', title: 'Id', type: 'NoEditable', class: 'no-print' },
  { field: 'nombre', title: 'Nombre', type: 'NoEditable' },
  { field: 'cantidad', title: 'Cantidad', type: 'NoEditable', class: 'hide-on-print' },
  { field: 'precio', title: 'Precio', type: 'NoEditable', class: 'derecha no-print-x' },
];

export default [
  {
    id: 'before-after-print',
    titulo: 'beforeprint oculta las columnas no-print/hide-on-print; afterprint las muestra',
    html: pagina({ body: tabla({ data: filas(3), cols: COLS }) }),
    pasos: [
      ['beforeprint + media print', h => h.imprimir(true)],
      ['afterprint + media screen', h => h.imprimir(false)],
    ],
  },
  {
    id: 'media-print-sin-eventos',
    titulo: '@media print sin beforeprint: .no-print solo oculta el th (los td no tienen la clase)',
    html: pagina({ body: tabla({ data: filas(3), cols: COLS }) }),
    pasos: [['emulateMedia print', async h => { await h.page.emulateMedia({ media: 'print' }); await h.asentar(); }]],
  },
  {
    id: 'pdf',
    titulo: 'page.pdf() no produce errores (el PDF no se compara)',
    html: pagina({ body: tabla({ data: filas(3), cols: COLS }) }),
    pasos: [['generar PDF', async h => { await h.page.pdf({ format: 'A4' }); await h.asentar(); }]],
  },
  {
    id: 'varias-tablas',
    titulo: 'Cada tabla registra sus propios beforeprint/afterprint',
    html: pagina({ body: tabla({ id: 'a', data: filas(2), cols: COLS }) + tabla({ id: 'b', data: filas(2), cols: COLS.slice(0, 2) }) }),
    pasos: [['beforeprint', h => h.imprimir(true)], ['afterprint', h => h.imprimir(false)]],
  },
];
