// API service client for Zentary Mobile connecting to Express + Prisma Backend

export const API_BASE_URL = 'https://zentary-backend-production.up.railway.app/api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'RESIDENT' | 'GUARD' | 'ADMIN';
  avatarUrl?: string;
}

export type VisitStatusType =
  | 'PENDIENTE_REGISTRO'
  | 'DATOS_COMPLETADOS'
  | 'INGRESADA'
  | 'CANCELADA'
  | 'VENCIDA'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface VisitItem {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorDni?: string;
  documentType?: string;
  documentNumber?: string;
  documentPhotoUrl?: string;
  hasVehicle?: boolean;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  category?: 'EN_CURSO' | 'HISTORIAL' | 'FRECUENTE';
  status: VisitStatusType;
  validFrom?: string;
  validUntil?: string;
  entryDate?: string;
  exitDate?: string;
  publicToken?: string;
  notes?: string;
  createdAt: string;
  resident?: {
    fullName: string;
    phone?: string;
    community?: { name: string };
    property?: { unitNumber: string; block?: string };
  };
  guard?: {
    fullName: string;
  };
}

export interface ParcelItem {
  id: string;
  carrier: 'CARGO_EXPRESS' | 'DHL' | 'FEDEX' | 'TRANS_EXPRESS' | 'UPS' | 'OTRO';
  customCarrier?: string;
  trackingNumber?: string;
  status: 'PENDING' | 'PICKED_UP';
  receivedAt: string;
}

export interface PqrsMessageItem {
  id: string;
  pqrsId: string;
  senderId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
  };
}

export interface PqrsItem {
  id: string;
  category: 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  messages?: PqrsMessageItem[];
}

export interface PqrsDetailItem extends PqrsItem {
  messages: PqrsMessageItem[];
}

class ApiService {
  private token: string | null = null;
  private deviceId: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
  }

  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.deviceId) {
      headers['x-device-id'] = this.deviceId;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición al servidor');
    }

    return data;
  }

  // App Remote Logger
  async sendLog(level: 'info' | 'warn' | 'error', action: string, message: string, details?: any) {
    try {
      await this.request('/logs/app', {
        method: 'POST',
        body: JSON.stringify({ level, action, message, details }),
      });
    } catch (e) {}
  }

  // Auth API
  async checkEmail(email: string) {
    return this.request<{
      success: boolean;
      code: string;
      message?: string;
      email?: string;
      fullName?: string;
      mustChangePassword?: boolean;
    }>('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async login(email: string, password: string, deviceId?: string) {
    const data = await this.request<{ success: boolean; token: string; user: UserProfile; mustChangePassword?: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceId: deviceId || this.deviceId }),
    });
    this.token = data.token;
    return data;
  }

  async changePassword(newPassword: string, deviceId?: string) {
    const data = await this.request<{ success: boolean; message: string; user: UserProfile; token?: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, deviceId: deviceId || this.deviceId }),
    });
    if (data.token) {
      this.token = data.token;
    }
    return data;
  }

  async renewSession(deviceId?: string) {
    const data = await this.request<{ success: boolean; token: string; user: UserProfile; mustChangePassword?: boolean }>('/auth/renew-session', {
      method: 'POST',
      body: JSON.stringify({ deviceId: deviceId || this.deviceId }),
    });
    this.token = data.token;
    return data;
  }

  async registerPushToken(pushToken: string, metadata?: { platform?: string; deviceId?: string; appVersion?: string }) {
    return this.request<{ success: boolean; message: string }>('/auth/push-token', {
      method: 'POST',
      body: JSON.stringify({ pushToken, ...metadata }),
    });
  }

  async getProfile() {
    return this.request<{ success: boolean; user: UserProfile }>('/auth/profile');
  }

  async updateFrequentConfig(hideFrequentAccessBanner: boolean) {
    return this.request<{ success: boolean }>('/auth/frequent-config', {
      method: 'PUT',
      body: JSON.stringify({ hideFrequentAccessBanner }),
    });
  }

  // Visits API
  async getVisits(category?: string, status?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; visits: VisitItem[] }>(`/visits${queryString}`);
  }

  async createVisit(visitData: {
    visitorName: string;
    visitorPhone?: string;
    visitDate?: string;
    validFrom?: string;
    notes?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      visit: VisitItem;
      publicToken: string;
      publicUrl: string;
      whatsappMessage: string;
    }>('/visits', {
      method: 'POST',
      body: JSON.stringify(visitData),
    });
  }

  async cancelVisit(visitId: string) {
    return this.request<{ success: boolean; message: string }>(`/visits/${visitId}/cancel`, {
      method: 'PATCH',
    });
  }

  // Guard API Endpoints
  async scanQRToken(token: string) {
    return this.request<{
      success: boolean;
      valid: boolean;
      message: string;
      visit: {
        id: string;
        visitorName: string;
        visitorPhone?: string;
        documentType: string;
        documentNumber: string;
        documentPhotoUrl?: string;
        hasVehicle: boolean;
        vehiclePlate: string;
        vehicleModel: string;
        vehicleColor: string;
        residentName: string;
        communityName: string;
        propertyUnit: string;
        validFrom?: string;
      };
    }>('/visits/scan-qr', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async confirmEntry(visitId: string, gateName?: string) {
    return this.request<{
      success: boolean;
      message: string;
      visit: VisitItem;
      notification: {
        title: string;
        body: string;
        visitorName: string;
        entryTime: string;
      };
    }>(`/visits/${visitId}/confirm-entry`, {
      method: 'POST',
      body: JSON.stringify({ gateName }),
    });
  }

  async getVisitorDocument(visitId: string) {
    return this.request<{
      success: boolean;
      visitorName: string;
      documentType?: string;
      documentNumber?: string;
      documentPhotoUrl?: string;
    }>(`/visits/${visitId}/visitor-document`);
  }

  // Parcels API
  async getParcels() {
    return this.request<{ success: boolean; parcels: ParcelItem[] }>('/parcels');
  }

  async createParcel(parcelData: { carrier: string; trackingNumber?: string }) {
    return this.request<{ success: boolean; parcel: ParcelItem }>('/parcels', {
      method: 'POST',
      body: JSON.stringify(parcelData),
    });
  }

  // PQRS API
  async getPqrsList(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ success: boolean; pqrsList: PqrsItem[] }>(`/pqrs${query}`);
  }

  async getPqrsDetail(id: string) {
    return this.request<{ success: boolean; pqrs: PqrsDetailItem }>(`/pqrs/${id}`);
  }

  async createPqrs(pqrsData: { category: string; subject: string; description: string }) {
    return this.request<{ success: boolean; pqrs: PqrsItem }>('/pqrs', {
      method: 'POST',
      body: JSON.stringify(pqrsData),
    });
  }

  async sendPqrsMessage(id: string, message: string) {
    return this.request<{ success: boolean; message: PqrsMessageItem }>(`/pqrs/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Payments API
  async getPayments() {
    return this.request<{ success: boolean; payments: any[] }>('/payments');
  }

  async processPayment(paymentId: string, paymentMethod: string, paymentToken?: string) {
    return this.request<{ success: boolean; payment: any }>('/payments/process', {
      method: 'POST',
      body: JSON.stringify({ paymentId, paymentMethod, paymentGatewayToken: paymentToken }),
    });
  }
}

export const apiService = new ApiService();
