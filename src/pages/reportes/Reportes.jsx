import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { formatAlertaMensaje } from '../../utils/alertMessage';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FileText, Download, Activity, Syringe, MapPin, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Reportes.css';
import '../areas/AreaStyles.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reportes = () => {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [ninos, setNinos] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  
  // Data Procesada
  const [reportData, setReportData] = useState({
    alertasNutricionales: [], // Niños con bajo peso / sobrepeso
    vacunasIncompletas: [], // Niños con vacunas pendientes atrasadas
    coberturaPorComunidad: [], // % de vacunas aplicadas por comunidad
  });

  const [activeTab, setActiveTab] = useState('NUTRICION'); // NUTRICION, VACUNAS, COBERTURA, GLOBAL

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(10);
        
        // 1. Cargar datos maestros
        const [ninosRaw, comunRaw] = await Promise.all([
          fetchApi('/children'),
          fetchApi('/communities')
        ]);
        
        const ninosList = Array.isArray(ninosRaw) ? ninosRaw : (ninosRaw.data || ninosRaw.value || []);
        const comunList = Array.isArray(comunRaw) ? comunRaw : (comunRaw.data || comunRaw.value || []);
        
        setNinos(ninosList);
        setComunidades(comunList);
        setLoadingProgress(30);

        // 2. Extraer data profunda (Alertas, Vacunas, Historial)
        let alertasTotales = [];
        let vacunasTotales = [];
        
        const totalNinos = ninosList.length;
        
        for (let i = 0; i < totalNinos; i++) {
          const n = ninosList[i];
          try {
            const [al, vac] = await Promise.all([
              fetchApi(`/child/${n.personaId}/alerts`).catch(() => []),
              fetchApi(`/vaccines/child/${n.personaId}`).catch(() => [])
            ]);
            
            const alArray = Array.isArray(al) ? al : (al.data || al.value || []);
            const vacArray = Array.isArray(vac) ? vac : (vac.data || vac.value || []);

            if (alArray.length > 0) alertasTotales.push({ nino: n, alertas: alArray });
            if (vacArray.length > 0) vacunasTotales.push({ nino: n, vacunas: vacArray });
            
          } catch (e) {
            console.error(e);
          }
          
          setLoadingProgress(30 + Math.floor(((i + 1) / totalNinos) * 60));
        }

        // 3. Procesar Filtros Analíticos
        
        // A. Nutrición
        const nutricion = alertasTotales.map(item => {
          const criticas = item.alertas.filter(a => a.tipo === 'CRITICA');
          if (criticas.length > 0) {
            return {
              CUI: item.nino.persona?.dpiCui || 'N/A',
              Paciente: `${item.nino.persona?.primerNombre} ${item.nino.persona?.primerApellido}`,
              Diagnóstico: criticas[0].titulo,
              Detalle: formatAlertaMensaje(criticas[0].mensaje).texto
            };
          }
          return null;
        }).filter(Boolean);

        // B. Vacunas Incompletas
        const incomp = vacunasTotales.map(item => {
          const pendientes = item.vacunas.filter(v => v.estado === 'PENDIENTE');
          if (pendientes.length > 0) {
            return {
              CUI: item.nino.persona?.dpiCui || 'N/A',
              Paciente: `${item.nino.persona?.primerNombre} ${item.nino.persona?.primerApellido}`,
              'Dosis Faltantes': pendientes.length,
              Vacunas: pendientes.map(p => p.vacuna?.nombre).join(', ')
            };
          }
          return null;
        }).filter(Boolean);

        // C. Cobertura
        const cobMap = {};
        comunList.forEach(c => {
          cobMap[c.id] = { nombre: c.nombre, aplicadas: 0, total: 0 };
        });

        vacunasTotales.forEach(item => {
          const comId = item.nino.persona?.comunidadId;
          if (comId && cobMap[comId]) {
            item.vacunas.forEach(v => {
              cobMap[comId].total++;
              if (v.estado === 'APLICADA') cobMap[comId].aplicadas++;
            });
          }
        });

        const coberturaList = Object.values(cobMap).map(c => ({
          Comunidad: c.nombre,
          'Dosis Aplicadas': c.aplicadas,
          'Total Esperado': c.total,
          'Cobertura (%)': c.total === 0 ? 0 : Math.round((c.aplicadas / c.total) * 100)
        })).filter(c => c.totalEsperado > 0);

        setReportData({
          alertasNutricionales: nutricion,
          vacunasIncompletas: incomp,
          coberturaPorComunidad: coberturaList
        });

        setLoadingProgress(100);
      } catch (err) {
        console.error("Error al procesar reportes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Funciones de Exportación PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableStyles = {
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 4 }
    };

    const addTitle = (title, yPos) => {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(title, 14, yPos);
    };

    // Header Principal
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text('Ministerio de Salud Pública y Asistencia Social', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 26);
    
    let currentY = 35;

    if (activeTab === 'NUTRICION' || activeTab === 'GLOBAL') {
      addTitle('Reporte: Casos Clínicos de Riesgo Nutricional', currentY);
      
      const rows = reportData.alertasNutricionales.map(n => [n.CUI, n.Paciente, n.Diagnóstico, n.Detalle]);
      autoTable(doc, { 
        startY: currentY + 5, 
        head: [["CUI", "Paciente", "Diagnóstico", "Detalle"]], 
        body: rows, 
        ...tableStyles 
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } 
    
    if (activeTab === 'VACUNAS' || activeTab === 'GLOBAL') {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      addTitle('Reporte: Pacientes con Esquema de Vacunación Pendiente', currentY);
      
      const rows = reportData.vacunasIncompletas.map(n => [n.CUI, n.Paciente, n['Dosis Faltantes'], n.Vacunas]);
      autoTable(doc, { 
        startY: currentY + 5, 
        head: [["CUI", "Paciente", "Dosis Faltantes", "Vacunas Pendientes"]], 
        body: rows, 
        ...tableStyles 
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    if (activeTab === 'COBERTURA' || activeTab === 'GLOBAL') {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      addTitle('Reporte: Índice de Cobertura por Comunidad', currentY);
      
      const rows = reportData.coberturaPorComunidad.map(n => [n.Comunidad, n['Dosis Aplicadas'], n['Total Esperado'], `${n['Cobertura (%)']}%`]);
      autoTable(doc, { 
        startY: currentY + 5, 
        head: [["Comunidad", "Dosis Aplicadas", "Total Esperado", "Cobertura (%)"]], 
        body: rows, 
        ...tableStyles 
      });
    }

    doc.save(`SCCVI_Reporte_${activeTab}_${new Date().getTime()}.pdf`);
  };

  // Funciones de Exportación Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Función auxiliar para crear y estilizar hojas
    const appendStyledSheet = (dataArray, sheetName) => {
      const ws = XLSX.utils.json_to_sheet(dataArray);
      
      // Ajustar anchos de columnas
      const colWidths = [];
      if (dataArray.length > 0) {
        Object.keys(dataArray[0]).forEach(key => {
          colWidths.push({ wch: Math.max(key.length + 5, 20) });
        });
      }
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    if (activeTab === 'NUTRICION' || activeTab === 'GLOBAL') {
      appendStyledSheet(reportData.alertasNutricionales, "Riesgo Nutricional");
    }
    if (activeTab === 'VACUNAS' || activeTab === 'GLOBAL') {
      appendStyledSheet(reportData.vacunasIncompletas, "Vacunas Incompletas");
    }
    if (activeTab === 'COBERTURA' || activeTab === 'GLOBAL') {
      appendStyledSheet(reportData.coberturaPorComunidad, "Cobertura Comunidades");
    }

    XLSX.writeFile(wb, `SCCVI_Data_${activeTab}_${new Date().getTime()}.xlsx`);
  };

  // Renderizado del Dashboard de Métricas
  const renderDashboard = () => {
    const totalNinos = ninos.length;
    const conRiesgo = reportData.alertasNutricionales.length;
    const saludables = totalNinos - conRiesgo;

    const nutricionChart = [
      { name: 'Riesgo Clínico', value: conRiesgo },
      { name: 'Crecimiento Normal', value: saludables > 0 ? saludables : 0 }
    ];

    return (
      <div className="report-dashboard-grid">
        <div className="report-card">
          <h3><Activity size={18} color="#ef4444" /> Estado Nutricional Global</h3>
          <div style={{ height: '220px', width: '100%' }}>
            {totalNinos > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={nutricionChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>Sin datos</p></div>}
          </div>
        </div>

        <div className="report-card">
          <h3><MapPin size={18} color="#3b82f6" /> Comunidades Analizadas</h3>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3b82f6' }}>
              {reportData.coberturaPorComunidad.length}
            </div>
            <p style={{ color: '#64748b' }}>Comunidades con registros de vacunación activos.</p>
          </div>
        </div>
        
        <div className="report-card">
          <h3><Syringe size={18} color="#f59e0b" /> Alerta de Inmunización</h3>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#f59e0b' }}>
              {reportData.vacunasIncompletas.length}
            </div>
            <p style={{ color: '#64748b' }}>Pacientes requieren seguimiento por vacunas pendientes.</p>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado de Tablas
  const renderTable = () => {
    if (activeTab === 'GLOBAL') {
      return (
        <div className="empty-state">
          <Activity size={48} color="#3b82f6" style={{marginBottom: '16px'}} />
          <h3>Reporte Global Seleccionado</h3>
          <p>Al hacer clic en Exportar, se descargarán todos los módulos en un solo archivo.</p>
        </div>
      );
    }

    if (activeTab === 'NUTRICION') {
      return (
        <table className="modern-table">
          <thead>
            <tr>
              <th>CUI</th>
              <th>Nombre del Paciente</th>
              <th>Diagnóstico / Alerta</th>
              <th>Observación del Sistema</th>
            </tr>
          </thead>
          <tbody>
            {reportData.alertasNutricionales.length === 0 ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>No se detectaron pacientes con anomalías en su última evaluación.</td></tr>
            ) : (
              reportData.alertasNutricionales.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.CUI}</td>
                  <td className="fw-500">{item.Paciente}</td>
                  <td style={{color: '#ef4444', fontWeight: 'bold'}}>{item.Diagnóstico}</td>
                  <td>{item.Detalle}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
    
    if (activeTab === 'VACUNAS') {
      return (
        <table className="modern-table">
          <thead>
            <tr>
              <th>CUI</th>
              <th>Nombre del Paciente</th>
              <th>Dosis Pendientes</th>
              <th>Vacunas Faltantes</th>
            </tr>
          </thead>
          <tbody>
            {reportData.vacunasIncompletas.length === 0 ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>Todos los pacientes tienen su esquema al día.</td></tr>
            ) : (
              reportData.vacunasIncompletas.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.CUI}</td>
                  <td className="fw-500">{item.Paciente}</td>
                  <td style={{color: '#f59e0b', fontWeight: 'bold'}}>{item['Dosis Faltantes']}</td>
                  <td>{item.Vacunas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'COBERTURA') {
      return (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Comunidad</th>
              <th>Dosis Aplicadas</th>
              <th>Total Esperado</th>
              <th>Índice de Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {reportData.coberturaPorComunidad.length === 0 ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>No hay datos suficientes por comunidad.</td></tr>
            ) : (
              reportData.coberturaPorComunidad.map((item, idx) => (
                <tr key={idx}>
                  <td className="fw-500">{item.Comunidad}</td>
                  <td>{item['Dosis Aplicadas']}</td>
                  <td>{item['Total Esperado']}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
                        <div style={{ 
                          width: `${item['Cobertura (%)']}%`, 
                          background: item['Cobertura (%)'] >= 80 ? '#10b981' : item['Cobertura (%)'] >= 50 ? '#f59e0b' : '#ef4444', 
                          height: '100%', 
                          borderRadius: '4px' 
                        }}></div>
                      </div>
                      <span style={{ fontWeight: 'bold', minWidth: '40px' }}>{item['Cobertura (%)']}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
  };

  if (loading) {
    return (
      <div className="report-container">
        <div className="loading-progress">
          <Loader2 size={48} color="#3b82f6" className="spinner" style={{ marginBottom: '20px' }} />
          <h2>Procesando Inteligencia de Datos</h2>
          <p>Extrayendo historiales, cruzando expedientes y generando métricas...</p>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${loadingProgress}%` }}></div>
          </div>
          <p>{loadingProgress}% completado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Reportes Gerenciales y Dashboard Analítico</h1>
        <p>Centro de inteligencia epidemiológica del SCCVI. Visualice y exporte los datos oficiales.</p>
      </div>

      {renderDashboard()}

      <div className="report-controls">
        <div className="report-filters">
          <label style={{ marginRight: '12px', fontWeight: 'bold', color: '#1e293b' }}>Seleccionar Reporte:</label>
          <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
            <option value="NUTRICION">Pacientes con Bajo Peso / Sobrepeso</option>
            <option value="VACUNAS">Pacientes con Esquema de Vacunación Incompleto</option>
            <option value="COBERTURA">Índice de Cobertura de Vacunación por Comunidad</option>
            <option value="GLOBAL">📊 Reporte Global Consolidado (TODOS LOS DATOS)</option>
          </select>
        </div>
        <div className="report-actions">
          <button onClick={exportToPDF} className="btn-export pdf" title="Exportar a PDF">
            <FileText size={18} /> Descargar PDF
          </button>
          <button onClick={exportToExcel} className="btn-export excel" title="Exportar a Excel">
            <Download size={18} /> Descargar Excel
          </button>
        </div>
      </div>

      <div className="table-card">
        {renderTable()}
      </div>
    </div>
  );
};

export default Reportes;
