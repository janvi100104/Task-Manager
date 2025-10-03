import React from 'react';
import { useNavigate } from 'react-router-dom';

import PriorityColumn from '@/components/PriorityColumn';
import { useBoardData, useDeleteTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import type { ITask, Priority, Status } from '@/types';

interface PriorityBoardProps {
  onAddTask: (priority: Priority) => void;
  onEditTask: (task: ITask) => void;
}

const priorities: Priority[] = ['high', 'medium', 'low', 'backlog'];

const PriorityBoard: React.FC<PriorityBoardProps> = ({ onAddTask, onEditTask }) => {
  const navigate = useNavigate();
  
  const { data: boardData, isLoading, refetch } = useBoardData();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleStatusChange = async (taskId: string, status: Status) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id: taskId, status });
    } catch (error) {
      console.error('Failed to update task status:', error);
      // You might want to show a toast notification here
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await deleteTaskMutation.mutateAsync(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
        // You might want to show a toast notification here
      }
    }
  };

  const handleLoadMore = (priority: Priority) => {
    // TODO: Implement load more functionality
    // This would typically involve updating the query to fetch more tasks
    console.log('Load more tasks for priority:', priority);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {priorities.map((priority) => (
          <div key={priority} className="animate-pulse">
            <div className="bg-muted rounded-2xl h-[600px]" />
          </div>
        ))}
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load board data</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
      {priorities.map((priority) => {
        const columnData = boardData[priority];
        
        return (
          <PriorityColumn
            key={priority}
            priority={priority}
            tasks={columnData.tasks}
            totalCount={columnData.totalCount}
            hasMore={columnData.hasMore}
            isLoading={false}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onTaskClick={handleTaskClick}
            onLoadMore={() => handleLoadMore(priority)}
          />
        );
      })}
    </div>
  );
};

export default PriorityBoard;