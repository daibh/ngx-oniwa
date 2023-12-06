import { CommonModule } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { CarouselComponent, ICarouselItem } from "@daibh/material";

@Component({
  selector: 'storybook-carousel-example',
  templateUrl: './carousel-example.component.html',
  styleUrl: './carousel-example.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    CarouselComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class CarouselExampleComponent {
  @Input() items: ICarouselItem[] = [];
}