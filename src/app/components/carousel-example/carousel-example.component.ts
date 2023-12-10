import { CommonModule } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { CarouselComponent, ICarouselItem, NW_CAROUSEL_CONFIG } from "@daibh/material";

@Component({
  selector: 'storybook-carousel-example',
  templateUrl: './carousel-example.component.html',
  styleUrl: './carousel-example.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    CarouselComponent
  ],
  providers: [
    { provide: NW_CAROUSEL_CONFIG, useValue: { height: '300px', automic: true } }
  ],
  encapsulation: ViewEncapsulation.None
})
export class CarouselExampleComponent {
  @Input() items: ICarouselItem[] = [];
}