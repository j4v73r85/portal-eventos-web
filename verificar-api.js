const API_BASE = 'https://plandem-portal-eventos.onrender.com';

async function verificarAPI() {
    try {
        console.log('🔗 Consultando API en producción...');
        const res = await fetch(`${API_BASE}/api/eventos`);
        const eventos = await res.json();
        
        console.log(`\n📊 Total de eventos: ${eventos.length}`);
        
        const conCoordenadas = eventos.filter(ev => ev.ubicacion?.coordenadas?.latitud);
        console.log(`📍 Eventos con coordenadas: ${conCoordenadas.length}`);
        
        const festa = eventos.find(ev => ev.titulo && ev.titulo.includes('Festa del Quadre'));
        
        if (!festa) {
            console.log('\n❌ No encontrado evento "Festa del Quadre"');
            console.log('\nÚltimos 3 eventos:');
            eventos.slice(0, 3).forEach((ev, i) => {
                console.log(`\n${i+1}. ${ev.titulo}`);
                console.log(`   ubicacion:`, ev.ubicacion);
            });
            return;
        }
        
        console.log('\n✅ Evento encontrado: Festa del Quadre');
        console.log('\nEstructura completa:');
        console.log(JSON.stringify(festa, null, 2));
        
        if (festa.ubicacion?.coordenadas?.latitud) {
            console.log('\n✅ Coordenadas presentes:');
            console.log(`   Latitud: ${festa.ubicacion.coordenadas.latitud}`);
            console.log(`   Longitud: ${festa.ubicacion.coordenadas.longitud}`);
        } else {
            console.log('\n❌ Coordenadas faltantes o inválidas!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarAPI();
