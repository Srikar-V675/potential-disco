// src/app/features/partner/components/getting-started/getting-started.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GuidStep {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-getting-started',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './getting-started.component.html',
  styleUrls: ['./getting-started.component.scss']
})
export class GettingStartedComponent {
  steps: GuidStep[] = [
    {
      title: 'Complete Your Profile',
      description:
        'Add your details, expertise, and service areas to build trust with customers.',
      icon: '✏️'
    },
    {
      title: 'List Your Services',
      description:
        'Add at least 3-5 services with competitive pricing and clear descriptions.',
      icon: '📋'
    },
    {
      title: 'Upload Portfolio',
      description:
        'Showcase your best work with high-quality before/after photos.',
      icon: '📸'
    },
    {
      title: 'Set Your Availability',
      description:
        'Configure your working hours and service areas to match your schedule.',
      icon: '⏰'
    }
  ];
}
