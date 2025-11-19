import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MatIconModule } from '@angular/material/icon';

export type PriceType = 'hourly' | 'daily';

export interface ServiceFormValue {
  title: string;
  description: string;
  priceType: PriceType;
  price: number;
  duration: number;
  hasOffer: boolean;
  offerTitle: string;
  offerDiscount: number;
}

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToggleComponent,
    ButtonComponent,
    MatIconModule
  ],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent implements OnInit, OnChanges {
  @Input() initialValue?: Partial<ServiceFormValue> | null;
  @Input() submitText = 'Add Service';
  @Input() disabled = false;

  @Input() categoryName?: string;

  @Output() save = new EventEmitter<ServiceFormValue>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    if (this.initialValue) {
      this.patchInitial(this.initialValue);
    }
    this.handleOfferToggleLinkage();
    if (this.disabled) {
      this.form.disable({ emitEvent: false });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && !changes['initialValue'].firstChange) {
      this.patchInitial(changes['initialValue'].currentValue);
    }
    if (changes['disabled'] && this.form) {
      if (this.disabled) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100)
        ]
      ],
      description: ['', [Validators.required, this.singleLineValidator]],
      priceType: ['hourly' as PriceType, [Validators.required]],
      price: [
        null,
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          this.positiveNumberValidator
        ]
      ],
      duration: [
        null,
        [
          Validators.required,
          Validators.pattern(/^\d+$/),
          this.positiveNumberValidator
        ]
      ],
      hasOffer: [false],
      offerTitle: [''],
      offerDiscount: [null]
    });
  }

  private patchInitial(v?: Partial<ServiceFormValue> | null): void {
    if (!v) return;
    this.form.patchValue(
      {
        title: v.title ?? '',
        description: v.description ?? '',
        priceType: (v.priceType as PriceType) ?? 'hourly',
        price: v.price ?? null,
        duration: v.duration ?? null,
        hasOffer: v.hasOffer ?? false,
        offerTitle: v.offerTitle ?? '',
        offerDiscount: v.offerDiscount ?? null
      },
      { emitEvent: false }
    );
    this.syncOfferValidators();
  }

  private handleOfferToggleLinkage(): void {
    this.form
      .get('hasOffer')!
      .valueChanges.subscribe(() => this.syncOfferValidators());
  }

  private syncOfferValidators(): void {
    const hasOffer = !!this.form.get('hasOffer')!.value;
    const offerTitle = this.form.get('offerTitle')!;
    const offerDiscount = this.form.get('offerDiscount')!;
    if (hasOffer) {
      offerTitle.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]);
      offerDiscount.setValidators([
        Validators.required,
        Validators.pattern(/^\d+$/),
        this.discountRangeValidator
      ]);
    } else {
      offerTitle.clearValidators();
      offerDiscount.clearValidators();
      offerTitle.setValue('', { emitEvent: false });
      offerDiscount.setValue(null, { emitEvent: false });
    }
    offerTitle.updateValueAndValidity({ emitEvent: false });
    offerDiscount.updateValueAndValidity({ emitEvent: false });
  }

  private singleLineValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = control.value;
    if (value == null || value === '') return null;
    return typeof value === 'string' && !/[\r\n]/.test(value)
      ? null
      : { singleLine: true };
  }

  private positiveNumberValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = control.value;
    if (value == null || value === '') return null;
    const num = Number(value);
    return !isNaN(num) && num > 0 ? null : { positive: true };
  }

  private discountRangeValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = control.value;
    if (value == null || value === '') return null;
    const num = Number(value);
    return Number.isInteger(num) && num >= 0 && num <= 100
      ? null
      : { discountRange: true };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue() as ServiceFormValue;
    this.save.emit(value);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get f() {
    return this.form.controls;
  }
}
