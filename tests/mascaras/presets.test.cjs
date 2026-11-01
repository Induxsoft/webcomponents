// Presets: rfc, curp, cp, tel, email, percent, upper, lower. Datos ficticios (dígito verificador calculado).
const test = require('node:test'), assert = require('node:assert/strict');
const M = require('./cargar.cjs');
const why = (p, v) => M.validate(p, v).reason;

test('presets expuestos', () => {
  assert.deepEqual(Object.keys(M.presets).sort(), ['cp', 'curp', 'email', 'lower', 'percent', 'rfc', 'tel', 'upper']);
});
test('rfc persona física (13) y moral (12) válidos', () => {
  for (const v of ['GODE561231GR8', 'PEGJ900215AB3', 'EKU9003173C9', 'ABC990101K10', 'ÑAÑ850101AB5', 'A&B850101XY7', 'MOFA000229Z14'])
    assert.equal(why('rfc', v), '', v);
});
test('rfc acepta minúsculas al validar y las convierte al capturar', () => {
  assert.equal(why('rfc', 'gode561231gr8'), '');
  assert.equal(M.apply('rfc', 'gode-561231 gr8').display, 'GODE561231GR8');
  assert.equal(M.apply('rfc', 'ñañ').display, 'ÑAÑ');
});
test('rfc genéricos', () => {
  assert.equal(why('rfc', 'XAXX010101000'), '');
  assert.equal(why('rfc', 'XEXX010101000'), '');
});
test('rfc incompleto', () => {
  assert.equal(why('rfc', 'GODE5612'), 'incomplete');
  assert.equal(M.apply('rfc', 'GODE5612').complete, false);
  assert.equal(M.apply('rfc', 'ABC990101K10').complete, true);
});
test('rfc estructura inválida', () => {
  for (const v of ['G0DE561231GR8', 'GODE56123AGR8', 'GODE561231G-8', 'AB1990101K10', 'GODEX61231GR8'])
    assert.equal(why('rfc', v), 'invalid', v);
});
test('rfc con más de 13 caracteres: apply corta, validate marca inválido', () => {
  assert.equal(M.apply('rfc', 'GODE561231GR8ZZ').display, 'GODE561231GR8');
  assert.equal(M.apply('rfc', 'GODE561231GR8ZZ').rejected, 2);
  assert.equal(why('rfc', 'GODE561231GR8Z'), 'invalid');
});
test('rfc fecha imposible', () => {
  assert.equal(why('rfc', 'PEGJ900231AB9'), 'fecha'); // 31 de febrero
  assert.equal(why('rfc', 'PEGJ910229AB7'), 'fecha'); // 29 de febrero en año no bisiesto
  assert.equal(why('rfc', 'ABC991301K13'), 'fecha'); // mes 13
  assert.equal(why('rfc', 'ABC990100K10'), 'fecha'); // día 00
});
test('rfc dígito verificador', () => {
  assert.equal(why('rfc', 'GODE561231GR9'), 'checksum');
  assert.equal(why('rfc', 'XAXX010101001'), 'checksum'); // genérico mal escrito
});
test('curp válidas (siglo por la posición 17, sexo H/M/X)', () => {
  for (const v of ['PEGJ900215HJCRRN08', 'PEGJ000229HJCRRNA8', 'GARC991231XNERRS02', 'PEGJ900215HJCRRNA8'])
    assert.equal(why('curp', v), '', v);
});
test('curp incompleta e inválida', () => {
  assert.equal(why('curp', 'PEGJ900215HJC'), 'incomplete');
  for (const v of ['PBGJ900215HJCRRN08', 'PEGJ900215FJCRRN08', 'PEGJ900215HJCRAN08', 'PEGJ900215HJCRRN0A', '1EGJ900215HJCRRN08'])
    assert.equal(why('curp', v), 'invalid', v);
});
test('curp con entidad inválida', () => {
  assert.equal(why('curp', 'PEGJ900215HZZRRN05'), 'entidad');
});
test('curp con fecha imposible', () => {
  assert.equal(why('curp', 'PEGJ900230HJCRRN03'), 'fecha'); // 30 de febrero
  assert.equal(why('curp', 'PEGJ000229HJCRRN08'), 'fecha'); // 1900 no fue bisiesto
  assert.equal(why('curp', 'LOMA050229MDFPRRA4'), 'fecha'); // 2005 no es bisiesto
});
test('curp dígito verificador', () => {
  assert.equal(why('curp', 'PEGJ900215HJCRRN09'), 'checksum');
});
test('curp captura: mayúsculas, sin Ñ, máximo 18', () => {
  const r = M.apply('curp', 'pegj900215hjcrrn08zz');
  assert.deepEqual([r.display, r.complete, r.rejected], ['PEGJ900215HJCRRN08', true, 2]);
  assert.equal(M.apply('curp', 'ÑE').display, 'E');
});
test('cp: 5 dígitos', () => {
  assert.equal(M.apply('cp', '29000').display, '29000');
  assert.equal(why('cp', '29000'), '');
  assert.equal(why('cp', '2900'), 'incomplete');
  assert.equal(why('cp', '2900a'), 'invalid');
  assert.equal(why('cp', '290001'), 'invalid');
});
test('tel: 10 dígitos, display (999) 999-9999', () => {
  assert.equal(M.format('tel', '9611234567'), '(961) 123-4567');
  assert.equal(M.unformat('tel', '(961) 123-4567').raw, '9611234567');
  assert.equal(why('tel', '9611234567'), '');
  assert.equal(why('tel', '(961) 123-4567'), '');
  assert.equal(why('tel', '961123456'), 'incomplete');
  assert.equal(why('tel', '96112345678'), 'invalid');
});
test('email', () => {
  for (const v of ['ana@ejemplo.com', 'a.b+c@sub.ejemplo.mx']) assert.equal(why('email', v), '', v);
  for (const v of ['ana@ejemplo', 'ana@@x.com', 'ana@x.c', '@x.com', 'ana x@y.com', 'ana@x.com.']) assert.equal(why('email', v), 'invalid', v);
  assert.equal(M.apply('email', ' ana @x.com ').display, 'ana@x.com');
  assert.equal(M.format('email', 'Ana@X.com'), 'Ana@X.com');
});
test('percent en bordes', () => {
  for (const v of ['0', '100', '100.00', '99.99', '.5', '5.', '0.01']) assert.equal(why('percent', v), '', v);
  for (const v of ['100.01', '101', '12.345', '1000']) assert.equal(why('percent', v), 'rango', v);
  for (const v of ['-1', 'abc', '.', '1,5', '1.2.3']) assert.equal(why('percent', v), 'invalid', v);
});
test('percent: apply, format y unformat', () => {
  assert.equal(M.apply('percent', '150').display, '15');
  assert.equal(M.apply('percent', '12.345').display, '12.34');
  assert.equal(M.apply('percent', '-5%').display, '5');
  assert.equal(M.format('percent', '12.5'), '12.50');
  assert.equal(M.format('percent', '7'), '7.00');
  assert.equal(M.format('percent', ''), '');
  assert.equal(M.unformat('percent', '12.50').raw, '12.50');
});
test('upper y lower', () => {
  assert.equal(M.apply('upper', 'ñandú 12').display, 'ÑANDÚ 12');
  assert.equal(M.format('lower', 'ÁRBOL'), 'árbol');
  assert.equal(M.apply('upper', 'abc').complete, true);
  assert.equal(M.apply('upper', '').complete, false);
  assert.deepEqual(M.validate('upper', 'cualquier cosa'), { ok: true, reason: '' });
});
test('vacío es válido en todos los presets (la obligatoriedad no es de la máscara)', () => {
  for (const p of Object.keys(M.presets)) assert.deepEqual(M.validate(p, ''), { ok: true, reason: '' }, p);
});
test('caret en presets sin patrón', () => {
  assert.equal(M.apply('rfc', 'go-de', { caret: 3 }).caret, 2);
});
test('un preset propio puede pasarse como objeto', () => {
  const P = { m: 'AA-99' };
  assert.equal(M.format(P, 'ab12'), 'ab-12');
  assert.equal(M.validate({ c: c => c, v: v => v === 'si' ? '' : 'invalid' }, 'no').reason, 'invalid');
});
test('un nombre que no es preset se toma como patrón literal', () => {
  assert.equal(M.apply('\\c\\p', 'x').display, '');
  assert.equal(M.format('\\c\\p-9', '1'), 'cp-1');
  // nombres heredados de Object no se toman como preset
  assert.equal(M.format('toString', '1'), '');
});
