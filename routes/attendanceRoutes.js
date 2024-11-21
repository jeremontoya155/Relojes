const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Ruta para la página principal
router.get('/', attendanceController.renderHome);

// Ruta para obtener los datos de asistencia
router.post('/fetch-attendance', attendanceController.fetchAttendance);

module.exports = router; // Asegúrate de exportar el router, no un objeto.

