const express    = require('express');
const controller = require('../controllers/dashboardController');
const router     = express.Router();

router.get('/dashboard',              controller.getDashboard);
router.get('/mapa/subregion/:id',     controller.getSubregion);
router.get('/mapa/municipio',         controller.getMunicipio);
router.get('/noticias/categoria',     controller.getNoticiasCategoria);
router.get('/noticias/buscar',        controller.buscarNoticias);
router.get('/noticias/tendencia',     controller.getTendenciaCategoria);
router.get('/salud/logs',             controller.getLogs);
router.post('/noticias/recolectar',   controller.recolectarManual);
router.post('/admin/reclasificar',    controller.reclasificarDB);
router.post('/admin/login',           controller.adminLogin);
router.post('/admin/noticia/categoria', controller.verificarAdminToken, controller.adminCambiarCategoria);
router.post('/admin/noticia/eliminar',  controller.verificarAdminToken, controller.adminEliminarNoticia);
router.get('/admin/cambios',           controller.adminVerCambios);

module.exports = router;