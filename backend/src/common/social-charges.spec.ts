import { computeSocialCharges } from './social-charges';

describe('computeSocialCharges', () => {
  it('soma os percentuais do grupo A isoladamente', () => {
    const { pctGrupoA } = computeSocialCharges({
      grupoA: [
        { nome: 'INSS', pct: 20 },
        { nome: 'FGTS', pct: 8 },
      ],
      grupoB: [],
      beneficios: [],
      horasProdMes: 176,
    });
    expect(pctGrupoA).toBe(28);
  });

  it('aplica o grupo B em cascata sobre o grupo A (nao soma linear)', () => {
    const { pctGrupoA, pctGrupoB, encargosPct } = computeSocialCharges({
      grupoA: [{ nome: 'INSS', pct: 20 }],
      grupoB: [{ nome: 'Ferias', pct: 10 }],
      beneficios: [],
      horasProdMes: 176,
    });
    expect(pctGrupoA).toBe(20);
    expect(pctGrupoB).toBe(10);
    // 20 + 10 + (20*10)/100 = 32
    expect(encargosPct).toBe(32);
  });

  it('calcula o beneficio por hora a partir da soma mensal dividida pelas horas produtivas', () => {
    const { beneficiosMes, beneficioHora } = computeSocialCharges({
      grupoA: [],
      grupoB: [],
      beneficios: [
        { nome: 'Vale-transporte', valorMes: 220 },
        { nome: 'Vale-refeicao', valorMes: 440 },
      ],
      horasProdMes: 176,
    });
    expect(beneficiosMes).toBe(660);
    expect(beneficioHora).toBeCloseTo(3.75, 5);
  });

  it('nao divide por zero quando horasProdMes e zero', () => {
    const { beneficioHora } = computeSocialCharges({
      grupoA: [],
      grupoB: [],
      beneficios: [{ nome: 'Vale-transporte', valorMes: 220 }],
      horasProdMes: 0,
    });
    expect(beneficioHora).toBe(0);
  });

  it('retorna tudo zerado quando nao ha nenhum item configurado', () => {
    const result = computeSocialCharges({
      grupoA: [],
      grupoB: [],
      beneficios: [],
      horasProdMes: 176,
    });
    expect(result.encargosPct).toBe(0);
    expect(result.beneficioHora).toBe(0);
  });
});
