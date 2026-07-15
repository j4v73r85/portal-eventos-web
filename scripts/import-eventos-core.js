const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const { XMLParser } = require('fast-xml-parser');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plandem';
const HTTP_TIMEOUT_MS = Number(process.env.EVENT_IMPORT_TIMEOUT_MS || 15000);
const MAX_EVENTOS_POR_FUENTE = Number(process.env.EVENT_IMPORT_MAX_ITEMS || 80);

const DEFAULT_SOURCES = [
    {
        id: 'femturisme-agenda',
        nombre: 'FemTurisme Agenda',
        plataforma: 'femturisme',
        tipo: 'discover',
        url: 'https://femturisme.cat/agenda',
        categoria: 'Turismo y cultura',
        organizador: 'FemTurisme',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'surtdecasa-agenda',
        nombre: 'Surtdecasa Agenda',
        plataforma: 'surtdecasa',
        tipo: 'discover',
        url: 'https://www.surtdecasa.cat/agenda',
        categoria: 'Cultura y ocio',
        organizador: 'Surtdecasa',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'barcelona-agenda',
        nombre: 'Barcelona Agenda',
        plataforma: 'barcelona',
        tipo: 'discover',
        url: 'https://www.barcelona.cat/ca/que-pots-fer-a-bcn/agenda',
        categoria: 'Cultura y ocio',
        organizador: 'Ajuntament de Barcelona',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'visitbarcelona-events',
        nombre: 'Visit Barcelona Events',
        plataforma: 'visitbarcelona',
        tipo: 'discover',
        url: 'https://www.visitbarcelona.com/en/events',
        categoria: 'Turismo y ocio',
        organizador: 'Barcelona Turisme',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'costabrava-agenda',
        nombre: 'Costa Brava Agenda',
        plataforma: 'costabrava',
        tipo: 'discover',
        url: 'https://costabrava.org/ca/agenda',
        categoria: 'Turismo y ocio',
        organizador: 'Costa Brava',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'turismegirona-agenda',
        nombre: 'Turisme Girona Agenda',
        plataforma: 'turismegirona',
        tipo: 'discover',
        url: 'https://www.turismegirona.cat/ca/agenda',
        categoria: 'Turismo y cultura',
        organizador: 'Turisme Girona',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'andalucia-agenda',
        nombre: 'Andalucía Agenda',
        plataforma: 'andalucia',
        tipo: 'discover',
        url: 'https://www.andalucia.org/es/agenda',
        categoria: 'Turismo y ocio',
        organizador: 'Turismo de Andalucía',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'esmadrid-agenda',
        nombre: 'ESMadrid Agenda',
        plataforma: 'esmadrid',
        tipo: 'discover',
        url: 'https://www.esmadrid.com/agenda',
        categoria: 'Turismo y ocio',
        organizador: 'Madrid Destino',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'zaragoza-turismo-eventos',
        nombre: 'Zaragoza Turismo Eventos',
        plataforma: 'zaragoza',
        tipo: 'discover',
        url: 'https://www.zaragozaturismo.es/eventos',
        categoria: 'Turismo y ocio',
        organizador: 'Zaragoza Turismo',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'torredembarra-home',
        nombre: 'Ayuntamiento de Torredembarra',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.torredembarra.cat',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Torredembarra',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'tarragona-home',
        nombre: 'Ayuntamiento de Tarragona',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.tarragona.cat',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Tarragona',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'reus-home',
        nombre: 'Ayuntamiento de Reus',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.reus.cat',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Reus',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'girona-home',
        nombre: 'Ayuntamiento de Girona',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.girona.cat',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Girona',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'lleida-home',
        nombre: 'Ayuntamiento de Lleida',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.paeria.es',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Lleida',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'barcelona-home',
        nombre: 'Ayuntamiento de Barcelona',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.barcelona.cat',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Barcelona',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'valencia-eventos',
        nombre: 'Turisme València Eventos',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.turismovalencia.es/eventos',
        categoria: 'Turismo y cultura',
        organizador: 'Turisme València',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'badalona-agenda',
        nombre: 'Ajuntament de Badalona',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.badalona.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Badalona',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'sabadell-agenda',
        nombre: 'Ajuntament de Sabadell',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.sabadell.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Sabadell',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'terrassa-agenda',
        nombre: 'Ajuntament de Terrassa',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.terrassa.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Terrassa',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'cornella-agenda',
        nombre: 'Ajuntament de Cornellà',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.cornella.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Cornellà',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'hospitalet-agenda',
        nombre: "Ajuntament de l'Hospitalet",
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.l-h.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de l\'Hospitalet',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'mataro-agenda',
        nombre: 'Ajuntament de Mataró',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.mataro.cat/ca/actualitat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Mataró',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'sitges-agenda',
        nombre: 'Ajuntament de Sitges',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.sitges.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Sitges',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'vilanova-agenda',
        nombre: 'Ajuntament de Vilanova i la Geltrú',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.vilanova.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Vilanova i la Geltrú',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'lloret-agenda',
        nombre: 'Ajuntament de Lloret de Mar',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.lloret.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Lloret de Mar',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'blanes-agenda',
        nombre: 'Ajuntament de Blanes',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.blanes.cat/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Blanes',
        esPremium: true,
        maxItems: 40
    },
    {
        id: 'murcia-turistica',
        nombre: 'Turismo Región de Murcia',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.turismoregiondemurcia.es/eventos',
        categoria: 'Turismo y cultura',
        organizador: 'Turismo Región de Murcia',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'madrid-agenda',
        nombre: 'Madrid Agenda',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.madrid.es/portal/site/munimadrid/menuitem.0e3f7e42f5e8d6c5b6d7b6d7b1b6a0a0/?vgnextoid=1f5f4d0f3c3c9610VgnVCM2000001f4a900aRCRD',
        categoria: 'Agenda municipal',
        organizador: 'Ayuntamiento de Madrid',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'visitvalencia-agenda',
        nombre: 'Visit València Agenda',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.visitvalencia.com/agenda',
        categoria: 'Turismo y cultura',
        organizador: 'Visit València',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'malaga-eventos',
        nombre: 'Turismo Málaga Eventos',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.malagaturismo.com/es/eventos',
        categoria: 'Turismo y cultura',
        organizador: 'Turismo de Málaga',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'sevilla-eventos',
        nombre: 'Sevilla Eventos',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.sevilla.org/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ayuntamiento de Sevilla',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'bilbao-agenda',
        nombre: 'Bilbao Agenda',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.bilbao.eus/cs/Satellite/bilbaoagenda/es/home',
        categoria: 'Agenda municipal',
        organizador: 'Ayuntamiento de Bilbao',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'donostia-agenda',
        nombre: 'San Sebastián Agenda',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.sansebastianturismoa.eus/es/agenda',
        categoria: 'Turismo y cultura',
        organizador: 'San Sebastián Turismo',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'palma-agenda',
        nombre: 'Palma Agenda',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.palma.cat/portal/PALMA/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ajuntament de Palma',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'cordoba-agenda',
        nombre: 'Córdoba Agenda',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.turismodecordoba.org/agenda',
        categoria: 'Turismo y cultura',
        organizador: 'Turismo de Córdoba',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'granada-agenda',
        nombre: 'Granada Agenda',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.granadatur.com/agenda',
        categoria: 'Turismo y cultura',
        organizador: 'Turismo de Granada',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'oviedo-agenda',
        nombre: 'Oviedo Agenda',
        plataforma: 'municipal',
        tipo: 'discover',
        url: 'https://www.oviedo.es/agenda',
        categoria: 'Agenda municipal',
        organizador: 'Ayuntamiento de Oviedo',
        esPremium: true,
        maxItems: 60
    },
    {
        id: 'toledo-agenda',
        nombre: 'Toledo Agenda',
        plataforma: 'turismo',
        tipo: 'discover',
        url: 'https://www.toledo-turismo.com/agenda',
        categoria: 'Turismo y cultura',
        organizador: 'Turismo de Toledo',
        esPremium: true,
        maxItems: 60
    }
];

const eventoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, default: '' },
    fechaInicio: { type: String, default: '' },
    fechaFin: { type: String, default: '' },
    categoria: { type: String, default: 'Cultura y Ocio' },
    precio: { type: Number, default: 0 },
    organizador: { type: String, default: 'Portal Eventos' },
    esPremium: { type: Boolean, default: false },
    multimediaUrl: { type: String, default: '' },
    multimediaTipo: { type: String, default: 'image' },
    galeria: { type: [String], default: [] },
    ubicacion: {
        direccion: { type: String, default: '' },
        coordenadas: {
            latitud: { type: Number, default: 0 },
            longitud: { type: Number, default: 0 }
        }
    },
    fuente: {
        nombre: { type: String, default: '' },
        url: { type: String, default: '' },
        plataforma: { type: String, default: '' },
        tipo: { type: String, default: '' },
        identificador: { type: String, default: '' }
    },
    fechaImportacion: { type: Date, default: Date.now }
}, { strict: false, timestamps: true });

const Evento = mongoose.models.Evento || mongoose.model('Evento', eventoSchema);
const parserXml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

function normalizarTexto(valor, maximo = 500) {
    return String(valor || '')
        .replace(/\s+/g, ' ')
        .replace(/<[^>]*>/g, ' ')
        .trim()
        .slice(0, maximo);
}

function normalizarCategoriaImportada(categoria = '') {
    const texto = String(categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!texto) return 'Cultura';
    if (texto.includes('music') || texto.includes('conciert') || texto.includes('musica')) return 'Musica en vivo';
    if (texto.includes('festival')) return 'Festivales';
    if (texto.includes('gastr') || texto.includes('food') || texto.includes('drink') || texto.includes('comida') || texto.includes('cena')) return 'Gastronomia';
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

function primeraCadena(...valores) {
    for (const valor of valores) {
        if (valor === null || valor === undefined) continue;
        if (Array.isArray(valor)) {
            const encontrada = primeraCadena(...valor);
            if (encontrada) return encontrada;
            continue;
        }
        if (typeof valor === 'object') {
            const encontrada = primeraCadena(valor.url, valor.href, valor.src, valor.value, valor.content, valor.text);
            if (encontrada) return encontrada;
            continue;
        }
        const texto = String(valor).trim();
        if (texto) return texto;
    }
    return '';
}

function normalizarFecha(valor) {
    if (!valor) return '';
    const texto = String(valor).trim();
    if (!texto) return '';
    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? '' : fecha.toISOString();
}

function extenderUrl(valor, baseUrl) {
    const texto = primeraCadena(valor);
    if (!texto) return '';
    try {
        return new URL(texto, baseUrl).toString();
    } catch {
        return texto;
    }
}

function extraerImagenDeHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const extraerImagenDesdeJsonLd = () => {
        const guiones = $('script[type="application/ld+json"]');
        for (let index = 0; index < guiones.length; index += 1) {
            const texto = $(guiones[index]).text();
            if (!texto || !texto.trim()) continue;
            try {
                const datos = JSON.parse(texto);
                const nodos = Array.isArray(datos) ? datos : [datos];
                for (const nodo of nodos) {
                    const entidades = Array.isArray(nodo?.['@graph']) ? nodo['@graph'] : [nodo];
                    for (const entidad of entidades) {
                        const imagen = primeraCadena(entidad?.image, entidad?.thumbnailUrl, entidad?.primaryImageOfPage);
                        const url = extenderUrl(imagen, baseUrl);
                        if (url) return url;
                    }
                }
            } catch {
                continue;
            }
        }
        return '';
    };

    const candidatos = [
        extraerImagenDesdeJsonLd(),
        $('meta[property="og:image"]').attr('content'),
        $('meta[property="og:image:secure_url"]').attr('content'),
        $('meta[name="twitter:image"]').attr('content'),
        $('meta[name="twitter:image:src"]').attr('content'),
        $('link[rel="image_src"]').attr('href'),
        $('article figure img').first().attr('src'),
        $('article .image img').first().attr('src'),
        $('article img').first().attr('src'),
        $('main img').first().attr('src'),
        $('section img').first().attr('src'),
        $('img').first().attr('src')
    ];

    for (const candidato of candidatos) {
        const url = extenderUrl(candidato, baseUrl);
        if (url) return url;
    }
    return '';
}

function extraerDescripcionDeHtml(html) {
    const $ = cheerio.load(html);
    return normalizarTexto(
        primeraCadena(
            $('meta[property="og:description"]').attr('content'),
            $('meta[name="description"]').attr('content'),
            $('article p').first().text(),
            $('main p').first().text(),
            $('p').first().text()
        ),
        700
    );
}

function extraerTituloDeHtml(html) {
    const $ = cheerio.load(html);
    return normalizarTexto(
        primeraCadena(
            $('meta[property="og:title"]').attr('content'),
            $('meta[name="twitter:title"]').attr('content'),
            $('title').text(),
            $('h1').first().text()
        ),
        220
    );
}

function extraerUrlsDeTextoRobots(texto = '') {
    return String(texto || '')
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter((linea) => /^sitemap:\s*/i.test(linea))
        .map((linea) => linea.replace(/^sitemap:\s*/i, '').trim())
        .filter(Boolean);
}

function recolectarLocsXml(nodo, acumulador = []) {
    if (!nodo) return acumulador;
    if (Array.isArray(nodo)) {
        nodo.forEach((item) => recolectarLocsXml(item, acumulador));
        return acumulador;
    }
    if (typeof nodo === 'object') {
        if (typeof nodo.loc === 'string' && nodo.loc.trim()) {
            acumulador.push(nodo.loc.trim());
        }
        Object.values(nodo).forEach((valor) => recolectarLocsXml(valor, acumulador));
    }
    return acumulador;
}

async function obtenerUrlsDesdeSitemap(baseUrl, limite = 100) {
    const base = new URL(baseUrl);
    const candidatos = [
        new URL('/robots.txt', base).toString(),
        new URL('/sitemap.xml', base).toString(),
        new URL('/sitemap_index.xml', base).toString(),
        new URL('/sitemap-index.xml', base).toString()
    ];

    const urlsSitemap = new Set();

    for (const candidato of candidatos) {
        try {
            const respuesta = await axios.get(candidato, {
                timeout: HTTP_TIMEOUT_MS,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlandemBot/1.0; +https://plandem.es)' }
            });

            const texto = String(respuesta.data || '');
            if (candidato.endsWith('robots.txt')) {
                extraerUrlsDeTextoRobots(texto).forEach((url) => urlsSitemap.add(url));
                continue;
            }

            const xml = parserXml.parse(texto);
            recolectarLocsXml(xml).forEach((url) => urlsSitemap.add(url));
        } catch {
            continue;
        }
    }

    const urlsFiltradas = Array.from(urlsSitemap)
        .map((url) => {
            try {
                return new URL(url, base).toString();
            } catch {
                return '';
            }
        })
        .filter(Boolean)
        .filter((url) => esUrlAgendaRelacionada(url));

    return urlsFiltradas.slice(0, limite);
}

function normalizarFuenteConfig(fuente, indice = 0) {
    return {
        id: fuente.id || fuente.nombre || `fuente-${indice + 1}`,
        nombre: fuente.nombre || fuente.id || `Fuente ${indice + 1}`,
        plataforma: fuente.plataforma || fuente.tipo || 'rss',
        tipo: fuente.tipo || fuente.plataforma || 'rss',
        url: fuente.url || '',
        selectorItem: fuente.selectorItem || '',
        selectorTitulo: fuente.selectorTitulo || '',
        selectorDescripcion: fuente.selectorDescripcion || '',
        selectorImagen: fuente.selectorImagen || '',
        selectorFecha: fuente.selectorFecha || '',
        selectorEnlace: fuente.selectorEnlace || '',
        selectorCategoria: fuente.selectorCategoria || '',
        selectorOrganizador: fuente.selectorOrganizador || '',
        categoria: fuente.categoria || 'Cultura y Ocio',
        organizador: fuente.organizador || fuente.nombre || 'Portal Eventos',
        ubicacion: fuente.ubicacion || null,
        precio: Number.isFinite(Number(fuente.precio)) ? Number(fuente.precio) : 0,
        esPremium: fuente.esPremium === true,
        enriquecerPagina: fuente.enriquecerPagina !== false,
        maxItems: Number.isFinite(Number(fuente.maxItems)) ? Number(fuente.maxItems) : MAX_EVENTOS_POR_FUENTE,
        maxDescubiertos: Number.isFinite(Number(fuente.maxDescubiertos)) ? Number(fuente.maxDescubiertos) : 24,
        profundidadDescubrimiento: Number.isFinite(Number(fuente.profundidadDescubrimiento)) ? Number(fuente.profundidadDescubrimiento) : 1
    };
}

function leerFuentesConfiguradas() {
    const crudas = process.env.EVENT_IMPORT_SOURCES_JSON;
    if (!crudas) return DEFAULT_SOURCES;

    try {
        const fuentes = JSON.parse(crudas);
        if (!Array.isArray(fuentes) || fuentes.length === 0) return DEFAULT_SOURCES;
        return fuentes
            .map((fuente, indice) => normalizarFuenteConfig(fuente, indice))
            .filter((fuente) => fuente.url || fuente.selectorItem);
    } catch (error) {
        console.warn(`Aviso: EVENT_IMPORT_SOURCES_JSON no es JSON valido. Se usaran fuentes por defecto. (${error.message})`);
        return DEFAULT_SOURCES;
    }
}

function esUrlAgendaRelacionada(href = '') {
    const valor = String(href || '').toLowerCase();
    return /agenda|event|eventos|activitat|activitats|calendari|calendario|programa|que-fer|quefer|whatson|culture|cultura|festival|fiesta|festa/.test(valor);
}

function extraerCandidatosEnlacesAgenda($, baseUrl) {
    const candidatos = [];
    const vistos = new Set();

    $('a[href]').each((_, elemento) => {
        const hrefCrudo = $(elemento).attr('href');
        if (!hrefCrudo) return;

        let href = '';
        try {
            href = new URL(hrefCrudo, baseUrl).toString();
        } catch {
            return;
        }

        if (vistos.has(href)) return;
        const texto = normalizarTexto($(elemento).text(), 200);
        const contexto = normalizarTexto($(elemento).parent().text(), 260);
        const combinado = `${href} ${texto} ${contexto}`.toLowerCase();

        if (!esUrlAgendaRelacionada(combinado)) return;
        vistos.add(href);
        candidatos.push({ href, texto, contexto });
    });

    return candidatos;
}

function extraerTituloDelElemento($, elemento, fuente) {
    const nodo = $(elemento);
    return normalizarTexto(
        primeraCadena(
            nodo.find(fuente.selectorTitulo).first().text(),
            nodo.find('h1').first().text(),
            nodo.find('h2').first().text(),
            nodo.find('h3').first().text(),
            nodo.text()
        ),
        220
    );
}

function extraerFechaDelElemento($, elemento, fuente) {
    const nodo = $(elemento);
    const candidato = primeraCadena(
        nodo.find(fuente.selectorFecha).first().text(),
        nodo.find('time').first().attr('datetime'),
        nodo.find('time').first().text(),
        nodo.attr('datetime'),
        nodo.text().match(/\b\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de\s+\d{4})?/i)?.[0]
    );
    return normalizarFecha(candidato);
}

async function descubrirEventosDesdeHtml(fuente, nivel = 0) {
    const respuesta = await axios.get(fuente.url, {
        timeout: HTTP_TIMEOUT_MS,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PlandemBot/1.0; +https://plandem.es)'
        }
    });

    const $ = cheerio.load(respuesta.data);
    const candidatosEnlaces = extraerCandidatosEnlacesAgenda($, fuente.url).slice(0, fuente.maxDescubiertos);
    const candidatosSitemap = await obtenerUrlsDesdeSitemap(fuente.url, fuente.maxDescubiertos).catch(() => []);
    const candidatos = [];
    const vistos = new Set();

    const agregarCandidato = (candidato) => {
        const url = String(candidato?.href || candidato?.url || '').trim();
        if (!url || vistos.has(url)) return;
        vistos.add(url);
        candidatos.push(candidato);
    };

    candidatosSitemap.forEach((url) => agregarCandidato({ href: url, texto: '', contexto: '' }));
    candidatosEnlaces.forEach((candidato) => agregarCandidato(candidato));

    if (candidatos.length === 0 && fuente.selectorItem) {
        const elementos = $(fuente.selectorItem).toArray().slice(0, fuente.maxItems);
        return elementos.map((elemento) => construirEventoDesdeHtml($, elemento, fuente)).filter((evento) => evento.titulo);
    }

    const eventos = [];
    for (const candidato of candidatos) {
        try {
            const preview = fuente.enriquecerPagina ? await obtenerPreviewDesdePagina(candidato.href) : {};
            const titulo = normalizarTexto(
                primeraCadena(
                    preview.titulo,
                    candidato.texto,
                    extraerTituloDeHtml(respuesta.data),
                    fuente.nombre
                ),
                220
            );
            const descripcion = normalizarTexto(
                primeraCadena(preview.descripcion, candidato.contexto, `Evento importado desde ${fuente.nombre}`),
                900
            );

            eventos.push({
                titulo,
                descripcion,
                fechaInicio: extraerFechaDelElemento($, $("a[href='" + candidato.href + "']").first().parent(), fuente) || new Date().toISOString(),
                fechaFin: extraerFechaDelElemento($, $("a[href='" + candidato.href + "']").first().parent(), fuente) || new Date().toISOString(),
                categoria: normalizarCategoriaImportada(fuente.categoria),
                precio: fuente.precio,
                organizador: fuente.organizador,
                esPremium: false,
                multimediaUrl: preview.imagen || extraerImagenDeHtml(respuesta.data, fuente.url),
                multimediaTipo: 'image',
                galeria: preview.imagen ? [preview.imagen] : [],
                ubicacion: fuente.ubicacion || {
                    direccion: fuente.nombre,
                    coordenadas: { latitud: 0, longitud: 0 }
                },
                fuente: {
                    nombre: fuente.nombre,
                    url: candidato.href,
                    plataforma: fuente.plataforma,
                    tipo: fuente.tipo,
                    identificador: ''
                }
            });
        } catch {
            continue;
        }
    }

    return eventos.filter((evento) => evento.titulo);
}

async function obtenerPreviewDesdePagina(url) {
    if (!url) return {};
    try {
        const respuesta = await axios.get(url, {
            timeout: HTTP_TIMEOUT_MS,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PlandemBot/1.0; +https://plandem.es)'
            }
        });

        return {
            imagen: extraerImagenDeHtml(respuesta.data, url),
            descripcion: extraerDescripcionDeHtml(respuesta.data)
        };
    } catch {
        return {};
    }
}

function extraerLinkRss(item) {
    return primeraCadena(
        item.link,
        item.id,
        item.guid,
        item.url,
        item.enclosure?.url,
        item['media:content']?.url
    );
}

function extraerFechasRss(item) {
    const inicio = normalizarFecha(
        primeraCadena(item.pubDate, item.published, item.updated, item['dc:date'], item.date)
    );
    const fin = normalizarFecha(
        primeraCadena(item['media:expirationDate'], item.endDate, item.finishDate, inicio)
    );
    return { inicio, fin: fin || inicio };
}

function construirEventoDesdeRss(item, fuente, preview = {}) {
    const titulo = normalizarTexto(primeraCadena(item.title, preview.titulo, fuente.nombre), 180) || fuente.nombre;
    const descripcion = normalizarTexto(
        primeraCadena(
            item.description,
            item.summary,
            item['content:encoded'],
            preview.descripcion,
            `Evento importado desde ${fuente.nombre}`
        ),
        900
    );
    const imagen = primeraCadena(item.enclosure?.url, item['media:content']?.url, preview.imagen);
    const categoria = normalizarCategoriaImportada(primeraCadena(item.category, fuente.categoria));
    const organizador = normalizarTexto(primeraCadena(item.author, fuente.organizador), 120) || fuente.organizador;
    const link = primeraCadena(item.link, item.id, item.guid);
    const fechas = extraerFechasRss(item);

    return {
        titulo,
        descripcion,
        fechaInicio: fechas.inicio || new Date().toISOString(),
        fechaFin: fechas.fin || fechas.inicio || new Date().toISOString(),
        categoria,
        precio: fuente.precio,
        organizador,
        esPremium: false,
        multimediaUrl: imagen || preview.imagen || '',
        multimediaTipo: 'image',
        galeria: imagen ? [imagen] : [],
        ubicacion: fuente.ubicacion || {
            direccion: fuente.nombre,
            coordenadas: { latitud: 0, longitud: 0 }
        },
        fuente: {
            nombre: fuente.nombre,
            url: link || fuente.url,
            plataforma: fuente.plataforma,
            tipo: fuente.tipo,
            identificador: ''
        }
    };
}

function construirEventoDesdeHtml($, elemento, fuente) {
    const leer = (selector) => normalizarTexto($(elemento).find(selector).first().text(), 500);
    const leerAtributo = (selector, atributo) => extenderUrl($(elemento).find(selector).first().attr(atributo), fuente.url);

    const titulo = normalizarTexto(primeraCadena(leer(fuente.selectorTitulo)), 180) || fuente.nombre;
    const enlace = primeraCadena(leerAtributo(fuente.selectorEnlace || 'a', 'href')) || fuente.url;
    const imagen = primeraCadena(leerAtributo(fuente.selectorImagen || 'img', 'src'));
    const descripcion = normalizarTexto(primeraCadena(leer(fuente.selectorDescripcion), titulo), 900);
    const categoria = normalizarCategoriaImportada(primeraCadena(leer(fuente.selectorCategoria), fuente.categoria));
    const organizador = normalizarTexto(primeraCadena(leer(fuente.selectorOrganizador), fuente.organizador), 120) || fuente.organizador;
    const fechaInicio = normalizarFecha(primeraCadena(leer(fuente.selectorFecha), new Date().toISOString())) || new Date().toISOString();

    return {
        titulo,
        descripcion,
        fechaInicio,
        fechaFin: fechaInicio,
        categoria,
        precio: fuente.precio,
        organizador,
        esPremium: false,
        multimediaUrl: imagen || '',
        multimediaTipo: 'image',
        galeria: imagen ? [imagen] : [],
        ubicacion: fuente.ubicacion || {
            direccion: fuente.nombre,
            coordenadas: { latitud: 0, longitud: 0 }
        },
        fuente: {
            nombre: fuente.nombre,
            url: enlace,
            plataforma: fuente.plataforma,
            tipo: fuente.tipo,
            identificador: ''
        }
    };
}

function crearIdentificadorFuente(fuente, evento) {
    const base = [
        fuente.id || fuente.nombre || fuente.url || 'fuente',
        evento.fuente?.url || '',
        evento.titulo || '',
        evento.fechaInicio || '',
        evento.multimediaUrl || ''
    ].join('|');

    return crypto.createHash('sha1').update(base).digest('hex');
}

async function guardarEventoNormalizado(fuente, evento) {
    const identificador = crearIdentificadorFuente(fuente, evento);
    const filtro = { 'fuente.identificador': identificador };
    const ahora = new Date();
    const docExistente = await Evento.findOne(filtro);

    const datosFinales = {
        ...evento,
        fuente: {
            ...evento.fuente,
            identificador
        },
        fechaImportacion: ahora
    };

    if (docExistente) {
        Object.assign(docExistente, datosFinales);
        await docExistente.save();
        return 'actualizado';
    }

    await Evento.create(datosFinales);
    return 'creado';
}

async function extraerEventosDesdeRss(fuente) {
    const respuesta = await axios.get(fuente.url, {
        timeout: HTTP_TIMEOUT_MS,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PlandemBot/1.0; +https://plandem.es)'
        }
    });

    const feed = parserXml.parse(respuesta.data);
    const itemsRss = feed.rss?.channel?.item || feed.feed?.entry || [];
    const items = Array.isArray(itemsRss) ? itemsRss : [itemsRss];
    const eventos = [];

    for (const item of items.slice(0, fuente.maxItems)) {
        const link = extraerLinkRss(item);
        const preview = fuente.enriquecerPagina && link ? await obtenerPreviewDesdePagina(link) : {};
        const evento = construirEventoDesdeRss(item, fuente, preview);
        eventos.push(evento);
    }

    return eventos.filter((evento) => evento.titulo);
}

async function extraerEventosDesdeHtml(fuente) {
    const respuesta = await axios.get(fuente.url, {
        timeout: HTTP_TIMEOUT_MS,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PlandemBot/1.0; +https://plandem.es)'
        }
    });

    const $ = cheerio.load(respuesta.data);
    const elementos = $(fuente.selectorItem).toArray();
    const eventos = [];

    for (const elemento of elementos.slice(0, fuente.maxItems)) {
        eventos.push(construirEventoDesdeHtml($, elemento, fuente));
    }

    return eventos.filter((evento) => evento.titulo);
}

async function importarFuente(fuente) {
    if (!fuente.url && !fuente.selectorItem) {
        return { creados: 0, actualizados: 0, omitidos: 0, error: 'Fuente sin url ni selectorItem' };
    }

    let eventos = [];
    if ((fuente.tipo || fuente.plataforma || '').toLowerCase() === 'html') {
        eventos = await extraerEventosDesdeHtml(fuente);
    } else if ((fuente.tipo || fuente.plataforma || '').toLowerCase() === 'discover') {
        eventos = await descubrirEventosDesdeHtml(fuente);
    } else {
        eventos = await extraerEventosDesdeRss(fuente);
    }

    let creados = 0;
    let actualizados = 0;
    let omitidos = 0;

    for (const evento of eventos) {
        try {
            const resultado = await guardarEventoNormalizado(fuente, evento);
            if (resultado === 'creado') creados += 1;
            if (resultado === 'actualizado') actualizados += 1;
        } catch (error) {
            omitidos += 1;
            console.warn(`No se pudo guardar "${evento.titulo}": ${error.message}`);
        }
    }

    return { creados, actualizados, omitidos, total: eventos.length };
}

async function ejecutarImportacionEventos({ fuentes = leerFuentesConfiguradas() } = {}) {
    await mongoose.connect(MONGODB_URI);

    const resumen = {
        fuentesProcesadas: 0,
        creados: 0,
        actualizados: 0,
        omitidos: 0,
        errores: []
    };

    try {
        for (const fuente of fuentes) {
            console.log(`Importando eventos desde ${fuente.nombre}...`);
            try {
                const resultado = await importarFuente(fuente);
                resumen.fuentesProcesadas += 1;
                resumen.creados += resultado.creados;
                resumen.actualizados += resultado.actualizados;
                resumen.omitidos += resultado.omitidos;
                console.log(`Resultado ${fuente.nombre}: ${resultado.creados} creados, ${resultado.actualizados} actualizados, ${resultado.omitidos} omitidos.`);
            } catch (error) {
                resumen.errores.push({ fuente: fuente.nombre, error: error.message });
                console.error(`Error importando ${fuente.nombre}: ${error.message}`);
            }
        }

        console.log('Importacion diaria de eventos completada.');
        console.log(JSON.stringify(resumen, null, 2));
        return resumen;
    } finally {
        await mongoose.disconnect().catch(() => {});
    }
}

module.exports = {
    ejecutarImportacionEventos,
    leerFuentesConfiguradas
};