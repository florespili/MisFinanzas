export type TransactionType = 'gasto' | 'ingreso' | 'ahorro';

export interface Transaction {
  id: string;
  type: TransactionType;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  subcategory?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  created_at: string;
  user_id?: string;
}

export interface Category {
  id: string;
  type: TransactionType;
  name: string;
  icon_or_image_url: string;
  subcategories: string[];
  created_at?: string;
  user_id?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category_name?: string;
  monthly_limit: number;
  created_at?: string;
  user_id?: string;
}

export interface PinConfig {
  pin_hash: string;
  created_at?: string;
  updated_at?: string;
}

export type FilterTab = 'all' | 'gasto' | 'ingreso' | 'ahorro';
export type DetailViewType = null | 'gasto' | 'ingreso' | 'ahorro';
