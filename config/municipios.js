// ================================================================================
// config/municipios.js — GAZETTEER MUNICIPAL DE ANTIOQUIA (v2)
// --------------------------------------------------------------------------------
// Detección determinística de municipio SIN IA:
//   1. Analiza TÍTULO y DESCRIPCIÓN del RSS (antes solo el título).
//   2. Nombres ambiguos ("Bello", "Granada", "Armenia"...) requieren contexto
//      antioqueño en el texto para ser aceptados — evita falsos positivos.
//   3. Anti-patrones descartan equipos de fútbol, vías y otros usos no geográficos.
//   4. Puntuación de confianza: título pesa más que descripción; gana el mejor.
//   5. Mantiene compatibilidad total: exporta SUBREGIONES, MUNICIPIO_A_SUBREGION
//      y detectarUbicacion con la misma firma (el 2º parámetro es opcional).
// ================================================================================

// ================= SECCIÓN: GAZETTEER OFICIAL — 125 MUNICIPIOS =================
// Fuente: GeoJSON oficial (Municipios_Antioquia.geojson), generado automáticamente.
//   slug      → nombre canónico sin tildes, en minúsculas (valor guardado en BD).
//   nombre    → nombre para mostrar, con tildes correctas.
//   subregion → clave interna de subregión (coincide con mapa y filtros).
//   ambiguo   → true si comparte nombre con lugares famosos, palabras comunes,
//               apellidos, barrios o bandas; exige contexto antioqueño.
// Ordenado de nombre MÁS LARGO a MÁS CORTO: "El Carmen de Viboral" se evalúa
// antes de que fragmentos cortos puedan interferir.
const GAZETTEER = [
  { slug: 'san pedro de los milagros', nombre: 'San Pedro de los Milagros', subregion: 'norte', ambiguo: false },
  { slug: 'san andres de cuerquia', nombre: 'San Andrés de Cuerquia', subregion: 'norte', ambiguo: false },
  { slug: 'san jose de la montana', nombre: 'San José de la Montaña', subregion: 'norte', ambiguo: false },
  { slug: 'santa fe de antioquia', nombre: 'Santa Fe de Antioquia', subregion: 'occidente', ambiguo: false },
  { slug: 'el carmen de viboral', nombre: 'El Carmen de Viboral', subregion: 'oriente', ambiguo: false },
  { slug: 'san pedro de uraba', nombre: 'San Pedro de Urabá', subregion: 'uraba', ambiguo: false },
  { slug: 'santa rosa de osos', nombre: 'Santa Rosa de Osos', subregion: 'norte', ambiguo: false },
  { slug: 'san juan de uraba', nombre: 'San Juan de Urabá', subregion: 'uraba', ambiguo: false },
  { slug: 'vigia del fuerte', nombre: 'Vigía del Fuerte', subregion: 'uraba', ambiguo: false },
  { slug: 'ciudad bolivar', nombre: 'Ciudad Bolívar', subregion: 'suroeste', ambiguo: true },
  { slug: 'puerto triunfo', nombre: 'Puerto Triunfo', subregion: 'magdalena', ambiguo: false },
  { slug: 'puerto berrio', nombre: 'Puerto Berrío', subregion: 'magdalena', ambiguo: false },
  { slug: 'san francisco', nombre: 'San Francisco', subregion: 'oriente', ambiguo: true },
  { slug: 'santa barbara', nombre: 'Santa Bárbara', subregion: 'suroeste', ambiguo: true },
  { slug: 'santo domingo', nombre: 'Santo Domingo', subregion: 'nordeste', ambiguo: true },
  { slug: 'el santuario', nombre: 'El Santuario', subregion: 'oriente', ambiguo: false },
  { slug: 'san jeronimo', nombre: 'San Jerónimo', subregion: 'occidente', ambiguo: false },
  { slug: 'angelopolis', nombre: 'Angelópolis', subregion: 'suroeste', ambiguo: false },
  { slug: 'canasgordas', nombre: 'Cañasgordas', subregion: 'occidente', ambiguo: false },
  { slug: 'gomez plata', nombre: 'Gomez Plata', subregion: 'norte', ambiguo: false },
  { slug: 'la estrella', nombre: 'La Estrella', subregion: 'aburra', ambiguo: true },
  { slug: 'pueblorrico', nombre: 'Pueblorrico', subregion: 'suroeste', ambiguo: false },
  { slug: 'puerto nare', nombre: 'Puerto Nare', subregion: 'magdalena', ambiguo: false },
  { slug: 'sabanalarga', nombre: 'Sabanalarga', subregion: 'occidente', ambiguo: true },
  { slug: 'san vicente', nombre: 'San Vicente', subregion: 'oriente', ambiguo: false },
  { slug: 'alejandria', nombre: 'Alejandría', subregion: 'oriente', ambiguo: false },
  { slug: 'campamento', nombre: 'Campamento', subregion: 'norte', ambiguo: true },
  { slug: 'concepcion', nombre: 'Concepción', subregion: 'oriente', ambiguo: true },
  { slug: 'copacabana', nombre: 'Copacabana', subregion: 'aburra', ambiguo: true },
  { slug: 'don matias', nombre: 'Don Matías', subregion: 'norte', ambiguo: false },
  { slug: 'entrerrios', nombre: 'Entrerrios', subregion: 'norte', ambiguo: false },
  { slug: 'la pintada', nombre: 'La Pintada', subregion: 'suroeste', ambiguo: true },
  { slug: 'montebello', nombre: 'Montebello', subregion: 'suroeste', ambiguo: true },
  { slug: 'san carlos', nombre: 'San Carlos', subregion: 'oriente', ambiguo: true },
  { slug: 'san rafael', nombre: 'San Rafael', subregion: 'oriente', ambiguo: true },
  { slug: 'valparaiso', nombre: 'Valparaiso', subregion: 'suroeste', ambiguo: true },
  { slug: 'abejorral', nombre: 'Abejorral', subregion: 'oriente', ambiguo: false },
  { slug: 'angostura', nombre: 'Angostura', subregion: 'norte', ambiguo: true },
  { slug: 'arboletes', nombre: 'Arboletes', subregion: 'uraba', ambiguo: false },
  { slug: 'caramanta', nombre: 'Caramanta', subregion: 'suroeste', ambiguo: false },
  { slug: 'chigorodo', nombre: 'Chigorodó', subregion: 'uraba', ambiguo: false },
  { slug: 'concordia', nombre: 'Concordia', subregion: 'suroeste', ambiguo: true },
  { slug: 'el retiro', nombre: 'El Retiro', subregion: 'oriente', ambiguo: true },
  { slug: 'girardota', nombre: 'Girardota', subregion: 'aburra', ambiguo: false },
  { slug: 'guadalupe', nombre: 'Guadalupe', subregion: 'norte', ambiguo: true },
  { slug: 'heliconia', nombre: 'Heliconia', subregion: 'occidente', ambiguo: true },
  { slug: 'marinilla', nombre: 'Marinilla', subregion: 'oriente', ambiguo: false },
  { slug: 'san roque', nombre: 'San Roque', subregion: 'nordeste', ambiguo: true },
  { slug: 'abriaqui', nombre: 'Abriaquí', subregion: 'occidente', ambiguo: false },
  { slug: 'apartado', nombre: 'Apartadó', subregion: 'uraba', ambiguo: false },
  { slug: 'buritica', nombre: 'Buriticá', subregion: 'occidente', ambiguo: false },
  { slug: 'caracoli', nombre: 'Caracolí', subregion: 'magdalena', ambiguo: true },
  { slug: 'carolina', nombre: 'Carolina', subregion: 'norte', ambiguo: false },
  { slug: 'caucasia', nombre: 'Caucasia', subregion: 'bajocauca', ambiguo: false },
  { slug: 'cisneros', nombre: 'Cisneros', subregion: 'nordeste', ambiguo: true },
  { slug: 'el bagre', nombre: 'El Bagre', subregion: 'bajocauca', ambiguo: false },
  { slug: 'el penol', nombre: 'El Peñol', subregion: 'oriente', ambiguo: false },
  { slug: 'envigado', nombre: 'Envigado', subregion: 'aburra', ambiguo: false },
  { slug: 'fredonia', nombre: 'Fredonia', subregion: 'suroeste', ambiguo: true },
  { slug: 'frontino', nombre: 'Frontino', subregion: 'occidente', ambiguo: false },
  { slug: 'hispania', nombre: 'Hispania', subregion: 'suroeste', ambiguo: true },
  { slug: 'la union', nombre: 'La Unión', subregion: 'oriente', ambiguo: true },
  { slug: 'liborina', nombre: 'Liborina', subregion: 'occidente', ambiguo: false },
  { slug: 'medellin', nombre: 'Medellín', subregion: 'aburra', ambiguo: false },
  { slug: 'remedios', nombre: 'Remedios', subregion: 'nordeste', ambiguo: true },
  { slug: 'rionegro', nombre: 'Rionegro', subregion: 'oriente', ambiguo: false },
  { slug: 'sabaneta', nombre: 'Sabaneta', subregion: 'aburra', ambiguo: false },
  { slug: 'san luis', nombre: 'San Luis', subregion: 'oriente', ambiguo: true },
  { slug: 'sopetran', nombre: 'Sopetrán', subregion: 'occidente', ambiguo: false },
  { slug: 'titiribi', nombre: 'Titiribí', subregion: 'suroeste', ambiguo: false },
  { slug: 'valdivia', nombre: 'Valdivia', subregion: 'norte', ambiguo: false },
  { slug: 'zaragoza', nombre: 'Zaragoza', subregion: 'bajocauca', ambiguo: true },
  { slug: 'argelia', nombre: 'Argelia', subregion: 'oriente', ambiguo: true },
  { slug: 'armenia', nombre: 'Armenia', subregion: 'occidente', ambiguo: true },
  { slug: 'barbosa', nombre: 'Barbosa', subregion: 'aburra', ambiguo: true },
  { slug: 'belmira', nombre: 'Belmira', subregion: 'norte', ambiguo: false },
  { slug: 'betania', nombre: 'Betania', subregion: 'suroeste', ambiguo: true },
  { slug: 'betulia', nombre: 'Betulia', subregion: 'suroeste', ambiguo: true },
  { slug: 'briceno', nombre: 'Briceño', subregion: 'norte', ambiguo: true },
  { slug: 'caceres', nombre: 'Cáceres', subregion: 'bajocauca', ambiguo: true },
  { slug: 'caicedo', nombre: 'Caicedo', subregion: 'occidente', ambiguo: true },
  { slug: 'cocorna', nombre: 'Cocorná', subregion: 'oriente', ambiguo: false },
  { slug: 'dabeiba', nombre: 'Dabeiba', subregion: 'occidente', ambiguo: false },
  { slug: 'ebejico', nombre: 'Ebéjico', subregion: 'occidente', ambiguo: false },
  { slug: 'giraldo', nombre: 'Giraldo', subregion: 'occidente', ambiguo: true },
  { slug: 'granada', nombre: 'Granada', subregion: 'oriente', ambiguo: true },
  { slug: 'guatape', nombre: 'Guatapé', subregion: 'oriente', ambiguo: false },
  { slug: 'ituango', nombre: 'Ituango', subregion: 'norte', ambiguo: false },
  { slug: 'la ceja', nombre: 'La Ceja', subregion: 'oriente', ambiguo: false },
  { slug: 'murindo', nombre: 'Murindó', subregion: 'uraba', ambiguo: false },
  { slug: 'necocli', nombre: 'Necoclí', subregion: 'uraba', ambiguo: false },
  { slug: 'segovia', nombre: 'Segovia', subregion: 'nordeste', ambiguo: false },
  { slug: 'tamesis', nombre: 'Támesis', subregion: 'suroeste', ambiguo: true },
  { slug: 'uramita', nombre: 'Uramita', subregion: 'occidente', ambiguo: false },
  { slug: 'vegachi', nombre: 'Vegachí', subregion: 'nordeste', ambiguo: false },
  { slug: 'venecia', nombre: 'Venecia', subregion: 'suroeste', ambiguo: true },
  { slug: 'yarumal', nombre: 'Yarumal', subregion: 'norte', ambiguo: false },
  { slug: 'yolombo', nombre: 'Yolombó', subregion: 'nordeste', ambiguo: false },
  { slug: 'amalfi', nombre: 'Amalfi', subregion: 'nordeste', ambiguo: true },
  { slug: 'caldas', nombre: 'Caldas', subregion: 'aburra', ambiguo: true },
  { slug: 'carepa', nombre: 'Carepa', subregion: 'uraba', ambiguo: false },
  { slug: 'guarne', nombre: 'Guarne', subregion: 'oriente', ambiguo: false },
  { slug: 'itagui', nombre: 'Itagüí', subregion: 'aburra', ambiguo: false },
  { slug: 'jardin', nombre: 'Jardín', subregion: 'suroeste', ambiguo: true },
  { slug: 'jerico', nombre: 'Jericó', subregion: 'suroeste', ambiguo: false },
  { slug: 'mutata', nombre: 'Mutatá', subregion: 'uraba', ambiguo: false },
  { slug: 'narino', nombre: 'Nariño', subregion: 'oriente', ambiguo: true },
  { slug: 'salgar', nombre: 'Salgar', subregion: 'suroeste', ambiguo: true },
  { slug: 'sonson', nombre: 'Sonsón', subregion: 'oriente', ambiguo: false },
  { slug: 'taraza', nombre: 'Tarazá', subregion: 'bajocauca', ambiguo: false },
  { slug: 'toledo', nombre: 'Toledo', subregion: 'norte', ambiguo: true },
  { slug: 'amaga', nombre: 'Amagá', subregion: 'suroeste', ambiguo: false },
  { slug: 'andes', nombre: 'Andes', subregion: 'suroeste', ambiguo: true },
  { slug: 'anori', nombre: 'Anorí', subregion: 'nordeste', ambiguo: false },
  { slug: 'bello', nombre: 'Bello', subregion: 'aburra', ambiguo: true },
  { slug: 'maceo', nombre: 'Maceo', subregion: 'magdalena', ambiguo: true },
  { slug: 'nechi', nombre: 'Nechí', subregion: 'bajocauca', ambiguo: false },
  { slug: 'olaya', nombre: 'Olaya', subregion: 'occidente', ambiguo: true },
  { slug: 'peque', nombre: 'Peque', subregion: 'occidente', ambiguo: true },
  { slug: 'tarso', nombre: 'Tarso', subregion: 'suroeste', ambiguo: true },
  { slug: 'turbo', nombre: 'Turbo', subregion: 'uraba', ambiguo: false },
  { slug: 'urrao', nombre: 'Urrao', subregion: 'suroeste', ambiguo: false },
  { slug: 'yondo', nombre: 'Yondó', subregion: 'magdalena', ambiguo: false },
  { slug: 'anza', nombre: 'Anzá', subregion: 'occidente', ambiguo: false },
  { slug: 'yali', nombre: 'Yalí', subregion: 'nordeste', ambiguo: false },];

// ================= SECCIÓN: NORMALIZACIÓN DE TEXTO =================
// Convierte cualquier texto a su forma canónica de comparación:
// minúsculas + sin tildes (NFD separa la letra de su acento y el regex lo borra).
// Así "Apartadó" === "APARTADO" === "apartado".
function normalizar(texto) {
  return (texto || '')                    // Tolera null/undefined devolviendo ''
    .toLowerCase()                        // Todo a minúsculas
    .normalize('NFD')                     // Descompone: "ó" → "o" + acento
    .replace(/[\u0300-\u036f]/g, '');     // Elimina los acentos sueltos
}

// Versión para COINCIDENCIAS: además de normalizar, convierte puntuación en
// espacios ("Medellín-Bogotá" → "medellin bogota") para que guiones, comas y
// barras no rompan la detección de anti-patrones ni de nombres compuestos.
function normalizarParaMatch(texto) {
  return normalizar(texto)                // Reutiliza la normalización base
    .replace(/[^a-z0-9\s]/g, ' ')         // Cualquier símbolo → espacio
    .replace(/\s+/g, ' ');                // Colapsa espacios múltiples
}

// ================= SECCIÓN: ANTI-PATRONES (FALSOS POSITIVOS) =================
// Frases donde el nombre de un municipio NO significa ubicación geográfica.
// Si la coincidencia del municipio cae DENTRO de una de estas frases, se descarta.
// Todas están normalizadas (sin tildes, minúsculas).
const ANTI_PATRONES = [
  // ── Equipos deportivos ────────────────────────────────────────────────────
  'independiente medellin', 'dim medellin', 'atletico nacional', 'medellin vs',
  'vs medellin', 'medellin gano', 'medellin perdio', 'medellin empato',
  'aguilas doradas rionegro', 'rionegro aguilas', 'envigado fc', 'envigado futbol',
  'leones de itagui', 'itagui leones',
  // ── Vías y rutas (la carretera menciona 2 ciudades, no es el lugar del hecho)
  'autopista medellin bogota', 'via medellin bogota', 'medellin bogota',
  'autopista medellin costa', 'via al mar', 'tunel de occidente',
  'medellin quibdo', 'medellin uraba', 'conexion pacifico',
  // ── Otros usos no geográficos ─────────────────────────────────────────────
  'rio medellin',                    // El río atraviesa varios municipios
  'feria de las flores',             // Evento, no ubicación específica
  'alcaldia de medellin informo',    // Fuente institucional, no lugar del hecho
  'oriente medio',                   // Región del mundo, no el Oriente antioqueño
  'granada espana', 'zaragoza espana', 'caceres espana', 'toledo espana',
  'armenia quindio', 'barbosa santander', 'rionegro santander',
  'la union valle', 'la union narino', 'betulia santander',
  'concordia magdalena', 'san francisco california', 'valparaiso chile',
  'copacabana brasil', 'copacabana bolivia', 'venecia italia', 'amalfi italia',
  'ciudad bolivar bogota', 'localidad de ciudad bolivar',
  // ── Homónimos que se activan al relajar la ambigüedad (nivel 2) ──────────
  'los andes', 'cordillera de los andes',      // Cordillera ≠ Andes (Suroeste)
  'la estrella de', 'la estrella del',         // "la estrella del pop" ≠ La Estrella
  'el retiro de', 'el retiro del',             // "el retiro del ministro" ≠ El Retiro
  'remedios caseros',                          // Remedios (Nordeste) vs remedios médicos
  'jardin infantil', 'jardin botanico',        // Jardín (Suroeste) vs jardines comunes
  'mas bello', 'bello gesto', 'que bello', 'bello homenaje', // Bello vs adjetivo
  'la union europea', 'la union de',           // La Unión (Oriente) vs frase común
  'san luis potosi',                           // San Luis (Oriente) vs México
  'virgen de guadalupe',                       // Guadalupe (Norte) vs advocación
  'sabanalarga atlantico',                     // Sabanalarga (Occidente) vs Atlántico
  'granada meta', 'argelia cauca', 'argelia valle', // Homónimos del conflicto
  'toledo norte de santander',                 // Toledo (Norte) vs N. de Santander
  'departamento de caldas', 'departamento de narino', // Caldas/Nariño = deptos
];

// ================= SECCIÓN: MUNICIPIOS MUY AMBIGUOS (NIVEL 2) =================
// El gazetteer marca 52 municipios como "ambiguos". Dentro de ellos hay dos niveles:
//   • Ambiguos NORMALES (Briceño, Zaragoza, Amalfi, Bello...): el homónimo es raro
//     en prensa colombiana y las fuentes RSS ya están ancladas a Antioquia →
//     se ACEPTAN sin contexto, pero con puntaje reducido.
//   • MUY AMBIGUOS (esta lista): el homónimo DOMINA la prensa nacional
//     (Armenia = capital del Quindío, Caldas/Nariño = departamentos, Granada =
//     Meta/España, Campamento = "campamento guerrillero"...) → siguen exigiendo
//     contexto antioqueño o patrón local ("municipio de X", "X, Antioquia").
const MUY_AMBIGUOS = new Set([
  'armenia',          // Capital del Quindío (eje cafetero) — dominante en prensa
  'granada',          // Granada (Meta) sale mucho en noticias de conflicto + España
  'toledo',           // Toledo (Norte de Santander) + Toledo (España)
  'narino',           // Departamento de Nariño — dominante
  'caldas',           // Departamento de Caldas — dominante sobre Caldas (Aburrá)
  'argelia',          // Argelia (Cauca) es epicentro del conflicto + el país
  'sabanalarga',      // Sabanalarga (Atlántico) es mucho más mencionado
  'santo domingo',    // Capital de República Dominicana
  'san francisco',    // San Francisco (California) + decenas de homónimos
  'ciudad bolivar',   // Localidad de Bogotá — enorme en prensa nacional
  'campamento',       // "campamento guerrillero/humanitario" = sustantivo común
  'guadalupe',        // Virgen de Guadalupe + homónimos múltiples
  'concordia',        // "la concordia" como concepto + Concordia (Magdalena)
  'concepcion',       // Concepción (Chile) + sustantivo común
  'caicedo',          // Apellido frecuentísimo en Colombia
  'giraldo',          // Apellido frecuentísimo en Colombia
  'maceo',            // Apellido (Antonio Maceo) — riesgo en notas históricas
  'olaya',            // Apellido (Enrique Olaya Herrera, aeropuerto)
  'salgar',           // Apellido + Puerto Salgar (Cundinamarca)
]);

// ================= SECCIÓN: MARCADORES DE CONTEXTO ANTIOQUEÑO =================
// Si el texto contiene alguno de estos términos, se considera que la noticia
// habla de Antioquia; esto habilita aceptar municipios de nombre ambiguo.
const CONTEXTO_ANTIOQUIA = [
  'antioquia', 'antioquen',          // "antioqueño/a" cubierto por el prefijo
  'valle de aburra', 'aburra',
  'uraba', 'bajo cauca', 'nordeste antioqueno', 'magdalena medio',
  'suroeste antioqueno', 'occidente antioqueno', 'oriente antioqueno',
  'gobernacion de antioquia', 'policia antioquia', 'ejercito antioquia',
];

// ================= SECCIÓN: PATRONES LOCALES FUERTES =================
// Plantillas que, aplicadas al slug del municipio, confirman que el nombre se
// usa como LUGAR aunque sea ambiguo: "municipio de Granada", "alcalde de Bello",
// "zona rural de Andes", "Granada, Antioquia"...
// {M} se reemplaza por el slug del municipio.
const PATRONES_LOCALES = [
  'municipio de {M}', 'municipio {M}',
  'alcalde de {M}', 'alcaldia de {M}', 'alcaldesa de {M}',
  'zona rural de {M}', 'area rural de {M}', 'casco urbano de {M}',
  'vereda de {M}', 'corregimiento de {M}',
  '{M}, antioquia', '{M} antioquia',
  'en {M},', 'habitantes de {M}', 'comunidad de {M}',
  'hospital de {M}', 'parque principal de {M}',
];

// ================= SECCIÓN: VERIFICACIONES AUXILIARES =================
// ¿La coincidencia encontrada está dentro de un anti-patrón?
// Recorre los anti-patrones presentes en el texto y comprueba si el índice de
// la coincidencia del municipio queda dentro del rango del anti-patrón.
function coincidenciaEnAntiPatron(textoNorm, indiceMatch, largoMatch) {
  for (const anti of ANTI_PATRONES) {                       // Cada frase prohibida
    let desde = 0;                                          // Cursor de búsqueda
    let idx;                                                // Posición encontrada
    while ((idx = textoNorm.indexOf(anti, desde)) !== -1) { // Todas las ocurrencias
      const fin = idx + anti.length;                        // Fin del anti-patrón
      // Si el match del municipio se solapa con el anti-patrón → invalidado
      if (indiceMatch >= idx && (indiceMatch + largoMatch) <= fin) return true;
      desde = idx + 1;                                      // Seguir buscando
    }
  }
  return false;                                             // Match limpio
}

// ¿El texto contiene contexto antioqueño explícito?
function tieneContextoAntioquia(textoNorm) {
  return CONTEXTO_ANTIOQUIA.some(c => textoNorm.includes(c));
}

// ¿El texto usa un patrón local fuerte para este municipio?
function tienePatronLocal(textoNorm, slug) {
  return PATRONES_LOCALES.some(p => textoNorm.includes(p.replace('{M}', slug)));
}

// Busca todas las ocurrencias de un slug como PALABRA COMPLETA en el texto.
// Devuelve un array de índices. \b no funciona bien con multi-palabra + acentos
// ya eliminados, por eso se valida el carácter anterior y posterior manualmente.
function ocurrencias(textoNorm, slug) {
  const posiciones = [];                                    // Resultado
  let desde = 0;                                            // Cursor
  let idx;                                                  // Posición hallada
  while ((idx = textoNorm.indexOf(slug, desde)) !== -1) {   // Cada aparición
    const antes   = idx === 0 ? ' ' : textoNorm[idx - 1];               // Char previo
    const despues = textoNorm[idx + slug.length] || ' ';                // Char siguiente
    const esLimite = c => !/[a-z0-9]/.test(c);              // No letra/número = límite
    if (esLimite(antes) && esLimite(despues)) posiciones.push(idx);     // Palabra completa
    desde = idx + slug.length;                              // Avanzar cursor
  }
  return posiciones;
}

// ================= SECCIÓN: FUNCIÓN DETECTORA PRINCIPAL =================
// detectarUbicacion(titulo, descripcion?)
// Retorna { subregion, municipio, confianza } donde:
//   confianza 'alta'  → nombre inequívoco en el título
//   confianza 'media' → ambiguo con contexto, o hallado solo en la descripción
//   confianza 'baja'  → default Medellín (no se detectó nada)
// COMPATIBILIDAD: el 2º parámetro es opcional; llamadas antiguas siguen funcionando.
function detectarUbicacion(titulo, descripcion = '') {
  const tituloNorm = normalizarParaMatch(titulo);           // Título normalizado (puntuación → espacio)
  const descNorm   = normalizarParaMatch(descripcion);      // Descripción normalizada
  const textoFull  = tituloNorm + ' \n ' + descNorm;        // Texto combinado (contexto)
  const hayContexto = tieneContextoAntioquia(textoFull);    // ¿Menciona Antioquia?

  let mejor = null;                                         // Mejor candidato acumulado

  // Recorre el gazetteer (largo → corto: los nombres compuestos ganan primero)
  for (const m of GAZETTEER) {
    let puntos = 0;                                         // Puntuación del candidato
    let enTitulo = false;                                   // ¿Apareció en el título?
    const esMuyAmbiguo = MUY_AMBIGUOS.has(m.slug);          // Nivel 2 de ambigüedad
    const hayRespaldo  = hayContexto || tienePatronLocal(textoFull, m.slug); // Contexto o patrón local

    // ── Evaluar ocurrencias en el TÍTULO (peso alto) ────────────────────────
    for (const idx of ocurrencias(tituloNorm, m.slug)) {
      if (coincidenciaEnAntiPatron(tituloNorm, idx, m.slug.length)) continue; // Falso positivo
      if (esMuyAmbiguo && !hayRespaldo) continue;           // Muy ambiguo SIN respaldo → descartado
      // Puntaje escalonado: inequívoco 5 | ambiguo con respaldo 3 | ambiguo sin respaldo 2
      puntos  += !m.ambiguo ? 5 : (hayRespaldo ? 3 : 2);
      enTitulo = true;                                      // Marcar presencia en título
    }

    // ── Evaluar ocurrencias en la DESCRIPCIÓN (peso medio) ──────────────────
    for (const idx of ocurrencias(descNorm, m.slug)) {
      if (coincidenciaEnAntiPatron(descNorm, idx, m.slug.length)) continue;   // Falso positivo
      if (esMuyAmbiguo && !hayRespaldo) continue;           // Muy ambiguo SIN respaldo → descartado
      puntos += m.ambiguo ? 1 : 2;                          // Menor peso que el título
    }

    // ── Bono por patrón local fuerte ("municipio de X") ─────────────────────
    if (puntos > 0 && tienePatronLocal(textoFull, m.slug)) puntos += 2;

    // ── Comparar contra el mejor candidato actual ────────────────────────────
    if (puntos > 0) {
      const candidato = { slug: m.slug, subregion: m.subregion, puntos, enTitulo };
      if (!mejor ||
          candidato.puntos > mejor.puntos ||                              // Más puntos gana
          (candidato.puntos === mejor.puntos && candidato.enTitulo && !mejor.enTitulo)) {
        mejor = candidato;                                  // Nuevo líder
      }
    }
  }

  // ── Resultado con municipio detectado ──────────────────────────────────────
  if (mejor) {
    return {
      subregion: mejor.subregion,                           // Subregión del gazetteer
      municipio: mejor.slug,                                // Slug canónico (compatible con BD)
      confianza: mejor.enTitulo && mejor.puntos >= 5 ? 'alta' : 'media'
    };
  }

  // ── Default acordado: Medellín (comportamiento histórico del sistema) ─────
  return { subregion: 'aburra', municipio: 'medellin', confianza: 'baja' };
}

// ================= SECCIÓN: ESTRUCTURAS DE COMPATIBILIDAD =================
// SUBREGIONES: { subregion: [slugs...] } — mismo formato que la versión anterior.
const SUBREGIONES = {};
GAZETTEER.forEach(m => {                                    // Recorrer gazetteer
  if (!SUBREGIONES[m.subregion]) SUBREGIONES[m.subregion] = []; // Inicializar lista
  SUBREGIONES[m.subregion].push(m.slug);                    // Agregar slug
});

// MUNICIPIO_A_SUBREGION: índice invertido slug → subregión (usado por filtro.js y admin).
const MUNICIPIO_A_SUBREGION = {};
GAZETTEER.forEach(m => { MUNICIPIO_A_SUBREGION[m.slug] = m.subregion; });

// NOMBRES_MUNICIPIO: slug → nombre bonito con tildes (para frontend y GeoJSON).
const NOMBRES_MUNICIPIO = {};
GAZETTEER.forEach(m => { NOMBRES_MUNICIPIO[m.slug] = m.nombre; });

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  GAZETTEER,                 // Lista completa (por si otra parte la necesita)
  SUBREGIONES,               // Compatibilidad con recolector/filtros
  MUNICIPIO_A_SUBREGION,     // Compatibilidad con filtro.js y admin
  NOMBRES_MUNICIPIO,         // Nombres con tildes para mostrar
  detectarUbicacion,         // Detector título + descripción
  normalizar,                // Utilidad compartida de normalización
  normalizarParaMatch        // Normalización con puntuación → espacio
};
