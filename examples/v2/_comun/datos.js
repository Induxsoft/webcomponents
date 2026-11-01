/* Datos ficticios para los ejemplos. RFC genéricos del SAT (XAXX010101000, XEXX010101000) y nombres inventados. */
(function () {
  'use strict';
  let s = 20261101;
  const azar = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const de = (l) => l[Math.floor(azar() * l.length)];
  const LINEAS = ['Ferretería', 'Eléctrico', 'Plomería', 'Pintura', 'Jardín'];
  const MARCAS = ['Marca Ficticia', 'Ejemplo SA', 'Demo Hnos.', 'Prueba Plus'];
  const NOMBRES = ['Tornillo', 'Arandela', 'Cable', 'Apagador', 'Codo', 'Brocha', 'Manguera', 'Taquete', 'Cinta', 'Foco'];
  const ADJ = ['hexagonal', 'plana', 'calibre 12', 'sencillo', 'de 90°', 'de 3"', 'reforzada', 'de plástico', 'aislante', 'LED'];
  const CIUDADES = ['Tuxtla Gutiérrez', 'Oaxaca', 'Puebla', 'Mérida', 'Querétaro', 'Monterrey', 'León'];
  const EMPRESAS = ['Abarrotes', 'Ferretería', 'Papelería', 'Distribuidora', 'Comercial', 'Servicios', 'Farmacia'];
  const APELLIDOS = ['La Ficticia', 'El Ejemplo', 'Prueba', 'Demo', 'Imaginaria', 'Inventada', 'Modelo'];

  function productos(n) {
    s = 7; const out = [];
    for (let i = 0; i < n; i++) {
      const costo = Math.round((5 + azar() * 900) * 100) / 100;
      out.push({ sys_pk: i + 1, codigo: 'P-' + String(i + 1).padStart(5, '0'), descripcion: de(NOMBRES) + ' ' + de(ADJ), linea: de(LINEAS), marca: de(MARCAS),
        unidad: de(['PZA', 'CAJA', 'MT', 'KG']), existencia: Math.floor(azar() * 500), costo, precio: Math.round(costo * 1.35 * 100) / 100, activo: azar() > 0.1 ? 'Sí' : 'No' });
    }
    return out;
  }
  function clientes(n) {
    s = 11; const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ sys_pk: 1000 + i, codigo: 'C-' + String(i + 1).padStart(5, '0'), nombre: de(EMPRESAS) + ' ' + de(APELLIDOS) + ' ' + (i + 1), rfc: i % 7 === 0 ? 'XEXX010101000' : 'XAXX010101000',
        ciudad: de(CIUDADES), saldo: Math.round((azar() * 50000 - 5000) * 100) / 100, limite: de([10000, 25000, 50000, 100000]), vendedor: de(['Ana Ficticia', 'Beto Ejemplo', 'Caro Demo']), alta: '2025-' + String(1 + Math.floor(azar() * 12)).padStart(2, '0') + '-' + String(1 + Math.floor(azar() * 28)).padStart(2, '0') });
    }
    return out;
  }
  const CUENTAS = [
    { sys_pk: 1, cuenta: '100', nombre: 'Activo', parent: null, naturaleza: 'D', saldo: 0 },
    { sys_pk: 2, cuenta: '110', nombre: 'Activo circulante', parent: 1, naturaleza: 'D', saldo: 0 },
    { sys_pk: 3, cuenta: '111', nombre: 'Caja', parent: 2, naturaleza: 'D', saldo: 1500 },
    { sys_pk: 4, cuenta: '112', nombre: 'Bancos', parent: 2, naturaleza: 'D', saldo: 25000 },
    { sys_pk: 5, cuenta: '112-01', nombre: 'Banco Ficticio, cuenta 0001', parent: 4, naturaleza: 'D', saldo: 18000 },
    { sys_pk: 6, cuenta: '112-02', nombre: 'Banco Ejemplo, cuenta 0002', parent: 4, naturaleza: 'D', saldo: 7000 },
    { sys_pk: 7, cuenta: '115', nombre: 'Clientes', parent: 2, naturaleza: 'D', saldo: 42000 },
    { sys_pk: 8, cuenta: '120', nombre: 'Activo fijo', parent: 1, naturaleza: 'D', saldo: 120000 },
    { sys_pk: 9, cuenta: '200', nombre: 'Pasivo', parent: null, naturaleza: 'A', saldo: 0 },
    { sys_pk: 10, cuenta: '210', nombre: 'Proveedores', parent: 9, naturaleza: 'A', saldo: -38000 },
    { sys_pk: 11, cuenta: '216', nombre: 'Impuestos por pagar', parent: 9, naturaleza: 'A', saldo: -6400 },
    { sys_pk: 12, cuenta: '300', nombre: 'Capital', parent: null, naturaleza: 'A', saldo: -100000 },
  ];
  function agentes(n) {
    s = 23; const out = [];
    const est = ['nuevo', 'en curso', 'esperando', 'resuelto'];
    for (let i = 0; i < n; i++) {
      out.push({ chat_id: 5000 + i, username: de(['Cliente', 'Prospecto', 'Usuario']) + ' ' + de(APELLIDOS), userphone: '55' + String(10000000 + Math.floor(azar() * 89999999)), canal: de(['WhatsApp', 'Web', 'Teléfono']),
        agente: de(['NIA', 'Ely', 'Iris', 'ISA']), humano: azar() > .6 ? de(['Ana Ficticia', 'Beto Ejemplo']) : '', estado: de(est), mensajes: 1 + Math.floor(azar() * 40),
        ultimo: new Date(Date.now() - Math.floor(azar() * 5 * 24 * 3600 * 1000)).toISOString() });
    }
    return out;
  }
  window.DatosDemo = { productos, clientes, CUENTAS, agentes, LINEAS };
})();
