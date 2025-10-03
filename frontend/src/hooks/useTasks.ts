import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '@/lib/api';
import type {
  ITask,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilters,
  BoardData,
  TaskStats,
  Priority,
  Status
} from '@/types';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  board: () => [...taskKeys.all, 'board'] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
};

// Fetch tasks with filters
export const useTasks = (filters: TaskFilters = {}) => {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => apiClient.getTasks(filters),
    staleTime: 30000, // 30 seconds
  });
};

// Fetch board data
export const useBoardData = (limit = 15) => {
  return useQuery({
    queryKey: taskKeys.board(),
    queryFn: () => apiClient.getBoardData(limit),
    staleTime: 30000,
  });
};

// Fetch single task
export const useTask = (id: string) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => apiClient.getTask(id),
    enabled: !!id,
  });
};

// Fetch task statistics
export const useTaskStats = () => {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => apiClient.getTaskStats(),
    staleTime: 60000, // 1 minute
  });
};

// Create task mutation
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDTO) => apiClient.createTask(data),
    onSuccess: (newTask) => {
      // Invalidate and refetch board data
      queryClient.invalidateQueries({ queryKey: taskKeys.board() });
      
      // Invalidate tasks lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      
      // Optimistically update board data
      queryClient.setQueryData<BoardData>(taskKeys.board(), (oldData) => {
        if (!oldData) return oldData;
        
        const priority = newTask.priority;
        return {
          ...oldData,
          [priority]: {
            ...oldData[priority],
            tasks: [newTask, ...oldData[priority].tasks],
            totalCount: oldData[priority].totalCount + 1,
          },
        };
      });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Update task mutation
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskDTO> }) =>
      apiClient.updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Update task detail cache
      queryClient.setQueryData(taskKeys.detail(updatedTask._id), updatedTask);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.board() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Update task status mutation
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      apiClient.updateTaskStatus(id, status),
    onSuccess: (updatedTask) => {
      // Update task in all relevant caches
      queryClient.setQueryData(taskKeys.detail(updatedTask._id), updatedTask);
      
      // Optimistically update board data
      queryClient.setQueryData<BoardData>(taskKeys.board(), (oldData) => {
        if (!oldData) return oldData;
        
        const priority = updatedTask.priority;
        return {
          ...oldData,
          [priority]: {
            ...oldData[priority],
            tasks: oldData[priority].tasks.map(task =>
              task._id === updatedTask._id ? updatedTask : task
            ),
          },
        };
      });
      
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
    onError: (error) => {
      throw new Error(handleApiError(error));
    },
  });
};

// Update task priority mutation (for drag & drop)
export const useUpdateTaskPriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority, position }: { id: string; priority: Priority; position?: number }) =>
      apiClient.updateTaskPriority(id, priority, position),
    onMutate: async ({ id, priority: newPriority }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.board() });
      
      // Snapshot previous value
      const previousBoardData = queryClient.getQueryData<BoardData>(taskKeys.board());
      
      // Optimistically update board data
      if (previousBoardData) {
        let movedTask: ITask | undefined;
        let sourcePriority: Priority | undefined;
        
        // Find and remove task from current priority
        Object.entries(previousBoardData).forEach(([priority, column]) => {
          const taskIndex = column.tasks.findIndex(task => task._id === id);
          if (taskIndex !== -1) {
            movedTask = column.tasks[taskIndex];
            sourcePriority = priority as Priority;
          }
        });
        
        if (movedTask && sourcePriority) {
          const newBoardData = { ...previousBoardData };
          
          // Remove from source
          newBoardData[sourcePriority] = {
            ...newBoardData[sourcePriority],
            tasks: newBoardData[sourcePriority].tasks.filter(task => task._id !== id),
            totalCount: newBoardData[sourcePriority].totalCount - 1,
          };
          
          // Add to destination
          const updatedTask = { ...movedTask, priority: newPriority };
          newBoardData[newPriority] = {
            ...newBoardData[newPriority],
            tasks: [updatedTask, ...newBoardData[newPriority].tasks],
            totalCount: newBoardData[newPriority].totalCount + 1,
          };
          
          queryClient.setQueryData(taskKeys.board(), newBoardData);
        }
      }
      
      return { previousBoardData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBoardData) {
        queryClient.setQueryData(taskKeys.board(), context.previousBoardData);
      }
      throw new Error(handleApiError(error));
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.board() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
};

// Delete task mutation
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteTask(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.board() });
      
      // Snapshot previous value
      const previousBoardData = queryClient.getQueryData<BoardData>(taskKeys.board());
      
      // Optimistically remove task from board
      if (previousBoardData) {
        const newBoardData = { ...previousBoardData };
        
        Object.entries(newBoardData).forEach(([priority, column]) => {
          const taskIndex = column.tasks.findIndex(task => task._id === id);
          if (taskIndex !== -1) {
            newBoardData[priority as Priority] = {
              ...column,
              tasks: column.tasks.filter(task => task._id !== id),
              totalCount: column.totalCount - 1,
            };
          }
        });
        
        queryClient.setQueryData(taskKeys.board(), newBoardData);
      }
      
      return { previousBoardData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBoardData) {
        queryClient.setQueryData(taskKeys.board(), context.previousBoardData);
      }
      throw new Error(handleApiError(error));
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.board() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
};