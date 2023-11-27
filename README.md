# Angular PDF Viewer
This library was generated with Angular CLI version 17.0.0
The goal of creating this library to facilitate manipulation with pdf.js on the Angular framework.

### Features
- ✨Convert all BUS and DOM events to Observable
- ✨Easier to manipulate and customize by typescript code
- ✨Structure of code more clean

### Dependencies:

- [PDF.JS](https://github.com/mozilla/pdf.js) - PDF Reader in JavaScript
- [Angular](https://angular.dev/) - Awesome typescript-based framework easier to develop application
- [@daibh/cdk](https://www.npmjs.com/package/@daibh/cdk) - Library include some function support to develop this library.

### Installation
Install the dependencies and devDependencies and start the server.

```sh
npm install @daibh/pdf --save
```

### Dependencies versions
| Library | Version |
| ------ | ------ |
| Angular | [17.0.0](https://github.com/angular/angular/releases/tag/17.0.0) |
| Pdf.js | [v3.8.162](https://github.com/mozilla/pdf.js/releases/tag/v3.8.162) |
| @daibh/cdk | [v0.0.1](https://www.npmjs.com/package/@daibh/cdk/v/0.0.1) |

### How it work?

```ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfComponent } from '@daibh/pdf';
import { PdfThumbnailComponent } from '@daibh/pdf/components';

@Component({
  selector: 'storybook-pdf-viewer-example',
  template: `
    <div class="wrapper">
      <div class="pdf-viewer">
        <ngx-pdf [src]="pdfSrc"></ngx-pdf>
      </div>
      <div class="pdf-viewer-thumbnail">
        <ngx-pdf-thumbnail></ngx-pdf-thumbnail>
      </div>
    </div>
  `,
  styles: [`
    .wrapper {
      display: flex;
      flex-direction: row;

      .pdf-viewer {
        position: relative;
        width: 100%;
      }

      .pdf-viewer-thumbnail {
        flex: 1 0 auto;
        flex-basis: 160px;
        max-height: 100vh;
        overflow-y: auto;
        display: flex;
        justify-content: center;
        background-color: rgb(245, 246, 247);
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    PdfComponent,
    PdfThumbnailComponent
  ]
})
export class PdfExampleComponent {
  @Input() pdfSrc: string;
}
```

## License

MIT

**Free Software, Bless you all!**