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
  LOW: 'border-l-success bg-success/10',
  MEDIUM: 'border-l-info bg-info/10',
  HIGH: 'border-l-warning bg-warning/10',
  URGENT: 'border-l-destructive bg-destructive/10',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
};

const priorityBadge: Record<TaskPriority, string> = {
  LOW: 'bg-success/15 text-success',
  MEDIUM: 'bg-info/15 text-info',
  HIGH: 'bg-warning/15 text-warning',
  URGENT: 'bg-destructive/15 text-destructive',
};

function formatDate(value: string) {
  const d = new Date(value);
  const datePart = d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const hasTime = d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0;
  if (!hasTime) return datePart;
  const timePart = d.toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
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
          <p className="text-muted-foreground">Arraste os cards entre as colunas para atualizar o status.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Nova Tarefa
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-muted rounded-md p-3 space-y-3 min-h-[300px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-semibold text-sm text-muted-foreground">{col.label}</h3>
                  <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
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
                    {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityBadge[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      {task.dueDate && <span className="text-[10px] text-muted-foreground">{formatDate(task.dueDate)}</span>}
                    </div>
                    {task.project && <p className="text-[10px] text-muted-foreground">{task.project.number} - {task.project.name}</p>}
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma tarefa aqui.</p>
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