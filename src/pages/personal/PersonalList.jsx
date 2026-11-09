import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Stethoscope, Plus, Power } from 'lucide-react';
import '../areas/AreaStyles.css';

const PersonalList = () => {
  const [personal, setPersonal] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredPersonal = personal.filter(p => {
    const q = searchTerm.toLowerCase();
    const name = p.persona ? `${p.persona.primerNombre} ${p.persona.primerApellido}`.toLowerCase() : '';
    const rol = p.rol?.nombre?.toLowerCase() || '';
    const colegiado = p.codigoColegiado?.toLowerCase() || '';
    return name.includes(q) || rol.includes(q) || colegiado.includes(q);
  });

  const loadPersonal = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/health-staff');
      setPersonal(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonal();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} a este miembro del personal?`)) return;
    try {
      await fetchApi(`/health-staff/${id}/toggle-status`, { method: 'PUT' });
      setPersonal(personal.map(p => p.id === id ? { ...p, activo: !p.activo } : p));
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Personal de Salud</h1>
          <p className="crud-subtitle">Doctores y enfermeros asignados a las diferentes Áreas de Salud.</p>
        </div>
        <Link to="/personal/create" className="btn-primary">
          <Plus size={18} />
          <span>Promover a Personal</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, rol o colegiado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : filteredPersonal.length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={48} className="empty-icon" />
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otra búsqueda o promueve a una persona para convertirla en personal de salud.</p>
          </div>
        ) : (
          <table className="modern-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Profesional</th>
                <th>Rol</th>
                <th>Área de Salud</th>
                <th>Colegiado</th>
                <th>Estado</th>
                <th className="actions-col" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonal.map(p => {
                const nombreCompleto = p.persona ? `${p.persona.primerNombre} ${p.persona.primerApellido}` : 'Desconocido';
                const isActivo = p.activo !== false; // Si es null/undefined se asume true
                
                return (
                  <tr key={p.id}>
                    <td className="id-cell">#{p.id}</td>
                    <td className="fw-500">{nombreCompleto}</td>
                    <td>{p.rol?.nombre || '-'}</td>
                    <td>{p.areaSalud?.nombre || '-'}</td>
                    <td>{p.codigoColegiado || '-'}</td>
                    <td>
                      <span className={`badge ${isActivo ? 'bg-success' : 'bg-danger'}`} style={{ 
                        backgroundColor: isActivo ? '#dcfce7' : '#fee2e2',
                        color: isActivo ? '#166534' : '#991b1b',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
                      }}>
                        {isActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="actions-cell" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <Link to={`/personal/edit/${p.id}`} className="action-btn edit" title="Editar">
                        <Edit2 size={16} />
                      </Link>
                      <button 
                        onClick={() => handleToggleStatus(p.id, isActivo)} 
                        className={`action-btn ${isActivo ? 'delete' : 'edit'}`} 
                        title={isActivo ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={16} color={isActivo ? '#ef4444' : '#10b981'} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PersonalList;
