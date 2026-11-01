// v2 §0: reglas generales R3-R6 (R1 en v13, R2 en las suites de cada función, R7 en v14).
import { tabla, paginaProductos, PRODUCTOS, COLS_PRODUCTOS } from '../lib/fixtures.mjs';
import { registro, FEATURES } from '../lib/v2.mjs';

const { P, t } = registro('gen');

const EVENTOS_NUEVOS = {
  SummaryCalculated: 'summary', MaskInvalid: 'mask', SelectionChanged: 'multiselect', BeforeCopy: 'clipboard',
  ColumnFixedChanged: 'fixed', ColumnVisibilityChanged: 'chooser', BeforeColumnMove: 'reorder', ColumnMoved: 'reorder',
  LayoutChanged: 'layout', LayoutRejected: 'layout', BeforeGroup: 'group', GroupChanged: 'group', GroupToggled: 'group',
};

t('01', 'EditTable.version es semver y empieza en 2.x', '§0-R6', async (c) => {
  await c.abrir(paginaProductos());
  const v = await c.ev(() => __ct.version());
  c.ok(typeof v === 'string' && /^2\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(v), `EditTable.version = ${v}`);
});
t('02', 'EditTable.features es un arreglo con las 12 funciones', '§0-R6', async (c) => {
  await c.abrir(paginaProductos());
  const f = await c.ev(() => (typeof EditTable !== 'undefined' && Array.isArray(EditTable.features)) ? EditTable.features : null);
  c.ok(Array.isArray(f), 'EditTable.features no existe');
  c.igual(FEATURES.filter(x => !f.includes(x)), [], 'faltan en features');
  // Ajuste (AJUSTES.md): exige las 12; mientras falten virtual y group (F5/F6) queda pendiente, no fallida.
}, { requiere: ['virtual', 'group'] });
for (const [ev, feat] of Object.entries(EVENTOS_NUEVOS)) {
  t('ev-' + ev, `R4: ${ev} está en EdiTable.Const.Events y addEventListener lo registra`, ['§0-R4'], async (c) => {
    await c.abrir(paginaProductos());
    const r = await c.ev((ev) => {
      const tb = __ct.t('t1'); const nombre = tb.EdiTable.Const.Events[ev];
      if (!nombre) return { nombre: null };
      const f = () => 1; tb.addEventListener(ev, f); const viaAdd = tb.Events[nombre] === f;
      const g = () => 2; tb.addEventListener(nombre, g); const viaMin = tb.Events[nombre] === g;
      return { nombre, viaAdd, viaMin };
    }, ev);
    c.igual(r, { nombre: ev.toLowerCase(), viaAdd: true, viaMin: true });
  }, { requiere: [feat] });
}
const ATR = [
  ['summary-scope', 'SummaryScope', 'selected', 'summary'], ['multi-select', 'MultiSelect', 'checkbox', 'multiselect'],
  ['column-chooser', 'ColumnChooser', 'true', 'chooser'], ['column-reorder', 'ColumnReorder', 'true', 'reorder'],
  ['design-auto-save', 'DesignAutoSave', 'false', 'layout'], ['design-key', 'DesignKey', 'mi-llave', 'layout'],
  ['design-auto-save-sort', 'DesignAutoSaveSort', 'true', 'layout'], ['virtual-rows', 'VirtualRows', 'true', 'virtual'],
  ['group-panel', 'GroupPanel', 'true', 'group'],
];
for (const [a, p, val, feat] of ATR) {
  t('r5-' + a, `R5: el atributo ${a} se refleja en la propiedad ${p}`, ['§0-R5'], async (c) => {
    await c.abrir(paginaProductos({ a: { [a]: val } }));
    const r = await c.ev((p) => { const v = __ct.t('t1')[p]; return v === undefined ? '$undefined' : v; }, p);
    const esperado = val === 'true' ? true : val === 'false' ? false : val;
    c.igual(r, esperado);
  }, { requiere: [feat] });
}
t('r5-omision', 'R5: valores por omisión de las propiedades nuevas', ['§0-R5', '§9-g', '§9-n', '§10-g'], async (c) => {
  await c.abrir(paginaProductos());
  const r = await c.ev(() => { const x = __ct.t('t1'); const g = (k) => (k in x ? x[k] : '$falta'); return { DesignAutoSave: g('DesignAutoSave'), DesignAutoSaveSort: g('DesignAutoSaveSort'), VirtualRows: g('VirtualRows'), VirtualOverscan: g('VirtualOverscan'), SummaryScope: g('SummaryScope') }; });
  c.igual(r.DesignAutoSave, true, 'DesignAutoSave'); c.igual(r.DesignAutoSaveSort, false, 'DesignAutoSaveSort');
  c.igual(r.VirtualRows, false, 'VirtualRows'); c.igual(r.VirtualOverscan, 10, 'VirtualOverscan');
}, { requiere: ['layout', 'virtual'] });
t('r3-01', 'R3: con multi-select="checkbox", Columns no incluye la columna de casillas y Columns[i] ↔ celda de datos i', ['§0-R3', '§4-i'], async (c) => {
  await c.abrir(paginaProductos({ a: { 'multi-select': 'checkbox' } }));
  const r = await c.ev(() => {
    const t = __ct.t('t1'); const tr = __ct.filas('t1')[0];
    const datos = Array.from(tr.cells).filter(td => !td.classList.contains('et-sel-col'));
    return { cols: t.Columns.map(x => x.field), sel: tr.cells[0].classList.contains('et-sel-col'), n: datos.length, def: datos.map(td => t.GetColumnDefOfTd(td)?.field ?? null) };
  });
  c.igual(r, { cols: ['codigo', 'nombre', 'cantidad', 'precio'], sel: true, n: 4, def: ['codigo', 'nombre', 'cantidad', 'precio'] });
}, { requiere: ['multiselect'] });
t('r3-02', 'R3: onTdPaint no recibe la columna del sistema (índices icol 0..n-1 de datos)', ['§0-R3', '§4-i'], async (c) => {
  await c.abrir({ body: tabla({ a: { 'multi-select': 'checkbox' }, cols: COLS_PRODUCTOS, data: PRODUCTOS.slice(0, 1) }) + "<script>window.n=[];document.getElementById('t1').onTdPaint=(td,i,c,f)=>window.n.push([c,f,td.classList.contains('et-sel-col')]);</script>" });
  const n = await c.ev(() => window.n);
  c.igual(n.map(x => x[1]), ['codigo', 'nombre', 'cantidad', 'precio']);
  c.ok(n.every(x => !x[2]), 'ninguna celda del sistema');
}, { requiere: ['multiselect'] });
t('r4-cancel', 'R4: los eventos Before* nuevos se cancelan con eventArgs.cancel (BeforeColumnMove)', ['§0-R4', '§8-d'], async (c) => {
  await c.abrir(paginaProductos({ a: { 'column-reorder': 'true' } }));
  const r = await c.ev(() => { const t = __ct.t('t1'); t.Events.beforecolumnmove = (e) => { e.cancel = true; }; t.MoveColumn('precio', 0); return t.Columns.map(x => x.field); });
  c.igual(r, ['codigo', 'nombre', 'cantidad', 'precio']);
}, { requiere: ['reorder'] });

export default { nombre: 'v2-general-R3-R6', grupo: 'v2', pruebas: P };
