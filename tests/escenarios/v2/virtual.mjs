// F5 (spec §10): virtualización con virtual-rows="true". Congela el comportamiento v2 activado.
// Los datos se generan en la página (no en el HTML) para que el escenario sea ligero; la foto incluye DataArray,
// por eso los escenarios que editan usan pocas filas y el de 20,000 solo lee.
import { pagina, tabla } from '../../lib/pagina.mjs';

const E = ['v2', 'f5', 'virtual'];
const COLS = [
  { field: 'codigo', title: 'Código', type: 'Text' },
  { field: 'nombre', title: 'Nombre', type: 'Text' },
  { field: 'linea', title: 'Línea', type: 'Text' },
  { field: 'cantidad', title: 'Cantidad', type: 'Number' },
  { field: 'precio', title: 'Precio', type: 'Number', format: 'true', decs: '2' },
];
const GEN = (n) => `window.__gen = () => Array.from({ length: ${n} }, (_, i) => ({ codigo: 'P-' + String(i + 1).padStart(5, '0'), nombre: 'Producto ficticio ' + (i + 1), linea: ['Ferretería', 'Eléctrico', 'Plomería', 'Pintura'][i % 4], cantidad: (i * 7) % 50, precio: ((i * 37) % 1000) / 10 }));`;
// Lo que se ve de la virtualización en cada foto (además del DOM): filas dibujadas, rellenos y su alto, contenedor.
const EXTRA = `window.__etExtra = () => { const t = ET('t1'), tb = ETs('t1').querySelector('tbody');
  const filas = Array.from(tb.rows), datos = filas.filter(r => !r.classList.contains('et-spacer'));
  const c = t._f5Cont;
  return { TRCount: t.TRCount(), dibujadas: datos.length, primera: datos[0]?.cells[t._etSysCols?.() ?? 0]?.textContent ?? null,
    ultima: datos[datos.length - 1]?.cells[t._etSysCols?.() ?? 0]?.textContent ?? null,
    rellenos: filas.filter(r => r.classList.contains('et-spacer')).map(r => r.style.height),
    contenedor: (c === window ? 'window' : (c?.id || (c?.getRootNode?.() instanceof ShadowRoot ? 'div interno' : c?.tagName) || null)),
    actual: [t.CurrentRowIndex(), t.CurrentColIndex()], pinta: window.__pinta ?? null, impresion: window.__imp ?? null,
    sel: t.getSelectedRows?.(), sumas: t.getSummaries?.() };
};`;
const V = { 'virtual-rows': 'true', 'row-height': '28px' };
// V12: el scroll vive fuera del componente (control-styles quita el overflow del div interno).
const V12 = 'div:has(table#t1){overflow:revert !important}';
// Con 20,000 filas, cada fila del modelo lleva solo el código (la foto guarda DataArray completo).
const GEN_MIN = (n) => `window.__gen = () => Array.from({ length: ${n} }, (_, i) => ({ codigo: 'P-' + String(i + 1).padStart(5, '0') }));`;
const html = ({ n, attrs = {}, cols = COLS, alto = 300, fuera = false, script = '', gen = GEN }) => pagina({
  body: `<div id="sc" style="height:${alto}px;overflow-y:auto">` + tabla({ cols, attrs: { ...V, ...(fuera ? { 'control-styles': V12 } : {}), ...attrs } }) + '</div>',
  script: gen(n) + EXTRA + `
document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.AutoAddRow = false; ${script} t.DataArray = window.__gen(); t._printRows(); });`,
});
const desplazar = (y) => (h) => h.js((v) => { const t = ET('t1'); (t._f5Cont === window ? window.scrollTo(0, v) : t._f5Cont.scrollTop = v); }, y);

export default [
  {
    id: 'virtual-20000', titulo: 'virtual-rows con 20,000 filas y el scroll fuera del componente (como V12): desplazar, teclado hasta el final, GetTrByIndex lejano e imprimir',
    etiquetas: E, origen: 'spec §10, P21, P22', registro: 'consumer', estilos: false,
    html: html({ n: 20000, fuera: true, gen: GEN_MIN, cols: COLS.slice(0, 2) }),
    pasos: [
      ['desplazar a la fila 10,000', desplazar(10000 * 28)],
      ['volver arriba y clic en (0, nombre)', async h => { await desplazar(0)(h); await h.clicCelda('t1', 0, 1); }],
      ['Ctrl+Fin (teclado hasta el final)', h => h.tecla('Control+End')],
      ['flecha arriba y AvPág desde el final', async h => { await h.tecla('ArrowUp'); await h.tecla('PageUp'); }],
      ['GetTrByIndex(12345): desplaza y dibuja la fila', h => h.js(() => { const t = ET('t1'); const tr = t.GetTrByIndex(12345); window.__pinta = [tr?.cells[0].textContent, t._getRowIndex(tr), !!tr?.isConnected]; })],
      ['imprimir: beforeprint dibuja todas y afterprint regresa', h => h.js(() => {
        const sr = ETs('t1');
        window.dispatchEvent(new Event('beforeprint'));
        const a = sr.querySelectorAll('tbody > tr:not(.et-spacer)').length, r = sr.querySelectorAll('tbody > tr.et-spacer').length;
        window.dispatchEvent(new Event('afterprint'));
        window.__imp = { alImprimir: a, rellenosAlImprimir: r, despues: sr.querySelectorAll('tbody > tr:not(.et-spacer)').length };
      })],
    ],
  },
  {
    id: 'virtual-teclado-edicion', titulo: 'virtual-rows en el div interno: flechas, AvPág, Ctrl+Fin/Inicio, editar y UpdateData en una fila lejana',
    etiquetas: E, origen: 'spec §10, §0-R2', registro: 'consumer', estilos: false,
    html: html({ n: 120 }),
    pasos: [
      ['clic en (1, nombre) y 3 flechas abajo', async h => { await h.clicCelda('t1', 1, 1); await h.tecla('ArrowDown', 3); }],
      ['AvPág 5 veces (fila 54)', h => h.tecla('PageDown', 5)],
      ['editar la celda: F2, texto y Enter', async h => { await h.tecla('F2'); await h.js(() => { ETs('t1').querySelector('#__table_input').value = 'Editado'; }); await h.tecla('Enter'); }],
      ['desplazar arriba (la fila actual sigue dibujada)', desplazar(0)],
      ['Ctrl+Fin y Ctrl+Inicio', async h => { await h.tecla('Control+End'); await h.tecla('Control+Home'); }],
      ['UpdateData(): solo lee las filas dibujadas, no pierde lo editado', h => h.js(() => { const t = ET('t1'); t.UpdateData(); window.__pinta = t.DataArray[54].nombre; })],
    ],
  },
  {
    id: 'virtual-api-filas', titulo: 'virtual-rows: UpdateRow/UpdateDataMember de una fila sin dibujar, InsertRow, DeleteRow, AddRow, ordenar, RenderAll/RenderVisible y onRowPaint',
    etiquetas: E, origen: 'spec §10, P22', registro: 'consumer', estilos: false,
    html: html({ n: 120, script: "window.__np = 0; t.onRowPaint = () => window.__np++;" }),
    pasos: [
      ['UpdateDataMember + UpdateRow en la fila 100 (sin dibujar)', h => h.js(() => { const t = ET('t1'); t.UpdateDataMember(100, 'nombre', 'Cambiado'); window.__pinta = [t.UpdateRow(100), window.__np]; })],
      ['GetTrByIndex(100) la dibuja con el valor del modelo', h => h.js(() => { const t = ET('t1'); const tr = t.GetTrByIndex(100); window.__pinta = tr.cells[1].textContent; })],
      ['InsertRow(2) y DeleteRow(4)', h => h.js(() => { const t = ET('t1'); t.InsertRow(2, true); t.DeleteRow(4); window.__pinta = [t.DataArray.length, t.DataArray[2], t.DataArray[4].codigo]; })],
      ['AddRow(): la fila nueva va al final del modelo y recibe el foco', h => h.js(() => { const t = ET('t1'); t.AddRow(); window.__pinta = [t.DataArray.length, t.CurrentRowIndex()]; })],
      ['arriba y ordenar por código (el manejador del encabezado)', async h => { await desplazar(0)(h); await h.js(() => ET('t1')._table.tHead.rows[0].cells[0].onclick({ stopPropagation() {} })); }],
      ['RenderAll() y RenderVisible()', h => h.js(() => { const t = ET('t1'); t.RenderAll(); const a = ETs('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length; t.RenderVisible(); window.__pinta = a; })],
      ['VirtualRows = false: se dibujan todas (como sin el atributo)', h => h.js(() => { ET('t1').VirtualRows = false; })],
    ],
  },
  {
    id: 'virtual-seleccion-fijas-totales', titulo: 'virtual-rows con multi-select, columna fija, totales, ocultar y reordenar: las filas que se dibujan después salen con el estado actual',
    etiquetas: E, origen: 'spec §10, §2, §4.1, §6, §7, §8', registro: 'consumer', estilos: false,
    html: html({ n: 120, attrs: { 'multi-select': 'checkbox', 'column-reorder': 'true', 'column-chooser': 'true', 'design-auto-save': 'false' },
      cols: COLS.map(c => c.field === 'codigo' ? { ...c, fixed: 'left' } : c.field === 'cantidad' ? { ...c, summary: 'sum' } : c) }),
    pasos: [
      ['SelectRows([1, 100]) y desplazar a la 95', async h => { await h.js(() => ET('t1').SelectRows([1, 100])); await desplazar(95 * 28)(h); }],
      ['HideColumn(linea) y MoveColumn(precio, 1), desplazar a la 60', async h => { await h.js(() => { const t = ET('t1'); t.HideColumn('linea'); t.MoveColumn('precio', 1); }); await desplazar(60 * 28)(h); }],
      ['SelectAll() en virtual selecciona todo el modelo', h => h.js(() => { ET('t1').SelectAll(); })],
      ['summary-scope="selected" con dos filas', h => h.js(() => { const t = ET('t1'); t.setAttribute('summary-scope', 'selected'); t.SelectRows([0, 119]); })],
      ['copiar y exportar usan el modelo', h => h.js(() => { const t = ET('t1'); t.SelectRows([0, 119]); window.__pinta = [t.getClipboardText().split('\r\n'), t.exportCSV().split('\r\n').length, t.getExportData({ selectedOnly: true }).rows]; })],
    ],
  },
];
