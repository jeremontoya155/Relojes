const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Ruta para obtener tickets por hora
router.get('/', ticketController.fetchTickets);

module.exports = router;