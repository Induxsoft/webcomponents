// v2: tema de la página (módulo común InduxsoftTheme, induxsoft.theme.js) e integración con EdiTable.
// Spec: /home/claude/mapa/induxsoft-theme-spec.md y examples/inputkey-propuesta/PROPUESTA.md («Tema para toda la página»).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tabla, PRODUCTOS } from '../lib/fixtures.mjs';
import { pagina } from '../lib/html.mjs';
import { registro } from '../lib/v2.mjs';
import { verificar } from '../../tools/embed-theme.mjs';

const { P, t } = registro('tpg', { requiere: ['page-theme'] });
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// sha256 de JSON.stringify(EditTable.themes): los temas no cambian de valores sin querer. Hasta 1.1.0 eran los de F8b
// (60cfda39…); InduxsoftTheme 1.2.0 cambia a propósito solo 'font' (letra de Windows 11) y agrega 'info' en los cuatro.
const HASH_TEMAS_F8B = 'e12e5b4cd3fb315018bb39353af33166c060b8f6879d655aab8c68f86f9b1e3a';

const COLS = [
  { field: 'codigo', type: 'Text', title: 'Código', width: '90px' },
  { field: 'nombre', type: 'Text', title: 'Nombre', width: '200px' },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', width: '90px' },
];
const T = (id, a = {}) => tabla({ id, a, cols: COLS, data: PRODUCTOS });
/** Página con atributos en <html> (htmlAttrs) y <body> (bodyAttrs). */
const pag = ({ html = '', body = '', cuerpo = '', head = '', antes = '', script = '' } = {}) =>
  pagina({ body: cuerpo, head, antes, script }).replace('<html lang="es-MX">', `<html lang="es-MX"${html}>`).replace('<body>', `<body${body}>`);
const rgb = (hex) => { const h = hex.replace('#', ''); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`; };
// Fondo del encabezado y estado de una tabla (por id, en el documento, o un elemento que se pasa con 'sel' dentro de un host).
const estado = (c, id) => c.ev((id) => {
  const el = document.getElementById(id), s = el.shadowRoot;
  return { theme: el.Theme, density: el.Density, f8b: !!s.querySelector('style[data-et="f8b"]'), head: getComputedStyle(s.querySelector('thead')).backgroundColor,
    pad: getComputedStyle(s.querySelector('tbody > tr > td')).paddingTop, accent: getComputedStyle(s.querySelector('thead')).getPropertyValue('--et-accent').trim() };
}, id);
const temas = (c) => c.ev(() => InduxsoftTheme.themes);
const cuadro = (c) => c.cuadro();

// ---------- API y registro ----------
t('01', "bandera 'page-theme'; InduxsoftTheme expone la API; los temas son los de F8b con los mismos valores", ['§TP-api', '§TP-registro'], async (c) => {
  await c.abrir({ html: pag({ cuerpo: T('t1') }) });
  const r = await c.ev(async () => {
    const IT = window.InduxsoftTheme;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(EditTable.themes)));
    return {
      f: EditTable.features.includes('page-theme'), v: IT.version,
      api: ['resolve', 'get', 'set', 'setPalette', 'setDensity', 'define', 'theme', 'subscribe', 'unsubscribe', 'cssVars', 'fontStack', 'forget'].filter(k => typeof IT[k] !== 'function'),
      mismos: JSON.stringify(EditTable.themes) === JSON.stringify(IT.themes), nombres: Object.keys(IT.themes),
      hash: Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''),
    };
  });
  c.igual(r.f, true); c.igual(r.api, [], 'métodos'); c.ok(/^\d+\.\d+\.\d+$/.test(r.v), 'version semver');
  c.igual(r.mismos, true, 'EditTable.themes es alias'); c.igual(r.nombres, ['claro', 'oscuro', 'jade', 'libro-mayor']);
  c.igual(r.hash, HASH_TEMAS_F8B, 'valores exactos de F8b (con la letra y el info de 1.2.0)');
});
t('02', 'cssVars y fontStack: declaraciones --et-t-* (sin color-scheme), prefijo e !important opcionales', ['§TP-api'], async (c) => {
  await c.abrir({ html: pag({ cuerpo: T('t1') }) });
  const r = await c.ev(() => ({
    a: InduxsoftTheme.cssVars({ 'color-scheme': 'dark', bg: '#000', 'header-bg': '#111' }),
    b: InduxsoftTheme.cssVars({ bg: '#000' }, { prefix: '--et-', important: true }),
    f1: InduxsoftTheme.fontStack(InduxsoftTheme.theme('jade')), f0: InduxsoftTheme.fontStack(null),
  }));
  c.igual(r.a, '--et-t-bg: #000; --et-t-header-bg: #111;'); c.igual(r.b, '--et-bg: #000 !important;');
  c.contiene(r.f1, 'Segoe UI'); c.contiene(r.f0, 'system-ui');
});

// ---------- herencia ----------
t('03', 'herencia desde <html>: la tabla sin theme toma data-et-theme, data-et-density y data-et-palette', ['§TP-herencia'], async (c) => {
  await c.abrir({ html: pag({ html: ` data-et-theme="oscuro" data-et-density="compacta" data-et-palette='{"accent":"#B45309"}'`, cuerpo: T('t1') }) });
  const th = await temas(c), e = await estado(c, 't1');
  c.igual(e.theme, 'oscuro'); c.igual(e.head, rgb(th.oscuro['header-bg'])); c.igual(e.density, 'compacta'); c.igual(e.pad, '1px'); c.igual(e.accent, '#B45309');
  c.igual(await c.ev(() => InduxsoftTheme.resolve(document.getElementById('t1')).source), 'element');
});
t('04', 'herencia desde <body>', ['§TP-herencia'], async (c) => {
  await c.abrir({ html: pag({ body: ' data-et-theme="jade"', cuerpo: T('t1') }) });
  const th = await temas(c), e = await estado(c, 't1');
  c.igual(e.theme, 'jade'); c.igual(e.head, rgb(th.jade['header-bg']));
});
t('05', 'herencia desde un <div>: el ancestro más cercano gana; fuera de la zona, como hoy', ['§TP-herencia'], async (c) => {
  await c.abrir({ html: pag({ body: ' data-et-theme="claro"', cuerpo: `${T('t1')}<aside data-et-theme="oscuro"><div>${T('t2')}<section data-et-theme="libro-mayor">${T('t3')}</section></div></aside>` }) });
  const th = await temas(c);
  c.igual((await estado(c, 't1')).head, rgb(th.claro['header-bg']));
  c.igual((await estado(c, 't2')).head, rgb(th.oscuro['header-bg']));
  c.igual((await estado(c, 't3')).head, rgb(th['libro-mayor']['header-bg']));
  await c.abrir({ html: pag({ cuerpo: `${T('t1')}<div data-et-theme="jade">${T('t2')}</div>` }) });
  c.igual((await estado(c, 't1')).f8b, false, 'fuera de la zona no hay tema');
  c.igual((await estado(c, 't2')).theme, 'jade');
});
t('06', 'data-et-theme="" corta la herencia (debajo se ve como hoy), también la del tema recordado', ['§TP-corte'], async (c) => {
  await c.abrir({ html: pag({ html: ' data-et-theme="oscuro"', cuerpo: `<div data-et-theme="">${T('t1')}</div>${T('t2')}` }) });
  c.igual(await estado(c, 't1').then(e => [e.theme, e.f8b]), ['', false]);
  c.igual((await estado(c, 't2')).theme, 'oscuro');
  const o = await c.otra({ html: pag({ cuerpo: `<div>${T('t1')}</div>${T('t2')}` }) });
  c.igual(await c.ev(() => __ct.serial('t1')), await o.ev(() => __ct.serial('t1')), 'shadow DOM igual al de una tabla sin tema');
  await c.ev(() => localStorage.setItem('induxsoft.theme', JSON.stringify({ theme: 'jade' })));
  await c.page.reload(); await cuadro(c);
  c.igual((await estado(c, 't1')).theme, '', 'el corte también gana a lo recordado');
});

// ---------- precedencia ----------
t('07', 'precedencia: respaldo < ancestro < theme propio < --et-* externas < palette propia; palette y density por separado', ['§TP-precedencia'], async (c) => {
  const html = pag({
    html: ` data-et-theme="oscuro" data-et-palette='{"header-bg":"#102030"}' data-et-density="comoda"`,
    head: '<style>#ext{--et-header-bg:#405060}</style>',
    cuerpo: `${T('t1')}${T('t2', { theme: 'jade' })}${T('t3', { theme: '' })}<div id="ext">${T('t4', { theme: 'jade' })}${T('t5', { palette: '{"header-bg":"#708090"}' })}</div>${T('t6', { density: 'compacta' })}${T('t7', { palette: '{"accent":"#123456"}' })}`,
  });
  await c.abrir({ html });
  const th = await temas(c);
  const e = {}; for (const id of ['t1', 't2', 't3', 't4', 't5', 't6', 't7']) e[id] = await estado(c, id);
  c.igual([e.t1.theme, e.t1.head], ['oscuro', rgb('#102030')], 'tema y palette de la página');
  c.igual([e.t2.theme, e.t2.head], ['jade', rgb('#102030')], 'theme propio gana al de la página; la palette de la página sigue encima');
  c.igual([e.t3.theme, e.t3.f8b, e.t3.head], ['', true, rgb('#102030')], 'theme="" propio: sin tema (la palette de la página sigue)');
  c.igual(e.t4.head, rgb('#102030'), 'palette de la página (heredada como palette) gana a las externas');
  c.igual(e.t5.head, rgb('#708090'), 'palette propia gana a todo');
  c.igual([e.t1.pad, e.t6.pad, e.t6.density], ['8px', '1px', 'compacta'], 'density propia gana a la de la página');
  c.igual([e.t7.accent, e.t7.head], ['#123456', rgb(th.oscuro['header-bg'])], 'palette propia reemplaza a la de la página');
  // sin palette en la página, las externas ganan al tema (propio o heredado)
  await c.abrir({ html: pag({ html: ' data-et-theme="oscuro"', head: '<style>#ext{--et-header-bg:#405060}</style>', cuerpo: `<div id="ext">${T('t1')}${T('t2', { theme: 'jade' })}</div>` }) });
  c.igual([(await estado(c, 't1')).head, (await estado(c, 't2')).head], [rgb('#405060'), rgb('#405060')], 'externas > tema');
});

// ---------- en caliente ----------
t('08', 'cambio en caliente con set/setPalette/setDensity: mismos <tr>, mismos datos, sin eventos; al quitarlo el DOM es el de antes', ['§TP-caliente'], async (c) => {
  await c.abrir({ html: pag({ cuerpo: T('t1') }) });
  const antes = await c.ev(() => __ct.serial('t1'));
  await c.ev(() => { const s = __ct.sr('t1'); window.__trs = Array.from(s.querySelectorAll('tbody > tr')); __ct.limpiar(); window.__tc = []; document.addEventListener('themechange', e => __tc.push(e.detail.reason)); });
  const th = await temas(c);
  for (const n of ['oscuro', 'jade', 'libro-mayor', 'auto', 'claro']) {
    await c.ev((n) => InduxsoftTheme.set(n), n); await cuadro(c);
    const e = await estado(c, 't1');
    c.igual(e.theme, n, 'Theme'); if (n !== 'auto') c.igual(e.head, rgb(th[n]['header-bg']), n);
  }
  await c.ev(() => { InduxsoftTheme.setDensity('compacta'); InduxsoftTheme.setPalette({ accent: '#B45309' }); InduxsoftTheme.setPalette({ 'header-bg': '#102030' }, { merge: true }); }); await cuadro(c);
  const e = await estado(c, 't1');
  c.igual([e.pad, e.accent, e.head], ['1px', '#B45309', rgb('#102030')]);
  c.igual(await c.ev(() => document.documentElement.getAttribute('data-et-palette')), '{"accent":"#B45309","header-bg":"#102030"}', 'merge');
  const r = await c.ev(() => ({ mismos: Array.from(__ct.sr('t1').querySelectorAll('tbody > tr')).every((tr, i) => tr === __trs[i]), n: __trs.length, eventos: __ct.log.length, tc: __tc.length }));
  c.igual([r.mismos, r.eventos], [true, 0], 'sin redibujar ni eventos'); c.ok(r.tc >= 5, 'themechange en document');
  await c.ev(() => { InduxsoftTheme.set(null); InduxsoftTheme.setDensity(null); InduxsoftTheme.setPalette(null); }); await cuadro(c);
  c.igual(await c.ev(() => __ct.serial('t1')), antes, 'DOM como al principio');
  c.igual(await c.ev(() => document.documentElement.getAttributeNames()), ['lang']);
});
t('09', 'subscribe: avisa solo a los suscriptores debajo del elemento cambiado, una vez por cambio; unsubscribe; un solo MutationObserver', ['§TP-aviso'], async (c) => {
  await c.abrir({
    html: pag({
      antes: '<script>window.__mo = 0; const M = window.MutationObserver; window.MutationObserver = class extends M { constructor(f) { super(f); window.__mo++; } };</script>',
      head: '<script>window.__moTrasCargar = window.__mo;</script>',
      cuerpo: `<div id="a">${T('t1')}<span id="sa"></span></div><div id="b">${T('t2')}<span id="sb"></span></div>${T('t3')}${T('t4')}${T('t5')}`,
    }),
  });
  const r = await c.ev(async () => {
    const mo = window.__moTrasCargar;
    const log = [], tick = () => new Promise(r => setTimeout(r, 30));
    const ua = InduxsoftTheme.subscribe(document.getElementById('sa'), (x) => log.push('a:' + x.theme));
    InduxsoftTheme.subscribe(document.getElementById('sb'), (x) => log.push('b:' + x.theme));
    document.getElementById('a').setAttribute('data-et-theme', 'jade'); await tick();
    const l1 = log.slice();
    document.getElementById('a').setAttribute('data-et-theme', 'jade'); await tick();   // mismo valor: no avisa
    const l2 = log.slice();
    document.documentElement.setAttribute('data-et-theme', 'oscuro'); await tick();       // a conserva jade
    const l3 = log.slice();
    ua(); document.getElementById('a').removeAttribute('data-et-theme'); await tick();
    return { l1, l2, l3, l4: log.slice(), mo, t1: document.getElementById('t1').Theme, t2: document.getElementById('t2').Theme };
  });
  c.igual(r.l1, ['a:jade']); c.igual(r.l2, ['a:jade']); c.igual(r.l3, ['a:jade', 'b:oscuro']); c.igual(r.l4, r.l3, 'después de unsubscribe');
  c.igual([r.t1, r.t2], ['oscuro', 'oscuro']);
  c.igual(r.mo, 1, 'un solo MutationObserver (el del módulo, creado al cargar)');
  // suscribir más elementos, incluso dentro de un shadow DOM, no crea más observadores
  const n = await c.ev(() => { const antes = window.__mo; const h = document.createElement('div'); document.body.append(h); const s = h.attachShadow({ mode: 'open' }); s.innerHTML = '<p></p>';
    InduxsoftTheme.subscribe(s.querySelector('p'), () => {}); InduxsoftTheme.subscribe(document.body, () => {}); return window.__mo - antes; });
  c.igual(n, 0);
});
t('10', 'al mover una tabla a otra zona (connectedCallback) vuelve a resolver su tema', ['§TP-herencia', '§TP-caliente'], async (c) => {
  await c.abrir({ html: pag({ cuerpo: `<div id="a" data-et-theme="oscuro">${T('t1')}</div><div id="b" data-et-theme="jade"></div>` }) });
  c.igual((await estado(c, 't1')).theme, 'oscuro');
  await c.ev(() => document.getElementById('b').appendChild(document.getElementById('t1'))); await cuadro(c);
  c.igual((await estado(c, 't1')).theme, 'jade');
  await c.ev(() => document.getElementById('b').setAttribute('data-et-theme', 'libro-mayor')); await c.esperar(30);
  c.igual((await estado(c, 't1')).theme, 'libro-mayor', 'sigue suscrita en su nuevo lugar');
  await c.ev(() => document.getElementById('a').setAttribute('data-et-theme', 'claro')); await c.esperar(30);
  c.igual((await estado(c, 't1')).theme, 'libro-mayor', 'el lugar anterior ya no la afecta');
});

// ---------- shadow DOM ----------
t('11', 'tablas dentro de otro shadow DOM: heredan cruzando el host y cambian en caliente con atributos dentro del shadow', ['§TP-shadow'], async (c) => {
  await c.abrir({
    html: pag({
      html: ' data-et-theme="oscuro"',
      cuerpo: '<x-panel id="p1"></x-panel>',
      script: `customElements.define('x-panel', class extends HTMLElement { connectedCallback() { const s = this.attachShadow({ mode: 'open' });
        s.innerHTML = ${JSON.stringify(T('in1') + '<div id="zona">' + T('in2') + '</div>')}; } });`,
    }),
  });
  await cuadro(c);
  const th = await temas(c);
  const lee = () => c.ev(() => { const s = document.getElementById('p1').shadowRoot; return ['in1', 'in2'].map(id => { const t = s.getElementById(id); return [t.Theme, getComputedStyle(t.shadowRoot.querySelector('thead')).backgroundColor]; }); });
  c.igual(await lee(), [['oscuro', rgb(th.oscuro['header-bg'])], ['oscuro', rgb(th.oscuro['header-bg'])]]);
  await c.ev(() => document.getElementById('p1').shadowRoot.getElementById('zona').setAttribute('data-et-theme', 'jade')); await c.esperar(30);
  c.igual((await lee()).map(x => x[0]), ['oscuro', 'jade'], 'atributo dentro del shadow');
  await c.ev(() => document.getElementById('p1').setAttribute('data-et-theme', 'libro-mayor')); await c.esperar(30);
  c.igual((await lee()).map(x => x[0]), ['libro-mayor', 'jade'], 'atributo en el host');
});

// ---------- iframes ----------
const hija = (cuerpo = T('t1'), html = '') => pag({ html, cuerpo });
t('12', 'iframe del mismo origen: hereda del <iframe> en la ventana padre y se actualiza al cambiar la padre', ['§TP-iframe'], async (c) => {
  const url = c.srv.registrar(hija());
  const url2 = c.srv.registrar(hija(T('t1'), ' data-et-theme="libro-mayor"'));
  await c.abrir({ html: pag({ html: ' data-et-theme="jade"', cuerpo: `${T('p1')}<div id="zona"><iframe id="f" src="${url}" style="width:600px;height:300px"></iframe></div><iframe id="g" src="${url2}"></iframe>` }) });
  await c.page.waitForFunction(() => ['f', 'g'].every(id => document.getElementById(id).contentWindow?.document?.getElementById('t1')?.shadowRoot));
  const th = await temas(c);
  const lee = (id = 'f') => c.ev((id) => { const d = document.getElementById(id).contentWindow.document, t = d.getElementById('t1'); return [t.Theme, getComputedStyle(t.shadowRoot.querySelector('thead')).backgroundColor, d.defaultView.InduxsoftTheme.resolve(t).source]; }, id);
  c.igual(await lee(), ['jade', rgb(th.jade['header-bg']), 'frame']);
  c.igual((await lee('g'))[0], 'libro-mayor', 'la hija que declara el suyo gana');
  await c.ev(() => InduxsoftTheme.set('oscuro')); await c.esperar(50);
  c.igual((await lee())[0], 'oscuro', 'set en la padre');
  c.igual((await lee('g'))[0], 'libro-mayor');
  await c.ev(() => document.getElementById('zona').setAttribute('data-et-theme', 'claro')); await c.esperar(50);
  c.igual((await lee())[0], 'claro', 'ancestro del <iframe>');
  await c.ev(() => document.getElementById('zona').setAttribute('data-et-theme', '')); await c.esperar(50);
  c.igual((await lee())[0], '', 'corte en la padre');
  c.sinErrores();
});
t('13', 'iframe cuya ventana padre no carga el módulo: la hija observa el documento de la padre', ['§TP-iframe'], async (c) => {
  const url = c.srv.registrar(hija());
  await c.abrir({ html: pag({ html: ' data-et-theme="jade"', cuerpo: `<iframe id="f" src="${url}"></iframe>` }).replace('<script src="/__et/editable.js"></script>', '') });
  await c.page.waitForFunction(() => document.getElementById('f').contentWindow?.document?.getElementById('t1')?.shadowRoot);
  const lee = () => c.ev(() => document.getElementById('f').contentWindow.document.getElementById('t1').Theme);
  c.igual(await c.ev(() => typeof window.InduxsoftTheme), 'undefined');
  c.igual(await lee(), 'jade');
  await c.ev(() => document.documentElement.setAttribute('data-et-theme', 'oscuro')); await c.esperar(50);
  c.igual(await lee(), 'oscuro');
});

// ---------- auto y remember ----------
t('14', 'auto sigue prefers-color-scheme (effective claro/oscuro) y avisa al cambiar el esquema', ['§TP-auto'], async (c) => {
  await c.abrir({ html: pag({ html: ' data-et-theme="auto"', cuerpo: T('t1') }), contexto: { colorScheme: 'dark' } });
  const th = await temas(c);
  const lee = () => c.ev(() => { const r = InduxsoftTheme.resolve(document.getElementById('t1')); return [r.theme, r.effective, r.scheme]; });
  c.igual(await lee(), ['auto', 'oscuro', 'dark']);
  c.igual((await estado(c, 't1')).head, rgb(th.oscuro['header-bg']));
  await c.ev(() => { window.__av = []; InduxsoftTheme.subscribe(document.getElementById('t1'), r => __av.push(r.effective)); document.addEventListener('themechange', e => __av.push('ev:' + e.detail.reason)); });
  await c.page.emulateMedia({ colorScheme: 'light' }); await c.esperar(50);
  c.igual(await lee(), ['auto', 'claro', 'light']);
  c.igual((await estado(c, 't1')).head, rgb(th.claro['header-bg']));
  c.igual(await c.ev(() => __av), ['claro', 'ev:scheme']);
});
t('15', 'remember: set(nombre, {remember:true}) se guarda en localStorage y se usa solo si no hay nada declarado', ['§TP-remember'], async (c) => {
  await c.abrir({ html: pag({ cuerpo: T('t1') }) });
  await c.ev(() => InduxsoftTheme.set('oscuro'));
  c.igual(await c.ev(() => localStorage.getItem('induxsoft.theme')), null, 'sin remember no se guarda');
  await c.ev(() => InduxsoftTheme.set('jade', { remember: true }));
  c.igual(await c.ev(() => JSON.parse(localStorage.getItem('induxsoft.theme'))), { theme: 'jade' });
  await c.page.reload(); await cuadro(c);
  c.igual((await estado(c, 't1')).theme, 'jade', 'recordado al recargar');
  c.igual(await c.ev(() => [InduxsoftTheme.resolve(document.getElementById('t1')).source, document.documentElement.hasAttribute('data-et-theme')]), ['storage', false]);
  await c.ev(() => document.body.setAttribute('data-et-theme', 'libro-mayor')); await c.esperar(30);
  c.igual((await estado(c, 't1')).theme, 'libro-mayor', 'lo declarado gana a lo recordado');
  await c.ev(() => InduxsoftTheme.set('claro', { remember: false }));
  c.igual(await c.ev(() => localStorage.getItem('induxsoft.theme')), null, 'remember:false lo borra');
});

// ---------- registro común ----------
t('16', 'defineTheme y define registran en el mismo lugar; las tablas que heredan ese tema se actualizan', ['§TP-registro'], async (c) => {
  await c.abrir({ html: pag({ html: ' data-et-theme="v12-azul"', cuerpo: `${T('t1')}<div data-et-theme="mi-tema">${T('t2')}</div>` }) });
  c.igual((await estado(c, 't1')).f8b, false, 'tema aún no registrado: sin tema');
  await c.ev(() => EditTable.defineTheme('v12-azul', { 'header-bg': '#0F3D6E' })); await cuadro(c);
  c.igual((await estado(c, 't1')).head, rgb('#0F3D6E'));
  await c.ev(() => InduxsoftTheme.define('mi-tema', { 'header-bg': '#5B2A86' }, { base: 'oscuro' })); await cuadro(c);
  c.igual((await estado(c, 't2')).head, rgb('#5B2A86'));
  const r = await c.ev(() => ({ a: Object.keys(InduxsoftTheme.themes), b: Object.keys(EditTable.themes), bg: EditTable.themes['mi-tema'].bg, fh: InduxsoftTheme.themes['v12-azul']['fixed-head-bg'] }));
  c.contiene(r.a, 'v12-azul'); c.contiene(r.b, 'mi-tema'); c.igual(r.bg, '#15181C', 'base oscuro'); c.igual(r.fh, '#0F3D6E', 'derivada');
  c.igual(await c.ev(() => { try { InduxsoftTheme.define('auto', {}); return 'no'; } catch (e) { return 'lanza'; } }), 'lanza');
});
t('17', 'versiones: una copia igual no se reinstala; una más nueva reemplaza a la anterior conservando sus temas y suscriptores', ['§TP-incrustacion'], async (c) => {
  const mod = fs.readFileSync(path.join(RAIZ, 'src/js/induxsoft.theme.js'), 'utf8');
  const viejo = mod.replace(/var VERSION = '[^']+'/, "var VERSION = '0.9.0'");
  await c.abrir({ html: pag({ antes: `<script>${viejo}</script><script>InduxsoftTheme.define('viejo', {'header-bg':'#334455'}); window.__v = InduxsoftTheme; window.__n = 0; InduxsoftTheme.subscribe(document.documentElement, () => __n++);</script>`, cuerpo: `<div data-et-theme="viejo">${T('t1')}</div>`, head: '<script src="/src/js/induxsoft.controls.js"></script>' }) });
  const r = await c.ev(async () => {
    const IT = InduxsoftTheme, uno = IT;
    document.documentElement.setAttribute('data-et-theme', 'jade'); await new Promise(r => setTimeout(r, 30));
    return { v: IT.version, reemplazado: IT !== __v, viejo: !!IT.themes.viejo, n: __n, mismo: uno === window.InduxsoftTheme, theme: document.getElementById('t1').Theme };
  });
  c.igual(r.v, (/var VERSION = '([^']+)'/.exec(mod) || [])[1]); c.igual(r.reemplazado, true); c.igual(r.viejo, true, 'conserva temas');
  c.igual(r.n, 1, 'conserva suscriptores (y avisa una sola vez)'); c.igual(r.theme, 'viejo');
  c.sinErrores();
});
t('18', 'las copias incrustadas en induxsoft.controls.editable.js e induxsoft.controls.js son iguales al módulo (embed-theme.mjs)', ['§TP-incrustacion'], async (c) => {
  c.igual(verificar(), [], 'tests/tools/embed-theme.mjs --check');
});

// ---------- sin nada, igual que antes ----------
t('19', 'sin data-et-* ni localStorage: shadow DOM, estilos y features iguales a una tabla sin el módulo de tema (0ed1824)', ['§TP-r1', '§0-R1'], async (c) => {
  const cuerpo = { body: `<div>${T('t1', { 'control-styles': 'tr td{color:rgb(1,2,3)}' })}</div>` };
  await c.abrir(cuerpo); const o = await c.otra({ ...cuerpo, src: 'ref' });
  for (const x of [c, o]) await x.ev(() => __ct.t('t1').CellFocus(__ct.td('t1', 1, 1)));
  c.igual(await c.ev(() => __ct.serial('t1')), await o.ev(() => __ct.serial('t1')));
  const r = await c.ev(() => ({ f8b: !!__ct.sr('t1').querySelector('style[data-et="f8b"]'), theme: __ct.t('t1').Theme, d: __ct.t('t1').Density, ls: localStorage.length, res: InduxsoftTheme.resolve(__ct.t('t1')) }));
  c.igual(r, { f8b: false, theme: '', d: 'normal', ls: 0, res: { theme: '', palette: null, density: '', effective: '', scheme: '', source: '' } });
});

export default { nombre: 'v2-tema-pagina', grupo: 'v2', pruebas: P };
