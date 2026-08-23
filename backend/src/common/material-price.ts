export type QuoteConfidence = 'ALTA' | 'MEDIA' | 'BAIXA';

const MEDIUM_CONFIDENCE_THRESHOLD_DAYS = 7;

export function getQuoteConfidence(
  validUntil: Date,
  now: Date = new Date(),
): QuoteConfidence {
  const daysRemaining =
    (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysRemaining < 0) return 'BAIXA';
  if (daysRemaining <= MEDIUM_CONFIDENCE_THRESHOLD_DAYS) return 'MEDIA';
  return 'ALTA';
}

export interface MaterialQuoteForPrice {
  id: string;
  price: number;
  quantity: number;
  freight: number;
  freightModality: 'FOB' | 'CIF';
  validUntil: Date;
}

// CIF: o frete já vem embutido no preço cotado pelo fornecedor.
// FOB: o frete é por conta do comprador, então soma-se ao preço (rateado pela quantidade da cotação).
export function calculateQuoteLandedCost(quote: MaterialQuoteForPrice) {
  const freightPerUnit =
    quote.freightModality === 'FOB' && quote.quantity > 0
      ? quote.freight / quote.quantity
      : 0;
  return quote.price + freightPerUnit;
}

export interface MaterialReferencePriceResult {
  referencePrice: number;
  source: 'MANUAL' | 'QUOTE';
  confidence?: QuoteConfidence;
  quoteId?: string;
}

export interface MaterialForReferencePrice {
  unitCost: number;
  referenceMode: 'MANUAL' | 'AUTO';
  manualQuoteId?: string | null;
}

// AUTO usa a cotação de menor custo posto (preço + frete rateado); MANUAL usa
// unitCost, a menos que o material esteja fixado (pinned) numa cotação específica.
export function calculateMaterialReferencePrice(
  material: MaterialForReferencePrice,
  quotes: MaterialQuoteForPrice[],
): MaterialReferencePriceResult {
  if (material.referenceMode === 'MANUAL') {
    const pinned = material.manualQuoteId
      ? quotes.find((q) => q.id === material.manualQuoteId)
      : undefined;
    if (pinned) {
      return {
        referencePrice: calculateQuoteLandedCost(pinned),
        source: 'QUOTE',
        confidence: getQuoteConfidence(pinned.validUntil),
        quoteId: pinned.id,
      };
    }
    return { referencePrice: material.unitCost, source: 'MANUAL' };
  }

  if (quotes.length === 0) {
    return { referencePrice: material.unitCost, source: 'MANUAL' };
  }

  const cheapest = quotes
    .map((quote) => ({ quote, cost: calculateQuoteLandedCost(quote) }))
    .sort((a, b) => a.cost - b.cost)[0];

  return {
    referencePrice: cheapest.cost,
    source: 'QUOTE',
    confidence: getQuoteConfidence(cheapest.quote.validUntil),
    quoteId: cheapest.quote.id,
  };
}
