const https = require('https');
const fs = require('fs');
const path = require('path');

const imageUrl = 'https://femturisme.cat/_fotos/agenda/main/festa-del-quadre-de-santa-rosalia-a-torredembarra.jpg';
const uploadDir = path.join(__dirname, 'uploads');
const fileName = 'festa-del-quadre-santa-rosalia.jpg';
const filePath = path.join(uploadDir, fileName);

// Crear directorio si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

https.get(imageUrl, (res) => {
    if (res.statusCode !== 200) {
        console.error(`❌ Error: HTTP ${res.statusCode}`);
        process.exit(1);
    }

    const file = fs.createWriteStream(filePath);
    res.pipe(file);

    file.on('finish', () => {
        file.close();
        const fileSize = fs.statSync(filePath).size;
        console.log(`✅ Imagen descargada correctamente`);
        console.log(`📁 Ubicación: /uploads/${fileName}`);
        console.log(`📊 Tamaño: ${(fileSize / 1024).toFixed(2)} KB`);
        process.exit(0);
    });

    file.on('error', (err) => {
        fs.unlink(filePath, () => {});
        console.error('❌ Error escribiendo archivo:', err.message);
        process.exit(1);
    });
}).on('error', (err) => {
    console.error('❌ Error descargando imagen:', err.message);
    process.exit(1);
});
