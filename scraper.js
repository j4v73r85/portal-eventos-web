const { ejecutarImportacionEventos } = require('./scripts/import-eventos-core');

if (require.main === module) {
    ejecutarImportacionEventos().catch((error) => {
        console.error('La importacion de eventos fallo:', error);
        process.exitCode = 1;
    });
}

module.exports = {
    ejecutarImportacionEventos
};
