import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnotationEvent, PdfComponent, PdfService, ResourceEvent } from '@daibh/pdf';
import { PdfThumbnailComponent } from '@daibh/pdf/components';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'storybook-pdf-viewer-example',
  templateUrl: './pdf-example.component.html',
  styleUrls: ['./pdf-example.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PdfComponent,
    PdfThumbnailComponent,
    FormsModule
  ]
})
export class PdfExampleComponent implements OnInit {
  private readonly _pdfService = inject(PdfService);
  private readonly _destroy$ = new Subject();
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
  }

  onAddStamp(): void {
    this._pdfService.dispatch({ name: AnotationEvent.createStamp, details: {} });
  }
}
