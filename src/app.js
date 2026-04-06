// ================= SECCIÓN: VARIABLES DE ENTORNO =================
require('dotenv').config();

// ================= SECCIÓN: DEPENDENCIAS =================
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const cron     = require('node-cron');

// ================= SECCIÓN: MÓDULOS INTERNOS =================
const { initDB }                     = require('../config/database');
const apiRoutes                      = require('./routes/apiRoutes');
const { limiterGeneral,
        limiterBusqueda,
        headersSeguridad }           = require('./middlewares/seguridad');
const { recolectarAntioquia }        = require('../services/recolector');
const { limpiarAntiguos,
        vacuumDB,
        estadisticasDB }             = require('../models/NoticiaModel');

// ================= SECCIÓN: INSTANCIA EXPRESS =================
const app  = express();
const PORT = parseInt(process.env.PORT) || 3000;
app.set('trust proxy', 1);

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

// ================= SECCIÓN: CRON JOBS =================
const intervalo = parseInt(process.env.CRON_INTERVALO_MINUTOS) || 30;

cron.schedule(`*/${intervalo} 6-22 * * *`, async () => {
  try {
    const r = await recolectarAntioquia();
    console.log(`[CRON] ${r.insertadas} nuevas, ${r.duplicadas} duplicadas`);
  } catch (err) {
    console.error('[CRON] Error:', err.message);
  }
});

cron.schedule('0 23,1,3,5 * * *', async () => {
  try { await recolectarAntioquia(); } catch (err) { console.error('[CRON nocturno]', err.message); }
});

cron.schedule('0 3 * * *', () => {
  try {
    const eliminadas = limpiarAntiguos();
    vacuumDB();
    console.log(`[CRON] Mantenimiento: ${eliminadas} registros eliminados`);
  } catch (err) { console.error('[CRON mantenimiento]', err.message); }
});

// ================= SECCIÓN: ARRANQUE =================
// IMPORTANTE: inicializamos la DB antes de arrancar el servidor
async function arrancar() {
  try {
    // 1. Inicializamos sql.js y la base de datos
    await initDB();

    // 2. Arrancamos el servidor HTTP
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

      // 3. Recolección inicial al arrancar
      console.log('  Recolectando noticias iniciales...');
      try {
        const r = await recolectarAntioquia();
        console.log(`  OK: ${r.insertadas} noticias nuevas`);
      } catch (err) {
        console.error('  Error en recolección inicial:', err.message);
      }

      console.log('═══════════════════════════════════════════\n');
    });

  } catch (err) {
    console.error('[ARRANQUE] Error crítico:', err);
    process.exit(1); // Terminamos si la DB no puede inicializarse
  }
}

arrancar(); // Ejecutamos la función principal

module.exports = app;
