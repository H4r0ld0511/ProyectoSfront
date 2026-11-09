import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, UserPlus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import '../areas/AreaStyles.css';

const AdultoDashboard = () => {
  const { id } = useParams();
  
  const [adulto, setAdulto] = useState(null);
  const [citas, setCitas] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExpediente = async () => {
      try {
        setLoading(true);
        // 1. Obtener datos del adulto mayor
        const adultoData = await fetchApi(`/seniors/${id}`);
        setAdulto(adultoData);
        
        const personaId = adultoData.personaId;

        // 2. Obtener citas del paciente
        const citasData = await fetchApi(`/appointments/patient/${personaId}`).catch(() => []);
        setCitas(Array.isArray(citasData) ? citasData : citasData.data || []);

      } catch (err) {
        setError("Error al cargar el expediente: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadExpediente();
  }, [id]);

  if (loading) return <div className="loading-state">Cargando expediente geriátrico...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!adulto) return <div className="error-banner">No se encontró el paciente.</div>;

  // Estadísticas de Citas
  const citasStats = {
    completadas: citas.filter(c => c.estado === 'COMPLETADA').length,
    canceladas: citas.filter(c => c.estado === 'CANCELADA').length,
    pendientes: citas.filter(c => c.estado === 'PENDIENTE').length
  };

  const getStatusBadge = (estado) => {
    if (estado === 'COMPLETADA') return <span style={{ color: '#10b981', fontWeight: 'bold' }}><CheckCircle size={14}/> Completada</span>;
    if (estado === 'CANCELADA') return <span style={{ color: '#ef4444', fontWeight: 'bold' }}><XCircle size={14}/> Cancelada</span>;
    return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}><Clock size={14}/> Pendiente</span>;
  };

  return (
    <div className="crud-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/adultos" className="back-btn"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="crud-title">Expediente Geriátrico</h1>
            <p className="crud-subtitle">Dashboard Clínico de SCCVI para Adultos Mayores</p>
          </div>
        </div>
      </div>

      {/* 1. Tarjeta de Identificación Principal */}
      <div className="form-card" style={{ marginBottom: '24px', background: 'linear-gradient(to right, #f8fafc, #f5f3ff)', border: '1px solid #ddd6fe' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ background: '#8b5cf6', color: 'white', padding: '20px', borderRadius: '16px' }}>
            <UserPlus size={48} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', color: '#1e293b', margin: '0 0 8px 0' }}>
              {adulto.persona?.primerNombre} {adulto.persona?.primerApellido}
            </h2>
            <div style={{ display: 'flex', gap: '24px', color: '#475569', fontSize: '14px', flexWrap: 'wrap' }}>
              <div><strong>CUI:</strong> {adulto.persona?.dpiCui || 'N/A'}</div>
              <div><strong>Tel. Emergencia:</strong> {adulto.contactoEmergencia || 'No registrado'}</div>
              <div><strong>Condiciones:</strong> {adulto.condicionesPreexistentes || 'Ninguna'}</div>
              <div><strong>Sexo:</strong> {adulto.persona?.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Asistencia Médica */}
        <div className="form-card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', margin: '0 0 16px 0', color: '#334155' }}>
            <Calendar size={18} color="#6366f1" /> Asistencia Médica e Historial de Citas
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{citasStats.completadas}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Asistió (Completadas)</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{citasStats.canceladas}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Faltó (Canceladas)</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{citasStats.pendientes}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Citas */}
      <div className="form-card">
        <h3 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#1e293b' }}>Últimas Citas Agendadas</h3>
        {citas.length === 0 ? (
          <div className="empty-state">
            <p>Este paciente no tiene historial de citas.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Motivo</th>
                <th>Médico</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas.slice().reverse().map(c => (
                <tr key={c.id}>
                  <td>{new Date(c.fechaHora).toLocaleString()}</td>
                  <td>{c.motivo}</td>
                  <td>{c.personalSalud?.persona?.primerApellido ? `Dr. ${c.personalSalud.persona.primerApellido}` : '-'}</td>
                  <td>{getStatusBadge(c.estado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
    </div>
  );
};

export default AdultoDashboard;
