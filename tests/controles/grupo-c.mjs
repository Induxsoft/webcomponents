#!/usr/bin/env node
// Tema en los controles del grupo C (tests/theme/CONTROLES.md): CustomSchedule (custom-schedule), OpCanva (op-canva)
// y AvailabilityScheduler (availability-scheduler). Estos archivos no traen el módulo de tema: usan
// window.InduxsoftTheme si existe. Sin red: las páginas se sirven con page.route.
//
//   node tests/controles/grupo-c.mjs [--base 8b81486] [--filtro texto] [--verbose]
//
// 1. Sin tema (sin el módulo, con el módulo y sin data-et-theme, con «ninguno»): igual que la versión base
//    (HTML del shadow, hojas, getComputedStyle de todos sus elementos y píxeles de la página).
// 2. Con tema (claro, oscuro, jade, libro-mayor y auto): <style data-ix-theme> al principio del shadow, colores de la
//    paleta, alto de la densidad y contraste AA.
// 3. En caliente: data-et-theme del <html> y theme propio cambian el control; «ninguno» lo deja como estaba.
// 4. Capturas a tests/out/controles/<control>-<tema>.png (deviceScaleFactor 1).
// Código de salida: 0 si todo pasa, 1 si alguna prueba falla, 2 si el arnés falla.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const BASE = opt('--base', '8b81486');
const FILTRO = opt('--filtro', null);
const VERBOSE = argv.includes('--verbose');
const SALIDA = path.join(REPO, 'tests/out/controles');
const TEMA_JS = fs.readFileSync(path.join(REPO, 'src/js/induxsoft.theme.js'));
const TEMAS = ['claro', 'oscuro', 'jade', 'libro-mayor'];

const EVENTOS = JSON.stringify([
  { id: 'e1', start: '2025-06-16 09:30', duration: 60, caption: 'Junta de ventas' },
  { id: 'e2', start: '2025-06-17 10:00', duration: 30, caption: 'Llamada', backcolor: '#FFD8A8', color: '#3B2300' },
  { id: 'e3', start: '2025-06-18 11:30', duration: 60, caption: 'Revisión' },
]);
const DATOS_OC = JSON.stringify([
  { id: 'i1', x: 20, y: 20, lx: 900, ly: 500, html: 'Mesa 1', sizable: true },
  { id: 'i2', x: 1100, y: 20, lx: 700, ly: 500, html: 'Mesa 2', color: '#7A1F00', 'background-color': '#FFE3D6' },
  { id: 'i3', x: 20, y: 700, lx: 1800, ly: 400, html: 'Barra', locked: true },
]);
const VALOR_AS = JSON.stringify({
  monday: { available: true, slots: [{ start: '09:00:00', end: '13:00:00' }, { start: '15:00:00', end: '17:00:00' }] },
  tuesday: { available: false, slots: [] },
  wednesday: { available: true, slots: [] },
});

const CONTROLES = {
  'custom-schedule': {
    archivo: 'src/js/induxsoft.controls.schedule.js',
    body: `<custom-schedule id="c1" style="display:block;height:420px;width:760px" day="2025-06-16" view="week" start-weekday="monday"
      start-lab-hour="9" end-lab-hour="13" weekend="saturday,sunday" breaks="12:00-12:30" holidays="2025-06-19" events='${EVENTOS}'></custom-schedule>`,
  },
  'op-canva': {
    archivo: 'src/js/induxsoft.controls.opcanva.js',
    body: `<div style="width:760px;height:380px"><op-canva id="c1" lx="2000" ly="1200" data='${DATOS_OC}'></op-canva></div>`,
  },
  'availability-scheduler': {
    archivo: 'src/js/availability-scheduler.js',
    body: `<availability-scheduler id="c1" style="width:760px" min-time="08:00:00" max-time="18:00:00" value='${VALOR_AS}'></availability-scheduler>
<availability-scheduler id="c2" style="width:760px;margin-top:8px" min-time="08:00:00" max-time="18:00:00" value='${VALOR_AS}'></availability-scheduler>
<script>document.getElementById('c2').setView('inputs');</script>`,
  },
};

const fuentes = {};
for (const [tag, c] of Object.entries(CONTROLES)) {
  fuentes[tag] = {
    nuevo: fs.readFileSync(path.join(REPO, c.archivo)),
    base: execSync(`git -C ${JSON.stringify(REPO)} show ${BASE}:${c.archivo}`, { encoding: 'utf8' }),
  };
}

function pagina(tag, o) {
  return `<!DOCTYPE html><html lang="es"${o.html ? ' data-et-theme="' + o.html + '"' : ''}><head><meta charset="utf-8"><title>${tag}</title>
<style>body{margin:0;padding:12px;font-family:Arial,sans-serif}</style>
${o.modulo ? '<script src="/theme.js"></script>' : ''}
<script src="/ctl.js"></script>
</head><body>
${CONTROLES[tag].body}
</body></html>`;
}

async function abrir(browser, tag, o) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 820 }, deviceScaleFactor: 1, colorScheme: o.esquema || 'light' });
  const page = await ctx.newPage();
  const errores = [];
  await page.addInitScript(() => { const a = Element.prototype.attachShadow; Element.prototype.attachShadow = function (i) { return a.call(this, Object.assign({}, i, { mode: 'open' })); }; });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errores.push('console: ' + m.text()); });
  await page.route('http://gc.test/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: pagina(tag, o) });
    if (u.pathname === '/theme.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: TEMA_JS });
    if (u.pathname === '/ctl.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: o.base ? fuentes[tag].base : fuentes[tag].nuevo });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.route(/^(?!http:\/\/gc\.test\/).*/, r => r.abort());
  await page.goto('http://gc.test/');
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(80);
  return { ctx, page, errores };
}

// Todo lo que se compara en «sin tema»: atributos del host, HTML del shadow, hojas y estilo computado.
async function foto(page, tag) {
  return page.evaluate((tag) => {
    const out = [];
    const calc = (el, pseudo) => { const s = getComputedStyle(el, pseudo); const o = []; for (let i = 0; i < s.length; i++) o.push(s[i] + ':' + s.getPropertyValue(s[i])); return o.join(';'); };
    document.querySelectorAll(tag).forEach(h => {
      const sr = h.shadowRoot;
      const els = sr ? Array.from(sr.querySelectorAll('*')).filter(e => e.localName !== 'style') : [];
      out.push({
        attrs: Array.from(h.attributes).map(a => a.name + '=' + a.value),
        html: sr ? sr.innerHTML : null,
        hojas: sr ? Array.from(sr.querySelectorAll('style')).map(s => s.textContent) : [],
        adoptadas: sr ? sr.adoptedStyleSheets.length : 0,
        host: calc(h),
        calc: els.map(e => calc(e)),
        after: els.map(e => calc(e, '::after')),
      });
    });
    return { ctl: out, head: document.head.querySelectorAll('style[data-ix-theme]').length, html: Array.from(document.documentElement.attributes).map(a => a.name).join(',') };
  }, tag);
}

function primeraDif(a, b, ruta = '') {
  if (typeof a !== typeof b) return ruta + ': tipo';
  if (a && typeof a === 'object') {
    const ks = new Set([...Object.keys(a), ...Object.keys(b || {})]);
    for (const k of ks) { const d = primeraDif(a[k], (b || {})[k], ruta + '.' + k); if (d) return d; }
    return null;
  }
  if (a === b) return null;
  const sa = String(a), sb = String(b);
  let i = 0; while (i < sa.length && sa[i] === sb[i]) i++;
  return `${ruta}: «${sa.slice(Math.max(0, i - 60), i + 80)}» ≠ «${sb.slice(Math.max(0, i - 60), i + 80)}»`;
}

// Comprobaciones con tema, en la página. Devuelve [{ok, msg}] .
async function revisarTema(page, tag, efectivo, densidad = 'normal') {
  return page.evaluate(({ tag, efectivo, densidad }) => {
    const T = window.InduxsoftTheme, pal = T.theme(efectivo), padres = T.parents;
    const r = [];
    const ok = (c, m) => r.push({ ok: !!c, msg: m });
    const sonda = document.createElement('i'); document.body.append(sonda);
    const norm = v => { sonda.style.color = ''; sonda.style.color = v; return getComputedStyle(sonda).color; };
    const P = k => { let x = pal[k]; let p = k; while (x == null && padres[p]) { p = padres[p]; x = pal[p]; } return x; };
    const C = k => norm(P(k));
    const cs = (el, prop, pseudo) => getComputedStyle(el, pseudo || null).getPropertyValue(prop);
    const igual = (el, prop, k, que) => { const v = norm(cs(el, prop)); ok(v === C(k), `${que} ${prop} = ${k}: ${v} vs ${C(k)}`); };
    const aa = (fg, bg, que, min = 4.5) => { const c = T.contrast(norm(fg), norm(bg)); ok(c >= min, `contraste ${que}: ${c.toFixed(2)} ≥ ${min}`); };
    const alto = { compacta: 28, normal: 34, comoda: 42 }[densidad], fila = { compacta: 26, normal: 32, comoda: 40 }[densidad];
    const host = document.getElementById('c1'), sr = host.shadowRoot;
    ok(sr.firstChild && sr.firstChild.localName === 'style' && sr.firstChild.hasAttribute('data-ix-theme'), 'style[data-ix-theme] al principio del shadow');
    ok(!host.hasAttribute('class'), 'el host no recibe clases');
    if (tag === 'custom-schedule') {
      const wr = sr.getElementById('schedule-wrapper'), th = sr.querySelector('thead th:nth-child(2)'), hora = sr.querySelector('tbody th');
      const td = sr.querySelector('td.monday'), ro = sr.querySelector('td.saturday'), fer = sr.querySelector('td[data-date="2025-06-19"]');
      const e1 = sr.getElementById('e1'), e2 = sr.getElementById('e2');
      igual(wr, 'background-color', 'bg', 'fondo'); igual(wr, 'color', 'fg', 'texto');
      igual(th, 'background-color', 'header-bg', 'encabezado'); igual(th, 'color', 'header-fg', 'encabezado');
      igual(hora, 'background-color', 'header-bg', 'columna de horas');
      igual(td, 'outline-color', 'border', 'celda');
      igual(ro, 'background-color', 'input-disabled-bg', 'fin de semana'); igual(fer, 'background-color', 'input-disabled-bg', 'feriado');
      igual(e1, 'background-color', 'sel-bg-soft', 'evento'); igual(e1, 'color', 'fg', 'evento');
      ok(norm(cs(e2, 'background-color')) === norm('#FFD8A8') && norm(cs(e2, 'color')) === norm('#3B2300'), 'evento con colores propios los conserva');
      ok(Math.abs(td.offsetHeight - fila) <= 1, `alto de fila ${td.offsetHeight} ≈ ${fila}`);
      ok(cs(td, 'font-size') === { compacta: '13px', normal: '14px', comoda: '15px' }[densidad], 'letra de la densidad: ' + cs(td, 'font-size'));
      aa(cs(th, 'color'), cs(th, 'background-color'), 'encabezado');
      aa(cs(e1, 'color'), cs(e1, 'background-color'), 'evento');
      aa(cs(wr, 'color'), cs(wr, 'background-color'), 'texto/fondo');
      aa(P('fg'), P('hover-bg'), 'fila hover');
    }
    if (tag === 'op-canva') {
      const cont = sr.getElementById('OpCanva_contnr'), inp = sr.getElementById('OpCanva_fitInput'), sel = sr.getElementById('OpCanva_unitSlect');
      const tit = sr.getElementById('OpCanva_fitTitle'), pie = sr.getElementById('OpCanva_cfootr'), lienzo = sr.getElementById('OpCanva_ccanva');
      const i1 = sr.getElementById('i1'), i2 = sr.getElementById('i2');
      igual(cont, 'background-color', 'bg', 'contenedor');
      for (const [el, n] of [[inp, 'campo'], [sel, 'lista']]) {
        igual(el, 'background-color', 'input-bg', n); igual(el, 'color', 'input-fg', n); igual(el, 'border-top-color', 'input-border', n);
        ok(el.offsetHeight === alto, `${n} alto ${el.offsetHeight} = ${alto}`);
        ok(cs(el, 'border-top-left-radius') === (P('radius') === '0' ? '0px' : P('radius')), `${n} radio ${cs(el, 'border-top-left-radius')}`);
        aa(cs(el, 'color'), cs(el, 'background-color'), n);
      }
      igual(tit, 'color', 'muted-fg', 'título'); aa(cs(tit, 'color'), cs(pie, 'background-color'), 'título/pie');
      igual(lienzo, 'background-color', 'input-bg', 'lienzo');
      igual(i1, 'color', 'fg', 'elemento sin color');
      ok(norm(cs(i2, 'color')) === norm('#7A1F00') && norm(cs(i2, 'background-color')) === norm('#FFE3D6'), 'elemento con colores propios los conserva');
      aa(cs(i1, 'color'), cs(lienzo, 'background-color'), 'elemento/lienzo');
    }
    if (tag === 'availability-scheduler') {
      const sr2 = document.getElementById('c2').shadowRoot;
      const t = sr2.querySelector('input[type="time"]'), seg = sr.querySelector('.segmented button[aria-pressed="true"]'), seg2 = sr.querySelector('.segmented button[aria-pressed="false"]');
      const lab = sr.querySelector('.day-label'), sw = sr.querySelector('.switch-label'), btn = sr.querySelector('.icon-btn'), on = sr.querySelector('.cell[aria-pressed="true"]');
      const add = sr2.querySelector('.add-range');
      igual(host, 'background-color', 'bg', 'host'); igual(host, 'color', 'fg', 'host');
      igual(t, 'background-color', 'input-bg', 'hora'); igual(t, 'color', 'input-fg', 'hora'); igual(t, 'border-top-color', 'input-border', 'hora');
      ok(t.offsetHeight === alto, `hora alto ${t.offsetHeight} = ${alto}`);
      igual(seg, 'background-color', 'sel-bg', 'vista activa'); igual(seg, 'color', 'sel-fg', 'vista activa');
      igual(lab, 'color', 'fg', 'día'); igual(sw, 'color', 'muted-fg', 'estado');
      igual(btn, 'background-color', 'bg', 'botón'); igual(btn, 'color', 'fg', 'botón'); igual(btn, 'border-top-color', 'input-border', 'botón');
      ok(btn.offsetHeight === alto, `botón alto ${btn.offsetHeight} = ${alto}`);
      ok(add.offsetHeight === alto, `agregar alto ${add.offsetHeight} = ${alto}`);
      igual(on, 'background-color', 'accent', 'celda marcada');
      aa(cs(t, 'color'), cs(t, 'background-color'), 'hora');
      aa(cs(seg, 'color'), cs(seg, 'background-color'), 'vista activa');
      aa(cs(seg2, 'color'), cs(sr.querySelector('.segmented'), 'background-color'), 'vista inactiva');
      aa(cs(lab, 'color'), cs(host, 'background-color'), 'día');
      aa(cs(sw, 'color'), cs(host, 'background-color'), 'estado');
      aa(cs(btn, 'color'), cs(btn, 'background-color'), 'botón');
      aa(cs(add, 'color'), cs(host, 'background-color'), 'agregar rango');
      aa(P('accent'), P('input-disabled-bg'), 'celda marcada/libre', 3);
    }
    sonda.remove();
    return r;
  }, { tag, efectivo, densidad });
}

const PRUEBAS = [];
for (const tag of Object.keys(CONTROLES)) {
  for (const [nombre, o] of [['sin el módulo', { modulo: false }], ['módulo sin data-et-theme', { modulo: true }], ['módulo y «ninguno»', { modulo: true, html: 'ninguno' }]]) {
    PRUEBAS.push({
      id: `${tag} · sin tema · ${nombre}`,
      fn: async (browser, ok) => {
        const a = await abrir(browser, tag, { ...o, base: true }), b = await abrir(browser, tag, o);
        try {
          const fa = await foto(a.page, tag), fb = await foto(b.page, tag);
          const d = primeraDif(fa, fb);
          ok(!d, 'DOM, hojas y estilo computado iguales a ' + BASE + (d ? ' — ' + d : ''));
          ok(fb.head === 0 && fb.ctl.every(c => !c.hojas.some(h => /tema/.test(h) && /ix-t-/.test(h))), 'sin <style data-ix-theme>');
          const pa = await a.page.screenshot({ fullPage: true }), pb = await b.page.screenshot({ fullPage: true });
          ok(pa.equals(pb), 'píxeles iguales');
          ok(!b.errores.length, 'sin errores: ' + b.errores.join(' | '));
        } finally { await a.ctx.close(); await b.ctx.close(); }
      }
    });
  }
  for (const tema of [...TEMAS, 'auto']) {
    PRUEBAS.push({
      id: `${tag} · tema ${tema}`,
      fn: async (browser, ok) => {
        const x = await abrir(browser, tag, { modulo: true, html: tema, esquema: tema === 'auto' ? 'dark' : 'light' });
        try {
          (await revisarTema(x.page, tag, tema === 'auto' ? 'oscuro' : tema)).forEach(c => ok(c.ok, c.msg));
          ok(!x.errores.length, 'sin errores: ' + x.errores.join(' | '));
          if (tema !== 'auto') {
            fs.mkdirSync(SALIDA, { recursive: true });
            await x.page.screenshot({ path: path.join(SALIDA, `${tag}-${tema}.png`), fullPage: true });
          }
        } finally { await x.ctx.close(); }
      }
    });
  }
  PRUEBAS.push({
    id: `${tag} · densidad compacta propia`,
    fn: async (browser, ok) => {
      const x = await abrir(browser, tag, { modulo: true, html: 'claro' });
      try {
        await x.page.evaluate(() => document.querySelectorAll('[id^="c"]').forEach(h => h.setAttribute('density', 'compacta')));
        await x.page.waitForTimeout(60);
        (await revisarTema(x.page, tag, 'claro', 'compacta')).forEach(c => ok(c.ok, c.msg));
      } finally { await x.ctx.close(); }
    }
  });
  PRUEBAS.push({
    id: `${tag} · en caliente`,
    fn: async (browser, ok) => {
      const x = await abrir(browser, tag, { modulo: true });
      try {
        // La captura va primero: la de página completa puede reacomodar el diseño (columnas «auto» de la rejilla).
        const p0 = await x.page.screenshot({ fullPage: true, caret: 'initial' });
        const antes = await foto(x.page, tag);
        const set = async (fn, arg) => { await x.page.evaluate(fn, arg); await x.page.waitForTimeout(60); };
        await set(() => document.documentElement.setAttribute('data-et-theme', 'oscuro'));
        (await revisarTema(x.page, tag, 'oscuro')).forEach(c => ok(c.ok, 'html=oscuro: ' + c.msg));
        await set(() => document.querySelectorAll('[id^="c"]').forEach(h => h.setAttribute('theme', 'jade')));
        (await revisarTema(x.page, tag, 'jade')).forEach(c => ok(c.ok, 'theme=jade: ' + c.msg));
        await set(() => document.documentElement.setAttribute('data-et-theme', 'libro-mayor'));
        (await revisarTema(x.page, tag, 'jade')).forEach(c => ok(c.ok, 'el propio gana: ' + c.msg));
        await set(() => { document.querySelectorAll('[id^="c"]').forEach(h => h.removeAttribute('theme')); document.documentElement.setAttribute('data-et-theme', 'ninguno'); });
        await x.page.waitForTimeout(250); // transiciones propias del control (p. ej. border-color .15s de OpCanva)
        const despues = await foto(x.page, tag);
        const d = primeraDif(antes.ctl, despues.ctl);
        ok(!d, '«ninguno» lo deja como estaba' + (d ? ' — ' + d : ''));
        const p1 = await x.page.screenshot({ fullPage: true, caret: 'initial' });
        ok(p0.equals(p1), '«ninguno»: píxeles como al principio');
        ok(!x.errores.length, 'sin errores: ' + x.errores.join(' | '));
      } finally { await x.ctx.close(); }
    }
  });
}
// El módulo puede cargarse después del control (antes de DOMContentLoaded o de load).
PRUEBAS.push({
  id: 'módulo cargado después de los controles',
  fn: async (browser, ok) => {
    for (const tag of Object.keys(CONTROLES)) {
      const ctx = await browser.newContext({ viewport: { width: 800, height: 820 } });
      const page = await ctx.newPage();
      await page.addInitScript(() => { const a = Element.prototype.attachShadow; Element.prototype.attachShadow = function (i) { return a.call(this, Object.assign({}, i, { mode: 'open' })); }; });
      const html = `<!DOCTYPE html><html lang="es" data-et-theme="oscuro"><head><meta charset="utf-8"><script src="/ctl.js"></script></head><body>${CONTROLES[tag].body}<script src="/theme.js"></script></body></html>`;
      await page.route('http://gc.test/**', (route) => {
        const u = new URL(route.request().url());
        if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
        if (u.pathname === '/theme.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: TEMA_JS });
        if (u.pathname === '/ctl.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fuentes[tag].nuevo });
        return route.fulfill({ status: 404, body: '' });
      });
      await page.goto('http://gc.test/'); await page.waitForTimeout(80);
      const hay = await page.evaluate(() => !!document.getElementById('c1').shadowRoot.querySelector('style[data-ix-theme]'));
      ok(hay, tag + ': toma el tema aunque el módulo llegue después');
      await ctx.close();
    }
  }
});

async function main() {
  const lista = PRUEBAS.filter(p => !FILTRO || p.id.includes(FILTRO));
  const browser = await chromium.launch();
  let fallas = 0;
  for (const p of lista) {
    const fallos = [];
    const ok = (c, m) => { if (!c) fallos.push(m); else if (VERBOSE) console.log('      ok ' + m); };
    try { await p.fn(browser, ok); } catch (e) { fallos.push('excepción: ' + e.message.split('\n')[0]); }
    if (fallos.length) { fallas++; console.log('FALLA  ' + p.id); fallos.forEach(f => console.log('       - ' + f)); }
    else console.log('pasa   ' + p.id);
  }
  await browser.close();
  console.log(`\n${lista.length} pruebas · pasan ${lista.length - fallas} · fallan ${fallas} · base ${BASE} · capturas ${path.relative(REPO, SALIDA)}`);
  process.exit(fallas ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
