// API service client for Zentary Mobile connecting to Express + Prisma Backend

// Change this to your Railway production URL once deployed:
// e.g. 'https://zentary-backend-production.up.railway.app/api'
export const API_BASE_URL = 'http://localhost:3000/api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
}

export interface VisitItem {
  id: string;
  visitorName: string;
  visitorDni?: string;
  vehiclePlate?: string;
  category: 'EN_CURSO' | 'HISTORIAL' | 'FRECUENTE';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  qrCode?: string;
  createdAt: string;
}

export interface ParcelItem {
  id: string;
  carrier: 'CARGO_EXPRESS' | 'DHL' | 'FEDEX' | 'TRANS_EXPRESS' | 'UPS' | 'OTRO';
  customCarrier?: string;
  trackingNumber?: string;
  status: 'PENDING' | 'PICKED_UP';
  receivedAt: string;
}

export interface PqrsItem {
  id: string;
  category: 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

class ApiService {
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
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

  // Auth API
  async login(email: string, password: string) {
    const data = await this.request<{ success: boolean; token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = data.token;
    return data;
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
  async getVisits(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<{ success: boolean; visits: VisitItem[] }>(`/visits${query}`);
  }

  async createVisit(visitData: { visitorName: string; visitorDni?: string; vehiclePlate?: string; category: string }) {
    return this.request<{ success: boolean; visit: VisitItem }>('/visits', {
      method: 'POST',
      body: JSON.stringify(visitData),
    });
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

  async createPqrs(pqrsData: { category: string; subject: string; description: string }) {
    return this.request<{ success: boolean; pqrs: PqrsItem }>('/pqrs', {
      method: 'POST',
      body: JSON.stringify(pqrsData),
    });
  }

  // Payments API (Future integration ready)
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
