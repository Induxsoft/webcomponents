// Correcciones §1.1 (C12-C16): tipo de valor y control nativo de Number.
// C12 y C16 por omisión conservan lo de hoy (R8): esas pruebas deben PASAR contra 0ed1824.
// C13 y C15 corrigen valores que hoy se guardan mal: deben FALLAR hoy.
// C14 quedó descartada (comportamiento del navegador): no se prueba.
import { tabla } from '../lib/fixtures.mjs';
import { editar } from '../lib/v2.mjs';

const P = [];
const t = (id, titulo, spec, fn, x = {}) => P.push({ id: 'num-' + id, titulo, spec: [spec], fn, ...x });
const NUM = (x = {}) => [{ field: 'n', type: 'Number', title: 'N', ...x }, { field: 'b', title: 'B' }];
const pag = (cols, data = [{ n: 1, b: 'x' }], a = {}, o = {}) => ({ body: tabla({ a, cols, data }), ...o });

t('C12a', 'por omisión lo editado en Number queda como texto (R8, pasa hoy)', '§1-C12', async (c) => {
  await c.abrir(pag(NUM()));
  await editar(c, 't1', 0, 0, '12.5');
  const v = (await c.datos())[0].n;
  c.igual([typeof v, v], ['string', '12.5']);
});
t('C12b', 'value-type="number": se guarda Number', '§1-C12', async (c) => {
  await c.abrir(pag(NUM({ 'value-type': 'number' })));
  await editar(c, 't1', 0, 0, '12.5');
  const v = (await c.datos())[0].n;
  c.igual([typeof v, v], ['number', 12.5]);
});
t('C12c', 'value-type="number" con "1.10": se perdería el cero final → se guarda texto y ValueTypeFallback {row, field, text}', '§1-C12', async (c) => {
  await c.abrir(pag(NUM({ 'value-type': 'number' }), undefined, {}, { script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.vf=[];t.addEventListener('ValueTypeFallback',(e)=>window.vf.push({row:e.row,field:e.field,text:e.text}));});" }));
  await editar(c, 't1', 0, 0, '1.10');
  c.igual((await c.datos())[0].n, '1.10');
  c.igual(await c.ev(() => window.vf), [{ row: 0, field: 'n', text: '1.10' }]);
});
t('C12d', 'value-type="number" con 123456789012.123456 (más cifras de las que guarda un double) → texto', '§1-C12', async (c) => {
  await c.abrir(pag(NUM({ 'value-type': 'number' })));
  await editar(c, 't1', 0, 0, '123456789012.123456');
  c.igual((await c.datos())[0].n, '123456789012.123456');
});
t('C12e', 'value-type="number": una celda vacía es siempre ""', '§1-C12', async (c) => {
  await c.abrir(pag(NUM({ 'value-type': 'number' })));
  await c.foco('t1', 0, 0); await c.tecla('Delete'); await c.tecla('Enter');
  c.igual((await c.datos())[0].n, '');
});
t('C12f', 'la propiedad de columna valueType refleja value-type', '§1-C12', async (c) => {
  await c.abrir(pag(NUM({ 'value-type': 'number' })));
  c.igual(await c.ev(() => __ct.t('t1').Columns[0].valueType), 'number');
});
t('C12g', 'ValueTypeFallback está en EdiTable.Const.Events', '§1-C12', async (c) => {
  await c.abrir(pag(NUM()));
  c.igual(await c.ev(() => __ct.t('t1').EdiTable.Const.Events.ValueTypeFallback), 'valuetypefallback');
});
t('C13a', 'el editor nativo de Number lleva step="any"', '§1-C13', async (c) => {
  await c.abrir(pag(NUM()));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('#__table_input').getAttribute('step')), 'any');
});
t('C13b', 'un decimal no deja el control como :invalid', '§1-C13', async (c) => {
  await c.abrir(pag(NUM()));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = ''; });
  await c.page.keyboard.type('12.5');
  c.igual(await c.ev(() => { const i = __ct.sr('t1').querySelector('#__table_input'); return [i.validity.valid, i.matches(':invalid')]; }), [true, false]);
});
t('C15a', 'badInput no se confirma: la celda sigue en edición y DataArray no cambia', '§1-C15', async (c) => {
  await c.abrir(pag(NUM()));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = ''; });
  await c.page.keyboard.type('1-2');
  const bad = await c.ev(() => __ct.sr('t1').querySelector('#__table_input').validity.badInput);
  c.ok(bad, 'precondición: el control nativo queda en badInput');
  await c.tecla('Enter');
  c.igual(await c.ev(() => [__ct.t('t1').Editing, !!__ct.sr('t1').querySelector('#__table_input')]), [true, true]);
  c.igual((await c.datos())[0].n, 1);
});
t('C15b', 'badInput dispara MaskInvalid con reason "badInput"', '§1-C15', async (c) => {
  await c.abrir(pag(NUM(), undefined, {}, { script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.mi=[];t.addEventListener('MaskInvalid',(e)=>window.mi.push(e.reason));});" }));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = ''; });
  await c.page.keyboard.type('1-2'); await c.tecla('Enter');
  c.igual(await c.ev(() => window.mi), ['badInput']);
});
const FMT = (x = {}) => [{ field: 'n', type: 'Number', title: 'N', format: 'true', decs: '2', prefix: '$', thousandssep: 'true', ...x }];
t('C16a', 'sin locale ni lang con región la presentación es la de hoy ($1,234.50), con navegador en es-ES (pasa hoy)', '§1-C16', async (c) => {
  await c.abrir({ ...pag(FMT(), [{ n: 1234.5 }]), lang: 'es', contexto: { locale: 'es-ES' } });
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '$1,234.50');
});
t('C16b', 'locale="es-CO" en la tabla: $1.234,50', '§1-C16', async (c) => {
  await c.abrir(pag(FMT(), [{ n: 1234.5 }], { locale: 'es-CO' }));
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '$1.234,50');
});
t('C16c', 'lang="es-CO" heredado de un ancestro: $1.234,50', '§1-C16', async (c) => {
  await c.abrir({ body: `<div lang="es-CO">${tabla({ cols: FMT(), data: [{ n: 1234.5 }] })}</div>`, lang: 'es-MX' });
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '$1.234,50');
});
t('C16d', 'locale en la columna aplica solo a esa columna', '§1-C16', async (c) => {
  await c.abrir(pag([...FMT({ locale: 'de-DE' }), { field: 'm', type: 'Number', title: 'M', format: 'true', decs: '2', thousandssep: 'true' }], [{ n: 1234.5, m: 1234.5 }], {}, { lang: '' }));
  c.igual(await c.ev(() => [__ct.texto('t1', 0, 0), __ct.texto('t1', 0, 1)]), ['$1.234,50', '1,234.50']);
});
t('C16e', 'un NumFormat asignado por el programador siempre gana sobre el locale', '§1-C16', async (c) => {
  await c.abrir(pag(FMT(), [{ n: 1234.5 }], { locale: 'es-CO' }, { script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.NumFormat={default_decimals:'|',thousands:'_',decimals:'|'};t._printRows();});" }));
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '$1_234|50');
});
t('C16f', 'con lang="es-MX" (región) el formato es el mismo de hoy', '§1-C16', async (c) => {
  await c.abrir({ ...pag(FMT(), [{ n: 1234567.891 }]), lang: 'es-MX' });
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '$1,234,567.89');
});
t('C16g', 'con locale es-CO, GetTdValue sigue devolviendo el número sin formato (lo lee UpdateData)', '§1-C16', async (c) => {
  await c.abrir(pag(FMT(), [{ n: 1234.5 }], { locale: 'es-CO' }));
  await c.ev(() => __ct.t('t1').UpdateData());
  c.igual(Number((await c.datos())[0].n), 1234.5);
});

export default { nombre: 'correcciones-C12-C16', grupo: 'correcciones', pruebas: P };
