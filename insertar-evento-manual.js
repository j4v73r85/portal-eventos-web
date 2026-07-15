require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI no está configurado en .env');
    process.exit(1);
}

const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema);

const eventoNuevo = {
    titulo: 'Festa del Quadre de Santa Rosalia a Torredembarra',
    descripcion: 'La vila de Torredembarra, situada a la costa del Baix Gaià, celebra la Festa del Quadre de Santa Rosalia. La festa gira al voltant d\'un gran quadre que representa a Santa Rosalia, situat al carrer Major de Torredembarra. Durant la celebració, els carrers es transformen en un espai festiu amb una gran quantitat de decoracions, música, danses i activitats per a tota la família. Les activitats inclouen actuacions de grups locals, tallers per als més petits i degustacions de plats típics de la zona. La Festa del Quadre de Santa Rosalia és una experiència única que combina religiositat, cultura i diversió.',
    fechaInicio: new Date('2026-07-10'),
    fechaFin: new Date('2026-07-15'),
    categoria: 'Festivales',
    precio: 0,
    organizador: 'Ajuntament de Torredembarra',
    esPremium: false,
    multimediaUrl: 'https://images.unsplash.com/photo-1533622596524-a94e432af101?w=800',
    multimediaTipo: 'image',
    galeria: [],
    ubicacion: {
        direccion: 'Torredembarra, Baix Gaià, Tarragona',
        coordenadas: { latitud: 41.2519, longitud: 1.4483 }
    },
    fuente: {
        nombre: 'femturisme.cat',
        url: 'https://femturisme.cat/agenda/festa-del-quadre-de-santa-rosalia-a-torredembarra',
        plataforma: 'femturisme.cat',
        tipo: 'Fiesta local',
        identificador: 'festa-del-quadre-2026'
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
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Borrar evento anterior (sin imagen o con imagen mala)
        console.log('🧹 Limpiando versión anterior...');
        await Evento.deleteMany({ titulo: 'Festa del Quadre de Santa Rosalia a Torredembarra' });

        console.log('📝 Insertando evento actualizado...');
        const resultado = await Evento.create(eventoNuevo);
        
        console.log('✅ Evento insertado correctamente');
        console.log(`ID del evento: ${resultado._id}`);
        console.log(`Título: ${resultado.titulo}`);
        console.log(`Fechas: ${resultado.fechaInicio.toLocaleDateString('es-ES')} - ${resultado.fechaFin.toLocaleDateString('es-ES')}`);
        console.log(`Ubicación: ${resultado.ubicacion.direccion}`);
        console.log(`Fuente: ${resultado.fuente.url}`);
        console.log(`📸 Imagen: ${resultado.multimediaUrl}`);
        
        await mongoose.disconnect();
        console.log('✅ Desconectado de MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

insertarEvento();
