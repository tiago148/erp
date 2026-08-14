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

export interface Material {
  id: string; code?: string; name: string; category: string; unit: string;
  unitCost: number; supplier?: string; createdAt: string; updatedAt: string;
}
export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;

export interface LaborRole {
  id: string; name: string; hourlyRate: number; chargesPct: number;
  effectiveHourlyRate: number; createdAt: string; updatedAt: string;
}
export type LaborRoleInput = Omit<LaborRole, 'id' | 'createdAt' | 'updatedAt' | 'effectiveHourlyRate'>;

export interface Vehicle {
  id: string; name: string; plate: string; type: string; fuelType: string;
  avgConsumption: number; initialKm: number; currentKm: number; reviewIntervalKm?: number;
  createdAt: string; updatedAt: string;
}
export type VehicleInput = Omit<Vehicle, 'id' | 'currentKm' | 'createdAt' | 'updatedAt'>;

export interface VehicleTrip {
  id: string; vehicleId: string; vehicle: Vehicle;
  driverId?: string; driver?: Employee; projectId?: string; project?: Project;
  origin: string; destination: string; purpose?: string; distanceKm: number;
  date: string; notes?: string; createdAt: string;
}
export interface VehicleTripInput {
  vehicleId: string; driverId?: string; projectId?: string;
  origin: string; destination: string; purpose?: string; distanceKm: number;
  date?: string; notes?: string;
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

export interface BudgetMaterialItem { id: string; materialId: string; material: Material; quantity: number; unitCost: number; }
export interface BudgetLaborItem { id: string; laborRoleId: string; laborRole: LaborRole; hours: number; hourlyRate: number; }
export interface BudgetTravelItem { id: string; vehicleId: string; vehicle: Vehicle; distanceKm: number; trips: number; fuelPrice: number; }
export interface BudgetOtherItem { id: string; description: string; amount: number; }
export interface BudgetTax { name: string; rate: number; value: number; }
export interface BudgetTotals {
  materialsTotal: number; laborTotal: number; travelTotal: number; otherTotal: number; compositionsTotal: number;
  subtotal: number; indirectCostValue: number; bdiValue: number; base: number; taxes: BudgetTax[]; taxTotal: number;
  discountValue: number; total: number;
  estimatedCost: number; estimatedMargin: number; estimatedMarginPct: number;
}
export interface BudgetCompositionItem {
  id: string; budgetId: string; compositionId: string; composition: CostComposition; quantity: number; unitCost: number;
}
export interface Budget {
  id: string; number: string; version: number; rootId?: string; clientId: string; client: Client; description?: string;
  status: BudgetStatus; regime: TaxRegime; bdiPct: number; discountPct: number; notes?: string;
  employeeId?: string; employee?: Employee; projectDays?: number;
  materialItems: BudgetMaterialItem[]; laborItems: BudgetLaborItem[]; travelItems: BudgetTravelItem[];
  otherItems: BudgetOtherItem[]; compositionItems: BudgetCompositionItem[]; totals: BudgetTotals; createdAt: string; updatedAt: string;
}
export interface BudgetVersionSummary {
  id: string; number: string; version: number; status: BudgetStatus; createdAt: string;
}
export interface BudgetInput {
  clientId: string; description?: string; status?: BudgetStatus; regime?: TaxRegime;
  bdiPct?: number; discountPct?: number; notes?: string; employeeId?: string; projectDays?: number;
  compositionItems?: { compositionId: string; quantity: number }[];
  materialItems?: { materialId: string; quantity: number }[];
  laborItems?: { laborRoleId: string; hours: number }[];
  travelItems?: { vehicleId: string; distanceKm: number; trips: number; fuelPrice: number }[];
  otherItems?: { description: string; amount: number }[];
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
export interface Tool {
  id: string; code?: string; name: string; category: string;
  currentLocation: ToolLocation; currentProjectId?: string; currentProject?: Project;
  notes?: string; movements: ToolMovement[]; createdAt: string; updatedAt: string;
}
export type ToolInput = Omit<Tool, 'id' | 'currentLocation' | 'currentProjectId' | 'currentProject' | 'movements' | 'createdAt' | 'updatedAt'>;
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
export interface StockItem {
  id: string; materialId: string; material: Material; quantity: number; minQuantity: number;
  movements: StockMovement[]; createdAt: string; updatedAt: string;
}
export interface StockItemInput { materialId: string; quantity: number; minQuantity: number; }
export interface StockMovementInput { type: StockMovementType; quantity: number; projectId?: string; notes?: string; }

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

export type SurplusStatus = 'PENDING' | 'RETURNED_TO_STOCK' | 'KEPT_AT_PROJECT';
export interface MaterialSurplus {
  id: string; projectId: string; project: Project; materialId: string; material: Material;
  quantity: number; status: SurplusStatus; notes?: string; resolvedAt?: string; createdAt: string; updatedAt: string;
}
export interface MaterialSurplusInput {
  projectId: string; materialId: string; quantity: number; notes?: string;
}

export type QuotationStatus = 'OPEN' | 'CLOSED';
export interface QuotationProposal {
  id: string; quotationItemId: string; supplierId: string; supplier: Supplier;
  unitCost: number; isWinner: boolean; notes?: string; createdAt: string;
}
export interface QuotationItem {
  id: string; quotationId: string; materialId: string; material: Material;
  quantity: number; proposals: QuotationProposal[];
}
export interface Quotation {
  id: string; number: string; description?: string; status: QuotationStatus;
  items: QuotationItem[]; createdAt: string; updatedAt: string;
}
export interface QuotationInput {
  description?: string;
  items: { materialId: string; quantity: number }[];
}
export interface QuotationItemInput { materialId: string; quantity: number }
export interface QuotationProposalInput { supplierId: string; unitCost: number; notes?: string }
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
  defaultChargesPct: number;
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
  overheadAutoApply: boolean;
  updatedAt: string;
}
export type SettingsInput = Partial<Omit<Settings, 'id' | 'updatedAt'>>;

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
  projectId?: string;
  supplierId?: string;
  clientId?: string;
  purchaseOrderId?: string;
  budgetId?: string;
  notes?: string;
}
export interface PayFinanceEntryInput {
  paidAt?: string;
  paidAmount?: number;
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
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
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
  createClient: (token: string, data: ClientInput) =>
    request<Client>('/clients', { method: 'POST', token, body: JSON.stringify(data) }),
  updateClient: (token: string, id: string, data: Partial<ClientInput>) =>
    request<Client>(`/clients/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteClient: (token: string, id: string) =>
    request<void>(`/clients/${id}`, { method: 'DELETE', token }),

  listMaterials: (token: string, search?: string) =>
    request<Material[]>(`/materials${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createMaterial: (token: string, data: MaterialInput) =>
    request<Material>('/materials', { method: 'POST', token, body: JSON.stringify(data) }),
  updateMaterial: (token: string, id: string, data: Partial<MaterialInput>) =>
    request<Material>(`/materials/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteMaterial: (token: string, id: string) =>
    request<void>(`/materials/${id}`, { method: 'DELETE', token }),
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

  listStockItems: (token: string, search?: string) =>
    request<StockItem[]>(`/stock${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createStockItem: (token: string, data: StockItemInput) =>
    request<StockItem>('/stock', { method: 'POST', token, body: JSON.stringify(data) }),
  updateStockItem: (token: string, id: string, data: { minQuantity?: number }) =>
    request<StockItem>(`/stock/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  addStockMovement: (token: string, id: string, data: StockMovementInput) =>
    request<StockItem>(`/stock/${id}/movements`, { method: 'POST', token, body: JSON.stringify(data) }),
  deleteStockItem: (token: string, id: string) =>
    request<void>(`/stock/${id}`, { method: 'DELETE', token }),

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
};