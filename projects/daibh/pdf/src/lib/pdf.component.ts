//@ts-ignore
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventBus, PDFLinkService, PDFFindController, PDFViewer, PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import { Observable, Subject, fromEvent, map, pairwise, switchMap, takeUntil, takeWhile, tap } from 'rxjs';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { AnnotationEditorType, AnnotationMode, Cursor, IPdfConfig, ScrollMode, TextLayerMode } from './models/pdf.model';
import { PdfService } from './services/pdf.service';
import { isDefined } from '@daibh/cdk/operators';
import { AnotationEvent, IPdfEvent, IntenalEvent, LoadEvent, PageEvent, ResourceEvent, RotationEvent, ViewModeEvent, ZoomEvent } from './models/event.model';

const { loadingProgress, sourceNotFound, documentloaded } = LoadEvent;
const { loadSource, pageRender, pageRendered, thumbnailRendered } = IntenalEvent;
const { prevPage, nextPage, gotoPage, pageChanged, } = PageEvent;
const { switchScrollMode, scrollModeChanged, switchCursor, cursorChanged } = ViewModeEvent;
const { zoomIn, zoomOut, zoomChanged } = ZoomEvent;
const { rotateLeft, rotateRight, rotateChanged } = RotationEvent;
const { downloadResource } = ResourceEvent;
const { createStamp, anotationChanged } = AnotationEvent;

const defaultInitConfig: IPdfConfig = {
  scrollMode: ScrollMode.Page,
  zoomScale: 1,
  textLayerMode: TextLayerMode.Enable,
  annotationMode: AnnotationMode.EnableStorage,
  annotationEditorMode: AnnotationEditorType.None
};

@Component({
  selector: 'ngx-pdf',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viewerContainer" tabindex="0">
      <div class="viewer"></div>
    </div>
  `,
  styleUrls: ['./pdf.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PdfComponent implements OnInit, OnChanges {
  private readonly _destroySubject$ = new Subject<void>();
  private readonly _nativeElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _service = inject(PdfService)
  private readonly _eventBus = new EventBus();
  private readonly _linkService = new PDFLinkService({ eventBus: this._eventBus });
  private readonly _findController = new PDFFindController({ eventBus: this._eventBus, linkService: this._linkService });
  private readonly _events$: Observable<IPdfEvent<unknown>> = this._service.events$.pipe(takeUntil(this._destroySubject$));
  private _config: IPdfConfig = defaultInitConfig;
  private _viewer: PDFViewer;
  private _mainContainer: HTMLDivElement;
  private _ownerDocument: Document;
  private _overlay: HTMLDivElement;
  private _pdfDocument: PDFDocumentProxy;
  private _cursor: Cursor;
  private _isGrabToPan: boolean;
  private _downloadComplete: boolean;

  private get events$(): Observable<IPdfEvent<unknown>> {
    return this._events$;
  }

  get config(): IPdfConfig {
    return this._config;
  }

  @Input() src: string;
  @Input() set config(config: IPdfConfig) {
    if (config) {
      this._config = config;
    }
  }

  ngOnInit(): void {
    const { textLayerMode, annotationMode, annotationEditorMode, scrollMode, zoomScale } = this.config;
    const { _nativeElement, _eventBus: eventBus, _linkService: linkService, _findController: findController } = this;

    const container = _nativeElement.querySelector('.viewerContainer') as HTMLDivElement;
    const viewer = _nativeElement.querySelector('.viewer') as HTMLDivElement;

    this._mainContainer = container;
    this._ownerDocument = container.ownerDocument;
    this._overlay = document.createElement('div');
    this._overlay.className = "grab-to-pan-grabbing";

    this._viewer = new PDFViewer({ container, viewer, eventBus, linkService, findController, textLayerMode, annotationMode, annotationEditorMode });
    this._viewer.scrollMode = scrollMode;
    this._viewer.currentScale = zoomScale;
    this._linkService.setViewer(this._viewer);

    // capture event from bus to self managing
    this.observeBusEvents();

    this.observeEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('src' in changes) {
      const newSrc = changes['src'].currentValue;
      if (isDefined(newSrc) || !changes['src'].firstChange) {
        this._service.dispatch({ name: loadSource, details: { src: newSrc } });
      }
    }
  }

  /**
   * listen some events from {EventBus} which managed by {pdfjs-dist} then sync/dispatch to {_eventsSubject$} to self managing
   */
  private observeBusEvents(): void {
    fromEvent<{ source: PDFPageView, pageNumber: number }>(this._eventBus, 'pagerender').pipe(
      takeUntil(this._destroySubject$),
      tap(details => this._service.dispatch({ name: pageRender, details }))
    ).subscribe();

    fromEvent<{ pageNumber: number, previous: number }>(this._eventBus, 'pagechanging').pipe(
      takeUntil(this._destroySubject$),
      tap(details => this._service.dispatch({ name: pageChanged, details }))
    ).subscribe();

    fromEvent<{ source: PDFPageView, pageNumber: number, error: unknown }>(this._eventBus, 'pagerendered').pipe(
      takeUntil(this._destroySubject$),
      tap(details => this._service.dispatch({ name: pageRendered, details: { ...details, currentPage: this._viewer.currentPageNumber } }))
    ).subscribe();

    fromEvent<{ source: PDFPageView, pageNumber: number, pdfPage: unknown }>(this._eventBus, 'thumbnailrendered').pipe(
      takeUntil(this._destroySubject$),
      tap(details => this._service.dispatch({ name: thumbnailRendered, details }))
    ).subscribe();
  }

  private observeEvents(): void {
    this.events$.pipe(
      tap(async ({ name, details }) => {
        console.log('observeEvents', name, details);
        switch (name) {
          case loadSource:
            const { src } = details;
            await this.loadSource(src as string);
            break;
          case prevPage:
            this._viewer.previousPage();
            break;
          case nextPage:
            this._viewer.nextPage();
            break;
          case gotoPage:
            const { page } = details;
            if (!isNaN(page as number)) {
              this._linkService.goToPage(page as number);
            }
            break;
          case switchScrollMode:
            const { scrollMode } = details;
            this._viewer.scrollMode = scrollMode as ScrollMode;
            this._service.dispatch({ name: scrollModeChanged, details: { scrollMode } });
            break;
          case switchCursor:
            const { cursor } = details;
            this.switchCursor(cursor as Cursor);
            break;
          case zoomIn:
            this._viewer.currentScale += 0.1;
            this._service.dispatch({ name: zoomChanged, details: { currentScale: this._viewer.currentScale } });
            break;
          case zoomOut:
            this._viewer.currentScale -= 0.1;
            this._service.dispatch({ name: zoomChanged, details: { currentScale: this._viewer.currentScale } });
            break;
          case rotateLeft:
            this._viewer.pagesRotation += 90;
            this._service.dispatch({ name: rotateChanged, details: { angle: this._viewer.pagesRotation } });
            break;
          case rotateRight:
            this._viewer.pagesRotation -= 90 as number;
            this._service.dispatch({ name: rotateChanged, details: { angle: this._viewer.pagesRotation } });
            break;
          case downloadResource:
            if (this._pdfDocument && this._downloadComplete) {
              const data = await this._pdfDocument.saveDocument();
              const blobData = new Blob([data], { type: "application/pdf" });
              const blobUrl = URL.createObjectURL(blobData);
              const hiddenLink = document.createElement("a");
              hiddenLink.href = blobUrl;
              hiddenLink.target = '_parent';
              // Use a.download if available. This increases the likelihood that
              // the file is downloaded instead of opened by another PDF plugin.
              if ("download" in hiddenLink) {
                hiddenLink.download = `pdf-${new Date().getTime()}`;
              }
              // <a> must be in the document for recent Firefox versions,
              // otherwise .click() is ignored.
              (document.body || document.documentElement).append(hiddenLink);
              hiddenLink.click();
              hiddenLink.remove();
            }
            break;
          case createStamp:
            this._pdfDocument.annotationStorage.setValue('pdfjs_internal_editor_0', {
              "annotationType": 3,
              "color": [0, 0, 0],
              "fontSize": 10,
              "value": "Hello World",
              "pageIndex": 0,
              "rect": [67.5, 543, 119, 556.5],
              "rotation": 0
            });
            this._service.dispatch({ name: anotationChanged, details: {} });
            break;
          default:
            break;
        }
      })
    ).subscribe();
  }

  private async loadSource(src: string) {
    if (!src) {
      this._service.dispatch({ name: sourceNotFound, details: { reason: 'source url could not be blank' } });
      return;
    }

    this._downloadComplete = false;
    const loadingTask = pdfjsLib.getDocument({ url: src, enableXfa: true });
    loadingTask.onProgress = ({ loaded, total }: { loaded: number, total: number }) => this._service.dispatch({ name: loadingProgress, details: { loaded, total } });

    const pdfDocument = await loadingTask.promise;
    this._pdfDocument = pdfDocument;

    pdfDocument.getDownloadInfo().then(() => {
      this._downloadComplete = true;

      this._viewer.firstPagePromise!.then(() => {
        this._service.dispatch({ name: documentloaded, details: { source: this, pageCount: pdfDocument.numPages, pdfDocument } });
        this._service.dispatch({ name: pageChanged, details: { page: this._linkService.page } });
      });
    }).catch((reason: unknown) => {
      this._service.dispatch({ name: sourceNotFound, details: { reason } })
    });

    this._viewer.setDocument(pdfDocument);
    this._linkService.setDocument(pdfDocument, null);
  }

  private switchCursor(cursor: Cursor): void {
    if (this._cursor === cursor) {
      // in case new cursor same with current cursor. do nothing
      return;
    }
    this._cursor = cursor;
    this.toggleGrabToPan(this._cursor !== Cursor.Select);
    this._service.dispatch({ name: cursorChanged, details: { cursor } });
  }

  private toggleGrabToPan(active: boolean): void {
    if (active && !this._isGrabToPan) {
      this._isGrabToPan = active;
      fromEvent(this._mainContainer, 'mousedown').pipe(
        takeUntil(this._destroySubject$),
        takeWhile(() => this._isGrabToPan),
        map(evt => evt as MouseEvent),
        tap(evt => {
          if (evt.button !== 0) {
            return;
          }

          evt.preventDefault();
          evt.stopPropagation();

          const focusedElement = document.activeElement as HTMLElement;
          if (focusedElement && !focusedElement.contains(evt.target as HTMLElement)) {
            focusedElement.blur();
          }

        }),
        switchMap(() => fromEvent(this._ownerDocument, 'mousemove').pipe(
          map(_evt => _evt as MouseEvent),
          takeUntil(fromEvent(this._ownerDocument, 'mouseup').pipe(tap(() => this._overlay.remove()))),
          takeUntil(fromEvent(this._ownerDocument, 'mouseleave').pipe(tap(() => this._overlay.remove()))),
          pairwise(),
          tap(([prev, curr]) => {
            const rect = this._mainContainer.getBoundingClientRect();
            const prevPos = {
              x: prev.clientX - rect.left,
              y: prev.clientY - rect.top
            };
            const currPos = {
              x: curr.clientX - rect.left,
              y: curr.clientY - rect.top
            }
            const cx = currPos.x - prevPos.x;
            const cy = currPos.y - prevPos.y;

            const scrollLeft = this._mainContainer.scrollLeft - cx;
            const scrollTop = this._mainContainer.scrollTop - cy;

            if (this._mainContainer.scrollTo !== undefined) {
              this._mainContainer.scrollTo({
                top: scrollTop,
                left: scrollLeft,
                behavior: 'instant' as ScrollBehavior,
              });
            } else {
              this._mainContainer.scrollTop = scrollTop;
              this._mainContainer.scrollLeft = scrollLeft;
            }

            if (!this._overlay.parentNode) {
              document.body.append(this._overlay);
            }

          })
        ))
      ).subscribe();
      this._mainContainer.classList.add('grab-to-pan-grab');
    }

    if (!active && this._isGrabToPan) {
      this._isGrabToPan = active;
      this._mainContainer.classList.remove('grab-to-pan-grab');
    }

  }

}
