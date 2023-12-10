export type OffcanvasPosition = 'start' | 'end' | 'top' | 'bottom';

export interface IOffCanvasSate {
  name: string;
  state: boolean;
};

export interface IOffCanvasConfig {
  name: string;
  backdrop: boolean | 'static';
}