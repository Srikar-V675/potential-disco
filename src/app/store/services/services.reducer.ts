// src/app/store/services/services.reducer.ts (SIMPLE VERSION)

import { createReducer, on } from '@ngrx/store';
import { ServiceEntity } from '../../core/models/service.model';
import * as ServicesActions from './services.actions';

export interface ServicesState {
  services: ServiceEntity[];
  selectedServiceId: string | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

export const initialServicesState: ServicesState = {
  services: [],
  selectedServiceId: null,
  loaded: false,
  loading: false,
  error: null
};

export const servicesReducer = createReducer(
  initialServicesState,

  // Load all services
  on(ServicesActions.loadServices, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(ServicesActions.loadServicesSuccess, (state, { services }) => ({
    ...state,
    services,
    loaded: true,
    loading: false,
    error: null
  })),

  on(ServicesActions.loadServicesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create service
  on(ServicesActions.createServiceSuccess, (state, { service }) => ({
    ...state,
    services: [...state.services, service],
    loading: false,
    error: null
  })),

  // Update service
  on(ServicesActions.updateServiceSuccess, (state, { service }) => ({
    ...state,
    services: state.services.map((s) => (s.id === service.id ? service : s)),
    loading: false,
    error: null
  })),

  // Delete service
  on(ServicesActions.deleteServiceSuccess, (state, { id }) => ({
    ...state,
    services: state.services.filter((s) => s.id !== id),
    selectedServiceId:
      state.selectedServiceId === id ? null : state.selectedServiceId,
    loading: false,
    error: null
  })),

  // Set selected
  on(ServicesActions.setSelectedService, (state, { id }) => ({
    ...state,
    selectedServiceId: id
  })),

  // Clear error
  on(ServicesActions.clearServicesError, (state) => ({
    ...state,
    error: null
  })),

  // Reset
  on(ServicesActions.resetServicesState, () => initialServicesState)
);
