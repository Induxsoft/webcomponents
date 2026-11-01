// F6 (spec §11, P24-P26): agrupar por columna, con subtotales.
// Congela el comportamiento v2 activado (group-panel, GroupBy) para F5 (virtualización) y la integración.
// Lo central: con filas de grupo en el tbody, todo índice sigue siendo de DataArray (R2), así que
// DataArray[CurrentRowIndex()] (list.dk:87 de V12) es siempre el registro de la fila que se ve seleccionada.
import { pagina, tabla } from '../../lib/pagina.mjs';

const E = ['v2', 'f6', 'agrupacion'];
const DATOS = [
  { sys_pk: 101, codigo: 'A1', nombre: 'Uno ficticio', linea: 'Eléctrico', marca: 'X', cantidad: 2, precio: 10.5 },
  { sys_pk: 102, codigo: 'A2', nombre: 'Dos ficticio', linea: 'Ferretería', marca: 'Y', cantidad: 3, precio: 20 },
  { sys_pk: 103, codigo: 'A3', nombre: 'Tres ficticio', linea: 'Eléctrico', marca: 'Y', cantidad: 5, precio: 7.25 },
  { sys_pk: 104, codigo: 'A4', nombre: 'Cuatro ficticio', linea: 'Ferretería', marca: 'Y', cantidad: 7, precio: 99 },
  { sys_pk: 105, codigo: 'A5', nombre: 'Cinco ficticio', linea: 'Eléctrico', marca: 'X', cantidad: 11, precio: 1 },
  { sys_pk: 106, codigo: 'A6', nombre: 'Seis ficticio', linea: '', marca: 'X', cantidad: 13, precio: 3.5 },
];
const COLS = (x = {}) => [
  { field: 'codigo', title: 'Código', type: 'Text', width: '80px', ...(x.codigo ?? {}) },
  { field: 'nombre', title: 'Nombre', type: 'Text', width: '160px', ...(x.nombre ?? {}) },
  { field: 'linea', title: 'Línea', type: 'Text', width: '110px', ...(x.linea ?? {}) },
  { field: 'marca', title: 'Marca', type: 'Text', width: '70px', ...(x.marca ?? {}) },
  { field: 'cantidad', title: 'Cantidad', type: 'Number', width: '90px', summary: 'sum', ...(x.cantidad ?? {}) },
  { field: 'precio', title: 'Precio', type: 'Number', width: '90px', format: 'true', decs: '2', summary: 'max', ...(x.precio ?? {}) },
];
// Estado que se fotografía: cada fila del tbody (grupo: nivel, llave, texto; datos: índice de DataArray,
// código que se ve y si coincide con DataArray), la acción estilo V12 y los eventos nuevos.
const SCRIPT = `window.__ev = [];
document.addEventListener('DOMContentLoaded', () => {
  const t = ET('t1');
  ['BeforeGroup','GroupChanged','GroupToggled','SelectionChanged','LayoutChanged','RowChanged'].forEach(n =>
    t.addEventListener(n, (e) => window.__ev.push([n, ('path' in e ? e.path : (e.groups ?? e.selected ?? e.reason ?? [e.previous_index, e.index])), 'expanded' in e ? e.expanded : null])));
});
window.__accion = () => { const t = ET('t1'); const i = t.CurrentRowIndex(); return i < 0 ? null : (t.DataArray[i]?.sys_pk ?? null); };
window.__etExtra = () => { const t = ET('t1'); const s = ETs('t1');
  const filas = Array.from(s.querySelector('tbody').rows).map(tr => {
    const h = tr.classList.contains('hidde-row') ? ' (oculta)' : '';
    if (tr.classList.contains('et-group-row')) return 'G' + tr.getAttribute('data-level') + ' [' + tr.getAttribute('data-key') + '] ' + Array.from(tr.cells).map(c => c.textContent.replace(/\\s+/g, ' ').trim()).join(' | ') + h;
    const i = t._getRowIndex(tr); const td = tr.querySelectorAll('td:not(.et-sel-col)')[t.Columns.findIndex(c => c.field === 'codigo')];
    const ve = (td ? td.textContent.trim() : '');
    return i + ':' + ve + (!t.DataArray[i] ? ' (nueva, sin datos)' : (String(t.DataArray[i].codigo ?? '') === ve ? '' : ' DESALINEADA')) + h;
  });
  const act = s.activeElement;
  return {
    eventos: window.__ev.splice(0), grupos: t.getGroups(), filas,
    actual: [t.CurrentRowIndex(), t.CurrentColIndex()], accion: window.__accion(),
    focoEnGrupo: (act && act.closest && act.closest('tr.et-group-row')) ? act.closest('tr.et-group-row').getAttribute('data-key') : null,
    trcount: t.TRCount(), totales: t.getSummaries(), sel: t.getSelectedRows ? t.getSelectedRows() : null,
    panel: Array.from(s.querySelectorAll('.et-group-panel > *')).map(c => c.getAttribute('data-field')),
    datos: t.DataArray.map(r => r.codigo), a7: window.__a7 ?? null,
  }; };`;
const html = (attrs = {}, x = {}, data = DATOS) => pagina({
  body: `<div id="caja" style="width:640px;overflow:auto">${tabla({ attrs: { 'design-auto-save': 'false', 'group-panel': 'true', ...attrs }, data, cols: COLS(x) })}</div>`,
  script: SCRIPT,
});
// Clic real en la celda col (índice de datos) de la fila que muestra el código.
const clicCodigo = async (h, codigo, col = 1) => {
  const p = await h._punto(([cod, c]) => { const tr = Array.from(ETs('t1').querySelector('tbody').rows).find(r => !r.classList.contains('et-group-row') && r.querySelector('td:not(.et-sel-col)').textContent.trim() === cod); return tr && tr.querySelectorAll('td:not(.et-sel-col)')[c]; }, [codigo, col]);
  await h.page.mouse.click(p.x, p.y);
  await h.asentar();
};
// Clic en la fila de grupo cuya ruta (llaves desde el primer nivel) es `ruta`.
const clicGrupo = async (h, ruta, sel = '.et-group-label') => {
  const p = await h._punto(([k, s]) => Array.from(ETs('t1').querySelectorAll('tbody tr.et-group-row')).find(r => JSON.stringify(r._f6Grupo.path) === k)?.querySelector(s), [JSON.stringify(ruta), sel]);
  await h.page.mouse.click(p.x, p.y);
  await h.asentar();
};
const thIdx = (f) => ['codigo', 'nombre', 'linea', 'marca', 'cantidad', 'precio'].indexOf(f);
const arrastrar = (h, origen, destino, dx = 0.25) => h.js(([o, d, dx]) => {
  const s = ETs('t1'); const a = s.querySelector(o), b = s.querySelector(d);
  const dt = new DataTransfer(); const r = b.getBoundingClientRect(); const x = r.left + r.width * dx, y = r.top + r.height / 2;
  const ev = (el, tipo) => el.dispatchEvent(new DragEvent(tipo, { bubbles: true, cancelable: true, composed: true, dataTransfer: dt, clientX: x, clientY: y }));
  ev(a, 'dragstart'); ev(b, 'dragenter'); ev(b, 'dragover'); ev(b, 'drop'); ev(a, 'dragend');
}, [origen, destino, dx]);

export default [
  {
    id: 'agrupacion-niveles', titulo: 'uno y dos niveles: arrastrar al panel, GroupBy, reordenar y quitar chips, llave vacía "(vacío)", Ungroup',
    etiquetas: E, origen: 'spec §11-a..e, P25', registro: 'consumer',
    html: html({}, { nombre: { groupable: 'false' } }),
    pasos: [
      ['arrastrar Línea al panel', h => arrastrar(h, 'thead th[field="linea"]', 'div.et-group-panel')],
      ['arrastrar Nombre (groupable="false"): no agrupa', h => arrastrar(h, 'thead th[field="nombre"]', 'div.et-group-panel')],
      ['arrastrar Marca al panel (segundo nivel)', h => arrastrar(h, 'thead th[field="marca"]', 'div.et-group-panel', 0.95)],
      ['reordenar las chips: Marca antes de Línea', h => arrastrar(h, 'div.et-group-panel > :nth-child(2)', 'div.et-group-panel > :nth-child(1)', 0.1)],
      ['quitar la chip de Marca con ×', h => h.clicShadow('t1', '.et-group-chip[data-field="marca"] .et-chip-remove')],
      ['Ungroup()', h => h.js(() => ET('t1').Ungroup())],
    ],
  },
  {
    id: 'agrupacion-expandir-colapsar', titulo: 'CollapseGroup/ExpandGroup, todos, clic en el triángulo y GroupToggled; colapsar con el foco dentro lo pasa a la fila de grupo',
    etiquetas: E, origen: 'spec §11-d, §11-f, §11-j', registro: 'consumer',
    html: html(),
    pasos: [
      ['GroupBy(linea, marca)', h => h.js(() => ET('t1').GroupBy(['linea', 'marca']))],
      ['clic en A3 y CollapseGroup([Eléctrico]) con el foco dentro', async h => { await clicCodigo(h, 'A3'); await h.js(() => ET('t1').CollapseGroup(['Eléctrico'])); }],
      ['ExpandGroup([Eléctrico]) y CollapseGroup([Ferretería, Y])', h => h.js(() => { const t = ET('t1'); t.ExpandGroup(['Eléctrico']); t.CollapseGroup(['Ferretería', 'Y']); })],
      ['clic en el triángulo de Ferretería/Y (expande)', h => clicGrupo(h, ['Ferretería', 'Y'], '.et-group-toggle')],
      ['CollapseAllGroups()', h => h.js(() => ET('t1').CollapseAllGroups())],
      ['ExpandAllGroups()', h => h.js(() => ET('t1').ExpandAllGroups())],
    ],
  },
  {
    id: 'agrupacion-subtotales-celda', titulo: 'subtotales en una celda: llave, número de filas y subtotales con el formato del pie; se recalculan al editar y el pie cuenta solo lo expandido',
    etiquetas: E, origen: 'spec §11-e, §2-d (visible con agrupación)', registro: 'consumer',
    html: html(),
    pasos: [
      ['GroupBy(linea)', h => h.js(() => ET('t1').GroupBy(['linea']))],
      ['editar cantidad de A2 (3 → 30)', async h => { await clicCodigo(h, 'A2', 4); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('30'); await h.tecla('Enter'); }],
      ['colapsar Ferretería: el pie (visible) ya no la cuenta', h => h.js(() => ET('t1').CollapseGroup(['Ferretería']))],
      ['editar línea de A1 a Ferretería: la fila cambia de grupo', async h => { await clicCodigo(h, 'A1', 2); await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('Ferretería'); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'agrupacion-subtotales-linea', titulo: 'group-summary="inline": una celda por columna; MoveColumn, HideColumn y FixColumn mueven y ocultan las celdas de las filas de grupo',
    etiquetas: E, origen: 'spec §11-e, P25, §6, §7, §8', registro: 'consumer',
    html: html({ 'group-summary': 'inline', 'column-reorder': 'true', 'column-chooser': 'true' }),
    pasos: [
      ['GroupBy(linea)', h => h.js(() => ET('t1').GroupBy(['linea']))],
      ['MoveColumn(cantidad, 0)', h => h.js(() => ET('t1').MoveColumn('cantidad', 0))],
      ['HideColumn(nombre)', h => h.js(() => ET('t1').HideColumn('nombre'))],
      ['FixColumn(codigo)', h => h.js(() => ET('t1').FixColumn('codigo', true))],
      ['arrastrar Marca: soltar en un th reordena, soltar en el panel agrupa', async h => { await arrastrar(h, 'thead th[field="marca"]', 'thead th[field="codigo"]', 0.1); await arrastrar(h, 'thead th[field="marca"]', 'div.et-group-panel', 0.95); }],
    ],
  },
  {
    id: 'agrupacion-v12-accion', titulo: 'acción por registro estilo V12 (DataArray[CurrentRowIndex()]) dentro de un grupo, después de ordenar, de colapsar otro grupo, de borrar y de insertar',
    etiquetas: E, origen: 'v12 _templates/v12/app_crudl/list.dk:87; spec §0-R2, §11-g, P26', registro: 'consumer',
    html: html(),
    pasos: [
      ['GroupBy(linea) y clic en A4 (Ferretería)', async h => { await h.js(() => ET('t1').GroupBy(['linea'])); await clicCodigo(h, 'A4'); }],
      ['ordenar por cantidad dos veces (DESC dentro de cada grupo) y clic en A2', async h => { await h.clicEncabezado('t1', thIdx('cantidad')); await h.clicEncabezado('t1', thIdx('cantidad')); await clicCodigo(h, 'A2'); }],
      ['colapsar el grupo vacío y Eléctrico; clic en A4', async h => { await h.js(() => { const t = ET('t1'); t.CollapseGroup(['']); t.CollapseGroup(['Eléctrico']); }); await clicCodigo(h, 'A4'); }],
      ['expandir todo y DeleteRow del índice de A3; clic en A5', async h => { await h.js(() => { const t = ET('t1'); t.ExpandAllGroups(); t.DeleteRow(t.DataArray.findIndex(r => r.codigo === 'A3')); }); await clicCodigo(h, 'A5'); }],
      ['InsertRow(0) y llenarla por código (A7, Ferretería)', h => h.js(() => { const t = ET('t1'); t.InsertRow(0, true); t.UpdateDataMember(0, 'sys_pk', 107); t.UpdateDataMember(0, 'codigo', 'A7'); t.UpdateDataMember(0, 'linea', 'Ferretería'); })],
      ['clic en A7 y en A1', async h => { await clicCodigo(h, 'A7'); await h.js(() => { window.__a7 = window.__accion(); }); await clicCodigo(h, 'A1'); }],
    ],
  },
  {
    id: 'agrupacion-teclado', titulo: 'teclado: las flechas recorren las filas de grupo, Enter y Espacio expanden o colapsan, no se editan, CurrentRowIndex() = -1 en un grupo; AutoAddRow agrega al final y la fila va a su grupo al dejarla',
    etiquetas: E, origen: 'spec §11-f, §11-i, P24', registro: 'consumer',
    html: html(),
    pasos: [
      ['GroupBy(linea), clic en A1 y flecha arriba (llega al grupo Eléctrico; CurrentRowIndex() = -1)', async h => { await h.js(() => ET('t1').GroupBy(['linea'])); await clicCodigo(h, 'A1'); await h.tecla('ArrowUp'); }],
      ['Enter (colapsa, no edita)', h => h.tecla('Enter')],
      ['Enter otra vez (expande)', h => h.tecla('Enter')],
      ['flecha abajo (A1, columna 1) y Espacio (sin multi-select no hace nada)', async h => { await h.tecla('ArrowDown'); await h.tecla(' '); }],
      ['flecha derecha y flecha abajo (A3, columna 2)', async h => { await h.tecla('ArrowRight'); await h.tecla('ArrowDown'); }],
      ['flecha abajo dos veces (A5 y el grupo Ferretería)', h => h.tecla('ArrowDown', 2)],
      ['flecha izquierda (colapsa) y flecha derecha (expande) sobre el grupo', async h => { await h.tecla('ArrowLeft'); await h.tecla('ArrowRight'); }],
      ['Ctrl+Inicio desde el grupo (primera fila visible: el grupo vacío)', h => h.tecla('Control+Home')],
      ['Ctrl+Fin (última fila, A4)', h => h.tecla('Control+End')],
      ['flecha abajo en la última fila: AutoAddRow agrega una fila al final', h => h.tecla('ArrowDown')],
      ['capturar código y línea de la fila nueva (se queda mientras tiene el foco)', async h => {
        await h.tecla('F2'); await h.escribir('A8'); await h.tecla('Enter');
        await h.tecla('ArrowRight'); await h.tecla('F2'); await h.escribir('Eléctrico'); await h.tecla('Enter');
      }],
      ['clic en A2: la fila nueva se coloca en Eléctrico', h => clicCodigo(h, 'A2')],
    ],
  },
  {
    id: 'agrupacion-combinado', titulo: 'agrupar con selección (checkbox), columna fija y totales: Mayús+clic entre grupos, SelectAll, copiar y exportar sin filas de grupo',
    etiquetas: E, origen: 'spec §11, §4.1, §4.2, §5, §6, §2', registro: 'consumer',
    html: html({ 'multi-select': 'checkbox' }, { codigo: { fixed: 'left' } }),
    pasos: [
      ['GroupBy(linea)', h => h.js(() => ET('t1').GroupBy(['linea']))],
      ['casilla de A5 y Mayús+casilla de A2 (rango visible entre grupos)', async h => {
        await h.js(() => { const tr = Array.from(ETs('t1').querySelector('tbody').rows).find(r => r.textContent.includes('A5')); tr.querySelector('td.et-sel-col input').click(); });
        await h.js(() => { const tr = Array.from(ETs('t1').querySelector('tbody').rows).find(r => r.textContent.includes('A2')); tr.querySelector('td.et-sel-col').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, shiftKey: true })); });
      }],
      ['SelectAll y copiar/exportar', h => h.js(() => { const t = ET('t1'); t.SelectAll(); window.__copia = t.getClipboardText(); window.__csv = t.exportCSV(); return [window.__copia, window.__csv, t.getExportData().rows.length]; })],
      ['ClearSelection, colapsar Eléctrico y Ungroup', h => h.js(() => { const t = ET('t1'); t.ClearSelection(); t.CollapseGroup(['Eléctrico']); const a = t.getSummaries(); t.Ungroup(); return [a, t.getSummaries()]; })],
    ],
  },
];
