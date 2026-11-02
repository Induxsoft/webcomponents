// Interacción clave por página. Cada función recibe la página y devuelve un texto con el resultado (o lanza).
const sh = (id) => `document.getElementById('${id}')._shadow`;
const ok = (c, m) => { if (!c) throw new Error(m); };
module.exports = {
  async edicion(page) {
    const v0 = await page.evaluate(() => document.getElementById('compra').DataArray[0].cantidad);
    await page.keyboard.type('25', { delay: 25 }); await page.keyboard.press('Enter');
    const v1 = await page.evaluate(() => document.getElementById('compra').DataArray[0].cantidad);
    ok(v1 === '25', 'cantidad no se editó: ' + v0 + ' -> ' + v1);
    await page.evaluate(() => document.getElementById('compra').NavTo(1, 0));
    await page.keyboard.press('F4'); await page.waitForTimeout(200);
    const abierto = await page.evaluate(() => document.getElementById('buscador').open);
    ok(abierto, 'F4 no abrió el buscador');
    await page.keyboard.type('P-00010', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    const cod = await page.evaluate(() => document.getElementById('compra').DataArray[1].codigo);
    ok(cod === 'P-00010', 'no eligió del buscador: ' + cod);
    const n0 = await page.evaluate(() => document.getElementById('compra').DataArray.length);
    await page.evaluate(() => document.getElementById('compra').NavTo(2, 3));
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(100);
    const n1 = await page.evaluate(() => document.getElementById('compra').DataArray.length);
    ok(n1 === n0 + 1, 'AutoAddRow no agregó: ' + n0 + ' -> ' + n1);
    return `ok: edición 25, F4 eligió ${cod}, AutoAddRow ${n0}→${n1}`;
  },
};
module.exports.venta = async (page) => {
  const t = () => page.evaluate(() => { const t = document.getElementById('factura'); return { n: t.DataArray.length, imp: t.getSummary && t.getSummary('importe'), total: document.getElementById('total').textContent, p0: t.DataArray[0].precio }; });
  const a = await t();
  await page.evaluate(() => document.getElementById('factura').NavTo(0, 4));
  await page.keyboard.type('=1200-15%', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const b = await t();
  if (b.p0 !== '1020') throw new Error('calc no dio 1020: ' + b.p0);
  if (a.total === b.total) throw new Error('total no cambió');
  // desplazar a la derecha para ver columnas fijas
  await page.evaluate(() => { document.querySelector('.caja-tabla').scrollLeft = 300; });
  return `ok: calc precio=${b.p0}, subtotal pie ${a.imp}→${b.imp}, total ${a.total}→${b.total}`;
};
module.exports.mascaras = async (page) => {
  const ev = (f) => page.evaluate(f);
  await ev(() => document.getElementById('clientes').NavTo(1, 1));
  await page.keyboard.type('EKU9003173C8', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const malo = await ev(() => ({ rfc: document.getElementById('clientes').DataArray[1].rfc, aviso: document.getElementById('avisos-mascara').textContent }));
  if (!/checksum|invalid/.test(malo.aviso)) throw new Error('no hubo MaskInvalid: ' + JSON.stringify(malo));
  await page.keyboard.press('Escape');
  await ev(() => document.getElementById('es').NavTo(0, 1));
  await page.keyboard.type('1.234,5', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  await ev(() => document.getElementById('mx').NavTo(1, 1));
  await page.keyboard.type('1,234.5', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  await ev(() => document.getElementById('es').NavTo(2, 1));
  await page.keyboard.type('=100,5*2', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  const r = await ev(() => ({ es0: document.getElementById('es').DataArray[0].importe, mx1: document.getElementById('mx').DataArray[1].importe, es2: document.getElementById('es').DataArray[2].importe }));
  if (r.es0 !== '1234.5' || r.mx1 !== '1234.5' || r.es2 !== '201') throw new Error('canónicos: ' + JSON.stringify(r));
  return 'ok: MaskInvalid «' + malo.aviso.slice(0, 60) + '», canónicos ' + JSON.stringify(r);
};
module.exports.eventos = async (page) => {
  const ev = (f) => page.evaluate(f);
  await ev(() => document.getElementById('conteo').NavTo(1, 4));
  await page.keyboard.type('2.5', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  const a = await ev(() => ({ c: document.getElementById('conteo').DataArray[1].conteo, b: document.getElementById('bitacora').textContent }));
  if (!/entero/.test(a.b)) throw new Error('no canceló 2.5');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await ev(() => document.getElementById('conteo').NavTo(1, 4));
  await page.keyboard.type('7', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  const b = await ev(() => ({ c: document.getElementById('conteo').DataArray[1], est: document.getElementById('estado').textContent }));
  if (b.c.conteo !== '7' || !/sin guardar/.test(b.est)) throw new Error('no editó o IsDirty: ' + JSON.stringify(b));
  await ev(() => document.getElementById('deshacer').click());
  const c = await ev(() => ({ c: document.getElementById('conteo').DataArray[1].conteo, est: document.getElementById('estado').textContent }));
  if (c.est !== 'Sin cambios') throw new Error('restore no limpió IsDirty: ' + JSON.stringify(c));
  // pasillo C cerrado: la fila 2
  await ev(() => document.getElementById('conteo').NavTo(2, 4));
  const d = await ev(() => document.getElementById('conteo').CurrentRowIndex());
  return `ok: 2.5 cancelado, 7 → dif ${b.c.diferencia}, restore → ${c.c} (${c.est}), NavTo a pasillo C → fila actual ${d}`;
};
module.exports.catalogo = async (page) => {
  const ev = (f) => page.evaluate(f);
  await ev(() => document.getElementById('recorrer').click());
  await page.waitForTimeout(3500);
  const m = await ev(() => ({ n: document.getElementById('catalogo').DataArray.length, carga: document.getElementById('m-carga').textContent, fps: document.getElementById('m-fps').textContent, peor: document.getElementById('m-peor').textContent, dom: document.getElementById('m-dom').textContent }));
  const tr = await ev(() => document.getElementById('catalogo').GetTBody().querySelectorAll('tr:not(.et-spacer)').length);
  if (m.n !== 20000 || tr > 200) throw new Error('virtual: ' + JSON.stringify(m) + ' tr=' + tr);
  // ordenar por precio con clic en el encabezado
  await ev(() => { const th = document.getElementById('catalogo')._shadow.querySelector('thead th[field="precio"]'); th.click(); });
  await page.waitForTimeout(400);
  const o = await ev(() => ({ orden: document.getElementById('m-orden').textContent, p0: document.getElementById('catalogo').DataArray[0].precio, p1: document.getElementById('catalogo').DataArray[1].precio }));
  if (!(o.p0 <= o.p1) && !(o.p0 >= o.p1)) throw new Error('orden');
  await ev(() => document.getElementById('ir').click()); await page.waitForTimeout(300);
  const fila = await ev(() => document.getElementById('catalogo').CurrentRowIndex());
  if (fila !== 14999) throw new Error('NavTo 15000: ' + fila);
  await ev(() => document.getElementById('desplazable').scrollTop = 0); await page.waitForTimeout(200);
  return `ok: ${m.n} filas, carga ${m.carga}, ${m.fps} fps, peor ${m.peor}, ${tr} tr en DOM, orden ${o.orden}, NavTo→${fila}`;
};
module.exports.cfdi = async (page) => {
  const ev = (f) => page.evaluate(f);
  await ev(() => document.getElementById('sel-ppd').click()); await page.waitForTimeout(150);
  const a = await ev(() => ({ n: document.getElementById('cfdi').getSelectedRows().length, tot: document.getElementById('cfdi').getSummary('total'), res: document.getElementById('resumen').textContent }));
  if (!a.n) throw new Error('sin selección');
  // casilla de la primera fila
  await ev(() => { const cb = document.getElementById('cfdi')._shadow.querySelector('tbody td.et-sel-col input'); cb.click(); });
  const b = await ev(() => document.getElementById('cfdi').getSelectedRows().length);
  await ev(() => document.getElementById('copiar').click());
  const tsv = await ev(() => document.getElementById('salida').textContent);
  if (!tsv.includes('\t')) throw new Error('copiar sin TSV');
  const [d] = await Promise.all([page.waitForEvent('download'), ev(() => document.getElementById('xlsx').click())]);
  const fs = require('fs'); const p = await d.path(); const buf = fs.readFileSync(p);
  if (buf.slice(0, 2).toString() !== 'PK') throw new Error('xlsx no es zip');
  const [d2] = await Promise.all([page.waitForEvent('download'), ev(() => document.getElementById('csv').click())]);
  const csv = fs.readFileSync(await d2.path(), 'utf8');
  return `ok: PPD ${a.n} sel (total pie ${a.tot}), casilla → ${b}, TSV ${tsv.split('\n').length} renglones, XLSX ${buf.length} B (${d.suggestedFilename()}), CSV ${csv.split('\n').length} renglones`;
};
module.exports.agrupacion = async (page) => {
  const ev = (f) => page.evaluate(f);
  const a = await ev(() => { const t = document.getElementById('ventas'); return { g: t.getGroups(), filas: t._shadow.querySelectorAll('tr.et-group-row').length }; });
  // arrastrar el encabezado «Línea» al panel (eventos HTML5 simulados: el shadow es cerrado)
  const b = await ev(() => {
    const t = document.getElementById('ventas'), s = t._shadow;
    const th = s.querySelector('thead th[field="linea"]'), panel = s.querySelector('.et-group-panel');
    const dt = new DataTransfer();
    th.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, composed: true, dataTransfer: dt }));
    panel.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, composed: true, dataTransfer: dt }));
    panel.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, composed: true, dataTransfer: dt }));
    panel.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, composed: true, dataTransfer: dt }));
    th.dispatchEvent(new DragEvent('dragend', { bubbles: true, composed: true, dataTransfer: dt }));
    return t.getGroups();
  });
  if (b.length !== 3 || !b.includes('linea')) throw new Error('drag al panel: ' + JSON.stringify(b));
  // teclado: Enter sobre la primera fila de grupo
  await ev(() => document.getElementById('por-region').click());
  await ev(() => document.getElementById('colapsar').click());
  const antes = await ev(() => document.getElementById('ventas')._shadow.querySelectorAll('tbody tr:not(.et-group-row):not(.hidde-row)').length);
  await ev(() => { const s = document.getElementById('ventas')._shadow; const l = s.querySelector('tr.et-group-row .et-group-label') || s.querySelector('tr.et-group-row td'); l.focus(); l.click(); });
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const exp = await ev(() => [...document.getElementById('ventas')._shadow.querySelectorAll('tr.et-group-row')].map(tr => tr.getAttribute('aria-expanded')).slice(0, 3).join(','));
  await ev(() => { const t = document.getElementById('ventas'); t.GroupBy(['region', 'vendedor']); t.CollapseAllGroups(); t.ExpandGroup(['Sur']); t.ExpandGroup(['Sur', 'Ana Cruz']); });
  return `ok: inicio ${JSON.stringify(a.g)} (${a.filas} filas de grupo), arrastre → ${JSON.stringify(b)}, teclado aria-expanded ${exp}`;
};
module.exports['agrupacion:despues'] = async (page) => { await page.reload(); await page.waitForTimeout(500); };
module.exports.columnas = async (page) => {
  const ev = (f) => page.evaluate(f);
  // menú contextual y casilla de Teléfono
  const menu = await ev(() => {
    const s = document.getElementById('clientes')._shadow;
    const th = s.querySelector('thead th[field="telefono"]'); const r = th.getBoundingClientRect();
    th.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, composed: true, clientX: r.x + 5, clientY: r.y + 5 }));
    const m = s.querySelector('.et-chooser.et-open'); if (!m) return 'sin menú';
    const lab = [...m.querySelectorAll('label')].find(l => /Teléfono/.test(l.textContent)); lab.querySelector('input').click();
    return [...m.querySelectorAll('label')].length + ' casillas';
  });
  await page.keyboard.press('Escape');
  const vis = await ev(() => document.getElementById('clientes').IsColumnVisible('telefono'));
  if (vis) throw new Error('el menú no ocultó Teléfono (' + menu + ')');
  // teclado: mover Vendedor a la izquierda
  await ev(() => { const th = document.getElementById('clientes')._shadow.querySelector('thead th[field="vendedor"]'); th.tabIndex = 0; th.focus(); });
  await page.keyboard.press('Control+Shift+ArrowLeft'); await page.waitForTimeout(100);
  const orden = await ev(() => document.getElementById('clientes').Columns.map(c => c.field).join(','));
  await page.waitForTimeout(900); // guardado con retraso de 500 ms
  await page.reload(); await page.waitForTimeout(800);
  const tras = await ev(() => ({ vis: document.getElementById('clientes').IsColumnVisible('telefono'), orden: document.getElementById('clientes').Columns.map(c => c.field).join(',') }));
  if (tras.vis) throw new Error('no se restauró de IndexedDB');
  const rest = await ev(() => ({ listo: document.getElementById('listo').textContent, ev: document.getElementById('eventos').textContent, ready: document.getElementById('clientes').LayoutReady instanceof Promise }));
  if (!/^true/.test(rest.listo) || !/reason: restore/.test(rest.ev) || !rest.ready) throw new Error('whenLayoutReady / restore: ' + JSON.stringify(rest));
  await ev(() => document.getElementById('v-cobranza').click()); await page.waitForTimeout(200);
  const cob = await ev(() => document.getElementById('clientes').getVisibleColumns().map(c => c.field || c).join(','));
  await ev(() => document.getElementById('olvidar').click());
  await ev(() => document.getElementById('v-reset').click());
  await ev(() => document.querySelector('.caja-tabla').scrollLeft = 250);
  return `ok: menú ${menu}; orden tras teclado ${orden}; tras recargar ${JSON.stringify(tras)}, whenLayoutReady «${rest.listo}», LayoutChanged restore; vista cobranza ${cob}`;
};
module.exports.arbol = async (page) => {
  const ev = (f) => page.evaluate(f);
  const vis = () => ev(() => [...document.getElementById('cuentas').GetTBody().querySelectorAll('tr')].filter(tr => !tr.classList.contains('hidde-row')).length);
  await ev(() => document.querySelector('[data-nivel="1"]').click()); const n1 = await vis();
  await ev(() => document.querySelector('[data-nivel="3"]').click()); const n3 = await vis();
  await ev(() => document.querySelector('[data-nivel="2"]').click()); const n2 = await vis();
  if (!(n1 < n2 && n2 < n3)) throw new Error(`niveles ${n1}/${n2}/${n3}`);
  await ev(() => document.getElementById('cuentas').NavTo(1, 1));
  await page.keyboard.type('Caja y efectivo', { delay: 20 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  const nom = await ev(() => document.getElementById('cuentas').DataArray[1].nombre);
  const neg = await ev(() => document.getElementById('cuentas')._shadow.querySelectorAll('td.negativo').length);
  if (nom !== 'Caja y efectivo') throw new Error('no renombró: ' + nom);
  return `ok: filas visibles por nivel ${n1}/${n2}/${n3}, renombrada «${nom}», ${neg} saldos negativos pintados`;
};
module.exports.tarjetas = async (page) => {
  const ev = (f) => page.evaluate(f);
  const a = await ev(() => document.getElementById('pedidos').IsCardView);
  await ev(() => { const r = document.getElementById('ancho'); r.value = 400; r.dispatchEvent(new Event('input')); });
  await page.waitForTimeout(500);
  const b = await ev(() => ({ c: document.getElementById('pedidos').IsCardView, m: document.getElementById('modo').textContent }));
  if (a || !b.c) throw new Error('no cambió a tarjetas: ' + a + ' ' + JSON.stringify(b));
  return `ok: 1000 px → tabla, 400 px → ${b.m}`;
};
module.exports.impresion = async (page) => {
  const ev = (f) => page.evaluate(f);
  const vis = () => ev(() => { const t = document.getElementById('nomina'); return ['puesto', 'cuenta'].map(f => t.IsColumnVisible(f)).join(','); });
  const a = await vis();
  await ev(() => document.getElementById('vista').click()); const b = await vis();
  await ev(() => document.getElementById('vista').click()); const c = await vis();
  if (a !== 'true,true' || b !== 'false,false' || c !== 'true,true') throw new Error(`visibilidad ${a} / ${b} / ${c}`);
  // impresión real: PDF de la página con medios de impresión
  await page.emulateMedia({ media: 'print' });
  await ev(() => window.dispatchEvent(new Event('beforeprint')));
  await page.screenshot({ path: require('path').join(process.env.CAPTURAS || require('os').tmpdir(), 'impresion-medio-print.png'), fullPage: true });
  await ev(() => window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });
  return `ok: columnas puesto,cuenta ${a} → vista previa ${b} → al salir ${c}; captura con media=print`;
};
module.exports.compatibilidad = async (page) => {
  const ev = (f) => page.evaluate(f);
  const chips = await ev(() => document.getElementById('compat').textContent);
  if (/✗/.test(chips)) throw new Error('comprobaciones v1: ' + chips);
  await ev(() => document.getElementById('btn-costo').click());
  const oculto = await ev(() => document.getElementById('tbl_cotizacion')._shadow.querySelector('thead th[field="costo"]').classList.contains('hidde-col'));
  await ev(() => document.getElementById('btn-costo').click());
  await ev(() => document.getElementById('tbl_cotizacion').NavTo(1, 4));
  await page.keyboard.type('2000', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const r = await ev(() => ({ p: document.getElementById('tbl_cotizacion').DataArray[1].precio, est: document.getElementById('lbl-estado').innerText, rojo: document.getElementById('tbl_cotizacion')._shadow.querySelectorAll('tbody td[style*="color"]').length }));
  if (r.p !== '2000' || r.est !== 'Con cambios' || !oculto) throw new Error(JSON.stringify(r) + ' oculto=' + oculto);
  return `ok: ${chips.replace(/✓ /g, '| ')}; hideColumn ${oculto}; precio ${r.p}, ${r.est}, celdas pintadas ${r.rojo}`;
};
const aviso = (page) => page.evaluate(() => (document.getElementById('aviso') || {}).textContent || '');
module.exports.index = async (page) => {
  const ev = (f) => page.evaluate(f);
  const r = await ev(() => ({ sel: document.getElementById('hero').getSelectedRows().length, pie: document.getElementById('hero').getSummary('valor'), tiles: document.querySelectorAll('#mosaico .estado').length, nav: document.querySelectorAll('#sitio-nav a').length }));
  // tema oscuro con el botón
  const th0 = await ev(() => document.getElementById('hero').getAttribute('theme'));
  await ev(() => document.getElementById('btn-tema').click());
  const tema = await ev(() => document.documentElement.getAttribute('data-tema'));
  const th1 = await ev(() => document.getElementById('hero').getAttribute('theme') + '/' + document.getElementById('hero').Theme);
  await ev(() => document.getElementById('btn-tema').click());
  const otro = th0 === 'oscuro' ? 'claro' : 'oscuro';
  if (!['claro', 'oscuro'].includes(th0) || th1 !== otro + '/' + otro) throw new Error('el botón del sitio no cambió theme de la tabla: ' + th0 + ' → ' + th1);
  // visor de código
  await ev(() => document.querySelector('details.codigo').open = true);
  const cod = await ev(() => ({ html: document.getElementById('cod-html').textContent.length, js: document.getElementById('cod-javascript').textContent.length, igualJS: document.getElementById('cod-javascript').textContent.trim() === document.querySelector('script[data-demo]').textContent.trim() }));
  await ev(() => document.querySelector('details.codigo').open = false);
  if (!r.sel || !cod.igualJS || !tema) throw new Error(JSON.stringify({ r, cod, tema }));
  const pend = await ev(() => [...document.querySelectorAll('#mosaico .estado')].filter(e => /próximamente/.test(e.textContent)).map(e => e.parentNode.getAttribute('href')));
  if (pend.length) throw new Error('tarjetas sin disponible: ' + pend.join(','));
  const navPend = await ev(() => document.querySelectorAll('#sitio-nav .nav-pronto:not(.listo)').length);
  if (navPend) throw new Error(navPend + ' páginas marcadas como pendientes en el menú');
  return `ok: ${r.sel} seleccionadas, pie valor ${r.pie}, ${r.tiles} tarjetas, ${r.nav} enlaces; tema → ${tema} (theme de la tabla ${th0} → ${th1}); visor HTML ${cod.html} c, JS idéntico al que corre: ${cod.igualJS}`;
};
module.exports.busqueda = async (page) => {
  const ev = (f, a) => page.evaluate(f, a);
  const estado = () => ev(() => { const t = document.getElementById('catalogo'); return { vis: t.getFilteredIndices().length, n: t.DataArray.length, cuenta: t.getSummary('descripcion'), grupos: t._shadow.querySelectorAll('tr.et-group-row').length, filas: document.getElementById('m-filas').textContent, busq: document.getElementById('m-busq').textContent }; });
  const a = await estado();
  ok(a.n === 20000 && a.vis === 20000, 'carga: ' + JSON.stringify(a));
  // Barra: escribir con acentos distintos («valvula» encuentra «Válvula»)
  await ev(() => document.getElementById('catalogo')._shadow.querySelector('.et-search-input').focus());
  await page.keyboard.type('valvula pvc', { delay: 20 }); await page.waitForTimeout(600);
  const b = await estado();
  ok(b.vis > 0 && b.vis < 20000, 'búsqueda no filtró: ' + JSON.stringify(b));
  const desc = await ev(() => { const t = document.getElementById('catalogo'); return t.getFilteredIndices().slice(0, 50).map(i => t.DataArray[i].descripcion); });
  ok(desc.every(d => /válvula/i.test(d) && /pvc/i.test(d)), 'coincidencias incorrectas: ' + desc.slice(0, 3));
  ok(Number(String(b.cuenta).replace(/\D/g, '')) === b.vis || b.cuenta == b.vis, 'el pie no sigue al filtro: ' + b.cuenta + ' vs ' + b.vis);
  // Enter en la barra: va a la coincidencia y el foco vuelve a la barra
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const cur = await ev(() => { const t = document.getElementById('catalogo'); return { fila: t.CurrentRowIndex(), foco: t._shadow.activeElement && t._shadow.activeElement.className }; });
  ok(cur.fila >= 0 && /et-search-input/.test(cur.foco), 'Enter en la barra: ' + JSON.stringify(cur));
  // Filtro por campo encima de la búsqueda: Plomería + bajo mínimo
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await ev(() => { const s = document.getElementById('f-linea'); s.value = 'Plomería'; s.onchange(); });
  const c = await estado();
  await ev(() => { const s = document.getElementById('f-bajo'); s.checked = true; s.onchange(); });
  const d = await estado();
  const todos = await ev(() => { const t = document.getElementById('catalogo'); return t.getFilteredIndices().every(i => t.DataArray[i].linea === 'Plomería' && t.DataArray[i].existencia < t.DataArray[i].minimo); });
  ok(c.vis > d.vis && d.vis > 0 && todos && d.grupos === 1, 'filtros por campo: ' + JSON.stringify({ c, d, todos }));
  await ev(() => document.getElementById('csv').click());
  const csv = await ev(() => document.getElementById('salida').textContent.split('\n')[0]);
  ok(csv.startsWith(String(d.vis) + ' filas'), 'CSV visibleOnly: ' + csv + ' vs ' + d.vis);
  // Incremental: no oculta y F3 avanza
  await ev(() => document.getElementById('limpiar').click());
  await ev(() => document.getElementById('incremental').click());
  await ev(() => document.getElementById('catalogo')._shadow.querySelector('.et-search-input').focus());
  await page.keyboard.press('Control+A'); await page.keyboard.type('tijera', { delay: 20 }); await page.waitForTimeout(500);
  const i1 = await ev(() => ({ fila: document.getElementById('catalogo').CurrentRowIndex(), vis: document.getElementById('catalogo').getFilteredIndices().length }));
  await page.keyboard.press('F3'); await page.waitForTimeout(150);
  const i2 = await ev(() => document.getElementById('catalogo').CurrentRowIndex());
  ok(i1.vis === 20000 && i1.fila >= 0 && i2 > i1.fila, 'incremental: ' + JSON.stringify({ i1, i2 }));
  // Para la captura: de vuelta a filtrar, con resaltado y grupos
  await ev(() => document.getElementById('incremental').click());
  await ev(() => document.getElementById('catalogo')._shadow.querySelector('.et-search-input').focus());
  await page.keyboard.press('Control+A'); await page.keyboard.type('cable 12', { delay: 10 }); await page.waitForTimeout(500);
  await ev(() => window.scrollTo(0, 0));
  return `ok: «valvula pvc» → ${b.vis} filas (pie ${b.cuenta}); Plomería ${c.vis} → bajo mínimo ${d.vis} (${d.grupos} grupo); CSV ${csv.split(' ')[0]} filas; incremental fila ${i1.fila} → F3 ${i2}`;
};
module.exports.validacion = async (page) => {
  const ev = (f) => page.evaluate(f);
  const est = () => ev(() => { const t = document.getElementById('compra'); return { fila: t.CurrentRowIndex(), errores: t.getErrors(), marcadas: t._shadow.querySelectorAll('td.et-cell-error[aria-invalid="true"]').length }; });
  await ev(() => document.getElementById('compra').NavTo(1, 2));
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
  const a = await est();
  ok(a.fila === 1 && a.errores.some(e => e.index === 1 && e.field === 'cantidad') && a.marcadas === 1, 'BeforeRowLeave no detuvo: ' + JSON.stringify(a));
  // BeforeUpdateCell con e.error: -5 se queda en edición
  await page.keyboard.type('-5', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const b = await ev(() => { const t = document.getElementById('compra'); return { dato: t.DataArray[1].cantidad, msg: (t.getErrors().find(e => e.index === 1) || {}).message, editando: !!t._shadow.querySelector('#__table_input') }; });
  ok(b.dato === '0' && /negativas/.test(b.msg || '') && b.editando, 'e.error: ' + JSON.stringify(b));
  await page.keyboard.press('Escape'); await page.waitForTimeout(80);
  await page.keyboard.type('6', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
  const c = await est();
  ok(c.fila === 2 && !c.errores.some(e => e.index === 1), 'corregida no avanzó: ' + JSON.stringify(c));
  await ev(() => document.getElementById('guardar').click());
  const d = await ev(() => ({ errores: document.getElementById('compra').getErrors().map(e => e.index + ':' + e.field), lista: document.querySelectorAll('#errores li').length, res: document.getElementById('resultado').textContent }));
  ok(d.errores.join() === '3:codigo,4:costo' && d.lista === 2, 'validar todo: ' + JSON.stringify(d));
  await ev(() => document.querySelector('#errores li:last-child a').click()); await page.waitForTimeout(150);
  const e = await est();
  ok(e.fila === 4, 'la lista no llevó a la celda: ' + e.fila);
  await ev(() => window.scrollTo(0, 0));
  return `ok: ↓ con cantidad 0 → se queda en la fila ${a.fila + 1} (${a.marcadas} celda marcada); -5 → «${b.msg.slice(0, 30)}…» sigue editando; corregida → fila ${c.fila + 1}; guardar → ${d.errores.join(', ')}; clic en la lista → fila ${e.fila + 1}`;
};
module.exports.cambios = async (page) => {
  const ev = (f) => page.evaluate(f);
  const n = () => ev(() => ['n-altas', 'n-cambios', 'n-bajas'].map(id => document.getElementById(id).textContent).join('/'));
  ok(await n() === '0/0/0', 'arranca con cambios: ' + await n());
  // cambio de precio, y volver al valor original lo quita
  await ev(() => document.getElementById('precios').NavTo(0, 4));
  const orig = await ev(() => document.getElementById('precios').DataArray[0].precio);
  await page.keyboard.type('999', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  const a = await n(); const j = await ev(() => document.getElementById('envio').textContent);
  ok(a === '0/1/0' && /"precio": "999"/.test(j) && !/"costo"/.test(j), 'cambio: ' + a + ' ' + j.slice(0, 200));
  await ev(() => document.getElementById('precios').NavTo(0, 4));
  await page.keyboard.type(orig, { delay: 15 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  const a2 = await n();
  ok(a2 === '0/0/0', 'volver al original no lo quitó: ' + a2);
  // alta: nace al escribir; baja con el botón
  await ev(() => document.getElementById('alta').click()); await page.waitForTimeout(100);
  await page.keyboard.type('N-0001', { delay: 20 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  const b = await n();
  await ev(() => { document.getElementById('precios').NavTo(2, 1); document.getElementById('baja').click(); });
  await ev(() => document.getElementById('subir').click());
  const c = await n(); const env = await ev(() => document.getElementById('envio').textContent);
  const nuevo = await ev(() => { const t = document.getElementById('precios'); return t.isNew(t.DataArray.length - 1); });
  ok(b === '1/0/0' && /^1\/\d+\/1$/.test(c) && Number(c.split('/')[1]) > 1 && /N-0001/.test(env) && nuevo, 'alta/baja: ' + b + ' → ' + c + ' isNew ' + nuevo);
  await ev(() => document.getElementById('guardar').click());
  const d = await n(); const g = await ev(() => document.getElementById('envio').textContent);
  ok(d === '0/0/0' && /Enviado/.test(g), 'AcceptChanges: ' + d);
  // para la captura: un par de cambios visibles
  await ev(() => document.getElementById('subir').click());
  await ev(() => document.getElementById('alta').click()); await page.keyboard.type('N-0002', { delay: 15 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  await ev(() => window.scrollTo(0, 0));
  return `ok: precio 999 → 0/1/0 y al regresar ${a2}; alta ${b}; baja + 5 % Pintura → ${c}; ${g.replace('// ', '').slice(0, 30)} → ${d}`;
};
module.exports.secuencia = async (page) => {
  const ev = (f) => page.evaluate(f);
  const pos = () => ev(() => { const t = document.getElementById('mostrador'); return t.CurrentRowIndex() + ':' + (t.Columns[t.CurrentColIndex()] || {}).field; });
  const orden = await ev(() => document.getElementById('mostrador').getCaptureOrder().join(','));
  ok(orden === 'codigo,cantidad,precio', 'getCaptureOrder: ' + orden);
  await page.keyboard.type('P-00007', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const p1 = await pos();
  await page.keyboard.type('3', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const p2 = await pos();
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  const p3 = await pos();
  const r0 = await ev(() => document.getElementById('mostrador').DataArray[0]);
  ok(p1 === '0:cantidad' && p2 === '0:precio' && p3 === '1:codigo' && r0.descripcion && r0.importe === String(Math.round(3 * Number(r0.precio) * 100) / 100), 'secuencia: ' + [p1, p2, p3].join(' → ') + ' ' + JSON.stringify(r0));
  // Lector de códigos: sin retraso entre teclas
  await page.keyboard.type('P-00042', { delay: 0 }); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  const r1 = await ev(() => document.getElementById('mostrador').DataArray[1]);
  const lector = await ev(() => document.getElementById('lector').textContent);
  ok(r1 && r1.codigo === 'P-00042' && r1.descripcion, 'el lector perdió caracteres: ' + JSON.stringify(r1));
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  // Tab en la fila nueva vacía: no agrega otra
  const n0 = await ev(() => document.getElementById('mostrador').DataArray.length);
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  const n1 = await ev(() => document.getElementById('mostrador').DataArray.length);
  const p4 = await pos();
  ok(n1 === n0, 'encadenó filas vacías: ' + n0 + ' → ' + n1);
  // modo down
  await ev(() => { const s = document.getElementById('modo'); s.value = 'down'; s.onchange(); document.getElementById('mostrador').NavTo(0, 3); });
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const p5 = await pos();
  ok(p5 === '1:cantidad', 'enter-mode down: ' + p5);
  await ev(() => { const s = document.getElementById('modo'); s.value = 'next-cell'; s.onchange(); document.getElementById('mostrador').NavTo(2, 0); });
  return `ok: orden ${orden}; P-00007⏎ 3⏎ ⏎ → ${[p1, p2, p3].join(' → ')}; lector «${lector}» → ${r1.descripcion}; Tab en fila vacía: ${n0}→${n1} filas (${p4}); down → ${p5}`;
};
module.exports.reglas = async (page) => {
  const ev = (f) => page.evaluate(f);
  const cuenta = () => ev(() => { const s = document.getElementById('inventario')._shadow; const q = (x) => s.querySelectorAll(x).length;
    return { ok: q('td[data-cell="existencia"].et-ok:not(.et-warn)'), bajo: q('td[data-cell="existencia"].et-err'), exceso: q('td[data-cell="existencia"].et-warn'), neg: q('td.et-neg'), vencido: q('td[data-et-icon="⛔"]'), porVencer: q('td[data-et-icon="⏳"]'), tachadas: q('tr.et-strike'), filaIcono: q('tr[data-et-icon]') }; });
  let a = await cuenta();
  if (!a.ok && !a.bajo) { // por si la celda no lleva data-cell: contar por columna
    a = await ev(() => { const t = document.getElementById('inventario'), s = t._shadow, k = t.Columns.findIndex(c => c.field === 'existencia'); const tds = [...s.querySelectorAll('tbody tr')].map(tr => tr.querySelectorAll('td')[k]).filter(Boolean); const q = (x) => s.querySelectorAll(x).length;
      return { ok: tds.filter(td => td.classList.contains('et-ok') && !td.classList.contains('et-warn')).length, bajo: tds.filter(td => td.classList.contains('et-err')).length, exceso: tds.filter(td => td.classList.contains('et-warn')).length, neg: q('td.et-neg'), vencido: q('td[data-et-icon="⛔"]'), porVencer: q('td[data-et-icon="⏳"]'), tachadas: q('tr.et-strike'), filaIcono: q('tr[data-et-icon]') }; });
  }
  ok(a.ok && a.bajo && a.exceso && a.neg && a.vencido && a.porVencer && a.tachadas && a.filaIcono, 'reglas sin aplicar: ' + JSON.stringify(a));
  // editar: una existencia sobrada pasa a bajo mínimo, y negativa gana el icono de fila
  const i = await ev(() => document.getElementById('inventario').DataArray.findIndex(r => r.dif_max > 0));
  await ev(`document.getElementById('inventario').NavTo(${i}, 2)`);
  await page.keyboard.type('1', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const b = await ev(`(() => { const t = document.getElementById('inventario'); const tr = t.GetTrByIndex(${i}); const td = tr.querySelectorAll('td')[t.Columns.findIndex(c => c.field === 'existencia') + (tr.querySelector('.et-sel-col') ? 1 : 0)]; return { cls: td.className, icono: td.getAttribute('data-et-icon') }; })()`);
  ok(/et-err/.test(b.cls) && !/et-warn/.test(b.cls) && b.icono === '▼', 'al editar no se reaplicó: ' + JSON.stringify(b));
  await ev(`document.getElementById('inventario').NavTo(0, 2)`);
  await ev(() => window.scrollTo(0, 0));
  return `ok: verdes ${a.ok}, bajo mínimo ${a.bajo}, sobre máximo ${a.exceso}, negativos ${a.neg} (${a.filaIcono} filas ⚠), vencidos ${a.vencido}, por vencer ${a.porVencer}, inactivas ${a.tachadas}; fila ${i + 1} con 1 → ${b.icono}`;
};
module.exports.temas = async (page) => {
  const ev = (f) => page.evaluate(f);
  const fondo = (id, sel) => ev(`getComputedStyle(document.getElementById('${id}')._shadow.querySelector('${sel}')).backgroundColor`);
  const cab = {};
  for (const id of ['t-claro', 't-oscuro', 't-jade', 't-libro', 'lab']) cab[id] = await fondo(id, 'thead');
  ok(new Set(Object.values(cab)).size === 5, 'encabezados iguales: ' + JSON.stringify(cab));
  ok(cab.lab === 'rgb(15, 61, 110)', 'defineTheme v12 no se aplicó: ' + cab.lab);
  const n = await ev(() => ['t-claro', 't-oscuro', 't-jade', 't-libro'].map(id => document.getElementById(id).DataArray.length).join(','));
  // cambiar de tema en caliente: sin redibujar (el mismo tr) y conservando la selección
  const antes = await ev(() => { const t = document.getElementById('lab'); window.__tr = t.GetTrByIndex(0); return t.getSelectedRows().length; });
  await ev(() => { const s = document.getElementById('tema'); s.value = 'oscuro'; s.onchange({ target: s }); });
  const os = await fondo('lab', 'thead');
  const tras = await ev(() => { const t = document.getElementById('lab'); return { mismo: window.__tr === t.GetTrByIndex(0), sel: t.getSelectedRows().length, th: t.Theme }; });
  ok(os === 'rgb(31, 36, 43)' && tras.mismo && tras.sel === antes && tras.th === 'oscuro', 'en caliente: ' + os + ' ' + JSON.stringify(tras));
  // paleta encima del tema
  await ev(() => { const i = document.querySelector('#colores input[data-clave="header-bg"]'); i.value = '#7a4b1f'; i.oninput(); });
  const pal = await fondo('lab', 'thead');
  ok(pal === 'rgb(122, 75, 31)', 'SetPalette no ganó: ' + pal);
  await ev(() => document.getElementById('sin-paleta').click());
  const sin = await fondo('lab', 'thead');
  ok(sin === os, 'SetPalette(null) no la quitó: ' + sin);
  await ev(() => { const d = document.getElementById('densidad'); d.value = 'compacta'; d.onchange({ target: d }); });
  const alto = await ev(() => document.getElementById('lab').GetTrByIndex(2).getBoundingClientRect().height);
  await ev(() => { const s = document.getElementById('tema'); s.value = 'v12'; s.onchange({ target: s }); const d = document.getElementById('densidad'); d.value = 'normal'; d.onchange({ target: d }); });
  const alto2 = await ev(() => document.getElementById('lab').GetTrByIndex(2).getBoundingClientRect().height);
  ok(alto < alto2, 'densidad: ' + alto + ' vs ' + alto2);
  // el botón del sitio no toca las tablas con theme propio
  await ev(() => document.getElementById('btn-tema').click());
  const propio = await ev(() => document.getElementById('t-jade').getAttribute('theme'));
  await ev(() => document.getElementById('btn-tema').click());
  ok(propio === 'jade', 'el sitio cambió una tabla con theme propio: ' + propio);
  await ev(() => window.scrollTo(0, 0));
  return `ok: 4 muestras (${n}) con encabezados distintos; v12 ${cab.lab}; oscuro en caliente ${os} (mismo tr: ${tras.mismo}, ${tras.sel} seleccionadas); palette ${pal} → null ${sin}; fila compacta ${alto} px vs normal ${alto2} px`;
};
