require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plandem';
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'jmv1985jmv@gmail.com').toLowerCase();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean);
const OTP_EMAIL_ENABLED = process.env.OTP_EMAIL_ENABLED !== 'false';
const OTP_EXP_MINUTES = Number(process.env.OTP_EXP_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'no-reply@plandem.es';
const ALLOW_CONSOLE_OTP = process.env.ALLOW_CONSOLE_OTP === 'true' || process.env.NODE_ENV !== 'production';
const CLOUDINARY_URL = process.env.CLOUDINARY_URL || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'plandem/perfiles';
const CLOUDINARY_PROFILE_STORAGE_REQUIRED = process.env.CLOUDINARY_PROFILE_STORAGE_REQUIRED === 'true';
const CLOUDINARY_STORAGE_REQUIRED = process.env.CLOUDINARY_STORAGE_REQUIRED !== 'false';
const MIGRAR_UPLOADS_LEGACY_ON_START = process.env.MIGRAR_UPLOADS_LEGACY_ON_START !== 'false';
const IMPORTAR_EVENTOS_EN_STARTUP = process.env.IMPORTAR_EVENTOS_EN_STARTUP !== 'false';
const CLOUDINARY_CONFIGURADO = Boolean(
    CLOUDINARY_URL || (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
);
const PLAN_PREFERENCIAS_PERMITIDAS = [
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
const PAISES_PERMITIDOS = new Set([
    'ES', 'PT', 'FR', 'IT', 'AD', 'DE', 'GB', 'IE', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK',
    'US', 'CA', 'MX', 'AR', 'CO', 'PE', 'CL', 'UY', 'EC', 'BO', 'CR', 'PA', 'PR', 'VE', 'DO',
    'GT', 'SV', 'HN', 'NI', 'PY', 'BR', 'AU', 'NZ'
]);
const CHAT_TERMINOS_OFENSIVOS = new Set([
    'puta', 'puto', 'gilipollas', 'idiota', 'imbecil', 'mierda', 'joder',
    'cabron', 'maricon', 'hdp', 'subnormal', 'estupido', 'zorra',
    'pendejo', 'pendeja'
]);
const CHAT_FRASES_OFENSIVAS = ['hijo de puta'];
const CHAT_MOTIVO_AVISO_AUTOMATICO = 'Lenguaje ofensivo detectado y reportado automaticamente a administracion.';
const CHAT_MENSAJE_AVISO_USUARIO = 'Tu comentario ha sido reportado a administracion por lenguaje ofensivo. Si se repite, la propia administracion tomara represalias contra tu perfil.';

function validarConfiguracionProduccion() {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) return;

    const faltantes = [];
    if (!process.env.MONGODB_URI) faltantes.push('MONGODB_URI');
    if (!process.env.SUPERADMIN_EMAIL) faltantes.push('SUPERADMIN_EMAIL');
    if (!process.env.SUPERADMIN_PASSWORD) faltantes.push('SUPERADMIN_PASSWORD');
    if (!process.env.JWT_SECRET) faltantes.push('JWT_SECRET');
    if (!process.env.CORS_ORIGINS) faltantes.push('CORS_ORIGINS');

    if (OTP_EMAIL_ENABLED && !ALLOW_CONSOLE_OTP) {
        if (!SMTP_HOST) faltantes.push('SMTP_HOST');
        if (!SMTP_USER) faltantes.push('SMTP_USER');
        if (!SMTP_PASS) faltantes.push('SMTP_PASS');
        if (!SMTP_FROM) faltantes.push('SMTP_FROM');
    }

    if (CLOUDINARY_STORAGE_REQUIRED && !CLOUDINARY_CONFIGURADO) {
        faltantes.push('CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME+CLOUDINARY_API_KEY+CLOUDINARY_API_SECRET');
    }

    if (faltantes.length > 0) {
        console.warn(`⚠️ Configuracion incompleta en produccion. Faltan variables: ${faltantes.join(', ')}. El servidor seguirá iniciando para evitar caídas de despliegue.`);
    }
}

validarConfiguracionProduccion();

if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET no configurado. Se usa un secreto temporal para esta ejecución (las sesiones caducan al reiniciar).');
}
if (!SUPERADMIN_PASSWORD) {
    console.warn('⚠️ SUPERADMIN_PASSWORD no configurado. No se forzará contraseña por defecto del superadmin.');
}
if (OTP_EMAIL_ENABLED && !SMTP_HOST) {
    console.warn('⚠️ OTP_EMAIL_ENABLED activo sin SMTP_HOST. Configura SMTP para verificación por email.');
}
if (!CLOUDINARY_CONFIGURADO) {
    if (CLOUDINARY_STORAGE_REQUIRED) {
        console.error('❌ Cloudinary es obligatorio y no está configurado. Configura CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME+CLOUDINARY_API_KEY+CLOUDINARY_API_SECRET.');
        process.exit(1);
    } else {
        console.warn('⚠️ Cloudinary no configurado. Se usará MongoDB para persistir multimedia pública (perfil y eventos).');
    }
}

if (CLOUDINARY_CONFIGURADO) {
    if (CLOUDINARY_URL) {
        cloudinary.config(CLOUDINARY_URL);
    } else {
        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
            secure: true
        });
    }
}

app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://unpkg.com',
                'https://fonts.googleapis.com'
            ],
            imgSrc: [
                "'self'",
                'data:',
                'blob:',
                'https://images.unsplash.com',
                'https://res.cloudinary.com',
                'https://*.tile.openstreetmap.org',
                'https://*.basemaps.cartocdn.com',
                'https://unpkg.com'
            ],
            connectSrc: [
                "'self'",
                'https://api.cloudinary.com',
                'https://nominatim.openstreetmap.org',
                'https://*.tile.openstreetmap.org',
                'https://*.basemaps.cartocdn.com'
            ],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https:'],
            mediaSrc: ["'self'", 'data:', 'blob:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'self'"]
        }
    }
}));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || CORS_ORIGINS.length === 0 || CORS_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origen no permitido por CORS'));
    }
}));
app.use(express.json({ limit: '1mb' }));

app.use(express.static(__dirname, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const MIME_MEDIA_PERMITIDOS = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
]);
const MIME_AUDIO_PERMITIDOS = new Set([
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'audio/ogg'
]);

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 11
    },
    fileFilter: (req, file, cb) => {
        if (!MIME_MEDIA_PERMITIDOS.has(file.mimetype)) {
            return cb(new Error('Tipo de archivo no permitido.'));
        }
        cb(null, true);
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' }
});

const registerLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados registros desde esta IP. Inténtalo más tarde.' }
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos de verificación. Espera unos minutos.' }
});

const smtpConfigurado = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const mailTransporter = smtpConfigurado ? nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
}) : null;

function limpiarTexto(valor, maxLen = 200) {
    if (typeof valor !== 'string') return '';
    return valor.trim().slice(0, maxLen);
}

function normalizarTextoModeracion(valor = '') {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function detectarLenguajeOfensivo(texto = '') {
    const normalizado = normalizarTextoModeracion(texto);
    if (!normalizado) return [];

    const encontrados = new Set();
    const palabras = normalizado.split(/[^a-z0-9]+/).filter(Boolean);
    palabras.forEach((palabra) => {
        if (CHAT_TERMINOS_OFENSIVOS.has(palabra)) {
            encontrados.add(palabra);
        }
    });
    CHAT_FRASES_OFENSIVAS.forEach((frase) => {
        if (normalizado.includes(frase)) {
            encontrados.add(frase);
        }
    });
    return Array.from(encontrados);
}

function normalizarListaOpciones(lista = [], permitidas = []) {
    let listaProcesada = lista;
    if (typeof listaProcesada === 'string') {
        try {
            listaProcesada = JSON.parse(listaProcesada);
        } catch (error) {
            listaProcesada = listaProcesada.split(',').map((item) => item.trim()).filter(Boolean);
        }
    }
    const permitidasNormalizadas = new Set(permitidas.map((item) => String(item).toLowerCase()));
    return Array.from(new Set((Array.isArray(listaProcesada) ? listaProcesada : [])
        .map((item) => limpiarTexto(String(item), 80))
        .filter((item) => permitidasNormalizadas.has(item.toLowerCase()))));
}

function validarPaisCodigo(pais) {
    return PAISES_PERMITIDOS.has(String(pais || '').toUpperCase());
}

function normalizarDireccionSeleccionada(direccion, paisFallback = '') {
    if (!direccion) return null;

    let parsed = direccion;
    if (typeof direccion === 'string') {
        try {
            parsed = JSON.parse(direccion);
        } catch (error) {
            return null;
        }
    }

    const latitud = Number(parsed?.latitud);
    const longitud = Number(parsed?.longitud);
    const displayName = limpiarTexto(parsed?.displayName || parsed?.display_name || '', 260);
    const placeId = limpiarTexto(parsed?.placeId || parsed?.place_id || '', 64);
    const countryCode = limpiarTexto(parsed?.countryCode || parsed?.country_code || paisFallback || '', 4).toUpperCase();
    const countryName = limpiarTexto(parsed?.countryName || parsed?.country_name || '', 80);

    if (!placeId || !displayName || Number.isNaN(latitud) || Number.isNaN(longitud) || !validarPaisCodigo(countryCode)) {
        return null;
    }

    return {
        placeId,
        displayName,
        latitud,
        longitud,
        countryCode,
        countryName
    };
}

async function subirFotoPerfilRemota(rutaArchivo, usuarioId) {
    if (!CLOUDINARY_CONFIGURADO) {
        throw new Error('Cloudinary no configurado para almacenamiento remoto de fotos de perfil.');
    }
    const upload = await cloudinary.uploader.upload(rutaArchivo, {
        folder: CLOUDINARY_FOLDER,
        resource_type: 'image',
        public_id: `perfil-${usuarioId}-${Date.now()}`,
        overwrite: true,
        invalidate: true,
        transformation: [
            { width: 1080, height: 1080, crop: 'limit' },
            { fetch_format: 'auto' },
            { quality: 'auto:good' }
        ]
    });
    return upload.secure_url;
}

async function guardarArchivoPublicoEnMongo(archivo, { tipo = 'evento', usuarioId = null } = {}) {
    const contenido = await fs.promises.readFile(archivo.path);
    const nombreOriginal = limpiarTexto(archivo.originalname || '', 180);
    const mediaGuardada = await MediaPublica.create({
        tipo,
        mimeType: archivo.mimetype || 'application/octet-stream',
        nombreOriginal,
        tamanoBytes: Number(archivo.size || contenido.length || 0),
        usuarioId: usuarioId && mongoose.Types.ObjectId.isValid(String(usuarioId)) ? usuarioId : null,
        datos: contenido
    });
    const nombreSegmento = encodeURIComponent(nombreOriginal || 'archivo');
    return `/api/media/${mediaGuardada._id}/${nombreSegmento}`;
}

async function almacenarArchivoPublico(archivo, opciones = {}) {
    const {
        tipo = 'evento',
        usuarioId = null,
        cloudinaryFolder = CLOUDINARY_FOLDER,
        cloudinaryResourceType = 'auto',
        cloudinaryTransformations = [],
        removeSourceFile = true
    } = opciones;

    if (!archivo || !archivo.path) {
        throw new Error('Archivo inválido para almacenamiento público.');
    }

    try {
        if (!CLOUDINARY_CONFIGURADO && CLOUDINARY_STORAGE_REQUIRED) {
            throw new Error('Cloudinary es obligatorio para guardar archivos en este entorno. Configura CLOUDINARY_URL o credenciales Cloudinary.');
        }

        if (CLOUDINARY_CONFIGURADO) {
            try {
                const uploadResult = await cloudinary.uploader.upload(archivo.path, {
                    folder: cloudinaryFolder,
                    resource_type: cloudinaryResourceType,
                    transformation: cloudinaryTransformations
                });
                return uploadResult.secure_url;
            } catch (errorCloudinary) {
                if (CLOUDINARY_STORAGE_REQUIRED || (tipo === 'perfil' && CLOUDINARY_PROFILE_STORAGE_REQUIRED)) {
                    throw new Error('No se pudo guardar el archivo en Cloudinary. Revisa configuración y límites de tu cuenta.');
                }
            }
        }

        return await guardarArchivoPublicoEnMongo(archivo, { tipo, usuarioId });
    } finally {
        if (removeSourceFile) {
            fs.promises.unlink(archivo.path).catch(() => {});
        }
    }
}

const EXTENSION_A_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4'
};

function obtenerMimePorRutaArchivo(rutaArchivo = '') {
    const ext = path.extname(String(rutaArchivo || '')).toLowerCase();
    return EXTENSION_A_MIME[ext] || 'application/octet-stream';
}

async function migrarUrlLegacySiAplica(url, opciones = {}) {
    if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
        return { url, migrada: false, faltante: false };
    }

    const rutaRelativa = url.replace(/^\/+/, '');
    const rutaAbsoluta = path.join(__dirname, rutaRelativa);

    let statArchivo;
    try {
        statArchivo = await fs.promises.stat(rutaAbsoluta);
    } catch (error) {
        return { url, migrada: false, faltante: true };
    }

    if (!statArchivo.isFile()) {
        return { url, migrada: false, faltante: true };
    }

    const archivoLegacy = {
        path: rutaAbsoluta,
        mimetype: obtenerMimePorRutaArchivo(rutaAbsoluta),
        originalname: path.basename(rutaAbsoluta),
        size: statArchivo.size
    };

    const nuevaUrl = await almacenarArchivoPublico(archivoLegacy, {
        ...opciones,
        removeSourceFile: false
    });

    return { url: nuevaUrl, migrada: true, faltante: false };
}

async function migrarMultimediaLegacyUploads() {
    const resumen = {
        usuariosActualizados: 0,
        eventosActualizados: 0,
        urlsMigradas: 0,
        urlsFaltantes: 0,
        errores: 0
    };

    const usuarios = await Usuario.find({ fotos: { $elemMatch: { $regex: '^/uploads/' } } }).select('fotos');
    for (const usuario of usuarios) {
        let cambioUsuario = false;
        const nuevasFotos = [];

        for (const foto of (usuario.fotos || [])) {
            try {
                const resultado = await migrarUrlLegacySiAplica(foto, {
                    tipo: 'perfil',
                    usuarioId: usuario._id,
                    cloudinaryFolder: CLOUDINARY_FOLDER,
                    cloudinaryResourceType: 'image',
                    cloudinaryTransformations: [
                        { width: 1080, height: 1080, crop: 'limit' },
                        { fetch_format: 'auto' },
                        { quality: 'auto:good' }
                    ]
                });
                if (resultado.migrada) {
                    resumen.urlsMigradas += 1;
                    cambioUsuario = true;
                }
                if (resultado.faltante) resumen.urlsFaltantes += 1;
                nuevasFotos.push(resultado.url);
            } catch (error) {
                resumen.errores += 1;
                nuevasFotos.push(foto);
            }
        }

        if (cambioUsuario) {
            usuario.fotos = nuevasFotos;
            await usuario.save();
            resumen.usuariosActualizados += 1;
        }
    }

    const eventos = await Evento.find({
        $or: [
            { multimediaUrl: { $regex: '^/uploads/' } },
            { galeria: { $elemMatch: { $regex: '^/uploads/' } } },
            { 'audiosEnVivo.audioUrl': { $regex: '^/uploads/' } }
        ]
    }).select('multimediaUrl galeria audiosEnVivo');

    for (const evento of eventos) {
        let cambioEvento = false;

        if (evento.multimediaUrl) {
            try {
                const multimediaMigrada = await migrarUrlLegacySiAplica(evento.multimediaUrl, {
                    tipo: 'evento',
                    cloudinaryFolder: `${CLOUDINARY_FOLDER}/eventos`,
                    cloudinaryResourceType: 'auto'
                });
                if (multimediaMigrada.migrada) {
                    evento.multimediaUrl = multimediaMigrada.url;
                    resumen.urlsMigradas += 1;
                    cambioEvento = true;
                }
                if (multimediaMigrada.faltante) resumen.urlsFaltantes += 1;
            } catch (error) {
                resumen.errores += 1;
            }
        }

        if (Array.isArray(evento.galeria) && evento.galeria.length > 0) {
            const galeriaNueva = [];
            let cambioGaleria = false;
            for (const itemUrl of evento.galeria) {
                try {
                    const itemMigrado = await migrarUrlLegacySiAplica(itemUrl, {
                        tipo: 'galeria',
                        cloudinaryFolder: `${CLOUDINARY_FOLDER}/eventos/galeria`,
                        cloudinaryResourceType: 'auto'
                    });
                    if (itemMigrado.migrada) {
                        resumen.urlsMigradas += 1;
                        cambioGaleria = true;
                    }
                    if (itemMigrado.faltante) resumen.urlsFaltantes += 1;
                    galeriaNueva.push(itemMigrado.url);
                } catch (error) {
                    resumen.errores += 1;
                    galeriaNueva.push(itemUrl);
                }
            }
            if (cambioGaleria) {
                evento.galeria = galeriaNueva;
                cambioEvento = true;
            }
        }

        if (Array.isArray(evento.audiosEnVivo) && evento.audiosEnVivo.length > 0) {
            let cambioAudio = false;
            for (const audio of evento.audiosEnVivo) {
                try {
                    const audioMigrado = await migrarUrlLegacySiAplica(audio.audioUrl, {
                        tipo: 'audio',
                        cloudinaryFolder: `${CLOUDINARY_FOLDER}/eventos/audio`,
                        cloudinaryResourceType: 'auto'
                    });
                    if (audioMigrado.migrada) {
                        audio.audioUrl = audioMigrado.url;
                        resumen.urlsMigradas += 1;
                        cambioAudio = true;
                    }
                    if (audioMigrado.faltante) resumen.urlsFaltantes += 1;
                } catch (error) {
                    resumen.errores += 1;
                }
            }
            if (cambioAudio) cambioEvento = true;
        }

        if (cambioEvento) {
            await evento.save();
            resumen.eventosActualizados += 1;
        }
    }

    return resumen;
}

function normalizarUbicacionEvento(ubicacion) {
    const direccion = normalizarDireccionSeleccionada(ubicacion);
    if (!direccion) return null;
    return {
        direccion: direccion.displayName,
        coordenadas: {
            latitud: direccion.latitud,
            longitud: direccion.longitud
        },
        placeId: direccion.placeId,
        countryCode: direccion.countryCode,
        countryName: direccion.countryName
    };
}

function scoreEventoPorPreferencias(usuario, evento) {
    const preferencias = normalizarListaOpciones(usuario?.preferenciasPlanes || [], PLAN_PREFERENCIAS_PERMITIDAS);
    if (preferencias.length === 0) return 0;

    const textoEvento = `${limpiarTexto(evento?.categoria || '', 80)} ${limpiarTexto(evento?.titulo || '', 120)} ${limpiarTexto(evento?.descripcion || '', 400)}`.toLowerCase();
    let score = 0;

    preferencias.forEach((preferencia) => {
        const pref = preferencia.toLowerCase();
        if (textoEvento.includes(pref)) score += 5;

        const prefSinEspacios = pref.replace(/\s+/g, '');
        const eventoSinEspacios = textoEvento.replace(/\s+/g, '');
        if (prefSinEspacios && eventoSinEspacios.includes(prefSinEspacios)) score += 2;

        if ((pref.includes('musica') || pref.includes('música')) && textoEvento.includes('música')) score += 3;
        if (pref.includes('gastronomia') && (textoEvento.includes('comida') || textoEvento.includes('gastronom'))) score += 3;
    });

    return score;
}

function generarCodigoOTP() {
    const numero = crypto.randomInt(0, 1000000);
    return String(numero).padStart(6, '0');
}

function hashOTP(email, codigo) {
    return crypto
        .createHash('sha256')
        .update(`${(email || '').toLowerCase()}::${codigo}::${JWT_SECRET}`)
        .digest('hex');
}

function usuarioTieneVerificacionPendiente(usuario) {
    if (!usuario) return false;
    if (usuario.emailVerificado === true) return false;
    const expiraEn = usuario.verificacionEmail?.expiraEn;
    if (!expiraEn) return false;
    return new Date(expiraEn).getTime() > Date.now();
}

async function enviarCodigoVerificacionEmail(destinatario, codigo) {
    if (!OTP_EMAIL_ENABLED) {
        return;
    }
    if (mailTransporter) {
        await mailTransporter.sendMail({
            from: SMTP_FROM,
            to: destinatario,
            subject: 'Codigo de verificacion Plandem',
            text: `Tu codigo de verificacion es: ${codigo}. Caduca en ${OTP_EXP_MINUTES} minutos.`,
            html: `<p>Tu codigo de verificacion es:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${codigo}</p><p>Caduca en ${OTP_EXP_MINUTES} minutos.</p>`
        });
        return;
    }
    if (!ALLOW_CONSOLE_OTP) {
        throw new Error('Servicio SMTP no configurado para enviar OTP en producción.');
    }
    console.warn(`[OTP] SMTP no configurado. Codigo para ${destinatario}: ${codigo}`);
}

function obtenerIpCliente(req) {
    const xfwd = req.headers['x-forwarded-for'];
    if (Array.isArray(xfwd) && xfwd.length > 0) return String(xfwd[0]);
    if (typeof xfwd === 'string' && xfwd.length > 0) return xfwd.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || '';
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function passwordRobusta(password) {
    if (typeof password !== 'string') return false;
    if (password.length < 10 || password.length > 128) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSpecial;
}

function parsearFechaNacimiento(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const fecha = new Date(fechaNacimiento);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function esMayorDeEdad(fechaNacimiento, edadMinima = 18) {
    const fecha = parsearFechaNacimiento(fechaNacimiento);
    if (!fecha) return false;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
        edad -= 1;
    }
    return edad >= edadMinima;
}

function verificacionPromotorCompleta(verificacion = {}) {
    const tipoPromotorLegal = limpiarTexto(verificacion.tipoPromotorLegal || 'EMPRESA', 20);
    const requiereNif = tipoPromotorLegal !== 'PARTICULAR';
    return Boolean(
        tipoPromotorLegal &&
        limpiarTexto(verificacion.nombreComercial) &&
        (!requiereNif || limpiarTexto(verificacion.nifCif)) &&
        limpiarTexto(verificacion.cargo) &&
        limpiarTexto(verificacion.telefonoProfesional) &&
        limpiarTexto(verificacion.webRedSocial) &&
        limpiarTexto(verificacion.ciudadesOperacion) &&
        limpiarTexto(verificacion.tipoEventos) &&
        limpiarTexto(verificacion.frecuenciaEventos) &&
        limpiarTexto(verificacion.enlacePrueba) &&
        verificacion.declaracionVeracidad === true
    );
}

function crearTokenSesion(usuario) {
    if (!JWT_SECRET) return null;
    const role = usuario.esAdmin === true && esSuperadminEmail(usuario.email)
        ? 'superadmin'
        : (usuario.esModerador === true ? 'moderator' : 'user');
    return jwt.sign(
        {
            sub: String(usuario._id),
            email: usuario.email,
            role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function obtenerTokenDesdeHeader(req) {
    const authHeader = req.header('authorization') || '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
    return authHeader.slice(7).trim();
}

function esModeradorActivo(usuario) {
    return Boolean(usuario && usuario.esModerador === true && !esSuperadminEmail(usuario.email));
}

async function obtenerPermisoModeracion(usuarioId) {
    if (!usuarioId) return null;
    const usuario = await Usuario.findById(usuarioId).select('email esAdmin esModerador');
    if (!usuario) return null;
    if (esSuperadminEmail(usuario.email) && usuario.esAdmin === true) {
        return usuario;
    }
    if (esModeradorActivo(usuario)) {
        return usuario;
    }
    return null;
}

async function autenticarSesionOpcional(req, res, next) {
    try {
        req.authUser = null;
        const token = obtenerTokenDesdeHeader(req);
        if (!token || !JWT_SECRET) return next();
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload?.sub) return next();
        const usuario = await Usuario.findById(payload.sub).select('email esAdmin esModerador tipoUsuario promotorAprobado nombre emailVerificado');
        if (!usuario) return next();
        if (!esSuperadminEmail(usuario.email) && usuario.emailVerificado !== true) return next();
        req.authUser = usuario;
        return next();
    } catch (error) {
        return next();
    }
}

function requerirSesion(req, res, next) {
    if (!req.authUser) {
        return res.status(401).json({ error: 'Sesión no válida o caducada. Inicia sesión de nuevo.' });
    }
    return next();
}

async function requerirAdmin(req, res, next) {
    if (!req.authUser) return res.status(401).json({ error: 'Sesión requerida.' });
    const adminValido = await obtenerAdminValido(req.authUser._id);
    if (!adminValido) return res.status(403).json({ error: 'No autorizado.' });
    req.adminValido = adminValido;
    return next();
}

function requerirPromotorAprobado(req, res, next) {
    if (!req.authUser) return res.status(401).json({ error: 'Sesión requerida.' });
    const esAdmin = req.authUser.esAdmin === true && esSuperadminEmail(req.authUser.email);
    if (esAdmin) return next();
    if (req.authUser.tipoUsuario === 'PROMOTOR' && req.authUser.promotorAprobado === true) return next();
    return res.status(403).json({ error: 'Solo promotores verificados pueden realizar esta acción.' });
}

function puedeMarcarEventoComoPremium(usuario) {
    if (!usuario) return false;
    if (usuario.esAdmin === true && esSuperadminEmail(usuario.email)) return true;
    return usuario.esPremium === true;
}

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
        autorFoto: { type: String, default: '' },
        colorSemaforo: { type: String, enum: ['VERDE', 'AMARILLO', 'ROJO'], default: 'AMARILLO' },
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
    esModerador: { type: Boolean, default: false },
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
    seguidores: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
    siguiendo: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
    amigos: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
    solicitudesAmistadEnviadas: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
    solicitudesAmistadRecibidas: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
    notificacionesSociales: { type: [{
        tipo: { type: String, enum: ['seguir', 'amistad', 'evento'], default: 'evento' },
        titulo: { type: String, default: '' },
        mensaje: { type: String, default: '' },
        origenUsuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
        origenUsuarioNombre: { type: String, default: '' },
        eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', default: null },
        leida: { type: Boolean, default: false },
        creado: { type: Date, default: Date.now }
    }], default: [] },
    preferenciasPlanes: { type: [String], default: [] },
    pais: { type: String, default: '' },
    direccionResidencia: {
        placeId: { type: String, default: '' },
        displayName: { type: String, default: '' },
        latitud: { type: Number, default: null },
        longitud: { type: Number, default: null },
        countryCode: { type: String, default: '' },
        countryName: { type: String, default: '' }
    },
    actividadSocial: { type: [
        {
            tipo: { type: String, enum: ['seguir', 'amistad', 'evento'], default: 'evento' },
            titulo: { type: String, default: '' },
            mensaje: { type: String, default: '' },
            eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', default: null },
            eventoTitulo: { type: String, default: '' },
            origenUsuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
            origenUsuarioNombre: { type: String, default: '' },
            creado: { type: Date, default: Date.now }
        }
    ], default: [] },
    valoraciones: [{
        eventoId: String,
        estrellas: Number,
        comentario: String
    }],
    emailVerificado: { type: Boolean, default: false },
    verificacionEmail: {
        codigoHash: { type: String, default: '' },
        expiraEn: { type: Date, default: null },
        intentosFallidos: { type: Number, default: 0 },
        ultimoEnvio: { type: Date, default: null }
    },
    ultimoLoginExitoso: { type: Date, default: null }
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', UsuarioSchema);

const SeguridadLogSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    email: { type: String, default: '' },
    accion: { type: String, required: true },
    resultado: { type: String, enum: ['ok', 'error', 'bloqueado'], default: 'ok' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    detalle: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const SeguridadLog = mongoose.model('SeguridadLog', SeguridadLogSchema);

const MediaPublicaSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['perfil', 'evento', 'galeria', 'audio', 'otro'], default: 'otro' },
    mimeType: { type: String, default: 'application/octet-stream' },
    nombreOriginal: { type: String, default: '' },
    tamanoBytes: { type: Number, default: 0 },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    datos: { type: Buffer, required: true }
}, { timestamps: true });

const MediaPublica = mongoose.model('MediaPublica', MediaPublicaSchema);

app.use(autenticarSesionOpcional);

function esSuperadminEmail(email) {
    return (email || '').toLowerCase() === SUPERADMIN_EMAIL;
}

async function registrarEventoSeguridad(req, accion, resultado = 'ok', detalle = '', extra = {}) {
    try {
        await SeguridadLog.create({
            usuarioId: extra.usuarioId || req.authUser?._id || null,
            email: limpiarTexto(extra.email || req.authUser?.email || '', 160),
            accion,
            resultado,
            detalle: limpiarTexto(detalle, 240),
            ip: limpiarTexto(obtenerIpCliente(req), 80),
            userAgent: limpiarTexto(req.headers['user-agent'] || '', 240),
            meta: extra.meta || {}
        });
    } catch (err) {
        console.error('No se pudo registrar evento de seguridad:', err.message);
    }
}

function serializarUsuario(usuario) {
    const esSuperadmin = usuario?.esAdmin === true && esSuperadminEmail(usuario.email);
    const esModerador = usuario?.esModerador === true && !esSuperadmin;
    const serializarIds = (lista = []) => lista.map((item) => String(item));
    return {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        esAdmin: esSuperadmin,
        esModerador,
        tipoUsuario: esSuperadmin ? 'PROMOTOR' : (usuario.tipoUsuario || 'CLIENTE'),
        promotorAprobado: esSuperadmin ? true : (usuario.promotorAprobado || false),
        emailVerificado: esSuperadmin ? true : (usuario.emailVerificado === true),
        solicitudPromotor: usuario.solicitudPromotor || '',
        verificacionPromotor: usuario.verificacionPromotor || {},
        seguidores: serializarIds(usuario.seguidores || []),
        siguiendo: serializarIds(usuario.siguiendo || []),
        amigos: serializarIds(usuario.amigos || []),
        solicitudesAmistadEnviadas: serializarIds(usuario.solicitudesAmistadEnviadas || []),
        solicitudesAmistadRecibidas: serializarIds(usuario.solicitudesAmistadRecibidas || []),
        notificacionesSociales: serializarNotificacionesSociales(usuario.notificacionesSociales || []),
        actividadSocial: serializarActividadSocial(usuario.actividadSocial || []),
        preferenciasPlanes: usuario.preferenciasPlanes || [],
        pais: usuario.pais || '',
        direccionResidencia: usuario.direccionResidencia || {},
        localidad: usuario.localidad || '',
        nacionalidad: usuario.nacionalidad || '',
        estadoCivil: usuario.estadoCivil || '',
        tieneCoche: usuario.tieneCoche === true,
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

function serializarNotificacionesSociales(notificaciones = []) {
    return notificaciones
        .slice()
        .sort((a, b) => new Date(b.creado || 0).getTime() - new Date(a.creado || 0).getTime())
        .map((item, index) => ({
            id: String(item._id || index),
            tipo: item.tipo || 'evento',
            titulo: item.titulo || '',
            mensaje: item.mensaje || '',
            origenUsuarioId: item.origenUsuarioId || null,
            origenUsuarioNombre: item.origenUsuarioNombre || '',
            eventoId: item.eventoId || null,
            leida: item.leida === true,
            creado: item.creado || null
        }));
}

function serializarActividadSocial(actividad = []) {
    return actividad
        .slice()
        .sort((a, b) => new Date(b.creado || 0).getTime() - new Date(a.creado || 0).getTime())
        .map((item, index) => ({
            id: String(item._id || index),
            tipo: item.tipo || 'evento',
            titulo: item.titulo || '',
            mensaje: item.mensaje || '',
            eventoId: item.eventoId || null,
            eventoTitulo: item.eventoTitulo || '',
            origenUsuarioId: item.origenUsuarioId || null,
            origenUsuarioNombre: item.origenUsuarioNombre || '',
            creado: item.creado || null
        }));
}

function escaparRegex(valor = '') {
    return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizarIdLista(lista = []) {
    return lista.map((item) => String(item));
}

function obtenerEstadoRelacionSocial(yo = {}, objetivoId) {
    const id = String(objetivoId);
    const seguidores = normalizarIdLista(yo.seguidores || []);
    const siguiendo = normalizarIdLista(yo.siguiendo || []);
    const amigos = normalizarIdLista(yo.amigos || []);
    const solicitadas = normalizarIdLista(yo.solicitudesAmistadEnviadas || []);
    const recibidas = normalizarIdLista(yo.solicitudesAmistadRecibidas || []);
    return {
        sigue: siguiendo.includes(id),
        meSigue: seguidores.includes(id),
        esAmigo: amigos.includes(id),
        solicitudEnviada: solicitadas.includes(id),
        solicitudRecibida: recibidas.includes(id)
    };
}

async function notificarAmigosActividadUsuario(usuarioId, evento, accion) {
    if (!usuarioId || !evento) return;
    const usuario = await Usuario.findById(usuarioId).select('nombre amigos');
    if (!usuario) return;
    const amigosIds = normalizarIdLista(usuario.amigos || []);
    if (amigosIds.length === 0) return;

    const tituloAccion = accion === 'ASISTIRE' ? 'va a asistir' : 'le interesa';
    const notificacion = {
        tipo: 'evento',
        titulo: `${usuario.nombre} ${tituloAccion} a ${evento.titulo}`,
        mensaje: `${usuario.nombre} ha marcado que ${tituloAccion} a "${evento.titulo}" en Plandem.`,
        origenUsuarioId: usuario._id,
        origenUsuarioNombre: usuario.nombre,
        eventoId: evento._id,
        leida: false,
        creado: new Date()
    };

    await Usuario.updateMany(
        { $and: [{ _id: { $in: amigosIds } }, { _id: { $ne: usuario._id } }] },
        { $push: { notificacionesSociales: notificacion } }
    );
}

async function notificarRelacionSocial(destinatarioId, notificacion) {
    if (!destinatarioId || !notificacion) return;
    await Usuario.findByIdAndUpdate(destinatarioId, {
        $push: { notificacionesSociales: { ...notificacion, creado: new Date() } }
    });
}

async function registrarActividadSocial(usuarioId, actividad) {
    if (!usuarioId || !actividad) return;
    await Usuario.findByIdAndUpdate(usuarioId, {
        $push: {
            actividadSocial: {
                ...actividad,
                creado: new Date()
            }
        }
    });
}

function normalizarModeracionChat(chatModeration = {}) {
    return {
        bloqueado: chatModeration?.bloqueado === true,
        muteados: Array.isArray(chatModeration?.muteados) ? chatModeration.muteados : [],
        expulsados: Array.isArray(chatModeration?.expulsados) ? chatModeration.expulsados : [],
        avisados: Array.isArray(chatModeration?.avisados) ? chatModeration.avisados : []
    };
}

function buscarModeracionUsuario(lista = [], usuarioId) {
    return lista.find((item) => String(item.usuarioId) === String(usuarioId)) || null;
}

function generarAvatarInicialesServidor(nombre = 'Usuario', colorSemaforo = 'AMARILLO') {
    const limpio = String(nombre || 'Usuario').trim();
    const partes = limpio.split(/\s+/).filter(Boolean);
    const iniciales = ((partes[0]?.[0] || 'U') + (partes[1]?.[0] || '')).toUpperCase().slice(0, 2);
    const estado = String(colorSemaforo || 'AMARILLO').toUpperCase();
    const colores = estado === 'VERDE'
        ? ['#059669', '#10b981']
        : estado === 'ROJO'
            ? ['#dc2626', '#ef4444']
            : ['#d97706', '#f59e0b'];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${colores[0]}"/><stop offset="100%" stop-color="${colores[1]}"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><circle cx="60" cy="40" r="18" fill="rgba(255,255,255,0.22)"/><path d="M26 98c5-19 20-30 34-30s29 11 34 30" fill="rgba(255,255,255,0.22)"/><text x="60" y="74" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="34" font-weight="700" fill="#ffffff">${iniciales}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function obtenerPerfilesAutoresChat(chatMessages = []) {
    const ids = Array.from(new Set(
        (chatMessages || [])
            .map((mensaje) => String(mensaje.usuarioId || ''))
            .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    ));
    if (ids.length === 0) return new Map();
    const usuarios = await Usuario.find({ _id: { $in: ids } })
        .select('fotos colorSemaforo')
        .lean();
    const perfiles = new Map();
    usuarios.forEach((usuario) => {
        perfiles.set(String(usuario._id), {
            autorFoto: Array.isArray(usuario.fotos) && usuario.fotos[0] ? usuario.fotos[0] : '',
            colorSemaforo: usuario.colorSemaforo || 'AMARILLO'
        });
    });
    return perfiles;
}

function serializarMensajesChat(chatMessages = [], perfilesAutores = new Map()) {
    return chatMessages.map((mensaje) => ({
        _id: mensaje._id,
        autor: mensaje.autor || 'Anónimo',
        usuarioId: mensaje.usuarioId || '',
        autorFoto: perfilesAutores.get(String(mensaje.usuarioId || ''))?.autorFoto || mensaje.autorFoto || generarAvatarInicialesServidor(mensaje.autor || 'Usuario', mensaje.colorSemaforo || 'AMARILLO'),
        colorSemaforo: perfilesAutores.get(String(mensaje.usuarioId || ''))?.colorSemaforo || mensaje.colorSemaforo || 'AMARILLO',
        texto: mensaje.texto || '',
        creado: mensaje.creado || null
    }));
}

async function construirRespuestaChat(evento, viewerId, esAdmin) {
    const moderacion = normalizarModeracionChat(evento.chatModeration);
    const usuarioMuteado = viewerId ? buscarModeracionUsuario(moderacion.muteados, viewerId) : null;
    const usuarioExpulsado = viewerId ? buscarModeracionUsuario(moderacion.expulsados, viewerId) : null;
    const avisosUsuario = viewerId ? moderacion.avisados.filter((item) => String(item.usuarioId) === String(viewerId)) : [];
    const perfilesAutores = await obtenerPerfilesAutoresChat(evento.chatMessages || []);
    return {
        messages: serializarMensajesChat(evento.chatMessages || [], perfilesAutores),
        moderation: {
            bloqueado: moderacion.bloqueado,
            puedeModerar: esAdmin,
            silenciado: !!usuarioMuteado,
            expulsado: !!usuarioExpulsado,
            avisosUsuario,
            muteados: esAdmin ? moderacion.muteados : [],
            expulsados: esAdmin ? moderacion.expulsados : [],
            avisados: esAdmin ? moderacion.avisados : []
        }
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

function puedeGestionarEventos(usuario) {
    if (!usuario) return false;
    return (usuario.esAdmin === true && esSuperadminEmail(usuario.email)) || usuario.esModerador === true;
}

function lanzarImportacionEventosEnSegundoPlano(origen = 'startup') {
    if (process.env.NODE_ENV !== 'production' || !IMPORTAR_EVENTOS_EN_STARTUP) return;
    const scriptPath = path.join(__dirname, 'scripts', 'import-eventos-diario.js');
    const child = spawn(process.execPath, [scriptPath], {
        cwd: __dirname,
        env: process.env,
        stdio: 'inherit',
        shell: false
    });
    child.on('exit', (code) => {
        console.log(`📥 Importación de eventos (${origen}) finalizada con código ${code}`);
    });
    child.on('error', (error) => {
        console.error(`⚠️ Error lanzando importación de eventos (${origen}):`, error.message);
    });
}

// Conexión a MongoDB y sincronización de índices
mongoose.connect(MONGODB_URI)
  .then(async () => {
      console.log('📦 Conectado con éxito a la base de datos de Plandem');
      try {
          await Evento.syncIndexes();
          await Usuario.syncIndexes();
          await SeguridadLog.syncIndexes();
          await MediaPublica.syncIndexes();
          
          if (SUPERADMIN_PASSWORD) {
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
                          promotorAprobado: true,
                          emailVerificado: true
                      },
                      $setOnInsert: {
                          fechaNacimiento: '2000-01-01'
                      }
                  },
                  { upsert: true }
              );
              console.log(`✅ Superadmin sincronizado para ${SUPERADMIN_EMAIL}`);
          }

          // Política de seguridad: solo el perfil superadmin configurado puede mantener esAdmin=true.
          await Usuario.updateMany(
              { email: { $ne: SUPERADMIN_EMAIL }, esAdmin: true },
              { $set: { esAdmin: false } }
          );
          await Usuario.updateOne(
              { email: SUPERADMIN_EMAIL },
              { $set: { esAdmin: true, tipoUsuario: 'PROMOTOR', promotorAprobado: true, emailVerificado: true } }
          );

          await Usuario.updateMany(
              { emailVerificado: { $exists: false } },
              { $set: { emailVerificado: true } }
          );
      } catch (e) { console.error('Error al inicializar datos:', e); }

      if (MIGRAR_UPLOADS_LEGACY_ON_START) {
          setTimeout(() => {
              migrarMultimediaLegacyUploads()
                  .then((resumen) => {
                      console.log('✅ Migración legacy /uploads completada:', resumen);
                  })
                  .catch((error) => {
                      console.error('⚠️ Error en migración legacy /uploads:', error.message);
                  });
          }, 1500);
      }

      setTimeout(() => {
          lanzarImportacionEventosEnSegundoPlano('startup');
      }, 5000);
  })
  .catch(err => console.error('❌ Error de conexión:', err));

// ==========================================
// ENDPOINTS
// ==========================================

app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'portal-eventos', timestamp: new Date().toISOString() });
});

app.post('/api/admin/importar-eventos', requerirAdmin, async (req, res) => {
    try {
        const { spawn } = require('child_process');
        const scriptPath = path.join(__dirname, 'scripts', 'import-eventos-diario.js');
        const child = spawn(process.execPath, [scriptPath], {
            cwd: __dirname,
            env: process.env,
            stdio: 'pipe',
            shell: false
        });

        let salida = '';
        let errores = '';
        child.stdout.on('data', (chunk) => { salida += chunk.toString(); });
        child.stderr.on('data', (chunk) => { errores += chunk.toString(); });

        child.on('close', (code) => {
            res.json({ success: code === 0, code, salida, errores });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function servirMediaPublica(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).send('Media no encontrada.');
        }

        const media = await MediaPublica.findById(id).select('mimeType datos');
        if (!media) {
            return res.status(404).send('Media no encontrada.');
        }

        res.setHeader('Content-Type', media.mimeType || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(media.datos);
    } catch (error) {
        return res.status(500).send('Error al servir el archivo multimedia.');
    }
}

app.get('/api/media/:id', servirMediaPublica);
app.get('/api/media/:id/:nombre', servirMediaPublica);

app.get('/api/eventos', async (req, res) => {
    try {
        const eventos = await Evento.find().lean();
        if (req.authUser?._id) {
            const usuario = await Usuario.findById(req.authUser._id).select('preferenciasPlanes').lean();
            const eventosOrdenados = eventos
                .map((evento) => ({
                    ...evento,
                    __scorePreferencia: scoreEventoPorPreferencias(usuario, evento)
                }))
                .sort((a, b) => {
                    if ((b.__scorePreferencia || 0) !== (a.__scorePreferencia || 0)) {
                        return (b.__scorePreferencia || 0) - (a.__scorePreferencia || 0);
                    }
                    const fechaA = a.fechaInicio ? Date.parse(a.fechaInicio) : 0;
                    const fechaB = b.fechaInicio ? Date.parse(b.fechaInicio) : 0;
                    return fechaB - fechaA;
                })
                .map(({ __scorePreferencia, ...evento }) => evento);
            return res.json(eventosOrdenados);
        }
        res.json(eventos);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios/promotor-solicitudes', requerirAdmin, async (req, res) => {
    try {
        const solicitudes = await Usuario.find({ tipoUsuario: 'PROMOTOR', promotorAprobado: false }).select('-password');
        res.json({ solicitudes });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/usuarios', requerirAdmin, async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
        res.json({ usuarios });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/seguridad/logs', requerirAdmin, async (req, res) => {
    try {
        const limite = Math.min(Math.max(Number(req.query.limit || 100), 1), 300);
        const logs = await SeguridadLog.find().sort({ createdAt: -1 }).limit(limite);
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/usuarios/:id', requerirSesion, async (req, res) => {
    try {
        const { id } = req.params;
        const esMismoUsuario = String(req.authUser._id) === String(id);
        const adminValido = esMismoUsuario ? null : await obtenerAdminValido(req.authUser._id);
        if (!esMismoUsuario && !adminValido) {
            return res.status(403).json({ error: 'No autorizado para ver este perfil.' });
        }
        const usuario = await Usuario.findById(id).select('-password');
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.json({ usuario: serializarUsuario(usuario) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/eventos', requerirSesion, requerirPromotorAprobado, upload.fields([{ name: 'multimedia', maxCount: 1 }, { name: 'galeria', maxCount: 10 }]), async (req, res) => {
    try {
        const { titulo, ubicacion } = req.body;
        const existe = await Evento.findOne({ titulo: titulo });
        if (existe) return res.status(409).json({ error: 'El evento ya existe.' });

        const datosEvento = { ...req.body };
        
        const quierePremium = req.body.esPremium === 'true' || req.body.esPremium === true;
        if (quierePremium && !puedeMarcarEventoComoPremium(req.authUser)) {
            return res.status(403).json({ error: 'Solo promotores premium o superadmin pueden crear eventos premium.' });
        }
        datosEvento.esPremium = quierePremium;
        const ubicacionNormalizada = normalizarUbicacionEvento(ubicacion);
        if (!ubicacionNormalizada) {
            return res.status(400).json({ error: 'Debes seleccionar una ubicación válida desde las sugerencias.' });
        }
        datosEvento.ubicacion = ubicacionNormalizada;
        
        if (req.files) {
            if (req.files.multimedia && req.files.multimedia[0]) {
                datosEvento.multimediaUrl = await almacenarArchivoPublico(req.files.multimedia[0], {
                    tipo: 'evento',
                    usuarioId: req.authUser?._id,
                    cloudinaryFolder: `${CLOUDINARY_FOLDER}/eventos`,
                    cloudinaryResourceType: 'auto'
                });
            }
            if (req.files.galeria) {
                datosEvento.galeria = await Promise.all(
                    req.files.galeria.map((file) => almacenarArchivoPublico(file, {
                        tipo: 'galeria',
                        usuarioId: req.authUser?._id,
                        cloudinaryFolder: `${CLOUDINARY_FOLDER}/eventos/galeria`,
                        cloudinaryResourceType: 'auto'
                    }))
                );
            }
        }

        const nuevoEvento = new Evento(datosEvento);
        await nuevoEvento.save();
        res.status(201).json(nuevoEvento);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/eventos/:id', requerirSesion, upload.fields([{ name: 'multimedia', maxCount: 1 }, { name: 'galeria', maxCount: 10 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const { ubicacion } = req.body;
        const permisoModeracion = await obtenerPermisoModeracion(req.authUser._id);
        const esPromotorAprobado = req.authUser.tipoUsuario === 'PROMOTOR' && req.authUser.promotorAprobado === true;
        if (!permisoModeracion && !esPromotorAprobado) {
            return res.status(403).json({ error: 'Solo un promotor aprobado, moderador o superadmin puede editar eventos.' });
        }
        const datosActualizados = { ...req.body };

        if (req.body.esPremium !== undefined) {
            const quierePremium = req.body.esPremium === 'true' || req.body.esPremium === true;
            if (quierePremium && !puedeMarcarEventoComoPremium(req.authUser)) {
                return res.status(403).json({ error: 'Solo promotores premium o superadmin pueden marcar eventos como premium.' });
            }
            datosActualizados.esPremium = quierePremium;
        }

        if (ubicacion !== undefined) {
            const ubicacionNormalizada = normalizarUbicacionEvento(ubicacion);
            if (!ubicacionNormalizada) {
                return res.status(400).json({ error: 'Debes seleccionar una ubicación válida desde las sugerencias.' });
            }
            datosActualizados.ubicacion = ubicacionNormalizada;
        }

        if (req.files) {
            if (req.files['multimedia'] && req.files['multimedia'][0]) {
                datosActualizados.multimediaUrl = await almacenarArchivoPublico(req.files['multimedia'][0], {
                    tipo: 'evento',
                    usuarioId: req.authUser?._id,
                    cloudinaryFolder: `${CLOUDINARY_FOLDER}/eventos`,
                    cloudinaryResourceType: 'auto'
                });
            }
            if (req.files['galeria']) {
                const nuevasFotos = await Promise.all(
                    req.files['galeria'].map((file) => almacenarArchivoPublico(file, {
                        tipo: 'galeria',
                        usuarioId: req.authUser?._id,
                        cloudinaryFolder: `${CLOUDINARY_FOLDER}/eventos/galeria`,
                        cloudinaryResourceType: 'auto'
                    }))
                );
                datosActualizados.galeria = nuevasFotos;
            }
        }

        const eventoActualizado = await Evento.findByIdAndUpdate(id, datosActualizados, { new: true });
        if (!eventoActualizado) return res.status(404).json({ error: 'El evento no existe.' });

        res.json(eventoActualizado);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/eventos/:id', requerirSesion, async (req, res) => {
    try {
        const { id } = req.params;
        const permisoModeracion = await obtenerPermisoModeracion(req.authUser._id);
        if (!permisoModeracion) {
            return res.status(403).json({ error: 'Solo moderadores o superadmin pueden borrar eventos.' });
        }

        const eventoEliminado = await Evento.findByIdAndDelete(id);
        if (!eventoEliminado) return res.status(404).json({ error: 'El evento no existe.' });

        await Usuario.updateMany({}, { $pull: { favoritos: id, asistencias: id, chatsActivos: id, noInteresados: id } });

        res.json({ success: true, mensaje: 'Evento eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/eventos/:id/interaccion', requerirSesion, async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarioId, accion, modoSocial } = req.body;

        if (!usuarioId) return res.status(401).json({ error: "Debes estar registrado para interactuar." });
        if (String(req.authUser._id) !== String(usuarioId)) {
            return res.status(403).json({ error: 'No autorizado para operar con otro usuario.' });
        }

        const evento = await Evento.findById(id).select('titulo');
        if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });

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

        if (accion === 'ME_INTERESA' || accion === 'ASISTIRE') {
            await notificarAmigosActividadUsuario(usuarioId, evento, accion);
            await registrarActividadSocial(usuarioId, {
                tipo: 'evento',
                titulo: accion === 'ASISTIRE' ? 'Va a asistir a un evento' : 'Le interesa un evento',
                mensaje: accion === 'ASISTIRE'
                    ? `Ha marcado asistencia en "${evento.titulo}".`
                    : `Ha mostrado interés en "${evento.titulo}".`,
                eventoId: evento._id,
                eventoTitulo: evento.titulo,
                origenUsuarioId: req.authUser._id,
                origenUsuarioNombre: req.authUser.nombre || ''
            });
        }

        res.json({ success: true, mensaje, chatHabilitado });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/red-social/comunidad', requerirSesion, async (req, res) => {
    try {
        const termino = limpiarTexto(req.query.q || '', 80);
        const miUsuario = await Usuario.findById(req.authUser._id).select('seguidores siguiendo amigos solicitudesAmistadEnviadas solicitudesAmistadRecibidas');
        const filtro = { _id: { $ne: req.authUser._id } };
        if (termino) {
            const regex = new RegExp(escaparRegex(termino), 'i');
            filtro.$or = [{ nombre: regex }, { email: regex }, { localidad: regex }];
        }

        const usuarios = await Usuario.find(filtro)
            .select('nombre email fotos colorSemaforo tipoUsuario promotorAprobado localidad')
            .sort({ nombre: 1 })
            .limit(40);

        const relaciones = miUsuario || { seguidores: [], siguiendo: [], amigos: [], solicitudesAmistadEnviadas: [], solicitudesAmistadRecibidas: [] };
        res.json({
            usuarios: usuarios.map((usuario) => ({
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                fotos: usuario.fotos,
                colorSemaforo: usuario.colorSemaforo,
                tipoUsuario: usuario.tipoUsuario,
                promotorAprobado: usuario.promotorAprobado,
                localidad: usuario.localidad || '',
                relacion: obtenerEstadoRelacionSocial(relaciones, usuario._id)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/red-social/notificaciones', requerirSesion, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.authUser._id).select('notificacionesSociales');
        res.json({ notificaciones: serializarNotificacionesSociales(usuario?.notificacionesSociales || []) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/red-social/muro', requerirSesion, async (req, res) => {
    try {
        const me = await Usuario.findById(req.authUser._id)
            .select('nombre fotos amigos actividadSocial')
            .lean();
        if (!me) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const amigosIds = normalizarIdLista(me.amigos || []);
        const amigos = amigosIds.length > 0
            ? await Usuario.find({ _id: { $in: amigosIds } })
                .select('nombre fotos actividadSocial colorSemaforo')
                .lean()
            : [];

        const actores = [{
            id: String(me._id),
            nombre: me.nombre,
            fotos: me.fotos,
            colorSemaforo: 'VERDE',
            actividadSocial: me.actividadSocial || []
        }, ...amigos];

        const muro = actores.flatMap((actor) => (actor.actividadSocial || []).map((actividad) => ({
            id: String(actividad._id || actividad.id || `${actor.id}-${actividad.creado || Date.now()}`),
            actorId: String(actor._id || actor.id),
            actorNombre: actor.nombre,
            actorFotos: actor.fotos || [],
            actorColorSemaforo: actor.colorSemaforo || 'AMARILLO',
            tipo: actividad.tipo || 'evento',
            titulo: actividad.titulo || '',
            mensaje: actividad.mensaje || '',
            eventoId: actividad.eventoId || null,
            eventoTitulo: actividad.eventoTitulo || '',
            creado: actividad.creado || null,
            esPropia: String(actor._id || actor.id) === String(me._id)
        })))
            .sort((a, b) => new Date(b.creado || 0).getTime() - new Date(a.creado || 0).getTime())
            .slice(0, 30);

        res.json({ muro });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/red-social/notificaciones/marcar-leidas', requerirSesion, async (req, res) => {
    try {
        await Usuario.findByIdAndUpdate(req.authUser._id, { $set: { 'notificacionesSociales.$[].leida': true } });
        const usuario = await Usuario.findById(req.authUser._id).select('notificacionesSociales');
        res.json({ success: true, notificaciones: serializarNotificacionesSociales(usuario?.notificacionesSociales || []) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/red-social/accion', requerirSesion, async (req, res) => {
    try {
        const { objetivoId, accion } = req.body;
        const usuarioId = String(req.authUser._id);
        if (!objetivoId) return res.status(400).json({ error: 'Falta el usuario objetivo.' });
        if (!accion) return res.status(400).json({ error: 'Falta la acción social.' });
        if (String(objetivoId) === usuarioId) return res.status(400).json({ error: 'No puedes aplicar esta acción sobre tu propio perfil.' });

        const [yo, objetivo] = await Promise.all([
            Usuario.findById(usuarioId).select('nombre tipoUsuario seguidores siguiendo amigos solicitudesAmistadEnviadas solicitudesAmistadRecibidas notificacionesSociales'),
            Usuario.findById(objetivoId).select('nombre tipoUsuario seguidores siguiendo amigos solicitudesAmistadEnviadas solicitudesAmistadRecibidas')
        ]);

        if (!yo || !objetivo) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const metaRespuesta = { mensaje: '', relacion: null };
        let misSeguidores = normalizarIdLista(yo.seguidores || []);
        let miSiguiendo = normalizarIdLista(yo.siguiendo || []);
        let misAmigos = normalizarIdLista(yo.amigos || []);
        let solicitudesEnviadas = normalizarIdLista(yo.solicitudesAmistadEnviadas || []);
        let solicitudesRecibidas = normalizarIdLista(yo.solicitudesAmistadRecibidas || []);
        let misNotificaciones = Array.isArray(yo.notificacionesSociales) ? yo.notificacionesSociales.slice() : [];

        let objetivoSeguidores = normalizarIdLista(objetivo.seguidores || []);
        let objetivoSiguiendo = normalizarIdLista(objetivo.siguiendo || []);
        let objetivoAmigos = normalizarIdLista(objetivo.amigos || []);
        let objetivoSolicitudesEnviadas = normalizarIdLista(objetivo.solicitudesAmistadEnviadas || []);
        let objetivoSolicitudesRecibidas = normalizarIdLista(objetivo.solicitudesAmistadRecibidas || []);

        const quitarElemento = (lista, valor) => lista.filter((item) => String(item) !== String(valor));
        const agregarElemento = (lista, valor) => {
            if (!lista.some((item) => String(item) === String(valor))) lista.push(valor);
        };
        const limpiarNotificacionesSolicitudRespondida = () => {
            misNotificaciones = misNotificaciones.filter((item) => {
                const tipo = String(item?.tipo || '');
                if (tipo !== 'amistad') return true;
                const origenCoincide = String(item?.origenUsuarioId || '') === String(objetivoId);
                const titulo = String(item?.titulo || '').toLowerCase();
                const esSolicitudPendiente = titulo.includes('solicitud de amistad') && !titulo.includes('aceptada');
                return !(origenCoincide && esSolicitudPendiente);
            });
        };

        if (accion === 'seguir') {
            agregarElemento(miSiguiendo, objetivoId);
            agregarElemento(objetivoSeguidores, yo._id);
            metaRespuesta.mensaje = `Ahora sigues a ${objetivo.nombre}.`;
            await notificarRelacionSocial(objetivoId, {
                tipo: 'seguir',
                titulo: `${yo.nombre} te sigue`,
                mensaje: `${yo.nombre} ha empezado a seguirte en Plandem.`,
                origenUsuarioId: yo._id,
                origenUsuarioNombre: yo.nombre,
                leida: false
            });
        } else if (accion === 'dejar_de_seguir') {
            miSiguiendo = quitarElemento(miSiguiendo, objetivoId);
            objetivoSeguidores = quitarElemento(objetivoSeguidores, yo._id);
            metaRespuesta.mensaje = `Has dejado de seguir a ${objetivo.nombre}.`;
        } else if (accion === 'solicitar_amistad') {
            if (misAmigos.includes(String(objetivoId))) {
                return res.json({ success: true, mensaje: 'Ya sois amigos.', relacion: obtenerEstadoRelacionSocial(yo, objetivoId) });
            }
            const ambosNoPromotores = yo.tipoUsuario !== 'PROMOTOR' && objetivo.tipoUsuario !== 'PROMOTOR';
            if (ambosNoPromotores) {
                agregarElemento(misAmigos, objetivoId);
                agregarElemento(objetivoAmigos, yo._id);
                solicitudesEnviadas = quitarElemento(solicitudesEnviadas, objetivoId);
                solicitudesRecibidas = quitarElemento(solicitudesRecibidas, objetivoId);
                objetivoSolicitudesEnviadas = quitarElemento(objetivoSolicitudesEnviadas, yo._id);
                objetivoSolicitudesRecibidas = quitarElemento(objetivoSolicitudesRecibidas, yo._id);
                metaRespuesta.mensaje = `${objetivo.nombre} ha sido agregado directamente como amistad.`;
                await notificarRelacionSocial(objetivoId, {
                    tipo: 'amistad',
                    titulo: 'Nueva amistad directa',
                    mensaje: `${yo.nombre} ha conectado contigo directamente.`,
                    origenUsuarioId: yo._id,
                    origenUsuarioNombre: yo.nombre,
                    leida: false
                });
            } else {
                agregarElemento(solicitudesEnviadas, objetivoId);
                agregarElemento(objetivoSolicitudesRecibidas, yo._id);
                metaRespuesta.mensaje = `Solicitud de amistad enviada a ${objetivo.nombre}.`;
                await notificarRelacionSocial(objetivoId, {
                    tipo: 'amistad',
                    titulo: 'Nueva solicitud de amistad',
                    mensaje: `${yo.nombre} te ha enviado una solicitud de amistad.`,
                    origenUsuarioId: yo._id,
                    origenUsuarioNombre: yo.nombre,
                    leida: false
                });
            }
        } else if (accion === 'cancelar_solicitud_amistad') {
            solicitudesEnviadas = quitarElemento(solicitudesEnviadas, objetivoId);
            objetivoSolicitudesRecibidas = quitarElemento(objetivoSolicitudesRecibidas, yo._id);
            metaRespuesta.mensaje = `Solicitud cancelada.`;
        } else if (accion === 'aceptar_solicitud_amistad') {
            if (!solicitudesRecibidas.includes(String(objetivoId))) {
                return res.status(400).json({ error: 'No existe una solicitud pendiente de ese usuario.' });
            }
            agregarElemento(misAmigos, objetivoId);
            agregarElemento(objetivoAmigos, yo._id);
            solicitudesRecibidas = quitarElemento(solicitudesRecibidas, objetivoId);
            solicitudesEnviadas = quitarElemento(solicitudesEnviadas, objetivoId);
            objetivoSolicitudesEnviadas = quitarElemento(objetivoSolicitudesEnviadas, yo._id);
            objetivoSolicitudesRecibidas = quitarElemento(objetivoSolicitudesRecibidas, yo._id);
            limpiarNotificacionesSolicitudRespondida();
            metaRespuesta.mensaje = `Ahora eres amigo de ${objetivo.nombre}.`;
            await notificarRelacionSocial(objetivoId, {
                tipo: 'amistad',
                titulo: 'Solicitud de amistad aceptada',
                mensaje: `${yo.nombre} ha aceptado tu solicitud de amistad.`,
                origenUsuarioId: yo._id,
                origenUsuarioNombre: yo.nombre,
                leida: false
            });
        } else if (accion === 'rechazar_solicitud_amistad') {
            solicitudesRecibidas = quitarElemento(solicitudesRecibidas, objetivoId);
            objetivoSolicitudesEnviadas = quitarElemento(objetivoSolicitudesEnviadas, yo._id);
            limpiarNotificacionesSolicitudRespondida();
            metaRespuesta.mensaje = `Solicitud rechazada.`;
        } else if (accion === 'dejar_amigo') {
            misAmigos = quitarElemento(misAmigos, objetivoId);
            objetivoAmigos = quitarElemento(objetivoAmigos, yo._id);
            metaRespuesta.mensaje = `Has dejado de ser amigo de ${objetivo.nombre}.`;
        } else {
            return res.status(400).json({ error: 'Acción social no soportada.' });
        }

        yo.siguiendo = normalizarIdLista(miSiguiendo);
        yo.seguidores = normalizarIdLista(misSeguidores);
        yo.amigos = normalizarIdLista(misAmigos);
        yo.solicitudesAmistadEnviadas = normalizarIdLista(solicitudesEnviadas);
        yo.solicitudesAmistadRecibidas = normalizarIdLista(solicitudesRecibidas);
        yo.notificacionesSociales = misNotificaciones;

        objetivo.siguiendo = normalizarIdLista(objetivoSiguiendo);
        objetivo.seguidores = normalizarIdLista(objetivoSeguidores);
        objetivo.amigos = normalizarIdLista(objetivoAmigos);
        objetivo.solicitudesAmistadEnviadas = normalizarIdLista(objetivoSolicitudesEnviadas);
        objetivo.solicitudesAmistadRecibidas = normalizarIdLista(objetivoSolicitudesRecibidas);

        await Promise.all([yo.save(), objetivo.save()]);

        res.json({
            success: true,
            mensaje: metaRespuesta.mensaje,
            relacion: obtenerEstadoRelacionSocial(yo, objetivoId)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const audioUpload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!MIME_AUDIO_PERMITIDOS.has(file.mimetype)) {
            return cb(new Error('Formato de audio no permitido.'));
        }
        cb(null, true);
    }
});
app.post('/api/eventos/:id/audio', requerirSesion, requerirPromotorAprobado, audioUpload.single('audioBlobs'), async (req, res) => {
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

async function prepararVerificacionEmail(usuario) {
    const codigo = generarCodigoOTP();
    const expiraEn = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);
    usuario.verificacionEmail = {
        codigoHash: hashOTP(usuario.email, codigo),
        expiraEn,
        intentosFallidos: 0,
        ultimoEnvio: new Date()
    };
    usuario.emailVerificado = false;
    await usuario.save();
    await enviarCodigoVerificacionEmail(usuario.email, codigo);
}

app.post('/api/usuarios/registro', registerLimiter, async (req, res) => {
    try {
        const { email, password, nombre, fechaNacimiento, localidad, nacionalidad, estadoCivil, tieneCoche, colorSemaforo, descripcionPersonal, tipoUsuario, solicitudPromotor, verificacionPromotor, pais, direccionResidencia, preferenciasPlanes } = req.body;
        const emailNormalizado = limpiarTexto((email || '').toLowerCase(), 160);
        const nombreNormalizado = limpiarTexto(nombre, 100);
        const fechaNacimientoNormalizada = limpiarTexto(fechaNacimiento, 25);
        if (!emailNormalizado || !nombreNormalizado || !fechaNacimientoNormalizada || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios para registrarte.' });
        }
        if (!emailValido(emailNormalizado)) {
            return res.status(400).json({ error: 'El correo electrónico no es válido.' });
        }
        if (!passwordRobusta(password)) {
            return res.status(400).json({ error: 'La contraseña debe tener mínimo 10 caracteres e incluir mayúsculas, minúsculas, números y símbolo.' });
        }
        if (!esMayorDeEdad(fechaNacimientoNormalizada, 18)) {
            return res.status(403).json({ error: 'Registro no permitido para menores de edad.' });
        }

        if (!validarPaisCodigo(pais)) {
            return res.status(400).json({ error: 'Debes seleccionar un país válido de la lista.' });
        }

        const direccionNormalizada = normalizarDireccionSeleccionada(direccionResidencia, pais);
        if (!direccionNormalizada) {
            return res.status(400).json({ error: 'Debes seleccionar una dirección válida desde las sugerencias.' });
        }

        const preferenciasNormalizadas = normalizarListaOpciones(preferenciasPlanes, PLAN_PREFERENCIAS_PERMITIDAS);

        const usuarioExiste = await Usuario.findOne({ email: emailNormalizado });
        if (usuarioExiste) return res.status(400).json({ error: "El correo electrónico ya está registrado." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const esPromotor = tipoUsuario === 'PROMOTOR';
        if (esPromotor && !verificacionPromotorCompleta(verificacionPromotor || {})) {
            return res.status(400).json({ error: 'Para cuenta de promotor debes completar todos los datos de verificación.' });
        }
        const datosVerificacion = esPromotor ? {
            tipoPromotorLegal: limpiarTexto(verificacionPromotor?.tipoPromotorLegal || 'EMPRESA', 20),
            nombreComercial: limpiarTexto(verificacionPromotor?.nombreComercial, 160),
            nifCif: limpiarTexto(verificacionPromotor?.nifCif, 60),
            cargo: limpiarTexto(verificacionPromotor?.cargo, 120),
            telefonoProfesional: limpiarTexto(verificacionPromotor?.telefonoProfesional, 40),
            webRedSocial: limpiarTexto(verificacionPromotor?.webRedSocial, 240),
            ciudadesOperacion: limpiarTexto(verificacionPromotor?.ciudadesOperacion, 240),
            tipoEventos: limpiarTexto(verificacionPromotor?.tipoEventos, 240),
            frecuenciaEventos: limpiarTexto(verificacionPromotor?.frecuenciaEventos, 80),
            enlacePrueba: limpiarTexto(verificacionPromotor?.enlacePrueba, 240),
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
            nombre: nombreNormalizado,
            email: emailNormalizado,
            password: hashedPassword,
            fechaNacimiento: fechaNacimientoNormalizada,
            localidad: limpiarTexto(localidad, 100),
            nacionalidad: limpiarTexto(nacionalidad, 80),
            pais: String(pais).toUpperCase(),
            direccionResidencia: direccionNormalizada,
            estadoCivil: limpiarTexto(estadoCivil, 40) || 'No especificado',
            tieneCoche: tieneCoche === 'true' || tieneCoche === true,
            colorSemaforo: colorSemaforo || 'AMARILLO',
            descripcionPersonal: limpiarTexto(descripcionPersonal, 400),
            tipoUsuario: esPromotor ? 'PROMOTOR' : 'CLIENTE',
            promotorAprobado: false,
            solicitudPromotor: esPromotor ? limpiarTexto(solicitudPromotor, 500) : '',
            verificacionPromotor: datosVerificacion,
            preferenciasPlanes: preferenciasNormalizadas,
            emailVerificado: false,
            verificacionEmail: {
                codigoHash: '',
                expiraEn: null,
                intentosFallidos: 0,
                ultimoEnvio: null
            }
        });

        await nuevoUsuario.save();
        await prepararVerificacionEmail(nuevoUsuario);
        await registrarEventoSeguridad(req, 'registro_usuario', 'ok', 'Registro inicial correcto, pendiente verificación email.', {
            usuarioId: nuevoUsuario._id,
            email: nuevoUsuario.email
        });

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito. Revisa tu email para verificar la cuenta.',
            usuarioId: nuevoUsuario._id,
            requiereVerificacionEmail: true,
            email: nuevoUsuario.email
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/usuarios/verificar-email', otpLimiter, async (req, res) => {
    try {
        const emailNormalizado = limpiarTexto((req.body?.email || '').toLowerCase(), 160);
        const codigo = limpiarTexto(req.body?.codigo || '', 10);
        if (!emailNormalizado || !codigo) {
            return res.status(400).json({ error: 'Email y código son obligatorios.' });
        }

        const usuario = await Usuario.findOne({ email: emailNormalizado });
        if (!usuario) {
            await registrarEventoSeguridad(req, 'verificar_email_otp', 'error', 'Usuario no encontrado.', { email: emailNormalizado });
            return res.status(400).json({ error: 'Código inválido o expirado.' });
        }
        if (usuario.emailVerificado === true) {
            return res.json({ success: true, mensaje: 'Tu email ya estaba verificado.' });
        }
        if (!usuarioTieneVerificacionPendiente(usuario)) {
            await registrarEventoSeguridad(req, 'verificar_email_otp', 'error', 'Código expirado o inexistente.', {
                usuarioId: usuario._id,
                email: usuario.email
            });
            return res.status(400).json({ error: 'Código inválido o expirado. Solicita uno nuevo.' });
        }

        const intentosActuales = Number(usuario.verificacionEmail?.intentosFallidos || 0);
        if (intentosActuales >= OTP_MAX_ATTEMPTS) {
            await registrarEventoSeguridad(req, 'verificar_email_otp', 'bloqueado', 'Máximo de intentos OTP alcanzado.', {
                usuarioId: usuario._id,
                email: usuario.email
            });
            return res.status(429).json({ error: 'Demasiados intentos fallidos. Solicita un nuevo código.' });
        }

        const hashEsperado = usuario.verificacionEmail?.codigoHash || '';
        const hashRecibido = hashOTP(usuario.email, codigo);
        if (hashRecibido !== hashEsperado) {
            usuario.verificacionEmail.intentosFallidos = intentosActuales + 1;
            await usuario.save();
            await registrarEventoSeguridad(req, 'verificar_email_otp', 'error', 'Código OTP incorrecto.', {
                usuarioId: usuario._id,
                email: usuario.email,
                meta: { intentosFallidos: usuario.verificacionEmail.intentosFallidos }
            });
            return res.status(400).json({ error: 'Código inválido o expirado.' });
        }

        usuario.emailVerificado = true;
        usuario.verificacionEmail = {
            codigoHash: '',
            expiraEn: null,
            intentosFallidos: 0,
            ultimoEnvio: usuario.verificacionEmail?.ultimoEnvio || null
        };
        await usuario.save();
        await registrarEventoSeguridad(req, 'verificar_email_otp', 'ok', 'Email verificado correctamente.', {
            usuarioId: usuario._id,
            email: usuario.email
        });

        return res.json({ success: true, mensaje: 'Email verificado correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/usuarios/reenviar-verificacion-email', otpLimiter, async (req, res) => {
    try {
        const emailNormalizado = limpiarTexto((req.body?.email || '').toLowerCase(), 160);
        if (!emailNormalizado) {
            return res.status(400).json({ error: 'Debes indicar un email válido.' });
        }
        const usuario = await Usuario.findOne({ email: emailNormalizado });
        if (!usuario) {
            await registrarEventoSeguridad(req, 'reenviar_email_otp', 'error', 'Reenvío solicitado para email inexistente.', { email: emailNormalizado });
            return res.json({ success: true, mensaje: 'Si el email existe, recibirás un nuevo código.' });
        }
        if (usuario.emailVerificado === true) {
            return res.json({ success: true, mensaje: 'Este email ya está verificado.' });
        }

        const ultimoEnvio = usuario.verificacionEmail?.ultimoEnvio ? new Date(usuario.verificacionEmail.ultimoEnvio).getTime() : 0;
        if (ultimoEnvio && Date.now() - ultimoEnvio < 60 * 1000) {
            return res.status(429).json({ error: 'Espera al menos 1 minuto antes de solicitar otro código.' });
        }

        await prepararVerificacionEmail(usuario);
        await registrarEventoSeguridad(req, 'reenviar_email_otp', 'ok', 'Código OTP reenviado.', {
            usuarioId: usuario._id,
            email: usuario.email
        });

        return res.json({ success: true, mensaje: 'Te hemos enviado un nuevo código de verificación.' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/usuarios-promotor', requerirAdmin, async (req, res) => {
    try {
        const { nombre, email, password, promotorAprobado, tipoPerfil } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios para crear el perfil.' });
        }
        if (!emailValido(String(email).toLowerCase())) {
            return res.status(400).json({ error: 'Email no válido.' });
        }
        if (!passwordRobusta(password)) {
            return res.status(400).json({ error: 'La contraseña temporal no cumple el mínimo de seguridad.' });
        }

        const perfilNormalizado = String(tipoPerfil || 'PROMOTOR').toUpperCase();
        if (!['PROMOTOR', 'MODERADOR'].includes(perfilNormalizado)) {
            return res.status(400).json({ error: 'El tipo de perfil no es válido.' });
        }

        const usuarioExiste = await Usuario.findOne({ email: String(email).toLowerCase() });
        if (usuarioExiste) {
            return res.status(400).json({ error: 'Ya existe un usuario con ese email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoPromotor = await Usuario.create({
            nombre: limpiarTexto(nombre, 100),
            email: String(email).toLowerCase(),
            password: hashedPassword,
            fechaNacimiento: '1990-01-01',
            tipoUsuario: perfilNormalizado === 'PROMOTOR' ? 'PROMOTOR' : 'CLIENTE',
            esModerador: perfilNormalizado === 'MODERADOR',
            promotorAprobado: perfilNormalizado === 'PROMOTOR' ? promotorAprobado === true : false,
            solicitudPromotor: perfilNormalizado === 'PROMOTOR' ? 'Creado manualmente por administrador.' : '',
            verificacionPromotor: perfilNormalizado === 'PROMOTOR' ? {
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
            } : {}
        });

        res.status(201).json({
            success: true,
            mensaje: perfilNormalizado === 'MODERADOR' ? 'Moderador creado correctamente.' : 'Promotor creado correctamente.',
            usuario: {
                id: nuevoPromotor._id,
                nombre: nuevoPromotor.nombre,
                email: nuevoPromotor.email,
                tipoUsuario: nuevoPromotor.tipoUsuario,
                esModerador: nuevoPromotor.esModerador === true,
                promotorAprobado: nuevoPromotor.promotorAprobado
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/usuarios/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const identificador = limpiarTexto(email || '', 160);
        const emailNormalizado = identificador.toLowerCase();
        let usuario = await Usuario.findOne({ email: emailNormalizado });
        if (!usuario && identificador) {
            const regexNombre = new RegExp(`^${escaparRegex(identificador)}$`, 'i');
            usuario = await Usuario.findOne({ nombre: regexNombre });
        }
        if (!usuario) {
            await registrarEventoSeguridad(req, 'login', 'error', 'Intento con identificador no registrado.', { email: emailNormalizado });
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const passwordCorrecto = await bcrypt.compare(password || '', usuario.password);
        if (!passwordCorrecto) {
            await registrarEventoSeguridad(req, 'login', 'error', 'Contraseña inválida.', {
                usuarioId: usuario._id,
                email: usuario.email
            });
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const superadmin = esSuperadminEmail(usuario.email);
        if (!superadmin && usuario.emailVerificado !== true) {
            await registrarEventoSeguridad(req, 'login', 'bloqueado', 'Email no verificado.', {
                usuarioId: usuario._id,
                email: usuario.email
            });
            return res.status(403).json({
                error: 'Debes verificar tu email antes de iniciar sesión.',
                requiereVerificacionEmail: true,
                email: usuario.email
            });
        }

        usuario.ultimoLoginExitoso = new Date();
        await usuario.save();
        await registrarEventoSeguridad(req, 'login', 'ok', 'Acceso correcto.', {
            usuarioId: usuario._id,
            email: usuario.email
        });

        res.json({
            mensaje: "Login correcto",
            usuario: serializarUsuario(usuario),
            token: crearTokenSesion(usuario)
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/eventos/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        const viewerId = req.authUser?._id || null;
        const adminValido = req.authUser ? await obtenerPermisoModeracion(req.authUser._id) : null;
        const evento = await Evento.findById(id).select('chatMessages chatModeration');
        if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });
        const moderacion = normalizarModeracionChat(evento.chatModeration);
        if (!adminValido && viewerId && buscarModeracionUsuario(moderacion.expulsados, viewerId)) {
            return res.status(403).json({ error: 'Has sido expulsado de este chat por moderación.' });
        }
        res.json(await construirRespuestaChat(evento, viewerId, !!adminValido));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/eventos/:id/chat', requerirSesion, async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarioId, autor, texto } = req.body;

        if (!usuarioId) return res.status(401).json({ error: 'Debes estar autenticado para enviar mensajes.' });
        if (!texto || texto.trim().length === 0) return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
        const textoLimpio = texto.trim();

        if (String(req.authUser._id) !== String(usuarioId)) {
            return res.status(403).json({ error: 'No autorizado para enviar mensajes en nombre de otro usuario.' });
        }

        const adminValido = await obtenerAdminValido(req.authUser._id);
        const eventoActual = await Evento.findById(id).select('chatModeration');
        if (!eventoActual) return res.status(404).json({ error: 'Evento no encontrado.' });

        const moderacion = normalizarModeracionChat(eventoActual.chatModeration);
        if (!adminValido && moderacion.bloqueado) {
            return res.status(403).json({ error: 'El chat está bloqueado temporalmente por moderación.' });
        }
        if (!adminValido && buscarModeracionUsuario(moderacion.expulsados, usuarioId)) {
            return res.status(403).json({ error: 'Has sido expulsado de este chat.' });
        }
        if (!adminValido && buscarModeracionUsuario(moderacion.muteados, usuarioId)) {
            return res.status(403).json({ error: 'Has sido silenciado en este chat.' });
        }

        const terminosOfensivos = detectarLenguajeOfensivo(textoLimpio);
        if (!adminValido && terminosOfensivos.length > 0) {
            const avisosPrevios = moderacion.avisados.filter((item) => String(item.usuarioId) === String(usuarioId)).length;
            moderacion.avisados.push({
                usuarioId,
                autor: autor || req.authUser?.nombre || 'Usuario',
                fecha: new Date(),
                adminId: null,
                motivo: CHAT_MOTIVO_AVISO_AUTOMATICO
            });
            eventoActual.chatModeration = moderacion;
            await eventoActual.save();

            await registrarEventoSeguridad(
                req,
                'chat_lenguaje_ofensivo',
                'bloqueado',
                'Mensaje bloqueado por detección automática de lenguaje ofensivo.',
                {
                    meta: {
                        eventoId: id,
                        usuarioId,
                        terminos: terminosOfensivos,
                        avisosTotales: avisosPrevios + 1,
                        texto: textoLimpio.slice(0, 200)
                    }
                }
            );

            return res.status(422).json({
                error: CHAT_MENSAJE_AVISO_USUARIO,
                ...(await construirRespuestaChat(eventoActual, usuarioId, !!adminValido))
            });
        }

        const evento = await Evento.findByIdAndUpdate(
            id,
            { $push: { chatMessages: { autor: autor || 'Anónimo', usuarioId, texto: textoLimpio, creado: new Date() } } },
            { new: true }
        );

        if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });
        res.json({ success: true, mensaje: 'Mensaje guardado correctamente.', ...(await construirRespuestaChat(evento, usuarioId, !!adminValido)) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/eventos/:id/chat/moderacion', requerirSesion, async (req, res) => {
    try {
        const { id } = req.params;
        const adminValido = await obtenerPermisoModeracion(req.authUser._id);
        if (!adminValido) {
            return res.status(403).json({ error: 'Solo moderadores o superadmin pueden moderar este chat.' });
        }

        const { accion, usuarioId, autor, messageId } = req.body;
        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' });

        const moderacion = normalizarModeracionChat(evento.chatModeration);
        const marcaTiempo = new Date();
        const usuarioModerado = {
            usuarioId: usuarioId || '',
            autor: autor || 'Usuario',
            fecha: marcaTiempo,
            adminId: adminValido._id
        };

        if (accion === 'bloquear_chat') {
            moderacion.bloqueado = true;
        } else if (accion === 'desbloquear_chat') {
            moderacion.bloqueado = false;
        } else if (accion === 'avisar_usuario') {
            if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario a avisar.' });
            moderacion.avisados.push({
                ...usuarioModerado,
                motivo: req.body.motivo || 'Comportamiento inapropiado detectado en el chat.'
            });
        } else if (accion === 'limpiar_avisos_usuario') {
            if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario para limpiar avisos.' });
            moderacion.avisados = moderacion.avisados.filter((item) => String(item.usuarioId) !== String(usuarioId));
        } else if (accion === 'silenciar_usuario') {
            if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario a silenciar.' });
            moderacion.muteados = moderacion.muteados.filter((item) => String(item.usuarioId) !== String(usuarioId));
            moderacion.muteados.push(usuarioModerado);
        } else if (accion === 'reactivar_usuario') {
            if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario a reactivar.' });
            moderacion.muteados = moderacion.muteados.filter((item) => String(item.usuarioId) !== String(usuarioId));
        } else if (accion === 'expulsar_usuario') {
            if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario a expulsar.' });
            moderacion.expulsados = moderacion.expulsados.filter((item) => String(item.usuarioId) !== String(usuarioId));
            moderacion.expulsados.push(usuarioModerado);
            moderacion.muteados = moderacion.muteados.filter((item) => String(item.usuarioId) !== String(usuarioId));
            await Usuario.findByIdAndUpdate(usuarioId, { $pull: { chatsActivos: id } });
        } else if (accion === 'readmitir_usuario') {
            if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario a readmitir.' });
            moderacion.expulsados = moderacion.expulsados.filter((item) => String(item.usuarioId) !== String(usuarioId));
        } else if (accion === 'borrar_mensajes_usuario') {
            if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario cuyos mensajes se van a borrar.' });
            evento.chatMessages = (evento.chatMessages || []).filter((mensaje) => String(mensaje.usuarioId) !== String(usuarioId));
        } else if (accion === 'borrar_mensaje') {
            if (!messageId) return res.status(400).json({ error: 'Falta el mensaje a borrar.' });
            evento.chatMessages = (evento.chatMessages || []).filter((mensaje) => String(mensaje._id) !== String(messageId));
        } else {
            return res.status(400).json({ error: 'Acción de moderación no soportada.' });
        }

        evento.chatModeration = moderacion;
        await evento.save();

        res.json({ success: true, mensaje: 'Moderación aplicada correctamente.', ...(await construirRespuestaChat(evento, adminValido._id, true)) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/usuarios/:id', requerirSesion, upload.single('fotoPerfil'), async (req, res) => {
    try {
        const { id } = req.params;
        const { colorSemaforo, descripcionPersonal, tipoUsuario, solicitudPromotor, promotorAprobado, verificacionPromotor, esAdmin, esModerador, pais, direccionResidencia, preferenciasPlanes } = req.body;

        const requesterId = req.authUser._id;
        const esMismoUsuario = requesterId && requesterId.toString() === id.toString();
        const adminValido = await obtenerAdminValido(requesterId);
        if (!esMismoUsuario && !adminValido) {
            return res.status(403).json({ error: 'No autorizado para editar este usuario.' });
        }

        const esPerfilPrivilegiado = Boolean(
            adminValido ||
            (req.authUser?.esAdmin === true && esSuperadminEmail(req.authUser.email)) ||
            (req.authUser?.esModerador === true && !esSuperadminEmail(req.authUser.email))
        );

        const usuarioObjetivo = await Usuario.findById(id).select('email');
        if (!usuarioObjetivo) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const datosActualizados = {};
        if (colorSemaforo) datosActualizados.colorSemaforo = limpiarTexto(colorSemaforo, 20);
        if (descripcionPersonal !== undefined) datosActualizados.descripcionPersonal = limpiarTexto(descripcionPersonal, 400);
        if (pais !== undefined) {
            if (!esPerfilPrivilegiado && !validarPaisCodigo(pais)) {
                return res.status(400).json({ error: 'Debes seleccionar un país válido de la lista.' });
            }
            datosActualizados.pais = String(pais).toUpperCase();
        }
        if (direccionResidencia !== undefined) {
            const direccionNormalizada = normalizarDireccionSeleccionada(direccionResidencia, pais || req.authUser?.pais || '');
            if (!direccionNormalizada) {
                if (!(esPerfilPrivilegiado && !direccionResidencia)) {
                    return res.status(400).json({ error: 'Debes seleccionar una dirección válida desde las sugerencias.' });
                }
            } else {
                datosActualizados.direccionResidencia = direccionNormalizada;
                datosActualizados.localidad = direccionNormalizada.displayName;
                datosActualizados.nacionalidad = direccionNormalizada.countryName || datosActualizados.nacionalidad || '';
            }
        }
        if (preferenciasPlanes !== undefined) {
            if (!(esPerfilPrivilegiado && (preferenciasPlanes === '' || preferenciasPlanes === null))) {
                datosActualizados.preferenciasPlanes = normalizarListaOpciones(preferenciasPlanes, PLAN_PREFERENCIAS_PERMITIDAS);
            }
        }
        if (tipoUsuario) {
            if (!adminValido && !esMismoUsuario) return res.status(403).json({ error: 'No autorizado para cambiar tipo de usuario.' });
            datosActualizados.tipoUsuario = tipoUsuario;
            if (tipoUsuario === 'PROMOTOR' && verificacionPromotor === undefined && !esPerfilPrivilegiado && !adminValido) {
                return res.status(400).json({ error: 'Debes completar la verificación para activar cuenta promotor.' });
            }
        }
        if (solicitudPromotor !== undefined) datosActualizados.solicitudPromotor = limpiarTexto(solicitudPromotor, 500);
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
        if (esModerador !== undefined) {
            if (!adminValido) return res.status(403).json({ error: 'Solo el superadmin puede editar privilegios de moderador.' });
            const targetIsSuperadminEmail = esSuperadminEmail(usuarioObjetivo.email);
            if (targetIsSuperadminEmail) {
                datosActualizados.esModerador = false;
            } else {
                datosActualizados.esModerador = esModerador === true || esModerador === 'true';
            }
        }
        let verificacionPromotorSanitizada = null;
        if (verificacionPromotor !== undefined) {
            verificacionPromotorSanitizada = typeof verificacionPromotor === 'string'
                ? JSON.parse(verificacionPromotor)
                : verificacionPromotor;
            if (!esPerfilPrivilegiado && (tipoUsuario === 'PROMOTOR' || datosActualizados.tipoUsuario === 'PROMOTOR') && !verificacionPromotorCompleta(verificacionPromotorSanitizada || {})) {
                return res.status(400).json({ error: 'Para activar perfil promotor debes completar la verificación.' });
            }
            datosActualizados.verificacionPromotor = {
                tipoPromotorLegal: limpiarTexto(verificacionPromotorSanitizada?.tipoPromotorLegal || 'EMPRESA', 20),
                nombreComercial: limpiarTexto(verificacionPromotorSanitizada?.nombreComercial, 160),
                nifCif: limpiarTexto(verificacionPromotorSanitizada?.nifCif, 60),
                cargo: limpiarTexto(verificacionPromotorSanitizada?.cargo, 120),
                telefonoProfesional: limpiarTexto(verificacionPromotorSanitizada?.telefonoProfesional, 40),
                webRedSocial: limpiarTexto(verificacionPromotorSanitizada?.webRedSocial, 240),
                ciudadesOperacion: limpiarTexto(verificacionPromotorSanitizada?.ciudadesOperacion, 240),
                tipoEventos: limpiarTexto(verificacionPromotorSanitizada?.tipoEventos, 240),
                frecuenciaEventos: limpiarTexto(verificacionPromotorSanitizada?.frecuenciaEventos, 80),
                enlacePrueba: limpiarTexto(verificacionPromotorSanitizada?.enlacePrueba, 240),
                declaracionVeracidad: verificacionPromotorSanitizada?.declaracionVeracidad === true
            };
        }
        if (esSuperadminEmail(usuarioObjetivo.email)) {
            datosActualizados.esAdmin = true;
            datosActualizados.esModerador = false;
            datosActualizados.tipoUsuario = 'PROMOTOR';
            datosActualizados.promotorAprobado = true;
        }
        
        if (req.file) {
            const fotoUrl = await almacenarArchivoPublico(req.file, {
                tipo: 'perfil',
                usuarioId: id,
                cloudinaryFolder: CLOUDINARY_FOLDER,
                cloudinaryResourceType: 'image',
                cloudinaryTransformations: [
                    { width: 1080, height: 1080, crop: 'limit' },
                    { fetch_format: 'auto' },
                    { quality: 'auto:good' }
                ]
            });
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

app.put('/api/usuarios/:id/valoracion', requerirSesion, async (req, res) => {
    try {
        const { id } = req.params;
        const { eventoId, estrellas, comentario } = req.body;
        if (String(req.authUser._id) !== String(id)) {
            return res.status(403).json({ error: 'No autorizado para valorar con otro usuario.' });
        }
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

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Error en la subida de archivos: ${err.message}` });
    }
    if (err && err.message && (err.message.includes('archivo no permitido') || err.message.includes('audio no permitido') || err.message.includes('Formato'))) {
        return res.status(400).json({ error: err.message });
    }
    return next(err);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor levantado en puerto ${PORT}`);
});

app.post('/api/admin/migrar-uploads-legacy', requerirAdmin, async (req, res) => {
    try {
        const resumen = await migrarMultimediaLegacyUploads();
        res.json({ success: true, resumen });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});