// ================= SECCIÓN: MAPA DE SUBREGIONES =================
const SUBREGIONES = {

  uraba: [
    'turbo', 'apartado', 'apartadó', 'carepa', 'chigorodo', 'chigorodó',
    'necocli', 'necoclí', 'san juan de uraba', 'san juan de urabá',
    'arboletes', 'mutata', 'mutatá', 'vigia del fuerte', 'vigía del fuerte',
    'murindo', 'murindó', 'san pedro de uraba', 'san pedro de urabá'
  ],

  norte: [
    'belmira', 'briceno', 'briceño', 'campamento', 'carolina del principe',
    'carolina del príncipe', 'don matias', 'don matías', 'entrerrios',
    'entrerríos', 'gomez plata', 'gómez plata', 'guadalupe', 'ituango',
    'san andres de cuerquia', 'san andrés de cuerquia', 'san jose de la montaña',
    'san josé de la montaña', 'san pedro de los milagros', 'santa rosa de osos',
    'toledo', 'valdivia', 'yarumal', 'angostura'
  ],

  nordeste: [
    'amalfi', 'anori', 'anorí', 'cisneros', 'remedios', 'san roque',
    'santo domingo', 'segovia', 'vegachi', 'vegachí', 'yali', 'yalí',
    'yolombo', 'yolombó'
  ],

  occidente: [
    'abriaqui', 'abriaquí', 'anza', 'anzá', 'armenia antioquia',
    'buritica', 'buriticá', 'caicedo', 'canasgordas', 'cañasgordas',
    'dabeiba', 'ebejico', 'ebéjico', 'frontino', 'giraldo', 'heliconia',
    'liborina', 'olaya', 'peque', 'sabanalarga', 'san jeronimo',
    'san jerónimo', 'santa fe de antioquia', 'santafe de antioquia',
    'sopetran', 'sopetrán', 'uramita'
  ],

  aburra: [
    'medellin', 'medellín', 'bello', 'itagui', 'itagüí', 'envigado',
    'sabaneta', 'la estrella', 'caldas', 'copacabana', 'girardota', 'barbosa'
  ],

  oriente: [
    'el carmen de viboral', 'rionegro', 'marinilla', 'guarne', 'la ceja',
    'el retiro', 'la union', 'la unión', 'san vicente ferrer',
    'el santuario', 'cocorna', 'cocorná', 'granada', 'san carlos', 'san luis',
    'san rafael', 'argelia', 'narino', 'nariño', 'abejorral', 'sonson', 'sonsón',
    'alejandria', 'alejandría', 'concepcion', 'concepción', 'el penol', 'el peñol',
    'guatape', 'guatapé', 'san francisco', 'san vicente'
  ],

  suroeste: [
    'amaga', 'amagá', 'andes', 'angelopolis', 'angelópolis', 'betania',
    'betulia', 'caramanta', 'ciudad bolivar', 'ciudad bolívar', 'concordia',
    'fredonia', 'hispania', 'jardin', 'jardín', 'jerico', 'jericó',
    'la pintada', 'montebello', 'pueblorrico', 'salgar', 'santa barbara',
    'santa bárbara', 'tamesis', 'támesis', 'tarso', 'titiribí',
    'urrao', 'valparaiso', 'valparaíso', 'venecia'
  ],

  magdalena: [
    'caracoli', 'caracolí', 'maceo', 'puerto berrio', 'puerto berrío',
    'puerto nare', 'puerto triunfo', 'yondo', 'yondó'
  ],

  bajocauca: [
    'caucasia', 'el bagre', 'nechi', 'nechí', 'taraza', 'tarazá',
    'zaragoza', 'caceres', 'cáceres'
  ]
};

// ================= SECCIÓN: ÍNDICE INVERTIDO =================
const MUNICIPIO_A_SUBREGION = {};

Object.entries(SUBREGIONES).forEach(([subregion, municipios]) => {
  municipios.forEach(municipio => {
    MUNICIPIO_A_SUBREGION[municipio.toLowerCase()] = subregion;
  });
});

// ================= SECCIÓN: FUNCIÓN DETECTORA =================
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

return { subregion: 'aburra', municipio: 'medellin' };

}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  SUBREGIONES,
  MUNICIPIO_A_SUBREGION,
  detectarUbicacion
};