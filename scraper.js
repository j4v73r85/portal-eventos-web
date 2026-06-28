const axios = require('axios');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');

const URL_MI_API = 'http://localhost:3000/api/eventos';
const FEED_RSS_TORREDEMBARRA = 'https://www.diputaciodetarragona.cat/agenda/rss.xml'; 

const httpsAgent = new https.Agent({  
    rejectUnauthorized: false  
});

// AGENDA DE EMERGENCIA REAL DE TORREDEMBARRA (Si la web externa da 404 o falla)
const agendaLocalTorredembarra = [
    {
        titulo: "Nit de Sant Joan 2026",
        descripcion: "Gran verbena de San Juan en la Playa de la Paella de Torredembarra. Hoguera oficial, encendido del fuego tradicional, espectáculos pirotécnicos a pie de playa y conciertos en directo junto al mar hasta el amanecer.",
        fechaInicio: "2026-06-23T21:00:00.000Z",
        fechaFin: "2026-06-24T06:00:00.000Z",
        categoria: "Música",
        precio: 0,
        organizador: "Ajuntament de Torredembarra",
        esPremium: true,
        multimediaUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200", 
        ubicacion: {
            direccion: "Platja de la Paella, 43830 Torredembarra, Tarragona",
            coordenadas: { latitud: 41.1415, longitud: 1.4042 }
        }
    },
    {
        titulo: "Festa Major de Santa Rosalia 2026",
        descripcion: "Actos tradicionales, pasacalles con el séquito popular, bailes de diablos y castells en la Plaça del Castell de Torredembarra. Conciertos nocturnos en la carpa municipal.",
        fechaInicio: "2026-09-04T10:00:00.000Z",
        fechaFin: "2026-09-06T23:30:00.000Z",
        categoria: "Cultura y Ocio",
        precio: 0,
        organizador: "Ajuntament de Torredembarra",
        esPremium: true,
        multimediaUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200",
        ubicacion: {
            direccion: "Plaça del Castell, 43830 Torredembarra",
            coordenadas: { latitud: 41.1444, longitud: 1.3961 }
        }
    },
    {
        titulo: "Cinema a la Fresca en el Castell",
        descripcion: "Ciclo estival de cine al aire libre dentro del patio de armas del Castell de Torredembarra. Proyección de películas familiares de estreno. Trae tu silla y cena.",
        fechaInicio: "2026-07-02T22:00:00.000Z",
        fechaFin: "2026-07-02T23:59:00.000Z",
        categoria: "Otros",
        precio: 3,
        organizador: "Regidoria de Cultura Torredembarra",
        esPremium: false,
        multimediaUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600",
        ubicacion: {
            direccion: "Plaça del Castell, 43830 Torredembarra",
            coordenadas: { latitud: 41.1442, longitud: 1.3960 }
        }
    }
];

async function depredadorEventosReales() {
    console.log('🦈 MODO DEPREDADOR: Iniciando extracción de eventos...');
    let totalAnadidos = 0;
    let totalDuplicados = 0;
    let itemsAProcesar = [];

    try {
        console.log('🌐 Intentando conectar con el servidor de la Agenda Externa...');
        const respuesta = await axios.get(FEED_RSS_TORREDEMBARRA, { 
            timeout: 8000,
            httpsAgent: httpsAgent,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
        const objetoJson = parser.parse(respuesta.data);
        let items = objetoJson.rss?.channel?.item;

        if (items) {
            if (!Array.isArray(items)) items = [items];
            
            // Si el feed funciona, filtramos por Torredembarra
            const filtrados = items.filter(item => {
                const titulo = (item.title || '').toLowerCase();
                const desc = (item.description || '').toLowerCase();
                return titulo.includes('torredembarra') || desc.includes('torredembarra');
            });

            // Convertimos al formato interno
            filtrados.forEach(item => {
                let foto = item.enclosure?.url || item['media:content']?.url || item.description?.match(/src="([^"]+)"/)?.[1];
                const titulo = item.title || "Evento Local";
                let esPremium = Math.random() > 0.85;
                
                if (titulo.toLowerCase().includes('sant joan') || titulo.toLowerCase().includes('juan')) {
                    esPremium = true;
                    foto = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200";
                }

                itemsAProcesar.push({
                    titulo: titulo,
                    descripcion: (item.description || "Detalles en la agenda oficial.").replace(/<[^>]*>/g, '').substring(0, 250) + "...",
                    fechaInicio: item.pubDate || new Date().toISOString(),
                    fechaFin: item.pubDate || new Date().toISOString(),
                    categoria: item.category || "Cultura y Ocio",
                    precio: 0,
                    organizador: "Ajuntament de Torredembarra",
                    esPremium: esPremium,
                    multimediaUrl: foto || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600",
                    ubicacion: {
                        direccion: "43830 Torredembarra, Tarragona",
                        coordenadas: { 
                            latitud: 41.1444 + (Math.random() - 0.5) * 0.005,
                            longitud: 1.3961 + (Math.random() - 0.5) * 0.005
                        }
                    }
                });
            });
        }
    } catch (err) {
        console.log(`⚠️ Servidor externo inaccesible o URL cambiada (Error: ${err.message}). Activando base de datos de emergencia local...`);
        // Si hay un 404 o falla la red, cargamos nuestra agenda real precargada
        itemsAProcesar = [...agendaLocalTorredembarra];
    }

    console.log(`📥 Procesando un total de ${itemsAProcesar.length} planes en Torredembarra...`);

    for (let listo of itemsAProcesar) {
        try {
            await axios.post(URL_MI_API, listo);
            console.log(`✅ Inyectado con éxito: "${listo.titulo}" (Premium: ${listo.esPremium})`);
            totalAnadidos++;
        } catch (error) {
            if (error.response && error.response.status === 409) {
                totalDuplicados++;
            } else {
                console.error(`❌ Error al guardar "${listo.titulo}":`, error.message);
            }
        }
    }

    console.log(`\n==================================================`);
    console.log(`🎉 ¡PROCESO DE EXTRACCIÓN COMPLETADO CON ÉXITO!`);
    console.log(`🚀 Nuevos planes añadidos: ${totalAnadidos}`);
    console.log(`skip Duplicados omitidos (ya existían): ${totalDuplicados}`);
    console.log(`==================================================`);
}

depredadorEventosReales();