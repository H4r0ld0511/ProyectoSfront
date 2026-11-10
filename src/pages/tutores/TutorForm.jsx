import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const TutorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [personas, setPersonas] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [personalSaludIds, setPersonalSaludIds] = useState([]);
  
  const [selectedNinoId, setSelectedNinoId] = useState('');
  
  const [formData, setFormData] = useState({
    personaId: '',
    telefono: '',
    email: '',
    canales: ['TELEGRAM']
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [personasData, ninosData, personalData] = await Promise.all([
          fetchApi('/persons'),
          fetchApi('/children'),
          fetchApi('/health-staff')
        ]);
        setPersonas(personasData);
        setNinos(ninosData);
        setPersonalSaludIds(personalData.map(ps => ps.personaId));
      } catch (err) {
        console.error("Error al cargar datos", err);
      }
    };
    loadData();

    if (isEditing) {
      if (!id || id === 'undefined' || isNaN(Number(id))) {
        setError('El ID del tutor proporcionado en la URL no es válido. Regrese a la lista y vuelva a intentarlo.');
        setFetching(false);
        return;
      }
      
      const loadTutor = async () => {
        try {
          const data = await fetchApi(`/tutors/${id}`);
          setFormData({
            personaId: data.personaId || '',
            telefono: data.telefono || '',
            email: data.email || '',
            canales: data.canales || []
          });
          if (data.ninosAsignados && data.ninosAsignados.length > 0) {
            setSelectedNinoId(data.ninosAsignados[0].personaId);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadTutor();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCanalChange = (canal) => {
    setFormData(prev => {
      const current = prev.canales || [];
      if (current.includes(canal)) {
        return { ...prev, canales: current.filter(c => c !== canal) };
      }
      return { ...prev, canales: [...current, canal] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      personaId: formData.personaId ? Number(formData.personaId) : null,
    };

    try {
      if (isEditing) {
        await fetchApi(`/tutors/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/tutors', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      
      if (selectedNinoId) {
        const childData = await fetchApi(`/children/${selectedNinoId}`);
        const currentTutorIds = childData.tutores?.map(t => t.personaId) || [];
        const newTutorId = Number(formData.personaId);
        
        if (!currentTutorIds.includes(newTutorId)) {
          await fetchApi(`/children/${selectedNinoId}`, {
            method: 'PUT',
            body: JSON.stringify({
              tutorIds: [...currentTutorIds, newTutorId]
            })
          });
        }
      }
      
      navigate('/tutores');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const adultoOptions = [
    {
      label: "Adultos Disponibles",
      options: personas.filter(p => {
        if (personalSaludIds.includes(p.id)) return false;
        const age = new Date().getFullYear() - new Date(p.fechaNacimiento).getFullYear();
        if (age < 18) return false;
        return true;
      }).map(p => ({
        value: p.id,
        label: `${p.dpiCui || 'S/DPI'} - ${p.primerNombre} ${p.primerApellido}`,
        searchStr: `${p.dpiCui || ''} ${p.primerNombre || ''} ${p.primerApellido || ''}`
      }))
    }
  ].filter(group => group.options.length > 0);

  const ninoOptions = [
    {
      label: "Pacientes (Niños)",
      options: ninos.map(n => ({
        value: n.personaId,
        label: `${n.persona?.dpiCui || 'S/DPI'} - ${n.persona?.primerNombre} ${n.persona?.primerApellido}`,
        searchStr: `${n.persona?.dpiCui || ''} ${n.persona?.primerNombre || ''} ${n.persona?.primerApellido || ''}`
      }))
    }
  ].filter(group => group.options.length > 0);

  if (fetching) return <div className="loading-state">Cargando datos del tutor...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/tutores" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Tutor' : 'Registrar Nuevo Tutor'}</h1>
            <p className="crud-subtitle">Asocia datos de contacto a una persona existente para que actúe como tutor.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="personaId">Seleccione el Adulto (Tutor) *</label>
              <SearchableSelect
                name="personaId"
                options={adultoOptions}
                value={formData.personaId ? Number(formData.personaId) : ''}
                onChange={handleChange}
                placeholder="-- Seleccionar Adulto --"
                disabled={isEditing}
                required={true}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ninoId">Asignar a Paciente (Niño)</label>
              <SearchableSelect
                name="ninoId"
                options={ninoOptions}
                value={selectedNinoId ? Number(selectedNinoId) : ''}
                onChange={(e) => setSelectedNinoId(e.target.value)}
                placeholder="-- Seleccionar Paciente --"
                required={false}
              />
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono de Contacto</label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej. +502 1234 5678"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej. correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Canales de Comunicación (Seleccione uno o varios)</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={(formData.canales || []).includes('TELEGRAM')}
                    onChange={() => handleCanalChange('TELEGRAM')}
                  />
                  Telegram
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={(formData.canales || []).includes('EMAIL')}
                    onChange={() => handleCanalChange('EMAIL')}
                  />
                  Correo Electrónico
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={(formData.canales || []).includes('IMPRIMIR')}
                    onChange={() => handleCanalChange('IMPRIMIR')}
                  />
                  Solo Imprimir Carnet
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/tutores" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Tutor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TutorForm;
