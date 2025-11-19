import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { filter, switchMap } from 'rxjs';
import { EarningsService } from '../../../../core/services/earnings.service';
import { UserService } from '../../../../core/services/user.service';
import { Transaction, EarningsSummary, BankAccount } from '../../../../core/models/earning.model';
import { User } from '../../../../core/models/user.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import * as AuthSelectors from '../../../../store/auth/auth.selectors';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './earnings.component.html',
  styleUrl: './earnings.component.scss'
})
export class EarningsComponent implements OnInit {
  private earningsService = inject(EarningsService);
  private userService = inject(UserService);
  private store = inject(Store);

  partnerId = '';
  summary = signal<EarningsSummary | null>(null);
  transactions = signal<Transaction[]>([]);
  selectedTab = signal<'transaction' | 'payout'>('transaction');
  loading = signal(true);
  bankAccount = signal<BankAccount | null>(null);
  editingBankAccount = signal(false);
  payoutAmount = 0;

  bankForm = signal<BankAccount>({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: ''
  });

  ngOnInit() {
    this.store.select(AuthSelectors.selectCurrentUser).pipe(
      filter((user): user is User => !!user && !!user.id),
      switchMap((user) => {
        console.log('👤 Current user from store:', user);
        this.partnerId = user.id;

        // Fetch fresh user data to get latest bank account info
        return this.userService.getUserById(user.id);
      }),
      switchMap((freshUser) => {
        console.log('👤 Fresh user data:', freshUser);
        if (freshUser.bankAccount) {
          console.log('🏦 Bank account found:', freshUser.bankAccount);
          this.bankAccount.set(freshUser.bankAccount);
        } else {
          console.log('⚠️ No bank account found for user');
        }
        return this.earningsService.calculateEarnings(freshUser.id);
      })
    ).subscribe({
      next: (summary) => {
        console.log('💰 Earnings summary:', summary);
        this.summary.set(summary);
        this.loadTransactions();
      },
      error: (err) => {
        console.error('❌ Error loading earnings:', err);
        this.loading.set(false);
      }
    });
  }

  loadTransactions() {
    this.earningsService.getTransactionHistory(this.partnerId).subscribe({
      next: (transactions) => {
        const sorted = transactions.sort((a, b) => b.dateTime - a.dateTime);
        this.transactions.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.loading.set(false);
      }
    });
  }

  get filteredTransactions() {
    const tab = this.selectedTab();
    const all = this.transactions();

    if (tab === 'transaction') {
      return all;
    } else {
      return all.filter(t => t.type === 'payout');
    }
  }

  selectTab(tab: 'transaction' | 'payout') {
    this.selectedTab.set(tab);
  }

  setMaxPayout() {
    this.payoutAmount = this.summary()?.availableBalance || 0;
  }

  requestPayout() {
    const amount = this.payoutAmount;
    const bank = this.bankAccount();
    const balance = this.summary()?.availableBalance || 0;

    if (!bank) {
      alert('Please add bank account details first');
      return;
    }

    if (amount < 1000) {
      alert('Minimum payout amount is ₹1,000');
      return;
    }

    if (amount > balance) {
      alert('Amount exceeds available balance');
      return;
    }

    this.earningsService.requestPayout({
      partnerId: this.partnerId,
      amount,
      bankAccount: bank
    }).subscribe({
      next: () => {
        alert('Payout request submitted successfully');
        this.payoutAmount = 0;
        this.ngOnInit();
      },
      error: (err) => {
        alert(err.message || 'Payout request failed');
      }
    });
  }

  toggleBankEdit() {
    this.editingBankAccount.set(!this.editingBankAccount());
  }

  saveBankAccount() {
    const form = this.bankForm();

    if (!form.accountHolder || !form.accountNumber || !form.ifsc || !form.bankName) {
      alert('All fields are required');
      return;
    }

    this.userService.addBankAccount(this.partnerId, form).subscribe({
      next: () => {
        this.bankAccount.set(form);
        this.editingBankAccount.set(false);
        alert('Bank account updated successfully');
      },
      error: (err) => {
        alert('Failed to update bank account');
      }
    });
  }

  updateBankField(field: keyof BankAccount, value: string) {
    this.bankForm.update(form => ({
      ...form,
      [field]: value
    }));
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getLastPayout(): number {
    const payouts = this.transactions().filter(t => t.type === 'payout');
    return payouts.length > 0 ? payouts[0].amount : 0;
  }

  getPendingPayment(): number {
    return 0;
  }
}
