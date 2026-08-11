'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, SearchResults } from '@/lib/api';
import { Search, Users, Boxes, UserCog, Briefcase, FileText, Wrench, X } from 'lucide-react';

const groups: { key: keyof SearchResults; label: string; icon: React.ReactNode; href: (id: string) => string }[] = [
  { key: 'clients', label: 'Clientes', icon: <Users size={14} />, href: () => '/dashboard/clientes' },
  { key: 'materials', label: 'Materiais', icon: <Boxes size={14} />, href: () => '/dashboard/materiais' },
  { key: 'employees', label: 'Funcionários', icon: <UserCog size={14} />, href: () => '/dashboard/funcionarios' },
  { key: 'projects', label: 'Projetos', icon: <Briefcase size={14} />, href: () => '/dashboard/projetos' },
  { key: 'budgets', label: 'Orçamentos', icon: <FileText size={14} />, href: (id: string) => `/dashboard/orcamentos/${id}` },
  { key: 'tools', label: 'Ferramentas', icon: <Wrench size={14} />, href: () => '/dashboard/equipamentos' },
];

function itemLabel(key: keyof SearchResults, item: any) {
  if (key === 'clients') return item.name;
  if (key === 'materials') return item.name;
  if (key === 'employees') return item.name;
  if (key === 'projects') return `${item.number} — ${item.name}`;
  if (key === 'budgets') return `${item.number} — ${item.client?.name}`;
  if (key === 'tools') return item.name;
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
        className="flex items-center gap-2 text-sm text-gray-500 border rounded-md px-3 py-1.5 hover:bg-gray-50 w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="text-[10px] border rounded px-1 text-gray-400">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Search size={16} className="text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar clientes, materiais, projetos, orçamentos..."
                className="flex-1 outline-none text-sm"
              />
              <button onClick={() => setOpen(false)}><X size={16} className="text-gray-400" /></button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {query.trim().length < 2 && (
                <p className="text-sm text-gray-400 text-center py-8">Digite ao menos 2 caracteres para buscar.</p>
              )}
              {query.trim().length >= 2 && loading && (
                <p className="text-sm text-gray-400 text-center py-8">Buscando...</p>
              )}
              {query.trim().length >= 2 && !loading && !hasResults && (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum resultado encontrado.</p>
              )}
              {results && groups.map((group) => {
                const items = results[group.key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={group.key} className="mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 py-1">{group.label}</p>
                    {items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => goTo(group.key, item.id)}
                        className="w-full flex items-center gap-2 text-sm px-2 py-2 rounded-md hover:bg-gray-100 text-left"
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