// v2 §6: columnas fijas (F3). Referencia generada con F3: congela el comportamiento activado.
import { html } from './_f3comun.mjs';
const E = ['v2', 'f3', 'fixed'];
export default [
  {
    id: 'fijas-declaradas', titulo: 'fixed="left": se agrupan a la izquierda, sticky con left acumulado, et-fixed-last; desplazar la caja no las mueve',
    etiquetas: E, origen: 'spec §6', registro: 'consumer',
    html: html({ x: { linea: { fixed: 'left' }, codigo: { fixed: 'left' } } }),
    pasos: [
      ['desplazar la caja 200 px', h => h.js(() => { document.getElementById('caja').scrollLeft = 200; })],
      ['clic en una celda no fija y en una fija', async h => { await h.clicCelda('t1', 1, 3); await h.clicCelda('t1', 1, 0); }],
    ],
  },
  {
    id: 'fijas-api', titulo: 'FixColumn/IsColumnFixed, ColumnFixedChanged; ocultar una fija y cambiar su ancho recalculan left',
    etiquetas: E, origen: 'spec §6', registro: 'consumer',
    html: html({ x: { codigo: { fixed: 'left' } } }),
    pasos: [
      ['FixColumn(precio,true)', h => h.js(() => ET('t1').FixColumn('precio', true))],
      ['redimensionar la primera fija +60', h => h.redimensionar('t1', 0, 60)],
      ['hideColumn(codigo)', h => h.js(() => ET('t1').hideColumn('codigo', true))],
      ['hideColumn(codigo,false) y FixColumn(codigo,false)', h => h.js(() => { const t = ET('t1'); t.hideColumn('codigo', false); t.FixColumn('codigo', false); })],
      ['editar la columna movida (precio) con F2', async h => { await h.clicCelda('t1', 0, 0); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = '7'; }); await h.tecla('Enter'); }],
    ],
  },
];
