// calc(): expresiones numéricas sin eval.
const test = require('node:test'), assert = require('node:assert/strict');
const M = require('./cargar.cjs');
const v = e => { const r = M.calc(e); assert.ok(r.ok, `${e}: ${r.error}`); assert.equal(r.error, ''); return r.value; };
const e = x => { const r = M.calc(x); assert.equal(r.ok, false, x); assert.equal(r.value, null); return r.error; };

test('con y sin =', () => {
  assert.equal(v('=1+2'), 3);
  assert.equal(v('1+2'), 3);
  assert.equal(v('  = 1 + 2  '), 3);
  assert.equal(v('42'), 42);
});
test('precedencia', () => {
  assert.equal(v('2+3*4'), 14);
  assert.equal(v('2*3+4'), 10);
  assert.equal(v('10-4-3'), 3);
  assert.equal(v('100/10/5'), 2);
  assert.equal(v('2+6/3*2-1'), 5);
});
test('paréntesis anidados', () => {
  assert.equal(v('(2+3)*4'), 20);
  assert.equal(v('((1+2)*(3+4))/(7)'), 3);
  assert.equal(v('(((((5)))))'), 5);
  assert.equal(v('2*(3+(4-(1+1))*2)'), 14);
});
test('unario', () => {
  assert.equal(v('-5'), -5);
  assert.equal(v('--5'), 5);
  assert.equal(v('+5'), 5);
  assert.equal(v('3*-2'), -6);
  assert.equal(v('-(2+3)'), -5);
  assert.equal(v('2--3'), 5);
  assert.equal(v('-0'), 0);
  assert.ok(Object.is(v('-0'), 0));
});
test('decimales con punto y precisión a 10 decimales', () => {
  assert.equal(v('0.1+0.2'), 0.3);
  assert.equal(v('.5+.25'), 0.75);
  assert.equal(v('1.'), 1);
  assert.equal(v('1.1*3'), 3.3);
  assert.equal(v('1/3'), 0.3333333333);
  assert.equal(v('2/3'), 0.6666666667);
  assert.equal(v('0.00000000001'), 0);
});
test('porcentaje: a% es a/100', () => {
  assert.equal(v('50%'), 0.5);
  assert.equal(v('200*10%'), 20);
  assert.equal(v('200/50%'), 400);
  assert.equal(v('10%+5'), 5.1);
  assert.equal(v('5%%'), 0.0005);
  assert.equal(v('(50)%'), 0.5);
});
test('porcentaje: a+b% y a-b% como calculadora', () => {
  assert.equal(v('100+10%'), 110);
  assert.equal(v('100-10%'), 90);
  assert.equal(v('=1500+16%'), 1740);
  assert.equal(v('100+10%+10%'), 121);
  assert.equal(v('100+-10%'), 90);
  assert.equal(v('2*50+10%'), 110);
  // si el porcentaje se multiplica ya no es "por ciento de a"
  assert.equal(v('100+10%*2'), 100.2);
  // entre paréntesis tampoco
  assert.equal(v('100+(10%)'), 100.1);
});
test('coma: solo separador de miles bien agrupado', () => {
  assert.equal(v('1,500'), 1500);
  assert.equal(v('1,234,567.89+0.11'), 1234568);
  assert.equal(v('12,345*2'), 24690);
  assert.equal(e('1,5'), 'syntax');
  assert.equal(e('1,5000'), 'syntax');
  assert.equal(e('1234,567'), 'syntax');
  assert.equal(e('1,'), 'syntax');
  assert.equal(e(',5'), 'syntax');
});
test('errores de sintaxis', () => {
  for (const x of ['1+', '*2', '(1+2', '1+2)', '()', '2(3)', '(2)(3)', '1 2', '1..2', '%5', 'abc', '2^3', '1e5', '=', '= 1 +', '1/', '0x10', '½'])
    assert.equal(e(x), x === '=' ? 'empty' : 'syntax', x);
});
test('vacío', () => {
  assert.equal(e(''), 'empty');
  assert.equal(e('   '), 'empty');
  assert.equal(e(null), 'empty');
});
test('división entre cero', () => {
  assert.equal(e('5/0'), 'div0');
  assert.equal(e('5/(2-2)'), 'div0');
  assert.equal(e('0/0'), 'div0');
  assert.equal(e('1/0%'), 'div0');
});
test('números grandes', () => {
  assert.equal(v('999999999999*999999999999'), 9.99999999998e23);
  assert.equal(v('123456789012345678901234567890'), 1.2345678901234568e29);
  // con 200 caracteres no se llega a Infinity (el máximo ronda 1e199); el resultado sigue siendo finito
  assert.ok(Number.isFinite(v('9'.repeat(100) + '*' + '9'.repeat(99))));
});
test('límite de longitud', () => {
  assert.equal(v('1+'.repeat(99) + '1'), 100); // 199 caracteres
  assert.equal(e('1+'.repeat(100) + '1'), 'length');
  assert.equal(v('('.repeat(99) + '1' + ')'.repeat(99)), 1);
});
test('no usa eval ni Function', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../src/js/_partes/editable.mask.js'), 'utf8');
  assert.ok(!/\beval\s*\(|\bFunction\s*\(/.test(src));
});
