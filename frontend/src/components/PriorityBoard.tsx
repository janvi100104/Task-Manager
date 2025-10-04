import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import PriorityColumn from '@/components/PriorityColumn';
import { useBoardData, useDeleteTask, useUpdateTaskStatus, useDuplicateTask } from '@/hooks/useTasks';
import type { ITask, Priority, Status } from '@/types';

interface PriorityBoardProps {
  onAddTask: (priority: Priority) => void;
  onEditTask: (task: ITask) => void;
  onDuplicateTask?: (task: ITask) => void;
}

const priorities: Priority[] = ['high', 'medium', 'low', 'backlog'];

const PriorityBoard: React.FC<PriorityBoardProps> = ({ onAddTask, onEditTask, onDuplicateTask }) => {
  const navigate = useNavigate();
  
  const { data: boardData, isLoading, refetch } = useBoardData();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();
  const duplicateTaskMutation = useDuplicateTask();

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleStatusChange = async (taskId: string, status: Status) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id: taskId, status });
      toast.success(`Task status updated to ${status.replace('-', ' ')}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Confirmation dialog is shown in TaskCard
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task. Please try again.');
    }
  };

  const handleDuplicateTask = async (task: ITask) => {
    try {
      const duplicatedTask = await duplicateTaskMutation.mutateAsync(task._id);
      toast.success('Task duplicated successfully');
      console.log('Task duplicated:', duplicatedTask);
    } catch (error) {
      console.error('Failed to duplicate task:', error);
      toast.error('Failed to duplicate task. Please try again.');
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
            onDuplicateTask={onDuplicateTask || handleDuplicateTask}
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