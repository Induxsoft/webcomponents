#!/usr/bin/env node
// Pruebas del módulo de tema InduxsoftTheme 1.1.0 (src/js/induxsoft.theme.js): fromColors, applyColors, contraste
// AA con colores difíciles y «ninguno». Cada prueba afirma lo que espera. Sin red: la página se sirve con page.route.
//
//   node tests/theme/run.mjs [--src ruta/induxsoft.theme.js] [--filtro texto] [--verbose]
//
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
const SRC = path.resolve(opt('--src', path.join(REPO, 'src/js/induxsoft.theme.js')));
const EDITABLE = path.join(REPO, 'src/js/induxsoft.controls.editable.js');
const FILTRO = opt('--filtro', null);
const VERBOSE = argv.includes('--verbose');
// Módulo 1.0.0 (para la prueba de actualización en caliente). 96537f4 es el último main con 1.0.0.
let V100 = null;
try { V100 = execSync(`git -C ${JSON.stringify(REPO)} show 96537f4:src/js/induxsoft.theme.js`, { encoding: 'utf8' }); } catch { }

function html(o = {}) {
  return `<!DOCTYPE html><html lang="es"${o.htmlAttrs ?? ''}><head><meta charset="utf-8"><title>tema</title>
${o.antes ?? ''}
<script src="/theme.js"></script>
${o.editable ? '<script src="/editable.js"></script>' : ''}
</head><body>
${o.body ?? ''}
</body></html>`;
}

// Pares que fromColors garantiza (los mismos de induxsoft.theme.js).
const TEXTO = [['fg', 'bg'], ['muted-fg', 'bg'], ['header-fg', 'header-bg'], ['footer-fg', 'footer-bg'], ['sel-fg', 'sel-bg'],
  ['active-fg', 'active-bg'], ['input-fg', 'input-bg'], ['menu-fg', 'menu-bg'], ['mark-fg', 'mark-bg'],
  ['accent', 'bg'], ['error', 'bg'], ['error', 'error-bg'], ['warn', 'bg'], ['ok', 'bg'], ['neg-fg', 'bg'],
  ['tooltip-fg', 'tooltip-bg'], ['badge-color', 'badge-bg'], ['fg', 'row-alt-bg'], ['fg', 'hover-bg'], ['fg', 'sel-bg-soft'], ['fg', 'checked-bg']];
const DIFICILES = { 'amarillo claro': '#FFF59D', 'gris medio': '#808080', negro: '#000000', blanco: '#FFFFFF' };

const PRUEBAS = [
  {
    id: 'th-01', titulo: 'versión 1.1.0 y API nueva',
    fn: async (page, ok) => {
      const r = await page.evaluate(() => ({ v: InduxsoftTheme.version, f: ['fromColors', 'applyColors', 'contrast', 'isNone'].map(n => typeof InduxsoftTheme[n]), none: InduxsoftTheme.none }));
      ok(r.v === '1.1.0', 'version 1.1.0: ' + r.v);
      ok(r.f.every(x => x === 'function'), 'funciones: ' + r.f);
      ok(r.none === 'ninguno', 'none = ninguno');
    }
  },
  {
    id: 'th-02', titulo: 'sin llamar a fromColors/applyColors nada cambia en el DOM ni en resolve',
    fn: async (page, ok) => {
      const r = await page.evaluate(() => ({ attrs: Array.from(document.documentElement.attributes).map(a => a.name), res: InduxsoftTheme.resolve(document.body) }));
      ok(JSON.stringify(r.attrs) === '["lang"]', '<html> sin atributos nuevos: ' + r.attrs);
      ok(r.res.theme === '' && r.res.palette === null && r.res.density === '' && !('none' in r.res), 'resolve igual que 1.0.0 (sin la clave none): ' + JSON.stringify(r.res));
    }
  },
  {
    id: 'th-03', titulo: 'fromColors({}) da los colores de la base, tal cual',
    fn: async (page, ok) => {
      const r = await page.evaluate(() => {
        const dif = (b) => { const t = InduxsoftTheme.theme(b), p = InduxsoftTheme.fromColors({}, { base: b }); return Object.keys(p).filter(k => k !== 'color-scheme' && String(t[k]).toUpperCase() !== p[k]); };
        const p = InduxsoftTheme.fromColors({});
        return { lm: dif('libro-mayor'), claro: dif('claro'), osc: dif('oscuro'), soloColores: !('font' in p) && !('radius' in p) && !('cell-pad-x' in p), n: Object.keys(p).length };
      });
      ok(!r.lm.length, 'libro-mayor sin diferencias: ' + r.lm);
      ok(!r.claro.length, 'claro sin diferencias: ' + r.claro);
      ok(!r.osc.length, 'oscuro sin diferencias: ' + r.osc);
      ok(r.soloColores && r.n > 30, 'solo colores (sin font, radius ni espaciados): ' + r.n + ' claves');
    }
  },
  {
    id: 'th-04', titulo: 'la barra del cliente gana: sel-bg es la barra y el acento, encabezados y bordes salen de ella',
    fn: async (page, ok) => {
      const r = await page.evaluate(() => {
        const p = InduxsoftTheme.fromColors({ bar: '#BA0135', barText: '#FFFFFF', bg: '#FFFFFF' });
        const lm = InduxsoftTheme.theme('libro-mayor');
        return { p, lm };
      });
      ok(r.p['sel-bg'] === '#BA0135' && r.p.accent === '#BA0135' && r.p['focus-ring'] === '#BA0135', 'acento = barra: ' + r.p.accent);
      ok(r.p['sel-fg'] === '#FFFFFF', 'texto sobre acento = barText');
      ok(r.p.bg === '#FFFFFF', 'fondo = bg');
      for (const k of ['header-bg', 'hover-bg', 'sel-bg-soft', 'border', 'header-border'])
        ok(r.p[k] !== r.lm[k].toUpperCase(), k + ' derivado de la barra: ' + r.p[k]);
      // Tono rojizo: en los fondos derivados el rojo domina al azul.
      const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const hb = rgb(r.p['sel-bg-soft']);
      ok(hb[0] > hb[2], 'sel-bg-soft con el tono de la barra: ' + r.p['sel-bg-soft']);
    }
  },
  {
    id: 'th-05', titulo: 'contraste AA (4.5:1) con colores difíciles: amarillo claro, gris medio, negro y blanco',
    fn: async (page, ok) => {
      const r = await page.evaluate(({ DIFICILES, TEXTO }) => {
        const malos = [], fijos = [];
        let n = 0;
        const nombres = Object.keys(DIFICILES);
        for (const b of nombres) for (const f of nombres) for (const t of ['#FFFFFF', '#000000', '#FFF59D', '#808080']) for (const base of ['libro-mayor', 'claro', 'oscuro', 'jade']) {
          const c = { bar: DIFICILES[b], barText: t, bg: DIFICILES[f] };
          const p = InduxsoftTheme.fromColors(c, { base });
          n++;
          if (p['sel-bg'] !== c.bar || p.bg !== c.bg) fijos.push(JSON.stringify(c));
          for (const [x, y] of TEXTO) {
            const k = InduxsoftTheme.contrast(p[x], p[y]);
            if (!(k >= 4.5)) malos.push(`${b}/${f}/${t}/${base}: ${x} ${p[x]} sobre ${y} ${p[y]} = ${k.toFixed(2)}`);
          }
          for (const [x, y] of [['focus-ring', 'bg'], ['active-cell', 'bg']]) {
            const k = InduxsoftTheme.contrast(p[x], p[y]);
            if (!(k >= 3)) malos.push(`${b}/${f}/${t}/${base}: ${x} sobre ${y} = ${k.toFixed(2)} (< 3)`);
          }
        }
        // Ejemplo concreto: amarillo claro con texto blanco no se lee; sel-fg se oscurece.
        const am = InduxsoftTheme.fromColors({ bar: '#FFF59D', barText: '#FFFFFF' });
        return { n, malos: malos.slice(0, 10), nmalos: malos.length, fijos: fijos.slice(0, 5), am: [am['sel-fg'], InduxsoftTheme.contrast(am['sel-fg'], am['sel-bg'])], negro: InduxsoftTheme.fromColors({ bg: '#000000' })['color-scheme'] };
      }, { DIFICILES, TEXTO });
      ok(r.nmalos === 0, `${r.n} combinaciones, pares bajo AA: ${r.nmalos} ${JSON.stringify(r.malos)}`);
      ok(!r.fijos.length, 'barra y fondo del cliente sin tocar: ' + r.fijos);
      ok(r.am[0] !== '#FFFFFF' && r.am[1] >= 4.5, 'amarillo + blanco: sel-fg ajustado a ' + r.am[0] + ' (' + r.am[1].toFixed(2) + ')');
      ok(r.negro === 'dark', 'fondo negro: color-scheme dark');
      if (VERBOSE) console.log('      ' + r.n + ' combinaciones revisadas');
    }
  },
  {
    id: 'th-06', titulo: 'formatos de color: #rgb, sin #, rgb(), nombres; lo inválido se toma de la base',
    fn: async (page, ok) => {
      const r = await page.evaluate(() => {
        const T = InduxsoftTheme;
        return {
          corto: T.fromColors({ bar: '#06c' })['sel-bg'], sinGato: T.fromColors({ bar: 'BA0135' })['sel-bg'],
          rgb: T.fromColors({ bar: 'rgb(186, 1, 53)' })['sel-bg'], nombre: T.fromColors({ bar: 'navy' })['sel-bg'],
          malo: T.fromColors({ bar: 'no-es-color', bg: '' })['sel-bg'], base: T.theme('libro-mayor')['sel-bg'],
          k: T.contrast('#000', '#fff')
        };
      });
      ok(r.corto === '#0066CC', '#06c: ' + r.corto);
      ok(r.sinGato === '#BA0135', 'sin #: ' + r.sinGato);
      ok(r.rgb === '#BA0135', 'rgb(): ' + r.rgb);
      ok(r.nombre === '#000080', 'navy: ' + r.nombre);
      ok(r.malo === r.base.toUpperCase(), 'inválido -> base: ' + r.malo);
      ok(Math.abs(r.k - 21) < 1e-9, 'contraste negro/blanco 21: ' + r.k);
    }
  },
  {
    id: 'th-07', titulo: 'applyColors fija data-et-palette y la heredan descendientes, shadow DOM e iframes',
    pagina: { body: '<div id="a"><p id="hijo">x</p><div id="host"></div><iframe id="fr" src="/frame.html"></iframe></div><div id="otro"></div>' },
    fn: async (page, ok) => {
      await page.waitForFunction(() => { try { return !!document.getElementById('fr').contentWindow.InduxsoftTheme; } catch { return false; } });
      const r = await page.evaluate(() => {
        const T = InduxsoftTheme, a = document.getElementById('a');
        const sr = document.getElementById('host').attachShadow({ mode: 'open' }); sr.innerHTML = '<span id="s">s</span>';
        const p = T.applyColors(a, { bar: '#0F7A41', barText: '#FFFFFF', bg: '#FFFFFF' });
        const fw = document.getElementById('fr').contentWindow;
        const enFrame = fw.InduxsoftTheme.resolve(fw.document.body).palette;
        const res = {
          attr: JSON.parse(a.getAttribute('data-et-palette')), p,
          hijo: T.resolve(document.getElementById('hijo')).palette, shadow: T.resolve(sr.getElementById('s')).palette, frame: enFrame,
          otro: T.resolve(document.getElementById('otro')).palette, html: document.documentElement.hasAttribute('data-et-palette')
        };
        T.applyColors(a, null);
        res.quitado = a.hasAttribute('data-et-palette');
        return res;
      });
      ok(r.attr['sel-bg'] === '#0F7A41' && JSON.stringify(r.attr) === JSON.stringify(r.p), 'data-et-palette = paleta devuelta');
      ok(r.hijo && r.hijo['sel-bg'] === '#0F7A41', 'descendiente la hereda');
      ok(r.shadow && r.shadow['sel-bg'] === '#0F7A41', 'shadow DOM la hereda');
      ok(r.frame && r.frame['sel-bg'] === '#0F7A41', 'iframe del mismo origen la hereda');
      ok(r.otro === null && !r.html, 'fuera del elemento no llega');
      ok(!r.quitado, 'applyColors(el, null) la quita');
    }
  },
  {
    id: 'th-08', titulo: 'applyColors toma como base el tema efectivo del elemento',
    pagina: { htmlAttrs: ' data-et-theme="oscuro"' },
    fn: async (page, ok) => {
      const r = await page.evaluate(() => {
        const p = InduxsoftTheme.applyColors(null, { bar: '#BA0135' });
        return { bg: p.bg, scheme: p['color-scheme'], en: document.documentElement.hasAttribute('data-et-palette'), osc: InduxsoftTheme.theme('oscuro').bg };
      });
      ok(r.en, 'sin elemento: <html>');
      ok(r.bg === r.osc.toUpperCase() && r.scheme === 'dark', 'base oscuro: ' + r.bg + ' ' + r.scheme);
    }
  },
  {
    id: 'th-09', titulo: 'EditTable toma la paleta de applyColors (variable --et-sel-bg)',
    pagina: { editable: true, htmlAttrs: ' data-et-theme="libro-mayor"', body: '<edit-table id="t" columns="a" colcaptions="A"></edit-table>' },
    fn: async (page, ok) => {
      await page.waitForFunction(() => !!document.getElementById('t').shadowRoot);
      const antes = await page.evaluate(() => document.getElementById('t').shadowRoot.querySelector('style[data-et="f8b"]')?.textContent ?? '');
      await page.evaluate(() => InduxsoftTheme.applyColors(document.documentElement, { bar: '#BA0135', barText: '#FFFFFF' }));
      await page.waitForTimeout(80);
      const despues = await page.evaluate(() => document.getElementById('t').shadowRoot.querySelector('style[data-et="f8b"]')?.textContent ?? '');
      ok(antes && !/#BA0135/i.test(antes), 'antes, sin el color');
      ok(/--et-sel-bg:\s*#BA0135/i.test(despues), 'después, --et-sel-bg (capa palette) con la barra');
    }
  },
  {
    id: 'th-10', titulo: 'data-et-theme="ninguno" corta tema, paleta y densidad heredados (equivale a sin tema)',
    pagina: {
      htmlAttrs: ' data-et-theme="libro-mayor" data-et-palette=\'{"bg":"#FAFAFA"}\' data-et-density="compacta"',
      body: '<div id="cort" data-et-theme="ninguno" data-et-palette=\'{"bg":"#EEEEEE"}\'><p id="x">x</p><div id="abajo" data-et-palette=\'{"fg":"#111111"}\'><span id="y">y</span></div></div><p id="fuera">f</p>'
    },
    fn: async (page, ok) => {
      const r = await page.evaluate(() => {
        const R = (id) => InduxsoftTheme.resolve(document.getElementById(id));
        return { x: R('x'), y: R('y'), fuera: R('fuera'), cort: R('cort'), none: InduxsoftTheme.isNone('Ninguno') && InduxsoftTheme.isNone('none') && !InduxsoftTheme.isNone('') };
      });
      ok(r.x.theme === '' && r.x.none === true && r.x.palette === null && r.x.density === '' && r.x.effective === '', 'debajo del corte, sin tema: ' + JSON.stringify(r.x));
      ok(r.cort.palette === null, 'la paleta del mismo elemento tampoco cuenta');
      ok(r.y.none === true && r.y.palette && r.y.palette.fg === '#111111' && !('bg' in r.y.palette), 'lo que está debajo del corte sí cuenta: ' + JSON.stringify(r.y.palette));
      ok(r.fuera.theme === 'libro-mayor' && !('none' in r.fuera) && r.fuera.palette.bg === '#FAFAFA', 'fuera del corte, el tema de la página');
      ok(r.none, 'isNone');
    }
  },
  {
    id: 'th-11', titulo: '«ninguno» en una tabla: igual que una tabla sin tema',
    pagina: {
      editable: true, htmlAttrs: ' data-et-theme="libro-mayor"',
      body: '<edit-table id="con" columns="a" colcaptions="A"></edit-table><div data-et-theme="ninguno"><edit-table id="sin" columns="a" colcaptions="A"></edit-table></div>'
    },
    fn: async (page, ok) => {
      await page.waitForFunction(() => !!document.getElementById('sin').shadowRoot && !!document.getElementById('con').shadowRoot);
      await page.evaluate(() => InduxsoftTheme.applyColors(document.documentElement, { bar: '#BA0135' }));
      await page.waitForTimeout(80);
      const r = await page.evaluate(() => ({
        con: !!document.getElementById('con').shadowRoot.querySelector('style[data-et="f8b"]'),
        sin: !!document.getElementById('sin').shadowRoot.querySelector('style[data-et="f8b"]'),
        tema: document.getElementById('sin').Theme
      }));
      ok(r.con, 'con tema: hay estilo de tema');
      ok(!r.sin && r.tema === '', 'con ninguno: sin estilo de tema ni paleta (como hoy)');
    }
  },
  {
    id: 'th-12', titulo: 'set("ninguno", {remember:true}) recuerda el corte',
    fn: async (page, ok) => {
      const r = await page.evaluate(() => {
        const T = InduxsoftTheme;
        T.set('ninguno', { on: document.body, remember: true });
        const guardado = localStorage.getItem(T.storageKey);
        document.body.removeAttribute('data-et-theme');
        const res = T.resolve(document.body);
        T.forget();
        return { guardado, res, despues: T.resolve(document.body) };
      });
      ok(/ninguno/.test(r.guardado || ''), 'localStorage: ' + r.guardado);
      ok(r.res.none === true && r.res.theme === '' && r.res.source === '', 'desde lo recordado: none');
      ok(!('none' in r.despues), 'forget lo quita');
    }
  },
  {
    id: 'th-13', titulo: '1.1.0 cargado después de 1.0.0 lo reemplaza y conserva sus temas',
    pagina: { antes: '<script src="/theme100.js"></script><script>InduxsoftTheme.define("mio", {accent: "#123456"});</script>' },
    fn: async (page, ok) => {
      if (!V100) { ok(false, 'sin la copia 1.0.0 (git show 96537f4)'); return; }
      const r = await page.evaluate(() => ({ v: InduxsoftTheme.version, f: typeof InduxsoftTheme.fromColors, mio: InduxsoftTheme.has('mio'), p: InduxsoftTheme.fromColors({}, { base: 'mio' }).accent }));
      ok(r.v === '1.1.0' && r.f === 'function', 'versión nueva: ' + r.v);
      ok(r.mio && r.p === '#123456', 'tema definido con 1.0.0 disponible como base: ' + r.p);
    }
  },
];

async function main() {
  const lista = PRUEBAS.filter(p => !FILTRO || p.id.includes(FILTRO) || p.titulo.includes(FILTRO));
  const browser = await chromium.launch();
  let total = 0, fallas = 0;
  for (const p of lista) {
    const ctx = await browser.newContext();
    const consola = [];
    const fallos = [];
    const ok = (cond, msg) => { if (!cond) fallos.push(msg); else if (VERBOSE) console.log('      ok ' + msg); };
    total++;
    try {
      const page = await ctx.newPage();
      await page.addInitScript(() => { const o = Element.prototype.attachShadow; Element.prototype.attachShadow = function (i) { return o.call(this, Object.assign({}, i, { mode: 'open' })); }; });
      page.on('pageerror', e => consola.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') consola.push('console: ' + m.text()); });
      await page.route('http://th.test/**', (route) => {
        const u = new URL(route.request().url());
        if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html(p.pagina ?? {}) });
        if (u.pathname === '/frame.html') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html({}) });
        if (u.pathname === '/theme.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(SRC) });
        if (u.pathname === '/theme100.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: V100 ?? '' });
        if (u.pathname === '/editable.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(EDITABLE) });
        return route.fulfill({ status: 404, body: '' });
      });
      await page.route(/^(?!http:\/\/th\.test\/).*/, r => r.abort());
      await page.goto('http://th.test/');
      await p.fn(page, ok);
    } catch (e) { fallos.push('excepción: ' + e.message.split('\n')[0]); }
    if (consola.length) fallos.push('errores de consola: ' + JSON.stringify(consola));
    if (fallos.length) { fallas++; console.log('FALLA  ' + p.id + ' · ' + p.titulo); fallos.forEach(f => console.log('       - ' + f)); }
    else console.log('pasa   ' + p.id + ' · ' + p.titulo);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${total} pruebas · pasan ${total - fallas} · fallan ${fallas} · src ${path.relative(process.cwd(), SRC) || SRC}`);
  process.exit(fallas ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
