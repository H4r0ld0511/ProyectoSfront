// Base de la API: usa VITE_API_URL o, en su defecto, la ruta relativa '/api'
// (en producción Nginx hace de reverse proxy hacia el backend).
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

// Endpoints que pertenecen al módulo de crecimiento (backend: /growth/records, /growth/child/...).
// Cualquier otro endpoint (/health-areas, /communities, /persons, /roles, ...) cuelga directo de /api.
const GROWTH_ENDPOINTS = ['/records', '/child'];

const buildUrl = (endpoint) => {
  const isGrowth = GROWTH_ENDPOINTS.some(
    (p) => endpoint === p || endpoint.startsWith(`${p}/`) || endpoint.startsWith(`${p}?`)
  );
  return `${API_BASE}${isGrowth ? '/growth' : ''}${endpoint}`;
};

// Helper for making API calls with Auth Token
export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('sccvi_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('sccvi_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            localStorage.setItem('sccvi_token', refreshData.token);
            localStorage.setItem('sccvi_refresh_token', refreshData.refreshToken);
            
            // Reintentar la petición original con el nuevo token
            const newOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${refreshData.token}`
                }
            };
            const retryRes = await fetch(buildUrl(endpoint), newOptions);
            const retryData = await retryRes.json().catch(() => ({}));
            
            if (!retryRes.ok) {
                throw new Error(retryData.error || retryData.message || 'Error en la solicitud.');
            }
            return retryData;
          }
        } catch (error) {
          console.error('Error al intentar refrescar el token:', error);
        }
      }

      // Si falla el refresh o no hay refresh token, cerramos sesión
      localStorage.removeItem('sccvi_token');
      localStorage.removeItem('sccvi_refresh_token');
      localStorage.removeItem('sccvi_user');
      window.location.href = '/login?reason=expired';
    }
    throw new Error(data.error || data.message || 'Ocurrió un error en la solicitud.');
  }

  return data;
};
