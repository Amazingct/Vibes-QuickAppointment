// API Service for backend communication

const API_BASE_URL = 'http://localhost:5002/api';

export interface LoginRequest {
  login: string;  // Can be email or username
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  data: {
    access_token: string;
    user: {
      id: number;
      email: string;
      username: string;
      first_name: string;
      last_name: string;
      is_active: boolean;
      created_at: string;
    };
  };
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string>; // For validation errors
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Set headers (optionally exclude JSON content-type for GET requests to avoid preflight)
  private getHeaders(includeAuth: boolean = false, includeJson: boolean = true): HeadersInit {
    const headers: HeadersInit = {};
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Handle API responses
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      // Create enhanced error with validation details
      const error = new Error(errorData.message || 'An error occurred') as Error & {
        details?: Record<string, string>;
        errorType?: string;
      };
      error.details = errorData.details;
      error.errorType = errorData.error;
      throw error;
    }
    return response.json();
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    
    // Store token in localStorage
    if (data.data?.access_token) {
      localStorage.setItem('access_token', data.data.access_token);
    }

    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    return data;
  }

  async getCurrentUser(): Promise<AuthResponse['data']['user']> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(true, false),
    });

    const data = await this.handleResponse<{ data: AuthResponse['data']['user'] }>(response);
    return data.data;
  }

  // Logout (clear local storage)
  logout(): void {
    localStorage.removeItem('access_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // ---------- Services ----------
  async listServices(params: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    username?: string;
    is_active?: boolean;
    sort?: string; // e.g., 'created_at:desc,price:asc'
  } = {}): Promise<{ data: { services: any[]; pagination: any }, message: string }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.username) query.set('username', params.username);
    if (typeof params.is_active === 'boolean') query.set('is_active', String(params.is_active));
    if (params.sort) query.set('sort', params.sort);

    const response = await fetch(`${this.baseUrl}/services?${query.toString()}`,
      { method: 'GET', headers: this.getHeaders(true, false) });
    return this.handleResponse(response);
  }

  async createService(payload: {
    name: string;
    duration_minutes: number;
    price: number;
    description?: string;
    is_active?: boolean;
    images?: string[];
    category?: string;
  }): Promise<{ data: any; message: string }> {
    const response = await fetch(`${this.baseUrl}/services`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  async uploadServiceImages(files: File[] | File): Promise<{ data: { url?: string; urls?: string[] }, message: string }>{
    const formData = new FormData();
    const multiple = Array.isArray(files);
    if (multiple) {
      (files as File[]).forEach(f => formData.append('files', f));
    } else {
      formData.append('file', files as File);
    }

    const response = await fetch(`${this.baseUrl}/services/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.getAuthToken()}` || '' },
      body: formData
    });
    return this.handleResponse(response);
  }

  // ---------- Bookings ----------
  async getBookedSlots(params: {
    service_id?: number;
    provider_id?: number;
    start?: string; // ISO datetime
    end?: string;   // ISO datetime
  } = {}): Promise<{ data: { slots: Array<{ booking_id: number; service_id: number; provider_id: number; time_booked: string; status: string }>; count: number }, message: string }>{
    const query = new URLSearchParams();
    if (params.service_id) query.set('service_id', String(params.service_id));
    if (params.provider_id) query.set('provider_id', String(params.provider_id));
    if (params.start) query.set('start', params.start);
    if (params.end) query.set('end', params.end);

    const response = await fetch(`${this.baseUrl}/bookings/slots?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(true, false)
    });
    return this.handleResponse(response);
  }

  async createBooking(payload: { service_id: number; time_booked: string; status?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'cancelled' }): Promise<{ data: any; message: string }>{
    const response = await fetch(`${this.baseUrl}/bookings`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  async listBookings(params: { role?: 'provider' | 'client'; status?: string; page?: number; per_page?: number } = {}): Promise<{ data: { bookings: any[]; pagination: any }, message: string }>{
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));

    const response = await fetch(`${this.baseUrl}/bookings?${query.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(true, false)
    });
    return this.handleResponse(response);
  }

  async updateBooking(bookingId: number, payload: { status?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'cancelled'; time_booked?: string }): Promise<{ data: any; message: string }>{
    const response = await fetch(`${this.baseUrl}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  // ---------- Auth extras ----------
  async verifyOtp(payload: { email: string; otp: string }): Promise<{ data?: any; message: string }>{
    const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  async resendOtp(payload: { email: string }): Promise<{ message: string }>{
    const response = await fetch(`${this.baseUrl}/auth/resend-otp`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  async forgotPassword(payload: { email: string }): Promise<{ message: string }>{
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  async resetPassword(payload: { email: string; otp: string; new_password: string }): Promise<{ message: string }>{
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  // ---------- Profile ----------
  async updateProfile(payload: Partial<{ first_name: string; last_name: string; avatar_url: string; username: string }>): Promise<{ data: any; message: string }>{
    const response = await fetch(`${this.baseUrl}/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
