const ZKLib = require('node-zklib');

// Sucursal de administración configurada desde `.env`
const adminBranch = {
    name: process.env.ADMIN_BRANCH_NAME || "Administración", // Valor por defecto
    host: process.env.ADMIN_BRANCH_HOST || "192.168.5.229", // Valor por defecto
    port: parseInt(process.env.ADMIN_BRANCH_PORT, 10) || 4370 // Valor por defecto
};

// Generar sucursales dinámicamente desde `.env`
const branches = [
    adminBranch,
    ...Array.from({ length: parseInt(process.env.BRANCH_COUNT) }, (_, i) => ({
        name: `Sucursal ${i + 1}`,
        host: `${process.env.BRANCH_PREFIX}${i + 1}.ddns.net`,
        port: parseInt(process.env.BRANCH_PORT)
    }))
];

// Renderizar la página principal
exports.renderHome = (req, res) => {
    console.log('Sucursales generadas:', branches);
    res.render('index', { branches });
};

// Obtener datos de asistencia con validaciones
exports.fetchAttendance = async (req, res) => {
    const { branch, startDate, endDate } = req.body;

    console.log('Rango de fechas recibido:', { startDate, endDate });

    const selectedBranch = branches.find(b => b.name === branch);
    if (!selectedBranch) {
        console.error('Sucursal no encontrada:', branch);
        return res.status(400).send('Sucursal no encontrada');
    }

    const zkDevice = new ZKLib(selectedBranch.host, selectedBranch.port, 10000, 5000);

    try {
        console.log(`Conectando a ${selectedBranch.name} (${selectedBranch.host}:${selectedBranch.port})...`);
        await zkDevice.createSocket();
        console.log(`Conexión establecida con ${selectedBranch.name}`);

        // Obtener datos de asistencia
        const attendanceData = await zkDevice.getAttendances();
        console.log('Datos obtenidos del dispositivo:', attendanceData.data);

        await zkDevice.disconnect();
        console.log(`Conexión cerrada con ${selectedBranch.name}`);

        if (!attendanceData || !attendanceData.data || attendanceData.data.length === 0) {
            console.warn(`No se encontraron datos de asistencia para ${selectedBranch.name}`);
            return res.render('attendance', { branch: selectedBranch.name, data: [], startDate, endDate });
        }

        // Filtrar datos válidos y recientes
        const validData = attendanceData.data.filter(record => {
            const recordTime = new Date(record.recordTime);
            return (
                recordTime.getFullYear() >= 2020 && // Filtrar años mínimos razonables
                recordTime <= new Date() && // Excluir fechas futuras
                record.deviceUserId // Verificar que el ID de usuario no esté vacío
            );
        });

        if (validData.length === 0) {
            console.warn('No se encontraron registros válidos después de limpiar los datos.');
            return res.render('attendance', { branch: selectedBranch.name, data: [], startDate, endDate });
        }

        // Ordenar los datos por fecha descendente (los más recientes primero)
        validData.sort((a, b) => new Date(b.recordTime) - new Date(a.recordTime));
        console.log('Datos ordenados por fecha (descendentes):', validData);

        // Filtrar datos por rango de fechas
        let filteredData = validData.filter(record => {
            const recordTime = new Date(record.recordTime);
            return recordTime >= new Date(startDate) && recordTime <= new Date(endDate);
        });

        // Si no hay registros en el rango, mostrar los más recientes
        if (filteredData.length === 0) {
            console.warn('No se encontraron registros en el rango de fechas, tomando los más recientes disponibles.');
            filteredData = validData.slice(0, 100); // Tomar los primeros 100 registros más recientes
        }

        console.log('Datos finales enviados a la vista:', filteredData);

        res.render('attendance', { branch: selectedBranch.name, data: filteredData, startDate, endDate });
    } catch (error) {
        console.error(`Error al conectar con ${selectedBranch.name}:`, error.message);
        res.status(500).send(`Error al conectar con ${selectedBranch.name}: ${error.message}`);
    }
};

// Renderizar la documentación
exports.renderDocumentation = (req, res) => {
    res.render('documentation');
};
