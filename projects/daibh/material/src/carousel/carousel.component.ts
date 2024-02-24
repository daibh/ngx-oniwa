import { NgFor, NgIf, NgTemplateOutlet } from "@angular/common";
import { Component, DestroyRef, ElementRef, Input, NgZone, OnInit, ViewEncapsulation, afterNextRender, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ICarouselConfig, ICarouselItem } from "./carousel.model";
import { NW_CAROUSEL_CONFIG, defaultCarouselConfig } from "./carousel.config";
import { animationTrigger } from "./carousel.animation";
import { withFallback } from "@daibh/cdk/operators";
import { BehaviorSubject, interval, tap } from "rxjs";

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
  animations: [animationTrigger],
  encapsulation: ViewEncapsulation.None
})
export class CarouselComponent implements OnInit {
  private readonly _ngZone: NgZone = inject(NgZone);
  private readonly _config: Partial<ICarouselConfig> | null = inject(NW_CAROUSEL_CONFIG, { optional: true });
  private readonly _nativeElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _navTrip$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private readonly _registObserver$: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  private _automic: boolean = withFallback(this._config, 'automic', defaultCarouselConfig);
  private _rotation: boolean = withFallback(this._config, 'rotation', defaultCarouselConfig);
  private _delay: number = withFallback(this._config, 'delay', defaultCarouselConfig);
  private _height: string = withFallback(this._config, 'height', defaultCarouselConfig);
  private _activatedIndex: number = 0;

  @Input() items: ICarouselItem[] = [];

  get activatedIndex(): number {
    return this._activatedIndex || 0;
  }

  constructor() {
    // Safe to run automic function because this will only run in the browser, not the server.
    afterNextRender(() => {
      this._registObserver$.pipe(
        takeUntilDestroyed(this._destroyRef),
        tap(() => this._registBrowserEvents())
      ).subscribe();
    });
  }

  ngOnInit(): void {
    this._initialize();
  }

  private _initialize(): void {
    this._applyConfig();
  }

  private _registBrowserEvents(): void {
    this._navTrip$.asObservable()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        tap(index => this._ngZone.run(() => this.onMoveToSlide(index)))
      )
      .subscribe();

    if (this._automic && this._delay > 0) {
      interval(this._delay)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          tap(() => this._ngZone.runOutsideAngular(
            () => this._navTrip$.next(this.activatedIndex < this.items.length - 1 ? this.activatedIndex + 1 : 0))
          )
        )
        .subscribe();
    }
  }

  private _applyConfig(): void {
    this._nativeElement.style.setProperty('--carousel-max-height', this._height);
    this._registObserver$.next();
  }

  isActivated(index: number): boolean {
    return this.activatedIndex === index;
  }

  onMoveToSlide(idx: number): void {
    this._activatedIndex = idx;
  }

  onPrevClicked(): void {
    if (this.activatedIndex > 0) {
      this._navTrip$.next(this.activatedIndex - 1);
      return;
    }

    if (this._rotation && this.items.length) {
      this._navTrip$.next(this.items.length - 1);
    }
  }

  onNextClicked(): void {
    if (this.activatedIndex < this.items.length - 1) {
      this._navTrip$.next(this.activatedIndex + 1);
      return;
    }

    if (this._rotation && this.items.length) {
      this._navTrip$.next(0);
    }
  }
}