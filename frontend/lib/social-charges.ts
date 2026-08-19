import { SocialChargeItem, BenefitItem } from './api';

export interface SocialChargesInput {
  grupoA: SocialChargeItem[];
  grupoB: SocialChargeItem[];
  beneficios: BenefitItem[];
  horasProdMes: number;
}

// Mirrors computeSocialCharges in backend/src/common/social-charges.ts exactly.
export function computeSocialCharges(input: SocialChargesInput) {
  const pctGrupoA = input.grupoA.reduce((sum, item) => sum + item.pct, 0);
  const pctGrupoB = input.grupoB.reduce((sum, item) => sum + item.pct, 0);
  const encargosPct = pctGrupoA + pctGrupoB + (pctGrupoA * pctGrupoB) / 100;

  const beneficiosMes = input.beneficios.reduce((sum, item) => sum + item.valorMes, 0);
  const beneficioHora = input.horasProdMes > 0 ? beneficiosMes / input.horasProdMes : 0;

  return { pctGrupoA, pctGrupoB, encargosPct, beneficiosMes, beneficioHora };
}
