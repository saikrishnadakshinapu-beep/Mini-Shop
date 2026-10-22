export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartEntry {
  productId: string;
  quantity: number;
}

export interface CartLine extends CartEntry {
  product: Product;
  lineTotal: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
}

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}
