import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import '../areas/AreaStyles.css';

const PersonalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [personas, setPersonas] = useState([]);
  const [personalSaludIds, setPersonalSaludIds] = useState([]);
  const [seniorsIds, setSeniorsIds] = useState([]);
  const [areas, setAreas] = useState([]);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({
    personaId: '',
    rolId: '',
    areaSaludId: '',
    codigoColegiado: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar dependencias (Personas, Areas, Roles, Personal Existente, Adultos Mayores)
    const loadDependencies = async () => {
      try {
        const [personasData, areasData, rolesData, staffData, seniorsData] = await Promise.all([
          fetchApi('/persons').catch(() => []),
          fetchApi('/health-areas').catch(() => []),
          fetchApi('/roles').catch(() => []),
          fetchApi('/health-staff').catch(() => []),
          fetchApi('/seniors').catch(() => [])
        ]);
        setPersonas(personasData || []);
        setAreas(areasData || []);
        setRoles(rolesData.data || rolesData || []);

        const rawStaff = Array.isArray(staffData) ? staffData : (staffData?.data || []);
        const staffIds = [];
        rawStaff.forEach(s => {
          if (s.personaId != null) staffIds.push(Number(s.personaId));
          if (s.persona_id != null) staffIds.push(Number(s.persona_id));
          if (s.persona && s.persona.id != null) staffIds.push(Number(s.persona.id));
        });
        setPersonalSaludIds(staffIds);

        const rawSeniors = Array.isArray(seniorsData) ? seniorsData : (seniorsData?.data || []);
        const seniorIds = [];
        rawSeniors.forEach(s => {
          if (s.personaId != null) seniorIds.push(Number(s.personaId));
          if (s.persona_id != null) seniorIds.push(Number(s.persona_id));
          if (s.persona && s.persona.id != null) seniorIds.push(Number(s.persona.id));
          if (s.id != null && s.personaId == null) seniorIds.push(Number(s.id));
        });
        setSeniorsIds(seniorIds);
      } catch (err) {
        console.error("No se pudieron cargar los datos", err);
      }
    };
    loadDependencies();

    if (isEditing) {
      const loadPersonal = async () => {
        try {
          const data = await fetchApi(`/health-staff/${id}`);
          setFormData({
            personaId: data.personaId || '',
            rolId: data.rolId || '',
            areaSaludId: data.areaSaludId || '',
            codigoColegiado: data.codigoColegiado || ''
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadPersonal();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const personaIdNum = formData.personaId ? Number(formData.personaId) : null;
    if (!personaIdNum) {
      setError('Por favor seleccione a una persona.');
      return;
    }

    if (!isEditing) {
      if (personalSaludIds.some(sid => Number(sid) === personaIdNum)) {
        setError('Esta persona ya forma parte del personal de salud.');
        return;
      }
      if (seniorsIds.some(sid => Number(sid) === personaIdNum)) {
        setError('Esta persona está registrada como Adulto Mayor y no puede ser promovida a personal de salud.');
        return;
      }
    }

    setLoading(true);

    const payload = {
      ...formData,
      personaId: personaIdNum,
      rolId: formData.rolId ? Number(formData.rolId) : null,
      areaSaludId: formData.areaSaludId ? Number(formData.areaSaludId) : null
    };

    try {
      if (isEditing) {
        await fetchApi(`/health-staff/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/health-staff/promote', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/personal');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar personas disponibles para no incluir a quienes ya son personal, adultos mayores o niños
  const availablePersonas = personas.filter(p => {
    const personId = Number(p.id);

    if (isEditing && formData.personaId && Number(formData.personaId) === personId) {
      return true;
    }

    // No permitir personas que ya son personal médico
    if (personalSaludIds.some(sid => Number(sid) === personId) || Boolean(p.personalSalud) || Boolean(p.personal)) {
      return false;
    }

    // No permitir adultos mayores
    if (seniorsIds.some(sid => Number(sid) === personId) || Boolean(p.adultoMayor)) {
      return false;
    }

    // No permitir niños
    if (p.nino) return false;
    if (p.fechaNacimiento) {
      const birth = new Date(p.fechaNacimiento);
      if (!isNaN(birth.getTime())) {
        const age = new Date().getFullYear() - birth.getFullYear();
        if (age < 18) return false;
      }
    }

    // No permitir personas inactivas
    if (p.activo === false) return false;

    return true;
  });

  if (fetching) return <div className="loading-state">Cargando datos del personal...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/personal" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Personal' : 'Promover Persona a Personal'}</h1>
            <p className="crud-subtitle">Asigna un rol y un área a un profesional de la salud.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="personaId">
                Seleccione a la Persona * 
                <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b', marginLeft: '8px' }}>
                  (Se excluye a quienes ya son personal médico, adultos mayores o niños)
                </span>
              </label>
              <select
                id="personaId"
                name="personaId"
                value={formData.personaId}
                onChange={handleChange}
                required
                disabled={isEditing}
              >
                <option value="">-- Seleccionar Persona --</option>
                {availablePersonas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.dpiCui || 'S/DPI'} - {p.primerNombre} {p.primerApellido}
                  </option>
                ))}
              </select>
              {isEditing && <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>La persona base no se puede cambiar al editar.</small>}

              {!isEditing && availablePersonas.length === 0 && personas.length > 0 && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '12px 16px', 
                  backgroundColor: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '8px', 
                  color: '#991b1b', 
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    No hay personas disponibles para promover a Personal de Salud. Todas las personas existentes ya son parte del personal, adultos mayores o niños. Registre primero a la persona en <Link to="/personas/create" style={{ color: '#b91c1c', fontWeight: 'bold', textDecoration: 'underline' }}>Personas</Link>.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="rolId">Rol Médico *</label>
              <select id="rolId" name="rolId" value={formData.rolId} onChange={handleChange} required>
                <option value="">-- Seleccionar --</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="areaSaludId">Área de Salud</label>
              <select id="areaSaludId" name="areaSaludId" value={formData.areaSaludId} onChange={handleChange}>
                <option value="">-- Ninguna --</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="codigoColegiado">Código de Colegiado (Opcional)</label>
              <input
                type="text"
                id="codigoColegiado"
                name="codigoColegiado"
                value={formData.codigoColegiado}
                onChange={handleChange}
                placeholder="Ej. COL-4859"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/personal" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Confirmar Personal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalForm;
