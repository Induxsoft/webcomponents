// Acciones que usan los pasos de los escenarios. Cada acción termina con asentar(): avanza el reloj simulado
// (dispara los setTimeout de 1 ms del teclado, el setInterval de 1 s de auto-confirm/LostFocus y los
// requestAnimationFrame simulados) y espera dos cuadros reales (ResizeObserver, matchMedia, IntersectionObserver).

export const PASO_MS = 50;

export function crearAcciones(page, { errores = [] } = {}) {
  const h = {
    page,

    /** Avanza el reloj simulado y deja que el navegador dibuje. */
    async asentar(ms = PASO_MS) {
      await page.clock.runFor(ms);
      await page.evaluate(() => window.__etFlush());
      await page.clock.runFor(20);
      await page.evaluate(() => window.__etFlush());
    },

    /** Avanza el reloj (por ejemplo 1100 ms para que corra el setInterval de auto-confirm). */
    async esperar(ms) { await h.asentar(ms); },

    /** Ejecuta una función en la página (con un argumento serializable) y asienta. */
    async js(fn, arg) {
      // Una excepción del componente es un resultado, no un fallo del banco: se registra en «errores».
      let r;
      try { r = await page.evaluate(fn, arg); }
      catch (e) { errores.push('excepción en el paso: ' + String(e && e.message || e).split('\n')[0].replace(/^page\.evaluate: /, '')); }
      await h.asentar();
      return r;
    },

    /** Ejecuta sin asentar (para medir o leer). */
    async leer(fn, arg) { return page.evaluate(fn, arg); },

    async _punto(fnSel, arg) {
      const p = await page.evaluate(([src, a]) => {
        const f = new Function('a', 'return (' + src + ')(a)');
        const el = f(a);
        if (!el) return null;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
      }, [fnSel.toString(), arg]);
      if (!p) throw new Error('No encontré el elemento para la acción: ' + fnSel.toString().slice(0, 120) + ' ' + JSON.stringify(arg));
      return p;
    },

    /** Clic real (ratón) en la celda [fila, col] del tbody de la tabla `id`. */
    async clicCelda(id, fila, col, opts = {}) {
      const p = await h._punto(([i, r, c]) => ETs(i).querySelector('tbody').rows[r].cells[c], [id, fila, col]);
      await page.mouse.click(p.x, p.y, opts);
      await h.asentar();
    },

    async dobleClicCelda(id, fila, col) {
      const p = await h._punto(([i, r, c]) => ETs(i).querySelector('tbody').rows[r].cells[c], [id, fila, col]);
      await page.mouse.dblclick(p.x, p.y);
      await h.asentar();
    },

    /** Clic real en un elemento del shadow DOM (selector CSS dentro del shadow). */
    async clicShadow(id, css) {
      const p = await h._punto(([i, s]) => ETs(i).querySelector(s), [id, css]);
      await page.mouse.click(p.x, p.y);
      await h.asentar();
    },

    /** Clic real en un elemento del documento (light DOM). */
    async clic(css) {
      const p = await h._punto((s) => document.querySelector(s), css);
      await page.mouse.click(p.x, p.y);
      await h.asentar();
    },

    /** Clic en el encabezado (th) número `col` de la fila de encabezado. */
    async clicEncabezado(id, col) {
      const p = await h._punto(([i, c]) => ETs(i).querySelector('thead').rows[0].cells[c].querySelector('span') || ETs(i).querySelector('thead').rows[0].cells[c], [id, col]);
      await page.mouse.click(p.x, p.y);
      await h.asentar();
    },

    async tecla(k, n = 1) {
      for (let i = 0; i < n; i++) { await page.keyboard.press(k); await h.asentar(); }
    },

    async teclas(lista) { for (const k of lista) await h.tecla(k); },

    async escribir(texto) {
      for (const ch of texto) { await page.keyboard.type(ch); await h.asentar(10); }
      await h.asentar();
    },

    /** Arrastra el borde de cambio de ancho del th `col` dx píxeles con el ratón. */
    async redimensionar(id, col, dx) {
      const p = await page.evaluate(([i, c]) => {
        const b = ETs(i).querySelector('thead').rows[0].cells[c].querySelector('.sizable-border');
        const r = b.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + Math.min(8, r.height / 2) };
      }, [id, col]);
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.move(p.x + dx / 2, p.y);
      await page.mouse.move(p.x + dx, p.y);
      await page.mouse.up();
      await h.asentar();
    },

    /**
     * Arrastrar y soltar filas (HTML5) con eventos sintéticos y un DataTransfer real: el componente usa
     * ondragstart/ondragover/ondrop del tr. comoHijo decide la X del dragover (mitad derecha de la primera celda).
     */
    async arrastrarFila(id, desde, hasta, comoHijo = false) {
      await page.evaluate(([i, a, b, hijo]) => {
        const tb = ETs(i).querySelector('tbody');
        const src = tb.rows[a], dst = tb.rows[b];
        const dt = new DataTransfer();
        const cr = dst.cells[0].getBoundingClientRect();
        const x = hijo ? cr.x + cr.width * 0.9 : cr.x + cr.width * 0.1;
        const y = cr.y + cr.height / 2;
        const fire = (el, type) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, composed: true, dataTransfer: dt, clientX: x, clientY: y }));
        fire(src, 'dragstart');
        fire(dst, 'dragenter');
        fire(dst, 'dragover');
        fire(dst, 'drop');
        fire(src, 'dragend');
      }, [id, desde, hasta, comoHijo]);
      await h.asentar();
    },

    async viewport(w, hgt) { await page.setViewportSize({ width: w, height: hgt }); await h.asentar(); await h.asentar(); },

    /** Emula la impresión: medio 'print' y los eventos beforeprint/afterprint de window. */
    async imprimir(entrar = true) {
      if (entrar) {
        await page.emulateMedia({ media: 'print' });
        await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
      } else {
        await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
        await page.emulateMedia({ media: 'screen' });
      }
      await h.asentar();
    },

    /** Saca el foco de la tabla (a un botón del documento, o a body). */
    async foco(css) {
      await page.evaluate((s) => { const e = s ? document.querySelector(s) : null; if (e) e.focus(); else document.activeElement?.blur?.(); }, css ?? null);
      await h.asentar();
    },
  };
  return h;
}
