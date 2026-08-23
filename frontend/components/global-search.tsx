'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, SearchResults } from '@/lib/api';
import { Search, Users, Boxes, UserCog, Briefcase, FileText, Wrench, Truck, ShoppingCart, ClipboardList, KanbanSquare, MapPin, Wallet, X } from 'lucide-react';

const groups: { key: keyof SearchResults; label: string; icon: React.ReactNode; href: (id: string) => string }[] = [
  { key: 'clients', label: 'Clientes', icon: <Users size={14} />, href: () => '/dashboard/clientes' },
  { key: 'materials', label: 'Materiais', icon: <Boxes size={14} />, href: () => '/dashboard/materiais' },
  { key: 'employees', label: 'Funcionários', icon: <UserCog size={14} />, href: () => '/dashboard/funcionarios' },
  { key: 'projects', label: 'Projetos', icon: <Briefcase size={14} />, href: (id: string) => `/dashboard/projetos/${id}` },
  { key: 'budgets', label: 'Orçamentos', icon: <FileText size={14} />, href: (id: string) => `/dashboard/orcamentos/${id}` },
  { key: 'tools', label: 'Ferramentas', icon: <Wrench size={14} />, href: () => '/dashboard/equipamentos' },
  { key: 'vehicles', label: 'Veículos', icon: <Truck size={14} />, href: () => '/dashboard/equipamentos' },
  { key: 'suppliers', label: 'Fornecedores', icon: <ShoppingCart size={14} />, href: () => '/dashboard/compras' },
  { key: 'purchaseOrders', label: 'Compras', icon: <ShoppingCart size={14} />, href: () => '/dashboard/compras' },
  { key: 'quotations', label: 'Cotações', icon: <ClipboardList size={14} />, href: () => '/dashboard/compras' },
  { key: 'tasks', label: 'Tarefas', icon: <KanbanSquare size={14} />, href: () => '/dashboard/tarefas' },
  { key: 'workSites', label: 'Locais de Obra', icon: <MapPin size={14} />, href: () => '/dashboard/equipamentos' },
  { key: 'financeEntries', label: 'Financeiro', icon: <Wallet size={14} />, href: () => '/dashboard/financeiro' },
];

function itemLabel(key: keyof SearchResults, item: any) {
  if (key === 'clients') return item.name;
  if (key === 'materials') return item.name;
  if (key === 'employees') return item.name;
  if (key === 'projects') return `${item.number} — ${item.name}`;
  if (key === 'budgets') return `${item.number} — ${item.client?.name}`;
  if (key === 'tools') return item.name;
  if (key === 'vehicles') return `${item.name} — ${item.plate}`;
  if (key === 'suppliers') return item.name;
  if (key === 'purchaseOrders') return `${item.number} — ${item.supplier?.name}`;
  if (key === 'quotations') return `${item.number}${item.description ? ` — ${item.description}` : ''}`;
  if (key === 'tasks') return item.title;
  if (key === 'workSites') return `${item.name} — ${item.client?.name}`;
  if (key === 'financeEntries') return item.description;
  return '';
}

export function GlobalSearch() {
  const { token } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setResults(null); }
  }, [open]);

  const runSearch = useCallback(async (q: string) => {
    if (!token || q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      setResults(await api.search(token, q));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  function goTo(key: keyof SearchResults, id: string) {
    const group = groups.find((g) => g.key === key)!;
    router.push(group.href(id));
    setOpen(false);
  }

  const hasResults = results && Object.values(results).some((arr) => arr.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-muted w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="text-[10px] border rounded px-1 text-muted-foreground">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Search size={16} className="text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar em todo o sistema..."
                className="flex-1 outline-none text-sm"
              />
              <button onClick={() => setOpen(false)}><X size={16} className="text-muted-foreground" /></button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {query.trim().length < 2 && (
                <p className="text-sm text-muted-foreground text-center py-8">Digite ao menos 2 caracteres para buscar.</p>
              )}
              {query.trim().length >= 2 && loading && (
                <p className="text-sm text-muted-foreground text-center py-8">Buscando...</p>
              )}
              {query.trim().length >= 2 && !loading && !hasResults && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum resultado encontrado.</p>
              )}
              {results && groups.map((group) => {
                const items = results[group.key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={group.key} className="mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">{group.label}</p>
                    {items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => goTo(group.key, item.id)}
                        className="w-full flex items-center gap-2 text-sm px-2 py-2 rounded-md hover:bg-secondary text-left"
                      >
                        {group.icon}
                        {itemLabel(group.key, item)}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}