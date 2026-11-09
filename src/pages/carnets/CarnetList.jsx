import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { Edit2, Trash2, HeartPulse, Plus, Search, CheckCircle, Clock, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../areas/AreaStyles.css';
import SearchableSelect from '../../components/SearchableSelect';

const CarnetList = () => {
  const [ninos, setNinos] = useState([]);
  const [selectedNinoId, setSelectedNinoId] = useState('');
  
  const [carnet, setCarnet] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Cargar la lista de niños para el selector
  useEffect(() => {
    const loadNinos = async () => {
      try {
        const data = await fetchApi('/children');
        setNinos(data);
      } catch (err) {
        console.error('Error al cargar niños', err);
      }
    };
    loadNinos();
  }, []);

  // 2. Cargar el historial de vacunación cuando se selecciona un niño
  useEffect(() => {
    if (!selectedNinoId) {
      setCarnet([]);
      return;
    }

    const loadCarnet = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchApi(`/vaccines/child/${selectedNinoId}`);
        // data.data si el backend envía { message, data: [...] }
        setCarnet(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCarnet();
  }, [selectedNinoId]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro de vacunación?')) return;
    
    try {
      await fetchApi(`/vaccines/apply/${id}`, { method: 'DELETE' });
      setCarnet(carnet.filter(c => c.id !== id));
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const getStatusBadge = (estado) => {
    if (estado === 'APLICADA') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}><CheckCircle size={14} /> Aplicada</span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}><Clock size={14} /> Pendiente</span>;
  };

  const ninoOptions = [
    {
      label: "Pacientes",
      options: ninos.map(n => {
        let tutorStr = '';
        if (n.tutores && n.tutores.length > 0) {
          tutorStr = n.tutores.map(t => `${t.persona?.dpiCui || ''} ${t.persona?.primerNombre || ''} ${t.persona?.segundoNombre || ''} ${t.persona?.primerApellido || ''} ${t.persona?.segundoApellido || ''}`).join(' ');
        }
        return {
          value: n.personaId,
          label: `${n.persona?.dpiCui || 'S/DPI'} - ${n.persona?.primerNombre || ''} ${n.persona?.primerApellido || ''}`,
          searchStr: `${n.persona?.dpiCui || ''} ${n.persona?.primerNombre || ''} ${n.persona?.segundoNombre || ''} ${n.persona?.primerApellido || ''} ${n.persona?.segundoApellido || ''} ${tutorStr}`
        };
      })
    }
  ].filter(group => group.options.length > 0);

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Carnet de Vacunación</h1>
          <p className="crud-subtitle">Gestión de vacunas aplicadas y programadas por paciente.</p>
        </div>
        <Link to="/carnet/create" className="btn-primary">
          <Plus size={18} />
          <span>Aplicar/Programar Vacuna</span>
        </Link>
      </div>

      {/* Selector de Niño y Botón Descarga */}
      <div className="form-card" style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div className="form-group" style={{ flex: '1 1 300px', margin: 0 }}>
          <label htmlFor="ninoSelect" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} /> Seleccione un Paciente Pediátrico para ver su Carnet:
          </label>
          <div style={{ marginTop: '12px' }}>
            <SearchableSelect
              name="ninoSelect"
              options={ninoOptions}
              value={selectedNinoId ? Number(selectedNinoId) : ''}
              onChange={(e) => setSelectedNinoId(e.target.value)}
              placeholder="-- Buscar y Seleccionar Paciente --"
              required={false}
            />
          </div>
        </div>
        
        {selectedNinoId && carnet.length > 0 && (
          <button 
            onClick={() => {
              const doc = new jsPDF();
              const nino = ninos.find(n => String(n.personaId) === String(selectedNinoId));
              const nombre = nino ? `${nino.persona?.primerNombre} ${nino.persona?.primerApellido}` : 'Paciente';

              doc.setFontSize(18);
              doc.text('Carnet de Vacunación Oficial', 14, 22);
              
              doc.setFontSize(11);
              doc.text(`Paciente: ${nombre}`, 14, 30);
              if (nino?.persona?.dpiCui) doc.text(`CUI: ${nino.persona.dpiCui}`, 14, 36);
              doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 42);

              const tableColumn = ["Vacuna", "Dosis", "Fecha Prog.", "Fecha Aplic.", "Estado"];
              const tableRows = carnet.map(c => [
                c.vacuna?.nombre || '-',
                `Dosis #${c.vacuna?.dosisNumero || '-'}`,
                new Date(c.fechaProgramada).toLocaleDateString(),
                c.fechaAplicacion ? new Date(c.fechaAplicacion).toLocaleDateString() : '-',
                c.estado || 'PENDIENTE'
              ]);

              autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [59, 130, 246] }
              });

              doc.save(`Carnet_Vacunacion_${nombre.replace(/\s+/g, '_')}.pdf`);
            }}
            className="btn-primary"
            style={{ backgroundColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', height: 'fit-content' }}
          >
            <Download size={18} />
            Exportar PDF
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Cargando carnet de vacunación...</div>
        ) : !selectedNinoId ? (
          <div className="empty-state">
            <HeartPulse size={48} className="empty-icon" />
            <h3>Seleccione un Paciente</h3>
            <p>Utilice el menú superior para ver las vacunas del paciente.</p>
          </div>
        ) : carnet.length === 0 ? (
          <div className="empty-state">
            <HeartPulse size={48} className="empty-icon" />
            <h3>Carnet Vacío</h3>
            <p>Este paciente aún no tiene vacunas registradas o programadas.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Vacuna</th>
                <th>Dosis</th>
                <th>F. Programada</th>
                <th>F. Aplicación</th>
                <th>Estado</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carnet.map(c => (
                <tr key={c.id}>
                  <td className="fw-500">{c.vacuna?.nombre}</td>
                  <td>#{c.vacuna?.dosisNumero}</td>
                  <td>{new Date(c.fechaProgramada).toLocaleDateString()}</td>
                  <td>{c.fechaAplicacion ? new Date(c.fechaAplicacion).toLocaleDateString() : '-'}</td>
                  <td>{getStatusBadge(c.estado)}</td>
                  <td className="actions-cell">
                    <Link to={`/carnet/edit/${c.id}`} className="action-btn edit" title="Editar / Aplicar">
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => handleDelete(c.id)} className="action-btn delete" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CarnetList;
