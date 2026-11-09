import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, UserPlus, Plus, Eye, Power } from 'lucide-react';
import '../areas/AreaStyles.css';

const AdultoList = () => {
  const [adultos, setAdultos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredAdultos = adultos.filter(a => {
    const q = searchTerm.toLowerCase();
    const name = a.persona ? `${a.persona.primerNombre} ${a.persona.primerApellido}`.toLowerCase() : '';
    const cui = a.persona?.dpiCui?.toLowerCase() || '';
    return name.includes(q) || cui.includes(q);
  });

  const loadAdultos = async () => {
    setLoading(true);
    try {
      const [seniorsData, staffData] = await Promise.all([
        fetchApi('/seniors'),
        fetchApi('/health-staff').catch(err => { console.error("Error /health-staff", err); return []; })
      ]);

      const rawSeniors = Array.isArray(seniorsData) ? seniorsData : (seniorsData?.data || []);
      const rawStaff = Array.isArray(staffData) ? staffData : (staffData?.data || []);
      const staffPersonaIds = rawStaff.map(s => s.personaId || s.persona?.id || s.id).filter(Boolean);

      // Excluir cualquier registro de adulto mayor que pertenezca a personal médico
      const cleanAdultos = rawSeniors.filter(a => {
        if (staffPersonaIds.includes(a.personaId)) return false;
        if (a.persona?.personalSalud) return false;
        return true;
      });

      setAdultos(cleanAdultos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdultos();
  }, []);

  const handleToggleStatus = async (personaId, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} a este adulto mayor?`)) return;
    
    try {
      await fetchApi(`/persons/${personaId}/toggle-status`, { method: 'PUT' });
      setAdultos(adultos.map(a => {
        if (a.personaId === personaId) {
          return { ...a, persona: { ...a.persona, activo: !a.persona.activo } };
        }
        return a;
      }));
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Adultos Mayores</h1>
          <p className="crud-subtitle">Pacientes de la tercera edad y contactos de emergencia.</p>
        </div>
        <Link to="/adultos/create" className="btn-primary">
          <Plus size={18} />
          <span>Registrar Adulto Mayor</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar por CUI o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {loading ? (
          <div className="loading-state">Cargando pacientes...</div>
        ) : filteredAdultos.length === 0 ? (
          <div className="empty-state">
            <UserPlus size={48} className="empty-icon" />
            <h3>No hay adultos mayores registrados</h3>
            <p>Registra al primer paciente de la tercera edad.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>CUI</th>
                <th>Nombre Completo</th>
                <th>Tel. Emergencia</th>
                <th>Estado</th>
                <th className="actions-col" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdultos.map(a => {
                const isActivo = a.persona?.activo !== false;
                
                return (
                  <tr key={a.personaId}>
                    <td>{a.persona?.dpiCui || 'N/A'}</td>
                    <td className="fw-500">
                      {a.persona?.primerNombre} {a.persona?.primerApellido}
                    </td>
                    <td>{a.contactoEmergencia || 'No registrado'}</td>
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
                      <Link to={`/adultos/profile/${a.personaId}`} className="action-btn" title="Ver Expediente" style={{color: '#3b82f6', background: '#eff6ff'}}>
                        <Eye size={16} />
                      </Link>
                      <Link to={`/adultos/edit/${a.personaId}`} className="action-btn edit" title="Editar">
                        <Edit2 size={16} />
                      </Link>
                      <button 
                        onClick={() => handleToggleStatus(a.personaId, isActivo)} 
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

export default AdultoList;
