import { Injectable, signal, Signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ConfirmState extends Required<ConfirmOptions> {
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly defaultState: ConfirmState = {
    title: 'Confirmation',
    message: '',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    visible: false,
  };

  private readonly _state = signal<ConfirmState>(this.defaultState);
  private resolver: ((result: boolean) => void) | null = null;

  readonly state: Signal<ConfirmState> = this._state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    if (this.resolver) {
      // Reject previous pending confirmation to avoid deadlocks
      this.resolver(false);
    }

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
      this._state.set({
        title: options.title ?? this.defaultState.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? this.defaultState.confirmLabel,
        cancelLabel: options.cancelLabel ?? this.defaultState.cancelLabel,
        visible: true,
      });
    });
  }

  accept(): void {
    this.resolve(true);
  }

  cancel(): void {
    this.resolve(false);
  }

  private resolve(result: boolean): void {
    if (this.resolver) {
      this.resolver(result);
      this.resolver = null;
    }
    this._state.set({ ...this.defaultState });
  }
}

