/*!
 * InduxsoftExcel 1.0.0 (c) Induxsoft. XLSX y CSV en el navegador, sin dependencias; no depende de EdiTable.
 * fromArray | fromTable | fromEditTable | fromData (forma base) -> Blob; *Async -> Promise<Blob> (DEFLATE);
 * workbook([{name, source, opts}]), download(fuente|blob, nombre, opts), toCSV(fuente, opts). Ver readme.md.
 */
(function (root) {
  'use strict';
  const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const NS = 'http://schemas.openxmlformats.org/';
  const MAIN = `xmlns="${NS}spreadsheetml/2006/main"`, REL = `xmlns:r="${NS}officeDocument/2006/relationships"`;
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const YES = ['sí', 'si', 's', 'y', 'yes', 'ok', '1', 't', 'on', 'true', 'cierto', 'verdadero'];
  const enc = new TextEncoder();
  const low = v => String(v ?? '').toLowerCase();
  const on = v => v === true || low(v) === 'true';
  const has = v => v !== undefined && v !== null && v !== '';
  const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  const NOPRINT = /(^|\s)(no-print|hide-on-print)(\s|$)/;
  const isET = t => !!t && Array.isArray(t.DataArray) && Array.isArray(t.Columns);
  const isTable = t => !!t && typeof t === 'object' && low(t.tagName) === 'table';

  // XML 1.0: quita caracteres inválidos, escapa &<>" y protege "_xHHHH_".
  const esc = s => String(s)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '$1')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/_(x[0-9A-Fa-f]{4}_)/g, '_x005F_$1');
  const colName = i => { let s = ''; for (i++; i > 0; i = (i - 1) / 26 | 0) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; };

  // Nombre de hoja válido: máx. 31 caracteres, sin []:*?/\ ni apóstrofo al inicio o al final.
  function sheetName(n, def) {
    const s = String(n ?? '').replace(/[[\]:*?/\\\x00-\x1F]/g, '_').replace(/^'+|'+$/g, '').trim().slice(0, 31).replace(/'+$/, '');
    return !s || low(s) === 'history' ? def || 'Hoja1' : s;
  }

  // Serial de Excel (días desde 1899-12-30, hora local) desde Date o ISO 8601.
  const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?/;
  function serial(v) {
    let p;
    if (v instanceof Date) p = isNaN(v) ? 0 : [v.getFullYear(), v.getMonth() + 1, v.getDate(), v.getHours(), v.getMinutes(), v.getSeconds(), v.getMilliseconds()];
    else if ((p = ISO.exec(String(v).trim()))) p = p.slice(1).map(x => +(x || 0));
    if (!p || p[1] > 12 || p[2] > 31) return null;
    const t = Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4], p[5], p[6] || 0);
    return isNaN(t) ? null : t / 864e5 + 25569;
  }
  const hasTime = v => v instanceof Date ? !!(v.getHours() || v.getMinutes() || v.getSeconds()) : /\d[T ]\d/.test(v);

  // Número de una celda; si llega como texto con formato ("$ 1,234.50 MXN"), lo limpia.
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (typeof v === 'boolean' || !/\d/.test(v = String(v).trim())) return null;
    let n = Number(v);
    if (isNaN(n)) n = Number(v.replace(/[^0-9.\-eE]+/g, '').replace(/^[eE]+|[eE]+$/g, ''));
    return isFinite(n) ? n : null;
  }
  const bool = v => typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 : YES.includes(low(v).trim());

  // numFmt de Excel desde format/decs/thousandssep/prefix/sufix ("$ "#,##0.00" MXN"); numFmt o un format distinto de true/false/relative van tal cual.
  const quote = s => s ? `"${String(s).replace(/"/g, '')}"` : '';
  function numFmt(c) {
    const f = c.format;
    if (c.numFmt) return c.numFmt;
    if (typeof f === 'string' && f && !['true', 'false', 'relative'].includes(low(f))) return f;
    if (!(on(f) || (f === undefined && (has(c.decs) || has(c.prefix) || has(c.sufix) || on(c.thousandssep))))) return null;
    const d = Math.max(0, Math.min(30, parseInt(c.decs, 10) || 0));
    return quote(c.prefix) + (on(c.thousandssep) ? '#,##0' : '0') + (d ? '.' + '0'.repeat(d) : '') + quote(c.sufix);
  }

  // Locale (R7, revisado 2026-11-01): opts.locale | decimal/thousands/dateOrder > lang con región del elemento o
  // sus ancestros > lang con región del documento > (al leer texto) inferencia por columna > es-MX.
  // navigator.language solo con locale:'auto'. Separadores y orden de fecha salen de Intl (1234567.5: es-ES no agrupa 4 cifras).
  const region = t => !!t && String(t).split(/[-_]/).some((x, i) => i && /^([A-Za-z]{2}|\d{3})$/.test(x));
  function loc(o, el) {
    let L = o.locale === 'auto' ? (typeof navigator !== 'undefined' && navigator.language) : o.locale || (el && el.Locale);
    const decl = !!(L || o.decimal || o.thousands || o.dateOrder);
    for (let e = el && el.closest ? el.closest('[lang]') : null; !L && e; e = e.parentElement && e.parentElement.closest('[lang]')) if (region(e.getAttribute('lang'))) L = e.getAttribute('lang');
    if (!L && typeof document !== 'undefined' && region(document.documentElement.lang)) L = document.documentElement.lang;
    const declared = decl || !!L;
    L = L || 'es-MX';
    let p, d;
    try { p = new Intl.NumberFormat(L).formatToParts(1234567.5); d = new Intl.DateTimeFormat(L).formatToParts(new Date(2026, 10, 25)); }
    catch (_) { return Object.assign(loc(Object.assign({}, o, { locale: 'es-MX' })), { declared }); }
    const part = t => (p.find(x => x.type === t) || {}).value;
    const dec = o.decimal || part('decimal') || '.', th = o.thousands || part('group') || (dec === ',' ? '.' : ',');
    const ord = o.dateOrder || d.filter(x => /^(day|month|year)$/.test(x.type)).map(x => x.type[0].toUpperCase()).join('');
    return seps({ L, ord, declared }, dec, th);
  }
  function seps(L, dec, th) {
    const e = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), g = /\s/.test(th) ? '\\s' : e(th);
    return Object.assign({}, L, { dec, th, re: new RegExp(`^([-+]?)\\s*([$€£]?)\\s*([-+]?)(\\d{1,3}(?:${g}\\d{3})+|\\d+)(?:${e(dec)}(\\d+))?(\\s*)(%|[$€£]|[A-Z]{3})?$`) });
  }
  // Inferencia por contenido (solo si el locale no se declaró): un valor con los dos separadores fija el decimal (el último);
  // si no, "1,234,567" (separador, 3 dígitos, el mismo separador) fija el de miles. Si nada resuelve, queda es-MX.
  function inferSeps(texts, L) {
    if (L.declared) return L;
    let dec;
    for (const t of texts) { const a = t.lastIndexOf('.'), b = t.lastIndexOf(','); if (a >= 0 && b >= 0) { dec = a > b ? '.' : ','; break; } }
    if (!dec) for (const t of texts) { const m = /\d([.,])\d{3}\1\d{3}(?!\d)/.exec(t); if (m) { dec = m[1] === '.' ? ',' : '.'; break; } }
    return dec ? seps(L, dec, dec === '.' ? ',' : '.') : L;
  }
  const numText = v => typeof v === 'string' && /\d/.test(v) && /^[-+$€£%\s\d.,A-Z]+$/.test(v.trim()) && !ISO.test(v) && !dparts(v);

  // Texto con número del locale ("$1,234.56", "1.234,56 €", "12,5 %") -> [valor, numFmt]; "00123" sigue siendo texto.
  function locNum(s, L) {
    const m = L.re.exec(String(s).trim().replace(/[  ]/g, ' '));
    if (!m || (!m[2] && !m[7] && !m[5] && /^0\d/.test(m[4]))) return null;
    const n = Number(m[4].replace(/\D/g, '') + '.' + (m[5] || 0)) * (m[1] === '-' || m[3] === '-' ? -1 : 1);
    const d = (m[5] || '').length, th = /\D/.test(m[4]), z = (th ? '#,##0' : '0') + (d ? '.' + '0'.repeat(d) : '');
    if (m[7] === '%') return [n / 100, z + '%'];
    return [n, m[2] || m[7] || th || d ? quote(m[2]) + z + quote(m[7] && m[6] + m[7]) : null];
  }

  // Fecha en texto d/m/y, m/d/y o y/m/d (separador / . -). El orden lo fija la columna (dateOrder).
  const DT = /^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const dparts = s => { const m = DT.exec(String(s).trim()); return m && (m[1].length === 4 || m[3].length === 4) ? m : null; };
  // Orden de una columna: una fecha con día > 12 lo fija; si ninguna lo resuelve, decide el locale.
  const colOrder = (list, ord) => list.some(m => m[1].length < 4 && +m[1] > 12) ? 'DMY' : list.some(m => m[1].length < 4 && +m[2] > 12) ? 'MDY' : ord;
  function toDate(m, ord) {
    const p = m.slice(1).map(x => +(x || 0));
    const [y, mo, d] = m[1].length === 4 ? p : ord === 'MDY' ? [p[2], p[0], p[1]] : [p[2], p[1], p[0]];
    const r = new Date(y, mo - 1, d, p[3], p[4], p[5]);
    return mo > 12 || r.getDate() !== d ? null : r;
  }

  // Ancho en caracteres desde CSS ("120px", "10rem", "15ch"); un número ya son caracteres.
  function width(w) {
    if (typeof w === 'number') return w;
    const m = /^\s*([\d.]+)\s*(px|rem|em|ch)?\s*$/.exec(String(w ?? ''));
    return !m ? 0 : m[2] === 'ch' ? +m[1] : !m[2] || m[2] === 'px' ? m[1] / 7 : m[1] * 16 / 7;
  }

  // Celda con tipo propio (fromTable). k: n número, d fecha, t fecha-hora, b booleano, s texto; nw: no cuenta para el ancho.
  function XC(v, k, code, nw) { this.v = v; this.k = k; this.code = code; this.nw = nw; }

  // Valor de un campo: función value(row), ruta con punto ("cliente.nombre") y texto de options.
  function val(c, r, o) {
    if (r == null) return;
    let v = typeof c.value === 'function' ? c.value(r) : own(r, c.field) ? r[c.field]
      : typeof c.field === 'string' && c.field.includes('.') ? c.field.split('.').reduce((x, k) => x == null ? x : x[k], r) : r[c.field];
    if (!o.raw && c.options && typeof c.options === 'object' && own(c.options, v)) v = c.options[v];
    return v;
  }

  // ---------- fuentes -> hoja {cols, head, body, foot, merges} ----------
  // Forma base: {columns, rows, summary}.
  function fieldsSheet(data, o) {
    const cols = (data.columns || []).map(c => typeof c === 'string' ? { field: c } : c).filter(c => c && (o.includeHidden || !c.hidden));
    const sum = o.includeSummary !== false && data.summary && Object.keys(data.summary).length ? data.summary : null;
    return {
      cols,
      head: [cols.map(c => c.title ?? c.field ?? '')],
      body: (data.rows || []).map(r => cols.map(c => val(c, r, o))),
      foot: sum ? [cols.map((c, i) => { const v = sum[c.field]; return i || has(v) ? v : o.summaryLabel ?? 'Total'; })] : [],
      merges: []
    };
  }

  // Arreglo: columnas por llaves en orden de aparición (todas las filas), tipo por sus valores.
  function arraySheet(rows, o) {
    const L = loc(o);
    let cols = o.columns;
    if (!cols) {
      const seen = new Set();
      for (const r of rows) if (r && typeof r === 'object') for (const k of Object.keys(r)) seen.add(k);
      cols = [...seen];
    }
    cols = cols.map(c => typeof c === 'string' ? { field: c } : Object.assign({}, c));
    for (const c of cols) c._loc = inferSeps(rows.map(r => val(c, r, o)).filter(numText), L);
    for (const c of cols) {
      if (c.type) continue;
      const L = c._loc;
      let k = '', t = false;
      for (const r of rows) {
        const v = val(c, r, o);
        if (!has(v)) continue;
        const kv = typeof v === 'number' || (typeof v === 'string' && locNum(v, L)) ? 'n' : typeof v === 'boolean' ? 'b'
          : (v instanceof Date || (typeof v === 'string' && ISO.test(v))) && serial(v) !== null || dparts(v) ? 'd' : 's';
        if (kv === 'd' && (hasTime(v) || (typeof v === 'string' && /\d[T ,]+\d/.test(v)))) t = true;
        if (k && k !== kv) { k = 's'; break; }
        k = kv;
      }
      c.type = k === 'n' ? 'Number' : k === 'b' ? 'Check' : k === 'd' ? (t ? 'DateTime' : 'Date') : 'Text';
    }
    const S = fieldsSheet({ columns: cols, rows, summary: o.summary }, o);
    // Texto de números y fechas según el locale (los números y Date ya vienen como valores).
    S.cols.forEach((c, i) => {
      const t = low(c.type);
      if (t === 'number') S.body.forEach(r => { const m = typeof r[i] === 'string' && locNum(r[i], c._loc); if (m) r[i] = m[0]; });
      if (t === 'date' || t === 'datetime') {
        const ms = S.body.map(r => typeof r[i] === 'string' && !ISO.test(r[i]) && dparts(r[i]));
        const ord = colOrder(ms.filter(Boolean), L.ord);
        ms.forEach((m, j) => { if (m) S.body[j][i] = toDate(m, ord) ?? S.body[j][i]; });
      }
    });
    return S;
  }

  // edit-table v2: getExportData(opts); v1: Columns, hideColumns y DataArray, sin no-print/hide-on-print.
  function etData(t, o) {
    if (typeof t.getExportData === 'function') return t.getExportData(o);
    const hid = t.hideColumns || [], cols = [], src = [];
    t.Columns.forEach((c, i) => {
      if (!c || c.field === undefined || low(c.type) === 'badges' || NOPRINT.test(c.class || '')) return;
      const h = hid.includes(i), x = {};
      if (h && !o.includeHidden) return;
      for (const k of ['field', 'title', 'type', 'format', 'width', 'decs', 'prefix', 'sufix', 'thousandssep']) if (c[k] !== undefined) x[k] = c[k];
      x.title = String(x.title ?? x.field).trim();
      if (h) x.hidden = true;
      cols.push(x); src.push(c);
    });
    let data = t.DataArray;
    if (o.selectedOnly) {
      const sel = typeof t.getSelectedRows === 'function' ? t.getSelectedRows() : [typeof t.CurrentRowIndex === 'function' ? t.CurrentRowIndex() : -1];
      data = sel.filter(i => i >= 0 && i < data.length).map(i => data[i]);
    }
    // Select: con keyfield, field = texto y keyfield = llave; sin keyfield, field = llave de options.
    const rows = data.map(r => {
      const x = {};
      cols.forEach((c, j) => {
        const s = src[j];
        let v = r ? r[c.field] : undefined;
        if (r && low(s.type) === 'select' && s.options) {
          if (s.keyfield !== undefined) { if (o.raw) v = r[s.keyfield]; }
          else if (!o.raw && own(s.options, v)) v = s.options[v];
        }
        x[c.field] = v;
      });
      return x;
    });
    return { columns: cols, rows, summary: null };
  }

  // <table> HTML: thead (encabezado), tbody, tfoot (totales); colspan/rowspan como celdas combinadas.
  function tableSheet(tb, o) {
    const hidden = el => !o.includeHidden && !!el && (el.hidden || NOPRINT.test(typeof el.className === 'string' ? el.className : '')
      || (el.isConnected && typeof getComputedStyle === 'function' && getComputedStyle(el).display === 'none'));
    let head = tb.tHead ? [...tb.tHead.rows] : [];
    let body = [].concat(...[...tb.tBodies].map(b => [...b.rows]));
    const foot = tb.tFoot ? [...tb.tFoot.rows] : [];
    if (!head.length && body.length && [...body[0].cells].every(c => c.tagName === 'TH')) head = [body.shift()];
    // g[r][c] = {el, r, c, rs, cs}; rowspan no cruza secciones.
    const g = [], trs = [], sec = [];
    let n = 0;
    [head, body, foot].forEach((rows, s) => {
      const base = g.length;
      rows.forEach((tr, i) => {
        const r = base + i;
        g[r] = g[r] || []; trs[r] = tr; sec[r] = s;
        let c = 0;
        for (const el of tr.cells) {
          while (g[r][c]) c++;
          const cs = Math.max(1, el.colSpan || 1), rs = Math.min(el.rowSpan || rows.length - i, rows.length - i), x = { el, r, c, rs, cs };
          for (let a = 0; a < rs; a++) for (let b = 0; b < cs; b++) (g[r + a] = g[r + a] || [])[c + b] = x;
          c += cs;
          if (c > n) n = c;
        }
      });
    });
    const H = head.length, lastHead = g[H - 1] || [];
    const colHidden = [], colType = [], colFmt = [];
    for (let c = 0; c < n; c++) {
      const singles = g.map(row => row[c]).filter(x => x && x.cs === 1);
      const h = lastHead[c];
      colHidden[c] = (h && h.cs === 1 && hidden(h.el)) || (singles.length > 0 && singles.every(x => hidden(x.el)));
      for (let r = H - 1; r >= 0; r--) {
        const x = g[r][c];
        if (x && x.cs === 1) { colType[c] = colType[c] || x.el.getAttribute('data-type'); colFmt[c] = colFmt[c] || x.el.getAttribute('data-format'); }
      }
    }
    const rmap = [], cmap = [];
    let nr = [0, 0, 0], nc = 0;
    g.forEach((_, r) => { rmap[r] = hidden(trs[r]) ? -1 : nr[sec[r]]++; });
    for (let c = 0; c < n; c++) cmap[c] = colHidden[c] ? -1 : nc++;
    const out = [[], [], []], merges = [], pend = [], L = loc(o, tb);
    for (let s = 0; s < 3; s++) for (let i = 0; i < nr[s]; i++) out[s].push(new Array(nc).fill(undefined));
    const done = new Set(), off = [0, nr[0], nr[0] + nr[1]], txts = new Map(), byCol = [];
    const text = el => { if (!txts.has(el)) txts.set(el, (el.innerText ?? el.textContent ?? '').trim()); return txts.get(el); };
    g.forEach((row, r) => sec[r] && rmap[r] >= 0 && row.forEach(x => { if (x && x.r === r && !hidden(x.el) && x.el.getAttribute('data-value') == null) (byCol[x.c] = byCol[x.c] || []).push(text(x.el)); }));
    const colL = byCol.map(t => inferSeps((t || []).filter(numText), L));
    g.forEach(row => row.forEach(x => {
      if (!x || done.has(x)) return;
      done.add(x);
      if (hidden(x.el)) return;
      const rr = [], cc = [];
      for (let a = 0; a < x.rs; a++) if (rmap[x.r + a] >= 0) rr.push(rmap[x.r + a]);
      for (let b = 0; b < x.cs; b++) if (cmap[x.c + b] >= 0) cc.push(cmap[x.c + b]);
      if (!rr.length || !cc.length) return;
      const s = sec[x.r], el = x.el, txt = text(el);
      const dv = el.getAttribute('data-value'), raw = dv ?? txt;
      const t = low(el.getAttribute('data-type') || colType[x.c]), f = el.getAttribute('data-format') || colFmt[x.c];
      // data-value e ISO 8601 se aceptan siempre; el texto visible se lee con el locale.
      const m = locNum(txt, colL[x.c] || L), iso = x => x != null && ISO.test(x) && serial(x) !== null, dk = x => t !== 'datetime' && !hasTime(x) ? 'd' : 't';
      const dn = dv != null && /^\s*-?\d+(\.\d+)?([eE][-+]?\d+)?\s*$/.test(dv) ? +dv : null;
      let v, dp;
      if (s === 0 || t === 'text' || t === 'string') v = new XC(raw, 's');
      else if (t === 'number') v = new XC(dv != null ? num(dv) : m && m[0], 'n', f || (m && m[1]));
      else if (t === 'bool' || t === 'boolean' || t === 'check') v = new XC(raw, 'b');
      else if (iso(dv) || (dv == null && iso(txt))) v = new XC(raw, dk(raw), f);
      else if (t !== 'date' && t !== 'datetime' && (m || dn !== null)) v = new XC(dn ?? m[0], 'n', f || (m && m[1]));
      else if (dv == null && (dp = dparts(txt))) { v = new XC(dp, t === 'datetime' || dp[4] ? 't' : 'd', f); v.pd = { c: cc[0], txt }; pend.push(v); }
      else v = new XC(raw, 's');
      if (v.k === 'n' && v.v == null) v = new XC(raw, 's');
      v.nw = cc.length > 1;
      out[s][rr[0]][cc[0]] = v;
      if (rr.length > 1 || cc.length > 1) merges.push([off[s] + rr[0], cc[0], off[s] + rr[rr.length - 1], cc[cc.length - 1]]);
    }));
    // Fechas en texto: el orden se resuelve por columna (R7).
    for (let c = 0; c < nc; c++) {
      const ps = pend.filter(v => v.pd.c === c), ord = colOrder(ps.map(v => v.v), L.ord);
      ps.forEach(v => { const d = toDate(v.v, ord); if (d) v.v = d; else { v.v = v.pd.txt; v.k = 's'; } });
    }
    return { cols: new Array(nc).fill(0).map(() => ({})), head: out[0], body: out[1], foot: out[2], merges, loc: L };
  }

  // Cualquier fuente -> hoja. Nombre por omisión: opts.sheetName, export-name o id del elemento, caption.
  function toSheet(src, o) {
    if (typeof src === 'string' && typeof document !== 'undefined') src = document.querySelector(src);
    if (!src) throw new Error('InduxsoftExcel: fuente no encontrada');
    const el = src.getAttribute ? src : null;
    const name = o.sheetName ?? (el && (el.getAttribute('export-name') || el.id || (src.caption && src.caption.textContent.trim())));
    let S;
    if (isET(src)) S = fieldsSheet(etData(src, o), o);
    else if (isTable(src)) S = tableSheet(src, o);
    else if (Array.isArray(src)) S = arraySheet(src, o);
    else if (!src.columns && Array.isArray(src.rows)) S = arraySheet(src.rows, Object.assign({ summary: src.summary }, o));
    else S = fieldsSheet(src, o);
    S.name = name;
    S.loc = S.loc || loc(o, el);
    return S;
  }

  // ---------- SpreadsheetML ----------
  function build(sheets) {
    // Estilos: 0 normal, 1 negritas; el resto por (numFmt, negritas). Los numFmt propios empiezan en 164.
    const fmts = [], xfs = ['0|0', '0|1'], xfIdx = { '0|0': 0, '0|1': 1 };
    const style = (code, b) => {
      let f = 0;
      if (code) { f = fmts.indexOf(code); if (f < 0) f = fmts.push(code) - 1; f += 164; }
      const k = f + '|' + (b ? 1 : 0);
      return xfIdx[k] ?? (xfIdx[k] = xfs.push(k) - 1);
    };
    // sharedStrings: cada texto distinto una vez por libro (menos bytes que inlineStr).
    const ss = [], ssIdx = new Map();
    let ssCount = 0;
    const str = s => {
      ssCount++;
      s = String(s).slice(0, 32767);
      let i = ssIdx.get(s);
      if (i === undefined) ssIdx.set(s, i = ss.push(s) - 1);
      return i;
    };
    const names = [], defs = [];

    const xmls = sheets.map(({ S, o }, si) => {
      const boolCells = o.raw || o.booleans === 'bool', yes = o.trueText ?? 'Sí', no = o.falseText ?? 'No';
      const dateF = o.dateFormat || 'dd/mm/yyyy', dtF = o.dateTimeFormat || 'dd/mm/yyyy hh:mm';
      const base = sheetName(S.name, 'Hoja' + (si + 1));
      let name = base;
      for (let i = 2; names.some(x => low(x) === low(name)); i++) name = base.slice(0, 28 - String(i).length) + ` (${i})`;
      names.push(name);
      const meta = S.cols.map((c, i) => {
        const t = low(c.type);
        const k = t === 'number' || (t === 'noeditable' && on(c.format)) ? 'n' : t === 'date' ? 'd' : t === 'datetime' ? 't' : t === 'check' ? 'b' : '';
        const code = k === 'n' ? numFmt(c) : c.numFmt || (k === 'd' ? dateF : k === 't' ? dtF : null);
        return { c, k, code, L: colName(i), w: 0, x: String(c.prefix ?? '').length + String(c.sufix ?? '').length };
      });

      // XML de una celda; actualiza el ancho estimado de la columna.
      function cell(m, ref, v, b, noBool, extra) {
        let k = m.k, code = m.code, nw;
        if (v instanceof XC) { k = v.k === 's' ? '' : v.k; code = v.code || (k === 'd' ? dateF : k === 't' ? dtF : null); nw = v.nw; v = v.v; }
        if (!has(v)) return '';
        let n, len, st = style(code, b);
        if (k === 'n' && (n = num(v)) !== null) len = String(Math.round(Math.abs(n))).length * (code && code.includes(',') ? 4 / 3 : 1) + (code ? (code.split('.')[1] || '').replace(/[^0]/g, '').length : 0) + 2 + m.x;
        else if ((k === 'd' || k === 't' || v instanceof Date) && (n = serial(v)) !== null) { len = k === 'd' ? 11 : 17; if (!k) st = style(dtF, b); }
        else if (typeof v === 'number' && isFinite(v)) { n = v; len = String(v).length + 1; }
        else {
          if ((k === 'b' && !noBool) || typeof v === 'boolean') {
            if (boolCells) return `<c r="${ref}" t="b"${b ? ' s="1"' : ''}><v>${bool(v) ? 1 : 0}</v></c>`;
            v = bool(v) ? yes : no;
          }
          v = typeof v === 'object' ? JSON.stringify(v) : String(v);
          len = Math.max(...v.split('\n').map(l => l.length)) + 1 + (extra || 0);
          if (!nw && len > m.w) m.w = len;
          return `<c r="${ref}" t="s"${b ? ' s="1"' : ''}><v>${str(v)}</v></c>`;
        }
        if (!nw && len > m.w) m.w = len;
        return `<c r="${ref}"${st ? ` s="${st}"` : ''}><v>${n}</v></c>`;
      }

      const out = [], H = S.head.length;
      let r = 0;
      const row = (cells, f) => { r++; let x = `<row r="${r}">`; cells.forEach((v, i) => meta[i] && (x += f(meta[i], meta[i].L + r, v))); out.push(x + '</row>'); };
      // Encabezado: siempre texto en negritas; +2 de ancho por el botón del autofiltro.
      for (const h of S.head) row(h, (m, ref, v) => cell(m, ref, v instanceof XC ? new XC(v.v, 's', 0, v.nw) : new XC(v, 's'), 1, 1, 2));
      for (const b of S.body) row(b, (m, ref, v) => cell(m, ref, v, 0));
      const lastData = r;
      for (const f of S.foot) row(f, (m, ref, v) => cell(m, ref, v, 1, 1));

      const last = colName(Math.max(meta.length, 1) - 1), filter = meta.length && H && o.autoFilter !== false;
      if (filter) defs.push(`<definedName name="_xlnm._FilterDatabase" localSheetId="${si}" hidden="1">${esc(`'${name.replace(/'/g, "''")}'`)}!$A$${H}:$${last}$${lastData}</definedName>`);
      const ref = (a, b, c, d) => colName(b) + (a + 1) + ':' + colName(d) + (c + 1);
      return `${XML}<worksheet ${MAIN} ${REL}><dimension ref="A1:${last}${Math.max(r, 1)}"/><sheetViews><sheetView workbookViewId="0"${si ? '' : ' tabSelected="1"'}`
        + (o.freeze === false || !H ? '/>' : `><pane ySplit="${H}" topLeftCell="A${H + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${H + 1}" sqref="A${H + 1}"/></sheetView>`)
        + '</sheetViews><sheetFormatPr defaultRowHeight="15"/>'
        + (meta.length ? '<cols>' + meta.map((m, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.round(Math.min(Math.max(width(m.c.width) || m.w, 6), o.maxWidth || 60) * 100) / 100}" customWidth="1"/>`).join('') + '</cols>' : '')
        + `<sheetData>${out.join('')}</sheetData>` + (filter ? `<autoFilter ref="A${H}:${last}${lastData}"/>` : '')
        + (S.merges.length ? `<mergeCells count="${S.merges.length}">` + S.merges.map(g => `<mergeCell ref="${ref(...g)}"/>`).join('') + '</mergeCells>' : '')
        + '</worksheet>';
    });

    const workbook = `${XML}<workbook ${MAIN} ${REL}><bookViews><workbookView/></bookViews><sheets>` + names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
      + '</sheets>' + (defs.length ? `<definedNames>${defs.join('')}</definedNames>` : '') + '</workbook>';
    const font = b => `<font>${b}<sz val="11"/><name val="Calibri"/><family val="2"/></font>`;
    const styles = `${XML}<styleSheet ${MAIN}>`
      + (fmts.length ? `<numFmts count="${fmts.length}">` + fmts.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${esc(f)}"/>`).join('') + '</numFmts>' : '')
      + `<fonts count="2">${font('')}${font('<b/>')}</fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>`
      + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + `<cellXfs count="${xfs.length}">` + xfs.map(k => { const [f, b] = k.split('|'); return `<xf numFmtId="${f}" fontId="${b}" fillId="0" borderId="0" xfId="0"${+f ? ' applyNumberFormat="1"' : ''}${+b ? ' applyFont="1"' : ''}/>`; }).join('')
      + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    const shared = `${XML}<sst ${MAIN} count="${ssCount}" uniqueCount="${ss.length}">` + ss.map(s => `<si><t${/^\s|\s$|\n/.test(s) ? ' xml:space="preserve"' : ''}>${esc(s)}</t></si>`).join('') + '</sst>';

    const rels = x => `${XML}<Relationships xmlns="${NS}package/2006/relationships">` + x.map(([t, p], i) => `<Relationship Id="rId${i + 1}" Type="${NS}${t}" Target="${p}"/>`).join('') + '</Relationships>';
    const od = 'officeDocument/2006/relationships/', ct = 'application/vnd.openxmlformats-', sm = ct + 'officedocument.spreadsheetml.';
    const ov = (p, t) => `<Override PartName="/${p}" ContentType="${t}+xml"/>`;
    return [
      ['[Content_Types].xml', `${XML}<Types xmlns="${NS}package/2006/content-types"><Default Extension="rels" ContentType="${ct}package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>`
        + ov('xl/workbook.xml', sm + 'sheet.main') + xmls.map((_, i) => ov(`xl/worksheets/sheet${i + 1}.xml`, sm + 'worksheet')).join('') + ov('xl/styles.xml', sm + 'styles')
        + ov('xl/sharedStrings.xml', sm + 'sharedStrings') + '</Types>'],
      ['_rels/.rels', rels([[od + 'officeDocument', 'xl/workbook.xml']])],
      ['xl/workbook.xml', workbook],
      ['xl/_rels/workbook.xml.rels', rels(xmls.map((_, i) => [od + 'worksheet', `worksheets/sheet${i + 1}.xml`]).concat([[od + 'styles', 'styles.xml'], [od + 'sharedStrings', 'sharedStrings.xml']]))],
      ['xl/styles.xml', styles],
      ['xl/sharedStrings.xml', shared]
    ].concat(xmls.map((x, i) => [`xl/worksheets/sheet${i + 1}.xml`, x])).map(([name, s]) => ({ name, data: enc.encode(s) }));
  }

  // ---------- ZIP ----------
  let CRC;
  function crc32(b) {
    if (!CRC) { CRC = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c; } }
    let c = -1;
    for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  }
  // e: {name, data (comprimida o no), crc, size (sin comprimir), method: 0 STORE | 8 DEFLATE}
  function zip(entries) {
    const parts = [], cd = [], d = new Date();
    const time = d.getHours() << 11 | d.getMinutes() << 5 | d.getSeconds() >> 1;
    const date = (d.getFullYear() - 1980) << 9 | (d.getMonth() + 1) << 5 | d.getDate();
    const hdr = (len, f) => { const b = new Uint8Array(len); f(new DataView(b.buffer)); return b; };
    let off = 0, cdSize = 0;
    for (const e of entries) {
      const nm = enc.encode(e.name);
      const put = (v, o) => [20, 0, e.method, time, date].forEach((x, i) => v.setUint16(o + i * 2, x, true)) || [e.crc, e.data.length, e.size].forEach((x, i) => v.setUint32(o + 10 + i * 4, x, true)) || v.setUint16(o + 22, nm.length, true);
      const lh = hdr(30 + nm.length, v => { v.setUint32(0, 0x04034b50, true); put(v, 4); });
      const ch = hdr(46 + nm.length, v => { v.setUint32(0, 0x02014b50, true); v.setUint16(4, 20, true); put(v, 6); v.setUint32(42, off, true); });
      lh.set(nm, 30); ch.set(nm, 46);
      parts.push(lh, e.data); cd.push(ch);
      off += lh.length + e.data.length; cdSize += ch.length;
    }
    const end = hdr(22, v => { v.setUint32(0, 0x06054b50, true); v.setUint16(8, entries.length, true); v.setUint16(10, entries.length, true); v.setUint32(12, cdSize, true); v.setUint32(16, off, true); });
    return new Blob(parts.concat(cd, [end]), { type: MIME });
  }
  const store = f => ({ name: f.name, data: f.data, crc: crc32(f.data), size: f.data.length, method: 0 });
  async function deflate(f) {
    const e = store(f);
    try {
      const z = new Uint8Array(await new Response(new Blob([f.data]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
      if (z.length < f.data.length) { e.data = z; e.method = 8; }
    } catch (_) { /* sin 'deflate-raw': se queda en STORE */ }
    return e;
  }

  // ---------- CSV (RFC 4180) ----------
  function csv(S, o) {
    // Delimitador: ';' si el locale usa coma decimal, ',' si no (R7). Los números llevan el separador decimal del locale, salvo con raw.
    const dec = o.raw ? '.' : S.loc.dec, sep = o.delimiter || o.separator || (S.loc.dec === ',' ? ';' : ','), yes = o.trueText ?? 'Sí', no = o.falseText ?? 'No';
    const ks = S.cols.map(c => { const t = low(c.type); return t === 'number' ? 'n' : t === 'date' ? 'd' : t === 'datetime' ? 't' : t === 'check' ? 'b' : ''; });
    const pad = x => String(x).padStart(2, '0');
    const txt = (v, i, f) => {
      let k = ks[i];
      if (v instanceof XC) { k = v.k; v = v.v; }
      if (!has(v)) return '';
      if (v instanceof Date) v = `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}` + (k === 'd' ? '' : ` ${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`);
      else if ((k === 'n' && num(v) !== null) || typeof v === 'number') v = String(num(v)).replace('.', dec);
      else if ((k === 'b' && !f) || typeof v === 'boolean') v = o.raw ? String(bool(v)) : bool(v) ? yes : no;
      else if (typeof v === 'object') v = JSON.stringify(v);
      v = String(v);
      return /["\r\n]/.test(v) || v.includes(sep) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    const lines = [...S.head.map(r => r.map(v => txt(v instanceof XC ? v.v : v, -1))), ...S.body.map(r => r.map((v, i) => txt(v, i))), ...S.foot.map(r => r.map((v, i) => txt(v, i, 1)))];
    return (o.bom ? '﻿' : '') + lines.map(l => l.join(sep)).join('\r\n') + (lines.length ? '\r\n' : '');
  }

  // ---------- API ----------
  const sheetsOf = list => list.map((x, i) => { const o = Object.assign({}, x.opts); if (x.name != null) o.sheetName = x.name; const S = toSheet(x.source, o); S.name = S.name || 'Hoja' + (i + 1); return { S, o }; });
  const blob = sh => zip(build(sh).map(store));
  const blobAsync = async (sh, o) => {
    const f = build(sh);
    return zip(typeof CompressionStream === 'function' && o.compress !== false ? await Promise.all(f.map(deflate)) : f.map(store));
  };
  const one = (src, o) => sheetsOf([{ source: src, opts: o }]);
  const X = {
    version: '1.0.0',
    from: (src, o) => blob(one(src ?? [], o)),
    workbook(list) {
      const sh = () => sheetsOf(list || []);
      return { toBlob: () => blob(sh()), toBlobAsync: o => blobAsync(sh(), o || {}), download: (n, o) => X.download(blob(sh()), n || 'libro') };
    },
    getEditTableData: (t, o) => etData(t, o || {}),
    toCSV: (src, o) => csv(toSheet(src, o = Object.assign({}, o)), o),
    // download(blob, nombre) o download(fuente, nombre, opts): cualquier fuente se convierte a XLSX.
    download(src, fileName, o) {
      const b = typeof Blob !== 'undefined' && src instanceof Blob ? src : X.from(src, o);
      const a = document.createElement('a'), url = URL.createObjectURL(b);
      fileName = String(fileName || (o && o.fileName) || 'exportacion');
      a.href = url; a.style.display = 'none';
      a.download = /\.(xlsx|csv)$/i.test(fileName) ? fileName : fileName + '.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    _sheetName: sheetName, _serial: serial, _numFmt: numFmt, _locNum: (s, o) => locNum(s, loc(o || {})), _loc: (o, el) => { const L = loc(o || {}, el); return [L.L, L.dec, L.th, L.ord]; }, _crc32: crc32 // para pruebas
  };
  // fromData, fromArray, fromTable y fromEditTable aceptan cualquier fuente (toSheet decide por su tipo).
  for (const k of ['Data', 'Array', 'Table', 'EditTable']) {
    X['from' + k] = X.from;
    X['from' + k + 'Async'] = (src, o) => blobAsync(one(src ?? [], o), o || {});
  }
  X.exportEditTable = (t, o) => X.download(t, (o && o.fileName) || (t.getAttribute && (t.getAttribute('export-name') || t.id)), o);
  if (typeof module === 'object' && module.exports) module.exports = X;
  if (root) root.InduxsoftExcel = X;
})(typeof window !== 'undefined' ? window : globalThis);
