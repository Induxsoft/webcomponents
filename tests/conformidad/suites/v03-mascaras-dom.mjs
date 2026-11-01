// v2 §3 en el componente (máscaras, calc, MaskInvalid) y R7 en EdiTable (Number, calc y percent con coma decimal).
import { tabla } from '../lib/fixtures.mjs';
import { registro, editar, valorInput } from '../lib/v2.mjs';

const { P, t } = registro('msk', { requiere: ['mask'] });
const pag = (cols, data, a = {}, script = '', envoltura = (h) => h) => ({ body: envoltura(tabla({ a, cols, data })), script });
const grabarMI = "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.mi=[];t.addEventListener('MaskInvalid',(e)=>{window.mi.push({k:Object.keys(e).sort(),row:e.row,field:e.field,value:e.value,reason:e.reason}); if(window.cancelar) e.cancel=true;});});";
const TEL = [{ field: 'tel', title: 'Teléfono', mask: '9999-999-999' }, { field: 'n', title: 'N' }];

async function teclear(c, r, col, txt) { await c.foco('t1', r, col); await c.tecla('F2'); await c.ev(() => { const i = __ct.sr('t1').querySelector('#__table_input'); i.value = ''; }); await c.page.keyboard.type(txt, { delay: 5 }); await c.esperar(20); }

t('01', 'mientras se teclea se insertan los literales y se rechaza lo que no corresponde', ['§3-e', '§3-b'], async (c) => {
  await c.abrir(pag(TEL, [{ tel: '', n: 1 }]));
  await teclear(c, 0, 0, '55a12x345678');
  const v = await valorInput(c);
  c.igual(v.replace(/_/g, ''), '5512-345-678');
});
t('02', 'al confirmar: la celda muestra literales y DataArray guarda raw (mask-keep por omisión)', ['§3-g', '§3-a'], async (c) => {
  await c.abrir(pag(TEL, [{ tel: '', n: 1 }]));
  await editar(c, 't1', 0, 0, '5512345678');
  c.igual([await c.ev(() => __ct.texto('t1', 0, 0)), (await c.datos())[0].tel], ['5512-345-678', '5512345678']);
});
t('03', 'mask-keep="formatted": DataArray guarda con literales', ['§3-g', '§3-a'], async (c) => {
  await c.abrir(pag([{ ...TEL[0], 'mask-keep': 'formatted' }, TEL[1]], [{ tel: '', n: 1 }]));
  await editar(c, 't1', 0, 0, '5512345678');
  c.igual((await c.datos())[0].tel, '5512-345-678');
});
t('04', 'datos iniciales sin literales se muestran con literales', '§3-g', async (c) => {
  await c.abrir(pag(TEL, [{ tel: '5512345678', n: 1 }]));
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '5512-345-678');
});
t('05', 'incompleto: MaskInvalid {row, field, value, reason, cancel}; sin cancel se acepta tal cual', ['§3-f'], async (c) => {
  await c.abrir(pag(TEL, [{ tel: '', n: 1 }], {}, grabarMI));
  await editar(c, 't1', 0, 0, '5512');
  const mi = await c.ev(() => window.mi);
  c.igual(mi.length, 1);
  c.igual([mi[0].row, mi[0].field, mi[0].reason], [0, 'tel', 'incomplete']);
  c.ok(['cancel', 'field', 'reason', 'row', 'value'].every(k => mi[0].k.includes(k)), 'claves: ' + mi[0].k);
  c.igual(await c.ev(() => __ct.t('t1').Editing), false);
  c.igual((await c.datos())[0].tel, '5512');
});
t('06', 'MaskInvalid con cancel: la celda sigue en edición y DataArray no cambia', ['§3-f'], async (c) => {
  await c.abrir(pag(TEL, [{ tel: '', n: 1 }], {}, grabarMI));
  await c.ev(() => { window.cancelar = true; });
  await editar(c, 't1', 0, 0, '5512');
  c.igual(await c.ev(() => [__ct.t('t1').Editing, !!__ct.sr('t1').querySelector('#__table_input')]), [true, true]);
  c.igual((await c.datos())[0].tel, '');
});
t('07', 'valor vacío no dispara MaskInvalid', ['§3-f', '§3-d'], async (c) => {
  await c.abrir(pag([{ field: 'rfc', title: 'RFC', mask: 'rfc' }], [{ rfc: 'XAXX010101000' }], {}, grabarMI));
  await c.foco('t1', 0, 0); await c.tecla('Delete'); await c.tecla('Enter');
  c.igual(await c.ev(() => window.mi.length), 0);
});
t('08', 'preset rfc: dígito verificador incorrecto → reason checksum; se escribe en mayúsculas', ['§3-d', '§3-f'], async (c) => {
  await c.abrir(pag([{ field: 'rfc', title: 'RFC', mask: 'rfc' }], [{ rfc: '' }], {}, grabarMI));
  await teclear(c, 0, 0, 'eku9003173c8');
  c.igual(await valorInput(c), 'EKU9003173C8');
  await c.tecla('Enter');
  c.igual(await c.ev(() => window.mi.map(x => x.reason)), ['checksum']);
});
t('09', 'preset tel: se muestra (999) 999-9999 y DataArray guarda 10 dígitos', '§3-d', async (c) => {
  await c.abrir(pag([{ field: 't', title: 'Tel', mask: 'tel' }], [{ t: '' }]));
  await editar(c, 't1', 0, 0, '5512345678');
  c.igual([await c.ev(() => __ct.texto('t1', 0, 0)), (await c.datos())[0].t], ['(551) 234-5678', '5512345678']);
});
t('10', 'preset upper', '§3-d', async (c) => {
  await c.abrir(pag([{ field: 'x', title: 'X', mask: 'upper' }], [{ x: '' }]));
  await editar(c, 't1', 0, 0, 'abc');
  c.igual((await c.datos())[0].x, 'ABC');
});
t('11', 'mask-placeholder por omisión "_" en el input', '§3-a', async (c) => {
  await c.abrir(pag([{ field: 't', title: 'Tel', mask: '(999) 999-9999' }], [{ t: '' }]));
  await teclear(c, 0, 0, '5');
  c.igual(await valorInput(c), '(5__) ___-____');
});
t('12', 'mask-placeholder="" no muestra relleno', '§3-a', async (c) => {
  await c.abrir(pag([{ field: 't', title: 'Tel', mask: '(999) 999-9999', 'mask-placeholder': '' }], [{ t: '' }]));
  await teclear(c, 0, 0, '555');
  c.igual(await valorInput(c), '(555) ');
});
t('13', 'calc="true" en Number: =120*1.16 se evalúa y se guarda el resultado', ['§3-h'], async (c) => {
  await c.abrir(pag([{ field: 'p', type: 'Number', title: 'Precio', calc: 'true', format: 'true', decs: '2' }], [{ p: 0 }]));
  await editar(c, 't1', 0, 0, '=120*1.16');
  c.igual(Number((await c.datos())[0].p), 139.2);
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '139.20');
}, { requiere: ['calc'] });
t('14', 'calc: expresión inválida → MaskInvalid reason calc', ['§3-i'], async (c) => {
  await c.abrir(pag([{ field: 'p', type: 'Number', title: 'Precio', calc: 'true' }], [{ p: 1 }], {}, grabarMI));
  await editar(c, 't1', 0, 0, '=2*(3');
  c.igual(await c.ev(() => window.mi.map(x => x.reason)), ['calc']);
}, { requiere: ['calc'] });
t('15', 'calc: sin "=" el texto se toma como número normal', '§3-h', async (c) => {
  await c.abrir(pag([{ field: 'p', type: 'Number', title: 'P', calc: 'true' }], [{ p: 1 }]));
  await editar(c, 't1', 0, 0, '12');
  c.igual(Number((await c.datos())[0].p), 12);
}, { requiere: ['calc'] });
t('16', 'calc solo aplica a columnas Number: en Text "=1+1" queda como texto', '§3-h', async (c) => {
  await c.abrir(pag([{ field: 'x', type: 'Text', title: 'X', calc: 'true' }], [{ x: '' }]));
  await editar(c, 't1', 0, 0, '=1+1');
  c.igual((await c.datos())[0].x, '=1+1');
}, { requiere: ['calc'] });
t('17', 'calc: dividir entre cero es error', '§3-i', async (c) => {
  await c.abrir(pag([{ field: 'p', type: 'Number', title: 'P', calc: 'true' }], [{ p: 1 }], {}, grabarMI));
  await editar(c, 't1', 0, 0, '=5/0');
  c.igual(await c.ev(() => window.mi.map(x => x.reason)), ['calc']);
}, { requiere: ['calc'] });
// ---------- R7 en EdiTable ----------
const enLang = (lang) => (h) => `<div lang="${lang}">${h}</div>`;
t('r7-01', 'R7: Number con calc (editor propio) en una tabla dentro de lang="es-CO": "1234,5" → 1234.5', ['§0-R7'], async (c) => {
  await c.abrir(pag([{ field: 'n', type: 'Number', title: 'N', calc: 'true' }], [{ n: 0 }], {}, '', enLang('es-CO')));
  await editar(c, 't1', 0, 0, '1234,5');
  c.igual(Number((await c.datos())[0].n), 1234.5);
}, { requiere: ['calc'] });
t('r7-01b', 'R7: Number con locale explícito en la tabla usa el editor propio: acepta "1234,5" (es-CO)', ['§0-R7', '§1-C16'], async (c) => {
  await c.abrir(pag([{ field: 'n', type: 'Number', title: 'N' }], [{ n: 0 }], { locale: 'es-CO' }));
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('#__table_input').type), 'text', 'editor propio (no type=number)');
  await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = ''; });
  await c.page.keyboard.type('1234,5'); await c.tecla('Enter');
  c.igual(Number((await c.datos())[0].n), 1234.5);
});
t('r7-01c', 'R7: locale explícito en la columna también activa el editor propio', ['§0-R7'], async (c) => {
  await c.abrir(pag([{ field: 'n', type: 'Number', title: 'N', locale: 'de-DE' }], [{ n: 0 }]));
  await editar(c, 't1', 0, 0, '2,5');
  c.igual(Number((await c.datos())[0].n), 2.5);
});
t('r7-01d', 'R8: Number sin mask, calc ni locale sigue usando input type=number (comportamiento actual)', ['§0-R8', '§0-R1'], async (c) => {
  await c.abrir({ ...pag([{ field: 'n', type: 'Number', title: 'N' }], [{ n: 0 }]), lang: 'es-CO' });
  await c.foco('t1', 0, 0); await c.tecla('F2');
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('#__table_input').type), 'number');
}, { requiere: [] });
t('r7-02', 'R7: calc con coma decimal (lang="de-DE" en la tabla): =1,5*2 → 3', ['§0-R7', '§3-h'], async (c) => {
  await c.abrir(pag([{ field: 'n', type: 'Number', title: 'N', calc: 'true' }], [{ n: 0 }], { lang: 'de-DE' }));
  await editar(c, 't1', 0, 0, '=1,5*2');
  c.igual(Number((await c.datos())[0].n), 3);
}, { requiere: ['calc'] });
t('r7-03', 'R7: percent en es-CO: se teclea 10,5, la celda muestra 10,50 y DataArray guarda 10.5 (punto)', ['§0-R7', '§3-d'], async (c) => {
  await c.abrir(pag([{ field: 'p', title: '%', mask: 'percent' }], [{ p: '' }], { lang: 'es-CO' }));
  await editar(c, 't1', 0, 0, '10,5');
  const d = (await c.datos())[0].p;
  c.ok(/^10\.50?$/.test(String(d)), 'DataArray: ' + d);
  c.igual(await c.ev(() => __ct.texto('t1', 0, 0)), '10,50');
});
t('r7-04', 'R7: percent en es-MX: no se puede teclear la coma', ['§0-R7', '§3-d'], async (c) => {
  await c.abrir(pag([{ field: 'p', title: '%', mask: 'percent' }], [{ p: '' }], { lang: 'es-MX' }));
  await teclear(c, 0, 0, '1,5');
  c.igual((await valorInput(c)).includes(','), false);
});
t('r7-05', 'R7: el lang de la tabla gana sobre el del documento', ['§0-R7'], async (c) => {
  await c.abrir({ ...pag([{ field: 'n', type: 'Number', title: 'N', calc: 'true' }], [{ n: 0 }], { lang: 'es-CO' }), lang: 'en-US' });
  await editar(c, 't1', 0, 0, '=2,5+1');
  c.igual(Number((await c.datos())[0].n), 3.5);
}, { requiere: ['calc'] });
t('r7-06', 'R7: sin lang en la tabla, manda document.documentElement.lang', ['§0-R7'], async (c) => {
  await c.abrir({ ...pag([{ field: 'n', type: 'Number', title: 'N', calc: 'true' }], [{ n: 0 }]), lang: 'de-DE' });
  await editar(c, 't1', 0, 0, '=2,5+1');
  c.igual(Number((await c.datos())[0].n), 3.5);
}, { requiere: ['calc'] });
for (const nav of ['es', 'es-ES', 'es-CO']) {
  t('r7-07-' + nav, `R7 revisada: página sin lang y navegador en ${nav}: calc se comporta como es-MX (=2.5+1 → 3.5)`, ['§0-R7'], async (c) => {
    await c.abrir({ ...pag([{ field: 'n', type: 'Number', title: 'N', calc: 'true' }], [{ n: 0 }]), lang: '', contexto: { locale: nav } });
    await editar(c, 't1', 0, 0, '=2.5+1');
    c.igual(Number((await c.datos())[0].n), 3.5);
  }, { requiere: ['calc'] });
}
t('r7-06b', 'R7: document lang sin región ("es") se trata como no declarado → es-MX', ['§0-R7'], async (c) => {
  await c.abrir({ ...pag([{ field: 'n', type: 'Number', title: 'N', calc: 'true' }], [{ n: 0 }]), lang: 'es', contexto: { locale: 'es-ES' } });
  await editar(c, 't1', 0, 0, '=2.5+1');
  c.igual(Number((await c.datos())[0].n), 3.5);
}, { requiere: ['calc'] });
t('r7-08', 'R7: totales con números escritos como texto en es-CO ("1.234,5")', ['§0-R7', '§2-a'], async (c) => {
  await c.abrir(pag([{ field: 'n', type: 'Number', title: 'N', summary: 'sum' }], [{ n: '1.234,5' }, { n: '0,5' }], { lang: 'es-CO' }));
  c.cerca(await c.ev(() => __ct.t('t1').getSummary('n')), 1235, 1e-9);
}, { requiere: ['summary'] });

export default { nombre: 'v2-mascaras-calc-y-locale', grupo: 'v2', pruebas: P };
