// Todas as funcoes aqui operam sobre uma serie mensal de fluxo de caixa
// LIQUIDO (entradas - saidas de cada mes), indice 0 = primeiro mes com
// movimentacao real do projeto. Nao ha um "investimento inicial" separado
// neste sistema (nao existe uma linha de CAPEX distinta) -- o proprio fluxo
// mensal, quando comeca negativo, ja carrega esse papel.

export function annualToMonthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1;
}

export function vpl(cashflows: number[], monthlyRate: number): number {
  return cashflows.reduce(
    (sum, cf, t) => sum + cf / Math.pow(1 + monthlyRate, t),
    0,
  );
}

const TIR_MIN_RATE = -0.99;
const TIR_MAX_RATE = 10; // 1000% ao mes -- faixa ampla o bastante para qualquer fluxo real
const TIR_SCAN_STEPS = 2000;
const TIR_PRECISION = 1e-7;

// TIR = taxa que zera o VPL. Sem biblioteca externa de raizes, resolvida por
// varredura (para achar um intervalo com troca de sinal) + bisseccao dentro
// dele -- mais lento que Newton-Raphson, mas nunca diverge, o que importa
// mais aqui do que velocidade (chamada por projeto, nao em loop quente).
export function tir(cashflows: number[]): number | null {
  if (cashflows.length < 2) return null;
  const hasPositive = cashflows.some((v) => v > 0);
  const hasNegative = cashflows.some((v) => v < 0);
  if (!hasPositive || !hasNegative) return null; // sem troca de sinal, TIR nao e definida

  const step = (TIR_MAX_RATE - TIR_MIN_RATE) / TIR_SCAN_STEPS;
  let prevRate = TIR_MIN_RATE;
  let prevValue = vpl(cashflows, prevRate);
  if (Math.abs(prevValue) < TIR_PRECISION) return prevRate;

  for (let i = 1; i <= TIR_SCAN_STEPS; i++) {
    const rate = TIR_MIN_RATE + step * i;
    const value = vpl(cashflows, rate);
    if (Math.abs(value) < TIR_PRECISION) return rate;

    if (prevValue < 0 !== value < 0) {
      let lo = prevRate;
      let hi = rate;
      let loValue = prevValue;
      for (let j = 0; j < 100; j++) {
        const mid = (lo + hi) / 2;
        const midValue = vpl(cashflows, mid);
        if (Math.abs(midValue) < TIR_PRECISION) return mid;
        if (loValue < 0 === midValue < 0) {
          lo = mid;
          loValue = midValue;
        } else {
          hi = mid;
        }
      }
      return (lo + hi) / 2;
    }

    prevRate = rate;
    prevValue = value;
  }

  return null; // nenhuma troca de sinal encontrada na faixa pesquisada
}

// Payback simples: primeiro periodo em que o saldo acumulado (sem desconto)
// deixa de ser negativo, com interpolacao fracionaria dentro do periodo.
export function paybackSimples(cashflows: number[]): number | null {
  let cumulative = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const prevCumulative = cumulative;
    cumulative += cashflows[t];
    if (cumulative >= 0) {
      if (prevCumulative >= 0) return 0; // ja recuperado antes deste periodo comecar
      if (cashflows[t] === 0) return t;
      return t - 1 + -prevCumulative / cashflows[t];
    }
  }
  return null; // nao recupera o investimento no periodo analisado
}

// Mesma logica do payback simples, mas sobre o fluxo descontado pela TMA.
export function paybackDescontado(
  cashflows: number[],
  monthlyRate: number,
): number | null {
  const discounted = cashflows.map(
    (cf, t) => cf / Math.pow(1 + monthlyRate, t),
  );
  return paybackSimples(discounted);
}

// Exposicao maxima = menor saldo acumulado (nao descontado) da serie -- o
// quanto de capital proprio o projeto chegou a exigir no pior momento.
// Retorna 0 quando o saldo nunca fica negativo (nenhuma exposicao).
export function exposicaoMaxima(cashflows: number[]): number {
  let cumulative = 0;
  let min = 0;
  for (const cf of cashflows) {
    cumulative += cf;
    if (cumulative < min) min = cumulative;
  }
  return min;
}

// Indice de lucratividade = 1 + VPL / (soma das saidas descontadas). Mede
// quanto valor presente e gerado por unidade de capital efetivamente
// consumido pelo projeto (IL > 1 = viavel na taxa considerada).
export function indiceLucratividade(
  cashflows: number[],
  monthlyRate: number,
): number | null {
  const totalOutflowsDiscounted = cashflows.reduce((sum, cf, t) => {
    const discounted = cf / Math.pow(1 + monthlyRate, t);
    return discounted < 0 ? sum - discounted : sum;
  }, 0);
  if (totalOutflowsDiscounted === 0) return null;
  return 1 + vpl(cashflows, monthlyRate) / totalOutflowsDiscounted;
}
