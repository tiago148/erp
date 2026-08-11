'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Task, TaskInput, TaskStatus, TaskPriority } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { Plus, Trash2, Pencil } from 'lucide-react';

const columns: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'A Fazer' },
  { status: 'IN_PROGRESS', label: 'Em Andamento' },
  { status: 'DONE', label: 'Concluído' },
];

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'border-l-green-500 bg-green-50',
  MEDIUM: 'border-l-blue-500 bg-blue-50',
  HIGH: 'border-l-orange-500 bg-orange-50',
  URGENT: 'border-l-red-500 bg-red-50',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
};

const priorityBadge: Record<TaskPriority, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function TarefasPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setTasks(await api.listTasks(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: TaskInput) {
    if (!token) return;
    if (editing) await api.updateTask(token, editing.id, data);
    else await api.createTask(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(task: Task) {
    if (!token || !confirm(`Excluir "${task.title}"?`)) return;
    await api.deleteTask(token, task.id);
    load();
  }

  async function moveTask(task: Task, newStatus: TaskStatus) {
    if (!token) return;
    await api.updateTask(token, task.id, { status: newStatus });
    load();
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== status) moveTask(task, status);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-gray-500">Arraste os cards entre as colunas para atualizar o status.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Nova Tarefa
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-gray-50 rounded-md p-3 space-y-3 min-h-[300px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-semibold text-sm text-gray-600">{col.label}</h3>
                  <span className="text-xs text-gray-400">{columnTasks.length}</span>
                </div>
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    className={`border-l-4 rounded-md p-3 space-y-2 cursor-move shadow-sm ${priorityColors[task.priority]}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditing(task); setOpen(true); }}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(task)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                    {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityBadge[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      {task.dueDate && <span className="text-[10px] text-gray-400">{formatDate(task.dueDate)}</span>}
                    </div>
                    {task.project && <p className="text-[10px] text-gray-400">{task.project.number} - {task.project.name}</p>}
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Nenhuma tarefa aqui.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
          <TaskForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}