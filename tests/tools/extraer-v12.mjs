#!/usr/bin/env node
// Extrae de Induxsoft/v12 los bloques literales que usa EdiTable en V12 y los guarda en
// tests/fixtures/v12/extraido.mjs, con el archivo, las líneas y el sha256 de origen.
//
//   node tests/tools/extraer-v12.mjs [--v12 /home/claude/induxsoft/v12]
//
// Los bloques se ubican por marcas de texto (no por número de línea), así que el script sigue sirviendo si
// el archivo cambia; si una marca ya no aparece, falla y lo dice.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const i = process.argv.indexOf('--v12');
const V12 = path.resolve(i >= 0 ? process.argv[i + 1] : '/home/claude/induxsoft/v12');
const commit = (() => { try { return execSync('git -C ' + JSON.stringify(V12) + ' rev-parse --short HEAD').toString().trim(); } catch { return '?'; } })();

function leer(rel) {
  const f = path.join(V12, rel);
  const txt = fs.readFileSync(f, 'utf8');
  return { rel, txt, lineas: txt.split('\n'), sha: createHash('sha256').update(txt).digest('hex') };
}

/** Bloque entre la línea que contiene `ini` (exclusiva si incl=false) y la primera línea posterior que cumple `fin`. */
function bloque(arch, ini, fin, { incluirIni = false, incluirFin = false, desde = 0 } = {}) {
  const a = arch.lineas.findIndex((l, k) => k >= desde && l.includes(ini));
  if (a < 0) throw new Error(`${arch.rel}: no encontré la marca ${JSON.stringify(ini)}`);
  let b = -1;
  for (let k = a + 1; k < arch.lineas.length; k++) if (typeof fin === 'function' ? fin(arch.lineas[k]) : arch.lineas[k].includes(fin)) { b = k; break; }
  if (b < 0) throw new Error(`${arch.rel}: no encontré el fin del bloque que empieza en ${a + 1}`);
  const s = incluirIni ? a : a + 1, e = incluirFin ? b : b - 1;
  return { texto: arch.lineas.slice(s, e + 1).join('\n'), lineas: `${s + 1}-${e + 1}` };
}

const uie = leer('src/uielements.v12.dkl');
const ui = leer('src/_templates/sites/v12/js/induxsoft.v12.ui.js');
const list = leer('src/_templates/v12/app_crudl/list.dk');

const out = {};
const fuentes = {};
const reg = (nombre, arch, b, nota) => { out[nombre] = b.texto; fuentes[nombre] = { archivo: 'Induxsoft/v12/' + arch.rel, lineas: b.lineas, sha256: arch.sha, nota }; };

// 1. control-styles de uie.dbeditable (texto DKL: ## es un # literal, #<table_id> se sustituye)
const cs = bloque(uie, '"control-styles"="', (l) => /^\s*"\s*$/.test(l));
reg('controlStyles', uie, cs, 'Contenido del atributo control-styles; en DKL «##» se escribe «#».');

// 2. Script de uie.dbeditable (lo que corre en el navegador): entre {$' y '}
const sIni = uie.lineas.findIndex(l => l.includes('id="uie.dbeditable-script"'));
const scr = bloque(uie, "{$'", (l) => /^\s*'\}\s*$/.test(l), { desde: sIni });
reg('scriptDbeditable', uie, scr, 'Script del navegador de uie.dbeditable; #<…> son expresiones DKL que se sustituyen.');

// 3. Leyenda por omisión
const ley = uie.lineas.findIndex(l => l.includes('field.dstr(table_definition,"leyend"'));
if (ley < 0) throw new Error('no encontré la leyenda por omisión');
out.leyendaPorOmision = /"leyend","([^"]*)"/.exec(uie.lineas[ley])[1];
fuentes.leyendaPorOmision = { archivo: 'Induxsoft/v12/' + uie.rel, lineas: String(ley + 1), sha256: uie.sha };

// 4. ExportarCSV de v12navbar (dentro de un literal DKL con comillas escapadas)
const ex = bloque(uie, 'ExportarCSV(clipboard=false) {', (l) => /^\s*Exportar\(tipo\)\s*\{/.test(l), { incluirIni: true });
let exTxt = ex.texto.replace(/\n\s*\},?\s*$/, '\n}');
exTxt = exTxt.replaceAll("\\'", "'").replaceAll('\\\\n', '\\n');
reg('exportarCSV', uie, { texto: exTxt, lineas: ex.lineas }, "Método de v12navbar; se quitaron los escapes DKL (\\' -> ', \\\\n -> \\n).");

// 5. getPrintableHTML (JS literal)
const gp = bloque(ui, 'function getPrintableHTML()', (l) => /^\}\s*$/.test(l), { incluirIni: true, incluirFin: true });
reg('getPrintableHTML', ui, gp, 'Función literal.');

// 6. getCurrentContext de list.dk (#<table_id> se sustituye)
const gc = bloque(list, "{$'", (l) => /^\s*'\}\s*$/.test(l), { desde: list.lineas.findIndex(l => l.includes('do uie.dbeditable(')) });
reg('getCurrentContext', list, gc, 'Script literal; #<table_id> se sustituye.');

// 7. Plantilla de la columna de acciones de list.dk (ftext('…'))
const ac = bloque(list, '@"template":ftext(\'', (l) => l.includes("</div>')"), { incluirFin: true });
reg('plantillaAcciones', list, { texto: ac.texto.replace(/'\)\s*$/, ''), lineas: ac.lineas }, 'Contenido de ftext(); ${DataRow.sys_pk} lo evalúa EdiTable.');

const cab = `// GENERADO por tests/tools/extraer-v12.mjs — no editar a mano.
// Origen: Induxsoft/v12 @ ${commit}. Bloques literales tomados de los archivos indicados en FUENTES.
`;
const cuerpo = Object.entries(out).map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`).join('\n\n');
const dest = path.join(AQUI, '../fixtures/v12/extraido.mjs');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, cab + `export const COMMIT = ${JSON.stringify(commit)};\n\nexport const FUENTES = ${JSON.stringify(fuentes, null, 1)};\n\n` + cuerpo + '\n');
console.log('Escrito ' + path.relative(process.cwd(), dest));
for (const [k, f] of Object.entries(fuentes)) console.log(`  ${k.padEnd(20)} ${f.archivo}:${f.lineas}`);
