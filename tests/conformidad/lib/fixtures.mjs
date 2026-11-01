// Datos y tablas de prueba. Todo es ficticio: RFC genéricos del SAT y nombres inventados.
import { tabla, pagina } from './html.mjs';

export const PRODUCTOS = [
  { codigo: 'P-003', nombre: 'Tornillo hexagonal', cantidad: 10, precio: 2.5, linea: 'Ferretería' },
  { codigo: 'P-001', nombre: 'Arandela plana', cantidad: 5, precio: 0.75, linea: 'Ferretería' },
  { codigo: 'P-002', nombre: 'Cable calibre 12', cantidad: 3, precio: 18, linea: 'Eléctrico' },
  { codigo: 'P-004', nombre: 'Apagador sencillo', cantidad: 7, precio: 35.9, linea: 'Eléctrico' },
];

export const COLS_PRODUCTOS = [
  { field: 'codigo', type: 'Text', title: 'Código' },
  { field: 'nombre', type: 'Text', title: 'Nombre' },
  { field: 'cantidad', type: 'Number', title: 'Cantidad', textalign: 'end' },
  { field: 'precio', type: 'Number', title: 'Precio', format: 'true', decs: '2', prefix: '$', thousandssep: 'true', textalign: 'end' },
];

/** Página con una tabla de productos (id t1). */
export function paginaProductos({ id = 't1', a = {}, cols = COLS_PRODUCTOS, data = PRODUCTOS, script = '', head = '', src, body = '' } = {}) {
  return { src, head, body: tabla({ id, a, cols, data }) + body, script };
}

export const CLIENTES = [
  { sys_pk: 101, codigo: 'C-0101', nombre: 'Abarrotes La Ficticia', rfc: 'XAXX010101000', saldo: 1520.5, ciudad: 'Tuxtla Gutiérrez' },
  { sys_pk: 102, codigo: 'C-0102', nombre: 'Ferretería El Ejemplo', rfc: 'XAXX010101000', saldo: 0, ciudad: 'Oaxaca' },
  { sys_pk: 103, codigo: 'C-0103', nombre: 'Papelería Prueba', rfc: 'XEXX010101000', saldo: -250, ciudad: 'Puebla' },
  { sys_pk: 104, codigo: 'C-0104', nombre: 'Distribuidora Demo', rfc: 'XAXX010101000', saldo: 98000.1, ciudad: 'Tuxtla Gutiérrez' },
  { sys_pk: 105, codigo: 'C-0105', nombre: 'Comercial Imaginaria', rfc: 'XAXX010101000', saldo: 12, ciudad: 'Mérida' },
];

/** Catálogo de cuentas contables (árbol plano con key/parent). */
export const CUENTAS = [
  { sys_pk: 1, cuenta: '100', nombre: 'Activo', parent: null, saldo: 0 },
  { sys_pk: 2, cuenta: '110', nombre: 'Activo circulante', parent: 1, saldo: 0 },
  { sys_pk: 3, cuenta: '111', nombre: 'Caja', parent: 2, saldo: 1500 },
  { sys_pk: 4, cuenta: '112', nombre: 'Bancos', parent: 2, saldo: 25000 },
  { sys_pk: 5, cuenta: '200', nombre: 'Pasivo', parent: null, saldo: 0 },
  { sys_pk: 6, cuenta: '210', nombre: 'Proveedores', parent: 5, saldo: -8000 },
];

/** Genera n filas deterministas. */
export function muchas(n, extra = {}) {
  const lineas = ['Ferretería', 'Eléctrico', 'Plomería', 'Pintura'];
  const out = [];
  for (let i = 0; i < n; i++) out.push({ id: i + 1, codigo: 'P-' + String(i + 1).padStart(5, '0'), nombre: 'Producto ficticio ' + (i + 1), linea: lineas[i % 4], cantidad: (i * 7) % 50, precio: ((i * 37) % 1000) / 10, ...extra });
  return out;
}

export { tabla, pagina };
