import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, filter, map } from "rxjs";
import { IOffCanvasSate } from "./offcanvas.model";
import { isDefined } from "@daibh/cdk/operators";

@Injectable({ providedIn: 'root' })
export class OffcanvasService {
  private readonly _stateTrip$ = new BehaviorSubject<IOffCanvasSate>(undefined!);

  get stateTrip$(): Observable<IOffCanvasSate> {
    return this._stateTrip$.asObservable().pipe(filter(isDefined));
  }

  getObserver(name: string): Observable<boolean> {
    return this.stateTrip$.pipe(
      filter(_stateTrip => _stateTrip.name === name),
      map(_stateTrip => _stateTrip.state)
    );
  }

  nextState(name: string, state: boolean): void {
    this._stateTrip$.next({ name, state });
  }
}