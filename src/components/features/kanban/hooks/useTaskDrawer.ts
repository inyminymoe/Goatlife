import { Task } from '@/app/_actions/tasks';
import { useState } from 'react';

export function useTaskDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const open = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
    }
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSelectedTask(null);
  };

  return {
    isOpen,
    selectedTask,
    open,
    close,
  };
}
