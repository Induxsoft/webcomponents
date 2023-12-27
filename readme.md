# Induxsoft Controls

Descripción de las funciones y propiedades de los Web Components:

- **[EditSelect](#EditSelect)** (Input select editable)
- **[InputKey](#InputKey)** (Control de búsqueda y selección de datos)
- **[CheckList](#CheckList)** (Lista de verificación)
- **[StackEdit](#StackEdit)** (Pila de elementos ordenables)
- **[EditTable](#EditTable)** (Tabla editable)
- **[OpCanva](#OpCanva)** (Editor de elementos de un plano)
- **[DateRange](#DateRange)** (Controles de rango de fechas)
- **[SafeInput](#SafeInput)** (Entrada con validación personalizada)
- **[MediaList](#MediaList)** (Lista de archivos multimedia)
___

<a name="EditSelect"></a>

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

<a name="InputKey"></a>

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

<a name="CheckList"></a>

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

<a name="StackEdit"></a>

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

<a name="EditTable"></a>

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
 - **ShowAsTree**: (bool, def:false) Establece la vista de la tabla en arbol.
 - **CanMoveRow**: (bool, def:false, si ShowAsTree es true def: true) Establece que las filas puedan ser movidas de posición.
 - **TreeOptions**: (obj) Objeto de configuración de los campos a considerar para las operaciones de la vista en arbol. Si no se establece se inicia con las propiedades asignadas o por defecto de (Key, ParentKey y Childs).
 - **Key**: (text, def: "id") Campo que contiene el identificador de la fila.
 - **ParentKey**: (text, def: "idp") Campo que contiene el identificador de la fila padre.
 - **Childs**: (text, def: "__items") Campo que almacena una lista de filas hijas.
 - **ButtonOnClick**: Se dispara cuando se da click en el botón creado por la propiedad button en el atributo de las columna.
 - **onTdPaint**: Se dispara al crearse el elemento td de la fila.
 - **NumFormat**: (obj) Objeto con la configuración de caracter para la separación de miles y decimales para columnas con el atributo format en true.
 - **hiddeSelector**: (bool, def: false) Oculta el selector de edición de la celda.
 - **hiddeRowSelector**: (bool, def: false) Oculta el selector de selección de la fila.

#### Métodos:
 - **DeleteCurrentRow()**: Elimina la fila seleccionada.
 - **UpdateRow(row)**: Actualiza los valores que se muestran de la fila especificada. Retorna *true* si se completó la tarea, en caso contrario: *false*.
   - row: (number) Índice de la fila.
 - **UpdateData()**: Actualiza los objetos del dataArray con los valores todas las filas de la tabla.
 - **UpdateDataMember(row, field, value, stopfire)**: Actualiza el objeto del dataArray de la fila especificada. Retorna la información del **objeto** de la fila especificada.
   - row: (number) Índice de la fila.
   - field: (text) Nombre del campo a actualizar.
   - value: (text) Valor del campo a actualizar.
   - stopfire: (bool - opcional, def: false) Detiene la ejecución del evento descendiente *FieldUpdated* del elemento en cuestión.
 - **AddRow()**: Agrega una nueva fila a la tabla.
 - **RowIndexOfTd(td)**: Retorna el índice del elemento *tr* de la celda especificada, -1 si la celda es *undefined* o *null*.
   - td: (HTMLTableCellElement) Referencia a un elemento *td* de la tabla.
 - **CurrentRowIndex()**: Retorna el índice de la fila *tr* de la celda *td* actualmente seleccionada, -1 si no hay niguna celda selccionada.
 - **CurrentColIndex()**: Retorna de índice de la celda *td* actualmente seleccionada en relación a su fila, -1 si la celda es *null*, o no pertenece a una fila *tr*.
 - **CellFocus(td)**: Establece el foco a la celda *td* especificada.
   - td: (HTMLTableCellElement) Referencia a un elemento *td* de la tabla.

#### Atributos del componente:
 - **data**: (opcional) datos de la tabla (ej: [{"title1":"value1"},...]).
 - **control-styles**: (opcional) Establece los estilos personalizados que se le aplicarán al control (ej: input{border:1px solid red;}).
 - **show-tree**: (opcional): Establece la vista de la tabla en arbol (true/false, def: false).
 - **parentkey**: (opcional): Campo que contiene el identificador de la fila padre (def: idp).
 - **key**: (opcional): Campo que contiene el identificador de la fila (def: id).
 - **childs-field**: (opcional): Campo que almacena una lista de filas hijas (def: __items).
 - **can-move-row**: (opcional): Establece que las filas puedan ser movidas (true/false, def: false, si show-tree es true def: true).
 - **hidde-selector**: (opcional): Oculta el selector de edición de la celda (true/false, def: false).
 - **hide-row-selector**: (opcional): Oculta el selector de selección de la fila (true/false, def: false).

#### Atributos de las columnas del componente:
 - **type**: (opcional, def: Text) Tipo de celda: Text,Number,Date,DateTime,Memo,Check,Select,Custom,NoEditable (def:Text).
 - **field**: (opcional) Nombre del campo donde se guardará el valor de la celda.
 - **default**: (opcional) Valor por defecto de la celda al iniciarse.
 - **options**: (opcional) Datos de las opciones de una columna de tipo Select (ej: {"a":"Opción 1","b":"Opción 2","c":"Opción 3"}).
 - **button**: (opcional): Muestra un botón de función personalizada en la celda de la columna indicada (true/false, def:false).
 - **buttondata**: (opcional): Contenido HTML del botón de función personalizada (def: svg/icon(...)).
 - **textalign**: (opcional): Establece la alineación del texto de la columna (ej: "start/left, center, end/right").
 - **format**: (opcional): Establece el formateo de números para columnas de tipo Number y NoEditable (true/false, def: false).
 - **decs**: (opcional): Cantidad de decimales a redondear cuando el atributo format es true.
 - **prefix**: (opcional): Prefijo del contenido de la celda cuando el atributo format es true (ej: $).
 - **sufix**: (opcional): Sufijo del contenido de la celda cuando el atributo format es true (ej: MXN).
 - **thousandssep**: (opcional): Establece la separación de miles cuando el atributo format es true (true/false, def: false).

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

___

<a name="OpCanva"></a>

## OpCanva

#### Propiedades:

 - **scale**: (number, def:354) Valor numérico que representa la proporción de las dimensiones reales de un objeto a la representación gráfica del canva.
 - **dpi**: (number, def:96) Valor numérico que representa la densidad de pixeles por pulgada en el canva.
 - **zoom**: (number, def:100) Valor numérico que define el % de acercamiento o alejamiento de los objetos del canva.
 - **design**: (bool, def:true) Valor booleano que define si se podrá mover y redimensionar los objetos del canva.
 - **unit**: (text, def: cm) Unidad de medida para representar objetos dentro del canva ["cm","m","in","ft","yd"].
 - **fit**: (number. def:1) Valor numérico que representa el ajuste de posición y tamaño de los objetos del canva.
 - **lx**: (number, def:5000) Establece la longitud en 'X' o ancho del canva.
 - **ly**: (number, def:2500) Establece la longitud en 'Y' o alto del canva.
 - **backgroundColor**: (text/css, def:#FFF) Color de fondo del canva.
 - **backgroundPic**: (text, def:none) URL de una imagen para visualizarse como el fondo del canva.
 - **data**: (Array obj) Datos de los objetos del canva.
 - **clickEvent**: Se dispara cuando se hace clic en un elemento del canva, envía como parámetro los datos del elemento.
 - **resizingEvent** Se dispara cuando se redimensiona un elemento del canva, envía como parámetro los datos del elemento, la dimensión en alto y la dimensión en ancho.

#### Métodos:
 - **setData(data)**: Establece los valores de los elementos del canva.
   - data: (Array obj) Valor a establecer.
 - **getData()**: Retorna los datos de los elementos del canva.
 - **getItem(id)**: Retorna los datos del elemento especificado.
   - id: (number) identificador del elemento.
 - **addItem(obj)**: Agrega un elemento al canva.
   - obj: (object) Datos del elemento a agregar.
 - **removeItem(id)**: Eliminar un elemento del canva.
   - id: (number) Identificador del elemento.
 - **setScale(scale, refreshView = true)** Establece la escala del canva.
   - scale (number) valor de escala.
   - refreshView (bool) indica si se refresca la vista del canva.
 - **getScale()** Obtiene la escala del canva.
 - **setDpi(dpi, refreshView = true)** Establece el dpi del canva.
   - dpi (number) valor del dpi.
   - refreshView (bool) indica si se refresca la vista del canva.
 - **getDpi()** Obtiene el valor de dpi del canva.
 - **setUnit(unitSymbol, refreshView = true)** Establece la unidad de medida del canva.
   - unitSymbol (text) valor de la lista de unidades disponibles: ["cm","m","in","ft","yd"].
   - refreshView (bool) indica si se refresca la vista del canva.
 - **getUnit()** Obtiene la unidad de medida establecida en el canva.
 - **setZoom(z, refreshView = true)** Establece el valor del zoom del canva.
   - z (number) valor del zoom
   - refreshView (bool) indica si se refresca la vista del canva.
 - **getZoom()** Obtiene el valor establecido de zoom del canva.
 - **setFit(fit, refreshView = true)** Establece el valor de ajuste de posición y tamaño de los elementos del canva.
   - fit (number) valor de ajuste
   - refreshView (bool) indica si se refresca la vista del canva.
 - **getFit()** Obtiene el valor establecido del fit.
 - **setLXY(lx,ly, refreshView = true)** Establece el alto y ancho del contenedor de los elementos del canva.
   - lx (number) valor en ancho.
   - ly (number) valor en alto.
   - refreshView (bool) indica si se refresca la vista del canva.
 - **getLX()** Obtien el valor en ancho del contenedor de elementos del canva.
 - **getLY** Obtiene el valor en alto del contenedor de elementos del canva.

#### Atributos del componente:
 - **scale**: (number - opcional) Valor numérico que representa la proporción de las dimensiones reales de un objeto a la representación gráfica del canva (def: 354).
 - **dpi**: (number - opcional) Valor numérico que representa la densidad de pixeles por pulgada en el canva (def: 96).
 - **zoom**: (number - opcional) Valor numérico que define el % de acercamiento o alejamiento de los objetos del canva (def: 100).
 - **design**: (bool - opcional) Valor booleano que define si se podrá mover y redimensionar los objetos del canva (def: true).
 - **unit**: (text) Unidad de medida para representar objetos dentro del canva ["cm","m","in","ft","yd"] (def: cm).
 - **fit** (number - opcional) Valor numérico que representa el ajuste de posición y tamaño de los objetos del canva (def: 1).
 - **lx** (number - opcional) Establece la longitud en 'X' o ancho del canva (def: 5000).
 - **ly** (number - opcional) Establece la longitud en 'Y' o alto del canva (def: 2500)
 - **background-color** (text/css - opcional) Color de fondo del canva (def: #FFF). 
 - **background-pic** (text- opcional) URL de una imagen para visualizarse como el fondo del canva.
 - **data** (text/json - opcional) Datos de los objetos del canva.

#### Ejemplo:

```
<op-canva
    id="micontrol6"
    scale="354"
    dpi="96"
    zoom="100"
    design="true"
    unit="m"
    fit="1"
    lx="50"
    ly="25"
    background-color="#F5F5F5"
    background-pic=""
    data='[{"x":4,"y":4,"lx":20,"ly":10,"id":"556d852dbee9486ab432eb04411a2df5","overlapping":true,"locked":false,"sizable":true,"html":"<h4>HTML1</h4>","title":"My Title1","subtitle":"Subtitle text1","caption-a":"A1","caption-b":"B1","caption-c":"C1","caption-d":"D1","background-color":"green","background-image":"","color":"#FFF"},
    {"x":13,"y":10,"lx":15,"ly":8,"id":"556d852dbee9486ab432eb04411a2df6","overlapping":false,"locked":false,"sizable":true,"html":"<h4>HTML2</h4>","title":"My Title2","subtitle":"Subtitle text2","caption-a":"A2","caption-b":"B2","caption-c":"C2","caption-d":"D2","background-color":"#FFF","color":"#555"}]'>
</op-canva>
```

___

<a name="DateRange"></a>

## DateRange

#### Métodos:
- **setData(obj)**: Establece el valor de la fecha inicial y final.
   - obj: (Object) Valor a establecer.
- **getData()**: Retorna el valor de la fecha inicial y final.

#### Atributos del componente:
 - **hidden-input-name-start**: (text - opcional) Nombre del elemento input que guardará el valor de la fecha inicial.
 - **hidden-input-name-end**: (text - opcional) Nombre del elemento input que guardará el valor de la fecha final.
 - **start**: (text - opcional) Fecha inicial en formato: YYYY-mm-dd.
 - **end**: (text - opcional) Fecha final en formato: YYYY-mm-dd
 - **data**: (text/json - opcional) JSON con la información de fecha final e inicial, ej: {"start":"2023-01-01","end":"2023-12-31"}

#### Ejemplo:

```
<date-range
    id="micontrol7"
    hidden-input-name-start="dt_start"
    hidden-input-name-end="dt_end"
    start=""
    end=""
    data='{"start":"2023-01-01","end":"2023-12-31"}'>
</date-range>
```


___

<a name="SafeInput"></a>

## SafeInput

#### Propiedades:

 - **onChanging**: Se dispara al confirmar la edición del input, envía como parámetro el valor anterior y el nuevo valor del input, Si se establece se deberá retornar una promesa que devuelva en resolve un valor booleano que indica que se cancela la edición si es true, y se confirma la edición si es false.

#### Métodos:
- Sin métodos

#### Atributos del componente:
 - **type**: (text - opcional) Tipo de input [text,email,number,textarea,date,time,datetime,select] (def: text).
 - **data-select**: (text/json - opcional) Objeto de datos clave-valor que establecen las opciones del input cuando es de tipo select, ej: {"val1":"text1", "val2":"text2"}.
 - **name**: (text - opcional) Nombre del elemento input.
 - **placeholder**: (text - opcional) Texto a mostrar en la caja de entrada (input).
 - **hidden-input**: (bool - opcional) Define si se crea un elemento input oculto fuera el web component para ser tomado por formularios o selectores (def: false).

#### Ejemplo:

```
<safe-input 
    id="micontrol8"
    type="text"
    input-name="nombre"
    value="Example value"
    placeholder="Safe-Input"
    hidden-input="true">
</safe-input>
```


___

<a name="MediaList"></a>

## MediaList

#### Propiedades:

 - **canArrange**: Pueden ordenar elementos (true/false, def: true)
 - **canDrag**: Pueden arrastrar elementos (true/false, def: true)
 - **canDrop**: Pueden colocar elementos (true/false, def: true)
 - **canDelete**: Pueden eliminar elementos (true/false, def: true)
 - **highlightFirst**: Marcar el primer elemento (true/false, def: true)
 - **mediaProp**: Nombre del campo que indica la ubicación del recurso (def: url)
 - **miniatureProp**: Nombre del campo que indica la ubicación de la miniatura del recurso (def: mini)
 - **backColorMedia**: Color de fondo de los elementos media (ej: #FFF o white, def: #FFF)
 - **outlineSelected**: Remarcar el elemento seleccionado (true/false, def: false)
 - **maxSizeMedia**: Valor que se aplica al alto y ancho máximo de los elementos (ej: 12rem, def: 8rem)
 - **onClicking**: Se dispara al hacer click sobre un elemento de la lista, envía como parámetro los datos del elemento.

#### Métodos:
 - **setData(data)**: Establece los valores de los elementos de la lista.
   - data: (Array obj) Valores a establecer.
 - **getData(withoutid=true)**: Retorna los datos de los elementos de la lista.
   - withoutid: (bool) Indica si el valor devuelto por la función retornará el id de cada elemento.
 - **addMedia(mediaData)**: Agrega un elemento a la lista
   - mediaData: (obj) Datos del elemento a agregar.
 - **removeMediaByIndex(index)**: Elimina un elemento de la lista.
   - index: (number) Indice del elemento a eliminar.
 - **refreshView()**: Actualiza la vista de lista.

#### Atributos del componente:
 - **data**: (opcional): Datos de la lista (ej: [{"url":"imagen.png", "mini":"miniimagen.png", ...}, ...] ).
 - **can-arrange**: (opcional): Pueden ordenar elementos (true/false, def: true)
 - **can-drag**: (opcional): Pueden arrastrar elementos (true/false, def: true)
 - **can-drop**: (opcional): Pueden colocar elementos (true/false, def: true)
 - **can-delete**: (opcional): Pueden eliminar elementos (true/false, def: true)
 - **highlight-first**: (opcional): Marcar el primer elemento (true/false, def: true)
 - **media-prop**: (opcional): Nombre del campo que indica la ubicación del recurso (def: url)
 - **miniature-prop**: (opcional): Nombre del campo que indica la ubicación de la miniatura del recurso (def: mini)
 - **back-color-media**: (opcional): Color de fondo de los elementos media (ej: #FFF o white, def: #FFF)
 - **outline-selected**: (opcional): Remarcar el elemento seleccionado (true/false, def: false)
 - **max-size-media**: (opcional): Valor que se aplica al alto y ancho máximo de los elementos (ej: 12rem, def: 8rem)

#### Ejemplo:

```
<media-list
    id="micontrol9"
    data='[{"url":"", "mini":""}]'
    can-arrange="true"
    can-drag="true"
    can-drop="true"
    can-delete="true"
    highlight-first="true"
    media-prop="url"
    miniature-prop="mini">
</media-list>
```