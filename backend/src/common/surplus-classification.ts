export type SurplusShape = 'CHAPA' | 'BARRA_TUBO' | 'FIO' | 'OUTRO';
export type SurplusDestination = 'ESTOQUE' | 'RETALHO' | 'SUCATA';

const CHAPA_SUCATA_AREA_CM2 = 400; // ~20x20cm
const CHAPA_RETALHO_AREA_CM2 = 2500; // ~50x50cm
const BARRA_SUCATA_LENGTH_CM = 30;
const BARRA_RETALHO_LENGTH_CM = 100;

// Sugestao de destino a partir das dimensoes medidas — o usuario sempre pode
// sobrescrever manualmente. Chapa usa area (comprimento x largura); barra,
// tubo e fio usam so o comprimento. Sem dimensoes ou forma, cai no
// comportamento antigo (sobra vai para o estoque geral).
export function suggestSurplusDestination(
  shape: SurplusShape | null | undefined,
  length: number | null | undefined,
  width: number | null | undefined,
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
