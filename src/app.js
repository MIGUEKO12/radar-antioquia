// ================= SECCIÓN: VARIABLES DE ENTORNO =================
require('dotenv').config();

// ================= SECCIÓN: DEPENDENCIAS =================
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const cron     = require('node-cron');

// ================= SECCIÓN: MÓDULOS INTERNOS =================
const { initDB, db }                 = require('../config/database');
const apiRoutes                      = require('./routes/apiRoutes');
const { limiterGeneral,
        limiterBusqueda,
        headersSeguridad }           = require('./middlewares/seguridad');
const { recolectarAntioquia,
        recolectarHistorico }        = require('../services/recolector');
const { limpiarAntiguos,
        vacuumDB,
        estadisticasDB }             = require('../models/NoticiaModel');

// ================= SECCIÓN: INSTANCIA EXPRESS =================
const app  = express();
const PORT = parseInt(process.env.PORT) || 3000;

// ================= SECCIÓN: MIDDLEWARES =================
app.use(headersSeguridad);

const originesPermitidos = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({ origin: originesPermitidos, methods: ['GET', 'POST'], credentials: false }));

app.use(limiterGeneral);
app.use('/api/noticias/buscar', limiterBusqueda);
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ================= SECCIÓN: RUTAS =================
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR GLOBAL]', err.stack);
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
});

// ================= SECCIÓN: LOGS DE SALUD =================
// Crea la tabla de logs si no existe — registra cada recolección automática
function iniciarTablaLogs() {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS logs_recoleccion (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha         TEXT    NOT NULL DEFAULT (datetime('now')),
        tipo          TEXT    NOT NULL DEFAULT 'cron',
        intentadas    INTEGER DEFAULT 0,
        insertadas    INTEGER DEFAULT 0,
        duplicadas    INTEGER DEFAULT 0,
        errores       INTEGER DEFAULT 0,
        duracion_ms   INTEGER DEFAULT 0,
        nota          TEXT    DEFAULT NULL
      )
    `);
    console.log('[LOGS] Tabla de salud lista');
  } catch(e) {
    console.error('[LOGS] Error creando tabla:', e.message);
  }
}

// Guarda un registro de cada recolección
function guardarLog({ tipo = 'cron', insertadas = 0, duplicadas = 0, errores = 0, duracion_ms = 0, nota = null }) {
  try {
    db.run(
      `INSERT INTO logs_recoleccion (tipo, insertadas, duplicadas, errores, duracion_ms, nota)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tipo, insertadas, duplicadas, errores, duracion_ms, nota]
    );
  } catch(e) {
    console.error('[LOGS] Error guardando log:', e.message);
  }
}

// ================= SECCIÓN: CRON JOBS =================
const intervalo = parseInt(process.env.CRON_INTERVALO_MINUTOS) || 30;

// Recolecta cada 30 minutos las 24 horas
cron.schedule(`*/${intervalo} * * * *`, async () => {
  const inicio = Date.now();
  try {
    const r = await recolectarAntioquia();
    const duracion_ms = Date.now() - inicio;
    console.log(`[CRON] ${r.insertadas} nuevas, ${r.duplicadas} duplicadas (${duracion_ms}ms)`);
    guardarLog({ tipo:'cron', insertadas:r.insertadas, duplicadas:r.duplicadas, duracion_ms });
  } catch (err) {
    const duracion_ms = Date.now() - inicio;
    console.error('[CRON] Error:', err.message);
    guardarLog({ tipo:'cron', errores:1, duracion_ms, nota:err.message.slice(0,200) });
  }
});

// Mantenimiento diario a las 3am
cron.schedule('0 3 * * *', () => {
  const inicio = Date.now();
  try {
    const eliminadas = limpiarAntiguos();
    vacuumDB();
    const duracion_ms = Date.now() - inicio;
    console.log(`[CRON] Mantenimiento: ${eliminadas} registros eliminados`);
    guardarLog({ tipo:'mantenimiento', nota:`${eliminadas} registros eliminados`, duracion_ms });
  } catch (err) {
    console.error('[CRON mantenimiento]', err.message);
    guardarLog({ tipo:'mantenimiento', errores:1, nota:err.message.slice(0,200) });
  }
});

// ================= SECCIÓN: ARRANQUE =================
async function arrancar() {
  try {
    // 1. Inicializamos sql.js y la base de datos
    await initDB();

    // 2. Crear tabla de logs de salud
    iniciarTablaLogs();

    // 3. Arrancamos el servidor HTTP
    app.listen(PORT, async () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('  RADAR DE NOTICIAS — Gobernación Antioquia');
      console.log(`  http://127.0.0.1:${PORT}`);
      console.log('═══════════════════════════════════════════');

      try {
        const stats = estadisticasDB();
        console.log(`  DB: ${stats.total} noticias totales, ${stats.hoy} hoy`);
      } catch (e) {
        console.log('  DB: lista (primera ejecución)');
      }

      // 4. Recolección inicial al arrancar
      console.log('  Recolectando noticias iniciales...');
      const inicio = Date.now();
      try {
        const r = await recolectarAntioquia();
        const duracion_ms = Date.now() - inicio;
        console.log(`  OK: ${r.insertadas} noticias nuevas`);
        guardarLog({ tipo:'arranque', insertadas:r.insertadas, duplicadas:r.duplicadas, duracion_ms });
      } catch (err) {
        console.error('  Error en recolección inicial:', err.message);
        guardarLog({ tipo:'arranque', errores:1, nota:err.message.slice(0,200), duracion_ms: Date.now() - inicio });
      }

      // 5. Recolección histórica si la DB tiene pocas noticias
      try {
        const stats = estadisticasDB();
        if (stats.total < 500) {
          console.log('  Iniciando recolección histórica desde enero...');
          recolectarHistorico().catch(err => console.error('[HISTÓRICO]', err));
        }
      } catch (err) {
        console.error('  Error verificando histórico:', err.message);
      }

      console.log('═══════════════════════════════════════════\n');
    });

  } catch (err) {
    console.error('[ARRANQUE] Error crítico:', err);
    process.exit(1);
  }
}

arrancar();

module.exports = app;