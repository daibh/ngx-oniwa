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
  selected?: boolean;
  [key: string]: unknown;
}

export type ResizeType = 'top-left' | 'top-middle' | 'top-right' | 'middle-left' | 'bottom-left' | 'bottom-middle' | 'bottom-right';
export const ResizePosition = {
  ['top-left']: {
    isDiagonal: true,
    isHorizontal: false,
    getPoint: (w: number, h: number): [number, number] => [0, 0],
    getOpposite: (w: number, h: number): [number, number] => [w, h]
  },
  ['top-middle']: {
    isDiagonal: false,
    isHorizontal: false,
    getPoint: (w: number, h: number): [number, number] => [w / 2, 0],
    getOpposite: (w: number, h: number): [number, number] => [w / 2, h]
  },
  ['top-right']: {
    isDiagonal: true,
    isHorizontal: false,
    getPoint: (w: number, h: number): [number, number] => [w, 0],
    getOpposite: (w: number, h: number): [number, number] => [0, h]
  },
  ['middle-left']: {
    isDiagonal: false,
    isHorizontal: true,
    getPoint: (w: number, h: number): [number, number] => [0, h / 2],
    getOpposite: (w: number, h: number): [number, number] => [w, h / 2]
  },
  ['middle-right']: {
    isDiagonal: false,
    isHorizontal: true,
    getPoint: (w: number, h: number): [number, number] => [w, h / 2],
    getOpposite: (w: number, h: number): [number, number] => [0, h / 2]
  },
  ['bottom-left']: {
    isDiagonal: true,
    isHorizontal: false,
    getPoint: (w: number, h: number): [number, number] => [0, h],
    getOpposite: (w: number, h: number): [number, number] => [w, 0]
  },
  ['bottom-middle']: {
    isDiagonal: false,
    isHorizontal: false,
    getPoint: (w: number, h: number): [number, number] => [w / 2, h],
    getOpposite: (w: number, h: number): [number, number] => [w / 2, 0]
  },
  ['bottom-right']: {
    isDiagonal: true,
    isHorizontal: false,
    getPoint: (w: number, h: number): [number, number] => [w, h],
    getOpposite: (w: number, h: number): [number, number] => [0, 0]
  },
}