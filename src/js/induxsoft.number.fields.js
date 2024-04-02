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
        el.value = Number(el.defaultValue);
        // el.value = Number(el.getAttribute("data-number"));
    },

    AsText(el)
    {
        let lcode = el.getAttribute("num-locale") ?? "";
        let style = el.getAttribute("num-style") ?? "";
        let currency = (el.getAttribute("num-currency") ?? "MXN").toUpperCase();
        let decimal = Number(el.getAttribute("num-decs") ?? "2");

        let options =
        {
            style: style,
            currency: currency,
            minimumFractionDigits: decimal,
        }
        
        if (lcode === "") lcode = (new Intl.NumberFormat()).resolvedOptions().locale;
        if (style === "") {
            delete options.style;
            delete options.currency;
        }
        console.log(lcode);

        const formatter = new Intl.NumberFormat(lcode,options);

        let number = Number(el.value);
        let format = formatter.format(number);
        
        el.type = "text";
        el.value = format;
        el.defaultValue = number;
        // el.setAttribute("data-number",number);
    },
}