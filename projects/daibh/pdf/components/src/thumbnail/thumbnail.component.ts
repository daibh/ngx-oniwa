import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { PdfService, LoadEvent, PageEvent } from '@daibh/pdf';
import { Subject, from, tap } from "rxjs";
import { PDFDocumentProxy } from 'pdfjs-dist';
import { isDefined } from "@daibh/cdk/operators";

/**
 * Scale factors for the canvas, necessary with HiDPI displays.
 */
class OutputScale {
  sx: number;
  sy: number;
  constructor() {
    const pixelRatio = window.devicePixelRatio || 1;

    /**
     * @type {number} Horizontal scale.
     */
    this.sx = pixelRatio;

    /**
     * @type {number} Vertical scale.
     */
    this.sy = pixelRatio;
  }

  /**
   * @type {boolean} Returns `true` when scaling is required, `false` otherwise.
   */
  get scaled() {
    return this.sx !== 1 || this.sy !== 1;
  }
}

const THUMBNAIL_WIDTH = 98; // px
const DRAW_UPSCALE_FACTOR = 2;
const MAX_NUM_SCALING_STEPS = 3;

@Component({
  selector: 'ngx-pdf-thumbnail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul>
      <ng-template ngFor let-item [ngForOf]="thumbnails">
        <li>
          <a (click)="onThumbnailClicked(item.page)"><img [src]="item.thumbnailSrc" /></a>
        </li>
      </ng-template>
    </ul>
  `,
  styles: [`
    ul {
      list-style-type: none;
      padding: 0;
    }

    ul li {
      margin: 20px;
    }

    ul li a {
      text-decoration: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
    }
  `]
})
export class PdfThumbnailComponent implements OnInit, OnDestroy {
  private readonly _destroySubject$ = new Subject<void>();
  private readonly _service = inject(PdfService);
  private readonly _thumbnails: { page: number, thumbnailSrc: string }[] = [];
  private _tempCanvas: HTMLCanvasElement;
  private _width: number;
  private _height: number;

  get width(): number {

    return this._width;
  }

  get height(): number {
    return this._height;
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
    this._service.observe<{ pageCount: number, pdfDocument: PDFDocumentProxy }>(LoadEvent.documentloaded).pipe(
      tap(({ pageCount, pdfDocument }) => {
        const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig();
        for (let i = 0; i < pageCount; i++) {
          const curr = i + 1;
          from(pdfDocument.getPage(curr)).pipe(
            tap(_page => {

              if (!isDefined(this.width)) {
                const { width, height } = _page.getViewport({ scale: 1 });
                this._width = width;
                this._height = height;
              }

              const { width, height } = this;
              const scale = THUMBNAIL_WIDTH / width;
              const ratio = width / height;
              const { ctx, canvas, transform } = this._getPageDrawContext(ratio, DRAW_UPSCALE_FACTOR);
              const viewport = _page.getViewport({ scale: DRAW_UPSCALE_FACTOR * scale });
              const renderContext = {
                canvasContext: ctx,
                transform,
                viewport,
                optionalContentConfigPromise,
                pageColors: null,
              };
              _page.render(renderContext as any).promise.then(() => {
                const reducedCanvas = this._reduceImage(canvas, ratio);
                this._thumbnails.push({ page: curr, thumbnailSrc: reducedCanvas.toDataURL() })
              });
            })
          ).subscribe();
        }
      })
    ).subscribe();
  }

  private _getPageDrawContext(ratio: number, upscaleFactor = 1): { ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, transform: number[] | null } {
    // Keep the no-thumbnail outline visible, i.e. `data-loaded === false`,
    // until rendering/image conversion is complete, to avoid display issues.
    const canvas = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d", { alpha: false })!;
    const outputScale = new OutputScale();
    const canvasWidth = THUMBNAIL_WIDTH;
    const canvasHeight = (THUMBNAIL_WIDTH / ratio) | 0;

    canvas.width = (upscaleFactor * canvasWidth * outputScale.sx) | 0;
    canvas.height = (upscaleFactor * canvasHeight * outputScale.sy) | 0;

    const transform = outputScale.scaled ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0] : null;

    return { ctx, canvas, transform };
  }

  private _reduceImage(imgCanvas: HTMLCanvasElement, ratio: number,) {
    const { ctx, canvas } = this._getPageDrawContext(ratio);

    if (imgCanvas.width <= 2 * canvas.width) {
      ctx.drawImage(
        imgCanvas,
        0,
        0,
        imgCanvas.width,
        imgCanvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      return canvas;
    }

    // drawImage does an awful job of rescaling the image, doing it gradually.
    let reducedWidth = canvas.width << MAX_NUM_SCALING_STEPS;
    let reducedHeight = canvas.height << MAX_NUM_SCALING_STEPS;
    const [reducedImage, reducedImageCtx] = this.getCanvas(
      reducedWidth,
      reducedHeight
    );

    while (reducedWidth > imgCanvas.width || reducedHeight > imgCanvas.height) {
      reducedWidth >>= 1;
      reducedHeight >>= 1;
    }

    reducedImageCtx.drawImage(
      imgCanvas,
      0,
      0,
      imgCanvas.width,
      imgCanvas.height,
      0,
      0,
      reducedWidth,
      reducedHeight
    );

    while (reducedWidth > 2 * canvas.width) {
      reducedImageCtx.drawImage(
        reducedImage,
        0,
        0,
        reducedWidth,
        reducedHeight,
        0,
        0,
        reducedWidth >> 1,
        reducedHeight >> 1
      );
      reducedWidth >>= 1;
      reducedHeight >>= 1;
    }

    ctx.drawImage(
      reducedImage,
      0,
      0,
      reducedWidth,
      reducedHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas;
  }

  private getCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
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