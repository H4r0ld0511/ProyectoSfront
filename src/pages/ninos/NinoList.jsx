import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Baby, Plus, Eye, Power } from 'lucide-react';
import '../areas/AreaStyles.css';

const NinoList = () => {
  const [ninos, setNinos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredNinos = ninos.filter(n => {
    const q = searchTerm.toLowerCase();
    const name = n.persona ? `${n.persona.primerNombre} ${n.persona.primerApellido}`.toLowerCase() : '';
    const cui = n.persona?.dpiCui?.toLowerCase() || '';
    const tutorName = n.tutores && n.tutores.length > 0 ? `${n.tutores[0].persona?.primerNombre} ${n.tutores[0].persona?.primerApellido}`.toLowerCase() : '';
    return name.includes(q) || cui.includes(q) || tutorName.includes(q);
  });

  const loadNinos = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/children');
      setNinos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNinos();
  }, []);

  const handleToggleStatus = async (personaId, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} a este paciente?`)) return;
    
    try {
      await fetchApi(`/persons/${personaId}/toggle-status`, { method: 'PUT' });
      setNinos(ninos.map(n => {
        if (n.personaId === personaId) {
          return { ...n, persona: { ...n.persona, activo: !n.persona.activo } };
        }
        return n;
      }));
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Niños (Pacientes)</h1>
          <p className="crud-subtitle">Gestión de pacientes pediátricos y sus tutores.</p>
        </div>
        <Link to="/ninos/create" className="btn-primary">
          <Plus size={18} />
          <span>Registrar Niño</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar por CUI, nombre o tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : filteredNinos.length === 0 ? (
          <div className="empty-state">
            <Baby size={48} className="empty-icon" />
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otra búsqueda o registra a un paciente pediátrico nuevo.</p>
          </div>
        ) : (
          <table className="modern-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>CUI</th>
                <th>Nombre Completo</th>
                <th>Tutor Principal</th>
                <th>Estado</th>
                <th className="actions-col" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredNinos.map(n => {
                const isActivo = n.persona?.activo !== false;
                
                return (
                  <tr key={n.personaId}>
                    <td>{n.persona?.dpiCui || 'N/A'}</td>
                    <td className="fw-500">
                      {n.persona?.primerNombre} {n.persona?.primerApellido}
                    </td>
                    <td>
                      {n.tutores && n.tutores.length > 0 ? (
                        <div>
                          {n.tutores[0].persona?.primerNombre} {n.tutores[0].persona?.primerApellido}
                        </div>
                      ) : (
                        <span className="text-muted">Sin asignar</span>
                      )}
                    </td>
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
                      <Link to={`/ninos/profile/${n.personaId}`} className="action-btn" title="Ver Expediente" style={{color: '#3b82f6', background: '#eff6ff'}}>
                        <Eye size={16} />
                      </Link>
                      <Link to={`/ninos/edit/${n.personaId}`} className="action-btn edit" title="Editar">
                        <Edit2 size={16} />
                      </Link>
                      <button 
                        onClick={() => handleToggleStatus(n.personaId, isActivo)} 
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

export default NinoList;
