const express    = require('express');
const controller = require('../controllers/dashboardController');
const router     = express.Router();

router.get('/dashboard',              controller.getDashboard);
router.get('/mapa/subregion/:id',     controller.getSubregion);
router.get('/mapa/municipio',         controller.getMunicipio);
router.get('/noticias/categoria',     controller.getNoticiasCategoria);   // NUEVO — drill-down municipio
router.get('/noticias/buscar',        controller.buscarNoticias);
router.post('/noticias/recolectar',   controller.recolectarManual);
router.get('/noticias/tendencia', controller.getTendenciaCategoria);

module.exports = router;