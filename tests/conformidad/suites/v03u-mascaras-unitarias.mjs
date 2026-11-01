// v2 §3 y R7: pruebas unitarias sin DOM de EditTable.Mask (apply, edit, validate, format, unformat, calc, presets).
// Contrato detallado: tests/mascaras/README.md del motor (referido por la spec §3, "Pieza aparte").
import { registro } from '../lib/v2.mjs';
import { Falla } from '../lib/arnes.mjs';

const { P, t } = registro('mku', { requiere: ['mask'] });

// Corre fn(Mask) en una página vacía que solo carga el componente.
async function M(c, fn, arg) {
  if (!c.page) await c.abrir({ body: '' });
  const r = await c.ev(({ src, arg }) => {
    if (typeof EditTable === 'undefined' || !EditTable.Mask) return { $falta: true };
    const f = new Function('Mask', 'arg', 'return (' + src + ')(Mask, arg);');
    try { return { v: JSON.parse(JSON.stringify(f(EditTable.Mask, arg) ?? null)) }; } catch (e) { return { $err: String(e && e.message || e) }; }
  }, { src: fn.toString(), arg });
  if (r.$falta) throw new Falla('EditTable.Mask no existe');
  if (r.$err) throw new Falla('excepción en EditTable.Mask: ' + r.$err);
  return r.v;
}

// dígito verificador de CURP (RENAPO)
function curpDV(c17) {
  const d = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  let s = 0; for (let i = 0; i < 17; i++) s += d.indexOf(c17[i]) * (18 - i);
  return String((10 - (s % 10)) % 10);
}
const CURP_OK = 'GOEJ850101HCSMRN0' + curpDV('GOEJ850101HCSMRN0');   // ficticia, estructura válida
const CURP_SIGLO21 = 'GOEJ000229MCSMRNA' + curpDV('GOEJ000229MCSMRNA');

t('01', 'EditTable.Mask expone apply, edit, validate, format, unformat, calc y presets', '§3-j', async (c) => {
  const r = await M(c, (Mk) => ['apply', 'edit', 'validate', 'format', 'unformat', 'calc'].map(k => typeof Mk[k]).concat([typeof Mk.presets]));
  c.igual(r, ['function', 'function', 'function', 'function', 'function', 'function', 'object']);
});
t('02', 'apply con patrón 9999-999-999 inserta literales; raw sin literales; complete', ['§3-b', '§3-c'], async (c) => {
  c.igual(await M(c, (Mk) => { const r = Mk.apply('9999-999-999', '5512345678'); return [r.display, r.raw, r.complete]; }), ['5512-345-678', '5512345678', true]);
});
t('03', 'apply rechaza lo que no corresponde y cuenta los rechazos', '§3-b', async (c) => {
  c.igual(await M(c, (Mk) => { const r = Mk.apply('999', 'a1b2c3', { placeholder: '' }); return [r.raw, r.rejected]; }), ['123', 3]);
});
t('04', 'A acepta letras Unicode (Ñ, acentos); rechaza dígitos', '§3-b', async (c) => {
  c.igual(await M(c, (Mk) => Mk.apply('AAA', 'ñá1é', { placeholder: '' }).raw), 'ñáé');
});
t('05', 'X: letra o dígito; *: cualquier carácter', '§3-b', async (c) => {
  c.igual(await M(c, (Mk) => [Mk.apply('XX', 'a-1', { placeholder: '' }).raw, Mk.apply('**', '#$', { placeholder: '' }).raw]), ['a1', '#$']);
});
t('06', '\\ escapa el carácter siguiente (\\9 es literal)', '§3-c', async (c) => {
  c.igual(await M(c, (Mk) => { const r = Mk.apply('\\99', '5', { placeholder: '' }); return [r.display, r.raw]; }), ['95', '5']);
});
t('07', 'placeholder: por omisión "_" en las ranuras vacías; nunca cuenta como dato', ['§3-a', '§3-b'], async (c) => {
  c.igual(await M(c, (Mk) => { const r = Mk.apply('(999) 999-9999', '5'); return [r.display, r.raw, r.complete]; }), ['(5__) ___-____', '5', false]);
  c.igual(await M(c, (Mk) => { const u = Mk.unformat('(999) 999-9999', '(5__) ___-____'); return typeof u === 'object' ? u.raw : u; }), '5');
});
t('08', 'placeholder vacío: el display llega hasta la siguiente ranura', '§3-a', async (c) => {
  c.igual(await M(c, (Mk) => Mk.apply('(999) 999-9999', '555', { placeholder: '' }).display), '(555) ');
});
t('09', 'texto vacío: display vacío', '§3-b', async (c) => {
  c.igual(await M(c, (Mk) => Mk.apply('9999-999-999', '').display), '');
});
t('10', 'edit: insertar en medio recorre a la derecha; borrar recorre a la izquierda (sin huecos)', '§3-b', async (c) => {
  const r = await M(c, (Mk) => {
    const a = Mk.edit('9999-999-999', { display: '5512-3', caret: 6 }, { type: 'insert', text: '4' }, { placeholder: '' });
    const b = Mk.edit('9999-999-999', { display: '5512-34', caret: 2 }, { type: 'backspace' }, { placeholder: '' });
    return [a.display, a.accepted, b.display, b.raw];
  });
  c.igual(r, ['5512-34', true, '5123-4', '51234']);
});
t('11', 'edit: teclear con el patrón lleno se rechaza; pegar algo más largo se corta', '§3-e', async (c) => {
  const r = await M(c, (Mk) => {
    const a = Mk.edit('999', { display: '123', caret: 3 }, { type: 'insert', text: '4' }, { placeholder: '' });
    const b = Mk.edit('999', { display: '', caret: 0 }, { type: 'paste', text: '98765' }, { placeholder: '' });
    return [a.accepted, a.display, b.display];
  });
  c.igual(r, [false, '123', '987']);
});
t('12', 'el nombre de un preset gana sobre el patrón (cp no se lee como literales c y p)', '§3-b', async (c) => {
  c.igual(await M(c, (Mk) => [Mk.apply('cp', '29000').complete, Mk.apply('\\c\\p', '').display !== undefined]), [true, true]);
});
// ---------- presets ----------
t('20', 'rfc: genéricos del SAT válidos', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => ['XAXX010101000', 'XEXX010101000'].map(v => Mk.validate('rfc', v).ok)), [true, true]);
});
t('21', 'rfc: RFC de prueba del SAT válidos (12 y 13) y en minúsculas', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => ['EKU9003173C9', 'GODE561231GR8', 'eku9003173c9'].map(v => Mk.validate('rfc', v).ok)), [true, true, true]);
});
t('22', 'rfc: motivos checksum, fecha, incomplete e invalid', ['§3-d', '§3-f'], async (c) => {
  c.igual(await M(c, (Mk) => ['EKU9003173C8', 'EKU9013173C9', 'EKU90', 'E1U9003173C9'].map(v => Mk.validate('rfc', v).reason)), ['checksum', 'fecha', 'incomplete', 'invalid']);
});
t('23', 'rfc: admite Ñ y & en las letras', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => Mk.apply('rfc', 'ñ&a', { placeholder: '' }).raw), 'Ñ&A');
});
t('24', 'curp: válida, siglo de la posición 17, entidad NE', '§3-d', async (c) => {
  const ne = 'GOEJ850101HNEMRN0' + curpDV('GOEJ850101HNEMRN0');
  c.igual(await M(c, (Mk, a) => a.map(v => Mk.validate('curp', v).ok), [CURP_OK, CURP_SIGLO21, ne]), [true, true, true]);
});
t('25', 'curp: motivos entidad, fecha, checksum, invalid (sexo), incomplete', ['§3-d', '§3-f'], async (c) => {
  const ent = 'GOEJ850101HZZMRN0' + curpDV('GOEJ850101HZZMRN0');
  const fecha = 'GOEJ850231HCSMRN0' + curpDV('GOEJ850231HCSMRN0');
  const mal = CURP_OK.slice(0, 17) + String((Number(CURP_OK[17]) + 1) % 10);
  const sexo = 'GOEJ850101QCSMRN0' + curpDV('GOEJ850101QCSMRN0');
  c.igual(await M(c, (Mk, a) => a.map(v => Mk.validate('curp', v).reason), [ent, fecha, mal, sexo, 'GOEJ85']), ['entidad', 'fecha', 'checksum', 'invalid', 'incomplete']);
});
t('26', 'cp: 5 dígitos', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => [Mk.validate('cp', '29000').ok, Mk.validate('cp', '2900').reason]), [true, 'incomplete']);
});
t('27', 'tel: 10 dígitos, se muestra (999) 999-9999; acepta guiones al leer', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => [Mk.format('tel', '5512345678'), Mk.apply('tel', '551-234-5678').raw, Mk.validate('tel', '55123').reason]), ['(551) 234-5678', '5512345678', 'incomplete']);
});
t('28', 'email', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => ['a@b.mx', 'a@b', 'a b@c.mx', 'a@@b.mx'].map(v => Mk.validate('email', v).ok)), [true, false, false, false]);
});
t('29', 'percent (es-MX): 0-100 con 2 decimales; rango e invalid; raw con punto', ['§3-d', '§0-R7'], async (c) => {
  c.igual(await M(c, (Mk) => [Mk.validate('percent', '10.5').ok, Mk.validate('percent', '101').reason, Mk.validate('percent', '12.345').reason, Mk.validate('percent', '1,5').reason, Mk.format('percent', '7')]), [true, 'rango', 'rango', 'invalid', '7.00']);
});
t('30', 'percent (es-CO, coma decimal): se muestra con coma y el raw va con punto', ['§3-d', '§0-R7'], async (c) => {
  c.igual(await M(c, (Mk) => [Mk.format('percent', '10.5', { locale: 'es-CO' }), /^10\.50?$/.test(((u) => typeof u === 'object' ? u.raw : u)(Mk.unformat('percent', '10,50', { locale: 'es-CO' }))), Mk.validate('percent', '10,5', { locale: 'es-CO' }).ok, Mk.format('percent', '7', { locale: 'de-DE' })]), ['10,50', true, true, '7,00']);
});
t('31', 'upper y lower', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => [Mk.apply('upper', 'Ñandú').display, Mk.apply('lower', 'ÁRBOL').display, Mk.validate('upper', 'x').ok]), ['ÑANDÚ', 'árbol', true]);
});
t('32', 'valor vacío siempre pasa la máscara (todos los presets)', '§3-d', async (c) => {
  c.igual(await M(c, (Mk) => ['rfc', 'curp', 'cp', 'tel', 'email', 'percent', 'upper', 'lower', '9999-999'].map(p => Mk.validate(p, '').ok)), [true, true, true, true, true, true, true, true, true]);
});
t('33', 'presets: los 8 de la spec están en Mask.presets', '§3-d', async (c) => {
  const r = await M(c, (Mk) => Object.keys(Mk.presets));
  c.igual(['rfc', 'curp', 'cp', 'tel', 'email', 'percent', 'upper', 'lower'].filter(k => !r.includes(k)), []);
});
// ---------- calc ----------
const CALC = [
  ['=120*1.16', 139.2], ['50%', 0.5], ['200*10%', 20], ['100+10%', 110], ['1500+16%', 1740], ['100-10%', 90], ['100+10%+10%', 121],
  ['100+10%*2', 100.2], ['(2+3)*4', 20], ['10/4', 2.5], ['-5+2', -3], ['--5', 5], ['0.1+0.2', 0.3], ['1/3', 0.3333333333], ['1,234.5*2', 2469],
];
for (const [e, v] of CALC) {
  t('c-' + e, `calc("${e}") = ${v}`, ['§3-h', '§3-j'], async (c) => {
    const r = await M(c, (Mk, e) => Mk.calc(e), e);
    c.ok(r && r.ok === true, `calc no ok: ${JSON.stringify(r)}`);
    c.cerca(r.value, v, 1e-10);
  }, { requiere: ['calc'] });
}
for (const [e, err] of [['1/0', 'div0'], ['2*(3', 'syntax'], ['alert(1)', 'syntax'], ['1e5', 'syntax'], ['', 'empty'], ['1+'.repeat(100) + '1', 'length'], ['1,5', 'syntax']]) {
  t('ce-' + (err + ':' + e).slice(0, 18), `calc("${e.slice(0, 20)}${e.length > 20 ? '…' : ''}") es error ${err}`, ['§3-i', '§3-j'], async (c) => {
    const r = await M(c, (Mk, e) => Mk.calc(e), e);
    c.igual([r && r.ok, r && r.error], [false, err]);
  }, { requiere: ['calc'] });
}
t('c-loc-coma', 'calc con locale de coma decimal (es-CO, de-DE): 1,5 = 1.5; 1.234,5 = 1234.5; 1.5 es error', ['§3-h', '§0-R7'], async (c) => {
  const r = await M(c, (Mk) => [Mk.calc('1,5+1', { locale: 'es-CO' }).value, Mk.calc('1.234,5', { locale: 'de-DE' }).value, Mk.calc('100+10,5%', { locale: 'es-CO' }).value, Mk.calc('1.5', { locale: 'es-CO' }).ok]);
  c.igual(r, [2.5, 1234.5, 110.5, false]);
}, { requiere: ['calc'] });
t('c-loc-sep', 'calc con separadores explícitos {decimal, thousands} gana sobre locale', ['§3-h', '§0-R7'], async (c) => {
  c.igual(await M(c, (Mk) => Mk.calc('1.234,5', { locale: 'es-MX', decimal: ',', thousands: '.' }).value), 1234.5);
}, { requiere: ['calc'] });
t('c-redondeo', 'calc redondea a 10 decimales y -0 se devuelve 0', '§3-h', async (c) => {
  c.igual(await M(c, (Mk) => [Mk.calc('2/3').value, Object.is(Mk.calc('-0').value, -0)]), [0.6666666667, false]);
}, { requiere: ['calc'] });

// ---------- R9: canonicalFromText (detalle en tests/mascaras/README.md del motor) ----------
for (const [txt, loc, esp] of [['1,234.50', 'es-MX', '1234.50'], ['1.234,50', 'es-CO', '1234.50'], [',5', 'es-CO', '0.5'], ['007', 'es-MX', '7'], ['-1,10', 'de-DE', '-1.10'], ['', 'es-MX', ''], ['abc', 'es-MX', null], ['123456789012.123456', 'es-MX', '123456789012.123456']]) {
  t('r9-' + (txt || 'vacio') + '-' + loc, `R9 canonicalFromText("${txt}", ${loc}) = ${JSON.stringify(esp)}`, ['§0-R9'], async (c) => {
    c.igual(await M(c, (Mk, a) => (typeof Mk.canonicalFromText === 'function' ? Mk.canonicalFromText(a.txt, { locale: a.loc }) : '$falta'), { txt, loc }), esp);
  });
}
t('r9-nativo', 'R9 canonicalFromText con native:true acepta exponente (sintaxis del input number)', ['§0-R9'], async (c) => {
  c.igual(await M(c, (Mk) => Mk.canonicalFromText('1e-7', { native: true })), '0.0000001');
});
t('r9-calc', 'R9: calc entrega canonical sin exponente y sin ceros finales', ['§0-R9', '§3-h'], async (c) => {
  c.igual(await M(c, (Mk) => [Mk.calc('=1/10000000').canonical, Mk.calc('=1.10*1').canonical, Mk.calc('=1/2').canonical]), ['0.0000001', '1.1', '0.5']);
}, { requiere: ['calc'] });

export default { nombre: 'v2-mascaras-unitarias', grupo: 'v2', pruebas: P };
