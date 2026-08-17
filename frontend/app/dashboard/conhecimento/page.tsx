'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, Playbook, PlaybookInput, Checklist, ChecklistInput, LessonLearned, LessonLearnedInput, Settings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaybookForm, playbookCategoryLabels } from '@/components/playbook-form';
import { ChecklistForm, checklistContextLabels } from '@/components/checklist-form';
import { LessonLearnedForm, lessonCategoryLabels } from '@/components/lesson-learned-form';
import { PrintDocument, PrintHeader, PrintSectionTitle, PrintFooter, PrintSignatures } from '@/components/print-document';
import { usePrint } from '@/lib/use-print';
import { Plus, Pencil, Trash2, Printer, ChevronDown, ChevronUp } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function PlaybooksSection({ machine }: { machine: boolean }) {
  const { token } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Playbook | undefined>();
  const [expanded, setExpanded] = useState<string | undefined>();
  const [printing, setPrinting] = usePrint<Playbook>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setPlaybooks(await api.listPlaybooks(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (token) api.getSettings(token).then(setSettings); }, [token]);

  const filtered = playbooks.filter((p) => (p.category === 'maquina') === machine);

  async function handleSubmit(data: PlaybookInput) {
    if (!token) return;
    if (editing) await api.updatePlaybook(token, editing.id, data);
    else await api.createPlaybook(token, { ...data, category: machine && !editing ? 'maquina' : data.category });
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(p: Playbook) {
    if (!token || !confirm(`Excluir "${p.title}"?`)) return;
    await api.deletePlaybook(token, p.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        {machine
          ? 'Cada máquina com: parâmetros de operação, o que verificar antes de ligar, o que nunca fazer, e a manutenção preventiva.'
          : 'Procedimento que ninguém lê não serve. Uma página, passo numerado. Se não couber numa folha, é procedimento demais.'}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus size={16} className="mr-2" />{machine ? 'Nova Instrução' : 'Novo Procedimento'}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {machine ? 'Nenhuma instrução de máquina cadastrada.' : 'Nenhum procedimento — comece pelos três que mais se repetem na sua operação.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="border rounded-md bg-card">
                <button type="button" onClick={() => setExpanded(isOpen ? undefined : p.id)} className="w-full flex items-center gap-3 p-3 text-left">
                  {isOpen ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.title}</p>
                    <div className="flex gap-2 flex-wrap items-center mt-1 text-xs text-muted-foreground">
                      {p.code && <span className="font-mono">{p.code}</span>}
                      <Badge variant="outline">{playbookCategoryLabels[p.category] || p.category}</Badge>
                      <span>{p.steps.length} passos</span>
                      {p.standardTime && <span>⏱ {p.standardTime}</span>}
                      {p.version > 1 && <Badge variant="info">v{p.version}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => setPrinting(p)}><Printer size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}><Trash2 size={16} /></Button>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-3 border-t pt-3">
                    {p.objective && <p className="text-sm"><strong className="text-primary">Objetivo:</strong> {p.objective}</p>}
                    {(p.executor || p.requirements) && (
                      <p className="text-xs text-muted-foreground">
                        {p.executor && <><strong>Executa:</strong> {p.executor} &nbsp; </>}
                        {p.requirements && <><strong>Requer:</strong> {p.requirements}</>}
                      </p>
                    )}
                    <ol className="space-y-1.5">
                      {p.steps.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                    {p.acceptanceCriteria && (
                      <p className="text-sm"><strong className="text-success">Critério de aceitação:</strong> {p.acceptanceCriteria}</p>
                    )}
                    {p.commonErrors && (
                      <p className="text-sm"><strong className="text-destructive">Erros comuns:</strong> {p.commonErrors}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Procedimento' : machine ? 'Nova Instrução de Máquina' : 'Novo Procedimento'}</DialogTitle></DialogHeader>
          <PlaybookForm initialData={editing} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditing(undefined); }} />
        </DialogContent>
      </Dialog>

      {printing && (
        <PrintDocument>
          <PrintHeader
            settings={settings}
            docTitle="PROCEDIMENTO OPERACIONAL"
            docSubtitle={<>{printing.code} · versão {printing.version}</>}
          />
          <h2 className="text-lg font-bold mt-3 mb-1">{printing.title}</h2>
          <p className="text-xs text-gray-600 mb-3">{playbookCategoryLabels[printing.category] || printing.category}{printing.standardTime ? ` · tempo de referência: ${printing.standardTime}` : ''}</p>
          {printing.objective && <><PrintSectionTitle>Objetivo</PrintSectionTitle><p className="text-sm">{printing.objective}</p></>}
          {(printing.executor || printing.requirements) && (
            <>
              <PrintSectionTitle>Pré-requisitos</PrintSectionTitle>
              <p className="text-sm">{printing.executor && <>Executante: {printing.executor}<br /></>}{printing.requirements && <>Materiais e EPIs: {printing.requirements}</>}</p>
            </>
          )}
          <PrintSectionTitle>Passos</PrintSectionTitle>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {printing.steps.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="w-8 font-bold py-1 align-top">{i + 1}</td>
                  <td className="py-1">{s}</td>
                  <td className="w-16 border-l text-center">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
          {printing.acceptanceCriteria && <><PrintSectionTitle>Critério de aceitação</PrintSectionTitle><p className="text-sm">{printing.acceptanceCriteria}</p></>}
          {printing.commonErrors && <><PrintSectionTitle>Atenção — erros comuns</PrintSectionTitle><p className="text-sm">{printing.commonErrors}</p></>}
          <PrintSignatures left="Executante" right="Conferência" />
          <PrintFooter settings={settings} />
        </PrintDocument>
      )}
    </div>
  );
}

function ChecklistsSection() {
  const { token } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | undefined>();
  const [expanded, setExpanded] = useState<string | undefined>();
  const [printing, setPrinting] = usePrint<Checklist>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setChecklists(await api.listChecklists(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (token) api.getSettings(token).then(setSettings); }, [token]);

  async function handleSubmit(data: ChecklistInput) {
    if (!token) return;
    if (editing) await api.updateChecklist(token, editing.id, data);
    else await api.createChecklist(token, data);
    setOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleDelete(c: Checklist) {
    if (!token || !confirm(`Excluir "${c.title}"?`)) return;
    await api.deleteChecklist(token, c.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Checklist existe para o que é crítico e fácil de esquecer sob pressão. Curto e objetivo — dez itens no máximo.
      </div>
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}><Plus size={16} className="mr-2" />Novo Checklist</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : checklists.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum checklist — comece pelo de mobilização de obra, é o que mais evita retorno de viagem.</p>
      ) : (
        <div className="space-y-2">
          {checklists.map((c) => {
            const isOpen = expanded === c.id;
            return (
              <div key={c.id} className="border rounded-md bg-card">
                <button type="button" onClick={() => setExpanded(isOpen ? undefined : c.id)} className="w-full flex items-center gap-3 p-3 text-left">
                  {isOpen ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.title}</p>
                    <div className="flex gap-2 items-center mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline">{checklistContextLabels[c.context] || c.context}</Badge>
                      <span>{c.items.length} itens</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => setPrinting(c)}><Printer size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}><Trash2 size={16} /></Button>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 border-t pt-3 space-y-1.5">
                    {c.items.map((item, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Checklist' : 'Novo Checklist'}</DialogTitle></DialogHeader>
          <ChecklistForm initialData={editing} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditing(undefined); }} />
        </DialogContent>
      </Dialog>

      {printing && (
        <PrintDocument>
          <PrintHeader settings={settings} docTitle="CHECKLIST" />
          <h2 className="text-lg font-bold mt-3 mb-1">{printing.title}</h2>
          <p className="text-xs text-gray-600 mb-3">{checklistContextLabels[printing.context] || printing.context}</p>
          <div className="flex gap-6 text-sm mb-4">
            <span>Obra: ______________________</span>
            <span>Data: ____/____/______</span>
            <span>Responsável: ______________________</span>
          </div>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {printing.items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="w-8 text-center py-1">{i + 1}</td>
                  <td className="py-1">{item}</td>
                  <td className="w-12 border-l text-center">☐</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-10 text-sm">Assinatura: ________________________________</p>
          <PrintFooter settings={settings} />
        </PrintDocument>
      )}
    </div>
  );
}

function LessonsLearnedSection() {
  const { token } = useAuth();
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setLessons(await api.listLessonsLearned(token)); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: LessonLearnedInput) {
    if (!token) return;
    await api.createLessonLearned(token, data);
    setOpen(false);
    load();
  }

  async function handleDelete(l: LessonLearned) {
    if (!token || !confirm('Excluir esta lição aprendida?')) return;
    await api.deleteLessonLearned(token, l.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Toda obra com retrabalho, atraso ou erro de orçamento gera um registro aqui. Não é para culpar ninguém — é para o mesmo erro não custar duas vezes.
      </div>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Registrar Lição</Button>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Projeto</TableHead><TableHead>O que aconteceu</TableHead>
              <TableHead>Categoria</TableHead><TableHead>Custo estimado</TableHead><TableHead>Ação definida</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : lessons.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma lição registrada ainda.</TableCell></TableRow>
            ) : lessons.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{l.projectLabel || '— Geral —'}</TableCell>
                <TableCell className="max-w-xs truncate" title={l.whatHappened}>{l.whatHappened}</TableCell>
                <TableCell><Badge variant={l.category === 'acerto' ? 'success' : 'outline'}>{lessonCategoryLabels[l.category] || l.category}</Badge></TableCell>
                <TableCell>{l.estimatedCost ? fmt(l.estimatedCost) : '-'}</TableCell>
                <TableCell className="max-w-xs truncate" title={l.actionTaken}>{l.actionTaken}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(l)}><Trash2 size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Lição Aprendida</DialogTitle></DialogHeader>
          <LessonLearnedForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
        <p className="text-muted-foreground">Procedimentos padrão, instruções de máquina, checklists operacionais e lições aprendidas.</p>
      </div>

      <Tabs defaultValue="procedimentos">
        <TabsList>
          <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
          <TabsTrigger value="maquinas">Máquinas</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="licoes">Lições Aprendidas</TabsTrigger>
        </TabsList>
        <TabsContent value="procedimentos"><PlaybooksSection machine={false} /></TabsContent>
        <TabsContent value="maquinas"><PlaybooksSection machine={true} /></TabsContent>
        <TabsContent value="checklists"><ChecklistsSection /></TabsContent>
        <TabsContent value="licoes"><LessonsLearnedSection /></TabsContent>
      </Tabs>
    </div>
  );
}
