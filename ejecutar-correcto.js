require('dotenv').config();
const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema, 'eventos');

async function insertarCorrectamente() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔗 Conectando a MongoDB...');
        console.log('✅ Conectado a MongoDB\n');

        // 1. Eliminar TODOS los eventos con "Festa del Quadre" en el título
        console.log('🧹 Limpiando versiones anteriores...');
        const resultado = await Evento.deleteMany({ 
            titulo: { $regex: 'Festa del Quadre', $options: 'i' }
        });
        console.log(`   Eliminados: ${resultado.deletedCount} evento(s)\n`);

        // 2. Insertar con estructura correcta
        console.log('📝 Insertando evento con ubicación correcta...');
        
        const nuevoEvento = new Evento({
            titulo: 'Festa del Quadre de Santa Rosalia a Torredembarra',
            descripcion: 'Del 10 al 15 de juliol Torredembarra celebra un any més la Festa del Quadre de Santa Rosalia! La vila de Torredembarra, situada a la costa del Baix Gaià, és una destinació que combina platja, muntanya i patrimoni cultural. En aquesta festa tradicional, tota la comunitat es posa a treballar per preparar les millors propostes gastronòmiques, activitats familiars i actuacions musicals. És una ocasió única per descobrir les tradicions locals, degustar productes típics i disfrutar de la companyia dels seus habitants.',
            categoria: 'Festivales',
            fechaInicio: new Date('2026-07-10'),
            fechaFin: new Date('2026-07-15'),
            precio: 0,
            esPremium: false,
            organizador: 'Ajuntament de Torredembarra',
            ubicacion: {
                direccion: 'Torredembarra, Baix Gaià, Tarragona, España',
                coordenadas: {
                    latitud: 41.2519,
                    longitud: 1.4483
                },
                placeId: 'ChIJVVVVVVVVVBIRxxxxxx',
                countryCode: 'ES',
                countryName: 'España'
            },
            multimediaUrl: 'https://femturisme.cat/_fotos/agenda/main/festa-del-quadre-de-santa-rosalia-a-torredembarra.jpg',
            fuente: {
                nombre: 'femturisme.cat',
                url: 'https://femturisme.cat/agenda/festa-del-quadre-de-santa-rosalia-a-torredembarra',
                plataforma: 'femturisme.cat',
                tipo: 'Fiesta local',
                identificador: 'festa-del-quadre-2026'
            },
            usuarioId: null,
            interacciones: [],
            chat: [],
            audiosEnVivo: []
        });

        const eventoGuardado = await nuevoEvento.save();
        console.log('✅ Evento insertado correctamente\n');
        console.log(`ID del evento: ${eventoGuardado._id}`);
        console.log(`Título: ${eventoGuardado.titulo}`);
        console.log(`Categoría: ${eventoGuardado.categoria}`);
        console.log(`Ubicación: ${eventoGuardado.ubicacion.direccion}`);
        console.log(`Coordenadas: ${eventoGuardado.ubicacion.coordenadas.latitud}, ${eventoGuardado.ubicacion.coordenadas.longitud}`);
        console.log(`Imagen: ${eventoGuardado.multimediaUrl}`);
        console.log(`Fuente: ${eventoGuardado.fuente.url}\n`);

        // Verificar que se guardó correctamente
        const verificar = await Evento.findById(eventoGuardado._id);
        console.log('🔍 Verificación de datos guardados:');
        console.log(`   Latitud: ${verificar.ubicacion.coordenadas.latitud}`);
        console.log(`   Longitud: ${verificar.ubicacion.coordenadas.longitud}`);
        
        if (verificar.ubicacion.coordenadas.latitud === 41.2519) {
            console.log('   ✅ Coordenadas correctas!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Desconectado de MongoDB');
    }
}

insertarCorrectamente();
