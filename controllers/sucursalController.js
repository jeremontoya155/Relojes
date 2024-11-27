const { postgresPool } = require('../db');

// Obtener todas las sucursales desde PostgreSQL
exports.getSucursales = async (req, res) => {
    try {
        const result = await postgresPool.query(`
            SELECT s.id, s.nombre, s.cantidad_empleados, s.cantidad_computadoras, e.nombre AS encargado
            FROM sucursales s
            LEFT JOIN empleados e ON s.encargado_id = e.id
        `);
        res.render('sucursales', { sucursales: result.rows });
    } catch (error) {
        console.error('Error al obtener sucursales:', error.message);
        res.status(500).send('Error al obtener sucursales.');
    }
};

// Crear o actualizar una sucursal en PostgreSQL
exports.saveSucursal = async (req, res) => {
    const { id, nombre, cantidad_empleados, cantidad_computadoras, encargado_id } = req.body;

    const query = id
        ? `UPDATE sucursales 
           SET nombre = $1, cantidad_empleados = $2, cantidad_computadoras = $3, encargado_id = $4 
           WHERE id = $5`
        : `INSERT INTO sucursales (nombre, cantidad_empleados, cantidad_computadoras, encargado_id) 
           VALUES ($1, $2, $3, $4)`;

    const params = id
        ? [nombre, cantidad_empleados, cantidad_computadoras, encargado_id || null, id]
        : [nombre, cantidad_empleados, cantidad_computadoras, encargado_id || null];

    try {
        await postgresPool.query(query, params);
        res.redirect('/sucursales'); // Redirigir después de guardar
    } catch (error) {
        console.error('Error al guardar sucursal:', error.message);
        res.status(500).send('Error al guardar sucursal.');
    }
};

// Obtener la lista de empleados con rol "Encargado" desde PostgreSQL
exports.getEmpleados = async (req, res) => {
    try {
        const result = await postgresPool.query(`
            SELECT id, nombre 
            FROM empleados
            WHERE rol = 'Encargado'
        `); // Filtrar empleados con rol "Encargado"
        res.json({ success: true, empleados: result.rows }); // Devolver empleados como JSON
    } catch (error) {
        console.error('Error al obtener empleados:', error.message);
        res.status(500).send('Error al obtener empleados.');
    }
};
