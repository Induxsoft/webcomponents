// R9: números como cadena canónica (toCanonical, canonicalFromText y el campo canonical).
const test = require('node:test'), assert = require('node:assert/strict');
const M = require('./cargar.cjs');
const cft = (t, o) => M.canonicalFromText(t, o);
const LOC = { 'es-MX': '.', 'en-US': '.', 'es-CO': ',', 'de-DE': ',' };
// Escribe un número canónico como lo teclearía alguien en el locale (miles cada 3 cifras).
const enLocale = (c, l) => {
  const d = LOC[l], g = d === ',' ? '.' : ',', [i, f] = c.replace('-', '').split('.');
  return (c[0] === '-' ? '-' : '') + i.replace(/\B(?=(\d{3})+$)/g, g) + (f !== undefined ? d + f : '');
};

test('toCanonical: sin exponente', () => {
  assert.equal(M.toCanonical(1e-7), '0.0000001');
  assert.equal(M.toCanonical(1e21), '1000000000000000000000');
  assert.equal(M.toCanonical(1.2345e25), '12345000000000000000000000');
  assert.equal(M.toCanonical(-1e21), '-1000000000000000000000');
  assert.equal(M.toCanonical(123456789012345680000), '123456789012345680000');
});
test('toCanonical: redondeo a maxDecs y sin ceros finales', () => {
  assert.equal(M.toCanonical(0.1 + 0.2), '0.3');
  assert.equal(M.toCanonical(1 / 3), '0.3333333333');
  assert.equal(M.toCanonical(2 / 3, 4), '0.6667');
  assert.equal(M.toCanonical(1.5, 0), '2');
  assert.equal(M.toCanonical(1e-11), '0');
  assert.equal(M.toCanonical(1.1), '1.1');
  assert.equal(M.toCanonical(100), '100');
  assert.equal(M.toCanonical(0.5), '0.5');
});
test('toCanonical: signo, cero negativo y no finitos', () => {
  assert.equal(M.toCanonical(-0.5), '-0.5');
  assert.equal(M.toCanonical(-0), '0');
  assert.equal(M.toCanonical(-1e-12), '0');
  assert.equal(M.toCanonical(NaN), '');
  assert.equal(M.toCanonical(Infinity), '');
  assert.equal(M.toCanonical('2.50'), '2.5');
});
test('canonicalFromText: vacío e inválido', () => {
  for (const l of Object.keys(LOC)) {
    assert.equal(cft('', { locale: l }), '');
    assert.equal(cft('   ', { locale: l }), '');
    assert.equal(cft(null, { locale: l }), '');
    for (const t of ['abc', '-', '.', ',', '1,2,3', '1.2.3', '--1', '1-', '12a', '1 2']) assert.equal(cft(t, { locale: l }), null, `${t} ${l}`);
  }
});
for (const l of Object.keys(LOC)) {
  const o = { locale: l };
  test(`canonicalFromText ${l}: miles, decimales, negativos y ceros`, () => {
    for (const c of ['1234.50', '1234', '0.5', '-0.5', '-1234567.125', '1.10', '100.00', '0', '1000000', '7.0'])
      assert.equal(cft(enLocale(c, l), o), c, `${enLocale(c, l)} ${l}`);
    // sin separador de miles también vale
    assert.equal(cft(LOC[l] === ',' ? '1234,50' : '1234.50', o), '1234.50');
    // ceros a la izquierda, signo + y espacios
    assert.equal(cft('007', o), '7');
    assert.equal(cft('+5', o), '5');
    assert.equal(cft('- 5', o), '-5');
    assert.equal(cft('  42  ', o), '42');
    assert.equal(cft(`000${LOC[l]}50`, o), '0.50');
    assert.equal(cft(`${LOC[l]}5`, o), '0.5');
    assert.equal(cft(`5${LOC[l]}`, o), '5');
    assert.equal(cft('-0', o), '0');
    assert.equal(cft(`-0${LOC[l]}00`, o), '0.00');
  });
  test(`canonicalFromText ${l}: 18 cifras sin perder precisión`, () => {
    for (const c of ['123456789012345678', '-123456789012345678', '123456789012.123456', '999999999999999999.99', '0.000000000000000001'])
      assert.equal(cft(enLocale(c, l), o), c, `${enLocale(c, l)} ${l}`);
  });
  test(`canonicalFromText ${l}: lo que entrega el control nativo`, () => {
    assert.equal(cft('1e3', o), '1000');
    assert.equal(cft('1E3', o), '1000');
    assert.equal(cft('1.5e3', o), '1500');
    assert.equal(cft('1.50e1', o), '15.0');
    assert.equal(cft('1.5e-3', o), '0.0015');
    assert.equal(cft('-2e-2', o), '-0.02');
    assert.equal(cft('12e-2', o), '0.12');
    assert.equal(cft('.5', { ...o, native: true }), '0.5');
    assert.equal(cft('-.5', { ...o, native: true }), '-0.5');
    assert.equal(cft('1234.5', { ...o, native: true }), '1234.5');
    assert.equal(cft('1.234', { ...o, native: true }), '1.234');
    assert.equal(cft('1,5', { ...o, native: true }), null);
  });
}
test('canonicalFromText: ambigüedad en locales de coma', () => {
  // 1.234 con es-CO es 1234 (miles bien agrupados); el control nativo se lee con native:true
  assert.equal(cft('1.234', { locale: 'es-CO' }), '1234');
  assert.equal(cft('1.5', { locale: 'es-CO' }), '1.5'); // no es agrupación válida: se lee como nativo
  assert.equal(cft('1.234,50', { locale: 'es-CO' }), '1234.50');
  assert.equal(cft('1.234,50', { locale: 'es-MX' }), null);
  assert.equal(cft('1,5', { locale: 'en-US' }), null);
  assert.equal(cft('1 234,5', { locale: 'fr-FR' }), '1234.5');
  assert.equal(cft('1.234,5', { decimal: ',' }), '1234.5');
});
test('campo canonical en percent: apply, edit y unformat', () => {
  assert.equal(M.apply('percent', '10.50').canonical, '10.50');
  assert.equal(M.apply('percent', '007').canonical, '7');
  assert.equal(M.apply('percent', '.5').canonical, '0.5');
  assert.equal(M.apply('percent', '').canonical, '');
  assert.equal(M.apply('percent', '10,50', { locale: 'es-CO' }).canonical, '10.50');
  assert.equal(M.apply('percent', '10,50', { locale: 'de-DE' }).canonical, '10.50');
  assert.equal(M.apply('percent', '10.5', { locale: 'en-US' }).canonical, '10.5');
  assert.equal(M.edit('percent', { display: '1,1', caret: 3 }, { type: 'insert', text: '0' }, { locale: 'es-CO' }).canonical, '1.10');
  assert.equal(M.edit('percent', { display: '1.1', caret: 3 }, { type: 'insert', text: '0' }).canonical, '1.10');
  assert.equal(M.edit('percent', { display: '5', caret: 1 }, { type: 'backspace' }).canonical, '');
  assert.equal(M.edit('percent', { display: '5', caret: 1 }, { type: 'insert', text: 'x' }).canonical, '5');
  assert.deepEqual(M.unformat('percent', '10,50', { locale: 'es-CO' }), { raw: '10.50', canonical: '10.50' });
  assert.deepEqual(M.unformat('percent', '', { locale: 'es-CO' }), { raw: '', canonical: '' });
});
test('campo canonical en máscaras de patrón y presets de texto: igual a raw', () => {
  const a = M.apply('tel', '(961) 123-4567');
  assert.equal(a.canonical, a.raw);
  assert.equal(M.apply('9999-999-999', '0012345678').canonical, '0012345678');
  assert.equal(M.edit('tel', { display: '', caret: 0 }, { type: 'paste', text: '9611234567' }).canonical, '9611234567');
  assert.deepEqual(M.unformat('tel', '(961) 123-4567'), { raw: '9611234567', canonical: '9611234567' });
  assert.equal(M.apply('rfc', 'gode561231gr8').canonical, 'GODE561231GR8');
  assert.equal(M.apply('upper', 'abc').canonical, 'ABC');
});
for (const l of Object.keys(LOC)) {
  test(`campo canonical en calc ${l}`, () => {
    const o = { locale: l }, d = LOC[l];
    assert.equal(M.calc(`=0${d}1+0${d}2`, o).canonical, '0.3');
    assert.equal(M.calc(`=1${d}10*1`, o).canonical, '1.1'); // calc quita los ceros que deja el cálculo
    assert.equal(M.calc('=1/3', o).canonical, '0.3333333333');
    assert.equal(M.calc('=-5/2', o).canonical, '-2.5');
    assert.equal(M.calc('=1/10000000', o).canonical, '0.0000001');
    assert.equal(M.calc('=1000000000*1000000000000', o).canonical, '1000000000000000000000');
    assert.equal(M.calc('=0-0', o).canonical, '0');
    assert.equal(M.calc('=1/0', o).canonical, '');
    assert.equal(M.calc('', o).canonical, '');
  });
}
