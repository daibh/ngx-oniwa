export enum Resolution {
  PPI = 96,
  DPI = 72
}

export enum Unit {
  Pixel,
  Points,
  Inch
}

export interface IStyle {
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
}

export interface IViewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IRectangle {
  name: string;
  title: string;
  style: IStyle;
  viewport: IViewport;
  page?: number;
  [key: string]: unknown;
}