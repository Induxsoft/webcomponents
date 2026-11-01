// Texto del motor EditTable.Mask tal como está pegado en el componente (entre sus marcadores), como expresión.
const fs = require('node:fs'), path = require('node:path');
const archivo = path.join(__dirname, '../../src/js/induxsoft.controls.editable.js');
const src = fs.readFileSync(archivo, 'utf8');
const ini = src.indexOf('// ----- EditTable.Mask: inicio'), fin = src.indexOf('// ----- EditTable.Mask: fin');
if (ini < 0 || fin < ini) throw new Error('no se encontró el bloque EditTable.Mask en ' + archivo);
const bloque = src.slice(src.indexOf('\n', ini) + 1, fin);
const m = /^\s*static Mask = ([\s\S]*?);\s*$/.exec(bloque);
if (!m) throw new Error('el bloque EditTable.Mask no tiene la forma "static Mask = (() => {...})();"');
module.exports = { archivo, expresion: m[1] };
