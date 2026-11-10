import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const CarnetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [ninos, setNinos] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [personal, setPersonal] = useState([]);
  
  const [formData, setFormData] = useState({
    ninoId: '',
    vacunaId: '',
    personalSaludId: '',
    fechaProgramada: '',
    fechaAplicacion: '',
    estado: 'PENDIENTE',
    lote: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  // Formatear fecha para el input tipo date (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [ninosData, vacunasData, personalData] = await Promise.all([
          fetchApi('/children'),
          fetchApi('/vaccines'),
          fetchApi('/health-staff')
        ]);
        setNinos(ninosData || []);
        setVacunas(Array.isArray(vacunasData) ? vacunasData : (vacunasData.data || []));
        setPersonal(personalData || []);
      } catch (err) {
        console.error("Error al cargar dependencias", err);
      }
    };
    loadDependencies();

    if (isEditing) {
      // Como no hay GET /vaccines/apply/:id en el backend, avisamos al usuario.
      // Se podría arreglar guardando el estado globalmente o pasando params,
      // pero para fines de este mockup, mostraremos el error de que se necesita el endpoint.
      setError('Aviso: El backend no dispone de una ruta GET para un registro individual (GET /vaccines/apply/:id). Los campos aparecerán vacíos.');
      setFetching(false);
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

    // Preprocesar el payload para la API
    const payload = {
      ...formData,
      ninoId: formData.ninoId ? Number(formData.ninoId) : null,
      vacunaId: formData.vacunaId ? Number(formData.vacunaId) : null,
      personalSaludId: formData.personalSaludId ? Number(formData.personalSaludId) : null,
      fechaAplicacion: formData.estado === 'APLICADA' && formData.fechaAplicacion 
                        ? new Date(formData.fechaAplicacion).toISOString() 
                        : null,
      fechaProgramada: formData.fechaProgramada 
                        ? new Date(formData.fechaProgramada).toISOString() 
                        : new Date().toISOString()
    };

    try {
      if (isEditing) {
        await fetchApi(`/vaccines/apply/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/vaccines/apply', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/carnet');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ninoOptions = [
    {
      label: "Pacientes",
      options: ninos.map(n => ({
        value: n.personaId,
        label: `ID: ${n.personaId} - ${n.persona?.primerNombre || ''} ${n.persona?.primerApellido || ''}`,
        searchStr: `${n.personaId} ${n.persona?.primerNombre || ''} ${n.persona?.segundoNombre || ''} ${n.persona?.primerApellido || ''} ${n.persona?.segundoApellido || ''}`
      }))
    }
  ].filter(group => group.options.length > 0);

  if (fetching) return <div className="loading-state">Preparando formulario...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/carnet" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Actualizar Vacunación' : 'Registrar/Programar Vacuna'}</h1>
            <p className="crud-subtitle">Aplica una vacuna o prográmala para una fecha futura.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="ninoId">Paciente (Niño) *</label>
              <SearchableSelect
                name="ninoId"
                options={ninoOptions}
                value={formData.ninoId ? Number(formData.ninoId) : ''}
                onChange={handleChange}
                placeholder="-- Seleccionar Paciente --"
                disabled={isEditing}
                required={true}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vacunaId">Vacuna del Catálogo *</label>
              <select 
                id="vacunaId" 
                name="vacunaId" 
                value={formData.vacunaId} 
                onChange={handleChange} 
                required
                disabled={isEditing}
              >
                <option value="">-- Seleccionar Vacuna --</option>
                {vacunas.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} (Dosis #{v.dosisNumero})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="estado">Estado de la Vacuna *</label>
              <select id="estado" name="estado" value={formData.estado} onChange={handleChange} required>
                <option value="PENDIENTE">Programada / Pendiente</option>
                <option value="APLICADA">Aplicada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="personalSaludId">Profesional de Salud (Aplicador)</label>
              <select id="personalSaludId" name="personalSaludId" value={formData.personalSaludId} onChange={handleChange}>
                <option value="">-- Opcional (Si está pendiente) --</option>
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
              <label htmlFor="fechaProgramada">Fecha Programada *</label>
              <input
                type="date"
                id="fechaProgramada"
                name="fechaProgramada"
                value={formData.fechaProgramada}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fechaAplicacion">Fecha de Aplicación (Si aplica)</label>
              <input
                type="date"
                id="fechaAplicacion"
                name="fechaAplicacion"
                value={formData.fechaAplicacion}
                onChange={handleChange}
                disabled={formData.estado !== 'APLICADA'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="lote">Número de Lote de la Vacuna (Opcional)</label>
              <input
                type="text"
                id="lote"
                name="lote"
                value={formData.lote}
                onChange={handleChange}
                placeholder="Ej. L-123456"
                disabled={formData.estado !== 'APLICADA'}
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/carnet" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Vacunación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarnetForm;
