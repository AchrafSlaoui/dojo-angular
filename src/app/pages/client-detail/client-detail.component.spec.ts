import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ClientDetailComponent } from './client-detail.component';
import { MovementsApiService } from '@app/services/movements-api.service';
import { Client } from '@app/models/client';
import { Movement } from '@app/models/movement';
import { ClientsStore } from '@app/stores/clients.store';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmService } from '@shared/services/confirm.service';

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

class ClientsStoreStub {
  readonly clientSignal: WritableSignal<Client | null>;
  readonly balanceSignal: WritableSignal<number>;

  addMovementToClient = jest.fn();
  updateMovementInClient = jest.fn();
  removeMovementFromClient = jest.fn();
  selectClientById = jest.fn();
  selectClientBalance = jest.fn();

  constructor(initialClient: Client | null) {
    this.clientSignal = signal(initialClient);
    this.balanceSignal = signal(1000);
    this.selectClientById.mockReturnValue(this.clientSignal);
    this.selectClientBalance.mockReturnValue(this.balanceSignal);
  }
}

class MovementsApiServiceStub {
  readonly clientSignal: WritableSignal<Client | null>;
  readonly balanceSignal: WritableSignal<number>;
  create = jest.fn();
  update = jest.fn();
  remove = jest.fn();
  constructor(initialClient: Client | null) {
    this.clientSignal = signal(initialClient);
    this.balanceSignal = signal(1000);
  }
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
  let store: ClientsStoreStub;
  let movements: MovementsApiServiceStub;
  let notifications: NotificationServiceStub;
  let confirm: ConfirmServiceStub;

  beforeEach(async () => {
    store = new ClientsStoreStub(client);
    movements = new MovementsApiServiceStub(client);
    notifications = new NotificationServiceStub();
    confirm = new ConfirmServiceStub();

    await TestBed.configureTestingModule({
      imports: [ClientDetailComponent],
      providers: [
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: MovementsApiService, useValue: movements },
        { provide: ClientsStore, useValue: store },
        { provide: NotificationService, useValue: notifications },
        { provide: ConfirmService, useValue: confirm },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the client identifier provided by the route', () => {
    // Given the route stub provides a client identifier
    // When the clientId signal is read
    const id = component.clientId();

    // Then the value matches the expected identifier
    expect(id).toBe(clientId);
  });

  it('skips movement creation when the amount is not positive', async () => {
    // Given the form contains a non-positive amount
    component.newMovement.amount = 0;

    // When the addMovement handler is executed
    await component.addMovement(clientId);

    // Then the use case is not invoked
    expect(movements.create).not.toHaveBeenCalled();
  });

  it('creates a movement and resets the form when the use case succeeds', async () => {
    // Given a valid movement form and a successful use case
    component.newMovement = {
      date: '2024-02-15',
      type: 'credit',
      amount: 120,
      description: 'Prime',
    };
    const payload = component.newMovement;
    const createdMovement: Movement = { ...payload, id: 'm-2' };
    movements.create.mockReturnValue(of(createdMovement));

    // When the addMovement handler is triggered
    await component.addMovement(clientId);

    // Then the movement is persisted, stored, and the form clears
    expect(movements.create).toHaveBeenCalledWith(clientId, payload);
    expect(store.addMovementToClient).toHaveBeenCalledWith(clientId, createdMovement);
    expect(notifications.success).toHaveBeenCalled();
    expect(component.newMovement.amount).toBe(0);
    expect(component.newMovement.description).toBe('');
  });

  it('clones the movement when startEdit is invoked', () => {
    // Given a selected movement
    // When edit mode is initiated
    component.startEdit(baseMovement);

    // Then the editing state references a cloned copy
    expect(component.editingId).toBe(baseMovement.id);
    expect(component.editMovement).toEqual(baseMovement);
    expect(component.editMovement).not.toBe(baseMovement);
  });

  it('resets the editing state on cancelEdit', () => {
    // Given an active edit session
    component.startEdit(baseMovement);

    // When cancelEdit is invoked
    component.cancelEdit();

    // Then the editing state is cleared
    expect(component.editingId).toBeNull();
    expect(component.editMovement).toBeNull();
  });

  it('persists edits and clears state when saveEdit succeeds', async () => {
    // Given a pending edit and a successful update use case
    component.editingId = baseMovement.id;
    component.editMovement = { ...baseMovement, amount: 200 };
    const editPayload = component.editMovement;
    const updatedMovement: Movement = { ...editPayload };
    movements.update.mockReturnValue(of(updatedMovement));

    // When saveEdit is called
    await component.saveEdit(clientId);

    // Then the update is applied and the edit session resets
    expect(movements.update).toHaveBeenCalledWith(clientId, editPayload);
    expect(store.updateMovementInClient).toHaveBeenCalledWith(clientId, updatedMovement);
    expect(notifications.success).toHaveBeenCalled();
    expect(component.editingId).toBeNull();
    expect(component.editMovement).toBeNull();
  });

  it('updates a movement and clears editing state when updateMovement succeeds', async () => {
    // Given an edit session and a patched movement
    component.editingId = baseMovement.id;
    const movementToUpdate: Movement = { ...baseMovement, amount: 75 };
    movements.update.mockReturnValue(of(movementToUpdate));

    // When updateMovement is invoked
    await component.updateMovement(clientId, movementToUpdate);

    // Then the movement is updated and edit state resets
    expect(movements.update).toHaveBeenCalledWith(clientId, movementToUpdate);
    expect(store.updateMovementInClient).toHaveBeenCalledWith(clientId, movementToUpdate);
    expect(notifications.success).toHaveBeenCalled();
    expect(component.editingId).toBeNull();
    expect(component.editMovement).toBeNull();
  });

  it('keeps the movement untouched when the confirmation is rejected', async () => {
    // Given the confirmation dialog is declined
    confirm.confirm.mockResolvedValueOnce(false);

    // When deleteMovement is called
    await component.deleteMovement(clientId, baseMovement.id);

    // Then no deletion occurs on the use case or facade
    expect(movements.remove).not.toHaveBeenCalled();
    expect(store.removeMovementFromClient).not.toHaveBeenCalled();
  });

  it('deletes the movement and clears editing state when confirmation succeeds', async () => {
    // Given the dialog is accepted and the use case succeeds
    confirm.confirm.mockResolvedValueOnce(true);
    movements.remove.mockReturnValue(of(undefined));
    component.editingId = baseMovement.id;
    component.editMovement = { ...baseMovement };

    // When deleteMovement is executed
    await component.deleteMovement(clientId, baseMovement.id);

    // Then the movement is removed and edit state resets
    expect(confirm.confirm).toHaveBeenCalled();
    expect(movements.remove).toHaveBeenCalledWith(clientId, baseMovement.id);
    expect(store.removeMovementFromClient).toHaveBeenCalledWith(clientId, baseMovement.id);
    expect(notifications.success).toHaveBeenCalled();
    expect(component.editingId).toBeNull();
    expect(component.editMovement).toBeNull();
  });

  it('returns the identifier in trackByMovementId', () => {
    // Given a movement entity
    // When trackByMovementId is invoked
    const result = component.trackByMovementId(0, baseMovement);

    // Then the movement id is returned
    expect(result).toBe(baseMovement.id);
  });
});
