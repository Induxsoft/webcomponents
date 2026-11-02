// F8a (§4): secuencia de captura (tab-order, tab-skip, skip-readonly, enter-mode) y tecleo rápido.
import { html, COLS } from './_f8comun.mjs';

const E = ['v2', 'f8a', 'captura'];
const COLC = COLS({ nombre: { type: 'NoEditable' }, linea: { readonly: 'true' }, precio: { 'tab-order': '1', format: undefined, decs: undefined }, cantidad: { 'tab-order': '2' } });
export default [
  {
    id: 'f8a-captura-tab', titulo: 'tab-order + skip-readonly: Tab y Mayús+Tab siguen la secuencia; al final pasa de fila y en la última AutoAddRow agrega',
    etiquetas: E, origen: 'spec F8a §4', registro: 'consumer',
    html: html({ cols: COLC, attrs: { 'skip-readonly': 'true' } }),
    pasos: [
      ['clic en (0, precio) y Tab dos veces', async h => { await h.clicCelda('t1', 0, 4); await h.tecla('Tab', 2); }],
      ['Tab: siguiente fila; Mayús+Tab: regresa', async h => { await h.tecla('Tab'); await h.tecla('Shift+Tab'); }],
      ['editar la cantidad y Tab (confirma y avanza)', async h => { await h.js(() => ET('t1').NavTo(4, 3)); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('8'); await h.tecla('Tab'); }],
      ['Tab en la última capturable de la última fila: agrega', h => h.tecla('Tab')],
    ],
  },
  {
    id: 'f8a-captura-enter', titulo: 'enter-mode="next-row" y "down"; ráfaga de teclas en el selector (lector de códigos)',
    etiquetas: E, origen: 'spec F8a §4 y encargo 1', registro: 'consumer',
    html: html({ attrs: { 'enter-mode': 'next-row' } }),
    pasos: [
      ['editar (0, cantidad) con Enter: va a la fila siguiente', async h => { await h.js(() => ET('t1').NavTo(0, 3)); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('3'); await h.tecla('Enter'); }],
      ['enter-mode="down" y Enter en el selector', async h => { await h.js(() => { ET('t1').EnterMode = 'down'; }); await h.tecla('Enter'); }],
      ['ráfaga "XYZ-12" + Enter en el selector de (2, nombre)', async h => { await h.js(() => ET('t1').NavTo(2, 1)); await h.js(() => { const s = ETs('t1').querySelector('#__table_selector'); for (const k of ['X', 'Y', 'Z', '-', '1', '2', 'Enter']) s.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, composed: true })); }); await h.esperar(50); }],
    ],
  },
];
