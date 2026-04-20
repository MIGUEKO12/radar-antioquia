 // ================= SECCIÓN: FILTRO DE CALIDAD DE NOTICIAS =================
// Este archivo actúa como capa de corrección DESPUÉS del clasificador.
// No borra noticias — las reclasifica a General si detecta ruido o contexto incorrecto.
// Se aplica antes de guardar en la DB.

// ================= SECCIÓN: CIUDADES FUERA DE ANTIOQUIA (Kill-switch) =================
// Si el título menciona estas ciudades SIN mencionar un municipio de Antioquia → descarte
// El medio puede ser antioqueño pero la noticia no es del territorio
const CIUDADES_EXTERNAS = [
  'bogota', 'bogotá', 'cundinamarca',
  'cali', 'valle del cauca',
  'barranquilla', 'atlantico', 'atlántico',
  'cartagena', 'bolivar', 'bolívar',
  'bucaramanga', 'santander',
  'cucuta', 'cúcuta', 'norte de santander',
  'pereira', 'risaralda',
  'manizales', 'caldas',
  'ibague', 'ibagué', 'tolima',
  'villavicencio', 'meta',
  'pasto', 'narino', 'nariño',
  'neiva', 'huila',
  'santa marta', 'magdalena',
  'monteria', 'montería', 'cordoba', 'córdoba',
  'armenia', 'quindio', 'quindío',
  'popayan', 'popayán', 'cauca',
];

// Municipios de Antioquia — si aparece uno, la noticia SÍ es de Antioquia
// aunque también mencione otra ciudad
const MUNICIPIOS_ANTIOQUIA_CHECK = [
  'antioquia', 'medellin', 'medellín', 'uraba', 'urabá',
  'bajo cauca', 'nordeste', 'suroeste', 'occidente antioque',
  'valle de aburrá', 'aburra', 'magdalena medio antioque',
  'turbo', 'apartado', 'apartadó', 'caucasia', 'ituango',
  'bello', 'itagui', 'itagüí', 'envigado', 'sabaneta',
  'rionegro', 'marinilla', 'carmen de viboral',
  'segovia', 'remedios', 'el bagre', 'taraza', 'tarazá',
  'yarumal', 'valdivia', 'dabeiba', 'frontino',
  'san carlos', 'granada antioque', 'cocorna', 'cocorná',
  'briceño', 'briceno', 'yondo', 'yondó',
];

// ================= SECCIÓN: PATRONES DE RECOMPENSA Y ANÁLISIS =================
// Recompensas son decisiones administrativas, no hechos de orden público
// Análisis estadísticos son reportajes, no alertas
const PATRONES_ADMINISTRATIVOS = [
  // Recompensas
  ['recompensa', 'alias'], ['recompensa', 'captura'],
  ['aumenta recompensa'], ['aumentan recompensa'],
  ['aumentó recompensa'], ['aumento recompensa'],
  ['ofrece recompensa', 'alias'], ['ofrecen recompensa', 'alias'],
  ['gobierno aumenta'], ['gobierno ofrece recompensa'],
  // Análisis estadísticos y reportajes de datos
  ['tiene el', '%'], ['tiene el', 'por ciento'],
  ['¿que hay detras'], ['que hay detras'],
  ['¿que hay detrás'], ['que hay detrás'],
  ['los desafios de'], ['los desafíos de'],
  ['el panorama de'], ['panorama de seguridad'],
  ['cifras de'], ['estadisticas de'], ['estadísticas de'],
  ['los numeros de'], ['los números de'],
  ['el balance de'], ['balance de homicidios'],
  ['cuantos homicidios'], ['cuántos homicidios'],
  ['tasa de homicidios'], ['indice de violencia'], ['índice de violencia'],
];

// ================= SECCIÓN: LISTA NEGRA DE URLs =================
// Si el link contiene estas rutas, es una página administrativa — no es noticia
const URL_RUIDO = [
  '/tags/', '/tag/', '/category/', '/categoria/', '/author/', '/autor/',
  '/login', '/registro', '/suscripcion', '/suscripción',
  '/quienes-somos', '/quiénes-somos', '/acerca-de', '/about',
  '/terminos', '/términos', '/politica-de-privacidad', '/contacto',
  '/newsletter', '/publicidad', '/aviso-legal',
];

// ================= SECCIÓN: GRUPOS ARMADOS PRIORITARIOS =================
// Si el título menciona cualquiera de estos grupos, sube a orden_publico
// Son los grupos de mayor interés para el Gobernador de Antioquia
const GRUPOS_ARMADOS = [
  // Grandes organizaciones
  'clan del golfo', 'eln', 'disidencias de las farc', 'disidencias farc',
  'agc', 'egc', 'ejercito libertadores de colombia',
  // Grupos urbanos Medellín
  'la terraza', 'los chatas', 'los triana', 'pachelly', 'la union', 'la unión',
  'los del bajo', 'trianon', 'trianón', 'caicedo', 'la sierra', 'robledo',
  'la miel', 'san pablo', 'los del 20', 'carne rancia', 'el salacho',
  'los machacos', 'halcones ii', 'los pacheco', 'los de las flores',
  'el polvorin', 'el polvorín', 'los juaquinillos', 'mondongueros',
  'oficina del doce', 'el oasis', 'union subversiva', 'unión subversiva',
  'los marihuanos', 'el mesa', 'gdco', 'gdo', 'la terraza',
  // Frentes guerrilleros
  'frente 36', 'frente 18', 'frente 37',
];

// ================= SECCIÓN: PATRONES DE OPINIÓN Y POLÍTICA =================
// Noticias donde el hecho NO ocurrió — son declaraciones, peticiones o anuncios
// Estas van a General sin importar qué palabras clave tengan
const PATRONES_OPINION = [
  // Peticiones y solicitudes
  ['pide', 'seguridad'], ['pide', 'más seguridad'], ['pide', 'mas seguridad'],
  ['solicita', 'seguridad'], ['exige', 'seguridad'], ['piden', 'seguridad'],
  ['reclama', 'seguridad'], ['clama', 'seguridad'],
  // Advertencias y alertas sin hecho
  ['advierte', 'riesgo'], ['alerta', 'posible'], ['alerta sobre'],
  ['advierten', 'riesgo'], ['autoridades advierten'],
  // Recompensas y anuncios
  ['ofrece recompensa'], ['ofrecen recompensa'], ['recompensa por información'],
  ['recompensa por informacion'],
  // Ruedas de prensa e informes sin hecho
  ['rueda de prensa'], ['informe oficial'], ['balance de seguridad'],
  ['rendición de cuentas'], ['rendicion de cuentas'],
  // Quejas ciudadanas
  ['comunidad denuncia falta'], ['vecinos piden'], ['habitantes piden'],
  ['residentes exigen'], ['ciudadanos piden'],
  // Declaraciones de funcionarios
  ['gobernador pide'], ['alcalde pide'], ['ministro pide'],
  ['gobierno pide'], ['gobierno exige'], ['policía pide'], ['policia pide'],
  ['fiscal pide'], ['presidente pide'],
  ['gobernador exigió'], ['gobernador exigio'], ['gobernador pidió'],
  ['alcalde exigió'], ['alcalde exigio'], ['alcalde pidió'],
  ['ministro exigió'], ['ministro exigio'],
  ['fiscal exigió'], ['fiscal exigio'],
  // Solicitudes de capturas y órdenes — son declaraciones, no hechos
  ['exigió', 'orden de captura'], ['exigio', 'orden de captura'],
  ['pidió', 'orden de captura'], ['pidio', 'orden de captura'],
  ['solicitó', 'orden de captura'], ['solicito', 'orden de captura'],
  ['reactivar', 'orden de captura'], ['reactivar', 'captura'],
  ['pide', 'captura'], ['exige', 'captura'], ['solicita', 'captura'],
  ['piden', 'captura contra'], ['exigen', 'captura contra'],
  ['pidió', 'captura'], ['exigió', 'captura'],
];

// ================= SECCIÓN: PALABRAS RETROSPECTIVAS =================
// Noticias que hablan de hechos del PASADO disfrazados de actuales
// Aunque tengan palabras de orden público, van a General
// porque el Gobernador no debe confundirlas con alertas de hoy
const PALABRAS_RETROSPECTIVAS = [
  // Reconstrucción de hechos pasados
  'así fue', 'asi fue', 'así fue como', 'asi fue como',
  'así ocurrió', 'asi ocurrio', 'así sucedió', 'asi sucedio',
  'reconstrucción', 'reconstruccion', 'reconstruyen',
  // Videos e imágenes reveladas después
  'revelan video', 'revelan videos', 'video inédito', 'video inedito',
  'imágenes inéditas', 'imagenes ineditas', 'fotos inéditas',
  'video desconocido', 'videos desconocidos', 'material inédito',
  'nuevas imágenes', 'nuevas imagenes',
  // Aniversarios y memorias
  'hace un año', 'hace dos años', 'hace tres años',
  'un año después', 'dos años después', 'tres años después',
  'un año despues', 'dos años despues', 'tres años despues',
  'aniversario', 'conmemoración', 'conmemoracion',
  'en memoria', 'a un año', 'a dos años',
  // Informes especiales y reportajes históricos
  'historia de', 'el caso de', 'crónica de', 'cronica de',
  'especial investigativo', 'informe especial',
  'lo que no se supo', 'lo que no sabia', 'lo que no sabía',
  'la verdad detrás', 'la verdad detras', 'detrás del crimen',
  'detras del crimen', 'la historia detrás',
];

// ================= SECCIÓN: PALABRAS CRÍTICAS (no se pueden bajar a General) =================
const PALABRAS_CRITICAS = [
  // Homicidio
  'homicidio', 'asesinado', 'asesinato', 'mató', 'mataron', 'baleado',
  'cuerpo sin vida', 'hallado muerto', 'ultimado', 'sicario', 'ejecutado',
  // Feminicidio
  'feminicidio', 'femicidio', 'mujer asesinada',
  // Violencia real
  'masacre', 'secuestro', 'desplazamiento masivo', 'atentado',
  'combate', 'enfrentamiento armado', 'mina antipersonal',
  // Violencia política real
  'candidato asesinado', 'candidato muerto', 'candidato herido',
  'lider social asesinado', 'líder social asesinado'
];

// ================= SECCIÓN: LISTA NEGRA — COMBINACIONES DE RUIDO =================
const GRUPOS_RUIDO = [
  ['fútbol', 'futbol', 'gol', 'partido', 'liga betplay', 'marcador',
   'empate', 'derrota', 'victoria deportiva', 'campeón', 'torneo',
   'ciclismo', 'etapa', 'pelotón', 'medalla', 'olimpiadas'],
  ['farándula', 'farandula', 'chisme', 'celebridad', 'famoso',
   'álbum', 'album', 'concierto', 'artista musical', 'cantante',
   'documental', 'estreno', 'serie de tv', 'película', 'temporada',
   'reality', 'programa de televisión', 'novela', 'actor', 'actriz'],
  ['bolsa de valores', 'acciones', 'inversión empresarial',
   'centro logístico', 'millones de medicamentos', 'distribución farmacéutica',
   'cooperativa', 'supermercado', 'retail'],
  ['pasaporte', 'sistema operativo de pasaportes', 'falla en sistema',
   'registro civil', 'notaría', 'pico y placa', 'impuesto predial'],
  ['hipopótamo', 'hipopótamos', 'hipopotamo', 'hipopotamos'],
];

// ================= SECCIÓN: PALABRAS NEGRAS INDIVIDUALES =================
const PALABRAS_NEGRAS_INDIVIDUALES = [
  'hipopótamo', 'hipopótamos', 'hipopotamo', 'hipopotamos',
  'horóscopo', 'horoscopo',
  'receta de cocina', 'ingredientes para',
  'liga betplay en vivo', 'en vivo online partido',
  'resumen y goles', 'resultado del partido'
];

// ================= SECCIÓN: REGLAS DE RECLASIFICACIÓN =================
const REGLAS_RECLASIFICACION = [
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['respondió', 'amenaza'], ['reaccionó', 'amenaza'],
      ['declaró', 'amenaza'], ['dijo', 'amenaza'],
      ['opinó', 'amenaza'], ['respondió', 'petro'],
      ['bravucón'], ['polémica', 'declaraciones'],
      ['debate', 'político'], ['falla en sistema'],
      ['sistema operativo'], ['pasaporte'], ['trámite'],
    ],
    nuevaCategoria: 'general'
  },
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['operativo', 'minería'], ['operativo', 'mineria'],
      ['operativo', 'dragas'], ['destruidas', 'dragas'],
      ['incautadas', 'dragas'], ['minería ilegal', 'captura'],
      ['minería ilegal', 'operativo'],
    ],
    nuevaCategoria: 'mineria'
  },
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['creciente', 'río'], ['creciente', 'rio'],
      ['desbordamiento'], ['desborde', 'río'],
      ['emergencia', 'río'], ['alerta', 'creciente'],
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
      ['proyecto', 'reclutamiento', 'alcaldía'],
    ],
    nuevaCategoria: 'general'
  },
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['amenaza', 'candidato'], ['amenazas', 'candidato'],
      ['amenaza', 'candidata'], ['amenazas', 'candidata'],
      ['amenaza', 'político'], ['amenazas', 'político'],
      ['amenaza', 'congresista'], ['amenaza', 'senador'],
      ['amenaza', 'alcalde'], ['recompensa', 'candidato'],
    ],
    nuevaCategoria: 'violencia_politica'
  }
];

// ================= SECCIÓN: FUNCIÓN PRINCIPAL =================
function aplicarFiltro(titulo, categoria, link = '') {
  const tNorm = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lNorm = (link || '').toLowerCase();

  // ── EXCEPCIÓN ABSOLUTA: hipopótamos siempre van a General ─────────────────
  if (tNorm.includes('hipopotamo')) return 'general';

  // ── KILL-SWITCH GEOGRÁFICO: ciudad externa sin conexión con Antioquia ──────
  // PRIORIDAD ABSOLUTA — aplica sin importar palabras críticas
  // Si dice "Bogotá" o "Cali" sin mencionar Antioquia → siempre General
  const mencionaCiudadExterna = CIUDADES_EXTERNAS.some(c =>
    tNorm.includes(c.normalize('NFD').replace(/[̀-ͯ]/g, ''))
  );
  if (mencionaCiudadExterna) {
    const mencionaAntioquia = MUNICIPIOS_ANTIOQUIA_CHECK.some(m =>
      tNorm.includes(m.normalize('NFD').replace(/[̀-ͯ]/g, ''))
    );
    if (!mencionaAntioquia) return 'general';
  }

  // ── PATRONES ADMINISTRATIVOS: recompensas y análisis → General ───────────
  const tieneCriticaAdmin = PALABRAS_CRITICAS.some(p =>
    tNorm.includes(p.normalize('NFD').replace(/[̀-ͯ]/g, ''))
  );
  if (!tieneCriticaAdmin) {
    for (const patron of PATRONES_ADMINISTRATIVOS) {
      const todasPresentes = patron.every(p =>
        tNorm.includes(p.normalize('NFD').replace(/[̀-ͯ]/g, ''))
      );
      if (todasPresentes) return 'general';
    }
  }

  // ── PASO 0: Filtro de URL administrativa — no es noticia ──────────────────
  if (link && URL_RUIDO.some(r => lNorm.includes(r))) return 'general';

  // ── PASO 0A: Palabras retrospectivas → General ───────────────────────────
  // Noticias de hechos pasados no son alertas activas — van a General
  // Solo aplica si NO tiene palabras críticas de violencia real
  const tieneCriticaRetro = PALABRAS_CRITICAS.some(p =>
    tNorm.includes(p.normalize('NFD').replace(/[̀-ͯ]/g, ''))
  );
  if (!tieneCriticaRetro) {
    const esRetrospectiva = PALABRAS_RETROSPECTIVAS.some(p =>
      tNorm.includes(p.normalize('NFD').replace(/[̀-ͯ]/g, ''))
    );
    if (esRetrospectiva) return 'general';
  }

  // ── PASO 0B: Regla de descarte de opinión y política ─────────────────────
  // Solo aplica si NO tiene palabras críticas de violencia real
  const tieneCritica = tieneCriticaRetro; // Reutilizar variable ya calculada

  if (!tieneCritica) {
    for (const patron of PATRONES_OPINION) {
      const todasPresentes = patron.every(p =>
        tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (todasPresentes) return 'general';
    }
  }

  // ── PASO 0C: Grupos armados prioritarios → orden_publico ──────────────────
  // Si menciona un grupo armado conocido, sube automáticamente a orden_publico
  // excepto si ya está en una categoría de mayor prioridad
  const categoriasMayorPrioridad = ['homicidio', 'feminicidio', 'violencia_politica'];
  if (!categoriasMayorPrioridad.includes(categoria)) {
    const mencionaGrupo = GRUPOS_ARMADOS.some(g =>
      tNorm.includes(g.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
    if (mencionaGrupo) return 'orden_publico';
  }

  // ── PASO 1: Verificar palabras críticas ───────────────────────────────────
  // ── PASO 2: Palabras negras individuales → General ────────────────────────
  if (!tieneCritica) {
    const tieneNegra = PALABRAS_NEGRAS_INDIVIDUALES.some(p =>
      tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
    if (tieneNegra) return 'general';
  }

  // ── PASO 3: Grupos de ruido — 2 o más palabras del mismo grupo → General ──
  if (!tieneCritica) {
    for (const grupo of GRUPOS_RUIDO) {
      const coincidencias = grupo.filter(p =>
        tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (coincidencias.length >= 2) return 'general';
    }
  }

  // ── PASO 4: Reglas de reclasificación ─────────────────────────────────────
  for (const regla of REGLAS_RECLASIFICACION) {
    if (regla.categoriaActual !== categoria) continue;
    for (const patron of regla.patronesTitulo) {
      const todasPresentes = patron.every(p =>
        tNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
      if (todasPresentes) return regla.nuevaCategoria;
    }
  }

  return categoria;
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = { aplicarFiltro, GRUPOS_ARMADOS, URL_RUIDO };
