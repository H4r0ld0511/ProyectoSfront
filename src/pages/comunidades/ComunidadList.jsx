import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Trash2, Plus, Users } from 'lucide-react';
import '../areas/AreaStyles.css';

const ComunidadList = () => {
  const [comunidades, setComunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadComunidades = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/communities');
      setComunidades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComunidades();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta Comunidad?')) return;
    
    try {
      await fetchApi(`/communities/${id}`, { method: 'DELETE' });
      setComunidades(comunidades.filter(c => c.id !== id));
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Comunidades</h1>
          <p className="crud-subtitle">Gestiona las comunidades y aldeas asignadas a las Áreas de Salud.</p>
        </div>
        <Link to="/comunidades/create" className="btn-primary">
          <Plus size={18} />
          <span>Nueva Comunidad</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : comunidades.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No hay comunidades registradas</h3>
            <p>Comienza creando tu primera Comunidad.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Familias Est.</th>
                <th>Área de Salud</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comunidades.map(comunidad => (
                <tr key={comunidad.id}>
                  <td className="id-cell">#{comunidad.id}</td>
                  <td className="fw-500">{comunidad.nombre}</td>
                  <td>{comunidad.numeroEstimadoFamilias || 0}</td>
                  <td>{comunidad.areaSalud?.nombre || 'Sin asignar'}</td>
                  <td className="actions-cell">
                    <Link to={`/comunidades/edit/${comunidad.id}`} className="action-btn edit" title="Editar">
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => handleDelete(comunidad.id)} className="action-btn delete" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ComunidadList;
