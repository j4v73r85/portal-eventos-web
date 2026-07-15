const { ejecutarImportacionEventos } = require('./import-eventos-core');

ejecutarImportacionEventos().catch((error) => {
    console.error('La importacion diaria de eventos fallo:', error);
    process.exitCode = 1;
});