import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Client } from '@app/models/client';
import { ClientUpdate } from '@clients/types/client.types';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';

@Component({
  selector: 'app-client-card',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatValuePipe],
  templateUrl: './client-card.component.html',
  styleUrl: './client-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientCardComponent {
  private readonly router = inject(Router, { optional: true });

  client = input.required<Client>();
  editable = input(false);
  deleteRequested = output<Client>();
  saveRequested = output<ClientUpdate>();
  editMode = false;
  editModel: ClientUpdate | null = null;

  get cardHref(): string {
    const current = this.client();
    return `/clients/${current.id}`;
  }

  suppressNavigation(event: Event) {
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();
  }

  onCardClick(event: Event): void {
    if (this.editMode) {
      event.preventDefault();
      return;
    }

    if (this.router) {
      event.preventDefault();
      this.router.navigate(['/clients', this.client().id]);
    }
  }

  onDelete(): void {
    this.deleteRequested.emit(this.client());
  }

  startEdit(event?: Event) {
    if (event) this.suppressNavigation(event);
    if (!this.editable()) return;
    const c = this.client();
    this.editModel = { id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, address: c.address };
    this.editMode = true;
  }

  cancelEdit(event?: Event) {
    if (event) this.suppressNavigation(event);
    this.editMode = false;
    this.editModel = null;
  }

  saveEdit(event?: Event) {
    if (event) this.suppressNavigation(event);
    if (!this.editModel) return;
    const firstName = this.editModel.firstName?.trim();
    const lastName = this.editModel.lastName?.trim();
    if (!firstName || !lastName) { this.cancelEdit(); return; }
    const { id, email, phone, address } = this.editModel;
    this.saveRequested.emit({ id, firstName, lastName, email, phone, address });
    this.cancelEdit();
  }
}
