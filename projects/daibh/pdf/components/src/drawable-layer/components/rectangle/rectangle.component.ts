import { Component, DestroyRef, ElementRef, Input, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PdfService } from '@daibh/pdf';
import { fromEvent, map, pairwise, switchMap, takeUntil, takeWhile, tap } from "rxjs";
import { IRectangle, IStyle, IViewport } from "../../models/rectangle.model";
import { RectangleEvent } from "../../models/event.model";
const { removeRectangle, rectangleResized, rectangleMoved } = RectangleEvent;

@Component({
  selector: 'ngx-rectangle',
  template: `
    <div class="rectangle-wrapper">
      <span class="rectangle-title">{{details.title}}</span>
      <i class="rectangle-remove">x</i>
      <i class="rectangle-resize"></i>
    </div>
  `,
  host: {
    '[class.rectangle]': 'true',
    '[class.is-hover]': 'isHover()',
    '[class.is-resizing]': 'isResize()',
    '[class.is-moving]': 'isMoving()',
    '[class.is-resizing-left]': 'isLeftSideResizing()',
    '[class.is-resizing-top]': 'isTopSideResizing()',
    '[style.--left.px]': 'viewport.x',
    '[style.--top.px]': 'viewport.y',
    '[style.--width.px]': 'viewport.w',
    '[style.--height.px]': 'viewport.h',
    '[style.borderColor]': 'style.borderColor',
    '[style.borderWidth]': 'style.borderWidth',
    '[style.borderStyle]': 'style.borderStyle',
  },
  styleUrl: './rectangle.component.scss',
  standalone: true,
  imports: []
})
export class RectangleComponent implements OnInit {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _service: PdfService = inject(PdfService);
  private readonly _nativeElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly _ownerDocument = this._nativeElement.ownerDocument;
  private _mainContainer: HTMLDivElement;
  private _viewerContainer: HTMLDivElement;
  private _resizeStartPoint: DOMRect;
  private _resizeStartViewport: IViewport;

  readonly isHover = signal(false);
  readonly isGrab = signal(false);
  readonly isResize = signal(false);
  readonly isMoving = signal(false);
  readonly isLeftSideResizing = signal(false);
  readonly isTopSideResizing = signal(false);

  @Input() details: IRectangle;

  get mainContainer(): HTMLDivElement {
    if (!this._mainContainer) {
      this._mainContainer = this._nativeElement.closest('.viewerContainer') as HTMLDivElement;
    }
    return this._mainContainer;
  }

  get viewerContainer(): HTMLDivElement {
    if (!this._viewerContainer) {
      this._viewerContainer = this._nativeElement.closest('.viewer') as HTMLDivElement;
    }
    return this._viewerContainer;
  }

  get style(): IStyle {
    return this.details?.style || {};
  }

  get viewport(): IViewport {
    return this.details?.viewport || {};
  }

  get scaleFactor(): number {
    return Number(this.viewerContainer.style.getPropertyValue('--scale-factor')) || 1;
  }

  ngOnInit(): void {
    this.registSelfEvent();
  }

  private registSelfEvent(): void {
    // when mouse enter zone, make zone is hoving, otherwise zone is not hoverred
    fromEvent(this._nativeElement, 'mouseenter').pipe(
      takeUntilDestroyed(this._destroyRef),
      tap(() => this.isHover.set(true)),
      switchMap(() => fromEvent(this._ownerDocument, 'mousemove').pipe(
        takeUntil(fromEvent(this._nativeElement, 'mouseleave').pipe(tap(() => this.isHover.set(false))))
      ))
    ).subscribe();

    // when the remove zone icon is clicked, the remove zone event will occurs
    fromEvent(this._nativeElement.querySelector('.rectangle-remove')!, 'click').pipe(
      takeUntilDestroyed(this._destroyRef),
      tap((evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        this._service.dispatch({ name: removeRectangle, details: { rectangle: this.details } });
      })
    ).subscribe();

    /**
     * when mouse down by left button on zone when it is not moving the resize zone event will occurs
     * the resize zone event will complete when mouse up, mouse leave out of document or when main container is scrolled
     */
    fromEvent(this._nativeElement.querySelector('.rectangle-resize')!, 'mousedown').pipe(
      takeUntilDestroyed(this._destroyRef),
      takeWhile(evt => !this.isGrab() && (evt as MouseEvent).button === 0),
      map(evt => evt as MouseEvent),
      tap(evt => this.markAsResizing(evt)),
      switchMap(() => fromEvent(this._ownerDocument, 'mousemove').pipe(
        map(evt => evt as MouseEvent),
        takeUntil(fromEvent(this._ownerDocument, 'mouseup').pipe(tap(() => this.markAsEndResizing()))),
        takeUntil(fromEvent(this._ownerDocument, 'mouseleave').pipe(tap(() => this.markAsEndResizing()))),
        takeUntil(fromEvent(this.mainContainer, 'scroll').pipe(tap(() => this.markAsEndResizing()))),
        tap((curr) => {

          // detect the strategy of resize
          this.detectResizingStrategy(curr);
          // compute coordinates for zone when resizing
          const { nx, ny, nw, nh } = this.computeCoordinatesOnResize(curr);

          // new coordinates will reassign to viewport
          this.viewport.x = nx;
          this.viewport.y = ny;
          this.viewport.w = nw;
          this.viewport.h = nh;
        })
      ))
    ).subscribe();

    /**
     * when mouse down by left button on zone without resize position the move zone event will occurs
     * the move zone event will complete when mouse up, mouse leave out of document or when main container is scrolled
     */
    fromEvent(this._nativeElement, 'mousedown').pipe(
      takeUntilDestroyed(this._destroyRef),
      takeWhile(evt => !this.isResize() && (evt as MouseEvent).button === 0),
      map(evt => evt as MouseEvent),
      tap(evt => this.markAsMoving(evt)),
      switchMap(() => fromEvent(this._ownerDocument, 'mousemove').pipe(
        map(_evt => _evt as MouseEvent),
        takeUntil(fromEvent(this._ownerDocument, 'mouseup').pipe(tap(() => this.markAsEndMoving()))),
        takeUntil(fromEvent(this._ownerDocument, 'mouseleave').pipe(tap(() => this.markAsEndMoving()))),
        takeUntil(fromEvent(this.mainContainer, 'scroll').pipe(tap(() => this.markAsEndMoving()))),
        pairwise(),
        tap(([prev, curr]) => {
          // compute coordinates for new position of zone when mouse moving
          const { nx, ny } = this.computeCoordinatesOnMove(prev, curr);
          // new coordinates will reassign to viewport
          this.viewport.x = nx;
          this.viewport.y = ny;
        })
      ))
    ).subscribe();
  }

  /**
   * compute the vertical coordinates of zone on resize
   * @param curr current mouse position
   * @example {nx: 10, nx: 10, nw: 120, nh: 120} => new x = 10, new y = 10, new w = 120, new h = 120
   */
  private computeCoordinatesOnResize(curr: MouseEvent): { nx: number, ny: number, nw: number, nh: number } {
    const layerContainer = this._nativeElement.parentElement as HTMLElement;

    const { nx, nw } = this.computeHorizontalOnResize(curr, layerContainer);
    const { ny, nh } = this.computeVerticalOnResize(curr, layerContainer);

    return { nx, ny, nw, nh };
  }

  /**
   * compute the horizontal coordinates of zone on resize
   * @param curr current mouse position
   * @param layerContainer the reference of zoneLayer element
   * @example {ny: 10, nh: 120} => new y = 10, new h = 120
   */
  private computeHorizontalOnResize(curr: MouseEvent, layerContainer: HTMLElement): { nx: number, nw: number } {
    const { x, w } = this._resizeStartViewport;
    const pageWidth = this.coorWithoutScale(layerContainer.clientWidth);
    const cx = this.coorWithoutScale(curr.clientX - this._resizeStartPoint.left - this._resizeStartPoint.width);
    if (this.isLeftSideResizing()) {
      let nw = -(w + cx);
      let nx = x - nw;

      if (nx < 0) {
        nw = nw + nx;
        nx = 0;
      }

      return { nx, nw };
    }

    let nx = x;
    let nw = w + cx;

    if (nx + nw > pageWidth) {
      nw = pageWidth - nx;
    }

    return { nx, nw };
  }

  /**
   * compute the vertical coordinates of zone on resize
   * @param curr current mouse position
   * @param layerContainer the reference of zoneLayer element
   * @example {nx: 10, nw: 120} => new x = 10, new w = 120
   */
  private computeVerticalOnResize(curr: MouseEvent, layerContainer: HTMLElement): { ny: number, nh: number } {
    const { y, h } = this._resizeStartViewport;
    const pageHeight = this.coorWithoutScale(layerContainer.clientHeight);
    const cy = this.coorWithoutScale(curr.clientY - this._resizeStartPoint.top - this._resizeStartPoint.height);

    if (this.isTopSideResizing()) {
      let nh = -(h + cy);
      let ny = y - nh;

      if (ny < 0) {
        nh = nh + ny;
        ny = 0;
      }

      return { ny, nh };
    }

    let ny = y;
    let nh = h + cy;

    if (ny + nh > pageHeight) {
      nh = pageHeight - ny;
    }

    return { ny, nh };
  }

  /**
   * compute the coordinates of zone after mouse move
   * @param prev position before mouse move
   * @param curr position current mouse
   * @example // return {nx: 50, ny: 30}
   * @param {nx} nx new coordinates of x
   * @param {ny} ny new coordinates of y
   */
  private computeCoordinatesOnMove(prev: MouseEvent, curr: MouseEvent): { nx: number, ny: number } {
    const parentContainer = this._nativeElement.parentElement as HTMLElement;
    const pageWidth = this.coorWithoutScale(parentContainer.clientWidth);
    const pageHeight = this.coorWithoutScale(parentContainer.clientHeight);
    const { cx, cy } = this.extractChange(prev, curr);

    const { x, y, w, h } = this.viewport;

    // we only need to update x & y of the zone viewport when zone moved. so we declare it with {let} keyword
    let nx = x + cx;
    let ny = y + cy;

    // in case the zone move out left side of page, it should be reset to zero
    if (nx < 0) {
      nx = 0;
    }

    // in case the zone move out right side of page, it should be reset to fit in page
    if (nx + w > pageWidth) {
      nx = pageWidth - w;
    }

    // in case the zone move above top side of page, it should be reset to zero
    if (ny < 0) {
      ny = 0;
    }

    // in case the zone move below bottom side of page, it should be reset to fit in page
    if (ny + h > pageHeight) {
      ny = pageHeight - h;
    }

    return { nx, ny };
  }

  // setup some info of zone to mark it resizing
  private markAsResizing(evt: MouseEvent): void {
    this.isResize.set(true);
    this._resizeStartPoint = this._nativeElement.getBoundingClientRect();
    this._resizeStartViewport = { ...this.viewport };
    evt.preventDefault();
    evt.stopPropagation();
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement && !focusedElement.contains(evt.target as HTMLElement)) {
      focusedElement.blur();
    }
  }

  /**
   * detect the resizing strategy
   * @param curr current mouse position
   * @example on left side of zone before resizing, on top side of zone before resizing
   */
  private detectResizingStrategy = (curr: MouseEvent): void => {
    this.isLeftSideResizing.update(() => curr.clientX < this._resizeStartPoint.left);
    this.isTopSideResizing.update(() => curr.clientY < this._resizeStartPoint.top);
  };

  // mark zone resizing is ended
  private markAsEndResizing(): void {
    this.isResize.set(false);
    this.isLeftSideResizing.set(false);
    this.isTopSideResizing.set(false);
    this._service.dispatch({ name: rectangleResized, details: { rectangle: this.details } });
  }

  // setup some info of zone to mark it resizing
  private markAsMoving(evt: MouseEvent): void {
    this.isGrab.set(true);
    evt.preventDefault();
    evt.stopPropagation();
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement && !focusedElement.contains(evt.target as HTMLElement)) {
      focusedElement.blur();
    }
  }

  // mark zone moving is ended
  private markAsEndMoving(): void {
    this.isGrab.set(false);
    this._service.dispatch({ name: rectangleMoved, details: { rectangle: this.details } });
  }

  /**
   * compute coordinates before scale
   * @param {number} coor coordinates
   * @example //  coor = 40, scale factor = 1.5 => return value = 30 / 1.5 = 20
   */
  private coorWithoutScale = (coor: number): number => coor / this.scaleFactor;
  /**
   * extract the change between before & after postition of mouse to rect reference
   * @param before before position
   * @param after after position
   * @example // return {cx: 5; cy: 5}
   * @param {number} cx the change of x
   * @param {number} cy the change of y
   */
  private extractChange = (before: MouseEvent, after: MouseEvent): { cx: number; cy: number } => ({
    cx: this.coorWithoutScale(after.clientX - before.clientX),
    cy: this.coorWithoutScale(after.clientY - before.clientY)
  });

}