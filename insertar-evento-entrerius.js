require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jmv1985jmvPlandem:DVfZxgc8NYuk7f2l@cluster0.7fui2kq.mongodb.net/plandem?retryWrites=true&w=majority&appName=Cluster0';

const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema, 'eventos');

const eventoNuevo = {
    titulo: 'Festival EntreRius',
    descripcion: 'Cinquena edicio del Festival EntreRius, que torna a la Copa d\'Aigua, un espai obert per veure les estrelles i els artistes, amb zona de restauracio foodtrucks. Caps de cartell: Lidia Pujol, Julen i Ernest Prana. Programa: divendres 3 de juliol 21:30h concert de Lidia Pujol; divendres 10 de juliol 21:30h concert de Julen; divendres 17 de juliol 21:30h concert d\'Ernest Prana.',
    fechaInicio: new Date('2026-07-03T21:30:00+02:00'),
    fechaFin: new Date('2026-07-17T23:59:59+02:00'),
    categoria: 'Musica',
    precio: 0,
    organizador: 'Ajuntament de Termens',
    esPremium: false,
    multimediaUrl: 'https://surtdecasa.cat/sites/default/files//imatges-pujades/2019T1/imatges/entrerius_0.jpg',
    multimediaTipo: 'image',
    galeria: [],
    ubicacion: {
        direccion: 'Copa d\'Aigua, Termens, Lleida, Espana',
        coordenadas: {
            latitud: 41.72320015712259,
            longitud: 0.7694137107959431
        },
        placeId: 'surtdecasa-ponent-263202',
        countryCode: 'ES',
        countryName: 'Espana'
    },
    fuente: {
        nombre: 'surtdecasa.cat',
        url: 'https://surtdecasa.cat/ponent/agenda/2026/festival-entrerius/263202',
        plataforma: 'surtdecasa.cat',
        tipo: 'Festival de musica',
        identificador: 'festival-entrerius-263202'
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
                { titulo: 'Festival EntreRius' },
                { 'fuente.identificador': 'festival-entrerius-263202' }
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
