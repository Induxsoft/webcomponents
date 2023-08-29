# Induxsoft Controls

Descripción de las funciones y propiedades de los Web Components:

- **EditSelect** (Input select editable)
- **InputKey** (Control de búsqueda y selección de datos)
- **CheckList** (Lista de verificación)
- **StackEdit** (Pila de elementos ordenables)
- **EditTable** (Tabla editable)
___
## EditSelect

#### Métodos:
- **setValue(value, allowFocus)**: Establece el valor del select.
   - value: (text) Valor a establecer.
   - allowFocus: (bool - opcional, def: true) Establece el foco y la selección automática el input editable.
- **getValue()**: Retorna el valor del select.

#### Atributos del componente:
 - **edit-options**: (bool - opcional, def: false) Establece que las opciones puedan ser editables.
 - **manual-text**: (opcional, def: "Escribir manualmente...") Establece el texto a mostrar para la opción editable.
 - **control-styles**: (opcional) Establece los estilos personalizados que se le aplicarán al control (ej: input{border:1px solid red;}).

#### Ejemplo:

```
<edit-select id="micontrol1" name="opcion" edit-options="true" manual-text="Editar manualmente" value="" control-styles="">
    <option value="1">Opción 1</option>
    <option value="2">Opción 2</option>
    <option value="3">Opción 3</option>
    <option >Opción 4</option>
</edit-select>
```
___
## InputKey:

#### Propiedades:
 - **data**: (array obj) Establece los datos a usar en la selección de registros.
 - **searchData**: (text) Establece el campo a considerar en la búsqueda de un registro.
 - **columns**: (text, def:*) Establece los campos a mostrar en la tabla de resultados de búsqueda.
 - **colcaptions**: (text, def:*) Establece los encabezados de la tabla de resultados de búsqueda.
 - **change_event**: Se dispara cuando se establece un nuevo valor al componente.

#### Métodos:
 - **findValue(id)**: Retorna un elemento dentro del objeto de datos que coincida con el valor especificado establecido en la propiedad searchData y el identificador proporcionado.
   - id: (text) cadena con el valor a buscar.
 - **getValue()**: Retorna el objeto seleccionado en la tabla de datos.
 - **setValue(value)**: Establece el valor del control.
   - value: (obj - opcional): Objeto con la información a establecer.
 - **clear()**: limpia la información del objeto seleccionado y los controles del componente.
 - **addEventListener(ename, func)**: Sobrescribe el escuchador de eventos del componente con el definido por el usuario en la propiedad 'change_event'.
   - ename: (text) Nombre del evento.
   - func: (obj) función a disparar con el evento.

#### Atributos del componente:
 - **data-key**: (requerido) Establece el campo a guardar al seleccionar un registro.
 - **data-search**: (requerido) Establece el campo a considerar en la búsqueda de un registro.
 - **data-text**: (opcional) Establece el campo a mostrar en la descripción del registro seleccionado.
 - **data-value**: (opcional) Establece los datos a usar en la selección de registros (ej: [{sys_pk:1,codigo:'001',nombre:'Bob'}, ...]).
 - **data-source**: (opcional) Establece el endpoint para la obtención de registros.
 - **columns**: (opcional) Establece los campos a mostrar en la tabla de resultados de búsqueda (ej: "codigo,nombre", def: valores de todos los campos).
 - **colcaptions**: (opcional) Establece los encabezados de la tabla de resultados de búsqueda (ej: "Código, Nombre", def: nombre de todos los campos).
 - **add-url**: (opcional) Establece el endpoint para la adición de nuevos registros.
 - **edit-url**: (opcional) Establece el endpoint para la edición del registro seleccionado.
 - **search-value**: (opcional) Texto a mostrar por defecto en el campo de búsqueda.
 - **text-value**: (opcional) Texto a mostrar por defecto en el campo de descripción.
 - **box-title-text**: (opcional) Texto a mostrar en el título del buscador.
 - **box-placeholder-text**: (opcional) Texto a mostrar en el placeholder del buscador.
 - **box-nodata-text**: (opcional) Texto a mostrar cuando no haya datos para mostrar.
 - **disabled**: (bool, opcional, def: "false") Desabilita los controles del componente.
 - **required**: (bool, opcional, def: "false") Establece que el campo tenga datos antes de enviarse el formulario.
 - **control-styles**: (opcional) Establece los estilos personalizados que se le aplicarán al control (ej: input{border:1px solid red;}).

#### Claves en URL's:
 - **@search**: (opcional) Valor del parámetro a buscar establecido en el campo de búsqueda del componente.
 - **@key**: (opcional) Valor "data-key" del registro seleccionado.
 - **@text**: (opcional) Descripción "data-text" del registro seleccionado.

#### Ejemplo:

```
<input-key 
    id="micontrol2"
    name="cliente"
    data-key="sys_pk"
    data-search="codigo"
    data-text="nombre"
    data-value='[{"sys_pk":1, "codigo":"001", "nombre":"Bob"}]'
    columns="codigo,nombre"
    colcaptions="Código,Nombre"
    box-title-text="Seleccione un cliente"
    box-placeholder-text="Buscar cliente"
    box-nodata-text="No se encontraron clientes">
</input-key>
```
___
## CheckList:

#### Propiedades:
 - **data**: (array obj) Datos de la lista.
 - **locked**: (bool - opcional, def: false) Elementos marcados ya no pueden desmarcarse.
 - **doneStyle**: (number - opcional - def: 0) Visualización de elementos marcados: 0-Permanecen en su sitio, 1-Desaparecen, 2-Se apilan en una lista en la parte inferior.
 - **canRemove**: (bool - opcional, def: false) Pueden eliminarse elementos.
 - **canEdit**: (bool - opcional, def: false) Pueden editarse elementos.
 - **canMove**: (bool - opcional, def: false) Pueden moverse elementos.
 - **canCheck**: (bool - opcional, def: true) Pueden marcarse como completados o actualizar su progreso.
 - **onItemChanged**: Se dispara cuando se modifica un elemento.
 - **onItemChecked**: Se dispara cuando se completa (o desmarca) un elemento.
 - **onItemMoved**: Se dispara cuando un elemento ha sido movido a otra posición en el árbol de lista.

#### Métodos:
 - **_refreshView()**: Actualiza la interfaz de la lista.
 - **setData(obj)**: Establece los datos de la lista.
   - obj: (array obj) Array de objetos a mostrarse en la lista.
 - **getData(withoutmeta)**: Retorna los datos de la lista.
   - withoutmeta: (bool - opcional, def: false) Devuelve los datos sin la propiedad meta.
 - **getItem(id, withoutindex)**: Retorna la información de un elemento de la lista.
   - id: (text) Identificador del elemento.
   - withoutindex: (bool - opcional, def: true) Elimina la información del índice del elemento.

#### Atributos del componente:
 - **data**: (opcional) datos de la lista.
 - **data-locked**: (bool - opcional, def: false) Elementos marcados ya no pueden desmarcarse.
 - **data-done-style**: (number - opcional, def: 0) Visualización de elementos marcados: 0-Permanecen en su sitio, 1-Desaparecen, 2-Se apilan en una lista en la parte inferior.
 - **can-remove**: (bool - opcional, def: false) Pueden eliminarse elementos
 - **can-edit**: (bool - opcional, def: false) Pueden editarse elementos
 - **can-move**: (bool - opcional, def: false) Pueden moverse elementos
 - **can-check**: (bool - opcional, def: true) Pueden marcarse como completados o actualizar su progreso.

#### Ejemplo:

```
<check-list 
    id="micontrol3"
    data=""
    data-locked="false" 
    data-done-style="1" 
    can-remove="true" 
    can-edit="true" 
    can-move="true" 
    can-check="true">
</check-list>
```
___
## StackEdit

#### Propiedades:
 - **data**: (array obj) Datos de la pila.
 - **captionA**: (text) Campo a mostrar en la esquina superior derecha de los elementos de la pila.
 - **captionB**: (text) Campo a mostrar en la esquina superior izquierda de los elementos de la pila.
 - **captionC**: (text) Campo a mostrar en la esquina inferior derecha de los elementos de la pila.
 - **captionD**: (text) Campo a mostrar en la esquina inferior izquierda de los elementos de la pila.
 - **title**: (text) Campo a mostrar como título de los elementos de la pila.
 - **subtitle**: (text) Campo a mostrar como subtítulo de los elementos de la pila.
 - **colorField**: (text) Color del texto de los elementos de la pila (def: #000).
 - **backColorField**: (text) Color de fondo de los elementos de la pila (def: #FFF).
 - **onElementClick**: Se dispara cuando se hace clic en un elementos de la pila.

#### Métodos:
 - **_refreshView()**: Actualiza la interfaz de la pila.
 - **setData(obj)**: Establece los datos de la pila.
   - obj: (Array obj - opcional) Array de objetos a mostrarse en la pila.
 - **getData()**: Retorna los datos de la pila.
 - **_getItem(id)**: Retorna la información de un elemento de la pila.
   - id: (text) Identificador del elemento.

#### Atributos del componente:
 - **data**: (opcional) datos de la pila.
 - **caption-a**: (opcional) Campo a mostrar en la esquina superior izquierda de los elementos de la pila.
 - **caption-b**: (opcional) Campo a mostrar en la esquina superior derecha de los elementos de la pila.
 - **caption-c**: (opcional) Campo a mostrar en la esquina inferior izquierda de los elementos de la pila.
 - **caption-d**: (opcional) Campo a mostrar en la esquina inferior derecha de los elementos de la pila.
 - **title**: (opcional) Campo a mostrar como título de los elementos de la pila.
 - **subtitle**: (opcional) Campo a mostrar como subtítulo de los elementos de la pila.
 - **color-field**: (opcional, def: #000) Color del texto de los elementos de la pila.
 - **backcolor-field**: (opcional, def: #FFF) Color de fondo de los elementos de la pila.
 - **control-styles**: (opcional) Establece los estilos personalizados que se le aplicarán al control (ej: input{border:1px solid red;}).
 - **styles-field**: (opcional) Especifica el campo en el objeto del array (data) con los estilos para cada contenedor de los elementos de la pila.

#### Ejemplo:
```
<stack-edit 
    id="micontrol4"
    caption-a="a" 
    caption-b="b"
    caption-c="c"
    caption-d="d" 
    title="title" 
    subtitle="subtitle" 
    color-field="#000" 
    backcolor-field="#FFF"
    styles-field="styles"
    data='[{"a":"01-01-2001","b":"Activo","c":"Verde","d":"Uno","title":"Item Verde","subtitle":"Este es un item de color Verde"}]'>
</stack-edit>
```
___
## EditTable

#### Propiedades:
 - **[Events](https://github.com/Induxsoft/EdiTable.js#eventos)**: Eventos que se disparan en los procesos de los controles.
 - **TheadRowIndex**: (number, def:0) Establece el índice de la fila en la tabla que es el encabezado de la misma.
 - **AutoAddRow**: (bool, def:true) Permite la inserción de filas nuevas en la tabla de forma automática.
 - **AutoDelRow**: (bool, def:true) Permite la inserción entre filas así como su eliminación.
 - **EverMove**: (bool, def:true) Si es true, desplazamiento a la izquierda en la primera celda sube una fila y se mueve a la última, a la derecha en la última baja una fila y va a la primer celda.
 - **PagOffSet**: (number, def:10) Número de desplazamiento de filas con AvPag PrevPag.
 - **DataArray**: (Array obj) Array de objetos asociado a las filas.
 - **ColumnsDefaultType**: (text, def:"Text") Disponibles: Text, Number, Date, DateTime, Memo, Check, Select, Custom, NoEditable
 - **Columns**: (Array obj) Array de objetos con información de las filas.

#### Métodos:
 - DeleteCurrentRow(): Elimina la fila seleccionada.
 - UpdateRow(row): Actualiza los valores que se muestran de la fila especificada. Retorna *true* si se completó la tarea, en caso contrario: *false*.
   - row: (number) Índice de la fila.
 - UpdateData(): Actualiza los objetos del dataArray con los valores todas las filas de la tabla.
 - UpdateDataMember(row, field, value, stopfire): Actualiza el objeto del dataArray de la fila especificada. Retorna la información del **objeto** de la fila especificada.
   - row: (number) Índice de la fila.
   - field: (text) Nombre del campo a actualizar.
   - value: (text) Valor del campo a actualizar.
   - stopfire: (bool - opcional, def: false) Detiene la ejecución del evento descendiente *FieldUpdated* del elemento en cuestión.
 - AddRow(): Agrega una nueva fila a la tabla.
 - RowIndexOfTd(td): Retorna el índice del elemento *tr* de la celda especificada, -1 si la celda es *undefined* o *null*.
   - td: (HTMLTableCellElement) Referencia a un elemento *td* de la tabla.
 - CurrentRowIndex(): Retorna el índice de la fila *tr* de la celda *td* actualmente seleccionada, -1 si no hay niguna celda selccionada.
 - CurrentColIndex(): Retorna de índice de la celda *td* actualmente seleccionada en relación a su fila, -1 si la celda es *null*, o no pertenece a una fila *tr*.
 - CellFocus(td): Establece el foco a la celda *td* especificada.
   - td: (HTMLTableCellElement) Referencia a un elemento *td* de la tabla.

#### Atributos del componente:
 - data: (opcional) datos de la tabla (ej: [{"title1":"value1"},...]).
 - control-styles: (opcional) Establece los estilos personalizados que se le aplicarán al control (ej: input{border:1px solid red;}).

#### Atributos de las columnas del componente:
 - type: (opcional, def: Text) Tipo de celda: Text,Number,Date,DateTime,Memo,Check,Select,Custom,NoEditable (def:Text).
 - field: (opcional) Nombre del campo donde se guardará el valor de la celda.
 - default: (opcional) Valor por defecto de la celda al iniciarse.
 - options: (opcional) Datos de las opciones de una columna de tipo Select (ej: {"a":"Opción 1","b":"Opción 2","c":"Opción 3"}).

#### Ejemplo:
```
<edit-table id="micontrol5" style="width: 100%;">
    <edit-thead>
        <edit-tr>
            <edit-th type="Text" field="uno">Título 1</edit-th>
            <edit-th type="Text" field="dos" default="Valor 2">Título 2</edit-th>
            <edit-th type="Select" keyfield="opcion_clave" options='{"a":"Opción 1","b":"Opción 2","c":"Opción 3"}'>Título 2</edit-th>
            <edit-th type="Text" field="cuatro">Título 4</edit-th>
        </edit-tr>
    </edit-thead>
</edit-table>
```