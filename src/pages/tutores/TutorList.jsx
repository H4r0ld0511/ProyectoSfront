import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, HeartHandshake, Plus, Power } from 'lucide-react';
import '../areas/AreaStyles.css';

const TutorList = () => {
  const [tutores, setTutores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredTutores = tutores.filter(t => {
    const q = searchTerm.toLowerCase();
    const name = t.persona ? `${t.persona.primerNombre} ${t.persona.primerApellido}`.toLowerCase() : '';
    const email = t.email?.toLowerCase() || '';
    const phone = t.telefono?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  const loadTutores = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/tutors');
      setTutores(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutores();
  }, []);

  const handleToggleStatus = async (personaId, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} a este tutor?`)) return;
    
    try {
      await fetchApi(`/persons/${personaId}/toggle-status`, { method: 'PUT' });
      setTutores(tutores.map(t => {
        if (t.personaId === personaId) {
          return { ...t, persona: { ...t.persona, activo: !t.persona.activo } };
        }
        return t;
      }));
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Tutores (Padres/Encargados)</h1>
          <p className="crud-subtitle">Personas responsables de niños en el sistema.</p>
        </div>
        <Link to="/tutores/create" className="btn-primary">
          <Plus size={18} />
          <span>Registrar Tutor</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : filteredTutores.length === 0 ? (
          <div className="empty-state">
            <HeartHandshake size={48} className="empty-icon" />
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otra búsqueda o registra a un tutor nuevo.</p>
          </div>
        ) : (
          <table className="modern-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tutor</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Canal Pref.</th>
                <th>Estado</th>
                <th className="actions-col" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTutores.map(t => {
                const nombreCompleto = t.persona ? `${t.persona.primerNombre} ${t.persona.primerApellido}` : 'Desconocido';
                const isActivo = t.persona?.activo !== false;
                
                return (
                  <tr key={t.personaId}>
                    <td className="id-cell">#{t.personaId}</td>
                    <td className="fw-500">{nombreCompleto}</td>
                    <td>{t.telefono || '-'}</td>
                    <td>{t.email || '-'}</td>
                    <td>{t.canales?.length > 0 ? t.canales.join(', ') : '-'}</td>
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
                      <Link to={`/tutores/edit/${t.personaId}`} className="action-btn edit" title="Editar">
                        <Edit2 size={16} />
                      </Link>
                      <button 
                        onClick={() => handleToggleStatus(t.personaId, isActivo)} 
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

export default TutorList;
