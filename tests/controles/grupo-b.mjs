#!/usr/bin/env node
// Pruebas de tema del grupo B (tests/theme/CONTROLES.md): DateRange (<date-range>), MediaList (<media-list>),
// FilterText (<filter-text>) y FilterDateRange (<filter-date-range>) de src/js/induxsoft.controls.js.
//   1. Sin tema y con «ninguno»: idénticos a la versión anterior (HTML del shadow, hojas, DOM claro y getComputedStyle).
//   2. Con tema (claro, oscuro, jade, libro-mayor y auto): <style data-ix-theme>, colores de la paleta, alto de la
//      densidad y contraste AA.
//   3. En caliente: data-et-theme del <html>, theme propio, «ninguno» y desconectar/reconectar.
//   4. Capturas a tests/out/controles/<control>-<tema>.png (no se versionan).
// Sin red: las páginas se sirven con page.route. Datos ficticios.
//
//   node tests/controles/grupo-b.mjs [--src ruta/induxsoft.controls.js] [--base 8b81486] [--filtro texto] [--verbose] [--sin-png]
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
const CONTROLES = ['date-range', 'media-list', 'filter-text', 'filter-date-range'];

// Página con los cuatro controles (dos de cada uno con estados distintos). Los id internos de MediaList van fijos
// para que el DOM sea comparable (si no, son UUID al azar).
const MEDIA = JSON.stringify([
  { __internal_id__: 'm1', nombre: 'Portada ficticia' }, { __internal_id__: 'm2', nombre: 'Detalle' }, { __internal_id__: 'm3', nombre: 'Empaque' }
]).replace(/'/g, '&#39;');
function html(o = {}) {
  return `<!DOCTYPE html><html lang="es"${o.htmlAttrs ?? ''}><head><meta charset="utf-8"><title>grupo B</title>
<style>body{ margin:0; padding:16px; font-family: system-ui, sans-serif; } .caja{ padding:12px; width:760px; } </style>
<script src="/controls.js"></script>
</head><body${o.bodyAttrs ?? ''}>
<form id="f" onsubmit="return false">
<div class="caja" id="c-date-range"><date-range id="dr" start="2026-11-01" end="2026-11-15" hidden-input-name-start="fi" hidden-input-name-end="ff" ${o.attrs ?? ''}></date-range>
<div style="height:8px"></div><date-range id="dr2" start="2026-10-01" end="2026-10-31" ${o.attrs ?? ''}></date-range></div>
<div class="caja" id="c-media-list"><media-list id="ml" label-prop="nombre" outline-selected="true" max-size-media="7rem" data='${MEDIA}' ${o.attrs ?? ''}></media-list></div>
<div class="caja" id="c-filter-text"><filter-text id="ft" text-field="s" placeholder="Buscar producto" ${o.attrs ?? ''}></filter-text>
<div style="height:8px"></div><filter-text id="ft2" text-field="s2" value="tornillo" ${o.attrs ?? ''}></filter-text></div>
<div class="caja" id="c-filter-date-range"><filter-date-range id="fdr" years-options="2025,2026,2027" selection='{"mode":"month","year":"2026","month":"3"}' ${o.attrs ?? ''}></filter-date-range>
<div style="height:8px"></div><filter-date-range id="fdr2" years-options="2025,2026,2027" selection='{"mode":"range","from":"2026-01-01","to":"2026-01-31"}' ${o.attrs ?? ''}></filter-date-range></div>
</form>
${o.body ?? ''}
<script>
window.__ids = ['dr', 'dr2', 'ml', 'ft', 'ft2', 'fdr', 'fdr2'];
window.__espera = (ms) => new Promise(r => setTimeout(r, ms || 40));
// Foto de un control: shadow, hojas, DOM claro vecino (inputs ocultos) y getComputedStyle de todo lo visible del shadow.
window.__foto = function (id) {
  var h = document.getElementById(id), s = h.shadowRoot, out = { host: h.outerHTML.replace(h.innerHTML, ''), next: [], estilos: [], cs: {} };
  var n = h.nextElementSibling; while (n && n.localName === 'input') { out.next.push(n.outerHTML); n = n.nextElementSibling; }
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
// Fondo efectivo: sube por los ancestros (también cruza el shadow) mezclando los fondos con transparencia.
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

const sr = (id) => `document.getElementById('${id}').shadowRoot`;
// Datos de tema de los controles: el <style>, la marca ixt, colores computados y contrastes.
async function medir(page) {
  return page.evaluate(() => {
    const S = id => document.getElementById(id).shadowRoot;
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const r = {};
    for (const id of __ids) {
      const s = S(id), st = s.firstElementChild;
      r[id] = { estilo: !!(st && st.localName === 'style' && st.hasAttribute('data-ix-theme')), nEstilos: s.querySelectorAll('style[data-ix-theme]').length, ixt: !!s.querySelector('.ixt') };
    }
    const campo = { dr: S('dr').querySelector('#DateRange_contnr'), ft: S('ft').querySelector('.d-flex'), fdr: S('fdr').querySelector('#FDR_container'), ml: S('ml').querySelector('#MediaList_ppanel') };
    r.campos = {};
    for (const k in campo) { const e = campo[k]; r.campos[k] = { bg: cs(e, 'background-color'), borde: cs(e, 'border-top-color'), anchoBorde: cs(e, 'border-top-width'), alto: e.getBoundingClientRect().height, radio: cs(e, 'border-top-left-radius'), fg: cs(e, 'color'), fuente: cs(e, 'font-family') }; }
    const activo = S('fdr').querySelector('.month-button.active-month');
    const lbl = S('dr').querySelector('#DateRange_lblStr');
    const fdrLbl = S('fdr2').querySelector('#FDR_div_datef small');
    const ipt = S('ft').querySelector('input'), iptBloq = S('ft2').querySelector('input');
    const btnFt = S('ft').querySelector('button[title="Filtrar"]');
    const btnDr = S('dr').querySelector('#SafeInput_btnEdit');
    const mod = S('fdr2').querySelector('#FDR_btn_modify');
    const etiqueta = S('ml').querySelector('.label-img');
    const mes = S('fdr').querySelector('.month-button:not(.active-month)');
    const selMode = S('fdr').querySelector('#FDR_sel_mode'), opt = selMode.querySelector('option');
    const fecha = S('dr').querySelector('#DateRange_iptStr');
    r.k = {
      'texto del campo (filter-text)': __contraste(ipt),
      'filtro aplicado (deshabilitado)': __contraste(iptBloq),
      'etiqueta Desde (date-range, solo lectura)': __contraste(lbl),
      'fecha (date-range, solo lectura)': __contraste(fecha),
      'etiqueta Desde (filter-date-range)': __contraste(fdrLbl),
      'mes activo': __contraste(activo),
      'mes': __contraste(mes),
      'select de modo': __contraste(selMode),
      'opción del select': InduxsoftTheme.contrast(cs(opt, 'color'), cs(opt, 'background-color')),
      'botón Modificar': __contraste(mod),
      'etiqueta de imagen': __contraste(etiqueta),
    };
    r.kIconos = { 'icono Filtrar': __contraste(btnFt), 'icono Editar (date-range)': __contraste(btnDr) };
    r.otros = {
      activoBg: cs(activo, 'background-color'), activoFg: cs(activo, 'color'), optBg: cs(opt, 'background-color'),
      iptDisBg: cs(iptBloq, 'background-color'), lblFg: cs(lbl, 'color'), drDisBg: cs(S('dr').querySelector('.grow-1'), 'background-color'),
      cs: cs(campo.fdr, 'color-scheme'), svgFill: cs(S('ft2').querySelector('button[title="Editar"] svg path, button[title="Editar"] svg rect'), 'fill'), btnFg: cs(S('ft2').querySelector('button[title="Editar"]'), 'color'),
      modBg: cs(mod, 'background-color'), modBorde: cs(mod, 'border-top-color'), etiquetaBg: cs(etiqueta, 'background-color'),
    };
    return r;
  });
}
async function paleta(page, tema) {
  return page.evaluate((t) => { const p = InduxsoftTheme.theme(t), o = {}; for (const k of ['input-bg', 'input-fg', 'input-border', 'sel-bg', 'sel-fg', 'menu-bg', 'input-disabled-bg', 'muted-fg', 'bg', 'fg', 'accent']) o[k] = __rgb(p[k]); o.radius = p.radius; return o; }, tema);
}
function compararFotos(a, b, ok, etiqueta) {
  const ids = Object.keys(a);
  for (const id of ids) {
    const x = a[id], y = b[id];
    ok(x.host === y.host, `${etiqueta} ${id}: host igual`);
    ok(JSON.stringify(x.next) === JSON.stringify(y.next), `${etiqueta} ${id}: DOM claro vecino igual`);
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
// Estados abiertos para las capturas: DateRange en edición, MediaList con una imagen marcada, FilterDateRange de rango en edición.
async function abrirEstados(page, foco = true) {
  await page.evaluate(async (foco) => {
    const S = id => document.getElementById(id).shadowRoot;
    S('dr').querySelector('#SafeInput_btnEdit').click();
    S('ml').querySelectorAll('.media-item')[1].click();
    S('fdr2').querySelector('#FDR_btn_modify').click();
    if (foco) S('dr').querySelector('#DateRange_iptStr').focus();
    await __espera(700);
  }, foco);
}

const PRUEBAS = [
  {
    id: 'gb-01', titulo: 'sin tema: idéntico a la versión anterior (shadow, hojas, DOM claro, getComputedStyle)',
    fn: async (page, ok, { base }) => {
      await page.evaluate(() => __espera(50));
      const nueva = await fotos(page);
      const vieja = await base({});
      compararFotos(nueva, vieja, ok, 'sin tema');
    }
  },
  {
    id: 'gb-02', titulo: 'data-et-theme="ninguno": idéntico a la versión anterior', pagina: { htmlAttrs: ' data-et-theme="ninguno"' },
    fn: async (page, ok, { base }) => {
      await page.evaluate(() => __espera(50));
      const nueva = await fotos(page);
      const vieja = await base({ htmlAttrs: ' data-et-theme="ninguno"' });
      compararFotos(nueva, vieja, ok, 'ninguno');
    }
  },
  {
    id: 'gb-03', titulo: 'sin tema, en edición y con clics: igual a la versión anterior',
    fn: async (page, ok, { base }) => {
      // Sin foco: dos páginas del mismo contexto no lo tienen a la vez.
      await abrirEstados(page, false);
      const nueva = await fotos(page);
      const pv = await base({}, true);
      await abrirEstados(pv, false);
      const vieja = await fotos(pv);
      compararFotos(nueva, vieja, ok, 'abierto sin tema');
    }
  },
  ...TEMAS.map(tema => ({
    id: 'gb-1' + TEMAS.indexOf(tema), titulo: `tema ${tema}: <style>, colores de la paleta, alto de la densidad y contraste AA`, pagina: { htmlAttrs: ` data-et-theme="${tema}"` },
    fn: async (page, ok) => {
      await page.evaluate(() => __espera(50));
      const m = await medir(page), P = await paleta(page, tema);
      for (const id of ['dr', 'dr2', 'ml', 'ft', 'ft2', 'fdr', 'fdr2']) {
        ok(m[id].estilo, `${id}: <style data-ix-theme> al principio del shadow`);
        ok(m[id].nEstilos === 1, `${id}: un solo <style data-ix-theme> (${m[id].nEstilos})`);
        ok(m[id].ixt, `${id}: clase ixt`);
      }
      for (const k of ['dr', 'ft', 'fdr', 'ml']) {
        const c = m.campos[k];
        ok(c.bg === P['input-bg'], `${k}: fondo = input-bg (${c.bg} vs ${P['input-bg']})`);
        ok(c.borde === P['input-border'], `${k}: borde = input-border (${c.borde} vs ${P['input-border']})`);
        ok(c.anchoBorde === '1px', `${k}: borde de 1px (${c.anchoBorde})`);
        ok(c.fg === P['input-fg'], `${k}: texto = input-fg (${c.fg})`);
        ok(c.radio === (P.radius === '0' ? '0px' : P.radius), `${k}: radio = radius (${c.radio} vs ${P.radius})`);
        ok(/Segoe UI Variable/.test(c.fuente), `${k}: letra del tema (${c.fuente.slice(0, 30)})`);
        if (k !== 'ml') ok(Math.abs(c.alto - 34) < 0.6, `${k}: alto 34px de la densidad normal (${c.alto})`);
      }
      ok(m.otros.activoBg === P['sel-bg'] && m.otros.activoFg === P['sel-fg'], `mes activo sel-bg/sel-fg (${m.otros.activoBg} ${m.otros.activoFg})`);
      ok(m.otros.optBg === P['menu-bg'], `opción del select con menu-bg (${m.otros.optBg})`);
      ok(m.otros.iptDisBg === P['input-disabled-bg'], `filtro aplicado con input-disabled-bg (${m.otros.iptDisBg})`);
      ok(m.otros.drDisBg === P['input-disabled-bg'], `date-range de solo lectura con input-disabled-bg (${m.otros.drDisBg})`);
      ok(m.otros.lblFg === P['muted-fg'], `etiqueta con muted-fg (${m.otros.lblFg})`);
      ok(m.otros.svgFill === m.otros.btnFg, `iconos de filter-text en currentColor (${m.otros.svgFill} vs ${m.otros.btnFg})`);
      ok(m.otros.modBg === P.bg && m.otros.modBorde === P['input-border'], `botón secundario bg + input-border (${m.otros.modBg} ${m.otros.modBorde})`);
      const esquema = tema === 'oscuro' ? 'dark' : 'light';
      ok(m.otros.cs === esquema, `color-scheme ${esquema} (${m.otros.cs})`);
      for (const [n, k] of Object.entries(m.k)) ok(k >= 4.5, `contraste AA ${n}: ${k.toFixed(2)}`);
      for (const [n, k] of Object.entries(m.kIconos)) ok(k >= 3, `contraste de icono ${n}: ${k.toFixed(2)}`);
    }
  })),
  {
    id: 'gb-15', titulo: 'tema auto: claro u oscuro según el sistema', pagina: { htmlAttrs: ' data-et-theme="auto"' },
    fn: async (page, ok) => {
      await page.emulateMedia({ colorScheme: 'dark' }); await page.evaluate(() => __espera(400));
      const osc = await medir(page), Po = await paleta(page, 'oscuro');
      ok(osc.campos.ft.bg === Po['input-bg'], `auto + sistema oscuro: input-bg de oscuro (${osc.campos.ft.bg})`);
      await page.emulateMedia({ colorScheme: 'light' }); await page.evaluate(() => __espera(400));
      const cla = await medir(page), Pc = await paleta(page, 'claro');
      ok(cla.campos.fdr.bg === Pc['input-bg'] && cla.campos.fdr.borde === Pc['input-border'], `auto + sistema claro: paleta clara (${cla.campos.fdr.borde})`);
    }
  },
  {
    id: 'gb-16', titulo: 'densidad compacta y size="sm": alto 28px', pagina: { htmlAttrs: ' data-et-theme="claro" data-et-density="compacta"' },
    fn: async (page, ok) => {
      await page.evaluate(() => __espera(50));
      const m = await medir(page);
      for (const k of ['dr', 'ft', 'fdr']) ok(Math.abs(m.campos[k].alto - 28) < 0.6, `${k} compacta: 28px (${m.campos[k].alto})`);
      const r = await page.evaluate(async () => {
        document.documentElement.removeAttribute('data-et-density');
        ['dr', 'ft', 'fdr'].forEach(id => document.getElementById(id).setAttribute('size', 'sm'));
        await __espera(50);
        const S = id => document.getElementById(id).shadowRoot;
        return { dr: S('dr').querySelector('#DateRange_contnr').getBoundingClientRect().height, ft: S('ft').querySelector('.d-flex').getBoundingClientRect().height, fdr: S('fdr').querySelector('#FDR_container').getBoundingClientRect().height, fdr2: S('fdr2').querySelector('#FDR_container').getBoundingClientRect().height };
      });
      for (const k of ['dr', 'ft', 'fdr']) ok(Math.abs(r[k] - 28) < 0.6, `${k} size="sm": 28px (${r[k]})`);
      ok(Math.abs(r.fdr2 - 34) < 0.6, `sin size="sm" sigue en 34px (${r.fdr2})`);
    }
  },
  {
    id: 'gb-20', titulo: 'en caliente: <html>, theme propio, «ninguno» regresa a como estaba; desconectar y reconectar',
    fn: async (page, ok) => {
      await page.evaluate(() => __espera(50));
      const antes = await fotos(page);
      const Po = await paleta(page, 'oscuro'), Pj = await paleta(page, 'jade'), Pl = await paleta(page, 'libro-mayor');
      await page.evaluate(() => { document.documentElement.setAttribute('data-et-theme', 'oscuro'); return __espera(700); });
      let m = await medir(page);
      ok(['dr', 'ml', 'ft', 'fdr'].every(id => m[id].estilo && m[id].ixt), 'oscuro en <html> aplica a todos sin recargar');
      ok(m.campos.fdr.bg === Po['input-bg'] && m.campos.dr.bg === Po['input-bg'], `oscuro: input-bg (${m.campos.fdr.bg})`);
      await page.evaluate(() => { document.documentElement.setAttribute('data-et-theme', 'libro-mayor'); return __espera(700); });
      m = await medir(page);
      ok(m.campos.ft.borde === Pl['input-border'], `cambio a libro-mayor (${m.campos.ft.borde})`);
      await page.evaluate(() => { ['dr', 'ml', 'ft', 'fdr'].forEach(id => document.getElementById(id).setAttribute('theme', 'jade')); return __espera(700); });
      m = await medir(page);
      ok(m.campos.ft.borde === Pj['input-border'] && m.campos.fdr.borde === Pj['input-border'] && m.campos.dr.borde === Pj['input-border'], `theme="jade" propio gana al heredado (${m.campos.ft.borde})`);
      ok(m.campos.ml.borde === Pj['input-border'], 'media-list con theme propio');
      // Desconectar y reconectar: se suelta y se vuelve a ligar, sin duplicar el <style>.
      const re = await page.evaluate(async () => {
        const h = document.getElementById('fdr'), padre = h.parentNode, sig = h.nextSibling;
        h.remove(); await __espera(30);
        const fuera = h.shadowRoot.querySelectorAll('style[data-ix-theme]').length;
        padre.insertBefore(h, sig); await __espera(700);
        const dentro = h.shadowRoot.querySelectorAll('style[data-ix-theme]').length;
        h.setAttribute('theme', 'oscuro'); await __espera(700);
        return { fuera, dentro, bg: getComputedStyle(h.shadowRoot.querySelector('#FDR_container')).backgroundColor };
      });
      ok(re.fuera === 0, 'al desconectarse se quita el <style> (' + re.fuera + ')');
      ok(re.dentro === 1, 'al reconectarse vuelve uno solo (' + re.dentro + ')');
      ok(re.bg === Po['input-bg'], 'tras reconectar sigue al día con su theme (' + re.bg + ')');
      await page.evaluate(() => { ['dr', 'ml', 'ft', 'fdr'].forEach(id => document.getElementById(id).removeAttribute('theme')); document.documentElement.setAttribute('data-et-theme', 'ninguno'); return __espera(700); });
      const despues = await fotos(page);
      compararFotos(despues, antes, ok, '«ninguno» tras temas');
      await page.evaluate(() => { document.documentElement.removeAttribute('data-et-theme'); return __espera(700); });
      compararFotos(await fotos(page), antes, ok, 'sin atributo tras temas');
    }
  },
  {
    id: 'gb-21', titulo: 'sin InduxsoftTheme (archivo suelto): no falla y queda como antes',
    pagina: { sinTema: true },
    fn: async (page, ok, { base }) => {
      const r = await page.evaluate(() => typeof window.InduxsoftTheme);
      ok(r === 'undefined', 'InduxsoftTheme no existe: ' + r);
      await page.evaluate(() => __espera(50));
      const nueva = await fotos(page);
      const vieja = await base({ sinTema: true });
      compararFotos(nueva, vieja, ok, 'sin módulo');
    }
  },
  {
    id: 'gb-30', titulo: 'capturas de los cuatro controles en los cuatro temas (y sin tema), con estados abiertos',
    fn: async (page, ok) => {
      if (SIN_PNG) return;
      fs.mkdirSync(OUT, { recursive: true });
      await abrirEstados(page);
      for (const tema of ['sin-tema', ...TEMAS]) {
        await page.evaluate(async (t) => {
          if (t === 'sin-tema') document.documentElement.removeAttribute('data-et-theme'); else document.documentElement.setAttribute('data-et-theme', t);
          const p = t === 'sin-tema' ? null : InduxsoftTheme.theme(t);
          document.body.style.background = p ? p.bg : ''; document.body.style.color = p ? p.fg : '';
          await __espera(700);
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
  if (sinModulo(JS) === JS) { console.error('No encontré la copia embebida de induxsoft-theme para gb-21'); process.exit(2); }
  const browser = await chromium.launch();
  let fallas = 0, total = 0;
  const lista = PRUEBAS.filter(p => !FILTRO || p.id.includes(FILTRO) || p.titulo.includes(FILTRO));
  const abrir = async (ctx, pagina, controles, consola) => {
    const page = await ctx.newPage();
    await page.addInitScript(() => { const o = Element.prototype.attachShadow; Element.prototype.attachShadow = function (i) { return o.call(this, Object.assign({}, i, { mode: 'open' })); }; });
    page.on('pageerror', e => consola.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') consola.push('console: ' + m.text()); });
    page.on('dialog', d => { consola.push('diálogo: ' + d.message()); d.dismiss().catch(() => { }); });
    await page.route('http://gb.test/**', (route) => {
      const u = new URL(route.request().url());
      if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html(pagina) });
      if (u.pathname === '/controls.js') { let js = controles ?? JS; if (pagina.sinTema) js = sinModulo(js); return route.fulfill({ status: 200, contentType: 'text/javascript', body: js }); }
      return route.fulfill({ status: 404, body: '' });
    });
    await page.route(/^(?!http:\/\/gb\.test\/).*/, r => r.abort());
    await page.goto('http://gb.test/');
    await page.waitForFunction(() => window.__ids && window.__ids.every(id => document.getElementById(id).shadowRoot && document.getElementById(id).shadowRoot.childElementCount > 1));
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
