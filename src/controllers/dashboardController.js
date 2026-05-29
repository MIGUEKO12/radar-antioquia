 // ================= SECCIÓN: DEPENDENCIAS =================
const NoticiaModel = require('../../models/NoticiaModel');
const { buscarLibre, recolectarAntioquia } = require('../../services/recolector');

// ================= SECCIÓN: HELPER PERÍODO =================
function resolverPeriodo(query) {
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
// Busca en la DB directamente con palabras individuales y rango de fechas
// Permite buscar en TODO el histórico disponible sin límite de 90 días
async function buscarNoticias(req, res) {
  try {
    const q         = String(req.query.q         || '').slice(0, 200);
    const desde     = String(req.query.desde     || '').slice(0, 10);
    const hasta     = String(req.query.hasta     || '').slice(0, 10);
    const subregion = String(req.query.subregion || '').slice(0, 50);
    const municipio = String(req.query.municipio || '').slice(0, 100);
    const modo      = String(req.query.modo      || '').slice(0, 20);

    if (!q.trim()) return res.status(400).json({ ok:false, error:'El parámetro q es requerido' });

    const { db } = require('../../config/database');

    // Normalizar query — quitar tildes y pasar a minúsculas
    const normalizar = s => s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Dividir en palabras individuales — ignorar palabras de 1 letra
    const palabras = normalizar(q).split(/\s+/).filter(p => p.length > 1);

    if (!palabras.length) {
      return res.status(400).json({ ok:false, error:'Ingresa al menos una palabra' });
    }

    // Construir query SQLite con filtros combinados
    let sql    = `SELECT * FROM noticias WHERE 1=1`;
    const args = [];

    // Filtro de modo — antioquia o libre
    if (modo === 'antioquia') { sql += ` AND modo = ?`; args.push('antioquia'); }

    // Filtro de fechas — acepta cualquier rango histórico
    if (desde)    { sql += ` AND DATE(fecha) >= ?`;       args.push(desde); }
    if (hasta)    { sql += ` AND DATE(fecha) <= ?`;       args.push(hasta); }

    // Filtro de subregión
    if (subregion) { sql += ` AND lower(subregion) = ?`; args.push(subregion.toLowerCase()); }

    // Filtro de municipio
    if (municipio) { sql += ` AND lower(municipio) = ?`; args.push(municipio.toLowerCase()); }

    // Cada palabra debe aparecer en título, municipio, subregión o query
    // Así "tusi medellín" encuentra noticias donde "tusi" está en titulo
    // y "medellín" está en municipio — no necesitan estar en el mismo campo
    for (const palabra of palabras) {
      sql += ` AND (
        lower(titulo)    LIKE ? OR
        lower(municipio) LIKE ? OR
        lower(subregion) LIKE ? OR
        lower(query)     LIKE ?
      )`;
      args.push(`%${palabra}%`, `%${palabra}%`, `%${palabra}%`, `%${palabra}%`);
    }

    sql += ` ORDER BY score DESC, fecha DESC LIMIT 5000`;

    let noticias = db.all(sql, args);

    // Si no hay resultados con todas las palabras, buscar con al menos la mitad
    // Igual que Google — si no encuentra todo, muestra lo más relevante
    if (noticias.length === 0 && palabras.length > 1) {
      let sqlFlex    = `SELECT * FROM noticias WHERE 1=1`;
      const argsFlex = [];

      if (modo === 'antioquia') { sqlFlex += ` AND modo = ?`; argsFlex.push('antioquia'); }
      if (desde)    { sqlFlex += ` AND DATE(fecha) >= ?`; argsFlex.push(desde); }
      if (hasta)    { sqlFlex += ` AND DATE(fecha) <= ?`; argsFlex.push(hasta); }
      if (subregion) { sqlFlex += ` AND lower(subregion) = ?`; argsFlex.push(subregion.toLowerCase()); }
      if (municipio) { sqlFlex += ` AND lower(municipio) = ?`; argsFlex.push(municipio.toLowerCase()); }

      // Buscar con OR en vez de AND — al menos una palabra debe aparecer
      const condiciones = palabras.map(() =>
        `lower(titulo) LIKE ? OR lower(municipio) LIKE ? OR lower(subregion) LIKE ?`
      ).join(' OR ');

      sqlFlex += ` AND (${condiciones})`;
      for (const palabra of palabras) {
        argsFlex.push(`%${palabra}%`, `%${palabra}%`, `%${palabra}%`);
      }

      sqlFlex += ` ORDER BY score DESC, fecha DESC LIMIT 5000`;
      noticias = db.all(sqlFlex, argsFlex);
    }

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
    const token = Buffer.from(adminPass + Date.now()).toString('base64');
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

    const subregion = municipio ? (MUNICIPIO_A_SUBREGION[municipio.toLowerCase()] || 'general') : null;

    if (municipio && subregion) {
      db.run('UPDATE noticias SET categoria = ?, municipio = ?, subregion = ? WHERE id = ?', [categoria, municipio, subregion, id]);
    } else {
      db.run('UPDATE noticias SET categoria = ? WHERE id = ?', [categoria, id]);
    }

    if (hash) {
      db.run(
        `INSERT OR REPLACE INTO noticias_fijas (hash, categoria, municipio, subregion) VALUES (?, ?, ?, ?)`,
        [hash, categoria, municipio || null, subregion || null]
      );
    }

    console.log(`[Admin] Noticia ${id} → ${categoria} ${municipio ? '/ '+municipio : ''}`);
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

    db.run('DELETE FROM noticias WHERE id = ?', [id]);

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
      `SELECT f.hash, f.categoria, f.municipio, f.subregion, f.fecha, n.titulo
       FROM noticias_fijas f
       LEFT JOIN noticias n ON n.hash = f.hash
       ORDER BY f.fecha DESC`,
      []
    );

    res.json({
      ok: true,
      ignoradas: { total: ignoradas.length, items: ignoradas },
      fijas:     { total: fijas.length,     items: fijas }
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
