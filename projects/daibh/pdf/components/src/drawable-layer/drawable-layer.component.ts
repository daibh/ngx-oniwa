import { Component, ElementRef, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { IntenalEvent, PageEvent, PdfService } from '@daibh/pdf';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, tap } from "rxjs";
import { IRectangle } from "./models/rectangle.model";
import { RectangleEvent } from './models/event.model';
import { PDFPageView, PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { isDefined } from "@daibh/cdk/operators";
import { RectangleComponent } from "./components/rectangle/rectangle.component";
import { NgFor } from "@angular/common";

const { pageRendered } = IntenalEvent;
const { addRectangle, removeRectangle, removeRectangles, fetchRectangles, fetchedRectangles } = RectangleEvent;
const { pageChanged } = PageEvent;

@Component({
  selector: 'ngx-drawable-layer',
  templateUrl: './drawable-layer.component.html',
  styleUrl: './drawable-layer.component.scss',
  standalone: true,
  imports: [RectangleComponent, NgFor]
})
export class DrawableLayerComponent implements OnInit, OnDestroy {
  private readonly _service: PdfService = inject(PdfService);
  private readonly _nativeElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly _rectangles: IRectangle[] = [];
  private readonly _events$ = this._service.events$.pipe(takeUntilDestroyed());
  private readonly _observeEvents = [
    pageRendered,
    pageChanged,
    addRectangle,
    removeRectangle,
    removeRectangles,
    fetchRectangles,
    fetchedRectangles
  ];

  id: number;
  pageNumber = signal(1);

  get rectangles(): IRectangle[] {
    return this._rectangles;
  }

  ngOnInit(): void {
    this.id = new Date().getTime();
    this.subscribeEvents();
  }

  private isMatchLayer(page: number): boolean {
    return this.pageNumber() === page;
  }

  private subscribeEvents(): void {
    this._events$.pipe(
      filter(_event => this._observeEvents.some(_obsEvent => _obsEvent === _event.name)),
      tap(({ name, details }) => {
        const { source, error, rectangle, rectangles, page, currentPage, pageNumber } = details;


        const layerPageNumber = isDefined(pageNumber) ? pageNumber as number : this.pageNumber();
        const escapeObserve = (_page: number) => isDefined(_page) && !isNaN(_page) && layerPageNumber !== this.pageNumber();
        const isEscaped = escapeObserve(page as number) || escapeObserve(currentPage as number);

        if (isEscaped) {
          return;
        }

        switch (name) {
          case pageRendered:
            if (isDefined(error) || !isDefined(source)) {
              return;
            }

            this._moveDrawableLayerToPage(pageNumber as number, source as PDFPageView);
            break;
          case pageChanged:
            if (isDefined(error) || !isDefined(source)) {
              return;
            }

            const nextPage = pageNumber as number;
            const pageSource = (source as PDFViewer).getPageView(nextPage - 1) as PDFPageView;
            
            if (!isDefined(pageSource)) {
              return;
            }
            
            this._moveDrawableLayerToPage(nextPage, pageSource);
            break;
          case addRectangle:
            this.addRectangles(rectangle as IRectangle);
            break;

          case removeRectangle:
            this.removeRectangles(rectangle as IRectangle);
            break;

          case removeRectangles:
            this.removeRectangles(rectangles as IRectangle[]);
            break;

          case fetchRectangles:
            this._service.dispatch({ name: fetchedRectangles, details: { rectangles: this.rectangles } })
            break;

          default:
            break;
        }
      })
    ).subscribe();
  }

  private _moveDrawableLayerToPage(pageNumber: number, source: PDFPageView): void {
    const { div: pageContainer, viewport: { rotation, viewBox } } = source
    if (!isDefined(pageContainer)) {
      return;
    }

    const [, , width, height] = viewBox;

    this.pageNumber.set(pageNumber);
    this._nativeElement.style.width = `calc(var(--scale-factor) * ${width}px)`;
    this._nativeElement.style.height = `calc(var(--scale-factor) * ${height}px)`;
    this._nativeElement.setAttribute('data-main-rotation', rotation as unknown as string);
    pageContainer.appendChild(this._nativeElement);
  }

  private addRectangles(data: IRectangle | IRectangle[]): void {
    if (!data) {
      return;
    }

    const rectangles = (Array.isArray(data) ? data : [data]).filter(_rectangle => !_rectangle.page || this.isMatchLayer(_rectangle.page));

    if (!rectangles.length) {
      return;
    }

    this._rectangles.push(...rectangles);
  }

  /**
   * remove rectangles out from list rectangles of layer
   * @param data 
   * @returns 
   */
  private removeRectangles(data: IRectangle | IRectangle[]): void {
    if (!data) {
      return;
    }

    const rectangles = (Array.isArray(data) ? data : [data]).filter(_rectangle => !_rectangle.page || this.isMatchLayer(_rectangle.page));

    if (!rectangles.length) {
      return;
    }

    rectangles.forEach(_rectangle => {
      const index = this.rectangles.indexOf(_rectangle);
      this.rectangles.splice(index, 1);
    });
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy::DrawableLayerComponent');
  }

}