// Muestras escritas a mano para compara.mjs: los estados (hover, foco, activo, deshabilitado), los componentes completos
// y las clases que el código arma por JS o con cadenas (sin fragmento en muestras.json). Siguen los patrones de V12
// (btn-sm, rounded-0, form-control-sm). Texto ficticio.
//
// Cada muestra: { clases: 'clase1 clase2' (a las que se atribuyen sus diferencias), html, alto? (px, para lo que es
// fijo o modal) }. data-ix-estado="hover|focus|active" fuerza esa pseudoclase en el elemento (CDP).

const VARIANTES = ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'light', 'link',
    'outline-primary', 'outline-secondary', 'outline-success', 'outline-info', 'outline-danger'];
const img = (w, h) => `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3e%3crect width='100%25' height='100%25' fill='%23adb5bd'/%3e%3c/svg%3e`;

export const SINTETICOS = [
    // ---------------------------------------------------------------- reboot (etiquetas sin clase)
    { clases: 'reboot', html: `<div><h1>Título 1</h1><h2>Título 2</h2><h3>Título 3</h3><h4>Título 4</h4><h5>Título 5</h5><h6>Título 6</h6>
        <p>Párrafo con <a href="#">un enlace</a>, <b>negritas</b>, <small>chico</small>, <mark>marcado</mark>, <code>codigo()</code> y <kbd>Ctrl</kbd>.</p>
        <ul><li>Uno</li><li>Dos<ol><li>Dos.uno</li></ol></li></ul><dl><dt>Término</dt><dd>Definición</dd></dl><hr><pre>bloque\n  de código</pre>
        <blockquote>Cita</blockquote><abbr title="abreviatura">abr</abbr> <sub>sub</sub> <sup>sup</sup>
        <table><caption>Leyenda</caption><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>
        <fieldset><legend>Grupo</legend><label>Etiqueta</label> <input type="text"> <button>Botón</button> <select><option>Opción</option></select>
        <textarea rows="2"></textarea> <input type="search"> <input type="date"> <progress value="40" max="100"></progress></fieldset>
        <figure><img src="${img(80, 30)}"></figure><a>sin href</a></div>` },
    { clases: 'h4 h5 h6 small', html: `<div><div class="h4">h4</div><div class="h5">h5</div><div class="h6">h6</div><div class="small">small</div></div>` },

    // ---------------------------------------------------------------- botones: variantes y estados
    ...VARIANTES.map(v => ({
        clases: `btn btn-${v} btn-sm rounded-0 disabled active`,
        html: `<div><button type="button" class="btn btn-${v}">Normal</button>
            <button type="button" class="btn btn-sm btn-${v} rounded-0">Chico</button>
            <button type="button" class="btn btn-sm btn-${v}" data-ix-estado="hover">Hover</button>
            <button type="button" class="btn btn-sm btn-${v}" data-ix-estado="focus">Foco</button>
            <button type="button" class="btn btn-sm btn-${v}" data-ix-estado="active">Activo</button>
            <button type="button" class="btn btn-sm btn-${v} active">.active</button>
            <a class="btn btn-sm btn-${v} disabled">.disabled</a>
            <button type="button" class="btn btn-sm btn-${v}" disabled>disabled</button></div>`
    })),
    { clases: 'btn btn-lg btn-sm', html: `<div><button class="btn btn-lg btn-primary">Grande</button> <button class="btn btn-sm border-secondary rounded-0">Borde</button> <button class="btn" data-ix-estado="hover">Sin color</button> <button class="btn" data-ix-estado="focus">Foco</button> <span class="btn btn-primary btn-sm">Insignia <span class="badge bg-danger">3</span></span></div>` },
    { clases: 'btn-group btn-group-sm btn-check btn-outline-primary btn-outline-secondary', html: `<div><div class="btn-group" role="group">
            <input type="radio" class="btn-check" name="g1" id="ix-g1a" checked><label class="btn btn-outline-primary" for="ix-g1a">Uno</label>
            <input type="radio" class="btn-check" name="g1" id="ix-g1b"><label class="btn btn-outline-primary" for="ix-g1b">Dos</label>
            <input type="radio" class="btn-check" name="g1" id="ix-g1c" disabled><label class="btn btn-outline-primary" for="ix-g1c">Tres</label></div>
            <div class="btn-group btn-group-sm"><button class="btn btn-outline-secondary">A</button><button class="btn btn-outline-secondary" data-ix-estado="hover">B</button><button class="btn btn-outline-secondary">C</button></div>
            <div class="btn-group"><button class="btn btn-light">Acción</button><button class="btn btn-light dropdown-toggle"></button></div></div>` },
    { clases: 'btn-close btn-close-white', html: `<div><button type="button" class="btn-close"></button> <button type="button" class="btn-close" data-ix-estado="hover"></button> <button type="button" class="btn-close" data-ix-estado="focus"></button> <button type="button" class="btn-close" disabled></button> <span class="bg-secondary d-inline-block p-1"><button type="button" class="btn-close btn-close-white"></button></span></div>` },

    // ---------------------------------------------------------------- campos
    { clases: 'form-control form-control-sm rounded-0 form-label form-text', html: `<div>
            <label class="form-label">Etiqueta</label><input type="text" class="form-control" placeholder="Escriba aquí">
            <input type="text" class="form-control form-control-sm rounded-0" placeholder="Chico">
            <input type="text" class="form-control form-control-sm" data-ix-estado="focus">
            <input type="text" class="form-control form-control-sm" disabled><input type="text" class="form-control form-control-sm" readonly>
            <input type="date" class="form-control form-control-sm"><input type="number" class="form-control">
            <textarea class="form-control" rows="2"></textarea><textarea class="form-control form-control-sm" rows="1"></textarea>
            <div class="form-text">Ayuda del campo</div></div>` },
    { clases: 'form-control form-control-color form-control-plaintext', html: `<div><input type="file" class="form-control"><input type="file" class="form-control form-control-sm"><input type="color" class="form-control form-control-color" value="#2f66cc"><input type="text" class="form-control-plaintext" readonly value="Solo lectura"><input type="text" class="form-control-plaintext form-control-sm" readonly value="Solo lectura chico"></div>` },
    { clases: 'form-select form-select-sm', html: `<div><select class="form-select"><option>Opción</option></select><select class="form-select form-select-sm rounded-0"><option>Opción</option></select>
            <select class="form-select form-select-sm" data-ix-estado="focus"><option>Foco</option></select><select class="form-select" disabled><option>No</option></select>
            <select class="form-select" multiple><option>Uno</option><option>Dos</option></select><select class="form-select" size="3"><option>Uno</option><option>Dos</option></select></div>` },
    { clases: 'col-form-label col-form-label-sm row col-3 col-9', html: `<div class="row"><label class="col-3 col-form-label">Etiqueta</label><div class="col-9"><input class="form-control"></div>
            <label class="col-3 col-form-label col-form-label-sm">Chica</label><div class="col-9"><input class="form-control form-control-sm"></div></div>` },
    { clases: 'form-check form-check-input form-check-label form-check-inline form-switch', html: `<div>
            <div class="form-check"><input class="form-check-input" type="checkbox" checked><label class="form-check-label">Marcada</label></div>
            <div class="form-check"><input class="form-check-input" type="checkbox" data-ix-estado="focus"><label class="form-check-label">Foco</label></div>
            <div class="form-check"><input class="form-check-input" type="radio" name="ixr" checked><label class="form-check-label">Radio</label></div>
            <div class="form-check"><input class="form-check-input" type="radio" name="ixr"><label class="form-check-label">Radio 2</label></div>
            <div class="form-check"><input class="form-check-input" type="checkbox" disabled><label class="form-check-label">Deshabilitada</label></div>
            <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox"><label class="form-check-label">En línea</label></div>
            <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" checked><label class="form-check-label">En línea 2</label></div>
            <div class="form-check form-switch"><input class="form-check-input" type="checkbox"><label class="form-check-label">Interruptor</label></div>
            <div class="form-check form-switch"><input class="form-check-input" type="checkbox" checked><label class="form-check-label">Encendido</label></div>
            <div class="form-check form-switch"><input class="form-check-input" type="checkbox" data-ix-estado="focus"><label class="form-check-label">Foco</label></div></div>` },
    { clases: 'form-range', html: `<div><input type="range" class="form-range"><input type="range" class="form-range" disabled></div>` },
    { clases: 'input-group input-group-text input-group-sm input-group-lg', html: `<div>
            <div class="input-group"><span class="input-group-text">$</span><input class="form-control"><button class="btn btn-outline-secondary">Buscar</button></div>
            <div class="input-group input-group-sm"><input class="form-control rounded-0"><span class="input-group-text">.00</span><button class="btn btn-primary btn-sm">Ir</button></div>
            <div class="input-group input-group-lg"><span class="input-group-text">@</span><select class="form-select"><option>Uno</option></select></div>
            <div class="input-group input-group-sm"><input class="form-control" data-ix-estado="focus"><button class="btn btn-light" data-ix-estado="focus">Foco</button></div></div>` },
    { clases: 'invalid-feedback is-invalid was-validated', html: `<div><input class="form-control is-invalid"><div class="invalid-feedback">Falta el dato</div>
            <select class="form-select is-invalid"><option>Uno</option></select><div class="form-check"><input type="checkbox" class="form-check-input is-invalid"><label class="form-check-label">Acepto</label></div>
            <form class="was-validated"><input class="form-control" required><div class="invalid-feedback">Requerido</div></form></div>` },

    // ---------------------------------------------------------------- tablas
    { clases: 'table table-sm table-bordered table-striped table-hover table-light', html: `<table class="table table-sm table-bordered table-striped table-hover">
            <thead class="table-light"><tr><th>Clave</th><th>Descripción</th><th class="text-end">Importe</th></tr></thead>
            <tbody><tr><td>A1</td><td>Uno</td><td class="text-end">10.00</td></tr><tr data-ix-estado="hover"><td>A2</td><td>Dos</td><td class="text-end">20.00</td></tr><tr><td>A3</td><td>Tres</td><td class="text-end">30.00</td></tr></tbody>
            <tfoot><tr><td colspan="2">Total</td><td class="text-end">60.00</td></tr></tfoot></table>` },
    { clases: 'table table-dark table-borderless table-responsive', html: `<div class="table-responsive"><table class="table table-dark"><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>
            <table class="table table-borderless"><tbody><tr><td>Sin</td><td>bordes</td></tr></tbody></table></div>` },

    // ---------------------------------------------------------------- tarjetas, pestañas, listas
    { clases: 'card card-header card-body card-title card-subtitle card-text card-link card-footer card-img-top card-header-tabs nav nav-tabs nav-item nav-link active disabled', html: `<div class="card" style="width:22rem">
            <img class="card-img-top" src="${img(352, 60)}"><div class="card-header"><ul class="nav nav-tabs card-header-tabs"><li class="nav-item"><a class="nav-link active" href="#">Activa</a></li><li class="nav-item"><a class="nav-link" href="#">Otra</a></li><li class="nav-item"><a class="nav-link disabled">No</a></li></ul></div>
            <div class="card-body"><h5 class="card-title">Título</h5><h6 class="card-subtitle mb-2 text-muted">Subtítulo</h6><p class="card-text">Texto de la tarjeta.</p><a href="#" class="card-link">Enlace</a><a href="#" class="card-link" data-ix-estado="hover">Otro</a></div>
            <div class="card-footer text-muted">Pie</div></div>` },
    { clases: 'nav nav-tabs nav-link tab-content tab-pane fade show active', html: `<div><ul class="nav nav-tabs" role="tablist"><li class="nav-item"><button class="nav-link active" type="button">Uno</button></li><li class="nav-item"><button class="nav-link" type="button" data-ix-estado="hover">Dos</button></li><li class="nav-item"><button class="nav-link" type="button" data-ix-estado="focus">Tres</button></li><li class="nav-item"><button class="nav-link disabled" type="button">Cuatro</button></li></ul>
            <div class="tab-content"><div class="tab-pane fade show active">Contenido uno</div><div class="tab-pane fade">Contenido dos</div></div>
            <div class="nav"><a class="nav-link" href="#">Suelto</a></div></div>` },
    { clases: 'list-group list-group-item list-group-flush list-group-numbered active disabled', html: `<div><ul class="list-group"><li class="list-group-item active">Activo</li><li class="list-group-item">Normal</li><li class="list-group-item disabled">Deshabilitado</li><li class="list-group-item">Último</li></ul>
            <div class="list-group list-group-flush"><a href="#" class="list-group-item">Plano</a><a href="#" class="list-group-item">Plano 2</a></div>
            <ol class="list-group list-group-numbered"><li class="list-group-item">Primero</li><li class="list-group-item">Segundo</li></ol></div>` },
    { clases: 'pagination pagination-sm page-item page-link active disabled', html: `<div><ul class="pagination"><li class="page-item disabled"><a class="page-link">Ant</a></li><li class="page-item active"><a class="page-link" href="#">1</a></li><li class="page-item"><a class="page-link" href="#" data-ix-estado="hover">2</a></li><li class="page-item"><a class="page-link" href="#">Sig</a></li></ul>
            <ul class="pagination pagination-sm"><li class="page-item"><a class="page-link" href="#">1</a></li><li class="page-item active"><a class="page-link" href="#">2</a></li><li class="page-item"><a class="page-link" href="#">3</a></li></ul></div>` },
    { clases: 'accordion-item accordion-header accordion-button accordion-collapse accordion-body collapse collapsed show', html: `<div style="width:24rem"><div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button" type="button">Abierto</button></h2><div class="accordion-collapse collapse show"><div class="accordion-body">Cuerpo</div></div></div>
            <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-ix-estado="focus">Cerrado</button></h2><div class="accordion-collapse collapse"><div class="accordion-body">Oculto</div></div></div></div>` },
    { clases: 'collapse collapsing show', html: `<div><div class="collapse">Oculto</div><div class="collapse show">Visible</div><div class="collapsing">En transición</div></div>` },

    // ---------------------------------------------------------------- menús
    { clases: 'dropdown dropdown-toggle dropdown-menu dropdown-item dropdown-menu-end show active disabled', alto: 220, html: `<div style="display:flex;gap:12rem">
            <div class="dropdown"><button class="btn btn-sm btn-light dropdown-toggle" type="button">Menú</button>
            <ul class="dropdown-menu show" data-bs-popper><li><a class="dropdown-item" href="#">Acción</a></li><li><a class="dropdown-item" href="#" data-ix-estado="hover">Hover</a></li><li><a class="dropdown-item active" href="#">Activa</a></li><li><a class="dropdown-item disabled">Deshabilitada</a></li><li><button class="dropdown-item" type="button" data-ix-estado="active">Botón</button></li></ul></div>
            <div class="dropdown"><button class="btn btn-sm btn-primary dropdown-toggle" type="button"></button><div class="dropdown-menu dropdown-menu-end show" data-bs-popper><a class="dropdown-item" href="#">Derecha</a></div></div>
            <div class="btn-group show"><button class="btn btn-primary dropdown-toggle">Mostrado</button></div></div>` },
    { clases: 'dropstart dropdown-toggle dropdown-menu', alto: 120, html: `<div style="padding-left:14rem"><div class="dropstart"><button class="btn btn-sm btn-secondary dropdown-toggle">Izquierda</button><div class="dropdown-menu show" data-bs-popper><a class="dropdown-item" href="#">Uno</a></div></div></div>` },
    { clases: 'navbar navbar-expand-lg navbar-light navbar-brand navbar-toggler navbar-collapse navbar-nav navbar-nav-scroll nav-link container-fluid', html: `<nav class="navbar navbar-expand-lg navbar-light bg-light"><div class="container-fluid"><a class="navbar-brand" href="#">Marca</a><button class="navbar-toggler" type="button">≡</button>
            <div class="collapse navbar-collapse"><ul class="navbar-nav navbar-nav-scroll me-auto"><li class="nav-item"><a class="nav-link active" href="#">Inicio</a></li><li class="nav-item"><a class="nav-link" href="#" data-ix-estado="hover">Otra</a></li><li class="nav-item"><a class="nav-link disabled">No</a></li></ul></div></div></nav>` },

    // ---------------------------------------------------------------- avisos, insignias, progreso, indicadores
    { clases: 'alert alert-primary alert-success alert-info alert-warning alert-danger alert-dismissible btn-close fade show', html: `<div>${['primary', 'success', 'info', 'warning', 'danger'].map(v => `<div class="alert alert-${v}" role="alert">Aviso ${v} con <a href="#">enlace</a></div>`).join('')}
            <div class="alert alert-danger alert-dismissible fade show" role="alert">Se puede cerrar<button type="button" class="btn-close"></button></div></div>` },
    { clases: 'badge bg-primary bg-secondary bg-success bg-warning bg-danger bg-light rounded-pill text-dark', html: `<div><span class="badge bg-primary">1</span> <span class="badge bg-secondary">2</span> <span class="badge bg-success">3</span> <span class="badge bg-warning text-dark">4</span> <span class="badge bg-danger rounded-pill">5</span> <span class="badge bg-light text-dark">6</span> <span class="badge"></span></div>` },
    { clases: 'progress progress-bar progress-bar-striped progress-bar-animated bg-success', html: `<div><div class="progress"><div class="progress-bar" role="progressbar" style="width:40%">40%</div></div>
            <div class="progress mt-2"><div class="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar" style="width:70%"></div></div></div>` },
    { clases: 'spinner-border spinner-grow text-primary', html: `<div><div class="spinner-border" role="status"><span class="visually-hidden">Cargando</span></div> <div class="spinner-border text-primary"></div> <div class="spinner-grow"></div></div>` },

    // ---------------------------------------------------------------- modal, toast, panel lateral, globo
    { clases: 'modal modal-dialog modal-dialog-centered modal-dialog-scrollable modal-content modal-header modal-title modal-body modal-footer btn-close fade show', alto: 340, html: `<div class="modal fade show" style="display:block"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
            <div class="modal-header"><h5 class="modal-title">Título</h5><button type="button" class="btn-close"></button></div>
            <div class="modal-body"><p>Cuerpo del diálogo.</p><p>Segunda línea.</p></div>
            <div class="modal-footer"><button class="btn btn-secondary btn-sm">Cancelar</button><button class="btn btn-primary btn-sm">Aceptar</button></div></div></div></div>` },
    { clases: 'modal modal-sm modal-lg modal-xl modal-static', alto: 300, html: `<div class="modal show modal-static" style="display:block"><div class="modal-dialog modal-sm"><div class="modal-content"><div class="modal-body">Chico</div></div></div>
            <div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-body">Grande</div></div></div><div class="modal-dialog modal-xl"><div class="modal-content"><div class="modal-body">Extra</div></div></div></div>` },
    { clases: 'modal-backdrop fade show', alto: 80, html: `<div><div class="modal-backdrop fade show"></div><div class="modal-backdrop fade"></div></div>` },
    { clases: 'toast toast-container toast-header toast-body position-fixed show hide showing btn-close', alto: 200, html: `<div class="toast-container position-fixed top-0 end-0 p-3"><div class="toast show" role="alert"><div class="toast-header"><strong class="me-auto">Aviso</strong><small>ahora</small><button type="button" class="btn-close"></button></div><div class="toast-body">Mensaje del aviso.</div></div>
            <div class="toast showing"><div class="toast-body">Apareciendo</div></div><div class="toast hide"><div class="toast-body">Oculto</div></div><div class="toast"><div class="toast-body">Sin show</div></div></div>` },
    { clases: 'offcanvas offcanvas-end offcanvas-header offcanvas-body show', alto: 220, html: `<div class="offcanvas offcanvas-end show" style="visibility:visible"><div class="offcanvas-header"><h5>Panel</h5><button type="button" class="btn-close text-reset"></button></div><div class="offcanvas-body">Contenido del panel</div></div>` },
    { clases: 'popover popover-arrow popover-header popover-body bs-popover-top bs-popover-bottom bs-popover-start bs-popover-end bs-popover-auto', alto: 200, html: `<div>
            <div class="popover bs-popover-top" style="top:60px;left:10px"><div class="popover-arrow" style="left:20px"></div><h3 class="popover-header">Arriba</h3><div class="popover-body">Contenido</div></div>
            <div class="popover bs-popover-bottom" style="top:20px;left:260px"><div class="popover-arrow" style="left:20px"></div><h3 class="popover-header">Abajo</h3><div class="popover-body">Contenido</div></div>
            <div class="popover bs-popover-end" style="top:20px;left:520px"><div class="popover-arrow" style="top:10px"></div><div class="popover-body">Derecha</div></div>
            <div class="popover bs-popover-start" style="top:100px;left:520px"><div class="popover-arrow" style="top:10px"></div><div class="popover-body">Izquierda</div></div>
            <div class="popover bs-popover-auto" data-popper-placement="bottom" style="top:110px;left:260px"><div class="popover-arrow" style="left:20px"></div><h3 class="popover-header">Auto</h3><div class="popover-body">Contenido</div></div></div>` },

    // ---------------------------------------------------------------- grilla y contenedores
    { clases: 'container container-fluid container-sm container-md container-lg', html: `<div><div class="container bg-light">container</div><div class="container-sm bg-light">sm</div><div class="container-md bg-light">md</div><div class="container-lg bg-light">lg</div><div class="container-fluid bg-light">fluid</div></div>` },
    { clases: 'row col col-auto col-sm col-sm-auto col-md-auto col-lg-auto g-2 g-3 g-4 gx-0 gy-0 gx-1 gy-1 gx-2 gy-2 gy-3 gx-4 gx-sm-2 gx-md-3 gx-lg-4', html: `<div>
            <div class="row g-2"><div class="col bg-light">col</div><div class="col-auto bg-light">auto</div><div class="col-sm bg-light">sm</div><div class="col-sm-auto bg-light">sm-auto</div></div>
            <div class="row g-3"><div class="col-md-auto bg-light">md-auto</div><div class="col-lg-auto bg-light">lg-auto</div><div class="col bg-light">col</div></div>
            <div class="row g-4"><div class="col bg-light">g-4</div><div class="col bg-light">g-4</div></div>
            <div class="row gx-0 gy-0"><div class="col bg-light">gx-0</div><div class="col bg-light">gy-0</div></div>
            <div class="row gx-1 gy-1"><div class="col-6 bg-light">gx-1</div><div class="col-6 bg-light">gy-1</div><div class="col-6 bg-light">gy-1</div></div>
            <div class="row gx-2 gy-2 gy-3"><div class="col-6 bg-light">gx-2</div><div class="col-6 bg-light">gy-3</div><div class="col-12 bg-light">fila 2</div></div>
            <div class="row gx-4 gx-sm-2 gx-md-3 gx-lg-4"><div class="col bg-light">resp.</div><div class="col bg-light">resp.</div></div></div>` },
    { clases: 'row col-2 col-3 col-4 col-6 col-7 col-8 col-9 col-10 col-12', html: `<div class="row">${['2', '3', '4', '6', '7', '8', '9', '10', '12'].map(n => `<div class="col-${n} bg-light border">col-${n}</div>`).join('')}</div>` },
    ...Object.entries({ sm: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12'], md: ['1', '2', '3', '4', '5', '6', '8', '9', '10', '12'],
        lg: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12'], xl: ['2', '3', '4', '5', '6'] }).map(([bp, ns]) => ({
        // Solo los anchos que usa el código (clases.tsv).
        clases: ns.map(n => `col-${bp}-${n}`).join(' ') + ({ sm: ' offset-sm-6', md: ' offset-md-6', lg: ' offset-lg-8' }[bp] || ''),
        html: `<div class="row">${ns.map(n => `<div class="col-${bp}-${n} bg-light border">${bp}-${n}</div>`).join('')}${{ sm: 'offset-sm-6', md: 'offset-md-6', lg: 'offset-lg-8' }[bp] ? `<div class="col-2 ${{ sm: 'offset-sm-6', md: 'offset-md-6', lg: 'offset-lg-8' }[bp]} bg-light">offset</div>` : ''}</div>`
    })),
    { clases: 'ratio ratio-16x9 ratio-1x1', html: `<div style="width:12rem"><div class="ratio ratio-16x9"><div class="bg-secondary"></div></div><div class="ratio ratio-1x1 mt-2"><div class="bg-light"></div></div></div>` },
    { clases: 'figure figure-img figure-caption img-fluid', html: `<figure class="figure"><img class="figure-img img-fluid rounded" src="${img(400, 60)}"><figcaption class="figure-caption">Leyenda</figcaption></figure>` },
    { clases: 'fixed-top fixed-bottom sticky-top position-sticky', alto: 120, html: `<div><div class="fixed-top bg-light">Arriba</div><div class="sticky-top bg-white">Pegajoso</div><div class="position-sticky top-0">Pegajoso 2</div><div class="fixed-bottom bg-light">Abajo</div></div>` },
    { clases: 'visually-hidden text-truncate invisible visible', html: `<div><span class="visually-hidden">oculto</span><div class="text-truncate" style="width:8rem">Texto muy largo que se corta con puntos</div><span class="invisible">invisible</span><span class="visible">visible</span></div>` },
];
