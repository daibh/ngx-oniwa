import { Component, ElementRef, EventEmitter, Input, NgZone, Output, inject } from "@angular/core";
import { IOffCanvasConfig, OffcanvasPosition } from "./offcanvas.model";
import { OffcanvasService } from "./offcanvas.service";
import { NW_OFFCANVAS_CONFIG, defaultOffCanvasConfig } from "./offcanvas.config";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { tap } from "rxjs";
import { withFallback } from "@daibh/cdk/operators";

@Component({
  selector: 'nw-offcanvas',
  templateUrl: './offcanvas.component.html',
  styleUrl: './offcanvas.component.scss',
  standalone: true,
  imports: []
})
export class OffcanvasComponent {
  private readonly _ngZone: NgZone = inject(NgZone);
  private readonly _offcanvasService = inject(OffcanvasService);
  private readonly _config: Partial<IOffCanvasConfig> = inject(NW_OFFCANVAS_CONFIG, { optional: true }) || defaultOffCanvasConfig;
  private readonly _nativeElement = inject(ElementRef).nativeElement as HTMLElement;

  private _name: string = withFallback(this._config, 'name', defaultOffCanvasConfig);
  private _backdrop: boolean | 'static' = withFallback(this._config, 'backdrop', defaultOffCanvasConfig);

  private _position: OffcanvasPosition = 'start';
  private _title: string = '';
  private _opened: boolean = false;

  @Input() set position(value: OffcanvasPosition) {
    this._position = value;
  }

  @Input() set title(value: string) {
    this._title = value;
  }

  @Input() set opened(value: boolean) {
    this._opened = value;
    this._switchOverflow(value);
  }

  @Output() openedChange = new EventEmitter<boolean>();

  get position(): OffcanvasPosition {
    return this._position || 'start';
  }

  get title(): string {
    return this._title || '';
  }

  get backdrop(): boolean | 'static' {
    return this._backdrop!;
  }

  get opened(): boolean {
    return this._opened;
  }

  get immutable(): boolean {
    return this.backdrop === 'static'
  }

  get hasBackdrop(): boolean {
    return this.immutable || !!this.backdrop;
  }

  get bodyElement(): HTMLElement {
    return this._nativeElement.ownerDocument.body;
  }

  constructor() {
    this._offcanvasService.getObserver(this._name).pipe(
      takeUntilDestroyed(),
      tap(_state => {
        this._ngZone.run(() => {
          this.opened = _state;
          this.openedChange.emit(_state);
        });
      })
    ).subscribe();
  }

  private _switchOverflow(newValue: boolean): void {
    if (!this.immutable) {
      return;
    }

    this.bodyElement.classList.remove('overflow-hidden');

    if (newValue) {
      this.bodyElement.classList.add('overflow-hidden');
    }
  }

  open(): void {
    this._ngZone.runOutsideAngular(() => this._offcanvasService.nextState(this._name, true));
  }

  dismiss(fromBackDrop?: boolean): void {
    if (fromBackDrop && this.immutable) {
      return;
    }

    this._ngZone.runOutsideAngular(() => this._offcanvasService.nextState(this._name, false));
  }
}