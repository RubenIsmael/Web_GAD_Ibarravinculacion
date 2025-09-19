const API_BASE_URL = 'http://34.10.172.54:8080';

// Tipos de datos específicos basados en la API real
export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: User;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data?: string;
  id?: string;
  status?: string;
  timestamp?: string;
  approvedBy?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

// Interfaces específicas para proyectos basadas en Swagger
export interface ProyectoAPI {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'en-progreso' | 'completado';
  fechaEnvio: string;
  responsable: string;
  email?: string;
  identification?: string;
  presupuesto?: number;
  categoria?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

// Interfaces específicas para promociones basadas en la API real
export interface PromocionAPI {
  id: number;
  businessId: number;
  title: string;
  description: string;
  discount?: number;
  originalPrice?: number;
  promotionalPrice?: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  category: string;
  imageUrl?: string;
  businessName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromocionRequest {
  businessId: number;
  title: string;
  description: string;
  discount?: number;
  originalPrice?: number;
  promotionalPrice?: number;
  startDate: string;
  endDate: string;
  category: string;
  imageUrl?: string;
}

export interface UpdatePromocionRequest extends Partial<CreatePromocionRequest> {
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

export interface PromocionSearchParams {
  businessId?: number;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  empty: boolean;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  size: number;
  number: number;
}

export interface CreateProyectoRequest {
  nombre: string;
  descripcion: string;
  responsable?: string;
  presupuesto?: number;
  categoria?: string;
}

export interface UpdateProyectoRequest extends Partial<CreateProyectoRequest> {
  estado?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version?: string;
  uptime?: number;
  database?: string;
}

// Interfaz para respuestas de servidor genéricas
interface ServerResponse {
  message?: string;
  error?: string;
  detail?: string;
  type?: string;
  rawResponse?: string;
  [key: string]: unknown;
}

// Clase mejorada para manejar las peticiones a la API
class ApiService {
  private baseUrl: string;
  // private isServerAvailable: boolean = false; // DESHABILITADO temporalmente
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // NO cargar token desde ningún lado - empezar sin token
  }

  // *** MÉTODOS DE GESTIÓN DE TOKEN ACTUALIZADOS ***
  
  // Método para guardar el token de autenticación
  private saveAuthToken(token: string): void {
    this.authToken = token;
    console.log('🔐 Token guardado exitosamente en memoria');
  }

  // Método para limpiar el token de autenticación
  private clearAuthToken(): void {
    this.authToken = null;
    console.log('🗑️ Token eliminado de memoria');
  }

  // Método para obtener el token de autenticación
  private getAuthToken(): string | null {
    return this.authToken;
  }

  // Método para crear headers con autenticación Bearer
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'User-Agent': 'Ibarra-Municipal-App/1.0.2',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Método mejorado para verificar la conexión base
  private async checkBaseConnection(): Promise<boolean> {
    try {
      console.log('🔍 Verificando conexión base del servidor...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Intentar múltiples métodos para verificar la conexión
      const methods = ['HEAD', 'GET', 'OPTIONS'];
      
      for (const method of methods) {
        try {
          const response = await fetch(this.baseUrl, {
            method: method,
            signal: controller.signal,
            headers: {
              'Accept': '*/*',
              'Cache-Control': 'no-cache',
            },
          });
          
          clearTimeout(timeoutId);
          console.log(`✅ Servidor respondió con ${method}: ${response.status}`);
          
          // this.isServerAvailable = true; // DESHABILITADO temporalmente
          return true;
        } catch (methodError) {
          console.log(`❌ Método ${method} falló:`, methodError);
          continue;
        }
      }
      
      clearTimeout(timeoutId);
      // this.isServerAvailable = false; // DESHABILITADO temporalmente
      return false;
      
    } catch {
      console.error('❌ Error conectando al servidor base');
      // this.isServerAvailable = false; // DESHABILITADO temporalmente
      return false;
    }
  }

  // Método genérico mejorado para hacer peticiones
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Configuración mejorada de la petición
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 
      
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
      };

      console.log(`🌐 Petición a: ${url}`);
      console.log(`⚙️ Método: ${config.method || 'GET'}`);
      console.log(`🔑 Token presente: ${this.getAuthToken() ? 'SÍ' : 'NO'}`);

      let response: Response;
      
      try {
        response = await fetch(url, config);
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      // Información adicional de la respuesta
      const contentType = response.headers.get('content-type') || '';
      
      // Manejo mejorado de diferentes tipos de respuesta
      let data: ServerResponse | null = null;
      
      try {
        const responseText = await response.text();
        
        if (responseText.trim()) {
          if (contentType.includes('application/json') || 
              responseText.trim().startsWith('{') || 
              responseText.trim().startsWith('[')) {
            try {
              data = JSON.parse(responseText) as ServerResponse;
              console.log('📊 JSON parseado exitosamente');
            } catch (parseError) {
              console.error('❌ Error parseando JSON:', parseError);
              data = { 
                message: 'Error al parsear respuesta JSON',
                rawResponse: responseText.substring(0, 200)
              };
            }
          } else {
            console.log('📝 Respuesta no es JSON');
            data = { 
              message: responseText,
              type: 'text'
            };
          }
        } else {
          console.log('📭 Respuesta vacía');
          data = { message: 'Respuesta vacía del servidor' };
        }
      } catch (readError) {
        console.error('❌ Error leyendo respuesta:', readError);
        data = { message: 'Error al leer la respuesta del servidor' };
      }

      // Manejo de respuestas exitosas
      if (response.ok) {
        console.log('✅ Petición exitosa');
        return {
          success: true,
          data: data as T,
          message: data?.message || 'Operación exitosa',
          status: response.status,
        };
      }

      // Manejo de errores HTTP
      const errorMessage = data?.message || 
                          data?.error || 
                          data?.detail ||
                          `HTTP ${response.status}: ${response.statusText}`;
      
      console.error(`❌ Error HTTP: ${errorMessage}`);
      
      // Manejo específico de códigos de error
      if (response.status === 401) {
        console.warn('🚫 Token expirado o inválido, limpiando...');
        this.clearAuthToken();
        return {
          success: false,
          error: 'Sesión expirada. Inicie sesión nuevamente.',
          message: 'No autorizado',
          status: response.status,
        };
      }
      
      if (response.status === 403) {
        return {
          success: false,
          error: 'No tiene permisos para realizar esta operación.',
          message: 'Acceso denegado',
          status: response.status,
        };
      }
      
      if (response.status === 404) {
        return {
          success: false,
          error: 'Recurso no encontrado.',
          message: 'No encontrado',
          status: response.status,
        };
      }
      
      if (response.status >= 500) {
        return {
          success: false,
          error: 'Error interno del servidor. Intente más tarde.',
          message: 'Error del servidor',
          status: response.status,
        };
      }

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        status: response.status,
      };
      
    } catch (error) {
      console.error('💥 Error en petición:', error);
      
      // Manejo específico de diferentes tipos de errores
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          error: 'La petición tardó demasiado tiempo. Verifique su conexión.',
          message: 'Timeout de conexión',
        };
      }
      
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return {
            success: false,
            error: 'Error de red. Verifique su conexión a internet.',
            message: 'Error de conexión',
          };
        }
        
        if (error.message.includes('cors')) {
          return {
            success: false,
            error: 'Error de CORS. El servidor no permite esta petición.',
            message: 'Error de política de origen cruzado',
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        message: 'Error en la operación',
      };
    }
  }

  // *** MÉTODO DE AUTENTICACIÓN MEJORADO PARA CAPTURAR TOKEN ***
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Iniciando proceso de login...');
      console.log('👤 Usuario:', credentials.username);
      
      // Validaciones básicas
      if (!credentials.username?.trim()) {
        return {
          success: false,
          message: 'El nombre de usuario es requerido'
        };
      }
      
      if (!credentials.password?.trim()) {
        return {
          success: false,
          message: 'La contraseña es requerida'
        };
      }
      
      // Verificar conexión base
      const serverAvailable = await this.checkBaseConnection();
      if (!serverAvailable) {
        return {
          success: false,
          message: 'No se puede conectar con el servidor. Verifique la conexión.',
        };
      }
      
      // Endpoints de login posibles
      const loginEndpoints = [
        '/api/auth/login',
        '/auth/login', 
        '/login',
        '/api/login',
        '/api/v1/auth/login',
        '/v1/auth/login'
      ];
      
      const loginData = {
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      };
      
      for (const endpoint of loginEndpoints) {
        try {
          console.log(`🎯 Probando endpoint: ${this.baseUrl}${endpoint}`);
          
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(loginData),
            mode: 'cors',
            credentials: 'include',
          });

          console.log(`📡 Status: ${response.status}`);

          if (response.status === 404 || response.status === 405) {
            console.log(`⏭️ Endpoint ${endpoint} no disponible, continuando...`);
            continue;
          }

          let responseData: ServerResponse = {};
          try {
            const responseText = await response.text();
            console.log(`📄 Response text: ${responseText.substring(0, 300)}`);
            
            if (responseText.trim()) {
              responseData = JSON.parse(responseText) as ServerResponse;
            }
          } catch (parseError) {
            console.error('❌ Error parseando respuesta:', parseError);
            responseData = { message: 'Error al procesar respuesta del servidor' };
          }
          
          // *** LOGIN EXITOSO - CAPTURAR TOKEN ***
          if (response.ok) {
            console.log('🎉 Login exitoso!');
            
            // Buscar token en múltiples ubicaciones posibles
            const token = (responseData as Record<string, unknown>).token as string || 
                         (responseData as Record<string, unknown>).accessToken as string ||
                         (responseData as Record<string, unknown>).access_token as string ||
                         (responseData as Record<string, unknown>).authToken as string ||
                         (responseData as Record<string, unknown>).jwt as string ||
                         response.headers.get('Authorization') ||
                         response.headers.get('X-Auth-Token');
            
            // *** GUARDAR EL TOKEN AUTOMÁTICAMENTE ***
            if (token) {
              this.saveAuthToken(token);
              console.log('✅ Token capturado y guardado automáticamente');
              console.log('🔑 Token preview:', token.substring(0, 50) + '...');
            } else {
              console.warn('⚠️ No se encontró token en la respuesta del login');
              console.log('📊 Datos de respuesta:', responseData);
            }
            
            const userObj = (responseData as Record<string, unknown>).user as Record<string, unknown> || {};
            const user: User = {
              id: ((responseData as Record<string, unknown>).id || 
                  userObj.id || 
                  Date.now().toString()) as string,
              username: ((responseData as Record<string, unknown>).username || 
                       userObj.username || 
                       credentials.username) as string,
              email: ((responseData as Record<string, unknown>).email || 
                     userObj.email) as string,
              role: ((responseData as Record<string, unknown>).role || 
                    userObj.role || 
                    'user') as string,
            };
            
            return {
              success: true,
              token: token || undefined,
              user: user,
              message: responseData.message || 'Autenticación exitosa',
            };
          }
          
          // Manejar errores de autenticación
          if (response.status === 401 || response.status === 403) {
            return {
              success: false,
              message: 'Credenciales incorrectas. Verifique su usuario y contraseña.',
            };
          }
          
          // Para otros errores, continuar con el siguiente endpoint
          console.log(`❌ Error ${response.status}, probando siguiente endpoint...`);
          
        } catch (endpointError) {
          console.error(`💥 Error con endpoint ${endpoint}:`, endpointError);
          continue;
        }
      }
      
      return {
        success: false,
        message: 'Error en el proceso de autenticación',
      };
      
    } catch (loginError) {
      console.error('💥 Error general de login:', loginError);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
      };
    }
  }

  // Método de logout que limpia el token
  async logout(): Promise<ApiResponse<void>> {
    try {
      const result = await this.request<void>('/auth/logout', {
        method: 'POST',
      });
      
      this.clearAuthToken();
      return result;
    } catch {
      this.clearAuthToken();
      return {
        success: true, 
        message: 'Sesión cerrada localmente',
      };
    }
  }

  // Métodos HTTP básicos
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
    const baseConnection = await this.checkBaseConnection();
    if (!baseConnection) {
      return {
        success: false,
        error: 'No se puede conectar con el servidor',
        message: 'Servidor no disponible',
      };
    }
    
    const healthEndpoints = ['/health', '/actuator/health', '/api/health', '/status'];
    
    for (const endpoint of healthEndpoints) {
      try {
        const result = await this.get<HealthCheckResponse>(endpoint);
        if (result.success) {
          return result;
        }
      } catch {
        continue;
      }
    }
    
    return {
      success: true,
      data: {
        status: 'available',
        timestamp: new Date().toISOString(),
      },
      message: 'Servidor disponible',
    };
  }

  // ========== MÉTODOS ESPECÍFICOS PARA PROYECTOS (basados en Swagger) ==========
  
  // Obtener proyectos pendientes con paginación (basado en swagger)
  async getProyectosPendientes(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<ProyectoAPI>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    return this.get<PaginatedResponse<ProyectoAPI>>(`/admin/pending?${params.toString()}`);
  }

  // Aprobar usuario/proyecto (basado en swagger)
  async aprobarProyecto(userId: string): Promise<ApiResponse<ApprovalResponse>> {
    return this.post<ApprovalResponse>(`/admin/approve/${userId}`, {});
  }

  // Rechazar usuario/proyecto (basado en swagger)
  async rechazarProyecto(userId: string): Promise<ApiResponse<ApprovalResponse>> {
    return this.delete<ApprovalResponse>(`/admin/reject/${userId}`);
  }

  // Obtener todos los proyectos con filtros y paginación
  async getProyectos(
    page: number = 0, 
    size: number = 10, 
    estado?: string, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse<ProyectoAPI>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (estado && estado !== 'all') {
      params.append('estado', estado);
    }
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    
    return this.get<PaginatedResponse<ProyectoAPI>>(`/api/proyectos?${params.toString()}`);
  }

  // Obtener proyecto específico
  async getProyecto(id: string): Promise<ApiResponse<ProyectoAPI>> {
    return this.get<ProyectoAPI>(`/api/proyectos/${id}`);
  }

  // Crear nuevo proyecto
  async createProyecto(data: CreateProyectoRequest): Promise<ApiResponse<ProyectoAPI>> {
    return this.post<ProyectoAPI>('/api/proyectos', data);
  }

  // Actualizar proyecto
  async updateProyecto(id: string, data: UpdateProyectoRequest): Promise<ApiResponse<ProyectoAPI>> {
    return this.put<ProyectoAPI>(`/api/proyectos/${id}`, data);
  }

  // Eliminar proyecto
  async deleteProyecto(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/proyectos/${id}`);
  }

  // ========== MÉTODOS ESPECÍFICOS PARA PROMOCIONES (basados en la API real) ==========
  
  // GET /promotions/business/public - Listar promociones activas públicas
  async getPromocionesPublicas(params?: PromocionSearchParams): Promise<ApiResponse<PaginatedResponse<PromocionAPI>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/promotions/business/public?${queryString}` : '/promotions/business/public';
    
    return this.get<PaginatedResponse<PromocionAPI>>(endpoint);
  }

  // GET /promotions/listPromXBusinessId - Listar promociones por businessId (según Swagger)
  async getPromocionesPorBusinessId(businessId: number, params?: PromocionSearchParams): Promise<ApiResponse<PaginatedResponse<PromocionAPI>>> {
    const searchParams = new URLSearchParams();
    searchParams.append('businessId', businessId.toString());
    
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    
    return this.get<PaginatedResponse<PromocionAPI>>(`/promotions/listPromXBusinessId?${searchParams.toString()}`);
  }

  // GET /promotions/business/private - Listar promociones por businessId (privado)
  async getPromocionesPrivadas(businessId: number, params?: PromocionSearchParams): Promise<ApiResponse<PaginatedResponse<PromocionAPI>>> {
    const searchParams = new URLSearchParams();
    searchParams.append('businessId', businessId.toString());
    
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    
    return this.get<PaginatedResponse<PromocionAPI>>(`/promotions/business/private?${searchParams.toString()}`);
  }

  // GET /promotions/business/public/search - Buscar promociones con filtros dinámicos
  async buscarPromocionesPublicas(params: PromocionSearchParams): Promise<ApiResponse<PaginatedResponse<PromocionAPI>>> {
    const searchParams = new URLSearchParams();
    
    if (params.businessId) searchParams.append('businessId', params.businessId.toString());
    if (params.category) searchParams.append('category', params.category);
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    
    return this.get<PaginatedResponse<PromocionAPI>>(`/promotions/business/public/search?${searchParams.toString()}`);
  }

  // POST /promotions/business/create - Crear nueva promoción
  async crearPromocion(data: CreatePromocionRequest): Promise<ApiResponse<PromocionAPI>> {
    return this.post<PromocionAPI>('/promotions/business/create', data);
  }

  // PUT /promotions/business/update/{promoId} - Actualizar promoción
  async actualizarPromocion(promoId: number, data: UpdatePromocionRequest): Promise<ApiResponse<PromocionAPI>> {
    return this.put<PromocionAPI>(`/promotions/business/update/${promoId}`, data);
  }

  // DELETE /promotions/business/delete - Eliminar promoción
  async eliminarPromocion(promoId: number): Promise<ApiResponse<void>> {
    const searchParams = new URLSearchParams();
    searchParams.append('promoId', promoId.toString());
    
    return this.delete<void>(`/promotions/business/delete?${searchParams.toString()}`);
  }

  // ========== MÉTODOS DE UTILIDAD PARA TOKEN ==========
  
  // Verificar si hay token válido
  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }

  // Obtener token actual (para debugging)
  getCurrentToken(): string | null {
    return this.getAuthToken();
  }

  // Establecer token manualmente (si es necesario)
  setToken(token: string): void {
    this.saveAuthToken(token);
  }

  // Limpiar token manualmente
  clearToken(): void {
    this.clearAuthToken();
  }

  // Método para verificar si el token está expirado
  isTokenExpired(): boolean {
    const token = this.getAuthToken();
    if (!token) {
      return true;
    }
    
    try {
      // Decodificar el JWT para verificar la expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Verificar si el token expira en los próximos 5 minutos
      return payload.exp && (payload.exp - now) < 300;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return true; 
    }
  }

  // Método para refrescar el token
  refreshToken(): void {
    console.log('🔄 Token expirado, es necesario hacer login nuevamente...');
    this.clearAuthToken();
  }
}

// Instancia del servicio API
export const apiService = new ApiService(API_BASE_URL);

// Hook personalizado para usar en componentes React
export const useApi = () => {
  return apiService;
};

// Función helper para manejar errores de API
export const handleApiError = (error: ApiResponse<unknown>): string => {
  return error.error || error.message || 'Error desconocido';
};

// Función helper para verificar si el usuario está autenticado
export const isUserAuthenticated = (): boolean => {
  return apiService.isAuthenticated();
};

export default apiService;