import React, { useState, useEffect, useCallback } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  TrendingUp, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Download, 
  MessageSquare, 
  Send, 
  ZoomIn, 
  ZoomOut, 
  RotateCw 
} from 'lucide-react';
import { ApiService } from './login/ApiService'; 
import { 
  ApiProyectos, 
  ProyectoAPI, 
  ProyectoBase, 
  ProyectoStats, 
  DocumentoProyecto 
} from './login/ApiProyectos';
import '../styles/proyectos.css';

// Crear instancias de las APIs
const apiService = new ApiService();
const apiProyectos = new ApiProyectos(apiService);

// *** COMPONENTE DOCUMENT VIEWER ***
interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentData?: string;
  documentName?: string;
  documentType?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  isOpen, 
  onClose, 
  documentData, 
  documentName, 
  documentType 
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
      setLoading(true);
      setError('');
      setImageLoaded(false);
      
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!documentData || !documentName) {
    return (
      <div className="document-viewer-overlay">
        <div className="document-viewer-container">
          <div className="document-viewer-error">
            <FileText className="document-viewer-error-icon" />
            <h3>Error al cargar documento</h3>
            <p>No se pudieron cargar los datos del documento</p>
            <button onClick={onClose} className="document-viewer-cancel-btn">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getFileTypeAndMime = (): { fileType: string; mimeType: string } => {
    const fileName = documentName.toLowerCase();
    
    if (documentData) {
      if (documentData.startsWith('JVBERi') || documentData.startsWith('JVBER')) {
        return { fileType: 'pdf', mimeType: 'application/pdf' };
      }
      if (documentData.startsWith('/9j/')) {
        return { fileType: 'image', mimeType: 'image/jpeg' };
      }
      if (documentData.startsWith('iVBOR')) {
        return { fileType: 'image', mimeType: 'image/png' };
      }
    }
    
    if (fileName.includes('.pdf')) {
      return { fileType: 'pdf', mimeType: 'application/pdf' };
    }
    if (fileName.includes('.jpg') || fileName.includes('.jpeg')) {
      return { fileType: 'image', mimeType: 'image/jpeg' };
    }
    if (fileName.includes('.png')) {
      return { fileType: 'image', mimeType: 'image/png' };
    }
    
    return { fileType: 'pdf', mimeType: 'application/pdf' };
  };
  
  const { fileType, mimeType } = getFileTypeAndMime();
  
  const cleanBase64Data = (data: string): string => {
    if (!data) return '';
    let cleanData = data.replace(/^data:[^;]+;base64,/, '');
    cleanData = cleanData.replace(/\s/g, '');
    try {
      atob(cleanData);
      return cleanData;
    } catch (e) {
      return data;
    }
  };

  const cleanedData = cleanBase64Data(documentData);
  const dataUrl = `data:${mimeType};base64,${cleanedData}`;

  const handleDownload = (): void => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error al descargar el documento');
    }
  };

  const handleZoomIn = (): void => setZoom(prev => Math.min(200, prev + 25));
  const handleZoomOut = (): void => setZoom(prev => Math.max(25, prev - 25));
  const handleRotate = (): void => setRotation(prev => (prev + 90) % 360);

  const handleImageLoad = (): void => {
    setImageLoaded(true);
    setError('');
  };

  const handleImageError = (): void => {
    setError('Error al cargar la imagen. Verifique el formato del archivo.');
    setImageLoaded(false);
  };

  return (
    <div className="document-viewer-overlay">
      <div className="document-viewer-container">
        <div className="document-viewer-header">
          <div className="document-viewer-title">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 title={documentName}>{documentName}</h3>
          </div>
          
          <div className="document-viewer-controls">
            {fileType === 'image' && !loading && imageLoaded && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="document-viewer-control-btn"
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                
                <span className="document-viewer-zoom-text">{zoom}%</span>
                
                <button
                  onClick={handleZoomIn}
                  className="document-viewer-control-btn"
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                
                <button onClick={handleRotate} className="document-viewer-control-btn">
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}
            
            <button onClick={onClose} className="document-viewer-close-btn">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="document-viewer-content">
          <div className="document-viewer-content-inner">
            {loading ? (
              <div className="document-viewer-loading">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>Cargando documento...</span>
              </div>
            ) : error ? (
              <div className="document-viewer-error">
                <FileText className="document-viewer-error-icon" />
                <h3>Error al cargar</h3>
                <p>{error}</p>
              </div>
            ) : fileType === 'pdf' ? (
              <iframe
                src={dataUrl}
                className="document-viewer-iframe"
                title={documentName}
                onLoad={() => console.log('PDF cargado')}
                onError={() => setError('Error al cargar el archivo PDF')}
              />
            ) : (
              <div className="document-viewer-image-container">
                {!imageLoaded && !error && (
                  <div className="document-viewer-loading">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    <span>Cargando imagen...</span>
                  </div>
                )}
                
                <img
                  src={dataUrl}
                  alt={documentName}
                  className="document-viewer-image"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    display: imageLoaded ? 'block' : 'none'
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            )}
          </div>
        </div>

        <div className="document-viewer-footer">
          <div className="document-viewer-info">
            {fileType === 'pdf' ? 'Documento PDF' : 'Imagen'} • {documentName}
          </div>
          
          <div className="document-viewer-actions">
            <button
              onClick={handleDownload}
              className="document-viewer-download-btn"
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </button>
            
            <button onClick={onClose} className="document-viewer-cancel-btn">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// *** COMPONENTE PRINCIPAL PROYECTOS ***
const Proyectos: React.FC = () => {
  // Estados para datos
  const [proyectos, setProyectos] = useState<ProyectoAPI[]>([]);
  const [proyectosFiltrados, setProyectosFiltrados] = useState<ProyectoAPI[]>([]);
  const [stats, setStats] = useState<ProyectoStats>({
    totalProyectos: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0
  });
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string>('');
  const [renderError, setRenderError] = useState<string>('');
  
  // Estados para nuevo proyecto
  const [newProyecto, setNewProyecto] = useState({
    nombre: '',
    descripcion: '',
    responsable: '',
    presupuesto: '',
    categoria: '',
    email: '',
    cedula: '',
    telefono: '',
    address: ''
  });

  // Estados para modales
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoAPI | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados para documentos y observaciones
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [currentDocuments, setCurrentDocuments] = useState<DocumentoProyecto>({});
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState<string>('');

  // Función para verificar token
  const verificarToken = (): boolean => {
    const token = apiProyectos.getCurrentToken();
    const isAuth = apiProyectos.isAuthenticated();
    
    if (!isAuth || !token) {
      setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
      return false;
    }
    
    if (apiProyectos.isTokenExpired()) {
      setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      apiService.clearToken();
      return false;
    }
    
    return true;
  };

  // Función para cargar documentos
  const cargarDocumentos = async (userId: string) => {
    try {
      if (!verificarToken()) return;
      
      setLoadingDocuments(true);
      setDocumentError('');
      
      const [certificateResponse, identityResponse, signedResponse] = await Promise.allSettled([
        apiProyectos.getUserCertificate(userId),
        apiProyectos.getUserIdentityDocument(userId), 
        apiProyectos.getUserSignedDocument(userId)
      ]);
      
      const documents: DocumentoProyecto = {};

      if (certificateResponse.status === 'fulfilled' && certificateResponse.value.success) {
        documents.certificate = certificateResponse.value.data;
      }
      
      if (identityResponse.status === 'fulfilled' && identityResponse.value.success) {
        documents.identityDocument = identityResponse.value.data;
      }
      
      if (signedResponse.status === 'fulfilled' && signedResponse.value.success) {
        documents.signedDocument = signedResponse.value.data;
      }
      
      setCurrentDocuments(documents);
      
      const hasDocuments = Object.values(documents).some(doc => doc);
      if (!hasDocuments) {
        setDocumentError('No se pudieron cargar los documentos.');
      }
      
    } catch (err) {
      setDocumentError('Error de conexión al cargar los documentos.');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Función para abrir documentos
  const abrirDocumentos = async (proyecto: ProyectoAPI) => {
    setSelectedProyecto(proyecto);
    setShowDocumentsModal(true);
    await cargarDocumentos(proyecto.id);
  };

  // Función para iniciar rechazo
  const iniciarRechazo = (proyecto: ProyectoAPI) => {
    setSelectedProyecto(proyecto);
    setObservationText('');
    setShowObservationModal(true);
  };

  // Función para enviar rechazo
  const enviarRechazo = async () => {
    if (!selectedProyecto) return;
    
    if (!observationText.trim() || observationText.trim().length < 10) {
      alert('La observación debe tener al menos 10 caracteres.');
      return;
    }
    
    try {
      if (!verificarToken()) return;
      
      setLoading(true);
      const response = await apiProyectos.rechazarUsuario(selectedProyecto.id, observationText.trim());
      
      if (response.success) {
        setShowObservationModal(false);
        setObservationText('');
        setSelectedProyecto(null);
        setShowDocumentsModal(false);
        setCurrentDocuments({});
        setDocumentError('');
        
        await loadProyectos();
        setTimeout(() => filtrarProyectos(), 100);
        
        alert(`Usuario rechazado exitosamente. ${response.message || 'Se ha enviado la notificación.'}`);
      } else {
        if (response.status === 401) {
          setError('Su sesión ha expirado. Recargue la página e inicie sesión nuevamente.');
          apiService.clearToken();
        } else {
          alert(response.error || 'Error al rechazar usuario');
        }
      }
    } catch (err) {
      alert('Error de conexión al rechazar usuario.');
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar documento
  const descargarDocumento = (documentData: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${documentData}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error al descargar el documento');
    }
  };

  // Función para abrir visor de documentos
  const openDocumentViewer = (documentData: string, name: string, type: string) => {
    if (!documentData) {
      alert('Error: No hay datos del documento disponibles');
      return;
    }
    
    const getFileTypeAndMime = () => {
      if (documentData.startsWith('JVBERi')) return { fileType: 'pdf', mimeType: 'application/pdf' };
      if (documentData.startsWith('/9j/')) return { fileType: 'image', mimeType: 'image/jpeg' };
      if (documentData.startsWith('iVBOR')) return { fileType: 'image', mimeType: 'image/png' };
      return { fileType: 'pdf', mimeType: 'application/pdf' };
    };
    
    const { fileType, mimeType } = getFileTypeAndMime();
    const cleanData = documentData.replace(/\s/g, '');
    const dataUrl = `data:${mimeType};base64,${cleanData}`;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      if (fileType === 'pdf') {
        newWindow.document.write(`
          <html>
            <head><title>${name}</title></head>
            <body style="margin:0">
              <iframe src="${dataUrl}" style="width:100vw;height:100vh;border:none"></iframe>
            </body>
          </html>
        `);
      } else {
        newWindow.document.write(`
          <html>
            <head><title>${name}</title></head>
            <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5">
              <img src="${dataUrl}" alt="${name}" style="max-width:100%;max-height:100vh;object-fit:contain" />
            </body>
          </html>
        `);
      }
      newWindow.document.close();
    }
  };

  // Función para cargar proyectos
  const loadProyectos = async (page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      setError('');
      
      if (!verificarToken()) {
        setLoading(false);
        return;
      }
      
      const response = await apiProyectos.getProyectosPendientes(page, size);
      
      if (response.success && response.data) {
        const proyectosLimpios = response.data.content.filter(proyecto => 
          proyecto && proyecto.id
        );
        
        const proyectosNormalizados = proyectosLimpios.map(proyecto => {
          const datosPrueba = {
            phone: '0987654321',
            address: 'Av. Principal, Quito',
            email: 'usuario@ejemplo.com',
            cedula: '1234567890'
          };
          
          return {
            id: proyecto.id,
            nombre: proyecto.nombre || proyecto.name || '',
            descripcion: proyecto.descripcion || proyecto.description || '',
            estado: apiProyectos.validarEstado(proyecto.estado || proyecto.status),
            fechaEnvio: proyecto.fechaEnvio || '',
            responsable: proyecto.responsable || '',
            presupuesto: proyecto.presupuesto || 0,
            categoria: proyecto.categoria || '',
            fechaInicio: proyecto.fechaInicio || '',
            fechaFin: proyecto.fechaFin || '',
            email: proyecto.email || datosPrueba.email,
            cedula: proyecto.cedula || datosPrueba.cedula,
            telefono: proyecto.phone || proyecto.telefono || datosPrueba.phone,
            address: proyecto.address || proyecto.direccion || datosPrueba.address
          } as ProyectoAPI;
        });
        
        setProyectos(proyectosNormalizados);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
        setCurrentPage(response.data.pageable.pageNumber);
        
        setTimeout(() => filtrarProyectos(), 0);
        setRenderError('');
        
        const calculatedStats = apiProyectos.calculateStats(proyectosLimpios, response.data.totalElements);
        setStats(calculatedStats);
        
      } else {
        if (response.status === 401) {
          setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
          apiService.clearToken();
        } else {
          setError(response.error || 'Error al cargar proyectos');
        }
        setProyectos([]);
      }
    } catch (err) {
      setError('Error de conexión al cargar proyectos.');
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar proyecto
  const aprobarProyecto = async (userId: string) => {
    try {
      if (!verificarToken()) return;
      
      setLoading(true);
      const response = await apiProyectos.aprobarProyecto(userId);
      
      if (response.success) {
        await loadProyectos();
        setTimeout(() => filtrarProyectos(), 100);
        alert('Proyecto aprobado exitosamente');
      } else {
        if (response.status === 401) {
          setError('Su sesión ha expirado.');
          apiService.clearToken();
        } else {
          alert(response.error || 'Error al aprobar proyecto');
        }
      }
    } catch (err) {
      alert('Error de conexión al aprobar proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Función para crear proyecto
  const crearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProyecto.nombre.trim() || !newProyecto.descripcion.trim()) {
      alert('Nombre y descripción son requeridos');
      return;
    }
    
    try {
      if (!verificarToken()) return;
      
      setLoading(true);
      const proyectoData: ProyectoBase = {
        nombre: newProyecto.nombre.trim(),
        descripcion: newProyecto.descripcion.trim(),
        responsable: newProyecto.responsable.trim(),
        presupuesto: newProyecto.presupuesto ? parseFloat(newProyecto.presupuesto) : undefined,
        categoria: newProyecto.categoria.trim() || undefined,
        email: newProyecto.email.trim() || undefined,
        cedula: newProyecto.cedula.trim() || undefined,
        telefono: newProyecto.telefono.trim() || undefined,
        address: newProyecto.address.trim() || undefined
      };
      
      const response = await apiProyectos.createProyecto(proyectoData);
      
      if (response.success) {
        setShowModal(false);
        setNewProyecto({
          nombre: '',
          descripcion: '',
          responsable: '',
          presupuesto: '',
          categoria: '',
          email: '',
          cedula: '',
          telefono: '',
          address: ''
        });
        await loadProyectos();
        alert('Proyecto creado exitosamente');
      } else {
        alert(response.error || 'Error al crear proyecto');
      }
    } catch (err) {
      alert('Error de conexión al crear proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de paginación
  const changePage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      loadProyectos(newPage, pageSize);
    }
  };

  const changePageSize = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
    loadProyectos(0, newSize);
  };

  // Función para filtrar proyectos
  const filtrarProyectos = useCallback(() => {
    let proyectosFiltrados = proyectos;

    if (filterStatus !== 'all') {
      proyectosFiltrados = proyectosFiltrados.filter(proyecto => {
        const estadoNormalizado = apiProyectos.validarEstado(proyecto.estado);
        return estadoNormalizado === filterStatus;
      });
    }
   
    if (searchTerm.trim() !== '') {
      const terminoBusqueda = searchTerm.toLowerCase();
      proyectosFiltrados = proyectosFiltrados.filter(proyecto => 
        (proyecto.nombre && proyecto.nombre.toLowerCase().includes(terminoBusqueda)) ||
        (proyecto.email && proyecto.email.toLowerCase().includes(terminoBusqueda)) ||
        (proyecto.cedula && proyecto.cedula.toLowerCase().includes(terminoBusqueda)) ||
        (proyecto.telefono && proyecto.telefono.toLowerCase().includes(terminoBusqueda)) ||
        (proyecto.address && proyecto.address.toLowerCase().includes(terminoBusqueda)) ||
        (proyecto.categoria && proyecto.categoria.toLowerCase().includes(terminoBusqueda))
      );
    }

    proyectosFiltrados = proyectosFiltrados.filter(proyecto => 
      proyecto.nombre && proyecto.nombre.trim() !== ''
    );

    setProyectosFiltrados(proyectosFiltrados);
  }, [proyectos, filterStatus, searchTerm]);

  const handleFilterChange = (newFilter: string) => {
    setFilterStatus(newFilter);
    setCurrentPage(0);
    setTimeout(() => filtrarProyectos(), 0);
  };

  // Función para renderizar proyectos
  const renderProyectos = () => {
    try {
      return proyectosFiltrados.map((proyecto) => {
        if (!proyecto || !proyecto.id) return null;

        const estadoProyecto = proyecto.estado || 'pendiente';
        
        const generarNombreDescriptivo = (proyecto: ProyectoAPI): string => {
          if (proyecto.nombre && proyecto.nombre.trim() !== '') {
            return proyecto.nombre;
          }
          return `Proyecto #${proyecto.id} (Sin nombre)`;
        };
        
        const nombreProyecto = generarNombreDescriptivo(proyecto);

        return (
          <div key={proyecto.id} className="proyectos-card">
            <div className="proyectos-card-header">
              <div className="proyectos-card-title-group">
                <div className="proyectos-card-icon">
                  <FolderOpen />
                </div>
                <div>
                  <h3 className="proyectos-card-name">
                    {nombreProyecto}
                    {(!proyecto.nombre || proyecto.nombre.trim() === '') && (
                      <span className="text-xs text-gray-500 ml-2">(Sin nombre)</span>
                    )}
                  </h3>
                  <p className="proyectos-card-category">{proyecto.categoria || 'General'}</p>
                </div>
              </div>
              <span className={`proyectos-card-status ${apiProyectos.getStatusColor(estadoProyecto)}`}>
                {apiProyectos.formatEstadoText(estadoProyecto)}
              </span>
            </div>

            <div className="proyectos-details-grid">
              <div>
                <p className="proyectos-detail-label">Correo Electrónico</p>
                <p className="proyectos-detail-value">
                  <User className="proyectos-detail-icon" />
                  {proyecto.email || 'No especificado'}
                </p>
              </div>
              <div>
                <p className="proyectos-detail-label">Número de Cédula</p>
                <p className="proyectos-detail-value">
                  {proyecto.cedula || 'No especificado'}
                </p>
              </div>
              <div>
                <p className="proyectos-detail-label">Número de Teléfono</p>
                <p className="proyectos-detail-value">
                  <User className="proyectos-detail-icon" />
                  {proyecto.telefono || 'No especificado'}
                </p>
              </div>
              <div>
                <p className="proyectos-detail-label">Dirección</p>
                <p className="proyectos-detail-value">
                  {proyecto.address || 'No especificado'}
                </p>
              </div>
            </div>

            <div className="proyectos-card-footer">
              {estadoProyecto === 'pendiente' ? (
                <button 
                  onClick={() => abrirDocumentos(proyecto)}
                  className="proyectos-action-button bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading || !apiProyectos.isAuthenticated()}
                >
                  <FileText className="w-4 h-4" />
                  <span>Abrir</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setSelectedProyecto(proyecto);
                      setShowViewModal(true);
                    }}
                    className="proyectos-action-button bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedProyecto(proyecto);
                      setNewProyecto({
                        nombre: proyecto.nombre || '',
                        descripcion: proyecto.descripcion || '',
                        responsable: proyecto.responsable || '',
                        presupuesto: proyecto.presupuesto?.toString() || '',
                        categoria: proyecto.categoria || '',
                        email: proyecto.email || '',
                        cedula: proyecto.cedula || '',
                        telefono: proyecto.telefono || '',
                        address: proyecto.address || ''
                      });
                      setShowEditModal(true);
                    }}
                    className="proyectos-action-button bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button 
                    onClick={async () => {
                      if (!window.confirm('¿Está seguro que desea eliminar este proyecto?')) return;

                      try {
                        if (!verificarToken()) return;
                        
                        setLoading(true);
                        const response = await apiProyectos.deleteProyecto(proyecto.id);
                        
                        if (response.success) {
                          await loadProyectos();
                          alert('Proyecto eliminado exitosamente');
                        } else {
                          alert(response.error || 'Error al eliminar proyecto');
                        }
                      } catch (err) {
                        alert('Error de conexión al eliminar proyecto');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="proyectos-action-button bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      }).filter(Boolean);
    } catch (renderErr) {
      const errorMessage = renderErr instanceof Error ? renderErr.message : 'Error desconocido';
      if (renderError !== errorMessage) {
        setTimeout(() => setRenderError(errorMessage), 0);
      }
      
      return [
        <div key="error" className="col-span-full text-center py-8">
          <p className="text-red-600">Error al mostrar los proyectos.</p>
        </div>
      ];
    }
  };

  // Efectos
  useEffect(() => {
    const inicializar = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!verificarToken()) {
        setError('No hay sesión válida. Por favor, inicie sesión.');
        return;
      }
      
      loadProyectos();
    };
    
    inicializar();
  }, []);

  useEffect(() => {
    if (!apiProyectos.isAuthenticated()) return;
    
    const delayedSearch = setTimeout(() => {
      filtrarProyectos();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filtrarProyectos]);

  useEffect(() => {
    if (proyectos.length > 0) {
      filtrarProyectos();
    }
  }, [proyectos, filtrarProyectos]);

  // Render del componente
  return (
    <div className="proyectos-container">
      <div className="proyectos-header">
        <h1 className="proyectos-title">
          <FolderOpen className="w-8 h-8 text-red-600 mr-3" />
          Gestión de comerciantes
        </h1>
      </div>
         
      {/* Mensaje de error */}
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
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Recargar página
                </button>
              )}
              <button 
                onClick={() => {
                  setError('');
                  if (apiProyectos.isAuthenticated()) loadProyectos();
                }} 
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="proyectos-stats-grid">
        <div className="proyectos-stat-card">
          <div className="proyectos-stat-content">
            <div>
              <p className="proyectos-stat-text-sm">Total Emprendedores</p>
              <p className="proyectos-stat-text-lg">{stats.totalProyectos}</p>
            </div>
            <div className="proyectos-stat-icon-container bg-blue-100">
              <FolderOpen className="proyectos-stat-icon text-blue-600" />
            </div>
          </div>
        </div>
        <div className="proyectos-stat-card">
          <div className="proyectos-stat-content">
            <div>
              <p className="proyectos-stat-text-sm">Pendientes</p>
              <p className="proyectos-stat-text-lg">{stats.pendientes}</p>
            </div>
            <div className="proyectos-stat-icon-container bg-yellow-100">
              <Calendar className="proyectos-stat-icon text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="proyectos-stat-card">
          <div className="proyectos-stat-content">
            <div>
              <p className="proyectos-stat-text-sm">Aprobados</p>
              <p className="proyectos-stat-text-lg">{stats.aprobados}</p>
            </div>
            <div className="proyectos-stat-icon-container bg-green-100">
              <TrendingUp className="proyectos-stat-icon text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="proyectos-filters">
        <div className="proyectos-filters-container">
          <div className="proyectos-search-container">
            <Search className="proyectos-search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, cédula, teléfono o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="proyectos-search-input"
              disabled={!apiProyectos.isAuthenticated() || loading}
            />
          </div>

          <div className="proyectos-filters-actions">
            <div className="proyectos-filter-group">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <select
                value={pageSize}
                onChange={(e) => changePageSize(parseInt(e.target.value))}
                className="proyectos-filter-select"
                disabled={!apiProyectos.isAuthenticated() || loading}
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">
            {proyectos.length === 0 ? 'Cargando proyectos...' : 'Actualizando...'}
          </span>
        </div>
      )}

      {/* Error de renderizado */}
      {renderError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span>Error al renderizar proyectos: {renderError}</span>
        </div>
      )}
      
      {/* Indicador de proyectos filtrados */}
      {!loading && proyectosFiltrados.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {proyectosFiltrados.length} de {proyectos.length} proyectos
          {filterStatus !== 'all' && ` (filtrado por: ${apiProyectos.formatEstadoText(filterStatus)})`}
          {searchTerm && ` (búsqueda: "${searchTerm}")`}
        </div>
      )}

      {/* Lista de proyectos */}
      <div className="proyectos-grid">
        {!loading && proyectosFiltrados.length === 0 && proyectos.length > 0 && (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No se encontraron proyectos</p>
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                  filtrarProyectos();
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
        {!loading && renderProyectos()}
      </div>

      {/* Mensaje cuando no hay proyectos */}
      {!loading && !renderError && proyectos.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
          <p className="text-gray-500 mb-4">Aún no hay proyectos registrados.</p>
          {!error && apiProyectos.isAuthenticated() && (
            <button
              onClick={() => loadProyectos()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Recargar proyectos
            </button>
          )}
        </div>
      )}

      {/* Paginación */}
      {!loading && !renderError && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white px-6 py-3 border-t rounded-lg shadow-sm mt-6">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, totalElements)} de {totalElements} proyectos
            </p>
          </div>
          
          <div>
            <nav className="inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 0 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => changePage(pageNum)}
                    disabled={loading}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-red-50 border-red-500 text-red-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Modal para ver documentos */}
      {showDocumentsModal && selectedProyecto && (
        <div className="proyectos-modal-overlay">
          <div className="proyectos-modal max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="proyectos-modal-title">
                Documentos: {selectedProyecto.nombre}
              </h2>
              <button
                onClick={() => {
                  setShowDocumentsModal(false);
                  setSelectedProyecto(null);
                  setCurrentDocuments({});
                  setDocumentError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Información del proyecto */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{selectedProyecto.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Cédula:</span>
                  <p className="text-gray-900">{selectedProyecto.cedula}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${apiProyectos.getStatusColor(selectedProyecto.estado)}`}>
                    {apiProyectos.formatEstadoText(selectedProyecto.estado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error al cargar documentos */}
            {documentError && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <span>{documentError}</span>
              </div>
            )}

            {/* Indicador de carga */}
            {loadingDocuments && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando documentos...</span>
              </div>
            )}

            {/* Documentos */}
            {!loadingDocuments && (
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Certificado */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium">Certificado</span>
                      </div>
                      {currentDocuments.certificate && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Disponible
                        </span>
                      )}
                    </div>
                    {currentDocuments.certificate ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => openDocumentViewer(
                            currentDocuments.certificate!, 
                            `certificado_${selectedProyecto.id}.pdf`, 
                            'certificate'
                          )}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </button>
                        <button
                          onClick={() => descargarDocumento(currentDocuments.certificate!, `certificado_${selectedProyecto.id}.pdf`)}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded text-sm text-center">
                        No disponible
                      </div>
                    )}
                  </div>

                  {/* Documento de Identidad */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-green-600 mr-2" />
                        <span className="font-medium">Cédula</span>
                      </div>
                      {currentDocuments.identityDocument && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Disponible
                        </span>
                      )}
                    </div>
                    {currentDocuments.identityDocument ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => openDocumentViewer(
                            currentDocuments.identityDocument!, 
                            `cedula_${selectedProyecto.id}.jpg`, 
                            'identity'
                          )}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </button>
                        <button
                          onClick={() => descargarDocumento(currentDocuments.identityDocument!, `cedula_${selectedProyecto.id}.jpg`)}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded text-sm text-center">
                        No disponible
                      </div>
                    )}
                  </div>

                  {/* Documento Firmado */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-purple-600 mr-2" />
                        <span className="font-medium">Documento Firmado</span>
                      </div>
                      {currentDocuments.signedDocument ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Disponible
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </div>
                    {currentDocuments.signedDocument ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => openDocumentViewer(
                            currentDocuments.signedDocument!, 
                            `documento_firmado_${selectedProyecto.id}.pdf`, 
                            'signed'
                          )}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </button>
                        <button
                          onClick={() => descargarDocumento(currentDocuments.signedDocument!, `documento_firmado_${selectedProyecto.id}.pdf`)}
                          className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 flex items-center justify-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded text-sm text-center">
                        Se generará tras la aprobación
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowDocumentsModal(false);
                      setSelectedProyecto(null);
                      setCurrentDocuments({});
                      setDocumentError('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cerrar
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDocumentsModal(false);
                        iniciarRechazo(selectedProyecto);
                      }}
                      className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 flex items-center"
                      disabled={loading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rechazar
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowDocumentsModal(false);
                        aprobarProyecto(selectedProyecto.id);
                      }}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center"
                      disabled={loading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprobar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para observaciones */}
      {showObservationModal && selectedProyecto && (
        <div className="proyectos-modal-overlay">
          <div className="proyectos-modal max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="proyectos-modal-title text-red-600">
                <MessageSquare className="inline w-6 h-6 mr-2" />
                Rechazar Usuario: {selectedProyecto.nombre}
              </h2>
              <button
                onClick={() => {
                  setShowObservationModal(false);
                  setSelectedProyecto(null);
                  setObservationText('');
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Información del usuario */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{selectedProyecto.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Cédula:</span>
                  <p className="text-gray-900">{selectedProyecto.cedula}</p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={(e) => {
              e.preventDefault();
              enviarRechazo();
            }}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Observación del Rechazo *
                  <span className="text-xs text-gray-500 ml-1">(Mínimo 10 caracteres)</span>
                </label>
                <textarea
                  value={observationText}
                  onChange={(e) => setObservationText(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-none"
                  rows={8}
                  placeholder="Ingrese las razones del rechazo..."
                  required
                  disabled={loading}
                />
                <div className="flex justify-between mt-2">
                  <span className={`text-xs ${observationText.trim().length >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                    {observationText.trim().length >= 10 ? '✓ Válido' : 'Mínimo 10 caracteres'}
                  </span>
                  <span className="text-xs text-gray-500">{observationText.length} caracteres</span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowObservationModal(false);
                    setSelectedProyecto(null);
                    setObservationText('');
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 flex items-center disabled:opacity-50"
                  disabled={loading || observationText.trim().length < 10}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Rechazo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver proyecto */}
      {showViewModal && selectedProyecto && (
        <div className="proyectos-modal-overlay">
          <div className="proyectos-modal max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="proyectos-modal-title">Detalles del Proyecto</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedProyecto.nombre}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${apiProyectos.getStatusColor(selectedProyecto.estado)}`}>
                    {apiProyectos.formatEstadoText(selectedProyecto.estado)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedProyecto.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedProyecto.telefono}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded min-h-[100px]">
                  {selectedProyecto.descripcion}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
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

export default Proyectos;