import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const CitaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [children, setChildren] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [existingPaciente, setExistingPaciente] = useState(null);
  
  const [formData, setFormData] = useState({
    pacienteId: '',
    personalSaludId: '',
    fechaHora: '',
    motivo: '',
    estado: 'PENDIENTE',
    observaciones: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Necesita formato YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [childrenData, seniorsData, personalData] = await Promise.all([
          fetchApi('/children'),
          fetchApi('/seniors'),
          fetchApi('/health-staff')
        ]);
        setChildren(childrenData || []);
        setSeniors(seniorsData || []);
        setPersonal(personalData || []);
      } catch (err) {
        console.error("Error al cargar dependencias", err);
      }
    };
    loadDependencies();

    if (isEditing) {
      const loadCita = async () => {
        try {
          const data = await fetchApi(`/appointments/${id}`);
          setFormData({
            pacienteId: data.pacienteId || '',
            personalSaludId: data.personalSaludId || '',
            fechaHora: formatDateTimeForInput(data.fechaHora) || '',
            motivo: data.motivo || '',
            estado: data.estado || 'PENDIENTE',
            observaciones: data.observaciones || ''
          });
          if (data.paciente) {
            setExistingPaciente(data.paciente);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadCita();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      pacienteId: formData.pacienteId ? Number(formData.pacienteId) : null,
      personalSaludId: formData.personalSaludId ? Number(formData.personalSaludId) : null,
      fechaHora: new Date(formData.fechaHora).toISOString()
    };

    try {
      if (isEditing) {
        await fetchApi(`/appointments/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/appointments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/citas');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const childOptions = children.map(c => {
    const tutorNombres = (c.tutores || [])
      .map(t => `${t.persona?.primerNombre || ''} ${t.persona?.primerApellido || ''}`.trim())
      .filter(Boolean)
      .join(', ');
    const tutorInfo = tutorNombres ? ` - Tutor: ${tutorNombres}` : '';
    const cui = c.persona?.dpiCui ? c.persona.dpiCui : 'S/CUI';
    const nombreCompleto = `${c.persona?.primerNombre || ''} ${c.persona?.primerApellido || ''}`.trim();

    return {
      value: c.personaId,
      label: `ID: ${c.personaId} - ${cui} - ${nombreCompleto}${tutorInfo}`,
      searchStr: `${c.personaId} ${cui} ${c.persona?.primerNombre || ''} ${c.persona?.segundoNombre || ''} ${c.persona?.primerApellido || ''} ${c.persona?.segundoApellido || ''} ${tutorNombres}`
    };
  });

  const seniorOptions = seniors.map(s => {
    const cui = s.persona?.dpiCui ? s.persona.dpiCui : 'S/DPI';
    const nombreCompleto = `${s.persona?.primerNombre || ''} ${s.persona?.primerApellido || ''}`.trim();

    return {
      value: s.personaId,
      label: `ID: ${s.personaId} - ${cui} - ${nombreCompleto}`,
      searchStr: `${s.personaId} ${cui} ${s.persona?.primerNombre || ''} ${s.persona?.segundoNombre || ''} ${s.persona?.primerApellido || ''} ${s.persona?.segundoApellido || ''}`
    };
  });

  if (isEditing && existingPaciente && !childOptions.some(opt => opt.value === existingPaciente.id) && !seniorOptions.some(opt => opt.value === existingPaciente.id)) {
    childOptions.push({
      value: existingPaciente.id,
      label: `ID: ${existingPaciente.id} - ${existingPaciente.dpiCui || 'S/DPI'} - ${existingPaciente.primerNombre} ${existingPaciente.primerApellido} (Registro anterior)`,
      searchStr: `${existingPaciente.id} ${existingPaciente.primerNombre} ${existingPaciente.primerApellido}`
    });
  }

  const pacienteOptions = [
    {
      label: "Niños (Pacientes)",
      options: childOptions
    },
    {
      label: "Adultos Mayores (Pacientes)",
      options: seniorOptions
    }
  ].filter(group => group.options.length > 0);

  if (fetching) return <div className="loading-state">Cargando cita...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/citas" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Cita Médica' : 'Agendar Cita'}</h1>
            <p className="crud-subtitle">Programa una nueva atención médica o de vacunación para un paciente.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="pacienteId">Paciente (Niño o Adulto Mayor) *</label>
              <SearchableSelect
                name="pacienteId"
                options={pacienteOptions}
                value={formData.pacienteId ? Number(formData.pacienteId) : ''}
                onChange={handleChange}
                placeholder="-- Seleccionar Paciente --"
                disabled={isEditing}
                required={true}
              />
            </div>

            <div className="form-group">
              <label htmlFor="personalSaludId">Personal Médico</label>
              <select 
                id="personalSaludId" 
                name="personalSaludId" 
                value={formData.personalSaludId} 
                onChange={handleChange} 
              >
                <option value="">-- Opcional / Sin asignar --</option>
                {personal.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr/a. {p.persona?.primerApellido}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="fechaHora">Fecha y Hora de la Cita *</label>
              <input
                type="datetime-local"
                id="fechaHora"
                name="fechaHora"
                value={formData.fechaHora}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="estado">Estado *</label>
              <select id="estado" name="estado" value={formData.estado} onChange={handleChange} required>
                <option value="PENDIENTE">Programada / Pendiente</option>
                <option value="COMPLETADA">Completada (Atendida)</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="motivo">Motivo de la Consulta *</label>
              <input
                type="text"
                id="motivo"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Ej. Control de niño sano, Vacunación, Enfermedad común..."
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                placeholder="Detalles adicionales, síntomas, etc."
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/citas" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Agendar Cita'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CitaForm;
