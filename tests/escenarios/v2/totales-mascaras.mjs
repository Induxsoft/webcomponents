// F2 de EdiTable 2 con sus funciones ACTIVADAS: totales en el pie (§2), máscaras y calc (§3), locale y
// valores numéricos (R7, R9, C12, C16). Congela el comportamiento v2 para las fases siguientes.
// La referencia (tests/golden/v2/) se generó con la rama f2-totales-mascaras.
import { pagina, tabla } from '../../lib/pagina.mjs';

const E = ['v2', 'f2'];

// Registra los eventos de F2 y los datos con su tipo (registro: consumer, sin cambiar el camino del componente).
const SCRIPT = `window.__ev = [];
document.addEventListener('DOMContentLoaded', () => {
  const t = ET('t1');
  t.Events.fieldupdated = (e) => window.__ev.push(['fieldupdated', e.row, e.field, e.value]);
  t.addEventListener('MaskInvalid', (e) => window.__ev.push(['maskinvalid', e.row, e.field, e.value, e.reason, e.cancel]));
  t.addEventListener('ValueTypeFallback', (e) => window.__ev.push(['valuetypefallback', e.row, e.field, e.text]));
  t.addEventListener('SummaryCalculated', (e) => window.__ev.push(['summarycalculated', e.field, e.value, e.scope]));
});
window.__etExtra = () => { const t = ET('t1'); const i = ETs('t1').querySelector('#__table_input');
  return { eventos: window.__ev.splice(0), totales: (t.getSummaries ? t.getSummaries() : null),
    editor: i ? { type: i.getAttribute('type'), inputmode: i.getAttribute('inputmode'), step: i.getAttribute('step'), value: i.value } : null,
    datos: t.DataArray.map(r => Object.assign({}, r, { __tipos: Object.keys(r).map(k => k + ':' + typeof r[k]).join(',') })) }; };`;

const html = (cols, data, attrs = {}, o = {}) => pagina({ body: tabla({ data, cols, attrs }), script: SCRIPT, ...o });
// Abre el editor con F2, lo vacía y teclea (como el usuario).
const teclear = (fila, col, texto) => async h => {
  await h.clicCelda('t1', fila, col); await h.tecla('F2');
  await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; });
  await h.escribir(texto);
};

const PROD = [
  { codigo: 'P-001', nombre: 'Tornillo de prueba', cantidad: 10, precio: '2.50' },
  { codigo: 'P-002', nombre: 'Tuerca ficticia', cantidad: '7', precio: 1.1 },
  { codigo: 'P-003', nombre: 'Arandela demo', cantidad: 3, precio: '1234.5' },
  { codigo: 'P-004', nombre: 'Clavo ejemplo', cantidad: '', precio: '0.10' },
];
const COLS_SUM = [
  { field: 'codigo', title: 'Código', type: 'Text', summary: 'count', 'summary-label': '{value} productos' },
  { field: 'nombre', title: 'Nombre', type: 'Text' },
  { field: 'cantidad', title: 'Cantidad', type: 'Number', summary: 'sum' },
  { field: 'precio', title: 'Precio', type: 'Number', format: 'true', decs: '2', prefix: '$', thousandssep: 'true', summary: 'avg', 'summary-label': 'Prom.' },
];

export default [
  {
    id: 'totales-pie',
    titulo: 'summary sum/count/avg con summary-label y formato heredado: tfoot sticky, editar, borrar fila, ocultar columna y RefreshSummaries',
    etiquetas: E, origen: 'spec §2', registro: 'consumer',
    html: html(COLS_SUM, PROD),
    pasos: [
      ['inicial', h => h.js(() => 0)],
      ['editar cantidad de la fila 0 a 20', async h => { await teclear(0, 2, '20')(h); await h.tecla('Enter'); }],
      ['DeleteRow(1)', h => h.js(() => ET('t1').DeleteRow(1))],
      ['hideColumn(precio)', h => h.js(() => ET('t1').hideColumn('precio', true))],
      ['DataArray nuevo y _printRows', h => h.js(() => { const t = ET('t1'); t.DataArray = [{ codigo: 'X', cantidad: '0.1' }, { codigo: 'Y', cantidad: '0.2' }]; t._printRows(); })],
    ],
  },
  {
    id: 'totales-min-max-custom-vacio',
    titulo: 'min, max y custom (SummaryFunction) con summary-format JSON; sin filas: sum 0 y avg/min/max null',
    etiquetas: E, origen: 'spec §2, P5, P7', registro: 'consumer',
    html: html([
      { field: 'a', title: 'A', type: 'Number', summary: 'min' },
      { field: 'b', title: 'B', type: 'Number', summary: 'max', 'summary-format': '{"decs":1,"prefix":"$"}' },
      { field: 'c', title: 'C', type: 'Text', summary: 'custom' },
      { field: 'd', title: 'D', type: 'Number', summary: 'sum' },
    ], [{ a: '-5', b: 3, c: 'x', d: '999999999999999999.99' }, { a: 2, b: '10.25', c: 'y', d: '0.01' }], {},
      { head: `<script>document.addEventListener('DOMContentLoaded', () => { const t = ET('t1'); t.SummaryFunction = (f, rows) => rows.length * 100; t.RefreshSummaries(); });</script>` }),
    pasos: [
      ['inicial', h => h.js(() => 0)],
      ['sin filas', h => h.js(() => { const t = ET('t1'); t.DataArray = []; t._printRows(); t.RefreshSummaries(); })],
    ],
  },
  {
    id: 'mascaras-patron-presets',
    titulo: 'mask de patrón (raw y formatted), tel, rfc con checksum incorrecto (MaskInvalid sin cancel) y upper',
    etiquetas: E, origen: 'spec §3', registro: 'consumer',
    html: html([
      { field: 'cuenta', title: 'Cuenta', mask: '9999-999-999' },
      { field: 'cta2', title: 'Cuenta 2', mask: '9999-999-999', 'mask-keep': 'formatted' },
      { field: 'tel', title: 'Tel', mask: 'tel' },
      { field: 'rfc', title: 'RFC', mask: 'rfc' },
      { field: 'nom', title: 'Nombre', mask: 'upper' },
    ], [{ cuenta: '5512345678', cta2: '', tel: '', rfc: '', nom: '' }]),
    pasos: [
      ['teclear 55a1 en cuenta (literales y rechazo)', teclear(0, 0, '55a1')],
      ['Enter (incompleto: MaskInvalid, se acepta)', h => h.tecla('Enter')],
      ['cuenta 2 con literales', async h => { await teclear(0, 1, '5512345678')(h); await h.tecla('Enter'); }],
      ['tel', async h => { await teclear(0, 2, '9611234567')(h); await h.tecla('Enter'); }],
      ['rfc en minúsculas con dígito incorrecto', async h => { await teclear(0, 3, 'eku9003173c8')(h); await h.tecla('Enter'); }],
      ['upper', async h => { await teclear(0, 4, 'ficticio')(h); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'calc-locale-valuetype',
    titulo: 'calc (=120*1.16, error con cancel), Number con locale es-CO (editor propio, $1.234,50) y value-type="number" con ValueTypeFallback',
    etiquetas: E, origen: 'spec §3, R7, R9, C12, C16', registro: 'consumer',
    html: html([
      { field: 'p', title: 'Precio', type: 'Number', calc: 'true', format: 'true', decs: '2' },
      { field: 'co', title: 'Importe CO', type: 'Number', locale: 'es-CO', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' },
      { field: 'v', title: 'V', type: 'Number', 'value-type': 'number' },
    ], [{ p: 0, co: 1234.5, v: 1 }]),
    pasos: [
      ['calc =120*1.16', async h => { await teclear(0, 0, '=120*1.16')(h); await h.tecla('Enter'); }],
      ['calc =5/0 (sigue en edición)', async h => { await teclear(0, 0, '=5/0')(h); await h.tecla('Enter'); }],
      ['Escape', h => h.tecla('Escape')],
      ['es-CO: F2 abre con 1234,5', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('F2'); }],
      ['es-CO: teclear 1.234,50 y Enter', async h => { await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('1.234,50'); await h.tecla('Enter'); }],
      ['value-type: 12.5 (Number)', async h => { await teclear(0, 2, '12.5')(h); await h.tecla('Enter'); }],
      ['value-type: 1.10 (texto y ValueTypeFallback)', async h => { await teclear(0, 2, '1.10')(h); await h.tecla('Enter'); }],
    ],
  },
  {
    id: 'percent-fechas',
    titulo: 'percent en lang="es-CO" (10,50 / 10.5), Date con locale (editor propio, ISO), date-display y datetime-seconds',
    etiquetas: E, origen: 'spec §3, R7, R9', registro: 'consumer',
    html: html([
      { field: 'pct', title: '%', mask: 'percent' },
      { field: 'f', title: 'Fecha', type: 'Date', locale: 'es-CO' },
      { field: 'g', title: 'Fecha visible', type: 'Date', 'date-display': 'locale' },
      { field: 'h', title: 'Fecha y hora', type: 'DateTime', 'datetime-seconds': 'true' },
    ], [{ pct: '', f: '2026-02-01', g: '2026-02-01', h: '2026-02-01T10:30:15' }], { lang: 'es-CO' }),
    pasos: [
      ['percent 10,5', async h => { await teclear(0, 0, '10,5')(h); await h.tecla('Enter'); }],
      ['Date es-CO: F2 abre con 01/02/2026', async h => { await h.clicCelda('t1', 0, 1); await h.tecla('F2'); }],
      ['Date es-CO: teclear 25/12/2026 y Enter', async h => { await h.js(() => { ETs('t1').querySelector('#__table_input').value = ''; }); await h.escribir('25/12/2026'); await h.tecla('Enter'); }],
      ['date-display: F2 y Enter sin cambiar (C17)', async h => { await h.clicCelda('t1', 0, 2); await h.tecla('F2'); await h.tecla('Enter'); }],
      ['datetime-seconds: F2 (step=1)', async h => { await h.clicCelda('t1', 0, 3); await h.tecla('F2'); }],
      ['datetime-seconds: 10:45:00 y Enter', async h => { await h.js(() => { ETs('t1').querySelector('#__table_input').value = '2026-03-01T10:45'; }); await h.tecla('Enter'); }],
    ],
  },
];
