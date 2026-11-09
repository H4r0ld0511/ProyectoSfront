import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Trash2, Syringe, Plus } from 'lucide-react';
import '../areas/AreaStyles.css';

const VacunaList = () => {
  const [vacunas, setVacunas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVacunas = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/vaccines');
      // Asegurar que es un array si el backend devuelve un objeto envoltorio
      setVacunas(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacunas();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta vacuna del catálogo general?')) return;
    
    try {
      await fetchApi(`/vaccines/${id}`, { method: 'DELETE' });
      setVacunas(vacunas.filter(v => v.id !== id));
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Catálogo de Vacunas</h1>
          <p className="crud-subtitle">Gestión de vacunas del esquema nacional de inmunizaciones.</p>
        </div>
        <Link to="/vacunas/create" className="btn-primary">
          <Plus size={18} />
          <span>Nueva Vacuna</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar vacuna por nombre o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : vacunas.length === 0 && !searchTerm ? (
          <div className="empty-state">
            <Syringe size={48} className="empty-icon" />
            <h3>Catálogo Vacío</h3>
            <p>Comienza a registrar las vacunas disponibles.</p>
          </div>
        ) : (
          <table className="modern-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Edad Rec. (Meses)</th>
                <th>Dosis #</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vacunas.filter(v => 
                !searchTerm || 
                v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                v.id.toString().includes(searchTerm)
              ).length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">No se encontraron resultados para la búsqueda.</td>
                </tr>
              ) : (
                vacunas.filter(v => 
                  !searchTerm || 
                  v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  v.id.toString().includes(searchTerm)
                ).map(v => (
                  <tr key={v.id}>
                    <td className="id-cell">#{v.id}</td>
                    <td className="fw-500">{v.nombre}</td>
                    <td>{v.edadRecomendadaMeses} meses</td>
                    <td>Dosis {v.dosisNumero}</td>
                    <td className="actions-cell">
                      <Link to={`/vacunas/edit/${v.id}`} className="action-btn edit" title="Editar">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(v.id)} className="action-btn delete" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
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

export default VacunaList;
