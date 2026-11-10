import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Trash2, Calendar, Plus, CalendarCheck, Clock, XCircle } from 'lucide-react';
import '../areas/AreaStyles.css';

const CitaList = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCitas = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/appointments');
      setCitas(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Cancelar o eliminar esta cita médica?')) return;
    
    try {
      await fetchApi(`/appointments/${id}`, { method: 'DELETE' });
      setCitas(citas.filter(c => c.id !== id));
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const getStatusBadge = (estado) => {
    if (estado === 'COMPLETADA') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}><CalendarCheck size={14} /> Completada</span>;
    }
    if (estado === 'CANCELADA') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}><XCircle size={14} /> Cancelada</span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}><Clock size={14} /> Pendiente</span>;
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Citas Médicas</h1>
          <p className="crud-subtitle">Programación y gestión de citas de pacientes.</p>
        </div>
        <Link to="/citas/create" className="btn-primary">
          <Plus size={18} />
          <span>Agendar Cita</span>
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Cargando agenda médica...</div>
        ) : citas.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-icon" />
            <h3>Agenda Vacía</h3>
            <p>No hay citas médicas programadas actualmente.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Paciente</th>
                <th>Médico Asignado</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map(c => {
                const pacienteNombre = c.paciente ? `${c.paciente.primerNombre} ${c.paciente.primerApellido}` : 'Desconocido';
                const tutorNombres = (c.paciente?.nino?.tutores || [])
                  .map(t => `${t.persona?.primerNombre || ''} ${t.persona?.primerApellido || ''}`.trim())
                  .filter(Boolean)
                  .join(', ');
                const medicoNombre = c.personalSalud?.persona ? `Dr. ${c.personalSalud.persona.primerApellido}` : 'Sin asignar';
                const fecha = new Date(c.fechaHora);
                
                return (
                  <tr key={c.id}>
                    <td className="fw-500">
                      {fecha.toLocaleDateString()} a las {fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td>
                      <div className="fw-500">{pacienteNombre}</div>
                      {tutorNombres && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Tutor: {tutorNombres}
                        </div>
                      )}
                      {c.paciente?.adultoMayor && (
                        <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: '500' }}>
                          Adulto Mayor
                        </div>
                      )}
                    </td>
                    <td>{medicoNombre}</td>
                    <td>{c.motivo}</td>
                    <td>{getStatusBadge(c.estado)}</td>
                    <td className="actions-cell">
                      <Link to={`/citas/edit/${c.id}`} className="action-btn edit" title="Editar / Atender">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(c.id)} className="action-btn delete" title="Eliminar">
                        <Trash2 size={16} />
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

export default CitaList;
