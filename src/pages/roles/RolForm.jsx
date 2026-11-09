import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import '../areas/AreaStyles.css';

const RolForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [nombre, setNombre] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  
  const [permisosList, setPermisosList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar todos los permisos disponibles
        const dataPermisos = await fetchApi('/permisos');
        setPermisosList(Array.isArray(dataPermisos) ? dataPermisos : (dataPermisos.data || dataPermisos.value || []));

        if (isEditing) {
          const dataRoles = await fetchApi('/roles');
          const roles = Array.isArray(dataRoles) ? dataRoles : (dataRoles.value || dataRoles.data || []);
          const role = roles.find(r => r.id === Number(id));
          if (role) {
            setNombre(role.nombre);
            if (role.permisos && Array.isArray(role.permisos)) {
              setPermisosSeleccionados(role.permisos.map(p => p.id));
            }
          } else {
            setError('Rol no encontrado');
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [id, isEditing]);

  const handleTogglePermiso = (permisoId) => {
    setPermisosSeleccionados(prev => 
      prev.includes(permisoId) ? prev.filter(id => id !== permisoId) : [...prev, permisoId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      nombre,
      permisosIds: permisosSeleccionados
    };

    try {
      if (isEditing) {
        await fetchApi(`/roles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/roles', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/roles');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-state">Cargando rol...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/roles" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}</h1>
            <p className="crud-subtitle">Define una nueva posición para el personal del centro.</p>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-group full-width">
            <label htmlFor="nombre">Nombre del Rol *</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Médico Especialista, Enfermera Auxiliar..."
              required
            />
          </div>

          <div className="form-group full-width" style={{ marginTop: '20px' }}>
            <label style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', display: 'block' }}>Permisos del Sistema</label>
            {permisosList.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>No hay permisos disponibles en el sistema.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {permisosList.map(permiso => (
                  <label key={permiso.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <input 
                      type="checkbox" 
                      checked={permisosSeleccionados.includes(permiso.id)} 
                      onChange={() => handleTogglePermiso(permiso.id)} 
                      style={{ marginTop: '4px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>{permiso.nombre}</div>
                      {permiso.descripcion && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{permiso.descripcion}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link to="/roles" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>Guardar Rol</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolForm;
