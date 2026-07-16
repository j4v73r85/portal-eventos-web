require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jmv1985jmvPlandem:DVfZxgc8NYuk7f2l@cluster0.7fui2kq.mongodb.net/plandem?retryWrites=true&w=majority&appName=Cluster0';

const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema, 'eventos');

const eventoNuevo = {
    titulo: 'Festival Altacustic',
    descripcion: 'Nova edicio del Festival Altacustic, que torna amb musica en directe i escenaris amb encant repartits entre dos racons unics. Propostes acustiques, proximitat amb artistes i un ambient unic que es viu de veritat. Programa complet disponible a la web oficial del festival.',
    fechaInicio: new Date('2026-07-17T00:00:00+02:00'),
    fechaFin: new Date('2026-07-18T23:59:59+02:00'),
    categoria: 'Musica',
    precio: 0,
    organizador: "Ajuntament d'Altafulla",
    esPremium: false,
    multimediaUrl: 'https://surtdecasa.cat/sites/default/files//imatges-pujades/2019T1/imatges/altacustic_4.jpg',
    multimediaTipo: 'image',
    galeria: [],
    ubicacion: {
        direccion: 'Diversos espais, Altafulla, Tarragona, Espana',
        coordenadas: {
            latitud: 41.1426358,
            longitud: 1.3764111
        },
        placeId: 'surtdecasa-camp-262718',
        countryCode: 'ES',
        countryName: 'Espana'
    },
    fuente: {
        nombre: 'surtdecasa.cat',
        url: 'https://surtdecasa.cat/camp/agenda/2026/festival-altacustic/262718',
        plataforma: 'surtdecasa.cat',
        tipo: 'Festival de musica',
        identificador: 'festival-altacustic-262718'
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
                { titulo: /Festival Altacustic|Festival Altacústic/i },
                { 'fuente.identificador': 'festival-altacustic-262718' }
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
