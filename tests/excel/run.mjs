// Pruebas de InduxsoftExcel: genera XLSX en Chromium headless y los valida con Python/openpyxl.
// Uso: node tests/excel/run.mjs
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = createRequire(path.join(process.env.HOME || '/', 'x.js'))('playwright'); }

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.join(here, 'out');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const libUrl = pathToFileURL(path.join(root, 'src/js/induxsoft.controls.excel.js')).href;
const blank = pathToFileURL(path.join(out, 'blank.html')).href;
fs.writeFileSync(path.join(out, 'blank.html'), `<!DOCTYPE html><meta charset="utf-8"><script src="${libUrl}"></script>`);

const browser = await playwright.chromium.launch({ headless: true });
const results = { files: {}, timings: {} };
let failed = 0;
const save = (name, b64) => { fs.writeFileSync(path.join(out, name), Buffer.from(b64, 'base64')); results.files[name] = path.join(out, name); };

try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(blank);

    // Casos generados con fromData / fromDataAsync.
    const gen = await page.evaluate(async () => {
        const X = window.InduxsoftExcel;
        const b64 = async blob => { const u = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
        const cols = [
            { field: 'clave', title: 'Clave', type: 'Text' },
            { field: 'importe', title: 'Importe', type: 'Number', format: 'true', decs: 2, thousandssep: 'true', prefix: '$', width: '140px' },
            { field: 'pct', title: 'Porcentaje', type: 'Number', decs: 1, sufix: ' %' },
            { field: 'cant', title: 'Cantidad', type: 'Number' },
            { field: 'fecha', title: 'Fecha', type: 'Date' },
            { field: 'fh', title: 'Fecha y hora', type: 'DateTime' },
            { field: 'ok', title: 'Activo', type: 'Check' },
            { field: 'u', title: 'Unidad', type: 'Select', options: { PZA: 'PIEZA', CAJA: 'CAJA' } },
            { field: 'txt', title: 'Texto', type: 'Memo' },
            { field: 'oc', title: 'Oculta', type: 'Text', hidden: true }
        ];
        const rows = [
            { clave: 'A1', importe: 1234.567, pct: 15.25, cant: '42', fecha: '2026-03-15', fh: '2026-03-15T13:45:30', ok: true, u: 'PZA', txt: 'a & b < c > d "e"', oc: 'x' },
            { clave: 'A2', importe: '-50', pct: 0, cant: 7, fecha: new Date(2026, 0, 31), fh: '2026-12-31 23:59', ok: 'No', u: 'CAJA', txt: 'control:\u0001\u0008 fin\ttab\nnueva línea _x0041_', oc: 'y' },
            { clave: '', importe: null, pct: undefined, cant: 'N/A', fecha: 'no es fecha', fh: '', ok: 'Sí', u: 'OTRA', txt: '  espacios  ', oc: '' },
            { clave: 'A4', importe: 1e6, pct: 100, cant: 0, fecha: '2000-02-29', fh: new Date(2026, 5, 1, 8, 30), ok: false, u: '', txt: 'emoji 😀 y ñ', oc: '' }
        ];
        const out = {};
        out['basico.xlsx'] = await b64(X.fromData({ columns: cols, rows, summary: { importe: 1001234.567, cant: 49 } }, { sheetName: "Ventas: [2026]/*?\\enero con nombre demasiado largo" }));
        out['raw.xlsx'] = await b64(X.fromData({ columns: cols, rows }, { raw: true, includeHidden: true, sheetName: "'Hoja'" }));
        out['vacio.xlsx'] = await b64(X.fromData({ columns: cols, rows: [] }, { sheetName: '' }));
        out['una.xlsx'] = await b64(X.fromData({ columns: cols, rows: [rows[0]] }, { sheetName: 'Una' }));
        out['async.xlsx'] = await b64(await X.fromDataAsync({ columns: cols, rows, summary: { importe: 1 } }, { sheetName: 'Async' }));

        // 20,000 filas x 10 columnas.
        const bigCols = [];
        for (let j = 0; j < 10; j++) bigCols.push({ field: 'c' + j, title: 'Col ' + j, type: j < 4 ? 'Number' : j < 6 ? 'Date' : j === 6 ? 'Check' : 'Text', format: j === 1 ? 'true' : undefined, decs: 2, thousandssep: 'true' });
        const bigRows = [];
        for (let i = 0; i < 20000; i++) {
            const r = {};
            for (let j = 0; j < 10; j++) r['c' + j] = j < 4 ? i * 1.5 + j : j < 6 ? '2026-' + String(1 + i % 12).padStart(2, '0') + '-' + String(1 + i % 28).padStart(2, '0') : j === 6 ? i % 2 === 0 : 'Texto ' + (i % 500) + ' col ' + j;
            bigRows.push(r);
        }
        const timings = {};
        X.fromData({ columns: bigCols, rows: bigRows.slice(0, 200) }); // calentamiento
        let t = performance.now();
        const big = X.fromData({ columns: bigCols, rows: bigRows }, { sheetName: 'Grande' });
        timings.sync20k = Math.round(performance.now() - t);
        t = performance.now();
        const bigA = await X.fromDataAsync({ columns: bigCols, rows: bigRows }, { sheetName: 'Grande' });
        timings.async20k = Math.round(performance.now() - t);
        timings.sizeSync = big.size; timings.sizeAsync = bigA.size;
        timings.compressionStream = typeof CompressionStream === 'function';
        out['grande.xlsx'] = await b64(big);
        out['grande-deflate.xlsx'] = await b64(bigA);

        // Utilidades internas.
        const unit = {
            sheet: [X._sheetName('a/b\\c?d*e:f[g]h'), X._sheetName(''), X._sheetName('x'.repeat(40)), X._sheetName("'abc'"), X._sheetName('History')],
            serial: [X._serial('1900-03-01'), X._serial('2026-03-15'), X._serial('2026-03-15T12:00:00'), X._serial('nada')],
            fmt: [X._numFmt({ format: 'true', decs: 2, thousandssep: 'true', prefix: '$' }), X._numFmt({ format: 'true' }), X._numFmt({ format: 'false', decs: 2 }), X._numFmt({ format: '0.000%' })],
            crc: X._crc32(new TextEncoder().encode('123456789')).toString(16),
            blobType: big.type,
            moduleExports: typeof window.InduxsoftExcel.fromEditTable
        };
        return { out, timings, unit };
    });
    for (const [k, v] of Object.entries(gen.out)) save(k, v);
    results.timings = gen.timings;
    results.unit = gen.unit;
    if (errors.length) { console.error('Errores en la página:', errors); failed++; }

    // Componente real (versión 1).
    const p2 = await browser.newPage();
    const err2 = [];
    p2.on('pageerror', e => err2.push(String(e)));
    await p2.goto(pathToFileURL(path.join(here, 'edittable.html')).href);
    await p2.waitForFunction(() => document.getElementById('productos').Columns.length === 11 && document.getElementById('conllave').Columns.length === 1);
    const et = await p2.evaluate(async () => {
        const X = window.InduxsoftExcel;
        const t = document.getElementById('productos');
        t.hideColumn('oculto', true);
        const b64 = async blob => { const u = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const c of u) s += String.fromCharCode(c); return btoa(s); };
        const k = document.getElementById('conllave');
        return {
            version: typeof t.getExportData === 'function' ? 2 : 1,
            hideColumns: t.hideColumns,
            data: X.getEditTableData(t),
            a: await b64(X.fromEditTable(t, { sheetName: 'Productos' })),
            b: await b64(X.fromEditTable(k)),
            c: await b64(X.fromEditTable(k, { raw: true, sheetName: 'raw' }))
        };
    });
    save('edittable.xlsx', et.a); save('edittable-llave.xlsx', et.b); save('edittable-llave-raw.xlsx', et.c);
    results.edittable = { version: et.version, hideColumns: et.hideColumns, columns: et.data.columns.map(c => c.field) };
    if (err2.length) { console.error('Errores en la página del componente:', err2); failed++; }

    // edit-table por fromTable (delegación) y en un libro de varias hojas.
    const et2 = await p2.evaluate(async () => {
        const X = window.InduxsoftExcel;
        const b64 = async blob => { const u = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const c of u) s += String.fromCharCode(c); return btoa(s); };
        const t = document.getElementById('productos');
        return {
            viaTable: await b64(X.fromTable(t)),
            viaSelector: await b64(X.fromTable('#productos')),
            libro: await b64(X.workbook([{ source: t }, { source: [{ a: 1, b: 'x' }] }, { source: '#plana' }, { name: 'Datos', source: { columns: [{ field: 'k', title: 'K' }], rows: [{ k: 'v' }] } }]).toBlob()),
            csv: X.toCSV(t)
        };
    });
    save('et-via-table.xlsx', et2.viaTable); save('et-via-selector.xlsx', et2.viaSelector); save('libro-et.xlsx', et2.libro);
    results.edittableCsv = et2.csv;

    // Página SIN EdiTable: tablas HTML, arreglos, libro mixto, CSV y descarga.
    const ctx = await browser.newContext({ locale: 'es-MX', acceptDownloads: true });
    const p3 = await ctx.newPage();
    const err3 = [];
    p3.on('pageerror', e => err3.push(String(e)));
    await p3.goto(pathToFileURL(path.join(here, 'tabla.html')).href);
    const tb = await p3.evaluate(async () => {
        const X = window.InduxsoftExcel;
        const b64 = async blob => { const u = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const c of u) s += String.fromCharCode(c); return btoa(s); };
        const rows = [
            { id: 1, nombre: 'Ana', alta: new Date(2026, 0, 5), activo: true, cliente: { nombre: 'ACME', rfc: 'XAXX010101000' }, saldo: '1,234.50' },
            { id: 2, nombre: 'Luis', alta: '2026-02-10T10:30:00', activo: false, extra: 'tarde', cliente: { nombre: 'Beta' }, saldo: 10 },
            { id: '3', nombre: 'Eva, "la jefa"', alta: null, activo: true, saldo: '' }
        ];
        const explicit = ['nombre', { field: 'cliente.nombre', title: 'Cliente' }, { title: 'Mayúsculas', value: r => r.nombre.toUpperCase() }, { field: 'id', type: 'Number', format: 'true', decs: 2 }];
        return {
            noEditTable: typeof window.EditTable === 'undefined' && !customElements.get('edit-table'),
            ventas: await b64(X.fromTable('#ventas')),
            ventasHidden: await b64(X.fromTable(document.getElementById('ventas'), { includeHidden: true, sheetName: 'Todo' })),
            simple: await b64(X.fromTable('#simple')),
            inferido: await b64(X.fromArray(rows)),
            explicito: await b64(X.fromArray(rows, { columns: explicit, sheetName: 'Explícito' })),
            libro: await b64(X.workbook([
                { name: 'Arreglo', source: rows }, { name: 'Tabla', source: '#ventas' },
                { name: 'Datos', source: { columns: [{ field: 'k', title: 'K', type: 'Number' }], rows: [{ k: 5 }], summary: { k: 5 } } },
                { name: 'Arreglo', source: rows.slice(0, 1) }, { source: document.getElementById('simple') }
            ]).toBlob()),
            libroAsync: await b64(await X.workbook([{ name: 'A', source: rows }, { name: 'B', source: '#simple' }]).toBlobAsync()),
            csv: X.toCSV(rows, { bom: true }),
            csvTabla: X.toCSV('#ventas'),
            csvExplicito: X.toCSV(rows, { columns: explicit, delimiter: '|' })
        };
    });
    for (const k of ['ventas', 'ventasHidden', 'simple', 'inferido', 'explicito', 'libro', 'libroAsync']) save(`tabla-${k}.xlsx`, tb[k]);
    results.tabla = { noEditTable: tb.noEditTable, csv: tb.csv, csvTabla: tb.csvTabla, csvExplicito: tb.csvExplicito };
    // download(fuente, nombre): descarga real capturada por Playwright.
    const [dl] = await Promise.all([p3.waitForEvent('download'), p3.evaluate(() => window.InduxsoftExcel.download('#ventas', 'ventas'))]);
    results.tabla.downloadName = dl.suggestedFilename();
    await dl.saveAs(path.join(out, 'descarga.xlsx')); results.files['descarga.xlsx'] = path.join(out, 'descarga.xlsx');
    if (err3.length) { console.error('Errores en la página sin EdiTable:', err3); failed++; }
    await ctx.close();

    // Locales (R7): una hoja por caso. El navegador se simula con el locale del contexto de Playwright.
    const localeCase = async (navLocale) => {
        const c = await browser.newContext({ locale: navLocale });
        const pg = await c.newPage();
        await pg.goto(blank);
        const r = await pg.evaluate(async () => {
            const X = window.InduxsoftExcel;
            const b64 = async blob => { const u = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const c of u) s += String.fromCharCode(c); return btoa(s); };
            const mk = (lang, cells) => {
                const t = document.createElement('table');
                if (lang) t.setAttribute('lang', lang);
                t.innerHTML = '<thead><tr><th>N</th><th>F</th></tr></thead><tbody>' + cells.map(([n, f]) => `<tr><td>${n}</td><td>${f}</td></tr>`).join('') + '</tbody>';
                document.body.appendChild(t);
                return t;
            };
            const S = [];
            const add = (name, src, opts) => S.push({ name, source: src, opts });
            add('es-MX', mk('es-MX', [['$1,234.56', '15/03/2026']]));
            add('en-US', mk('en-US', [['1,234.56', '03/04/2026']]));
            add('es-ES', mk('es-ES', [['1.234,56', '03/04/2026']]));
            add('es-CO', mk('es-CO', [['1.234,56', '03/04/2026']]));
            add('de-DE', mk('de-DE', [['1.234,56 €', '25.12.2026']]));
            add('opcion', mk('de-DE', [['1,234.56', '03/04/2026']]), { locale: 'en-US' });
            add('explicito', mk('en-US', [['1.234,56', '03/04/2026']]), { decimal: ',', thousands: '.', dateOrder: 'DMY' });
            add('amb-en', mk('en-US', [['1', '03/04/2026'], ['2', '25/04/2026']]));
            add('amb-mx', mk('es-MX', [['1', '04/13/2026'], ['2', '03/04/2026']]));
            add('amb-loc', mk('es-MX', [['1', '03/04/2026'], ['2', '05/06/2026']]));
            add('navegador', mk('', [['1,234.5', '03/04/2026']]));
            add('arreglo-de', [{ m: '1.234,56', f: '25.12.2026' }, { m: '2,5', f: '01.02.2026' }], { locale: 'de-DE' });
            // R7 revisado: sin lang con región ni opción, el navegador no participa; se infiere por columna o queda es-MX.
            add('sin-lang', mk('', [['1,234.56', '03/04/2026']]));
            add('lang-es', mk('es', [['1,234', '03/04/2026']]));
            const div = document.createElement('div');
            div.setAttribute('lang', 'es-CO');
            document.body.appendChild(div);
            const anid = mk('es', [['1,5', '03/04/2026']]);
            div.appendChild(anid);
            add('anidada', anid);
            add('columna', mk('', [['1.234,56', '03/04/2026'], ['12,5', '05/06/2026']]));
            add('columna-miles', mk('', [['1.234.567', ''], ['12,5', '']]));
            add('auto', mk('', [['1,234.5', '03/04/2026']]), { locale: 'auto' });
            add('arreglo-inferido', [{ m: '1.234,56' }, { m: '12,5' }]);
            const wb = await b64(X.workbook(S).toBlob());
            const navTable = mk('', [['1', '2']]);
            const loc = { nav: X._loc({}, navTable), auto: X._loc({ locale: 'auto' }, navTable), langEs: X._loc({}, mk('es', [])), anidada: X._loc({}, anid) };
            const csvColumna = X.toCSV(S.find(x => x.name === 'columna').source);
            document.documentElement.lang = 'de-DE';
            add('documento', mk('', [['1.234,5', '03/04/2026']]));
            loc.doc = X._loc({}, navTable);
            loc.tabla = X._loc({}, mk('en-US', []));
            loc.opcion = X._loc({ locale: 'es-CO' }, mk('en-US', []));
            const doc = await b64(X.fromTable(S[S.length - 1].source, { sheetName: 'documento' }));
            const csv = {
                esES: X.toCSV(S[2].source), enUS: X.toCSV(S[1].source), forzado: X.toCSV(S[2].source, { delimiter: ',' }),
                deArr: X.toCSV([{ a: 1.5, b: 'x;y' }], { locale: 'de-DE' }), raw: X.toCSV(S[2].source, { raw: true })
            };
            csv.columna = csvColumna;
            return { wb, doc, loc, csv };
        });
        await c.close();
        return r;
    };
    // Ejemplo examples/excel-demo.html: cada botón produce una descarga.
    {
        const c = await browser.newContext({ acceptDownloads: true });
        const pg = await c.newPage();
        const errs = [];
        pg.on('pageerror', e => errs.push(String(e)));
        await pg.goto(pathToFileURL(path.join(root, 'examples/excel-demo.html')).href);
        await pg.waitForFunction(() => document.getElementById('productos').Columns?.length === 6);
        results.demo = [];
        for (const id of ['btn-arreglo', 'btn-arreglo-cols', 'btn-csv', 'btn-tabla', 'btn-edittable', 'btn-data', 'btn-libro']) {
            const [d] = await Promise.all([pg.waitForEvent('download'), pg.click('#' + id)]);
            const name = 'demo-' + d.suggestedFilename();
            await d.saveAs(path.join(out, name));
            results.demo.push(name);
            if (name.endsWith('.xlsx')) results.files[name] = path.join(out, name);
        }
        if (errs.length) { console.error('Errores en excel-demo.html:', errs); failed++; }
        await c.close();
    }

    const l1 = await localeCase('en-US');
    save('locales.xlsx', l1.wb); save('locale-documento.xlsx', l1.doc);
    const l2 = await localeCase('de-DE');
    save('locales-nav-de.xlsx', l2.wb);
    const l3 = await localeCase('es-ES');
    save('locales-nav-es-ES.xlsx', l3.wb);
    const l4 = await localeCase('es');
    save('locales-nav-es.xlsx', l4.wb);
    results.locale = { en: { loc: l1.loc, csv: l1.csv }, de: { loc: l2.loc }, esES: { loc: l3.loc }, es: { loc: l4.loc } };
} finally {
    await browser.close();
}

// Carga en Node con require (module.exports), sin DOM.
{
    const X = require(path.join(root, 'src/js/induxsoft.controls.excel.js'));
    const b = X.fromArray([{ a: 1, b: 'Node' }], { sheetName: 'Node' });
    fs.writeFileSync(path.join(out, 'node.xlsx'), Buffer.from(await b.arrayBuffer()));
    results.files['node.xlsx'] = path.join(out, 'node.xlsx');
    results.nodeCsv = X.toCSV([{ a: 1.5, b: 'x' }], { locale: 'en-US' });
}

const libSize = fs.statSync(path.join(root, 'src/js/induxsoft.controls.excel.js')).size;
results.libSize = libSize;
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));

// Validación con openpyxl.
const py = spawnSync('python3', ['-I', path.join(here, 'validate.py'), path.join(out, 'results.json')], { encoding: 'utf8' });
process.stdout.write(py.stdout); process.stderr.write(py.stderr);
if (py.status !== 0) failed++;

// LibreOffice (opcional).
const so = spawnSync('sh', ['-c', 'command -v soffice || command -v libreoffice'], { encoding: 'utf8' }).stdout.trim();
if (so) {
    const lo = path.join(out, 'lo');
    fs.mkdirSync(lo, { recursive: true });
    const r = spawnSync(so, ['--headless', '-env:UserInstallation=file://' + path.join(out, 'lo-profile'), '--convert-to', 'csv', '--outdir', lo, path.join(out, 'basico.xlsx'), path.join(out, 'edittable.xlsx'), path.join(out, 'grande-deflate.xlsx'), path.join(out, 'tabla-ventas.xlsx')], { encoding: 'utf8', timeout: 180000 });
    for (const f of ['basico.csv', 'edittable.csv', 'grande-deflate.csv', 'tabla-ventas.csv']) {
        const p = path.join(lo, f);
        if (fs.existsSync(p)) {
            const lines = fs.readFileSync(p, 'utf8').split('\n');
            console.log(`ok   LibreOffice convierte ${f}: ${lines.length - 1} líneas; 2a línea: ${lines[1]?.slice(0, 120)}`);
        } else { console.log(`FAIL LibreOffice no generó ${f}: ${r.stderr || r.stdout}`); failed++; }
    }
} else console.log('--   LibreOffice no está disponible: se omite la conversión a CSV');

console.log(`\nTiempos: 20,000x10 sincrónico ${results.timings.sync20k} ms (${results.timings.sizeSync} bytes), asíncrono ${results.timings.async20k} ms (${results.timings.sizeAsync} bytes, CompressionStream=${results.timings.compressionStream})`);
console.log(`Tamaño de induxsoft.controls.excel.js: ${libSize} bytes (${(libSize / 1024).toFixed(1)} KB)`);
if (results.timings.sync20k >= 2000) { console.log('FAIL 20,000 filas tardó 2 s o más'); failed++; }
console.log(failed ? `\nFALLÓ (${failed})` : '\nTODO BIEN');
process.exit(failed ? 1 : 0);
