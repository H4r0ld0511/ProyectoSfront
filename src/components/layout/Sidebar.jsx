import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
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

const CLINICOS = ['Administrador', 'Secretario', 'Secretaria', 'Medico', 'Médico', 'Enfermero', 'Enfermera'];
const MEDICOS = ['Administrador', 'Medico', 'Médico', 'Enfermero', 'Enfermera'];
const ADMIN_SEC = ['Administrador', 'Secretario', 'Secretaria'];

const MENU_ITEMS = [
  { id: 'areas', title: 'Áreas de Salud', icon: Building2, path: '/areas', roles: ['Administrador'] },
  { id: 'comunidades', title: 'Comunidades', icon: Users, path: '/comunidades', roles: ['Administrador'] },
  { id: 'personas', title: 'Personas', icon: UserSquare2, path: '/personas', roles: CLINICOS },
  { id: 'roles', title: 'Roles de Sistema', icon: Shield, path: '/roles', roles: ['Administrador'] },
  { id: 'usuarios', title: 'Cuentas de Usuario', icon: Shield, path: '/usuarios', roles: ['Administrador'] },
  { id: 'personal', title: 'Personal de Salud', icon: Stethoscope, path: '/personal', roles: ['Administrador'] },
  { id: 'tutores', title: 'Tutores', icon: HeartHandshake, path: '/tutores', roles: CLINICOS },
  { id: 'ninos', title: 'Niños', icon: Baby, path: '/ninos', roles: CLINICOS },
  { id: 'adultos', title: 'Adultos Mayores', icon: UserPlus, path: '/adultos', roles: CLINICOS },
  { id: 'vacunas', title: 'Vacunas', icon: Syringe, path: '/vacunas', roles: ['Administrador'] },
  { id: 'records', title: 'Récords (Crecimiento)', icon: ClipboardList, path: '/records', roles: CLINICOS },
  { id: 'carnet', title: 'Carnet de Vacunación', icon: HeartPulse, path: '/carnet', roles: CLINICOS },
  { id: 'citas', title: 'Citas Médicas', icon: Calendar, path: '/citas', roles: CLINICOS },
  { id: 'alertas', title: 'Alertas Clínicas', icon: AlertTriangle, path: '/alertas', roles: MEDICOS, noSubmenu: true },
  { id: 'reportes', title: 'Reportes Gerenciales', icon: Briefcase, path: '/reportes', roles: ADMIN_SEC, noSubmenu: true },
  { id: 'historial-cambios', title: 'Historial de Cambios', icon: ClipboardList, path: '/historial-cambios', roles: ['Administrador'], noSubmenu: true }
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

  const userRole = user?.rol || 'Administrador';
  const filteredMenuItems = MENU_ITEMS.filter(item => item.roles.includes(userRole));

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
