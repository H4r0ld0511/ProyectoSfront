import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const token = localStorage.getItem('sccvi_token');
    const storedUser = localStorage.getItem('sccvi_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setupInactivityTimer();
      } catch {
        // Usuario guardado corrupto: limpiar sesión para forzar nuevo login
        localStorage.removeItem('sccvi_token');
        localStorage.removeItem('sccvi_refresh_token');
        localStorage.removeItem('sccvi_user');
      }
    }
    setLoading(false);

    // Cleanup timer on unmount
    return () => clearInactivityTimer();
  }, []);

  let inactivityTimer;
  
  const setupInactivityTimer = () => {
    clearInactivityTimer();
    // 30 minutos (30 * 60 * 1000)
    inactivityTimer = setTimeout(() => {
      logout();
      window.location.href = '/login?reason=timeout';
    }, 30 * 60 * 1000);
  };

  const clearInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
  };

  // Reset timer on user interaction
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetTimer = () => {
      if (user) setupInactivityTimer();
    };

    events.forEach(event => document.addEventListener(event, resetTimer));
    return () => events.forEach(event => document.removeEventListener(event, resetTimer));
  }, [user]);

  const login = (userData, token, refreshToken) => {
    setUser(userData);
    localStorage.setItem('sccvi_token', token);
    if (refreshToken) {
      localStorage.setItem('sccvi_refresh_token', refreshToken);
    }
    localStorage.setItem('sccvi_user', JSON.stringify(userData));
    setupInactivityTimer();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sccvi_token');
    localStorage.removeItem('sccvi_refresh_token');
    localStorage.removeItem('sccvi_user');
    clearInactivityTimer();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
