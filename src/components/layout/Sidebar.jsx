import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import { hasAnyPermission } from '../../utils/permissions';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  UserSquare2, 
  Stethoscope, 
  Baby, 
  UserPlus, 
  HeartHandshake, 
  ClipboardList, 
  Syringe,
  HeartPulse,
  Calendar,
  AlertTriangle,
  Briefcase,
  Shield,
  ChevronRight,
  PlusCircle,
  List
} from 'lucide-react';

// Cada opción se muestra si el usuario tiene AL MENOS UNO de estos permisos.
// El Administrador (rol "Administrador" o permiso ACCESO_TOTAL) ve todo.
// 'ACCESO_TOTAL' como único permiso = opción exclusiva del administrador.
const MENU_ITEMS = [
  { id: 'areas', title: 'Áreas de Salud', icon: Building2, path: '/areas', permisos: ['ACCESO_TOTAL'] },
  { id: 'comunidades', title: 'Comunidades', icon: Users, path: '/comunidades', permisos: ['ACCESO_TOTAL'] },
  { id: 'personas', title: 'Personas', icon: UserSquare2, path: '/personas', permisos: ['GESTION_PACIENTES'] },
  { id: 'roles', title: 'Roles de Sistema', icon: Shield, path: '/roles', permisos: ['GESTION_ROLES'] },
  { id: 'usuarios', title: 'Cuentas de Usuario', icon: Shield, path: '/usuarios', permisos: ['GESTION_USUARIOS'] },
  { id: 'personal', title: 'Personal de Salud', icon: Stethoscope, path: '/personal', permisos: ['ACCESO_TOTAL'] },
  { id: 'tutores', title: 'Tutores', icon: HeartHandshake, path: '/tutores', permisos: ['GESTION_PACIENTES'] },
  { id: 'ninos', title: 'Niños', icon: Baby, path: '/ninos', permisos: ['GESTION_PACIENTES', 'GESTION_EXPEDIENTES'] },
  { id: 'adultos', title: 'Adultos Mayores', icon: UserPlus, path: '/adultos', permisos: ['GESTION_PACIENTES', 'GESTION_EXPEDIENTES'] },
  { id: 'vacunas', title: 'Vacunas', icon: Syringe, path: '/vacunas', permisos: ['GESTION_VACUNAS'] },
  { id: 'records', title: 'Récords (Crecimiento)', icon: ClipboardList, path: '/records', permisos: ['GESTION_CRECIMIENTO', 'CONSULTA_HISTORIAL'] },
  { id: 'carnet', title: 'Carnet de Vacunación', icon: HeartPulse, path: '/carnet', permisos: ['GESTION_VACUNAS', 'CONSULTA_HISTORIAL'] },
  { id: 'citas', title: 'Citas Médicas', icon: Calendar, path: '/citas', permisos: ['GESTION_CITAS'] },
  { id: 'alertas', title: 'Alertas Clínicas', icon: AlertTriangle, path: '/alertas', permisos: ['GESTION_ALERTAS'], noSubmenu: true },
  { id: 'reportes', title: 'Reportes Gerenciales', icon: Briefcase, path: '/reportes', permisos: ['ACCESO_TOTAL'], noSubmenu: true },
  { id: 'historial-cambios', title: 'Historial de Cambios', icon: ClipboardList, path: '/historial-cambios', permisos: ['GESTION_AUDITORIA'], noSubmenu: true }
];

const SidebarItem = ({ item, isOpen, isRouteActive, onToggle }) => {
  if (item.noSubmenu) {
    return (
      <div className="sidebar-item-container">
        <NavLink 
          to={item.path} 
          className={({ isActive }) => `sidebar-item-header single-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-item-title">
            <item.icon size={19} className="icon-main" />
            <span>{item.title}</span>
          </div>
        </NavLink>
      </div>
    );
  }

  return (
    <div className={`sidebar-item-container ${isOpen ? 'open' : ''}`}>
      <div 
        className={`sidebar-item-header ${isRouteActive ? 'route-active' : ''}`}
        onClick={onToggle}
      >
        <div className="sidebar-item-title">
          <item.icon size={19} className="icon-main" />
          <span>{item.title}</span>
        </div>
        <ChevronRight size={16} className="sidebar-chevron" />
      </div>
      
      <div className="sidebar-submenus">
        <div className="sidebar-submenus-content">
          <div className="submenu-tree-wrapper">
            <NavLink 
              to={`${item.path}`} 
              className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
              end
            >
              <List size={15} />
              <span>Listar</span>
            </NavLink>
            <NavLink 
              to={`${item.path}/create`} 
              className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={15} />
              <span>Crear Nuevo</span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const filteredMenuItems = MENU_ITEMS.filter(item => hasAnyPermission(user, item.permisos));

  // Determinar qué menú debe estar abierto según la ruta actual
  const findMatchingMenuId = () => {
    const matched = filteredMenuItems.find(item => 
      location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    );
    return (matched && !matched.noSubmenu) ? matched.id : null;
  };

  const [openMenu, setOpenMenu] = useState(findMatchingMenuId);

  // Sincronizar automáticamente cuando cambie la ruta en la app
  useEffect(() => {
    const matchedId = findMatchingMenuId();
    if (matchedId) {
      setOpenMenu(matchedId);
    }
  }, [location.pathname]);

  const toggleMenu = (id) => {
    setOpenMenu(prev => prev === id ? null : id);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div className="logo-circle-small"></div>
          <h2 style={{ color: '#ffffff', margin: 0 }}>SCCVI Panel</h2>
        </Link>
      </div>
      <div className="sidebar-nav">
        {filteredMenuItems.length === 0 && (
          <p style={{ color: '#cbd5e1', fontSize: '13px', padding: '16px', lineHeight: 1.5 }}>
            No hay opciones disponibles para tu cuenta. Si crees que es un error,
            cierra sesión y vuelve a iniciar para actualizar tus permisos.
          </p>
        )}
        {filteredMenuItems.map((item) => {
          const isRouteActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <SidebarItem 
              key={item.id} 
              item={item} 
              isOpen={openMenu === item.id}
              isRouteActive={isRouteActive}
              onToggle={() => toggleMenu(item.id)}
            />
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
