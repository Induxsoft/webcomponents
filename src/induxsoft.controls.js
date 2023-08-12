/**
 * ¿QUÉ ES UN WEB COMPONENT?
 * Es una forma de crear un bloque de código encapsulado y de
 * responsabilidad única que puede reutilizarse en cualquier
 * página.
 */

class EditSelect extends HTMLElement 
{
    attributes = null;

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
            const select = document.createElement('select');
            const option = this.querySelectorAll('option');
            const contnr = document.createElement('div');
            const defval = this.getAttribute('value');

            //=============== Manual option

            const textIndicatorManual = (this.getAttribute('manual-text') ?? 'Escribir manualmente...');
            const manualOption = document.createElement('option');
            manualOption.value = -99;
            manualOption.textContent = textIndicatorManual;

            //=============== Input manual

            const manualInput = document.createElement('input');
            manualInput.setAttribute('placeholder', textIndicatorManual);

            //=============== Events

            select.addEventListener('change', (e) => 
            {
                if (select.value === manualOption.value)
                {
                    manualInput.style.zIndex = 0;
                    this.setAttribute('value', (select.getAttribute('text-value') ?? ''));
                    select.setAttribute('value', (select.getAttribute('text-value') ?? ''));
                    manualInput.value = (select.getAttribute('text-value') ?? '');
                    manualInput.select();
                    manualInput.focus();
                }
                else
                {
                    manualInput.style.zIndex = -1;
                    this.setAttribute('value', e.target.value);
                    select.setAttribute('value', e.target.value);
                    if (select.selectedIndex >= 0)
                        select.setAttribute('text-value', select.options[select.selectedIndex].textContent);
                }
            });

            manualInput.addEventListener('keyup', () => 
            {
                this.setAttribute('value', manualInput.value);
                select.setAttribute('value', manualInput.value);
                select.setAttribute('text-value', manualInput.value);
            });

            if ((this.getAttribute('edit-options') ?? 'false') == 'true')
            {
                select.addEventListener('dblclick', () => 
                {
                    manualInput.style.zIndex = 0;
                    this.setAttribute('value', (select.getAttribute('text-value') ?? ''));
                    select.setAttribute('value', (select.getAttribute('text-value') ?? ''));
                    manualInput.value = (select.getAttribute('text-value') ?? '');
                    manualInput.select();
                    manualInput.focus();
                });
            }

            //=============== DOM

            shadow.innerHTML = 
            `
                <style>
                    div{ position: relative !important; }
                    select{ width: 100% !important; padding: 4px 8px !important; }
                    input{ position: absolute !important; z-index: -1; left: 10px; top: 5px; width:90%; border: none !important; outline: none !important;}
                </style>
            `;

            if (option && option.length >= 1) 
                option.forEach(opt => select.appendChild(opt));

            select.appendChild(manualOption);

            if (defval) 
            {
                select.value = defval;
                this.setAttribute('value', defval);
                if (select.selectedIndex >= 0)
                    select.setAttribute('text-value', select.options[select.selectedIndex].textContent);
            }

            if (this.hasAttribute('name'))
                select.setAttribute('name', this.getAttribute('name'));

            contnr.appendChild(select);
            contnr.appendChild(manualInput);
            shadow.appendChild(contnr);
        });
    }
}

class InputKey extends HTMLElement
{
    attributes = null;
    data = null;
    searchData = null;
    record_selected = {};

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
            //=============== 1 SECTION [ MAIN CONTROL ]
            
            const shadow = this.attachShadow({ mode: 'closed' });
            const inputv = this.createFullElement('input', {type:'hidden', value:`${this.getAttribute('value')??''}`, name:`${this.getAttribute('name')}`});
            const container = this.createFullElement('div', {id:'container'});
            const search_container = this.createFullElement('div', {id:'search_container'});
            const input_search_container = this.createFullElement('input', {id:'input_search_container', type:'text'});
            const button_search_container = this.createFullElement('button', {id:'button_search_container', type:'button', class:'hover-gray btn-sm'});
            const description_container = this.createFullElement('div', {id:'description_container'});
            const input_description_container = this.createFullElement('input', {id:'input_description_container', type:'text', readonly:'readonly'});
            const button_add_container = this.createFullElement('button', {id:'button_add_container', type:'button', class:'hover-gray btn-sm'});
            const button_edit_container = this.createFullElement('button', {id:'button_edit_container', type:'button', class:'hover-gray btn-sm'});

            container.classList.toggle('disable-element', ((this.getAttribute('disabled')??'') === 'true'));

            input_search_container.value = (this.getAttribute('search-value') ?? '');
            input_description_container.value = (this.getAttribute('text-value') ?? '');
            button_search_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`;
            button_add_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>`;
            button_edit_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;

            search_container.appendChild(input_search_container);
            search_container.appendChild(button_search_container);
            description_container.appendChild(input_description_container);
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
            const input_search_container2 = this.createFullElement('input', {type:'text', class:'grow-1 p-2 border-0 border-1'});
            button_search_container2.textContent = 'Buscar';
            input_search_container2.setAttribute('placeholder', (this.getAttribute('box-placeholder-text') ?? 'Buscar...'));
            search_section_container2.appendChild(input_search_container2);
            search_section_container2.appendChild(button_search_container2);

            // tables section
            const head_tables_container2 = this.createFullElement('div', {id:'head_tables_container2', class:'bg-light-gray'});
            const body_tables_container2 = this.createFullElement('div', {id:'body_tables_container2'});
            const text_fields = {nombre:'Nombre', codigo:'Código'}
            const titles = Object.values(text_fields);

            titles.forEach(title => 
            {
                const t = this.createFullElement('p',{class:'fw-500 border-1 p-2 ps-3 pe-3'});
                t.textContent = title;
                head_tables_container2.appendChild(t);
            });

            tables_section_container2.appendChild(head_tables_container2);
            tables_section_container2.appendChild(body_tables_container2);

            // footer section
            const accept_footer_container2 = this.createFullElement('button', {type:'button',class:'p-2'});
            const close2_footer_container2 = this.createFullElement('button', {id:'close2_container2', type:'button', class:'p-2'});
            accept_footer_container2.textContent = 'Aceptar';
            close2_footer_container2.textContent = 'Cancelar';
            footer_section_container2.appendChild(accept_footer_container2);
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
                this.setDataSource(input_search_container.value).then(()=>{
                    this.setDataInputSearch2(input_search_container2, input_search_container.value);
                    this.search(input_search_container, input_description_container, body_tables_container2, text_fields, container2, input_search_container2,accept_footer_container2, inputv, false);
                });
            });
            input_description_container.addEventListener('dblclick', () => {
                button_search_container.click();
            })
            close_header_container2.addEventListener('click', () => {
                container2.classList.add('hide-element');
            });
            close2_footer_container2.addEventListener('click', () => {
                container2.classList.add('hide-element');
            });
            accept_footer_container2.addEventListener('click', () => {
                if (!this.record_selected || Object.entries(this.record_selected).length <= 0)
                {
                    alert("Debe seleccionar un registro para continuar");
                    return;
                }
                this.setValue(input_search_container, input_description_container, inputv);
                container2.classList.add('hide-element');
            });
            input_search_container.addEventListener('click', () => {
                input_search_container.select();
                input_search_container.focus();
            });
            input_search_container.addEventListener('blur', (e) => {
                if (container2.classList.contains('hide-element') && input_search_container.value.trim())
                {
                    this.setDataSource(input_search_container.value).then(()=>{
                        input_search_container2.value = input_search_container.value;
                        this.search(input_search_container, input_description_container, body_tables_container2, text_fields, container2, input_search_container2, accept_footer_container2, inputv, true);
                    });
                }
            });
            input_search_container.addEventListener('keyup', (e) => {
                if (e.key === 'Enter')
                    this.setDataSource(input_search_container.value).then(()=>{
                        input_search_container2.value = input_search_container.value;
                        this.search(input_search_container, input_description_container, body_tables_container2, text_fields, container2, input_search_container2, accept_footer_container2,inputv, true);
                    });
            });
            button_search_container2.addEventListener('click', () => {
                this.searchButton(input_search_container2, input_search_container, input_description_container, body_tables_container2, text_fields, container2, accept_footer_container2, inputv);
            });
            input_search_container2.addEventListener('keyup', (e) => {
                if (e.key === 'Enter')
                    this.searchButton(input_search_container2, input_search_container, input_description_container, body_tables_container2, text_fields, container2, accept_footer_container2, inputv);
            });
            search_container2.addEventListener('keyup', (e) => {
                if (e.key === 'Escape')
                    container2.classList.add('hide-element');
            });
            button_add_container.addEventListener('click', (e) => {
                e.stopPropagation();
                let url = this.prepareUrl((this.getAttribute('add-url')??''), input_search_container, input_description_container);
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
                let url = this.prepareUrl((this.getAttribute('edit-url')??''), input_search_container, input_description_container);
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
                    #head_tables_container2, .row_table{ display:grid; grid-template-columns: 60% 40%;}
                    .row_table:hover{background-color:#F5F5F5;color:#000;}
                    .row_selected{background-color:#3D75DD !important;color:#FFF !important;}
                </style>
            `;

            shadow.appendChild(container);
            shadow.appendChild(container2);
            shadow.appendChild(container3);
            shadow.appendChild(container4);
            this.after(inputv);
        });
    }

    createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    printTableData(body_table, datas, text_fields, accept_footer_container2)
    {
        body_table.innerHTML = ``;
        if (!datas || datas.length <= 0)
        { 
            body_table.innerHTML = `<p class="p-3 text-secondary">${(this.getAttribute('box-nodata-text')??'Sin registros')}</p>`; 
            return;
        }
        const fields = Object.keys(text_fields);
        if(!fields || fields.length <= 0) return;
        datas.forEach((data, i) => 
        {
            const row = this.createFullElement('div',{class:'row_table', value:`${data[this.getAttribute('data-search')]}`, tabindex:`0`});
            row.addEventListener('click', (e) => 
            {
                e.stopPropagation();
                this.getValue(e.target.parentNode.getAttribute('value'));
                e.target.parentNode.parentNode.childNodes.forEach(child => child.classList.remove('row_selected'));
                e.target.parentNode.classList.add('row_selected');
            });
            row.addEventListener('keyup', (e) => 
            {
                switch(e.key)
                {
                    case "ArrowRight":
                    case "ArrowDown":
                        if(e.target.nextElementSibling)e.target.nextElementSibling.focus();
                        else if(body_table.firstChild) body_table.firstChild.focus();
                        break;
                    case "ArrowLeft":
                    case "ArrowUp":
                        if(e.target.previousElementSibling)e.target.previousElementSibling.focus();
                        else if(body_table.lastChild) body_table.lastChild.focus();
                        break;
                    case "Enter":
                        accept_footer_container2.click();
                        break;
                }
            });
            row.addEventListener('focus', (e) => 
            {
                e.stopPropagation();
                this.getValue(e.target.getAttribute('value'));
                e.target.parentNode.childNodes.forEach(child => child.classList.remove('row_selected'));
                e.target.classList.add('row_selected');
            });
            fields.forEach(field => 
            {
                const cell = this.createFullElement('p',{class:'border-1 p-1 ps-2 pe-2'});
                cell.textContent = data[field];
                row.appendChild(cell);
            });
            body_table.appendChild(row);
        });

        return body_table;
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
                    this.getValue(id);
                    resolve();
                }, (dataFail) => {
                    alert("Ocurrió un error al invocar el servicio.\n\n" + dataFail);
                });
            }
            else if(this.hasAttribute('data-value'))
            {
                try{ this.data = JSON.parse(this.getAttribute('data-value')); }
                catch{ alert('El valor del atributo "data-value" tiene un formato JSON inválido'); }
                if (id && this.data){
                    this.data = this.data.filter(data => data[this.getAttribute('data-search')].includes(id));
                }
                this.getValue(id);
                resolve();
            }
            else
            {
                resolve();
            }
        });
    }
    getValue(id)
    {
        if (this.data)
        {
            this.record_selected = this.data.find(d => d[this.getAttribute('data-search')] == id);
        }
        return this.record_selected;
    }
    setValue(inputSearch, inputDesc, inputv)
    {
        if(!this.record_selected || Object.entries(this.record_selected).length <= 0)
        {
            inputSearch.value = '';
            inputDesc.value = '';
            this.setAttribute('value', '');
            inputv.setAttribute('value', '');

            return;
        }
        inputSearch.value = (this.record_selected[this.getAttribute('data-search')]??'');
        inputDesc.value = (this.record_selected[this.getAttribute('data-text')]??'');
        this.setAttribute('value', this.record_selected[this.getAttribute('data-key')]??'');
        inputv.setAttribute('value', this.record_selected[this.getAttribute('data-key')]??'');
    }
    search(inputSearch, inputDesc, body_tables_container2, text_fields, container2, input_search2, accept_footer_container2, inputv, autoselect=false)
    {
        if (this.data && this.data.length == 1 && this.record_selected && autoselect)
        {
            this.setValue(inputSearch, inputDesc, inputv);
        }
        else
        {
            this.printTableData(body_tables_container2, this.data , text_fields, accept_footer_container2);
            container2.classList.remove('hide-element');
            if(!this.data || this.data.length <= 0)
            {
                input_search2.select();
                input_search2.focus();
            }
            else
            {
                body_tables_container2.childNodes[0].focus();
            }
        }
    }
    searchButton(input_search_container2, input_search_container, input_description_container, body_tables_container2, text_fields, container2, accept_footer_container2, inputv)
    {
        if (input_search_container2.value.trim() == ""){
            alert("Debe especificar el texto a buscar para continuar");
            input_search_container2.focus();
            return;
        }
        if (!this.getAttribute('data-source')){
            alert('No se ha especificado una URL de origen para realizar la busqueda');
            return;
        }

        this.setDataSource(input_search_container2.value).then(()=>{
            this.search(input_search_container, input_description_container, body_tables_container2, text_fields, container2, input_search_container2, accept_footer_container2, inputv, false);
        });
    }
    setDataInputSearch2(inputsearch2, text)
    {
        inputsearch2.value = text;
        inputsearch2.select();
        inputsearch2.focus();
    }
    prepareUrl(url, inputSearch, inputText)
    {
        return url.replace('@search',inputSearch.value)
            .replace('@key',this.getAttribute('value')??'')
            .replace('@text', inputText.value);
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

customElements.define('edit-select', EditSelect);
customElements.define('input-key', InputKey);