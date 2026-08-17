'use client';

import { ReactNode } from 'react';
import { Settings } from '@/lib/api';

export function PrintDocument({ children }: { children: ReactNode }) {
  return <div className="print-area p-8">{children}</div>;
}

export function PrintHeader({ settings, docTitle, docSubtitle }: { settings: Settings | null; docTitle: ReactNode; docSubtitle?: ReactNode }) {
  const companyLine = [
    settings?.companyDocument ? `CNPJ: ${settings.companyDocument}` : '',
    settings?.companyAddress,
    [settings?.companyPhone, settings?.companyEmail].filter(Boolean).join(' · '),
  ].filter(Boolean).join(' · ');

  return (
    <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
      <div>
        <div className="font-bold text-lg">{settings?.companyName || 'OPRENDIN'}</div>
        {companyLine && <div className="text-xs text-gray-600 mt-1">{companyLine}</div>}
      </div>
      <div className="text-right">
        <div className="font-bold">{docTitle}</div>
        {docSubtitle && <div className="text-xs text-gray-600 mt-1">{docSubtitle}</div>}
      </div>
    </div>
  );
}

export function PrintSectionTitle({ children }: { children: ReactNode }) {
  return <p className="font-bold text-[11px] uppercase tracking-wide mt-4 mb-1 text-gray-700">{children}</p>;
}

export function PrintFooter({ settings }: { settings: Settings | null }) {
  return (
    <div className="text-[9px] text-gray-500 mt-8 pt-2 border-t border-gray-300">
      Documento gerado em {new Date().toLocaleString('pt-BR')} · {settings?.companyName || 'OPRENDIN'}
    </div>
  );
}

export function PrintSignatures({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-around mt-16 text-xs text-center">
      <div className="border-t border-gray-500 pt-1 w-56">{left}</div>
      <div className="border-t border-gray-500 pt-1 w-56">{right}</div>
    </div>
  );
}
