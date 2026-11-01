// v2 §7: mostrar y ocultar columnas con column-chooser (F3).
import { html, clicDerechoTh } from './_f3comun.mjs';
const E = ['v2', 'f3', 'chooser'];
export default [
  {
    id: 'selector-menu', titulo: 'column-chooser: botón, menú con casillas (chooser="false" fuera), ocultar con la casilla, Escape, clic derecho y Fijar desde el menú',
    etiquetas: E, origen: 'spec §7', registro: 'consumer',
    html: html({ attrs: { 'column-chooser': 'true' }, x: { codigo: { chooser: 'false' } } }),
    pasos: [
      ['clic en el botón', h => h.clicShadow('t1', '.et-chooser-btn')],
      ['desmarcar Línea', h => h.clicShadow('t1', '.et-chooser label:nth-of-type(2) input')],
      ['Escape', h => h.tecla('Escape')],
      ['clic derecho en Nombre', h => clicDerechoTh(h, 1)],
      ['Fijar «Nombre»', h => h.clicShadow('t1', '.et-chooser > button:nth-of-type(1)')],
    ],
  },
  {
    id: 'selector-api', titulo: 'HideColumn/ShowColumn/IsColumnVisible/getVisibleColumns; siempre queda una visible; ocultar la columna actual mueve el foco',
    etiquetas: E, origen: 'spec §7', registro: 'consumer',
    html: html({}),
    pasos: [
      ['foco en Nombre y HideColumn(nombre)', async h => { await h.clicCelda('t1', 1, 1); await h.js(() => ET('t1').HideColumn('nombre')); }],
      ['ocultar todas', h => h.js(() => ['codigo', 'nombre', 'linea', 'cantidad', 'precio'].forEach(f => ET('t1').HideColumn(f)))],
      ['ShowColumn de todas', h => h.js(() => ['codigo', 'nombre', 'linea', 'cantidad'].forEach(f => ET('t1').ShowColumn(f)))],
    ],
  },
];
