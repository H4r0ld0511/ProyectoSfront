import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Trash2, ClipboardList, Plus, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const RecordList = () => {
  const [ninos, setNinos] = useState([]);
  const [selectedNinoId, setSelectedNinoId] = useState('');
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Cargar la lista de niños para el selector
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

  // 2. Cargar el historial cuando se selecciona un niño
  useEffect(() => {
    if (!selectedNinoId) {
      setRecords([]);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchApi(`/child/${selectedNinoId}/history`);
        setRecords(Array.isArray(data) ? data : data.value || data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [selectedNinoId]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro clínico?')) return;
    
    try {
      await fetchApi(`/records/${id}`, { method: 'DELETE' });
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

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
          <h1 className="crud-title">Récords de Crecimiento</h1>
          <p className="crud-subtitle">Consulta el historial de peso y talla por paciente.</p>
        </div>
        <Link to="/records/create" className="btn-primary">
          <Plus size={18} />
          <span>Nueva Evaluación</span>
        </Link>
      </div>

      {/* Selector de Niño */}
      <div className="form-card" style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
        <div className="form-group">
          <label htmlFor="ninoSelect" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} /> Seleccione un Paciente Pediátrico para ver su historial:
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

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Cargando historial clínico...</div>
        ) : !selectedNinoId ? (
          <div className="empty-state">
            <ClipboardList size={48} className="empty-icon" />
            <h3>Seleccione un Paciente</h3>
            <p>Utilice el menú desplegable superior para cargar los récords.</p>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} className="empty-icon" />
            <h3>Sin Evaluaciones</h3>
            <p>Este paciente aún no tiene registros de crecimiento.</p>
          </div>
        ) : (
          <>
            {/* Gráficas de Crecimiento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div className="form-card" style={{ padding: '20px' }}>
                <h4 style={{ textAlign: 'center', color: '#64748b', marginBottom: '15px' }}>Curva de Peso (kg) vs Edad (meses)</h4>
                <div style={{ height: '250px', width: '100%' }}>
                  <ResponsiveContainer>
                    <LineChart data={[...records].sort((a, b) => a.edadMeses - b.edadMeses)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="edadMeses" name="Edad (Meses)" tick={{fontSize: 12}} />
                      <YAxis name="Peso (kg)" tick={{fontSize: 12}} />
                      <Tooltip labelFormatter={(value) => `Edad: ${value} meses`} />
                      <Legend />
                      <Line type="monotone" dataKey="pesoKg" name="Peso (kg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="form-card" style={{ padding: '20px' }}>
                <h4 style={{ textAlign: 'center', color: '#64748b', marginBottom: '15px' }}>Curva de Talla (cm) vs Edad (meses)</h4>
                <div style={{ height: '250px', width: '100%' }}>
                  <ResponsiveContainer>
                    <LineChart data={[...records].sort((a, b) => a.edadMeses - b.edadMeses)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="edadMeses" name="Edad (Meses)" tick={{fontSize: 12}} />
                      <YAxis name="Talla (cm)" tick={{fontSize: 12}} domain={['auto', 'auto']} />
                      <Tooltip labelFormatter={(value) => `Edad: ${value} meses`} />
                      <Legend />
                      <Line type="monotone" dataKey="tallaCm" name="Talla (cm)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabla de Historial */}
            <div className="table-card">
              <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                Historial Tabular
              </h3>
              <table className="modern-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Edad (Meses)</th>
                    <th>Peso (kg)</th>
                    <th>Talla (cm)</th>
                    <th>Evaluador</th>
                    <th className="actions-col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="fw-500">{new Date(r.fechaMedicion).toLocaleDateString()}</td>
                      <td>{r.edadMeses}</td>
                      <td>{r.pesoKg}</td>
                      <td>{r.tallaCm}</td>
                      <td>Dr/a. {r.evaluador?.persona?.primerApellido || 'ID:' + r.evaluadorId}</td>
                      <td className="actions-cell">
                        <Link to={`/records/edit/${r.id}`} className="action-btn edit" title="Editar">
                          <Edit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(r.id)} className="action-btn delete" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecordList;
