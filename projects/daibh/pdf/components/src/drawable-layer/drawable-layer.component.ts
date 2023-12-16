import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { IntenalEvent, PdfService } from '@daibh/pdf';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { tap } from "rxjs";
import { IRectangle } from "./models/rectangle.model";
import { RectangleEvent } from './models/event.model';
import { PDFPageView } from "pdfjs-dist/web/pdf_viewer";
import { isDefined } from "@daibh/cdk/operators";
import { RectangleComponent } from "./components/rectangle/rectangle.component";
import { NgFor } from "@angular/common";

const { addRectangle, removeRectangle, removeRectangles, fetchRectangles, fetchedRectangles } = RectangleEvent;

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

  id: number;
  page: number;

  get rectangles(): IRectangle[] {
    return this._rectangles;
  }

  ngOnInit(): void {
    this.id = new Date().getTime();
    this.subscribeEvents();
  }

  private subscribeEvents(): void {
    this._events$.pipe(
      tap(({ name, details }) => {
        const { rectangle, rectangles, page } = details;
        if (page && !isNaN(page as number) && Number(page) !== this.page) {
          return;
        }

        switch (name) {
          case IntenalEvent.pageRendered:
            const { source, pageNumber, currentPage, error } = details;
            const { div: pageContainer, viewport: { rotation, viewBox } } = source as PDFPageView;

            if (isDefined(error) || !isDefined(pageContainer) || pageNumber !== currentPage) {
              return;
            }

            const [, , width, height] = viewBox;
            this.page = pageNumber as number;
            this._nativeElement.style.width = `calc(var(--scale-factor) * ${width}px)`;
            this._nativeElement.style.height = `calc(var(--scale-factor) * ${height}px)`;
            this._nativeElement.setAttribute('data-main-rotation', rotation as unknown as string);

            pageContainer.appendChild(this._nativeElement);
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

  private addRectangles(data: IRectangle | IRectangle[]): void {
    if (!data) {
      return;
    }

    const rectangles = (Array.isArray(data) ? data : [data]).filter(_rectangle => !_rectangle.page || _rectangle.page === this.page);

    if (!rectangles.length) {
      return;
    }

    this._rectangles.push(...rectangles);
  }

  /**
   * remove zones out from list zones of layer
   * @param data 
   * @returns 
   */
  private removeRectangles(data: IRectangle | IRectangle[]): void {
    if (!data) {
      return;
    }

    const rectangles = (Array.isArray(data) ? data : [data]).filter(_zone => !_zone.page || _zone.page === this.page);

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