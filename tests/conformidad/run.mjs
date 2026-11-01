#!/usr/bin/env node
// Batería de conformidad de EdiTable (especificación v2 y contrato de 0ed1824).
//
//   node tests/conformidad/run.mjs [--src ruta.js] [--ref ruta.js] [--excel ruta.js]
//                                  [--filtro texto] [--solo actual|correcciones|v2]
//                                  [--paralelo N] [--matriz] [--capturas] [--verbose]
//
// --src     componente bajo prueba (por omisión src/js/induxsoft.controls.editable.js del repo)
// --ref     copia de referencia para R1 (por omisión, la de 0ed1824, extraída con git a una ruta temporal)
// --excel   biblioteca InduxsoftExcel (por omisión src/js/induxsoft.controls.excel.js del repo)
// --mask    (validación) concatena un motor de máscaras suelto y lo expone como EditTable.Mask
// --matriz  además regenera MATRIZ.md con la cobertura
// --capturas además toma una captura de cada ejemplo a examples/v2/capturas/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { servidor, Ctx, clasificar } from './lib/arnes.mjs';
import { escribirInformes, contar } from './lib/informe.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

function args() {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (!k.startsWith('--')) continue;
    const n = k.slice(2);
    if (['matriz', 'capturas', 'verbose'].includes(n)) o[n] = true;
    else o[n] = a[++i];
  }
  return o;
}
const A = args();
const SRC = path.resolve(A.src ?? path.join(RAIZ, 'src/js/induxsoft.controls.editable.js'));
const EXCEL = path.resolve(A.excel ?? path.join(RAIZ, 'src/js/induxsoft.controls.excel.js'));
const MASK = A.mask ? path.resolve(A.mask) : null; // solo para validar el motor de máscaras suelto (src/js/_partes/editable.mask.js)

function referencia() {
  if (A.ref) return path.resolve(A.ref);
  const dir = path.join(os.tmpdir(), 'et-conformidad-ref');
  const f = path.join(dir, 'induxsoft.controls.editable.0ed1824.js');
  if (!fs.existsSync(f)) {
    fs.mkdirSync(dir, { recursive: true });
    const txt = execFileSync('git', ['-C', RAIZ, 'show', '0ed1824:src/js/induxsoft.controls.editable.js'], { maxBuffer: 1 << 26 });
    fs.writeFileSync(f, txt);
  }
  return f;
}
const REF = referencia();
if (REF.startsWith(RAIZ + path.sep)) console.warn('Aviso: la referencia está dentro del repo; se recomienda una ruta temporal.');

async function cargarSuites() {
  const dir = path.join(AQUI, 'suites');
  const arch = fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).sort();
  const suites = [];
  for (const f of arch) {
    const m = await import(pathToFileURL(path.join(dir, f)).href);
    const lista = Array.isArray(m.default) ? m.default : [m.default];
    for (const s of lista) suites.push({ ...s, archivo: f });
  }
  return suites;
}

async function detectarFeatures(browser, srv) {
  const c = new Ctx({ browser, srv, nombre: 'features' });
  await c.abrir({ body: '' });
  const r = await c.ev(() => ({ f: window.__ct.features(), v: window.__ct.version() }));
  await c.cerrar();
  return r;
}

async function main() {
  const t0 = Date.now();
  const suites = await cargarSuites();
  const filtro = (A.filtro ?? '').toLowerCase();
  const solo = A.solo ?? '';
  if (solo && !['actual', 'correcciones', 'v2'].includes(solo)) { console.error('--solo debe ser actual, correcciones o v2'); process.exit(2); }

  const srv = await servidor({ raiz: RAIZ, src: SRC, ref: REF, excel: EXCEL, mask: MASK });
  const browser = await chromium.launch({ headless: true });
  const { f: FEATURES, v: VERSION } = await detectarFeatures(browser, srv);
  const EXCEL_EXISTE = fs.existsSync(EXCEL);
  const disponible = (req) => (req === 'excel-file' ? EXCEL_EXISTE : FEATURES.includes(req));

  const tareas = [];
  for (const s of suites) {
    if (solo && s.grupo !== solo) continue;
    for (const p of s.pruebas) {
      const txt = `${s.nombre} ${p.id} ${p.titulo}`.toLowerCase();
      if (filtro && !txt.includes(filtro)) continue;
      tareas.push({ s, p });
    }
  }

  const resultados = new Array(tareas.length);
  const N = Number(A.paralelo ?? 4);
  const env = { RAIZ, AQUI, OUT: path.join(AQUI, 'out'), FEATURES, VERSION, EXCEL_EXISTE, disponible };
  fs.mkdirSync(path.join(env.OUT, 'tmp'), { recursive: true });

  async function correr(i) {
    const { s, p } = tareas[i];
    const ctx = new Ctx({ browser, srv, nombre: p.id });
    ctx.env = env;
    const ini = Date.now();
    let estado = 'pasada', mensaje = '', tipoErr = '';
    const faltan = (p.requiere ?? []).filter(r => !disponible(r));
    try {
      await Promise.race([
        p.fn(ctx, env),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout: la prueba pasó de ' + (p.limite ?? 25000) + ' ms')), p.limite ?? 25000)),
      ]);
      if (p.defecto) mensaje = `el defecto ${p.defecto} ya no se reproduce`;
    } catch (e) {
      tipoErr = clasificar(e);
      mensaje = String(e && e.message || e).split('\n')[0];
      if (tipoErr === 'pendiente') estado = 'pendiente';
      else if (faltan.length) { estado = 'pendiente'; mensaje = `función no disponible en esta versión (${faltan.join(', ')})` + (tipoErr === 'error' ? ` [aviso arnés: ${mensaje}]` : `: ${mensaje}`); }
      else if (p.defecto && tipoErr === 'falla') estado = 'defecto';
      else estado = (tipoErr === 'error' ? 'error' : 'fallida');
      if (tipoErr === 'error' && A.verbose) console.error(p.id, e);
    } finally {
      await ctx.cerrar();
    }
    if (ctx.notas.length) mensaje = (mensaje ? mensaje + ' · ' : '') + ctx.notas.join(' · ');
    resultados[i] = { suite: s.nombre, grupo: s.grupo, id: p.id, titulo: p.titulo, spec: p.spec ?? [], defecto: p.defecto ?? '',
      requiere: p.requiere ?? [], estado, mensaje, tipoErr, ms: Date.now() - ini };
    const marca = { pasada: '.', fallida: 'F', defecto: 'x', pendiente: 'p', error: 'E' }[estado];
    process.stdout.write(marca);
  }
  // las pruebas de tiempo (serial: true) corren al final, solas, para que la carga en paralelo no las altere
  // Ajuste (AJUSTES.md): las de portapapeles (clp-*) también son seriales, porque el portapapeles de Chromium
  // headless se comparte entre contextos.
  const orden = tareas.map((x, i) => i);
  const esSerial = (p) => !!p.serial || /^clp-/.test(p.id);
  const paralelas = orden.filter(i => !esSerial(tareas[i].p)), seriales = orden.filter(i => esSerial(tareas[i].p));
  let cola = paralelas.slice();
  async function trabajadorCola() { while (cola.length) { const i = cola.shift(); await correr(i); } }
  await Promise.all(Array.from({ length: Math.max(1, N) }, trabajadorCola));
  for (const i of seriales) await correr(i);
  process.stdout.write('\n');

  const meta = { src: path.relative(RAIZ, SRC) || SRC, ref: REF, excel: EXCEL, excelExiste: EXCEL_EXISTE,
    sha: crypto.createHash('sha256').update(fs.readFileSync(SRC)).digest('hex'),
    version: VERSION, features: FEATURES, fecha: new Date().toISOString(), duracion: ((Date.now() - t0) / 1000).toFixed(1),
    filtro: A.filtro ?? '', solo, mask: MASK };
  escribirInformes({ dir: env.OUT, resultados, meta });

  if (A.matriz) {
    const { generarMatriz } = await import('./matriz.mjs');
    generarMatriz({ suites, raiz: RAIZ, aqui: AQUI, resultados });
  }
  if (A.capturas) {
    const { capturar } = await import('./capturas.mjs');
    await capturar({ browser, srv, raiz: RAIZ });
  }

  await browser.close();
  await srv.cerrar();

  const tot = contar(resultados);
  for (const g of ['actual', 'correcciones', 'v2']) {
    const r = resultados.filter(x => x.grupo === g);
    if (!r.length) continue;
    const c = contar(r);
    console.log(`${g.padEnd(13)} ${String(c.total).padStart(4)} pruebas: ${c.pasada} pasadas, ${c.fallida} fallidas, ${c.defecto} defectos conocidos, ${c.pendiente} pendientes, ${c.error} errores`);
  }
  console.log(`Informe: ${path.relative(process.cwd(), path.join(env.OUT, 'report.md'))} · JUnit: ${path.relative(process.cwd(), path.join(env.OUT, 'junit.xml'))}`);
  const avisos = resultados.filter(r => r.tipoErr === 'error');
  if (avisos.length) console.log(`Avisos del arnés (excepciones fuera de la página): ${avisos.map(r => r.id).join(', ')}`);
  process.exitCode = (tot.error > 0) ? 2 : (resultados.some(r => r.grupo === 'actual' && r.estado === 'fallida') ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(3); });
