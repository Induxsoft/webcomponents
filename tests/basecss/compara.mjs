#!/usr/bin/env node
// Compara induxsoft.base.css (sin tema) contra bootstrap.min.css 5.0.1, elemento por elemento.
//
//   node tests/basecss/compara.mjs [--bootstrap <bootstrap.min.css>] [--base <induxsoft.base.css>] [--anchos 400,600,…]
//                                  [--filtro <clase>] [--sin-capturas] [--salida <dir>]
//
// Arma una página con las muestras de cada clase usada (tests/basecss/muestras.json, sacadas del código de los
// paquetes, y tests/basecss/sinteticos.mjs, con estados y componentes completos), la carga con cada CSS en cada ancho y
// compara el estilo computado (y el de ::before/::after) y la caja de cada elemento. Fuerza :hover/:focus/:active con
// CDP en los elementos con data-ix-estado. Escribe <salida>/report.md y <salida>/diferencias.json; con capturas, el
// muestrario sintético con Bootstrap, con la base sin tema y con los temas libro-mayor y oscuro (y claro, jade).
//
// Estado por clase: «igual» (ninguna diferencia), «menor» (solo propiedades que no se ven, como transition o cursor, o
// cajas que difieren menos de 0.5 px), «visible» (alguna diferencia que se ve) o «sin muestra».
// Código de salida: 0 si ninguna de las 100 clases más usadas tiene diferencias visibles; 1 si alguna; 2 si falla.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { SINTETICOS } from './sinteticos.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../..');

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const flag = n => argv.includes(n);
const ARGS = {
    bootstrap: path.resolve(opt('--bootstrap', '/home/claude/induxsoft/v12/src/_templates/sites/v12/css/bootstrap.min.css')),
    base: path.resolve(opt('--base', path.join(REPO, 'src/css/induxsoft.base.css'))),
    anchos: opt('--anchos', '400,600,800,1000,1300').split(',').map(Number),
    filtro: opt('--filtro', null),
    capturas: !flag('--sin-capturas'),
    salida: path.resolve(opt('--salida', path.join(AQUI, 'out'))),
};
for (const f of [ARGS.bootstrap, ARGS.base]) if (!fs.existsSync(f)) { console.error('No existe ' + f); process.exit(2); }
fs.mkdirSync(ARGS.salida, { recursive: true });

// ---------------------------------------------------------------- muestras
const filas = fs.readFileSync(path.join(AQUI, 'clases.tsv'), 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const USOS = new Map(filas.map(f => [f[0], Number(f[1])]));
const ORIGEN = new Map(filas.map(f => [f[0], f[3]]));
const M = JSON.parse(fs.readFileSync(path.join(AQUI, 'muestras.json'), 'utf8'));
const FIJOS = /\b(modal|modal-backdrop|fixed-top|fixed-bottom|sticky-top|position-fixed|position-sticky|toast-container|offcanvas|dropdown-menu|popover)\b/;

const muestras = [];   // { id, clases: [..], html, alto, origen }
for (const [c, ids] of Object.entries(M.clases))
    ids.forEach((id, k) => muestras.push({ id: `${c}#${k + 1}`, clases: [c], html: preparar(M.fragmentos[id]), alto: FIJOS.test(M.fragmentos[id]) ? 260 : 0, origen: 'paquetes' }));
SINTETICOS.forEach((s, k) => muestras.push({ id: `sintetico#${k + 1}`, clases: s.clases.split(/\s+/), html: s.html, alto: s.alto || 0, origen: 'sintetico' }));
// Clases sin ningún fragmento: un elemento con la clase sola.
const cubiertas = new Set(muestras.flatMap(m => m.clases));
for (const [c] of USOS) if (!cubiertas.has(c)) muestras.push({ id: `${c}#auto`, clases: [c], html: `<div class="${c}">Texto <span>de ejemplo</span></div>`, alto: FIJOS.test(c) ? 120 : 0, origen: 'auto' });
const lista = ARGS.filtro ? muestras.filter(m => m.clases.includes(ARGS.filtro)) : muestras;

// Lo que en el código se muestra por JS (modal, menú, toast) se deja visible para poder compararlo.
function preparar(h)
{
    return h.replace(/<div class="([^"]*\bmodal\b(?![-\w])[^"]*)"/g, (m, c) => `<div class="${c}${/\bshow\b/.test(c) ? '' : ' show'}" style="display:block"`)
        .replace(/class="([^"]*\bdropdown-menu\b(?![-\w])[^"]*)"/g, (m, c) => `class="${c}${/\bshow\b/.test(c) ? '' : ' show'}" data-bs-popper`)
        .replace(/class="([^"]*\btoast\b(?![-\w])[^"]*)"/g, (m, c) => `class="${c}${/\b(show|hide)\b/.test(c) ? '' : ' show'}"`);
}
function pagina(css, { tema = null, solo = null } = {})
{
    const ms = solo ? lista.filter(solo) : lista;
    const cuerpo = ms.map((m, i) => `<section class="ix-m" data-i="${i}" data-id="${m.id}"${m.alto ? ` style="height:${m.alto}px"` : ''}>${m.html}</section>`).join('\n');
    return `<!DOCTYPE html><html lang="es"${tema ? ` data-et-theme="${tema}"` : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${pathToFileURL(css).href}">
<style>.ix-m{display:block;position:relative;transform:translate(0);overflow:hidden;margin:0 0 12px;padding:4px;border:1px dashed #bbb}
*,::before,::after{animation-play-state:paused!important}</style></head><body>
${cuerpo}
</body></html>`;
}

// ---------------------------------------------------------------- lectura de estilos en la página
const VISIBLES = ['display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear', 'box-sizing', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
    'color', 'background-color', 'background-image', 'background-position', 'background-size', 'background-repeat', 'background-clip',
    'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-decoration-line', 'text-decoration-style', 'text-transform',
    'text-overflow', 'white-space', 'word-break', 'overflow-wrap', 'vertical-align', 'opacity', 'visibility', 'overflow-x', 'overflow-y', 'box-shadow', 'text-shadow',
    'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'justify-content', 'align-items', 'align-self', 'align-content', 'row-gap', 'column-gap', 'order',
    'z-index', 'list-style-type', 'transform', 'filter', 'outline-style', 'outline-width', 'outline-color', 'clip', 'appearance', 'color-scheme', 'caption-side', 'border-collapse',
    'resize', 'counter-reset', 'counter-increment'];
const MENORES = ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay', 'animation-name', 'animation-duration', 'animation-timing-function',
    'animation-iteration-count', 'cursor', 'user-select', 'pointer-events', 'isolation', 'overflow-anchor', '-webkit-tap-highlight-color', 'print-color-adjust', 'text-decoration-skip-ink', 'unicode-bidi', 'direction'];
const PSEUDO = ['content', 'display', 'position', 'width', 'height', 'margin-left', 'margin-right', 'vertical-align', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'border-top-style', 'background-image', 'transform', 'padding-top', 'top', 'left', 'right', 'bottom'];

async function leer(page, soloEstado)
{
    return page.evaluate(({ VIS, MEN, PSE, soloEstado }) =>
    {
        const out = [];
        document.querySelectorAll('section.ix-m').forEach(sec =>
        {
            const r0 = sec.getBoundingClientRect();
            sec.querySelectorAll('*').forEach((el, k) =>
            {
                if (soloEstado && !el.closest('[data-ix-estado]')) return;
                const cs = getComputedStyle(el), r = el.getBoundingClientRect();
                const v = {}, m = {}, p = {};
                for (const n of VIS) v[n] = cs.getPropertyValue(n);
                for (const n of MEN) m[n] = cs.getPropertyValue(n);
                for (const ps of ['::before', '::after'])
                {
                    const c = getComputedStyle(el, ps);
                    if (c.content && c.content !== 'none' && c.content !== 'normal') { const o = {}; for (const n of PSE) o[n] = c.getPropertyValue(n); p[ps] = o; }
                }
                if (/^(INPUT|TEXTAREA)$/.test(el.tagName)) { try { p['::placeholder'] = { color: getComputedStyle(el, '::placeholder').color }; } catch (e) { } }
                out.push({
                    s: sec.dataset.i, k, tag: el.tagName.toLowerCase(), cls: el.getAttribute('class') || '', estado: el.dataset.ixEstado || '',
                    box: [r.left - r0.left, r.top - r0.top, r.width, r.height].map(x => Math.round(x * 100) / 100), v, m, p
                });
            });
        });
        return out;
    }, { VIS: VISIBLES, MEN: MENORES, PSE: PSEUDO, soloEstado });
}
async function forzarEstados(page)
{
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-ix-estado]' });
    for (const id of nodeIds)
    {
        const { attributes } = await cdp.send('DOM.getAttributes', { nodeId: id });
        const i = attributes.indexOf('data-ix-estado'), e = attributes[i + 1];
        await cdp.send('CSS.forcePseudoState', { nodeId: id, forcedPseudoClasses: e === 'active' ? ['active', 'hover'] : [e] });
    }
    await page.waitForTimeout(700);   // que terminen las transiciones (.15 a .35 s)
    return cdp;
}
async function render(browser, css, ancho)
{
    const ctx = await browser.newContext({ viewport: { width: ancho, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const f = path.join(ARGS.salida, `pagina-${path.basename(css, '.css')}.html`);
    fs.writeFileSync(f, pagina(css));
    await page.goto(pathToFileURL(f).href);
    await page.evaluate(() => document.fonts.ready);
    const base = await leer(page, false);
    await forzarEstados(page);
    const estados = await leer(page, true);
    await ctx.close();
    // Los elementos con estado forzado se toman de la segunda lectura.
    const idx = new Map(estados.map(e => [e.s + ':' + e.k, e]));
    return base.map(e => idx.get(e.s + ':' + e.k) || e);
}

// ---------------------------------------------------------------- comparación
const t0 = Date.now();
const browser = await chromium.launch();
const resultados = {};   // clase -> { muestras:Set, visibles:[], menores:[], props:Map }
const nota = (c) => (resultados[c] ??= { muestras: new Set(), visibles: 0, menores: 0, props: new Map(), ejemplos: [] });
let totalEl = 0;
for (const ancho of ARGS.anchos)
{
    const [a, b] = [await render(browser, ARGS.bootstrap, ancho), await render(browser, ARGS.base, ancho)];
    if (a.length !== b.length) { console.error(`Ancho ${ancho}: distinto número de elementos (${a.length} / ${b.length})`); process.exit(2); }
    totalEl += a.length;
    for (let i = 0; i < a.length; i++)
    {
        const x = a[i], y = b[i], m = lista[Number(x.s)];
        const vis = [], men = [];
        for (const n of VISIBLES) if (x.v[n] !== y.v[n]) vis.push(`${n}: ${x.v[n]} → ${y.v[n]}`);
        for (const n of MENORES) if (x.m[n] !== y.m[n]) men.push(`${n}: ${x.m[n]} → ${y.m[n]}`);
        for (const ps of new Set([...Object.keys(x.p), ...Object.keys(y.p)]))
        {
            const p = x.p[ps] || {}, q = y.p[ps] || {};
            for (const n of new Set([...Object.keys(p), ...Object.keys(q)])) if (p[n] !== q[n]) vis.push(`${ps} ${n}: ${p[n] ?? '(no hay)'} → ${q[n] ?? '(no hay)'}`);
        }
        const d = x.box.map((v, j) => Math.abs(v - y.box[j]));
        const dmax = Math.max(...d);
        if (dmax >= 0.5) vis.push(`caja: [${x.box}] → [${y.box}]`);
        else if (dmax > 0) men.push(`caja: Δ${dmax.toFixed(2)} px`);
        for (const c of m.clases)
        {
            const r = nota(c); r.muestras.add(m.id);
            if (vis.length) r.visibles++; else if (men.length) r.menores++;
            for (const t of vis.length ? vis : men) { const k = t.replace(/:.*$/, ''); r.props.set(k, (r.props.get(k) || 0) + 1); }
            if ((vis.length || men.length) && r.ejemplos.length < 4)
                r.ejemplos.push({ ancho, muestra: m.id, elemento: `${x.tag}${x.cls ? '.' + x.cls.trim().split(/\s+/).join('.') : ''}${x.estado ? ':' + x.estado : ''}`, visibles: vis.slice(0, 6), menores: men.slice(0, 4) });
        }
    }
    console.log(`ancho ${ancho}: ${a.length} elementos`);
}

// ---------------------------------------------------------------- informe
const todas = [...new Set([...USOS.keys(), ...Object.keys(resultados)])];
const filasR = todas.map(c =>
{
    const r = resultados[c];
    const estado = !r ? 'sin muestra' : r.visibles ? 'visible' : r.menores ? 'menor' : 'igual';
    return { c, usos: USOS.get(c) ?? '', origen: ORIGEN.get(c) || 'extra', estado, r };
}).sort((p, q) => (Number(q.usos) || 0) - (Number(p.usos) || 0) || p.c.localeCompare(q.c));
const cuenta = e => filasR.filter(f => f.estado === e && USOS.has(f.c)).length;
const top100 = filasR.filter(f => USOS.has(f.c) && f.origen !== 'js').slice(0, 100);
const malos100 = top100.filter(f => f.estado === 'visible');
const props = r => [...r.props.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} (${n})`).join(', ');

let md = `# Comparación de induxsoft.base.css contra Bootstrap 5.0.1\n\n`;
md += `Generado por \`node tests/basecss/compara.mjs\` el ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC, con Chromium ${browser.version()}.\n\n`;
md += `- Bootstrap: \`${ARGS.bootstrap}\`\n- Base: \`${path.relative(REPO, ARGS.base)}\`\n- Anchos: ${ARGS.anchos.join(', ')} px. Muestras: ${lista.length} (${lista.filter(m => m.origen === 'paquetes').length} de los paquetes, ${lista.filter(m => m.origen === 'sintetico').length} sintéticas, ${lista.filter(m => m.origen === 'auto').length} automáticas). Elementos comparados: ${totalEl}.\n\n`;
md += `## Resumen\n\n| Estado | Clases |\n|---|---:|\n| igual (cero diferencias) | ${cuenta('igual')} |\n| menor (no se ve: transición, cursor, < 0.5 px) | ${cuenta('menor')} |\n| visible | ${cuenta('visible')} |\n| sin muestra | ${cuenta('sin muestra')} |\n| **total** | ${USOS.size} |\n\n`;
md += `Las 100 clases más usadas con diferencias visibles: **${malos100.length}**${malos100.length ? ' (' + malos100.map(f => f.c).join(', ') + ')' : ''}.\n\n`;
const conDif = filasR.filter(f => f.estado === 'visible' || f.estado === 'menor');
md += `## Clases con diferencias\n\n`;
if (!conDif.length) md += 'Ninguna.\n\n';
for (const f of conDif)
{
    md += `### \`${f.c}\` (${f.usos || '–'} usos, ${f.estado})\n\nElementos con diferencia visible: ${f.r.visibles}; solo menor: ${f.r.menores}. Propiedades: ${props(f.r)}.\n\n`;
    for (const e of f.r.ejemplos) md += `- ${e.ancho} px, \`${e.muestra}\`, \`${e.elemento}\`: ${[...e.visibles, ...e.menores].map(t => '`' + t.replace(/`/g, "'").slice(0, 220) + '`').join('; ')}\n`;
    md += '\n';
}
md += `## Todas las clases\n\n| Clase | Usos | Origen | Muestras | Estado |\n|---|---:|---|---:|---|\n`;
for (const f of filasR) md += `| \`${f.c}\` | ${f.usos} | ${f.origen} | ${f.r ? f.r.muestras.size : 0} | ${f.estado} |\n`;
fs.writeFileSync(path.join(ARGS.salida, 'report.md'), md);
fs.writeFileSync(path.join(ARGS.salida, 'diferencias.json'), JSON.stringify(filasR.map(f => ({ clase: f.c, usos: f.usos, estado: f.estado, visibles: f.r?.visibles ?? 0, menores: f.r?.menores ?? 0, propiedades: f.r ? Object.fromEntries(f.r.props) : {}, ejemplos: f.r?.ejemplos ?? [] })), null, 1));

// ---------------------------------------------------------------- capturas del muestrario
if (ARGS.capturas)
{
    const dir = path.join(ARGS.salida, 'capturas'); fs.mkdirSync(dir, { recursive: true });
    const solo = m => m.origen === 'sintetico';
    const casos = [['bootstrap', ARGS.bootstrap, null], ['base', ARGS.base, null], ['libro-mayor', ARGS.base, 'libro-mayor'], ['oscuro', ARGS.base, 'oscuro'], ['claro', ARGS.base, 'claro'], ['jade', ARGS.base, 'jade']];
    for (const [n, css, tema] of casos)
    {
        const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        const f = path.join(ARGS.salida, `muestrario-${n}.html`);
        fs.writeFileSync(f, pagina(css, { tema, solo }));
        await page.goto(pathToFileURL(f).href);
        await forzarEstados(page);
        await page.screenshot({ path: path.join(dir, `muestrario-${n}.png`), fullPage: true });
        await ctx.close();
    }
    md = fs.readFileSync(path.join(ARGS.salida, 'report.md'), 'utf8').replace('## Resumen', `Capturas del muestrario sintético (1100 px): \`capturas/muestrario-{bootstrap,base,libro-mayor,oscuro,claro,jade}.png\`.\n\n## Resumen`);
    fs.writeFileSync(path.join(ARGS.salida, 'report.md'), md);
}
await browser.close();
console.log(`igual ${cuenta('igual')}, menor ${cuenta('menor')}, visible ${cuenta('visible')}, sin muestra ${cuenta('sin muestra')}; top 100 con diferencia visible: ${malos100.length}. ${((Date.now() - t0) / 1000).toFixed(1)} s. Informe: ${path.relative(REPO, path.join(ARGS.salida, 'report.md'))}`);
process.exit(malos100.length ? 1 : 0);
