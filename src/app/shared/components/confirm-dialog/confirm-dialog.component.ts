import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ConfirmService } from '@shared/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  template: `
    @if (state().visible) {
      <div class="backdrop" role="presentation"></div>
      <div class="dialog" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId" [attr.aria-describedby]="messageId">
        <h2 [id]="titleId">{{ state().title }}</h2>
        <p [id]="messageId">{{ state().message }}</p>
        <div class="actions">
          <button type="button" class="secondary" (click)="onCancel()">{{ state().cancelLabel }}</button>
          <button type="button" class="primary" (click)="onConfirm()">{{ state().confirmLabel }}</button>
        </div>
      </div>
    }
  `,
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  private readonly service = inject(ConfirmService);
  readonly state = computed(() => this.service.state());

  readonly titleId = `confirm-title`;
  readonly messageId = `confirm-message`;

  onConfirm(): void {
    this.service.accept();
  }

  onCancel(): void {
    this.service.cancel();
  }
}

