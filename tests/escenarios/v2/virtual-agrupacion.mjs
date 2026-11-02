// Integración F5+F6 (spec §10 y §11): agrupación con virtual-rows. La lista virtual incluye las filas de grupo
// (solo las visibles: sin las de los grupos colapsados) y todo índice sigue siendo de DataArray (R2), así que
// DataArray[CurrentRowIndex()] (list.dk:87 de V12) es siempre el registro de la fila seleccionada.
// La foto lista solo las filas dibujadas (grupo: nivel, llave y texto; datos: índice, código y si coincide con
// DataArray) y comprueba que el DOM esté en el orden de la lista virtual.
import { pagina, tabla } from '../../lib/pagina.mjs';

const E = ['v2', 'f5', 'f6', 'virtual', 'agrupacion'];
const COLS = [
  { field: 'codigo', title: 'Código', type: 'Text' },
  { field: 'linea', title: 'Línea', type: 'Text' },
  { field: 'marca', title: 'Marca', type: 'Text' },
  { field: 'cantidad', title: 'Cantidad', type: 'Number', summary: 'sum' },
];
// Con 20,000 filas los campos llevan nombres cortos y no hay cantidad: la foto guarda DataArray completo.
const COLS_MIN = [
  { field: 'c', title: 'Código', type: 'Text' },
  { field: 'l', title: 'Línea', type: 'Text' },
  { field: 'm', title: 'Marca', type: 'Text' },
];
// Datos ficticios generados en la página.
const GEN = (n) => `window.__gen = () => Array.from({ length: ${n} }, (_, i) => ({ codigo: 'P-' + String(i + 1).padStart(5, '0'), linea: ['F', 'E', 'P', 'T'][i % 4], marca: ['X', 'Y', 'Z'][Math.floor(i / 4) % 3], cantidad: i % 10 }));`;
const GEN_MIN = (n) => `window.__gen = () => Array.from({ length: ${n} }, (_, i) => ({ c: 'P-' + String(i + 1).padStart(5, '0'), l: ['F', 'E', 'P', 'T'][i % 4], m: ['X', 'Y', 'Z'][Math.floor(i / 4) % 3] }));`;
const EXTRA = `window.__accion = () => { const t = ET('t1'); const i = t.CurrentRowIndex(); return i < 0 ? null : (t.DataArray[i]?.[t.Columns[0].field] ?? null); };
window.__etExtra = () => { const t = ET('t1'), s = ETs('t1'), tb = s.querySelector('tbody');
  const dib = Array.from(tb.rows).filter(r => !r.classList.contains('et-spacer'));
  const pos = dib.map(r => t._f5PosTr.get(r));
  const filas = dib.map(tr => {
    if (tr.classList.contains('et-group-row')) return 'G' + tr.getAttribute('data-level') + ' [' + tr.getAttribute('data-key') + '] ' + Array.from(tr.cells).map(c => c.textContent.replace(/\\s+/g, ' ').trim()).filter(Boolean).join(' | ');
    const i = t._getRowIndex(tr); const td = tr.querySelectorAll('td:not(.et-sel-col)')[0];
    const ve = (td ? td.textContent.trim() : '');
    return i + ':' + ve + (!t.DataArray[i] ? ' SIN DATOS' : (String(t.DataArray[i][t.Columns[0].field] ?? '') === ve ? '' : ' DESALINEADA')) + (tr.querySelector('td.et-sel-col input:checked') ? ' [x]' : '');
  });
  const act = s.activeElement;
  return { virtual: t._f5Activo, lista: t._f5Lista.length, ordenDom: pos.every((p, k) => p !== undefined && (k === 0 || p > pos[k - 1])),
    rellenos: Array.from(tb.rows).filter(r => r.classList.contains('et-spacer')).length,
    grupos: t.getGroups(), filas, actual: [t.CurrentRowIndex(), t.CurrentColIndex()], accion: window.__accion(),
    focoEnGrupo: (act && act.closest && act.closest('tr.et-group-row')) ? act.closest('tr.et-group-row')._f6Grupo.path : null,
    TRCount: t.TRCount(), totales: t.getSummaries(), sel: t.getSelectedRows ? t.getSelectedRows() : null,
    eventos: (window.__ev ?? []).splice(0), pinta: window.__pinta ?? null };
};`;
const V12 = 'div:has(table#t1){overflow:revert !important}';
const html = ({ n, attrs = {}, alto = 400, fuera = false, script = '', cols = COLS, gen = GEN }) => pagina({
  body: `<div id="sc" style="height:${alto}px;overflow-y:auto">` + tabla({ cols, attrs: { 'virtual-rows': 'true', 'row-height': '28px', 'design-auto-save': 'false', ...(fuera ? { 'control-styles': V12 } : {}), ...attrs } }) + '</div>',
  script: gen(n) + EXTRA + `
window.__ev = [];
document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); ${script}
  ['GroupChanged', 'GroupToggled'].forEach(k => t.addEventListener(k, (e) => window.__ev.push([k, ('path' in e ? e.path : e.groups), ('expanded' in e ? e.expanded : null)])));
  t.DataArray = window.__gen(); t._printRows(); });`,
});
// Clic real en la celda col de la fila dibujada que muestra el código.
const clicCodigo = async (h, codigo, col = 1, opts = {}) => {
  const p = await h._punto(([cod, c]) => { const tr = Array.from(ETs('t1').querySelector('tbody').rows).find(r => !r.classList.contains('et-group-row') && !r.classList.contains('et-spacer') && r.querySelector('td:not(.et-sel-col)').textContent.trim() === cod); return tr && (c < 0 ? tr.querySelector('td.et-sel-col input') : tr.querySelectorAll('td:not(.et-sel-col)')[c]); }, [codigo, col]);
  if (opts.shift) await h.page.keyboard.down('Shift');
  await h.page.mouse.click(p.x, p.y);
  if (opts.shift) await h.page.keyboard.up('Shift');
  await h.asentar();
};

export default [
  {
    id: 'virtual-agrupacion-20000', titulo: 'virtual-rows con 20,000 filas agrupadas en dos niveles y el scroll fuera del componente (V12): flechas sobre las filas de grupo, Enter/Espacio, expandir y colapsar, GetTrByIndex lejano dentro de un grupo colapsado y la acción V12',
    etiquetas: E, origen: 'spec §10, §11, §0-R2, P22, P24; v12 list.dk:87', registro: 'consumer', estilos: false,
    html: html({ n: 20000, fuera: true, cols: COLS_MIN, gen: GEN_MIN, script: 't.AutoAddRow = false;' }),
    pasos: [
      ['GroupBy(l, m)', h => h.js(() => ET('t1').GroupBy(['l', 'm']))],
      ['NavTo(5, 1) (P-00006, grupo E/Y) y flecha arriba: llega a la fila del grupo Y (CurrentRowIndex() = -1)', async h => { await h.js(() => ET('t1').NavTo(5, 1)); await h.tecla('ArrowUp'); }],
      ['Enter: colapsa E/Y (no edita)', h => h.tecla('Enter')],
      ['flecha arriba (última fila de E/X) y flecha abajo dos veces (grupo Y y grupo Z)', async h => { await h.tecla('ArrowUp'); await h.tecla('ArrowDown', 2); }],
      ['flecha arriba y Espacio: expande E/Y; flecha abajo (P-00006, columna 1)', async h => { await h.tecla('ArrowUp'); await h.tecla(' '); await h.tecla('ArrowDown'); }],
      ['CollapseAllGroups() con el foco en una fila de datos: pasa al grupo E', h => h.js(() => ET('t1').CollapseAllGroups())],
      ['ExpandGroup([T]) y ExpandGroup([T, Z])', h => h.js(() => { const t = ET('t1'); t.ExpandGroup(['T']); t.ExpandGroup(['T', 'Z']); })],
      ['GetTrByIndex(19998) (grupo P/Z, colapsado): expande, desplaza y dibuja la fila', h => h.js(() => { const t = ET('t1'); const tr = t.GetTrByIndex(19998); window.__pinta = [tr?.querySelector('td').textContent, t._getRowIndex(tr), !!tr?.isConnected]; })],
      ['NavTo(12345, 1) (grupo E/Z, colapsado) y acción V12', h => h.js(() => { const t = ET('t1'); t.NavTo(12345, 1); window.__pinta = window.__accion(); })],
      ['Ctrl+Fin y Ctrl+Inicio (filas de grupo)', async h => { await h.tecla('Control+End'); await h.tecla('Control+Home'); }],
      ['AvPág tres veces desde el grupo E y acción V12', async h => { await h.tecla('PageDown', 3); await h.js(() => { window.__pinta = window.__accion(); }); }],
      ['flecha abajo en la última fila visible con AutoAddRow apagado: no agrega', async h => { await h.tecla('Control+End'); await h.tecla('ArrowDown'); }],
    ],
  },
  {
    id: 'virtual-agrupacion-v12-accion', titulo: 'virtual-rows con 2,000 filas en dos niveles: la acción V12 (DataArray[CurrentRowIndex()]) después de ordenar, de colapsar otro grupo, de borrar y de insertar',
    etiquetas: E, origen: 'spec §0-R2, §10, §11-g, P26; v12 list.dk:87', registro: 'consumer', estilos: false,
    html: html({ n: 2000, script: 't.AutoAddRow = false;' }),
    pasos: [
      ['GroupBy(linea, marca) y NavTo(100, 0)', h => h.js(() => { const t = ET('t1'); t.GroupBy(['linea', 'marca']); t.NavTo(100, 0); window.__pinta = window.__accion(); })],
      ['ordenar por código dos veces (DESC dentro de cada grupo) y NavTo(100, 1)', async h => { await h.js(() => { const th = ET('t1')._table.tHead.rows[0].cells[0]; th.onclick({ stopPropagation() {} }); th.onclick({ stopPropagation() {} }); }); await h.js(() => { ET('t1').NavTo(100, 1); window.__pinta = window.__accion(); }); }],
      ['colapsar otro grupo (F/X) y flecha abajo: la acción sigue en su registro', async h => { await h.js(() => ET('t1').CollapseGroup(['F', 'X'])); await h.tecla('ArrowDown'); await h.js(() => { window.__pinta = window.__accion(); }); }],
      ['colapsar T con la fila actual dentro (el foco pasa al grupo) y DeleteRow del índice que tenía', h => h.js(() => { const t = ET('t1'); const i = t.DataArray.findIndex(r => r.codigo === 'P-01900'); t.NavTo(i, 0); t.CollapseGroup(['T']); t.DeleteRow(i); window.__pinta = [i, t.DataArray.length, t.DataArray.some(r => r.codigo === 'P-01900')]; })],
      ['NavTo(200, 0) después de borrar: acción V12', h => h.js(() => { const t = ET('t1'); t.NavTo(200, 0); window.__pinta = [t.CurrentRowIndex(), window.__accion(), t.DataArray[200].codigo]; })],
      ['InsertRow(0) llenada por código (NUEVA, F/X, colapsado): queda en su grupo; NavTo(0, 0) lo expande', async h => { await h.js(() => { const t = ET('t1'); t.InsertRow(0, true); t.UpdateDataMember(0, 'codigo', 'NUEVA'); t.UpdateDataMember(0, 'linea', 'F'); t.UpdateDataMember(0, 'marca', 'X'); }); await h.js(() => { ET('t1').NavTo(0, 0); window.__pinta = window.__accion(); }); }],
      ['flecha arriba hasta la fila de grupo y abajo otra vez: acción V12', async h => { await h.tecla('ArrowUp'); await h.tecla('ArrowDown'); await h.js(() => { window.__pinta = window.__accion(); }); }],
      ['Ungroup()', h => h.js(() => ET('t1').Ungroup())],
    ],
  },
  {
    id: 'virtual-agrupacion-seleccion', titulo: 'virtual-rows con grupos, multi-select y totales: Mayús+clic entre grupos salta las filas de grupo, summary-scope visible cuenta los grupos expandidos (no las filas dibujadas), editar la llave mueve la fila de grupo y AutoAddRow la coloca al dejarla',
    etiquetas: E, origen: 'spec §10, §11, §2 (visible), §4.1, P26', registro: 'consumer', estilos: false,
    html: html({ n: 300, attrs: { 'multi-select': 'checkbox', 'group-panel': 'true' } }),
    pasos: [
      ['GroupBy(linea)', h => h.js(() => ET('t1').GroupBy(['linea']))],
      ['casilla de P-00298 (última de E) y Mayús+casilla de P-00005 (F): el rango salta la fila del grupo F', async h => {
        await h.js(() => { const t = ET('t1'); t.NavTo(t.DataArray.findIndex(r => r.codigo === 'P-00298'), 0); });
        await h.asentar();
        await h.js(() => { const s = ETs('t1'); const fila = (c) => Array.from(s.querySelector('tbody').rows).find(r => r.querySelector('td:not(.et-sel-col)')?.textContent.trim() === c);
          fila('P-00298').querySelector('td.et-sel-col input').click();
          ET('t1').NavTo(4, 0); });
        await h.asentar();
        await h.js(() => { const s = ETs('t1'); const tr = Array.from(s.querySelector('tbody').rows).find(r => r.querySelector('td:not(.et-sel-col)')?.textContent.trim() === 'P-00005');
          tr.querySelector('td.et-sel-col').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, shiftKey: true })); window.__pinta = ET('t1').getSelectedRows().length; });
      }],
      ['colapsar F: el pie (visible) cuenta solo E, P y T; las filas dibujadas no cambian el total', h => h.js(() => { const t = ET('t1'); t.ClearSelection(); t.CollapseGroup(['F']); window.__pinta = [t.getSummary('cantidad'), t.DataArray.filter(r => r.linea !== 'F').reduce((a, r) => a + r.cantidad, 0)]; })],
      ['desplazar el contenedor al final: el total no depende de lo dibujado', h => h.js(() => { const c = ET('t1')._f5Cont; if (c === window) window.scrollTo(0, 1e6); else c.scrollTop = 1e6; window.__pinta = null; })],
      ['expandir todo, NavTo(1, 1) y editar la línea de P-00002 a T: la fila pasa al grupo T con el foco', async h => { await h.js(() => { const t = ET('t1'); t.ExpandAllGroups(); t.NavTo(1, 1); }); await h.asentar(); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('T'); await h.tecla('Enter'); }],
      ['AutoAddRow: Ctrl+Fin y flecha abajo agregan una fila al final', async h => { await h.js(() => { ET('t1').AutoAddRow = true; }); await h.tecla('Control+End'); await h.tecla('ArrowDown'); }],
      ['capturar código y, tras Enter (pasa a Línea), la línea E en la fila nueva: se queda al final mientras tiene el foco', async h => { await h.tecla('F2'); await h.escribir('N1'); await h.tecla('Enter'); await h.tecla('F2'); await h.escribir('E'); await h.tecla('Enter'); }],
      ['flecha arriba: al dejarla, la fila nueva va al grupo E; NavTo hacia ella y acción V12', async h => { await h.tecla('ArrowUp'); await h.asentar(); await h.js(() => { const t = ET('t1'); t.NavTo(t.DataArray.findIndex(r => r.codigo === 'N1'), 0); window.__pinta = window.__accion(); }); }],
    ],
  },
];
