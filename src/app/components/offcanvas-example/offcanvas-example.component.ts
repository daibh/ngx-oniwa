import { Component, EventEmitter, Input, Output, ViewEncapsulation, inject } from "@angular/core";
import { NW_OFFCANVAS_CONFIG, OffcanvasComponent, OffcanvasPosition, OffcanvasService } from "@daibh/material";

@Component({
  selector: 'storybook-offcanvas-example',
  templateUrl: './offcanvas-example.component.html',
  styleUrl: './offcanvas-example.component.scss',
  standalone: true,
  imports: [
    OffcanvasComponent
  ],
  providers: [
    { provide: NW_OFFCANVAS_CONFIG, useValue: { name: 'offcanvas-example', backdrop: true } }
  ],
  encapsulation: ViewEncapsulation.None
})
export class OffcanvasExampleComponent {
  private readonly _offcanvasService: OffcanvasService = inject(OffcanvasService);
  @Input() title: string = 'Demo offcanvas';
  @Input() position: OffcanvasPosition = 'start';
  @Input() opened: boolean = false;
  @Output() openedChange = new EventEmitter<boolean>();

  open(): void {
    this.opened = true;
    this.openedChange.emit(this.opened);
  }

  openByService(): void {
    this._offcanvasService.nextState('offcanvas-example', true);
  }
}