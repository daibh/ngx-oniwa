# Angular Material
This library was generated with Angular CLI version 17.0.0
The goal of creating this library to create common dump component to reduce time to development on the Angular framework.

### Features
- ✨Provide usage components
- ✨Structure of code more clean

### Dependencies:
- [Angular](https://angular.dev/) - Awesome typescript-based framework easier to develop application
- [@daibh/cdk](https://www.npmjs.com/package/@daibh/cdk) - Library include some function support to develop this library.

### Installation
Install the dependencies and devDependencies and start the server.

```sh
npm install @daibh/material --save
```

### Dependencies versions
| Library | Version |
| ------ | ------ |
| Angular | [17.0.0](https://github.com/angular/angular/releases/tag/17.0.0) |
| @daibh/cdk | [v0.0.1](https://www.npmjs.com/package/@daibh/cdk/v/0.0.1) |

### How it work?

```ts
@Component({
  selector: 'storybook-material-example',
  template: `
    <div class="wrapper">
      <nw-carousel [items]="items"></nw-carousel>
    </div>
  `,
  styleUrls: ['./material-example.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CarouselComponent
  ]
})
export class MaterialExampleComponent {
  @Input() items: ICarouselItem[];
}
```

## License

MIT

**Free Software, Bless you all!**