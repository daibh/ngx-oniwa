import { NgFor, NgIf, NgTemplateOutlet } from "@angular/common";
import { Component, ElementRef, Input, NgZone, OnDestroy, OnInit, inject } from "@angular/core";
import { ICarouselConfig, ICarouselItem } from "./carousel.model";
import { NW_CAROUSEL_CONFIG, defaultConfig } from "./carousel.config";
import { animationTrigger } from "./carousel.animation";
import { isDefined } from "@daibh/cdk/operators";
import { BehaviorSubject, Subject, interval, takeUntil, tap } from "rxjs";

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
  animations: [animationTrigger]
})
export class CarouselComponent implements OnInit, OnDestroy {
  private readonly _ngZone: NgZone = inject(NgZone);
  private readonly _config: Partial<ICarouselConfig> = inject(NW_CAROUSEL_CONFIG);
  private readonly _nativeElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly _destroy$: Subject<void> = new Subject();
  private readonly _navTrip$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private _automic: boolean;
  private _rotation: boolean;
  private _delay: number;
  private _activatedIndex: number = 0;

  @Input() items: ICarouselItem[] = [];

  private get config(): Partial<ICarouselConfig> {
    return this._config || {};
  }

  get activatedIndex(): number {
    return this._activatedIndex || 0;
  }

  ngOnInit(): void {
    this._initialize();
  }

  private _initialize(): void {
    this._applyConfig();
    this._registEvents();
  }

  private _registEvents(): void {
    this._navTrip$.asObservable()
      .pipe(
        takeUntil(this._destroy$),
        tap(index => this._ngZone.run(() => this.onMoveToSlide(index)))
      )
      .subscribe();

    if (this._automic && this._delay > 0) {
      interval(this._delay)
        .pipe(
          takeUntil(this._destroy$),
          tap(() => this._ngZone.runOutsideAngular(
            () => this._navTrip$.next(this.activatedIndex < this.items.length - 1 ? this.activatedIndex + 1 : 0))
          )
        )
        .subscribe();
    }
  }

  private _applyConfig(): void {
    const { config } = this;
    let { automic, height, delay, rotation } = defaultConfig;

    this._automic = automic;
    this._delay = delay;

    if ('height' in config && isDefined(config.height)) {
      height = config.height!;
    }

    if ('automic' in config && isDefined(config.automic)) {
      this._automic = config.automic!;
    }

    if ('delay' in config && isDefined(config.delay)) {
      this._delay = config.delay!;
    }

    if ('rotation' in config && isDefined(config.rotation)) {
      this._rotation = config.rotation!;
    }

    this._nativeElement.style.setProperty('--carousel-max-height', height);
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

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}