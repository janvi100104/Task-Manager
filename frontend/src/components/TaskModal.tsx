import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, User, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { handleApiError } from '@/lib/api';
import type { ITask, Priority, Status, CreateTaskDTO } from '@/types';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low', 'backlog']),
  status: z.enum(['pending', 'in-progress', 'completed']),
  tags: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  task?: ITask | null;
  defaultPriority?: Priority;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High Priority', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'medium', label: 'Medium Priority', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'low', label: 'Low Priority', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'backlog', label: 'Backlog', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
];

const statusOptions: { value: Status; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'in-progress', label: 'In Progress', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'completed', label: 'Completed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  defaultPriority = 'backlog',
}) => {
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      priority: defaultPriority,
      status: 'pending',
      tags: [],
    },
  });

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode
        reset({
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          priority: task.priority,
          status: task.status,
          tags: task.tags || [],
        });
        setTags(task.tags || []);
      } else {
        // Create mode
        reset({
          title: '',
          description: '',
          dueDate: '',
          priority: defaultPriority,
          status: 'pending',
          tags: [],
        });
        setTags([]);
      }
      setError(null);
      setTagInput('');
    }
  }, [isOpen, task, defaultPriority, reset]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      setError(null);

      const taskData: CreateTaskDTO = {
        title: data.title,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        priority: data.priority,
        status: data.status,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (isEditing && task) {
        await updateTaskMutation.mutateAsync({
          id: task._id,
          data: taskData,
        });
        toast.success('Task updated successfully!');
      } else {
        await createTaskMutation.mutateAsync(taskData);
        toast.success('Task created successfully!');
      }

      onSave();
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                placeholder="Enter task title"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Enter task description"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  {priorityOptions.map((option) => (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        type="radio"
                        value={option.value}
                        {...register('priority')}
                        className="sr-only"
                      />
                      <div className={cn(
                        'p-3 text-center text-sm font-medium rounded-md border transition-all',
                        selectedPriority === option.value
                          ? option.color
                          : 'text-muted-foreground bg-muted/50 border-muted hover:bg-muted'
                      )}>
                        {option.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        type="radio"
                        value={option.value}
                        {...register('status')}
                        className="sr-only"
                      />
                      <div className={cn(
                        'p-2 text-center text-sm font-medium rounded-md border transition-all',
                        selectedStatus === option.value
                          ? option.color
                          : 'text-muted-foreground bg-muted/50 border-muted hover:bg-muted'
                      )}>
                        {option.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-full"
                    >
                      {tag}
                      <Button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Task' : 'Create Task'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskModal;