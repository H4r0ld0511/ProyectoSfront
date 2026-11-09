import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Baby, Calendar, Activity, Syringe, HeartPulse, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../areas/AreaStyles.css';

const NinoDashboard = () => {
  const { id } = useParams();
  
  const [nino, setNino] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [alertas, setAlertas] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper para calcular edad en meses exactos entre dos fechas
  const getAgeInMonths = (birthDate, targetDate = new Date()) => {
    const birth = new Date(birthDate);
    const target = new Date(targetDate);
    let months = (target.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += target.getMonth();
    // Ajuste fino por días
    if (target.getDate() < birth.getDate()) {
      months--;
    }
    return months < 0 ? 0 : months;
  };

  useEffect(() => {
    const loadExpediente = async () => {
      try {
        setLoading(true);
        // 1. Obtener datos del niño
        const ninoData = await fetchApi(`/children/${id}`);
        setNino(ninoData);
        
        const personaId = ninoData.personaId;

        // 2. Obtener todo lo demás en paralelo
        const [historyData, vacunasData, citasData, alertasData] = await Promise.all([
          fetchApi(`/child/${id}/history`).catch(() => []),
          fetchApi(`/vaccines/child/${id}`).catch(() => []),
          fetchApi(`/appointments/patient/${personaId}`).catch(() => []),
          fetchApi(`/child/${id}/alerts`).catch(() => [])
        ]);

        setHistorial(Array.isArray(historyData) ? historyData : historyData.data || []);
        setVacunas(Array.isArray(vacunasData) ? vacunasData : vacunasData.data || []);
        setCitas(Array.isArray(citasData) ? citasData : citasData.data || []);
        setAlertas(Array.isArray(alertasData) ? alertasData : alertasData.data || []);

      } catch (err) {
        setError("Error al cargar el expediente: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadExpediente();
  }, [id]);

  if (loading) return <div className="loading-state">Cargando expediente clínico...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!nino) return <div className="error-banner">No se encontró el paciente.</div>;

  // Cálculos para el Dashboard
  const edadActualMeses = getAgeInMonths(nino.persona?.fechaNacimiento);
  const edadDisplay = edadActualMeses >= 12 
    ? `${Math.floor(edadActualMeses / 12)} años, ${edadActualMeses % 12} meses`
    : `${edadActualMeses} meses`;

  // Estadísticas de Citas
  const citasStats = {
    completadas: citas.filter(c => c.estado === 'COMPLETADA').length,
    canceladas: citas.filter(c => c.estado === 'CANCELADA').length,
    pendientes: citas.filter(c => c.estado === 'PENDIENTE').length
  };

  // Preparar datos para las curvas de crecimiento
  // Mapeamos el historial y calculamos la edad exacta en meses el día de cada evaluación
  const growthData = historial.map(record => ({
    edadMeses: getAgeInMonths(nino.persona?.fechaNacimiento, record.fechaEvaluacion),
    peso: Number(record.peso),
    talla: Number(record.talla),
    fecha: new Date(record.fechaEvaluacion).toLocaleDateString()
  })).sort((a, b) => a.edadMeses - b.edadMeses); // Ordenar cronológicamente

  return (
    <div className="crud-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/ninos" className="back-btn"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="crud-title">Expediente Pediátrico</h1>
            <p className="crud-subtitle">Dashboard Clínico de SCCVI</p>
          </div>
        </div>
      </div>

      {/* 1. Tarjeta de Identificación Principal */}
      <div className="form-card" style={{ marginBottom: '24px', background: 'linear-gradient(to right, #f8fafc, #eff6ff)', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ background: '#3b82f6', color: 'white', padding: '20px', borderRadius: '16px' }}>
            <Baby size={48} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', color: '#1e293b', margin: '0 0 8px 0' }}>
              {nino.persona?.primerNombre} {nino.persona?.primerApellido}
            </h2>
            <div style={{ display: 'flex', gap: '24px', color: '#475569', fontSize: '14px', flexWrap: 'wrap' }}>
              <div><strong>CUI:</strong> {nino.persona?.dpiCui || 'N/A'}</div>
              <div><strong>Fecha Nac.:</strong> {new Date(nino.persona?.fechaNacimiento).toLocaleDateString()}</div>
              <div><strong>Edad:</strong> {edadDisplay}</div>
              <div><strong>Sexo:</strong> {nino.persona?.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
              <div><strong>Tutor Principal:</strong> {nino.tutores && nino.tutores.length > 0 ? `${nino.tutores[0].persona?.primerNombre} ${nino.tutores[0].persona?.primerApellido}` : 'Sin asignar'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Asistencia Médica */}
        <div className="form-card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', margin: '0 0 16px 0', color: '#334155' }}>
            <Calendar size={18} color="#6366f1" /> Asistencia Médica
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{citasStats.completadas}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Asistió</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{citasStats.canceladas}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Faltó</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{citasStats.pendientes}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Pendientes</div>
            </div>
          </div>
        </div>

        {/* Resumen Vacunas */}
        <div className="form-card" style={{ padding: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', margin: '0 0 16px 0', color: '#334155' }}>
            <Syringe size={18} color="#10b981" /> Vacunación
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {vacunas.filter(v => v.estado === 'APLICADA').length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Aplicadas</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {vacunas.filter(v => v.estado === 'PENDIENTE').length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Programadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Curvas de Crecimiento (Peso y Talla vs Edad) */}
      <div className="form-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: '0 0 20px 0', color: '#1e293b' }}>
          <Activity size={20} color="#3b82f6" /> Curvas de Crecimiento (Historial Clínico)
        </h3>
        
        {growthData.length < 2 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <p>Se necesitan al menos 2 evaluaciones para dibujar la curva de crecimiento.</p>
            <Link to="/records/create" className="btn-primary" style={{ marginTop: '12px' }}>Agregar Medición</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Gráfica de Peso */}
            <div>
              <h4 style={{ textAlign: 'center', color: '#64748b', marginBottom: '10px' }}>Curva de Peso (kg) vs Edad (meses)</h4>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="edadMeses" name="Edad (Meses)" tick={{fontSize: 12}} />
                    <YAxis name="Peso (kg)" tick={{fontSize: 12}} />
                    <Tooltip 
                      labelFormatter={(value) => `Edad: ${value} meses`}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="peso" name="Peso del Niño (kg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfica de Talla */}
            <div>
              <h4 style={{ textAlign: 'center', color: '#64748b', marginBottom: '10px' }}>Curva de Talla (cm) vs Edad (meses)</h4>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="edadMeses" name="Edad (Meses)" tick={{fontSize: 12}} />
                    <YAxis name="Talla (cm)" tick={{fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip 
                      labelFormatter={(value) => `Edad: ${value} meses`}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="talla" name="Talla del Niño (cm)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Panel de Alertas */}
      {alertas.length > 0 && (
        <div className="form-card" style={{ marginBottom: '24px', border: '1px solid #fecaca', background: '#fef2f2' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: '0 0 16px 0', color: '#dc2626' }}>
            <AlertTriangle size={20} /> Alertas Detectadas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alertas.map(a => (
              <div key={a.id} style={{ padding: '12px', background: 'white', borderRadius: '8px', borderLeft: `4px solid ${a.tipo === 'CRITICA' ? '#ef4444' : '#f59e0b'}` }}>
                <strong>{a.titulo}</strong>: {a.mensaje}
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default NinoDashboard;
