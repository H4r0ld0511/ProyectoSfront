import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  required,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find selected option
  let selectedOption = null;
  for (const group of options) {
    const found = group.options.find(opt => opt.value === value || opt.value === Number(value) || opt.value === String(value));
    if (found) {
      selectedOption = found;
      break;
    }
  }

  // Filter options based on search term
  const filteredOptions = options.map(group => ({
    ...group,
    options: group.options.filter(opt => 
      opt.searchStr.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.options.length > 0);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
          backgroundColor: disabled ? '#f1f5f9' : 'white', cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '42px',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ color: selectedOption ? '#0f172a' : '#94a3b8', fontSize: '0.95rem' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} color="#64748b" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          marginTop: '4px', backgroundColor: 'white', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #cbd5e1',
          zIndex: 50, maxHeight: '350px', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
            <input 
              type="text" 
              autoFocus
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ overflowY: 'auto', paddingBottom: '8px' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((group, groupIdx) => (
                <div key={groupIdx}>
                  <div style={{ 
                    padding: '8px 12px', fontSize: '0.8rem', fontWeight: 'bold', 
                    color: '#64748b', backgroundColor: '#f8fafc', textTransform: 'uppercase'
                  }}>
                    {group.label}
                  </div>
                  {group.options.map((opt, optIdx) => (
                    <div 
                      key={optIdx}
                      onClick={() => {
                        onChange({ target: { name, value: opt.value } });
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: '0.95rem',
                        backgroundColor: value === opt.value || Number(value) === opt.value ? '#e2e8f0' : 'transparent',
                        color: value === opt.value || Number(value) === opt.value ? '#0f172a' : '#334155'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = (value === opt.value || Number(value) === opt.value) ? '#e2e8f0' : '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = (value === opt.value || Number(value) === opt.value) ? '#e2e8f0' : 'transparent'}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div style={{ padding: '15px', color: '#64748b', textAlign: 'center', fontSize: '0.95rem' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Hidden input to handle validation */}
      {required && !value && (
         <input type="text" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none', top: '50%', left: '50%' }} required />
      )}
    </div>
  );
};

export default SearchableSelect;
