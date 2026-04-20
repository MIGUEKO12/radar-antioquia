// ================= SECCIÓN: DEPENDENCIAS =================
const NoticiaModel = require('../../models/NoticiaModel');
const { buscarLibre, recolectarAntioquia } = require('../../services/recolector');



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

    const [porCategoria, porSubregion, tendencia, recientes] = await Promise.all([
      NoticiaModel.contarPorCategoria({ desde, hasta, modo:'antioquia' }),
      NoticiaModel.contarPorSubregion({ desde, hasta }),
      NoticiaModel.tendenciaPorDia({ dias: periodo==='mes'?30:periodo==='semana'?7:1, modo:'antioquia' }),
      NoticiaModel.obtenerNoticias({ desde, hasta, modo:'antioquia', limite:2000 })
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

// ================= SECCIÓN: RECLASIFICACIÓN MASIVA =================
async function reclasificarDB(req, res) {
  try {
    const { reclasificarTodo } = require('../../models/NoticiaModel');
    const resultado = reclasificarTodo();
    res.json({ ok: true, ...resultado });
  } catch (err) {
    console.error('[Reclasificar]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ================= SECCIÓN: ADMIN — LOGIN =================
async function adminLogin(req, res) {
  try {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) return res.status(500).json({ ok:false, error:'Admin no configurado' });
    if (password !== adminPass) return res.status(401).json({ ok:false, error:'Contraseña incorrecta' });
    // Token simple basado en la contraseña — no necesitamos JWT para esto
    const token = Buffer.from(adminPass + Date.now()).toString('base64');
    // Guardar token en memoria con expiración de 4 horas
    global._adminTokens = global._adminTokens || {};
    global._adminTokens[token] = Date.now() + (4 * 60 * 60 * 1000);
    res.json({ ok:true, token });
  } catch(err) {
    res.status(500).json({ ok:false, error:err.message });
  }
}

// ================= SECCIÓN: ADMIN — MIDDLEWARE VERIFICACIÓN =================
function verificarAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ ok:false, error:'Token requerido' });
  global._adminTokens = global._adminTokens || {};
  const expira = global._adminTokens[token];
  if (!expira || Date.now() > expira) return res.status(401).json({ ok:false, error:'Token expirado' });
  next();
}

// ================= SECCIÓN: ADMIN — CAMBIAR CATEGORÍA =================
async function adminCambiarCategoria(req, res) {
  try {
    const { id, hash, categoria, municipio } = req.body;
    const categoriasValidas = ['orden_publico','homicidio','feminicidio','mineria','violencia_politica','general'];
    if (!id || !categoriasValidas.includes(categoria)) {
      return res.status(400).json({ ok:false, error:'Parámetros inválidos' });
    }
    const { db } = require('../../config/database');
    const { MUNICIPIO_A_SUBREGION } = require('../../config/municipios');

    // Detectar subregion del municipio seleccionado
    const subregion = municipio ? (MUNICIPIO_A_SUBREGION[municipio.toLowerCase()] || 'general') : null;

    // Actualizar en la tabla principal
    if (municipio && subregion) {
      db.run('UPDATE noticias SET categoria = ?, municipio = ?, subregion = ? WHERE id = ?', [categoria, municipio, subregion, id]);
    } else {
      db.run('UPDATE noticias SET categoria = ? WHERE id = ?', [categoria, id]);
    }

    // Guardar en tabla fijas para que el cron lo respete siempre
    if (hash) {
      db.run(
        `INSERT OR REPLACE INTO noticias_fijas (hash, categoria, municipio, subregion) VALUES (?, ?, ?, ?)`,
        [hash, categoria, municipio || null, subregion || null]
      );
    }

    console.log(`[Admin] Noticia ${id} → ${categoria} ${municipio ? '/ '+municipio : ''} (bloqueado)`);
    res.json({ ok:true, id, categoria, municipio, subregion });
  } catch(err) {
    res.status(500).json({ ok:false, error:err.message });
  }
}

// ================= SECCIÓN: ADMIN — ELIMINAR NOTICIA =================
async function adminEliminarNoticia(req, res) {
  try {
    const { id, hash, titulo } = req.body;
    if (!id) return res.status(400).json({ ok:false, error:'ID requerido' });
    const { db } = require('../../config/database');

    // Eliminar de la tabla principal
    db.run('DELETE FROM noticias WHERE id = ?', [id]);

    // Bloquear el hash permanentemente para que el cron no la vuelva a insertar
    if (hash) {
      db.run(
        `INSERT OR IGNORE INTO noticias_ignoradas (hash, titulo, motivo) VALUES (?, ?, 'admin')`,
        [hash, titulo || '']
      );
    }

    console.log(`[Admin] Noticia ${id} eliminada y hash bloqueado`);
    res.json({ ok:true, id });
  } catch(err) {
    res.status(500).json({ ok:false, error:err.message });
  }
}

// ================= SECCIÓN: ADMIN — VER CAMBIOS =================
async function adminVerCambios(req, res) {
  try {
    const { db } = require('../../config/database');

    const ignoradas = db.all(
      `SELECT hash, titulo, motivo, fecha FROM noticias_ignoradas ORDER BY fecha DESC`,
      []
    );

    const fijas = db.all(
      `SELECT f.hash, f.categoria, f.municipio, f.subregion, f.fecha,
              n.titulo
       FROM noticias_fijas f
       LEFT JOIN noticias n ON n.hash = f.hash
       ORDER BY f.fecha DESC`,
      []
    );

    res.json({
      ok: true,
      ignoradas: { total: ignoradas.length, items: ignoradas },
      fijas:     { total: fijas.length,     items: fijas     }
    });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message });
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
  getLogs,
  reclasificarDB,
  adminLogin,
  verificarAdminToken,
  adminCambiarCategoria,
  adminEliminarNoticia,
  adminVerCambios
};