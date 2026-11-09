import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2, UserPlus, Search, Users, X } from 'lucide-react';
import '../areas/AreaStyles.css';

const NinoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [personas, setPersonas] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [personalSaludIds, setPersonalSaludIds] = useState([]);
  
  const [childMode, setChildMode] = useState('EXISTENTE'); // 'EXISTENTE' | 'NUEVO'
  const [tutorMode, setTutorMode] = useState('EXISTENTE'); // 'EXISTENTE' | 'NUEVO'
  
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [adultSearchTerm, setAdultSearchTerm] = useState('');
  const [childSearchTerm, setChildSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    personaId: '', // ID del Niño Existente
    tutorPersonaId: '', // ID del Adulto Existente
    telefono: '',
    email: '',
    canales: ['TELEGRAM']
  });
  
  const [childNuevo, setChildNuevo] = useState({
    dpiCui: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    fechaNacimiento: '',
    sexo: 'M'
  });

  const [tutorNuevo, setTutorNuevo] = useState({
    dpiCui: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    fechaNacimiento: '',
    sexo: 'M'
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [personasData, tutoresData, personalData] = await Promise.all([
          fetchApi('/persons').catch(e => { console.error(e); return []; }),
          fetchApi('/tutors').catch(e => { console.error(e); return []; }),
          fetchApi('/health-staff').catch(e => { console.error(e); return []; })
        ]);
        setPersonas(personasData || []);
        setTutores(tutoresData || []);
        setPersonalSaludIds(personalData?.map(ps => ps.personaId) || []);
      } catch (err) {
        console.error("No se pudieron cargar dependencias", err);
      }
    };
    loadDependencies();

    if (isEditing) {
      setChildMode('EXISTENTE');
      const loadNino = async () => {
        try {
          const data = await fetchApi(`/children/${id}`);
          const tutorId = (data.tutores && data.tutores.length > 0) ? data.tutores[0].personaId : '';
          let tutorData = {};
          if (tutorId && tutores.length > 0) {
            const foundTutor = tutores.find(t => t.personaId === tutorId);
            if (foundTutor) {
              tutorData = {
                telefono: foundTutor.telefono || '',
                email: foundTutor.email || '',
                canales: foundTutor.canales || []
              };
            }
          }
          
          setFormData({
            personaId: data.personaId || '',
            tutorPersonaId: tutorId,
            ...tutorData
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadNino();
    }
  }, [id, isEditing, tutores.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      if (name === 'tutorPersonaId' && value) {
        const existingTutor = tutores.find(t => String(t.personaId) === String(value));
        if (existingTutor) {
          next.telefono = existingTutor.telefono || '';
          next.email = existingTutor.email || '';
          next.canales = existingTutor.canales || [];
        } else {
          next.telefono = '';
          next.email = '';
          next.canales = ['TELEGRAM'];
        }
      }
      
      return next;
    });
  };

  const handleChildNuevoChange = (e) => {
    const { name, value } = e.target;
    setChildNuevo(prev => ({ ...prev, [name]: value }));
  };

  const handleTutorNuevoChange = (e) => {
    const { name, value } = e.target;
    setTutorNuevo(prev => ({ ...prev, [name]: value }));
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

  const handleConfirmTutorModal = () => {
    if (tutorMode === 'EXISTENTE' && !formData.tutorPersonaId) {
      alert("Por favor seleccione un tutor existente.");
      return;
    }
    if (tutorMode === 'NUEVO' && (!tutorNuevo.primerNombre || !tutorNuevo.primerApellido || !tutorNuevo.fechaNacimiento)) {
      alert("Por favor complete los campos obligatorios del nuevo tutor.");
      return;
    }
    setShowTutorModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalChildPersonaId = formData.personaId;
      let finalTutorPersonaId = formData.tutorPersonaId;

      // Validación
      if (childMode === 'EXISTENTE' && !finalChildPersonaId) {
        throw new Error('Debe seleccionar el paciente (Niño).');
      }
      if (tutorMode === 'EXISTENTE' && !finalTutorPersonaId) {
        throw new Error('Debe configurar un tutor responsable en el modal.');
      }

      // 1. Crear Persona Niño si es NUEVO
      if (!isEditing && childMode === 'NUEVO') {
        const childPersonaCreada = await fetchApi('/persons', { 
          method: 'POST', 
          body: JSON.stringify(childNuevo) 
        });
        finalChildPersonaId = childPersonaCreada.id || childPersonaCreada.data?.id;
      }

      // 2. Crear Persona Tutor si es NUEVO
      if (tutorMode === 'NUEVO') {
        const tutorPersonaCreada = await fetchApi('/persons', { 
          method: 'POST', 
          body: JSON.stringify(tutorNuevo) 
        });
        finalTutorPersonaId = tutorPersonaCreada.id || tutorPersonaCreada.data?.id;
      }

      // 3. Guardar/Actualizar el Tutor
      const tutorPayload = {
        personaId: Number(finalTutorPersonaId),
        telefono: formData.telefono || '00000000', 
        email: formData.email,
        canales: formData.canales
      };
      
      const isExistingTutor = tutores.some(t => String(t.personaId) === String(finalTutorPersonaId));
      if (isExistingTutor && tutorMode === 'EXISTENTE') {
        await fetchApi(`/tutors/${finalTutorPersonaId}`, {
          method: 'PUT',
          body: JSON.stringify(tutorPayload)
        });
      } else {
        await fetchApi('/tutors', {
          method: 'POST',
          body: JSON.stringify(tutorPayload)
        });
      }

      // 4. Guardar/Actualizar el Niño
      const childPayload = {
        personaId: Number(finalChildPersonaId),
        tutorIds: [Number(finalTutorPersonaId)]
      };

      if (isEditing) {
        await fetchApi(`/children/${id}`, {
          method: 'PUT',
          body: JSON.stringify(childPayload)
        });
      } else {
        await fetchApi('/children', {
          method: 'POST',
          body: JSON.stringify(childPayload)
        });
      }
      
      navigate('/ninos');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper para mostrar un resumen del tutor seleccionado en la vista principal
  const getTutorSummary = () => {
    if (tutorMode === 'EXISTENTE') {
      if (!formData.tutorPersonaId) return "Sin asignar";
      const p = personas.find(p => String(p.id) === String(formData.tutorPersonaId));
      return p ? `${p.primerNombre} ${p.primerApellido} (Existente)` : "Seleccionado";
    } else {
      if (!tutorNuevo.primerNombre) return "Nuevo Tutor (Datos incompletos)";
      return `${tutorNuevo.primerNombre} ${tutorNuevo.primerApellido} (Nuevo)`;
    }
  };

  if (fetching) return <div className="loading-state">Cargando datos...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/ninos" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Paciente Pediátrico' : 'Registrar Nuevo Niño'}</h1>
            <p className="crud-subtitle">Asocia un tutor a un paciente menor de edad, creando sus registros si no existen.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          {/* SECCIÓN DEL NIÑO */}
          <div className="form-section">
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Datos del Paciente (Niño)
            </h3>
            
            {!isEditing && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button type="button" onClick={() => setChildMode('EXISTENTE')} className={childMode === 'EXISTENTE' ? 'btn-primary' : 'btn-secondary'} style={{flex: 1, padding: '8px'}}>
                  <Search size={16} style={{marginRight: '8px'}} /> Seleccionar Existente
                </button>
                <button type="button" onClick={() => setChildMode('NUEVO')} className={childMode === 'NUEVO' ? 'btn-primary' : 'btn-secondary'} style={{flex: 1, padding: '8px', background: childMode === 'NUEVO' ? '#10b981' : undefined}}>
                  <UserPlus size={16} style={{marginRight: '8px'}} /> Crear Nuevo Niño
                </button>
              </div>
            )}

            {childMode === 'EXISTENTE' ? (
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="personaId">Seleccione a la Persona (Niño) *</label>
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre o CUI..."
                    value={childSearchTerm}
                    onChange={(e) => setChildSearchTerm(e.target.value)}
                    style={{ marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <select 
                    id="personaId" 
                    name="personaId" 
                    value={formData.personaId} 
                    onChange={handleChange} 
                    required={childMode === 'EXISTENTE'} 
                    disabled={isEditing}
                  >
                    <option value="">-- Seleccionar Persona --</option>
                    {personas.filter(p => {
                      if (!childSearchTerm) return true;
                      const searchStr = `${p.dpiCui || ''} ${p.primerNombre || ''} ${p.primerApellido || ''}`.toLowerCase();
                      return searchStr.includes(childSearchTerm.toLowerCase());
                    }).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.dpiCui || 'S/DPI'} - {p.primerNombre} {p.primerApellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div className="form-row split">
                  <div className="form-group">
                    <label>CUI (Opcional)</label>
                    <input type="text" name="dpiCui" value={childNuevo.dpiCui} onChange={handleChildNuevoChange} placeholder="Sin espacios" />
                  </div>
                  <div className="form-group">
                    <label>Sexo *</label>
                    <select name="sexo" value={childNuevo.sexo} onChange={handleChildNuevoChange} required>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>
                <div className="form-row split">
                  <div className="form-group">
                    <label>Primer Nombre *</label>
                    <input type="text" name="primerNombre" value={childNuevo.primerNombre} onChange={handleChildNuevoChange} required />
                  </div>
                  <div className="form-group">
                    <label>Segundo Nombre</label>
                    <input type="text" name="segundoNombre" value={childNuevo.segundoNombre} onChange={handleChildNuevoChange} />
                  </div>
                </div>
                <div className="form-row split">
                  <div className="form-group">
                    <label>Primer Apellido *</label>
                    <input type="text" name="primerApellido" value={childNuevo.primerApellido} onChange={handleChildNuevoChange} required />
                  </div>
                  <div className="form-group">
                    <label>Segundo Apellido</label>
                    <input type="text" name="segundoApellido" value={childNuevo.segundoApellido} onChange={handleChildNuevoChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Nacimiento *</label>
                    <input type="date" name="fechaNacimiento" value={childNuevo.fechaNacimiento} onChange={handleChildNuevoChange} required />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN DEL TUTOR (Apertura de Modal) */}
          <div className="form-section" style={{ marginTop: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Tutor o Responsable</h3>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
              Estado actual: <strong>{getTutorSummary()}</strong>
            </p>
            
            <button 
              type="button" 
              onClick={() => setShowTutorModal(true)} 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Users size={16} /> Configurar Tutor
            </button>
          </div>

          <div className="form-actions" style={{marginTop: '24px'}}>
            <Link to="/ninos" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Niño y Tutor'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DEL TUTOR */}
      {showTutorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, color: '#1e293b' }}>Configurar Tutor del Menor</h2>
              <button type="button" onClick={handleConfirmTutorModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setTutorMode('EXISTENTE')} className={tutorMode === 'EXISTENTE' ? 'btn-primary' : 'btn-secondary'} style={{flex: 1, padding: '8px'}}>
                <Search size={16} style={{marginRight: '8px'}} /> Seleccionar Existente
              </button>
              <button type="button" onClick={() => setTutorMode('NUEVO')} className={tutorMode === 'NUEVO' ? 'btn-primary' : 'btn-secondary'} style={{flex: 1, padding: '8px', background: tutorMode === 'NUEVO' ? '#10b981' : undefined}}>
                <UserPlus size={16} style={{marginRight: '8px'}} /> Crear Nuevo Tutor
              </button>
            </div>

            {tutorMode === 'EXISTENTE' ? (
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="tutorPersonaId">Tutor / Encargado (Obligatorio) *</label>
                  <input
                    type="text"
                    placeholder="Buscar adulto por nombre o DPI..."
                    value={adultSearchTerm}
                    onChange={(e) => setAdultSearchTerm(e.target.value)}
                    style={{ marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <select id="tutorPersonaId" name="tutorPersonaId" value={formData.tutorPersonaId} onChange={handleChange} required={tutorMode === 'EXISTENTE'}>
                    <option value="">-- Seleccionar Adulto --</option>
                    {personas.filter(p => {
                      if (personalSaludIds.includes(p.id)) return false;
                      const age = new Date().getFullYear() - new Date(p.fechaNacimiento).getFullYear();
                      if (age < 18) return false;
                      if (!adultSearchTerm) return true;
                      const searchStr = `${p.dpiCui || ''} ${p.primerNombre || ''} ${p.primerApellido || ''}`.toLowerCase();
                      return searchStr.includes(adultSearchTerm.toLowerCase());
                    }).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.dpiCui || 'S/DPI'} - {p.primerNombre} {p.primerApellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div className="form-row split">
                  <div className="form-group">
                    <label>DPI *</label>
                    <input type="text" name="dpiCui" value={tutorNuevo.dpiCui} onChange={handleTutorNuevoChange} required placeholder="Sin espacios" />
                  </div>
                  <div className="form-group">
                    <label>Sexo *</label>
                    <select name="sexo" value={tutorNuevo.sexo} onChange={handleTutorNuevoChange} required>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>
                <div className="form-row split">
                  <div className="form-group">
                    <label>Primer Nombre *</label>
                    <input type="text" name="primerNombre" value={tutorNuevo.primerNombre} onChange={handleTutorNuevoChange} required />
                  </div>
                  <div className="form-group">
                    <label>Segundo Nombre</label>
                    <input type="text" name="segundoNombre" value={tutorNuevo.segundoNombre} onChange={handleTutorNuevoChange} />
                  </div>
                </div>
                <div className="form-row split">
                  <div className="form-group">
                    <label>Primer Apellido *</label>
                    <input type="text" name="primerApellido" value={tutorNuevo.primerApellido} onChange={handleTutorNuevoChange} required />
                  </div>
                  <div className="form-group">
                    <label>Segundo Apellido</label>
                    <input type="text" name="segundoApellido" value={tutorNuevo.segundoApellido} onChange={handleTutorNuevoChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Nacimiento *</label>
                    <input type="date" name="fechaNacimiento" value={tutorNuevo.fechaNacimiento} onChange={handleTutorNuevoChange} required />
                  </div>
                </div>
              </div>
            )}

            <div className="form-card" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginTop: '16px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Datos de Contacto del Tutor</h4>
              <div className="form-row split">
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono (WhatsApp/Telegram) *</label>
                  <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej. 12345678"
                    required
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
                  <label>Notificaciones (Seleccione uno o varios canales)</label>
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
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowTutorModal(false)} className="btn-secondary">Cancelar</button>
              <button type="button" onClick={handleConfirmTutorModal} className="btn-primary">Confirmar Selección</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NinoForm;
