
export type PdfEvent = IntenalEvent | ResourceEvent | LoadEvent | ViewModeEvent | PageEvent | ZoomEvent | RotationEvent | ZoneEvent;
export interface IPdfEvent {
  name: PdfEvent;
  details: Record<string, unknown>;
}

export enum LoadEvent {
  loadingProgress = 0,
  sourceNotFound = 1,
  documentloaded = 2
}

export enum ViewModeEvent {
  switchScrollMode = 11,
  scrollModeChanged = 12,
  switchCursor = 13,
  cursorChanged = 14
}

export enum ZoomEvent {
  zoomIn = 23,
  zoomOut = 24,
  zoomChanged = 25
}

export enum RotationEvent {
  rotateLeft = 51,
  rotateRight = 52,
  rotateChanged = 53
}

export enum PageEvent {
  nextPage = 33,
  prevPage = 34,
  gotoPage = 35,
  pageChanged = 36
}

export enum ZoneEvent {
  addZone = 410,
  addZones = 411,
  removeZone = 412,
  removeZones = 413,
  zoneChanged = 414,
  zoneMoved = 421,
  zoneResized = 422,
  addArea = 431,
  areaChanged = 432,
  setArea = 433
}

export enum IntenalEvent {
  loadSource = 100,
  pageRender = 101,
  pageRendered = 102,
  setZones = 103
}

export enum ResourceEvent {
  changeResource,
  downloadResource
}
