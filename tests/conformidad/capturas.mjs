// Abre cada ejemplo de examples/v2 en Chromium headless, anota errores de consola y toma una captura PNG.
//   node tests/conformidad/capturas.mjs [--solo actual|v2] [--excel ruta.js]
// También lo llama run.mjs con --capturas.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { servidor } from './lib/arnes.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

export function leerEjemplos(raiz = RAIZ) {
  const txt = fs.readFileSync(path.join(raiz, 'examples/v2/ejemplos.js'), 'utf8');
  return JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1));
}

/** Abre un ejemplo y devuelve {errores, avisoV2}. Si dir viene, guarda la captura. */
export async function abrirEjemplo(browser, base, ej, dir) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push(String(e && e.message || e)));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await page.goto(`${base}/examples/v2/${ej.archivo}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(700);
  const avisoV2 = await page.evaluate(() => !!document.querySelector('.demo-aviso'));
  if (dir) {
    const f = path.join(dir, ej.archivo.replace(/\.html$/, '.png'));
    await page.screenshot({ path: f, type: 'png' });
    try { execFileSync('python3', ['-I', path.join(AQUI, 'lib', 'png_reducir.py'), f]); } catch (e) { /* sin PIL: se queda la captura completa */ }
  }
  await ctx.close();
  return { errores, avisoV2 };
}

export async function capturar({ browser, srv, raiz = RAIZ, solo = '' }) {
  const dir = path.join(raiz, 'examples/v2/capturas');
  fs.mkdirSync(dir, { recursive: true });
  const res = [];
  for (const ej of leerEjemplos(raiz)) {
    if (solo && ej.tipo !== solo) continue;
    const r = await abrirEjemplo(browser, srv.base, ej, dir);
    res.push({ archivo: ej.archivo, tipo: ej.tipo, ...r });
    console.log(`${r.errores.length ? '✗' : '✓'} ${ej.archivo}${r.avisoV2 ? ' (aviso: función no disponible)' : ''}${r.errores.length ? '  ' + r.errores.slice(0, 2).join(' | ') : ''}`);
  }
  return res;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const a = process.argv.slice(2);
  const val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const excel = path.resolve(val('--excel') ?? path.join(RAIZ, 'src/js/induxsoft.controls.excel.js'));
  const srv = await servidor({ raiz: RAIZ, src: path.join(RAIZ, 'src/js/induxsoft.controls.editable.js'), ref: null, excel });
  const browser = await chromium.launch({ headless: true });
  const r = await capturar({ browser, srv, solo: val('--solo') ?? '' });
  await browser.close(); await srv.cerrar();
  process.exitCode = r.some(x => x.tipo === 'actual' && x.errores.length) ? 1 : 0;
}
