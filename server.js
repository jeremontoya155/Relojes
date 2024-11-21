require('dotenv').config(); // Cargar las variables de entorno desde .env
const express = require('express');
const path = require('path');

// Crear la aplicación Express
const app = express();

// Puerto desde el archivo .env o por defecto 3000
const port = process.env.PORT || 3000;

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para analizar solicitudes POST (form-data) y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Importar rutas
const attendanceRoutes = require('./routes/attendanceRoutes'); // Rutas para la funcionalidad principal
const documentationRoutes = require('./routes/documentationRoutes'); // Rutas para la documentación

// Usar rutas
app.use('/', attendanceRoutes); // Rutas para la funcionalidad de asistencia
app.use('/documentation', documentationRoutes); // Rutas para la documentación

// Manejar errores 404 (Página no encontrada)
app.use((req, res) => {
    res.status(404).render('404', { url: req.originalUrl });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});