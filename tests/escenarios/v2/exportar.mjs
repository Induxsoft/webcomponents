// F4 (spec §5): getExportData, exportCSV en el componente (el XLSX vive en induxsoft.controls.excel.js).
import { pagina, tabla } from '../../lib/pagina.mjs';

const E = ['v2', 'f4', 'exportar'];
const COLS = [
  { field: 'codigo', title: 'Código', type: 'Text' },
  { field: 'nombre', title: 'Nombre', type: 'Text' },
  { field: 'linea', title: 'Línea', type: 'Text', class: 'no-print' },
  { field: 'u', title: 'Unidad', type: 'Select', options: '{"PZA":"PIEZA","CJ":"CAJA"}' },
  { field: 'precio', title: 'Precio', type: 'Number', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' },
];
const DATA = [
  { codigo: 'A,1', nombre: 'Dice "hola"', linea: 'x', u: 'CJ', precio: 1234.5 },
  { codigo: 'B', nombre: 'dos\nlíneas', linea: 'y', u: 'PZA', precio: 2 },
  { codigo: 'C', nombre: 'Tres', linea: 'z', u: 'XX', precio: '' },
];
const SCRIPT = `window.__etExtra = () => { const t = ET('t1'); return {
  datos: t.getExportData(), sel: t.getExportData({ selectedOnly: true, raw: true, includeHidden: true }),
  csv: t.exportCSV(), csvCrudo: t.exportCSV({ raw: true, delimiter: ';', bom: true }) }; };`;

export default [
  {
    id: 'f4-exportar', titulo: 'getExportData y exportCSV: orden y visibilidad, sin no-print, Select como texto, selectedOnly, raw, includeHidden',
    etiquetas: E, origen: 'spec §5', registro: 'consumer',
    html: pagina({ body: tabla({ data: DATA, cols: COLS, attrs: { 'multi-select': 'checkbox' } }), script: SCRIPT }),
    pasos: [
      ['ocultar nombre y seleccionar la fila 1', h => h.js(() => { const t = ET('t1'); t.hideColumn('nombre', true); t.SelectRows([1]); })],
      ['mostrar nombre', h => h.js(() => ET('t1').hideColumn('nombre', false))],
    ],
  },
];
