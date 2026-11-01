#!/usr/bin/env node
// Genera tests/CATALOGO.md a partir de los escenarios (id, título, propósito, origen, etiquetas y pasos).
//   node tests/tools/catalogo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(AQUI, '..');
const CARPETAS = ['basicos', 'tipos', 'edicion', 'teclado', 'eventos', 'datos', 'arbol', 'tarjetas', 'presentacion', 'impresion', 'v12', 'defectos', 'rendimiento'];
const DESC = {
  basicos: 'Inicialización (formas de declarar la tabla y de darle datos) y las demos de examples/.',
  tipos: 'Cada tipo de columna, InputKey y columna con botón.',
  edicion: 'Iniciar, confirmar y cancelar la edición; eventos que la controlan; auto-confirm; html-encode; readonly.',
  teclado: 'Teclas del selector y propiedades AutoAddRow, AutoDelRow, EverMove y PagOffSet.',
  eventos: 'Los 21 eventos, sus dos formas de registro y el addEventListener sobrescrito.',
  datos: 'API pública de datos, filas, índices, respaldo, orden, columnas y plantillas.',
  arbol: 'Vista en árbol, expandir/colapsar, ordenar en árbol, mover filas y RowIndent.',
  tarjetas: 'Vista de tarjetas (original y configurable), badges, decoración de filas y fechas relativas.',
  presentacion: 'Encabezado fijo, ancho de columnas, orden por encabezado, control-styles y atributos visuales.',
  impresion: 'beforeprint/afterprint, @media print y PDF.',
  v12: 'Lo que genera uie.dbeditable y lo que hacen list.dk, la impresión y la exportación CSV de V12.',
  defectos: 'Defectos conocidos congelados como comportamiento actual (etiqueta defecto-conocido).',
  rendimiento: 'Mediciones (no se comparan byte a byte; solo con --rendimiento).',
};

const md = ['# Catálogo de escenarios del banco de EdiTable', '', '*Generado por `node tests/tools/catalogo.mjs`; no editar a mano.*', ''];
const resumen = [];
const cuerpo = [];
let total = 0;
for (const c of CARPETAS) {
  const dir = path.join(BASE, 'escenarios', c);
  const lista = [];
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mjs')).sort()) {
      const mod = await import(pathToFileURL(path.join(dir, f)).href);
      (Array.isArray(mod.default) ? mod.default : []).forEach(e => lista.push({ ...e, archivo: `escenarios/${c}/${f}` }));
    }
  }
  total += lista.length;
  resumen.push(`| \`${c}/\` | ${lista.length} | ${DESC[c]} |`);
  cuerpo.push(`## ${c}/ (${lista.length})`, '', DESC[c], '');
  if (!lista.length) { cuerpo.push('*(sin escenarios todavía; ver README, «Agregar escenarios de un consumidor»)*', ''); continue; }
  cuerpo.push('| Escenario | Qué congela | Origen | Pasos |', '|---|---|---|---|');
  for (const e of lista) {
    const et = (e.etiquetas ?? []).length ? ` **[${e.etiquetas.join(', ')}]**` : '';
    const prop = e.proposito ? `<br>${e.proposito}` : '';
    const mods = [e.registro === 'consumer' ? 'registro: consumer' : '', e.privado ? 'privado' : '', (e.requiere ?? []).length ? 'requiere: ' + e.requiere.join(',') : '', e.viewport ? `${e.viewport.width}×${e.viewport.height}` : ''].filter(Boolean).join(' · ');
    const pasos = e.tipo === 'rendimiento' ? 'mide' : String((e.pasos ?? []).length + (e.fotoInicial === false ? 0 : 1));
    cuerpo.push(`| \`${c}/${e.id}\` | ${(e.titulo ?? '').replaceAll('|', '\\|')}${et}${prop.replaceAll('|', '\\|')}${mods ? `<br><sub>${mods}</sub>` : ''} | ${(e.origen ?? (e.url ? e.url : '')).replaceAll('|', '\\|')} | ${pasos} |`);
  }
  cuerpo.push('');
}
md.push('| Carpeta | Escenarios | Contenido |', '|---|---|---|', ...resumen, `| **total** | **${total}** | |`, '', '«Pasos» cuenta las fotos: la inicial más una por paso.', '', ...cuerpo);
fs.writeFileSync(path.join(BASE, 'CATALOGO.md'), md.join('\n') + '\n');
console.log(`CATALOGO.md: ${total} escenarios`);
