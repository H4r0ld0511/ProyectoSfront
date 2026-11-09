import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2, KeyRound } from 'lucide-react';
import '../areas/AreaStyles.css';

const UsuarioForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [personalList, setPersonalList] = useState([]);
  
  const [formData, setFormData] = useState({
    personalSaludId: '',
    email: '',
    password: '',
    activo: true
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar personal de salud disponible
    const loadPersonal = async () => {
      try {
        const data = await fetchApi('/health-staff');
        setPersonalList(Array.isArray(data) ? data : (data.data || []));
      } catch (err) {
        console.error("Error cargando personal", err);
      }
    };
    loadPersonal();

    if (isEditing) {
      const loadUsuario = async () => {
        try {
          const data = await fetchApi(`/users/${id}`);
          setFormData({
            personalSaludId: data.personalSaludId || '',
            email: data.email || '',
            password: '', // Por seguridad no se carga
            activo: data.activo !== undefined ? data.activo : true
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadUsuario();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isEditing && !formData.password) {
      setError('La contraseña es obligatoria para nuevos usuarios.');
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      personalSaludId: formData.personalSaludId ? Number(formData.personalSaludId) : null
    };

    // Si está editando y no mandó password, lo removemos para no sobreescribir con vacío
    if (isEditing && !payload.password) {
      delete payload.password;
    }

    try {
      if (isEditing) {
        await fetchApi(`/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/usuarios');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-state">Cargando datos...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/usuarios" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Usuario' : 'Crear Acceso de Usuario'}</h1>
            <p className="crud-subtitle">Asigna credenciales a un miembro del personal de salud.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="personalSaludId">Miembro del Personal de Salud *</label>
              <select 
                id="personalSaludId" 
                name="personalSaludId" 
                value={formData.personalSaludId} 
                onChange={handleChange} 
                required 
                disabled={isEditing}
              >
                <option value="">-- Seleccionar --</option>
                {personalList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.persona?.primerNombre} {p.persona?.primerApellido} ({p.rol?.nombre})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico (Login) *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="usuario@sccvi.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                Contraseña {isEditing && <small style={{fontWeight: 'normal'}}>(Dejar en blanco para mantener actual)</small>}
                {!isEditing && '*'}
              </label>
              <div style={{position: 'relative'}}>
                <KeyRound size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}}/>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEditing}
                  placeholder="••••••••"
                  style={{paddingLeft: '40px'}}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="form-row">
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: formData.activo ? '#ecfdf5' : '#fef2f2', border: `1px solid ${formData.activo ? '#10b981' : '#ef4444'}`, borderRadius: '8px'}}>
                <input 
                  type="checkbox" 
                  name="activo" 
                  checked={formData.activo} 
                  onChange={handleChange} 
                />
                <span style={{fontWeight: 500, color: formData.activo ? '#065f46' : '#991b1b'}}>
                  {formData.activo ? 'La cuenta está ACTIVA y puede iniciar sesión.' : 'La cuenta está SUSPENDIDA.'}
                </span>
              </label>
            </div>
          )}

          <div className="form-actions">
            <Link to="/usuarios" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioForm;
