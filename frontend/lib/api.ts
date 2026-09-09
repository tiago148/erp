const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!response.ok) {
    // Sessão inválida/expirada numa chamada autenticada: em vez de deixar o
    // erro estourar sem tratamento em qualquer tela que fez essa chamada
    // (o que derrubava a página inteira no overlay de erro do Next.js),
    // encerra a sessão e manda para o login — mesmo efeito do logout().
    // Só entra em ação quando havia um token (login com senha errada, por
    // exemplo, não passa token e continua caindo no throw normal abaixo,
    // pra aparecer como erro no próprio formulário de login).
    if (response.status === 401 && token && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return new Promise<T>(() => {});
    }
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }
  return response.json();
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string; allowedModules?: string[] };
}

export type UserRole = 'ADMIN' | 'USER';
export interface ManagedUser {
  id: string; name: string; email: string; role: UserRole; active: boolean; allowedModules: string[]; createdAt: string;
}
export interface CreateUserByAdminInput {
  name: string; email: string; role?: UserRole;
}

export interface Client {
  id: string; type: 'INDIVIDUAL' | 'COMPANY'; name: string; document: string;
  email?: string; phone?: string; address?: string; city?: string; state?: string;
  zipCode?: string; notes?: string; createdAt: string; updatedAt: string;
}
export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

export interface ClientContact {
  id: string; clientId: string; name: string; role?: string; phone?: string; email?: string; notes?: string;
  createdAt: string; updatedAt: string;
}
export type ClientContactInput = Omit<ClientContact, 'id' | 'createdAt' | 'updatedAt'>;

export type MaterialReferenceMode = 'MANUAL' | 'AUTO';
export type FreightModality = 'FOB' | 'CIF';
export type QuoteConfidence = 'ALTA' | 'MEDIA' | 'BAIXA';

export interface MaterialQuote {
  id: string; materialId: string; supplierId: string; supplier: Supplier;
  price: number; quantity: number; freight: number; freightModality: FreightModality;
  validUntil: string; notes?: string; landedCost: number; confidence: QuoteConfidence;
  createdAt: string; updatedAt: string;
}
export type MaterialQuoteInput = {
  materialId: string; supplierId: string; price: number; quantity?: number;
  freight?: number; freightModality?: FreightModality; validUntil: string; notes?: string;
};

export interface MaterialReference {
  referencePrice: number; source: 'MANUAL' | 'QUOTE'; confidence?: QuoteConfidence; quoteId?: string;
}

export interface Material {
  id: string; code?: string; name: string; category: string; unit: string;
  unitCost: number; supplier?: string;
  referenceMode: MaterialReferenceMode; manualQuoteId?: string;
  reference?: MaterialReference; quotes?: MaterialQuote[];
  createdAt: string; updatedAt: string;
}
export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'reference' | 'quotes'>;

export interface LaborRole {
  id: string; name: string; hourlyRate: number; chargesPct: number;
  periculosidade: boolean; insalubridadePct: number; noturnoPct: number;
  beneficioHora: number; ferramentalHora: number;
  effectiveHourlyRate: number; createdAt: string; updatedAt: string;
}
export type LaborRoleInput = Omit<LaborRole, 'id' | 'createdAt' | 'updatedAt' | 'effectiveHourlyRate'>;

export interface ThirdPartyService {
  id: string; name: string; category: string; unit: string; unitPrice: number;
  supplier?: string; leadTimeDays?: number; active: boolean;
  createdAt: string; updatedAt: string;
}
export type ThirdPartyServiceInput = Omit<ThirdPartyService, 'id' | 'createdAt' | 'updatedAt'>;

export type RentalBillingUnit = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'EVENT';
export interface RentalEquipment {
  id: string; name: string; category: string; billingUnit: RentalBillingUnit;
  unitPrice: number; mobilizationCost: number; minimumPeriod: number;
  supplier?: string; active: boolean;
  createdAt: string; updatedAt: string;
}
export type RentalEquipmentInput = Omit<RentalEquipment, 'id' | 'createdAt' | 'updatedAt'>;

export interface Vehicle {
  id: string; name: string; plate: string; type: string; fuelType: string;
  avgConsumption: number; initialKm: number; currentKm: number; reviewIntervalKm?: number;
  createdAt: string; updatedAt: string;
}
export type VehicleInput = Omit<Vehicle, 'id' | 'currentKm' | 'createdAt' | 'updatedAt'>;

export type VehicleTripType = 'FRETE' | 'ENTREGA' | 'COLETA' | 'COMPRA' | 'VISITA' | 'OUTRO';
export type VehicleTripStatus = 'OPEN' | 'CLOSED';

export interface VehicleTrip {
  id: string; vehicleId: string; vehicle: Vehicle;
  driverId?: string; driver?: Employee; projectId?: string; project?: Project;
  type: VehicleTripType; origin: string; destination: string; purpose?: string;
  startKm?: number; endKm?: number; distanceKm: number; tollCost: number; status: VehicleTripStatus;
  date: string; closedAt?: string; notes?: string; createdAt: string;
}
export interface VehicleTripInput {
  vehicleId: string; driverId?: string; projectId?: string; type?: VehicleTripType;
  origin: string; destination: string; purpose?: string; startKm?: number;
  date?: string; notes?: string;
}
export interface CloseVehicleTripInput {
  endKm: number; tollCost?: number; notes?: string;
}

export interface VehicleMaintenance {
  id: string; vehicleId: string; vehicle: Vehicle;
  date: string; km: number; type: string; cost: number;
  description?: string; supplierName?: string;
  financeEntryId?: string; financeEntry?: FinanceEntry;
  createdAt: string; updatedAt: string;
}
export interface VehicleMaintenanceInput {
  vehicleId: string; date: string; km: number; type: string; cost: number;
  description?: string; supplierName?: string;
}

export interface ToolMaintenance {
  id: string; toolId: string; tool: Tool;
  date: string; type: string; cost: number;
  description?: string; supplierName?: string;
  financeEntryId?: string; financeEntry?: FinanceEntry;
  createdAt: string; updatedAt: string;
}
export interface ToolMaintenanceInput {
  toolId: string; date: string; type: string; cost: number;
  description?: string; supplierName?: string;
}

export type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'NEGOTIATING';
export type TaxRegime = 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI';

export interface BudgetMaterialItemMeasure { id: string; lengthM: number; pieces: number; }
export interface BudgetMaterialItem { id: string; materialId: string; material: Material; quantity: number; unitCost: number; measures: BudgetMaterialItemMeasure[]; }
export interface BudgetLaborItem { id: string; laborRoleId: string; laborRole: LaborRole; hours: number; hourlyRate: number; }
export interface BudgetTravelItem { id: string; vehicleId: string; vehicle: Vehicle; distanceKm: number; trips: number; fuelPrice: number; }
export interface BudgetOtherItem { id: string; description: string; amount: number; }
export interface BudgetServiceItem { id: string; thirdPartyServiceId: string; thirdPartyService: ThirdPartyService; quantity: number; unitPrice: number; }
export interface BudgetRentalItem { id: string; rentalEquipmentId: string; rentalEquipment: RentalEquipment; period: number; unitPrice: number; mobilizationCost: number; }
export interface BudgetTax { name: string; rate: number; value: number; }
export interface BudgetTotals {
  materialsTotal: number; laborTotal: number; travelTotal: number; otherTotal: number; compositionsTotal: number;
  servicesTotal: number; rentalsTotal: number;
  subtotal: number; indirectCostValue: number; costWithIndirect: number;
  contingenciaValue: number; custoFinanceiroValue: number; custoTotal: number;
  impostoPct: number; pvCheio: number; taxes: BudgetTax[]; taxTotal: number; impostoReal: number;
  discountValue: number; total: number;
  lucroReal: number; margemReal: number; bdiEquivalente: number; pricingImpossible: boolean;
  estimatedCost: number; estimatedMargin: number; estimatedMarginPct: number;
}
export interface BudgetCompositionItem {
  id: string; budgetId: string; compositionId: string; composition: CostComposition; quantity: number; unitCost: number;
}
export interface Budget {
  id: string; number: string; version: number; rootId?: string; clientId: string; client: Client; description?: string;
  status: BudgetStatus; regime: TaxRegime; bdiPct: number;
  lucroPct: number; contingenciaPct: number; prazoRecebimentoDias: number; taxaCapitalPct: number;
  discountPct: number; notes?: string;
  employeeId?: string; employee?: Employee; projectDays?: number;
  materialItems: BudgetMaterialItem[]; laborItems: BudgetLaborItem[]; travelItems: BudgetTravelItem[];
  otherItems: BudgetOtherItem[]; compositionItems: BudgetCompositionItem[];
  serviceItems: BudgetServiceItem[]; rentalItems: BudgetRentalItem[];
  roteiro?: BudgetRoteiro | null;
  totals: BudgetTotals; createdAt: string; updatedAt: string;
}
export interface BudgetVersionSummary {
  id: string; number: string; version: number; status: BudgetStatus; createdAt: string;
}
export interface BudgetRoteiro {
  id: string; budgetId: string; checkedKeys: string[]; infoLevel: 'exec' | 'basico' | 'croqui';
  siteVisitDone: boolean; completionPct: number; suggestedContingencyPct: number;
  createdAt: string; updatedAt: string;
}
export interface BudgetRoteiroInput {
  checkedKeys: string[]; infoLevel: 'exec' | 'basico' | 'croqui'; siteVisitDone: boolean;
  completionPct: number; suggestedContingencyPct: number;
}
export interface BudgetInput {
  clientId: string; description?: string; status?: BudgetStatus; regime?: TaxRegime;
  bdiPct?: number; lucroPct?: number; contingenciaPct?: number; prazoRecebimentoDias?: number; taxaCapitalPct?: number;
  discountPct?: number; notes?: string; employeeId?: string; projectDays?: number;
  compositionItems?: { compositionId: string; quantity: number }[];
  materialItems?: { materialId: string; quantity: number; measures?: { lengthM: number; pieces: number }[] }[];
  laborItems?: { laborRoleId: string; hours: number }[];
  travelItems?: { vehicleId: string; distanceKm: number; trips: number; fuelPrice: number }[];
  otherItems?: { description: string; amount: number }[];
  serviceItems?: { thirdPartyServiceId: string; quantity: number }[];
  rentalItems?: { rentalEquipmentId: string; period: number }[];
}

export interface WorkSite {
  id: string; name: string; clientId: string; client: Client; address: string;
  city?: string; state?: string; distanceKm?: number; notes?: string;
  createdAt: string; updatedAt: string;
}
export type WorkSiteInput = Omit<WorkSite, 'id' | 'client' | 'createdAt' | 'updatedAt'>;

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export interface Project {
  id: string; number: string; name: string; clientId: string; client: Client;
  workSiteId?: string; workSite?: WorkSite; budgetId?: string; budget?: Budget;
  status: ProjectStatus; budgetAmount: number; startDate?: string; endDate?: string;
  notes?: string; responsibleEmployeeId?: string; responsibleEmployee?: Employee;
  createdAt: string; updatedAt: string;
}
export interface ProjectInput {
  name: string; clientId: string; workSiteId?: string; budgetId?: string;
  status?: ProjectStatus; budgetAmount?: number; startDate?: string; endDate?: string; notes?: string;
  responsibleEmployeeId?: string;
}

export interface ProjectPhase {
  id: string; projectId: string; name: string; weightPct: number;
  plannedStart: string; plannedEnd: string; progressPct: number; measuredAt?: string;
  notes?: string; createdAt: string; updatedAt: string;
}
export type ProjectPhaseInput = Omit<ProjectPhase, 'id' | 'createdAt' | 'updatedAt'>;

export type ToolLocation = 'COMPANY' | 'PROJECT';
export interface ToolMovement {
  id: string; toolId: string; fromLocation: ToolLocation; toLocation: ToolLocation;
  projectId?: string; project?: Project; responsible?: string; notes?: string; movedAt: string;
}
export type ToolCustody = 'SHARED' | 'INDIVIDUAL' | 'FIXED';
export type ToolChargeStatus = 'ACTIVE' | 'RETURNED' | 'TRANSFERRED';
export interface ToolCharge {
  id: string; toolId: string; tool?: Tool; employeeId: string; employee?: Employee;
  chargedAt: string; returnedAt?: string | null; conditionOut: string; reason: string;
  returnReason?: string | null; notes?: string | null; status: ToolChargeStatus; createdAt: string;
}
export interface Tool {
  id: string; code?: string; name: string; category: string;
  currentLocation: ToolLocation; currentProjectId?: string; currentProject?: Project;
  custody: ToolCustody; responsibleEmployeeId?: string | null; responsibleEmployee?: Employee | null;
  acquisitionValue: number;
  notes?: string; movements: ToolMovement[]; charges?: ToolCharge[]; createdAt: string; updatedAt: string;
}
export type ToolInput = Omit<Tool, 'id' | 'currentLocation' | 'currentProjectId' | 'currentProject' | 'responsibleEmployee' | 'movements' | 'charges' | 'createdAt' | 'updatedAt'>;
export interface ChargeToolInput { employeeId: string; chargedAt?: string; conditionOut?: string; reason?: string; notes?: string; }
export interface ReturnToolChargeInput { returnedAt?: string; returnReason?: string; }
export interface MoveToolInput {
  toLocation: ToolLocation;
  projectId?: string;
  responsible?: string;
  notes?: string;
}

export type StockMovementType = 'IN' | 'OUT';
export interface StockMovement {
  id: string; stockItemId: string; type: StockMovementType; quantity: number;
  projectId?: string; project?: Project; notes?: string; movedAt: string;
}
export type AbcClass = 'A' | 'B' | 'C';
export interface StockItem {
  id: string; materialId: string; material: Material; quantity: number; minQuantity: number; location?: string;
  addrStreet?: string; addrShelf?: string; addrLevel?: string; addrPosition?: string;
  abcClass: 'AUTO' | AbcClass; monthlyConsumption?: number | null; leadTimeDays: number; serviceLevelZ: number;
  reorderPoint: number;
  abcResolved: AbcClass; monthlyConsumptionResolved: number; reorderPointComputed: number;
  movements: StockMovement[]; createdAt: string; updatedAt: string;
}
export interface StockItemInput {
  materialId: string; quantity: number; minQuantity: number; location?: string;
  addrStreet?: string; addrShelf?: string; addrLevel?: string; addrPosition?: string;
  abcClass?: 'AUTO' | AbcClass; monthlyConsumption?: number; leadTimeDays?: number; serviceLevelZ?: number;
}
export interface StockMovementInput { type: StockMovementType; quantity: number; projectId?: string; notes?: string; }

export interface CyclicCountPlanItem {
  id: string; name: string; unit: string; address: string; className: AbcClass;
  systemQty: number; unitCost: number; lastCountDate: string | null; daysSince: number | null; due: boolean;
}
export interface CyclicCountPlan {
  tolerances: Record<AbcClass, number>;
  frequencies: Record<AbcClass, number>;
  targets: Record<AbcClass, number>;
  buckets: { A: CyclicCountPlanItem[]; B: CyclicCountPlanItem[]; C: CyclicCountPlanItem[]; D: CyclicCountPlanItem[] };
}
export interface CyclicCountItemRow {
  id: string; stockItemId: string; className: string; systemQty: number; countedQty: number;
  diff: number; diffPct: number; adjusted: boolean;
}
export interface CyclicCount {
  id: string; countDate: string; className: string; responsibleId?: string | null; responsible?: Employee | null;
  totalItems: number; correctItems: number; divergentItems: number; accuracyPct: number;
  adjustmentValue: number; adjustedItems: number; pendingItems?: string[] | null; items?: CyclicCountItemRow[]; createdAt: string;
}
export interface CyclicCountInput {
  countDate?: string; className: 'A' | 'B' | 'C' | 'D'; responsibleId?: string;
  items: { stockItemId: string; countedQty: number }[];
}

export interface WorkLogEmployeeEntry { id: string; employeeId: string; employee: Employee; }
export interface WorkLogVehicleEntry { id: string; vehicleId: string; vehicle: Vehicle; driverId?: string; driver?: Employee; }
export interface WorkLogToolEntry { id: string; toolId: string; tool: Tool; }

export interface WorkLog {
  id: string; projectId: string; project: Project; date: string; weather?: string;
  description: string; occurrences?: string; noTravel: boolean;
  employees: WorkLogEmployeeEntry[];
  vehicleUsages: WorkLogVehicleEntry[];
  toolsUsed: WorkLogToolEntry[];
  createdAt: string; updatedAt: string;
}
export interface WorkLogInput {
  projectId: string; date: string; weather?: string;
  description: string; occurrences?: string; noTravel?: boolean;
  employeeIds?: string[];
  vehicles?: { vehicleId: string; driverId?: string }[];
  toolIds?: string[];
}

export interface Supplier {
  id: string; name: string; document?: string; phone?: string; email?: string;
  address?: string; notes?: string; createdAt: string; updatedAt: string;
}
export type SupplierInput = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;

export type PurchaseOrderStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';
export interface PurchaseOrderItem {
  id: string; materialId: string; material: Material; quantity: number; unitCost: number;
}
export interface PurchaseOrder {
  id: string; number: string; supplierId: string; supplier: Supplier;
  status: PurchaseOrderStatus; notes?: string; requestedBy?: string;
  destinationProjectId?: string; destinationProject?: Project;
  items: PurchaseOrderItem[];
  receivedAt?: string; createdAt: string; updatedAt: string;
}
export interface PurchaseOrderInput {
  supplierId: string;
  notes?: string;
  requestedBy?: string;
  destinationProjectId?: string;
  items: { materialId: string; quantity: number; unitCost: number }[];
}

export type SurplusStatus = 'PENDING' | 'RETURNED_TO_STOCK' | 'KEPT_AT_PROJECT' | 'SOLD_AS_SCRAP';
export type SurplusShape = 'CHAPA' | 'BARRA_TUBO' | 'FIO' | 'OUTRO';
export type SurplusDestination = 'ESTOQUE' | 'RETALHO' | 'SUCATA';
export interface MaterialSurplus {
  id: string; projectId: string; project: Project; materialId: string; material: Material;
  quantity: number; shape?: SurplusShape; alloy?: string; length?: number; width?: number;
  unitValue?: number; location?: string; destination?: SurplusDestination;
  status: SurplusStatus; notes?: string; resolvedAt?: string; createdAt: string; updatedAt: string;
}
export interface MaterialSurplusInput {
  projectId: string; materialId: string; quantity: number;
  shape?: SurplusShape; alloy?: string; length?: number; width?: number;
  unitValue?: number; location?: string; destination?: SurplusDestination;
  notes?: string;
}

export interface ScrapSale {
  id: string; surplusId?: string; surplus?: MaterialSurplus; description: string;
  weightKg?: number; pricePerKg?: number; totalValue: number; buyerName?: string;
  saleDate: string; financeEntryId?: string; financeEntry?: FinanceEntry; notes?: string; createdAt: string;
}
export interface ScrapSaleInput {
  surplusId?: string; description: string; weightKg?: number; pricePerKg?: number;
  totalValue: number; buyerName?: string; saleDate?: string; notes?: string;
}

export interface Playbook {
  id: string; code?: string; title: string; category: string;
  objective?: string; executor?: string; requirements?: string; steps: string[];
  acceptanceCriteria?: string; commonErrors?: string; standardTime?: string;
  compositionId?: string; compositionLabel?: string; version: number;
  createdAt: string; updatedAt: string;
}
export interface PlaybookInput {
  code?: string; title: string; category: string;
  objective?: string; executor?: string; requirements?: string; steps: string[];
  acceptanceCriteria?: string; commonErrors?: string; standardTime?: string;
  compositionId?: string; compositionLabel?: string;
}

export interface Checklist {
  id: string; title: string; context: string; items: string[];
  createdAt: string; updatedAt: string;
}
export interface ChecklistInput {
  title: string; context: string; items: string[];
}

export interface LessonLearned {
  id: string; date: string; projectId?: string; projectLabel?: string; category: string;
  whatHappened: string; rootCause?: string; estimatedCost?: number; hoursLost?: number;
  actionTaken: string; responsibleEmployeeId?: string; responsibleLabel?: string;
  becameProcedure: boolean; createdAt: string; updatedAt: string;
}
export interface LessonLearnedInput {
  date: string; projectId?: string; projectLabel?: string; category: string;
  whatHappened: string; rootCause?: string; estimatedCost?: number; hoursLost?: number;
  actionTaken: string; responsibleEmployeeId?: string; responsibleLabel?: string;
  becameProcedure?: boolean;
}

export type QuotationStatus = 'OPEN' | 'CLOSED';
export interface QuotationProposal {
  id: string; quotationItemId: string; supplierId: string; supplier: Supplier;
  unitCost: number; leadTimeDays?: number; isWinner: boolean; notes?: string; createdAt: string;
}
export interface QuotationItem {
  id: string; quotationId: string; materialId: string; material: Material;
  quantity: number; proposals: QuotationProposal[];
}
export interface Quotation {
  id: string; number: string; description?: string;
  projectId?: string; project?: Project; quotedAt: string;
  status: QuotationStatus;
  items: QuotationItem[]; createdAt: string; updatedAt: string;
}
export interface QuotationInput {
  description?: string;
  projectId?: string;
  quotedAt?: string;
  items: {
    materialId: string;
    quantity: number;
    proposals?: { supplierId: string; unitCost: number; leadTimeDays?: number; notes?: string }[];
  }[];
}
export interface QuotationItemInput { materialId: string; quantity: number }
export interface QuotationProposalInput { supplierId: string; unitCost: number; leadTimeDays?: number; notes?: string }
export interface GenerateOrdersResult { orders: PurchaseOrder[]; skippedItems: string[] }

export type OverheadMethod = 'DAY' | 'HOUR' | 'PERCENT';
export interface Settings {
  id: string;
  companyName: string;
  companyDocument?: string;
  companyIe?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  defaultRegime: TaxRegime;
  defaultBdiPct: number;
  defaultLucroPct: number;
  defaultContingenciaPct: number;
  defaultTaxaCapitalPct: number;
  defaultChargesPct: number;
  salarioMinimo: number;
  defaultFuelPrice: number;
  budgetPrefix: string;
  projectPrefix: string;
  marginHealthyPct: number;
  marginWarningPct: number;
  overheadMethod: OverheadMethod;
  overheadFuncCount?: number;
  overheadHoursPerMonth?: number;
  overheadOccupancyPct: number;
  overheadWorkDaysPerMonth?: number;
  overheadAvgDirectCost?: number;
  overheadSimultaneousProjects: number;
  overheadAutoApply: boolean;
  assetOpportunityCostPct: number;
  encargosGrupoA: SocialChargeItem[] | null;
  encargosGrupoB: SocialChargeItem[] | null;
  encargosBeneficios: BenefitItem[] | null;
  encargosFerramental: ToolingItem[] | null;
  encargosHorasProdMes: number;
  discountRatePct: number;
  updatedAt: string;
}
export type SettingsInput = Partial<Omit<Settings, 'id' | 'updatedAt'>>;

export interface MonthlyCashFlowPoint {
  month: string; income: number; expense: number; net: number; cumulative: number;
}
export interface ProjectFinancialAnalysis {
  projectId: string; number: string; name: string; discountRatePct: number;
  monthlyFlow: MonthlyCashFlowPoint[];
  vpl: number;
  tirMensalPct: number | null; tirAnualPct: number | null;
  paybackSimplesMeses: number | null; paybackDescontadoMeses: number | null;
  exposicaoMaxima: number;
  indiceLucratividade: number | null;
  dre: { receita: number; custosDiretos: number; resultadoDireto: number; margemDiretaPct: number | null };
}

export interface ReconciliationBridgeLine {
  label: string; value: number; kind: 'base' | 'sub' | 'add' | 'warn' | 'total';
}
export interface ReconciliationAuditItem {
  level: 'erro' | 'alerta' | 'ok'; title: string; detail: string;
}
export interface Reconciliation {
  period: 'mes' | '3m' | 'ano';
  caixa: number; gerencial: number; diff: number; diffPct: number;
  rateioPct: number;
  bridge: ReconciliationBridgeLine[];
  audit: ReconciliationAuditItem[];
}

export interface SocialChargeItem { nome: string; pct: number; }
export interface BenefitItem { nome: string; valorMes: number; }
export interface ToolingItem { nome: string; qtd: number; preco: number; vidaMeses: number; }
export interface SocialChargesResult {
  pctGrupoA: number; pctGrupoB: number; encargosPct: number;
  beneficiosMes: number; beneficioHora: number;
  ferramentalMes: number; ferramentalHora: number; affected: number;
}

export type FixedExpenseType = 'FIXED' | 'SEMI_VARIABLE';
export interface FixedExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: FixedExpenseType;
  generatesBill: boolean;
  billDay?: number;
  supplierName?: string;
  financeEntryId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export type FixedExpenseInput = Omit<FixedExpense, 'id' | 'financeEntryId' | 'createdAt' | 'updatedAt'>;

export type AssetAbsorptionMode = 'INDIRECT' | 'HOURLY' | 'TOOLING';
export interface Asset {
  id: string;
  name: string;
  category?: string;
  acquisitionValue: number;
  acquisitionDate: string;
  usefulLifeMonths: number;
  residualValue: number;
  absorptionMode: AssetAbsorptionMode;
  productiveHoursPerYear: number;
  annualMaintenance: number;
  operatingCostPerHour: number;
  notes?: string;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  isFullyDepreciated: boolean;
  depreciationContribution: number;
  opportunityCostContribution: number;
  totalMonthlyCost: number;
  poolMonthlyCost: number;
  hourlyMachineCost: number;
  createdAt: string;
  updatedAt: string;
}
export type AssetInput = Omit<
  Asset,
  'id' | 'monthlyDepreciation' | 'accumulatedDepreciation' | 'bookValue' | 'isFullyDepreciated'
  | 'depreciationContribution' | 'opportunityCostContribution' | 'totalMonthlyCost'
  | 'poolMonthlyCost' | 'hourlyMachineCost' | 'createdAt' | 'updatedAt'
>;

export type PriceAdjustmentTarget = 'LABOR_ROLE' | 'MATERIAL' | 'FIXED_EXPENSE';
export interface PriceAdjustment {
  id: string;
  target: PriceAdjustmentTarget;
  percentage: number;
  categoryFilter?: string;
  itemsAffected: number;
  actorEmail?: string;
  createdAt: string;
}
export interface PriceAdjustmentInput {
  target: PriceAdjustmentTarget;
  percentage: number;
  categoryFilter?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}

export type DocumentTargetType = 'VEHICLE' | 'EMPLOYEE' | 'TOOL' | 'COMPANY';
export interface TrackedDocument {
  id: string;
  targetType: DocumentTargetType;
  targetId?: string;
  targetLabel: string;
  title: string;
  documentNumber?: string;
  issueDate?: string;
  expiresAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export type TrackedDocumentInput = Omit<TrackedDocument, 'id' | 'createdAt' | 'updatedAt'>;

export type MaintenanceTargetType = 'VEHICLE' | 'TOOL';
export type MaintenanceIntervalType = 'KM' | 'MONTHS';
export type MaintenanceAlertLevel = 'OK' | 'ATENCAO' | 'VENCIDO';
export interface MaintenancePlan {
  id: string;
  targetType: MaintenanceTargetType;
  targetId: string;
  targetLabel: string;
  name: string;
  intervalType: MaintenanceIntervalType;
  intervalKm?: number;
  intervalMonths?: number;
  alertThresholdKm?: number;
  alertThresholdDays?: number;
  lastServiceDate?: string;
  lastServiceKm?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Campos computados pelo backend a cada leitura (nao persistidos):
  currentKm: number | null;
  nextDueKm: number | null;
  nextDueDate: string | null;
  kmRemaining: number | null;
  daysRemaining: number | null;
  level: MaintenanceAlertLevel;
}
export type MaintenancePlanInput = Omit<
  MaintenancePlan,
  'id' | 'createdAt' | 'updatedAt' | 'currentKm' | 'nextDueKm' | 'nextDueDate' | 'kmRemaining' | 'daysRemaining' | 'level'
>;

export interface CostCompositionMaterial {
  id: string;
  compositionId: string;
  materialId: string;
  material: Material;
  coefficient: number;
}
export interface CostCompositionLabor {
  id: string;
  compositionId: string;
  laborRoleId: string;
  laborRole: LaborRole;
  hoursPerUnit: number;
}
export interface CostCompositionCosts {
  materialCost: number;
  laborCost: number;
  unitCost: number;
  totalHours: number;
}
export interface CostComposition {
  id: string;
  code?: string;
  name: string;
  unit: string;
  description?: string;
  materials: CostCompositionMaterial[];
  labor: CostCompositionLabor[];
  costs: CostCompositionCosts;
  createdAt: string;
  updatedAt: string;
}
export interface CostCompositionInput {
  code?: string;
  name: string;
  unit: string;
  description?: string;
  materials?: { materialId: string; coefficient: number }[];
  labor?: { laborRoleId: string; hoursPerUnit: number }[];
}

export type CnhType = 'A' | 'B' | 'C' | 'D' | 'E';
export interface Employee {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  hourlyRate: number;
  cnhTypes: CnhType[];
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export type EmployeeInput = Omit<Employee, 'id' | 'hourlyRate' | 'createdAt' | 'updatedAt'>;

export interface EppDelivery {
  id: string;
  employeeId: string;
  employee: Employee;
  itemName: string;
  deliveredAt: string;
  signed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface EppInput {
  employeeId: string;
  itemName: string;
  deliveredAt?: string;
  signed?: boolean;
  notes?: string;
}

export interface DdsRecord {
  id: string;
  date: string;
  topic: string;
  participants: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface DdsInput {
  date: string;
  topic: string;
  participants?: string[];
  notes?: string;
}

export interface Training {
  id: string;
  employeeId: string;
  employee: Employee;
  nrType: string;
  completedAt: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface TrainingInput {
  employeeId: string;
  nrType: string;
  completedAt: string;
  expiresAt?: string;
  notes?: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId?: string;
  project?: Project;
  createdAt: string;
  updatedAt: string;
}
export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
export interface CalendarEventInput {
  title: string;
  date: string;
  description?: string;
}

export type FinanceEntryType = 'INCOME' | 'EXPENSE';
export type FinanceEntryStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface FinanceCategory {
  id: string;
  name: string;
  type: FinanceEntryType;
  createdAt: string;
  updatedAt: string;
}
export type FinanceCategoryInput = { name: string; type: FinanceEntryType };

export type FinanceAccountType = 'CAIXA' | 'BANCO';
export interface FinanceAccount {
  id: string;
  name: string;
  type: FinanceAccountType;
  initialBalance: number;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface FinanceAccountInput {
  name: string;
  type?: FinanceAccountType;
  initialBalance?: number;
  isDefault?: boolean;
  active?: boolean;
}

export type RecurrenceFrequency = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface FinanceEntry {
  id: string;
  type: FinanceEntryType;
  description: string;
  categoryId: string;
  category: FinanceCategory;
  amount: number;
  dueDate: string;
  paidAt?: string;
  paidAmount?: number;
  status: FinanceEntryStatus;
  recurrence: RecurrenceFrequency;
  recurrenceOf?: string;
  accountId?: string;
  account?: FinanceAccount;
  isTransfer: boolean;
  projectId?: string;
  project?: Project;
  supplierId?: string;
  supplier?: Supplier;
  clientId?: string;
  client?: Client;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  budgetId?: string;
  budget?: Budget;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface FinanceEntryInput {
  type: FinanceEntryType;
  description: string;
  categoryId: string;
  amount: number;
  dueDate: string;
  recurrence?: RecurrenceFrequency;
  accountId?: string;
  projectId?: string;
  supplierId?: string;
  clientId?: string;
  purchaseOrderId?: string;
  budgetId?: string;
  notes?: string;
  overrideReason?: string;
  markAsFixedExpense?: boolean;
}
export interface PayFinanceEntryInput {
  paidAt?: string;
  paidAmount?: number;
  overrideReason?: string;
}
export interface TransferFinanceEntryInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date?: string;
}

export type ClosurePeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type FinanceClosureStatus = 'OPEN' | 'REVIEWING' | 'CLOSED';
export interface FinanceClosure {
  id: string;
  accountId: string;
  account: FinanceAccount;
  periodType: ClosurePeriodType;
  periodStart: string;
  periodEnd: string;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  expectedBalance: number;
  informedBalance: number | null;
  difference: number | null;
  status: FinanceClosureStatus;
  openedByEmail?: string;
  closedByEmail?: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface CloseFinanceClosureInput {
  informedBalance: number;
  notes?: string;
}
export interface ReopenFinanceClosureInput {
  reason: string;
}

export type ComparisonStatus = 'DENTRO' | 'ATENCAO' | 'POSITIVO';
export interface ComparisonRow {
  planned: number;
  actual: number;
  diff: number;
  executionPct: number | null;
  status: ComparisonStatus;
}
export interface MarginComparison {
  plannedPct: number | null;
  actualPct: number | null;
  diffPp: number | null;
}
export interface PrevistoRealizado {
  projectId: string;
  number: string;
  name: string;
  hasBudget: boolean;
  revenue: ComparisonRow;
  costs: {
    material: ComparisonRow;
    labor: ComparisonRow;
    vehicles: ComparisonRow;
    other: ComparisonRow;
    services: { planned: number };
    rentals: { planned: number };
    total: ComparisonRow;
  };
  margin: MarginComparison;
}
export interface FinanceImportPreview {
  totalRows: number;
  columnCount: number;
  rows: string[][];
}
export interface FinanceImportMapping {
  hasHeaderRow: boolean;
  dateColumnIndex: number;
  descriptionColumnIndex: number;
  amountColumnIndex: number;
  incomeCategoryId: string;
  expenseCategoryId: string;
}
export interface FinanceImportResult {
  imported: number;
  skipped: { row: number; reason: string }[];
}

export interface FinanceAttachment {
  id: string;
  financeEntryId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

export interface FinanceEntryFilters {
  type?: FinanceEntryType;
  status?: FinanceEntryStatus;
  projectId?: string;
  categoryId?: string;
  search?: string;
}

export type ProjectBillingStatus = 'PLANNED' | 'INVOICED' | 'CANCELLED';
export interface ProjectBillingItem {
  id: string;
  projectId: string;
  project: Project;
  description: string;
  amount: number;
  plannedDate: string;
  status: ProjectBillingStatus;
  financeEntryId?: string;
  financeEntry?: FinanceEntry;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export interface ProjectBillingItemInput {
  projectId: string;
  description: string;
  amount: number;
  plannedDate: string;
  notes?: string;
}
export type UpdateProjectBillingItemInput = Omit<Partial<ProjectBillingItemInput>, 'projectId'>;

export interface SearchResults {
  clients: Client[];
  materials: Material[];
  employees: Employee[];
  projects: Project[];
  budgets: Budget[];
  tools: Tool[];
  suppliers: Supplier[];
  vehicles: Vehicle[];
  purchaseOrders: PurchaseOrder[];
  quotations: Quotation[];
  tasks: Task[];
  workSites: WorkSite[];
  financeEntries: FinanceEntry[];
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: (token: string) => request<{ userId: string; email: string; role: string }>('/auth/me', { method: 'GET', token }),
  listUsers: (token: string) => request<ManagedUser[]>('/auth/users', { method: 'GET', token }),
  createUserByAdmin: (token: string, data: CreateUserByAdminInput) =>
    request<ManagedUser>('/auth/users', { method: 'POST', token, body: JSON.stringify(data) }),
  resendConfirmation: (token: string, email: string) =>
    request<{ message: string }>('/auth/resend-confirmation', { method: 'POST', token, body: JSON.stringify({ email }) }),
  confirmAccount: (tokenParam: string, password: string) =>
    request<AuthResponse>('/auth/confirm', { method: 'POST', body: JSON.stringify({ token: tokenParam, password }) }),
  updateUserModules: (token: string, id: string, allowedModules: string[]) =>
    request<ManagedUser>(`/auth/users/${id}/modules`, { method: 'PATCH', token, body: JSON.stringify({ allowedModules }) }),

  listClients: (token: string, search?: string) =>
    request<Client[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  getClient: (token: string, id: string) =>
    request<Client>(`/clients/${id}`, { method: 'GET', token }),
  createClient: (token: string, data: ClientInput) =>
    request<Client>('/clients', { method: 'POST', token, body: JSON.stringify(data) }),
  updateClient: (token: string, id: string, data: Partial<ClientInput>) =>
    request<Client>(`/clients/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteClient: (token: string, id: string) =>
    request<void>(`/clients/${id}`, { method: 'DELETE', token }),

  listClientContacts: (token: string, clientId: string) =>
    request<ClientContact[]>(`/client-contacts?clientId=${encodeURIComponent(clientId)}`, { method: 'GET', token }),
  createClientContact: (token: string, data: ClientContactInput) =>
    request<ClientContact>('/client-contacts', { method: 'POST', token, body: JSON.stringify(data) }),
  updateClientContact: (token: string, id: string, data: Partial<ClientContactInput>) =>
    request<ClientContact>(`/client-contacts/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteClientContact: (token: string, id: string) =>
    request<void>(`/client-contacts/${id}`, { method: 'DELETE', token }),

  listMaterials: (token: string, search?: string) =>
    request<Material[]>(`/materials${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  getMaterial: (token: string, id: string) =>
    request<Material>(`/materials/${id}`, { method: 'GET', token }),
  createMaterial: (token: string, data: MaterialInput) =>
    request<Material>('/materials', { method: 'POST', token, body: JSON.stringify(data) }),
  updateMaterial: (token: string, id: string, data: Partial<MaterialInput>) =>
    request<Material>(`/materials/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteMaterial: (token: string, id: string) =>
    request<void>(`/materials/${id}`, { method: 'DELETE', token }),

  listMaterialQuotes: (token: string, materialId: string) =>
    request<MaterialQuote[]>(`/material-quotes?materialId=${encodeURIComponent(materialId)}`, { method: 'GET', token }),
  createMaterialQuote: (token: string, data: MaterialQuoteInput) =>
    request<MaterialQuote>('/material-quotes', { method: 'POST', token, body: JSON.stringify(data) }),
  updateMaterialQuote: (token: string, id: string, data: Partial<MaterialQuoteInput>) =>
    request<MaterialQuote>(`/material-quotes/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteMaterialQuote: (token: string, id: string) =>
    request<void>(`/material-quotes/${id}`, { method: 'DELETE', token }),
  bulkAdjustMaterialPrices: (token: string, data: { percentage: number; category?: string }) =>
    request<{ adjusted: number }>('/materials/bulk-adjust-price', { method: 'POST', token, body: JSON.stringify(data) }),

  listLaborRoles: (token: string, search?: string) =>
    request<LaborRole[]>(`/labor-roles${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createLaborRole: (token: string, data: LaborRoleInput) =>
    request<LaborRole>('/labor-roles', { method: 'POST', token, body: JSON.stringify(data) }),
  updateLaborRole: (token: string, id: string, data: Partial<LaborRoleInput>) =>
    request<LaborRole>(`/labor-roles/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteLaborRole: (token: string, id: string) =>
    request<void>(`/labor-roles/${id}`, { method: 'DELETE', token }),
  bulkAdjustLaborRolePrices: (token: string, data: { percentage: number }) =>
    request<{ adjusted: number }>('/labor-roles/bulk-adjust-price', { method: 'POST', token, body: JSON.stringify(data) }),

  listThirdPartyServices: (token: string, search?: string) =>
    request<ThirdPartyService[]>(`/third-party-services${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createThirdPartyService: (token: string, data: ThirdPartyServiceInput) =>
    request<ThirdPartyService>('/third-party-services', { method: 'POST', token, body: JSON.stringify(data) }),
  updateThirdPartyService: (token: string, id: string, data: Partial<ThirdPartyServiceInput>) =>
    request<ThirdPartyService>(`/third-party-services/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteThirdPartyService: (token: string, id: string) =>
    request<void>(`/third-party-services/${id}`, { method: 'DELETE', token }),
  bulkAdjustThirdPartyServicePrices: (token: string, data: { percentage: number; category?: string }) =>
    request<{ adjusted: number }>('/third-party-services/bulk-adjust-price', { method: 'POST', token, body: JSON.stringify(data) }),

  listRentalEquipment: (token: string, search?: string) =>
    request<RentalEquipment[]>(`/rental-equipment${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createRentalEquipment: (token: string, data: RentalEquipmentInput) =>
    request<RentalEquipment>('/rental-equipment', { method: 'POST', token, body: JSON.stringify(data) }),
  updateRentalEquipment: (token: string, id: string, data: Partial<RentalEquipmentInput>) =>
    request<RentalEquipment>(`/rental-equipment/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteRentalEquipment: (token: string, id: string) =>
    request<void>(`/rental-equipment/${id}`, { method: 'DELETE', token }),
  bulkAdjustRentalEquipmentPrices: (token: string, data: { percentage: number; category?: string }) =>
    request<{ adjusted: number }>('/rental-equipment/bulk-adjust-price', { method: 'POST', token, body: JSON.stringify(data) }),

  listVehicles: (token: string, search?: string) =>
    request<Vehicle[]>(`/vehicles${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createVehicle: (token: string, data: VehicleInput) =>
    request<Vehicle>('/vehicles', { method: 'POST', token, body: JSON.stringify(data) }),
  updateVehicle: (token: string, id: string, data: Partial<VehicleInput> & { currentKm?: number }) =>
    request<Vehicle>(`/vehicles/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteVehicle: (token: string, id: string) =>
    request<void>(`/vehicles/${id}`, { method: 'DELETE', token }),

  listVehicleTrips: (token: string, vehicleId?: string) =>
    request<VehicleTrip[]>(`/vehicle-trips${vehicleId ? `?vehicleId=${vehicleId}` : ''}`, { method: 'GET', token }),
  createVehicleTrip: (token: string, data: VehicleTripInput) =>
    request<VehicleTrip>('/vehicle-trips', { method: 'POST', token, body: JSON.stringify(data) }),
  closeVehicleTrip: (token: string, id: string, data: CloseVehicleTripInput) =>
    request<VehicleTrip>(`/vehicle-trips/${id}/close`, { method: 'POST', token, body: JSON.stringify(data) }),
  deleteVehicleTrip: (token: string, id: string) =>
    request<void>(`/vehicle-trips/${id}`, { method: 'DELETE', token }),

  listVehicleMaintenances: (token: string, vehicleId?: string) =>
    request<VehicleMaintenance[]>(`/vehicle-maintenances${vehicleId ? `?vehicleId=${vehicleId}` : ''}`, { method: 'GET', token }),
  createVehicleMaintenance: (token: string, data: VehicleMaintenanceInput) =>
    request<VehicleMaintenance>('/vehicle-maintenances', { method: 'POST', token, body: JSON.stringify(data) }),
  updateVehicleMaintenance: (token: string, id: string, data: Partial<VehicleMaintenanceInput>) =>
    request<VehicleMaintenance>(`/vehicle-maintenances/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteVehicleMaintenance: (token: string, id: string) =>
    request<void>(`/vehicle-maintenances/${id}`, { method: 'DELETE', token }),

  listToolMaintenances: (token: string, toolId?: string) =>
    request<ToolMaintenance[]>(`/tool-maintenances${toolId ? `?toolId=${toolId}` : ''}`, { method: 'GET', token }),
  createToolMaintenance: (token: string, data: ToolMaintenanceInput) =>
    request<ToolMaintenance>('/tool-maintenances', { method: 'POST', token, body: JSON.stringify(data) }),
  updateToolMaintenance: (token: string, id: string, data: Partial<ToolMaintenanceInput>) =>
    request<ToolMaintenance>(`/tool-maintenances/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteToolMaintenance: (token: string, id: string) =>
    request<void>(`/tool-maintenances/${id}`, { method: 'DELETE', token }),

  listBudgets: (token: string, search?: string) =>
    request<Budget[]>(`/budgets${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  getBudget: (token: string, id: string) =>
    request<Budget>(`/budgets/${id}`, { method: 'GET', token }),
  createBudget: (token: string, data: BudgetInput) =>
    request<Budget>('/budgets', { method: 'POST', token, body: JSON.stringify(data) }),
  updateBudget: (token: string, id: string, data: Partial<BudgetInput>) =>
    request<Budget>(`/budgets/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteBudget: (token: string, id: string) =>
    request<void>(`/budgets/${id}`, { method: 'DELETE', token }),
  duplicateBudget: (token: string, id: string) =>
    request<Budget>(`/budgets/${id}/duplicate`, { method: 'POST', token }),
  createBudgetVersion: (token: string, id: string) =>
    request<Budget>(`/budgets/${id}/new-version`, { method: 'POST', token }),
  listBudgetVersions: (token: string, id: string) =>
    request<BudgetVersionSummary[]>(`/budgets/${id}/versions`, { method: 'GET', token }),
  getBudgetRoteiro: (token: string, id: string) =>
    request<BudgetRoteiro | null>(`/budgets/${id}/roteiro`, { method: 'GET', token }),
  saveBudgetRoteiro: (token: string, id: string, data: BudgetRoteiroInput) =>
    request<BudgetRoteiro>(`/budgets/${id}/roteiro`, { method: 'PUT', token, body: JSON.stringify(data) }),

  listWorkSites: (token: string, search?: string) =>
    request<WorkSite[]>(`/work-sites${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createWorkSite: (token: string, data: WorkSiteInput) =>
    request<WorkSite>('/work-sites', { method: 'POST', token, body: JSON.stringify(data) }),
  updateWorkSite: (token: string, id: string, data: Partial<WorkSiteInput>) =>
    request<WorkSite>(`/work-sites/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteWorkSite: (token: string, id: string) =>
    request<void>(`/work-sites/${id}`, { method: 'DELETE', token }),

  listProjects: (token: string, search?: string) =>
    request<Project[]>(`/projects${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  getProject: (token: string, id: string) =>
    request<Project>(`/projects/${id}`, { method: 'GET', token }),
  createProject: (token: string, data: ProjectInput) =>
    request<Project>('/projects', { method: 'POST', token, body: JSON.stringify(data) }),
  updateProject: (token: string, id: string, data: Partial<ProjectInput>) =>
    request<Project>(`/projects/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteProject: (token: string, id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE', token }),

  listProjectPhases: (token: string, projectId?: string) =>
    request<ProjectPhase[]>(`/project-phases${projectId ? `?projectId=${projectId}` : ''}`, { method: 'GET', token }),
  createProjectPhase: (token: string, data: ProjectPhaseInput) =>
    request<ProjectPhase>('/project-phases', { method: 'POST', token, body: JSON.stringify(data) }),
  updateProjectPhase: (token: string, id: string, data: Partial<ProjectPhaseInput>) =>
    request<ProjectPhase>(`/project-phases/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteProjectPhase: (token: string, id: string) =>
    request<void>(`/project-phases/${id}`, { method: 'DELETE', token }),

  listTools: (token: string, search?: string) =>
    request<Tool[]>(`/tools${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createTool: (token: string, data: ToolInput) =>
    request<Tool>('/tools', { method: 'POST', token, body: JSON.stringify(data) }),
  updateTool: (token: string, id: string, data: Partial<ToolInput>) =>
    request<Tool>(`/tools/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  moveTool: (token: string, id: string, data: MoveToolInput) =>
    request<Tool>(`/tools/${id}/move`, { method: 'POST', token, body: JSON.stringify(data) }),
  deleteTool: (token: string, id: string) =>
    request<void>(`/tools/${id}`, { method: 'DELETE', token }),
  listToolCharges: (token: string, params?: { employeeId?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.employeeId) qs.set('employeeId', params.employeeId);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return request<ToolCharge[]>(`/tools/charges${q ? `?${q}` : ''}`, { method: 'GET', token });
  },
  chargeTool: (token: string, id: string, data: ChargeToolInput) =>
    request<Tool>(`/tools/${id}/charge`, { method: 'POST', token, body: JSON.stringify(data) }),
  returnToolCharge: (token: string, chargeId: string, data: ReturnToolChargeInput) =>
    request<Tool>(`/tools/charges/${chargeId}/return`, { method: 'POST', token, body: JSON.stringify(data) }),

  listStockItems: (token: string, search?: string) =>
    request<StockItem[]>(`/stock${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createStockItem: (token: string, data: StockItemInput) =>
    request<StockItem>('/stock', { method: 'POST', token, body: JSON.stringify(data) }),
  updateStockItem: (token: string, id: string, data: Partial<StockItemInput>) =>
    request<StockItem>(`/stock/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  addStockMovement: (token: string, id: string, data: StockMovementInput) =>
    request<StockItem>(`/stock/${id}/movements`, { method: 'POST', token, body: JSON.stringify(data) }),
  deleteStockItem: (token: string, id: string) =>
    request<void>(`/stock/${id}`, { method: 'DELETE', token }),

  listCyclicCounts: (token: string) =>
    request<CyclicCount[]>('/cyclic-counts', { method: 'GET', token }),
  getCyclicCountPlan: (token: string) =>
    request<CyclicCountPlan>('/cyclic-counts/plan', { method: 'GET', token }),
  createCyclicCount: (token: string, data: CyclicCountInput) =>
    request<CyclicCount>('/cyclic-counts', { method: 'POST', token, body: JSON.stringify(data) }),

  listWorkLogs: (token: string, projectId?: string) =>
    request<WorkLog[]>(`/work-logs${projectId ? `?projectId=${projectId}` : ''}`, { method: 'GET', token }),
  createWorkLog: (token: string, data: WorkLogInput) =>
    request<WorkLog>('/work-logs', { method: 'POST', token, body: JSON.stringify(data) }),
  updateWorkLog: (token: string, id: string, data: Partial<WorkLogInput>) =>
    request<WorkLog>(`/work-logs/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteWorkLog: (token: string, id: string) =>
    request<void>(`/work-logs/${id}`, { method: 'DELETE', token }),

  listSuppliers: (token: string, search?: string) =>
    request<Supplier[]>(`/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createSupplier: (token: string, data: SupplierInput) =>
    request<Supplier>('/suppliers', { method: 'POST', token, body: JSON.stringify(data) }),
  updateSupplier: (token: string, id: string, data: Partial<SupplierInput>) =>
    request<Supplier>(`/suppliers/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteSupplier: (token: string, id: string) =>
    request<void>(`/suppliers/${id}`, { method: 'DELETE', token }),

  listPurchaseOrders: (token: string, search?: string) =>
    request<PurchaseOrder[]>(`/purchase-orders${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createPurchaseOrder: (token: string, data: PurchaseOrderInput) =>
    request<PurchaseOrder>('/purchase-orders', { method: 'POST', token, body: JSON.stringify(data) }),
  receivePurchaseOrder: (token: string, id: string) =>
    request<PurchaseOrder>(`/purchase-orders/${id}/receive`, { method: 'POST', token }),
  cancelPurchaseOrder: (token: string, id: string) =>
    request<PurchaseOrder>(`/purchase-orders/${id}/cancel`, { method: 'POST', token }),
  deletePurchaseOrder: (token: string, id: string) =>
    request<void>(`/purchase-orders/${id}`, { method: 'DELETE', token }),

  listMaterialSurpluses: (token: string, filters?: { projectId?: string; status?: SurplusStatus }) => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return request<MaterialSurplus[]>(`/material-surpluses${qs ? `?${qs}` : ''}`, { method: 'GET', token });
  },
  createMaterialSurplus: (token: string, data: MaterialSurplusInput) =>
    request<MaterialSurplus>('/material-surpluses', { method: 'POST', token, body: JSON.stringify(data) }),
  returnMaterialSurplusToStock: (token: string, id: string) =>
    request<MaterialSurplus>(`/material-surpluses/${id}/return-to-stock`, { method: 'POST', token }),
  keepMaterialSurplusAtProject: (token: string, id: string) =>
    request<MaterialSurplus>(`/material-surpluses/${id}/keep-at-project`, { method: 'POST', token }),
  deleteMaterialSurplus: (token: string, id: string) =>
    request<void>(`/material-surpluses/${id}`, { method: 'DELETE', token }),

  listScrapSales: (token: string) =>
    request<ScrapSale[]>('/scrap-sales', { method: 'GET', token }),
  createScrapSale: (token: string, data: ScrapSaleInput) =>
    request<ScrapSale>('/scrap-sales', { method: 'POST', token, body: JSON.stringify(data) }),

  listQuotations: (token: string, search?: string) =>
    request<Quotation[]>(`/quotations${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  getQuotation: (token: string, id: string) =>
    request<Quotation>(`/quotations/${id}`, { method: 'GET', token }),
  createQuotation: (token: string, data: QuotationInput) =>
    request<Quotation>('/quotations', { method: 'POST', token, body: JSON.stringify(data) }),
  addQuotationItem: (token: string, quotationId: string, data: QuotationItemInput) =>
    request<Quotation>(`/quotations/${quotationId}/items`, { method: 'POST', token, body: JSON.stringify(data) }),
  removeQuotationItem: (token: string, itemId: string) =>
    request<Quotation>(`/quotations/items/${itemId}`, { method: 'DELETE', token }),
  addQuotationProposal: (token: string, itemId: string, data: QuotationProposalInput) =>
    request<Quotation>(`/quotations/items/${itemId}/proposals`, { method: 'POST', token, body: JSON.stringify(data) }),
  selectQuotationWinner: (token: string, proposalId: string) =>
    request<Quotation>(`/quotations/proposals/${proposalId}/winner`, { method: 'POST', token }),
  generateOrdersFromQuotation: (token: string, quotationId: string) =>
    request<GenerateOrdersResult>(`/quotations/${quotationId}/generate-orders`, { method: 'POST', token }),
  deleteQuotation: (token: string, id: string) =>
    request<void>(`/quotations/${id}`, { method: 'DELETE', token }),

  getSettings: (token: string) =>
    request<Settings>('/settings', { method: 'GET', token }),
  updateSettings: (token: string, data: SettingsInput) =>
    request<Settings>('/settings', { method: 'PATCH', token, body: JSON.stringify(data) }),
  applySocialCharges: (token: string) =>
    request<SocialChargesResult>('/settings/encargos/apply', { method: 'POST', token }),

  getProjectFinancialAnalysis: (token: string, projectId: string, discountRatePct?: number) =>
    request<ProjectFinancialAnalysis>(`/project-financial-analysis/${projectId}${discountRatePct !== undefined ? `?discountRatePct=${discountRatePct}` : ''}`, { method: 'GET', token }),
  listProjectFinancialComparison: (token: string) =>
    request<ProjectFinancialAnalysis[]>('/project-financial-analysis', { method: 'GET', token }),
  getBackupUrl: () => `${API_URL}/settings/backup`,
  restoreBackup: (token: string, confirmationText: string, data: Record<string, unknown>) =>
    request<{ restoredAt: string }>('/settings/restore', { method: 'POST', token, body: JSON.stringify({ confirmationText, data }) }),

  listFixedExpenses: (token: string) =>
    request<FixedExpense[]>('/fixed-expenses', { method: 'GET', token }),
  createFixedExpense: (token: string, data: FixedExpenseInput) =>
    request<FixedExpense>('/fixed-expenses', { method: 'POST', token, body: JSON.stringify(data) }),
  updateFixedExpense: (token: string, id: string, data: Partial<FixedExpenseInput>) =>
    request<FixedExpense>(`/fixed-expenses/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteFixedExpense: (token: string, id: string) =>
    request<void>(`/fixed-expenses/${id}`, { method: 'DELETE', token }),

  listAssets: (token: string) =>
    request<Asset[]>('/assets', { method: 'GET', token }),
  createAsset: (token: string, data: AssetInput) =>
    request<Asset>('/assets', { method: 'POST', token, body: JSON.stringify(data) }),
  updateAsset: (token: string, id: string, data: Partial<AssetInput>) =>
    request<Asset>(`/assets/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteAsset: (token: string, id: string) =>
    request<void>(`/assets/${id}`, { method: 'DELETE', token }),

  listPriceAdjustments: (token: string) =>
    request<PriceAdjustment[]>('/price-adjustments', { method: 'GET', token }),
  createPriceAdjustment: (token: string, data: PriceAdjustmentInput) =>
    request<PriceAdjustment>('/price-adjustments', { method: 'POST', token, body: JSON.stringify(data) }),

  listAuditLogs: (token: string, action?: string) =>
    request<AuditLog[]>(`/audit-logs${action ? `?action=${action}` : ''}`, { method: 'GET', token }),

  listDocuments: (token: string, targetType?: DocumentTargetType) =>
    request<TrackedDocument[]>(`/documents${targetType ? `?targetType=${targetType}` : ''}`, { method: 'GET', token }),
  createDocument: (token: string, data: TrackedDocumentInput) =>
    request<TrackedDocument>('/documents', { method: 'POST', token, body: JSON.stringify(data) }),
  updateDocument: (token: string, id: string, data: Partial<TrackedDocumentInput>) =>
    request<TrackedDocument>(`/documents/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteDocument: (token: string, id: string) =>
    request<void>(`/documents/${id}`, { method: 'DELETE', token }),

  listMaintenancePlans: (token: string, targetType?: MaintenanceTargetType, targetId?: string) => {
    const params = new URLSearchParams();
    if (targetType) params.set('targetType', targetType);
    if (targetId) params.set('targetId', targetId);
    const qs = params.toString();
    return request<MaintenancePlan[]>(`/maintenance-plans${qs ? `?${qs}` : ''}`, { method: 'GET', token });
  },
  createMaintenancePlan: (token: string, data: MaintenancePlanInput) =>
    request<MaintenancePlan>('/maintenance-plans', { method: 'POST', token, body: JSON.stringify(data) }),
  updateMaintenancePlan: (token: string, id: string, data: Partial<MaintenancePlanInput>) =>
    request<MaintenancePlan>(`/maintenance-plans/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  markMaintenancePlanServiced: (token: string, id: string) =>
    request<MaintenancePlan>(`/maintenance-plans/${id}/mark-serviced`, { method: 'POST', token }),
  deleteMaintenancePlan: (token: string, id: string) =>
    request<void>(`/maintenance-plans/${id}`, { method: 'DELETE', token }),

  listCostCompositions: (token: string) =>
    request<CostComposition[]>('/cost-compositions', { method: 'GET', token }),
  getCostComposition: (token: string, id: string) =>
    request<CostComposition>(`/cost-compositions/${id}`, { method: 'GET', token }),
  createCostComposition: (token: string, data: CostCompositionInput) =>
    request<CostComposition>('/cost-compositions', { method: 'POST', token, body: JSON.stringify(data) }),
  updateCostComposition: (token: string, id: string, data: Partial<CostCompositionInput>) =>
    request<CostComposition>(`/cost-compositions/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteCostComposition: (token: string, id: string) =>
    request<void>(`/cost-compositions/${id}`, { method: 'DELETE', token }),

  listEmployees: (token: string, search?: string) =>
    request<Employee[]>(`/employees${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createEmployee: (token: string, data: EmployeeInput) =>
    request<Employee>('/employees', { method: 'POST', token, body: JSON.stringify(data) }),
  updateEmployee: (token: string, id: string, data: Partial<EmployeeInput>) =>
    request<Employee>(`/employees/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteEmployee: (token: string, id: string) =>
    request<void>(`/employees/${id}`, { method: 'DELETE', token }),

  listEpp: (token: string, employeeId?: string) =>
    request<EppDelivery[]>(`/epp${employeeId ? `?employeeId=${employeeId}` : ''}`, { method: 'GET', token }),
  createEpp: (token: string, data: EppInput) =>
    request<EppDelivery>('/epp', { method: 'POST', token, body: JSON.stringify(data) }),
  deleteEpp: (token: string, id: string) =>
    request<void>(`/epp/${id}`, { method: 'DELETE', token }),

  listDds: (token: string) =>
    request<DdsRecord[]>('/dds', { method: 'GET', token }),
  createDds: (token: string, data: DdsInput) =>
    request<DdsRecord>('/dds', { method: 'POST', token, body: JSON.stringify(data) }),
  deleteDds: (token: string, id: string) =>
    request<void>(`/dds/${id}`, { method: 'DELETE', token }),

  listTrainings: (token: string, employeeId?: string) =>
    request<Training[]>(`/trainings${employeeId ? `?employeeId=${employeeId}` : ''}`, { method: 'GET', token }),
  createTraining: (token: string, data: TrainingInput) =>
    request<Training>('/trainings', { method: 'POST', token, body: JSON.stringify(data) }),
  deleteTraining: (token: string, id: string) =>
    request<void>(`/trainings/${id}`, { method: 'DELETE', token }),

  listTasks: (token: string) =>
    request<Task[]>('/tasks', { method: 'GET', token }),
  createTask: (token: string, data: TaskInput) =>
    request<Task>('/tasks', { method: 'POST', token, body: JSON.stringify(data) }),
  updateTask: (token: string, id: string, data: Partial<TaskInput>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteTask: (token: string, id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE', token }),

  listCalendarEvents: (token: string) =>
    request<CalendarEvent[]>('/calendar-events', { method: 'GET', token }),
  createCalendarEvent: (token: string, data: CalendarEventInput) =>
    request<CalendarEvent>('/calendar-events', { method: 'POST', token, body: JSON.stringify(data) }),
  deleteCalendarEvent: (token: string, id: string) =>
    request<void>(`/calendar-events/${id}`, { method: 'DELETE', token }),

  search: (token: string, q: string) =>
    request<SearchResults>(`/search?q=${encodeURIComponent(q)}`, { method: 'GET', token }),

  listFinanceCategories: (token: string, type?: FinanceEntryType) =>
    request<FinanceCategory[]>(`/finance/categories${type ? `?type=${type}` : ''}`, { method: 'GET', token }),
  createFinanceCategory: (token: string, data: FinanceCategoryInput) =>
    request<FinanceCategory>('/finance/categories', { method: 'POST', token, body: JSON.stringify(data) }),
  updateFinanceCategory: (token: string, id: string, data: Partial<FinanceCategoryInput>) =>
    request<FinanceCategory>(`/finance/categories/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteFinanceCategory: (token: string, id: string) =>
    request<void>(`/finance/categories/${id}`, { method: 'DELETE', token }),

  listFinanceEntries: (token: string, filters?: FinanceEntryFilters) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return request<FinanceEntry[]>(`/finance/entries${qs ? `?${qs}` : ''}`, { method: 'GET', token });
  },
  createFinanceEntry: (token: string, data: FinanceEntryInput) =>
    request<FinanceEntry>('/finance/entries', { method: 'POST', token, body: JSON.stringify(data) }),
  updateFinanceEntry: (token: string, id: string, data: Partial<FinanceEntryInput>) =>
    request<FinanceEntry>(`/finance/entries/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  payFinanceEntry: (token: string, id: string, data?: PayFinanceEntryInput) =>
    request<FinanceEntry>(`/finance/entries/${id}/pay`, { method: 'POST', token, body: JSON.stringify(data || {}) }),
  cancelFinanceEntry: (token: string, id: string) =>
    request<FinanceEntry>(`/finance/entries/${id}/cancel`, { method: 'POST', token }),
  deleteFinanceEntry: (token: string, id: string) =>
    request<void>(`/finance/entries/${id}`, { method: 'DELETE', token }),
  transferFinanceEntry: (token: string, data: TransferFinanceEntryInput) =>
    request<{ outEntry: FinanceEntry; inEntry: FinanceEntry }>('/finance/entries/transfer', { method: 'POST', token, body: JSON.stringify(data) }),

  listFinanceAccounts: (token: string) =>
    request<FinanceAccount[]>('/finance-accounts', { method: 'GET', token }),
  createFinanceAccount: (token: string, data: FinanceAccountInput) =>
    request<FinanceAccount>('/finance-accounts', { method: 'POST', token, body: JSON.stringify(data) }),
  updateFinanceAccount: (token: string, id: string, data: Partial<FinanceAccountInput>) =>
    request<FinanceAccount>(`/finance-accounts/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteFinanceAccount: (token: string, id: string) =>
    request<void>(`/finance-accounts/${id}`, { method: 'DELETE', token }),

  getCurrentFinanceClosure: (token: string, accountId: string, periodStart: string, periodType: ClosurePeriodType = 'DAILY') =>
    request<FinanceClosure>(`/finance-closures/current?accountId=${accountId}&periodStart=${periodStart}&periodType=${periodType}`, { method: 'GET', token }),
  listFinanceClosures: (token: string, accountId?: string) =>
    request<FinanceClosure[]>(`/finance-closures${accountId ? `?accountId=${accountId}` : ''}`, { method: 'GET', token }),
  startReviewFinanceClosure: (token: string, id: string) =>
    request<FinanceClosure>(`/finance-closures/${id}/start-review`, { method: 'POST', token }),
  closeFinanceClosure: (token: string, id: string, data: CloseFinanceClosureInput) =>
    request<FinanceClosure>(`/finance-closures/${id}/close`, { method: 'POST', token, body: JSON.stringify(data) }),
  reopenFinanceClosure: (token: string, id: string, data: ReopenFinanceClosureInput) =>
    request<FinanceClosure>(`/finance-closures/${id}/reopen`, { method: 'POST', token, body: JSON.stringify(data) }),

  getPrevistoRealizadoProject: (token: string, projectId: string) =>
    request<PrevistoRealizado>(`/previsto-realizado/projects/${projectId}`, { method: 'GET', token }),
  listPrevistoRealizadoPortfolio: (token: string) =>
    request<PrevistoRealizado[]>('/previsto-realizado/projects', { method: 'GET', token }),

  getReconciliation: (token: string, period: 'mes' | '3m' | 'ano' = 'ano') =>
    request<Reconciliation>(`/reconciliation?period=${period}`, { method: 'GET', token }),

  listFinanceAttachments: (token: string, financeEntryId: string) =>
    request<FinanceAttachment[]>(`/finance/entries/${financeEntryId}/attachments`, { method: 'GET', token }),
  uploadFinanceAttachment: (token: string, financeEntryId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<FinanceAttachment>(`/finance/entries/${financeEntryId}/attachments`, { method: 'POST', token, body: formData });
  },
  deleteFinanceAttachment: (token: string, id: string) =>
    request<void>(`/finance/attachments/${id}`, { method: 'DELETE', token }),

  previewFinanceImport: (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<FinanceImportPreview>('/finance/import/preview', { method: 'POST', token, body: formData });
  },
  importFinanceCsv: (token: string, file: File, mapping: FinanceImportMapping) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    return request<FinanceImportResult>('/finance/import', { method: 'POST', token, body: formData });
  },

  listProjectBillingItems: (token: string, projectId?: string) =>
    request<ProjectBillingItem[]>(`/project-billing${projectId ? `?projectId=${projectId}` : ''}`, { method: 'GET', token }),
  createProjectBillingItem: (token: string, data: ProjectBillingItemInput) =>
    request<ProjectBillingItem>('/project-billing', { method: 'POST', token, body: JSON.stringify(data) }),
  updateProjectBillingItem: (token: string, id: string, data: UpdateProjectBillingItemInput) =>
    request<ProjectBillingItem>(`/project-billing/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  invoiceProjectBillingItem: (token: string, id: string) =>
    request<ProjectBillingItem>(`/project-billing/${id}/invoice`, { method: 'POST', token }),
  cancelProjectBillingItem: (token: string, id: string) =>
    request<ProjectBillingItem>(`/project-billing/${id}/cancel`, { method: 'POST', token }),
  deleteProjectBillingItem: (token: string, id: string) =>
    request<void>(`/project-billing/${id}`, { method: 'DELETE', token }),

  listPlaybooks: (token: string) =>
    request<Playbook[]>('/playbooks', { method: 'GET', token }),
  createPlaybook: (token: string, data: PlaybookInput) =>
    request<Playbook>('/playbooks', { method: 'POST', token, body: JSON.stringify(data) }),
  updatePlaybook: (token: string, id: string, data: Partial<PlaybookInput>) =>
    request<Playbook>(`/playbooks/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deletePlaybook: (token: string, id: string) =>
    request<void>(`/playbooks/${id}`, { method: 'DELETE', token }),

  listChecklists: (token: string) =>
    request<Checklist[]>('/checklists', { method: 'GET', token }),
  createChecklist: (token: string, data: ChecklistInput) =>
    request<Checklist>('/checklists', { method: 'POST', token, body: JSON.stringify(data) }),
  updateChecklist: (token: string, id: string, data: Partial<ChecklistInput>) =>
    request<Checklist>(`/checklists/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteChecklist: (token: string, id: string) =>
    request<void>(`/checklists/${id}`, { method: 'DELETE', token }),

  listLessonsLearned: (token: string) =>
    request<LessonLearned[]>('/lessons-learned', { method: 'GET', token }),
  createLessonLearned: (token: string, data: LessonLearnedInput) =>
    request<LessonLearned>('/lessons-learned', { method: 'POST', token, body: JSON.stringify(data) }),
  updateLessonLearned: (token: string, id: string, data: Partial<LessonLearnedInput>) =>
    request<LessonLearned>(`/lessons-learned/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteLessonLearned: (token: string, id: string) =>
    request<void>(`/lessons-learned/${id}`, { method: 'DELETE', token }),
};