/* Datos 100 % ficticios para el sitio de demostración de EdiTable 2.
 *
 * Generador determinista: cada función reinicia su semilla, así que la misma llamada devuelve siempre
 * los mismos datos (capturas comparables, pruebas reproducibles). Nombres y empresas inventados;
 * los RFC tienen la estructura y el dígito verificador correctos, pero no corresponden a nadie.
 *
 *   Datos.productos(n)   catálogo de inventario          Datos.clientes(n)   cartera de clientes
 *   Datos.cfdi(n)        comprobantes emitidos           Datos.ventas(n)     ventas por región y vendedor
 *   Datos.empleados(n)   plantilla para nómina           Datos.poliza()      póliza contable de diario
 *   Datos.cuentas()      catálogo de cuentas (árbol)     Datos.pedidos(n)    bandeja de pedidos en línea
 *   Datos.rfc(...)       RFC ficticio válido             Datos.empresa       la empresa emisora ficticia
 */
(function () {
  'use strict';
  let s = 1;
  // mulberry32: rápido y suficiente para datos de ejemplo
  const semilla = (n) => { s = n >>> 0; };
  const azar = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const de = (l) => l[Math.floor(azar() * l.length)];
  const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
  const r2 = (x) => Math.round(x * 100) / 100;
  const pad = (n, k) => String(n).padStart(k, '0');
  const fecha = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
  const BASE = new Date(2026, 9, 31, 12, 0, 0); // 31 oct 2026: fecha fija para que todo sea reproducible

  // ---------- RFC con dígito verificador del SAT ----------
  const DIC = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';
  function digito(base) {
    const b = base.length === 11 ? ' ' + base : base; // persona moral: se completa con un espacio a 12
    let suma = 0;
    for (let i = 0; i < 12; i++) suma += DIC.indexOf(b[i]) * (13 - i);
    const m = suma % 11;
    return m === 0 ? '0' : (11 - m === 10 ? 'A' : String(11 - m));
  }
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function rfc(moral = true) {
    const n = moral ? 3 : 4;
    let r = ''; for (let i = 0; i < n; i++) r += de(LET);
    r += pad(entre(60, 99), 2) + pad(entre(1, 12), 2) + pad(entre(1, 28), 2);
    r += de('ABCDEFGHJKLMNPRSTUVWXYZ123456789') + de('ABCDEFGHJKLMNPRSTUVWXYZ123456789');
    return r + digito(r);
  }

  // ---------- Catálogos de nombres inventados ----------
  const GIROS = ['Comercializadora', 'Distribuidora', 'Abarrotes', 'Ferretería', 'Papelería', 'Servicios', 'Farmacia', 'Refaccionaria', 'Materiales'];
  const NOMBRES_EMP = ['Ejemplo', 'Demostración', 'Modelo', 'Ficticia', 'Imaginaria', 'del Prado', 'Los Pinos', 'La Ceiba', 'El Roble', 'Horizonte', 'Altavista', 'Sierra Azul', 'Río Claro', 'Monteverde'];
  const SOC = ['S.A. de C.V.', 'S. de R.L. de C.V.', 'S.C.', 'S.A.S. de C.V.'];
  const NOMBRES = ['Ana', 'Beatriz', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Hilda', 'Iván', 'Julia', 'Karla', 'Luis', 'Marta', 'Nicolás', 'Olga', 'Pablo', 'Rocío', 'Sergio', 'Tania', 'Ulises', 'Valeria'];
  const APELLIDOS = ['Aguilar', 'Bautista', 'Cruz', 'Domínguez', 'Estrada', 'Flores', 'Gómez', 'Hernández', 'Ibarra', 'Juárez', 'López', 'Martínez', 'Núñez', 'Ortiz', 'Pérez', 'Ramírez', 'Sánchez', 'Torres', 'Vázquez', 'Zamora'];
  const CIUDADES = [['Tuxtla Gutiérrez', 'Sur'], ['Oaxaca', 'Sur'], ['Mérida', 'Sureste'], ['Villahermosa', 'Sureste'], ['Puebla', 'Centro'], ['Querétaro', 'Centro'], ['Toluca', 'Centro'], ['Monterrey', 'Norte'], ['Chihuahua', 'Norte'], ['Guadalajara', 'Occidente'], ['León', 'Occidente'], ['Morelia', 'Occidente']];
  const LINEAS = { 'Ferretería': ['Tornillo', 'Taquete', 'Bisagra', 'Candado', 'Martillo', 'Desarmador'], 'Eléctrico': ['Cable', 'Apagador', 'Contacto', 'Foco', 'Extensión', 'Centro de carga'], 'Plomería': ['Codo', 'Tubo', 'Llave', 'Válvula', 'Cople', 'Manguera'], 'Pintura': ['Pintura', 'Brocha', 'Rodillo', 'Sellador', 'Thinner', 'Lija'], 'Jardín': ['Tijera', 'Pala', 'Rastrillo', 'Aspersor', 'Maceta', 'Sustrato'], 'Oficina': ['Cuaderno', 'Bolígrafo', 'Carpeta', 'Engrapadora', 'Folder', 'Etiqueta'] };
  const ADJ = ['hexagonal', 'galvanizado', 'calibre 12', 'sencillo', 'de 90°', 'de 1/2"', 'reforzado', 'de PVC', 'aislante', 'LED 9 W', 'premium', 'económico', 'de 19 L', 'mediano', 'grande', 'de acero'];
  const MARCAS = ['Marca Ejemplo', 'Demo Pro', 'Ficticia', 'Modelo Plus', 'Genérica', 'Prueba Max'];
  const UNIDADES = [['PZA', 'H87'], ['CAJA', 'XBX'], ['MT', 'MTR'], ['KG', 'KGM'], ['LT', 'LTR'], ['JGO', 'SET']];
  const VENDEDORES = ['Ana Cruz', 'Beto Ramírez', 'Carmen Ortiz', 'Diego Flores', 'Elena Juárez', 'Fabián Torres'];

  const persona = () => de(NOMBRES) + ' ' + de(APELLIDOS) + ' ' + de(APELLIDOS);
  const empresaNombre = () => de(GIROS) + ' ' + de(NOMBRES_EMP) + ' ' + de(SOC);

  const empresa = { nombre: 'Comercial Demostración del Sureste S.A. de C.V.', rfc: 'CDS9506149A4', regimen: '601 General de Ley Personas Morales', cp: '29000' };

  function productos(n = 100) {
    semilla(7); const out = []; const lineas = Object.keys(LINEAS);
    for (let i = 0; i < n; i++) {
      const linea = de(lineas), u = de(UNIDADES);
      const costo = r2(4 + azar() * azar() * 2400);
      out.push({
        sys_pk: i + 1, codigo: 'P-' + pad(i + 1, 5), descripcion: de(LINEAS[linea]) + ' ' + de(ADJ), linea, marca: de(MARCAS),
        unidad: u[0], claveunidad: u[1], existencia: Math.floor(azar() * 600), minimo: entre(5, 40), costo, precio: r2(costo * (1.25 + azar() * 0.35)),
        iva: azar() > 0.08 ? '16' : '0', activo: azar() > 0.07, alta: fecha(new Date(2024, entre(0, 23), entre(1, 28))),
      });
    }
    return out;
  }

  function clientes(n = 50) {
    semilla(11); const out = [];
    for (let i = 0; i < n; i++) {
      const c = de(CIUDADES), moral = azar() > 0.3;
      out.push({
        sys_pk: 1000 + i, codigo: 'C-' + pad(i + 1, 4), nombre: moral ? empresaNombre() : persona(), rfc: rfc(moral), cp: pad(entre(10000, 99999), 5), ciudad: c[0], region: c[1],
        telefono: '55' + pad(entre(10000000, 99999999), 8), correo: 'contacto' + (i + 1) + '@ejemplo.invalid', vendedor: de(VENDEDORES),
        saldo: r2(azar() * 60000 - 6000), limite: de([10000, 25000, 50000, 100000]), dias: de([0, 15, 30, 45]), alta: fecha(new Date(2025, entre(0, 11), entre(1, 28))),
      });
    }
    return out;
  }

  function hex(k) { let h = ''; for (let i = 0; i < k; i++) h += '0123456789ABCDEF'[Math.floor(azar() * 16)]; return h; }

  function cfdi(n = 120) {
    const cli = clientes(40); semilla(29); const out = [];
    for (let i = 0; i < n; i++) {
      const c = de(cli), tipo = azar() > 0.85 ? (azar() > 0.5 ? 'E' : 'P') : 'I';
      const d = new Date(BASE.getTime() - Math.floor(azar() * 120) * 864e5 - Math.floor(azar() * 36e6));
      const subtotal = tipo === 'P' ? 0 : r2(200 + azar() * azar() * 48000);
      const iva = r2(subtotal * 0.16), cancelado = azar() > 0.93;
      out.push({
        uuid: hex(8) + '-' + hex(4) + '-4' + hex(3) + '-' + de(['8', '9', 'A', 'B']) + hex(3) + '-' + hex(12), serie: tipo === 'I' ? 'A' : tipo === 'E' ? 'NC' : 'P', folio: 1000 + i,
        fecha: fecha(d) + 'T' + pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2), tipo, rfc: c.rfc, receptor: c.nombre, uso: tipo === 'P' ? 'CP01' : de(['G01', 'G03', 'G03', 'S01']),
        metodo: tipo === 'P' ? '' : de(['PUE', 'PUE', 'PPD']), forma: tipo === 'P' ? '03' : de(['01', '03', '03', '04', '28', '99']), moneda: 'MXN', subtotal, iva, total: r2(subtotal + iva),
        estado: cancelado ? 'Cancelado' : 'Vigente',
      });
    }
    return out.sort((a, b) => a.fecha < b.fecha ? 1 : -1);
  }

  function ventas(n = 400) {
    semilla(41); const out = []; const lineas = Object.keys(LINEAS);
    const porRegion = { Sur: ['Ana Cruz', 'Beto Ramírez'], Sureste: ['Beto Ramírez', 'Carmen Ortiz'], Centro: ['Diego Flores', 'Elena Juárez'], Norte: ['Fabián Torres', 'Elena Juárez'], Occidente: ['Carmen Ortiz', 'Fabián Torres'] };
    const MESES = ['2026-07', '2026-08', '2026-09', '2026-10'];
    for (let i = 0; i < n; i++) {
      const c = de(CIUDADES), cant = entre(1, 60), precio = r2(20 + azar() * 900);
      out.push({ folio: 'V-' + pad(5000 + i, 6), mes: de(MESES), region: c[1], ciudad: c[0], vendedor: de(porRegion[c[1]]), linea: de(lineas), cantidad: cant, importe: r2(cant * precio), margen: r2(cant * precio * (0.12 + azar() * 0.2)) });
    }
    return out;
  }

  function empleados(n = 24) {
    semilla(53); const out = [];
    const PUESTOS = [['Ventas', 'Asesor comercial', 9800], ['Ventas', 'Jefe de piso', 15200], ['Almacén', 'Almacenista', 9100], ['Almacén', 'Montacarguista', 10400], ['Administración', 'Auxiliar contable', 12800], ['Administración', 'Contador', 21500], ['Sistemas', 'Soporte técnico', 14300], ['Sistemas', 'Programador', 24800]];
    for (let i = 0; i < n; i++) {
      const p = de(PUESTOS), sueldo = r2(p[2] * (0.92 + azar() * 0.2));
      const isr = r2(sueldo * (sueldo > 15000 ? 0.16 : 0.1)), imss = r2(sueldo * 0.0275);
      out.push({ numero: 'E-' + pad(i + 101, 4), nombre: persona(), depto: p[0], puesto: p[1], ingreso: fecha(new Date(entre(2016, 2026), entre(0, 9), entre(1, 28))), sueldo, isr, imss, neto: r2(sueldo - isr - imss), cuenta: '0' + pad(entre(1000000, 9999999), 7) + pad(entre(100, 999), 3) });
    }
    return out;
  }

  function poliza() {
    return [
      { cuenta: '102-01', nombre: 'Bancos, cuenta ficticia 0001', concepto: 'Cobro factura A-1012', cargo: 11600, abono: 0 },
      { cuenta: '105-01', nombre: 'Clientes nacionales', concepto: 'Cobro factura A-1012', cargo: 0, abono: 11600 },
      { cuenta: '601-84', nombre: 'Otros gastos generales', concepto: 'Papelería de oficina', cargo: 1850, abono: 0 },
      { cuenta: '118-01', nombre: 'IVA acreditable pagado', concepto: 'Papelería de oficina', cargo: 296, abono: 0 },
      { cuenta: '102-01', nombre: 'Bancos, cuenta ficticia 0001', concepto: 'Papelería de oficina', cargo: 0, abono: 2146 },
      { cuenta: '201-01', nombre: 'Proveedores nacionales', concepto: 'Pago a proveedor', cargo: 23200, abono: 0 },
      { cuenta: '102-01', nombre: 'Bancos, cuenta ficticia 0001', concepto: 'Pago a proveedor', cargo: 0, abono: 23200 },
    ];
  }

  // Catálogo de cuentas con códigos agrupadores tipo SAT (ficticio en saldos)
  function cuentas() {
    const C = [
      [1, '100', 'Activo', null, 'D'], [2, '101', 'Caja', 1, 'D'], [3, '101-01', 'Caja general', 2, 'D', 4500], [4, '101-02', 'Fondo fijo de caja chica', 2, 'D', 1500],
      [5, '102', 'Bancos', 1, 'D'], [6, '102-01', 'Banco Ficticio, cuenta 0001', 5, 'D', 182400.55], [7, '102-02', 'Banco Ejemplo, cuenta 0002', 5, 'D', 64210.1],
      [8, '105', 'Clientes', 1, 'D'], [9, '105-01', 'Clientes nacionales', 8, 'D', 238900], [10, '115', 'Inventario', 1, 'D'], [11, '115-01', 'Inventario de mercancías', 10, 'D', 512300.4],
      [12, '118', 'Impuestos acreditables pagados', 1, 'D'], [13, '118-01', 'IVA acreditable pagado', 12, 'D', 31840], [14, '151', 'Equipo de transporte', 1, 'D', 420000],
      [15, '200', 'Pasivo', null, 'A'], [16, '201', 'Proveedores', 15, 'A'], [17, '201-01', 'Proveedores nacionales', 16, 'A', -198700], [18, '208', 'IVA trasladado cobrado', 15, 'A'],
      [19, '208-01', 'IVA trasladado cobrado', 18, 'A', -54300], [20, '213', 'Impuestos por pagar', 15, 'A'], [21, '213-01', 'ISR por pagar', 20, 'A', -38250],
      [22, '300', 'Capital contable', null, 'A'], [23, '301', 'Capital social', 22, 'A'], [24, '301-01', 'Capital fijo', 23, 'A', -800000], [25, '304', 'Resultado de ejercicios', 22, 'A', -363901.05],
      [26, '400', 'Ingresos', null, 'A'], [27, '401', 'Ventas y/o servicios', 26, 'A'], [28, '401-01', 'Ventas tasa 16 %', 27, 'A', -1240000], [29, '401-04', 'Ventas tasa 0 %', 27, 'A', -96000],
      [30, '500', 'Costos', null, 'D'], [31, '501', 'Costo de venta', 30, 'D'], [32, '501-01', 'Costo de venta', 31, 'D', 812000],
      [33, '600', 'Gastos', null, 'D'], [34, '601', 'Gastos generales', 33, 'D'], [35, '601-01', 'Sueldos y salarios', 34, 'D', 702000], [36, '601-84', 'Otros gastos generales', 34, 'D', 224000.0],
    ];
    const filas = C.map(([sys_pk, cuenta, nombre, parent, nat, saldo]) => ({ sys_pk, cuenta, nombre, parent, naturaleza: nat === 'D' ? 'Deudora' : 'Acreedora', nat, saldo: saldo || 0 }));
    // Los saldos de las cuentas de mayor son la suma de sus subcuentas
    const porPk = new Map(filas.map(f => [f.sys_pk, f]));
    const total = (f) => { const hijos = filas.filter(h => h.parent === f.sys_pk); if (!hijos.length) return f.saldo; f.saldo = r2(hijos.reduce((a, h) => a + total(h), 0)); return f.saldo; };
    filas.filter(f => f.parent === null).forEach(total); void porPk;
    return filas;
  }

  function pedidos(n = 14) {
    semilla(67); const out = [];
    const EST = ['Nuevo', 'Preparando', 'En camino', 'Entregado', 'Retrasado'];
    for (let i = 0; i < n; i++) {
      const est = de(EST), min = Math.floor(azar() * azar() * 4 * 24 * 60);
      out.push({ pedido: 'PED-' + pad(8800 + i, 5), cliente: persona(), telefono: '961' + pad(entre(1000000, 9999999), 7), canal: de(['Tienda en línea', 'WhatsApp', 'Mostrador', 'Teléfono']),
        piezas: entre(1, 18), total: r2(150 + azar() * 4200), estado: est, repartidor: est === 'En camino' || est === 'Entregado' || est === 'Retrasado' ? de(['Mario', 'Lupita', 'Toño']) : '',
        hora: new Date(Date.now() - min * 60000).toISOString() });
    }
    return out;
  }

  window.Datos = { productos, clientes, cfdi, ventas, empleados, poliza, cuentas, pedidos, rfc: (m) => { semilla(97); return rfc(m); }, digitoRFC: digito, empresa, VENDEDORES, LINEAS: Object.keys(LINEAS) };
})();
