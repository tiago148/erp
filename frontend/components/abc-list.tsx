function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface AbcItem {
  label: string;
  value: number;
}

const classColors: Record<'A' | 'B' | 'C', string> = {
  A: 'text-primary',
  B: 'text-info',
  C: 'text-muted-foreground',
};

export function AbcList({ items, emptyText }: { items: AbcItem[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const total = items.reduce((s, i) => s + i.value, 0);
  const classified = items.map((item, idx) => {
    const cumValue = items.slice(0, idx + 1).reduce((s, i) => s + i.value, 0);
    const cumPct = total > 0 ? (cumValue / total) * 100 : 0;
    const cls: 'A' | 'B' | 'C' = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C';
    return { ...item, cls };
  });
  const countA = classified.filter((i) => i.cls === 'A').length;
  const max = classified[0]?.value || 1;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        <strong className="text-primary">{countA} item(ns)</strong> classe A respondem por 80% do total — é onde vale concentrar atenção.
      </p>
      <div className="space-y-2">
        {classified.slice(0, 10).map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground/90">
                <span className={`mr-2 text-[10px] font-bold ${classColors[item.cls]}`}>{item.cls}</span>
                {item.label}
              </span>
              <span className={`font-mono ${classColors[item.cls]}`}>{fmt(item.value)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${item.cls === 'A' ? 'bg-primary' : item.cls === 'B' ? 'bg-info' : 'bg-muted-foreground'}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
