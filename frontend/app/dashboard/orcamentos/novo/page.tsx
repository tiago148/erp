'use client';

import { useRouter } from 'next/navigation';
import { BudgetForm } from '@/components/budget-form';

export default function NovoOrcamentoPage() {
  const router = useRouter();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Orçamento</h1>
      <BudgetForm onSaved={() => router.push('/dashboard/orcamentos')} />
    </div>
  );
}