// ================= SECCIÓN: DICCIONARIO DE CATEGORÍAS =================
const CATEGORIAS = {

  // Violencia física — máxima prioridad
  homicidio: [
    'homicidio', 'asesinado', 'asesinato', 'muerto a tiros', 'baleado',
    'cadaver', 'cadáver', 'cuerpo sin vida', 'hallado muerto', 'ultimado',
    'sicario', 'disparos', 'mató', 'mataron', 'ejecutado',
    // Tipos de vulneración específicos
    'homicidio múltiple', 'homicidio multiple', 'masacre',
    'homicidio lider social', 'homicidio líder social',
    'homicidio funcionario', 'homicidio fuerza publica',
    'homicidio fuerza pública', 'policía muerto', 'policia muerto',
    'soldado muerto', 'militar muerto', 'agente muerto',
  ],

  // Violencia de género
  feminicidio: [
    'feminicidio', 'femicidio', 'mujer asesinada', 'mujer muerta',
    'violencia de genero', 'violencia de género', 'violencia contra la mujer',
    'agresion a mujer', 'agresión a mujer', 'pareja la mato', 'esposo la mato'
  ],

  // Violencia política — VA ANTES DE ORDEN PÚBLICO para tener prioridad
  violencia_politica: [
    'violencia politica', 'violencia política',
    'amenaza candidato', 'amenaza a candidato', 'amenazaron candidato',
    'amenazas a candidato', 'amenazas candidatos', 'amenaza a candidatos',
    'amenaza directa candidato', 'amenazas directas candidatos',
    'amenazar candidato', 'amenazar a candidato', 'acusado amenazar candidato',
    'amenaza a ex candidato', 'amenazar a ex candidato',
    'atentado candidato', 'atentado contra candidato',
    'asesinato candidato', 'candidato asesinado', 'candidato muerto',
    'candidato amenazado', 'candidatos amenazados', 'candidatos en riesgo',
    'ex candidato amenazado', 'amenazas candidato',
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
    'amenazas directas a candidatos',
  ],

  // Orden público — conflicto armado y seguridad territorial
  orden_publico: [
    // Grupos armados principales
    'eln', 'farc', 'clan del golfo', 'agc', 'egc', 'autodefensas',
    'disidencias', 'guerrilla', 'paramilitares',
    'ejercito libertadores de colombia',
    // Grupos urbanos Medellín y Antioquia
    'la terraza', 'los chatas', 'los triana', 'pachelly',
    'los del bajo', 'trianon', 'trianón', 'caicedo', 'la sierra', 'robledo',
    'la miel', 'san pablo', 'los del 20', 'carne rancia', 'el salacho',
    'los machacos', 'halcones ii', 'los pacheco', 'los de las flores',
    'el polvorin', 'el polvorín', 'los juaquinillos', 'mondongueros',
    'oficina del doce', 'el oasis', 'union subversiva', 'unión subversiva',
    'los marihuanos', 'el mesa', 'gdco', 'gdo',
    'frente 36', 'frente 18', 'frente 37',
    // Artefactos y minas
    'mina antipersonal', 'activacion map', 'activación map',
    'map activada', 'mina activada', 'mina antipersona',
    // Tipos de vulneración (convivencia y seguridad)
    'ataque armado', 'hostigamiento', 'enfrentamiento', 'combates', 'combate',
    'extorsion', 'extorsión', 'vacuna extorsion', 'cobro extorsivo',
    'secuestro', 'desaparicion forzada', 'desaparición forzada',
    'operativo', 'captura', 'detenidos', 'narcotráfico', 'narcotrafico',
    'grupo armado', 'amenaza', 'reclutamiento', 'reclutamiento de menores',
    'reclutamiento de nna', 'menores reclutados',
    // Tipos de vulneración específicos
    'asonada', 'confinamiento', 'artefacto explosivo', 'cilindro bomba',
    'granada', 'explosivo', 'bomba', 'terrorismo',
    'proselitismo ilegal', 'panfleto amenazante', 'panfleto intimidatorio',
    'captura cabecilla', 'cabecilla capturado', 'neutralizado cabecilla',
    'neutralizacion cabecilla', 'neutralización cabecilla',
    'extincion de dominio', 'extinción de dominio',
    'lavado de activos', 'bienes incautados',
    'droga', 'narco', 'cargamento', 'cocaina', 'cocaína', 'heroina',
    'herramienta', 'hallazgo de armas', 'caleta de armas',
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

// ================= SECCIÓN: FUNCIÓN CLASIFICADORA =================
function clasificarNoticia(titulo) {
  const textoNorm = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [categoria, palabras] of Object.entries(CATEGORIAS)) {
    for (const palabra of palabras) {
      const palabraNorm = palabra
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (textoNorm.includes(palabraNorm)) {
        return categoria;
      }
    }
  }

  return 'general';
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = { CATEGORIAS, clasificarNoticia };