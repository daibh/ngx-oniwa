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
@Component({
  selector: 'storybook-pdf-viewer-example',
  template: `
    <div class="pdf-viewer">
        <ngx-pdf [src]="pdfSrc"></ngx-pdf>
    </div>
  `,
  styleUrls: ['./pdf-example.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PdfComponent
  ]
})
export class PdfExampleComponent {
  @Input() pdfSrc: string;
}
```

## License

MIT

**Free Software, Bless you all!**