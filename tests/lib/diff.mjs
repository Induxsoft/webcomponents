// Diferencias por líneas (Myers, O(ND)) con salida tipo «unified» y contexto.

export function diffLineas(a, b, contexto = 3, maxSalida = 400) {
  return formatear(opsLineas(a, b), contexto, maxSalida);
}

/** Script de edición por líneas: [[' '|'-'|'+', línea], …] */
export function opsLineas(a, b) {
  const n = a.length, m = b.length, max = n + m;
  const v = new Map([[1, 0]]);
  const trace = [];
  let found = false;
  for (let d = 0; d <= max && !found; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && (v.get(k - 1) ?? -1) < (v.get(k + 1) ?? -1))) x = v.get(k + 1) ?? 0;
      else x = (v.get(k - 1) ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v.set(k, x);
      if (x >= n && y >= m) { found = true; break; }
    }
    if (d > 20000) break; // demasiado distinto: se corta
  }
  // reconstrucción
  const ops = [];
  let x = n, y = m;
  for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
    const vv = trace[d];
    const k = x - y;
    let pk;
    if (k === -d || (k !== d && (vv.get(k - 1) ?? -1) < (vv.get(k + 1) ?? -1))) pk = k + 1; else pk = k - 1;
    const px = vv.get(pk) ?? 0, py = px - pk;
    while (x > px && y > py) { ops.push([' ', a[x - 1]]); x--; y--; }
    if (d > 0) {
      if (x === px) { ops.push(['+', b[y - 1]]); y--; }
      else { ops.push(['-', a[x - 1]]); x--; }
    }
  }
  while (x > 0 && y > 0) { ops.push([' ', a[x - 1]]); x--; y--; }
  while (x > 0) { ops.push(['-', a[x - 1]]); x--; }
  while (y > 0) { ops.push(['+', b[y - 1]]); y--; }
  ops.reverse();
  return ops;
}

function formatear(ops, contexto, maxSalida) {
  // hunks con contexto
  const out = [];
  let ai = 0, bi = 0;
  const marks = ops.map(o => o[0] !== ' ');
  for (let i = 0; i < ops.length; i++) {
    const near = marks.slice(Math.max(0, i - contexto), i + contexto + 1).some(Boolean);
    if (near) {
      if (out.length === 0 || out[out.length - 1].fin !== i - 1) out.push({ ini: i, fin: i, a: ai, b: bi, lineas: [] });
      const h = out[out.length - 1];
      h.fin = i;
      h.lineas.push(ops[i][0] + ' ' + ops[i][1]);
    }
    if (ops[i][0] !== '+') ai++;
    if (ops[i][0] !== '-') bi++;
  }
  const lines = [];
  for (const h of out) {
    lines.push(`@@ -${h.a + 1} +${h.b + 1} @@`);
    lines.push(...h.lineas);
    if (lines.length > maxSalida) { lines.push(`… (salida recortada a ${maxSalida} líneas)`); break; }
  }
  return lines;
}

/** Parche compacto de a -> b: [[posición en a, cuántas borrar, [líneas nuevas]], …] */
export function parche(a, b) {
  const ops = opsLineas(a, b);
  const out = [];
  let ia = 0, cur = null;
  for (const [t, l] of ops) {
    if (t === ' ') { cur = null; ia++; continue; }
    if (!cur) { cur = [ia, 0, []]; out.push(cur); }
    if (t === '-') { cur[1]++; ia++; } else cur[2].push(l);
  }
  return out;
}

export function aplicarParche(a, p) {
  const r = [];
  let ia = 0;
  for (const [pos, del, ins] of p) {
    while (ia < pos) r.push(a[ia++]);
    ia += del;
    r.push(...ins);
  }
  while (ia < a.length) r.push(a[ia++]);
  return r;
}
