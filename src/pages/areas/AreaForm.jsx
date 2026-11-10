import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import './AreaStyles.css';

const AreaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: '',
    departamento: '',
    municipio: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const loadArea = async () => {
        try {
          const data = await fetchApi(`/health-areas/${id}`);
          setFormData({
            nombre: data.nombre || '',
            departamento: data.departamento || '',
            municipio: data.municipio || ''
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadArea();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        // En tu backend parece que actualizar Área no está mapeado en las rutas, pero si existe, lo enviamos. 
        // ¡OJO! Si el backend no tiene PUT /health-areas/:id, esto fallará. Asumamos que lo ideal es tenerlo o crearlo.
        await fetchApi(`/health-areas/${id}`, {
          method: 'PUT', // Requiere que el backend lo soporte
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi('/health-areas', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      navigate('/areas');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-state">Cargando área...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/areas" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Área de Salud' : 'Nueva Área de Salud'}</h1>
            <p className="crud-subtitle">Completa el formulario con los datos del área.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="nombre">Nombre del Área / Distrito *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Distrito Sanitario Santa Ana"
                required
              />
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="departamento">Departamento</label>
              <input
                type="text"
                id="departamento"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                placeholder="Ej. Peten"
              />
            </div>

            <div className="form-group">
              <label htmlFor="municipio">Municipio</label>
              <input
                type="text"
                id="municipio"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                placeholder="Ej. Santa Ana"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/areas" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Área'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AreaForm;
