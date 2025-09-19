// components/login/ApiProyectos.ts - API ESPECÍFICA PARA PROYECTOS - CORREGIDA
import { ApiService } from './ApiService';

// Interfaces específicas para proyectos - ACTUALIZADAS PARA COMPATIBILIDAD
export interface ProyectoAPI {
  id: string;
  // Propiedades en español (preferidas)
  nombre?: string;
  descripcion?: string;
  estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'en-progreso' | 'completado';
  fechaEnvio?: string;
  responsable?: string;
  presupuesto?: number;
  categoria?: string;
  fechaInicio?: string;
  fechaFin?: string;
  email?: string;
  cedula?: string;
  telefono?: string;
  address?: string;
  
  // Propiedades en inglés (compatibilidad con servidor)
  name?: string;
  description?: string;
  status?: string;
  phone?: string;
  direccion?: string;
  title?: string;
  desc?: string;
  responsible?: string;
  autor?: string;
  budget?: number;
  category?: string;
  cat?: string;
  fecha_envio?: string;
  fecha_inicio?: string;
  startDate?: string;
  fecha_fin?: string;
  endDate?: string;
  correo?: string;
  mail?: string;
  identification?: string;
  identificacion?: string;
  tel?: string;
  celular?: string;
  location?: string;
}

export interface ProyectoBase {
  nombre: string;
  descripcion: string;
  responsable?: string;
  presupuesto?: number;
  categoria?: string;
  email?: string;
  cedula?: string;
  telefono?: string;
  address?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface DocumentoProyecto {
  certificate?: string;
  identityDocument?: string;
  signedDocument?: string;
}

export interface ProyectoStats {
  totalProyectos: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
}

export class ApiProyectos {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  // *** MÉTODOS PRINCIPALES PARA PROYECTOS ***

  /**
   * Obtiene la lista paginada de proyectos
   */
  public async getProyectos(page: number = 0, size: number = 10, status?: string, search?: string): Promise<ApiResponse<PaginatedResponse<ProyectoAPI>>> {
    console.log('📋 Obteniendo proyectos con filtros:', { page, size, status, search });
    
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(status && { status }),
      ...(search && { search })
    });

    try {
      console.log(`🔄 Usando endpoint: /business/private-list-by-category?${params}`);
      const response = await this.apiService.request<any>(`/business/private-list-by-category?${params}`, { method: 'GET' });
      
      if (response.success) {
        console.log(`✅ Éxito obteniendo datos de negocios para proyectos`);
        return response;
      } else {
        console.warn(`⚠️ Endpoint falló:`, response.error);
        return response;
      }
    } catch (error) {
      console.warn(`⚠️ Error con endpoint:`, error);
      throw error;
    }
  }

  /**
   * Obtiene proyectos pendientes de aprobación
   */
  public async getProyectosPendientes(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<ProyectoAPI>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return this.apiService.request<PaginatedResponse<ProyectoAPI>>(`/admin/pending?${params}`, {
      method: 'GET'
    });
  }

  /**
   * Crea un nuevo proyecto
   */
  public async createProyecto(projectData: ProyectoBase): Promise<ApiResponse<ProyectoAPI>> {
    return this.apiService.request<ProyectoAPI>('/api/proyectos', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  /**
   * Obtiene un proyecto específico por ID
   */
  public async getProyecto(projectId: string): Promise<ApiResponse<ProyectoAPI>> {
    return this.apiService.request<ProyectoAPI>(`/api/proyectos/${projectId}`, {
      method: 'GET'
    });
  }

  /**
   * Actualiza un proyecto existente
   */
  public async updateProyecto(projectId: string, projectData: Partial<ProyectoBase>): Promise<ApiResponse<ProyectoAPI>> {
    return this.apiService.request<ProyectoAPI>(`/api/proyectos/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  /**
   * Elimina un proyecto
   */
  public async deleteProyecto(projectId: string): Promise<ApiResponse<{ message: string }>> {
    return this.apiService.request<{ message: string }>(`/api/proyectos/${projectId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Aprueba un proyecto
   */
  public async aprobarProyecto(projectId: string): Promise<ApiResponse<ProyectoAPI>> {
    return this.apiService.request<ProyectoAPI>(`/admin/approve/${projectId}`, {
      method: 'POST'
    });
  }

  /**
   * Rechaza un proyecto
   */
  public async rechazarProyecto(projectId: string): Promise<ApiResponse<ProyectoAPI>> {
    return this.apiService.request<ProyectoAPI>(`/admin/reject/${projectId}`, {
      method: 'POST'
    });
  }

  /**
   * Rechaza un usuario con observación
   */
  public async rechazarUsuario(userId: string, reason: string): Promise<ApiResponse<string>> {
    try {
      const token = this.apiService.getCurrentToken();
      
      if (!token) {
        console.error('❌ No hay token de autenticación');
        return {
          success: false,
          error: 'No hay token de autenticación',
          status: 401
        };
      }

      // Construir URL con parámetros query
      const baseUrl = 'http://34.10.172.54:8080';
      const url = new URL(`${baseUrl}/admin/reject/${userId}`);
      url.searchParams.append('reason', reason);

      console.log('🔄 Rechazando usuario:', {
        userId,
        reason: reason.substring(0, 50) + '...',
        url: url.toString()
      });

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        console.log('📄 Respuesta en texto:', textData);
        data = { message: textData || 'Usuario rechazado exitosamente' };
      }

      if (response.ok) {
        console.log('✅ Usuario rechazado exitosamente:', data);
        return {
          success: true,
          data: data.data || data.message || 'Usuario rechazado exitosamente',
          message: data.message || 'Usuario rechazado exitosamente'
        };
      } else {
        console.error('❌ Error del servidor al rechazar usuario:', {
          status: response.status,
          data
        });

        let errorMessage = 'Error al rechazar usuario';
        
        if (response.status === 400) {
          errorMessage = data.message || 'El usuario ya está habilitado';
        } else if (response.status === 404) {
          errorMessage = data.message || 'Usuario no encontrado';
        } else if (response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
        } else if (response.status === 403) {
          errorMessage = 'No tiene permisos para rechazar usuarios';
        } else {
          errorMessage = data.message || data.error || errorMessage;
        }

        return {
          success: false,
          error: errorMessage,
          status: response.status,
          data
        };
      }

    } catch (error) {
      console.error('💥 Error de red al rechazar usuario:', error);
      
      let errorMessage = 'Error de conexión al rechazar usuario';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Verifique que el servidor esté disponible.';
        } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          errorMessage = 'La conexión tardó demasiado tiempo. Intente nuevamente.';
        } else {
          errorMessage = `Error de conexión: ${error.message}`;
        }
      }

      return {
        success: false,
        error: errorMessage,
        status: 0
      };
    }
  }

  // *** MÉTODOS PARA DOCUMENTOS ***

  /**
   * Obtiene el certificado de un usuario
   */
  public async getUserCertificate(userId: string): Promise<ApiResponse<string>> {
    console.log('📄 Obteniendo certificado para usuario:', userId);
    
    try {
      const url = `http://34.10.172.54:8080/admin/get-user-certificate?userId=${userId}`;
      console.log(`🌐 Petición GET a: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: 'Error obteniendo certificado',
          status: response.status
        };
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      return {
        success: true,
        data: base64String,
        message: 'Certificado obtenido exitosamente'
      };
      
    } catch (error) {
      console.error('💥 Error obteniendo certificado:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo certificado',
        message: 'Error de conexión'
      };
    }
  }

  /**
   * Obtiene el documento de identidad de un usuario
   */
  public async getUserIdentityDocument(userId: string): Promise<ApiResponse<string>> {
    console.log('🆔 Obteniendo documento de identidad para usuario:', userId);
    
    try {
      const url = `http://34.10.172.54:8080/admin/get-user-identity-document?userId=${userId}`;
      console.log(`🌐 Petición GET a: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: 'Error obteniendo documento de identidad',
          status: response.status
        };
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      return {
        success: true,
        data: base64String,
        message: 'Documento de identidad obtenido exitosamente'
      };
      
    } catch (error) {
      console.error('💥 Error obteniendo documento de identidad:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo documento de identidad',
        message: 'Error de conexión'
      };
    }
  }

  /**
   * Obtiene el documento firmado de un usuario
   */
  public async getUserSignedDocument(userId: string): Promise<ApiResponse<string>> {
    console.log('📄 Obteniendo documento firmado para usuario:', userId);
    
    try {
      const url = `http://34.10.172.54:8080/admin/get-signed-document?userId=${userId}`;
      console.log(`🌐 Petición GET a: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'Documento firmado no encontrado para este usuario',
            message: 'No hay documento firmado disponible',
            status: response.status
          };
        }
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: 'Error obteniendo documento firmado',
          status: response.status
        };
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      return {
        success: true,
        data: base64String,
        message: 'Documento firmado obtenido exitosamente'
      };
      
    } catch (error) {
      console.error('💥 Error obteniendo documento firmado:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo documento firmado',
        message: 'Error de conexión'
      };
    }
  }

  /**
   * Obtiene el certificado del usuario actual
   */
  public async getCurrentUserCertificate(): Promise<ApiResponse<string>> {
    console.log('📄 Obteniendo certificado del usuario actual');
    
    try {
      const url = `http://34.10.172.54:8080/users/get-certificate`;
      console.log(`🌐 Petición GET a: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: 'Error obteniendo certificado del usuario actual',
          status: response.status
        };
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      return {
        success: true,
        data: base64String,
        message: 'Certificado obtenido exitosamente'
      };
      
    } catch (error) {
      console.error('💥 Error obteniendo certificado del usuario actual:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo certificado',
        message: 'Error de conexión'
      };
    }
  }

  // *** MÉTODOS PARA ESTADÍSTICAS ***

  /**
   * Obtiene estadísticas del dashboard de administrador
   */
  public async getAdminDashboardStats(): Promise<ApiResponse<{
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    rejectedUsers?: number;
  }>> {
    console.log('📊 Obteniendo estadísticas del dashboard de administrador');
    
    try {
      const response = await this.apiService.request<{
        totalUsers: number;
        pendingUsers: number;
        approvedUsers: number;
        rejectedUsers?: number;
      }>(`/admin/get-dashboard-stats`, {
        method: 'GET'
      });
      
      if (response.success) {
        console.log('✅ Estadísticas del dashboard obtenidas exitosamente');
        return response;
      } else {
        console.warn('⚠️ Endpoint de dashboard stats falló, usando estadísticas calculadas como respaldo');
        
        // Calcular estadísticas desde la lista de proyectos como respaldo
        const proyectosResponse = await this.getProyectosPendientes(0, 1000);
        if (proyectosResponse.success && proyectosResponse.data) {
          const proyectos = proyectosResponse.data.content;
          const stats = {
            totalUsers: proyectosResponse.data.totalElements,
            pendingUsers: proyectos.filter((p: any) => p.estado === 'pendiente').length,
            approvedUsers: proyectos.filter((p: any) => p.estado === 'aprobado').length,
            rejectedUsers: proyectos.filter((p: any) => p.estado === 'rechazado').length
          };
          
          return {
            success: true,
            data: stats,
            message: 'Estadísticas calculadas desde datos de proyectos'
          };
        }
        return response;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo estadísticas del dashboard:', error);
      return {
        success: false,
        error: 'Error obteniendo estadísticas del dashboard',
        status: 500
      };
    }
  }

  // *** MÉTODOS AUXILIARES ***

  /**
   * Obtiene headers para peticiones
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    };

    const token = this.apiService.getCurrentToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Header Authorization agregado con token');
    } else {
      console.warn('⚠️ No hay token disponible para agregar a headers');
    }

    return headers;
  }

  /**
   * Valida y normaliza estados
   */
  public validarEstado(estado: string | undefined): 'pendiente' | 'aprobado' | 'rechazado' | 'en-progreso' | 'completado' {
    if (!estado) return 'pendiente';
    
    const estadoLower = estado.toLowerCase();
    
    switch (estadoLower) {
      case 'pending':
      case 'pendiente':
        return 'pendiente';
      case 'approved':
      case 'aprobado':
        return 'aprobado';
      case 'rejected':
      case 'rechazado':
        return 'rechazado';
      case 'in-progress':
      case 'en-progreso':
      case 'progress':
      case 'progreso':
        return 'en-progreso';
      case 'completed':
      case 'completado':
      case 'finished':
      case 'terminado':
        return 'completado';
      default: {
        const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'en-progreso', 'completado'] as const;
        if ((estadosValidos as readonly string[]).includes(estado)) {
          return estado as 'pendiente' | 'aprobado' | 'rechazado' | 'en-progreso' | 'completado';
        }
        return 'pendiente';
      }
    }
  }

  /**
   * Formatea el texto del estado para mostrar
   */
  public formatEstadoText(estado: string | undefined): string {
    if (!estado) return 'Sin estado';
    return estado.charAt(0).toUpperCase() + estado.slice(1).replace('-', ' ');
  }

  /**
   * Obtiene el color CSS para un estado
   */
  public getStatusColor(estado: string | undefined): string {
    if (!estado) return 'bg-gray-100 text-gray-800';
    
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      case 'en-progreso': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Calcula estadísticas de una lista de proyectos
   */
  public calculateStats(proyectosList: ProyectoAPI[], total: number): ProyectoStats {
    const pendientes = proyectosList.filter(p => p.estado === 'pendiente').length;
    const aprobados = proyectosList.filter(p => p.estado === 'aprobado').length;
    const rechazados = proyectosList.filter(p => p.estado === 'rechazado').length;
    
    return {
      totalProyectos: total,
      pendientes,
      aprobados,
      rechazados
    };
  }

  // *** VERIFICACIÓN DE AUTENTICACIÓN ***

  /**
   * Verifica si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    return this.apiService.isAuthenticated();
  }

  /**
   * Obtiene el token actual
   */
  public getCurrentToken(): string | null {
    return this.apiService.getCurrentToken();
  }

  /**
   * Verifica si el token está expirado
   */
  public isTokenExpired(): boolean {
    return this.apiService.isTokenExpired();
  }
}