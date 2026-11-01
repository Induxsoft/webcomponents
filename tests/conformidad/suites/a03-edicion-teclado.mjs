// Actual: edición de celdas y teclado. Contrato §1.7, §1.8.
import { tabla, paginaProductos, PRODUCTOS } from '../lib/fixtures.mjs';

const P = [];
const t = (id, titulo, fn, x = {}) => P.push({ id: 'edi-' + id, titulo, spec: [x.area ?? 'A.edicion'], fn, ...x });
const k = (id, titulo, fn, x = {}) => t(id, titulo, fn, { area: 'A.teclado', ...x });

const actual = (c) => c.ev(() => { const e = __ct.t('t1'); return [e.CurrentRowIndex(), e.CurrentColIndex()]; });
const input = (c) => c.ev(() => { const i = __ct.t('t1').shadowRoot.querySelector('#__table_input'); return i ? i.value : null; });

t('01', 'clic en una celda pone el selector en ella', async (c) => {
  await c.abrir(paginaProductos());
  await c.clic('t1', 2, 1);
  c.igual(await actual(c), [2, 1]);
  const r = await c.ev(() => { const s = __ct.td('t1', 2, 1).querySelector('#__table_selector'); return { s: !!s, cls: s && s.className, tab: s && s.getAttribute('tabindex'), txt: s && s.textContent, foco: __ct.sr('t1').activeElement === s }; });
  c.igual(r, { s: true, cls: 'EdiTable-Selector', tab: '0', txt: 'Cable calibre 12', foco: true });
});
t('02', 'la fila actual lleva EdiTable-Row-Selected (solo una)', async (c) => {
  await c.abrir(paginaProductos());
  await c.clic('t1', 1, 0); await c.clic('t1', 3, 0);
  c.igual(await c.ev(() => __ct.filas('t1').map(tr => tr.classList.contains('EdiTable-Row-Selected'))), [false, false, false, true]);
});
t('03', 'Enter edita con el valor actual; Enter confirma, escribe DataArray (texto) y pasa a la derecha', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1);
  await c.tecla('Enter');
  c.igual(await input(c), 'Tornillo hexagonal');
  await c.page.keyboard.press('Control+A'); await c.escribir('Tornillo largo'); await c.tecla('Enter');
  c.igual((await c.datos())[0].nombre, 'Tornillo largo');
  c.igual(await c.ev(() => __ct.texto('t1', 0, 1)), 'Tornillo largo');
  c.igual(await actual(c), [0, 2]);
  c.igual(await c.ev(() => __ct.t('t1').Editing), false);
});
t('04', 'una tecla de carácter empieza la edición con ese carácter', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 1);
  await c.tecla('x');
  c.igual(await c.ev(() => __ct.t('t1').Editing), true);
  c.igual(await input(c), 'x');
});
t('05', 'F2 empieza la edición', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 1); await c.tecla('F2');
  c.igual(await input(c), 'Arandela plana');
});
t('06', 'Supr empieza la edición con la celda vacía', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 1); await c.tecla('Delete');
  c.igual(await input(c), '');
  c.igual((await c.datos()).length, 4, 'no borra la fila');
});
t('07', 'Esc cancela: restaura el texto y DataArray no cambia', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await c.escribir('zzz'); await c.tecla('Escape');
  c.igual(await c.ev(() => [__ct.t('t1').Editing, __ct.texto('t1', 0, 1), !!__ct.td('t1', 0, 1).querySelector('#__table_selector')]), [false, 'Tornillo hexagonal', true]);
  c.igual((await c.datos())[0].nombre, 'Tornillo hexagonal');
});
t('08', 'clic en el selector inicia la edición', async (c) => {
  await c.abrir(paginaProductos());
  await c.clic('t1', 0, 1);
  await c.clic('t1', 0, 1, { en: 'selector' });
  c.igual(await c.ev(() => __ct.t('t1').Editing), true);
});
t('09', 'clic en otra celda confirma la edición abierta', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'Nuevo'; });
  await c.clic('t1', 2, 0);
  c.igual((await c.datos())[0].nombre, 'Nuevo');
  c.igual(await actual(c), [2, 0]);
});
t('10', 'ReadOnly impide editar', async (c) => {
  await c.abrir(paginaProductos({ a: { readonly: true } }));
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.t('t1').Editing), false);
});
t('11', 'readonly="true" en la columna impide editarla', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'a', readonly: 'true', title: 'A' }, { field: 'b', title: 'B' }], data: [{ a: 1, b: 2 }] }) });
  await c.foco('t1', 0, 0); await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.t('t1').Editing), false);
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  c.igual(await c.ev(() => __ct.t('t1').Editing), true);
});
t('12', 'auto-confirm="true": al salir el foco del componente se confirma la edición (setInterval de 1 s)', async (c) => {
  await c.abrir({ body: tabla({ a: { 'auto-confirm': 'true' }, cols: [{ field: 'a', title: 'A' }], data: [{ a: 'uno' }] }) + '<input id="fuera">' });
  await c.foco('t1', 0, 0); await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'dos'; document.getElementById('fuera').focus(); });
  await c.esperar(1300);
  c.igual([(await c.datos())[0].a, await c.ev(() => __ct.t('t1').Editing)], ['dos', false]);
}, { limite: 8000 });
t('13', 'maxlength limita lo que se teclea', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'a', maxlength: '3', title: 'A' }], data: [{ a: '' }] }) });
  await c.foco('t1', 0, 0); await c.tecla('Enter'); await c.escribir('abcdef');
  c.igual(await input(c), 'abc');
});

// ---------- teclado ----------
k('20', 'flechas mueven el selector', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 1);
  await c.tecla('ArrowDown'); c.igual(await actual(c), [2, 1]);
  await c.tecla('ArrowRight'); c.igual(await actual(c), [2, 2]);
  await c.tecla('ArrowUp'); c.igual(await actual(c), [1, 2]);
  await c.tecla('ArrowLeft'); c.igual(await actual(c), [1, 1]);
});
k('21', 'Tab equivale a flecha derecha', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 0); await c.tecla('Tab');
  c.igual(await actual(c), [0, 1]);
});
k('22', 'EverMove: a la derecha en la última celda baja a la primera de la siguiente fila; a la izquierda en la primera sube', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 3); await c.tecla('ArrowRight');
  c.igual(await actual(c), [1, 0]);
  await c.tecla('ArrowLeft');
  c.igual(await actual(c), [0, 3]);
});
k('23', 'EverMove=false: no salta de fila', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').EverMove=false;});" }));
  await c.foco('t1', 0, 3); await c.tecla('ArrowRight');
  c.igual(await actual(c), [0, 3]);
});
k('24', 'Home y End: primera y última celda de la fila; Ctrl+Home: primera de la tabla', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 2, 1);
  await c.tecla('End'); c.igual(await actual(c), [2, 3]);
  await c.tecla('Home'); c.igual(await actual(c), [2, 0]);
  await c.tecla('Control+Home'); c.igual(await actual(c), [0, 0]);
});
k('25', 'AvPág/RePág se mueven PagOffSet filas (con tope)', async (c) => {
  const muchos = Array.from({ length: 25 }, (_, i) => ({ a: 'f' + i, b: i }));
  await c.abrir({ body: tabla({ cols: [{ field: 'a', title: 'A' }, { field: 'b', title: 'B' }], data: muchos }) });
  await c.foco('t1', 0, 1);
  await c.tecla('PageDown'); c.igual(await actual(c), [10, 1]);
  await c.tecla('PageDown'); await c.tecla('PageDown'); c.igual(await actual(c), [24, 1]);
  await c.tecla('PageUp'); c.igual(await actual(c), [14, 1]);
  // el manejador de teclas usa la copia sender tomada en el último CellFocus: el cambio vale desde el siguiente foco
  await c.ev(() => { __ct.t('t1').PagOffSet = 3; }); await c.foco('t1', 14, 1);
  await c.tecla('PageUp'); c.igual(await actual(c), [11, 1]);
});
k('26', 'flecha abajo en la última fila agrega una fila (AutoAddRow) y RowAdded', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.grabar('t1', ['rowadded']));
  await c.foco('t1', 3, 1); await c.tecla('ArrowDown');
  c.igual(await c.ev(() => __ct.filas('t1').length), 5);
  c.igual((await c.log()).map(x => [x.ev, x.a.rowIndex]), [['rowadded', 4]]);
  c.igual(await actual(c), [4, 0], 'el foco va a la primera celda visible de la fila nueva');
});
k('27', 'AutoAddRow=false: flecha abajo en la última fila no agrega', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').AutoAddRow=false;});" }));
  await c.foco('t1', 3, 1); await c.tecla('ArrowDown');
  c.igual(await c.ev(() => __ct.filas('t1').length), 4);
});
k('28', 'Ctrl+Insert inserta una fila en la posición actual (DataArray y DOM)', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 0); await c.tecla('Control+Insert');
  const d = await c.datos();
  c.igual(d.length, 5); c.igual(d[1], {}); c.igual(d[2].codigo, 'P-001');
  c.igual(await c.ev(() => __ct.filas('t1').length), 5);
});
k('29', 'Ctrl+Supr borra la fila actual y el foco queda en la misma posición', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 1, 2); await c.tecla('Control+Delete');
  const d = await c.datos();
  c.igual(d.map(x => x.codigo), ['P-003', 'P-002', 'P-004']);
  c.igual(await actual(c), [1, 2]);
});
k('30', 'AutoDelRow=false: Ctrl+Supr no borra', async (c) => {
  await c.abrir(paginaProductos({ script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').AutoDelRow=false;});" }));
  await c.foco('t1', 1, 2); await c.tecla('Control+Delete');
  c.igual((await c.datos()).length, 4);
});
k('31', 'editando: flecha abajo confirma y baja; Esc cancela', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await c.ev(() => { __ct.t('t1').shadowRoot.querySelector('#__table_input').value = 'Abajo'; });
  await c.tecla('ArrowDown');
  c.igual((await c.datos())[0].nombre, 'Abajo');
  c.igual(await actual(c), [1, 1]);
});
k('32', 'editando texto: flecha izquierda navega solo con el cursor al inicio', async (c) => {
  await c.abrir(paginaProductos());
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await c.tecla('End'); await c.tecla('ArrowLeft');
  c.igual(await c.ev(() => __ct.t('t1').Editing), true, 'cursor dentro: sigue editando');
  await c.tecla('Home'); await c.tecla('ArrowLeft');
  c.igual(await actual(c), [0, 0]);
});
k('33', 'Memo: Enter es salto de línea; Ctrl+Enter confirma', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'm', type: 'Memo', title: 'M' }, { field: 'b', title: 'B' }], data: [{ m: 'a', b: 1 }] }) });
  await c.foco('t1', 0, 0); await c.tecla('Enter');
  await c.tecla('End'); await c.tecla('Enter'); await c.escribir('b');
  c.igual(await c.ev(() => __ct.t('t1').Editing), true);
  await c.tecla('Control+Enter');
  c.igual((await c.datos())[0].m, 'a\nb');
  c.igual(await actual(c), [0, 1]);
});
k('34', 'Tab no saca el foco de la tabla', async (c) => {
  await c.abrir(paginaProductos({ body: '<input id="sig">' }));
  await c.foco('t1', 0, 3); await c.tecla('Tab');
  c.igual(await c.ev(() => document.activeElement.id), 't1');
});
k('35', 'NavTo(fila, col) y NavToFirstCell/NavToLastCell', async (c) => {
  await c.abrir(paginaProductos());
  await c.ev(() => __ct.t('t1').NavTo(2, 3)); c.igual(await actual(c), [2, 3]);
  await c.ev(() => __ct.t('t1').NavToFirstCell(1)); c.igual(await actual(c), [1, 0]);
  await c.ev(() => __ct.t('t1').NavToLastCell(3)); c.igual(await actual(c), [3, 3]);
  await c.ev(() => __ct.t('t1').NavTo(99, 0)); c.igual(await actual(c), [3, 3], 'fuera de rango no hace nada');
});
k('36', 'F4 llama a searchText del input-key de la columna', async (c) => {
  await c.abrir({ body: tabla({ cols: [{ field: 'cod', type: 'Text', button: 'true', title: 'Código' }], data: [{ cod: 'A' }] }),
    script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.llamadas=[];t.setInputKey('cod',{searchText:(x,a)=>llamadas.push([x,a])});});" });
  await c.foco('t1', 0, 0); await c.tecla('F4');
  c.igual(await c.ev(() => window.llamadas), [['', false]]);
});

export default { nombre: 'actual-edicion-y-teclado', grupo: 'actual', pruebas: P };
