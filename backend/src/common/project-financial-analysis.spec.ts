import {
  annualToMonthlyRate,
  vpl,
  tir,
  paybackSimples,
  paybackDescontado,
  exposicaoMaxima,
  indiceLucratividade,
} from './project-financial-analysis';

describe('annualToMonthlyRate', () => {
  it('converte 12% ao ano para a taxa mensal equivalente (~0.9489%)', () => {
    expect(annualToMonthlyRate(12)).toBeCloseTo(0.009489, 5);
  });

  it('taxa anual zero vira taxa mensal zero', () => {
    expect(annualToMonthlyRate(0)).toBeCloseTo(0, 10);
  });
});

describe('vpl', () => {
  it('soma simples quando a taxa e zero', () => {
    expect(vpl([-1000, 500, 500, 500], 0)).toBeCloseTo(500, 5);
  });

  it('desconta fluxos futuros quando a taxa e positiva', () => {
    const result = vpl([-1000, 1100], 0.1);
    expect(result).toBeCloseTo(0, 5);
  });
});

describe('tir', () => {
  it('a taxa encontrada zera o VPL do mesmo fluxo (consistencia)', () => {
    const cashflows = [-1000, 500, 500, 500];
    const rate = tir(cashflows);
    expect(rate).not.toBeNull();
    expect(vpl(cashflows, rate as number)).toBeCloseTo(0, 4);
  });

  it('bate com o caso conhecido de -1000/+1100 em 1 periodo (TIR = 10%)', () => {
    const rate = tir([-1000, 1100]);
    expect(rate).not.toBeNull();
    expect(rate as number).toBeCloseTo(0.1, 4);
  });

  it('retorna null quando nao ha troca de sinal (so custos)', () => {
    expect(tir([-100, -200, -300])).toBeNull();
  });

  it('retorna null quando nao ha troca de sinal (so receita)', () => {
    expect(tir([100, 200, 300])).toBeNull();
  });

  it('retorna null para fluxo com menos de 2 periodos', () => {
    expect(tir([-100])).toBeNull();
  });
});

describe('paybackSimples', () => {
  it('interpola fracionariamente dentro do periodo em que o saldo vira positivo', () => {
    // -1000, -600, -200, +200 -> cruza zero entre o mes 2 e o mes 3
    expect(paybackSimples([-1000, 400, 400, 400, 400])).toBeCloseTo(2.5, 5);
  });

  it('retorna 0 quando o fluxo ja comeca nao-negativo', () => {
    expect(paybackSimples([100, 200, 300])).toBe(0);
  });

  it('retorna null quando nunca recupera o investimento', () => {
    expect(paybackSimples([-1000, 100, 100])).toBeNull();
  });
});

describe('paybackDescontado', () => {
  it('e maior ou igual ao payback simples para o mesmo fluxo (desconto atrasa a recuperacao)', () => {
    const cashflows = [-1000, 400, 400, 400, 400];
    const simples = paybackSimples(cashflows) as number;
    const descontado = paybackDescontado(cashflows, 0.05) as number;
    expect(descontado).toBeGreaterThanOrEqual(simples);
  });

  it('coincide com o payback simples quando a taxa e zero', () => {
    const cashflows = [-1000, 400, 400, 400, 400];
    expect(paybackDescontado(cashflows, 0)).toBeCloseTo(
      paybackSimples(cashflows) as number,
      5,
    );
  });
});

describe('exposicaoMaxima', () => {
  it('encontra o menor saldo acumulado mesmo quando nao e o primeiro periodo', () => {
    // 0, -500, -800, -400, 0 -> minimo e -800 no mes 1
    expect(exposicaoMaxima([-500, -300, 400, 400])).toBeCloseTo(-800, 5);
  });

  it('retorna 0 quando o saldo acumulado nunca fica negativo', () => {
    expect(exposicaoMaxima([100, 200, 300])).toBe(0);
  });
});

describe('indiceLucratividade', () => {
  it('calcula IL > 1 para um fluxo lucrativo com taxa zero', () => {
    // VPL = 200, saidas descontadas = 1000 -> IL = 1 + 200/1000 = 1.2
    expect(indiceLucratividade([-1000, 600, 600], 0)).toBeCloseTo(1.2, 5);
  });

  it('retorna null quando nao ha nenhuma saida (nada para dividir)', () => {
    expect(indiceLucratividade([100, 200], 0)).toBeNull();
  });

  it('IL = 1 quando o VPL e exatamente zero', () => {
    expect(indiceLucratividade([-1000, 1000], 0)).toBeCloseTo(1, 5);
  });
});
