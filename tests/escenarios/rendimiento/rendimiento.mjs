// Rendimiento: se MIDE, no se compara byte a byte. Solo corre con --rendimiento (o --solo-rendimiento).
// Resultado en tests/out/rendimiento.json; con --update también en tests/golden/rendimiento.json.
// Cada operación tiene un límite (ET_LIMITE_MS, 60 s por omisión): si se pasa, se anota «> límite» y se dejan
// de medir las operaciones siguientes de esa tabla (la página se cierra).
import { pagina, tabla, COLS_BASE } from '../../lib/pagina.mjs';

const LIMITE = Number(process.env.ET_LIMITE_MS || 60000);

const COLS_ARBOL = [{ field: 'nombre', title: 'Nombre', type: 'Text' }, { field: 'cantidad', title: 'Cantidad', type: 'Number' }, { field: 'precio', title: 'Precio', type: 'Number', format: 'true', decs: '2', thousandssep: 'true', prefix: '$' }, { field: 'id', title: 'Id', type: 'NoEditable' }];

const GEN = `window.__gen = (n, arbol) => Array.from({ length: n }, (_, i) => {
  const r = { id: i + 1, nombre: 'Producto de prueba ' + (i + 1), cantidad: (i * 7) % 13 + 1, precio: Math.round(((i * 37) % 1000) * 1.5 + 10) / 10 };
  if (arbol) r.idp = (i < Math.max(1, Math.floor(n / 20))) ? null : (Math.floor((i * 2654435761) % i) + 1);
  return r;
});`;

async function medirOps(page, ops) {
  const out = {};
  for (const [nombre, fn, arg] of ops) {
    let timer;
    const limite = new Promise((res) => { timer = setTimeout(() => res('limite'), LIMITE); });
    const r = await Promise.race([page.evaluate(fn, arg).then(v => ({ v }), e => ({ e: String(e.message).split('\n')[0] })), limite]);
    clearTimeout(timer);
    if (r === 'limite') { out[nombre] = `> ${LIMITE} (cortado)`; break; }
    if (r.e) { out[nombre] = 'error: ' + r.e; continue; }
    out[nombre] = r.v;
  }
  return out;
}

const T = (f) => `(() => { const t = ET('t1'); const s = performance.now(); (${f})(t); return Math.round(performance.now() - s); })()`;
const ev = (expr) => new Function('return ' + expr);

function escenario(n, arbol) {
  return {
    tipo: 'rendimiento',
    id: `${arbol ? 'arbol' : 'lista'}-${n}`,
    titulo: `${arbol ? 'Árbol' : 'Lista'} de ${n.toLocaleString('es-MX')} filas × 4 columnas`,
    html: pagina({ body: tabla({ cols: arbol ? COLS_ARBOL : COLS_BASE, attrs: arbol ? { 'show-tree': 'true', 'can-move-row': 'false' } : {} }), script: GEN }),
    async medir(page) {
      await page.evaluate(([k, a]) => { const t = ET('t1'); t.AutoAddRow = false; t.DataArray = window.__gen(k, a); }, [n, arbol]);
      const ops = arbol ? [
        ['_printTreeData (inicial, colapsado)', ev(T('t => t._printTreeData()'))],
        ['_expandOnStart + _printTreeData', ev(T('t => { t._expandOnStart = true; t._printTreeData(); }'))],
        ['_printRows', ev(T('t => t._printRows()'))],
        ['NavTo(80 %)', ev(T(`t => t.NavTo(${Math.floor(n * 0.8)}, 0)`))],
        ['flecha abajo (NavDown)', ev(T('t => t.NavDown(t.CurrentTd())'))],
        ['ordenar en árbol (clic en encabezado)', ev(T('t => t._table.tHead.rows[0].cells[0].onclick({ stopPropagation(){} })'))],
        ['editar una celda (CellFocus+StartEdit+ConfirmEdit)', ev(T(`t => { const td = t.GetTrByIndex(${Math.floor(n / 2)}).cells[1]; t.CellFocus(td); t.StartEdit(td, ''); t.EdiTable.GetInput().value = '5'; t.ConfirmEdit(td); }`))],
        ['UpdateRow', ev(T(`t => t.UpdateRow(${n - 1})`))],
        ['UpdateData', ev(T('t => t.UpdateData()'))],
      ] : [
        ['_printRows', ev(T('t => t._printRows()'))],
        ['NavTo(80 %)', ev(T(`t => t.NavTo(${Math.floor(n * 0.8)}, 0)`))],
        ['flecha abajo (NavDown)', ev(T('t => t.NavDown(t.CurrentTd())'))],
        ['AvPág (NavTo +10)', ev(T(`t => t.NavTo(t.CurrentRowIndex() + 10, t.CurrentColIndex())`))],
        ['ordenar (clic en encabezado)', ev(T('t => t._table.tHead.rows[0].cells[1].onclick({ stopPropagation(){} })'))],
        ['editar una celda (CellFocus+StartEdit+ConfirmEdit)', ev(T(`t => { const td = t.GetTrByIndex(${Math.floor(n / 2)}).cells[1]; t.CellFocus(td); t.StartEdit(td, ''); t.EdiTable.GetInput().value = 'x'; t.ConfirmEdit(td); }`))],
        ['UpdateRow', ev(T(`t => t.UpdateRow(${n - 1})`))],
        ['AddRow', ev(T('t => t.AddRow()'))],
        ['UpdateData', ev(T('t => t.UpdateData()'))],
      ];
      return medirOps(page, ops);
    },
  };
}

export default [1000, 5000, 20000].flatMap(n => [escenario(n, false), escenario(n, true)]);
