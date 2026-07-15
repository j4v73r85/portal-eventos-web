const https = require('https');
const fs = require('fs');
const path = require('path');

const imageUrl = 'https://femturisme.cat/_fotos/agenda/main/festa-del-quadre-de-santa-rosalia-a-torredembarra.jpg';
const uploadDir = path.join(__dirname, 'uploads');
const fileName = 'festa-del-quadre.jpg';
const filePath = path.join(uploadDir, fileName);

console.log('🔗 Descargando imagen...');

https.get(imageUrl, { timeout: 30000 }, (res) => {
    if (res.statusCode !== 200) {
        console.error(`❌ HTTP ${res.statusCode}`);
        process.exit(1);
    }

    const file = fs.createWriteStream(filePath, { timeout: 30000 });
    res.pipe(file);

    file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filePath);
        console.log(`✅ Imagen descargada`);
        console.log(`📁 ${fileName}`);
        console.log(`📊 ${(stats.size / 1024).toFixed(2)} KB`);
    });

    file.on('error', (err) => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
}).on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
