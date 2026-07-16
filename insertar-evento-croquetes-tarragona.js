require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jmv1985jmvPlandem:DVfZxgc8NYuk7f2l@cluster0.7fui2kq.mongodb.net/plandem?retryWrites=true&w=majority&appName=Cluster0';

const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema, 'eventos');

const eventoNuevo = {
    titulo: 'Concurs de croquetes - Festes de la Verge del Carme',
    descripcion: 'Certamen gastronomic de les Festes de la Verge del Carme 2026. Participa amb la teva millor croqueta. Hi ha premi a la millor croqueta, premi finalista i premi a l\'originalitat. Degustacio i tast del jurat el dissabte 18 de juliol a les 20:00 h i lliurament de premis a les 20:15 h. Inscripcions fins al 15 de juliol per WhatsApp al 620 386 972.',
    fechaInicio: new Date('2026-07-17T20:30:00+02:00'),
    fechaFin: new Date('2026-07-18T20:15:00+02:00'),
    categoria: 'Gastronomia',
    precio: 0,
    organizador: 'Associacio de Veins i Veines Verge del Carme de Tarragona',
    esPremium: false,
    multimediaUrl: 'https://www.tarragona.cat/la-ciutat/agenda/2026/festes-de-barri/concurs-croquetes-festes-verge-del-carme/imatge',
    multimediaTipo: 'image',
    galeria: [],
    ubicacion: {
        direccion: 'Creuament del carrer Francesc Bastos amb carrer Mallorca, barri del Serrallo, Tarragona',
        coordenadas: {
            latitud: 41.1148925,
            longitud: 1.2421568
        },
        placeId: 'tgn-serrallo-francesc-bastos',
        countryCode: 'ES',
        countryName: 'Espana'
    },
    fuente: {
        nombre: 'Agenda Ajuntament de Tarragona',
        url: 'https://agenda.tarragona.cat/agenda/concurs-croquetes-festes-verge-del-carme?UID=1f7a252c-7a04-45aa-8a4c-49442d6d0233',
        plataforma: 'agenda.tarragona.cat',
        tipo: 'Festes de barri / gastronomia',
        identificador: 'concurs-croquetes-verge-del-carme-2026'
    },
    creadorId: null,
    interacciones: {
        meInteresa: [],
        asistire: [],
        favoritos: []
    },
    chat: [],
    chatModeration: {
        avisados: [],
        bloqueados: []
    }
};

async function insertarEvento() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado a MongoDB');

        await Evento.deleteMany({
            $or: [
                { titulo: /croquetes|croquetas/i },
                { 'fuente.identificador': 'concurs-croquetes-verge-del-carme-2026' }
            ]
        });

        const resultado = await Evento.create(eventoNuevo);
        console.log('Evento insertado:', String(resultado._id));
        console.log('Coordenadas:', resultado.ubicacion.coordenadas);
        console.log('Imagen:', resultado.multimediaUrl);
        console.log('Fuente:', resultado.fuente.url);

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

insertarEvento();
