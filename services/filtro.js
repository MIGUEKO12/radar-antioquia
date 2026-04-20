// ================= SECCIÓN: FILTRO DE CALIDAD DE NOTICIAS =================
const { MUNICIPIO_A_SUBREGION } = require('../config/municipios');

// ================= SECCIÓN: CIUDADES FUERA DE ANTIOQUIA =================
const CIUDADES_EXTERNAS = [
  'bogota', 'bogota', 'cundinamarca',
  'cali', 'valle del cauca',
  'barranquilla', 'cartagena de indias',
  'bucaramanga', 'cucuta', 'norte de santander',
  'pereira', 'risaralda', 'manizales',
  'ibague', 'tolima', 'villavicencio', 'meta',
  'pasto', 'narino', 'neiva', 'huila',
  'santa marta', 'popayan', 'cauca', 'monteria',
];

const TERMINOS_ANTIOQUIA_EXTRA = [
  'antioquia', 'uraba', 'bajo cauca', 'nordeste',
  'suroeste', 'occidente', 'valle de aburrá', 'aburra',
  'magdalena medio', 'gobernacion de antioquia',
];

function esTituloDeAntioquia(tNorm) {
  for (const municipio of Object.keys(MUNICIPIO_A_SUBREGION)) {
    const munNorm = municipio.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (tNorm.includes(munNorm)) return true;
  }
  return TERMINOS_ANTIOQUIA_EXTRA.some(t =>
    tNorm.includes(t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
}

// ================= SECCIÓN: PATRONES ADMINISTRATIVOS =================
const PATRONES_ADMINISTRATIVOS = [
  ['recompensa', 'alias'], ['recompensa', 'captura'],
  ['aumenta recompensa'], ['aumentan recompensa'],
  ['aumento recompensa'], ['aumentó recompensa'],
  ['ofrece recompensa', 'alias'], ['gobierno ofrece recompensa'],
  ['tiene el', '%'], ['tiene el', 'por ciento'],
  ['que hay detras'], ['que hay detrás'],
  ['los desafios de'], ['los desafíos de'],
  ['el panorama de'], ['panorama de seguridad'],
  ['cifras de'], ['estadisticas de'], ['estadísticas de'],
  ['los numeros de'], ['los números de'],
  ['el balance de'], ['balance de homicidios'],
  ['cuantos homicidios'], ['tasa de homicidios'],
  ['indice de violencia'], ['índice de violencia'],
];

// ================= SECCIÓN: LISTA NEGRA URLs =================
const URL_RUIDO = [
  '/tags/', '/tag/', '/category/', '/categoria/', '/author/', '/autor/',
  '/login', '/registro', '/suscripcion', '/quienes-somos', '/acerca-de',
  '/about', '/terminos', '/politica-de-privacidad', '/contacto',
  '/newsletter', '/publicidad', '/aviso-legal',
];

// ================= SECCIÓN: GRUPOS ARMADOS =================
const GRUPOS_ARMADOS = [
  'clan del golfo', 'eln', 'disidencias de las farc', 'disidencias farc',
  'agc', 'egc', 'ejercito libertadores de colombia',
  'la terraza', 'los chatas', 'los triana', 'pachelly', 'la union', 'la union',
  'los del bajo', 'trianon', 'caicedo', 'la sierra', 'robledo',
  'la miel', 'san pablo', 'los del 20', 'carne rancia', 'el salacho',
  'los machacos', 'halcones ii', 'los pacheco', 'los de las flores',
  'el polvorin', 'los juaquinillos', 'mondongueros',
  'oficina del doce', 'el oasis', 'union subversiva',
  'los marihuanos', 'el mesa', 'gdco', 'gdo',
  'frente 36', 'frente 18', 'frente 37',
];

// ================= SECCIÓN: PATRONES OPINIÓN =================
const PATRONES_OPINION = [
  ['pide', 'seguridad'], ['pide', 'mas seguridad'],
  ['solicita', 'seguridad'], ['exige', 'seguridad'], ['piden', 'seguridad'],
  ['advierte', 'riesgo'], ['alerta', 'posible'], ['alerta sobre'],
  ['advierten', 'riesgo'], ['autoridades advierten'],
  ['ofrece recompensa'], ['ofrecen recompensa'], ['recompensa por informacion'],
  ['rueda de prensa'], ['informe oficial'], ['balance de seguridad'],
  ['rendicion de cuentas'], ['comunidad denuncia falta'],
  ['vecinos piden'], ['habitantes piden'], ['ciudadanos piden'],
  ['gobernador pide'], ['alcalde pide'], ['ministro pide'],
  ['gobierno pide'], ['gobierno exige'], ['policia pide'],
  ['fiscal pide'], ['presidente pide'],
  ['gobernador exigio'], ['gobernador pidio'],
  ['alcalde exigio'], ['alcalde pidio'],
  ['exigio', 'orden de captura'], ['pidio', 'orden de captura'],
  ['solicito', 'orden de captura'], ['reactivar', 'orden de captura'],
  ['pide', 'captura'], ['exige', 'captura'], ['solicita', 'captura'],
  ['piden', 'captura contra'], ['pidio', 'captura'], ['exigio', 'captura'],
];

// ================= SECCIÓN: PALABRAS RETROSPECTIVAS =================
const PALABRAS_RETROSPECTIVAS = [
  'asi fue', 'asi fue como', 'asi ocurrio', 'asi sucedio',
  'reconstruccion', 'reconstruyen',
  'revelan video', 'revelan videos', 'video inedito',
  'imagenes ineditas', 'fotos ineditas',
  'video desconocido', 'videos desconocidos', 'material inedito',
  'nuevas imagenes', 'hace un ano', 'hace dos anos', 'hace tres anos',
  'un ano despues', 'dos anos despues', 'aniversario', 'conmemoracion',
  'en memoria', 'a un ano', 'a dos anos',
  'el caso de', 'cronica de', 'especial investigativo',
  'lo que no se supo', 'lo que no sabia',
  'la verdad detras', 'detras del crimen', 'la historia detras',
];

// ================= SECCIÓN: PALABRAS CRÍTICAS =================
const PALABRAS_CRITICAS = [
  'homicidio', 'asesinado', 'asesinato', 'mato', 'mataron', 'baleado',
  'cuerpo sin vida', 'hallado muerto', 'ultimado', 'sicario', 'ejecutado',
  'feminicidio', 'femicidio', 'mujer asesinada',
  'masacre', 'secuestro', 'desplazamiento masivo', 'atentado',
  'combate', 'enfrentamiento armado', 'mina antipersonal',
  'candidato asesinado', 'candidato muerto', 'candidato herido',
  'lider social asesinado',
];

// ================= SECCIÓN: GRUPOS RUIDO =================
const GRUPOS_RUIDO = [
  ['futbol', 'gol', 'partido', 'liga betplay', 'marcador',
   'empate', 'derrota', 'victoria deportiva', 'campeon', 'torneo',
   'ciclismo', 'etapa', 'peloton', 'medalla', 'olimpiadas'],
  ['farandula', 'chisme', 'celebridad', 'famoso',
   'album', 'concierto', 'artista musical', 'cantante',
   'estreno', 'serie de tv', 'pelicula', 'temporada',
   'reality', 'programa de television', 'novela', 'actor', 'actriz'],
  ['bolsa de valores', 'acciones', 'inversion empresarial',
   'cooperativa', 'supermercado', 'retail'],
  ['pasaporte', 'sistema operativo de pasaportes', 'falla en sistema',
   'registro civil', 'notaria', 'pico y placa', 'impuesto predial'],
  ['hipopotamo', 'hipopotamos'],
];

const PALABRAS_NEGRAS_INDIVIDUALES = [
  'hipopotamo', 'hipopotamos', 'horoscopo',
  'receta de cocina', 'ingredientes para',
  'liga betplay en vivo', 'en vivo online partido',
  'resumen y goles', 'resultado del partido'
];

// ================= SECCIÓN: REGLAS RECLASIFICACION =================
const REGLAS_RECLASIFICACION = [
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['respondio', 'amenaza'], ['reacciono', 'amenaza'],
      ['declaro', 'amenaza'], ['dijo', 'amenaza'],
      ['opino', 'amenaza'], ['respondio', 'petro'],
      ['bravucon'], ['polemica', 'declaraciones'],
      ['debate', 'politico'], ['falla en sistema'],
      ['sistema operativo'], ['pasaporte'], ['tramite'],
    ],
    nuevaCategoria: 'general'
  },
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['operativo', 'mineria'], ['operativo', 'dragas'],
      ['destruidas', 'dragas'], ['incautadas', 'dragas'],
      ['mineria ilegal', 'captura'], ['mineria ilegal', 'operativo'],
    ],
    nuevaCategoria: 'mineria'
  },
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['creciente', 'rio'], ['desbordamiento'],
      ['desborde', 'rio'], ['emergencia', 'rio'], ['alerta', 'creciente'],
    ],
    nuevaCategoria: 'clima'
  },
  {
    categoriaActual: 'desplazamiento',
    patronesTitulo: [
      ['violencia intraurbana'], ['desplazamiento', 'violencia'],
      ['desplazamiento', 'grupos'], ['desplazamiento', 'bandas'],
    ],
    nuevaCategoria: 'orden_publico'
  },
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['documental', 'combate'], ['documental', 'reclutamiento'],
      ['history', 'reclutamiento'], ['history', 'combate'],
    ],
    nuevaCategoria: 'general'
  },
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['amenaza', 'candidato'], ['amenazas', 'candidato'],
      ['amenaza', 'candidata'], ['amenaza', 'politico'],
      ['amenaza', 'congresista'], ['amenaza', 'senador'],
      ['amenaza', 'alcalde'], ['recompensa', 'candidato'],
    ],
    nuevaCategoria: 'violencia_politica'
  }
];

// ================= SECCIÓN: FUNCIÓN PRINCIPAL =================
function aplicarFiltro(titulo, categoria, link = '') {
  // Normalizar TODO sin tildes para evitar problemas de encoding
  const tNorm = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lNorm = (link || '').toLowerCase();

  // EXCEPCIÓN ABSOLUTA
  if (tNorm.includes('hipopotamo')) return 'general';

  // KILL-SWITCH GEOGRÁFICO — prioridad absoluta, sin excepción
  const mencionaCiudadExterna = CIUDADES_EXTERNAS.some(c => tNorm.includes(c));
  if (mencionaCiudadExterna && !esTituloDeAntioquia(tNorm)) return 'general';

  // URL administrativa
  if (link && URL_RUIDO.some(r => lNorm.includes(r))) return 'general';

  const tieneCritica = PALABRAS_CRITICAS.some(p =>
    tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );

  // Patrones administrativos
  if (!tieneCritica) {
    for (const patron of PATRONES_ADMINISTRATIVOS) {
      const ok = patron.every(p =>
        tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (ok) return 'general';
    }
  }

  // Palabras retrospectivas
  if (!tieneCritica) {
    const esRetro = PALABRAS_RETROSPECTIVAS.some(p =>
      tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
    if (esRetro) return 'general';
  }

  // Patrones de opinión
  if (!tieneCritica) {
    for (const patron of PATRONES_OPINION) {
      const ok = patron.every(p =>
        tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (ok) return 'general';
    }
  }

  // Grupos armados → orden_publico
  const catsMayores = ['homicidio', 'feminicidio', 'violencia_politica'];
  if (!catsMayores.includes(categoria)) {
    const tieneGrupo = GRUPOS_ARMADOS.some(g =>
      tNorm.includes(g.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
    if (tieneGrupo) return 'orden_publico';
  }

  // Palabras negras individuales
  if (!tieneCritica) {
    const tieneNegra = PALABRAS_NEGRAS_INDIVIDUALES.some(p =>
      tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
    if (tieneNegra) return 'general';
  }

  // Grupos de ruido
  if (!tieneCritica) {
    for (const grupo of GRUPOS_RUIDO) {
      const hits = grupo.filter(p =>
        tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (hits.length >= 2) return 'general';
    }
  }

  // Reglas de reclasificación
  for (const regla of REGLAS_RECLASIFICACION) {
    if (regla.categoriaActual !== categoria) continue;
    for (const patron of regla.patronesTitulo) {
      const ok = patron.every(p =>
        tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (ok) return regla.nuevaCategoria;
    }
  }

  return categoria;
}

module.exports = { aplicarFiltro, GRUPOS_ARMADOS, URL_RUIDO };