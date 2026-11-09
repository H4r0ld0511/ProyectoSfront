import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const RecordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [ninos, setNinos] = useState([]);
  const [personal, setPersonal] = useState([]);
  
  const [formData, setFormData] = useState({
    ninoId: '',
    evaluadorId: '',
    pesoKg: '',
    tallaCm: '',
    observaciones: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [ninosData, personalData] = await Promise.all([
          fetchApi('/children'),
          fetchApi('/health-staff')
        ]);
        setNinos(ninosData || []);
        setPersonal(personalData || []);
      } catch (err) {
        console.error("Error al cargar dependencias", err);
      }
    };
    loadDependencies();

    if (isEditing) {
      const loadRecord = async () => {
        try {
          const res = await fetchApi(`/records/${id}`);
          const record = res.data || res;
          setFormData({
            ninoId: record.ninoId || '',
            evaluadorId: record.evaluadorId || '',
            pesoKg: record.pesoKg || '',
            tallaCm: record.tallaCm || '',
            observaciones: record.observaciones || ''
          });
        } catch (err) {
          setError('Error al cargar el registro: ' + err.message);
        } finally {
          setFetching(false);
        }
      };
      loadRecord();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'pesoKg' || name === 'tallaCm' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Helper para edad
    const getAgeInMonths = (birthDate) => {
      const birth = new Date(birthDate);
      const target = new Date();
      let months = (target.getFullYear() - birth.getFullYear()) * 12;
      months -= birth.getMonth();
      months += target.getMonth();
      if (target.getDate() < birth.getDate()) months--;
      return months < 0 ? 0 : months;
    };

    const ninoSeleccionado = ninos.find(n => n.personaId === Number(formData.ninoId));
    const edadCalculada = ninoSeleccionado?.persona?.fechaNacimiento ? getAgeInMonths(ninoSeleccionado.persona.fechaNacimiento) : 0;

    const payload = {
      ...formData,
      ninoId: formData.ninoId ? Number(formData.ninoId) : null,
      evaluadorId: formData.evaluadorId ? Number(formData.evaluadorId) : null,
      edadMeses: edadCalculada
    };

    try {
      if (isEditing) {
        await fetchApi(`/records/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/records', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/records');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNinoLabel = (n) => `${n.persona?.primerNombre || ''} ${n.persona?.primerApellido || ''} (ID: ${n.personaId})`;
  const formatNinoSearchStr = (n) => `${n.personaId} ${n.persona?.primerNombre || ''} ${n.persona?.segundoNombre || ''} ${n.persona?.primerApellido || ''} ${n.persona?.segundoApellido || ''}`;

  const ninoOptions = [
    {
      label: "Pacientes Infantiles",
      options: ninos.map(n => ({
        value: n.personaId,
        label: formatNinoLabel(n),
        searchStr: formatNinoSearchStr(n)
      }))
    }
  ].filter(group => group.options.length > 0);

  if (fetching) return <div className="loading-state">Preparando formulario...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/records" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Evaluación' : 'Nueva Evaluación de Crecimiento'}</h1>
            <p className="crud-subtitle">Registra las métricas de peso y talla del paciente.</p>
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
              <label htmlFor="evaluadorId">Personal Evaluador *</label>
              <select id="evaluadorId" name="evaluadorId" value={formData.evaluadorId} onChange={handleChange} required>
                <option value="">-- Seleccionar Profesional --</option>
                {personal.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr/a. {p.persona?.primerApellido} ({p.rol?.nombre})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="pesoKg">Peso Actual (Kg) *</label>
              <input
                type="number"
                step="0.01"
                id="pesoKg"
                name="pesoKg"
                value={formData.pesoKg}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tallaCm">Talla Actual (Cm) *</label>
              <input
                type="number"
                step="0.01"
                id="tallaCm"
                name="tallaCm"
                value={formData.tallaCm}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="observaciones">Observaciones Clínicas</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/records" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Evaluación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordForm;
