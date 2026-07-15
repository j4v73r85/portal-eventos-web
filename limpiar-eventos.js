require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI no está configurado en .env');
    process.exit(1);
}

const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema);

async function limpiarEventos() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        console.log('🗑️ Eliminando todos los eventos...');
        const resultado = await Evento.deleteMany({});
        
        console.log(`✅ Se han eliminado ${resultado.deletedCount} eventos`);
        
        await mongoose.disconnect();
        console.log('✅ Desconectado de MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

limpiarEventos();
