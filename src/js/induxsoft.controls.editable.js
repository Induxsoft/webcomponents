class EditTable extends HTMLElement
{
    attributes = null;
    _table = null;
    _shadow = null;
    _current = null;
    _temp_dt = null;
    _current_row = null;
    _dataArrayBackup = null;
    _sorTable=true;
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
            this._initOtherValues();
            
            this._shadow.innerHTML = `
                <style>
                    .EdiTable-Selector{
                        width: 100%;
                        height: 100%;
                        text-align: inherit;
                        justify-content: inherit;
                        display: flex;
                        align-items: center;
                        background-color: rgba(255,255,255,.7);
                        cursor: text;
                        border: 1px solid #FFF;
                        border-radius: 3px;
                        outline: none;
                        color: #000;
                    }
                    .EdiTable-Input-Check{
                        height: 100%;
                    }
                    .EdiTable-Cell
                    {
                        height: 1.4rem;
                        outline: 1px solid #EDEDED;
                        position: relative;
                        padding: 4px;
                    }
                    .EdiTable-Row-Selected
                    {
                        background-color: #3D75DD !important;
                        color: #FFF !important;
                    }
                    
                    table{ width: 100%; font-size: 1rem; border-spacing: 1px; }
                    tbody tr {
                        position: relative;
                    }
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
                        cursor: pointer;
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
                    .Editable-Input-Memo{
                        resize:none;
                    }
                    .EdiTable-Button{
                        padding: 2px;
                        background-color: transparent;
                        color: #3D75DD;
                        border: 0;
                        cursor: pointer;
                        position: absolute;
                        right: 6px;
                        top: 2px;
                        bottom: 0;
                    }
                    .haschild td:first-of-type {
                        padding-left: 2rem;
                    }
                    .haschild td:first-of-type::before {
                        content:' \\23F5';
                    }
                    .haschild td:first-of-type::before:hover {
                        background-color: red;
                    }
                    .sizable-border {
                        position: absolute; 
                        top: 0; 
                        right: 0; 
                        width: 5px;
                        min-height: 1rem;
                        cursor: col-resize;
                        background-color: transparent;
                    }
                    th.ascendent::after{
                        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23BBB' class='bi bi-caret-down-fill' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
                    }
                    th.descendent::after{
                        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23BBB' class='bi bi-caret-up-fill' viewBox='0 0 16 16'%3E%3Cpath d='m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z'/%3E%3C/svg%3E");
                    }

                    .tr-border-bottom td{ 
                        transition: border .1s; 
                        border-bottom: 6px solid #888; 
                        outline: 0;
                    }
                    
                    .icon-child div::before{ 
                        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='%23555' class='bi bi-indent' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M3 8a.5.5 0 0 1 .5-.5h6.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H3.5A.5.5 0 0 1 3 8Z'/%3E%3Cpath fill-rule='evenodd' d='M12.5 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5Z'/%3E%3C/svg%3E");
                        /* content: 'Children';
                        font-size: .8rem;
                        font-weight: 500;
                        color: #888; */
                        background-color: #F5F5F5 !important;
                        z-index:1000000; 
                        position: absolute; 
                        left: 2px;
                        top: 0;
                        bottom: 0;
                        padding: 2px 4px 0 4px;
                        display:flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .bg-child {
                        background-color: #F5F5F5 !important;
                        color: #000 !important;
                    }
                    .dragging{ background-color: #EDEDED !important; color: #000 !important; border: 0 !important; outline: 0 !important; }
                    .cell-collapsable {  }
                    .collapse-btn { cursor: pointer; }
                    .cell-content { width: 100%; height: 100%; display: flex; align-items: center; overflow: hidden; }
                    .hidde-row{ display: none; }
                    .hidde-col{ display: none !important; }
                    .container-cell-content { display: flex; gap:2px; width:-webkit-fill-available; height: 100%; align-items: center;}

                    .induxsoft-form-control{border: none; outline:1px solid #ced4da;display: block;width: 100%;padding: 0.375rem 0.75rem !important;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-clip: padding-box;appearance: none;transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] {background-color: #e9ecef;opacity: 1;
                    }
                    .induxsoft-buttons{display: inline-block;font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .induxsoft-buttons:hover{color: #212529;background-color: #F5F5F5;
                    }
                    .induxsoft-form-select {display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem !important;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline:1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none;
                    }

                    .transparent{ background-color: transparent !important; border: none !important; outline: none !important; color: inherit !important; }
                    a{ color: inherit; }
                    ` + this._getExtraCss() + (this.getAttribute('control-styles') ?? '') + `
                    @media print
                    {
                        .no-print{ display: none !important; }
                    }
                    @media screen and (max-width: 768px) {
                        .table-cards {
                            /* row to cards */
                            & th{ display:none !important; }
                            & td{ display:block !important; }
                            & td::before{ content: attr(data-cell) ": "; font-weight: 600; }
                            & td{ display: grid !important; grid-template-columns: 35% 65% !important; word-wrap: break-word; }
                            /* cards styles */
                            & td:first-child{ padding-top:2rem !important; }
                            & td:last-child{ padding-bottom:2rem !important; }
                            & .EdiTable-Cell{ outline: none; padding-left: 1rem; height: auto; }
                            & tbody tr{ outline: 1px solid #DDD; }
                        }
                    }
                </style>
            `;

            this.ReadOnly = this.hasAttribute("readonly");
            if (this.hasAttribute('data') && this.getAttribute('data').trim() != "")
            {
                try{ this.DataArray = JSON.parse(this.getAttribute('data')); }
                catch{ alert('El valor del atributo "data" tiene un formato JSON inválido'); this.DataArray = []; }
            }
            if (this.hasAttribute('html-encode')) this.htmlEncode = (this.getAttribute('html-encode')=='true');
            const container1 = this._createFullElement('div', { style:'min-height: 2rem; max-height: 100%; overflow: auto; padding-bottom: 5px' });
            this._table = this._getFullTable();
            container1.appendChild(this._table);
            this.innerHTML = '';
            this._shadow.appendChild(container1);
            
            this._initTreeValues();

            if (this.ShowAsTree) this._printTreeData();

            this.Initialize(this._table.getAttribute('id'));

            if(this.hasAttribute('sorTable'))this._sorTable=this.getAttribute('sorTable').trim().toLowerCase()=="true";
            
            this.sorTable=this._sorTable;
            //this._processAtributesColumn();
            this._resizableGrid(this._table);
            this._setSortEvent();
            this._setMoveEvent();

            // Si no se ha proporcionado el atributo data para el dataArray se genera a partir del contenido de la tabla
            if (this.DataArray.length < 1) this.UpdateData();
            this._current_row = this.CurrentRowIndex();

            // Vista de impresión activada.
            window.addEventListener('beforeprint', () => {
                this.Columns.forEach(col => {
                    if ((col?.class??"").includes("hide-on-print") || (col?.class??"").includes("no-print"))
                        this.hideColumn(col.field, true);
                });
            });
            // Vista de impresión desactivada.
            window.addEventListener('afterprint', () => {
                this.Columns.forEach(col => {
                    if ((col?.class??"").includes("hide-on-print") || (col?.class??"").includes("no-print"))
                        this.hideColumn(col.field, false);
                });
            });
            
            this.setAutoConfirm();
            this.checkAndSetRowCards();
        });
    }

    _getFullTable=()=>
    {
        const table = this._createFullElement('table', { id:(this.getAttribute('id')??'f077fb41716141eeb7ecb1ed0a1ce292') });
        const thead = (this._replaceTagNameElement(this.querySelector('edit-thead'), 'thead') ?? this._createFullElement('thead'));
        const tbody = (this._replaceTagNameElement(this.querySelector('edit-tbody'), 'tbody') ?? this._createFullElement('tbody'));

        table.appendChild(thead);
        table.appendChild(tbody);

        if (thead.hasChildNodes())
        {
            thead.querySelectorAll('*').forEach(e => { if (e.tagName.toLocaleLowerCase() != 'edit-tr' && e.tagName.toLocaleLowerCase() != 'edit-th') e.remove(); });

            thead.querySelectorAll('edit-tr').forEach(editTr => editTr.replaceWith(this._replaceTagNameElement(editTr, 'tr')));
            thead.querySelectorAll('tr').forEach(tr => {
                tr.querySelectorAll('edit-th').forEach(editTh => {
                    editTh.innerHTML = `<span>${editTh.textContent}</span>`;
                    this._setColumnWith(editTh);
                    editTh.replaceWith(this._replaceTagNameElement(editTh, 'th'));
                });
            });
        }

        if (tbody.hasChildNodes())
        {
            tbody.querySelectorAll('*').forEach(e => { if (e.tagName.toLocaleLowerCase() != 'edit-tr' && e.tagName.toLocaleLowerCase() != 'edit-td') e.remove(); });
            
            tbody.querySelectorAll('edit-tr').forEach(editTr => editTr.replaceWith(this._replaceTagNameElement(editTr, 'tr')));
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.querySelectorAll('edit-td').forEach(editTd => {
                    editTd.classList.add('EdiTable-Cell');
                    editTd.replaceWith(this._replaceTagNameElement(editTd, 'td'));
                });
            });
        }

        this._processAtributesColumn(thead);

        if (this.DataArray && this.DataArray.length > 0 && thead.hasChildNodes() && !tbody.hasChildNodes())
        {
            this.DataArray.forEach((data, idx) => {

                const tr = this._createFullElement('tr');

                this.Columns.forEach(column => 
                {
                    const td = this._createFullElement('td', { class:'EdiTable-Cell' });
                    tr.appendChild(td);
                    
                    let coldf = this.GetColumnDefOfTd(td);
                    let value = (this._isBadgesCol(column) ? '' : (data[column.field] ?? ''));
                    
                    let valideEncode = true;

                    if(coldf.template) {
                        valideEncode = false;
                        value = this.applyTemplate(coldf.template, data);
                    }

                    this.SetTdValue(td, value, valideEncode, coldf);
                    
                    td.setAttribute('data-cell',(coldf?.title??''));
                    if (this.onTdPaint) this.onTdPaint(td, idx, this.ColIndexOfTd(td), (coldf?.field??''));
                });

                this._decorateRow(tr, idx, data);
                tbody.appendChild(tr);
            });  
        }

        return table;
    }
    _setColumnWith=(th)=>
    {
        if (th)
        {
            if(th.hasAttribute('minwidth')){
                th.style.minWidth = th.getAttribute('minwidth');
                //th.removeAttribute('minwidth');
            } 
            if(th.hasAttribute('maxwidth')){
                th.style.maxWidth = th.getAttribute('maxwidth');
                //th.removeAttribute('maxwidth');
            }
            if(th.hasAttribute('width')){
                th.style.width = th.getAttribute('width');
                //th.removeAttribute('width');
            }
        }
    }
    _getColdefByTh=(th)=>
    {
        let def = {};
        if (th && th.hasAttributes())
            th.getAttributeNames().forEach(attrName => def[attrName] = th.getAttribute(attrName));
        return def
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
    _processAtributesColumn=(element)=>
    {
        let listColumns = (element ? element.querySelectorAll('th') : this._shadow.querySelectorAll('th'));
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
                settings['title'] = column.textContent;
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

        element.onclick = (e) => { e.stopPropagation(); e.preventDefault(); }

        element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            curCol = e.target.parentElement;
            nxtCol = curCol.nextElementSibling;
            pageX = e.pageX;
            curColWidth = curCol.offsetWidth
            if (nxtCol)
                nxtColWidth = nxtCol.offsetWidth
        });
        document.addEventListener('mousemove', (e) => {
            e.stopPropagation();
            if (curCol) {
                var diffX = e.pageX - pageX;
                if (nxtCol)
                    nxtCol.style.width = (nxtColWidth - (diffX))+'px';
                curCol.style.width = (curColWidth + diffX)+'px';
            }
        });
        document.addEventListener('mouseup', (e) => { 
            e.stopPropagation();
            curCol = undefined;
            nxtCol = undefined;
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
    _getVisibleRowIndex=(tr)=>
    {
        let index = -1;
        let tbody = tr?.parentElement;
        if (tbody) tbody.querySelectorAll('tr:not(.hidde-row)').forEach((_tr, i) => { if (_tr === tr) index = i });
        return index;
    }
    _getVisibleColumnIndex=(td)=>
    {
        let index = -1;
        let tr = td?.parentElement;
        if (tr) tr.querySelectorAll('td:not(.hidde-col)').forEach((_td, i) => { if (_td === td) index = i });
        return index;
    }
    _getCurren=(setnew=false)=>
    {
        if (!this._current || setnew)
            this._current = Object.assign({}, this);
        return this._current;
    }
    _setSortEvent=()=>
    {
        const fields = this._table.querySelectorAll('th');
        fields.forEach(field => {
            let par = 0;
            field.onclick = e => 
            {
                if(this._sorTable)
                {
                    e.stopPropagation();
                    fields.forEach(f=>{f.classList.remove('ascendent');f.classList.remove('descendent')});
                    par++;
                    let desc = (par%2==0);
                    field.classList.toggle('ascendent',desc);
                    field.classList.toggle('descendent',!desc);
                    if (this.ShowAsTree)
                    {
                        let options = this._getTreeOptions();
                        this.GetTree(options);
                        this.SortTree(this.DataArray, (field.getAttribute('field')??''), desc, options);
                        this.SetTree(this.DataArray, options);
                    }
                    else
                    {
                        this.Sort(this.DataArray, (field.getAttribute('field')??''), desc);
                    }
                    this._printRows();
                }
            };
        });
    }
    _moveData(sourceData, targetData, moveAsChild=false, treeOptions=null, onTopIfNotAsChild=false)
    {
        let success = false;

        var eventArgs = {
            source: sourceData,
            target: targetData,
            child: moveAsChild,
            sender:this._getCurren(),
            cancel:false
        };

        if (this.Events[this.EdiTable.Const.Events.BeforeMoveRow]!=undefined)
            this.Events[this.EdiTable.Const.Events.BeforeMoveRow](eventArgs);

        if (eventArgs.cancel)
            return success;

        if (!treeOptions) treeOptions = this._getTreeOptions();
        if ((sourceData[treeOptions.key]??'_') === (targetData[treeOptions.key]??'|')) return success;

        let source = null;
        let target = null;
        let isChil = false;

        const search = l => 
        {
            return l.some((obj, idx) => 
            {
                if (sourceData[treeOptions.key] == (obj[treeOptions.key]??'_')) 
                    source = { obj, l, idx };
                else if (targetData[treeOptions.key] == (obj[treeOptions.key] ?? '_')) 
                    target = { obj, l, idx };
                return ((source && target) || search((obj[treeOptions.childs]??[])));
            });
        }

        const targetChild = l => 
        {
            return l.some(obj => 
            {
                if (targetData[treeOptions.key] == (obj[treeOptions.key] ?? '_')){
                    isChil = true;
                    console.log('Can not add a parent row like child row');
                }
                return (isChil || targetChild((obj[treeOptions.childs]??[])));
            });
        }
        
        try
        {
            this.GetTree(treeOptions);

            if(search(this.DataArray) && !targetChild((source?.obj[treeOptions.childs]??[])))
            {
                let sameLevel = (source.l == target.l);
                let notaddidx = (sameLevel && source.idx <= target.idx);
                
                if (!moveAsChild)
                {
                    let data = source.l.splice(source.idx, 1)[0];
                    data[treeOptions.parentkey] = target.obj[treeOptions.parentkey];
                    target.l.splice((target.idx + (notaddidx ? 0 : 1) - (onTopIfNotAsChild ? 1 : 0)), 0, data);
                }
                else
                {
                    const parentChilds = (target.obj[treeOptions.childs]??[]);
                    let data = source.l.splice(source.idx, 1)[0];
                    data[treeOptions.parentkey] = target.obj[treeOptions.key]
                    parentChilds.unshift(data);
                    target.obj[treeOptions.childs] = parentChilds;
                }
                success = true;
            }
        }
        catch(error)
        {
            console.log(error);
            success = false
        }
        finally 
        {
            if (success && this.Events[this.EdiTable.Const.Events.RowMoved]!=undefined)
                this.Events[this.EdiTable.Const.Events.RowMoved](eventArgs);

            this.SetTree(this.DataArray, treeOptions);
            
            if (this._dataArrayBackup)
            {
                let tempBack = JSON.parse(JSON.stringify(this._dataArrayBackup));
                this.backup();
                this._dataArrayBackup.forEach(data => { 
                    let back = tempBack.find(temp => (temp[treeOptions.key] == data[treeOptions.key]));
                    if (back && back.isDirty != undefined) data.isDirty = back.isDirty;
                });
            }
        }

        return success;
    }
    _setMoveEvent=()=>
    {
        if (!this.CanMoveRow) return;

        let asChild = false;

        const getTr = (e) =>
        {
            let tr = e.currentTarget;
            if (tr.tagName != 'TR') tr = e.target.closest('tr');
            return tr;
        }
        const handleDragStart = (e) => 
        {
            e.stopPropagation();

            let tr = getTr(e);
            tr.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';

            const indexRow = this._getRowIndex(tr);
            const data = (this.DataArray[indexRow] ?? {});
            this._resolveKey(data);
            asChild = false;

            e.dataTransfer.setData('application/json', JSON.stringify(data));
        }
        const handleDragOver = (e) => 
        {
            e.stopPropagation();
            e.preventDefault();
            
            let tr = getTr(e);

            let td = tr.firstChild;
            let cr = td.getBoundingClientRect();
            let lx = (cr.x + (cr.width / 2));

            asChild = (e.clientX > lx);

            tr.classList.add('tr-border-bottom');
            tr.classList.toggle('icon-child', asChild);
            tr.classList.toggle('bg-child', asChild);
        }
        const handleDragEnter = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            tr.classList.add('tr-border-bottom');
        }
        const handleDragLeave = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            tr.classList.remove('tr-border-bottom');
            tr.classList.remove('icon-child');
            tr.classList.remove('bg-child');
        }
        const handleDragEnd = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            tr.classList.remove('dragging');
            tr.classList.remove('tr-border-bottom');
            tr.classList.remove('icon-child');
            tr.classList.remove('bg-child');
        }

        const handleDrop = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            let sourceData = JSON.parse(e.dataTransfer.getData('application/json'));
            
            tr.classList.remove('dragging');
            tr.classList.remove('tr-border-bottom');
            tr.classList.remove('icon-child');
            tr.classList.remove('bg-child');

            if (sourceData && Object.keys(sourceData).length > 0)
            {
                let targetData = this.DataArray[this._getRowIndex(tr)];
                if (targetData)
                {
                    this._resolveKey(targetData);
                    if (this._moveData(sourceData, targetData, asChild))
                        this._printRows();
                }
            }
            
            return false;
        }

        const trs = this._table.querySelectorAll('tbody tr');

        trs.forEach(tr => 
        {
            tr.setAttribute('draggable', 'true');
            tr.ondragstart =  handleDragStart;
            tr.ondragover =  handleDragOver;
            tr.ondragenter =  handleDragEnter;
            tr.ondragleave =  handleDragLeave;
            tr.ondragend =  handleDragEnd;
            tr.ondrop =  handleDrop;
        });
    }
    _generateUUID=()=>
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    _resolveKey=(data)=>
    {
        let treeOptions = this._getTreeOptions();
        if (data[treeOptions.key] === undefined) data[treeOptions.key] = this._generateUUID();
    }
    _format=(number, decimals=0, thousandSeparator=false)=>
    {
        const roundedNumber = number.toFixed(decimals);
        let integerPart = '', fractionalPart = '';
        
        if (decimals == 0) 
        {
            integerPart = roundedNumber;
            this.NumFormat.decimals="";
        } 
        else 
        {
            this.NumFormat.decimals=this.NumFormat.default_decimals;
            let numberParts = roundedNumber.split('.');
            integerPart = numberParts[0];
            fractionalPart = numberParts[1];
        }

        if (thousandSeparator)
            integerPart = integerPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${this.NumFormat.thousands}`);

        return `${integerPart}${this.NumFormat.decimals}${fractionalPart}`;
    }
    _initOtherValues()
    {
        if (this.hasAttribute('hidde-selector')) this.hiddeSelector = (this.getAttribute('hidde-selector')=='true');
        if (this.hasAttribute('hide-row-selector')) this.hiddeRowSelector = (this.getAttribute('hide-row-selector')=='true');
        if (this.hasAttribute('auto-confirm')) this.autoConfirm = (this.getAttribute('auto-confirm')=='true');
        if (this.hasAttribute('min-row-height')) this.minRowHeight = this.getAttribute('min-row-height');
        if (this.hasAttribute('max-row-height')) this.maxRowHeight = this.getAttribute('max-row-height');
        if (this.hasAttribute('row-height')) this.rowHeight = this.getAttribute('row-height');
        if (this.hasAttribute('cards-responsive')) this.cardsResponsive = (this.getAttribute('cards-responsive')=='true');
        if (this.hasAttribute('editable-responsive')) this.editableResponsive = (this.getAttribute('editable-responsive')=='true');
        this._readVisualAttributes();
    }
    autoConfirm=false;
    _fireBlur=true;
    setAutoConfirm()
    {
        setInterval(()=>
        {
            if (document.activeElement!=this)
            {
                if (this.Editing && this.autoConfirm)
                    this.ConfirmEdit(this.CurrentTd());

                if (!this._fireBlur)
                {
                    this._fireBlur=true;
                    if (this._getCurren().Events[this.EdiTable.Const.Events.LostFocus]!=undefined)
                        this._getCurren().Events[this.EdiTable.Const.Events.LostFocus]();
                    //LanzarEvento lostFocus   
                }
            } 
            //else { this._fireBlur=false;}
        },1000);
    }

    checkAndSetRowCards()
    {
        var editable=null;
        if(!this.editableResponsive) editable = this.Columns.find(col => {
            const type = (col?.type ?? '').toString().toLowerCase();
            return type != 'noeditable' && type != 'badges';
        });

        this._cardsNoEditable = !editable;
        this._cardsEligible = (!editable && this.cardsResponsive);
        this._applyCardsConfig();
        this._setupViewWatcher();
        this._setupSelectionKeeper();
    }


    // ========================= EDITABLE FUNCTIONS
    
    _EdiTable = () => { return {
        Const : {
            HTML:{
                Selector:'<div id="__table_selector" class="EdiTable-Selector" tabindex="0"></div>',
                Button:'<button id="__table_button" class="EdiTable-Button"></button>',
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
                    NoEditable:"NoEditable",
                    Badges:"Badges"
                }
            },
            Events:{
                BeforeCellFocus:"beforecellfocus",
                EnterCell:"entercell",
                LeaveCell:"leavecell",
                StartEdition:"startedition",
                ConfirmEdition:"confirmedition",
                CancelEdition:"canceledition",
                InputCreated:"inputcreated",
                BeforeUpdateCell:"beforeupdatecell",
                BeforeSetInput:"beforesetinput",
                FieldUpdated:"fieldupdated",
                RowAdded:"rowadded",
                RowDeleted:"rowdeleted",
                BeforeRowDelete:"beforerowdelete",
                BeforeMoveRow:"beforemoverow",
                RowMoved:"rowmoved",
                RowChanged:"rowchanged",
                LostFocus:"lostfocus",
                IsDirtyChanged:"isdirtychanged",
                OnSort:"onsort",
                BadgeClick:"badgeclick",
                ViewModeChanged:"viewmodechanged"
            },
            SelectorId:"__table_selector",
            InputId:"__table_input",
            ButtonOptionId:"__table_button"
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
        GetButtonOption:function()
        {
            return this._shadow.querySelector("#"+this.EdiTable.Const.ButtonOptionId);
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
                e.preventDefault();
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
                    case "Enter":
                    case "F2":
                        setTimeout(function(){
                            _current.StartEdit(selector.closest('td'),"");
                        },1);
                        break;
                    case "Delete":
                        if (_current.AutoDelRow && e.ctrlKey) _current.DeleteCurrentRow();
                        if (!e.ctrlKey)
                        {
                            setTimeout(function(){
                                _current.StartEdit(selector.closest('td'),"",true);
                            },1);
                        }
                        break;
                    case "ArrowUp":
                        _current.NavUp(selector.closest('td'));
                        break;
                    case "ArrowLeft":
                        _current.NavLeft(selector.closest('td'));
                        break;
                    case "Tab":
                    case "ArrowRight":
                        _current.NavRight(selector.closest('td'));
                        break;
                    case "ArrowDown":
                        _current.NavDown(selector.closest('td'));
                        break;
                    case "F4":
                        _current.showInputKey(selector.closest('td'), '', false);
                        break;
                    default:
                        if (e.key.trim().length==1)
                        {
                            setTimeout(function(){
                                _current.StartEdit(selector.closest('td'),e.key);
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
                        _current.NavUp(input.closest('td'));
                        e.stopPropagation();
                        break;
                    case "Escape":
                        _current.CancelEdit(input.closest('td'));
                        e.stopPropagation();
                        break
                    case "Tab":
                    case "Enter":
                        e.preventDefault();
                        _current.NavRight(input.closest('td'));
                        e.stopPropagation();
                        break;
                    case "ArrowLeft":
                        if (input.selectionStart==0 || input.getAttribute('type').toLowerCase()=="checkbox")
                        {
                            _current.NavLeft(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowRight":
                        if (input.selectionStart==input.value.length || input.getAttribute("type").toLowerCase()=="checkbox")
                        {
                            _current.NavRight(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowDown":
                        _current.NavDown(input.closest('td'));
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
                        _current.CancelEdit(input.closest('td'));
                        e.stopPropagation();
                        break
                    case "Tab":
                    case "Enter":
                        if (e.ctrlKey)
                        {
                            _current.NavRight(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowLeft":
                        if (input.selectionStart==0)
                        {
                            _current.NavLeft(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowRight":
                        if (input.selectionStart==input.value.length)
                        {
                            _current.NavRight(input.closest('td'));
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
                        _current.CancelEdit(input.closest('td'));
                        e.stopPropagation();
                        break
                    case "Enter":
                        if (e.ctrlKey)
                        {
                            _current.NavRight(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowLeft":
                        _current.NavLeft(input.closest('td'));
                        e.stopPropagation();
                        break;
                    case "Tab":
                    case "ArrowRight":
                        _current.NavRight(input.closest('td'));
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

    Events = {};
    TheadRowIndex = 0;
    AutoAddRow = true;
    AutoDelRow = true;
    EverMove = true; //Si es true, deplazamiento a la izquierda en la primera celda sube una fila y se mueve a la última, a la derecha en la última baja una fila y va a la primer celda
    PagOffSet = 10; //Desplazamiento con AvPag PrevPag
    DataArray = []; //Contiene un array asociado a las filas
    ColumnsDefaultType = this.EdiTable.Const.Columns.Types.Text;
    ReadOnly = false;
    
    ShowAsTree = true;
    CanMoveRow = false;
    TreeOptions = {};
    Key = "id";
    ParentKey = "idp";
    Childs = "__items";
    ButtonOnClick = null;
    onTdPaint = null;
    NumFormat = {
        default_decimals:".",
        thousands:",",
        decimals:"."
    }
    hiddeSelector = false;
    hiddeRowSelector = false;
    htmlEncode = false;
    minRowHeight = "none";
    maxRowHeight = "none";
    rowHeight = "100%";
    cardsResponsive = false;
    editableResponsive=false;
    CSS = {
        Cell:"EdiTable-Cell",
        RowSelected: "EdiTable-Row-Selected"
    };
    sorTable=true;
    Initialize = (tableId) =>
    {
        let tds = this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+"#"+tableId+" "+this.EdiTable.Const.HTML.TD);
        tds.forEach(td => {
            td.onclick = e => {
                e.stopPropagation();
                this.CellFocus(td);
            }
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
        this.NavTo(this.TRCount()-1,(this._table.querySelectorAll('thead tr td:not(.hidde-col)').length-1));
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
        this.NavTo(row,(this._table.querySelectorAll('thead th:not(.hidde-col)').length-1));
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
        let td = tbody.querySelectorAll(this.EdiTable.Const.HTML.TR)[row].querySelectorAll(this.EdiTable.Const.HTML.TD+':not(.hidde-col)')[col];
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
        var eventArgs={
            sender:this._getCurren(),
            rowIndex:row,
            cancel:false
        };

        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeRowDelete]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.BeforeRowDelete](eventArgs);

        if (eventArgs.cancel) return false;

        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || row<0) return false;

        this.GetTrByIndex(row).remove();
        this.DataArray.splice(row, 1);
        if(this._dataArrayBackup) this._dataArrayBackup.splice(row, 1);

        if (this._getCurren().Events[this.EdiTable.Const.Events.RowDeleted]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.RowDeleted](eventArgs);

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

        const data = (this.DataArray[row] ?? {});

        for(let i=0;i<this.TDCount(tr);i++)
        {
            const col = this.Columns[i];
            if (col==undefined || this._isBadgesCol(col)) continue;

            if (col.template)
            {
                // Antes UpdateRow no evaluaba plantillas; un error en ellas no debe interrumpir al código que lo llama.
                let html;
                try { html = this.applyTemplate(col.template, data); }
                catch (err) { console.error('EditTable.UpdateRow: error en template de "' + (col.field ?? i) + '"', err); continue; }
                this.SetTdValue(tds[i], html, false);
            }
            else if (col.field!=undefined)
                this.SetTdValue(tds[i], (data[col.field] ?? ''), true);
                //tds[i].innerHTML = (this.DataArray[row][this.Columns[i].field] ?? '');
        }

        this._decorateRow(tr, row, data);

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
            if (this.Columns[i]!=undefined && !this._isBadgesCol(this.Columns[i]))
            {
                if (this.Columns[i].field!=undefined)
                {
                    if (tds[i]==this.CurrentTd())
                    {
                        if (!this.Editing)
                        {
                            this.UpdateDataMember(row,this.Columns[i].field,this.EdiTable.GetSelector().innerHTML);
                        }
                    }
                    else
                    {
                        //this.UpdateDataMember(row,this.Columns[i].field,tds[i].innerHTML);
                        this.UpdateDataMember(row,this.Columns[i].field,this.GetTdValue(tds[i], true));
                    }
                }
            }
        }

        return true;
    }

    setIsDirtyByValue=(row,field,value)=>{
        if (!this._dataArrayBackup) return;

        this.setIsDirty(row, this.DataArray[row][field]!=value);
        this.setIsDirty(row, this._dataArrayBackup[row][field]!=value);
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
            this.setIsDirtyByValue(row, field, value);

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
                            //cell.append(coldef.default);
                            this.SetTdValue(cell,coldef.default);
                        }
            }
            const clickFunct = (e) => {
                e.stopPropagation();
                this.CellFocus(e.target);
            }
            this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.TD).forEach(td => {
                td.removeEventListener('click', clickFunct);
                td.addEventListener('click', clickFunct);
                if (this.hideColumns.includes(td.cellIndex)) td.classList.add('hidde-col');
            });

            this._setMoveEvent();
            this._decorateRow(nr, indexRow, this.DataArray[indexRow]);

            if (!nofocus)
                this.CellFocus(nr.querySelector('td:not(.hidde-col)'));
            
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

        return selector.closest('td');
        
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
        
        return td.closest('tr');
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
        
        return this._getRowIndex(td.closest('tr'));
    }
    /**
     * @returns Retorna el **índice** de la fila *tr* de la celda *td* actualmente seleccionada, -1 si no hay niguna celda selccionada.
     */
    CurrentRowIndex=()=>
    {
        let current_td=this.CurrentTd();
        if (current_td==null)
            return -1;
        
        return this._getRowIndex(current_td.closest('tr'));
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
     * @param {Number} td Referencia a un elemento *td* de la tabla.
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
        if (this.ReadOnly) return;
        
        let columnDef=this.GetColumnDef();
        
        if ((columnDef?.readonly??false)) return;
        if (columnDef.type==this.EdiTable.Const.Columns.Types.NoEditable || this._isBadgesCol(columnDef)) return;

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
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Memo;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Memo, false);
                break;
            case this.EdiTable.Const.Columns.Types.Date:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Date;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Date, false);
                break;
            case this.EdiTable.Const.Columns.Types.DateTime:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.DateTime;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.DateTime, false);
                break;
            case this.EdiTable.Const.Columns.Types.Select:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Select;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Select, false);
                break;
            case this.EdiTable.Const.Columns.Types.Check:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Check;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Check, false);
                break;
            case this.EdiTable.Const.Columns.Types.Number:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Number;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Number, false);
                break;
            case this.EdiTable.Const.Columns.Types.Text:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Text;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Text, false);
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

        if (Number(columnDef.maxlength??0) && (columnDef.type==this.EdiTable.Const.Columns.Types.Text || columnDef.type==this.EdiTable.Const.Columns.Types.Memo))
        {
            if (input) input.setAttribute('maxlength', columnDef.maxlength);
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

        if (columnDef.type == 'Text' && columnDef.inputkey)
        {
            this.showInputKey(td, eventArgs.text);
            return true;
        }
        
        //td.innerHTML = eventArgs.text;
        this.SetTdValue(td, eventArgs.text, true);
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
                //td.innerHTML = this["temp_html"];
                this.SetTdValue(td, this["temp_html"], true);
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
        this._fireBlur=false;

        var eventArgs={
            td:td,
            sender:this._getCurren(),
            cancel:false
        };

        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeCellFocus]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.BeforeCellFocus](eventArgs);

        if (eventArgs.cancel) return;

        let selector=this.EdiTable.GetSelector();
        let input=this.EdiTable.GetInput();

        if (input!=undefined)
        {
            if (this.EdiTable.focusedTable!=null)
            {
                if (!this.EdiTable.focusedTable.ConfirmEdit(input.closest('td'))) return;
            }
            else
                input.remove();
        }

        if (selector!=undefined)
        {
            this.SetTdValue(selector.closest('td'), selector.innerHTML, true);
            if (this.EdiTable.focusedTable!=null)
            {
                this.LeaveCell(selector.closest('td'));
            }

            selector.remove();
        }

        let txt=this.GetTdValue(td, false);
        //let txt=td.innerHTML;

        let button = '';
        let coldef = this.GetColumnDefOfTd(td);

        if (coldef && (coldef['button'] ?? '') == 'true') button = this.EdiTable.Const.HTML.Button;
        this.SetTdValue(td,this.EdiTable.Const.HTML.Selector+button, false);
        //td.innerHTML = this.EdiTable.Const.HTML.Selector;
        
        let btn = this.EdiTable.GetButtonOption();
        
        if (btn)
        {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.showInputKey(td, '', false);
            }
            btn.innerHTML = ((coldef['buttondata']??'').trim() != '' ?
                coldef['buttondata']:
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>');
            
            if (this.ButtonOnClick)
            {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    let rowIndex = this.RowIndexOfTd(td);
                    let colIndex = this.ColIndexOfTd(td);
                    this.ButtonOnClick(rowIndex, colIndex, coldef);
                }
            }
        }

        selector=this.EdiTable.GetSelector();
        selector.classList.toggle('transparent', this.hiddeSelector);
        selector.innerHTML = txt;
        this.EdiTable.focusedTable=this._getCurren(true);

        selector.focus();
        this.EnterCell(selector.closest('td'));

        const clickFunc = (e) => {
            e.stopPropagation();
            this.StartEdit(selector.closest('td'),"");  
        }
        selector.removeEventListener('click', clickFunc);
        selector.addEventListener('click', clickFunc);

        this.EdiTable.SetSelectorKeyEventHandler(selector, this._getCurren());
        if (this.CSS.RowSelected)
        {
            let trs = td.closest('tr').parentElement.querySelectorAll('tr');
            if (trs && trs.length > 0) trs.forEach(tr => tr.classList.remove(this.CSS.RowSelected));
            if(!this.hiddeRowSelector) td.closest('tr').classList.add(this.CSS.RowSelected);
        }
        this._trackSelection(td.closest('tr'));

        if (this._current_row != this.CurrentRowIndex())
        {
            eventArgs['index'] = this.CurrentRowIndex();
            eventArgs['previous_index'] = this._current_row;
            if (this._getCurren().Events[this.EdiTable.Const.Events.RowChanged]!=undefined)
                this._getCurren().Events[this.EdiTable.Const.Events.RowChanged](eventArgs);
        }

        this._current_row = this.CurrentRowIndex();
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
        let target_tr = parent_tbody?.querySelectorAll(this.EdiTable.Const.HTML.TR+":not(.hidde-row)")[(this._getVisibleRowIndex(parent_tr) - 1)];
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
        if (this._getVisibleColumnIndex(active_cell)==0)
        {
            if (!this.EverMove)
                return;
            
            this.NavUp(active_cell);
            this.NavToLastCell(this.CurrentRowIndex());
            return;
        }

        let parent_tr = active_cell.parentElement;
        let target_cell = parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col)")[this._getVisibleColumnIndex(active_cell)-1];
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
        // console.log(active_cell_index);
        // console.log(parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col)").length);
        if (this._getVisibleColumnIndex(active_cell)==parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col)").length-1)
        {
            if (!this.EverMove)
                return;
            
            this.NavDown(active_cell);
            this.NavToFirstCell(this.CurrentRowIndex());
            return;
        }

        let target_cell = parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col)")[this._getVisibleColumnIndex(active_cell)+1];
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
        let target_tr = parent_tbody?.querySelectorAll(this.EdiTable.Const.HTML.TR+":not(.hidde-row)")[(this._getVisibleRowIndex(parent_tr) + 1)];
        let target_cell = target_tr?.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell_index];
        if( target_tr!=undefined) 
            this.CellFocus(target_cell);
        else
        {
            if (this.AutoAddRow)
                this.AddRow();
        }
    }

    GetTdHtml=(td)=>
    {
        // const cellContent = td.querySelector('div[iscellcontent=true]');
        // if (cellContent)
        //     cellContent.innerHTML = '@value';
        // else
        //     td.innerHTML = '@value';
        return td.innerHTML;
    }
    GetTdValue=(td, valideEncode=false)=>
    {
        if (td && td.tagName.toLowerCase() != 'td') td = td.closest('td');
        let value = td.innerHTML;
        const cellContent = td.querySelector('div[iscellcontent=true]');
        
        if (cellContent)
            value = cellContent.innerHTML

        let coldef = this.GetColumnDefOfTd(td);
        if (this._withFormat(coldef, value))
            value = value.replace(/[^0-9.-]+/g, "");

        // El contenido de una columna con plantilla es HTML ya renderizado, no texto de usuario.
        if (valideEncode && this.htmlEncode && !coldef?.template) value = this.getHtmlDecode(value);
        
        return value;
    }
    applyTemplate=(template, DataRow)=>
    {
        if (this.TemplateEncode && DataRow && typeof DataRow == 'object') DataRow = this._encodeRow(DataRow);
        let expr="`"+template+"`";
        return eval(expr);
    }
    SetTdValue=(td, value, valideEncode=false, coldef=null)=>
    {
        if(!coldef) coldef = this.GetColumnDefOfTd(td);

        if (this._withFormat(coldef, value))
            value = this._aplyFormat(coldef, value);

        // Con html-encode, al quitar el foco de una celda con plantilla su HTML se escapaba y se veía como texto.
        if (valideEncode && this.htmlEncode && !coldef?.template) value = this.setHtmlEncode(value);

        let cellContent = td.querySelector('div[iscellcontent=true]');
        if (!cellContent) cellContent = td.closest('div[iscellcontent=true]');
        
        if (cellContent)
        {
            cellContent.innerHTML = value;
            this._setRowSizes(cellContent,coldef);
            return;
        }
        else
        {
            cellContent = this._createFullElement('div', { iscellcontent:'true', class:'cell-content' });
            cellContent.innerHTML = value;
            this._setRowSizes(cellContent,coldef);
            td.innerHTML = cellContent.outerHTML;
        }
        //td.innerHTML = value;
    }
    _setRowSizes(cellContent,coldef)
    {
        if (cellContent)
        {
            // Sizes
            cellContent.style.minHeight = this.minRowHeight;
            cellContent.style.maxHeight = this.maxRowHeight;
            cellContent.style.height = this.rowHeight;
            if (coldef?.minwidth) cellContent.style.minWidth = coldef.minwidth;
            if (coldef?.maxwidth) cellContent.style.maxWidth = coldef.maxwidth;
            if (coldef?.width) cellContent.style.width = coldef.width;
            // Align
            cellContent.style.justifyContent = (coldef?.textalign??'');
            cellContent.style.textAlign = (coldef?.textalign??'');

            if (this.maxRowHeight != 'none' || this.rowHeight != '100%')
            {
                cellContent.style.display = 'block';
            }
        }
    }
    _withFormat(coldef, value)
    {
        value = value.toString();
        return (value
            && !value.includes('__table_selector') 
            && !value.includes('__table_input') 
            && coldef 
            && ((coldef.type ?? '').toString().toLowerCase() == 'number' || (coldef.type ?? '').toString().toLowerCase() == 'noeditable')
            && (coldef.format??'') == 'true');
    }
    _aplyFormat(coldef, value)
    {
        let decimals = Number(coldef.decs??0);
        let thousand = ((coldef.thousandssep??'false') == 'true');
        value = this._format(Number(value), decimals, thousand);
        value = `${(coldef.prefix??'')}${value}`;
        value = `${value}${(coldef.sufix??'')}`;
        return value;
    }
    // ========================= SORT FUNCTIONS
    
    _TreeValueIndent = 1;
    _TreeUnitIndent = 'rem';
    _expandOnStart = false;

    _refreshTable=()=>
    {
        let rows = this.TRCount();
        for (let i = 0; i < rows; i++)
            this.UpdateRow(i);
    }
    _initTreeValues=()=>
    {
        let v = (this.getAttribute('show-tree') ?? '').trim();
        this.ShowAsTree = (v == 'true');

        v = (this.getAttribute('can-move-row') ?? (this.ShowAsTree ? 'true' : 'false')).trim();
        this.CanMoveRow = (v == 'true');

        v = (this.getAttribute('key') ?? '').trim();
        this.Key = (v != '' ? v : this.Key);
        
        v = (this.getAttribute('parentkey') ?? '').trim();
        this.ParentKey = (v != '' ? v : this.ParentKey);

        v = (this.getAttribute('childs-field') ?? '').trim();
        this.Childs = (v != '' ? v : this.Childs);
    }
    _getTreeOptions=()=>
    {
        if (!this.TreeOptions || Object.keys(this.TreeOptions) < 1) 
        {
            this.TreeOptions = {
                key: this.Key,
                parentkey: this.ParentKey,
                childs: this.Childs
            }
        }
        return this.TreeOptions;
    }
    _printTreeData=()=>
    {
        if (this.ShowAsTree) this.SetTree(this.GetTree());
        else this.TableArray(this.DataArray);
        this._printRows();
    }
    _printRows=()=>
    {
        const thead = this._table.querySelector('thead');
        const tbody = this._table.querySelector('tbody');

        const trs = tbody.querySelectorAll('tr');
        let rowsExpanded = [];

        trs.forEach(r => {
            if (r.querySelector('span[expanded=true]') && (r.getAttribute('id')??''))
                rowsExpanded.push(r.getAttribute('id'));
        });

        tbody.innerHTML = '';
        let dataArray = this.DataArray;

        if (this.ShowAsTree)
        {
            let treeArray = this.TreeArray(JSON.parse(JSON.stringify(this.DataArray)));
            dataArray = this.TableArray(treeArray, null, false);
        }

        if (dataArray && dataArray.length > 0 && thead.hasChildNodes())
        {
            let treeOptions = this._getTreeOptions();
            
            dataArray.forEach((data, idx) => 
            {
                const tr = this._createFullElement('tr', { id: (data[treeOptions.key]??''), parent: (data[treeOptions.parentkey]??''), indent: (data['__level__']??0) });
                let container = null;
                
                this.Columns.forEach((column, i) => 
                {
                    const td = this._createFullElement('td', { class:'EdiTable-Cell' });
                    tr.appendChild(td);
                    
                    let coldf = this.GetColumnDefOfTd(td);
                    let value = (this._isBadgesCol(column) ? '' : (data[column.field] ?? ''));
                    
                    let valideEncode = true;

                    if(coldf.template) {
                        valideEncode = false;
                        value = this.applyTemplate(coldf.template, data);
                    }

                    if (i==0 && this.ShowAsTree)
                    {
                        container = this._createFullElement('div', { class:'container-cell-content' })
                        const content = this._createFullElement('div', { iscellcontent:'true', class:'cell-content' });
                        container.appendChild(content);
                        td.appendChild(container);
                    }

                    this.SetTdValue(td, value, valideEncode, coldf);
                    
                    td.setAttribute('data-cell',(coldf?.title??''));
                    if (this.onTdPaint) this.onTdPaint(td, idx, this.ColIndexOfTd(td), (coldf?.field??''));
                    if (this.hideColumns.includes(td.cellIndex)) td.classList.add('hidde-col');
                });

                if (this.ShowAsTree)
                {
                    const expand = this._createFullElement('span', { class:'collapse-btn', expanded: this._expandOnStart });
                    expand.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>'
                    
                    const td = tr.firstChild;                    
                    td.classList.add('cell-collapsable');
                    let ident = Number(data['__level__']??0);
                    tr.setAttribute('indent', ident);
                    this._setIndent(td, ident);
                    if(data['__havechilds__'] && container) container.prepend(expand);
                    else this._setIndent(td, ident+.7);

                    expand.onclick = e => {
                        e.stopPropagation();
                        if (expand.getAttribute('expanded') == 'true')
                            this.CollapseRow(tr);
                        else
                            this.ExpandRow(tr);
                    }
                    if (!this._expandOnStart) {
                        expand.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16"><path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/></svg>';
                        if (ident > 0) {
                            tr.classList.add('hidde-row');
                            expand.setAttribute('expanded','false');
                        }
                    }
                }

                this._decorateRow(tr, idx, data);
                tbody.appendChild(tr);
            });  
        }
        rowsExpanded.forEach(trId => {
            const tr = tbody.querySelector(`tr[id='${trId}']`);
            if (tr) this.ExpandRow(tr);
        });
        this.Initialize(this._table.getAttribute('id'));
        this._setMoveEvent();
    }

    _setIndent=(td, indent=0)=>
    {
        if (!td) return;
        td.style.paddingLeft = `${this._TreeValueIndent*Number(indent)}${this._TreeUnitIndent}`;
    }
    _getCurrentRow=()=>
    {
        return this.TrOfTd(this.CurrentTd());
    }
    _getChildRows=(row)=>
    {
        let parent_id = (row.getAttribute('id')??'___');
        const child_rows = this._table.querySelectorAll(`tr[parent='${parent_id}']`);
        return child_rows;
    }

    TreeArray=(dataArray, treeOptions=null)=>
    {
        if (!treeOptions) treeOptions = this._getTreeOptions();
        
        const positionObj = (list=[], data={}) => 
        {
            let parentObj = null;
            let sourcData = null;

            const _search = listObj => 
            {
                return listObj.some((obj, idx) =>  {
                    if (data[treeOptions.parentkey] == (obj[treeOptions.key]??'_'))
                        parentObj = obj;
                    else if ((data[treeOptions.key] ?? '|') == (obj[treeOptions.key] ?? '_'))
                        sourcData = { listObj, idx };
                    return ((parentObj && sourcData) || _search((obj[treeOptions.childs]??[])));
                });
            }
            
            if (!_search(list)) return;

            const parentChilds = (parentObj[treeOptions.childs]??[]);
            parentChilds.push( ...sourcData.listObj.splice(sourcData.idx, 1) );
            parentObj[treeOptions.childs] = parentChilds;
        }

        if (dataArray && dataArray.length > 0)
        {
            let copyArray = JSON.parse(JSON.stringify(dataArray));

            copyArray.forEach(data => {
                if (data[treeOptions.parentkey] != undefined) 
                    positionObj(dataArray, data);
            });
        }

        return dataArray;
    }
    TableArray=(treeArray, treeOptions=null, treeInfo=true)=>
    {
        if (!treeOptions) treeOptions = this._getTreeOptions();
        let newArray = [];
        let level = -1;

        if (treeArray && treeArray.length > 0)
        {
            const moveToFirstLevel = listObj => 
            {
                level++;
                listObj.forEach(obj => {
                    let childsObj = (obj[treeOptions.childs]??[]);
                    newArray.push(obj);
                    if (!treeInfo) {
                        obj['__level__']=level;
                        obj['__havechilds__']=((obj[treeOptions.childs]??[]).length > 0);
                    }
                    if (childsObj.length > 0) {
                        delete obj[treeOptions.childs];
                        moveToFirstLevel(childsObj);
                        level--;
                    }
                });
            }

            moveToFirstLevel(treeArray);
        }
        return newArray;
    }
    SetTree=(treeData, treeOptions=null)=>
    {
        if (treeOptions) this.TreeOptions = treeOptions;
        if (treeData && treeData.length > 0)
            this.DataArray = this.TableArray(treeData, this.TreeOptions);
    }
    GetTree=(treeOptions)=>
    {
        return this.TreeArray(this.DataArray, treeOptions);
    }
    RowIndentation=(row, treeOptions=null)=>
    {
        if (!row) return null;
        return Number((row.getAttribute('indent') ?? 0));
    }
    RowIndent=(row, inFront=true, treeOptions=null)=>
    {
        if (!row) return;
        if (!treeOptions) treeOptions = this._getTreeOptions();

        const indexRow = this._getRowIndex(row);
        let sourceData = this.DataArray[indexRow];
        let targetData = null;

        if (!sourceData) return;

        if (inFront)
        {
            // Obtener el hermano superior
            let flag = false;
            const search = (list) => 
            {
                return list.some((obj, idx) => 
                {
                    if (sourceData[treeOptions.key] == (obj[treeOptions.key]??'_')) {
                        flag = true;
                        targetData = list[idx-1];
                    }
                    return (flag || search((obj[treeOptions.childs]??[])));
                });
            }

            this.GetTree(treeOptions);
            let match = search(this.DataArray);
            this.SetTree(this.DataArray, treeOptions);

            if (!match) return;
        }
        else
        {
            // Obtener el padre
            targetData = this.DataArray.find(d => (d[treeOptions.key] ?? '_') == (sourceData[treeOptions.parentkey] ?? '|'));
            if (!targetData) return;
        }

        if (sourceData && targetData)
        {
            if(this._moveData(sourceData, targetData, inFront, treeOptions))
                this._printRows();
        }
    }

    ExpandRow(row)
    {
        if (!row) return;

        const btnCollapse = row.querySelector('span.collapse-btn')
        if (btnCollapse) {
            btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>';
            btnCollapse.setAttribute('expanded', 'true');
        }

        const removeHidde = rows =>{
            if (rows && rows.length > 0) {
                rows.forEach(r => {
                    r.classList.remove('hidde-row');
                    // const btnCollapse = r.querySelector('span.collapse-btn')
                    // if (btnCollapse) {
                    //     btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>';
                    //     btnCollapse.setAttribute('expanded', 'true');
                    // }
                    //removeHidde(this._getChildRows(r));
                });
            }
        }
        const rows = this._getChildRows(row);
        removeHidde(rows);
    }
    CollapseRow(row)
    {
        if (!row) return;

        const btnCollapse = row.querySelector('span.collapse-btn')
        if (btnCollapse) {
            btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16"><path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/></svg>';
            btnCollapse.setAttribute('expanded', 'false');
        }

        const removeHidde = rows =>{
            if (rows && rows.length > 0) {
                rows.forEach(r => {
                    r.classList.add('hidde-row');
                    const btnCollapse = r.querySelector('span.collapse-btn')
                    if (btnCollapse) {
                        btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16"><path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/></svg>';
                        btnCollapse.setAttribute('expanded', 'false');
                    }
                    removeHidde(this._getChildRows(r));
                });
            }
        }
        const rows = this._getChildRows(row);
        removeHidde(rows);
    }

    Sort=(dataArray, field, desc=false)=>
    {
        if (dataArray && dataArray.length > 0)
        {
            let orientation = (!desc) ? "ASC" : "DESC";
            this.OnSort(field,orientation);

            dataArray.sort((a,b) => 
            {
                let valA = (a[field]??'');
                let valB = (b[field]??'');

                let numb = (typeof valA === 'number' && typeof valB === 'number');

                if (!numb) {
                    valA = valA.toString().toUpperCase();
                    valB = valB.toString().toUpperCase();
                }

                if (!desc) return (valA > valB ? 1 : valA < valB ? -1 : 0);
                else return (valB > valA ? 1 : valB < valA ? -1 : 0);
            });
        }
    }
    SortTree=(treeArray,field,desc, treeOptions=null)=>
    {
        if (!treeOptions) treeOptions = this._getTreeOptions();

        const sortData = (list) => 
        {
            if (list && list.length > 0)
            {
                list.sort((a,b) => 
                {
                    if ((a[treeOptions.childs]??[]).length > 0) { sortData(a[treeOptions.childs]); }
                    if ((b[treeOptions.childs]??[]).length > 0) { sortData(b[treeOptions.childs]); }

                    let valA = (a[field]??'');
                    let valB = (b[field]??'');

                    let numb = (typeof valA === 'number' && typeof valB === 'number');

                    if (!numb) {
                        valA = valA.toString().toUpperCase();
                        valB = valB.toString().toUpperCase();
                    }

                    if (!desc) return (valA > valB ? 1 : valA < valB ? -1 : 0);
                    else return (valB > valA ? 1 : valB < valA ? -1 : 0);
                });
            }
        }

        sortData(treeArray);
    }

    setInputKey(column, inputkey)
    {
        let coldef = this.Columns.find(c => c.field == column)
        coldef['inputkey'] = inputkey;
    }
    showInputKey=(td, searchText='', autoselect=true)=>
    {
        let coldef = this.GetColumnDefOfTd(td);
        if (coldef && coldef.inputkey) coldef.inputkey.searchText(searchText, autoselect);
    }
    replaceSymbols={
        "'":"&apos;",
        '"':"&quot;",
        ">":"&gt;",
        "<":"&lt;",
    };
    setHtmlEncode(value)
    {
        if (typeof value !== 'string') return value;
        for(const r in this.replaceSymbols)
            value = value.replaceAll(r, this.replaceSymbols[r]);
        return value;
    }
    getHtmlDecode(value)
    {
        if (typeof value !== 'string') return value;
        for(const r in this.replaceSymbols)
            value = value.replaceAll(this.replaceSymbols[r], r);
        return value;
    }
    backup()
    {
        this._dataArrayBackup = JSON.parse(JSON.stringify(this.DataArray));
    }
    restore()
    {
        if (!this._dataArrayBackup) return;

        this._dataArrayBackup.forEach(data => delete data.isDirty);
        this.DataArray = JSON.parse(JSON.stringify(this._dataArrayBackup));
        this._refreshTable();
    }
    restoreRow(indexRow)
    {
        if (!this._dataArrayBackup) return;
        
        let objBack = this._dataArrayBackup[indexRow];
        delete objBack.isDirty;
        this.DataArray[indexRow] = JSON.parse(JSON.stringify(objBack));
        this.UpdateRow(indexRow);
    }
    _count_isdirty=0;
    get IsDirty()
    {
        if (this._count_isdirty>0) return true;
        return false;

    }
    setIsDirty(indexRow, value)
    {
        if (!this._dataArrayBackup) return;

        let backLength = this._dataArrayBackup.length;
        let dataLength = this.DataArray.length;

        if (indexRow <= dataLength-1  && indexRow > backLength-1)
        {
            for (let index = backLength; index <= indexRow; index++) 
            {
                this._dataArrayBackup.push(JSON.parse(JSON.stringify(this.DataArray[index])));
            }
        }

        if (value!=this.getIsDirty(indexRow))
        {
            let c=this._count_isdirty;
            if (value) this._count_isdirty++; else this._count_isdirty--;
            if (this._count_isdirty>0 !=c>0)
            {
                if (this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged]!=undefined)
                    this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged]();
            }
        }

        let obj = this._dataArrayBackup[indexRow];
        if (obj) obj['isDirty'] = value;
        
    }
    getIsDirty(indexRow)
    {
        let obj = this._dataArrayBackup[indexRow];
        return (obj?.isDirty ?? false);
    }
    OnSort = (field, sort) => {
        if (this._getCurren().Events[this.EdiTable.Const.Events.OnSort]==undefined) return;

        this.Columns.forEach((col) => { delete col.sort });
        
        let columnDef = this.Columns.find((col) => { return (col.field === field) });
        let thead = this.GetTHead();
        let th = thead.querySelector(`[field=${field}]`);
        
        columnDef["sort"] = sort;

        var eventArgs={
            th:th,
            coldef:columnDef,
            caption:th.textContent
        };

        this._getCurren().Events[this.EdiTable.Const.Events.OnSort](eventArgs);
    }
    changeColumnTitle(field,title)
    {
        const th = this._table.querySelector(`thead > tr th[field="${field}"] span`);
        if (!th) return false;

        th.textContent = title;
        return true;
    }
    // ========================= MEJORAS VISUALES: TARJETAS, BADGES Y DECORACIÓN DE FILAS
    //
    // Todo lo de esta sección es opcional. Si no se usa ningún atributo ni propiedad nueva,
    // el componente genera exactamente el mismo DOM y el mismo CSS que antes.

    CardsMode = null;                   // 'auto' | 'always' | 'never' | null (null: se deriva de cards-responsive)
    CardsBreakpoint = '768px';          // Ancho por debajo del cual se muestran tarjetas (modo auto)
    CardsBreakpointTarget = 'viewport'; // 'viewport' | 'container'
    CardsLayout = 'grid';               // 'grid' | 'stacked' | 'slots'
    CardsFieldGap = null;               // Distancia vertical entre campos de la tarjeta (def. 4px)
    CardsPadding = null;                // Relleno de la tarjeta (def. '2rem 0' en grid/stacked, '.6rem .75rem' en slots)
    CardsGap = null;                    // Separación entre tarjetas (def. 0)
    CardsLabelWidth = null;             // Ancho de la etiqueta (def. 35%; '0' oculta etiquetas)
    CardsHideEmpty = false;             // Oculta en la tarjeta los campos sin valor
    CardColumns = null;                 // Array<string|{field,order,slot,label,hideEmpty}> alternativa a los atributos de columna
    BadgesField = '__badges';           // Campo reservado de cada fila con sus badges
    BadgeTooltip = 'native';            // 'native' (title) | 'custom'
    BadgeSelectsRow = false;            // Si el clic en un badge también selecciona la celda
    RowClassField = null;               // Campo de cada fila con clases CSS para su <tr>
    TemplateEncode = false;             // Escapa los valores de DataRow dentro de las plantillas (template)
    NativeEvents = false;               // Permite registrar eventos nativos (click, etc.) con addEventListener
    Locale = null;                      // Idioma para format="relative" (def. lang del documento o es-MX)
    RowBadges = null;                   // (row, irow) => badge | badge[]
    BadgeOnClick = null;                // (irow, badge, row, event) => void
    RowClass = null;                    // (row, irow) => 'clase1 clase2' | string[]
    RowAccent = null;                   // (row, irow) => color CSS | null
    CellClass = null;                   // (row, field, irow, coldef) => 'clase' | string[]
    onRowPaint = null;                  // (tr, irow, row) => void
    onCardPaint = null;                 // (tr, irow, row) => void  (solo en vista de tarjetas)
    RelativeDateFormatter = null;       // (value, date) => string

    _cardsAttrs = false;
    _cardsEligible = false;
    _cardsNoEditable = false;
    _isCardView = false;
    _viewReady = false;
    _viewWatch = null;
    _cardsInfo = null;
    _tipEl = null;
    _badgeOverrides = new Map();
    _badgeOverridesObj = new WeakMap();
    _hasBadgeOverrides = false;

    /** Indica si en este momento la tabla se muestra como tarjetas. */
    get IsCardView() { return this._isCardView; }

    _readVisualAttributes()
    {
        const a = (n) => (this.hasAttribute(n) ? (this.getAttribute(n) ?? '').trim() : '');
        let v;
        if ((v = a('cards-mode')))              { this.CardsMode = v.toLowerCase(); this._cardsAttrs = true; }
        if ((v = a('cards-breakpoint')))        { this.CardsBreakpoint = v; this._cardsAttrs = true; }
        if ((v = a('cards-breakpoint-target'))) { this.CardsBreakpointTarget = v.toLowerCase(); this._cardsAttrs = true; }
        if ((v = a('cards-layout')))            { this.CardsLayout = v.toLowerCase(); this._cardsAttrs = true; }
        if ((v = a('cards-field-gap')))         { this.CardsFieldGap = v; this._cardsAttrs = true; }
        if ((v = a('cards-padding')))           { this.CardsPadding = v; this._cardsAttrs = true; }
        if ((v = a('cards-gap')))               { this.CardsGap = v; this._cardsAttrs = true; }
        if ((v = a('cards-label-width')))       { this.CardsLabelWidth = v; this._cardsAttrs = true; }
        if ((v = a('cards-hide-empty')))        { this.CardsHideEmpty = (v == 'true'); this._cardsAttrs = true; }
        if ((v = a('badges-field')))            this.BadgesField = v;
        if ((v = a('badge-tooltip')))           this.BadgeTooltip = v.toLowerCase();
        if ((v = a('badge-selects-row')))       this.BadgeSelectsRow = (v == 'true');
        if ((v = a('row-class-field')))         this.RowClassField = v;
        if ((v = a('template-encode')))         this.TemplateEncode = (v == 'true');
        if ((v = a('native-events')))           this.NativeEvents = (v == 'true');
        if ((v = a('locale')))                  this.Locale = v;
        if ((v = a('keep-selection-visible')))  this.KeepSelectionVisible = (v == 'false' ? false : (v == 'if-visible' ? 'if-visible' : true));
    }

    _getExtraCss=()=>
    {
        return `
                    /* ===== EditTable: decoración de filas ===== */
                    tbody tr.et-accent > td:first-child { box-shadow: inset 3px 0 0 var(--et-row-accent); }
                    td.et-rel .cell-content { display: none !important; }
                    td.et-rel::after { content: attr(data-rel); white-space: nowrap; }
                    td.et-rel:has(#__table_selector) .cell-content { display: flex !important; }
                    td.et-rel:has(#__table_selector)::after { content: none; }
                    table.et-cards-custom:not(.et-cards) .et-table-hidden { display: none !important; }

                    /* ===== EditTable: badges ===== */
                    .et-badge-wrap { display: flex; align-items: center; gap: var(--et-badges-gap, .4rem); width: 100%; height: 100%; min-width: 0; }
                    .et-badge-wrap > .cell-content { flex: 1 1 auto; min-width: 0; }
                    .et-badges { display: inline-flex; align-items: center; flex: 0 0 auto; gap: var(--et-badges-gap, .25rem); }
                    .et-badges-overlay-start, .et-badges-overlay-end { position: absolute; top: 1px; z-index: 2; }
                    .et-badges-overlay-start { inset-inline-start: 1px; }
                    .et-badges-overlay-end { inset-inline-end: 1px; }
                    .et-badges-overlay-start .et-badge, .et-badges-overlay-end .et-badge { --et-badge-size: 1.05rem; }
                    .et-badge {
                        box-sizing: border-box; position: relative;
                        display: inline-flex; align-items: center; justify-content: center; gap: .2em;
                        min-width: var(--et-badge-size, 1.5rem); height: var(--et-badge-size, 1.5rem); padding: 0 .35em;
                        border-radius: 999px; background: var(--et-badge-bg, #8696A0); color: var(--et-badge-color, #FFF);
                        font-size: calc(var(--et-badge-size, 1.5rem) * .46); font-weight: 600; line-height: 1;
                        white-space: nowrap; user-select: none; overflow: hidden;
                    }
                    .et-badge svg { width: 62%; height: 62%; flex: 0 0 auto; }
                    .et-badge.et-badge-img { padding: 0; }
                    .et-badge img { width: 100%; height: 100%; object-fit: cover; }
                    .et-badge.et-clickable { cursor: pointer; }
                    .et-badge:focus-visible { outline: 2px solid #3D75DD; outline-offset: 1px; }
                    .et-tooltip {
                        position: fixed; display: none; z-index: 2147483000; pointer-events: none;
                        max-width: 280px; padding: .3rem .55rem; border-radius: 4px;
                        background: #1F2328; color: #FFF; font-size: .75rem; line-height: 1.3; white-space: normal;
                    }

                    /* ===== EditTable: vista de tarjetas configurable ===== */
                    table.et-cards { display: block; border-spacing: 0; }
                    table.et-cards thead, table.et-cards th { display: none !important; }
                    table.et-cards tbody { display: flex; flex-direction: column; gap: var(--et-card-gap, 0px); }
                    table.et-cards tbody tr {
                        display: flex; flex-direction: column; position: relative; box-sizing: border-box;
                        outline: 1px solid #DDD; padding: var(--et-card-padding, 2rem 0);
                    }
                    table.et-cards tbody tr.et-accent { box-shadow: inset 4px 0 0 var(--et-row-accent); }
                    table.et-cards tbody tr.et-accent > td:first-child { box-shadow: none; }
                    table.et-cards td {
                        display: grid !important; grid-template-columns: var(--et-card-label-width, 35%) minmax(0, 1fr) !important;
                        word-wrap: break-word; outline: none; height: auto;
                        padding: var(--et-card-field-gap, 4px) 4px var(--et-card-field-gap, 4px) 1rem;
                    }
                    table.et-cards td::before { content: attr(data-card-label) ": "; font-weight: 600; }
                    table.et-cards td.et-nolabel::before, table.et-cards.et-cards-nolabels td::before { content: none; }
                    table.et-cards td.et-nolabel, table.et-cards.et-cards-nolabels td { grid-template-columns: minmax(0, 1fr) !important; }

                    table.et-cards.et-layout-stacked td { grid-template-columns: minmax(0, 1fr) !important; }
                    table.et-cards.et-layout-stacked td::before { font-size: .78em; font-weight: 500; opacity: .7; }

                    table.et-cards.et-layout-slots tbody tr {
                        display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center;
                        column-gap: .75rem; row-gap: var(--et-card-field-gap, 2px); padding: var(--et-card-padding, .6rem .75rem);
                    }
                    table.et-cards.et-layout-slots td { display: block !important; padding: 0; min-width: 0; }
                    table.et-cards.et-layout-slots td::before { content: none; }
                    table.et-cards.et-layout-slots td.et-haslabel { display: flex !important; align-items: baseline; gap: .3em; }
                    table.et-cards.et-layout-slots td.et-haslabel::before { content: attr(data-card-label) ":"; font-weight: 600; flex: 0 0 auto; }
                    table.et-cards.et-layout-slots td.et-haslabel > * { min-width: 0; }
                    table.et-cards.et-layout-slots td[data-card-slot=avatar] { grid-column: 1; grid-row: span var(--et-avatar-rows, 3); }
                    table.et-cards.et-layout-slots td[data-card-slot=avatar] .et-badge { --et-badge-size: var(--et-avatar-size, 2.6rem); width: var(--et-badge-size); padding: 0; }
                    table.et-cards.et-layout-slots td[data-card-slot=title],
                    table.et-cards.et-layout-slots td[data-card-slot=subtitle],
                    table.et-cards.et-layout-slots td[data-card-slot=body] { grid-column: 2; }
                    table.et-cards.et-layout-slots td[data-card-slot=meta],
                    table.et-cards.et-layout-slots td[data-card-slot=badge] { grid-column: 3; justify-self: end; text-align: end; }
                    table.et-cards.et-layout-slots td[data-card-slot=footer] { grid-column: 1 / -1; font-size: .85em; }
                    table.et-cards.et-layout-slots td[data-card-slot=title] { font-weight: 600; }
                    table.et-cards.et-layout-slots td[data-card-slot=title] .cell-content,
                    table.et-cards.et-layout-slots td[data-card-slot=subtitle] .cell-content,
                    table.et-cards.et-layout-slots td[data-card-slot=meta] .cell-content { display: block; white-space: nowrap; text-overflow: ellipsis; }
                    table.et-cards.et-layout-slots td[data-card-slot=meta] { font-size: .78em; opacity: .75; }
                    table.et-cards.et-layout-slots td[data-card-slot=subtitle] { font-size: .86em; opacity: .8; }
                    table.et-cards.et-layout-slots td[data-card-slot=meta] .cell-content,
                    table.et-cards.et-layout-slots td[data-card-slot=badge] .cell-content { justify-content: flex-end; }

                    /* Ocultamientos: al final y con especificidad de id (:not(#…)) para ganar a cualquier layout */
                    table.et-cards tbody td.et-card-hidden:not(#__et_none),
                    table.et-cards tbody td.et-hide-empty:not(#__et_none),
                    table.et-cards tbody td.hidde-col:not(#__et_none) { display: none !important; }
        `;
    }

    // ---------- Vista de tarjetas ----------

    _isBadgesCol=(col)=> ((col?.type ?? '').toString().toLowerCase() == 'badges');

    _getCardsInfo=()=>
    {
        if (this._cardsInfo && this._cardsInfo.n === this.Columns.length) return this._cardsInfo;

        const keys = ['card', 'table', 'cardorder', 'cardlabel', 'cardslot', 'cardhideempty'];
        const badgeCols = [];
        this.Columns.forEach((c, i) => { if (this._isBadgesCol(c)) badgeCols.push(i); });

        this._cardsInfo = {
            n: this.Columns.length,
            columnAttrs: this.Columns.some(c => c && keys.some(k => c[k] !== undefined)),
            anyCard: this.Columns.some(c => c && c.card !== undefined),
            badgeCols
        };
        return this._cardsInfo;
    }

    _usesCustomCards=()=>
    {
        if (this._cardsAttrs || this.CardsMode || Array.isArray(this.CardColumns)) return true;
        if ((this.CardsLayout ?? 'grid') != 'grid' || (this.CardsBreakpoint ?? '768px') != '768px') return true;
        if ((this.CardsBreakpointTarget ?? 'viewport') != 'viewport' || this.CardsHideEmpty) return true;
        if (this.CardsFieldGap || this.CardsPadding || this.CardsGap || this.CardsLabelWidth) return true;
        return this._getCardsInfo().columnAttrs;
    }

    _cardsModeValue=()=>
    {
        const m = (this.CardsMode ?? '').toString().toLowerCase();
        if (m == 'auto' || m == 'always' || m == 'never') return m;
        return (this.cardsResponsive ? 'auto' : 'never');
    }

    _cardDef=(coldef, i)=>
    {
        const def = { show: true, order: null, slot: null, label: null, hideEmpty: null };
        if (!coldef) return def;

        if (this._getCardsInfo().anyCard) def.show = ((coldef.card ?? '') == 'true');
        if ((coldef.cardorder ?? '') !== '' && !isNaN(Number(coldef.cardorder))) def.order = Number(coldef.cardorder);
        if (coldef.cardslot) def.slot = coldef.cardslot.toLowerCase();
        if (coldef.cardlabel !== undefined) def.label = coldef.cardlabel;
        if (coldef.cardhideempty !== undefined) def.hideEmpty = (coldef.cardhideempty == 'true');

        if (Array.isArray(this.CardColumns))
        {
            const idx = this.CardColumns.findIndex(c => (typeof c == 'string' ? c : c?.field) == coldef.field);
            def.show = (idx >= 0);
            if (idx >= 0)
            {
                const c = this.CardColumns[idx];
                def.order = idx;
                if (c && typeof c == 'object')
                {
                    if (c.order !== undefined) def.order = Number(c.order);
                    if (c.slot) def.slot = String(c.slot).toLowerCase();
                    if (c.label !== undefined) def.label = c.label;
                    if (c.hideEmpty !== undefined) def.hideEmpty = !!c.hideEmpty;
                }
            }
        }
        return def;
    }

    _applyCardsConfig=()=>
    {
        const t = this._table;
        if (!t) return;

        if (!this._usesCustomCards())
        {
            // Comportamiento original, sin cambios.
            t.classList.toggle('table-cards', !!this._cardsEligible);
            return;
        }

        t.classList.remove('table-cards');
        t.classList.add('et-cards-custom');
        const layout = (this.CardsLayout || 'grid');
        ['grid', 'stacked', 'slots'].forEach(l => t.classList.toggle('et-layout-' + l, layout == l));

        const vars = {
            '--et-card-field-gap': this.CardsFieldGap,
            '--et-card-padding': this.CardsPadding,
            '--et-card-gap': this.CardsGap,
            '--et-card-label-width': this.CardsLabelWidth
        };
        Object.keys(vars).forEach(k => { if (vars[k]) t.style.setProperty(k, vars[k]); else t.style.removeProperty(k); });

        const lw = (this.CardsLabelWidth ?? '').toString().trim().toLowerCase();
        t.classList.toggle('et-cards-nolabels', ['0', '0px', '0%', 'none'].includes(lw));

        const headRow = t.querySelectorAll('thead tr')[this.TheadRowIndex];
        if (headRow) headRow.querySelectorAll('th').forEach((th, i) => th.classList.toggle('et-table-hidden', ((this.Columns[i]?.table ?? '') == 'false')));
    }

    _toPx=(value)=>
    {
        const s = String(value ?? '').trim();
        const n = parseFloat(s);
        if (isNaN(n)) return 768;
        if (/rem$/i.test(s)) return n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
        if (/em$/i.test(s)) return n * (parseFloat(getComputedStyle(this).fontSize) || 16);
        return n;
    }

    _teardownViewWatcher=()=>
    {
        const w = this._viewWatch;
        if (!w) return;
        if (w.mq && w.fn) w.mq.removeEventListener('change', w.fn);
        if (w.ro) w.ro.disconnect();
        this._viewWatch = null;
    }

    _setupViewWatcher=()=>
    {
        this._teardownViewWatcher();
        if (!this._table) return;

        const evaluate = () => this._setCardView(this._computeCardView());
        const custom = this._usesCustomCards();
        const mode = this._cardsModeValue();
        const watch = {};

        if (!custom)
        {
            if (this._cardsEligible && window.matchMedia)
            {
                watch.mq = window.matchMedia('screen and (max-width: 768px)');
                watch.fn = evaluate;
                watch.mq.addEventListener('change', evaluate);
            }
        }
        else if (mode == 'auto' && this._cardsNoEditable)
        {
            if ((this.CardsBreakpointTarget ?? 'viewport') == 'container' && window.ResizeObserver)
            {
                watch.ro = new ResizeObserver(() => evaluate());
                watch.ro.observe(this._table.parentElement ?? this._table);
            }
            else if (window.matchMedia)
            {
                watch.mq = window.matchMedia(`screen and (max-width: ${this.CardsBreakpoint || '768px'})`);
                watch.fn = evaluate;
                watch.mq.addEventListener('change', evaluate);
            }
        }

        this._viewWatch = watch;
        this._setCardView(this._computeCardView(), !this._viewReady);
        this._viewReady = true;
    }

    _computeCardView=()=>
    {
        const w = this._viewWatch ?? {};
        if (!this._usesCustomCards())
            return !!(this._cardsEligible && w.mq && w.mq.matches);

        const mode = this._cardsModeValue();
        if (mode == 'always') return true;
        if (mode == 'never' || !this._cardsNoEditable) return false;

        if (w.ro)
        {
            const box = this._table?.parentElement ?? this._table;
            const width = box ? box.getBoundingClientRect().width : 0;
            return (width > 0 && width <= this._toPx(this.CardsBreakpoint));
        }
        return !!(w.mq && w.mq.matches);
    }

    _setCardView=(value, silent=false)=>
    {
        value = !!value;
        const changed = (value !== this._isCardView);
        this._isCardView = value;

        if (this._table && this._usesCustomCards()) this._table.classList.toggle('et-cards', value);
        if (!changed) return;

        this.RefreshBadges();
        this._scheduleEnsureSelection();
        if (value && typeof this.onCardPaint == 'function')
            this._eachRow((tr, i, data) => this.onCardPaint(tr, i, data));

        if (!silent) this._fireEvent(this.EdiTable.Const.Events.ViewModeChanged, { sender: this._getCurren(), mode: (value ? 'cards' : 'table') });
    }

    /**
     * Vuelve a aplicar la configuración visual (tarjetas, clases, badges) después de cambiar
     * propiedades por JS, por ejemplo: CardsMode, CardsLayout, CardColumns, RowClass o RowBadges.
     */
    RefreshView=()=>
    {
        this._cardsInfo = null;
        this._applyCardsConfig();
        this._setupViewWatcher();
        this.RefreshDecorations();
    }

    // ---------- Mantener visible la fila seleccionada al redimensionar ----------

    // true (predeterminado): al cambiar el ancho, si la fila seleccionada quedó fuera del área visible, se desplaza hasta ella.
    // 'if-visible': solo si la fila era visible antes del cambio (respeta si el usuario se desplazó a otra parte).
    // false: desactivado.
    KeepSelectionVisible = true;
    _selTr = null;
    _selVisible = false;
    _selIO = null;
    _widthRO = null;
    _lastWidth = -1;
    _ensureRaf = 0;
    _ensureWasVisible = false;
    _keepUntil = 0;

    _trackSelection=(tr)=>
    {
        this._selTr = tr ?? null;
        this._selVisible = !!tr; // recién seleccionada: el usuario la está viendo
        if (!window.IntersectionObserver) return;

        if (!this._selIO)
        {
            // Sin raíz explícita: considera el recorte de todos los contenedores con scroll, incluidos los de la página.
            this._selIO = new IntersectionObserver((entries) => {
                entries.forEach(en => { if (en.target === this._selTr) this._selVisible = en.isIntersecting; });
            });
        }
        this._selIO.disconnect();
        if (tr) this._selIO.observe(tr);
    }

    _getSelectedTr=()=>
    {
        const ok = (tr) => !!(tr && tr.isConnected && this._table && this._table.contains(tr));
        if (ok(this._selTr)) return this._selTr;

        // La tabla se volvió a pintar (ordenamiento, recarga): buscar la selección actual
        let tr = this._table?.querySelector('tbody tr.' + this.CSS.RowSelected) ?? null;
        if (!ok(tr)) tr = this.CurrentTd()?.closest('tr') ?? null;
        if (!ok(tr)) return null;

        this._trackSelection(tr);
        return tr;
    }

    _setupSelectionKeeper=()=>
    {
        if (this._widthRO || !window.ResizeObserver || !this._table) return;

        const box = this._table.parentElement ?? this._table;
        this._widthRO = new ResizeObserver((entries) => {
            const w = Math.round(entries[entries.length - 1].contentRect.width);
            if (w === this._lastWidth) return; // solo cambios de ancho; los de alto (datos nuevos) no mueven el scroll
            const first = (this._lastWidth < 0);
            this._lastWidth = w;
            if (!first) this._scheduleEnsureSelection();
        });
        this._widthRO.observe(box);
    }

    _scheduleEnsureSelection=()=>
    {
        if (!this.KeepSelectionVisible) return;

        // Modo 'if-visible': se evalúa con el estado anterior al cambio (el IntersectionObserver aún no lo actualiza)
        // y durante un redimensionamiento continuo se mantiene la intención de la primera evaluación.
        const wasVisible = (this.KeepSelectionVisible !== 'if-visible')
            || this._selVisible || (performance.now() < this._keepUntil);
        if (this._ensureRaf) { this._ensureWasVisible = this._ensureWasVisible || wasVisible; return; }

        this._ensureWasVisible = wasVisible;
        this._ensureRaf = requestAnimationFrame(() => {
            this._ensureRaf = 0;
            if (this._ensureWasVisible) this.EnsureSelectionVisible();
        });
    }

    _composedParent=(el)=> (el.assignedSlot ?? el.parentElement ?? (el.parentNode instanceof ShadowRoot ? el.parentNode.host : null));

    /** Contenedor con scroll vertical más cercano al componente (cruza el shadow DOM). Nunca la página. */
    _getScrollContainer=(from)=>
    {
        const pageScroller = document.scrollingElement ?? document.documentElement;
        let el = from;
        while (el)
        {
            el = this._composedParent(el);
            if (!el || el === document.body || el === document.documentElement || el === pageScroller) return null;

            const oy = getComputedStyle(el).overflowY;
            if ((oy == 'auto' || oy == 'scroll' || oy == 'overlay') && el.scrollHeight > el.clientHeight + 1) return el;
        }
        return null;
    }

    /**
     * Si la fila seleccionada (o su tarjeta) está fuera del área visible de su contenedor con scroll,
     * desplaza solo ese contenedor lo mínimo necesario. No mueve la página ni otros contenedores,
     * ni el scroll horizontal.
     * @param {{behavior?: 'auto'|'smooth'}} options
     * @returns {boolean} true si había una fila seleccionada.
     */
    EnsureSelectionVisible=(options={})=>
    {
        const tr = this._getSelectedTr();
        if (!tr) return false;

        const firstTd = tr.querySelector('td:not(.hidde-col)');
        const isCard = !!(firstTd && getComputedStyle(firstTd).display != 'table-cell');
        const selTd = this.CurrentTd();
        const target = (!isCard && selTd && tr.contains(selTd)) ? selTd : tr;

        const box = this._getScrollContainer(target);
        if (!box) return true;

        // Área visible del contenedor: la suya, recortada por los contenedores superiores y la ventana
        // (solo para medir; a ellos nunca se les mueve el scroll).
        const b = box.getBoundingClientRect();
        let viewTop = b.top + box.clientTop;
        let viewBottom = viewTop + box.clientHeight;
        let clipTop = Math.max(viewTop, 0), clipBottom = Math.min(viewBottom, window.innerHeight);
        for (let el = this._composedParent(box); el && el !== document.documentElement; el = this._composedParent(el))
        {
            if (getComputedStyle(el).overflowY == 'visible') continue;
            const a = el.getBoundingClientRect();
            clipTop = Math.max(clipTop, a.top + el.clientTop);
            clipBottom = Math.min(clipBottom, a.top + el.clientTop + el.clientHeight);
        }
        if (clipBottom - clipTop > 20) { viewTop = clipTop; viewBottom = clipBottom; } // si casi no se ve, usar el área propia

        const thead = this._table.querySelector('thead');
        const headCss = thead ? getComputedStyle(thead) : null;
        if (headCss && headCss.display != 'none' && headCss.position == 'sticky')
        {
            const h = thead.getBoundingClientRect();
            if (h.bottom > viewTop && h.top < viewTop + 2) viewTop = h.bottom; // el encabezado está pegado arriba
        }

        const r = target.getBoundingClientRect();
        let delta = 0;
        if (r.top < viewTop) delta = r.top - viewTop;                                         // quedó arriba
        else if (r.bottom > viewBottom) delta = Math.min(r.bottom - viewBottom, r.top - viewTop); // quedó abajo (si no cabe, alinea arriba)

        if (Math.abs(delta) >= 1) box.scrollTo({ top: box.scrollTop + delta, behavior: (options.behavior ?? 'auto') });

        this._keepUntil = performance.now() + 400;
        return true;
    }

    // ---------- Decoración de filas ----------

    _eachRow=(fn)=>
    {
        const tbody = this._table?.querySelector('tbody');
        if (!tbody) return;
        Array.from(tbody.rows).forEach((tr, i) => fn(tr, i, (tr._etData ?? this.DataArray[i] ?? {})));
    }

    /** Vuelve a aplicar clases, acentos, atributos de tarjeta y badges a todas las filas. */
    RefreshDecorations=()=>
    {
        this._eachRow((tr, i, data) => this._decorateRow(tr, i, data));
    }

    _splitClasses=(value)=>
    {
        if (!value) return [];
        const list = Array.isArray(value) ? value : String(value).split(/\s+/);
        return list.map(c => String(c ?? '').trim()).filter(c => c && c != this.CSS.RowSelected && c != this.CSS.Cell);
    }

    _decorateRow=(tr, idx, data)=>
    {
        // Un error en los hooks del desarrollador (RowClass, RowBadges, onRowPaint…) no debe interrumpir el pintado.
        try { this._decorateRowImpl(tr, idx, data); }
        catch (err) { console.error('EditTable: error al decorar la fila ' + idx, err); }
    }

    _decorateRowImpl=(tr, idx, data)=>
    {
        if (!tr) return;
        data = data ?? {};
        tr._etData = data;

        // Clases de la fila
        (tr._etClasses ?? []).forEach(c => tr.classList.remove(c));
        let rowClasses = [];
        if (this.RowClassField) rowClasses = rowClasses.concat(this._splitClasses(data[this.RowClassField]));
        if (typeof this.RowClass == 'function') rowClasses = rowClasses.concat(this._splitClasses(this.RowClass(data, idx)));
        rowClasses.forEach(c => tr.classList.add(c));
        tr._etClasses = rowClasses;

        // Acento de color
        const accent = (typeof this.RowAccent == 'function') ? this.RowAccent(data, idx) : null;
        tr.classList.toggle('et-accent', !!accent);
        if (accent) tr.style.setProperty('--et-row-accent', String(accent));
        else tr.style.removeProperty('--et-row-accent');

        // Celdas
        const custom = this._usesCustomCards();
        const slots = ((this.CardsLayout || 'grid') == 'slots');
        const ranks = { avatar: 0, title: 1, meta: 2, subtitle: 3, badge: 4, body: 5, footer: 6 };

        Array.from(tr.cells).forEach((td, i) => {
            const coldef = this.Columns[i];

            (td._etClasses ?? []).forEach(c => td.classList.remove(c));
            td._etClasses = [];
            if (typeof this.CellClass == 'function' && coldef)
            {
                td._etClasses = this._splitClasses(this.CellClass(data, coldef.field, idx, coldef));
                td._etClasses.forEach(c => td.classList.add(c));
            }

            this._applyRelative(td, coldef, data);

            if (!custom || !coldef) return;

            const def = this._cardDef(coldef, i);
            const explicitLabel = (def.label !== null && def.label !== undefined);
            const label = explicitLabel ? String(def.label) : String(coldef.title ?? '');
            const slot = (def.slot || 'body');

            td.classList.toggle('et-card-hidden', !def.show);
            td.classList.toggle('et-table-hidden', ((coldef.table ?? '') == 'false'));
            td.setAttribute('data-card-label', label);
            td.setAttribute('data-card-slot', slot);
            td.classList.toggle('et-nolabel', label.trim() == '');
            td.classList.toggle('et-haslabel', explicitLabel && label.trim() != '');
            td.style.order = String((slots ? (ranks[slot] ?? 5) * 1000 : 0) + (def.order ?? i));

            const empty = (!this._isBadgesCol(coldef) && this._isTdEmpty(td));
            td.classList.toggle('et-empty', empty);
            td.classList.toggle('et-hide-empty', empty && (def.hideEmpty ?? this.CardsHideEmpty));
        });

        this._paintBadges(tr, data, idx);

        if (typeof this.onRowPaint == 'function') this.onRowPaint(tr, idx, data);
        if (this._isCardView && typeof this.onCardPaint == 'function') this.onCardPaint(tr, idx, data);
    }

    _isTdEmpty=(td)=>
    {
        if (td.classList.contains('et-rel')) return !(td.getAttribute('data-rel') ?? '').trim();
        const cc = td.querySelector('div[iscellcontent=true]');
        const node = cc ?? td;
        if ((node.textContent ?? '').trim() != '') return false;
        return !node.querySelector('img,svg,input,button,video,canvas,iframe');
    }

    // ---------- Fechas relativas: <edit-th format="relative"> ----------

    _applyRelative=(td, coldef, data)=>
    {
        const on = !!(coldef && (coldef.format ?? '') == 'relative' && coldef.field);
        const txt = on ? this._formatRelative(data?.[coldef.field]) : null;

        if (txt === null || txt === '')
        {
            if (td.classList.contains('et-rel'))
            {
                td.classList.remove('et-rel');
                td.removeAttribute('data-rel');
                if (td._etRelTitle) { td.removeAttribute('title'); td._etRelTitle = false; }
            }
            return;
        }

        td.classList.add('et-rel');
        td.setAttribute('data-rel', txt);
        if (!td.hasAttribute('title') || td._etRelTitle) { td.title = String(data[coldef.field]); td._etRelTitle = true; }
        if (coldef.textalign) td.style.textAlign = coldef.textalign;
    }

    _formatRelative=(raw)=>
    {
        if (raw === undefined || raw === null || String(raw).trim() == '') return null;
        const s = String(raw).trim();
        const date = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(' ', 'T') : s);
        if (isNaN(date.getTime())) return null;

        if (typeof this.RelativeDateFormatter == 'function') return this.RelativeDateFormatter(raw, date);

        const locale = this.Locale || document.documentElement.lang || 'es-MX';
        const now = new Date();
        const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const diffDays = Math.round((day(now) - day(date)) / 86400000);

        try
        {
            if (diffDays == 0) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            if (diffDays == 1)
            {
                const t = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-1, 'day');
                return t.charAt(0).toUpperCase() + t.slice(1);
            }
            if (diffDays > 1 && diffDays < 7)
            {
                const t = date.toLocaleDateString(locale, { weekday: 'long' });
                return t.charAt(0).toUpperCase() + t.slice(1);
            }
            return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' });
        }
        catch { return s; }
    }

    // ---------- Badges ----------

    _normBadges=(value)=>
    {
        if (value === undefined || value === null || value === false || value === '') return [];
        const list = Array.isArray(value) ? value : [value];
        return list
            .filter(b => b !== undefined && b !== null && b !== false && b !== '')
            .map(b => (typeof b == 'object' ? b : { text: String(b) }));
    }

    _badgeKey=(data)=>
    {
        // Sin efectos secundarios: no inicializa TreeOptions (se lee antes de _initTreeValues).
        const k = (this.TreeOptions && Object.keys(this.TreeOptions).length > 0) ? this.TreeOptions.key : this.Key;
        const v = data?.[k];
        return (v === undefined || v === null || v === '') ? null : ('k:' + v);
    }

    _getBadgeOverride=(data)=>
    {
        if (!this._hasBadgeOverrides) return undefined;
        const k = this._badgeKey(data);
        if (k && this._badgeOverrides.has(k)) return this._badgeOverrides.get(k);
        if (data && typeof data == 'object' && this._badgeOverridesObj.has(data)) return this._badgeOverridesObj.get(data);
        return undefined;
    }

    _setBadgeOverride=(data, list)=>
    {
        const k = this._badgeKey(data);
        if (list === undefined)
        {
            if (k) this._badgeOverrides.delete(k);
            if (data && typeof data == 'object') this._badgeOverridesObj.delete(data);
            return;
        }
        this._hasBadgeOverrides = true;
        if (k) this._badgeOverrides.set(k, list);
        if (data && typeof data == 'object') this._badgeOverridesObj.set(data, list);
    }

    _effectiveBadges=(data, idx)=>
    {
        const o = this._getBadgeOverride(data);
        if (o !== undefined) return this._normBadges(o);
        if (typeof this.RowBadges == 'function') return this._normBadges(this.RowBadges(data, idx));
        return this._normBadges(data?.[this.BadgesField]);
    }

    _rowContext=(irow)=>
    {
        const tr = this.GetTrByIndex(irow);
        if (!tr) return null;
        return { tr, data: (tr._etData ?? this.DataArray[irow] ?? {}) };
    }

    /** Reemplaza los badges de la fila (tiene precedencia sobre RowBadges y el campo reservado). */
    SetRowBadges=(irow, badges)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        this._setBadgeOverride(ctx.data, this._normBadges(badges));
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Agrega un badge a la fila; si trae un id que ya existe, lo reemplaza. */
    AddRowBadge=(irow, badge)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        const b = this._normBadges(badge)[0];
        if (!b) return false;
        const list = this._effectiveBadges(ctx.data, irow).slice();
        const pos = (b.id !== undefined && b.id !== null) ? list.findIndex(x => x.id == b.id) : -1;
        if (pos >= 0) list[pos] = b; else list.push(b);
        this._setBadgeOverride(ctx.data, list);
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Elimina un badge por id, o todos los de la fila si no se indica id. */
    RemoveRowBadge=(irow, id)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        const list = (id === undefined) ? [] : this._effectiveBadges(ctx.data, irow).filter(x => x.id != id);
        this._setBadgeOverride(ctx.data, list);
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Descarta los cambios hechos con SetRowBadges/AddRowBadge/RemoveRowBadge y vuelve a RowBadges o al campo reservado. */
    ResetRowBadges=(irow)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        this._setBadgeOverride(ctx.data, undefined);
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Devuelve los badges efectivos de la fila. */
    GetRowBadges=(irow)=>
    {
        const ctx = this._rowContext(irow);
        return ctx ? this._effectiveBadges(ctx.data, irow) : [];
    }

    /** Vuelve a dibujar los badges de todas las filas sin reconstruir la tabla. */
    RefreshBadges=()=>
    {
        this._eachRow((tr, i, data) => this._paintBadges(tr, data, i));
    }

    _ensureBadgeWrap=(td)=>
    {
        let cc = td.querySelector('div[iscellcontent=true]');
        if (!cc)
        {
            cc = this._createFullElement('div', { iscellcontent: 'true', class: 'cell-content' });
            cc.innerHTML = td.innerHTML;
            td.innerHTML = '';
            td.appendChild(cc);
            this._setRowSizes(cc, this.GetColumnDefOfTd(td));
        }

        const parent = cc.parentElement;
        if (parent && parent !== td) return { wrap: parent, cc };

        const wrap = this._createFullElement('div', { class: 'et-badge-wrap' });
        td.insertBefore(wrap, cc);
        wrap.appendChild(cc);
        return { wrap, cc };
    }

    _paintBadges=(tr, data, idx)=>
    {
        if (!tr) return;

        tr.querySelectorAll('.et-badges').forEach(e => e.remove());
        tr.querySelectorAll('td.et-badge-host').forEach(td => td.classList.remove('et-badge-host'));

        const list = this._effectiveBadges(data, idx);
        if (!list.length) return;

        const info = this._getCardsInfo();
        const cells = Array.from(tr.cells);

        // Columnas de tipo Badges: el desarrollador decide dónde se ven
        if (info.badgeCols.length)
        {
            const groups = info.badgeCols.map(ci => ({ ci, g: (this.Columns[ci]?.badgegroup ?? '').trim() }));
            const claimed = new Set(groups.filter(x => x.g).map(x => x.g));

            groups.forEach(({ ci, g }) => {
                const sub = list.filter(b => (g ? (b.group ?? '') == g : !claimed.has(b.group ?? '')));
                const td = cells[ci];
                if (!td || !sub.length) return;
                const { wrap, cc } = this._ensureBadgeWrap(td);
                td.classList.add('et-badge-host');
                wrap.insertBefore(this._buildBadges(sub, 'inline'), cc);
            });
            return;
        }

        // Anfitrión automático: primera (o última) celda visible en la vista actual
        const visible = (td) => !td.classList.contains('hidde-col')
            && !(this._isCardView ? td.classList.contains('et-card-hidden') : td.classList.contains('et-table-hidden'));

        const byPos = {};
        list.forEach(b => {
            let p = (b.position ?? 'start').toString().toLowerCase();
            if (!['start', 'end', 'overlay-start', 'overlay-end'].includes(p)) p = 'start';
            (byPos[p] = byPos[p] ?? []).push(b);
        });

        Object.keys(byPos).forEach(pos => {
            const td = pos.endsWith('end') ? cells.slice().reverse().find(visible) : cells.find(visible);
            if (!td) return;
            const box = this._buildBadges(byPos[pos], pos);
            td.classList.add('et-badge-host');

            if (pos.startsWith('overlay')) { td.appendChild(box); return; }

            const { wrap, cc } = this._ensureBadgeWrap(td);
            if (pos == 'end') wrap.appendChild(box);
            else wrap.insertBefore(box, cc);
        });
    }

    _buildBadges=(list, pos)=>
    {
        const box = this._createFullElement('span', { class: 'et-badges et-badges-' + pos, part: 'badges' });
        list.forEach(b => box.appendChild(this._buildBadge(b)));
        return box;
    }

    _hasBadgeClickHandler=(b)=>
    {
        const ev = this.EdiTable.Const.Events.BadgeClick;
        return !!(typeof b.onClick == 'function' || typeof this.BadgeOnClick == 'function'
            || this.Events[ev] || this._getCurren().Events?.[ev]);
    }

    _buildBadge=(b)=>
    {
        const el = document.createElement('span');
        el.className = 'et-badge';
        this._splitClasses(b.className).forEach(c => el.classList.add(c));
        el.setAttribute('part', 'badge');
        if (b.id !== undefined && b.id !== null) el.setAttribute('data-badge-id', String(b.id));
        if (b.bg) el.style.background = String(b.bg);
        if (b.color) el.style.color = String(b.color);
        if (b.size) el.style.setProperty('--et-badge-size', String(b.size));

        const hasIcon = (b.icon !== undefined && b.icon !== null && String(b.icon) !== '');
        const hasText = (b.text !== undefined && b.text !== null && String(b.text) !== '');
        if (hasIcon) this._setBadgeIcon(el, String(b.icon));
        if (hasText)
        {
            if (hasIcon) { const s = document.createElement('span'); s.textContent = String(b.text); el.appendChild(s); }
            else el.textContent = String(b.text);
        }

        const tip = (b.tooltip !== undefined && b.tooltip !== null) ? String(b.tooltip) : '';
        const custom = (this.BadgeTooltip == 'custom');
        if (tip)
        {
            el.setAttribute('aria-label', tip);
            if (custom) el.setAttribute('data-tip', tip);
            else el.title = tip;
        }

        const clickable = this._hasBadgeClickHandler(b);
        if (clickable)
        {
            el.classList.add('et-clickable');
            el.setAttribute('role', 'button');
            el.tabIndex = 0;
        }
        else if (tip && custom) el.tabIndex = 0; // para mostrar el tooltip al tocarlo en pantallas táctiles

        el.addEventListener('click', (e) => this._onBadgeClick(e, b, el));
        el.addEventListener('keydown', (e) => {
            if ((e.key == 'Enter' || e.key == ' ') && el.classList.contains('et-clickable'))
            {
                e.preventDefault();
                e.stopPropagation();
                this._onBadgeClick(e, b, el);
            }
        });

        if (tip && custom)
        {
            el.addEventListener('mouseenter', () => this._showTip(el));
            el.addEventListener('focus', () => this._showTip(el));
            el.addEventListener('mouseleave', () => this._hideTip());
            el.addEventListener('blur', () => this._hideTip());
        }
        return el;
    }

    _setBadgeIcon=(el, icon)=>
    {
        const t = icon.trim();

        if (/^<svg[\s>]/i.test(t))
        {
            // Sin xmlns el DOMParser no crea un elemento SVG real y no se dibuja.
            const src = /\sxmlns\s*=/.test(t.slice(0, t.indexOf('>'))) ? t : t.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
            const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
            const svg = doc.documentElement;
            if (!svg || svg.nodeName.toLowerCase() != 'svg' || doc.querySelector('parsererror')) return;

            svg.querySelectorAll('script,foreignObject,iframe,animate,set').forEach(n => n.remove());
            [svg, ...svg.querySelectorAll('*')].forEach(n => {
                Array.from(n.attributes).forEach(a => {
                    const name = a.name.toLowerCase();
                    const val = (a.value ?? '').trim().toLowerCase();
                    if (name.startsWith('on')) n.removeAttribute(a.name);
                    else if ((name == 'href' || name == 'xlink:href') && !val.startsWith('#')) n.removeAttribute(a.name);
                    else if (val.startsWith('javascript:')) n.removeAttribute(a.name);
                });
            });
            svg.setAttribute('aria-hidden', 'true');
            el.appendChild(document.importNode(svg, true));
            return;
        }

        if (/^img:/i.test(t))
        {
            const src = t.slice(4).trim();
            const safe = /^https?:\/\//i.test(src) || /^data:image\/(png|jpe?g|gif|webp);/i.test(src) || /^\.{0,2}\//.test(src);
            if (!safe) return;
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            el.classList.add('et-badge-img');
            el.appendChild(img);
            return;
        }

        el.textContent = t;
    }

    _onBadgeClick=(e, b, el)=>
    {
        if (!el.classList.contains('et-clickable')) return; // sin manejador: el clic sigue a la celda como siempre
        e.stopPropagation();
        this._hideTip();

        const tr = el.closest('tr');
        const td = el.closest('td');
        const irow = this._getRowIndex(tr);
        const row = tr?._etData ?? this.DataArray[irow];
        const args = { sender: this._getCurren(), irow, badge: b, row, td, event: e, cancel: false };

        this._fireEvent(this.EdiTable.Const.Events.BadgeClick, args);
        if (!args.cancel)
        {
            if (typeof b.onClick == 'function') b.onClick(args);
            else if (typeof this.BadgeOnClick == 'function') this.BadgeOnClick(irow, b, row, e);
        }
        if (this.BadgeSelectsRow && td && !args.cancel) this.CellFocus(td);
    }

    _showTip=(el)=>
    {
        const tip = el.getAttribute('data-tip');
        if (!tip || !this._shadow) return;

        if (!this._tipEl)
        {
            this._tipEl = this._createFullElement('div', { class: 'et-tooltip', role: 'tooltip', part: 'tooltip' });
            this._shadow.appendChild(this._tipEl);
            this._table?.parentElement?.addEventListener('scroll', () => this._hideTip(), { passive: true });
        }

        const t = this._tipEl;
        t.textContent = tip;
        t.style.display = 'block';
        const r = el.getBoundingClientRect();
        const tr = t.getBoundingClientRect();
        let top = r.top - tr.height - 6;
        if (top < 4) top = r.bottom + 6;
        let left = r.left + (r.width / 2) - (tr.width / 2);
        left = Math.max(4, Math.min(left, window.innerWidth - tr.width - 4));
        t.style.top = top + 'px';
        t.style.left = left + 'px';
    }

    _hideTip=()=>
    {
        if (this._tipEl) this._tipEl.style.display = 'none';
    }

    _fireEvent=(name, args)=>
    {
        const handler = this.Events[name] ?? this._getCurren().Events?.[name];
        if (typeof handler == 'function') handler(args);
    }

    _escapeHtml=(value)=>
    {
        return String(value)
            .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    _encodeRow=(row)=>
    {
        const out = {};
        Object.keys(row).forEach(k => { const v = row[k]; out[k] = (typeof v == 'string') ? this._escapeHtml(v) : v; });
        return out;
    }

    hideColumn(fieldColumn,hide=true)
    {
        let th = this._table.querySelector(`thead th[field="${fieldColumn}"]`);
        if (!th) return false;

        this._table.querySelectorAll('tbody tr').forEach(tr => tr.cells[th.cellIndex].classList.toggle('hidde-col',hide));
        th.classList.toggle('hidde-col', hide);

        if (hide){
            if (!this.hideColumns.includes(th.cellIndex)) this.hideColumns.push(th.cellIndex);
        }
        else this.hideColumns = this.hideColumns.filter(idx => idx != th.cellIndex);

        this.RefreshBadges();
        return true;
    }
    hideColumns=[];

    addEventListener(type, listener) {
        const known = Object.values(this.EdiTable.Const.Events);
        if (typeof type == "string" && !known.includes(type.toLowerCase()))
        {
            // Antes se ignoraban en silencio; ahora pueden habilitarse con native-events="true".
            if (this.NativeEvents) super.addEventListener(...arguments);
            return;
        }
        if (typeof type != "string" || typeof listener != "function") return;

        switch (type.toLowerCase()) {
            case this.EdiTable.Const.Events.BeforeCellFocus:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeCellFocus] = listener
                break;
            case this.EdiTable.Const.Events.EnterCell:
                this._getCurren().Events[this.EdiTable.Const.Events.EnterCell] = listener
                break;
            case this.EdiTable.Const.Events.LeaveCell:
                this._getCurren().Events[this.EdiTable.Const.Events.LeaveCell] = listener
                break;
            case this.EdiTable.Const.Events.StartEdition:
                this._getCurren().Events[this.EdiTable.Const.Events.StartEdition] = listener
                break;
            case this.EdiTable.Const.Events.ConfirmEdition:
                this._getCurren().Events[this.EdiTable.Const.Events.ConfirmEdition] = listener
                break;
            case this.EdiTable.Const.Events.CancelEdition:
                this._getCurren().Events[this.EdiTable.Const.Events.CancelEdition] = listener
                break;
            case this.EdiTable.Const.Events.InputCreated:
                this._getCurren().Events[this.EdiTable.Const.Events.InputCreated] = listener
                break;
            case this.EdiTable.Const.Events.BeforeSetInput:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput] = listener
                break;
            case this.EdiTable.Const.Events.BeforeUpdateCell:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeUpdateCell] = listener
                break;
            case this.EdiTable.Const.Events.FieldUpdated:
                this._getCurren().Events[this.EdiTable.Const.Events.FieldUpdated] = listener
                break;
            case this.EdiTable.Const.Events.RowAdded:
                this._getCurren().Events[this.EdiTable.Const.Events.RowAdded] = listener
                break;
            case this.EdiTable.Const.Events.BeforeRowDelete:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeRowDelete] = listener
                break;
            case this.EdiTable.Const.Events.RowDeleted:
                this._getCurren().Events[this.EdiTable.Const.Events.RowDeleted] = listener
                break;
            case this.EdiTable.Const.Events.BeforeMoveRow:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeMoveRow] = listener
                break;
            case this.EdiTable.Const.Events.RowMoved:
                this._getCurren().Events[this.EdiTable.Const.Events.RowMoved] = listener
                break;
            case this.EdiTable.Const.Events.RowChanged:
                this._getCurren().Events[this.EdiTable.Const.Events.RowChanged] = listener
                break;
            case this.EdiTable.Const.Events.LostFocus:
                this._getCurren().Events[this.EdiTable.Const.Events.LostFocus] = listener
                break;
            case this.EdiTable.Const.Events.IsDirtyChanged:
                this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged] = listener
                break;
            case this.EdiTable.Const.Events.OnSort:
                this._getCurren().Events[this.EdiTable.Const.Events.OnSort] = listener
                break;
            case this.EdiTable.Const.Events.BadgeClick:
                this._getCurren().Events[this.EdiTable.Const.Events.BadgeClick] = listener
                break;
            case this.EdiTable.Const.Events.ViewModeChanged:
                this._getCurren().Events[this.EdiTable.Const.Events.ViewModeChanged] = listener
                break;
        }
    }
}

customElements.define('edit-table', EditTable);