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
  // F1: _getFullTable y _printRows dibujan la celda con _f1PintarCelda; la mutación quita la clase en los dos caminos.
  ['quitar-clase-celda', 'Quitar la clase EdiTable-Cell de los td que dibuja _f1PintarCelda (_getFullTable y _printRows)',
    "        const td = this._createFullElement('td', { class:'EdiTable-Cell' });\n        tr.appendChild(td);\n\n        let coldf",
    "        const td = this._createFullElement('td', {});\n        tr.appendChild(td);\n\n        let coldf"],
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
  // F1: mutaciones de lo que cambió en F1 (mapa de filas, C1, C17).
  ['mapa-desalineado', 'El mapa tr → índice (F1, A1) devuelve el índice menos 1 a partir de la fila 3',
    "if (tbody === this._f1TBodyPrincipal()) return this._f1IndiceDeTr(tr, tbody);",
    "if (tbody === this._f1TBodyPrincipal()) { const __i = this._f1IndiceDeTr(tr, tbody); return (__i > 2 ? __i - 1 : __i); }"],
  ['mapa-sin-invalidar', 'El observador del mapa no lo marca como sucio en su callback (el mapa queda viejo tras un cambio)',
    "new MutationObserver(() => { this._f1Estado = 0; })",
    "new MutationObserver(() => {})"],
  ['revertir-c1', 'Volver a agregar un listener de clic a todas las celdas en cada InsertRow (deshace C1)',
    "            // F1 (A2): solo los td del tbody.\n            this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+\"#\"+this.tableId+\" > \"+this.EdiTable.Const.HTML.TBODY+\" \"+this.EdiTable.Const.HTML.TD).forEach(td => {",
    "            this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+\"#\"+this.tableId+\" > \"+this.EdiTable.Const.HTML.TBODY+\" \"+this.EdiTable.Const.HTML.TD).forEach(td => {\n                td.addEventListener('click', (e) => { e.stopPropagation(); this.CellFocus(e.target); });"],
  ['revertir-c17', 'Confirmar sin cambios vuelve a escribir DataArray (deshace C17)',
    "f1SinCambio = (this._f1Edicion != null",
    "f1SinCambio = false && (this._f1Edicion != null"],
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
process.exit(filas.every(f => f.fallan.length) ? 0 : 1);
