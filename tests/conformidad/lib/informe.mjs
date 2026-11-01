// Informe Markdown y JUnit XML de la batería de conformidad.
import fs from 'node:fs';

const ETQ = { pasada: 'pasada', fallida: 'fallida', defecto: 'defecto conocido', pendiente: 'pendiente', error: 'error del arnés' };

function xml(s) { return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function md(s) { return String(s ?? '').replaceAll('|', '\\|').replaceAll('\n', ' '); }

export function contar(res) {
  const c = { total: res.length, pasada: 0, fallida: 0, defecto: 0, pendiente: 0, error: 0 };
  res.forEach(r => { c[r.estado]++; });
  return c;
}

export function escribirInformes({ dir, resultados, meta }) {
  fs.mkdirSync(dir, { recursive: true });
  const suites = [];
  for (const r of resultados) {
    let s = suites.find(x => x.nombre === r.suite);
    if (!s) suites.push((s = { nombre: r.suite, grupo: r.grupo, res: [] }));
    s.res.push(r);
  }

  // ---------- Markdown ----------
  const L = [];
  L.push('# Batería de conformidad de EdiTable: informe');
  L.push('');
  L.push(`- Componente bajo prueba: \`${meta.src}\` (sha256 \`${meta.sha.slice(0, 16)}…\`)`);
  L.push(`- Referencia para R1: \`${meta.ref}\``);
  L.push(`- Archivo de Excel: \`${meta.excel}\`${meta.excelExiste ? '' : ' (no existe: sus pruebas quedan pendientes)'}`);
  L.push(`- \`EditTable.version\`: ${meta.version ? '`' + meta.version + '`' : '(no existe: se asume versión 1)'}; \`EditTable.features\`: ${meta.features.length ? '`' + meta.features.join(', ') + '`' : '(vacío)'}`);
  L.push(`- Fecha: ${meta.fecha}; duración: ${meta.duracion} s; filtro: ${meta.filtro || '(ninguno)'}; solo: ${meta.solo || '(todo)'}`);
  L.push('');
  const tot = contar(resultados);
  L.push(`**Total:** ${tot.total} pruebas · ${tot.pasada} pasadas · ${tot.fallida} fallidas · ${tot.defecto} defectos conocidos · ${tot.pendiente} pendientes · ${tot.error} errores del arnés`);
  L.push('');
  for (const g of ['actual', 'correcciones', 'v2']) {
    const ss = suites.filter(s => s.grupo === g);
    if (!ss.length) continue;
    const c = contar(ss.flatMap(s => s.res));
    L.push(`## Grupo ${g} (${c.total}: ${c.pasada} pasadas, ${c.fallida} fallidas, ${c.defecto} defectos conocidos, ${c.pendiente} pendientes, ${c.error} errores)`);
    L.push('');
    L.push('| Suite | Total | Pasadas | Fallidas | Defecto conocido | Pendientes | Errores |');
    L.push('|---|---|---|---|---|---|---|');
    for (const s of ss) {
      const k = contar(s.res);
      L.push(`| ${s.nombre} | ${k.total} | ${k.pasada} | ${k.fallida} | ${k.defecto} | ${k.pendiente} | ${k.error} |`);
    }
    L.push('');
  }
  L.push('## Detalle de lo que no pasó');
  L.push('');
  for (const s of suites) {
    const malas = s.res.filter(r => r.estado !== 'pasada');
    if (!malas.length) continue;
    L.push(`### ${s.nombre}`);
    L.push('');
    L.push('| Prueba | Estado | Spec | Motivo |');
    L.push('|---|---|---|---|');
    for (const r of malas) L.push(`| \`${r.id}\` ${md(r.titulo)} | ${ETQ[r.estado]} | ${md((r.spec || []).join(', '))} | ${md(r.mensaje).slice(0, 400)} |`);
    L.push('');
  }
  fs.writeFileSync(`${dir}/report.md`, L.join('\n'));

  // ---------- JUnit ----------
  const X = ['<?xml version="1.0" encoding="UTF-8"?>'];
  X.push(`<testsuites name="edittable-conformidad" tests="${tot.total}" failures="${tot.fallida}" errors="${tot.error}" skipped="${tot.pendiente + tot.defecto}" time="${meta.duracion}">`);
  for (const s of suites) {
    const k = contar(s.res);
    const t = s.res.reduce((a, r) => a + r.ms, 0) / 1000;
    X.push(`  <testsuite name="${xml(s.nombre)}" tests="${k.total}" failures="${k.fallida}" errors="${k.error}" skipped="${k.pendiente + k.defecto}" time="${t.toFixed(3)}">`);
    for (const r of s.res) {
      X.push(`    <testcase classname="${xml(s.grupo + '.' + s.nombre)}" name="${xml(r.id + ' ' + r.titulo)}" time="${(r.ms / 1000).toFixed(3)}">`);
      if (r.estado === 'fallida') X.push(`      <failure message="${xml(r.mensaje)}"/>`);
      else if (r.estado === 'error') X.push(`      <error message="${xml(r.mensaje)}"/>`);
      else if (r.estado === 'pendiente') X.push(`      <skipped message="${xml('pendiente: ' + r.mensaje)}"/>`);
      else if (r.estado === 'defecto') X.push(`      <skipped message="${xml('defecto conocido ' + r.defecto + ': ' + r.mensaje)}"/>`);
      X.push('    </testcase>');
    }
    X.push('  </testsuite>');
  }
  X.push('</testsuites>');
  fs.writeFileSync(`${dir}/junit.xml`, X.join('\n'));
  fs.writeFileSync(`${dir}/resultados.json`, JSON.stringify({ meta, resultados }, null, 1));
}
