// ================= SECCIÓN: DEPENDENCIAS =================
const fetch               = require('node-fetch');           // HTTP client para el RSS
const xml2js              = require('xml2js');               // Parser XML -> JSON
const { detectarUbicacion } = require('../config/municipios'); // Detector territorial
const { clasificarNoticia } = require('./clasificador');      // Clasificador de categorías
const { insertarNoticia }   = require('../models/NoticiaModel'); // Modelo de DB

// ================= SECCIÓN: CONFIGURACIÓN RSS =================
// URL base de Google News RSS — parámetros de idioma y región Colombia
const RSS_BASE = 'https://news.google.com/rss/search';

// Búsquedas automáticas que se ejecutan en cada ciclo del cron para Antioquia
// Cubren los temas más relevantes para la Gobernación
const QUERIES_ANTIOQUIA = [
  'Antioquia',
  'Medellín',
  'Urabá Antioquia',
  'Bajo Cauca Antioquia',
  'Nordeste Antioquia',
  'orden público Antioquia',
  'minería Antioquia',
  'desplazamiento Antioquia',
  'ELN Antioquia',
  'inundación Antioquia'
];

// ================= SECCIÓN: FUNCIÓN DE FETCH RSS =================
/**
 * Descarga y parsea el RSS de Google News para un término de búsqueda.
 * @param {string} query - Término de búsqueda
 * @param {string} modo  - 'antioquia' o 'libre'
 * @returns {Array} Array de objetos noticia normalizados
 */
async function fetchNoticias(query, modo = 'antioquia') {
  // Construimos la URL con parámetros de localización Colombia
  const url = `${RSS_BASE}?q=${encodeURIComponent(query)}&hl=es-419&gl=CO&ceid=CO:es-419`;

  // Fetch con timeout de 10 segundos para no bloquear el servidor
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 10000); // 10s timeout

  let xml;
  try {
    const response = await fetch(url, { signal: controller.signal });

    // Verificamos que la respuesta sea exitosa antes de continuar
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al consultar RSS`);
    }

    xml = await response.text(); // Obtenemos el XML como string
  } finally {
    clearTimeout(timeout); // Siempre limpiamos el timeout
  }

  // ================= Parseo XML -> JSON =================
  const parser = new xml2js.Parser({ explicitArray: true }); // Arrays explícitos
  const data   = await parser.parseStringPromise(xml);

  // Validamos que el RSS tenga la estructura esperada
  if (!data?.rss?.channel?.[0]?.item) {
    return []; // RSS vacío o sin resultados
  }

  // ================= Normalización de cada ítem =================
  const items = data.rss.channel[0].item;

  return items.map(item => {
    const titulo = item.title?.[0] || '';          // Título de la noticia
    const link   = item.link?.[0]  || '';          // URL original
    const fecha  = item.pubDate?.[0]               // Fecha de publicación
      ? new Date(item.pubDate[0]).toISOString()    // Convertimos a ISO 8601
      : new Date().toISOString();                  // Fallback: ahora

    // Detectamos ubicación geográfica en el título
    const { subregion, municipio } = detectarUbicacion(titulo);

    // Clasificamos la noticia por categoría temática
    const categoria = clasificarNoticia(titulo);

    return {
      titulo,
      link,
      fecha,
      subregion,    // Ej: 'bajocauca'
      municipio,    // Ej: 'caucasia' o null
      categoria,    // Ej: 'homicidio'
      modo,         // 'antioquia' o 'libre'
      query         // Término original de búsqueda
    };
  });
}

// ================= SECCIÓN: RECOLECCIÓN AUTOMÁTICA =================
/**
 * Ejecuta el ciclo completo de recolección para todas las queries de Antioquia.
 * Esta función es llamada por el cron job cada N minutos.
 * @returns {Object} Estadísticas del ciclo: insertadas, duplicadas, errores
 */
async function recolectarAntioquia() {
  let insertadas = 0; // Noticias nuevas guardadas
  let duplicadas = 0; // Noticias ya existentes (ignoradas)
  let errores    = 0; // Queries que fallaron

  console.log(`[CRON] Iniciando recolección — ${new Date().toLocaleString('es-CO')}`);

  // Procesamos cada query de forma secuencial para no saturar a Google
  for (const query of QUERIES_ANTIOQUIA) {
    try {
      const noticias = await fetchNoticias(query, 'antioquia');

      for (const noticia of noticias) {
        const esNueva = insertarNoticia(noticia); // true=nueva, false=duplicada
        if (esNueva) insertadas++;
        else         duplicadas++;
      }

      // Pausa de 1 segundo entre queries para no ser bloqueados por Google
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      errores++;
      console.error(`[CRON] Error en query "${query}":`, err.message);
    }
  }

  const resumen = { insertadas, duplicadas, errores, timestamp: new Date().toISOString() };
  console.log(`[CRON] Ciclo completo:`, resumen);

  return resumen;
}

// ================= SECCIÓN: BÚSQUEDA LIBRE =================
/**
 * Ejecuta una búsqueda libre por query del usuario (modo 'libre').
 * No guarda en DB automáticamente — retorna los resultados directamente.
 * @param {string} query - Término ingresado por el usuario
 * @param {string} desde - Fecha inicio formato YYYY-MM-DD (opcional)
 * @param {string} hasta - Fecha fin formato YYYY-MM-DD (opcional)
 * @returns {Array} Noticias normalizadas y clasificadas
 */
async function buscarLibre(query, desde, hasta) {
  const noticias = await fetchNoticias(query, 'libre');

  // Aplicamos filtro de fechas si se proporcionaron
  let resultado = noticias;

  if (desde || hasta) {
    const fDesde = desde ? new Date(desde + 'T00:00:00') : new Date('2000-01-01');
    const fHasta = hasta ? new Date(hasta + 'T23:59:59') : new Date();

    resultado = noticias.filter(n => {
      const f = new Date(n.fecha);
      return f >= fDesde && f <= fHasta; // Incluimos si está en el rango
    });
  }

  // Guardamos también en DB para histórico (modo 'libre')
  resultado.forEach(n => insertarNoticia({ ...n, modo: 'libre', query }));

  // Ordenamos más reciente primero antes de retornar
  return resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  fetchNoticias,
  recolectarAntioquia,
  buscarLibre
};
