// URL de tu API de Apps Script
// IMPORTANTE: Debes publicar tu Google Apps Script de nuevo después de agregar el código gs adjunto
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwvY7II9saRWBnbDbkBeDke9tXaB1Rn6r_g_SVOj7QvSUGoJoqxQGxiPC7bey6M2E_9Ow/exec';

document.addEventListener('DOMContentLoaded', () => {
    // Poner fecha actual
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-MX', dateOptions);

    // Cargar datos iniciales
    loadData();
});

// Función para obtener los datos desde Google Sheets
async function loadData() {
    const tableBody = document.getElementById('table-body');
    const btnRefresh = document.getElementById('btn-refresh');
    
    // Estado de carga
    btnRefresh.disabled = true;
    btnRefresh.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Cargando...';
    tableBody.innerHTML = `<tr><td colspan="8" class="loading-cell"><div class="spinner"></div><p>Sincronizando con Google Sheets...</p></td></tr>`;

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        renderTable(data);
        updateKPIs(data);
        showToast('Datos sincronizados correctamente', 'success');

    } catch (error) {
        console.error('Error fetching data:', error);
        tableBody.innerHTML = `<tr><td colspan="8" class="loading-cell" style="color: #e74c3c;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom:10px;"></i><p>Error al conectar con la base de datos.</p></td></tr>`;
        showToast('Error al conectar con el servidor', 'error');
    } finally {
        btnRefresh.disabled = false;
        btnRefresh.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    }
}

// Renderizar la tabla de datos
function renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No hay reservaciones registradas aún.</td></tr>`;
        return;
    }

    // Invertir para mostrar los más recientes primero
    const reversedData = [...data].reverse();

    reversedData.forEach(row => {
        // Formatear fechas
        const dateRegistro = new Date(row.id).toLocaleDateString('es-MX');
        
        // Colores de estatus
        let statusClass = 'status-pendiente';
        let estatusStr = row.estatus.toLowerCase();
        
        if (estatusStr.includes('confirmado')) statusClass = 'status-confirmado';
        else if (estatusStr.includes('cancelado')) statusClass = 'status-cancelado';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateRegistro}</td>
            <td><strong>${row.nombre}</strong></td>
            <td class="contact-info">
                <a href="https://wa.me/52${row.whatsapp.replace(/\D/g,'')}" target="_blank"><i class="fab fa-whatsapp"></i> ${row.whatsapp}</a>
                <a href="mailto:${row.correo}"><i class="fas fa-envelope"></i> ${row.correo}</a>
            </td>
            <td>${row.fecha_evento}</td>
            <td>${row.tipo}</td>
            <td><i class="fas fa-users" style="color: var(--primary);"></i> ${row.invitados}</td>
            <td><span class="status-badge ${statusClass}">${row.estatus}</span></td>
            <td>
                <select class="action-select" onchange="updateStatus('${row.id}', this.value, this)">
                    <option value="" disabled selected>Cambiar estado...</option>
                    <option value="Pendiente de Contacto">Marcar Pendiente</option>
                    <option value="Confirmado">Marcar Confirmado</option>
                    <option value="Cancelado">Marcar Cancelado</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Actualizar Tarjetas KPI
function updateKPIs(data) {
    document.getElementById('kpi-total').textContent = data.length;
    
    const pendientes = data.filter(r => r.estatus.toLowerCase().includes('pendiente')).length;
    document.getElementById('kpi-pendientes').textContent = pendientes;
    
    const confirmados = data.filter(r => r.estatus.toLowerCase().includes('confirmado')).length;
    document.getElementById('kpi-confirmados').textContent = confirmados;
}

// Función para actualizar el estado enviando POST a Apps Script
async function updateStatus(id, newStatus, selectElement) {
    if(!newStatus) return;
    
    // UI Loading
    selectElement.disabled = true;
    const originalBg = selectElement.style.backgroundColor;
    selectElement.style.backgroundColor = 'rgba(203, 160, 82, 0.2)';

    const payload = {
        action: 'updateStatus',
        id: id,
        newStatus: newStatus
    };

    try {
        // Enviar como text/plain para evitar el Preflight (OPTIONS) block de CORS en Google
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        showToast(`Estado actualizado a: ${newStatus}`, 'success');
        
        // Recargar datos para reflejar cambios
        setTimeout(loadData, 1000);
        
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error al actualizar el estado', 'error');
        selectElement.disabled = false;
        selectElement.style.backgroundColor = originalBg;
    }
}

// Sistema de Notificaciones
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast-message show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
