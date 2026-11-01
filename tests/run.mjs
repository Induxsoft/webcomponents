#!/usr/bin/env node
// Banco de pruebas de regresión de EdiTable (F0).
//
//   node tests/run.mjs [--src <ruta.js>] [--update] [--filtro <texto>] [--jobs N] [--rendimiento]
//                      [--escenarios-extra <dir>]... [--ext nombre=<dir>]... [--sin-png] [--salida <dir>] [--golden <dir>] [--lista]
//
// Sin --update compara contra tests/golden/ y escribe tests/out/report.md; sale con código 1 si hay diferencias.
// Ver tests/README.md.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { procesarFoto, comparar, sha, compactarPasos, expandirPasos, aJSON } from './lib/foto.mjs';
import { crearAcciones } from './lib/acciones.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..');

// ---------- argumentos ----------
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const flag = (name) => argv.includes(name);
const opts = (name) => argv.flatMap((a, i) => (a === name && argv[i + 1] !== undefined ? [argv[i + 1]] : []));
const ARGS = {
  src: path.resolve(opt('--src', path.join(REPO, 'src/js/induxsoft.controls.editable.js'))),
  update: flag('--update'),
  filtro: opt('--filtro', null),
  jobs: Number(opt('--jobs', '2')),
  rendimiento: flag('--rendimiento'),
  soloRendimiento: flag('--solo-rendimiento'),
  extra: opts('--escenarios-extra').map(d => path.resolve(d)),
  png: !flag('--sin-png'),
  salida: path.resolve(opt('--salida', path.join(AQUI, 'out'))),
  golden: path.resolve(opt('--golden', path.join(AQUI, 'golden'))),
  lista: flag('--lista'),
};
if (!fs.existsSync(ARGS.src)) { console.error('No existe --src ' + ARGS.src); process.exit(2); }
const SRC_SHA = sha(fs.readFileSync(ARGS.src));

// Raíces de archivos externos servidas en /ext/<nombre>/ (sitios de consumidores privados que no se copian aquí).
// Vienen de --ext nombre=<dir>, de la variable ET_EXT_<NOMBRE> o del banco.json de cada --escenarios-extra
// ({ "ext": { "nombre": "ruta relativa al banco.json" } }), en ese orden de prioridad.
const EXT = {};
for (const d of ARGS.extra) {
  if (!fs.existsSync(path.join(d, 'escenarios'))) { console.error('--escenarios-extra sin carpeta escenarios/: ' + d); process.exit(2); }
  const f = path.join(d, 'banco.json');
  if (fs.existsSync(f)) for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')).ext ?? {})) EXT[k] = path.resolve(d, v);
}
for (const [k, v] of Object.entries(process.env)) { const m = /^ET_EXT_(\w+)$/.exec(k); if (m) EXT[m[1].toLowerCase()] = path.resolve(v); }
for (const x of opts('--ext')) { const i = x.indexOf('='); if (i > 0) EXT[x.slice(0, i)] = path.resolve(x.slice(i + 1)); }

// Los escenarios externos importan el arnés con: await import(process.env.ET_BANCO_URL + 'lib/pagina.mjs')
process.env.ET_BANCO = AQUI;
process.env.ET_BANCO_URL = pathToFileURL(AQUI + path.sep).href;

// Fecha y hora fijas para todas las pruebas (las fechas relativas dependen de "hoy").
export const T0 = new Date('2026-06-15T10:00:00-06:00').getTime();

// ---------- escenarios ----------
const CARPETAS = ['basicos', 'tipos', 'edicion', 'teclado', 'eventos', 'datos', 'arbol', 'tarjetas', 'presentacion', 'impresion', 'v12', 'defectos', 'rendimiento', 'v2'];   // v2: funciones activadas (F2-F6)

async function cargarEscenarios() {
  const lista = [];
  // Raíces: el banco público (carpetas fijas) y cada --escenarios-extra (todas sus carpetas)
  const raices = [{ base: AQUI, golden: ARGS.golden, carpetas: CARPETAS, externa: false },
    ...ARGS.extra.map(d => ({ base: d, golden: path.join(d, 'golden'), externa: true,
      carpetas: fs.readdirSync(path.join(d, 'escenarios'), { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name).sort() }))];
  for (const raiz of raices) for (const c of raiz.carpetas) {
    const dir = path.join(raiz.base, 'escenarios', c);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mjs')).sort()) {
      const mod = await import(pathToFileURL(path.join(dir, f)).href);
      const arr = Array.isArray(mod.default) ? mod.default : (mod.default ? [mod.default] : []);
      for (const e of arr) {
        e.carpeta = c;
        e.archivo = `escenarios/${c}/${f}`;
        e.golden = raiz.golden;
        e.idCompleto = `${c}/${e.id}`;
        lista.push(e);
      }
    }
  }
  const ids = new Set();
  for (const e of lista) { if (ids.has(e.idCompleto)) throw new Error('Escenario repetido: ' + e.idCompleto); ids.add(e.idCompleto); }
  return lista;
}

// ---------- servidor (page.route sobre un origen ficticio) ----------
const ORIGEN = 'http://et.test';
const TIPOS = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain' };

function rutaArchivo(pathname) {
  // Cualquier copia del componente (demos, copias de los consumidores, V12) se sirve con el archivo de --src.
  if (pathname === '/__et/editable.js' || pathname.endsWith('/induxsoft.controls.editable.js')) return ARGS.src;
  // Demos con rutas rotas (examples/induxsoft.controls.js, …opcanva.js): se corrigen SOLO en pruebas.
  const m = /^\/repo\/examples\/(induxsoft\.controls(\.opcanva)?\.js)$/.exec(pathname);
  if (m) return path.join(REPO, 'src/js', m[1]);
  if (pathname.startsWith('/repo/')) return path.join(REPO, decodeURIComponent(pathname.slice(6)));
  if (pathname.startsWith('/fx/')) return path.join(AQUI, 'fixtures', decodeURIComponent(pathname.slice(4)));
  const mx = /^\/ext\/([^/]+)\/(.*)$/.exec(pathname);
  if (mx && EXT[mx[1]]) return path.join(EXT[mx[1]], decodeURIComponent(mx[2]));
  return null;
}

async function prepararRutas(page, esc) {
  await page.route(ORIGEN + '/**', async (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/__escenario.html') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: esc._html });
    let f = rutaArchivo(u.pathname);
    // srcFijo: la pantalla carga en producción una copia propia del componente; ese escenario la usa siempre,
    // sin importar --src ({ ext: '<nombre>', ruta: '<ruta dentro de la raíz>' } o una ruta absoluta).
    if (esc.srcFijo && f === ARGS.src) f = (typeof esc.srcFijo === 'string') ? esc.srcFijo : (EXT[esc.srcFijo.ext] ? path.join(EXT[esc.srcFijo.ext], esc.srcFijo.ruta) : null);
    if (!f || !fs.existsSync(f) || !fs.statSync(f).isFile()) return route.fulfill({ status: 404, contentType: 'text/plain', body: 'no encontrado: ' + u.pathname });
    return route.fulfill({ status: 200, contentType: TIPOS[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  // Nada sale a la red: cualquier otro origen se bloquea.
  await page.route(/^(?!http:\/\/et\.test\/).*/, (route) => route.abort());
}

// ---------- ejecución de un escenario ----------
async function nuevaPagina(browser, esc, { reloj = true } = {}) {
  const vp = esc.viewport ?? { width: 1000, height: 700 };
  const ctx = await browser.newContext({
    viewport: vp, deviceScaleFactor: 1, locale: 'es-MX', timezoneId: 'America/Mexico_City',
    reducedMotion: 'reduce', colorScheme: 'light', hasTouch: false, isMobile: false,
  });
  const page = await ctx.newPage();
  await page.addInitScript((cfg) => { window.__ET_CFG = cfg; }, { seed: esc.semilla ?? 20261101, record: esc.registro ?? 'all', maxCallbacks: esc.maxCallbacks ?? 3000 });
  await page.addInitScript({ path: path.join(AQUI, 'lib/navegador.js') });
  if (reloj) {
    await page.clock.install({ time: T0 });
    await page.clock.pauseAt(T0 + 1000);
    // Cuenta los setInterval (sobre el reloj simulado; informativo)
    await page.addInitScript(() => { const si = window.setInterval; window.__etIntervals = 0; window.setInterval = function () { window.__etIntervals++; return si.apply(this, arguments); }; });
  }
  await prepararRutas(page, esc);
  return { ctx, page };
}

async function ejecutar(browser, esc, almacen) {
  if (esc.html === undefined && !esc.url) throw new Error('El escenario no define html ni url');
  esc._html = (typeof esc.html === 'function') ? await esc.html({ ext: (n) => '/ext/' + n }) : esc.html;
  const { ctx, page } = await nuevaPagina(browser, esc);
  const errores = [], consola = [];
  page.on('pageerror', (e) => errores.push('pageerror: ' + (e && e.message)));
  page.on('console', (m) => { if (m.type() !== 'debug') consola.push(m.type() + ': ' + m.text()); });
  page.on('dialog', async (d) => { errores.push(`dialog ${d.type()}: ${d.message()}`); try { await d.accept(); } catch { } });
  const h = crearAcciones(page, { errores });
  const pasos = [];
  const foto = async (nombre) => {
    const raw = await page.evaluate((o) => window.__etSnap(o), { raiz: esc.raiz ?? null, estilos: esc.estilos ?? true });
    raw.errores = errores.splice(0);
    raw.consola = consola.splice(0);
    pasos.push({ nombre, foto: procesarFoto(raw, { privado: !!esc.privado, almacen }) });
  };
  let png = null;
  try {
    const url = esc.url ? ORIGEN + esc.url : ORIGEN + '/__escenario.html';
    await page.goto(url, { waitUntil: 'load' });
    await h.asentar(100);
    await h.asentar();
    if (esc.antesDeFoto) await esc.antesDeFoto(h);
    if (esc.fotoInicial !== false) await foto('inicio');
    for (const [nombre, fn, opts] of (esc.pasos ?? [])) {
      try { await fn(h); } catch (e) { e.message = `paso «${nombre}»: ` + e.message; throw e; }
      await h.asentar();
      if (!(opts && opts.sinFoto)) await foto(nombre);
    }
    if (ARGS.png && esc.captura !== false) {
      const sel = esc.captura ?? null;
      let clip = null;
      if (sel) {
        clip = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.x)), y: Math.max(0, Math.floor(r.y)), width: Math.ceil(r.width), height: Math.ceil(r.height) }; }, sel);
      } else {
        clip = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('edit-table'));
          if (!els.length) return null;
          let x1 = Infinity, y1 = Infinity, x2 = 0, y2 = 0;
          els.forEach(e => { const r = e.getBoundingClientRect(); if (!r.width && !r.height) return; x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom); });
          if (!isFinite(x1)) return null;
          return { x: Math.max(0, Math.floor(x1)), y: Math.max(0, Math.floor(y1)), width: Math.ceil(x2 - x1), height: Math.ceil(y2 - y1) };
        });
      }
      const vp = page.viewportSize();
      if (clip) {
        clip.width = Math.max(1, Math.min(clip.width, vp.width - clip.x));
        clip.height = Math.max(1, Math.min(clip.height, vp.height - clip.y, 700));
      }
      png = await page.screenshot({ clip: clip ?? undefined, animations: 'disabled', caret: 'hide' });
    }
  } finally {
    await ctx.close();
  }
  return { id: esc.idCompleto, titulo: esc.titulo ?? '', etiquetas: esc.etiquetas ?? [], pasos, png };
}

// ---------- comparación de PNG (tolerante; solo informativa) ----------
async function compararPng(browser, a, b) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    return await page.evaluate(async ([pa, pb]) => {
      const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(pa), load(pb)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { igual: false, motivo: `tamaño ${ia.width}x${ia.height} -> ${ib.width}x${ib.height}` };
      const c = (img) => { const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const x = cv.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
      const da = c(ia), db = c(ib);
      let n = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) > 24 || Math.abs(da[i + 1] - db[i + 1]) > 24 || Math.abs(da[i + 2] - db[i + 2]) > 24) n++;
      const total = da.length / 4;
      return { igual: n / total <= 0.001, pixeles: n, total, motivo: n ? `${n} de ${total} píxeles distintos` : '' };
    }, [a.toString('base64'), b.toString('base64')]);
  } finally { await ctx.close(); }
}

// ---------- rendimiento ----------
async function ejecutarRendimiento(browser, esc) {
  esc._html = (typeof esc.html === 'function') ? await esc.html({}) : esc.html;
  const { ctx, page } = await nuevaPagina(browser, esc, { reloj: false });
  try {
    await page.goto(ORIGEN + '/__escenario.html', { waitUntil: 'load' });
    await page.evaluate(() => window.__etFlush());
    return await esc.medir(page);
  } finally { await ctx.close(); }
}

// ---------- utilidades ----------
const leerJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const escribir = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

async function pool(items, n, fn) {
  const res = new Array(items.length);
  let i = 0;
  const work = async () => { while (i < items.length) { const k = i++; res[k] = await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.max(1, n) }, work));
  return res;
}

// ---------- principal ----------
async function main() {
  const todos = await cargarEscenarios();
  let lista = todos.filter(e => e.carpeta !== 'rendimiento' && e.tipo !== 'rendimiento');
  let perf = todos.filter(e => e.tipo === 'rendimiento');
  if (ARGS.filtro) { lista = lista.filter(e => e.idCompleto.includes(ARGS.filtro)); perf = perf.filter(e => e.idCompleto.includes(ARGS.filtro)); }
  if (ARGS.soloRendimiento) lista = [];
  if (ARGS.lista) { todos.forEach(e => console.log(e.idCompleto + '\t' + (e.titulo ?? ''))); return 0; }

  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb', '--disable-gpu'] });
  const version = browser.version();
  const almacenes = new Map(); // golden -> Map(sha -> css)
  const almacenDe = (g) => { if (!almacenes.has(g)) almacenes.set(g, new Map()); return almacenes.get(g); };
  const resultados = [];
  const t0 = Date.now();
  console.log(`EdiTable F0 · ${lista.length} escenarios · src ${path.relative(process.cwd(), ARGS.src) || ARGS.src} (sha256 ${SRC_SHA.slice(0, 12)}) · Chrome ${version} · ${ARGS.update ? 'ACTUALIZAR referencia' : 'comparar'}`);

  await pool(lista, ARGS.jobs, async (esc) => {
    const r = { id: esc.idCompleto, titulo: esc.titulo, etiquetas: esc.etiquetas ?? [], estado: '', difs: [], png: null };
    const falta = (esc.requiere ?? []).filter(n => !EXT[n] || !fs.existsSync(EXT[n]));
    if (falta.length) {
      r.estado = 'omitido'; r.motivo = 'falta la raíz externa ' + falta.map(n => `«${n}» (--ext ${n}=<dir>${EXT[n] ? '; no existe ' + EXT[n] : ''})`).join(', ');
      resultados.push(r); console.log('  omitido   ' + r.id); return;
    }
    let act;
    try { act = await ejecutar(browser, esc, almacenDe(esc.golden)); }
    catch (e) { r.estado = 'error'; r.motivo = String(e && e.stack || e); resultados.push(r); console.log('  ERROR     ' + r.id + ': ' + (e && e.message)); return; }
    const fGold = path.join(esc.golden, esc.idCompleto + '.json');
    const fPng = path.join(esc.golden, esc.idCompleto + '.png');
    const guardado = { id: act.id, titulo: act.titulo, etiquetas: act.etiquetas, archivo: esc.archivo, pasos: act.pasos };
    const texto = aJSON({ ...guardado, pasos: compactarPasos(guardado.pasos) }) + '\n';
    escribir(path.join(ARGS.salida, 'actual', esc.idCompleto + '.json'), texto);
    if (act.png) escribir(path.join(ARGS.salida, 'png', esc.idCompleto + '.png'), act.png);
    if (ARGS.update) {
      escribir(fGold, texto);
      if (act.png) escribir(fPng, act.png);
      r.estado = 'actualizado';
    } else if (!fs.existsSync(fGold)) {
      r.estado = 'sin-referencia';
    } else {
      const ref = leerJSON(fGold);
      ref.pasos = expandirPasos(ref.pasos);
      r.difs = comparar(ref, guardado);
      const estrictas = r.difs.filter(d => d.estricta);
      r.estado = estrictas.length ? 'DIFERENTE' : (r.difs.length ? 'igual (informativo)' : 'igual');
      if (act.png && fs.existsSync(fPng)) {
        try { r.png = await compararPng(browser, fs.readFileSync(fPng), act.png); } catch (e) { r.png = { igual: false, motivo: 'no se pudo comparar: ' + e.message }; }
      }
    }
    resultados.push(r);
    const marca = r.estado.startsWith('igual') || r.estado === 'actualizado' ? '  ' : '* ';
    console.log(`${marca}${r.estado.padEnd(10)} ${r.id}${r.difs.length ? ` (${r.difs.length} dif.)` : ''}${r.png && !r.png.igual ? ' [visual: ' + r.png.motivo + ']' : ''}`);
  });

  // Almacén de CSS
  if (ARGS.update) for (const [g, almacen] of almacenes) {
    const dirE = path.join(g, '_estilos');
    if (!ARGS.filtro) fs.rmSync(dirE, { recursive: true, force: true });
    for (const [h, t] of almacen) escribir(path.join(dirE, h + '.css'), t);
    escribir(path.join(g, 'meta.json'), JSON.stringify({
      generado: new Date().toISOString(), chrome: version, plataforma: `${process.platform} ${process.arch}`, node: process.version,
      src: path.relative(REPO, ARGS.src), srcSha256: SRC_SHA, escenarios: resultados.filter(r => lista.find(e => e.idCompleto === r.id)?.golden === g).length,
    }, null, 1) + '\n');
  }
  for (const almacen of almacenes.values()) for (const [h, t] of almacen) escribir(path.join(ARGS.salida, '_estilos', h + '.css'), t);

  // Rendimiento
  let perfRes = null;
  if (ARGS.rendimiento || ARGS.soloRendimiento) {
    perfRes = { fecha: new Date().toISOString(), chrome: version, plataforma: `${process.platform} ${process.arch}`, cpus: (await import('node:os')).cpus().map(c => c.model)[0] + ' x' + (await import('node:os')).cpus().length, src: path.relative(REPO, ARGS.src), srcSha256: SRC_SHA, mediciones: {} };
    for (const esc of perf) {
      console.log('  midiendo  ' + esc.idCompleto);
      try { perfRes.mediciones[esc.idCompleto] = await ejecutarRendimiento(browser, esc); }
      catch (e) { perfRes.mediciones[esc.idCompleto] = { error: String(e.message) }; }
      console.log('            ' + JSON.stringify(perfRes.mediciones[esc.idCompleto]));
    }
    escribir(path.join(ARGS.salida, 'rendimiento.json'), JSON.stringify(perfRes, null, 1) + '\n');
    if (ARGS.update) escribir(path.join(ARGS.golden, 'rendimiento.json'), JSON.stringify(perfRes, null, 1) + '\n');
  }
  await browser.close();

  // Informe
  resultados.sort((a, b) => a.id.localeCompare(b.id));
  const meta = fs.existsSync(path.join(ARGS.golden, 'meta.json')) ? leerJSON(path.join(ARGS.golden, 'meta.json')) : null;
  const golden = new Set();
  for (const g of (ARGS.filtro ? [] : [ARGS.golden, ...ARGS.extra.map(d => path.join(d, 'golden'))])) {
    if (!fs.existsSync(g)) continue;
    const walk = (d, pre) => fs.readdirSync(d, { withFileTypes: true }).forEach(x => { if (x.isDirectory() && x.name !== '_estilos') walk(path.join(d, x.name), pre + x.name + '/'); else if (x.name.endsWith('.json') && pre) golden.add(pre + x.name.slice(0, -5)); });
    walk(g, '');
  }
  const huerfanos = [...golden].filter(g => !resultados.some(r => r.id === g));
  const fallan = resultados.filter(r => ['DIFERENTE', 'error', 'sin-referencia'].includes(r.estado));
  const md = [];
  md.push('# Banco de regresión de EdiTable: informe', '');
  md.push(`- Fecha: ${new Date().toISOString()}`);
  md.push(`- Componente: \`${path.relative(REPO, ARGS.src) || ARGS.src}\` (sha256 \`${SRC_SHA}\`)`);
  md.push(`- Chrome: ${version}${meta && meta.chrome !== version ? ` (**la referencia se generó con ${meta.chrome}**: los anchos calculados y las PNG pueden variar)` : ''}`);
  if (meta) md.push(`- Referencia: generada ${meta.generado} con \`${meta.src}\` (sha256 \`${meta.srcSha256.slice(0, 16)}…\`)`);
  if (ARGS.extra.length) md.push(`- Escenarios externos: ${ARGS.extra.map(d => '`' + d + '`').join(', ')}`);
  md.push(`- Modo: ${ARGS.update ? 'actualizar referencia' : 'comparar'} · duración ${Math.round((Date.now() - t0) / 1000)} s`);
  const cuenta = {};
  resultados.forEach(r => { cuenta[r.estado] = (cuenta[r.estado] || 0) + 1; });
  md.push(`- Resultado: ${Object.entries(cuenta).map(([k, v]) => `${k}: ${v}`).join(' · ')}${huerfanos.length ? ` · referencias sin escenario: ${huerfanos.length}` : ''}`);
  md.push('', fallan.length ? `**${fallan.length} escenario(s) con diferencias o errores.**` : '**Sin diferencias estrictas.**', '');
  const visuales = resultados.filter(r => r.png && !r.png.igual);
  if (fallan.length) {
    md.push('## Escenarios con diferencias', '', '| Escenario | Estado | Etiquetas | Categorías |', '|---|---|---|---|');
    for (const r of fallan) md.push(`| \`${r.id}\` | ${r.estado} | ${(r.etiquetas || []).join(', ')} | ${[...new Set(r.difs.filter(d => d.estricta).map(d => d.categoria.replace(/^tablas\[\d+\]#?[^.]*\./, 'tabla.')))].join(', ') || (r.motivo ? r.motivo.split('\n')[0] : '')} |`);
    md.push('');
  }
  if (visuales.length) {
    md.push('## Diferencias visuales (PNG, solo informativas)', '');
    visuales.forEach(r => md.push(`- \`${r.id}\`: ${r.png.motivo}`));
    md.push('');
  }
  const informativos = resultados.filter(r => r.difs.some(d => !d.estricta));
  if (informativos.length) {
    md.push('## Diferencias informativas (no fallan)', '');
    informativos.forEach(r => md.push(`- \`${r.id}\`: ${[...new Set(r.difs.filter(d => !d.estricta).map(d => d.categoria))].join(', ')}`));
    md.push('');
  }
  if (huerfanos.length) { md.push('## Referencias sin escenario', '', ...huerfanos.map(h => `- \`${h}\``), ''); }
  const omit = resultados.filter(r => r.estado === 'omitido');
  if (omit.length) { md.push('## Omitidos', '', ...omit.map(r => `- \`${r.id}\`: ${r.motivo}`), ''); }
  md.push('## Detalle de diferencias', '');
  fs.rmSync(path.join(ARGS.salida, 'diff'), { recursive: true, force: true });
  for (const r of resultados.filter(x => x.difs.length || x.estado === 'error')) {
    const lines = [`# ${r.id} (${r.estado})`, ''];
    if (r.motivo) lines.push(r.motivo, '');
    for (const d of r.difs) { lines.push(`## paso ${d.paso} · ${d.categoria}${d.estricta ? '' : ' (informativa)'}`, ...d.diff, ''); }
    const f = path.join(ARGS.salida, 'diff', r.id + '.diff');
    escribir(f, lines.join('\n') + '\n');
    md.push(`### \`${r.id}\``, '', `Archivo: \`${path.relative(ARGS.salida, f)}\``, '');
    const first = r.difs.filter(d => d.estricta).slice(0, 3);
    for (const d of first) md.push(`- paso **${d.paso}**, \`${d.categoria}\`:`, '', '```diff', ...d.diff.slice(0, 40), '```', '');
  }
  if (perfRes) {
    md.push('## Rendimiento', '', '| Escenario | Medición (ms) |', '|---|---|');
    for (const [k, v] of Object.entries(perfRes.mediciones)) md.push(`| \`${k}\` | ${Object.entries(v).map(([a, b]) => `${a}: ${b}`).join(' · ')} |`);
    md.push('');
  }
  escribir(path.join(ARGS.salida, 'report.md'), md.join('\n') + '\n');
  escribir(path.join(ARGS.salida, 'resultados.json'), JSON.stringify(resultados.map(r => ({ id: r.id, estado: r.estado, etiquetas: r.etiquetas, difs: r.difs.map(d => ({ paso: d.paso, categoria: d.categoria, estricta: d.estricta })), png: r.png, motivo: r.motivo })), null, 1) + '\n');
  console.log(`\n${resultados.length} escenarios en ${Math.round((Date.now() - t0) / 1000)} s · ${Object.entries(cuenta).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
  console.log('Informe: ' + path.relative(process.cwd(), path.join(ARGS.salida, 'report.md')));
  return (ARGS.update ? 0 : (fallan.length || huerfanos.length ? 1 : 0));
}

main().then(code => process.exit(code), (e) => { console.error(e); process.exit(2); });
