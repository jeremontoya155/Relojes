const express = require('express');
const router = express.Router();
const sucursalController = require('../controllers/sucursalController');

// Vista principal de sucursales
router.get('/', sucursalController.getSucursales);

// Guardar o actualizar sucursal
router.post('/save', sucursalController.saveSucursal);

// Obtener empleados para asignar encargados
router.get('/empleados', sucursalController.getEmpleados);

module.exports = router;
