import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import '../areas/AreaStyles.css';

const ComunidadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [areas, setAreas] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    numeroEstimadoFamilias: 0,
    areaSaludId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar áreas de salud para el selector
    const loadAreas = async () => {
      try {
        const data = await fetchApi('/health-areas');
        setAreas(data);
      } catch (err) {
        console.error("No se pudieron cargar las áreas", err);
      }
    };
    loadAreas();

    if (isEditing) {
      const loadComunidad = async () => {
        try {
          const data = await fetchApi(`/communities/${id}`);
          setFormData({
            nombre: data.nombre || '',
            ubicacion: data.ubicacion || '',
            numeroEstimadoFamilias: data.numeroEstimadoFamilias || 0,
            areaSaludId: data.areaSaludId || ''
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadComunidad();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'numeroEstimadoFamilias' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Preparamos payload validando que área no esté vacía
    const payload = {
      ...formData,
      areaSaludId: formData.areaSaludId ? Number(formData.areaSaludId) : null
    };

    try {
      if (isEditing) {
        // En backend no parece existir PUT /communities, si falla atrapará error
        await fetchApi(`/communities/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/communities', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/comunidades');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-state">Cargando comunidad...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/comunidades" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Comunidad' : 'Nueva Comunidad'}</h1>
            <p className="crud-subtitle">Completa los datos de la comunidad o aldea.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="nombre">Nombre de la Comunidad *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="areaSaludId">Área de Salud Asignada</label>
              <select
                id="areaSaludId"
                name="areaSaludId"
                value={formData.areaSaludId}
                onChange={handleChange}
              >
                <option value="">-- Seleccionar --</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="ubicacion">Ubicación / Descripción</label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numeroEstimadoFamilias">Número Est. de Familias</label>
              <input
                type="number"
                id="numeroEstimadoFamilias"
                name="numeroEstimadoFamilias"
                value={formData.numeroEstimadoFamilias}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/comunidades" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Comunidad'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComunidadForm;
