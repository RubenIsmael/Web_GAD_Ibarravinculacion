import React, { useState, useEffect, useCallback } from 'react';
import { Store, Search, Filter, Eye, Building, User, Calendar, FileText, Download, X } from 'lucide-react';
import { ApiLocalesComerciales, BusinessAPI, ApiResponse } from './login/ApiLocalesComerciales';
import '../styles/localesComerciales.css';

const apiService = new ApiLocalesComerciales();

interface BusinessStats {
  totalNegocios: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
}

const LocalesComerciales: React.FC = () => {
  const [negocios, setNegocios] = useState<BusinessAPI[]>([]);
  const [negociosFiltrados, setNegociosFiltrados] = useState<BusinessAPI[]>([]);
  const [stats, setStats] = useState<BusinessStats>({
    totalNegocios: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0
  });
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [currentPhotos, setCurrentPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedNegocio, setSelectedNegocio] = useState<BusinessAPI | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [localesDelUsuario, setLocalesDelUsuario] = useState<BusinessAPI[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const verificarToken = (): boolean => {
    const token = apiService.getCurrentToken();
    const isAuth = apiService.isAuthenticated();
    if (!isAuth || !token) {
      setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
      return false;
    }
    if (apiService.isTokenExpired()) {
      setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      apiService.clearToken();
      return false;
    }
    return true;
  };

  const aprobarNegocio = async (businessId: number) => {
    return await apiService.approveBusiness(businessId);
  };

  const rechazarNegocio = async (businessId: number, reason: string) => {
    return await apiService.rejectBusiness(businessId, reason);
  };

  const obtenerDetallesCompletos = async (businessId: number): Promise<{ photos: any[] }> => {
    try {
      if (!verificarToken()) {
        throw new Error('Token no válido');
      }

      console.log(`🔍 Obteniendo detalles completos para negocio ${businessId}`);
      
      const detalles = await apiService.getBusinessDetails(businessId);
      
      if (detalles.success && detalles.data) {
        console.log(`✅ Se cargaron ${detalles.data.photos.length} fotos exitosamente:`, detalles.data.photos);
        
        // Procesar las fotos para corregir URLs
        const photosProcessed = detalles.data.photos.map((photo: any, index: number) => ({
          ...photo,
          url: photo.url ? apiService.corregirURL(photo.url) : ''
        }));
        
        return { photos: photosProcessed };
      }

      // Si no hay fotos en el endpoint, intentar construir desde los datos locales del negocio
      console.log("🔄 No se encontraron fotos en endpoint, intentando construir desde datos locales...");
      
      const negocio = negocios.find(n => n.id === businessId);
      if (!negocio) {
        console.log("❌ No se encontró el negocio en los datos locales");
        return { photos: [] };
      }

      const localPhotos = [];
      
      if (negocio.cedulaFileUrl) {
        localPhotos.push({
          id: `cedula_${businessId}`,
          url: apiService.corregirURL(negocio.cedulaFileUrl),
          photoType: 'DOCUMENT',
          fileType: 'cedula',
          originalName: 'Cédula/RUC'
        });
      }
      
      if (negocio.logoUrl) {
        localPhotos.push({
          id: `logo_${businessId}`,
          url: apiService.corregirURL(negocio.logoUrl),
          photoType: 'LOGO',
          fileType: 'logo',
          originalName: 'Logo del negocio'
        });
      }
      
      if (negocio.signatureUrl) {
        localPhotos.push({
          id: `signature_${businessId}`,
          url: apiService.corregirURL(negocio.signatureUrl),
          photoType: 'SIGNATURE',
          fileType: 'signature',
          originalName: 'Firma'
        });
      }

      if (localPhotos.length > 0) {
        console.log(`📸 Se construyeron ${localPhotos.length} fotos desde datos locales`);
        return { photos: localPhotos };
      }

      console.log("📭 No se encontraron fotos en ningún lado");
      return { photos: [] };
      
    } catch (error) {
      console.error('💥 Error general al obtener detalles completos:', error);
      return { photos: [] };
    }
  };

  const descargarImagen = async (url: string, filename: string) => {
    try {
      const urlCorregida = apiService.corregirURL(url);
      const link = document.createElement('a');
      link.href = urlCorregida;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      try {
        window.open(url, '_blank');
      } catch (fallbackError) {
        alert('No se pudo descargar la imagen. Intente hacer clic derecho y "Guardar imagen como..."');
      }
    }
  };

  const cargarFotos = async (businessId: number) => {
    try {
      setLoadingPhotos(true);
      setPhotosError('');
      
      console.log(`🚀 Iniciando carga de fotos para negocio ${businessId}`);
      console.log(`📋 Datos del negocio:`, negocios.find(n => n.id === businessId));
      
      const detalles = await obtenerDetallesCompletos(businessId);
      
      if (detalles && detalles.photos && detalles.photos.length > 0) {
        console.log(`✅ Se cargaron ${detalles.photos.length} fotos exitosamente:`, detalles.photos);
        setCurrentPhotos(detalles.photos);
        setPhotosError('');
      } else {
        console.log('📭 No se encontraron fotos después de intentar todos los métodos');
        setCurrentPhotos([]);
        
        // Mostrar información útil para debugging
        const negocio = negocios.find(n => n.id === businessId);
        if (negocio) {
          console.log('🔍 URLs disponibles en el negocio:', {
            cedulaFileUrl: negocio.cedulaFileUrl,
            logoUrl: negocio.logoUrl,
            signatureUrl: negocio.signatureUrl
          });
        }
        
        setPhotosError('No se encontraron fotos para este negocio. Verifique la consola para más detalles.');
      }
    } catch (err) {
      console.error('❌ Error al cargar fotos:', err);
      setPhotosError('Error al cargar las fotos del negocio. Verifique la conexión y la consola.');
      setCurrentPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const abrirModalFotos = async (negocio: BusinessAPI) => {
    setSelectedNegocio(negocio);
    setShowPhotosModal(true);
    await cargarFotos(negocio.id);
  };

  const agruparNegociosPorUsuario = (negocios: BusinessAPI[]) => {
    const grupos = new Map<string, BusinessAPI[]>();
    negocios.forEach(negocio => {
      const userId = negocio.user.id.toString();
      if (!grupos.has(userId)) {
        grupos.set(userId, []);
      }
      grupos.get(userId)!.push(negocio);
    });
    return Array.from(grupos.entries()).map(([userId, negociosDelUsuario]) => ({
      userId,
      user: negociosDelUsuario[0].user,
      negocios: negociosDelUsuario
    }));
  };

  const abrirDocumentos = async (negocio: BusinessAPI) => {
    try {
      let localesDelUsuario = negocios.filter(n => n.user.id === negocio.user.id);
      if (filterStatus !== 'all') {
        const statusMap: { [key: string]: string } = {
          'activo': 'APPROVED',
          'pendiente': 'PENDING',
          'inactivo': 'REJECTED'
        };
        if (filterStatus === 'activo') {
          localesDelUsuario = localesDelUsuario.filter(negocio => 
            apiService.validarEstadoNegocio(negocio.validationStatus) === 'APPROVED'
          );
        } else {
          const apiStatus = statusMap[filterStatus] || filterStatus;
          localesDelUsuario = localesDelUsuario.filter(negocio => 
            apiService.validarEstadoNegocio(negocio.validationStatus) === apiService.validarEstadoNegocio(apiStatus)
          );
        }
      }
      setLocalesDelUsuario(localesDelUsuario);
      setSelectedNegocio(negocio);
      setShowDocumentsModal(true);
    } catch (error) {
      alert('Error al abrir los locales del usuario');
    }
  };

  const loadNegocios = async () => {
    try {
      setLoading(true);
      setError('');
      if (!verificarToken()) {
        setLoading(false);
        return;
      }
      
      let allNegocios: BusinessAPI[] = [];
      let page = 0;
      const size = 100;
      let totalPages = 1;
      
      do {
        const response = await apiService.getPrivateBusinessList(page, size);
        
        if (response.success && response.data?.data) {
          const pageData = response.data.data;
          allNegocios = [...allNegocios, ...pageData.content];
          totalPages = pageData.totalPages;
          page++;
        } else {
          break;
        }
      } while (page < totalPages);
      
      if (allNegocios.length > 0) {
        const negociosLimpios = allNegocios.filter((negocio: any) => {
          return negocio && negocio.id;
        });
        setNegocios(negociosLimpios);
        setTimeout(() => filtrarNegocios(), 0);
        calculateStats(negociosLimpios, negociosLimpios.length);
      } else {
        setError('No se encontraron negocios.');
        setNegocios([]);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          setError('Error de conexión. Verifique que el servidor esté disponible.');
        } else if (err.message.includes('timeout') || err.message.includes('AbortError')) {
          setError('La conexión tardó demasiado tiempo. Intente nuevamente.');
        } else {
          setError(`Error de conexión: ${err.message}`);
        }
      } else {
        setError('Error de conexión al cargar negocios. Verifique su conexión a internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (negociosList: BusinessAPI[], total: number) => {
    const pendientes = negociosList.filter(n => apiService.validarEstadoNegocio(n.validationStatus) === 'PENDING').length;
    const aprobados = negociosList.filter(n => apiService.validarEstadoNegocio(n.validationStatus) === 'APPROVED').length;
    const rechazados = negociosList.filter(n => apiService.validarEstadoNegocio(n.validationStatus) === 'REJECTED').length;
    setStats({
      totalNegocios: total,
      pendientes,
      aprobados,
      rechazados
    });
  };

  const filtrarNegocios = useCallback(() => {
    let negociosFiltrados = negocios;
    if (filterStatus !== 'all') {
      const statusMap: { [key: string]: string } = {
        'activo': 'APPROVED',
        'pendiente': 'PENDING',
        'inactivo': 'REJECTED'
      };
      const apiStatus = statusMap[filterStatus] || filterStatus;
      negociosFiltrados = negociosFiltrados.filter(negocio => {
        if (filterStatus === 'activo') {
          return apiService.validarEstadoNegocio(negocio.validationStatus) === 'APPROVED';
        }
        return apiService.validarEstadoNegocio(negocio.validationStatus) === apiService.validarEstadoNegocio(apiStatus);
      });
    }
    if (searchTerm.trim() !== '') {
      const terminoBusqueda = searchTerm.toLowerCase();
      negociosFiltrados = negociosFiltrados.filter(negocio =>
        (negocio.commercialName && negocio.commercialName.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.representativeName && negocio.representativeName.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.email && negocio.email.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.cedulaOrRuc && negocio.cedulaOrRuc.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.phone && negocio.phone.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.parishCommunitySector && negocio.parishCommunitySector.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.category && negocio.category.name && negocio.category.name.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.user.name && negocio.user.name.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.user.email && negocio.user.email.toLowerCase().includes(terminoBusqueda)) ||
        (negocio.user.identification && negocio.user.identification.toLowerCase().includes(terminoBusqueda))
      );
    }
    setNegociosFiltrados(negociosFiltrados);
  }, [negocios, filterStatus, searchTerm]);

  const handleFilterChange = (newFilter: string) => {
    setFilterStatus(newFilter);
    setTimeout(() => filtrarNegocios(), 0);
  };

  useEffect(() => {
    const inicializar = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!verificarToken()) {
        setError('No hay sesión válida. Por favor, inicie sesión.');
        return;
      }
      loadNegocios();
    };
    inicializar();
  }, []);

  useEffect(() => {
    if (!apiService.isAuthenticated()) return;
    const delayedSearch = setTimeout(() => {
      filtrarNegocios();
    }, 500);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filtrarNegocios]);

  useEffect(() => {
    if (negocios.length > 0) {
      filtrarNegocios();
    }
  }, [negocios, filtrarNegocios]);

  const getStatusColor = (estado: string | undefined): string => {
    if (!estado) return 'bg-gray-100 text-gray-800';
    switch (estado) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (categoria: string | undefined): string => {
    if (!categoria) return 'bg-gray-100 text-gray-800';
    const categoriaLower = categoria.toLowerCase();
    if (categoriaLower.includes('alimento')) return 'bg-orange-100 text-orange-800';
    if (categoriaLower.includes('comercio')) return 'bg-blue-100 text-blue-800';
    if (categoriaLower.includes('salud')) return 'bg-purple-100 text-purple-800';
    if (categoriaLower.includes('servicio')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatEstadoText = (estado: string | undefined) => {
    if (!estado) return 'Sin estado';
    switch (estado) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return estado;
    }
  };

  const formatDeliveryService = (service: string | undefined) => {
    if (!service) return 'No especificado';
    switch (service) {
      case 'BAJO_PEDIDO': return 'Bajo pedido';
      case 'DISPONIBLE': return 'Disponible';
      case 'NO_DISPONIBLE': return 'No disponible';
      default: return service;
    }
  };

  const formatSalePlace = (place: string | undefined) => {
    if (!place) return 'No especificado';
    switch (place) {
      case 'FERIAS': return 'Ferias';
      case 'LOCAL': return 'Local';
      case 'DOMICILIO': return 'Domicilio';
      case 'ONLINE': return 'Online';
      default: return place;
    }
  };

  return (
    <div className="locales-container">
      <div className="locales-header">
        <h1 className="locales-title">
          <User className="w-8 h-8 text-red-600 mr-3" />
          Usuarios con Locales Comerciales
        </h1>
        <p className="locales-subtitle">
          Gestión de usuarios y sus locales comerciales asociados
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
            <div className="flex gap-2">
              {error.includes('sesión') && (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Recargar página
                </button>
              )}
              <button
                onClick={() => {
                  setError('');
                  if (apiService.isAuthenticated()) {
                    loadNegocios();
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="locales-stats-grid">
        <div className="locales-stat-card">
          <div className="locales-stat-content">
            <div>
              <p className="locales-stat-text-sm">Total Usuarios</p>
              <p className="locales-stat-text-lg">{agruparNegociosPorUsuario(negocios).length}</p>
            </div>
            <div className="locales-stat-icon-container bg-blue-100">
              <User className="locales-stat-icon text-blue-600" />
            </div>
          </div>
        </div>
        <div className="locales-stat-card">
          <div className="locales-stat-content">
            <div>
              <p className="locales-stat-text-sm">Aprobados</p>
              <p className="locales-stat-text-lg">{stats.aprobados}</p>
            </div>
            <div className="locales-stat-icon-container bg-green-100">
              <Building className="locales-stat-icon text-green-600" />
            </div>
          </div>
        </div>
        <div className="locales-stat-card">
          <div className="locales-stat-content">
            <div>
              <p className="locales-stat-text-sm">Pendientes</p>
              <p className="locales-stat-text-lg">{stats.pendientes}</p>
            </div>
            <div className="locales-stat-icon-container bg-yellow-100">
              <Calendar className="locales-stat-icon text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="locales-stat-card">
          <div className="locales-stat-content">
            <div>
              <p className="locales-stat-text-sm">Rechazados</p>
              <p className="locales-stat-text-lg">{stats.rechazados}</p>
            </div>
            <div className="locales-stat-icon-container bg-red-100">
              <X className="locales-stat-icon text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="locales-filters">
        <div className="locales-filters-container">
          <div className="locales-search-container">
            <Search className="locales-search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre de usuario, email, cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  filtrarNegocios();
                }
              }}
              className="locales-search-input"
              disabled={!apiService.isAuthenticated() || loading}
            />
          </div>
          <div className="locales-filters-actions">
            <div className="locales-filter-group">
              <Filter className="locales-filter-icon" />
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="locales-filter-select"
                disabled={!apiService.isAuthenticated() || loading}
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="activo">Aprobado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">
            {negocios.length === 0 ? 'Cargando todos los negocios...' : 'Actualizando...'}
          </span>
        </div>
      )}

      {!loading && negociosFiltrados.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {agruparNegociosPorUsuario(negociosFiltrados).length} de {agruparNegociosPorUsuario(negocios).length} usuarios
          {filterStatus !== 'all' && ` (filtrado por: ${formatEstadoText(filterStatus === 'activo' ? 'APPROVED' : filterStatus === 'pendiente' ? 'PENDING' : 'REJECTED')})`}
          {searchTerm && ` (búsqueda: "${searchTerm}")`}
        </div>
      )}

      <div className="locales-list">
        {!loading && negociosFiltrados.length === 0 && negocios.length > 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No se encontraron negocios</p>
              <p className="text-sm">
                {filterStatus !== 'all'
                  ? `No hay negocios con estado "${formatEstadoText(filterStatus === 'activo' ? 'APPROVED' : filterStatus === 'pendiente' ? 'PENDING' : 'REJECTED')}"`
                  : searchTerm
                    ? `No hay negocios que coincidan con "${searchTerm}"`
                    : 'No hay negocios registrados'
                }
              </p>
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                  filtrarNegocios();
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {!loading && agruparNegociosPorUsuario(negociosFiltrados).map((grupoUsuario) => (
          <div key={grupoUsuario.userId} className="locales-card">
            <div className="locales-card-content">
              <div className="locales-card-main">
                <div className="locales-card-header">
                  <div className="locales-card-icon">
                    <User />
                  </div>
                  <div className="locales-card-info">
                    <div className="locales-card-title">
                      <h3 className="locales-card-name">{grupoUsuario.user.name || 'Usuario sin nombre'}</h3>
                      <span className="locales-card-badge bg-blue-100 text-blue-800">
                        {grupoUsuario.negocios.length} {grupoUsuario.negocios.length === 1 ? 'Local' : 'Locales'}
                      </span>
                      <span className="locales-card-badge bg-gray-100 text-gray-800">
                        Cédula: {grupoUsuario.user.identification || 'No especificado'}
                      </span>
                    </div>
                    <p className="locales-card-license">Email: {grupoUsuario.user.email || 'No especificado'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => abrirDocumentos(grupoUsuario.negocios[0])}
                  className="locales-action-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  disabled={loading || !apiService.isAuthenticated()}
                  title="Ver locales del usuario"
                >
                  <Eye className="w-4 h-4" />
                  <span>Abrir</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && negocios.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay negocios</h3>
          <p className="text-gray-500 mb-4">
            {error ?
              'Hubo un problema al cargar los negocios.' :
              searchTerm || filterStatus !== 'all' ?
                'No se encontraron negocios con los filtros aplicados.' :
                'Aún no hay negocios registrados.'
            }
          </p>
          {!error && apiService.isAuthenticated() && (
            <button
              onClick={() => loadNegocios()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Recargar negocios
            </button>
          )}
        </div>
      )}

      {showDocumentsModal && selectedNegocio && (
        <div className="locales-modal-overlay">
          <div className="locales-modal max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="locales-modal-title">
                Locales de {selectedNegocio?.user.name || 'Usuario'}
              </h2>
              <button
                onClick={() => {
                  setShowDocumentsModal(false);
                  setSelectedNegocio(null);
                  setLocalesDelUsuario([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl font-bold">×</span>
              </button>
            </div>
                     
            <div className="mb-6 p-4 border rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">
                {selectedNegocio?.user.name || 'Usuario sin nombre'}
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                Cédula: {selectedNegocio?.user.identification || 'No especificado'}
              </p>
              <p className="text-sm text-blue-700">
                Email: {selectedNegocio?.user.email || 'No especificado'}
              </p>
              <p className="text-sm text-blue-700 font-medium">
                Total de locales: {localesDelUsuario.length}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-800 border-b pb-2">
                Locales asociados:
              </h4>
              
              {localesDelUsuario.length > 0 ? (
                localesDelUsuario.map((negocio) => (
                  <div key={negocio.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-2 text-lg">
                          {negocio.commercialName || 'Sin nombre comercial'}
                        </h5>
                        <p className="text-gray-600 mb-3 leading-relaxed">
                          {negocio.description || 'Sin descripción disponible'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(negocio.category?.name)}`}>
                            {negocio.category?.name || 'Sin categoría'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(negocio.validationStatus)}`}>
                            {formatEstadoText(negocio.validationStatus)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedNegocio(negocio);
                            setShowViewModal(true);
                            setShowDocumentsModal(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center gap-2"
                          title="Ver detalles completos del local"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron locales para este usuario</p>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowDocumentsModal(false);
                  setSelectedNegocio(null);
                  setLocalesDelUsuario([]);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedNegocio && (
        <div className="locales-modal-overlay">
          <div className="locales-modal max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="locales-modal-title">
                Detalles de {selectedNegocio.commercialName}
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedNegocio(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl font-bold">×</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Comercial</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.commercialName || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Representante</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.representativeName || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cédula/RUC</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.cedulaOrRuc || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.phone || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.email || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sector/Parroquia</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.parishCommunitySector || 'No especificado'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.category?.name || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedNegocio.validationStatus)}`}>
                    {formatEstadoText(selectedNegocio.validationStatus)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lugar de Venta</label>
                  <p className="mt-1 text-sm text-gray-900">{formatSalePlace(selectedNegocio.salePlace)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Servicio de Delivery</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDeliveryService(selectedNegocio.deliveryService)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Acepta WhatsApp</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNegocio.acceptsWhatsappOrders ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedNegocio.registrationDate ?
                      new Date(selectedNegocio.registrationDate).toLocaleDateString('es-ES') :
                      'No especificado'
                    }
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                {selectedNegocio.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedNegocio.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Redes Sociales</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedNegocio.facebook && (
                      <a
                        href={selectedNegocio.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        Facebook
                      </a>
                    )}
                    {selectedNegocio.instagram && (
                      <a
                        href={selectedNegocio.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs hover:bg-pink-200 transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                    {selectedNegocio.tiktok && (
                      <a
                        href={selectedNegocio.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors"
                      >
                        TikTok
                      </a>
                    )}
                    {selectedNegocio.website && (
                      <a
                        href={selectedNegocio.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs hover:bg-green-200 transition-colors"
                      >
                        Sitio Web
                      </a>
                    )}
                    {!selectedNegocio.facebook && !selectedNegocio.instagram && !selectedNegocio.tiktok && !selectedNegocio.website && (
                      <span className="text-gray-500 text-xs">No especificado</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">Documentos</label>
                    <button
                      onClick={() => abrirModalFotos(selectedNegocio)}
                      className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs hover:bg-purple-200 transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Ver Documentos
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Haga clic en "Ver Documentos" para acceder a las fotos y documentos del negocio
                  </p>
                </div>
                
                {selectedNegocio.productsServices && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Productos/Servicios</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedNegocio.productsServices}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              {selectedNegocio.validationStatus === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!window.confirm('¿Está seguro que desea aprobar este local?')) {
                        return;
                      }
                      try {
                        if (!verificarToken()) return;
                        setLoading(true);
                        const response = await aprobarNegocio(selectedNegocio.id);
                        if (response.success) {
                          alert('Local aprobado exitosamente');
                          await loadNegocios();
                          setShowViewModal(false);
                          setSelectedNegocio(null);
                        } else {
                          alert('Error al aprobar local: ' + (response.error || response.message));
                        }
                      } catch (err) {
                        alert('Error de conexión al aprobar local');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    title="Aprobar local"
                    disabled={loading}
                  >
                    <span className="text-lg">✓</span>
                    <span>Aprobar</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    title="Rechazar local"
                    disabled={loading}
                  >
                    <span className="text-lg">✗</span>
                    <span>Rechazar</span>
                  </button>
                </div>
              )}
              
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedNegocio(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors ml-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedNegocio && (
        <div className="locales-modal-overlay">
          <div className="locales-modal max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="locales-modal-title">
                Rechazar Local
              </h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl font-bold">×</span>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                Está a punto de rechazar el local: <strong>{selectedNegocio.commercialName}</strong>
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del rechazo (requerido):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Explique el motivo del rechazo..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    alert('Debe proporcionar una razón para el rechazo');
                    return;
                  }
                  try {
                    if (!verificarToken()) return;
                    setLoading(true);
                    const response = await rechazarNegocio(selectedNegocio.id, rejectReason.trim());
                    if (response.success) {
                      alert('Local rechazado exitosamente');
                      await loadNegocios();
                      setShowViewModal(false);
                      setShowRejectModal(false);
                      setSelectedNegocio(null);
                      setRejectReason('');
                    } else {
                      alert('Error al rechazar local: ' + (response.error || response.message));
                    }
                  } catch (err) {
                    alert('Error de conexión al rechazar local');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                disabled={loading || !rejectReason.trim()}
              >
                {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotosModal && selectedNegocio && (
        <div className="locales-modal-overlay">
          <div className="locales-modal max-w-6xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="locales-modal-title">
                Documentos de {selectedNegocio.commercialName}
              </h2>
              <button
                onClick={() => {
                  setShowPhotosModal(false);
                  setSelectedNegocio(null);
                  setCurrentPhotos([]);
                  setPhotosError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl font-bold">×</span>
              </button>
            </div>

            {loadingPhotos && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Cargando documentos...</span>
              </div>
            )}

            {photosError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <span className="text-lg mr-2">⚠️</span>
                <span>{photosError}</span>
              </div>
            )}

            {!loadingPhotos && !photosError && currentPhotos.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos disponibles</h3>
                <p className="text-gray-500">
                  Este negocio no tiene documentos o fotos cargadas en el sistema.
                </p>
              </div>
            )}

            {!loadingPhotos && currentPhotos.length > 0 && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Documentos Disponibles ({currentPhotos.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPhotos.map((photo, index) => (
                    <div key={photo.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {photo.photoType === 'SLIDE' ? 'Imagen del Negocio' : 
                             photo.fileType ? `${photo.fileType.toUpperCase()}` : 
                             `Documento ${index + 1}`}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {photo.fileType || 'Tipo de archivo desconocido'}
                          </p>
                        </div>
                      </div>

                      {photo.url && (
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img
                            src={photo.url}
                            alt={`Documento ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(photo.url, '_blank')}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="flex items-center justify-center h-full text-gray-400">
                                    <div class="text-center">
                                      <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                      </svg>
                                      <p class="text-xs">Vista previa no disponible</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(photo.url, '_blank')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Imagen
                        </button>
                        <button
                          onClick={() => descargarImagen(photo.url, `documento_${selectedNegocio.commercialName}_${index + 1}.${photo.fileType || 'jpg'}`)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowPhotosModal(false);
                  setSelectedNegocio(null);
                  setCurrentPhotos([]);
                  setPhotosError('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalesComerciales;