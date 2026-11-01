// F5: medición comparada de rendimiento entre dos copias del componente (por omisión main y src/).
// Alterna las dos copias en cada ronda (A, B, A, B…), cada medición en una página nueva y sin la
// instrumentación del banco, y reporta la mediana de las rondas.
//
//   node tests/tools/f5-medir.mjs [--a <main.js>] [--b <src.js>] [--rondas 7] [--n 1000,5000,20000]
//                                 [--solo lista|arbol|virtual] [--json <salida.json>]
//
// Antes de medir revisa que no haya otros procesos de node (pruebas de otro agente) y espera si los hay.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const A = arg('--a', null), B = arg('--b', path.join(REPO, 'src/js/induxsoft.controls.editable.js'));
const RONDAS = Number(arg('--rondas', 7));
const NS = arg('--n', '1000,5000,20000').split(',').map(Number);
const SOLO = arg('--solo', null);
const SALIDA = arg('--json', null);

let srcA = A;
if (!srcA) { srcA = '/tmp/f5-main.js'; fs.writeFileSync(srcA, execSync('git show 60b58f3:src/js/induxsoft.controls.editable.js', { cwd: REPO })); }
const codigo = { main: fs.readFileSync(srcA, 'utf8'), f5: fs.readFileSync(B, 'utf8') };

// Procesos de node que no son este ni sus hijos (el controlador de Playwright también es node).
function otrosNode() {
  let todos = [];
  try { todos = execSync('pgrep node').toString().trim().split(/\s+/).filter(Boolean).map(Number); } catch { return 0; }
  const mios = new Set([process.pid]);
  let creció = true;
  while (creció) {
    creció = false;
    for (const pid of todos) {
      if (mios.has(pid)) continue;
      let ppid = 0;
      try { ppid = Number(fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' ')[1]); } catch { }
      if (mios.has(ppid)) { mios.add(pid); creció = true; }
    }
  }
  return todos.filter(p => !mios.has(p)).length;
}
async function esperarLibre() {
  for (let k = 0; k < 60; k++) { const n = otrosNode(); if (n <= 0) return; console.log(`  hay ${n} procesos de node; espero 30 s`); await new Promise(r => setTimeout(r, 30000)); }
}

const COLS = [['id', 'Id', 'NoEditable', ''], ['nombre', 'Nombre', 'Text', ''], ['cantidad', 'Cantidad', 'Number', ''], ['precio', 'Precio', 'Number', ' format="true" decs="2" thousandssep="true" prefix="$"']];
const html = (attrs, conContenedor) => `<!DOCTYPE html><html lang="es-MX"><head><meta charset="utf-8"><style>body{margin:0;padding:8px;font-family:"DejaVu Sans",sans-serif}</style>
<script src="/et.js"></script></head><body>${conContenedor ? '<div id="sc" style="height:500px;overflow-y:auto">' : ''}
<edit-table id="t1" style="width:100%" ${attrs}><edit-thead><edit-tr>${COLS.map(([f, t, ty, x]) => `<edit-th field="${f}" type="${ty}"${x}>${t}</edit-th>`).join('')}</edit-tr></edit-thead></edit-table>
${conContenedor ? '</div>' : ''}<script>
window.__gen = (n, arbol) => Array.from({ length: n }, (_, i) => {
  const r = { id: i + 1, nombre: 'Producto de prueba ' + (i + 1), cantidad: (i * 7) % 13 + 1, precio: Math.round(((i * 37) % 1000) * 1.5 + 10) / 10 };
  if (arbol) r.idp = (i < Math.max(1, Math.floor(n / 20))) ? null : (Math.floor((i * 2654435761) % i) + 1);
  return r;
});
window.__cuadro = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
</script></body></html>`;

// Cada operación devuelve ms. Se mide con la tabla ya dibujada y un cuadro de por medio.
const T = (cuerpo) => new Function(`return (async () => { const t = document.getElementById('t1'); await window.__cuadro(); const s = performance.now(); ${cuerpo}; const ms = performance.now() - s; await window.__cuadro(); return ms; })()`);
function operaciones(n, modo) {
  const mitad = Math.floor(n / 2), ochenta = Math.floor(n * 0.8);
  const editar = `const td = t.GetTrByIndex(${mitad}).cells[1]; t.CellFocus(td); t.StartEdit(td, ''); t.EdiTable.GetInput().value = '5'; t.ConfirmEdit(td);`;
  const base = [
    ['_printRows', T('t._printRows()')],
    ['ordenar', T('t._table.tHead.rows[0].cells[1].onclick({ stopPropagation(){} })')],
    ['editar celda', T(editar)],
    ['editar celda (modelo: UpdateDataMember + UpdateRow)', T(`t.UpdateDataMember(${mitad + 1}, 'nombre', 'y'); t.UpdateRow(${mitad + 1});`)],
    ['UpdateData', T('t.UpdateData()')],
    ['NavTo(80 %)', T(`t.NavTo(${ochenta}, 0)`)],
  ];
  if (modo === 'virtual') base.push(['desplazamiento (ms/cuadro)', new Function(`return (async () => { const sc = document.getElementById('sc'); sc.scrollTop = 0; await window.__cuadro(); const ts = []; let prev = performance.now(); for (let i = 0; i < 60; i++) { sc.scrollTop += 700; await new Promise(r => requestAnimationFrame(r)); const now = performance.now(); ts.push(now - prev); prev = now; } return ts.reduce((a, b) => a + b, 0) / ts.length; })()`)]);
  return base;
}

async function medirUna(browser, cual, n, modo) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = await ctx.newPage();
  await page.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === '/et.js') return r.fulfill({ contentType: 'text/javascript', body: codigo[cual] });
    if (u.pathname === '/p.html') return r.fulfill({ contentType: 'text/html', body: html(modo === 'arbol' ? 'show-tree="true" can-move-row="false"' : modo === 'virtual' ? 'virtual-rows="true" row-height="28px"' : '', modo === 'virtual') });
    return r.abort();
  });
  try {
    await page.goto('http://f5.test/p.html', { waitUntil: 'load' });
    const out = {};
    // Primer dibujo: asignar DataArray y dibujar (en árbol, _printTreeData).
    out['primer dibujo'] = await page.evaluate(async ([k, m]) => {
      const t = document.getElementById('t1'); t.AutoAddRow = false; const d = window.__gen(k, m === 'arbol');
      await window.__cuadro(); const s = performance.now();
      t.DataArray = d; if (m === 'arbol') t._printTreeData(); else t._printRows();
      const ms = performance.now() - s; await window.__cuadro(); return ms;
    }, [n, modo]);
    for (const [nombre, fn] of operaciones(n, modo)) {
      try { out[nombre] = await Promise.race([page.evaluate(fn), new Promise((_, rej) => setTimeout(() => rej(new Error('límite')), 90000))]); }
      catch (e) { out[nombre] = null; break; }
    }
    return out;
  } finally { await ctx.close(); }
}

const mediana = (xs) => { const v = xs.filter(x => typeof x === 'number').sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
const browser = await chromium.launch({ args: ['--disable-gpu'] });
const res = { fecha: new Date().toISOString(), rondas: RONDAS, chrome: browser.version(), a: srcA, b: B, mediciones: {} };
const modos = ['lista', 'arbol', 'virtual'].filter(m => !SOLO || SOLO === m);
for (const modo of modos) for (const n of NS) {
  if (modo === 'virtual' && n < 5000) continue;
  const clave = `${modo}-${n}`;
  const acc = { main: [], f5: [] };
  // 20,000 en main es muy lento: menos rondas.
  const r = (n >= 20000 && modo !== 'virtual') ? Math.min(RONDAS, 3) : RONDAS;
  for (let k = 0; k < r; k++) for (const cual of (k % 2 ? ['f5', 'main'] : ['main', 'f5'])) {
    await esperarLibre();
    acc[cual].push(await medirUna(browser, cual, n, modo));
  }
  const ops = new Set([...acc.main, ...acc.f5].flatMap(o => Object.keys(o)));
  res.mediciones[clave] = {};
  for (const op of ops) res.mediciones[clave][op] = { main: mediana(acc.main.map(o => o[op])), f5: mediana(acc.f5.map(o => o[op])), rondas: r };
  console.log(clave, JSON.stringify(res.mediciones[clave]));
}
await browser.close();
if (SALIDA) fs.writeFileSync(SALIDA, JSON.stringify(res, null, 1) + '\n');
