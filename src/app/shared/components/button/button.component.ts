import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() text: string = ''; // NEW: Use input instead of ng-content
  @Input() variant: 'black' | 'white' = 'black';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() routerLink?: string;
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() isDisabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() btnClick = new EventEmitter<void>();

  handleClick(): void {
    if (!this.isDisabled && !this.loading) {
      this.btnClick.emit();
    }
  }
}
