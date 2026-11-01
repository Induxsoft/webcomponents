// Genera MATRIZ.md: cada renglón de la spec con sus pruebas y ejemplos, y el porcentaje de cobertura.
//   node tests/conformidad/matriz.mjs        (o run.mjs --matriz, que además pone el estado de la última corrida)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RENGLONES, DESCARTADOS } from './spec-renglones.mjs';
import { leerEjemplos } from './capturas.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

const CENSO = process.env.ET_CENSO_DIR ?? '/home/claude/v12_qa/docs/edittable';

function csv(txt) {
  const filas = []; let f = [], v = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"' && txt[i + 1] === '"') { v += '"'; i++; } else if (ch === '"') q = false; else v += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { f.push(v); v = ''; } else if (ch === '\n') { f.push(v); filas.push(f); f = []; v = ''; } else if (ch !== '\r') v += ch;
  }
  if (v || f.length) { f.push(v); filas.push(f); }
  return filas;
}

/** Sección "Censo": cada dependencia real (uso-api.csv y control-styles.md) con las pruebas que la cubren. */
function seccionCenso(pruebas, marca) {
  const L = ['## Censo de consumidores', ''];
  const fApi = path.join(CENSO, 'uso-api.csv'), fCs = path.join(CENSO, 'control-styles.md');
  if (!fs.existsSync(fApi) || !fs.existsSync(fCs)) { L.push(`*No se encontró el censo en \`${CENSO}\` (variable ET_CENSO_DIR).*`, ''); return L; }
  L.push('*Fuente: `v12_qa/docs/edittable/uso-api.csv` y `control-styles.md` (censo del 2026-11-01). Se listan el miembro, su tipo y cuántas veces aparece; los consumidores están en el censo. Una prueba cubre la dependencia si la declara en su campo `censo` (suite `actual-censo-consumidores`) o si la nombra en su título.*', '');
  const porCenso = (k) => pruebas.filter(p => (p.censo ?? []).includes(k));
  const porTitulo = (k) => { const re = new RegExp('(^|[^A-Za-z0-9_])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^A-Za-z0-9_])', 'i'); return pruebas.filter(p => re.test(p.titulo ?? '')); };
  const fmt = (ps) => ps.length ? ps.slice(0, 6).map(p => '`' + p.id + '`' + marca(p.id)).join(' ') + (ps.length > 6 ? ` … (+${ps.length - 6})` : '') : '**sin prueba**';
  // miembros y API
  const filas = csv(fs.readFileSync(fApi, 'utf8')).slice(1).filter(r => r.length >= 3 && r[0] && !/^[#"(]/.test(r[0]) && !/^acceso DOM/.test(r[1] ?? ''));
  const vistos = new Set();
  let total = 0, cubiertos = 0;
  L.push('### Miembros, atributos, eventos y tipos con uso real', '', '| Dependencia | Tipo | Usos | Pruebas |', '|---|---|---|---|');
  for (const [miembro, tipo, conteo] of filas) {
    const k = miembro + '|' + tipo;
    if (vistos.has(k)) continue; vistos.add(k);
    let ps = porCenso(miembro);
    if (!ps.length) { const base = miembro.replace(/^Events\./, ''); ps = porTitulo(base); }
    if (!ps.length && /^atributo/.test(tipo)) ps = pruebas.filter(p => (p.censo ?? []).some(c => c.includes(miembro)));
    total++; if (ps.length) cubiertos++;
    L.push(`| \`${miembro}\` | ${tipo} | ${conteo} | ${fmt(ps)} |`);
  }
  L.push('', `Cubiertas: **${cubiertos} de ${total}**. Los accesos DOM del consumidor (\`td.style\`, \`tr.cells\`…) se cubren con \`cen-api-tr-cells-td-style-tr-onclick-acceso-DOM-en-el-consumidor\` y con las pruebas de V12 y FactuDesk.`, '');
  // control-styles
  const sels = [];
  for (const lin of fs.readFileSync(fCs, 'utf8').split('\n')) { const m = /^\| `(.+?)` \|/.exec(lin); if (m) sels.push(m[1]); }
  let tc = 0, cc = 0;
  L.push('### Selectores de control-styles', '', '| Selector | Pruebas |', '|---|---|');
  for (const sel of sels) {
    let ps = pruebas.filter(p => (p.censo ?? []).includes('cs:' + sel));
    if (!ps.length && /data-cell/.test(sel)) ps = pruebas.filter(p => (p.censo ?? []).some(c => c.startsWith('cs:') && c.includes('data-cell')));
    if (!ps.length && /::after$|:hover$/.test(sel)) ps = pruebas.filter(p => (p.censo ?? []).includes('cs:' + sel));
    if (!ps.length && sel === 'div:has(table)') ps = pruebas.filter(p => (p.censo ?? []).includes('cs:div:has(table)'));
    tc++; if (ps.length) cc++;
    L.push(`| \`${sel.replaceAll('|', '\\|')}\` | ${fmt(ps)} |`);
  }
  L.push('', `Cubiertos: **${cc} de ${tc}**.`, '');
  return L;
}

export function generarMatriz({ suites, raiz = RAIZ, aqui = AQUI, resultados = null }) {
  const est = new Map((resultados ?? []).map(r => [r.id, r.estado]));
  const pruebas = suites.flatMap(s => s.pruebas.map(p => ({ id: p.id, grupo: s.grupo, suite: s.nombre, spec: p.spec ?? [], censo: p.censo ?? [], titulo: p.titulo })));
  const ejemplos = leerEjemplos(raiz);
  const ids = new Set(RENGLONES.map(r => r[0]));
  const sueltos = new Set();
  pruebas.forEach(p => p.spec.forEach(s => { if (!ids.has(s)) sueltos.add(s); }));
  ejemplos.forEach(e => e.spec.forEach(s => { if (!ids.has(s)) sueltos.add(s); }));

  const L = ['# Matriz de cobertura: especificación de EdiTable 2 ↔ pruebas ↔ ejemplos', '',
    '*Generada por `tests/conformidad/matriz.mjs` a partir del campo `spec` de cada prueba (`tests/conformidad/suites/*.mjs`) y de cada ejemplo (`examples/v2/ejemplos.js`). No editar a mano.*', '',
    'Ids de renglón: `§N-x` según la sección de `edittable-spec-v2.md`; `A.*` son áreas del contrato actual (`edittable-contrato.md`); `L-*` son casos límite pedidos.', ''];
  if (resultados) L.push('Estado de la última corrida: ✓ pasada · ✗ fallida · x defecto conocido · p pendiente (función no disponible) · E error del arnés.', '');
  const marca = (id) => ({ pasada: '✓', fallida: '✗', defecto: 'x', pendiente: 'p', error: 'E' })[est.get(id)] ?? '';

  const filas = [];
  let conPrueba = 0, total = 0, conEjemplo = 0, totalPilotos = 0, pilotosCubiertos = 0;
  for (const [id, sec, texto] of RENGLONES) {
    const ps = pruebas.filter(p => p.spec.includes(id));
    const es = ejemplos.filter(e => e.spec.includes(id));
    if (sec === '§12') { totalPilotos++; if (es.length) pilotosCubiertos++; }
    else { total++; if (ps.length) conPrueba++; }
    if (es.length) conEjemplo++;
    filas.push({ id, sec, texto, ps, es });
  }
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : '0') + ' %';
  L.push('## Resumen', '');
  L.push(`- Renglones de la spec y del contrato (sin §12): **${total}**; con al menos una prueba: **${conPrueba}** (**${pct(conPrueba, total)}**).`);
  const soloSpec = filas.filter(f => f.id.startsWith('§') && f.sec !== '§12');
  const soloSpecCub = soloSpec.filter(f => f.ps.length).length;
  L.push(`- Solo renglones de la spec v2 (§0-§11): **${soloSpec.length}**; con prueba: **${soloSpecCub}** (**${pct(soloSpecCub, soloSpec.length)}**).`);
  L.push(`- Pilotos de §12 cubiertos con ejemplo: **${pilotosCubiertos} de ${totalPilotos}**.`);
  L.push(`- Renglones con al menos un ejemplo: **${conEjemplo}** de ${RENGLONES.length}.`);
  L.push(`- Pruebas: **${pruebas.length}** (${['actual', 'correcciones', 'v2'].map(g => `${g}: ${pruebas.filter(p => p.grupo === g).length}`).join(', ')}). Ejemplos: **${ejemplos.length}**.`);
  const sin = filas.filter(f => f.sec !== '§12' && !f.ps.length);
  L.push(`- Renglones sin prueba: ${sin.length ? sin.map(f => '`' + f.id + '`').join(', ') : 'ninguno'}.`);
  L.push(`- Descartados: ${DESCARTADOS.map(d => '`' + d[0] + '` ' + d[1]).join('; ')}.`);
  if (sueltos.size) L.push(`- Ids citados que no están en la lista de renglones: ${[...sueltos].map(s => '`' + s + '`').join(', ')}.`);
  L.push('');
  let secActual = '';
  for (const f of filas) {
    if (f.sec !== secActual) {
      secActual = f.sec;
      L.push(`## ${secActual === 'Actual' ? 'Contrato actual (0ed1824)' : secActual === 'Límites' ? 'Casos límite' : 'Spec ' + secActual}`, '');
      L.push('| Renglón | Qué dice | Pruebas | Ejemplos |', '|---|---|---|---|');
    }
    const ps = f.ps.length > 14 ? f.ps.slice(0, 14).map(p => '`' + p.id + '`' + marca(p.id)).join(' ') + ` … (+${f.ps.length - 14})` : f.ps.map(p => '`' + p.id + '`' + marca(p.id)).join(' ');
    L.push(`| \`${f.id}\` | ${f.texto.replaceAll('|', '\\|')} | ${f.ps.length ? `${f.ps.length}: ${ps}` : '**sin prueba**'} | ${f.es.map(e => `[${e.archivo}](../../examples/v2/${e.archivo})`).join(' ') || '—'} |`);
    const sig = filas[filas.indexOf(f) + 1];
    if (!sig || sig.sec !== secActual) L.push('');
  }
  L.push(...seccionCenso(pruebas, marca));
  fs.writeFileSync(path.join(aqui, 'MATRIZ.md'), L.join('\n'));
  return { total, conPrueba, pct: pct(conPrueba, total), soloSpec: soloSpec.length, soloSpecCub, pilotos: `${pilotosCubiertos}/${totalPilotos}` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = path.join(AQUI, 'suites');
  const suites = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mjs')).sort()) {
    const m = await import(pathToFileURL(path.join(dir, f)).href);
    (Array.isArray(m.default) ? m.default : [m.default]).forEach(s => suites.push(s));
  }
  let resultados = null;
  const rj = path.join(AQUI, 'out', 'resultados.json');
  if (fs.existsSync(rj)) resultados = JSON.parse(fs.readFileSync(rj, 'utf8')).resultados;
  console.log(generarMatriz({ suites, resultados }));
}
