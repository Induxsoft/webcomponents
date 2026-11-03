#!/usr/bin/env node
// Pruebas de induxsoft.dialogs.js: API (alert, confirm, prompt, open, toast), foco, Esc, apilado, ARIA, tema y la
// compatibilidad con el marcado y la API de Bootstrap 5 SIN cargar bootstrap.bundle.js (Modal, Tab, Dropdown,
// Collapse, Alert y el puente de jQuery .modal()). Cada prueba afirma lo que espera. Sin red.
//
// El CSS de Bootstrap no se incluye en el repo: por omisión se usa un CSS mínimo con las mismas reglas de visibilidad
// y transiciones de Bootstrap 5.0.1 (.modal, .fade, .show, .tab-pane, .collapse, .dropdown-menu). Con
// --bootstrap-css ruta se usa el real (p. ej. el de la plantilla de V12). jQuery: un sustituto mínimo, o el real con
// --jquery ruta.
//
//   node tests/dialogs/run.mjs [--filtro texto] [--verbose] [--bootstrap-css ruta] [--jquery ruta] [--bootstrap-js ruta]
//
// Comparación con el Bootstrap 5.0.1 real (--bootstrap-js con el bundle de la plantilla de V12, 2026-11-02): c-02,
// c-04, c-07, c-09, c-10 (con jQuery real) pasan igual, y c-12 da los mismos eventos. Diferencias esperadas, porque la compatibilidad es un
// superconjunto: getOrCreateInstance y getInstance('#selector') (5.0.2+), new Modal(el) devuelve la instancia que ya
// existe, Tab con Mayús/Tab da la vuelta dentro del modal (5.1+), y collapse sin animación de altura.
//
// Código de salida: 0 si todo pasa, 1 si alguna prueba falla, 2 si el arnés falla.
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
const SRC = path.resolve(opt('--src', path.join(REPO, 'src/js/induxsoft.dialogs.js')));
const THEME = path.join(REPO, 'src/js/induxsoft.theme.js');
const FILTRO = opt('--filtro', null);
const VERBOSE = argv.includes('--verbose');
const BS_CSS = opt('--bootstrap-css', null);
const JQ = opt('--jquery', null);
// --bootstrap-js ruta: carga el bootstrap.bundle real (la compat no se activa). Sirve para comprobar que las pruebas
// c-* describen lo que hace Bootstrap 5.0.1; c-01 y c-11 no aplican y se saltan.
const BS_JS = opt('--bootstrap-js', null);

// Reglas de Bootstrap 5.0.1 que importan para mostrar y ocultar (mismos selectores, duraciones y z-index).
const CSS_MIN = `
.fade{transition:opacity .15s linear}.fade:not(.show){opacity:0}
.modal{position:fixed;top:0;left:0;z-index:1055;display:none;width:100%;height:100%;overflow-x:hidden;overflow-y:auto;outline:0}
.modal-dialog{position:relative;width:auto;margin:1.75rem auto;max-width:500px;pointer-events:none}
.modal.fade .modal-dialog{transition:transform .3s ease-out;transform:translate(0,-50px)}.modal.show .modal-dialog{transform:none}
.modal-content{position:relative;display:flex;flex-direction:column;pointer-events:auto;background:#fff;border:1px solid rgba(0,0,0,.2)}
.modal-backdrop{position:fixed;top:0;left:0;z-index:1050;width:100vw;height:100vh;background-color:#000}.modal-backdrop.fade{opacity:0}.modal-backdrop.show{opacity:.5}
.modal-open{overflow:hidden}
.tab-content>.tab-pane{display:none}.tab-content>.active{display:block}
.collapse:not(.show){display:none}
.dropdown{position:relative}.dropdown-menu{position:absolute;z-index:1000;display:none}.dropdown-menu.show{display:block}.dropdown-menu[data-bs-popper]{top:100%;left:0}
.alert{position:relative}
`;
// Sustituto mínimo de jQuery: $(selector|elemento), .each, .fn, .on (con addEventListener, como jQuery).
const JQ_MIN = `(function(){function J(s){this.length=0;var l=typeof s==='string'?document.querySelectorAll(s):(s&&s.nodeType?[s]:[]);for(var i=0;i<l.length;i++)this[this.length++]=l[i];}
J.prototype.each=function(f){for(var i=0;i<this.length;i++)f.call(this[i],i,this[i]);return this;};
J.prototype.on=function(n,f){return this.each(function(){this.addEventListener(n,function(e){f.call(this,e);});});};
J.prototype.jquery='min';window.jQuery=window.$=function(s){return new J(s);};window.jQuery.fn=J.prototype;})();`;

// Marcado típico de V12 (tomado del censo de v12_qa: dbext, efectivo, mxcfdi, catbas, cmpreq, compras).
const MODALES = `
<button id="abrir" type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#mdl" data-whatever="x1">Abrir</button>
<a id="abrirA" href="#mdl" data-bs-toggle="modal">Abrir (a)</a>
<input id="fuera" placeholder="fuera">
<div class="modal fade" id="mdl" tabindex="-1" aria-labelledby="mdlLabel" aria-hidden="true">
  <div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title" id="mdlLabel">Título</h5><button type="button" id="x" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
    <div class="modal-body"><input id="m1" name="m1"><input id="m2" name="m2"></div>
    <div class="modal-footer"><button type="button" id="cerrar" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button><button type="button" id="guardar" class="btn btn-primary">Guardar</button></div>
  </div></div>
</div>
<div class="modal fade" id="mdl_static" data-bs-keyboard="false" data-bs-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog"><div class="modal-content"><div class="modal-body"><input id="s1"></div>
  <div class="modal-footer"><button type="button" id="cerrarS" data-bs-dismiss="modal">Cerrar</button></div></div></div>
</div>
<div class="modal fade" id="mdl_nobd" tabindex="-1" aria-hidden="true" data-bs-backdrop="false">
  <div class="modal-dialog"><div class="modal-content"><div class="modal-body"><input id="n1"></div></div></div>
</div>
<div class="modal" id="mdl_sinfade" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog"><div class="modal-content"><div class="modal-body"><button id="sf1" type="button">a</button></div></div></div>
</div>`;
const TABS = `
<nav><div class="nav nav-tabs" id="nav-tab" role="tablist">
  <button class="nav-link py-1 active" type="button" role="tab" id="nav-general-tab" data-bs-toggle="tab" data-bs-target="#nav-general" aria-controls="nav-general" aria-selected="true">General</button>
  <button class="nav-link py-1" type="button" role="tab" id="nav-pref-tab" data-bs-toggle="tab" data-bs-target="#nav-pref" aria-controls="nav-pref" aria-selected="false">Preferencias</button>
</div></nav>
<div class="tab-content" id="nav-tabContent">
  <div class="tab-pane fade show active" id="nav-general" role="tabpanel" aria-labelledby="nav-general-tab">G</div>
  <div class="tab-pane fade" id="nav-pref" role="tabpanel" aria-labelledby="nav-pref-tab">P</div>
</div>
<ul class="nav nav-tabs" id="ul-tabs">
  <li class="nav-item"><a class="nav-link active" href="#general2" data-bs-toggle='tab'>General</a></li>
  <li class="nav-item"><a class="nav-link" href="#admin2" data-bs-toggle='tab'>Administración</a></li>
</ul>
<div class="tab-content">
  <div class="tab-pane active" id="general2">G2</div>
  <div class="tab-pane" id="admin2">A2</div>
</div>
<ul class="nav nav-pills" id="pills">
  <li class="nav-item"><button class="nav-link active" id="p1" data-bs-toggle="pill" data-bs-target="#pp1" type="button">1</button></li>
  <li class="nav-item"><button class="nav-link" id="p2" data-bs-toggle="pill" data-bs-target="#pp2" type="button">2</button></li>
</ul>
<div class="tab-content"><div class="tab-pane active" id="pp1">1</div><div class="tab-pane" id="pp2">2</div></div>`;
const OTROS = `
<div class="dropdown" id="dd"><button class="btn dropdown-toggle" type="button" id="dmb" data-bs-toggle="dropdown" aria-expanded="false">Enlaces</button>
  <ul class="dropdown-menu" aria-labelledby="dmb"><li><a class="dropdown-item" id="dd1" href="#">Uno</a></li></ul></div>
<input class="form-check-input" type="checkbox" id="chk" data-bs-toggle="collapse" data-bs-target="#col1" aria-expanded="false" aria-controls="col1">
<div class="collapse" id="col1">contenido</div>
<div class="accordion" id="opciones">
  <h2><button class="accordion-button" id="acc1" type="button" data-bs-toggle="collapse" data-bs-target="#c1" aria-expanded="true">Uno</button></h2>
  <div id="c1" class="accordion-collapse collapse show" data-bs-parent="#opciones">1</div>
  <h2><button class="accordion-button collapsed" id="acc2" type="button" data-bs-toggle="collapse" data-bs-target="#c2" aria-expanded="false">Dos</button></h2>
  <div id="c2" class="accordion-collapse collapse" data-bs-parent="#opciones">2</div>
</div>
<div class="alert alert-warning alert-dismissible fade show" id="al" role="alert">Aviso<button type="button" class="btn-close" id="alx" data-bs-dismiss="alert" aria-label="Close"></button></div>`;

function html(o = {}) {
  return `<!DOCTYPE html><html lang="es"${o.htmlAttrs ?? ''}><head><meta charset="utf-8"><title>dialogs</title>
<style>${o.bsCss ?? ''}</style>
<script>window.__ev=[];window.__esc=[];document.addEventListener('keydown',function(e){if(e.key==='Escape')window.__esc.push('doc');});</script>
${o.antes ?? ''}
${o.tema ? '<script src="/theme.js"></script>' : ''}
${o.jquery ? '<script src="/jquery.js"></script>' : ''}
${BS_JS && o.compat !== false ? '<script src="/bootstrap.js"></script><script>/* 5.0.1 no trae getOrCreateInstance (llegó en 5.0.2): solo para comparar */["Modal","Tab","Collapse","Dropdown","Alert"].forEach(function(n){var C=bootstrap[n];if(C&&!C.getOrCreateInstance)C.getOrCreateInstance=function(e,c){return C.getInstance(e)||new C(e,c);};});</script>' : ''}
<script src="/dialogs.js"></script>
${o.compat === false ? '' : '<script>window.__compat = Induxsoft.dialog.bootstrapCompat();</script>'}
</head><body>
<button id="op" type="button">opener</button>
${o.body ?? ''}
</body></html>`;
}
// Con el Bootstrap real las transiciones van una tras otra (fondo y luego modal; collapse anima): se espera más.
const esperar = (page, ms) => page.waitForTimeout(BS_JS ? ms * 2.2 : ms);
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const registrar = (page, sel, nombres) => ev(page, ({ sel, nombres }) => {
  const el = document.querySelector(sel);
  nombres.forEach(n => el.addEventListener(n, (e) => window.__ev.push(n + (e.relatedTarget !== undefined ? ':' + (e.relatedTarget?.id ?? 'null') : ''))));
}, { sel, nombres });
const activo = (page) => ev(page, () => document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName);
const visibleModal = (page, id) => ev(page, (id) => { const m = document.getElementById(id); return getComputedStyle(m).display !== 'none' && m.classList.contains('show'); }, id);

const PRUEBAS = [
  // ---------------------------------------------------------------- API propia
  {
    id: 'd-01', titulo: 'alert, confirm y prompt devuelven lo esperado',
    pagina: { compat: false },
    fn: async (page, ok) => {
      await ev(page, () => { window.__r = []; Induxsoft.dialog.alert('Hola').then(v => window.__r.push(['alert', v])); });
      await page.click('dialog.idlg .idlg-btn-primary');
      await ev(page, () => { Induxsoft.dialog.confirm('¿Seguro?').then(v => window.__r.push(['c1', v])); });
      await page.click('dialog.idlg .idlg-btn-primary');
      await ev(page, () => { Induxsoft.dialog.confirm('¿Seguro?').then(v => window.__r.push(['c2', v])); });
      await page.click('dialog.idlg [data-idlg-btn="0"]');
      await ev(page, () => { Induxsoft.dialog.prompt('Nombre', { value: 'Ana' }).then(v => window.__r.push(['p1', v])); });
      await page.keyboard.type('Luis');
      await page.keyboard.press('Enter');
      await ev(page, () => { Induxsoft.dialog.prompt('Nombre').then(v => window.__r.push(['p2', v])); });
      await page.click('dialog.idlg [data-idlg-btn="0"]');
      await ev(page, () => { Induxsoft.dialog.prompt('Clave', { validate: v => v.length >= 3 || 'Mínimo 3' }).then(v => window.__r.push(['p3', v])); });
      await page.keyboard.type('ab'); await page.keyboard.press('Enter');
      const err = await ev(page, () => { const e = document.querySelector('dialog.idlg .idlg-err'); return [!!document.querySelector('dialog.idlg[open]'), e && !e.hidden && e.textContent]; });
      await page.keyboard.type('c'); await page.keyboard.press('Enter');
      await esperar(page, 30);
      const r = await ev(page, () => ({ r: window.__r, quedan: document.querySelectorAll('dialog').length }));
      ok(JSON.stringify(r.r) === JSON.stringify([['alert', null], ['c1', true], ['c2', false], ['p1', 'Luis'], ['p2', null], ['p3', 'abc']]), 'resultados: ' + JSON.stringify(r.r));
      ok(err[0] && err[1] === 'Mínimo 3', 'validate deja abierto y muestra el error: ' + JSON.stringify(err));
      ok(r.quedan === 0, 'no quedan <dialog> en el DOM');
    }
  },
  {
    id: 'd-02', titulo: 'foco: inicial, atrapado con Tab y Mayús+Tab, y de regreso al que abrió',
    pagina: { compat: false },
    fn: async (page, ok) => {
      await page.focus('#op');
      await ev(page, () => { window.__p = Induxsoft.dialog.confirm('¿Seguro?', { title: 'T' }); });
      ok(await activo(page) === 'idlg-btn idlg-btn-primary', 'confirm: foco en Aceptar');
      const orden = [];
      for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); orden.push(await ev(page, () => document.activeElement.textContent || document.activeElement.getAttribute('aria-label'))); }
      ok(JSON.stringify(orden) === JSON.stringify(['×', 'Cancelar', 'Aceptar', '×']), 'Tab da la vuelta dentro del diálogo: ' + orden);
      await page.focus('dialog.idlg .idlg-x');
      await page.keyboard.press('Shift+Tab');
      ok(await ev(page, () => document.activeElement.textContent) === 'Aceptar', 'Mayús+Tab desde el primero va al último');
      await page.keyboard.press('Escape');
      await esperar(page, 20);
      ok(await activo(page) === 'op', 'al cerrar, el foco vuelve al que abrió');
      await ev(page, () => { Induxsoft.dialog.prompt('x', { value: 'abc' }); });
      const sel = await ev(page, () => { const a = document.activeElement; return [a.className, a.selectionStart, a.selectionEnd]; });
      ok(sel[0] === 'idlg-input' && sel[1] === 0 && sel[2] === 3, 'prompt: foco en la caja con el texto seleccionado ' + sel);
    }
  },
  {
    id: 'd-03', titulo: 'Esc cierra si closable (y no llega a la página); con closable:false no cierra',
    pagina: { compat: false },
    fn: async (page, ok) => {
      await ev(page, () => { window.__r = []; Induxsoft.dialog.confirm('¿?').then(v => window.__r.push(v)); });
      await page.keyboard.press('Escape');
      await esperar(page, 20);
      let r = await ev(page, () => ({ r: window.__r, open: !!document.querySelector('dialog[open]'), esc: window.__esc.length }));
      ok(r.r[0] === false && !r.open, 'Esc: confirm da false');
      ok(r.esc === 0, 'el keydown de Esc no llega al documento');
      await ev(page, () => { window.__h = Induxsoft.dialog.open({ title: 'Fijo', text: 'x', closable: false, buttons: [{ text: 'Listo', value: 1 }] }); });
      await page.keyboard.press('Escape'); await esperar(page, 30);
      await page.keyboard.press('Escape'); await esperar(page, 30);
      r = await ev(page, () => ({ open: !!document.querySelector('dialog[open]'), x: !!document.querySelector('dialog .idlg-x') }));
      ok(r.open, 'closable:false sigue abierto tras dos Esc');
      ok(!r.x, 'closable:false sin X');
      await page.click('dialog .idlg-btn');
      ok(await ev(page, () => window.__h.result) === 1, 'el botón lo cierra con su valor');
    }
  },
  {
    id: 'd-04', titulo: 'apilados: Esc cierra solo el de arriba y el foco vuelve al de abajo',
    pagina: { compat: false },
    fn: async (page, ok) => {
      await ev(page, () => { window.__a = Induxsoft.dialog.open({ title: 'A', content: '<input id="ina">', buttons: [{ text: 'OK' }] }); });
      ok(await activo(page) === 'ina', 'foco en el primer enfocable del cuerpo');
      await ev(page, () => { window.__b = Induxsoft.dialog.confirm('B encima'); });
      const pila = await ev(page, () => [Induxsoft.dialog.stack.length, document.querySelectorAll('dialog[open]').length]);
      ok(pila[0] === 2 && pila[1] === 2, 'dos abiertos: ' + pila);
      // El de arriba recibe los clics (top layer).
      const arriba = await ev(page, () => { const b = window.__b; const r = document.querySelectorAll('dialog[open]')[1].querySelector('.idlg-btn-primary').getBoundingClientRect(); return document.elementFromPoint(r.x + 5, r.y + 5).closest('dialog') === document.querySelectorAll('dialog[open]')[1]; });
      ok(arriba, 'el último queda arriba');
      await page.keyboard.press('Escape'); await esperar(page, 20);
      const r = await ev(page, () => [Induxsoft.dialog.stack.length, window.__a.open, document.activeElement.id]);
      ok(r[0] === 1 && r[1] === true, 'queda A abierto');
      ok(r[2] === 'ina', 'foco de regreso en A: ' + r[2]);
      await page.keyboard.press('Escape'); await esperar(page, 20);
      ok(await ev(page, () => Induxsoft.dialog.stack.length) === 0, 'segundo Esc cierra A');
    }
  },
  {
    id: 'd-05', titulo: 'ARIA: role, aria-modal, aria-labelledby y aria-describedby; el texto no se interpreta como HTML',
    pagina: { compat: false },
    fn: async (page, ok) => {
      await ev(page, () => { Induxsoft.dialog.alert('<b>negrita</b>\nlínea 2', { title: 'Atención' }); });
      const r = await ev(page, () => {
        const d = document.querySelector('dialog[open]');
        return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), lab: document.getElementById(d.getAttribute('aria-labelledby'))?.textContent, desc: document.getElementById(d.getAttribute('aria-describedby'))?.textContent, b: !!d.querySelector('b') };
      });
      ok(r.role === 'alertdialog' && r.modal === 'true', 'alertdialog modal');
      ok(r.lab === 'Atención', 'aria-labelledby -> título');
      ok(r.desc === '<b>negrita</b>\nlínea 2' && !r.b, 'mensaje como texto: ' + JSON.stringify(r.desc));
      await page.keyboard.press('Escape');
      await ev(page, () => { Induxsoft.dialog.alert('sin título'); });
      ok(await ev(page, () => document.querySelector('dialog[open]').getAttribute('aria-label')) === 'Aviso', 'sin título: aria-label');
    }
  },
  {
    id: 'd-06', titulo: 'open(): element se mueve y vuelve, onClick false no cierra, hide cancelable, orden de eventos',
    pagina: { compat: false, body: '<div id="caja"><form id="frm" hidden><input id="campo" value="v"></form></div>' },
    fn: async (page, ok) => {
      await ev(page, () => {
        window.__n = [];
        const h = Induxsoft.dialog.open({ title: 'F', element: document.getElementById('frm'), size: 'lg', buttons: [{ text: 'No', value: 'no', onClick: () => false }, { text: 'Sí', value: 'si', variant: 'primary' }] });
        ['show', 'shown', 'hide', 'hidden'].forEach(n => h.on(n, () => window.__n.push(n)));
        let bloquear = true;
        h.on('hide', (e) => { if (bloquear) { bloquear = false; e.preventDefault(); } });
        window.__h = h;
      });
      await esperar(page, 20);
      const dentro = await ev(page, () => [document.getElementById('frm').closest('dialog') !== null, !document.getElementById('frm').hidden, document.querySelector('dialog').classList.contains('idlg-lg')]);
      ok(dentro.every(Boolean), 'el formulario está en el diálogo y visible, tamaño lg');
      await page.click('dialog [data-idlg-btn="0"]');
      ok(await ev(page, () => window.__h.open), 'onClick false: sigue abierto');
      await page.click('dialog [data-idlg-btn="1"]');
      ok(await ev(page, () => window.__h.open), 'hide cancelado: sigue abierto');
      await page.click('dialog [data-idlg-btn="1"]');
      const r = await ev(page, async () => ({ v: await window.__h.result, n: window.__n, lugar: document.getElementById('frm').parentNode.id, hidden: document.getElementById('frm').hidden }));
      ok(r.v === 'si', 'valor del botón');
      ok(r.lugar === 'caja' && r.hidden, 'el formulario vuelve a su lugar, oculto como estaba');
      ok(JSON.stringify(r.n) === '["shown","hide","hide","hidden"]', 'eventos: ' + r.n);
    }
  },
  {
    id: 'd-07', titulo: 'tema heredado: data-et-theme, applyColors y «ninguno»; cambio en caliente',
    pagina: { compat: false, tema: true, htmlAttrs: ' data-et-theme="oscuro"', body: '<div id="sin" data-et-theme="ninguno"><button id="opSin" type="button">x</button></div>' },
    fn: async (page, ok) => {
      const colores = () => ev(page, () => { const d = document.querySelector('dialog[open]'); const b = d.querySelector('.idlg-btn-primary'); const cs = getComputedStyle(d); return { bg: cs.backgroundColor, fg: cs.color, btn: getComputedStyle(b).backgroundColor, scheme: cs.colorScheme }; });
      await ev(page, () => { window.__h = Induxsoft.dialog.alert('x'); });
      let c = await colores();
      ok(c.bg === 'rgb(21, 24, 28)' && c.scheme === 'dark', 'oscuro: ' + JSON.stringify(c));
      await ev(page, () => InduxsoftTheme.applyColors(document.documentElement, { bar: '#BA0135', barText: '#FFFFFF' }));
      await esperar(page, 50);
      c = await colores();
      ok(c.btn === 'rgb(186, 1, 53)', 'en caliente, el botón principal con la barra: ' + c.btn);
      await page.keyboard.press('Escape');
      await page.focus('#opSin');
      await ev(page, () => { Induxsoft.dialog.alert('y'); });
      c = await colores();
      ok(c.bg === 'rgb(255, 255, 255)' && c.btn === 'rgb(13, 110, 253)', 'abierto desde «ninguno»: apariencia neutra ' + JSON.stringify(c));
      ok(await ev(page, () => !document.querySelector('dialog[open]').hasAttribute('data-idlg-theme')), 'sin variables de tema');
    }
  },
  {
    id: 'd-08', titulo: 'toast: tipo, ARIA, se cierra solo, queda encima de un diálogo y se puede cerrar',
    pagina: { compat: false },
    fn: async (page, ok) => {
      await ev(page, () => { window.__t1 = Induxsoft.dialog.toast('Guardado', { type: 'success', timeout: 150 }); });
      let r = await ev(page, () => ({ n: document.querySelectorAll('.idlg-toast').length, role: window.__t1.element.getAttribute('role'), cls: window.__t1.element.className }));
      ok(r.n === 1 && r.role === 'status' && /success/.test(r.cls), 'aviso de éxito: ' + JSON.stringify(r));
      await esperar(page, 250);
      ok(await ev(page, () => document.querySelectorAll('.idlg-toast').length) === 0, 'se cierra solo');
      await ev(page, () => { Induxsoft.dialog.open({ title: 'Modal', text: 'x', size: 'full' }); window.__t2 = Induxsoft.dialog.toast('Error de prueba', { type: 'error', timeout: 0 }); });
      r = await ev(page, () => { const t = window.__t2.element, b = t.getBoundingClientRect(); const x = document.elementFromPoint(b.x + 10, b.y + b.height / 2); return { role: t.getAttribute('role'), arriba: t.contains(x) }; });
      ok(r.role === 'alert', 'error: role alert');
      ok(r.arriba, 'el aviso queda encima del diálogo modal');
      await page.click('.idlg-toast .idlg-x');
      ok(await ev(page, () => document.querySelectorAll('.idlg-toast').length) === 0, 'la X lo cierra con el modal abierto');
      // Al cerrar el diálogo, el contenedor de avisos no se va con él.
      await ev(page, () => { window.__t3 = Induxsoft.dialog.toast('Sigue', { timeout: 0 }); });
      await page.keyboard.press('Escape');
      r = await ev(page, () => ({ con: window.__t3.element.isConnected, padre: document.querySelector('.idlg-toasts').parentNode.tagName, dlg: document.querySelectorAll('dialog').length }));
      ok(r.con && r.padre === 'BODY' && r.dlg === 0, 'el aviso sigue al cerrar el diálogo: ' + JSON.stringify(r));
    }
  },

  // ---------------------------------------------------------------- compatibilidad con Bootstrap
  {
    id: 'c-01', titulo: 'bootstrapCompat solo se activa si window.bootstrap no existe',
    pagina: { antes: '<script>window.bootstrap = { real: true };</script>', body: MODALES },
    fn: async (page, ok) => {
      const r = await ev(page, () => ({ compat: window.__compat, real: window.bootstrap.real === true, modal: typeof window.bootstrap.Modal }));
      ok(r.compat === false && r.real && r.modal === 'undefined', 'con Bootstrap cargado no toca nada: ' + JSON.stringify(r));
      await page.click('#abrir'); await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl')), 'los data-bs-toggle quedan para Bootstrap');
    }
  },
  {
    id: 'c-02', titulo: 'modal con data-bs-toggle y data-bs-dismiss: clases, fondo, eventos, relatedTarget y foco',
    pagina: { body: MODALES },
    fn: async (page, ok) => {
      ok(await ev(page, (real) => (real || window.__compat === true) && !!window.bootstrap.Modal && !!window.bootstrap.Tab, !!BS_JS), 'compat instalada');
      await registrar(page, '#mdl', ['show.bs.modal', 'shown.bs.modal', 'hide.bs.modal', 'hidden.bs.modal']);
      await ev(page, () => document.getElementById('mdl').addEventListener('show.bs.modal', (e) => { window.__dato = e.relatedTarget && e.relatedTarget.getAttribute('data-whatever'); }));
      await page.click('#abrir');
      const durante = await ev(page, () => window.__ev.slice());
      await esperar(page, 400);
      let r = await ev(page, () => { const m = document.getElementById('mdl'); return { show: m.classList.contains('show'), disp: m.style.display, hidden: m.getAttribute('aria-hidden'), modal: m.getAttribute('aria-modal'), role: m.getAttribute('role'), bd: document.querySelectorAll('.modal-backdrop.show').length, open: document.body.classList.contains('modal-open'), ev: window.__ev.slice(), dato: window.__dato, foco: m.contains(document.activeElement) }; });
      ok(JSON.stringify(durante) === '["show.bs.modal:abrir"]', 'show antes de la transición, relatedTarget = botón: ' + durante);
      ok(r.show && r.disp === 'block' && r.hidden === null && r.modal === 'true' && r.role === 'dialog', 'modal visible con ARIA: ' + JSON.stringify(r));
      ok(r.bd === 1 && r.open, 'fondo y body.modal-open');
      ok(JSON.stringify(r.ev) === '["show.bs.modal:abrir","shown.bs.modal:abrir"]', 'eventos: ' + r.ev);
      ok(r.dato === 'x1', 'e.relatedTarget.getAttribute(data-whatever)');
      ok(r.foco, 'foco dentro del modal');
      await page.click('#cerrar');
      await esperar(page, 400);
      r = await ev(page, () => { const m = document.getElementById('mdl'); return { show: m.classList.contains('show'), disp: m.style.display, hidden: m.getAttribute('aria-hidden'), bd: document.querySelectorAll('.modal-backdrop').length, open: document.body.classList.contains('modal-open'), ev: window.__ev.slice(2), foco: document.activeElement.id }; });
      ok(!r.show && r.disp === 'none' && r.hidden === 'true', 'oculto');
      ok(r.bd === 0 && !r.open, 'sin fondo ni modal-open');
      ok(JSON.stringify(r.ev) === '["hide.bs.modal","hidden.bs.modal"]', 'eventos: ' + r.ev);
      ok(r.foco === 'abrir', 'foco de regreso al botón: ' + r.foco);
      // <a href="#mdl" data-bs-toggle="modal">: no navega.
      await page.click('#abrirA'); await esperar(page, 400);
      ok(await visibleModal(page, 'mdl') && await ev(page, () => location.hash === ''), 'con <a href>: abre sin cambiar el hash');
      await page.click('#x'); await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl')), 'la X (btn-close) lo cierra');
    }
  },
  {
    id: 'c-03', titulo: 'API: new bootstrap.Modal, getInstance, getOrCreateInstance, show/hide/toggle, show cancelable',
    pagina: { body: MODALES },
    fn: async (page, ok) => {
      // El patrón de dbext, efectivo, rhgf, mxcfdi y cmpreq.
      const r = await ev(page, () => {
        const modal = document.getElementById('mdl');
        let instance = bootstrap.Modal.getInstance(modal);
        const antes = instance;
        if (!instance) instance = new bootstrap.Modal(modal);
        return { antes, misma: bootstrap.Modal.getInstance(modal) === instance && bootstrap.Modal.getOrCreateInstance(modal) === instance && new bootstrap.Modal('#mdl') === instance };
      });
      ok(r.antes === null && r.misma, 'una instancia por elemento: ' + JSON.stringify(r));
      await ev(page, () => bootstrap.Modal.getInstance(document.getElementById('mdl')).show());
      await esperar(page, 400);
      ok(await visibleModal(page, 'mdl'), 'show()');
      await ev(page, () => bootstrap.Modal.getInstance('#mdl').hide());
      await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl')), 'hide()');
      await ev(page, () => bootstrap.Modal.getOrCreateInstance('#mdl_sinfade').toggle());
      ok(await visibleModal(page, 'mdl_sinfade'), 'sin .fade: visible al instante');
      await ev(page, () => bootstrap.Modal.getInstance('#mdl_sinfade').toggle());
      ok(!(await visibleModal(page, 'mdl_sinfade')), 'toggle() lo cierra');
      await ev(page, () => { const m = document.getElementById('mdl'); m.addEventListener('show.bs.modal', (e) => e.preventDefault(), { once: true }); bootstrap.Modal.getInstance(m).show(); });
      await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl')), 'show.bs.modal con preventDefault no abre');
      await ev(page, () => { const m = document.getElementById('mdl'); bootstrap.Modal.getInstance(m).show(); m.addEventListener('hide.bs.modal', (e) => e.preventDefault(), { once: true }); });
      await esperar(page, 400);
      await ev(page, () => bootstrap.Modal.getInstance('#mdl').hide());
      await esperar(page, 400);
      ok(await visibleModal(page, 'mdl'), 'hide.bs.modal con preventDefault no cierra');
    }
  },
  {
    id: 'c-04', titulo: 'fondo y teclado: clic fuera y Esc según data-bs-backdrop y data-bs-keyboard',
    pagina: { body: MODALES },
    fn: async (page, ok) => {
      const afuera = () => page.mouse.click(5, 5);
      await page.click('#abrir'); await esperar(page, 400);
      await afuera(); await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl')), 'por omisión: clic fuera cierra');
      await page.click('#abrir'); await esperar(page, 400);
      await page.keyboard.press('Escape'); await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl')), 'por omisión: Esc cierra');
      await ev(page, () => bootstrap.Modal.getOrCreateInstance('#mdl_static').show()); await esperar(page, 400);
      await afuera(); await esperar(page, 100);
      await page.keyboard.press('Escape'); await esperar(page, 400);
      ok(await visibleModal(page, 'mdl_static'), 'static + keyboard=false: ni clic fuera ni Esc');
      await page.click('#cerrarS'); await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl_static')), 'su botón data-bs-dismiss sí');
      await ev(page, () => bootstrap.Modal.getOrCreateInstance('#mdl_nobd').show()); await esperar(page, 400);
      const bd = await ev(page, () => document.querySelectorAll('.modal-backdrop').length);
      await afuera(); await esperar(page, 400);
      ok(bd === 0 && await visibleModal(page, 'mdl_nobd'), 'backdrop=false: sin fondo y el clic fuera no cierra (como 5.0.1)');
      await page.keyboard.press('Escape'); await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl_nobd')), 'backdrop=false: Esc cierra');
    }
  },
  {
    id: 'c-05', titulo: 'foco atrapado en el modal; un diálogo propio encima no pierde el foco',
    pagina: { body: MODALES },
    fn: async (page, ok) => {
      await page.click('#abrir'); await esperar(page, 400);
      await page.focus('#guardar');
      await page.keyboard.press('Tab');
      ok(await activo(page) === 'x', 'Tab desde el último va al primero: ' + await activo(page));
      await page.keyboard.press('Shift+Tab');
      ok(await activo(page) === 'guardar', 'Mayús+Tab desde el primero va al último');
      await ev(page, () => document.getElementById('fuera').focus());
      ok(await ev(page, () => document.getElementById('mdl').contains(document.activeElement)), 'el foco no sale a la página');
      await page.focus('#m2');
      await ev(page, () => { window.__c = Induxsoft.dialog.confirm('¿Encima del modal de Bootstrap?'); });
      await esperar(page, 30);
      ok(await ev(page, () => document.activeElement.closest('dialog') !== null), 'el confirm conserva el foco');
      await page.keyboard.press('Escape'); await esperar(page, 30);
      const r = await ev(page, () => [document.activeElement.id, document.getElementById('mdl').classList.contains('show')]);
      ok(r[0] === 'm2' && r[1], 'Esc cierra solo el confirm y el foco vuelve al modal: ' + r);
    }
  },
  {
    id: 'c-06', titulo: 'pestañas de V12 (button con data-bs-target, a con href, pill): clases, ARIA, eventos con relatedTarget',
    pagina: { body: TABS },
    fn: async (page, ok) => {
      await registrar(page, '#nav-general-tab', ['hide.bs.tab', 'hidden.bs.tab']);
      await registrar(page, '#nav-pref-tab', ['show.bs.tab', 'shown.bs.tab']);
      await page.click('#nav-pref-tab');
      await esperar(page, 250);
      let r = await ev(page, () => {
        const q = (s) => document.querySelector(s);
        return { ev: window.__ev.slice(), a: q('#nav-pref-tab').classList.contains('active'), b: q('#nav-general-tab').classList.contains('active'), sa: q('#nav-pref-tab').getAttribute('aria-selected'), sb: q('#nav-general-tab').getAttribute('aria-selected'),
          pa: q('#nav-pref').className, pb: q('#nav-general').className, vis: getComputedStyle(q('#nav-pref')).display, vis2: getComputedStyle(q('#nav-general')).display };
      });
      ok(JSON.stringify(r.ev) === '["hide.bs.tab:nav-pref-tab","show.bs.tab:nav-general-tab","hidden.bs.tab:nav-pref-tab","shown.bs.tab:nav-general-tab"]', 'eventos y relatedTarget: ' + r.ev);
      ok(r.a && !r.b && r.sa === 'true' && r.sb === 'false', '.nav-link.active y aria-selected');
      ok(/\bactive\b/.test(r.pa) && /\bshow\b/.test(r.pa) && !/\bactive\b/.test(r.pb) && !/\bshow\b/.test(r.pb), 'tab-pane fade show active: ' + r.pa + ' / ' + r.pb);
      ok(r.vis === 'block' && r.vis2 === 'none', 'panel visible y el otro oculto');
      // <a href="#..." data-bs-toggle='tab'> en <ul><li>
      await page.click('#ul-tabs li:nth-child(2) a');
      r = await ev(page, () => ({ hash: location.hash, a: document.querySelector('#ul-tabs li:nth-child(2) a').classList.contains('active'), b: document.querySelector('#ul-tabs li:nth-child(1) a').classList.contains('active'), p: document.getElementById('admin2').classList.contains('active'), q: document.getElementById('general2').classList.contains('active') }));
      ok(r.hash === '' && r.a && !r.b && r.p && !r.q, 'con href: cambia de pestaña sin navegar ' + JSON.stringify(r));
      // API: bootstrap.Tab(el).show(), getInstance, getOrCreateInstance; pill.
      r = await ev(page, () => {
        const el = document.getElementById('nav-general-tab');
        const t = new bootstrap.Tab(el); t.show();
        const t2 = bootstrap.Tab.getOrCreateInstance(document.getElementById('p2')); t2.show();
        return { g: el.classList.contains('active'), ins: bootstrap.Tab.getInstance(el) === t && bootstrap.Tab.getInstance('#p2') === t2, pill: document.getElementById('pp2').classList.contains('active') && !document.getElementById('pp1').classList.contains('active') };
      });
      ok(r.g && r.ins && r.pill, 'API de Tab y pill: ' + JSON.stringify(r));
      // show.bs.tab cancelado
      r = await ev(page, () => { const el = document.getElementById('nav-pref-tab'); el.addEventListener('show.bs.tab', e => e.preventDefault(), { once: true }); el.click(); return el.classList.contains('active'); });
      ok(!r, 'show.bs.tab con preventDefault no cambia');
      // Clic en una pestaña ya activa: sin eventos.
      const n = await ev(page, () => { window.__ev = []; document.getElementById('nav-general-tab').click(); return window.__ev.length; });
      ok(n === 0, 'pestaña activa: sin eventos');
    }
  },
  {
    id: 'c-07', titulo: 'dropdown: abre, cierra con clic fuera, Esc y al elegir; eventos',
    pagina: { body: OTROS },
    fn: async (page, ok) => {
      await registrar(page, '#dmb', ['show.bs.dropdown', 'shown.bs.dropdown', 'hide.bs.dropdown', 'hidden.bs.dropdown']);
      const abierto = () => ev(page, () => document.querySelector('#dd .dropdown-menu').classList.contains('show') && document.getElementById('dmb').getAttribute('aria-expanded') === 'true');
      await page.click('#dmb');
      ok(await abierto(), 'abre');
      ok(await ev(page, () => getComputedStyle(document.querySelector('#dd .dropdown-menu')).display) === 'block', 'menú visible');
      await page.mouse.click(600, 500);
      ok(!(await abierto()), 'clic fuera cierra');
      await page.click('#dmb'); await page.keyboard.press('Escape');
      ok(!(await abierto()), 'Esc cierra');
      await page.click('#dmb'); await page.click('#dd1');
      ok(!(await abierto()), 'elegir un elemento cierra');
      await page.click('#dmb'); await page.click('#dmb');
      ok(!(await abierto()), 'segundo clic en el botón cierra');
      ok(await ev(page, () => window.__ev.filter(x => x.startsWith('shown')).length === 4 && window.__ev.filter(x => x.startsWith('hidden')).length === 4), 'eventos: ' + await ev(page, () => window.__ev.join(',')));
    }
  },
  {
    id: 'c-08', titulo: 'collapse: botón, casilla y acordeón con data-bs-parent',
    pagina: { body: OTROS },
    fn: async (page, ok) => {
      await page.click('#chk'); await esperar(page, 200);
      let r = await ev(page, () => [document.getElementById('col1').classList.contains('show'), document.getElementById('chk').checked, document.getElementById('chk').getAttribute('aria-expanded')]);
      ok(r[0] && r[1] && r[2] === 'true', 'la casilla abre y queda marcada: ' + r);
      await page.click('#chk'); await esperar(page, 200);
      ok(!(await ev(page, () => document.getElementById('col1').classList.contains('show'))), 'la casilla cierra');
      await page.click('#acc2'); await esperar(page, 200);
      r = await ev(page, () => ({ c1: document.getElementById('c1').classList.contains('show'), c2: document.getElementById('c2').classList.contains('show'), a1: document.getElementById('acc1').className, a2: document.getElementById('acc2').className, e2: document.getElementById('acc2').getAttribute('aria-expanded') }));
      ok(!r.c1 && r.c2, 'acordeón: abre el 2 y cierra el 1');
      ok(/collapsed/.test(r.a1) && !/collapsed/.test(r.a2) && r.e2 === 'true', 'clase collapsed y aria-expanded: ' + JSON.stringify(r));
      await ev(page, () => { const c = new bootstrap.Collapse(document.getElementById('c1'), { toggle: false }); c.show(); });
      await esperar(page, 200);
      r = await ev(page, () => [document.getElementById('c1').classList.contains('show'), document.getElementById('c2').classList.contains('show')]);
      ok(r[0] && !r[1], 'API Collapse.show respeta el padre');
    }
  },
  {
    id: 'c-09', titulo: 'alerta con data-bs-dismiss="alert" y clases no cubiertas (Popover) sin errores',
    pagina: { body: OTROS + '<button id="pop" data-bs-toggle="popover" data-bs-content="x">p</button>' },
    fn: async (page, ok) => {
      await page.click('#alx'); await esperar(page, 250);
      ok(await ev(page, () => !document.getElementById('al')), 'la alerta se quita');
      const r = await ev(page, () => { try { const p = new bootstrap.Popover(document.getElementById('pop'), {}); p.show(); p.hide(); return 'ok'; } catch (e) { return e.message; } });
      ok(r === 'ok', 'new bootstrap.Popover no truena: ' + r);
    }
  },
  {
    id: 'c-12', titulo: 'alertas: data-bs-dismiss="alert" con fade, close.bs.alert y closed.bs.alert; bootstrap.Alert(el).close()',
    pagina: { body: OTROS + '<div class="alert alert-info" id="al2" role="alert">Sin fade <span id="dentro">x</span></div><div class="alert fade show" id="al3">Cancelable<button type="button" id="al3x" data-bs-dismiss="alert">x</button></div>' },
    fn: async (page, ok) => {
      await ev(page, () => {
        window.__al = [];
        document.addEventListener('close.bs.alert', (e) => window.__al.push('close:' + e.target.id + ':' + e.target.isConnected));
        // closed.bs.alert sale del elemento ya quitado del DOM (no llega a document, igual que en Bootstrap).
        ['al', 'al2', 'al3'].forEach(id => document.getElementById(id).addEventListener('closed.bs.alert', (e) => window.__al.push('closed:' + e.target.id + ':' + e.target.isConnected)));
      });
      // El botón está dentro del .alert más cercano, con fade y show.
      await page.click('#alx');
      const durante = await ev(page, () => { const a = document.getElementById('al'); return a ? [a.isConnected, a.classList.contains('show'), getComputedStyle(a).opacity !== '1' || a.classList.contains('fade')] : null; });
      ok(durante && durante[0] && !durante[1], 'durante la transición: sigue en el DOM sin .show: ' + durante);
      await esperar(page, 250);
      ok(await ev(page, () => !document.getElementById('al')), 'después de la transición, se quita');
      // API: bootstrap.Alert(el).close(), getInstance y getOrCreateInstance; sin .fade se quita al instante.
      const r = await ev(page, () => {
        const el = document.getElementById('al2');
        const a = new bootstrap.Alert(el);
        const misma = bootstrap.Alert.getInstance(el) === a && bootstrap.Alert.getOrCreateInstance(el) === a && bootstrap.Alert.getInstance('#al2') === a;
        a.close();
        return { misma, quitado: !document.getElementById('al2'), sinInst: bootstrap.Alert.getInstance(el) === null };
      });
      ok(r.misma, 'una instancia por elemento');
      ok(r.quitado && r.sinInst, 'close() sin fade la quita al instante y suelta la instancia');
      // close.bs.alert con preventDefault no la quita.
      await ev(page, () => document.getElementById('al3').addEventListener('close.bs.alert', (e) => e.preventDefault(), { once: true }));
      await page.click('#al3x'); await esperar(page, 250);
      ok(await ev(page, () => !!document.getElementById('al3') && document.getElementById('al3').classList.contains('show')), 'close.bs.alert cancelado: se queda');
      await page.click('#al3x'); await esperar(page, 250);
      ok(await ev(page, () => !document.getElementById('al3')), 'segundo clic: se quita');
      const evs = await ev(page, () => window.__al);
      ok(JSON.stringify(evs) === JSON.stringify(['close:al:true', 'closed:al:false', 'close:al2:true', 'closed:al2:false', 'close:al3:true', 'close:al3:true', 'closed:al3:false']), 'eventos: ' + JSON.stringify(evs));
    }
  },
  {
    id: 'c-10', titulo: 'puente de jQuery: $(el).modal("show"|"hide"|"toggle") y .on("shown.bs.modal")',
    pagina: { jquery: true, body: MODALES },
    fn: async (page, ok) => {
      ok(await ev(page, () => typeof jQuery.fn.modal === 'function' && typeof jQuery.fn.tab === 'function'), 'jQuery.fn.modal y .tab instalados');
      await ev(page, () => { window.__jq = []; $('#mdl').on('shown.bs.modal', function (e) { window.__jq.push('shown:' + this.id); }); $('#mdl').modal('show'); });
      await esperar(page, 400);
      ok(await visibleModal(page, 'mdl'), "modal('show')");
      ok(await ev(page, () => window.__jq.join()) === 'shown:mdl', 'el manejador de jQuery recibe shown.bs.modal');
      // e.preventDefault() desde un manejador de jQuery cancela, como con Bootstrap.
      await ev(page, () => { $('#mdl').on('hide.bs.modal', function (e) { if (!window.__dejar) { window.__dejar = true; e.preventDefault(); } }); $('#mdl').modal('hide'); });
      await esperar(page, 400);
      ok(await visibleModal(page, 'mdl'), 'hide.bs.modal cancelado desde jQuery');
      await ev(page, () => $('#mdl').modal('hide')); await esperar(page, 400);
      ok(!(await visibleModal(page, 'mdl')), "modal('hide')");
      await ev(page, () => $('#mdl_sinfade').modal('toggle'));
      ok(await visibleModal(page, 'mdl_sinfade'), "modal('toggle')");
      await ev(page, () => $('#mdl_sinfade').modal('hide'));
      ok(await ev(page, () => bootstrap.Modal.getInstance(document.getElementById('mdl_sinfade')) !== null), 'misma instancia que bootstrap.Modal.getInstance');
    }
  },
  {
    id: 'c-11', titulo: 'puente de jQuery: no toca un .fn.modal que ya existe',
    pagina: { antes: '<script src="/jquery.js"></script><script>jQuery.fn.modal = function () { window.__propio = true; return this; };</script>', body: MODALES },
    fn: async (page, ok) => {
      await ev(page, () => $('#mdl').modal('show')); await esperar(page, 400);
      ok(await ev(page, () => window.__propio === true), 'se llama al .modal que ya estaba');
      ok(!(await visibleModal(page, 'mdl')), 'y el de compat no actúa');
    }
  },
];

async function main() {
  const lista = PRUEBAS.filter(p => (!FILTRO || p.id.includes(FILTRO) || p.titulo.includes(FILTRO)) && !(BS_JS && ['c-01', 'c-11'].includes(p.id)));
  const bsCss = BS_CSS ? fs.readFileSync(BS_CSS, 'utf8') : CSS_MIN;
  const jq = JQ ? fs.readFileSync(JQ, 'utf8') : JQ_MIN;
  const browser = await chromium.launch();
  let total = 0, fallas = 0;
  for (const p of lista) {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const consola = [], fallos = [];
    const ok = (cond, msg) => { if (!cond) fallos.push(msg); else if (VERBOSE) console.log('      ok ' + msg); };
    total++;
    try {
      const page = await ctx.newPage();
      page.on('pageerror', e => consola.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') consola.push('console: ' + m.text()); });
      await page.route('http://dlg.test/**', (route) => {
        const u = new URL(route.request().url());
        if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html(Object.assign({ bsCss }, p.pagina ?? {})) });
        if (u.pathname === '/dialogs.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(SRC) });
        if (u.pathname === '/theme.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(THEME) });
        if (u.pathname === '/bootstrap.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(BS_JS) });
        if (u.pathname === '/jquery.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: jq });
        return route.fulfill({ status: 404, body: '' });
      });
      await page.route(/^(?!http:\/\/dlg\.test\/).*/, r => r.abort());
      await page.goto('http://dlg.test/');
      await p.fn(page, ok);
    } catch (e) { fallos.push('excepción: ' + e.message.split('\n')[0]); }
    if (consola.length) fallos.push('errores de consola: ' + JSON.stringify(consola));
    if (fallos.length) { fallas++; console.log('FALLA  ' + p.id + ' · ' + p.titulo); fallos.forEach(f => console.log('       - ' + f)); }
    else console.log('pasa   ' + p.id + ' · ' + p.titulo);
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${total} pruebas · pasan ${total - fallas} · fallan ${fallas} · css ${BS_CSS ? 'Bootstrap real' : 'mínimo'} · jQuery ${JQ ? 'real' : 'sustituto'}${BS_JS ? ' · bootstrap.bundle REAL (sin compat)' : ''}`);
  process.exit(fallas ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
