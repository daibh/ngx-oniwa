import { Component, Input, OnInit, ViewChild, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnotationEvent, LoadEvent, PageEvent, PdfComponent, PdfService, ResourceEvent, RotationEvent, ZoomEvent } from '@daibh/pdf';
import { DrawableLayerComponent, IRectangle, PdfThumbnailComponent, RectangleEvent } from '@daibh/pdf/components';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, tap } from 'rxjs';
import { ModalComponent } from '@daibh/material';

const { loadingProgress } = LoadEvent;
const { addRectangle, fetchRectangles, fetchedRectangles } = RectangleEvent;
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
    FormsModule,
    ModalComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class PdfExampleComponent implements OnInit {
  private readonly _pdfService = inject(PdfService);
  private readonly _destroy$ = new Subject();
  readonly page = signal(1);
  readonly progress = signal({ loaded: 0, total: 0 });
  readonly rectangles = signal<IRectangle[]>([]);

  @Input() lightSrc: string;
  @Input() heavySrc: string;
  @ViewChild(ModalComponent, { static: true }) modalRef: ModalComponent;

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

    this._pdfService.observe(fetchedRectangles).pipe(
      takeUntil(this._destroy$),
      tap(data => {
        this.rectangles.set((data as { rectangles: IRectangle[] }).rectangles || []);
        this.modalRef.open();
      })
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

  getRectangles(): void {
    this._pdfService.dispatch({
      name: fetchRectangles,
      details: {}
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
