require('dotenv').config();
const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema, 'eventos');

async function verificar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        const evento = await Evento.findOne({ titulo: /Festa del Quadre/ });
        if (!evento) {
            console.log('❌ No encontrado');
            return;
        }

        console.log('\n📍 Evento encontrado:');
        console.log('ID:', evento._id);
        console.log('Título:', evento.titulo);
        console.log('\nEstructura de ubicación:');
        console.log(JSON.stringify(evento.ubicacion, null, 2));

        console.log('\n🔍 Estructura esperada por normalizarUbicacionEvento:');
        console.log(`{
  displayName: string,
  latitud: number,
  longitud: number,
  placeId: string,
  countryCode: string,
  countryName: string
}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Desconectado');
    }
}

verificar();
