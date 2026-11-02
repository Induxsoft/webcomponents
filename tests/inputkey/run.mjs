#!/usr/bin/env node
// Pruebas unitarias de InputKey (<input-key>, src/js/induxsoft.controls.js): correcciones IK-1 a IK-5 (2026-11-02)
// y lo que ya funcionaba. Cada prueba afirma lo que espera (no son fotos). Datos ficticios; el servidor se simula en
// la página (fetch reemplazado), sin red.
//
//   node tests/inputkey/run.mjs [--src ruta/induxsoft.controls.js] [--filtro texto] [--verbose]
//
// Código de salida: 0 si todo pasa, 1 si alguna prueba falla, 2 si el arnés falla.
// Con la copia de main anterior a las correcciones (git show 625ee98:src/js/induxsoft.controls.js > /tmp/c.js;
// --src /tmp/c.js) fallan las pruebas IK-1 a IK-5.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const SRC = path.resolve(opt('--src', path.join(REPO, 'src/js/induxsoft.controls.js')));
const EDITABLE = path.join(REPO, 'src/js/induxsoft.controls.editable.js');
// Copia de InputKey ANTES de InputKey 2 (main 35834a4, ya con IK-1 a IK-5) para la prueba de identidad sin tema.
// La X de agregar y editar se normaliza (#FFF -> #333): es la única diferencia intencional sin atributos nuevos.
const BASE_REF = opt('--base', '35834a4');
let BASE_JS = null;
try { BASE_JS = (await import('node:child_process')).execSync(`git -C ${JSON.stringify(REPO)} show ${BASE_REF}:src/js/induxsoft.controls.js`, { encoding: 'utf8', maxBuffer: 1 << 26 }).replaceAll('fill="#FFF" class="bi bi-x-lg"', 'fill="#333" class="bi bi-x-lg"'); } catch { }
const FILTRO = opt('--filtro', null);
const VERBOSE = argv.includes('--verbose');

// ---------- página ----------
// Catálogo inventado. clave = data-search, id = data-key, nombre = data-text, codbar = código de barras.
const CATALOGO = [
  { id: 1, clave: 'C-001', nombre: 'Tuerca de prueba', codbar: '7900000000011' },
  { id: 2, clave: 'C-002', nombre: 'Tornillo ficticio', codbar: '7900000000028' },
  { id: 3, clave: 'C-003', nombre: 'Arandela inventada', codbar: '7900000000035' },
  { id: 4, clave: 'C-0031', nombre: 'Arandela inventada grande', codbar: '7900000000042' },
  { id: 5, clave: 'X-100', nombre: 'Pieza de demostración', codbar: '' },
];

function html(attrs = '', o = {}) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>InputKey</title>
<script>
// Servidor simulado: /buscar?q=<texto> busca en clave y nombre (LIKE, sin mayúsculas) o igual en codbar.
window.__CAT = ${JSON.stringify(CATALOGO)};
window.__pet = []; window.__retraso = {}; window.__esc = []; window.__cambios = [];
window.fetch = function (url, opts) {
  var u = new URL(url, location.href), q = u.searchParams.get('q');
  var reg = { url: u.search, q: q, signal: !!(opts && opts.signal), abortada: null };
  window.__pet.push(reg);
  var s = (q || '').toLowerCase();
  var r = window.__CAT.filter(function (p) { return p.codbar === s || p.clave.toLowerCase().includes(s) || p.nombre.toLowerCase().includes(s); });
  var ms = 20 + (window.__retraso[q] || 0);
  return new Promise(function (res) {
    setTimeout(function () { reg.abortada = !!(opts && opts.signal && opts.signal.aborted); res({ ok: true, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(r))); } }); }, ms);
  });
};
['keydown', 'keyup'].forEach(function (t) {
  document.addEventListener(t, function (e) { if (e.key === 'Escape') window.__esc.push('document:' + t + ':captura'); }, true);
  document.addEventListener(t, function (e) { if (e.key === 'Escape') window.__esc.push('document:' + t + ':burbuja'); });
});
</script>
${o.antes ?? ''}
<script src="/controls.js"></script>
${o.editable ? '<script src="/editable.js"></script>' : ''}
${o.head ?? ''}
</head><body${o.bodyAttrs ?? ''}>
<button id="abrir" type="button">abrir</button>
<input-key id="ik" name="ik" data-key="id" data-search="clave" data-text="nombre" data-source="/buscar?q=@search" columns="clave,nombre,codbar" colcaptions="Clave,Nombre,Código de barras" ${attrs}></input-key>
${o.body ?? ''}
<script>
document.addEventListener('DOMContentLoaded', function () {
  var ik = document.getElementById('ik');
  ik.change_event = function (d) { window.__cambios.push(d ? (d.clave || '?') : null); };
});
// Con el banco el shadow se abre (ver attachShadow abajo); en producción es cerrado.
window.__s = function () { return document.getElementById('ik').shadowRoot; };
window.__abierta = function () { return !__s().getElementById('container2').classList.contains('hide-element'); };
window.__filas = function () { return Array.from(__s().querySelectorAll('#body_tables_container2 tr')).map(function (tr) { return tr.cells[0].textContent; }); };
window.__foco = function () { var a = document.activeElement; if (a && a.id === 'ik') { var b = __s().activeElement; return 'ik>' + (b ? (b.id || b.tagName + (b.cells ? ':' + b.cells[0].textContent : '')) : ''); } return a ? (a.id || a.tagName) : null; };
</script>
</body></html>`;
}

// ---------- pruebas ----------
const esperar = (page, ms) => page.waitForTimeout(ms);
// Abre la búsqueda como lo hace EdiTable (searchText) desde el botón #abrir, que queda con el foco.
const buscar = async (page, texto, auto = true, ms = 120) => {
  await page.focus('#abrir');
  await page.evaluate(([t, a]) => document.getElementById('ik').searchText(t, a), [texto, auto]);
  await esperar(page, ms);
};
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const clicShadow = async (page, css) => {
  const p = await ev(page, (s) => { const r = __s().querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, css);
  await page.mouse.click(p.x, p.y);
  await esperar(page, 50);
};
const sinDoc = (esc) => esc.filter(x => x.startsWith('document:'));

const PRUEBAS = [
  // ===== IK-1: Esc
  { id: 'ik1-esc-lista', titulo: 'IK-1: Esc con la lista abierta la cierra, no llega a document (keydown ni keyup) y el foco vuelve al que abrió', fn: async (page, ok) => {
    await buscar(page, 'arandela');
    ok(await ev(page, () => __abierta()), 'la lista se abre (2 resultados)');
    await ev(page, () => { __esc.length = 0; });
    await page.keyboard.press('Escape'); await esperar(page, 30);
    ok(!(await ev(page, () => __abierta())), 'la lista se cierra');
    ok(sinDoc(await ev(page, () => __esc)).length === 0, 'ningún listener de document recibe el Esc: ' + JSON.stringify(await ev(page, () => __esc)));
    ok((await ev(page, () => __foco())) === 'abrir', 'el foco vuelve a #abrir: ' + (await ev(page, () => __foco())));
    ok((await ev(page, () => __cambios.length)) === 0, 'sin change_event');
  } },
  { id: 'ik1-esc-buscador', titulo: 'IK-1: Esc con el foco en el buscador de la ventana (búsqueda vacía) tampoco llega a document', fn: async (page, ok) => {
    await buscar(page, '', false);
    ok(await ev(page, () => __abierta()), 'la ventana se abre sin resultados');
    ok((await ev(page, () => __foco())).startsWith('ik>INPUT'), 'el foco está en el buscador de la ventana');
    await ev(page, () => { __esc.length = 0; });
    await page.keyboard.press('Escape'); await esperar(page, 30);
    ok(!(await ev(page, () => __abierta())) && sinDoc(await ev(page, () => __esc)).length === 0, 'se cierra y document no recibe nada');
    ok((await ev(page, () => __foco())) === 'abrir', 'el foco vuelve a #abrir');
  } },
  { id: 'ik1-esc-sostenido', titulo: 'IK-1: Esc sostenido (keydown repetido) no llega a document después de cerrar', fn: async (page, ok) => {
    await buscar(page, 'arandela');
    await ev(page, () => { __esc.length = 0; });
    await page.keyboard.down('Escape'); await page.keyboard.down('Escape'); await page.keyboard.down('Escape'); await page.keyboard.up('Escape'); await esperar(page, 30);
    ok(sinDoc(await ev(page, () => __esc)).length === 0, 'document no recibe nada: ' + JSON.stringify(await ev(page, () => __esc)));
  } },
  { id: 'ik1-esc-cerrada', titulo: 'IK-1: con la ventana cerrada, Esc llega a document como siempre', fn: async (page, ok) => {
    await buscar(page, 'arandela');
    await page.keyboard.press('Escape'); await esperar(page, 30);
    await ev(page, () => { __esc.length = 0; });
    await page.keyboard.press('Escape'); await esperar(page, 30);
    const e = await ev(page, () => __esc);
    ok(['document:keydown:captura', 'document:keydown:burbuja', 'document:keyup:captura', 'document:keyup:burbuja'].every(x => e.includes(x)), 'document recibe keydown y keyup: ' + JSON.stringify(e));
  } },
  { id: 'ik1-esc-listeners', titulo: 'IK-1: los listeners de Esc en window solo existen con la ventana abierta', fn: async (page, ok) => {
    // Se cuentan con un Esc sintético en body: si InputKey escucha (captura de window), lo consume
    // (stopImmediatePropagation) y el listener de prueba en la burbuja de window no lo ve.
    await ev(page, () => { window.__w = 0; window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.__w++; }); });
    const toque = () => ev(page, () => { const b = document.body; b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); b.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true })); return window.__w; });
    ok((await toque()) === 1, 'antes de abrir: nadie lo consume');
    await buscar(page, 'arandela');
    ok((await toque()) === 1 && !(await ev(page, () => __abierta())), 'abierta: InputKey lo consume y cierra');
    ok((await toque()) === 2, 'después de cerrar: ya no escucha');
  } },
  // ===== IK-2: Cancelar / X
  { id: 'ik2-cancelar', titulo: 'IK-2: «Cancelar» cierra sin change_event y sin cambiar el valor aceptado', fn: async (page, ok) => {
    await buscar(page, 'C-002');
    ok(JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'C-002 aceptado (selección automática)');
    await buscar(page, 'arandela');
    ok(await ev(page, () => __abierta()), 'lista abierta');
    await clicShadow(page, '#close2_container2');
    ok(!(await ev(page, () => __abierta())), 'cerrada');
    ok(JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'sin change_event nuevo: ' + JSON.stringify(await ev(page, () => __cambios)));
    ok((await ev(page, () => document.getElementById('ik').getAttribute('value'))) === '2', 'value sigue en 2');
    ok((await ev(page, () => __s().getElementById('input_search_container').value)) === 'C-002', 'el buscador vuelve a mostrar C-002');
    ok((await ev(page, () => __foco())) === 'abrir', 'el foco vuelve a #abrir');
  } },
  { id: 'ik2-x', titulo: 'IK-2: la X del encabezado cierra igual que «Cancelar»', fn: async (page, ok) => {
    await buscar(page, 'C-002');
    await buscar(page, 'arandela');
    await clicShadow(page, '#close_header_container2');
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'cerrada, sin change_event');
    ok((await ev(page, () => __foco())) === 'abrir', 'el foco vuelve a #abrir');
  } },
  { id: 'ik2-cancelar-sin-valor', titulo: 'IK-2: «Cancelar» sin valor aceptado no dispara change_event(null)', fn: async (page, ok) => {
    await buscar(page, 'arandela');
    await clicShadow(page, '#close2_container2');
    ok((await ev(page, () => __cambios.length)) === 0, 'sin change_event');
    ok((await ev(page, () => document.getElementById('ik').getAttribute('value'))) === null, 'el atributo value no se toca');
  } },
  { id: 'ik2-aceptar', titulo: 'Aceptar sigue disparando change_event con el registro de la fila', fn: async (page, ok) => {
    await buscar(page, 'arandela');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await esperar(page, 30);
    ok(JSON.stringify(await ev(page, () => __cambios)) === '["C-0031"]' && !(await ev(page, () => __abierta())), 'C-0031 aceptado: ' + JSON.stringify(await ev(page, () => __cambios)));
  } },
  // ===== IK-3: selección automática
  { id: 'ik3-clave-exacta', titulo: 'IK-3: un resultado igual a la clave (data-search) se selecciona solo, aunque sea un registro nuevo', fn: async (page, ok) => {
    await buscar(page, 'C-002');
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'C-002 sin abrir la lista');
    await buscar(page, 'X-100');
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-002","X-100"]', 'X-100 (otro registro) sin abrir la lista');
  } },
  { id: 'ik3-codbar', titulo: 'IK-3: un resultado igual al código de barras se selecciona solo', fn: async (page, ok) => {
    await buscar(page, '7900000000011');
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-001"]', 'C-001 por código de barras');
  } },
  { id: 'ik3-llave', titulo: 'IK-3: un resultado igual a la llave (data-key) se selecciona solo', fn: async (page, ok) => {
    await ev(page, () => { __CAT.push({ id: 77, clave: 'Z-9', nombre: 'Ficticio 77', codbar: '' }); });
    await buscar(page, '77');
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["Z-9"]', 'Z-9 por llave 77: ' + JSON.stringify(await ev(page, () => __cambios)));
  } },
  { id: 'ik3-mayusculas', titulo: 'IK-3: la comparación no distingue mayúsculas', fn: async (page, ok) => {
    // c-003 trae C-003 y C-0031: dos resultados, se abre la lista. c-002 (un resultado) entra.
    await buscar(page, 'c-003');
    ok((await ev(page, () => __abierta())) && (await ev(page, () => __cambios.length)) === 0, 'c-003: dos resultados, lista abierta');
    await page.keyboard.press('Escape');
    await buscar(page, 'c-002');
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'c-002 entra');
  } },
  { id: 'ik3-parcial', titulo: 'IK-3: un solo resultado que coincide solo en parte NO se selecciona: abre la lista', fn: async (page, ok) => {
    await buscar(page, 'tornillo');
    ok((await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __filas())) === '["C-002"]', 'lista con C-002');
    ok((await ev(page, () => __cambios.length)) === 0, 'sin change_event');
  } },
  { id: 'ik3-repeticion', titulo: 'IK-3: tampoco por ser el registro aceptado la vez anterior (regla vieja)', fn: async (page, ok) => {
    await buscar(page, 'C-002');
    await buscar(page, 'tornillo');
    ok(await ev(page, () => __abierta()), 'parcial del mismo registro: abre la lista');
    ok(JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'sin change_event nuevo');
  } },
  { id: 'ik3-varios', titulo: 'IK-3: con dos o más resultados se abre la lista aunque uno sea exacto', fn: async (page, ok) => {
    await buscar(page, 'C-003');
    ok((await ev(page, () => __abierta())) && (await ev(page, () => __filas())).length === 2, 'lista con C-003 y C-0031');
  } },
  { id: 'ik3-autoselect-false', titulo: 'IK-3: searchText(texto, false) nunca selecciona solo (F4, botón, buscador de la ventana)', fn: async (page, ok) => {
    await buscar(page, 'C-002', false);
    ok((await ev(page, () => __abierta())) && (await ev(page, () => __cambios.length)) === 0, 'abre la lista');
  } },
  { id: 'ik3-atributo-autoselect', titulo: 'IK-3: el atributo autoselect="false" desactiva la selección automática', attrs: 'autoselect="false"', fn: async (page, ok) => {
    await buscar(page, 'C-002');
    ok((await ev(page, () => __abierta())) && (await ev(page, () => __cambios.length)) === 0, 'abre la lista');
  } },
  { id: 'ik3-autoselect-fields', titulo: 'IK-3: autoselect-fields="nombre" compara solo contra esos campos', attrs: 'autoselect-fields="nombre"', fn: async (page, ok) => {
    await buscar(page, 'C-002');
    ok(await ev(page, () => __abierta()), 'la clave ya no cuenta: abre la lista');
    await page.keyboard.press('Escape');
    await buscar(page, 'tornillo ficticio');
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'el nombre exacto sí');
  } },
  { id: 'ik3-enter-buscador', titulo: 'IK-3: Enter en el buscador propio (input-key visible) con una clave exacta la selecciona sola', fn: async (page, ok) => {
    await page.click('#ik');
    await ev(page, () => { const i = __s().getElementById('input_search_container'); i.focus(); });
    await page.keyboard.type('C-001'); await page.keyboard.press('Enter'); await esperar(page, 120);
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-001"]', 'C-001: ' + JSON.stringify(await ev(page, () => __cambios)));
  } },
  { id: 'ik2-esc-buscador-propio', titulo: 'IK-2: Esc después de buscar desde el buscador propio: el foco vuelve a él y salir no busca ni limpia', fn: async (page, ok) => {
    await ev(page, () => { const i = __s().getElementById('input_search_container'); i.focus(); });
    await page.keyboard.type('arandela'); await page.keyboard.press('Enter'); await esperar(page, 120);
    ok(await ev(page, () => __abierta()), 'lista abierta');
    await page.keyboard.press('Escape'); await esperar(page, 30);
    ok((await ev(page, () => __foco())) === 'ik>input_search_container', 'el foco vuelve al buscador: ' + (await ev(page, () => __foco())));
    const n = await ev(page, () => __pet.length);
    await page.focus('#abrir'); await esperar(page, 120);
    ok(!(await ev(page, () => __abierta())) && (await ev(page, () => __pet.length)) === n && (await ev(page, () => __cambios.length)) === 0, 'el blur no vuelve a buscar ni dispara change_event');
  } },
  // ===== IK-4: codificación
  { id: 'ik4-encode', titulo: 'IK-4: el texto va con encodeURIComponent: &, #, +, %, espacio y $ llegan completos', fn: async (page, ok) => {
    await buscar(page, 'A&B #1+% $&', false);
    const p = await ev(page, () => __pet[0]);
    ok(p && p.q === 'a&b #1+% $&', 'el servidor recibe «a&b #1+% $&»: ' + (p && p.q));
    ok(p && p.url === '?q=a%26b%20%231%2B%25%20%24%26', 'URL codificada: ' + (p && p.url));
  } },
  { id: 'ik4-minusculas', titulo: 'IK-4: se conserva el envío en minúsculas (compatibilidad)', fn: async (page, ok) => {
    await buscar(page, 'C-002');
    ok((await ev(page, () => __pet[0].q)) === 'c-002', 'c-002');
  } },
  { id: 'ik4-onbeforesearch', titulo: 'IK-4: onBeforeSearch recibe la URL ya codificada y puede agregarle parámetros', fn: async (page, ok) => {
    await ev(page, () => { document.getElementById('ik').onBeforeSearch = (u) => u + '&extra=1'; });
    await buscar(page, 'a b', false);
    ok((await ev(page, () => __pet[0].url)) === '?q=a%20b&extra=1', await ev(page, () => __pet[0].url));
  } },
  // ===== IK-5: búsquedas simultáneas
  { id: 'ik5-vieja-despues', titulo: 'IK-5: la respuesta vieja que llega después de la nueva se descarta; la petición vieja se aborta', fn: async (page, ok) => {
    await ev(page, () => { __retraso['arandela'] = 300; const ik = document.getElementById('ik'); ik.searchText('arandela', true); setTimeout(() => ik.searchText('C-002', true), 10); });
    await esperar(page, 120);
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'la nueva (C-002) entra: ' + JSON.stringify(await ev(page, () => __cambios)));
    await esperar(page, 400);
    ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'la vieja no abre la lista ni cambia el valor');
    const p = await ev(page, () => __pet);
    ok(p.length === 2 && p[0].signal && p[0].abortada === true && p[1].abortada === false, 'la vieja va con signal y queda abortada: ' + JSON.stringify(p));
  } },
  { id: 'ik5-buscador-ventana', titulo: 'IK-5: en el buscador de la ventana manda la última búsqueda', fn: async (page, ok) => {
    await buscar(page, '', false);
    await ev(page, () => {
      __retraso['tuerca'] = 300;
      const inp = __s().querySelector('#search_section_container2 input');
      const enter = () => inp.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, composed: true }));
      inp.value = 'tuerca'; enter(); setTimeout(() => { inp.value = 'tornillo'; enter(); }, 10);
    });
    await esperar(page, 600);
    ok((await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __filas())) === '["C-002"]', 'lista con tornillo (C-002): ' + JSON.stringify(await ev(page, () => __filas())));
  } },
  { id: 'ik5-error', titulo: 'IK-5: una respuesta con error de la búsqueda vieja no muestra alerta', fn: async (page, ok, dialogos) => {
    await ev(page, () => {
      const f0 = window.fetch;
      window.fetch = (url, opts) => { const q = new URL(url, location.href).searchParams.get('q'); if (q === 'falla') return new Promise((_, rej) => setTimeout(() => rej(new Error('red ficticia')), 200)); return f0(url, opts); };
      const ik = document.getElementById('ik'); ik.searchText('falla', true); setTimeout(() => ik.searchText('C-002', true), 10);
    });
    await esperar(page, 400);
    ok(dialogos.length === 0, 'sin alertas: ' + JSON.stringify(dialogos));
    ok(JSON.stringify(await ev(page, () => __cambios)) === '["C-002"]', 'C-002 entra');
  } },
  { id: 'ik5-error-vigente', titulo: 'El error de la búsqueda vigente sigue mostrando la alerta de siempre', fn: async (page, ok, dialogos) => {
    await ev(page, () => { window.fetch = () => Promise.reject(new Error('red ficticia')); document.getElementById('ik').searchText('algo', true); });
    await esperar(page, 100);
    ok(dialogos.length === 1 && dialogos[0].includes('Ocurrió un error al invocar el servicio'), JSON.stringify(dialogos));
  } },
  // ===== IK-6: con data-source-array, la llave del registro elegido antes no filtra las búsquedas nuevas
  ...(() => {
    const ACC = [{ id: 'imprimir', title: 'Imprimir' }, { id: 'cancelar', title: 'Cancelar' }, { id: 'copiar', title: 'Copiar' }, { id: 'enviar', title: 'Enviar por correo' }];
    const pagina = { body: `<button id="btn_acc" type="button">Acciones</button><input-key id="ika" data-key="id" data-search="title" data-text="title" data-source-array='${JSON.stringify(ACC)}' columns="title" colcaptions="Acción" hidden-input="false" control-styles="#container{ display: none !important; }"></input-key>
<script>document.addEventListener('DOMContentLoaded', function () { var a = document.getElementById('ika'); window.__acc = []; a.change_event = function (d) { window.__acc.push(d ? d.id : null); }; });
window.__filasA = function () { return Array.from(document.getElementById('ika').shadowRoot.querySelectorAll('#body_tables_container2 tr')).map(function (tr) { return tr.cells[0].textContent; }); };</script>` };
    const abrirA = async (page, t = '%') => { await page.focus('#btn_acc'); await ev(page, (x) => document.getElementById('ika').searchText(x), t); await esperar(page, 120); };
    return [
      { id: 'ik6-menu-reabre', titulo: 'IK-6: menú de acciones (V12 uie.printItemActions): tras elegir una, searchText("%") vuelve a mostrar las 4', pagina, fn: async (page, ok) => {
        await abrirA(page);
        ok((await ev(page, () => __filasA())).length === 4, 'primera apertura: 4 filas');
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await esperar(page, 120);
        ok(JSON.stringify(await ev(page, () => __acc)) === '["cancelar"]', 'se elige Cancelar: ' + JSON.stringify(await ev(page, () => __acc)));
        await abrirA(page);
        const f = await ev(page, () => __filasA());
        ok(f.length === 4, 'segunda apertura: 4 filas, no solo la elegida: ' + JSON.stringify(f));
        ok(JSON.stringify(await ev(page, () => __acc)) === '["cancelar"]', 'reabrir no vuelve a disparar change_event');
      } },
      { id: 'ik6-texto-nuevo', titulo: 'IK-6: tras elegir una, un texto distinto filtra por el texto (no por la llave anterior)', pagina, fn: async (page, ok) => {
        await abrirA(page);
        await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await esperar(page, 120);
        await abrirA(page, 'ar');
        const f = await ev(page, () => __filasA());
        ok(JSON.stringify(f) === '["Cancelar","Copiar","Enviar por correo"]', 'filtra por «ar»: ' + JSON.stringify(f));
      } },
    ];
  })(),
  // ===== IK-7: componentes insertados después de cargar la página
  { id: 'ik7-insertado', titulo: 'IK-7: un input-key insertado con createElement después de cargar se construye: campo, inputv con name en el formulario y data-value', fn: async (page, ok) => {
    const r = await ev(page, async () => {
      const f = document.createElement('form'); f.id = 'f7'; document.body.appendChild(f);
      const a = document.createElement('input-key');
      ['data-key:id', 'data-search:clave', 'data-text:nombre', 'columns:clave,nombre'].forEach(x => { const i = x.indexOf(':'); a.setAttribute(x.slice(0, i), x.slice(i + 1)); });
      f.appendChild(a);
      // Atributos puestos en el mismo script DESPUÉS de insertarlo: también se toman (se construye en un microtask).
      a.setAttribute('name', 'prod7'); a.setAttribute('data-value', JSON.stringify({ id: 2, clave: 'C-002', nombre: 'Tornillo ficticio' }));
      const antes = !!a.shadowRoot;
      await new Promise(res => setTimeout(res, 50));
      const s = a.shadowRoot;
      return { antes, shadow: !!s, campo: !!(s && s.getElementById('container')), form: new FormData(f).get('prod7'), nombres: f.querySelectorAll('input[name="prod7"]').length, clave: s ? s.getElementById('search_container') && s.getElementById('search_container').value : null };
    });
    ok(r.antes === false, 'no se construye en el mismo instante (microtask): ' + JSON.stringify(r));
    ok(r.shadow && r.campo, 'se construye y aparece el campo: ' + JSON.stringify(r));
    ok(r.form === '2' && r.nombres === 1, 'el formulario manda prod7=2 con un solo control: ' + JSON.stringify(r));
  } },
  { id: 'ik7-reinsertado', titulo: 'IK-7: insertado, quitado y vuelto a insertar no se construye dos veces; quitado antes de construirse, se construye al volver', fn: async (page, ok) => {
    const r = await ev(page, async () => {
      const espera = () => new Promise(res => setTimeout(res, 40));
      const a = document.createElement('input-key'); a.setAttribute('data-key', 'id'); a.setAttribute('name', 'r7');
      document.body.appendChild(a); await espera();
      const s1 = a.shadowRoot;
      a.remove(); document.body.appendChild(a); await espera();
      const b = document.createElement('input-key'); b.setAttribute('data-key', 'id'); b.setAttribute('name', 'q7');
      document.body.appendChild(b); b.remove(); await espera();
      const bAntes = !!b.shadowRoot;
      document.body.appendChild(b); await espera();
      return { mismo: !!s1 && a.shadowRoot === s1, inputs: document.querySelectorAll('input[name="r7"]').length, bAntes, bDespues: !!b.shadowRoot, bInputs: document.querySelectorAll('input[name="q7"]').length };
    });
    ok(r.mismo && r.inputs === 1, 'a: un solo shadow y un solo inputv: ' + JSON.stringify(r));
    ok(r.bAntes === false && r.bDespues === true && r.bInputs === 1, 'b: no se construye quitado; sí al volver, una vez: ' + JSON.stringify(r));
  } },
  { id: 'ik7-otros', titulo: 'IK-7: los demás componentes del núcleo insertados después de cargar también se construyen (una vez)', fn: async (page, ok) => {
    const r = await ev(page, async () => {
      const tags = ['edit-select', 'check-list', 'stack-edit', 'date-range', 'safe-input', 'media-list', 'filter-text', 'filter-date-range'];
      const out = {};
      for (const t of tags) {
        const e = document.createElement(t); document.body.appendChild(e);
        await new Promise(res => setTimeout(res, 20));
        const s = e.shadowRoot; e.remove(); document.body.appendChild(e);
        await new Promise(res => setTimeout(res, 20));
        out[t] = !!s && e.shadowRoot === s;
      }
      return out;
    });
    const mal = Object.keys(r).filter(k => !r[k]);
    ok(mal.length === 0, 'sin construir o reconstruidos: ' + JSON.stringify(mal));
  } },
  ...(await import('./ik2.mjs')).default({ esperar, buscar, ev, clicShadow, sinDoc }),
];

// ---------- ejecución ----------
async function main() {
  if (!fs.existsSync(SRC)) { console.error('No existe ' + SRC); process.exit(2); }
  const browser = await chromium.launch();
  let fallas = 0, total = 0;
  const lista = PRUEBAS.filter(p => !FILTRO || p.id.includes(FILTRO));
  // Abre una página de prueba. controles: JS de InputKey (por omisión el de --src; la prueba de identidad usa la base).
  const abrir = async (ctx, p, controles, consola, dialogos) => {
    const page = await ctx.newPage();
    // Abre los shadow (solo pruebas) para poder leer el interior del componente.
    await page.addInitScript(() => { const o = Element.prototype.attachShadow; Element.prototype.attachShadow = function (i) { return o.call(this, Object.assign({}, i, { mode: 'open' })); }; });
    page.on('pageerror', e => consola.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') consola.push('console: ' + m.text()); });
    page.on('dialog', async d => { dialogos.push(d.message()); try { await d.accept(); } catch { } });
    await page.route('http://ik.test/**', (route) => {
      const u = new URL(route.request().url());
      if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html(p.attrs, p.pagina ?? {}) });
      if (u.pathname === '/editable.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(EDITABLE) });
      if (u.pathname === '/controls.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: controles ?? fs.readFileSync(SRC) });
      return route.fulfill({ status: 404, body: '' });
    });
    await page.route(/^(?!http:\/\/ik\.test\/).*/, r => r.abort());
    await page.goto('http://ik.test/');
    await page.waitForFunction(() => !!document.getElementById('ik').shadowRoot);
    return page;
  };
  for (const p of lista) {
    const ctx = await browser.newContext();
    const consola = [], dialogos = [];
    let page = null;
    const fallos = [];
    const ok = (cond, msg) => { if (!cond) fallos.push(msg); else if (VERBOSE) console.log('      ok ' + msg); };
    total++;
    try {
      page = await abrir(ctx, p, null, consola, dialogos);
      await p.fn(page, ok, dialogos, { base: async () => { if (!BASE_JS) throw new Error('sin la copia base (git show ' + BASE_REF + ')'); return abrir(ctx, p, BASE_JS, consola, dialogos); } });
    } catch (e) { fallos.push('excepción: ' + e.message.split('\n')[0]); }
    if (consola.length) fallos.push('errores de consola: ' + JSON.stringify(consola));
    if (fallos.length) { fallas++; console.log('FALLA  ' + p.id + ' · ' + p.titulo); fallos.forEach(f => console.log('       - ' + f)); }
    else console.log('pasa   ' + p.id);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${total} pruebas · pasan ${total - fallas} · fallan ${fallas} · src ${path.relative(process.cwd(), SRC) || SRC}`);
  process.exit(fallas ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
