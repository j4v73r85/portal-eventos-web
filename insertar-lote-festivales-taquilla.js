require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jmv1985jmvPlandem:DVfZxgc8NYuk7f2l@cluster0.7fui2kq.mongodb.net/plandem?retryWrites=true&w=majority&appName=Cluster0';
const eventoSchema = new mongoose.Schema({}, { strict: false });
const Evento = mongoose.model('Evento', eventoSchema, 'eventos');

const FESTIVALES = [
  {
    sourceUrl: 'https://www.taquilla.com/entradas/vida-festival',
    slug: 'vida-festival',
    title: 'Vida Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/79/vida-festival-2021__330x275.webp',
    shortDescription: 'Festival de multiples disciplinas artisticas en Vilanova i la Geltru con escenarios entre la playa y la montana y una fuerte apuesta por la musica indie y alternativa.',
    startDate: '2027-07-03',
    endDate: '2027-07-05',
    venueOrArea: "La Daurada Beach y La Masia d'en Cabanyes",
    city: 'Vilanova i la Geltru',
    provinceOrRegion: 'Barcelona',
    price: 'desde 38€',
    organizer: 'Organizacion del festival',
    locationQuery: "Masia d'en Cabanyes, Vilanova i la Geltru, Barcelona, Espana"
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/festiuet',
    slug: 'festiuet',
    title: 'Festiuet',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/7f/festiuet-2025__330x275.webp',
    shortDescription: 'Festival de musica en la playa de Comarruga con tres dias de conciertos, ambiente mediterraneo y zona de acampada junto al mar.',
    startDate: '2026-08-03',
    endDate: '2026-08-05',
    venueOrArea: 'Passeig Maritim de Comarruga',
    city: 'El Vendrell',
    provinceOrRegion: 'Tarragona',
    price: null,
    organizer: 'Organizacion del festival',
    locationQuery: 'Passeig Maritim de Comarruga, El Vendrell, Tarragona, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/mad-cool-festival',
    slug: 'mad-cool-festival',
    title: 'Mad Cool Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/76/mad-cool-festival-2021__330x275.webp',
    shortDescription: 'Gran festival musical y cultural de Madrid con varios escenarios, conciertos internacionales y una experiencia que mezcla musica, gastronomia y cultura.',
    startDate: '2026-07-10',
    endDate: '2026-07-13',
    venueOrArea: 'Recinto Iberdrola Music',
    city: 'Madrid',
    provinceOrRegion: 'Madrid',
    price: null,
    organizer: 'Organizacion del festival',
    locationQuery: 'Iberdrola Music, Madrid, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/primavera-sound',
    slug: 'primavera-sound',
    title: 'Primavera Sound',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/b8/primavera-sound-2025__330x275.webp',
    shortDescription: 'Festival de referencia de musica alternativa e indie en el Parc del Forum, con una programacion internacional y una de las citas mas fuertes del calendario musical.',
    startDate: '2027-06-03',
    endDate: '2027-06-05',
    venueOrArea: 'Parc del Forum',
    city: 'Sant Adria de Besos',
    provinceOrRegion: 'Barcelona',
    price: 'desde 142,50€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Parc del Forum, Sant Adria de Besos, Barcelona, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/share-festival',
    slug: 'share-festival',
    title: 'Share Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/fb/share-festival-2021__330x275.webp',
    shortDescription: 'Festival urbano en el Parc del Forum que mezcla pop, musica urbana y un fuerte componente social y solidario en Barcelona.',
    startDate: '2026-06-07',
    endDate: '2026-06-09',
    venueOrArea: 'Parc del Forum',
    city: 'Sant Adria de Besos',
    provinceOrRegion: 'Barcelona',
    price: 'desde 70€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Parc del Forum, Sant Adria de Besos, Barcelona, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/planeta-sound-festival-2025',
    slug: 'planeta-sound-festival',
    title: 'Planeta Sound Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/1f/planeta-sound-festival-2025__330x275.webp',
    shortDescription: 'Festival de musica independiente en Ponferrada con conciertos, sesiones vermut y actividades complementarias para vivir una experiencia completa.',
    startDate: '2026-07-18',
    endDate: '2026-07-20',
    venueOrArea: 'Parque del Oeste',
    city: 'Ponferrada',
    provinceOrRegion: 'Leon',
    price: 'desde 45€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Parque del Oeste, Ponferrada, Leon, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/polar-sound-festival',
    slug: 'polar-sound-festival',
    title: 'Polar Sound Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/4b/polar-sound-festival-2023-abonos-con-o-sin-forfait__330x275.webp',
    shortDescription: 'Festival en la estacion de esqui de Baqueira Beret con conciertos, apres-ski y ambiente de montana en pleno Pirineo.',
    startDate: '2026-03-24',
    endDate: '2026-03-25',
    venueOrArea: 'Estacion de esqui Baqueira Beret',
    city: 'Baqueira Beret',
    provinceOrRegion: 'Lleida',
    price: null,
    organizer: 'Organizacion del festival',
    locationQuery: 'Baqueira Beret, Naut Aran, Lleida, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/gatasound',
    slug: 'gatasound',
    title: 'Gatasound',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/e6/gatasound__330x275.webp',
    shortDescription: 'Festival indie de la Sierra de Gata con tres dias de cultura, naturaleza y musica en directo entre Villamiel y Trevejo.',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    venueOrArea: 'Sierra de Gata entre Villamiel y Trevejo',
    city: 'Villamiel',
    provinceOrRegion: 'Caceres',
    price: null,
    organizer: 'Organizacion del festival',
    locationQuery: 'Villamiel, Caceres, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/sansan-festival',
    slug: 'sansan-festival',
    title: 'Sansan Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/34/sansan-festival__330x275.webp',
    shortDescription: 'Festival de indie, pop y rock nacional en Benicassim con tres escenarios, DJs, food trucks y una de las citas mas fuertes del inicio de temporada.',
    startDate: '2026-03-28',
    endDate: '2026-03-30',
    venueOrArea: 'Recinto de Festivales de Benicassim',
    city: 'Benicassim',
    provinceOrRegion: 'Castellon',
    price: 'desde 88€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Recinto de Festivales de Benicassim, Castellon, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/festival-de-les-arts',
    slug: 'festival-de-les-arts',
    title: 'Festival de les Arts',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/e6/festival-de-les-arts-2023__330x275.webp',
    shortDescription: 'Festival indie nacido en Valencia que mezcla conciertos, arte, ilustracion, charlas y exposiciones en un entorno emblematico.',
    startDate: null,
    endDate: null,
    venueOrArea: 'Ciudad de las Artes y las Ciencias',
    city: 'Valencia',
    provinceOrRegion: 'Valencia',
    price: null,
    organizer: 'Organizacion del festival',
    locationQuery: 'Ciudad de las Artes y las Ciencias, Valencia, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/festival-cruilla',
    slug: 'festival-cruilla',
    title: 'Festival Cruilla',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/d9/festival-cruilla__330x275.webp',
    shortDescription: 'Festival urbano de verano en el Parc del Forum con mezcla de generos, ambiente multicultural y un fuerte componente social y sostenible.',
    startDate: '2027-07-07',
    endDate: '2027-07-10',
    venueOrArea: 'Parc del Forum',
    city: 'Sant Adria de Besos',
    provinceOrRegion: 'Barcelona',
    price: 'desde 10€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Parc del Forum, Sant Adria de Besos, Barcelona, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/low-festival',
    slug: 'low-festival',
    title: 'Low Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/a9/low-festival__330x275.webp',
    shortDescription: 'Festival indie-rock en Benidorm con tres dias de musica, ambiente veraniego y cartel nacional e internacional en la Ciudad Deportiva Guillermo Amor.',
    startDate: '2026-07-26',
    endDate: '2026-07-28',
    venueOrArea: 'Ciudad Deportiva Guillermo Amor',
    city: 'Benidorm',
    provinceOrRegion: 'Alicante',
    price: null,
    organizer: 'Organizacion del festival',
    locationQuery: 'Ciudad Deportiva Guillermo Amor, Benidorm, Alicante, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/puro-latino-fest',
    slug: 'puro-latino-fest',
    title: 'Puro Latino Fest',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/4c/puro-latino-fest-2024__330x275.webp',
    shortDescription: 'Festival de musica latina, reggaeton, trap y hip-hop que reune a grandes artistas del genero y una atmosfera de fiesta multitudinaria.',
    startDate: null,
    endDate: null,
    venueOrArea: 'Sanlucar de Barrameda',
    city: 'Sanlucar de Barrameda',
    provinceOrRegion: 'Cadiz',
    price: null,
    organizer: 'Organizacion del festival',
    locationQuery: 'Sanlucar de Barrameda, Cadiz, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/bilbao-bbk-live',
    slug: 'bilbao-bbk-live',
    title: 'Bilbao BBK Live',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/01/bilbao-bbk-live__330x275.webp',
    shortDescription: 'Festival referente en Bilbao con una gran mezcla de rock, pop y electronica en el entorno de Kobetamendi.',
    startDate: '2027-07-08',
    endDate: '2027-07-10',
    venueOrArea: 'Monte Kobeta',
    city: 'Bilbao',
    provinceOrRegion: 'Vizcaya',
    price: 'desde 120€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Monte Kobeta, Bilbao, Vizcaya, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/voll-damm-festival-de-jazz-de-barcelona-2025',
    slug: 'voll-damm-jazz-barcelona',
    title: 'Voll Damm Festival de Jazz de Barcelona',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/2f/voll-damm-festival-de-jazz-de-barcelona-2025__330x275.webp',
    shortDescription: 'Historico festival de jazz de Barcelona con conciertos, clases magistrales y actividades paralelas en algunas de las mejores salas de la ciudad.',
    startDate: '2026-09-29',
    endDate: '2026-12-03',
    venueOrArea: 'Varias salas de Barcelona',
    city: 'Barcelona',
    provinceOrRegion: 'Barcelona',
    price: 'desde 15€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Barcelona, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/ebrovision',
    slug: 'ebrovision',
    title: 'Ebrovision',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/b7/ebrovision__330x275.webp',
    shortDescription: 'Festival de musica independiente en Miranda de Ebro con indie pop y rock, ademas de actividades culturales complementarias.',
    startDate: '2026-09-03',
    endDate: '2026-09-05',
    venueOrArea: 'Estadio Municipal de Anduva',
    city: 'Miranda de Ebro',
    provinceOrRegion: 'Burgos',
    price: 'desde 5€',
    organizer: 'Asociacion Cultural Rafael Izquierdo',
    locationQuery: 'Estadio Municipal de Anduva, Miranda de Ebro, Burgos, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/es-jardi-festival-2026',
    slug: 'es-jardi-festival',
    title: 'Es Jardi Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/40/es-jardi-festival__330x275.webp',
    shortDescription: 'Festival boutique de verano en Calvia con conciertos al aire libre, gastronomia y un ambiente mediterraneo muy cuidado.',
    startDate: '2026-07-30',
    endDate: '2026-08-29',
    venueOrArea: 'Antiguo Aquapark de Calvia',
    city: 'Calvia',
    provinceOrRegion: 'Islas Baleares',
    price: 'desde 19,80€',
    organizer: 'Mallorca Live',
    locationQuery: 'Calvia, Mallorca, Islas Baleares, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/festival-coca-cola-music-experience',
    slug: 'coca-cola-music-experience',
    title: 'Festival Coca Cola Music Experience',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/68/festival-coca-cola-music-experience__330x275.jpg',
    shortDescription: 'Gran cita musical al aire libre en Madrid con artistas nacionales e internacionales y formato de festival urbano de gran capacidad.',
    startDate: '2026-09-04',
    endDate: '2026-09-05',
    venueOrArea: 'Recinto Iberdrola Music',
    city: 'Madrid',
    provinceOrRegion: 'Madrid',
    price: 'desde 46,20€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Iberdrola Music, Madrid, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/leyendas-del-rock-festival',
    slug: 'leyendas-del-rock',
    title: 'Leyendas del Rock Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/c6/leyendas-del-rock-festival-2025__330x275.webp',
    shortDescription: 'Festival de rock y heavy metal en Villena con cuatro dias de directos y una de las citas mas importantes del genero en Espana.',
    startDate: '2026-08-05',
    endDate: '2026-08-08',
    venueOrArea: 'Polideportivo Municipal',
    city: 'Villena',
    provinceOrRegion: 'Alicante',
    price: 'desde 109€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Polideportivo Municipal, Villena, Alicante, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/starlite-catalana-occidente-todos-los-conciertos',
    slug: 'starlite-marbella',
    title: 'Starlite Marbella',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/e7/starlite-catalana-occidente-todos-los-conciertos__330x275.webp',
    shortDescription: 'Ciclo de conciertos y experiencias musicales de gran formato en Marbella con una programacion estival repleta de artistas.',
    startDate: null,
    endDate: null,
    venueOrArea: 'Marbella',
    city: 'Marbella',
    provinceOrRegion: 'Malaga',
    price: 'desde 20,95€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Marbella, Malaga, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/love-the-90s-2023',
    slug: 'love-the-90s',
    title: "Love the 90's",
    imageUrl: 'https://cd1.taquilla.com/data/images/t/cb/love-the-90-s-2020__330x275.webp',
    shortDescription: 'Festival homenaje a la musica dance de los 90 con artistas iconicos y varias citas por ciudades de toda Espana.',
    startDate: '2026-08-22',
    endDate: '2026-08-22',
    venueOrArea: 'Barcelona',
    city: 'Barcelona',
    provinceOrRegion: 'Barcelona',
    price: 'desde 36€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Barcelona, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/gran-canaria-sum-festival',
    slug: 'gran-canaria-sum-festival',
    title: 'Gran Canaria Sum Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/4e/gran-canaria-sum-festival__330x275.webp',
    shortDescription: 'Festival indie y alternativo al aire libre en Gran Canaria con una programacion nacional e internacional en pleno inicio del otono.',
    startDate: '2026-10-02',
    endDate: '2026-10-03',
    venueOrArea: 'Arucas',
    city: 'Arucas',
    provinceOrRegion: 'Gran Canaria',
    price: 'desde 82,50€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Arucas, Gran Canaria, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/arenal-sound',
    slug: 'arenal-sound',
    title: 'Arenal Sound',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/90/arenal-sound-2019__330x275.webp',
    shortDescription: 'Festival masivo junto a la playa en Burriana con varios dias de pop, rock, urbana y electronica a pie del Mediterraneo.',
    startDate: '2026-07-30',
    endDate: '2026-08-02',
    venueOrArea: 'Playa El Arenal',
    city: 'Burriana',
    provinceOrRegion: 'Castellon',
    price: 'desde 45€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Playa El Arenal, Burriana, Castellon, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/medusa-sunbeach-festival',
    slug: 'medusa-sunbeach-festival',
    title: 'Medusa Sunbeach Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/0d/medusa-sunbeach-festival__330x275.webp',
    shortDescription: 'Gran festival de musica electronica en la playa de Cullera con varias areas tematicas y cartel internacional de primer nivel.',
    startDate: null,
    endDate: null,
    venueOrArea: 'Playa de Cullera',
    city: 'Cullera',
    provinceOrRegion: 'Valencia',
    price: 'desde 97€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Playa de Cullera, Valencia, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/guitar-bcn',
    slug: 'guitar-bcn',
    title: 'Guitar BCN',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/a2/guitar-bcn__330x275.webp',
    shortDescription: 'Historico ciclo musical de Barcelona dedicado a la guitarra y a una programacion muy amplia de conciertos en las principales salas de la ciudad.',
    startDate: '2026-09-03',
    endDate: '2026-12-03',
    venueOrArea: 'Varias salas de Barcelona',
    city: 'Barcelona',
    provinceOrRegion: 'Barcelona',
    price: 'desde 24€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Barcelona, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/dcode-fest',
    slug: 'dcode-fest',
    title: 'DCode Fest',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/26/dcode-fest__330x275.webp',
    shortDescription: 'Festival alternativo en Madrid de formato concentrado y muy potente, con indie, rock y electronica en el campus de la Complutense.',
    startDate: '2026-09-09',
    endDate: '2026-09-09',
    venueOrArea: 'Campus Universidad Complutense',
    city: 'Madrid',
    provinceOrRegion: 'Madrid',
    price: 'desde 60€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Universidad Complutense de Madrid, Madrid, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/aquasella-festival',
    slug: 'aquasella-festival',
    title: 'Aquasella Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/72/aquasella-festival__330x275.webp',
    shortDescription: 'Festival de electronica y techno en Asturias a orillas del rio Sella, con varios dias de directos y gran ambiente de verano.',
    startDate: '2026-08-17',
    endDate: '2026-08-20',
    venueOrArea: 'Arriondas',
    city: 'Arriondas',
    provinceOrRegion: 'Asturias',
    price: 'desde 60€',
    organizer: 'Organizacion del festival',
    locationQuery: 'Arriondas, Asturias, Espana'
  },
  {
    sourceUrl: 'https://www.taquilla.com/entradas/circuit-festival',
    slug: 'circuit-festival',
    title: 'Circuit Festival',
    imageUrl: 'https://cd1.taquilla.com/data/images/t/91/circuit-festival__330x275.webp',
    shortDescription: 'Gran festival internacional de ocio y musica en Barcelona con multiples fiestas, venues y uno de sus iconos en parque acuatico.',
    startDate: '2026-08-01',
    endDate: '2026-08-09',
    venueOrArea: 'Multiples venues Barcelona',
    city: 'Barcelona',
    provinceOrRegion: 'Barcelona',
    price: 'desde 27,50€',
    organizer: 'Matinee',
    locationQuery: 'Barcelona, Espana'
  }
];

const cacheCoordenadas = new Map();

function parsePrice(priceText) {
  if (!priceText) return null;
  const limpio = String(priceText).replace(',', '.');
  const match = limpio.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function computeFutureDates(startDate, endDate) {
  if (!startDate) return { fechaInicio: null, fechaFin: null };

  const fechaInicio = new Date(`${startDate}T12:00:00`);
  const fechaFin = new Date(`${endDate || startDate}T23:59:59`);
  const ahora = new Date();

  while (fechaFin.getTime() < ahora.getTime()) {
    fechaInicio.setFullYear(fechaInicio.getFullYear() + 1);
    fechaFin.setFullYear(fechaFin.getFullYear() + 1);
  }

  return { fechaInicio, fechaFin };
}

async function geocode(query, fallbackQuery) {
  const consultas = [query, fallbackQuery].filter(Boolean);

  for (const consulta of consultas) {
    if (cacheCoordenadas.has(consulta)) return cacheCoordenadas.get(consulta);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(consulta)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'PortalEventos/1.0' } });
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
        const coords = {
          latitud: Number(data[0].lat),
          longitud: Number(data[0].lon),
          displayName: data[0].display_name || consulta
        };
        cacheCoordenadas.set(consulta, coords);
        return coords;
      }
    } catch (error) {
      // Sigue al fallback.
    }
  }

  return {
    latitud: 40.4168,
    longitud: -3.7038,
    displayName: fallbackQuery || query || 'Espana'
  };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  const idsFuente = FESTIVALES.map((item) => `taquilla-${item.slug}`);
  await Evento.deleteMany({ 'fuente.identificador': { $in: idsFuente } });

  const resultados = [];

  for (const item of FESTIVALES) {
    const coords = await geocode(
      item.locationQuery,
      `${item.city}, ${item.provinceOrRegion}, Espana`
    );
    const { fechaInicio, fechaFin } = computeFutureDates(item.startDate, item.endDate);
    const precio = parsePrice(item.price);

    const evento = {
      titulo: item.title,
      descripcion: item.shortDescription,
      fechaInicio,
      fechaFin,
      categoria: 'Musica',
      precio,
      organizador: item.organizer || 'Organizacion del festival',
      esPremium: false,
      multimediaUrl: item.imageUrl,
      multimediaTipo: 'image',
      galeria: [],
      ubicacion: {
        direccion: `${item.venueOrArea}, ${item.city}, ${item.provinceOrRegion}, Espana`,
        coordenadas: {
          latitud: coords.latitud,
          longitud: coords.longitud
        },
        placeId: `taquilla-${item.slug}`,
        countryCode: 'ES',
        countryName: 'Espana'
      },
      fuente: {
        nombre: 'Taquilla.com',
        url: item.sourceUrl,
        plataforma: 'taquilla.com',
        tipo: 'Festival',
        identificador: `taquilla-${item.slug}`
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
    resultados.push({
      titulo: creado.titulo,
      id: String(creado._id),
      coords: creado.ubicacion.coordenadas,
      fechaInicio: creado.fechaInicio,
      fechaFin: creado.fechaFin
    });
    console.log(`Insertado: ${creado.titulo}`);
  }

  console.log(`Total insertados: ${resultados.length}`);
  resultados.forEach((item) => {
    console.log(`${item.titulo} | ${item.id} | ${item.coords.latitud}, ${item.coords.longitud}`);
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
