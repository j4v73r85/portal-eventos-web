require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plandem';
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'jmv1985jmv@gmail.com').toLowerCase();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'Plandem?2026?Plandem?';
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==========================================
// ESQUEMAS DE BASE DE DATOS
// ==========================================

const EventoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, default: "Sin descripción disponible" },
    fechaInicio: { type: String, default: "" },
    fechaFin: { type: String, default: "" },
    categoria: { type: String, default: "Cultura y Ocio" },
    precio: { type: Number, default: 0 },
    organizador: { type: String, default: "Promotor Local" },
    esPremium: { type: Boolean, default: false },
    multimediaUrl: { type: String, default: "" },
    galeria: { type: [String], default: [] },
    afluenciaEnVivo: { type: Number, default: 0 },
    audiosEnVivo: [{
        usuario: String,
        audioUrl: String
    }],
    chatMessages: [{
        autor: { type: String, default: 'Anónimo' },
        usuarioId: { type: String },
        texto: { type: String, required: true },
        creado: { type: Date, default: Date.now }
    }],
    ubicacion: {
        direccion: { type: String, default: "Torredembarra" },
        coordenadas: { 
            latitud: { type: Number, default: 41.1444 }, 
            longitud: { type: Number, default: 1.3961 } 
        }
    }
}, { strict: false, timestamps: true });

const Evento = mongoose.model('Evento', EventoSchema);

const UsuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fechaNacimiento: { type: String, required: true },
    nacionalidad: String,
    localidad: String,
    estadoCivil: { type: String, default: "No especificado" },
    tieneCoche: { type: Boolean, default: false },
    tipoUsuario: { type: String, enum: ['CLIENTE', 'PROMOTOR'], default: 'CLIENTE' },
    esAdmin: { type: Boolean, default: false },
    promotorAprobado: { type: Boolean, default: false },
    solicitudPromotor: { type: String, default: '' },
    verificacionPromotor: {
        tipoPromotorLegal: { type: String, enum: ['EMPRESA', 'AUTONOMO', 'PARTICULAR'], default: 'EMPRESA' },
        nombreComercial: { type: String, default: '' },
        nifCif: { type: String, default: '' },
        cargo: { type: String, default: '' },
        telefonoProfesional: { type: String, default: '' },
        webRedSocial: { type: String, default: '' },
        ciudadesOperacion: { type: String, default: '' },
        tipoEventos: { type: String, default: '' },
        frecuenciaEventos: { type: String, default: '' },
        enlacePrueba: { type: String, default: '' },
        declaracionVeracidad: { type: Boolean, default: false }
    },
    musicaFavorita: [String],
    aficiones: [String],
    descripcionPersonal: String,
    fotos: { type: [String], default: ["https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"] },
    colorSemaforo: { type: String, enum: ['VERDE', 'AMARILLO', 'ROJO'], default: 'AMARILLO' },
    esPremium: { type: Boolean, default: false },
    favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evento' }],
    noInteresados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evento' }],
    chatsActivos: [String],
    asistencias: [String],
    valoraciones: [{
        eventoId: String,
        estrellas: Number,
        comentario: String
    }]
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', UsuarioSchema);

function esSuperadminEmail(email) {
    return (email || '').toLowerCase() === SUPERADMIN_EMAIL;
}

function serializarUsuario(usuario) {
    const esSuperadmin = usuario?.esAdmin === true && esSuperadminEmail(usuario.email);
    return {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        esAdmin: esSuperadmin,
        tipoUsuario: esSuperadmin ? 'PROMOTOR' : (usuario.tipoUsuario || 'CLIENTE'),
        promotorAprobado: esSuperadmin ? true : (usuario.promotorAprobado || false),
        solicitudPromotor: usuario.solicitudPromotor || '',
        verificacionPromotor: usuario.verificacionPromotor || {},
        esPremium: usuario.esPremium,
        colorSemaforo: usuario.colorSemaforo,
        descripcionPersonal: usuario.descripcionPersonal,
        fotos: usuario.fotos,
        favoritos: usuario.favoritos || [],
        asistencias: usuario.asistencias || [],
        chatsActivos: usuario.chatsActivos || [],
        valoraciones: usuario.valoraciones || []
    };
}

async function obtenerAdminValido(adminId) {
    if (!adminId) return null;
    const admin = await Usuario.findById(adminId).select('email esAdmin');
    if (!admin) return null;
    if (!admin.esAdmin) return null;
    if (!esSuperadminEmail(admin.email)) return null;
    return admin;
}

// Conexión a MongoDB y sincronización de índices
mongoose.connect(MONGODB_URI)
  .then(async () => {
      console.log('📦 Conectado con éxito a la base de datos de Plandem');
      try {
          await Evento.syncIndexes();
          await Usuario.syncIndexes();
          
          // Garantiza que el superadmin exista siempre y que la contraseña configurada sea válida.
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, salt);
          await Usuario.updateOne(
              { email: SUPERADMIN_EMAIL },
              {
                  $set: {
                      nombre: 'Plandem',
                      password: hashedPassword,
                      esAdmin: true,
                      esPremium: true,
                      tipoUsuario: 'PROMOTOR',
                      promotorAprobado: true
                  },
                  $setOnInsert: {
                      fechaNacimiento: '01/01/2000'
                  }
              },
              { upsert: true }
          );
          console.log(`✅ Superadmin sincronizado para ${SUPERADMIN_EMAIL}`);

          // Política de seguridad: solo el perfil superadmin configurado puede mantener esAdmin=true.
          await Usuario.updateMany(
              { email: { $ne: SUPERADMIN_EMAIL }, esAdmin: true },
              { $set: { esAdmin: false } }
          );
          await Usuario.updateOne(
              { email: SUPERADMIN_EMAIL },
              { $set: { esAdmin: true, tipoUsuario: 'PROMOTOR', promotorAprobado: true } }
          );
      } catch (e) { console.error('Error al inicializar datos:', e); }
  })
  .catch(err => console.error('❌ Error de conexión:', err));

// ==========================================
// ENDPOINTS
// ==========================================

app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'portal-eventos', timestamp: new Date().toISOString() });
});

app.get('/api/eventos', async (req, res) => {
    try {
        const eventos = await Evento.find();
        res.json(eventos);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios/promotor-solicitudes', async (req, res) => {
    try {
        const adminId = req.header('x-admin-id');
        const adminValido = await obtenerAdminValido(adminId);
        if (!adminValido) return res.status(403).json({ error: 'No autorizado para ver solicitudes.' });
        const solicitudes = await Usuario.find({ tipoUsuario: 'PROMOTOR', promotorAprobado: false }).select('-password');
        res.json({ solicitudes });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const adminId = req.header('x-admin-id');
        const adminValido = await obtenerAdminValido(adminId);
        if (!adminValido) return res.status(403).json({ error: 'No autorizado para ver usuarios.' });
        const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
        res.json({ usuarios });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findById(id).select('-password');
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.json({ usuario: serializarUsuario(usuario) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/eventos', upload.fields([{ name: 'multimedia', maxCount: 1 }, { name: 'galeria', maxCount: 10 }]), async (req, res) => {
    try {
        const { titulo, ubicacion } = req.body;
        const existe = await Evento.findOne({ titulo: titulo });
        if (existe) return res.status(409).json({ error: 'El evento ya existe.' });

        const datosEvento = { ...req.body };
        
        datosEvento.esPremium = req.body.esPremium === 'true' || req.body.esPremium === true;
        
        if (ubicacion) {
            if (typeof ubicacion === 'string') {
                datosEvento.ubicacion = JSON.parse(ubicacion);
            } else {
                datosEvento.ubicacion = ubicacion;
            }
        }
        
        if (req.files) {
            if (req.files.multimedia && req.files.multimedia[0]) {
                datosEvento.multimediaUrl = `/uploads/${req.files.multimedia[0].filename}`;
            }
            if (req.files.galeria) {
                datosEvento.galeria = req.files.galeria.map(file => `/uploads/${file.filename}`);
            }
        }

        const nuevoEvento = new Evento(datosEvento);
        await nuevoEvento.save();
        res.status(201).json(nuevoEvento);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/eventos/:id', upload.fields([{ name: 'multimedia', maxCount: 1 }, { name: 'galeria', maxCount: 10 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const { ubicacion } = req.body;
        const datosActualizados = { ...req.body };

        if (req.body.esPremium !== undefined) {
            datosActualizados.esPremium = req.body.esPremium === 'true' || req.body.esPremium === true;
        }

        if (ubicacion) {
            datosActualizados.ubicacion = typeof ubicacion === 'string' ? JSON.parse(ubicacion) : ubicacion;
        }

        if (req.files) {
            if (req.files['multimedia'] && req.files['multimedia'][0]) {
                datosActualizados.multimediaUrl = `/uploads/${req.files['multimedia'][0].filename}`;
            }
            if (req.files['galeria']) {
                const nuevasFotos = req.files['galeria'].map(file => `/uploads/${file.filename}`);
                datosActualizados.galeria = nuevasFotos;
            }
        }

        const eventoActualizado = await Evento.findByIdAndUpdate(id, datosActualizados, { new: true });
        if (!eventoActualizado) return res.status(404).json({ error: 'El evento no existe.' });

        res.json(eventoActualizado);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/eventos/:id/interaccion', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarioId, accion, modoSocial } = req.body;

        if (!usuarioId) return res.status(401).json({ error: "Debes estar registrado para interactuar." });

        let chatHabilitado = false;
        let mensaje = "";

        if (accion === 'ME_INTERESA') {
            await Usuario.findByIdAndUpdate(usuarioId, { $addToSet: { favoritos: id } });
            mensaje = "Guardado en tus favoritos";
        } 
        else if (accion === 'ASISTIRE') {
            await Usuario.findByIdAndUpdate(usuarioId, { $addToSet: { asistencias: id } });
            if (modoSocial) {
                await Usuario.findByIdAndUpdate(usuarioId, { $addToSet: { chatsActivos: id } });
                chatHabilitado = true;
                mensaje = "¡Asistencia confirmada! Grupo de chat del evento creado y conectado.";
            } else {
                mensaje = "Asistencia guardada. Activa el Modo Social para unirte al chat grupal.";
            }
        } 
        else if (accion === 'NO_INTERESA') {
            await Usuario.findByIdAndUpdate(usuarioId, { $addToSet: { noInteresados: id } });
            mensaje = "Evento descartado. No se mostrarán planes similares.";
        }

        res.json({ success: true, mensaje, chatHabilitado });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

const audioUpload = multer({ dest: 'uploads/' });
app.post('/api/eventos/:id/audio', audioUpload.single('audioBlobs'), async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario } = req.body;
        if (!req.file) return res.status(400).send('No se recibió audio.');

        const urlAudio = `/uploads/${req.file.filename}`;
        await Evento.findByIdAndUpdate(id, {
            $push: { audiosEnVivo: { usuario, audioUrl: urlAudio } }
        });
        res.status(201).json({ urlAudio });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/usuarios/registro', async (req, res) => {
    try {
        const { email, password, nombre, fechaNacimiento, localidad, nacionalidad, estadoCivil, tieneCoche, colorSemaforo, descripcionPersonal, tipoUsuario, solicitudPromotor, verificacionPromotor } = req.body;
        const usuarioExiste = await Usuario.findOne({ email });
        if (usuarioExiste) return res.status(400).json({ error: "El correo electrónico ya está registrado." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const esPromotor = tipoUsuario === 'PROMOTOR';
        const datosVerificacion = esPromotor ? {
            tipoPromotorLegal: verificacionPromotor?.tipoPromotorLegal || 'EMPRESA',
            nombreComercial: verificacionPromotor?.nombreComercial || '',
            nifCif: verificacionPromotor?.nifCif || '',
            cargo: verificacionPromotor?.cargo || '',
            telefonoProfesional: verificacionPromotor?.telefonoProfesional || '',
            webRedSocial: verificacionPromotor?.webRedSocial || '',
            ciudadesOperacion: verificacionPromotor?.ciudadesOperacion || '',
            tipoEventos: verificacionPromotor?.tipoEventos || '',
            frecuenciaEventos: verificacionPromotor?.frecuenciaEventos || '',
            enlacePrueba: verificacionPromotor?.enlacePrueba || '',
            declaracionVeracidad: verificacionPromotor?.declaracionVeracidad === true
        } : {
            tipoPromotorLegal: 'EMPRESA',
            nombreComercial: '',
            nifCif: '',
            cargo: '',
            telefonoProfesional: '',
            webRedSocial: '',
            ciudadesOperacion: '',
            tipoEventos: '',
            frecuenciaEventos: '',
            enlacePrueba: '',
            declaracionVeracidad: false
        };
        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password: hashedPassword,
            fechaNacimiento,
            localidad,
            nacionalidad,
            estadoCivil,
            tieneCoche: tieneCoche === 'true' || tieneCoche === true,
            colorSemaforo: colorSemaforo || 'AMARILLO',
            descripcionPersonal,
            tipoUsuario: esPromotor ? 'PROMOTOR' : 'CLIENTE',
            promotorAprobado: false,
            solicitudPromotor: esPromotor ? (solicitudPromotor || '') : '',
            verificacionPromotor: datosVerificacion
        });

        await nuevoUsuario.save();
        res.status(201).json({ mensaje: "Usuario registrado con éxito", usuarioId: nuevoUsuario._id });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/admin/usuarios-promotor', async (req, res) => {
    try {
        const adminId = req.header('x-admin-id');
        const adminValido = await obtenerAdminValido(adminId);
        if (!adminValido) return res.status(403).json({ error: 'No autorizado para crear promotores.' });

        const { nombre, email, password, promotorAprobado } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios para crear el promotor.' });
        }

        const usuarioExiste = await Usuario.findOne({ email });
        if (usuarioExiste) {
            return res.status(400).json({ error: 'Ya existe un usuario con ese email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoPromotor = await Usuario.create({
            nombre,
            email,
            password: hashedPassword,
            fechaNacimiento: '1990-01-01',
            tipoUsuario: 'PROMOTOR',
            promotorAprobado: promotorAprobado === true,
            solicitudPromotor: 'Creado manualmente por administrador.',
            verificacionPromotor: {
                tipoPromotorLegal: 'PARTICULAR',
                nombreComercial: nombre,
                nifCif: '',
                cargo: 'Promotor',
                telefonoProfesional: '',
                webRedSocial: '',
                ciudadesOperacion: '',
                tipoEventos: '',
                frecuenciaEventos: '',
                enlacePrueba: '',
                declaracionVeracidad: true
            }
        });

        res.status(201).json({
            success: true,
            mensaje: 'Promotor creado correctamente.',
            usuario: {
                id: nuevoPromotor._id,
                nombre: nuevoPromotor.nombre,
                email: nuevoPromotor.email,
                tipoUsuario: nuevoPromotor.tipoUsuario,
                promotorAprobado: nuevoPromotor.promotorAprobado
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/usuarios/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(404).json({ error: "El usuario no existe." });

        const passwordCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecto) return res.status(400).json({ error: "Contraseña incorrecta." });

        res.json({
            mensaje: "Login correcto",
            usuario: serializarUsuario(usuario)
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/eventos/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        const evento = await Evento.findById(id).select('chatMessages');
        if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });
        res.json(evento.chatMessages || []);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/eventos/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarioId, autor, texto } = req.body;

        if (!usuarioId) return res.status(401).json({ error: 'Debes estar autenticado para enviar mensajes.' });
        if (!texto || texto.trim().length === 0) return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });

        const evento = await Evento.findByIdAndUpdate(
            id,
            { $push: { chatMessages: { autor: autor || 'Anónimo', usuarioId, texto: texto.trim(), creado: new Date() } } },
            { new: true }
        );

        if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });
        res.json({ success: true, mensaje: 'Mensaje guardado correctamente.', chatMessages: evento.chatMessages });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/usuarios/:id', upload.single('fotoPerfil'), async (req, res) => {
    try {
        const { id } = req.params;
        const { colorSemaforo, descripcionPersonal, tipoUsuario, solicitudPromotor, promotorAprobado, verificacionPromotor, esAdmin } = req.body;

        const requesterId = req.header('x-user-id') || req.body.requesterId;
        const esMismoUsuario = requesterId && requesterId.toString() === id.toString();
        const adminValido = await obtenerAdminValido(requesterId);
        if (!esMismoUsuario && !adminValido) {
            return res.status(403).json({ error: 'No autorizado para editar este usuario.' });
        }

        const usuarioObjetivo = await Usuario.findById(id).select('email');
        if (!usuarioObjetivo) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const datosActualizados = {};
        if (colorSemaforo) datosActualizados.colorSemaforo = colorSemaforo;
        if (descripcionPersonal) datosActualizados.descripcionPersonal = descripcionPersonal;
        if (tipoUsuario) {
            if (!adminValido && !esMismoUsuario) return res.status(403).json({ error: 'No autorizado para cambiar tipo de usuario.' });
            datosActualizados.tipoUsuario = tipoUsuario;
        }
        if (solicitudPromotor !== undefined) datosActualizados.solicitudPromotor = solicitudPromotor;
        if (promotorAprobado !== undefined) {
            if (!adminValido) return res.status(403).json({ error: 'Solo el superadmin puede aprobar o denegar promotores.' });
            datosActualizados.promotorAprobado = promotorAprobado === 'true' || promotorAprobado === true;
        }
        if (esAdmin !== undefined) {
            if (!adminValido) return res.status(403).json({ error: 'Solo el superadmin puede editar privilegios admin.' });
            const targetIsSuperadminEmail = esSuperadminEmail(usuarioObjetivo.email);
            if (esAdmin === true || esAdmin === 'true') {
                if (!targetIsSuperadminEmail) return res.status(403).json({ error: 'El rol admin solo se permite al perfil superadmin configurado.' });
                datosActualizados.esAdmin = true;
            } else {
                datosActualizados.esAdmin = false;
            }
        }
        if (verificacionPromotor !== undefined) {
            datosActualizados.verificacionPromotor = typeof verificacionPromotor === 'string'
                ? JSON.parse(verificacionPromotor)
                : verificacionPromotor;
        }
        if (esSuperadminEmail(usuarioObjetivo.email)) {
            datosActualizados.esAdmin = true;
            datosActualizados.tipoUsuario = 'PROMOTOR';
            datosActualizados.promotorAprobado = true;
        }
        
        if (req.file) {
            const fotoUrl = `/uploads/${req.file.filename}`;
            datosActualizados.fotos = [fotoUrl];
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, datosActualizados, { new: true });
        if (!usuarioActualizado) return res.status(404).json({ error: 'Usuario no encontrado.' });

        res.json({ 
            success: true, 
            mensaje: 'Perfil actualizado correctamente.',
            usuario: serializarUsuario(usuarioActualizado)
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/usuarios/:id/valoracion', async (req, res) => {
    try {
        const { id } = req.params;
        const { eventoId, estrellas, comentario } = req.body;
        if (!eventoId) return res.status(400).json({ error: 'Falta el ID del evento.' });
        if (!estrellas || estrellas < 1 || estrellas > 5) return res.status(400).json({ error: 'Las estrellas deben estar entre 1 y 5.' });

        const usuario = await Usuario.findById(id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const index = usuario.valoraciones.findIndex(item => item.eventoId === eventoId);
        if (index >= 0) {
            usuario.valoraciones[index].estrellas = estrellas;
            usuario.valoraciones[index].comentario = comentario || '';
        } else {
            usuario.valoraciones.push({ eventoId, estrellas, comentario: comentario || '' });
        }

        await usuario.save();
        res.json({ success: true, mensaje: 'Valoración guardada.', valoraciones: usuario.valoraciones });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor levantado en puerto ${PORT}`);
});