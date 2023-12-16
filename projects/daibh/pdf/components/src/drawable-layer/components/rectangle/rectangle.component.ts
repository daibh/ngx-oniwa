import { Component, DestroyRef, ElementRef, Input, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PdfService } from '@daibh/pdf';
import { filter, fromEvent, map, merge, switchMap, takeUntil, takeWhile, tap } from "rxjs";
import { IRectangle, IStyle, IViewport, ResizePosition, ResizeType } from "../../models/rectangle.model";
import { RectangleEvent } from "../../models/event.model";
import { equals, isDefined } from "@daibh/cdk/operators";
const { removeRectangle, rectangleResized, rectangleMoved, rectangleSelected } = RectangleEvent;

@Component({
  selector: 'ngx-rectangle',
  template: `
    <div class="rectangle-wrapper" [attr.data-title-position]="titlePosition">
      <div class="rectangle-hint">
        <span class="rectangle-title">{{details.title}}</span>
        <i class="rectangle-remove"></i>
      </div>
      <div class="rectangle-resizers">
        <i class="rectangle-resize" data-position="top-left"></i>
        <i class="rectangle-resize" data-position="top-middle"></i>
        <i class="rectangle-resize" data-position="top-right"></i>
        <i class="rectangle-resize" data-position="middle-left"></i>
        <i class="rectangle-resize" data-position="middle-right"></i>
        <i class="rectangle-resize" data-position="bottom-left"></i>
        <i class="rectangle-resize" data-position="bottom-middle"></i>
        <i class="rectangle-resize" data-position="bottom-right"></i>
      </div>
    </div>
  `,
  host: {
    '[class.rectangle]': 'true',
    '[class.is-selected]': 'isSelected',
    '[class.is-hover]': 'isHover()',
    '[class.is-resizing]': 'isResize()',
    '[class.is-moving]': 'isMoving()',
    '[class.is-resizing-left]': 'isLeftSideResizing()',
    '[class.is-resizing-top]': 'isTopSideResizing()',
    '[style.--left.px]': 'x',
    '[style.--top.px]': 'y',
    '[style.--width.px]': 'w',
    '[style.--height.px]': 'h',
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
  private readonly _events$ = this._service.events$.pipe(takeUntilDestroyed());
  private readonly _observeEvents = [
    rectangleSelected
  ];

  private _mainContainer: HTMLDivElement;
  private _viewerContainer: HTMLDivElement;
  private _details: IRectangle;
  private _x: number;
  private _y: number;
  private _w: number;
  private _h: number;

  readonly isHover = signal(false);
  readonly isGrab = signal(false);
  readonly isResize = signal(false);
  readonly isMoving = signal(false);
  readonly isLeftSideResizing = signal(false);
  readonly isTopSideResizing = signal(false);
  readonly pageRotation = signal(0);
  readonly resizeType = signal<ResizeType | undefined>(undefined);
  readonly startGrabScrollTop = signal(0);
  readonly startGrabScrollLeft = signal(0);
  readonly grabTop = signal(0);
  readonly grabLeft = signal(0);

  @Input() set details(value: IRectangle) {
    this._details = value;
    this.updateToDOM();
  }

  @Input() page: number;

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

  get parentElement(): HTMLElement {
    return this._nativeElement.parentElement as HTMLElement;
  }

  get details(): IRectangle {
    return this._details || {};
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

  get pageWidth(): number {
    return this.coorWithoutScale(this.parentElement.clientWidth);
  }

  get pageHeight(): number {
    return this.coorWithoutScale(this.parentElement.clientHeight);
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get w(): number {
    return this._w;
  }

  get h(): number {
    return this._h;
  }

  get isSelected(): boolean {
    return !!this.details.selected;
  }

  get titlePosition(): 'left' | 'top' | 'right' | 'bottom' {
    if (this.x < 200 || this.pageWidth - this.coorWithoutScale(this.w + this.x) < 200) {
      return this.y < 50 || this.pageHeight - this.coorWithoutScale(this.h + this.y) < 50 ? 'right' : 'top';
    }

    return this.y < 50 || this.pageHeight - this.coorWithoutScale(this.h + this.y) ? 'left' : 'bottom';
  }

  ngOnInit(): void {
    this.subscribeEvents();
    this.registSelfEvent();
  }

  private subscribeEvents(): void {
    this._events$.pipe(
      filter(_event => this._observeEvents.some(_obsEvent => _obsEvent === _event.name)),
      tap(({ name, details }) => {
        switch (name) {
          case rectangleSelected:
            const { rectangle } = details as { rectangle: IRectangle };
            if(!isDefined(rectangle)) {
              return;
            }

            if(!equals(rectangle.name, this.details.name, true)) {
              this.details.selected = false;
            }
            
            break;
          default:
            break;
        }
      })
    ).subscribe();
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
    fromEvent(this._nativeElement.querySelectorAll('.rectangle-resize')!, 'pointerdown').pipe(
      takeUntilDestroyed(this._destroyRef),
      takeWhile(evt => !this.isGrab() && (evt as MouseEvent).button === 0),
      map(evt => evt as MouseEvent),
      tap(evt => this.markAsResizing(evt)),
      switchMap(() => fromEvent(this._ownerDocument, 'pointermove', { passive: true, capture: true }).pipe(
        map(evt => evt as MouseEvent),
        takeUntil(fromEvent(this._ownerDocument, 'pointerup').pipe(tap(() => this.markAsEndResizing()))),
        takeUntil(fromEvent(this._ownerDocument, 'pointerleave').pipe(tap(() => this.markAsEndResizing()))),
        takeUntil(fromEvent(this._ownerDocument, 'mouseleave').pipe(tap(() => this.markAsEndResizing()))),
        takeUntil(fromEvent(this.mainContainer, 'scroll').pipe(tap(() => this.markAsEndResizing()))),
        tap((evt) => {

          const { isDiagonal, isHorizontal, getPoint, getOpposite } = ResizePosition[this.resizeType()!];
          const { pageRotation, pageWidth, pageHeight } = this;
          const savedX = this.x / pageWidth;
          const savedY = this.y / pageHeight;
          const savedWidth = this.w / pageWidth;
          const savedHeight = this.h / pageHeight;
          const minWidth = 16 / pageWidth;
          const minHeight = 16 / pageHeight;

          const round = (x: number) => Math.round(x * 10000) / 10000;
          const rotationMatrix = this._getResizeRotationMatrix(0);
          const invRotationMatrix = this._getResizeRotationMatrix(0);
          const transf = (maxtrix: [number, number, number, number], x: number, y: number) => [
            maxtrix[0] * x + maxtrix[2] * y,
            maxtrix[1] * x + maxtrix[3] * y,
          ];

          const point = getPoint(savedWidth, savedHeight);
          const oppositePoint = getOpposite(savedWidth, savedHeight);
          let transfOppositePoint = transf(rotationMatrix, ...oppositePoint);
          const oppositeX = round(savedX + transfOppositePoint[0]);
          const oppositeY = round(savedY + transfOppositePoint[1]);

          let [deltaX, deltaY] = this._rotatePoint(
            evt.movementX,
            evt.movementY,
            pageRotation()
          );

          [deltaX, deltaY] = transf(invRotationMatrix, this.coorWithoutScale(deltaX) / pageWidth, this.coorWithoutScale(deltaY) / pageHeight);

          let [ratioX, ratioY] = this._getRatioOfResize(!!isDiagonal, !!isHorizontal, savedWidth, savedHeight, minWidth, minHeight, oppositePoint[0] - point[0] - deltaX, oppositePoint[1] - point[1] - deltaY);

          const _newWidth = round(savedWidth * ratioX);
          const _newHeight = round(savedHeight * ratioY);
          transfOppositePoint = transf(rotationMatrix, ...getOpposite(_newWidth, _newHeight));
          const _newX = oppositeX - transfOppositePoint[0];
          const _newY = oppositeY - transfOppositePoint[1];

          [this._x, this._y, this._w, this._h] = this._correctCoordinatesOnLayerWhenResizing({
            x: _newX * pageWidth,
            y: _newY * pageHeight,
            w: (_newX < 0 ? savedWidth : _newWidth) * pageWidth, // to avoid reserve horizontal resizing
            h: (_newY < 0 ? savedHeight : _newHeight) * pageHeight // to avoid reserve vertical resizing
          });

        })
      ))
    ).subscribe();

    /**
     * prevent user right click on zone to open context menu
     */
    fromEvent(this._nativeElement, 'contextmenu').pipe(
      takeUntilDestroyed(this._destroyRef),
      map(evt => evt as MouseEvent),
      tap(evt => {
        evt.preventDefault();
        evt.stopPropagation();
      })
    ).subscribe();

    /**
     * when mouse down by left button on zone without resize position the move zone event will occurs
     * the move zone event will complete when mouse up, mouse leave out of document or when main container is scrolled
     * 
     * TODO: moving when the viewport is rotated.
     */
    fromEvent(this._nativeElement, 'pointerdown').pipe(
      takeUntilDestroyed(this._destroyRef),
      map(evt => evt as MouseEvent),
      filter((evt) => !this.isResize() && evt.button === 0),
      tap(evt => this.markAsMoving(evt)),
      switchMap(() => merge( // captune both of mouse moving & mouse scrolling event
        fromEvent(this._ownerDocument, 'pointermove', { passive: true, capture: true }),
        fromEvent(this.mainContainer, 'scroll', { passive: true, capture: true })
      ).pipe(
        map((_evt) => _evt as MouseEvent),
        takeUntil(fromEvent(this._ownerDocument, 'pointerup').pipe(tap(() => this.markAsEndMoving()))),
        takeUntil(fromEvent(this._ownerDocument, 'pointerleave').pipe(tap(() => this.markAsEndMoving()))),
        takeUntil(fromEvent(this._ownerDocument, 'mouseleave').pipe(tap(() => this.markAsEndMoving()))),
        tap(_evt => {

          // in case user scroll when he were grabbing zone. the current movement will be kept from last moving
          if (_evt.type !== 'scroll') {
            this.grabTop.update(_ => _ + _evt.movementY);
            this.grabLeft.update(_ => _ + _evt.movementX);
          }

          const [newX, newY] = this._transformPosition();

          this._x = newX;
          this._y = newY;

          this._nativeElement.scrollIntoView({ block: 'nearest' });
        })
      ))
    ).subscribe();
  }

  private _getRatioOfResize(isDiagonal: boolean, isHorizontal: boolean, orgW: number, orgH: number, minW: number, minH: number, w: number, h: number): [number, number] {

    if (!isDiagonal) {
      return isHorizontal ? [this._getRatioOfResizeBy(orgW, minW, w), 1] : [1, this._getRatioOfResizeBy(orgH, minH, h)];
    }

    return [this._getRatioOfResizeBy(orgW, minW, w), this._getRatioOfResizeBy(orgH, minH, h)];
  }

  private _getRatioOfResizeBy(orgW: number, minW: number, w: number): number {
    return Math.max(minW, Math.min(1, Math.abs(w))) / orgW;
  }

  /**
   * transform location of zone on move
   * @returns [left, top] coordinates of zone after transform
   */
  private _transformPosition(): [number, number] {
    const { viewport, pageRotation, grabLeft, grabTop, startGrabScrollLeft, startGrabScrollTop } = this;
    const { scrollLeft, scrollTop } = this.mainContainer;

    const movementX = this.coorWithoutScale(grabLeft() + scrollLeft - startGrabScrollLeft());
    const movementY = this.coorWithoutScale(grabTop() + scrollTop - startGrabScrollTop());

    const [tx, ty] = this._rotatePoint(movementX, movementY, pageRotation());

    return this._correctCoordinatesOnLayer({ x: viewport.x + tx, y: viewport.y + ty, w: viewport.w, h: viewport.h });
  }

  private _getResizeRotationMatrix(rotation: number): [number, number, number, number] {
    const { pageWidth, pageHeight } = this;
    switch (rotation) {
      case 90:
        return [0, -pageWidth / pageHeight, pageHeight / pageWidth, 0];
      case 180:
        return [-1, 0, 0, -1];
      case 270:
        return [0, pageWidth / pageHeight, -pageHeight / pageWidth, 0];
      default:
        return [1, 0, 0, 1];
    }
  }

  /**
   * rotate the [left, top] of zone when the viewport of page is set rotation
   * @param x 
   * @param y 
   * @param angle 
   * @returns 
   */
  private _rotatePoint(x: number, y: number, angle: number): [number, number] {
    switch (angle) {
      case 90:
        return [y, -x];
      case 180:
        return [-x, -y];
      case 270:
        return [-y, x];
      default:
        return [x, y];
    }
  }

  /**
   * set coordinates of zone base on viewport of zone
   */
  private updateToDOM(): void {
    const { x, y, w, h } = this.viewport;
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
  }

  /**
   * fallback the coordinates of zone into viewport of zone
   */
  private syncToZone(): void {
    this.viewport.x = this.x;
    this.viewport.y = this.y;
    this.viewport.w = this.w;
    this.viewport.h = this.h;
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

    return { nx: 0, nw: 0 };
  }

  /**
   * compute the vertical coordinates of zone on resize
   * @param curr current mouse position
   * @param layerContainer the reference of zoneLayer element
   * @example {nx: 10, nw: 120} => new x = 10, new w = 120
   */
  private computeVerticalOnResize(curr: MouseEvent, layerContainer: HTMLElement): { ny: number, nh: number } {

    return { ny: 0, nh: 0 };
  }

  private _correctCoordinatesOnLayerWhenResizing(viewport: IViewport): [number, number, number, number] {
    const { pageRotation, pageWidth, pageHeight } = this;
    let { x, y, w, h } = viewport;

    switch (pageRotation()) {
      case 0:
        x = Math.max(0, x);
        y = Math.max(0, y);
        w = Math.min(w, pageWidth - x);
        h = Math.min(h, pageHeight - y);
        break;
      case 90:
        x = Math.max(0, x);
        y = Math.min(pageHeight, y);
        w = Math.min(w, pageWidth - x);
        h = Math.min(h, pageHeight - y);
        break;
      case 180:
        x = Math.min(pageWidth, x);
        y = Math.min(pageHeight, y);
        w = Math.min(w, pageWidth - x);
        h = Math.min(h, pageHeight - y);
        break;
      case 270:
        x = Math.min(pageWidth, x);
        y = Math.max(0, y);
        w = Math.min(w, pageWidth - x);
        h = Math.min(h, pageHeight - y);
        break;
    }

    return [x, y, w, h];
  }

  /**
   * auto correct the coordinates of zone to fit within layer
   * @param viewport 
   * @returns 
   */
  private _correctCoordinatesOnLayer(viewport: IViewport): [number, number] {
    const { pageRotation, pageWidth, pageHeight } = this;
    let { x, y, w, h } = viewport;

    switch (pageRotation()) {
      case 0:
        x = Math.max(0, Math.min(pageWidth - w, x));
        y = Math.max(0, Math.min(pageHeight - h, y));
        break;
      case 90:
        x = Math.max(0, Math.min(pageWidth - h, x));
        y = Math.min(pageHeight, Math.max(w, y));
        break;
      case 180:
        x = Math.min(pageWidth, Math.max(w, x));
        y = Math.min(pageHeight, Math.max(h, y));
        break;
      case 270:
        x = Math.min(pageWidth, Math.max(h, x));
        y = Math.max(0, Math.min(pageHeight - w, y));
        break;
    }

    return [x, y];
  }

  // setup some info of zone to mark it resizing
  private markAsResizing(evt: MouseEvent): void {
    this.isResize.update(() => {
      this.resizeType.set((evt.target as HTMLElement).dataset['position'] as ResizeType);
      return true;
    });

    this.details.selected = true;
    this._service.dispatch({ name: rectangleSelected, details: { rectangle: this.details, page: this.page } });

    evt.preventDefault();
    evt.stopPropagation();
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement && !focusedElement.contains(evt.target as HTMLElement)) {
      focusedElement.blur();
    }
  }

  // mark zone resizing is ended
  private markAsEndResizing(): void {
    this.isResize.update(() => {
      this.resizeType.set(undefined);
      return false;
    });

    // sync coordinates of zone on the layer to the zone viewport
    this.syncToZone();
    this._service.dispatch({ name: rectangleResized, details: { rectangle: this.details } });
  }

  // setup some info of zone to mark it resizing
  private markAsMoving(evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();

    this.details.selected = true;
    this.isGrab.set(true);
    this.startGrabScrollTop.set(this.mainContainer.scrollTop);
    this.startGrabScrollLeft.set(this.mainContainer.scrollLeft);
    this.grabTop.set(0);
    this.grabLeft.set(0);

    this._service.dispatch({ name: rectangleSelected, details: { rectangle: this.details, page: this.page } });

    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement && !focusedElement.contains(evt.target as HTMLElement)) {
      focusedElement.blur();
    }
  }

  // mark zone moving is ended
  private markAsEndMoving(): void {
    this.isGrab.set(false);
    this.startGrabScrollTop.set(this.mainContainer.scrollTop);
    this.startGrabScrollLeft.set(this.mainContainer.scrollLeft);

    // sync coordinates of zone on the layer to the zone viewport
    this.syncToZone();
    // dispatch zone have been finished moving
    this._service.dispatch({ name: rectangleMoved, details: { rectangle: this.details, page: this.page } });
  }

  /**
   * compute coordinates before scale
   * @param {number} coor coordinates
   * @example //  coor = 40, scale factor = 1.5 => return value = 30 / 1.5 = 20
   */
  private coorWithoutScale = (coor: number): number => coor / this.scaleFactor;

  ngOnDestroy(): void {
    console.log('ngOnDestroy:ZoneComponent', this.details.name);
  }

}