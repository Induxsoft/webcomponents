// F8a (§3): getChanges, isNew, AcceptChanges.
import { html } from './_f8comun.mjs';

const E = ['v2', 'f8a', 'cambios'];
export default [
  {
    id: 'f8a-cambios', titulo: 'getChanges: editar, volver al original, AddRow + editar, Ctrl+Supr, DeleteRow, ordenar, AcceptChanges, DataArray nuevo',
    etiquetas: E, origen: 'spec F8a §3', registro: 'consumer',
    html: html(),
    pasos: [
      ['editar el nombre de A2', async h => { await h.js(() => ET('t1').NavTo(1, 1)); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('Cable dúplex'); await h.tecla('Enter'); }],
      ['AddRow y capturar el código', async h => { await h.js(() => ET('t1').AddRow()); await h.escribir('A6'); await h.tecla('Enter'); }],
      ['Ctrl+Supr sobre A1 y DeleteRow(3)', async h => { await h.js(() => ET('t1').NavTo(0, 1)); await h.tecla('Control+Delete'); await h.js(() => ET('t1').DeleteRow(3)); }],
      ['ordenar por código descendente', h => h.js(() => { const t = ET('t1'); t.Sort(t.DataArray, 'codigo', true); t._printRows(); window.__x = [t.isNew(0), t.isNew(1)]; })],
      ['AcceptChanges', h => h.js(() => ET('t1').AcceptChanges())],
      ['DataArray nuevo (otros objetos)', h => h.js(() => { const t = ET('t1'); t.DataArray = JSON.parse(JSON.stringify(t.DataArray)); t._printRows(); })],
    ],
  },
];
