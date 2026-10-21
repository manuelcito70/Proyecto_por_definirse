import { fetchWithAuth, getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper para convertir objeto de query params a string
const toQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

// ============================================
// EXPEDIDOS (Oficios salientes)
// ============================================
export const getExpedidos = async (params = {}) => {
  const res = await fetchWithAuth(`/expedidos${toQueryString(params)}`);
  if (!res.ok) throw new Error('Error al obtener documentos expedidos');
  return res.json();
};

export const getNextExpedidoNumber = async (gestion) => {
  const res = await fetchWithAuth(`/expedidos/next-number${toQueryString({ gestion })}`);
  if (!res.ok) throw new Error('Error al obtener siguiente número');
  return res.json();
};

export const createExpedido = async (formData) => {
  const res = await fetchWithAuth('/expedidos', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensaje || 'Error al registrar oficio expedido');
  }
  return res.json();
};

export const updateExpedido = async (id, data) => {
  const res = await fetchWithAuth(`/expedidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar oficio expedido');
  return res.json();
};

export const deleteExpedido = async (id) => {
  const res = await fetchWithAuth(`/expedidos/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar oficio expedido');
  return res.json();
};

// ============================================
// RECIBIDOS (Documentación entrante)
// ============================================
export const getRecibidos = async (params = {}) => {
  const res = await fetchWithAuth(`/recibidos${toQueryString(params)}`);
  if (!res.ok) throw new Error('Error al obtener documentos recibidos');
  return res.json();
};

export const createRecibido = async (formData) => {
  const res = await fetchWithAuth('/recibidos', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensaje || 'Error al registrar documento recibido');
  }
  return res.json();
};

export const updateRecibido = async (id, data) => {
  const res = await fetchWithAuth(`/recibidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar documento recibido');
  return res.json();
};

export const deleteRecibido = async (id) => {
  const res = await fetchWithAuth(`/recibidos/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar documento recibido');
  return res.json();
};

// ============================================
// ACTAS DE GRADUACIÓN
// ============================================
export const getActas = async (params = {}) => {
  const res = await fetchWithAuth(`/actas${toQueryString(params)}`);
  if (!res.ok) throw new Error('Error al obtener actas de graduación');
  return res.json();
};

export const createActa = async (formData) => {
  const res = await fetchWithAuth('/actas', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensaje || 'Error al registrar acta de graduación');
  }
  return res.json();
};

export const updateActa = async (id, data) => {
  const res = await fetchWithAuth(`/actas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar acta');
  return res.json();
};

export const deleteActa = async (id) => {
  const res = await fetchWithAuth(`/actas/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar acta');
  return res.json();
};

// ============================================
// AUXILIARES DE CÁTEDRA
// ============================================
export const getAuxiliares = async (params = {}) => {
  const res = await fetchWithAuth(`/auxiliares${toQueryString(params)}`);
  if (!res.ok) throw new Error('Error al obtener auxiliares');
  return res.json();
};

export const createAuxiliar = async (data) => {
  const res = await fetchWithAuth('/auxiliares', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensaje || 'Error al registrar auxiliar');
  }
  return res.json();
};

export const updateAuxiliar = async (id, data) => {
  const res = await fetchWithAuth(`/auxiliares/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar auxiliar');
  return res.json();
};

export const deleteAuxiliar = async (id) => {
  const res = await fetchWithAuth(`/auxiliares/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar auxiliar');
  return res.json();
};

// ============================================
// DOCENTES Y EXPEDIENTES
// ============================================
export const getDocentes = async (params = {}) => {
  const res = await fetchWithAuth(`/docentes${toQueryString(params)}`);
  if (!res.ok) throw new Error('Error al obtener docentes');
  return res.json();
};

export const createDocente = async (data) => {
  const res = await fetchWithAuth('/docentes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensaje || 'Error al registrar docente');
  }
  return res.json();
};

export const getDocenteArchivos = async (docenteId, params = {}) => {
  const res = await fetchWithAuth(`/docentes/${docenteId}/archivos${toQueryString(params)}`);
  if (!res.ok) throw new Error('Error al obtener archivos del docente');
  return res.json();
};

export const uploadDocenteArchivo = async (docenteId, formData) => {
  const res = await fetchWithAuth(`/docentes/${docenteId}/archivos`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensaje || 'Error al subir archivo');
  }
  return res.json();
};

export const deleteDocenteArchivo = async (docenteId, archivoId) => {
  const res = await fetchWithAuth(`/docentes/${docenteId}/archivos/${archivoId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar archivo');
  return res.json();
};

// Helper para descargar o abrir archivos de forma segura con Authorization Header
export const downloadFile = async (pathWithId, fallbackName = 'documento.pdf', forceDownload = false) => {
  try {
    const res = await fetchWithAuth(pathWithId);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || 'Error al obtener el archivo');
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Si se especifica descargar explícitamente, forzar descarga al disco local
    if (forceDownload) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // Si es visualización y es documento o imagen, abrir en pestaña nueva
      const mime = blob.type || '';
      if (mime.includes('pdf') || mime.includes('image') || mime.includes('jpeg') || mime.includes('png')) {
        window.open(blobUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fallbackName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    }
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    alert('No se pudo procesar el archivo: ' + err.message);
  }
};

// Helper para obtener el Blob del archivo con autenticación
export const getFileBlob = async (pathWithId) => {
  const res = await fetchWithAuth(pathWithId);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensaje || 'Error al obtener el archivo del servidor');
  }
  return await res.blob();
};

// Helper para obtener URL de descarga directa con token (fallback)
export const getDownloadUrl = (pathWithId) => {
  const token = getToken();
  return `${API_BASE}${pathWithId}?token=${encodeURIComponent(token || '')}`;
};

