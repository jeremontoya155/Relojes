const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Obtener tickets por hora del mes actual y el mes anterior
exports.fetchTickets = async (req, res) => {
    try {
        const { sucursal, hora } = req.query; // Leer los filtros desde la URL
        const connection = await mysql.createConnection(dbConfig);

        let query = `
            SELECT 
                Sucursal,
                DATE_FORMAT(Emision, '%Y-%m') AS Mes,
                HOUR(Hora) AS Hora,
                COUNT(IDComprobante) AS TotalTickets
            FROM 
                factcabecera
            WHERE 
                Emision >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
                AND Emision < DATE_FORMAT(NOW() + INTERVAL 1 MONTH, '%Y-%m-01')
        `;

        const params = [];

        // Agregar filtros dinámicos según los parámetros de consulta
        if (sucursal) {
            query += ` AND Sucursal = ?`;
            params.push(sucursal);
        }

        if (hora) {
            query += ` AND HOUR(Hora) = ?`;
            params.push(parseInt(hora, 10));
        }

        query += `
            GROUP BY 
                Sucursal,
                DATE_FORMAT(Emision, '%Y-%m'),
                HOUR(Hora)
            ORDER BY 
                Sucursal, Mes, Hora;
        `;

        // Ejecutar la consulta con parámetros
        const [rows] = await connection.execute(query, params);

        await connection.end();

        // Si se solicita como JSON (API), devolver los datos en JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, data: rows });
        }

        // Renderizar los datos en la vista si no es una solicitud JSON
        res.render('tickets', { data: rows });
    } catch (error) {
        console.error('Error al obtener tickets por hora:', error.message);
        res.status(500).send('Error al obtener datos de tickets.');
    }
};
