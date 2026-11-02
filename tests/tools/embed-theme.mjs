// Copia src/js/induxsoft.theme.js dentro de los componentes, entre los marcadores
//   /* <induxsoft-theme v=X.Y.Z> */ … /* </induxsoft-theme> */
// para que V12 no tenga que agregar otra etiqueta <script>. Si los marcadores no existen, el bloque se agrega al
// principio del archivo. Después compara las copias con el original y falla si alguna quedó distinta.
//
//   node tests/tools/embed-theme.mjs            # escribe las copias y verifica
//   node tests/tools/embed-theme.mjs --check    # solo verifica (sale con 1 si alguna copia es distinta o falta)
//
// El módulo se edita solo en src/js/induxsoft.theme.js; las copias se regeneran con esta herramienta.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(AQUI, '..', '..');
export const MODULO = path.join(REPO, 'src/js/induxsoft.theme.js');
export const DESTINOS = ['src/js/induxsoft.controls.editable.js', 'src/js/induxsoft.controls.js'].map(f => path.join(REPO, f));

const INI = /\/\* <induxsoft-theme v=([^>\s]*)> \*\/\n/;
const FIN = '/* </induxsoft-theme> */';

/** Versión declarada en el módulo (var VERSION = '…'). */
export function version(txt) {
  const m = /var VERSION = '([^']+)'/.exec(txt);
  if (!m) throw new Error('induxsoft.theme.js: no se encontró var VERSION');
  return m[1];
}
const normal = (t) => t.replace(/\r\n/g, '\n');
const cuerpo = (mod) => normal(mod).replace(/\s+$/, '') + '\n';
const bloque = (mod) => `/* <induxsoft-theme v=${version(mod)}> */\n${cuerpo(mod)}${FIN}\n`;

/** Extrae la copia incrustada: { v, contenido, ini, fin } o null si no hay marcadores. */
export function extraer(txt) {
  txt = normal(txt);
  const m = INI.exec(txt);
  if (!m) return null;
  const desde = m.index + m[0].length;
  const hasta = txt.indexOf(FIN, desde);
  if (hasta < 0) throw new Error('marcador de cierre ausente');
  if (INI.exec(txt.slice(hasta))) throw new Error('hay más de una copia incrustada');
  return { v: m[1], contenido: txt.slice(desde, hasta), ini: m.index, fin: hasta + FIN.length + (txt[hasta + FIN.length] === '\n' ? 1 : 0) };
}

/** Escribe (o reemplaza) la copia en un archivo. Devuelve true si cambió. */
export function incrustar(destino, mod = fs.readFileSync(MODULO, 'utf8')) {
  const txt = normal(fs.readFileSync(destino, 'utf8'));
  const e = extraer(txt);
  const nuevo = e ? txt.slice(0, e.ini) + bloque(mod) + txt.slice(e.fin) : bloque(mod) + '\n' + txt;
  if (nuevo === txt) return false;
  fs.writeFileSync(destino, nuevo);
  return true;
}

/** Compara las copias con el módulo. Devuelve la lista de problemas (vacía si todo está igual). */
export function verificar(mod = fs.readFileSync(MODULO, 'utf8'), destinos = DESTINOS) {
  const problemas = [];
  const v = version(mod), c = cuerpo(mod);
  const copias = [];
  for (const d of destinos) {
    const rel = path.relative(REPO, d);
    let e;
    try { e = extraer(fs.readFileSync(d, 'utf8')); } catch (err) { problemas.push(`${rel}: ${err.message}`); continue; }
    if (!e) { problemas.push(`${rel}: no tiene la copia incrustada`); continue; }
    if (e.v !== v) problemas.push(`${rel}: marcador v=${e.v}, el módulo es ${v}`);
    if (e.contenido !== c) problemas.push(`${rel}: la copia es distinta de induxsoft.theme.js`);
    copias.push(e.contenido);
  }
  if (copias.length > 1 && copias.some(x => x !== copias[0])) problemas.push('las copias incrustadas son distintas entre sí');
  return problemas;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const soloVerificar = process.argv.includes('--check');
  const mod = fs.readFileSync(MODULO, 'utf8');
  if (!soloVerificar) for (const d of DESTINOS) console.log((incrustar(d, mod) ? 'actualizado ' : 'sin cambios ') + path.relative(REPO, d));
  const p = verificar(mod);
  if (p.length) { for (const x of p) console.error('ERROR: ' + x); process.exit(1); }
  console.log(`copias iguales al módulo (v${version(mod)}) en ${DESTINOS.length} archivos`);
}
