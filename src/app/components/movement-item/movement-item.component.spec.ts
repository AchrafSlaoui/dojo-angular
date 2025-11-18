import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovementItemComponent } from './movement-item.component';
import { Movement } from '@app/models/movement';

describe('MovementItemComponent', () => {
  let fixture: ComponentFixture<MovementItemComponent>;
  let component: MovementItemComponent;
  const movement: Movement = {
    id: 'm1',
    date: '2024-01-01',
    type: 'credit',
    amount: 150,
    description: 'Salaire',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MovementItemComponent],
    });

    fixture = TestBed.createComponent(MovementItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('movement', movement);
    fixture.detectChanges();
  });

  it('initializes edit mode with an isolated copy of the movement', () => {
    // Given a movement bound to the component
    // When edit mode is activated
    component.startEdit();

    // Then the component holds a cloned editable model
    expect(component.editMode).toBe(true);
    expect(component.editModel).toEqual(movement);
    expect(component.editModel).not.toBe(movement); 
  });

  it('cancels editing and closes the editor', () => {
    // Given the component is in edit mode
    component.startEdit();
    // When the cancel action is triggered
    component.cancel();

    // Then the edit mode flag is reset
    expect(component.editMode).toBe(false);
  });

  it('emits the updated movement on save and exits edit mode', () => {
    // Given edit mode contains pending changes
    component.startEdit();
    component.editModel = { ...component.editModel, amount: 200 };
    const updateSpy = jest.fn();
    component.update.subscribe(updateSpy);

    // When the save handler is executed
    component.save();

    // Then the updated movement is emitted and the editor closes
    expect(updateSpy).toHaveBeenCalledWith({
      id: 'm1',
      date: '2024-01-01',
      type: 'credit',
      amount: 200,
      description: 'Salaire',
    });
    expect(component.editMode).toBe(false);
  });

  it('emits the movement identifier when removal is requested', () => {
    // Given the remove output is observed
    const removeSpy = jest.fn();
    component.remove.subscribe(removeSpy);

    // When the remove action is invoked
    component.onRemove();

    // Then the consumer receives the movement id
    expect(removeSpy).toHaveBeenCalledWith('m1');
  });
});
