import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import ReasignarRolModal from './ReasignarRolModal';
import '../areas/AreaStyles.css';

const RolList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleToDelete, setRoleToDelete] = useState(null);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/roles');
      setRoles(Array.isArray(data) ? data : (data.value || data.data || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de intentar eliminar este rol?')) return;
    try {
      await fetchApi(`/roles/${id}`, { method: 'DELETE' });
      setRoles(roles.filter(r => r.id !== id));
    } catch (err) {
      const errorMsg = err.message || '';
      // Si el error es por personal asignado, abrimos el modal
      if (errorMsg.includes('asignado') || errorMsg.includes('uso') || errorMsg.includes('personal')) {
        const rol = roles.find(r => r.id === id);
        setRoleToDelete(rol);
      } else {
        alert(`Error al eliminar: ${errorMsg}`);
      }
    }
  };

  const handleReassignSuccess = async () => {
    // Si la reasignación fue exitosa, cerramos el modal y volvemos a intentar borrar el rol original
    const roleId = roleToDelete.id;
    setRoleToDelete(null);
    try {
      await fetchApi(`/roles/${roleId}`, { method: 'DELETE' });
      setRoles(roles.filter(r => r.id !== roleId));
      alert('Reasignación y eliminación completadas con éxito.');
    } catch (err) {
      alert(`Los roles se reasignaron, pero hubo un error al eliminar el rol: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Roles de Sistema</h1>
          <p className="crud-subtitle">Gestión de roles y permisos para el Personal de Salud.</p>
        </div>
        <Link to="/roles/create" className="btn-primary">
          <Plus size={18} />
          <span>Crear Rol</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Cargando roles...</div>
        ) : roles.length === 0 ? (
          <div className="empty-state">
            <Shield size={48} className="empty-icon" />
            <h3>No hay roles creados</h3>
            <p>Registra el primer rol (ej. Médico, Enfermera).</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Rol</th>
                <th className="actions-col" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td className="id-cell">#{r.id}</td>
                  <td className="fw-500">{r.nombre}</td>
                  <td className="actions-cell" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <Link to={`/roles/edit/${r.id}`} className="action-btn edit" title="Editar">
                      <Edit2 size={16} />
                    </Link>
                    {r.nombre !== 'Administrador' && (
                      <button onClick={() => handleDelete(r.id)} className="action-btn delete" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {roleToDelete && (
        <ReasignarRolModal
          roleToDelete={roleToDelete}
          allRoles={roles}
          onClose={() => setRoleToDelete(null)}
          onSuccess={handleReassignSuccess}
        />
      )}
    </div>
  );
};

export default RolList;
