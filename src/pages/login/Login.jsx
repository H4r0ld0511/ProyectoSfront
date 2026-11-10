import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/auth/AuthContext';
import { API_BASE } from '../../services/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempData, setTempData] = useState(null);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      if (data.user?.debeCambiarPassword) {
        setTempData(data);
        setMustChangePassword(true);
      } else {
        login(data.user, data.token, data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempData.token}`
        },
        body: JSON.stringify({ currentPassword: password, newPassword: newPassword }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Error al cambiar contraseña');
      
      const updatedUser = { ...tempData.user, debeCambiarPassword: false };
      login(updatedUser, tempData.token, tempData.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-placeholder">
            <div className="logo-circle"></div>
          </div>
          <h1>Bienvenido a SCCVI</h1>
          <p>Ingresa a tu cuenta para continuar</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!mustChangePassword ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Correo Electrónico</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="forgot-password">
                <a href="#">¿Olvidaste tu contraseña?</a>
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="spinner" size={20} />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="arrow-icon" size={20} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="login-form">
            <div style={{background: '#fef2f2', padding: '16px', borderRadius: '8px', marginBottom: '20px', color: '#b91c1c', border: '1px solid #fecaca'}}>
              <strong>Cambio de Seguridad Requerido</strong><br/>
              Por motivos de seguridad, debes establecer una nueva contraseña antes de entrar al sistema por primera vez.
            </div>

            <div className="input-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="spinner" size={20} />
              ) : (
                <>
                  Actualizar y Entrar
                  <ArrowRight className="arrow-icon" size={20} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
      
      <div className="login-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
    </div>
  );
};

export default Login;
