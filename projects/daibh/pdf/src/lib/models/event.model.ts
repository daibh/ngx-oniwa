
export type PdfEvent = IntenalEvent | ResourceEvent | LoadEvent | ViewModeEvent | PageEvent | ZoomEvent | RotationEvent | AnotationEvent;
export interface IPdfEvent {
  name: PdfEvent;
  details: Record<string, unknown>;
}

export enum LoadEvent {
  loadingProgress = 'loadingProgress',
  sourceNotFound = 'sourceNotFound',
  documentloaded = 'documentloaded'
}

export enum ViewModeEvent {
  switchScrollMode = 'switchScrollMode',
  scrollModeChanged = 'scrollModeChanged',
  switchCursor = 'switchCursor',
  cursorChanged = 'cursorChanged'
}

export enum ZoomEvent {
  zoomIn = 'zoomIn',
  zoomOut = 'zoomOut',
  zoomChanged = 'zoomChanged'
}

export enum RotationEvent {
  rotateLeft = 'rotateLeft',
  rotateRight = 'rotateRight',
  rotateChanged = 'rotateChanged'
}

export enum PageEvent {
  nextPage = 'nextPage',
  prevPage = 'prevPage',
  gotoPage = 'gotoPage',
  pageChanged = 'pageChanged'
}

export enum IntenalEvent {
  loadSource = 'loadSource',
  pageRender = 'pageRender',
  pageRendered = 'pageRendered',
  thumbnailRendered = 'thumbnailRendered'
}

export enum ResourceEvent {
  changeResource = 'changeResource',
  downloadResource = 'downloadResource'
}

export enum AnotationEvent {
  createStamp = 'createStamp',
  anotationChanged = 'anotationChanged'
}