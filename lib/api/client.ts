import axios, { AxiosInstance, AxiosError } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001';

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests for auth
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    // Token would be in httpOnly cookie or you can attach it here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[API] Access denied:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    return new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || error.message || 'An error occurred',
      error.response?.data
    );
  }
  throw error;
}
