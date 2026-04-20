// ================= SECCIÓN: DEPENDENCIAS =================
const { db }  = require('../config/database'); // Instancia sql.js
const crypto  = require('crypto');             // Para hash de deduplicación
const { obtenerPuntuacionFuente } = require('../config/fuentes'); // Scoring de fuentes

// ================= SECCIÓN: HASH =================
function generarHash(titulo) {
  return crypto.createHash('md5').update(titulo.trim().toLowerCase()).digest('hex');
}

// ================= SECCIÓN: INSERCIÓN =================
function insertarNoticia({ titulo, link, fecha, subregion: _subregion, municipio: _municipio, categoria: _categoria, modo, query }) {
  let subregion = _subregion;
  let municipio = _municipio;
  let categoria = _categoria;
  const hash  = generarHash(titulo);
  const score = obtenerPuntuacionFuente(titulo); // 3=Alta, 2=Media, 1=Baja/Desconocido

  // Verificar si está en lista negra de ignoradas — nunca se vuelve a insertar
  const ignorada = db.get('SELECT hash FROM noticias_ignoradas WHERE hash = ?', [hash]);
  if (ignorada) return false;

  // Verificamos si el hash ya existe (deduplicación manual)
  const existe = db.get('SELECT id FROM noticias WHERE hash = ?', [hash]);
  if (existe) {
    // Verificar si tiene categoría/municipio fijo por admin — respetar siempre
    const fija = db.get('SELECT * FROM noticias_fijas WHERE hash = ?', [hash]);
    if (fija) {
      db.run(
        `UPDATE noticias SET categoria = ?, municipio = ?, subregion = ? WHERE hash = ?`,
        [fija.categoria, fija.municipio, fija.subregion || 'general', hash]
      );
    }
    return false;
  }

  // Verificar si tiene valores fijos antes de insertar
  const fijaNueva = db.get('SELECT * FROM noticias_fijas WHERE hash = ?', [hash]);
  if (fijaNueva) {
    categoria = fijaNueva.categoria || categoria;
    municipio = fijaNueva.municipio || municipio;
    subregion = fijaNueva.subregion || subregion;
  }

  const result = db.run(
    `INSERT INTO noticias (titulo, link, fecha, subregion, municipio, categoria, modo, query, hash, score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      titulo,
      link,
      fecha,
      subregion  || 'general',
      municipio  || null,
      categoria  || 'general',
      modo       || 'antioquia',
      query      || null,
      hash,
      score
    ]
  );

  return result.changes > 0;
}

// ================= SECCIÓN: CONSULTA PRINCIPAL =================
function obtenerNoticias({ desde, hasta, subregion, municipio, modo, limite = 2000 }) {
  let sql    = 'SELECT * FROM noticias WHERE 1=1';
  const args = [];

  if (desde)     { sql += ' AND DATE(fecha) >= ?'; args.push(desde); }
  if (hasta)     { sql += ' AND DATE(fecha) <= ?'; args.push(hasta); }
  if (subregion && subregion !== 'todas') { sql += ' AND subregion = ?'; args.push(subregion); }
  if (municipio) { sql += ' AND municipio LIKE ?'; args.push(municipio); }
  if (modo)      { sql += ' AND modo = ?'; args.push(modo); }

  // Ordenar primero por score (fuentes confiables arriba), luego por fecha
  sql += ' ORDER BY score DESC, fecha DESC LIMIT ?';
  args.push(limite);

  return db.all(sql, args);
}

// ================= SECCIÓN: CONTEOS =================
function contarPorCategoria({ desde, hasta, modo }) {
  let sql    = 'SELECT categoria, COUNT(*) as total FROM noticias WHERE 1=1';
  const args = [];

  if (desde) { sql += ' AND DATE(fecha) >= ?'; args.push(desde); }
  if (hasta) { sql += ' AND DATE(fecha) <= ?'; args.push(hasta); }
  if (modo)  { sql += ' AND modo = ?'; args.push(modo); }

  sql += ' GROUP BY categoria ORDER BY total DESC';
  return db.all(sql, args);
}

function contarPorSubregion({ desde, hasta }) {
  return db.all(
    `SELECT subregion, COUNT(*) as total FROM noticias
     WHERE DATE(fecha) >= ? AND DATE(fecha) <= ? AND modo = 'antioquia'
     AND subregion != 'general'
     GROUP BY subregion ORDER BY total DESC`,
    [desde, hasta]
  );
}

function contarPorMunicipio({ subregion, desde, hasta }) {
  return db.all(
    `SELECT municipio, COUNT(*) as total FROM noticias
     WHERE subregion = ? AND fecha >= ? AND fecha <= ? AND municipio IS NOT NULL
     GROUP BY municipio ORDER BY total DESC`,
    [subregion, desde + 'T00:00:00', hasta + 'T23:59:59']
  );
}

function tendenciaPorDia({ dias = 7, modo }) {
  return db.all(
    `SELECT DATE(fecha) as dia, COUNT(*) as total FROM noticias
     WHERE fecha >= DATE('now', '-${parseInt(dias)} days') AND modo = ?
     GROUP BY DATE(fecha) ORDER BY dia ASC`,
    [modo || 'antioquia']
  );
}

// ================= SECCIÓN: MANTENIMIENTO =================
function limpiarAntiguos() {
  const dias   = parseInt(process.env.DIAS_RETENCION) || 90;
  const result = db.run(`DELETE FROM noticias WHERE fecha < DATE('now', '-${dias} days')`);
  return result.changes;
}

function vacuumDB() {
  try { db.exec('VACUUM'); } catch(e) { /* sql.js puede no soportar VACUUM en todos los modos */ }
}

function estadisticasDB() {
  return {
    total:  (db.get('SELECT COUNT(*) as n FROM noticias') || {}).n || 0,
    hoy:    (db.get("SELECT COUNT(*) as n FROM noticias WHERE DATE(fecha) = DATE('now')") || {}).n || 0,
    semana: (db.get("SELECT COUNT(*) as n FROM noticias WHERE fecha >= DATE('now','-7 days')") || {}).n || 0
  };
}

// ================= SECCIÓN: RECLASIFICACIÓN MASIVA =================
// Recorre todas las noticias existentes y aplica los filtros actuales
// Útil para limpiar la DB después de mejorar clasificador o filtro
function reclasificarTodo() {
  const { clasificarNoticia } = require('../services/clasificador');
  const { aplicarFiltro }     = require('../services/filtro');
  const { detectarUbicacion } = require('../config/municipios');

  const noticias = db.all('SELECT id, titulo, link, categoria FROM noticias', []);
  let actualizadas = 0;
  let sinCambio    = 0;

  for (const n of noticias) {
    try {
      const categoriaBase = clasificarNoticia(n.titulo);
      const categoriaNew  = aplicarFiltro(n.titulo, categoriaBase, n.link || '');
      const { subregion, municipio } = detectarUbicacion(n.titulo);

      if (categoriaNew !== n.categoria) {
        db.run(
          `UPDATE noticias SET categoria = ?, subregion = ?, municipio = ? WHERE id = ?`,
          [categoriaNew, subregion || 'general', municipio || null, n.id]
        );
        actualizadas++;
      } else {
        sinCambio++;
      }
    } catch(e) {
      console.error(`[Reclasificar] Error en id ${n.id}:`, e.message);
    }
  }

  console.log(`[Reclasificar] ${actualizadas} actualizadas, ${sinCambio} sin cambio`);
  return { actualizadas, sinCambio, total: noticias.length };
}

// ================= SECCIÓN: EXPORTACIONES =================
module.exports = {
  insertarNoticia,
  obtenerNoticias,
  contarPorCategoria,
  contarPorSubregion,
  contarPorMunicipio,
  tendenciaPorDia,
  limpiarAntiguos,
  vacuumDB,
  estadisticasDB,
  reclasificarTodo
};