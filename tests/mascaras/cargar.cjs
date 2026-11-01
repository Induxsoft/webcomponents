// Carga editable.mask.js con vm (el archivo no exporta nada) y devuelve EditTableMask.
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
const archivo = path.join(__dirname, '../../src/js/_partes/editable.mask.js');
// runInThisContext: mismo realm que las pruebas (deepStrictEqual compara prototipos).
vm.runInThisContext(fs.readFileSync(archivo, 'utf8'), { filename: archivo });
module.exports = vm.runInThisContext('EditTableMask');
