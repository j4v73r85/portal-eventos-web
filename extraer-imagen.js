const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://femturisme.cat/agenda/festa-del-quadre-de-santa-rosalia-a-torredembarra';

https.get(url, (res) => {
    let html = '';
    
    res.on('data', (chunk) => {
        html += chunk;
    });
    
    res.on('end', () => {
        // Buscar todas las imágenes en el HTML
        const srcMatches = html.match(/src=["']([^"']*\.(?:jpg|jpeg|png|webp))["']/gi);
        const metaMatches = html.match(/content=["']([^"']*\.(?:jpg|jpeg|png|webp))["']/gi);
        
        console.log('🔍 Imágenes encontradas en src:');
        if (srcMatches) {
            srcMatches.slice(0, 10).forEach((m, i) => {
                const url = m.replace(/src=["']|["']/g, '');
                console.log(`${i + 1}. ${url}`);
            });
        }
        
        console.log('\n🔍 Imágenes encontradas en meta:');
        if (metaMatches) {
            metaMatches.slice(0, 5).forEach((m, i) => {
                const url = m.replace(/content=["']|["']/g, '');
                console.log(`${i + 1}. ${url}`);
            });
        }
        
        // Buscar específicamente para imágenes del evento (que típicamente están en la página principal)
        const eventImageRegex = /(?:og:image|twitter:image)[^>]*content=["']([^"']+)["']/gi;
        let eventImageMatch;
        console.log('\n🎯 Open Graph / Twitter image:');
        if ((eventImageMatch = eventImageRegex.exec(html)) !== null) {
            console.log(eventImageMatch[1]);
        } else {
            console.log('No encontrada meta Open Graph image');
        }
    });
}).on('error', (error) => {
    console.error('Error:', error.message);
});
