import { NgFor, NgIf, NgTemplateOutlet } from "@angular/common";
import { Component, Input, TemplateRef } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterModule } from "@angular/router";
import { ICarouselItem } from "./carousel.model";

@Component({
  selector: 'nw-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet
  ],
  providers: []
})
export class CarouselComponent {
  @Input() items: ICarouselItem[] = [];

  activatedIndex = 0;

  onMoveToSlide(idx: number): void {
    this.activatedIndex = idx;
  }

  onPrevClicked(): void {
    if (this.activatedIndex > 0) {
      this.activatedIndex -= 1;
    }
  }

  onNextClicked(): void {
    if (this.activatedIndex < this.items.length - 1) {
      this.activatedIndex += 1;
    }
  }
}