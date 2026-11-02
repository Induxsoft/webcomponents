/* Tema visual de EdiTable para el sitio de demostración (base reutilizable).
 *
 * EdiTable dibuja dentro de un shadow DOM: el CSS de la página no entra, pero las variables CSS sí cruzan.
 * Este tema es un bloque para el atributo control-styles (función de la versión 1) que solo usa variables
 * --et-*; el sitio las define en assets/sitio.css para claro y oscuro, así que cambiar de tema no reinicia
 * la tabla. Se aplica con TemaEdiTable.aplicar() ANTES de que la tabla se inicialice (DOMContentLoaded),
 * porque control-styles se lee una sola vez. Una tabla con data-tema="propio" no lo recibe.
 *
 * El contenedor interno deja de tener scroll propio (como hace V12 con div:has(table#id)): así el encabezado,
 * el pie y las columnas fijas se pegan al contenedor con scroll de la página.
 * Las reglas llevan :host delante para ganar en especificidad a las hojas que agregan las funciones 2.0.
 */
(function () {
  'use strict';
  const css = `
:host div:has(> table){ overflow:visible !important; }
:host table{ border-spacing:0; font:inherit; font-size:var(--et-fuente,.9rem); color:var(--et-texto); font-variant-numeric:tabular-nums; }
:host thead{ background:var(--et-cab); }
:host thead tr th{ outline:none; background:var(--et-cab); border-bottom:1px solid var(--et-borde); padding:9px 10px; font-weight:600; font-size:.78rem; letter-spacing:.02em; color:var(--et-texto-2); text-align:left; white-space:nowrap; }
:host thead tr th[textalign="end"]{ text-align:right; }
:host table:not(.et-cards) .EdiTable-Cell{ outline:none; border-bottom:1px solid var(--et-linea); padding:2px 8px; height:2.15rem; }
:host tbody tr:hover{ background:var(--et-hover); }
:host table.et-cards tbody{ gap:10px; }
:host table.et-cards tbody tr{ outline:none; border:1px solid var(--et-borde); border-radius:12px; background:var(--et-sup); overflow:hidden; }
:host table.et-cards .EdiTable-Cell{ outline:none; }
:host .EdiTable-Selector{ background:transparent; color:inherit; border:1px solid transparent; border-radius:5px; padding:0 4px; margin:0 -5px; }
:host .EdiTable-Selector:focus{ border-color:var(--et-acento); box-shadow:0 0 0 3px var(--et-anillo); }
:host .EdiTable-Row-Selected{ background:var(--et-sel) !important; color:var(--et-texto) !important; }
:host .EdiTable-Button{ color:var(--et-acento); }
:host .Editable-Input-Number, :host .Editable-Input-Text, :host .Editable-Input-Memo, :host .Editable-Input-Date, :host .Editable-Input-DateTime, :host .Editable-Input-Select{ background-color:var(--et-sup); color:var(--et-texto); outline:2px solid var(--et-acento); border-radius:4px; font:inherit; padding:0 8px; color-scheme:var(--et-esquema, light); }
:host th.ascendent::after, :host th.descendent::after{ margin-left:4px; opacity:.8; }
:host tbody tr.et-row-checked{ background:var(--et-marcada); }
:host tfoot{ background:var(--et-cab) !important; }
:host tfoot td.et-summary{ outline:none; border-top:1px solid var(--et-borde); padding:8px; color:var(--et-texto); background:var(--et-cab); }
:host .et-group-panel{ background:var(--et-sup-2); border:1px dashed var(--et-borde); color:var(--et-texto-2); border-radius:8px; padding:6px 8px; margin-bottom:8px; }
:host .et-group-panel.et-drop-over{ border-color:var(--et-acento); background:var(--et-sel); }
:host .et-group-chip{ background:var(--et-sup); color:var(--et-texto); border-color:var(--et-borde); }
:host .et-group-chip:focus{ border-color:var(--et-acento); box-shadow:0 0 0 3px var(--et-anillo); }
:host .et-chip-remove{ color:var(--et-texto-2); }
:host tbody tr.et-group-row > td{ outline:none; border-bottom:1px solid var(--et-borde); background-color:var(--et-grupo); color:var(--et-texto); }
:host tbody tr.et-group-row:hover > td{ background-color:var(--et-grupo-hover); }
:host tbody tr.et-group-row:focus-within > td{ box-shadow: inset 0 2px 0 var(--et-acento), inset 0 -2px 0 var(--et-acento); }
:host .et-group-count{ color:var(--et-texto-2); }
:host .et-chooser-host > table > thead th:last-child{ padding-right:36px; }
:host .et-chooser-btn{ background:var(--et-sup); color:var(--et-texto-2); border-color:var(--et-borde); border-radius:5px; }
:host .et-chooser{ background:var(--et-sup); color:var(--et-texto); border-color:var(--et-borde); border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.18); }
:host .et-chooser > button:not(:disabled):hover, :host .et-chooser > label:hover{ background:var(--et-hover); }
:host .et-chooser > hr{ border-top-color:var(--et-borde); }
:host .et-drop-indicator{ background:var(--et-acento); }
:host .collapse-btn svg{ fill:currentColor; }
:host .bg-child{ background:var(--et-sup-2) !important; color:var(--et-texto) !important; }
:host .icon-child div::before{ background-color:var(--et-sup-2) !important; }
:host .dragging{ background:var(--et-sel) !important; color:var(--et-texto) !important; }
:host .tr-border-bottom td{ border-bottom:4px solid var(--et-acento); }
`;
  function aplicar(raiz) {
    (raiz || document).querySelectorAll('edit-table:not([data-tema="propio"])').forEach((t) => {
      if (t._temaAplicado) return;
      t._temaAplicado = true;
      t.setAttribute('control-styles', css + (t.getAttribute('control-styles') || ''));
    });
  }
  window.TemaEdiTable = { css, aplicar };
})();
