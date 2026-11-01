/* Utilidades de los ejemplos de EdiTable (examples/v2).
 *
 * Demo.pagina({titulo, tipo, bajada})  arma el esqueleto: contenido a la izquierda, panel lateral a la derecha.
 * Demo.observar(idTabla)               muestra en vivo los eventos de EdiTable que se disparan y el DataArray.
 *                                      Hay que llamarlo ANTES de que el ejemplo registre sus propios manejadores:
 *                                      envuelve el objeto Events (un manejador por evento), sin reemplazarlo.
 * Demo.requiere(['summary', ...])      si EditTable.features no trae esas funciones, muestra el aviso
 *                                      "función no disponible en esta versión" (sin features se asume versión 1).
 * Demo.llamar(tabla, 'metodo', ...)    llama un método de la versión 2 si existe; si no, lo anota en el panel.
 * Demo.log(texto)                      escribe una línea en el panel de eventos.
 */
(function () {
  'use strict';
  const EXTRA = ['summarycalculated', 'maskinvalid', 'selectionchanged', 'beforecopy', 'columnfixedchanged', 'columnvisibilitychanged',
    'beforecolumnmove', 'columnmoved', 'layoutchanged', 'layoutrejected', 'beforegroup', 'groupchanged', 'grouptoggled', 'valuetypefallback'];
  let panelEv = null, panelDatos = null, observada = null, ultimo = '';

  function features() {
    try { return (typeof EditTable !== 'undefined' && Array.isArray(EditTable.features)) ? EditTable.features : []; } catch (e) { return []; }
  }
  function version() {
    try { return (typeof EditTable !== 'undefined' && EditTable.version) ? String(EditTable.version) : '1 (sin EditTable.version)'; } catch (e) { return '1'; }
  }
  function resumir(a) {
    if (a === undefined) return '';
    try {
      return JSON.stringify(a, (k, v) => {
        if (k === 'sender') return undefined;
        if (v && typeof v === 'object' && v.nodeType === 1) return '<' + v.nodeName.toLowerCase() + '>';
        if (k === 'coldef' && v) return { field: v.field, type: v.type };
        if (k === 'layout') return '{…}';
        return v;
      });
    } catch (e) { return String(a); }
  }
  function log(txt, nombre) {
    if (!panelEv) return;
    const d = document.createElement('div');
    const h = new Date().toTimeString().slice(0, 8);
    d.innerHTML = '<span style="color:#98a2ab">' + h + '</span> ' + (nombre ? '<b></b> ' : '');
    if (nombre) d.querySelector('b').textContent = nombre;
    d.appendChild(document.createTextNode(txt));
    panelEv.prepend(d);
    while (panelEv.childNodes.length > 200) panelEv.lastChild.remove();
  }
  function pintarDatos() {
    if (!panelDatos || !observada) return;
    const d = observada.DataArray || [];
    let txt;
    try {
      txt = d.length > 60 ? `// ${d.length} filas; se muestran las primeras 20\n` + JSON.stringify(d.slice(0, 20), null, 1) : JSON.stringify(d, null, 1);
    } catch (e) { txt = String(e); }
    if (txt !== ultimo) { panelDatos.textContent = txt; ultimo = txt; }
  }

  const Demo = {
    features, version, log: (t) => log(t),
    pagina({ titulo, tipo = 'actual', bajada = '' }) {
      // No mueve nodos existentes (mover un edit-table antes de DOMContentLoaded lo reconectaría): solo agrega.
      document.title = titulo + ' · EdiTable';
      document.body.classList.add('demo');
      const cont = document.getElementById('contenido');
      cont.classList.add('demo-principal');
      const enc = document.createElement('header');
      enc.innerHTML = '<p style="margin:0 0 6px"><a href="index.html">← Ejemplos</a></p><h1></h1><p class="bajada"></p><div id="avisos"></div>';
      enc.querySelector('h1').textContent = titulo;
      const et = document.createElement('span'); et.className = 'demo-etiqueta ' + tipo; et.textContent = tipo === 'v2' ? 'versión 2' : 'actual';
      enc.querySelector('h1').appendChild(et);
      enc.querySelector('.bajada').textContent = bajada;
      cont.prepend(enc);
      const aside = document.createElement('aside');
      aside.className = 'demo-lateral';
      aside.innerHTML = '<h2>Eventos <button type="button" id="limpiar-ev">Limpiar</button></h2><div class="demo-eventos" id="panel-eventos"></div><h2>DataArray</h2><div class="demo-datos" id="panel-datos"></div>';
      document.body.appendChild(aside);
      panelEv = aside.querySelector('#panel-eventos');
      panelDatos = aside.querySelector('#panel-datos');
      aside.querySelector('#limpiar-ev').onclick = () => { panelEv.innerHTML = ''; };
    },
    observar(id) {
      const t = typeof id === 'string' ? document.getElementById(id) : id;
      if (!t || !t.Events || !t.EdiTable) return;
      observada = t;
      const nombres = new Set(Object.values(t.EdiTable.Const.Events).concat(EXTRA));
      nombres.delete('badgeclick'); // un manejador de BadgeClick hace clicables los badges: no se observa
      nombres.forEach((n) => {
        let usuario = t.Events[n];
        Object.defineProperty(t.Events, n, {
          configurable: true, enumerable: true,
          get() { return function (a) { log(resumir(a), n); if (typeof usuario === 'function') return usuario.apply(this, arguments); }; },
          set(f) { usuario = f; },
        });
      });
      setInterval(pintarDatos, 600);
      document.addEventListener('DOMContentLoaded', () => setTimeout(pintarDatos, 50));
    },
    requiere(lista) {
      const f = features();
      const faltan = lista.filter(x => !f.includes(x));
      if (!faltan.length) return true;
      const av = document.getElementById('avisos') || document.body;
      const d = document.createElement('div');
      d.className = 'demo-aviso';
      d.setAttribute('role', 'status');
      d.innerHTML = '<strong>Función no disponible en esta versión</strong>';
      d.appendChild(document.createTextNode(`EditTable ${version()} no declara en EditTable.features: ${faltan.join(', ')}. La página funciona en cuanto se implemente; mientras, la tabla se ve como en la versión actual.`));
      av.appendChild(d);
      return false;
    },
    llamar(t, metodo, ...args) {
      if (typeof t[metodo] !== 'function') { log(`${metodo}() no existe en esta versión`, 'aviso'); return undefined; }
      try { return t[metodo](...args); } catch (e) { log(`${metodo}(): ${e.message}`, 'error'); return undefined; }
    },
    boton(barra, texto, fn) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = texto; b.onclick = fn;
      (typeof barra === 'string' ? document.getElementById(barra) : barra).appendChild(b); return b;
    },
  };
  window.Demo = Demo;
})();
