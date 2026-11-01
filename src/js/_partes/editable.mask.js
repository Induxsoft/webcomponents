/* EditTable.Mask: máscaras de captura y expresiones numéricas, sin DOM (spec EdiTable 2, §3).
   Patrón: 9 dígito, A letra Unicode, X letra o dígito, * cualquiera, \ escapa; lo demás es literal.
   Decisiones y presets: tests/mascaras/README.md. */
const EditTableMask = (() => {
  const SL = { '9': c => c >= '0' && c <= '9', A: c => /\p{L}/u.test(c), X: c => /[\p{L}0-9]/u.test(c), '*': () => true };
  const cache = {};
  // Tokens: {s: prueba} ranura o {l: carácter} literal; t.p = posición de cada ranura, t.L = literales.
  const parse = p => cache[p] || (cache[p] = (() => {
    const t = [], a = [...p]; t.p = []; t.L = new Set();
    for (let i = 0; i < a.length; i++) {
      const c = a[i];
      if (c === '\\' && i + 1 < a.length) t.push({ l: a[++i] });
      else if (SL[c]) { t.p.push(t.length); t.push({ s: SL[c] }); }
      else t.push({ l: c });
      if (t[t.length - 1].l !== undefined) t.L.add(t[t.length - 1].l);
    }
    return t;
  })());
  // Acomoda chars en las ranuras desde el token i. lit: acepta los literales del patrón en el texto.
  const take = (t, chars, lit, ph, i = 0) => {
    const raw = []; let bad = 0;
    for (const c of chars) {
      if (lit && ph && c === ph) continue;
      while (i < t.length && !t[i].s && !(lit && c === t[i].l)) i++;
      if (i >= t.length) { bad++; continue; }
      if (!t[i].s) { i++; continue; }
      if (t[i].s(c)) { raw.push(c); i++; } else if (!(lit && t.L.has(c))) bad++;
    }
    return { raw, bad };
  };
  const render = (t, raw, ph) => {
    if (!raw.length) return '';
    let d = '', k = 0;
    for (const x of t) {
      if (x.s) { if (k < raw.length) d += raw[k++]; else if (ph) d += ph; else break; }
      else d += x.l;
    }
    return d;
  };
  const out = (t, raw, k, ph) => {
    const display = render(t, raw, ph), cp = [...display];
    return { display, raw: raw.join(''), complete: raw.length === t.p.length,
      caret: raw.length ? cp.slice(0, k < t.p.length ? t.p[k] : t.length).join('').length : 0 };
  };
  // Separadores (R7): opts.decimal/opts.thousands mandan; si no, Intl con opts.locale (por omisión es-MX).
  // Se usa 1234567.5 porque algunos locales (es-ES) no agrupan números de 4 cifras.
  const SEP = {};
  const sep = (o = {}) => {
    const l = o.locale || 'es-MX';
    if (!SEP[l]) {
      let d = '.', g;
      try { for (const x of new Intl.NumberFormat(l).formatToParts(1234567.5)) x.type === 'decimal' ? d = x.value : x.type === 'group' ? g = x.value : 0; } catch (e) { }
      SEP[l] = { d, g: g ?? (d === ',' ? '.' : ',') };
    }
    const d = o.decimal || SEP[l].d;
    return { d, g: o.thousands ?? (o.decimal ? (d === ',' ? '.' : ',') : SEP[l].g) };
  };
  const esc = c => c.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
  // Número escrito con los separadores S → Number (sin grupos: percent).
  const num = (v, S) => +v.replace(S.d, '.');
  const preset = p => typeof p === 'object' ? p : Object.hasOwn(M.presets, p) ? M.presets[p] : null;
  const fp = P => P && !P.m, tk = (P, p) => parse(P ? P.m : p);
  // Filtro de un carácter: lo pasa a mayúsculas si up y lo acepta si cumple re.
  const F = (re, up) => c => (c = up ? U(c) : c, re.test(c) ? c : null);
  // Presets sin patrón fijo: inserta chars en d entre a y b, filtrando con P.c, P.max y P.ok.
  const fins = (P, d, a, b, s, S) => {
    let cur = d.slice(0, a), bad = 0, n = 0; const aft = d.slice(b);
    for (const ch of s) {
      const c = P.c(ch, S), v = cur + c + aft;
      if (c == null || v.length > (P.max || 1e4) || (P.ok && !P.ok(v, S))) bad++; else { cur += c; n++; }
    }
    return { d: cur + aft, k: cur.length, bad, n };
  };
  const fres = (P, d, k, S) => ({ display: d, raw: P.r ? P.r(d, S) : d, caret: k, complete: !!d && M.validate(P, d, S).reason !== 'incomplete' });
  const dt = (s, Y) => {
    const m = +s.slice(2, 4), d = +s.slice(4, 6), x = new Date(Date.UTC(Y + +s.slice(0, 2), m - 1, d));
    return x.getUTCMonth() === m - 1 && x.getUTCDate() === d;
  };
  const dv = (s, D, n) => { let t = 0; for (let i = 0; i < n; i++) t += D.indexOf(s[i]) * (n + 1 - i); return t; };
  const ENT = 'AS BC BS CC CL CM CS CH DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC TS TL VZ YN ZS NE'.split(' ');
  const U = c => c.toUpperCase();

  const M = {
    presets: {
      cp: { m: '99999' },
      tel: { m: '(999) 999-9999' },
      upper: { c: U },
      lower: { c: c => c.toLowerCase() },
      email: { c: F(/\S/), max: 254, v: v => /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(v) ? '' : 'invalid' },
      // percent: display con el decimal del locale; raw con punto ("10,50" → "10.5" en es-CO).
      percent: { c: (c, S) => /[0-9]/.test(c) || c === S.d ? c : null, max: 6, strict: 1,
        ok: (v, S) => new RegExp(`^\\d{0,3}(${esc(S.d)}\\d{0,2})?$`).test(v) && !(num(v, S) > 100),
        v: (v, S) => !new RegExp(`^(\\d+[.${esc(S.d)}]?\\d*|[.${esc(S.d)}]\\d+)$`).test(v) ? 'invalid' : num(v.replace('.', S.d), S) > 100 || /[.,]\d{3}/.test(v) ? 'rango' : '',
        f: (v, S) => v !== '' && isFinite(num(v.replace('.', S.d), S)) ? num(v.replace('.', S.d), S).toFixed(2).replace('.', S.d) : v,
        r: (v, S) => v.replace(S.d, '.') },
      rfc: { c: F(/[A-Z0-9Ñ&]/, 1), max: 13, v: v => {
        v = U(v);
        if (v.length < 12) return 'incomplete';
        const m = /^[A-ZÑ&]{3,4}(\d{6})[A-Z0-9]{3}$/.exec(v);
        if (!m) return 'invalid';
        if (/^XEXX|^XAXX/.test(v) && v.slice(4) === '010101000') return '';
        if (!dt(m[1], 2000)) return 'fecha';
        const s = v.length === 12 ? ' ' + v : v, r = 11 - dv(s, '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ', 12) % 11;
        return s[12] === (r === 11 ? '0' : r === 10 ? 'A' : '' + r) ? '' : 'checksum';
      } },
      curp: { c: F(/[A-Z0-9]/, 1), max: 18, v: v => {
        v = U(v);
        if (v.length < 18) return 'incomplete';
        const m = /^[A-Z][AEIOUX][A-Z]{2}(\d{6})[HMX]([A-Z]{2})[B-DF-HJ-NP-TV-Z]{3}([A-Z0-9])\d$/.exec(v);
        if (!m) return 'invalid';
        if (!ENT.includes(m[2])) return 'entidad';
        if (!dt(m[1], /\d/.test(m[3]) ? 1900 : 2000)) return 'fecha';
        return +v[17] === (10 - dv(v, '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', 17) % 10) % 10 ? '' : 'checksum';
      } }
    },
    apply(p, text, o = {}) {
      const P = preset(p), s = String(text ?? ''), c = o.caret ?? s.length, S = sep(o);
      if (fp(P)) {
        const r = fins(P, s, 0, s.length, s, S), k = fins(P, s.slice(0, c), 0, c, s.slice(0, c), S).k;
        return Object.assign(fres(P, r.d, k, S), { rejected: r.bad });
      }
      const t = tk(P, p), ph = o.placeholder ?? '_', r = take(t, [...s], 1, ph);
      return Object.assign(out(t, r.raw, take(t, [...s.slice(0, c)], 1, ph).raw.length, ph), { rejected: r.bad });
    },
    validate(p, value, o) {
      const v = String(value ?? ''), P = preset(p);
      let reason = '';
      if (v) {
        if (fp(P)) reason = P.v ? P.v(v, sep(o)) : '';
        else { const a = M.apply(p, v, { placeholder: '' }); reason = a.rejected ? 'invalid' : a.complete ? '' : 'incomplete'; }
      }
      return { ok: !reason, reason };
    },
    format(p, raw, o) {
      const P = preset(p), s = String(raw ?? ''), S = sep(o);
      if (fp(P)) return P.f ? P.f(s, S) : fins(P, s, 0, s.length, s, S).d;
      const t = tk(P, p);
      return render(t, take(t, [...s], 0, '').raw, '');
    },
    unformat(p, display, o = {}) {
      const P = preset(p), s = String(display ?? ''), ph = typeof o === 'string' ? o : o.placeholder ?? '_';
      return fp(P) ? (P.r ? P.r(s, sep(o)) : s) : take(tk(P, p), [...s], 1, ph).raw.join('');
    },
    // state {display, caret, end?}; action {type: insert|paste|backspace|delete, text}. Devuelve el estado nuevo.
    edit(p, st, a, o = {}) {
      const P = preset(p), d = String(st.display ?? ''), ph = o.placeholder ?? '_', ins = a.type === 'insert' || a.type === 'paste', S = sep(o);
      const cl = x => Math.max(0, Math.min(d.length, x ?? d.length));
      let c0 = cl(st.caret), c1 = cl(st.end ?? c0);
      if (c1 < c0) [c0, c1] = [c1, c0];
      const k0 = c0, no = () => Object.assign(M.apply(p, d, { ...o, caret: k0, placeholder: ph }), { accepted: false });
      if (fp(P)) {
        if (!ins && c0 === c1) a.type === 'backspace' ? c0 = Math.max(0, c0 - 1) : c1 = Math.min(d.length, c1 + 1);
        const r = fins(P, d, c0, c1, ins ? String(a.text ?? '') : '', S);
        if (ins ? !r.n || (P.strict && r.bad) : P.ok && !P.ok(r.d, S)) return no();
        return Object.assign(fres(P, r.d, r.k, S), { accepted: true });
      }
      const t = tk(P, p), N = t.p.length, raw = take(t, [...d], 1, ph).raw;
      let ra = take(t, [...d.slice(0, c0)], 1, ph).raw.length, rb = take(t, [...d.slice(0, c1)], 1, ph).raw.length, add = [];
      if (ins) {
        add = take(t, [...String(a.text ?? '')], 1, ph, ra ? t.p[ra - 1] + 1 : 0).raw;
        if (!add.length || (a.type === 'insert' && raw.length - (rb - ra) + add.length > N)) return no();
      } else if (ra === rb) { if (a.type === 'backspace') ra = Math.max(0, ra - 1); else rb = Math.min(raw.length, rb + 1); }
      const nr = take(t, [...raw.slice(0, ra), ...add, ...raw.slice(rb)], 0, '').raw;
      return Object.assign(out(t, nr, Math.min(nr.length, ra + add.length), ph), { accepted: true });
    },
    // =expr o expr: + - * / ( ) %, unario; decimal y miles según el locale (R7; es-MX: 1,234.5).
    calc(e, o) {
      let s = String(e ?? '').trim();
      if (s[0] === '=') s = s.slice(1).trim();
      const err = error => ({ ok: false, value: null, error });
      if (!s) return err('empty');
      if (s.length > 200) return err('length');
      const S = sep(o), D = esc(S.d), G = /\s/.test(S.g) ? '[ \\u00a0\\u202f]' : esc(S.g), T = [];
      const re = new RegExp(`\\s*(?:((?:\\d{1,3}(?:${G}\\d{3})+|\\d+)(?:${D}\\d*)?|${D}\\d+)|([-+*/()%]))`, 'y');
      while (re.lastIndex < s.length) {
        const m = re.exec(s);
        if (!m) return err('syntax');
        T.push(m[1] !== undefined ? +[...m[1]].map(c => c === S.d ? '.' : c >= '0' && c <= '9' ? c : '').join('') : m[2]);
      }
      let j = 0;
      const X = () => { throw 'syntax'; };
      const Pr = () => {
        let r;
        if (typeof T[j] === 'number') r = { v: T[j++] };
        else if (T[j] === '(') { j++; r = { v: E() }; T[j++] !== ')' && X(); }
        else X();
        while (T[j] === '%') { j++; r = { v: r.v / 100, p: 1 }; }
        return r;
      };
      const Un = () => T[j] === '-' || T[j] === '+' ? (T[j++] === '-' ? (r => ({ v: -r.v, p: r.p }))(Un()) : Un()) : Pr();
      const Tm = () => {
        let f = Un();
        while (T[j] === '*' || T[j] === '/') {
          const o = T[j++], r = Un();
          if (o === '/' && r.v === 0) throw 'div0';
          f = { v: o === '*' ? f.v * r.v : f.v / r.v };
        }
        return f;
      };
      const E = () => {
        let v = Tm().v;
        while (T[j] === '+' || T[j] === '-') {
          const o = T[j++], r = Tm(), b = r.p ? v * r.v : r.v;
          v = o === '+' ? v + b : v - b;
        }
        return v;
      };
      try {
        const v = E();
        if (j < T.length) X();
        return isFinite(v) ? { ok: true, value: +v.toFixed(10) || 0, error: '' } : err('overflow');
      } catch (x) { return err(x); }
    }
  };
  return M;
})();
// Solo al cargarse suelto (pruebas): dentro del componente no toca window.
if (typeof document !== 'undefined' && /editable\.mask\.js/.test(document.currentScript?.src || '')) window.EditTableMask = EditTableMask;
