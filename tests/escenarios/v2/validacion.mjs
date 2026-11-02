// F8a (§2): BeforeRowLeave y errores por celda.
import { html } from './_f8comun.mjs';

const E = ['v2', 'f8a', 'validacion'];
export default [
  {
    id: 'f8a-validacion', titulo: 'BeforeRowLeave al cambiar de fila (flechas, clic, NavTo, AddRow) con e.errors; SetCellError/ClearCellError; BeforeUpdateCell con e.error',
    etiquetas: E, origen: 'spec F8a §2', registro: 'consumer',
    html: html({ eventos: ['BeforeRowLeave', 'BeforeUpdateCell'], script: "window.__cancelar = { BeforeRowLeave: (e) => { if (Number(e.data?.cantidad) < 0) e.errors = { cantidad: 'No puede ser negativa' }; }, BeforeUpdateCell: (e) => { if (e.coldef.field === 'precio' && Number(e.text) > 1000) e.error = 'Precio fuera de rango'; } };" }),
    pasos: [
      ['clic en (0, nombre) y flecha abajo (A2 tiene cantidad negativa)', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('ArrowDown'); }],
      ['flecha abajo desde A2: se cancela y marca la celda', h => h.tecla('ArrowDown')],
      ['corregir la cantidad de A2 y bajar', async h => { await h.js(() => ET('t1').NavTo(1, 3)); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('4'); await h.tecla('Enter'); await h.js(() => ET('t1').ClearCellError(1)); await h.tecla('ArrowDown'); }],
      ['precio 5000 en A3: e.error deja la celda en edición', async h => { await h.js(() => ET('t1').NavTo(2, 4)); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('5000'); await h.tecla('Enter'); }],
      ['precio 50: se confirma y se limpia el error', async h => { await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('50'); await h.tecla('Enter'); }],
      ['SetCellError por código, ordenar y quitar todos', h => h.js(() => { const t = ET('t1'); t.SetCellError(4, 'nombre', 'Revisar'); t.Sort(t.DataArray, 'codigo', true); t._printRows(); window.__x = t.getErrors(); t.ClearCellError(); })],
      ['AddRow desde la última fila', h => h.js(() => { const t = ET('t1'); t.NavTo(4, 0); t.AddRow(); })],
    ],
  },
];
