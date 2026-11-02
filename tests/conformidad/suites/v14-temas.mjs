// v2: F8b, temas (theme, palette, striped, density) y variables CSS --et-*. Spec: /home/claude/mapa/edittable-spec-f8-temas.md
import { tabla, PRODUCTOS } from '../lib/fixtures.mjs';
import { registro, editar } from '../lib/v2.mjs';

const { P, t } = registro('tem', { requiere: ['theme'] });
const TEMAS = ['claro', 'oscuro', 'jade', 'libro-mayor'];

const COLS = [
  { field: 'codigo', type: 'Text', title: 'Código', width: '90px' },
  { field: 'nombre', type: 'Text', title: 'Nombre', width: '200px' },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', width: '90px' },
  { field: 'precio', type: 'Number', title: 'Precio', width: '100px', format: 'true', decs: '2', prefix: '$' },
];
const DATOS = PRODUCTOS.map((p, i) => ({ ...p, cantidad: i === 2 ? -3 : p.cantidad }));
const pag = (a = {}, x = {}) => ({ body: (x.antesTabla ?? '') + tabla({ a, cols: x.cols ?? COLS, data: x.data ?? DATOS }) + (x.despues ?? ''), head: x.head, script: x.script, antes: x.antes, contexto: x.contexto });
// Tabla rica: fijas (F3), totales (F2), casillas (F4), agrupación (F6), selector de columnas
const COLS_RICA = [
  { field: 'codigo', type: 'Text', title: 'Código', width: '90px', fixed: 'left' },
  { field: 'nombre', type: 'Text', title: 'Nombre', width: '200px' },
  { field: 'linea', type: 'Text', title: 'Línea', width: '120px' },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', width: '90px', summary: 'sum' },
  { field: 'precio', type: 'Number', title: 'Precio', width: '100px' },
];
const RICA = { 'multi-select': 'checkbox', 'group-panel': 'true', 'column-chooser': 'true', 'design-auto-save': 'false' };

// Estilos calculados de un conjunto de elementos clave del shadow (los que existan).
const PROPS = ['color', 'background-color', 'background-image', 'outline-color', 'outline-width', 'outline-style', 'border-top-color', 'border-radius',
  'padding-top', 'padding-left', 'font-size', 'font-family', 'font-weight', 'height', 'text-transform', 'letter-spacing', 'text-align',
  'font-variant-numeric', 'color-scheme', 'box-shadow', 'justify-content', 'accent-color'];
const estilos = (c, id = 't1') => c.ev(({ id, PROPS }) => {
  const s = __ct.sr(id), out = {};
  const sel = {
    host: null, cont: ':scope > div', table: 'table', thead: 'thead', th0: 'thead th', th2: 'thead th:nth-of-type(3)',
    tr0: 'tbody > tr', tr1: 'tbody > tr:nth-of-type(2)', td00: 'tbody > tr > td', td02: 'tbody > tr > td:nth-of-type(3)', td22: 'tbody > tr:nth-of-type(3) > td:nth-of-type(3)',
    trSel: 'tbody > tr.EdiTable-Row-Selected', tdSel: 'tbody > tr.EdiTable-Row-Selected > td', selector: '#__table_selector', input: '#__table_input',
    tfoot: 'tfoot', tfootTd: 'tfoot td', fija: 'td.et-fixed', thFija: 'th.et-fixed', sys: 'td.et-sel-col', panel: '.et-group-panel',
    chooserBtn: '.et-chooser-btn', chooser: '.et-chooser', grupo: 'tr.et-group-row > td', badge: '.et-badge',
  };
  for (const [k, q] of Object.entries(sel)) {
    const el = q === null ? document.getElementById(id) : s.querySelector(q);
    if (!el) continue;
    const cs = getComputedStyle(el); out[k] = {};
    for (const p of PROPS) out[k][p] = cs.getPropertyValue(p);
  }
  return out;
}, { id, PROPS });
const variable = (c, sel, nombre, id = 't1') => c.ev(({ id, sel, nombre }) => { const el = sel ? __ct.sr(id).querySelector(sel) : document.getElementById(id); return el ? getComputedStyle(el).getPropertyValue(nombre).trim() : null; }, { id, sel, nombre });
const cs = (c, sel, prop, id = 't1') => c.ev(({ id, sel, prop }) => { const el = __ct.sr(id).querySelector(sel); return el ? getComputedStyle(el).getPropertyValue(prop) : null; }, { id, sel, prop });
const rgb = (hex) => { const h = hex.replace('#', ''); const n = h.length === 3 ? h.split('').map(x => x + x).join('') : h; return `rgb(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)})`; };
const temas = (c) => c.ev(() => EditTable.themes);
const seleccionar = (c, r = 1, col = 1) => c.ev(({ r, col }) => { const t = __ct.t('t1'); t.CellFocus(__ct.td('t1', r, col)); }, { r, col });

// ---------- R1: sin tema, nada cambia ----------
t('01', 'features incluye "theme"; EditTable.themes trae claro, oscuro, jade y libro-mayor; defineTheme existe', ['§T-api', '§0-R6'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => ({ f: EditTable.features.includes('theme'), n: Object.keys(EditTable.themes), d: typeof EditTable.defineTheme }));
  c.igual(r.f, true); c.igual(r.d, 'function');
  for (const n of TEMAS) c.contiene(r.n, n);
});
t('02', 'sin tema: estilos calculados de host, tabla, th, td, fila seleccionada, selector y editor iguales a 0ed1824', ['§T-r1', '§0-R1'], async (c) => {
  const cuerpo = pag({ 'control-styles': '#t1 tr th{font-weight:500}' });
  await c.abrir(cuerpo); const o = await c.otra({ ...cuerpo, src: 'ref' });
  for (const x of [c, o]) await seleccionar(x, 1, 1);
  const a = await estilos(c), b = await estilos(o);
  c.igual(Object.keys(a).sort(), Object.keys(b).sort(), 'mismos elementos');
  for (const k of Object.keys(b)) c.igual(a[k], b[k], k);
  await editar(c, 't1', 1, 1, 'x', { confirmar: null }); await editar(o, 't1', 1, 1, 'x', { confirmar: null });
  c.igual((await estilos(c)).input, (await estilos(o)).input, 'editor abierto');
});
t('03', 'sin tema: el shadow DOM serializado (incluido el texto de cada <style>) es igual al de 0ed1824', ['§T-r1', '§0-R1'], async (c) => {
  const cuerpo = pag({ 'control-styles': 'tr td{color:rgb(1,2,3)}' });
  await c.abrir(cuerpo); const o = await c.otra({ ...cuerpo, src: 'ref' });
  for (const x of [c, o]) await seleccionar(x, 2, 2);
  c.igual(await c.ev(() => __ct.serial('t1')), await o.ev(() => __ct.serial('t1')));
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('style[data-et="f8b"]')), null);
});
t('04', 'sin tema, con F2/F3/F4/F6 activos: estilos calculados iguales con y sin variables en el CSSOM', ['§T-r1', '§T-cssom'], async (c) => {
  const cuerpo = pag(RICA, { cols: COLS_RICA });
  await c.abrir(cuerpo); const o = await c.otra({ ...cuerpo, head: '<script>EditTable._f8bSinVariables = true;</script>' });
  for (const x of [c, o]) { await x.ev(() => { __ct.t('t1').GroupBy(['linea']); __ct.sr('t1').querySelector('.et-chooser-btn').click(); }); await seleccionar(x, 1, 2); }
  const a = await estilos(c), b = await estilos(o);
  for (const k of ['fija', 'thFija', 'sys', 'panel', 'chooserBtn', 'chooser', 'grupo', 'tfoot', 'tfootTd', 'th0', 'td02', 'trSel']) { c.ok(b[k], 'existe ' + k); c.igual(a[k], b[k], k); }
  c.ok(await c.ev(() => __ct.sr('t1').querySelector('table').classList.contains('et-has-fixed')), 'hay fijas');
});
t('05', 'sin tema: las celdas no reciben clases nuevas (et-num, et-neg) y no hay <style data-et="f8b">', ['§T-r1'], async (c) => {
  await c.abrir(pag());
  c.igual(await c.ev(() => __ct.sr('t1').querySelectorAll('.et-num, .et-neg').length), 0);
  c.igual(await c.ev(() => __ct.sr('t1').querySelectorAll('style[data-et="f8b"]').length), 0);
});

// ---------- cada tema aplica sus variables ----------
for (const n of TEMAS) {
  t('06-' + n, `theme="${n}": encabezado, celdas, tabla, fila seleccionada y editor toman la paleta del tema`, ['§T-theme', '§T-vars'], async (c) => {
    await c.abrir(pag({ theme: n }));
    const T = (await temas(c))[n];
    await seleccionar(c, 1, 1);
    const e = await estilos(c);
    c.igual(e.thead['background-color'], rgb(T['header-bg']), 'header-bg');
    c.igual(e.th0.color, rgb(T['header-fg']), 'header-fg');
    c.igual(e.table['background-color'], rgb(T.bg), 'bg');
    c.igual(e.td00.color, rgb(T.fg), 'fg');
    c.igual(e.trSel['background-color'], rgb(T['sel-bg']), 'sel-bg');
    c.igual(e.trSel.color, rgb(T['sel-fg']), 'sel-fg');
    c.igual(e.td02['outline-color'], rgb(T.border), 'border');
    c.igual(e.th0['outline-color'], rgb(T['header-border']), 'header-border');
    c.igual(e.selector['border-radius'], T.radius === '0' ? '0px' : T.radius, 'radius');
    c.igual(e.host['color-scheme'], T['color-scheme']);
    if (T['header-transform']) c.igual(e.th0['text-transform'], T['header-transform']);
    await editar(c, 't1', 1, 1, 'x', { confirmar: null });
    const i = (await estilos(c)).input;
    c.igual([i['background-color'], i.color], [rgb(T['input-bg']), rgb(T['input-fg'])], 'editor');
  });
}
t('07', 'libro-mayor: esquinas angulares (radio 0) en selector, chips de grupo, badges, menú y botón del selector de columnas', ['§T-theme'], async (c) => {
  await c.abrir(pag({ ...RICA, theme: 'libro-mayor' }, { cols: COLS_RICA, script: "document.addEventListener('DOMContentLoaded',()=>{const t=document.getElementById('t1');t.RowBadges=()=>[{id:'b',text:'B'}];t._printRows();});" }));
  await c.ev(() => { __ct.t('t1').GroupBy(['linea']); __ct.sr('t1').querySelector('.et-chooser-btn').click(); }); await seleccionar(c, 1, 2);
  const r = await c.ev(() => { const s = __ct.sr('t1'); return ['#__table_selector', '.et-group-chip', '.et-chooser-btn', '.et-chooser', '.et-group-panel'].map(q => { const el = s.querySelector(q); return el ? getComputedStyle(el).borderRadius : 'falta ' + q; }); });
  c.igual(r, ['0px', '0px', '0px', '0px', '0px']);
});
t('08', 'oscuro: color-scheme dark (controles nativos oscuros) y fondos opacos en fijas, pie, grupos, panel y menú', ['§T-theme', '§T-partes'], async (c) => {
  await c.abrir(pag({ ...RICA, theme: 'oscuro' }, { cols: COLS_RICA }));
  await c.ev(() => { __ct.t('t1').GroupBy(['linea']); __ct.sr('t1').querySelector('.et-chooser-btn').click(); });
  const T = (await temas(c)).oscuro, e = await estilos(c);
  c.igual(e.host['color-scheme'], 'dark');
  c.igual(e.fija['background-color'], rgb(T['fixed-bg']), 'fija opaca');
  c.igual(e.thFija['background-color'], rgb(T['fixed-head-bg']));
  c.igual(e.tfoot['background-color'], rgb(T['footer-bg']), 'pie');
  c.igual(e.grupo['background-color'], rgb(T['group-bg']), 'grupo');
  c.igual(e.panel['background-color'], rgb(T['panel-bg']), 'panel');
  c.igual(e.chooser['background-color'], rgb(T['menu-bg']), 'menú');
  c.igual(e.chooser.color, rgb(T['menu-fg']));
  c.igual(await c.ev(() => getComputedStyle(__ct.sr('t1').querySelector('td.et-sel-col input')).colorScheme), 'dark');
});

// ---------- precedencia ----------
t('09', 'precedencia: respaldo < tema < variables externas (:root y contenedor) < palette', ['§T-precedencia'], async (c) => {
  const body = `<style>:root{--et-header-bg:#102030} .v12{--et-sel-bg:#203040}</style><div class="v12">` + tabla({ a: { theme: 'claro' }, cols: COLS, data: DATOS }) + `</div>`;
  await c.abrir({ body });
  await seleccionar(c, 1, 1);
  let e = await estilos(c);
  c.igual(e.thead['background-color'], 'rgb(16, 32, 48)', ':root gana al tema');
  c.igual(e.trSel['background-color'], 'rgb(32, 48, 64)', 'contenedor gana al tema');
  c.igual(e.td02['outline-color'], rgb((await temas(c)).claro.border), 'lo demás del tema');
  await c.ev(() => __ct.t('t1').SetPalette({ 'header-bg': '#405060' }));
  e = await estilos(c);
  c.igual(e.thead['background-color'], 'rgb(64, 80, 96)', 'palette gana a :root');
  c.igual(e.trSel['background-color'], 'rgb(32, 48, 64)', 'palette sin sel-bg: sigue el contenedor');
  // estilo en línea del host también pierde con palette
  await c.ev(() => __ct.t('t1').style.setProperty('--et-header-bg', '#506070'));
  c.igual((await estilos(c)).thead['background-color'], 'rgb(64, 80, 96)');
  await c.ev(() => __ct.t('t1').SetPalette(null));
  c.igual((await estilos(c)).thead['background-color'], 'rgb(80, 96, 112)', 'sin palette gana el estilo en línea del host');
});
t('10', 'sin tema: las variables externas pintan la tabla (V12 solo con CSS); las derivadas siguen a su padre', ['§T-precedencia', '§T-vars'], async (c) => {
  const body = `<style>.v12{--et-header-bg:#0F3D6E;--et-header-fg:#FFFFFF;--et-bg:#FAFAF0;--et-border:#AABBCC}</style><div class="v12">` + tabla({ a: RICA, cols: COLS_RICA, data: DATOS }) + `</div>`;
  await c.abrir({ body });
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  const e = await estilos(c);
  c.igual([e.thead['background-color'], e.th0.color, e.table['background-color']], ['rgb(15, 61, 110)', 'rgb(255, 255, 255)', 'rgb(250, 250, 240)']);
  c.igual(e.fija['background-color'], 'rgb(250, 250, 240)', 'fixed-bg ← bg');
  c.igual(e.thFija['background-color'], 'rgb(15, 61, 110)', 'fixed-head-bg ← header-bg');
  c.igual(e.tfoot['background-color'], 'rgb(15, 61, 110)', 'footer-bg ← header-bg');
  c.igual(e.grupo['background-color'], 'rgb(15, 61, 110)', 'group-bg ← header-bg');
  c.igual(e.th0['outline-color'], 'rgb(170, 187, 204)', 'header-border ← border');
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('style[data-et="f8b"]')), null, 'sin <style> propio');
});
t('11', 'palette por atributo (JSON) sin tema; Palette devuelve una copia; SetPalette con y sin merge', ['§T-palette'], async (c) => {
  await c.abrir(pag({ palette: '{"header-bg":"#112233","--et-sel-bg":"#223344","headerFg":"#FFFFFF"}' }));
  c.igual(await c.ev(() => __ct.t('t1').Palette), { 'header-bg': '#112233', 'sel-bg': '#223344', 'header-fg': '#FFFFFF' });
  c.igual(await cs(c, 'thead', 'background-color'), 'rgb(17, 34, 51)');
  await c.ev(() => __ct.t('t1').SetPalette({ 'hover-bg': '#010203' }, { merge: true }));
  c.igual(Object.keys(await c.ev(() => __ct.t('t1').Palette)).length, 4, 'merge');
  await c.ev(() => __ct.t('t1').SetPalette({ 'hover-bg': '#010203' }));
  c.igual(await c.ev(() => __ct.t('t1').Palette), { 'hover-bg': '#010203' }, 'reemplazo');
  c.igual(await cs(c, 'thead', 'background-color'), 'rgb(245, 245, 245)', 'regresa al respaldo');
  await c.ev(() => { const p = __ct.t('t1').Palette; p['hover-bg'] = 'red'; });
  c.igual((await c.ev(() => __ct.t('t1').Palette))['hover-bg'], '#010203', 'copia');
});
t('12', 'palette inválido no rompe: JSON mal formado, arreglo, claves y valores con ; { } se ignoran con aviso', ['§T-palette'], async (c) => {
  await c.abrir(pag({ palette: '{"header-bg": #mal' }));
  c.sinErrores(); c.igual(c.dialogos, [], 'sin alert');
  c.igual(await c.ev(() => __ct.t('t1').Palette), {});
  c.igual(await cs(c, 'thead', 'background-color'), 'rgb(245, 245, 245)');
  const r = await c.ev(() => { const t = __ct.t('t1'); t.Palette = [1, 2]; const a = t.Palette; t.SetPalette({ 'header-bg': 'red;}x{color:red', 'a b': '#000', 'sel-bg': '', 'fg': { x: 1 }, 'border': '#123456' }); return [a, t.Palette]; });
  c.igual(r, [{}, { border: '#123456' }]);
  c.ok(c.consola.some(m => m.tipo === 'warning' && /palette/i.test(m.texto)), 'aviso en consola');
  c.igual(await c.ev(() => __ct.filas('t1').length), DATOS.length, 'la tabla sigue');
  c.sinErrores();
});

// ---------- en caliente ----------
t('13', 'Theme en caliente: no redibuja (mismos tr), no cambia DataArray ni dispara eventos; quitarlo deja el DOM como antes', ['§T-caliente'], async (c) => {
  await c.abrir(pag());
  await seleccionar(c, 1, 1);
  const antes = await c.ev(() => { __ct.filas('t1').forEach((tr, i) => tr.__marca = i); __ct.grabar('t1'); return __ct.serial('t1'); });
  const d0 = await c.datos();
  for (const n of [...TEMAS, 'auto', '']) await c.ev((n) => { __ct.t('t1').Theme = n; }, n);
  await c.ev(() => { __ct.t('t1').Theme = 'oscuro'; });
  c.igual(await cs(c, 'thead', 'background-color'), rgb((await temas(c)).oscuro['header-bg']));
  c.igual(await c.ev(() => __ct.filas('t1').every((tr, i) => tr.__marca === i)), true, 'mismos nodos tr');
  c.igual(await c.log(), [], 'sin eventos');
  c.igual(await c.datos(), d0);
  await c.ev(() => { __ct.t('t1').Theme = ''; });
  c.igual(await c.ev(() => __ct.serial('t1')), antes, 'DOM igual al de antes');
});
t('14', 'atributo theme en caliente (setAttribute/removeAttribute); la propiedad Theme gana al atributo', ['§T-caliente', '§0-R5'], async (c) => {
  await c.abrir(pag());
  const T = await temas(c);
  await c.ev(() => __ct.t('t1').setAttribute('theme', 'jade'));
  c.igual(await cs(c, 'thead', 'background-color'), rgb(T.jade['header-bg']));
  c.igual(await c.ev(() => __ct.t('t1').Theme), 'jade');
  await c.ev(() => { __ct.t('t1').Theme = 'libro-mayor'; __ct.t('t1').setAttribute('theme', 'oscuro'); });
  c.igual(await cs(c, 'thead', 'background-color'), rgb(T['libro-mayor']['header-bg']), 'gana la propiedad');
  await c.ev(() => { __ct.t('t1').Theme = null; });
  c.igual(await c.ev(() => __ct.t('t1').Theme), '');
  await c.ev(() => { const t = __ct.t('t1'); t.Theme = undefined; t.setAttribute('theme', 'jade'); });
  c.igual(await c.ev(() => __ct.t('t1').Theme), 'jade', 'Theme = undefined devuelve el control al atributo');
  await c.ev(() => __ct.t('t1').removeAttribute('theme'));
  c.igual(await cs(c, 'thead', 'background-color'), 'rgb(245, 245, 245)');
});
t('15', 'theme desconocido: aviso en consola y aspecto actual; alias light/dark', ['§T-theme'], async (c) => {
  await c.abrir(pag({ theme: 'morado' }));
  c.igual(await cs(c, 'thead', 'background-color'), 'rgb(245, 245, 245)');
  c.ok(c.consola.some(m => /tema desconocido/.test(m.texto)));
  await c.ev(() => { __ct.t('t1').Theme = 'dark'; });
  c.igual(await c.ev(() => __ct.t('t1').Theme), 'oscuro');
  c.sinErrores();
});
t('16', 'defineTheme registra un tema (base claro) y actualiza en caliente las tablas que lo usan; nombre inválido lanza', ['§T-api'], async (c) => {
  await c.abrir(pag({ theme: 'v12-azul' }));
  await c.ev(() => EditTable.defineTheme('v12-azul', { 'header-bg': '#0F3D6E', '--et-header-fg': '#FFFFFF' }));
  const T = await temas(c);
  c.igual(await cs(c, 'thead', 'background-color'), 'rgb(15, 61, 110)');
  c.igual(await cs(c, 'tbody > tr > td', 'outline-color'), rgb(T.claro.border), 'lo demás de claro');
  c.igual(T['v12-azul']['fixed-head-bg'], '#0F3D6E', 'derivada');
  const err = await c.ev(() => { try { EditTable.defineTheme('auto', {}); return 'no'; } catch (e) { return 'lanza'; } });
  c.igual(err, 'lanza');
});

// ---------- control-styles ----------
t('17', 'control-styles sigue ganando con tema donde ganaba (mismo selector más tarde, id, !important, selectores de V12)', ['§T-control-styles'], async (c) => {
  const cs1 = "#t1 tr th{font-weight:500} tr td{color:rgb(1,2,3)} th{color:rgb(4,5,6)} .EdiTable-Row-Selected{background-color:rgb(7,8,9) !important} thead{background-color:rgb(10,11,12)} td[data-cell='Nombre']{background-color:rgb(13,14,15)} div:has(table#t1){overflow:revert !important}";
  for (const tema of ['', ...TEMAS]) {
    await c.abrir(pag({ 'control-styles': cs1, ...(tema ? { theme: tema } : {}) }));
    await seleccionar(c, 1, 2);
    const e = await estilos(c);
    c.igual(e.th0['font-weight'], '500', tema + ' #id tr th');
    c.igual(e.th0.color, 'rgb(4, 5, 6)', tema + ' th (menor especificidad que la regla base)');
    c.igual(e.td00.color, 'rgb(1, 2, 3)', tema + ' tr td');
    c.igual(e.trSel['background-color'], 'rgb(7, 8, 9)', tema + ' fila seleccionada');
    c.igual(e.thead['background-color'], 'rgb(10, 11, 12)', tema + ' thead');
    c.igual(await cs(c, "td[data-cell='Nombre']", 'background-color'), 'rgb(13, 14, 15)', tema + ' data-cell');
    c.igual(await c.ev(() => getComputedStyle(__ct.sr('t1').querySelector('div')).overflow), 'visible', tema + ' div:has(table#id)');
  }
});

// ---------- contraste ----------
t('18', 'contraste AA (≥ 4.5) de texto/fondo calculado en los cuatro temas: celdas, alternas, hover, encabezado, selección, editor, negativos, pie, grupos, menú, badges, marcas, errores', ['§T-contraste'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => {
    const lum = (hex) => { const h = hex.replace('#', ''); const v = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const pares = [['fg', 'bg'], ['fg', 'row-alt-bg'], ['fg', 'hover-bg'], ['header-fg', 'header-bg'], ['sel-fg', 'sel-bg'], ['active-fg', 'active-bg'], ['input-fg', 'input-bg'],
      ['neg-fg', 'bg'], ['neg-fg', 'row-alt-bg'], ['muted-fg', 'bg'], ['muted-fg', 'panel-bg'], ['footer-fg', 'footer-bg'], ['fg', 'group-bg'], ['menu-fg', 'menu-bg'], ['tooltip-fg', 'tooltip-bg'],
      ['badge-color', 'badge-bg'], ['mark-fg', 'mark-bg'], ['error', 'bg'], ['error', 'error-bg'], ['warn', 'bg'], ['ok', 'bg'], ['accent', 'bg'], ['fg', 'checked-bg']];
    const out = [];
    for (const [n, T] of Object.entries(EditTable.themes)) for (const [a, b] of pares) out.push([n, a, b, Math.round(cr(T[a], T[b]) * 100) / 100]);
    return out;
  });
  const malos = r.filter(x => ['claro', 'oscuro', 'jade', 'libro-mayor'].includes(x[0]) && x[3] < 4.5);
  c.igual(malos, [], 'pares bajo 4.5');
  c.nota(r.filter(x => x[0] === 'oscuro').map(x => `${x[1]}/${x[2]} ${x[3]}`).join(', '));
});
t('19', 'contraste no textual (≥ 3): contorno de la celda activa contra la fila y el anillo de foco contra el fondo', ['§T-contraste'], async (c) => {
  await c.abrir(pag());
  const r = await c.ev(() => {
    const lum = (hex) => { const h = hex.replace('#', ''); const v = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const out = [];
    for (const n of ['claro', 'oscuro', 'jade', 'libro-mayor']) { const T = EditTable.themes[n]; out.push([n, 'active-cell/active-bg', cr(T['active-cell'], T['active-bg'])], [n, 'focus-ring/bg', cr(T['focus-ring'], T.bg)]); }
    return out.filter(x => x[2] < 3);
  });
  c.igual(r, []);
});

// ---------- extras con tema ----------
t('20', 'striped: con tema, filas pares alternas (sin contar grupos ni ocultas); striped="false" las quita; sin tema striped="true" las pone', ['§T-striped'], async (c) => {
  await c.abrir(pag({ theme: 'claro' }));
  const T = (await temas(c)).claro;
  const fondos = () => c.ev(() => __ct.filas('t1').map(tr => getComputedStyle(tr).backgroundColor));
  let f = await fondos();
  c.igual([f[0], f[1], f[2], f[3]], ['rgba(0, 0, 0, 0)', rgb(T['row-alt-bg']), 'rgba(0, 0, 0, 0)', rgb(T['row-alt-bg'])]);
  await c.ev(() => __ct.t('t1').setAttribute('striped', 'false'));
  c.igual(new Set(await fondos()).size, 1, 'sin rayas');
  await c.abrir(pag({ striped: 'true' }));
  f = await fondos();
  c.distinto(f[1], f[0], 'sin tema con striped="true"');
  c.igual(await cs(c, 'thead', 'background-color'), 'rgb(245, 245, 245)', 'lo demás sin cambio');
  // con grupos, la alternancia cuenta solo filas de datos
  await c.abrir(pag({ ...RICA, theme: 'claro' }, { cols: COLS_RICA }));
  await c.ev(() => __ct.t('t1').GroupBy(['linea']));
  const g = await c.ev(() => __ct.filas('t1').filter(tr => !tr.classList.contains('et-group-row')).slice(0, 4).map(tr => getComputedStyle(tr).backgroundColor));
  c.igual(g[0] !== g[1] && g[0] === g[2], true, 'alterna entre filas de datos');
});
t('21', 'density compacta/normal/comoda cambia el relleno también sin tema; normal = actual', ['§T-density'], async (c) => {
  await c.abrir(pag());
  const pad = () => c.ev(() => { const td = __ct.td('t1', 0, 0), th = __ct.th('t1', 0); return [getComputedStyle(td).paddingTop, getComputedStyle(td).paddingLeft, getComputedStyle(th).paddingTop]; });
  const normal = await pad();
  c.igual(normal, ['4px', '4px', '4px']);
  await c.ev(() => __ct.t('t1').setAttribute('density', 'compacta'));
  c.igual(await pad(), ['1px', '4px', '2px']);
  await c.ev(() => { __ct.t('t1').Density = 'comoda'; });
  c.igual(await pad(), ['8px', '10px', '8px']);
  c.igual(await c.ev(() => __ct.t('t1').Density), 'comoda');
  await c.ev(() => { __ct.t('t1').Density = 'normal'; });
  c.igual(await pad(), normal);
  c.igual(await c.ev(() => __ct.sr('t1').querySelector('style[data-et="f8b"]')), null, 'normal y sin tema: nada');
});
t('22', 'theme="auto" sigue prefers-color-scheme', ['§T-theme'], async (c) => {
  for (const [esquema, n] of [['dark', 'oscuro'], ['light', 'claro']]) {
    await c.abrir({ ...pag({ theme: 'auto' }), contexto: { colorScheme: esquema } });
    c.igual(await cs(c, 'thead', 'background-color'), rgb((await temas(c))[n]['header-bg']), esquema);
  }
});
t('23', 'columnas numéricas con tema: et-num, alineadas a la derecha, tabular-nums; negativos con neg-fg (salvo en la fila seleccionada); textalign explícito gana', ['§T-numeros'], async (c) => {
  await c.abrir(pag({ theme: 'jade' }, { cols: [...COLS.slice(0, 3), { ...COLS[3], textalign: 'start' }] }));
  const T = (await temas(c)).jade;
  const r = await c.ev(() => { const td = __ct.td('t1', 2, 2), cc = td.querySelector('.cell-content'), th = __ct.th('t1', 2); return [td.className, getComputedStyle(cc).justifyContent, getComputedStyle(td).fontVariantNumeric, getComputedStyle(td).color, getComputedStyle(th).textAlign, __ct.td('t1', 2, 1).className]; });
  c.igual(r, ['EdiTable-Cell et-num et-neg', 'flex-end', 'tabular-nums', rgb(T['neg-fg']), 'right', 'EdiTable-Cell']);
  c.igual(await c.ev(() => getComputedStyle(__ct.td('t1', 0, 3).querySelector('.cell-content')).justifyContent), 'start', 'textalign de la columna');
  await seleccionar(c, 2, 3); await seleccionar(c, 0, 3);   // dejar una celda con formato repinta con su HTML
  c.igual(await c.ev(() => [__ct.td('t1', 2, 2).className, __ct.td('t1', 2, 3).className]), ['EdiTable-Cell et-num et-neg', 'EdiTable-Cell et-num'], 'al dejar la celda');
  await c.ev(() => { const t = __ct.t('t1'); t.DataArray[1].precio = -5; t.UpdateRow(1); });
  await seleccionar(c, 1, 3); await seleccionar(c, 0, 1);
  c.igual(await c.ev(() => __ct.td('t1', 1, 3).classList.contains('et-neg')), true, 'negativo con formato ($-5.00) al dejar la celda');
  await editar(c, 't1', 0, 2, '-7');
  c.igual(await c.ev(() => __ct.td('t1', 0, 2).classList.contains('et-neg')), true, 'al editar');
  await seleccionar(c, 2, 0);
  c.igual(await c.ev(() => getComputedStyle(__ct.td('t1', 2, 2)).color), rgb(T['sel-fg']), 'en la fila seleccionada');
});
t('24', 'celda activa con contorno active-cell, distinta de la fila seleccionada (las demás celdas conservan el borde)', ['§T-activa'], async (c) => {
  await c.abrir(pag({ theme: 'claro' }));
  const T = (await temas(c)).claro;
  await seleccionar(c, 1, 1);
  const r = await c.ev(() => [getComputedStyle(__ct.td('t1', 1, 1)).outlineColor, getComputedStyle(__ct.td('t1', 1, 1)).outlineWidth, getComputedStyle(__ct.td('t1', 1, 2)).outlineColor]);
  c.igual(r, [rgb(T['active-cell']), '2px', rgb(T.border)]);
  await editar(c, 't1', 1, 1, 'x', { confirmar: null });
  c.igual(await c.ev(() => getComputedStyle(__ct.td('t1', 1, 1)).outlineColor), rgb(T['active-cell']), 'con el editor abierto');
});
t('25', 'foco visible con teclado (:focus-visible) en casillas y botones del componente', ['§T-foco'], async (c) => {
  await c.abrir(pag({ theme: 'claro', 'multi-select': 'checkbox' }, { antesTabla: '<button id="antes">antes</button>' }));
  const T = (await temas(c)).claro;
  // Tab desde fuera no entra (el componente maneja Tab en el documento): foco de teclado programático
  const r = await c.ev(() => { const a = __ct.sr('t1').querySelector('thead th.et-sel-col input'); a.focus({ focusVisible: true }); return [a.matches(':focus-visible'), getComputedStyle(a).outlineColor, getComputedStyle(a).outlineStyle]; });
  c.ok(r[0], 'la casilla tiene :focus-visible');
  c.igual(r.slice(1), [rgb(T['focus-ring']), 'solid']);
});
t('26', 'impresión: un tema oscuro se imprime con los colores del claro; jade y libro-mayor conservan los suyos', ['§T-impresion'], async (c) => {
  await c.abrir(pag({ theme: 'oscuro' }));
  const T = await temas(c);
  await c.page.emulateMedia({ media: 'print' });
  c.igual([await cs(c, 'table', 'background-color'), await cs(c, 'thead', 'background-color')], [rgb(T.claro.bg), rgb(T.claro['header-bg'])]);
  c.igual(await c.ev(() => getComputedStyle(__ct.t('t1')).colorScheme), 'light');
  await c.ev(() => { __ct.t('t1').Theme = 'libro-mayor'; });
  c.igual(await cs(c, 'thead', 'background-color'), rgb(T['libro-mayor']['header-bg']));
});
t('27', 'tarjetas y virtual-rows con tema: borde de tarjeta y rellenos virtuales transparentes', ['§T-partes'], async (c) => {
  await c.abrir(pag({ theme: 'jade', 'cards-mode': 'always' }));
  const T = (await temas(c)).jade;
  c.igual(await cs(c, 'tbody > tr', 'outline-color'), rgb(T['card-border']));
  await c.abrir(pag({ theme: 'oscuro', 'virtual-rows': 'true' }, { data: Array.from({ length: 400 }, (_, i) => ({ codigo: 'P' + i, nombre: 'N' + i, cantidad: i, precio: i })), despues: '' }));
  const r = await c.ev(() => { const sp = __ct.sr('t1').querySelector('tr.et-spacer'); return sp ? getComputedStyle(sp).backgroundColor : 'sin relleno'; });
  c.igual(r, 'rgba(0, 0, 0, 0)');
}, { requiere: ['virtual'] });

export default { nombre: 'v2-temas', grupo: 'v2', pruebas: P };
