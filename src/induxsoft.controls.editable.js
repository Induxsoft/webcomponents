class EditTable extends HTMLElement
{
    attributes = null;
    _table = null;
    _shadow = null;
    _current = null;
    
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
            this._shadow = this.attachShadow({ mode: 'closed' });
            
            this._shadow.innerHTML = `
                <style>
                    .EdiTable-Selector{
                        width: 100%;
                        height: 100%;
                        text-align: left;
                        background-color: rgba(255,255,255,.5);
                        cursor: text;
                        border: 1px solid #FFF;
                        border-radius: 3px;
                        outline: none;
                        padding: 3px;
                    }
                    .EdiTable-Input-Check{
                        height: 100%;
                    }
                    .EdiTable-Cell
                    {
                        height: 1.4rem;
                        padding: 4px;
                        outline: 1px solid #EDEDED;
                        position: relative;
                    }
                    .EdiTable-Row-Selected
                    {
                        background-color: #3D75DD !important;
                        color: #FFF !important;
                    }
                    
                    table{ width: 100%; font-size: 1rem; }
                    tbody tr:hover {
                        background-color: #F5F5F5;
                    }
                    thead {
                        background-color: #F5F5F5;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    thead tr th{
                        padding: 4px 8px;
                        outline: 1px solid #DDD;
                        font-weight: normal;
                        position: relative;
                    }
                    .Editable-Input-Number,
                    .Editable-Input-Text, 
                    .Editable-Input-Memo, 
                    .Editable-Input-Date, 
                    .Editable-Input-DateTime,
                    .Editable-Input-Select {
                        position: absolute;
                        top: 0;
                        left: 0;
                        box-sizing: border-box;
                        height: 100%;
                        border: none; outline:1px solid #ced4da;display: block;width: 100%;padding: 0.375rem 0.75rem;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-clip: padding-box;appearance: none;transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .Editable-Input-Select{
                        display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline:1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none;
                    }

                    .sizable-border {
                        position: absolute; 
                        top: 0; 
                        right: 0; 
                        width: 5px; 
                        cursor: col-resize;
                        background-color: transparent;
                    }

                    .induxsoft-formcontrols{border: none; outline:1px solid #ced4da;display: block;width: 100%;padding: 0.375rem 0.75rem;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-clip: padding-box;appearance: none;transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .induxsoft-formcontrols:disabled, .induxsoft-formcontrols[readonly] {background-color: #e9ecef;opacity: 1;
                    }
                    .induxsoft-buttons{display: inline-block;font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .induxsoft-buttons:hover{color: #212529;background-color: #F5F5F5;
                    }
                    .induxsoft-formselect {display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline:1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none;
                    }

                    ` + (this.getAttribute('control-styles') ?? '') + `
                </style>
            `;

            if (this.hasAttribute('data') && this.getAttribute('data').trim() != "")
            {
                try{ this.DataArray = JSON.parse(this.getAttribute('data')); }
                catch{ alert('El valor del atributo "data" tiene un formato JSON inválido'); this.DataArray = []; }
            }

            const container1 = this._createFullElement('div', { style:'min-height: 2rem; max-height: 100%; overflow: auto; padding-bottom: 5px' });
            this._table = this._getFullTable();
            container1.appendChild(this._table);
            this.innerHTML = '';
            this._shadow.appendChild(container1);
            
            
            
            this.Initialize(this._table.getAttribute('id'));
            this._processAtributesColumn();
            this._resizableGrid(this._table);
        });
    }

    _getFullTable=()=>
    {
        const table = this._createFullElement('table', { id:(this.getAttribute('id')??'f077fb41716141eeb7ecb1ed0a1ce292') });
        const thead = (this._replaceTagNameElement(this.querySelector('edit-thead'), 'thead') ?? this._createFullElement('thead'));
        const tbody = (this._replaceTagNameElement(this.querySelector('edit-tbody'), 'tbody') ?? this._createFullElement('tbody'));

        if (thead.hasChildNodes())
        {
            thead.querySelectorAll('*').forEach(e => { if (e.tagName.toLocaleLowerCase() != 'edit-tr' && e.tagName.toLocaleLowerCase() != 'edit-th') e.remove(); });

            thead.querySelectorAll('edit-tr').forEach(editTr => editTr.replaceWith(this._replaceTagNameElement(editTr, 'tr')));
            thead.querySelectorAll('tr').forEach(tr => {
                tr.querySelectorAll('edit-th').forEach(editTh => editTh.replaceWith(this._replaceTagNameElement(editTh, 'th')));
            });
        }

        if (tbody.hasChildNodes())
        {
            tbody.querySelectorAll('*').forEach(e => { if (e.tagName.toLocaleLowerCase() != 'edit-tr' && e.tagName.toLocaleLowerCase() != 'edit-td') e.remove(); });
            
            tbody.querySelectorAll('edit-tr').forEach(editTr => editTr.replaceWith(this._replaceTagNameElement(editTr, 'tr')));
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.querySelectorAll('edit-td').forEach(editTd => {
                    editTd.classList.add('EdiTable-Cell');
                    editTd.replaceWith(this._replaceTagNameElement(editTd, 'td'))
                });
            });
        }

        if (this.DataArray && this.DataArray.length > 0 && thead.hasChildNodes() && !tbody.hasChildNodes())
        {
            this.DataArray.forEach(data => {
                const tr = this._createFullElement('tr');
                thead.querySelectorAll('th').forEach(th => {
                    const td = this._createFullElement('td', { class:'EdiTable-Cell' });
                    Object.keys(data).forEach(key => {
                        if (td.textContent == '' && (th.getAttribute('field') == key || th.getAttribute('keyfield') == key))
                            td.textContent = data[key];
                    });
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });  
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }
    _replaceTagNameElement=(element, tagName)=>
    {
        if (!element) return null;

        let attributes = {};

        if (element.hasAttributes())
            element.getAttributeNames().forEach(attrName => attributes[attrName] = element.getAttribute(attrName));

        const newElement = this._createFullElement(tagName, attributes);
        newElement.innerHTML = element.innerHTML;

        return newElement;
    }
    _createFullElement=(tagName="div", attributes={})=>
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _processAtributesColumn=()=>
    {
        let listColumns = this._shadow.querySelectorAll('th');
        if (listColumns && listColumns.length > 0)
        {
            listColumns.forEach((column, i) => {
                let attributes = column.getAttributeNames();
                let settings = {};
                if (attributes && attributes.length > 0){
                    attributes.forEach(attr => {
                        settings[attr] = this._getAttributeColumn(attr, column.getAttribute(attr));
                    });
                }
                this.Columns[i] = settings;
            });
        }
    }
    _getAttributeColumn=(attr, value)=>
    {
        switch (attr)
        {
            case 'type':
            {
                value = eval('this.EdiTable.Const.Columns.Types.' + value);
                break;
            }
            case 'options':
            {
                value = JSON.parse(value);
                break;   
            }
        }
        return value;
    }
    _resizableGrid=(table)=>
    {
        const rows = table.querySelectorAll('tr');
        if (!rows || rows.length < 1) return;
        
        const cols = rows[0].querySelectorAll('th');
        if (!cols || cols.length < 1) return;
        
        cols.forEach(col => {
            const sizableBorder = this._createFullElement('div', { class:'sizable-border', style:`height:${table.offsetHeight}px;` });
            this._addSizableFunction(sizableBorder);
            col.appendChild(sizableBorder);
        });
    }
    _addSizableFunction=(element)=>
    {
        var pageX,curCol,nxtCol,curColWidth,nxtColWidth;
        element.addEventListener('mousedown', (e) => {
            curCol = e.target.parentElement;
            nxtCol = curCol.nextElementSibling;
            pageX = e.pageX;
            curColWidth = curCol.offsetWidth
            if (nxtCol)
                nxtColWidth = nxtCol.offsetWidth
        });
        document.addEventListener('mousemove', (e) => {
        if (curCol) {
            var diffX = e.pageX - pageX;
            if (nxtCol)
                nxtCol.style.width = (nxtColWidth - (diffX))+'px';
            curCol.style.width = (curColWidth + diffX)+'px';
        }
        });
        document.addEventListener('mouseup', (e) => { 
            curCol,nxtCol = undefined;
            nxtCol = undefined;
            pageX = undefined;
            nxtColWidth = undefined;
            curColWidth = undefined;
        });    
    }
    _getRowIndex=(tr)=>
    {
        let index = -1;
        let tbody = tr?.parentElement;
        if (tbody) tbody.querySelectorAll('tr').forEach((_tr, i) => { if (_tr === tr) index = i });
        return index;
    }
    _getCurren=(setnew=false)=>
    {
        if (!this._current || setnew)
            this._current = Object.assign({}, this);
        return this._current;
    }

    // ========================= EDITABLE FUNCTIONS
    
    _EdiTable = () => { return {
        Const : {
            HTML:{
                Selector:'<button id="__table_selector" class="EdiTable-Selector"></button>',
                Inputs:{
                    "Text":'<input type="text" id="__table_input" class="Editable-Input-Text"/>',
                    "Number":'<input type="number" id="__table_input" class="Editable-Input-Number"/>',
                    "Date":'<input type="date" id="__table_input" class="Editable-Input-Date"/>',
                    "DateTime":'<input type="datetime-local" id="__table_input" class="Editable-Input-DateTime"/>',
                    "Memo":'<textarea id="__table_input" class="Editable-Input-Memo"></textarea>',
                    "Select":'<select id="__table_input" class="Editable-Input-Select"/>',
                    "Check":'<input type="checkbox" id="__table_input" class="Editable-Input-Check"/>'
                },
                TR:"tr", 
                TD:"td",
                TABLE:"table",
                THEAD:"thead",
                TBODY:"tbody",
                TH:"th"
            },
            Columns:{
                Types:{
                    Text:"Text",
                    Number:"Number",
                    Date:"Date",
                    DateTime:"DateTime",
                    Memo:"Memo",
                    Check:"Check",
                    Select:"Select",
                    Custom:"Custom",
                    NoEditable:"NoEditable"
                }
            },
            Events:{
                EnterCell:"entercell",
                LeaveCell:"leavecell",
                StartEdition:"startedition",
                ConfirmEdition:"confirmedition",
                CancelEdition:"canceledition",
                InputCreated:"inputcreated",
                BeforeUpdateCell:"beforeupdatecell",
                BeforeSetInput:"beforesetinput",
                FieldUpdated:"fieldupdated",
                RowAdded:"rowadded"
            },
            SelectorId:"__table_selector",
            InputId:"__table_input"
        },
        focusedTable:null,
        Converts:{
            Boolean:{
                ToString:function(value)
                {
                    if (value) return "Sí";
                    return "No";
                },
                FromString:function(value)
                {
                    switch (value.trim().toLowerCase())
                    {
                        case "sí":
                        case "si":
                        case "s":
                        case "y":
                        case "yes":
                        case "ok":
                        case "1":
                        case "t":
                        case "on":
                        case "true":
                        case "cierto":
                            return true;
                    }
    
                    return false;
                }
            }
        },
        GetSelector:function()
        {
            return this._shadow.querySelector("#"+this.EdiTable.Const.SelectorId);
        }.bind(this),
        GetInput:function()
        {
            var input=this._shadow.querySelector("#"+this.EdiTable.Const.InputId);
            if (!input?.tagName)
                return undefined;
            
            return input;
        }.bind(this),
        GetInputValue:function(input, _current, columnDef)
        {
            var tag=input.tagName;
    
            if (tag==undefined)
            {
                return "";
            }
    
            switch(tag.toLowerCase())
            {
                case "input":
                    switch (input.getAttribute('type').toLowerCase())
                    {
                        case "checkbox":
                            return  columnDef.Converts.ToString(input.checked);
                        default:
                            return input.value;
                    }
                    break;
                case "textarea":
                    return input.value;
                case "select":
                    return input.value;
            }
    
            
        }.bind(this),
        SetInputVal: function (input, text, _current, columnDef)
        {
            switch(input.tagName.toLowerCase())
            {
                case "input":
                {
                    switch (input.getAttribute('type').toLowerCase())
                    {
                        case "checkbox":
                        {
                            input.checked = columnDef.Converts.FromString(text);
                            break;
                        }   
                    }
                    break;
                }
            }

            input.value = text;
        }.bind(this),
        SetSelectorKeyEventHandler:function(selector, _current)
        {
            const funct = (e) => {
                switch(e.key)
                {
                    case "Home":
                        if (e.ctrlKey)
                            _current.NavToHome();
                        else
                            _current.NavToFirstCell(_current.CurrentRowIndex());
                        break;
                    case "End":
                        if (e.ctrlKey)
                            _current.NavToEnd();
                        else
                            _current.NavToLastCell(_current.CurrentRowIndex());
                        break;
                    case "PageUp":
                        if (_current.CurrentRowIndex()-_current.PagOffSet<0)
                            _current.NavTo(0,_current.CurrentColIndex());
                        else
                            _current.NavTo(_current.CurrentRowIndex()-_current.PagOffSet,_current.CurrentColIndex());
                        break;
                    case "PageDown":
                        if (_current.CurrentRowIndex()+_current.PagOffSet>_current.TRCount()-1)
                            _current.NavTo(_current.TRCount()-1,_current.CurrentColIndex());
                        else
                            _current.NavTo(_current.CurrentRowIndex()+_current.PagOffSet,_current.CurrentColIndex());
                        break;
                    case "Insert":
                        if (_current.AutoDelRow && e.ctrlKey) _current.InsertRow(_current.CurrentRowIndex());
                        break;
                    case "F2":
                        setTimeout(function(){
                            _current.StartEdit(selector.parentElement,"");
                        },1);
                        break;
                    case "Delete":
                        if (_current.AutoDelRow && e.ctrlKey) _current.DeleteCurrentRow();
                        if (!e.ctrlKey)
                        {
                            setTimeout(function(){
                                _current.StartEdit(selector.parentElement,"",true);
                            },1);
                        }
                        break;
                    case "ArrowUp":
                        _current.NavUp(selector.parentElement);
                        break;
                    case "ArrowLeft":
                        _current.NavLeft(selector.parentElement);
                        break;
                    case "ArrowRight":
                        _current.NavRight(selector.parentElement);
                        break;
                    case "ArrowDown":
                    _current.NavDown(selector.parentElement);
                        break;
                    default:
                        if (e.key.trim().length==1)
                        {
                            setTimeout(function(){
                                _current.StartEdit(selector.parentElement,e.key);
                            },1);
                        }
                        break;
                }
                e.stopPropagation();
            }

            selector.removeEventListener('keydown', funct);
            selector.addEventListener('keydown', funct);
        }.bind(this),
        SetInputStdEventHandler:function(input, _current)
        {
            input.addEventListener("keydown",function(e){
                switch(e.key)
                {
                    case "ArrowUp":
                        _current.NavUp(input.parentElement);
                        e.stopPropagation();
                        break;
                    case "Escape":
                        _current.CancelEdit(input.parentElement);
                        e.stopPropagation();
                        break
                    case "Enter":
                        _current.NavRight(input.parentElement);
                        e.stopPropagation();
                        break;
                    case "ArrowLeft":
                        if (input.selectionStart==0 || input.getAttribute('type').toLowerCase()=="checkbox")
                        {
                            _current.NavLeft(input.parentElement);
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowRight":
                        if (input.selectionStart==input.value.length || input.getAttribute("type").toLowerCase()=="checkbox")
                        {
                            _current.NavRight(input.parentElement);
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowDown":
                        _current.NavDown(input.parentElement);
                        e.stopPropagation();
                        break;
                }
                
            });
        }.bind(this),
        SetInputTextareaEventHandler:function(input, _current)
        {
            input.addEventListener("keydown",function(e){
                switch(e.key)
                {
                    case "Escape":
                        _current.CancelEdit(input.parentElement);
                        e.stopPropagation();
                        break
                    case "Enter":
                        if (e.ctrlKey)
                        {
                            _current.NavRight(input.parentElement);
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowLeft":
                        if (input.selectionStart==0)
                        {
                            _current.NavLeft(input.parentElement);
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowRight":
                        if (input.selectionStart==input.value.length)
                        {
                            _current.NavRight(input.parentElement);
                            e.stopPropagation();
                        }
                        break;
                }
                
            });
        }.bind(this),
        SetInputSelectEventHandler:function(input, _current)
        {
            input.addEventListener("keydown",function(e){
                switch(e.key)
                {
                    case "Escape":
                        _current.CancelEdit(input.parentElement);
                        e.stopPropagation();
                        break
                    case "Enter":
                        if (e.ctrlKey)
                        {
                            _current.NavRight(input.parentElement);
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowLeft":
                        _current.NavLeft(input.parentElement);
                        e.stopPropagation();
                        break;
                    case "ArrowRight":
                        _current.NavRight(input.parentElement);
                        e.stopPropagation();
                        break;
                }
                
            });
        }.bind(this),
        SetInputEventHandler:function(input, _current)
        {
            input.addEventListener("click",function(e){
                e.stopPropagation();
            });
    
            switch(input.tagName.toLowerCase())
            {
                case "input":
                    this.EdiTable.SetInputStdEventHandler(input, _current);
                    break;
                case "textarea":
                    this.EdiTable.SetInputTextareaEventHandler(input, _current);
                    break;
                case "select":
                    this.EdiTable.SetInputSelectEventHandler(input, _current);
                    break;
            }
            
        }.bind(this)
    }};

    EdiTable = this._EdiTable();

    // ========================= EDITABLE WC FUNCTIONS

    Events = { };
    TheadRowIndex = 0;
    AutoAddRow = true;
    AutoDelRow = true;
    EverMove = true; //Si es true, deplazamiento a la izquierda en la primera celda sube una fila y se mueve a la última, a la derecha en la última baja una fila y va a la primer celda
    PagOffSet = 10; //Desplazamiento con AvPag PrevPag
    DataArray = []; //Contiene un array asociado a las filas
    ColumnsDefaultType = this.EdiTable.Const.Columns.Types.Text;
    CSS = {
        Cell:"EdiTable-Cell",
        RowSelected: "EdiTable-Row-Selected"
    };
    Initialize = (tableId) =>
    {
        let tds = this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+"#"+tableId+" "+this.EdiTable.Const.HTML.TD);
        tds.forEach(td => {
            td.addEventListener('click', (e) => {
                e.stopPropagation();
                this.CellFocus(td);
            });
        });
        this["tableId"]=tableId;
    }
    Columns=[];
    /**
     * 
     * @returns Retorna la referencia al elemento ***thead*** de la tabla.
     */
    GetTHead=()=>
    {
        return this._shadow.querySelector(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.THEAD);
    }
    /**
     * 
     * @returns Retorna la referencia ***tbody*** de la tabla.
     */
    GetTBody=()=>{
        var tbody= this._shadow.querySelector(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.TBODY);

        if (!tbody)
        {
            this._shadow.querySelector("#"+this.tableId).innerHTML = "<tbody></tbody>";
            tbody=this._shadow.querySelector(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.TBODY);
        }

        return tbody;
    }
    /**
     * 
     * @returns Retorna el **número** de columnas de la tabla.
     */
    ColumnsCount=()=>
    {
        var cols=this.THCount();

        if (cols<1)
            if (this.Columns)
                if (this.Columns.length>0)
                    cols=this.Columns.length;
        
        return cols;
    }
    /**
     * Mueve el selector a la primera columna y primera fila de la tabla.
     */
    NavToHome=()=>
    {
        this.NavTo(0,0);
    }
    /**
     * Mueve el selector a la última columna y última fila de la tabla.
     */
    NavToEnd=()=>
    {
        this.NavTo(this.TRCount()-1,this.ColumnsCount()-1);
    }
    /**
     * Mueve el selector a la primer columna de la fila especificada.
     * @param {Number} row Índice de la fila.
     */
    NavToFirstCell=(row)=>
    {
        this.NavTo(row,0);
    }
    /**
     * Mueve el selector a la última columna de la fila especificada.
     * @param {Number} row Índice de la fila.
     */
    NavToLastCell=(row)=>
    {
        this.NavTo(row,this.ColumnsCount()-1);
    }
    /**
     * Mueve el selector a la columna y fila especificada.
     * @param {Number} row Índice de la fila.
     * @param {Number} col Índice de la columna.
     */
    NavTo=(row, col)=>
    {
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || col>cols-1 || col<0 || row<0) return;
        
        let tbody=this.GetTBody();
        let td = tbody.querySelectorAll(this.EdiTable.Const.HTML.TR)[row].querySelectorAll(this.EdiTable.Const.HTML.TD)[col];
        this.CellFocus( td );
    }
    /**
     * @param {Number} row Índice de la fila.
     * @returns Retorna la referencia al elemento ***tr*** de la fila especificada.
     */
    GetTrByIndex=(row)=>
    {
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || row<0) return undefined;
        
        let tbody=this.GetTBody();

        return tbody.querySelectorAll(this.EdiTable.Const.HTML.TR)[row];
    }
    /**
     * Elimina la fila seleccionada.
     */
    DeleteCurrentRow=()=>
    {
        let col=this.CurrentColIndex();
        let row=this.CurrentRowIndex();

        if (this.DeleteRow(row))
            this.NavTo(row,col);
    }
    /**
     * Elimina la fila especificada.
     * @param {Number} row Índice de la fila a eliminar.
     * @returns Retorna ***true*** si la fila fué eliminada, en caso contrario: ***false***.
     */
    DeleteRow=(row)=>
    {
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || row<0) return false;

        this.GetTrByIndex(row).remove();
        this.DataArray.splice(row, 1);
        return true;
    }
    /**
     * Actualiza los valores que se muestran de la fila especificada.
     * @param {Number} row Índice de la fila.
     * @returns Retorna ***true*** si se completó la tarea, en caso contrario: ***false***.
     */
    UpdateRow=(row)=>
    {
        let tr=this.GetTrByIndex(row);

        if (tr==undefined) return false;
        var tds=tr.querySelectorAll(this.EdiTable.Const.HTML.TD);

        if (tds==undefined) return false;

        for(let i=0;i<this.TDCount(tr);i++)
        {
            if (this.Columns[i]!=undefined)
            {
                if (this.Columns[i].field!=undefined)
                    tds[i].innerHTML = (this.DataArray[row][this.Columns[i].field] ?? '');
            }
        }

        return true;
    }
    /**
     * Actualiza los objetos del dataArray con los valores todas las filas de la tabla.
     */
    UpdateData=()=>
    {
        for(let i=0;i<this.TRCount();i++)
            this.UpdateDataRow(i);
    }
    /**
     * Actualiza el objeto del dataArray con el valor de la fila especificada.
     * @param {Number} row Índice de la fila.
     * @returns Retorna ***true*** si se completó la tarea, en caso contrario: ***false***.
     */
    UpdateDataRow=(row)=>
    {
        let tr=this.GetTrByIndex(row);

        if (tr==undefined) return false;
        var tds=tr.querySelectorAll(this.EdiTable.Const.HTML.TD);

        if (tds==undefined) return false;

        for(let i=0;i<this.TDCount(tr);i++)
        {
            if (this.Columns[i]!=undefined)
            {
                if (this.Columns[i].field!=undefined)
                {
                    if (tds[i]==this.CurrentTd()[0])
                    {
                        if (!this.Editing)
                        {
                            this.UpdateDataMember(row,this.Columns[i].field,this.EdiTable.GetSelector().innerHTML);
                        }
                    }
                    else
                    {
                        this.UpdateDataMember(row,this.Columns[i].field,tds[i].innerHTML);
                    }
                }
            }
        }

        return true;
    }
    /**
     * 
     * @param {Number} row Índice de la fila.
     * @param {String} field Nombre del campo a actualizar.
     * @param {String} value Valor del campo a actualizar.
     * @param {Boolean} stopfire Detiene la ejecución del evento descendiente *FieldUpdated* del elemento en cuestión.
     * @returns Retorna la información del **objeto** de la fila especificada.
     */
    UpdateDataMember=(row, field, value, stopfire = false)=>
    {
        if (this.DataArray[row]==undefined)
            this.DataArray[row]={};

        if (field!=undefined && value!=undefined)
        {
            this.DataArray[row][field]=value;
            var eventArgs={
                sender:this._getCurren(),
                row:row,
                field:field,
                value:value
            };
            
            if (this._getCurren().Events[this.EdiTable.Const.Events.FieldUpdated]!=undefined && !stopfire)
                this._getCurren().Events[this.EdiTable.Const.Events.FieldUpdated](eventArgs);
        }

        return this.DataArray[row];
    }
    /**
     * Agrega una nueva fila a la tabla.
     */
    AddRow=()=>
    {
        return this.InsertRow();
    }
    /**
     * Crea una nueva fila en el índice especificado.
     * @param {Number} rw índice de la nueva fila.
     * @param {Boolean} nofocus Bloquea la selcción y foco automático al crear la fila.
     */
    InsertRow=(rw, nofocus = false)=>
    {
        var tbody=this.GetTBody();
        var cols=this.ColumnsCount();
        
        if (rw!=undefined)
        {
            this.DataArray.splice(rw,0,{});
        }

        if (cols<1)
            return;

        if (tbody)
        {
            var nr=tbody.insertRow(rw);
            var indexRow=this._getRowIndex(nr);

            for (let i=0;i<cols;i++)
            {
                let cell=nr.insertCell();
                let coldef=this.Columns[i];

                if (this.CSS.Cell)
                    cell.classList.add(this.CSS.Cell);

                    if (coldef!=undefined)
                        if (coldef.default!=undefined)
                        {
                            this.UpdateDataMember(indexRow,coldef.field,coldef.default,true)
                            cell.append(coldef.default);
                        }
            }
            const clickFunct = (e) => {
                e.stopPropagation();
                this.CellFocus(e.target);
            }
            this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.TD).forEach(td => {
                td.removeEventListener('click', clickFunct);
                td.addEventListener('click', clickFunct);
            });

            if (!nofocus)
                this.CellFocus(nr.cells[0]);
            
            var eventArgs={
                sender:this._getCurren(),
                tr:nr,
                rowIndex:indexRow,
            };

            if (this._getCurren().Events[this.EdiTable.Const.Events.RowAdded]!=undefined)
                this._getCurren().Events[this.EdiTable.Const.Events.RowAdded](eventArgs);
        }
    }
    /**
     * @returns Retorna el **número** de filas del elemento *tbody* de la tabla.
     */
    TRCount=()=>
    {
        var tbody=this.GetTBody();
        if (tbody)
        {
            let trs=tbody.querySelectorAll(this.EdiTable.Const.HTML.TR);
            if (trs)
                if (trs) return trs.length;
        }

        return 0;
    }
    /**
     * 
     * @returns Retorna el **número** de columnas del elemento *thead* de la tabla.
     */
    THCount=()=>
    {
        var thead=this.GetTHead();
        if (thead)
        {
            let tr=thead.querySelectorAll(this.EdiTable.Const.HTML.TR)[this.TheadRowIndex];

            if (tr)
            {
                let ths=tr.querySelectorAll(this.EdiTable.Const.HTML.TH);
                if (ths) return ths.length;
            }
        }

        return 0;
    }
    /** 
     * @param {HTMLTableRowElement} tr Referencia a una fila *tr* de la tabla.
     * @returns Retorna el **número** de celdas *td* de la fila especificada.
     */
    TDCount=(tr)=>
    {
        if (tr)
        {
            let tds=tr.querySelectorAll(this.EdiTable.Const.HTML.TD);
            if (tds) return tds.length;
        }

        return 0;
    }
    /**
     * @returns Retorna la **celda** *td* actualmente seleccionada.
     */
    CurrentTd=()=>
    {
        if (this.EdiTable.focusedTable!=this._getCurren())
            return null;
        
        var selector=undefined;
        
        if (this.Editing)
        {
            selector=this.EdiTable.GetInput();
            if (selector==undefined)
                selector=this.EdiTable.GetSelector();
        }
        else
        {
            selector=this.EdiTable.GetSelector();
        }

        if (selector==undefined)
            return null;

        if (selector==null)
            return null;

        return selector.parentElement;
        
    }
    /**
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @returns Retorna el elemento ***tr*** de la celda especificada.
     */
    TrOfTd=(td)=>
    {
        if (td==undefined)
            return null;

        if (td==null)
            return null;
        
        return td.parentElement;
    }
    /**
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @returns Retorna el **índice** del elemento *tr* de la celda especificada, -1 si la celda es *undefined* o *null*.
     */
    RowIndexOfTd=(td)=>
    {
        if (td==undefined)
            return -1;

        if (td==null)
            return -1;
        
        return this._getRowIndex(td.parentElement);
    }
    /**
     * @returns Retorna el **índice** de la fila *tr* de la celda *td* actualmente seleccionada, -1 si no hay niguna celda selccionada.
     */
    CurrentRowIndex=()=>
    {
        let current_td=this.CurrentTd();
        if (current_td==null)
            return -1;
        
        return this._getRowIndex(current_td.parentElement);
    }
    /**
     * 
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @returns Retorna el **índice** de la celda *td* especificada en relación a su fila *tr*, -1 si la celda es *undefined*, *null*, o no pertenece a una fila *tr*.
     */
    ColIndexOfTd=(td)=>
    {
        if (td==undefined)
            return -1;

        if (td==null)
            return -1;
        
        return td.cellIndex;
    }
    /**
     * @returns Retorna el **índice** de la celda *td* actualmente seleccionada en relación a su fila, -1 si la celda es *null*, o no pertenece a una fila *tr*.
     */
    CurrentColIndex=()=>
    {
        let current_td=this.CurrentTd();

        if (current_td==null)
            return -1;
        
        return current_td.cellIndex;
    }
    /**
     * Ejecuta el evento LeaveCell de la celda especificada.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    LeaveCell=(td)=>
    {
        if (this._getCurren().Events[this.EdiTable.Const.Events.LeaveCell]==undefined)
        return;

        var eventArgs={
            td:td,
            sender:this._getCurren(),
        };

        this._getCurren().Events[this.EdiTable.Const.Events.LeaveCell](eventArgs);
    }
    /**
     * Ejecuta el evento EnterCell de la celda especificada.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    EnterCell=(td)=>
    {
        
        if (this._getCurren().Events[this.EdiTable.Const.Events.EnterCell]==undefined)
        return;

        var eventArgs={
            td:td,
            sender:this._getCurren(),
        };

        this._getCurren().Events[this.EdiTable.Const.Events.EnterCell](eventArgs);
    }
    Editing=false;
    /**
     * @returns Retorna información del **objeto** de la columna actualmente seleccionada.
     */
    GetColumnDef=()=>
    {
        let columnDef=this.Columns[this.CurrentColIndex()];
        if (columnDef==undefined)
            columnDef={type:this.ColumnsDefaultType};

        if (columnDef.type==undefined)
                columnDef.type=this.ColumnsDefaultType;

        if (columnDef.type==this.EdiTable.Const.Columns.Types.Check)
        {
            if (columnDef["Converts"]==undefined)
                columnDef["Converts"]=this.EdiTable.Converts.Boolean;
        }
        return columnDef;
    }
    /**
     * @param {Number} td índice de la celda *td*.
     * @returns Retorna información del **objeto** de la columna *td* especificada.
     */
    GetColumnDefOfTd=(td)=>
    {
        let columnDef=this.Columns[this.ColIndexOfTd(td)];
        if (columnDef==undefined)
            return null;

        return columnDef;
    }
    /**
     * Se preparan los datos y eventos descendientes al iniciar la edición de un elemento *td*.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @param {String} text Texto que se pasará como parámetro en los eventos descendientes.
     * @param {*} clear Si se establece el valor de *text* será vacio.
     */
    StartEdit=(td,text,clear)=>
    {
        
        let columnDef=this.GetColumnDef();
        
        if (columnDef.type==this.EdiTable.Const.Columns.Types.NoEditable)
            return;

        this.Editing=true;
        
        if (this.Events[this.EdiTable.Const.Events.StartEdition]!=undefined)
        {
            var eventArgs={
                td:td,
                sender:this._getCurren(),
                coldef:columnDef,
                text:text
            };

            this._getCurren().Events[this.EdiTable.Const.Events.StartEdition](eventArgs);
        }

        if (columnDef.type==this.EdiTable.Const.Columns.Types.Custom)
        {
            this.Editing=false;
            return;
        }

        let selector=this.EdiTable.GetSelector();

        this["temp_html"]=selector.innerHTML;

        if (text==undefined)
            text=selector.textContent;

        if (text.trim()==="")
            text=selector.textContent;

        if (clear)
            text="";
        
        selector.style.display = 'none';

        switch(columnDef.type)
        {
            case this.EdiTable.Const.Columns.Types.Memo:
                td.innerHTML = this.EdiTable.Const.HTML.Inputs.Memo;
                break;
            case this.EdiTable.Const.Columns.Types.Date:
                td.innerHTML = this.EdiTable.Const.HTML.Inputs.Date;
                break;
            case this.EdiTable.Const.Columns.Types.DateTime:
                td.innerHTML = this.EdiTable.Const.HTML.Inputs.DateTime;
                break;
            case this.EdiTable.Const.Columns.Types.Select:
                td.innerHTML = this.EdiTable.Const.HTML.Inputs.Select;
                break;
            case this.EdiTable.Const.Columns.Types.Check:
                td.innerHTML = this.EdiTable.Const.HTML.Inputs.Check;
                break;
            case this.EdiTable.Const.Columns.Types.Number:
                td.innerHTML = this.EdiTable.Const.HTML.Inputs.Number;
                break;
            case this.EdiTable.Const.Columns.Types.Text:
                td.innerHTML = this.EdiTable.Const.HTML.Inputs.Text;
                break;
        }
        let input=this.EdiTable.GetInput();

        if (columnDef.type==this.EdiTable.Const.Columns.Types.Select && columnDef.options!=undefined)
        {
            Object.entries(columnDef.options).forEach(([key, value]) => {
                const option = this._createFullElement('option');
                option.value = key;
                option.textContent = value;
                input.appendChild(option);
            });

            if (columnDef.keyfield!=undefined)
            {
                if (this.DataArray[this.RowIndexOfTd(td)]!=undefined)
                    if (this.DataArray[this.RowIndexOfTd(td)][columnDef.keyfield]!=undefined)
                        text=this.DataArray[this.RowIndexOfTd(td)][columnDef.keyfield];
            }
        }

        var eventArgs={
            input:input,
            td:td,
            sender:this._getCurren(),
            text:text,
            coldef:columnDef
        };

        if (this._getCurren().Events[this.EdiTable.Const.Events.InputCreated]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.InputCreated](eventArgs);

        
        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput](eventArgs);
        
        this.EdiTable.SetInputVal(input, eventArgs.text, this._getCurren(), columnDef);

        input.focus();
        this.EdiTable.SetInputEventHandler(input,this._getCurren()); 
                                
    }
    /**
     * Actualiza los valores de la columna modificada en el dataArray e inicializa sus eventos descendientes.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @param {String} displayText Texto que se pasará como parámetro en los eventos descendientes.
     * @returns Retorna ***true*** si se culminó la edición, en caso contrario: ***false***.
     */
    ConfirmEdit=(td,displayText)=>
    {
        if (!this.Editing)
            return true;
        
        var columnDef=this.GetColumnDef();

        this.Editing=false;

        let input=this.EdiTable.GetInput();
        var eventArgs={
            input:input,
            text:displayText,
            td:td,
            sender:this._getCurren(),
            coldef:columnDef,
            cancel:false
        };

        if (input!=undefined)
        {
            eventArgs.text=this.EdiTable.GetInputValue(input, this._getCurren(), columnDef);

            if (columnDef.keyfield!=undefined && columnDef.type==this.EdiTable.Const.Columns.Types.Select)
            {
                var combo=input;
                if (combo.selectedIndex<0)
                    eventArgs.text="";
                else
                    eventArgs.text=combo.options[combo.selectedIndex].text;
                    
                this.UpdateDataMember (this.RowIndexOfTd(eventArgs.td),columnDef.keyfield,input.value);
            }

            if (this.Events[this.EdiTable.Const.Events.BeforeUpdateCell]!=undefined)
                this.Events[this.EdiTable.Const.Events.BeforeUpdateCell](eventArgs);

            if (eventArgs.cancel)
            {
                this.Editing=true;
                return false;
            }

            input.remove();
            eventArgs.input=undefined;
        }

        if (this._getCurren().Events[this.EdiTable.Const.Events.ConfirmEdition]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.ConfirmEdition](eventArgs);
        
        if (eventArgs.cancel)
            return false;
        
        td.innerHTML = eventArgs.text;
        this.UpdateDataMember(this.RowIndexOfTd(td),columnDef.field,eventArgs.text);

        return true;
    }
    /**
     * Cancela la edición de la celda *td* especificada y restablece su valor.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    CancelEdit=(td)=>
    {
        if (!this.Editing)
            return;

        this.Editing=false;

        let input=this.EdiTable.GetInput();

        if (input!=undefined)
        {
            input.remove();

            if (this["temp_html"]!=undefined && this.EdiTable.focusedTable==this._getCurren())
            {
                td.innerHTML = this["temp_html"];
            }

            this.CellFocus(td);
        }

        if (this.Events[this.EdiTable.Const.Events.CancelEdition]!=undefined)
        {
            var eventArgs={
                td:td,
                sender:this._getCurren(),
            };

            this._getCurren().Events[this.EdiTable.Const.Events.CancelEdition](eventArgs);
        }
    }
    /**
     * Establece el foco a la celda *td* especificada.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    CellFocus=(td)=>
    {
        let selector=this.EdiTable.GetSelector();
        let input=this.EdiTable.GetInput();

        if (input!=undefined)
        {
            if (this.EdiTable.focusedTable!=null)
            {
                if (!this.EdiTable.focusedTable.ConfirmEdit(input.parentElement)) return;
            }
            else
                input.remove();
        }

        if (selector!=undefined)
        {
            selector.parentElement.innerHTML = selector.innerHTML;
            if (this.EdiTable.focusedTable!=null)
            {
                this.LeaveCell(selector.parentElement);
            }

            selector.remove();
        }
        
        let txt=td.innerHTML;
        td.innerHTML = this.EdiTable.Const.HTML.Selector;
        
        selector=this.EdiTable.GetSelector();
        selector.innerHTML = txt;
        this.EdiTable.focusedTable=this._getCurren(true);

        selector.focus();
        this.EnterCell(selector.parentElement);

        const clickFunc = (e) => {
            e.stopPropagation();
            this.StartEdit(selector.parentElement,"");  
        }
        selector.removeEventListener('click', clickFunc);
        selector.addEventListener('click', clickFunc);

        this.EdiTable.SetSelectorKeyEventHandler(selector, this._getCurren());
        if (this.CSS.RowSelected)
        {
            let trs = td.parentElement.parentElement.querySelectorAll('tr');
            if (trs && trs.length > 0) trs.forEach(tr => tr.classList.remove(this.CSS.RowSelected));
            td.parentElement.classList.add(this.CSS.RowSelected);
        }
    }
    /**
     * Mueve el selector una celda hacia arriba de la celda *td* especificada.
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     */
    NavUp=(active_cell)=>
    {
        let active_cell_index=active_cell.cellIndex;
        let parent_tr = active_cell.parentElement;
        let parent_tbody = active_cell.parentElement.parentElement;
        let target_tr = parent_tbody?.querySelectorAll(this.EdiTable.Const.HTML.TR)[(this._getRowIndex(parent_tr) - 1)];
        let target_cell = target_tr?.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell_index];
        if( this._getRowIndex(parent_tr) != 0 ) 
            this.CellFocus(target_cell);
    }
    /**
     * Mueve el selector hacia la izquierda de la celda *td* especificada.
     * Si la propiedad *EverMove* está establecida en *true* y el indice de la celda *td* especificada es igual a 0 o es la primera de la fila el selector subirá una fila y se posicionará al final de ésta.
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     */
    NavLeft=(active_cell)=>
    {
        let active_cell_index=active_cell.cellIndex;
        if (active_cell_index==0)
        {
            if (!this.EverMove)
                return;
            
            this.NavUp(active_cell);
            this.NavToLastCell(this.CurrentRowIndex());
            return;
        }

        let parent_tr = active_cell.parentElement;
        let target_cell = parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell_index-1];
        this.CellFocus(target_cell);
    }
    /**
     * Mueve el selector hacia la derecha de la celda *td* especificada.
     * Si la propiedad *EverMove* está establecida en *true* y la celda *td* especificada es la última de la fila el selector bajará una fila y se posicionará al principio de ésta.
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     * @returns 
     */
    NavRight=(active_cell)=>
    {
        let active_cell_index=active_cell.cellIndex;

        let parent_tr = active_cell.parentElement;
        
        if (active_cell_index==parent_tr.querySelectorAll('td').length-1)
        {
            if (!this.EverMove)
                return;
            
            this.NavDown(active_cell);
            this.NavToFirstCell(this.CurrentRowIndex());
            return;
        }

        let target_cell = parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell_index+1];
        this.CellFocus(target_cell);
    }
    /**
     * Mueve el selector una celda hacia abajo de la celda *td* especificada.
     * Si no hay más celdas por bajar y la propiedad *AutoAddRow* está establecida en *true* se agregará una fila nueva hacia abajo de la tabla
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     */
    NavDown=(active_cell)=> 
    {
        let active_cell_index=active_cell.cellIndex;
        let parent_tr = active_cell.parentElement;
        let parent_tbody = active_cell.parentElement.parentElement;
        let target_tr = parent_tbody?.querySelectorAll(this.EdiTable.Const.HTML.TR)[(this._getRowIndex(parent_tr) + 1)];
        let target_cell = target_tr?.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell_index];
        if( target_tr!=undefined) 
            this.CellFocus(target_cell);
        else
        {
            if (this.AutoAddRow)
                this.AddRow();
        }
    }
}

customElements.define('edit-table', EditTable);