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
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
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

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: (token: string) =>
    request<{ userId: string; email: string; role: string }>('/auth/me', {
      method: 'GET',
      token,
    }),

  listClients: (token: string, search?: string) =>
    request<Client[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
      method: 'GET',
      token,
    }),

  createClient: (token: string, data: ClientInput) =>
    request<Client>('/clients', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateClient: (token: string, id: string, data: Partial<ClientInput>) =>
    request<Client>(`/clients/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  deleteClient: (token: string, id: string) =>
    request<void>(`/clients/${id}`, {
      method: 'DELETE',
      token,
    }),

  listMaterials: (token: string, search?: string) =>
    request<Material[]>(`/materials${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
      method: 'GET',
      token,
    }),

  createMaterial: (token: string, data: MaterialInput) =>
    request<Material>('/materials', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateMaterial: (token: string, id: string, data: Partial<MaterialInput>) =>
    request<Material>(`/materials/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  deleteMaterial: (token: string, id: string) =>
    request<void>(`/materials/${id}`, {
      method: 'DELETE',
      token,
    }),
};