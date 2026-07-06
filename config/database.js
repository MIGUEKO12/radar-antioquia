// ================= SECCIÓN: DEPENDENCIAS =================
const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');

// ================= SECCIÓN: RUTA DEL ARCHIVO DB =================
const DB_PATH = path.resolve(process.env.DB_PATH || './data/radar.db');
const DB_DIR  = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ================= SECCIÓN: ESTADO =================
let _db  = null;
let _SQL = null;

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

  // Tabla principal de noticias
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

  // Migración: columna score
  try {
    _db.run(`ALTER TABLE noticias ADD COLUMN score INTEGER DEFAULT 1`);
    console.log('[DB] Migración: columna score agregada');
  } catch(e) {}

  // Migración: columna descripcion (snippet del RSS, mejora la detección de municipio)
  try {
    _db.run(`ALTER TABLE noticias ADD COLUMN descripcion TEXT DEFAULT NULL`);
    console.log('[DB] Migración: columna descripcion agregada');
  } catch(e) {}

  // ================= SECCIÓN: FUNCIÓN SQL PERSONALIZADA fnorm =================
  // SQLite solo maneja lower() para ASCII: lower('Apartadó') NO iguala 'apartado'.
  // Registramos fnorm() en el motor: minúsculas + sin tildes, igual que el backend.
  // Permite consultas como: WHERE fnorm(municipio) = fnorm(?) — inmune a tildes.
  registrarFunciones();
  console.log('[DB] Función SQL fnorm() registrada (comparaciones sin tildes)');

  // Tabla de noticias ignoradas permanentemente
  // El cron nunca volverá a insertar un hash que esté aquí
  _db.run(`
    CREATE TABLE IF NOT EXISTS noticias_ignoradas (
      hash      TEXT PRIMARY KEY,
      titulo    TEXT,
      motivo    TEXT DEFAULT 'admin',
      fecha     TEXT DEFAULT (datetime('now'))
    );
  `);

  // Tabla de noticias con categoría/municipio fijos por admin
  // El cron respeta estos valores y no los sobreescribe
  _db.run(`
    CREATE TABLE IF NOT EXISTS noticias_fijas (
      hash      TEXT PRIMARY KEY,
      categoria TEXT,
      municipio TEXT,
      subregion TEXT,
      fecha     TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('[DB] Tablas de control admin listas');
  guardarEnDisco();
  return _db;
}

// ================= SECCIÓN: REGISTRO DE FUNCIONES SQL =================
// IMPORTANTE (bug de sql.js): _db.export() cierra y reabre el motor internamente,
// lo que DESTRUYE todas las funciones creadas con create_function().
// Por eso este registro vive en una función propia: se llama al abrir la BD
// y se vuelve a llamar después de CADA export() en guardarEnDisco().
function registrarFunciones() {
  if (!_db) return;                       // Guarda defensiva: sin instancia no hay registro
  _db.create_function('fnorm', (s) =>     // Registra fnorm() en el motor SQLite
    (s || '')                             // Tolera NULL devolviendo cadena vacía
      .toLowerCase()                      // Minúsculas reales (incluye Í → í)
      .normalize('NFD')                   // Separa letra y acento (á → a + ́ )
      .replace(/[\u0300-\u036f]/g, '')    // Elimina los diacríticos combinantes
  );
}

function guardarEnDisco() {
  if (!_db) return;
  const data   = _db.export();            // OJO: export() borra las funciones registradas
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  registrarFunciones();                   // Re-registro obligatorio tras cada export()
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