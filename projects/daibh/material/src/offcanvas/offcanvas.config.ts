import { InjectionToken } from "@angular/core";
import { IOffCanvasConfig } from "./offcanvas.model";

/** Injection token that can be used to access the data that was passed in to offcanvas. */
export const NW_OFFCANVAS_CONFIG = new InjectionToken<IOffCanvasConfig>('NwOffCanvasConfig');
export const defaultOffCanvasConfig: IOffCanvasConfig = {
  backdrop: true,
  name: `${(new Date()).getTime()}`
};