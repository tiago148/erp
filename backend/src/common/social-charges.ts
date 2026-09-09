export interface SocialChargeItem {
  nome: string;
  pct: number;
}

export interface BenefitItem {
  nome: string;
  valorMes: number;
}

// Encargos complementares (metodologia SINAPI): ferramenta manual e EPI de
// uso individual nao sao percentual sobre o salario. O custo horario de cada
// item vem de (preco x quantidade) / vida util em meses / horas produtivas
// no mes, e e somado a hora sem variar com a remuneracao.
export interface ToolingItem {
  nome: string;
  qtd: number;
  preco: number;
  vidaMeses: number;
}

export interface SocialChargesInput {
  grupoA: SocialChargeItem[];
  grupoB: SocialChargeItem[];
  beneficios: BenefitItem[];
  ferramental?: ToolingItem[];
  horasProdMes: number;
}

export interface SocialChargesResult {
  pctGrupoA: number;
  pctGrupoB: number;
  encargosPct: number;
  beneficiosMes: number;
  beneficioHora: number;
  ferramentalMes: number;
  ferramentalHora: number;
}

// Grupo B (férias, 13º, aviso prévio, multa FGTS) incide sobre a base já
// acrescida do Grupo A (INSS, SESI, SENAI, INCRA, SEBRAE, Salário-Educação,
// RAT/SAT, FGTS) — por isso a soma não é linear (%A + %B), e sim
// %A + %B + %A*%B/100, equivalente a aplicar os dois percentuais em
// cascata sobre a mesma base unitária.
export function computeSocialCharges(
  input: SocialChargesInput,
): SocialChargesResult {
  const pctGrupoA = input.grupoA.reduce((sum, item) => sum + item.pct, 0);
  const pctGrupoB = input.grupoB.reduce((sum, item) => sum + item.pct, 0);
  const encargosPct = pctGrupoA + pctGrupoB + (pctGrupoA * pctGrupoB) / 100;

  const beneficiosMes = input.beneficios.reduce(
    (sum, item) => sum + item.valorMes,
    0,
  );
  const beneficioHora =
    input.horasProdMes > 0 ? beneficiosMes / input.horasProdMes : 0;

  const ferramentalHora = (input.ferramental ?? []).reduce((sum, item) => {
    const vida = Number(item.vidaMeses) || 1;
    return (
      sum +
      (input.horasProdMes > 0
        ? (Number(item.preco) * Number(item.qtd)) / vida / input.horasProdMes
        : 0)
    );
  }, 0);
  const ferramentalMes = ferramentalHora * input.horasProdMes;

  return {
    pctGrupoA,
    pctGrupoB,
    encargosPct,
    beneficiosMes,
    beneficioHora,
    ferramentalMes,
    ferramentalHora,
  };
}
