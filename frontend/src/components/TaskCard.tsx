import React from 'react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { Calendar, User, MoreHorizontal, CheckCircle, Circle, Clock } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ITask, Priority, Status } from '@/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: ITask;
  onEdit: (task: ITask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onCardClick: (taskId: string) => void;
  isDragging?: boolean;
}

const priorityColors: Record<Priority, { bg: string; border: string; dot: string }> = {
  high: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  backlog: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
};

const statusIcons: Record<Status, React.ReactNode> = {
  pending: <Circle className="w-4 h-4 text-muted-foreground" />,
  'in-progress': <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onCardClick,
  isDragging = false,
}) => {
  const priorityStyle = priorityColors[task.priority];
  
  const assignee = typeof task.assignee === 'object' ? task.assignee : null;
  const createdBy = typeof task.createdBy === 'object' ? task.createdBy : null;

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: Record<Status, Status> = {
      pending: 'in-progress',
      'in-progress': 'completed',
      completed: 'pending',
    };
    onStatusChange(task._id, nextStatus[task.status]);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task._id);
  };

  const formatDueDate = (dueDate: string) => {
    const date = parseISO(dueDate);
    const now = new Date();
    const distance = formatDistanceToNow(date, { addSuffix: true });
    
    if (date < now && task.status !== 'completed') {
      return { text: distance, isOverdue: true };
    }
    
    return { text: distance, isOverdue: false };
  };

  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-md',
        priorityStyle.bg,
        priorityStyle.border,
        'border-l-4',
        isDragging && 'opacity-50 rotate-2 shadow-lg'
      )}
      onClick={() => onCardClick(task._id)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with status and actions */}
        <div className="flex items-start justify-between">
          <button onClick={handleStatusClick} className="flex-shrink-0">
            {statusIcons[task.status]}
          </button>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEditClick}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Priority indicator */}
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', priorityStyle.dot)} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {task.priority}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer with due date and assignee */}
        <div className="flex items-center justify-between text-xs">
          {dueDateInfo && (
            <div className={cn(
              'flex items-center gap-1',
              dueDateInfo.isOverdue ? 'text-destructive' : 'text-muted-foreground'
            )}>
              <Calendar className="w-3 h-3" />
              <span>{dueDateInfo.text}</span>
            </div>
          )}

          {assignee && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="truncate max-w-20">{assignee.name}</span>
            </div>
          )}
        </div>

        {/* Overdue indicator */}
        {task.isOverdue && task.status !== 'completed' && (
          <div className="flex items-center gap-1 text-xs text-destructive font-medium">
            <div className="w-1 h-1 bg-destructive rounded-full animate-pulse" />
            Overdue
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;