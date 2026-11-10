import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { X, Save, AlertCircle } from 'lucide-react';

const ReasignarRolModal = ({ roleToDelete, allRoles, onClose, onSuccess }) => {
  const [affectedStaff, setAffectedStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Guardamos las selecciones de rol temporalmente: { [staffId]: newRoleId }
  const [newRoles, setNewRoles] = useState({});

  useEffect(() => {
    const loadAffectedStaff = async () => {
      try {
        const staffData = await fetchApi('/health-staff');
        const staffArray = Array.isArray(staffData) ? staffData : (staffData.data || []);
        
        // Filtrar solo a los que tienen el rol que se va a eliminar
        const affected = staffArray.filter(staff => staff.rolId === roleToDelete.id);
        setAffectedStaff(affected);
        
        // Inicializar el estado de newRoles (por defecto vacío o sin seleccionar)
        const initialRoles = {};
        affected.forEach(s => {
          initialRoles[s.id] = ''; 
        });
        setNewRoles(initialRoles);
        
      } catch (err) {
        setError('Error al cargar el personal afectado: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadAffectedStaff();
  }, [roleToDelete]);

  const handleRoleChange = (staffId, newRoleId) => {
    setNewRoles(prev => ({
      ...prev,
      [staffId]: newRoleId
    }));
  };

  const handleSave = async () => {
    // Validar que todos tengan un rol nuevo asignado
    const hasUnassigned = Object.values(newRoles).some(roleId => !roleId);
    if (hasUnassigned) {
      setError('Debes asignar un nuevo rol a todo el personal afectado antes de continuar.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Hacer las peticiones de actualización para cada staff afectado
      const updatePromises = affectedStaff.map(staff => {
        return fetchApi(`/health-staff/${staff.id}`, {
          method: 'PUT',
          body: JSON.stringify({ rolId: parseInt(newRoles[staff.id], 10) })
        });
      });

      await Promise.all(updatePromises);
      
      // Si todo sale bien, llamamos a onSuccess
      onSuccess();
    } catch (err) {
      setError('Error al reasignar roles: ' + err.message);
      setSaving(false);
    }
  };

  // Filtrar los roles disponibles (quitar el rol que se va a eliminar)
  const availableRoles = allRoles.filter(r => r.id !== roleToDelete.id);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: '#1e293b' }}>Reasignar Usuarios del Rol: {roleToDelete.nombre}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ flex: 1 }}>
          <div className="alert alert-warning" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fffbeb', color: '#b45309', padding: '12px', borderRadius: '8px' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0 }}>
              Este rol está asignado a {affectedStaff.length} persona(s). Para poder eliminar el rol, debes asignar un rol distinto a estas personas.
            </p>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <div className="loading-state">Cargando personal afectado...</div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Rol Actual</th>
                    <th>Nuevo Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {affectedStaff.map(staff => (
                    <tr key={staff.id}>
                      <td>
                        {staff.persona?.primerNombre} {staff.persona?.primerApellido}
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '4px' }}>
                          {staff.rol?.nombre}
                        </span>
                      </td>
                      <td>
                        <select 
                          value={newRoles[staff.id]} 
                          onChange={(e) => handleRoleChange(staff.id, e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                          required
                        >
                          <option value="">-- Seleccionar --</option>
                          {availableRoles.map(rol => (
                            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading || affectedStaff.length === 0}>
            {saving ? 'Guardando...' : 'Reasignar y Continuar'}
            {!saving && <Save size={18} style={{ marginLeft: '8px' }} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasignarRolModal;
