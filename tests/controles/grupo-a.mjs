#!/usr/bin/env node
// Pruebas de tema del grupo A (tests/theme/CONTROLES.md): EditSelect (<edit-select>), CheckList (<check-list>),
// StackEdit (<stack-edit>) y SafeInput (<safe-input>) de src/js/induxsoft.controls.js; InputKey (<input-key>) va en
// la página como referencia de alto.
//   1. Sin tema y con «ninguno»: idénticos a la versión anterior (HTML del shadow, hojas, DOM claro y getComputedStyle).
//   2. Con tema (claro, oscuro, jade, libro-mayor y auto): <style data-ix-theme>, colores de la paleta, alto de la
//      densidad (el mismo que InputKey) y contraste AA.
//   3. En caliente: data-et-theme del <html>, theme propio, «ninguno» y desconectar/reconectar.
//   4. Capturas a tests/out/controles/<control>-<tema>.png (no se versionan).
// Sin red: las páginas se sirven con page.route. Datos ficticios. Adaptado de grupo-b.mjs.
//
//   node tests/controles/grupo-a.mjs [--src ruta/induxsoft.controls.js] [--base 8b81486] [--filtro texto] [--verbose] [--sin-png]
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
const SRC = path.resolve(opt('--src', path.join(REPO, 'src/js/induxsoft.controls.js')));
const BASE_REF = opt('--base', '8b81486');
const FILTRO = opt('--filtro', null);
const VERBOSE = argv.includes('--verbose');
const SIN_PNG = argv.includes('--sin-png');
const OUT = path.join(REPO, 'tests/out/controles');
let BASE_JS = null;
try { BASE_JS = execSync(`git -C ${JSON.stringify(REPO)} show ${BASE_REF}:src/js/induxsoft.controls.js`, { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch { }

const TEMAS = ['claro', 'oscuro', 'jade', 'libro-mayor'];
const CONTROLES = ['edit-select', 'check-list', 'stack-edit', 'safe-input'];
const IDS = ['es', 'es2', 'cl', 'cl2', 'se', 'si', 'si2'];
const q = (s) => s.replace(/'/g, '&#39;');
const CL = q(JSON.stringify({ text: 'Lista de compras', items: [{ id: '1', text: '3 Tomates', done: false }, { id: '2', text: '1 Cebolla', done: true }, { id: '3', text: '4 Huevos', done: false }] }));
const CL2 = q(JSON.stringify({ text: 'Opciones', items: [{ id: '1', text: 'Sí', done: true }, { id: '2', text: 'No', done: false }] }));
const SE = q(JSON.stringify([
  { id: '1', a: '01-11-2026', b: 'Activo', c: 'Normal', d: 'Uno', t: 'Pedido ficticio 1', s: 'Cliente de ejemplo' },
  { id: '2', a: '02-11-2026', b: 'En revisión', c: 'Alta', d: 'Dos', t: 'Pedido ficticio 2', s: 'Otro cliente de ejemplo' }
]));
function html(o = {}) {
  const a = o.attrs ?? '';
  return `<!DOCTYPE html><html lang="es"${o.htmlAttrs ?? ''}><head><meta charset="utf-8"><title>grupo A</title>
<style>body{ margin:0; padding:16px; font-family: system-ui, sans-serif; } .caja{ padding:12px; width:520px; } .caja.ancha{ width:760px; } .fila{ display:flex; gap:8px; align-items:flex-start; } .fila > *{ flex:0 0 calc(50% - 4px); min-width:0; max-width:calc(50% - 4px); }</style>
<script src="/controls.js"></script>
</head><body${o.bodyAttrs ?? ''}>
<form id="f" onsubmit="return false">
<div class="caja ancha" id="c-edit-select"><div class="fila"><edit-select id="es" name="opcion" ${a}><option value="" disabled hidden selected>Selecciona una opción</option><option value="1">Opción 1</option><option value="2">Opción 2</option></edit-select>
<input-key id="ik" name="cli" data-key="k" data-search="codigo" data-text="nombre" data-value='{"k":1,"codigo":"PG","nombre":"Público general"}' ${a}></input-key></div>
<div style="height:8px"></div><edit-select id="es2" name="opcion2" value="2" ${a}><option value="1">Opción 1</option><option value="2">Opción 2</option></edit-select></div>
<div class="caja" id="c-check-list"><check-list id="cl" data='${CL}' can-add="true" can-edit="true" can-remove="true" can-move="true" can-check="true" ${a}></check-list>
<div style="height:8px"></div><check-list id="cl2" data='${CL2}' radio-style="true" can-check="true" ${a}></check-list></div>
<div class="caja" id="c-stack-edit"><stack-edit id="se" data='${SE}' caption-a="a" caption-b="b" caption-c="c" caption-d="d" title="t" subtitle="s" color-field="#000" backcolor-field="#FFF" ${a}></stack-edit></div>
<div class="caja ancha" id="c-safe-input"><div class="fila"><safe-input id="si" type="text" input-name="nombre" value="Juan Ejemplo" ${a}></safe-input><input-key id="ik2" name="cli2" data-key="k" data-search="codigo" data-text="nombre" ${a}></input-key></div>
<div style="height:8px"></div><safe-input id="si2" type="text" input-name="nombre2" value="Bloqueado" disabled="true" ${a}></safe-input></div>
</form>
${o.body ?? ''}
<script>
window.__ids = ${JSON.stringify(IDS)};
window.__espera = (ms) => new Promise(r => setTimeout(r, ms || 40));
window.__foto = function (id) {
  var h = document.getElementById(id), s = h.shadowRoot, out = { host: h.outerHTML.replace(h.innerHTML, ''), next: [], estilos: [], cs: {} };
  var n = h.nextElementSibling; while (n && n.localName === 'input') { out.next.push(n.outerHTML); n = n.nextElementSibling; }
  out.light = h.innerHTML;
  out.shadow = s.innerHTML;
  out.estilos = Array.from(s.querySelectorAll('style')).map(x => x.textContent);
  out.head = document.head.querySelectorAll('style[data-ix-theme]').length;
  var hcs = getComputedStyle(h); out.cs['host'] = Array.from(hcs).map(p => p + ':' + hcs.getPropertyValue(p)).join(';');
  Array.from(s.querySelectorAll('*')).forEach(function (el, i) {
    if (el.localName === 'style') return;
    var c = getComputedStyle(el); out.cs[i + ':' + el.localName + '#' + (el.id || '') + '.' + (el.getAttribute('class') || '')] = Array.from(c).map(p => p + ':' + c.getPropertyValue(p)).join(';');
  });
  return out;
};
window.__rgb = function (c) { var d = document.createElement('div'); d.style.color = c; document.body.appendChild(d); var r = getComputedStyle(d).color; d.remove(); return r; };
window.__leer = function (c) { var m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return null; var p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
window.__fondo = function (el) {
  var capas = [];
  for (var e = el; e; e = e.parentElement || (e.getRootNode && e.getRootNode().host) || null) {
    var c = __leer(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { capas.push(c); if (c.a >= 1) break; }
  }
  var r = { r: 255, g: 255, b: 255 };
  for (var i = capas.length - 1; i >= 0; i--) { var k = capas[i]; r = { r: k.r * k.a + r.r * (1 - k.a), g: k.g * k.a + r.g * (1 - k.a), b: k.b * k.a + r.b * (1 - k.a) }; }
  return [r.r, r.g, r.b];
};
window.__contraste = function (el) { var c = __leer(getComputedStyle(el).color); return InduxsoftTheme.contrast([c.r, c.g, c.b], __fondo(el)); };
</script>
</body></html>`;
}

async function medir(page) {
  return page.evaluate(() => {
    const S = id => document.getElementById(id).shadowRoot;
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const alto = el => el.getBoundingClientRect().height;
    const r = {};
    for (const id of __ids) {
      const s = S(id), st = s.firstElementChild;
      r[id] = { estilo: !!(st && st.localName === 'style' && st.hasAttribute('data-ix-theme')), nEstilos: s.querySelectorAll('style[data-ix-theme]').length };
    }
    const campo = { es: S('es').querySelector('select'), si: S('si').querySelector('#SafeInput_contnr') };
    r.campos = {};
    for (const k in campo) { const e = campo[k]; r.campos[k] = { bg: cs(e, 'background-color'), borde: cs(e, 'border-top-color'), anchoBorde: cs(e, 'border-top-width'), alto: alto(e), radio: cs(e, 'border-top-left-radius'), fg: cs(e, 'color'), fuente: cs(e, 'font-family') }; }
    const ik = S('ik').querySelector('#container');
    r.altoIk = ik ? alto(ik) : 0;
    const clPanel = S('cl').querySelector('#CL_container'), clHead = S('cl').querySelector('#CL_headerSection'), clTit = S('cl').querySelector('#CL_title_headSection');
    const items = S('cl').querySelectorAll('.hover-item');
    const itemTxt = S('cl').querySelector('.hover-item input[type="text"]');
    const hecho = S('cl').querySelector('.hover-item[item-done="true"]');
    const seCont = S('se').querySelector('#_stackContainer'), seItem = S('se').querySelector('.container-item');
    const seTit = seItem && (seItem.querySelector('.fw-bold') || seItem);
    const seSub = seItem && seItem.querySelector('.text-secondary');
    const siIpt = S('si').querySelector('.induxsoft-form-control'), si2Ipt = S('si2').querySelector('.induxsoft-form-control');
    const esOpt = S('es').querySelector('select option'), esTxt = S('es').querySelector('input');
    r.k = {
      'select (edit-select)': __contraste(campo.es),
      'opción (edit-select)': InduxsoftTheme.contrast(cs(esOpt, 'color'), cs(esOpt, 'background-color')),
      'texto manual (edit-select)': esTxt ? __contraste(esTxt) : 99,
      'título (check-list)': __contraste(clTit),
      'renglón (check-list)': itemTxt ? __contraste(itemTxt) : __contraste(items[0]),
      'renglón marcado (check-list)': __contraste(hecho.querySelector('input[type="text"]') || hecho),
      'título (stack-edit)': __contraste(seTit),
      'subtítulo (stack-edit)': seSub ? __contraste(seSub) : 99,
      'texto (safe-input)': __contraste(siIpt),
      'deshabilitado (safe-input)': __contraste(si2Ipt),
    };
    r.kIconos = { 'icono Editar (safe-input)': __contraste(S('si').querySelector('#SafeInput_btnEdit')) };
    r.otros = {
      optBg: cs(esOpt, 'background-color'), clBg: cs(clPanel, 'background-color'), clHeadBg: cs(clHead, 'background-color'), clHeadFg: cs(clHead, 'color'),
      hechoBg: cs(hecho, 'background-color'), seBg: cs(seCont, 'background-color'), seItemBg: cs(seItem, 'background-color'), seItemFg: cs(seItem, 'color'),
      si2Bg: cs(S('si2').querySelector('#SafeInput_contnr'), 'background-color'), cs: cs(campo.es, 'color-scheme'),
      itemAlto: alto(items[0]),
    };
    return r;
  });
}
async function paleta(page, tema) {
  return page.evaluate((t) => { const p = InduxsoftTheme.theme(t), P = InduxsoftTheme.parents, o = {}; const val = k => p[k] ?? (P[k] ? val(P[k]) : null); for (const k of ['input-bg', 'input-fg', 'input-border', 'sel-bg', 'sel-fg', 'menu-bg', 'input-disabled-bg', 'muted-fg', 'bg', 'fg', 'accent', 'header-bg', 'header-fg', 'checked-bg', 'panel-bg']) o[k] = val(k) ? __rgb(val(k)) : null; o.radius = p.radius; return o; }, tema);
}
function compararFotos(a, b, ok, etiqueta) {
  const ids = Object.keys(a);
  for (const id of ids) {
    const x = a[id], y = b[id];
    ok(x.host === y.host, `${etiqueta} ${id}: host igual`);
    ok(JSON.stringify(x.next) === JSON.stringify(y.next), `${etiqueta} ${id}: DOM claro vecino igual`);
    ok(x.light === y.light, `${etiqueta} ${id}: DOM claro interno igual`);
    ok(x.shadow === y.shadow, `${etiqueta} ${id}: HTML del shadow igual` + (x.shadow === y.shadow ? '' : ` (${x.shadow.length} vs ${y.shadow.length})`));
    ok(JSON.stringify(x.estilos) === JSON.stringify(y.estilos), `${etiqueta} ${id}: mismas hojas`);
    ok(x.head === 0 && y.head === 0, `${etiqueta} ${id}: sin <style data-ix-theme> en head`);
    const kx = Object.keys(x.cs), ky = Object.keys(y.cs);
    ok(JSON.stringify(kx) === JSON.stringify(ky), `${etiqueta} ${id}: mismos elementos (${kx.length} vs ${ky.length})`);
    const dif = kx.filter(k => x.cs[k] !== y.cs[k]);
    ok(dif.length === 0, `${etiqueta} ${id}: getComputedStyle igual en ${kx.length} elementos` + (dif.length ? '; difieren: ' + dif.slice(0, 3).join(', ') : ''));
  }
}
async function fotos(page) { return page.evaluate(() => Object.fromEntries(__ids.map(id => [id, __foto(id)]))); }
// Estados abiertos para las capturas: EditSelect con foco, SafeInput en edición.
async function abrirEstados(page, foco = true) {
  await page.evaluate(async (foco) => {
    const S = id => document.getElementById(id).shadowRoot;
    S('si').querySelector('#SafeInput_btnEdit').click();
    await __espera(30);
    if (foco) S('es').querySelector('select').focus(); else { const a = S('si').activeElement; if (a) a.blur(); }
    await __espera(400);
  }, foco);
}

const PRUEBAS = [
  {
    id: 'ga-01', titulo: 'sin tema: idéntico a la versión anterior (shadow, hojas, DOM claro, getComputedStyle)',
    fn: async (page, ok, { base }) => {
      await page.evaluate(() => __espera(50));
      compararFotos(await fotos(page), await base({}), ok, 'sin tema');
    }
  },
  {
    id: 'ga-02', titulo: 'data-et-theme="ninguno": idéntico a la versión anterior', pagina: { htmlAttrs: ' data-et-theme="ninguno"' },
    fn: async (page, ok, { base }) => {
      await page.evaluate(() => __espera(50));
      compararFotos(await fotos(page), await base({ htmlAttrs: ' data-et-theme="ninguno"' }), ok, 'ninguno');
    }
  },
  {
    id: 'ga-03', titulo: 'sin tema, en edición: igual a la versión anterior',
    fn: async (page, ok, { base }) => {
      await abrirEstados(page, false);
      const nueva = await fotos(page);
      const pv = await base({}, true);
      await abrirEstados(pv, false);
      compararFotos(nueva, await fotos(pv), ok, 'abierto sin tema');
    }
  },
  ...TEMAS.map(tema => ({
    id: 'ga-1' + TEMAS.indexOf(tema), titulo: `tema ${tema}: <style>, colores de la paleta, alto (el de InputKey) y contraste AA`, pagina: { htmlAttrs: ` data-et-theme="${tema}"` },
    fn: async (page, ok) => {
      await abrirEstados(page, false);   // safe-input en edición: el campo (bloqueado se ve como solo lectura)
      const m = await medir(page), P = await paleta(page, tema);
      for (const id of IDS) {
        ok(m[id].estilo, `${id}: <style data-ix-theme> al principio del shadow`);
        ok(m[id].nEstilos === 1, `${id}: un solo <style data-ix-theme> (${m[id].nEstilos})`);
      }
      for (const k of ['es', 'si']) {
        const c = m.campos[k];
        ok(c.bg === P['input-bg'], `${k}: fondo = input-bg (${c.bg} vs ${P['input-bg']})`);
        ok(c.borde === P['input-border'], `${k}: borde = input-border (${c.borde} vs ${P['input-border']})`);
        ok(c.anchoBorde === '1px', `${k}: borde de 1px (${c.anchoBorde})`);
        ok(c.fg === P['input-fg'], `${k}: texto = input-fg (${c.fg})`);
        ok(c.radio === (P.radius === '0' ? '0px' : P.radius), `${k}: radio = radius (${c.radio} vs ${P.radius})`);
        ok(/Segoe UI Variable/.test(c.fuente), `${k}: letra del tema (${c.fuente.slice(0, 30)})`);
        ok(Math.abs(c.alto - 34) < 0.6, `${k}: alto 34px de la densidad normal (${c.alto})`);
        ok(Math.abs(c.alto - m.altoIk) < 1.1, `${k}: mismo alto que InputKey (${c.alto} vs ${m.altoIk})`);
      }
      ok(m.otros.optBg === P['menu-bg'], `opción del select con menu-bg (${m.otros.optBg})`);
      ok(m.otros.clBg === P.bg, `check-list: panel con bg (${m.otros.clBg})`);
      ok(m.otros.clHeadBg === P['header-bg'] && m.otros.clHeadFg === P['header-fg'], `check-list: encabezado header-bg/header-fg (${m.otros.clHeadBg} ${m.otros.clHeadFg})`);
      ok(m.otros.hechoBg === P['checked-bg'], `check-list: marcado con checked-bg (${m.otros.hechoBg} vs ${P['checked-bg']})`);
      ok(m.otros.itemAlto >= 31.5, `check-list: renglón de al menos el alto de fila (${m.otros.itemAlto})`);
      ok(m.otros.seBg === P['panel-bg'], `stack-edit: panel-bg (${m.otros.seBg})`);
      ok(m.otros.seItemBg === P.bg && m.otros.seItemFg === P.fg, `stack-edit: tarjeta bg/fg con los colores de omisión (${m.otros.seItemBg} ${m.otros.seItemFg})`);
      ok(m.otros.si2Bg === P['input-disabled-bg'], `safe-input deshabilitado con input-disabled-bg (${m.otros.si2Bg})`);
      const esquema = tema === 'oscuro' ? 'dark' : 'light';
      ok(m.otros.cs === esquema, `color-scheme ${esquema} (${m.otros.cs})`);
      for (const [n, k] of Object.entries(m.k)) ok(k >= 4.5, `contraste AA ${n}: ${k.toFixed(2)}`);
      for (const [n, k] of Object.entries(m.kIconos)) ok(k >= 3, `contraste de icono ${n}: ${k.toFixed(2)}`);
    }
  })),
  {
    id: 'ga-15', titulo: 'tema auto: claro u oscuro según el sistema', pagina: { htmlAttrs: ' data-et-theme="auto"' },
    fn: async (page, ok) => {
      await page.emulateMedia({ colorScheme: 'dark' }); await page.evaluate(() => __espera(400));
      const osc = await medir(page), Po = await paleta(page, 'oscuro');
      ok(osc.campos.es.bg === Po['input-bg'] && osc.campos.si.bg === Po['input-disabled-bg'], `auto + sistema oscuro: input-bg de oscuro (${osc.campos.es.bg}; safe-input bloqueado ${osc.campos.si.bg})`);
      await page.emulateMedia({ colorScheme: 'light' }); await page.evaluate(() => __espera(400));
      const cla = await medir(page), Pc = await paleta(page, 'claro');
      ok(cla.campos.es.borde === Pc['input-border'], `auto + sistema claro: paleta clara (${cla.campos.es.borde})`);
    }
  },
  {
    id: 'ga-16', titulo: 'densidad compacta y size="sm": alto 28px', pagina: { htmlAttrs: ' data-et-theme="claro" data-et-density="compacta"' },
    fn: async (page, ok) => {
      await page.evaluate(() => __espera(50));
      const m = await medir(page);
      for (const k of ['es', 'si']) ok(Math.abs(m.campos[k].alto - 28) < 0.6, `${k} compacta: 28px (${m.campos[k].alto})`);
      const r = await page.evaluate(async () => {
        document.documentElement.removeAttribute('data-et-density');
        ['es', 'si', 'ik'].forEach(id => document.getElementById(id).setAttribute('size', 'sm'));
        await __espera(100);
        const S = id => document.getElementById(id).shadowRoot, h = e => e.getBoundingClientRect().height;
        const fs = e => getComputedStyle(e).fontSize;
        return { es: h(S('es').querySelector('select')), si: h(S('si').querySelector('#SafeInput_contnr')), es2: h(S('es2').querySelector('select')), esFs: fs(S('es').querySelector('select')), siFs: fs(S('si').querySelector('.induxsoft-form-control')) };
      });
      for (const k of ['es', 'si']) ok(Math.abs(r[k] - 28) < 0.6, `${k} size="sm": 28px (${r[k]})`);
      ok(r.esFs === '13px' && r.siFs === '13px', `size="sm": letra 13px (${r.esFs} ${r.siFs})`);
      ok(Math.abs(r.es2 - 34) < 0.6, `sin size="sm" sigue en 34px (${r.es2})`);
    }
  },
  {
    id: 'ga-20', titulo: 'en caliente: <html>, theme propio, «ninguno» regresa a como estaba; desconectar y reconectar',
    fn: async (page, ok) => {
      await page.evaluate(() => __espera(50));
      const antes = await fotos(page);
      const Po = await paleta(page, 'oscuro'), Pj = await paleta(page, 'jade'), Pl = await paleta(page, 'libro-mayor');
      const props = ['es', 'cl', 'se', 'si'];
      await page.evaluate(() => { document.documentElement.setAttribute('data-et-theme', 'oscuro'); return __espera(400); });
      let m = await medir(page);
      ok(props.every(id => m[id].estilo), 'oscuro en <html> aplica a todos sin recargar');
      ok(m.campos.es.bg === Po['input-bg'] && m.campos.si.bg === Po['input-disabled-bg'], `oscuro: input-bg, safe-input bloqueado input-disabled-bg (${m.campos.es.bg} ${m.campos.si.bg})`);
      await page.evaluate(() => { document.documentElement.setAttribute('data-et-theme', 'libro-mayor'); return __espera(400); });
      m = await medir(page);
      ok(m.campos.es.borde === Pl['input-border'], `cambio a libro-mayor (${m.campos.es.borde})`);
      await page.evaluate((ids) => { ids.forEach(id => document.getElementById(id).setAttribute('theme', 'jade')); return __espera(400); }, props);
      m = await medir(page);
      ok(m.campos.es.borde === Pj['input-border'] && m.campos.si.borde === Pj['input-border'], `theme="jade" propio gana al heredado (${m.campos.es.borde})`);
      ok(m.otros.clHeadBg === Pj['header-bg'], 'check-list con theme propio');
      const re = await page.evaluate(async () => {
        const h = document.getElementById('si'), padre = h.parentNode, sig = h.nextSibling;
        h.remove(); await __espera(30);
        const fuera = h.shadowRoot.querySelectorAll('style[data-ix-theme]').length;
        padre.insertBefore(h, sig); await __espera(400);
        const dentro = h.shadowRoot.querySelectorAll('style[data-ix-theme]').length;
        h.setAttribute('theme', 'oscuro'); await __espera(400);
        return { fuera, dentro, bg: getComputedStyle(h.shadowRoot.querySelector('#SafeInput_contnr')).backgroundColor };
      });
      ok(re.fuera === 0, 'al desconectarse se quita el <style> (' + re.fuera + ')');
      ok(re.dentro === 1, 'al reconectarse vuelve uno solo (' + re.dentro + ')');
      ok(re.bg === Po['input-disabled-bg'], 'tras reconectar (bloqueado) sigue al día con su theme (' + re.bg + ')');
      await page.evaluate((ids) => { ids.forEach(id => document.getElementById(id).removeAttribute('theme')); document.documentElement.setAttribute('data-et-theme', 'ninguno'); return __espera(400); }, props);
      compararFotos(await fotos(page), antes, ok, '«ninguno» tras temas');
      await page.evaluate(() => { document.documentElement.removeAttribute('data-et-theme'); return __espera(400); });
      compararFotos(await fotos(page), antes, ok, 'sin atributo tras temas');
    }
  },
  {
    id: 'ga-21', titulo: 'sin InduxsoftTheme (archivo suelto): no falla y queda como antes',
    pagina: { sinTema: true },
    fn: async (page, ok, { base }) => {
      const r = await page.evaluate(() => typeof window.InduxsoftTheme);
      ok(r === 'undefined', 'InduxsoftTheme no existe: ' + r);
      await page.evaluate(() => __espera(50));
      compararFotos(await fotos(page), await base({ sinTema: true }), ok, 'sin módulo');
    }
  },
  {
    id: 'ga-30', titulo: 'capturas de los cuatro controles en los cuatro temas (y sin tema), con estados abiertos',
    fn: async (page, ok) => {
      if (SIN_PNG) return;
      fs.mkdirSync(OUT, { recursive: true });
      await abrirEstados(page);
      for (const tema of ['sin-tema', ...TEMAS]) {
        await page.evaluate(async (t) => {
          if (t === 'sin-tema') document.documentElement.removeAttribute('data-et-theme'); else document.documentElement.setAttribute('data-et-theme', t);
          const p = t === 'sin-tema' ? null : InduxsoftTheme.theme(t);
          document.body.style.background = p ? p.bg : ''; document.body.style.color = p ? p.fg : '';
          await __espera(400);
        }, tema);
        for (const c of CONTROLES) {
          const f = path.join(OUT, `${c}-${tema}.png`);
          await page.locator('#c-' + c).screenshot({ path: f });
          ok(fs.existsSync(f), 'captura ' + path.relative(REPO, f));
        }
      }
    }
  },
];

async function main() {
  if (!fs.existsSync(SRC)) { console.error('No existe ' + SRC); process.exit(2); }
  const JS = fs.readFileSync(SRC, 'utf8');
  // Sin el módulo de tema: se quita la copia embebida (entre <induxsoft-theme> y </induxsoft-theme>).
  const sinModulo = (js) => js.replace(/\/\* <induxsoft-theme v=[^>]*> \*\/[\s\S]*?\/\* <\/induxsoft-theme> \*\//, '');
  if (sinModulo(JS) === JS) { console.error('No encontré la copia embebida de induxsoft-theme para ga-21'); process.exit(2); }
  const browser = await chromium.launch();
  let fallas = 0, total = 0;
  const lista = PRUEBAS.filter(p => !FILTRO || p.id.includes(FILTRO) || p.titulo.includes(FILTRO));
  const abrir = async (ctx, pagina, controles, consola) => {
    const page = await ctx.newPage();
    // Math.random con semilla: CheckList pone id al azar y así el DOM de las dos versiones es comparable.
    await page.addInitScript(() => { let x = 12345; Math.random = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; });
    await page.addInitScript(() => { const o = Element.prototype.attachShadow; Element.prototype.attachShadow = function (i) { return o.call(this, Object.assign({}, i, { mode: 'open' })); }; });
    page.on('pageerror', e => consola.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') consola.push('console: ' + m.text()); });
    page.on('dialog', d => { consola.push('diálogo: ' + d.message()); d.dismiss().catch(() => { }); });
    await page.route('http://ga.test/**', (route) => {
      const u = new URL(route.request().url());
      if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html(pagina) });
      if (u.pathname === '/controls.js') { let js = controles ?? JS; if (pagina.sinTema) js = sinModulo(js); return route.fulfill({ status: 200, contentType: 'text/javascript', body: js }); }
      return route.fulfill({ status: 404, body: '' });
    });
    await page.route(/^(?!http:\/\/ga\.test\/).*/, r => r.abort());
    await page.goto('http://ga.test/');
    await page.waitForFunction(() => window.__ids && window.__ids.concat(['ik']).every(id => document.getElementById(id).shadowRoot && document.getElementById(id).shadowRoot.childElementCount > 1));
    return page;
  };
  for (const p of lista) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
    const consola = [], fallos = [];
    const ok = (cond, msg) => { if (!cond) fallos.push(msg); else if (VERBOSE) console.log('      ok ' + msg); };
    total++;
    try {
      const page = await abrir(ctx, p.pagina ?? {}, null, consola);
      await p.fn(page, ok, {
        base: async (pagina, devolverPagina) => {
          if (!BASE_JS) throw new Error('sin la copia base (git show ' + BASE_REF + ')');
          const pb = await abrir(ctx, pagina, BASE_JS, consola);
          if (devolverPagina) return pb;
          await pb.evaluate(() => __espera(50));
          return fotos(pb);
        }
      });
    } catch (e) { fallos.push('excepción: ' + e.message.split('\n')[0]); }
    if (consola.length) fallos.push('errores de consola: ' + JSON.stringify(consola));
    if (fallos.length) { fallas++; console.log('FALLA  ' + p.id + ' · ' + p.titulo); fallos.forEach(f => console.log('       - ' + f)); }
    else console.log('pasa   ' + p.id + ' · ' + p.titulo);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${total} pruebas · pasan ${total - fallas} · fallan ${fallas} · src ${path.relative(process.cwd(), SRC) || SRC} · base ${BASE_REF}`);
  process.exit(fallas ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
