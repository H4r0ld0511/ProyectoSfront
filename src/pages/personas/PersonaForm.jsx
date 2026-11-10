import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2, Baby, Stethoscope, Users, Shield, PlusCircle, X } from 'lucide-react';
import '../areas/AreaStyles.css';

const PersonaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { user } = useContext(AuthContext);
  const isAdministrador = user?.rol === 'Administrador';

  // --- CATALOGOS ---
  const [comunidades, setComunidades] = useState([]);
  const [tutoresList, setTutoresList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [areasList, setAreasList] = useState([]);

  // --- ESTADO: PERSONA BASE ---
  const [formData, setFormData] = useState({
    dpiCui: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    fechaNacimiento: '',
    sexo: 'M',
    direccion: '',
    comunidadId: ''
  });

  // --- ESTADO: TIPO DE REGISTRO ---
  // Solo aplicable al CREAR. Si editamos, solo editamos la persona.
  const [tipoRegistro, setTipoRegistro] = useState('NADA'); // NADA, NINO, PERSONAL
  const [showModal, setShowModal] = useState(false);

  // --- ESTADO: MODAL NIÑO ---
  const [ninoData, setNinoData] = useState({ pinSeguridad: '' });
  const [tutorMode, setTutorMode] = useState('EXISTENTE'); // EXISTENTE, NUEVO
  const [tutorExistenteId, setTutorExistenteId] = useState('');

  // Si crea tutor nuevo:
  const [tutorNuevo, setTutorNuevo] = useState({
    dpiCui: '',
    primerNombre: '',
    primerApellido: '',
    fechaNacimiento: '',
    sexo: 'M',
    telefono: '',
    aceptaTerminos: false,
    aceptaNotificaciones: true
  });

  // --- ESTADO: MODAL PERSONAL ---
  const [personalData, setPersonalData] = useState({
    rolId: '',
    areaSaludId: '',
    codigoColegiado: '',
    crearUsuario: false,
    email: '',
    passwordHash: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar catálogos siempre (útil para los modales)
    const loadCatalogs = async () => {
      try {
        const [comData, tutData, rolData, areaData] = await Promise.all([
          fetchApi('/communities').catch(() => ({})),
          fetchApi('/tutors').catch(() => ({})),
          fetchApi('/roles').catch(() => ({})),
          fetchApi('/health-areas').catch(() => ({}))
        ]);

        setComunidades(Array.isArray(comData) ? comData : (comData.data || comData.value || []));
        setTutoresList(Array.isArray(tutData) ? tutData : (tutData.data || tutData.value || []));
        setRolesList(Array.isArray(rolData) ? rolData : (rolData.data || rolData.value || []));
        setAreasList(Array.isArray(areaData) ? areaData : (areaData.data || areaData.value || []));
      } catch (err) {
        console.error("No se pudieron cargar catálogos", err);
      }
    };
    loadCatalogs();

    if (isEditing) {
      const loadPersona = async () => {
        try {
          const data = await fetchApi(`/persons/${id}`);
          setFormData({
            dpiCui: data.dpiCui || '',
            primerNombre: data.primerNombre || '',
            segundoNombre: data.segundoNombre || '',
            primerApellido: data.primerApellido || '',
            segundoApellido: data.segundoApellido || '',
            fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '',
            sexo: data.sexo || 'M',
            direccion: data.direccion || '',
            comunidadId: data.comunidadId || ''
          });
        } catch (err) {
          setError("Error al cargar persona: " + err.message);
        } finally {
          setFetching(false);
        }
      };
      loadPersona();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTutorNuevoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTutorNuevo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  // Botón principal del formulario base
  const handleBaseSubmit = (e) => {
    e.preventDefault();
    if (isEditing || tipoRegistro === 'NADA') {
      // Si edita o no hay rol especial, guarda directamente
      saveAll();
    } else {
      // Abrimos el modal para completar los datos extra
      setShowModal(true);
    }
  };

  // Guardado en Cadena (La magia del Asistente)
  const saveAll = async () => {
    setLoading(true);
    setError('');
    setShowModal(false);

    try {
      const payloadPersona = {
        ...formData,
        comunidadId: formData.comunidadId ? Number(formData.comunidadId) : null
      };

      if (isEditing) {
        await fetchApi(`/persons/${id}`, { method: 'PUT', body: JSON.stringify(payloadPersona) });
        navigate('/personas');
        return;
      }

      // 1. Guardar Persona Principal
      const personaCreada = await fetchApi('/persons', { method: 'POST', body: JSON.stringify(payloadPersona) });
      const personaId = personaCreada.id || personaCreada.data?.id;
      if (!personaId) throw new Error("No se pudo obtener el ID de la persona creada.");

      // 2A. Flujo Niño
      if (tipoRegistro === 'NINO') {
        let finalTutorId = tutorExistenteId;

        // Si hay que crear el tutor de cero
        if (tutorMode === 'NUEVO') {
          // Crear Persona Tutor
          const payloadTutorPersona = {
            dpiCui: tutorNuevo.dpiCui,
            primerNombre: tutorNuevo.primerNombre,
            primerApellido: tutorNuevo.primerApellido,
            fechaNacimiento: tutorNuevo.fechaNacimiento,
            sexo: tutorNuevo.sexo,
            comunidadId: payloadPersona.comunidadId // Asumimos misma comunidad
          };
          const tutorPersonaCreada = await fetchApi('/persons', { method: 'POST', body: JSON.stringify(payloadTutorPersona) });
          const newTutorPersonaId = tutorPersonaCreada.id || tutorPersonaCreada.data?.id;

          // Promover a Tutor
          await fetchApi('/tutors', {
            method: 'POST',
            body: JSON.stringify({
              personaId: newTutorPersonaId,
              telefono: tutorNuevo.telefono,
              canalPreferido: 'WHATSAPP',
              aceptaTerminos: tutorNuevo.aceptaTerminos,
              aceptaNotificaciones: tutorNuevo.aceptaNotificaciones
            })
          });
          finalTutorId = newTutorPersonaId;
        }

        // Crear Niño
        const qrGenerado = `QR-${personaId}-${new Date().getTime()}`;
        await fetchApi('/children', {
          method: 'POST',
          body: JSON.stringify({
            personaId: personaId,
            tutorIds: [Number(finalTutorId)],
            pinSeguridad: ninoData.pinSeguridad,
            codigoQrToken: qrGenerado
          })
        });

        navigate('/ninos');
        return;
      }

      // 2B. Flujo Personal de Salud
      if (tipoRegistro === 'PERSONAL') {
        await fetchApi('/health-staff/promote', {
          method: 'POST',
          body: JSON.stringify({
            personaId: personaId,
            rolId: Number(personalData.rolId),
            areaSaludId: personalData.areaSaludId ? Number(personalData.areaSaludId) : null,
            codigoColegiado: personalData.codigoColegiado || null,
            crearUsuario: personalData.crearUsuario,
            email: personalData.email || null,
            passwordHash: personalData.passwordHash || null
          })
        });

        navigate('/personal');
        return;
      }

      // Si llegó aquí es porque era NADA
      navigate('/personas');

    } catch (err) {
      setError("Error durante el registro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-state">Cargando persona...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/personas" className="back-btn"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Persona' : 'Registro de Personas'}</h1>
            <p className="crud-subtitle">Ingresa los datos generales. Si deseas, puedes asignarle un rol inmediatamente.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner" style={{ marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleBaseSubmit} className="modern-form">
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>1. Datos Personales Base</h3>
          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="dpiCui">DPI / CUI</label>
              <input type="text" id="dpiCui" name="dpiCui" value={formData.dpiCui} onChange={handleChange} placeholder="Identificación sin espacios" />
            </div>
            <div className="form-group">
              <label htmlFor="sexo">Sexo *</label>
              <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} required>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="primerNombre">Primer Nombre *</label>
              <input type="text" id="primerNombre" name="primerNombre" value={formData.primerNombre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="segundoNombre">Segundo Nombre</label>
              <input type="text" id="segundoNombre" name="segundoNombre" value={formData.segundoNombre} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="primerApellido">Primer Apellido *</label>
              <input type="text" id="primerApellido" name="primerApellido" value={formData.primerApellido} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="segundoApellido">Segundo Apellido</label>
              <input type="text" id="segundoApellido" name="segundoApellido" value={formData.segundoApellido} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="fechaNacimiento">Fecha de Nacimiento *</label>
              <input type="date" id="fechaNacimiento" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="comunidadId">Comunidad de Residencia</label>
              <select id="comunidadId" name="comunidadId" value={formData.comunidadId} onChange={handleChange}>
                <option value="">-- Ninguna --</option>
                {comunidades.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {!isEditing && (
            <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>2. Tipo de Registro (Integración Rápida)</h3>
              <div className="form-group full-width">
                <label>¿Deseas asignar un rol a esta persona de una vez?</label>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: tipoRegistro === 'NADA' ? '#eff6ff' : 'white', border: tipoRegistro === 'NADA' ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', flex: 1 }}>
                    <input type="radio" name="tipoRegistro" value="NADA" checked={tipoRegistro === 'NADA'} onChange={(e) => setTipoRegistro(e.target.value)} style={{ display: 'none' }} />
                    <Users size={20} color={tipoRegistro === 'NADA' ? '#3b82f6' : '#64748b'} />
                    <span style={{ fontWeight: tipoRegistro === 'NADA' ? 'bold' : 'normal' }}>Persona </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: tipoRegistro === 'NINO' ? '#eff6ff' : 'white', border: tipoRegistro === 'NINO' ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', flex: 1 }}>
                    <input type="radio" name="tipoRegistro" value="NINO" checked={tipoRegistro === 'NINO'} onChange={(e) => setTipoRegistro(e.target.value)} style={{ display: 'none' }} />
                    <Baby size={20} color={tipoRegistro === 'NINO' ? '#3b82f6' : '#64748b'} />
                    <span style={{ fontWeight: tipoRegistro === 'NINO' ? 'bold' : 'normal' }}>Paciente Pediátrico</span>
                  </label>

                  {isAdministrador && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: tipoRegistro === 'PERSONAL' ? '#eff6ff' : 'white', border: tipoRegistro === 'PERSONAL' ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', flex: 1 }}>
                      <input type="radio" name="tipoRegistro" value="PERSONAL" checked={tipoRegistro === 'PERSONAL'} onChange={(e) => setTipoRegistro(e.target.value)} style={{ display: 'none' }} />
                      <Stethoscope size={20} color={tipoRegistro === 'PERSONAL' ? '#3b82f6' : '#64748b'} />
                      <span style={{ fontWeight: tipoRegistro === 'PERSONAL' ? 'bold' : 'normal' }}>Personal de Salud</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '30px' }}>
            <Link to="/personas" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : (tipoRegistro === 'NADA' || isEditing ? <Save size={18} /> : <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />)}
              <span>{isEditing ? 'Guardar Cambios' : (tipoRegistro === 'NADA' ? 'Registrar Persona' : 'Continuar al Paso 2')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* --- MODAL NIÑO / PERSONAL --- */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {tipoRegistro === 'NINO' ? <><Baby color="#3b82f6" /> Completar Expediente Pediátrico</> : <><Stethoscope color="#10b981" /> Asignación de Personal</>}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>

            {/* FORMULARIO NIÑO */}
            {tipoRegistro === 'NINO' && (
              <div className="modern-form">
                <div className="form-group full-width">
                  <label>PIN de Seguridad (Niño) *</label>
                  <input type="text" value={ninoData.pinSeguridad} onChange={e => setNinoData({ pinSeguridad: e.target.value })} placeholder="Ej: 1234" maxLength={6} />
                  <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>Pin de 4 o 6 dígitos para acceso móvil de los padres.</small>
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Tutor o Responsable</h4>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <button type="button" onClick={() => setTutorMode('EXISTENTE')} className={tutorMode === 'EXISTENTE' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px' }}>Seleccionar Existente</button>
                    <button type="button" onClick={() => setTutorMode('NUEVO')} className={tutorMode === 'NUEVO' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px' }}>Crear Tutor Nuevo</button>
                  </div>

                  {tutorMode === 'EXISTENTE' ? (
                    <div className="form-group full-width">
                      <select value={tutorExistenteId} onChange={e => setTutorExistenteId(e.target.value)}>
                        <option value="">-- Seleccionar Tutor --</option>
                        {tutoresList.map(t => (
                          <option key={t.personaId} value={t.personaId}>
                            {t.persona?.primerNombre} {t.persona?.primerApellido} ({t.persona?.dpiCui})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <div className="form-row split" style={{ marginBottom: '12px' }}>
                        <div className="form-group"><input type="text" name="dpiCui" value={tutorNuevo.dpiCui} onChange={handleTutorNuevoChange} placeholder="DPI del Tutor" /></div>
                        <div className="form-group"><input type="text" name="telefono" value={tutorNuevo.telefono} onChange={handleTutorNuevoChange} placeholder="Teléfono" /></div>
                      </div>
                      <div className="form-row split" style={{ marginBottom: '12px' }}>
                        <div className="form-group"><input type="text" name="primerNombre" value={tutorNuevo.primerNombre} onChange={handleTutorNuevoChange} placeholder="Primer Nombre" /></div>
                        <div className="form-group"><input type="text" name="primerApellido" value={tutorNuevo.primerApellido} onChange={handleTutorNuevoChange} placeholder="Primer Apellido" /></div>
                      </div>
                      <div className="form-row split">
                        <div className="form-group"><input type="date" name="fechaNacimiento" value={tutorNuevo.fechaNacimiento} onChange={handleTutorNuevoChange} title="Fecha Nacimiento" /></div>
                        <div className="form-group">
                          <select name="sexo" value={tutorNuevo.sexo} onChange={handleTutorNuevoChange}>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-row" style={{ marginBottom: '12px', display: 'flex', gap: '16px', flexDirection: 'column' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" name="aceptaTerminos" checked={tutorNuevo.aceptaTerminos} onChange={handleTutorNuevoChange} />
                          El padre/tutor acepta los términos de privacidad y tratamiento de datos médicos.
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" name="aceptaNotificaciones" checked={tutorNuevo.aceptaNotificaciones} onChange={handleTutorNuevoChange} />
                          El padre/tutor acepta recibir notificaciones de campañas y alertas por WhatsApp/Telegram.
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FORMULARIO PERSONAL */}
            {tipoRegistro === 'PERSONAL' && (
              <div className="modern-form">
                <div className="form-group full-width">
                  <label>Rol Oficial en el Sistema *</label>
                  <select name="rolId" value={personalData.rolId} onChange={handlePersonalChange}>
                    <option value="">-- Seleccionar Rol --</option>
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Área de Salud Asignada</label>
                  <select name="areaSaludId" value={personalData.areaSaludId} onChange={handlePersonalChange}>
                    <option value="">-- Sin Área (Nivel Central) --</option>
                    {areasList.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Código de Colegiado (Opcional)</label>
                  <input type="text" name="codigoColegiado" value={personalData.codigoColegiado} onChange={handlePersonalChange} placeholder="Ej: COL-12345" />
                </div>

                <div className="form-group full-width" style={{ marginTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="crearUsuario" checked={personalData.crearUsuario} onChange={(e) => setPersonalData(prev => ({ ...prev, crearUsuario: e.target.checked }))} />
                    Crear credenciales de acceso (Usuario) para este personal
                  </label>
                </div>

                {personalData.crearUsuario && (
                  <div className="form-row split" style={{ marginTop: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div className="form-group">
                      <label>Correo Electrónico (Login) *</label>
                      <input type="email" name="email" value={personalData.email} onChange={handlePersonalChange} placeholder="ejemplo@sccvi.com" />
                    </div>
                    <div className="form-group">
                      <label>Contraseña Temporal *</label>
                      <input type="text" name="passwordHash" value={personalData.passwordHash} onChange={handlePersonalChange} placeholder="Se pedirá cambio al iniciar" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Volver</button>
              <button onClick={saveAll} className="btn-primary" disabled={loading} style={{ background: '#10b981' }}>
                {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                <span>Guardar Sistema Completo</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaForm;
