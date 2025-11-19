import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SearchResult {
  id: string;
  title: string;
  price: number;
  hasOffer: boolean;
  offerDiscount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchResultsSubject = new BehaviorSubject<SearchResult[]>([]);
  private showResultsSubject = new BehaviorSubject<boolean>(false);

  searchQuery$ = this.searchQuerySubject.asObservable();
  searchResults$ = this.searchResultsSubject.asObservable();
  showResults$ = this.showResultsSubject.asObservable();

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  setSearchResults(results: SearchResult[]) {
    this.searchResultsSubject.next(results);
  }

  setShowResults(show: boolean) {
    this.showResultsSubject.next(show);
  }

  clearSearch() {
    this.searchQuerySubject.next('');
    this.searchResultsSubject.next([]);
    this.showResultsSubject.next(false);
  }

  getSearchQuery(): string {
    return this.searchQuerySubject.value;
  }
}
