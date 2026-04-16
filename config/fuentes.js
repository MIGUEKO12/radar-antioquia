// ================= SECCIÓN: PUNTUACIÓN DE FUENTES =================
// Sistema de scoring para ordenar noticias por credibilidad del medio.
// Alta=100, Media=50, Baja=10, Desconocido=10 (por defecto)
// Rango amplio para permitir niveles futuros (ej: Diamante=500 para fuentes oficiales)

const FUENTES = {

  // ── NIVEL ALTA (100) ──────────────────────────────────────────────────────
  alta: [
    // Prensa y TV Regional
    'El Colombiano', 'Teleantioquia', 'Telemedellín', 'Telemedellín Noticias',
    // Grandes cadenas de radio
    'Blu Radio', 'Caracol Radio', 'RCN Radio', 'La FM', 'W Radio',
    // Prensa nacional
    'El Tiempo', 'ELTIEMPO.COM', 'El Espectador', 'Revista Semana', 'Semana',
    // Agencias y TV
    'NTN24', 'Noticias Caracol', 'Noticias RCN', 'Agencia EFE', 'EFE',
    'El Heraldo', 'ELHERALDO.CO',
    // Digitales de alta credibilidad
    'Infobae', 'Infobae Colombia', 'La Silla Vacía', 'La Silla Vacia',
    // Investigación
    'Agencia de Periodismo Investigativo', 'API Colombia', 'Cuestión Pública',
  ],

  // ── NIVEL MEDIA (50) ──────────────────────────────────────────────────────
  media: [
    // Oriente antioqueño
    'MiOriente', 'Mi Oriente', 'Actualidad Oriente', 'DiariOriente', 'Orientese.co',
    // Norte y otros
    'El Norte', 'Periódico El Norte', 'elnorte.com.co', 'Mi Suroeste',
    // Opinión regional
    'La Opinión', 'La Opinion',
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

  // ── NIVEL BAJA (10) ───────────────────────────────────────────────────────
  baja: [
    // Agregadores y viralidad
    'Pulzo', 'Kienyke', 'Estrella Digital Colombia', 'Estrella Digital',
    'Colombia.com',
    // Portales de denuncia social
    'Denuncias Antioquia', 'Guardianes Antioquia', 'Colombia Oscura',
    // Otros pequeños
    'La Cuarta Estación', 'Centrópolis', 'Centropolis',
    'ContraRéplica', 'Contrareplica',
  ],
};

// ── MAPA DE PUNTUACIONES ──────────────────────────────────────────────────
const MAPA_PUNTUACIONES = {};
FUENTES.alta.forEach(f  => { MAPA_PUNTUACIONES[f.toLowerCase()] = 100; });
FUENTES.media.forEach(f => { MAPA_PUNTUACIONES[f.toLowerCase()] = 50; });
FUENTES.baja.forEach(f  => { MAPA_PUNTUACIONES[f.toLowerCase()] = 10; });

// ================= SECCIÓN: FUNCIÓN PRINCIPAL =================
function obtenerPuntuacionFuente(titulo) {
  if (!titulo || !titulo.includes(' - ')) return 10;

  const partes   = titulo.split(' - ');
  const medioRaw = partes[partes.length - 1].trim().toLowerCase();
  // Limpiar dominios como .com, .co, .net, .org
  const medio    = medioRaw.replace(/\.(com|co|net|org|com\.co)$/, '').trim();

  // Buscar coincidencia exacta
  if (MAPA_PUNTUACIONES[medio] !== undefined) return MAPA_PUNTUACIONES[medio];

  // Buscar coincidencia parcial
  for (const [nombre, puntuacion] of Object.entries(MAPA_PUNTUACIONES)) {
    if (medio.includes(nombre) || nombre.includes(medio)) return puntuacion;
  }

  return 10; // Fuente desconocida = nivel bajo por defecto
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = { obtenerPuntuacionFuente, FUENTES, MAPA_PUNTUACIONES };