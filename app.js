const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let mapGlobal, mapModal, markerModal;
let todosLosEventos = [];
let eventosPremiumTinder = [];
let tinderIndex = 0;
let mediaRecorder;
let audioChunks = [];
let maxAudioTimeout = null;
let usuarioConectado = null;
let archivosMultimediaABorrar = [];
let temporizadorCarrusel = null;
let temporizadorBarraProgreso = null;
let eventoPendienteChatConsent = null;
let perfilSeccionActual = 'favoritos';
let perfilFiltroActual = 'todos';
const TIEMPO_EXPOSICION = 15000;
const chatVentanasActivas = {};
const WHATSAPP_PROMOTOR_NUMERO = '34643435797';

function esSuperAdmin() {
    if (!usuarioConectado) return false;
    return usuarioConectado.esAdmin === true;
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

function inicializarMapaGlobal() {
    mapGlobal = L.map('mapaCalorGlobal').setView([41.14, 1.40], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapGlobal);
}

async function cargarPortal() {
    const res = await fetch(`${API_BASE}/api/eventos`);
    todosLosEventos = await res.json();
    eventosPremiumTinder = todosLosEventos.filter(ev => ev.esPremium === true);
    renderizarListaYMapa();
    renderizarMisEventosGuardados();
    activarModoTinder();
}

function renderizarListaYMapa() {
    const contenedor = document.getElementById('eventosContenedor');
    contenedor.innerHTML = '';
    mapGlobal.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) mapGlobal.removeLayer(layer);
    });
    const eventosNoPremium = todosLosEventos.filter(ev => !ev.esPremium);
    if (eventosNoPremium.length === 0) {
        contenedor.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No hay eventos generales disponibles.</p>';
    }
    todosLosEventos.forEach(ev => {
        if (ev.ubicacion?.coordenadas?.latitud) {
            const lat = ev.ubicacion.coordenadas.latitud;
            const lon = ev.ubicacion.coordenadas.longitud;
            const temperatura = Math.min(30 + (ev.afluenciaEnVivo || 0), 100);
            L.circleMarker([lat, lon], {
                radius: temperatura / 2,
                fillColor: ev.esPremium ? '#f59e0b' : '#3b82f6',
                color: ev.esPremium ? '#f59e0b' : '#3b82f6',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.35
            }).addTo(mapGlobal).bindPopup(`<b>${ev.titulo}</b><br>🔥 Actividad Live: ${ev.afluenciaEnVivo || 0} pts`);
        }
    });
    eventosNoPremium.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'card';
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
        let audiosHTML = '';
        if (ev.audiosEnVivo && ev.audiosEnVivo.length > 0) {
            ev.audiosEnVivo.forEach(aud => {
                audiosHTML += `
                    <div class="audio-item">
                        📢 <span>${aud.usuario}:</span>
                        <audio src="${aud.audioUrl}" controls style="height:24px; max-width:180px;"></audio>
                    </div>`;
            });
        } else {
            audiosHTML = '<p style="color:var(--text-muted); font-size:0.75rem;">Sin audios del ambiente aún.</p>';
        }
        const esOrganizador = usuarioConectado && usuarioConectado.nombre.trim().toLowerCase() === ev.organizador.trim().toLowerCase();
        const esSuperAdmin = usuarioConectado && (usuarioConectado.nombre.trim().toLowerCase() === 'plandem' || usuarioConectado.nombre.trim().toLowerCase() === 'tandem');
        const botonGrabarHTML = (esOrganizador || esSuperAdmin)
            ? `<button class="btn-record" id="recBtn-${ev._id}" onclick="alternarGrabacion('${ev._id}')">🎤 Grabar Ambiente ${esSuperAdmin ? '(SúperAdmin)' : ''}</button>`
            : `<span style="font-size:0.75rem; color:var(--premium-gold); cursor:pointer; font-weight:500;" onclick="abrirModalAuth()">¿Quieres escuchar el ambiente del evento? ¡Regístrate!</span>`;
        div.innerHTML = `
            ${imgPortadaHTML}
            <div class="contenido-card">
                <h3>${ev.titulo}</h3>
                <p style="font-size:0.85rem; color:var(--text-muted); margin:5px 0;">${urlify(ev.descripcion)}</p>
                <div class="audio-live-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:0.8rem; font-weight:bold; color:#10b981;">🎧 Ambiente en Vivo</span>
                        ${botonGrabarHTML}
                    </div>
                    <div class="lista-audios">${audiosHTML}</div>
                </div>
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
    const esSuperAdmin = usuarioConectado && (usuarioConectado.nombre.trim().toLowerCase() === 'plandem' || usuarioConectado.nombre.trim().toLowerCase() === 'tandem');
    let botonEditarHTML = '';
    if (esOrganizador || esSuperAdmin) {
        botonEditarHTML = `<button class="btn-interaccion" style="background:#4f46e5; margin-top: 15px; width: 100%; border-radius: 8px;" onclick="abrirModalEditar('${ev._id}')">📝 Editar Detalles y Multimedia</button>`;
    }
    contenedorModal.innerHTML = `
        <h2 style="color:white; margin-bottom:10px; font-size:1.6rem;">${ev.titulo}</h2>
        <span style="background:#4f46e5; font-size:0.75rem; padding:4px 10px; border-radius:8px; font-weight:bold; display:inline-block; margin-bottom:15px;">${ev.categoria}</span>
        <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.5; margin-bottom:15px;">${urlify(ev.descripcion)}</p>
        <h4 style="color:var(--premium-gold); margin-bottom:8px; font-size:0.9rem;">📸 Galería Multimedia y Videos:</h4>
        <div class="grid-galeria-detalles">${galeriaMediaHTML}</div>
        <div style="background:#0f172a; padding:12px; border-radius:10px; font-size:0.85rem; margin-bottom:20px; border: 1px solid #334155;">
            <p style="margin-bottom:4px;">🏢 <b>Organizador:</b> ${ev.organizador}</p>
            <p style="margin-bottom:4px;">📍 <b>Dirección Completa:</b> ${ev.ubicacion?.direccion || 'No especificada'}</p>
            <p>💵 <b>Precio Entrada:</b> <span style="color:#10b981; font-weight:bold;">${ev.precio === 0 ? 'Gratis' : ev.precio + '€'}</span></p>
        </div>
        <div class="tinder-controles" style="margin-top:20px;">
            <button class="btn-interaccion btn-no" ${estaDeshabilitado ? 'disabled' : ''} onclick="ejecutarInteraccionDetalle('${ev._id}', 'NO_INTERESA')">👎 No me interesa</button>
            <button class="btn-interaccion btn-interesa" ${estaDeshabilitado ? 'disabled' : ''} onclick="ejecutarInteraccionDetalle('${ev._id}', 'ME_INTERESA')">⭐ Me interesa</button>
            <button class="btn-interaccion btn-asistire" ${estaDeshabilitado ? 'disabled' : ''} onclick="ejecutarInteraccionDetalle('${ev._id}', 'ASISTIRE')">✅ Asistiré</button>
        </div>
        ${botonEditarHTML}
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
    const res = await fetch(`${API_BASE}/api/eventos/${idEvento}`, { method: 'PUT', body: formData });
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

async function ejecutarInteraccionDetalle(idEvento, accion, modoSocial = false, abrirConsentimiento = true) {
    if (!usuarioConectado) { alert('Debes iniciar sesión para interactuar.'); return; }
    if (accion === 'ASISTIRE' && abrirConsentimiento) {
        eventoPendienteChatConsent = idEvento;
        abrirModalChatConsent();
        return;
    }
    const modoSocialActivo = modoSocial || document.getElementById('checkModoSocial').checked;
    try {
        const res = await fetch(`${API_BASE}/api/eventos/${idEvento}/interaccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch(`${API_BASE}/api/usuarios/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        usuarioConectado = { ...usuarioConectado, ...data.usuario };
        guardarSesionUsuario();
        gestionarIUUsuario();
        renderizarMisEventosGuardados();
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
    const query = document.getElementById('inputBuscar').value;
    if (!query) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.length > 0) {
        const first = data[0];
        mapModal.setView([first.lat, first.lon], 15);
        establecerCoordenadasFormulario(first.lat, first.lon);
        document.getElementById('direccion').value = first.display_name;
    }
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
        document.getElementById('previewFoto').src = usuarioConectado.fotos[0];
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
    const solicitudPromotor = document.getElementById('perfilSolicitudPromotor').value.trim();
    const verificacionPromotor = obtenerVerificacionPromotorDesdeFormulario('perfil');
    const fileInput = document.getElementById('inputFotoPerfil');
    const quiereSerPromotor = tipoUsuario === 'PROMOTOR';

    if (quiereSerPromotor && !verificacionPromotorCompleta(verificacionPromotor)) {
        alert('Para activar perfil de promotor debes completar todos los datos de verificación y confirmar la declaración de veracidad.');
        return;
    }

    const formData = new FormData();
    formData.append('colorSemaforo', colorSemaforo);
    formData.append('descripcionPersonal', descripcion);
    formData.append('tipoUsuario', tipoUsuario);
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
            headers: { 'x-user-id': usuarioConectado.id || usuarioConectado._id },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            // Actualizar los datos del usuario en sesión
            usuarioConectado.tipoUsuario = data.usuario.tipoUsuario || tipoUsuario;
            usuarioConectado.promotorAprobado = data.usuario.promotorAprobado || false;
            usuarioConectado.solicitudPromotor = data.usuario.solicitudPromotor || solicitudPromotor;
            usuarioConectado.verificacionPromotor = data.usuario.verificacionPromotor || (quiereSerPromotor ? verificacionPromotor : {});
            usuarioConectado.colorSemaforo = colorSemaforo;
            usuarioConectado.descripcionPersonal = descripcion;
            if (data.usuario.fotos && data.usuario.fotos[0]) {
                usuarioConectado.fotos = data.usuario.fotos;
                document.getElementById('previewFoto').src = data.usuario.fotos[0];
            }
            guardarSesionUsuario();
            gestionarIUUsuario();
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
    document.getElementById('btnTabLogin').style.background = tipo === 'login' ? '#4f46e5' : 'transparent';
    document.getElementById('btnTabRegistro').style.background = tipo === 'registro' ? '#4f46e5' : 'transparent';
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
        guardarSesionUsuario();
        gestionarIUUsuario();
        cerrarModalAuth();
        await cargarDatosUsuario();
        cargarPortal();
    } else {
        alert(data.error);
    }
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
    const tipoUsuario = document.getElementById('regTipoUsuario').value;
    const solicitudPromotor = tipoUsuario === 'PROMOTOR' ? document.getElementById('regSolicitudPromotor').value.trim() : '';
    const verificacionPromotor = tipoUsuario === 'PROMOTOR' ? obtenerVerificacionPromotorDesdeFormulario('reg') : {};
    if (tipoUsuario === 'PROMOTOR' && !verificacionPromotorCompleta(verificacionPromotor)) {
        alert('Para crear cuenta de promotor debes completar todos los datos de verificación.');
        return;
    }
    const bodyObj = {
        nombre: document.getElementById('regNombre').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        fechaNacimiento: document.getElementById('regFechaNac').value,
        nacionalidad: document.getElementById('regNacionalidad').value,
        localidad: document.getElementById('regLocalidad').value,
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
        if (tipoUsuario === 'PROMOTOR') {
            alert('¡Cuenta de promotor creada! Tu perfil queda pendiente de verificación manual. Te abrimos el contacto de WhatsApp para validarlo.');
            usuarioConectado = {
                ...(usuarioConectado || {}),
                nombre: bodyObj.nombre,
                email: bodyObj.email,
                verificacionPromotor
            };
            abrirWhatsAppVerificacionPromotor();
        } else {
            alert('¡Cuenta creada correctamente! Ya puedes iniciar sesión.');
        }
        cambiarPestanaAuth('login');
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
    const sem = document.getElementById('lblSemaforo');
    sem.innerText = usuarioConectado.colorSemaforo || 'AMARILLO';
    if (usuarioConectado.colorSemaforo === 'VERDE') { sem.style.background = '#10b981'; sem.style.color = 'white'; }
    else if (usuarioConectado.colorSemaforo === 'ROJO') { sem.style.background = '#ef4444'; sem.style.color = 'white'; }
    else { sem.style.background = '#f59e0b'; sem.style.color = 'black'; }

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
}

function guardarSesionUsuario() {
    if (!usuarioConectado) return;
    localStorage.setItem('usuarioConectado', JSON.stringify(usuarioConectado));
}

async function cargarSolicitudesPromotorPendientes() {
    try {
        const adminId = usuarioConectado?.id || usuarioConectado?._id;
        const [resPendientes, resUsuarios] = await Promise.all([
            fetch(`${API_BASE}/api/usuarios/promotor-solicitudes`, { headers: { 'x-admin-id': adminId } }),
            fetch(`${API_BASE}/api/usuarios`, { headers: { 'x-admin-id': adminId } })
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
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': usuarioConectado?.id || usuarioConectado?._id
            },
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
    const estado = document.getElementById('adminPromotorEstado').value;
    if (!nombre || !email || !password) {
        alert('Completa nombre, email y contraseña temporal.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/usuarios-promotor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-id': usuarioConectado?.id || usuarioConectado?._id
            },
            body: JSON.stringify({
                nombre,
                email,
                password,
                promotorAprobado: estado === 'aprobado'
            })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo crear el promotor manualmente.');
            return;
        }
        alert('Perfil de promotor creado correctamente.');
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
    if (!storedUser) {
        gestionarIUUsuario();
        return;
    }
    try {
        usuarioConectado = JSON.parse(storedUser);
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
    localStorage.removeItem('usuarioConectado');
    gestionarIUUsuario();
    cargarPortal();
}

function usuarioPuedeModerarChat() {
    return esSuperAdmin();
}

function obtenerEstadoModeracionChatBase() {
    return {
        bloqueado: false,
        puedeModerar: false,
        silenciado: false,
        expulsado: false,
        muteados: [],
        expulsados: []
    };
}

function aplicarEstadoModeracionChat(idEvento, moderation = {}) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    chatInfo.moderation = {
        ...obtenerEstadoModeracionChatBase(),
        ...moderation,
        muteados: Array.isArray(moderation.muteados) ? moderation.muteados : [],
        expulsados: Array.isArray(moderation.expulsados) ? moderation.expulsados : []
    };
    renderizarPanelModeracionChat(idEvento);
    actualizarEstadoEntradaChat(idEvento);
}

function obtenerTextoRestriccionChat(moderation) {
    if (moderation.expulsado) return 'Has sido expulsado de este chat por el moderador.';
    if (moderation.silenciado) return 'Has sido silenciado en este chat. Puedes leer, pero no escribir.';
    if (moderation.bloqueado) return 'El chat está bloqueado temporalmente por moderación.';
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

function moderarUsuarioChat(idEvento, accion, usuarioId, autor = '') {
    return moderarChatEvento(idEvento, accion, { usuarioId, autor });
}

function borrarMensajeChat(idEvento, messageId) {
    return moderarChatEvento(idEvento, 'borrar_mensaje', { messageId });
}

function renderizarPanelModeracionChat(idEvento) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo || !chatInfo.adminPanel || !usuarioPuedeModerarChat()) return;
    const moderation = chatInfo.moderation || obtenerEstadoModeracionChatBase();
    const escaparParametro = (valor = '') => String(valor).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const muteados = moderation.muteados.length === 0
        ? '<p class="chat-admin-empty">Nadie silenciado.</p>'
        : moderation.muteados.map((item) => `
            <div class="chat-admin-user-row">
                <span>${item.autor || 'Usuario'}</span>
                <button type="button" onclick="moderarUsuarioChat('${idEvento}', 'reactivar_usuario', '${escaparParametro(item.usuarioId)}', '${escaparParametro(item.autor || 'Usuario')}')">Reactivar</button>
            </div>`).join('');
    const expulsados = moderation.expulsados.length === 0
        ? '<p class="chat-admin-empty">Nadie expulsado.</p>'
        : moderation.expulsados.map((item) => `
            <div class="chat-admin-user-row">
                <span>${item.autor || 'Usuario'}</span>
                <button type="button" onclick="moderarUsuarioChat('${idEvento}', 'readmitir_usuario', '${escaparParametro(item.usuarioId)}', '${escaparParametro(item.autor || 'Usuario')}')">Readmitir</button>
            </div>`).join('');

    chatInfo.adminPanel.innerHTML = `
        <div class="chat-admin-panel-header">
            <strong>Moderación</strong>
            <button type="button" onclick="moderarChatEvento('${idEvento}', '${moderation.bloqueado ? 'desbloquear_chat' : 'bloquear_chat'}')">${moderation.bloqueado ? 'Desbloquear chat' : 'Bloquear chat'}</button>
        </div>
        <div class="chat-admin-panel-section">
            <div class="chat-admin-panel-title">Usuarios silenciados</div>
            ${muteados}
        </div>
        <div class="chat-admin-panel-section">
            <div class="chat-admin-panel-title">Usuarios expulsados</div>
            ${expulsados}
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
            headers: {
                'Content-Type': 'application/json',
                'x-admin-id': usuarioConectado?.id || usuarioConectado?._id
            },
            body: JSON.stringify({ accion, ...extra })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo aplicar la moderación.');
            return;
        }
        aplicarEstadoModeracionChat(idEvento, data.moderation || obtenerEstadoModeracionChatBase());
        renderizarMensajesChat(idEvento, data.messages || []);
    } catch (err) {
        console.error('Error moderando chat:', err);
        alert('Error al aplicar la moderación del chat.');
    }
}

function toggleMenuModeracionMensaje(idEvento, messageId) {
    const chatInfo = chatVentanasActivas[idEvento];
    if (!chatInfo) return;
    chatInfo.ventana.querySelectorAll('.chat-admin-message-menu').forEach((menu) => {
        if (menu.dataset.messageId !== String(messageId)) menu.style.display = 'none';
    });
    const menu = chatInfo.ventana.querySelector(`.chat-admin-message-menu[data-message-id="${messageId}"]`);
    if (!menu) return;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function crearMensajeChatElement(idEvento, mensaje) {
    const esPropio = usuarioConectado && mensaje.usuarioId && (mensaje.usuarioId === (usuarioConectado.id || usuarioConectado._id));
    const autorSeguro = String(mensaje.autor || 'Usuario').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const usuarioIdSeguro = String(mensaje.usuarioId || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const mensajeIdSeguro = String(mensaje._id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const wrapper = document.createElement('div');
    wrapper.className = `chat-message-wrapper${esPropio ? ' own' : ''}`;

    const avatar = document.createElement('img');
    avatar.className = 'chat-message-avatar';
    avatar.src = esPropio
        ? (usuarioConectado.fotos && usuarioConectado.fotos[0] ? usuarioConectado.fotos[0] : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100')
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
    avatar.alt = mensaje.autor || 'Avatar';

    const bubble = document.createElement('div');
    bubble.className = `chat-message${esPropio ? ' own' : ''}`;
    bubble.innerHTML = `<div class="author">${mensaje.autor || 'Anónimo'}</div><div class="text">${mensaje.texto}</div>`;

    if (usuarioPuedeModerarChat() && mensaje.usuarioId) {
        const acciones = document.createElement('div');
        acciones.className = 'chat-admin-message-actions';
        acciones.innerHTML = `
            <button type="button" class="chat-admin-toggle" onclick="toggleMenuModeracionMensaje('${idEvento}', '${mensajeIdSeguro}')">⋯</button>
            <div class="chat-admin-message-menu" data-message-id="${mensajeIdSeguro}" style="display:none;">
                <button type="button" onclick="borrarMensajeChat('${idEvento}', '${mensajeIdSeguro}')">Borrar mensaje</button>
                <button type="button" onclick="moderarUsuarioChat('${idEvento}', 'silenciar_usuario', '${usuarioIdSeguro}', '${autorSeguro}')">Silenciar</button>
                <button type="button" onclick="moderarUsuarioChat('${idEvento}', 'expulsar_usuario', '${usuarioIdSeguro}', '${autorSeguro}')">Expulsar</button>
            </div>
        `;
        wrapper.appendChild(acciones);
    }

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
            headers: usuarioConectado ? { 'x-user-id': usuarioConectado.id || usuarioConectado._id } : {}
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: usuarioConectado.id || usuarioConectado._id,
                autor: usuarioConectado.nombre,
                texto
            })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'No se pudo enviar el mensaje.');
            return;
        }
        aplicarEstadoModeracionChat(idEvento, data.moderation || obtenerEstadoModeracionChatBase());
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
        moderation: obtenerEstadoModeracionChatBase()
    };

    form.addEventListener('submit', (event) => enviarMensajeChat(event, idEvento));

    obtenerMensajesChat(idEvento);
}

document.getElementById('formLogin').onsubmit = handleFormLogin;
document.getElementById('formRegistro').onsubmit = handleFormRegistro;
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
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': usuarioConectado.id || usuarioConectado._id
        },
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
        const ubicacionObj = {
            direccion: document.getElementById('direccion').value || document.getElementById('inputBuscar').value || 'Torredembarra, España',
            coordenadas: {
                latitud: parseFloat(document.getElementById('latitud').value) || 41.1444,
                longitud: parseFloat(document.getElementById('longitud').value) || 1.3961
            }
        };
        formData.append('ubicacion', JSON.stringify(ubicacionObj));
        const fileFile = document.getElementById('multimedia').files[0];
        if (fileFile) formData.append('multimedia', fileFile);
        const galeria = document.getElementById('galeria').files;
        for (let i = 0; i < galeria.length; i++) {
            formData.append('galeria', galeria[i]);
        }
        const res = await fetch(`${API_BASE}/api/eventos`, { method: 'POST', body: formData });
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
    inicializarMapaGlobal();
    cargarSesionUsuario();
    cargarPortal();
};
