export type StaffCategory = {
  id: string;
  name: string;
  display_order: number;
  created_at?: string;
};

export type StaffProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  is_active: boolean;
  description?: string;
  display_order?: number | null;
  created_at?: string;
};
