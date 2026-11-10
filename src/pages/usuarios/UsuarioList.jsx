import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Plus, Edit, Trash2, Search, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import '../areas/AreaStyles.css';

const UsuarioList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/users');
      setUsuarios(Array.isArray(data) ? data : (data.data || []));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de desactivar (revocar acceso) a este usuario?')) {
      try {
        await fetchApi(`/users/${id}`, { method: 'DELETE' });
        loadUsuarios(); // Recargar la lista
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.personalSalud?.persona?.primerNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Cuentas de Usuario</h1>
          <p className="crud-subtitle">Gestiona los accesos (correo y contraseña) del personal de salud.</p>
        </div>
        <Link to="/usuarios/create" className="btn-primary">
          <Plus size={20} />
          <span>Nuevo Usuario</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={24} />
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <table className="modern-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Personal Asignado</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="actions-column">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">No se encontraron usuarios.</td>
                </tr>
              ) : (
                filteredUsuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{fontWeight: 500, color: '#0f172a'}}>{u.email}</div>
                    </td>
                    <td>
                      {u.personalSalud ? (
                        <span>
                          {u.personalSalud.persona?.primerNombre} {u.personalSalud.persona?.primerApellido}
                        </span>
                      ) : (
                        <span style={{color: '#94a3b8'}}>- Sin Asignar -</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {u.personalSalud?.rol?.nombre || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {u.activo ? (
                        <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981'}}>
                          <ShieldCheck size={16}/> Activo
                        </span>
                      ) : (
                        <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444'}}>
                          <XCircle size={16}/> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <Link to={`/usuarios/edit/${u.id}`} className="action-btn edit" title="Editar">
                        <Edit size={18} />
                      </Link>
                      {u.activo && (
                        <button onClick={() => handleDelete(u.id)} className="action-btn delete" title="Desactivar Acceso">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsuarioList;
