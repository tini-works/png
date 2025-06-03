// API service for making HTTP requests

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Base API URL
const API_URL = '/api';

// Generic fetch function with authentication
const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (token expired or invalid)
  if (response.status === 401) {
    // Clear token and user from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Something went wrong');
  }

  return data;
};

// API methods
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (userData: any) =>
      fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
  },

  // Users
  users: {
    getAll: (params?: Record<string, string>) => {
      const queryString = params
        ? `?${new URLSearchParams(params).toString()}`
        : '';
      return fetchWithAuth(`/users${queryString}`);
    },
    getById: (id: string) => fetchWithAuth(`/users/${id}`),
    create: (userData: any) =>
      fetchWithAuth('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    update: (id: string, userData: any) =>
      fetchWithAuth(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),
    delete: (id: string) =>
      fetchWithAuth(`/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // Companies
  companies: {
    getAll: () => fetchWithAuth('/companies'),
    getById: (id: string) => fetchWithAuth(`/companies/${id}`),
    create: (companyData: any) =>
      fetchWithAuth('/companies', {
        method: 'POST',
        body: JSON.stringify(companyData),
      }),
    update: (id: string, companyData: any) =>
      fetchWithAuth(`/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(companyData),
      }),
    delete: (id: string) =>
      fetchWithAuth(`/companies/${id}`, {
        method: 'DELETE',
      }),
  },

  // Payment Requests
  paymentRequests: {
    getAll: (params?: Record<string, string>) => {
      const queryString = params
        ? `?${new URLSearchParams(params).toString()}`
        : '';
      return fetchWithAuth(`/payment-requests${queryString}`);
    },
    getById: (id: string) => fetchWithAuth(`/payment-requests/${id}`),
    create: (paymentRequestData: any) =>
      fetchWithAuth('/payment-requests', {
        method: 'POST',
        body: JSON.stringify(paymentRequestData),
      }),
    update: (id: string, paymentRequestData: any) =>
      fetchWithAuth(`/payment-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(paymentRequestData),
      }),
    delete: (id: string) =>
      fetchWithAuth(`/payment-requests/${id}`, {
        method: 'DELETE',
      }),
    updateStatus: (id: string, status: string, paymentDetails?: any) =>
      fetchWithAuth(`/payment-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, paymentDetails }),
      }),
  },

  // Notifications
  notifications: {
    getAll: (params?: Record<string, string>) => {
      const queryString = params
        ? `?${new URLSearchParams(params).toString()}`
        : '';
      return fetchWithAuth(`/notifications${queryString}`);
    },
    markAsRead: (id: string) =>
      fetchWithAuth(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllAsRead: () =>
      fetchWithAuth('/notifications/read-all', {
        method: 'PATCH',
      }),
    delete: (id: string) =>
      fetchWithAuth(`/notifications/${id}`, {
        method: 'DELETE',
      }),
  },
};

