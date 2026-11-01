// Utilidades para las suites v2.
export const FEATURES = ['summary', 'mask', 'calc', 'multiselect', 'clipboard', 'export', 'fixed', 'chooser', 'reorder', 'layout', 'virtual', 'group'];

/** Crea un registrador de pruebas para una suite. */
export function registro(prefijo, base = {}) {
  const P = [];
  const t = (id, titulo, spec, fn, x = {}) => P.push({ id: `${prefijo}-${id}`, titulo, spec: Array.isArray(spec) ? spec : [spec], fn, ...base, ...x, requiere: [...(base.requiere ?? []), ...(x.requiere ?? [])] });
  return { P, t };
}

/** Edita la celda (r,c) tecleando texto y confirma con Enter. */
export async function editar(c, id, r, col, texto, { confirmar = 'Enter' } = {}) {
  await c.foco(id, r, col);
  await c.tecla('F2');
  await c.ev(({ id }) => { const i = __ct.sr(id).querySelector('#__table_input'); if (i) { i.value = ''; } }, { id });
  await c.page.keyboard.type(String(texto), { delay: 5 });
  await c.esperar(20);
  if (confirmar) await c.tecla(confirmar);
}

/** Valor que se ve en el input de edición. */
export const valorInput = (c, id = 't1') => c.ev((id) => { const i = __ct.sr(id).querySelector('#__table_input'); return i ? i.value : null; }, id);

/** Llama un método de la tabla en la página y devuelve el resultado serializable. */
export const m = (c, id, metodo, ...args) => c.ev(({ id, metodo, args }) => {
  const t = document.getElementById(id);
  if (typeof t[metodo] !== 'function') throw new Error(`EditTable.${metodo} no existe`);
  const r = t[metodo](...args);
  return r === undefined ? '$undefined' : JSON.parse(JSON.stringify(r));
}, { id, metodo, args });

/** Campos de las columnas en orden (Columns). */
export const campos = (c, id = 't1') => c.ev((id) => document.getElementById(id).Columns.map(x => x.field), id);
/** field de cada th de datos del encabezado, en orden del DOM (sin columnas del sistema). */
export const camposDom = (c, id = 't1') => c.ev((id) => Array.from(__ct.sr(id).querySelectorAll('thead > tr > th')).filter(th => !th.classList.contains('et-sel-col')).map(th => th.getAttribute('field')), id);
/** Texto de las celdas de datos de una fila (sin columnas del sistema). */
export const filaTxt = (c, id, r) => c.ev(({ id, r }) => { const tr = __ct.sr(id).querySelectorAll('tbody > tr:not(.et-group-row):not(.et-spacer)')[r]; return tr ? Array.from(tr.cells).filter(td => !td.classList.contains('et-sel-col')).map(td => { const cc = td.querySelector('div[iscellcontent]'); return (cc || td).textContent; }) : null; }, { id, r });
/** Filas de datos dibujadas (excluye grupo y relleno). */
export const filasDatos = (c, id = 't1') => c.ev((id) => __ct.sr(id).querySelectorAll('tbody > tr:not(.et-group-row):not(.et-spacer)').length, id);

/** Exige que exista el método (falla limpia si no). */
export async function exigir(c, id, ...metodos) {
  const falt = await c.ev(({ id, metodos }) => metodos.filter(n => typeof document.getElementById(id)[n] !== 'function'), { id, metodos });
  if (falt.length) c.ok(false, `no existen los métodos: ${falt.join(', ')}`);
}

/** Simula un arrastre HTML5 entre dos elementos del shadow (dragstart/dragenter/dragover/drop/dragend con el mismo DataTransfer). */
export const arrastrar = (c, id, origenSel, destinoSel, { dx = 0.25 } = {}) => c.ev(({ id, origenSel, destinoSel, dx }) => {
  const s = __ct.sr(id);
  const q = (sel) => (typeof sel === 'string' ? s.querySelector(sel) : null);
  const a = q(origenSel), b = q(destinoSel);
  if (!a || !b) throw new Error('arrastrar: no se encontró ' + (!a ? origenSel : destinoSel));
  const dt = new DataTransfer();
  const rb = b.getBoundingClientRect();
  const x = rb.left + rb.width * dx, y = rb.top + rb.height / 2;
  const ev = (el, tipo) => el.dispatchEvent(new DragEvent(tipo, { bubbles: true, cancelable: true, composed: true, dataTransfer: dt, clientX: x, clientY: y }));
  ev(a, 'dragstart'); ev(b, 'dragenter'); ev(b, 'dragover');
  const indicador = !!s.querySelector('.et-drop-indicator');
  ev(b, 'drop'); ev(a, 'dragend');
  return { indicador };
}, { id, origenSel, destinoSel, dx });
