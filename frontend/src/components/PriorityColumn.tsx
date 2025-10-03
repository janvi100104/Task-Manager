import React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskCard from '@/components/TaskCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { ITask, Priority, Status } from '@/types';
import { cn } from '@/lib/utils';

interface PriorityColumnProps {
  priority: Priority;
  tasks: ITask[];
  totalCount: number;
  hasMore: boolean;
  isLoading?: boolean;
  onAddTask: (priority: Priority) => void;
  onEditTask: (task: ITask) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTaskClick: (taskId: string) => void;
  onLoadMore: () => void;
}

const priorityConfig: Record<Priority, { 
  title: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
}> = {
  high: {
    title: 'High Priority',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  medium: {
    title: 'Medium Priority',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  low: {
    title: 'Low Priority',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  backlog: {
    title: 'Backlog',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
};

const PriorityColumn: React.FC<PriorityColumnProps> = ({
  priority,
  tasks,
  totalCount,
  hasMore,
  isLoading = false,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onTaskClick,
  onLoadMore,
}) => {
  const config = priorityConfig[priority];

  return (
    <Card className="flex flex-col h-full min-h-[600px]">
      <CardHeader className={cn(
        'pb-3 border-b',
        config.bgColor,
        config.borderColor
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn('text-lg font-semibold', config.color)}>
            {config.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              config.bgColor,
              config.color,
              'border',
              config.borderColor
            )}>
              {totalCount}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onAddTask(priority)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Empty state */}
        {tasks.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center mb-3',
              config.bgColor,
              config.borderColor,
              'border-2 border-dashed'
            )}>
              <Plus className={cn('w-6 h-6', config.color)} />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              No {priority} priority tasks
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTask(priority)}
              className={config.color}
            >
              Add your first task
            </Button>
          </div>
        )}

        {/* Task list */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              onCardClick={onTaskClick}
            />
          ))}
        </div>

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {/* Load more button */}
        {hasMore && !isLoading && tasks.length > 0 && (
          <div className="pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onLoadMore}
            >
              Load more ({totalCount - tasks.length} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriorityColumn;