#!/usr/bin/env node
// Pruebas de mutación del banco: crea copias del componente FUERA del repo (/tmp/et-mutaciones) con cambios
// pequeños y comprueba que la batería los detecta (cada mutación debe hacer fallar al menos un escenario).
//
//   node tests/tools/mutaciones.mjs [--solo <nombre>] [--dir /tmp/et-mutaciones] [--jobs 2] [--escenarios-extra <dir>]...
//
// Escribe /tmp/et-mutaciones/resumen.md con la tabla mutación -> escenarios que fallaron.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../..');
const ORIG = path.join(REPO, 'src/js/induxsoft.controls.editable.js');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const DIR = path.resolve(arg('--dir', '/tmp/et-mutaciones'));
const SOLO = arg('--solo', null);
const JOBS = arg('--jobs', '2');
const EXTRA = process.argv.flatMap((a, i) => (a === '--escenarios-extra' ? ['--escenarios-extra', process.argv[i + 1]] : []));

// [nombre, descripción, texto original (debe aparecer exactamente una vez), reemplazo]
const MUTACIONES = [
  ['quitar-clase-celda', 'Quitar la clase EdiTable-Cell de los td que dibuja _getFullTable (línea 309)',
    "const td = this._createFullElement('td', { class:'EdiTable-Cell' });\n                    tr.appendChild(td);\n                    \n                    let coldf = this.GetColumnDefOfTd(td);\n                    let value = (this._isBadgesCol(column) ? '' : (data[column.field] ?? ''));\n                    \n                    let valideEncode = true;\n\n                    if(coldf.template) {\n                        valideEncode = false;\n                        value = this.applyTemplate(coldf.template, data);\n                    }\n\n                    this.SetTdValue(td, value, valideEncode, coldf);\n                    \n                    td.setAttribute('data-cell',(coldf?.title??''));\n                    if (this.onTdPaint) this.onTdPaint(td, idx, this.ColIndexOfTd(td), (coldf?.field??''));\n                });",
    "const td = this._createFullElement('td', {});\n                    tr.appendChild(td);\n                    \n                    let coldf = this.GetColumnDefOfTd(td);\n                    let value = (this._isBadgesCol(column) ? '' : (data[column.field] ?? ''));\n                    \n                    let valideEncode = true;\n\n                    if(coldf.template) {\n                        valideEncode = false;\n                        value = this.applyTemplate(coldf.template, data);\n                    }\n\n                    this.SetTdValue(td, value, valideEncode, coldf);\n                    \n                    td.setAttribute('data-cell',(coldf?.title??''));\n                    if (this.onTdPaint) this.onTdPaint(td, idx, this.ColIndexOfTd(td), (coldf?.field??''));\n                });"],
  ['quitar-regla-css', 'Quitar la regla CSS .hidde-row{ display: none; }',
    '.hidde-row{ display: none; }', ''],
  ['orden-eventos', 'Disparar BeforeSetInput antes que InputCreated (StartEdit, líneas 1892-1897)',
    "        if (this._getCurren().Events[this.EdiTable.Const.Events.InputCreated]!=undefined)\n            this._getCurren().Events[this.EdiTable.Const.Events.InputCreated](eventArgs);\n\n        \n        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput]!=undefined)\n            this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput](eventArgs);",
    "        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput]!=undefined)\n            this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput](eventArgs);\n\n        \n        if (this._getCurren().Events[this.EdiTable.Const.Events.InputCreated]!=undefined)\n            this._getCurren().Events[this.EdiTable.Const.Events.InputCreated](eventArgs);"],
  ['indice-fila', 'CurrentRowIndex() devuelve el índice menos 1 a partir de la fila 3 (desalinea DataArray[CurrentRowIndex()])',
    "        if (current_td==null)\n            return -1;\n        \n        return this._getRowIndex(current_td.closest('tr'));",
    "        if (current_td==null)\n            return -1;\n        \n        const __i = this._getRowIndex(current_td.closest('tr'));\n        return (__i > 2 ? __i - 1 : __i);"],
  ['formato-numerico', 'Truncar en vez de redondear en _format',
    'const roundedNumber = number.toFixed(decimals);',
    'const roundedNumber = (Math.trunc(number * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);'],
  ['div-envolvente', 'Envolver la tabla interna en un div adicional',
    'container1.appendChild(this._table);',
    "const __w = this._createFullElement('div', { class:'et-wrap' }); __w.appendChild(this._table); container1.appendChild(__w);"],
  ['tfoot-vacio', 'Agregar un tfoot vacío a la tabla interna',
    "        table.appendChild(thead);\n        table.appendChild(tbody);",
    "        table.appendChild(thead);\n        table.appendChild(tbody);\n        table.appendChild(this._createFullElement('tfoot'));"],
  ['corregir-listener-duplicado', 'Corrección (no mutación): un solo listener de clic por celda en InsertRow; debe verse SOLO en escenarios afectados',
    "                td.removeEventListener('click', clickFunct);\n                td.addEventListener('click', clickFunct);",
    "                if (!td.__etClic) { td.__etClic = true; td.addEventListener('click', clickFunct); }"],
];

const src = fs.readFileSync(ORIG, 'utf8');
fs.mkdirSync(DIR, { recursive: true });
const filas = [];
for (const [nombre, desc, de, a] of MUTACIONES) {
  if (SOLO && nombre !== SOLO) continue;
  const n = src.split(de).length - 1;
  if (n !== 1) { console.error(`${nombre}: el texto a reemplazar aparece ${n} veces (debe ser 1)`); process.exit(2); }
  const f = path.join(DIR, nombre + '.js');
  fs.writeFileSync(f, src.replace(de, a));
  const salida = path.join(DIR, 'out-' + nombre);
  console.log(`== ${nombre}: ${desc}`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(REPO, 'tests/run.mjs'), '--src', f, '--salida', salida, '--sin-png', '--jobs', JOBS, ...EXTRA], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const res = JSON.parse(fs.readFileSync(path.join(salida, 'resultados.json'), 'utf8'));
  const fallan = res.filter(x => ['DIFERENTE', 'error'].includes(x.estado));
  const cats = new Set();
  fallan.forEach(x => x.difs.filter(d => d.estricta).forEach(d => cats.add(d.categoria.replace(/^tablas\[\d+\]#?[^.]*\./, 'tabla.'))));
  filas.push({ nombre, desc, codigo: r.status, total: res.length, fallan: fallan.map(x => x.id), cats: [...cats], seg: Math.round((Date.now() - t0) / 1000) });
  console.log(`   código ${r.status}; ${fallan.length} de ${res.length} escenarios con diferencias (${Math.round((Date.now() - t0) / 1000)} s)`);
}
const md = ['# Pruebas de mutación del banco de EdiTable', '', `Fecha: ${new Date().toISOString()}`, '',
  '| Mutación | Detectada | Escenarios que fallan | Categorías | Ejemplos |', '|---|---|---|---|---|',
  ...filas.map(f => `| \`${f.nombre}\`: ${f.desc} | ${f.fallan.length ? 'sí' : '**NO**'} (código ${f.codigo}) | ${f.fallan.length} de ${f.total} | ${f.cats.join(', ')} | ${f.fallan.slice(0, 6).map(x => '`' + x + '`').join(', ')}${f.fallan.length > 6 ? ' …' : ''} |`), ''];
for (const f of filas) md.push(`## ${f.nombre}`, '', ...f.fallan.map(x => `- \`${x}\``), '');
fs.writeFileSync(path.join(DIR, 'resumen.md'), md.join('\n') + '\n');
fs.writeFileSync(path.join(DIR, 'resumen.json'), JSON.stringify(filas, null, 1) + '\n');
console.log('Resumen: ' + path.join(DIR, 'resumen.md'));
process.exit(filas.every(f => f.nombre.startsWith('corregir-') || f.fallan.length) ? 0 : 1);
