// Iteración 2026-11b, bloque N: el botón de columnas se queda en la orilla derecha visible al desplazar la tabla a
// lo ancho (contenedor interno, contenedor de la página con overflow:revert como V12, y shadow DOM cerrado) y la
// fila seleccionada sin tema tiene contraste AA (blanco sobre #2F66CC, 5.39:1; antes #3D75DD, 4.39:1).
import { tabla } from '../lib/fixtures.mjs';
import { registro } from '../lib/v2.mjs';
import { Falla } from '../lib/arnes.mjs';

const { P, t } = registro('bn', { requiere: ['chooser'] });
const COLS = Array.from({ length: 14 }, (_, k) => ({ field: 'c' + k, title: 'Columna de prueba ' + k }));
const DATOS = Array.from({ length: 30 }, (_, i) => Object.fromEntries(COLS.map((c, k) => [c.field, `F${i} C${k}`])));
const ATR = { 'column-chooser': 'true', 'hidde-selector': 'true' };
// externo: como uie.dbeditable (list_table_container con scroll y control-styles con overflow:revert)
const pag = (o = {}) => {
  const a = { ...ATR, ...(o.a ?? {}) };
  if (o.externo) a['control-styles'] = 'div:has(table#t1) { overflow:revert !important; }';
  const t1 = tabla({ a, cols: COLS, data: DATOS });
  const caja = o.externo ? `<div id="caja" style="width:500px; overflow-y:auto; max-height:300px">${t1}</div>`
                         : `<div id="caja" style="width:500px; height:300px">${t1}</div>`;
  return { body: caja, antes: o.cerrado ? '<script>window.__ctShadowCerrado = true;</script>' : '' };
};
// Distancia de la orilla derecha del botón a la orilla derecha visible (la caja de 500 px, sin la barra de scroll)
const medir = (c) => c.ev(() => {
  const b = window.__ct.sr('t1').querySelector('.et-chooser-btn'), caja = document.getElementById('caja');
  const sc = caja.getBoundingClientRect().left + caja.clientLeft + caja.clientWidth;
  const r = b.getBoundingClientRect(), th = window.__ct.sr('t1').querySelector('thead').getBoundingClientRect();
  return { dist: Math.round(sc - r.right), arriba: Math.round(r.top - th.top), estilo: b.getAttribute('style') };
});
const scrollInterno = (c, x, y = 0) => c.ev(([x, y]) => { const d = window.__ct.sr('t1').querySelector('table').parentElement; d.scrollLeft = x; d.scrollTop = y; return d.scrollLeft; }, [x, y]);
const scrollExterno = (c, x, y = 0) => c.ev(([x, y]) => { const d = document.getElementById('caja'); d.scrollLeft = x; d.scrollTop = y; return d.scrollLeft; }, [x, y]);
const cuadros = async (c) => { await c.cuadro(); await c.cuadro(); await c.esperar(30); };

t('01', 'sin desplazar: el botón a 8 px de la orilla derecha y sin atributo style (DOM de antes)', ['§7-c'], async (c) => {
  await c.abrir(pag());
  await cuadros(c);
  const m = await medir(c);
  c.ok(Math.abs(m.dist - 8) <= 1, `distancia ${m.dist}`);
  c.igual(m.estilo, null);
});
t('02', 'contenedor interno desplazado a lo ancho y a lo alto: el botón sigue en la orilla derecha visible y sobre el encabezado', ['§7-c'], async (c) => {
  await c.abrir(pag());
  const x = await scrollInterno(c, 5000, 200);
  if (!(x > 0)) throw new Falla('la tabla no desplaza a lo ancho');
  await cuadros(c);
  const m = await medir(c);
  c.ok(Math.abs(m.dist - 8) <= 1, `distancia ${m.dist}`);
  c.ok(Math.abs(m.arriba - 3) <= 1, `arriba ${m.arriba}`);
  await scrollInterno(c, 0, 0); await cuadros(c);
  const m0 = await medir(c);
  c.ok(Math.abs(m0.dist - 8) <= 1, `de regreso, distancia ${m0.dist}`);
  c.igual(m0.estilo, null, 'de regreso, sin style');
});
t('03', 'contenedor de la página (overflow:revert, como V12) con shadow DOM cerrado: el botón sigue en la orilla derecha visible', ['§7-c'], async (c) => {
  await c.abrir(pag({ externo: true, cerrado: true }));
  const x = await scrollExterno(c, 5000, 150);
  if (!(x > 0)) throw new Falla('la caja no desplaza a lo ancho');
  await cuadros(c);
  const m = await medir(c);
  c.ok(Math.abs(m.dist - 8) <= 1, `distancia ${m.dist}`);
  c.ok(Math.abs(m.arriba - 3) <= 1, `arriba ${m.arriba}`);
});
t('04', 'tabla oculta al cargar (pestaña): al mostrarla y desplazarla el botón queda en la orilla derecha visible', ['§7-c'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => { document.getElementById('caja').style.display = 'none'; });
  await cuadros(c);
  await c.ev(() => { document.getElementById('caja').style.display = ''; });
  await scrollInterno(c, 5000); await cuadros(c);
  const m = await medir(c);
  c.ok(Math.abs(m.dist - 8) <= 1, `distancia ${m.dist}`);
});
t('05', 'sin tema, la fila seleccionada tiene contraste AA (≥ 4.5:1)', ['§T-r1'], async (c) => {
  await c.abrir(pag({ a: { 'column-chooser': 'false' } }));
  const r = await c.ev(() => {
    const tr = window.__ct.sr('t1').querySelector('tbody tr'); tr.classList.add('EdiTable-Row-Selected');
    const cs = getComputedStyle(tr), num = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
    const L = (p) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = p.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const a = L(num(cs.color)), b = L(num(cs.backgroundColor));
    return { bg: cs.backgroundColor, k: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });
  c.ok(r.k >= 4.5, `contraste ${r.k.toFixed(2)} (${r.bg})`);
}, { requiere: [] });

export default { nombre: 'v2-barras', grupo: 'v2', pruebas: P };
