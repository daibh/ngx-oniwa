import { Injectable } from '@angular/core';
import { IPdfEvent, PdfEvent } from '../models/event.model';
import { BehaviorSubject, Observable, OperatorFunction, filter, map, share } from 'rxjs';
import { isDefined } from '@daibh/cdk/operators';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly _eventsSubject$ = new BehaviorSubject<IPdfEvent | undefined>(undefined);
  private _events$: Observable<IPdfEvent>;

  get events$(): Observable<IPdfEvent> {
    return this._events$;
  }

  constructor() {
    this._events$ = this._eventsSubject$.asObservable().pipe(
      // filter to exclude undefined or null values from observable
      filter(event => isDefined(event)) as OperatorFunction<IPdfEvent | undefined, IPdfEvent>,
      // share observe to multiple observable
      share()
    );
  }

  /**
   * listen event by name
   * @param eventName name of event
   * @returns observe of event
   */
  observe<T>(eventName: PdfEvent): Observable<T> {
    return this.events$.pipe(
      // filter all sequense value has name matching with input eventName
      filter(({ name }) => name === eventName),
      // return details of event
      map(({ details }) => details as T)
    );
  }

  /**
   * dispatch a pdf event
   * @param event IPdfEvent
   */
  dispatch(event: IPdfEvent): void {
    this._eventsSubject$.next(event);
  }
}
