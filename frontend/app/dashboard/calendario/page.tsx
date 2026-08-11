'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, CalendarEvent, CalendarEventInput, Project, Budget } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Briefcase, FileText } from 'lucide-react';

type ItemKind = 'event' | 'project-start' | 'project-end' | 'budget';

interface CalendarItem {
  kind: ItemKind;
  date: Date;
  title: string;
  id: string;
  sourceId?: string;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function CalendarioPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.listCalendarEvents(token), api.listProjects(token), api.listBudgets(token)])
      .then(([e, p, b]) => {
        setEvents(e);
        setProjects(p);
        setBudgets(b);
        setLoading(false);
      });
  }, [token]);

  async function loadEvents() {
    if (!token) return;
    setEvents(await api.listCalendarEvents(token));
  }

  const allItems: CalendarItem[] = useMemo(() => {
    const items: CalendarItem[] = [];

    events.forEach((e) => items.push({ kind: 'event', date: new Date(e.date), title: e.title, id: e.id }));

    projects.forEach((p) => {
      if (p.startDate) items.push({ kind: 'project-start', date: new Date(p.startDate), title: `Início: ${p.name}`, id: `ps-${p.id}`, sourceId: p.id });
      if (p.endDate) items.push({ kind: 'project-end', date: new Date(p.endDate), title: `Fim: ${p.name}`, id: `pe-${p.id}`, sourceId: p.id });
    });

    budgets.forEach((b) => {
      items.push({ kind: 'budget', date: new Date(b.createdAt), title: `Orçamento ${b.number} - ${b.client.name}`, id: `b-${b.id}`, sourceId: b.id });
    });

    return items;
  }, [events, projects, budgets]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(new Date(year, month, d));

  function itemsForDay(day: Date) {
    return allItems.filter((item) => sameDay(item.date, day));
  }

  function changeMonth(delta: number) {
    setCurrentMonth(new Date(year, month + delta, 1));
  }

  function openNewEvent(day: Date) {
    setSelectedDay(day);
    setTitle('');
    setDescription('');
    setOpen(true);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedDay) return;
    setSaving(true);
    try {
      const data: CalendarEventInput = {
        title,
        date: selectedDay.toISOString().slice(0, 10),
        description: description || undefined,
      };
      await api.createCalendarEvent(token, data);
      setOpen(false);
      await loadEvents();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!token || !confirm('Excluir este evento?')) return;
    await api.deleteCalendarEvent(token, id);
    await loadEvents();
  }

  const kindStyles: Record<ItemKind, string> = {
    event: 'bg-purple-100 text-purple-700',
    'project-start': 'bg-blue-100 text-blue-700',
    'project-end': 'bg-green-100 text-green-700',
    budget: 'bg-amber-100 text-amber-700',
  };

  const kindIcons: Record<ItemKind, React.ReactNode> = {
    event: <CalendarIcon size={10} />,
    'project-start': <Briefcase size={10} />,
    'project-end': <Briefcase size={10} />,
    budget: <FileText size={10} />,
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendário</h1>
        <p className="text-gray-500">Reuniões, obras e orçamentos em um só lugar.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></Button>
          <span className="font-semibold w-40 text-center">{monthNames[month]} {year}</span>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}><ChevronRight size={16} /></Button>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" />Reunião</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" />Início Obra</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400" />Fim Obra</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Orçamento</span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="border rounded-md bg-white overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {weekDays.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r p-1.5 ${day ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'}`}
                onClick={() => day && openNewEvent(day)}
              >
                {day && (
                  <>
                    <span className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${sameDay(day, today) ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>
                      {day.getDate()}
                    </span>
                    <div className="space-y-0.5 mt-1">
                      {itemsForDay(day).slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={`text-[10px] px-1 py-0.5 rounded flex items-center gap-1 truncate ${kindStyles[item.kind]}`}
                          title={item.title}
                          onClick={(e) => {
                            if (item.kind === 'event') {
                              e.stopPropagation();
                              handleDeleteEvent(item.id);
                            }
                          }}
                        >
                          {kindIcons[item.kind]}
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                      {itemsForDay(day).length > 3 && (
                        <p className="text-[10px] text-gray-400">+{itemsForDay(day).length - 3} mais</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Evento — {selectedDay?.toLocaleDateString('pt-BR')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião com cliente" required />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <p className="text-xs text-gray-400">Clique num evento de reunião no calendário pra excluí-lo.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar Evento'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}