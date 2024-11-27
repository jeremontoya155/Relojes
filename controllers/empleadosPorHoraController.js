const mysql = require('mysql2/promise');
const { postgresPool } = require('../db');

// Obtener empleados por hora según la sucursal seleccionada
exports.getEmpleadosPorHora = async (req, res) => {
    try {
        const { sucursal, factorAtencion } = req.query; // Leer sucursal y factor de atención desde la URL

        // Obtener todas las sucursales desde PostgreSQL
        const sucursalesResult = await postgresPool.query('SELECT id, nombre FROM sucursales');
        const sucursales = sucursalesResult.rows;

        // Si no hay sucursal seleccionada, mostrar solo el formulario
        if (!sucursal || !factorAtencion) {
            return res.render('empleadosPorHora', {
                sucursales,
                empleadosPorHora: [],
                sucursal: null,
                totalEmpleados: 0,
                totalComputadoras: 0,
                necesitaMasEmpleados: false,
                necesitaMasPCs: false,
                factorAtencion: factorAtencion || ''
            });
        }

        // Obtener datos de tickets por hora desde MySQL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [tickets] = await connection.execute(`
            SELECT 
                HOUR(Hora) AS Hora,
                COUNT(IDComprobante) AS TotalTickets
            FROM factcabecera
            WHERE Sucursal = ?
              AND Emision >= DATE_FORMAT(NOW() - INTERVAL 2 MONTH, '%Y-%m-01')
              AND Emision < DATE_FORMAT(NOW(), '%Y-%m-01')
            GROUP BY HOUR(Hora)
            ORDER BY HOUR(Hora)
        `, [sucursal]);
        await connection.end();

        // Obtener información de la sucursal desde PostgreSQL
        const sucursalData = await postgresPool.query(`
            SELECT nombre, cantidad_empleados, cantidad_computadoras
            FROM sucursales
            WHERE id = $1
        `, [sucursal]);

        if (!sucursalData.rows.length) {
            return res.status(404).send('Sucursal no encontrada.');
        }

        const sucursalInfo = sucursalData.rows[0];

        // Conversión del factor de atención
        const factor = parseFloat(factorAtencion);
        if (isNaN(factor) || factor <= 0) {
            return res.status(400).send('El factor de atención debe ser un número mayor a 0.');
        }

        // Parámetros de configuración
        const limiteExtra = Math.floor(sucursalInfo.cantidad_empleados * 0.25); // 25% extra permitido
        const maxEmpleadosPermitidos = sucursalInfo.cantidad_empleados + limiteExtra; // Máximo permitido

        // Calcular empleados necesarios por hora
        const empleadosPorHora = tickets.map(row => {
            const empleadosNecesarios = Math.min(
                Math.ceil(row.TotalTickets / factor), // Empleados requeridos
                maxEmpleadosPermitidos // Máximo permitido
            );
            return {
                hora: row.Hora,
                totalTickets: row.TotalTickets,
                empleadosNecesarios
            };
        });

        // Determinar si se necesitan más empleados o PCs
        const maxEmpleadosNecesarios = Math.max(...empleadosPorHora.map(e => e.empleadosNecesarios));
        const necesitaMasEmpleados = maxEmpleadosNecesarios > sucursalInfo.cantidad_empleados;
        const necesitaMasPCs = maxEmpleadosNecesarios > sucursalInfo.cantidad_computadoras;

        res.render('empleadosPorHora', {
            sucursales,
            empleadosPorHora,
            sucursal: sucursalInfo.nombre,
            totalEmpleados: sucursalInfo.cantidad_empleados,
            totalComputadoras: sucursalInfo.cantidad_computadoras,
            necesitaMasEmpleados,
            necesitaMasPCs,
            factorAtencion: factorAtencion
        });
    } catch (error) {
        console.error('Error al calcular empleados por hora:', error.message);
        res.status(500).send('Error al calcular empleados por hora.');
    }
};
