import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit, inject } from "@angular/core";
import { PdfService, LoadEvent, PageEvent } from '@daibh/pdf';
import { Subject, from, takeUntil, tap } from "rxjs";
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { isDefined } from "@daibh/cdk/operators";

interface IDocumentLoaded {
  pageCount: number;
  pdfDocument: PDFDocumentProxy;
}

interface IPageInfo {
  view: number[];
}

interface IDrawContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  transform: number[] | null;
}

const DRAW_UPSCALE_FACTOR = 2;
const MAX_NUM_SCALING_STEPS = 3;

@Component({
  selector: 'ngx-pdf-thumbnail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul>
      <ng-template ngFor let-item [ngForOf]="thumbnails" [ngForTrackBy]="trackBy"]>
        <li>
          <a [class.active]="currentPage === item.page" (click)="onThumbnailClicked(item.page)"><img [src]="item.thumbnailSrc" /></a>
        </li>
      </ng-template>
    </ul>
  `,
  styleUrls: ['./thumbnail.component.scss']
})
export class PdfThumbnailComponent implements OnInit, OnDestroy {
  private readonly _destroySubject$ = new Subject<void>();
  private readonly _service = inject(PdfService);
  private readonly _docLoaded$ = this._service.observe<IDocumentLoaded>(LoadEvent.documentloaded);
  private readonly _pageChanged$ = this._service.observe<{ pageNumber: number }>(PageEvent.pageChanged);
  private readonly _thumbnails: { page: number, thumbnailSrc: string }[] = [];
  private readonly _defaultWidth = 98;
  private readonly _syncCurrentPage = ({ pageNumber }: { pageNumber: number }) => this._currentPage = pageNumber;
  private _tempCanvas: HTMLCanvasElement;
  private _currentPage: number;
  private _thumbWidth: number;

  readonly trackBy = (_: number, item: { page: number }) => item.page;

  @Input() set thumbWidth(width: number) {
    this._thumbWidth = width;
  }

  get thumbWidth(): number {
    return this._thumbWidth ?? this._defaultWidth;
  }

  get currentPage(): number {
    return this._currentPage || 1;
  }

  get thumbnails() {
    return this._thumbnails || [];
  }

  get tempCanvas(): HTMLCanvasElement {
    if (!isDefined(this._tempCanvas)) {
      this._tempCanvas = document.createElement('canvas');
    }

    return this._tempCanvas;
  }

  ngOnInit(): void {
    this._docLoaded$.pipe(
      takeUntil(this._destroySubject$),
      tap(({ pageCount, pdfDocument }) => {
        const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig();

        // to remove all of old thumbails.
        this.thumbnails.length = 0;

        const createThumbnail = (_page: PDFPageProxy) => {
          const { view: [, , width, height] } = _page._pageInfo as IPageInfo;
          const { ctx, canvas, transform } = this._getPageDrawContext(width / height, DRAW_UPSCALE_FACTOR);
          const viewport = _page.getViewport({ scale: DRAW_UPSCALE_FACTOR * this.thumbWidth / width });

          const renderContext = {
            canvasContext: ctx,
            transform,
            viewport,
            optionalContentConfigPromise,
            pageColors: null,
          };

          const onRenderFinished = () => {
            const reducedCanvas = this._reduceImage(canvas, width / height);
            this._thumbnails.push({ page: _page.pageNumber, thumbnailSrc: reducedCanvas.toDataURL() });
          }

          _page.render(renderContext as any).promise.then(onRenderFinished);
        };

        Array.from({ length: pageCount }, (_, i) => i + 1)
          .forEach(_pageNumber => from(pdfDocument.getPage(_pageNumber))
            .pipe(tap(createThumbnail))
            .subscribe()
          );

      })
    ).subscribe();

    this._pageChanged$.pipe(takeUntil(this._destroySubject$), tap(this._syncCurrentPage)).subscribe();
  }

  private _getPageDrawContext(ratio: number, upscaleFactor = 1): IDrawContext {
    const canvas = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d", { alpha: false })!;
    const canvasWidth = this.thumbWidth;
    const canvasHeight = (this.thumbWidth / ratio) | 0;
    const pixelRatio = window.devicePixelRatio || 1;
    const scaled = pixelRatio !== 1;

    canvas.width = (upscaleFactor * canvasWidth) | 0;
    canvas.height = (upscaleFactor * canvasHeight) | 0;

    return { ctx, canvas, transform: scaled ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null };
  }

  private _reduceImage(imgCanvas: HTMLCanvasElement, ratio: number): HTMLCanvasElement {
    const { ctx, canvas } = this._getPageDrawContext(ratio);

    if (imgCanvas.width <= DRAW_UPSCALE_FACTOR * canvas.width) {
      ctx.drawImage(imgCanvas, 0, 0, imgCanvas.width, imgCanvas.height, 0, 0, canvas.width, canvas.height);
      return canvas;
    }

    // drawImage does an awful job of rescaling the image, doing it gradually.
    let reducedWidth = canvas.width << MAX_NUM_SCALING_STEPS;
    let reducedHeight = canvas.height << MAX_NUM_SCALING_STEPS;
    const [reducedImage, reducedImageCtx] = this._getCanvas(reducedWidth, reducedHeight);

    while (reducedWidth > imgCanvas.width || reducedHeight > imgCanvas.height) {
      reducedWidth >>= 1;
      reducedHeight >>= 1;
    }

    reducedImageCtx.drawImage(imgCanvas, 0, 0, imgCanvas.width, imgCanvas.height, 0, 0, reducedWidth, reducedHeight);

    while (reducedWidth > DRAW_UPSCALE_FACTOR * canvas.width) {
      reducedImageCtx.drawImage(reducedImage, 0, 0, reducedWidth, reducedHeight, 0, 0, reducedWidth >> 1, reducedHeight >> 1);
      reducedWidth >>= 1;
      reducedHeight >>= 1;
    }

    ctx.drawImage(reducedImage, 0, 0, reducedWidth, reducedHeight, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  private _getCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const tempCanvas = this.tempCanvas;
    tempCanvas.width = width;
    tempCanvas.height = height;

    // Since this is a temporary canvas, we need to fill it with a white
    // background ourselves. `_getPageDrawContext` uses CSS rules for this.
    const ctx = tempCanvas.getContext("2d", { alpha: false })!;
    ctx.save();
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    return [tempCanvas, tempCanvas.getContext("2d")!];
  }

  onThumbnailClicked(page: number): void {
    this._service.dispatch({ name: PageEvent.gotoPage, details: { page } });
  }

  ngOnDestroy(): void {
    this._destroySubject$.next();
    this._destroySubject$.complete();
  }
}