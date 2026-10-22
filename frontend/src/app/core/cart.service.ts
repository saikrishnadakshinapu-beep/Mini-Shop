import { computed, Injectable, signal } from '@angular/core';
import { CartEntry, CartLine, Product } from './models';

const STORAGE_KEY = 'shift-cart-v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly catalog = signal<Product[]>([]);
  private readonly entries = signal<CartEntry[]>(this.readStorage());
  readonly panelOpen = signal(false);

  readonly lines = computed<CartLine[]>(() => {
    const products = new Map(this.catalog().map((product) => [product.id, product]));
    return this.entries().flatMap((entry) => {
      const product = products.get(entry.productId);
      return product ? [{ ...entry, product, lineTotal: product.price * entry.quantity }] : [];
    });
  });
  readonly itemCount = computed(() => this.entries().reduce((sum, entry) => sum + entry.quantity, 0));
  readonly subtotal = computed(() => this.lines().reduce((sum, line) => sum + line.lineTotal, 0));
  readonly total = computed(() => this.subtotal());

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  setCatalog(products: Product[]): boolean {
    this.catalog.set(products);
    const current = this.entries();
    const next = current.flatMap((entry) => {
      const product = products.find((item) => item.id === entry.productId);
      if (!product || product.stock < 1) return [];
      return [{ ...entry, quantity: Math.min(entry.quantity, product.stock) }];
    });
    const changed = JSON.stringify(current) !== JSON.stringify(next);
    if (changed) this.update(next);
    return changed;
  }

  add(product: Product): boolean {
    if (product.stock < 1) return false;
    const current = this.entries();
    const existing = current.find((entry) => entry.productId === product.id);
    if (existing && existing.quantity >= product.stock) return false;
    const next = existing
      ? current.map((entry) => entry.productId === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
      : [...current, { productId: product.id, quantity: 1 }];
    this.update(next);
    return true;
  }

  changeQuantity(productId: string, delta: number): boolean {
    const product = this.catalog().find((item) => item.id === productId);
    const existing = this.entries().find((entry) => entry.productId === productId);
    if (!product || !existing || !Number.isInteger(delta)) return false;
    const quantity = existing.quantity + delta;
    if (quantity > product.stock || quantity < 0) return false;
    const next = quantity === 0
      ? this.entries().filter((entry) => entry.productId !== productId)
      : this.entries().map((entry) => entry.productId === productId ? { ...entry, quantity } : entry);
    this.update(next);
    return true;
  }

  remove(productId: string): void {
    this.update(this.entries().filter((entry) => entry.productId !== productId));
  }

  clear(): void {
    this.update([]);
  }

  private update(entries: CartEntry[]): void {
    this.entries.set(entries);
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // The current tab cart still works if browser storage is unavailable.
    }
  }

  private readStorage(): CartEntry[] {
    try {
      if (typeof window === 'undefined') return [];
      const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(value)) return [];
      return value.filter((item): item is CartEntry =>
        !!item && typeof item.productId === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0,
      );
    } catch {
      return [];
    }
  }
}
