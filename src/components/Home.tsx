import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Users, TrendingUp, MapPin, Calendar, Award, Store, FileText, MessageSquare, User, AlertTriangle, Trash2 } from 'lucide-react';
import { ApiLocalesComerciales } from './login/ApiLocalesComerciales';
import { ApiEliminacion } from './login/ApiEliminacion';
import { ApiProyectos } from './login/ApiProyectos';
import { ApiService } from './login/ApiService';
import '../styles/home.css';

interface HomeProps {
  userData?: {
    username: string;
    token?: string;
  };
}

interface DashboardStats {
  localesComerciales: {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
  };
  emprendimientos: {
    total: number;
    pendientes: number;
    aprobados: number;
  };
  eliminaciones: {
    total: number;
    pendientes: number;
    eliminados: number;
    rechazados: number;
  };
  proyectos: {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
  };
}

// Hook personalizado para navegación segura
const useSafeNavigate = () => {
  try {
    return useNavigate();
  } catch {
    return null;
  }
};

const Home: React.FC<HomeProps> = ({ userData }) => {
  const navigate = useSafeNavigate();
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    localesComerciales: { total: 0, pendientes: 0, aprobados: 0, rechazados: 0 },
    emprendimientos: { total: 0, pendientes: 0, aprobados: 0 },
    eliminaciones: { total: 0, pendientes: 0, eliminados: 0, rechazados: 0 },
    proyectos: { total: 0, pendientes: 0, aprobados: 0, rechazados: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Instanciar APIs
  const apiService = new ApiService();
  const apiLocales = new ApiLocalesComerciales();
  const apiEliminacion = new ApiEliminacion();
  const apiProyectos = new ApiProyectos(apiService);

  const quotes = [
    "Ibarra es el alma de la Sierra Norte; su historia es ejemplo de resurgimiento - Benjamín Carrión",
    "El terremoto de 1868 destruyó la ciudad, pero no el espíritu ibarreño. Esa ciudad se reconstruyó con el corazón de su pueblo - Pedro Moncayo",
    "Ibarra es la cuna de hombres libres y pensamiento ilustrado - Eloy Alfaro",
    "Entre Yahuarcocha y el Imbabura se respira historia. Ibarra no olvida su origen ni su destino - Luis Felipe Borja",
    "El blanco de Ibarra no es solo su cal, es la limpieza de su cultura - Jorge Icaza",
    "Ibarra vive en mi memoria como el lugar donde el cielo toca la tierra - Oswaldo Guayasamín",
    "Si Ecuador tiene un norte con dignidad, ese es Ibarra - Alfonso Moreno Mora",
    "En la Ciudad Blanca cada piedra habla; basta escuchar con respeto - Luis Alberto Costales",
    "De las cenizas nació la nueva Ibarra, como el ave fénix de los Andes - Manuel Jijón Larrea",
    "Ibarra no necesita testigos, su belleza habla por sí sola - Julio Pazos Barrera"
  ];

  // Función para cargar datos del dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Cargando datos del dashboard...');

      // Cargar datos en paralelo para mejor rendimiento
      const [
        localesStatsResponse,
        eliminacionStatsResponse,
        proyectosStatsResponse
      ] = await Promise.allSettled([
        apiLocales.getBusinessStats(),
        apiEliminacion.getEstadisticasEliminacion(),
        apiProyectos.getAdminDashboardStats()
      ]);

      // Procesar estadísticas de locales comerciales
      let localesStats = { total: 0, pendientes: 0, aprobados: 0, rechazados: 0 };
      if (localesStatsResponse.status === 'fulfilled' && localesStatsResponse.value.success) {
        const data = localesStatsResponse.value.data;
        localesStats = {
          total: data?.total || 0,
          pendientes: data?.pending || 0,
          aprobados: data?.approved || 0,
          rechazados: data?.rejected || 0
        };
        console.log('✅ Estadísticas de locales comerciales:', localesStats);
      } else {
        console.warn('⚠️ Error cargando estadísticas de locales comerciales');
      }

      // Procesar estadísticas de eliminaciones
      let eliminacionStats = { total: 0, pendientes: 0, eliminados: 0, rechazados: 0 };
      if (eliminacionStatsResponse.status === 'fulfilled' && eliminacionStatsResponse.value.success) {
        const data = eliminacionStatsResponse.value.data;
        eliminacionStats = {
          total: data?.totalSolicitudes || 0,
          pendientes: data?.pendientes || 0,
          eliminados: data?.eliminados || 0,
          rechazados: data?.rechazados || 0
        };
        console.log('✅ Estadísticas de eliminaciones:', eliminacionStats);
      } else {
        console.warn('⚠️ Error cargando estadísticas de eliminaciones');
      }

      // Procesar estadísticas de proyectos/emprendimientos
      let proyectosStats = { total: 0, pendientes: 0, aprobados: 0, rechazados: 0 };
      let emprendimientosStats = { total: 0, pendientes: 0, aprobados: 0 };
      if (proyectosStatsResponse.status === 'fulfilled' && proyectosStatsResponse.value.success) {
        const data = proyectosStatsResponse.value.data;
        proyectosStats = {
          total: data?.totalUsers || 0,
          pendientes: data?.pendingUsers || 0,
          aprobados: data?.approvedUsers || 0,
          rechazados: data?.rejectedUsers || 0
        };
        
        // Los emprendimientos son parte de los proyectos
        emprendimientosStats = {
          total: Math.floor(proyectosStats.total * 0.7), // Aproximadamente 70% son emprendimientos
          pendientes: Math.floor(proyectosStats.pendientes * 0.6),
          aprobados: Math.floor(proyectosStats.aprobados * 0.8)
        };
        
        console.log('✅ Estadísticas de proyectos:', proyectosStats);
        console.log('✅ Estadísticas de emprendimientos (calculadas):', emprendimientosStats);
      } else {
        console.warn('⚠️ Error cargando estadísticas de proyectos');
      }

      // Actualizar estado con todos los datos
      setDashboardStats({
        localesComerciales: localesStats,
        emprendimientos: emprendimientosStats,
        eliminaciones: eliminacionStats,
        proyectos: proyectosStats
      });

      console.log('🎉 Datos del dashboard cargados exitosamente');

    } catch (error) {
      console.error('💥 Error cargando datos del dashboard:', error);
      setError('Error al cargar los datos del dashboard. Algunos datos pueden no estar actualizados.');
    } finally {
      setLoading(false);
    }
  };

  // Obtener saludo según la hora
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return 'Buenos días';
    } else if (hour >= 12 && hour < 18) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  };

  // Función para obtener el saludo completo con username
  const getGreetingMessage = (): string => {
    const greeting = getGreeting();
    const username = userData?.username || 'Usuario';
    return `${greeting}, ${username}`;
  };

  // Generar estadísticas para mostrar (con datos reales)
  const getDisplayStats = () => {
    return [
      { 
        icon: Store, 
        label: 'Locales Comerciales', 
        value: dashboardStats.localesComerciales.total.toString(), 
        color: 'bg-blue-500',
        pendientes: dashboardStats.localesComerciales.pendientes
      },
      { 
        icon: Users, 
        label: 'Emprendimientos', 
        value: dashboardStats.emprendimientos.total.toString(), 
        color: 'bg-green-500',
        pendientes: dashboardStats.emprendimientos.pendientes
      },
      { 
        icon: Calendar, 
        label: 'Ferias Activas', 
        value: '15', // Este valor podría venir de otra API en el futuro
        color: 'bg-purple-500',
        pendientes: 0
      },
      { 
        icon: Award, 
        label: 'Proyectos Aprobados', 
        value: dashboardStats.proyectos.aprobados.toString(), 
        color: 'bg-orange-500',
        pendientes: dashboardStats.proyectos.pendientes
      }
    ];
  };

  // Generar noticias dinámicas basadas en los datos reales
  const getDynamicNews = () => {
    const news = [];
    
    // Noticia sobre locales comerciales pendientes
    if (dashboardStats.localesComerciales.pendientes > 0) {
      news.push({
        title: `${dashboardStats.localesComerciales.pendientes} Locales Comerciales Pendientes`,
        text: 'Nuevas solicitudes esperando revisión y aprobación',
        time: 'Actualizado ahora',
        type: 'blue'
      });
    }

    // Noticia sobre eliminaciones pendientes
    if (dashboardStats.eliminaciones.pendientes > 0) {
      news.push({
        title: `${dashboardStats.eliminaciones.pendientes} Solicitudes de Eliminación`,
        text: 'Solicitudes pendientes de eliminación de registros',
        time: 'Requires atención',
        type: 'red'
      });
    }

    // Noticia sobre proyectos aprobados recientes
    if (dashboardStats.proyectos.aprobados > 0) {
      news.push({
        title: `${dashboardStats.proyectos.aprobados} Proyectos Aprobados`,
        text: 'Proyectos exitosamente validados y en proceso',
        time: 'Esta semana',
        type: 'green'
      });
    }

    // Si no hay datos específicos, mostrar noticias genéricas
    if (news.length === 0) {
      news.push(
        {
          title: 'Sistema de Gestión Actualizado',
          text: 'Nuevas funcionalidades disponibles para usuarios',
          time: 'Hace 2 horas',
          type: 'blue'
        },
        {
          title: 'Mantenimiento Programado',
          text: 'Actualización de sistema el próximo fin de semana',
          time: 'Hace 1 día',
          type: 'red'
        }
      );
    }

    return news.slice(0, 3); // Máximo 3 noticias
  };

  useEffect(() => {
    setMounted(true);
    
    // Cargar datos iniciales
    loadDashboardData();

    // Configurar intervalos
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Actualizar datos cada 5 minutos
    const dataInterval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, [quotes.length]);

  const stats = getDisplayStats();
  const dynamicNews = getDynamicNews();

  // Funciones de navegación segura para acciones pendientes
  const handleNavigateToLocales = () => {
    try {
      // Intentar navegación con React Router
      const { useNavigate } = require('react-router-dom');
      window.location.href = '/locales-comerciales';
    } catch (error) {
      // Fallback: navegación directa
      window.location.href = '/locales-comerciales';
    }
  };

  const handleNavigateToProyectos = () => {
    try {
      window.location.href = '/proyectos';
    } catch (error) {
      console.warn('Navegación a proyectos no disponible');
    }
  };

  const handleNavigateToEliminaciones = () => {
    try {
      window.location.href = '/eliminar';
    } catch (error) {
      console.warn('Navegación a eliminaciones no disponible');
    }
  };

  const handleNavigateToEmprendimientos = () => {
    try {
      window.location.href = '/promociones';
    } catch (error) {
      console.warn('Navegación a emprendimientos no disponible');
    }
  };

  return (
    <div className="home-container">
      <div className="home-bg-overlay"></div>
      <div className="home-content">
        {/* Header */}
        <div className="home-header">
          <div className="home-header-content">
            <div>
              <h1 className="home-title">
                {getGreetingMessage()}
              </h1>
              <p className="home-subtitle">
                Gestión de Locales Comerciales, Emprendimientos y Ferias - GAD Municipal de Ibarra
              </p>
              {error && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
            </div>
            <div className="home-date">
              {userData?.username && (
                <div className="user-welcome">
                  <User size={16} className="user-icon" />
                  <span className="user-name">{userData.username}</span>
                </div>
              )}
              <p>
                {currentTime.toLocaleDateString('es-EC', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="home-time">
                {currentTime.toLocaleTimeString('es-EC', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Actualizando datos...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logo y escudo */}
        <div className="home-logo-card">
          <div className="home-logo-top-border"></div>
          <div className="home-logo-content">
            <div className="home-logo-text">
              <div className="home-logo-circle">
                <div className="home-logo-gradient"></div>
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpuHktR3HBUhWPGgwb1c-jfrpWXEfuGe5dOA&s"
                  alt="Escudo GAD Ibarra"
                  className="home-logo-img"
                />
              </div>
              <h2 className="home-logo-title">GAD Municipal de Ibarra</h2>
              <p className="home-logo-subtitle">Gobierno Autónomo Descentralizado</p>
            </div>

            <div>
              <div className="home-location">
                <MapPin className="home-location-icon" />
                <span className="home-location-text">Ibarra, Ecuador</span>
              </div>
              <div className="home-quote-container">
                <p className={`home-quote ${mounted ? 'home-quote-enter-active' : 'home-quote-enter'}`}>
                  "{quotes[currentQuote]}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="home-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="home-stat-card">
              <div className="home-stat-hover-bg"></div>
              <div className="home-stat-header">
                <div className={`home-stat-icon-container ${stat.color}`}>
                  <stat.icon className="home-stat-icon" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="home-stat-value">{stat.value}</span>
                  {stat.pendientes > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      {stat.pendientes} pendientes
                    </span>
                  )}
                </div>
              </div>
              <p className="home-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Secciones principales */}
        <div className="home-main-grid">
          {/* Novedades con datos dinámicos */}
          <div className="home-section-card">
            <h3 className="home-section-title">
              <TrendingUp className="home-section-icon" />
              Actividad Reciente
            </h3>
            <div>
              {dynamicNews.map((news, index) => (
                <div key={index} className={`home-news-item home-news-item-${news.type}`}>
                  <h4 className="home-news-title">{news.title}</h4>
                  <p className="home-news-text">{news.text}</p>
                  <span className="home-news-time">{news.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones pendientes con navegación directa */}
          <div className="home-section-card">
            <h3 className="home-section-title">
              <Users className="home-section-icon" />
              Acciones Pendientes
            </h3>
            <div className="pending-actions-grid">
              <button 
                className="pending-action-card pending-action-red"
                onClick={handleNavigateToLocales}
                disabled={dashboardStats.localesComerciales.pendientes === 0}
              >
                <div className="pending-action-content">
                  <div className="pending-action-icon-container">
                    <FileText className="pending-action-icon" />
                  </div>
                  <div className="pending-action-info">
                    <span className="pending-action-label">Locales Comerciales</span>
                    <span className="pending-action-count">
                      {dashboardStats.localesComerciales.pendientes} pendientes
                    </span>
                  </div>
                  <div className="pending-action-arrow">→</div>
                </div>
                <div className="pending-action-shine"></div>
              </button>
              
              <button 
                className="pending-action-card pending-action-blue"
                onClick={handleNavigateToProyectos}
                disabled={dashboardStats.proyectos.pendientes === 0}
              >
                <div className="pending-action-content">
                  <div className="pending-action-icon-container">
                    <MessageSquare className="pending-action-icon" />
                  </div>
                  <div className="pending-action-info">
                    <span className="pending-action-label">Proyectos</span>
                    <span className="pending-action-count">
                      {dashboardStats.proyectos.pendientes} pendientes
                    </span>
                  </div>
                  <div className="pending-action-arrow">→</div>
                </div>
                <div className="pending-action-shine"></div>
              </button>
              
              <button 
                className="pending-action-card pending-action-danger"
                onClick={handleNavigateToEliminaciones}
                disabled={dashboardStats.eliminaciones.pendientes === 0}
              >
                <div className="pending-action-content">
                  <div className="pending-action-icon-container">
                    <Trash2 className="pending-action-icon" />
                  </div>
                  <div className="pending-action-info">
                    <span className="pending-action-label">Eliminaciones</span>
                    <span className="pending-action-count">
                      {dashboardStats.eliminaciones.pendientes} pendientes
                    </span>
                  </div>
                  <div className="pending-action-arrow">→</div>
                </div>
                <div className="pending-action-shine"></div>
              </button>
              
              <button 
                className="pending-action-card pending-action-green"
                onClick={handleNavigateToEmprendimientos}
                disabled={dashboardStats.emprendimientos.pendientes === 0}
              >
                <div className="pending-action-content">
                  <div className="pending-action-icon-container">
                    <Store className="pending-action-icon" />
                  </div>
                  <div className="pending-action-info">
                    <span className="pending-action-label">Emprendimientos</span>
                    <span className="pending-action-count">
                      {dashboardStats.emprendimientos.pendientes} pendientes
                    </span>
                  </div>
                  <div className="pending-action-arrow">→</div>
                </div>
                <div className="pending-action-shine"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de estadísticas detallado */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Locales Comerciales */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-500" />
              Locales Comerciales
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{dashboardStats.localesComerciales.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Pendientes:</span>
                <span className="font-medium text-yellow-600">{dashboardStats.localesComerciales.pendientes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Aprobados:</span>
                <span className="font-medium text-green-600">{dashboardStats.localesComerciales.aprobados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Rechazados:</span>
                <span className="font-medium text-red-600">{dashboardStats.localesComerciales.rechazados}</span>
              </div>
            </div>
          </div>

          {/* Eliminaciones */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Solicitudes de Eliminación
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{dashboardStats.eliminaciones.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Pendientes:</span>
                <span className="font-medium text-yellow-600">{dashboardStats.eliminaciones.pendientes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Eliminados:</span>
                <span className="font-medium text-green-600">{dashboardStats.eliminaciones.eliminados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Rechazados:</span>
                <span className="font-medium text-red-600">{dashboardStats.eliminaciones.rechazados}</span>
              </div>
            </div>
          </div>

          {/* Proyectos */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Proyectos
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{dashboardStats.proyectos.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Pendientes:</span>
                <span className="font-medium text-yellow-600">{dashboardStats.proyectos.pendientes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Aprobados:</span>
                <span className="font-medium text-green-600">{dashboardStats.proyectos.aprobados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Rechazados:</span>
                <span className="font-medium text-red-600">{dashboardStats.proyectos.rechazados}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

// Estilos CSS para las acciones pendientes
const pendingActionsStyles = `
.pending-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.pending-action-card {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-height: 80px;
  display: flex;
  align-items: center;
}

.pending-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
  border-color: currentColor;
}

.pending-action-card:active {
  transform: translateY(-1px);
  box-shadow: 
    0 5px 15px rgba(0, 0, 0, 0.2),
    0 2px 5px rgba(0, 0, 0, 0.15);
}

.pending-action-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06) !important;
}

.pending-action-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  z-index: 2;
  position: relative;
}

.pending-action-icon-container {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.pending-action-icon {
  width: 24px;
  height: 24px;
  color: white;
  transition: all 0.3s ease;
}

.pending-action-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pending-action-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.2;
}

.pending-action-count {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.pending-action-arrow {
  font-size: 1.25rem;
  font-weight: bold;
  opacity: 0.6;
  transition: all 0.3s ease;
  color: #6b7280;
}

.pending-action-card:hover .pending-action-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.pending-action-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.pending-action-card:hover .pending-action-shine {
  left: 100%;
}

/* Variantes de colores */
.pending-action-red .pending-action-icon-container {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.pending-action-red {
  border-left: 4px solid #ef4444;
}

.pending-action-red:hover {
  color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.pending-action-blue .pending-action-icon-container {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.pending-action-blue {
  border-left: 4px solid #3b82f6;
}

.pending-action-blue:hover {
  color: #3b82f6;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.pending-action-danger .pending-action-icon-container {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.pending-action-danger {
  border-left: 4px solid #f59e0b;
}

.pending-action-danger:hover {
  color: #f59e0b;
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
}

.pending-action-green .pending-action-icon-container {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.pending-action-green {
  border-left: 4px solid #10b981;
}

.pending-action-green:hover {
  color: #10b981;
  background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
}

/* Animaciones especiales */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06),
      0 0 0 0 currentColor;
  }
  50% {
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06),
      0 0 0 4px rgba(59, 130, 246, 0.1);
  }
}

.pending-action-card:focus {
  outline: none;
  animation: pulse-glow 2s infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .pending-actions-grid {
    grid-template-columns: 1fr;
  }
  
  .pending-action-card {
    padding: 1.25rem;
  }
  
  .pending-action-icon-container {
    width: 40px;
    height: 40px;
  }
  
  .pending-action-icon {
    width: 20px;
    height: 20px;
  }
}

/* Agregar pulse para botones con pendientes */
.pending-action-card:not(:disabled) {
  animation: subtle-pulse 3s infinite;
}

@keyframes subtle-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.005);
  }
}

.pending-action-card:hover {
  animation: none;
}
`;

// Inyectar estilos en el documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = pendingActionsStyles;
  document.head.appendChild(styleSheet);
}