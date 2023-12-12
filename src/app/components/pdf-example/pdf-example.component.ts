import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnotationEvent, LoadEvent, PageEvent, PdfComponent, PdfService, ResourceEvent, RotationEvent, ZoomEvent } from '@daibh/pdf';
import { DrawableLayerComponent, PdfThumbnailComponent, RectangleEvent } from '@daibh/pdf/components';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, tap } from 'rxjs';

const { loadingProgress } = LoadEvent;
const { addRectangle } = RectangleEvent;
const { prevPage, nextPage, pageChanged } = PageEvent;
const { zoomIn, zoomOut } = ZoomEvent;
const { rotateLeft, rotateRight } = RotationEvent;

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
  readonly progress = signal({ loaded: 0, total: 0 });

  @Input() lightSrc: string;
  @Input() heavySrc: string;

  pdfSrc: string;

  ngOnInit(): void {
    this.pdfSrc = this.lightSrc;

    this._pdfService.observe(loadingProgress).pipe(
      takeUntil(this._destroy$),
      tap(data => this.progress.update(() => data as { loaded: number, total: number }))
    ).subscribe();

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

  loadLightPdf(): void {
    this.pdfSrc = this.lightSrc;
  }

  loadHeavyPdf(): void {
    this.pdfSrc = this.heavySrc;
  }

  addRectangle(): void {
    this._pdfService.dispatch({
      name: addRectangle,
      details: {
        rectangle: {
          name: `test-rectangle-${(new Date()).getTime()}`,
          title: `Rect ${(new Date()).getTime()}`,
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

  rotateCw(): void {
    this._pdfService.dispatch({ name: rotateRight, details: {} });
  }

  rotateCcw(): void {
    this._pdfService.dispatch({ name: rotateLeft, details: {} });
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
