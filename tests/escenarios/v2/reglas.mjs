// F8a (§5): formato condicional declarativo (rules, row-rules).
import { html, COLS } from './_f8comun.mjs';

const E = ['v2', 'f8a', 'reglas'];
const R = (x) => JSON.stringify(x);
export default [
  {
    id: 'f8a-reglas', titulo: 'rules por columna (clase, estilo, icono, field de otra columna) y row-rules; se reaplican al editar, con UpdateRow y RefreshRules',
    etiquetas: E, origen: 'spec F8a §5', registro: 'consumer',
    html: html({
      cols: COLS({ cantidad: { rules: R([{ op: 'lt', value: 0, class: 'et-neg', icon: '▼' }, { op: 'ge', value: 10, class: 'et-bold' }]) }, precio: { rules: R([{ field: 'linea', op: 'eq', value: 'Plomería', class: 'et-strike', style: { color: 'rgb(120, 120, 120)' } }]) } }),
      attrs: { 'row-rules': R([{ field: 'linea', op: 'eq', value: 'Eléctrico', class: 'et-muted' }]) },
    }),
    pasos: [
      ['editar la cantidad de A1 a -2', async h => { await h.js(() => ET('t1').NavTo(0, 3)); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('-2'); await h.tecla('Enter'); }],
      ['DataArray[4].linea = "Pintura" y UpdateRow(4)', h => h.js(() => { const t = ET('t1'); t.DataArray[4].linea = 'Pintura'; t.UpdateRow(4); })],
      ['RowRules por código y RefreshRules', h => h.js(() => { const t = ET('t1'); t.RowRules = [{ field: 'cantidad', op: 'between', value: 1, value2: 9, class: 'et-ok' }]; t.RefreshRules(); })],
    ],
  },
];
