// edit(): teclear, borrar, suprimir y pegar sobre {display, caret, end}.
const test = require('node:test'), assert = require('node:assert/strict');
const M = require('./cargar.cjs');
const TEL = '(999) 999-9999';
const ed = (p, display, caret, action, end) => {
  const r = M.edit(p, { display, caret, end }, action);
  return [r.display, r.caret, r.accepted];
};
const teclea = (p, s) => {
  let st = { display: '', caret: 0 };
  for (const ch of s) { const r = M.edit(p, st, { type: 'insert', text: ch }); st = { display: r.display, caret: r.caret }; }
  return st;
};

test('teclear desde vacío inserta literales y salta a la siguiente ranura', () => {
  assert.deepEqual(teclea(TEL, '5551234567'), { display: '(555) 123-4567', caret: 14 });
  assert.deepEqual(teclea(TEL, '555'), { display: '(555) ___-____', caret: 6 });
});
test('teclear un carácter inválido no cambia nada', () => {
  assert.deepEqual(ed(TEL, '(55_) ___-____', 3, { type: 'insert', text: 'a' }), ['(55_) ___-____', 3, false]);
});
test('teclear con el patrón lleno se rechaza', () => {
  assert.deepEqual(ed(TEL, '(555) 123-4567', 14, { type: 'insert', text: '8' }), ['(555) 123-4567', 14, false]);
  assert.deepEqual(ed(TEL, '(555) 123-4567', 3, { type: 'insert', text: '8' })[2], false);
});
test('insertar en medio recorre el resto', () => {
  assert.deepEqual(ed(TEL, '(555) 12_-____', 2, { type: 'insert', text: '9' }), ['(595) 512-____', 3, true]);
});
test('insertar con el cursor sobre un literal escribe en la siguiente ranura', () => {
  assert.deepEqual(ed(TEL, '(555) ___-____', 4, { type: 'insert', text: '1' }), ['(555) 1__-____', 7, true]);
  assert.deepEqual(ed(TEL, '', 0, { type: 'insert', text: '(' }), ['', 0, false]);
});
test('reemplazar una selección', () => {
  assert.deepEqual(ed(TEL, '(555) 123-4567', 1, { type: 'insert', text: '9' }, 4), ['(912) 345-67__', 2, true]);
});
test('backspace borra el dato anterior saltando literales', () => {
  assert.deepEqual(ed(TEL, '(555) ___-____', 6, { type: 'backspace' }), ['(55_) ___-____', 3, true]);
  assert.deepEqual(ed(TEL, '(555) 1__-____', 5, { type: 'backspace' }), ['(551) ___-____', 3, true]);
  assert.deepEqual(ed(TEL, '(5__) ___-____', 2, { type: 'backspace' }), ['', 0, true]);
  assert.deepEqual(ed(TEL, '(555) 123-4567', 10, { type: 'backspace' }), ['(555) 124-567_', 8, true]);
});
test('backspace al inicio no hace nada', () => {
  assert.deepEqual(ed(TEL, '(555) ___-____', 1, { type: 'backspace' }), ['(555) ___-____', 1, true]);
  assert.deepEqual(ed(TEL, '', 0, { type: 'backspace' }), ['', 0, true]);
});
test('suprimir borra el dato siguiente saltando literales', () => {
  assert.deepEqual(ed(TEL, '(555) 123-4567', 4, { type: 'delete' }), ['(555) 234-567_', 6, true]);
  assert.deepEqual(ed(TEL, '(555) 123-4567', 1, { type: 'delete' }), ['(551) 234-567_', 1, true]);
  assert.deepEqual(ed(TEL, '(555) ___-____', 6, { type: 'delete' }), ['(555) ___-____', 6, true]);
});
test('borrar una selección', () => {
  assert.deepEqual(ed(TEL, '(555) 123-4567', 0, { type: 'backspace' }, 14), ['', 0, true]);
  assert.deepEqual(ed(TEL, '(555) 123-4567', 6, { type: 'delete' }, 9), ['(555) 456-7___', 6, true]);
});
test('pegar con literales', () => {
  assert.deepEqual(ed(TEL, '', 0, { type: 'paste', text: '(555) 123-4567' }), ['(555) 123-4567', 14, true]);
  assert.deepEqual(ed(TEL, '(55_) ___-____', 3, { type: 'paste', text: '5) 123-4' }), ['(555) 123-4___', 11, true]);
});
test('pegar sin literales y con separadores ajenos', () => {
  assert.deepEqual(ed(TEL, '', 0, { type: 'paste', text: '5551234567' }), ['(555) 123-4567', 14, true]);
  assert.deepEqual(ed(TEL, '', 0, { type: 'paste', text: '555.123.4567' })[0], '(555) 123-4567');
});
test('pegar algo más largo que el patrón se corta', () => {
  assert.deepEqual(ed(TEL, '', 0, { type: 'paste', text: '555123456789' }), ['(555) 123-4567', 14, true]);
  assert.deepEqual(ed(TEL, '(555) 123-4567', 1, { type: 'paste', text: '99' }), ['(995) 551-2345', 3, true]);
});
test('pegar texto sin nada válido se rechaza', () => {
  assert.deepEqual(ed(TEL, '(5__) ___-____', 2, { type: 'paste', text: 'abc' }), ['(5__) ___-____', 2, false]);
});
test('al recorrer, lo que ya no cabe en su ranura se descarta', () => {
  assert.deepEqual(ed('A9', 'b1', 0, { type: 'paste', text: 'a' }), ['a1', 1, true]);
  assert.deepEqual(ed('A9', 'b1', 0, { type: 'insert', text: 'a' })[2], false);
});
test('display ajeno (sin formato) se normaliza', () => {
  assert.deepEqual(ed(TEL, '5551', 4, { type: 'insert', text: '2' }), ['(555) 12_-____', 8, true]);
});
test('selección invertida y caret fuera de rango', () => {
  assert.deepEqual(ed(TEL, '(555) 123-4567', 4, { type: 'backspace' }, 1), ['(123) 456-7___', 1, true]);
  assert.deepEqual(ed(TEL, '(555) ___-____', 99, { type: 'backspace' }), ['(55_) ___-____', 3, true]);
});
test('placeholder vacío en edit', () => {
  const r = M.edit(TEL, { display: '(55', caret: 3 }, { type: 'insert', text: '5' }, { placeholder: '' });
  assert.deepEqual([r.display, r.caret], ['(555) ', 6]);
});
test('presets con patrón (cp, tel) usan el mismo motor', () => {
  assert.deepEqual(teclea('cp', '29000x1'), { display: '29000', caret: 5 });
  assert.deepEqual(ed('tel', '', 0, { type: 'paste', text: '55 1234 5678' })[0], '(551) 234-5678');
});
test('presets sin patrón: insertar, borrar y pegar', () => {
  // edit transforma lo que entra; lo que ya estaba lo normaliza apply/format
  assert.deepEqual(ed('upper', 'ab', 1, { type: 'insert', text: 'x' }), ['aXb', 2, true]);
  assert.deepEqual(ed('lower', 'AB', 2, { type: 'paste', text: 'ÑÉ' }), ['ABñé', 4, true]);
  assert.deepEqual(ed('rfc', 'GODE', 4, { type: 'paste', text: '561231-gr8' }), ['GODE561231GR8', 13, true]);
  assert.deepEqual(ed('rfc', 'GODE561231GR8', 13, { type: 'insert', text: '1' }), ['GODE561231GR8', 13, false]);
  assert.deepEqual(ed('rfc', 'GODE', 4, { type: 'backspace' }), ['GOD', 3, true]);
  assert.deepEqual(ed('rfc', 'GODE', 0, { type: 'delete' }), ['ODE', 0, true]);
  assert.deepEqual(ed('rfc', 'GODE', 1, { type: 'delete' }, 3), ['GE', 1, true]);
  assert.deepEqual(ed('email', 'a@b', 1, { type: 'insert', text: ' ' }), ['a@b', 1, false]);
});
test('percent: rechaza lo que saldría de rango mientras se teclea', () => {
  assert.deepEqual(ed('percent', '10', 2, { type: 'insert', text: '0' }), ['100', 3, true]);
  assert.deepEqual(ed('percent', '100', 3, { type: 'insert', text: '1' }), ['100', 3, false]);
  assert.deepEqual(ed('percent', '100', 3, { type: 'insert', text: '.' }), ['100.', 4, true]);
  assert.deepEqual(ed('percent', '100.', 4, { type: 'insert', text: '5' }), ['100.', 4, false]);
  assert.deepEqual(ed('percent', '12.34', 5, { type: 'insert', text: '5' }), ['12.34', 5, false]);
  assert.deepEqual(ed('percent', '1.5', 1, { type: 'insert', text: '.' }), ['1.5', 1, false]);
  // borrar el punto dejaría 105: se rechaza
  assert.deepEqual(ed('percent', '10.5', 3, { type: 'backspace' }), ['10.5', 3, false]);
  // pegar con coma decimal se rechaza completo (no se convierte 1,5 en 15)
  assert.deepEqual(ed('percent', '', 0, { type: 'paste', text: '1,5' }), ['', 0, false]);
  assert.deepEqual(ed('percent', '', 0, { type: 'paste', text: '12.5' }), ['12.5', 4, true]);
});
test('el estado devuelto incluye raw y complete', () => {
  const r = M.edit(TEL, { display: '(555) 123-456_', caret: 13 }, { type: 'insert', text: '7' });
  assert.deepEqual([r.raw, r.complete], ['5551234567', true]);
  const s = M.edit('rfc', { display: 'GODE561231GR', caret: 12 }, { type: 'insert', text: '8' });
  assert.deepEqual([s.raw, s.complete], ['GODE561231GR8', true]);
});
