import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const AdultoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [personas, setPersonas] = useState([]);
  const [personalSaludIds, setPersonalSaludIds] = useState([]);
  const [seniorsIds, setSeniorsIds] = useState([]);
  const [currentPersona, setCurrentPersona] = useState(null);
  
  const [formData, setFormData] = useState({
    personaId: '',
    telefonoContacto: '',
    telefonoEmergencia: '',
    condicionesPreexistentes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [personasData, staffData, seniorsData] = await Promise.all([
          fetchApi('/persons').catch(err => { console.error("Error /persons", err); return []; }),
          fetchApi('/health-staff').catch(err => { console.error("Error /health-staff", err); return []; }),
          fetchApi('/seniors').catch(err => { console.error("Error /seniors", err); return []; })
        ]);

        const rawPersonas = Array.isArray(personasData) ? personasData : (personasData?.data || personasData?.value || []);
        const rawStaff = Array.isArray(staffData) ? staffData : (staffData?.data || staffData?.value || []);
        const rawSeniors = Array.isArray(seniorsData) ? seniorsData : (seniorsData?.data || seniorsData?.value || []);

        setPersonas(rawPersonas);
        
        // Identificadores de personas que ya son personal médico
        const staffIds = [];
        rawStaff.forEach(s => {
          if (s.personaId != null) staffIds.push(Number(s.personaId));
          if (s.persona_id != null) staffIds.push(Number(s.persona_id));
          if (s.persona && s.persona.id != null) staffIds.push(Number(s.persona.id));
        });
        setPersonalSaludIds(staffIds);

        // Identificadores de personas que ya están registradas como adultos mayores
        const seniorIds = [];
        rawSeniors.forEach(s => {
          if (s.personaId != null) seniorIds.push(Number(s.personaId));
          if (s.persona_id != null) seniorIds.push(Number(s.persona_id));
          if (s.persona && s.persona.id != null) seniorIds.push(Number(s.persona.id));
          if (s.id != null && s.personaId == null) seniorIds.push(Number(s.id));
        });
        setSeniorsIds(seniorIds);
      } catch (err) {
        console.error("No se pudieron cargar las dependencias", err);
      }
    };
    loadDependencies();

    if (isEditing) {
      const loadAdulto = async () => {
        try {
          const data = await fetchApi(`/seniors/${id}`);
          setFormData({
            personaId: data.personaId || '',
            telefonoContacto: data.telefonoContacto || '',
            telefonoEmergencia: data.telefonoEmergencia || data.contactoEmergencia || '',
            condicionesPreexistentes: data.condicionesPreexistentes || ''
          });
          if (data.persona) {
            setCurrentPersona(data.persona);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadAdulto();
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
      setError('Por favor, seleccione a una persona.');
      return;
    }

    if (!isEditing) {
      const isStaff = personalSaludIds.some(id => Number(id) === personaIdNum);
      if (isStaff) {
        setError('Esta persona ya está registrada como personal médico y no puede ser inscrita como Adulto Mayor.');
        return;
      }

      const isSenior = seniorsIds.some(id => Number(id) === personaIdNum);
      if (isSenior) {
        setError('Esta persona ya se encuentra registrada como Adulto Mayor en el sistema.');
        return;
      }
    }

    setLoading(true);

    const payload = {
      ...formData,
      contactoEmergencia: formData.telefonoEmergencia,
      telefonoEmergencia: formData.telefonoEmergencia,
      personaId: personaIdNum
    };

    try {
      if (isEditing) {
        await fetchApi(`/seniors/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/seniors', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/adultos');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar personas disponibles para excluir personal médico y duplicados
  const availablePersonas = personas.filter(p => {
    const personId = Number(p.id);

    // Si estamos editando y esta es la persona actualmente asociada, permitirla siempre
    if (isEditing && formData.personaId && Number(formData.personaId) === personId) {
      return true;
    }

    // 1. EXCLUIR personal médico (en health-staff o con flag/relación personalSalud)
    const isStaff = personalSaludIds.some(sid => Number(sid) === personId) ||
                    Boolean(p.personalSalud) ||
                    Boolean(p.personal);
    if (isStaff) {
      return false;
    }

    // 2. EXCLUIR personas que ya están registradas como adulto mayor
    const isSenior = seniorsIds.some(sid => Number(sid) === personId) ||
                     Boolean(p.adultoMayor);
    if (isSenior) {
      return false;
    }

    // 3. EXCLUIR niños / menores de edad
    if (p.nino) {
      return false;
    }
    if (p.fechaNacimiento) {
      const birth = new Date(p.fechaNacimiento);
      if (!isNaN(birth.getTime())) {
        const age = new Date().getFullYear() - birth.getFullYear();
        if (age < 18) return false;
      }
    }

    // 4. EXCLUIR personas inactivas
    if (p.activo === false) {
      return false;
    }

    return true;
  });

  // Si estamos en edición y la persona actual no está en la lista filtrada, agregarla al principio
  const personasToShow = [...availablePersonas];
  if (isEditing && currentPersona && !personasToShow.some(p => Number(p.id) === Number(currentPersona.id))) {
    personasToShow.unshift(currentPersona);
  }

  const personaOptions = [
    {
      label: "Personas Disponibles",
      options: personasToShow.map(p => {
        let ageText = '';
        if (p.fechaNacimiento) {
          const birth = new Date(p.fechaNacimiento);
          if (!isNaN(birth.getTime())) {
            const age = new Date().getFullYear() - birth.getFullYear();
            ageText = ` (${age} años)`;
          }
        }
        return {
          value: p.id,
          label: `${p.dpiCui || 'S/DPI'} - ${p.primerNombre} ${p.primerApellido}${ageText}`,
          searchStr: `${p.dpiCui || ''} ${p.primerNombre || ''} ${p.segundoNombre || ''} ${p.primerApellido || ''} ${p.segundoApellido || ''}`
        };
      })
    }
  ].filter(group => group.options.length > 0);

  if (fetching) return <div className="loading-state">Cargando datos...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/adultos" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Adulto Mayor' : 'Registrar Adulto Mayor'}</h1>
            <p className="crud-subtitle">Registra información médica de un paciente de la tercera edad.</p>
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
                  (Se excluye al personal médico, niños y personas ya registradas)
                </span>
              </label>
              
              <SearchableSelect
                name="personaId"
                options={personaOptions}
                value={formData.personaId ? Number(formData.personaId) : ''}
                onChange={handleChange}
                placeholder="-- Buscar y Seleccionar Persona --"
                disabled={isEditing}
              />

              {isEditing && (
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                  La persona asociada no se puede modificar durante la edición.
                </small>
              )}

              {!isEditing && personasToShow.length === 0 && personas.length > 0 && (
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
                    No hay personas disponibles para registrar como Adulto Mayor. Todas las personas existentes en el sistema ya están asignadas como personal médico, adultos mayores o pacientes pediátricos. Para registrar a alguien nuevo, cree primero su registro base en <Link to="/personas/create" style={{ color: '#b91c1c', fontWeight: 'bold', textDecoration: 'underline' }}>Personas</Link>.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="telefonoContacto">Teléfono de Contacto</label>
              <input
                type="text"
                id="telefonoContacto"
                name="telefonoContacto"
                value={formData.telefonoContacto}
                onChange={handleChange}
                placeholder="Ej. +502 1234 5678"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="telefonoEmergencia">Teléfono de Emergencia</label>
              <input
                type="text"
                id="telefonoEmergencia"
                name="telefonoEmergencia"
                value={formData.telefonoEmergencia}
                onChange={handleChange}
                placeholder="Ej. +502 8765 4321"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="condicionesPreexistentes">Condiciones Médicas Preexistentes</label>
              <textarea
                id="condicionesPreexistentes"
                name="condicionesPreexistentes"
                value={formData.condicionesPreexistentes}
                onChange={handleChange}
                rows={3}
                placeholder="Ej. Hipertensión, Diabetes Tipo 2..."
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/adultos" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Paciente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdultoForm;
