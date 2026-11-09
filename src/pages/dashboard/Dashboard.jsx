import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import { fetchApi } from '../../services/api';
import { Users, Baby, Activity, Syringe, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    ninos: 0,
    adultos: 0,
    personal: 0,
    vacunas: 0
  });
  
  const { user } = useContext(AuthContext);
  const isAdministrador = user?.rol === 'Administrador';
  
  const [loading, setLoading] = useState(true);
  const [demographicsData, setDemographicsData] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [ninosData, adultosData, personalData, vacunasData] = await Promise.all([
          fetchApi('/children').catch(e => { console.error('Error /children:', e); return []; }),
          fetchApi('/seniors').catch(e => { console.error('Error /seniors:', e); return []; }),
          fetchApi('/health-staff').catch(e => { console.error('Error /health-staff:', e); return []; }),
          fetchApi('/vaccines').catch(e => { console.error('Error /vaccines:', e); return []; })
        ]);
        
        const totalNinos = Array.isArray(ninosData) ? ninosData.length : (ninosData.data?.length || 0);
        const totalAdultos = Array.isArray(adultosData) ? adultosData.length : (adultosData.data?.length || 0);
        
        setStats({
          ninos: totalNinos,
          adultos: totalAdultos,
          personal: Array.isArray(personalData) ? personalData.length : (personalData.data?.length || 0),
          vacunas: Array.isArray(vacunasData) ? vacunasData.length : (vacunasData.data?.length || 0)
        });

        setDemographicsData([
          { name: 'Pacientes Pediátricos', value: totalNinos },
          { name: 'Adultos Mayores', value: totalAdultos }
        ].filter(d => d.value > 0)); // Solo mostrar si hay datos

      } catch (err) {
        console.error("Error al cargar métricas del dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  if (loading) return <div className="loading-state">Cargando métricas en tiempo real...</div>;

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <h1>{isAdministrador ? 'Centro de Control Administrativo' : 'Panel de Control Médico'}</h1>
        <p>Bienvenido/a {user?.email}. Resumen estadístico y métricas en tiempo real.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Baby size={28} />
          </div>
          <div className="stat-info">
            <h3>Total Niños (Pacientes)</h3>
            <p>{stats.ninos}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Activity size={28} />
          </div>
          <div className="stat-info">
            <h3>Adultos Mayores</h3>
            <p>{stats.adultos}</p>
          </div>
        </div>

        {isAdministrador && (
          <div className="stat-card">
            <div className="stat-icon green">
              <Users size={28} />
            </div>
            <div className="stat-info">
              <h3>Personal de Salud</h3>
              <p>{stats.personal}</p>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon purple">
            <Syringe size={28} />
          </div>
          <div className="stat-info">
            <h3>Catálogo de Vacunas</h3>
            <p>{stats.vacunas}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3><PieChartIcon size={18} /> Demografía del Sistema</h3>
          
          {demographicsData.length === 0 ? (
            <div className="empty-state" style={{ height: '250px' }}>
              <p>No hay suficientes pacientes registrados para generar la gráfica.</p>
            </div>
          ) : (
            <div className="chart-container" style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={130}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {demographicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
