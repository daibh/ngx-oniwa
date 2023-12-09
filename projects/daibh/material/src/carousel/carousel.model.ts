export interface ICarouselConfig {
  height: string;
  automic: boolean;
  delay: number;
  rotation: boolean;
}

export interface ICarouselItem {
  title: string;
  description: string;
  image: string;
  routeLink: string;
}