import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfComponent } from '@daibh/pdf';
import { PdfThumbnailComponent } from '@daibh/pdf/components';
import { FormsModule } from '@angular/forms';

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
  @Input() lightSrc: string;
  @Input() heavySrc: string;

  pdfSrc: string;

  ngOnInit(): void {
    this.pdfSrc = this.lightSrc;
  }
}
