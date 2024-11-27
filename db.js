const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

// Configuración para MySQL
const mysqlConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Crear conexión a MySQL
const getMysqlConnection = async () => {
    try {
        const connection = await mysql.createConnection(mysqlConfig);
        console.log('Conexión exitosa a MySQL');
        return connection;
    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);
        throw error;
    }
};

// Configuración para PostgreSQL
const postgresPool = new Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
});

// Verificar conexión a PostgreSQL
postgresPool
    .connect()
    .then(client => {
        console.log('Conexión exitosa a PostgreSQL');
        client.release();
    })
    .catch(error => {
        console.error('Error al conectar con PostgreSQL:', error.message);
    });

module.exports = {
    getMysqlConnection,
    postgresPool
};
