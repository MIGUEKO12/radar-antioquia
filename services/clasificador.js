// ================= SECCIÓN: DICCIONARIO DE CATEGORÍAS =================
// Cada categoría tiene un array de palabras clave que la identifican.
// El orden importa: las categorías más específicas van primero.

const CATEGORIAS = {

  // Violencia física — máxima prioridad por impacto en convivencia
  homicidio: [
    'homicidio', 'asesinado', 'asesinato', 'muerto a tiros', 'baleado',
    'cadaver', 'cadáver', 'cuerpo sin vida', 'hallado muerto', 'ultimado',
    'sicario', 'disparos', 'mató', 'mataron', 'ejecutado'
  ],

  // Violencia de género — indicador clave para políticas de convivencia
  feminicidio: [
    'feminicidio', 'femicidio', 'mujer asesinada', 'mujer muerta',
    'violencia de genero', 'violencia de género', 'violencia contra la mujer',
    'agresion a mujer', 'agresión a mujer', 'pareja la mato', 'esposo la mato'
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

  // Desplazamiento — crisis humanitaria
  desplazamiento: [
    'desplazamiento', 'desplazados', 'desplazamiento masivo',
    'familias huyen', 'comunidad abandona', 'éxodo', 'refugiados'
  ],

  // Minería — legal e ilegal, impacto ambiental y económico
  mineria: [
    'mineria', 'minería', 'minero', 'mina de oro', 'extraccion',
    'extracción', 'dragas', 'retroexcavadora', 'mineria ilegal',
    'minería ilegal', 'accidente minero', 'derrumbe en mina',
    'carbón', 'carbon', 'oro', 'plata', 'socavon', 'socavón'
  ],

  // Desastres naturales y clima — Antioquia es muy vulnerable
  clima: [
    'lluvia', 'inundacion', 'inundación', 'derrumbe', 'deslizamiento',
    'avalancha', 'vendaval', 'granizada', 'creciente', 'rio crecido',
    'río crecido', 'alerta roja', 'alerta amarilla', 'emergencia climatica',
    'emergencia climática', 'desastre natural', 'temporada de lluvias',
    'sequia', 'sequía', 'incendio forestal'
  ],

  // Salud pública — epidemias, hospitales, servicios
  salud: [
    'epidemia', 'brote', 'contagio', 'hospital', 'clinica', 'clínica',
    'dengue', 'malaria', 'paludismo', 'intoxicacion', 'intoxicación',
    'salud publica', 'salud pública', 'vacunacion', 'vacunación',
    'emergencia sanitaria', 'muertes por', 'fallecidos por'
  ],

  // Infraestructura — vías, servicios, obras
  infraestructura: [
    'via cerrada', 'vía cerrada', 'carretera bloqueada', 'puente caido',
    'puente caído', 'obras', 'pavimentacion', 'pavimentación',
    'acueducto', 'energia electrica', 'energía eléctrica', 'apagon',
    'apagón', 'servicio de agua', 'alcantarillado'
  ]
};

// ================= SECCIÓN: FUNCIÓN CLASIFICADORA =================
/**
 * Clasifica una noticia en una categoría según su título.
 * Retorna la primera categoría que haga match (orden de prioridad importa).
 * @param {string} titulo - Título de la noticia a clasificar
 * @returns {string} Nombre de la categoría detectada o 'general'
 */
function clasificarNoticia(titulo) {
  // Normalizamos el texto: minúsculas y sin tildes para comparación robusta
  const textoNorm = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina diacríticos

  // Iteramos categorías en orden de definición (más específicas primero)
  for (const [categoria, palabras] of Object.entries(CATEGORIAS)) {
    for (const palabra of palabras) {
      // Normalizamos también la palabra clave
      const palabraNorm = palabra
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (textoNorm.includes(palabraNorm)) {
        return categoria; // Retornamos la primera categoría que haga match
      }
    }
  }

  return 'general'; // Si ninguna categoría hace match, es noticia general
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  CATEGORIAS,
  clasificarNoticia
};
