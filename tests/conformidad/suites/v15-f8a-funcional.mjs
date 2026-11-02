// v2 F8a (spec /home/claude/mapa/edittable-spec-f8-funcional.md): búsqueda y filtro (bus-), validar la fila al
// salir (val-), getChanges (chg-), secuencia de captura (cap-) y formato condicional declarativo (reg-).
// Todo opt-in: sin los atributos o métodos nuevos el banco de regresión sale igual (R1/R8).
import { tabla, muchas, CUENTAS } from '../lib/fixtures.mjs';
import { registro, m, editar } from '../lib/v2.mjs';

const DATOS = [
  { codigo: 'A1', nombre: 'Tornillo hexagonal', linea: 'Ferretería', cantidad: 10, precio: 2.5 },
  { codigo: 'A2', nombre: 'Cable eléctrico', linea: 'Eléctrico', cantidad: -3, precio: 18 },
  { codigo: 'A3', nombre: 'Apagador sencillo', linea: 'Eléctrico', cantidad: 7, precio: 35.9 },
  { codigo: 'A4', nombre: 'Arandela plana', linea: 'Ferretería', cantidad: 0, precio: 0.75 },
  { codigo: 'A5', nombre: 'Tubo de cobre', linea: 'Plomería', cantidad: 5, precio: 120 },
];
const COLS = (x = {}) => [
  { field: 'codigo', type: 'Text', title: 'Código', ...(x.codigo ?? {}) },
  { field: 'nombre', type: 'Text', title: 'Nombre', ...(x.nombre ?? {}) },
  { field: 'linea', type: 'Text', title: 'Línea', ...(x.linea ?? {}) },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', ...(x.cantidad ?? {}) },
  { field: 'precio', type: 'Number', title: 'Precio', format: 'true', decs: '2', ...(x.precio ?? {}) },
];
const CS_V12 = 'div:has(table#t1){overflow:revert !important}';
// Registra eventos en window.ev; window.cancelar[nombre](e) permite cambiar los argumentos.
const grabar = (nombres) => `window.ev=[];window.cancelar={};document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');${JSON.stringify(nombres)}.forEach(n=>t.addEventListener(n,(e)=>{window.ev.push([n,JSON.parse(JSON.stringify({...e,sender:undefined},(k,v)=>(v&&typeof v==='object'&&v.nodeType?'$nodo':v)))]);if(window.cancelar[n])window.cancelar[n](e);}));});`;
const pag = (o = {}) => ({
  body: (o.antes ?? '') + tabla({ a: o.a ?? {}, cols: o.cols ?? COLS(o.x), data: o.data ?? DATOS }) + (o.despues ?? ''),
  script: (o.eventos ? grabar(o.eventos) : '') + (o.script ?? ''),
  head: o.head ?? '',
});
// Textos de la primera celda de datos de las filas visibles (sin grupo ni relleno), en el orden del DOM.
const vis = (c, id = 't1') => c.ev((id) => Array.from(__ct.sr(id).querySelectorAll('tbody > tr')).filter(tr => !tr.classList.contains('et-spacer') && !tr.classList.contains('et-group-row') && getComputedStyle(tr).display !== 'none').map(tr => { const td = Array.from(tr.cells).find(x => !x.classList.contains('et-sel-col')); return (td.querySelector('[iscellcontent]') || td).textContent.trim(); }), id);
const eventos = (c, n) => c.ev((n) => window.ev.filter(e => !n || e[0] === n), n);
// Celda de datos (fila con ese código, columna de datos col).
const celda = (codigo, col) => `(()=>{const tr=Array.from(__ct.sr('t1').querySelectorAll('tbody > tr')).find(tr=>!tr.classList.contains('et-group-row')&&!tr.classList.contains('et-spacer')&&(Array.from(tr.cells).find(x=>!x.classList.contains('et-sel-col'))||{}).textContent?.trim()==='${codigo}');return tr?Array.from(tr.cells).filter(x=>!x.classList.contains('et-sel-col'))[${col}]:null;})()`;
const enfocar = (c, codigo, col) => c.ev(new Function(`const td=${celda(codigo, col)};if(!td)throw new Error('sin celda ${codigo}');document.getElementById('t1').CellFocus(td);`));
const actual = (c) => c.ev(() => { const t = __ct.t('t1'); const td = t.CurrentTd(); return [t.CurrentRowIndex(), td ? t.Columns[t.ColIndexOfTd(td)]?.field : null]; });
const editando = (c) => c.ev(() => __ct.t('t1').Editing);
// R4: el evento existe en Const.Events y addEventListener lo registra de las dos formas.
const r4 = (c, ev) => c.ev((ev) => {
  const tb = __ct.t('t1'); const nombre = tb.EdiTable.Const.Events[ev];
  if (!nombre) return { nombre: null };
  const f = () => 1; tb.addEventListener(ev, f); const viaAdd = tb.Events[nombre] === f;
  const g = () => 2; tb.addEventListener(nombre, g); const viaMin = tb.Events[nombre] === g;
  return { nombre, viaAdd, viaMin };
}, ev);

// =====================================================================================================
// Búsqueda y filtro (bandera 'search')
// =====================================================================================================
const B = registro('bus', { requiere: ['search'] });
{
  const t = B.t;
  t('01', 'search-bar="true": div.et-search-bar hermano del contenedor de la tabla (no la envuelve); SearchBar refleja el atributo', ['§F8a-bus-a', '§0-R5'], async (c) => {
    await c.abrir(pag({ a: { 'search-bar': 'true' } }));
    const r = await c.ev(() => {
      const s = __ct.sr('t1'), b = s.querySelector('div.et-search-bar'), tb = s.querySelector('table');
      return b ? { envuelve: b.contains(tb), hermano: b.parentNode === tb.parentElement.parentNode, antes: !!(b.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING), input: !!b.querySelector('input.et-search-input'), prop: __ct.t('t1').SearchBar } : null;
    });
    c.igual(r, { envuelve: false, hermano: true, antes: true, input: true, prop: true });
  });
  t('02', 'sin search-bar no hay barra; con group-panel la barra va antes del panel y ninguno envuelve la tabla', ['§F8a-bus-a', '§0-R1'], async (c) => {
    await c.abrir(pag());
    c.igual(await c.ev(() => !!__ct.sr('t1').querySelector('.et-search-bar')), false);
    await c.abrir(pag({ a: { 'search-bar': 'true', 'group-panel': 'true' } }));
    const r = await c.ev(() => { const s = __ct.sr('t1'), b = s.querySelector('.et-search-bar'), p = s.querySelector('.et-group-panel'), tb = s.querySelector('table'); return [!!(b.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING), b.contains(tb), p.contains(tb)]; });
    c.igual(r, [true, false, false]);
  });
  t('03', 'Search(texto) filtra: oculta las filas sin coincidencia sin tocar DataArray; getFilteredIndices', ['§F8a-bus-b', '§F8a-bus-f', '§0-R2'], async (c) => {
    await c.abrir(pag());
    const n = await m(c, 't1', 'Search', 'torn');
    c.igual(n, 1, 'Search devuelve las filas que coinciden');
    c.igual(await vis(c), ['A1']);
    c.igual((await c.datos()).map(x => x.codigo), ['A1', 'A2', 'A3', 'A4', 'A5']);
    c.igual(await m(c, 't1', 'getFilteredIndices'), [0]);
  });
  t('04', 'sin distinguir acentos ni mayúsculas por omisión; accentInsensitive:false sí distingue acentos', ['§F8a-bus-b'], async (c) => {
    await c.abrir(pag());
    await m(c, 't1', 'Search', 'ELECTRICO');
    c.igual(await vis(c), ['A2', 'A3']);
    await m(c, 't1', 'Search', 'electrico', { accentInsensitive: false });
    c.igual(await vis(c), []);
    await m(c, 't1', 'Search', 'Eléctrico', { accentInsensitive: false });
    c.igual(await vis(c), ['A2', 'A3']);
  });
  t('05', 'columns limita las columnas; varias palabras deben aparecer todas (en cualquier columna)', ['§F8a-bus-b'], async (c) => {
    await c.abrir(pag());
    await m(c, 't1', 'Search', 'A1', { columns: ['nombre'] });
    c.igual(await vis(c), []);
    await m(c, 't1', 'Search', 'cable eléctrico', {});
    c.igual(await vis(c), ['A2']);
    await m(c, 't1', 'Search', 'a3 electrico');
    c.igual(await vis(c), ['A3']);
  });
  t('06', 'ClearSearch() muestra todo; SearchChanged {text, rows} en cada cambio', ['§F8a-bus-b', '§F8a-bus-g'], async (c) => {
    await c.abrir(pag({ eventos: ['SearchChanged'] }));
    await m(c, 't1', 'Search', 'electrico');
    await m(c, 't1', 'ClearSearch');
    c.igual(await vis(c), ['A1', 'A2', 'A3', 'A4', 'A5']);
    c.igual(await m(c, 't1', 'getFilteredIndices'), [0, 1, 2, 3, 4]);
    c.igual((await eventos(c, 'SearchChanged')).map(e => [e[1].text, e[1].rows]), [['electrico', 2], ['', 5]]);
  });
  t('07', 'el resaltado no cambia lo que leen GetTdValue, UpdateData ni el editor (sin <mark> en el DOM)', ['§F8a-bus-h'], async (c) => {
    await c.abrir(pag());
    const antes = await c.ev(() => __ct.sr('t1').querySelector('tbody').innerHTML);
    await m(c, 't1', 'Search', 'cable', { filter: false });
    const r = await c.ev(() => {
      const t = __ct.t('t1'), s = __ct.sr('t1');
      const td = s.querySelector('tbody').rows[1].cells[1];
      const api = (typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight === 'function');
      let rangos = 0; if (api) CSS.highlights.forEach(h => { rangos += h.size; });
      return { mark: !!s.querySelector('mark'), valor: t.GetTdValue(td), api, rangos, hit: td.classList.contains('et-search-hit') };
    });
    c.igual(r.mark, false, 'no se mete <mark>');
    c.igual(r.valor.includes('Cable eléctrico'), true, 'GetTdValue: ' + r.valor);
    c.ok(r.api ? r.rangos > 0 : r.hit, 'hay resaltado (Highlight API o clase et-search-hit)');
    await c.ev(() => __ct.t('t1').UpdateData());
    c.igual((await c.datos())[1].nombre, 'Cable eléctrico');
    // el editor abre con el texto de la celda, sin marcas
    await c.tecla('F2');
    c.igual(await c.ev(() => __ct.sr('t1').querySelector('#__table_input')?.value), 'Cable eléctrico');
    await c.tecla('Escape');
    // al quitar la búsqueda el tbody vuelve a ser idéntico, salvo la celda con el selector
    await m(c, 't1', 'ClearSearch');
    const despues = await c.ev(() => { const tb = __ct.sr('t1').querySelector('tbody').cloneNode(true); tb.querySelectorAll('#__table_selector').forEach(s => s.replaceWith(...s.childNodes)); tb.querySelectorAll('tr').forEach(tr => tr.classList.remove('EdiTable-Row-Selected')); return tb.innerHTML.replace(/ class=""/g, ''); });
    c.igual(despues, antes.replace(/ class=""/g, ''));
  });
  t('08', 'filter:false no oculta nada y salta a la primera coincidencia; F3/Mayús+F3 recorren (con vuelta)', ['§F8a-bus-c'], async (c) => {
    await c.abrir(pag());
    await enfocar(c, 'A1', 0);
    await m(c, 't1', 'Search', 'electrico', { filter: false });
    c.igual(await vis(c), ['A1', 'A2', 'A3', 'A4', 'A5'], 'no filtra');
    c.igual(await actual(c), [1, 'nombre'], 'primera coincidencia');
    await c.tecla('F3');
    c.igual(await actual(c), [1, 'linea']);
    await c.tecla('F3');
    c.igual(await actual(c), [2, 'linea']);
    await c.tecla('F3');
    c.igual(await actual(c), [1, 'nombre'], 'vuelve al principio');
    await c.tecla('Shift+F3');
    c.igual(await actual(c), [2, 'linea'], 'Mayús+F3 hacia atrás');
    c.igual(await editando(c), false, 'F3 no abre el editor');
  });
  t('09', 'SearchNext/SearchPrev devuelven {index, field} y recorren las coincidencias en el orden que se ve', ['§F8a-bus-c'], async (c) => {
    await c.abrir(pag());
    await m(c, 't1', 'Search', 'a', { columns: ['codigo'] });
    c.igual(await m(c, 't1', 'SearchNext'), { index: 0, field: 'codigo' });
    c.igual(await m(c, 't1', 'SearchNext'), { index: 1, field: 'codigo' });
    c.igual(await m(c, 't1', 'SearchPrev'), { index: 0, field: 'codigo' });
  });
  t('10', 'la barra: teclear filtra (con debounce); Enter va a la coincidencia y deja el foco en la barra; Escape limpia', ['§F8a-bus-a', '§F8a-bus-c'], async (c) => {
    await c.abrir(pag({ a: { 'search-bar': 'true' } }));
    await c.ev(() => __ct.sr('t1').querySelector('.et-search-input').focus());
    await c.escribir('apag');
    await c.esperar(400);
    c.igual(await vis(c), ['A3']);
    await c.tecla('Enter');
    c.igual(await actual(c), [2, 'nombre']);
    c.igual(await c.ev(() => __ct.sr('t1').activeElement?.classList.contains('et-search-input')), true, 'el foco sigue en la barra');
    c.ok(/1/.test(await c.ev(() => __ct.sr('t1').querySelector('.et-search-count')?.textContent ?? '')), 'contador');
    await c.tecla('Escape');
    await c.esperar(300);
    c.igual(await vis(c), ['A1', 'A2', 'A3', 'A4', 'A5']);
  });
  t('11', 'search-filter="false": la barra no filtra, solo salta a la coincidencia', ['§F8a-bus-c', '§0-R5'], async (c) => {
    await c.abrir(pag({ a: { 'search-bar': 'true', 'search-filter': 'false' } }));
    c.igual(await c.ev(() => __ct.t('t1').SearchFilter), false);
    await c.ev(() => __ct.sr('t1').querySelector('.et-search-input').focus());
    await c.escribir('tubo');
    await c.esperar(400);
    c.igual((await vis(c)).length, 5);
    c.igual(await actual(c), [4, 'nombre']);
    c.igual(await c.ev(() => __ct.sr('t1').activeElement?.classList.contains('et-search-input')), true);
  });
  t('12', 'Filter con objeto {campo: valor}, {campo: {op, value}}, función y arreglo de condiciones; FilterChanged; ClearFilter', ['§F8a-bus-d', '§F8a-bus-g'], async (c) => {
    await c.abrir(pag({ eventos: ['FilterChanged'] }));
    await m(c, 't1', 'Filter', { linea: 'Eléctrico' });
    c.igual(await vis(c), ['A2', 'A3']);
    await m(c, 't1', 'Filter', { cantidad: { op: 'gt', value: 4 } });
    c.igual(await vis(c), ['A1', 'A3', 'A5']);
    await c.ev(() => __ct.t('t1').Filter((d, i) => i % 2 === 0));
    c.igual(await vis(c), ['A1', 'A3', 'A5']);
    await m(c, 't1', 'Filter', [{ field: 'precio', op: 'between', value: 1, value2: 40 }, { field: 'linea', op: 'ne', value: 'Plomería' }]);
    c.igual(await vis(c), ['A1', 'A2', 'A3']);
    await m(c, 't1', 'ClearFilter');
    c.igual((await vis(c)).length, 5);
    c.igual((await eventos(c, 'FilterChanged')).map(e => e[1].rows), [2, 3, 3, 3, 5]);
  });
  t('13', 'Search y Filter se combinan (las dos condiciones)', ['§F8a-bus-d'], async (c) => {
    await c.abrir(pag());
    await m(c, 't1', 'Filter', { linea: 'Ferretería' });
    await m(c, 't1', 'Search', 'a');
    c.igual(await vis(c), ['A1', 'A4']);
    await m(c, 't1', 'Search', 'arandela');
    c.igual(await vis(c), ['A4']);
    await m(c, 't1', 'ClearFilter');
    c.igual(await vis(c), ['A4']);
  });
  t('14', 'R2: las flechas saltan las filas filtradas; CurrentRowIndex sigue siendo índice de DataArray', ['§F8a-bus-f', '§0-R2'], async (c) => {
    await c.abrir(pag());
    await m(c, 't1', 'Filter', { linea: 'Eléctrico' });
    await enfocar(c, 'A2', 1);
    await c.tecla('ArrowDown');
    c.igual(await actual(c), [2, 'nombre']);
    await c.tecla('ArrowUp');
    c.igual(await actual(c), [1, 'nombre']);
    c.igual(await c.ev(() => { const t = __ct.t('t1'); return t.DataArray[t.CurrentRowIndex()].codigo; }), 'A2');
  });
  t('15', 'con grupos: conteos y subtotales siguen al filtro; los grupos sin filas desaparecen', ['§F8a-bus-i'], async (c) => {
    await c.abrir(pag({ a: { 'group-panel': 'true' }, x: { cantidad: { summary: 'sum' } } }));
    await c.ev(() => __ct.t('t1').GroupBy(['linea']));
    await m(c, 't1', 'Search', 'a', { columns: ['nombre'] });
    const g = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr.et-group-row')).filter(tr => getComputedStyle(tr).display !== 'none').map(tr => tr.textContent.replace(/\s+/g, ' ').trim()));
    // Con "a" en el nombre: Eléctrico (Cable -3, Apagador 7) → 2 filas, suma 4; Ferretería (Tornillo 10, Arandela 0) → 2, suma 10;
    // Plomería (Tubo de cobre) no tiene "a": el grupo desaparece.
    c.igual(g.length, 2, 'grupos: ' + JSON.stringify(g));
    c.ok(/Eléctrico.*\(2\).*4/.test(g[0]), g[0]);
    c.ok(/Ferretería.*\(2\).*10/.test(g[1]), g[1]);
    await m(c, 't1', 'Search', 'cobre');
    const g2 = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('tbody > tr.et-group-row')).filter(tr => getComputedStyle(tr).display !== 'none').map(tr => tr.getAttribute('data-key')));
    c.igual(g2, ['Plomería']);
    c.igual(await vis(c), ['A5']);
    await m(c, 't1', 'ClearSearch');
    c.igual((await vis(c)).length, 5);
    await m(c, 't1', 'Search', 'cobre');
    await c.ev(() => __ct.t('t1').Ungroup());
    c.igual(await vis(c), ['A5'], 'al desagrupar sigue el filtro');
  });
  t('16', 'summary-scope="visible" suma solo las filas filtradas; "all" suma todo; sin summary-scope, con filtro, es visible', ['§F8a-bus-j', '§2-d'], async (c) => {
    const pie = (c) => c.ev(() => __ct.t('t1').getSummary('cantidad'));
    await c.abrir(pag({ a: { 'summary-scope': 'visible' }, x: { cantidad: { summary: 'sum' } } }));
    await m(c, 't1', 'Filter', { linea: 'Eléctrico' });
    await c.esperar(20);
    c.igual(await pie(c), 4);
    await c.abrir(pag({ a: { 'summary-scope': 'all' }, x: { cantidad: { summary: 'sum' } } }));
    await m(c, 't1', 'Filter', { linea: 'Eléctrico' });
    await c.esperar(20);
    c.igual(await pie(c), 19);
    await c.abrir(pag({ x: { cantidad: { summary: 'sum' } } }));
    c.igual(await pie(c), 19, 'sin filtro');
    await m(c, 't1', 'Filter', { linea: 'Eléctrico' });
    await c.esperar(20);
    c.igual(await pie(c), 4, 'con filtro, visible');
  });
  t('17', 'selección: SelectAll con filtro selecciona solo las visibles; la casilla de "todas" mira las visibles', ['§F8a-bus-k', '§4-a'], async (c) => {
    await c.abrir(pag({ a: { 'multi-select': 'checkbox' } }));
    await c.ev(() => { const t = __ct.t('t1'); t.SelectRows([0]); t.Filter({ linea: 'Eléctrico' }); t.SelectAll(); });
    c.igual(await m(c, 't1', 'getSelectedRows'), [1, 2]);
    c.igual(await c.ev(() => { const i = __ct.sr('t1').querySelector('thead th.et-sel-col input'); return [i.checked, i.indeterminate]; }), [true, false]);
    await c.ev(() => __ct.t('t1').ClearFilter());
    c.igual(await c.ev(() => { const i = __ct.sr('t1').querySelector('thead th.et-sel-col input'); return [i.checked, i.indeterminate]; }), [false, true]);
    c.igual(await m(c, 't1', 'getSelectedRows'), [1, 2], 'quitar el filtro no cambia la selección');
  });
  t('18', 'exportar y copiar con visibleOnly: solo las filas que pasan el filtro', ['§F8a-bus-l', '§5-b'], async (c) => {
    await c.abrir(pag({ a: { 'multi-select': 'row' } }));
    await c.ev(() => __ct.t('t1').Filter({ linea: 'Ferretería' }));
    const r = await c.ev(() => {
      const t = __ct.t('t1');
      const todas = t.getExportData().rows.length, vis = t.getExportData({ visibleOnly: true }).rows.map(x => x.codigo);
      const csv = t.exportCSV({ visibleOnly: true }).split(/\r?\n/).filter(Boolean).length;
      t.SelectRows([0, 1, 3]);
      const sel = t.getClipboardText({ visibleOnly: true }).split('\r\n').length, selTodas = t.getClipboardText().split('\r\n').length;
      return { todas, vis, csv, sel, selTodas };
    });
    c.igual(r, { todas: 5, vis: ['A1', 'A4'], csv: 3, sel: 3, selTodas: 4 });
  });
  t('19', 'una fila editada después de filtrar no desaparece; RefreshFilter() vuelve a evaluar; las filas nuevas se ven', ['§F8a-bus-e'], async (c) => {
    await c.abrir(pag());
    await m(c, 't1', 'Search', 'cable');
    await editar(c, 't1', 1, 1, 'Alambre');
    c.igual(await vis(c), ['A2']);
    await m(c, 't1', 'RefreshFilter');
    c.igual(await vis(c), []);
    await c.ev(() => __ct.t('t1').AddRow());
    c.igual((await vis(c)).length, 1, 'la fila nueva se ve');
  });
  t('20', 'si la fila actual queda filtrada se suelta el selector (CurrentRowIndex -1), sin errores', ['§F8a-bus-f'], async (c) => {
    await c.abrir(pag());
    await enfocar(c, 'A1', 1);
    await m(c, 't1', 'Search', 'cobre');
    c.igual(await c.ev(() => __ct.t('t1').CurrentRowIndex()), -1);
    c.sinErrores();
  });
  t('21', 'DataArray nuevo + _printRows con filtro activo: el filtro se aplica a los datos nuevos', ['§F8a-bus-e'], async (c) => {
    await c.abrir(pag());
    await m(c, 't1', 'Filter', { linea: 'Eléctrico' });
    await c.ev(() => { const t = __ct.t('t1'); t.DataArray = [{ codigo: 'Z1', linea: 'Eléctrico' }, { codigo: 'Z2', linea: 'Otra' }, { codigo: 'Z3', linea: 'Eléctrico' }]; t._printRows(); });
    c.igual(await vis(c), ['Z1', 'Z3']);
    c.igual(await m(c, 't1', 'getFilteredIndices'), [0, 2]);
  });
  t('22', 'árbol: se ven las coincidencias y sus ancestros; al quitar el filtro vuelve el estado de expansión', ['§F8a-bus-e'], async (c) => {
    const cols = [{ field: 'cuenta', title: 'Cuenta' }, { field: 'nombre', title: 'Nombre' }];
    await c.abrir({ body: tabla({ a: { 'show-tree': 'true', key: 'sys_pk', parentkey: 'parent' }, cols, data: CUENTAS }), script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t._expandOnStart=true;t._printTreeData();});" });
    await m(c, 't1', 'Search', 'bancos', { columns: ['nombre'] });
    c.igual(await vis(c), ['100', '110', '112']);
    await m(c, 't1', 'ClearSearch');
    c.igual((await vis(c)).length, 6);
  });
  t('23', 'virtual-rows con 20,000 filas: Search filtra la lista lógica y queda fluida (medición informativa)', ['§F8a-bus-m', '§10-d'], async (c) => {
    await c.abrir({
      body: `<div id="sc" style="height:400px;overflow-y:auto">` + tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px', 'control-styles': CS_V12 }, cols: COLS() }) + '</div>',
      script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(muchas(20000))};t._printRows();});`,
    });
    const r = await c.ev(async () => {
      const t = __ct.t('t1'), med = [];
      for (const q of ['ficticio 1999', 'ficticio 1', 'ficticio 19', 'plomería', 'ficticio 19999']) { const s = performance.now(); t.Search(q); med.push(performance.now() - s); }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const n = t.getFilteredIndices().length;
      const filas = __ct.sr('t1').querySelectorAll('tbody > tr:not(.et-spacer)').length;
      t.Search('ficticio 1999');
      return { med, n, filas, f: t.getFilteredIndices().slice(0, 3) };
    });
    c.igual(r.n, 1, 'una fila con "ficticio 19999"');
    c.igual(await m(c, 't1', 'getFilteredIndices'), [1998, 11998, 19989, 19990, 19991, 19992, 19993, 19994, 19995, 19996, 19997, 19998], 'índices');
    c.ok(r.filas <= 60, 'dibuja pocas filas: ' + r.filas);
    const ord = r.med.slice().sort((a, b) => a - b);
    c.nota('Search en 20,000 filas virtuales (ms): ' + r.med.map(x => x.toFixed(1)).join(', '));
    c.ok(ord[2] < 300, 'mediana de Search ' + ord[2].toFixed(1) + ' ms');
  }, { serial: true, limite: 90000 });
  t('24', 'virtual: las flechas saltan las filas filtradas; GetTrByIndex de una fila filtrada da undefined', ['§F8a-bus-f', '§10-d'], async (c) => {
    await c.abrir({ body: `<div id="sc" style="height:300px;overflow-y:auto">` + tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px', 'control-styles': CS_V12 }, cols: COLS(), data: DATOS }) + '</div>' });
    await m(c, 't1', 'Filter', { linea: 'Ferretería' });
    c.igual(await vis(c), ['A1', 'A4']);
    await enfocar(c, 'A1', 1);
    await c.tecla('ArrowDown');
    c.igual(await actual(c), [3, 'nombre']);
    c.igual(await c.ev(() => __ct.t('t1').GetTrByIndex(1) === undefined), true);
  });
  t('25', 'R4: SearchChanged y FilterChanged en Const.Events y en addEventListener', ['§F8a-bus-g', '§0-R4'], async (c) => {
    await c.abrir(pag());
    c.igual(await r4(c, 'SearchChanged'), { nombre: 'searchchanged', viaAdd: true, viaMin: true });
    c.igual(await r4(c, 'FilterChanged'), { nombre: 'filterchanged', viaAdd: true, viaMin: true });
  });
  t('26', 'Ctrl+F en la tabla lleva el foco a la barra; flecha abajo en la barra regresa a la tabla', ['§F8a-bus-a'], async (c) => {
    await c.abrir(pag({ a: { 'search-bar': 'true' } }));
    await enfocar(c, 'A2', 1);
    await c.tecla('Control+f');
    c.igual(await c.ev(() => __ct.sr('t1').activeElement?.classList.contains('et-search-input')), true);
    await c.tecla('ArrowDown');
    c.igual(await c.ev(() => __ct.sr('t1').activeElement?.id), '__table_selector');
    c.igual(await actual(c), [1, 'nombre']);
  });
  t('27', 'la barra y el resaltado usan solo variables del contrato (--et-*) con respaldo', ['§F8a-bus-n'], async (c) => {
    await c.abrir(pag({ a: { 'search-bar': 'true' } }));
    const css = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('style[data-et="f8"]')).map(s => s.textContent).join('\n'));
    c.ok(/\.et-search-bar\{[^}]*var\(--et-/.test(css.replace(/\s+/g, '')), 'la barra usa var(--et-…)');
    c.ok(/--et-mark-bg/.test(css), 'resaltado con --et-mark-bg');
    const usadas = [...new Set(css.match(/--et-[a-z-]+/g) ?? [])];
    const contrato = ['--et-font', '--et-font-size', '--et-bg', '--et-fg', '--et-muted-fg', '--et-header-bg', '--et-header-fg', '--et-border', '--et-row-alt-bg', '--et-hover-bg', '--et-sel-bg', '--et-sel-fg', '--et-active-cell', '--et-accent', '--et-focus-ring', '--et-input-bg', '--et-input-fg', '--et-input-border', '--et-mark-bg', '--et-mark-fg', '--et-error', '--et-error-bg', '--et-warn', '--et-ok', '--et-neg-fg', '--et-radius', '--et-cell-pad-x', '--et-cell-pad-y', '--et-row-height', '--et-rule-icon'];
    // F8b: cada color va como var(--et-x, var(--et-t-x, respaldo)); --et-t-x es la variable del tema.
    c.igual(usadas.filter(v => !contrato.includes(v) && !contrato.includes(v.replace(/^--et-t-/, '--et-'))), [], 'variables fuera del contrato');
  });
}

// =====================================================================================================
// Validar la fila al salir (bandera 'rowvalidate')
// =====================================================================================================
const V = registro('val', { requiere: ['rowvalidate'] });
{
  const t = V.t;
  t('01', 'BeforeRowLeave {index, data, toIndex} al cambiar de fila con flechas; no al moverse dentro de la fila', ['§F8a-val-a'], async (c) => {
    await c.abrir(pag({ eventos: ['BeforeRowLeave'] }));
    await enfocar(c, 'A1', 0);
    await c.tecla('ArrowRight');
    c.igual((await eventos(c, 'BeforeRowLeave')).length, 0);
    await c.tecla('ArrowDown');
    const e = await eventos(c, 'BeforeRowLeave');
    c.igual(e.map(x => [x[1].index, x[1].data.codigo, x[1].toIndex, x[1].cancel]), [[0, 'A1', 1, false]]);
    c.igual(await actual(c), [1, 'nombre']);
  });
  t('02', 'cancelar deja el foco en la fila; lo que se estaba editando ya se confirmó antes del evento', ['§F8a-val-a', '§F8a-val-b'], async (c) => {
    await c.abrir(pag({ eventos: ['BeforeRowLeave'], script: "window.cancelar.BeforeRowLeave=(e)=>{window.visto=e.data.nombre;e.cancel=true;};" }));
    await enfocar(c, 'A1', 1);
    await c.tecla('F2');
    await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = ''; });
    await c.escribir('Tornillo cabeza plana');
    await c.tecla('ArrowDown');
    c.igual(await actual(c), [0, 'nombre']);
    c.igual(await c.ev(() => window.visto), 'Tornillo cabeza plana');
    c.igual((await c.datos())[0].nombre, 'Tornillo cabeza plana');
    c.igual(await c.ev(() => __ct.sr('t1').activeElement?.id), '__table_selector', 'el selector vuelve a la celda');
  });
  t('03', 'clic en otra fila, NavTo y AddRow (incluida la flecha abajo en la última fila) también disparan y se cancelan', ['§F8a-val-a'], async (c) => {
    await c.abrir(pag({ eventos: ['BeforeRowLeave'], script: "window.cancelar.BeforeRowLeave=(e)=>{if(window.no)e.cancel=true;};" }));
    await enfocar(c, 'A1', 1);
    await c.ev(() => { window.no = true; });
    await c.clic('t1', 2, 1);
    c.igual(await actual(c), [0, 'nombre'], 'clic cancelado');
    await c.ev(() => __ct.t('t1').NavTo(3, 1));
    c.igual(await actual(c), [0, 'nombre'], 'NavTo cancelado');
    const n0 = await c.ev(() => __ct.t('t1').TRCount());
    await c.ev(() => __ct.t('t1').AddRow());
    c.igual(await c.ev(() => __ct.t('t1').TRCount()), n0, 'AddRow cancelado no agrega');
    await c.ev(() => { window.no = false; __ct.t('t1').NavTo(4, 1); });
    await c.ev(() => { window.no = true; });
    await c.tecla('ArrowDown');
    c.igual(await c.ev(() => __ct.t('t1').TRCount()), n0, 'flecha abajo cancelada no agrega');
    const e = (await eventos(c, 'BeforeRowLeave')).map(x => [x[1].index, x[1].toIndex]);
    c.igual(e, [[0, 2], [0, 3], [0, 5], [0, 4], [4, 5]]);
  });
  t('04', 'e.errors = {campo: mensaje} marca las celdas y cancela la salida', ['§F8a-val-a', '§F8a-val-c'], async (c) => {
    await c.abrir(pag({ eventos: ['BeforeRowLeave'], script: "window.cancelar.BeforeRowLeave=(e)=>{if(Number(e.data.cantidad)<0)e.errors={cantidad:'La cantidad no puede ser negativa'};};" }));
    await enfocar(c, 'A2', 3);
    await c.tecla('ArrowDown');
    c.igual(await actual(c), [1, 'cantidad']);
    c.igual(await m(c, 't1', 'getErrors'), [{ index: 1, field: 'cantidad', message: 'La cantidad no puede ser negativa' }]);
  });
  t('05', 'SetCellError: clase et-cell-error, aria-invalid y mensaje en title; ClearCellError por campo, por fila y todo', ['§F8a-val-c'], async (c) => {
    await c.abrir(pag());
    const td = (i, k) => c.ev(({ i, k }) => { const td = __ct.t('t1').GetTrByIndex(i).cells[k]; return [td.classList.contains('et-cell-error'), td.getAttribute('aria-invalid'), td.getAttribute('title')]; }, { i, k });
    await c.ev(() => { const t = __ct.t('t1'); t.SetCellError(1, 'cantidad', 'Negativa'); t.SetCellError(1, 'nombre', 'Falta'); t.SetCellError(3, 'precio', 'Cero'); });
    c.igual(await td(1, 3), [true, 'true', 'Negativa']);
    c.igual((await m(c, 't1', 'getErrors')).map(e => [e.index, e.field]), [[1, 'nombre'], [1, 'cantidad'], [3, 'precio']]);
    await c.ev(() => __ct.t('t1').ClearCellError(1, 'cantidad'));
    c.igual(await td(1, 3), [false, null, null]);
    await c.ev(() => __ct.t('t1').ClearCellError(1));
    c.igual((await m(c, 't1', 'getErrors')).map(e => e.field), ['precio']);
    await c.ev(() => __ct.t('t1').ClearCellError());
    c.igual(await m(c, 't1', 'getErrors'), []);
  });
  t('06', 'el error no cambia lo que leen GetTdValue ni UpdateData', ['§F8a-val-c'], async (c) => {
    await c.abrir(pag());
    const r = await c.ev(() => { const t = __ct.t('t1'); const td = t.GetTrByIndex(0).cells[1]; const a = t.GetTdValue(td); t.SetCellError(0, 'nombre', 'X'); const b = t.GetTdValue(td); t.UpdateData(); return [a === b, t.DataArray[0].nombre]; });
    c.igual(r, [true, 'Tornillo hexagonal']);
  });
  t('07', 'el error sigue a la fila al ordenar y al volver a dibujar', ['§F8a-val-c'], async (c) => {
    await c.abrir(pag());
    await c.ev(() => { const t = __ct.t('t1'); t.SetCellError(0, 'nombre', 'X'); t.Sort(t.DataArray, 'codigo', true); t._printRows(); });
    c.igual(await m(c, 't1', 'getErrors'), [{ index: 4, field: 'nombre', message: 'X' }]);
    c.igual(await c.ev(() => __ct.t('t1').GetTrByIndex(4).cells[1].classList.contains('et-cell-error')), true);
  });
  t('08', 'virtual: el error se pinta al dibujar la fila', ['§F8a-val-c', '§10-d'], async (c) => {
    await c.abrir({ body: `<div id="sc" style="height:300px;overflow-y:auto">` + tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px', 'control-styles': CS_V12 }, cols: COLS() }) + '</div>', script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(muchas(2000))};t._printRows();});` });
    const r = await c.ev(async () => { const t = __ct.t('t1'); t.SetCellError(1500, 'nombre', 'Lejos'); const tr = t.GetTrByIndex(1500); await __ct.cuadro(); return tr.cells[1].classList.contains('et-cell-error') && tr.cells[1].title === 'Lejos'; });
    c.igual(r, true);
  });
  t('09', 'BeforeUpdateCell con e.error: sigue editando y marca la celda; al confirmar un valor válido se limpia', ['§F8a-val-d'], async (c) => {
    await c.abrir(pag({ eventos: ['BeforeUpdateCell'], script: "window.cancelar.BeforeUpdateCell=(e)=>{if(e.coldef.field==='cantidad'&&Number(e.text)<0)e.error='No negativa';};" }));
    await editar(c, 't1', 0, 3, '-5');
    c.igual(await editando(c), true, 'sigue en edición');
    c.igual(await m(c, 't1', 'getErrors'), [{ index: 0, field: 'cantidad', message: 'No negativa' }]);
    await c.ev(() => { __ct.sr('t1').querySelector('#__table_input').value = ''; });
    await c.escribir('6');
    await c.tecla('Enter');
    c.igual(await editando(c), false);
    c.igual(await m(c, 't1', 'getErrors'), []);
    c.igual(String((await c.datos())[0].cantidad), '6');
  });
  t('10', 'sin e.error, BeforeUpdateCell funciona como hoy (cancel sigue editando sin marcar errores)', ['§F8a-val-d', '§0-R8'], async (c) => {
    await c.abrir(pag({ eventos: ['BeforeUpdateCell'], script: "window.cancelar.BeforeUpdateCell=(e)=>{if(e.text==='x')e.cancel=true;};" }));
    await editar(c, 't1', 0, 1, 'x');
    c.igual(await editando(c), true);
    c.igual(await m(c, 't1', 'getErrors'), []);
  });
  t('11', 'pasar de una fila de datos a una fila de grupo también dispara BeforeRowLeave (toIndex -1)', ['§F8a-val-a', '§11-f'], async (c) => {
    await c.abrir(pag({ a: { 'group-panel': 'true' }, eventos: ['BeforeRowLeave'] }));
    await c.ev(() => __ct.t('t1').GroupBy(['linea']));
    await enfocar(c, 'A2', 1);
    await c.tecla('ArrowUp');
    c.igual((await eventos(c, 'BeforeRowLeave')).map(e => [e[1].index, e[1].toIndex]), [[1, -1]]);
  });
  t('12', 'R4: BeforeRowLeave en Const.Events y en addEventListener', ['§F8a-val-a', '§0-R4'], async (c) => {
    await c.abrir(pag());
    c.igual(await r4(c, 'BeforeRowLeave'), { nombre: 'beforerowleave', viaAdd: true, viaMin: true });
  });
  t('13', 'la celda con error usa --et-error y --et-error-bg (con respaldo)', ['§F8a-val-e'], async (c) => {
    await c.abrir(pag({ head: '<style>#t1{--et-error: rgb(1, 2, 3); --et-error-bg: rgb(4, 5, 6);}</style>' }));
    const r = await c.ev(() => { const t = __ct.t('t1'); t.SetCellError(0, 'nombre', 'X'); const cs = getComputedStyle(t.GetTrByIndex(0).cells[1]); return [cs.boxShadow, cs.backgroundColor]; });
    c.ok(r[0].includes('rgb(1, 2, 3)'), 'box-shadow: ' + r[0]);
    c.igual(r[1], 'rgb(4, 5, 6)');
  });
}

// =====================================================================================================
// getChanges (bandera 'changes')
// =====================================================================================================
const C = registro('chg', { requiere: ['changes'] });
{
  const t = C.t;
  const cambios = (c) => c.ev(() => { const r = __ct.t('t1').getChanges(); return { added: r.added.map(x => [x.index, x.data.codigo ?? null]), modified: r.modified.map(x => [x.index, x.data.codigo, x.original ? x.original.nombre : null]), deleted: r.deleted.map(x => x.data.codigo) }; });
  t('01', 'sin cambios: {added: [], modified: [], deleted: []}', ['§F8a-chg-a'], async (c) => {
    await c.abrir(pag());
    c.igual(await cambios(c), { added: [], modified: [], deleted: [] });
  });
  t('02', 'editar una celda: modified con original; volver al valor original lo quita', ['§F8a-chg-a', '§F8a-chg-b'], async (c) => {
    await c.abrir(pag());
    await editar(c, 't1', 1, 1, 'Cable dúplex');
    c.igual(await cambios(c), { added: [], modified: [[1, 'A2', 'Cable eléctrico']], deleted: [] });
    await editar(c, 't1', 1, 1, 'Cable eléctrico');
    c.igual((await cambios(c)).modified, []);
  });
  t('03', 'DeleteRow y Ctrl+Supr: deleted con los datos', ['§F8a-chg-a', '§F8a-chg-c'], async (c) => {
    await c.abrir(pag());
    await c.ev(() => __ct.t('t1').DeleteRow(4));
    await c.foco('t1', 0, 1);
    await c.tecla('Control+Delete');
    c.igual(await cambios(c), { added: [], modified: [], deleted: ['A1', 'A5'] });
  });
  t('04', 'AddRow: la entrada nace al editar (sin editar no hay alta); al editarla aparece en added; isNew', ['§F8a-chg-a', '§F8a-chg-d'], async (c) => {
    await c.abrir(pag());
    await c.ev(() => __ct.t('t1').AddRow());
    c.igual((await cambios(c)).added, []);
    c.igual(await m(c, 't1', 'isNew', 5), true, 'fila nueva sin datos');
    await editar(c, 't1', 5, 0, 'A6');
    c.igual((await cambios(c)).added, [[5, 'A6']]);
    c.igual(await c.ev(() => [__ct.t('t1').isNew(5), __ct.t('t1').isNew(0)]), [true, false]);
  });
  t('05', 'InsertRow(0) sin editar no es alta (objeto vacío); con valores por omisión sí', ['§F8a-chg-d'], async (c) => {
    await c.abrir(pag());
    await c.ev(() => __ct.t('t1').InsertRow(0, true));
    c.igual((await cambios(c)).added, []);
    await c.abrir(pag({ x: { linea: { default: 'General' } } }));
    await c.ev(() => __ct.t('t1').InsertRow(0, true));
    c.igual((await c.ev(() => __ct.t('t1').getChanges().added.map(x => [x.index, x.data.linea]))), [[0, 'General']]);
  });
  t('06', 'AcceptChanges() deja todo en cero; no cambia IsDirty', ['§F8a-chg-e'], async (c) => {
    await c.abrir(pag());
    await c.ev(() => __ct.t('t1').backup());
    await editar(c, 't1', 0, 1, 'Otro');
    const r = await c.ev(() => { const t = __ct.t('t1'); const a = t.IsDirty; t.AcceptChanges(); const g = t.getChanges(); return [a, t.IsDirty, g.added.length + g.modified.length + g.deleted.length]; });
    c.igual(r, [true, true, 0]);
  });
  t('07', 'UpdateData() sin cambios en las celdas no reporta modificaciones', ['§F8a-chg-b'], async (c) => {
    await c.abrir(pag({ x: { precio: { format: undefined, decs: undefined } } }));
    await c.ev(() => __ct.t('t1').UpdateData());
    c.igual((await cambios(c)).modified, []);
  });
  t('08', 'reasignar DataArray con objetos nuevos reinicia la base; con los mismos objetos, las que faltan son bajas', ['§F8a-chg-f'], async (c) => {
    await c.abrir(pag());
    await editar(c, 't1', 0, 1, 'Otro');
    await c.ev(() => { const t = __ct.t('t1'); t.DataArray = JSON.parse(JSON.stringify(t.DataArray)); t._printRows(); });
    c.igual(await cambios(c), { added: [], modified: [], deleted: [] });
    await c.ev(() => { const t = __ct.t('t1'); t.DataArray = t.DataArray.filter(x => x.codigo !== 'A3'); t._printRows(); });
    c.igual(await cambios(c), { added: [], modified: [], deleted: ['A3'] });
  });
  t('09', 'ordenar: la modificación sigue al objeto (índice nuevo)', ['§F8a-chg-b'], async (c) => {
    await c.abrir(pag());
    await editar(c, 't1', 0, 1, 'Otro');
    await c.ev(() => { const t = __ct.t('t1'); t.Sort(t.DataArray, 'codigo', true); t._printRows(); });
    c.igual((await cambios(c)).modified, [[4, 'A1', 'Tornillo hexagonal']]);
  });
  t('10', 'alta que se borra no aparece; modificada que se borra va a deleted (no a modified)', ['§F8a-chg-c'], async (c) => {
    await c.abrir(pag());
    await c.ev(() => __ct.t('t1').AddRow());
    await editar(c, 't1', 5, 0, 'A6');
    await editar(c, 't1', 2, 1, 'Otro');
    await c.ev(() => { const t = __ct.t('t1'); t.DeleteRow(5); t.DeleteRow(2); });
    c.igual(await cambios(c), { added: [], modified: [], deleted: ['A3'] });
  });
  t('11', 'virtual-rows: altas, cambios y bajas', ['§F8a-chg-a', '§10-d'], async (c) => {
    await c.abrir({ body: `<div id="sc" style="height:300px;overflow-y:auto">` + tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px', 'control-styles': CS_V12 }, cols: COLS(), data: DATOS }) + '</div>' });
    await c.ev(() => __ct.t('t1').AddRow());
    await c.ev(() => { const t = __ct.t('t1'); t.UpdateDataMember(5, 'codigo', 'A6'); t.UpdateDataMember(0, 'nombre', 'Otro'); t.DeleteRow(1); });
    c.igual(await cambios(c), { added: [[4, 'A6']], modified: [[0, 'A1', 'Tornillo hexagonal']], deleted: ['A2'] });
  });
  t('12', 'restoreRow: la fila restaurada no es alta ni baja', ['§F8a-chg-f'], async (c) => {
    await c.abrir(pag());
    await c.ev(() => __ct.t('t1').backup());
    await editar(c, 't1', 0, 1, 'Otro');
    await c.ev(() => __ct.t('t1').restoreRow(0));
    c.igual(await cambios(c), { added: [], modified: [], deleted: [] });
  });
}

// =====================================================================================================
// Secuencia de captura (bandera 'capture')
// =====================================================================================================
const K = registro('cap', { requiere: ['capture'] });
{
  const t = K.t;
  const COLC = (x = {}) => [
    { field: 'codigo', type: 'Text', title: 'Código', ...(x.codigo ?? {}) },
    { field: 'nombre', type: 'NoEditable', title: 'Nombre', ...(x.nombre ?? {}) },
    { field: 'linea', type: 'Text', title: 'Línea', readonly: 'true', ...(x.linea ?? {}) },
    { field: 'cantidad', type: 'Number', title: 'Cantidad', ...(x.cantidad ?? {}) },
    { field: 'precio', type: 'Number', title: 'Precio', ...(x.precio ?? {}) },
  ];
  const cap = (o = {}) => pag({ ...o, cols: o.cols ?? COLC(o.x) });
  t('01', 'tab-order: Tab sigue el número; las columnas sin número van después, en el orden que se ven', ['§F8a-cap-a'], async (c) => {
    await c.abrir(cap({ x: { precio: { 'tab-order': '1' }, cantidad: { 'tab-order': '2' } } }));
    c.igual(await m(c, 't1', 'getCaptureOrder'), ['precio', 'cantidad', 'codigo', 'nombre', 'linea']);
    await enfocar(c, 'A1', 4);
    await c.tecla('Tab');
    c.igual(await actual(c), [0, 'cantidad']);
    await c.tecla('Tab');
    c.igual(await actual(c), [0, 'codigo']);
  });
  t('02', 'tab-skip="true" y skip-readonly="true" (readonly, NoEditable) se saltan', ['§F8a-cap-a', '§F8a-cap-b'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true' }, x: { precio: { 'tab-skip': 'true' } } }));
    c.igual(await m(c, 't1', 'getCaptureOrder'), ['codigo', 'cantidad']);
    c.igual(await c.ev(() => __ct.t('t1').SkipReadonly), true);
    await enfocar(c, 'A1', 0);
    await c.tecla('Tab');
    c.igual(await actual(c), [0, 'cantidad']);
  });
  t('03', 'al terminar la última columna capturable: siguiente fila; en la última, AutoAddRow agrega y va a la primera capturable', ['§F8a-cap-c'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true' } }));
    await enfocar(c, 'A4', 4);
    await c.tecla('Tab');
    c.igual(await actual(c), [4, 'codigo']);
    await enfocar(c, 'A5', 4);
    await c.tecla('Tab');
    c.igual(await c.ev(() => __ct.t('t1').TRCount()), 6);
    c.igual(await actual(c), [5, 'codigo']);
    await c.tecla('Tab'); await c.tecla('Tab'); await c.tecla('Tab');
    c.igual(await c.ev(() => __ct.t('t1').TRCount()), 6, 'una fila nueva sin datos no agrega otra');
  });
  t('04', 'sin AutoAddRow, en la última fila se queda en la última columna capturable', ['§F8a-cap-c'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true' }, script: "document.addEventListener('DOMContentLoaded',()=>{document.getElementById('t1').AutoAddRow=false;});" }));
    await enfocar(c, 'A5', 4);
    await c.tecla('Tab');
    c.igual(await actual(c), [4, 'precio']);
    c.igual(await c.ev(() => __ct.t('t1').TRCount()), 5);
  });
  t('05', 'Mayús+Tab regresa en la secuencia (y a la fila anterior)', ['§F8a-cap-a'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true' } }));
    await enfocar(c, 'A2', 3);
    await c.tecla('Shift+Tab');
    c.igual(await actual(c), [1, 'codigo']);
    await c.tecla('Shift+Tab');
    c.igual(await actual(c), [0, 'precio']);
  });
  t('06', 'Tab con el editor abierto confirma y avanza', ['§F8a-cap-a'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true' } }));
    await editar(c, 't1', 0, 3, '42', { confirmar: 'Tab' });
    c.igual(await actual(c), [0, 'precio']);
    c.igual(String((await c.datos())[0].cantidad), '42');
  });
  t('07', 'enter-mode="next-cell": Enter (en el editor y en el selector) avanza en la secuencia; F2 edita', ['§F8a-cap-d'], async (c) => {
    await c.abrir(cap({ a: { 'enter-mode': 'next-cell', 'skip-readonly': 'true' } }));
    c.igual(await c.ev(() => __ct.t('t1').EnterMode), 'next-cell');
    await editar(c, 't1', 0, 0, 'B1');
    c.igual(await actual(c), [0, 'cantidad']);
    await c.tecla('Enter');
    c.igual(await actual(c), [0, 'precio']);
    c.igual(await editando(c), false);
    await c.tecla('F2');
    c.igual(await editando(c), true);
    await c.tecla('Shift+Enter');
    c.igual(await actual(c), [0, 'cantidad']);
  });
  t('08', 'enter-mode="next-row": Enter va a la primera capturable de la fila siguiente', ['§F8a-cap-d'], async (c) => {
    await c.abrir(cap({ a: { 'enter-mode': 'next-row', 'skip-readonly': 'true' } }));
    await editar(c, 't1', 0, 3, '9');
    c.igual(await actual(c), [1, 'codigo']);
    c.igual(String((await c.datos())[0].cantidad), '9');
  });
  t('09', 'enter-mode="down": Enter confirma y baja en la misma columna', ['§F8a-cap-d'], async (c) => {
    await c.abrir(cap({ a: { 'enter-mode': 'down' } }));
    await editar(c, 't1', 0, 3, '9');
    c.igual(await actual(c), [1, 'cantidad']);
    await c.tecla('Enter');
    c.igual(await actual(c), [2, 'cantidad']);
  });
  t('10', 'enter-mode="current" o sin atributos: Enter y Tab como hoy', ['§F8a-cap-d', '§0-R8'], async (c) => {
    for (const a of [{}, { 'enter-mode': 'current' }]) {
      await c.abrir(cap({ a }));
      await enfocar(c, 'A1', 3);
      await c.tecla('Enter');
      c.igual(await editando(c), true, 'Enter en el selector edita');
      await c.tecla('Enter');
      c.igual(await actual(c), [0, 'precio'], 'Enter en el editor va a la derecha');
      await c.tecla('Tab');
      c.igual(await actual(c), [1, 'codigo'], 'Tab en la última va a la fila siguiente (EverMove)');
    }
  });
  t('11', 'columnas ocultas y reordenadas: la secuencia sigue el orden que se ve', ['§F8a-cap-e', '§7-b', '§8-e'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true', 'column-reorder': 'true' } }));
    await c.ev(() => { const t = __ct.t('t1'); t.MoveColumn('precio', 0); t.hideColumn('cantidad', true); });
    c.igual(await m(c, 't1', 'getCaptureOrder'), ['precio', 'codigo']);
    await c.foco('t1', 0, 0);
    await c.tecla('Tab');
    c.igual(await actual(c), [0, 'codigo']);
    await c.tecla('Tab');
    c.igual(await actual(c), [1, 'precio']);
  });
  t('12', 'con grupos, next-row salta las filas de grupo', ['§F8a-cap-e', '§11-f'], async (c) => {
    await c.abrir(cap({ a: { 'enter-mode': 'next-row', 'skip-readonly': 'true', 'group-panel': 'true' } }));
    await c.ev(() => __ct.t('t1').GroupBy(['linea']));
    await enfocar(c, 'A3', 3);
    await c.tecla('Enter');
    c.igual(await actual(c), [0, 'codigo']);
  });
  t('13', 'virtual-rows: Tab en la última capturable dibuja y enfoca la fila siguiente', ['§F8a-cap-e', '§10-d'], async (c) => {
    await c.abrir({ body: `<div id="sc" style="height:300px;overflow-y:auto">` + tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px', 'control-styles': CS_V12, 'skip-readonly': 'true' }, cols: COLC() }) + '</div>', script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(muchas(500))};t._printRows();});` });
    await c.ev(() => __ct.t('t1').NavTo(30, 4));
    await c.tecla('Tab');
    c.igual(await actual(c), [31, 'codigo']);
  });
  t('14', 'multi-select="checkbox": la secuencia nunca entra a la columna del sistema', ['§F8a-cap-e', '§4-i'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true', 'multi-select': 'checkbox' } }));
    await enfocar(c, 'A2', 0);
    await c.tecla('Shift+Tab');
    c.igual(await actual(c), [0, 'precio']);
  });
  t('15', 'con máscara (F2): Tab confirma con el valor canónico', ['§F8a-cap-e', '§3-g'], async (c) => {
    await c.abrir(cap({ a: { 'skip-readonly': 'true' }, x: { cantidad: { calc: 'true' } } }));
    await editar(c, 't1', 0, 3, '=2*3', { confirmar: 'Tab' });
    c.igual(await actual(c), [0, 'precio']);
    c.igual((await c.datos())[0].cantidad, '6');
  }, { requiere: ['calc'] });
}

// =====================================================================================================
// Formato condicional (bandera 'rules')
// =====================================================================================================
const R = registro('reg', { requiere: ['rules'] });
{
  const t = R.t;
  const clases = (c, k, cls) => c.ev(({ k, cls }) => { const t = __ct.t('t1'); return t.DataArray.map((_, i) => t.GetTrByIndex(i).cells[k].classList.contains(cls)); }, { k, cls });
  const reglas = (r) => JSON.stringify(r);
  t('01', 'rules en la columna (JSON): et-neg en las negativas', ['§F8a-reg-a', '§F8a-reg-f'], async (c) => {
    await c.abrir(pag({ x: { cantidad: { rules: reglas([{ op: 'lt', value: 0, class: 'et-neg' }]) } } }));
    c.igual(await clases(c, 3, 'et-neg'), [false, true, false, false, false]);
  });
  t('02', 'operadores lt le gt ge eq ne between in contains empty notempty', ['§F8a-reg-b'], async (c) => {
    const casos = [
      [{ op: 'le', value: 0 }, [false, true, false, true, false]],
      [{ op: 'gt', value: 5 }, [true, false, true, false, false]],
      [{ op: 'ge', value: 5 }, [true, false, true, false, true]],
      [{ op: 'eq', value: 7 }, [false, false, true, false, false]],
      [{ op: 'ne', value: 7 }, [true, true, false, true, true]],
      [{ op: 'between', value: 0, value2: 7 }, [false, false, true, true, true]],
      [{ op: 'in', value: [10, 0] }, [true, false, false, true, false]],
      [{ field: 'nombre', op: 'contains', value: 'ELECTRICO' }, [false, true, false, false, false]],
      [{ field: 'extra', op: 'empty' }, [true, true, false, true, true]],
      [{ field: 'extra', op: 'notempty' }, [false, false, true, false, false]],
    ];
    const data = DATOS.map((d, i) => (i === 2 ? { ...d, extra: 'x' } : d));
    for (const [r, esperado] of casos) {
      await c.abrir(pag({ data, x: { cantidad: { rules: reglas([{ ...r, class: 'et-bold' }]) } } }));
      c.igual(await clases(c, 3, 'et-bold'), esperado, JSON.stringify(r));
    }
  });
  t('03', 'números con la aritmética canónica (R9): "10.50" = 10.5, cadenas grandes exactas', ['§F8a-reg-c', '§0-R9'], async (c) => {
    const data = [{ codigo: 'n1', cantidad: '10.50' }, { codigo: 'n2', cantidad: '12345678901234567890.1' }, { codigo: 'n3', cantidad: '-0.5' }, { codigo: 'n4', cantidad: '' }];
    await c.abrir(pag({ data, x: { cantidad: { rules: reglas([{ op: 'eq', value: 10.5, class: 'et-ok' }, { op: 'gt', value: '12345678901234567890', class: 'et-warn' }, { op: 'lt', value: 0, class: 'et-neg' }]) } } }));
    c.igual(await clases(c, 3, 'et-ok'), [true, false, false, false]);
    c.igual(await clases(c, 3, 'et-warn'), [false, true, false, false]);
    c.igual(await clases(c, 3, 'et-neg'), [false, false, true, false], 'vacío no es negativo');
  });
  t('04', 'fechas ISO: between y lt', ['§F8a-reg-c'], async (c) => {
    const data = [{ codigo: 'f1', fecha: '2026-01-05' }, { codigo: 'f2', fecha: '2026-02-01T10:30' }, { codigo: 'f3', fecha: '2025-12-31' }];
    const cols = [{ field: 'codigo', title: 'Código' }, { field: 'fecha', type: 'Date', title: 'Fecha', rules: reglas([{ op: 'between', value: '2026-01-01', value2: '2026-01-31', class: 'et-ok' }, { op: 'lt', value: '2026-01-01', class: 'et-muted' }]) }];
    await c.abrir(pag({ data, cols }));
    c.igual(await clases(c, 1, 'et-ok'), [true, false, false]);
    c.igual(await clases(c, 1, 'et-muted'), [false, false, true]);
  });
  t('05', 'style e icon sin cambiar el contenido de la celda (GetTdValue igual)', ['§F8a-reg-a', '§F8a-reg-d'], async (c) => {
    await c.abrir(pag({ x: { cantidad: { rules: reglas([{ op: 'lt', value: 0, style: { color: 'rgb(200, 0, 0)', fontWeight: '700' }, icon: '⚠' }]) } } }));
    const r = await c.ev(() => { const t = __ct.t('t1'); const td = t.GetTrByIndex(1).cells[3]; const cc = td.querySelector('.cell-content'); return { color: td.style.color, peso: td.style.fontWeight, icon: td.getAttribute('data-et-icon'), antes: getComputedStyle(cc, '::before').content, valor: t.GetTdValue(td), otra: t.GetTrByIndex(0).cells[3].style.color }; });
    c.igual([r.color, r.peso, r.icon, r.valor, r.otra], ['rgb(200, 0, 0)', '700', '⚠', '-3', '']);
    c.ok(r.antes.includes('⚠'), 'el icono se ve con ::before: ' + r.antes);
  });
  t('06', 'field en la regla de columna: compara otro campo de la fila', ['§F8a-reg-a'], async (c) => {
    await c.abrir(pag({ x: { precio: { rules: reglas([{ field: 'linea', op: 'eq', value: 'Plomería', class: 'et-strike' }]) } } }));
    c.igual(await clases(c, 4, 'et-strike'), [false, false, false, false, true]);
  });
  t('07', 'row-rules (atributo) y RowRules (propiedad) ponen clases en el tr', ['§F8a-reg-e', '§0-R5'], async (c) => {
    const tr = (c, cls) => c.ev((cls) => { const t = __ct.t('t1'); return t.DataArray.map((_, i) => t.GetTrByIndex(i).classList.contains(cls)); }, cls);
    await c.abrir(pag({ a: { 'row-rules': reglas([{ field: 'linea', op: 'eq', value: 'Eléctrico', class: 'et-muted' }]) } }));
    c.igual(await tr(c, 'et-muted'), [false, true, true, false, false]);
    await c.ev(() => { const t = __ct.t('t1'); t.RowRules = [{ field: 'cantidad', op: 'eq', value: 0, class: 'et-err' }]; t.RefreshRules(); });
    c.igual(await tr(c, 'et-muted'), [false, false, false, false, false]);
    c.igual(await tr(c, 'et-err'), [false, false, false, true, false]);
  });
  t('08', 'al editar se reaplican solo en la fila afectada', ['§F8a-reg-g'], async (c) => {
    await c.abrir(pag({ x: { cantidad: { rules: reglas([{ op: 'lt', value: 0, class: 'et-neg' }]) } }, script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');window.pint=[];t.onRowPaint=(tr,i)=>window.pint.push(i);});" }));
    await editar(c, 't1', 0, 3, '-1');
    await editar(c, 't1', 1, 3, '4');
    c.igual(await clases(c, 3, 'et-neg'), [true, false, false, false, false]);
    c.igual(await c.ev(() => window.pint), [], 'no vuelve a pintar las demás filas');
  });
  t('09', 'UpdateRow después de cambiar DataArray por código reaplica', ['§F8a-reg-g'], async (c) => {
    await c.abrir(pag({ x: { cantidad: { rules: reglas([{ op: 'lt', value: 0, class: 'et-neg' }]) } } }));
    await c.ev(() => { const t = __ct.t('t1'); t.DataArray[4].cantidad = -9; t.UpdateRow(4); });
    c.igual(await clases(c, 3, 'et-neg'), [false, true, false, false, true]);
  });
  t('10', 'virtual-rows: las reglas se aplican al dibujar', ['§F8a-reg-g', '§10-d'], async (c) => {
    await c.abrir({ body: `<div id="sc" style="height:300px;overflow-y:auto">` + tabla({ a: { 'virtual-rows': 'true', 'row-height': '28px', 'control-styles': CS_V12 }, cols: COLS({ cantidad: { rules: reglas([{ op: 'ge', value: 45, class: 'et-warn' }]) } }) }) + '</div>', script: `document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.DataArray=${JSON.stringify(muchas(3000))};t._printRows();});` });
    const r = await c.ev(async () => { const t = __ct.t('t1'); const tr = t.GetTrByIndex(2007); await __ct.cuadro(); return [t.DataArray[2007].cantidad, tr.cells[3].classList.contains('et-warn')]; });
    c.igual(r[1], r[0] >= 45);
  });
  t('11', 'onTdPaint corre después de las reglas (ve la clase y puede quitarla)', ['§F8a-reg-h'], async (c) => {
    await c.abrir({ body: tabla({ cols: COLS({ cantidad: { rules: reglas([{ op: 'lt', value: 0, class: 'et-neg' }]) } }) }), script: `window.vio=[];document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.onTdPaint=(td,i,c,f)=>{if(f==='cantidad'){window.vio.push(td.classList.contains('et-neg'));if(i===1)td.classList.remove('et-neg');}};t.DataArray=${JSON.stringify(DATOS)};t._printRows();});` });
    c.igual(await c.ev(() => window.vio), [false, true, false, false, false]);
    c.igual(await clases(c, 3, 'et-neg'), [false, false, false, false, false]);
  });
  t('12', 'funciona con CSP estricta (sin unsafe-eval): ninguna evaluación de código', ['§F8a-reg-i'], async (c) => {
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'">`;
    const cols = [{ field: 'codigo', title: 'Código' }, { field: 'cantidad', title: 'Cantidad', rules: reglas([{ op: 'lt', value: 0, class: 'et-neg', icon: '!' }]) }];
    await c.abrir({ antes: csp, body: tabla({ cols, data: DATOS, a: { 'row-rules': reglas([{ field: 'cantidad', op: 'between', value: 1, value2: 9, class: 'et-bold' }]) } }) });
    const r = await c.ev(() => { const t = __ct.t('t1'); return t.DataArray.map((_, i) => [t.GetTrByIndex(i).cells[1].classList.contains('et-neg'), t.GetTrByIndex(i).classList.contains('et-bold')]); });
    c.igual(r, [[false, false], [true, false], [false, true], [false, false], [false, true]]);
    c.sinErrores();
    c.igual(c.consola.filter(x => /Content Security Policy|unsafe-eval/i.test(x.texto)), []);
  });
  t('13', 'clases utilitarias con variables del contrato: et-neg usa --et-neg-fg', ['§F8a-reg-f'], async (c) => {
    await c.abrir(pag({ head: '<style>#t1{--et-neg-fg: rgb(9, 8, 7);}</style>', x: { cantidad: { rules: reglas([{ op: 'lt', value: 0, class: 'et-neg' }]) } } }));
    const r = await c.ev(() => { const t = __ct.t('t1'); return [getComputedStyle(t.GetTrByIndex(1).cells[3]).color, getComputedStyle(t.GetTrByIndex(0).cells[3]).color]; });
    c.igual(r[0], 'rgb(9, 8, 7)');
    c.distinto(r[1], 'rgb(9, 8, 7)');
    const css = await c.ev(() => Array.from(__ct.sr('t1').querySelectorAll('style[data-et="f8"]')).map(s => s.textContent).join(''));
    for (const k of ['et-neg', 'et-strike', 'et-muted', 'et-bold', 'et-ok', 'et-warn', 'et-err']) c.ok(css.includes('.' + k), 'falta .' + k);
  });
  t('14', 'Columns[i].rules por código + RefreshRules(); JSON inválido avisa por consola sin romper', ['§F8a-reg-a', '§F8a-reg-j'], async (c) => {
    await c.abrir(pag({ x: { nombre: { rules: '[{op:' } } }));
    c.ok(c.consola.some(x => x.tipo === 'warning' && /rules/.test(x.texto)), 'aviso por consola');
    c.sinErrores();
    await c.ev(() => { const t = __ct.t('t1'); t.Columns[4].rules = [{ op: 'gt', value: 100, class: 'et-bold' }]; t.RefreshRules(); });
    c.igual(await clases(c, 4, 'et-bold'), [false, false, false, false, true]);
  });
  t('15', 'sin reglas no se agrega ninguna clase ni estilo (R1)', ['§F8a-reg-a', '§0-R1'], async (c) => {
    await c.abrir(pag());
    const r = await c.ev(() => ({ st: !!__ct.sr('t1').querySelector('style[data-et="f8"]'), icon: !!__ct.sr('t1').querySelector('[data-et-icon]') }));
    c.igual(r, { st: false, icon: false });
  });
}

// =====================================================================================================
// Encargos de la integración (coordinador, 2026-11-01): tecleo rápido, _printRows en FieldUpdated, columnas fijas
// con teclado, restauración del diseño con aviso. No requieren atributos nuevos.
// =====================================================================================================
const E = registro('enc');
{
  const t = E.t;
  const rafaga = (c, teclas) => c.ev((teclas) => { const s = __ct.sr('t1').querySelector('#__table_selector'); for (const k of teclas) s.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, composed: true })); }, teclas);
  t('01', 'teclear muy rápido en el selector (lector de códigos) no pierde caracteres ni lanza errores; el Enter final confirma', ['§F8a-enc-a'], async (c) => {
    await c.abrir(pag());
    await enfocar(c, 'A1', 1);
    await rafaga(c, ['X', 'Y', 'Z', '-', '1', '2', 'Enter']);
    await c.esperar(80);
    c.sinErrores();
    c.igual((await c.datos())[0].nombre, 'XYZ-12');
    c.igual(await editando(c), false);
    c.igual(await actual(c), [0, 'linea']);
  });
  t('02', 'ráfaga en una columna calc: "=1200" + Enter guarda 1200', ['§F8a-enc-a', '§3-h'], async (c) => {
    await c.abrir(pag({ x: { cantidad: { calc: 'true' } } }));
    await enfocar(c, 'A1', 3);
    await rafaga(c, ['=', '1', '2', '0', '0', 'Enter']);
    await c.esperar(80);
    c.sinErrores();
    c.igual(String((await c.datos())[0].cantidad), '1200');
  }, { requiere: ['calc'] });
  t('03', 'teclado real sin pausa entre teclas: el texto llega completo', ['§F8a-enc-a'], async (c) => {
    await c.abrir(pag());
    await enfocar(c, 'A2', 1);
    await c.page.keyboard.type('ABC123', { delay: 0 });
    await c.page.keyboard.press('Enter');
    await c.esperar(80);
    c.sinErrores();
    c.igual((await c.datos())[1].nombre, 'ABC123');
  });
  t('04', '_printRows() dentro de FieldUpdated: Enter sigue a la celda equivalente de la fila redibujada, sin errores', ['§F8a-enc-b'], async (c) => {
    await c.abrir(pag({ script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.addEventListener('FieldUpdated',()=>t._printRows());});" }));
    await editar(c, 't1', 0, 1, 'Redibujada');
    c.sinErrores();
    c.igual((await c.datos())[0].nombre, 'Redibujada');
    c.igual(await actual(c), [0, 'linea']);
    await c.tecla('ArrowDown');
    c.igual(await actual(c), [1, 'linea']);
  });
  t('05', 'columnas fijas: al navegar con flechas la celda queda a la vista y no debajo de la banda fija', ['§F8a-enc-c', '§6-c'], async (c) => {
    const cols = COLS({ codigo: { fixed: 'left', width: '180px' }, nombre: { fixed: 'left', width: '220px' }, linea: { width: '300px' }, cantidad: { width: '300px' }, precio: { width: '300px' } });
    await c.abrir({ body: tabla({ cols, data: DATOS, style: 'width:600px;display:block' }) });
    await c.ev(() => { const d = __ct.sr('t1').querySelector('table').parentElement; d.scrollLeft = 400; });
    await c.clic('t1', 0, 0);
    for (let k = 0; k < 4; k++) {
      await c.tecla('ArrowRight');
      const r = await c.ev(() => {
        const t = __ct.t('t1'), td = t.CurrentTd(), d = __ct.sr('t1').querySelector('table').parentElement;
        const tr = td.closest('tr'), fijas = Array.from(tr.cells).filter(x => x.classList.contains('et-fixed'));
        const der = Math.max(...fijas.map(x => x.getBoundingClientRect().right)), rc = td.getBoundingClientRect(), rd = d.getBoundingClientRect();
        return { fija: td.classList.contains('et-fixed'), izq: rc.left, der: rc.right, banda: der, cont: rd.left + d.clientLeft + d.clientWidth, campo: t.Columns[t.ColIndexOfTd(td)].field };
      });
      if (!r.fija) c.ok(r.izq >= r.banda - 1 && (r.der <= r.cont + 1 || r.izq <= r.banda + 1), `${r.campo}: [${r.izq.toFixed(0)}, ${r.der.toFixed(0)}] con banda fija hasta ${r.banda.toFixed(0)} y contenedor hasta ${r.cont.toFixed(0)}`);
    }
    await c.ev(() => __ct.t('t1').NavTo(2, 2));
    const r2 = await c.ev(() => { const td = __ct.t('t1').CurrentTd(); const tr = td.closest('tr'); const banda = Math.max(...Array.from(tr.cells).filter(x => x.classList.contains('et-fixed')).map(x => x.getBoundingClientRect().right)); return td.getBoundingClientRect().left >= banda - 1; });
    c.igual(r2, true, 'NavTo también');
  }, { requiere: ['fixed'] });
  t('06', 'LayoutReady/whenLayoutReady(): sin diseño guardado se resuelve en false, sin LayoutChanged', ['§F8a-enc-d', '§9-k'], async (c) => {
    await c.abrir({ ruta: '/pantallas/enc-06.html', body: tabla({ a: { 'column-reorder': 'true' }, cols: COLS(), data: DATOS }), script: "window.lc=[];document.getElementById('t1').addEventListener('LayoutChanged',e=>window.lc.push(e.reason));document.getElementById('t1').whenLayoutReady().then(v=>{window.listo=v;});" });
    await c.esperar(300);
    c.igual(await c.ev(() => [window.listo, window.lc, __ct.t('t1').LayoutReady instanceof Promise]), [false, [], true]);
  }, { requiere: ['layout'] });
  t('07', 'al restaurar el diseño guardado: LayoutChanged {reason:"restore"} y LayoutReady se resuelve en true con el orden ya aplicado', ['§F8a-enc-d', '§9-k'], async (c) => {
    const html = { ruta: '/pantallas/enc-07.html', body: tabla({ a: { 'column-reorder': 'true' }, cols: COLS(), data: DATOS }), script: "window.lc=[];const t=document.getElementById('t1');t.addEventListener('LayoutChanged',e=>window.lc.push([e.reason,e.layout.columns.map(x=>x.field).join(',')]));t.whenLayoutReady().then(v=>{window.listo=[v,t.Columns.map(x=>x.field).join(',')];});" };
    await c.abrir(html);
    await c.ev(() => { const t = __ct.t('t1'); t._f3ComoUsuario(() => t.MoveColumn('precio', 0)); });
    await c.esperar(900);
    await c.page.reload({ waitUntil: 'load' });
    await c.esperar(400);
    const r = await c.ev(() => [window.listo, window.lc]);
    c.igual(r[0], [true, 'precio,codigo,nombre,linea,cantidad']);
    c.igual(r[1].filter(x => x[0] === 'restore'), [['restore', 'precio,codigo,nombre,linea,cantidad']]);
  }, { requiere: ['layout', 'reorder'] });
  t('08', 'agrupar en 3 niveles (inline) y quitarlos: la tabla vuelve a su ancho (documenta el ensanchamiento por la etiqueta)', ['§F8a-enc-e', '§11-e'], async (c) => {
    const data = Array.from({ length: 24 }, (_, i) => ({ codigo: 'C' + i, nombre: 'Producto ' + i, linea: ['Ferretería', 'Eléctrico'][i % 2], marca: ['Marca uno', 'Marca dos', 'Marca tres'][i % 3], cantidad: i, precio: i }));
    await c.abrir({ body: '<div style="width:700px">' + tabla({ a: { 'group-panel': 'true', 'group-summary': 'inline', readonly: 'true' }, cols: COLS({ cantidad: { summary: 'sum' } }), data }) + '</div>' });
    const ancho = () => c.ev(() => __ct.sr('t1').querySelector('table').parentElement.scrollWidth);
    const w0 = await ancho();
    const anchos = [];
    for (const g of [['linea'], ['linea', 'marca'], ['linea', 'marca', 'codigo'], ['linea', 'marca'], ['linea'], []]) { await c.ev((g) => __ct.t('t1').GroupBy(g), g); await c.esperar(30); anchos.push(await ancho()); }
    c.nota('scrollWidth: ' + [w0, ...anchos].join(' → '));
    c.igual(anchos[5], w0, 'sin grupos vuelve al ancho inicial');
    c.igual(anchos[3], anchos[1], 'al quitar el tercer nivel vuelve al ancho de dos niveles');
  }, { requiere: ['group'] });
}

const FEAT = registro('f8a');
FEAT.t('features', 'EditTable.features declara search, rowvalidate, changes, capture y rules', ['§0-R6'], async (c) => {
  await c.abrir(pag());
  const f = await c.features();
  c.igual(['search', 'rowvalidate', 'changes', 'capture', 'rules'].filter(x => !f.includes(x)), []);
}, { requiere: ['search', 'rowvalidate', 'changes', 'capture', 'rules'] });

export default [
  { nombre: 'v2-f8a-busqueda', grupo: 'v2', pruebas: B.P },
  { nombre: 'v2-f8a-validacion', grupo: 'v2', pruebas: V.P },
  { nombre: 'v2-f8a-cambios', grupo: 'v2', pruebas: C.P },
  { nombre: 'v2-f8a-captura', grupo: 'v2', pruebas: K.P },
  { nombre: 'v2-f8a-reglas', grupo: 'v2', pruebas: R.P.concat(FEAT.P) },
  { nombre: 'v2-f8a-encargos', grupo: 'v2', pruebas: E.P },
];
