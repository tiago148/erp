'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, WorkLog, WorkLogInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkLogForm } from '@/components/work-log-form';
import { Plus, Pencil, Trash2, Cloud, Users, AlertTriangle } from 'lucide-react';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function DiarioPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkLog | undefined>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setLogs(await api.listWorkLogs(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: WorkLogInput) {
    if (!token) return;
    if (editing) await api.updateWorkLog(token, editing.id, data);
    else await api.createWorkLog(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(log: WorkLog) {
    if (!token || !confirm('Excluir este registro do diário?')) return;
    await api.deleteWorkLog(token, log.id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diário de Obra</h1>
          <p className="text-gray-500">Registro diário das atividades em campo.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />Novo Registro
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">Nenhum registro no diário ainda.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border rounded-md bg-white p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{log.project.number} - {log.project.name}</p>
                  <p className="text-sm text-gray-500">{formatDate(log.date)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(log); setOpen(true); }}><Pencil size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(log)}><Trash2 size={16} /></Button>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-gray-500">
                {log.weather && (
                  <span className="flex items-center gap-1"><Cloud size={14} />{log.weather}</span>
                )}
                {log.workersPresent !== undefined && log.workersPresent !== null && (
                  <span className="flex items-center gap-1"><Users size={14} />{log.workersPresent} trabalhador(es)</span>
                )}
              </div>

              <p className="text-sm">{log.description}</p>

              {log.occurrences && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-2 text-sm text-amber-800">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{log.occurrences}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Registro' : 'Novo Registro do Diário'}</DialogTitle></DialogHeader>
          <WorkLogForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}