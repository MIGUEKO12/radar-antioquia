// ================= SECCIÓN: MAPA DE SUBREGIONES =================
// Estructura: subregion -> array de municipios que la conforman
// Fuente: División político-administrativa oficial de Antioquia (DANE)

const SUBREGIONES = {

  // 11 municipios — zona noroccidental, frontera con el mar Caribe
  uraba: [
    'turbo', 'apartado', 'apartadó', 'carepa', 'chigorodo', 'chigorodó',
    'necocli', 'necoclí', 'san juan de uraba', 'san juan de urabá',
    'arboletes', 'mutata', 'mutatá', 'vigia del fuerte', 'vigía del fuerte',
    'murindo', 'murindó', 'san pedro de uraba', 'san pedro de urabá'
  ],

  // 17 municipios — zona norte, limita con Córdoba y Bolívar
  norte: [
    'belmira', 'briceno', 'briceño', 'campamento', 'carolina del principe',
    'carolina del príncipe', 'don matias', 'don matías', 'entrerrios',
    'entrerríos', 'gomez plata', 'gómez plata', 'guadalupe', 'ituango',
    'san andres de cuerquia', 'san andrés de cuerquia', 'san jose de la montaña',
    'san josé de la montaña', 'san pedro de los milagros', 'santa rosa de osos',
    'toledo', 'valdivia', 'yarumal', 'angostura', 'liborina'
  ],

  // 10 municipios — zona nororiental, fuerte actividad minera
  nordeste: [
    'amalfi', 'anori', 'anorí', 'cisneros', 'remedios', 'san roque',
    'santo domingo', 'segovia', 'vegachi', 'vegachí', 'yali', 'yalí', 'yolombo', 'yolombó'
  ],

  // 19 municipios — zona occidental, límite con Chocó
  occidente: [
    'abriaqui', 'abriaquí', 'anza', 'anzá', 'armenia', 'buritica', 'buriticá',
    'caicedo', 'canasgordas', 'cañasgordas', 'dabeiba', 'ebejico', 'ebéjico',
    'frontino', 'giraldo', 'heliconia', 'liborina', 'olaya', 'peque', 'pequeño',
    'sabanalarga', 'san jeronimo', 'san jerónimo', 'santa fe de antioquia',
    'santafe de antioquia', 'sopetran', 'sopetrán', 'uramita'
  ],

  // 10 municipios — área metropolitana, mayor densidad poblacional
  aburra: [
    'medellin', 'medellín', 'bello', 'itagui', 'itagüí', 'envigado',
    'sabaneta', 'la estrella', 'caldas', 'copacabana', 'girardota', 'barbosa',
    'metro', 'metropolitana', 'area metropolitana', 'área metropolitana'
  ],

  // 23 municipios — zona oriental, turismo y flores
  oriente: [
    'el carmen de viboral', 'rionegro', 'marinilla', 'guarne', 'la ceja',
    'el retiro', 'la union', 'la unión', 'san vicente', 'san vicente ferrer',
    'santuario', 'cocorna', 'cocorná', 'granada', 'san carlos', 'san luis',
    'san rafael', 'argelia', 'narino', 'nariño', 'abejorral', 'sonson', 'sonsón',
    'alejandria', 'alejandría', 'concepcion', 'concepción', 'el penol', 'el peñol',
    'guatape', 'guatapé', 'san francisco'
  ],

  // 23 municipios — zona suroeste, caficultura y biodiversidad
  suroeste: [
    'amaga', 'amagá', 'andes', 'angelopolis', 'angelópolis', 'betania',
    'betulia', 'caramanta', 'ciudad bolivar', 'ciudad bolívar', 'concordia',
    'fredonia', 'hispania', 'jardin', 'jardín', 'jerico', 'jericó',
    'la pintada', 'montebello', 'pueblorrico', 'salgar', 'santa barbara',
    'santa bárbara', 'tamesis', 'támesis', 'tarso', 'titiribí', 'titiribí',
    'urrao', 'valparaiso', 'valparaíso', 'venecia'
  ],

  // 6 municipios — zona central-oriental, sobre el río Magdalena
  magdalena: [
    'caracoli', 'caracolí', 'maceo', 'puerto berrio', 'puerto berrío',
    'puerto nare', 'puerto triunfo', 'yondo', 'yondó'
  ],

  // 6 municipios — zona norte, minería aurífera y conflicto
  bajocauca: [
    'caucasia', 'el bagre', 'nechi', 'nechí', 'taraza', 'tarazá',
    'zaragoza', 'caceres', 'cáceres'
  ]
};

// ================= SECCIÓN: ÍNDICE INVERTIDO =================
// Construimos un mapa plano: municipio -> subregion
// Esto permite detectar la subregión en O(1) sin iterar el objeto completo

const MUNICIPIO_A_SUBREGION = {};

Object.entries(SUBREGIONES).forEach(([subregion, municipios]) => {
  municipios.forEach(municipio => {
    // Guardamos en minúsculas normalizadas para comparación case-insensitive
    MUNICIPIO_A_SUBREGION[municipio.toLowerCase()] = subregion;
  });
});

// ================= SECCIÓN: FUNCIÓN DETECTORA =================
/**
 * Detecta la subregión y municipio mencionados en un texto de noticia.
 * @param {string} texto - Título o descripción de la noticia
 * @returns {{ subregion: string, municipio: string|null }}
 */
function detectarUbicacion(texto) {
  const textoNorm = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [municipio, subregion] of Object.entries(MUNICIPIO_A_SUBREGION)) {
    const munNorm = municipio
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const regex = new RegExp(`\\b${munNorm}\\b`, 'i');

    if (regex.test(textoNorm)) {
      return {
        subregion,
        municipio: municipio.toLowerCase().trim()
      };
    }
  }

  return { subregion: 'general', municipio: null };
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  SUBREGIONES,           // Objeto completo subregion -> [municipios]
  MUNICIPIO_A_SUBREGION, // Índice invertido plano
  detectarUbicacion      // Función principal de detección
};
