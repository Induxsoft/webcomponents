// Patrones libres: apply, validate, format, unformat.
const test = require('node:test'), assert = require('node:assert/strict');
const M = require('./cargar.cjs');
const ap = (p, t, o) => { const r = M.apply(p, t, o); return [r.display, r.raw, r.complete, r.caret]; };

test('9 acepta solo dígitos ASCII', () => {
  assert.deepEqual(ap('999', '1a2٣3'), ['123', '123', true, 3]);
  assert.equal(M.apply('999', '1a2').rejected, 1);
});
test('A acepta letras Unicode (Ñ, acentos), no dígitos ni signos', () => {
  assert.deepEqual(ap('AAAA', 'ñÁü1z'), ['ñÁüz', 'ñÁüz', true, 4]);
  assert.equal(M.apply('A', '-').raw, '');
});
test('X acepta letra o dígito', () => {
  assert.deepEqual(ap('XXX', 'a-1Ñ'), ['a1Ñ', 'a1Ñ', true, 3]);
});
test('* acepta cualquier carácter', () => {
  assert.deepEqual(ap('***', ' -é'), [' -é', ' -é', true, 3]);
});
test('\\ escapa símbolos y el propio \\', () => {
  assert.deepEqual(ap('\\9-9', '5'), ['9-5', '5', true, 3]);
  assert.deepEqual(ap('\\A\\X\\*\\\\9', '7', { placeholder: '' }), ['AX*\\7', '7', true, 5]);
  // una \ al final del patrón es literal
  assert.deepEqual(ap('9\\', '1'), ['1\\', '1', true, 2]);
});
test('literales al inicio: se insertan con el primer carácter', () => {
  assert.deepEqual(ap('(999) 999-9999', '5'), ['(5__) ___-____', '5', false, 2]);
  assert.deepEqual(ap('(999) 999-9999', '5', { placeholder: '' }), ['(5', '5', false, 2]);
});
test('literales al final: aparecen al completar', () => {
  assert.deepEqual(ap('999 kg', '12', { placeholder: '' }), ['12', '12', false, 2]);
  assert.deepEqual(ap('999 kg', '123'), ['123 kg', '123', true, 6]);
});
test('sin placeholder se muestran los literales hasta la siguiente ranura', () => {
  assert.deepEqual(ap('(999) 999-9999', '555', { placeholder: '' }), ['(555) ', '555', false, 6]);
});
test('placeholder personalizado', () => {
  assert.equal(M.apply('99-99', '1', { placeholder: '#' }).display, '1#-##');
});
test('vacío', () => {
  assert.deepEqual(ap('(999)', ''), ['', '', false, 0]);
  assert.deepEqual(ap('(999)', null), ['', '', false, 0]);
  assert.deepEqual(M.validate('999', ''), { ok: true, reason: '' });
});
test('texto con o sin literales da el mismo raw', () => {
  const a = M.apply('9999-999-999', '1234567890'), b = M.apply('9999-999-999', '1234-567-890');
  assert.equal(a.display, '1234-567-890');
  assert.deepEqual([b.display, b.raw, b.rejected], [a.display, a.raw, 0]);
});
test('literales del patrón fuera de lugar se ignoran sin contar como rechazo', () => {
  const r = M.apply('(999) 999-9999', '555-123-4567');
  assert.deepEqual([r.display, r.rejected], ['(555) 123-4567', 0]);
});
test('el placeholder dentro del texto no es dato', () => {
  assert.deepEqual(ap('(999) 999-9999', '(55_) ___-____'), ['(55_) ___-____', '55', false, 3]);
});
test('texto más largo que el patrón: se corta y cuenta rechazos', () => {
  const r = M.apply('99-99', '123456');
  assert.deepEqual([r.display, r.raw, r.complete, r.rejected], ['12-34', '1234', true, 2]);
});
test('caret: cuenta caracteres aceptados antes del cursor', () => {
  // cursor después del "5" tecleado en medio
  assert.equal(M.apply('(999) 999-9999', '(55) 1234', { caret: 3 }).caret, 3);
  assert.equal(M.apply('(999) 999-9999', '5551', { caret: 3 }).caret, 6);
  assert.equal(M.apply('(999) 999-9999', '5551', { caret: 0 }).caret, 1);
});
test('validate en patrones', () => {
  assert.deepEqual(M.validate('9999-999-999', '1234-567-890'), { ok: true, reason: '' });
  assert.deepEqual(M.validate('9999-999-999', '1234567890'), { ok: true, reason: '' });
  assert.deepEqual(M.validate('9999-999-999', '1234-56'), { ok: false, reason: 'incomplete' });
  assert.deepEqual(M.validate('9999-999-999', '1234-56a-890'), { ok: false, reason: 'invalid' });
  assert.deepEqual(M.validate('99', '123'), { ok: false, reason: 'invalid' });
});
test('format: raw posicional, sin placeholder', () => {
  assert.equal(M.format('(999) 999-9999', '5551234567'), '(555) 123-4567');
  assert.equal(M.format('(999) 999-9999', '55512'), '(555) 12');
  assert.equal(M.format('(999) 999-9999', ''), '');
  // en raw, un carácter igual a un literal es dato (ranura *)
  assert.equal(M.format('*-*', '--'), '---');
});
test('unformat: quita literales y placeholder', () => {
  assert.equal(M.unformat('(999) 999-9999', '(555) 123-4567').raw, '5551234567');
  assert.equal(M.unformat('(999) 999-9999', '(555) 12_-____').raw, '55512');
  assert.equal(M.unformat('99#99', '1#2', '#').raw, '12');
});
test('format y unformat son inversos', () => {
  for (const [p, raw] of [['9999-999-999', '1234567890'], ['AA-99', 'ñb12'], ['\\(XX\\)', 'a1']])
    assert.equal(M.unformat(p, M.format(p, raw)).raw, raw);
});
test('caracteres fuera del BMP no rompen el patrón', () => {
  assert.deepEqual(ap('**', '😀a'), ['😀a', '😀a', true, 3]);
});
test('solo expone window.EditTableMask si se carga suelto', () => {
  const vm = require('node:vm'), src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../src/js/_partes/editable.mask.js'), 'utf8');
  for (const [archivo, expuesto] of [['/js/_partes/editable.mask.js', true], ['/js/induxsoft.controls.editable.js', false]]) {
    const window = {}, ctx = vm.createContext({ window, document: { currentScript: { src: 'http://x' + archivo } } });
    vm.runInContext(src, ctx);
    assert.equal('EditTableMask' in window, expuesto, archivo);
  }
});
