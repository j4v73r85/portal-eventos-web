const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    ubicacion: {
        direccion: { type: String, required: true },
        coordenadas: {
            latitud: { type: Number },
            longitud: { type: Number }
        }
    },
    categoria: { type: String, required: true },
    precio: { type: Number, default: 0 },
    organizador: { type: String, required: true },
    multimediaUrl: { type: String },   
    multimediaTipo: { type: String, default: 'image' },  // Añadimos valor por defecto para evitar fallos
    esPremium: { type: Boolean, default: false },        // ¡CAMPO CLAVE! Añadido para tu carrusel Tinder
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Evento', eventoSchema);