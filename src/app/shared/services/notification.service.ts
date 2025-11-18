import { Injectable, signal, Signal } from '@angular/core';

export type NotificationKind = 'success' | 'error' | 'info';

export interface AppNotification {
  kind: NotificationKind;
  message: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notification = signal<AppNotification | null>(null);
  private autoClearHandle: any = null;

  readonly notification: Signal<AppNotification | null> = this._notification.asReadonly();

  success(message: string, durationMs = 3000): void {
    this.push('success', message, durationMs);
  }

  error(message: string, durationMs = 4000): void {
    this.push('error', message, durationMs);
  }

  info(message: string, durationMs = 3000): void {
    this.push('info', message, durationMs);
  }

  clear(): void {
    if (this.autoClearHandle) {
      clearTimeout(this.autoClearHandle);
      this.autoClearHandle = null;
    }
    this._notification.set(null);
  }

  private push(kind: NotificationKind, message: string, durationMs: number): void {
    this._notification.set({ kind, message, timestamp: Date.now() });
    if (this.autoClearHandle) {
      clearTimeout(this.autoClearHandle);
    }
    if (durationMs > 0) {
      this.autoClearHandle = setTimeout(() => this.clear(), durationMs);
    }
  }
}

