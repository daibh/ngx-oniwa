import { animate, style, transition, trigger, query, group } from '@angular/animations';

export const animationTrigger = trigger('activatedIndex', [
  transition(':increment', [
    query(':enter, :leave', style({}), { optional: true }),
    group([
      query(':enter',
        [
          style({ transform: 'translateX(100%)' }),
          animate('.5s ease-out', style({ transform: 'translateX(0%)' }))
        ],
        {
          optional: true,
        }
      ),
      query(':leave',
        [
          style({ transform: 'translateX(0%)' }),
          animate('.5s ease-out', style({ transform: 'translateX(-100%)' }))
        ],
        {
          optional: true,
        }
      ),
    ]),
  ]),
  transition(':decrement', [
    query(':enter, :leave', style({}), { optional: true }),
    group([
      query(':enter',
        [
          style({ transform: 'translateX(-100%)' }),
          animate('.5s ease-out', style({ transform: 'translateX(0%)' }))
        ],
        {
          optional: true,
        }
      ),
      query(':leave',
        [
          style({ transform: 'translateX(0%)' }),
          animate('.5s ease-out', style({ transform: 'translateX(100%)' }))
        ],
        {
          optional: true,
        }
      ),
    ]),
  ]),
]);