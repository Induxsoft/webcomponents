// F4 (spec §4.2): portapapeles. En el banco (http://et.test, origen no seguro) no hay navigator.clipboard:
// se usa execCommand('copy') sobre un textarea temporal; se congela el texto que entrega BeforeCopy.
import { pagina, tabla, COLS_BASE, filas } from '../../lib/pagina.mjs';

const E = ['v2', 'f4', 'portapapeles'];
const SCRIPT = `window.__bc = [];
document.addEventListener('DOMContentLoaded', () => {
  ET('t1').addEventListener('BeforeCopy', (e) => { window.__bc.push(e.text); if (window.__cancelar) e.cancel = true; });
});
window.__etExtra = () => ({ copias: window.__bc.splice(0), texto: ET('t1').getClipboardText(), crudo: ET('t1').getClipboardText({ raw: true, headers: false }) });`;

export default [
  {
    id: 'f4-copiar', titulo: 'Ctrl+C: celda actual sin títulos; filas seleccionadas con títulos, formateado y solo columnas visibles',
    etiquetas: E, origen: 'spec §4.2, P13', registro: 'consumer',
    html: pagina({ body: tabla({ data: filas(4), cols: COLS_BASE, attrs: { 'multi-select': 'row' } }), script: SCRIPT }),
    pasos: [
      ['clic en (1, precio) y Ctrl+C', async h => { await h.clicCelda('t1', 1, 3); await h.tecla('Control+c'); }],
      ['SelectRows([0, 2]), ocultar nombre y Ctrl+C', async h => { await h.js(() => { const t = ET('t1'); t.SelectRows([0, 2]); t.hideColumn('nombre', true); }); await h.tecla('Control+c'); }],
      ['BeforeCopy con cancel', async h => { await h.js(() => { window.__cancelar = true; }); await h.tecla('Control+c'); }],
      ['F2 y Ctrl+C dentro del editor (no pasa por el componente)', async h => { await h.js(() => { window.__cancelar = false; }); await h.tecla('F2'); await h.tecla('Control+c'); await h.tecla('Escape'); }],
    ],
  },
];
