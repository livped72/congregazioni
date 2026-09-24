export interface User {
  username: string;
}

export interface Congregation {
  id: string;
  name: string;
  city?: string;
  address?: string;
  notes?: string;
  publishersCount?: number;
  averageAge?: number;
  privilegeCounts?: Record<string, number>;
}

export interface Publisher {
  id: string;
  congregation_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  age?: number | null;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  privilege_codes?: string; // Comma separated codes, e.g. "PR" or "A,PR" or "SM-PR"
  group_number?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Privilege {
  id: string;
  code: string;
  label: string;
  color: string;
  is_default?: boolean;
}

export interface Stats {
  totalPersons: number;
  totalCongregations: number;
  averageAge: number;
  privilegeCounts: Record<string, number>;
  congregationStats: {
    id: string;
    name: string;
    city?: string;
    address?: string;
    publishersCount: number;
    averageAge: number;
    privilegeCounts: Record<string, number>;
  }[];
}

export interface DbStatus {
  connectedToNeon: boolean;
  neonUrl: string;
  provider: string;
}
