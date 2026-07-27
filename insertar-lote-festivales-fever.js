require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jmv1985jmvPlandem:DVfZxgc8NYuk7f2l@cluster0.7fui2kq.mongodb.net/plandem?retryWrites=true&w=majority&appName=Cluster0';
const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema, 'eventos');

const FESTIVALES = [
  {
    slug: 'hallowfest-fabrik',
    sourceUrl: 'https://feverup.com/m/664041',
    title: 'Hallowfest 2026 en FABRIK',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/32ae7590-8410-11f1-a9e2-de429b62a75b.png',
    shortDescription: 'Halloween masivo en FABRIK con las principales marcas de la sala, pasaje del terror gigante, mas de 100 actores y una produccion audiovisual descomunal.',
    startDate: '2026-10-31',
    endDate: '2026-10-31',
    venueOrArea: 'Fabrik',
    city: 'Humanes de Madrid',
    provinceOrRegion: 'Madrid',
    country: 'ES',
    category: 'Musica',
    price: 35,
    organizer: 'Fabrik',
    lat: 40.2586,
    lon: -3.8326,
    address: 'Avenida de la Industria, 82, Humanes de Madrid, Madrid, Espana'
  },
  {
    slug: 'bime-bilbao',
    sourceUrl: 'https://feverup.com/m/665020',
    title: 'BIME Bilbao 2026',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/3753916c-6894-11f1-b95e-b271acf4a41b.jpg',
    shortDescription: 'Encuentro internacional de la industria musical con showcases, networking, charlas y actividades profesionales en el Palacio Euskalduna de Bilbao.',
    startDate: '2026-10-27',
    endDate: '2026-10-29',
    venueOrArea: 'Palacio Euskalduna',
    city: 'Bilbao',
    provinceOrRegion: 'Vizcaya',
    country: 'ES',
    category: 'Musica',
    price: 79.5,
    organizer: 'BIME',
    lat: 43.2686,
    lon: -2.9461,
    address: 'Abandoibarra Etorb., 4, Bilbao, Vizcaya, Espana'
  },
  {
    slug: 'bilbao-bbk-live-fever',
    sourceUrl: 'https://feverup.com/m/683042',
    title: 'Bilbao BBK Live 2027',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/dfe2a118-79f3-11f1-84c3-8abda91e7848.jpg',
    shortDescription: 'Festival de tres dias en Kobetamendi con una mezcla enorme de artistas internacionales, nacionales, gastronomia y naturaleza sobre Bilbao.',
    startDate: '2027-07-08',
    endDate: '2027-07-10',
    venueOrArea: 'Monte Kobetamendi',
    city: 'Bilbao',
    provinceOrRegion: 'Vizcaya',
    country: 'ES',
    category: 'Musica',
    price: 125,
    organizer: 'Bilbao BBK Live',
    lat: 43.2489,
    lon: -2.9607,
    address: 'Kobetamendi, Bilbao, Vizcaya, Espana'
  },
  {
    slug: 'azkena-rock-festival',
    sourceUrl: 'https://feverup.com/m/665023',
    title: 'Azkena Rock Festival 2027 - 25 Aniversario',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/178b6882-6669-11f1-9223-422a123aad15.png',
    shortDescription: 'Edicion del 25 aniversario del Azkena Rock Festival con tres dias de rock, energia, actividades familiares y ambiente unico en Mendizabala.',
    startDate: '2027-06-17',
    endDate: '2027-06-19',
    venueOrArea: 'Recinto Mendizabala',
    city: 'Vitoria-Gasteiz',
    provinceOrRegion: 'Alava',
    country: 'ES',
    category: 'Musica',
    price: 125,
    organizer: 'Azkena Rock Festival',
    lat: 42.8467,
    lon: -2.6926,
    address: 'Portal de Lasarte Kalea, Vitoria-Gasteiz, Alava, Espana'
  },
  {
    slug: 'sansan-festival-fever',
    sourceUrl: 'https://feverup.com/m/438429',
    title: 'SanSan Festival 2026',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/03fc3de2-2383-11f1-839d-7638ffaece72.jpeg',
    shortDescription: 'Tres dias de musica en directo junto al mar para abrir la temporada festivalera en Benicassim con ambiente mediterraneo y gran cartel.',
    startDate: '2027-04-02',
    endDate: '2027-04-04',
    venueOrArea: 'Recinto de festivales de Benicassim',
    city: 'Benicassim',
    provinceOrRegion: 'Castellon',
    country: 'ES',
    category: 'Musica',
    price: null,
    organizer: 'SanSan Festival',
    lat: 40.0485,
    lon: 0.0484,
    address: 'N-340, km 986.3, Benicassim, Castellon, Espana'
  },
  {
    slug: 'zevra-festival',
    sourceUrl: 'https://feverup.com/m/610548',
    title: 'Zevra Festival 2026',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/4f635b30-3d96-11f1-a126-7ade1836ab9d.jpg',
    shortDescription: 'Festival de musica urbana, regueton y pop latino frente al mar en Cullera, con un gran cartel y ambiente pensado para vivir el verano al maximo.',
    startDate: '2026-07-24',
    endDate: '2026-07-27',
    venueOrArea: 'Zevra Festival',
    city: 'Cullera',
    provinceOrRegion: 'Valencia',
    country: 'ES',
    category: 'Musica',
    price: null,
    organizer: 'Zevra Festival',
    lat: 39.1647,
    lon: -0.2542,
    address: 'Plaça Numero 22, 74, Cullera, Valencia, Espana'
  },
  {
    slug: 'primavera-sound-barcelona-fever',
    sourceUrl: 'https://feverup.com/m/662776',
    title: 'Primavera Sound Barcelona 2027',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/1e0123a2-6437-11f1-9765-eaf5cec07c12.jpg',
    shortDescription: 'La 25 edicion de Primavera Sound vuelve al Parc del Forum para reunir durante tres dias una programacion global que marca tendencia en la musica contemporanea.',
    startDate: '2027-06-03',
    endDate: '2027-06-05',
    venueOrArea: 'Parc del Forum',
    city: 'Sant Adria de Besos',
    provinceOrRegion: 'Barcelona',
    country: 'ES',
    category: 'Musica',
    price: 285,
    organizer: 'Primavera Sound',
    lat: 41.4121,
    lon: 2.2268,
    address: 'Carrer de la Pau, 12, Sant Adria de Besos, Barcelona, Espana'
  },
  {
    slug: 'festival-cruilla-fever',
    sourceUrl: 'https://feverup.com/m/695311',
    title: 'Festival Cruilla 2027',
    imageUrl: 'https://applications-media.feverup.com/image/upload/f_auto,w_550,h_550/fever2/plan/photo/767f9a6e-68eb-11f1-ad35-8a4ae222aaed.jpg',
    shortDescription: 'Cruilla regresa al Parc del Forum con musica, comedia, artes y una experiencia de verano muy completa para vivir varios dias de festival en Barcelona.',
    startDate: '2027-07-07',
    endDate: '2027-07-10',
    venueOrArea: 'Parc del Forum',
    city: 'Sant Adria de Besos',
    provinceOrRegion: 'Barcelona',
    country: 'ES',
    category: 'Musica',
    price: 125,
    organizer: 'Festival Cruilla',
    lat: 41.4121,
    lon: 2.2268,
    address: 'Carrer de la Pau, 12, Sant Adria de Besos, Barcelona, Espana'
  }
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  await Evento.deleteMany({ 'fuente.identificador': { $in: FESTIVALES.map((f) => `fever-${f.slug}`) } });

  for (const item of FESTIVALES) {
    const evento = {
      titulo: item.title,
      descripcion: item.shortDescription,
      fechaInicio: item.startDate ? new Date(`${item.startDate}T12:00:00`) : null,
      fechaFin: item.endDate ? new Date(`${item.endDate}T23:59:59`) : null,
      categoria: item.category,
      precio: item.price,
      organizador: item.organizer || 'Organizacion del festival',
      esPremium: false,
      multimediaUrl: item.imageUrl,
      multimediaTipo: 'image',
      galeria: [],
      ubicacion: {
        direccion: item.address,
        coordenadas: {
          latitud: item.lat,
          longitud: item.lon
        },
        placeId: `fever-${item.slug}`,
        countryCode: item.country,
        countryName: item.country === 'ES' ? 'Espana' : item.country
      },
      fuente: {
        nombre: 'Fever',
        url: item.sourceUrl,
        plataforma: 'feverup.com',
        tipo: 'Festival',
        identificador: `fever-${item.slug}`
      },
      creadorId: null,
      interacciones: {
        meInteresa: [],
        asistire: [],
        favoritos: []
      },
      chat: [],
      chatModeration: {
        avisados: [],
        bloqueados: []
      }
    };

    const creado = await Evento.create(evento);
    console.log(`Insertado: ${creado.titulo}`);
  }

  console.log(`Total Fever insertados: ${FESTIVALES.length}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
