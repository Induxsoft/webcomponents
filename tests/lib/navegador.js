/* Banco de regresión de EdiTable: código que corre DENTRO de la página, antes que cualquier script de la página.
 *
 * SOLO PARA PRUEBAS. Lo que cambia respecto a un navegador normal:
 *  1. Math.random sembrado (mulberry32), para que los uuid y lo aleatorio se repitan entre corridas.
 *  2. Element.prototype.attachShadow fuerza mode:'open' para poder leer el shadow DOM desde fuera.
 *     No cambia nada más: devuelve el mismo ShadowRoot que el componente guarda en this._shadow.
 *  3. Para observar sin alterar: se cuentan los addEventListener (internos, solo informativo) y, cuando el
 *     componente abre su shadow (es lo primero que hace en su DOMContentLoaded), se instalan:
 *     - un Proxy sobre el objeto Events que registra cada evento disparado (con sus eventArgs serializados);
 *       en modo 'all' además responde con un registrador en los eventos que el consumidor no atiende;
 *     - accesores sobre onTdPaint, onRowPaint, onCardPaint, ButtonOnClick y BadgeOnClick que registran cada
 *       llamada si el consumidor puso una función (si no, siguen en null: no se cambia el comportamiento).
 *  4. window.__etSnap() toma la foto (DOM del shadow y del light, datos, columnas, propiedades, estilos
 *     calculados, eventos y callbacks desde la foto anterior).
 * La configuración llega en window.__ET_CFG (la pone run.mjs en un script anterior).
 */
(() => {
  'use strict';
  const CFG = window.__ET_CFG || {};

  // ---------- 1. Aleatorio sembrado ----------
  let seed = (CFG.seed >>> 0) || 20261101;
  Math.random = function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // ---------- 2. Cuadros reales (el reloj de Playwright simula requestAnimationFrame) ----------
  const realRAF = window.requestAnimationFrame.bind(window);
  window.__etFlush = () => new Promise(res => realRAF(() => realRAF(() => res(true))));

  // ---------- 3. Conteo de listeners (informativo) ----------
  const counts = {};
  const kind = (t) => (t === window ? 'window' : t === document ? 'document' : (t && t.nodeType ? 'nodo' : 'otro'));
  const origAdd = EventTarget.prototype.addEventListener;
  const origRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opt) {
    const k = kind(this) + ':' + type;
    counts[k] = (counts[k] || 0) + 1;
    return origAdd.call(this, type, fn, opt);
  };
  EventTarget.prototype.removeEventListener = function (type, fn, opt) {
    const k = kind(this) + ':' + type + ':remove';
    counts[k] = (counts[k] || 0) + 1;
    return origRemove.call(this, type, fn, opt);
  };
  window.__etCounts = counts;

  // ---------- Registro ----------
  const LOG = { eventos: [], callbacks: [], cbTruncados: 0 };
  window.__etLog = LOG;
  const MAX_CB = CFG.maxCallbacks ?? 3000;

  const realAttrs = Object.getOwnPropertyDescriptor(Element.prototype, 'attributes').get;

  function descNode(n) {
    if (!n) return null;
    if (n.nodeType === 3) return '#text ' + JSON.stringify(n.data.slice(0, 40));
    if (n.nodeType === 11) return '#shadow-root';
    if (n.nodeType !== 1) return '#nodo' + n.nodeType;
    const segs = [];
    let e = n;
    while (e && e.nodeType === 1) {
      let s = e.localName;
      const id = e.getAttribute('id');
      if (id) s += '#' + id;
      if (['tr', 'td', 'th'].includes(e.localName) && e.parentElement) {
        const sib = Array.prototype.filter.call(e.parentElement.children, x => x.localName === e.localName);
        s += '[' + sib.indexOf(e) + ']';
      }
      segs.unshift(s);
      const p = e.parentNode;
      if (p && p.nodeType === 11) { segs.unshift('shadow(' + (p.host?.id || p.host?.localName || '?') + ')'); break; }
      if (!p) { segs.unshift('(desconectado)'); break; }
      if (p === document) break;
      e = p;
      if (e === document.body) { segs.unshift('body'); break; }
    }
    const out = { ruta: segs.join('>') };
    if (['td', 'th'].includes(n.localName)) out.texto = (n.textContent || '').slice(0, 60);
    if (['input', 'textarea', 'select'].includes(n.localName)) {
      out.valor = n.value;
      if (n.type === 'checkbox') out.checked = n.checked;
    }
    return out;
  }

  function isSender(v) {
    return v && typeof v === 'object' && !(v instanceof Node) && ('EdiTable' in v) && ('DataArray' in v) && ('tableId' in v || 'Columns' in v);
  }

  function ser(v, d = 0) {
    if (v === undefined) return '[undefined]';
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') return Number.isFinite(v) ? v : '[' + String(v) + ']';
    if (typeof v === 'string') return v;
    if (typeof v === 'function') return '[fn]';
    if (typeof v === 'symbol' || typeof v === 'bigint') return '[' + String(v) + ']';
    if (typeof Event !== 'undefined' && v instanceof Event) return { $evento: v.type };
    if (v instanceof Node) return { $nodo: descNode(v) };
    if (isSender(v)) return { $sender: (v.tableId ?? null), esElemento: (v instanceof HTMLElement) };
    if (v === window) return '[window]';
    if (d > 6) return '[profundidad]';
    if (Array.isArray(v)) return v.map(x => ser(x, d + 1));
    if (v instanceof Map) return { $map: Array.from(v.entries()).map(([k, x]) => [ser(k, d + 1), ser(x, d + 1)]) };
    if (v instanceof Set) return { $set: Array.from(v).map(x => ser(x, d + 1)) };
    if (v instanceof Date) return { $fecha: isNaN(v) ? 'invalida' : v.toISOString() };
    const o = {};
    for (const k of Object.keys(v)) o[k] = ser(v[k], d + 1);
    return o;
  }
  window.__etSer = ser;

  // ---------- Registro de eventos: Proxy sobre Events ----------
  function wrapEvents(host, obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj.__etIsProxy) return obj;
    const known = new Set(Object.values(host.EdiTable?.Const?.Events ?? {}));
    const cache = new Map();
    const mode = host.__etRecord || CFG.record || 'all';
    return new Proxy(obj, {
      get(t, k) {
        if (k === '__etIsProxy') return true;
        if (k === '__etTarget') return t;
        const v = Reflect.get(t, k);
        if (typeof k !== 'string' || !known.has(k)) return v;
        if (typeof v !== 'function' && mode !== 'all') return v;
        const key = (typeof v === 'function') ? v : null;
        if (!cache.has(k)) cache.set(k, new Map());
        const ck = cache.get(k);
        let w = ck.get(key);
        if (!w) {
          w = function (args) {
            const entry = { evento: k, tabla: host.id || null, consumidor: (typeof v === 'function') };
            if (arguments.length) entry.args = ser(args);
            const before = (args && typeof args === 'object') ? { cancel: args.cancel, text: args.text } : null;
            LOG.eventos.push(entry);
            let ret;
            if (typeof v === 'function') {
              try { ret = v.apply(this, arguments); }
              finally {
                if (before) {
                  if (args.cancel !== before.cancel) entry.cancelDespues = ser(args.cancel);
                  if (args.text !== before.text) entry.textDespues = ser(args.text);
                }
              }
            }
            return ret;
          };
          ck.set(key, w);
        }
        return w;
      }
    });
  }

  const CALLBACKS = ['onTdPaint', 'onRowPaint', 'onCardPaint', 'ButtonOnClick', 'BadgeOnClick'];

  function wrapCallback(host, name, fn) {
    if (typeof fn !== 'function') return fn;
    if (fn.__etWrapped) return fn;
    const w = function () {
      if (LOG.callbacks.length < MAX_CB) {
        LOG.callbacks.push({ callback: name, tabla: host.id || null, args: Array.from(arguments).map(a => ser(a)) });
      } else LOG.cbTruncados++;
      return fn.apply(this, arguments);
    };
    w.__etWrapped = true;
    w.__etOriginal = fn;
    return w;
  }

  function hook(host, requestedMode) {
    if (host.__etHooked) return;
    host.__etHooked = true;
    host.__etShadowMode = requestedMode;
    let evStore = wrapEvents(host, host.Events);
    Object.defineProperty(host, 'Events', {
      configurable: true, enumerable: true,
      get() { return evStore; },
      set(v) { evStore = wrapEvents(host, v); host.__etEventsReemplazado = (host.__etEventsReemplazado || 0) + 1; }
    });
    CALLBACKS.forEach(name => {
      let store = wrapCallback(host, name, host[name]);
      Object.defineProperty(host, name, {
        configurable: true, enumerable: true,
        get() { return store; },
        set(v) { store = wrapCallback(host, name, v); }
      });
    });
  }
  window.__etHook = hook;

  // ---------- 2. attachShadow abierto (solo pruebas) ----------
  const origAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const requested = init && init.mode;
    const root = origAttach.call(this, Object.assign({}, init, { mode: 'open' }));
    if (this.localName === 'edit-table') { try { hook(this, requested); } catch (e) { console.warn('[banco] hook: ' + e.message); } }
    return root;
  };

  // ---------- 4. Foto ----------
  function serAttrs(el) {
    const map = realAttrs.call(el);
    let s = '';
    for (let i = 0; i < map.length; i++) s += ' ' + map[i].name + '=' + JSON.stringify(map[i].value);
    return s;
  }

  function serNode(n, depth, out, ctx) {
    const ind = ' '.repeat(depth);
    if (n.nodeType === 3) { out.push(ind + JSON.stringify(n.data)); return; }
    if (n.nodeType === 8) { out.push(ind + '<!--' + JSON.stringify(n.data) + '-->'); return; }
    if (n.nodeType === 11) { n.childNodes.forEach(c => serNode(c, depth, out, ctx)); return; }
    if (n.nodeType !== 1) return;
    const tag = n.localName;
    let line = ind + '<' + tag + serAttrs(n);
    const props = [];
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      props.push('value=' + JSON.stringify(n.value));
      if (n.type === 'checkbox' || n.type === 'radio') props.push('checked=' + n.checked);
      if (tag === 'select') props.push('selectedIndex=' + n.selectedIndex);
    }
    if (ctx.focus.includes(n)) props.push('foco');
    if (props.length) line += ' {' + props.join(' ') + '}';
    line += '>';
    if (tag === 'style') {
      out.push(line);
      out.push(ind + ' @@ESTILO ' + ctx.styles.length);
      ctx.styles.push(n.textContent);
      out.push(ind + '</style>');
      return;
    }
    if (tag === 'edit-table' && ctx.hosts) {
      out.push(line);
      const idx = ctx.hosts.indexOf(n);
      out.push(ind + ' #shadow-root -> tablas[' + idx + ']' + (n.shadowRoot ? '' : ' (sin shadow)'));
      n.childNodes.forEach(c => serNode(c, depth + 1, out, ctx));
      out.push(ind + '</' + tag + '>');
      return;
    }
    if (!n.childNodes.length) { out.push(line + '</' + tag + '>'); return; }
    out.push(line);
    n.childNodes.forEach(c => serNode(c, depth + 1, out, ctx));
    out.push(ind + '</' + tag + '>');
  }

  const CSSPROPS = ['display', 'position', 'width', 'height', 'color', 'background-color', 'font-weight', 'text-align', 'visibility', 'overflow-x', 'overflow-y'];
  function cstyle(el) {
    if (!el || !el.isConnected) return null;
    const cs = getComputedStyle(el);
    return CSSPROPS.map(p => {
      let v = cs.getPropertyValue(p);
      if ((p === 'width' || p === 'height') && /px$/.test(v)) v = Math.round(parseFloat(v)) + 'px';
      return p + ':' + v;
    }).join(';');
  }

  const PROPS = ['IsDirty', 'Editing', 'ReadOnly', 'AutoAddRow', 'AutoDelRow', 'EverMove', 'PagOffSet', 'TheadRowIndex',
    'ColumnsDefaultType', 'ShowAsTree', 'CanMoveRow', 'Key', 'ParentKey', 'Childs', 'TreeOptions', 'sorTable', '_sorTable',
    'htmlEncode', 'autoConfirm', 'hiddeSelector', 'hiddeRowSelector', 'minRowHeight', 'maxRowHeight', 'rowHeight',
    'cardsResponsive', 'editableResponsive', 'tableId', 'NumFormat', 'CSS', 'hideColumns', '_expandOnStart',
    'KeepSelectionVisible', 'CardsMode', 'CardsLayout', 'CardsBreakpoint', 'CardsBreakpointTarget', 'IsCardView',
    '_count_isdirty', '_current_row', 'attributes', 'BadgesField', 'BadgeTooltip', 'BadgeSelectsRow', 'NativeEvents',
    'TemplateEncode', 'Locale', 'RowClassField', '_TreeValueIndent', '_TreeUnitIndent', 'temp_html'];
  const CALLS = ['CurrentRowIndex', 'CurrentColIndex', 'TRCount', 'THCount', 'ColumnsCount'];

  function safe(fn) {
    try { return ser(fn()); } catch (e) { return '!error: ' + (e && e.message); }
  }

  function snapTable(host, i, opts) {
    const t = { indice: i, id: host.id || null, inicializada: !!host._shadow, modoShadowPedido: host.__etShadowMode ?? null,
      controlStyles: Element.prototype.getAttribute.call(host, 'control-styles') };
    const ctx = { styles: [], focus: [document.activeElement, host.shadowRoot?.activeElement].filter(Boolean) };
    if (host.shadowRoot) {
      const out = [];
      serNode(host.shadowRoot, 0, out, ctx);
      t.dom = out;
      t.estilosTexto = ctx.styles;
      t.shadowEsElGuardado = (host._shadow === host.shadowRoot);
    } else t.dom = null;
    t.datos = safe(() => host.DataArray);
    t.columnas = safe(() => host.Columns);
    t.respaldo = safe(() => host._dataArrayBackup);
    const p = {};
    PROPS.forEach(k => { p[k] = safe(() => host[k]); });
    CALLS.forEach(k => { p[k + '()'] = safe(() => host[k]()); });
    p['CurrentTd()'] = safe(() => host.CurrentTd());
    p['focusedTable==_getCurren()'] = safe(() => host.EdiTable.focusedTable === host._current && host._current != null);
    p['Events reemplazado'] = host.__etEventsReemplazado || 0;
    p['Events claves'] = safe(() => Object.keys(host.Events.__etTarget ?? host.Events).sort());
    const box = host._table?.parentElement;
    p.scroll = safe(() => ({ contenedor: box ? [Math.round(box.scrollTop), Math.round(box.scrollLeft)] : null }));
    t.props = p;
    if (opts.estilos !== false && host.shadowRoot && host._table) {
      const tb = host._table;
      const c = { host: cstyle(host), contenedor: cstyle(tb.parentElement), table: cstyle(tb), thead: cstyle(tb.tHead) };
      const head = tb.tHead ? tb.tHead.rows[host.TheadRowIndex || 0] : null;
      if (head) c.th = Array.from(head.cells).map(cstyle);
      const body = tb.tBodies[0];
      if (body) {
        const rows = Array.from(body.rows);
        const pick = new Set([0, 1, 2, rows.length - 1].filter(x => x >= 0 && x < rows.length));
        rows.forEach((r, ri) => { if (r.classList.contains(host.CSS?.RowSelected || 'EdiTable-Row-Selected')) pick.add(ri); });
        c.filas = Array.from(pick).sort((a, b) => a - b).map(ri => ({ fila: ri, tr: cstyle(rows[ri]), td: Array.from(rows[ri].cells).map(cstyle) }));
      }
      const sel = host.shadowRoot.querySelector('#__table_selector');
      if (sel) c.selector = cstyle(sel);
      const inp = host.shadowRoot.querySelector('#__table_input');
      if (inp) c.input = cstyle(inp);
      t.estilos = c;
    }
    return t;
  }

  window.__etSnap = (opts = {}) => {
    const hosts = Array.from(document.querySelectorAll('edit-table'));
    const tablas = hosts.map((h, i) => snapTable(h, i, opts));
    const ctx = { styles: [], focus: [document.activeElement].filter(Boolean), hosts };
    const luz = [];
    const root = opts.raiz ? document.querySelector(opts.raiz) : document.body;
    if (root) serNode(root, 0, luz, ctx);
    const ae = document.activeElement;
    const foco = { documento: ae ? descNode(ae) : null, shadow: (ae && ae.shadowRoot && ae.shadowRoot.activeElement) ? descNode(ae.shadowRoot.activeElement) : null };
    const eventos = LOG.eventos.splice(0);
    const callbacks = LOG.callbacks.splice(0);
    const trunc = LOG.cbTruncados; LOG.cbTruncados = 0;
    const extra = {};
    if (typeof window.__etExtra === 'function') { try { extra.valor = ser(window.__etExtra()); } catch (e) { extra.error = e.message; } }
    return {
      tablas, luz, luzEstilos: ctx.styles, foco, eventos, callbacks, callbacksTruncados: trunc,
      extra: ('valor' in extra || 'error' in extra) ? extra : undefined,
      internos: { listeners: Object.assign({}, counts), intervalos: window.__etIntervals ?? null }
    };
  };

  // Utilidades para los escenarios
  window.ET = (id) => (id ? document.querySelector('edit-table#' + CSS.escape(id)) : document.querySelector('edit-table'));
  window.ETs = (id) => window.ET(id)?.shadowRoot;
})();
