import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification" *ngIf="notification() as notif" [class.success]="notif.kind === 'success'" [class.error]="notif.kind === 'error'" [class.info]="notif.kind === 'info'">
      <span>{{ notif.message }}</span>
      <button type="button" (click)="dismiss()" aria-label="Fermer">&times;</button>
    </div>
  `,
  styleUrls: ['./notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  private readonly service = inject(NotificationService);
  readonly notification = computed(() => this.service.notification());

  dismiss(): void {
    this.service.clear();
  }
}

