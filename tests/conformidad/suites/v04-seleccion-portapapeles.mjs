// v2 §4: selección de varias filas (4.1) y portapapeles (4.2).
import { tabla, PRODUCTOS, COLS_PRODUCTOS, paginaProductos } from '../lib/fixtures.mjs';
import { registro, m, filaTxt } from '../lib/v2.mjs';

const { P, t } = registro('sel', { requiere: ['multiselect'] });
const pag = (modo = 'checkbox', script = '', extra = {}) => ({ ...paginaProductos({ a: { 'multi-select': modo, ...(extra.a ?? {}) }, script }), permisos: ['clipboard-read', 'clipboard-write'] });
const sel = (c) => m(c, 't1', 'getSelectedRows');
const marcadas = (c) => c.ev(() => __ct.filas('t1').map(tr => tr.classList.contains('et-row-checked')));
const grabarSC = "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.sc=[];t.addEventListener('SelectionChanged',(e)=>window.sc.push(JSON.parse(JSON.stringify(e))));});";

t('01', 'sin multi-select no hay columna del sistema ni et-row-checked', ['§4-a'], async (c) => {
  await c.abrir(paginaProductos());
  c.igual(await c.ev(() => [!!__ct.sr('t1').querySelector('.et-sel-col'), !!__ct.sr('t1').querySelector('.et-row-checked')]), [false, false]);
}, { requiere: [] });
t('02', 'checkbox: th.et-sel-col y td.et-sel-col al principio, con casilla', ['§4-b'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => { const th = __ct.th('t1', 0); const td = __ct.td('t1', 0, 0); return [th.classList.contains('et-sel-col'), !!th.querySelector('input[type=checkbox]'), td.classList.contains('et-sel-col'), !!td.querySelector('input[type=checkbox]'), __ct.filas('t1')[0].cells.length]; });
  c.igual(r, [true, true, true, true, 5]);
});
t('03', 'checkbox: clic en la casilla selecciona la fila sin cambiar la celda actual', ['§4-b', '§4-c', '§4-e'], async (c) => {
  await c.abrir(pag());
  await c.foco('t1', 0, 2);
  await c.clic('t1', 2, 0, { en: 'checkbox' });
  c.igual(await sel(c), [2]);
  c.igual(await marcadas(c), [false, false, true, false]);
  c.igual(await c.ev(() => [__ct.t('t1').CurrentRowIndex(), __ct.filas('t1')[0].classList.contains('EdiTable-Row-Selected'), __ct.filas('t1')[2].classList.contains('EdiTable-Row-Selected')]), [0, true, false]);
});
t('04', 'checkbox del encabezado: selecciona todo; estado intermedio con selección parcial', ['§4-b'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').SelectRows([1]));
  c.igual(await c.ev(() => __ct.th('t1', 0).querySelector('input[type=checkbox]').indeterminate), true);
  await c.ev(() => __ct.th('t1', 0).querySelector('input[type=checkbox]').click());
  c.igual(await sel(c), [0, 1, 2, 3]);
  c.igual(await c.ev(() => { const i = __ct.th('t1', 0).querySelector('input[type=checkbox]'); return [i.checked, i.indeterminate]; }), [true, false]);
  await c.ev(() => __ct.th('t1', 0).querySelector('input[type=checkbox]').click());
  c.igual(await sel(c), []);
});
t('05', 'row: Ctrl+clic agrega o quita; no agrega columna', ['§4-d'], async (c) => {
  await c.abrir(pag('row'));
  await c.clic('t1', 1, 1, { mods: ['Control'] });
  await c.clic('t1', 3, 1, { mods: ['Control'] });
  c.igual(await sel(c), [1, 3]);
  await c.clic('t1', 1, 1, { mods: ['Control'] });
  c.igual(await sel(c), [3]);
  c.igual(await c.ev(() => !!__ct.sr('t1').querySelector('.et-sel-col')), false);
});
t('06', 'row: Mayús+clic selecciona un rango', ['§4-d'], async (c) => {
  await c.abrir(pag('row'));
  await c.clic('t1', 0, 1);
  await c.clic('t1', 2, 1, { mods: ['Shift'] });
  c.igual(await sel(c), [0, 1, 2]);
});
t('07', 'row: Espacio sobre la fila actual cambia su selección (y no empieza a editar)', ['§4-d'], async (c) => {
  await c.abrir(pag('row'));
  await c.foco('t1', 2, 1); await c.tecla('Space');
  c.igual([await sel(c), await c.ev(() => __ct.t('t1').Editing)], [[2], false]);
  await c.tecla('Space');
  c.igual(await sel(c), []);
});
t('08', 'Ctrl+clic en la celda actual no inicia la edición', ['§4-d'], async (c) => {
  await c.abrir(pag('row'));
  await c.clic('t1', 1, 1);
  await c.clic('t1', 1, 1, { mods: ['Control'], en: 'selector' });
  c.igual(await c.ev(() => __ct.t('t1').Editing), false);
});
t('09', 'métodos: SelectRows(add), UnselectRows, SelectAll, ClearSelection, IsRowSelected, getSelectedData', ['§4-f'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => {
    const t = __ct.t('t1'); const o = [];
    t.SelectRows([3, 1]); o.push(t.getSelectedRows());
    t.SelectRows([0], true); o.push(t.getSelectedRows());
    t.SelectRows([2]); o.push(t.getSelectedRows());
    t.SelectAll(); o.push(t.getSelectedRows());
    t.UnselectRows([0, 3]); o.push(t.getSelectedRows());
    o.push([t.IsRowSelected(1), t.IsRowSelected(0)]);
    o.push(t.getSelectedData().map(x => x.codigo));
    t.ClearSelection(); o.push(t.getSelectedRows());
    return o;
  });
  c.igual(r, [[1, 3], [0, 1, 3], [2], [0, 1, 2, 3], [1, 2], [true, false], ['P-001', 'P-002'], []]);
});
t('10', 'SelectionChanged {selected, added, removed}', ['§4-g'], async (c) => {
  await c.abrir(pag('checkbox', grabarSC));
  await c.ev(() => { const t = __ct.t('t1'); t.SelectRows([1, 2]); t.UnselectRows([1]); });
  const sc = await c.ev(() => window.sc);
  c.igual(sc.length, 2);
  c.igual([sc[0].selected, sc[0].added, sc[0].removed], [[1, 2], [1, 2], []]);
  c.igual([sc[1].selected, sc[1].added, sc[1].removed], [[2], [], [1]]);
});
t('11', 'la selección sobrevive al ordenamiento (por fila de datos)', ['§4-h', '§0-R2'], async (c) => {
  await c.abrir(pag());
  await c.ev(() => __ct.t('t1').SelectRows([0])); // P-003
  await c.clicTh('t1', 'codigo');
  const r = await c.ev(() => { const t = __ct.t('t1'); return [t.getSelectedRows(), t.getSelectedData().map(x => x.codigo)]; });
  c.igual(r, [[2], ['P-003']]);
  c.igual(await marcadas(c), [false, false, true, false]);
});
t('12', 'asignar un DataArray nuevo limpia la selección', ['§4-h'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => { const t = __ct.t('t1'); t.SelectRows([0, 1]); t.DataArray = JSON.parse(JSON.stringify(t.DataArray)); t._printRows(); return t.getSelectedRows(); });
  c.igual(r, []);
});
t('13', 'getSelectedRows devuelve índices ordenados aunque se seleccionen en desorden', ['§4-f', '§0-R2'], async (c) => {
  await c.abrir(pag('row'));
  await c.clic('t1', 3, 1, { mods: ['Control'] }); await c.clic('t1', 0, 1, { mods: ['Control'] });
  c.igual(await sel(c), [0, 3]);
});
t('14', 'et-row-checked es distinta de EdiTable-Row-Selected y RowSelected no cambia de significado', ['§4-e'], async (c) => {
  await c.abrir(pag('row'));
  await c.clic('t1', 1, 1);
  await c.clic('t1', 3, 1, { mods: ['Control'] });
  const r = await c.ev(() => __ct.filas('t1').map(tr => [tr.classList.contains('et-row-checked'), tr.classList.contains('EdiTable-Row-Selected')]));
  c.ok(r[3][0], 'la fila 3 queda marcada');
  c.ok(r.filter(x => x[1]).length <= 1, 'una sola fila actual');
});
t('15', 'checkbox con columnas ocultas: navegar con flechas no cae en la columna del sistema', ['§4-i', '§0-R3'], async (c) => {
  await c.abrir(pag());
  await c.foco('t1', 0, 1); // primera de datos
  await c.tecla('ArrowLeft');
  c.igual(await c.ev(() => !!__ct.td('t1', 0, 0).querySelector('#__table_selector')), false);
});

// ---------- portapapeles ----------
const leer = (c) => c.ev(() => navigator.clipboard.readText());
const { P: P2, t: k } = registro('clp', { requiere: ['clipboard'] });
k('01', 'Ctrl+C sin selección copia la celda actual, formateada y sin títulos', ['§4-j', '§4-k'], async (c) => {
  await c.abrir(pag('row'));
  await c.foco('t1', 0, 3); await c.tecla('Control+c');
  c.igual(await leer(c), '$2.50');
});
k('02', 'Ctrl+C con filas seleccionadas: TSV con \\r\\n, títulos en la primera fila, valores formateados', ['§4-j', '§4-k'], async (c) => {
  await c.abrir(pag('row'));
  await c.ev(() => __ct.t('t1').SelectRows([1, 3]));
  await c.foco('t1', 0, 0); await c.tecla('Control+c');
  c.igual(await leer(c), 'Código\tNombre\tCantidad\tPrecio\r\nP-001\tArandela plana\t5\t$0.75\r\nP-004\tApagador sencillo\t7\t$35.90');
}, { requiere: ['multiselect'] });
k('03', 'solo columnas visibles en su orden actual', ['§4-k'], async (c) => {
  await c.abrir(pag('row'));
  await c.ev(() => { const t = __ct.t('t1'); t.hideColumn('nombre', true); t.SelectRows([0]); });
  c.igual(await m(c, 't1', 'getClipboardText'), 'Código\tCantidad\tPrecio\r\nP-003\t10\t$2.50');
}, { requiere: ['multiselect'] });
k('04', 'getClipboardText({raw:true}) usa los valores sin formato; {headers:false} sin títulos', ['§4-l'], async (c) => {
  await c.abrir(pag('row'));
  await c.ev(() => __ct.t('t1').SelectRows([0]));
  c.igual(await m(c, 't1', 'getClipboardText', { raw: true, headers: false }), 'P-003\tTornillo hexagonal\t10\t2.5');
}, { requiere: ['multiselect'] });
k('05', 'copySelection() escribe en el portapapeles', ['§4-l'], async (c) => {
  await c.abrir(pag('row'));
  await c.ev(async () => { const t = __ct.t('t1'); t.SelectRows([2]); await t.copySelection({ headers: false }); });
  c.igual(await leer(c), 'P-002\tCable calibre 12\t3\t$18.00');
}, { requiere: ['multiselect'] });
k('06', 'BeforeCopy {text, cancel}: el texto se puede modificar', ['§4-m'], async (c) => {
  await c.abrir(pag('row', "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').addEventListener('BeforeCopy',(e)=>{window.k=Object.keys(e).sort();e.text='['+e.text+']';});});"));
  await c.foco('t1', 0, 0); await c.tecla('Control+c');
  c.igual(await leer(c), '[P-003]');
  c.ok((await c.ev(() => window.k)).includes('cancel'), 'trae cancel');
});
k('07', 'BeforeCopy con cancel: no se copia', ['§4-m'], async (c) => {
  await c.abrir(pag('row', "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').addEventListener('BeforeCopy',(e)=>{e.cancel=true;});});"));
  await c.ev(() => navigator.clipboard.writeText('previo'));
  await c.foco('t1', 0, 0); await c.tecla('Control+c');
  c.igual(await leer(c), 'previo');
});
k('08', 'Ctrl+C mientras se edita no copia la celda (comportamiento nativo del input)', ['§4-j'], async (c) => {
  await c.abrir(pag('row'));
  await c.ev(() => navigator.clipboard.writeText('previo'));
  await c.foco('t1', 0, 1); await c.tecla('Enter');
  await c.ev(() => __ct.sr('t1').querySelector('#__table_input').setSelectionRange(0, 3));
  await c.tecla('Control+c');
  c.igual(await leer(c), 'Tor');
});
k('09', 'Ctrl+C funciona sin multi-select (celda actual)', ['§4-j'], async (c) => {
  await c.abrir({ ...paginaProductos(), permisos: ['clipboard-read', 'clipboard-write'] });
  await c.foco('t1', 1, 1); await c.tecla('Control+c');
  c.igual(await leer(c), 'Arandela plana');
});

export default [{ nombre: 'v2-seleccion', grupo: 'v2', pruebas: P }, { nombre: 'v2-portapapeles', grupo: 'v2', pruebas: P2 }];
