#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jmv1985jmvPlandem:DVfZxgc8NYuk7f2l@cluster0.7fui2kq.mongodb.net/plandem?retryWrites=true&w=majority&appName=Cluster0';

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
    multimediaUrl: 'https://femturisme.cat/_fotos/agenda/main/festa-del-quadre-de-santa-rosalia-a-torredembarra.jpg',
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
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Conectado a MongoDB');

        console.log('🧹 Limpiando versión anterior...');
        await Evento.deleteMany({ titulo: 'Festa del Quadre de Santa Rosalia a Torredembarra' });

        console.log('📝 Insertando evento...');
        const resultado = await Evento.create(eventoNuevo);
        
        console.log('✅ Evento insertado correctamente');
        console.log(`ID del evento: ${resultado._id}`);
        console.log(`Título: ${resultado.titulo}`);
        console.log(`Fechas: ${resultado.fechaInicio.toLocaleDateString('es-ES')} - ${resultado.fechaFin.toLocaleDateString('es-ES')}`);
        console.log(`Ubicación: ${resultado.ubicacion.direccion}`);
        console.log(`Fuente: ${resultado.fuente.url}`);
        console.log(`📸 Imagen: https://femturisme.cat/_fotos/agenda/main/festa-del-quadre-de-santa-rosalia-a-torredembarra.jpg`);
        
        await mongoose.disconnect();
        console.log('✅ Desconectado de MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

insertarEvento();
