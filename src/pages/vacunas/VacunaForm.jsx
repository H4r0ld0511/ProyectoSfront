import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import '../areas/AreaStyles.css';

const VacunaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: '',
    edadRecomendadaMeses: 0,
    dosisNumero: 1,
    descripcion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const loadVacuna = async () => {
        try {
          const data = await fetchApi(`/vaccines/${id}`);
          setFormData({
            nombre: data.nombre || '',
            edadRecomendadaMeses: data.edadRecomendadaMeses || 0,
            dosisNumero: data.dosisNumero || 1,
            descripcion: data.descripcion || ''
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setFetching(false);
        }
      };
      loadVacuna();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'edadRecomendadaMeses' || name === 'dosisNumero' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await fetchApi(`/vaccines/${id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi('/vaccines', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      navigate('/vacunas');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-state">Cargando vacuna...</div>;

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="header-with-back">
          <Link to="/vacunas" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="crud-title">{isEditing ? 'Editar Vacuna' : 'Nueva Vacuna'}</h1>
            <p className="crud-subtitle">Registra una nueva vacuna en el catálogo del sistema.</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="nombre">Nombre de la Vacuna *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. BCG, OPV, Rotavirus..."
                required
              />
            </div>
          </div>

          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="edadRecomendadaMeses">Edad Recomendada (en Meses) *</label>
              <input
                type="number"
                id="edadRecomendadaMeses"
                name="edadRecomendadaMeses"
                value={formData.edadRecomendadaMeses}
                onChange={handleChange}
                min="0"
                required
              />
              <small>Use 0 para recién nacidos.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="dosisNumero">Número de Dosis *</label>
              <input
                type="number"
                id="dosisNumero"
                name="dosisNumero"
                value={formData.dosisNumero}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="descripcion">Descripción Médica</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/vacunas" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Vacuna'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacunaForm;
