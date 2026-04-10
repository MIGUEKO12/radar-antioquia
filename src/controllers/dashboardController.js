// ================= SECCIÓN: DEPENDENCIAS =================
const NoticiaModel = require('../../models/NoticiaModel');
const { buscarLibre, recolectarAntioquia } = require('../../services/recolector');

// ================= SECCIÓN: HELPER PERÍODO =================
function resolverPeriodo(query) {
  // Las fechas en DB ya están en hora Colombia, usamos fecha local del servidor
  const ahora  = new Date();
  // Restamos 5 horas para obtener hora Colombia
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

  return { desde, hasta };
}
// ================= SECCIÓN: DASHBOARD PRINCIPAL =================
async function getDashboard(req, res) {
  try {
    const { desde, hasta } = resolverPeriodo(req.query);
    const periodo = req.query.periodo || 'hoy';

    const [porCategoria, porSubregion, tendencia, recientes] = await Promise.all([
      NoticiaModel.contarPorCategoria({ desde, hasta, modo:'antioquia' }),
      NoticiaModel.contarPorSubregion({ desde, hasta }),
      NoticiaModel.tendenciaPorDia({ dias: periodo==='mes'?30:periodo==='semana'?7:1, modo:'antioquia' }),
      NoticiaModel.obtenerNoticias({ desde, hasta, modo:'antioquia', limite:2000 }) // Todas para paginar en frontend
    ]);

    const total = porCategoria.reduce((acc,c) => acc+c.total, 0);

    res.json({
      ok:true, periodo, desde, hasta,
      resumen:{ total, porCategoria },
      mapa: porSubregion,
      tendencia,
      recientes
    });
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

    // Construimos mapa normalizado municipio -> total para el frontend
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
      municipios,
      muniNorm,    // Mapa normalizado para el mapa Leaflet
      categorias,
      noticias     // Noticias ya filtradas por subregión
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

    // Buscamos noticias de ese municipio exacto
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

async function recolectarManual(req, res) {
  try {
    const resultado = await recolectarAntioquia();
    res.json({ ok:true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok:false, error:'Error en recolección manual' });
  }
}

// ================= SECCIÓN: EXPORTACIONES =================

// ================= SECCIÓN: NOTICIAS POR CATEGORÍA =================
async function getNoticiasCategoria(req, res) {
  try {
    const categoria        = String(req.query.categoria || '').slice(0, 50);
    const { desde, hasta } = resolverPeriodo(req.query);

    if (!categoria) {
      return res.status(400).json({ ok: false, error: 'Parámetro categoria requerido' });
    }

    // Sin límite — traemos TODAS las noticias de esa categoría
    const noticias = NoticiaModel.obtenerNoticias({
      desde, hasta, limite: 2000
    }).filter(n => n.categoria === categoria);

    res.json({ ok: true, categoria, total: noticias.length, noticias });

  } catch (err) {
    console.error('[NoticiasCategoria]', err);
    res.status(500).json({ ok: false, error: 'Error al cargar categoría' });
  }
}

// ================= SECCIÓN: TENDENCIA POR CATEGORÍA =================
async function getTendenciaCategoria(req, res) {
  try {
    const dias = Math.min(parseInt(req.query.dias) || 7, 365);

    const categoria = String(req.query.categoria || 'todas').slice(0, 50);

    const tendencia = NoticiaModel.tendenciaPorDia({ dias, modo: 'antioquia' });

    // Si piden una categoría específica, filtramos por ella en la DB
    if (categoria !== 'todas') {
      const diasData = [];
      for (let i = dias - 1; i >= 0; i--) {
        const co    = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
        const fecha = new Date(co);
        fecha.setDate(fecha.getDate() - i);
        const diaStr = fecha.toISOString().split('T')[0];

        const desde = diaStr;
        const hasta = diaStr;
        const cats  = NoticiaModel.contarPorCategoria({ desde, hasta, modo: 'antioquia' });

        // orden_publico incluye desplazamiento
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

module.exports = { getDashboard, getSubregion, getMunicipio, getNoticiasCategoria, getTendenciaCategoria, buscarNoticias, recolectarManual };
