// Evalúa con vm el bloque EditTable.Mask pegado en el componente y devuelve el motor.
const vm = require('node:vm');
const { archivo, expresion } = require('./fuente.cjs');
// runInThisContext: mismo realm que las pruebas (deepStrictEqual compara prototipos).
module.exports = vm.runInThisContext('(' + expresion + ')', { filename: archivo });
