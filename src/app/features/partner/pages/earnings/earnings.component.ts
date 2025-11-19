import { Component, OnInit, inject } from '@angular/core';
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
  summary: EarningsSummary | null = null;
  transactions: Transaction[] = [];
  selectedTab: 'transaction' | 'payout' = 'transaction';
  loading = true;
  bankAccount: BankAccount | null = null;
  editingBankAccount = false;
  payoutAmount = 0;

  bankForm: BankAccount = {
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: ''
  };

  ngOnInit() {
    this.store.select(AuthSelectors.selectCurrentUser).pipe(
      filter((user): user is User => !!user && !!user.id),
      switchMap((user) => {
        console.log('👤 Current user from store:', user);
        this.partnerId = user.id;
        return this.userService.getUserById(user.id);
      }),
      switchMap((freshUser) => {
        console.log('👤 Fresh user data:', freshUser);
        if (freshUser.bankAccount) {
          console.log('🏦 Bank account found:', freshUser.bankAccount);
          this.bankAccount = freshUser.bankAccount;
        } else {
          console.log('⚠️ No bank account found for user');
        }
        return this.earningsService.calculateEarnings(freshUser.id);
      })
    ).subscribe({
      next: (summary) => {
        console.log('💰 Earnings summary:', summary);
        this.summary = summary;
        this.loadTransactions();
      },
      error: (err) => {
        console.error('❌ Error loading earnings:', err);
        this.loading = false;
      }
    });
  }

  loadTransactions() {
    this.earningsService.getTransactionHistory(this.partnerId).subscribe({
      next: (transactions) => {
        this.transactions = transactions.sort((a, b) => b.dateTime - a.dateTime);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.loading = false;
      }
    });
  }

  get filteredTransactions() {
    if (this.selectedTab === 'transaction') {
      return this.transactions;
    } else {
      return this.transactions.filter(t => t.type === 'payout');
    }
  }

  selectTab(tab: 'transaction' | 'payout') {
    this.selectedTab = tab;
  }

  setMaxPayout() {
    this.payoutAmount = this.summary?.availableBalance || 0;
  }

  requestPayout() {
    const amount = this.payoutAmount;
    const bank = this.bankAccount;
    const balance = this.summary?.availableBalance || 0;

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
    this.editingBankAccount = !this.editingBankAccount;
  }

  saveBankAccount() {
    if (!this.bankForm.accountHolder || !this.bankForm.accountNumber || !this.bankForm.ifsc || !this.bankForm.bankName) {
      alert('All fields are required');
      return;
    }

    this.userService.addBankAccount(this.partnerId, this.bankForm).subscribe({
      next: () => {
        this.bankAccount = { ...this.bankForm };
        this.editingBankAccount = false;
        alert('Bank account updated successfully');
      },
      error: (err) => {
        alert('Failed to update bank account');
      }
    });
  }

  updateBankField(field: keyof BankAccount, value: string) {
    this.bankForm = {
      ...this.bankForm,
      [field]: value
    };
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getLastPayout(): number {
    const payouts = this.transactions.filter((t: Transaction) => t.type === 'payout');
    return payouts.length > 0 ? payouts[0].amount : 0;
  }

  getPendingPayment(): number {
    return 0;
  }
}
