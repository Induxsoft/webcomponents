/* Batería de conformidad de EdiTable: código que corre DENTRO de la página, antes que cualquier script de ella.
 *
 * SOLO PARA PRUEBAS. Lo que cambia respecto a un navegador normal:
 *  1. Element.prototype.attachShadow fuerza mode:'open' (para leer el shadow DOM con el.shadowRoot).
 *     No cambia nada más: devuelve el mismo ShadowRoot que el componente guarda en this._shadow.
 *  2. Math.random sembrado, para que los uuid que genera el componente se repitan entre corridas.
 *  3. Contadores informativos de setInterval/clearInterval y de listeners en window/document
 *     (para las pruebas de C11). No alteran el comportamiento.
 *  4. window.__ct: utilidades para las pruebas (registro de eventos, acceso a celdas, serialización).
 */
(() => {
  'use strict';

  // 1. Shadow DOM abierto
  const origAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (opts) {
    return origAttach.call(this, Object.assign({}, opts || {}, { mode: 'open' }));
  };

  // 2. Aleatorio sembrado (mulberry32)
  let seed = 20261101;
  Math.random = function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // 3. Contadores
  const intervalos = new Set();
  const oSetInterval = window.setInterval.bind(window);
  const oClearInterval = window.clearInterval.bind(window);
  window.setInterval = function (fn, ms, ...rest) { const id = oSetInterval(fn, ms, ...rest); intervalos.add(id); return id; };
  window.clearInterval = function (id) { intervalos.delete(id); return oClearInterval(id); };

  const activos = {};               // 'window:beforeprint' -> número de listeners vivos
  const oAdd = EventTarget.prototype.addEventListener;
  const oRemove = EventTarget.prototype.removeEventListener;
  const llave = (t, type) => (t === window ? 'window:' : t === document ? 'document:' : null) + type;
  const vistos = new WeakMap();     // target -> Set de 'type|fn' para no contar duplicados (el navegador tampoco los duplica)
  EventTarget.prototype.addEventListener = function (type, fn, opt) {
    if (this === window || this === document) {
      const k = llave(this, type);
      let s = vistos.get(this); if (!s) vistos.set(this, (s = new Map()));
      const cap = !!(opt === true || (opt && opt.capture));
      const id = type + '|' + cap;
      let fns = s.get(id); if (!fns) s.set(id, (fns = new Set()));
      if (fn && !fns.has(fn)) { fns.add(fn); activos[k] = (activos[k] || 0) + 1; }
    }
    return oAdd.call(this, type, fn, opt);
  };
  EventTarget.prototype.removeEventListener = function (type, fn, opt) {
    if (this === window || this === document) {
      const k = llave(this, type);
      const s = vistos.get(this);
      const cap = !!(opt === true || (opt && opt.capture));
      const fns = s && s.get(type + '|' + cap);
      if (fns && fns.has(fn)) { fns.delete(fn); activos[k] = (activos[k] || 1) - 1; }
    }
    return oRemove.call(this, type, fn, opt);
  };

  // 4. Utilidades
  const esElemento = (v) => v && typeof v === 'object' && typeof v.nodeType === 'number';
  function describirNodo(n) {
    if (!esElemento(n)) return null;
    const d = { $el: n.nodeName.toLowerCase() };
    const td = n.closest ? n.closest('td,th') : null;
    if (td) {
      const tr = td.parentElement;
      d.c = td.cellIndex;
      if (tr && tr.parentElement) d.r = Array.prototype.indexOf.call(tr.parentElement.children, tr);
      if (td !== n) d.dentroDe = td.nodeName.toLowerCase();
    } else if (n.nodeName === 'TR' && n.parentElement) {
      d.r = Array.prototype.indexOf.call(n.parentElement.children, n);
    }
    return d;
  }
  function resumir(v, prof = 0) {
    if (v === null || v === undefined) return v === null ? null : '$undefined';
    if (typeof v === 'function') return '$fn';
    if (typeof v !== 'object') return v;
    if (esElemento(v)) return describirNodo(v);
    if (v instanceof Event) return { $evento: v.type };
    if (prof >= 2) return Array.isArray(v) ? '$arreglo(' + v.length + ')' : '$objeto';
    if (Array.isArray(v)) return v.map(x => resumir(x, prof + 1));
    const o = {};
    for (const k of Object.keys(v)) {
      if (k === 'sender') { o.sender = '$sender'; continue; }
      if (k === 'coldef' && v[k] && typeof v[k] === 'object') { o.coldef = { field: v[k].field, type: v[k].type, sort: v[k].sort }; continue; }
      o[k] = resumir(v[k], prof + 1);
    }
    return o;
  }

  const ct = {
    log: [],
    errores: [],
    activos,
    intervalosActivos: () => intervalos.size,
    t: (id) => document.getElementById(id),
    sr: (id) => { const el = document.getElementById(id); return el && (el.shadowRoot || el._shadow); },
    filas: (id) => { const s = ct.sr(id); return s ? Array.from(s.querySelectorAll('tbody > tr')) : []; },
    td: (id, r, c) => { const tr = ct.filas(id)[r]; return tr ? tr.cells[c] : null; },
    th: (id, c) => { const s = ct.sr(id); return s ? s.querySelectorAll('thead > tr > th')[c] : null; },
    thPorCampo: (id, f) => { const s = ct.sr(id); return s ? s.querySelector('thead th[field="' + f + '"]') : null; },
    texto: (id, r, c) => { const td = ct.td(id, r, c); if (!td) return null; const cc = td.querySelector('div[iscellcontent]'); return (cc || td).textContent; },
    textos: (id, c) => ct.filas(id).map((tr) => { const td = tr.cells[c]; const cc = td && td.querySelector('div[iscellcontent]'); return td ? (cc || td).textContent : null; }),
    features: () => { try { return (typeof EditTable !== 'undefined' && Array.isArray(EditTable.features)) ? EditTable.features.slice() : []; } catch (e) { return []; } },
    version: () => { try { return (typeof EditTable !== 'undefined' && EditTable.version) ? String(EditTable.version) : null; } catch (e) { return null; } },
    resumir,
    /** Registra en ct.log los eventos de EdiTable de la tabla (todos los de Const.Events, salvo badgeclick si no se pide).
     *  Si ya hay un manejador, lo envuelve: primero registra y después llama al manejador original. */
    grabar(el, nombres, opciones = {}) {
      if (typeof el === 'string') el = document.getElementById(el);
      const todos = Object.values(el.EdiTable.Const.Events);
      const lista = (nombres && nombres.length) ? nombres.map(n => String(n).toLowerCase()) : todos.filter(n => n !== 'badgeclick');
      lista.forEach((n) => {
        const previo = el.Events[n];
        el.Events[n] = function (a) {
          ct.log.push({ tabla: el.id, ev: n, a: resumir(a) });
          if (opciones.alRegistrar && opciones.alRegistrar[n]) opciones.alRegistrar[n](a);
          if (typeof previo === 'function') return previo.apply(this, arguments);
        };
      });
      return lista;
    },
    nombresLog: () => ct.log.map(x => x.ev),
    limpiar: () => { ct.log.length = 0; },
    /** Serializa el shadow DOM sin cambiarlo (para comparar contra la referencia). */
    serial(id) {
      const s = ct.sr(id);
      if (!s) return null;
      return Array.from(s.childNodes).map(n => n.nodeType === 1 ? n.outerHTML : (n.nodeType === 3 ? n.textContent : '')).join('');
    },
    datos: (id) => JSON.parse(JSON.stringify(document.getElementById(id).DataArray)),
    espera: (ms) => new Promise(r => setTimeout(r, ms)),
    cuadro: () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))),
    /** sha256 en hexadecimal (minúsculas) con WebCrypto. */
    async sha256(txt) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
    },
    /** Lee todo lo que haya en IndexedDB induxsoft-edittable/layouts: [{key, value}] o null si no existe. */
    leerLayouts() {
      return new Promise((res) => {
        let req;
        try { req = indexedDB.open('induxsoft-edittable'); } catch (e) { res(null); return; }
        req.onupgradeneeded = () => { /* no existía: no crear nada */ try { req.transaction.abort(); } catch (e) {} };
        req.onerror = () => res(null);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('layouts')) { db.close(); res([]); return; }
          const tx = db.transaction('layouts', 'readonly');
          const st = tx.objectStore('layouts');
          const out = [];
          const cur = st.openCursor();
          cur.onsuccess = () => {
            const c = cur.result;
            if (c) { out.push({ key: c.key, value: c.value }); c.continue(); }
            else { db.close(); res(out); }
          };
          cur.onerror = () => { db.close(); res(out); };
        };
      });
    }
  };
  window.__ct = ct;
  window.addEventListener('error', (e) => ct.errores.push(String(e.message || e)));
})();
