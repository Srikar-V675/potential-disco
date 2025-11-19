// src/app/store/services/services.effects.ts

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ServicesService } from '../../core/services/services.service';
import * as ServicesActions from './services.actions';

@Injectable()
export class ServicesEffects {
  private actions$ = inject(Actions);
  private servicesService = inject(ServicesService);

  // ============= LOAD ALL SERVICES =============
  loadServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.loadServices),
      switchMap(() =>
        this.servicesService.getAllServices().pipe(
          map((services) => ServicesActions.loadServicesSuccess({ services })),
          catchError((error) =>
            of(ServicesActions.loadServicesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ============= LOAD SERVICE BY ID =============
  loadServiceById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.loadServiceById),
      switchMap(({ id }) =>
        this.servicesService.getServiceById(id).pipe(
          map((service) => ServicesActions.loadServiceByIdSuccess({ service })),
          catchError((error) =>
            of(ServicesActions.loadServiceByIdFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ============= LOAD SERVICES BY CATEGORY =============
  loadServicesByCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.loadServicesByCategory),
      switchMap(({ categoryId }) =>
        this.servicesService.getServicesByCategory(categoryId).pipe(
          map((services) =>
            ServicesActions.loadServicesByCategorySuccess({ services })
          ),
          catchError((error) =>
            of(
              ServicesActions.loadServicesByCategoryFailure({
                error: error.message
              })
            )
          )
        )
      )
    )
  );

  // ============= LOAD SERVICES BY PARTNER =============
  loadServicesByPartner$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.loadServicesByPartner),
      switchMap(({ partnerId }) =>
        this.servicesService.getServicesByPartnerId(partnerId).pipe(
          map((services) =>
            ServicesActions.loadServicesByPartnerSuccess({ services })
          ),
          catchError((error) =>
            of(
              ServicesActions.loadServicesByPartnerFailure({
                error: error.message
              })
            )
          )
        )
      )
    )
  );

  // ============= CREATE SERVICE =============
  createService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.createService),
      switchMap(({ service }) =>
        this.servicesService.createService(service).pipe(
          map((createdService) =>
            ServicesActions.createServiceSuccess({ service: createdService })
          ),
          catchError((error) =>
            of(ServicesActions.createServiceFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ============= UPDATE SERVICE =============
  updateService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.updateService),
      switchMap(({ id, updates }) =>
        this.servicesService.updateService(id, updates).pipe(
          map((service) => ServicesActions.updateServiceSuccess({ service })),
          catchError((error) =>
            of(ServicesActions.updateServiceFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ============= TOGGLE ACTIVE =============
  toggleServiceActive$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.toggleServiceActive),
      switchMap(({ id, active }) =>
        this.servicesService.toggleServiceActive(id, active).pipe(
          map((service) =>
            ServicesActions.toggleServiceActiveSuccess({ service })
          ),
          catchError((error) =>
            of(
              ServicesActions.toggleServiceActiveFailure({
                error: error.message
              })
            )
          )
        )
      )
    )
  );

  // ============= DELETE SERVICE =============
  deleteService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.deleteService),
      switchMap(({ id }) =>
        this.servicesService.deleteService(id).pipe(
          map(() => ServicesActions.deleteServiceSuccess({ id })),
          catchError((error) =>
            of(ServicesActions.deleteServiceFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ============= SEARCH =============
  searchServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.searchServices),
      switchMap(({ query }) =>
        this.servicesService.searchServices(query).pipe(
          map((services) =>
            ServicesActions.searchServicesSuccess({ services })
          ),
          catchError((error) =>
            of(ServicesActions.searchServicesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ============= FILTER =============
  filterServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.filterServices),
      switchMap(({ filters }) =>
        this.servicesService.filterServices(filters).pipe(
          map((services) =>
            ServicesActions.filterServicesSuccess({ services })
          ),
          catchError((error) =>
            of(ServicesActions.filterServicesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ============= ADD RATING =============
  addRating$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.addRatingToService),
      switchMap(({ serviceId, rating }) =>
        this.servicesService.addRatingToService(serviceId, rating).pipe(
          map((service) =>
            ServicesActions.addRatingToServiceSuccess({ service })
          ),
          catchError((error) =>
            of(
              ServicesActions.addRatingToServiceFailure({
                error: error.message
              })
            )
          )
        )
      )
    )
  );
}
