/**
 * Archivo: codigo.gs (Google Apps Script)
 * SECCIÓN BACKEND Y ADMIN PANEL
 */

const NOMBRE_HOJA = 'Reservaciones'; 

// 1. FUNCIÓN POST: Recibe datos nuevos desde la página web O actualizaciones desde el Panel Admin
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(NOMBRE_HOJA);
    
    // Validar si la petición es para ACTUALIZAR un estado (Desde el Admin Panel)
    if (data.action === 'updateStatus') {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      
      for (var i = 1; i < values.length; i++) {
        // Buscar la fila que coincida con el ID (que es el timestamp de creación)
        if (values[i][0].toString() === data.id.toString()) {
          // La columna I (índice 9) es la del Estatus
          sheet.getRange(i + 1, 9).setValue(data.newStatus);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Estado actualizado" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ---------------------------------------------------------
    // Si no es updateStatus, es un NUEVO REGISTRO (Desde la Landing Page)
    if (!sheet) {
      sheet = spreadsheet.insertSheet(NOMBRE_HOJA);
      sheet.appendRow(["ID_Fecha", "Nombre", "WhatsApp", "Correo", "Fecha Evento", "Tipo de Evento", "Invitados", "Comentarios", "Estatus del Prospecto"]);
      var range = sheet.getRange("A1:I1");
      range.setFontWeight("bold").setBackground("#cba052").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    // Usamos el formato ISO de fecha como ID único exacto
    var timestamp = new Date().toISOString();
    
    sheet.appendRow([
      timestamp, // ID_Fecha
      data.nombre || '',
      data.telefono || '',
      data.correo || '',
      data.fecha || '',
      data.tipo_evento || '',
      data.invitados || '',
      data.comentarios || '',
      "Pendiente de Contacto" 
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" })).setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}


// 2. FUNCIÓN GET: Envía los datos de la hoja de cálculo al Panel de Administración para leerlos
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
    
    // Si la hoja no existe o está vacía, devuelve un array vacío
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    // Empezamos desde i=1 para saltar los encabezados
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === "") continue; // Saltar filas vacías
      
      result.push({
        id: data[i][0], // El ID exacto
        nombre: data[i][1],
        whatsapp: data[i][2],
        correo: data[i][3],
        fecha_evento: data[i][4],
        tipo: data[i][5],
        invitados: data[i][6],
        comentarios: data[i][7],
        estatus: data[i][8]
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
