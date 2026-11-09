import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Trash2, Plus, UserSquare2, Power } from 'lucide-react';
import '../areas/AreaStyles.css';

const PersonaList = () => {
  const [personas, setPersonas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredPersonas = personas.filter(persona => {
    if (filterType === 'NINOS' && !persona.nino) return false;
    if (filterType === 'ADULTOS' && !persona.adultoMayor) return false;
    if (filterType === 'TUTORES' && !persona.tutor) return false;
    if (filterType === 'PERSONAL' && !persona.personalSalud) return false;

    const q = searchTerm.toLowerCase();
    const name = `${persona.primerNombre} ${persona.segundoNombre || ''} ${persona.primerApellido} ${persona.segundoApellido || ''}`.toLowerCase();
    return name.includes(q) || (persona.dpiCui && persona.dpiCui.toLowerCase().includes(q)) || (persona.comunidad?.nombre && persona.comunidad.nombre.toLowerCase().includes(q));
  });

  const loadPersonas = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/persons');
      setPersonas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} a esta persona?`)) return;
    
    try {
      await fetchApi(`/persons/${id}/toggle-status`, { method: 'PUT' });
      setPersonas(personas.map(p => p.id === id ? { ...p, activo: !p.activo } : p));
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Personas</h1>
          <p className="crud-subtitle">Registro central de pacientes, doctores y tutores.</p>
        </div>
        <Link to="/personas/create" className="btn-primary">
          <Plus size={18} />
          <span>Nueva Persona</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#f8fafc' }}>
          <button onClick={() => setFilterType('ALL')} className={filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'} style={{padding: '6px 12px', fontSize: '13px', minWidth: '80px'}}>Todos</button>
          <button onClick={() => setFilterType('NINOS')} className={filterType === 'NINOS' ? 'btn-primary' : 'btn-secondary'} style={{padding: '6px 12px', fontSize: '13px', minWidth: '80px'}}>Niños</button>
          <button onClick={() => setFilterType('TUTORES')} className={filterType === 'TUTORES' ? 'btn-primary' : 'btn-secondary'} style={{padding: '6px 12px', fontSize: '13px', minWidth: '80px'}}>Tutores</button>
          <button onClick={() => setFilterType('ADULTOS')} className={filterType === 'ADULTOS' ? 'btn-primary' : 'btn-secondary'} style={{padding: '6px 12px', fontSize: '13px', minWidth: '80px'}}>Adultos</button>
          <button onClick={() => setFilterType('PERSONAL')} className={filterType === 'PERSONAL' ? 'btn-primary' : 'btn-secondary'} style={{padding: '6px 12px', fontSize: '13px', minWidth: '80px'}}>Personal Médico</button>
        </div>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar por DPI, CUI, nombre o comunidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : filteredPersonas.length === 0 ? (
          <div className="empty-state">
            <UserSquare2 size={48} className="empty-icon" />
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otra búsqueda o comienza creando el primer registro.</p>
          </div>
        ) : (
          <table className="modern-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>DPI / CUI</th>
                <th>Nombre Completo</th>
                <th>Sexo</th>
                <th>Edad (Años)</th>
                <th>Comunidad</th>
                <th className="actions-col">Estado</th>
                <th className="actions-col" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonas.map(persona => {
                const nombreCompleto = `${persona.primerNombre} ${persona.segundoNombre || ''} ${persona.primerApellido} ${persona.segundoApellido || ''}`.replace(/\s+/g, ' ').trim();
                const edad = Math.floor((new Date() - new Date(persona.fechaNacimiento).getTime()) / 3.15576e+10);
                const isActivo = persona.activo !== false;
                
                return (
                  <tr key={persona.id}>
                    <td className="fw-500">{persona.dpiCui || '-'}</td>
                    <td>{nombreCompleto}</td>
                    <td>{persona.sexo}</td>
                    <td>{isNaN(edad) ? '-' : edad}</td>
                    <td>{persona.comunidad?.nombre || '-'}</td>
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
                      <Link to={`/personas/edit/${persona.id}`} className="action-btn edit" title="Editar">
                        <Edit2 size={16} />
                      </Link>
                      <button 
                        onClick={() => handleToggleStatus(persona.id, isActivo)} 
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

export default PersonaList;
