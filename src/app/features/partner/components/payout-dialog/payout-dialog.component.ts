import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { BankAccount } from '../../../../core/models/earning.model';

interface PayoutDialogData {
  maxAmount: number;
}

@Component({
  selector: 'app-payout-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './payout-dialog.component.html',
  styleUrl: './payout-dialog.component.scss'
})
export class PayoutDialogComponent {
  amount = signal<number>(0);
  bankAccount = signal<BankAccount>({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: ''
  });

  errors = signal<{ [key: string]: string }>({});
  MIN_PAYOUT = 1050;

  constructor(
    public dialogRef: MatDialogRef<PayoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PayoutDialogData
  ) { }

  setMaxAmount() {
    this.amount.set(this.data.maxAmount);
  }

  validateForm(): boolean {
    const errors: { [key: string]: string } = {};
    const amount = this.amount();
    const bank = this.bankAccount();

    if (!amount || amount <= 0) {
      errors['amount'] = 'Amount is required';
    } else if (amount < this.MIN_PAYOUT) {
      errors['amount'] = `Minimum payout amount is ₹${this.MIN_PAYOUT}`;
    } else if (amount > this.data.maxAmount) {
      errors['amount'] = 'Amount exceeds available balance';
    }

    if (!bank.accountHolder.trim()) {
      errors['accountHolder'] = 'Account holder name is required';
    }

    if (!bank.accountNumber.trim()) {
      errors['accountNumber'] = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(bank.accountNumber)) {
      errors['accountNumber'] = 'Invalid account number';
    }

    if (!bank.ifsc.trim()) {
      errors['ifsc'] = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc.toUpperCase())) {
      errors['ifsc'] = 'Invalid IFSC code';
    }

    if (!bank.bankName.trim()) {
      errors['bankName'] = 'Bank name is required';
    }

    this.errors.set(errors);
    return Object.keys(errors).length === 0;
  }

  onSubmit() {
    if (this.validateForm()) {
      this.dialogRef.close({
        amount: this.amount(),
        bankAccount: {
          ...this.bankAccount(),
          ifsc: this.bankAccount().ifsc.toUpperCase()
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  updateBankField(field: keyof BankAccount, value: string) {
    this.bankAccount.update(bank => ({
      ...bank,
      [field]: value
    }));
  }
}
