// src/app/store/services/services.actions.ts

import { createAction, props } from '@ngrx/store';
import {
  ServiceEntity,
  ServiceCreateDTO,
  ServiceUpdateDTO,
  ServiceFilter
} from '../../core/models/service.model';

// ============= LOAD ALL SERVICES =============
export const loadServices = createAction('[Services] Load Services');

export const loadServicesSuccess = createAction(
  '[Services] Load Services Success',
  props<{ services: ServiceEntity[] }>()
);

export const loadServicesFailure = createAction(
  '[Services] Load Services Failure',
  props<{ error: string }>()
);

// ============= LOAD SERVICE BY ID =============
export const loadServiceById = createAction(
  '[Services] Load Service By ID',
  props<{ id: string }>()
);

export const loadServiceByIdSuccess = createAction(
  '[Services] Load Service By ID Success',
  props<{ service: ServiceEntity }>()
);

export const loadServiceByIdFailure = createAction(
  '[Services] Load Service By ID Failure',
  props<{ error: string }>()
);

// ============= LOAD SERVICES BY CATEGORY =============
export const loadServicesByCategory = createAction(
  '[Services] Load Services By Category',
  props<{ categoryId: string }>()
);

export const loadServicesByCategorySuccess = createAction(
  '[Services] Load Services By Category Success',
  props<{ services: ServiceEntity[] }>()
);

export const loadServicesByCategoryFailure = createAction(
  '[Services] Load Services By Category Failure',
  props<{ error: string }>()
);

// ============= LOAD SERVICES BY PARTNER =============
export const loadServicesByPartner = createAction(
  '[Services] Load Services By Partner',
  props<{ partnerId: string }>()
);

export const loadServicesByPartnerSuccess = createAction(
  '[Services] Load Services By Partner Success',
  props<{ services: ServiceEntity[] }>()
);

export const loadServicesByPartnerFailure = createAction(
  '[Services] Load Services By Partner Failure',
  props<{ error: string }>()
);

// ============= CREATE SERVICE =============
export const createService = createAction(
  '[Services] Create Service',
  props<{ service: ServiceCreateDTO }>()
);

export const createServiceSuccess = createAction(
  '[Services] Create Service Success',
  props<{ service: ServiceEntity }>()
);

export const createServiceFailure = createAction(
  '[Services] Create Service Failure',
  props<{ error: string }>()
);

// ============= UPDATE SERVICE =============
export const updateService = createAction(
  '[Services] Update Service',
  props<{ id: string; updates: ServiceUpdateDTO }>()
);

export const updateServiceSuccess = createAction(
  '[Services] Update Service Success',
  props<{ service: ServiceEntity }>()
);

export const updateServiceFailure = createAction(
  '[Services] Update Service Failure',
  props<{ error: string }>()
);

// ============= TOGGLE SERVICE ACTIVE =============
export const toggleServiceActive = createAction(
  '[Services] Toggle Service Active',
  props<{ id: string; active: boolean }>()
);

export const toggleServiceActiveSuccess = createAction(
  '[Services] Toggle Service Active Success',
  props<{ service: ServiceEntity }>()
);

export const toggleServiceActiveFailure = createAction(
  '[Services] Toggle Service Active Failure',
  props<{ error: string }>()
);

// ============= DELETE SERVICE =============
export const deleteService = createAction(
  '[Services] Delete Service',
  props<{ id: string }>()
);

export const deleteServiceSuccess = createAction(
  '[Services] Delete Service Success',
  props<{ id: string }>()
);

export const deleteServiceFailure = createAction(
  '[Services] Delete Service Failure',
  props<{ error: string }>()
);

// ============= SEARCH & FILTER =============
export const searchServices = createAction(
  '[Services] Search Services',
  props<{ query: string }>()
);

export const searchServicesSuccess = createAction(
  '[Services] Search Services Success',
  props<{ services: ServiceEntity[] }>()
);

export const searchServicesFailure = createAction(
  '[Services] Search Services Failure',
  props<{ error: string }>()
);

export const filterServices = createAction(
  '[Services] Filter Services',
  props<{ filters: ServiceFilter }>()
);

export const filterServicesSuccess = createAction(
  '[Services] Filter Services Success',
  props<{ services: ServiceEntity[] }>()
);

export const filterServicesFailure = createAction(
  '[Services] Filter Services Failure',
  props<{ error: string }>()
);

// ============= ADD RATING =============
export const addRatingToService = createAction(
  '[Services] Add Rating',
  props<{
    serviceId: string;
    rating: { userId: string; rating: number; comment: string };
  }>()
);

export const addRatingToServiceSuccess = createAction(
  '[Services] Add Rating Success',
  props<{ service: ServiceEntity }>()
);

export const addRatingToServiceFailure = createAction(
  '[Services] Add Rating Failure',
  props<{ error: string }>()
);

// ============= UI STATE =============
export const setSelectedService = createAction(
  '[Services] Set Selected Service',
  props<{ id: string | null }>()
);

export const clearServicesError = createAction('[Services] Clear Error');

export const resetServicesState = createAction('[Services] Reset State');
