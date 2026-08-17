import type { SurplusShape, SurplusDestination } from './api';

const CHAPA_SUCATA_AREA_CM2 = 400; // ~20x20cm
const CHAPA_RETALHO_AREA_CM2 = 2500; // ~50x50cm
const BARRA_SUCATA_LENGTH_CM = 30;
const BARRA_RETALHO_LENGTH_CM = 100;

// Mirrors suggestSurplusDestination in backend/src/common/surplus-classification.ts.
export function suggestSurplusDestination(
  shape: SurplusShape | undefined,
  length: number | undefined,
  width: number | undefined,
): SurplusDestination {
  if (shape === 'CHAPA' && length && width) {
    const areaCm2 = length * width;
    if (areaCm2 < CHAPA_SUCATA_AREA_CM2) return 'SUCATA';
    if (areaCm2 < CHAPA_RETALHO_AREA_CM2) return 'RETALHO';
    return 'ESTOQUE';
  }
  if ((shape === 'BARRA_TUBO' || shape === 'FIO') && length) {
    if (length < BARRA_SUCATA_LENGTH_CM) return 'SUCATA';
    if (length < BARRA_RETALHO_LENGTH_CM) return 'RETALHO';
    return 'ESTOQUE';
  }
  return 'ESTOQUE';
}
