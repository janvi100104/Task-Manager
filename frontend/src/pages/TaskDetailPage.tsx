import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Tag, MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTask } from '@/hooks/useTasks';
import type { Priority, Status } from '@/types';
import { cn } from '@/lib/utils';

const priorityColors: Record<Priority, string> = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  backlog: 'text-indigo-600 bg-indigo-50 border-indigo-200',
};

const statusColors: Record<Status, string> = {
  pending: 'text-gray-600 bg-gray-50 border-gray-200',
  'in-progress': 'text-amber-600 bg-amber-50 border-amber-200',
  completed: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: task, isLoading, error } = useTask(id!);

  if (isLoading) {
    return (
      <AppShell onAddTask={() => {}}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (error || !task) {
    return (
      <AppShell onAddTask={() => {}}>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">Task not found or failed to load</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  const assignee = typeof task.assignee === 'object' ? task.assignee : null;
  const createdBy = typeof task.createdBy === 'object' ? task.createdBy : null;

  return (
    <AppShell onAddTask={() => {}}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Task Title and Description */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl leading-tight">
                    {task.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-3 py-1 text-sm font-medium rounded-full border',
                      priorityColors[task.priority]
                    )}>
                      {task.priority}
                    </span>
                    <span className={cn(
                      'px-3 py-1 text-sm font-medium rounded-full border',
                      statusColors[task.status]
                    )}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              {task.description && (
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm bg-muted rounded-full text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Due Date */}
                {task.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className={cn(
                        'text-sm',
                        task.isOverdue && task.status !== 'completed' 
                          ? 'text-destructive' 
                          : 'text-muted-foreground'
                      )}>
                        {format(parseISO(task.dueDate), 'MMM dd, yyyy')}
                        {task.isOverdue && task.status !== 'completed' && (
                          <span className="ml-2 font-medium">(Overdue)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Assignee */}
                {assignee && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Assignee</p>
                      <p className="text-sm text-muted-foreground">{assignee.name}</p>
                    </div>
                  </div>
                )}

                {/* Created By */}
                {createdBy && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created By</p>
                      <p className="text-sm text-muted-foreground">{createdBy.name}</p>
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(task.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Updated Date */}
                {task.updatedAt && task.updatedAt !== task.createdAt && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(task.updatedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Edit Task
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Duplicate Task
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  Delete Task
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default TaskDetailPage;