// v2 §5: exportar. Parte del componente (getExportData, exportCSV, downloadCSV) y biblioteca InduxsoftExcel
// (fromArray, fromTable, fromEditTable, fromData, workbook, download, toCSV), con R7 (locale).
// Los XLSX se generan en el navegador, se guardan en out/tmp y se validan con Python + openpyxl.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { tabla, PRODUCTOS, paginaProductos, CLIENTES } from '../lib/fixtures.mjs';
import { registro, m } from '../lib/v2.mjs';
import { Falla } from '../lib/arnes.mjs';

// ---------- componente ----------
const { P, t } = registro('exp', { requiere: ['export'] });
const COLS = [
  { field: 'codigo', type: 'Text', title: 'Código' },
  { field: 'nombre', type: 'Text', title: 'Nombre' },
  { field: 'linea', type: 'Text', title: 'Línea', class: 'no-print' },
  { field: 'cantidad', type: 'Number', title: 'Cantidad' },
  { field: 'precio', type: 'Number', title: 'Precio', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' },
];
const pag = (a = {}, data = PRODUCTOS) => ({ body: tabla({ a, cols: COLS, data }) });

t('01', 'getExportData() devuelve {columns, rows, summary}; columns con field, title, type, format, width', ['§5-i'], async (c) => {
  await c.abrir(pag());
  const r = await m(c, 't1', 'getExportData');
  c.ok(r && Array.isArray(r.columns) && Array.isArray(r.rows) && 'summary' in r, 'forma: ' + JSON.stringify(Object.keys(r ?? {})));
  c.igual(r.columns.map(x => x.field), ['codigo', 'nombre', 'cantidad', 'precio'], 'excluye no-print');
  c.ok(['field', 'title', 'type'].every(k => k in r.columns[0]), 'claves de columna: ' + Object.keys(r.columns[0]));
  c.igual(r.rows.length, 4);
});
t('02', 'getExportData respeta el orden y la visibilidad; includeHidden incluye las ocultas', ['§5-i', '§5-h'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').hideColumn('nombre', true));
  c.igual((await m(c, 't1', 'getExportData')).columns.map(x => x.field), ['codigo', 'cantidad', 'precio']);
  c.igual((await m(c, 't1', 'getExportData', { includeHidden: true })).columns.map(x => x.field), ['codigo', 'nombre', 'cantidad', 'precio']);
});
t('03', 'getExportData({selectedOnly:true}) con selección', ['§5-i'], async (c) => {
  await c.abrir(pag({ 'multi-select': 'row' }));
  await c.ev(() => __ct.t('t1').SelectRows([1, 2]));
  const r = await m(c, 't1', 'getExportData', { selectedOnly: true });
  c.igual(r.rows.length, 2);
}, { requiere: ['multiselect'] });
t('04', 'getExportData lleva summary cuando hay totales', ['§5-i', '§2-g'], async (c) => {
  await c.abrir({ body: tabla({ cols: COLS.map(x => x.field === 'cantidad' ? { ...x, summary: 'sum' } : x), data: PRODUCTOS }) });
  const r = await m(c, 't1', 'getExportData');
  c.igual(r.summary && r.summary.cantidad, 25);
}, { requiere: ['summary'] });
t('05', 'exportCSV: RFC 4180 (comillas, comas, saltos de línea), excluye no-print, títulos primero', ['§5-j'], async (c) => {
  await c.abrir(pag({}, [{ codigo: 'A,1', nombre: 'Dice "hola"', linea: 'x', cantidad: 1, precio: 1 }, { codigo: 'B', nombre: 'dos\nlíneas', linea: 'y', cantidad: 2, precio: 1234.5 }]));
  const csv = await m(c, 't1', 'exportCSV', { raw: true });
  const lineas = csv.replace(/^\uFEFF/, '').split(/\r\n/);
  c.igual(lineas[0], 'Código,Nombre,Cantidad,Precio');
  c.igual(lineas[1], '"A,1","Dice ""hola""",1,1');
  c.igual(lineas.slice(2).join('\r\n').startsWith('B,"dos\nlíneas",2,1234.5'), true, 'fila con salto de línea: ' + JSON.stringify(lineas.slice(2)));
});
t('06', 'exportCSV usa los valores formateados por omisión', ['§5-j'], async (c) => {
  await c.abrir(pag({}, [PRODUCTOS[3]]));
  const csv = (await m(c, 't1', 'exportCSV')).replace(/^\uFEFF/, '');
  c.contiene(csv, '$35.90');
});
t('07', 'downloadCSV(fileName) descarga el archivo con ese nombre y el mismo contenido', ['§5-j'], async (c) => {
  await c.abrir(pag());
  const [dl] = await Promise.all([c.page.waitForEvent('download', { timeout: 5000 }), c.ev(() => __ct.t('t1').downloadCSV('productos.csv'))]);
  c.igual(dl.suggestedFilename(), 'productos.csv');
  const f = await dl.path();
  const txt = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '');
  c.igual(txt.split(/\r\n/)[0], 'Código,Nombre,Cantidad,Precio');
});
t('08', 'el componente no carga induxsoft.controls.excel.js', ['§5-a'], async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => [typeof window.InduxsoftExcel, Array.from(document.scripts).some(s => /excel/.test(s.src))]), ['undefined', false]);
}, { requiere: [] });

// ---------- InduxsoftExcel ----------
const { P: PX, t: x } = registro('xls', { requiere: ['excel-file'] });

/** Ejecuta fn(InduxsoftExcel, arg) en la página; si devuelve un Blob lo guarda y lo describe con Python. */
async function correrX(c, fn, arg) {
  const r = await c.ev(async ({ src, arg }) => {
    if (typeof InduxsoftExcel === 'undefined') return { $falta: true };
    try {
      const f = new Function('X', 'arg', 'return (' + src + ')(X, arg);');
      let v = await f(InduxsoftExcel, arg);
      if (v && typeof v.toBlob === 'function' && !(v instanceof Blob)) v = await v.toBlob();
      if (v instanceof Blob) { const b = new Uint8Array(await v.arrayBuffer()); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return { blob: btoa(s), tipo: v.type }; }
      return { v: v === undefined ? '$undefined' : JSON.parse(JSON.stringify(v)) };
    } catch (e) { return { $err: String(e && e.stack || e) }; }
  }, { src: fn.toString(), arg });
  if (r.$falta) throw new Falla('InduxsoftExcel no está cargado');
  if (r.$err) throw new Falla('excepción en InduxsoftExcel: ' + r.$err.split('\n')[0]);
  if (r.blob === undefined) return r.v;
  const dir = path.join(c.env.OUT, 'tmp');
  const f = path.join(dir, `${c.nombre}.xlsx`);
  fs.writeFileSync(f, Buffer.from(r.blob, 'base64'));
  const py = path.join(c.env.AQUI, 'lib', 'xlsx_validar.py');
  let j;
  try { j = JSON.parse(execFileSync('python3', ['-I', py, f], { encoding: 'utf8' })); } catch (e) { throw new Falla('el validador de Python falló: ' + e.message); }
  if (j.error) throw new Falla('XLSX inválido: ' + j.error);
  j.tipo = r.tipo;
  return j;
}
const conExcel = (o = {}) => ({ excel: true, ...o });
const soloExcel = (o = {}) => ({ excel: true, src: 'ninguno', ...o });
const celda = (h, ref) => (h.celdas[ref] ?? {});

const FILAS = [
  { codigo: 'P-001', cantidad: 3, precio: 2.5, fecha: '2026-01-15', activo: true, cliente: { nombre: 'Cliente Ficticio' } },
  { codigo: 'P-002', cantidad: 10, precio: 1234.75, fecha: '2026-02-28T10:30:00', activo: false, cliente: { nombre: 'Otro Cliente' } },
];

x('01', 'independiente: funciona sin EdiTable cargado (fromArray)', ['§5-a', '§5-src-array'], async (c) => {
  await c.abrir(soloExcel());
  c.igual(await c.ev(() => typeof EditTable), 'undefined');
  const j = await correrX(c, (X, a) => X.fromArray(a), FILAS);
  c.igual(j.tipo, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  c.ok(j.zip.crc_ok, 'CRC32 correcto');
  c.ok(['[Content_Types].xml', 'xl/workbook.xml', 'xl/styles.xml'].every(f => j.zip.archivos.includes(f)), 'partes: ' + j.zip.archivos);
});
x('02', 'fromArray infiere columnas y tipos: número, fecha de Excel con formato, texto; encabezado en negritas', ['§5-src-array', '§5-f', '§5-g'], async (c) => {
  await c.abrir(soloExcel());
  const h = (await correrX(c, (X, a) => X.fromArray(a, { columns: ['codigo', 'cantidad', 'precio', 'fecha'] }), FILAS)).hojas[0];
  c.igual([celda(h, 'A1').v, celda(h, 'A1').bold], ['codigo', true]);
  c.igual([celda(h, 'B2').t, celda(h, 'B2').v], ['n', 3]);
  c.igual(celda(h, 'C3').v, 1234.75);
  c.igual([celda(h, 'D2').fecha, String(celda(h, 'D2').v).slice(0, 10)], [true, '2026-01-15']);
  c.igual(celda(h, 'A2').t, 's');
});
x('03', 'fromArray: columns como objetos con title, rutas con punto y value: (row) => …', ['§5-src-array'], async (c) => {
  await c.abrir(soloExcel());
  const h = (await correrX(c, (X, a) => X.fromArray(a, { columns: [{ field: 'codigo', title: 'Código' }, { field: 'cliente.nombre', title: 'Cliente' }, { title: 'Importe', value: (r) => r.cantidad * r.precio }] }), FILAS)).hojas[0];
  c.igual([celda(h, 'A1').v, celda(h, 'B1').v, celda(h, 'C1').v], ['Código', 'Cliente', 'Importe']);
  c.igual([celda(h, 'B2').v, celda(h, 'C2').v, celda(h, 'C3').v], ['Cliente Ficticio', 7.5, 12347.5]);
});
x('04', 'encabezado fijado (freeze A2), autofiltro y ancho de columna aproximado', ['§5-g'], async (c) => {
  await c.abrir(soloExcel());
  const h = (await correrX(c, (X, a) => X.fromArray(a, { columns: ['codigo', 'cantidad'] }), FILAS)).hojas[0];
  c.igual(h.freeze, 'A2');
  c.ok(h.autofilter && h.autofilter.startsWith('A1'), 'autofiltro: ' + h.autofilter);
  c.ok(Object.keys(h.anchos).length >= 1, 'anchos: ' + JSON.stringify(h.anchos));
});
x('05', 'fromData({columns, rows, summary}): formato numérico de la columna y fila de totales en negritas', ['§5-src-data', '§5-f', '§5-g'], async (c) => {
  await c.abrir(soloExcel());
  const h = (await correrX(c, (X) => X.fromData({ columns: [{ field: 'c', title: 'Concepto', type: 'Text' }, { field: 'i', title: 'Importe', type: 'Number', format: 'true', decs: '2', prefix: '$', thousandssep: 'true' }], rows: [{ c: 'Uno', i: 1000 }, { c: 'Dos', i: 2.5 }], summary: { i: 1002.5 } }, { includeSummary: true }))).hojas[0];
  c.igual(celda(h, 'B2').v, 1000);
  c.ok(/0\.00/.test(celda(h, 'B2').fmt) && /#,##0/.test(celda(h, 'B2').fmt), 'formato: ' + celda(h, 'B2').fmt);
  c.igual([celda(h, 'B4').v, celda(h, 'B4').bold], [1002.5, true]);
});
x('06', 'fromTable: thead, tbody y tfoot (totales en negritas); números con formato mexicano', ['§5-src-table', '§5-g'], async (c) => {
  await c.abrir(soloExcel({ body: `<table id="h"><thead><tr><th>Concepto</th><th>Importe</th></tr></thead>
    <tbody><tr><td>Uno</td><td>$1,234.50</td></tr><tr><td>Dos</td><td>10</td></tr></tbody>
    <tfoot><tr><td>Total</td><td>$1,244.50</td></tr></tfoot></table>` }));
  const h = (await correrX(c, (X) => X.fromTable('#h'))).hojas[0];
  c.igual([celda(h, 'B2').t, celda(h, 'B2').v, celda(h, 'B3').v], ['n', 1234.5, 10]);
  c.igual([celda(h, 'A4').v, celda(h, 'B4').v, celda(h, 'B4').bold], ['Total', 1244.5, true]);
});
x('07', 'fromTable respeta colspan y rowspan (celdas combinadas)', ['§5-src-table', '§5-merge'], async (c) => {
  await c.abrir(soloExcel({ body: `<table id="h"><thead><tr><th rowspan="2">Producto</th><th colspan="2">Ventas</th></tr><tr><th>Ene</th><th>Feb</th></tr></thead>
    <tbody><tr><td>A</td><td>1</td><td>2</td></tr></tbody></table>` }));
  const h = (await correrX(c, (X) => X.fromTable(document.getElementById('h')))).hojas[0];
  c.contiene(h.merged, 'A1:A2'); c.contiene(h.merged, 'B1:C1');
  c.igual([celda(h, 'B2').v, celda(h, 'C2').v, celda(h, 'A3').v, celda(h, 'C3').v], ['Ene', 'Feb', 'A', 2]);
});
x('08', 'fromTable omite lo oculto, no-print y hide-on-print; acepta data-value y data-type', ['§5-src-table', '§5-h'], async (c) => {
  await c.abrir(soloExcel({ body: `<table id="h"><thead><tr><th>A</th><th class="no-print">B</th><th>C</th><th style="display:none">D</th></tr></thead>
    <tbody><tr><td>x</td><td class="no-print">y</td><td data-value="2026-03-01" data-type="date">1 de marzo</td><td style="display:none">z</td></tr>
    <tr class="hide-on-print"><td>no</td><td>no</td><td>no</td><td>no</td></tr>
    <tr><td data-type="text">00123</td><td>-</td><td data-value="15.5">15½</td><td>-</td></tr></tbody></table>` }));
  const h = (await correrX(c, (X) => X.fromTable('#h'))).hojas[0];
  c.igual([celda(h, 'A1').v, celda(h, 'B1').v, h.max_col], ['A', 'C', 2]);
  c.igual([celda(h, 'B2').fecha, String(celda(h, 'B2').v).slice(0, 10)], [true, '2026-03-01']);
  c.igual([celda(h, 'A3').v, celda(h, 'A3').t, celda(h, 'B3').v], ['00123', 's', 15.5]);
  c.igual(h.max_row, 3, 'la fila hide-on-print no sale');
});
x('09', 'fromEditTable con EdiTable v1 (Columns y DataArray): texto visible de Select y Check, números como números', ['§5-src-et'], async (c) => {
  await c.abrir(conExcel({ body: tabla({ cols: [{ field: 'u', type: 'Select', options: '{"PZA":"PIEZA","CJ":"CAJA"}', title: 'Unidad' }, { field: 'ok', type: 'Check', title: 'Activo' }, { field: 'n', type: 'Number', title: 'N', format: 'true', decs: '2' }, { field: 'oculta', title: 'Oculta', class: 'no-print' }], data: [{ u: 'CJ', ok: 'Sí', n: '12.5', oculta: 'x' }] }) }));
  const h = (await correrX(c, (X) => X.fromEditTable(document.getElementById('t1')))).hojas[0];
  c.igual([celda(h, 'A1').v, celda(h, 'A2').v, celda(h, 'C2').t, celda(h, 'C2').v, h.max_col], ['Unidad', 'CAJA', 'n', 12.5, 3]);
  c.ok(['Sí', 'SÍ', true].includes(celda(h, 'B2').v), 'Check visible: ' + celda(h, 'B2').v);
});
x('10', 'fromTable con un edit-table usa fromEditTable', ['§5-src-table', '§5-src-et'], async (c) => {
  await c.abrir(conExcel(paginaProductos()));
  const h = (await correrX(c, (X) => X.fromTable(document.getElementById('t1')))).hojas[0];
  c.igual([celda(h, 'A1').v, celda(h, 'A2').v, celda(h, 'C2').v, h.max_row], ['Código', 'P-003', 10, 5]);
});
x('11', 'fromEditTable por duck typing usa getExportData(opts) si existe (versión 2)', ['§5-src-et'], async (c) => {
  await c.abrir(soloExcel());
  const r = await c.ev(() => { window.opts = null; return 1; });
  const h = (await correrX(c, (X) => X.fromEditTable({ DataArray: [{ a: 1 }], Columns: [{ field: 'a', title: 'A' }], getExportData: (o) => { window.opts = o; return { columns: [{ field: 'z', title: 'Z', type: 'Number' }], rows: [{ z: 42 }], summary: null }; } }, { selectedOnly: true }))).hojas[0];
  c.igual([celda(h, 'A1').v, celda(h, 'A2').v], ['Z', 42]);
  c.igual(await c.ev(() => window.opts && window.opts.selectedOnly), true);
  c.ok(r === 1);
});
x('12', 'workbook([{name, source, opts}]): varias hojas (arreglo, tabla HTML y edit-table) con .toBlob()', ['§5-workbook'], async (c) => {
  await c.abrir(conExcel({ body: paginaProductos().body + '<table id="h"><tr><th>K</th></tr><tr><td>7</td></tr></table>' }));
  const j = await correrX(c, (X) => X.workbook([{ name: 'Arreglo', source: [{ a: 1 }] }, { name: 'Tabla HTML', source: '#h' }, { name: 'Productos', source: document.getElementById('t1') }]));
  c.igual(j.hojas.map(h => h.nombre), ['Arreglo', 'Tabla HTML', 'Productos']);
  c.igual([celda(j.hojas[1], 'A2').v, celda(j.hojas[2], 'B2').v], [7, 'Tornillo hexagonal']);
});
x('13', 'workbook: nombres de hoja inválidos se corrigen (máx. 31, sin []:*?/\\)', ['§5-workbook', '§5-e'], async (c) => {
  await c.abrir(soloExcel());
  const j = await correrX(c, (X) => X.workbook([{ name: 'Ventas [2026]: enero/febrero y algo más largo', source: [{ a: 1 }] }]));
  c.ok(j.hojas[0].nombre.length <= 31 && !/[[\]:*?/\\]/.test(j.hojas[0].nombre), 'nombre: ' + j.hojas[0].nombre);
});
x('14', 'workbook(...).download(nombre) descarga un XLSX', ['§5-workbook', '§5-d'], async (c) => {
  await c.abrir(soloExcel());
  const [dl] = await Promise.all([c.page.waitForEvent('download', { timeout: 5000 }), c.ev(() => InduxsoftExcel.workbook([{ name: 'A', source: [{ a: 1 }] }]).download('libro.xlsx'))]);
  c.igual(dl.suggestedFilename(), 'libro.xlsx');
});
x('15', 'download(fuente, nombre) acepta una fuente directa y un Blob', ['§5-d'], async (c) => {
  await c.abrir(soloExcel());
  const [d1] = await Promise.all([c.page.waitForEvent('download', { timeout: 5000 }), c.ev(() => InduxsoftExcel.download([{ a: 1 }], 'directo.xlsx'))]);
  const [d2] = await Promise.all([c.page.waitForEvent('download', { timeout: 5000 }), c.ev(() => InduxsoftExcel.download(InduxsoftExcel.fromArray([{ a: 1 }]), 'blob.xlsx'))]);
  c.igual([d1.suggestedFilename(), d2.suggestedFilename()], ['directo.xlsx', 'blob.xlsx']);
});
x('16', 'toCSV: RFC 4180 y BOM opcional', ['§5-csv'], async (c) => {
  await c.abrir(soloExcel({ lang: 'es-MX' }));
  const r = await correrX(c, (X) => [X.toCSV([{ a: 'x,y', b: 'di "no"' }, { a: 'l1\nl2', b: 2 }]), X.toCSV([{ a: 1 }], { bom: true }).charCodeAt(0)]);
  c.igual(r[0].replace(/^\uFEFF/, '').replace(/\r\n$/, ''), 'a,b\r\n"x,y","di ""no"""\r\n"l1\nl2",2');
  c.igual(r[1], 0xFEFF);
});
// ---------- R7 en InduxsoftExcel ----------
for (const [loc, txt] of [['es-MX', '1,234.5'], ['en-US', '1,234.5'], ['es-CO', '1.234,5'], ['de-DE', '1.234,5']]) {
  x('r7-arr-' + loc, `R7 fromArray: "${txt}" con locale ${loc} → 1234.5`, ['§0-R7', '§5-src-array'], async (c) => {
    await c.abrir(soloExcel());
    const h = (await correrX(c, (X, a) => X.fromArray([{ n: a.txt }], { locale: a.loc }), { loc, txt })).hojas[0];
    c.igual([celda(h, 'A2').t, celda(h, 'A2').v], ['n', 1234.5]);
  });
  x('r7-tab-' + loc, `R7 fromTable: tabla con lang="${loc}" y "${txt}" → 1234.5`, ['§0-R7', '§5-src-table'], async (c) => {
    await c.abrir(soloExcel({ body: `<table id="h" lang="${loc}"><tr><th>N</th></tr><tr><td>${txt}</td></tr></table>`, lang: loc === 'es-MX' ? 'de-DE' : 'es-MX' }));
    const h = (await correrX(c, (X) => X.fromTable('#h'))).hojas[0];
    c.igual(celda(h, 'A2').v, 1234.5);
  });
}
x('r7-pri-1', 'R7: el lang de la tabla gana sobre el del documento', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'en-US', body: '<table id="h" lang="es-CO"><tr><th>N</th></tr><tr><td>1.234,5</td></tr></table>' }));
  c.igual(celda((await correrX(c, (X) => X.fromTable('#h'))).hojas[0], 'A2').v, 1234.5);
});
x('r7-pri-2', 'R7: el lang de un ancestro cuenta como el de la tabla', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'en-US', body: '<section lang="de-DE"><table id="h"><tr><th>N</th></tr><tr><td>1.234,5</td></tr></table></section>' }));
  c.igual(celda((await correrX(c, (X) => X.fromTable('#h'))).hojas[0], 'A2').v, 1234.5);
});
x('r7-pri-3', 'R7: el lang del documento (con región) decide aunque el navegador esté en en-US', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'es-CO', contexto: { locale: 'en-US' }, body: '<table id="h"><tr><th>N</th></tr><tr><td>1.234,5</td></tr></table>' }));
  c.igual(celda((await correrX(c, (X) => X.fromTable('#h'))).hojas[0], 'A2').v, 1234.5);
});
for (const nav of ['de-DE', 'es', 'es-ES']) {
  x('r7-pri-4-' + nav, `R7 revisada: sin lang, el idioma del navegador (${nav}) NO participa: un valor ambiguo se lee como es-MX`, ['§0-R7'], async (c) => {
    await c.abrir(soloExcel({ lang: '', contexto: { locale: nav }, body: '<table id="h"><tr><th>N</th></tr><tr><td>1.234</td></tr></table>' }));
    c.cerca(celda((await correrX(c, (X) => X.fromTable('#h'))).hojas[0], 'A2').v, 1.234, 1e-12);
  });
}
x('r7-pri-auto', 'R7: locale "auto" usa navigator.language (contexto de-DE: 1.234 = 1234)', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: '', contexto: { locale: 'de-DE' }, body: '<table id="h"><tr><th>N</th></tr><tr><td>1.234</td></tr></table>' }));
  c.igual(celda((await correrX(c, (X) => X.fromTable('#h', { locale: 'auto' }))).hojas[0], 'A2').v, 1234);
});
x('r7-sinreg-1', 'R7: lang sin región ("es") se trata como no declarado: 1.234 = 1.234 (es-MX)', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'es', contexto: { locale: 'es-ES' }, body: '<table id="h" lang="es"><tr><th>N</th></tr><tr><td>1.234</td></tr></table>' }));
  c.cerca(celda((await correrX(c, (X) => X.fromTable('#h'))).hojas[0], 'A2').v, 1.234, 1e-12);
});
x('r7-inf-1', 'R7: inferencia por contenido: con los dos separadores el último es el decimal (sin lang)', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: '', body: '<table id="h"><tr><th>A</th><th>B</th></tr><tr><td>1.234,56</td><td>1,234.56</td></tr></table>' }));
  const h = (await correrX(c, (X) => X.fromTable('#h'))).hojas[0];
  c.igual([celda(h, 'A2').v, celda(h, 'B2').v], [1234.56, 1234.56]);
});
x('r7-inf-2', 'R7: inferencia por columna: un valor no ambiguo resuelve los demás de la columna', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: '', body: '<table id="h"><tr><th>A</th></tr><tr><td>1.234</td></tr><tr><td>2.500,75</td></tr></table>' }));
  const h = (await correrX(c, (X) => X.fromTable('#h'))).hojas[0];
  c.igual([celda(h, 'A2').v, celda(h, 'A3').v], [1234, 2500.75]);
});
x('r7-pri-5', 'R7: la opción explícita locale gana sobre todos', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'es-CO', contexto: { locale: 'de-DE' }, body: '<table id="h" lang="de-DE"><tr><th>N</th></tr><tr><td>1,234.5</td></tr></table>' }));
  c.igual(celda((await correrX(c, (X) => X.fromTable('#h', { locale: 'en-US' }))).hojas[0], 'A2').v, 1234.5);
});
x('r7-pri-6', 'R7: decimal y thousands explícitos', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'es-MX' }));
  c.igual(celda((await correrX(c, (X) => X.fromArray([{ n: '1 234,5' }], { decimal: ',', thousands: ' ' }))).hojas[0], 'A2').v, 1234.5);
});
x('r7-fec-1', 'R7: fecha ambigua resuelta por la columna (es-MX, otra fila con día > 12 fija DMY)', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'en-US' }));
  const h = (await correrX(c, (X) => X.fromArray([{ f: '03/04/2026' }, { f: '25/04/2026' }]))).hojas[0];
  c.igual([String(celda(h, 'A2').v).slice(0, 10), String(celda(h, 'A3').v).slice(0, 10)], ['2026-04-03', '2026-04-25']);
});
x('r7-fec-2', 'R7: fecha ambigua resuelta por la columna (MDY si un mes > 12 obliga)', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ lang: 'es-MX' }));
  const h = (await correrX(c, (X) => X.fromArray([{ f: '03/04/2026' }, { f: '04/25/2026' }]))).hojas[0];
  c.igual([String(celda(h, 'A2').v).slice(0, 10), String(celda(h, 'A3').v).slice(0, 10)], ['2026-03-04', '2026-04-25']);
});
x('r7-fec-3', 'R7: solo fechas ambiguas: decide el locale (es-MX → DMY, en-US → MDY)', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel());
  const r = await correrX(c, async (X) => {
    const a = X.fromArray([{ f: '03/04/2026' }], { locale: 'es-MX' }), b = X.fromArray([{ f: '03/04/2026' }], { locale: 'en-US' });
    return [a.size > 0, b.size > 0];
  });
  c.igual(r, [true, true]);
  const h1 = (await correrX(c, (X) => X.fromArray([{ f: '03/04/2026' }], { locale: 'es-MX' }))).hojas[0];
  const h2 = (await correrX(c, (X) => X.fromArray([{ f: '03/04/2026' }], { locale: 'en-US' }))).hojas[0];
  c.igual([String(celda(h1, 'A2').v).slice(0, 10), String(celda(h2, 'A2').v).slice(0, 10)], ['2026-04-03', '2026-03-04']);
});
x('r7-fec-4', 'R7: ISO 8601 y data-value se aceptan con cualquier locale', ['§0-R7'], async (c) => {
  await c.abrir(soloExcel({ body: '<table id="h" lang="en-US"><tr><th>F</th><th>N</th></tr><tr><td>2026-12-01</td><td data-value="1234.5">1.234,5 €</td></tr></table>' }));
  const h = (await correrX(c, (X) => X.fromTable('#h'))).hojas[0];
  c.igual([String(celda(h, 'A2').v).slice(0, 10), celda(h, 'B2').v], ['2026-12-01', 1234.5]);
});
x('r7-csv-1', 'R7: toCSV usa ";" si el locale usa coma decimal y "," si no', ['§0-R7', '§5-csv'], async (c) => {
  await c.abrir(soloExcel());
  const r = await correrX(c, (X) => ['es-MX', 'en-US', 'es-CO', 'de-DE'].map(l => X.toCSV([{ a: 1, b: 2 }], { locale: l }).replace(/^\uFEFF/, '').split('\r\n')[0]));
  c.igual(r, ['a,b', 'a,b', 'a;b', 'a;b']);
});
x('r7-csv-2', 'R7: toCSV toma el locale del lang de la tabla HTML', ['§0-R7', '§5-csv'], async (c) => {
  await c.abrir(soloExcel({ lang: 'es-MX', body: '<table id="h" lang="es-CO"><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>' }));
  c.igual(await correrX(c, (X) => X.toCSV('#h').replace(/^\uFEFF/, '').split('\r\n')[0]), 'A;B');
});
x('r7-et', 'R7: dos edit-table (es-MX y es-CO) con columnas Number escritas como texto se exportan como números', ['§0-R7', '§5-src-et'], async (c) => {
  await c.abrir(conExcel({ body: '<div lang="es-MX">' + tabla({ id: 'mx', cols: [{ field: 'n', type: 'Number', title: 'N' }], data: [{ n: '1,234.5' }] }) + '</div><div lang="es-CO">' + tabla({ id: 'co', cols: [{ field: 'n', type: 'Number', title: 'N' }], data: [{ n: '1.234,5' }] }) + '</div>' }));
  const j = await correrX(c, (X) => X.workbook([{ name: 'MX', source: document.getElementById('mx') }, { name: 'CO', source: document.getElementById('co') }]));
  c.igual([celda(j.hojas[0], 'A2').v, celda(j.hojas[1], 'A2').v], [1234.5, 1234.5]);
});
x('16b', 'XLSX con muchas filas (2,000) y caracteres especiales sigue siendo válido', ['§5-e'], async (c) => {
  await c.abrir(soloExcel());
  const j = await correrX(c, (X) => X.fromArray(Array.from({ length: 2000 }, (_, i) => ({ i, t: 'Ñandú & <"comillas"> \u0001' + i }))));
  c.ok(j.zip.crc_ok); c.igual(j.hojas[0].max_row, 2001);
  c.igual(celda(j.hojas[0], 'B2').v.startsWith('Ñandú & <"comillas">'), true);
});
x('17', 'fromEditTable con totales de EdiTable 2 (includeSummary)', ['§5-src-et', '§5-g'], async (c) => {
  await c.abrir(conExcel({ body: tabla({ cols: [{ field: 'c', title: 'C' }, { field: 'n', type: 'Number', title: 'N', summary: 'sum' }], data: [{ c: 'a', n: 1 }, { c: 'b', n: 2 }] }) }));
  const h = (await correrX(c, (X) => X.fromEditTable(document.getElementById('t1'), { includeSummary: true }))).hojas[0];
  c.igual([celda(h, 'B4').v, celda(h, 'B4').bold], [3, true]);
}, { requiere: ['summary'] });
x('18', 'fromEditTable({selectedOnly:true}) con selección de EdiTable 2', ['§5-src-et'], async (c) => {
  await c.abrir(conExcel({ body: tabla({ a: { 'multi-select': 'row' }, cols: [{ field: 'c', title: 'C' }], data: [{ c: 'a' }, { c: 'b' }, { c: 'c' }] }) }));
  await c.ev(() => document.getElementById('t1').SelectRows([2]));
  const h = (await correrX(c, (X) => X.fromEditTable(document.getElementById('t1'), { selectedOnly: true }))).hojas[0];
  c.igual([h.max_row, celda(h, 'A2').v], [2, 'c']);
}, { requiere: ['multiselect', 'export'] });

export default [{ nombre: 'v2-exportar-componente', grupo: 'v2', pruebas: P }, { nombre: 'v2-excel-biblioteca', grupo: 'v2', pruebas: PX }];
