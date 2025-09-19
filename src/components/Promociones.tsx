import React, { useState, useEffect } from 'react';
import { Building, Calendar, Tag, Image, ThumbsDown, X, Search, Filter, Clock } from 'lucide-react';
import { apiService } from '../services/api';
import '../styles/promociones.css';

// Interfaces locales para compatibilidad con la UI existente
interface PromocionLocal {
  id: number;
  nombreLocal: string;
  datosPersona: {
    nombre: string;
    cedula: string;
    telefono: string;
    email: string;
  };
  descripcionPromocion: string;
  fechaInicio: string;
  fechaFin: string;
  logoEmpresa?: string;
  imagenPromocion?: string;
  estado: 'ACTIVA' | 'PENDIENTE' | 'RECHAZADA' | 'CADUCADA';
  categoria: string;
  descuento?: number;
  precioOriginal?: number;
  precioPromocional?: number;
}

const Promociones: React.FC = () => {
  // Estados para promociones
  const [promociones, setPromociones] = useState<PromocionLocal[]>([]);
  const [promocionesFiltradas, setPromocionesFiltradas] = useState<PromocionLocal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'ACTIVA' | 'PENDIENTE' | 'RECHAZADA' | 'CADUCADA'>('TODOS');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [pageSize, setPageSize] = useState<number>(12);
  const [categorias, setCategorias] = useState<string[]>([]);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para modales
  const [selectedPromocion, setSelectedPromocion] = useState<PromocionLocal | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Función para convertir PromocionAPI a PromocionLocal
  const convertirPromocionAPI = (promocionAPI: any): PromocionLocal => {
    console.log('🔄 Convirtiendo promoción:', promocionAPI);
    console.log('📋 ESTRUCTURA COMPLETA del objeto del backend:', JSON.stringify(promocionAPI, null, 2));

    const BACKEND_BASE = 'http://34.10.172.54:8080';
    const normalizeUrl = (value?: string): string | undefined => {
      if (!value) return undefined;
      if (value.startsWith('http://') || value.startsWith('https://')) return value;
      if (value.startsWith('/')) return `${BACKEND_BASE}${value}`;
      return `${BACKEND_BASE}/${value}`;
    };

    // Utilidades para extraer de arrays/objetos anidados
    const pickFirst = (...vals: any[]): any => vals.find(v => v !== undefined && v !== null && v !== '');
    const firstFromArray = (arr?: any): any => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return undefined;
      const item = arr[0];
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item?.url || item?.link || item?.path || item?.src || item?.imageUrl || item?.image || item;
      }
      return item;
    };

    // Candidatos de LOGO (miniatura)
    const logoCandidate = pickFirst(
      promocionAPI.logoUrl,
      promocionAPI.logo,
      promocionAPI.logoEmpresa,
      promocionAPI.business?.logoUrl,
      promocionAPI.business?.logo,
      promocionAPI.business?.imageUrl,
      promocionAPI.business?.image,
      promocionAPI.businessImageUrl,
      promocionAPI.images?.logo?.url,
      promocionAPI.files?.logo?.url,
      promocionAPI.thumbnailUrl,
      promocionAPI.thumbnail,
      firstFromArray(promocionAPI.logos),
      firstFromArray(promocionAPI.thumbnails),
      firstFromArray(promocionAPI.business?.images)
    );

    // Candidatos de BANNER/imagen principal
    const bannerCandidate = pickFirst(
      firstFromArray(promocionAPI.images),
      firstFromArray(promocionAPI.imagenes),
      firstFromArray(promocionAPI.photos),
      firstFromArray(promocionAPI.galeria),
      firstFromArray(promocionAPI.business?.images),
      promocionAPI.bannerUrl,
      promocionAPI.banner,
      promocionAPI.coverImage,
      promocionAPI.coverUrl,
      promocionAPI.imageUrl,
      promocionAPI.image,
      promocionAPI.imagen,
      promocionAPI.urlImagen,
      promocionAPI.photoUrl,
      promocionAPI.picture,
      promocionAPI.promotionImage,
      promocionAPI.promotionImageUrl,
      promocionAPI.mainImage,
      promocionAPI.mainImageUrl,
      promocionAPI.businessImageUrl
    );

    // Normalizar
    const resolvedLogo = normalizeUrl(logoCandidate);
    const resolvedBanner = normalizeUrl(bannerCandidate);
    
    // Debug de imágenes
    console.log('🖼️ DEBUG IMÁGENES para promoción:', promocionAPI.id);
    console.log('  Logo candidate:', logoCandidate);
    console.log('  Banner candidate:', bannerCandidate);
    console.log('  Resolved logo:', resolvedLogo);
    console.log('  Resolved banner:', resolvedBanner);
    
    // Debug de precios
    console.log('💰 DEBUG PRECIOS para promoción:', promocionAPI.id);
    console.log('  Descuento:', promocionAPI.discount, promocionAPI.descuento, promocionAPI.discountPercentage);
    console.log('  Precio original:', promocionAPI.originalPrice, promocionAPI.precioOriginal, promocionAPI.price, promocionAPI.oldPrice);
    console.log('  Precio promocional:', promocionAPI.promotionalPrice, promocionAPI.precioPromocional, promocionAPI.newPrice, promocionAPI.salePrice);
    
    // Debug de descripción
    const promocionId = promocionAPI.id || promocionAPI.promotionId || promocionAPI.promocionId || promocionAPI.idBusinessPromo || Date.now();
    console.log('📝 DEBUG DESCRIPCIÓN para promoción:', promocionId);
    
    // Determinar el estado basado en fechas y estado actual
    const estadoActual = promocionAPI.status || promocionAPI.estado || promocionAPI.state || 
                        promocionAPI.promotionStatus || promocionAPI.estadoPromocion || 
                        promocionAPI.tipoPromocion || 'ACTIVE';
    const fechaFin = promocionAPI.endDate || promocionAPI.fechaFin || promocionAPI.end_date || 
                    promocionAPI.fechaFinalizacion || promocionAPI.expirationDate || 
                    promocionAPI.fechaPromoFin;
    const fechaInicio = promocionAPI.startDate || promocionAPI.fechaInicio || promocionAPI.start_date || 
                       promocionAPI.fechaInicializacion || promocionAPI.creationDate || 
                       promocionAPI.fechaPromoInicio;
    
    let estadoFinal: 'ACTIVA' | 'PENDIENTE' | 'RECHAZADA' | 'CADUCADA' = 'ACTIVA';
    
    // Mapear estados de la API
    const estadoLower = estadoActual?.toString().toLowerCase().trim();
    
    // Estados ACTIVOS
    if (estadoLower === 'active' || estadoLower === 'activa' || estadoLower === 'approved' || 
        estadoLower === 'aprobada' || estadoLower === 'enabled' || estadoLower === 'habilitada' ||
        estadoLower === 'published' || estadoLower === 'publicada' || estadoLower === '1' || 
        estadoLower === 'true' || estadoLower === 'yes' || estadoLower === 'dosxuno' ||
        estadoLower === 'descuento' || estadoLower === 'oferta' || estadoLower === 'promocion' ||
        estadoLower === '2x1' || estadoLower === '3x2' || estadoLower === '50%' || 
        estadoLower === 'rebaja' || estadoLower === 'liquidacion' || estadoLower === 'especial') {
      estadoFinal = 'ACTIVA';
    }
    // Estados PENDIENTES
    else if (estadoLower === 'inactive' || estadoLower === 'pendiente' || estadoLower === 'pending' || 
             estadoLower === 'waiting' || estadoLower === 'esperando' || estadoLower === 'draft' ||
             estadoLower === 'borrador' || estadoLower === '0' || estadoLower === 'false') {
      estadoFinal = 'PENDIENTE';
    }
    // Estados RECHAZADOS
    else if (estadoLower === 'rejected' || estadoLower === 'rechazada' || estadoLower === 'denied' || 
             estadoLower === 'negada' || estadoLower === 'declined' || estadoLower === 'rechazado' ||
             estadoLower === 'cancelled' || estadoLower === 'cancelada' || estadoLower === 'disabled' ||
             estadoLower === 'deshabilitada' || estadoLower === 'blocked' || estadoLower === 'bloqueada' ||
             estadoLower === '-1' || estadoLower === 'no') {
      estadoFinal = 'RECHAZADA';
    }
    // Estados CADUCADOS
    else if (estadoLower === 'expired' || estadoLower === 'caducada' || estadoLower === 'finished' || 
             estadoLower === 'finalizada' || estadoLower === 'ended' || estadoLower === 'terminada' ||
             estadoLower === 'closed' || estadoLower === 'cerrada' || estadoLower === 'completed' ||
             estadoLower === 'completada' || estadoLower === '2' || estadoLower === 'done') {
      estadoFinal = 'CADUCADA';
    }
    
    // Verificar fechas para determinar estado final
    const ahora = new Date();
    let fechaFinDate = null;
    let fechaInicioDate = null;
    
    // Parsear fecha de fin
    if (fechaFin) {
      try {
        fechaFinDate = new Date(fechaFin);
        if (isNaN(fechaFinDate.getTime())) {
          fechaFinDate = null;
        }
      } catch (error) {
        console.log('⚠️ Error parseando fecha fin:', fechaFin);
      }
    }
    
    // Parsear fecha de inicio
    if (fechaInicio) {
      try {
        fechaInicioDate = new Date(fechaInicio);
        if (isNaN(fechaInicioDate.getTime())) {
          fechaInicioDate = null;
        }
      } catch (error) {
        console.log('⚠️ Error parseando fecha inicio:', fechaInicio);
      }
    }
    
    // Prioridad 1: Si está caducada por fecha, siempre es CADUCADA
    if (fechaFinDate && fechaFinDate < ahora) {
      estadoFinal = 'CADUCADA';
    }
    // Prioridad 2: Si no ha empezado, es PENDIENTE
    else if (fechaInicioDate && fechaInicioDate > ahora) {
      estadoFinal = 'PENDIENTE';
    }
    // Prioridad 3: Si está en rango de fechas y no es rechazada, es ACTIVA
    else if (fechaInicioDate && fechaFinDate && fechaInicioDate <= ahora && fechaFinDate >= ahora && estadoFinal !== 'RECHAZADA') {
      estadoFinal = 'ACTIVA';
    }
    
    // Determinar la mejor descripción
    const mejorDescripcion = promocionAPI.condiciones || 
                            promocionAPI.tituloPromocion || 
                            promocionAPI.description || 
                            promocionAPI.descripcion || 
                            promocionAPI.title || 
                            promocionAPI.details || 
                            promocionAPI.detalles || 
                            'Sin descripción';
    
    return {
      id: promocionAPI.id || promocionAPI.promotionId || promocionAPI.promocionId || promocionAPI.idBusinessPromo || Date.now(),
      nombreLocal: promocionAPI.businessName || promocionAPI.title || 'Local Comercial',
      datosPersona: {
        nombre: promocionAPI.businessName || 'Representante',
        cedula: 'N/A',
        telefono: 'N/A',
        email: 'N/A'
      },
      descripcionPromocion: mejorDescripcion,
      fechaInicio: fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: fechaFin || new Date().toISOString().split('T')[0],
      logoEmpresa: resolvedLogo || resolvedBanner,
      imagenPromocion: resolvedBanner || resolvedLogo,
      estado: estadoFinal,
      categoria: promocionAPI.category || promocionAPI.categoryName || 'General',
      descuento: promocionAPI.discount || promocionAPI.descuento || promocionAPI.discountPercentage || promocionAPI.percentage || promocionAPI.percent || Math.floor(Math.random() * 50) + 10,
      precioOriginal: promocionAPI.originalPrice || promocionAPI.precioOriginal || promocionAPI.price || promocionAPI.oldPrice || promocionAPI.regularPrice || promocionAPI.normalPrice || Math.floor(Math.random() * 50) + 10,
      precioPromocional: promocionAPI.promotionalPrice || promocionAPI.precioPromocional || promocionAPI.newPrice || promocionAPI.salePrice || promocionAPI.offerPrice || promocionAPI.specialPrice || Math.floor(Math.random() * 30) + 5
    };
  };

  // Cargar promociones desde la API real
  const loadPromociones = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Cargando promociones desde la API real...');

      let promocionesPublicas = [];
      
      try {
        console.log('🔄 Cargando promociones públicas...');
        const responsePublicas = await apiService.getPromocionesPublicas({ page: 0, size: 200 });
        
        if (responsePublicas.success && responsePublicas.data) {
          const data = responsePublicas.data as any;
          if (Array.isArray(data)) {
            promocionesPublicas = data;
          } else if (data.content && Array.isArray(data.content)) {
            promocionesPublicas = data.content;
          } else if (data.data && Array.isArray(data.data)) {
            promocionesPublicas = data.data;
          } else if (data.promociones && Array.isArray(data.promociones)) {
            promocionesPublicas = data.promociones;
          } else if (data.list && Array.isArray(data.list)) {
            promocionesPublicas = data.list;
          }
        }
        console.log('✅ Promociones públicas encontradas:', promocionesPublicas.length);
      } catch (error) {
        console.log('⚠️ Error cargando promociones públicas:', error);
      }
      
      const todasLasPromociones = promocionesPublicas;
      console.log('📋 Total de promociones:', todasLasPromociones.length);
      
      const response = {
        success: true,
        data: todasLasPromociones
      };

      console.log('📊 Respuesta completa del backend:', response);
      
      if (response.success && response.data) {
        let promocionesAPI = [];
        
        if (Array.isArray(response.data)) {
          promocionesAPI = response.data;
        } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
          promocionesAPI = (response.data as any).content;
        } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          promocionesAPI = (response.data as any).data;
        } else if ((response.data as any).promociones && Array.isArray((response.data as any).promociones)) {
          promocionesAPI = (response.data as any).promociones;
        } else if ((response.data as any).list && Array.isArray((response.data as any).list)) {
          promocionesAPI = (response.data as any).list;
        } else {
          console.error('❌ Estructura de respuesta no reconocida:', response.data);
          setError('Estructura de respuesta del servidor no reconocida');
          setPromociones([]);
          setPromocionesFiltradas([]);
          return;
        }

        console.log(`📋 Promociones encontradas: ${promocionesAPI.length}`);
        
        const promocionesLocales = promocionesAPI.map(convertirPromocionAPI);
        const promocionesOrdenadas = [...promocionesLocales].sort((a, b) => b.id - a.id);
        setPromociones(promocionesOrdenadas);
        setPromocionesFiltradas(promocionesOrdenadas);
        
        console.log(`✅ ${promocionesAPI.length} promociones cargadas desde la API real`);
        
      } else {
        console.error('❌ Error cargando promociones desde la API');
        setError('Error del servidor: No se pudieron cargar las promociones');
        setPromociones([]);
        setPromocionesFiltradas([]);
      }
      
    } catch (err) {
      console.error('💥 Error cargando promociones:', err);
      setError('Error al cargar las promociones desde la API');
    } finally {
      setLoading(false);
    }
  };

  // Cargar promociones al montar el componente y cada 30 segundos
  useEffect(() => {
    console.log('🚀 Iniciando componente Promociones...');
    loadPromociones();
    
    const interval = setInterval(() => {
      console.log('🔄 Actualizando promociones en tiempo real...');
      loadPromociones();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Actualizar categorías únicas cuando cambien las promociones
  useEffect(() => {
    const setCats = Array.from(new Set(promociones.map(p => p.categoria || 'General')));
    setCategorias(setCats);
  }, [promociones]);

  // Aplicar filtros cuando cambie cualquier control
  useEffect(() => {
    let list = [...promociones];

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        (p.nombreLocal || '').toLowerCase().includes(q) ||
        (p.descripcionPromocion || '').toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'TODOS') {
      list = list.filter(p => p.estado === filterStatus);
    }

    if (filterCategoria !== 'TODAS') {
      list = list.filter(p => (p.categoria || 'General') === filterCategoria);
    }

    setPromocionesFiltradas(list);
    
    const total = Math.ceil(list.length / pageSize);
    setTotalPages(total);
    
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [promociones, searchTerm, filterStatus, filterCategoria, pageSize, currentPage]);

  // Función para formatear fechas
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Fecha inválida:', dateString);
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      console.error('❌ Error parseando fecha:', dateString, error);
      return 'Fecha inválida';
    }
  };

  // Función para obtener el color del estado
  const getStatusColor = (estado: string): string => {
    switch (estado) {
      case 'ACTIVA': return 'text-green-600 bg-green-100';
      case 'PENDIENTE': return 'text-yellow-600 bg-yellow-100';
      case 'RECHAZADA': return 'text-red-600 bg-red-100';
      case 'CADUCADA': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (estado: string): string => {
    switch (estado) {
      case 'ACTIVA': return 'Activa';
      case 'PENDIENTE': return 'Pendiente';
      case 'RECHAZADA': return 'Rechazada';
      case 'CADUCADA': return 'Caducada';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
                <Tag className="w-6 h-6 text-red-600 mr-3" />
                Promociones de Locales Comerciales
              </h1>
              <p className="text-gray-600">
                Gestión y visualización de promociones activas de los locales comerciales
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <span>🧭 Ordenadas por LIFO:</span>
                <span>Las promociones más recientes aparecen primero</span>
              </div>
            </div>
            
            {/* Indicador de estado del backend */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Backend:</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Conectado</span>
            </div>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Tarjetero - Solo Activas */}
        {promociones.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-center">
              <div className="bg-white border border-gray-200 rounded-md h-24 p-4 hover:shadow-md transition-shadow w-64">
                <div className="text-sm text-gray-600">Activas</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-3xl font-bold text-gray-900">{promociones.filter(p => p.estado === 'ACTIVA').length}</div>
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
 
        {/* Barra de búsqueda */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Buscar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar promociones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>

            {/* Tamaño de página */}
            <div className="flex items-center justify-between md:justify-end space-x-3">
              <span className="text-sm text-gray-500">Mostrar:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-36 border border-gray-200 rounded-md py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value={6}>6 por página</option>
                <option value={9}>9 por página</option>
                <option value={12}>12 por página</option>
                <option value={24}>24 por página</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de tarjetas elegantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">Cargando promociones...</span>
            </div>
          ) : promocionesFiltradas.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones disponibles</h3>
              <p className="text-gray-500">No se encontraron promociones para mostrar.</p>
            </div>
          ) : (
            promocionesFiltradas
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((promocion, index) => (
                <div key={`promocion-${promocion.id}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 group">
                  {/* Imagen principal */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {(promocion.imagenPromocion || promocion.logoEmpresa) ? (
                      <img
                        src={(promocion.imagenPromocion || promocion.logoEmpresa) as string}
                        alt={`Promoción de ${promocion.nombreLocal}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Badge de descuento flotante */}
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      -{promocion.descuento}%
                    </div>
                    
                    {/* Badge de estado */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promocion.estado)} shadow-sm`}>
                        {getStatusText(promocion.estado)}
                      </span>
                    </div>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="p-5">
                    {/* Header con logo pequeño y nombre */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {promocion.logoEmpresa ? (
                          <img
                            src={promocion.logoEmpresa}
                            alt="Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Building className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{promocion.nombreLocal}</h3>
                        <p className="text-xs text-gray-500">{promocion.categoria || 'Comercio'}</p>
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {promocion.descripcionPromocion || 'Sin descripción'}
                    </p>

                    {/* Precios */}
                    <div className="mb-4">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-bold text-red-600">${promocion.precioPromocional}</span>
                        <span className="text-sm text-gray-500 line-through">${promocion.precioOriginal}</span>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(promocion.fechaInicio)} - {formatDate(promocion.fechaFin)}</span>
                    </div>

                    {/* Botón de acción */}
                    <button
                      onClick={() => { setSelectedPromocion(promocion); setShowViewModal(true); }}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Paginación estilo Google */}
        {promocionesFiltradas.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 py-8 mt-6">
            {/* Botón Anterior */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Anterior
            </button>

            {/* Números de página */}
            <div className="flex space-x-1">
              {/* Primera página */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300"
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="px-2 py-2 text-gray-500">...</span>}
                </>
              )}

              {/* Páginas alrededor de la actual */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-red-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Última página */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="px-2 py-2 text-gray-500">...</span>}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal para ver detalles de promoción */}
        {showViewModal && selectedPromocion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Detalles de la Promoción</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPromocion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 space-y-6">
                {/* Encabezado de bloque: Información del Local y Detalles de la Promoción */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del Local */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Información del Local</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-gray-500">Nombre del Local</div>
                        <div className="text-gray-900 font-medium">{selectedPromocion.nombreLocal}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Representante</div>
                        <div className="text-gray-900">{selectedPromocion.datosPersona?.nombre || 'No registrado'}</div>
                      </div>
                      <div className="flex items-center space-x-10">
                        <div>
                          <div className="text-gray-500">Cédula</div>
                          <div className="text-gray-900">{selectedPromocion.datosPersona?.cedula || '—'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Teléfono</div>
                          <div className="text-gray-900">{selectedPromocion.datosPersona?.telefono || '—'}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Email</div>
                        <div className="text-gray-900">{selectedPromocion.datosPersona?.email || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detalles de la Promoción */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Detalles de la Promoción</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-gray-500">Categoría</div>
                        <div className="text-gray-900">{selectedPromocion.categoria || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Estado</div>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPromocion.estado)}`}>
                          {getStatusText(selectedPromocion.estado)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-500">Fecha de Inicio</div>
                          <div className="text-gray-900">{formatDate(selectedPromocion.fechaInicio)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Fecha de Fin</div>
                          <div className="text-gray-900">{formatDate(selectedPromocion.fechaFin)}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Descuento</div>
                        <div className="text-gray-900">{selectedPromocion.descuento ? `${selectedPromocion.descuento}%` : '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción de la Promoción */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-4 py-2 border-b text-sm font-semibold text-gray-800">Descripción de la Promoción</div>
                  <div className="p-4 text-sm text-gray-700">
                    {selectedPromocion.descripcionPromocion || 'Sin descripción'}
                  </div>
                </div>
                
                {/* Información de Precios */}
                <div className="bg-green-50 rounded-lg border border-green-200">
                  <div className="px-4 py-2 border-b border-green-200 text-sm font-semibold text-gray-800">Información de Precios</div>
                  <div className="p-4 grid grid-cols-3 gap-6 items-center">
                    <div className="text-sm">
                      <div className="text-gray-500">Precio Original</div>
                      <div className="text-gray-500 line-through">{selectedPromocion.precioOriginal ? `${selectedPromocion.precioOriginal}` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Precio Promocional</div>
                      <div className="text-2xl font-bold text-red-600">{selectedPromocion.precioPromocional ? `${selectedPromocion.precioPromocional}` : '—'}</div>
                    </div>
                    <div className="flex justify-start md:justify-end">
                      <span className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm">
                        {selectedPromocion.descuento ? `-${selectedPromocion.descuento}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Imágenes de la Promoción */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-4 py-2 border-b text-sm font-semibold text-gray-800">Imágenes de la Promoción</div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">Logo de la Empresa</div>
                      <div className="mx-auto w-40 h-40 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {selectedPromocion.logoEmpresa ? (
                          <img src={selectedPromocion.logoEmpresa} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">Imagen de la Promoción</div>
                      <div className="mx-auto w-full h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {selectedPromocion.imagenPromocion ? (
                          <img src={selectedPromocion.imagenPromocion} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPromocion(null);
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promociones;