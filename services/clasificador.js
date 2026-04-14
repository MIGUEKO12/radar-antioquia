// ================= SECCIÓN: DICCIONARIO DE CATEGORÍAS =================
const CATEGORIAS = {

  // Violencia física — máxima prioridad por impacto en convivencia
  homicidio: [
    'homicidio', 'asesinado', 'asesinato', 'muerto a tiros', 'baleado',
    'cadaver', 'cadáver', 'cuerpo sin vida', 'hallado muerto', 'ultimado',
    'sicario', 'disparos', 'mató', 'mataron', 'ejecutado'
  ],

  // Violencia de género
  feminicidio: [
    'feminicidio', 'femicidio', 'mujer asesinada', 'mujer muerta',
    'violencia de genero', 'violencia de género', 'violencia contra la mujer',
    'agresion a mujer', 'agresión a mujer', 'pareja la mato', 'esposo la mato'
  ],

  // Violencia política — frases exactas
  violencia_politica: [
    'violencia politica', 'violencia política',
    'amenaza candidato', 'amenaza a candidato', 'amenazaron candidato',
    'amenazas a candidato', 'amenazas candidatos', 'amenaza a candidatos',
    'amenaza directa candidato', 'amenazas directas candidatos',
    'atentado candidato', 'atentado contra candidato',
    'asesinato candidato', 'candidato asesinado', 'candidato muerto',
    'candidato amenazado', 'candidatos amenazados',
    'ex candidato amenazado', 'amenazar candidato', 'amenazar a candidato',
    'acusado amenazar candidato', 'candidatos en riesgo',
    'sede campaña', 'sede de campaña', 'daño sede campaña', 'ataque sede campaña',
    'publicidad electoral', 'propaganda electoral', 'vallas destruidas',
    'intimidacion electoral', 'intimidación electoral',
    'lider politico amenazado', 'líder político amenazado',
    'lider social amenazado', 'líder social amenazado',
    'concejal amenazado', 'alcalde amenazado', 'congresista amenazado',
    'diputado amenazado', 'politico amenazado', 'político amenazado',
    'senador amenazado', 'representante amenazado',
    'elecciones violencia', 'violencia electoral',
    'campana politica', 'campaña política atacada',
    'ataque politico', 'ataque político',
    'candidato herido', 'atentan contra candidato',
    'panfleto amenaza candidato', 'seguridad candidatos',
    'preocupacion candidatos', 'preocupación candidatos'
  ],

  // Orden público — conflicto armado y seguridad territorial
  orden_publico: [
    'eln', 'farc', 'clan del golfo', 'agc', 'autodefensas',
    'ataque armado', 'hostigamiento', 'enfrentamiento', 'combates',
    'guerrilla', 'paramilitares', 'extorsion', 'extorsión',
    'secuestro', 'desaparicion forzada', 'desaparición', 'operativo',
    'captura', 'detenidos', 'narcotráfico', 'narcotrafico', 'droga',
    'disidencias', 'grupo armado', 'amenaza', 'reclutamiento'
  ],

  // Desplazamiento
  desplazamiento: [
    'desplazamiento', 'desplazados', 'desplazamiento masivo',
    'familias huyen', 'comunidad abandona', 'éxodo', 'refugiados'
  ],

  // Minería
  mineria: [
    'mineria', 'minería', 'minero', 'mina de oro', 'extraccion',
    'extracción', 'dragas', 'retroexcavadora', 'mineria ilegal',
    'minería ilegal', 'accidente minero', 'derrumbe en mina',
    'carbón', 'carbon', 'socavon', 'socavón'
  ],

  // Clima y desastres
  clima: [
    'lluvia', 'inundacion', 'inundación', 'derrumbe', 'deslizamiento',
    'avalancha', 'vendaval', 'granizada', 'creciente', 'rio crecido',
    'río crecido', 'desbordamiento', 'desborde', 'rio desbordado',
    'río desbordado', 'quebrada desbordada', 'arroyo desbordado',
    'alerta roja', 'alerta amarilla', 'emergencia climatica',
    'emergencia climática', 'desastre natural', 'temporada de lluvias',
    'sequia', 'sequía', 'incendio forestal'
  ],

  // Salud pública
  salud: [
    'epidemia', 'brote', 'contagio', 'hospital', 'clinica', 'clínica',
    'dengue', 'malaria', 'paludismo', 'intoxicacion', 'intoxicación',
    'salud publica', 'salud pública', 'vacunacion', 'vacunación',
    'emergencia sanitaria', 'muertes por', 'fallecidos por'
  ],

  // Infraestructura
  infraestructura: [
    'via cerrada', 'vía cerrada', 'carretera bloqueada', 'puente caido',
    'puente caído', 'obras', 'pavimentacion', 'pavimentación',
    'acueducto', 'energia electrica', 'energía eléctrica', 'apagon',
    'apagón', 'servicio de agua', 'alcantarillado'
  ]
};

// ================= SECCIÓN: COMBINACIONES VIOLENCIA POLÍTICA =================
// Palabras que al combinarse indican violencia política
const PALABRAS_AMENAZA = [
  'amenaza', 'amenazas', 'amenazar', 'amenazado', 'amenazaron',
  'atentado', 'atentan', 'atacaron', 'acusado'
];

const PALABRAS_ACTOR_POLITICO = [
  'candidato', 'candidatos', 'candidata', 'candidatas',
  'politico', 'político', 'politica', 'política',
  'congresista', 'senador', 'senadora',
  'representante', 'alcalde', 'alcaldesa',
  'concejal', 'concejala', 'diputado', 'diputada',
  'gobernador', 'gobernadora',
  'lider politico', 'líder político',
  'lider social', 'líder social',
  'ex candidato', 'excandidato'
];

// ================= SECCIÓN: FUNCIÓN CLASIFICADORA =================
function clasificarNoticia(titulo) {
  const textoNorm = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // ── PASO 1: Homicidio tiene máxima prioridad ──────────────────────────────
  for (const palabra of CATEGORIAS.homicidio) {
    const pNorm = palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (textoNorm.includes(pNorm)) return 'homicidio';
  }

  // ── PASO 2: Feminicidio segunda prioridad ─────────────────────────────────
  for (const palabra of CATEGORIAS.feminicidio) {
    const pNorm = palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (textoNorm.includes(pNorm)) return 'feminicidio';
  }

  // ── PASO 3: Violencia política por COMBINACIÓN ───────────────────────────
  // Si el título tiene amenaza/atentado + actor político = violencia política
  const tieneAmenaza = PALABRAS_AMENAZA.some(p =>
    textoNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
  const tieneActor = PALABRAS_ACTOR_POLITICO.some(p =>
    textoNorm.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
  if (tieneAmenaza && tieneActor) return 'violencia_politica';

  // ── PASO 4: Violencia política por FRASE EXACTA ──────────────────────────
  for (const palabra of CATEGORIAS.violencia_politica) {
    const pNorm = palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (textoNorm.includes(pNorm)) return 'violencia_politica';
  }

  // ── PASO 5: Resto de categorías en orden ─────────────────────────────────
  const restoCategorias = ['orden_publico','desplazamiento','mineria','clima','salud','infraestructura'];
  for (const cat of restoCategorias) {
    for (const palabra of CATEGORIAS[cat]) {
      const pNorm = palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (textoNorm.includes(pNorm)) return cat;
    }
  }

  return 'general';
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  CATEGORIAS,
  clasificarNoticia
};