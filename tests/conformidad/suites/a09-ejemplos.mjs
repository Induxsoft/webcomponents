// Los ejemplos de examples/v2: los "actual" deben abrir sin errores de consola; los "v2" sin excepciones de JavaScript
// (con la función ausente muestran el aviso "función no disponible" y no fallan).
import { leerEjemplos, abrirEjemplo } from '../capturas.mjs';

const P = [];
const P2 = [];
for (const ej of leerEjemplos()) {
  if (ej.tipo === 'actual') {
    P.push({ id: 'ejm-' + ej.archivo.replace(/\.html$/, ''), titulo: `el ejemplo ${ej.archivo} abre sin errores de consola`, spec: ['A.ejemplos', ...ej.spec], fn: async (c) => {
      const r = await abrirEjemplo(c.browser, c.srv.base, ej);
      c.igual(r.errores, [], 'errores de consola');
    }, limite: 60000 });
  } else {
    P2.push({ id: 'ejv-' + ej.archivo.replace(/\.html$/, ''), titulo: `el ejemplo ${ej.archivo} abre sin excepciones; si falta una función muestra el aviso`, spec: ['A.ejemplos'], fn: async (c, env) => {
      const r = await abrirEjemplo(c.browser, c.srv.base, ej);
      // los 404 del archivo de Excel (aún no existe en esta rama) no cuentan
      const errs = r.errores.filter(e => !/Failed to load resource/.test(e));
      c.igual(errs, [], 'excepciones');
      const faltan = (ej.requiere || []).filter(x => !env.disponible(x));
      if (faltan.length) c.ok(r.avisoV2 || ej.archivo.startsWith('b06'), 'debe mostrar el aviso de función no disponible');
    }, limite: 90000 });
  }
}

export default [{ nombre: 'actual-ejemplos', grupo: 'actual', pruebas: P }, { nombre: 'v2-ejemplos', grupo: 'v2', pruebas: P2 }];
