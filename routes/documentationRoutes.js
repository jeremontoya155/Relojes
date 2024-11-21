const express = require('express');
const router = express.Router();

// Renderizar la documentación
router.get('/', (req, res) => {
    res.render('documentation'); // Asegúrate de tener `documentation.ejs` en la carpeta `views`
});

module.exports = router;
