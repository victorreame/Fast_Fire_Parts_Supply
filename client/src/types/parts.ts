export interface Parts {
  id: number;
  item_code: string;
  pipe_size: string;
  description: string;
  type: string;
  category?: string;
  manufacturer?: string;
  supplier_code?: string;
  price_t1: number;
  price_t2: number;
  price_t3: number;
  cost_price?: number;
  in_stock?: number;
  min_stock?: number;
  is_popular?: boolean;
  image?: string;
  last_ordered?: string;
  created_at?: string;
  updated_at?: string;
}