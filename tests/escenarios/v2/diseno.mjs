// v2 §9: diseño (F3). getLayout/setLayout/ResetLayout y el guardado automático en IndexedDB.
import { pagina, tabla } from '../../lib/pagina.mjs';
import { html, PRODUCTOS, COLS } from './_f3comun.mjs';
const E = ['v2', 'f3', 'layout'];
const leerBd = `window.__leerBd = () => new Promise(res => { const r = indexedDB.open('induxsoft-edittable'); r.onupgradeneeded = () => { try { r.transaction.abort(); } catch (e) {} }; r.onerror = () => res(null); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('layouts')) { db.close(); res([]); return; } const out = []; const c = db.transaction('layouts').objectStore('layouts').openCursor(); c.onsuccess = () => { const x = c.result; if (x) { out.push({ key: x.key, layout: x.value.layout, huella: x.value.huella }); x.continue(); } else { db.close(); res(out); } }; }; });`;
export default [
  {
    id: 'diseno-api', titulo: 'getLayout, setLayout (por field, ignora lo desconocido), LayoutRejected con v mayor, ResetLayout, LayoutChanged con reason',
    etiquetas: E, origen: 'spec §9.1', registro: 'consumer',
    html: html({}),
    pasos: [
      ['setLayout', h => h.js(() => ET('t1').setLayout({ v: 1, raro: 1, columns: [{ field: 'precio', order: 0, fixed: true, width: 150 }, { field: 'noexiste', order: 1 }, { field: 'nombre', order: 2, hidden: true }, { field: 'codigo', order: 3 }] }))],
      ['setLayout v:99', h => h.js(() => ET('t1').setLayout({ v: 99, columns: [] }))],
      ['setLayout silent', h => h.js(() => ET('t1').setLayout({ v: 1, columns: [{ field: 'nombre', hidden: false }] }, { silent: true }))],
      ['clic en el encabezado Código (sort)', h => h.clicEncabezado('t1', 3)],
      ['ResetLayout', h => h.js(() => ET('t1').ResetLayout())],
    ],
  },
  {
    // Cambio visible de §9.2 (D3): una tabla SIN atributos nuevos, con id estable, recuerda los anchos.
    // La primera carga (sin nada guardado) es idéntica a F1; después de redimensionar y recargar, el ancho vuelve.
    id: 'diseno-recarga-ancho', titulo: 'tabla sin atributos nuevos con id estable: redimensionar, esperar 500 ms y recargar restaura el ancho (solo anchos; el orden por clic no)',
    etiquetas: E, origen: 'spec §9.2 (D3, salvaguardas 2 y 3)', registro: 'consumer',
    html: pagina({ body: tabla({ data: PRODUCTOS, cols: COLS(), style: 'width:700px' }), script: leerBd + `window.__etExtra = () => { const t = ET('t1'); return { anchos: Array.from(ETs('t1').querySelectorAll('thead th')).map(th => th.style.width), layout: t.getLayout(), primera: t.DataArray[0].codigo, bd: window.__bd ?? null }; };` }),
    pasos: [
      ['redimensionar Nombre +80', h => h.redimensionar('t1', 1, 80)],
      ['esperar 600 ms (se guarda)', async h => { await h.esperar(600); await h.page.waitForTimeout(150); await h.asentar(); }],
      ['leer IndexedDB', async h => { const r = await h.page.evaluate(() => window.__leerBd()); await h.js((r) => { window.__bd = r; }, r); }],
      ['recargar la página', async h => { await h.page.reload({ waitUntil: 'load' }); await h.asentar(100); await h.page.waitForTimeout(300); await h.asentar(); }],
    ],
  },
];
