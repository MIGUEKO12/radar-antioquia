// ================= SECCIÓN: DEPENDENCIAS =================
const initSqlJs = require('sql.js');   // SQLite en WebAssembly — sin compilación nativa
const path      = require('path');
const fs        = require('fs');

// ================= SECCIÓN: RUTA DEL ARCHIVO DB =================
const DB_PATH = path.resolve(process.env.DB_PATH || './data/radar.db');
const DB_DIR  = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ================= SECCIÓN: ESTADO =================
let _db  = null;  // Instancia en memoria
let _SQL = null;  // Motor sql.js

async function initDB() {
  _SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new _SQL.Database(fileBuffer);
    console.log('[DB] Cargada desde:', DB_PATH);
  } else {
    _db = new _SQL.Database();
    console.log('[DB] Nueva base de datos:', DB_PATH);
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS noticias (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo      TEXT    NOT NULL,
      link        TEXT    NOT NULL,
      fecha       TEXT    NOT NULL,
      subregion   TEXT    DEFAULT 'general',
      municipio   TEXT    DEFAULT NULL,
      categoria   TEXT    DEFAULT 'general',
      modo        TEXT    DEFAULT 'antioquia',
      query       TEXT    DEFAULT NULL,
      hash        TEXT    NOT NULL UNIQUE,
      creado_en   TEXT    DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fecha     ON noticias(fecha);
    CREATE INDEX IF NOT EXISTS idx_subregion ON noticias(subregion);
    CREATE INDEX IF NOT EXISTS idx_categoria ON noticias(categoria);
    CREATE INDEX IF NOT EXISTS idx_hash      ON noticias(hash);
  `);

  guardarEnDisco();
  return _db;
}

function guardarEnDisco() {
  if (!_db) return;
  const data   = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ================= SECCIÓN: API COMPATIBLE CON better-sqlite3 =================
const db = {
  run(sql, params = []) {
    if (!_db) throw new Error('DB no inicializada. Llama initDB() primero.');
    _db.run(sql, params);
    const changes = _db.getRowsModified();
    guardarEnDisco();
    return { changes };
  },

  all(sql, params = []) {
    if (!_db) throw new Error('DB no inicializada.');
    const stmt = _db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) { rows.push(stmt.getAsObject()); }
    stmt.free();
    return rows;
  },

  get(sql, params = []) {
    const rows = this.all(sql, params);
    return rows[0] || null;
  },

  exec(sql) {
    if (!_db) throw new Error('DB no inicializada.');
    _db.run(sql);
    guardarEnDisco();
  },

  guardarEnDisco
};

module.exports = { db, initDB };
