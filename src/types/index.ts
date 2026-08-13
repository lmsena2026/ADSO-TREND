export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  style_tags: string[];
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  is_new: boolean;
  is_trending: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'cod_pending' | 'cod_received';
  total: number;
  shipping_address: {
    full_name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  payment_method: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface SizeGuide {
  id: string;
  size_label: string;
  category: string;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  length_cm: number | null;
  shoulder_cm: number | null;
  sleeve_cm: number | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
}

export interface Outfit {
  id: string;
  name: string;
  description: string | null;
  style: string;
  product_ids: string[];
  image_url: string | null;
  created_at: string;
  products?: Product[];
}

export type StyleType = 'urbano' | 'casual' | 'elegante' | 'deportivo';
