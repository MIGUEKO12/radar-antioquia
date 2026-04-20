// ================= SECCIÓN: DEPENDENCIAS =================
const NoticiaModel = require('../../models/NoticiaModel');
const { buscarLibre, recolectarAntioquia } = require('../../services/recolector');

// ================= SECCIÓN: CACHE EN MEMORIA =================
// Guarda el resultado del dashboard por periodo para evitar consultas repetidas a la DB
// Se invalida automáticamente después de 5 minutos o cuando llegan noticias nuevas
const _cache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function obtenerCache(clave) {
  const entrada = _cache[clave];
  if (!entrada) return null;
  if (Date.now() - entrada.timestamp > CACHE_TTL_MS) {
    delete _cache[clave]; // Expiró — eliminar
    return null;
  }
  return entrada.datos;
}

function guardarCache(clave, datos) {
  _cache[clave] = { datos, timestamp: Date.now() };
}

// Invalida todo el cache — se llama desde app.js después de cada recolección
function invalidarCache() {
  Object.keys(_cache).forEach(k => delete _cache[k]);
  console.log('[CACHE] Invalidado por nueva recolección');
}

module.exports.invalidarCache = invalidarCache;

// ================= SECCIÓN: HELPER PERÍODO =================
function resolverPeriodo(query) {
  // Ajustar a hora Colombia (UTC-5) para que "hoy" coincida con la fecha local
  const ahora  = new Date();
  const co     = new Date(ahora.getTime() - (5 * 60 * 60 * 1000));
  const hoyStr = co.toISOString().split('T')[0];

  const hasta = query.hasta || hoyStr;
  let desde   = query.desde;

  if (!desde) {
    switch (query.periodo) {
      case 'semana': {
        const s = new Date(co);
        s.setDate(s.getDate() - 7);
        desde = s.toISOString().split('T')[0];
        break;
      }
      case 'mes': {
        const m = new Date(co);
        m.setDate(m.getDate() - 30);
        desde = m.toISOString().split('T')[0];
        break;
      }
      default:
        desde = hoyStr;
    }
  }

  if (desde > hasta) desde = hasta;

  console.log(`[Período] periodo="${query.periodo}" desde="${desde}" hasta="${hasta}"`);
  return { desde, hasta };
}

// ================= SECCIÓN: DASHBOARD PRINCIPAL =================
async function getDashboard(req, res) {
  try {
    const { desde, hasta } = resolverPeriodo(req.query);
    const periodo = req.query.periodo || 'hoy';

    // Clave única por combinación de fechas y periodo
    const clave = `dashboard_${periodo}_${desde}_${hasta}`;

    // Intentar servir desde cache
    const cacheado = obtenerCache(clave);
    if (cacheado) {
      console.log(`[CACHE] Hit: ${clave}`);
      return res.json(cacheado);
    }

    // No está en cache — consultar DB
    const [porCategoria, porSubregion, tendencia, recientes] = await Promise.all([
      NoticiaModel.contarPorCategoria({ desde, hasta, modo:'antioquia' }),
      NoticiaModel.contarPorSubregion({ desde, hasta }),
      NoticiaModel.tendenciaPorDia({ dias: periodo==='mes'?30:periodo==='semana'?7:1, modo:'antioquia' }),
      NoticiaModel.obtenerNoticias({ desde, hasta, modo:'antioquia', limite:2000 })
    ]);

    const total = porCategoria.reduce((acc,c) => acc+c.total, 0);

    const respuesta = {
      ok:true, periodo, desde, hasta,
      resumen:{ total, porCategoria },
      mapa: porSubregion,
      tendencia,
      recientes
    };

    // Guardar en cache para próximas consultas
    guardarCache(clave, respuesta);
    console.log(`[CACHE] Guardado: ${clave}`);

    res.json(respuesta);
  } catch (err) {
    console.error('[Dashboard]', err);
    res.status(500).json({ ok:false, error:'Error al cargar el dashboard' });
  }
}

// ================= SECCIÓN: DRILL-DOWN SUBREGIÓN =================
async function getSubregion(req, res) {
  try {
    const { id }           = req.params;
    const { desde, hasta } = resolverPeriodo(req.query);

    const noticias   = NoticiaModel.obtenerNoticias({ desde, hasta, subregion:id, modo:'antioquia', limite:200 });
    const municipios = NoticiaModel.contarPorMunicipio({ subregion:id, desde, hasta });
    const categorias = NoticiaModel.contarPorCategoria({ desde, hasta, modo:'antioquia' });

    const muniNorm = {};
    municipios.forEach(m => {
      if (m.municipio) {
        const key = m.municipio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        muniNorm[key] = m.total;
      }
    });

    res.json({
      ok:true, subregion:id,
      nombre: id.charAt(0).toUpperCase() + id.slice(1),
      total: noticias.length,
      municipios, muniNorm, categorias, noticias
    });
  } catch (err) {
    console.error('[Subregion]', err);
    res.status(500).json({ ok:false, error:'Error al cargar subregión' });
  }
}

// ================= SECCIÓN: DRILL-DOWN MUNICIPIO =================
async function getMunicipio(req, res) {
  try {
    const municipio        = String(req.query.municipio || '').slice(0,100);
    const { desde, hasta } = resolverPeriodo(req.query);

    if (!municipio) {
      return res.status(400).json({ ok:false, error:'Parámetro municipio requerido' });
    }

    const noticias = NoticiaModel.obtenerNoticias({
      desde, hasta, municipio: municipio.toLowerCase(), modo:'antioquia', limite:100
    });

    res.json({ ok:true, municipio, total:noticias.length, noticias });
  } catch (err) {
    console.error('[Municipio]', err);
    res.status(500).json({ ok:false, error:'Error al cargar municipio' });
  }
}

// ================= SECCIÓN: BÚSQUEDA =================
async function buscarNoticias(req, res) {
  try {
    const q     = String(req.query.q     || 'Antioquia').slice(0,100);
    const desde = String(req.query.desde || '').slice(0,10);
    const hasta = String(req.query.hasta || '').slice(0,10);

    if (!q.trim()) return res.status(400).json({ ok:false, error:'El parámetro q es requerido' });

    const noticias = await buscarLibre(q, desde||null, hasta||null);
    res.json({ ok:true, query:q, total:noticias.length, noticias });
  } catch (err) {
    console.error('[Buscar]', err);
    res.status(500).json({ ok:false, error:'Error al buscar noticias' });
  }
}

// ================= SECCIÓN: RECOLECCIÓN MANUAL =================
async function recolectarManual(req, res) {
  try {
    const resultado = await recolectarAntioquia();
    res.json({ ok:true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok:false, error:'Error en recolección manual' });
  }
}

// ================= SECCIÓN: NOTICIAS POR CATEGORÍA =================
async function getNoticiasCategoria(req, res) {
  try {
    const categoria        = String(req.query.categoria || '').slice(0, 50);
    const { desde, hasta } = resolverPeriodo(req.query);

    if (!categoria) {
      return res.status(400).json({ ok: false, error: 'Parámetro categoria requerido' });
    }

    // categoria='todas' devuelve todas sin filtrar — usado por modal de tendencia
    const todasNoticias = NoticiaModel.obtenerNoticias({ desde, hasta, modo:'antioquia', limite: 2000 });
    const noticias = categoria === 'todas'
      ? todasNoticias
      : todasNoticias.filter(n => n.categoria === categoria);

    res.json({ ok: true, categoria, total: noticias.length, noticias });
  } catch (err) {
    console.error('[NoticiasCategoria]', err);
    res.status(500).json({ ok: false, error: 'Error al cargar categoría' });
  }
}

// ================= SECCIÓN: TENDENCIA POR CATEGORÍA =================
async function getTendenciaCategoria(req, res) {
  try {
    const dias      = Math.min(parseInt(req.query.dias) || 7, 365);
    const categoria = String(req.query.categoria || 'todas').slice(0, 50);
    const tendencia = NoticiaModel.tendenciaPorDia({ dias, modo: 'antioquia' });

    if (categoria !== 'todas') {
      const diasData = [];
      for (let i = dias - 1; i >= 0; i--) {
        const fecha = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
        fecha.setDate(fecha.getDate() - i);
        const diaStr = fecha.toISOString().split('T')[0];
        const cats   = NoticiaModel.contarPorCategoria({ desde: diaStr, hasta: diaStr, modo: 'antioquia' });

        let total = 0;
        if (categoria === 'orden_publico') {
          const op = cats.find(c => c.categoria === 'orden_publico');
          const dp = cats.find(c => c.categoria === 'desplazamiento');
          total = (op?.total || 0) + (dp?.total || 0);
        } else {
          total = cats.find(c => c.categoria === categoria)?.total || 0;
        }
        diasData.push({ dia: diaStr, total });
      }
      return res.json({ ok: true, dias, categoria, tendencia: diasData });
    }

    res.json({ ok: true, dias, categoria: 'todas', tendencia });
  } catch (err) {
    console.error('[TendenciaCategoria]', err);
    res.status(500).json({ ok: false, error: 'Error al cargar tendencia' });
  }
}

// ================= SECCIÓN: LOGS DE SALUD =================
async function getLogs(req, res) {
  try {
    const { db } = require('../../config/database');
    const limite = Math.min(parseInt(req.query.limite) || 50, 200);

    const logs = db.all(
      `SELECT * FROM logs_recoleccion ORDER BY fecha DESC LIMIT ?`,
      [limite]
    );

    // Resumen general
    const resumen = db.get(
      `SELECT
        COUNT(*)                          as total_ejecuciones,
        SUM(insertadas)                   as total_insertadas,
        SUM(duplicadas)                   as total_duplicadas,
        SUM(errores)                      as total_errores,
        ROUND(AVG(duracion_ms))           as promedio_ms,
        MIN(fecha)                        as primera_ejecucion,
        MAX(fecha)                        as ultima_ejecucion
       FROM logs_recoleccion`
    );

    res.json({ ok: true, resumen, logs });
  } catch (err) {
    console.error('[Logs]', err);
    res.status(500).json({ ok: false, error: 'Error al cargar logs' });
  }
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  getDashboard,
  getSubregion,
  getMunicipio,
  getNoticiasCategoria,
  getTendenciaCategoria,
  buscarNoticias,
  recolectarManual,
  getLogs
};