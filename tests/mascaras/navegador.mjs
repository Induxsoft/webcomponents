// Prueba EditTableMask.edit() en <input> reales con teclado simulado (Playwright + Chromium).
// Uso: node tests/mascaras/navegador.mjs   (no ejecuta `playwright install`; usa el navegador ya instalado)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Servidor local mínimo: el portapapeles necesita un origen http.
const server = http.createServer((req, res) => {
  const f = path.join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origen = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
let ok = 0, fallas = 0;
try {
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: origen });
  const page = await context.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.goto(`${origen}/tests/mascaras/navegador.html`);

  const estado = id => page.$eval('#' + id, i => ({ v: i.value, c: i.selectionStart, raw: i.dataset.raw, complete: i.dataset.complete }));
  const fijar = (id, value, a, b = a) => page.$eval('#' + id, (i, [v, a, b]) => { i.value = v; i.focus(); i.setSelectionRange(a, b); }, [value, a, b]);
  const pegar = async (id, texto) => {
    await page.evaluate(t => navigator.clipboard.writeText(t), texto);
    await page.focus('#' + id);
    await page.keyboard.press('Control+V');
  };
  const caso = async (nombre, fn, esperado) => {
    try {
      const r = await fn();
      const bien = Object.entries(esperado).every(([k, v]) => r[k] === v);
      if (bien) ok++; else fallas++;
      console.log(`${bien ? 'ok  ' : 'FALLA'} ${nombre}${bien ? '' : ` -> ${JSON.stringify(r)} esperado ${JSON.stringify(esperado)}`}`);
    } catch (e) { fallas++; console.log(`FALLA ${nombre} -> ${e.message}`); }
  };

  await caso('tel: teclear 10 dígitos inserta literales', async () => {
    await fijar('tel', '', 0); await page.keyboard.type('5551234567'); return estado('tel');
  }, { v: '(555) 123-4567', c: 14, raw: '5551234567', complete: 'true' });

  await caso('tel: con el patrón lleno se rechaza otra tecla', async () => {
    await page.keyboard.type('8'); return estado('tel');
  }, { v: '(555) 123-4567', c: 14 });

  await caso('tel: letras y signos se rechazan', async () => {
    await fijar('tel', '', 0); await page.keyboard.type('a(b-'); return estado('tel');
  }, { v: '', c: 0 });

  await caso('tel: backspace después de un literal borra el dígito anterior', async () => {
    await fijar('tel', '(555) 123-4567', 10); await page.keyboard.press('Backspace'); return estado('tel');
  }, { v: '(555) 124-567_', c: 8, raw: '555124567' });

  await caso('tel: backspace repetido hasta vaciar', async () => {
    await fijar('tel', '(55_) ___-____', 3);
    await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace');
    return estado('tel');
  }, { v: '', c: 0 });

  await caso('tel: suprimir sobre un literal borra el dígito siguiente', async () => {
    await fijar('tel', '(555) 123-4567', 4); await page.keyboard.press('Delete'); return estado('tel');
  }, { v: '(555) 234-567_', c: 6 });

  await caso('tel: insertar en medio recorre el resto', async () => {
    await fijar('tel', '(555) 12_-____', 2); await page.keyboard.type('9'); return estado('tel');
  }, { v: '(595) 512-____', c: 3 });

  await caso('tel: mover el cursor con flechas y teclear', async () => {
    await fijar('tel', '(555) 123-4567', 14);
    await page.keyboard.press('Home');
    for (let k = 0; k < 7; k++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowRight'); await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.type('0');
    return estado('tel');
  }, { v: '(555) 104-567_', c: 8 });

  await caso('tel: seleccionar todo y teclear reemplaza', async () => {
    await fijar('tel', '(555) 123-4567', 14); await page.keyboard.press('Control+A'); await page.keyboard.type('9');
    return estado('tel');
  }, { v: '(9__) ___-____', c: 2 });

  await caso('tel: pegar con literales', async () => {
    await fijar('tel', '', 0); await pegar('tel', '(961) 123-4567'); return estado('tel');
  }, { v: '(961) 123-4567', c: 14, complete: 'true' });

  await caso('tel: pegar sin literales y con separadores ajenos', async () => {
    await fijar('tel', '', 0); await pegar('tel', '961.123.4567'); return estado('tel');
  }, { v: '(961) 123-4567', c: 14 });

  await caso('tel: pegar sobre una selección', async () => {
    await fijar('tel', '(961) 123-4567', 6, 9); await pegar('tel', '999'); return estado('tel');
  }, { v: '(961) 999-4567', c: 10 });

  await caso('tel: pegar texto sin dígitos no cambia nada', async () => {
    await fijar('tel', '(96_) ___-____', 3); await pegar('tel', 'hola'); return estado('tel');
  }, { v: '(96_) ___-____', c: 3 });

  await caso('patrón 9999-999-999: pegar más largo que el patrón se corta', async () => {
    await fijar('pat', '', 0); await pegar('pat', '12345678901234'); return estado('pat');
  }, { v: '1234-567-890', c: 12 });

  await caso('rfc: minúsculas a mayúsculas y separadores fuera', async () => {
    await fijar('rfc', '', 0); await page.keyboard.type('gode-561231 gr8'); return estado('rfc');
  }, { v: 'GODE561231GR8', c: 13, complete: 'true' });

  await caso('rfc: backspace en medio', async () => {
    await fijar('rfc', 'GODE561231GR8', 4); await page.keyboard.press('Backspace'); return estado('rfc');
  }, { v: 'GOD561231GR8', c: 3 });

  await caso('percent: no deja pasar de 100 ni de 2 decimales', async () => {
    await fijar('percent', '', 0); await page.keyboard.type('1005.5'); return estado('percent');
  }, { v: '100.', c: 4 });

  await caso('percent: pegar con coma decimal se rechaza', async () => {
    await fijar('percent', '', 0); await pegar('percent', '1,5'); return estado('percent');
  }, { v: '', c: 0 });

  await caso('percent es-CO: coma decimal al teclear; el punto se rechaza', async () => {
    await fijar('percentco', '', 0); await page.keyboard.type('10.,5'); return estado('percentco');
  }, { v: '10,5', c: 4, raw: '10.5', complete: 'true' });

  await caso('percent es-CO: pegar 1,5 es válido', async () => {
    await fijar('percentco', '', 0); await pegar('percentco', '1,5'); return estado('percentco');
  }, { v: '1,5', c: 3, raw: '1.5' });

  await caso('percent es-CO: no deja pasar de 100', async () => {
    await fijar('percentco', '', 0); await page.keyboard.type('100,5'); return estado('percentco');
  }, { v: '100,', c: 4 });

  await caso('sin errores de JavaScript en la página', async () => ({ n: errores.length }), { n: 0 });
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${ok} correctas, ${fallas} fallas`);
process.exit(fallas ? 1 : 0);
