import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface AppToast {
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<AppToast | null>(null);
  private timeout?: ReturnType<typeof setTimeout>;

  show(message: string, kind: ToastKind = 'success'): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.current.set({ message, kind });
    this.timeout = setTimeout(() => this.dismiss(), 3600);
  }

  dismiss(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = undefined;
    this.current.set(null);
  }
}
