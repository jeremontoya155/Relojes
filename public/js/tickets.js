document.addEventListener('DOMContentLoaded', () => {
    const sucursalFilter = document.getElementById('filter-sucursal');
    const horaFilter = document.getElementById('filter-hora');
    const ticketsTable = document.getElementById('tickets-table');

    const fetchFilteredData = async () => {
        const sucursal = sucursalFilter.value;
        const hora = horaFilter.value;

        const query = new URLSearchParams();
        if (sucursal) query.append('sucursal', sucursal);
        if (hora) query.append('hora', hora);

        try {
            const response = await fetch(`/tickets?${query.toString()}`);
            if (!response.ok) {
                throw new Error(`Error al cargar los datos: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                renderTable(result.data);
            } else {
                throw new Error('No se pudieron obtener los datos.');
            }
        } catch (error) {
            console.error(error.message);
            ticketsTable.innerHTML = `<tr><td colspan="4">Error al cargar los datos. Inténtalo nuevamente.</td></tr>`;
        }
    };

    const renderTable = (data) => {
        ticketsTable.innerHTML = '';
        if (data.length === 0) {
            ticketsTable.innerHTML = '<tr><td colspan="4">No se encontraron resultados para los filtros seleccionados.</td></tr>';
            return;
        }
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.Sucursal}</td>
                <td>${row.Mes}</td>
                <td>${row.Hora}:00</td>
                <td>${row.TotalTickets}</td>
            `;
            ticketsTable.appendChild(tr);
        });
    };

    // Escuchar cambios en los filtros y ejecutar búsqueda
    sucursalFilter.addEventListener('change', fetchFilteredData);
    horaFilter.addEventListener('change', fetchFilteredData);

    // Cargar datos iniciales
    fetchFilteredData();
});
