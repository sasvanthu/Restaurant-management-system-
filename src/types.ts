export type Role = 'CUSTOMER' | 'RESTAURANT_ADMIN' | 'SYSTEM_ADMIN' | 'DELIVERY_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  restaurantId?: string; // For RESTAURANT_ADMIN
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  cuisine: string[];
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  address: string;
  phone: string;
  hours: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
  available?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  restaurant: Restaurant;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  placedAt: Date;
  paymentMethod?: 'UPI' | 'CARD' | 'COD';
  feedback?: {
    rating: number;
    comment: string;
  };
}
