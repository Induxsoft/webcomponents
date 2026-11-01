// Demos del repo (examples/), sin modificarlas. El componente se sirve con el archivo de --src.
// _EdiTable-demo.html e index2.html cargan "induxsoft.controls.editable.js" relativo a examples/, donde no existe:
// el banco corrige esa ruta SOLO al servirla (run.mjs, rutaArchivo); la demo sigue rota fuera de las pruebas.
export default [
  {
    id: 'demo-edittable',
    titulo: 'examples/EditTable-demo.html: los 9 tipos, data, formato, botón y todos los eventos',
    url: '/repo/examples/EditTable-demo.html',
    viewport: { width: 1300, height: 700 },
    pasos: [
      ['clic en Text y editar', async h => { await h.clicCelda('editable', 0, 1); await h.tecla('Enter'); await h.tecla('Control+a'); await h.escribir('Demo'); await h.tecla('Enter'); }],
      ['botón + (AddRow)', h => h.clic('#btn-add-row')],
      ['botón - (DeleteCurrentRow)', h => h.clic('#btn-del-row')],
      ['recorrer con Tab', h => h.tecla('Tab', 9)],
    ],
  },
  {
    id: 'demo-treetest',
    titulo: 'examples/_treeTest.html: árbol, RowIndent, ShowAsTree en caliente, control-styles',
    url: '/repo/examples/_treeTest.html',
    viewport: { width: 1100, height: 900 },
    pasos: [
      ['Vista en árbol', h => h.js(() => viewTree(true))],
      ['expandir el primer nodo', h => h.clicShadow('tabla-demo', 'tbody tr:nth-child(1) .collapse-btn')],
      ['seleccionar fila 1 y aumentar sangría', async h => { await h.clicCelda('tabla-demo', 1, 1); await h.js(() => addIdent(true)); }],
      ['Vista normal', h => h.js(() => viewTree(false))],
    ],
  },
  {
    id: 'demo-index',
    titulo: 'examples/index.html: tabla vacía y AddRow (con los demás componentes)',
    url: '/repo/examples/index.html',
    viewport: { width: 1100, height: 900 },
    raiz: 'body',
    estilos: true,
    pasos: [],
  },
  {
    id: 'demo-edittable-old',
    titulo: 'examples/_EdiTable-demo.html (ruta del componente corregida en pruebas): edit-tbody, keyfield, Custom',
    url: '/repo/examples/_EdiTable-demo.html',
    viewport: { width: 1100, height: 700 },
    pasos: [['clic en la primera celda', h => h.clicCelda(null, 0, 0)]],
  },
  {
    id: 'demo-index2',
    titulo: 'examples/index2.html (rutas corregidas en pruebas)',
    url: '/repo/examples/index2.html',
    viewport: { width: 1100, height: 900 },
    pasos: [],
  },
];
