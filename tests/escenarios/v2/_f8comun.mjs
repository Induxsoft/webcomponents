// F8a: datos, columnas y foto comunes de los escenarios de búsqueda, validación, cambios, captura y reglas.
import { pagina, tabla } from '../../lib/pagina.mjs';

export const DATOS = [
  { codigo: 'A1', nombre: 'Tornillo hexagonal', linea: 'Ferretería', cantidad: 10, precio: 2.5 },
  { codigo: 'A2', nombre: 'Cable eléctrico', linea: 'Eléctrico', cantidad: -3, precio: 18 },
  { codigo: 'A3', nombre: 'Apagador sencillo', linea: 'Eléctrico', cantidad: 7, precio: 35.9 },
  { codigo: 'A4', nombre: 'Arandela plana', linea: 'Ferretería', cantidad: 0, precio: 0.75 },
  { codigo: 'A5', nombre: 'Tubo de cobre', linea: 'Plomería', cantidad: 5, precio: 120 },
];
export const COLS = (x = {}) => [
  { field: 'codigo', type: 'Text', title: 'Código', ...(x.codigo ?? {}) },
  { field: 'nombre', type: 'Text', title: 'Nombre', ...(x.nombre ?? {}) },
  { field: 'linea', type: 'Text', title: 'Línea', ...(x.linea ?? {}) },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', ...(x.cantidad ?? {}) },
  { field: 'precio', type: 'Number', title: 'Precio', format: 'true', decs: '2', ...(x.precio ?? {}) },
];
// Foto extra: filas visibles (código), índices filtrados, celda actual, cambios, errores y eventos F8a.
export const EXTRA = `window.__ev = [];
window.__etExtra = () => { const t = ET('t1'), s = ETs('t1'), tb = s.querySelector('tbody');
  const vis = Array.from(tb.rows).filter(r => !r.classList.contains('et-spacer') && getComputedStyle(r).display !== 'none').map(tr => {
    if (tr.classList.contains('et-group-row')) return 'G[' + tr.getAttribute('data-key') + '] ' + tr.textContent.replace(/\\s+/g, ' ').trim();
    const i = t._getRowIndex(tr), td = tr.querySelectorAll('td:not(.et-sel-col)')[0];
    return i + ':' + (td ? td.textContent.trim() : '') + (tr.className ? ' {' + tr.className.split(' ').filter(c => c.startsWith('et-')).sort().join(' ') + '}' : '');
  });
  const ch = t.getChanges();
  const td = t.CurrentTd();
  return { vis, filtradas: t.getFilteredIndices(), actual: [t.CurrentRowIndex(), td ? t.Columns[t.ColIndexOfTd(td)]?.field : null],
    cambios: { added: ch.added.map(x => x.index), modified: ch.modified.map(x => [x.index, x.original?.nombre ?? null]), deleted: ch.deleted.map(x => x.data.codigo ?? null) },
    errores: t.getErrors(), totales: t.getSummaries ? t.getSummaries() : null, sel: t.getSelectedRows(), eventos: window.__ev.splice(0) };
};`;
export const grabar = (nombres) => `document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); ${JSON.stringify(nombres)}.forEach(n => t.addEventListener(n, (e) => { const x = {}; for (const k of Object.keys(e)) if (k !== 'sender' && k !== 'data') x[k] = (e[k] && typeof e[k] === 'object' && e[k].nodeType ? '$nodo' : e[k]); window.__ev.push([n, x]); if (window.__cancelar && window.__cancelar[n]) window.__cancelar[n](e); })); });`;
export const html = ({ attrs = {}, cols = COLS(), data = DATOS, script = '', eventos = [], antes = '', envolver = null } = {}) => {
  const t = tabla({ cols, data, attrs: { 'design-auto-save': 'false', ...attrs } });
  return pagina({ body: antes + (envolver ? envolver(t) : t), script: EXTRA + grabar(eventos) + script });
};
