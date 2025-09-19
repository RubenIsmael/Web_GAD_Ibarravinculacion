import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import '../styles/requerimientos.css'; 

const Requerimientos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const requerimientos = [
    {
      id: 1,
      titulo: 'Licencia de Funcionamiento',
      descripcion: 'Solicitud de licencia para restaurant en zona centro',
      solicitante: 'María González',
      fecha: '2025-01-15',
      estado: 'pendiente',
      tipo: 'licencia'
    },
    {
      id: 2,
      titulo: 'Permiso de Construcción',
      descripcion: 'Ampliación de local comercial existente',
      solicitante: 'Carlos Rodríguez',
      fecha: '2025-01-14',
      estado: 'aprobado',
      tipo: 'construccion'
    },
    {
      id: 3,
      titulo: 'Registro Sanitario',
      descripcion: 'Registro para panadería y pastelería',
      solicitante: 'Ana Pérez',
      fecha: '2025-01-13',
      estado: 'rechazado',
      tipo: 'sanitario'
    }
  ];

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequerimientos = requerimientos.filter(req => {
    const matchesSearch = req.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || req.estado === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="req-container">
      {/* Encabezado */}
      <div className="req-header">
        <h1 className="req-title">
          <FileText className="req-title-icon" />
          Requerimientos
        </h1>
        <p className="req-subtitle">Gestión de solicitudes y permisos municipales</p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="req-filters-card">
        <div className="req-filters-container">
          <div className="req-search-container">
            <Search className="req-search-icon" />
            <input
              type="text"
              placeholder="Buscar requerimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="req-search-input"
            />
          </div>

          <div className="req-filters-actions">
            <div className="req-filter-group">
              <Filter className="req-filter-icon" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="req-filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="req-new-button"
            >
              <Plus className="req-new-button-icon" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de requerimientos */}
      <div className="req-list">
        {filteredRequerimientos.map((req) => (
          <div key={req.id} className="req-item">
            <div className="req-item-content">
              <div className="req-item-main">
                <div className="req-item-header">
                  <h3 className="req-item-title">{req.titulo}</h3>
                  <span className={`req-item-status ${getStatusColor(req.estado)}`}>
                    {req.estado.charAt(0).toUpperCase() + req.estado.slice(1)}
                  </span>
                </div>
                <p className="req-item-description">{req.descripcion}</p>
                <div className="req-item-meta">
                  <span>Solicitante: {req.solicitante}</span>
                  <span>Fecha: {req.fecha}</span>
                  <span>Tipo: {req.tipo}</span>
                </div>
              </div>

              <div className="req-item-actions">
                <button className="req-action-button req-action-view">
                  <Eye className="req-action-icon" />
                </button>
                <button className="req-action-button req-action-edit">
                  <Edit className="req-action-icon" />
                </button>
                <button className="req-action-button req-action-delete">
                  <Trash2 className="req-action-icon" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para nuevo requerimiento */}
      {showModal && (
        <div className="req-modal-overlay">
          <div className="req-modal">
            <h2 className="req-modal-title">Nuevo Requerimiento</h2>
            <form className="req-modal-form">
              <div className="req-form-group">
                <label className="req-form-label">
                  Título
                </label>
                <input
                  type="text"
                  className="req-form-input"
                  placeholder="Ingrese el título"
                />
              </div>
              <div className="req-form-group">
                <label className="req-form-label">
                  Descripción
                </label>
                <textarea
                  className="req-form-textarea"
                  rows={3}
                  placeholder="Ingrese la descripción"
                ></textarea>
              </div>
              <div className="req-form-group">
                <label className="req-form-label">
                  Solicitante
                </label>
                <input
                  type="text"
                  className="req-form-input"
                  placeholder="Nombre del solicitante"
                />
              </div>
              <div className="req-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="req-modal-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="req-modal-submit"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requerimientos;