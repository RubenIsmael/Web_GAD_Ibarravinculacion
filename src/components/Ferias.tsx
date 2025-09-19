import React, { useState } from 'react';
import { Calendar, Plus, Search, Filter, MapPin, Clock, Users, Eye, Edit, X, Settings, FileText } from 'lucide-react';
import '../styles/ferias.css';

interface Feria {
  id: number;
  nombre: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  participantes: number;
  estado: string;
  categoria: string;
  organizador: string;
}

const Ferias: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedFeria, setSelectedFeria] = useState<Feria | null>(null);
  const [ferias, setFerias] = useState<Feria[]>([
    {
      id: 1,
      nombre: 'Feria de Emprendimientos',
      descripcion: 'Espacio para promocionar emprendimientos locales',
      fecha: '2025-02-15',
      hora: '08:00 - 18:00',
      lugar: 'Parque Pedro Moncayo',
      participantes: 45,
      estado: 'programada',
      categoria: 'emprendimiento',
      organizador: 'Dpto. Desarrollo Económico'
    },
    {
      id: 2,
      nombre: 'Feria Gastronómica',
      descripcion: 'Muestra de gastronomía tradicional ibarreña',
      fecha: '2025-01-20',
      hora: '10:00 - 20:00',
      lugar: 'Plaza San Francisco',
      participantes: 28,
      estado: 'activa',
      categoria: 'gastronomia',
      organizador: 'Turismo Municipal'
    },
    {
      id: 3,
      nombre: 'Feria de Artesanías',
      descripcion: 'Exposición y venta de productos artesanales',
      fecha: '2025-01-10',
      hora: '09:00 - 17:00',
      lugar: 'Mercado Central',
      participantes: 62,
      estado: 'finalizada',
      categoria: 'artesanias',
      organizador: 'Cultura y Patrimonio'
    }
  ]);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    hora: '',
    lugar: '',
    categoria: 'emprendimiento',
    organizador: ''
  });

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'activa': return 'bg-green-100 text-green-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'emprendimiento': return 'bg-purple-100 text-purple-800';
      case 'gastronomia': return 'bg-orange-100 text-orange-800';
      case 'artesanias': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFerias = ferias.filter(feria => {
    const matchesSearch = feria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feria.lugar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || feria.estado === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Funciones para manejar los botones
  const handleViewFeria = (feria: Feria) => {
    setSelectedFeria(feria);
    setShowViewModal(true);
  };

  const handleEditFeria = (feria: Feria) => {
    setSelectedFeria(feria);
    setFormData({
      nombre: feria.nombre,
      descripcion: feria.descripcion,
      fecha: feria.fecha,
      hora: feria.hora,
      lugar: feria.lugar,
      categoria: feria.categoria,
      organizador: feria.organizador
    });
    setShowEditModal(true);
  };

  const handleDeleteFeria = (feria: Feria) => {
    setSelectedFeria(feria);
    setShowDeleteModal(true);
  };

  const handleChangeStatus = (feria: Feria) => {
    setSelectedFeria(feria);
    setShowStatusModal(true);
  };

  const handleCreateFeria = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fecha: '',
      hora: '',
      lugar: '',
      categoria: 'emprendimiento',
      organizador: ''
    });
    setShowModal(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newFeria: Feria = {
      id: Math.max(...ferias.map(f => f.id)) + 1,
      ...formData,
      participantes: 0,
      estado: 'programada'
    };
    setFerias([...ferias, newFeria]);
    setShowModal(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFeria) {
      const updatedFerias = ferias.map(feria =>
        feria.id === selectedFeria.id
          ? { ...feria, ...formData }
          : feria
      );
      setFerias(updatedFerias);
      setShowEditModal(false);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedFeria) {
      const updatedFerias = ferias.filter(feria => feria.id !== selectedFeria.id);
      setFerias(updatedFerias);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (selectedFeria) {
      const updatedFerias = ferias.map(feria =>
        feria.id === selectedFeria.id
          ? { ...feria, estado: newStatus }
          : feria
      );
      setFerias(updatedFerias);
      setShowStatusModal(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Simple export to JSON function (alternative to PDF)
  const exportFeriaData = (feria: Feria) => {
    const dataStr = JSON.stringify(feria, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Feria_${feria.nombre.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ferias-container">
      <div className="ferias-header">
        <h1 className="ferias-title">
          <Calendar className="w-8 h-8 text-red-600 mr-3" />
          Ferias
        </h1>
        <p className="ferias-subtitle">
          Gestión de ferias y eventos comerciales
        </p>
      </div>

      {/* Estadísticas */}
      <div className="ferias-stats-grid">
        <div className="ferias-stat-card">
          <div className="ferias-stat-content">
            <div>
              <p className="ferias-stat-text-sm">Total Ferias</p>
              <p className="ferias-stat-text-lg">{ferias.length}</p>
            </div>
            <div className="ferias-stat-icon-container bg-blue-100">
              <Calendar className="ferias-stat-icon text-blue-600" />
            </div>
          </div>
        </div>
        <div className="ferias-stat-card">
          <div className="ferias-stat-content">
            <div>
              <p className="ferias-stat-text-sm">Activas</p>
              <p className="ferias-stat-text-lg">{ferias.filter(f => f.estado === 'activa').length}</p>
            </div>
            <div className="ferias-stat-icon-container bg-green-100">
              <Calendar className="ferias-stat-icon text-green-600" />
            </div>
          </div>
        </div>
        <div className="ferias-stat-card">
          <div className="ferias-stat-content">
            <div>
              <p className="ferias-stat-text-sm">Participantes</p>
              <p className="ferias-stat-text-lg">{ferias.reduce((sum, f) => sum + f.participantes, 0)}</p>
            </div>
            <div className="ferias-stat-icon-container bg-purple-100">
              <Users className="ferias-stat-icon text-purple-600" />
            </div>
          </div>
        </div>
        <div className="ferias-stat-card">
          <div className="ferias-stat-content">
            <div>
              <p className="ferias-stat-text-sm">Este Mes</p>
              <p className="ferias-stat-text-lg">{ferias.filter(f => {
                const feriaDate = new Date(f.fecha);
                const now = new Date();
                return feriaDate.getMonth() === now.getMonth() && feriaDate.getFullYear() === now.getFullYear();
              }).length}</p>
            </div>
            <div className="ferias-stat-icon-container bg-orange-100">
              <Calendar className="ferias-stat-icon text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="ferias-filters">
        <div className="ferias-filters-container">
          <div className="ferias-search-container">
            <Search className="ferias-search-icon" />
            <input
              type="text"
              placeholder="Buscar ferias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ferias-search-input"
            />
          </div>

          <div className="ferias-filters-actions">
            <div className="ferias-filter-group">
              <Filter className="ferias-filter-icon" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="ferias-filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="programada">Programada</option>
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <button
              onClick={handleCreateFeria}
              className="ferias-add-button"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Feria</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de ferias */}
      <div className="ferias-grid">
        {filteredFerias.map((feria) => (
          <div key={feria.id} className="ferias-card">
            <div className="ferias-card-header">
              <div className="ferias-card-title-group">
                <div className="ferias-card-icon">
                  <Calendar />
                </div>
                <div>
                  <h3 className="ferias-card-name">{feria.nombre}</h3>
                  <p className="ferias-card-organizer">{feria.organizador}</p>
                </div>
              </div>
              <div className="ferias-card-status-group">
                <span className={`ferias-card-badge ${getCategoryColor(feria.categoria)}`}>
                  {feria.categoria}
                </span>
                <span className={`ferias-card-badge ${getStatusColor(feria.estado)}`}>
                  {feria.estado}
                </span>
              </div>
            </div>

            <p className="ferias-card-description">{feria.descripcion}</p>

            <div className="ferias-details-grid">
              <div className="ferias-detail-item">
                <Calendar className="ferias-detail-icon" />
                <div>
                  <p className="ferias-detail-label">Fecha</p>
                  <p className="ferias-detail-value">{feria.fecha}</p>
                </div>
              </div>
              <div className="ferias-detail-item">
                <Clock className="ferias-detail-icon" />
                <div>
                  <p className="ferias-detail-label">Horario</p>
                  <p className="ferias-detail-value">{feria.hora}</p>
                </div>
              </div>
              <div className="ferias-detail-item">
                <MapPin className="ferias-detail-icon" />
                <div>
                  <p className="ferias-detail-label">Lugar</p>
                  <p className="ferias-detail-value">{feria.lugar}</p>
                </div>
              </div>
              <div className="ferias-detail-item">
                <Users className="ferias-detail-icon" />
                <div>
                  <p className="ferias-detail-label">Participantes</p>
                  <p className="ferias-detail-value">{feria.participantes}</p>
                </div>
              </div>
            </div>

       <div className="ferias-card-footer">
              <button 
                className="ferias-action-button ferias-view-button"
                onClick={() => handleViewFeria(feria)}
              >
                <Eye className="w-4 h-4" />
                <span>Ver</span>
              </button>
              <button 
                className="ferias-action-button ferias-edit-button"
                onClick={() => handleEditFeria(feria)}
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button 
                className="ferias-action-button ferias-status-button"
                onClick={() => handleChangeStatus(feria)}
              >
                <Settings className="w-4 h-4" />
                <span>Estado</span>
              </button>
              <button 
                className="ferias-action-button bg-red-100 text-red-600 hover:bg-red-200"
                onClick={() => handleDeleteFeria(feria)}
              >
                <X className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para nueva feria */}
      {showModal && (
        <div className="ferias-modal-overlay">
          <div className="ferias-modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="ferias-modal-title">Nueva Feria</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitCreate} className="ferias-modal-form">
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Nombre de la Feria
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Ingrese el nombre"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="ferias-form-textarea"
                  rows={3}
                  placeholder="Ingrese la descripción"
                  required
                ></textarea>
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Horario
                </label>
                <input
                  type="text"
                  name="hora"
                  value={formData.hora}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Ej: 08:00 - 18:00"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Lugar
                </label>
                <input
                  type="text"
                  name="lugar"
                  value={formData.lugar}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Lugar del evento"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  required
                >
                  <option value="emprendimiento">Emprendimiento</option>
                  <option value="gastronomia">Gastronomía</option>
                  <option value="artesanias">Artesanías</option>
                </select>
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Organizador
                </label>
                <input
                  type="text"
                  name="organizador"
                  value={formData.organizador}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Departamento organizador"
                  required
                />
              </div>
              <div className="ferias-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ferias-cancel-button"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ferias-submit-button"
                >
                  Crear Feria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles */}
      {showViewModal && selectedFeria && (
        <div className="ferias-modal-overlay">
          <div className="ferias-modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="ferias-modal-title">Detalles de la Feria</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{selectedFeria.nombre}</h3>
                <p className="text-sm text-gray-600">{selectedFeria.organizador}</p>
              </div>
              <div>
                <p className="text-gray-700">{selectedFeria.descripcion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha</p>
                  <p className="text-gray-900">{selectedFeria.fecha}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Horario</p>
                  <p className="text-gray-900">{selectedFeria.hora}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Lugar</p>
                  <p className="text-gray-900">{selectedFeria.lugar}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Participantes</p>
                  <p className="text-gray-900">{selectedFeria.participantes}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedFeria.categoria)}`}>
                  {selectedFeria.categoria}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeria.estado)}`}>
                  {selectedFeria.estado}
                </span>
              </div>
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => exportFeriaData(selectedFeria)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Exportar Datos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar */}
      {showEditModal && selectedFeria && (
        <div className="ferias-modal-overlay">
          <div className="ferias-modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="ferias-modal-title">Editar Feria</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="ferias-modal-form">
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Nombre de la Feria
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Ingrese el nombre"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="ferias-form-textarea"
                  rows={3}
                  placeholder="Ingrese la descripción"
                  required
                ></textarea>
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Horario
                </label>
                <input
                  type="text"
                  name="hora"
                  value={formData.hora}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Ej: 08:00 - 18:00"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Lugar
                </label>
                <input
                  type="text"
                  name="lugar"
                  value={formData.lugar}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Lugar del evento"
                  required
                />
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  required
                >
                  <option value="emprendimiento">Emprendimiento</option>
                  <option value="gastronomia">Gastronomía</option>
                  <option value="artesanias">Artesanías</option>
                </select>
              </div>
              <div className="ferias-form-group">
                <label className="ferias-form-label">
                  Organizador
                </label>
                <input
                  type="text"
                  name="organizador"
                  value={formData.organizador}
                  onChange={handleInputChange}
                  className="ferias-form-input"
                  placeholder="Departamento organizador"
                  required
                />
              </div>
              <div className="ferias-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="ferias-cancel-button"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ferias-submit-button"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para cambiar estado */}
      {showStatusModal && selectedFeria && (
        <div className="ferias-modal-overlay">
          <div className="ferias-modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="ferias-modal-title">Cambiar Estado de Feria</h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Feria: <strong>{selectedFeria.nombre}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Estado actual: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeria.estado)}`}>
                  {selectedFeria.estado}
                </span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona el nuevo estado:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusChange('programada')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedFeria.estado === 'programada'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="font-medium text-gray-900">Programada</p>
                    <p className="text-xs text-gray-600">Evento planificado</p>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusChange('activa')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedFeria.estado === 'activa'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-6 h-6 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">Activa</p>
                    <p className="text-xs text-gray-600">En desarrollo</p>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusChange('finalizada')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedFeria.estado === 'finalizada'
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-6 h-6 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="font-medium text-gray-900">Finalizada</p>
                    <p className="text-xs text-gray-600">Evento completado</p>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusChange('cancelada')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedFeria.estado === 'cancelada'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-6 h-6 bg-red-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="font-medium text-gray-900">Cancelada</p>
                    <p className="text-xs text-gray-600">Evento suspendido</p>
                  </div>
                </button>
              </div>
            </div>
            <div className="ferias-modal-actions">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="ferias-cancel-button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && selectedFeria && (
        <div className="ferias-modal-overlay">
          <div className="ferias-modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="ferias-modal-title">Confirmar Eliminación</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                ¿Está seguro de que desea eliminar la feria "{selectedFeria.nombre}"?
              </p>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="ferias-modal-actions">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="ferias-cancel-button"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ferias;