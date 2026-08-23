'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, Budget } from '@/lib/api';
import { BudgetForm } from '@/components/budget-form';

export default function EditarOrcamentoPage() {
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (token && id) api.getBudget(token, id).then(setBudget);
  }, [token, id]);

  if (!budget) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Orçamento nº {budget.number}</h1>
      <BudgetForm initialData={budget} onSaved={() => router.push('/dashboard/orcamentos')} />
    </div>
  );
}