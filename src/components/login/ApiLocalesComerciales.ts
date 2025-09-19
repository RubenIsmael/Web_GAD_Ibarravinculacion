// ApiLocalesComerciales.ts - API específica para el componente LocalesComerciales
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface BusinessUser {
  id: number;
  name: string;
  email: string;
  identification: string;
}

export interface BusinessCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface BusinessAPI {
  id: number;
  commercialName: string;
  representativeName: string;
  cedulaOrRuc: string;
  phone: string;
  email: string;
  parishCommunitySector: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  website: string;
  description: string;
  productsServices: string | null;
  acceptsWhatsappOrders: boolean;
  deliveryService: 'BAJO_PEDIDO' | 'DISPONIBLE' | 'NO_DISPONIBLE';
  salePlace: 'FERIAS' | 'LOCAL' | 'DOMICILIO' | 'ONLINE';
  receivedUdelSupport: boolean | null;
  udelSupportDetails: string | null;
  signatureUrl: string | null;
  registrationDate: string | null;
  cedulaFileUrl: string | null;
  logoUrl: string | null;
  validationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: BusinessUser;
  category: BusinessCategory;
}

export class ApiLocalesComerciales {
  private readonly API_BASE_URL = 'http://34.10.172.54:8080';
  private authToken: string | null = null;

  // *** MÉTODOS DE GESTIÓN DE TOKEN ***
  
  private getAuthToken(): string | null {
    if (this.authToken) {
      return this.authToken;
    }

    const STORAGE_KEYS = ['auth_token', 'authToken', 'token'];

    // Intentar recuperar de sessionStorage
    try {
      for (const key of STORAGE_KEYS) {
        const sessionToken = sessionStorage.getItem(key);
        if (sessionToken) {
          this.authToken = sessionToken;
          return sessionToken;
        }
      }
    } catch (error) {
      console.warn('Error accediendo sessionStorage:', error);
    }

    // Intentar recuperar de localStorage como respaldo
    try {
      for (const key of STORAGE_KEYS) {
        const localToken = localStorage.getItem(key);
        if (localToken) {
          this.authToken = localToken;
          return localToken;
        }
      }
    } catch (error) {
      console.warn('Error accediendo localStorage:', error);
    }

    return null;
  }

  private clearAuthToken(): void {
    this.authToken = null;
    
    // Limpiar de sessionStorage
    try {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
    } catch (error) {
      console.warn('Error limpiando sessionStorage:', error);
    }
    
    // Limpiar de localStorage
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.warn('Error limpiando localStorage:', error);
    }
  }

  // *** MÉTODOS PÚBLICOS PARA GESTIÓN DE TOKEN ***
  
  public isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) {
      return false;
    }
    
    if (this.isTokenExpired()) {
      this.clearAuthToken();
      return false;
    }
    
    return true;
  }

  public getCurrentToken(): string | null {
    return this.getAuthToken();
  }

  public clearToken(): void {
    this.clearAuthToken();
  }

  public isTokenExpired(): boolean {
    const token = this.getAuthToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;
      
      if (isExpired) {
        console.log('Token expirado');
      }
      
      return isExpired;
    } catch (error) {
      console.error('Error al verificar expiración del token:', error);
      return true;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // *** MÉTODO GENÉRICO PARA PETICIONES ***
  
  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.API_BASE_URL}${endpoint}`;
      
      console.log(`Petición a: ${url}`);
      console.log(`Método: ${options.method || 'GET'}`);
      console.log(`Token presente: ${this.isAuthenticated()}`);
      
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

      let response: Response;
      
      try {
        response = await fetch(url, config);
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type') || '';
      let data: Record<string, unknown> | null = null;
      
      try {
        const responseText = await response.text();
        
        if (responseText.trim()) {
          if (contentType.includes('application/json') || 
              responseText.trim().startsWith('{') || 
              responseText.trim().startsWith('[')) {
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('Error parseando JSON:', parseError);
              data = { 
                message: 'Error al parsear respuesta JSON',
                rawResponse: responseText.substring(0, 200)
              };
            }
          } else {
            data = { 
              message: responseText,
              type: 'text'
            };
          }
        } else {
          data = { message: 'Respuesta vacía del servidor' };
        }
      } catch (readError) {
        console.error('Error leyendo respuesta:', readError);
        data = { message: 'Error al leer la respuesta del servidor' };
      }

      // Manejo de respuestas exitosas
      if (response.ok) {
        return {
          success: true,
          data: data as T,
          message: data?.message as string || 'Operación exitosa',
          status: response.status,
        };
      }

      // Manejo de errores HTTP
      const errorMessage = (data?.message || 
                          data?.error || 
                          data?.detail ||
                          `HTTP ${response.status}: ${response.statusText}`) as string;
      
      console.error(`Error HTTP: ${errorMessage}`);
      
      // Manejo específico de códigos de error
      if (response.status === 401) {
        console.warn('Token expirado o inválido, limpiando...');
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
      
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        status: response.status,
      };
      
    } catch (error) {
      console.error('Error en petición:', error);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          error: 'La petición tardó demasiado tiempo. Verifique su conexión.',
          message: 'Timeout de conexión',
        };
      }
      
      if (error instanceof TypeError) {
        return {
          success: false,
          error: 'Error de red. Verifique su conexión a internet.',
          message: 'Error de conexión',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        message: 'Error en la operación',
      };
    }
  }

  // *** MÉTODOS ESPECÍFICOS PARA LOCALES COMERCIALES ***

  /**
   * Obtiene la lista paginada de negocios privados por categoría (ADMIN)
   */
  public async getPrivateBusinessList(page: number = 0, size: number = 10, category?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(category && { category })
    });
    
    console.log('Obteniendo lista privada de negocios:', { page, size, category });
    
    const possibleEndpoints = [
      `/business/private-list-by-category?${params}`,
      `/business/admin/list?${params}`,
      `/admin/business/list?${params}`,
      `/business/list?${params}&type=private`
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Intentando endpoint: ${endpoint}`);
        const response = await this.request<any>(endpoint, { method: 'GET' });
        
        if (response.success) {
          console.log(`Éxito con endpoint: ${endpoint}`);
          return response;
        } else if (response.status !== 404) {
          return response;
        }
      } catch (error) {
        console.warn(`Endpoint ${endpoint} falló:`, error);
      }
    }

    return {
      success: false,
      error: 'No se encontró un endpoint válido para obtener la lista de negocios',
      status: 404
    };
  }

  /**
   * Aprueba un negocio
   */
  public async approveBusiness(businessId: number): Promise<ApiResponse<any>> {
    console.log('Aprobando negocio:', businessId);

    const approvalMethods = [
      // Método principal según el componente
      async () => {
        console.log('Método 1: POST /admin/business/approve/{businessId}');
        return await this.request<any>(`/admin/business/approve/${businessId}`, {
          method: 'POST'
        });
      },
      
      // Métodos alternativos
      async () => {
        console.log('Método 2: POST /business/approve/{id}');
        return await this.request<any>(`/business/approve/${businessId}`, {
          method: 'POST'
        });
      },
      
      async () => {
        console.log('Método 3: PUT para actualizar estado');
        return await this.request<any>(`/business/${businessId}`, {
          method: 'PUT',
          body: JSON.stringify({
            validationStatus: 'APPROVED',
            approvedBy: 'admin',
            approvalDate: new Date().toISOString()
          })
        });
      }
    ];

    let lastError;

    for (const method of approvalMethods) {
      try {
        const response = await method();
        
        if (response.success) {
          console.log('Negocio aprobado exitosamente');
          return response;
        } else if (response.status !== 404 && response.status !== 500) {
          lastError = response;
          break;
        }
        
        lastError = response;
      } catch (methodError) {
        console.warn('Método de aprobación falló:', methodError);
        lastError = {
          success: false,
          error: 'Error de conexión',
          status: 500
        };
      }
    }

    console.error('Todos los métodos de aprobación fallaron');
    return lastError || {
      success: false,
      error: 'No se encontró un método válido para aprobar el negocio',
      status: 404
    };
  }

  /**
   * Rechaza un negocio con razón
   */
  public async rejectBusiness(businessId: number, reason: string): Promise<ApiResponse<any>> {
    console.log('Rechazando negocio:', businessId, 'Razón:', reason.substring(0, 50) + '...');

    const rejectionMethods = [
      // Método principal según el componente
      async () => {
        console.log('Método 1: PUT /admin/business/reject/{businessId} con query params');
        const params = new URLSearchParams({ reason });
        return await this.request<any>(`/admin/business/reject/${businessId}?${params}`, {
          method: 'PUT'
        });
      },
      
      // Métodos alternativos
      async () => {
        console.log('Método 2: POST con observacion en body');
        return await this.request<any>(`/business/reject/${businessId}`, {
          method: 'POST',
          body: JSON.stringify({
            observacion: reason.trim(),
            timestamp: new Date().toISOString()
          })
        });
      },
      
      async () => {
        console.log('Método 3: PUT para actualizar estado con observaciones');
        return await this.request<any>(`/business/${businessId}`, {
          method: 'PUT',
          body: JSON.stringify({
            validationStatus: 'REJECTED',
            rejectionReason: reason.trim(),
            rejectedBy: 'admin',
            rejectionDate: new Date().toISOString()
          })
        });
      }
    ];

    let lastError;

    for (const method of rejectionMethods) {
      try {
        const response = await method();
        
        if (response.success) {
          console.log('Negocio rechazado exitosamente');
          return response;
        } else if (response.status !== 404 && response.status !== 500) {
          lastError = response;
          break;
        }
        
        lastError = response;
      } catch (methodError) {
        console.warn('Método de rechazo falló:', methodError);
        lastError = {
          success: false,
          error: 'Error de conexión',
          status: 500
        };
      }
    }

    console.error('Todos los métodos de rechazo fallaron');
    return lastError || {
      success: false,
      error: 'No se encontró un método válido para rechazar el negocio',
      status: 404
    };
  }

  /**
   * Obtiene detalles completos de un negocio incluyendo fotos/documentos
   */
  public async getBusinessDetails(businessId: number): Promise<ApiResponse<{ photos: any[] }>> {
    console.log(`Obteniendo detalles completos para negocio ${businessId}`);
    
    const endpointsToTry = [
      `/admin/business/${businessId}`,
      `/business/${businessId}`,
      `/api/business/${businessId}`,
      `/admin/business/${businessId}/photos`,
      `/business/${businessId}/photos`,
      `/business/photos/${businessId}`
    ];

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Probando endpoint: ${endpoint}`);
        
        const response: any = await this.request(endpoint, {
          method: 'GET'
        });

        if (response.success && response.data) {
          const businessData = response.data;
          
          let photos = [];
          
          if (businessData.photos && Array.isArray(businessData.photos)) {
            photos = businessData.photos;
          } else if (Array.isArray(businessData)) {
            photos = businessData;
          } else if (businessData.data && Array.isArray(businessData.data)) {
            photos = businessData.data;
          }

          if (photos.length > 0) {
            console.log(`Se encontraron ${photos.length} fotos en ${endpoint}`);
            
            const photosProcessed = photos.map((photo: any, index: number) => ({
              id: photo.id || `photo_${businessId}_${index}`,
              url: photo.url || '',
              photoType: photo.photoType || photo.type || 'SLIDE',
              fileType: photo.fileType || photo.extension || 'unknown',
              publicId: photo.publicId || '',
              originalName: photo.originalName || photo.name || `documento_${index + 1}`
            }));
            
            return { 
              success: true, 
              data: { photos: photosProcessed },
              message: 'Fotos obtenidas exitosamente'
            };
          }
        }
      } catch (endpointError) {
        console.log(`Error con endpoint ${endpoint}:`, endpointError);
        continue;
      }
    }

    console.log('No se encontraron fotos en ningún endpoint');
    return { 
      success: true, 
      data: { photos: [] },
      message: 'No se encontraron fotos para este negocio'
    };
  }

  /**
   * Obtiene estadísticas de negocios
   */
  public async getBusinessStats(): Promise<ApiResponse<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>> {
    console.log('Obteniendo estadísticas de negocios');

    try {
      // Calcular estadísticas desde la lista general de negocios
      const businessListResponse = await this.getPrivateBusinessList(0, 1000);
      
      if (businessListResponse.success && businessListResponse.data?.data?.content) {
        const businesses = businessListResponse.data.data.content;
        const stats = {
          total: businessListResponse.data.data.totalElements || businesses.length,
          pending: businesses.filter((b: any) => b.validationStatus === 'PENDING').length,
          approved: businesses.filter((b: any) => b.validationStatus === 'APPROVED' || b.validationStatus === 'VALIDATED').length,
          rejected: businesses.filter((b: any) => b.validationStatus === 'REJECTED').length
        };
        
        console.log('Estadísticas calculadas:', stats);
        return {
          success: true,
          data: stats,
          message: 'Estadísticas calculadas exitosamente'
        };
      } else {
        return {
          success: false,
          error: 'No se pudo obtener la lista de negocios',
          status: businessListResponse.status || 500
        };
      }
    } catch (error) {
      console.warn('Error calculando estadísticas:', error);
      return {
        success: false,
        error: 'Error de conexión al calcular estadísticas',
        status: 500
      };
    }
  }

  /**
   * Corrige URLs problemáticas (método auxiliar usado en el componente)
   */
  public corregirURL(url: string): string {
    if (!url || !url.startsWith('http')) return url;
    let urlCorregida = url;
    if (url.includes('192.168.56.1') || url.includes('192.168.1.25')) {
      urlCorregida = urlCorregida.replace(/192\.168\.(56\.1|1\.25):\d+/, 'localhost:5173');
    }
    if (url.includes(':5174') || url.includes(':3000') || url.includes(':8080')) {
      urlCorregida = urlCorregida.replace(/:\d+/, ':5173');
    }
    return urlCorregida;
  }

  /**
   * Valida el estado de un negocio (método auxiliar usado en el componente)
   */
  public validarEstadoNegocio(estado: string | undefined): 'PENDING' | 'APPROVED' | 'REJECTED' {
    if (!estado) return 'PENDING';
    const estadoUpper = estado.toUpperCase();
    switch (estadoUpper) {
      case 'PENDING':
      case 'PENDIENTE':
        return 'PENDING';
      case 'APPROVED':
      case 'APROBADO':
      case 'VALIDATED':
        return 'APPROVED';
      case 'REJECTED':
      case 'RECHAZADO':
        return 'REJECTED';
      default:
        return 'PENDING';
    }
  }
}