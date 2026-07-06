// ================= SECCIÓN: DICCIONARIO DE CATEGORÍAS =================
const CATEGORIAS = {

  // Violencia física — máxima prioridad
  homicidio: [
    // Raíces (stem:) — atrapan TODAS las conjugaciones: asesinan, asesinaron,
    // asesinada(s), baleados, acribillaron... (fugas halladas en auditoría)
    'stem:homicid', 'stem:asesin', 'stem:balead', 'stem:acribillad', 'stem:apuñal', 'stem:apunal',
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
    'stem:secuestr',  // Raíz: secuestro, secuestrado, secuestraron, secuestradores
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

// ================= SECCIÓN: FUNCIÓN CLASIFICADORA (MOTOR v2) =================
// Mejoras de la v2 (halladas en auditoría con datos reales):
//   1. FRONTERA DE PALABRA: antes 'mato' coincidía DENTRO de "formato" y 'eln'
//      dentro de otras palabras (subcadena pura). Ahora la puntuación se vuelve
//      espacio y cada palabra clave exige espacios a ambos lados.
//   2. RAÍCES (prefijo 'stem:'): 'stem:asesin' atrapa asesinato, asesinan,
//      asesinaron, asesinada(s)... La raíz solo exige frontera IZQUIERDA,
//      dejando libre la terminación verbal.
//   3. REGLA FEMINICIDIO PRIORITARIA: si hay verbo de muerte + referencia a
//      mujer, gana feminicidio ANTES del diccionario (antes caía en homicidio
//      porque esa categoría se evalúa primero).

// Normaliza: minúsculas, sin tildes, puntuación → espacio (habilita fronteras)
function normalizarTexto(s) {
  return (s || '')
    .toLowerCase()                          // Minúsculas
    .normalize('NFD')                       // Separar letra y acento
    .replace(/[\u0300-\u036f]/g, '')        // Quitar los acentos
    .replace(/[^a-z0-9ñ]+/g, ' ');          // Puntuación y símbolos → espacio
}

// Verifica una palabra clave contra el texto (ya normalizado y con bordes ' ')
// REGLAS DE COINCIDENCIA:
//   • 'stem:xxx'      → frontera solo izquierda (raíz explícita)
//   • palabra ≤ 4 letras y sin espacios → frontera BILATERAL automática
//     (protege 'mato', 'eln', 'farc', 'agc' de coincidir dentro de otras
//      palabras como "forMATO" o "MATOrrales")
//   • resto           → frontera izquierda (tolera plurales y conjugaciones:
//     'inundacion' atrapa "inundaciones", 'amenaza' atrapa "amenazas")
function coincide(textoConBordes, palabra) {
  if (palabra.startsWith('stem:')) {                        // Sintaxis de RAÍZ explícita
    const raiz = normalizarTexto(palabra.slice(5)).trim();  // Quitar el prefijo
    return textoConBordes.includes(' ' + raiz);             // Frontera solo a la izquierda
  }
  const p = normalizarTexto(palabra).trim();                // Palabra/frase normalizada
  const esCortaSimple = !p.includes(' ') && p.length <= 4;  // ¿Palabra corta de riesgo?
  return esCortaSimple
    ? textoConBordes.includes(' ' + p + ' ')                // Bilateral: palabra exacta
    : textoConBordes.includes(' ' + p);                     // Izquierda: tolera terminaciones
}

function clasificarNoticia(titulo) {
  // Bordes de espacio: permiten exigir frontera también al inicio y final del título
  const texto = ' ' + normalizarTexto(titulo) + ' ';

  // ── REGLA PRIORITARIA: feminicidio = verbo de muerte + referencia a mujer ──
  // Se evalúa ANTES del diccionario porque es la categoría más específica.
  const hayMuerte = ['stem:asesin', 'stem:apuñal', 'stem:apunal', 'stem:acribillad',
                     'hallada muerta', 'stem:estrangul', 'mataron', 'mato']
    .some(p => coincide(texto, p));                         // ¿Verbo/indicio de muerte?
  const hayMujer  = [' mujer ', ' mujeres ', ' madre ', ' hija ', ' hijas ', ' esposa ', ' novia ', ' niña ', ' nina ', ' companera sentimental ']
    .some(p => texto.includes(p)) || coincide(texto, 'stem:femin'); // ¿Víctima mujer?
  if (hayMuerte && hayMujer) return 'feminicidio';          // Combinación → feminicidio

  // ── Diccionario por prioridad (el ORDEN de CATEGORIAS define la prioridad) ──
  for (const [categoria, palabras] of Object.entries(CATEGORIAS)) {
    for (const palabra of palabras) {
      if (coincide(texto, palabra)) return categoria;       // Primera coincidencia gana
    }
  }

  return 'general';                                         // Sin coincidencias → general
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = { CATEGORIAS, clasificarNoticia };