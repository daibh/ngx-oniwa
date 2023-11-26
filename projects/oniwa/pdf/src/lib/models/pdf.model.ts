export enum  TextLayerMode {
  Disable,
  Enable,
  EnablePermission,
};

export enum AnnotationMode {
  Disable,
  Enable,
  EnableForm,
  EnableStorage
};

export enum AnnotationEditorType {
  Disable = -1,
  None = 0,
  FreeText = 3,
  Ink = 15
};

export enum ScrollMode {
  Unknown = -1,
  Vertical = 0, // Default value.
  Horizontal = 1,
  Wapped = 2,
  Page = 3,
};

export enum Cursor {
  Select, // The default value.
  Hand,
  Zoom,
};

export interface IPdfConfig {
  scrollMode: ScrollMode;
  zoomScale: number;
  textLayerMode?: TextLayerMode;
  annotationMode?: AnnotationMode;
  annotationEditorMode?: AnnotationEditorType;
}