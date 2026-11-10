import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Trash2, Plus, MapPin } from 'lucide-react';
import './AreaStyles.css'; // Reutilizaremos un css base

const AreaList = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAreas = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/health-areas');
      setAreas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta Área de Salud?')) return;
    
    try {
      await fetchApi(`/health-areas/${id}`, { method: 'DELETE' });
      setAreas(areas.filter(area => area.id !== id));
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Áreas de Salud</h1>
          <p className="crud-subtitle">Gestiona los distritos y centros de salud del sistema.</p>
        </div>
        <Link to="/areas/create" className="btn-primary">
          <Plus size={18} />
          <span>Nueva Área</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : areas.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} className="empty-icon" />
            <h3>No hay áreas registradas</h3>
            <p>Comienza creando tu primera Área de Salud.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Área</th>
                <th>Departamento</th>
                <th>Municipio</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {areas.map(area => (
                <tr key={area.id}>
                  <td className="id-cell">#{area.id}</td>
                  <td className="fw-500">{area.nombre}</td>
                  <td>{area.departamento || '-'}</td>
                  <td>{area.municipio || '-'}</td>
                  <td className="actions-cell">
                    <Link to={`/areas/edit/${area.id}`} className="action-btn edit" title="Editar">
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => handleDelete(area.id)} className="action-btn delete" title="Eliminar">
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

export default AreaList;
