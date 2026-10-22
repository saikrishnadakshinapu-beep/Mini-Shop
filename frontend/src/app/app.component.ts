import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CartService } from './core/cart.service';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'store-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" routerLink="/" aria-label="Shift home">
          <span class="brand-mark" aria-hidden="true">s</span>
          <span class="brand-name">shift<span class="brand-period">.</span></span>
        </a>
        <nav class="header-nav" aria-label="Main navigation">
          <span class="nav-caption">Thoughtful everyday tech</span>
          <a class="cart-link" routerLink="/" (click)="cart.togglePanel()"
             [attr.aria-expanded]="cart.panelOpen()" aria-controls="cart-drawer" aria-label="View your cart">
            <span class="cart-link-icon" aria-hidden="true"></span>
            <span>Cart</span>
            <span class="cart-count">{{ cart.itemCount() }}</span>
          </a>
        </nav>
      </div>
    </header>
    @if (toast.current(); as activeToast) {
      <div class="toast-region" aria-live="polite" aria-atomic="true">
        <div class="app-toast" [class]="'app-toast toast-' + activeToast.kind"
             [attr.role]="activeToast.kind === 'error' ? 'alert' : 'status'">
          <span class="toast-icon" aria-hidden="true">
            {{ activeToast.kind === 'success' ? '✓' : activeToast.kind === 'error' ? '!' : 'i' }}
          </span>
          <span class="toast-message">{{ activeToast.message }}</span>
          <button type="button" class="toast-dismiss" (click)="toast.dismiss()" aria-label="Dismiss notification">×</button>
        </div>
      </div>
    }
    <router-outlet />
    <footer class="site-footer">
      <span>shift<span class="brand-period">.</span></span>
      <span>Good tech. Ready when you are.</span>
    </footer>
  `,
})
export class AppComponent {
  readonly cart = inject(CartService);
  readonly toast = inject(ToastService);
}
