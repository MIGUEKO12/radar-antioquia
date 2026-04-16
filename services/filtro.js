// ================= SECCIÓN: FILTRO DE CALIDAD DE NOTICIAS =================
// Este archivo actúa como capa de corrección DESPUÉS del clasificador.
// No borra noticias — las reclasifica a General si detecta ruido o contexto incorrecto.
// Se aplica antes de guardar en la DB.

// ================= SECCIÓN: PALABRAS CRÍTICAS (no se pueden bajar a General) =================
// Si el título tiene estas palabras, la noticia NUNCA va a General por lista negra
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
// Si el título tiene 2 o más palabras de un grupo, va a General
const GRUPOS_RUIDO = [
  // Deportes
  ['fútbol', 'futbol', 'gol', 'partido', 'liga betplay', 'marcador',
   'empate', 'derrota', 'victoria deportiva', 'campeón', 'torneo',
   'ciclismo', 'etapa', 'pelotón', 'medalla', 'olimpiadas'],

  // Farándula y entretenimiento
  ['farándula', 'farandula', 'chisme', 'celebridad', 'famoso',
   'álbum', 'album', 'concierto', 'artista musical', 'cantante',
   'documental', 'estreno', 'serie de tv', 'película', 'temporada',
   'reality', 'programa de televisión', 'novela', 'actor', 'actriz'],

  // Negocios y economía general
  ['bolsa de valores', 'acciones', 'inversión empresarial',
   'centro logístico', 'millones de medicamentos', 'distribución farmacéutica',
   'cooperativa', 'supermercado', 'retail'],

  // Trámites y servicios
  ['pasaporte', 'sistema operativo de pasaportes', 'falla en sistema',
   'registro civil', 'notaría', 'pico y placa', 'impuesto predial'],

  // Fauna sin contexto de seguridad
  ['hipopótamo', 'hipopótamos', 'hipopotamo', 'hipopotamos'],
];

// ================= SECCIÓN: PALABRAS NEGRAS INDIVIDUALES =================
// Una sola de estas palabras es suficiente para ir a General
const PALABRAS_NEGRAS_INDIVIDUALES = [
  'hipopótamo', 'hipopótamos', 'hipopotamo', 'hipopotamos',
  'horóscopo', 'horoscopo',
  'receta de cocina', 'ingredientes para',
  'liga betplay en vivo', 'en vivo online partido',
  'resumen y goles', 'resultado del partido'
];

// ================= SECCIÓN: REGLAS DE RECLASIFICACIÓN =================
// Corrige noticias mal clasificadas por contexto
const REGLAS_RECLASIFICACION = [
  // Declaraciones políticas → General (no Orden público)
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['respondió', 'amenaza'],
      ['reaccionó', 'amenaza'],
      ['declaró', 'amenaza'],
      ['dijo', 'amenaza'],
      ['opinó', 'amenaza'],
      ['respondió', 'petro'],
      ['bravucón'],
      ['polémica', 'declaraciones'],
      ['debate', 'político'],
      ['falla en sistema'],
      ['sistema operativo'],
      ['pasaporte'],
      ['trámite'],
    ],
    nuevaCategoria: 'general'
  },
  // Operativos contra minería → Minería (no Orden público)
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['operativo', 'minería'],
      ['operativo', 'mineria'],
      ['operativo', 'dragas'],
      ['destruidas', 'dragas'],
      ['incautadas', 'dragas'],
      ['minería ilegal', 'captura'],
      ['minería ilegal', 'operativo'],
    ],
    nuevaCategoria: 'mineria'
  },
  // Crecientes y desbordamientos → Clima (no Orden público)
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['creciente', 'río'],
      ['creciente', 'rio'],
      ['desbordamiento'],
      ['desborde', 'río'],
      ['emergencia', 'río'],
      ['alerta', 'creciente'],
    ],
    nuevaCategoria: 'clima'
  },
  // Desplazamiento intraurbano → Orden público (ya unificado)
  {
    categoriaActual: 'desplazamiento',
    patronesTitulo: [
      ['violencia intraurbana'],
      ['desplazamiento', 'violencia'],
      ['desplazamiento', 'grupos'],
      ['desplazamiento', 'bandas'],
    ],
    nuevaCategoria: 'orden_publico'
  },
  // Documentales/cultura con palabras de orden público → General
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['documental', 'combate'],
      ['documental', 'reclutamiento'],
      ['history', 'reclutamiento'],
      ['history', 'combate'],
      ['proyecto', 'reclutamiento', 'alcaldía'],
      ['combate', 'reclutamiento', 'alcaldía'],
    ],
    nuevaCategoria: 'general'
  },
  // Amenazas a candidatos mal clasificadas → Violencia política
  {
    categoriaActual: 'orden_publico',
    patronesTitulo: [
      ['amenaza', 'candidato'],
      ['amenazas', 'candidato'],
      ['amenaza', 'candidata'],
      ['amenazas', 'candidata'],
      ['amenaza', 'político'],
      ['amenazas', 'político'],
      ['amenaza', 'congresista'],
      ['amenaza', 'senador'],
      ['amenaza', 'alcalde'],
      ['recompensa', 'candidato'],
      ['recompensa', 'candidata'],
    ],
    nuevaCategoria: 'violencia_politica'
  }
];

// ================= SECCIÓN: FUNCIÓN PRINCIPAL =================
/**
 * Aplica filtros de calidad a una noticia ya clasificada.
 * @param {string} titulo - Título de la noticia
 * @param {string} categoria - Categoría asignada por el clasificador
 * @returns {string} Categoría final (puede ser la misma o corregida)
 */
function aplicarFiltro(titulo, categoria) {
  const tNorm = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ── PASO 1: Verificar palabras críticas ───────────────────────────────────
  // Si tiene palabras críticas, la categoría no se puede bajar a General
  const tieneCritica = PALABRAS_CRITICAS.some(p => {
    const pNorm = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return tNorm.includes(pNorm);
  });

  // ── PASO 2: Palabras negras individuales → General ────────────────────────
  if (!tieneCritica) {
    const tieneNegra = PALABRAS_NEGRAS_INDIVIDUALES.some(p => {
      const pNorm = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return tNorm.includes(pNorm);
    });
    if (tieneNegra) return 'general';
  }

  // ── PASO 3: Grupos de ruido — 2 o más palabras del mismo grupo → General ──
  if (!tieneCritica) {
    for (const grupo of GRUPOS_RUIDO) {
      const coincidencias = grupo.filter(p => {
        const pNorm = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return tNorm.includes(pNorm);
      });
      if (coincidencias.length >= 2) return 'general';
    }
  }

  // ── PASO 4: Reglas de reclasificación ─────────────────────────────────────
  for (const regla of REGLAS_RECLASIFICACION) {
    if (regla.categoriaActual !== categoria) continue;

    for (const patron of regla.patronesTitulo) {
      const todasPresentes = patron.every(p => {
        const pNorm = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return tNorm.includes(pNorm);
      });
      if (todasPresentes) return regla.nuevaCategoria;
    }
  }

  // Sin cambios — la categoría original es correcta
  return categoria;
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = { aplicarFiltro };