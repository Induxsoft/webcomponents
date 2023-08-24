class EditTable extends HTMLElement
{
    attributes = null;
    _table = null;
    _shadow = null;

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
            const ttemp = this._createFullElement('table');
            
            ttemp.innerHTML = this.innerHTML;

            this._table = this._createFullElement('table', { id:(this.getAttribute('id')??'f077fb41716141eeb7ecb1ed0a1ce292') });
            const thead = (ttemp.querySelector('thead') ?? this._createFullElement('thead'));
            const tbody = (ttemp.querySelector('tbody') ?? this._createFullElement('tbody'));

            
            this._table.appendChild(thead);
            this._table.appendChild(tbody);

            // this._shadow.innerHTML = `
            //     <style>
            //         .EdiTable-Selector{
            //             width: 100% !important;
            //             height: 100% !important;
            //             text-align: left !important;
            //             background-color: rgba(255,255,255,.5) !important;
            //             cursor: text !important;
            //             border: 1px solid #FFF !important;
            //             border-radius: 3px !important;
            //             outline: none !important;
            //         }
            //         .EdiTable-Input-Check{
            //             height: 100% !important;
            //         }
            //         .EdiTable-Cell
            //         {
            //             height: 1.4rem !important;
            //             padding: 2px 6px !important;
            //             outline: 1px solid #EDEDED !important;
            //             position: relative !important;
            //         }
            //         .EdiTable-Row-Selected
            //         {
            //             background-color: #3D75DD !important;
            //             color: #FFF !important;
            //         }
                    
                    
            //         tbody tr:hover {
            //             background-color: #F5F5F5;
            //         }
            //         thead {
            //             background-color: #F5F5F5 !important;
            //         }
            //         thead tr th{
            //             padding: 4px 8px !important;
            //             outline: 1px solid #DDD !important;
            //             font-weight: normal !important;
            //         }
            //         .Editable-Input-Number,
            //         .EdiTable-Input-Text, 
            //         .EdiTable-Input-Memo, 
            //         .EdiTable-Input-Date, 
            //         .EdiTable-Input-DateTime,
            //         .EdiTable-Input-Select {
            //             width: 100% !important;
            //             height: 100% !important;
            //             position: absolute !important;
            //             top: 0 !important;
            //             left: 0 !important;
            //             z-index: 100 !important;
            //         }
            //     </style>
            // `;
            
            this._shadow.appendChild(this._table);

            this.Initialize(this._table.getAttribute('id'));
        });
    }

    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _processAtributesColumn(listColumns)
    {
        if (listColumns && listColumns.length > 0)
        {
            listColumns.forEach(column => {
                let attributes = column.getAttributeNames();
                if (attributes && attributes.length > 0){
                    attributes.forEach(attr => {

                    });
                }
            });
        }
    }

    // ===========================================
    
    EdiTable= () => { return {
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
            return this._shadow.querySelector("#"+this.EdiTable().Const.SelectorId);
        }.bind(this),
        GetInput:function()
        {
            var input=this._shadow.querySelector("#"+this.EdiTable().Const.InputId);
            if (input && input.tagName==undefined)
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
                    switch (input.getAttribute('type').toLowerCase())
                    {
                        case "checkbox":
                            input.checked = columnDef.Converts.FromString(text);
                            break;
                    }
    
                    break;
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
                        _current.NavUp(this.parentElement);
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
                    this.EdiTable().SetInputStdEventHandler(input, _current);
                    break;
                case "textarea":
                    this.EdiTable().SetInputTextareaEventHandler(input, _current);
                    break;
                case "select":
                    this.EdiTable().SetInputSelectEventHandler(input, _current);
                    break;
            }
            
        }.bind(this)
    }};

    // ========================= EdiTable Functions

    Events = { };
    TheadRowIndex = 0;
    AutoAddRow = true;
    AutoDelRow = true;
    EverMove = true; //Si es true, deplazamiento a la izquierda en la primera celda sube una fila y se mueve a la última, a la derecha en la última baja una fila y va a la primer celda
    PagOffSet = 10; //Desplazamiento con AvPag PrevPag
    DataArray = []; //Contiene un array asociado a las filas
    ColumnsDefaultType = this.EdiTable().Const.Columns.Types.Text;
    CSS = {
        Cell:"EdiTable-Cell",
        RowSelected: "EdiTable-Row-Selected"
    };

    Initialize(tableId)
    {
        let tds = this._shadow.querySelectorAll(this.EdiTable().Const.HTML.TABLE+"#"+tableId+" "+this.EdiTable().Const.HTML.TD);
        tds.forEach(td => {
            td.addEventListener('click', (e) => {
                e.stopPropagation();
                this.CellFocus(td);
            });
        });
        this["tableId"]=tableId;
    }
    Columns=[];
    GetTHead()
    {
        return this._shadow.querySelector(this.EdiTable().Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable().Const.HTML.THEAD);
    }
    GetTBody(){
        var tbody= this._shadow.querySelector(this.EdiTable().Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable().Const.HTML.TBODY);

        if (tbody.length==0)
        {
            this._shadow.querySelector("#"+this.tableId).innerHTML = "<tbody></tbody>";
            tbody=this._shadow.querySelector(this.EdiTable().Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable().Const.HTML.TBODY);
        }

        return tbody;
    }
    ColumnsCount()
    {
        var cols=this.THCount();

        if (cols<1)
            if (this.Columns)
                if (this.Columns.length>0)
                    cols=this.Columns.length;
        
        return cols;
    }
    NavToHome()
    {
        this.NavTo(0,0);
    }
    NavToEnd()
    {
        this.NavTo(this.TRCount()-1,this.ColumnsCount()-1);
    }
    NavToFirstCell(row)
    {
        this.NavTo(row,0);
    }
    NavToLastCell(row)
    {
        this.NavTo(row,this.ColumnsCount()-1);
    }
    NavTo(row, col)
    {
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || col>cols-1 || col<0 || row<0) return;
        
        let tbody=this.GetTBody();
        let td = tbody.querySelectorAll(this.EdiTable().Const.HTML.TR)[row].querySelectorAll(this.EdiTable().Const.HTML.TD)[col];
        this.CellFocus( td );
    }
    GetTrByIndex(row)
    {
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || row<0) return undefined;
        
        let tbody=this.GetTBody();

        return tbody.querySelectorAll(this.EdiTable().Const.HTML.TR)[row];
    }
    DeleteCurrentRow()
    {
        let col=this.CurrentColIndex();
        let row=this.CurrentRowIndex();

        if (this.DeleteRow(row))
            this.NavTo(row,col);
    }
    DeleteRow(row)
    {
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || row<0) return false;

        if (this.GetTrByIndex(row).remove())
        {
            this.DataArray.splice(row, 1);
            return true;
        }

        return false;
    }
    UpdateRow(row)
    {
        let tr=this.GetTrByIndex(row);

        if (tr==undefined) return false;
        var tds=tr.querySelectorAll(this.EdiTable().Const.HTML.TD);

        if (tds==undefined) return false;

        for(i=0;i<this.TDCount(tr);i++)
        {
            if (this.Columns[i]!=undefined)
            {
                if (this.Columns[i].field!=undefined)
                    tds[i].innerHTML = this.DataArray[row][this.Columns[i].field];
            }
        }

        return true;
    }
    UpdateData()
    {
        for(i=0;i<this.TRCount();i++)
            this.UpdateDataRow(i);
    }
    UpdateDataRow(row)
    {
        let tr=this.GetTrByIndex(row);

        if (tr==undefined) return false;
        var tds=tr.querySelectorAll(this.EdiTable().Const.HTML.TD);

        if (tds==undefined) return false;

        for(i=0;i<this.TDCount(tr);i++)
        {
            if (this.Columns[i]!=undefined)
            {
                if (this.Columns[i].field!=undefined)
                {
                    if (tds[i]==this.CurrentTd()[0])
                    {
                        if (!this.Editing)
                        {
                            this.UpdateDataMember(row,this.Columns[i].field,this.EdiTable().GetSelector().innerHTML);
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
    UpdateDataMember(row, field, value, stopfire = false)
    {
        if (this.DataArray[row]==undefined)
            this.DataArray[row]={};

        if (field!=undefined && value!=undefined)
        {
            this.DataArray[row][field]=value;
            var eventArgs={
                sender:this,
                row:row,
                field:field,
                value:value
            };

            if (this.Events[this.EdiTable().Const.Events.FieldUpdated]!=undefined && !stopfire)
                this.Events[this.EdiTable().Const.Events.FieldUpdated](eventArgs);
        }

        return this.DataArray[row];
    }
    AddRow()
    {
        return this.InsertRow();
    }
    InsertRow(rw, nofocus = false)
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
            console.log(tbody.querySelectorAll('tr')[0]);
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
                this.CellFocus(this);
            }
            this._shadow.querySelectorAll(this.EdiTable().Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable().Const.HTML.TD).forEach(td => {
                td.removeEventListener('click', clickFunct);
                td.addEventListener('click', clickFunct);
            });

            if (!nofocus)
                this.CellFocus(nr.cells[0]);
            
            var eventArgs={
                sender:this,
                tr:nr,
                rowIndex:indexRow,
            };

            if (this.Events[this.EdiTable().Const.Events.RowAdded]!=undefined)
                this.Events[this.EdiTable().Const.Events.RowAdded](eventArgs);
        }
    }
    TRCount()
    {
        var tbody=this.GetTBody();
        if (tbody)
        {
            let trs=tbody.querySelectorAll(this.EdiTable().Const.HTML.TR);
            if (trs)
                if (trs) return trs.length;
        }

        return 0;
    }
    THCount()
    {
        var thead=this.GetTHead();
        if (thead)
        {
            let tr=thead.querySelectorAll(this.EdiTable().Const.HTML.TR)[this.TheadRowIndex];

            if (tr)
            {
                let ths=tr.querySelectorAll(this.EdiTable().Const.HTML.TH);
                if (ths) return ths.length;
            }
        }

        return 0;
    }
    TDCount(tr)
    {
        if (tr)
        {
            let tds=tr.querySelectorAll(this.EdiTable().Const.HTML.TD);
            if (tds) return tds.length;
        }

        return 0;
    }
    CurrentTd()
    {
        if (this.EdiTable().focusedTable!=this)
            return null;
        
        var selector=undefined;

        if (this.Editing)
        {
            selector=this.EdiTable().GetInput();
            if (selector==undefined)
                selector=this.EdiTable().GetSelector();
        }
        else
        {
            selector=this.EdiTable().GetSelector();
        }

        if (selector==undefined)
            return null;

        if (selector==null)
            return null;

        return selector.parentElement;
        
    }
    TrOfTd(td)
    {
        if (td==undefined)
            return null;

        if (td==null)
            return null;
        
        return td.parentElement;
    }
    RowIndexOfTd(td)
    {
        if (td==undefined)
            return -1;

        if (td==null)
            return -1;
        
        return this._getRowIndex(td.parentElement);
    }
    CurrentRowIndex()
    {
        let current_td=this.CurrentTd();

        if (current_td==null)
            return -1;
        
        return this._getRowIndex(current_td.parentElement);
    }
    ColIndexOfTd(td)
    {
        if (td==undefined)
            return -1;

        if (td==null)
            return -1;
        
        return td.cellIndex;
    }
    CurrentColIndex()
    {
        let current_td=this.CurrentTd();

        if (current_td==null)
            return -1;
        
        return current_td.cellIndex;
    }
    LeaveCell(td)
    {
        if (this.Events[this.EdiTable().Const.Events.LeaveCell]==undefined)
        return;

        var eventArgs={
                td:td,
                sender:this,
            };

        this.Events[this.EdiTable().Const.Events.LeaveCell](eventArgs);
    }
    EnterCell(td)
    {
        
        if (this.Events[this.EdiTable().Const.Events.EnterCell]==undefined)
        return;

        var eventArgs={
                td:td,
                sender:this,
            };

        this.Events[this.EdiTable().Const.Events.EnterCell](eventArgs);
    }
    Editing=false;
    GetColumnDef()
    {
        let columnDef=this.Columns[this.CurrentColIndex()];
        if (columnDef==undefined)
            columnDef={type:this.ColumnsDefaultType};

        if (columnDef.type==undefined)
                columnDef.type=this.ColumnsDefaultType;

        if (columnDef.type==this.EdiTable().Const.Columns.Types.Check)
        {
            if (columnDef["Converts"]==undefined)
                columnDef["Converts"]=this.EdiTable().Converts.Boolean;
        }
        return columnDef;
    }
    GetColumnDefOfTd(td)
    {
        let columnDef=this.Columns[this.ColIndexOfTd(td)];
        if (columnDef==undefined)
            return null;

        return columnDef;
    }
    StartEdit(td,text,clear)
    {
        
        let columnDef=this.GetColumnDef();
        
        if (columnDef.type==this.EdiTable().Const.Columns.Types.NoEditable)
            return;

        this.Editing=true;
        
        if (this.Events[this.EdiTable().Const.Events.StartEdition]!=undefined)
        {
            var eventArgs={
                td:td,
                sender:this,
                coldef:columnDef,
                text:text
            };

            this.Events[this.EdiTable().Const.Events.StartEdition](eventArgs);
        }

        if (columnDef.type==this.EdiTable().Const.Columns.Types.Custom)
        {
            this.Editing=false;
            return;
        }

        let selector=this.EdiTable().GetSelector();

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
            case this.EdiTable().Const.Columns.Types.Memo:
                td.innerHTML = this.EdiTable().Const.HTML.Inputs.Memo;
                break;
            case this.EdiTable().Const.Columns.Types.Date:
                td.innerHTML = this.EdiTable().Const.HTML.Inputs.Date;
                break;
            case this.EdiTable().Const.Columns.Types.DateTime:
                td.innerHTML = this.EdiTable().Const.HTML.Inputs.DateTime;
                break;
            case this.EdiTable().Const.Columns.Types.Select:
                td.innerHTML = this.EdiTable().Const.HTML.Inputs.Select;
                break;
            case this.EdiTable().Const.Columns.Types.Check:
                td.innerHTML = this.EdiTable().Const.HTML.Inputs.Check;
                break;
            case this.EdiTable().Const.Columns.Types.Number:
                td.innerHTML = this.EdiTable().Const.HTML.Inputs.Number;
                break;
            case this.EdiTable().Const.Columns.Types.Text:
                td.innerHTML = this.EdiTable().Const.HTML.Inputs.Text;
                break;
        }
        let input=this.EdiTable().GetInput();

        if (columnDef.type==this.EdiTable().Const.Columns.Types.Select && columnDef.options!=undefined)
        {
            columnDef.options.forEach((key, value) => {
                input.appendChild(this._createFullElement('option', {
                    value: key,
                    text: value
                }));
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
            sender:this,
            text:text,
            coldef:columnDef
        };

        if (this.Events[this.EdiTable().Const.Events.InputCreated]!=undefined)
            this.Events[this.EdiTable().Const.Events.InputCreated](eventArgs);

        
        if (this.Events[this.EdiTable().Const.Events.BeforeSetInput]!=undefined)
            this.Events[this.EdiTable().Const.Events.BeforeSetInput](eventArgs);
        
        this.EdiTable().SetInputVal(input, eventArgs.text, this, columnDef);

        input.focus();
        this.EdiTable().SetInputEventHandler(input,this); 
                                
    }
    ConfirmEdit(td,displayText)
    {
        if (!this.Editing)
            return true;
        
        var columnDef=this.GetColumnDef();

        this.Editing=false;

        let input=this.EdiTable().GetInput();
        var eventArgs={
            input:input,
            text:displayText,
            td:td,
            sender:this,
            coldef:columnDef,
            cancel:false
        };

        if (input!=undefined)
        {
            eventArgs.text=this.EdiTable().GetInputValue(input, this, columnDef);

            if (columnDef.keyfield!=undefined && columnDef.type==this.EdiTable().Const.Columns.Types.Select)
            {
                var combo=input[0];
                if (combo.selectedIndex<0)
                    eventArgs.text="";
                else
                    eventArgs.text=combo.options[combo.selectedIndex].text;
                    
                this.UpdateDataMember (this.RowIndexOfTd(eventArgs.td),columnDef.keyfield,input.value);
            }

            if (this.Events[this.EdiTable().Const.Events.BeforeUpdateCell]!=undefined)
                this.Events[this.EdiTable().Const.Events.BeforeUpdateCell](eventArgs);

            if (eventArgs.cancel)
            {
                this.Editing=true;
                return false;
            }

            input.remove();
            eventArgs.input=undefined;
        }

        if (this.Events[this.EdiTable().Const.Events.ConfirmEdition]!=undefined)
            this.Events[this.EdiTable().Const.Events.ConfirmEdition](eventArgs);
        
        if (eventArgs.cancel)
            return false;
        
        td.innerHTML = eventArgs.text;
        this.UpdateDataMember(this.RowIndexOfTd(td),columnDef.field,eventArgs.text);

        return true;
    }
    CancelEdit(td)
    {
        
        if (!this.Editing)
            return;

        this.Editing=false;

        let input=this.EdiTable().GetInput();

        if (input!=undefined)
        {
            input.remove();

            if (this["temp_html"]!=undefined && this.EdiTable().focusedTable==this)
            {
                td.innerHTML = this["temp_html"];
            }

            this.CellFocus(td);
        }

        if (this.Events[this.EdiTable().Const.Events.CancelEdition]!=undefined)
        {
            var eventArgs={
                td:td,
                sender:this,
            };

            this.Events[this.EdiTable().Const.Events.CancelEdition](eventArgs);
        }
    }
    CellFocus(td)
    {
        let selector=this.EdiTable().GetSelector();
        let input=this.EdiTable().GetInput();

        if (input!=undefined)
        {
            if (this.EdiTable().focusedTable!=null)
                if (!this.EdiTable().focusedTable.ConfirmEdit(input.parentElement)) return;
            else
                input.remove();
        }

        if (selector!=undefined)
        {
            selector.parentElement.innerHTML = selector.innerHTML;
            if (this.EdiTable().focusedTable!=null)
            {
                this.LeaveCell(selector.parentElement);
            }

            selector.remove();
        }
        
        let txt=td.innerHTML;
        td.innerHTML = this.EdiTable().Const.HTML.Selector;
        
        selector=this.EdiTable().GetSelector();
        selector.innerHTML = txt;

        this.EdiTable().focusedTable=this;

        selector.focus();
        this.EnterCell(selector.parentElement);

        const clickFunc = (e) => {
            e.stopPropagation();
            this.StartEdit(selector.parentElement,"");  
        }
        selector.removeEventListener('click', clickFunc);
        selector.addEventListener('click', clickFunc);

        this.EdiTable().SetSelectorKeyEventHandler(selector, this);
        if (this.CSS.RowSelected)
        {
            let trs = td.parentElement.parentElement.querySelectorAll('tr');
            if (trs && trs.length > 0) trs.forEach(tr => tr.classList.remove('this.CSS.RowSelected'));
            td.parentElement.classList.add(this.CSS.RowSelected);
        }
    }
    NavUp(active_cell)
    {
        let active_cell_index=active_cell.cellIndex;
        let parent_tr = active_cell.parentElement;
        let parent_tbody = active_cell.parentElement.parentElement;
        let target_tr = parent_tbody?.querySelectorAll(this.EdiTable().Const.HTML.TR)[(this._getRowIndex(parent_tr) - 1)];
        let target_cell = target_tr?.querySelectorAll(this.EdiTable().Const.HTML.TD)[active_cell_index];
        if( this._getRowIndex(parent_tr) != 0 ) 
            this.CellFocus(target_cell);
    }
    NavLeft(active_cell)
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
        let target_cell = parent_tr.querySelectorAll(this.EdiTable().Const.HTML.TD)[active_cell_index-1];
        this.CellFocus(target_cell);
    }
    NavRight(active_cell)
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

        let target_cell = parent_tr.querySelectorAll(this.EdiTable().Const.HTML.TD)[active_cell_index+1];
        this.CellFocus(target_cell);
    }
    NavDown(active_cell) 
    {
        let active_cell_index=active_cell.cellIndex;
        let parent_tr = active_cell.parentElement;
        let parent_tbody = active_cell.parentElement.parentElement;
        let target_tr = parent_tbody?.querySelectorAll(this.EdiTable().Const.HTML.TR)[(this._getRowIndex(parent_tr) + 1)];
        let target_cell = target_tr?.querySelectorAll(this.EdiTable().Const.HTML.TD)[active_cell_index];
        if( target_tr!=undefined) 
            this.CellFocus(target_cell);
        else
        {
            if (this.AutoAddRow)
                this.AddRow();
        }
    }

    _getRowIndex(tr)
    {
        let index = 0;
        let tbody = tr?.parentElement;
        if (tbody) tbody.querySelectorAll('tr').forEach((_tr, i) => { if (_tr === tr) index = i });
        return index;
    }
}

customElements.define('edit-table', EditTable);