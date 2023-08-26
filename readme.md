Induxsoft Controls

Descripción de las funciones y propiedades de los Web Components:

- EditSelect (Input select editable)
- InputKey (Control de búsqueda y selección de datos)
- CheckList (Lista de verificación)
- StackEdit (Pila de items ordenables)
- EditTable (Tabla editable)

>Métodos y propiedades en común

Propiedades:
- attributes: Lista con los nombres de atributos del componente HTML
Métodos:
- constructor(): Inicializar el HTMLElement padre
- observedAttributes(): Devuelve el array de atributos que el navegador observará
- attributeChangeCallback(): Se llama cada vez que se modifica un atributo
- connectedCallback: Se llama cuando el componente se agrega al documento
- createFullElement(tagName, attributes): Retorna un nuevo elemento HTML
   - tagName: (text-opcional) Nombre de etiqueta, por defecto tiene el valor: div
   - attributes: (obj-opcional) Objeto que representan los atributos del elemento, ej: {id:'miElement',class:'mi-element'}

>EditSelect

Propiedades:
- select: Referencia al elemento select del componente
- inputh: Referencia al elemento input de tipo 'hidden' que contiene el valor del elemento select y que se encuentra fuera del componente para ser tomado por formularios
- manualOption: Referencia al elemento option con el que se establece la escritura manual
- manualInput: Referencia al elemento input donde se escribe el valor de forma manual del select

Métodos:
- setValue(value, allowFocus): Establece el valor del select
   - value: (text-requerido) Valor a establecer
   - allowFocus: (true/false - opcional) Establece el focus y la selección automática el input editable, por defecto tiene el valor: true
- getValue(): Retorna el valor del select

>InputKey:

Propiedades:
 - data: Almacena los datos establecidos por el usuario y de la tabla de datos de la búsqueda
 - searchData: Establece el campo a considerar en la busqueda de un registro
 - record_selected: Guarda la información del objeto con el foco en la tabla de datos
 - accept_data: Guarda la información del objeto seleccionado en la tabla de datos
 - table_tables_container2: Referencia al elemento table de la tabla de datos
 - head_tables_container2: Referencia al objeto thead de la tabla de datos
 - body_tables_container2: Referencia al objeto tbody de la tabla de datos
 - columns: Establece los campos a mostrar en la tabla de resultados de busqueda
 - colcaptions: Establece los encabezados de la tabla de resultados de busqueda
 - inputv: Referencia al elemento input de tipo text oculto que guarda el valor especificado en el atributo 'data-key' del componente y que se encuentra fuera de este para ser tomado por formularios
 - input_search_container: Referencia al elemento input del primer control de búsqueda del componente
 - input_search_container2: Referencia al elemento input del control de búsqueda en la tabla de datos del componente
 - input_description_container: Referencia al elemento input que contiene el valor especificado en el atributo 'data-text' del componente
 - accept_footer_container2: Referencia al botón aceptar del control de busqueda en la tabla de datos
 - change_event: Guarda la referencia a una función establecida por el usuario se que desencadena al cambio del valor del componente y al que se le pasa como parámetro la información del nuevo objeto

Métodos:
 - printTableData(): Pinta la información en la tabla de búsqueda y retorna el elemento tbody de la tabla
 - setDataSource(id): Establece el objeto de datos a partir de un identificador con el cual se realizará la búsqueda de similitudes, retorna un objeto promise al que se le puede adjuntar un callback de retorno.
   - id: (text-opcional) cadena con el valor a buscar
 - findValue(id): Retorna un elemento dentro del objeto de datos que coincida con el valor especificado establecido en la propiedad searchData y el identificador proporcionado
   - id: (text-requerido) cadena con el valor a buscar
 - getValue(): Retorna el objeto seleccionado en la tabla de datos
 - setValue(value): Establece el valor del control
   - value: (obj-opcional): Objeto con la información a establecer
 - clear(): limpia la información del objeto seleccionado y los controles del componente
 - search(container2, autoselect): Abre la tabla de busqueda
   - container2: (HTMLElement-requerido) Referencia del contenedor principal de la tabla de busqueda
   - autoselect: (true/false-opcional) Define la selección automática de un elemento al lanzarse la búsqueda y encontrarse una sola coincidencia
 - searchButton(container2): Lanza la busqueda de un elemento
   - container2: (HTMLElement-requerido) Referencia del contenedor principal de la tabla de busqueda
 - setDataInputSearch2(): Sincroniza el valor del campo de busqueda del primer control del componente con el campo de búsqueda de la tabla de datos
 - addEventListener(ename, func): Sobrescribe el escuchador de eventos del componente con el definido por el usuario en la propiedad 'change_event' cuando el evento es de tipo 'change'
   - ename: (text-requerido) Nombre del evento
   - func: (obj-requerido) función a disparar con el evento
 - prepareUrl(url): Procesa la url proporcionada para remplazar los valores del control