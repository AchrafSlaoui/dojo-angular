import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Movement } from '@accounts/models/movement';
import { FormatValuePipe } from '@shared/pipes/format-value.pipe';

@Component({
  // Attribute selector so we can attach it to the existing .item div
  selector: '[app-movement-item]',
  standalone: true,
  imports: [FormsModule, FormatValuePipe],
  templateUrl: './movement-item.component.html',
  styleUrl: './movement-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovementItemComponent {
  movement = input.required<Movement>();
  editable = input(false);
  removable = input(false);
  update = output<Movement>();
  remove = output<string>();

  editMode = false;
  editModel!: Movement;

  startEdit(): void {
    if (!this.editable()) return;
    this.editModel = { ...this.movement() };
    this.editMode = true;
  }

  cancel(): void {
    this.editMode = false;
  }

  save(): void {
    this.update.emit(this.editModel);
    this.editMode = false;
  }

  onRemove(): void {
    if (!this.removable()) return;
    this.remove.emit(this.movement().id);
  }
}
