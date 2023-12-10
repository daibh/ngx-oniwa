import { InjectionToken } from "@angular/core";
import { ICarouselConfig } from "./carousel.model";

/** Injection token that can be used to access the data that was passed in to carousel. */
export const NW_CAROUSEL_CONFIG = new InjectionToken<ICarouselConfig>('NwCarouselConfig');
export const defaultCarouselConfig: ICarouselConfig = {
  height: 'auto',
  automic: false,
  delay: 3000,
  rotation: false
};