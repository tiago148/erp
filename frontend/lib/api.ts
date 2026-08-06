const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
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
  user: { id: string; name: string; email: string; role: string };
}

export interface Client {
  id: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

export interface Material {
  id: string;
  code?: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}
export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;

export interface LaborRole {
  id: string;
  name: string;
  hourlyRate: number;
  chargesPct: number;
  effectiveHourlyRate: number;
  createdAt: string;
  updatedAt: string;
}
export type LaborRoleInput = Omit<LaborRole, 'id' | 'createdAt' | 'updatedAt' | 'effectiveHourlyRate'>;

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  fuelType: string;
  avgConsumption: number;
  createdAt: string;
  updatedAt: string;
}
export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

export type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'NEGOTIATING';
export type TaxRegime = 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI';

export interface BudgetMaterialItem { id: string; materialId: string; material: Material; quantity: number; unitCost: number; }
export interface BudgetLaborItem { id: string; laborRoleId: string; laborRole: LaborRole; hours: number; hourlyRate: number; }
export interface BudgetTravelItem { id: string; vehicleId: string; vehicle: Vehicle; distanceKm: number; trips: number; fuelPrice: number; }
export interface BudgetOtherItem { id: string; description: string; amount: number; }
export interface BudgetTax { name: string; rate: number; value: number; }
export interface BudgetTotals {
  materialsTotal: number; laborTotal: number; travelTotal: number; otherTotal: number;
  subtotal: number; bdiValue: number; base: number; taxes: BudgetTax[]; taxTotal: number;
  discountValue: number; total: number;
}
export interface Budget {
  id: string; number: string; clientId: string; client: Client; description?: string;
  status: BudgetStatus; regime: TaxRegime; bdiPct: number; discountPct: number; notes?: string;
  materialItems: BudgetMaterialItem[]; laborItems: BudgetLaborItem[]; travelItems: BudgetTravelItem[];
  otherItems: BudgetOtherItem[]; totals: BudgetTotals; createdAt: string; updatedAt: string;
}
export interface BudgetInput {
  clientId: string; description?: string; status?: BudgetStatus; regime?: TaxRegime;
  bdiPct?: number; discountPct?: number; notes?: string;
  materialItems?: { materialId: string; quantity: number }[];
  laborItems?: { laborRoleId: string; hours: number }[];
  travelItems?: { vehicleId: string; distanceKm: number; trips: number; fuelPrice: number }[];
  otherItems?: { description: string; amount: number }[];
}

export interface WorkSite {
  id: string;
  name: string;
  clientId: string;
  client: Client;
  address: string;
  city?: string;
  state?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
export type WorkSiteInput = Omit<WorkSite, 'id' | 'client' | 'createdAt' | 'updatedAt'>;

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me: (token: string) => request<{ userId: string; email: string; role: string }>('/auth/me', { method: 'GET', token }),

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

  listLaborRoles: (token: string, search?: string) =>
    request<LaborRole[]>(`/labor-roles${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createLaborRole: (token: string, data: LaborRoleInput) =>
    request<LaborRole>('/labor-roles', { method: 'POST', token, body: JSON.stringify(data) }),
  updateLaborRole: (token: string, id: string, data: Partial<LaborRoleInput>) =>
    request<LaborRole>(`/labor-roles/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteLaborRole: (token: string, id: string) =>
    request<void>(`/labor-roles/${id}`, { method: 'DELETE', token }),

  listVehicles: (token: string, search?: string) =>
    request<Vehicle[]>(`/vehicles${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createVehicle: (token: string, data: VehicleInput) =>
    request<Vehicle>('/vehicles', { method: 'POST', token, body: JSON.stringify(data) }),
  updateVehicle: (token: string, id: string, data: Partial<VehicleInput>) =>
    request<Vehicle>(`/vehicles/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteVehicle: (token: string, id: string) =>
    request<void>(`/vehicles/${id}`, { method: 'DELETE', token }),

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

  listWorkSites: (token: string, search?: string) =>
    request<WorkSite[]>(`/work-sites${search ? `?search=${encodeURIComponent(search)}` : ''}`, { method: 'GET', token }),
  createWorkSite: (token: string, data: WorkSiteInput) =>
    request<WorkSite>('/work-sites', { method: 'POST', token, body: JSON.stringify(data) }),
  updateWorkSite: (token: string, id: string, data: Partial<WorkSiteInput>) =>
    request<WorkSite>(`/work-sites/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteWorkSite: (token: string, id: string) =>
    request<void>(`/work-sites/${id}`, { method: 'DELETE', token }),
};