import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/auth/AuthContext';
import Login from './pages/login/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import AreaList from './pages/areas/AreaList';
import AreaForm from './pages/areas/AreaForm';
import ComunidadList from './pages/comunidades/ComunidadList';
import ComunidadForm from './pages/comunidades/ComunidadForm';
import PersonaList from './pages/personas/PersonaList';
import PersonaForm from './pages/personas/PersonaForm';
import RolList from './pages/roles/RolList';
import RolForm from './pages/roles/RolForm';
import PersonalList from './pages/personal/PersonalList';
import PersonalForm from './pages/personal/PersonalForm';
import UsuarioList from './pages/usuarios/UsuarioList';
import UsuarioForm from './pages/usuarios/UsuarioForm';
import TutorList from './pages/tutores/TutorList';
import TutorForm from './pages/tutores/TutorForm';
import NinoList from './pages/ninos/NinoList';
import NinoForm from './pages/ninos/NinoForm';
import NinoDashboard from './pages/ninos/NinoDashboard';
import AdultoList from './pages/adultos/AdultoList';
import AdultoForm from './pages/adultos/AdultoForm';
import AdultoDashboard from './pages/adultos/AdultoDashboard';
import VacunaList from './pages/vacunas/VacunaList';
import VacunaForm from './pages/vacunas/VacunaForm';
import RecordList from './pages/records/RecordList';
import RecordForm from './pages/records/RecordForm';
import CarnetList from './pages/carnets/CarnetList';
import CarnetForm from './pages/carnets/CarnetForm';
import CitaList from './pages/citas/CitaList';
import CitaForm from './pages/citas/CitaForm';
import AlertaList from './pages/alertas/AlertaList';
import Reportes from './pages/reportes/Reportes';
import HistorialCambios from './pages/reportes/HistorialCambios';
import './App.css';

// A simple PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="loading-screen">Cargando...</div>;
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          } 
        >
          {/* Default Route */}
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Módulo 1: Áreas de Salud */}
          <Route path="areas" element={<AreaList />} />
          <Route path="areas/create" element={<AreaForm />} />
          <Route path="areas/edit/:id" element={<AreaForm />} />

          {/* Módulo 2: Comunidades */}
          <Route path="comunidades" element={<ComunidadList />} />
          <Route path="comunidades/create" element={<ComunidadForm />} />
          <Route path="comunidades/edit/:id" element={<ComunidadForm />} />

          {/* Módulo 3: Personas */}
          <Route path="personas" element={<PersonaList />} />
          <Route path="personas/create" element={<PersonaForm />} />
          <Route path="personas/edit/:id" element={<PersonaForm />} />

          {/* Roles de Sistema */}
          <Route path="roles" element={<RolList />} />
          <Route path="roles/create" element={<RolForm />} />
          <Route path="roles/edit/:id" element={<RolForm />} />

          {/* Gestión de Usuarios (Accesos) */}
          <Route path="usuarios" element={<UsuarioList />} />
          <Route path="usuarios/create" element={<UsuarioForm />} />
          <Route path="usuarios/edit/:id" element={<UsuarioForm />} />

          {/* Módulo 4: Personal de Salud */}
          <Route path="personal" element={<PersonalList />} />
          <Route path="personal/create" element={<PersonalForm />} />
          <Route path="personal/edit/:id" element={<PersonalForm />} />

          {/* Módulo 5: Tutores */}
          <Route path="tutores" element={<TutorList />} />
          <Route path="tutores/create" element={<TutorForm />} />
          <Route path="tutores/edit/:id" element={<TutorForm />} />

          {/* Módulo 6: Niños */}
          <Route path="ninos" element={<NinoList />} />
          <Route path="ninos/create" element={<NinoForm />} />
          <Route path="ninos/edit/:id" element={<NinoForm />} />
          <Route path="ninos/profile/:id" element={<NinoDashboard />} />

          {/* Módulo 7: Adultos Mayores */}
          <Route path="adultos" element={<AdultoList />} />
          <Route path="adultos/create" element={<AdultoForm />} />
          <Route path="adultos/edit/:id" element={<AdultoForm />} />
          <Route path="adultos/profile/:id" element={<AdultoDashboard />} />

          {/* Módulo 8: Récords de Crecimiento */}
          <Route path="records" element={<RecordList />} />
          <Route path="records/create" element={<RecordForm />} />
          <Route path="records/edit/:id" element={<RecordForm />} />

          {/* Módulo 9: Vacunas */}
          <Route path="vacunas" element={<VacunaList />} />
          <Route path="vacunas/create" element={<VacunaForm />} />
          <Route path="vacunas/edit/:id" element={<VacunaForm />} />

          {/* Módulo Avanzado: Carnet de Vacunación */}
          <Route path="carnet" element={<CarnetList />} />
          <Route path="carnet/create" element={<CarnetForm />} />
          <Route path="carnet/edit/:id" element={<CarnetForm />} />

          {/* Módulo Avanzado: Citas Médicas */}
          <Route path="citas" element={<CitaList />} />
          <Route path="citas/create" element={<CitaForm />} />
          <Route path="citas/edit/:id" element={<CitaForm />} />

          {/* Módulo Avanzado: Alertas Clínicas */}
          <Route path="alertas" element={<AlertaList />} />

          {/* Módulo Especial: Reportes Gerenciales */}
          <Route path="reportes" element={<Reportes />} />

          {/* Historial de Cambios / Auditoría */}
          <Route path="historial-cambios" element={<HistorialCambios />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
