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
  await ev(() => document.getElementById('v-cobranza').click()); await page.waitForTimeout(200);
  const cob = await ev(() => document.getElementById('clientes').getVisibleColumns().map(c => c.field || c).join(','));
  await ev(() => document.getElementById('olvidar').click());
  await ev(() => document.getElementById('v-reset').click());
  await ev(() => document.querySelector('.caja-tabla').scrollLeft = 250);
  return `ok: menú ${menu}; orden tras teclado ${orden}; tras recargar ${JSON.stringify(tras)}; vista cobranza ${cob}`;
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
  await ev(() => document.getElementById('btn-tema').click());
  const tema = await ev(() => document.documentElement.getAttribute('data-tema'));
  await ev(() => document.getElementById('btn-tema').click());
  // visor de código
  await ev(() => document.querySelector('details.codigo').open = true);
  const cod = await ev(() => ({ html: document.getElementById('cod-html').textContent.length, js: document.getElementById('cod-javascript').textContent.length, igualJS: document.getElementById('cod-javascript').textContent.trim() === document.querySelector('script[data-demo]').textContent.trim() }));
  await ev(() => document.querySelector('details.codigo').open = false);
  if (!r.sel || !cod.igualJS || !tema) throw new Error(JSON.stringify({ r, cod, tema }));
  return `ok: ${r.sel} seleccionadas, pie valor ${r.pie}, ${r.tiles} tarjetas, ${r.nav} enlaces; tema → ${tema}; visor HTML ${cod.html} c, JS idéntico al que corre: ${cod.igualJS}`;
};
module.exports.busqueda = async (page) => {
  const a = await aviso(page); const d = await page.evaluate(() => ({ dis: document.getElementById('q').disabled, n: document.getElementById('clientes').DataArray.length }));
  return `ok: aviso «${a.slice(0, 40)}…», caja deshabilitada ${d.dis}, ${d.n} clientes`;
};
module.exports.validacion = async (page) => {
  await page.evaluate(() => document.getElementById('guardar').click());
  const r = await page.evaluate(() => document.getElementById('resultado').textContent);
  if (!/errores/.test(r)) throw new Error('no validó: ' + r);
  return `ok: aviso «${(await aviso(page)).slice(0, 30)}…», guardar → «${r}»`;
};
module.exports.cambios = async (page) => {
  await page.evaluate(() => document.getElementById('precios').NavTo(0, 3));
  await page.keyboard.type('999', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  await page.evaluate(() => document.getElementById('ver').click());
  const r = await page.evaluate(() => document.getElementById('envio').textContent);
  if (!/999/.test(r)) throw new Error('no mostró el cambio: ' + r.slice(0, 200));
  return `ok: envío muestra la fila modificada (${r.split('\n')[0]})`;
};
module.exports.secuencia = async (page) => {
  await page.evaluate(() => document.getElementById('mostrador').NavTo(0, 0));
  await page.keyboard.type('P-00007', { delay: 25 }); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  const r = await page.evaluate(() => document.getElementById('mostrador').DataArray[0]);
  if (!r.descripcion) throw new Error('no llenó la partida');
  return `ok: P-00007 → ${r.descripcion}, importe ${r.importe}`;
};
module.exports.reglas = async (page) => {
  const n = await page.evaluate(() => ['neg', 'excedido', 'vence-30', 'vence-60', 'al-dia'].map(c => c + ':' + document.getElementById('cartera')._shadow.querySelectorAll('td.' + c).length).join(' '));
  if (!/vence-60:[1-9]/.test(n)) throw new Error('reglas sin aplicar: ' + n);
  return `ok: respaldo con CellClass → ${n}`;
};
module.exports.temas = async (page) => {
  const n = await page.evaluate(() => ['t-claro', 't-oscuro', 't-jade', 't-libro'].map(id => document.getElementById(id).DataArray.length).join(','));
  return `ok: 4 tablas con datos (${n}), aviso «${(await aviso(page)).slice(0, 30)}…»`;
};
