/**
 * API Service for Department Student Information System
 * Handles cookies, JSON requests, and file uploads with automatic proxy failover
 * and Bearer token synchronization for cross-domain Vercel -> Render deployments.
 */

const API_HOST = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
const BASE_URL = `${API_HOST}/api`;

/**
 * Robust fetch wrapper:
 * 1. Attaches Bearer token from localStorage (essential for cross-origin deployments if 3rd-party cookies are restricted)
 * 2. Attempts relative URL via Vite proxy or direct base URL
 * 3. In local development, if proxy is disconnected, falls back to direct port 5000.
 */
const apiFetch = async (url, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const finalOptions = {
    ...options,
    headers,
    credentials: options.credentials || 'include'
  };

  try {
    return await fetch(url, finalOptions);
  } catch (err) {
    const method = (options.method || 'GET').toUpperCase();
    // Only safely retry idempotent GET requests in local dev to prevent duplicate uploads or inserts
    if (!API_HOST && method === 'GET' && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      const cleanPath = url.startsWith('/') ? url : '/' + url;
      const directTarget = `http://127.0.0.1:5000${cleanPath}`;
      console.warn(`[API Proxy Failover] Request to ${url} failed (${err.message}). Retrying directly at ${directTarget}...`);
      try {
        return await fetch(directTarget, finalOptions);
      } catch (directErr) {
        const localhostTarget = `http://localhost:5000${cleanPath}`;
        return await fetch(localhostTarget, finalOptions);
      }
    }
    throw err;
  }
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.errors = data.errors;
    error.status = response.status;
    throw error;
  }
  return data;
};

/**
 * Helper to construct full authenticated URLs for photos, uploaded documents, and files.
 * Supports cross-domain Vercel frontend -> Render backend, with Bearer token authentication fallback.
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:') || filePath.startsWith('blob:')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const base = API_HOST || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    const separator = cleanPath.includes('?') ? '&' : '?';
    return `${base}${cleanPath}${separator}token=${encodeURIComponent(token)}`;
  }
  return `${base}${cleanPath}`;
};

export const api = {
  // Auth
  async loginStudent(registerNo, password) {
    const res = await apiFetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ registerNo, password })
    });
    const data = await handleResponse(res);
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async loginAdmin(username, password) {
    const res = await apiFetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(res);
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async logout() {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;

      const res = await apiFetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);
      return await handleResponse(res);
    } catch (e) {
      return { success: true };
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  },

  async getCurrentUser() {
    try {
      const res = await apiFetch(`${BASE_URL}/auth/me`, {
        credentials: 'include'
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      throw err;
    }
  },

  // Student Profile
  async getStudentProfile(id = null) {
    const url = id ? `${BASE_URL}/student/profile/${id}` : `${BASE_URL}/student/profile`;
    const res = await apiFetch(url, { credentials: 'include' });
    return handleResponse(res);
  },

  async updateStudentProfile(data, id = null) {
    const url = id ? `${BASE_URL}/student/update/${id}` : `${BASE_URL}/student/update`;
    const res = await apiFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async submitStudentProfile(declarationAccepted, id = null) {
    const url = id ? `${BASE_URL}/student/submit/${id}` : `${BASE_URL}/student/submit`;
    const res = await apiFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ declarationAccepted })
    });
    return handleResponse(res);
  },

  async uploadDocument(file, docType, studentId = null) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);

    const url = studentId 
      ? `${BASE_URL}/student/documents/upload/${studentId}` 
      : `${BASE_URL}/student/documents/upload`;

    const res = await apiFetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    return handleResponse(res);
  },

  async deleteDocument(docId, studentId = null) {
    const url = studentId 
      ? `${BASE_URL}/student/documents/${docId}/${studentId}` 
      : `${BASE_URL}/student/documents/${docId}`;
    const res = await apiFetch(url, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(res);
  },

  // Admin Endpoints
  async getDashboardStats() {
    const res = await apiFetch(`${BASE_URL}/admin/dashboard-stats`, { credentials: 'include' });
    return handleResponse(res);
  },

  async getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await apiFetch(`${BASE_URL}/admin/students?${query}`, { credentials: 'include' });
    return handleResponse(res);
  },

  async addStudent(data) {
    const res = await apiFetch(`${BASE_URL}/admin/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async bulkImportStudents(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`${BASE_URL}/admin/students/bulk-import`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    return handleResponse(res);
  },

  async toggleLock(studentId, lock) {
    const res = await apiFetch(`${BASE_URL}/admin/students/${studentId}/lock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ lock })
    });
    return handleResponse(res);
  },

  async resetPassword(studentId) {
    const res = await apiFetch(`${BASE_URL}/admin/students/${studentId}/reset-password`, {
      method: 'POST',
      credentials: 'include'
    });
    return handleResponse(res);
  },

  async updateStudentStatus(studentId, status, rejectionReason = '') {
    const res = await apiFetch(`${BASE_URL}/admin/students/${studentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, rejectionReason })
    });
    return handleResponse(res);
  },

  async deleteStudent(studentId) {
    const res = await apiFetch(`${BASE_URL}/admin/students/${studentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(res);
  },

  async getAuditLogs(page = 1) {
    const res = await apiFetch(`${BASE_URL}/admin/audit-logs?page=${page}`, { credentials: 'include' });
    return handleResponse(res);
  },

  // Authenticated File Downloads (Fixes 401 Unauthorized in window.open)
  async downloadExcel(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await apiFetch(`${BASE_URL}/export/excel?${query}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Excel export failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AAMEC_AIDS_Student_Register_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },

  async downloadPdf(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await apiFetch(`${BASE_URL}/export/pdf?${query}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `PDF export failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AAMEC_AIDS_Official_Register_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },

  // Export URLs (legacy string references)
  getExcelExportUrl(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${BASE_URL}/export/excel?${query}${tokenParam}`;
  },

  getPdfExportUrl(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${BASE_URL}/export/pdf?${query}${tokenParam}`;
  }
};
