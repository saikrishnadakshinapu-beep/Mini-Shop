import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApiErrorResponse, Order } from '../../core/models';

@Component({
  selector: 'store-order-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-page.component.html',
})
export class OrderPageComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  private currentId = '';

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.currentId = params.get('id') ?? '';
      this.loadOrder();
    });
  }

  loadOrder(): void {
    if (!this.currentId) {
      this.loading.set(false);
      this.errorMessage.set('We could not find an order ID in this link.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.getOrder(this.currentId).pipe(
      catchError((error: unknown) => {
        const response = error instanceof HttpErrorResponse ? error.error as ApiErrorResponse : null;
        this.errorMessage.set(response?.error?.message || 'We could not load this order. Please try again.');
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((order) => this.order.set(order)).add(() => this.loading.set(false));
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
}
