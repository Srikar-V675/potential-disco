// src/app/features/partner/components/service-form-dialog/service-form-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  ServiceFormComponent,
  ServiceFormValue
} from '../service-form/service-form.component';
import { ServiceEntity } from '../../../../core/models/service.model';

interface DialogData {
  mode: 'create' | 'edit';
  service?: ServiceEntity;
  partnerId: string;
}

@Component({
  selector: 'app-service-form-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, ServiceFormComponent],
  templateUrl: './service-form-dialog.component.html',
  styleUrls: ['./service-form-dialog.component.scss']
})
export class ServiceFormDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ServiceFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Service' : 'Add New Service';
  }

  get dialogSubtitle(): string {
    return this.isEditMode ? 'Update your service details' : 'Add a new service to your offerings';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Service' : 'Add Service';
  }

  get initialFormValue(): Partial<ServiceFormValue> | null {
    if (!this.isEditMode || !this.data.service) {
      return null;
    }

    return {
      title: this.data.service.title,
      description: '', // You might want to add description to ServiceEntity
      priceType: this.data.service.priceType,
      price: this.data.service.price,
      duration: this.data.service.duration,
      hasOffer: this.data.service.hasOffer,
      offerTitle: this.data.service.offerTitle,
      offerDiscount: this.data.service.offerDiscount
    };
  }

  handleSave(formValue: ServiceFormValue): void {
    this.dialogRef.close(formValue);
  }

  handleCancel(): void {
    this.dialogRef.close();
  }
}
