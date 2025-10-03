export type Priority = 'high' | 'medium' | 'low' | 'backlog';
export type Status = 'pending' | 'in-progress' | 'completed';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO string
  priority: Priority;
  status: Status;
  assignee: IUser | string;
  createdBy: IUser | string;
  position: number;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  isOverdue?: boolean;
  daysUntilDue?: number | null;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  status?: Status;
  assignee?: string;
  tags?: string[];
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  _id: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: IUser;
    accessToken: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  totalTasks?: number;
  totalUsers?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TasksResponse {
  tasks: ITask[];
  pagination: PaginationInfo;
}

export interface BoardData {
  high: {
    tasks: ITask[];
    totalCount: number;
    hasMore: boolean;
  };
  medium: {
    tasks: ITask[];
    totalCount: number;
    hasMore: boolean;
  };
  low: {
    tasks: ITask[];
    totalCount: number;
    hasMore: boolean;
  };
  backlog: {
    tasks: ITask[];
    totalCount: number;
    hasMore: boolean;
  };
}

export interface TaskStats {
  priorityCounts: Array<{ _id: Priority; count: number }>;
  statusCounts: Array<{ _id: Status; count: number }>;
  overdueTasks: number;
  tasksDueToday: number;
}

export interface UsersResponse {
  users: IUser[];
  pagination: PaginationInfo;
}

// Form validation types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  assignee: string;
  tags: string[];
}

// UI State types
export interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TaskFilters {
  priority?: Priority;
  status?: Status;
  search?: string;
  assignee?: string;
  page?: number;
  limit?: number;
}

// Drag and drop types
export interface DragEvent {
  active: {
    id: string;
    data: {
      current: {
        task: ITask;
        priority: Priority;
      };
    };
  };
  over: {
    id: string;
    data: {
      current: {
        priority: Priority;
      };
    };
  } | null;
}

// Error types
export interface ApiError {
  success: false;
  error: string;
  details?: any[];
  stack?: string;
}