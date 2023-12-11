import { Component, ViewEncapsulation } from "@angular/core";
import { ModalComponent } from "@daibh/material";

@Component({
  selector: 'storybook-modal-example',
  templateUrl: './modal-example.component.html',
  styleUrl: './modal-example.component.scss',
  standalone: true,
  imports: [
    ModalComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class ModalExampleComponent {
  openModal(): void {

  }
}