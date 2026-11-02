/* Sitio de demostración de EdiTable 2: navegación, tema claro u oscuro, visor de código y detección de funciones.
 *
 * Cada página tiene:
 *   <div id="demo"> … </div>            el HTML de la demostración (lo que se copia en «Ver el código»)
 *   <script data-demo> … </script>      el JS de la demostración (idem)
 *   <div id="codigo"></div>             aquí se dibuja el visor
 *   data-requiere="summary mask"        en <main>: funciones de EditTable.features que usa la página
 *   data-proximamente="search"          en <main>: función de 2.0 aún no integrada (aviso «Próximamente en 2.0»)
 *
 * El HTML se toma ANTES de que EdiTable se inicialice (el componente vacía su contenido al iniciar):
 * este archivo se carga en <head>, así que su DOMContentLoaded corre antes que el de cada <edit-table>.
 * Por eso el código que se ve es exactamente el que corre la página.
 */
(function () {
  'use strict';
  const PAGINAS = [
    ['Inicio', [['index.html', 'Portada', '00']]],
    ['Captura', [
      ['edicion.html', 'Edición, tipos y búsqueda', '01'],
      ['venta.html', 'Documento de venta', '02'],
      ['mascaras.html', 'Máscaras y locale', '03'],
      ['eventos.html', 'API y eventos', '04'],
    ]],
    ['Consulta', [
      ['catalogo.html', '20 000 productos', '05'],
      ['cfdi.html', 'Explorador de CFDI', '06'],
      ['agrupacion.html', 'Agrupación y subtotales', '07'],
      ['columnas.html', 'Columnas y diseño', '08'],
      ['arbol.html', 'Árbol de cuentas', '09'],
      ['tarjetas.html', 'Tarjetas en móvil', '10'],
      ['impresion.html', 'Impresión', '11'],
    ]],
    ['Compatibilidad', [['compatibilidad.html', 'Código v1 sin cambios', '12']]],
    ['Próximamente', [
      ['busqueda.html', 'Búsqueda y filtro', '13', 'search'],
      ['validacion.html', 'Validación de fila', '14', 'rowvalidate'],
      ['cambios.html', 'Cambios para guardar', '15', 'changes'],
      ['secuencia.html', 'Secuencia de captura', '16', 'capture'],
      ['reglas.html', 'Formato condicional', '17', 'rules'],
      ['temas.html', 'Temas y paletas', '18', 'theme'],
    ]],
  ];

  // ---------- Tema del sitio (antes de pintar, sin parpadeo) ----------
  const LLAVE_TEMA = 'edittable-demo-tema';
  let tema = 'claro';
  try { tema = localStorage.getItem(LLAVE_TEMA) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'); } catch (e) { /* sin almacenamiento */ }
  document.documentElement.setAttribute('data-tema', tema);

  const features = () => { try { return (typeof EditTable !== 'undefined' && Array.isArray(EditTable.features)) ? EditTable.features : []; } catch (e) { return []; } };
  const version = () => { try { return (typeof EditTable !== 'undefined' && EditTable.version) ? String(EditTable.version) : '1.x'; } catch (e) { return '1.x'; } };
  const tiene = (f) => features().includes(f);

  // ---------- Resaltado de sintaxis mínimo ----------
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = /^(const|let|var|function|return|if|else|for|of|in|new|true|false|null|undefined|this|typeof|await|async|try|catch|class|=>)$/;
  function resaltarJS(src) {
    const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(`(?:\\[\s\S]|[^`])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)|(=>)/g;
    let out = '', i = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(i, m.index)); i = re.lastIndex;
      if (m[1]) out += '<span class="tk-c">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tk-s">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="tk-n">' + m[3] + '</span>';
      else if (m[4]) out += KW.test(m[4]) ? '<span class="tk-k">' + m[4] + '</span>' : (src[re.lastIndex] === '(' ? '<span class="tk-p">' + m[4] + '</span>' : m[4]);
      else if (m[5]) out += '<span class="tk-k">' + esc(m[5]) + '</span>';
    }
    return out + esc(src.slice(i));
  }
  function resaltarHTML(src) {
    const re = /(<!--[\s\S]*?-->)|(<\/?)([\w-]+)|([\w-]+)(=)("[^"]*"|'[^']*')|(\/?>)/g;
    let out = '', i = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(i, m.index)); i = re.lastIndex;
      if (m[1]) out += '<span class="tk-c">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tk-p">' + esc(m[2]) + '</span><span class="tk-t">' + m[3] + '</span>';
      else if (m[4]) out += '<span class="tk-a">' + m[4] + '</span>' + m[5] + '<span class="tk-s">' + esc(m[6]) + '</span>';
      else if (m[7]) out += '<span class="tk-p">' + esc(m[7]) + '</span>';
    }
    return out + esc(src.slice(i));
  }
  function sangria(txt) {
    const l = txt.replace(/\r/g, '').replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
    const min = Math.min(...l.filter(x => x.trim()).map(x => x.match(/^ */)[0].length));
    return l.map(x => x.slice(Number.isFinite(min) ? min : 0)).join('\n');
  }

  function copiar(texto, boton) {
    const ok = () => { const t = boton.textContent; boton.textContent = 'Copiado'; setTimeout(() => { boton.textContent = t; }, 1400); };
    const respaldo = () => { const ta = document.createElement('textarea'); ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* nada */ } ta.remove(); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(ok, respaldo); else respaldo();
  }

  // ---------- Construcción del sitio ----------
  const ICONO_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const ICONO_LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const actual = (location.pathname.split('/').pop() || 'index.html');

  function nav() {
    const n = document.getElementById('sitio-nav');
    if (!n) return;
    n.setAttribute('aria-label', 'Páginas de la demostración');
    let h = '<a class="marca" href="index.html"><span class="marca-logo">ET</span><span><b>EdiTable 2</b><small>Web component de Induxsoft</small></span></a>';
    for (const [grupo, items] of PAGINAS) {
      h += '<div class="nav-grupo">' + grupo + '</div><ul>';
      for (const [url, titulo, num, f] of items) {
        const marca = f ? (tiene(f) ? '<span class="nav-pronto listo" title="Disponible en esta versión">ya</span>' : '<span class="nav-pronto" title="Llega con F8">2.0</span>') : '';
        h += '<li><a href="' + url + '"' + (url === actual ? ' aria-current="page"' : '') + '><span class="nav-num">' + num + '</span><span>' + titulo + '</span>' + marca + '</a></li>';
      }
      h += '</ul>';
    }
    h += '<div class="nav-pie">Datos 100 % ficticios. Sitio estático, sin dependencias externas.</div>';
    n.innerHTML = h;
  }

  function barra() {
    const b = document.getElementById('sitio-barra');
    if (!b) return;
    let titulo = 'Portada';
    PAGINAS.forEach(([g, it]) => it.forEach(([u, t]) => { if (u === actual) titulo = g + ' / ' + t; }));
    b.innerHTML = '<button type="button" class="btn btn-menu" aria-controls="sitio-nav" aria-expanded="false">Menú</button>' +
      '<span class="migas"></span><span class="espacio"></span>' +
      '<span class="version" title="EditTable.version"></span>' +
      '<button type="button" class="btn" id="btn-tema" aria-pressed="false"></button>';
    b.querySelector('.migas').textContent = titulo;
    b.querySelector('.version').textContent = 'EditTable ' + version();
    const bt = b.querySelector('#btn-tema');
    const pintar = () => { const o = document.documentElement.getAttribute('data-tema') === 'oscuro'; bt.setAttribute('aria-pressed', String(o)); bt.innerHTML = (o ? ICONO_SOL : ICONO_LUNA) + '<span>' + (o ? 'Tema claro' : 'Tema oscuro') + '</span>'; };
    bt.onclick = () => {
      const o = document.documentElement.getAttribute('data-tema') !== 'oscuro';
      document.documentElement.setAttribute('data-tema', o ? 'oscuro' : 'claro');
      try { localStorage.setItem(LLAVE_TEMA, o ? 'oscuro' : 'claro'); } catch (e) { /* nada */ }
      pintar();
      document.dispatchEvent(new CustomEvent('sitio-tema', { detail: { tema: o ? 'oscuro' : 'claro' } }));
    };
    pintar();
    const menu = b.querySelector('.btn-menu');
    let velo = null;
    const cerrar = () => { document.body.classList.remove('menu-abierto'); menu.setAttribute('aria-expanded', 'false'); if (velo) { velo.remove(); velo = null; } };
    menu.onclick = () => {
      if (document.body.classList.contains('menu-abierto')) { cerrar(); return; }
      document.body.classList.add('menu-abierto'); menu.setAttribute('aria-expanded', 'true');
      velo = document.createElement('div'); velo.className = 'velo'; velo.onclick = cerrar; document.body.appendChild(velo);
      const a = document.querySelector('#sitio-nav a[aria-current]') || document.querySelector('#sitio-nav a'); if (a) a.focus();
    };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-abierto')) { cerrar(); menu.focus(); } });
  }

  function chips(main) {
    const c = document.getElementById('chips');
    const req = (main.getAttribute('data-requiere') || '').split(/\s+/).filter(Boolean);
    if (!c || !req.length) return;
    req.forEach((f) => {
      const s = document.createElement('span');
      s.className = 'chip' + (tiene(f) ? '' : ' falta');
      s.textContent = (tiene(f) ? '✓ ' : '… ') + "'" + f + "'";
      s.title = tiene(f) ? 'EditTable.features incluye ' + f : 'Esta versión no declara ' + f;
      c.appendChild(s);
    });
  }

  function proximamente(main) {
    const f = main.getAttribute('data-proximamente');
    const a = document.getElementById('aviso');
    if (!f || !a) return;
    if (tiene(f)) {
      a.className = 'aviso ok';
      a.innerHTML = '<span class="icono">✓</span><div><b>Disponible en EditTable ' + esc(version()) + '.</b> Esta versión declara <code>\'' + esc(f) + '\'</code> en <code>EditTable.features</code>: la demostración de abajo ya funciona.</div>';
    } else {
      a.className = 'aviso';
      a.innerHTML = '<span class="icono">2.0</span><div><b>Próximamente en 2.0.</b> EditTable ' + esc(version()) + ' todavía no declara <code>\'' + esc(f) + '\'</code> en <code>EditTable.features</code>. La tabla se muestra como hoy y el código de abajo es el que correrá sin cambios cuando llegue la función.</div>';
      document.body.classList.add('sin-' + f);
    }
  }

  function visor(html, js) {
    const c = document.getElementById('codigo');
    if (!c || (!html && !js)) return;
    const d = document.createElement('details');
    d.className = 'codigo'; d.open = c.hasAttribute('data-abierto');
    d.innerHTML = '<summary>Ver el código <small>HTML y JS de esta demostración, tal como corren en la página</small></summary>' +
      '<div class="codigo-pestanas" role="tablist"></div>';
    const tabs = d.querySelector('.codigo-pestanas');
    const paneles = [];
    [['HTML', html, resaltarHTML], ['JavaScript', js, resaltarJS]].forEach(([nombre, txt, fn], i) => {
      if (!txt) return;
      const id = 'cod-' + nombre.toLowerCase();
      const b = document.createElement('button');
      b.type = 'button'; b.role = 'tab'; b.id = id + '-tab'; b.textContent = nombre; b.setAttribute('aria-controls', id); b.setAttribute('aria-selected', String(paneles.length === 0)); b.tabIndex = paneles.length === 0 ? 0 : -1;
      const pre = document.createElement('pre'); pre.id = id; pre.setAttribute('role', 'tabpanel'); pre.setAttribute('aria-labelledby', b.id); pre.tabIndex = 0; pre.hidden = paneles.length > 0;
      pre.innerHTML = '<code>' + fn(txt) + '</code>';
      pre._texto = txt;
      tabs.appendChild(b); d.appendChild(pre); paneles.push([b, pre]);
      void i;
    });
    const elegir = (k) => paneles.forEach(([b, p], j) => { b.setAttribute('aria-selected', String(j === k)); b.tabIndex = j === k ? 0 : -1; p.hidden = j !== k; });
    paneles.forEach(([b], k) => {
      b.onclick = () => elegir(k);
      b.onkeydown = (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (k + (e.key === 'ArrowRight' ? 1 : paneles.length - 1)) % paneles.length; elegir(n); paneles[n][0].focus(); } };
    });
    const cp = document.createElement('button'); cp.type = 'button'; cp.className = 'copiar'; cp.textContent = 'Copiar';
    cp.onclick = () => { const p = paneles.find(([, pre]) => !pre.hidden); if (p) copiar(p[1]._texto, cp); };
    tabs.appendChild(cp);
    const nota = document.createElement('div'); nota.className = 'nota-cod';
    nota.innerHTML = 'Carga <code>induxsoft.controls.editable.js</code>' + (/InduxsoftExcel/.test(js) ? ' y <code>induxsoft.controls.excel.js</code>' : '') + '. Los datos de ejemplo salen de <code>assets/datos.js</code> (<code>Datos.*</code>). El sitio aplica su tema a las tablas con <code>control-styles</code> (<code>assets/tema-edittable.js</code>).';
    d.appendChild(nota);
    c.appendChild(d);
  }

  // Primer DOMContentLoaded de la página: corre antes que el de los <edit-table>.
  document.addEventListener('DOMContentLoaded', () => {
    const demo = document.getElementById('demo');
    const html = demo ? sangria(demo.innerHTML) : '';
    const s = document.querySelector('script[data-demo]');
    const js = s ? sangria(s.textContent) : '';
    if (window.TemaEdiTable) TemaEdiTable.aplicar();
    nav(); barra();
    const main = document.querySelector('main') || document.body;
    chips(main); proximamente(main); visor(html, js);
  });

  window.Sitio = { features, version, tiene, PAGINAS, resaltarJS, resaltarHTML };
})();
