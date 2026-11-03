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
 * - 1.1.0: fromColors({bar, barText, bg}, {base}) deriva una paleta (variables --et-* sin el prefijo) de los colores
 *   que el cliente configuró, con contraste AA (4.5:1) en el texto; applyColors(elemento, colores, {base}) la fija
 *   con data-et-palette. data-et-theme="ninguno" corta el tema: ese elemento y lo de arriba no aportan tema, paleta ni
 *   densidad (resolve agrega none: true). Sin llamar a fromColors/applyColors ni usar «ninguno», nada cambia.
 *
 * Este archivo se copia tal cual dentro de induxsoft.controls.editable.js e induxsoft.controls.js, entre los
 * marcadores induxsoft-theme (tests/tools/embed-theme.mjs). Se edita solo aquí.
 */
(function ()
{
    'use strict';
    var VERSION = '1.1.0';
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
    // «ninguno» explícito (también 'none'): corta el tema, la paleta y la densidad heredados (1.1.0).
    var NINGUNO = 'ninguno';
    function esNinguno(v)
    {
        var s = String(v == null ? '' : v).trim().toLowerCase();
        return s === 'ninguno' || s === 'none';
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
     * none: solo existe (true) si un data-et-theme="ninguno" (o lo recordado) cortó el tema; entonces theme es '' y palette y
     * density solo salen de los elementos que están debajo del corte.
     */
    function resolve(el)
    {
        var enc = { theme: null, palette: null, density: null };
        var fuente = '';
        var d0 = null;
        var corte = false;
        var n = el || (w.document && w.document.documentElement);
        var guard = 0;
        while (n && guard++ < 10000)
        {
            if (n.nodeType === 1 && n.hasAttribute)
            {
                if (enc.theme === null && n.hasAttribute(ATTR.theme))
                {
                    enc.theme = n.getAttribute(ATTR.theme); fuente = (d0 && n.ownerDocument !== d0) ? 'frame' : 'element';
                    // «ninguno»: la paleta y la densidad de este elemento y de los de arriba ya no cuentan.
                    if (esNinguno(enc.theme)) { corte = true; break; }
                }
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
            if (r && r.theme) { tema = String(r.theme); fuente = 'storage'; corte = esNinguno(tema); }
        }
        var t = normalizar(tema);
        if (t === 'auto') escucharEsquema();
        var ef = t === 'auto' ? (oscuroDelSistema() ? 'oscuro' : 'claro') : t;
        var pal = interno(ef);
        var res = {
            theme: t,
            palette: paletaDe(enc.palette),
            density: normalizarDensidad(enc.density),
            effective: ef,
            scheme: pal ? (pal['color-scheme'] || '') : '',
            source: t ? fuente : ''
        };
        if (corte) res.none = true;   // solo con «ninguno»: sin él, el resultado es el mismo de 1.0.0
        return res;
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
            if (o.remember && nombre) w.localStorage.setItem(CLAVE, JSON.stringify({ theme: esNinguno(nombre) ? NINGUNO : nombre }));
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
        recordar(o, nombre == null ? '' : (esNinguno(nombre) ? NINGUNO : normalizar(nombre)));
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

    // ---------------------------------------------------------------- colores del cliente (1.1.0)
    // Cálculo en JS (sRGB <-> OKLab/OKLCH), para poder garantizar el contraste: color-mix() no lo permite.
    function hex2(n) { var h = Math.round(Math.max(0, Math.min(255, n))).toString(16); return h.length < 2 ? '0' + h : h; }
    function aHex(c) { return ('#' + hex2(c[0]) + hex2(c[1]) + hex2(c[2])).toUpperCase(); }
    var lienzo = null;
    /** Color CSS -> [r, g, b] (0-255) o null. Acepta #rgb, #rrggbb (con o sin #), rgb()/rgba() y, en el navegador, nombres. */
    function leerColor(v)
    {
        if (v == null) return null;
        var s = String(v).trim();
        if (!s) return null;
        var m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
        if (m)
        {
            var h = m[1];
            if (h.length <= 4) h = h.replace(/./g, function (x) { return x + x; });
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        }
        m = /^rgba?\(\s*([\d.]+)%?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/i.exec(s);
        if (m) return [+m[1], +m[2], +m[3]].map(function (x) { return Math.max(0, Math.min(255, x)); });
        if (/^[a-z]+$/i.test(s) && w.document && w.document.createElement)
        {
            try
            {
                if (!lienzo) lienzo = w.document.createElement('canvas').getContext('2d');
                lienzo.fillStyle = '#000001'; lienzo.fillStyle = s;
                if (lienzo.fillStyle !== '#000001') return leerColor(lienzo.fillStyle);
            }
            catch (e) { }
        }
        return null;
    }
    function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function delin(c) { return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); }
    /** Luminancia relativa (WCAG 2). */
    function luminancia(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
    /** Contraste WCAG entre dos colores (CSS o [r,g,b]); NaN si alguno no se entiende. */
    function contraste(a, b)
    {
        var x = Array.isArray(a) ? a : leerColor(a), y = Array.isArray(b) ? b : leerColor(b);
        if (!x || !y) return NaN;
        var l1 = luminancia(x), l2 = luminancia(y);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    function aOklab(c)
    {
        var r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
        var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
    }
    // OKLab -> sRGB lineal (sin recortar).
    function deOklabLin(o)
    {
        var l = Math.pow(o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2], 3);
        var m = Math.pow(o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2], 3);
        var s = Math.pow(o[0] - 0.0894841775 * o[1] - 1.2914855480 * o[2], 3);
        return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    }
    function enGama(x) { return x[0] >= -1e-4 && x[0] <= 1.0001 && x[1] >= -1e-4 && x[1] <= 1.0001 && x[2] >= -1e-4 && x[2] <= 1.0001; }
    function aLch(c) { var o = aOklab(c); return [o[0], Math.sqrt(o[1] * o[1] + o[2] * o[2]), Math.atan2(o[2], o[1])]; }
    // OKLCH -> sRGB; fuera de gama baja el croma hasta que quepa (conserva luminosidad y tono).
    function deLch(L, C, H)
    {
        L = Math.max(0, Math.min(1, L));
        var x = deOklabLin([L, C * Math.cos(H), C * Math.sin(H)]);
        if (!enGama(x))
        {
            var lo = 0, hi = C;
            for (var i = 0; i < 24; i++) { var mid = (lo + hi) / 2; if (enGama(deOklabLin([L, mid * Math.cos(H), mid * Math.sin(H)]))) lo = mid; else hi = mid; }
            x = deOklabLin([L, lo * Math.cos(H), lo * Math.sin(H)]);
        }
        return [delin(Math.max(0, Math.min(1, x[0]))), delin(Math.max(0, Math.min(1, x[1]))), delin(Math.max(0, Math.min(1, x[2])))].map(Math.round);
    }
    /** Mezcla en OKLab: p (0-1) de b sobre a. */
    function mezclar(a, b, p)
    {
        var x = aOklab(a), y = aOklab(b);
        var o = [x[0] + (y[0] - x[0]) * p, x[1] + (y[1] - x[1]) * p, x[2] + (y[2] - x[2]) * p];
        var c = Math.sqrt(o[1] * o[1] + o[2] * o[2]);
        return deLch(o[0], c, Math.atan2(o[2], o[1]));
    }
    /** Mueve c en OKLab lo mismo que va de desde a hacia (conserva la relación de un fondo con el fondo base). */
    function desplazar(c, desde, hacia)
    {
        var x = aOklab(c), a = aOklab(desde), b = aOklab(hacia);
        var o = [x[0] + b[0] - a[0], x[1] + b[1] - a[1], x[2] + b[2] - a[2]];
        var ch = Math.sqrt(o[1] * o[1] + o[2] * o[2]);
        return deLch(o[0], ch, Math.atan2(o[2], o[1]));
    }
    /**
     * Ajusta la luminosidad (OKLCH, mismo tono) de fg hasta que contraste al menos min con fondo. Se aleja del fondo:
     * hacia el negro si el fondo contrasta más con el negro, hacia el blanco si no. Siempre se alcanza 4.5:1, porque
     * todo color contrasta al menos 4.58:1 con el blanco o con el negro.
     */
    function asegurar(fg, fondo, min)
    {
        if (contraste(fg, fondo) >= min) return fg;
        var lf = luminancia(fondo), oscurecer = (lf + 0.05) / 0.05 >= 1.05 / (lf + 0.05);
        var lch = aLch(fg), lo, hi, mejor = oscurecer ? [0, 0, 0] : [255, 255, 255];
        // Búsqueda binaria del valor de L más cercano al original que cumple.
        if (oscurecer) { lo = 0; hi = lch[0]; } else { lo = lch[0]; hi = 1; }
        for (var i = 0; i < 30; i++)
        {
            var mid = (lo + hi) / 2, c = deLch(mid, lch[1], lch[2]);
            if (contraste(c, fondo) >= min) { mejor = c; if (oscurecer) lo = mid; else hi = mid; }
            else { if (oscurecer) hi = mid; else lo = mid; }
        }
        // El redondeo a 8 bits puede dejarlo apenas abajo: un paso más hacia el extremo.
        var g = 0;
        while (contraste(mejor, fondo) < min && g++ < 255) mejor = mejor.map(function (x) { return oscurecer ? Math.max(0, x - 1) : Math.min(255, x + 1); });
        return mejor;
    }
    // Pares de texto contra fondo que deben cumplir AA (4.5:1) y de elementos de interfaz (3:1, WCAG 1.4.11).
    var TEXTO_AA = [
        ['fg', 'bg'], ['muted-fg', 'bg'], ['header-fg', 'header-bg'], ['footer-fg', 'footer-bg'], ['sel-fg', 'sel-bg'],
        ['active-fg', 'active-bg'], ['input-fg', 'input-bg'], ['menu-fg', 'menu-bg'], ['mark-fg', 'mark-bg'],
        ['accent', 'bg'], ['error', 'bg'], ['warn', 'bg'], ['ok', 'bg'], ['neg-fg', 'bg'],
        ['tooltip-fg', 'tooltip-bg'], ['badge-color', 'badge-bg']
    ];
    // Fondos derivados contra un texto ya fijado: si no alcanzan, el fondo se acerca a 'bg' (que ya cumple con ese
    // texto), porque mover el texto rompería su contraste con 'bg'.
    var FONDO_AA = [['fg', 'row-alt-bg'], ['fg', 'hover-bg'], ['fg', 'sel-bg-soft'], ['fg', 'checked-bg'], ['error', 'error-bg']];
    function acercarFondo(texto, fondo, haciaBg, min)
    {
        if (contraste(texto, fondo) >= min) return fondo;
        var lo = 0, hi = 1, mejor = haciaBg;
        for (var i = 0; i < 24; i++) { var mid = (lo + hi) / 2, c = mezclar(fondo, haciaBg, mid); if (contraste(texto, c) >= min) { mejor = c; hi = mid; } else lo = mid; }
        return mejor;
    }
    var INTERFAZ_3 = [['focus-ring', 'bg'], ['active-cell', 'bg'], ['input-border', 'input-bg']];   // si cambiaron
    function esColor(v) { return /^#[0-9a-f]{3,8}$/i.test(String(v || '').trim()); }
    /**
     * fromColors({bar, barText, bg}, {base}) -> paleta (claves de las variables --et-* sin el prefijo, valores #RRGGBB,
     * más 'color-scheme'). Solo colores: tipografía, radios y espaciados quedan los del tema activo.
     * - base: tema del que salen los colores que no se derivan ('libro-mayor' por omisión).
     * - bar (color de la barra, webshell_nav_background_color): acento, selección, foco, celda activa, encabezados,
     *   hover y bordes (tonalidades de la barra mezcladas con el fondo).
     * - barText (webshell_nav_text_color): texto sobre el acento (sel-fg).
     * - bg (webshell_secbg_color): fondo (bg, input-bg, menús) y, si es oscuro, color-scheme 'dark'.
     * Lo que no se da o no se entiende se toma de la base. Todo texto contra su fondo queda en 4.5:1 o más
     * (se ajusta la luminosidad del texto, nunca el fondo ni la barra: los colores del cliente ganan).
     */
    function fromColors(colores, o)
    {
        colores = colores || {};
        var nb = (o && o.base) || 'libro-mayor';
        var base = interno(nb) || interno('libro-mayor');
        var r = {}, k;
        for (k in base) if (esColor(base[k])) r[k] = leerColor(base[k]);
        var bar = leerColor(colores.bar), barText = leerColor(colores.barText), bg = leerColor(colores.bg);
        var bg0 = r.bg, fg0 = r.fg;
        var oscuro = false;
        if (bg)
        {
            oscuro = luminancia(bg) < 0.18;
            var claroBase = luminancia(bg0) >= 0.18;
            // Si el fondo cambia de claro a oscuro (o al revés), los fondos y textos de la base se invierten respecto
            // a su fondo: se recalculan como mezclas del nuevo fondo con el texto.
            var invertir = oscuro === claroBase;
            var fg = invertir ? (oscuro ? [230, 237, 243] : [27, 31, 36]) : fg0;
            ['bg', 'input-bg', 'active-bg', 'menu-bg', 'fixed-bg', 'chip-bg'].forEach(function (x) { if (r[x] && aHex(r[x]) === aHex(bg0)) r[x] = bg; });
            r.bg = bg;
            if (invertir)
            {
                r.fg = r['input-fg'] = r['active-fg'] = r['menu-fg'] = r['mark-fg'] = fg;
                r['header-fg'] = r['footer-fg'] = mezclar(fg, bg, 0.15);
                r['muted-fg'] = mezclar(fg, bg, 0.35);
                r['header-bg'] = r['footer-bg'] = r['panel-bg'] = r['group-bg'] = r['fixed-head-bg'] = mezclar(bg, fg, 0.07);
                r['row-alt-bg'] = mezclar(bg, fg, 0.03);
                r['hover-bg'] = r['menu-hover-bg'] = r['group-hover-bg'] = r['fixed-hover-bg'] = mezclar(bg, fg, 0.09);
                r.border = r['menu-border'] = r['panel-border'] = r['card-border'] = mezclar(bg, fg, 0.14);
                r['header-border'] = mezclar(bg, fg, 0.22);
                r['input-border'] = mezclar(bg, fg, 0.45);
                r['input-disabled-bg'] = mezclar(bg, fg, 0.07);
                r['error-bg'] = mezclar(bg, r.error, 0.15);
                r['mark-bg'] = mezclar(bg, r['mark-bg'], oscuro ? 0.35 : 1);
                r['tooltip-bg'] = fg; r['tooltip-fg'] = bg;
            }
            else
            {
                // Mismo lado (claro con claro): los fondos de la base se acercan al nuevo fondo.
                ['header-bg', 'footer-bg', 'panel-bg', 'group-bg', 'fixed-head-bg', 'row-alt-bg', 'hover-bg', 'menu-hover-bg', 'group-hover-bg', 'fixed-hover-bg', 'input-disabled-bg', 'sel-bg-soft']
                    .forEach(function (x) { if (r[x]) r[x] = desplazar(r[x], bg0, bg); });
            }
        }
        if (bar)
        {
            var f = r.bg, t = r.fg;
            r['sel-bg'] = bar;
            r.accent = bar;
            r['focus-ring'] = bar;
            r['active-cell'] = bar;
            r['sel-bg-soft'] = r['checked-bg'] = mezclar(f, bar, oscuro ? 0.30 : 0.14);
            r['hover-bg'] = r['menu-hover-bg'] = r['group-hover-bg'] = r['fixed-hover-bg'] = mezclar(f, bar, oscuro ? 0.16 : 0.07);
            r['header-bg'] = r['footer-bg'] = r['panel-bg'] = r['group-bg'] = r['fixed-head-bg'] = mezclar(f, bar, oscuro ? 0.12 : 0.06);
            r['row-alt-bg'] = mezclar(f, bar, oscuro ? 0.05 : 0.025);
            r['header-fg'] = r['footer-fg'] = mezclar(t, bar, 0.25);
            r['header-border'] = mezclar(f, bar, oscuro ? 0.35 : 0.24);
            r.border = r['menu-border'] = r['panel-border'] = r['card-border'] = mezclar(f, bar, oscuro ? 0.24 : 0.13);
            r['input-border'] = mezclar(mezclar(f, t, 0.45), bar, 0.25);
            if (!barText) r['sel-fg'] = contraste([255, 255, 255], bar) >= contraste([0, 0, 0], bar) ? [255, 255, 255] : [27, 31, 36];
        }
        if (barText) r['sel-fg'] = barText;
        // Contraste: primero las interfaces (3:1), luego el texto (4.5:1). Solo se mueve el primer color del par, y
        // solo en los pares que cambiaron respecto a la base (sin colores, la paleta es la de la base, tal cual).
        var cambio = function (p) { return aHex(r[p[0]]) !== aHex(leerColor(base[p[0]])) || aHex(r[p[1]]) !== aHex(leerColor(base[p[1]])); };
        INTERFAZ_3.forEach(function (p) { if (r[p[0]] && r[p[1]] && cambio(p)) r[p[0]] = asegurar(r[p[0]], r[p[1]], 3); });
        TEXTO_AA.forEach(function (p) { if (r[p[0]] && r[p[1]] && cambio(p)) r[p[0]] = asegurar(r[p[0]], r[p[1]], 4.5); });
        FONDO_AA.forEach(function (p) { if (r[p[0]] && r[p[1]] && cambio(p)) r[p[1]] = acercarFondo(r[p[0]], r[p[1]], r.bg, 4.5); });
        var out = { 'color-scheme': bg ? (oscuro ? 'dark' : 'light') : (base['color-scheme'] || 'light') };
        for (k in r) out[k] = aHex(r[k]);
        return out;
    }
    /**
     * applyColors(elemento, colores, {base}) -> paleta. Fija fromColors(colores) como data-et-palette del elemento
     * (<html> por omisión), así que la heredan sus descendientes, los shadow DOM y los iframes del mismo origen.
     * base: por omisión, el tema efectivo del elemento (o 'libro-mayor' si no tiene). colores null quita la paleta.
     */
    function applyColors(el, colores, o)
    {
        el = el || (w.document && w.document.documentElement);
        if (!el) return null;
        if (colores == null) { el.removeAttribute(ATTR.palette); return null; }
        var b = o && o.base;
        if (!b) { var res = resolve(el); b = res.effective && interno(res.effective) ? res.effective : 'libro-mayor'; }
        var p = fromColors(colores, { base: b });
        el.setAttribute(ATTR.palette, JSON.stringify(p));
        return copia(p);
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
        none: NINGUNO,
        isNone: esNinguno,
        fromColors: fromColors,
        applyColors: applyColors,
        contrast: contraste,
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
