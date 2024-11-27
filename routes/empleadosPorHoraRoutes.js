const express = require('express');
const router = express.Router();
const empleadosPorHoraController = require('../controllers/empleadosPorHoraController');

// Ruta para obtener empleados por hora
router.get('/', empleadosPorHoraController.getEmpleadosPorHora);

module.exports = router;
