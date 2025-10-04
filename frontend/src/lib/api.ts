import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type {
  IUser,
  ITask,
  CreateTaskDTO,
  UpdateTaskDTO,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
  TasksResponse,
  BoardData,
  TaskStats,
  UsersResponse,
  TaskFilters,
  Priority,
  Status
} from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5009/api',
      timeout: 10000,
      withCredentials: true, // Important for refresh token cookies
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            // Retry the original request with new token
            if (this.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearToken();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private loadTokenFromStorage() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.accessToken = token;
    }
  }

  setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    if (response.data.success && response.data.data.accessToken) {
      this.setToken(response.data.data.accessToken);
    }
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    if (response.data.success && response.data.data.accessToken) {
      this.setToken(response.data.data.accessToken);
    }
    return response.data;
  }

  async refreshToken(): Promise<void> {
    const response = await this.client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    if (response.data.success && response.data.data?.accessToken) {
      this.setToken(response.data.data.accessToken);
    } else {
      throw new Error('Token refresh failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await this.client.post('/auth/logout-all');
    } finally {
      this.clearToken();
    }
  }

  async getMe(): Promise<IUser> {
    const response = await this.client.get<ApiResponse<{ user: IUser }>>('/auth/me');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get user profile');
    }
    return response.data.data.user;
  }

  async updateProfile(data: Partial<Pick<IUser, 'name' | 'avatarUrl'>>): Promise<IUser> {
    const response = await this.client.put<ApiResponse<{ user: IUser }>>('/auth/me', data);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to update profile');
    }
    return response.data.data.user;
  }

  // Task endpoints
  async getTasks(filters: TaskFilters = {}): Promise<TasksResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await this.client.get<ApiResponse<TasksResponse>>(`/tasks?${params}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch tasks');
    }
    return response.data.data;
  }

  async getBoardData(limit = 15): Promise<BoardData> {
    const response = await this.client.get<ApiResponse<BoardData>>(`/tasks?board=true&limit=${limit}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch board data');
    }
    return response.data.data;
  }

  async getTask(id: string): Promise<ITask> {
    const response = await this.client.get<ApiResponse<{ task: ITask }>>(`/tasks/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch task');
    }
    return response.data.data.task;
  }

  async createTask(data: CreateTaskDTO): Promise<ITask> {
    const response = await this.client.post<ApiResponse<{ task: ITask }>>('/tasks', data);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to create task');
    }
    return response.data.data.task;
  }

  async updateTask(id: string, data: Partial<CreateTaskDTO>): Promise<ITask> {
    const response = await this.client.put<ApiResponse<{ task: ITask }>>(`/tasks/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to update task');
    }
    return response.data.data.task;
  }

  async updateTaskStatus(id: string, status: Status): Promise<ITask> {
    const response = await this.client.patch<ApiResponse<{ task: ITask }>>(`/tasks/${id}/status`, { status });
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to update task status');
    }
    return response.data.data.task;
  }

  async updateTaskPriority(id: string, priority: Priority, position?: number): Promise<ITask> {
    const data: { priority: Priority; position?: number } = { priority };
    if (position !== undefined) {
      data.position = position;
    }
    
    const response = await this.client.patch<ApiResponse<{ task: ITask }>>(`/tasks/${id}/priority`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to update task priority');
    }
    return response.data.data.task;
  }

  async duplicateTask(id: string): Promise<ITask> {
    const response = await this.client.post<ApiResponse<{ task: ITask }>>(`/tasks/${id}/duplicate`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to duplicate task');
    }
    return response.data.data.task;
  }

  async deleteTask(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/tasks/${id}`);
    if (!response.data.success) {
      throw new Error('Failed to delete task');
    }
  }

  async getTaskStats(): Promise<TaskStats> {
    const response = await this.client.get<ApiResponse<TaskStats>>('/tasks/stats');
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch task statistics');
    }
    return response.data.data;
  }

  // User endpoints
  async getUsers(filters: { search?: string; page?: number; limit?: number } = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await this.client.get<ApiResponse<UsersResponse>>(`/users?${params}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch users');
    }
    return response.data.data;
  }

  async getUser(id: string): Promise<IUser> {
    const response = await this.client.get<ApiResponse<{ user: IUser }>>(`/users/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch user');
    }
    return response.data.data.user;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export error handler utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};