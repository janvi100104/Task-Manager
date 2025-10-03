import React, { useState } from 'react';

import AppShell from '@/components/AppShell';
import PriorityBoard from '@/components/PriorityBoard';
import TaskModal from '@/components/TaskModal';
import type { ITask, Priority } from '@/types';

const DashboardPage: React.FC = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [defaultPriority, setDefaultPriority] = useState<Priority>('backlog');

  const handleAddTask = (priority?: Priority) => {
    setDefaultPriority(priority || 'backlog');
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: ITask) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskSaved = () => {
    handleCloseModal();
    // The task list will automatically update due to React Query cache invalidation
  };

  return (
    <AppShell onAddTask={() => handleAddTask()}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Board</h1>
            <p className="text-muted-foreground">
              Organize your tasks by priority and track your progress
            </p>
          </div>
        </div>

        {/* Priority Board */}
        <div className="h-[calc(100vh-200px)]">
          <PriorityBoard
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
          />
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSave={handleTaskSaved}
        task={selectedTask}
        defaultPriority={defaultPriority}
      />
    </AppShell>
  );
};

export default DashboardPage;