const ZKLib = require('node-zklib');

// Sucursal de administración configurada manualmente
const adminBranch = {
    name: 'Administración',
    host: '192.168.5.229',
    port: 4370,
};

// Generar sucursales dinámicamente para las demás
const branches = [
    adminBranch,
    ...Array.from({ length: parseInt(process.env.BRANCH_COUNT) }, (_, i) => ({
        name: `Sucursal ${i + 1}`,
        host: `${process.env.BRANCH_PREFIX}${i + 1}.ddns.net`,
        port: parseInt(process.env.BRANCH_PORT),
    })),
];

// Renderizar la página principal
exports.renderHome = (req, res) => {
    console.log('Sucursales generadas:', branches);
    res.render('index', { branches });
};

// Obtener datos de asistencia según rango de fechas
exports.fetchAttendance = async (req, res) => {
    const { branch, startDate, endDate } = req.body;

    console.log('Rango de fechas recibido:', { startDate, endDate });

    const selectedBranch = branches.find(b => b.name === branch);
    if (!selectedBranch) {
        console.error('Sucursal no encontrada:', branch);
        return res.status(400).send('Sucursal no encontrada');
    }

    const zkDevice = new ZKLib(selectedBranch.host, selectedBranch.port, 20000, 10000);

    try {
        console.log(`Intentando conectar con ${selectedBranch.name} (${selectedBranch.host}:${selectedBranch.port})...`);
        await zkDevice.createSocket();
        console.log(`Conexión establecida con ${selectedBranch.name}`);

        // Obtener datos de asistencia desde el dispositivo
        const attendanceData = await zkDevice.getAttendances();
        console.log('Datos obtenidos del dispositivo:', attendanceData.data);

        if (!attendanceData || !attendanceData.data || attendanceData.data.length === 0) {
            console.warn(`No se encontraron datos de asistencia para ${selectedBranch.name}`);
            return res.render('attendance', { branch: selectedBranch.name, data: [], startDate, endDate });
        }

        await zkDevice.disconnect();
        console.log(`Conexión cerrada con ${selectedBranch.name}`);

        // Invertir el orden de los datos para que los registros más recientes estén al principio
        const reversedData = attendanceData.data.reverse();
        console.log('Datos invertidos:', reversedData);

        // Filtrar datos por rango de fechas
        const filteredData = reversedData.filter(record => {
            const recordTime = new Date(record.recordTime);
            return recordTime >= new Date(startDate) && recordTime <= new Date(endDate);
        });

        console.log('Datos filtrados:', filteredData);

        // Renderizar los datos en la vista
        res.render('attendance', { branch: selectedBranch.name, data: filteredData, startDate, endDate });
    } catch (error) {
        console.error(`Error al conectar con ${selectedBranch.name}:`, error.message);
        res.status(500).send(`Error al conectar con ${selectedBranch.name}: ${error.message}`);
    }
};

exports.renderDocumentation = (req, res) => {
    res.render('documentation');
};

