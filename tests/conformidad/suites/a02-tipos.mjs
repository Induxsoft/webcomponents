// Actual: cada tipo de columna y el formato numérico. Contrato §1.5, §1.7, §2.2.
import { tabla } from '../lib/fixtures.mjs';

const COLS = [
  { field: 'ne', type: 'NoEditable', title: 'NoEditable' },
  { field: 'tx', type: 'Text', title: 'Text', maxlength: '5' },
  { field: 'nu', type: 'Number', title: 'Number', textalign: 'end' },
  { field: 'se', type: 'Select', title: 'Select', options: '{"PZA":"PIEZA","PAQ":"PAQUETE","CAJA":"CAJA"}' },
  { field: 'da', type: 'Date', title: 'Date' },
  { field: 'dt', type: 'DateTime', title: 'DateTime' },
  { field: 'ch', type: 'Check', title: 'Check' },
  { field: 'cu', type: 'Custom', title: 'Custom' },
  { field: 'me', type: 'Memo', title: 'Memo' },
  { field: 'ba', type: 'Badges', title: 'Badges' },
];
const DATA = [{ ne: 'fijo', tx: 'abc', nu: 12, se: 'PAQ', da: '2025-01-01', dt: '2025-01-03T12:00', ch: 'Sí', cu: 'c', me: 'línea' }];
const pag = (extra = {}) => ({ body: tabla({ cols: COLS, data: DATA, ...extra }) });

async function editor(c, col) {
  await c.foco('t1', 0, col);
  await c.tecla('Enter');
  return c.ev(() => {
    const el = __ct.t('t1'); const i = el.shadowRoot.querySelector('#__table_input');
    return { editing: el.Editing, tag: i ? i.tagName.toLowerCase() : null, type: i ? i.getAttribute('type') : null, cls: i ? i.className : null, value: i ? (i.type === 'checkbox' ? i.checked : i.value) : null, maxlength: i ? i.getAttribute('maxlength') : null, opciones: i && i.tagName === 'SELECT' ? Array.from(i.options).map(o => [o.value, o.textContent]) : null };
  });
}

const P = [];
const t = (id, titulo, fn, x = {}) => P.push({ id: 'tip-' + id, titulo, spec: ['A.tipos'], fn, ...x });

t('01', 'Text: input type=text con el valor y maxlength', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 1);
  c.igual([r.editing, r.tag, r.type, r.cls, r.value, r.maxlength], [true, 'input', 'text', 'Editable-Input-Text', 'abc', '5']);
});
t('02', 'Number: input type=number', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 2);
  c.igual([r.tag, r.type, r.cls, r.value], ['input', 'number', 'Editable-Input-Number', '12']);
});
t('03', 'Select: select con las opciones de options y el valor actual', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 3);
  c.igual([r.tag, r.cls, r.value], ['select', 'Editable-Input-Select', 'PAQ']);
  c.igual(r.opciones, [['PZA', 'PIEZA'], ['PAQ', 'PAQUETE'], ['CAJA', 'CAJA']]);
});
t('04', 'Date: input type=date', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 4);
  c.igual([r.type, r.cls, r.value], ['date', 'Editable-Input-Date', '2025-01-01']);
});
t('05', 'DateTime: input type=datetime-local', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 5);
  c.igual([r.type, r.cls, r.value], ['datetime-local', 'Editable-Input-DateTime', '2025-01-03T12:00']);
});
t('06', 'Check: checkbox marcado con "Sí"; al confirmar escribe "Sí"/"No"', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 6);
  c.igual([r.type, r.cls, r.value], ['checkbox', 'Editable-Input-Check', true]);
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').checked = false; });
  await c.ev(() => { const e = __ct.t('t1'); e.ConfirmEdit(e.CurrentTd()); });
  c.igual((await c.datos())[0].ch, 'No');
  c.igual(await c.ev(() => __ct.t('t1').Columns[6].Converts === __ct.t('t1').EdiTable.Converts.Boolean), true, 'Converts asignado');
});
t('07', 'Converts.Boolean.FromString reconoce sí/si/s/y/yes/ok/1/t/on/true/cierto', async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => { const B = __ct.t('t1').EdiTable.Converts.Boolean; return [['sí', 'Si', 's', 'y', 'YES', 'ok', '1', 't', 'on', 'true', 'cierto'].every(v => B.FromString(v)), B.FromString('no'), B.ToString(true), B.ToString(false)]; });
  c.igual(r, [true, false, 'Sí', 'No']);
});
t('08', 'Memo: textarea', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 8);
  c.igual([r.tag, r.cls, r.value], ['textarea', 'Editable-Input-Memo', 'línea']);
});
t('09', 'Custom: dispara StartEdition y no crea input', async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.grabar('t1', ['startedition', 'inputcreated']));
  const r = await editor(c, 7);
  c.igual([r.editing, r.tag], [false, null]);
  c.igual(await c.ev(() => __ct.nombresLog()), ['startedition']);
});
t('10', 'NoEditable: Enter no edita', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 0);
  c.igual([r.editing, r.tag], [false, null]);
});
t('11', 'Badges: no edita y no lee valor de DataArray', async (c) => {
  await c.abrir(pag());
  const r = await editor(c, 9);
  c.igual([r.editing, r.tag], [false, null]);
});
t('12', 'type desconocido o sin type se edita como Text (ColumnsDefaultType)', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'a', title: 'A' }, { field: 'b', type: 'text', title: 'B' }], data: [{ a: '1', b: '2' }] }) });
  const r1 = await editor(c, 0);
  c.igual([r1.tag, r1.type], ['input', 'text']);
  c.igual(await c.ev(() => __ct.t('t1').Columns[1].type), undefined, 'type en minúsculas no se resuelve');
});
t('13', 'Select: al confirmar guarda la clave elegida en DataArray', async (c) => {
  await c.abrir(pag());
  await editor(c, 3);
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'CAJA'; const e = __ct.t('t1'); e.ConfirmEdit(e.CurrentTd()); });
  c.igual((await c.datos())[0].se, 'CAJA');
});

// ---------- formato ----------
const F = [
  { field: 'imp', type: 'Number', format: 'true', decs: '2', prefix: '$ ', sufix: ' MXN', thousandssep: 'true', title: 'Importe' },
  { field: 'ent', type: 'NoEditable', format: 'true', decs: '0', thousandssep: 'true', title: 'Entero' },
  { field: 'sin', type: 'Number', title: 'Sin formato' },
];
t('20', 'format="true": prefijo, sufijo, miles y decimales', async (c) => {
  await c.abrir({ body: tabla({ cols: F, data: [{ imp: 123456.789, ent: 1234567, sin: 1234.5 }] }) });
  c.igual(await c.ev(() => [0, 1, 2].map(i => __ct.texto('t1', 0, i))), ['$ 123,456.79 MXN', '1,234,567', '1234.5']);
});
t('21', 'GetTdValue quita el formato; DataArray conserva el número', async (c) => {
  await c.abrir({ body: tabla({ cols: F, data: [{ imp: 1500, ent: 2, sin: 3 }] }) });
  c.igual(await c.ev(() => { const e = __ct.t('t1'); return e.GetTdValue(__ct.td('t1', 0, 0)); }), '1500.00');
  c.igual((await c.datos())[0].imp, 1500);
});
t('22', 'editar una columna con formato: el input recibe el número sin formato y la celda vuelve con formato', async (c) => {
  await c.abrir({ body: tabla({ cols: F, data: [{ imp: 1500, ent: 2, sin: 3 }] }) });
  await c.foco('t1', 0, 0);
  await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.t('t1').shadowRoot.querySelector('#__table_input').value), '1500.00');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = '2500.5'; });
  await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '$ 2,500.50 MXN');
  c.igual((await c.datos())[0].imp, '2500.5', 'el valor editado queda como texto');
});
t('23', 'textalign alinea el contenido de la celda', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'a', textalign: 'end', title: 'A' }], data: [{ a: 1 }] }) });
  c.igual(await c.ev(() => { const cc = __ct.td('t1', 0, 0).querySelector('.cell-content'); return [cc.style.textAlign, cc.style.justifyContent]; }), ['end', 'end']);
});
t('24', 'valores vacíos o nulos se dibujan como cadena vacía', async (c) => {
  await c.abrir({ body: tabla({ cols: F, data: [{ imp: null }] }) });
  c.igual(await c.ev(() => [0, 1, 2].map(i => __ct.texto('t1', 0, i))), ['', '', '']);
});

export default { nombre: 'actual-tipos-y-formato', grupo: 'actual', pruebas: P };
