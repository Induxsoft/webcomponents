// Pruebas unitarias de InputKey 2 (2026-11-02). Las importa run.mjs; usan su página (catálogo ficticio, servidor
// simulado en /buscar?q=, el input-key #ik y el botón #abrir). Cada prueba afirma lo que espera.
//
// p.attrs: atributos extra del #ik. p.pagina: {antes, head, body, bodyAttrs, editable} para armar la página.

export default ({ esperar, buscar, ev, clicShadow, sinDoc }) => {
  const S = (page, fn, arg) => page.evaluate(fn, arg);
  const cs = (page, css, prop) => S(page, ([c, p]) => { const e = __s().querySelector(c); return e ? getComputedStyle(e).getPropertyValue(p) : null; }, [css, prop]);
  // Foto del interior del componente (para comparar con la base): HTML del shadow y del light DOM vecino.
  const foto = (page) => S(page, () => {
    const ik = document.getElementById('ik'), s = ik.shadowRoot;
    const html = Array.from(s.children).map(c => c.outerHTML).join('\n').replace(/<style>[\s\S]*?<\/style>/, '<style/>');
    return { html, estilo: s.querySelector('style').textContent, host: ik.outerHTML.replace(/>[\s\S]*$/, '>'), vecino: ik.nextElementSibling ? ik.nextElementSibling.outerHTML : null, cambios: window.__cambios.slice(), foco: __foco(), pet: window.__pet.map(p => p.url) };
  });
  return [
    // ===== Compatibilidad: sin atributos nuevos, idéntico a la base
    { id: 'ik2-identico-sin-tema', titulo: 'InputKey 2: sin atributos nuevos, el shadow, el estilo, el light DOM, los cambios y el foco son idénticos a la base (35834a4) paso por paso', fn: async (page, ok, _d, { base }) => {
      const pasos = async (pg) => {
        const r = [];
        r.push(await foto(pg));
        await buscar(pg, 'arandela'); r.push(await foto(pg));
        await pg.keyboard.press('ArrowDown'); await esperar(pg, 30); r.push(await foto(pg));
        await pg.keyboard.press('Enter'); await esperar(pg, 60); r.push(await foto(pg));
        await buscar(pg, 'C-002'); r.push(await foto(pg));
        await buscar(pg, 'zzz', false); r.push(await foto(pg));
        await pg.keyboard.press('Escape'); await esperar(pg, 30); r.push(await foto(pg));
        await S(pg, () => { const i = __s().getElementById('input_search_container'); i.focus(); }); await pg.keyboard.type('tor'); await pg.keyboard.press('Enter'); await esperar(pg, 120); r.push(await foto(pg));
        await pg.keyboard.press('Enter'); await esperar(pg, 60); r.push(await foto(pg));
        await S(pg, () => document.getElementById('ik').clear()); r.push(await foto(pg));
        return r;
      };
      const a = await pasos(page);
      const pb = await base();
      const b = await pasos(pb);
      a.forEach((x, i) => { for (const k of Object.keys(x)) ok(JSON.stringify(x[k]) === JSON.stringify(b[i][k]), `paso ${i}, ${k} igual a la base` + (JSON.stringify(x[k]) === JSON.stringify(b[i][k]) ? '' : `\n         nuevo: ${JSON.stringify(x[k]).slice(0, 300)}\n         base:  ${JSON.stringify(b[i][k]).slice(0, 300)}`)); });
    } },
    { id: 'ik2-sin-tema-nada-nuevo', titulo: 'InputKey 2: sin atributos nuevos no hay <style data-ik>, clases ik2 ni atributos ARIA nuevos', fn: async (page, ok) => {
      await buscar(page, 'arandela');
      const r = await S(page, () => ({ estilo: !!__s().querySelector('style[data-ik]'), ik2: __s().querySelectorAll('.ik2').length, role: __s().querySelectorAll('[role]').length, cuenta: !!__s().getElementById('ik2_cuenta') }));
      ok(!r.estilo && r.ik2 === 0 && r.role === 0 && !r.cuenta, JSON.stringify(r));
    } },
    { id: 'ik2-x-visible', titulo: 'A8: la X de agregar y editar ya no es blanca (también sin tema)', fn: async (page, ok) => {
      const f = await S(page, () => Array.from(__s().querySelectorAll('#container3 svg, #container4 svg')).map(s => s.getAttribute('fill')));
      ok(f.length === 2 && f.every(x => x === '#333'), JSON.stringify(f));
    } },
    // ===== Tema (A1, A2, A9) y módulo
    { id: 'ik2-tema-claro', titulo: 'A1: theme="claro" activa la apariencia nueva con las variables del tema', attrs: 'theme="claro"', fn: async (page, ok) => {
      ok(await S(page, () => __s().getElementById('container').classList.contains('ik2')), 'el campo lleva ik2');
      ok((await cs(page, '#container', 'border-top-color')) === 'rgb(140, 149, 159)', 'borde = input-border de claro: ' + await cs(page, '#container', 'border-top-color'));
      ok((await cs(page, '#input_search_container', 'font-family')).includes('monospace'), 'código en monoespaciada');
      ok((await S(page, () => __s().getElementById('input_search_container').getAttribute('role'))) === 'combobox', 'A10: role=combobox');
    } },
    { id: 'ik2-tema-caliente', titulo: 'A1: el tema cambia en caliente (atributo y propiedad) y al quitarlo vuelve a como hoy', attrs: 'theme="claro"', fn: async (page, ok) => {
      await S(page, () => document.getElementById('ik').setAttribute('theme', 'oscuro')); await esperar(page, 250);
      ok((await cs(page, '#container', 'background-color')) === 'rgb(13, 17, 23)', 'oscuro: ' + await cs(page, '#container', 'background-color'));
      await S(page, () => { document.getElementById('ik').Theme = 'jade'; }); await esperar(page, 250);
      ok((await cs(page, '#button_search_container', 'color')) === 'rgb(15, 122, 65)', 'jade por propiedad: ' + await cs(page, '#button_search_container', 'color'));
      await S(page, () => { const ik = document.getElementById('ik'); ik.Theme = undefined; ik.removeAttribute('theme'); }); await esperar(page, 30);
      const r = await S(page, () => ({ estilo: !!__s().querySelector('style[data-ik]'), ik2: __s().querySelectorAll('.ik2').length, role: __s().getElementById('input_search_container').hasAttribute('role'), svg: __s().getElementById('button_search_container').innerHTML.includes('three-dots') }));
      ok(!r.estilo && r.ik2 === 0 && !r.role && r.svg, 'sin tema otra vez: ' + JSON.stringify(r));
    } },
    { id: 'ik2-precedencia', titulo: 'A1: respaldo < tema < --et-* externas < palette', attrs: 'theme="claro" style="--et-input-border:#00ff00"', fn: async (page, ok) => {
      ok((await cs(page, '#container', 'border-top-color')) === 'rgb(0, 255, 0)', 'externa gana al tema');
      await S(page, () => document.getElementById('ik').setAttribute('palette', '{"input-border":"#ff0000"}')); await esperar(page, 250);
      ok((await cs(page, '#container', 'border-top-color')) === 'rgb(255, 0, 0)', 'palette gana a la externa');
      await S(page, () => { const ik = document.getElementById('ik'); ik.SetPalette(null); }); await esperar(page, 250);
      ok((await cs(page, '#container', 'border-top-color')) === 'rgb(0, 255, 0)', 'SetPalette(null) la quita');
    } },
    { id: 'ik2-densidad', titulo: 'A9: density cambia el alto del campo y de las filas', attrs: 'theme="claro" density="compacta"', fn: async (page, ok) => {
      const h1 = await S(page, () => __s().getElementById('container').getBoundingClientRect().height);
      await S(page, () => document.getElementById('ik').setAttribute('density', 'comoda')); await esperar(page, 30);
      const h2 = await S(page, () => __s().getElementById('container').getBoundingClientRect().height);
      ok(h1 >= 27 && h1 <= 32 && h2 >= 41 && h2 <= 46, `compacta ${h1}, cómoda ${h2}`);
    } },
    { id: 'ik2-modulo-real', titulo: 'Módulo: el InduxsoftTheme real (1.x) está incrustado en controls.js', fn: async (page, ok) => {
      ok(/^1\./.test(await S(page, () => window.InduxsoftTheme && InduxsoftTheme.version)), 'versión ' + await S(page, () => window.InduxsoftTheme && InduxsoftTheme.version));
    } },
    { id: 'ik2-define', titulo: 'Módulo: un tema registrado con InduxsoftTheme.define pinta el InputKey (y se actualiza en caliente)', attrs: 'theme="v12-azul"', fn: async (page, ok) => {
      await S(page, () => { InduxsoftTheme.define('v12-azul', { 'input-border': '#0F3D6E', accent: '#0F3D6E' }); }); await esperar(page, 250);
      ok((await cs(page, '#container', 'border-top-color')) === 'rgb(15, 61, 110)', 'define: ' + await cs(page, '#container', 'border-top-color'));
    } },
    { id: 'ik2-modulo', titulo: 'Módulo: con el InduxsoftTheme incrustado, data-et-theme de un ancestro activa el tema; el propio gana; data-et-theme="" corta; cambio en caliente', pagina: { bodyAttrs: ' data-et-theme="oscuro"' }, fn: async (page, ok) => {
      ok(await S(page, () => __s().getElementById('container').classList.contains('ik2')), 'heredado de <body>');
      ok((await cs(page, '#container', 'background-color')) === 'rgb(13, 17, 23)', 'oscuro');
      await S(page, () => document.body.setAttribute('data-et-theme', 'jade')); await esperar(page, 250);
      ok((await cs(page, '#button_search_container', 'color')) === 'rgb(15, 122, 65)', 'cambio en caliente a jade');
      await S(page, () => document.getElementById('ik').setAttribute('theme', 'libro-mayor')); await esperar(page, 250);
      ok((await cs(page, '#button_search_container', 'color')) === 'rgb(29, 79, 145)', 'el theme propio gana');
      await S(page, () => { document.getElementById('ik').removeAttribute('theme'); document.body.setAttribute('data-et-theme', ''); }); await esperar(page, 30);
      ok(!(await S(page, () => __s().getElementById('container').classList.contains('ik2'))), 'data-et-theme="" corta: sin tema');
      await S(page, () => { document.body.setAttribute('data-et-theme', 'oscuro'); document.getElementById('ik').setAttribute('theme', ''); }); await esperar(page, 250);
      ok(!(await S(page, () => __s().getElementById('container').classList.contains('ik2'))), 'theme="" propio corta lo heredado (spec §4)');
      await S(page, () => { const ik = document.getElementById('ik'); ik.removeAttribute('theme'); window.__ik = ik; ik.remove(); document.body.setAttribute('data-et-theme', 'jade'); }); await esperar(page, 100);
      ok(!(await S(page, () => __ik._ik2Sub)), 'al quitarlo se desuscribe');
      await S(page, () => { document.body.appendChild(__ik); }); await esperar(page, 250);
      ok((await S(page, () => getComputedStyle(__ik.shadowRoot.getElementById('button_search_container')).color)) === 'rgb(15, 122, 65)', 'al reconectarlo vuelve a resolver (jade)');
    } },
    { id: 'ik2-a2-tabla', titulo: 'A2: sin tema propio, la ventana toma el tema de la EdiTable que la abre, y lo suelta al cerrar', pagina: { editable: true, body: '<edit-table id="t" theme="jade" style="width:400px" data=\'[{"a":"x"},{"a":"y"}]\'><edit-thead><edit-tr><edit-th field="a" type="Text">A</edit-th></edit-tr></edit-thead></edit-table>' }, fn: async (page, ok) => {
      await S(page, () => { const t = document.getElementById('t'); t.setInputKey('a', document.getElementById('ik')); });
      // el foco en la tabla (el selector de la celda) y se abre como lo hace EdiTable
      await S(page, () => { const t = document.getElementById('t'); t.NavTo(0, 0); });
      await esperar(page, 30);
      await S(page, () => document.getElementById('ik').searchText('arandela', true)); await esperar(page, 120);
      ok(await S(page, () => __s().getElementById('container2').classList.contains('ik2')), 'la ventana lleva ik2');
      ok(!(await S(page, () => __s().getElementById('container').classList.contains('ik2'))), 'el campo no');
      ok((await cs(page, '#container2 tr.row_selected > td', 'background-color')) === 'rgb(209, 250, 229)', 'selección de jade: ' + await cs(page, '#container2 tr.row_selected > td', 'background-color'));
      await page.keyboard.press('Escape'); await esperar(page, 30);
      ok(!(await S(page, () => __s().getElementById('container2').classList.contains('ik2'))), 'al cerrar la suelta');
    } },
    // ===== Panel anclado (A5) y headless (B1)
    { id: 'ik2-anclado', titulo: 'A5: popup="anchored" ancla el panel debajo del anchor; clic fuera cierra sin selección (Canceled)', attrs: 'popup="anchored"', fn: async (page, ok) => {
      await S(page, () => { const b = document.getElementById('abrir'); b.style.cssText = 'position:absolute;left:100px;top:50px;width:120px;height:30px'; window.__ev = []; document.getElementById('ik').addEventListener('Canceled', e => __ev.push('Canceled')); });
      await S(page, () => document.getElementById('ik').open('arandela', { anchor: document.getElementById('abrir') })); await esperar(page, 120);
      const r = await S(page, () => { const p = __s().getElementById('search_container2').getBoundingClientRect(); return { x: Math.round(p.x), y: Math.round(p.y), w: Math.round(p.width), cls: __s().getElementById('container2').className }; });
      ok(r.cls.includes('ik2-anclado') && r.x === 100 && r.y === 84 && r.w >= 240, 'panel en (100, 84): ' + JSON.stringify(r));
      await page.mouse.click(700, 500); await esperar(page, 30);
      ok(!(await ev(page, () => __abierta())) && JSON.stringify(await S(page, () => __ev)) === '["Canceled"]', 'clic fuera cierra con Canceled');
      await S(page, () => document.getElementById('ik').open('arandela')); await esperar(page, 120);
      ok((await S(page, () => __s().getElementById('container2').className)).includes('ik2-anclado'), 'sin anchor, se ancla al campo');
    } },
    { id: 'ik2-modal-por-omision', titulo: 'Decisión 2: con tema y sin popup, la ventana sigue siendo la modal centrada', attrs: 'theme="claro"', fn: async (page, ok) => {
      await buscar(page, 'arandela');
      const c = await S(page, () => __s().getElementById('container2').className);
      ok(c.includes('ik2') && !c.includes('ik2-anclado') && (await cs(page, '#container2', 'display')) === 'flex', c);
    } },
    { id: 'ik2-headless', titulo: 'B1: headless="true" oculta el campo; la ventana funciona', attrs: 'headless="true" theme="claro"', fn: async (page, ok) => {
      ok((await cs(page, '#container', 'display')) === 'none', 'campo oculto');
      await buscar(page, 'arandela');
      ok(await ev(page, () => __abierta()), 'la ventana se abre');
    } },
    { id: 'ik2-control-styles-oculto', titulo: 'Compatibilidad: control-styles="#container{display:none !important;}" con tema sigue ocultando el campo', attrs: 'theme="oscuro" hidden-input="false" control-styles="#container{display:none !important;}"', fn: async (page, ok) => {
      ok((await cs(page, '#container', 'display')) === 'none', 'campo oculto');
      ok((await S(page, () => document.getElementById('ik').nextElementSibling?.id)) !== 'inputv', 'sin inputv en el light DOM');
      await buscar(page, 'arandela');
      ok(await ev(page, () => __abierta()) && (await S(page, () => __s().getElementById('container2').classList.contains('ik2'))), 'ventana con tema');
    } },
    // ===== pick / open / close / load (B1)
    { id: 'ik2-pick', titulo: 'B1: pick() resuelve con el registro (Enter) o null (Esc); con un exacto único entra sin abrir', attrs: 'theme="claro"', fn: async (page, ok) => {
      await S(page, () => { window.__r = 'pendiente'; document.getElementById('ik').pick('arandela').then(r => { window.__r = r ? r.clave : null; }); }); await esperar(page, 120);
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await esperar(page, 60);
      ok((await S(page, () => __r)) === 'C-0031', 'Enter: C-0031: ' + await S(page, () => __r));
      await S(page, () => { window.__r = 'pendiente'; document.getElementById('ik').pick('arandela').then(r => { window.__r = r; }); }); await esperar(page, 120);
      await page.keyboard.press('Escape'); await esperar(page, 30);
      ok((await S(page, () => __r)) === null, 'Esc: null');
      await S(page, () => { window.__r = 'pendiente'; document.getElementById('ik').pick('C-002').then(r => { window.__r = r ? r.clave : null; }); }); await esperar(page, 120);
      ok((await S(page, () => __r)) === 'C-002' && !(await ev(page, () => __abierta())), 'exacto único sin abrir');
      await S(page, () => { window.__r = 'pendiente'; const ik = document.getElementById('ik'); ik.pick('arandela').then(r => { window.__r = r; }); }); await esperar(page, 120);
      await S(page, () => document.getElementById('ik').close()); await esperar(page, 30);
      ok((await S(page, () => __r)) === null && !(await ev(page, () => __abierta())), 'close(): null');
    } },
    { id: 'ik2-load', titulo: 'B1: load(llave) muestra el registro sin change_event (o con {notify:true})', fn: async (page, ok) => {
      const r = await S(page, async () => { const x = await document.getElementById('ik').load(3); return x ? x.clave : null; });
      ok(r === 'C-003' && (await S(page, () => __s().getElementById('input_search_container').value)) === 'C-003' && (await S(page, () => __cambios.length)) === 0, 'C-003 sin change_event');
      await S(page, () => document.getElementById('ik').load(2, { notify: true })); await esperar(page, 60);
      ok(JSON.stringify(await S(page, () => __cambios)) === '["C-002"]', 'con notify');
      ok((await S(page, () => document.getElementById('ik').load(999))) === null, 'llave inexistente: null');
    } },
    // ===== Eventos (B2)
    { id: 'ik2-eventos', titulo: 'B2: Opened, SearchCompleted, Selected, Closed, Canceled con su detalle; los nombres no registrados se siguen descartando', attrs: 'theme="claro"', fn: async (page, ok) => {
      await S(page, () => { const ik = document.getElementById('ik'); window.__ev = []; ['Selected', 'Canceled', 'BeforeSearch', 'SearchCompleted', 'SearchError', 'Opened', 'Closed'].forEach(n => ik.addEventListener(n, e => __ev.push(n + ':' + JSON.stringify(e.detail.record ? e.detail.record.clave : (e.detail.count ?? e.detail.popup ?? e.detail.text ?? ''))))); ik.addEventListener('click', () => __ev.push('click')); });
      await buscar(page, 'arandela');
      await page.keyboard.press('Enter'); await esperar(page, 60);
      await buscar(page, 'tuerca', false);
      await page.keyboard.press('Escape'); await esperar(page, 30);
      await page.click('#ik'); await esperar(page, 30);
      const e = await S(page, () => __ev);
      ok(JSON.stringify(e) === JSON.stringify(['BeforeSearch:"arandela"', 'SearchCompleted:2', 'Opened:"modal"', 'Selected:"C-003"', 'Closed:"modal"', 'BeforeSearch:"tuerca"', 'SearchCompleted:1', 'Opened:"modal"', 'Canceled:"tuerca"', 'Closed:"modal"']), JSON.stringify(e));
    } },
    { id: 'ik2-beforesearch', titulo: 'B2: BeforeSearch puede cambiar el texto o cancelar (pick() da null)', fn: async (page, ok) => {
      await S(page, () => document.getElementById('ik').addEventListener('BeforeSearch', e => { if (e.detail.text === 'x') e.detail.text = 'tornillo'; if (e.detail.text === 'no') e.detail.cancel = true; }));
      await buscar(page, 'x', false);
      ok((await ev(page, () => __pet[0].q)) === 'tornillo', 'texto cambiado');
      await page.keyboard.press('Escape');
      await S(page, () => { window.__r = 'pendiente'; document.getElementById('ik').pick('no').then(r => { window.__r = r; }); }); await esperar(page, 100);
      ok((await S(page, () => __r)) === null && (await ev(page, () => __pet.length)) === 1 && !(await ev(page, () => __abierta())), 'cancelada: sin petición, null');
    } },
    { id: 'ik2-removelistener', titulo: 'B2: removeEventListener quita un oyente de los eventos nuevos', fn: async (page, ok) => {
      await S(page, () => { const ik = document.getElementById('ik'); window.__n = 0; window.__f = () => __n++; ik.addEventListener('Opened', __f); });
      await buscar(page, 'arandela'); await page.keyboard.press('Escape');
      await S(page, () => document.getElementById('ik').removeEventListener('Opened', __f));
      await buscar(page, 'arandela');
      ok((await S(page, () => __n)) === 1, String(await S(page, () => __n)));
    } },
    // ===== Teclado (B7)
    { id: 'ik2-teclado', titulo: 'B7: con tema, flechas (keydown, con repetición), RePág/AvPág, Inicio/Fin, carácter al buscador y Enter sin fuga del keyup', attrs: 'theme="claro"', fn: async (page, ok) => {
      await S(page, () => { for (let i = 0; i < 30; i++) __CAT.push({ id: 100 + i, clave: 'M-' + (100 + i), nombre: 'Muestra ficticia ' + i, codbar: '' }); });
      await buscar(page, 'muestra', false);
      const act = () => S(page, () => { const r = __s().querySelector('tr.row_selected'); return r ? r.cells[0].textContent : null; });
      ok((await act()) === 'M-100', 'primera activa');
      await page.keyboard.down('ArrowDown'); await page.keyboard.down('ArrowDown'); await page.keyboard.down('ArrowDown'); await page.keyboard.up('ArrowDown');
      ok((await act()) === 'M-103', 'tres keydown (sostenida): ' + await act());
      await page.keyboard.press('End'); ok((await act()) === 'M-129', 'Fin');
      await page.keyboard.press('Home'); ok((await act()) === 'M-100', 'Inicio');
      await page.keyboard.press('PageDown'); const pd = await act(); ok(pd !== 'M-100' && pd !== 'M-101', 'AvPág avanza una página: ' + pd);
      await page.keyboard.press('PageUp'); ok((await act()) === 'M-100', 'RePág');
      await page.keyboard.press('ArrowUp'); ok((await ev(page, () => __foco())).startsWith('ik>INPUT'), '↑ en la primera vuelve al buscador');
      await page.keyboard.press('ArrowDown'); await page.keyboard.type('1'); await esperar(page, 30);
      ok((await S(page, () => __s().querySelector('#search_section_container2 input').value)) === 'muestra1', 'teclear sobre la lista vuelve al buscador conservando lo escrito');
      await page.keyboard.press('Control+A'); await page.keyboard.type('ficticia 1'); await page.keyboard.press('Enter'); await esperar(page, 120);
      ok((await S(page, () => __filas().length)) === 11, 'Enter en el buscador busca: ' + (await S(page, () => __filas().length)));
      // Enter acepta con keydown; el keyup no llega al buscador propio (que buscaría otra vez).
      await page.keyboard.press('Escape'); await esperar(page, 20);
      const n = await ev(page, () => __pet.length);
      await S(page, () => { window.__ku = 0; __s().getElementById('input_search_container').addEventListener('keyup', e => { if (e.key === 'Enter') __ku++; }); });
      await S(page, () => __s().getElementById('input_search_container').focus());
      await S(page, () => { const ik = document.getElementById('ik'); ik.searchText('ficticia 1', false); }); await esperar(page, 120);
      await page.keyboard.press('Enter'); await esperar(page, 120);
      ok((await ev(page, () => __cambios.length)) === 1 && (await S(page, () => __ku)) === 0, 'acepta y el keyup del Enter no llega al campo: ' + JSON.stringify([await ev(page, () => __cambios), await S(page, () => __ku)]));
      ok((await ev(page, () => __pet.length)) === n + 1, 'no se lanza otra búsqueda');
      ok((await ev(page, () => __foco())) === 'ik>input_search_container', 'el foco vuelve al campo: ' + await ev(page, () => __foco()));
    } },
    { id: 'ik2-teclado-esc', titulo: 'B7 + IK-1: con tema, Esc en la lista sigue sin llegar al documento', attrs: 'theme="claro" popup="anchored"', fn: async (page, ok) => {
      await buscar(page, 'arandela');
      await ev(page, () => { __esc.length = 0; });
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Escape'); await esperar(page, 30);
      ok(!(await ev(page, () => __abierta())) && sinDoc(await ev(page, () => __esc)).length === 0, JSON.stringify(await ev(page, () => __esc)));
      ok((await ev(page, () => __foco())) === 'abrir', 'foco a #abrir');
    } },
    { id: 'ik2-f4', titulo: 'B7: F4 y Alt+↓ en el campo con tema abren la lista', attrs: 'theme="claro"', fn: async (page, ok) => {
      await S(page, () => __s().getElementById('input_search_container').focus());
      await page.keyboard.press('F4'); await esperar(page, 60);
      ok(await ev(page, () => __abierta()), 'F4');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Alt+ArrowDown'); await esperar(page, 60);
      ok(await ev(page, () => __abierta()), 'Alt+↓');
    } },
    { id: 'ik2-tab-accepts', titulo: 'B7: tab-accepts="true": Tab acepta la fila activa', attrs: 'theme="claro" tab-accepts="true"', fn: async (page, ok) => {
      await buscar(page, 'arandela');
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab'); await esperar(page, 60);
      ok(JSON.stringify(await ev(page, () => __cambios)) === '["C-0031"]', JSON.stringify(await ev(page, () => __cambios)));
    } },
    // ===== Columnas (B8), lista (A6)
    { id: 'ik2-columnas-json', titulo: 'B8: columns en JSON: títulos, ocultas, moneda, alineación y ancho (con y sin tema)', fn: async (page, ok) => {
      await S(page, () => { __CAT.forEach((p, i) => { p.precio = 1000 * i + 0.5; }); const ik = document.getElementById('ik'); ik.columns = '[{"field":"clave","title":"Código","type":"code"},{"field":"nombre","title":"Nombre","width":"200px"},{"field":"precio","title":"Precio","type":"money"},{"field":"codbar","hidden":true}]'; });
      await buscar(page, 'arandela');
      const r = () => S(page, () => ({ th: Array.from(__s().querySelectorAll('#head_tables_container2 th')).map(t => t.textContent), td: Array.from(__s().querySelectorAll('#body_tables_container2 tr')[0].cells).map(c => c.textContent), al: getComputedStyle(__s().querySelectorAll('#body_tables_container2 tr')[0].cells[2]).textAlign, w: __s().querySelectorAll('#head_tables_container2 th')[1].style.width }));
      let x = await r();
      ok(JSON.stringify(x.th) === '["Código","Nombre","Precio"]' && x.td[2] === '$2,000.50' && x.al === 'end' && x.w === '200px', 'sin tema: ' + JSON.stringify(x));
      await page.keyboard.press('Escape');
      await S(page, () => document.getElementById('ik').setAttribute('theme', 'claro')); await esperar(page, 30);
      await buscar(page, 'arandela');
      x = await r();
      ok(JSON.stringify(x.th) === '["Código","Nombre","Precio"]' && x.td[2] === '$2,000.50' && x.al === 'end', 'con tema: ' + JSON.stringify(x));
      ok((await S(page, () => __s().querySelector('#body_tables_container2 td.ik2-cod mark')?.textContent)) === undefined, 'el código no marca «arandela»');
      ok((await S(page, () => __s().querySelector('#body_tables_container2 tr td:nth-child(2) mark')?.textContent)) === 'Arandela', 'A6: resalta la coincidencia');
    } },
    { id: 'ik2-lista-vacia', titulo: 'A6: con tema, sin resultados: fila de aviso válida (no <p> en el tbody) y contador', attrs: 'theme="claro"', fn: async (page, ok) => {
      await buscar(page, 'zzz', false);
      const r = await S(page, () => ({ p: __s().querySelectorAll('#body_tables_container2 > p').length, aviso: __s().querySelector('#body_tables_container2 td.ik2-aviso')?.textContent, cuenta: __s().getElementById('ik2_cuenta').textContent }));
      ok(r.p === 0 && /Sin coincidencias para «zzz»/.test(r.aviso) && r.cuenta === '0 resultados', JSON.stringify(r));
    } },
    // ===== Sin alert con tema (A4, B15)
    { id: 'ik2-sin-alert', titulo: 'A4: con tema, «Aceptar» sin selección y el buscador vacío avisan en línea, sin alert', attrs: 'theme="claro"', fn: async (page, ok, dialogos) => {
      await buscar(page, '', false);
      await clicShadow(page, '#search_container2 > .modal-section:last-child button:first-of-type');
      ok(/Debe seleccionar/.test(await S(page, () => __s().getElementById('ik2_estado').textContent)), 'aviso de selección en línea');
      await clicShadow(page, '#search_section_container2 button');
      ok(/Debe especificar/.test(await S(page, () => __s().getElementById('ik2_estado').textContent)), 'aviso de texto en línea');
      ok(dialogos.length === 0, 'sin alert: ' + JSON.stringify(dialogos));
    } },
    { id: 'ik2-sin-tema-alert', titulo: 'Compatibilidad: sin tema, «Aceptar» sin selección sigue con alert', fn: async (page, ok, dialogos) => {
      await buscar(page, '', false);
      await clicShadow(page, '#search_container2 > .modal-section:last-child button:first-of-type');
      ok(dialogos.length === 1 && dialogos[0] === 'Debe seleccionar un registro para continuar', JSON.stringify(dialogos));
    } },
    { id: 'ik2-error-reintentar', titulo: 'B15: con tema, el error va en la ventana con «Reintentar» (SearchError) y reintentar trae los resultados', attrs: 'theme="claro"', fn: async (page, ok, dialogos) => {
      await S(page, () => { window.__falla = true; const f0 = window.fetch; window.fetch = (u, o) => window.__falla ? Promise.reject(new Error('red ficticia')) : f0(u, o); window.__ev = []; document.getElementById('ik').addEventListener('SearchError', e => __ev.push(e.detail.error)); });
      await buscar(page, 'arandela');
      ok(await ev(page, () => __abierta()), 'la ventana se abre con el error');
      ok(/red ficticia/.test(await S(page, () => __s().querySelector('td.ik2-error')?.textContent)) && dialogos.length === 0, 'mensaje en línea, sin alert');
      ok(JSON.stringify(await S(page, () => __ev)) === '["red ficticia"]', 'SearchError');
      await S(page, () => { window.__falla = false; });
      await clicShadow(page, '#ik2_reintentar'); await esperar(page, 120);
      ok((await S(page, () => __filas().length)) === 2, 'reintentar trae 2 filas');
    } },
    { id: 'ik2-timeout', titulo: 'B15: request-timeout corta la búsqueda lenta (abort) y avisa', attrs: 'theme="claro" request-timeout="100"', fn: async (page, ok) => {
      await S(page, () => { __retraso['arandela'] = 400; window.__ev = []; document.getElementById('ik').addEventListener('SearchError', e => __ev.push(e.detail.timeout)); });
      await S(page, () => { const f0 = window.fetch; window.fetch = (u, o) => new Promise((res, rej) => { if (o && o.signal) o.signal.addEventListener('abort', () => rej(new Error('abortada'))); f0(u, o).then(res); }); });
      await buscar(page, 'arandela', true, 250);
      ok(JSON.stringify(await S(page, () => __ev)) === '[true]' && /tardó demasiado/.test(await S(page, () => __s().querySelector('td.ik2-error')?.textContent)), JSON.stringify(await S(page, () => __ev)));
    } },
    { id: 'ik2-sin-tema-sin-timeout', titulo: 'Compatibilidad: sin tema y sin request-timeout no hay tiempo máximo', fn: async (page, ok, dialogos) => {
      await S(page, () => { __retraso['arandela'] = 600; });
      await buscar(page, 'arandela', true, 800);
      ok((await S(page, () => __filas().length)) === 2 && dialogos.length === 0, 'llegan los resultados');
      ok((await S(page, () => document.getElementById('ik').RequestTimeout)) === 0, 'RequestTimeout = 0');
    } },
    // ===== strict / validez (B10)
    { id: 'ik2-strict', titulo: 'B10: strict con tema: sin resultados no abre la ventana; el campo queda inválido; checkValidity y validationMessage', attrs: 'theme="claro" strict="true"', fn: async (page, ok) => {
      await S(page, () => __s().getElementById('input_search_container').focus());
      await page.keyboard.type('XYZ'); await page.keyboard.press('Enter'); await esperar(page, 120);
      ok(!(await ev(page, () => __abierta())), 'no abre la ventana vacía');
      const r = await S(page, () => { const ik = document.getElementById('ik'); return { inv: __s().getElementById('container').classList.contains('ik2-invalido'), msg: __s().getElementById('ik2_msg')?.textContent, cv: ik.checkValidity(), vm: ik.validationMessage, inputv: ik.inputv.validationMessage }; });
      ok(r.inv && /XYZ/.test(r.msg) && r.cv === false && /XYZ/.test(r.vm) && r.inputv === r.vm, JSON.stringify(r));
      await S(page, () => { const i = __s().getElementById('input_search_container'); i.value = ''; }); await page.keyboard.type('C-002'); await page.keyboard.press('Enter'); await esperar(page, 120);
      ok((await S(page, () => document.getElementById('ik').checkValidity())) === true && !(await S(page, () => __s().getElementById('container').classList.contains('ik2-invalido'))), 'válido al elegir');
    } },
    { id: 'ik2-required', titulo: 'B10: required: checkValidity()/reportValidity() delegan en inputv; con tema, mensaje en línea', attrs: 'theme="claro" required="true"', fn: async (page, ok, dialogos) => {
      const r = await S(page, () => { const ik = document.getElementById('ik'); return { cv: ik.checkValidity(), rv: ik.reportValidity(), msg: __s().getElementById('ik2_msg')?.textContent, missing: ik.validity.valueMissing }; });
      ok(r.cv === false && r.rv === false && r.missing === true && /obligatorio/.test(r.msg) && dialogos.length === 0, JSON.stringify(r));
      await buscar(page, 'C-002');
      ok((await S(page, () => document.getElementById('ik').checkValidity())) === true, 'válido con valor');
    } },
    { id: 'ik2-no-formassociated', titulo: 'B10: input-key no es formAssociated: form.elements[name] sigue siendo el inputv', pagina: { body: '<form id="f"><input-key id="ik3" name="cliente" data-key="id" data-search="clave" data-text="nombre" data-value=\'{"id":2,"clave":"C-002","nombre":"x"}\'></input-key></form>' }, fn: async (page, ok) => {
      const r = await S(page, () => { const e = document.getElementById('f').elements['cliente']; return { tag: e && e.tagName, value: e && e.value }; });
      ok(r.tag === 'INPUT' && r.value === '2', JSON.stringify(r));
    } },
    // ===== search-case (B16), autoselect exact (B13)
    { id: 'ik2-search-case', titulo: 'B16: search-case="keep" manda el texto tal cual; por omisión en minúsculas', attrs: 'search-case="keep"', fn: async (page, ok) => {
      await buscar(page, 'C-002');
      ok((await ev(page, () => __pet[0].q)) === 'C-002', await ev(page, () => __pet[0].q));
    } },
    { id: 'ik2-autoselect-exact', titulo: 'B13: autoselect="exact": entre varios resultados, si uno solo es exacto, se elige', attrs: 'autoselect="exact"', fn: async (page, ok) => {
      await buscar(page, 'C-003');
      ok(!(await ev(page, () => __abierta())) && JSON.stringify(await ev(page, () => __cambios)) === '["C-003"]', JSON.stringify(await ev(page, () => __cambios)));
      await buscar(page, 'arandela');
      ok(await ev(page, () => __abierta()), 'sin exacto: abre la lista');
    } },
    // ===== Ancho del código y textos
    { id: 'ik2-key-chars', titulo: 'Ancho del código: key-min-chars / key-max-chars en ch (área de texto: sin el relleno, que con border-box va incluido)', attrs: 'theme="claro" key-min-chars="6" key-max-chars="10"', fn: async (page, ok) => {
      const r = await S(page, () => { const i = __s().getElementById('input_search_container'); const c = document.createElement('canvas').getContext('2d'); const st = getComputedStyle(i); c.font = st.fontSize + ' ' + st.fontFamily; const ch = c.measureText('0').width; const px = st.boxSizing === 'border-box' ? parseFloat(st.paddingLeft) + parseFloat(st.paddingRight) : 0; return { min: (parseFloat(st.minWidth) - px) / ch, max: (parseFloat(st.maxWidth) - px) / ch }; });
      ok(Math.abs(r.min - 6) < 0.3 && Math.abs(r.max - 10) < 0.3, JSON.stringify(r));
    } },
    { id: 'ik2-textos', titulo: 'A11: texts (JSON) e InputKey.texts traducen la interfaz', attrs: `theme="claro" texts='{"accept":"OK","cancel":"Cancel"}'`, fn: async (page, ok) => {
      const r = await S(page, () => Array.from(__s().querySelectorAll('#search_container2 > .modal-section:last-child button')).map(b => b.textContent));
      ok(JSON.stringify(r) === '["OK","Cancel"]', JSON.stringify(r));
    } },
    // ===== Construcción tardía (riesgo del inventario: solo DOMContentLoaded)
    { id: 'ik2-tardio', titulo: 'Construcción: insertado después de cargar se construye con y sin atributos nuevos (IK-7; antes, sin ellos, no)', fn: async (page, ok) => {
      const r = await S(page, async () => {
        const a = document.createElement('input-key'); a.setAttribute('data-key', 'id'); document.body.appendChild(a);
        const b = document.createElement('input-key'); b.setAttribute('data-key', 'id'); b.setAttribute('theme', 'claro'); document.body.appendChild(b);
        await new Promise(r => setTimeout(r, 30));
        return { sin: !!a.shadowRoot, con: !!b.shadowRoot && b.shadowRoot.getElementById('container').classList.contains('ik2') };
      });
      ok(r.sin === true && r.con === true, JSON.stringify(r));
    } },
  ];
};
