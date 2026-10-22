import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, of, Subject, switchMap, tap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { ApiErrorResponse, Product } from '../../core/models';

@Component({
  selector: 'store-shop-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop-page.component.html',
})
export class ShopPageComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly cart = inject(CartService);
  private readonly searches = new Subject<string>();

  readonly products = signal<Product[]>([]);
  readonly searchTerm = signal('');
  readonly loading = signal(true);
  readonly catalogError = signal('');
  readonly cartNotice = signal('');
  readonly submitting = signal(false);
  readonly orderError = signal('');

  constructor() {
    this.searches.pipe(
      debounceTime(180),
      distinctUntilChanged(),
      tap(() => { this.loading.set(true); this.catalogError.set(''); }),
      switchMap((term) => this.api.getProducts(term).pipe(
        catchError((error: unknown) => {
          this.catalogError.set(this.messageFor(error, 'We could not load products. Check your connection and try again.'));
          return of(null);
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((products) => {
      if (products) {
        this.products.set(products);
        if (this.cart.setCatalog(products)) {
          this.cartNotice.set('Your cart was updated to match current stock.');
        }
      }
      this.loading.set(false);
    });
    this.searches.next('');
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searches.next(value);
  }

  refreshProducts(): void {
    this.searches.next(this.searchTerm());
  }

  addToCart(product: Product): void {
    this.orderError.set('');
    const added = this.cart.add(product);
    this.cartNotice.set('');
    this.toast.show(
      added ? `${product.name} added to your bag.` : product.stock === 0 ? `${product.name} is out of stock.` : `You’ve added all available ${product.name} stock.`,
      added ? 'success' : 'info',
    );
  }

  updateQuantity(product: Product, delta: number): void {
    this.cartNotice.set('');
    const line = this.cart.lines().find((item) => item.productId === product.id);
    if (!line) return;
    const updated = this.cart.changeQuantity(product.id, delta);
    if (!updated) return;
    this.toast.show(delta < 0 && line.quantity === 1
      ? `${product.name} removed from your bag.`
      : `${product.name} quantity updated.`, 'info');
  }

  removeFromCart(product: Product): void {
    this.cart.remove(product.id);
    this.cartNotice.set('');
    this.toast.show(`${product.name} removed from your bag.`, 'info');
  }

  placeOrder(): void {
    if (this.submitting() || this.cart.lines().length === 0) return;
    this.submitting.set(true);
    this.orderError.set('');
    const items = this.cart.lines().map(({ productId, quantity }) => ({ productId, quantity }));
    this.api.createOrder(items).pipe(
      catchError((error: unknown) => {
        const message = this.messageFor(error, 'We could not place your order. Please try again.');
        this.orderError.set(message);
        this.toast.show(message, 'error');
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((order) => {
      this.cart.clear();
      this.toast.show('Your order is confirmed.');
      void this.router.navigate(['/orders', order.orderNumber]);
    }).add(() => this.submitting.set(false));
  }

  productArt(name: string): string {
    const value = name.toLowerCase();
    if (value.includes('mouse')) return 'mouse';
    if (value.includes('keyboard')) return 'keyboard';
    if (value.includes('hub')) return 'hub';
    if (value.includes('speaker')) return 'speaker';
    if (value.includes('stand')) return 'stand';
    return 'default';
  }

  private messageFor(error: unknown, fallback: string): string {
    const response = error instanceof HttpErrorResponse ? error.error as ApiErrorResponse : null;
    return response?.error?.message || fallback;
  }
}
