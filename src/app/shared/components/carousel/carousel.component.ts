import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnInit, OnDestroy {
  @Input() images: string[] = [];
  @Input() overlayType: 'statistics' | 'testimonials' = 'statistics';
  @Input() statistics?: Array<{ icon: string; label: string; value: string }>;
  @Input() testimonials?: Array<{
    text: string;
    author: string;
    rating: number;
  }>;
  @Input() showSearchBar: boolean = false;
  @Input() buttons?: Array<{ text: string; routerLink: string }>;
  @Input() autoScroll: boolean = false;
  @Input() interval: number = 3000;

  currentIndex: number = 0;
  autoScrollSubscription?: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && this.autoScroll) {
      this.autoScrollSubscription = interval(this.interval).subscribe(() => {
        this.nextImage();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.autoScrollSubscription) {
      this.autoScrollSubscription.unsubscribe();
    }
  }

  nextImage(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  previousImage(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  navigateTo(index: number): void {
    this.currentIndex = index;
  }
}
