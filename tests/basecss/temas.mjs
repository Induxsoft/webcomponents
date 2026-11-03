#!/usr/bin/env node
// Genera el bloque de paletas de src/css/induxsoft.base.css (entre /* <ix-temas> */ y /* </ix-temas> */) desde los
// temas de src/js/induxsoft.theme.js, para que el CSS y el módulo usen los mismos valores.
//
//   node tests/basecss/temas.mjs           reescribe el bloque
//   node tests/basecss/temas.mjs --check   solo verifica (sale con 1 si el bloque no coincide con el módulo)
//
// Por cada tema: las claves de la paleta que el CSS lee como --ixt-<clave>, más unas derivadas que el CSS no puede
// calcular: color-scheme, el texto encima de cada color (on-accent, on-ok, …: blanco o negro según contraste WCAG),
// el ícono del acordeón con el color del texto y, en los oscuros, el filtro del botón de cerrar.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CSS = path.join(REPO, 'src/css/induxsoft.base.css');
const JS = path.join(REPO, 'src/js/induxsoft.theme.js');
const INI = '/* <ix-temas> */', FIN = '/* </ix-temas> */';

export function cargarModulo(src = fs.readFileSync(JS, 'utf8'))
{
    const w = { document: { documentElement: null, addEventListener() { } }, localStorage: null, matchMedia: null, console };
    vm.runInNewContext(src, { window: w, console, CustomEvent: class { }, Map, Set, WeakSet, JSON });
    const alias = {};
    const m = src.match(/var ALIAS = (\{[^}]*\});/);
    if (m) Object.assign(alias, Function('return ' + m[1])());
    return { api: w.InduxsoftTheme, alias };
}

function rgb(hex)
{
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
function lum(c) { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function contraste(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
// Texto encima de un color: blanco si llega a 4.5:1 (como Bootstrap); si no, el que contraste más.
export function encima(hex)
{
    const c = rgb(hex); if (!c) return null;
    const b = contraste(c, [255, 255, 255]), n = contraste(c, [0, 0, 0]);
    return b >= 4.5 || b >= n ? '#fff' : '#000';
}
const enc = s => s.replace(/#/g, '%23');
const icono = fill => `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='${enc(fill)}'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")`;
const DERIVADAS = new Set(['color-scheme', 'on-accent', 'on-muted-fg', 'on-ok', 'on-warn', 'on-error', 'accordion-icon', 'btn-close-filter']);

export function bloque(css, mod)
{
    const usadas = [...new Set([...css.replace(new RegExp(INI.replace(/[*/]/g, '\\$&') + '[\\s\\S]*$'), '').matchAll(/--ixt-([a-z0-9-]+)/g)].map(m => m[1]))]
        .filter(k => !DERIVADAS.has(k)).sort();
    const { api, alias } = mod;
    const sel = n => [n, ...Object.keys(alias).filter(a => alias[a] === n)].map(a => `[data-et-theme="${a}" i]`);
    const decl = (p) =>
    {
        const out = [];
        for (const k of usadas) if (p[k] != null) out.push(`--ixt-${k}: ${p[k]};`);
        out.push(`--ixt-color-scheme: ${p['color-scheme'] || 'normal'};`);
        for (const [k, base] of [['on-accent', 'accent'], ['on-muted-fg', 'muted-fg'], ['on-ok', 'ok'], ['on-warn', 'warn'], ['on-error', 'error']])
        { const v = encima(p[base]); if (v) out.push(`--ixt-${k}: ${v};`); }
        if (rgb(p.fg)) out.push(`--ixt-accordion-icon: ${icono(p.fg)};`);
        if (p['color-scheme'] === 'dark') out.push('--ixt-btn-close-filter: invert(1) grayscale(100%) brightness(200%);');
        return out.map(l => '    ' + l).join('\n');
    };
    const temas = api.themes;
    let s = INI + '\n';
    for (const n of Object.keys(temas))
    {
        const lista = sel(n);
        if (n === 'claro') lista.push('[data-et-theme="auto" i]');
        s += `${lista.join(', ')} {\n${decl(temas[n])}\n}\n`;
    }
    if (temas.oscuro) s += `@media (prefers-color-scheme: dark) {\n    [data-et-theme="auto" i] {\n${decl(temas.oscuro).replace(/^/gm, '    ')}\n    }\n}\n`;
    return s + FIN;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const css = fs.readFileSync(CSS, 'utf8');
    const i = css.indexOf(INI), f = css.indexOf(FIN);
    if (i < 0 || f < i) { console.error('No encuentro los marcadores ' + INI + ' … ' + FIN + ' en ' + CSS); process.exit(2); }
    const nuevo = bloque(css, cargarModulo());
    const actual = css.slice(i, f + FIN.length);
    if (process.argv.includes('--check'))
    {
        if (actual === nuevo) { console.log('temas.mjs --check: el bloque coincide con induxsoft.theme.js ' + cargarModulo().api.version); process.exit(0); }
        console.error('temas.mjs --check: el bloque de paletas de induxsoft.base.css no coincide con induxsoft.theme.js; corre node tests/basecss/temas.mjs');
        process.exit(1);
    }
    fs.writeFileSync(CSS, css.slice(0, i) + nuevo + css.slice(f + FIN.length));
    console.log('Bloque de paletas reescrito (' + Object.keys(cargarModulo().api.themes).join(', ') + ').');
}
