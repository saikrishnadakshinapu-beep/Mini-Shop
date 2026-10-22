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

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getProducts(search = ''): Observable<Product[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('q', search.trim());
    return this.http.get<ProductsResponse>('/api/products', { params }).pipe(
      map(({ products }) => products.map(({ _id, ...product }) => ({ id: _id, ...product }))),
    );
  }

  createOrder(items: Array<{ productId: string; quantity: number }>): Observable<Order> {
    return this.http.post<OrderResponse>('/api/orders', { items }).pipe(map(({ order }) => order));
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<OrderResponse>(`/api/orders/${encodeURIComponent(id)}`).pipe(map(({ order }) => order));
  }
}
