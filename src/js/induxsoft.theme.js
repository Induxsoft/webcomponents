/*!
 * induxsoft.theme.js: tema común de los web components de Induxsoft (EdiTable, InputKey y los que vengan).
 *
 * window.InduxsoftTheme (singleton, sin dependencias). Spec: /home/claude/mapa/induxsoft-theme-spec.md
 * - Registro de temas: themes, theme(nombre), define(nombre, paleta, {base}).
 * - Resolución: resolve(elemento) -> { theme, palette, density, effective, scheme }, desde el ancestro más cercano con
 *   data-et-theme / data-et-palette / data-et-density (cada uno por separado), cruzando shadow DOM y los iframes del
 *   mismo origen; si no hay tema, lo recordado con remember (localStorage 'induxsoft.theme').
 * - Cambio: set(nombre, {on, remember}), setPalette(obj, {on, merge}), setDensity(d, {on}); on = <html> por omisión.
 * - Aviso: subscribe(elemento, callback) / unsubscribe(elemento, callback), un solo MutationObserver y un matchMedia;
 *   evento 'themechange' en document.
 *
 * Este archivo se copia tal cual dentro de induxsoft.controls.editable.js e induxsoft.controls.js, entre los
 * marcadores induxsoft-theme (tests/tools/embed-theme.mjs). Se edita solo aquí.
 */
(function ()
{
    'use strict';
    var VERSION = '1.0.0';
    if (typeof window === 'undefined') return;
    var w = window;

    function comparar(a, b)
    {
        var x = String(a || '0').split(/[.-]/), y = String(b || '0').split(/[.-]/);
        for (var i = 0; i < 3; i++)
        {
            var p = parseInt(x[i], 10) || 0, q = parseInt(y[i], 10) || 0;
            if (p !== q) return p < q ? -1 : 1;
        }
        return 0;
    }
    var previo = w.InduxsoftTheme;
    if (previo && typeof previo === 'object' && comparar(previo.version, VERSION) >= 0) return;

    var ATTR = { theme: 'data-et-theme', palette: 'data-et-palette', density: 'data-et-density' };
    var ATTRS = [ATTR.theme, ATTR.palette, ATTR.density];
    var CLAVE = 'induxsoft.theme';

    // ---------------------------------------------------------------- registro de temas
    // Derivadas: si un tema no las da, toman la de su padre (mismo mapa que EditTable F8b).
    var PADRES = {
        'header-border': 'border', 'header-pad-y': 'cell-pad-y', 'footer-bg': 'header-bg', 'footer-fg': 'header-fg',
        'menu-bg': 'bg', 'menu-fg': 'fg', 'menu-border': 'border', 'menu-hover-bg': 'hover-bg',
        'panel-bg': 'header-bg', 'panel-border': 'border', 'chip-bg': 'bg', 'chip-border': 'input-border',
        'card-border': 'border', 'group-bg': 'header-bg', 'group-hover-bg': 'hover-bg',
        'fixed-bg': 'bg', 'fixed-head-bg': 'header-bg', 'fixed-hover-bg': 'hover-bg', 'badge-bg': 'muted-fg',
        'checked-bg': 'sel-bg-soft'
    };
    // Temas predeterminados (los de EditTable F8b, mismos valores). Claves sin '--et-'; 'color-scheme' no es variable.
    var EXPLICITOS = {
        claro: {
            'color-scheme': 'light',
            font: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 'font-size': '0.875rem',
            bg: '#FFFFFF', fg: '#1F2328', 'muted-fg': '#59636E',
            'header-bg': '#F3F5F8', 'header-fg': '#1F2328', 'header-border': '#D0D7DE', 'header-weight': '600',
            border: '#E1E5EA', 'row-alt-bg': '#F8FAFC', 'hover-bg': '#EDF2F8',
            'sel-bg': '#2F66CC', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#DCE7FA',
            'active-cell': '#0B3D91', 'active-bg': '#FFFFFF', 'active-fg': '#1F2328', 'active-border': '#FFFFFF',
            accent: '#2F66CC', 'focus-ring': '#2F66CC',
            'input-bg': '#FFFFFF', 'input-fg': '#1F2328', 'input-border': '#8C959F', 'input-disabled-bg': '#EEF1F4',
            'mark-bg': '#FFF1A8', 'mark-fg': '#1F2328', error: '#C62828', 'error-bg': '#FDECEC', warn: '#8A5A00', ok: '#1A7F37', 'neg-fg': '#C62828',
            'tooltip-bg': '#1F2328', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#6E7781', 'badge-color': '#FFFFFF',
            radius: '4px', 'chip-radius': '12px', 'badge-radius': '999px',
            'cell-pad-x': '6px', 'cell-pad-y': '4px', 'header-pad-x': '8px', 'row-height': '1.6rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.5rem', 'num-font': 'inherit'
        },
        oscuro: {
            'color-scheme': 'dark',
            font: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 'font-size': '0.875rem',
            bg: '#15181C', fg: '#E6EDF3', 'muted-fg': '#9DA7B3',
            'header-bg': '#1F242B', 'header-fg': '#E6EDF3', 'header-border': '#3A424C', 'header-weight': '600',
            border: '#2C333B', 'row-alt-bg': '#1A1E23', 'hover-bg': '#242B33',
            'sel-bg': '#2C5AA8', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#1E3352',
            'active-cell': '#8CC2FF', 'active-bg': '#0D1117', 'active-fg': '#E6EDF3', 'active-border': '#0D1117',
            accent: '#6CA8FF', 'focus-ring': '#8CC2FF',
            'input-bg': '#0D1117', 'input-fg': '#E6EDF3', 'input-border': '#5A6572', 'input-disabled-bg': '#1F242B',
            'mark-bg': '#6B5800', 'mark-fg': '#FFF6CC', error: '#FF8A80', 'error-bg': '#3D1F1F', warn: '#E3B341', ok: '#5FD07A', 'neg-fg': '#FF8A80',
            'tooltip-bg': '#E6EDF3', 'tooltip-fg': '#15181C', 'badge-bg': '#56606C', 'badge-color': '#FFFFFF',
            'select-arrow': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23C9D1D9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e\")",
            radius: '4px', 'chip-radius': '12px', 'badge-radius': '999px',
            'cell-pad-x': '6px', 'cell-pad-y': '4px', 'header-pad-x': '8px', 'row-height': '1.6rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.5rem', 'num-font': 'inherit'
        },
        // Inspirado en la bandeja de agentes de agent.induxsoft.net (ai_broadcast.css).
        jade: {
            'color-scheme': 'light',
            font: '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif', 'font-size': '0.875rem',
            bg: '#FFFFFF', fg: '#1A202C', 'muted-fg': '#5A6577',
            'header-bg': '#F4F6F9', 'header-fg': '#4A5568', 'header-border': '#E2E8F0', 'header-weight': '600',
            'header-transform': 'uppercase', 'header-spacing': '.04em', 'header-font-size': '0.72rem',
            border: '#E2E8F0', 'row-alt-bg': '#F8FAFB', 'hover-bg': '#EEF9F2',
            'sel-bg': '#D1FAE5', 'sel-fg': '#064E3B', 'sel-bg-soft': '#E6F7EE',
            'active-cell': '#128C4A', 'active-bg': '#FFFFFF', 'active-fg': '#1A202C', 'active-border': '#FFFFFF',
            accent: '#0F7A41', 'focus-ring': '#128C4A',
            'input-bg': '#FFFFFF', 'input-fg': '#1A202C', 'input-border': '#A0AEC0', 'input-disabled-bg': '#F4F6F9',
            'mark-bg': '#FDE68A', 'mark-fg': '#1A202C', error: '#C53030', 'error-bg': '#FFF5F5', warn: '#B45309', ok: '#0F7A41', 'neg-fg': '#C53030',
            'tooltip-bg': '#1A202C', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#667781', 'badge-color': '#FFFFFF',
            radius: '8px', 'chip-radius': '20px', 'badge-radius': '999px',
            'cell-pad-x': '12px', 'cell-pad-y': '7px', 'header-pad-x': '12px', 'header-pad-y': '8px', 'row-height': '2rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.6rem', 'num-font': 'inherit'
        },
        // Estilo «Libro mayor» de V12 (cuenta-maestra-dk2, recursos/libro-mayor.css).
        'libro-mayor': {
            'color-scheme': 'light',
            font: '"IBM Plex Sans", system-ui, sans-serif', 'font-size': '0.875rem',
            'num-font': '"IBM Plex Mono", ui-monospace, monospace',
            bg: '#FFFFFF', fg: '#1B1F24', 'muted-fg': '#5B6470',
            'header-bg': '#F3F4F6', 'header-fg': '#4E5661', 'header-border': '#D9DDE3', 'header-weight': '600',
            'header-transform': 'uppercase', 'header-spacing': '.04em', 'header-font-size': '0.75rem',
            border: '#E3E6EA', 'row-alt-bg': '#F8F9FA', 'hover-bg': '#EEF1F5',
            'sel-bg': '#1D4F91', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#E4ECF7',
            'active-cell': '#1B1F24', 'active-bg': '#FFFFFF', 'active-fg': '#1B1F24', 'active-border': '#FFFFFF',
            accent: '#1D4F91', 'focus-ring': '#1D4F91',
            'input-bg': '#FFFFFF', 'input-fg': '#1B1F24', 'input-border': '#9AA3AE', 'input-disabled-bg': '#F3F4F6',
            'mark-bg': '#FBEBD0', 'mark-fg': '#4A3200', error: '#A13A14', 'error-bg': '#FBE9E3', warn: '#6E4700', ok: '#1E6B3A', 'neg-fg': '#A13A14',
            'tooltip-bg': '#1B1F24', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#5B6470', 'badge-color': '#FFFFFF',
            radius: '0', 'chip-radius': '0', 'badge-radius': '0',
            'cell-pad-x': '10px', 'cell-pad-y': '5px', 'header-pad-x': '10px', 'header-pad-y': '6px', 'row-height': '1.8rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.6rem'
        }
    };
    var ALIAS = { light: 'claro', dark: 'oscuro', 'libro mayor': 'libro-mayor', 'libromayor': 'libro-mayor' };
    var DENSIDAD_ALIAS = { 'cómoda': 'comoda', compact: 'compacta', comfortable: 'comoda', compacto: 'compacta', comodo: 'comoda' };
    var RESUELTOS = {};
    var FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    function asignar(d) { for (var i = 1; i < arguments.length; i++) { var o = arguments[i]; if (o) for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) d[k] = o[k]; } return d; }
    function copia(o) { return o ? asignar({}, o) : null; }

    // Completa una paleta: lo explícito, después lo de la base y, para las derivadas, su padre.
    function completar(explicita, base)
    {
        var r = asignar({}, base || {}, explicita);
        for (var n in PADRES)
        {
            var p = PADRES[n];
            if (!(n in explicita) && ((p in explicita) || !(n in r)) && (p in r)) r[n] = r[p];
        }
        return r;
    }
    function normalizar(v)
    {
        var s = String(v == null ? '' : v).trim().toLowerCase();
        if (!s || s === 'none' || s === 'ninguno' || s === 'false') return '';
        return ALIAS[s] || s;
    }
    function normalizarDensidad(v)
    {
        var s = String(v == null ? '' : v).trim().toLowerCase();
        return DENSIDAD_ALIAS[s] || s;
    }
    // Valida una paleta: objeto o JSON; claves [a-z0-9-] (sin '--et-', se acepta camelCase); valores de texto o
    // número sin ; { } < >. Lo inválido se ignora con console.warn.
    function limpiar(p, donde)
    {
        donde = donde || 'palette';
        if (typeof p === 'string') { try { p = p.trim() ? JSON.parse(p) : {}; } catch (e) { console.warn('InduxsoftTheme: ' + donde + ': JSON inválido; se ignora.'); return {}; } }
        if (!p || typeof p !== 'object' || Array.isArray(p)) { if (p != null) console.warn('InduxsoftTheme: ' + donde + ': se esperaba un objeto; se ignora.'); return {}; }
        var r = {};
        for (var k0 in p)
        {
            if (!Object.prototype.hasOwnProperty.call(p, k0)) continue;
            var v = p[k0];
            var k = String(k0).trim().replace(/^--et-/, '').replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); });
            if (!/^[a-z0-9][a-z0-9-]*$/.test(k) || (typeof v !== 'string' && typeof v !== 'number') || /[;{}<>]/.test(String(v)) || String(v).trim() === '')
            { console.warn('InduxsoftTheme: ' + donde + ': se ignora ' + JSON.stringify(k) + '.'); continue; }
            r[k] = String(v).trim();
        }
        return r;
    }
    // Paleta resuelta (objeto interno, no copia). Si el nombre no está aquí, se busca en la ventana padre.
    function interno(nombre)
    {
        var n = normalizar(nombre);
        if (!n || n === 'auto') return null;
        if (!RESUELTOS[n] && EXPLICITOS[n]) RESUELTOS[n] = completar(EXPLICITOS[n], null);
        if (RESUELTOS[n]) return RESUELTOS[n];
        var pm = moduloPadre();
        if (pm && typeof pm.theme === 'function') { try { return pm.theme(n); } catch (e) { } }
        return null;
    }

    // ---------------------------------------------------------------- resolución
    function ventanaDe(nodo) { try { return (nodo.ownerDocument || nodo).defaultView || null; } catch (e) { return null; } }
    function marco(doc)
    {
        try { var v = doc.defaultView; return v && v.frameElement ? v.frameElement : null; } catch (e) { return null; }
    }
    function moduloPadre()
    {
        try { var f = w.frameElement; if (!f) return null; var pw = f.ownerDocument.defaultView; return pw && pw !== w ? pw.InduxsoftTheme || null : null; } catch (e) { return null; }
    }
    // Siguiente nodo hacia arriba: padre, host del shadow DOM o el <iframe> de la ventana padre (mismo origen).
    function arriba(n)
    {
        if (n.parentNode)
        {
            var p = n.parentNode;
            if (p.nodeType === 11 && p.host) return p.host;      // ShadowRoot
            if (p.nodeType === 9) return marco(p);                // Document: sigue en el <iframe>
            return p;
        }
        if (n.nodeType === 11 && n.host) return n.host;
        if (n.nodeType === 9) return marco(n);
        return null;
    }
    function leerRecordado()
    {
        try
        {
            var s = w.localStorage && w.localStorage.getItem(CLAVE);
            if (!s) return null;
            var o; try { o = JSON.parse(s); } catch (e) { o = { theme: s }; }
            return o && typeof o === 'object' ? o : (typeof o === 'string' ? { theme: o } : null);
        }
        catch (e) { return null; }
    }
    var mql = null, escuchando = false;
    function oscuroDelSistema() { try { return !!(mql && mql.matches); } catch (e) { return false; } }
    // El listener de prefers-color-scheme se pone solo cuando algo usa 'auto' (sin auto, el módulo no deja listeners).
    function escucharEsquema()
    {
        if (escuchando || !mql) return;
        escuchando = true;
        try { if (mql.addEventListener) mql.addEventListener('change', alCambiarEsquema); else if (mql.addListener) mql.addListener(alCambiarEsquema); } catch (e) { }
    }
    var cachePaleta = { txt: null, val: null };
    function paletaDe(txt)
    {
        if (txt == null || String(txt).trim() === '') return null;
        if (cachePaleta.txt === txt) return copia(cachePaleta.val);
        var p = limpiar(txt, ATTR.palette);
        cachePaleta = { txt: txt, val: p };
        return Object.keys(p).length ? copia(p) : null;
    }
    /**
     * resolve(elemento) -> { theme, palette, density, effective, scheme, source }
     * theme: nombre normalizado ('auto' incluido) o ''. palette: objeto limpio o null. density: normalizada o ''.
     * effective: el tema con 'auto' resuelto (claro/oscuro). scheme: 'light' | 'dark' | ''.
     * source: de dónde salió el tema: 'element' | 'frame' | 'storage' | '' (ninguno).
     */
    function resolve(el)
    {
        var enc = { theme: null, palette: null, density: null };
        var fuente = '';
        var d0 = null;
        var n = el || (w.document && w.document.documentElement);
        var guard = 0;
        while (n && guard++ < 10000)
        {
            if (n.nodeType === 1 && n.hasAttribute)
            {
                if (enc.theme === null && n.hasAttribute(ATTR.theme)) { enc.theme = n.getAttribute(ATTR.theme); fuente = (d0 && n.ownerDocument !== d0) ? 'frame' : 'element'; }
                if (enc.palette === null && n.hasAttribute(ATTR.palette)) enc.palette = n.getAttribute(ATTR.palette);
                if (enc.density === null && n.hasAttribute(ATTR.density)) enc.density = n.getAttribute(ATTR.density);
                if (!d0) d0 = n.ownerDocument;
                if (enc.theme !== null && enc.palette !== null && enc.density !== null) break;
            }
            n = arriba(n);
        }
        var tema = enc.theme;
        if (tema === null)
        {
            var r = leerRecordado();
            if (r && r.theme) { tema = String(r.theme); fuente = 'storage'; }
        }
        var t = normalizar(tema);
        if (t === 'auto') escucharEsquema();
        var ef = t === 'auto' ? (oscuroDelSistema() ? 'oscuro' : 'claro') : t;
        var pal = interno(ef);
        return {
            theme: t,
            palette: paletaDe(enc.palette),
            density: normalizarDensidad(enc.density),
            effective: ef,
            scheme: pal ? (pal['color-scheme'] || '') : '',
            source: t ? fuente : ''
        };
    }

    // ---------------------------------------------------------------- aviso de cambios
    var subs = new Map();          // elemento -> Map(callback -> último resultado en JSON)
    var observadas = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
    var OPC = { subtree: true, attributes: true, attributeFilter: ATTRS };
    var obs = null;
    function observar(raiz)
    {
        if (!obs || !raiz) return;
        if (observadas && observadas.has(raiz)) return;
        try { obs.observe(raiz, OPC); if (observadas) observadas.add(raiz); } catch (e) { }
    }
    // Observa cada shadow root entre el elemento y su documento (el observador del documento no los ve).
    function observarCadena(el)
    {
        var n = el, g = 0;
        while (n && g++ < 10000)
        {
            var r = n.getRootNode ? n.getRootNode() : null;
            if (!r || r.nodeType !== 11 || !r.host) break;
            observar(r);
            n = r.host;
        }
    }
    function debajo(el, objetivos)
    {
        var n = el, g = 0;
        while (n && g++ < 10000) { if (objetivos.has(n)) return true; n = arriba(n); }
        return false;
    }
    function avisar(el, mapa, motivo, forzar)
    {
        var res = resolve(el), txt = JSON.stringify(res);
        mapa.forEach(function (ultimo, cb)
        {
            if (!forzar && ultimo === txt) return;
            mapa.set(cb, txt);
            try { cb(res, { reason: motivo, element: el }); } catch (e) { setTimeout(function () { throw e; }); }
        });
    }
    function avisarTodos(motivo, forzar, filtro)
    {
        Array.from(subs.keys()).forEach(function (el)
        {
            var mapa = subs.get(el);
            if (mapa && (!filtro || filtro(el))) avisar(el, mapa, motivo, forzar);
        });
    }
    function disparar(motivo, detalle)
    {
        try { w.document.dispatchEvent(new CustomEvent('themechange', { detail: asignar({ reason: motivo }, detalle || {}) })); } catch (e) { }
    }
    function alMutar(registros)
    {
        var objetivos = new Set();
        registros.forEach(function (r) { if (r.target) objetivos.add(r.target); });
        if (!objetivos.size) return;
        avisarTodos('attribute', false, function (el) { return debajo(el, objetivos); });
        disparar('attribute', { targets: Array.from(objetivos).filter(function (x) { return ventanaDe(x) === w; }) });
    }
    function alCambiarEsquema()
    {
        avisarTodos('scheme', false, null);
        disparar('scheme', { dark: oscuroDelSistema() });
    }
    // iframes del mismo origen: el módulo de la ventana hija se suscribe a su <iframe> en la ventana padre. Si la
    // padre no tiene el módulo, el mismo observador mira el documento de la padre.
    var enPadre = null;
    function engancharPadre()
    {
        if (enPadre) return;
        var f = null; try { f = w.frameElement; } catch (e) { f = null; }
        if (!f) return;
        var pm = moduloPadre();
        var cb = function () { avisarTodos('frame', false, null); disparar('frame', {}); };
        if (pm && typeof pm.subscribe === 'function')
        {
            try { pm.subscribe(f, cb); enPadre = { modulo: pm, frame: f, cb: cb }; } catch (e) { }
        }
        else
        {
            try
            {
                var pd = f.ownerDocument; observar(pd); observarCadena(f);
                enPadre = { frame: f, doc: pd };
            }
            catch (e) { }
        }
        if (enPadre)
        {
            try { w.addEventListener('pagehide', function () { try { if (enPadre && enPadre.modulo) enPadre.modulo.unsubscribe(enPadre.frame, enPadre.cb); } catch (e) { } enPadre = null; }); } catch (e) { }
        }
    }
    function subscribe(el, cb)
    {
        if (!el || typeof cb !== 'function') return function () { };
        var mapa = subs.get(el);
        if (!mapa) { mapa = new Map(); subs.set(el, mapa); }
        mapa.set(cb, JSON.stringify(resolve(el)));
        observarCadena(el);
        engancharPadre();
        return function () { unsubscribe(el, cb); };
    }
    function unsubscribe(el, cb)
    {
        var mapa = subs.get(el);
        if (!mapa) return;
        if (cb) mapa.delete(cb); else mapa.clear();
        if (!mapa.size) subs.delete(el);
    }

    // ---------------------------------------------------------------- cambio
    function destino(o) { return (o && o.on) || (w.document && w.document.documentElement); }
    function recordar(o, nombre)
    {
        if (!o || o.remember === undefined) return;
        try
        {
            if (o.remember && nombre) w.localStorage.setItem(CLAVE, JSON.stringify({ theme: nombre }));
            else w.localStorage.removeItem(CLAVE);
        }
        catch (e) { }
    }
    /** set(nombre, {on, remember}): pone data-et-theme. null/undefined lo quita; '' corta la herencia. */
    function set(nombre, o)
    {
        var el = destino(o);
        if (!el) return;
        if (nombre == null) el.removeAttribute(ATTR.theme);
        else el.setAttribute(ATTR.theme, String(nombre));
        recordar(o, nombre == null ? '' : normalizar(nombre));
    }
    function get(on) { return resolve(on || (w.document && w.document.documentElement)).theme; }
    /** setPalette(obj, {on, merge}): data-et-palette (JSON). merge combina con la que ya tiene el elemento; null la quita. */
    function setPalette(obj, o)
    {
        var el = destino(o);
        if (!el) return null;
        if (obj == null) { el.removeAttribute(ATTR.palette); return null; }
        var nueva = limpiar(obj, 'setPalette');
        if (o && o.merge) nueva = asignar(paletaDe(el.getAttribute(ATTR.palette)) || {}, nueva);
        el.setAttribute(ATTR.palette, JSON.stringify(nueva));
        return copia(nueva);
    }
    /** setDensity(d, {on}): data-et-density. null lo quita; '' corta la herencia. */
    function setDensity(d, o)
    {
        var el = destino(o);
        if (!el) return;
        if (d == null) el.removeAttribute(ATTR.density);
        else el.setAttribute(ATTR.density, String(d));
    }
    function forget() { try { w.localStorage.removeItem(CLAVE); } catch (e) { } }

    /**
     * define(nombre, paleta, {base}): registra o reemplaza un tema. Lo que falta lo toma de base ('claro' por
     * omisión; null para ninguna). Se avisa a todos los suscriptores. Devuelve la paleta resuelta (copia).
     */
    function define(nombre, paleta, o)
    {
        var n = normalizar(nombre);
        if (!n || n === 'auto' || !/^[a-z0-9][a-z0-9_-]*$/.test(n)) throw new Error('InduxsoftTheme.define: nombre de tema inválido: ' + nombre);
        var l = limpiar(paleta, 'define');
        var b = (o && o.base === null) ? null : interno((o && o.base) || 'claro');
        EXPLICITOS[n] = l;
        RESUELTOS[n] = completar(l, b);
        avisarTodos('define', true, null);
        disparar('define', { theme: n });
        return copia(RESUELTOS[n]);
    }

    // ---------------------------------------------------------------- utilidades para los componentes
    /** cssVars(paleta, {prefix, important}) -> "--et-t-bg: #FFF; …" (sin color-scheme). */
    function cssVars(p, o)
    {
        if (!p) return '';
        var pre = (o && o.prefix != null) ? o.prefix : '--et-t-', imp = (o && o.important) ? ' !important' : '';
        var out = [];
        for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k) && k !== 'color-scheme') out.push(pre + k + ': ' + p[k] + imp + ';');
        return out.join(' ');
    }
    function fontStack(p) { return (p && p.font) || FONT_STACK; }

    var api = {
        version: VERSION,
        attributes: ATTRS.slice(),
        storageKey: CLAVE,
        parents: asignar({}, PADRES),
        get themes()
        {
            var o = {};
            for (var n in EXPLICITOS) o[n] = copia(interno(n));
            return o;
        },
        theme: function (nombre) { return copia(interno(nombre)); },
        has: function (nombre) { return !!interno(nombre); },
        define: define,
        normalize: normalizar,
        normalizeDensity: normalizarDensidad,
        parsePalette: limpiar,
        resolve: resolve,
        get: get,
        set: set,
        setPalette: setPalette,
        setDensity: setDensity,
        forget: forget,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        cssVars: cssVars,
        fontStack: fontStack,
        _interno: interno,
        _exportar: function () { return { explicitos: asignar({}, EXPLICITOS), resueltos: asignar({}, RESUELTOS), subs: subs }; },
        _detener: function () { try { if (obs) obs.disconnect(); } catch (e) { } try { if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', alCambiarEsquema); else if (mql.removeListener) mql.removeListener(alCambiarEsquema); } } catch (e) { } }
    };

    // Una versión anterior: se conservan sus temas registrados y sus suscriptores, y se apaga su observador.
    if (previo && typeof previo === 'object')
    {
        try
        {
            var x = previo._exportar ? previo._exportar() : null;
            if (x)
            {
                for (var k in x.explicitos) if (!(k in EXPLICITOS) || (x.resueltos && x.resueltos[k])) { EXPLICITOS[k] = x.explicitos[k]; if (x.resueltos && x.resueltos[k]) RESUELTOS[k] = x.resueltos[k]; }
                if (x.subs) x.subs.forEach(function (mapa, el) { mapa.forEach(function (_, cb) { subscribe(el, cb); }); });
            }
            if (previo._detener) previo._detener();
        }
        catch (e) { }
    }

    try { obs = new MutationObserver(alMutar); observar(w.document); } catch (e) { obs = null; }
    try
    {
        mql = w.matchMedia ? w.matchMedia('(prefers-color-scheme: dark)') : null;
    }
    catch (e) { mql = null; }

    try { Object.defineProperty(w, 'InduxsoftTheme', { value: api, configurable: true, writable: true, enumerable: false }); }
    catch (e) { w.InduxsoftTheme = api; }
})();
