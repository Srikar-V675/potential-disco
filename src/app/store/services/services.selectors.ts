// src/app/store/services/services.selectors.ts (SIMPLE VERSION)

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ServicesState } from './services.reducer';

export const selectServicesState =
  createFeatureSelector<ServicesState>('services');

export const selectAllServices = createSelector(
  selectServicesState,
  (state) => state.services
);

export const selectServicesLoading = createSelector(
  selectServicesState,
  (state) => state.loading
);

export const selectServicesError = createSelector(
  selectServicesState,
  (state) => state.error
);

export const selectSelectedServiceId = createSelector(
  selectServicesState,
  (state) => state.selectedServiceId
);

export const selectSelectedService = createSelector(
  selectAllServices,
  selectSelectedServiceId,
  (services, id) => services.find((s) => s.id === id) || null
);

export const selectServiceById = (id: string) =>
  createSelector(selectAllServices, (services) =>
    services.find((s) => s.id === id)
  );

export const selectActiveServices = createSelector(
  selectAllServices,
  (services) => services.filter((s) => s.active)
);

export const selectServicesByPartner = (partnerId: string) =>
  createSelector(selectAllServices, (services) =>
    services.filter((s) => s.partnerId === partnerId)
  );
