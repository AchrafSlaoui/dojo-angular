import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ClientDetailComponent } from './client-detail.component';
import { MovementsApiService } from '@app/services/movements-api.service';
import { Client } from '@app/models/client';
import { Movement } from '@app/models/movement';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { ClientsApiService } from '@app/services/clients-api.service';

const clientId = 'c42';
const baseMovement: Movement = {
  id: 'm-1',
  date: '2024-01-10',
  type: 'debit',
  amount: 50,
  description: 'Courses',
};

const client: Client = {
  id: clientId,
  firstName: 'Ada',
  lastName: 'Lovelace',
  movements: [baseMovement],
};

class ActivatedRouteStub {
  readonly paramMap = of(convertToParamMap({ id: clientId }));
}

class ClientsApiServiceStub {
  getById = jest.fn(() => of(client));
}

class MovementsApiServiceStub {
  create = jest.fn();
  update = jest.fn();
  remove = jest.fn();
}

class NotificationServiceStub {
  success = jest.fn();
  error = jest.fn();
}

class ConfirmServiceStub {
  confirm = jest.fn().mockResolvedValue(true);
}

describe('ClientDetailComponent', () => {
  let fixture: ComponentFixture<ClientDetailComponent>;
  let component: ClientDetailComponent;
  let movements: MovementsApiServiceStub;
  let notifications: NotificationServiceStub;
  let confirm: ConfirmServiceStub;
  let clientsApi: ClientsApiServiceStub;

  beforeEach(async () => {
    movements = new MovementsApiServiceStub();
    notifications = new NotificationServiceStub();
    confirm = new ConfirmServiceStub();
    clientsApi = new ClientsApiServiceStub();

    await TestBed.configureTestingModule({
      imports: [ClientDetailComponent],
      providers: [
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: MovementsApiService, useValue: movements },
        { provide: ClientsApiService, useValue: clientsApi },
        { provide: NotificationService, useValue: notifications },
        { provide: ConfirmService, useValue: confirm },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('exposes the client identifier provided by the route', () => {
    expect(component.clientId()).toBe(clientId);
  });

  it('skips movement creation when the amount is not positive', async () => {
    component.newMovement.amount = 0;
    await component.addMovement(clientId);
    expect(movements.create).not.toHaveBeenCalled();
  });

  it('creates a movement and resets the form when the use case succeeds', async () => {
    component.newMovement = {
      date: '2024-02-15',
      type: 'credit',
      amount: 120,
      description: 'Prime',
    };
    const payload = component.newMovement;
    const createdMovement: Movement = { ...payload, id: 'm-2' };
    movements.create.mockReturnValue(of(createdMovement));

    await component.addMovement(clientId);

    expect(movements.create).toHaveBeenCalledWith(clientId, payload);
    expect(notifications.success).toHaveBeenCalled();
    expect(component.client()?.movements?.[0]).toEqual(createdMovement);
    expect(component.newMovement.amount).toBe(0);
    expect(component.newMovement.description).toBe('');
  });

  it('updates a movement when updateMovement succeeds', async () => {
    const movementToUpdate: Movement = { ...baseMovement, amount: 75 };
    movements.update.mockReturnValue(of(movementToUpdate));

    await component.updateMovement(clientId, movementToUpdate);

    expect(movements.update).toHaveBeenCalledWith(clientId, movementToUpdate);
    expect(notifications.success).toHaveBeenCalled();
    expect(component.client()?.movements?.find((m) => m.id === baseMovement.id)?.amount).toBe(75);
  });

  it('keeps the movement untouched when the confirmation is rejected', async () => {
    confirm.confirm.mockResolvedValueOnce(false);
    await component.deleteMovement(clientId, baseMovement.id);
    expect(movements.remove).not.toHaveBeenCalled();
  });

  it('deletes the movement and clears editing state when confirmation succeeds', async () => {
    confirm.confirm.mockResolvedValueOnce(true);
    movements.remove.mockReturnValue(of(undefined));
    await component.deleteMovement(clientId, baseMovement.id);

    expect(confirm.confirm).toHaveBeenCalled();
    expect(movements.remove).toHaveBeenCalledWith(clientId, baseMovement.id);
    expect(component.client()?.movements?.find((m) => m.id === baseMovement.id)).toBeUndefined();
    expect(notifications.success).toHaveBeenCalled();
  });

  it('returns the identifier in trackByMovementId', () => {
    const result = component.trackByMovementId(0, baseMovement);
    expect(result).toBe(baseMovement.id);
  });
});
