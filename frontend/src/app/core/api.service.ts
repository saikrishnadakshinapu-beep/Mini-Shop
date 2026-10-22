import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Order, Product } from './models';

interface ProductsResponse {
  products: Array<{ _id: string; name: string; price: number; stock: number }>;
}

interface OrderResponse {
  order: Order;
}

const API_BASE_URL = 'https://mini-shop-wcfx.onrender.com/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getProducts(search = ''): Observable<Product[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('q', search.trim());
    return this.http.get<ProductsResponse>(`${API_BASE_URL}/products`, { params }).pipe(
      map(({ products }) => products.map(({ _id, ...product }) => ({ id: _id, ...product }))),
    );
  }

  createOrder(items: Array<{ productId: string; quantity: number }>): Observable<Order> {
    return this.http.post<OrderResponse>(`${API_BASE_URL}/orders`, { items }).pipe(map(({ order }) => order));
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<OrderResponse>(`${API_BASE_URL}/orders/${encodeURIComponent(id)}`).pipe(map(({ order }) => order));
  }
}
