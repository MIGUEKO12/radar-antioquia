// ================= SECCIÓN: DEPENDENCIAS =================
const fetch                 = require('node-fetch');
const xml2js                = require('xml2js');
const { detectarUbicacion } = require('../config/municipios');
const { clasificarNoticia } = require('./clasificador');
const { insertarNoticia }   = require('../models/NoticiaModel');

// ================= SECCIÓN: CONFIGURACIÓN RSS =================
const RSS_BASE = 'https://news.google.com/rss/search';

// ================= SECCIÓN: PALABRAS CLAVE ANTIOQUIA =================
// Lista de términos que deben aparecer en el título para considerar
// que la noticia es relevante para Antioquia
const TERMINOS_ANTIOQUIA = [
  'antioquia', 'medellín', 'medellin', 'urabá', 'uraba',
  'bajo cauca', 'nordeste', 'suroeste', 'occidente antioqueño',
  'valle de aburrá', 'aburra', 'magdalena medio',
  // Municipios más mencionados en noticias
  'turbo', 'apartadó', 'apartado', 'caucasia', 'ituango', 'briceño', 'briceno',
  'segovia', 'remedios', 'el bagre', 'tarazá', 'taraza', 'zaragoza', 'cáceres', 'caceres',
  'puerto berrío', 'puerto berrio', 'yondó', 'yondo', 'nechí', 'nechi',
  'rionegro', 'marinilla', 'el carmen de viboral', 'guarne', 'la ceja',
  'bello', 'itagüí', 'itagui', 'envigado', 'sabaneta', 'barbosa', 'copacabana',
  'ciudad bolívar', 'ciudad bolivar', 'andes', 'jardín', 'jardin', 'jericó', 'jerico',
  'dabeiba', 'frontino', 'santa fe de antioquia', 'cañasgordas',
  'yarumal', 'valdivia', 'campamento',
  'san carlos', 'granada', 'san luis', 'cocorná', 'cocorna',
  'amalfi', 'cisneros', 'yolombó', 'yolombo',
  // Grupos armados presentes en Antioquia
  'eln', 'clan del golfo', 'agc', 'egc', 'frente 36', 'frente 18',
  'gdco', 'pachelly', 'la sierra', 'robledo',
  // Gobernación
  'gobernación de antioquia', 'gobernacion de antioquia'
];

// ================= SECCIÓN: FILTRO DE RELEVANCIA =================
// Verifica que una noticia realmente sea de Antioquia
function esRelevanteParaAntioquia(titulo) {
  const tNorm = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return TERMINOS_ANTIOQUIA.some(t => {
    const tRef = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return tNorm.includes(tRef);
  });
}

// ================= SECCIÓN: QUERIES MEJORADAS CON GOOGLE ALERTS =================
const QUERIES_ANTIOQUIA = [

  // ── ORDEN PÚBLICO (basado en alertas Google) ──────────────────────────────
  '"Antioquia" amenaza OR asonada OR combate OR enfrentamiento OR secuestro',
  '"Antioquia" desplazamiento OR masacre OR artefacto explosivo OR bomba OR panfleto',
  '"Antioquia" líder social OR captura OR neutralizado OR abatido OR fuerza pública',
  '"Antioquia" ELN OR FARC OR disidencias OR "Clan del Golfo" OR AGC OR EGC',
  '"Antioquia" "Frente 36" OR "Frente 18" OR cabecilla OR grupo armado',

  // ── GRUPOS DELINCUENCIALES MEDELLÍN ───────────────────────────────────────
  '"Antioquia" GDCO OR GDO OR Pachelly OR "La Sierra" OR "La Terraza"',
  '"Antioquia" "Los Chatas" OR Trianón OR "Carne Rancia" OR "El Salacho"',
  '"Antioquia" Robledo OR "San Pablo" OR "La Miel" OR "Los del 20"',

  // ── MUNICIPIOS CRÍTICOS ───────────────────────────────────────────────────
  '"Antioquia" seguridad Andes OR "Ciudad Bolívar" OR Remedios OR Amalfi',
  '"Antioquia" seguridad Marinilla OR "Carmen de Viboral" OR Briceño OR Yondó OR Segovia',
  'Ituango Antioquia', 'Tarazá Antioquia', 'Caucasia Antioquia',
  'El Bagre Antioquia', 'Zaragoza Antioquia', 'Cáceres Antioquia',
  'Turbo Antioquia', 'Apartadó Antioquia', 'Dabeiba Antioquia',
  'Valdivia Antioquia', 'Yarumal Antioquia', 'Frontino Antioquia',

  // ── SUBREGIONES ───────────────────────────────────────────────────────────
  'Urabá Antioquia', 'Bajo Cauca Antioquia', 'Nordeste Antioquia',
  'Oriente Antioquia', 'Suroeste Antioquia', 'Occidente Antioquia',
  'Norte Antioquia', 'Magdalena Medio Antioquia', 'Valle de Aburrá',

  // ── GENERAL ───────────────────────────────────────────────────────────────
  'Antioquia Colombia', 'Gobernación Antioquia', 'Medellín Colombia',

  // ── HOMICIDIO ─────────────────────────────────────────────────────────────
  'homicidio Antioquia', 'asesinato Antioquia', 'feminicidio Antioquia',
  'baleado Antioquia', 'sicario Antioquia',

  // ── MINERÍA ───────────────────────────────────────────────────────────────
  'minería ilegal Antioquia', 'minería Antioquia', 'dragas Antioquia',
  'retroexcavadora Antioquia',

  // ── CLIMA Y DESASTRES ─────────────────────────────────────────────────────
  'inundación Antioquia', 'deslizamiento Antioquia',
  'emergencia Antioquia', 'avalancha Antioquia', 'lluvia Antioquia',

  // ── VIOLENCIA POLÍTICA ────────────────────────────────────────────────────
  'violencia política Colombia', 'candidato amenazado Colombia',
  'atentado candidato Colombia', 'líder político amenazado Colombia',

  // ── SOCIAL ────────────────────────────────────────────────────────────────
  'salud Antioquia', 'educación Antioquia', 'infraestructura Antioquia'
];

// ================= SECCIÓN: FUNCIÓN DE FETCH RSS =================
async function fetchNoticias(query, modo = 'antioquia') {
  const url = `${RSS_BASE}?q=${encodeURIComponent(query)}&hl=es-419&gl=CO&ceid=CO:es-419`;

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 10000);

  let xml;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} al consultar RSS`);
    xml = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  const parser = new xml2js.Parser({ explicitArray: true });
  const data   = await parser.parseStringPromise(xml);

  if (!data?.rss?.channel?.[0]?.item) return [];

  const items = data.rss.channel[0].item;

  return items.map(item => {
    const titulo = item.title?.[0] || '';
    const link   = item.link?.[0]  || '';

    const fechaUTC = item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date();
    const fechaCO  = new Date(fechaUTC.getTime() - (5 * 60 * 60 * 1000));
    const fecha    = fechaCO.toISOString().replace('Z', '');

    const { subregion, municipio } = detectarUbicacion(titulo);
    const categoria = clasificarNoticia(titulo);

    return { titulo, link, fecha, subregion, municipio, categoria, modo, query };
  });
}

// ================= SECCIÓN: RECOLECCIÓN AUTOMÁTICA =================
async function recolectarAntioquia() {
  let insertadas = 0;
  let duplicadas = 0;
  let errores    = 0;
  let filtradas  = 0; // Noticias descartadas por no ser de Antioquia

  console.log(`[CRON] Iniciando recolección — ${new Date().toLocaleString('es-CO')}`);

  for (const query of QUERIES_ANTIOQUIA) {
    try {
      const noticias = await fetchNoticias(query, 'antioquia');

      for (const noticia of noticias) {
        // Filtro de relevancia — solo guardamos noticias de Antioquia
        if (!esRelevanteParaAntioquia(noticia.titulo)) {
          filtradas++;
          continue;
        }
        const esNueva = insertarNoticia(noticia);
        if (esNueva) insertadas++;
        else         duplicadas++;
      }

      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      errores++;
      console.error(`[CRON] Error en query "${query}":`, err.message);
    }
  }

  const resumen = { insertadas, duplicadas, filtradas, errores, timestamp: new Date().toISOString() };
  console.log(`[CRON] Ciclo completo:`, resumen);

  return resumen;
}

// ================= SECCIÓN: BÚSQUEDA LIBRE =================
async function buscarLibre(query, desde, hasta) {
  const noticias = await fetchNoticias(query, 'libre');

  let resultado = noticias;

  if (desde || hasta) {
    const fDesde = desde ? new Date(desde + 'T00:00:00') : new Date('2000-01-01');
    const fHasta = hasta ? new Date(hasta + 'T23:59:59') : new Date();
    resultado = noticias.filter(n => {
      const f = new Date(n.fecha);
      return f >= fDesde && f <= fHasta;
    });
  }

  resultado.forEach(n => insertarNoticia({ ...n, modo: 'libre', query }));
  return resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// ================= SECCIÓN: RECOLECCIÓN HISTÓRICA =================
async function recolectarHistorico() {
  const anio    = new Date().getFullYear();
  const inicio  = new Date(`${anio}-01-01`);
  const hoy     = new Date();
  let insertadas = 0;

  console.log(`[HISTÓRICO] Iniciando recolección desde ${anio}-01-01...`);

  const semanas = [];
  let cursor = new Date(inicio);
  while (cursor <= hoy) {
    const desde = cursor.toISOString().split('T')[0];
    cursor.setDate(cursor.getDate() + 7);
    const hasta = cursor > hoy
      ? hoy.toISOString().split('T')[0]
      : cursor.toISOString().split('T')[0];
    semanas.push({ desde, hasta });
  }

  const queriesHistorico = [
    'Antioquia Colombia',
    'orden público Antioquia',
    'homicidio Antioquia',
    'feminicidio Antioquia',
    'minería Antioquia',
    'desplazamiento Antioquia',
    'ELN Antioquia',
    '"Clan del Golfo" Antioquia',
    'masacre Antioquia',
    'inundación Antioquia',
    'emergencia Antioquia',
    'Medellín Colombia',
    'Urabá Antioquia',
    'Bajo Cauca Antioquia'
  ];

  for (const { desde, hasta } of semanas) {
    for (const query of queriesHistorico) {
      try {
        const queryConFecha = `${query} after:${desde} before:${hasta}`;
        const noticias = await fetchNoticias(queryConFecha, 'antioquia');
        for (const n of noticias) {
          if (esRelevanteParaAntioquia(n.titulo) && insertarNoticia(n)) insertadas++;
        }
        await new Promise(r => setTimeout(r, 800));
      } catch (err) {
        console.error(`[HISTÓRICO] Error ${query} ${desde}:`, err.message);
      }
    }
    console.log(`[HISTÓRICO] Semana ${desde} → ${hasta} completada`);
  }

  console.log(`[HISTÓRICO] Completado — ${insertadas} noticias nuevas insertadas`);
  return insertadas;
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  fetchNoticias,
  recolectarAntioquia,
  recolectarHistorico,
  buscarLibre
};