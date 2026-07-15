const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let mapGlobal, mapModal, markerModal;
let todosLosEventos = [];
let eventosPremiumTinder = [];
let tinderIndex = 0;
let usuarioConectado = null;
let archivosMultimediaABorrar = [];
let temporizadorCarrusel = null;
let temporizadorBarraProgreso = null;
let eventoPendienteChatConsent = null;
let perfilSeccionActual = 'favoritos';
let perfilFiltroActual = 'todos';
let grupoEventosActual = 'todos';
let tokenSesion = null;
let emailPendienteVerificacion = '';
let redSocialUsuarios = [];
let redSocialNotificaciones = [];
let redSocialMuro = [];
let redSocialBusqueda = '';
let redSocialVista = 'muro';
const TIEMPO_EXPOSICION = 15000;
const chatVentanasActivas = {};
const WHATSAPP_PROMOTOR_NUMERO = '34643435797';
const PAISES_OPCIONES = [
    { code: 'ES', name: 'España' },
    { code: 'PT', name: 'Portugal' },
    { code: 'FR', name: 'Francia' },
    { code: 'IT', name: 'Italia' },
    { code: 'AD', name: 'Andorra' },
    { code: 'DE', name: 'Alemania' },
    { code: 'GB', name: 'Reino Unido' },
    { code: 'IE', name: 'Irlanda' },
    { code: 'NL', name: 'Países Bajos' },
    { code: 'BE', name: 'Bélgica' },
    { code: 'CH', name: 'Suiza' },
    { code: 'AT', name: 'Austria' },
    { code: 'SE', name: 'Suecia' },
    { code: 'NO', name: 'Noruega' },
    { code: 'DK', name: 'Dinamarca' },
    { code: 'US', name: 'Estados Unidos' },
    { code: 'CA', name: 'Canadá' },
    { code: 'MX', name: 'México' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CO', name: 'Colombia' },
    { code: 'PE', name: 'Perú' },
    { code: 'CL', name: 'Chile' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'PA', name: 'Panamá' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'DO', name: 'República Dominicana' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'HN', name: 'Honduras' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'BR', name: 'Brasil' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'Nueva Zelanda' }
];
const PLANES_OPCIONES = [
    'Musica en vivo',
    'Festivales',
    'Gastronomia',
    'Deporte',
    'Cultura',
    'Ocio nocturno',
    'Aire libre',
    'Familia',
    'Bienestar',
    'Tecnologia',
    'Arte y talleres',
    'Viajes',
    'Networking',
    'Eventos premium'
];

function normalizarClaveGrupo(valor = '') {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizarCategoriaGrupo(categoria = '') {
    const texto = String(categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!texto) return 'Cultura';
    if (texto.includes('music') || texto.includes('conciert') || texto.includes('musica')) return 'Musica en vivo';
    if (texto.includes('festival')) return 'Festivales';
    if (texto.includes('gastr') || texto.includes('comida') || texto.includes('food')) return 'Gastronomia';
    if (texto.includes('deport') || texto.includes('sport')) return 'Deporte';
    if (texto.includes('nocturn') || texto.includes('fiesta') || texto.includes('party')) return 'Ocio nocturno';
    if (texto.includes('aire libre') || texto.includes('outdoor') || texto.includes('natura') || texto.includes('ruta')) return 'Aire libre';
    if (texto.includes('familia') || texto.includes('ninos') || texto.includes('infantil') || texto.includes('kids')) return 'Familia';
    if (texto.includes('bienestar') || texto.includes('wellness') || texto.includes('salud') || texto.includes('yoga')) return 'Bienestar';
    if (texto.includes('tecnolog') || texto.includes('tech') || texto.includes('digital')) return 'Tecnologia';
    if (texto.includes('taller') || texto.includes('arte') || texto.includes('workshop')) return 'Arte y talleres';
    if (texto.includes('viaje') || texto.includes('turism') || texto.includes('escapada')) return 'Viajes';
    if (texto.includes('network') || texto.includes('negocio') || texto.includes('feria')) return 'Networking';
    if (texto.includes('premium') || texto.includes('vip')) return 'Eventos premium';
    return 'Cultura';
}

function obtenerGrupoEvento(evento = {}) {
    if (evento.esPremium) return 'Eventos premium';
    return normalizarCategoriaGrupo(evento.categoria || '');
}

function obtenerEventosGenerales() {
    return todosLosEventos.filter((evento) => !evento.esPremium);
}

function obtenerGruposEventosDisponibles() {
    const conteo = new Map();
    todosLosEventos.forEach((evento) => {
        const grupo = obtenerGrupoEvento(evento);
        conteo.set(grupo, (conteo.get(grupo) || 0) + 1);
    });

    const orden = new Map(PLANES_OPCIONES.map((grupo, indice) => [grupo, indice]));
    return Array.from(conteo.entries())
        .map(([grupo, total]) => ({ grupo, total }))
        .sort((a, b) => {
            const ordenA = orden.has(a.grupo) ? orden.get(a.grupo) : 999;
            const ordenB = orden.has(b.grupo) ? orden.get(b.grupo) : 999;
            if (ordenA !== ordenB) return ordenA - ordenB;
            return a.grupo.localeCompare(b.grupo, 'es');
        });
}

function seleccionarGrupoEventos(grupo = 'todos') {
    grupoEventosActual = grupo;
    renderizarListaYMapa();
}

function obtenerHeadersAutenticacion(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (tokenSesion) {
        headers.Authorization = `Bearer ${tokenSesion}`;
    }
    return headers;
}

function escaparHtml(valor = '') {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function obtenerSemaforoNormalizado(colorSemaforo = '') {
    const valor = String(colorSemaforo || '').toUpperCase();
    if (valor === 'VERDE' || valor === 'ROJO') return valor;
    return 'AMARILLO';
}

function obtenerClaseAvatarSemaforo(colorSemaforo = '') {
    const estado = obtenerSemaforoNormalizado(colorSemaforo);
    if (estado === 'VERDE') return 'avatar-status-verde';
    if (estado === 'ROJO') return 'avatar-status-rojo';
    return 'avatar-status-amarillo';
}

function colorAvatarSemaforo(colorSemaforo = '') {
    const estado = obtenerSemaforoNormalizado(colorSemaforo);
    if (estado === 'VERDE') return ['#059669', '#10b981'];
    if (estado === 'ROJO') return ['#dc2626', '#ef4444'];
    return ['#d97706', '#f59e0b'];
}

function generarAvatarIniciales(nombre = 'Usuario', colorSemaforo = 'AMARILLO') {
    const limpio = String(nombre || 'Usuario').trim();
    const partes = limpio.split(/\s+/).filter(Boolean);
    const iniciales = ((partes[0]?.[0] || 'U') + (partes[1]?.[0] || '')).toUpperCase().slice(0, 2);
    const [c1, c2] = colorAvatarSemaforo(colorSemaforo);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><circle cx="60" cy="40" r="18" fill="rgba(255,255,255,0.22)"/><path d="M26 98c5-19 20-30 34-30s29 11 34 30" fill="rgba(255,255,255,0.22)"/><text x="60" y="74" text-anchor="middle" font-family="Poppins,Segoe UI,sans-serif" font-size="34" font-weight="700" fill="#ffffff">${iniciales}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function normalizarFotosUsuario(fotos = []) {
    const origen = Array.isArray(fotos) ? fotos : (fotos ? [fotos] : []);
    return origen
        .map((item) => {
            if (!item) return '';
            if (typeof item === 'string') return item.trim();
            if (typeof item === 'object') {
                return String(item.url || item.secure_url || item.src || item.path || '').trim();
            }
            return '';
        })
        .filter(Boolean);
}

function resolverUrlMedia(url = '') {
    const valor = String(url || '').trim();
    if (!valor) return '';
    if (valor.startsWith('//')) return `${window.location.protocol}${valor}`;
    if (/^(https?:|data:|blob:)/i.test(valor)) return valor;
    const sinPrefijoLocal = valor.replace(/^\.\//, '');
    if (sinPrefijoLocal.startsWith('/')) return `${API_BASE}${sinPrefijoLocal}`;
    if (/^(uploads|api)\//i.test(sinPrefijoLocal)) return `${API_BASE}/${sinPrefijoLocal}`;
    return sinPrefijoLocal;
}

function obtenerFotoPerfil(usuario = {}) {
    const fotosNormalizadas = normalizarFotosUsuario(usuario?.fotos);
    if (fotosNormalizadas[0]) {
        return resolverUrlMedia(fotosNormalizadas[0]);
    }
    return generarAvatarIniciales(usuario?.nombre || 'Usuario', usuario?.colorSemaforo || 'AMARILLO');
}

function aplicarImagenPerfilEnElemento(imgEl, usuario, srcPrincipal, claseAvatar) {
    if (!imgEl) return;
    const srcFallback = generarAvatarIniciales(usuario?.nombre || 'Usuario', usuario?.colorSemaforo || 'AMARILLO');
    imgEl.onerror = () => {
        imgEl.onerror = null;
        imgEl.src = srcFallback;
    };
    imgEl.classList.remove('avatar-status-verde', 'avatar-status-amarillo', 'avatar-status-rojo');
    imgEl.classList.add(claseAvatar);
    imgEl.src = srcPrincipal || srcFallback;
}

function asegurarAvatarCabeceraPerfil() {
    const nombreEl = document.getElementById('lblNombreUsuario');
    let fotoCabecera = document.getElementById('lblFotoPerfilUsuario');

    if (nombreEl && nombreEl.parentElement) {
        const identidad = nombreEl.parentElement;
        identidad.classList.add('hero-profile-identidad');

        // Limpia iconos emoji antiguos en nodos de texto heredados de caché.
        Array.from(identidad.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && /👤/.test(node.textContent || '')) {
                identidad.removeChild(node);
            }
        });
        Array.from(identidad.children).forEach((el) => {
            if (
                el.id !== 'lblFotoPerfilUsuario' &&
                el.id !== 'lblNombreUsuario' &&
                el.id !== 'lblSemaforo' &&
                el.id !== 'lblPromotorStatus' &&
                /👤/.test(el.textContent || '')
            ) {
                el.remove();
            }
        });

        if (!fotoCabecera) {
            fotoCabecera = document.createElement('img');
            fotoCabecera.id = 'lblFotoPerfilUsuario';
            fotoCabecera.className = 'hero-profile-avatar';
            fotoCabecera.alt = 'Foto de perfil';
            fotoCabecera.style.cssText = 'width:54px;height:54px;border-radius:50%;object-fit:cover;border:3px solid rgba(245,158,11,0.95);';
            identidad.insertBefore(fotoCabecera, nombreEl);
        }
    }

    const btnPerfilMenu = document.getElementById('btnPerfilMenu');
    let fotoBotonPerfil = document.getElementById('btnPerfilAvatar');
    if (btnPerfilMenu) {
        const spanLabel = btnPerfilMenu.querySelector('span');
        if (spanLabel && /👤/.test(spanLabel.textContent || '')) {
            spanLabel.textContent = 'Mi perfil ▾';
        }
        Array.from(btnPerfilMenu.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && /👤/.test(node.textContent || '')) {
                btnPerfilMenu.removeChild(node);
            }
        });

        if (!fotoBotonPerfil) {
            fotoBotonPerfil = document.createElement('img');
            fotoBotonPerfil.id = 'btnPerfilAvatar';
            fotoBotonPerfil.className = 'btn-perfil-avatar';
            fotoBotonPerfil.alt = 'Foto de perfil';
            fotoBotonPerfil.style.cssText = 'width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid rgba(245,158,11,0.9);';
            btnPerfilMenu.insertBefore(fotoBotonPerfil, btnPerfilMenu.firstChild);
        }
    }

    return { fotoCabecera, fotoBotonPerfil };
}

function actualizarBadgeNotificacionesSociales() {
    const badge = document.getElementById('btnPerfilMenuBadge');
    if (!badge) return;
    const user = usuarioConectado || {};
    const notificaciones = redSocialNotificaciones.length > 0 ? redSocialNotificaciones : (user.notificacionesSociales || []);
    const noLeidas = notificaciones.filter((item) => !item.leida).length;
    if (noLeidas > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = noLeidas > 99 ? '99+' : String(noLeidas);
    } else {
        badge.style.display = 'none';
        badge.textContent = '0';
    }
}

function inicializarSelectPaises(idSelect, seleccionado = '') {
    const select = document.getElementById(idSelect);
    if (!select) return;
    select.innerHTML = '<option value="">Selecciona tu país</option>';
    PAISES_OPCIONES.forEach((pais) => {
        const option = document.createElement('option');
        option.value = pais.code;
        option.textContent = pais.name;
        if (pais.code === seleccionado) option.selected = true;
        select.appendChild(option);
    });
}

function crearSlug(valor) {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');
}

function inicializarPlanesFormulario(prefijo, seleccionadas = []) {
    const contenedor = document.getElementById(`${prefijo}PreferenciasPlanes`);
    if (!contenedor) return;
    const seleccion = new Set((seleccionadas || []).map((item) => String(item)));
    contenedor.innerHTML = '';
    PLANES_OPCIONES.forEach((plan) => {
        const id = `${prefijo}Plan-${crearSlug(plan)}`;
        const etiqueta = document.createElement('label');
        etiqueta.className = 'preferencia-chip';
        etiqueta.setAttribute('for', id);
        etiqueta.innerHTML = `
            <input type="checkbox" id="${id}" value="${plan}">
            <span>${plan}</span>
        `;
        contenedor.appendChild(etiqueta);
        const input = etiqueta.querySelector('input');
        input.checked = seleccion.has(plan);
    });
}

function obtenerPlanesSeleccionadosFormulario(prefijo) {
    const contenedor = document.getElementById(`${prefijo}PreferenciasPlanes`);
    if (!contenedor) return [];
    return Array.from(contenedor.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
}

function actualizarDireccionSeleccionada(prefijo, sugerencia) {
    const hidden = document.getElementById(`${prefijo}DireccionResidencia`);
    const input = document.getElementById(`${prefijo}DireccionBusqueda`);
    if (!hidden || !input) return;
    hidden.value = JSON.stringify(sugerencia);
    input.value = sugerencia.displayName || '';
    const contenedor = document.getElementById(`${prefijo}DireccionSugerencias`);
    if (contenedor) contenedor.innerHTML = '';
}

function obtenerDireccionSeleccionadaFormulario(prefijo) {
    const hidden = document.getElementById(`${prefijo}DireccionResidencia`);
    if (!hidden || !hidden.value) return null;
    try {
        return JSON.parse(hidden.value);
    } catch (error) {
        return null;
    }
}

function configurarAutocompleteDireccion(prefijo) {
    const input = document.getElementById(`${prefijo}DireccionBusqueda`);
    const contenedor = document.getElementById(`${prefijo}DireccionSugerencias`);
    const hidden = document.getElementById(`${prefijo}DireccionResidencia`);
    if (!input || !contenedor || !hidden) return;

    let temporizador = null;
    const limpiarSugerencias = () => {
        contenedor.innerHTML = '';
    };

    input.addEventListener('input', () => {
        hidden.value = '';
        limpiarSugerencias();
        const query = input.value.trim();
        if (query.length < 3) return;

        clearTimeout(temporizador);
        temporizador = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) {
                    limpiarSugerencias();
                    return;
                }
                contenedor.innerHTML = data.map((item) => {
                    const countryCode = String(item.address?.country_code || '').toUpperCase();
                    const countryName = item.address?.country || '';
                    const payload = encodeURIComponent(JSON.stringify({
                        placeId: item.place_id,
                        displayName: item.display_name,
                        latitud: Number(item.lat),
                        longitud: Number(item.lon),
                        countryCode,
                        countryName
                    }));
                    return `<button type="button" class="direccion-sugerencia" data-json="${payload}">${item.display_name}</button>`;
                }).join('');

                contenedor.querySelectorAll('.direccion-sugerencia').forEach((boton) => {
                    boton.addEventListener('click', () => {
                        const raw = boton.getAttribute('data-json') || '';
                        if (!raw) return;
                        const parsed = JSON.parse(decodeURIComponent(raw));
                        actualizarDireccionSeleccionada(prefijo, parsed);
                    });
                });
            } catch (error) {
                console.error('Error buscando dirección sugerida:', error);
            }
        }, 300);
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (!hidden.value) {
                limpiarSugerencias();
            }
        }, 150);
    });
}

function calcularEdad(fechaISO) {
    if (!fechaISO) return 0;
    const nacimiento = new Date(fechaISO);
    if (Number.isNaN(nacimiento.getTime())) return 0;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad -= 1;
    }
    return edad;
}

function esMayorDeEdad(fechaISO, edadMinima = 18) {
    return calcularEdad(fechaISO) >= edadMinima;
}

function esSuperAdmin() {
    if (!usuarioConectado) return false;
    return usuarioConectado.esAdmin === true;
}

function esModerador() {
    if (!usuarioConectado) return false;
    return usuarioConectado.esModerador === true;
}

function esPerfilPrivilegiadoSinRestricciones() {
    return esSuperAdmin() || esModerador();
}

function puedeGestionarEventos() {
    return esSuperAdmin() || esModerador();
}

function tieneAccesoPromotor() {
    if (!usuarioConectado) return false;
    return esSuperAdmin() || (usuarioConectado.tipoUsuario === 'PROMOTOR' && usuarioConectado.promotorAprobado);
}

function obtenerVerificacionPromotorDesdeFormulario(prefijo) {
    const declaracion = document.getElementById(`${prefijo}DeclaracionPromotor`);
    const tipoPromotorLegal = document.getElementById(`${prefijo}TipoPromotorLegal`)?.value || 'EMPRESA';
    return {
        tipoPromotorLegal,
        nombreComercial: document.getElementById(`${prefijo}NombreComercial`)?.value.trim() || '',
        nifCif: document.getElementById(`${prefijo}NifCif`)?.value.trim() || '',
        cargo: document.getElementById(`${prefijo}CargoPromotor`)?.value.trim() || '',
        telefonoProfesional: document.getElementById(`${prefijo}TelefonoPromotor`)?.value.trim() || '',
        webRedSocial: document.getElementById(`${prefijo}WebRedesPromotor`)?.value.trim() || '',
        ciudadesOperacion: document.getElementById(`${prefijo}CiudadesPromotor`)?.value.trim() || '',
        tipoEventos: document.getElementById(`${prefijo}TipoEventosPromotor`)?.value.trim() || '',
        frecuenciaEventos: document.getElementById(`${prefijo}FrecuenciaPromotor`)?.value.trim() || '',
        enlacePrueba: document.getElementById(`${prefijo}PruebaPromotor`)?.value.trim() || '',
        declaracionVeracidad: declaracion ? declaracion.checked : false
    };
}

function verificacionPromotorCompleta(verificacion) {
    const requiereNif = verificacion.tipoPromotorLegal !== 'PARTICULAR';
    return (
        verificacion.tipoPromotorLegal &&
        verificacion.nombreComercial &&
        (!requiereNif || verificacion.nifCif) &&
        verificacion.cargo &&
        verificacion.telefonoProfesional &&
        verificacion.webRedSocial &&
        verificacion.ciudadesOperacion &&
        verificacion.tipoEventos &&
        verificacion.frecuenciaEventos &&
        verificacion.enlacePrueba &&
        verificacion.declaracionVeracidad === true
    );
}

function aplicarRequiredVerificacionPromotor(prefijo, requerido) {
    const tipoPromotorLegal = document.getElementById(`${prefijo}TipoPromotorLegal`)?.value || 'EMPRESA';
    const requiereNif = tipoPromotorLegal !== 'PARTICULAR';
    const selectTipo = document.getElementById(`${prefijo}TipoPromotorLegal`);
    if (selectTipo) selectTipo.required = requerido;
    [
        `${prefijo}NombreComercial`,
        `${prefijo}CargoPromotor`,
        `${prefijo}TelefonoPromotor`,
        `${prefijo}WebRedesPromotor`,
        `${prefijo}CiudadesPromotor`,
        `${prefijo}TipoEventosPromotor`,
        `${prefijo}FrecuenciaPromotor`,
        `${prefijo}PruebaPromotor`
    ].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.required = requerido;
    });
    const nif = document.getElementById(`${prefijo}NifCif`);
    if (nif) {
        nif.required = requerido && requiereNif;
        nif.placeholder = requiereNif
            ? 'NIF/CIF de la empresa o autónomo'
            : 'NIF/CIF (opcional para particular)';
    }
    const check = document.getElementById(`${prefijo}DeclaracionPromotor`);
    if (check) check.required = requerido;
}

function rellenarVerificacionPromotorPerfil(verificacion = {}) {
    document.getElementById('perfilTipoPromotorLegal').value = verificacion.tipoPromotorLegal || 'EMPRESA';
    document.getElementById('perfilNombreComercial').value = verificacion.nombreComercial || '';
    document.getElementById('perfilNifCif').value = verificacion.nifCif || '';
    document.getElementById('perfilCargoPromotor').value = verificacion.cargo || '';
    document.getElementById('perfilTelefonoPromotor').value = verificacion.telefonoProfesional || '';
    document.getElementById('perfilWebRedesPromotor').value = verificacion.webRedSocial || '';
    document.getElementById('perfilCiudadesPromotor').value = verificacion.ciudadesOperacion || '';
    document.getElementById('perfilTipoEventosPromotor').value = verificacion.tipoEventos || '';
    document.getElementById('perfilFrecuenciaPromotor').value = verificacion.frecuenciaEventos || '';
    document.getElementById('perfilPruebaPromotor').value = verificacion.enlacePrueba || '';
    document.getElementById('perfilDeclaracionPromotor').checked = verificacion.declaracionVeracidad === true;
    aplicarRequiredVerificacionPromotor('perfil', true);
}

function urlify(text) {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[\S]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" style="color: #ec4899; text-decoration: underline;">${url}</a>`;
    });
}

function normalizarTextoBusqueda(valor = '') {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function irAlMapaInteractivo() {
    const mapaEl = document.getElementById('mapaCalorGlobal');
    if (!mapaEl) return;
    mapaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (mapGlobal) {
        setTimeout(() => {
            mapGlobal.invalidateSize();
        }, 350);
    }
}

function obtenerPrimerEventoFiestas() {
    const candidato = todosLosEventos.find((ev) => {
        const categoria = normalizarTextoBusqueda(ev?.categoria || '');
        const titulo = normalizarTextoBusqueda(ev?.titulo || '');
        return categoria.includes('fiesta') || titulo.includes('fiesta');
    });
    return candidato || null;
}

function irAlPrimerPlanFiestas() {
    const eventoFiesta = obtenerPrimerEventoFiestas();
    if (!eventoFiesta) {
        alert('Aun no hay planes en la categoria fiestas disponibles.');
        return;
    }

    const contenedor = document.getElementById('eventosContenedor');
    const tarjeta = contenedor?.querySelector(`[data-evento-id="${eventoFiesta._id}"]`);

    if (tarjeta) {
        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        tarjeta.classList.add('resaltado-plan');
        setTimeout(() => tarjeta.classList.remove('resaltado-plan'), 2300);
    } else if (contenedor) {
        contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => abrirModalDetalle(eventoFiesta._id), 260);
}

function inicializarAccesosRapidosFranja() {
    const btnMapa = document.getElementById('btnIrMapaInteres');
    const btnFiestas = document.getElementById('btnIrFiestas');

    if (btnMapa) {
        btnMapa.addEventListener('click', irAlMapaInteractivo);
    }
    if (btnFiestas) {
        btnFiestas.addEventListener('click', irAlPrimerPlanFiestas);
    }
}

function inicializarMapaGlobal() {
    mapGlobal = L.map('mapaCalorGlobal').setView([41.14, 1.40], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapGlobal);
}

async function cargarPortal() {
    const res = await fetch(`${API_BASE}/api/eventos`, {
        headers: obtenerHeadersAutenticacion()
    });
    todosLosEventos = await res.json();
    grupoEventosActual = 'todos';
    eventosPremiumTinder = todosLosEventos.filter(ev => ev.esPremium === true);
    renderizarListaYMapa();
    renderizarMisEventosGuardados();
    activarModoTinder();
}

function renderizarListaYMapa() {
    const contenedor = document.getElementById('eventosContenedor');
    if (!contenedor) return;
    let tabs = document.getElementById('tabsEventosGrupos');
    if (!tabs && contenedor.parentElement) {
        tabs = document.createElement('div');
        tabs.id = 'tabsEventosGrupos';
        tabs.className = 'event-tabs';
        contenedor.parentElement.insertBefore(tabs, contenedor);
    }

    const eventosGenerales = obtenerEventosGenerales();
    const gruposDisponibles = obtenerGruposEventosDisponibles();
    if (grupoEventosActual !== 'todos' && !gruposDisponibles.some((item) => item.grupo === grupoEventosActual)) {
        grupoEventosActual = 'todos';
    }

    const eventosVisibles = grupoEventosActual === 'todos'
        ? todosLosEventos
        : grupoEventosActual === 'Eventos premium'
            ? todosLosEventos.filter((evento) => evento.esPremium)
            : eventosGenerales.filter((evento) => obtenerGrupoEvento(evento) === grupoEventosActual);

    const pestañasHtml = [
        `<button type="button" class="event-tab ${grupoEventosActual === 'todos' ? 'activo' : ''}" onclick="seleccionarGrupoEventos('todos')">Todos <span>${eventosGenerales.length}</span></button>`,
        ...gruposDisponibles.map(({ grupo, total }) => `
            <button type="button" class="event-tab ${grupoEventosActual === grupo ? 'activo' : ''}" onclick="seleccionarGrupoEventos(${JSON.stringify(grupo)})">
                ${escaparHtml(grupo)} <span>${total}</span>
            </button>
        `)
    ].join('');

    tabs.innerHTML = `
        <div class="event-tabs-header">
            <div>
                <h3>Explora por grupo</h3>
                <p>Los eventos automáticos entran como genéricos. El premium queda reservado para promotores premium o admin.</p>
            </div>
            <div class="event-tabs-badge">Mapa interactivo activo</div>
        </div>
        <div class="event-tabs-row">${pestañasHtml}</div>
    `;

    contenedor.innerHTML = '';
    mapGlobal.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) mapGlobal.removeLayer(layer);
    });
    if (eventosVisibles.length === 0) {
        contenedor.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No hay eventos en este grupo por ahora.</p>';
    }
    const eventosMapa = todosLosEventos;
    console.log(`[MAPA] Intentando renderizar ${eventosMapa.length} eventos`);
    eventosMapa.forEach(ev => {
        console.log(`[MAPA] Evento: ${ev.titulo}`);
        console.log(`[MAPA]   ubicacion:`, ev.ubicacion);
        if (ev.ubicacion?.coordenadas?.latitud) {
            const lat = ev.ubicacion.coordenadas.latitud;
            const lon = ev.ubicacion.coordenadas.longitud;
            console.log(`[MAPA]   ✅ Dibujando marcador en [${lat}, ${lon}]`);
            const temperatura = Math.min(30 + (ev.afluenciaEnVivo || 0), 100);
            L.circleMarker([lat, lon], {
                radius: temperatura / 2,
                fillColor: ev.esPremium ? '#f59e0b' : '#a855f7',
                color: ev.esPremium ? '#f59e0b' : '#a855f7',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.35
            }).addTo(mapGlobal).bindPopup(`<b>${escaparHtml(ev.titulo)}</b><br>${escaparHtml(obtenerGrupoEvento(ev))}<br>🔥 Actividad Live: ${ev.afluenciaEnVivo || 0} pts`);
        } else {
            console.log(`[MAPA]   ❌ Sin coordenadas válidas`);
        }
    });
    eventosVisibles.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'card';
        div.dataset.eventoId = ev._id;
        div.onclick = (e) => {
            if (!e.target.closest('button') && !e.target.closest('audio') && !e.target.closest('span[onclick]')) {
                abrirModalDetalle(ev._id);
            }
        };
        let imgPortadaHTML = '';
        if (ev.multimediaUrl && !ev.multimediaUrl.endsWith('.mp4') && !ev.multimediaUrl.endsWith('.mov')) {
            imgPortadaHTML = `<img src="${ev.multimediaUrl}" class="imagen-portada-card" alt="${ev.titulo}">`;
        } else {
            imgPortadaHTML = `<img src="https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600" class="imagen-portada-card" alt="Portada por defecto">`;
        }
        const grupoEvento = obtenerGrupoEvento(ev);
        const esOrganizador = usuarioConectado && usuarioConectado.nombre.trim().toLowerCase() === ev.organizador.trim().toLowerCase();
        const esSuperAdminLocal = esSuperAdmin();
        div.innerHTML = `
            <div class="grupo-evento-chip">${escaparHtml(grupoEvento)}</div>
            ${imgPortadaHTML}
            <div class="contenido-card">
                <h3>${ev.titulo}</h3>
                <p style="font-size:0.85rem; color:var(--text-muted); margin:5px 0;">${urlify(ev.descripcion)}</p>

                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; background:#0f172a; padding:8px; border-radius:8px;">
                    <span>📍 ${ev.ubicacion?.direccion?.substring(0,35) || 'Ubicación'}...</span>
                    <span style="color:#10b981; font-weight:bold;">${ev.precio===0?'Gratis':ev.precio+'€'}</span>
                </div>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function activarModoTinder() {
    const wrapper = document.getElementById('tinderWrapper');
    wrapper.innerHTML = '';
    tinderIndex = 0;
    const deshabilitarControles = !usuarioConectado;
    document.getElementById('btnSwipeNo').disabled = deshabilitarControles;
    document.getElementById('btnSwipeInteresa').disabled = deshabilitarControles;
    document.getElementById('btnSwipeAsistire').disabled = deshabilitarControles;
    document.getElementById('msgAnonimoSwipe').style.display = deshabilitarControles ? 'block' : 'none';
    if (eventosPremiumTinder.length === 0) {
        wrapper.innerHTML = '<div style="text-align:center; padding-top:180px; color:var(--text-muted); font-weight:500;">No hay eventos Premium destacados actualmente.</div>';
        return;
    }
    eventosPremiumTinder.forEach((ev, idx) => {
        const card = document.createElement('div');
        card.className = 'tinder-card';
        card.id = `tinderCard-${idx}`;
        card.onclick = () => abrirModalDetalle(ev._id);
        let urlFondo = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200';
        if (ev.multimediaUrl && !ev.multimediaUrl.endsWith('.mp4') && !ev.multimediaUrl.endsWith('.mov')) {
            urlFondo = ev.multimediaUrl;
        }
        card.style.backgroundImage = `url('${urlFondo}')`;
        card.innerHTML = `
            <div class="tinder-card-overlay">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="background:var(--premium-gold); color:black; font-size:0.8rem; padding:6px 14px; border-radius:12px; font-weight:800; letter-spacing:1px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">⭐ DESTACADO PREMIUM</span>
                    <span style="background:#4f46e5; font-size:0.75rem; padding:5px 10px; border-radius:8px; font-weight:bold;">${ev.categoria}</span>
                </div>
                <div style="margin-bottom: 5px;">
                    <h3 style="font-size: 2.2rem; color:white; font-weight: 800; line-height: 1.1; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">${ev.titulo}</h3>
                    <p style="font-size:1rem; color:#e2e8f0; margin-top:10px; line-height:1.4; max-width: 800px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${urlify(ev.descripcion)}</p>
                    <div style="display:flex; gap:20px; margin-top:15px; font-size:0.9rem; color:#f1f5f9; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
                        <span>🏢 Promueve: <b>${ev.organizador}</b></span>
                        <span>📍 Ubicación: <b>${ev.ubicacion?.direccion?.substring(0,50) || 'No especificada'}...</b></span>
                        <span style="color:#34d399; font-weight:bold;">💵 Precio: ${ev.precio===0?'Gratis':ev.precio+'€'}</span>
                    </div>
                    <div class="barra-tiempo-container">
                        <div class="barra-tiempo-progreso" id="barraProgreso-${idx}"></div>
                    </div>
                </div>
            </div>
        `;
        wrapper.appendChild(card);
    });
    mostrarCartaActual();
    iniciarCicloTemporizador();
}

function mostrarCartaActual() {
    const cartas = document.querySelectorAll('.tinder-card');
    cartas.forEach((c, idx) => {
        if (idx === tinderIndex) c.classList.add('card-activa'); else c.classList.remove('card-activa');
    });
}

function iniciarCicloTemporizador() {
    clearInterval(temporizadorCarrusel);
    clearInterval(temporizadorBarraProgreso);
    if (eventosPremiumTinder.length <= 1) return;
    const barra = document.getElementById(`barraProgreso-${tinderIndex}`);
    let width = 0;
    if (barra) barra.style.width = '0%';
    temporizadorBarraProgreso = setInterval(() => {
        width += (100 / (TIEMPO_EXPOSICION / 100));
        if (barra) barra.style.width = `${Math.min(width, 100)}%`;
    }, 100);
    temporizadorCarrusel = setInterval(() => navegarCarruselManualmente(1), TIEMPO_EXPOSICION);
}

function navegarCarruselManualmente(direccion) {
    if (eventosPremiumTinder.length <= 1) return;
    const barraPrevia = document.getElementById(`barraProgreso-${tinderIndex}`);
    if (barraPrevia) barraPrevia.style.width = '0%';
    tinderIndex += direccion;
    if (tinderIndex >= eventosPremiumTinder.length) tinderIndex = 0;
    if (tinderIndex < 0) tinderIndex = eventosPremiumTinder.length - 1;
    mostrarCartaActual();
    iniciarCicloTemporizador();
}

async function interactuarPremium(accion) {
    if (eventosPremiumTinder.length === 0) return;
    const evActual = eventosPremiumTinder[tinderIndex];
    await ejecutarInteraccionDetalle(evActual._id, accion);
}

function abrirModalDetalle(idEvento) {
    const ev = todosLosEventos.find(item => item._id === idEvento);
    if (!ev) return;
    const contenedorModal = document.getElementById('contenidoDetalleEvento');
    const estaDeshabilitado = !usuarioConectado;
    let galeriaMediaHTML = '';
    if (ev.multimediaUrl) {
        if (ev.multimediaUrl.endsWith('.mp4') || ev.multimediaUrl.endsWith('.mov')) {
            galeriaMediaHTML += `<video src="${ev.multimediaUrl}" class="media-detalle-item" controls></video>`;
        } else {
            galeriaMediaHTML += `<img src="${ev.multimediaUrl}" class="media-detalle-item" alt="Media Principal">`;
        }
    }
    if (ev.galeria && ev.galeria.length > 0) {
        ev.galeria.forEach(url => {
            if (url.endsWith('.mp4') || url.endsWith('.mov')) {
                galeriaMediaHTML += `<video src="${url}" class="media-detalle-item" controls></video>`;
            } else {
                galeriaMediaHTML += `<img src="${url}" class="media-detalle-item" alt="Galería">`;
            }
        });
    } else if (!ev.multimediaUrl) {
        galeriaMediaHTML += `
            <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400" class="media-detalle-item" alt="Demo 1">
            <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400" class="media-detalle-item" alt="Demo 2">
        `;
    }
    const esOrganizador = usuarioConectado && usuarioConectado.nombre.trim().toLowerCase() === ev.organizador.trim().toLowerCase();
    const esSuperAdminLocal = esSuperAdmin();
    const esModeradorLocal = esModerador();
    let botonEditarHTML = '';
    if (esOrganizador || esSuperAdminLocal || esModeradorLocal) {
        botonEditarHTML = `<button class="btn-interaccion" style="background:#4f46e5; margin-top: 15px; width: 100%; border-radius: 8px;" onclick="abrirModalEditar('${ev._id}')">📝 Editar Detalles y Multimedia</button>`;
    }
    const botonBorrarHTML = (esSuperAdminLocal || esModeradorLocal)
        ? `<button class="btn-interaccion" style="background:#ef4444; margin-top: 10px; width: 100%; border-radius: 8px;" onclick="borrarEvento('${ev._id}')">🗑️ Borrar evento</button>`
        : '';
    contenedorModal.innerHTML = `
        <h2 style="color:white; margin-bottom:10px; font-size:1.6rem;">${ev.titulo}</h2>
        <span style="background:#4f46e5; font-size:0.75rem; padding:4px 10px; border-radius:8px; font-weight:bold; display:inline-block; margin-bottom:15px;">${ev.categoria}</span>
        <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.5; margin-bottom:15px;">${urlify(ev.descripcion)}</p>
        <h4 style="color:var(--premium-gold); margin-bottom:8px; font-size:0.9rem;">📸 Galería Multimedia y Videos:</h4>
        <div class="grid-galeria-detalles">${galeriaMediaHTML}</div>
        <div style="background:#0f172a; padding:12px; border-radius:10px; font-size:0.85rem; margin-bottom:20px; border: 1px solid #334155;">
            <p style="margin-bottom:4px;">🏢 <b>Organizador:</b> ${ev.organizador}</p>
            <p style="margin-bottom:4px;">📍 <b>Dirección Completa:</b> ${ev.ubicacion?.direccion || 'No especificada'}</p>
            <p style="margin-bottom:4px;">💵 <b>Precio Entrada:</b> <span style="color:#10b981; font-weight:bold;">${ev.precio === 0 ? 'Gratis' : ev.precio + '€'}</span></p>
            ${ev.fuente && ev.fuente.url ? `<p style="margin-bottom:0;">🔗 <b>Fuente:</b> <a href="${ev.fuente.url}" target="_blank" style="color:#3b82f6; text-decoration:underline;">${ev.fuente.nombre || 'Ver origen'}</a></p>` : ''}
        </div>
        <div class="tinder-controles" style="margin-top:20px;">
            <button class="btn-interaccion btn-no" ${estaDeshabilitado ? 'disabled' : ''} onclick="ejecutarInteraccionDetalle('${ev._id}', 'NO_INTERESA')">👎 No me interesa</button>
            <button class="btn-interaccion btn-interesa" ${estaDeshabilitado ? 'disabled' : ''} onclick="ejecutarInteraccionDetalle('${ev._id}', 'ME_INTERESA')">⭐ Me interesa</button>
            <button class="btn-interaccion btn-asistire" ${estaDeshabilitado ? 'disabled' : ''} onclick="ejecutarInteraccionDetalle('${ev._id}', 'ASISTIRE')">✅ Asistiré</button>
        </div>
        ${botonEditarHTML}
        ${botonBorrarHTML}
        ${estaDeshabilitado ? `<p style="text-align:center; font-size:0.8rem; color:var(--premium-gold); margin-top:10px; font-weight:bold;">⚠️ Inicia sesión para interactuar con este plan e ingresar al chat grupal.</p>` : ''}
    `;
    document.getElementById('modalDetalleEvento').style.display = 'block';
}

function abrirModalEditar(idEvento) {
    const ev = todosLosEventos.find(item => item._id === idEvento);
    if (!ev) return;
    document.getElementById('editEventoId').value = ev._id;
    document.getElementById('editTitulo').value = ev.titulo;
    document.getElementById('editDescripcion').value = ev.descripcion;
    document.getElementById('editPrecio').value = ev.precio || 0;
    archivosMultimediaABorrar = [];
    const contenedorMedia = document.getElementById('contenedorEdicionMultimedia');
    contenedorMedia.innerHTML = '';
    if (ev.multimediaUrl) agregarItemEdicionMedia(ev.multimediaUrl, 'principal');
    if (ev.galeria && ev.galeria.length > 0) ev.galeria.forEach(url => agregarItemEdicionMedia(url, 'galeria'));
    if (contenedorMedia.innerHTML === '') contenedorMedia.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; padding:5px;">No hay archivos cargados en este evento.</p>';
    cerrarModalDetalle();
    document.getElementById('modalEditarEvento').style.display = 'block';
}

async function borrarEvento(idEvento) {
    if (!puedeGestionarEventos()) {
        alert('No tienes permisos para borrar eventos.');
        return;
    }
    if (!confirm('¿Seguro que quieres borrar este evento? Esta acción no se puede deshacer.')) {
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/eventos/${idEvento}`, {
            method: 'DELETE',
            headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo borrar el evento.');
            return;
        }
        cerrarModalDetalle();
        await cargarPortal();
        alert(data.mensaje || 'Evento borrado correctamente.');
    } catch (err) {
        console.error('Error borrando evento:', err);
        alert('No se pudo borrar el evento.');
    }
}

function agregarItemEdicionMedia(url, tipo) {
    const contenedorMedia = document.getElementById('contenedorEdicionMultimedia');
    const div = document.createElement('div');
    div.className = 'item-edicion-media';
    const esVideo = url.endsWith('.mp4') || url.endsWith('.mov');
    const elementoMedia = esVideo ? `<video src="${url}"></video>` : `<img src="${url}" alt="Preview">`;
    div.innerHTML = `${elementoMedia}<button type="button" class="btn-borrar-media" onclick="marcarMultimediaParaBorrar('${url}', '${tipo}', this)">&times;</button>`;
    contenedorMedia.appendChild(div);
}

function marcarMultimediaParaBorrar(url, tipo, boton) {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo multimedia?')) return;
    archivosMultimediaABorrar.push({ url, tipo });
    boton.parentElement.remove();
    const contenedorMedia = document.getElementById('contenedorEdicionMultimedia');
    if (contenedorMedia.children.length === 0) contenedorMedia.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; padding:5px;">No hay archivos cargados en este evento.</p>';
}

function cerrarModalEditar() { document.getElementById('modalEditarEvento').style.display = 'none'; }

async function handleFormEditarEvento(e) {
    e.preventDefault();
    const idEvento = document.getElementById('editEventoId').value;
    const formData = new FormData();
    formData.append('titulo', document.getElementById('editTitulo').value);
    formData.append('descripcion', document.getElementById('editDescripcion').value);
    formData.append('precio', document.getElementById('editPrecio').value);
    formData.append('eliminarMultimedia', JSON.stringify(archivosMultimediaABorrar));
    const files = document.getElementById('editGaleria').files;
    for (let i = 0; i < files.length; i++) formData.append('galeria', files[i]);
    const res = await fetch(`${API_BASE}/api/eventos/${idEvento}`, {
        method: 'PUT',
        headers: obtenerHeadersAutenticacion(),
        body: formData
    });
    if (res.ok) {
        cerrarModalEditar();
        await cargarPortal();
        alert('El evento ha sido modificado y actualizado correctamente.');
    } else {
        const errData = await res.json();
        alert('Error al actualizar: ' + errData.error);
    }
}

document.getElementById('formEditarEvento').onsubmit = handleFormEditarEvento;

function cerrarModalDetalle() { document.getElementById('modalDetalleEvento').style.display = 'none'; }
function abrirModalRedireccion() { document.getElementById('modalSolicitudPromotor').style.display = 'block'; }
function cerrarModalRedireccion() { document.getElementById('modalSolicitudPromotor').style.display = 'none'; }

function abrirModalPublicarEvento() {
    if (!usuarioConectado) {
        alert('Debes iniciar sesión como promotor para publicar eventos.');
        abrirModalAuth();
        return;
    }
    if (esSuperAdmin()) {
        abrirModal();
        return;
    }
    if (usuarioConectado.tipoUsuario !== 'PROMOTOR') {
        alert('Tu cuenta no está configurada como promotor. Cambia el tipo de usuario en tu perfil.');
        abrirModalEditarPerfil();
        return;
    }
    if (!usuarioConectado.promotorAprobado) {
        alert('Tu solicitud de promotor está pendiente de revisión. En cuanto sea aprobada podrás crear eventos.');
        return;
    }
    abrirModal();
}

function cerrarModalSolicitudPromotor() { document.getElementById('modalSolicitudPromotor').style.display = 'none'; }

async function ejecutarInteraccionDetalle(idEvento, accion, modoSocial = null, abrirConsentimiento = true) {
    if (!usuarioConectado) { alert('Debes iniciar sesión para interactuar.'); return; }
    if (accion === 'ASISTIRE' && abrirConsentimiento) {
        eventoPendienteChatConsent = idEvento;
        abrirModalChatConsent();
        return;
    }
    const modoSocialActivo = typeof modoSocial === 'boolean'
        ? modoSocial
        : document.getElementById('checkModoSocial').checked;
    try {
        const res = await fetch(`${API_BASE}/api/eventos/${idEvento}/interaccion`, {
            method: 'POST',
            headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ usuarioId: usuarioConectado.id || usuarioConectado._id, accion, modoSocial: modoSocialActivo })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('txtAlertaDinamica').innerText = data.mensaje || '¡Acción registrada!';
            const alerta = document.getElementById('alertaMatch');
            alerta.style.display = 'block';
            setTimeout(() => { alerta.style.display = 'none'; }, 4000);
            cerrarModalDetalle();
            await cargarDatosUsuario();
            if (accion === 'ASISTIRE' && data.chatHabilitado) {
                const ev = todosLosEventos.find(item => item._id === idEvento);
                abrirChatFlotante(idEvento, ev?.titulo || 'Evento');
            } else {
                cargarPortal();
            }
        } else {
            console.error('Error del servidor:', res.status, res.statusText);
            alert(`Error del servidor (${res.status}): ${data.error || 'Error desconocido'}`);
        }
    } catch (err) {
        console.error('Error de red:', err);
    }
}

function abrirModalChatConsent() {
    const modal = document.getElementById('modalChatConsent');
    if (modal) modal.style.display = 'block';
}

function cerrarModalChatConsent() {
    const modal = document.getElementById('modalChatConsent');
    if (modal) modal.style.display = 'none';
    eventoPendienteChatConsent = null;
}

function abrirModalPerfilMenu() {
    if (!usuarioConectado) {
        alert('Debes iniciar sesión para acceder a tu perfil.');
        abrirModalAuth();
        return;
    }
    redSocialVista = 'muro';
    perfilSeccionActual = 'favoritos';
    perfilFiltroActual = 'todos';
    const modal = document.getElementById('modalPerfilMenu');
    if (modal) modal.style.display = 'block';
    mostrarSeccionPerfil('favoritos');
}

function cerrarModalPerfilMenu() {
    const modal = document.getElementById('modalPerfilMenu');
    if (modal) modal.style.display = 'none';
}

function mostrarSeccionPerfil(seccion, filtro = 'todos') {
    perfilSeccionActual = seccion;
    perfilFiltroActual = filtro;
    const contenido = document.getElementById('contenidoPerfilMenu');
    if (!contenido) return;
    const user = usuarioConectado || {};
    const asistencias = (user.asistencias || []).map(String);
    const chatsActivos = (user.chatsActivos || []).map(String);
    const favoritos = (user.favoritos || []).map(String);
    const idsGuardados = Array.from(new Set([...asistencias, ...chatsActivos, ...favoritos]));
    const eventosGuardados = idsGuardados.map(id => todosLosEventos.find(ev => ev._id === id)).filter(Boolean);

    const valoraciones = user.valoraciones || [];
    const valoracionesPorEvento = valoraciones.reduce((acc, item) => {
        acc[item.eventoId] = item;
        return acc;
    }, {});

    const filtros = ['todos', 'premium', 'chat'];
    const filtrosMarkup = `
        <div class="perfil-filtros">
            ${filtros.map(f => `<div class="perfil-filtro-chip ${perfilFiltroActual === f ? 'activo' : ''}" onclick="mostrarSeccionPerfil('${seccion}', '${f}')">${f === 'todos' ? 'Todos' : f === 'premium' ? 'Premium' : 'Chat abierto'}</div>`).join('')}
        </div>`;

    const eventosFiltrados = filtrarEventosPerfil(eventosGuardados, filtro);

    if (seccion === 'editar') {
        contenido.innerHTML = `
            <div class="perfil-menu-seccion">
                <div class="perfil-menu-panel">
                    <h3>Datos de usuario</h3>
                    <p><strong>Nombre:</strong> ${user.nombre || 'Sin nombre'}</p>
                    <p><strong>Email:</strong> ${user.email || 'Sin email'}</p>
                    <p><strong>Semáforo:</strong> ${user.colorSemaforo || 'AMARILLO'}</p>
                    <p><strong>Descripción:</strong> ${user.descripcionPersonal || 'No has añadido una descripción todavía.'}</p>
                </div>
                <div class="perfil-menu-panel">
                    <h3>Resumen de interacción</h3>
                    <p><strong>Eventos que te gustan:</strong> ${favoritos.length}</p>
                    <p><strong>Eventos a los que asistirás:</strong> ${asistencias.length}</p>
                    <p><strong>Chats abiertos:</strong> ${chatsActivos.length}</p>
                    <button class="perfil-acciones-card" onclick="abrirModalEditarPerfil()">Editar perfil</button>
                </div>
            </div>`;
    } else if (seccion === 'social') {
        contenido.innerHTML = `
            <div class="perfil-menu-seccion">
                <div class="perfil-menu-panel">
                    <p style="color:var(--text-muted);">Cargando tu red social...</p>
                </div>
            </div>`;
        cargarRedSocial(redSocialBusqueda);
    } else if (seccion === 'chats') {
        const chatsActivosEventos = eventosGuardados.filter((ev) => chatsActivos.includes(ev._id));
        contenido.innerHTML = `
            <div class="perfil-menu-seccion">
                <div class="perfil-menu-panel">
                    <h3>Tus chats activos</h3>
                    <p style="color:var(--text-muted); margin-bottom: 14px;">Entra aquí para retomar cualquier conversación sin volver a pulsar “Asistiré”.</p>
                    ${chatsActivosEventos.length === 0 ? '<p style="color:var(--text-muted);">Todavía no tienes chats activos.</p>' : chatsActivosEventos.map(ev => `
                        <div class="perfil-menu-card">
                            <div>
                                <strong>${ev.titulo}</strong>
                                <p class="meta">${ev.ubicacion?.direccion || 'Ubicación no definida'}</p>
                                <p class="meta">${ev.fechaInicio ? new Date(ev.fechaInicio).toLocaleString() : 'Fecha no disponible'}</p>
                            </div>
                            <div class="perfil-acciones-card">
                                <button onclick="abrirChatFlotante('${ev._id}', '${ev.titulo.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">Entrar al chat</button>
                                <button onclick="abrirModalDetalle('${ev._id}')">Ver evento</button>
                            </div>
                        </div>`).join('')}
                </div>
            </div>`;
    } else if (seccion === 'favoritos') {
        contenido.innerHTML = `
            ${filtrosMarkup}
            <div class="perfil-menu-seccion">
                <div class="perfil-menu-panel">
                    <h3>Eventos que te gustan</h3>
                    ${eventosFiltrados.length === 0 ? '<p style="color:var(--text-muted);">No hay eventos en esta vista.</p>' : eventosFiltrados.map(ev => `
                        <div class="perfil-menu-card">
                            <div>
                                <strong>${ev.titulo}</strong>
                                <p class="meta">${ev.ubicacion?.direccion || 'Ubicación no definida'}</p>
                                <p class="meta">${ev.precio === 0 ? 'Gratis' : ev.precio + '€'}</p>
                            </div>
                            <div class="perfil-acciones-card">
                                <button onclick="abrirModalDetalle('${ev._id}')">Ver</button>
                            </div>
                        </div>`).join('')}
                </div>
            </div>`;
    } else if (seccion === 'asistidos') {
        contenido.innerHTML = `
            ${filtrosMarkup}
            <div class="perfil-menu-seccion">
                <div class="perfil-menu-panel">
                    <h3>Historial de asistencia</h3>
                    ${eventosFiltrados.length === 0 ? '<p style="color:var(--text-muted);">No tienes eventos confirmados en esta vista.</p>' : ordenarEventosPorFecha(eventosFiltrados).map(ev => `
                        <div class="perfil-historial-card">
                            <div>
                                <strong>${ev.titulo}</strong>
                                <p class="meta">${ev.ubicacion?.direccion || 'Ubicación no definida'}</p>
                                <p class="meta">${ev.fechaInicio ? new Date(ev.fechaInicio).toLocaleString() : 'Fecha no disponible'}</p>
                            </div>
                            <div class="perfil-acciones-card">
                                <button onclick="abrirChatFlotante('${ev._id}', '${ev.titulo.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">Abrir chat</button>
                                <button onclick="abrirModalDetalle('${ev._id}')">Ver</button>
                            </div>
                        </div>`).join('')}
                </div>
            </div>`;
    } else if (seccion === 'valoraciones') {
        const comentariosOrdenados = [...valoraciones].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
        contenido.innerHTML = `
            <div class="perfil-menu-seccion">
                <div class="perfil-menu-panel">
                    <h3>Valora tus eventos</h3>
                    ${eventosGuardados.length === 0 ? '<p style="color:var(--text-muted);">No hay eventos disponibles para valorar.</p>' : eventosGuardados.map(ev => {
                        const valoracion = valoracionesPorEvento[ev._id] || { estrellas: 0, comentario: '' };
                        return `
                            <div class="perfil-menu-card">
                                <div>
                                    <strong>${ev.titulo}</strong>
                                    <p class="meta">${ev.ubicacion?.direccion || 'Ubicación no definida'}</p>
                                    <div class="valoracion-estrellas" id="estrellas-${ev._id}">
                                        ${[1,2,3,4,5].map(n => `<button type="button" class="${valoracion.estrellas >= n ? 'activa' : ''}" onclick="setEstrellas('${ev._id}', ${n})">★</button>`).join('')}
                                    </div>
                                    <textarea id="comentario-${ev._id}" class="valoracion-comment" placeholder="Añade un comentario sobre este evento...">${valoracion.comentario || ''}</textarea>
                                </div>
                                <div class="perfil-acciones-card">
                                    <button class="valoracion-guardar" onclick="guardarValoracion('${ev._id}')">Guardar valoración</button>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
                <div class="perfil-menu-panel">
                    <h3>Comentarios recientes</h3>
                    ${comentariosOrdenados.length === 0 ? '<p style="color:var(--text-muted);">Aún no has dejado comentarios.</p>' : comentariosOrdenados.map(item => {
                        const ev = todosLosEventos.find(evento => evento._id === item.eventoId);
                        return `
                            <div class="perfil-historial-card">
                                <strong>${ev ? ev.titulo : 'Evento eliminado'}</strong>
                                <p class="meta">${ev ? ev.ubicacion?.direccion || 'Ubicación no definida' : ''}</p>
                                <p class="meta">${item.comentario || 'Sin comentario'}</p>
                                <p class="meta">${item.estrellas} ★ • ${item.fecha ? new Date(item.fecha).toLocaleString() : 'Fecha no disponible'}</p>
                            </div>`;
                    }).join('')}
                </div>
            </div>`;
    } else if (seccion === 'historial') {
        contenido.innerHTML = `
            <div class="perfil-menu-seccion">
                <div class="perfil-menu-panel">
                    <h3>Historial completo</h3>
                    ${ordenarEventosPorFecha(eventosGuardados).length === 0 ? '<p style="color:var(--text-muted);">No tienes eventos en tu historial.</p>' : ordenarEventosPorFecha(eventosGuardados).map(ev => `
                        <div class="perfil-historial-card">
                            <div>
                                <strong>${ev.titulo}</strong>
                                <p class="meta">${ev.ubicacion?.direccion || 'Ubicación no definida'}</p>
                                <p class="meta">${ev.fechaInicio ? new Date(ev.fechaInicio).toLocaleString() : 'Fecha no disponible'}</p>
                                <p class="meta">${chatsActivos.includes(ev._id) ? 'Chat abierto' : favoritos.includes(ev._id) ? 'Favorito' : 'Asistido'}</p>
                            </div>
                            <div class="perfil-acciones-card">
                                <button onclick="abrirModalDetalle('${ev._id}')">Ver</button>
                            </div>
                        </div>`).join('')}
                </div>
            </div>`;
    }
}

function filtrarEventosPerfil(eventos, filtro) {
    if (filtro === 'premium') {
        return eventos.filter(ev => ev.esPremium);
    }
    if (filtro === 'chat') {
        return eventos.filter(ev => (usuarioConectado.chatsActivos || []).map(String).includes(ev._id));
    }
    return eventos;
}

function obtenerResumenSocialUsuario() {
    const user = usuarioConectado || {};
    return {
        seguidores: (user.seguidores || []).length,
        siguiendo: (user.siguiendo || []).length,
        amigos: (user.amigos || []).length,
        recibidas: (user.solicitudesAmistadRecibidas || []).length,
        enviadas: (user.solicitudesAmistadEnviadas || []).length,
        notificaciones: (user.notificacionesSociales || []).filter((item) => !item.leida).length
    };
}

async function cargarRedSocial(termino = redSocialBusqueda) {
    if (!usuarioConectado) return;
    redSocialBusqueda = termino || '';
    try {
        const query = redSocialBusqueda ? `?q=${encodeURIComponent(redSocialBusqueda)}` : '';
        const [resUsuarios, resNotificaciones, resMuro] = await Promise.all([
            fetch(`${API_BASE}/api/red-social/comunidad${query}`, { headers: obtenerHeadersAutenticacion() }),
            fetch(`${API_BASE}/api/red-social/notificaciones`, { headers: obtenerHeadersAutenticacion() }),
            fetch(`${API_BASE}/api/red-social/muro`, { headers: obtenerHeadersAutenticacion() })
        ]);

        if (resUsuarios.ok) {
            const dataUsuarios = await resUsuarios.json();
            redSocialUsuarios = dataUsuarios.usuarios || [];
        }
        if (resNotificaciones.ok) {
            const dataNotificaciones = await resNotificaciones.json();
            redSocialNotificaciones = dataNotificaciones.notificaciones || [];
        }
        if (resMuro.ok) {
            const dataMuro = await resMuro.json();
            redSocialMuro = dataMuro.muro || [];
        }
        actualizarBadgeNotificacionesSociales();

        if (perfilSeccionActual === 'social') {
            renderizarSeccionSocial();
        }
    } catch (err) {
        console.error('Error cargando la red social:', err);
    }
}

function renderizarSeccionSocial() {
    const contenido = document.getElementById('contenidoPerfilMenu');
    if (!contenido) return;
    const user = usuarioConectado || {};
    const resumen = obtenerResumenSocialUsuario();
    const comunidad = redSocialUsuarios || [];
    const notificaciones = redSocialNotificaciones.length > 0 ? redSocialNotificaciones : (user.notificacionesSociales || []);
    const muro = redSocialMuro || [];

    const renderMuro = muro.length === 0
        ? '<div class="social-empty-state"><strong>Tu muro está tranquilo.</strong><p>Cuando tú o tus amigos interactuéis con planes, aparecerán aquí.</p></div>'
        : muro.map((item) => {
            const avatar = item.actorFotos && item.actorFotos[0] ? item.actorFotos[0] : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
            const pillClass = item.tipo === 'evento' ? 'social-pill-evento' : item.tipo === 'amistad' ? 'social-pill-amistad' : 'social-pill-seguir';
            const avatarClass = obtenerClaseAvatarSemaforo(item.actorColorSemaforo || 'AMARILLO');
            return `
                <article class="social-story-card">
                    <div class="social-story-top">
                        <img src="${escaparHtml(avatar)}" alt="${escaparHtml(item.actorNombre)}" class="social-story-avatar ${avatarClass}">
                        <div>
                            <strong>${escaparHtml(item.actorNombre)}</strong>
                            <p>${escaparHtml(item.esPropia ? 'Tu actividad' : 'Actividad de un amigo')}</p>
                        </div>
                        <span class="social-story-time">${item.creado ? new Date(item.creado).toLocaleString() : ''}</span>
                    </div>
                    <div class="social-story-body">
                        <span class="social-story-badge ${pillClass}">${escaparHtml(item.titulo || 'Actividad')}</span>
                        <p>${escaparHtml(item.mensaje || '')}</p>
                    </div>
                    <div class="social-story-actions">
                        ${item.eventoId ? `<button type="button" onclick="abrirModalDetalle('${item.eventoId}')">Ver evento</button>` : ''}
                    </div>
                </article>`;
        }).join('');

    const renderPersonas = comunidad.length === 0
        ? '<div class="social-empty-state"><strong>No hay personas que mostrar.</strong><p>Busca por nombre, email o localidad para descubrir usuarios.</p></div>'
        : comunidad.map((usuario) => {
            const rel = usuario.relacion || {};
            const estadoEtiqueta = rel.esAmigo ? 'Amigo' : rel.solicitudRecibida ? 'Te pidió amistad' : rel.solicitudEnviada ? 'Solicitud enviada' : rel.sigue ? 'Siguiendo' : 'Disponible';
            const avatar = usuario.fotos && usuario.fotos[0] ? usuario.fotos[0] : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
            const avatarClass = obtenerClaseAvatarSemaforo(usuario.colorSemaforo || 'AMARILLO');
            const acciones = [];
            if (rel.esAmigo) {
                acciones.push(`<button type="button" onclick="accionRedSocial('${usuario.id}', 'dejar_amigo')">Dejar de ser amigo</button>`);
            } else if (rel.solicitudRecibida) {
                acciones.push(`<button type="button" onclick="accionRedSocial('${usuario.id}', 'aceptar_solicitud_amistad')">Aceptar amistad</button>`);
                acciones.push(`<button type="button" onclick="accionRedSocial('${usuario.id}', 'rechazar_solicitud_amistad')">Rechazar</button>`);
            } else if (rel.solicitudEnviada) {
                acciones.push(`<button type="button" onclick="accionRedSocial('${usuario.id}', 'cancelar_solicitud_amistad')">Cancelar solicitud</button>`);
            } else {
                acciones.push(`<button type="button" onclick="accionRedSocial('${usuario.id}', 'solicitar_amistad')">Solicitar amistad</button>`);
            }
            if (rel.sigue) {
                acciones.push(`<button type="button" onclick="accionRedSocial('${usuario.id}', 'dejar_de_seguir')">Dejar de seguir</button>`);
            } else {
                acciones.push(`<button type="button" onclick="accionRedSocial('${usuario.id}', 'seguir')">Seguir</button>`);
            }
            return `
                <article class="social-person-card">
                    <div class="social-person-main">
                        <img src="${escaparHtml(avatar)}" alt="${escaparHtml(usuario.nombre)}" class="social-person-avatar ${avatarClass}">
                        <div>
                            <strong>${escaparHtml(usuario.nombre)}</strong>
                            <p>${escaparHtml(usuario.email || '')}</p>
                            <p>${escaparHtml(usuario.localidad || 'Sin localidad')}</p>
                        </div>
                    </div>
                    <div class="social-person-meta">${escaparHtml(estadoEtiqueta)}</div>
                    <div class="perfil-acciones-card social-person-actions">
                        ${acciones.join('')}
                    </div>
                </article>`;
        }).join('');

    const renderAlertas = notificaciones.length === 0
        ? '<div class="social-empty-state"><strong>No hay alertas nuevas.</strong><p>Cuando haya movimiento en tu red, lo verás aquí.</p></div>'
        : notificaciones.map((item) => `
            <article class="social-notification-card ${item.leida ? 'read' : 'unread'}">
                <span class="social-notification-dot"></span>
                <div>
                    <strong>${escaparHtml(item.titulo || 'Notificación')}</strong>
                    <p>${escaparHtml(item.mensaje || '')}</p>
                    <small>${item.creado ? new Date(item.creado).toLocaleString() : ''}</small>
                </div>
            </article>`).join('');

    contenido.innerHTML = `
        <div class="social-shell">
            <div class="social-hero">
                <div>
                    <p class="social-kicker">Red social interna</p>
                    <h3>${redSocialVista === 'muro' ? 'Muro de actividad' : redSocialVista === 'comunidad' ? 'Descubre personas' : 'Alertas y notificaciones'}</h3>
                    <p>${redSocialVista === 'muro' ? 'Actividad reciente de tu red y tus planes.' : redSocialVista === 'comunidad' ? 'Busca personas, sigue intereses y crea amistades.' : 'Lo último que ha pasado en tu red.'}</p>
                </div>
                <div class="social-stats-grid">
                    <div class="social-stat-card"><strong>${resumen.amigos}</strong><span>Amigos</span></div>
                    <div class="social-stat-card"><strong>${resumen.siguiendo}</strong><span>Siguiendo</span></div>
                    <div class="social-stat-card"><strong>${resumen.seguidores}</strong><span>Seguidores</span></div>
                    <div class="social-stat-card"><strong>${resumen.notificaciones}</strong><span>No leídas</span></div>
                </div>
                <div class="social-tabs">
                    <button type="button" class="${redSocialVista === 'muro' ? 'active' : ''}" onclick="cambiarVistaSocial('muro')">Muro</button>
                    <button type="button" class="${redSocialVista === 'comunidad' ? 'active' : ''}" onclick="cambiarVistaSocial('comunidad')">Personas</button>
                    <button type="button" class="${redSocialVista === 'notificaciones' ? 'active' : ''}" onclick="cambiarVistaSocial('notificaciones')">Alertas</button>
                </div>
            </div>
            <div class="social-layout">
                <section class="social-main-panel">
                    ${redSocialVista === 'muro' ? `
                        <div class="social-feed-header">
                            <div>
                                <h4>Tu muro</h4>
                                <p>La actividad más reciente de tu red, en una vista tipo feed.</p>
                            </div>
                            <button type="button" onclick="cargarRedSocial(redSocialBusqueda)">Actualizar</button>
                        </div>
                        <div class="social-feed-list">${renderMuro}</div>` : ''}
                    ${redSocialVista === 'comunidad' ? `
                        <div class="social-feed-header">
                            <div>
                                <h4>Personas</h4>
                                <p>Conecta con usuarios que puedan coincidir contigo.</p>
                            </div>
                            <button type="button" onclick="cargarRedSocial(redSocialBusqueda)">Actualizar</button>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
                            <input id="busquedaRedSocial" type="search" placeholder="Buscar por nombre, email o localidad" value="${escaparHtml(redSocialBusqueda)}" style="flex:1; min-width:220px; padding:12px 14px; border-radius:12px; border:1px solid rgba(148,163,184,0.25); background:rgba(15,23,42,0.6); color:white;">
                            <button type="button" onclick="buscarRedSocial()" style="background:#4f46e5; color:white; border:none; border-radius:12px; padding:12px 16px; font-weight:700; cursor:pointer;">Buscar</button>
                            <button type="button" onclick="cargarRedSocial('')" style="background:rgba(255,255,255,0.08); color:white; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px 16px; font-weight:700; cursor:pointer;">Ver todos</button>
                        </div>
                        <div class="social-people-list">${renderPersonas}</div>` : ''}
                    ${redSocialVista === 'notificaciones' ? `
                        <div class="social-feed-header">
                            <div>
                                <h4>Alertas</h4>
                                <p>Lo que está pasando en tu red y en tus planes.</p>
                            </div>
                            <button type="button" onclick="marcarNotificacionesSocialLeidas()">Marcar todo leído</button>
                        </div>
                        <div class="social-notifications-list">${renderAlertas}</div>` : ''}
                </section>
                <aside class="social-side-panel">
                    <div class="perfil-menu-panel">
                        <h3>Acciones rápidas</h3>
                        <p style="color:var(--text-muted); margin-bottom:12px;">Elige un modo y entra directo al flujo que necesitas.</p>
                        <button type="button" class="social-side-button" onclick="cambiarVistaSocial('muro')">Abrir muro</button>
                        <button type="button" class="social-side-button" onclick="cambiarVistaSocial('comunidad')">Buscar personas</button>
                        <button type="button" class="social-side-button" onclick="cambiarVistaSocial('notificaciones')">Ver alertas</button>
                    </div>
                    <div class="perfil-menu-panel">
                        <h3>Resumen</h3>
                        <div class="social-mini-summary">
                            <span>Amigos <strong>${resumen.amigos}</strong></span>
                            <span>Seguidores <strong>${resumen.seguidores}</strong></span>
                            <span>Solicitudes <strong>${resumen.recibidas}</strong></span>
                            <span>No leídas <strong>${resumen.notificaciones}</strong></span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>`;
}

function cambiarVistaSocial(vista) {
    redSocialVista = vista;
    renderizarSeccionSocial();
    cargarRedSocial(redSocialBusqueda);
}

async function buscarRedSocial() {
    const input = document.getElementById('busquedaRedSocial');
    const termino = input ? input.value.trim() : '';
    await cargarRedSocial(termino);
}

async function accionRedSocial(objetivoId, accion) {
    if (!usuarioConectado) {
        abrirModalAuth();
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/red-social/accion`, {
            method: 'POST',
            headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ objetivoId, accion })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo completar la acción social.');
            return;
        }
        alert(data.mensaje || 'Acción social completada.');
        await cargarDatosUsuario();
        await cargarRedSocial(redSocialBusqueda);
    } catch (err) {
        console.error('Error aplicando acción social:', err);
        alert('No se pudo completar la acción social.');
    }
}

async function marcarNotificacionesSocialLeidas() {
    try {
        const res = await fetch(`${API_BASE}/api/red-social/notificaciones/marcar-leidas`, {
            method: 'POST',
            headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudieron marcar las notificaciones.');
            return;
        }
        redSocialNotificaciones = data.notificaciones || [];
        await cargarDatosUsuario();
        actualizarBadgeNotificacionesSociales();
        if (perfilSeccionActual === 'social') {
            renderizarSeccionSocial();
        }
    } catch (err) {
        console.error('Error marcando notificaciones sociales:', err);
    }
}

function ordenarEventosPorFecha(eventos) {
    return eventos.slice().sort((a, b) => {
        const fechaA = a.fechaInicio ? Date.parse(a.fechaInicio) : 0;
        const fechaB = b.fechaInicio ? Date.parse(b.fechaInicio) : 0;
        return fechaB - fechaA;
    });
}

function setEstrellas(eventoId, valor) {
    const wrapper = document.getElementById(`estrellas-${eventoId}`);
    if (!wrapper) return;
    wrapper.querySelectorAll('button').forEach((btn, index) => {
        btn.classList.toggle('activa', index < valor);
    });
    wrapper.dataset.valoracion = valor;
}

async function guardarValoracion(eventoId) {
    if (!usuarioConectado) return;
    const estrellaWrapper = document.getElementById(`estrellas-${eventoId}`);
    const comentarioInput = document.getElementById(`comentario-${eventoId}`);
    if (!estrellaWrapper || !comentarioInput) return;
    const estrellas = parseInt(estrellaWrapper.dataset.valoracion || '0', 10);
    const comentario = comentarioInput.value.trim();
    if (estrellas < 1) {
        alert('Selecciona al menos 1 estrella para valorar.');
        return;
    }
    try {
        const usuarioId = usuarioConectado.id || usuarioConectado._id;
        const res = await fetch(`${API_BASE}/api/usuarios/${usuarioId}/valoracion`, {
            method: 'PUT',
            headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ eventoId, estrellas, comentario })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo guardar la valoración.');
            return;
        }
        usuarioConectado.valoraciones = data.valoraciones || usuarioConectado.valoraciones || [];
        guardarSesionUsuario();
        alert('Tu valoración ha sido guardada.');
    } catch (err) {
        console.error('Error guardando valoracion:', err);
        alert('Error al guardar tu valoración.');
    }
}

async function confirmarAsistenciaChat(unirseChat) {
    const idEvento = eventoPendienteChatConsent;
    cerrarModalChatConsent();
    if (!idEvento) return;
    await ejecutarInteraccionDetalle(idEvento, 'ASISTIRE', unirseChat, false);
    eventoPendienteChatConsent = null;
}

async function cargarDatosUsuario() {
    if (!usuarioConectado || !(usuarioConectado.id || usuarioConectado._id)) return;
    try {
        const id = usuarioConectado.id || usuarioConectado._id;
        const res = await fetch(`${API_BASE}/api/usuarios/${id}`, {
            headers: obtenerHeadersAutenticacion()
        });
        if (!res.ok) return;
        const data = await res.json();
        usuarioConectado = {
            ...usuarioConectado,
            ...data.usuario,
            fotos: normalizarFotosUsuario(data?.usuario?.fotos || usuarioConectado?.fotos)
        };
        guardarSesionUsuario();
        gestionarIUUsuario();
        renderizarMisEventosGuardados();
        actualizarBadgeNotificacionesSociales();
        if (perfilSeccionActual === 'social') {
            await cargarRedSocial(redSocialBusqueda);
        }
    } catch (err) {
        console.error('Error cargando datos de usuario:', err);
    }
}

function renderizarMisEventosGuardados() {
    const contenedor = document.getElementById('misEventosContenedor');
    if (!contenedor) return;
    if (!usuarioConectado) {
        contenedor.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Inicia sesión para ver tus eventos guardados.</p>';
        return;
    }

    const asistencias = (usuarioConectado.asistencias || []).map(String);
    const chatsActivos = (usuarioConectado.chatsActivos || []).map(String);
    const favoritos = (usuarioConectado.favoritos || []).map(String);
    const ids = Array.from(new Set([...asistencias, ...chatsActivos, ...favoritos]));
    const eventosGuardados = ids.map(id => todosLosEventos.find(ev => ev._id === id)).filter(Boolean);

    if (eventosGuardados.length === 0) {
        contenedor.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Aún no tienes eventos guardados. Marca "Me interesa" o "Asistiré" para que aparezcan aquí.</p>';
        return;
    }

    contenedor.innerHTML = '';
    eventosGuardados.forEach(ev => {
        const esChat = chatsActivos.includes(ev._id);
        const esAsistire = asistencias.includes(ev._id);
        const esInteresa = favoritos.includes(ev._id);
        const estado = esChat ? 'Chat activo' : esAsistire ? 'Asistiré' : 'Me interesa';
        const claseTag = esChat ? 'asistire' : esAsistire ? 'asistire' : 'interesa';
        const tituloSeguro = ev.titulo.replace(/'/g, "\\'").replace(/\"/g, '&quot;');
        contenedor.innerHTML += `
            <div class="mis-evento-card">
                <strong>${ev.titulo}</strong>
                <span class="tag ${claseTag}">${estado}</span>
                <p class="estado">${ev.ubicacion?.direccion || 'Ubicación no definida'}</p>
                <div class="mis-evento-actions">
                    ${esChat ? `<button type="button" class="btn-interaccion btn-asistire" onclick="abrirChatFlotante('${ev._id}', '${tituloSeguro}')">Abrir chat</button>` : `<button type="button" class="btn-interaccion btn-secondary" onclick="abrirModalDetalle('${ev._id}')">Ver evento</button>`}
                </div>
            </div>`;
    });
}

function abrirModal() {
    if (!tieneAccesoPromotor()) {
        alert('Necesitas una cuenta de promotor aprobada para acceder a este formulario.');
        return;
    }
    document.getElementById('modalFormulario').style.display = 'block';
    setTimeout(() => {
        if (!mapModal) {
            mapModal = L.map('map').setView([41.14, 1.40], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapModal);
            document.getElementById('map').style.display = 'block';
            mapModal.invalidateSize();
            mapModal.on('click', function(e) {
                establecerCoordenadasFormulario(e.latlng.lat, e.latlng.lng);
            });
        }
    }, 200);
}

function configurarAutocompleteDireccionEvento() {
    const input = document.getElementById('inputBuscar');
    const contenedor = document.getElementById('direccionSugerenciasEvento');
    const hidden = document.getElementById('direccionEventoSeleccionada');
    const direccion = document.getElementById('direccion');
    if (!input || !contenedor || !hidden || !direccion) return;

    let temporizador = null;
    input.addEventListener('input', () => {
        hidden.value = '';
        direccion.value = '';
        contenedor.innerHTML = '';
        const query = input.value.trim();
        if (query.length < 3) return;

        clearTimeout(temporizador);
        temporizador = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) return;
                contenedor.innerHTML = data.map((item) => {
                    const payload = encodeURIComponent(JSON.stringify({
                        placeId: item.place_id,
                        displayName: item.display_name,
                        latitud: Number(item.lat),
                        longitud: Number(item.lon),
                        countryCode: String(item.address?.country_code || '').toUpperCase(),
                        countryName: item.address?.country || ''
                    }));
                    return `<button type="button" class="direccion-sugerencia" data-json="${payload}">${item.display_name}</button>`;
                }).join('');
                contenedor.querySelectorAll('.direccion-sugerencia').forEach((boton) => {
                    boton.addEventListener('click', () => {
                        const raw = boton.getAttribute('data-json') || '';
                        if (!raw) return;
                        const parsed = JSON.parse(decodeURIComponent(raw));
                        hidden.value = JSON.stringify(parsed);
                        direccion.value = parsed.displayName || '';
                        input.value = parsed.displayName || '';
                        contenedor.innerHTML = '';
                        mapModal.setView([parsed.latitud, parsed.longitud], 15);
                        establecerCoordenadasFormulario(parsed.latitud, parsed.longitud);
                    });
                });
            } catch (error) {
                console.error('Error autocompletando dirección del evento:', error);
            }
        }, 300);
    });
}

function establecerCoordenadasFormulario(lat, lng) {
    document.getElementById('latitud').value = lat;
    document.getElementById('longitud').value = lng;
    if (markerModal) {
        markerModal.setLatLng([lat, lng]);
    } else {
        markerModal = L.marker([lat, lng]).addTo(mapModal);
    }
}

async function buscarDireccion() {
    const input = document.getElementById('inputBuscar');
    if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
}

function cerrarModal() { document.getElementById('modalFormulario').style.display = 'none'; }
function abrirModalAuth() { document.getElementById('modalAuth').style.display = 'block'; }
function cerrarModalAuth() { document.getElementById('modalAuth').style.display = 'none'; }
function abrirModalVerificacionPromotor() { document.getElementById('modalVerificacionPromotor').style.display = 'block'; }
function cerrarModalVerificacionPromotor() { document.getElementById('modalVerificacionPromotor').style.display = 'none'; }

function obtenerUrlWhatsappPromotor() {
    const nombre = usuarioConectado?.nombre || 'Nuevo promotor';
    const email = usuarioConectado?.email || 'sin-email';
    const datos = usuarioConectado?.verificacionPromotor || {};
    const marca = datos.nombreComercial ? ` | Marca: ${datos.nombreComercial}` : '';
    const nif = datos.nifCif ? ` | NIF/CIF: ${datos.nifCif}` : '';
    const telefono = datos.telefonoProfesional ? ` | Tel: ${datos.telefonoProfesional}` : '';
    const mensaje = `Hola, soy ${nombre} (${email}) y acabo de completar mi perfil de promotor en Plandem. Quiero verificar mi cuenta.${marca}${nif}${telefono}`;
    return `https://wa.me/${WHATSAPP_PROMOTOR_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function abrirWhatsAppVerificacionPromotor() {
    window.open(obtenerUrlWhatsappPromotor(), '_blank');
}

function lanzarAvisoContactoPromotor() {
    alert('Tu perfil de promotor ha quedado guardado y está pendiente de verificación. Pulsa el botón para contactar por WhatsApp y agilizar la revisión.');
    abrirModalVerificacionPromotor();
}

function abrirModalEditarPerfil() {
    if (!usuarioConectado) {
        alert('Debes iniciar sesión para editar tu perfil.');
        return;
    }
    document.getElementById('perfilColorSemaforo').value = usuarioConectado.colorSemaforo || 'AMARILLO';
    document.getElementById('perfilDescripcion').value = usuarioConectado.descripcionPersonal || '';
    document.getElementById('perfilTipoUsuario').value = usuarioConectado.tipoUsuario || 'CLIENTE';
    inicializarSelectPaises('perfilPais', usuarioConectado.pais || 'ES');
    inicializarPlanesFormulario('perfil', usuarioConectado.preferenciasPlanes || []);
    const perfilDireccion = usuarioConectado.direccionResidencia || {};
    const inputDireccionPerfil = document.getElementById('perfilDireccionBusqueda');
    const hiddenDireccionPerfil = document.getElementById('perfilDireccionResidencia');
    if (inputDireccionPerfil) inputDireccionPerfil.value = perfilDireccion.displayName || '';
    if (hiddenDireccionPerfil && perfilDireccion.displayName) hiddenDireccionPerfil.value = JSON.stringify(perfilDireccion);
    const perfilPais = document.getElementById('perfilPais');
    if (perfilPais) perfilPais.required = !esPerfilPrivilegiadoSinRestricciones();
    if (inputDireccionPerfil) inputDireccionPerfil.required = !esPerfilPrivilegiadoSinRestricciones();
    const perfilSolicitud = document.getElementById('perfilSolicitudPromotor');
    if (usuarioConectado.tipoUsuario === 'PROMOTOR') {
        perfilSolicitud.style.display = 'block';
        perfilSolicitud.value = usuarioConectado.solicitudPromotor || '';
        rellenarVerificacionPromotorPerfil(usuarioConectado.verificacionPromotor || {});
    } else {
        perfilSolicitud.style.display = 'none';
        perfilSolicitud.value = '';
        rellenarVerificacionPromotorPerfil({});
    }
    if (usuarioConectado.fotos && usuarioConectado.fotos[0]) {
        document.getElementById('previewFoto').src = resolverUrlMedia(usuarioConectado.fotos[0]);
    }
    document.getElementById('modalEditarPerfil').style.display = 'block';
}

function cerrarModalEditarPerfil() { 
    document.getElementById('modalEditarPerfil').style.display = 'none'; 
}

async function handleFormEditarPerfil(e) {
    e.preventDefault();
    if (!usuarioConectado) {
        alert('Debes iniciar sesión para editar tu perfil.');
        return;
    }

    const colorSemaforo = document.getElementById('perfilColorSemaforo').value;
    const descripcion = document.getElementById('perfilDescripcion').value;
    const tipoUsuario = document.getElementById('perfilTipoUsuario').value;
    const pais = document.getElementById('perfilPais').value;
    const direccionResidencia = obtenerDireccionSeleccionadaFormulario('perfil');
    const preferenciasPlanes = obtenerPlanesSeleccionadosFormulario('perfil');
    const solicitudPromotor = document.getElementById('perfilSolicitudPromotor').value.trim();
    const verificacionPromotor = obtenerVerificacionPromotorDesdeFormulario('perfil');
    const fileInput = document.getElementById('inputFotoPerfil');
    const quiereSerPromotor = tipoUsuario === 'PROMOTOR';
    const esPrivilegiado = esPerfilPrivilegiadoSinRestricciones();

    if (!esPrivilegiado && !pais) {
        alert('Debes seleccionar tu país de residencia.');
        return;
    }
    if (!esPrivilegiado && !direccionResidencia) {
        alert('Debes seleccionar una dirección válida desde las sugerencias.');
        return;
    }
    if (!esPrivilegiado && preferenciasPlanes.length === 0) {
        alert('Selecciona al menos una preferencia de planes.');
        return;
    }

    if (!esPrivilegiado && quiereSerPromotor && !verificacionPromotorCompleta(verificacionPromotor)) {
        alert('Para activar perfil de promotor debes completar todos los datos de verificación y confirmar la declaración de veracidad.');
        return;
    }

    const formData = new FormData();
    formData.append('colorSemaforo', colorSemaforo);
    formData.append('descripcionPersonal', descripcion);
    formData.append('tipoUsuario', tipoUsuario);
    if (pais) formData.append('pais', pais);
    if (direccionResidencia) formData.append('direccionResidencia', JSON.stringify(direccionResidencia));
    if (preferenciasPlanes.length > 0) formData.append('preferenciasPlanes', JSON.stringify(preferenciasPlanes));
    if (quiereSerPromotor) {
        formData.append('solicitudPromotor', solicitudPromotor);
        formData.append('verificacionPromotor', JSON.stringify(verificacionPromotor));
        formData.append('promotorAprobado', false);
    } else {
        formData.append('promotorAprobado', false);
        formData.append('verificacionPromotor', JSON.stringify({}));
    }
    if (fileInput.files[0]) {
        formData.append('fotoPerfil', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_BASE}/api/usuarios/${usuarioConectado.id || usuarioConectado._id}`, {
            method: 'PUT',
            headers: obtenerHeadersAutenticacion(),
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            // Sincroniza el usuario desde backend para evitar estados parciales en cliente.
            usuarioConectado = {
                ...usuarioConectado,
                ...(data.usuario || {}),
                tipoUsuario: data?.usuario?.tipoUsuario || tipoUsuario,
                promotorAprobado: data?.usuario?.promotorAprobado || false,
                solicitudPromotor: data?.usuario?.solicitudPromotor || solicitudPromotor,
                verificacionPromotor: data?.usuario?.verificacionPromotor || (quiereSerPromotor ? verificacionPromotor : {}),
                colorSemaforo,
                descripcionPersonal: descripcion,
                pais: data?.usuario?.pais || pais,
                direccionResidencia: data?.usuario?.direccionResidencia || direccionResidencia,
                preferenciasPlanes: data?.usuario?.preferenciasPlanes || preferenciasPlanes
            };
            if (data.usuario.fotos && data.usuario.fotos[0]) {
                document.getElementById('previewFoto').src = resolverUrlMedia(data.usuario.fotos[0]);
            }
            guardarSesionUsuario();
            gestionarIUUsuario();
            if (fileInput.files[0] && !(data?.usuario?.fotos && data.usuario.fotos[0])) {
                await cargarDatosUsuario();
            }
            alert('✅ Perfil actualizado correctamente');
            cerrarModalEditarPerfil();
            if (quiereSerPromotor && !usuarioConectado.promotorAprobado) {
                lanzarAvisoContactoPromotor();
            }
        } else {
            alert('Error: ' + (data.error || 'No se pudo actualizar el perfil'));
        }
    } catch (err) {
        console.error('Error al actualizar perfil:', err);
        alert('Error de conexión al actualizar el perfil');
    }
}

document.getElementById('inputFotoPerfil').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('previewFoto').src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function cambiarPestanaAuth(tipo) {
    document.getElementById('formLogin').style.display = tipo === 'login' ? 'block' : 'none';
    document.getElementById('formRegistro').style.display = tipo === 'registro' ? 'block' : 'none';
    const formVerificar = document.getElementById('formVerificarEmail');
    if (formVerificar) {
        formVerificar.style.display = tipo === 'verificar' ? 'block' : 'none';
    }
    document.getElementById('btnTabLogin').style.background = tipo === 'login' ? '#4f46e5' : 'transparent';
    document.getElementById('btnTabRegistro').style.background = tipo === 'registro' ? '#4f46e5' : 'transparent';
    const btnTabVerificar = document.getElementById('btnTabVerificar');
    if (btnTabVerificar) {
        btnTabVerificar.style.display = (tipo === 'verificar' || emailPendienteVerificacion) ? 'block' : 'none';
        btnTabVerificar.style.background = tipo === 'verificar' ? '#4f46e5' : 'transparent';
    }
}

async function handleFormLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const res = await fetch(`${API_BASE}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
        usuarioConectado = data.usuario;
        tokenSesion = data.token || null;
        guardarSesionUsuario();
        gestionarIUUsuario();
        cerrarModalAuth();
        await cargarDatosUsuario();
        cargarPortal();
    } else {
        if (data.requiereVerificacionEmail) {
            emailPendienteVerificacion = data.email || email;
            const inputEmail = document.getElementById('verifEmail');
            if (inputEmail) inputEmail.value = emailPendienteVerificacion;
            alert('Tu cuenta aún no está verificada. Introduce el código que te enviamos por email.');
            cambiarPestanaAuth('verificar');
            return;
        }
        alert(data.error);
    }
}

async function handleFormVerificarEmail(e) {
    e.preventDefault();
    const email = document.getElementById('verifEmail').value.trim();
    const codigo = document.getElementById('verifCodigo').value.trim();
    if (!email || !codigo) {
        alert('Debes indicar email y código de verificación.');
        return;
    }

    const res = await fetch(`${API_BASE}/api/usuarios/verificar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo })
    });
    const data = await res.json();
    if (!res.ok) {
        alert(data.error || 'No se pudo verificar el email.');
        return;
    }

    emailPendienteVerificacion = '';
    document.getElementById('verifCodigo').value = '';
    alert('Email verificado correctamente. Ya puedes iniciar sesión.');
    cambiarPestanaAuth('login');
    document.getElementById('loginEmail').value = email;
}

async function reenviarCodigoVerificacionEmail() {
    const email = (document.getElementById('verifEmail').value || emailPendienteVerificacion || '').trim();
    if (!email) {
        alert('Indica tu email para reenviar el código.');
        return;
    }
    const res = await fetch(`${API_BASE}/api/usuarios/reenviar-verificacion-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
        alert(data.error || 'No se pudo reenviar el código.');
        return;
    }
    alert(data.mensaje || 'Código reenviado correctamente.');
}

function actualizarFormularioRegistroPromotor() {
    const tipo = document.getElementById('regTipoUsuario').value;
    const solicitud = document.getElementById('regSolicitudPromotor');
    const bloque = document.getElementById('bloqueVerificacionPromotorRegistro');
    if (tipo === 'PROMOTOR') {
        solicitud.style.display = 'block';
        solicitud.required = true;
        if (bloque) bloque.style.display = 'block';
        aplicarRequiredVerificacionPromotor('reg', true);
    } else {
        solicitud.style.display = 'none';
        solicitud.required = false;
        if (bloque) bloque.style.display = 'none';
        aplicarRequiredVerificacionPromotor('reg', false);
    }
}

function actualizarPerfilPromotor() {
    const tipo = document.getElementById('perfilTipoUsuario').value;
    const solicitud = document.getElementById('perfilSolicitudPromotor');
    const bloque = document.getElementById('bloqueVerificacionPromotorPerfil');
    if (tipo === 'PROMOTOR') {
        solicitud.style.display = 'block';
        solicitud.required = true;
        if (bloque) bloque.style.display = 'block';
        aplicarRequiredVerificacionPromotor('perfil', true);
    } else {
        solicitud.style.display = 'none';
        solicitud.required = false;
        if (bloque) bloque.style.display = 'none';
        aplicarRequiredVerificacionPromotor('perfil', false);
    }
}

document.getElementById('regTipoUsuario')?.addEventListener('change', actualizarFormularioRegistroPromotor);
document.getElementById('perfilTipoUsuario')?.addEventListener('change', actualizarPerfilPromotor);
document.getElementById('regTipoPromotorLegal')?.addEventListener('change', () => aplicarRequiredVerificacionPromotor('reg', true));
document.getElementById('perfilTipoPromotorLegal')?.addEventListener('change', () => aplicarRequiredVerificacionPromotor('perfil', true));
actualizarFormularioRegistroPromotor();
actualizarPerfilPromotor();

async function handleFormRegistro(e) {
    e.preventDefault();
    const fechaNacimiento = document.getElementById('regFechaNac').value;
    if (!fechaNacimiento) {
        alert('Debes indicar tu fecha de nacimiento.');
        return;
    }
    if (!esMayorDeEdad(fechaNacimiento)) {
        alert('Registro no permitido: Plandem es solo para mayores de 18 años.');
        return;
    }

    const tipoUsuario = document.getElementById('regTipoUsuario').value;
    const pais = document.getElementById('regPais').value;
    const direccionResidencia = obtenerDireccionSeleccionadaFormulario('reg');
    const preferenciasPlanes = obtenerPlanesSeleccionadosFormulario('reg');
    const solicitudPromotor = tipoUsuario === 'PROMOTOR' ? document.getElementById('regSolicitudPromotor').value.trim() : '';
    const verificacionPromotor = tipoUsuario === 'PROMOTOR' ? obtenerVerificacionPromotorDesdeFormulario('reg') : {};
    if (tipoUsuario === 'PROMOTOR' && !verificacionPromotorCompleta(verificacionPromotor)) {
        alert('Para crear cuenta de promotor debes completar todos los datos de verificación.');
        return;
    }
    if (!pais) {
        alert('Debes seleccionar un país válido.');
        return;
    }
    if (!direccionResidencia) {
        alert('Debes seleccionar una dirección válida desde las sugerencias.');
        return;
    }
    if (preferenciasPlanes.length === 0) {
        alert('Selecciona al menos una preferencia de planes.');
        return;
    }
    const bodyObj = {
        nombre: document.getElementById('regNombre').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        fechaNacimiento,
        nacionalidad: direccionResidencia.countryName || pais,
        localidad: direccionResidencia.displayName || '',
        pais,
        direccionResidencia,
        preferenciasPlanes,
        estadoCivil: document.getElementById('regEstadoCivil').value,
        tieneCoche: document.getElementById('regTieneCoche').value,
        tipoUsuario,
        solicitudPromotor,
        verificacionPromotor,
        colorSemaforo: document.getElementById('regSemaforo').value,
        descripcionPersonal: document.getElementById('regDescripcion').value
    };
    const res = await fetch(`${API_BASE}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
    });
    const data = await res.json();
    if (res.ok) {
        emailPendienteVerificacion = data.email || bodyObj.email;
        const inputEmailVerif = document.getElementById('verifEmail');
        if (inputEmailVerif) inputEmailVerif.value = emailPendienteVerificacion;
        const btnTabVerificar = document.getElementById('btnTabVerificar');
        if (btnTabVerificar) btnTabVerificar.style.display = 'block';
        if (tipoUsuario === 'PROMOTOR') {
            alert('¡Cuenta de promotor creada! Primero verifica tu email para activar el acceso. Después revisaremos manualmente tu perfil promotor.');
            usuarioConectado = {
                ...(usuarioConectado || {}),
                nombre: bodyObj.nombre,
                email: bodyObj.email,
                pais: bodyObj.pais,
                direccionResidencia: bodyObj.direccionResidencia,
                preferenciasPlanes: bodyObj.preferenciasPlanes,
                verificacionPromotor
            };
        } else {
            alert('¡Cuenta creada! Te enviamos un código al email para activar la cuenta.');
        }
        cambiarPestanaAuth('verificar');
    } else {
        alert(data.error);
    }
}

function gestionarIUUsuario() {
    if (!usuarioConectado) {
        document.getElementById('perfilUsuarioBox').style.display = 'none';
        document.getElementById('bannerRegistroPromocional').style.display = 'flex';
        document.getElementById('adminPromotorAlert').style.display = 'none';
        return;
    }
    document.getElementById('bannerRegistroPromocional').style.display = 'none';
    document.getElementById('perfilUsuarioBox').style.display = 'block';
    document.getElementById('lblNombreUsuario').innerText = usuarioConectado.nombre;
    const fotoPerfil = obtenerFotoPerfil(usuarioConectado);
    const claseAvatar = obtenerClaseAvatarSemaforo(usuarioConectado.colorSemaforo || 'AMARILLO');
    const { fotoCabecera, fotoBotonPerfil } = asegurarAvatarCabeceraPerfil();
    aplicarImagenPerfilEnElemento(fotoCabecera, usuarioConectado, fotoPerfil, claseAvatar);
    aplicarImagenPerfilEnElemento(fotoBotonPerfil, usuarioConectado, fotoPerfil, claseAvatar);
    const sem = document.getElementById('lblSemaforo');
    if (sem) {
        sem.style.display = 'none';
        sem.textContent = '';
    }

    const promotorStatus = document.getElementById('lblPromotorStatus');
    const btnContactoVerificacion = document.getElementById('btnContactarVerificacionPromotor');
    if (usuarioConectado.tipoUsuario === 'PROMOTOR') {
        promotorStatus.style.display = 'inline-block';
        promotorStatus.innerText = usuarioConectado.promotorAprobado ? 'PROMOTOR APROBADO' : 'PROMOTOR PENDIENTE';
        if (btnContactoVerificacion) {
            btnContactoVerificacion.style.display = usuarioConectado.promotorAprobado ? 'none' : 'inline-flex';
        }
    } else {
        promotorStatus.style.display = 'none';
        if (btnContactoVerificacion) btnContactoVerificacion.style.display = 'none';
    }

    if (esSuperAdmin()) {
        cargarSolicitudesPromotorPendientes();
    } else {
        document.getElementById('adminPromotorAlert').style.display = 'none';
    }

    actualizarBadgeNotificacionesSociales();
}

function guardarSesionUsuario() {
    if (!usuarioConectado || !tokenSesion) return;
    localStorage.setItem('usuarioConectado', JSON.stringify(usuarioConectado));
    localStorage.setItem('tokenSesion', tokenSesion);
}

async function cargarSolicitudesPromotorPendientes() {
    try {
        const adminId = usuarioConectado?.id || usuarioConectado?._id;
        const [resPendientes, resUsuarios] = await Promise.all([
            fetch(`${API_BASE}/api/usuarios/promotor-solicitudes`, { headers: obtenerHeadersAutenticacion({ 'x-admin-id': adminId }) }),
            fetch(`${API_BASE}/api/usuarios`, { headers: obtenerHeadersAutenticacion({ 'x-admin-id': adminId }) })
        ]);
        if (!resPendientes.ok) return;
        const dataPendientes = await resPendientes.json();
        const dataUsuarios = resUsuarios.ok ? await resUsuarios.json() : { usuarios: [] };
        const pendientes = dataPendientes.solicitudes || [];
        const usuarios = dataUsuarios.usuarios || [];
        const banner = document.getElementById('adminPromotorAlert');
        if (pendientes.length > 0) {
            banner.style.display = 'flex';
            banner.innerHTML = `🚨 Tienes ${pendientes.length} solicitud(es) de promotor pendientes. <button onclick="abrirModalSolicitudesPromotor()" style="background:rgba(255,255,255,0.12); color:white; border:none; border-radius:10px; padding:8px 12px; cursor:pointer;">Ver solicitudes</button>`;
        } else {
            banner.style.display = 'flex';
            banner.innerHTML = `✅ Sin solicitudes pendientes. <button onclick="abrirModalSolicitudesPromotor()" style="background:rgba(255,255,255,0.12); color:white; border:none; border-radius:10px; padding:8px 12px; cursor:pointer;">Abrir panel admin</button>`;
        }
        window.promotorSolicitudesPendientes = pendientes;
        window.adminUsuarios = usuarios;
    } catch (err) {
        console.error('Error cargando solicitudes de promotor:', err);
    }
}

function renderAdminUserCard(usuario) {
    const verif = usuario.verificacionPromotor || {};
    const tipo = verif.tipoPromotorLegal || 'No definido';
    const nif = verif.nifCif || 'No indicado';
    const contacto = verif.telefonoProfesional || 'Sin teléfono';
    const acceso = usuario.tipoUsuario === 'PROMOTOR' && usuario.promotorAprobado
        ? 'PROMOTOR ACTIVO'
        : usuario.tipoUsuario === 'PROMOTOR'
            ? 'PROMOTOR PENDIENTE'
            : 'CLIENTE';
    return `
        <div class="solicitud-card">
            <div><strong>${usuario.nombre}</strong> — ${usuario.email}</div>
            <div style="margin-top:8px; color:#cbd5e1; font-size:0.9rem;">
                <div><strong>Estado:</strong> ${acceso}</div>
                <div><strong>Tipo promotor:</strong> ${tipo}</div>
                <div><strong>NIF/CIF:</strong> ${nif}</div>
                <div><strong>Teléfono:</strong> ${contacto}</div>
                <div><strong>Solicitud:</strong> ${usuario.solicitudPromotor || 'Sin solicitud escrita'}</div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap: wrap; align-items:center; margin-top:10px;">
                <button onclick="cambiarAccesoPromotor('${usuario._id}', 'aprobar')" style="background:#10b981; color:white; border:none; border-radius:10px; padding:8px 12px; cursor:pointer;">Dar acceso promotor</button>
                <button onclick="cambiarAccesoPromotor('${usuario._id}', 'pendiente')" style="background:#f59e0b; color:#111827; border:none; border-radius:10px; padding:8px 12px; cursor:pointer;">Dejar pendiente</button>
                <button onclick="cambiarAccesoPromotor('${usuario._id}', 'denegar')" style="background:#ef4444; color:white; border:none; border-radius:10px; padding:8px 12px; cursor:pointer;">Denegar y pasar a cliente</button>
                <a href="${obtenerUrlWhatsappAdmin(usuario)}" target="_blank" style="background:#25d366; color:#052e16; border-radius:10px; padding:8px 12px; text-decoration:none; font-weight:700;">WhatsApp directo</a>
            </div>
        </div>
    `;
}

function obtenerUrlWhatsappAdmin(usuario) {
    const numeroLimpio = `34${WHATSAPP_PROMOTOR_NUMERO}`;
    const msg = `Hola ${usuario.nombre}, te escribimos desde Plandem sobre la verificación de tu perfil de promotor.`;
    return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(msg)}`;
}

function abrirModalSolicitudesPromotor() {
    if (!esSuperAdmin()) {
        alert('Solo el administrador puede abrir este panel.');
        return;
    }
    const solicitudes = window.promotorSolicitudesPendientes || [];
    const usuarios = window.adminUsuarios || [];
    const contenedor = document.getElementById('solicitudesPromotorContainer');
    if (!contenedor) return;
    const bloquePendientes = solicitudes.length === 0
        ? '<p style="color:var(--text-muted);">No hay solicitudes pendientes.</p>'
        : solicitudes.map(renderAdminUserCard).join('');
    const bloqueTodos = usuarios.length === 0
        ? '<p style="color:var(--text-muted);">No hay usuarios disponibles.</p>'
        : usuarios.map(renderAdminUserCard).join('');

    contenedor.innerHTML = `
        <h4 style="color:white; margin-bottom:8px;">Solicitudes pendientes</h4>
        ${bloquePendientes}
        <h4 style="color:white; margin:18px 0 8px;">Todos los usuarios (control total)</h4>
        ${bloqueTodos}
    `;
    document.getElementById('modalPromotorSolicitudes').style.display = 'block';
}

async function cambiarAccesoPromotor(usuarioId, accion) {
    try {
        let payload = {};
        if (accion === 'aprobar') {
            payload = { tipoUsuario: 'PROMOTOR', promotorAprobado: true };
        } else if (accion === 'pendiente') {
            payload = { tipoUsuario: 'PROMOTOR', promotorAprobado: false };
        } else if (accion === 'denegar') {
            payload = { tipoUsuario: 'CLIENTE', promotorAprobado: false, solicitudPromotor: '' };
        }
        const res = await fetch(`${API_BASE}/api/usuarios/${usuarioId}`, {
            method: 'PUT',
            headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            alert('No se pudo aplicar el cambio: ' + (data.error || 'Error desconocido'));
            return;
        }
        alert('Cambio aplicado correctamente.');
        await cargarSolicitudesPromotorPendientes();
        abrirModalSolicitudesPromotor();
    } catch (err) {
        console.error('Error actualizando permisos de promotor:', err);
        alert('Error al actualizar permisos.');
    }
}

async function crearPromotorDesdeAdmin(e) {
    e.preventDefault();
    if (!esSuperAdmin()) {
        alert('No tienes permisos para crear promotores manualmente.');
        return;
    }
    const nombre = document.getElementById('adminPromotorNombre').value.trim();
    const email = document.getElementById('adminPromotorEmail').value.trim();
    const password = document.getElementById('adminPromotorPassword').value.trim();
    const tipoPerfil = document.getElementById('adminPromotorTipoPerfil').value;
    const estado = document.getElementById('adminPromotorEstado').value;
    if (!nombre || !email || !password) {
        alert('Completa nombre, email y contraseña temporal.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/usuarios-promotor`, {
            method: 'POST',
            headers: obtenerHeadersAutenticacion({
                'Content-Type': 'application/json',
                'x-admin-id': usuarioConectado?.id || usuarioConectado?._id
            }),
            body: JSON.stringify({
                nombre,
                email,
                password,
                tipoPerfil,
                promotorAprobado: estado === 'aprobado'
            })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo crear el promotor manualmente.');
            return;
        }
        alert(tipoPerfil === 'MODERADOR' ? 'Moderador creado correctamente.' : 'Perfil de promotor creado correctamente.');
        document.getElementById('formCrearPromotorAdmin').reset();
        await cargarSolicitudesPromotorPendientes();
        abrirModalSolicitudesPromotor();
    } catch (err) {
        console.error('Error creando promotor manual:', err);
        alert('Error al crear el promotor manualmente.');
    }
}

function cargarSesionUsuario() {
    const storedUser = localStorage.getItem('usuarioConectado');
    const storedToken = localStorage.getItem('tokenSesion');
    tokenSesion = storedToken || null;
    if (!storedUser) {
        redSocialUsuarios = [];
        redSocialNotificaciones = [];
        redSocialBusqueda = '';
        gestionarIUUsuario();
        return;
    }
    if (!tokenSesion) {
        localStorage.removeItem('usuarioConectado');
        redSocialUsuarios = [];
        redSocialNotificaciones = [];
        redSocialBusqueda = '';
        gestionarIUUsuario();
        return;
    }
    try {
        usuarioConectado = JSON.parse(storedUser);
        if (usuarioConectado) {
            usuarioConectado.fotos = normalizarFotosUsuario(usuarioConectado.fotos);
        }
    } catch (err) {
        console.error('Error cargando la sesión del usuario:', err);
        usuarioConectado = null;
    }
    gestionarIUUsuario();
    if (usuarioConectado && (usuarioConectado.id || usuarioConectado._id)) {
        cargarDatosUsuario();
    }
}

function cerrarSesion() {
    usuarioConectado = null;
    tokenSesion = null;
    redSocialUsuarios = [];
    redSocialNotificaciones = [];
    redSocialBusqueda = '';
    localStorage.removeItem('usuarioConectado');
    localStorage.removeItem('tokenSesion');
    gestionarIUUsuario();
    cargarPortal();
}

function usuarioPuedeModerarChat() {
    return esSuperAdmin() || esModerador();
}

function obtenerEstadoModeracionChatBase() {
    return {
        bloqueado: false,
        puedeModerar: false,
        silenciado: false,
        expulsado: false,
        avisosUsuario: [],
        muteados: [],
        expulsados: [],
        avisados: []
    };
}

function aplicarEstadoModeracionChat(idEvento, moderation = {}) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    chatInfo.moderation = {
        ...obtenerEstadoModeracionChatBase(),
        ...moderation,
        avisosUsuario: Array.isArray(moderation.avisosUsuario) ? moderation.avisosUsuario : [],
        muteados: Array.isArray(moderation.muteados) ? moderation.muteados : [],
        expulsados: Array.isArray(moderation.expulsados) ? moderation.expulsados : [],
        avisados: Array.isArray(moderation.avisados) ? moderation.avisados : []
    };
    renderizarPanelModeracionChat(idEvento);
    actualizarEstadoEntradaChat(idEvento);
}

function obtenerTextoRestriccionChat(moderation) {
    if (moderation.expulsado) return 'Has sido expulsado de este chat por el moderador.';
    if (moderation.silenciado) return 'Has sido silenciado en este chat. Puedes leer, pero no escribir.';
    if (moderation.bloqueado) return 'El chat está bloqueado temporalmente por moderación.';
    if (Array.isArray(moderation.avisosUsuario) && moderation.avisosUsuario.length > 0) {
        const ultimoAviso = moderation.avisosUsuario[moderation.avisosUsuario.length - 1];
        return `Aviso del moderador: ${ultimoAviso.motivo || 'Revisa tu comportamiento en el chat.'}`;
    }
    return '';
}

function actualizarEstadoEntradaChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    const moderation = chatInfo.moderation || obtenerEstadoModeracionChatBase();
    const bloqueadoParaUsuario = !usuarioPuedeModerarChat() && (moderation.bloqueado || moderation.silenciado || moderation.expulsado);
    chatInfo.input.disabled = bloqueadoParaUsuario;
    if (chatInfo.sendButton) chatInfo.sendButton.disabled = bloqueadoParaUsuario;
    chatInfo.input.placeholder = bloqueadoParaUsuario
        ? obtenerTextoRestriccionChat(moderation)
        : 'Escribe tu mensaje...';
    if (chatInfo.estadoModeracion) {
        const texto = obtenerTextoRestriccionChat(moderation);
        chatInfo.estadoModeracion.textContent = texto;
        chatInfo.estadoModeracion.style.display = texto ? 'block' : 'none';
    }
}

function togglePanelModeracionChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo || !chatInfo.adminPanel) return;
    const visible = chatInfo.adminPanel.style.display === 'block';
    chatInfo.adminPanel.style.display = visible ? 'none' : 'block';
}

function obtenerResumenUsuariosChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return [];
    const moderation = chatInfo.moderation || obtenerEstadoModeracionChatBase();
    const usuarios = new Map();
    const registrar = (usuarioId, autor) => {
        if (!usuarioId) return;
        const key = String(usuarioId);
        if (!usuarios.has(key)) {
            usuarios.set(key, {
                usuarioId: key,
                autor: autor || 'Usuario',
                silenciado: false,
                expulsado: false,
                avisos: 0,
                esActual: key === String(usuarioConectado?.id || usuarioConectado?._id || '')
            });
        }
    };

    (chatInfo.messages || []).forEach((mensaje) => registrar(mensaje.usuarioId, mensaje.autor));
    moderation.muteados.forEach((item) => registrar(item.usuarioId, item.autor));
    moderation.expulsados.forEach((item) => registrar(item.usuarioId, item.autor));
    moderation.avisados.forEach((item) => registrar(item.usuarioId, item.autor));

    moderation.muteados.forEach((item) => {
        const usuario = usuarios.get(String(item.usuarioId));
        if (usuario) usuario.silenciado = true;
    });
    moderation.expulsados.forEach((item) => {
        const usuario = usuarios.get(String(item.usuarioId));
        if (usuario) usuario.expulsado = true;
    });
    moderation.avisados.forEach((item) => {
        const usuario = usuarios.get(String(item.usuarioId));
        if (usuario) usuario.avisos += 1;
    });

    return Array.from(usuarios.values()).sort((a, b) => {
        if (a.expulsado !== b.expulsado) return a.expulsado ? -1 : 1;
        if (a.silenciado !== b.silenciado) return a.silenciado ? -1 : 1;
        return a.autor.localeCompare(b.autor, 'es', { sensitivity: 'base' });
    });
}

function seleccionarUsuarioModeracionChat(idEvento, usuarioId) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    chatInfo.selectedModerationUserId = String(usuarioId);
    renderizarPanelModeracionChat(idEvento);
}

function moderarUsuarioChat(idEvento, accion, usuarioId, autor = '') {
    return moderarChatEvento(idEvento, accion, { usuarioId, autor });
}

function avisarUsuarioChat(idEvento, usuarioId, autor = '') {
    return moderarChatEvento(idEvento, 'avisar_usuario', {
        usuarioId,
        autor,
        motivo: `Aviso de moderación para ${autor || 'este usuario'}.`
    });
}

function limpiarAvisosUsuarioChat(idEvento, usuarioId, autor = '') {
    return moderarChatEvento(idEvento, 'limpiar_avisos_usuario', { usuarioId, autor });
}

function borrarMensajesUsuarioChat(idEvento, usuarioId, autor = '') {
    return moderarChatEvento(idEvento, 'borrar_mensajes_usuario', { usuarioId, autor });
}

function borrarMensajeChat(idEvento, messageId) {
    return moderarChatEvento(idEvento, 'borrar_mensaje', { messageId });
}

function renderizarPanelModeracionChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo || !chatInfo.adminPanel || !usuarioPuedeModerarChat()) return;
    const moderation = chatInfo.moderation || obtenerEstadoModeracionChatBase();
    const escaparParametro = (valor = '') => String(valor).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const usuarios = obtenerResumenUsuariosChat(idEvento);
    if (!chatInfo.selectedModerationUserId && usuarios.length > 0) {
        const usuarioInicial = usuarios.find((item) => !item.esActual) || usuarios[0];
        chatInfo.selectedModerationUserId = usuarioInicial?.usuarioId || null;
    }
    const usuarioSeleccionado = usuarios.find((item) => item.usuarioId === chatInfo.selectedModerationUserId) || null;
    const listaUsuarios = usuarios.length === 0
        ? '<p class="chat-admin-empty">Aún no hay usuarios en este chat.</p>'
        : usuarios.map((item) => {
            const chips = [];
            if (item.expulsado) chips.push('EXPULSADO');
            if (item.silenciado) chips.push('SILENCIADO');
            if (item.avisos > 0) chips.push(`${item.avisos} AVISO${item.avisos > 1 ? 'S' : ''}`);
            if (item.esActual) chips.push('TÚ');
            return `
                <button type="button" class="chat-admin-user-item ${usuarioSeleccionado?.usuarioId === item.usuarioId ? 'active' : ''}" onclick="seleccionarUsuarioModeracionChat('${idEvento}', '${escaparParametro(item.usuarioId)}')">
                    <span>${item.autor}</span>
                    <span class="chat-admin-user-badges">${chips.map((chip) => `<span>${chip}</span>`).join('')}</span>
                </button>`;
        }).join('');

    let accionesUsuario = '<p class="chat-admin-empty">Selecciona un usuario para moderarlo.</p>';
    if (usuarioSeleccionado) {
        const autor = escaparParametro(usuarioSeleccionado.autor || 'Usuario');
        const usuarioId = escaparParametro(usuarioSeleccionado.usuarioId);
        accionesUsuario = `
            <div class="chat-admin-target-card">
                <div class="chat-admin-target-name">${usuarioSeleccionado.autor}</div>
                <div class="chat-admin-target-meta">${usuarioSeleccionado.avisos} aviso(s) registrados</div>
            </div>
            <div class="chat-admin-actions-grid">
                <button type="button" onclick="avisarUsuarioChat('${idEvento}', '${usuarioId}', '${autor}')">Dar aviso</button>
                <button type="button" onclick="limpiarAvisosUsuarioChat('${idEvento}', '${usuarioId}', '${autor}')">Limpiar avisos</button>
                ${usuarioSeleccionado.silenciado
                    ? `<button type="button" onclick="moderarUsuarioChat('${idEvento}', 'reactivar_usuario', '${usuarioId}', '${autor}')">Quitar silencio</button>`
                    : `<button type="button" onclick="moderarUsuarioChat('${idEvento}', 'silenciar_usuario', '${usuarioId}', '${autor}')">Silenciar</button>`}
                ${usuarioSeleccionado.expulsado
                    ? `<button type="button" onclick="moderarUsuarioChat('${idEvento}', 'readmitir_usuario', '${usuarioId}', '${autor}')">Readmitir</button>`
                    : `<button type="button" onclick="moderarUsuarioChat('${idEvento}', 'expulsar_usuario', '${usuarioId}', '${autor}')">Expulsar</button>`}
                <button type="button" onclick="borrarMensajesUsuarioChat('${idEvento}', '${usuarioId}', '${autor}')">Borrar sus mensajes</button>
            </div>`;
    }

    chatInfo.adminPanel.innerHTML = `
        <div class="chat-admin-panel-header">
            <strong>Moderación del chat</strong>
            <button type="button" onclick="moderarChatEvento('${idEvento}', '${moderation.bloqueado ? 'desbloquear_chat' : 'bloquear_chat'}')">${moderation.bloqueado ? 'Desbloquear chat' : 'Bloquear chat'}</button>
        </div>
        <div class="chat-admin-layout">
            <div class="chat-admin-panel-section">
                <div class="chat-admin-panel-title">Usuarios en el chat</div>
                <div class="chat-admin-user-list">${listaUsuarios}</div>
            </div>
            <div class="chat-admin-panel-section">
                <div class="chat-admin-panel-title">Acciones útiles</div>
                ${accionesUsuario}
            </div>
        </div>
    `;
}

async function moderarChatEvento(idEvento, accion, extra = {}) {
    if (!usuarioPuedeModerarChat()) {
        alert('Solo el superadmin puede moderar este chat.');
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/eventos/${idEvento}/chat/moderacion`, {
            method: 'POST',
            headers: obtenerHeadersAutenticacion({
                'Content-Type': 'application/json',
                'x-admin-id': usuarioConectado?.id || usuarioConectado?._id
            }),
            body: JSON.stringify({ accion, ...extra })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo aplicar la moderación.');
            return;
        }
        aplicarEstadoModeracionChat(idEvento, data.moderation || obtenerEstadoModeracionChatBase());
        const chatInfo = chatVentanasActivas[idEvento];
        if (chatInfo) chatInfo.messages = data.messages || [];
        renderizarMensajesChat(idEvento, data.messages || []);
    } catch (err) {
        console.error('Error moderando chat:', err);
        alert('Error al aplicar la moderación del chat.');
    }
}

function crearMensajeChatElement(idEvento, mensaje) {
    const esPropio = usuarioConectado && mensaje.usuarioId && (mensaje.usuarioId === (usuarioConectado.id || usuarioConectado._id));
    const wrapper = document.createElement('div');
    wrapper.className = `chat-message-wrapper${esPropio ? ' own' : ''}`;

    const avatar = document.createElement('img');
    avatar.className = 'chat-message-avatar';
    const autorFoto = mensaje.autorFoto || (esPropio
        ? obtenerFotoPerfil(usuarioConectado)
        : generarAvatarIniciales(mensaje.autor || 'Usuario', mensaje.colorSemaforo || 'AMARILLO'));
    const autorSemaforo = mensaje.colorSemaforo || (esPropio ? obtenerSemaforoNormalizado(usuarioConectado.colorSemaforo) : 'AMARILLO');
    avatar.src = autorFoto;
    avatar.classList.add(obtenerClaseAvatarSemaforo(autorSemaforo));
    avatar.alt = mensaje.autor || 'Avatar';

    const bubble = document.createElement('div');
    bubble.className = `chat-message${esPropio ? ' own' : ''}`;
    bubble.innerHTML = `<div class="text"><span class="author-inline">${mensaje.autor || 'Anónimo'}:</span>${mensaje.texto}</div>`;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    return wrapper;
}

function renderizarMensajesChat(idEvento, mensajes) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    chatInfo.mensajesContainer.innerHTML = '';
    mensajes.forEach((mensaje) => {
        chatInfo.mensajesContainer.appendChild(crearMensajeChatElement(idEvento, mensaje));
    });
    chatInfo.mensajesContainer.scrollTop = chatInfo.mensajesContainer.scrollHeight;
}

async function obtenerMensajesChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    try {
        const res = await fetch(`${API_BASE}/api/eventos/${idEvento}/chat`, {
            headers: usuarioConectado
                ? obtenerHeadersAutenticacion({ 'x-user-id': usuarioConectado.id || usuarioConectado._id })
                : {}
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (errData.error) alert(errData.error);
            console.error('Error cargando mensajes de chat:', res.statusText);
            return;
        }
        const data = await res.json();
        const mensajes = Array.isArray(data) ? data : (data.messages || []);
        if (!Array.isArray(data)) {
            aplicarEstadoModeracionChat(idEvento, data.moderation || obtenerEstadoModeracionChatBase());
        }
        chatInfo.messages = mensajes;
        renderizarMensajesChat(idEvento, mensajes);
    } catch (err) {
        console.error('Error de red al obtener chat:', err);
    }
}

async function enviarMensajeChat(e, idEvento) {
    e.preventDefault();
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;

    const texto = chatInfo.input.value.trim();
    if (!texto) return;
    if (!usuarioConectado) {
        alert('Debes iniciar sesión para enviar mensajes al chat.');
        abrirModalAuth();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/eventos/${idEvento}/chat`, {
            method: 'POST',
            headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                usuarioId: usuarioConectado.id || usuarioConectado._id,
                autor: usuarioConectado.nombre,
                texto
            })
        });
        const data = await res.json();
        if (!res.ok) {
            if (data && !Array.isArray(data)) {
                if (data.moderation) {
                    aplicarEstadoModeracionChat(idEvento, data.moderation || obtenerEstadoModeracionChatBase());
                }
                if (Array.isArray(data.messages)) {
                    chatInfo.messages = data.messages;
                    renderizarMensajesChat(idEvento, data.messages);
                }
            }
            alert(data.error || 'No se pudo enviar el mensaje.');
            return;
        }
        aplicarEstadoModeracionChat(idEvento, data.moderation || obtenerEstadoModeracionChatBase());
        chatInfo.messages = data.messages || data.chatMessages || [];
        renderizarMensajesChat(idEvento, data.messages || data.chatMessages || []);
        chatInfo.input.value = '';
    } catch (err) {
        console.error('Error al enviar mensaje del chat:', err);
    }
}

function toggleMinimizarChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    
    // Si está maximizado, restaurar a tamaño normal
    if (chatInfo.ventana.classList.contains('maximized')) {
        chatInfo.ventana.classList.remove('maximized');
    } else {
        // Si está en tamaño normal, minimizar
        chatInfo.ventana.classList.toggle('minimized');
    }
}

function maximizarChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    chatInfo.ventana.classList.add('maximized');
}

function cerrarChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    chatInfo.ventana.remove();
    delete chatVentanasActivas[idEvento];
}

function abrirChatFlotante(idEvento, tituloEvento) {
    if (!usuarioConectado) {
        abrirModalAuth();
        return;
    }
    if (chatVentanasActivas[idEvento]) {
        const chatInfo = chatVentanasActivas[idEvento];
        chatInfo.ventana.classList.remove('minimized');
        obtenerMensajesChat(idEvento);
        return;
    }

    const container = document.getElementById('chatWindowsContainer');
    if (!container) return;

    const ventana = document.createElement('div');
    ventana.className = 'chat-window';
    ventana.innerHTML = `
        <div class="chat-window-header">
            <div>
                <h4>Chat: ${tituloEvento || 'Evento'}</h4>
                <small>Chatea con otros asistentes</small>
            </div>
            <div style="display:flex; gap:8px;">
                ${usuarioPuedeModerarChat() ? `<button type="button" onclick="togglePanelModeracionChat('${idEvento}')">🛡</button>` : ''}
                <button type="button" onclick="maximizarChat('${idEvento}')">⬜</button>
                <button type="button" onclick="toggleMinimizarChat('${idEvento}')">_</button>
                <button type="button" onclick="cerrarChat('${idEvento}')">✕</button>
            </div>
        </div>
        <div class="chat-window-body">
            ${usuarioPuedeModerarChat() ? '<div class="chat-admin-panel" style="display:none;"></div>' : ''}
            <div class="chat-window-messages"></div>
            <div class="chat-window-footer">
                <form id="chatForm-${idEvento}">
                    <input type="text" placeholder="Escribe tu mensaje..." autocomplete="off" />
                    <button type="submit">Enviar</button>
                </form>
                <div class="chat-window-status" style="display:none;"></div>
            </div>
        </div>
    `;

    container.appendChild(ventana);

    const mensajesContainer = ventana.querySelector('.chat-window-messages');
    const form = ventana.querySelector(`#chatForm-${idEvento}`);
    const input = form.querySelector('input');
    const sendButton = form.querySelector('button');
    const adminPanel = ventana.querySelector('.chat-admin-panel');
    const estadoModeracion = ventana.querySelector('.chat-window-status');

    chatVentanasActivas[idEvento] = {
        ventana,
        mensajesContainer,
        input,
        sendButton,
        adminPanel,
        estadoModeracion,
        moderation: obtenerEstadoModeracionChatBase(),
        selectedModerationUserId: null,
        messages: []
    };

    form.addEventListener('submit', (event) => enviarMensajeChat(event, idEvento));

    obtenerMensajesChat(idEvento);
}

document.getElementById('formLogin').onsubmit = handleFormLogin;
document.getElementById('formRegistro').onsubmit = handleFormRegistro;
document.getElementById('formVerificarEmail')?.addEventListener('submit', handleFormVerificarEmail);
document.getElementById('btnReenviarCodigo')?.addEventListener('click', reenviarCodigoVerificacionEmail);
document.getElementById('formEditarPerfil').onsubmit = handleFormEditarPerfil;
document.getElementById('formSolicitudPromotor')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const mensaje = document.getElementById('solicitudMensajePromotor').value.trim();
    if (!mensaje) {
        alert('Describe brevemente tu solicitud de promotor.');
        return;
    }
    if (!usuarioConectado) {
        alert('Inicia sesión primero para enviar tu solicitud de promotor.');
        return;
    }
    if (!verificacionPromotorCompleta(usuarioConectado.verificacionPromotor || {})) {
        alert('Antes de solicitar revisión debes completar todos los datos de verificación de promotor en tu perfil.');
        cerrarModalSolicitudPromotor();
        abrirModalEditarPerfil();
        actualizarPerfilPromotor();
        return;
    }
    const res = await fetch(`${API_BASE}/api/usuarios/${usuarioConectado.id || usuarioConectado._id}`, {
        method: 'PUT',
        headers: obtenerHeadersAutenticacion({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            tipoUsuario: 'PROMOTOR',
            solicitudPromotor: mensaje,
            promotorAprobado: false,
            verificacionPromotor: usuarioConectado.verificacionPromotor || {}
        })
    });
    const data = await res.json();
    if (res.ok) {
        usuarioConectado.tipoUsuario = 'PROMOTOR';
        usuarioConectado.promotorAprobado = false;
        usuarioConectado.solicitudPromotor = mensaje;
        guardarSesionUsuario();
        gestionarIUUsuario();
        alert('Solicitud de promotor enviada. Nuestro equipo la revisará y te notificaremos.');
        cerrarModalSolicitudPromotor();
        lanzarAvisoContactoPromotor();
    } else {
        alert('Error al enviar la solicitud: ' + (data.error || 'Error desconocido'));
    }
});
document.getElementById('btnContactarVerificacionPromotor')?.addEventListener('click', lanzarAvisoContactoPromotor);
document.getElementById('btnAbrirWhatsappVerificacion')?.addEventListener('click', abrirWhatsAppVerificacionPromotor);
document.getElementById('formCrearPromotorAdmin')?.addEventListener('submit', crearPromotorDesdeAdmin);
document.getElementById('btnLogout')?.addEventListener('click', cerrarSesion);

document.getElementById('formEvento').onsubmit = async function(e) {
    e.preventDefault();
    if (!tieneAccesoPromotor()) {
        alert('Necesitas una cuenta de promotor aprobada para publicar eventos.');
        return;
    }
    try {
        const formData = new FormData();
        const precioInput = document.getElementById('precio');
        formData.append('titulo', document.getElementById('titulo').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('fechaInicio', document.getElementById('fechaInicio').value);
        formData.append('fechaFin', document.getElementById('fechaFin').value);
        formData.append('subtitulo', document.getElementById('subtitulo').value);
        formData.append('contactoEvento', document.getElementById('contactoEvento').value);
        formData.append('capacidad', document.getElementById('capacidad').value || 'No definida');
        formData.append('enlaceVenta', document.getElementById('enlaceVenta').value);
        formData.append('datosExtra', document.getElementById('datosExtra').value);
        formData.append('categoria', document.getElementById('categoria').value);
        formData.append('precio', precioInput?.value || 0);
        formData.append('organizador', document.getElementById('organizador').value);
        formData.append('esPremium', document.getElementById('esPremium').checked);
        const ubicacionSeleccionada = document.getElementById('direccionEventoSeleccionada').value;
        if (!ubicacionSeleccionada) {
            alert('Debes seleccionar una ubicación válida desde las sugerencias.');
            return;
        }
        const ubicacionObj = JSON.parse(ubicacionSeleccionada);
        formData.append('ubicacion', JSON.stringify(ubicacionObj));
        const fileFile = document.getElementById('multimedia').files[0];
        if (fileFile) formData.append('multimedia', fileFile);
        const galeria = document.getElementById('galeria').files;
        for (let i = 0; i < galeria.length; i++) {
            formData.append('galeria', galeria[i]);
        }
        const res = await fetch(`${API_BASE}/api/eventos`, {
            method: 'POST',
            headers: obtenerHeadersAutenticacion(),
            body: formData
        });
        if (res.ok) {
            cerrarModal();
            cargarPortal();
            renderizarMisEventosGuardados();
            document.getElementById('formEvento').reset();
            if (markerModal) { mapModal.removeLayer(markerModal); markerModal = null; }
            return;
        }
        const errData = await res.json();
        alert('Error al guardar: ' + errData.error);
    } catch (error) {
        console.error('Error publicando evento:', error);
        alert('No se pudo publicar el evento. Revisa los campos y vuelve a intentarlo.');
    }
};

document.getElementById('formEditarEvento').onsubmit = handleFormEditarEvento;

window.onload = function() {
    inicializarSelectPaises('regPais', 'ES');
    inicializarSelectPaises('perfilPais', 'ES');
    inicializarPlanesFormulario('reg', []);
    inicializarPlanesFormulario('perfil', []);
    configurarAutocompleteDireccion('reg');
    configurarAutocompleteDireccion('perfil');
    configurarAutocompleteDireccionEvento();
    const fechaNacInput = document.getElementById('regFechaNac');
    if (fechaNacInput) {
        const hoy = new Date();
        hoy.setFullYear(hoy.getFullYear() - 18);
        fechaNacInput.max = hoy.toISOString().split('T')[0];
    }
    inicializarAccesosRapidosFranja();
    inicializarMapaGlobal();
    cargarSesionUsuario();
    cargarPortal();
};

async function limpiarTodosEventos() {
    if (!confirm('⚠️ ¡CUIDADO! Esto eliminará TODOS los eventos de la base de datos. ¿Estás seguro? Esta acción NO se puede deshacer.')) {
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/admin/limpiar-eventos`, {
            method: 'DELETE',
            headers: obtenerHeadersAutenticacion()
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert(`✅ ${data.mensaje}\n\nEventos eliminados: ${data.eventosEliminados}`);
            cargarPortal();
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        alert(`❌ Error de red: ${error.message}`);
        console.error(error);
    }
}
