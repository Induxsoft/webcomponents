#!/usr/bin/env node
// Arma tests/basecss/muestras.json: 2 o 3 fragmentos reales por cada clase de tests/basecss/clases.tsv, sacados del
// código de los paquetes de V12 (marcado DKL de .dk/.dkh/.dkl/.dkt y etiquetas HTML de .htt/.html/.js).
//
//   node tests/basecss/extrae.mjs [--repos-tsv <repos.tsv>] [--raiz <dir>]... [--max 3]
//
// --raiz: carpeta con repos de paquetes (cada uno con src/). Por omisión, los repos del censo de v12_qa
// (--repos-tsv, herramientas/censo-apariencia/repos.tsv) buscados en /home/claude/paquetes, /home/claude e induxsoft/. Los fragmentos guardan SOLO la estructura: etiquetas, clases de
// Bootstrap (las propias se quitan) y atributos estructurales (type, role, colspan, disabled, checked…). Todo texto se cambia por «Texto»;
// no se copian ids, nombres, valores, URL, estilos ni expresiones. El resultado se versiona: así compara.mjs no
// necesita los repos.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opts = n => argv.flatMap((a, i) => (a === n && argv[i + 1] ? [argv[i + 1]] : []));
const MAX = Number(opts('--max')[0] || 3);

const filas = fs.readFileSync(path.join(AQUI, 'clases.tsv'), 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const CLASES = new Set(filas.map(f => f[0]));

// ---------------------------------------------------------------- repos
let raices = opts('--raiz');
const REPOS_TSV = opts('--repos-tsv')[0] || '/home/claude/v12_qa/herramientas/censo-apariencia/repos.tsv';
const repos = [];
if (raices.length) for (const r of raices) { for (const d of fs.readdirSync(r)) if (fs.existsSync(path.join(r, d, 'src'))) repos.push(path.join(r, d)); }
else if (fs.existsSync(REPOS_TSV))
{
    // Los mismos repos que midió el censo (columna repo = owner/nombre), buscados en las copias locales.
    for (const l of fs.readFileSync(REPOS_TSV, 'utf8').trim().split('\n').slice(1))
    {
        const r = l.split('\t')[1].split('/').pop();
        const d = [r, r.toLowerCase()].flatMap(x => [`/home/claude/paquetes/${x}`, `/home/claude/${x}`, `/home/claude/induxsoft/${x}`]).find(x => fs.existsSync(path.join(x, 'src')));
        if (d && !repos.includes(d)) repos.push(d); else if (!d) console.warn('No encuentro el repo ' + r);
    }
}
else
{
    const p = '/home/claude/paquetes';
    for (const d of fs.readdirSync(p)) if (fs.existsSync(path.join(p, d, 'src'))) repos.push(path.join(p, d));
}
repos.sort();

function* archivos(dir)
{
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)))
    {
        const f = path.join(dir, e.name);
        if (e.isDirectory()) { if (!/^(node_modules|monaco|_static|vendor|third.?party)$/i.test(e.name)) yield* archivos(f); }
        else if (/\.(dk|dkh|dkl|dkt|htt|html|js)$/.test(e.name) && !/\.min\.|bootstrap|jquery|induxsoft\.controls/i.test(e.name)) yield f;
    }
}

// ---------------------------------------------------------------- modelo de nodos
const TAGS = new Set('div span label input button select option optgroup textarea form table thead tbody tfoot tr td th caption a ul ol li h1 h2 h3 h4 h5 h6 p i b strong small em img nav section header footer main article aside fieldset legend hr br iframe figure figcaption details summary progress datalist output pre code'.split(' '));
const VACIAS = new Set(['input', 'img', 'hr', 'br']);
const ATTRS = new Set(['type', 'role', 'colspan', 'rowspan', 'disabled', 'checked', 'readonly', 'multiple', 'selected', 'size', 'rows', 'scope', 'aria-expanded']);
const nodo = (tag, attrs, padre) => { const n = { tag, attrs, hijos: [], padre, texto: false }; if (padre) padre.hijos.push(n); return n; };

function limpiarAttrs(lista)
{
    const a = {};
    for (const [k0, v0] of lista)
    {
        const k = k0.toLowerCase(), v = v0 == null ? '' : v0;
        if (k === 'class')
        {
            const t = v.split(/\s+/).filter(x => CLASES.has(x));   // solo clases de Bootstrap
            if (t.length) a.class = t.join(' ');
        }
        else if (ATTRS.has(k))
        {
            if (k === 'type' && !/^[a-z-]+$/.test(v)) continue;
            if (/^(colspan|rowspan|size|rows)$/.test(k) && !/^\d{1,2}$/.test(v)) continue;
            if (/^(disabled|checked|readonly|multiple|selected)$/.test(k)) { if (/^(false|0)$/i.test(v) || /[#@$]/.test(v)) continue; a[k] = ''; continue; }
            if (/[#@$<>"]/.test(v)) continue;
            a[k] = v;
        }
    }
    return a;
}
function attrsDe(s)
{
    const r = [], re = /(?:"([\w:-]+)"|'([\w:-]+)'|([\w:-]+))(?:\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'))?/g;
    let m; while ((m = re.exec(s))) r.push([m[1] || m[2] || m[3], m[4] ?? m[5] ?? null]);
    return r;
}

// Marcado DKL: tag(attrs){ … } o tag(attrs) o tag{ … }; $"texto"; las llaves que no son de una etiqueta se cuentan
// como bloques para que el anidamiento cuadre.
function parseDK(src)
{
    const raiz = nodo('#raiz', {}, null);
    const pila = [raiz];
    const cur = () => { for (let i = pila.length - 1; i >= 0; i--) if (pila[i]) return pila[i]; return raiz; };
    let i = 0; const n = src.length;
    const saltaCadena = (j) => { const q = src[j]; j++; while (j < n && src[j] !== q) { if (src[j] === '\\') j++; if (src[j] === '\n' && q === "'") return j; j++; } return j + 1; };
    while (i < n)
    {
        const c = src[i];
        if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
        if (c === '/' && src[i + 1] === '*') { const k = src.indexOf('*/', i + 2); i = k < 0 ? n : k + 2; continue; }
        if (c === '$' && (src[i + 1] === '"' || src[i + 1] === "'")) { const j = saltaCadena(i + 1); if (src.slice(i + 2, j - 1).trim()) cur().texto = true; i = j; continue; }
        if (c === '"' || c === "'") { i = saltaCadena(i); continue; }
        if (c === '{') { pila.push(null); i++; continue; }
        if (c === '}') { if (pila.length > 1) pila.pop(); i++; continue; }
        if (/[a-z]/.test(c) && !/[\w.@$#-]/.test(src[i - 1] || ' '))
        {
            const m = /^[a-z][a-z0-9]*/.exec(src.slice(i, i + 12));
            const tag = m[0]; let j = i + tag.length;
            if (TAGS.has(tag))
            {
                let k = j; while (src[k] === ' ' || src[k] === '\t') k++;
                if (src[k] === '(' || src[k] === '{')
                {
                    let attrs = {};
                    if (src[k] === '(')
                    {
                        let d = 0, e = k;
                        for (; e < n; e++) { const ch = src[e]; if (ch === '"' || ch === "'") { e = saltaCadena(e) - 1; continue; } if (ch === '(') d++; else if (ch === ')' && --d === 0) break; if (ch === '\n' && d > 0 && src.slice(k, e).split('\n').length > 6) break; }
                        attrs = limpiarAttrs(attrsDe(src.slice(k + 1, e)));
                        k = e + 1;
                    }
                    const el = nodo(tag, attrs, cur());
                    let q = k; while (q < n && /\s/.test(src[q])) q++;
                    if (src[q] === '{') { pila.push(el); i = q + 1; } else i = k;
                    continue;
                }
            }
            i = j; continue;
        }
        i++;
    }
    return raiz;
}
// HTML dentro de .htt/.html/.js: etiquetas de apertura con clase, sin anidamiento (fragmento de un solo nivel).
function parseHTML(src)
{
    src = src.replace(/#<[^<>]*>/g, '#x');   // expresiones de DKL dentro de atributos
    const raiz = nodo('#raiz', {}, null);
    const re = /<([a-z][a-z0-9]*)\b([^<>]*?\bclass\s*=\s*(["'])[^"'<>]*\3[^<>]*)>/gi;
    let m; while ((m = re.exec(src))) { const t = m[1].toLowerCase(); if (TAGS.has(t)) { const e = nodo(t, limpiarAttrs(attrsDe(m[2])), raiz); e.texto = !VACIAS.has(t); } }
    return raiz;
}

// ---------------------------------------------------------------- fragmentos
const CONTEXTO = /^(row|nav|nav-tabs|tab-content|dropdown|dropstart|dropdown-menu|modal|modal-dialog|modal-content|card|list-group|pagination|accordion-item|form-check|input-group|btn-group|table|navbar|toast|offcanvas|progress|container(-\w+)?)$/;
function raizDe(e)
{
    let r = e, a = e.padre, k = 0;
    while (a && a.tag !== '#raiz' && k < 3) { if ((a.attrs.class || '').split(' ').some(x => CONTEXTO.test(x) && CLASES.has(x))) r = a; a = a.padre; k++; }
    return r;
}
function html(n, objetivo, prof, cuenta)
{
    const camino = new Set(); for (let x = objetivo; x; x = x.padre) camino.add(x);
    const out = (x, d) =>
    {
        if (cuenta.n++ > 24 && !camino.has(x)) return '';
        const at = Object.entries(x.attrs).map(([k, v]) => v === '' ? ` ${k}` : ` ${k}="${v}"`).join('');
        if (VACIAS.has(x.tag)) return `<${x.tag}${at}>`;
        let hijos = x.hijos, s = '';
        if (!camino.has(x) && d >= prof) hijos = [];
        let otros = 0;
        for (const h of hijos) { if (!camino.has(h) && ++otros > 3) continue; s += out(h, camino.has(x) && !camino.has(h) ? d + 1 : (camino.has(h) ? 0 : d + 1)); }
        if (!s && (x.texto || /^(button|a|label|span|th|td|li|option|h[1-6]|small|legend|p|strong|b)$/.test(x.tag) && x.texto)) s = x.tag === 'option' ? 'Opción' : 'Texto';
        if (!s && x.texto) s = 'Texto';
        return `<${x.tag}${at}>${s}</${x.tag}>`;
    };
    return out(n, 0);
}

const porClase = new Map();   // clase -> [{id, firma, repo}]
const fragmentos = {};
let nArch = 0;
for (const repo of repos)
{
    const nombre = path.basename(repo);
    for (const f of archivos(path.join(repo, 'src')))
    {
        let src; try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
        if (!/class/.test(src)) continue;
        nArch++;
        // En .dk también hay HTML dentro de cadenas ("<div class='…'>"): se leen las dos formas.
        const arboles = /\.(htt|html|js)$/.test(f) ? [parseHTML(src)] : [parseDK(src), parseHTML(src)];
        const visitar = (x) =>
        {
            const cl = (x.attrs.class || '').split(' ').filter(c => CLASES.has(c));
            for (const c of cl)
            {
                const lista = porClase.get(c) || []; porClase.set(c, lista);
                if (lista.length >= 12) continue;
                const firma = x.tag + '.' + (x.attrs.class || '').split(' ').filter(c => CLASES.has(c)).sort().join('.');
                if (lista.some(o => o.firma === firma)) continue;
                const h = html(raizDe(x), x, 2, { n: 0 });
                const id = crypto.createHash('sha1').update(h).digest('hex').slice(0, 10);
                fragmentos[id] = h;
                lista.push({ id, firma, repo: nombre });
            }
            x.hijos.forEach(visitar);
        };
        arboles.forEach(visitar);
    }
}
// Por clase: hasta MAX fragmentos, de repos distintos primero.
const clases = {};
for (const [c, lista] of porClase)
{
    const elegidos = [], repos2 = new Set();
    for (const o of lista) if (elegidos.length < MAX && !repos2.has(o.repo)) { elegidos.push(o); repos2.add(o.repo); }
    for (const o of lista) if (elegidos.length < MAX && !elegidos.includes(o)) elegidos.push(o);
    clases[c] = elegidos.map(o => o.id);
}
const usados = new Set(Object.values(clases).flat());
const salida = {
    descripcion: 'Fragmentos estructurales de los paquetes de V12 (solo etiquetas, clases y atributos estructurales; texto ficticio). Generado por tests/basecss/extrae.mjs.',
    repos: repos.length, archivos: nArch,
    clases: Object.fromEntries(Object.entries(clases).sort()),
    fragmentos: Object.fromEntries(Object.entries(fragmentos).filter(([k]) => usados.has(k)).sort())
};
fs.writeFileSync(path.join(AQUI, 'muestras.json'), JSON.stringify(salida, null, 1) + '\n');
const sin = [...CLASES].filter(c => !clases[c]);
console.log(`${repos.length} repos, ${nArch} archivos; ${Object.keys(clases).length} clases con fragmentos, ${usados.size} fragmentos. Sin fragmento: ${sin.length} (${sin.join(' ')})`);
