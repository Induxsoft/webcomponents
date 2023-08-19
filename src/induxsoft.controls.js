/**
 * ¿QUÉ ES UN WEB COMPONENT?
 * Es una forma de crear un bloque de código encapsulado y de
 * responsabilidad única que puede reutilizarse en cualquier
 * página.
 */

class EditSelect extends HTMLElement 
{
    attributes = null;
    select = null;
    inputh = null;
    manualOption = null;
    manualInput = null;

    // Inicializar el HTMLElement padre
    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    // Devuelve el array de atributos que el navegador observará
    static get observedAttributes()
    {
        return  attributes;
    }

    // Se llama cada vez que se modifica un atributo
    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    // Se llama cuando el componente se agrega al documento
    connectedCallback()
    {
        document.addEventListener('DOMContentLoaded', () => 
        {
            const shadow = this.attachShadow({ mode: 'closed' });
            const option = this.querySelectorAll('option');
            const contnr = document.createElement('div');
            const defval = this.getAttribute('value');
            this.select = document.createElement('select');
            this.inputh = document.createElement('input');

            this.inputh.setAttribute('type', 'hidden');
            this.inputh.setAttribute('name', (this.getAttribute('name')??''));

            //=============== Manual option

            const textIndicatorManual = (this.getAttribute('manual-text') ?? 'Escribir manualmente...');
            this.manualOption = document.createElement('option');
            this.manualOption.value = -99;
            this.manualOption.textContent = textIndicatorManual;

            //=============== Input manual

            this.manualInput = document.createElement('input');
            this.manualInput.setAttribute('placeholder', textIndicatorManual);

            //=============== Events

            this.select.addEventListener('change', (e) => 
            {
                if (this.select.value === this.manualOption.value)
                {
                    this.setValue((this.select.getAttribute('text-value') ?? ''));
                }
                else
                {
                    this.setValue(e.target.value ?? '');
                }
            });

            this.manualInput.addEventListener('keyup', () => 
            {
                this.setValue(this.manualInput.value, false);
                this.select.setAttribute('text-value', this.manualInput.value);
            });

            if ((this.getAttribute('edit-options') ?? 'false') == 'true')
            {
                this.select.addEventListener('dblclick', () => 
                {
                    this.manualInput.style.zIndex = 0;
                    this.setValue((this.select.getAttribute('text-value') ?? ''));
                    this.manualInput.value = (this.select.getAttribute('text-value') ?? '');
                    this.manualInput.select();
                    this.manualInput.focus();
                });
            }

            //=============== DOM

            shadow.innerHTML = 
            `
                <style>
                    div{ position: relative !important; }
                    select{ width: 100% !important; padding: 4px 8px !important; }
                    input{ position: absolute !important; z-index: -1; left: 10px; top: 5px; width:90%; border: none !important; outline: none !important;}
                    ` + (this.getAttribute('control-styles') ?? '') + `
                </style>
            `;

            if (option && option.length >= 1) 
                option.forEach(opt => this.select.appendChild(opt));

            this.select.appendChild(this.manualOption);

            if (defval) 
            {
                this.setValue(defval);
                if (this.select.selectedIndex >= 0)
                    this.select.setAttribute('text-value', this.select.options[this.select.selectedIndex].textContent);
                else{
                    this.select.setAttribute('text-value', defval);
                    this.select.value = this.manualOption.value;
                    this.select.dispatchEvent(new Event('change'));
                }
            }

            if (this.hasAttribute('name'))
                this.select.setAttribute('name', this.getAttribute('name'));

            contnr.appendChild(this.select);
            contnr.appendChild(this.manualInput);
            shadow.appendChild(contnr);
            this.after(this.inputh);
        });
    }
    
    setValue(value, allowFocus=true)
    {
        this.setAttribute('value', value);
        this.inputh.value = value;
        this.select.value = value;

        if ((this.select.selectedIndex < 0) || this.select.value === this.manualOption.value)
        {
            this.select.setAttribute('text-value', value);
            this.select.value = this.manualOption.value;
            this.manualInput.style.zIndex = 0;
            this.manualInput.value = (this.select.getAttribute('text-value') ?? '');
            
            if (allowFocus)
            {
                this.manualInput.select();
                this.manualInput.focus();
            }            
        }
        else
        {
            this.manualInput.style.zIndex = -1;
            this.select.setAttribute('text-value', this.select.options[this.select.selectedIndex].textContent); 
        }
    }

    getValue()
    {
        return this.getAttribute('value');
    }
}

class InputKey extends HTMLElement
{
    attributes = null;
    data = null;
    searchData = null;
    record_selected = {};
    accept_data = null;
    table_tables_container2 = null;
    head_tables_container2 = null;
    body_tables_container2 = null;
    columns = null;
    colcaptions = null;
    inputv = null;
    input_search_container = null;
    input_search_container2 = null;
    input_description_container = null;
    accept_footer_container2 = null;
    change_event = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return this.attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        document.addEventListener('DOMContentLoaded', () => 
        {
            this.columns = this.getAttribute('columns');
            this.colcaptions = this.getAttribute('colcaptions');

            //=============== 1 SECTION [ MAIN CONTROL ]
            
            const shadow = this.attachShadow({ mode: 'closed' });
            this.inputv = this.createFullElement('input', {id:'inputv', type:'text', value:`${this.getAttribute('value')??''}`, name:`${this.getAttribute('name')}`, style:'opacity: 0 !important;width: 1px !important; height:1px !important; border:none !important; outline:none !important; box-shadow:none !important; padding:0 !important; margin: 0 !important; pointer-events: none !important; background-color: transparent !important; position:relative !important; display:block !important; top:-15px !important;'});
            const container = this.createFullElement('div', {id:'container'});
            const search_container = this.createFullElement('div', {id:'search_container'});
            this.input_search_container = this.createFullElement('input', {id:'input_search_container', type:'text'});
            const button_search_container = this.createFullElement('button', {id:'button_search_container', type:'button', class:'hover-gray btn-sm'});
            const description_container = this.createFullElement('div', {id:'description_container'});
            this.input_description_container = this.createFullElement('input', {id:'input_description_container', type:'text', readonly:'readonly'});
            const button_add_container = this.createFullElement('button', {id:'button_add_container', type:'button', class:'hover-gray btn-sm'});
            const button_edit_container = this.createFullElement('button', {id:'button_edit_container', type:'button', class:'hover-gray btn-sm'});

            container.classList.toggle('disable-element', ((this.getAttribute('disabled')??'') === 'true'));
            this.inputv.required = ((this.getAttribute('required') ?? 'false') === 'true');

            this.input_search_container.value = (this.getAttribute('search-value') ?? '');
            this.input_description_container.value = (this.getAttribute('text-value') ?? '');
            button_search_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`;
            button_add_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>`;
            button_edit_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;

            search_container.appendChild(this.input_search_container);
            search_container.appendChild(button_search_container);
            description_container.appendChild(this.input_description_container);
            if (this.getAttribute('add-url')) description_container.appendChild(button_add_container);
            if (this.getAttribute('edit-url')) description_container.appendChild(button_edit_container);
            container.appendChild(search_container);
            container.appendChild(description_container);

            //=============== 2 SECTION [ SEARCH AND SELECT ELEMENT ]

            const container2 = this.createFullElement('div', {id:'container2', class:'hide-element modal-backdrop'});
            const search_container2 = this.createFullElement('div', {id:'search_container2', class:'bg-white modal-container'});
            const header_section_container2 = this.createFullElement('div', {id:'header_section_container2', class:'d-flex modal-section modal-section-header'});
            const search_section_container2 = this.createFullElement('div', {id:'search_section_container2', class:'d-flex p-2 modal-section'});
            const tables_section_container2 = this.createFullElement('div', {id:'tables_section_container2', class:'grow-1 modal-section overflow'});
            const footer_section_container2 = this.createFullElement('div', {class:'bg-gray d-flex gap-1 justify-content-end p-2 modal-section'});

            // header section
            const title_header_container2 = this.createFullElement('p', {id:'title_container2', class:'text-secondary grow-1'});
            const close_header_container2 = this.createFullElement('button', {id:'close_header_container2', class:"border-0 p-1 hover-red"});
            title_header_container2.textContent = (this.getAttribute('box-title-text') ?? 'Seleccione un Registro');
            close_header_container2.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#FFF" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
            header_section_container2.appendChild(title_header_container2);
            header_section_container2.appendChild(close_header_container2);

            // search section
            const button_search_container2 = this.createFullElement('button', {type:'button',class:'p-2 border-0 border-1 hover-gray'});
            this.input_search_container2 = this.createFullElement('input', {type:'text', class:'grow-1 p-2 border-0 border-1'});
            button_search_container2.textContent = 'Buscar';
            this.input_search_container2.setAttribute('placeholder', (this.getAttribute('box-placeholder-text') ?? 'Buscar...'));
            search_section_container2.appendChild(this.input_search_container2);
            search_section_container2.appendChild(button_search_container2);

            // tables section
            this.table_tables_container2 = this.createFullElement('table', {id:'table_tables_container2'});
            this.head_tables_container2 = this.createFullElement('thead', {id:'head_tables_container2', class:'bg-light-gray'});
            this.body_tables_container2 = this.createFullElement('tbody', {id:'body_tables_container2'});

            this.table_tables_container2.appendChild(this.head_tables_container2);
            this.table_tables_container2.appendChild(this.body_tables_container2);
            tables_section_container2.appendChild(this.table_tables_container2);

            // footer section
            this.accept_footer_container2 = this.createFullElement('button', {type:'button',class:'p-2'});
            const close2_footer_container2 = this.createFullElement('button', {id:'close2_container2', type:'button', class:'p-2'});
            this.accept_footer_container2.textContent = 'Aceptar';
            close2_footer_container2.textContent = 'Cancelar';
            footer_section_container2.appendChild(this.accept_footer_container2);
            footer_section_container2.appendChild(close2_footer_container2);

            search_container2.appendChild(header_section_container2);
            search_container2.appendChild(search_section_container2);
            search_container2.appendChild(tables_section_container2);
            search_container2.appendChild(footer_section_container2);
            container2.appendChild(search_container2);

            //=============== 3 SECTION [ ADD ELEMENT ]

            const container3 = this.createFullElement('div', {id:'container3', class:'hide-element modal-backdrop'});
            const add_container3 = this.createFullElement('div', {id:'add_container3', class:'bg-white modal-container'});
            const header_section_container3 = this.createFullElement('div', {id:'header_section_container3', class:'d-flex modal-section modal-section-header'});
            const iframe_section_container3 = this.createFullElement('div', {id:'iframe_section_container3', class:'grow-1 modal-section'});

            // header section
            const title_header_container3 = this.createFullElement('p', {id:'title_container2', class:'text-secondary grow-1'});
            const close_header_container3 = this.createFullElement('button', {id:'close_header_container2', class:"border-0 p-1 hover-red"});
            title_header_container3.textContent = (this.getAttribute('box-title-text') ?? 'Agregar registro');
            close_header_container3.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#FFF" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
            header_section_container3.appendChild(title_header_container3);
            header_section_container3.appendChild(close_header_container3);

            add_container3.appendChild(header_section_container3);
            add_container3.appendChild(iframe_section_container3);
            container3.appendChild(add_container3);

            //=============== 4 SECTION [ EDIT ELEMENT ]

            const container4 = this.createFullElement('div', {id:'container4', class:'hide-element modal-backdrop'});
            const edit_container4 = this.createFullElement('div', {id:'edit_container4', class:'bg-white modal-container'});
            const header_section_container4 = this.createFullElement('div', {id:'header_section_container4', class:'d-flex modal-section modal-section-header'});
            const iframe_section_container4 = this.createFullElement('div', {id:'iframe_section_container4', class:'grow-1 modal-section'});

            // header section
            const title_header_container4 = this.createFullElement('p', {id:'title_container4', class:'text-secondary grow-1'});
            const close_header_container4 = this.createFullElement('button', {id:'close_header_container4', class:"border-0 p-1 hover-red"});
            title_header_container4.textContent = (this.getAttribute('box-title-text') ?? 'Editar registro');
            close_header_container4.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#FFF" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
            header_section_container4.appendChild(title_header_container4);
            header_section_container4.appendChild(close_header_container4);

            edit_container4.appendChild(header_section_container4);
            edit_container4.appendChild(iframe_section_container4);
            container4.appendChild(edit_container4);

            //=============== EVENTS

            button_search_container.addEventListener('click', () => {
                this.setDataSource(this.input_search_container.value).then(()=>{
                    this.setDataInputSearch2();
                    this.search(container2, false);
                });
            });
            this.input_description_container.addEventListener('dblclick', () => {
                button_search_container.click();
            })
            close_header_container2.addEventListener('click', () => {
                container2.classList.add('hide-element');
            });
            close2_footer_container2.addEventListener('click', () => {
                container2.classList.add('hide-element');
            });
            this.accept_footer_container2.addEventListener('click', () => {
                if (!this.record_selected || Object.entries(this.record_selected).length <= 0)
                {
                    alert("Debe seleccionar un registro para continuar");
                    return;
                }
                this.setValue(this.record_selected);
                container2.classList.add('hide-element');
            });
            this.input_search_container.addEventListener('click', () => {
                this.input_search_container.select();
                this.input_search_container.focus();
            });
            this.input_search_container.addEventListener('blur', (e) => {
                if (this.input_search_container.value.trim() && container2.classList.contains('hide-element') && (this.accept_data && ((this.accept_data[this.getAttribute('data-search') ?? '']) != this.input_search_container.value)))
                {
                    this.setDataSource(this.input_search_container.value).then(()=>{
                        this.input_search_container2.value = this.input_search_container.value;
                        this.search(container2, true);
                    });
                }
            });
            this.input_search_container.addEventListener('keyup', (e) => {
                if (e.key === 'Enter')
                    this.setDataSource(this.input_search_container.value).then(()=>{
                        this.input_search_container2.value = this.input_search_container.value;
                        this.search(container2, true);
                    });
            });
            button_search_container2.addEventListener('click', () => {
                this.searchButton(container2);
            });
            this.input_search_container2.addEventListener('keyup', (e) => {
                if (e.key === 'Enter')
                    this.searchButton(container2);
            });
            search_container2.addEventListener('keyup', (e) => {
                if (e.key === 'Escape')
                    container2.classList.add('hide-element');
            });
            button_add_container.addEventListener('click', (e) => {
                e.stopPropagation();
                let url = this.prepareUrl((this.getAttribute('add-url')??''));
                const iframe_container3 = this.createFullElement('iframe', {width:'100%', height:'100%', title:'Add element', src:url});
                iframe_section_container3.innerHTML = '';
                iframe_section_container3.appendChild(iframe_container3);
                container3.classList.remove('hide-element');
            });
            close_header_container3.addEventListener('click', () => {
                container3.classList.add('hide-element');
            });
            button_edit_container.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.getAttribute('value'))
                {
                    alert('Debe seleccionar un registro para continuar.');
                    return;
                }
                let url = this.prepareUrl((this.getAttribute('edit-url')??''));
                const iframe_container4 = this.createFullElement('iframe', {width:'100%', height:'100%', title:'Edit element', src:url});
                iframe_section_container4.innerHTML = '';
                iframe_section_container4.appendChild(iframe_container4);
                container4.classList.remove('hide-element');
            });
            close_header_container4.addEventListener('click', () => {
                container4.classList.add('hide-element');
            });

            const MO = new MutationObserver(()=>{
                container.classList.toggle('disable-element', ((this.getAttribute('disabled')??'') === 'true'));
            });

            MO.observe(this, {
                attributes: true,
                attributeFilter: ['disabled']
            });
            
            //=============== STYLES

            shadow.innerHTML = `
                <style>
                    /* ========== General */
                    *{ box-sizing: border-box; margin: 0; padding: 0; }
                    .hide-element{ display: none !important; }
                    .text-secondary{ color: #888; }
                    .text-white{color: #FFF;}
                    .bg-white{ background-color: #FFF;}.bg-red{ background-color: #F00; }.bg-light-gray{ background-color: #F5F5F5; }.bg-gray{background-color:#C0C0C0;}
                    .d-flex{ display:flex; align-items:center;}
                    .gap-1{gap:4px;}.gap-2{gap:8px;}
                    .grow-1{ flex-grow: 1; }
                    .border-0{ border:none; outline:none; }.border-1{border:1px solid #EEE;}
                    .p-1{ padding: 2px; }.p-2{ padding: 4px; }.p-3{ padding: 8px; }.p-4{ padding: 16px; }.p-5{ padding: 32px; }
                    .ps-1{ padding-left: 2px; }.ps-2{ padding-left: 4px; }.ps-3{ padding-left: 8px; }.ps-4{ padding-left: 16px; }.ps-5{ padding-left: 32px; }
                    .pe-1{ padding-right: 2px; }.pe-2{ padding-right: 4px; }.pe-3{ padding-right: 8px; }.pe-4{ padding-right: 16px; }.pe-5{ padding-right: 32px; }
                    .justify-content-start{ justify-content: start; }.justify-content-center{ justify-content: center; }.justify-content-end{ justify-content: end; }
                    .hover-red:hover{ background-color:#F00; }.hover-gray:hover{ background-color:#DDD !important; }
                    .fw-500{font-weight: 500;}
                    .btn-sm{display: flex; align-items:center; justify-content: center; padding: 0 5px; border: none; outline:1px solid #888;}
                    .modal-backdrop{ width: 100vw; height: 100vh; position: fixed; top:0; left:0; padding:0; margin: 0; display:flex; align-items:center; justify-content:center; }
                    .modal-container{ width: 40rem; height: 30rem; border:1px solid #ededed; box-shadow: 1px 3px 6px 0 #DDD; display:flex;flex-direction: column; }
                    .modal-section{ border-bottom:1px solid #DDD; }
                    .modal-section-header{ padding: 6px 10px; }
                    .overflow{ overflow:auto; }
                    .disable-element{ pointer-events: none !important; opacity: .5 !important; }

                    /* ========== 1 Section */
                    #container{ display: grid; grid-template-columns: 40% 60%; }
                    #search_container, #description_container{ display: flex; padding:0 4px;}
                    #input_search_container, #input_description_container{ padding: 4px 8px; width: 100%; }
                    #input_search_container, #input_description_container{ border: none; outline:1px solid #888; }

                    /* ========== 2 Section */
                    #table_tables_container2{width:100%;border-spacing: 0;}
                    th,td{ border: 1px solid #DDD; }
                    th{text-align:start;}
                    #body_tables_container2{text-wrap: nowrap;}
                    .row_table{cursor: default;}
                    .row_table:hover{background-color:#F5F5F5;color:#000;}
                    .row_selected{background-color:#3D75DD !important;color:#FFF !important;}

                    @media screen and (max-width:600px) {
                        #search_container2{width: 100%;}
                    }

                    ` + (this.getAttribute('control-styles') ?? '') + `
                    
                </style>
            `;

            shadow.appendChild(container);
            shadow.appendChild(container2);
            shadow.appendChild(container3);
            shadow.appendChild(container4);
            this.after(this.inputv);
        });
    }

    createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    printTableData()
    {
        this.body_tables_container2.innerHTML = ``;
        this.head_tables_container2.innerHTML = ``;

        if (!this.data || this.data.length <= 0)
        { 
            this.body_tables_container2.innerHTML = `<p class="p-3 text-secondary">${(this.getAttribute('box-nodata-text')??'Sin registros')}</p>`; 
            return;
        }

        const titles = (this.colcaptions ? this.colcaptions.split(',') : Object.keys(this.data[0]));
        const fields = (this.columns ? this.columns.split(',') : Object.keys(this.data[0]));

        while (fields.length > titles.length && fields.length <= Object.keys(this.data[0]).length)
            titles[titles.length] = fields[titles.length];

        while (titles.length > fields.length && titles.length <= Object.keys(this.data[0]).length)
            fields[fields.length] = Object.keys(this.data[0])[fields.length];
            
        const tr_tables_container2 = this.createFullElement('tr', {id:'tr_tables_container2'});
        
        titles.forEach(title => 
        {
            const t = this.createFullElement('th',{class:'fw-500 border-1 p-2 ps-3 pe-3'});
            t.textContent = title.trim();
            tr_tables_container2.appendChild(t);
        });
        
        this.head_tables_container2.appendChild(tr_tables_container2);

        this.data.forEach((dt, i) => 
        {
            const row_tables_conatiner2 = this.createFullElement('tr',{class:'row_table', value:`${dt[this.getAttribute('data-search')]}`, tabindex:`0`});
            row_tables_conatiner2.addEventListener('click', (e) => 
            {
                e.stopPropagation();
                this.findValue(e.target.parentNode.getAttribute('value'));
                e.target.parentNode.parentNode.childNodes.forEach(child => child.classList.remove('row_selected'));
                e.target.parentNode.classList.add('row_selected');
            });
            row_tables_conatiner2.addEventListener('dblclick', () => {
                this.accept_footer_container2.click();
            });
            row_tables_conatiner2.addEventListener('keyup', (e) => 
            {
                switch(e.key)
                {
                    case "ArrowRight":
                    case "ArrowDown":
                        if(e.target.nextElementSibling)e.target.nextElementSibling.focus();
                        else if(this.body_tables_container2.firstChild) this.body_tables_container2.firstChild.focus();
                        break;
                    case "ArrowLeft":
                    case "ArrowUp":
                        if(e.target.previousElementSibling)e.target.previousElementSibling.focus();
                        else if(this.body_tables_container2.lastChild) this.body_tables_container2.lastChild.focus();
                        break;
                    case "Enter":
                        this.accept_footer_container2.click();
                        break;
                }
            });
            row_tables_conatiner2.addEventListener('focus', (e) => 
            {
                e.stopPropagation();
                this.findValue(e.target.getAttribute('value'));
                e.target.parentNode.childNodes.forEach(child => child.classList.remove('row_selected'));
                e.target.classList.add('row_selected');
            });
            fields.forEach(field => 
            {
                const cell = this.createFullElement('td',{class:'border-1 p-1 ps-2 pe-2'});
                cell.textContent = dt[field.trim()];
                row_tables_conatiner2.appendChild(cell);
            });
            this.body_tables_container2.appendChild(row_tables_conatiner2);
        });

        return this.body_tables_container2;
    }
    setDataSource(id="")
    {
        this.data = null;
        let url = this.getAttribute('data-source');

        return new Promise(resolve => {
            if (url && id.trim() != "")
            {
                this.request(url.replace('@search', id), (dataSuccess) => {
                    this.data = dataSuccess;
                    this.findValue(id);
                    resolve();
                }, (dataFail) => {
                    alert("Ocurrió un error al invocar el servicio.\n\n" + dataFail);
                });
            }
            else if(this.hasAttribute('data-value') && this.getAttribute('data-value').trim() != '')
            {
                try{ this.data = JSON.parse(this.getAttribute('data-value')); }
                catch{ alert('El valor del atributo "data-value" tiene un formato JSON inválido'); }
                if (id && this.data){
                    this.data = this.data.filter(data => data[this.getAttribute('data-search')].includes(id));
                }
                this.findValue(id);
                resolve();
            }
            else
            {
                resolve();
            }
        });
    }
    findValue(id)
    {
        if (this.data && this.data.length > 0)
        {
            this.record_selected = this.data.find(d => d[this.getAttribute('data-search')] == id);
        }
        return this.record_selected;
    }
    getValue()
    {
        return this.accept_data;
    }
    setValue(value={})
    {
        this.accept_data = value;
        
        if(!this.accept_data || Object.entries(this.accept_data).length <= 0)
        {
            this.input_search_container.value = '';
            this.input_description_container.value = '';
            this.setAttribute('value', '');
            this.inputv.setAttribute('value', '');
            return;
        }
        
        this.input_search_container.value = (this.accept_data[this.getAttribute('data-search')]??'');
        this.input_description_container.value = (this.accept_data[this.getAttribute('data-text')]??'');
        this.setAttribute('value', this.accept_data[this.getAttribute('data-key')]??'');
        this.inputv.setAttribute('value', this.accept_data[this.getAttribute('data-key')]??'');

        if (this.change_event)
            this.change_event(value);
    }
    search(container2, autoselect=false)
    {
        if (this.data && this.data.length == 1 && this.record_selected && autoselect)
        {
            this.setValue(this.record_selected);
        }
        else
        {
            this.printTableData();
            container2.classList.remove('hide-element');
            if(!this.data || this.data.length <= 0)
            {
                this.input_search_container2.select();
                this.input_search_container2.focus();
            }
            else
            {
                this.body_tables_container2.childNodes[0].focus();
            }
        }
    }
    searchButton(container2)
    {
        if (this.input_search_container2.value.trim() == ""){
            alert("Debe especificar el texto a buscar para continuar");
            this.input_search_container2.focus();
            return;
        }
        if (!this.getAttribute('data-source')){
            alert('No se ha especificado una URL de origen para realizar la busqueda');
            return;
        }

        this.setDataSource(this.input_search_container2.value).then(()=>{
            this.search(container2, false);
        });
    }
    setDataInputSearch2()
    {
        this.input_search_container2.value = this.input_search_container.value;
        this.input_search_container2.select();
        this.input_search_container2.focus();
    }
    addEventListener(ename, func)
    {
        switch(ename)
        {
            case 'change':
                this.change_event = func;
                break;
        }
    }
    prepareUrl(url)
    {
        return url.replace('@search',this.input_search_container.value)
            .replace('@key',this.getAttribute('value')??'')
            .replace('@text', this.input_description_container.value);
    }
    request(url, success, fail)
    {
        fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers:{
                'Access-Control-Allow-Origin':'*'
            }
        }).then(response => {
            if (response.ok){
                response.json().then(json => {
                    success(json);
                });
            }
            else{
                fail("El servicio respondió con un estado unválido");
            }
        })
        .catch(error => {
            fail(error.message);
        })
    }
}

class CheckList extends HTMLElement
{
    attributes = null;
    data = {};
    locked = null;
    doneStyle = null;
    canRemove = null;
    canEdit = null;
    canMove = null;
    canCheck = null;
    showPercents = null;

    _containerwc = null;
    _headSection = null;
    _titleHeader = null;
    _bodySection = null;
    _footSection = null;
    _btnDropDown = null;
    _footHeader = null;
    _textDropDown = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return this.attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        document.addEventListener('DOMContentLoaded', () => 
        {
            const shadow =      this.attachShadow({ mode: 'closed' });
            this.locked =       this._parseBool(this.getAttribute('data-locked'));
            this.doneStyle =    this._parseInt(this.getAttribute('data-done-style'));
            this.canRemove =    this._parseBool(this.getAttribute('can-remove'));
            this.canEdit =      this._parseBool(this.getAttribute('can-edit'));
            this.canMove =      this._parseBool(this.getAttribute('can-move'));
            this.canCheck =     this._parseBool(this.getAttribute('can-check'));
            this.showPercents = this._parseBool(this.getAttribute('show-percents'));

            this._containerwc = this._createFullElement('div', { id:'CL_container', class:'bordered d-flex flex-column rounded' });
            this._headSection = this._createFullElement('div', { id:'CL_headerSection', class:'p-3 d-flex' });
            this._bodySection = this._createFullElement('div', { id:'CL_bodySection', class:'grow-1 bg-light-gray' });
            this._footSection = this._createFullElement('div', { id:'CL_footSection'});

            // head section
            this._titleHeader = this._createFullElement('input', { id:'CL_title_headSection', type: 'text', class:'w-100 fz-big2 p-2 noborder', placeholder:'Título'});
            this._headSection.appendChild(this._titleHeader);
            this._containerwc.appendChild(this._headSection);

            // body section
            this._containerwc.appendChild(this._bodySection);

            // foot section
            this._containerwc.appendChild(this._footSection);
            this._footHeader = this._createFullElement('div', { id:'CL_footHeader', class:'ps-2 pe-2 hide-element' });
            this._btnDropDown = this._createFullElement('button', { id:'CL_btnDropDown', class:'d-flex align-items-center gap-2 noborder bg-transparent p-3' });
            const _svgDropDown = this._createFullElement('div', { class:'d-flex align-items-center justify-content-center' });
            this._textDropDown = this._createFullElement('span');

            _svgDropDown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>`;

            this._btnDropDown.appendChild(_svgDropDown);
            this._btnDropDown.appendChild(this._textDropDown);
            this._footHeader.appendChild(this._btnDropDown);
            this._footSection.before(this._footHeader);

            // events
            this._titleHeader.addEventListener('keyup', () => {
                this.data['text'] = this._titleHeader.value;
            });
            this._btnDropDown.addEventListener('click', () => {
                if (this._footSection.classList.contains('hide-element'))
                {
                    this._footSection.classList.remove('hide-element');
                    _svgDropDown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>`;
                }
                else
                {
                    this._footSection.classList.add('hide-element');
                    _svgDropDown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`;
                }
            });

            shadow.innerHTML = `
                <style>
                    /* ========== General */
                    *{ box-sizing: border-box;margin:0;padding:0; }
                    .d-flex{ display:flex; }
                    .flex-column{ flex-direction: column; }
                    .gap-1{gap:4px;} .gap-2{gap:8px;}
                    .justify-content-start{ justify-content: start; } .justify-content-center{ justify-content: center; } .justify-content-end{ justify-content: end; }
                    .align-items-start{ align-items: start; } .align-items-center{ align-items: center; } .align-items-end{ align-items: end; }
                    .fz-sm{ font-size: .8rem; } .fz-normal{ font-size: 1rem; } .fz-big1{ font-size: 1.2rem; } .fz-big2{ font-size: 1.4rem; }
                    .grow-1{ flex-grow: 1; }
                    .w-100{ width: 100%; }
                    .bordered{ border: 1px solid #DDD; }
                    .noborder{ border: none !important; outline: none !important; }
                    .rounded{ border-radius: 6px; }
                    .rounded-50{ border-radius: 50%; }
                    .p-1{ padding: 4px; } .p-2{ padding: 8px; } .p-3{ padding: 12px; } .p-4{ padding: 16px; } .p-5{ padding: 32px; }
                    .ps-1{ padding-left: 4px; }.ps-2{ padding-left: 8px; }.ps-3{ padding-left: 12px; }.ps-4{ padding-left: 16px; }.ps-5{ padding-left: 32px; }
                    .pe-1{ padding-right: 4px; }.pe-2{ padding-right: 8px; }.pe-3{ padding-right: 12px; }.pe-4{ padding-right: 16px; }.pe-5{ padding-right: 32px; }
                    .bg-white{ background-color: #FFF;} .bg-light-gray{ background-color: #F5F5F5; } .bg-transparent{background-color:transparent;}
                    .hide-element{ display: none !important; }
                    .disable-element{ pointer-events: none !important; opacity: .5 !important; }
                    .disable-element-op0{ pointer-events: none !important; opacity: 0 !important; }
                    .pb-4{ border-bottom: 4px solid #DDD !important; }
                    .pt-4{ border-top: 4px solid #DDD !important; }
                    
                    /* ========== List */
                    .list-item-new{ display: grid; grid-template-columns: 1rem 1rem 1fr; gap:4px;}
                    .list-item{ display: grid; grid-template-columns: 1rem 1rem 1fr 2rem; gap:4px;}
                    .sub-item{ padding-left: 1.6rem; }
                    .hover-item:focus-within{ outline: 1px solid #DDD !important; }
                    .movItem, .delItem{ position: relative; left: -1000rem; }
                    .hover-item:hover > div > div > button{ left: 0; }
                    .delItem:hover{ background-color: #F5F5F5; fill: #000 !important; color: #000 !important; cursor: pointer; }
                    .movItem:hover{ cursor: move ; }
                    #CL_btnDropDown:hover{ !important; cursor: pointer !important; }
                    #CL_footHeader{ border-top: 1px solid #DDD !important; transition: .3s; }
                    #CL_footHeader:hover{ background-color: #f5f5f5; }
                    .item{ border-bottom: 4px solid #FFFz; border-top: 4px solid #FFF; }
                </style>
            `;

            shadow.appendChild(this._containerwc);

            if (this.hasAttribute('data') && this.getAttribute('data').trim())
            {
                try
                {
                    this.setData(JSON.parse(this.getAttribute('data')));
                }
                catch(error)
                {
                    alert('El valor del atributo "data" no contiene un formato JSON válido');
                    this.data = {};
                }
            }

            this._refreshView();
        });
    }

    _parseBool(value, _default = false)
    {
        if (value) return (value.toLowerCase() === 'true');
        return _default;
    }
    _parseInt(value, _default = 0)
    {
        if (value != null && isFinite(value.trim()) && !isNaN(value.trim())) { return parseInt(value.trim()); }
        return _default;
    }
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _refreshView()
    {
        // title
        this._titleHeader.value = (this.data?.text ?? '');
        this._bodySection.innerHTML = ``;
        this._footSection.innerHTML = ``;
        this._footHeader.classList.add('hide-element');

        // New item
        let id = this._generateUUID()
        const newItem = this._createRowItem(null, { isNew: true, id: id});

        // Items List
        if (this.data && this.data.items && this.data.items.length > 0)
        {
            this.data.items.forEach(item => 
            {
                let id = (item.id ?? this._generateUUID());
                this._bodySection.appendChild(this._createRowItem(item, { id: id }));

                if (item.items && item.items.length > 0)
                    item.items.forEach(subItem => { 
                        this._bodySection.appendChild(this._createRowItem(subItem, { isNew: false, isSubItem: true, id: (subItem.id ?? this._generateUUID()), parentId: id }))
                    });
            });
        }

        this._bodySection.appendChild(newItem);

        this._reprintElementChecked();
    }
    _generateUUID()
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    _createRowItem(item, params = { isNew: false, isSubItem: false, id: '', parentId:''})
    {
        let containerItem = null;
        if (params.isNew)
        {
            containerItem = this._createFullElement('div', { id:'CL_newCont', class:'hover-item p-2 pe-3 bg-white' });
            const newItem = this._createFullElement('div', { id:'CL_newItem', class:'list-item-new', 'item-id': params.id });
            const newEmpt = this._createFullElement('div');
            const newIcon = this._createFullElement('div', { class:'d-flex align-items-center justify-content-center' });
            const newText = this._createFullElement('input', { type:'text', class:'p-2 noborder w-100 bg-transparent', placeholder:'Elemento de lista'});

            newIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#888" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>`;

            newItem.appendChild(newEmpt);
            newItem.appendChild(newIcon);
            newItem.appendChild(newText);
            containerItem.appendChild(newItem);

            newText.addEventListener('blur', () => {
                if (newText.value.trim() != ""){
                    const newItemElement = this._createRowItem({ text: newText.value.trim() }, { id: this._generateUUID() });
                    newText.value = "";
                    this._addOrUpdateItem(newItemElement);
                }
            });
            newText.addEventListener('keyup', (e) => {
                if (newText.value.trim() != "" && e.key === 'Enter'){
                    const newItemElement = this._createRowItem({ text: newText.value.trim() }, { id: this._generateUUID() });
                    newText.value = "";
                    this._addOrUpdateItem(newItemElement);
                }
            });
        }
        else
        {
            containerItem = this._createFullElement('div', { class:'hover-item item p-1 pe-3 bg-white', 'item-id':`${params.id}` });
            const test = this._createFullElement('div');
            const rowItem = this._createFullElement('div', { class:'list-item' });
            const movItem = this._createFullElement('button', { class:'movItem noborder', style:'background: transparent;', draggable:'true' });
            const chkItem = this._createFullElement('input', { type:'checkbox' });
            const txtItem = this._createFullElement('input', { type:'text', class:'p-2 noborder w-100 bg-transparent'});
            const delItem = this._createFullElement('button', { class:'delItem noborder rounded-50 bg-transparent d-flex align-items-center justify-content-center' });

            movItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#888" class="bi bi-three-dots-vertical" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>`;
            delItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
            txtItem.value = item.text;
            chkItem.checked = (item.done ?? false);
            containerItem.setAttribute('item-text', item.text);
            containerItem.setAttribute('item-done', chkItem.checked);

            if (params.isSubItem)
            {
                containerItem.classList.add('sub-item');
                containerItem.setAttribute('parent-id', params.parentId);
            }

            if (chkItem.checked && this.locked) chkItem.classList.add('disable-element');
            if (!this.canRemove) delItem.classList.add('hide-element');
            if (!this.canEdit) txtItem.classList.add('disable-element');
            if (!this.canMove) movItem.classList.add('disable-element-op0');
            if (!this.canCheck) chkItem.classList.add('disable-element-op0');

            rowItem.appendChild(movItem);
            rowItem.appendChild(chkItem);
            rowItem.appendChild(txtItem);
            rowItem.appendChild(delItem);
            test.appendChild(rowItem);
            containerItem.appendChild(test);

            delItem.addEventListener('click', () => {
                this._addOrUpdateItem(containerItem, true);
            });
            txtItem.addEventListener('keyup', (e) => {
                containerItem.setAttribute('item-text', txtItem.value);
                this._addOrUpdateItem(containerItem);
                if (e.key === 'Enter' && containerItem.nextElementSibling && containerItem.nextElementSibling.childNodes[0] && containerItem.nextElementSibling.childNodes[0].childNodes[2]){
                    containerItem.nextElementSibling.childNodes[0].childNodes[2].focus();
                }
            });
            chkItem.addEventListener('click', () => {
                containerItem.setAttribute('item-done', chkItem.checked);
                this._addOrUpdateItem(containerItem);
                this._refreshView();
                if (chkItem.checked && this.locked)
                    chkItem.classList.add('disable-element');
            });

            
            containerItem.addEventListener('dragover', (e) => {
                e.preventDefault();

                const rect = containerItem.getBoundingClientRect();
                const limit = (rect.y + (rect.height / 2));

                let limitInferior = (e.clientY < limit);

                containerItem.classList.toggle('pb-4', !limitInferior);
                containerItem.classList.toggle('pt-4', limitInferior);
            });
            containerItem.addEventListener('dragleave', (e) => {
                containerItem.classList.remove('pb-4');
                containerItem.classList.remove('pt-4');
            })
        }

        return containerItem;
    }
    _reprintElementChecked()
    {
        this._footSection.innerHTML = '';

        switch(this.doneStyle)
        {
            case 0:
            {
                this._footHeader.classList.add('hide-element');
                break;
            }
            case 1:
            {
                let checkedItems = this._getCheckedItems();
                let lastParendtId = '🧔';

                checkedItems.forEach(itemChecked => 
                {
                    this._bodySection.childNodes.forEach(itemList => 
                    {
                        if (itemChecked.id == itemList.getAttribute('item-id'))
                        {
                            let parentId = (itemList.getAttribute('parent-id') ?? '');
                            if (parentId && parentId != lastParendtId)
                            {
                                lastParendtId = parentId;
                                let parentItemList = null; 
                                this._bodySection.childNodes.forEach(item => { 
                                    if(item.getAttribute('item-id') == parentId)  
                                        parentItemList = item;
                                });
                                if (parentItemList)
                                {
                                    const parentClone = parentItemList.cloneNode(true);
                                    parentClone.classList.add('disable-element');
                                    this._footSection.appendChild(parentClone);
                                }
                            }
                            this._footSection.appendChild(itemList);
                        }
                    });
                });
                
                if (checkedItems.length > 0)
                {
                    this._footHeader.classList.remove('hide-element');
                    let text = (checkedItems.length == 1 ? ' Elemento completado' : ' Elementos completados');
                    this._textDropDown.textContent = checkedItems.length + text;
                }
                break;
            }
            case 2:
            {
                this._footHeader.classList.add('hide-element');
                let checkedItems = this._getCheckedItems();
                checkedItems.forEach(item => this._bodySection.childNodes.forEach(itemList => { if (item.id == itemList.getAttribute('item-id')) itemList.remove(); }));
                break;
            }
        }
    }
    __addOrUpdateItem(element, del=false, data=null)
    {
        if (data == null) data = this.data;
        
        let updated = false;
        let items = (data?.items??[]);
        let itemId = (element.getAttribute('item-id') ?? '_');
        let parentId = (element.getAttribute('parent-id')??'_');

        if (items && items.length > 0)
        {
            items.forEach((item, i) => 
            {
                if (!updated && itemId == item.id)
                {
                    if (del)
                    {
                        let delSubItems = [];

                        if (items[i].items && items[i].items.length > 0)
                        {
                            this._bodySection.childNodes.forEach((itm) => {
                                if ((itm.getAttribute('parent-id')??'') == itemId) delSubItems.push(itm);
                            });
                        }
                        items.splice(i, 1);
                        delSubItems.forEach(subItem => subItem.remove());
                        element.remove();
                    }
                    else
                    {
                        items[i].text = element.getAttribute('item-text');
                        items[i].done = ((element.getAttribute('item-done') ?? '') === 'true');
                        if (items[i].items && items[i].items.length > 0)
                            items[i].items.forEach(subitem => subitem.done = items[i].done);
                    }
                    updated = true;
                }
                else if (item.items && item.items.length > 0 && parentId == item.id)
                {
                    items[i].items = this.__addOrUpdateItem(element, del, item);
                    updated = true;
                }
            });
        }

        if (!updated)
        {
            items.push({
                id: element.getAttribute('item-id'), 
                text: element.getAttribute('item-text'),
                done: ((element.getAttribute('item-done') ?? '') === 'true'),
                _meta: {
                    percent: -1, 
                    progress: '100'
                }
            });
            this._bodySection.lastChild.before(element);
        }

        return items;
    }
    _addOrUpdateItem(element, del=false)
    {
        this.data['items'] = this.__addOrUpdateItem(element, del);
        this.data.items.forEach(item => 
        {
            if (item.items && item.items.length > 0)
            {
                let allSubItemsChecked = true;
                item.items.forEach(subItem => {
                    if(!subItem.done) allSubItemsChecked = false;
                });
                item.done = allSubItemsChecked;
            }
        });
    }
    _getCheckedItems()
    {
        let itemsCompleted = [];
        if (this.data && this.data.items && this.data.items.length > 0)
        {
            this.data.items.forEach(item => {
                if (item.done == true) itemsCompleted.push(item);
                if (item.items && item.items.length > 0){
                    item.items.forEach(subitem => {
                        if (subitem.done == true) itemsCompleted.push(subitem);
                    });
                }
            });
        }
        return itemsCompleted;
    }
    setData(obj)
    {
        this.data = obj;
        
        if (this.data && this.data.items && this.data.items.length > 0)
        {
            this.data.items.forEach(item => 
            {
                item['id'] = (item.id ?? this._generateUUID());
                item['_meta'] =  { percent:(item.meta?.percent ?? -1), progress:(item.meta?.progress ?? '100') };
                if (item.items && item.items.length > 0)
                {
                    item.items.forEach(subItem => { 
                        subItem['id'] = (subItem.id ?? this._generateUUID());
                        subItem['_meta'] = { percent:(subItem.meta?.percent ?? -1), progress:(subItem.meta?.progress ?? '100') };
                    });
                }
            });
        }
        this._refreshView();
    }
    getData(withoutmeta = false)
    {
        let temp = JSON.parse(JSON.stringify(this.data));
        
        if (withoutmeta)
        {
            temp.items.forEach(t => {
                delete t._meta
                if (t.items && t.items.length > 0)
                    t.items.forEach(s => delete s._meta);
            });
        }
        
        return temp;
    }
    getItem(id)
    {
        let itm = null;

        if (this.data && this.data.items && this.data.items.length > 0)
            itm = this.data.items.find(item => item.id == id);

        if (!itm && this.data && this.data.items && this.data.items.length)
        {
            this.data.items.forEach(item => {
                if (item.items && item.items.length > 0) {
                    item.items.forEach(subItem => {
                        if (subItem.id == id)
                            itm = subItem;
                    });
                }
            });
        }

        return itm;
    }
}

customElements.define('edit-select', EditSelect);
customElements.define('input-key', InputKey);
customElements.define('check-list', CheckList);