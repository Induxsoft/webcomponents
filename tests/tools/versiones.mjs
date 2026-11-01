#!/usr/bin/env node
// Compara una corrida del banco con otra versión del componente (tests/out*/actual) contra la referencia y separa
// las diferencias «esperables por agregados» de las de comportamiento:
//   - A1 la hoja de estilos del shadow cambia de sha256 (CSS agregado): la línea @@ESTILO se iguala;
//   - A2 propiedades que no existen en la versión vieja ("[undefined]" en una y valor en la otra) se quitan;
//   - A3 «Events claves» y el modo de shadow pedido no se comparan (dependen de los eventos que existan);
//   - la categoría informativa «internos» no se cuenta.
// Lo que queda es comportamiento observable distinto (DOM, datos, eventos, estilos calculados, errores…).
//
//   node tests/tools/versiones.mjs --actual /tmp/ver-3b3db79/actual [--golden tests/golden] [--json salida.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparar, expandirPasos } from '../lib/foto.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const GOLD = path.resolve(arg('--golden', path.join(AQUI, '../golden')));
const ACT = path.resolve(arg('--actual'));
const SAL = arg('--json', null);

const leer = (f) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); j.pasos = expandirPasos(j.pasos); return j; };
const normDom = (l) => Array.isArray(l) ? l.map(x => x.replace(/@@ESTILO sha256:[0-9a-f]+/, '@@ESTILO <css>')) : l;

function normalizar(ref, act) {
  for (let i = 0; i < Math.min(ref.pasos.length, act.pasos.length); i++) {
    const fr = ref.pasos[i].foto, fa = act.pasos[i].foto;
    fr.internos = fa.internos = null;
    fr.luz = normDom(fr.luz); fa.luz = normDom(fa.luz);
    (fr.tablas ?? []).forEach((tr, k) => {
      const ta = fa.tablas?.[k]; if (!ta) return;
      tr.dom = normDom(tr.dom); ta.dom = normDom(ta.dom);
      tr.modoShadowPedido = ta.modoShadowPedido = null;
      if (Array.isArray(tr.props) && Array.isArray(ta.props)) {
        const val = (l) => l.slice(l.indexOf(' = ') + 3);
        const clave = (l) => l.slice(0, l.indexOf(' = '));
        const mr = new Map(tr.props.map(l => [clave(l), l])), ma = new Map(ta.props.map(l => [clave(l), l]));
        const quitar = new Set(['Events claves']);
        for (const [k, l] of ma) if (val(l) === '"[undefined]"' && mr.has(k) && val(mr.get(k)) !== '"[undefined]"') quitar.add(k);
        for (const [k, l] of mr) if (val(l) === '"[undefined]"' && ma.has(k) && val(ma.get(k)) !== '"[undefined]"') quitar.add(k);
        tr.props = tr.props.filter(l => !quitar.has(clave(l)));
        ta.props = ta.props.filter(l => !quitar.has(clave(l)));
      }
    });
  }
}

const res = [];
const walk = (d, pre = '') => fs.readdirSync(d, { withFileTypes: true }).forEach(x => {
  if (x.isDirectory()) walk(path.join(d, x.name), pre + x.name + '/');
  else if (x.name.endsWith('.json')) res.push(pre + x.name.slice(0, -5));
});
walk(GOLD);
const ids = res.filter(id => !id.startsWith('_') && id.includes('/'));
const out = [];
for (const id of ids.sort()) {
  const fa = path.join(ACT, id + '.json');
  if (!fs.existsSync(fa)) { out.push({ id, estado: 'sin-foto (error al correr)' }); continue; }
  const ref = leer(path.join(GOLD, id + '.json')), act = leer(fa);
  const bruto = comparar(ref, act).filter(d => d.estricta).length;
  normalizar(ref, act);
  const difs = comparar(ref, act).filter(d => d.estricta);
  out.push({ id, estado: bruto ? (difs.length ? 'comportamiento' : 'solo-agregados') : 'igual', difs: difs.map(d => ({ paso: d.paso, categoria: d.categoria.replace(/^tablas\[\d+\]#?[^.]*\./, 'tabla.'), diff: d.diff.slice(0, 24) })) });
}
const cuenta = {};
out.forEach(o => { cuenta[o.estado] = (cuenta[o.estado] || 0) + 1; });
console.log(JSON.stringify(cuenta));
for (const o of out.filter(o => o.estado !== 'igual' && o.estado !== 'solo-agregados')) console.log(`${o.estado.padEnd(14)} ${o.id}  ${[...new Set((o.difs ?? []).map(d => d.categoria))].join(', ')}`);
if (SAL) fs.writeFileSync(SAL, JSON.stringify({ cuenta, escenarios: out }, null, 1) + '\n');
