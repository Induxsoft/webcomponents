// R7: separadores por locale en calc, percent y edit (es-MX, en-US con punto; es-CO, de-DE con coma).
const test = require('node:test'), assert = require('node:assert/strict');
const M = require('./cargar.cjs');
const PUNTO = ['es-MX', 'en-US'], COMA = ['es-CO', 'de-DE'];
const v = (e, o) => { const r = M.calc(e, o); assert.ok(r.ok, `${e} ${JSON.stringify(o)}: ${r.error}`); return r.value; };
const er = (e, o) => { const r = M.calc(e, o); assert.equal(r.ok, false, `${e} ${JSON.stringify(o)}`); return r.error; };
const ed = (p, display, caret, action, o, end) => { const r = M.edit(p, { display, caret, end }, action, o); return [r.display, r.caret, r.accepted, r.raw]; };

test('sin opciones el locale es es-MX', () => {
  assert.equal(v('1,234.5'), 1234.5);
  assert.equal(er('1,5'), 'syntax');
  assert.equal(M.format('percent', '10.5'), '10.50');
});
for (const locale of PUNTO) {
  const o = { locale };
  test(`calc ${locale}: punto decimal, coma de miles`, () => {
    assert.equal(v('1,234.5', o), 1234.5);
    assert.equal(v('=1,500+16%', o), 1740);
    assert.equal(v('100+10.5%', o), 110.5);
    assert.equal(v('0.1+0.2', o), 0.3);
    assert.equal(er('1,5', o), 'syntax');
    assert.equal(er('1.234,5', o), 'syntax');
  });
  test(`percent ${locale}`, () => {
    assert.equal(M.validate('percent', '10.5', o).reason, '');
    assert.equal(M.validate('percent', '10,5', o).reason, 'invalid');
    assert.equal(M.format('percent', '10.5', o), '10.50');
    assert.equal(M.unformat('percent', '10.50', o), '10.50');
    assert.equal(M.apply('percent', '10.5', o).display, '10.5');
  });
  test(`edit percent ${locale}`, () => {
    assert.deepEqual(ed('percent', '10', 2, { type: 'insert', text: '.' }, o), ['10.', 3, true, '10.']);
    assert.deepEqual(ed('percent', '10', 2, { type: 'insert', text: ',' }, o), ['10', 2, false, '10']);
    assert.deepEqual(ed('percent', '', 0, { type: 'paste', text: '1,5' }, o), ['', 0, false, '']);
    assert.deepEqual(ed('percent', '', 0, { type: 'paste', text: '12.5' }, o), ['12.5', 4, true, '12.5']);
  });
}
for (const locale of COMA) {
  const o = { locale };
  test(`calc ${locale}: coma decimal, punto de miles`, () => {
    assert.equal(v('1,5', o), 1.5);
    assert.equal(v('1.234,5', o), 1234.5);
    assert.equal(v('1.234.567,89+0,11', o), 1234568);
    assert.equal(v('100+10,5%', o), 110.5);
    assert.equal(v('=1.500+16%', o), 1740);
    assert.equal(v(',5+1,', o), 1.5);
    assert.equal(v('0,1+0,2', o), 0.3);
    assert.equal(v('1.500', o), 1500);
    assert.equal(er('1.5', o), 'syntax');
    assert.equal(er('1,234.5', o), 'syntax');
    assert.equal(er('1,2,3', o), 'syntax');
    assert.equal(er('1/0,0', o), 'div0');
  });
  test(`percent ${locale}`, () => {
    assert.equal(M.validate('percent', '10,5', o).reason, '');
    assert.equal(M.validate('percent', '10.5', o).reason, ''); // raw canónico (con punto)
    assert.equal(M.validate('percent', '100,01', o).reason, 'rango');
    assert.equal(M.validate('percent', '12,345', o).reason, 'rango');
    assert.equal(M.validate('percent', '1,2,3', o).reason, 'invalid');
    assert.equal(M.format('percent', '10.5', o), '10,50');
    assert.equal(M.format('percent', '10,5', o), '10,50');
    assert.equal(M.format('percent', '7', o), '7,00');
    assert.equal(M.unformat('percent', '10,50', o), '10.50');
    const r = M.apply('percent', '10,5', o);
    assert.deepEqual([r.display, r.raw, r.complete], ['10,5', '10.5', true]);
    assert.equal(M.apply('percent', '150,5', o).display, '15,5');
  });
  test(`edit percent ${locale}`, () => {
    assert.deepEqual(ed('percent', '10', 2, { type: 'insert', text: ',' }, o), ['10,', 3, true, '10.']);
    assert.deepEqual(ed('percent', '10,', 3, { type: 'insert', text: '5' }, o), ['10,5', 4, true, '10.5']);
    assert.deepEqual(ed('percent', '10', 2, { type: 'insert', text: '.' }, o), ['10', 2, false, '10']);
    assert.deepEqual(ed('percent', '', 0, { type: 'paste', text: '1,5' }, o), ['1,5', 3, true, '1.5']);
    assert.deepEqual(ed('percent', '100,', 4, { type: 'insert', text: '1' }, o), ['100,', 4, false, '100.']);
    assert.deepEqual(ed('percent', '10,5', 3, { type: 'backspace' }, o), ['10,5', 3, false, '10.5']);
  });
}
test('opts.decimal y opts.thousands mandan sobre el locale', () => {
  assert.equal(v('1.234,5', { locale: 'en-US', decimal: ',' }), 1234.5);
  assert.equal(v('1 234,5', { decimal: ',', thousands: ' ' }), 1234.5);
  assert.equal(v("1'234.5", { decimal: '.', thousands: "'" }), 1234.5);
  assert.equal(M.format('percent', '3.5', { decimal: ',' }), '3,50');
});
test('locales con espacio de miles (fr-FR) y es-ES (sin agrupar 4 cifras)', () => {
  assert.equal(v('1 234,5', { locale: 'fr-FR' }), 1234.5);
  assert.equal(v('1 234,5', { locale: 'fr-FR' }), 1234.5);
  assert.equal(v('1.234,5', { locale: 'es-ES' }), 1234.5);
  assert.equal(v('1,5', { locale: 'es-ES' }), 1.5);
});
test('locale inválido cae en es-MX', () => {
  assert.equal(v('1,234.5', { locale: 'no es un locale!' }), 1234.5);
});
test('las máscaras de patrón no dependen del locale', () => {
  assert.equal(M.format('tel', '9611234567', { locale: 'de-DE' }), '(961) 123-4567');
  assert.equal(M.validate('rfc', 'GODE561231GR8', { locale: 'de-DE' }).reason, '');
});
