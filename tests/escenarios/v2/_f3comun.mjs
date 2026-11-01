// Común de los escenarios v2 de F3 (columnas fijas, selector de columnas, reordenar y diseño).
// No es un escenario: run.mjs solo toma el default export de cada archivo y este no tiene.
import { pagina, tabla } from '../../lib/pagina.mjs';

export const PRODUCTOS = [
  { codigo: 'P-003', nombre: 'Martillo de prueba', linea: 'Ferretería', cantidad: 4, precio: 120.5 },
  { codigo: 'P-001', nombre: 'Pintura ficticia', linea: 'Pintura', cantidad: 10, precio: 89.9 },
  { codigo: 'P-004', nombre: 'Cable de demostración', linea: 'Eléctrico', cantidad: 25, precio: 15 },
  { codigo: 'P-002', nombre: 'Brocha inventada', linea: 'Pintura', cantidad: 7, precio: 33.25 },
];
export const COLS = (x = {}) => [
  { field: 'codigo', title: 'Código', type: 'Text', width: '90px', ...(x.codigo ?? {}) },
  { field: 'nombre', title: 'Nombre', type: 'Text', width: '220px', ...(x.nombre ?? {}) },
  { field: 'linea', title: 'Línea', type: 'Text', width: '140px', ...(x.linea ?? {}) },
  { field: 'cantidad', title: 'Cantidad', type: 'Number', width: '100px', ...(x.cantidad ?? {}) },
  { field: 'precio', title: 'Precio', type: 'Number', width: '110px', ...(x.precio ?? {}) },
];
// Registra los eventos nuevos de F3 (solo se disparan si hay manejador) y expone el estado de columnas.
export const SCRIPT = `window.__ev = [];
document.addEventListener('DOMContentLoaded', () => {
  const t = ET('t1');
  ['ColumnFixedChanged','ColumnVisibilityChanged','BeforeColumnMove','ColumnMoved','LayoutChanged','LayoutRejected'].forEach(n =>
    t.addEventListener(n, (e) => window.__ev.push([n, e.field ?? null, ('fixed' in e ? e.fixed : ('visible' in e ? e.visible : (e.reason ?? null))), e.from ?? null, e.to ?? null])));
});
window.__etExtra = () => { const t = ET('t1'); return {
  eventos: window.__ev.splice(0),
  campos: t.Columns.map(c => c.field),
  fijas: t.Columns.filter(c => t.IsColumnFixed(c.field)).map(c => c.field),
  visibles: t.getVisibleColumns().map(c => c.field),
  hideColumns: t.hideColumns.slice(),
  layout: t.getLayout(),
  izquierdas: Array.from(ETs('t1').querySelectorAll('thead > tr > th')).map(th => th.classList.contains('et-fixed') ? Math.round(parseFloat(th.style.left)) : null),
}; };`;
export const html = (o = {}) => pagina({
  body: `<div id="caja" style="width:520px;overflow:auto">${tabla({ attrs: o.attrs ?? {}, data: PRODUCTOS, cols: o.cols ?? COLS(o.x), style: 'display:block;width:900px' })}</div><button id="fuera">fuera</button>`,
  script: SCRIPT + (o.script ?? ''),
});
/** Clic con el botón derecho en el th `col`. */
export async function clicDerechoTh(h, col) {
  const p = await h._punto(([c]) => ETs('t1').querySelector('thead').rows[0].cells[c].querySelector('span'), [col]);
  await h.page.mouse.click(p.x, p.y, { button: 'right' });
  await h.asentar();
}
/** Arrastre HTML5 sintético de un th a otro (antes = mitad izquierda del destino). */
export const arrastrarTh = (h, desde, hasta, antes = true) => h.js(([d, a, antes]) => {
  const s = ETs('t1'); const ths = s.querySelector('thead').rows[0].cells;
  const o = ths[d], b = ths[a]; const r = b.getBoundingClientRect();
  const dt = new DataTransfer(); const x = r.left + r.width * (antes ? 0.25 : 0.75), y = r.top + r.height / 2;
  const ev = (el, tipo) => el.dispatchEvent(new DragEvent(tipo, { bubbles: true, cancelable: true, composed: true, dataTransfer: dt, clientX: x, clientY: y }));
  ev(o, 'dragstart'); ev(b, 'dragenter'); ev(b, 'dragover');
  window.__indicador = !!s.querySelector('.et-drop-indicator');
  ev(b, 'drop'); ev(o, 'dragend');
}, [desde, hasta, antes]);
