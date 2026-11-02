// Pruebas del sitio examples/demo. Uso: node tests/demo/probar.js index,venta,... [--ambas] [--oscuro] [--sin-captura]
// Variables: DEMO (carpeta del sitio, p. ej. examples/demo/_publicar) y CAPTURAS (carpeta de PNG).
// Uso: node probar.js pagina[,pagina...]|todas [--movil] [--ambas] [--oscuro] [--sin-captura]
// Las páginas de F8 (EN_MOVIL) corren su interacción también en el modo móvil (390 px, táctil).
// Abre cada página del sitio por file://, junta errores de consola, corre la interacción de pruebas.js y toma capturas.
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.env.DEMO || path.join(__dirname, '../../examples/demo');
const CAP = process.env.CAPTURAS || path.join(require('os').tmpdir(), 'demo-capturas');
require('fs').mkdirSync(CAP, { recursive: true });
const pruebas = require('./pruebas.js');
const TODAS = 'index,edicion,venta,mascaras,eventos,catalogo,cfdi,agrupacion,columnas,arbol,tarjetas,impresion,compatibilidad,busqueda,validacion,cambios,secuencia,reglas,temas';
const EN_MOVIL = new Set(['busqueda', 'validacion', 'cambios', 'secuencia', 'reglas', 'temas']);
(async () => {
  const paginas = (process.argv[2] === 'todas' ? TODAS : process.argv[2]).split(',');
  const soloMovil = process.argv.includes('--movil'), sinCap = process.argv.includes('--sin-captura'), ambas = process.argv.includes('--ambas');
  const tema = process.argv.includes('--oscuro') ? 'oscuro' : 'claro';
  const b = await chromium.launch({ args: ['--disable-gpu'] });
  let fallas = 0;
  for (const p of paginas) {
    for (const modo of (ambas ? ['escritorio', 'movil'] : [soloMovil ? 'movil' : 'escritorio'])) {
      const ctx = await b.newContext(modo === 'movil' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
      await ctx.addInitScript((t) => { try { localStorage.setItem('edittable-demo-tema', t); } catch (e) {} }, tema);
      const page = await ctx.newPage();
      const errores = [];
      page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', e => errores.push('pageerror: ' + e.message));
      page.on('dialog', d => d.dismiss());
      await page.goto('file://' + path.join(BASE, p + '.html'));
      await page.waitForTimeout(500);
      let res = 'sin prueba';
      if ((modo === 'escritorio' || EN_MOVIL.has(p)) && pruebas[p]) { try { res = await pruebas[p](page); } catch (e) { res = 'FALLA: ' + e.message.split('\n')[0]; fallas++; } }
      if (modo === 'escritorio' && pruebas[p + ':despues']) await pruebas[p + ':despues'](page).catch(() => {});
      if (!sinCap) await page.screenshot({ path: path.join(CAP, `${p}-${modo}${tema === 'oscuro' ? '-oscuro' : ''}.png`), fullPage: modo === 'movil' ? false : true });
      const err = errores.filter(e => !/Tracking Prevention/.test(e));
      if (err.length) fallas++;
      console.log(`[${p} ${modo}] ${res}${err.length ? '\n   CONSOLA: ' + err.join('\n   CONSOLA: ') : ''}`);
      await ctx.close();
    }
  }
  await b.close();
  process.exit(fallas ? 1 : 0);
})();
