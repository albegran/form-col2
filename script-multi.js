// ========= Helper Google Analytics 4 (mock sencillo) =========
function trackGA4(eventName, params = {}) {
    if (window.gtag) {
        window.gtag('event', eventName, params);
    } else if (window.dataLayer) {
        window.dataLayer.push({ event: eventName, ...params });
    } else {
        console.log('GA4 event:', eventName, params);
    }
}

// Disparo genérico de GA4 para elementos con data-ga4-event
document.querySelectorAll('[data-ga4-event]').forEach(el => {
    const eventName = el.dataset.ga4Event;

    let domEvent = 'change';
    if (el.tagName === 'FORM') {
        domEvent = 'submit';
    } else if (el.tagName === 'BUTTON' || el.type === 'button' || el.type === 'submit') {
        domEvent = 'click';
    } else if (
        el.tagName === 'INPUT' &&
        (el.type === 'text' || el.type === 'email' || el.type === 'tel')
    ) {
        domEvent = 'blur';
    }

    el.addEventListener(domEvent, () => {
        trackGA4(eventName, {
            field_id: el.id || null,
            field_name: el.name || null
        });
    });
});

const formulario = document.getElementById('registroForm');
const enviarBtn = document.querySelector('.boton-enviar');

// ========= Validación campos de texto flotantes =========
const floatingInputs = document.querySelectorAll('.campo.flotante input');

function esCampoTextoValido(input) {
    const valor = input.value.trim();
    const tipo = input.dataset.tipoValidacion;

    if (!input.required && !valor) return true;

    if (tipo === 'texto-min2') {
        return valor.length >= 2;
    }
    if (tipo === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }
    if (tipo === 'telefono') {
        return /^[0-9+\s-]{6,}$/.test(valor);
    }
    return true;
}

function actualizarEstadoVisual(input, esValido, mostrarError) {
    const campo = input.closest('.campo');
    if (!campo) return;

    campo.classList.remove('valid', 'invalid');

    if (!input.value.trim()) {
        input.setAttribute('aria-invalid', 'false');
        return;
    }

    if (esValido) {
        campo.classList.add('valid');
        input.setAttribute('aria-invalid', 'false');
    } else if (mostrarError) {
        campo.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
    }
}

function validarCampoFlotante(input) {
    const esValido = esCampoTextoValido(input);
    actualizarEstadoVisual(input, esValido, true);
    return esValido;
}

floatingInputs.forEach(input => {
    const campo = input.closest('.campo');

    input.addEventListener('blur', () => {
        campo.classList.add('tocado');
        validarCampoFlotante(input);
        actualizarEstadoBotonEnvio();
    });

    input.addEventListener('input', () => {
        if (campo.classList.contains('tocado')) {
            validarCampoFlotante(input);
        } else {
            actualizarEstadoVisual(input, false, false);
        }
        actualizarEstadoBotonEnvio();
    });
});

// ========= Selects y campos relacionados =========
const prefijoCampo = document.querySelector('.campo-prefijo');
const prefijoSelect = document.getElementById('prefijo');
const prefijoFlag = document.querySelector('.prefijo-flag');
const prefijoPrefixSpan = document.querySelector('.prefijo-prefix');

const paisCampo = document.querySelector('.campo-pais');
const paisSelect = document.getElementById('pais-centro');
const paisFlag = document.querySelector('.pais-flag');
const paisTextSpan = document.querySelector('.pais-text');

const provinciaCampo = document.querySelector('.campo-provincia');
const provinciaSelect = document.getElementById('provincia-centro');

const localidadCampo = document.querySelector('.campo-localidad');
const localidadSelect = document.getElementById('localidad-centro');

const centroCampo = document.querySelector('.campo-centro');
const centroSelect = document.getElementById('centro-estudio');

const cursoActualCampo = document.querySelector('.campo-curso-actual');
const cursoActualSelect = document.getElementById('curso-actual');

const cursoCampo = document.querySelector('.campo-curso');
const cursoSelect = document.getElementById('curso-inicio');

// Perfil: solo select (desktop + mobile)
const perfilSelectCampo = document.querySelector('.campo-perfil-select');
const perfilSelect = document.getElementById('perfil-mobile');

// Bloque Mi titulación de interés (multi)
const titulacionGroup = document.getElementById('titulacion-multiple');
const titulacionAddBtn = document.getElementById('titulacion-add-btn');
const titulacionAddText = document.getElementById('titulacion-add-text');
const titulacionOpcionesContainer = document.getElementById('titulacion-opciones');
const titulacionHiddenInputs = [
    document.getElementById('titulacion-opcion-1'),
    document.getElementById('titulacion-opcion-2'),
    document.getElementById('titulacion-opcion-3')
];

// Aviso legal
const avisoCheckbox = document.getElementById('aviso');

// ========= Pseudo-selects nativos =========
const pseudoSelectInstances = [];
const pseudoSelectInstancesById = {};

function closeAllPseudoSelects() {
    pseudoSelectInstances.forEach(inst => {
        inst.campo.classList.remove('pseudo-open', 'abierto', 'open-up');
        if (inst.trigger) {
            inst.trigger.setAttribute('aria-expanded', 'false');
        }
        if (inst.dropdown) {
            inst.dropdown.style.top = '';
            inst.dropdown.style.bottom = '';
            inst.dropdown.style.marginTop = '';
            inst.dropdown.style.marginBottom = '';
        }
    });
}

function setupPseudoSelectFromNative(select, campo, type) {
    if (!select || !campo) return null;

    const control = campo.querySelector('.campo-control-select');
    if (!control) return null;

    // El select sigue visible (borde/valor), pero:
    // - no clicable
    // - NO enfocable por teclado (tab) => para evitar doble tabulación
    select.classList.add('native-select-hidden');
    select.setAttribute('tabindex', '-1');

    let trigger = control.querySelector('.pseudo-native-trigger');
    if (!trigger) {
        trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'pseudo-native-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        control.appendChild(trigger);
    }

    let dropdown = control.querySelector('.pseudo-native-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'pseudo-native-dropdown select-scroll-7';
        dropdown.setAttribute('role', 'listbox');
        control.appendChild(dropdown);
    }

    function rebuildOptions() {
        dropdown.innerHTML = '';
        const currentValue = select.value;
        const opciones = Array.from(select.options);

        opciones.forEach(opt => {
            if (!opt.value) return; // saltamos placeholder vacío
            const optDiv = document.createElement('div');
            optDiv.className = 'pseudo-native-option';
            optDiv.setAttribute('role', 'option');
            optDiv.dataset.value = opt.value;

            if (type === 'prefijo' || type === 'pais') {
                const flagCode = opt.dataset.flag;
                const flagSpan = document.createElement('span');
                flagSpan.className = 'pseudo-option-flag';
                if (flagCode) {
                    flagSpan.style.backgroundImage = `url('banderas/${flagCode}.png')`;
                }
                optDiv.appendChild(flagSpan);

                const textSpan = document.createElement('span');
                textSpan.className = 'pseudo-option-text';
                textSpan.textContent = opt.textContent.trim();
                optDiv.appendChild(textSpan);
            } else {
                optDiv.textContent = opt.textContent.trim();
            }

            if (opt.value === currentValue) {
                optDiv.setAttribute('aria-selected', 'true');
            }

            dropdown.appendChild(optDiv);
        });
    }

    rebuildOptions();

    function openDropdown() {
        closeAllPseudoSelects();

        campo.classList.add('pseudo-open', 'abierto');
        campo.classList.remove('open-up');
        trigger.setAttribute('aria-expanded', 'true');

        // Por defecto abrimos hacia abajo
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '4px';
        dropdown.style.marginBottom = '0';

        // En el siguiente frame comprobamos si se sale de la pantalla
        requestAnimationFrame(() => {
            const rect = dropdown.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            if (rect.bottom > viewportHeight) {
                // Abrimos hacia arriba
                campo.classList.add('open-up');
                dropdown.style.top = 'auto';
                dropdown.style.bottom = '100%';
                dropdown.style.marginTop = '0';
                dropdown.style.marginBottom = '4px';
            } else {
                campo.classList.remove('open-up');
            }
        });
    }

    function closeDropdown() {
        campo.classList.remove('pseudo-open', 'abierto', 'open-up');
        trigger.setAttribute('aria-expanded', 'false');
        dropdown.style.top = '';
        dropdown.style.bottom = '';
        dropdown.style.marginTop = '';
        dropdown.style.marginBottom = '';
    }

    // Click abre desplegable
    trigger.addEventListener('click', () => {
        openDropdown();
    });

    // Focus por teclado (tabulación) abre desplegable inmediatamente
    trigger.addEventListener('focus', () => {
        openDropdown();
    });

    // Accesibilidad teclado: Enter / Espacio abren o cierran
    trigger.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (campo.classList.contains('pseudo-open')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        }
    });

    dropdown.addEventListener('click', e => {
        const optDiv = e.target.closest('.pseudo-native-option');
        if (!optDiv) return;
        const value = optDiv.dataset.value;
        if (!value) return;

        select.value = value;

        dropdown.querySelectorAll('.pseudo-native-option[aria-selected="true"]')
            .forEach(el => el.removeAttribute('aria-selected'));
        optDiv.setAttribute('aria-selected', 'true');

        select.dispatchEvent(new Event('change', { bubbles: true }));

        closeDropdown();
    });

    const instancia = { campo, select, trigger, dropdown, type, rebuildOptions, openDropdown, closeDropdown };
    pseudoSelectInstances.push(instancia);
    if (select.id) {
        pseudoSelectInstancesById[select.id] = instancia;
    }
    return instancia;
}

// ========= Datos dependientes =========
const provinciasPorPais = {
    'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza'],
    'Francia': ['Île-de-France', 'Occitania', 'Nueva Aquitania'],
    'Italia': ['Lombardía', 'Lacio', 'Veneto'],
    'Alemania': ['Baviera', 'Berlín', 'Hamburgo'],
    'Portugal': ['Lisboa', 'Oporto', 'Algarve'],
    'Reino Unido': ['Inglaterra', 'Escocia', 'Gales'],
    'México': [
        'Ciudad de México',
        'Estado de México',
        'Jalisco',
        'Nuevo León',
        'Puebla'
    ],
    'Estados Unidos': ['California', 'Florida', 'Nueva York', 'Texas'],
    'Brasil': ['São Paulo', 'Río de Janeiro', 'Bahía'],
    'Argentina': ['Buenos Aires', 'Córdoba', 'Santa Fe'],
    'Chile': ['Santiago', 'Valparaíso', 'Biobío'],
    'Japón': ['Tokio', 'Osaka', 'Hokkaido'],
    'China': ['Pekín', 'Shanghái', 'Guangdong'],
    'Australia': ['Nueva Gales del Sur', 'Victoria', 'Queensland'],
    'Canadá': ['Ontario', 'Quebec', 'Columbia Británica'],
    'Colombia': ['Bogotá D.C.', 'Antioquia', 'Valle del Cauca'],
    'Perú': ['Lima', 'Cusco', 'Arequipa'],
    'India': ['Maharashtra', 'Delhi', 'Karnataka'],
    'Sudáfrica': ['Gauteng', 'Cabo Occidental', 'KwaZulu-Natal'],
    'Egipto': ['El Cairo', 'Giza', 'Alejandría']
};

const localidadesEstadoMexico = [
    'Ecatepec de Morelos',
    'Nezahualcóyotl',
    'Naucalpan de Juárez',
    'Toluca de Lerdo',
    'Tlalnepantla de Baz',
    'Metepec',
    'Cuautitlán Izcalli',
    'Texcoco',
    'Chimalhuacán',
    'Huixquilucan'
];

// ========= Utilidades select =========
function esSelectValido(select, campoWrapper) {
    if (!select || !campoWrapper) return true;
    if (campoWrapper.style.display === 'none') return true;
    if (!select.required) return true;
    return !!select.value;
}

function validarSelect(select, campoWrapper) {
    if (!select || !campoWrapper) return;

    const valor = select.value;
    campoWrapper.classList.remove('valid', 'invalid', 'tiene-valor');

    if (!select.required && !valor) {
        select.setAttribute('aria-invalid', 'false');
        return;
    }

    if (valor) {
        campoWrapper.classList.add('valid', 'tiene-valor');
        select.setAttribute('aria-invalid', 'false');
    } else {
        campoWrapper.classList.add('invalid');
        select.setAttribute('aria-invalid', 'true');
    }
}

/* Estado "abierto" para selects nativos (por si quedan) */
document.querySelectorAll('.campo-select select').forEach(select => {
    const campo = select.closest('.campo-select');
    if (!campo) return;

    select.addEventListener('focus', () => {
        campo.classList.add('abierto');
    });

    select.addEventListener('blur', () => {
        campo.classList.remove('abierto');
    });
});

// Prefijo: bandera + prefijo
function actualizarTextoPrefijo(select) {
    if (!prefijoCampo) return;

    const opcion = select.selectedOptions[0];

    if (!opcion || !select.value) {
        prefijoCampo.classList.remove('tiene-valor');
        if (prefijoFlag) {
            prefijoFlag.style.backgroundImage = 'none';
        }
        if (prefijoPrefixSpan) {
            prefijoPrefixSpan.textContent = '';
        }
        return;
    }

    const flagCode = opcion.dataset.flag || '';
    const prefix = opcion.dataset.prefix || select.value;

    if (prefijoFlag && flagCode) {
        prefijoFlag.style.backgroundImage = `url('banderas/${flagCode}.png')`;
    }

    if (prefijoPrefixSpan) {
        prefijoPrefixSpan.textContent = prefix;
    }

    prefijoCampo.classList.add('tiene-valor');
}

// País: bandera + nombre
function actualizarTextoPais(select) {
    if (!paisCampo) return;

    const opcion = select.selectedOptions[0];

    if (!opcion || !select.value) {
        paisCampo.classList.remove('tiene-valor');
        if (paisFlag) {
            paisFlag.style.backgroundImage = 'none';
        }
        if (paisTextSpan) {
            paisTextSpan.textContent = '';
        }
        return;
    }

    const flagCode = opcion.dataset.flag || '';
    const nombrePais = opcion.textContent.trim();

    if (paisFlag && flagCode) {
        paisFlag.style.backgroundImage = `url('banderas/${flagCode}.png')`;
    }

    if (paisTextSpan) {
        paisTextSpan.textContent = nombrePais;
    }

    paisCampo.classList.add('tiene-valor');
}

// Eventos change
if (prefijoSelect && prefijoCampo) {
    prefijoSelect.addEventListener('change', () => {
        prefijoCampo.classList.add('tocado');
        validarSelect(prefijoSelect, prefijoCampo);
        actualizarTextoPrefijo(prefijoSelect);
        actualizarEstadoBotonEnvio();
    });
}

if (paisSelect && paisCampo) {
    paisSelect.addEventListener('change', () => {
        paisCampo.classList.add('tocado');
        validarSelect(paisSelect, paisCampo);
        actualizarTextoPais(paisSelect);
        actualizarProvincias();
        actualizarEstadoBotonEnvio();
    });
}

if (provinciaSelect && provinciaCampo) {
    provinciaSelect.addEventListener('change', () => {
        provinciaCampo.classList.add('tocado');
        validarSelect(provinciaSelect, provinciaCampo);
        actualizarVisibilidadLocalidad();
        actualizarEstadoBotonEnvio();
    });
}

if (localidadSelect && localidadCampo) {
    localidadSelect.addEventListener('change', () => {
        localidadCampo.classList.add('tocado');
        validarSelect(localidadSelect, localidadCampo);
        actualizarEstadoBotonEnvio();
    });
}

if (centroSelect && centroCampo) {
    centroSelect.addEventListener('change', () => {
        centroCampo.classList.add('tocado');
        validarSelect(centroSelect, centroCampo);
        actualizarEstadoBotonEnvio();
    });
}

if (cursoActualSelect && cursoActualCampo) {
    cursoActualSelect.addEventListener('change', () => {
        cursoActualCampo.classList.add('tocado');
        validarSelect(cursoActualSelect, cursoActualCampo);
        actualizarEstadoBotonEnvio();
    });
}

if (cursoSelect && cursoCampo) {
    cursoSelect.addEventListener('change', () => {
        cursoCampo.classList.add('tocado');
        validarSelect(cursoSelect, cursoCampo);
        actualizarEstadoBotonEnvio();
    });
}

function actualizarProvincias() {
    if (!provinciaSelect || !provinciaCampo) return;

    const pais = paisSelect ? paisSelect.value : '';
    const provincias = provinciasPorPais[pais] || [];

    provinciaSelect.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.disabled = true;
    emptyOption.hidden = true;
    emptyOption.selected = true;
    provinciaSelect.appendChild(emptyOption);

    if (!pais || provincias.length === 0) {
        provinciaSelect.disabled = true;
        provinciaSelect.required = false;
        provinciaCampo.style.display = 'none';
        provinciaCampo.classList.remove('valid', 'invalid', 'tiene-valor', 'tocado');
        provinciaSelect.setAttribute('aria-invalid', 'false');
    } else {
        provinciaSelect.disabled = false;
        provinciaSelect.required = true;
        provinciaCampo.style.display = '';
        provincias.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            provinciaSelect.appendChild(opt);
        });

        provinciaCampo.classList.remove('valid', 'invalid', 'tiene-valor', 'tocado');
        provinciaSelect.setAttribute('aria-invalid', 'false');
    }

    provinciaSelect.value = '';

    const instProv = pseudoSelectInstancesById['provincia-centro'];
    if (instProv) instProv.rebuildOptions();

    actualizarVisibilidadLocalidad();
}

function actualizarVisibilidadLocalidad() {
    if (!localidadCampo || !localidadSelect || !paisSelect || !provinciaSelect) return;

    const pais = paisSelect.value;
    const provincia = provinciaSelect.value;

    const debeMostrar =
        pais === 'México' &&
        provincia === 'Estado de México';

    if (debeMostrar) {
        localidadCampo.style.display = '';
        localidadSelect.required = true;
        localidadSelect.setAttribute('aria-required', 'true');

        localidadSelect.innerHTML = '';

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.disabled = true;
        emptyOption.hidden = true;
        emptyOption.selected = true;
        localidadSelect.appendChild(emptyOption);

        localidadesEstadoMexico.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            localidadSelect.appendChild(opt);
        });

        localidadCampo.classList.remove('valid', 'invalid', 'tiene-valor', 'tocado');
        localidadSelect.setAttribute('aria-invalid', 'false');
    } else {
        localidadCampo.style.display = 'none';
        localidadSelect.required = false;
        localidadSelect.setAttribute('aria-required', 'false');
        localidadSelect.value = '';
        localidadCampo.classList.remove('valid', 'invalid', 'tiene-valor', 'tocado');
        localidadSelect.setAttribute('aria-invalid', 'false');
    }

    const instLoc = pseudoSelectInstancesById['localidad-centro'];
    if (instLoc) instLoc.rebuildOptions();
}

// ========= Modal Aviso Legal =========
const enlaceAviso = document.getElementById('enlace-aviso');
const modalAviso = document.getElementById('modal-aviso');
const cerrarModalBtn = document.querySelector('.cerrar-modal');

function abrirModalAviso(e) {
    if (e) e.preventDefault();
    if (!modalAviso || !formulario) return;

    const rectForm = formulario.getBoundingClientRect();
    const modalContenido = modalAviso.querySelector('.modal-contenido');
    modalContenido.style.width = rectForm.width + 'px';

    modalAviso.style.display = 'flex';
    modalAviso.setAttribute('aria-hidden', 'false');

    const titulo = modalAviso.querySelector('#modal-aviso-titulo');
    if (titulo) titulo.focus();
}

function cerrarModalAviso() {
    if (!modalAviso) return;
    modalAviso.style.display = 'none';
    modalAviso.setAttribute('aria-hidden', 'true');
}

if (enlaceAviso) {
    enlaceAviso.addEventListener('click', abrirModalAviso);
}

if (cerrarModalBtn) {
    cerrarModalBtn.addEventListener('click', cerrarModalAviso);
}

// ========= Modal Mi titulación de interés =========
const modalTitulacion = document.getElementById('modal-titulacion');
const cerrarModalTitulacionBtn = document.querySelector('.cerrar-modal-titulacion');
const filtroTitulacionesInput = document.getElementById('filtro-titulaciones');
const filtroClearBtn = document.getElementById('filtro-titulaciones-clear');
const listaTitulacionesContainer = document.getElementById('lista-titulaciones');

const areasTitulaciones = [
    {
        nombre: 'Área de ciencias naturales y biosanitarias',
        titulaciones: [
            'Grado en Enfermería',
            'Grado en Medicina',
            'Grado en Química',
            'Doble Grado Administración y Dirección de Empresas',
            'Grado en Nutrición Humana y Dietética',
            'Grado en Ciencias Ambientales'
        ]
    },
    {
        nombre: 'Área de ciencias sociales',
        titulaciones: [
            'Grado en Marketing',
            'Grado en Derecho',
            'Grado en Filosofía, Política y Economía (Philosophy, Politics and Economics)',
            'Grado en Educación Primaria'
        ]
    },
    {
        nombre: 'Área de ingeniería y arquitectura',
        titulaciones: [
            'Grado en Ingeniería Informática',
            'Grado en Ingeniería Industrial'
        ]
    }
];

let areaTitulacionNodes = [];
let titulacionesSeleccionadas = [null, null, null];
let indiceTitulacionActiva = null;
let filaArrastrando = null;

// Construcción lista titulaciones
function inicializarListaTitulaciones() {
    if (!listaTitulacionesContainer) return;

    listaTitulacionesContainer.innerHTML = '';

    areasTitulaciones.forEach(area => {
        const areaDiv = document.createElement('div');
        areaDiv.className = 'area-titulaciones';
        areaDiv.dataset.areaNombre = area.nombre;

        const tituloArea = document.createElement('div');
        tituloArea.className = 'area-titulo';
        tituloArea.textContent = area.nombre;
        areaDiv.appendChild(tituloArea);

        area.titulaciones.forEach(tit => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'item-titulacion';
            btn.textContent = tit;
            btn.dataset.titulacion = tit;
            areaDiv.appendChild(btn);
        });

        listaTitulacionesContainer.appendChild(areaDiv);
    });

    areaTitulacionNodes = Array.from(
        listaTitulacionesContainer.querySelectorAll('.area-titulaciones')
    );

    marcarTitulacionSeleccionadaEnLista();
}

// Deshabilitar titulaciones ya usadas en otras opciones
function marcarTitulacionSeleccionadaEnLista() {
    if (!listaTitulacionesContainer) return;

    const items = listaTitulacionesContainer.querySelectorAll('.item-titulacion');

    items.forEach(btn => {
        const valor = btn.dataset.titulacion || btn.textContent.trim();

        const usadaEnOtraOpcion = titulacionesSeleccionadas.some((tit, idx) => {
            if (!tit) return false;
            if (indiceTitulacionActiva == null) {
                return tit === valor;
            }
            return tit === valor && idx !== indiceTitulacionActiva;
        });

        if (usadaEnOtraOpcion) {
            btn.classList.add('titulacion-seleccionada');
            btn.setAttribute('aria-disabled', 'true');
            btn.disabled = true;
        } else {
            btn.classList.remove('titulacion-seleccionada');
            btn.removeAttribute('aria-disabled');
            btn.disabled = false;
        }
    });
}

function abrirModalTitulacionParaIndice(indice) {
    if (!modalTitulacion || !formulario) return;

    indiceTitulacionActiva = indice;

    const rectForm = formulario.getBoundingClientRect();
    const modalContenido = modalTitulacion.querySelector('.modal-contenido');
    modalContenido.style.width = rectForm.width + 'px';

    modalTitulacion.style.display = 'flex';
    modalTitulacion.setAttribute('aria-hidden', 'false');

    if (filtroTitulacionesInput) {
        filtroTitulacionesInput.value = '';
    }
    if (filtroClearBtn) {
        filtroClearBtn.style.display = 'none';
    }

    filtrarTitulaciones();
    marcarTitulacionSeleccionadaEnLista();

    const titulo = modalTitulacion.querySelector('#modal-titulacion-titulo');
    if (titulo) titulo.focus();
}

function cerrarModalTitulacion() {
    if (!modalTitulacion) return;
    modalTitulacion.style.display = 'none';
    modalTitulacion.setAttribute('aria-hidden', 'true');
    indiceTitulacionActiva = null;
}

if (cerrarModalTitulacionBtn) {
    cerrarModalTitulacionBtn.addEventListener('click', cerrarModalTitulacion);
}

// Filtrado titulaciones
function filtrarTitulaciones() {
    if (!filtroTitulacionesInput || !areaTitulacionNodes.length) return;

    const filtro = filtroTitulacionesInput.value.trim().toLowerCase();

    areaTitulacionNodes.forEach(area => {
        const items = area.querySelectorAll('.item-titulacion');
        let hayVisibles = false;

        items.forEach(btn => {
            const texto = btn.textContent.toLowerCase();
            const coincide = texto.includes(filtro);
            btn.style.display = coincide ? '' : 'none';
            if (coincide) hayVisibles = true;
        });

        area.style.display = hayVisibles ? '' : 'none';
    });
}

if (filtroTitulacionesInput) {
    filtroTitulacionesInput.addEventListener('input', () => {
        filtrarTitulaciones();
        marcarTitulacionSeleccionadaEnLista();

        if (filtroClearBtn) {
            const tieneTexto = filtroTitulacionesInput.value.trim().length > 0;
            filtroClearBtn.style.display = tieneTexto ? 'block' : 'none';
        }
    });
}

if (filtroClearBtn && filtroTitulacionesInput) {
    filtroClearBtn.addEventListener('click', () => {
        filtroTitulacionesInput.value = '';
        filtrarTitulaciones();
        marcarTitulacionSeleccionadaEnLista();
        filtroTitulacionesInput.focus();
        filtroClearBtn.style.display = 'none';
    });
}

if (listaTitulacionesContainer) {
    listaTitulacionesContainer.addEventListener('click', (e) => {
        const boton = e.target.closest('.item-titulacion');
        if (!boton || boton.disabled) return;

        const valor = boton.dataset.titulacion || boton.textContent.trim();
        seleccionarTitulacion(valor);
    });
}

// ========= Bloque Mi titulación de interés (multi) =========
function obtenerEtiquetaOpcion(indice) {
    if (indice === 0) return 'Mi 1ª opción es …';
    if (indice === 1) return 'Mi 2ª opción es …';
    if (indice === 2) return 'Mi 3ª opción es …';
    return 'Mi opción es …';
}

function actualizarEtiquetasOpciones() {
    if (!titulacionOpcionesContainer) return;
    const filas = Array.from(titulacionOpcionesContainer.children);
    filas.forEach((fila, idx) => {
        const label = fila.querySelector('.titulacion-opcion-label');
        if (label) label.textContent = obtenerEtiquetaOpcion(idx);
    });
}

function numeroTitulacionesSeleccionadas() {
    return titulacionesSeleccionadas.filter(Boolean).length;
}

function actualizarTextoBotonAdd() {
    if (!titulacionAddBtn || !titulacionAddText) return;
    const num = numeroTitulacionesSeleccionadas();

    if (num >= 3) {
        titulacionAddBtn.style.display = 'none';
        return;
    }

    titulacionAddBtn.style.display = 'inline-flex';

    if (num === 0) {
        titulacionAddText.textContent = 'Añadir 1º opción';
    } else if (num === 1) {
        titulacionAddText.textContent = 'Añadir 2ª opción';
    } else {
        titulacionAddText.textContent = 'Añadir 3ª opción';
    }
}

function actualizarEstadoDragHandles() {
    if (!titulacionOpcionesContainer) return;
    const filas = Array.from(titulacionOpcionesContainer.children);
    const mostrar = filas.length >= 2;

    filas.forEach(fila => {
        const handle = fila.querySelector('.titulacion-drag-handle');
        if (handle) {
            handle.style.visibility = mostrar ? 'visible' : 'hidden';
        }
    });
}

function clearDropHintsTitulaciones() {
    if (!titulacionOpcionesContainer) return;
    titulacionOpcionesContainer
        .querySelectorAll('.titulacion-opcion-row.drop-before, .titulacion-opcion-row.drop-after')
        .forEach(row => row.classList.remove('drop-before', 'drop-after'));
}

function crearFilaTitulacion() {
    const fila = document.createElement('div');
    fila.className = 'titulacion-opcion-row';
    fila.draggable = false;

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'titulacion-drag-handle';
    handle.innerHTML = '';
    handle.setAttribute('aria-label', 'Reordenar opción');
    fila.appendChild(handle);

    const campoDiv = document.createElement('div');
    campoDiv.className = 'campo campo-select campo-titulacion';

    const controlDiv = document.createElement('div');
    controlDiv.className = 'campo-control-select';

    const pseudoBtn = document.createElement('button');
    pseudoBtn.type = 'button';
    pseudoBtn.className = 'pseudo-select-boton titulacion-opcion-trigger';
    pseudoBtn.setAttribute('aria-haspopup', 'dialog');
    pseudoBtn.setAttribute('aria-expanded', 'false');
    pseudoBtn.setAttribute('aria-controls', 'modal-titulacion');

    const textoSpan = document.createElement('span');
    textoSpan.className = 'pseudo-select-texto';
    pseudoBtn.appendChild(textoSpan);

    const label = document.createElement('label');
    label.className = 'titulacion-opcion-label';
    label.textContent = obtenerEtiquetaOpcion(0);

    controlDiv.appendChild(pseudoBtn);
    controlDiv.appendChild(label);
    campoDiv.appendChild(controlDiv);
    fila.appendChild(campoDiv);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'titulacion-remove-btn';
    removeBtn.textContent = 'X';
    removeBtn.setAttribute('aria-label', 'Eliminar esta opción');
    fila.appendChild(removeBtn);

    pseudoBtn.addEventListener('click', () => {
        if (!titulacionOpcionesContainer) return;
        const filas = Array.from(titulacionOpcionesContainer.children);
        const indice = filas.indexOf(fila);
        if (indice === -1) return;
        abrirModalTitulacionParaIndice(indice);
    });

    removeBtn.addEventListener('click', () => {
        if (!titulacionOpcionesContainer) return;
        const filas = Array.from(titulacionOpcionesContainer.children);
        const indice = filas.indexOf(fila);
        if (indice === -1) return;
        eliminarOpcion(indice);
    });

    // Drag solo desde el icono
    handle.addEventListener('mousedown', () => {
        fila.draggable = true;
    });

    const desactivarDraggable = () => {
        fila.draggable = false;
    };
    handle.addEventListener('mouseup', desactivarDraggable);
    handle.addEventListener('mouseleave', desactivarDraggable);

    fila.addEventListener('dragstart', e => {
        filaArrastrando = fila;
        fila.classList.add('dragging');
        if (titulacionOpcionesContainer) {
            titulacionOpcionesContainer.classList.add('dragging-activo');
        }
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        }
    });

    fila.addEventListener('dragend', () => {
        if (filaArrastrando) {
            filaArrastrando.classList.remove('dragging');
        }
        filaArrastrando = null;
        clearDropHintsTitulaciones();
        if (titulacionOpcionesContainer) {
            titulacionOpcionesContainer.classList.remove('dragging-activo');
        }
        fila.draggable = false;
        actualizarOrdenTitulacionesDesdeDOM();
    });

    fila.addEventListener('dragover', e => {
        e.preventDefault();
        if (!titulacionOpcionesContainer || !filaArrastrando || filaArrastrando === fila) return;

        const bounding = fila.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        const shouldInsertBefore = offset < bounding.height / 2;

        clearDropHintsTitulaciones();

        if (shouldInsertBefore) {
            fila.classList.add('drop-before');
            titulacionOpcionesContainer.insertBefore(filaArrastrando, fila);
        } else {
            fila.classList.add('drop-after');
            titulacionOpcionesContainer.insertBefore(filaArrastrando, fila.nextSibling);
        }
    });

    return fila;
}

function asegurarFilaParaIndice(indice) {
    if (!titulacionOpcionesContainer) return null;
    let filas = Array.from(titulacionOpcionesContainer.children);
    while (filas.length <= indice) {
        const nuevaFila = crearFilaTitulacion();
        titulacionOpcionesContainer.appendChild(nuevaFila);
        filas = Array.from(titulacionOpcionesContainer.children);
    }
    actualizarEtiquetasOpciones();
    actualizarEstadoDragHandles();
    return filas[indice];
}

function eliminarOpcion(indice) {
    if (!titulacionOpcionesContainer) return;
    const filas = Array.from(titulacionOpcionesContainer.children);
    if (!filas[indice]) return;

    titulacionOpcionesContainer.removeChild(filas[indice]);

    titulacionesSeleccionadas.splice(indice, 1);
    titulacionesSeleccionadas.push(null);

    for (let i = 0; i < 3; i++) {
        if (titulacionHiddenInputs[i]) {
            titulacionHiddenInputs[i].value = titulacionesSeleccionadas[i] || '';
        }
    }

    actualizarEtiquetasOpciones();
    actualizarEstadoDragHandles();
    actualizarTextoBotonAdd();
    actualizarEstadoValidacionTitulaciones();
    marcarTitulacionSeleccionadaEnLista();
    actualizarEstadoBotonEnvio();
}

function actualizarOrdenTitulacionesDesdeDOM() {
    if (!titulacionOpcionesContainer) return;
    const filas = Array.from(titulacionOpcionesContainer.children);
    const nuevasSelecciones = [null, null, null];

    filas.forEach((fila, idx) => {
        const textoSpan = fila.querySelector('.pseudo-select-texto');
        const valor = textoSpan ? textoSpan.textContent.trim() : '';
        nuevasSelecciones[idx] = valor || null;
        if (titulacionHiddenInputs[idx]) {
            titulacionHiddenInputs[idx].value = valor;
        }
    });

    titulacionesSeleccionadas = nuevasSelecciones;

    for (let i = filas.length; i < 3; i++) {
        if (titulacionHiddenInputs[i]) {
            titulacionHiddenInputs[i].value = '';
        }
    }

    actualizarEtiquetasOpciones();
    actualizarEstadoDragHandles();
    actualizarTextoBotonAdd();
    actualizarEstadoValidacionTitulaciones();
    marcarTitulacionSeleccionadaEnLista();
    actualizarEstadoBotonEnvio();
}

function seleccionarTitulacion(valor) {
    if (indiceTitulacionActiva == null) {
        cerrarModalTitulacion();
        return;
    }
    if (!titulacionOpcionesContainer) return;

    const indice = indiceTitulacionActiva;
    const fila = asegurarFilaParaIndice(indice);
    if (!fila) return;

    titulacionesSeleccionadas[indice] = valor;
    if (titulacionHiddenInputs[indice]) {
        titulacionHiddenInputs[indice].value = valor;
    }

    const textoSpan = fila.querySelector('.pseudo-select-texto');
    if (textoSpan) {
        textoSpan.textContent = valor;
    }

    const campo = fila.querySelector('.campo-titulacion');
    if (campo) {
        campo.classList.add('valid', 'tiene-valor');
        campo.classList.remove('invalid');
    }

    cerrarModalTitulacion();
    actualizarEtiquetasOpciones();
    actualizarEstadoDragHandles();
    actualizarTextoBotonAdd();
    actualizarEstadoValidacionTitulaciones();
    marcarTitulacionSeleccionadaEnLista();
    actualizarEstadoBotonEnvio();
}

if (titulacionAddBtn) {
    titulacionAddBtn.addEventListener('click', () => {
        const num = numeroTitulacionesSeleccionadas();
        if (num >= 3) return;
        indiceTitulacionActiva = num;
        abrirModalTitulacionParaIndice(indiceTitulacionActiva);
    });
}

// ========= Cerrar modales + pseudo-selects ESC + clic fuera =========
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllPseudoSelects();

        if (modalAviso && modalAviso.style.display === 'flex') {
            cerrarModalAviso();
        } else if (modalTitulacion && modalTitulacion.style.display === 'flex') {
            cerrarModalTitulacion();
        }
    }
});

if (modalAviso) {
    modalAviso.addEventListener('click', (e) => {
        if (e.target === modalAviso) {
            cerrarModalAviso();
        }
    });
}

if (modalTitulacion) {
    modalTitulacion.addEventListener('click', (e) => {
        if (e.target === modalTitulacion) {
            cerrarModalTitulacion();
        }
    });
}

// Cerrar pseudo-selects al hacer clic fuera
document.addEventListener('click', (e) => {
    pseudoSelectInstances.forEach(inst => {
        if (!inst.campo.contains(e.target)) {
            inst.campo.classList.remove('pseudo-open', 'abierto', 'open-up');
            inst.trigger.setAttribute('aria-expanded', 'false');
            inst.dropdown.style.top = '';
            inst.dropdown.style.bottom = '';
            inst.dropdown.style.marginTop = '';
            inst.dropdown.style.marginBottom = '';
        }
    });
});

// ========= Perfil: solo select (desktop + mobile) =========
function esPerfilValido() {
    return !!(perfilSelect && perfilSelect.value);
}

/**
 * Validación UX para "Soy…":
 * Si el usuario no ha elegido nada y se posiciona en otro campo,
 * se muestra el error.
 */
function validarPerfilEnInteraccion() {
    if (esPerfilValido()) {
        if (perfilSelectCampo) {
            perfilSelectCampo.classList.remove('invalid');
        }
        if (perfilSelect) {
            perfilSelect.setAttribute('aria-invalid', 'false');
        }
        return;
    }

    if (perfilSelect && perfilSelectCampo) {
        perfilSelectCampo.classList.add('invalid', 'tocado');
        perfilSelect.setAttribute('aria-invalid', 'true');
    }
}

// Cuando cambia el select de Soy…
if (perfilSelect && perfilSelectCampo) {
    perfilSelect.addEventListener('change', () => {
        perfilSelectCampo.classList.add('tocado');
        validarSelect(perfilSelect, perfilSelectCampo);
        actualizarEstadoBotonEnvio();
    });
}

// Listener global: cuando el foco entra en cualquier otro campo distinto de "Soy…"
document.addEventListener('focusin', (e) => {
    if (!formulario.contains(e.target)) return;

    if (perfilSelectCampo && perfilSelectCampo.contains(e.target)) return;

    validarPerfilEnInteraccion();
});

// ========= Aviso legal =========
if (avisoCheckbox) {
    avisoCheckbox.addEventListener('change', actualizarEstadoBotonEnvio);
}

// ========= Validación titulación (multi) =========
function esTitulacionValida() {
    if (!titulacionGroup) return true;
    return numeroTitulacionesSeleccionadas() >= 1;
}

function actualizarEstadoValidacionTitulaciones() {
    if (!titulacionGroup) return;

    const esValido = esTitulacionValida();

    if (esValido) {
        if (numeroTitulacionesSeleccionadas() > 0) {
            titulacionGroup.classList.add('valid');
        } else {
            titulacionGroup.classList.remove('valid');
        }
        if (titulacionGroup.classList.contains('invalid') && !numeroTitulacionesSeleccionadas()) {
            // se deja invalid si se intentó enviar sin nada
        } else {
            titulacionGroup.classList.remove('invalid');
        }
    } else {
        if (titulacionGroup.classList.contains('tocado')) {
            titulacionGroup.classList.add('invalid');
            titulacionGroup.classList.remove('valid');
        }
    }
}

// ========= Estado botón ENVIAR =========
function actualizarEstadoBotonEnvio() {
    if (!enviarBtn) return;

    let listo = true;

    floatingInputs.forEach(input => {
        if (!esCampoTextoValido(input)) {
            listo = false;
        }
    });

    if (!esSelectValido(prefijoSelect, prefijoCampo)) listo = false;
    if (!esSelectValido(paisSelect, paisCampo)) listo = false;
    if (!esSelectValido(provinciaSelect, provinciaCampo)) listo = false;
    if (!esSelectValido(localidadSelect, localidadCampo)) listo = false;
    if (!esSelectValido(centroSelect, centroCampo)) listo = false;
    if (!esSelectValido(cursoActualSelect, cursoActualCampo)) listo = false;
    if (!esSelectValido(cursoSelect, cursoCampo)) listo = false;

    if (!esTitulacionValida()) listo = false;

    if (!esPerfilValido()) listo = false;

    if (!avisoCheckbox || !avisoCheckbox.checked) listo = false;

    enviarBtn.disabled = !listo;
    enviarBtn.classList.toggle('boton-activo', listo);
}

// ========= Envío del formulario =========
formulario.addEventListener('submit', (e) => {
    let formularioValido = true;
    let primerInvalido = null;

    floatingInputs.forEach(input => {
        const campo = input.closest('.campo');
        campo.classList.add('tocado');
        const esValido = validarCampoFlotante(input);
        if (!esValido && formularioValido) {
            formularioValido = false;
            primerInvalido = input;
        }
    });

    if (prefijoSelect && prefijoCampo) {
        prefijoCampo.classList.add('tocado');
        validarSelect(prefijoSelect, prefijoCampo);
        if (prefijoCampo.classList.contains('invalid') && formularioValido) {
            formularioValido = false;
            primerInvalido = prefijoSelect;
        }
    }

    if (paisSelect && paisCampo) {
        paisCampo.classList.add('tocado');
        validarSelect(paisSelect, paisCampo);
        if (paisCampo.classList.contains('invalid') && formularioValido) {
            formularioValido = false;
            primerInvalido = paisSelect;
        }
    }

    if (provinciaSelect && provinciaCampo && provinciaCampo.style.display !== 'none') {
        provinciaCampo.classList.add('tocado');
        validarSelect(provinciaSelect, provinciaCampo);
        if (provinciaCampo.classList.contains('invalid') && formularioValido) {
            formularioValido = false;
            primerInvalido = provinciaSelect;
        }
    }

    if (localidadSelect && localidadCampo &&
        localidadCampo.style.display !== 'none' &&
        localidadSelect.required) {
        localidadCampo.classList.add('tocado');
        validarSelect(localidadSelect, localidadCampo);
        if (localidadCampo.classList.contains('invalid') && formularioValido) {
            formularioValido = false;
            primerInvalido = localidadSelect;
        }
    }

    if (centroSelect && centroCampo) {
        centroCampo.classList.add('tocado');
        validarSelect(centroSelect, centroCampo);
        if (centroCampo.classList.contains('invalid') && formularioValido) {
            formularioValido = false;
            primerInvalido = centroSelect;
        }
    }

    if (cursoActualSelect && cursoActualCampo) {
        cursoActualCampo.classList.add('tocado');
        validarSelect(cursoActualSelect, cursoActualCampo);
        if (cursoActualCampo.classList.contains('invalid') && formularioValido) {
            formularioValido = false;
            primerInvalido = cursoActualSelect;
        }
    }

    if (cursoSelect && cursoCampo) {
        cursoCampo.classList.add('tocado');
        validarSelect(cursoSelect, cursoCampo);
        if (cursoCampo.classList.contains('invalid') && formularioValido) {
            formularioValido = false;
            primerInvalido = cursoSelect;
        }
    }

    if (titulacionGroup) {
        titulacionGroup.classList.add('tocado');
        if (!esTitulacionValida()) {
            titulacionGroup.classList.add('invalid');
            titulacionGroup.classList.remove('valid');
            if (formularioValido) {
                formularioValido = false;
                const trigger =
                    titulacionOpcionesContainer.querySelector('.titulacion-opcion-trigger') ||
                    titulacionAddBtn;
                primerInvalido = trigger;
            }
        } else {
            titulacionGroup.classList.add('valid');
            titulacionGroup.classList.remove('invalid');
        }
    }

    // Validación de Soy… con feedback visual, sin alert()
    if (!esPerfilValido()) {
        formularioValido = false;
        if (perfilSelect && perfilSelectCampo) {
            perfilSelectCampo.classList.add('invalid', 'tocado');
            perfilSelect.setAttribute('aria-invalid', 'true');
            if (!primerInvalido) primerInvalido = perfilSelect;
        }
    }

    if (!avisoCheckbox || !avisoCheckbox.checked) {
        formularioValido = false;
        if (!primerInvalido && avisoCheckbox) {
            primerInvalido = avisoCheckbox;
        }
        alert('Debe aceptar el aviso legal.');
    }

    if (!formularioValido) {
        e.preventDefault();
        if (primerInvalido && typeof primerInvalido.focus === 'function') {
            primerInvalido.focus();
        }
        actualizarEstadoBotonEnvio();
        return;
    }

    e.preventDefault();
    trackGA4('formulario_enviado', { form_id: formulario.id });
    alert('Formulario enviado correctamente (prototipo).');
});

// ========= Inicialización titulación desde hidden =========
function inicializarTitulacionesDesdeHidden() {
    if (!titulacionOpcionesContainer || !titulacionHiddenInputs.length) return;

    titulacionesSeleccionadas = [null, null, null];

    titulacionHiddenInputs.forEach((input, index) => {
        const valor = (input && input.value.trim()) || '';
        if (valor) {
            titulacionesSeleccionadas[index] = valor;
            const fila = asegurarFilaParaIndice(index);
            if (!fila) return;
            const textoSpan = fila.querySelector('.pseudo-select-texto');
            const campo = fila.querySelector('.campo-titulacion');
            if (textoSpan) textoSpan.textContent = valor;
            if (campo) {
                campo.classList.add('valid', 'tiene-valor');
                campo.classList.remove('invalid');
            }
        }
    });

    actualizarEtiquetasOpciones();
    actualizarEstadoDragHandles();
    actualizarTextoBotonAdd();
    actualizarEstadoValidacionTitulaciones();
    marcarTitulacionSeleccionadaEnLista();
}

// ========= Inicializaciones =========
inicializarListaTitulaciones();
inicializarTitulacionesDesdeHidden();

// Pseudo-selects (incluimos Centro)
setupPseudoSelectFromNative(prefijoSelect, prefijoCampo, 'prefijo');
setupPseudoSelectFromNative(paisSelect, paisCampo, 'pais');
setupPseudoSelectFromNative(provinciaSelect, provinciaCampo, 'provincia');
setupPseudoSelectFromNative(localidadSelect, localidadCampo, 'localidad');
setupPseudoSelectFromNative(centroSelect, centroCampo, 'centro');

actualizarEstadoBotonEnvio();

// Prefijo/Pais inicial
if (prefijoSelect) actualizarTextoPrefijo(prefijoSelect);
if (paisSelect) actualizarTextoPais(paisSelect);
