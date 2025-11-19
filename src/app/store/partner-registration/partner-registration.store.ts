import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PartnerRegistrationState,
  BasicInfoState,
  ServiceDraft
} from './partner-registration.state';

const STORAGE_KEY = 'urbanfix_partner_registration_state';

const INITIAL_STATE: PartnerRegistrationState = {
  currentStep: 1,
  basicInfo: null,
  selectedCategoryIds: [],
  servicesByCategory: {}
};

@Injectable({ providedIn: 'root' })
export class PartnerRegistrationStore {
  private platformId = inject(PLATFORM_ID);
  private _state$ = new BehaviorSubject<PartnerRegistrationState>(
    this.loadInitialState()
  );

  // Public observable for components to subscribe
  readonly state$: Observable<PartnerRegistrationState> =
    this._state$.asObservable();

  get snapshot(): PartnerRegistrationState {
    return this._state$.value;
  }

  setStep(step: number): void {
    const clamped = Math.max(1, Math.min(3, step));
    this.patchState({ currentStep: clamped });
  }

  nextStep(): void {
    this.setStep(this.snapshot.currentStep + 1);
  }

  prevStep(): void {
    this.setStep(this.snapshot.currentStep - 1);
  }

  setBasicInfo(info: BasicInfoState): void {
    this.patchState({ basicInfo: { ...info } });
  }

  setSelectedCategories(categoryIds: string[]): void {
    const unique = Array.from(new Set(categoryIds));
    const updatedServices = { ...this.snapshot.servicesByCategory };

    unique.forEach((cid) => {
      if (!updatedServices[cid]) updatedServices[cid] = [];
    });

    this.patchState({
      selectedCategoryIds: unique,
      servicesByCategory: updatedServices
    });
  }

  addServiceDraft(categoryId: string, draft: ServiceDraft): void {
    const services = { ...this.snapshot.servicesByCategory };
    const list = services[categoryId] ? [...services[categoryId]] : [];
    list.push({ ...draft });
    services[categoryId] = list;
    this.patchState({ servicesByCategory: services });
  }

  removeServiceDraft(categoryId: string, index: number): void {
    const services = { ...this.snapshot.servicesByCategory };
    const list = services[categoryId] ? [...services[categoryId]] : [];
    if (index >= 0 && index < list.length) {
      list.splice(index, 1);
      services[categoryId] = list;
      this.patchState({ servicesByCategory: services });
    }
  }

  canProceedFromStep1(): boolean {
    return !!this.snapshot.basicInfo;
  }

  canProceedFromStep2(): boolean {
    return this.snapshot.selectedCategoryIds.length > 0;
  }

  canProceedFromStep3(): boolean {
    const selected = this.snapshot.selectedCategoryIds;
    const services = this.snapshot.servicesByCategory;
    return selected.every(
      (cid) => Array.isArray(services[cid]) && services[cid].length > 0
    );
  }

  reset(): void {
    this.setState(INITIAL_STATE);
    this.clearStorage();
  }

  private patchState(patch: Partial<PartnerRegistrationState>): void {
    const next = { ...this.snapshot, ...patch };
    this.setState(next);
    this.persistState(next);
  }

  private setState(next: PartnerRegistrationState): void {
    this._state$.next(next);
  }

  private loadInitialState(): PartnerRegistrationState {
    if (!isPlatformBrowser(this.platformId)) return INITIAL_STATE;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return INITIAL_STATE;
      return JSON.parse(raw) as PartnerRegistrationState;
    } catch {
      return INITIAL_STATE;
    }
  }

  private persistState(state: PartnerRegistrationState): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  private clearStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}
