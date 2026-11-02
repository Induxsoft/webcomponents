/* Ajustes de MAQUETACIÓN de EdiTable para el sitio de demostración (no de color).
 *
 * Los colores ya no salen de aquí: desde F8b el sitio pone theme="claro" u theme="oscuro" en cada tabla
 * (ver temaTablas() en assets/sitio.js) y el tema del componente pinta todo. Este archivo se conserva solo
 * para dos ajustes de distribución que el tema no cubre, aplicados con control-styles (función de la v1):
 *
 *  1. El contenedor interno de la tabla deja de tener scroll propio (como hace V12 con div:has(table#id)).
 *     Así el encabezado, el pie y las columnas fijas se pegan al contenedor con scroll de la página
 *     (.caja-tabla), y la barra de búsqueda de F8a queda arriba sin desplazarse con las filas.
 *  2. Con column-chooser, el último encabezado reserva espacio para el botón de la esquina, que si no tapa
 *     el título de esa columna (pendiente de F3, spec F8b §9).
 *
 * Se aplica con TemaEdiTable.aplicar() ANTES de que la tabla se inicialice (DOMContentLoaded), porque
 * control-styles se lee una sola vez. Una tabla con data-tema="propio" no lo recibe.
 */
(function () {
  'use strict';
  const css = `
:host div:has(> table){ overflow:visible !important; }
:host .et-chooser-host > table > thead th:last-child{ padding-right:36px; }
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
