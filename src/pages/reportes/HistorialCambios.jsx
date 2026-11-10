import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { ClipboardList, Loader2, Calendar } from 'lucide-react';

const HistorialCambios = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await fetchApi('/audit');
        setLogs(Array.isArray(data) ? data : (data.value || data.data || []));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const userEmail = log.usuario?.email?.toLowerCase() || '';
    const entidad = log.entidad?.toLowerCase() || '';
    const accion = log.accion?.toLowerCase() || '';
    return userEmail.includes(term) || entidad.includes(term) || accion.includes(term);
  });

  const getActionColor = (accion) => {
    switch(accion) {
      case 'CREAR': return '#10b981'; // Green
      case 'ACTUALIZAR': return '#3b82f6'; // Blue
      case 'ELIMINAR': return '#ef4444'; // Red
      default: return '#64748b'; // Slate
    }
  };

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <h1>Historial de Cambios (Auditoría)</h1>
        <p>Monitoreo de todas las acciones importantes realizadas por el personal en el sistema.</p>
      </div>

      <div className="table-card" style={{ padding: '24px', marginTop: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Buscar por usuario, entidad o acción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={24} />
            <p>Cargando historial...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} className="empty-icon" />
            <h3>No hay registros de auditoría</h3>
            <p>Las acciones recientes aparecerán aquí.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Módulo (Entidad)</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="#64748b" />
                      {new Date(log.fecha).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    {log.usuario ? (
                      <div>
                        <strong>{log.usuario.email}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {log.usuario.personalSalud?.rol?.nombre || 'Rol no definido'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Sistema</span>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: getActionColor(log.accion), color: 'white', fontWeight: 'bold' }}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="fw-500">{log.entidad}</td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => alert(`ID Afectado: ${log.entidadId}\nDatos Nuevos:\n${log.datosNuevos || 'Ninguno'}\nDatos Anteriores:\n${log.datosAnteriores || 'Ninguno'}`)}
                    >
                      Ver Info
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

export default HistorialCambios;
