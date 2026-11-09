const API_URL = 'http://localhost:3000/api/growth';

// Helper for making API calls with Auth Token
export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('sccvi_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
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
          const refreshRes = await fetch('http://localhost:3000/api/auth/refresh', {
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
            const retryRes = await fetch(`${API_URL}${endpoint}`, newOptions);
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
