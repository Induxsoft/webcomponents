class OpCanva extends HTMLElement
{
    attributes = null;

    scale = 354;
    dpi = 96;
    zoom = 100;
    design = true;
    unit = "cm";
    fit = 1;
    lx = 5000;
    ly = 2500;
    backgroundColor = "";
    backgroundPic = "";
    data = [];
    unitSymbols = ["cm","m","in","ft","yd"]

    _ccanva = null;
    _shadow = null;
    _zindex = 100;
    _startX = null;
    _startY = null;
    _startWidth = null;
    _startHeight = null;
    _elementResizing = null;
    _equivalenceY = null;
    _equivalenceX = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return  attributes;
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
            const contnr = this._createFullElement('div', { id:'OpCanva_contnr', class:'outline' });
            this._ccanva = this._createFullElement('div', { id:'OpCanva_ccanva', class:'outline' });
            const cfootr = this._createFullElement('div', { id:'OpCanva_cfootr', class:'outline' });

            this._loadProperties();

            // CONTROLS
            const zoomCntnr = this._createFullElement('div', { id:'OpCanva_zoomCntnr', class:'d-flex align-items-center wrap outline grow-1 p-1' });
            const zoomTitle = this._createFullElement('h5', { id:'OpCanva_zoomTitle', class:'text-secondary' });
            const zoomCntrl = this._createFullElement('div', { id:'OpCanva_zoomCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const zoomRange = this._createFullElement('input', { id:'OpCanva_zoomRange', type:'range', min:5, max:500, class:'w-100' });
            const zoomInput = this._createFullElement('input', { id:'OpCanva_zoomInput', type:'number', min:5, max:500, class:'bordered rounded p-1' });
            zoomTitle.textContent = 'Zoom:';
            zoomRange.value = this.zoom;
            zoomInput.value = this.zoom;
            zoomCntrl.appendChild(zoomRange);
            zoomCntrl.appendChild(zoomInput);
            zoomCntnr.appendChild(zoomTitle);
            zoomCntnr.appendChild(zoomCntrl);

            const scalCntnr = this._createFullElement('div', { id:'OpCanva_scalContnr', class:'d-flex align-items-center wrap outline grow-1 p-1' });
            const scalTitle = this._createFullElement('h5', { id:'OpCanva_scalTitle', class:'text-secondary' });
            const scalCntrl = this._createFullElement('div', { id:'OpCanva_scalCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const scalInput = this._createFullElement('input', { id:'OpCanva_scalInput', type:'number', class:'bordered rounded p-1' });
            scalTitle.textContent = 'Scale:';
            scalInput.value = this.scale;
            scalCntrl.appendChild(scalInput);
            scalCntnr.appendChild(scalTitle);
            scalCntnr.appendChild(scalCntrl);

            const dpiCntnr = this._createFullElement('div', { id:'OpCanva_dpiContnr', class:'d-flex align-items-center wrap outline grow-1 p-1' });
            const dpiTitle = this._createFullElement('h5', { id:'OpCanva_dpiTitle', class:'text-secondary' });
            const dpiCntrl = this._createFullElement('div', { id:'OpCanva_dpiCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const dpiInput = this._createFullElement('input', { id:'OpCanva_dpiInput', type:'number', class:'bordered rounded p-1' });
            dpiTitle.textContent = 'DPI:';
            dpiInput.value = this.dpi;
            dpiCntrl.appendChild(dpiInput);
            dpiCntnr.appendChild(dpiTitle);
            dpiCntnr.appendChild(dpiCntrl);

            const fitCntnr = this._createFullElement('div', { id:'OpCanva_fitContnr', class:'d-flex align-items-center wrap outline grow-1 p-1' });
            const fitTitle = this._createFullElement('h5', { id:'OpCanva_fitTitle', class:'text-secondary' });
            const fitCntrl = this._createFullElement('div', { id:'OpCanva_fitCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const fitInput = this._createFullElement('input', { id:'OpCanva_fitInput', type:'number', step:0.1, class:'bordered rounded p-1' });
            fitTitle.textContent = 'Fit:';
            fitInput.value = this.fit;
            fitCntrl.appendChild(fitInput);
            fitCntnr.appendChild(fitTitle);
            fitCntnr.appendChild(fitCntrl);

            const unitCntnr = this._createFullElement('div', { id:'OpCanva_unitCntnr', class:'d-flex align-items-center wrap outline grow-1 p-1' });
            const unitTitle = this._createFullElement('h5', { id:'OpCanva_unitTitle', class:'text-secondary' });
            const unitCntrl = this._createFullElement('div', { id:'OpCanva_unitCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const unitSlect = this._createFullElement('select', { id:'OpCanva_unitSlect', class:'bordered rounded p-1' });
            unitTitle.textContent = 'Unit:';
            this.unitSymbols.forEach(unitOpt => {
                const option = this._createFullElement('option', { value:unitOpt });
                option.textContent = unitOpt;
                unitSlect.appendChild(option);
            });
            unitSlect.value = this.unit;
            unitCntrl.appendChild(unitSlect);
            unitCntnr.appendChild(unitTitle);
            unitCntnr.appendChild(unitCntrl);

            cfootr.appendChild(unitCntnr);
            cfootr.appendChild(fitCntnr);
            cfootr.appendChild(dpiCntnr);
            cfootr.appendChild(scalCntnr);
            cfootr.appendChild(zoomCntnr);

            // EVENTS
            zoomRange.addEventListener('change', () => {
                this.setZoom(zoomRange.valueAsNumber);
                zoomInput.value = this.zoom;
            });
            zoomInput.addEventListener('change', () => {
                this.setZoom(zoomInput.valueAsNumber);
                zoomRange.value = this.zoom;
            });
            scalInput.addEventListener('change', () => {
                this.setScale(scalInput.value);
            });
            dpiInput.addEventListener('change', () => {
                this.setDpi(dpiInput.value);
            });
            fitInput.addEventListener('change', () => {
                this.setFit(fitInput.value);
            });
            unitSlect.addEventListener('change', () => {
                this.setUnit(unitSlect.value);
            });

            // STYLES
            this._shadow.innerHTML = `
                <style>
                    *{ box-sizing: border-box;margin:0;padding:0; }
                    .d-flex{ display:flex; }
                    .flex-column{ flex-direction: column; }
                    .wrap{ flex-wrap: wrap; }
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
                    .outline{ outline: 1px solid #DDD; }
                    .text-secondary{ color: #888; }

                    #OpCanva_contnr{ width: 100%; height: 100%; display: flex; flex-direction: column; }
                    #OpCanva_ccanva{ width: 100%; height: 100%; overflow:scroll; position: relative; flex-grow: 1; }
                    #OpCanva_cfootr{ width: 100%; display: flex; justify-content: end; flex-wrap: wrap; }
                    #OpCanva_zoomInput,#OpCanva_dpiInput,#OpCanva_fitInput,#OpCanva_unitSlect,#OpCanva_scalInput{ width: 3rem; outline: none; text-align: center; flex-grow: 1; }
                    .item:hover{ background-color: #DDD; }
                    .item{ position:absolute; outline: 1px solid #000; background-color: #F5F5F5; }
                    .resizer-both{ width: 8px;height: 8px;background-color: transparent;z-index: 10;position: absolute;right: -4px;bottom: -4px;cursor: nw-resize; }
                    .resizer-both:active,.resizer-both:hover{ background-color: #EDEDED; outline: 1px solid #888; }
                    .caption-container{ position: absolute; top: 0; left: 0; height: 100%; width: 100%; font-size: 1em; }
                </style>
            `;

            contnr.appendChild(this._ccanva);
            contnr.appendChild(cfootr);

            this.style.width = "100%";
            this.style.height = "100%";
            this._shadow.appendChild(contnr);

            this._printItems();
        });
    }

    // ========== PREPARE ELEMENTS

    /**
     * @param {string} tagName Nombre de etiqueta.
     * @param {object} attributes Objeto que representan los atributos del elemento, ej: {id:'miElement',class:'mi-element'}
     * @returns Retorna un **nuevo elemento HTML**
     */
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    initMoveAndSizableElement=()=>
    {
        let offset = [0,0];
        let isdown = false;
        let moving = false;
        let current = null;

        let elements = this._shadow.querySelectorAll('.item');

        elements.forEach(item => 
        {
            if (!this._parseBool(item.getAttribute('locked')))
            {
                // Move
                item.addEventListener('mousedown', e => {
                    e.stopPropagation();
                    if (e.target !== item) return;
                    isdown = true;
                    moving = false;
                    offset = [e.target.offsetLeft - e.clientX, e.target.offsetTop - e.clientY];
                    e.target.style.zIndex = '' + ++this._zindex;
                    current = e.target;
                });
            }
            if (this._parseBool(item.getAttribute('sizable')))
            {
                // Sizable
                let sizeBoth = this._createFullElement('div', { class:'resizer-both' });
                item.appendChild(sizeBoth);
                sizeBoth.parent = item;
                sizeBoth.addEventListener('mousedown', this._initDrag, false);
            }
        });

        const e1 = (e) => {
            isdown = false;
            if (moving && e.target == current) this._updateItem(e.target)
            moving = false;
        }
        this._ccanva.onmouseup = e1;

        const e2 = (e) => {
            e.preventDefault();
            if (isdown && current)
            {
                moving = true;
                let left = (e.clientX + offset[0]);
                let top = (e.clientY + offset[1]);
                current.style.left = left + 'px';
                current.style.top = top + 'px';
            }
        }
        this._ccanva.onmousemove = e2;
    }
    _doDrag=(e)=>
    {
        if (!this._elementResizing) return;
        this._elementResizing.style.width = this._startWidth + e.clientX - this._startX + "px";
        this._elementResizing.style.height = this._startHeight + e.clientY - this._startY + "px";
    }
    _stopDrag=(e)=>
    {
        this.removeEventListener("mousemove", this._doDrag, false);
        this.removeEventListener("mouseup", this._stopDrag, false);
        this._updateItem(this._elementResizing);
    }
    _initDrag=(event)=>
    {
        event.stopPropagation();
        this._elementResizing = event.target.parent;
        this._startX = event.clientX;
        this._startY = event.clientY;

        this._startWidth = parseInt(document.defaultView.getComputedStyle(this._elementResizing).width, 10);
        this._startHeight = parseInt(document.defaultView.getComputedStyle(this._elementResizing).height, 10);
        
        this.removeEventListener('mousemove', this._doDrag, false);
        this.removeEventListener('mouseup', this._stopDrag, false);
        this.addEventListener('mousemove', this._doDrag, false);
        this.addEventListener('mouseup', this._stopDrag, false);
    }
    _parseBool=(value, _default = false)=>
    {
        if (value) return (value.toString().toLowerCase() === 'true');
        return _default;
    }
    _parseInt=(value, _default = 0)=>
    {
        if (value != null && value.toString().trim() != '' && isFinite(value.toString().trim()) && !isNaN(value.toString().trim()))
            return Number(value.toString().trim());
        return _default;
    }
    _loadProperties=()=>
    {
        this.setScale(this.getAttribute('scale'), false);
        this.setDpi(this.getAttribute('dpi'), false);
        this.setZoom(this.getAttribute('zoom'));
        this.setUnit(this.getAttribute('unit'), false);
        this.setFit(this.getAttribute('fit'), false);
        this.setLXY(this.getAttribute('lx'), this.getAttribute('ly'));
        
        this.backgroundColor = (this.getAttribute('background-color') ?? '#FFF');
        this.backgroundPic = (this.getAttribute('background-pic') ?? '');
        this.design = this._parseBool(this.getAttribute('design'), this.design);

        this._ccanva.style.backgroundColor = this.backgroundColor;

        if (this.hasAttribute('data') && this.getAttribute('data').trim())
        {
            let data = [];
            try { data = JSON.parse(this.getAttribute('data')); }
            catch(error) { alert('El valor del atributo "data" no contiene un formato JSON válido. ' + error); }
            finally { this.data = data; }
        }
    }
    _generateUUID()
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ========== PRINT DATA

    _updateItem=(element)=>{
        if (this.data && this.data.length > 0)
        {
            this.data.forEach(item => {
                if (item.id == element.id){
                    item.x = (element.offsetLeft / (this.zoom / 100));
                    item.y = (element.offsetTop / (this.zoom / 100));
                    item.lx = (Number(element.getAttribute('equivalencex')) * Number(document.defaultView.getComputedStyle(element).width.replace(/[^0-9.]+/g, '')));
                    item.ly = (Number(element.getAttribute('equivalencey')) * Number(document.defaultView.getComputedStyle(element).height.replace(/[^0-9.]+/g, '')));
                    // element.setAttribute('x', item.x);
                    // element.setAttribute('y', item.y);
                    // element.setAttribute('lx', item.lx);
                    // element.setAttribute('ly', item.ly);
                }
            });
            this._refreshView();
        }
    }
    _refreshView=()=>{
        // if (this._ccanva)
        //     this._ccanva.querySelectorAll('.item').forEach(item => {
        //         item.style.top = `${item.getAttribute('y')}px`;
        //         item.style.left = `${item.getAttribute('x')}px`;
        //         item.style.width = `${this._sizeCalc(item.getAttribute('lx'))}px`;
        //         item.style.height = `${this._sizeCalc(item.getAttribute('ly'))}px`;
        //     });
        this._printItems();
    }
    _printItems=()=>{
        if (this._ccanva) this._ccanva.innerHTML = '';
        if (this.data && this.data.length > 0)
        {
            this.data.forEach(item => {
                const width = this._sizeCalc(item.lx);
                const height = this._sizeCalc(item.ly);

                const element = this._createFullElement('div', { 
                    id: (item.id ?? this._generateUUID()),
                    style:` top:${this._zoomVal(item.y)}px; left:${this._zoomVal(item.x)}px; width:${width}px; height:${height}px; overflow: hidden;`, 
                    class:'item d-flex align-items-center justify-content-center',
                    equivalencey:`${(item.ly/height)}`,
                    equivalencex:`${(item.lx/width)}`,
                    lx: item.lx,
                    ly: item.ly,
                    locked: this._parseBool(item.locked),
                    sizable: this._parseBool(item.sizable),
                    title:`Size: ${item.lx.toFixed(2)}${this.unit} x ${item.ly.toFixed(2)}${this.unit}, X: ${item.x}, Y: ${item.y}`
                });

                element.innerHTML = (item.html ?? '');
                element.style.backgroundColor = (item['background-color'] ?? '#FFF')
                element.style.color = (item['color'] ?? '#000');
                //element.style.backgroundImage = 'url(https://png.pngtree.com/thumb_back/fh260/background/20200714/pngtree-modern-double-color-futuristic-neon-background-image_351866.jpg)';

                const captionsCntnr = this._createFullElement('div', { class:'caption-container d-flex gap-2 flex-column bg-transparent p-1' });
                const captHeadCntnr = this._createFullElement('div', { class:'d-flex w-100' });
                const captBodyCntnr = this._createFullElement('div', { class:'d-flex flex-column gap-1 w-100 grow-1 wrap' });
                const captFootCntnr = this._createFullElement('div', { class:'d-flex w-100' });

                const captA = this._createFullElement('small', { class:'grow-1' });
                const captB = this._createFullElement('small');
                const captC = this._createFullElement('small', { class:'grow-1' });
                const captD = this._createFullElement('small');
                const captT = this._createFullElement('h4', { class:'w-100' });
                const captS = this._createFullElement('span', { class:'grow-1' });

                captHeadCntnr.appendChild(captA);
                captHeadCntnr.appendChild(captB);
                captFootCntnr.appendChild(captC);
                captFootCntnr.appendChild(captD);
                captBodyCntnr.appendChild(captT);
                captBodyCntnr.appendChild(captS);

                captA.textContent = (item['caption-a'] ?? '');
                captB.textContent = (item['caption-b'] ?? '');
                captC.textContent = (item['caption-c'] ?? '');
                captD.textContent = (item['caption-d'] ?? '');
                captT.textContent = (item['title'] ?? '');
                captS.textContent = (item['subtitle'] ?? '');

                captionsCntnr.appendChild(captHeadCntnr);
                captionsCntnr.appendChild(captBodyCntnr);
                captionsCntnr.appendChild(captFootCntnr);

                //element.appendChild(captionsCntnr);

                this._ccanva.appendChild(element);
            });
        }
        if (this.design) this.initMoveAndSizableElement();
    }

    // ========== CALCULATIONS

    _sizeCalc=(v)=>
    {
        let size = this._scaleCalc(v);
        return this._zoomVal(this._fitCalc(size).toFixed(0));
    }
    _fitCalc=(v)=>
    {
        return ((v / this.fit).toFixed(0) * this.fit);
    }
    _scaleCalc=(v)=>
    {
        v = this._cmXUnit(v);
        let px = (v * this._dpiXcm())
        return (px / this.scale);
    }
    _cmXUnit=(v)=>
    {
        switch (this.unit)
        {
            case "cm": v = (v * 1); break;
            case "m": v = (v * 100); break;
            case "in": v = (v * 2.54); break;
            case "ft": v = (v * 30.48); break;
            case "yd": v = (v * 91.44); break;
        }
        return v;
    }
    _dpiXcm=()=>
    {
        const inch = 2.54;
        return (this.dpi / inch).toFixed(0);
    }
    _zoomVal=(v)=>
    {
        return ((this.zoom / 100) * v);
    }

    // ========== PUBLIC FUNCTIONS

    setData=(data)=>
    {
        try {
            this.data = data;
            this._refreshView();
        } catch (error) {
            alert(error);
        }
    }
    getData=()=>
    {
        return this.data;
    }
    getItem=(id)=>
    {
        return (this.data?.find(item => item.id == id) ?? null);
    }
    addItem=(obj)=>
    {
        this.data.push(obj);
        this._refreshView();
    }
    removeItem=(id)=>
    {
        this.data.forEach((item, index) => {
            if (item.id === id)
                this.data.splice(index, 1);
        });
        this._refreshView();
    }
    setScale=(scale, refreshView = true)=>
    {
        this.scale = this._parseInt(scale, this.scale);
        if (refreshView) this._refreshView();
    }
    getScale=()=>
    {
        return this.scale;
    }
    setDpi=(dpi, refreshView = true)=>
    {
        this.dpi = this._parseInt(dpi, this.dpi);
        if (refreshView) this._refreshView();
    }
    getDpi=()=>
    {
        return this.dpi;
    }
    setUnit=(unitSymbol, refreshView = true)=>
    {
        if (this.unitSymbols.includes(unitSymbol))
        {
            this.unit = unitSymbol;
            if (refreshView) this._refreshView();
        }
    }
    getUnit=()=>
    {
        return this.unit;
    }
    setZoom=(z, refreshView = true)=>
    {
        this.zoom = this._parseInt(z, this.zoom);
        if (refreshView) this._refreshView();
    }
    getZoom=()=>
    {
        return this.zoom;
    }
    setFit=(fit, refreshView = true)=>
    {
        this.fit = this._parseInt(fit, this.fit);
        if (refreshView) this._refreshView();
    }
    getFit=()=>
    {
        return this.fit;
    }
    setLXY=(lx,ly)=>
    {
        this.lx = this._parseInt(lx, this.lx);
        this.ly = this._parseInt(ly, this.ly);
    }
    getLX=()=>
    {
        return this.lx;
    }
    getLY=()=>
    {
        return this.ly;
    }
}

customElements.define('op-canva', OpCanva);