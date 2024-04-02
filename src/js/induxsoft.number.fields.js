var InduxsoftNumberFields =
{
    Init()
    {
        const number_fields = document.querySelectorAll('.induxsoft-num-field[type="number"]');
        let formId = "";

        number_fields.forEach((field) => {
            const form = field.form;
            if (form.id !== formId) {
                formId = form.id;
                form.addEventListener("submit", (event) => {
                    event.preventDefault();
                    if (!event.target.reportValidity()) return;
                    this.submitForm(event.target);
                });
            }

            this.AsText(field);

            // El elemento gana el foco
            field.addEventListener("focus", (event) => { this.AsNumber(event.target) });
            // El elemento pierde el foco
            field.addEventListener("blur", (event) => { this.AsText(event.target) });
        });
    },

    submitForm(form)
    {
        const number_fields = form.querySelectorAll('.induxsoft-num-field[type="text"]');
        number_fields.forEach((field) => {
            this.AsNumber(field);
        });
        form.submit();
    },

    AsNumber(el)
    {
        el.type = "number";
        el.value = Number(el.getAttribute("data-value")) || Number(el.value);
    },

    AsText(el)
    {
        let lcode = (el.getAttribute("num-locale") ?? "");
        let style = (el.getAttribute("num-style") ?? "").toLowerCase();
        
        let decimal = Number(el.getAttribute("num-decs") ?? "2");
        let options = {
            style: style,
            minimumFractionDigits: decimal,
            maximumFractionDigits: decimal,
        }
        
        if (lcode === "") lcode = (new Intl.NumberFormat()).resolvedOptions().locale;

        switch (style) {
            case "currency":
                // MXN, USD, EUR, ...
                let currency = (el.getAttribute("num-currency") ?? "MXN").toUpperCase();
                // symbol, code, name
                let currencyDisplay = (el.getAttribute("num-currency-display") ?? "").toLowerCase();

                if (currency === "") {
                    alert("Es necesario indicar la moneda `num-currency` en " + el.name);
                    return;
                }

                options.currency = currency;
                if (currencyDisplay !== "") options.currencyDisplay = currencyDisplay;
                break;
            case "unit":
                // meter, kilometer, megabyte, gigabyte, ... 
                let unit = (el.getAttribute("num-unit") ?? "").toLowerCase();
                // long, short
                let unitDisplay = (el.getAttribute("num-unit-display") ?? "").toLowerCase();

                if (unit === "") {
                    alert("Es necesario indicar la unidad `num-unit` en " + el.name);
                    return;
                }
                
                options.unit = unit;
                if (unitDisplay !== "") options.unitDisplay = unitDisplay;
                break;
            case "percent":
                break;
            case "decimal":
                break;
        
            default:
                delete options.style;
                break;
        }

        const formatter = new Intl.NumberFormat(lcode,options);

        let number = Number(el.value);
        let format = formatter.format(number);
        
        el.type = "text";
        el.value = format;
        el.setAttribute("data-value",number);
    },
}