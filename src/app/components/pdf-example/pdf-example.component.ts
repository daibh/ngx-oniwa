import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnotationEvent, PageEvent, PdfComponent, PdfService, ResourceEvent, ZoomEvent } from '@daibh/pdf';
import { DrawableLayerComponent, PdfThumbnailComponent, RectangleEvent } from '@daibh/pdf/components';
import { FormsModule } from '@angular/forms';
import { Subject, map, takeUntil, tap } from 'rxjs';

const { prevPage, nextPage, pageChanged } = PageEvent;
const { zoomIn, zoomOut } = ZoomEvent;

@Component({
  selector: 'storybook-pdf-viewer-example',
  templateUrl: './pdf-example.component.html',
  styleUrls: ['./pdf-example.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PdfComponent,
    DrawableLayerComponent,
    PdfThumbnailComponent,
    FormsModule
  ]
})
export class PdfExampleComponent implements OnInit {
  private readonly _pdfService = inject(PdfService);
  private readonly _destroy$ = new Subject();
  readonly page = signal(1);

  @Input() lightSrc: string;
  @Input() heavySrc: string;

  pdfSrc: string;

  ngOnInit(): void {
    this.pdfSrc = this.lightSrc;
    this._pdfService.observe(AnotationEvent.anotationChanged).pipe(
      takeUntil(this._destroy$),
      tap(_ => {
        this._pdfService.dispatch({ name: ResourceEvent.downloadResource, details: {} });
      })
    ).subscribe();

    this._pdfService.observe(pageChanged).pipe(
      takeUntil(this._destroy$),
      tap(data =>
        this.page.update(() => Number((data as { pageNumber: number })?.pageNumber || 1))
      )
    ).subscribe();
  }

  onAddStamp(): void {
    this._pdfService.dispatch({ name: AnotationEvent.createStamp, details: {} });
  }

  onAddRectangle(): void {
    this._pdfService.dispatch({
      name: RectangleEvent.addRectangle, details: {
        rectangle: {
          name: 'test-rectangle-123',
          title: 'Pagination',
          style: {
            borderColor: 'red',
            borderStyle: 'solid',
            borderWidth: '1px'
          },
          viewport: {
            x: 0,
            y: 0,
            w: 100,
            h: 30
          }
        }
      }
    });
  }

  zoomIn(): void {
    this._pdfService.dispatch({ name: zoomIn, details: {} });
  }

  zoomOut(): void {
    this._pdfService.dispatch({ name: zoomOut, details: {} });
  }

  next(): void {
    this._pdfService.dispatch({ name: nextPage, details: {} });
  }

  previous(): void {
    this._pdfService.dispatch({ name: prevPage, details: {} });
  }
}
