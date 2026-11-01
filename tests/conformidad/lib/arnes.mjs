// Arnés de la batería de conformidad: servidor HTTP local, contexto de prueba y aserciones.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pagina } from './html.mjs';

export class Falla extends Error { constructor(m) { super(m); this.name = 'Falla'; } }
export class Pendiente extends Error { constructor(m) { super(m); this.name = 'Pendiente'; } }

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

/** Servidor: /__et/editable.js (bajo prueba), /__ref/editable.js (referencia), /__et/excel.js, páginas en memoria y archivos del repo. */
export function servidor({ raiz, src, ref, excel, mask }) {
  const paginas = new Map();
  let n = 0;
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = decodeURIComponent(url.pathname);
    const enviar = (cuerpo, tipo, cod = 200) => { res.writeHead(cod, { 'content-type': tipo, 'cache-control': 'no-store' }); res.end(cuerpo); };
    const archivo = (f) => {
      if (!f || !fs.existsSync(f)) return enviar('no existe', 'text/plain', 404);
      enviar(fs.readFileSync(f), TIPOS[path.extname(f)] ?? 'application/octet-stream');
    };
    if (p === '/__et/editable.js') {
      // --mask: para validar el motor de máscaras por separado, se concatena y se expone como EditTable.Mask
      if (mask && fs.existsSync(src)) return enviar(fs.readFileSync(src, 'utf8') + '\n;' + fs.readFileSync(mask, 'utf8') +
        '\n;try{if(typeof EditTable!=="undefined"&&!EditTable.Mask&&typeof EditTableMask!=="undefined")EditTable.Mask=EditTableMask;}catch(e){}', TIPOS['.js']);
      return archivo(src);
    }
    if (p === '/__ref/editable.js') return archivo(ref);
    if (p === '/__et/excel.js') return archivo(excel);
    // los ejemplos cargan las rutas del repo: se sirven con los archivos elegidos (--src, --excel)
    if (p === '/src/js/induxsoft.controls.editable.js' && src) return archivo(src);
    if (p === '/src/js/induxsoft.controls.excel.js' && excel) return archivo(excel);
    if (paginas.has(p)) return enviar(paginas.get(p), 'text/html; charset=utf-8');
    const f = path.normalize(path.join(raiz, p));
    if (!f.startsWith(raiz)) return enviar('fuera', 'text/plain', 403);
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) return archivo(path.join(f, 'index.html'));
    return archivo(f);
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => {
    const base = `http://127.0.0.1:${srv.address().port}`;
    resolve({
      base,
      registrar(html, ruta) { const r = ruta ?? `/__p/${++n}.html`; paginas.set(r, html); return base + r; },
      cerrar: () => new Promise(r => srv.close(r)),
    });
  }));
}

function json(v) { try { return JSON.stringify(v); } catch { return String(v); } }
function corto(v, n = 300) { const s = json(v); return s && s.length > n ? s.slice(0, n) + '…' : s; }

function igualProfundo(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => igualProfundo(a[k], b[k]));
  }
  return Number.isNaN(a) && Number.isNaN(b);
}

/** Contexto que recibe cada prueba. Una página (y un BrowserContext) nuevos por prueba. */
export class Ctx {
  constructor({ browser, srv, nombre, opcionesContexto }) {
    this.browser = browser; this.srv = srv; this.nombre = nombre;
    this.opcionesContexto = opcionesContexto ?? {};
    this.page = null; this.context = null;
    this.dialogos = []; this.consola = []; this.erroresPagina = [];
    this.otras = [];
    this.notas = [];
  }

  async _nuevaPagina(opts) {
    const vp = opts.viewport ?? { width: 1100, height: 700 };
    this.context = await this.browser.newContext({ viewport: vp, ...this.opcionesContexto, ...(opts.contexto ?? {}) });
    await this.context.addInitScript({ path: new URL('./sonda.js', import.meta.url).pathname });
    if (opts.permisos) await this.context.grantPermissions(opts.permisos, { origin: this.srv.base });
    this.page = await this.context.newPage();
    this.page.on('dialog', (d) => { this.dialogos.push({ tipo: d.type(), mensaje: d.message() }); d.dismiss().catch(() => {}); });
    this.page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') this.consola.push({ tipo: m.type(), texto: m.text() }); });
    this.page.on('pageerror', (e) => this.erroresPagina.push(String(e && e.message || e)));
  }

  /** Abre una página construida con html.mjs#pagina (o con opts.html literal). */
  async abrir(opts = {}) {
    if (this.page) { await this.context.close(); this.page = null; }
    this.dialogos = []; this.consola = []; this.erroresPagina = [];
    await this._nuevaPagina(opts);
    const html = opts.html ?? pagina(opts);
    // opts.ruta: ruta exacta (para las pruebas de la llave del diseño, que dependen de location.pathname)
    const url = this.srv.registrar(html, opts.ruta);
    await this.page.goto(url + (opts.query ?? ''), { waitUntil: 'load' });
    await this.cuadro();
    return this.page;
  }

  /** Abre una ruta del repo (por ejemplo examples/v2/x.html). */
  async abrirArchivo(rel, opts = {}) {
    if (this.page) { await this.context.close(); this.page = null; }
    this.dialogos = []; this.consola = []; this.erroresPagina = [];
    await this._nuevaPagina(opts);
    await this.page.goto(this.srv.base + '/' + rel.replace(/^\//, ''), { waitUntil: 'load' });
    await this.cuadro();
    return this.page;
  }

  /** Otro contexto independiente (para comparar con la referencia, o para una segunda carga). */
  async otra(opts = {}) {
    const c = new Ctx({ browser: this.browser, srv: this.srv, nombre: this.nombre + '/otra', opcionesContexto: this.opcionesContexto });
    this.otras.push(c);
    await c.abrir(opts);
    return c;
  }

  async cerrar() {
    for (const o of this.otras) await o.cerrar();
    if (this.context) await this.context.close().catch(() => {});
  }

  ev(fn, arg) { return this.page.evaluate(fn, arg); }
  cuadro() { return this.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))); }
  esperar(ms) { return this.page.waitForTimeout(ms); }

  /** Clic real (ratón) sobre la celda r,c del tbody de la tabla id. */
  async clic(id, r, c, { mods = [], en = 'td' } = {}) {
    const h = await this.page.evaluateHandle(({ id, r, c, en }) => {
      const td = window.__ct.td(id, r, c);
      if (!td) return null;
      if (en === 'selector') return td.querySelector('.EdiTable-Selector') || td;
      if (en === 'checkbox') return td.querySelector('input[type=checkbox]') || td;
      return td;
    }, { id, r, c, en });
    const el = h.asElement();
    if (!el) throw new Falla(`no existe la celda (${r},${c}) en #${id}`);
    await el.click({ modifiers: mods, force: true });
    await this.esperar(30);
  }

  /** Clic sobre el th número c (o con field=c si es texto). */
  async clicTh(id, c, { boton = 'left', mods = [] } = {}) {
    const h = await this.page.evaluateHandle(({ id, c }) => (typeof c === 'string' ? window.__ct.thPorCampo(id, c) : window.__ct.th(id, c)), { id, c });
    const el = h.asElement();
    if (!el) throw new Falla(`no existe el encabezado ${c} en #${id}`);
    const box = await el.boundingBox();
    // al centro-izquierda, lejos del borde de cambio de ancho
    await this.page.mouse.click(box.x + Math.min(10, box.width / 3), box.y + box.height / 2, { button: boton, modifiers: mods });
    await this.esperar(30);
  }

  /** Pone el foco (CellFocus) en la celda r,c. */
  async foco(id, r, c) {
    await this.ev(({ id, r, c }) => { const t = document.getElementById(id); t.CellFocus(window.__ct.td(id, r, c)); }, { id, r, c });
    await this.esperar(10);
  }

  async tecla(k, n = 1) { for (let i = 0; i < n; i++) { await this.page.keyboard.press(k); await this.esperar(25); } }
  async escribir(txt) { await this.page.keyboard.type(txt, { delay: 5 }); await this.esperar(25); }

  log() { return this.ev(() => window.__ct.log); }
  limpiarLog() { return this.ev(() => window.__ct.limpiar()); }
  datos(id = 't1') { return this.ev((id) => window.__ct.datos(id), id); }
  textos(id, c) { return this.ev(({ id, c }) => window.__ct.textos(id, c), { id, c }); }
  features() { return this.ev(() => window.__ct.features()); }

  // ---------- aserciones ----------
  ok(cond, msg = 'se esperaba verdadero') { if (!cond) throw new Falla(msg); }
  igual(real, esperado, msg = '') {
    if (!igualProfundo(real, esperado)) throw new Falla(`${msg ? msg + ': ' : ''}se esperaba ${corto(esperado)} y se obtuvo ${corto(real)}`);
  }
  distinto(real, noEsperado, msg = '') {
    if (igualProfundo(real, noEsperado)) throw new Falla(`${msg ? msg + ': ' : ''}no se esperaba ${corto(noEsperado)}`);
  }
  cerca(real, esperado, tol = 1e-9, msg = '') {
    if (typeof real !== 'number' || Number.isNaN(real) || !(Math.abs(real - esperado) <= tol)) throw new Falla(`${msg ? msg + ': ' : ''}se esperaba ≈${esperado} y se obtuvo ${corto(real)}`);
  }
  contiene(lista, x, msg = '') {
    const ok = typeof lista === 'string' ? lista.includes(x) : Array.isArray(lista) && lista.some(v => igualProfundo(v, x));
    if (!ok) throw new Falla(`${msg ? msg + ': ' : ''}${corto(lista)} no contiene ${corto(x)}`);
  }
  noContiene(lista, x, msg = '') {
    const ok = typeof lista === 'string' ? !lista.includes(x) : !(Array.isArray(lista) && lista.some(v => igualProfundo(v, x)));
    if (!ok) throw new Falla(`${msg ? msg + ': ' : ''}${corto(lista)} contiene ${corto(x)}`);
  }
  tipo(v, t, msg = '') { if (typeof v !== t) throw new Falla(`${msg ? msg + ': ' : ''}se esperaba tipo ${t} y es ${typeof v} (${corto(v)})`); }
  pendiente(motivo) { throw new Pendiente(motivo); }
  nota(t) { this.notas.push(t); }
  /** Falla si hubo errores de JavaScript en la página. */
  sinErrores(msg = 'errores en la página') {
    if (this.erroresPagina.length) throw new Falla(`${msg}: ${corto(this.erroresPagina)}`);
  }
}

/** Clasifica una excepción: 'falla' (comportamiento) o 'error' (del arnés). */
export function clasificar(e) {
  if (e instanceof Falla) return 'falla';
  if (e instanceof Pendiente) return 'pendiente';
  const m = String(e && e.message || e);
  // Lo que falla dentro de la página (método inexistente, excepción del componente, tiempo agotado) es una falla de conformidad.
  if (/page\.evaluate|evaluateHandle|elementHandle|locator\.|page\.waitFor|Timeout|Execution context|Target page|keyboard\.|mouse\./i.test(m)) return 'falla';
  return 'error';
}
