import { Component, ChangeDetectionStrategy, Signal, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AccountsComponent } from '@accounts/pages/accounts/accounts.component';
import { Client } from '@clients/models/client';
import { ClientsApiService } from '@clients/services/clients-api.service';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [AccountsComponent, FormatValuePipe],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly clientsApi = inject(ClientsApiService);

  private readonly clientState = signal<Client | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  failedPhotoClientId: string | null = null;

  readonly clientId: Signal<string | null> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null }
  );

  readonly client: Signal<Client | null> = this.clientState.asReadonly();

  constructor() {
    effect(() => {
      const id = this.clientId();
      if (id) {
        this.loadClient(id);
      }
    });
  }

  shouldShowClientPhoto(client: Client): boolean {
    return !!client.photoUrl && this.failedPhotoClientId !== client.id;
  }

  clientInitials(client: Client): string {
    return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  }

  onClientPhotoError(client: Client): void {
    this.failedPhotoClientId = client.id;
  }

  private async loadClient(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const client = await firstValueFrom(this.clientsApi.getById(id));
      this.clientState.set(client);
    } catch (err) {
      this.clientState.set(null);
      const message = err instanceof Error ? err.message : 'Impossible de charger le client.';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }

}
