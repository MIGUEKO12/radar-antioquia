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

    // ── Período ANTERIOR equivalente (para tendencias ▲/▼ en las tarjetas) ──
    // Ventana inmediatamente anterior con la MISMA duración: si el período es
    // 2026-06-29 → 2026-07-05 (7 días), el anterior es 2026-06-22 → 2026-06-28.
    const MS_DIA   = 24 * 60 * 60 * 1000;                          // Milisegundos por día
    const dDesde   = new Date(desde + 'T00:00:00Z');               // Inicio actual (UTC)
    const dHasta   = new Date(hasta + 'T00:00:00Z');               // Fin actual (UTC)
    const duracion = Math.round((dHasta - dDesde) / MS_DIA) + 1;   // Días del período (inclusive)
    const antHasta = new Date(dDesde.getTime() - MS_DIA);          // Día anterior al inicio
    const antDesde = new Date(antHasta.getTime() - (duracion - 1) * MS_DIA); // Retroceder la misma duración
    const desdeAnt = antDesde.toISOString().split('T')[0];         // YYYY-MM-DD anterior inicio
    const hastaAnt = antHasta.toISOString().split('T')[0];         // YYYY-MM-DD anterior fin

    const [porCategoria, porSubregion, tendencia, recientes, porCategoriaAnterior] = await Promise.all([
      NoticiaModel.contarPorCategoria({ desde, hasta, modo:'antioquia' }),
      NoticiaModel.contarPorSubregion({ desde, hasta }),
      NoticiaModel.tendenciaPorDia({ dias: periodo==='mes'?30:periodo==='semana'?7:1, modo:'antioquia' }),
      NoticiaModel.obtenerNoticias({ desde, hasta, modo:'antioquia', limite:2000 }),
      NoticiaModel.contarPorCategoria({ desde: desdeAnt, hasta: hastaAnt, modo:'antioquia' }) // Ventana previa
    ]);

    const total = porCategoria.reduce((acc,c) => acc+c.total, 0);

    res.json({
      ok:true, periodo, desde, hasta,
      resumen:{ total, porCategoria },
      // Conteos del período anterior (misma estructura) para calcular % de cambio en el frontend
      resumenAnterior:{ desde: desdeAnt, hasta: hastaAnt, porCategoria: porCategoriaAnterior },
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

// ================= SECCIÓN: MOTOR DE BÚSQUEDA (v2) =================
// Mejoras clave respecto a la versión anterior:
//   1. TOKENIZACIÓN ROBUSTA: elimina comas, puntos, guiones y símbolos antes de
//      dividir. "Dron, dron, DrOn DRONES" produce UN solo token útil.
//   2. RAÍCES (stemming ligero): "dron"/"drones", "amenaza"/"amenazas" se
//      relacionan entre sí — se busca por la raíz con LIKE %raiz%.
//   3. TILDES: usa la función SQL fnorm() registrada en database.js, porque el
//      lower() de SQLite NO convierte tildes ("Apartadó" ≠ "apartado" antes).
//   4. q OPCIONAL: se puede filtrar SOLO por fecha/subregión/municipio — antes
//      el endpoint devolvía 400 y el filtro combinado moría en silencio.
//   5. AND estricto primero; si no hay nada, fallback OR ordenado por relevancia.

// ── Tokenizador compartido ──────────────────────────────────────────────────
// Convierte texto libre del usuario en tokens limpios y sus raíces.
function tokenizarBusqueda(q) {
  const norm = q                                    // Texto original del usuario
    .toLowerCase()                                  // Minúsculas
    .normalize('NFD')                               // Separa letra de acento
    .replace(/[\u0300-\u036f]/g, '')                // Quita acentos
    .replace(/[^a-z0-9\s]/g, ' ');                  // TODA puntuación → espacio (comas incluidas)

  const vistos = new Set();                         // Para eliminar duplicados ("dron dron")
  const tokens = [];                                // Resultado final

  for (const palabra of norm.split(/\s+/)) {        // Dividir por espacios
    if (palabra.length < 2) continue;               // Ignorar tokens de 1 letra
    // RAÍZ: quitar plural español simple. "drones"→"dron", "amenazas"→"amenaza".
    // Solo si la raíz queda con 3+ letras, para no destruir palabras cortas.
    let raiz = palabra;                             // Por defecto la palabra misma
    if (palabra.length >= 5 && palabra.endsWith('es')) raiz = palabra.slice(0, -2); // "drones"→"dron"
    else if (palabra.length >= 4 && palabra.endsWith('s')) raiz = palabra.slice(0, -1); // "minas"→"mina"
    if (vistos.has(raiz)) continue;                 // "Dron, dron, DrOn" → una sola vez
    vistos.add(raiz);                               // Registrar raíz vista
    tokens.push({ palabra, raiz });                 // Guardar par palabra/raíz
  }
  return tokens;                                    // Ej: [{palabra:'drones',raiz:'dron'}]
}

async function buscarNoticias(req, res) {
  try {
    // ── Sanitización de entradas (longitudes máximas defensivas) ────────────
    const q         = String(req.query.q         || '').slice(0, 200);  // Texto de búsqueda
    const desde     = String(req.query.desde     || '').slice(0, 10);   // Fecha inicial YYYY-MM-DD
    const hasta     = String(req.query.hasta     || '').slice(0, 10);   // Fecha final YYYY-MM-DD
    const subregion = String(req.query.subregion || '').slice(0, 50);   // Filtro subregión
    const municipio = String(req.query.municipio || '').slice(0, 100);  // Filtro municipio
    const modo      = String(req.query.modo      || '').slice(0, 20);   // 'antioquia' o vacío

    // ── Validación de fechas: solo formato ISO estricto (anti-inyección) ────
    const fechaValida = f => /^\d{4}-\d{2}-\d{2}$/.test(f);             // Regex YYYY-MM-DD
    const dDesde = fechaValida(desde) ? desde : '';                     // Descarta valores raros
    const dHasta = fechaValida(hasta) ? hasta : '';

    // ── Tokenizar la búsqueda (puede quedar vacía y es válido) ──────────────
    const tokens = tokenizarBusqueda(q);                                // Tokens con raíces

    // ── q ES OPCIONAL si hay al menos otro criterio de filtrado ─────────────
    const hayOtroFiltro = dDesde || dHasta || subregion || municipio;   // ¿Algún filtro más?
    if (!tokens.length && !hayOtroFiltro) {
      return res.status(400).json({ ok:false, error:'Ingresa una búsqueda o al menos un filtro' });
    }

    const { db } = require('../../config/database');                    // Conexión sql.js

    // ── Constructor de la cláusula de filtros comunes ────────────────────────
    // Se reutiliza en la búsqueda estricta (AND) y en el fallback (OR).
    function filtrosBase() {
      let sql  = `SELECT * FROM noticias WHERE 1=1`;                    // Base siempre verdadera
      const args = [];                                                  // Parámetros ligados
      if (modo === 'antioquia') { sql += ` AND modo = ?`; args.push('antioquia'); } // Solo modo Antioquia
      if (dDesde)   { sql += ` AND DATE(fecha) >= ?`; args.push(dDesde); }          // Desde (inclusive)
      if (dHasta)   { sql += ` AND DATE(fecha) <= ?`; args.push(dHasta); }          // Hasta (inclusive)
      // fnorm() en AMBOS lados: 'Apartadó' de un selector iguala 'apartado' en BD
      if (subregion) { sql += ` AND fnorm(subregion) = fnorm(?)`; args.push(subregion); }
      if (municipio) { sql += ` AND fnorm(municipio) = fnorm(?)`; args.push(municipio); }
      return { sql, args };                                             // Fragmento reutilizable
    }

    // ── INTENTO 1: AND estricto — todas las raíces deben aparecer ───────────
    let { sql, args } = filtrosBase();                                  // Filtros comunes
    for (const t of tokens) {                                           // Cada token de búsqueda
      // La raíz con LIKE %raiz% cubre singular Y plural: %dron% ⊇ dron, drones
      sql += ` AND (
        fnorm(titulo)    LIKE ? OR
        fnorm(municipio) LIKE ? OR
        fnorm(subregion) LIKE ?
      )`;
      const patron = `%${t.raiz}%`;                                     // Patrón por raíz
      args.push(patron, patron, patron);                                // Un patrón por campo
    }
    sql += ` ORDER BY fecha DESC, score DESC LIMIT 5000`;               // Recientes primero
    let noticias = db.all(sql, args);                                   // Ejecutar consulta

    // ── INTENTO 2 (fallback): OR con ranking por relevancia ─────────────────
    // Solo si el AND estricto no encontró nada y hay 2+ tokens.
    let modoRelevancia = false;                                         // Bandera para el cliente
    if (noticias.length === 0 && tokens.length > 1) {
      const flex = filtrosBase();                                       // Mismos filtros base
      const condiciones = tokens.map(() =>
        `(fnorm(titulo) LIKE ? OR fnorm(municipio) LIKE ? OR fnorm(subregion) LIKE ?)`
      ).join(' OR ');                                                   // Al menos UNA raíz
      flex.sql += ` AND (${condiciones})`;                              // Añadir condiciones OR
      for (const t of tokens) {                                         // Ligar parámetros
        const patron = `%${t.raiz}%`;
        flex.args.push(patron, patron, patron);
      }
      flex.sql += ` ORDER BY fecha DESC, score DESC LIMIT 5000`;        // Mismo orden
      const candidatas = db.all(flex.sql, flex.args);                   // Candidatas OR

      // Ranking en JS: cuenta cuántas raíces aparecen en cada noticia y ordena
      const fn = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      noticias = candidatas
        .map(n => {                                                     // Calcular hits por noticia
          const texto = fn(n.titulo)+' '+fn(n.municipio||'')+' '+fn(n.subregion||'');
          const hits  = tokens.filter(t => texto.includes(t.raiz)).length;
          return { n, hits };                                           // Par noticia/relevancia
        })
        .sort((a,b) => b.hits - a.hits || (a.n.fecha < b.n.fecha ? 1 : -1)) // Más hits, luego fecha
        .map(x => x.n);                                                 // Devolver solo noticias
      modoRelevancia = true;                                            // Informar al frontend
    }

    // ── Respuesta ─────────────────────────────────────────────────────────────
    res.json({ ok:true, query:q, total:noticias.length, modoRelevancia, noticias });
  } catch (err) {
    console.error('[Buscar]', err);                                     // Log interno
    res.status(500).json({ ok:false, error:'Error al buscar noticias' }); // Error genérico al cliente
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
