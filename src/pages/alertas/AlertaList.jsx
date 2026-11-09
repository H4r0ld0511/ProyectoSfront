import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { AlertTriangle, Search, Bell } from 'lucide-react';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const AlertaList = () => {
  const [ninos, setNinos] = useState([]);
  const [selectedNinoId, setSelectedNinoId] = useState('');
  
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Cargar la lista de niños
  useEffect(() => {
    const loadNinos = async () => {
      try {
        const data = await fetchApi('/children');
        setNinos(data);
      } catch (err) {
        console.error('Error al cargar niños', err);
      }
    };
    loadNinos();
  }, []);

  // 2. Cargar alertas
  useEffect(() => {
    if (!selectedNinoId) {
      setAlertas([]);
      return;
    }

    const loadAlertas = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchApi(`/child/${selectedNinoId}/alerts`);
        setAlertas(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAlertas();
  }, [selectedNinoId]);

  const ninoOptions = [
    {
      label: "Pacientes",
      options: ninos.map(n => ({
        value: n.personaId,
        label: `${n.persona?.dpiCui || 'S/DPI'} - ${n.persona?.primerNombre || ''} ${n.persona?.primerApellido || ''}`,
        searchStr: `${n.persona?.dpiCui || ''} ${n.persona?.primerNombre || ''} ${n.persona?.segundoNombre || ''} ${n.persona?.primerApellido || ''} ${n.persona?.segundoApellido || ''}`
      }))
    }
  ].filter(group => group.options.length > 0);

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Alertas Clínicas</h1>
          <p className="crud-subtitle">Monitoreo automático de anomalías en crecimiento o salud.</p>
        </div>
      </div>

      {/* Selector de Niño */}
      <div className="form-card" style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
        <div className="form-group">
          <label htmlFor="ninoSelect" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} /> Seleccione un Paciente Pediátrico para revisar sus alertas:
          </label>
          <div style={{ marginTop: '12px' }}>
            <SearchableSelect
              name="ninoSelect"
              options={ninoOptions}
              value={selectedNinoId ? Number(selectedNinoId) : ''}
              onChange={(e) => setSelectedNinoId(e.target.value)}
              placeholder="-- Buscar y Seleccionar Paciente --"
              required={false}
            />
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
        {loading ? (
          <div className="loading-state" style={{ background: 'white', borderRadius: '16px', padding: '40px' }}>Cargando alertas...</div>
        ) : !selectedNinoId ? (
          <div className="empty-state" style={{ background: 'white', borderRadius: '16px' }}>
            <Bell size={48} className="empty-icon" />
            <h3>Seleccione un Paciente</h3>
            <p>Las alertas se calculan basándose en los registros individuales de cada niño.</p>
          </div>
        ) : alertas.length === 0 ? (
          <div className="empty-state" style={{ background: 'white', borderRadius: '16px' }}>
            <div style={{ color: '#10b981', marginBottom: '16px' }}>
              <CheckCircle size={48} />
            </div>
            <h3>Sin Alertas</h3>
            <p>Este paciente no presenta ninguna anomalía en su crecimiento.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {alertas.map(alerta => (
              <div 
                key={alerta.id} 
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  borderLeft: `6px solid ${alerta.tipo === 'CRITICA' ? '#ef4444' : '#f59e0b'}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <AlertTriangle size={24} color={alerta.tipo === 'CRITICA' ? '#ef4444' : '#f59e0b'} />
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{alerta.titulo}</h3>
                  <span style={{
                    marginLeft: 'auto',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: alerta.tipo === 'CRITICA' ? '#fee2e2' : '#fef3c7',
                    color: alerta.tipo === 'CRITICA' ? '#ef4444' : '#f59e0b'
                  }}>
                    {alerta.tipo}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>
                  {alerta.mensaje}
                </p>
                <div style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8' }}>
                  Generada el: {new Date(alerta.fechaGeneracion).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple inline component for CheckCircle
const CheckCircle = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default AlertaList;
