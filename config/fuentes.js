// ================= SECCIÓN: PUNTUACIÓN DE FUENTES =================
// Sistema de scoring para ordenar noticias por credibilidad del medio.
// Alta=3, Media=2, Baja=1, Desconocido=1 (por defecto)
// Para agregar nuevas fuentes, añade el nombre exacto como aparece
// al final del título de la noticia (después del último " - ")

const FUENTES = {

  // ── NIVEL ALTA (3) ────────────────────────────────────────────────────────
  // Medios con procesos de verificación rigurosos. Noticias confirmadas.
  alta: [
    // Prensa y TV Regional
    'El Colombiano', 'Teleantioquia', 'Telemedellín', 'Telemedellín Noticias',
    // Grandes cadenas de radio
    'Blu Radio', 'Caracol Radio', 'RCN Radio', 'La FM', 'W Radio',
    // Prensa nacional
    'El Tiempo', 'El Espectador', 'Revista Semana', 'Semana',
    // Agencias y TV
    'NTN24', 'Noticias Caracol', 'Noticias RCN', 'Agencia EFE', 'EFE',
    // Digitales de alta credibilidad
    'Infobae', 'Infobae Colombia', 'La Silla Vacía', 'La Silla Vacia',
    // Investigación
    'Agencia de Periodismo Investigativo', 'API Colombia', 'Cuestión Pública',
  ],

  // ── NIVEL MEDIA (2) ───────────────────────────────────────────────────────
  // Fuentes clave para municipios donde los grandes medios no llegan.
  media: [
    // Oriente antioqueño
    'MiOriente', 'Mi Oriente', 'Actualidad Oriente', 'DiariOriente', 'Orientese.co',
    // Norte y otros
    'El Norte', 'Periódico El Norte', 'Mi Suroeste',
    // Digitales consolidados
    'Minuto30', 'IFM Noticias', 'Alerta Paisa', 'Vivir en El Poblado',
    // Investigación local
    'Análisis Urbano', 'Analisis Urbano', 'Universo Centro',
    // Institucionales
    'RTVC', 'RTVC Noticias', 'Señal Colombia', 'Canal Institucional',
    // Urabá y otros
    'La Chiva de Urabá', 'La Chiva de Uraba',
    'Informativo Antioquia', 'Hora 13 Noticias', 'Hora13',
  ],

  // ── NIVEL BAJA (1) ────────────────────────────────────────────────────────
  // Útiles para detectar algo que está pasando, pero no como fuente definitiva.
  baja: [
    // Agregadores y viralidad
    'Pulzo', 'Kienyke', 'Estrella Digital Colombia', 'Estrella Digital',
    // Portales de denuncia social
    'Denuncias Antioquia', 'Guardianes Antioquia', 'Colombia Oscura',
    // Otros pequeños
    'La Cuarta Estación', 'Centrópolis', 'Centropolis',
    'ContraRéplica', 'Contrareplica',
  ],
};

// ── MAPA DE PUNTUACIONES ──────────────────────────────────────────────────
// Construye un mapa nombre→puntuación para búsqueda rápida
const MAPA_PUNTUACIONES = {};
FUENTES.alta.forEach(f  => { MAPA_PUNTUACIONES[f.toLowerCase()] = 3; });
FUENTES.media.forEach(f => { MAPA_PUNTUACIONES[f.toLowerCase()] = 2; });
FUENTES.baja.forEach(f  => { MAPA_PUNTUACIONES[f.toLowerCase()] = 1; });

// ================= SECCIÓN: FUNCIÓN PRINCIPAL =================
/**
 * Extrae el nombre del medio del título y retorna su puntuación.
 * Los títulos de Google News vienen como "Título de la noticia - Nombre del Medio"
 * @param {string} titulo - Título completo de la noticia
 * @returns {number} Puntuación: 3=Alta, 2=Media, 1=Baja/Desconocido
 */
function obtenerPuntuacionFuente(titulo) {
  if (!titulo || !titulo.includes(' - ')) return 1; // Sin medio identificable

  // Extraer el nombre del medio (última parte después del " - ")
  const partes = titulo.split(' - ');
  const medio  = partes[partes.length - 1].trim().toLowerCase();

  // Buscar coincidencia exacta primero
  if (MAPA_PUNTUACIONES[medio] !== undefined) {
    return MAPA_PUNTUACIONES[medio];
  }

  // Buscar coincidencia parcial (por si el nombre viene con variaciones)
  for (const [nombre, puntuacion] of Object.entries(MAPA_PUNTUACIONES)) {
    if (medio.includes(nombre) || nombre.includes(medio)) {
      return puntuacion;
    }
  }

  return 1; // Fuente desconocida = nivel bajo por defecto
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = { obtenerPuntuacionFuente, FUENTES, MAPA_PUNTUACIONES };