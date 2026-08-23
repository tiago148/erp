import { compareRow, compareMargin } from './previsto-realizado';

describe('compareRow', () => {
  it('marca custo acima do previsto como ATENCAO', () => {
    const row = compareRow(30000, 34000, 'cost');
    expect(row.diff).toBe(4000);
    expect(row.executionPct).toBeCloseTo(113.33, 1);
    expect(row.status).toBe('ATENCAO');
  });

  it('marca custo dentro do previsto como DENTRO', () => {
    const row = compareRow(20000, 18000, 'cost');
    expect(row.diff).toBe(-2000);
    expect(row.status).toBe('DENTRO');
  });

  it('marca custo exatamente igual ao previsto como DENTRO (nao ATENCAO)', () => {
    const row = compareRow(5000, 5000, 'cost');
    expect(row.diff).toBe(0);
    expect(row.status).toBe('DENTRO');
  });

  it('marca receita abaixo do previsto como ATENCAO', () => {
    const row = compareRow(100000, 70000, 'revenue');
    expect(row.diff).toBe(-30000);
    expect(row.executionPct).toBe(70);
    expect(row.status).toBe('ATENCAO');
  });

  it('marca receita igual ou acima do previsto como POSITIVO', () => {
    expect(compareRow(100000, 100000, 'revenue').status).toBe('POSITIVO');
    expect(compareRow(100000, 120000, 'revenue').status).toBe('POSITIVO');
  });

  it('nao divide por zero quando o previsto e zero', () => {
    const row = compareRow(0, 500, 'cost');
    expect(row.executionPct).toBeNull();
    expect(row.diff).toBe(500);
    expect(row.status).toBe('ATENCAO');
  });

  it('previsto e realizado ambos zero: sem percentual, sem diferenca', () => {
    const row = compareRow(0, 0, 'cost');
    expect(row.executionPct).toBeNull();
    expect(row.diff).toBe(0);
    expect(row.status).toBe('DENTRO');
  });
});

describe('compareMargin', () => {
  it('calcula margem prevista e realizada e a diferenca em pontos percentuais', () => {
    // Exemplo do pedido: receita 100k/custo 60k previsto (40%), receita
    // 70k/custo 62k realizado (11,43%).
    const margin = compareMargin(100000, 60000, 70000, 62000);
    expect(margin.plannedPct).toBe(40);
    expect(margin.actualPct).toBeCloseTo(11.43, 1);
    expect(margin.diffPp).toBeCloseTo(-28.57, 1);
  });

  it('nao divide por zero quando a receita prevista ou realizada e zero', () => {
    const margin = compareMargin(0, 1000, 0, 1000);
    expect(margin.plannedPct).toBeNull();
    expect(margin.actualPct).toBeNull();
    expect(margin.diffPp).toBeNull();
  });
});
