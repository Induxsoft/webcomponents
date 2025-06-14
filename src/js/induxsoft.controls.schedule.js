class CustomSchedule extends HTMLElement
{
    attributes = null;
    events = null;
    view = 'week';
    day = 'now';
    breaks = null;
    hollydays = null;
    weekend = 'saturday,sunday';
    start_weekday = 'sunday';
    start_lab_hour = 0;
    end_lab_hour = 24;
    interval = 30;
    increment = 0;
    min_duration = null;
    max_duration = null;

    #shadow = null;
    #semana = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    #weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

    constructor() {
        super();
        this.#shadow = this.attachShadow({mode:'closed'});

        this.#shadow.innerHTML = `
        <style>
            table {
                width: 100%;
                font-size: 1rem;
                border-spacing: 1px;
                border-collapse: collapse;
            }
            thead {
                position: sticky;
                top: 0;
                z-index: 15;
                text-transform: capitalize;
            }
            thead tr th:nth-child(1) {
                position: sticky;
                left: 0;
                top: 0;
                z-index: 15;
            }
            tbody tr th {
                position: sticky;
                left: 0;
                z-index: 10;
            }
            tr th{
                background-color: #7532F9;
                color: #FFFFFF;
                padding: 4px 8px;
                outline: 1px solid #DDD;
                font-weight: normal;
                position: relative;
                cursor: pointer;
            }
            tr td {
                height: 1.4rem;
                outline: 1px solid #EDEDED;
                position: relative;
                padding: 4px;
            }
            tbody tr { position: relative; }
            tbody tr:hover { background-color: #F5F5F5; }

            /* .table-container {
                min-height: 2rem;
                max-height: 100%;
                overflow: auto;
            } */
        </style>

        <div id="schedule-wrapper">
            <div id="table-layer"></div>
            <div id="tasks-layer"></div>
        </div>
        `;
    }
    // Observa atributos a cambiar
    static get observedAttributes() {
        return attributes;
    }
    // Reacciona a cambios de atributo
    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }
    // Se llama cuando se inserta en el DOM
    connectedCallback()
    {
        this.attributes = this.getAttributeNames();
        this.attributes.forEach(name => {
            let prop = name.replaceAll('-','_');
            if (prop in this)
            {
                let value = this.getAttribute(name);

                if (typeof this[prop] == 'string') this[prop] = value;
                else if (typeof this[prop] == 'number') this[prop] = Number(value);
                else if (typeof this[prop] == 'boolean') this[prop] = this.#boolval(value);
                else if (typeof this[prop] == 'object') this[prop] = JSON.parse(value);
            }
        });

        const tableLayer = this.#shadow.querySelector('#table-layer');
        const table = this.getScheduleTable();
        
        tableLayer.appendChild(table);
    }
    //* ======================================== [ Métodos públicos o privados ]
    getWeekdays()
    {
        let index = this.#weekdays.indexOf(this.start_weekday);
        if (index == -1) {
            index = this.#semana.indexOf(this.start_weekday);
            if (index == -1) {
                console.warn("Día inválido");
                if (this.view == "day") return [this.#semana[0]];
                return this.#semana;
            }
        }

        if (this.view == "day") return [this.#semana[index]];
        return [...this.#semana.slice(index), ...this.#semana.slice(0,index)];
    }

    getHours() {
        const intervals = [15,30,60,120];
        const result = [];
        const pad = (num) => num.toString().padStart(2, '0');

        let start = ((this.start_lab_hour ?? -1) < 0) ? 0 : this.start_lab_hour;
        let end = ((this.end_lab_hour ?? 25) > 24) ? 24 : this.end_lab_hour;
        if (!intervals.includes(this.interval)) {
            console.warn("Intervalo inválido");
            this.interval = 30;
        }

        const endMin = end * 60;
        let totalMin = start * 60;

        while (totalMin <= endMin) {
            const hour = Math.floor(totalMin / 60);
            const minute = totalMin % 60;
            result.push(`${pad(hour)}:${pad(minute)}`);
            totalMin += this.interval;
        }

        return result;
    }

    getScheduleTable()
    {
        const table = document.createElement('table');
        this.setScheduleHead(table);
        this.setScheduleBody(table);

        return table;
    }

    setScheduleHead(table)
    {
        const weekdays = this.getWeekdays();
        const thead = document.createElement('thead');
        
        const row = document.createElement('tr')
        row.appendChild(document.createElement('th'));
        
        let turns = this.#nweek();
        for (let i = 0; i < turns; i++) {
            for (const d of weekdays) {
                const cell = document.createElement('th');
                cell.innerHTML = `<div>${d}<br><small>25/06/14</small></div>`;
                row.appendChild(cell);
            }   
        }
        
        thead.appendChild(row);
        table.appendChild(thead);
    }

    setScheduleBody(table)
    {
        const hours = this.getHours();
        const tbody = document.createElement('tbody');
        const cells = (this.view == "month") ? (7 * 4) : 7;
        const tags = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","AA","AB","AC","AD","AE","AF","AG","AH","AI"]
        
        for (let i = 0; i < hours.length; i++) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');

            th.textContent = hours[i];
            tr.appendChild(th);
            for (let j = 0; j < cells; j++) {
                const td = document.createElement('td');
                td.id = tags[j]+(i+1);

                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
    }

    renderTasks()
    {
        if ((this.events ?? []).length == 0) return;

        const tasksLayer = this.#shadow.querySelector('#tasks-layer');
        tasksLayer.innerHTML = '';

        let h_row = 40;
        let w_col = 100;
        let weekdays = this.getWeekdays()
        let tasks = this.events;

        tasks.forEach(t => {
            let start = new Date(t.start);
            let day = (start.getDay() + 6) % 7;

            console.log(start,day)
        });
    }

    #createFullElement(tagName, attributes={}, innerHTML="")
    {
        const element = document.createElement(tagName);
        const keys = Object.keys(attributes);
        
        keys.forEach(k => element.setAttribute(k, attributes[k]));
        if (innerHTML.trim() !== "") element.innerHTML = innerHTML.trim();
        
        return element;
    }

    #boolval(v)
    {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return (v != 0);
        if (typeof v === 'string') {
            return ["true","1","yes","y","si","sí","s","ok","on","v","verdadero","verdad","correcto","cierto","positivo","+"].includes(v.trim().toLowerCase());
        }

        return false
    }

    #nweek() {
        if (!this.view.includes("week")) return 1;

        let v = Number(this.view.replace("week",""));
        if (v <= 0) v = 1;
        return v;
    }
}

customElements.define('custom-schedule', CustomSchedule);