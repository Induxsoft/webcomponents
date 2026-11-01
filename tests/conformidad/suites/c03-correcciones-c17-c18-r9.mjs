// Correcciones C17 (confirmar sin cambiar no toca el valor) y C18 (el editor nativo de fecha recibe ISO):
// deben FALLAR hoy. R9 (cadenas canónicas y fechas ISO en los editores propios) va en una suite v2 aparte.
import { tabla } from '../lib/fixtures.mjs';
import { registro, editar, valorInput } from '../lib/v2.mjs';

const P = [];
const t = (id, titulo, spec, fn, x = {}) => P.push({ id: 'c17-' + id, titulo, spec: [].concat(spec), fn, ...x });
const COL = (type, x = {}) => [{ field: 'v', type, title: 'V', ...x }, { field: 'otro', title: 'Otro' }];
const pag = (type, valor, x = {}, o = {}) => ({ body: tabla({ cols: COL(type, x), data: [{ v: valor, otro: 'x' }] }), script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.backup();window.ev=[];t.Events.fieldupdated=(e)=>window.ev.push('fieldupdated');t.Events.isdirtychanged=()=>window.ev.push('isdirtychanged');});", ...o });
async function entrarYConfirmar(c) { await c.foco('t1', 0, 0); await c.tecla('F2'); await c.esperar(20); await c.tecla('Enter'); await c.esperar(20); }

for (const [tipo, valor] of [['Date', '2026-02-01 10:30:00'], ['Date', '01/02/2026'], ['Date', '2026-02-01T00:00:00.000Z'], ['DateTime', '2026-02-01 10:30:00'], ['DateTime', '2026-02-01T10:30:15']]) {
  t(`${tipo}-${valor}`, `C17: ${tipo} con "${valor}": entrar, F2 y Enter sin cambiar no toca DataArray`, '§1-C17', async (c) => {
    await c.abrir(pag(tipo, valor));
    await entrarYConfirmar(c);
    const d = await c.datos();
    c.igual(d[0].v, valor);
    c.igual(await c.ev(() => window.ev), [], 'sin FieldUpdated ni IsDirtyChanged');
  });
}
t('num', 'C17: Number con un número (tipo number): confirmar sin cambiar conserva el valor y el tipo, sin eventos', '§1-C17', async (c) => {
  await c.abrir(pag('Number', 12.5));
  await entrarYConfirmar(c);
  const v = (await c.datos())[0].v;
  c.igual([typeof v, v], ['number', 12.5]);
  c.igual(await c.ev(() => window.ev), []);
});
t('num-fmt', 'C17: Number con format="true": confirmar sin cambiar no reescribe con el valor redondeado', '§1-C17', async (c) => {
  await c.abrir(pag('Number', 1234.5678, { format: 'true', decs: '2' }));
  await entrarYConfirmar(c);
  c.igual((await c.datos())[0].v, 1234.5678);
});
t('txt', 'C17: Text: confirmar sin cambiar no dispara FieldUpdated ni IsDirtyChanged', '§1-C17', async (c) => {
  await c.abrir(pag('Text', 'abc'));
  await entrarYConfirmar(c);
  c.igual((await c.datos())[0].v, 'abc');
  c.igual(await c.ev(() => window.ev), []);
});
t('txt-cambio', 'C17 (no regresión): un cambio real sí se guarda y dispara FieldUpdated', '§1-C17', async (c) => {
  await c.abrir(pag('Text', 'abc'));
  await editar(c, 't1', 0, 0, 'abd');
  c.igual((await c.datos())[0].v, 'abd');
  c.contiene(await c.ev(() => window.ev), 'fieldupdated');
}, { nota: 'pasa hoy' });
t('C18-date-espacio', 'C18: Date "2026-02-01 10:30:00" abre el editor con 2026-02-01', '§1-C18', async (c) => {
  await c.abrir(pag('Date', '2026-02-01 10:30:00'));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.igual(await valorInput(c), '2026-02-01');
});
t('C18-date-Z', 'C18: Date "2026-02-01T00:00:00.000Z" toma la fecha tal como viene (sin convertir zona)', '§1-C18', async (c) => {
  await c.abrir({ ...pag('Date', '2026-02-01T00:00:00.000Z'), contexto: { timezoneId: 'America/Mexico_City' } });
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.igual(await valorInput(c), '2026-02-01');
});
t('C18-dt-espacio', 'C18: DateTime "2026-02-01 10:30:00" abre el editor con 2026-02-01T10:30', '§1-C18', async (c) => {
  await c.abrir(pag('DateTime', '2026-02-01 10:30:00'));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.ok(/^2026-02-01T10:30(:00)?$/.test(await valorInput(c)), 'valor del editor: ' + await valorInput(c));
});
t('C18-dt-Z', 'C18: DateTime con Z se convierte a hora local (México, UTC-6)', '§1-C18', async (c) => {
  await c.abrir({ ...pag('DateTime', '2026-02-01T16:30:00Z'), contexto: { timezoneId: 'America/Mexico_City' } });
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.ok(/^2026-02-01T10:30(:00)?$/.test(await valorInput(c)), 'valor del editor: ' + await valorInput(c));
});
t('C18-dt-offset', 'C18: DateTime con offset -05:00 se convierte a hora local', '§1-C18', async (c) => {
  await c.abrir({ ...pag('DateTime', '2026-02-01T11:30:00-05:00'), contexto: { timezoneId: 'America/Mexico_City' } });
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.ok(/^2026-02-01T10:30(:00)?$/.test(await valorInput(c)), 'valor del editor: ' + await valorInput(c));
});
t('C18-ambigua', 'C18: "01/02/2026" abre el editor vacío y por C17 no se pierde al salir sin cambios', ['§1-C18'], async (c) => {
  await c.abrir(pag('Date', '01/02/2026'));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.igual(await valorInput(c), '');
  await c.tecla('Enter');
  c.igual((await c.datos())[0].v, '01/02/2026');
});

// ---------- R9 (v2: editores propios) ----------
const { P: P9, t: r } = registro('r9');
r('calc-05', 'R9: calc "=1/2" entrega "0.5" (cadena canónica)', ['§0-R9', '§3-h'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'n', type: 'Number', calc: 'true', title: 'N' }], data: [{ n: '' }] }) });
  await editar(c, 't1', 0, 0, '=1/2');
  c.igual((await c.datos())[0].n, '0.5');
}, { requiere: ['calc'] });
r('calc-exp', 'R9: calc sin exponente: "=1/10000000" → "0.0000001"', ['§0-R9'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'n', type: 'Number', calc: 'true', title: 'N' }], data: [{ n: '' }] }) });
  await editar(c, 't1', 0, 0, '=1/10000000');
  c.igual((await c.datos())[0].n, '0.0000001');
}, { requiere: ['calc'] });
r('calc-ceros', 'R9: calc quita los ceros finales que deja el cálculo: "=1.10*1" → "1.1"', ['§0-R9'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'n', type: 'Number', calc: 'true', title: 'N' }], data: [{ n: '' }] }) });
  await editar(c, 't1', 0, 0, '=1.10*1');
  c.igual((await c.datos())[0].n, '1.1');
}, { requiere: ['calc'] });
for (const [teclea, esperado] of [['1.234,50', '1234.50'], [',5', '0.5'], ['007', '7'], ['-5', '-5'], ['1,10', '1.10']]) {
  r('loc-' + teclea, `R9: editor propio por locale es-CO: "${teclea}" → "${esperado}" (canónico, conserva ceros finales)`, ['§0-R9', '§0-R7'], async (c) => {
    await c.abrir({ body: tabla({ a: { locale: 'es-CO' }, cols: [{ field: 'n', type: 'Number', title: 'N' }], data: [{ n: '' }] }) });
    await editar(c, 't1', 0, 0, teclea);
    c.igual((await c.datos())[0].n, esperado);
  });
}
r('loc-nonum', 'R9: en el editor propio, un texto que no es número no se confirma', ['§0-R9'], async (c) => {
  await c.abrir({ body: tabla({ a: { locale: 'es-CO' }, cols: [{ field: 'n', type: 'Number', title: 'N' }], data: [{ n: '1' }] }) });
  await editar(c, 't1', 0, 0, 'abc');
  c.igual([await c.ev(() => __ct.t('t1').Editing), (await c.datos())[0].n], [true, '1']);
});
r('nativo', 'R9: el control nativo sigue entregando la cadena de HTML ("12.50" se queda así)', ['§0-R9', '§0-R8'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'n', type: 'Number', title: 'N' }], data: [{ n: '' }] }) });
  await editar(c, 't1', 0, 0, '12.50');
  c.igual((await c.datos())[0].n, '12.50');
}, { nota: 'pasa hoy' });
r('formato-no-llega', 'R9: con format y locale la presentación no llega a DataArray', ['§0-R9', '§1-C16'], async (c) => {
  await c.abrir({ body: tabla({ a: { locale: 'es-CO' }, cols: [{ field: 'n', type: 'Number', title: 'N', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' }], data: [{ n: '' }] }) });
  await editar(c, 't1', 0, 0, '1234,5');
  c.igual((await c.datos())[0].n, '1234.5');
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '$1.234,50');
});
r('dt-seg', 'R9: datetime-seconds="true" pone step="1" y guarda YYYY-MM-DDTHH:mm:ss', ['§0-R9'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'f', type: 'DateTime', 'datetime-seconds': 'true', title: 'F' }], data: [{ f: '' }] }) });
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('#__table_input').getAttribute('step')), '1');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = '2026-02-01T10:30:15'; });
  await c.tecla('Enter');
  c.igual((await c.datos())[0].f, '2026-02-01T10:30:15');
});
r('date-loc', 'R9: Date con locale es-CO usa editor propio: teclear 01/02/2026 guarda 2026-02-01', ['§0-R9', '§0-R7'], async (c) => {
  await c.abrir({ body: tabla({ a: { locale: 'es-CO' }, cols: [{ field: 'f', type: 'Date', title: 'F' }], data: [{ f: '' }] }) });
  await editar(c, 't1', 0, 0, '01/02/2026');
  c.igual((await c.datos())[0].f, '2026-02-01');
});
r('date-display', 'R9: date-display="locale" muestra la fecha con formato del locale y DataArray queda ISO', ['§0-R9'], async (c) => {
  await c.abrir({ body: tabla({ a: { locale: 'es-MX' }, cols: [{ field: 'f', type: 'Date', title: 'F', 'date-display': 'locale' }], data: [{ f: '2026-02-01' }] }) });
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '01/02/2026');
  c.igual((await c.datos())[0].f, '2026-02-01');
});
r('date-crudo', 'R9/R8: sin date-display la celda muestra el valor crudo (pasa hoy)', ['§0-R9', '§0-R8'], async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'f', type: 'Date', title: 'F' }], data: [{ f: '2026-02-01 10:30:00' }] }) });
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '2026-02-01 10:30:00');
});
r('carga', 'R9: lo que carga el programador se deja tal cual hasta que el usuario edita', ['§0-R9'], async (c) => {
  await c.abrir({ body: tabla({ a: { locale: 'es-CO' }, cols: [{ field: 'n', type: 'Number', title: 'N', format: 'true', decs: '2' }, { field: 's', type: 'Number', title: 'S' }], data: [{ n: 1e-7, s: '1,5' }] }) });
  const d = (await c.datos())[0];
  c.igual([d.n, d.s], [1e-7, '1,5']);
});

export default [{ nombre: 'correcciones-C17-C18', grupo: 'correcciones', pruebas: P }, { nombre: 'v2-R9-canonico', grupo: 'v2', pruebas: P9 }];
