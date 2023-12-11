import { Component, ViewEncapsulation, inject, signal } from "@angular/core";
import { ModalService } from "./modal.service";

@Component({
  selector: 'nw-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None
})
export class ModalComponent {
  private readonly _service = inject(ModalService);
  opened = signal(false);

  open(): void {
    this.opened.set(true);
  }

  dismiss(): void {
    this.opened.set(false);
  }
}