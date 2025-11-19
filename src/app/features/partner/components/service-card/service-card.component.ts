// src/app/features/partner/components/service-card/service-card.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceEntity } from '../../../../core/models/service.model';
import { MatIconModule } from '@angular/material/icon';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, ToggleComponent],
  templateUrl: './service-card.component.html',
  styleUrls: ['./service-card.component.scss']
})
export class ServiceCardComponent {
  @Input() service!: ServiceEntity;
  @Output() toggleActive = new EventEmitter<string>();
  @Output() edit = new EventEmitter<ServiceEntity>();
  @Output() delete = new EventEmitter<string>();

  onToggleActive(): void {
    this.toggleActive.emit(this.service.id);
  }

  onEdit(): void {
    this.edit.emit(this.service);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete "${this.service.title}"?`)) {
      this.delete.emit(this.service.id);
    }
  }

  getDurationText(): string {
    return this.service.priceType === 'hourly'
      ? `${this.service.duration} mins`
      : `${this.service.duration} days`;
  }

  getCategoryName(): string {
    // You can map categoryId to name here or pass it as input
    return 'Cleaning'; // Placeholder
  }

  getFinalPrice(): number {
    if (this.service.hasOffer && this.service.offerDiscount > 0) {
      const discount = this.service.price * (this.service.offerDiscount / 100);
      return Math.round(this.service.price - discount);
    }
    return this.service.price;
  }
}
