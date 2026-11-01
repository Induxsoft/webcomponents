// Procesado de las fotos que devuelve window.__etSnap(): normalización, almacén de CSS y comparación.
import { createHash } from 'node:crypto';
import { diffLineas, parche, aplicarParche } from './diff.mjs';

export const sha = (s) => createHash('sha256').update(s).digest('hex');
export const sha16 = (s) => sha(s).slice(0, 16);

// ---------- Reglas de normalización (documentadas en tests/README.md) ----------
// N1. uuid de _generateUUID (32 hex con «4» en la posición 13 y [89ab] en la 17) -> <uuid>
const RE_UUID = /\b[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}\b/g;
// N2. Pilas de llamadas y posiciones «archivo:línea:columna» en mensajes de consola -> se quitan
const RE_STACK = /\n\s+at [^\n]*/g;
const RE_POS = /(\.js|\.html|\.mjs)(\?[^:\s)]*)?:\d+:\d+/g;
// N3. El origen de las pruebas (http://et.test) se deja tal cual: es fijo.

export function normTexto(s) {
  return s.replace(RE_UUID, '<uuid>');
}
export function normMensaje(s) {
  return normTexto(String(s).replace(RE_STACK, '').replace(RE_POS, '$1:<pos>'));
}

function normDeep(v) {
  if (typeof v === 'string') return normTexto(v);
  if (Array.isArray(v)) return v.map(normDeep);
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[normTexto(k)] = normDeep(v[k]); return o; }
  return v;
}

const RE_CS_ATTR = / control-styles=("(?:[^"\\]|\\.)*")/g;

/**
 * Convierte la foto cruda en la forma que se guarda y se compara.
 * - El texto de cada <style> va al almacén (por sha256) y en el DOM queda «@@ESTILO sha256:xxxx».
 * - privado: el contenido de control-styles (tema de un consumidor de repo privado) no se guarda; queda su sha256.
 */
export function procesarFoto(raw, { privado = false, almacen }) {
  const csPriv = new Map(); // texto -> marca
  const marcaPriv = (txt) => {
    if (!csPriv.has(txt)) csPriv.set(txt, `[control-styles privado sha256:${sha16(txt)}]`);
    return csPriv.get(txt);
  };
  const guardaEstilo = (texto, controlStyles) => {
    let t = texto;
    if (privado && controlStyles) t = t.split(controlStyles).join(`/*${marcaPriv(controlStyles)}*/`);
    const h = sha16(t);
    if (almacen && !almacen.has(h)) almacen.set(h, t);
    return 'sha256:' + h;
  };
  const reemplazaEstilos = (lineas, textos, controlStyles) => (lineas ?? null) && lineas.map(l => {
    const m = /^(\s*)@@ESTILO (\d+)$/.exec(l);
    if (!m) return l;
    return m[1] + '@@ESTILO ' + guardaEstilo(textos[Number(m[2])] ?? '', controlStyles);
  });
  const privAttrs = (lineas) => (!privado || !lineas) ? lineas : lineas.map(l => l.replace(RE_CS_ATTR, (_, q) => {
    let v; try { v = JSON.parse(q); } catch { v = q; }
    return ' control-styles=' + JSON.stringify(marcaPriv(v));
  }));

  const tablas = raw.tablas.map(t => {
    const { estilosTexto, controlStyles, ...resto } = t;
    resto.dom = privAttrs(reemplazaEstilos(t.dom, estilosTexto ?? [], controlStyles));
    // props y estilos como líneas «clave = valor» (diferencias legibles y guardado por parches)
    if (resto.props && typeof resto.props === 'object') resto.props = Object.keys(resto.props).map(k => k + ' = ' + JSON.stringify(resto.props[k]));
    if (resto.estilos && typeof resto.estilos === 'object') {
      const e = resto.estilos, L = [];
      for (const k of ['host', 'contenedor', 'table', 'thead']) if (k in e) L.push(k + ' = ' + e[k]);
      (e.th ?? []).forEach((v, i) => L.push(`th[${i}] = ${v}`));
      (e.filas ?? []).forEach(f => { L.push(`tr[${f.fila}] = ${f.tr}`); f.td.forEach((v, j) => L.push(`tr[${f.fila}].td[${j}] = ${v}`)); });
      for (const k of ['selector', 'input']) if (k in e) L.push(k + ' = ' + e[k]);
      resto.estilos = L;
    }
    if (privado && resto.props && typeof resto.props.attributes !== 'undefined') { /* nombres, sin valores: se conserva */ }
    return resto;
  });
  const luz = privAttrs(reemplazaEstilos(raw.luz, raw.luzEstilos ?? [], null));
  const out = {
    tablas,
    luz,
    foco: raw.foco,
    eventos: raw.eventos,
    callbacks: raw.callbacks,
    callbacksTruncados: raw.callbacksTruncados || 0,
    errores: (raw.errores ?? []).map(normMensaje),
    consola: (raw.consola ?? []).map(normMensaje),
  };
  if (raw.extra !== undefined) out.extra = raw.extra;
  out.internos = raw.internos;
  return normDeep(out);
}

// ---------- Categorías ----------
// Estrictas: cualquier diferencia hace fallar la corrida. Informativas: se reportan, no fallan.
export const INFORMATIVAS = new Set(['internos']);

export function categorias(foto) {
  const c = {};
  (foto.tablas ?? []).forEach((t, i) => {
    const p = `tablas[${i}]` + (t.id ? `#${t.id}` : '');
    c[p + '.dom'] = t.dom;
    c[p + '.datos'] = t.datos;
    c[p + '.columnas'] = t.columnas;
    c[p + '.respaldo'] = t.respaldo;
    c[p + '.props'] = t.props;
    c[p + '.estilos'] = t.estilos;
    c[p + '.estado'] = { id: t.id, inicializada: t.inicializada, modoShadowPedido: t.modoShadowPedido, shadowEsElGuardado: t.shadowEsElGuardado };
  });
  c.luz = foto.luz;
  c.foco = foto.foco;
  c.eventos = foto.eventos;
  c.callbacks = { lista: foto.callbacks, truncados: foto.callbacksTruncados };
  c.errores = foto.errores;
  c.consola = foto.consola;
  if (foto.extra !== undefined) c.extra = foto.extra;
  c.internos = foto.internos;
  return c;
}

const lineasDe = (v) => (Array.isArray(v) && v.every(x => typeof x === 'string')) ? v : aJSON(v ?? null).split('\n');

/** Compara dos escenarios (referencia y actual). Devuelve la lista de diferencias. */
export function comparar(ref, act) {
  const difs = [];
  const nRef = ref.pasos.map(p => p.nombre), nAct = act.pasos.map(p => p.nombre);
  if (JSON.stringify(nRef) !== JSON.stringify(nAct)) {
    difs.push({ paso: '(lista de pasos)', categoria: 'pasos', estricta: true, diff: diffLineas(nRef, nAct) });
  }
  const n = Math.min(ref.pasos.length, act.pasos.length);
  for (let i = 0; i < n; i++) {
    const cr = categorias(ref.pasos[i].foto), ca = categorias(act.pasos[i].foto);
    const keys = new Set([...Object.keys(cr), ...Object.keys(ca)]);
    for (const k of keys) {
      const a = JSON.stringify(cr[k] ?? null), b = JSON.stringify(ca[k] ?? null);
      if (a === b) continue;
      difs.push({ paso: `${i}:${ref.pasos[i].nombre}`, categoria: k, estricta: !INFORMATIVAS.has(k), diff: diffLineas(lineasDe(cr[k]), lineasDe(ca[k])) });
    }
  }
  return difs;
}

// ---------- Guardado compacto ----------
// En el JSON guardado, una categoría igual a la del paso anterior se escribe como IGUAL (se expande al leer).
export const IGUAL = '@=paso-anterior';
const DELTAS = new Set(['eventos', 'callbacks', 'callbacksTruncados', 'errores', 'consola']);
const esLineas = (v) => Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string');

export function compactarPasos(pasos) {
  let prev = null;
  return pasos.map((p) => {
    const f = p.foto, out = {};
    for (const k of Object.keys(f)) {
      if (k === 'tablas') {
        out.tablas = f.tablas.map((t, i) => {
          const pt = prev?.tablas?.[i];
          if (!pt || pt.id !== t.id) return t;
          const o = {};
          for (const tk of Object.keys(t)) {
            if (tk !== 'indice' && tk !== 'id' && JSON.stringify(t[tk]) === JSON.stringify(pt[tk])) o[tk] = IGUAL;
            else if (esLineas(t[tk]) && esLineas(pt[tk])) o[tk] = { $parche: parche(pt[tk], t[tk]) };
            else o[tk] = t[tk];
          }
          return o;
        });
      } else if (prev && !DELTAS.has(k) && k in prev && JSON.stringify(f[k]) === JSON.stringify(prev[k])) out[k] = IGUAL;
      else if (prev && !DELTAS.has(k) && esLineas(f[k]) && esLineas(prev[k])) out[k] = { $parche: parche(prev[k], f[k]) };
      else out[k] = f[k];
    }
    prev = f;
    return { nombre: p.nombre, foto: out };
  });
}

export function expandirPasos(pasos) {
  let prev = null;
  return pasos.map((p) => {
    const f = p.foto, out = {};
    for (const k of Object.keys(f)) {
      const ex = (v, ant) => (v === IGUAL ? ant : (v && typeof v === 'object' && v.$parche) ? aplicarParche(ant, v.$parche) : v);
      if (k === 'tablas') out.tablas = f.tablas.map((t, i) => { const o = {}; for (const tk of Object.keys(t)) o[tk] = ex(t[tk], prev?.tablas?.[i]?.[tk]); return o; });
      else out[k] = ex(f[k], prev?.[k]);
    }
    prev = out;
    return { nombre: p.nombre, foto: out };
  });
}

/** JSON legible y compacto: lo que cabe en ~110 caracteres va en una línea. */
export function aJSON(v, ind = '') {
  const s = JSON.stringify(v);
  if (s === undefined) return 'null';
  if (v === null || typeof v !== 'object' || s.length <= 110) return s;
  const ni = ind + ' ';
  if (Array.isArray(v)) return '[\n' + v.map(x => ni + aJSON(x, ni)).join(',\n') + '\n' + ind + ']';
  return '{\n' + Object.keys(v).filter(k => v[k] !== undefined).map(k => ni + JSON.stringify(k) + ': ' + aJSON(v[k], ni)).join(',\n') + '\n' + ind + '}';
}
